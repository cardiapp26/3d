// Synthetic sinus-rhythm recording for the slow pathway mapping panel: surface
// II, HRA, His, CS 9-10 (proximal), CS 1-2 (distal) and the ablation bipoles.
// Timings are textbook-like (concentric CS activation, AH ~80 ms, HV ~45 ms);
// the ablation channel amplitudes come from koch-sp-model.js. Teaching only.

export const EGM_WINDOW_MS = 1400;
export const EGM_BEATS = Object.freeze([90, 790]);
export const EGM_CHANNELS = Object.freeze([
  { id: 'ii', label: 'II', color: '#d9dedb' },
  { id: 'hra', label: 'HRA', color: '#f5d34f' },
  { id: 'his', label: 'His d', color: '#e879f9' },
  { id: 'csp', label: 'CS 9-10', color: '#4ade80' },
  { id: 'csd', label: 'CS 1-2', color: '#4ade80' },
  { id: 'abld', label: 'ABL d', color: '#f8fafc' },
  { id: 'ablp', label: 'ABL p', color: '#cbd5e1' }
]);
// Event times after the sinus P onset (ms).
export const EGM_TIMES = Object.freeze({ hra: 10, hisA: 45, ablA: 55, csp: 60, csd: 95, hisH: 120, qrs: 160, hisV: 165, ablV: 168, cspV: 175, csdV: 185 });
const STEP_MS = 2;

// Bipolar deflection: derivative of a gaussian, peak amplitude `amp`.
const spike = (t, centre, width, amp) => {
  const x = (t - centre) / (width / 3);
  return amp * (-x * Math.exp(-(x * x) / 2)) / 0.6065;
};
const wave = (t, centre, width, amp) => amp * Math.exp(-(((t - centre) / width) ** 2));

function surface(t, t0) {
  const p = wave(t, t0 + 45, 28, 0.18);
  const q = EGM_TIMES.qrs + t0;
  const qrs = wave(t, q + 4, 6, -0.12) + wave(t, q + 22, 9, 1) + wave(t, q + 40, 8, -0.25);
  return p + qrs + wave(t, q + 250, 55, 0.28);
}

function channelSample(id, t, t0, a) {
  const T = EGM_TIMES;
  switch (id) {
    case 'ii': return surface(t, t0);
    case 'hra': return spike(t, t0 + T.hra, 14, 1) + spike(t, t0 + T.qrs + 15, 14, 0.12);
    case 'his': return spike(t, t0 + T.hisA, 14, 0.55) + spike(t, t0 + T.hisH, 8, 0.45) + spike(t, t0 + T.hisV, 16, 0.65);
    case 'csp': return spike(t, t0 + T.csp, 14, 0.9) + spike(t, t0 + T.cspV, 16, 0.3);
    case 'csd': return spike(t, t0 + T.csd, 14, 0.8) + spike(t, t0 + T.csdV, 16, 0.35);
    case 'abld': {
      // Fractionated A: a few small late components over the slow pathway.
      let y = spike(t, t0 + T.ablA, 12, a.atrial);
      for (let k = 1; k <= 3; k++) y += spike(t, t0 + T.ablA + 12 * k, 8, a.slowPotential * 0.32 * (1 - k * 0.2));
      return y + spike(t, t0 + T.hisH, 8, a.his * 0.8) + spike(t, t0 + T.ablV, 18, a.ventricular);
    }
    case 'ablp': return spike(t, t0 + T.ablA - 4, 13, Math.min(1, a.atrial + 0.3)) + spike(t, t0 + T.ablV + 4, 18, a.ventricular * 0.7);
    default: return 0;
  }
}

/** Samples of one channel over the window: [{ t, y }], y in relative units (about -1..1). */
export function channelTrace(id, assessment) {
  const out = [];
  for (let t = 0; t <= EGM_WINDOW_MS; t += STEP_MS) {
    out.push({ t, y: EGM_BEATS.reduce((sum, t0) => sum + channelSample(id, t, t0, assessment), 0) });
  }
  return out;
}

/** Peak absolute value of a channel inside [from, to] ms after the first beat's P onset. */
export function peakBetween(trace, from, to) {
  const t0 = EGM_BEATS[0];
  return trace.filter(s => s.t >= t0 + from && s.t <= t0 + to).reduce((m, s) => Math.max(m, Math.abs(s.y)), 0);
}
