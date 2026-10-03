import { imageFrame, cross, normalize } from './echo-section.js';
import { createProbePath, tteFrame, surfaceHit, rotate } from './echo-probe.js';

/*
 * The starting view sets of the echo module (report sections 4 and 5): 8 TTE
 * views (PLAX, 3 PSAX levels, 3 apical, subcostal four-chamber; ASE 2019)
 * and 10 TEE views (9 mid-oesophageal, transgastric mid SAX; ASE/SCA
 * 2013). The selection is the product's teaching subset, not the guideline's
 * full examination. Presets are computed from measured atlas landmarks;
 * `required` and `avoid` drive the feedback. None of this has been reviewed
 * by an echocardiographer: thresholds and presets are teaching values.
 */
const ASE_TTE = 'Mitchell et al., JASE 2019;32:1-64 (ASE comprehensive TTE)';
const ASE_TEE = 'Hahn et al., JASE 2013;26:921-964 (ASE/SCA comprehensive TEE)';
const ICE_SRC = 'Bortnick, Halaby, Silvestry, Herrmann. Intracardiac echocardiography, PCR-EAPCI Textbook (2020)';

export const TTE_VIEWS = Object.freeze([
  { id: 'plax', window: 'parasternal', title: { tr: 'Parasternal uzun eksen (PLAX)', en: 'Parasternal long axis (PLAX)' }, required: ['lv', 'la', 'aorta', 'rv', 'mitral'], avoid: ['ra', 'tricuspid'], source: ASE_TTE },
  { id: 'psax-av', window: 'parasternal', title: { tr: 'PSAX aort kapağı düzeyi', en: 'PSAX aortic valve level' }, required: ['aortic-valve', 'la', 'ra', 'rv'], avoid: [{ id: 'lv', max: 1 }, 'mitral'], source: ASE_TTE },
  { id: 'psax-mv', window: 'parasternal', title: { tr: 'PSAX mitral kapak düzeyi', en: 'PSAX mitral valve level' }, required: ['lv', 'rv', 'mitral'], avoid: ['la', 'aorta'], source: ASE_TTE },
  { id: 'psax-pm', window: 'parasternal', title: { tr: 'PSAX papiller kas düzeyi', en: 'PSAX papillary muscle level' }, required: ['lv', 'rv', 'lv-papillary'], avoid: ['mitral', 'la'], source: ASE_TTE },
  { id: 'a4c', window: 'apical', title: { tr: 'Apikal dört boşluk (A4C)', en: 'Apical four-chamber (A4C)' }, required: ['lv', 'rv', 'la', 'ra', 'mitral', 'tricuspid'], avoid: ['aorta'], apical: true, source: ASE_TTE },
  { id: 'a2c', window: 'apical', title: { tr: 'Apikal iki boşluk (A2C)', en: 'Apical two-chamber (A2C)' }, required: ['lv', 'la', 'mitral'], avoid: ['rv', 'ra', 'tricuspid'], apical: true, source: ASE_TTE },
  { id: 'a3c', window: 'apical', title: { tr: 'Apikal üç boşluk (A3C / APLAX)', en: 'Apical three-chamber (A3C / APLAX)' }, required: ['lv', 'la', 'aorta', 'mitral'], avoid: ['ra', 'tricuspid'], apical: true, source: ASE_TTE },
  { id: 'sc4c', window: 'subcostal', title: { tr: 'Subkostal dört boşluk', en: 'Subcostal four-chamber' }, required: ['lv', 'rv', 'la', 'ra'], avoid: [], source: ASE_TTE }
]);

