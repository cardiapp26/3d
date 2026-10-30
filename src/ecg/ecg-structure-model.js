/**
 * Chamber enlargement on the single-dipole ECG (src/eps/ecg12.js): the P wave as the sum of a
 * right and a left atrial vector, and the QRS with thicker left or right ventricular walls. The
 * standard voltage criteria are measured on the synthetic leads. Teaching model: the amplitudes
 * follow the direction of published changes, not a calibrated torso; never a patient recording.
 * Units: ms, mV; the criteria are given in mm at 10 mm/mV.
 */
import { vectorAt, leadsOf, LEADS } from '../eps/ecg12.js';
import { NORMAL_BEAT, INTERVALS } from './ecg-recording-model.js';

const MM = 10;   // mm per mV at standard gain
const step = 1;

/** Sample all twelve leads of a set of lobes over [from, to] ms (1 ms). */
export function sample(lobes, from = 0, to = 700) {
  const out = Object.fromEntries(LEADS.map(l => [l, []]));
  for (let t = from; t <= to; t += step) { const v = leadsOf(vectorAt(lobes, t)); for (const l of LEADS) out[l].push(v[l]); }
  return { from, leads: out };
}
const at = (s, lead, ms) => s.leads[lead][Math.round(ms - s.from)] ?? 0;

// ---- Atria ----
export const ATRIA = Object.freeze(['normal', 'left', 'right', 'both']);
const RA = Object.freeze({ dir: [.15, .9, .4], t: 52, sigma: 14, amp: .12 });     // right atrium: inferior, anterior
const LA = Object.freeze({ dir: [.92, .4, -.06], t: 86, sigma: 16, amp: .1 });     // left atrium: leftward, slightly posterior
/**
 * P wave lobes. left: a larger, longer, later left atrial vector; right: a taller right atrial one;
 * slowed: delayed interatrial conduction (Bachmann's bundle), which separates the two humps.
 */
export function atrialLobes({ atria = 'normal', slowed = false } = {}) {
  const left = atria === 'left' || atria === 'both', right = atria === 'right' || atria === 'both';
  return [
    { ...RA, amp: RA.amp * (right ? 3.4 : 1), sigma: RA.sigma * (right ? 1.1 : 1), dir: right ? [.05, .8, .8] : RA.dir },
    { ...LA, amp: LA.amp * (left ? 1.9 : 1), sigma: LA.sigma * (left ? 1.35 : 1), t: LA.t + (left ? 18 : 0) + (slowed ? 28 : 0), dir: left ? [.6, .3, -.8] : LA.dir }
  ];
}
/** P wave measures: duration (from the envelope), amplitude in II, notch interval in II, V1 terminal force. */
export function pMeasures(lobes) {
  const s = sample(lobes, 0, 220);
  const env = ms => Math.hypot(...['I', 'II', 'V1', 'V6'].map(l => at(s, l, ms)));
  const peak = Math.max(...Array.from({ length: 221 }, (_, ms) => env(ms)));
  const on = Array.from({ length: 221 }, (_, ms) => ms).find(ms => env(ms) > peak * .06);
  const off = Array.from({ length: 221 }, (_, ms) => 220 - ms).find(ms => env(ms) > peak * .06);
  const ii = Array.from({ length: 221 }, (_, ms) => at(s, 'II', ms));
  // Notch: two local maxima in II separated by a dip of at least 10 % of the peak.
  const maxima = [];
  for (let i = 2; i < ii.length - 2; i++) if (ii[i] > ii[i - 1] && ii[i] >= ii[i + 1] && ii[i] > Math.max(...ii) * .35) maxima.push(i);
  const notchMs = maxima.length >= 2 && Math.min(...ii.slice(maxima[0], maxima.at(-1))) < Math.max(...ii) * .9 ? maxima.at(-1) - maxima[0] : 0;
  // V1 terminal force: duration x depth of the negative terminal part of P in V1 (mm x ms).
  const v1 = Array.from({ length: 221 }, (_, ms) => at(s, 'V1', ms));
  const negFrom = v1.findIndex((v, i) => i > on && v < -.005 && v1.slice(i).every(x => x <= .002));
  const negDepth = negFrom < 0 ? 0 : -Math.min(...v1.slice(negFrom, off + 1));
  const negDur = negFrom < 0 ? 0 : off - negFrom;
  return {
    duration: off - on, amplitudeII: Math.max(...ii) * MM, notchMs, ptfv1: Math.round(negDur * negDepth * MM),
    v1Initial: Math.max(0, ...v1.slice(on, negFrom < 0 ? off : negFrom)) * MM
  };
}
/** Atrial abnormality criteria (mm, ms): LA: P >= 120 ms with a notch >= 40 ms or PTFV1 >= 40 mm x ms; RA: P in II >= 2.5 mm or V1 initial >= 1.5 mm. */
export function atrialCriteria(m) {
  return {
    duration: m.duration >= 120, notch: m.notchMs >= 40, ptfv1: m.ptfv1 >= 40,
    tallII: m.amplitudeII >= 2.5, v1Initial: m.v1Initial >= 1.5
  };
}

