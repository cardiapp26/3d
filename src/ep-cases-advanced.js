/*
 * Advanced electrophysiology cases (EasyECG report phase D,
 * research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md section 3): para-Hisian focal
 * atrial tachycardia, left posterior fascicular (verapamil-sensitive)
 * ventricular tachycardia and bundle branch reentry ventricular
 * tachycardia. Same contract as ep-cases.js: designed synthetic timings on
 * one millisecond timeline, calipers measured from the events, never a
 * clinical recording, never a decision rule. Mechanism, zone and
 * conduction stay separate axes; the 3D marker of the ventricular cases is
 * a schematic region (originRegion), not a mapped circuit.
 */
import { AH, HV, CH_LEGACY, CH_SVT, ev, far, mono, merge, hisPvcClip, sinusBeat, svtBeat, svtRun } from './ep-beats.js';
import { ref, cal } from './ep-caliper.js';
import { createPviState, pviRecording } from './pvi-model.js';

const DEFS = [];
const define = (def) => { DEFS.push(def); return def.id; };
const without = (events, channels) => Object.fromEntries(Object.entries(events).filter(([ch]) => !channels.includes(ch)));

// ---------------------------------------------------------------------------
// Para-Hisian focal AT (R16-R20). Long RP narrow QRS tachycardia whose
// earliest A sits at the His; the same baseline as a septal pathway or
// atypical AVNRT, separated by maneuvers (ventricular overdrive with VA
// dissociation, His-refractory PVC without effect). Treatment: the
// noncoronary cusp is mapped as the alternative to the right para-Hisian
// region (AV block neighbourhood); no ablation prescription.
// ---------------------------------------------------------------------------
const TCL_PAT = 420;
const AH_PAT = 135;
// Retrograde-looking offsets after the His-d V (the AT A arrives 240 ms after the V at this rate).
const A_PAT = { 'his-p': 238, 'his-d': 240, 'cs-910': 255, hra: 262, 'cs-56': 275, 'cs-12': 295 };
const CH_PAT_MAP = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-12', 'abl-d', 'rv'];

// Surface P for every His-p A (narrow bump just before the local A).
const pWaves = (events, ch = 'his-p', dt = -6) => ({ 'ecg-ii': (events[ch] || []).filter((e) => e.type === 'A').map((a) => mono('P', a.t + dt, 0.18, 7)) });

// One AT beat from the focus: atrial sequence from the His region; conducted when `conduct`.
// With the ABL in the NCC (`ncc`) the surface P sits 15 ms after the ABL A
// (R18, R19); otherwise it sits just before the His-p A.
function atBeat(a, { conduct = true, ncc = false } = {}) {
  const atrial = {
    'his-p': [ev('A', a - 2, 0.6)], 'his-d': [ev('A', a, 0.35)], 'cs-910': [ev('A', a + 15, 0.8)],
    hra: [ev('A', a + 22, 0.9)], 'cs-56': [ev('A', a + 35, 0.7)], 'cs-12': [ev('A', a + 55, 0.7)],
    'ecg-ii': [mono('P', ncc ? a + 11 : a - 6, 0.18, 7)],
    ...(ncc ? { 'abl-d': [ev('A', a - 4, 0.4)] } : {})
  };
  if (!conduct) return atrial;
  const v = a + AH_PAT + HV;
  // svtBeat already places the His at v - HV (= a + AH_PAT).
  return merge(atrial, svtBeat(v, {}, { ablV: ncc ? 30 : null }));
}

