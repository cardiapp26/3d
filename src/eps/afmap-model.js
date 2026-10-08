/*
 * AF mapping teaching model (pure). A 48 x 48 mm sheet of atrial muscle
 * simulated as an excitable medium (Barkley; the Bär-Eiswirth variant for
 * spiral breakup; Barkley's semi-implicit step). Two scenarios: a stable rotor whose waves break up in a
 * patch of fibrosis (non-conducting strands), and multiple wavelets with
 * short-lived, wandering rotors. From three seconds of activity the model
 * reads what AF mapping systems read: a unipolar-like electrogram at every
 * site (the downstroke of activation averaged over the electrode), its
 * deflections and their mean interval (CFE-mean; CFAE below 120 ms), the
 * dominant frequency (DF, 3-12 Hz) of the rectified signal and its regularity, and
 * the phase. The true phase singularities (PS) come from the full state of
 * the medium; the mapped ones from the Hilbert phase of the signals at the
 * electrodes, on the full grid or on a 64-pole basket (8 x 8, 6 mm apart),
 * optionally with half the electrodes out of contact (their signal
 * interpolated). Ablation turns pixels into lesions and the run continues
 * from the same moment.
 * After Cardiac Mapping 5th ed. (Wiley 2019), chapters 38 (rotor mapping),
 * 52 (electrogram-based mapping, CFAE and DF) and 53 (phase mapping).
 * Schematic medium; the numbers are the model's own.
 */

export const N = 48;                     // pixels per side, 1 mm each
export const FRAME_MS = 2;               // ms between stored frames
export const RECORD_MS = 3000;
export const FRAMES = RECORD_MS / FRAME_MS;
export const RESOLUTIONS = Object.freeze(['full', 'basket', 'basketPoor']);
export const CFAE_MS = 120;
const BASKET = { first: 3, step: 6, count: 8 };
const DT = 0.02;
const ELECTRODE = 1.5;                   // electrode radius (pixels)
const DF_BAND = [3, 12];                 // Hz (above it, the harmonic of a fractionated beat)

const key = (x, y) => y * N + x;
export const pixelOf = (k) => [k % N, Math.floor(k / N)];
const hash = (x, y, s = 0) => { let h = Math.imul(x * 374761393 + y * 668265263 + s * 1442695041, 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

/** Fibrotic patch: a share of the pixels in a rectangle do not conduct (strands). */
function fibrosis([x0, y0, x1, y1], share, seed) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (hash(x, y, seed) < share) out.push(key(x, y));
  return out;
}

const PATCH_B = 0.12;   // less excitable, longer refractory tissue in the fibrotic patch: fibrillatory conduction

/** Per-pixel excitability (b) of a scenario, or null when uniform. */
function excitability(s) {
  if (!s.patch) return null;
  const out = new Float32Array(N * N).fill(s.medium.b);
  const [x0, y0, x1, y1] = s.patch.rect;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out[key(x, y)] = s.patch.b;
  return out;
}

export const SCENARIOS = Object.freeze({
  rotor: {
    medium: { eps: 0.02, a: 0.75, b: 0.02, breakup: false, dx: 0.3 }, msPerUnit: 40, warmup: 60,
    start: { x: 20, y: 22 }, patch: { rect: [31, 6, 45, 40], b: PATCH_B }, fibrosis: fibrosis([31, 6, 45, 40], 0.34, 7), sites: { fibrosis: [40, 7], periphery: [7, 7] }
  },
  wavelets: {
    medium: { eps: 0.07, a: 0.84, b: 0.07, breakup: true, dx: 1.0 }, msPerUnit: 28, warmup: 140,
    start: { x: 24, y: 24 }, fibrosis: [], sites: { centre: [24, 24], edge: [6, 6] }
  }
});

// ---- simulation ---------------------------------------------------------------
const cache = new Map();
const cached = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };

function neighbours(blocked) {
  const list = [];
  for (let k = 0; k < N * N; k++) {
    const [x, y] = pixelOf(k);
    list.push([x > 0 ? k - 1 : -1, x < N - 1 ? k + 1 : -1, y > 0 ? k - N : -1, y < N - 1 ? k + N : -1].filter((m) => m >= 0 && !blocked[m]));
  }
  return list;
}

