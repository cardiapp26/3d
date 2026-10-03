import { SIM_CASES, simMeasures } from './ep-maneuver-sim.js';
import { svtRun } from './ep-beats.js';
import { ref, cal, measure } from './ep-cases.js';

/*
 * Narrow QRS tachycardia task (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md,
 * phase B; rules and sources: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md). The
 * case is hidden; the learner reads the tachycardia recording and delivers
 * maneuvers (ep-maneuver-sim.js). Every piece of evidence is classified
 * against each candidate mechanism from its measured events: supports,
 * against (argues against, does not exclude), neutral (does not exclude) or
 * uninterpretable. Nothing turns one observation into a diagnosis; an invalid
 * precondition (no capture, His not refractory, pacing not faster than the
 * tachycardia, termination, direct atrial capture) classifies as
 * uninterpretable for every mechanism. Pure and deterministic.
 */

export const TASK_CASES = Object.freeze(['avnrt-typical', 'avnrt-atypical', 'ap-left-lateral', 'ap-inf-paraseptal', 'ap-parahisian', 'pjrt', 'focal-at']);
export const MECHANISMS = Object.freeze(['avnrt-typical', 'avnrt-atypical', 'avrt', 'pjrt', 'focal-at']);
export const EVIDENCE_STATES = Object.freeze(['supports', 'against', 'neutral', 'uninterpretable']);
/** Mechanism of each task case (PJRT is an orthodromic AVRT over a decremental pathway). */
export const TASK_ANSWER = Object.freeze({
  'avnrt-typical': 'avnrt-typical', 'avnrt-atypical': 'avnrt-atypical', 'ap-left-lateral': 'avrt',
  'ap-inf-paraseptal': 'avrt', 'ap-parahisian': 'avrt', pjrt: 'pjrt', 'focal-at': 'focal-at'
});
/** Septal VA below this argues against an orthodromic AVRT (source B1). */
export const SEPTAL_VA = 70;
/** Classic ventricular overdrive values from the septal pathway comparison (source R12); not strict cutoffs. */
export const PPI_TCL = 115;
export const SA_VA = 85;

const ECCENTRIC = Object.freeze(['cs-12', 'cs-34', 'cs-56']);
const CS_OSTIUM = Object.freeze(['cs-910', 'abl-d']);
const HIS = Object.freeze(['his-p', 'his-d']);

const all = (state) => Object.fromEntries(MECHANISMS.map((m) => [m, state]));

/** Deterministic order of the task cases for a seed (mulberry32 shuffle). */
export function taskOrder(seed = 1) {
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...TASK_CASES];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The roving ablation catheter is not placed yet: its position at the target would give the answer away.
const channelsOf = (model) => model.channels.filter((ch) => ch !== 'abl-d');

/** Earliest atrial channel of a case's retrograde (or focal) sequence among the recorded channels. */
function earliestChannel(model) {
  const channels = channelsOf(model);
  return Object.entries(model.a).filter(([ch]) => channels.includes(ch)).reduce((best, e) => (e[1] < best[1] ? e : best))[0];
}

/**
 * The tachycardia recording of a hidden case: four beats, with TCL, septal
 * VA (His channel) and VA to the earliest A measured from the events.
 */
export function taskBaseline(caseId) {
  const model = SIM_CASES[caseId];
  if (!model) return null;
  const vs = [150, 150 + model.tcl, 150 + 2 * model.tcl, 150 + 3 * model.tcl];
  const channels = channelsOf(model);
  const offsets = Object.fromEntries(Object.entries(model.a).filter(([ch]) => channels.includes(ch)));
  const events = svtRun(vs, offsets);
  const first = earliestChannel(model);
  const calipers = [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA (His)', ref('his-d', 'V', 1), ref('his-d', 'A', 1), 'his-d'),
    ...(first !== 'his-d' ? [cal('VA (min)', ref('his-d', 'V', 1), ref(first, 'A', 1), first)] : [])
  ];
  return deepFreeze({
    id: `task:${caseId}:baseline`, caseId, section: 'diagnosis', lab: 'task', maneuver: null,
    channels, markers: [], calipers, windowMs: vs[3] + Math.max(...Object.values(offsets)) + 120,
    events, result: null, reason: 'baseline', earliest: first, teachingNumbers: {}, simulated: true
  });
}

/**
 * A recording as the task shows it: the roving ablation catheter removed from
 * the channels, the events and the calipers (its presence or position would
 * give the case away), tagged lab 'task'.
 */
