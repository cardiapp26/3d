import { imageFrame, cross, normalize } from './echo-section.js';
import { createProbePath, tteFrame, surfaceHit } from './echo-probe.js';

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

export const viewById = id => TTE_VIEWS.find(v => v.id === id) || TEE_VIEWS.find(v => v.id === id) || null;

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