// Mitral views: commissural and two-chamber differ by how the plane crosses the
// annulus (mitralChord: angle to the commissural axis); two-chamber and long
// axis by the outflow tract (aorta avoided or required). On this atlas the
// oesophagus is not aligned with the LV long axis, so the two-chamber cut
// through the apex crosses the annulus at a large angle.
// ase: the guideline's approximate multiplane range (ASE/SCA 2013, PDF p.11-18);
// the atlas starting angle is the preset's (teePreset). Angles vary with the
// patient's anatomy and are never a view's identity key; multi-angle sweeps
// may be needed.
export const TEE_VIEWS = Object.freeze([
  { id: 'me4c', title: { tr: 'ME dört boşluk', en: 'ME four-chamber' }, ase: { tr: '0–10° (triküspit anulusu için 10–20° ayar gerekebilir)', en: '0–10° (10–20° may be needed for the tricuspid annulus)' }, required: ['la', 'ra', 'lv', 'rv', 'mitral', 'tricuspid'], avoid: ['aorta'], apical: true, source: ASE_TEE },
  { id: 'memc', title: { tr: 'ME mitral komissüral', en: 'ME mitral commissural' }, ase: { tr: '50–70°', en: '50–70°' }, required: ['la', 'lv', 'mitral'], avoid: ['rv', 'ra', 'aorta'], mitralChord: [0, 22], source: ASE_TEE },
  { id: 'me2c', title: { tr: 'ME iki boşluk', en: 'ME two-chamber' }, ase: { tr: '80–100°', en: '80–100°' }, required: ['la', 'lv', 'mitral'], avoid: ['rv', 'ra', 'tricuspid', 'aorta'], apical: true, mitralChord: [25, 90], source: ASE_TEE },
  { id: 'melax', title: { tr: 'ME uzun eksen', en: 'ME long axis' }, ase: { tr: '120–140°', en: '120–140°' }, required: ['la', 'lv', 'aorta', 'mitral'], avoid: ['ra', 'tricuspid'], mitralChord: [55, 90], source: ASE_TEE },
  { id: 'meavsax', title: { tr: 'ME aort kapağı kısa eksen', en: 'ME aortic valve SAX' }, ase: { tr: '25–45°', en: '25–45°' }, required: ['aortic-valve', 'la', 'ra'], avoid: ['lv', 'mitral'], source: ASE_TEE },
  { id: 'mebicaval', title: { tr: 'ME bikaval', en: 'ME bicaval' }, ase: { tr: '90–110°, şaft sağa', en: '90–110°, shaft turned right' }, required: ['la', 'ra', 'svc'], avoid: ['lv', 'mitral'], bicaval: true, source: ASE_TEE },
  { id: 'melaa', title: { tr: 'ME sol atriyal apendiks', en: 'ME left atrial appendage' }, ase: { tr: 'başlangıç 90–110°; çok açılı tarama', en: 'start 90–110°; multi-angle sweep' }, required: ['la', 'laa'], avoid: ['rv', 'tricuspid'], source: ASE_TEE },
  { id: 'mervio', title: { tr: 'ME RV giriş-çıkış', en: 'ME RV inflow-outflow' }, ase: { tr: '50–70° (bu preset 75°)', en: '50–70° (this preset 75°)' }, required: ['ra', 'rv', 'tricuspid', 'pa'], avoid: ['mitral'], source: ASE_TEE },
  { id: 'melaapv', title: { tr: 'ME LAA ve sol üst PV komşuluğu', en: 'ME LAA and left upper PV neighbourhood' }, ase: { tr: 'ME LAA görünümü 90–110° (LAA ve sol üst PV); bu preset 135° tarama açısıdır', en: 'ME LAA view 90–110° (LAA and left upper PV); this preset is a 135° sweep angle' }, required: ['la', 'laa', 'pv'], avoid: ['rv', 'tricuspid'], source: ASE_TEE },
  { id: 'tgsax', title: { tr: 'TG orta papiller kısa eksen', en: 'TG mid-papillary SAX' }, ase: { tr: '0–20°', en: '0–20°' }, required: ['lv', 'lv-papillary'], avoid: ['la', 'laa', 'mitral', 'aorta', 'pa'], source: ASE_TEE }
]);

// Default sector width (full angle); the student can change it (60-90 degrees).
export const SECTOR_ANGLE = (75 * Math.PI) / 180;

