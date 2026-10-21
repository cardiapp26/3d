/**
 * Deterministic teaching model, not a patient recording or a vendor algorithm.
 * Concepts: Haq et al., Electrogram recording (2026), DOI 10.1016/j.ipej.2026.09.004.
 * Synthetic amplitudes/widths/CV below are chosen for visibility, not fitted data.
 * Units: time ms, voltage input-referred mV, distance mm, frequency Hz.
 * Acquisition: 8 kHz source -> optional analog anti-alias LP -> gain/ADC clipping
 * and quantization -> causal digital HP/LP/notch -> zero-order hold for display.
 */
export const INTERNAL_FS = 8000;
export const DURATION_MS = 600;
export const EVENT_MS = 250;
export const ADC_FULL_SCALE = 2; // ADC input range ±2 mV after analog gain
export const DEFAULT_RECORDING_STATE = Object.freeze({
  angle: 30, virtualAngle: 0, spacing: 3, contact: 1, hp: 0.5, lp: 500,
  notch: 0, mains: 0.08, mismatch: 0, sampleRate: 2000, bits: 12,
  gain: 1, antiAlias: true, recordingType: 'unipolar', scenario: 'passing', seed: 2026
});
export const RECORDING_SCENARIOS = Object.freeze([
  { id: 'passing' }, { id: 'focus' }, { id: 'breakthrough' },
  { id: 'purkinje' }, { id: 'collision' }, { id: 'shared-local' }, { id: 'deep' }
]);
// Deep/epicardial source below the sampled plane (Haq Fig. 7 concept): offset
// 4 mm upstream and 15 mm deep, spread 1 mm/ms. Arrival and amplitude differ
// only slightly between close electrodes, more between widely spaced ones.
const DEEP = Object.freeze({ x: -4, depth: 15, cv: 1, at: EVENT_MS + 95, amplitude: 0.55 });
const clamp = (v, lo, hi, fallback) => Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : fallback;
const gaussian = (t, at, width) => Math.exp(-0.5 * ((t - at) / width) ** 2);
const passing = (t, at, width = 4) => { const x = (t - at) / width; return -x * Math.exp(0.5 - 0.5 * x * x); };
const pp = (a) => { let lo = Infinity, hi = -Infinity; for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); } return hi - lo; };
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);

function normalize(options) {
  const o = options && typeof options === 'object' ? options : {};
  const d = DEFAULT_RECORDING_STATE;
  const allowed = (key, values) => values.includes(Number(o[key])) ? Number(o[key]) : d[key];
  return {
    angle: clamp(o.angle, 0, 180, d.angle), virtualAngle: clamp(o.virtualAngle, 0, 180, d.virtualAngle),
    spacing: clamp(o.spacing, 1, 10, d.spacing), contact: clamp(o.contact, 0, 1, d.contact),
    hp: clamp(o.hp, 0.05, 100, d.hp), lp: clamp(o.lp, 120, 1000, d.lp),
    notch: allowed('notch', [0, 50, 60]), mains: clamp(o.mains, 0, 0.5, d.mains),
    mismatch: clamp(o.mismatch, 0, 1, d.mismatch), sampleRate: allowed('sampleRate', [250, 500, 1000, 2000, 4000]),
    bits: allowed('bits', [8, 12, 16]), gain: clamp(o.gain, 1, 16, d.gain),
    antiAlias: o.antiAlias !== false,
    recordingType: o.recordingType === 'bipolar' ? 'bipolar' : 'unipolar',
    scenario: RECORDING_SCENARIOS.some((s) => s.id === o.scenario) ? o.scenario : d.scenario,
    seed: clamp(o.seed, 1, 2147483646, d.seed)
  };
}

