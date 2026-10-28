/** LBBAP implant procedure on top of the CSP signal model (csp-model.mjs).
 * Original teaching model: the operator chooses a septal site in RAO, torques the sheath in
 * LAO until it is perpendicular to the septum, then screws the lead in turn by turn while
 * the live recording changes. Physical state (site, sheath angle, depth in mm) maps to the
 * model's entry / angle / depth; every number here is a teaching parameter, not device or
 * patient data. Pure functions: each action returns a new procedure and its events.
 *
 * One confirmation rule (EHRA 2023 framing) is shared by the guidance, the accept gate, the
 * summary and the blind assessment: conduction-system capture is definitive with any one of
 * a unipolar output or S2 transition, Stim-V6RWPT at or under 74 ms, or a V6-V1 interpeak
 * over 44 ms. The grey bands (75-85 ms, 33-44 ms) are supportive only.
 */
import { normalize, simulate } from './csp-model.mjs';

// Per teaching case: septal thickness and where the left bundle lies on the His-apex line (0 His, 1 apex).
export const ANATOMY = Object.freeze({
  baseline: { septumMm: 12, lbb: .3 },
  slow: { septumMm: 13, lbb: .32 },
  equal: { septumMm: 11, lbb: .28 },
  scar: { septumMm: 14, lbb: .3 }
});
export const HIS_APEX_MM = 70;          // His to RV apex along the RAO line
export const FREE_WALL_MM = 5;          // RV free wall: a lead screwed in there perforates early
export const MM_PER_TURN = 1.4;         // full engagement, sheath perpendicular
export const LV_DEPTH = .78;            // depth ratio of the LV septal layer: terminal r', LV septal capture, confirm stage
export const RAPID_LIMIT = .5;          // three turns at once only above this much wall left
export const CUTOFFS = Object.freeze({
  v6Met: 74, v6Likely: 85,              // Stim-V6RWPT (ms), narrow QRS or isolated RBBB
  interpeakMet: 44, interpeakLikely: 33, // V6-V1 interpeak (ms)
  deltaV6Lvsp: 10,                      // V6RWPT prolongation that marks a drop to LV septal capture
  latencyStep: 12,                      // isoelectric interval gained when capture becomes selective
  thresholdMax: 1.5, outputMargin: 2,   // acceptance: threshold (V at .5 ms) and programmed output over it
  impedanceMin: 450, coiMin: 3          // safety (ohm, mV)
});
const DRILL_ANGLE = 55;                 // beyond this the helix spins in place
const SITE_WINDOW = .08;                // level distance from the LBB with full access
const LOCKED_MM = .05;                  // screwed in: site and sheath no longer move

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const anatomyOf = proc => ANATOMY[proc.caseId] || ANATOMY.baseline;

/** Off the septum: sheath torqued too far clockwise (anterior free wall) or counter-clockwise (posterior). */
export function offsetOf(sheath) {
  if (sheath < -35) return -clamp((-sheath - 35) / 25, 0, 1);
  if (sheath > 45) return clamp((sheath - 45) / 25, 0, 1);
  return 0;
}
export const thicknessOf = proc => (Math.abs(offsetOf(proc.sheath)) > .5 ? FREE_WALL_MM : anatomyOf(proc).septumMm);
export const depthRatio = proc => proc.depthMm / thicknessOf(proc);

/** Signal-model options for the current physical state. */
export function modelOf(proc) {
  const { lbb } = anatomyOf(proc);
  const offset = offsetOf(proc.sheath);
  const access = Math.max(0, Math.abs(proc.level - lbb) - SITE_WINDOW) * 1.3 + Math.abs(offset) * .6;
  return normalize({
    caseId: proc.caseId, entry: .5 + clamp(access, 0, .5), angle: Math.min(90, Math.abs(proc.sheath)),
    depth: depthRatio(proc), level: proc.level, offset,
    output: proc.output, pulseWidth: proc.pulseWidth, polarity: proc.polarity, rate: proc.rate, pacing: proc.pacing, s2: null
  });
}

