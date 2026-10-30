/**
 * A synthetic recording chain for the ECG page: one heart vector (src/eps/ecg12.js lobes) drives
 * the electrode potentials of a resting 12-lead recording, which then pass through the cables,
 * the amplifier filters and the paper. Because leads are rebuilt from electrode potentials, a
 * swapped cable changes the leads the way it does on a real machine (Einthoven and Wilson's
 * central terminal included). Teaching model: one dipole, no torso, never a patient recording.
 *
 * Units: time in ms, voltage in mV, sampling 1000 Hz.
 */
import { vectorAt, leadsOf, LEADS, PRECORDIAL } from '../eps/ecg12.js';

export const FS = 1000;
export { LEADS };

// One normal sinus beat as heart-vector lobes (body axes x left, y inferior, z anterior); times from beat onset.
export const NORMAL_BEAT = Object.freeze([
  { dir: [.45, .85, .15], t: 70, sigma: 20, amp: .14 },     // P (right then left atrium, inferior-leftward)
  { dir: [-.55, .1, .75], t: 178, sigma: 6, amp: .3 },       // septum: left to right, anterior (q in I, V5-V6; r in V1)
  { dir: [.7, .62, -.1], t: 203, sigma: 9, amp: 1.55 },       // free walls of the left ventricle (transition V3-V4)
  { dir: [-.35, -.55, -.6], t: 224, sigma: 6, amp: .38 },     // basal, posterior: terminal forces
  { dir: [.5, .6, .55], t: 430, sigma: 52, amp: .36 }         // T wave (repolarization, concordant with the QRS; upright V2-V6)
]);
const U_WAVE = Object.freeze({ dir: [.4, .6, .55], t: 590, sigma: 34, amp: .07 });
export const INTERVALS = Object.freeze({ pOnset: 30, qrsOnset: 160, qrsEnd: 245, tEnd: 545 });   // of NORMAL_BEAT, ms

/**
 * Electrode potentials (mV, relative to the body's mean) from one heart vector. The limb electrodes
 * sum to zero, so the true Wilson terminal is 0; each chest electrode then reads its precordial lead.
 * RL (the neutral) sits at the left-leg potential: the legs are electrically nearly the same.
 */
export function electrodesOf(vector) {
  const L = leadsOf(vector);
  const ra = -(L.I + L.II) / 3, la = (2 * L.I - L.II) / 3, ll = (2 * L.II - L.I) / 3;
  return { RA: ra, LA: la, LL: ll, RL: ll, ...Object.fromEntries(PRECORDIAL.map(v => [v, L[v]])) };
}

/** The twelve leads a machine computes from what its cables carry. */
export function leadsFromElectrodes(e) {
  const wct = (e.RA + e.LA + e.LL) / 3;
  return {
    I: e.LA - e.RA, II: e.LL - e.RA, III: e.LL - e.LA,
    aVR: e.RA - (e.LA + e.LL) / 2, aVL: e.LA - (e.RA + e.LL) / 2, aVF: e.LL - (e.RA + e.LA) / 2,
    ...Object.fromEntries(PRECORDIAL.map(v => [v, e[v] - wct]))
  };
}

export const REVERSALS = Object.freeze(['none', 'la-ra', 'ra-rl', 'la-ll', 'v1-v2']);
/** What each cable reads when two of them are swapped. */
export function swapCables(e, reversal) {
  switch (reversal) {
    case 'la-ra': return { ...e, RA: e.LA, LA: e.RA };
    case 'ra-rl': return { ...e, RA: e.RL };            // the right-arm cable sits on the right leg
    case 'la-ll': return { ...e, LA: e.LL, LL: e.LA };
    case 'v1-v2': return { ...e, V1: e.V2, V2: e.V1 };
    default: return e;
  }
}

/**
 * Electrode potentials over a recording, beat after beat at a heart rate.
 * @param {{ seconds?: number, hr?: number, uWave?: boolean, beat?: object[] }} options
 */
export function recordElectrodes({ seconds = 10, hr = 72, uWave = false, beat = NORMAL_BEAT } = {}) {
  const rr = 60000 / Math.max(30, Math.min(180, hr));
  const lobes = uWave ? [...beat, U_WAVE] : beat;
  const n = Math.round(seconds * FS);
  const out = Object.fromEntries(['RA', 'LA', 'LL', 'RL', ...PRECORDIAL].map(k => [k, new Float32Array(n)]));
  for (let i = 0; i < n; i++) {
    const t = (i / FS) * 1000, phase = t % rr;
    // Neighbouring beats overlap a little (a long T at a fast rate runs into the next P).
    const v = vectorAt(lobes, phase), prev = phase + rr < 1500 ? vectorAt(lobes, phase + rr) : [0, 0, 0];
    const e = electrodesOf([v[0] + prev[0], v[1] + prev[1], v[2] + prev[2]]);
    for (const k in out) out[k][i] = e[k];
  }
  return { electrodes: out, rr, n };
}

