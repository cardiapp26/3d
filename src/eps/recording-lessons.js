/**
 * Guided lessons of the EGM recording laboratory, in the order of Haq et al.,
 * Electrogram recording (IPEJ 2026): chain, filters, noise, unipolar, bipolar,
 * spacing/orientation, omnipolar, near-field discrimination.
 * Each lesson fixes a clean teaching baseline, shows only its own traces and
 * controls, and lists experiment steps whose completion is read from the
 * simulated state and metrics (never from a click alone, except "observe").
 * Text lives in recording-text.js under the same lesson ids.
 */
import { EVENT_MS } from './recording-model.js';

const span = (r, key, from, to) => {
  const values = r.traces[key];
  if (!values) return null;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < r.times.length; i++) {
    const t = r.times[i];
    if (t < from || t > to) continue;
    if (values[i] < lo) lo = values[i];
    if (values[i] > hi) hi = values[i];
  }
  return Number.isFinite(hi - lo) ? hi - lo : null;
};
const SHARP = [EVENT_MS - 24, EVENT_MS - 12];
const LOCAL = [EVENT_MS - 30, EVENT_MS + 45];
const DEEP = [EVENT_MS + 75, EVENT_MS + 125];

/** Unipolar shape: an initial positive deflection before the steepest downstroke. */
function morphology(r, key) {
  const values = r.traces[key];
  let minIndex = -1, min = Infinity, max = -Infinity;
  for (let i = 0; i < r.times.length; i++) {
    if (r.times[i] < LOCAL[0] || r.times[i] > LOCAL[1]) continue;
    if (values[i] < min) { min = values[i]; minIndex = i; }
  }
  if (minIndex < 0) return null;
  const base = values[r.times.findIndex((t) => t >= LOCAL[0])];
  for (let i = 0; i <= minIndex; i++) if (r.times[i] >= LOCAL[0]) max = Math.max(max, values[i]);
  const depth = base - min, rise = max - base;
  if (!(depth > 0.05)) return null;
  return rise > 0.15 * depth ? 'rS' : 'QS';
}

/** Metric definitions: value from (result, state), unit and decimals. */
export const METRICS = {
  clippedPercent: { get: (r) => r.metrics.clippedPercent, unit: '%', digits: 2 },
  adcStep: { get: (r) => r.meta.adcStep * 1000, unit: 'µV', digits: 2 },
  levels: { get: (r, s) => 2 ** s.bits, unit: '', digits: 0 },
  nyquist: { get: (r, s) => s.sampleRate / 2, unit: 'Hz', digits: 0 },
  rawPp: { get: (r) => r.metrics.rawPp, unit: 'mV', digits: 2 },
  filteredPp: { get: (r) => r.metrics.filteredPp, unit: 'mV', digits: 2 },
  sharpRaw: { get: (r, s) => s.scenario === 'purkinje' ? span(r, 'raw', ...SHARP) : null, unit: 'mV', digits: 2 },
  sharpFiltered: { get: (r, s) => s.scenario === 'purkinje' ? span(r, 'filtered', ...SHARP) : null, unit: 'mV', digits: 2 },
  rawLat: { get: (r) => r.metrics.rawLat, unit: 'ms', digits: 1 },
  filteredLat: { get: (r) => r.metrics.filteredLat, unit: 'ms', digits: 1 },
  latShift: { get: (r) => r.metrics.latShift, unit: 'ms', digits: 1 },
  noiseRms: { get: (r) => r.metrics.noiseRms, unit: 'mV', digits: 3 },
  morphRaw: { get: (r) => morphology(r, 'raw'), unit: '' },
  morphFiltered: { get: (r) => morphology(r, 'filtered'), unit: '' },
  u1Pp: { get: (r) => span(r, 'u1', ...LOCAL), unit: 'mV', digits: 2 },
  u2Pp: { get: (r) => span(r, 'u2', ...LOCAL), unit: 'mV', digits: 2 },
  bipolarPp: { get: (r) => span(r, 'bipolar', ...LOCAL), unit: 'mV', digits: 2 },
  lagMs: { get: (r) => Math.abs(r.geometry.lagMs), unit: 'ms', digits: 1 },
  deepUni: { get: (r, s) => s.scenario === 'deep' ? span(r, 'u1', ...DEEP) : null, unit: 'mV', digits: 2 },
  deepBi: { get: (r, s) => s.scenario === 'deep' ? span(r, 'bipolar', ...DEEP) : null, unit: 'mV', digits: 2 },
  bxPp: { get: (r) => r.meta.omniAvailable ? span(r, 'fieldX', ...LOCAL) : null, unit: 'mV', digits: 2 },
  byPp: { get: (r) => r.meta.omniAvailable ? span(r, 'fieldY', ...LOCAL) : null, unit: 'mV', digits: 2 },
  virtualPp: { get: (r) => r.meta.omniAvailable ? span(r, 'virtual', ...LOCAL) : null, unit: 'mV', digits: 2 },
  omniPp: { get: (r) => r.meta.omniAvailable ? span(r, 'omni', ...LOCAL) : null, unit: 'mV', digits: 2 },
  direction: { get: (r) => r.meta.omniAvailable ? omniAngle(r) : null, unit: '°', digits: 0 },
  farU1: { get: (r) => span(r, 'far', 0, 600), unit: 'mV', digits: 2 },
  tripolarPp: { get: (r) => span(r, 'tripolar', ...LOCAL), unit: 'mV', digits: 2 },
  multipolarPp: { get: (r) => span(r, 'multipolar', ...LOCAL), unit: 'mV', digits: 2 }
};

