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
import { normalize, simulate, sanitizeParams, paramsOf, v6CutoffsOf, CASE_PARAMS, LV_SEPTAL_DEPTH, IMPEDANCE } from './csp-model.mjs';

// Per teaching case: septal thickness and where the left bundle lies on the His-apex line (0 His, 1 apex).
// stall: a scar island (depth ratio band at the left bundle level) where the helix spins without advancing.
// grip: advance per turn as a share of the full engagement (scarred septum: the helix bites poorly).
export const ANATOMY = Object.freeze({
  baseline: { septumMm: 12, lbb: .3 },
  random: { septumMm: 12, lbb: .3 },
  slow: { septumMm: 13, lbb: .32 },
  equal: { septumMm: 11, lbb: .28 },
  scar: { septumMm: 14, lbb: .3, grip: .55 },
  selective: { septumMm: 12, lbb: .29 },
  invertedErp: { septumMm: 12, lbb: .31 },
  dilated: { septumMm: 11, lbb: .34 },
  lbbHigh: { septumMm: 12, lbb: .3 },
  stall: { septumMm: 12, lbb: .3, stall: { from: .4, to: .62, half: .06 } },
  snd: { septumMm: 12, lbb: .3 },
  lbbb: { septumMm: 13, lbb: .33 },
  lbbbScar: { septumMm: 14, lbb: .32, grip: .7 },
  rbbb: { septumMm: 12, lbb: .3 },
  fusion: { septumMm: 12, lbb: .3 },
  bump: { septumMm: 13, lbb: .32 }
});
const STALL_GRIP = .05;
// Heart position: shifts the left bundle level and the sheath angle that is perpendicular to the septum (ideal, degrees).
export const HEARTS = Object.freeze({
  horizontal: { lbbShift: -.03, ideal: 15, septumShift: 1 },
  compact: { lbbShift: 0, ideal: 0, septumShift: 0 },
  vertical: { lbbShift: .03, ideal: -10, septumShift: -1 }
});
export const LEAD_TYPES = Object.freeze(['lumenless', 'stylet']);
const NO_SUPPORT_GRIP = .5;  // stylet-driven lead without forward support
const BUMP_LEVEL = .05;      // manipulation this much basal of the left bundle level (toward the His) can bump the right bundle
const BUMPED = Object.freeze({ rhythm: 'escapeWide', intrinsicRate: 30 });   // after the bump: complete block, slow wide escape
export const FUSION_LIMIT = .2;   // beyond this share the timing criteria are not readable