// ---- Ventricles ----
/**
 * QRS and T lobes with wall thickness: lvWall (mm, normal 9) scales the left ventricular forces
 * leftward and posterior, rvWall (mm, normal 4) adds rightward and anterior forces. strain turns the
 * lateral T wave and ST against a hypertrophied QRS (secondary repolarization change).
 */
export function ventricleLobes({ lvWall = 9, rvWall = 4, strain = false } = {}) {
  const lv = Math.max(0, (lvWall - 9) / 9), rv = Math.max(0, (rvWall - 4) / 6);
  const lobes = NORMAL_BEAT.filter((_, i) => i > 0).map((lobe, i) => {
    if (i === 1) return { ...lobe, amp: lobe.amp * (1 + 1.3 * lv) * (1 - .35 * rv), dir: [lobe.dir[0], lobe.dir[1] - .45 * lv, lobe.dir[2] - .4 * lv], sigma: lobe.sigma * (1 + .15 * lv) };
    if (i === 3) return strain && lv > .2 ? { ...lobe, dir: [-.5, -.15, .55], amp: .18 + .18 * lv } : lobe;   // T opposite to the LV forces
    return lobe;
  });
  if (rv > 0) lobes.push({ dir: [-.55, .45, .9], t: 212, sigma: 9, amp: 1.7 * rv });     // right ventricle: rightward, anterior
  if (strain && lv > .2) lobes.push({ dir: [-.55, -.2, .45], t: 330, sigma: 45, amp: .1 * lv });   // ST depression in the lateral leads
  return lobes;
}
const qrsWindow = [INTERVALS.qrsOnset - 6, INTERVALS.qrsEnd + 12];
/** R and S (positive mm) of each lead within the QRS. */
export function qrsVoltages(lobes) {
  const s = sample(lobes, qrsWindow[0], qrsWindow[1]);
  return Object.fromEntries(LEADS.map(l => { const v = s.leads[l]; return [l, { r: Math.max(0, ...v) * MM, s: -Math.min(0, ...v) * MM }]; }));
}
/** Frontal QRS axis (degrees) from the net areas of I and aVF. */
export function qrsAxis(lobes) {
  const s = sample(lobes, qrsWindow[0], qrsWindow[1]);
  const net = l => s.leads[l].reduce((a, b) => a + b, 0);
  return Math.round((Math.atan2(net('aVF'), net('I')) * 180) / Math.PI);
}
/**
 * Voltage criteria (mm). Sokolow-Lyon: S V1 + R V5 or V6 >= 35. Cornell: R aVL + S V3 > 28 (men),
 * > 20 (women). Peguero-Lo Presti: deepest S in any lead + S V4 >= 28 (men), >= 23 (women).
 * RVH: R in V1 >= 7, R/S in V1 > 1, right axis (> 110 degrees).
 */
export function hypertrophyCriteria(v, sex = 'male', axis = 60) {
  const deepest = Math.max(...LEADS.map(l => v[l].s));
  const sokolow = v.V1.s + Math.max(v.V5.r, v.V6.r), cornell = v.aVL.r + v.V3.s, peguero = deepest + v.V4.s;
  const female = sex === 'female';
  return {
    sokolow: { value: sokolow, met: sokolow >= 35, limit: 35 },
    cornell: { value: cornell, met: cornell > (female ? 20 : 28), limit: female ? 20 : 28 },
    peguero: { value: peguero, met: peguero >= (female ? 23 : 28), limit: female ? 23 : 28 },
    rvh: { value: v.V1.r, ratio: v.V1.s ? v.V1.r / v.V1.s : Infinity, axis, met: v.V1.r >= 7 || (v.V1.s > 0 && v.V1.r / v.V1.s > 1) || axis > 110 }
  };
}