{
  const vs = [150, 570, 990, 1410];
  const events = svtRun(vs, A_PAT);
  define({
    id: 'pat-svt', caseId: 'at-parahisian', section: 'diagnosis', windowMs: 1850, channels: CH_SVT,
    events: merge(events, pWaves(events)),
    calipers: [
      cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
      cal('VA', ref('his-d', 'V', 1), ref('his-d', 'A', 1))
    ],
    teachingNumbers: { TCL: TCL_PAT, VA: 240 }
  });
}
{
  const clip = hisPvcClip(TCL_PAT, A_PAT, 0);
  define({
    id: 'pat-hispvc', caseId: 'at-parahisian', section: 'maneuver', maneuver: 'his-pvc', result: 'valid',
    // The AT A arrives up to 295 ms after the final V: widen the window past the generic clip.
    windowMs: clip.windowMs + 330, channels: CH_SVT, events: merge(clip.events, pWaves(clip.events)), markers: clip.markers,
    calipers: [
      cal('TCL', ref('cs-910', 'A', 0), ref('cs-910', 'A', 1)),
      cal('A-A', ref('cs-910', 'A', 1), ref('cs-910', 'A', 2))
    ],
    teachingNumbers: { TCL: TCL_PAT, 'A-A': TCL_PAT }
  });
}
{
  // Ventricular overdrive at 380 ms: the paced V's conceal into the node, the
  // atrial rate runs on unchanged (VA dissociation during pacing), and the
  // focus conducts again after the train. No V-A-V or A-A-V reading is needed.
  const pcl = 380;
  const stims = [330, 710, 1090, 1470];
  const as = [110, 530, 950, 1370, 1790];
  const paced = (s) => {
    const v = s + 10;
    return merge({
      rv: [ev('S', s, 0.5, 2), ev('V', v, 0.9)],
      'ecg-ii': [ev('V', v + 20, 0.9, 16)], 'ecg-v1': [ev('V', v + 20, -0.5, 16)],
      'his-p': [far('V', v + 25, 0.5, 10)], 'his-d': [far('V', v + 25, 0.6, 10)],
      'cs-910': [far('V', v + 30, 0.4, 10)], 'cs-56': [far('V', v + 33, 0.4, 10)], 'cs-12': [far('V', v + 35, 0.4, 10)]
    });
  };
  define({
    id: 'pat-vop-dissoc', caseId: 'at-parahisian', section: 'maneuver', maneuver: 'v-overdrive', result: 'valid',
    windowMs: 2150, channels: CH_SVT,
    events: merge(...stims.map(paced), ...as.map((a, i) => atBeat(a, { conduct: i === 0 || i === as.length - 1 }))),
    markers: stims.map((t, i) => ({ t, label: { tr: i ? 'S' : `S (RV, ${pcl} ms)`, en: i ? 'S' : `S (RV, ${pcl} ms)` } })),
    calipers: [
      cal('PCL', ref('rv', 'S', 0), ref('rv', 'S', 1), 'rv'),
      cal('A-A (pacing)', ref('his-p', 'A', 1), ref('his-p', 'A', 2)),
      cal('A-A (sonra)', ref('his-p', 'A', 3), ref('his-p', 'A', 4))
    ],
    teachingNumbers: { PCL: pcl, 'A-A (pacing)': TCL_PAT, 'A-A (sonra)': TCL_PAT }
  });
}
{
  // Mapping during AT with the ABL in the noncoronary cusp: its A precedes the
  // surface P by 15 ms and is as early as the right para-Hisian A (R18, R19).
  const as = [110, 530, 950, 1370];
  define({
    id: 'pat-ncc-map', caseId: 'at-parahisian', section: 'treatment', windowMs: 1750, channels: CH_PAT_MAP,
    events: merge(...as.map((a) => atBeat(a, { ncc: true }))),
    markers: [{ t: as[0] - 4, label: { tr: 'ABL: nonkoroner kusp', en: 'ABL: noncoronary cusp' } }],
    calipers: [
      cal('ABL A → P', ref('abl-d', 'A', 0), ref('ecg-ii', 'P', 0), 'ecg-ii'),
      cal('ABL A → His p A', ref('abl-d', 'A', 0), ref('his-p', 'A', 0), 'his-p')
    ],
    teachingNumbers: { 'ABL A → P': 15, 'ABL A → His p A': 2 }
  });
}
define({
  id: 'pat-post', caseId: 'at-parahisian', section: 'treatment', windowMs: 1300, channels: CH_LEGACY,
  events: merge(sinusBeat(100), sinusBeat(700)),
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0))
  ],
  teachingNumbers: { AH, HV }
});