// ---- Artifacts (added to the electrodes, as they happen on the body) ----
function noise(seed) { let a = seed >>> 0 || 1; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 - .5; }; }
/**
 * @param {{ breathing?: boolean, tremor?: boolean, mains?: boolean, mainsHz?: number }} artifacts
 */
export function addArtifacts(electrodes, { breathing = false, tremor = false, mains = false, mainsHz = 50 } = {}, seed = 7) {
  const out = Object.fromEntries(Object.entries(electrodes).map(([k, v]) => [k, Float32Array.from(v)]));
  const rnd = noise(seed);
  const n = out.RA.length;
  const keys = Object.keys(out);
  for (const [j, k] of keys.entries()) {
    const sway = .08 + .04 * (j % 3), phase = j * .7;
    let hf = 0;
    for (let i = 0; i < n; i++) {
      const t = i / FS;
      let x = 0;
      if (breathing) x += sway * Math.sin(2 * Math.PI * .25 * t + phase) + .03 * Math.sin(2 * Math.PI * .5 * t);   // 15 breaths/min, wandering baseline
      if (tremor && (k === 'RA' || k === 'LA')) { hf = .55 * hf + rnd() * .09; x += hf; }   // skeletal muscle under the arm electrodes
      if (mains) x += (k === 'RA' ? .05 : k === 'LA' ? -.03 : .02) * Math.sin(2 * Math.PI * mainsHz * t);   // unequal coupling of each cable
      out[k][i] += x;
    }
  }
  return out;
}

