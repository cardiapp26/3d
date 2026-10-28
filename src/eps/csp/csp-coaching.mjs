/** Coaching lines for the CSP implant console: a short checklist read from the current state,
 * the live recording, the criteria and the per-turn trends. Each item is { tone, key, params }
 * where tone is 'check' (something to fix), 'ok' (confirmed) or 'next' (what to do now).
 * Keys map to CONSOLE_TEXT.coach. Original teaching heuristics, not a clinical algorithm.
 */
import { offsetOf, depthRatio, mmFromHis, confirmation, acceptCheck, anatomyOf, relAngle, LV_DEPTH, CUTOFFS, HIS_APEX_MM, FUSION_LIMIT } from './csp-procedure.mjs';
import { paramsOf } from './csp-model.mjs';
import { trendDelta } from './csp-trends.mjs';

const SITE_HALF_MM = 6;     // acceptable distance from the left bundle level along the His-apex line
const SHEATH_MAX = 25;      // degrees from the septal normal that still engage
const MAX_ITEMS = 6;

const item = (tone, key, params = {}) => ({ tone, key, params });
const sign = v => (v > .15 ? '+' : v < -.15 ? '−' : '±');
const round = (v, digits = 0) => (Number.isFinite(v) ? Number(v.toFixed(digits)) : '·');

/** Net deflection of a limb lead after the stimulus: positive, negative or isoelectric. */
function polarity(result, lead) {
  const values = result.leads[lead].slice(55, 251);
  const up = Math.max(0, ...values), down = Math.max(0, ...values.map(v => -v));
  return sign(up - down);
}

function beforeFixation(proc, result, list) {
  const items = [];
  const rel = relAngle(proc), offset = offsetOf(rel), angle = Math.abs(rel);
  if (offset < 0) items.push(item('check', 'offAnterior'));
  else if (offset > 0) items.push(item('check', 'offPosterior'));
  else if (angle > SHEATH_MAX) items.push(item('check', 'sheathAngle', { angle: Math.round(proc.sheath) }));
  else items.push(item('ok', 'sheathOk', { angle: Math.round(proc.sheath) }));
  if (proc.lead === 'stylet' && !proc.forwardSupport) items.push(item('check', 'noSupport'));
  const target = anatomyOf(proc).lbb * HIS_APEX_MM, mm = mmFromHis(proc);
  if (mm < target - SITE_HALF_MM) items.push(item('check', 'siteHigh', { mm }));
  else if (mm > target + SITE_HALF_MM) items.push(item('check', 'siteLow', { mm }));
  else items.push(item('ok', 'siteOk', { mm }));
  const qrs = result.metrics.qrsDuration;
  if (qrs != null) {
    const params = { qrs: round(qrs), ii: polarity(result, 'II'), iii: polarity(result, 'III') };
    items.push(item(offset === 0 && qrs < 160 ? 'ok' : 'check', 'paceMap', params));
  }
  const ready = items.every(i => i.tone === 'ok');
  items.push(item('next', ready ? 'nextRotate' : 'nextFix'));
  return items;
}

function afterFixation(proc, result, list, test, trend) {
  const items = [];
  const m = result.metrics, ratio = depthRatio(proc);
  if (result.capture.type === 'perforation') return [item('check', 'perforation', { impedance: round(m.impedance) }), item('next', 'nextUnscrew')];
  const depth = trendDelta(trend, 'depthMm');
  if (depth && depth.delta < .3) items.push(item('check', 'noProgress', { angle: Math.round(proc.sheath) }));
  const imp = trendDelta(trend, 'impedance');
  if (imp && imp.delta < -100) items.push(item('check', 'impedanceDrop', { from: round(imp.from), to: round(imp.to) }));
  else if (imp) items.push(item('ok', 'impedanceTrend', { from: round(imp.from), to: round(imp.to) }));
  if (ratio > .5 && m.coi < CUTOFFS.coiMin) items.push(item('check', 'coiLow', { coi: round(m.coi, 1) }));
  else items.push(item('ok', 'coi', { coi: round(m.coi, 1) }));
  const status = id => list.find(c => c.id === id)?.status;
  const v6 = trendDelta(trend, 'v6Rwpt');
  if (status('terminalR') === 'met') items.push(item('ok', 'rPrime', { v6: round(m.v6Rwpt) }));
  else items.push(item('next', 'rPrimeNext', { from: round(v6?.from), to: round(m.v6Rwpt) }));
  if (ratio >= LV_DEPTH) {
    const conf = confirmation(list);
    if (conf.definitive) items.push(item('ok', 'proof', { n: conf.by.length }));
    else if (conf.supportive.length) items.push(item('check', 'greyBand', { v6: round(m.v6Rwpt), interpeak: round(m.interpeak) }));
    if (test?.done && test.polarity !== 'uni') items.push(item('check', 'unipolar'));
    else if (!test?.done) items.push(item('next', 'runThreshold'));
    else {
      const reasons = acceptCheck(proc, list, test);
      items.push(reasons.length ? item('next', 'fixAccept', { reasons }) : item('next', 'accept'));
    }
  } else items.push(item('next', 'oneTurn'));
  return items;
}

/**
 * @param {object} proc procedure state
 * @param {object} result simulate() result at the current position
 * @param {object[]} list criteria()
 * @param {object|null} test finished test, if any
 * @param {object[]} trend per-turn points (csp-trends)
 */
export function coaching(proc, result, list, test = null, trend = []) {
  if (proc.accepted) {
    const f = proc.finish || {};
    return [item('ok', 'accepted'), item('next', f.breath ? 'finish' : f.slit ? 'breath' : f.withdraw ? 'slit' : 'withdraw')];
  }
  const first = [];
  if (proc.bumped) first.push(item('check', 'bumped', { pacing: proc.pacing ? 1 : 0 }));
  if ((result.metrics.fusion || 0) > FUSION_LIMIT) first.push(item('check', 'fusion', { rate: proc.rate, sinus: paramsOf(result.state).intrinsicRate }));
  const items = proc.depthMm > .05 ? afterFixation(proc, result, list, test, trend) : beforeFixation(proc, result, list);
  return [...first, ...items].slice(0, MAX_ITEMS);
}