// ---------------------------------------------------------------------------
// Left posterior fascicular VT (R21-R25, R29). RBBB-like, superior axis,
// relatively narrow QRS with AV dissociation; at the left posterior septum
// a diastolic Purkinje potential (P1, base to apex) and a presystolic one
// (P2, apex to base) precede the QRS; the His is activated retrogradely.
// Entrainment from the RV captures the P1 sequence at the paced cycle and
// the VT resumes at its own cycle length (reentry with an excitable gap).
// ---------------------------------------------------------------------------
const TCL_FVT = 340;
const QRS_H_FVT = 22;   // retrograde His after the VT QRS onset (His-d H at v + 22)
const CH_FVT = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-12', 'rv', 'lv-sep-b', 'lv-sep-a'];

// Dissociated sinus atrial activity (no AV conduction during the VT).
const sinusA = (t0) => ({
  'ecg-ii': [mono('P', t0, 0.22, 10)], hra: [ev('A', t0, 0.9)],
  'his-p': [ev('A', t0 + 33, 0.6)], 'his-d': [ev('A', t0 + 35, 0.35)],
  'cs-910': [ev('A', t0 + 45, 0.8)], 'cs-12': [ev('A', t0 + 75, 0.7)]
});

// Purkinje sequence of one VT cycle whose QRS onset is v: P1 base to apex in diastole, P2 apex to base presystolic.
const purkinje = (v) => ({
  'lv-sep-b': [ev('P1', v - 95, 0.35, 3), ev('P2', v - 12, 0.45, 3)],
  'lv-sep-a': [ev('P1', v - 70, 0.35, 3), ev('P2', v - 25, 0.5, 3)]
});

function fvtBeat(v) {
  return merge(purkinje(v), {
    'ecg-ii': [ev('V', v, -0.8, 12)], 'ecg-v1': [ev('V', v, 0.75, 12)],
    'lv-sep-a': [ev('V', v + 5, 0.9, 7)], 'lv-sep-b': [ev('V', v + 15, 0.8, 7)],
    'his-p': [far('V', v + 12, 0.5, 10), ev('H', v + QRS_H_FVT, 0.3, 4)], 'his-d': [far('V', v + 12, 0.6, 10), ev('H', v + QRS_H_FVT, 0.6, 4)],
    rv: [ev('V', v + 18, 0.9)], 'cs-910': [far('V', v + 20, 0.4, 8)], 'cs-12': [far('V', v + 28, 0.4, 8)]
  });
}

