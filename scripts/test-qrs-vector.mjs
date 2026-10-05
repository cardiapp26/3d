import assert from 'node:assert/strict';
import { GUYTON_TOPICS } from '../src/ecg/guyton-data.js';
import { QRS_MS, activationTime, createQrsModel } from '../src/ecg/qrs-vector-model.js';

const steps = GUYTON_TOPICS.find(t => t.id === 'ch12_vectors').vectors;
const m = createQrsModel(steps);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// Keyframes are hit exactly; the QRS starts and ends at zero.
for (const s of steps) {
  const f = m.frontal(Math.round(parseFloat(s.time) * 1000));
  assert.ok(close(f.magnitude, s.magnitude, 1e-9), `magnitude at ${s.time}`);
  if (s.magnitude > 0) assert.ok(Math.abs(((f.angle - s.vectorAngle + 540) % 360) - 180) < 1e-6, `angle at ${s.time}`);
  assert.ok(close(m.lead('V1', Math.round(parseFloat(s.time) * 1000)), s.waves.v1), `V1 at ${s.time}`);
}
assert.equal(m.frontal(0).magnitude, 0);
assert.equal(m.lead('II', -5), 0); assert.equal(m.lead('II', QRS_MS + 5), 0);

// Einthoven at every instant; aVF = (II + III) / √3 for the projection model.
for (let t = 0; t <= QRS_MS; t += 0.5) {
  const I = m.lead('I', t), II = m.lead('II', t), III = m.lead('III', t);
  assert.ok(close(I + III, II, 1e-9), `I + III = II at ${t} ms`);
  assert.ok(close(m.lead('aVF', t), (II + III) / Math.sqrt(3), 1e-9), `aVF at ${t} ms`);
}

// Morphology: septal q in I (early rightward vector), R peak near 40 ms in II, terminal negativity; V1 rS, V6 qR.
assert.ok(m.lead('I', 8) < 0, 'small septal q in lead I');
const peakT = Array.from({ length: QRS_MS + 1 }, (_, t) => t).reduce((b, t) => (m.lead('II', t) > m.lead('II', b) ? t : b), 0);
assert.ok(peakT >= 35 && peakT <= 45, `R peak in II at ${peakT} ms`);
assert.ok(m.lead('II', 60) < 0, 'terminal S in II (basal vector)');
assert.ok(m.lead('V1', 10) > 0 && m.lead('V1', 40) < -0.5, 'V1: small r, deep S');
assert.ok(m.lead('V6', 10) < 0 && m.lead('V6', 40) > 1, 'V6: small q, tall R');
const mean = m.meanAxis();
assert.ok(mean > 30 && mean < 75, `mean axis in the normal range (${mean.toFixed(1)}°)`);
assert.equal(m.stepAt(0), 0); assert.equal(m.stepAt(40), 2); assert.equal(m.stepAt(80), 4);
assert.throws(() => m.lead('V9', 10), RangeError);
assert.throws(() => createQrsModel([]), RangeError);

// Activation order: left septum first, then apex/endocardium, free walls, base last; all within the QRS.
assert.ok(activationTime('septum', 0, 0.6) < activationTime('lv', 0, 1), 'septum before apex endocardium');
assert.ok(activationTime('lv', 0, 1) < activationTime('lv', 1, 1), 'endocardium before epicardium');
assert.ok(activationTime('lv', 0.5, 1) < activationTime('lv', 0.5, 0), 'apex before base');
for (const region of ['septum', 'rv', 'lv']) for (const d of [0, 1]) for (const a of [0, 1]) {
  const t = activationTime(region, d, a);
  assert.ok(t >= 0 && t <= QRS_MS, `${region} ${d}/${a}: ${t} ms within the QRS`);
}
console.log(`PASS QRS vector: keyframes, Einthoven every instant, septal q / R peak / terminal S, V1 rS, V6 qR, mean axis ${mean.toFixed(0)}°, activation order`);