/** Integrate the medium for a number of time units from a state (u, v); blocked pixels stay at rest. */
function integrate(m, u, v, blocked, units, onStep, bOf = null) {
  const nb = neighbours(blocked), lap = new Float32Array(N * N), h2 = m.dx * m.dx;
  const steps = Math.round(units / DT);
  for (let s = 0; s < steps; s++) {
    for (let k = 0; k < N * N; k++) {
      if (blocked[k]) { lap[k] = 0; continue; }
      const list = nb[k];
      let sum = 0;
      for (let i = 0; i < list.length; i++) sum += u[list[i]];
      lap[k] = (sum - list.length * u[k]) / h2;
    }
    for (let k = 0; k < N * N; k++) {
      if (blocked[k]) { u[k] = 0; v[k] = 0; continue; }
      // Diffusion explicit, reaction with Barkley's semi-implicit step (stable at dt = eps).
      const uu = Math.min(1, Math.max(0, u[k] + DT * lap[k])), th = (v[k] + (bOf ? bOf[k] : m.b)) / m.a, r = (DT / m.eps) * (uu - th);
      u[k] = uu < th ? uu / (1 - r * (1 - uu)) : (uu + r * uu) / (1 + r * uu);
      const g = m.breakup ? (uu < 1 / 3 ? 0 : uu <= 1 ? 1 - 6.75 * uu * (uu - 1) ** 2 : 1) : uu;
      v[k] += DT * (g - v[k]);
    }
    if (onStep) onStep(s);
  }
}

/** Broken wavefront whose free end becomes the rotor tip near the start point. */
function initial(s) {
  const u = new Float32Array(N * N), v = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = key(x, y);
    if (x < s.start.x && y < s.start.y) u[k] = 1;
    if (x < s.start.x && y >= s.start.y) v[k] = s.medium.a / 2 + 0.3;
  }
  return { u, v };
}

/**
 * Three seconds of activity: u and v at every pixel every FRAME_MS (bytes,
 * 0..255 over 0..1), after a warm-up. lesions: pixel keys ablated at the
 * start of the recording (the AF state before them is the same).
 */
export function simulate(id, lesions = []) {
  return cached(`sim|${id}|${[...lesions].sort((a, b) => a - b).join(',')}`, () => {
    const s = SCENARIOS[id], m = s.medium;
    const blocked = new Uint8Array(N * N);
    for (const k of s.fibrosis) blocked[k] = 1;
    const start = warm(id);
    const u = Float32Array.from(start.u), v = Float32Array.from(start.v);
    for (const k of lesions) { blocked[k] = 1; u[k] = 0; v[k] = 0; }
    const U = new Uint8Array(FRAMES * N * N), V = new Uint8Array(FRAMES * N * N);
    let frame = 0;
    const store = () => {
      for (let k = 0; k < N * N; k++) { U[frame * N * N + k] = Math.max(0, Math.min(255, Math.round(u[k] * 255))); V[frame * N * N + k] = Math.max(0, Math.min(255, Math.round(v[k] * 255))); }
      frame++;
    };
    store();
    // Store a frame each time the simulated time passes the next FRAME_MS.
    const units = ((FRAMES - 1) * FRAME_MS) / s.msPerUnit;
    integrate(m, u, v, blocked, units + DT, (step) => { if (frame < FRAMES && (step + 1) * DT * s.msPerUnit >= frame * FRAME_MS) store(); }, excitability(s));
    while (frame < FRAMES) store();
    return { id, U, V, blocked, lesions: new Set(lesions) };
  });
}

/** The state after the warm-up (shared by every run of a scenario). */
function warm(id) {
  return cached(`warm|${id}`, () => {
    const s = SCENARIOS[id];
    const blocked = new Uint8Array(N * N);
    for (const k of s.fibrosis) blocked[k] = 1;
    const { u, v } = initial(s);
    integrate(s.medium, u, v, blocked, s.warmup, null, excitability(s));
    return { u, v };
  });
}

// ---- signals -----------------------------------------------------------------------
/** u of one pixel over the recording (0..1). */
export function trace(sim, k) {
  const out = new Float32Array(FRAMES);
  for (let f = 0; f < FRAMES; f++) out[f] = sim.U[f * N * N + k] / 255;
  return out;
}

/** Pixels under an electrode centred on (x, y). */
function footprint(x, y) {
  const out = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const px = x + dx, py = y + dy;
    if (px < 0 || py < 0 || px >= N || py >= N || Math.hypot(dx, dy) > ELECTRODE) continue;
    out.push(key(px, py));
  }
  return out;
}