export const viewById = id => TTE_VIEWS.find(v => v.id === id) || TEE_VIEWS.find(v => v.id === id) || (typeof ICE_VIEWS !== 'undefined' && ICE_VIEWS.find(v => v.id === id)) || null;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp = (a, b, t) => addv(a, sub(b, a), t);
const mid = (a, b) => lerp(a, b, 0.5);
const inPlane = (v, n) => normalize(addv(v, n, -dot(v, n)));

// Atlas calibration (scripts/echo-calibrate.cjs): the smallest probe
// adjustment from each landmark preset that meets the view's structure
// criteria on this atlas at rest and through the beat. Not an expert review.
const TTE_CALIBRATION = Object.freeze({ plax: { tilt: -5 }, 'psax-mv': { rotation: 10, tilt: -15 }, a2c: { tilt: -10 }, a3c: { tilt: -5 } });

// The transducer sits this far outside the measured heart surface (TTE).
const TTE_STANDOFF = 0.3;
const SUBCOSTAL_DIR = normalize([-0.15, -0.8, 0.55]);
// The atlas LV reaches the aortic annulus: the section sits a little above the
// cusp centres, and a short cut of the outflow tract (LV, at most 1 unit) is allowed.
const PSAX_AV_LIFT = 0.1;

/**
 * Base frame of a TTE view from the landmarks.
 * @param {string} id
 * @param {object} A landmarks (echo-anatomy.js measureEchoAnatomy)
 * @param {(point: number[], dir: number[]) => number} exit distance from a point to the heart surface along dir
 * @param {{ center: number[], radii: number[] }} [surface] schematic chest surface: the transducer sits on it
 * @returns {{ origin: number[], beam: number[], lateral: number[], depth: number, surface?: object }}
 */
export function tteBase(id, A, exit, surface = null) {
  const axis = normalize(sub(A.apex, A.mv.center));             // base to apex
  const planeOf = (p1, p2, p3) => normalize(cross(sub(p2, p1), sub(p3, p1)));
  const apicalApproach = axis;
  const lateralOf = (n, beam, hint) => { const l = cross(n, beam); return dot(l, hint) < 0 ? l.map(v => -v) : l; };
  let normal, target, approach, right;
  switch (id) {
    case 'plax':
      normal = planeOf(A.apex, A.mv.center, A.av.center); target = mid(A.mv.center, A.av.center);
      approach = [0, 0.3, 1]; right = sub(A.av.center, A.apex); break;
    case 'psax-av':
      // At the cusps, just above the annulus (the LV outflow ends at the annulus).
      normal = A.av.normal; target = addv(A.av.center, A.av.normal, PSAX_AV_LIFT); approach = [0, 0.2, 1]; right = [1, 0, 0]; break;
    case 'psax-mv':
      normal = axis; target = addv(A.mv.center, axis, 0.2); approach = [0, 0, 1]; right = [1, 0, 0]; break;
    case 'psax-pm':
      normal = axis; target = addv(A.mv.center, axis, dot(sub(A.papillary, A.mv.center), axis)); approach = [0, 0, 1]; right = [1, 0, 0]; break;
    case 'a4c':
      // The transducer sits at the true apex, aimed at the middle of the two AV valves.
      normal = planeOf(A.apex, A.mv.center, A.tv.center); target = lerp(A.apex, mid(A.mv.center, A.tv.center), 0.55);
      approach = normalize(sub(A.apex, mid(A.mv.center, A.tv.center))); right = [1, 0, 0]; break;
    case 'a3c':
      normal = planeOf(A.apex, A.mv.center, A.av.center); target = lerp(A.apex, A.mv.center, 0.55);
      approach = apicalApproach; right = sub(A.av.center, A.mv.center); break;
    case 'a2c': {
      // Between A4C (screen right: lateral wall) and A3C (screen right: aortic side): the anterior wall.
      const lateralWall = inPlane([1, 0, 0], axis), aortic = inPlane(sub(A.av.center, A.mv.center), axis);
      right = normalize(addv(lateralWall, aortic));
      normal = normalize(cross(axis, right)); target = lerp(A.apex, A.mv.center, 0.55); approach = apicalApproach; break;
    }
    case 'sc4c':
      normal = normalize(cross(sub(A.tv.center, A.mv.center), SUBCOSTAL_DIR)); target = lerp(mid(A.mv.center, A.tv.center), A.apex, 0.2);
      approach = SUBCOSTAL_DIR; right = [1, 0, 0]; break;
    default: return null;
  }
  const u = inPlane(approach, normal);
  // On the chest surface where the window line leaves it, else just outside the heart.
  const onChest = surface && surfaceHit(target, u, surface);
  const origin = onChest || addv(target, u, exit(target, u) + TTE_STANDOFF);
  const distance = Math.hypot(...sub(origin, target));
  const beam = u.map(v => -v);
  const landmarkFrame = imageFrame(origin, beam, lateralOf(normal, beam, right));
  const frame = tteFrame(landmarkFrame, TTE_CALIBRATION[id] || {});
  return { origin: frame.origin, beam: frame.beam, lateral: frame.lateral, depth: Math.min(6, Math.max(3, distance + 1.9)), surface };
}