/** Deterministic pseudo-random numbers for the random patient (mulberry32). */
function rng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const between = (r, lo, hi, digits = 2) => Math.round((lo + r() * (hi - lo)) * 10 ** digits) / 10 ** digits;
/** A random patient: its tissue parameters and anatomy from one seed (reproducible). */
export function randomPatient(seed) {
  const r = rng(seed);
  const ratio = r() < .3 ? between(r, 1.1, 1.7) : r() < .2 ? null : between(r, .3, .9);
  const rhythm = ['escape', 'sinus', 'lbbb', 'rbbb'][Math.floor(r() * 4)];
  const intrinsicRate = rhythm === 'escape' ? between(r, 32, 48, 0) : between(r, 48, 80, 0);
  const params = sanitizeParams({ scar: between(r, 1, 1.5), ratio, slowMs: between(r, 0, 18, 0), muscleERP: between(r, 215, 275, 0), conductionERP: between(r, 215, 330, 0), v6Offset: between(r, 0, 16, 0), interpeakShift: between(r, -6, 4, 0), access: r() > .1, rhythm, intrinsicRate });
  const anatomy = Object.freeze({ septumMm: between(r, 10, 14, 0), lbb: between(r, .26, .36) });
  return { params, anatomy };
}
export const HIS_APEX_MM = 70;          // His to RV apex along the RAO line
export const FREE_WALL_MM = 5;          // RV free wall: a lead screwed in there perforates early
export const MM_PER_TURN = 1.4;         // full engagement, sheath perpendicular
export const LV_DEPTH = LV_SEPTAL_DEPTH; // depth ratio of the LV septal layer: terminal r', LV septal capture, confirm stage
export const NEXT_TURN_MAX = .97;       // one more turn is suggested only if it keeps the tip short of this depth ratio
export const SEPTAL_POS_SPAN = 35;      // sheath degrees from the perpendicular that move the tip from mid to anterior/posterior septum
export const RAPID_LIMIT = .5;          // three turns at once only above this much wall left
export const CUTOFFS = Object.freeze({
  v6Met: 74, v6Likely: 85,              // Stim-V6RWPT (ms), narrow QRS or isolated RBBB
  interpeakMet: 44, interpeakLikely: 33, // V6-V1 interpeak (ms)
  deltaV6Lvsp: 10,                      // V6RWPT prolongation that marks a drop to LV septal capture
  latencyStep: 12,                      // isoelectric interval gained when capture becomes selective
  thresholdMax: 1.5, outputMargin: 2,   // acceptance: threshold (V at .5 ms) and programmed output over it
  impedanceMin: 450, coiMin: 3,         // safety (ohm, mV); the COI floor applies beyond half the wall
  coiFromRatio: .5,
  impedanceFall: 100,                   // ohm below the highest impedance of this position: the tip nears the LV side
  potentialMatch: 10                    // ms: LBB potential-V6RWPT equal to the paced Stim-V6RWPT within this
});
const DRILL_ANGLE = 55;                 // beyond this the helix spins in place
const SITE_WINDOW = .08;                // level distance from the LBB with full access
const LOCKED_MM = .05;                  // screwed in: site and sheath no longer move

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
/** Anatomy of the case or random patient, adjusted for the heart position. */
export function anatomyOf(proc) {
  const base = proc.anatomy || ANATOMY[proc.caseId] || ANATOMY.baseline;
  const heart = HEARTS[proc.heart] || HEARTS.compact;
  return { ...base, septumMm: base.septumMm + heart.septumShift, lbb: clamp(base.lbb + heart.lbbShift, .1, .6), ideal: heart.ideal };
}
/** Sheath angle perpendicular to this heart's septum (degrees). */
export const idealAngleOf = proc => (HEARTS[proc.heart] || HEARTS.compact).ideal;
/** Sheath angle relative to the septal normal: 0 is perpendicular, negative clockwise (anterior). */
export const relAngle = proc => proc.sheath - idealAngleOf(proc);

/** Off the septum: sheath torqued too far clockwise (anterior free wall) or counter-clockwise (posterior). */
export function offsetOf(sheath) {
  if (sheath < -35) return -clamp((-sheath - 35) / 25, 0, 1);
  if (sheath > 45) return clamp((sheath - 45) / 25, 0, 1);
  return 0;
}
export const thicknessOf = proc => (Math.abs(offsetOf(relAngle(proc))) > .5 ? FREE_WALL_MM : anatomyOf(proc).septumMm);
export const depthRatio = proc => proc.depthMm / thicknessOf(proc);

/** Where the tip meets the septum: -1 anterior (sheath clockwise) .. +1 posterior; 0 off the septum. */
export const septalPosOf = proc => (offsetOf(relAngle(proc)) !== 0 ? 0 : clamp(relAngle(proc) / SEPTAL_POS_SPAN, -1, 1));

/** Tissue parameters in force: the case's or the random patient's, with the bumped right bundle applied. */
export function paramsFor(proc) {
  const base = proc.params || CASE_PARAMS[proc.caseId] || CASE_PARAMS.baseline;
  return proc.bumped ? sanitizeParams({ ...base, ...BUMPED }) : proc.params || null;
}
/** Signal-model options for the current physical state. */
export function modelOf(proc) {
  const { lbb } = anatomyOf(proc);
  const offset = offsetOf(relAngle(proc));
  const access = Math.max(0, Math.abs(proc.level - lbb) - SITE_WINDOW) * 1.3 + Math.abs(offset) * .6;
  return normalize({
    caseId: proc.caseId, entry: .5 + clamp(access, 0, .5), angle: Math.min(90, Math.abs(relAngle(proc))),
    depth: depthRatio(proc), level: proc.level, offset, septalPos: septalPosOf(proc), params: paramsFor(proc),
    output: proc.output, pulseWidth: proc.pulseWidth, polarity: proc.polarity, rate: proc.rate, pacing: proc.pacing, s2: null
  });
}