/** RBJ biquad, normalized coefficients. Causal, with zero initial state. */
function biquad(samples, fs, cutoff, type, q = Math.SQRT1_2) {
  const fc = Math.min(fs * 0.499, Math.max(0.001, cutoff));
  const w = 2 * Math.PI * fc / fs, c = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else if (type === 'notch') { b0 = 1; b1 = -2 * c; b2 = 1; }
  else { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  const a0 = 1 + alpha, a1 = -2 * c / a0, a2 = (1 - alpha) / a0;
  b0 /= a0; b1 /= a0; b2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return samples.map((value) => {
    const x = Number.isFinite(value) ? value : 0;
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  });
}

/** Actual causal sample filters. Effective digital LP cannot exceed 0.45 Fs. */
export function filterSignal(samples, { fs = INTERNAL_FS, hp = 0, lp = 0, notch = 0 } = {}) {
  const rate = clamp(fs, 100, 192000, INTERNAL_FS);
  let signal = Array.from(samples, (v) => Number.isFinite(v) ? v : 0);
  if (hp > 0) signal = biquad(signal, rate, Math.min(hp, rate * 0.45), 'hp');
  if (lp > 0) signal = biquad(signal, rate, Math.min(lp, rate * 0.45), 'lp');
  if (notch > 0 && notch < rate / 2) signal = biquad(signal, rate, notch, 'notch', 12);
  return signal;
}

/** Samples remain input-referred: analog gain improves ADC resolution but shrinks headroom. */
export function digitize(samples, { inputFs = INTERNAL_FS, sampleRate = 2000, bits = 12, gain = 1, antiAlias = true } = {}) {
  const sourceFs = clamp(inputFs, 100, 192000, INTERNAL_FS);
  const fs = clamp(sampleRate, 100, sourceFs, Math.min(2000, sourceFs));
  const depth = Math.round(clamp(bits, 2, 24, 12)), amplification = clamp(gain, 1, 16, 1);
  let signal = Array.from(samples, (v) => Number.isFinite(v) ? v : 0);
  if (antiAlias && fs < sourceFs) {
    // Fourth-order Butterworth analog-front-end approximation, below target Nyquist.
    signal = biquad(biquad(signal, sourceFs, fs * 0.4, 'lp', 0.5411961), sourceFs, fs * 0.4, 'lp', 1.306563);
  }
  const levels = 2 ** depth - 1, step = 2 * ADC_FULL_SCALE / levels;
  let clipped = 0;
  const count = Math.floor((signal.length - 1) * fs / sourceFs) + 1;
  const result = Array.from({ length: count }, (_, i) => {
    const position = i * sourceFs / fs, low = Math.floor(position), fraction = position - low;
    const value = (signal[low] * (1 - fraction) + signal[Math.min(low + 1, signal.length - 1)] * fraction) * amplification;
    if (Math.abs(value) > ADC_FULL_SCALE) clipped++;
    const bounded = Math.max(-ADC_FULL_SCALE, Math.min(ADC_FULL_SCALE, value));
    return (Math.round((bounded + ADC_FULL_SCALE) / step) * step - ADC_FULL_SCALE) / amplification;
  });
  return { samples: result, sampleRate: fs, step: step / amplification, clippedPercent: count ? clipped * 100 / count : 0 };
}

function localAt(t, x, y, scenario) {
  const cv = 0.5; // 0.5 mm/ms, synthetic planar conduction speed
  if (scenario === 'shared-local') return passing(t, EVENT_MS);
  if (scenario === 'focus' || scenario === 'breakthrough') {
    // Identical surface QS examples intentionally demonstrate that QS cannot
    // distinguish a true origin from endocardial breakthrough by itself.
    return -gaussian(t, EVENT_MS + Math.hypot(x, y) / cv, 4.8);
  }
  const main = passing(t, EVENT_MS + x / cv);
  if (scenario === 'collision') return main + 0.7 * passing(t, EVENT_MS + 9 + (-0.6 * x + 0.8 * y) / cv, 3.5);
  if (scenario === 'purkinje') return main + 0.23 * passing(t, EVENT_MS - 18 + x / cv, 0.65);
  if (scenario === 'deep') {
    const r = Math.hypot(x - DEEP.x, y, DEEP.depth), r0 = Math.hypot(DEEP.x, DEEP.depth);
    return main + DEEP.amplitude * (r0 / r) * passing(t, DEEP.at + (r - r0) / DEEP.cv, 5);
  }
  return main;
}

/**
 * Bipolar peak-to-peak of the noiseless local signal only (U1 - contact x U2)
 * for each requested pair angle. Cheap enough to redraw an orientation curve
 * while a slider moves; it omits ADC, filters and instrumentation noise.
 */
export function bipolarAmplitudeByAngle(options = {}, angles = []) {
  const state = normalize(options);
  const step = 1000 / 4000;
  return angles.map((degrees) => {
    const theta = degrees * Math.PI / 180;
    const dx = state.spacing * Math.cos(theta), dy = state.spacing * Math.sin(theta);
    let lo = Infinity, hi = -Infinity;
    for (let t = EVENT_MS - 40; t <= EVENT_MS + 140; t += step) {
      const v = localAt(t, 0, 0, state.scenario) - state.contact * localAt(t, dx, dy, state.scenario);
      if (v < lo) lo = v; if (v > hi) hi = v;
    }
    return hi - lo;
  });
}

/** Myocardial intrinsic deflection within a known window (excludes earlier Purkinje example). */
function activationTime(samples, fs, minProminence = 0) {
  let minSlope = Infinity, lat = null;
  const start = Math.max(1, Math.ceil((EVENT_MS - 12) * fs / 1000));
  const end = Math.min(samples.length - 2, Math.floor((EVENT_MS + 30) * fs / 1000));
  // Quantizer mid-rise offset and causal-filter settling are not local events.
  // Require prominence above acquisition resolution and known input noise.
  if (pp(samples.slice(start, end + 1)) <= Math.max(1e-4, minProminence)) return null;
  let best = -1;
  for (let i = start; i <= end; i++) {
    const slope = (samples[i + 1] - samples[i - 1]) * fs / 2000;
    if (slope < minSlope) { minSlope = slope; lat = i * 1000 / fs; best = i; }
  }
  return minSlope < -1e-6 && best > start && best < end ? lat : null;
}

// Integrate the reconstructed field over a common aperture. For a planar wave
// this recovers finite-spacing voltage rather than extrapolating gradient*d
// across a large aperture. The assumed propagation delay is known in this model.
function apertureAverage(signal, width) {
  const integral = new Array(signal.length).fill(0);
  for (let i = 1; i < signal.length; i++) integral[i] = integral[i - 1] + 0.5 * (signal[i - 1] + signal[i]);
  return signal.map((_, i) => {
    const at = i - width;
    if (at <= 0) return integral[i] / width;
    const low = Math.floor(at), fraction = at - low;
    const past = integral[low] * (1 - fraction) + integral[Math.min(low + 1, integral.length - 1)] * fraction;
    return (integral[i] - past) / width;
  });
}

function spectrum(signal, fs) {
  const freqs = [20, 40, 60, 80, 100, 120, 160, 200, 240, 300, 400, 500, 700, 900].filter((f) => f <= Math.min(900, fs * 0.45));
  const times = [], power = [], size = Math.round(fs * 0.064), hop = Math.round(fs * 0.032);
  for (let start = 0; start + size <= signal.length; start += hop) {
    times.push((start + size / 2) * 1000 / fs);
    power.push(freqs.map((f) => {
      let re = 0, im = 0;
      for (let j = 0; j < size; j++) {
        const value = signal[start + j] * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / (size - 1)));
        const phase = 2 * Math.PI * f * j / fs;
        re += value * Math.cos(phase); im -= value * Math.sin(phase);
      }
      return (re * re + im * im) / (size * size);
    }));
  }
  let maximum = 0; for (const row of power) for (const v of row) maximum = Math.max(maximum, v);
  return { times, freqs, power: power.map((row) => row.map((v) => maximum ? v / maximum : 0)) };
}