/** The TEE probe path (oesophagus and stomach) from the landmarks. */
export function teePath(A) {
  // The last path segment (gastro-oesophageal junction to the stomach point) is the wide lumen.
  const probe = createProbePath(A.oesophagusPath);
  const gej = A.oesophagusPath[A.oesophagusPath.length - 2];
  let wideFrom = 1;
  for (let k = 200; k >= 0; k--) { const p = probe.at(k / 200).point; if (Math.hypot(p[0] - gej[0], p[1] - gej[1], p[2] - gej[2]) < 0.05) { wideFrom = k / 200; break; } }
  return createProbePath(A.oesophagusPath, { wideFrom });
}

// Mid-oesophageal part of the path (advance 0..ME_END); beyond it the probe is past the cardia.
const ME_END = 0.72;
export const TG_ADVANCE = 0.97;

/**
 * Preset probe state of a TEE view: the level (advance) from the landmarks,
 * the pose within the guideline multiplane range from the atlas calibration.
 * @returns {{ advance: number, rotation: number, flexion: number, lateralFlexion: number, omega: number, depth: number }}
 */
export function teePreset(id, A, path) {
  const level = y => path.levelAt(y, 0, ME_END);
  const me = level(A.mv.center[1]);
  // Level from the landmarks, pose from the atlas calibration (scripts/echo-calibrate.cjs).
  const pose = (advance, rotation, flexion, omega, depth, lateralFlexion = 0) => ({ advance, rotation, flexion, lateralFlexion, omega, depth });
  switch (id) {
    case 'me4c': return pose(me - 0.02, 0, -20, 0, 4.8);
    case 'memc': return pose(me - 0.04, -37.5, 10, 50, 3);
    case 'me2c': return pose(me + 0.04, -30, -30, 105, 4.8, 10);
    case 'melax': return pose(me - 0.04, 0, 20, 120, 4.8);
    case 'meavsax': return pose(level(A.av.center[1]), 0, 10, 45, 4.8);
    case 'mebicaval': return pose(level(A.la[1] + 0.1) + 0.04, 30, 0, 90, 4.8);
    case 'melaa': return pose(level(A.laa ? A.laa.center[1] : A.la[1] + 0.2), -30, 0, 60, 3);
    case 'mervio': return pose(me - 0.02, 10, 0, 75, 4.8);
    case 'melaapv': return pose(level(A.laa ? A.laa.center[1] : A.la[1] + 0.2), -30, 0, 135, 3.6);
    case 'tgsax': return pose(TG_ADVANCE, -15, 0, 10, 4.8);
    default: return null;
  }
}