define({
  id: 'fvt-vt', caseId: 'fascicular-vt', section: 'diagnosis', windowMs: 1800, channels: CH_FVT,
  events: merge(...[200, 540, 880, 1220, 1560].map(fvtBeat), sinusA(120), sinusA(1000)),
  calipers: [
    cal('TCL', ref('lv-sep-a', 'V', 1), ref('lv-sep-a', 'V', 2)),
    cal('P1 → QRS', ref('lv-sep-b', 'P1', 1), ref('ecg-ii', 'V', 1), 'lv-sep-b'),
    // His after the QRS onset during VT (retrograde His): V on the surface to His-d H.
    cal('QRS → H (VT)', ref('ecg-ii', 'V', 1), ref('his-d', 'H', 1), 'his-d'),
    cal('A-A (sinüs)', ref('hra', 'A', 0), ref('hra', 'A', 1), 'hra')
  ],
  teachingNumbers: { TCL: TCL_FVT, 'P1 → QRS': 95, 'QRS → H (VT)': QRS_H_FVT, 'A-A (sinüs)': 880 }
});
{
  // Entrainment from the RV apex at 310 ms. Each stimulus resets the circuit:
  // P1 keeps its base-to-apex order at the paced cycle, the QRS is fused, and
  // after the last stimulus the circuit completes one lap (P1, P2, QRS) and
  // the VT resumes at 340 ms. PPI at the RV exceeds the TCL (RV is outside the circuit).
  const pcl = 310;
  const stims = [760, 1070, 1380, 1690, 2000];
  // lap: the reset circuit lap (P1, P2) after this stimulus; the final lap's
  // QRS is the resumed VT beat itself, so the last stimulus adds no lap.
  const pacedCycle = (s, lap) => merge(lap ? purkinje(s + 380) : {}, {
    rv: [ev('S', s, 0.5, 2), ev('V', s + 8, 0.9)],
    'ecg-ii': [ev('V', s + 25, -0.55, 15)], 'ecg-v1': [ev('V', s + 25, 0.4, 15)],
    'his-p': [far('V', s + 30, 0.5, 10)], 'his-d': [far('V', s + 30, 0.6, 10)],
    'cs-910': [far('V', s + 32, 0.4, 8)], 'cs-12': [far('V', s + 40, 0.4, 8)],
    'lv-sep-a': [ev('V', s + 60, 0.8, 7)], 'lv-sep-b': [ev('V', s + 70, 0.7, 7)]
  });
  const last = stims[stims.length - 1];
  const resume = last + 380;
  define({
    id: 'fvt-entrain', caseId: 'fascicular-vt', section: 'maneuver', maneuver: 'entrain-rv', result: 'valid',
    windowMs: 3000, channels: CH_FVT,
    events: merge(fvtBeat(200), fvtBeat(540), sinusA(120), sinusA(1000), sinusA(1880), sinusA(2760),
      ...stims.map((t, i) => pacedCycle(t, i < stims.length - 1)), fvtBeat(resume), fvtBeat(resume + TCL_FVT)),
    markers: stims.map((t, i) => ({ t, label: { tr: i ? 'S' : `S (RV apeks, ${pcl} ms)`, en: i ? 'S' : `S (RV apex, ${pcl} ms)` } })),
    calipers: [
      cal('P1-P1 (pacing)', ref('lv-sep-b', 'P1', 2), ref('lv-sep-b', 'P1', 3)),
      cal('PPI', ref('rv', 'S', stims.length - 1), ref('rv', 'V', stims.length + 2), 'rv'),
      cal('P1-P1 (sonra)', ref('lv-sep-b', 'P1', 6), ref('lv-sep-b', 'P1', 7)),
      cal('TCL', ref('lv-sep-a', 'V', 7), ref('lv-sep-a', 'V', 8))
    ],
    teachingNumbers: { 'P1-P1 (pacing)': pcl, PPI: 398, 'P1-P1 (sonra)': TCL_FVT, TCL: TCL_FVT }
  });
}
{
  // Sinus rhythm after ablation at the P1 site: the septal catheter records
  // the antegrade Purkinje potential (base before apex) ahead of the local V.
  const beat = (t0) => {
    const v = t0 + 35 + AH + HV;
    return merge(without(sinusBeat(t0), ['abl-d']), {
      'lv-sep-b': [ev('Pk', v - 18, 0.3, 3), ev('V', v + 8, 0.8, 7)],
      'lv-sep-a': [ev('Pk', v - 10, 0.3, 3), ev('V', v + 3, 0.9, 7)],
      rv: [ev('V', v + 2, 0.9)]
    });
  };
  define({
    id: 'fvt-post', caseId: 'fascicular-vt', section: 'treatment', windowMs: 1500, channels: CH_FVT,
    events: merge(beat(100), beat(800)),
    calipers: [
      cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0)),
      cal('Pk → V (LVS)', ref('lv-sep-b', 'Pk', 0), ref('lv-sep-b', 'V', 0))
    ],
    teachingNumbers: { HV, 'Pk → V (LVS)': 26 }
  });
}

