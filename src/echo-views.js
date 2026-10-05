import { imageFrame, cross, normalize } from './echo-section.js';
import { createProbePath, tteFrame, surfaceHit, rotate } from './echo-probe.js';

/*
 * The starting view sets of the echo module (report sections 4 and 5): 8 TTE
 * views (PLAX, 3 PSAX levels, 3 apical, subcostal four-chamber; ASE 2019)
 * and 12 TEE views (11 mid-oesophageal including the 0° mitral scallop scan, transgastric mid SAX; ASE/SCA
 * 2013). The selection is the product's teaching subset, not the guideline's
 * full examination. Presets are computed from measured atlas landmarks;
 * `required` and `avoid` drive the feedback. None of this has been reviewed
 * by an echocardiographer: thresholds and presets are teaching values.
 */
const ASE_TTE = 'Mitchell et al., JASE 2019;32:1-64 (ASE comprehensive TTE)';
const ASE_TEE = 'Hahn et al., JASE 2013;26:921-964 (ASE/SCA comprehensive TEE)';
const ICE_SRC = 'Bortnick, Halaby, Silvestry, Herrmann. Intracardiac echocardiography, PCR-EAPCI Textbook (2020)';
const ICE_LA_SRC = 'Enriquez et al. Intracardiac echocardiography from the left heart chambers. Heart Rhythm 2026;23:1915-1926';