// ICE (phased array, AcuNav-type) views from the right atrium, in the
// textbook's clockwise sequence from the home view (PCR-EAPCI, ICE chapter
// 2020, p.7-13; EHRA/EAPCI ICE statement 2026): `ase` carries the source's
// manoeuvre; presets are calibrated on this atlas (scripts/ice-calibrate.cjs),
// not expert-reviewed. Criteria (research/ICE_INCELEME_RAPORU.md):
//   required: the view's targets (and the structures that make it
//     recognisable); minLength: a target must show this much contour;
//   relations: contours that must meet in the image (a vein ostium on the
//     LA; RA and LA across the septum; the aortic root next to the septum);
//   order: near-field / far-field pairs (the plane faces the right way);
//   side: a structure's side of the image (the LAA on the image right);
//   landmarks: measured points that must lie in the cut (fossa ovalis);
//   optional: supporting structures the text mentions but does not require.
// The RA is the near field of every view (the catheter sits inside it).
// `motion` is the move from the previous view of the sequence; `note`
// states where the atlas preset departs from the source manoeuvre.
const ostium = (vein) => ({ a: 'la', b: vein, note: { tr: 'ven ağzı LA\'ya açılmalı', en: 'the vein ostium should open into the LA' } });
export const ICE_VIEWS = Object.freeze([
  { id: 'ice-home', title: { tr: 'ICE home görünümü', en: 'ICE home view' }, ase: { tr: 'orta RA, nötr, saat yönü 15–30°: RA → TV → RV', en: 'mid RA, neutral, clockwise 15–30°: RA → TV → RV' },
    motion: { tr: 'Başlangıç: kateter orta RA\'da, büküm nötr; transdüser triküspit kapağa bakar.', en: 'Start: catheter in the mid RA, knobs neutral; the transducer faces the tricuspid valve.' },
    required: ['tricuspid', 'rv'], optional: ['aortic-valve'], avoid: ['pv', 'svc'], source: ICE_SRC },
  { id: 'ice-rvot', title: { tr: 'ICE RV çıkış yolu', en: 'ICE RVOT view' }, ase: { tr: 'saat yönü 30–40°: AV yakında, RVOT ve pulmoner kapak uzakta', en: 'clockwise 30–40°: AV near, RVOT and pulmonary valve far' },
    motion: { tr: 'Home\'dan saat yönünde ~15° çevirin: aort kapağı yakın alana, RVOT ve pulmoner kapak uzak alana girer.', en: 'From home, rotate ~15° clockwise: the aortic valve enters the near field, the RVOT and pulmonary valve the far field.' },
    required: ['rv', 'aortic-valve', 'pulmonary-valve'], order: [['aortic-valve', 'pulmonary-valve']], avoid: ['pv', 'laa'], source: ICE_SRC },
  { id: 'ice-lvot', title: { tr: 'ICE LVOT / aort kapağı uzun eksen', en: 'ICE LVOT / aortic valve long axis' }, ase: { tr: 'saat yönü ~45°: AV uzun eksen, LVOT, LV (TAVI)', en: 'clockwise ~45°: AV long axis, LVOT, LV (TAVI)' },
    motion: { tr: 'Biraz daha saat yönü: aort kapağı uzun ekseni ve LVOT, LV uzakta.', en: 'A little more clockwise: the aortic valve long axis and LVOT, the LV in the far field.' },
    required: ['aortic-valve', 'lv'], optional: ['aorta'], avoid: ['pv', 'svc'], source: ICE_SRC },
  { id: 'ice-mitral-laa', title: { tr: 'ICE mitral / LAA görünümü', en: 'ICE mitral / LAA view' }, ase: { tr: 'biraz ilerlet, saat yönü 60–80°: septum → LA → MV → LV, LAA sağda', en: 'advance slightly, clockwise 60–80°: septum → LA → MV → LV, LAA on the right' },
    motion: { tr: 'Saat yönünde ~30° daha: LA, mitral kapak ve LV; LAA tanınabilir bir lob olarak görüntünün sağında.', en: 'About 30° more clockwise: LA, mitral valve and LV; the LAA as a recognisable lobe on the image right.' },
    required: ['la', 'mitral', 'lv', 'laa'], minLength: { laa: 0.4 }, side: { laa: 'right' }, avoid: ['tricuspid', 'svc'], source: ICE_SRC },
  { id: 'ice-left-pv', title: { tr: 'ICE sol pulmoner venler', en: 'ICE left pulmonary veins' }, ase: { tr: 'yüksek RA, saat yönü 90–100°: LSPV ve LIPV ("pantolon paçaları")', en: 'high RA, clockwise 90–100°: LSPV and LIPV ("trouser legs")' },
    motion: { tr: 'Saat yönünde ~20° daha: sol üst ve alt pulmoner ven ("pantolon paçaları"), ağızları LA\'ya açılır.', en: 'About 20° more clockwise: the left superior and inferior veins ("trouser legs"), their ostia opening into the LA.' },
    required: ['la', 'lspv', 'lipv'], relations: [ostium('lspv'), ostium('lipv'), { a: 'lspv', b: 'lipv', max: 0.6, note: { tr: 'iki sol ven yan yana ("pantolon paçaları")', en: 'the two left veins side by side ("trouser legs")' } }], avoid: ['rspv', 'ripv', 'tricuspid', 'rv'], source: ICE_SRC },
  { id: 'ice-septal-sax', title: { tr: 'ICE septal kısa eksen (transseptal çalışma görünümü)', en: 'ICE septal short axis (transseptal working view)' }, ase: { tr: 'posterior + sağ büküm, saat yönü 100–150°: RA, septum, LA, AV kısa eksen', en: 'posterior + right deflection, clockwise 100–150°: RA, septum, LA, AV short axis' },
    motion: { tr: 'Posterior ve sağ büküm verin: RA yakında, interatriyal septum ve fossa ovalis ortada, LA uzakta; aort kökü septumun önünde.', en: 'Add posterior and right deflection: the RA near, the interatrial septum and fossa ovalis in the middle, the LA far; the aortic root in front of the septum.' },
    required: ['ra', 'la', 'aortic-valve'], relations: [
      { a: 'ra', b: 'la', max: 0.2, note: { tr: 'interatriyal septum', en: 'interatrial septum' } },
      { a: 'aortic-valve', b: 'la', max: 0.6, note: { tr: 'aort kökü septum komşuluğunda', en: 'aortic root next to the septum' } }
    ], order: [['ra', 'la']], landmarks: ['fossa'], avoid: ['lv', 'tricuspid'], source: ICE_SRC },
  { id: 'ice-right-pv', title: { tr: 'ICE sağ pulmoner venler', en: 'ICE right pulmonary veins' }, ase: { tr: 'posterior bükümle saat yönü 150–180°: RSPV, RIPV, sağ PA', en: 'posterior deflection kept, clockwise 150–180°: RSPV, RIPV, right PA' },
    motion: { tr: 'Posterior bükümü koruyup saat yönünde devam edin: sağ üst ve alt pulmoner ven, ağızları LA\'ya açılır.', en: 'Keep the posterior deflection and continue clockwise: the right superior and inferior veins, their ostia opening into the LA.' },
    required: ['la', 'rspv', 'ripv'], relations: [ostium('rspv'), ostium('ripv')], optional: ['pa'], avoid: ['lspv', 'lipv', 'lv', 'rv', 'tricuspid'], source: ICE_SRC },
  { id: 'ice-svc', title: { tr: 'ICE SVC (bikaval benzeri)', en: 'ICE SVC (bicaval-like) view' }, ase: { tr: 'nötr, saat yönü 210–240°, hafif ilerlet: RA → SVC, LA', en: 'neutral, clockwise 210–240°, advance slightly: RA → SVC, LA' },
    motion: { tr: 'Saat yönünde devam edip hafif ilerletin: RA\'nın SVC\'ye açıldığı bileşke, LA arkada.', en: 'Continue clockwise and advance slightly: the RA opening into the SVC, the LA behind.' },
    required: ['svc', 'ra'], relations: [{ a: 'ra', b: 'svc', max: 0.15, note: { tr: 'SVC-RA bileşkesi', en: 'SVC-RA junction' } }], optional: ['la'], avoid: ['lv', 'rv', 'tricuspid'], source: ICE_SRC }
]);