// ---------------------------------------------------------------------------
// Bundle branch reentry VT (R26-R28). Sinus rhythm with an intraventricular
// conduction defect and a prolonged HV; LBBB-type wide QRS tachycardia with
// AV dissociation, a His and a right bundle potential before every V, and
// H-H changes that precede the V-V changes. After right bundle ablation the
// sinus QRS shows RBBB and the HV is longer; interfascicular reentry can
// follow (the treatment pitfall).
// ---------------------------------------------------------------------------
const CH_BBR = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'rb', 'cs-910', 'cs-12', 'rv'];
const AH_BBR = 100;

function bbrSinus(t0, { hv = 85, rbb = false } = {}) {
  const h = t0 + 35 + AH_BBR;
  const v = h + hv;
  return {
    'ecg-ii': [mono('P', t0, 0.22, 10), ev('V', v, 0.8, 13)],
    'ecg-v1': [rbb ? ev('V', v + 10, 0.7, 16) : ev('V', v, -0.5, 13)],
    hra: [ev('A', t0, 0.9), far('V', v + 10, 0.22)],
    'his-p': [ev('A', t0 + 33, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7, 6)],
    'his-d': [ev('A', t0 + 35, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    rb: [...(rbb ? [] : [ev('RB', h + 25, 0.45, 3)]), ev('V', v + 6, 0.7, 7)],
    'cs-910': [ev('A', t0 + 45, 0.8), far('V', v + 15, 0.45, 6)],
    'cs-12': [ev('A', t0 + 75, 0.7), far('V', v + 25, 0.5, 6)],
    rv: [ev('V', rbb ? v + 40 : v + 10, 0.9)]
  };
}

// One VT beat: H, then the right bundle potential, then the LBBB-type QRS (RV first).
function bbrBeat(h, hv = 95) {
  const v = h + hv;
  return {
    'ecg-ii': [ev('V', v, 0.7, 15)], 'ecg-v1': [ev('V', v, -0.75, 15)],
    'his-p': [ev('H', h, 0.35, 4), far('V', v + 10, 0.5, 10)], 'his-d': [ev('H', h, 0.75, 4), far('V', v + 10, 0.6, 10)],
    rb: [ev('RB', h + 30, 0.5, 3), ev('V', v + 2, 0.8, 7)],
    rv: [ev('V', v + 5, 0.9)], hra: [far('V', v + 12, 0.2)],
    'cs-910': [far('V', v + 18, 0.4, 8)], 'cs-12': [far('V', v + 26, 0.4, 8)]
  };
}

define({
  id: 'bbr-sinus', caseId: 'bbr-vt', section: 'diagnosis', windowMs: 1500, channels: CH_BBR,
  events: merge(bbrSinus(100), bbrSinus(1000)),
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0)),
    cal('H → RB', ref('his-d', 'H', 0), ref('rb', 'RB', 0), 'rb')
  ],
  teachingNumbers: { AH: AH_BBR, HV: 85, 'H → RB': 25 }
});
define({
  id: 'bbr-vt', caseId: 'bbr-vt', section: 'diagnosis', windowMs: 1800, channels: CH_BBR,
  events: merge(...[250, 570, 890, 1210, 1530].map((h) => bbrBeat(h)), sinusA(120), sinusA(1020)),
  calipers: [
    cal('TCL', ref('rv', 'V', 1), ref('rv', 'V', 2), 'rv'),
    cal('HV (VT)', ref('his-d', 'H', 1), ref('ecg-ii', 'V', 1), 'his-d'),
    cal('H → RB', ref('his-d', 'H', 1), ref('rb', 'RB', 1), 'rb'),
    cal('A-A (sinüs)', ref('hra', 'A', 0), ref('hra', 'A', 1), 'hra')
  ],
  teachingNumbers: { TCL: 320, 'HV (VT)': 95, 'H → RB': 30, 'A-A (sinüs)': 900 }
});
define({
  id: 'bbr-hh-vv', caseId: 'bbr-vt', section: 'diagnosis', windowMs: 1800, channels: CH_BBR,
  // Cycle length wobble: the H-H change of one cycle is reproduced by the V-V of the same cycle (the His leads).
  events: merge(...[200, 520, 870, 1160, 1480].map((h) => bbrBeat(h)), sinusA(60), sinusA(960)),
  calipers: [
    cal('H-H (1)', ref('his-d', 'H', 1), ref('his-d', 'H', 2)),
    cal('V-V (1)', ref('rv', 'V', 1), ref('rv', 'V', 2), 'rv'),
    cal('H-H (2)', ref('his-d', 'H', 2), ref('his-d', 'H', 3)),
    cal('V-V (2)', ref('rv', 'V', 2), ref('rv', 'V', 3), 'rv')
  ],
  teachingNumbers: { 'H-H (1)': 350, 'V-V (1)': 350, 'H-H (2)': 290, 'V-V (2)': 290 }
});
define({
  id: 'bbr-post', caseId: 'bbr-vt', section: 'treatment', windowMs: 1500, channels: CH_BBR,
  events: merge(bbrSinus(100, { hv: 100, rbb: true }), bbrSinus(1000, { hv: 100, rbb: true })),
  markers: [{ t: 100 + 35 + AH_BBR + 25, label: { tr: 'RB potansiyeli yok', en: 'no RB potential' } }],
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0))
  ],
  teachingNumbers: { AH: AH_BBR, HV: 100 }
});