// parts: the ASE/AHA LV segments the view's plane cuts (Lang et al., JASE 2015;28:1-39, figure 3).
export const TTE_VIEWS = Object.freeze([
  { id: 'plax', window: 'parasternal', title: { tr: 'Parasternal uzun eksen (PLAX)', en: 'Parasternal long axis (PLAX)' }, required: ['lv', 'la', 'aorta', 'rv', 'mitral'], avoid: ['ra', 'tricuspid', 'pa', 'svc'], parts: { lv: ['2', '8', '5', '11'] }, source: ASE_TTE },
  { id: 'psax-av', window: 'parasternal', title: { tr: 'PSAX aort kapağı düzeyi', en: 'PSAX aortic valve level' }, required: ['aortic-valve', 'la', 'ra', 'rv'], avoid: [{ id: 'lv', max: 1 }, 'mitral'], source: ASE_TTE },
  { id: 'psax-mv', window: 'parasternal', title: { tr: 'PSAX mitral kapak düzeyi', en: 'PSAX mitral valve level' }, required: ['lv', 'rv', 'mitral'], avoid: ['la', 'aorta'], parts: { lv: ['1', '2', '3', '4', '5', '6'] }, source: ASE_TTE },
  { id: 'psax-pm', window: 'parasternal', title: { tr: 'PSAX papiller kas düzeyi', en: 'PSAX papillary muscle level' }, required: ['lv', 'rv', 'lv-papillary'], avoid: ['mitral', 'la'], parts: { lv: ['7', '8', '9', '10', '11', '12'] }, source: ASE_TTE },
  { id: 'a4c', window: 'apical', title: { tr: 'Apikal dört boşluk (A4C)', en: 'Apical four-chamber (A4C)' }, required: ['lv', 'rv', 'la', 'ra', 'mitral', 'tricuspid'], avoid: ['aorta'], apical: true, parts: { lv: ['3', '9', '14', '6', '12', '16'] }, source: ASE_TTE },
  { id: 'a2c', window: 'apical', title: { tr: 'Apikal iki boşluk (A2C)', en: 'Apical two-chamber (A2C)' }, required: ['lv', 'la', 'mitral'], avoid: ['rv', 'ra', 'tricuspid', 'pa', 'pulmonary-valve'], apical: true, parts: { lv: ['4', '10', '15', '1', '7', '13'] }, source: ASE_TTE },
  { id: 'a3c', window: 'apical', title: { tr: 'Apikal üç boşluk (A3C / APLAX)', en: 'Apical three-chamber (A3C / APLAX)' }, required: ['lv', 'la', 'aorta', 'mitral'], avoid: ['ra', 'tricuspid', 'pulmonary-valve'], apical: true, parts: { lv: ['2', '8', '5', '11'] }, source: ASE_TTE },
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
// may be needed. mitralPartsClosed: the mitral scallops are scored with the valve closed
// (rest and systole, as scallops are identified); with the valve open the leaflets swing
// out of the cut and only the other criteria apply.
export const TEE_VIEWS = Object.freeze([
  { id: 'me4c', title: { tr: 'ME dört boşluk', en: 'ME four-chamber' }, ase: { tr: '0–10° (triküspit anulusu için 10–20° ayar gerekebilir)', en: '0–10° (10–20° may be needed for the tricuspid annulus)' }, required: ['la', 'ra', 'lv', 'rv', 'mitral', 'tricuspid'], avoid: ['aorta'], apical: true, parts: { lv: ['3', '9', '14', '6', '12', '16'], mitral: [['A2', 'A3'], ['P2', 'P1']] }, source: ASE_TEE },
  { id: 'memc', title: { tr: 'ME mitral komissüral', en: 'ME mitral commissural' }, ase: { tr: '50–70°: iki komissür, P3 – A2 – P1 (medialden laterale)', en: '50–70°: both commissures, P3 – A2 – P1 (medial to lateral)' }, required: ['la', 'lv', 'mitral'], avoid: ['rv', 'ra', 'aorta'], mitralChord: [0, 22], parts: { mitral: ['P3', 'A2', 'P1'] }, mitralPartsClosed: true, source: ASE_TEE },
  { id: 'me2c', title: { tr: 'ME iki boşluk', en: 'ME two-chamber' }, ase: { tr: '80–100° (bu preset 105°, fleksiyon −30° kontrol sınırında)', en: '80–100° (this preset 105°, flexion −30° at the control limit)' }, required: ['la', 'lv', 'mitral'], avoid: ['rv', 'ra', 'tricuspid', 'aorta'], apical: true, mitralChord: [25, 90], parts: { lv: [['1', '7', '13']] }, source: ASE_TEE },
  { id: 'melax', title: { tr: 'ME uzun eksen', en: 'ME long axis' }, ase: { tr: '120–140°', en: '120–140°' }, required: ['la', 'lv', 'aorta', 'mitral'], avoid: ['ra', 'tricuspid'], mitralChord: [55, 90], parts: { lv: ['2', '8', '5', '11'], mitral: ['A2', 'P2'] }, source: ASE_TEE },
  { id: 'meavsax', title: { tr: 'ME aort kapağı kısa eksen', en: 'ME aortic valve SAX' }, ase: { tr: '25–45°', en: '25–45°' }, required: ['aortic-valve', 'la', 'ra'], avoid: ['lv', 'mitral'], septalCut: { axis: 'ap', max: 50 }, source: ASE_TEE },
  { id: 'mebicaval', title: { tr: 'ME bikaval', en: 'ME bicaval' }, ase: { tr: '90–110°, şaft sağa (bu preset 85°)', en: '90–110°, shaft turned right (this preset 85°)' }, required: ['la', 'ra', 'svc'], avoid: ['lv', 'mitral'], relations: [{ a: 'ra', b: 'svc', max: 0.15, note: { tr: 'SVC-RA bileşkesi', en: 'SVC-RA junction' } }], bicaval: true, septalCut: { axis: 'si', max: 35 }, source: ASE_TEE },
  { id: 'melaa', title: { tr: 'ME sol atriyal apendiks', en: 'ME left atrial appendage' }, ase: { tr: 'başlangıç 90–110°; çok açılı tarama (bu preset 60°)', en: 'start 90–110°; multi-angle sweep (this preset 60°)' }, required: ['la', 'laa'], avoid: ['rv', 'tricuspid'], source: ASE_TEE },
  { id: 'mervio', title: { tr: 'ME RV giriş-çıkış', en: 'ME RV inflow-outflow' }, ase: { tr: '50–70° (bu preset 75°)', en: '50–70° (this preset 75°)' }, required: ['ra', 'rv', 'tricuspid', 'pa'], avoid: ['mitral'], source: ASE_TEE },
  { id: 'melaapv', title: { tr: 'ME LAA ve sol üst PV komşuluğu', en: 'ME LAA and left upper PV neighbourhood' }, ase: { tr: 'ME LAA görünümü 90–110° (LAA ve sol üst PV)', en: 'ME LAA view 90–110° (LAA and left upper PV)' }, required: ['la', 'laa', 'lspv'], relations: [{ a: 'la', b: 'lspv', max: 0.15, note: { tr: 'sol üst ven ağzı LA\'ya açılmalı', en: 'the left upper vein ostium should open into the LA' } }], avoid: ['rv', 'tricuspid', 'rspv', 'ripv'], source: ASE_TEE },
  // Mitral scallop scan at 0°: withdrawing toward the aortic valve (five-chamber level) cuts
  // A1–P1, the four-chamber level A2–P2 (me4c), advancing toward the posteromedial
  // commissure A3–P3 (the textbook mitral map; Carpentier nomenclature).
  { id: 'mea1p1', title: { tr: 'ME 0° mitral: A1 – P1', en: 'ME 0° mitral: A1 – P1' }, ase: { tr: '0°, prob 4 boşluk düzeyinden hafif geri (aort kapağına doğru): A1 – P1', en: '0°, probe slightly withdrawn from the four-chamber level (toward the aortic valve): A1 – P1' }, required: ['la', 'lv', 'mitral'], avoid: ['pa'], parts: { mitral: ['A1', 'P1'] }, mitralPartsClosed: true, source: ASE_TEE },
  { id: 'mea3p3', title: { tr: 'ME 0° mitral: A3 – P3', en: 'ME 0° mitral: A3 – P3' }, ase: { tr: '0°, prob 4 boşluk düzeyinden ilerletilmiş (posteromedial komissüre doğru): A3 – P3', en: '0°, probe advanced from the four-chamber level (toward the posteromedial commissure): A3 – P3' }, required: ['la', 'lv', 'mitral'], avoid: ['aorta', 'pa'], parts: { mitral: ['A3', 'P3'] }, mitralPartsClosed: true, source: ASE_TEE },
  { id: 'tgsax', title: { tr: 'TG orta papiller kısa eksen', en: 'TG mid-papillary SAX' }, ase: { tr: '0–20°', en: '0–20°' }, required: ['lv', 'lv-papillary'], avoid: ['la', 'laa', 'mitral', 'aorta', 'pa'], parts: { lv: ['7', '8', '9', '10', '11', '12'] }, source: ASE_TEE }
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
// depthOffset shortens the sector (A2C: the far field would reach the PA).
const TTE_CALIBRATION = Object.freeze({ plax: { rotation: -10, rock: -30 }, 'psax-mv': { rotation: 20, tilt: -5, rock: 30 }, a2c: { tilt: -5, rock: 10, depthOffset: -0.6 }, a3c: { rock: -20 } });

/** Where a TTE preset differs from the textbook image on this atlas (shown next to the view). */
/** TEE presets that differ from the textbook image on this atlas (shown next to the view). */
export const TEE_PRESET_NOTES = Object.freeze({
  me2c: { tr: 'Atlas notu: bu atlasta özofagus yolundan RV\'yi dışarıda bırakıp apeksi düzlemde tutan gerçek bir iki boşluk düzlemi bulunamadı. Preset anterior duvarı (13) keser ama inferior duvar (4, 10, 15) yerine inferolateral ve anteroseptal segmentler görünür; ders kitabında ME iki boşluk anterior (1, 7, 13) ve inferior (4, 10, 15) duvarları gösterir.', en: 'Atlas note: on this atlas no true two-chamber plane that excludes the RV and keeps the apex in the plane is reachable from the oesophageal path. The preset cuts the anterior wall (13) but shows inferolateral and anteroseptal segments instead of the inferior wall (4, 10, 15); the textbook ME two-chamber shows the anterior (1, 7, 13) and inferior (4, 10, 15) walls.' }
});

export const TTE_PRESET_NOTES = Object.freeze({
  plax: { tr: 'Atlas notu: standart PLAX\'ta pulmoner kapak görülmez (önde RVOT görülür; pulmoner kapak PSAX aort düzeyinde ve RVOT görünümünde izlenir). Bu atlasta pulmoner kapak LV uzun eksen düzlemine çok yakın olduğundan kesitin ön kenarında PuV görünebilir.', en: 'Atlas note: a standard PLAX does not show the pulmonary valve (the RVOT lies in front; the pulmonary valve is seen at the PSAX aortic level and in the RVOT view). On this atlas the pulmonary valve lies very close to the LV long-axis plane, so PuV can appear at the front edge of the cut.' },
  a2c: { tr: 'A2C\'de pulmoner kapak görülmez. LA arka duvarına açılan sol pulmoner ven (burada LIPV) ve LAA kesite girebilir.', en: 'The A2C does not show the pulmonary valve. A left pulmonary vein opening into the posterior LA (here the LIPV) and the LAA can enter the cut.' }
});

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
  const depthOffset = TTE_CALIBRATION[id]?.depthOffset || 0;
  return { origin: frame.origin, beam: frame.beam, lateral: frame.lateral, depth: Math.min(6, Math.max(3, distance + 1.9)) + depthOffset, surface };
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
 * the pose from the atlas calibration. The multiplane angle is in the
 * guideline range except where the view text names the preset angle
 * (ME two-chamber 105°, ME bicaval 85°, ME LAA 60°, RV inflow-outflow 75°).
 * @returns {{ advance: number, rotation: number, flexion: number, lateralFlexion: number, omega: number, depth: number }}
 */
export function teePreset(id, A, path) {
  const level = y => path.levelAt(y, 0, ME_END);
  const me = level(A.mv.center[1]);
  // Level from the landmarks, pose from the atlas calibration (scripts/echo-calibrate.cjs).
  const pose = (advance, rotation, flexion, omega, depth, lateralFlexion = 0) => ({ advance, rotation, flexion, lateralFlexion, omega, depth });
  switch (id) {
    case 'me4c': return pose(me - 0.06, 0, -20, 0, 4.8);
    case 'memc': return pose(me - 0.16, -30, -30, 60, 3, -10);
    case 'mea1p1': return pose(me - 0.045, -20, 0, 0, 4.8);
    case 'mea3p3': return pose(me + 0.015, 10, -10, 0, 4.8);
    case 'me2c': return pose(me + 0.04, -30, -30, 105, 4.8, 10);
    case 'melax': return pose(me, -15, 0, 120, 4.8);
    case 'meavsax': return pose(level(A.av.center[1]), 0, 10, 45, 4.8);
    case 'mebicaval': return pose(level(A.la[1] + 0.1) + 0.04, 30, 0, 85, 4.8);
    case 'melaa': return pose(level(A.laa ? A.laa.center[1] : A.la[1] + 0.2), -30, 0, 60, 3);
    case 'mervio': return pose(me - 0.02, 10, 0, 75, 4.8);
    case 'melaapv': return pose(level(A.laa ? A.laa.center[1] : A.la[1] + 0.2), -30, 0, 110, 4.8);
    case 'tgsax': return pose(TG_ADVANCE, -15, 0, 0, 4.8);
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
// From the RA the RA is the near field (home, septal); the LA tour images from inside the LA.
// `motion` is the move from the previous view of the sequence; `note`
// states where the atlas preset departs from the source manoeuvre.
const ostium = (vein) => ({ a: 'la', b: vein, note: { tr: 'ven ağzı LA\'ya açılmalı', en: 'the vein ostium should open into the LA' } });
export const ICE_VIEWS = Object.freeze([
  { id: 'ice-home', title: { tr: 'ICE home görünümü', en: 'ICE home view' }, ase: { tr: 'orta RA, nötr, saat yönü 15–30°: RA → TV → RV', en: 'mid RA, neutral, clockwise 15–30°: RA → TV → RV' },
    motion: { tr: 'Başlangıç: kateter orta RA\'da, büküm nötr; transdüser triküspit kapağa bakar.', en: 'Start: catheter in the mid RA, knobs neutral; the transducer faces the tricuspid valve.' },
    required: ['ra', 'tricuspid', 'rv'], order: [['ra', 'rv']], optional: ['aortic-valve'], avoid: ['pv', 'svc'], source: ICE_SRC },
  { id: 'ice-rvot', title: { tr: 'ICE RV çıkış yolu', en: 'ICE RVOT view' }, ase: { tr: 'saat yönü 30–40°: AV yakında, RVOT ve pulmoner kapak uzakta', en: 'clockwise 30–40°: AV near, RVOT and pulmonary valve far' },
    motion: { tr: 'Home\'dan saat yönünde ~15° çevirin: aort kapağı yakın alana, RVOT ve pulmoner kapak uzak alana girer.', en: 'From home, rotate ~15° clockwise: the aortic valve enters the near field, the RVOT and pulmonary valve the far field.' },
    required: ['rv', 'aortic-valve', 'pulmonary-valve'], order: [['aortic-valve', 'pulmonary-valve']], avoid: ['pv', 'laa'], source: ICE_SRC },
  { id: 'ice-lvot', title: { tr: 'ICE LVOT / aort kapağı uzun eksen', en: 'ICE LVOT / aortic valve long axis' }, ase: { tr: 'saat yönü ~45°: AV uzun eksen, LVOT, LV (TAVI)', en: 'clockwise ~45°: AV long axis, LVOT, LV (TAVI)' },
    motion: { tr: 'Biraz daha saat yönü: aort kapağı uzun ekseni ve LVOT, LV uzakta.', en: 'A little more clockwise: the aortic valve long axis and LVOT, the LV in the far field.' },
    required: ['aortic-valve', 'lv'], order: [['aortic-valve', 'lv']], optional: ['aorta'], avoid: ['pv', 'svc'], source: ICE_SRC },
  { id: 'ice-mitral-laa', title: { tr: 'ICE mitral / LAA görünümü', en: 'ICE mitral / LAA view' }, ase: { tr: 'biraz ilerlet, saat yönü 60–80°: septum → LA → MV → LV, LAA sağda', en: 'advance slightly, clockwise 60–80°: septum → LA → MV → LV, LAA on the right' },
    motion: { tr: 'Saat yönünde ~30° daha: LA, mitral kapak ve LV; LAA tanınabilir bir lob olarak görüntünün sağında.', en: 'About 30° more clockwise: LA, mitral valve and LV; the LAA as a recognisable lobe on the image right.' },
    required: ['la', 'mitral', 'lv', 'laa'], minLength: { laa: 0.4 }, side: { laa: 'right' }, order: [['la', 'laa']], avoid: ['tricuspid', 'svc'], source: ICE_SRC },
  { id: 'ice-left-pv', title: { tr: 'ICE sol pulmoner venler', en: 'ICE left pulmonary veins' }, ase: { tr: 'yüksek RA, saat yönü 90–100°: LSPV ve LIPV ("pantolon paçaları")', en: 'high RA, clockwise 90–100°: LSPV and LIPV ("trouser legs")' },
    motion: { tr: 'Saat yönünde ~20° daha: sol üst ve alt pulmoner ven ("pantolon paçaları"), ağızları LA\'ya açılır.', en: 'About 20° more clockwise: the left superior and inferior veins ("trouser legs"), their ostia opening into the LA.' },
    required: ['la', 'lspv', 'lipv'], relations: [ostium('lspv'), ostium('lipv'), { a: 'lspv', b: 'lipv', max: 0.6, note: { tr: 'iki sol ven yan yana ("pantolon paçaları")', en: 'the two left veins side by side ("trouser legs")' } }], avoid: ['rspv', 'ripv', 'tricuspid', 'rv'], source: ICE_SRC },
  { id: 'ice-septal-sax', title: { tr: 'ICE septal kısa eksen (transseptal çalışma görünümü)', en: 'ICE septal short axis (transseptal working view)' }, ase: { tr: 'posterior + sağ büküm, saat yönü 100–150°: RA, septum, LA, AV kısa eksen', en: 'posterior + right deflection, clockwise 100–150°: RA, septum, LA, AV short axis' },
    motion: { tr: 'Posterior ve sağ büküm verin: RA yakında, interatriyal septum ve fossa ovalis ortada, LA uzakta; aort kökü septumun önünde.', en: 'Add posterior and right deflection: the RA near, the interatrial septum and fossa ovalis in the middle, the LA far; the aortic root in front of the septum.' },
    required: ['ra', 'la', 'aortic-valve'], relations: [
      { a: 'ra', b: 'la', max: 0.2, note: { tr: 'interatriyal septum', en: 'interatrial septum' } },
      { a: 'aortic-valve', b: 'la', max: 0.6, note: { tr: 'aort kökü septum komşuluğunda', en: 'aortic root next to the septum' } }
    ], order: [['ra', 'la']], landmarks: ['fossa'], septalCut: { axis: 'ap', max: 50 }, avoid: ['lv', 'tricuspid'], source: ICE_SRC },
  { id: 'ice-right-pv', title: { tr: 'ICE sağ pulmoner venler', en: 'ICE right pulmonary veins' }, ase: { tr: 'posterior bükümle saat yönü 150–180°: RSPV, RIPV, sağ PA', en: 'posterior deflection kept, clockwise 150–180°: RSPV, RIPV, right PA' },
    motion: { tr: 'Posterior bükümü koruyup saat yönünde devam edin: sağ üst ve alt pulmoner ven, ağızları LA\'ya açılır.', en: 'Keep the posterior deflection and continue clockwise: the right superior and inferior veins, their ostia opening into the LA.' },
    required: ['la', 'rspv', 'ripv'], relations: [ostium('rspv'), ostium('ripv')], optional: ['pa'], avoid: ['lspv', 'lipv', 'lv', 'rv', 'tricuspid'], source: ICE_SRC },
  { id: 'ice-svc', title: { tr: 'ICE SVC (bikaval benzeri)', en: 'ICE SVC (bicaval-like) view' }, ase: { tr: 'nötr, saat yönü 210–240°, hafif ilerlet: RA → SVC, LA', en: 'neutral, clockwise 210–240°, advance slightly: RA → SVC, LA' },
    motion: { tr: 'Saat yönünde devam edip hafif ilerletin: RA\'nın SVC\'ye açıldığı bileşke, LA arkada.', en: 'Continue clockwise and advance slightly: the RA opening into the SVC, the LA behind.' },
    required: ['svc', 'ra'], relations: [{ a: 'ra', b: 'svc', max: 0.15, note: { tr: 'SVC-RA bileşkesi', en: 'SVC-RA junction' } }], optional: ['la'], avoid: ['lv', 'rv', 'tricuspid'], source: ICE_SRC },
  // Left atrium (position 'la'): the catheter has crossed the septum through the fossa
  // (transseptal sheath or sheath-less over a wire in the left PVs) and sits in the mid LA.
  // The "tour" of Enriquez et al. (Heart Rhythm 2026, figures 2 and 3): from the LA home
  // view (LAA and mitral annulus) clockwise to the left veins, the mitral isthmus, the
  // posterior wall and oesophagus, the right veins and roof, the aortic valve and home again.
  { id: 'ice-la-home', position: 'la', title: { tr: 'LA ICE home (LAA + mitral anulus)', en: 'LA ICE home (LAA + mitral annulus)' }, ase: { tr: 'LA ortası, transdüser LAA\'ya; gerekirse hafif posterior büküm', en: 'mid LA, transducer toward the LAA; slight posterior tilt if needed' },
    motion: { tr: 'Septumu geçen kateter LA ortasında, transdüser LAA\'ya bakar: LAA ve mitral anulusun panoramik görünümü. LAA trombüsü her zaman bu görünümde dışlanır (sağdan dışlanmış olsa da).', en: 'The catheter across the septum sits in the mid LA, the transducer facing the LAA: a panoramic view of the LAA and the mitral annulus. Always exclude LAA thrombus in this view, even if it was ruled out from the right.' },
    required: ['la', 'laa', 'mitral'], minLength: { laa: 0.4 }, avoid: ['ra', 'tricuspid', 'rv'], source: ICE_LA_SRC },
  { id: 'ice-la-lspv', position: 'la', title: { tr: 'LA ICE sol üst PV + Coumadin sırtı', en: 'LA ICE left superior PV + Coumadin ridge' }, ase: { tr: 'home\'dan saat yönü, sağ büküm: LSPV, LAA ile arasında Coumadin sırtı', en: 'clockwise from home, right tilt: LSPV, the Coumadin ridge between it and the LAA' },
    motion: { tr: 'Home\'dan saat yönünde çevirip sağa bükün: sol üst pulmoner ven uzun ekseninde, LAA\'dan Coumadin (sol lateral) sırtıyla ayrılır.', en: 'Rotate clockwise from home and tilt right: the left superior vein in its long axis, separated from the LAA by the Coumadin (left lateral) ridge.' },
    required: ['la', 'lspv', 'laa'], relations: [ostium('lspv')], avoid: ['rspv', 'ripv', 'ra'], source: ICE_LA_SRC },
  { id: 'ice-la-lipv', position: 'la', title: { tr: 'LA ICE sol alt PV', en: 'LA ICE left inferior PV' }, ase: { tr: 'saat yönü, sol büküm: LIPV uzun eksen', en: 'clockwise, left tilt: LIPV long axis' },
    motion: { tr: 'Aynı rotasyonda sola bükün: sol alt pulmoner ven uzun ekseninde. Sağdan ICE venleri çoğunlukla kısa eksende gösterir; LA\'dan uzun eksen ablasyon için daha elverişlidir.', en: 'At the same rotation tilt left: the left inferior vein in its long axis. ICE from the right mostly shows the veins in short axis; the long axis from the LA suits ablation better.' },
    required: ['la', 'lipv'], relations: [ostium('lipv')], avoid: ['rspv', 'ripv', 'ra'], source: ICE_LA_SRC },
  { id: 'ice-la-mitral-isthmus', position: 'la', title: { tr: 'LA ICE mitral istmus', en: 'LA ICE mitral isthmus' }, ase: { tr: 'posterior büküm, sağ/sol büküm ile tarama: LIPV → mitral anulus; GCV ve Cx anulus tarafında', en: 'posterior flexion, scan with right/left tilt: LIPV → mitral annulus; GCV and Cx on the annular side' },
    motion: { tr: 'Posterior büküm verin: LIPV ağzından lateral mitral anulusa uzanan mitral istmus; anulus tarafında büyük kardiyak ven (CS) ve daha küçük sirkumfleks arter. Mitral istmus ablasyonunda kalınlık ve damar ilişkisi burada görülür; bazen özofagus da lateral LA boyunca seçilir.', en: 'Add posterior flexion: the mitral isthmus from the LIPV ostium to the lateral mitral annulus; on the annular side the great cardiac vein (CS) and the smaller circumflex artery. Its thickness and vessel relations for mitral isthmus ablation show here; sometimes the oesophagus too along the lateral LA.' },
    required: ['la', 'lipv', 'mitral'], optional: ['cs', 'lv', 'laa'], avoid: ['rspv', 'ripv', 'ra'], source: ICE_LA_SRC },
  { id: 'ice-la-posterior', position: 'la', title: { tr: 'LA ICE posterior duvar ve özofagus', en: 'LA ICE posterior wall and oesophagus' }, ase: { tr: 'hafif geri çek, saat yönü: posterior duvar, arkasında özofagus (omurga ile inen aort arasında)', en: 'withdraw slightly, clockwise: posterior wall, the oesophagus behind it (between the spine and the descending aorta)' },
    motion: { tr: 'Kateteri hafif geri çekip saat yönünde devam edin: LA posterior duvarı ve arkasındaki özofagus (şematik nokta). Duvar kalınlığı RF dozunu ayarlamaya yardım eder; duvarın arkasındaki karanlık boşluk oblik sinüstür.', en: 'Withdraw slightly and continue clockwise: the LA posterior wall and the oesophagus behind it (schematic point). The wall thickness helps titrate RF energy; the dark space behind the wall is the oblique sinus.' },
    required: ['la'], landmarks: ['oesophagus'], optional: ['lipv', 'ripv'], avoid: ['mitral', 'ra', 'tricuspid'], source: ICE_LA_SRC },
  { id: 'ice-la-ripv', position: 'la', title: { tr: 'LA ICE sağ alt PV', en: 'LA ICE right inferior PV' }, ase: { tr: 'saat yönü devam, gerekirse anterior büküm: RIPV', en: 'continue clockwise, anterior flexion if needed: RIPV' },
    motion: { tr: 'Saat yönünde devam edin: sağ alt pulmoner ven; transseptal yere ve LA boyutuna göre anterior büküm gerekebilir.', en: 'Continue clockwise: the right inferior vein; depending on the puncture site and LA size, anterior flexion may be needed.' },
    required: ['la', 'ripv'], relations: [ostium('ripv')], avoid: ['lspv', 'lipv', 'laa'], source: ICE_LA_SRC },
  { id: 'ice-la-rspv', position: 'la', title: { tr: 'LA ICE sağ üst PV + çatı', en: 'LA ICE right superior PV + roof' }, ase: { tr: 'saat yönü, gerekirse posterior büküm: RSPV, LA çatısı (Bachmann), sağ frenik sinir antrum boyunca', en: 'clockwise, posterior flexion if needed: RSPV, LA roof (Bachmann), the right phrenic nerve along the antrum' },
    motion: { tr: 'Saat yönünde daha: sağ üst pulmoner ven ve LA çatısı; Bachmann demetinin septal tarafı burada tanınır. Sağ frenik sinir çoğu hastada RSPV antrumu boyunca parlak (hiperekojen), ortası bazen koyu bir bant olarak görülür. Daha saat yönü SVC ve PA\'yı getirir.', en: 'More clockwise: the right superior vein and the LA roof; the septal aspect of Bachmann\'s bundle shows here. In most patients the right phrenic nerve is a bright (hyperechoic) band, sometimes with a dark centre, along the RSPV antrum. More clockwise brings in the SVC and PA.' },
    required: ['la', 'rspv'], relations: [ostium('rspv')], optional: ['svc', 'pa'], avoid: ['lspv', 'lipv', 'laa'], source: ICE_LA_SRC },
  { id: 'ice-la-aov', position: 'la', title: { tr: 'LA ICE aort kapağı kısa eksen', en: 'LA ICE aortic valve short axis' }, ase: { tr: 'saat yönü devam: çıkan aort, üst interatriyal bölge, AV kısa eksen (NCC anterior LA karşısında)', en: 'continue clockwise: ascending aorta, superior interatrial region, AV short axis (NCC opposite the anterior LA)' },
    motion: { tr: 'Turun sonunda (ya da home\'dan biraz saat yönü tersine; LAA kapatmada TEE 0° benzeri) aort kapağının kısa ekseni: NCC anterior LA\'nın karşısında, RCC RV çıkış yoluna, LCC ve sol ana koroner LAA\'ya komşu. Saat yönünde ~30° geri döndürmek home\'a getirir.', en: 'At the end of the tour (or a little counterclockwise from home; like TEE 0° in LAA closure) the aortic valve in short axis: the NCC opposite the anterior LA, the RCC next to the RV outflow tract, the LCC and left main next to the LAA. Rotating back ~30° clockwise returns to home.' },
    required: ['la', 'aortic-valve'], relations: [{ a: 'aortic-valve', b: 'la', max: 0.6, note: { tr: 'aort kökü LA\'nın önünde', en: 'aortic root in front of the LA' } }], optional: ['aorta'], avoid: ['lspv', 'lipv', 'rspv', 'ripv'], source: ICE_LA_SRC },
  // Left ventricle (position 'lv'): from the LA home view the catheter is turned toward the
  // mitral valve, flexed anteriorly and advanced across it into the basal LV, then the flexion
  // is released (Enriquez et al., Heart Rhythm 2026, figure 7). The atlas has one LV papillary
  // muscle (the inferior one), so the anterolateral papillary view is not separate.
  { id: 'ice-lv-inferior', position: 'lv', title: { tr: 'LV ICE inferior duvar + papiller kas', en: 'LV ICE inferior wall + papillary muscle' }, ase: { tr: 'LA home\'dan mitrale, anterior büküm, ilerlet, bükümü bırak', en: 'from LA home toward the MV, anterior flexion, advance, release' },
    motion: { tr: 'LA home\'dan kateteri saat yönü tersine mitral kapağa çevirin; kapak açıklığı net görülünce anterior büküm verip nazikçe bazal LV\'ye ilerletin, sonra bükümü bırakın: inferior LV duvarı ve posteromedial papiller kas. LV içinden papiller kaslar, trabekülasyonlar ve yalancı kordonlar yakın alanda görülür; kateter navigasyonunu kolaylaştırır.', en: 'From LA home turn the catheter counterclockwise toward the mitral valve; with the valve opening clearly in view, add anterior flexion, advance gently into the basal LV, then release the flexion: the inferior LV wall and the posteromedial papillary muscle. From inside the LV the papillary muscles, trabeculations and false tendons are near field, which helps catheter navigation.' },
    required: ['lv', 'lv-papillary'], parts: { lv: [['4', '10', '15']] }, avoid: ['ra', 'tricuspid', 'la'], source: ICE_LA_SRC },
  { id: 'ice-lv-septum', position: 'lv', title: { tr: 'LV ICE septum uzun eksen', en: 'LV ICE septum long axis' }, ase: { tr: 'inferior görünümden saat yönü tersine: IVS bazalden apekse, RV uzakta', en: 'counterclockwise from the inferior view: IVS from base to apex, RV far field' },
    motion: { tr: 'İnferior görünümden saat yönü tersine çevirin: interventriküler septum uzun ekseninde bazalden apekse, RV serbest duvarı uzak alanda. Duvar hareket bozuklukları, anevrizma ve septal ablasyon lezyonları burada izlenir; daha fazla çevirme inferoseptal çıkıntıyı gösterir.', en: 'Rotate counterclockwise from the inferior view: the interventricular septum in long axis from base to apex, the RV free wall in the far field. Wall motion abnormalities, aneurysms and septal ablation lesions are watched here; more rotation shows the inferoseptal process.' },
    required: ['lv', 'rv'], order: [['lv', 'rv']], parts: { lv: [['2', '3', '8', '9'], '14'] }, avoid: ['ra', 'la'], source: ICE_LA_SRC },
  { id: 'ice-lv-lateral', position: 'lv', title: { tr: 'LV ICE lateral duvar', en: 'LV ICE lateral wall' }, ase: { tr: 'saat yönü tersine, posterior ve sol büküm: lateral duvar, lateral mitral anulus altı', en: 'counterclockwise, posterior and left tilt: lateral wall, beneath the lateral mitral annulus' },
    motion: { tr: 'Saat yönü tersine çevirip posterior ve sola bükün: LV lateral duvarı ve lateral mitral anulusun altındaki bölge. Burada ekojenitesi artmış skar görülebilir; bu bulgu sağdan ICE ile görülemez.', en: 'Rotate counterclockwise and tilt posterior and left: the LV lateral wall and the region beneath the lateral mitral annulus. Scar with increased echogenicity may show here, a finding that right-sided ICE cannot show.' },
    required: ['lv'], parts: { lv: [['5', '6', '11', '12'], '16'] }, avoid: ['rv', 'ra', 'tricuspid'], source: ICE_LA_SRC },
  { id: 'ice-lv-lvot', position: 'lv', title: { tr: 'LV ICE septum ve LVOT', en: 'LV ICE septum and LVOT' }, ase: { tr: 'LV\'ye girişten hafif manevra: IVS ve LV çıkış yolu, aort kapağı', en: 'slight manoeuvring after entering the LV: IVS and LV outflow tract, aortic valve' },
    motion: { tr: 'LV\'ye girdikten sonra hafif manevrayla interventriküler septum ve LV çıkış yolu, ucunda aort kapağı görülür.', en: 'After entering the LV, slight manoeuvring shows the interventricular septum and the LV outflow tract, with the aortic valve at its end.' },
    required: ['lv', 'aortic-valve'], optional: ['mitral', 'aorta', 'rv'], avoid: ['ra', 'tricuspid'], source: ICE_LA_SRC }
]);

/** ICE catheter position of a view: the RA (default) or the LA after a transseptal crossing. */
export const icePosition = view => (view && view.position) || 'ra';

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

/**
 * ICE catheter path in the LA, after the septal crossing: the distal catheter
 * runs from the fossa ovalis toward the mitral annulus centre (advance 0..1
 * from the fossa to 1.6 times that distance; of the axes tried on this atlas,
 * this one gives the source's order of views with its knob directions); the home beam faces the LAA, and
 * `clockwise` turns it from the LAA toward the posterior (left veins, posterior
 * wall), as in the LA tour of Enriquez et al. (Heart Rhythm 2026, figure 3).
 * Null when the atlas has no measured fossa.
 */
export function iceLaPath(A) {
  if (!A.fossa) return null;
  const base = A.fossa.center;
  const top = addv(base, sub(A.mv.center, base), 1.6);
  const axis = normalize(sub(top, base));
  const home = inPlane(sub(A.laa ? A.laa.center : A.mv.center, A.la), axis);
  const posterior = [0, 0, -1];
  const clockwise = dot(rotate(home, axis, 30), posterior) >= dot(rotate(home, axis, -30), posterior) ? 1 : -1;
  return { base, top, home, clockwise, position: 'la' };
}

/**
 * ICE catheter path in the LV, after crossing the mitral valve: the distal
 * catheter runs from the mitral annulus centre toward the apex (advance 0..1
 * from the annulus to 1.2 times the annulus-to-apex length); the home beam
 * faces the inferior wall (atlas -y), and `clockwise` turns it toward the
 * lateral wall (patient left). Null without a measured fossa (the catheter
 * reaches the LV through the septum and the LA).
 */
export function iceLvPath(A) {
  if (!A.fossa) return null;
  const base = A.mv.center;
  const top = addv(base, sub(A.apex, base), 1.2);
  const axis = normalize(sub(top, base));
  const home = inPlane([0, -1, 0], axis);
  const left = [1, 0, 0];
  const clockwise = dot(rotate(home, axis, 30), left) >= dot(rotate(home, axis, -30), left) ? 1 : -1;
  return { base, top, home, clockwise, position: 'lv' };
}

// Atlas calibration of the ICE presets (scripts/ice-calibrate.cjs: the
// smallest departure from the source manoeuvre that meets the view's
// criteria at rest and through the beat). Knob signs as in iceFrame:
// anteroposterior - posterior, leftRight - right.
const ICE_CALIBRATION = Object.freeze({
  'ice-home': { advance: 0.6, rotation: 15, anteroposterior: 0, leftRight: 0 },
  'ice-rvot': { advance: 0.55, rotation: 40, anteroposterior: 0, leftRight: 0 },
  'ice-lvot': { advance: 0.55, rotation: 40, anteroposterior: 0, leftRight: 0 },
  'ice-mitral-laa': { advance: 0.55, rotation: 75, anteroposterior: 0, leftRight: 15 },
  'ice-left-pv': { advance: 0.7, rotation: 100, anteroposterior: 0, leftRight: -15 },
  'ice-septal-sax': { advance: 0.55, rotation: 125, anteroposterior: -30, leftRight: -45 },
  'ice-right-pv': { advance: 0.55, rotation: 160, anteroposterior: -30, leftRight: 0 },
  'ice-svc': { advance: 0.55, rotation: 210, anteroposterior: -45, leftRight: 0 },
  // LA (advance from the fossa toward the mitral annulus centre)
  'ice-la-home': { advance: 0.4, rotation: 5, anteroposterior: -30, leftRight: 0 },
  'ice-la-lspv': { advance: 0.45, rotation: 5, anteroposterior: 0, leftRight: -30 },
  'ice-la-lipv': { advance: 0.45, rotation: 85, anteroposterior: -15, leftRight: 15 },
  'ice-la-mitral-isthmus': { advance: 0.4, rotation: 55, anteroposterior: -45, leftRight: 0 },
  'ice-la-posterior': { advance: 0.4, rotation: 85, anteroposterior: 0, leftRight: 0 },
  'ice-la-ripv': { advance: 0.4, rotation: 125, anteroposterior: 0, leftRight: 0 },
  'ice-la-rspv': { advance: 0.4, rotation: 65, anteroposterior: 45, leftRight: 0 },
  'ice-la-aov': { advance: 0.4, rotation: -30, anteroposterior: 0, leftRight: 0 },
  // LV (advance from the mitral annulus toward the apex)
  'ice-lv-inferior': { advance: 0.2, rotation: 0, anteroposterior: -45, leftRight: 15 },
  'ice-lv-septum': { advance: 0.45, rotation: 210, anteroposterior: -15, leftRight: 0 },
  'ice-lv-lateral': { advance: 0.3, rotation: -15, anteroposterior: -45, leftRight: 15 },
  'ice-lv-lvot': { advance: 0.3, rotation: 210, anteroposterior: 0, leftRight: 0 }
});

/** Where an atlas preset departs from the source manoeuvre (shown next to the view). */
export const ICE_PRESET_NOTES = Object.freeze({
  'ice-lv-inferior': { tr: 'Atlas farkı: LV yolu mitral anulus merkezinden apekse şematik bir eksendir; inferior duvar segmentleri ve papiller kas birlikte ancak düğme sınırında posterior büküm (45°) ve hafif sol bükümle (15°) kesite giriyor; kaynakta büküm bırakılır.', en: 'Atlas difference: the LV path is a schematic axis from the mitral annulus centre toward the apex; the inferior wall segments and the papillary muscle enter the cut together only with posterior tilt at the knob limit (45°) and slight left tilt (15°); the source releases the flexion.' },
  'ice-lv-septum': { tr: 'Atlas notu: septum, inferior görünümden 150° saat yönü tersinde (döner sınır nedeniyle 210° saat yönü olarak); kaynakla aynı yön.', en: 'Atlas note: the septum lies 150° counterclockwise from the inferior view (reached as 210° clockwise because of the rotation limit); the same direction as the source.' },
  'ice-lv-lvot': { tr: 'Atlas notu: LVOT ve aort kapağı bu atlasta LV yolunun 210° saat yönündedir; kaynak yalnız "hafif manevra" der.', en: 'Atlas note: on this atlas the LVOT and aortic valve lie 210° clockwise on the LV path; the source only says "slight manoeuvring".' },
  'ice-la-home': { tr: 'Atlas notu: LA yolu fossadan mitral anulus merkezine doğru şematik bir eksendir; home için 30° posterior büküm gerekti (kaynak: transseptal yere göre posterior büküm gerekebilir).', en: 'Atlas note: the LA path is a schematic axis from the fossa toward the mitral annulus centre; home needed a 30° posterior tilt (the source: posterior tilt may be needed depending on the puncture site).' },
  'ice-la-lspv': { tr: 'Atlas notu: bu atlasta LSPV home rotasyonunda yalnız sağ bükümle (30°) geliyor; kaynakta önce saat yönü rotasyon.', en: 'Atlas note: on this atlas the LSPV comes in at the home rotation with right tilt alone (30°); the source rotates clockwise first.' },
  'ice-la-lipv': { tr: 'Atlas farkı: LIPV için 85° saat yönü ve hafif posterior büküm (15°) gerekti; sol büküm kaynakla aynı yönde (15°).', en: 'Atlas difference: the LIPV needed 85° clockwise and a slight posterior tilt (15°); the left tilt matches the source direction (15°).' },
  'ice-la-posterior': { tr: 'Atlas notu: özofagus, şematik TEE yolunun LA seviyesindeki noktasıdır; atlasta özofagus ve inen aort yoktur.', en: 'Atlas note: the oesophagus is the schematic TEE path\'s point at the LA level; the atlas has no oesophagus or descending aorta.' },
  'ice-la-rspv': { tr: 'Atlas farkı: RSPV bu atlasta RIPV\'den önce (65°) ve düğme sınırında anterior bükümle (45°) geliyor; kaynakta RIPV\'den sonra, gerekirse posterior bükümle.', en: 'Atlas difference: on this atlas the RSPV comes before the RIPV (65°) with anterior tilt at the knob limit (45°); the source has it after the RIPV, with posterior tilt if needed.' },
  'ice-la-aov': { tr: 'Atlas notu: aort kapağı kısa ekseni home\'dan 30° saat yönü tersinde (kaynağın LAA kapatma tarifiyle aynı yön); döner sınır nedeniyle turun sonundan değil.', en: 'Atlas note: the aortic valve short axis sits 30° counterclockwise from home (the direction of the source\'s LAA closure description), not at the end of the clockwise tour, because of the rotation limit.' },
  'ice-mitral-laa': { tr: 'Atlas farkı: LAA lobunun tanınabilir görünmesi için hafif sol büküm (15°) gerekti; kaynakta büküm nötr. Kaynaktaki "biraz ilerlet" bu atlasta uygulanmadı: ilerletme %55, home\'un (%60) biraz gerisinde.', en: 'Atlas difference: a slight left deflection (15°) was needed for a recognisable LAA lobe; the source keeps the knobs neutral. The source\'s "advance slightly" is not applied on this atlas: the advance is 55%, a little behind home (60%).' },
  'ice-left-pv': { tr: 'Atlas farkı: kateter daha yukarıda (ilerletme %70, kaynaktaki "yüksek RA") ve hafif sağ bükümle (15°).', en: 'Atlas difference: the catheter sits higher (advance 70%, the source\'s "high RA") with a slight right deflection (15°).' },
  'ice-septal-sax': { tr: 'Atlas notu: yön kaynakla aynı (posterior ve sağ büküm, saat yönü 125°); sağ büküm bu atlasta düğmenin sınırında (45°).', en: 'Atlas note: the direction matches the source (posterior and right deflection, clockwise 125°); the right deflection sits at the knob limit (45°) on this atlas.' },
  'ice-svc': { tr: 'Atlas farkı: atlastaki kateter ekseni doğrudan SVC\'ye baktığından düğme sınırında posterior büküm (45°) gerekti; kaynakta büküm nötr. Kaynaktaki "hafif ilerlet" bu atlasta uygulanmadı: ilerletme %55, home\'un (%60) biraz gerisinde.', en: 'Atlas difference: the atlas catheter axis points straight at the SVC, so a posterior deflection at the knob limit (45°) was needed; the source keeps the knobs neutral. The source\'s "advance slightly" is not applied on this atlas: the advance is 55%, a little behind home (60%).' }
});

/** Preset probe state of an ICE view (advance, rotation, deflections, depth). */
export function icePreset(id) {
  const c = ICE_CALIBRATION[id];
  return c ? { depth: 3.6, ...c } : null;
}