export function simulateRecording(options = {}) {
  const state = normalize(options), theta = state.angle * Math.PI / 180;
  const dx = state.spacing * Math.cos(theta), dy = state.spacing * Math.sin(theta);
  const count = DURATION_MS * INTERNAL_FS / 1000 + 1;
  const times = Array.from({ length: count }, (_, i) => i * 1000 / INTERNAL_FS);
  const traces = Object.fromEntries(['u1', 'u2', 'bipolar', 'raw', 'filtered', 'sampled', 'omni', 'orthogonal', 'fieldX', 'fieldY', 'virtual', 'tripolar', 'multipolar', 'far', 'local', 'shared'].map((key) => [key, []]));
  let seed = Math.floor(state.seed);
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647 - 0.5; };
  const noise = []; let gx = [], gy = [];
  for (const t of times) {
    const local = localAt(t, 0, 0, state.scenario);
    const far = 0.45 * gaussian(t, EVENT_MS + 85, 27);
    // Known synthetic instrumentation contamination, including out-of-band pickup.
    const interference = state.mains * Math.sin(2 * Math.PI * 50 * t / 1000)
      + 0.025 * Math.sin(2 * Math.PI * 900 * t / 1000) + 0.008 * random()
      + 0.035 * Math.sin(2 * Math.PI * 0.7 * t / 1000);
    const common = far + interference;
    const u1 = local + common;
    const u2 = state.contact * localAt(t, dx, dy, state.scenario) + (1 - state.mismatch) * common;
    const left = localAt(t, -dx, -dy, state.scenario) + common;
    const right = u2;
    const neighbors = [[dx, dy], [-dx, -dy], [-dy, dx], [dy, -dx]];
    const shared = neighbors.reduce((sum, [x, y], index) => sum
      + (index === 0 ? state.contact : 1) * localAt(t, x, y, state.scenario)
      + (index === 0 ? 1 - state.mismatch : 1) * common, 0) / neighbors.length;
    traces.local.push(local); traces.far.push(far); traces.u1.push(u1); traces.u2.push(u2);
    traces.bipolar.push(u1 - u2);
    traces.tripolar.push(u1 - 0.5 * (left + right));
    traces.shared.push(shared); traces.multipolar.push(u1 - shared);
    noise.push(interference * (state.recordingType === 'bipolar' ? state.mismatch : 1));
    // Infinitesimal spatial gradient approximation. Two orthogonal projections
    // reconstruct a field; selecting only the larger channel would be incorrect.
    const h = 0.002;
    const ex = (localAt(t, h, 0, state.scenario) - localAt(t, -h, 0, state.scenario)) / (2 * h);
    const ey = (localAt(t, 0, h, state.scenario) - localAt(t, 0, -h, state.scenario)) / (2 * h);
    gx.push(-state.spacing * (ex * Math.cos(theta) + ey * Math.sin(theta)) * state.contact);
    gy.push(-state.spacing * (-ex * Math.sin(theta) + ey * Math.cos(theta)));
  }
  gx = apertureAverage(gx, state.spacing / 0.5 * INTERNAL_FS / 1000);
  gy = apertureAverage(gy, state.spacing / 0.5 * INTERNAL_FS / 1000);
  // Exact maximum peak-to-peak projection across all angles: the diameter of
  // the local vector samples. max_theta max_ij (vi-vj)·unit(theta) = max_ij |vi-vj|.
  // This also avoids confusing maximum variance (PCA) with maximum voltage.
  let direction = 0, largestSquared = 0;
  const localStart = Math.ceil((EVENT_MS - 28) * INTERNAL_FS / 1000);
  const localEnd = Math.floor((EVENT_MS + 38) * INTERNAL_FS / 1000);
  for (let i = localStart; i <= localEnd; i++) {
    for (let j = localStart; j < i; j++) {
      const x = gx[i] - gx[j], y = gy[i] - gy[j], squared = x * x + y * y;
      if (squared > largestSquared) { largestSquared = squared; direction = Math.atan2(y, x); }
    }
  }
  // Resolve projection sign consistently against the known planar travel axis.
  if (Math.cos(direction + theta) < 0) direction += Math.PI;
  const virtual = state.virtualAngle * Math.PI / 180;
  traces.omni = gx.map((x, i) => x * Math.cos(direction) + gy[i] * Math.sin(direction));
  traces.orthogonal = gy; traces.fieldX = gx; traces.fieldY = gy;
  traces.virtual = gx.map((x, i) => x * Math.cos(virtual) + gy[i] * Math.sin(virtual));
  traces.raw = [...(state.recordingType === 'bipolar' ? traces.bipolar : traces.u1)];
  const acquisition = digitize(traces.raw, state);
  const processed = filterSignal(acquisition.samples, { fs: state.sampleRate, hp: state.hp, lp: state.lp, notch: state.notch });
  const hold = (samples) => times.map((t) => samples[Math.min(samples.length - 1, Math.floor(t * state.sampleRate / 1000 + 1e-9))]);
  traces.sampled = hold(acquisition.samples); traces.filtered = hold(processed);
  const noiseRms = rms(noise);
  const rawLat = activationTime(traces.raw, INTERNAL_FS, 4 * noiseRms);
  // A before/after timing comparison needs an actual event in the selected input.
  const filteredLat = rawLat == null ? null : activationTime(processed, state.sampleRate, Math.max(3 * acquisition.step, 4 * noiseRms));
  const omniAvailable = !['focus', 'breakthrough', 'deep'].includes(state.scenario);
  const warnings = ['synthetic', 'planar-assumption'];
  if (!omniAvailable) warnings.push(state.scenario === 'deep' ? 'deep-source' : 'nonplanar-source');
  if (state.contact < 0.95) warnings.push('contact');
  if (state.scenario === 'collision') warnings.push('collision');
  if (state.scenario === 'shared-local') warnings.push('shared-local-loss');
  if (!state.antiAlias) warnings.push('aliasing');
  if (state.lp > state.sampleRate * 0.45) warnings.push('bandwidth-limited');
  if (acquisition.clippedPercent > 0) warnings.push('clipping');
  if (state.mismatch > 0) warnings.push('reference-imbalance');
  return {
    state, times, traces, spectrum: spectrum(processed, state.sampleRate),
    metrics: {
      rawPp: pp(traces.raw), filteredPp: pp(traces.filtered), bipolarPp: pp(traces.bipolar),
      omniPp: omniAvailable ? pp(traces.omni) : null, tripolarPp: pp(traces.tripolar),
      rawLat, filteredLat, latShift: rawLat == null || filteredLat == null ? null : filteredLat - rawLat,
      clippedPercent: acquisition.clippedPercent, noiseRms
    },
    geometry: { lagMs: dx / 0.5, angle: state.angle, spacing: state.spacing, x2: dx, y2: dy, direction: direction * 180 / Math.PI },
    warnings,
    meta: {
      source: '10.1016/j.ipej.2026.09.004', synthetic: true, internalFs: INTERNAL_FS,
      effectiveLp: Math.min(state.lp, state.sampleRate * 0.45), adcStep: acquisition.step,
      omniAvailable,
      voltageUnit: 'input-referred mV', timeUnit: 'ms',
      omniMethod: 'spatial gradient, common-aperture integration at known synthetic CV, orthogonal projection maximizing local peak-to-peak voltage; not a vendor implementation',
      multipolarMethod: 'unweighted shared-neighbor mean subtraction; not commercial PCA',
      spectrumMethod: 'processed ADC signal at acquisition Fs, 64ms Hann window/32ms hop, normalized power, frequencies <=0.45Fs; no clinical peak-frequency classifier',
      noiseMethod: 'input recording contamination RMS before acquisition/filtering; bipolar residual = mismatch × common instrumentation contamination'
    }
  };
}
