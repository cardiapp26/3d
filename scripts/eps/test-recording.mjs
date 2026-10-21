import assert from 'node:assert/strict';
import {
  DEFAULT_RECORDING_STATE, RECORDING_SCENARIOS, INTERNAL_FS, EVENT_MS,
  simulateRecording, filterSignal, digitize, bipolarAmplitudeByAngle
} from '../../src/eps/recording-model.js';
import { LESSONS, computeMetrics, omniAngle } from '../../src/eps/recording-lessons.js';
import { RECORDING_TEXT } from '../../src/eps/recording-text.js';

const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
const maxDiff = (a, b) => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0);
const tone = (frequency, fs = 4000, seconds = 3) => Array.from({ length: fs * seconds }, (_, i) => Math.sin(2 * Math.PI * frequency * i / fs));
const settledGain = (frequency, options) => {
  const input = tone(frequency);
  return rms(filterSignal(input, { fs: 4000, ...options }).slice(4000)) / rms(input.slice(4000));
};

const base = simulateRecording();
assert.deepEqual(simulateRecording(), base, 'fixed seed reproduces every trace and metric');
assert.equal(base.times.length, 4801);
assert.equal(base.times[0], 0); assert.equal(base.times.at(-1), 600);
for (const [name, values] of Object.entries(base.traces)) {
  assert.equal(values.length, base.times.length, `${name} aligns to shared clock`);
  assert.ok(values.every(Number.isFinite), `${name} finite mV`);
}
assert.ok(base.metrics.rawLat >= EVENT_MS - 12 && base.metrics.rawLat <= EVENT_MS + 30, 'LAT is local-window negative derivative, not global peak');
assert.equal(base.metrics.latShift, base.metrics.filteredLat - base.metrics.rawLat);
assert.ok(base.metrics.filteredPp > 0 && base.metrics.filteredPp < 4);
assert.ok(base.metrics.noiseRms > 0);
assert.ok(base.spectrum.power.every((row) => row.length === base.spectrum.freqs.length && row.every((x) => x >= 0 && x <= 1)));
assert.deepEqual(base.traces.raw, base.traces.u1, 'unipolar selected input is U1');
const balancedInput = simulateRecording({ recordingType: 'bipolar', mismatch: 0 });
const imbalancedInput = simulateRecording({ recordingType: 'bipolar', mismatch: 0.5 });
assert.deepEqual(balancedInput.traces.raw, balancedInput.traces.bipolar, 'bipolar selected input is U1-U2');
assert.equal(balancedInput.metrics.noiseRms, 0, 'balanced input cancels shared instrumentation contamination');
assert.ok(Math.abs(imbalancedInput.metrics.noiseRms - base.metrics.noiseRms * 0.5) < 1e-12, 'bipolar input noise reflects residual common-mode imbalance');
assert.notDeepEqual(balancedInput.traces.filtered, base.traces.filtered, 'ADC and filters receive selected input');

for (let i = 0; i < base.times.length; i++) {
  assert.equal(base.traces.bipolar[i], base.traces.u1[i] - base.traces.u2[i], 'bipolar exact subtraction');
}
const aligned = simulateRecording({ angle: 0 }), across = simulateRecording({ angle: 90 });
assert.ok(across.metrics.bipolarPp < 1e-10, 'matched planar bipole blind at 90 degrees');
assert.ok(aligned.metrics.bipolarPp > 1);
for (const options of [
  { angle: 90 }, { scenario: 'shared-local' },
  { angle: 90, bits: 8, hp: 0.05, sampleRate: 250 },
  { angle: 90, bits: 16, hp: 100, sampleRate: 4000 }
]) {
  const result = simulateRecording({ recordingType: 'bipolar', mismatch: 0, ...options });
  assert.equal(result.metrics.rawLat, null, 'canceled bipolar channel has no local event');
  assert.equal(result.metrics.filteredLat, null, 'ADC offset/filter startup cannot create annotated event');
  assert.equal(result.metrics.latShift, null, 'no timing comparison without event');
}
assert.ok(Number.isFinite(balancedInput.metrics.rawLat) && Number.isFinite(balancedInput.metrics.filteredLat), 'actual bipolar local potential keeps timing annotations');
for (const angle of [0, 20, 45, 70, 90, 130, 180]) {
  const result = simulateRecording({ angle });
  assert.ok(Math.abs(result.metrics.omniPp - aligned.metrics.omniPp) < 1e-9, 'omni amplitude invariant to clique rotation in matched planar example');
}
assert.ok(maxDiff(aligned.traces.omni, aligned.traces.bipolar) < 0.002, 'field integration independently agrees with finite U1-U2 at aligned aperture');
const oblique = simulateRecording({ angle: 45 });
assert.ok(oblique.metrics.omniPp > Math.max(...oblique.traces.fieldX) - Math.min(...oblique.traces.fieldX), 'vector reconstruction exceeds either 45-degree orthogonal channel');
assert.deepEqual(simulateRecording({ virtualAngle: 0 }).traces.virtual, base.traces.fieldX, 'virtual projection zero angle equals field X');
const narrow = simulateRecording({ spacing: 1, angle: 0 }), medium = simulateRecording({ spacing: 3, angle: 0 }), wide = simulateRecording({ spacing: 10, angle: 0 });
assert.ok(medium.metrics.bipolarPp > narrow.metrics.bipolarPp && wide.metrics.bipolarPp < medium.metrics.bipolarPp, 'spacing relation follows waveform overlap, no universal monotonic amplitude rule');
assert.equal(wide.geometry.lagMs, 20, '10mm / 0.5mm/ms = 20ms');
assert.ok(wide.metrics.omniPp < 3, 'finite-aperture reconstruction does not extrapolate gradient to implausible amplitude');

