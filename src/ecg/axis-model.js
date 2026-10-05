// Frontal QRS axis teaching model (axis-lab.js draws it). Hexaxial reference
// system: each limb lead records the projection of the mean QRS vector on its
// own axis (Einthoven; Guyton & Hall ch. 12). Angles in degrees, -180 < a <= 180,
// 0 = lead I (patient's left), +90 = aVF (feet), negative = superior.

import { axisCategory } from './ecg-lab-model.js';

export { axisCategory };

/** Standard limb leads: positive pole angle and the usual 12-lead print order. */
export const LIMB_LEADS = Object.freeze([
  { id: 'I', angle: 0 },
  { id: 'II', angle: 60 },
  { id: 'III', angle: 120 },
  { id: 'aVR', angle: -150 },
  { id: 'aVL', angle: -30 },
  { id: 'aVF', angle: 90 }
]);
export const LEAD_ANGLE = Object.freeze(Object.fromEntries(LIMB_LEADS.map(l => [l.id, l.angle])));
/** Peak QRS amplitude (mV) a lead records when it is parallel to the vector. */
export const QRS_AMPLITUDE = 1.2;

const rad = deg => (deg * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;

export function normAngle(a) {
  if (!Number.isFinite(a)) throw new RangeError('Angle must be finite');
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  if (x === -180) x = 180;
  return Object.is(x, -0) ? 0 : x;
}

/** Projection of a unit axis vector on a lead axis, -1..1. */
export const projection = (axis, leadAngle) => Math.cos(rad(axis - leadAngle));

/**
 * QRS of one lead for a given axis: R and S chosen so that R - S equals the
 * projection exactly (R = A(1+p)^2/4, S = A(1-p)^2/4). A perpendicular lead
 * gives an equiphasic RS (R = S), a parallel one a pure R, an opposite one a QS.
 */
export function leadQrs(axis, leadAngle, amplitude = QRS_AMPLITUDE) {
  const p = projection(axis, leadAngle);
  const r = (amplitude * (1 + p) ** 2) / 4;
  const s = (amplitude * (1 - p) ** 2) / 4;
  return { p, r, s, net: r - s };
}

export function limbLeads(axis, amplitude = QRS_AMPLITUDE) {
  return LIMB_LEADS.map(l => ({ ...l, ...leadQrs(axis, l.angle, amplitude) }));
}

/** Axis from the net QRS of leads I (0°) and aVF (+90°): they are perpendicular, so atan2 is exact. */
export function axisFromNet(netI, netAvf) {
  if (![netI, netAvf].every(Number.isFinite) || (netI === 0 && netAvf === 0)) throw new RangeError('Need a non-zero net QRS in I or aVF');
  return normAngle(deg(Math.atan2(netAvf, netI)));
}

/** Quadrant method: signs of I and aVF; lead II settles the 0 to -30 band. */
export function quadrant(netI, netAvf, netII) {
  const i = netI >= 0, f = netAvf >= 0;
  if (i && f) return { id: 'normal', range: [0, 90] };
  if (i && !f) return { id: netII >= 0 ? 'normal-left' : 'left', range: netII >= 0 ? [-30, 0] : [-90, -30] };
  if (!i && f) return { id: 'right', range: [90, 180] };
  return { id: 'extreme', range: [-180, -90] };
}

/** Lead with the smallest |net QRS| (most equiphasic) and the two axes perpendicular to it. */
export function isoelectric(leads) {
  const lead = leads.reduce((best, l) => (Math.abs(l.net) < Math.abs(best.net) ? l : best));
  return { lead, candidates: [normAngle(lead.angle + 90), normAngle(lead.angle - 90)] };
}

/** Of the two perpendicular candidates, the one the tallest positive lead points toward. */
export function pickCandidate(candidates, leads) {
  const tallest = leads.reduce((best, l) => (l.net > best.net ? l : best));
  const off = c => Math.abs(normAngle(c - tallest.angle));
  return { axis: off(candidates[0]) <= off(candidates[1]) ? candidates[0] : candidates[1], tallest };
}

export const angleError = (a, b) => Math.abs(normAngle(a - b));

/** Quiz grading: within 15° is correct, within 30° close (reading limb leads by eye). */
export function gradeAnswer(answer, truth) {
  const error = angleError(answer, truth);
  return { error, verdict: error <= 15 ? 'correct' : error <= 30 ? 'close' : 'wrong', sameCategory: axisCategory(normAngle(answer)) === axisCategory(normAngle(truth)) };
}

/** Deterministic quiz axes (seeded), spread over all four categories. */
export function quizAxis(seed) {
  const pool = [60, -15, 45, -60, 120, 30, -45, 150, 90, -150, 75, 105, 0, -30, 165, -120, 15, 135];
  return pool[((Math.floor(seed) % pool.length) + pool.length) % pool.length];
}