/**
 * Unipolar-like electrogram at (x, y): minus the rate of rise of activation,
 * averaged over the electrode (so asynchronous activation under it, as in
 * fibrosis, gives several deflections). Arbitrary units, one value per frame.
 */
export function electrogram(sim, [x, y]) {
  return cached(`egm|${sim.id}|${[...sim.lesions].join(',')}|${x},${y}`, () => {
    const cells = footprint(x, y).filter((k) => !sim.blocked[k]);
    const out = new Float32Array(FRAMES);
    if (!cells.length) return out;
    for (const k of cells) {
      const u = trace(sim, k);
      for (let f = 1; f < FRAMES; f++) out[f] -= Math.max(0, u[f] - u[f - 1]) / cells.length;
    }
    return out;
  });
}

/** Deflection times (ms): local minima below a threshold, at least 20 ms apart. */
export function deflections(egm, threshold = 0.04) {
  const out = [];
  for (let f = 1; f < FRAMES - 1; f++) {
    if (egm[f] > -threshold || egm[f] > egm[f - 1] || egm[f] > egm[f + 1]) continue;
    const t = f * FRAME_MS;
    if (out.length && t - out[out.length - 1] < 20) { if (egm[f] < egm[out[out.length - 1] / FRAME_MS]) out[out.length - 1] = t; continue; }
    out.push(t);
  }
  return out;
}

/** Mean interval between deflections (CFE-mean, ms); null with fewer than 3. */
export function cfeMean(times) {
  if (times.length < 3) return null;
  return (times[times.length - 1] - times[0]) / (times.length - 1);
}

// ---- spectrum ----------------------------------------------------------------------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

/**
 * Dominant frequency (Hz) of an electrogram: rectified, smoothed, Hann
 * window, the largest peak in 3-12 Hz; regularity index = share of the band
 * power within 0.75 Hz of it. spectrum: [Hz, power] for drawing.
 */
export function dominantFrequency(egm) {
  const size = 2048;
  const re = new Float64Array(size), im = new Float64Array(size);
  const sm = 10;   // +-20 ms: the components of one fractionated beat merge
  for (let f = 0; f < FRAMES; f++) {
    let s = 0;
    for (let d = -sm; d <= sm; d++) s += Math.abs(egm[Math.min(FRAMES - 1, Math.max(0, f + d))]);
    re[f] = (s / (2 * sm + 1)) * (0.5 - 0.5 * Math.cos((2 * Math.PI * f) / (FRAMES - 1)));
  }
  const mean = re.slice(0, FRAMES).reduce((a, b) => a + b, 0) / FRAMES;
  for (let f = 0; f < FRAMES; f++) re[f] -= mean * (0.5 - 0.5 * Math.cos((2 * Math.PI * f) / (FRAMES - 1)));
  fft(re, im);
  const hzPerBin = 1000 / FRAME_MS / size;
  const spectrum = [];
  let peak = 0, peakAt = 0, band = 0;
  for (let i = 1; i < size / 2; i++) {
    const hz = i * hzPerBin;
    if (hz > 25) break;
    const p = re[i] * re[i] + im[i] * im[i];
    spectrum.push([hz, p]);
    if (hz < DF_BAND[0] || hz > DF_BAND[1]) continue;
    band += p;
    if (p > peak) { peak = p; peakAt = hz; }
  }
  const near = spectrum.filter(([hz]) => Math.abs(hz - peakAt) <= 0.75).reduce((s, [, p]) => s + p, 0);
  return { df: peak ? Math.round(peakAt * 100) / 100 : null, regularity: band ? near / band : 0, spectrum };
}

// ---- phase -------------------------------------------------------------------------
const wrap = (d) => d - 2 * Math.PI * Math.round(d / (2 * Math.PI));

/** Hilbert phase (radians, -pi..pi) of a signal, one value per frame. */
export function hilbertPhase(signal) {
  const size = 2048;
  const re = new Float64Array(size), im = new Float64Array(size);
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  for (let f = 0; f < FRAMES; f++) re[f] = signal[f] - mean;
  fft(re, im);
  for (let i = 1; i < size / 2; i++) { re[i] *= 2; im[i] *= 2; }
  for (let i = size / 2 + 1; i < size; i++) { re[i] = 0; im[i] = 0; }
  // inverse via conjugation
  for (let i = 0; i < size; i++) im[i] = -im[i];
  fft(re, im);
  const out = new Float32Array(FRAMES);
  for (let f = 0; f < FRAMES; f++) out[f] = Math.atan2(-im[f] / size, re[f] / size);
  return out;
}

