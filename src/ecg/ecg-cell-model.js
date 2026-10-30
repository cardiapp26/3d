/**
 * Ventricular action potential from the minimal model of Bueno-Orovio, Cherry and Fenton
 * (J Theor Biol 2008;253:544-560): one voltage variable u and three gates (v, w, s), with all
 * membrane currents grouped into a fast inward (J_fi, sodium-like), a slow outward (J_so,
 * potassium-like) and a slow inward current (J_si, calcium-like). Parameter sets for epicardial,
 * endocardial and midmyocardial (M) human cells follow the paper's Table 1; this file is an
 * original implementation of the published equations, forward Euler, for teaching only.
 *
 * The cell is paced at a cycle length until the action potential settles and the last beat is
 * returned with its measures: resting and peak voltage, maximum upstroke velocity, APD50 and
 * APD90 and the diastolic interval. Two scales mimic drug action: fastInward multiplies J_fi
 * (a sodium-channel blocker lowers it), slowOutward multiplies J_so (a potassium-channel blocker).
 * They are phenomenological groupings, not individual channels.
 */
const V_REST = -84;       // mV for u = 0
const V_SCALE = 85.7;     // mV per unit u
export const toMv = u => V_SCALE * u + V_REST;

export const CELL_TYPES = Object.freeze({
  epi: Object.freeze({ uo: 0, uu: 1.55, thv: .3, thw: .13, thvm: .006, tho: .006, tv1m: 60, tv2m: 1150, tvp: 1.4506, tw1m: 60, tw2m: 15, kwm: 65, uwm: .03, twp: 200, tfi: .11, to1: 400, to2: 6, tso1: 30.0181, tso2: .9957, kso: 2.0458, uso: .65, ts1: 2.7342, ts2: 16, ks: 2.0994, us: .9087, tsi: 1.8875, twinf: .07, winfStar: .94 }),
  endo: Object.freeze({ uo: 0, uu: 1.56, thv: .3, thw: .13, thvm: .2, tho: .006, tv1m: 75, tv2m: 10, tvp: 1.4506, tw1m: 6, tw2m: 140, kwm: 200, uwm: .016, twp: 280, tfi: .1, to1: 470, to2: 6, tso1: 40, tso2: 1.2, kso: 2, uso: .65, ts1: 2.7342, ts2: 2, ks: 2.0994, us: .9087, tsi: 2.9013, twinf: .0273, winfStar: .78 }),
  mid: Object.freeze({ uo: 0, uu: 1.61, thv: .3, thw: .13, thvm: .1, tho: .005, tv1m: 80, tv2m: 1.4506, tvp: 1.4506, tw1m: 70, tw2m: 8, kwm: 200, uwm: .016, twp: 280, tfi: .078, to1: 410, to2: 7, tso1: 91, tso2: .8, kso: 2.1, uso: .6, ts1: 2.7342, ts2: 4, ks: 2.0994, us: .9087, tsi: 3.3849, twinf: .01, winfStar: .5 })
});

const DT = .02;           // ms
const STIM = { amp: .5, ms: 1 };
const SAMPLE_MS = .5;     // stored trace resolution
const H = x => (x > 0 ? 1 : 0);

