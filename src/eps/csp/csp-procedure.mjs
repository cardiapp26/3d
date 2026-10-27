/** LBBAP implant procedure on top of the CSP signal model (csp-model.mjs).
 * Original teaching model: the operator chooses a septal site in RAO, torques the sheath in
 * LAO until it is perpendicular to the septum, then screws the lead in turn by turn while
 * the live recording changes. Physical state (site, sheath angle, depth in mm) maps to the
 * model's entry / angle / depth; every number here is a teaching parameter, not device or
 * patient data. Pure functions: each action returns a new procedure and its events.
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

/** Signal-model options for the current physical state. */
export function modelOf(proc) {
  const { lbb } = anatomyOf(proc);
  const offset = offsetOf(proc.sheath);
  const access = Math.max(0, Math.abs(proc.level - lbb) - SITE_WINDOW) * 1.3 + Math.abs(offset) * .6;
  return normalize({
    caseId: proc.caseId, entry: .5 + clamp(access, 0, .5), angle: Math.min(90, Math.abs(proc.sheath)),
    depth: proc.depthMm / thicknessOf(proc), level: proc.level, offset,
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
  const depth = proc.depthMm / thicknessOf(proc);
  if (proc.depthMm > LOCKED_MM) return depth >= .8 ? 3 : 2;
  const { lbb } = anatomyOf(proc);
  return offsetOf(proc.sheath) !== 0 || Math.abs(proc.sheath) > 25 || Math.abs(proc.level - lbb) > .15 ? 0 : 1;
}

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
      const n = action.turns === 3 ? 3 : 1;
      const angle = Math.abs(proc.sheath);
      const drilling = angle > DRILL_ANGLE;
      const grip = (drilling ? .1 : Math.cos((angle * Math.PI) / 180) ** 2) * (proc.caseId === 'scar' ? .55 : 1);
      const depthMm = proc.depthMm + n * MM_PER_TURN * grip;
      const before = proc.depthMm / thickness, after = depthMm / thickness;
      const events = [event('rotate', { turns: n, depthMm })];
      if (drilling || grip < .3) events.push(event('drilling'));
      // Fixation beats: ectopy from the helix while it works through the septum.
      const fixation = after > .35 && after < 1 ? proc.fixation + n : proc.fixation;
      const rbbbFixation = proc.rbbbFixation || (after >= .7 && after < 1);
      if (after >= 1 && before < 1) events.push(event('perforation'));
      return { proc: { ...proc, depthMm, turns: proc.turns + n, fixation, rbbbFixation, accepted: false }, events };
    }
    case 'unscrew': {
      if (!locked) return { proc, events: [] };
      const depthMm = Math.max(0, proc.depthMm - MM_PER_TURN / 2);
      const events = [event('unscrew', { depthMm })];
      if (proc.depthMm >= thickness && depthMm < thickness) events.push(event('withdrawn'));
      return { proc: { ...proc, depthMm, turns: Math.max(0, proc.turns - .5), accepted: false }, events };
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
    case 'consumeFixation':
      return { proc: { ...proc, fixation: Math.max(0, proc.fixation - 1) }, events: [] };
    case 'accept': {
      const depth = proc.depthMm / thickness;
      if (depth >= 1 || depth < .6) return { proc, events: [event('acceptRefused')] };
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

// Waveform reading for the criteria: a terminal positive deflection after the QRS nadir in V1.
function terminalR(result) {
  const qrs = result.metrics.qrsDuration;
  if (!qrs) return null;
  const v1 = result.leads.V1, start = 55, end = Math.min(v1.length - 1, 50 + qrs + 12);
  let nadir = start;
  for (let i = start; i <= end; i++) if (v1[i] < v1[nadir]) nadir = i;
  let after = 0;
  for (let i = nadir; i <= end; i++) after = Math.max(after, v1[i]);
  return after > .12 && v1[nadir] < -.1;
}

/**
 * Capture criteria read from the current recording and the test log (EHRA 2023 / ESC 2025 framing;
 * cut-offs as used for teaching here). status: met, likely, not, untested.
 */
export function criteria(result, proc, test = null) {
  const m = result.metrics;
  const paced = proc.pacing && m.qrsDuration != null;
  const grade = (value, met, likely, below = true) => value == null || !paced ? 'untested'
    : (below ? value < met : value > met) ? 'met' : (below ? value < likely : value > likely) ? 'likely' : 'not';
  const transitions = test?.transitions || [];
  const rPrime = paced ? terminalR(result) : null;
  return [
    { id: 'terminalR', group: 'depth', status: paced ? (rPrime ? 'met' : 'not') : 'untested' },
    { id: 'v6Rwpt', group: 'proof', status: grade(m.v6Rwpt, 75, 85), value: m.v6Rwpt, unit: 'ms' },
    // The V1 peak is the terminal r': without it the interval measures nothing.
    { id: 'interpeak', group: 'proof', status: rPrime ? grade(m.interpeak, 44, 33, false) : 'untested', value: rPrime ? m.interpeak : null, unit: 'ms' },
    { id: 'transition', group: 'proof', status: test?.done ? (transitions.some(t => !t.loss) ? 'met' : 'not') : 'untested', value: transitions.filter(t => !t.loss).length },
    { id: 'fixation', group: 'support', status: proc.rbbbFixation ? 'met' : 'untested' },
    // Impedance and current of injury only mean something once the helix is in the septum.
    { id: 'safety', group: 'safety', status: proc.depthMm <= LOCKED_MM ? 'untested' : m.impedance < 450 || m.coi < .25 ? 'not' : 'met', value: m.impedance, unit: 'Ω' }
  ];
}

/** One line of guidance for the current state (key into csp-text guide). */
export function guidance(proc, result, list) {
  const depth = proc.depthMm / thicknessOf(proc);
  const offset = offsetOf(proc.sheath);
  const { lbb } = anatomyOf(proc);
  const ok = id => list.find(c => c.id === id)?.status === 'met';
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
  if (result.metrics.impedance < 450) return { key: 'impedanceDrop', tone: 'warn' };
  if (Math.abs(proc.sheath) > DRILL_ANGLE) return { key: 'drilling', tone: 'warn' };
  if (depth < .5) return { key: 'keepTurning', tone: 'info' };
  if (depth < .8) return { key: 'watchV1', tone: 'info' };
  if (ok('v6Rwpt') && ok('interpeak')) return { key: ok('transition') ? 'acceptable' : 'confirmTest', tone: 'ok' };
  if (ok('terminalR')) return { key: 'lvsp', tone: 'info' };
  return { key: 'deepNoProof', tone: 'info' };
}

// Waveform signature after the stimulus (same as csp-model evidence): I, V1 and V6.
const signature = r => ['I', 'V1', 'V6'].flatMap(key => r.leads[key].slice(55, 251));
const rms = (a, b) => Math.sqrt(a.reduce((sum, x, j) => sum + (x - b[j]) ** 2, 0) / a.length);

/** Live threshold test: output steps down every `beatsPerStep` paced beats. */
export function startThreshold(proc) {
  return { kind: 'threshold', output: Math.max(proc.output, 3), beat: 0, beatsPerStep: 3, rows: [], transitions: [], done: false, threshold: null, restore: proc.output };
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
  if (previous && !loss && rms(previous.signature, row.signature) > .015) {
    const dv6 = previous.metrics.v6Rwpt != null && r.metrics.v6Rwpt != null ? r.metrics.v6Rwpt - previous.metrics.v6Rwpt : null;
    transitions.push({ from: previous.output, to: test.output, dv6, loss: false });
    events.push({ type: 'transition', from: previous.output, to: test.output, dv6 });
  }
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
  const met = id => list.find(c => c.id === id)?.status === 'met';
  const proof = ['v6Rwpt', 'interpeak', 'transition'].filter(met).length;
  const depth = proc.depthMm / thicknessOf(proc);
  return {
    capture: result.capture.type, turns: proc.turns, depthMm: Math.round(proc.depthMm * 10) / 10,
    threshold: test?.threshold ?? null, proof, perforated: depth >= 1,
    verdict: depth >= 1 ? 'perforated' : proof >= 2 ? 'lbbp' : met('terminalR') ? 'lvsp' : 'septal'
  };
}