/** True phase of every pixel at a frame from the state of the medium (u, v); NaN in blocked tissue. */
export function truePhase(sim, frame) {
  const out = new Float32Array(N * N);
  for (let k = 0; k < N * N; k++) {
    if (sim.blocked[k]) { out[k] = NaN; continue; }
    out[k] = Math.atan2(sim.V[frame * N * N + k] / 255 - 0.25, sim.U[frame * N * N + k] / 255 - 0.4);
  }
  return out;
}

/** Phase singularities on a lattice of phases (w x h, row-major): plaquettes with a net winding of +-2 pi. */
export function singularities(phase, w, h) {
  const out = [];
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const c = [phase[y * w + x], phase[y * w + x + 1], phase[(y + 1) * w + x + 1], phase[(y + 1) * w + x]];
    if (c.some(Number.isNaN)) continue;
    const s = wrap(c[1] - c[0]) + wrap(c[2] - c[1]) + wrap(c[3] - c[2]) + wrap(c[0] - c[3]);
    if (Math.abs(s) > Math.PI) out.push({ x: x + 0.5, y: y + 0.5, sign: Math.sign(s) });
  }
  return out;
}

/** True PS (pixel coordinates) at a frame. */
export function truePs(sim, frame) {
  return singularities(truePhase(sim, frame), N, N);
}

/** Electrode positions (pixels) of a resolution, and those out of contact. */
export function electrodes(resolution) {
  if (resolution === 'full') return { points: null, lost: new Set() };
  const points = [];
  for (let j = 0; j < BASKET.count; j++) for (let i = 0; i < BASKET.count; i++) points.push([BASKET.first + i * BASKET.step, BASKET.first + j * BASKET.step]);
  const lost = new Set();
  if (resolution === 'basketPoor') points.forEach(([x, y], i) => { if (hash(x, y, 11) < 0.5) lost.add(i); });
  return { points, lost };
}

/**
 * Mapped phase: the Hilbert phase of the activation signal at each
 * electrode (every pixel at 'full'), all frames. Electrodes out of contact
 * take the circular mean of their in-contact neighbours (interpolation).
 * Returns { w, h, phases: Float32Array per lattice point, at(x, y) -> pixel }.
 */
export function mappedPhase(sim, resolution) {
  return cached(`ph|${sim.id}|${[...sim.lesions].join(',')}|${resolution}`, () => {
    const { points, lost } = electrodes(resolution);
    if (!points) {
      const phases = [];
      for (let k = 0; k < N * N; k++) phases.push(sim.blocked[k] ? null : hilbertPhase(trace(sim, k)));
      return { w: N, h: N, phases, step: 1, first: 0 };
    }
    const signal = (x, y) => { const cells = footprint(x, y).filter((k) => !sim.blocked[k]); const out = new Float32Array(FRAMES); for (const k of cells) { const t = trace(sim, k); for (let f = 0; f < FRAMES; f++) out[f] += t[f] / cells.length; } return out; };
    const phases = points.map(([x, y], i) => (lost.has(i) ? null : hilbertPhase(signal(x, y))));
    const w = BASKET.count;
    // Out of contact: interpolate from the in-contact neighbours (circular mean).
    const filled = phases.map((p, i) => {
      if (p) return p;
      const [ix, iy] = [i % w, Math.floor(i / w)];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => [ix + dx, iy + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < w && b < w).map(([a, b]) => phases[b * w + a]).filter(Boolean);
      const out = new Float32Array(FRAMES);
      for (let f = 0; f < FRAMES; f++) { let c = 0, s = 0; for (const q of nb) { c += Math.cos(q[f]); s += Math.sin(q[f]); } out[f] = Math.atan2(s, c); }
      return out;
    });
    return { w, h: w, phases: filled, step: BASKET.step, first: BASKET.first };
  });
}

/** Mapped PS at a frame, in pixel coordinates. */
export function mappedPs(sim, resolution, frame) {
  const m = mappedPhase(sim, resolution);
  const lattice = m.phases.map((p) => (p ? p[frame] : NaN));
  return singularities(lattice, m.w, m.h).map((p) => ({ ...p, x: m.first + p.x * m.step, y: m.first + p.y * m.step }));
}