export function initialProcedure(caseId = 'baseline') {
  return {
    caseId: ANATOMY[caseId] ? caseId : 'baseline',
    level: .55, sheath: -50, depthMm: 0, turns: 0,         // start: mid RV, sheath anterior (on the free wall)
    output: 2.5, pulseWidth: .5, polarity: 'uni', rate: 90, pacing: true,
    accepted: false, fixation: 0, rbbbFixation: false
  };
}

/** Procedure step: 0 target, 1 pace map, 2 penetrate, 3 confirm, 4 accepted. */
export function stageOf(proc) {
  if (proc.accepted) return 4;
  if (proc.depthMm > LOCKED_MM) return depthRatio(proc) >= LV_DEPTH ? 3 : 2;
  const { lbb } = anatomyOf(proc);
  return offsetOf(proc.sheath) !== 0 || Math.abs(proc.sheath) > 25 || Math.abs(proc.level - lbb) > .15 ? 0 : 1;
}

/** Three turns at once are a shallow-wall shortcut: from the deep septum the helix must go one turn at a time. */
export const rapidAllowed = proc => depthRatio(proc) < RAPID_LIMIT;

const event = (type, params = {}) => ({ type, ...params });

/**
 * @param {object} proc procedure state
 * @param {{ type: string, [key: string]: any }} action
 * @returns {{ proc: object, events: object[] }}
 */
export function act(proc, action) {
  const locked = proc.depthMm > LOCKED_MM;
  const thickness = thicknessOf(proc);
  switch (action?.type) {
    case 'site': {
      if (locked) return { proc, events: [event('locked')] };
      return { proc: { ...proc, level: clamp(Number(action.level) || 0, 0, 1) }, events: [] };
    }
    case 'torque': {
      if (locked) return { proc, events: [event('locked')] };
      const sheath = clamp(proc.sheath + Number(action.delta || 0), -80, 80);
      return { proc: { ...proc, sheath }, events: [event('torque', { sheath })] };
    }
    case 'rotate': {
      const n = action.turns === 3 && rapidAllowed(proc) ? 3 : 1;
      const angle = Math.abs(proc.sheath);
      const drilling = angle > DRILL_ANGLE;
      const grip = (drilling ? .1 : Math.cos((angle * Math.PI) / 180) ** 2) * (proc.caseId === 'scar' ? .55 : 1);
      const depthMm = proc.depthMm + n * MM_PER_TURN * grip;
      const before = proc.depthMm / thickness, after = depthMm / thickness;
      const events = [event('rotate', { turns: n, depthMm })];
      if (drilling || grip < .3) events.push(event('drilling'));
      // Ectopy from the helix working through the septum: beats pending for the live recording.
      const fixation = after > .35 && after < 1 ? proc.fixation + n : proc.fixation;
      if (after >= 1 && before < 1) events.push(event('perforation'));
      return { proc: { ...proc, depthMm, turns: proc.turns + n, fixation, accepted: false }, events };
    }
    case 'consumeFixation': {
      // A fixation beat was recorded; near the left bundle it carries the RBBB pattern.
      const ratio = depthRatio(proc);
      const rbbb = ratio >= .7 && ratio < 1;
      return { proc: { ...proc, fixation: Math.max(0, proc.fixation - 1), rbbbFixation: proc.rbbbFixation || rbbb }, events: [event(rbbb ? 'fixationRbbb' : 'fixation')] };
    }
    case 'unscrew': {
      if (!locked) return { proc, events: [] };
      const depthMm = Math.max(0, proc.depthMm - MM_PER_TURN / 2);
      const events = [event('unscrew', { depthMm })];
      if (proc.depthMm >= thickness && depthMm < thickness) events.push(event('withdrawn'));
      // Backing out leaves the helix in new tissue: the fixation evidence belongs to the old position.
      return { proc: { ...proc, depthMm, turns: Math.max(0, proc.turns - .5), fixation: 0, rbbbFixation: false, accepted: false }, events };
    }
    case 'reposition':
      return { proc: { ...proc, depthMm: 0, turns: 0, fixation: 0, rbbbFixation: false, accepted: false }, events: [event('reposition')] };
    case 'pacing':
      return { proc: { ...proc, pacing: Boolean(action.on) }, events: [event(action.on ? 'pacingOn' : 'pacingOff')] };
    case 'output': {
      const output = Math.round(clamp(Number(action.value), 0, 8) * 100) / 100;
      return Number.isFinite(output) ? { proc: { ...proc, output }, events: [] } : { proc, events: [] };
    }
    case 'set':   // instructor shortcuts and console settings (already validated by the caller)
      return { proc: { ...proc, ...action.values }, events: [] };
    case 'accept': {
      const ratio = proc.depthMm / thickness;
      const reasons = [...new Set([...(ratio >= 1 || ratio < LV_DEPTH ? ['depth'] : []), ...(Array.isArray(action.reasons) ? action.reasons : [])])];
      if (reasons.length) return { proc, events: [event('acceptRefused', { reasons })] };
      return { proc: { ...proc, accepted: true }, events: [event('accepted')] };
    }
    default:
      return { proc, events: [] };
  }
}