/** @param {number} [seed] random patient only: the draw to reproduce */
export function initialProcedure(caseId = 'baseline', seed = 1, { heart = 'compact', lead = 'lumenless' } = {}) {
  const id = ANATOMY[caseId] ? caseId : 'baseline';
  const patient = id === 'random' ? randomPatient(seed) : {};
  const ideal = (HEARTS[heart] || HEARTS.compact).ideal;
  return {
    caseId: id, seed: id === 'random' ? seed : null, params: patient.params || null, anatomy: patient.anatomy || null,
    heart: HEARTS[heart] ? heart : 'compact', lead: LEAD_TYPES.includes(lead) ? lead : 'lumenless', forwardSupport: true,
    level: .55, sheath: ideal - 50, depthMm: 0, turns: 0,   // start: mid RV, sheath anterior (on the free wall)
    output: 2.5, pulseWidth: .5, polarity: 'uni', rate: 90, pacing: true,
    accepted: false, fixation: 0, rbbbFixation: false, stalls: 0, bumped: false, peakImpedance: 0, lbbPotential: null,
    thresholds: null, rWave: null, slack: 'right', finish: {}
  };
}
/** Basal manipulation in a trauma case injures the right bundle: one event, then complete block. */
function bumpOf(proc, events) {
  const cp = proc.params || CASE_PARAMS[proc.caseId] || CASE_PARAMS.baseline;
  if (!cp.trauma || proc.bumped || proc.level >= anatomyOf(proc).lbb - BUMP_LEVEL) return proc;
  events.push(event('rbbBump'));
  return { ...proc, bumped: true };
}

const FIXATION_OUTPUT = 8;   // fixation beats: ectopy from the helix, as strong as a high-output beat
const gripOf = proc => anatomyOf(proc).grip ?? 1;
/** Highest impedance seen at this position (a fall from it warns before perforation). */
function withPeakImpedance(proc) {
  if (proc.depthMm <= LOCKED_MM || depthRatio(proc) >= 1) return proc;
  return { ...proc, peakImpedance: Math.max(proc.peakImpedance || 0, simulate(modelOf(proc)).metrics.impedance) };
}
/** Depth ratio after one more full turn at this sheath angle. */
export function nextTurnRatio(proc) {
  const angle = Math.abs(relAngle(proc)), grip = (angle > DRILL_ANGLE ? .1 : Math.cos((angle * Math.PI) / 180) ** 2) * gripOf(proc);
  return (proc.depthMm + MM_PER_TURN * grip) / thicknessOf(proc);
}

