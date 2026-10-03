/*
 * Intracardiac electrogram basics (pure): what a unipolar and a bipolar
 * recording show of one wavefront and of far-field activity, what the
 * filters do to a unipolar QS, the interval ranges (PA, AH, HV), the level
 * of AV block read from A-H-V on the His catheter, and the decremental
 * AV node. Designed synthetic signals for the "EGM basics" tab; never
 * clinical recordings or decision rules.
 */
import { ev, mono, merge, surfaceBeat } from './ep-beats.js';

// ---- unipolar and bipolar --------------------------------------------------
const LOCAL_SIGMA = 4;     // ms, width of the local deflection
const FAR_SIGMA = 18;      // ms, a distant chamber's broad deflection
const FAR_AT = 45;         // ms after the local activation
const FAR_AMP = 0.55;
const CV_LOCAL = 0.5;      // mm per ms along the wall
const CV_FAR = 6;          // mm per ms: a distant wave reaches both poles almost together

/** Derivative-of-Gaussian (a passing wave: R then S) and negative Gaussian (a wave leaving its origin: QS). */
const passing = (t, t0) => { const x = (t - t0) / LOCAL_SIGMA; return -x * Math.exp(0.5 - 0.5 * x * x); };
const leaving = (t, t0) => { const x = (t - t0) / (LOCAL_SIGMA * 1.2); return -Math.exp(-0.5 * x * x); };
const broad = (t, t0) => { const x = (t - t0) / FAR_SIGMA; return FAR_AMP * Math.exp(-0.5 * x * x); };

export const SPACINGS = Object.freeze([1, 2, 5, 10]);   // mm between the two poles

/**
 * One wavefront past an electrode pair, with a distant chamber's far field.
 * source 'origin': the wave starts under pole 1 (a focus: unipolar QS);
 * 'passing': the wave runs past. angle: between the direction of travel and
 * the axis of the pair (0 along it, 90 across it).
 * @returns {{ times: number[], uni: number[], bip: number[], uniLocal: number[], bipLocal: number[],
 *   morphology: 'QS'|'rS', bipolarAmp: number, farUni: number, farBip: number, farRatio: number }}
 */
export function electrodePair({ source = 'passing', angle = 0, spacing = 5 } = {}) {
  const lag = (spacing * Math.cos((angle * Math.PI) / 180)) / CV_LOCAL;        // pole 2 sees the wave this much later
  const farLag = spacing / CV_FAR;
  const times = Array.from({ length: 161 }, (_, i) => i - 80);
  const shape = source === 'origin' ? leaving : passing;
  const uniLocal = times.map((t) => shape(t, 0));
  const second = times.map((t) => passing(t, lag));        // away from its origin the wave simply passes pole 2
  const bipLocal = times.map((t, i) => uniLocal[i] - second[i]);
  const farUni = times.map((t) => broad(t, FAR_AT));
  const farBip = times.map((t) => broad(t, FAR_AT) - broad(t, FAR_AT + farLag));
  const uni = times.map((t, i) => uniLocal[i] + farUni[i]);
  const bip = times.map((t, i) => bipLocal[i] + farBip[i]);
  const peak = (a) => Math.max(...a.map(Math.abs));
  const min = Math.min(...uniLocal), max = Math.max(...uniLocal);
  return {
    times, uni, bip, uniLocal, bipLocal,
    morphology: max < 0.1 * Math.abs(min) ? 'QS' : 'rS',
    bipolarAmp: peak(bipLocal),
    farUni: peak(farUni), farBip: peak(farBip), farRatio: peak(farBip) / peak(farUni)
  };
}

// ---- filters -----------------------------------------------------------------
export const HIGH_PASS = Object.freeze([0.05, 0.5, 1, 30]);   // Hz
export const LOW_PASS = Object.freeze([500, 250, 100, 40]);   // Hz
export const FILTER_FS = 1000;

function onePole(samples, fc, fs, type) {
  const dt = 1 / fs, rc = 1 / (2 * Math.PI * fc);
  const out = new Array(samples.length).fill(0);
  if (type === 'hp') {
    const a = rc / (rc + dt);
    for (let i = 1; i < samples.length; i++) out[i] = a * (out[i - 1] + samples[i] - samples[i - 1]);
  } else {
    const a = dt / (rc + dt);
    out[0] = samples[0];
    for (let i = 1; i < samples.length; i++) out[i] = out[i - 1] + a * (samples[i] - out[i - 1]);
  }
  return out;
}