/** Physical state back from model values set directly (instructor sliders). */
export function fromModel(proc, values) {
  const out = { ...proc };
  if (Number.isFinite(values.angle)) out.sheath = (proc.sheath < 0 ? -1 : 1) * clamp(values.angle, 0, 80);
  if (Number.isFinite(values.depth)) out.depthMm = Math.max(0, values.depth) * thicknessOf(out);
  if (Number.isFinite(values.level)) out.level = clamp(values.level, 0, 1);
  return out;
}

/** Distance (mm) from the His along the RAO line. */
export const mmFromHis = proc => Math.round(proc.level * HIS_APEX_MM);

// Waveform reading for the criteria: a positive deflection in the last fifth of the QRS in V1,
// after a negative main deflection (Qr, rSR'). The mid-QRS notch of the pace map does not count.
function terminalR(result) {
  const qrs = result.metrics.qrsDuration;
  if (!qrs) return null;
  const v1 = result.leads.V1, start = 55, tail = Math.round(50 + qrs * .78), end = Math.min(v1.length - 1, 50 + qrs + 12);
  let nadir = start;
  for (let i = start; i <= tail; i++) if (v1[i] < v1[nadir]) nadir = i;
  let after = 0;
  for (let i = tail; i <= end; i++) after = Math.max(after, v1[i]);
  return after > .15 && v1[nadir] < -.1;
}

// ---- Transitions between test rows (waveform-derived, no capture labels) ----
const signature = r => ['I', 'V1', 'V6'].flatMap(key => r.leads[key].slice(55, 251));
const rms = (a, b) => Math.sqrt(a.reduce((sum, x, j) => sum + (x - b[j]) ** 2, 0) / a.length);
const delta = (a, b) => (a != null && b != null ? b - a : null);

/**
 * Morphology change between two consecutive rows of a decremental test. Kinds: toLvsp (V6RWPT
 * prolongs by 10 ms or more: conduction capture lost, myocardium kept), toSelective (V6RWPT
 * unchanged, an isoelectric interval appears before the local EGM), other (anodal to cathodal
 * and the like). Only unipolar toLvsp / toSelective transitions prove conduction-system capture.
 */