/** One Euler step of the model; returns the new state and the three currents. */
function step(p, st, stim, fi, so) {
  const { u, v, w, s } = st;
  const hv = H(u - p.thv), hw = H(u - p.thw), ho = H(u - p.tho), hvm = H(u - p.thvm);
  const tvm = (1 - hvm) * p.tv1m + hvm * p.tv2m;
  const twm = p.tw1m + (p.tw2m - p.tw1m) * (1 + Math.tanh(p.kwm * (u - p.uwm))) / 2;
  const tso = p.tso1 + (p.tso2 - p.tso1) * (1 + Math.tanh(p.kso * (u - p.uso))) / 2;
  const ts = (1 - hw) * p.ts1 + hw * p.ts2;
  const to = (1 - ho) * p.to1 + ho * p.to2;
  const vinf = u < p.thvm ? 1 : 0;
  const winf = (1 - ho) * (1 - u / p.twinf) + ho * p.winfStar;
  const jfi = fi * (-v * hv * (u - p.thv) * (p.uu - u) / p.tfi);
  const jso = so * ((u - p.uo) * (1 - hw) / to + hw / tso);
  const jsi = -hw * w * s / p.tsi;
  return {
    state: {
      u: u + DT * (-(jfi + jso + jsi) + stim),
      v: v + DT * ((1 - hv) * (vinf - v) / tvm - hv * v / p.tvp),
      w: w + DT * ((1 - hw) * (winf - w) / twm - hw * w / p.twp),
      s: s + DT * (((1 + Math.tanh(p.ks * (u - p.us))) / 2 - s) / ts)
    },
    jfi, jso, jsi
  };
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * Pace a cell and return its last (settled) beat.
 * @param {{ cell?: 'epi'|'endo'|'mid', cycleLength?: number, fastInward?: number, slowOutward?: number, beats?: number }} options
 * @returns {{ t: number[], mv: number[], currents: { fi: number[], so: number[], si: number[] }, measures: object, cycleLength: number }}
 */
export function paceCell({ cell = 'epi', cycleLength = 1000, fastInward = 1, slowOutward = 1, beats = 8 } = {}) {
  const p = CELL_TYPES[cell] || CELL_TYPES.epi;
  const cl = clamp(Number(cycleLength) || 1000, 250, 3000);
  const fi = clamp(Number(fastInward), .1, 1), so = clamp(Number(slowOutward), .3, 1.5);
  let st = { u: 0, v: 1, w: 1, s: 0 };
  const steps = Math.round(cl / DT), every = Math.round(SAMPLE_MS / DT);
  let t = [], mv = [], cfi = [], cso = [], csi = [], maxDvdt = 0;
  for (let b = 0; b < beats; b++) {
    const last = b === beats - 1;
    if (last) { t = []; mv = []; cfi = []; cso = []; csi = []; maxDvdt = 0; }
    for (let i = 0; i < steps; i++) {
      const time = i * DT;
      const stim = time < STIM.ms ? STIM.amp : 0;
      const before = st.u;
      const out = step(p, st, stim, fi, so);
      st = out.state;
      if (!last) continue;
      maxDvdt = Math.max(maxDvdt, (V_SCALE * (st.u - before)) / DT);   // mV/ms = V/s
      if (i % every === 0) { t.push(Math.round(time * 100) / 100); mv.push(toMv(st.u)); cfi.push(out.jfi); cso.push(out.jso); csi.push(out.jsi); }
    }
  }
  return { t, mv, currents: { fi: cfi, so: cso, si: csi }, measures: measure(t, mv, cl, maxDvdt), cycleLength: cl };
}

/** Resting and peak voltage, upstroke velocity, APD50/APD90 and the diastolic interval of one beat. */
export function measure(t, mv, cycleLength, maxDvdt) {
  const rest = mv[0];
  let peakI = 0;
  for (let i = 0; i < mv.length; i++) if (mv[i] > mv[peakI]) peakI = i;
  const peak = mv[peakI];
  if (peak - rest < 40) return { rest, peak, maxDvdt, apd50: null, apd90: null, di: null, captured: false };
  const up = mv.findIndex(v => v > rest + (peak - rest) * .1);
  const level = f => peak - (peak - rest) * f;
  const after = f => { for (let i = peakI; i < mv.length; i++) if (mv[i] <= level(f)) return t[i]; return null; };
  const a50 = after(.5), a90 = after(.9);
  const apd50 = a50 == null ? null : Math.round(a50 - t[up]), apd90 = a90 == null ? null : Math.round(a90 - t[up]);
  // Notch (phase 1): the lowest point in the first 40 ms after the peak, if it dips below the plateau that follows.
  let notch = null;
  const plateauEnd = Math.min(mv.length - 1, peakI + Math.round(60 / (t[1] - t[0])));
  for (let i = peakI + 1; i < plateauEnd; i++) if (notch == null || mv[i] < mv[notch]) notch = i;
  const dome = notch == null ? null : Math.max(...mv.slice(notch, plateauEnd + 1));
  return {
    rest: Math.round(rest), peak: Math.round(peak), maxDvdt: Math.round(maxDvdt), apd50, apd90,
    di: apd90 == null ? null : Math.round(cycleLength - apd90), captured: true,
    notch: notch != null && dome - mv[notch] > 2 ? Math.round(mv[notch]) : null
  };
}

/** APD90 at a range of cycle lengths: the restitution curve of one cell. */
export function restitution({ cell = 'epi', fastInward = 1, slowOutward = 1, cycleLengths = [300, 400, 500, 600, 800, 1000, 1200, 1500, 2000] } = {}) {
  return cycleLengths.map(cl => {
    const { measures } = paceCell({ cell, cycleLength: cl, fastInward, slowOutward, beats: 6 });
    return { cycleLength: cl, apd90: measures.apd90, di: measures.di, captured: measures.captured };
  });
}

/** Phase of the action potential at time ms of the beat (0 upstroke, 1 notch, 2 plateau, 3 repolarization, 4 rest). */
export function phaseAt(beat, ms) {
  const { t, mv, measures } = beat;
  if (!measures.captured) return 4;
  const peakT = t[mv.indexOf(Math.max(...mv))];
  if (ms <= peakT) return ms < 0.2 ? 4 : 0;
  if (measures.apd90 != null && ms > measures.apd90) return 4;
  const i = Math.min(mv.length - 1, Math.max(0, Math.round(ms / (t[1] - t[0]))));
  if (measures.notch != null && ms < peakT + 25) return 1;
  return mv[i] > measures.peak - (measures.peak - measures.rest) * .3 ? 2 : 3;
}