/** Second-order band limits made of two cascaded first-order sections each. */
export function filterSignal(samples, { hp = null, lp = null, fs = FILTER_FS } = {}) {
  let y = samples;
  if (hp) y = onePole(onePole(y, hp, fs, 'hp'), hp, fs, 'hp');
  if (lp) y = onePole(onePole(y, lp, fs, 'lp'), lp, fs, 'lp');
  return y;
}

// A unipolar ventricular electrogram with what the band limits act on: a sharp local QS, a slow
// repolarization component, respiratory baseline drift, mains pickup and wideband noise.
export const BEAT_AT = 5000;
export function rawUnipolar() {
  const n = 10000;
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  return Array.from({ length: n }, (_, i) => {
    const x = (i - BEAT_AT) / 5.5;
    const qs = -Math.exp(-0.5 * x * x);
    const slow = 0.25 * Math.exp(-0.5 * ((i - BEAT_AT - 230) / 70) ** 2);
    const drift = 0.35 * Math.sin((2 * Math.PI * 0.35 * i) / 1000) + 0.12 * Math.sin((2 * Math.PI * 0.07 * i) / 1000);
    const mains = 0.03 * Math.sin((2 * Math.PI * 50 * i) / 1000);
    return qs + slow + drift + mains + 0.025 * rand();
  });
}

/** The unipolar beat after a filter setting, with what the setting did to it. */
export function filterBeat({ hp = 0.05, lp = 500 } = {}) {
  const raw = rawUnipolar();
  const out = filterSignal(raw, { hp, lp });
  const from = BEAT_AT - 250, to = BEAT_AT + 450;
  const view = out.slice(from, to);
  const pre = out[BEAT_AT - 40];
  const seg = out.slice(BEAT_AT - 30, BEAT_AT + 70);
  const low = Math.min(...seg) - pre;
  const after = Math.max(...out.slice(BEAT_AT + 8, BEAT_AT + 45)) - pre;
  const slope = (a) => Math.max(...a.slice(BEAT_AT - 30, BEAT_AT + 30).map((v, i, arr) => (i ? Math.abs(v - arr[i - 1]) : 0)));
  const baseline = out.slice(BEAT_AT - 900, BEAT_AT - 100);
  return {
    view, from, rawView: raw.slice(from, to), beatIndex: BEAT_AT - from,
    qs: after < 0.16 * Math.abs(low),                                   // still only negative after the downstroke
    overshoot: after / Math.abs(low),
    slopeRatio: slope(out) / slope(raw),                                // steepest downstroke kept (intrinsic deflection)
    wander: Math.max(...baseline) - Math.min(...baseline)               // baseline movement before the beat
  };
}

// ---- intervals ---------------------------------------------------------------
export const NORMAL_RANGE = Object.freeze({ pa: [25, 55], ah: [55, 125], hv: [35, 55] });
export const HV_LIMITS = Object.freeze({ upper: 55, abnormal: 70, high: 100 });

/** Each interval against its range; HV also names the 70 and 100 ms limits. */
export function classifyIntervals({ pa, ah, hv }) {
  const range = (v, [lo, hi]) => (v < lo ? 'short' : v > hi ? 'long' : 'normal');
  return {
    pa: range(pa, NORMAL_RANGE.pa),
    ah: range(ah, NORMAL_RANGE.ah),
    hv: hv < NORMAL_RANGE.hv[0] ? 'short' : hv <= HV_LIMITS.upper ? 'normal' : hv <= HV_LIMITS.abnormal ? 'borderline' : hv < HV_LIMITS.high ? 'long' : 'high'
  };
}

// ---- level of AV block -------------------------------------------------------
export const BLOCK_CASES = Object.freeze(['normal', 'nodal-first-degree', 'wenckebach-nodal', 'intra-his', 'mobitz2-infra', 'mobitz1-infra']);
const AA = 800, FIRST_A = 250, BEATS = 4, SPLIT = 45;
export const BLOCK_WINDOW_MS = FIRST_A + AA * BEATS;

/**
 * An A-H-V strip of four atrial beats. Each case gives per-beat conduction:
 * the beat's AH and HV, whether H' (split His) shows, and where it stops
 * (null: conducted; 'nodal': no H; 'intra': H without H'; 'infra': H and H' without V).
 * @returns {{ events: object, windowMs: number, level: string, wide: boolean, beats: object[] }}
 */