export function classifyTransition(prev, row, polarity = 'uni') {
  if (!prev || prev.metrics.qrsDuration == null || row.metrics.qrsDuration == null) return null;
  if (!Array.isArray(prev.signature) || !Array.isArray(row.signature) || rms(prev.signature, row.signature) <= .015) return null;
  const dv6 = delta(prev.metrics.v6Rwpt, row.metrics.v6Rwpt), dLatency = delta(prev.metrics.latency, row.metrics.latency);
  let kind = 'other';
  if (dv6 != null && dv6 >= CUTOFFS.deltaV6Lvsp) kind = 'toLvsp';
  else if (dv6 != null && Math.abs(dv6) < CUTOFFS.deltaV6Lvsp && dLatency != null && dLatency >= CUTOFFS.latencyStep) kind = 'toSelective';
  return { from: prev.output ?? prev.s2, to: row.output ?? row.s2, dv6, dLatency, kind, proof: kind !== 'other' && polarity === 'uni', loss: false };
}
export function transitionsOf(rows, polarity = 'uni') {
  const out = [];
  for (let i = 1; i < rows.length; i++) { const t = classifyTransition(rows[i - 1], rows[i], polarity); if (t) out.push(t); }
  return out;
}
/** A finished test from sweep rows (analysis page): the same shape as the live threshold test. */
export function testFromRows(kind, rows, polarity = 'uni') {
  const captured = rows.filter(r => r.metrics.qrsDuration != null);
  const threshold = kind === 'threshold' && captured.length && captured.length < rows.length ? captured.at(-1).output : null;
  return { kind, rows, transitions: transitionsOf(rows, polarity), done: true, threshold, polarity, beat: 0 };
}

/**
 * Capture criteria read from the current recording and the test log. status: met (definitive),
 * likely (supportive grey band), not, untested.
 */
export function criteria(result, proc, test = null) {
  const m = result.metrics;
  const paced = proc.pacing && m.qrsDuration != null;
  const rPrime = paced ? terminalR(result) : null;
  const v6 = !paced || m.v6Rwpt == null ? 'untested' : m.v6Rwpt <= CUTOFFS.v6Met ? 'met' : m.v6Rwpt <= CUTOFFS.v6Likely ? 'likely' : 'not';
  const ip = !rPrime || m.interpeak == null ? 'untested' : m.interpeak > CUTOFFS.interpeakMet ? 'met' : m.interpeak >= CUTOFFS.interpeakLikely ? 'likely' : 'not';
  const transition = !test?.done ? 'untested' : test.polarity !== 'uni' ? 'untested' : (test.transitions || []).some(t => t.proof) ? 'met' : 'not';
  const ratio = depthRatio(proc);
  const safety = proc.depthMm <= LOCKED_MM ? 'untested' : m.impedance < CUTOFFS.impedanceMin || (ratio > .5 && m.coi < CUTOFFS.coiMin) ? 'not' : 'met';
  return [
    { id: 'terminalR', group: 'depth', status: paced ? (rPrime ? 'met' : 'not') : 'untested' },
    { id: 'v6Rwpt', group: 'proof', status: v6, value: m.v6Rwpt, unit: 'ms' },
    { id: 'interpeak', group: 'proof', status: ip, value: rPrime ? m.interpeak : null, unit: 'ms' },
    { id: 'transition', group: 'proof', status: transition, value: (test?.transitions || []).filter(t => t.proof).length },
    { id: 'fixation', group: 'support', status: proc.rbbbFixation ? 'met' : 'untested' },
    { id: 'safety', group: 'safety', status: safety, value: m.impedance, unit: 'Ω' }
  ];
}

/** The single confirmation rule: any definitive proof criterion. */
export function confirmation(list) {
  const proof = list.filter(c => c.group === 'proof');
  const by = proof.filter(c => c.status === 'met').map(c => c.id), supportive = proof.filter(c => c.status === 'likely').map(c => c.id);
  return { definitive: by.length > 0, by, supportive };
}

/** Why the lead cannot be accepted yet (empty: it can). */
export function acceptCheck(proc, list, test) {
  const ratio = depthRatio(proc), reasons = [];
  if (ratio >= 1 || ratio < LV_DEPTH) reasons.push('depth');
  if (proc.polarity !== 'uni') reasons.push('polarity');
  if (test?.threshold == null) reasons.push('threshold');
  else {
    if (test.threshold > CUTOFFS.thresholdMax) reasons.push('thresholdHigh');
    if (proc.output < CUTOFFS.outputMargin * test.threshold) reasons.push('margin');
  }
  if (!confirmation(list).definitive) reasons.push('proof');
  return reasons;
}