/** Procedure step: 0 target, 1 pace map, 2 penetrate, 3 confirm, 4 accepted. */
export function stageOf(proc) {
  if (proc.accepted) return 4;
  if (proc.depthMm > LOCKED_MM) return depthRatio(proc) >= LV_DEPTH ? 3 : 2;
  const { lbb } = anatomyOf(proc), angle = relAngle(proc);
  return offsetOf(angle) !== 0 || Math.abs(angle) > 25 || Math.abs(proc.level - lbb) > .15 ? 0 : 1;
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
      const events = [event('torque', { sheath })];
      return { proc: bumpOf({ ...proc, sheath }, events), events };
    }
    case 'rotate': {
      const n = action.turns === 3 && rapidAllowed(proc) ? 3 : 1;
      const angle = Math.abs(relAngle(proc));
      const drilling = angle > DRILL_ANGLE;
      const before = proc.depthMm / thickness;
      const { lbb, stall } = anatomyOf(proc);
      const stalled = Boolean(stall) && Math.abs(proc.level - lbb) < stall.half && before >= stall.from && before < stall.to;
      const unsupported = proc.lead === 'stylet' && !proc.forwardSupport;
      const grip = (drilling ? .1 : Math.cos((angle * Math.PI) / 180) ** 2) * gripOf(proc) * (stalled ? STALL_GRIP : 1) * (unsupported ? NO_SUPPORT_GRIP : 1);
      const depthMm = proc.depthMm + n * MM_PER_TURN * grip;
      const after = depthMm / thickness;
      const events = [event('rotate', { turns: n, depthMm })];
      if (stalled) events.push(event('stall'));
      else if (drilling || grip < .3) events.push(event('drilling'));
      else if (unsupported) events.push(event('noSupport'));
      // Ectopy from the helix working through the septum: beats pending for the live recording.
      const fixation = after > .35 && after < 1 ? proc.fixation + n : proc.fixation;
      if (after >= 1 && before < 1) events.push(event('perforation'));
      const next = { ...proc, depthMm, turns: proc.turns + n, fixation, accepted: false, stalls: stalled ? proc.stalls + n : 0, lbbPotential: null };
      return { proc: bumpOf(withPeakImpedance(next), events), events };
    }
    case 'consumeFixation': {
      // A fixation beat was recorded: it carries the RBBB pattern when that beat shows a terminal r' in V1.
      const rbbb = depthRatio(proc) < 1 && terminalR(simulate({ ...modelOf(proc), output: FIXATION_OUTPUT, pacing: true })) === true;
      return { proc: { ...proc, fixation: Math.max(0, proc.fixation - 1), rbbbFixation: proc.rbbbFixation || rbbb }, events: [event(rbbb ? 'fixationRbbb' : 'fixation')] };
    }
    case 'unscrew': {
      if (!locked) return { proc, events: [] };
      const depthMm = Math.max(0, proc.depthMm - MM_PER_TURN / 2);
      const events = [event('unscrew', { depthMm })];
      if (proc.depthMm >= thickness && depthMm < thickness) events.push(event('withdrawn'));
      // Backing out leaves the helix in new tissue: the fixation evidence belongs to the old position.
      return { proc: { ...proc, depthMm, turns: Math.max(0, proc.turns - .5), fixation: 0, rbbbFixation: false, accepted: false, lbbPotential: null }, events };
    }
    case 'reposition':
      return { proc: { ...proc, depthMm: 0, turns: 0, fixation: 0, rbbbFixation: false, accepted: false, stalls: 0, peakImpedance: 0, lbbPotential: null }, events: [event('reposition')] };
    case 'pacing': {
      // Pacing off with the lead fixed records the intrinsic R wave on the tip.
      const rWave = !action.on && locked && depthRatio(proc) < 1 ? Math.round((3 + 8 * Math.min(1, depthRatio(proc))) * 10) / 10 : proc.rWave;
      const events = [event(action.on ? 'pacingOn' : 'pacingOff')];
      if (rWave !== proc.rWave) events.push(event('rWave', { v: rWave }));
      // Pacing off with the tip at the conduction tissue shows the LBB potential before the conducted beat.
      const potential = !action.on && locked ? simulate({ ...modelOf(proc), pacing: false }).metrics.lbbPotentialV6 : null;
      if (potential != null) events.push(event('lbbPotential', { v: potential }));
      return { proc: { ...proc, pacing: Boolean(action.on), rWave, lbbPotential: potential ?? proc.lbbPotential }, events };
    }
    case 'withdrawSheath': {
      if (!proc.accepted || proc.finish.withdraw) return { proc, events: [] };
      const uni = action.threshold;
      const thresholds = uni == null ? null : { uni: Math.round((uni + .1) * 100) / 100, bi: Math.round((uni + .3) * 100) / 100 };
      return { proc: { ...proc, finish: { ...proc.finish, withdraw: true }, thresholds }, events: [event('sheathOut', thresholds || {})] };
    }
    case 'slit':
      if (!proc.finish.withdraw || proc.finish.slit) return { proc, events: [] };
      return { proc: { ...proc, finish: { ...proc.finish, slit: true } }, events: [event('slit')] };
    case 'slack':
      return SLACKS.includes(action.value) ? { proc: { ...proc, slack: action.value, finish: { ...proc.finish, breath: false } }, events: [] } : { proc, events: [] };
    case 'breath':
      if (!proc.finish.slit) return { proc, events: [] };
      return { proc: { ...proc, finish: { ...proc.finish, breath: true } }, events: [event(proc.slack === 'right' ? 'slackOk' : proc.slack === 'little' ? 'slackLittle' : 'slackMuch')] };
    case 'output': {
      const output = Math.round(clamp(Number(action.value), 0, 8) * 100) / 100;
      return Number.isFinite(output) ? { proc: { ...proc, output }, events: [] } : { proc, events: [] };
    }
    case 'set': {  // instructor shortcuts and console settings (already validated by the caller)
      const values = { ...action.values };
      if ('heart' in values && !HEARTS[values.heart]) delete values.heart;
      if ('lead' in values && !LEAD_TYPES.includes(values.lead)) delete values.lead;
      if (('heart' in values || 'lead' in values) && locked) return { proc, events: [event('locked')] };
      return { proc: { ...proc, ...values }, events: [] };
    }
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

const SLACKS = Object.freeze(['little', 'right', 'much']);