export function blockCase(id, { pa = 40, ah = 85, hv = 45 } = {}) {
  const wide = id === 'mobitz2-infra' || id === 'mobitz1-infra';
  const plan = {
    normal: [{}, {}, {}, {}],
    'nodal-first-degree': [{ ah: 230 }, { ah: 230 }, { ah: 230 }, { ah: 230 }],
    'wenckebach-nodal': [{ ah }, { ah: ah + 50 }, { ah: ah + 115 }, { stop: 'nodal' }],
    'intra-his': [{ split: true }, { split: true }, { split: true }, { split: true, stop: 'intra' }],
    'mobitz2-infra': [{ hv: 80 }, { hv: 80 }, { hv: 80, stop: 'infra' }, { hv: 80 }],
    'mobitz1-infra': [{ hv: 70 }, { hv: 95 }, { hv: 125 }, { hv: 70, stop: 'infra' }]
  }[id] || [{}, {}, {}, {}];
  const parts = [], beats = [];
  plan.forEach((spec, i) => {
    const a = FIRST_A + i * AA;
    const beat = { pa, ah, hv, ...spec };
    const aHis = a + beat.pa, h = aHis + beat.ah;
    const hisEvents = [ev('A', aHis, 0.35)];
    const out = { 'ecg-ii': [mono('P', a - 5, 0.22, 10)], hra: [ev('A', a, 0.9)], 'his-d': hisEvents, rv: [] };
    let v = null;
    if (beat.stop !== 'nodal') {
      hisEvents.push(ev('H', h, 0.75, 4));
      // A split His: the second potential (H') follows unless the block lies between the two.
      if (beat.split && beat.stop !== 'intra') hisEvents.push(ev('H', h + SPLIT, 0.6, 4));
      if (!beat.stop) v = h + (beat.split ? SPLIT : 0) + beat.hv;
    }
    if (v != null) {
      parts.push(surfaceBeat(v, { wide }), { rv: [ev('V', v - 5, 0.9)], 'his-d': [ev('V', v, 0.9)] });
    }
    parts.push(out);
    beats.push({ a, stop: beat.stop || null, split: Boolean(beat.split), ah: beat.ah, hv: beat.hv, v });
  });
  const stops = beats.map((b) => b.stop).filter(Boolean);
  const level = id === 'normal' ? 'normal' : stops.includes('nodal') ? 'nodal' : stops.includes('intra') ? 'intraHis' : stops.includes('infra') ? 'infraHis' : 'delay';
  return { events: merge(...parts), windowMs: BLOCK_WINDOW_MS, level, wide, beats };
}

// ---- decremental AV node -----------------------------------------------------
export const AVN_ERP = 240;       // ms of A1-A2 below which the node does not conduct
export const FAST_ERP = 330;      // the fast pathway's refractory period when a slow pathway exists
export const A1A2_RANGE = Object.freeze([600, 240]);

/**
 * AH for an A2 given at an A1-A2 interval: the AV node slows as A2 comes
 * earlier (decremental); with a slow pathway the conduction jumps to it once
 * the fast pathway is refractory.
 * @returns {{ ah: number|null, pathway: 'fast'|'slow'|null }} null: no conduction
 */
export function ahAt(a1a2, { dual = false } = {}) {
  if (a1a2 < AVN_ERP) return { ah: null, pathway: null };
  if (dual && a1a2 < FAST_ERP) return { ah: Math.round(235 + 25 * Math.exp((FAST_ERP - a1a2) / 50)), pathway: 'slow' };
  return { ah: Math.round(75 + 30 * Math.exp((380 - a1a2) / 70)), pathway: 'fast' };
}

/** The curve and its largest 10 ms step. */
export function ahCurve({ dual = false } = {}) {
  const points = [];
  for (let x = A1A2_RANGE[0]; x >= A1A2_RANGE[1]; x -= 10) points.push({ a1a2: x, ...ahAt(x, { dual }) });
  let jump = 0, jumpAt = null;
  for (let i = 1; i < points.length; i++) {
    const step = points[i].ah != null && points[i - 1].ah != null ? points[i].ah - points[i - 1].ah : 0;
    if (step > jump) { jump = step; jumpAt = points[i].a1a2; }
  }
  return { points, jump, jumpAt };
}