/** One line of guidance for the current state (key into the console text). */
export function guidance(proc, result, list, test = null) {
  const ratio = depthRatio(proc);
  const offset = offsetOf(proc.sheath);
  const { lbb } = anatomyOf(proc);
  const conf = confirmation(list);
  const met = id => list.find(c => c.id === id)?.status === 'met';
  if (result.capture.type === 'perforation') return { key: 'perforation', tone: 'warn' };
  if (proc.accepted) return { key: 'accepted', tone: 'ok' };
  if (proc.depthMm <= LOCKED_MM) {
    if (offset < 0) return { key: 'offAnterior', tone: 'warn' };
    if (offset > 0) return { key: 'offPosterior', tone: 'warn' };
    if (Math.abs(proc.sheath) > 25) return { key: proc.sheath < 0 ? 'turnCcw' : 'turnCw', tone: 'info' };
    if (proc.level < lbb - .15) return { key: 'tooHigh', tone: 'info' };
    if (proc.level > lbb + .15) return { key: 'tooLow', tone: 'info' };
    return { key: 'paceMapOk', tone: 'ok' };
  }
  if (result.metrics.impedance < CUTOFFS.impedanceMin) return { key: 'impedanceDrop', tone: 'warn' };
  if (Math.abs(proc.sheath) > DRILL_ANGLE) return { key: 'drilling', tone: 'warn' };
  if (ratio < .5) return { key: 'keepTurning', tone: 'info' };
  if (ratio < LV_DEPTH) return { key: 'watchV1', tone: 'info' };
  if (conf.definitive) return { key: test?.threshold != null ? (acceptCheck(proc, list, test).length ? 'fixSettings' : 'acceptable') : 'confirmTest', tone: 'ok' };
  if (conf.supportive.length) return { key: 'likelyTest', tone: 'info' };
  if (met('terminalR')) return { key: 'lvsp', tone: 'info' };
  return { key: 'deepNoProof', tone: 'info' };
}

/** Live threshold test: unipolar output steps down every `beatsPerStep` paced beats. */
export function startThreshold(proc) {
  return { kind: 'threshold', output: Math.max(proc.output, 3), beat: 0, beatsPerStep: 3, rows: [], transitions: [], done: false, threshold: null, restore: proc.output, polarity: proc.polarity };
}

/** Advance the test by one paced beat at `options`; returns the next test and its events. */
export function thresholdBeat(test, options) {
  if (!test || test.done) return { test, events: [] };
  const beat = test.beat + 1;
  if (beat < test.beatsPerStep) return { test: { ...test, beat }, events: [] };
  const r = simulate({ ...options, output: test.output, pacing: true, s2: null });
  const row = { output: test.output, capture: r.capture, metrics: r.metrics, signature: signature(r) };
  const previous = test.rows.at(-1);
  const events = [];
  const transitions = [...test.transitions];
  const loss = r.metrics.qrsDuration == null;
  const t = classifyTransition(previous, row, test.polarity);
  if (t) { transitions.push(t); events.push({ type: 'transition', ...t }); }
  const rows = [...test.rows, row];
  if (loss || test.output <= .1) {
    const threshold = loss ? previous?.output ?? null : test.output;
    events.push({ type: 'thresholdDone', threshold });
    return { test: { ...test, beat: 0, rows, transitions, done: true, threshold }, events };
  }
  const step = test.output > 1.5 ? .25 : .1;
  return { test: { ...test, beat: 0, rows, transitions, output: Math.round((test.output - step) * 100) / 100 }, events };
}

/** End-of-case summary (teaching score, not a competence measure). */
export function summary(proc, result, list, test) {
  const conf = confirmation(list), ratio = depthRatio(proc);
  const met = id => list.find(c => c.id === id)?.status === 'met';
  return {
    capture: result.capture.type, turns: proc.turns, depthMm: Math.round(proc.depthMm * 10) / 10,
    threshold: test?.threshold ?? null, proof: conf.by.length, by: conf.by, perforated: ratio >= 1,
    verdict: ratio >= 1 ? 'perforated' : conf.definitive ? 'lbbp' : met('terminalR') ? 'lvsp' : 'septal'
  };
}
