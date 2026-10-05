import assert from 'node:assert/strict';
import { LIMB_LEADS, LEAD_ANGLE, QRS_AMPLITUDE, angleError, axisCategory, axisFromNet, gradeAnswer, isoelectric, leadQrs, limbLeads, normAngle, pickCandidate, quadrant, quizAxis } from '../src/ecg/axis-model.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// Hexaxial angles.
assert.deepEqual(LEAD_ANGLE, { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90 });
assert.equal(normAngle(270), -90); assert.equal(normAngle(-180), 180); assert.equal(normAngle(-0), 0);

// Morphology: net = amplitude x projection; parallel = pure R, opposite = QS, perpendicular = equiphasic.
for (let a = -179; a <= 180; a += 7) for (const l of LIMB_LEADS) {
  const q = leadQrs(a, l.angle);
  assert.ok(close(q.net, QRS_AMPLITUDE * Math.cos(((a - l.angle) * Math.PI) / 180)), `net ∝ projection (${a}°, ${l.id})`);
  assert.ok(q.r >= 0 && q.s >= 0);
}
assert.ok(close(leadQrs(60, 60).s, 0) && close(leadQrs(60, 60).r, QRS_AMPLITUDE), 'parallel lead: pure R');
assert.ok(close(leadQrs(60, -120).r, 0), 'opposite lead: QS');
const perp = leadQrs(60, -30);
assert.ok(close(perp.r, perp.s), 'perpendicular lead: R = S');
// Einthoven: I + III = II for the net QRS.
for (let a = -180; a < 180; a += 10) { const L = Object.fromEntries(limbLeads(a).map(l => [l.id, l.net])); assert.ok(close(L.I + L.III, L.II, 1e-9), `Einthoven at ${a}°`); }

// Method 3: atan2(aVF, I) recovers every axis exactly.
for (let a = -179; a <= 180; a++) {
  const L = Object.fromEntries(limbLeads(a).map(l => [l.id, l.net]));
  assert.ok(angleError(axisFromNet(L.I, L.aVF), a) < 1e-6, `axisFromNet ${a}°`);
}
assert.throws(() => axisFromNet(0, 0), RangeError);

// Method 2: the isoelectric lead and the tallest lead give the axis within 15° everywhere (leads are 30° apart).
let worst = 0;
for (let a = -179; a <= 180; a++) {
  const leads = limbLeads(a), iso = isoelectric(leads);
  assert.equal(Math.abs(normAngle(iso.candidates[0] - iso.lead.angle)), 90);
  worst = Math.max(worst, angleError(pickCandidate(iso.candidates, leads).axis, a));
}
assert.ok(worst <= 15, `isoelectric method worst error ${worst}°`);
assert.equal(isoelectric(limbLeads(60)).lead.id, 'aVL', 'normal +60°: aVL is isoelectric');
assert.equal(pickCandidate(isoelectric(limbLeads(60)).candidates, limbLeads(60)).axis, 60);

// Method 1: quadrants, with lead II for the 0 to -30 band.
const quad = a => { const L = Object.fromEntries(limbLeads(a).map(l => [l.id, l.net])); return quadrant(L.I, L.aVF, L.II).id; };
assert.equal(quad(45), 'normal'); assert.equal(quad(-15), 'normal-left'); assert.equal(quad(-60), 'left');
assert.equal(quad(120), 'right'); assert.equal(quad(-150), 'extreme');
for (let a = -179; a <= 180; a++) {
  const q = quad(a), cat = axisCategory(a);
  if (Math.abs(a) % 90 === 0 || Math.abs(a + 30) < 1) continue;          // boundaries
  const expected = { normal: 'normal', 'normal-left': 'normal', left: 'left', right: 'right', extreme: 'extreme' }[q];
  assert.equal(expected, cat, `quadrant agrees with category at ${a}°`);
}

// Quiz.
assert.equal(gradeAnswer(70, 60).verdict, 'correct');
assert.equal(gradeAnswer(85, 60).verdict, 'close');
assert.equal(gradeAnswer(-60, 60).verdict, 'wrong');
assert.equal(gradeAnswer(175, -175).error, 10, 'error wraps across 180°');
const seen = new Set(Array.from({ length: 18 }, (_, i) => axisCategory(quizAxis(i))));
assert.deepEqual([...seen].sort(), ['extreme', 'left', 'normal', 'right'], 'quiz covers all four categories');
assert.equal(quizAxis(-1), quizAxis(17));

console.log(`PASS ECG axis: net ∝ projection, Einthoven, exact atan2(aVF, I), isoelectric method ≤ ${worst}°, quadrants with lead II, quiz grading`);
