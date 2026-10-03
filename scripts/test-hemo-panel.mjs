import assert from 'node:assert/strict';
import { register } from 'node:module';

// hemo-panel.js imports its stylesheet for Vite; resolve .css imports to an empty module under Node.
register('data:text/javascript,' + encodeURIComponent(
  "export async function resolve(specifier, context, next) {" +
  "  if (specifier.endsWith('.css')) return { url: 'stub:css', shortCircuit: true };" +
  "  return next(specifier, context);" +
  "}" +
  "export async function load(url, context, next) {" +
  "  if (url === 'stub:css') return { format: 'module', source: '', shortCircuit: true };" +
  "  return next(url, context);" +
  "}"
));

const { sampleStrip, pvMetricRows } = await import('../src/hemo-panel.js');
const { pvParams, pvModelLoop } = await import('../src/hemo-pv-model.js');
const { createHemodynamics } = await import('../src/hemodynamics.js');

const hemo = createHemodynamics('normal');
const columns = 400;

// Lengths and finiteness
const strip = sampleStrip({ hemo, channels: ['ao', 'lv', 'bogus'], beats: 3, bpm: 72, respiration: false, pvcBeat: null, columns });
assert.deepEqual(Object.keys(strip.series), ['lv', 'ao'], 'channels filtered and in station order');
for (const arr of [strip.times, strip.insp, strip.ecg, strip.series.lv, strip.series.ao]) {
  assert.equal(arr.length, columns, 'array length matches columns');
}
assert.equal(strip.postPvcBeat, null);
assert.ok(Math.abs(strip.times[columns - 1] - 2.5) < 1e-3, 'three beats at 72 bpm span 2.5 s');

// LV peaks near 120 mmHg (the scenario's LV systolic target) in the normal scenario, never NaN
let lvMax = -Infinity;
for (const v of strip.series.lv) {
  assert.ok(Number.isFinite(v), 'LV sample is finite');
  lvMax = Math.max(lvMax, v);
}
const lvTarget = hemo.getScenario().stations.lv.systolic;
assert.ok(Math.abs(lvMax - lvTarget) < 2, `LV peak matches the ${lvTarget} mmHg target, got ${lvMax.toFixed(1)}`);
assert.ok(Math.abs(lvMax - 120) <= 10, `LV peak near 120 mmHg, got ${lvMax.toFixed(1)}`);

// Exactly one R peak per beat
const rPeaks = ecg => {
  let count = 0;
  for (let i = 1; i < ecg.length - 1; i++) {
    if (ecg[i] > 0.6 && ecg[i] >= ecg[i - 1] && ecg[i] > ecg[i + 1]) count++;
  }
  return count;
};
assert.equal(rPeaks(strip.ecg), 3, 'three R peaks over three beats');
assert.equal(rPeaks(sampleStrip({ hemo, channels: [], beats: 6, bpm: 110, columns: 900 }).ecg), 6, 'six R peaks over six beats');

// Respiration: 15 breaths/min over six beats swings between about -1 and 1
const resp = sampleStrip({ hemo, channels: ['ra'], beats: 6, bpm: 72, respiration: true, columns });
const inspMin = Math.min(...resp.insp), inspMax = Math.max(...resp.insp);
assert.ok(inspMax > 0.97 && inspMin < -0.97, `insp spans -1..1, got ${inspMin.toFixed(2)}..${inspMax.toFixed(2)}`);
assert.ok(resp.series.ra.every(Number.isFinite), 'RA finite with respiration');
assert.ok(strip.insp.every(v => v === 0), 'no respiration means insp is zero');

// Post-PVC beat: marked and potentiated
const pvc = sampleStrip({ hemo, channels: ['lv'], beats: 3, bpm: 72, pvcBeat: 1, columns: 300 });
assert.equal(pvc.postPvcBeat, 1);
const beatMax = (arr, k) => Math.max(...arr.slice(k * 100, (k + 1) * 100));
assert.ok(beatMax(pvc.series.lv, 1) > beatMax(pvc.series.lv, 0) + 10, 'post-PVC LV systolic pressure rises');
assert.equal(sampleStrip({ hemo, channels: ['lv'], beats: 2, pvcBeat: 5, columns: 50 }).postPvcBeat, null, 'out-of-range PVC beat ignored');

// bpm falls back to the scenario rate; beats clamp to 1..6
hemo.setScenario('tamponade');
const fallback = sampleStrip({ hemo, channels: ['ao'], beats: 9, columns: 60 });
const scenarioHr = hemo.getScenario().hr;
assert.ok(Math.abs(fallback.times[59] - 6 * 60 / scenarioHr) < 1e-3, `six beats at the scenario rate of ${scenarioHr} bpm`);

// Model measurements: the grid of the model loop reports the model's own numbers, leak rows only for leaking lesions.
const labels = Object.fromEntries(['edv', 'esv', 'sv', 'fsv', 'rgv', 'ef', 'esp', 'peak', 'edp', 'ees', 'ea', 'coupling', 'sw'].map(k => [k, k.toUpperCase()]));
const normalRows = Object.fromEntries(pvMetricRows(pvModelLoop(pvParams({}, 'normal')), labels).map(([k, v]) => [k, v]));
assert.deepEqual(Object.keys(normalRows), ['EDV', 'ESV', 'SV', 'EF', 'ESP', 'PEAK', 'EDP', 'EES', 'EA', 'COUPLING', 'SW'], 'no leak rows for a normal loop');
assert.equal(normalRows.EDV, '130');
assert.equal(normalRows.SV, '81');
assert.equal(normalRows.EF, '63');
const mrRows = Object.fromEntries(pvMetricRows(pvModelLoop(pvParams({}, 'mitral-regurgitation-acute')), labels));
assert.ok(mrRows.FSV === '83' && mrRows.RGV === '28' && mrRows.SV === '110', 'acute MR: total, forward and regurgitant volumes');

console.log('hemo-panel sampleStrip tests passed');