/** Physical state back from model values set directly (instructor sliders). */
export function fromModel(proc, values) {
  const out = { ...proc };
  if (Number.isFinite(values.angle)) out.sheath = idealAngleOf(proc) + (relAngle(proc) < 0 ? -1 : 1) * clamp(values.angle, 0, 80);
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
/**
 * Conduction-system threshold read from a decremental test: the output above a drop to LV septal
 * capture; with a selective tail it equals the capture threshold itself. Null without a threshold.
 */
export function lbbThresholdOf(test) {
  if (!test || test.kind !== 'threshold' || test.threshold == null) return null;
  const drop = (test.transitions || []).find(t => t.kind === 'toLvsp');
  return drop ? drop.from : test.threshold;
}
/** A finished test from sweep rows (analysis page): the same shape as the live threshold test. */
export function testFromRows(kind, rows, polarity = 'uni') {
  const captured = rows.filter(r => r.metrics.qrsDuration != null);
  const threshold = kind === 'threshold' && captured.length && captured.length < rows.length ? captured.at(-1).output : null;
  return { kind, rows, transitions: transitionsOf(rows, polarity), done: true, threshold, polarity, beat: 0 };
}

/**
 * Capture criteria read from the current recording and the test log. status: met (definitive),
 * likely (supportive grey band), not, untested. The depth row is the prerequisite: the timing rows
 * read the beat only once V1 shows the terminal r' (except with baseline RBBB, where the r' says
 * nothing about depth). An anodal beat loses the r', so its timing never enters the proof rows.
 */
export function criteria(result, proc, test = null) {
  const m = result.metrics;
  const rhythm = paramsOf(result.state).rhythm, cut = v6CutoffsOf(result.state);
  const fused = (m.fusion || 0) > FUSION_LIMIT;   // fusion with intrinsic conduction: the timing reads nothing
  const paced = proc.pacing && m.qrsDuration != null && !fused;
  const rPrime = paced ? terminalR(result) : null;
  // Baseline RBBB: the late right ventricle gives an r' at any depth, so the row is not useful (na).
  const depthRow = rhythm === 'rbbb' ? 'na' : paced ? (rPrime ? 'met' : 'not') : 'untested';
  const timed = paced && (rhythm === 'rbbb' || rPrime);
  const v6 = !paced || m.v6Rwpt == null ? 'untested' : m.v6Rwpt <= cut.met && timed ? 'met' : m.v6Rwpt <= cut.likely && timed ? 'likely' : 'not';
  const ip = !rPrime || rhythm === 'rbbb' || m.interpeak == null ? 'untested' : m.interpeak > CUTOFFS.interpeakMet ? 'met' : m.interpeak >= CUTOFFS.interpeakLikely ? 'likely' : 'not';
  const transition = !test?.done ? 'untested' : test.polarity !== 'uni' ? 'untested' : (test.transitions || []).some(t => t.proof) ? 'met' : 'not';
  const potential = potentialStatus(proc, m, paced, timed);
  return [
    { id: 'terminalR', group: 'depth', status: depthRow },
    { id: 'v6Rwpt', group: 'proof', status: v6, value: paced ? m.v6Rwpt : null, unit: 'ms', cutoff: cut.met },
    { id: 'interpeak', group: 'proof', status: ip, value: rPrime ? m.interpeak : null, unit: 'ms' },
    { id: 'transition', group: 'proof', status: transition, value: (test?.transitions || []).filter(t => t.proof).length },
    { id: 'lbbPotential', group: 'proof', status: potential, value: proc.lbbPotential ?? null, unit: 'ms' },
    { id: 'fixation', group: 'support', status: proc.rbbbFixation ? 'met' : 'untested' },
    { id: 'safety', group: 'safety', status: safetyStatus(proc, m), value: m.impedance, unit: 'Ω' }
  ];
}
/** LBB potential-V6RWPT (pacing off) against the paced Stim-V6RWPT at the same position: equal within 10 ms. */
function potentialStatus(proc, m, paced, timed) {
  if (proc.lbbPotential == null || !paced || !timed || m.v6Rwpt == null) return 'untested';
  return Math.abs(m.v6Rwpt - proc.lbbPotential) <= CUTOFFS.potentialMatch ? 'met' : 'not';
}
/** Impedance at or over 450 ohm and, beyond half the wall, COI at or over 3 mV. */
function safetyStatus(proc, m) {
  if (proc.depthMm <= LOCKED_MM) return 'untested';
  return m.impedance < CUTOFFS.impedanceMin || (depthRatio(proc) > CUTOFFS.coiFromRatio && m.coi < CUTOFFS.coiMin) ? 'not' : 'met';
}
/** Timing (Stim-V6RWPT, interpeak) can be read: not blended with intrinsic conduction. */
export const timingReadable = metrics => (metrics?.fusion || 0) <= FUSION_LIMIT;
/** Impedance has fallen this much (ohm) from the highest value at this position, while still in the septum. */
export function impedanceFallOf(proc, result) {
  if (!proc.peakImpedance || result.capture.type === 'perforation') return 0;
  return Math.max(0, proc.peakImpedance - result.metrics.impedance);
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
    const lbb = lbbThresholdOf(test) ?? test.threshold;   // the margin protects conduction-system capture, not just capture
    if (lbb > CUTOFFS.thresholdMax) reasons.push('thresholdHigh');
    if (proc.output < CUTOFFS.outputMargin * lbb) reasons.push('margin');
  }
  if (!confirmation(list).definitive) reasons.push('proof');
  return reasons;
}