const shared = simulateRecording({ scenario: 'shared-local' });
assert.ok(shared.traces.local.some((v) => Math.abs(v) > 0.9));
assert.ok(rms(shared.traces.tripolar) < 1e-12 && rms(shared.traces.multipolar) < 1e-12, 'shared real local activity also cancels');
assert.ok(shared.warnings.includes('shared-local-loss'));
const noContact = simulateRecording({ contact: 0, mismatch: 0 });
assert.ok(maxDiff(noContact.traces.bipolar, noContact.traces.local) < 1e-12, 'contact loss leaves first-pole local signal after common subtraction');
assert.ok(noContact.warnings.includes('contact'));
assert.ok(simulateRecording({ mismatch: 1, angle: 90 }).metrics.bipolarPp > 0.5, 'reference imbalance defeats common-mode cancellation');
assert.deepEqual(simulateRecording({ scenario: 'focus' }).traces.local, simulateRecording({ scenario: 'breakthrough' }).traces.local, 'surface QS alone cannot distinguish focus from breakthrough');
for (const scenario of ['focus', 'breakthrough']) {
  const result = simulateRecording({ scenario });
  assert.equal(result.metrics.omniPp, null, 'radial source cannot present zero gradient as valid omnipolar voltage');
  assert.equal(result.meta.omniAvailable, false, 'nonplanar source reconstruction explicitly unavailable');
  assert.ok(result.warnings.includes('nonplanar-source'));
}
assert.equal(base.meta.omniAvailable, true, 'matched planar reconstruction available');
assert.ok(simulateRecording({ scenario: 'collision' }).warnings.includes('collision'));
for (const scenario of ['passing', 'collision']) {
  const result = simulateRecording({ scenario, angle: 37.5 });
  const indices = result.times.map((t, i) => t >= EVENT_MS - 28 && t <= EVENT_MS + 38 ? i : -1).filter((i) => i >= 0);
  const amplitude = (values) => Math.max(...indices.map((i) => values[i])) - Math.min(...indices.map((i) => values[i]));
  const omniAmplitude = amplitude(result.traces.omni);
  let sweepMaximum = 0;
  for (let degrees = 0; degrees < 180; degrees++) {
    const angle = degrees * Math.PI / 180;
    const projected = result.traces.fieldX.map((x, i) => x * Math.cos(angle) + result.traces.fieldY[i] * Math.sin(angle));
    sweepMaximum = Math.max(sweepMaximum, amplitude(projected));
  }
  assert.ok(omniAmplitude >= sweepMaximum - 1e-10 && omniAmplitude - sweepMaximum < 0.001, `${scenario}: exact maximum agrees independent 1-degree angular sweep`);
}

assert.ok(settledGain(5, { hp: 30 }) < 0.04, 'HP attenuates low-frequency content');
assert.ok(settledGain(80, { hp: 30, lp: 500 }) > 0.95, 'band passes 80Hz');
assert.ok(settledGain(700, { lp: 120 }) < 0.04, 'LP attenuates high-frequency content');
assert.ok(settledGain(50, { notch: 50 }) < 0.01, 'matched notch suppresses mains');
assert.ok(settledGain(50, { notch: 60 }) > 0.95, 'wrong notch does not suppress 50Hz');
assert.ok(Math.abs(simulateRecording({ lp: 120 }).metrics.latShift) > 0.5, 'causal LP changes annotated timing');
const sharpAmplitude = (lp) => {
  const result = simulateRecording({ scenario: 'purkinje', mains: 0, lp, sampleRate: 4000 });
  const early = result.traces.filtered.filter((_, i) => result.times[i] >= 228 && result.times[i] <= 236);
  return Math.max(...early) - Math.min(...early);
};
assert.ok(sharpAmplitude(500) > 2 * sharpAmplitude(120), 'wider LP preserves synthetic sharp Purkinje component');