export function taskView(recording) {
  if (!recording) return null;
  const events = Object.fromEntries(Object.entries(recording.events).filter(([ch]) => ch !== 'abl-d'));
  const calipers = recording.calipers.filter((c) => c.a.ch !== 'abl-d' && c.b.ch !== 'abl-d');
  return deepFreeze({ ...recording, lab: 'task', channels: recording.channels.filter((ch) => ch !== 'abl-d'), events, calipers });
}

function baselineEvidence(recording) {
  const m = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  const va = m['VA (His)'];
  const first = recording.earliest;
  const states = all('neutral');
  const notes = [];
  if (va < SEPTAL_VA) {
    Object.assign(states, { 'avnrt-typical': 'supports', 'avnrt-atypical': 'against', avrt: 'against', pjrt: 'against' });
    notes.push('shortSeptalVa');
  } else {
    states['avnrt-typical'] = 'against';
    notes.push('septalVaLong');
  }
  if (ECCENTRIC.includes(first)) {
    states.avrt = 'supports';
    notes.push('eccentric');
  } else if (first === 'hra') {
    Object.assign(states, { 'focal-at': 'supports', 'avnrt-atypical': 'against', pjrt: 'against' });
    notes.push('hraEarliest');
  } else if (va >= SEPTAL_VA && CS_OSTIUM.includes(first)) {
    notes.push('csOstiumTrap');
  } else if (va >= SEPTAL_VA && HIS.includes(first)) {
    notes.push('septalEarliest');
  }
  return { kind: 'baseline', measures: m, first, states, notes };
}

function maneuverEvidence(recording) {
  const m = simMeasures(recording);
  const reason = recording.reason;
  const states = all('neutral');
  const notes = [reason];
  if (recording.result !== 'valid') return { kind: recording.maneuver, measures: m, states: all('uninterpretable'), notes };
  if (recording.maneuver === 'his-pvc') {
    if (reason === 'aAdvanced') Object.assign(states, { avrt: 'supports', 'avnrt-typical': 'against', 'avnrt-atypical': 'against' });
    if (reason === 'aDelayed') Object.assign(states, { pjrt: 'supports', 'avnrt-typical': 'against', 'avnrt-atypical': 'against' });
  } else if (recording.maneuver === 'v-overdrive') {
    if (reason === 'AAV') Object.assign(states, { 'focal-at': 'supports', 'avnrt-typical': 'against', 'avnrt-atypical': 'against', avrt: 'against', pjrt: 'against' });
    if (reason === 'VAV') {
      states['focal-at'] = 'against';
      const ppi = m.PPI - m.TCL, sava = m.SA - m.VA;
      if (ppi > PPI_TCL && sava > SA_VA) {
        Object.assign(states, { 'avnrt-typical': 'supports', 'avnrt-atypical': 'supports', avrt: 'against', pjrt: 'against' });
        notes.push('overdriveNodal');
      } else if (ppi <= PPI_TCL && sava <= SA_VA) {
        Object.assign(states, { avrt: 'supports', pjrt: 'supports', 'avnrt-typical': 'against', 'avnrt-atypical': 'against' });
        notes.push('overdrivePathway');
      } else {
        notes.push('overdriveMixed');
      }
    }
  } else if (recording.maneuver === 'para-his') {
    if (reason === 'extranodal') states.avrt = 'supports';
  }
  return { kind: recording.maneuver, measures: m, states, notes };
}

/** Classify one task recording (the baseline or a delivered maneuver). */
export function classifyEvidence(recording) {
  if (!recording) return null;
  return recording.reason === 'baseline' ? baselineEvidence(recording) : maneuverEvidence(recording);
}

/**
 * Grade the learner's mechanism: 'correct', 'partial' (orthodromic AVRT for
 * PJRT: right family, the decremental pathway not named) or 'incorrect';
 * support: how many pieces of evidence supported the true mechanism.
 */
export function gradeTask(caseId, answer, evidence = []) {
  const key = TASK_ANSWER[caseId];
  const grade = answer === key ? 'correct' : key === 'pjrt' && answer === 'avrt' ? 'partial' : 'incorrect';
  const support = evidence.filter((e) => e?.states?.[key] === 'supports').length;
  const against = evidence.filter((e) => e?.states?.[key] === 'against').length;
  return { key, grade, support, against };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