/** One line of guidance for the current state (key into the console text). */
export function guidance(proc, result, list, test = null) {
  const ratio = depthRatio(proc), angle = relAngle(proc);
  const offset = offsetOf(angle);
  const { lbb } = anatomyOf(proc);
  const conf = confirmation(list);
  const met = id => list.find(c => c.id === id)?.status === 'met';
  if (result.capture.type === 'perforation') return { key: 'perforation', tone: 'warn' };
  if (proc.accepted) return { key: proc.finish.breath ? 'finished' : proc.finish.slit ? 'checkSlack' : proc.finish.withdraw ? 'slitSheath' : 'withdrawSheath', tone: 'ok' };
  if (proc.bumped && !proc.pacing) return { key: 'bumpedOff', tone: 'warn' };
  if ((result.metrics.fusion || 0) > FUSION_LIMIT) return { key: 'fusion', tone: 'warn' };
  if (proc.depthMm <= LOCKED_MM) {
    if (offset < 0) return { key: 'offAnterior', tone: 'warn' };
    if (offset > 0) return { key: 'offPosterior', tone: 'warn' };
    if (Math.abs(angle) > 25) return { key: angle < 0 ? 'turnCcw' : 'turnCw', tone: 'info' };
    if (proc.level < lbb - .15) return { key: 'tooHigh', tone: 'info' };
    if (proc.level > lbb + .15) return { key: 'tooLow', tone: 'info' };
    return { key: 'paceMapOk', tone: 'ok' };
  }
  if (result.metrics.impedance < CUTOFFS.impedanceMin) return { key: 'impedanceDrop', tone: 'warn' };
  if (impedanceFallOf(proc, result) >= CUTOFFS.impedanceFall) return { key: 'impedanceFalling', tone: 'warn' };
  if (proc.stalls >= 2) return { key: 'stall', tone: 'warn' };
  if (Math.abs(angle) > DRILL_ANGLE) return { key: 'drilling', tone: 'warn' };
  if (proc.lead === 'stylet' && !proc.forwardSupport) return { key: 'noSupport', tone: 'warn' };
  if (ratio < .5) return { key: 'keepTurning', tone: 'info' };
  if (ratio < LV_DEPTH) return { key: 'watchV1', tone: 'info' };
  // Bipolar high output can capture the ring (anodal): the r' disappears and the timing is not the tip's.
  if (proc.polarity === 'bi' && !conf.definitive) return { key: 'readUnipolar', tone: 'info' };
  if (conf.definitive) return { key: test?.threshold != null ? (acceptCheck(proc, list, test).length ? 'fixSettings' : 'acceptable') : 'confirmTest', tone: 'ok' };
  // Grey band: test first; one more turn only when it cannot reach the far side of this septum.
  if (conf.supportive.length) return { key: nextTurnRatio(proc) < NEXT_TURN_MAX ? 'likelyTestTurn' : 'likelyTest', tone: 'info' };
  if (list.find(c => c.id === 'terminalR')?.status === 'na') return { key: 'deepRbbb', tone: 'info' };
  if (met('terminalR')) return { key: nextTurnRatio(proc) < NEXT_TURN_MAX ? 'lvsp' : 'lvspNoTurn', tone: 'info' };
  return { key: nextTurnRatio(proc) < NEXT_TURN_MAX ? 'deepNoProof' : 'deepNoTurn', tone: 'info' };
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
    threshold: test?.threshold ?? null, lbbThreshold: lbbThresholdOf(test), proof: conf.by.length, by: conf.by, perforated: ratio >= 1,
    verdict: ratio >= 1 ? 'perforated' : conf.definitive ? 'lbbp' : met('terminalR') ? 'lvsp' : 'septal'
  };
}