/** Mean position of the true PS over the recording (the rotor core region), with its spread (mm); null without PS. */
export function rotorCore(sim) {
  return cached(`core|${sim.id}|${[...sim.lesions].join(',')}`, () => {
    const ps = [];
    for (let f = 0; f < FRAMES; f += 10) ps.push(...truePs(sim, f));
    if (!ps.length) return null;
    const x = ps.reduce((s, p) => s + p.x, 0) / ps.length, y = ps.reduce((s, p) => s + p.y, 0) / ps.length;
    const spread = Math.sqrt(ps.reduce((s, p) => s + (p.x - x) ** 2 + (p.y - y) ** 2, 0) / ps.length);
    return { x, y, spread, perFrame: ps.length / Math.ceil(FRAMES / 10) };
  });
}

/**
 * PS statistics over the recording (every tenth frame): mean true PS,
 * mean mapped PS, the share of mapped PS within 6 mm of a true PS, and the
 * share of frames where the true PS were all seen.
 */
export function psStats(sim, resolution) {
  return cached(`pss|${sim.id}|${[...sim.lesions].join(',')}|${resolution}`, () => {
    let t = 0, m = 0, matched = 0, frames = 0;
    for (let f = 50; f < FRAMES - 50; f += 10) {
      const truth = truePs(sim, f), mapped = mappedPs(sim, resolution, f);
      t += truth.length; m += mapped.length; frames++;
      matched += mapped.filter((p) => truth.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= 6)).length;
    }
    return { truePs: t / frames, mappedPs: m / frames, precision: m ? matched / m : null };
  });
}

// ---- maps ---------------------------------------------------------------------------
/** Per-site readings on a coarse lattice (every 3 mm): DF, regularity, CFE-mean, CFAE. */
export function siteMaps(sim) {
  return cached(`maps|${sim.id}|${[...sim.lesions].join(',')}`, () => {
    const out = [];
    for (let y = 4; y < N - 2; y += 3) for (let x = 4; x < N - 2; x += 3) {
      const egm = electrogram(sim, [x, y]);
      const times = deflections(egm);
      const { df, regularity } = dominantFrequency(egm);
      const cfe = cfeMean(times);
      out.push({ x, y, df, regularity, cfe, cfae: cfe != null && cfe < CFAE_MS, beats: times.length });
    }
    return out;
  });
}

/** Whether the medium is still active at the end of the recording (AF persists). */
export function persists(sim) {
  let active = 0;
  for (let f = FRAMES - 100; f < FRAMES; f++) for (let k = 0; k < N * N; k++) if (sim.U[f * N * N + k] > 128) { active++; break; }
  return active > 50;
}

/** Ablation lesions: a disc (radius in mm) around a point, or a line between two points (2 mm wide). */
export function disc([cx, cy], radius) {
  const out = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x - cx, y - cy) <= radius) out.push(key(x, y));
  return out;
}
export function line([x0, y0], [x1, y1]) {
  const out = new Set(), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const px = Math.round(x) + dx, py = Math.round(y) + dy; if (px >= 0 && py >= 0 && px < N && py < N) out.add(key(px, py)); }
  }
  return [...out];
}

export const ABLATIONS = Object.freeze(['none', 'core', 'line', 'cfae']);

/** Lesions of an ablation choice: on the rotor core (from the baseline PS), from it to the left edge, or on the patch. */
export function ablationLesions(id, kind) {
  if (kind === 'none') return [];
  const s = SCENARIOS[id], core = rotorCore(simulate(id));
  const c = core && core.perFrame < 2 ? [Math.round(core.x), Math.round(core.y)] : [N / 2, N / 2];
  if (kind === 'core') return disc(c, 4);
  if (kind === 'line') return line(c, [0, c[1]]);
  const [x0, y0, x1, y1] = s.patch?.rect ?? [N / 2 - 6, N / 2 - 6, N / 2 + 6, N / 2 + 6];
  return disc([Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)], 6);
}

/** Result of a run: 'terminated', 'organized' (regular reentry without a PS in tissue) or 'persists'. */
export function outcome(sim) {
  if (!persists(sim)) return 'terminated';
  const core = rotorCore(sim);
  const egm = electrogram(sim, [7, 7]);
  return (!core || core.perFrame < 0.1) && dominantFrequency(egm).regularity > 0.8 ? 'organized' : 'persists';
}

/** Whether a pixel lies in the scenario's fibrotic patch. */
export function inPatch(id, [x, y]) {
  const r = SCENARIOS[id].patch?.rect;
  return Boolean(r) && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
}