// ---------------------------------------------------------------------------
// AF with pulmonary vein triggers (R29-R31). The diagnosis clip is the
// baseline of the interactive PVI exercise: AF on the surface and atrial
// channels, near-field PV potentials on the Lasso channel. The Treatment tab
// hosts the interactive ring exercise (ep-pvi-panel.js, pvi-lab.js).
// ---------------------------------------------------------------------------
{
  const base = pviRecording(createPviState(), 'lspv');
  define({
    id: 'af-pvi-baseline', caseId: 'af-pvi', section: 'diagnosis',
    windowMs: base.windowMs, channels: base.channels, events: base.events,
    markers: base.markers, calipers: base.calipers,
    teachingNumbers: { 'RR (1)': 340, 'RR (2)': 420, 'PV-PV': 150 }
  });
}

/** Recording definitions of the advanced cases (merged into the catalog by ep-cases.js). */
export const ADVANCED_DEFS = DEFS;

/**
 * Advanced case entries. originRegion names the schematic 3D region marker of
 * a ventricular case (ep-zones.js); the pathwayZone keeps the zone text.
 */
export const ADVANCED_CASES = [
  { id: 'at-parahisian', mechanism: 'focal-at', pathwayZone: 'superior-paraseptal', conduction: ['atrial-focus'], citations: ['R16', 'R17', 'R18', 'R19', 'R20'] },
  { id: 'fascicular-vt', mechanism: 'fascicular-reentry', pathwayZone: 'lv-posterior-septum', originRegion: 'lv-posterior-septum', conduction: ['ventricular-reentry'], citations: ['R21', 'R22', 'R23', 'R24', 'R25'] },
  { id: 'bbr-vt', mechanism: 'bundle-branch-reentry', pathwayZone: 'right-bundle', originRegion: 'right-bundle', conduction: ['his-purkinje-macroreentry'], citations: ['R26', 'R27', 'R28'] },
  { id: 'af-pvi', mechanism: 'af-pv-triggers', pathwayZone: 'pv-antrum', conduction: ['af'], citations: ['R29', 'R30', 'R31'] }
];