/**
 * ICE catheter path in the RA: from the IVC orifice up toward the SVC; the
 * home beam faces the tricuspid valve, and `clockwise` is the sign that turns
 * it from the tricuspid toward the aortic root and the left atrium.
 */
export function icePath(A) {
  const base = A.ivc;
  const top = addv(A.ivc, sub(A.svc, A.ivc), 0.62);
  const axis = normalize(sub(top, base));
  const mid = addv(base, sub(top, base), 0.55);
  const home = inPlane(sub(A.tv.center, mid), axis);
  const towardAo = inPlane(sub(A.av.center, mid), axis);
  const clockwise = dot(rotate(home, axis, 30), towardAo) >= dot(rotate(home, axis, -30), towardAo) ? 1 : -1;
  return { base, top, home, clockwise };
}

// Atlas calibration of the ICE presets (scripts/ice-calibrate.cjs: the
// smallest departure from the source manoeuvre that meets the view's
// criteria at rest and through the beat). Knob signs as in iceFrame:
// anteroposterior - posterior, leftRight - right.
const ICE_CALIBRATION = Object.freeze({
  'ice-home': { advance: 0.55, rotation: 15, anteroposterior: 0, leftRight: 0 },
  'ice-rvot': { advance: 0.55, rotation: 35, anteroposterior: 0, leftRight: 0 },
  'ice-lvot': { advance: 0.55, rotation: 40, anteroposterior: 0, leftRight: 0 },
  'ice-mitral-laa': { advance: 0.55, rotation: 75, anteroposterior: 0, leftRight: 15 },
  'ice-left-pv': { advance: 0.7, rotation: 100, anteroposterior: 0, leftRight: -15 },
  'ice-septal-sax': { advance: 0.55, rotation: 125, anteroposterior: -30, leftRight: -45 },
  'ice-right-pv': { advance: 0.55, rotation: 160, anteroposterior: -30, leftRight: 0 },
  'ice-svc': { advance: 0.55, rotation: 210, anteroposterior: -45, leftRight: 0 }
});

