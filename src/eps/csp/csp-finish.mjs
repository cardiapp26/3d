/** Finishing a CSP case: the sheath and slack steps after acceptance, an illustrative procedure
 * score, and the follow-up clinic (day 1 and 6 weeks) with matured thresholds and possible
 * dislodgement. Pure functions on the procedure state; every number is a teaching parameter,
 * the score does not measure implant competence.
 */
import { confirmation, acceptCheck, lbbThresholdOf, depthRatio, LV_DEPTH, CUTOFFS } from './csp-procedure.mjs';

export const SLACK = Object.freeze(['little', 'right', 'much']);
export const FINISH_STEPS = Object.freeze(['withdraw', 'slit', 'breath']);
const WEIGHTS = Object.freeze({ proof: 30, uniThreshold: 10, biThreshold: 5, margin: 10, rWave: 5, slit: 5, slack: 10, complications: 10, sites: 5, fluoro: 5, turns: 5 });
export const FLUORO_LIMIT_S = 120;
export const TURN_LIMIT = 10;

/** Intrinsic R wave on the tip (mV, synthetic): grows with depth, lost on perforation. */
export const rWaveOf = proc => (depthRatio(proc) >= 1 ? 0 : Math.round((3 + 8 * Math.min(1, depthRatio(proc))) * 10) / 10);

/** Unipolar and bipolar thresholds after the sheath is withdrawn (V at .5 ms): the unipolar one rises a little, the bipolar a little more. */
export function thresholdsAfterSheath(test) {
  const uni = test?.threshold;
  if (uni == null) return { uni: null, bi: null };
  const r = x => Math.round(x * 100) / 100;
  return { uni: r(uni + .1), bi: r(uni + .3) };
}

/** Score items: { id, ok, value }. `extras`: { fluoroSec, sites, complications } kept by the console. */
export function scoreCase(proc, list, test, extras = {}) {
  const conf = confirmation(list), lbb = lbbThresholdOf(test);
  const th = proc.thresholds || { uni: null, bi: null };
  const items = [
    { id: 'proof', ok: conf.definitive, value: conf.by.length },
    { id: 'uniThreshold', ok: th.uni != null && th.uni <= CUTOFFS.thresholdMax, value: th.uni },
    { id: 'biThreshold', ok: th.bi != null, value: th.bi },
    { id: 'margin', ok: lbb != null && proc.output >= CUTOFFS.outputMargin * lbb, value: lbb },
    { id: 'rWave', ok: proc.rWave != null && proc.rWave >= 4, value: proc.rWave },
    { id: 'slit', ok: Boolean(proc.finish?.slit), value: null },
    { id: 'slack', ok: Boolean(proc.finish?.breath) && proc.slack === 'right', value: proc.slack },
    { id: 'complications', ok: !(extras.complications || 0), value: extras.complications || 0 },
    { id: 'sites', ok: (extras.sites || 1) <= 2, value: extras.sites || 1 },
    { id: 'fluoro', ok: (extras.fluoroSec || 0) <= FLUORO_LIMIT_S, value: Math.round(extras.fluoroSec || 0) },
    { id: 'turns', ok: proc.turns <= TURN_LIMIT, value: proc.turns }
  ];
  const score = items.reduce((sum, i) => sum + (i.ok ? WEIGHTS[i.id] : 0), 0);
  return { items, score, accepted: proc.accepted, reasons: acceptCheck(proc, list, test) };
}

function rng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/**
 * Follow-up visit (day 1 or 6 weeks). Deterministic for a seed. Dislodgement is more likely with a
 * shallow tip, too little slack or a drilled tunnel (stalls). Returns the clinic readings, what the
 * programmed output captures today and the correct decision.
 * @param {'day1'|'week6'} visit
 */
export function followUp(proc, test, visit, seed = 1) {
  const r = rng((seed || 1) * 7 + (visit === 'week6' ? 13 : 1));
  const lbb0 = lbbThresholdOf(test) ?? proc.thresholds?.uni ?? 1, muscle0 = proc.thresholds?.uni ?? lbb0;
  const ratio = depthRatio(proc);
  const risk = .05 + (ratio < LV_DEPTH ? .3 : 0) + (proc.slack === 'little' ? .3 : 0) + (proc.stalls > 0 ? .2 : 0) + (proc.slack === 'much' ? .05 : 0);
  const dislodged = r() < risk ? (r() < .7 ? 'micro' : 'macro') : null;
  const maturation = visit === 'week6' ? round(.05 + r() * .35) : round(.1 + r() * .2);
  const lbb = dislodged === 'macro' ? null : round(lbb0 + maturation + (dislodged === 'micro' ? 1.4 + r() * .8 : 0));
  const muscle = dislodged === 'macro' ? round(muscle0 + 3 + r() * 2) : round(Math.min(lbb ?? 9, muscle0 + maturation * .6 + (dislodged === 'micro' ? .3 : 0)));
  const output = proc.output;
  const captured = lbb != null && output >= lbb ? 'conduction' : output >= muscle ? 'myocardium' : 'none';
  const action = captured === 'conduction' ? (output >= CUTOFFS.outputMargin * lbb ? 'keep' : 'increase') : lbb != null && lbb <= 3.5 ? 'increase' : 'revise';
  const impedance = round(560 + (ratio >= LV_DEPTH ? 120 : 40) + r() * 60 - (dislodged ? 120 : 0), 0);
  const rWave = dislodged === 'macro' ? round(1 + r() * 2, 1) : round((proc.rWave ?? 6) + r() * 2, 1);
  const deltaV6 = dislodged === 'micro' ? round(12 + r() * 14, 0) : round(r() * 6 - 2, 0);
  return { visit, dislodged, thresholds: { lbb, muscle, device: captured === 'none' ? null : round(Math.min(lbb ?? 9, muscle)) }, impedance, rWave, deltaV6, output, captured, action };
}

/** Grade the clinic answers. */
export function gradeFollowUp(truth, answers) {
  return { captured: answers.captured === truth.captured, action: answers.action === truth.action };
}