/** Reconstructed maximal direction folded into the 0–180° virtual-bipole range. */
export function omniAngle(r) {
  const d = ((r.geometry.direction % 180) + 180) % 180;
  return Math.round(d);
}

export function computeMetrics(result, state) {
  const out = {};
  for (const [key, def] of Object.entries(METRICS)) {
    const value = def.get(result, state);
    out[key] = value === undefined ? null : value;
  }
  return out;
}

const QUIET = { mains: 0, mismatch: 0, notch: 0, contact: 1, gain: 1, bits: 12, antiAlias: true, virtualAngle: 0 };

export const LESSONS = [
  {
    id: 'chain', diagram: 'pipeline', extra: 'adc',
    traces: ['raw', 'sampled', 'filtered'],
    controls: ['gain', 'bits', 'sampleRate', 'antiAlias'],
    scenarios: ['purkinje', 'passing'],
    base: { ...QUIET, scenario: 'purkinje', recordingType: 'unipolar', sampleRate: 2000, hp: 0.5, lp: 500 },
    metrics: ['clippedPercent', 'adcStep', 'levels', 'nyquist', 'rawPp', 'filteredPp'],
    warnings: ['clipping', 'aliasing', 'bandwidth-limited'],
    steps: [
      { apply: { gain: 16 }, done: (s, m) => m.clippedPercent > 0 },
      { apply: { display: 1 }, done: (s, m) => s.display <= 1 && m.clippedPercent > 0 },
      { apply: { gain: 1, bits: 8 }, done: (s, m) => s.bits === 8 && m.clippedPercent === 0 },
      { apply: { bits: 12, sampleRate: 250, antiAlias: false }, done: (s) => s.sampleRate <= 250 && !s.antiAlias }
    ]
  },
  {
    id: 'filter', diagram: 'pipeline', extra: 'spectrum',
    traces: ['raw', 'filtered'],
    controls: ['hp', 'lp'],
    scenarios: ['purkinje', 'passing'],
    base: { ...QUIET, scenario: 'purkinje', recordingType: 'unipolar', sampleRate: 4000, hp: 0.5, lp: 500 },
    metrics: ['rawPp', 'filteredPp', 'sharpRaw', 'sharpFiltered', 'rawLat', 'filteredLat', 'latShift'],
    warnings: [],
    lat: true,
    steps: [
      { apply: { hp: 30 }, done: (s) => s.hp >= 30 && s.lp >= 500 },
      { apply: { hp: 100 }, done: (s) => s.hp >= 100 },
      { apply: { hp: 16, lp: 120 }, done: (s) => s.hp === 16 && s.lp === 120 },
      { apply: { hp: 16, lp: 500 }, done: (s, m, done) => done.has(2) && s.hp === 16 && s.lp >= 500 }
    ]
  },
  {
    id: 'noise', diagram: 'amplifier', extra: null, checklist: true,
    traces: ['u1', 'u2', 'raw', 'filtered'],
    controls: ['mains', 'mismatch', 'notch'],
    scenarios: ['passing'],
    base: { ...QUIET, scenario: 'passing', recordingType: 'bipolar', angle: 0, spacing: 3, mains: 0.3, sampleRate: 2000, hp: 16, lp: 500 },
    metrics: ['noiseRms', 'rawPp', 'filteredPp'],
    warnings: ['reference-imbalance'],
    steps: [
      { apply: { mismatch: 0.6 }, done: (s) => s.mismatch >= 0.5 },
      { apply: { notch: 60 }, done: (s) => s.notch === 60 && s.mismatch > 0 && s.mains > 0 },
      { apply: { notch: 50 }, done: (s) => s.notch === 50 && s.mismatch > 0 && s.mains > 0 },
      { apply: { notch: 0, mismatch: 0 }, done: (s, m, done) => done.has(0) && s.notch === 0 && s.mismatch === 0 }
    ]
  },
  {
    id: 'unipolar', diagram: 'tissue', extra: 'derivative',
    traces: ['raw', 'filtered'],
    controls: ['hp'],
    scenarios: ['passing', 'focus', 'breakthrough'],
    base: { ...QUIET, scenario: 'passing', recordingType: 'unipolar', sampleRate: 2000, hp: 0.5, lp: 500 },
    metrics: ['morphRaw', 'morphFiltered', 'rawLat', 'filteredLat', 'rawPp', 'filteredPp'],
    warnings: [],
    lat: true,
    steps: [
      { apply: { scenario: 'passing', playing: true }, observe: true },
      { apply: { scenario: 'focus' }, done: (s) => s.scenario === 'focus' },
      { apply: { scenario: 'breakthrough' }, done: (s) => s.scenario === 'breakthrough' },
      { apply: { scenario: 'passing', hp: 30 }, done: (s) => s.scenario === 'passing' && s.hp >= 30 }
    ]
  },
  {
    id: 'bipolar', diagram: 'tissue', extra: null,
    traces: ['u1', 'u2', 'bipolar'],
    controls: ['contact'],
    scenarios: ['passing'],
    base: { ...QUIET, scenario: 'passing', angle: 0, spacing: 3, mains: 0.12 },
    metrics: ['u1Pp', 'u2Pp', 'bipolarPp', 'lagMs'],
    warnings: ['contact'],
    steps: [
      { apply: {}, observe: true },
      { apply: { contact: 0 }, done: (s) => s.contact <= 0.1 },
      { apply: { contact: 0.5 }, done: (s) => s.contact >= 0.3 && s.contact <= 0.7 }
    ]
  },
  {
    id: 'spacing', diagram: 'tissue', extra: 'orientation',
    traces: ['u1', 'u2', 'bipolar'],
    controls: ['angle', 'spacing'],
    scenarios: ['passing', 'deep'],
    base: { ...QUIET, scenario: 'passing', angle: 0, spacing: 3 },
    metrics: ['u1Pp', 'bipolarPp', 'lagMs', 'deepUni', 'deepBi'],
    warnings: [],
    steps: [
      { apply: { scenario: 'passing', angle: 90 }, done: (s) => s.scenario === 'passing' && s.angle >= 85 && s.angle <= 95 },
      { apply: { scenario: 'passing', angle: 0, spacing: 10 }, done: (s) => s.scenario === 'passing' && s.angle <= 10 && s.spacing >= 8 },
      { apply: { scenario: 'deep', angle: 0, spacing: 2 }, done: (s) => s.scenario === 'deep' && s.spacing <= 2.5 && s.angle <= 30 },
      { apply: { scenario: 'deep', angle: 0, spacing: 10 }, done: (s) => s.scenario === 'deep' && s.spacing >= 8 && s.angle <= 30 }
    ]
  },
  {
    id: 'omni', diagram: 'tissue', extra: 'loop',
    traces: ['fieldX', 'fieldY', 'virtual', 'omni'],
    controls: ['angle', 'virtualAngle'],
    scenarios: ['passing', 'collision', 'focus'],
    base: { ...QUIET, scenario: 'passing', angle: 70, spacing: 3 },
    metrics: ['bxPp', 'byPp', 'virtualPp', 'omniPp', 'direction'],
    warnings: ['planar-assumption', 'collision', 'nonplanar-source'],
    steps: [
      { apply: {}, observe: true },
      { apply: { virtualAngle: 'omni' }, done: (s, m) => m.omniPp > 0 && m.virtualPp >= 0.97 * m.omniPp },
      { apply: { angle: 10 }, done: (s) => s.scenario === 'passing' && Math.abs(s.angle - 70) >= 30 },
      { apply: { scenario: 'collision' }, done: (s) => s.scenario === 'collision' }
    ]
  },
  {
    id: 'nearfield', diagram: 'tissue', extra: 'spectrum',
    traces: ['u1', 'far', 'multipolar', 'tripolar'],
    controls: ['spacing'],
    scenarios: ['passing', 'shared-local', 'purkinje'],
    base: { ...QUIET, scenario: 'passing', recordingType: 'unipolar', angle: 0, spacing: 3, sampleRate: 2000, hp: 0.5, lp: 500 },
    metrics: ['u1Pp', 'farU1', 'tripolarPp', 'multipolarPp'],
    warnings: ['shared-local-loss'],
    steps: [
      { apply: { scenario: 'passing' }, observe: true },
      { apply: { scenario: 'shared-local' }, done: (s) => s.scenario === 'shared-local' },
      { apply: { scenario: 'purkinje' }, done: (s) => s.scenario === 'purkinje' }
    ]
  }
];

export const LESSON_IDS = LESSONS.map((l) => l.id);
export const lessonById = (id) => LESSONS.find((l) => l.id === id) || LESSONS[0];