/** Where an atlas preset departs from the source manoeuvre (shown next to the view). */
export const ICE_PRESET_NOTES = Object.freeze({
  'ice-mitral-laa': { tr: 'Atlas farkı: LAA lobunun tanınabilir görünmesi için hafif sol büküm (15°) gerekti; kaynakta büküm nötr.', en: 'Atlas difference: a slight left deflection (15°) was needed for a recognisable LAA lobe; the source keeps the knobs neutral.' },
  'ice-left-pv': { tr: 'Atlas farkı: kateter daha yukarıda (ilerletme %70, kaynaktaki "yüksek RA") ve hafif sağ bükümle (15°).', en: 'Atlas difference: the catheter sits higher (advance 70%, the source\'s "high RA") with a slight right deflection (15°).' },
  'ice-septal-sax': { tr: 'Atlas notu: yön kaynakla aynı (posterior ve sağ büküm, saat yönü 125°); sağ büküm bu atlasta düğmenin sınırında (45°).', en: 'Atlas note: the direction matches the source (posterior and right deflection, clockwise 125°); the right deflection sits at the knob limit (45°) on this atlas.' },
  'ice-svc': { tr: 'Atlas farkı: atlastaki kateter ekseni doğrudan SVC\'ye baktığından düğme sınırında posterior büküm (45°) gerekti; kaynakta büküm nötr.', en: 'Atlas difference: the atlas catheter axis points straight at the SVC, so a posterior deflection at the knob limit (45°) was needed; the source keeps the knobs neutral.' }
});

/** Preset probe state of an ICE view (advance, rotation, deflections, depth). */
export function icePreset(id) {
  const c = ICE_CALIBRATION[id];
  return c ? { depth: 3.6, ...c } : null;
}
