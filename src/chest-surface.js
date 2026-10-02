// Shared anterior chest-wall reference for the auscultation areas: the
// sternal midline, the two sternal borders, the left midclavicular line and
// the intercostal spaces, all on one plane in front of the heart. The atlas
// has no ribs or sternum, so the frame is a fixed, calibrated schematic in
// model units (about 3.7 cm per unit), not segmented anatomy:
//   - midline: the vertebral column axis of the thoracic scenery (thorax.js);
//   - levels: the classic surface projection puts the pulmonary valve behind
//     the left 3rd costal cartilage, so the 3rd cartilage is set at the
//     atlas pulmonary valve height and the spaces follow at a fixed pitch;
//   - lines: sternal border about 1.9 cm, left midclavicular line about
//     8 cm from the midline.
// Every area is a (side, line, intercostal space) address on this frame, so
// left and right, the levels and the lines are consistent between areas.

export const CHEST = Object.freeze({
  midlineX: -0.25,       // sternal midline
  sternalEdge: 0.5,      // midline to either sternal border (~1.9 cm)
  mclOffset: 2.15,       // midline to the left midclavicular line (~8 cm)
  costal3Y: 0.81,        // left 3rd costal cartilage (pulmonary valve height)
  pitch: 0.7,            // one rib plus intercostal space (~2.6 cm)
  chestOffset: 0.3       // chest plane in front of the most anterior heart point
});

/** Height of the middle of intercostal space n (2nd ICS lies between ribs 2 and 3). */
export function icsY(n, frame = CHEST) {
  return frame.costal3Y + frame.pitch / 2 - (n - 2) * frame.pitch;
}

/** x of a vertical line: 'midline', 'sternal' (border) or 'mcl', on the patient's 'left' or 'right' (+x is patient left). */
export function lineX(side, line, frame = CHEST) {
  const sign = side === 'right' ? -1 : 1;
  if (line === 'midline') return frame.midlineX;
  if (line === 'mcl') return frame.midlineX + sign * frame.mclOffset;
  return frame.midlineX + sign * frame.sternalEdge;
}

/** Surface addresses of the five classic areas (ics may be fractional: 4.5 = across the 4th-5th spaces). */
export const AREA_ADDRESS = Object.freeze({
  aortic: { side: 'right', line: 'sternal', ics: 2 },
  pulmonic: { side: 'left', line: 'sternal', ics: 2 },
  erb: { side: 'left', line: 'sternal', ics: 3 },
  tricuspid: { side: 'left', line: 'sternal', ics: 4.5 },
  mitral: { side: 'left', line: 'mcl', ics: 5 }
});

/** {x, y, z} of every area on the chest plane at depth z. */
export function areaPoints(z, frame = CHEST) {
  return Object.fromEntries(Object.entries(AREA_ADDRESS).map(([id, a]) => [id, { x: lineX(a.side, a.line, frame), y: icsY(a.ics, frame), z }]));
}
