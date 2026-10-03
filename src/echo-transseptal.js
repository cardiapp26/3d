// Schematic transseptal sequence on the ICE septal short-axis view
// (research/ICE_INCELEME_RAPORU.md, finding 3.4): find the septum, needle
// approach from the right atrium, contact and tenting toward the left
// atrium, crossing. Geometry is built on the measured fossa ovalis (centre
// and septal normal, oriented toward the LA); the needle, the tent and the
// crossing are drawn shapes, not a simulation of contact, tissue resistance
// or a safe puncture. The same world points feed the 3D scene and the 2D
// section (projected onto the image plane).

export const TRANSSEPTAL_STAGES = Object.freeze(['target', 'approach', 'tenting', 'crossing']);
// Needle tip along the septal normal from the fossa centre (atlas units; - RA side, + LA side).
const TIP_DEPTH = Object.freeze({ target: null, approach: -0.25, tenting: 0.1, crossing: 0.4 });
const NEEDLE_FROM = [-0.9, -0.5];   // needle shaft points on the RA side
const TENT = { half: 0.25, shoulder: 0.1, rise: 0.04, peak: 0.12 };   // schematic tent outline across the septum

const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };

/**
 * World points of one stage.
 * @param {{ fossa?: { center: number[], normal: number[] }, la: number[] }} anatomy
 * @param {string} stage one of TRANSSEPTAL_STAGES
 * @param {number[]} [planeNormal] image-plane normal: the tent is drawn across the septum in the plane
 * @returns {{ needle: number[][]|null, tent: number[][]|null, tip: number[]|null, toLa: number[] }|null}
 */
export function transseptalGeometry(anatomy, stage, planeNormal = [0, 0, 1]) {
  const f = anatomy?.fossa;
  if (!f || !TRANSSEPTAL_STAGES.includes(stage)) return null;
  const c = f.center;
  // The septal normal, turned toward the left atrium.
  const toLa = unit(dot(sub(anatomy.la, c), f.normal) >= 0 ? f.normal : f.normal.map((x) => -x));
  // Across the septum within the image plane (for the tent outline).
  const along = unit([toLa[1] * planeNormal[2] - toLa[2] * planeNormal[1], toLa[2] * planeNormal[0] - toLa[0] * planeNormal[2], toLa[0] * planeNormal[1] - toLa[1] * planeNormal[0]]);
  const tipDepth = TIP_DEPTH[stage];
  if (tipDepth == null) return { needle: null, tent: null, tip: null, toLa };
  const tip = add(c, toLa, tipDepth);
  const needle = [add(c, toLa, NEEDLE_FROM[0]), add(c, toLa, NEEDLE_FROM[1]), tip];
  const tent = stage === 'tenting'
    ? [add(c, along, -TENT.half), add(add(c, along, -TENT.shoulder), toLa, TENT.rise), add(c, toLa, TENT.peak), add(add(c, along, TENT.shoulder), toLa, TENT.rise), add(c, along, TENT.half)]
    : null;
  return { needle, tent, tip, toLa };
}

export const TRANSSEPTAL_TEXT = Object.freeze({
  tr: {
    title: 'Transseptal ponksiyon: şematik aşamalar', close: 'Kapat', open: 'Transseptal aşamaları göster',
    stages: { target: '1 · Hedef', approach: '2 · Yaklaşım', tenting: '3 · Temas ve çadırlanma', crossing: '4 · Geçiş' },
    text: {
      target: 'Septal kısa eksende RA yakın alanda, LA uzak alanda; aradaki interatriyal septumda fossa ovalis (beyaz işaret). Aort kökü septumun önünde: ponksiyon noktası aorttan uzak seçilir.',
      approach: 'İğne ve dilatatör RA tarafından fossaya yaklaşır (sarı şematik çizgi). Uç kesitte ve fossanın üzerinde görünmelidir; görünmüyorsa düzlemi uca göre ayarlayın.',
      tenting: 'Temas: septum LA\'ya doğru çadır yapar (turuncu şematik çizgi). Ponksiyondan önce en belirgin çadırlanma noktası net görülmelidir.',
      crossing: 'Geçiş: uç LA\'da (şematik). Kılıfın LA\'da olduğu serum, kontrast veya renkli akımla doğrulanır.'
    },
    limits: 'Şematik gösterim: iğne, çadır ve geçiş çizilmiş şekillerdir; gerçek temas, doku direnci veya güvenli ponksiyon kanıtı değildir.',
    unavailable: 'Fossa ovalis bu atlasta ölçülemedi: aşamalar gösterilemiyor.'
  },
  en: {
    title: 'Transseptal puncture: schematic stages', close: 'Close', open: 'Show the transseptal stages',
    stages: { target: '1 · Target', approach: '2 · Approach', tenting: '3 · Contact and tenting', crossing: '4 · Crossing' },
    text: {
      target: 'In the septal short axis the RA is near field, the LA far field; on the interatrial septum between them the fossa ovalis (white mark). The aortic root lies in front of the septum: the puncture site is chosen away from the aorta.',
      approach: 'The needle and dilator approach the fossa from the RA (yellow schematic line). The tip should be in the cut and on the fossa; if not, adjust the plane to the tip.',
      tenting: 'Contact: the septum tents toward the LA (orange schematic line). See the point of maximal tenting clearly before the puncture.',
      crossing: 'Crossing: the tip is in the LA (schematic). Confirm the sheath in the LA with saline, contrast or colour flow.'
    },
    limits: 'Schematic display: needle, tent and crossing are drawn shapes; not real contact, tissue resistance or evidence of a safe puncture.',
    unavailable: 'The fossa ovalis could not be measured on this atlas: the stages cannot be shown.'
  }
});