// ---- Filters (sampling 1000 Hz) ----
/** First-order high-pass (an analog RC coupling), causal. */
export function highPass(x, fc) {
  const rc = 1 / (2 * Math.PI * fc), dt = 1 / FS, a = rc / (rc + dt);
  const y = new Float32Array(x.length);
  for (let i = 1; i < x.length; i++) y[i] = a * (y[i - 1] + x[i] - x[i - 1]);
  return y;
}
/** Second-order Butterworth low-pass (bilinear biquad), causal. */
export function lowPass(x, fc) {
  const k = Math.tan((Math.PI * fc) / FS), q = Math.SQRT1_2, norm = 1 / (1 + k / q + k * k);
  const b0 = k * k * norm, b1 = 2 * b0, b2 = b0, a1 = 2 * (k * k - 1) * norm, a2 = (1 - k / q + k * k) * norm;
  const y = new Float32Array(x.length);
  let x1 = x[0], x2 = x[0], y1 = x[0], y2 = x[0];
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
const reverse = x => Float32Array.from(x).reverse();
/** Forward then backward (zero phase): the filter's delay cancels, so it does not shift the ST segment. */
export const zeroPhase = (filter, x, ...args) => reverse(filter(reverse(filter(x, ...args)), ...args));

/**
 * A full machine: cables, then leads, then filters.
 * @param {object} electrodes potentials from recordElectrodes (plus artifacts)
 * @param {{ reversal?: string, highPassHz?: number, lowPassHz?: number, zeroPhaseFilters?: boolean }} machine
 * @returns {Record<string, Float32Array>} the twelve recorded leads
 */
export function recordLeads(electrodes, { reversal = 'none', highPassHz = .05, lowPassHz = 150, zeroPhaseFilters = false } = {}) {
  const n = electrodes.RA.length;
  const leads = Object.fromEntries(LEADS.map(l => [l, new Float32Array(n)]));
  for (let i = 0; i < n; i++) {
    const e = swapCables(Object.fromEntries(Object.keys(electrodes).map(k => [k, electrodes[k][i]])), reversal);
    const L = leadsFromElectrodes(e);
    for (const l of LEADS) leads[l][i] = L[l];
  }
  for (const l of LEADS) {
    let y = leads[l];
    if (highPassHz) y = zeroPhaseFilters ? zeroPhase(highPass, y, highPassHz) : highPass(y, highPassHz);
    if (lowPassHz) y = zeroPhaseFilters ? zeroPhase(lowPass, y, lowPassHz) : lowPass(y, lowPassHz);
    leads[l] = y;
  }
  return leads;
}

/** The lead set the heart actually made (no cables swapped, no filters, no artifacts). */
export function trueLeads(electrodes) { return recordLeads(electrodes, { highPassHz: 0, lowPassHz: 0 }); }

/** Measures on one beat of a lead: R amplitude, ST level at J+60 ms against the PR baseline (mV). */
export function beatMeasures(lead, beatStartMs) {
  const at = ms => lead[Math.max(0, Math.min(lead.length - 1, Math.round(beatStartMs + ms)))];
  const base = at(INTERVALS.qrsOnset - 15);
  let r = 0, s = 0;
  for (let ms = INTERVALS.qrsOnset; ms <= INTERVALS.qrsEnd; ms++) { r = Math.max(r, at(ms) - base); s = Math.min(s, at(ms) - base); }
  return { r, s, st: at(INTERVALS.qrsEnd + 60) - base, base };
}

// ---- QT ----
export const QT_FORMULAS = Object.freeze({
  bazett: (qt, rr) => qt / Math.sqrt(rr / 1000),
  fridericia: (qt, rr) => qt / Math.cbrt(rr / 1000),
  framingham: (qt, rr) => qt + 154 * (1 - rr / 1000),
  hodges: (qt, rr) => qt + 1.75 * (60000 / rr - 60)
});
/** Thresholds for a prolonged QTc (ms): men 450, women 460; above 500 is highly abnormal. */
export const QTC_LIMITS = Object.freeze({ male: 450, female: 460, high: 500, drugRise: 60 });

/**
 * A patient's QT at a heart rate. qtc60 is the QT at 60/min; the QT-RR relation follows a
 * log-linear exponent between Fridericia's (1/3) and Bazett's (1/2), as population studies find.
 */
export const QT_EXPONENT = .38;
export const qtAtRate = (qtc60, hr) => qtc60 * (60 / hr) ** QT_EXPONENT;

/** Grade a QTc for a sex. */
export function gradeQtc(qtc, sex = 'male') {
  if (qtc >= QTC_LIMITS.high) return 'high';
  return qtc >= (sex === 'female' ? QTC_LIMITS.female : QTC_LIMITS.male) ? 'long' : 'normal';
}

/**
 * End of the T wave in one beat of a lead: the tangent method (steepest down- or up-slope of the
 * T wave carried to the baseline) and the threshold method (last sample above 0.02 mV, which runs
 * into a U wave). Returns QT for both, from the QRS onset (ms).
 */
export function qtOfLead(lead, beatStartMs, rr) {
  const at = ms => lead[Math.round(beatStartMs + ms)] ?? 0;
  const base = at(INTERVALS.qrsOnset - 15);
  const from = INTERVALS.qrsEnd + 40, to = Math.min(rr - 40, 760);
  let peakMs = from, peak = 0;
  for (let ms = from; ms <= to; ms++) { const v = at(ms) - base; if (Math.abs(v) > Math.abs(peak) && ms < 560) { peak = v; peakMs = ms; } }
  if (Math.abs(peak) < .03) return { tangent: null, threshold: null, peak };
  const sign = Math.sign(peak);
  let slopeMs = peakMs, slope = 0;
  for (let ms = peakMs; ms <= Math.min(to, peakMs + 160); ms++) { const d = sign * (at(ms + 1) - at(ms - 1)) / 2; if (d < slope) { slope = d; slopeMs = ms; } }
  const tangentEnd = slope < 0 ? slopeMs + (sign * (at(slopeMs) - base)) / -slope : null;
  let thresholdEnd = null;
  for (let ms = to; ms >= peakMs; ms--) if (sign * (at(ms) - base) > .02) { thresholdEnd = ms; break; }
  const q = ms => (ms == null ? null : Math.round(ms - INTERVALS.qrsOnset));
  return { tangent: q(tangentEnd), threshold: q(thresholdEnd), peak };
}

/**
 * The normal beat with its repolarization set to a QT (ms, from QRS onset to the tangent end of
 * the T wave): the T lobe moves and widens with the QT, the U lobe follows it.
 */
export function beatForQt(qt) {
  const q = Math.max(260, Math.min(640, qt));
  const t = NORMAL_BEAT.map((lobe, i) => (i === NORMAL_BEAT.length - 1 ? { ...lobe, t: INTERVALS.qrsOnset + q * T_CENTRE, sigma: q * T_SIGMA } : lobe));
  return { beat: t, uWave: { ...U_WAVE, t: INTERVALS.qrsOnset + q * T_CENTRE + 160 * (q / 385) } };
}
const T_CENTRE = .7224, T_SIGMA = .1393;   // calibrated: the tangent end lands on the asked QT