const ramp = Array.from({ length: 501 }, (_, i) => -1 + 2 * i / 500);
for (const bits of [8, 12, 16]) {
  const result = digitize(ramp, { inputFs: 2000, sampleRate: 2000, antiAlias: false, bits });
  assert.ok(maxDiff(ramp, result.samples) <= result.step / 2 + 1e-12, `${bits}-bit error bounded by half LSB`);
  assert.equal(result.clippedPercent, 0);
}
const lowBits = digitize(ramp, { antiAlias: false, inputFs: 2000, sampleRate: 2000, bits: 8 });
const highBits = digitize(ramp, { antiAlias: false, inputFs: 2000, sampleRate: 2000, bits: 16 });
assert.ok(maxDiff(ramp, highBits.samples) < maxDiff(ramp, lowBits.samples) / 100, 'bit depth improves resolution');
const clipped = simulateRecording({ gain: 16 });
assert.ok(clipped.metrics.clippedPercent > 0 && clipped.warnings.includes('clipping'));
assert.ok(clipped.traces.sampled.every((v) => Math.abs(v) <= 2 / 16), 'input-referred ADC clip shrinks with gain');
assert.ok(clipped.metrics.filteredPp < base.metrics.filteredPp / 2, 'digital filters cannot restore clipped waveform');
const highTone = tone(900, INTERNAL_FS, 1);
const protectedAdc = digitize(highTone, { sampleRate: 1000, bits: 16, antiAlias: true });
const bypassedAdc = digitize(highTone, { sampleRate: 1000, bits: 16, antiAlias: false });
assert.ok(rms(protectedAdc.samples.slice(200)) < rms(bypassedAdc.samples.slice(200)) / 15, 'anti-alias filter attenuates before downsampling');
assert.ok(simulateRecording({ antiAlias: false, sampleRate: 250 }).warnings.includes('aliasing'));
assert.ok(simulateRecording({ sampleRate: 250, lp: 1000 }).warnings.includes('bandwidth-limited'));
assert.ok(simulateRecording({ sampleRate: 2000, lp: 950 }).warnings.includes('bandwidth-limited'), 'effective digital clamp warning starts above 0.45 Fs');
for (const sampleRate of [250, 500, 1000, 2000, 4000]) {
  const result = simulateRecording({ sampleRate });
  assert.ok(result.spectrum.freqs.every((f) => f <= Math.min(900, sampleRate * 0.45)), 'processed spectrum excludes ADC images above supported bandwidth');
  assert.equal(result.spectrum.times[0], 32, 'first window centered at 32ms independent of sample rate');
  assert.equal(result.spectrum.times[1] - result.spectrum.times[0], 32, 'fixed 32ms hop');
}
assert.notDeepEqual(simulateRecording({ lp: 120 }).spectrum.power, simulateRecording({ lp: 500 }).spectrum.power, 'spectrum reflects processed acquisition and changes with filter');
assert.equal(digitize([]).clippedPercent, 0);
assert.equal(digitize(ramp, { inputFs: 100, sampleRate: NaN }).sampleRate, 100, 'invalid ADC rate fallback never exceeds the input rate');

const invalid = simulateRecording({ angle: NaN, contact: Infinity, spacing: -99, hp: 'bad', lp: Infinity, gain: 200, sampleRate: 123, scenario: 'unknown' });
assert.equal(invalid.state.angle, DEFAULT_RECORDING_STATE.angle);
assert.equal(invalid.state.spacing, 1); assert.equal(invalid.state.gain, 16);
assert.ok(Object.values(invalid.traces).every((values) => values.every(Number.isFinite)));
assert.equal(RECORDING_SCENARIOS.length, 7);
console.log('PASS recording: deterministic sampled mV/ms traces, finite bipolar geometry, vector omnipolar reconstruction, spatial subtraction and shared-local loss, causal HP/LP/notch response and LAT, quantization, irreversible clipping, pre-ADC anti-aliasing and input bounds');
