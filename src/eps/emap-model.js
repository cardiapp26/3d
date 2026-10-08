/*
 * Mapping basics teaching model (pure). A 36 x 24 mm patch of myocardium
 * (0.5 mm pixels) with an elliptical scar, its border zone and a narrow
 * surviving channel (1 mm wide) across the scar. A paced planar wave
 * activates the patch (slow in the border zone and the channel). Every
 * electrode records a unipolar potential: the sum over the tissue of the
 * local current (a biphasic pulse at each pixel's activation time, scaled
 * by the viable muscle in that pixel) falling with the square of the
 * distance from the electrode, which sits at a height set by the contact and averages over
 * its own surface. A bipolar EGM is the difference of two such electrodes.
 * So the voltage depends on the catheter (a 3.5 mm tip with a ring 1 mm
 * apart, or small high-density electrodes 2 or 2.5 mm apart), on the angle
 * between the bipole and the wavefront, and on contact; a map built from a
 * few points and interpolated hides what lies between them; and the local
 * activation time depends on the annotation rule (unipolar maximum -dV/dt,
 * the first sharp bipolar peak, or the largest bipolar peak).
 * After Cardiac Mapping 5th ed. (Wiley 2019), chapters 7 (fundamentals),
 * 16 (high-density mapping) and 21 (contact force). Schematic patch; the
 * voltages are calibrated to the usual clinical scale, not measured.
 */
import { spread } from './pmap-model.js';

export const PATCH = Object.freeze({ w: 72, h: 48, mm: 0.5 });
export const CATHETERS = Object.freeze({
  // radius (mm) of each electrode, centre-to-centre spacing (mm), several bipole directions available
  ablation: { tip: 1.75, ring: 1.0, spacing: 3.25, multi: false },   // the ring wraps the 7.5 Fr shaft
  pentaray: { tip: 0.5, ring: 0.5, spacing: 2, multi: true },
  orion: { tip: 0.36, ring: 0.36, spacing: 2.5, multi: true }
});
export const WAVES = Object.freeze(['left', 'top']);
export const ORIENTATIONS = Object.freeze(['x', 'y', 'best']);
export const CONTACTS = Object.freeze({ good: 0.6, light: 1.0, poor: 1.8 });   // electrode height over the tissue (mm)
export const DENSITIES = Object.freeze([1, 3, 6]);                            // mm between mapped points
export const ANNOTATIONS = Object.freeze(['firstSharp', 'maxPeak', 'unipolar']);
export const CUTS = Object.freeze({ scar: 0.5, normal: 1.5 });

const CENTRE = [36, 24], AXES = [22, 14];                // scar ellipse (pixels)
const CV = { healthy: 0.8, border: 0.5, channel: 0.25 }; // mm per ms
const MUSCLE = { healthy: 1, channel: 1.6, scar: 0.03 };   // channel: a surviving transmural bundle
const SIGMA = 1.4;                                       // ms, local current pulse
const BIN = 0.25;                                        // ms, time resolution
const SPAN = 220;                                        // ms recorded
const REACH = 8;                                         // mm: farther tissue is ignored
const DECAY = 2;                                         // potential falls as 1 / r^2 (a thin dipole layer)
const REFERENCE = [6, 6];                                // healthy calibration site (mm)
export const NOISE = 0.1;                                // mV: below this the bipolar EGM is not annotated

const key = (x, y) => y * PATCH.w + x;
export const pixelOf = (k) => [k % PATCH.w, Math.floor(k / PATCH.w)];
const toMm = (p) => (p + 0.5) * PATCH.mm;
const hash = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---- tissue -----------------------------------------------------------------
function buildTissue() {
  const n = PATCH.w * PATCH.h;
  const type = new Array(n), muscle = new Array(n), delay = new Array(n);
  for (let k = 0; k < n; k++) {
    const [x, y] = pixelOf(k);
    const e = ((x - CENTRE[0]) / AXES[0]) ** 2 + ((y - CENTRE[1]) / AXES[1]) ** 2;
    const inChannel = (y === CENTRE[1] || y === CENTRE[1] - 1) && e < 1.15;
    if (inChannel) { type[k] = 'channel'; muscle[k] = MUSCLE.channel; delay[k] = PATCH.mm / CV.channel; }
    else if (e < 1) { type[k] = 'scar'; muscle[k] = MUSCLE.scar; delay[k] = Infinity; }
    else if (e < 1.9) { type[k] = 'border'; muscle[k] = 0.3 + 0.55 * (e - 1) / 0.9; delay[k] = PATCH.mm / CV.border; }
    else { type[k] = 'healthy'; muscle[k] = MUSCLE.healthy * (0.92 + 0.16 * hash(x, y)); delay[k] = PATCH.mm / CV.healthy; }
  }
  const adj = Array.from({ length: n }, () => []);
  for (let k = 0; k < n; k++) {
    if (!Number.isFinite(delay[k])) continue;
    const [x, y] = pixelOf(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= PATCH.w || ny >= PATCH.h) continue;
      const m = key(nx, ny);
      if (!Number.isFinite(delay[m])) continue;
      // The channel joins the border zone only at its two ends (scar above and below).
      if ((type[k] === 'channel') !== (type[m] === 'channel') && dy !== 0) continue;
      adj[k].push([m, delay[m] * (dx && dy ? Math.SQRT2 : 1)]);
    }
  }
  return { type, muscle, delay, adj, size: n };
}
export const TISSUE = buildTissue();

// ---- activation --------------------------------------------------------------
const cache = new Map();
const cached = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };

/** Activation time (ms) of every pixel for a paced wave from the left or top edge. */
export function activation(wave = 'left') {
  return cached(`a|${wave}`, () => {
    const sources = [];
    for (let i = 0; i < (wave === 'left' ? PATCH.h : PATCH.w); i++) sources.push([wave === 'left' ? key(0, i) : key(i, 0), 5]);
    return spread(TISSUE, sources).time;
  });
}

/** True local activation at a point (mm): the pixel under it; null in dense scar. */
export function trueLat(wave, [xm, ym]) {
  const k = key(Math.min(PATCH.w - 1, Math.max(0, Math.floor(xm / PATCH.mm))), Math.min(PATCH.h - 1, Math.max(0, Math.floor(ym / PATCH.mm))));
  const t = activation(wave)[k];
  return Number.isFinite(t) ? t : null;
}

// ---- recording ----------------------------------------------------------------
const PULSE = (() => {   // biphasic local current (derivative of a Gaussian), sampled every BIN
  const half = Math.ceil((4 * SIGMA) / BIN), out = [];
  for (let i = -half; i <= half; i++) { const u = (i * BIN) / SIGMA; out.push(-u * Math.exp(-u * u / 2)); }
  return { half, out };
})();
const LENGTH = Math.round(SPAN / BIN);

/** Points covering an electrode's surface (mm) around its centre. */
function surface([cx, cy], radius) {
  const pts = [[cx, cy]];
  for (let r = 0.5; r <= radius + 1e-9; r += 0.5) {
    const n = Math.max(6, Math.round((2 * Math.PI * r) / 0.5));
    for (let i = 0; i < n; i++) pts.push([cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);
  }
  return pts;
}

/** Raw unipolar potential (arbitrary units) of an electrode of a given radius at a height. */
function unipolarRaw(wave, centre, radius, height) {
  const time = activation(wave);
  const pts = surface(centre, radius);
  const hist = new Float64Array(LENGTH);
  const x0 = Math.max(0, Math.floor((centre[0] - REACH) / PATCH.mm)), x1 = Math.min(PATCH.w - 1, Math.ceil((centre[0] + REACH) / PATCH.mm));
  const y0 = Math.max(0, Math.floor((centre[1] - REACH) / PATCH.mm)), y1 = Math.min(PATCH.h - 1, Math.ceil((centre[1] + REACH) / PATCH.mm));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = key(x, y);
    if (!Number.isFinite(time[k])) continue;
    const qx = toMm(x), qy = toMm(y);
    let w = 0;
    for (const [px, py] of pts) w += ((px - qx) ** 2 + (py - qy) ** 2 + height * height) ** (-DECAY / 2);
    const bin = Math.round(time[k] / BIN);
    if (bin < LENGTH) hist[bin] += (TISSUE.muscle[k] * w) / pts.length;
  }
  const out = new Float64Array(LENGTH);
  for (let i = 0; i < LENGTH; i++) {
    if (!hist[i]) continue;
    for (let j = 0; j < PULSE.out.length; j++) { const o = i + j - PULSE.half; if (o >= 0 && o < LENGTH) out[o] += hist[i] * PULSE.out[j]; }
  }
  return out;
}

const p2p = (a) => { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo; };
const SCALE = (() => {   // calibration: a small electrode pair along a left-to-right wave in healthy tissue reads 4 mV bipolar, 10 mV unipolar
  const c = CATHETERS.pentaray, [x, y] = REFERENCE;
  const a = unipolarRaw('left', [x + c.spacing / 2, y], c.tip, CONTACTS.good), b = unipolarRaw('left', [x - c.spacing / 2, y], c.ring, CONTACTS.good);
  return { bipolar: 4 / p2p(a.map((v, i) => v - b[i])), unipolar: 10 / p2p(a) };
})();

/**
 * Recording at a point (mm) with a catheter: unipolar (distal electrode) and
 * bipolar traces (mV, one sample per BIN ms) for one bipole direction
 * ('x' along the patch, 'y' across it), their peak-to-peak voltages.
 */
function recordOne(point, { catheter = 'pentaray', orientation = 'x', contact = 'good', wave = 'left' }) {
  const c = CATHETERS[catheter], h = CONTACTS[contact];
  const [dx, dy] = orientation === 'y' ? [0, c.spacing / 2] : [c.spacing / 2, 0];
  const distal = unipolarRaw(wave, [point[0] + dx, point[1] + dy], c.tip, h);
  const proximal = unipolarRaw(wave, [point[0] - dx, point[1] - dy], c.ring, h);
  const unipolar = Array.from(distal, (v) => v * SCALE.unipolar);
  const bipolar = Array.from(distal, (v, i) => (v - proximal[i]) * SCALE.bipolar);
  return { unipolar, bipolar, bipolarV: p2p(bipolar), unipolarV: p2p(unipolar), orientation };
}

/** Recording at a point; 'best' (multielectrode catheters only) keeps the larger of the two bipole directions. */
export function record(point, opts = {}) {
  const o = { catheter: 'pentaray', orientation: 'x', contact: 'good', wave: 'left', ...opts };
  return cached(`r|${point.map((v) => v.toFixed(2))}|${o.catheter}|${o.orientation}|${o.contact}|${o.wave}`, () => {
    if (o.orientation !== 'best' || !CATHETERS[o.catheter].multi) return recordOne(point, { ...o, orientation: o.orientation === 'best' ? 'x' : o.orientation });
    const a = recordOne(point, { ...o, orientation: 'x' }), b = recordOne(point, { ...o, orientation: 'y' });
    return a.bipolarV >= b.bipolarV ? a : b;
  });
}

// ---- annotation ---------------------------------------------------------------
/**
 * Local activation time read from a recording: 'unipolar' (steepest
 * downstroke of the unipolar EGM), 'firstSharp' (the first bipolar peak
 * whose slope reaches half the steepest slope), 'maxPeak' (the largest
 * bipolar deflection).
 */
export function annotate(rec, method = 'firstSharp') {
  const ms = (i) => Math.round(i * BIN * 10) / 10;
  if (method === 'unipolar') {
    let best = 0, at = 0;
    for (let i = 1; i < rec.unipolar.length; i++) { const d = rec.unipolar[i - 1] - rec.unipolar[i]; if (d > best) { best = d; at = i; } }
    return ms(at);
  }
  const b = rec.bipolar;
  if (method === 'maxPeak') {
    let best = 0, at = 0;
    b.forEach((v, i) => { if (Math.abs(v) > best) { best = Math.abs(v); at = i; } });
    return ms(at);
  }
  // Deflections between zero crossings; sharp = narrow (high slope for its amplitude).
  const parts = [];
  let start = 0;
  for (let i = 1; i <= b.length; i++) {
    if (i < b.length && Math.sign(b[i]) === Math.sign(b[start])) continue;
    let peak = start, slope = 0;
    for (let j = start; j < i; j++) { if (Math.abs(b[j]) > Math.abs(b[peak])) peak = j; if (j > start) slope = Math.max(slope, Math.abs(b[j] - b[j - 1])); }
    parts.push({ peak, amp: Math.abs(b[peak]), sharp: Math.abs(b[peak]) ? slope / Math.abs(b[peak]) : 0 });
    start = i;
  }
  const top = Math.max(...parts.map((d) => d.amp));
  const real = parts.filter((d) => d.amp >= 0.15 * top);
  const sharpest = Math.max(...real.map((d) => d.sharp));
  const first = real.find((d) => d.sharp >= 0.7 * sharpest);
  if (first) return ms(first.peak);
  return null;
}

// ---- maps ------------------------------------------------------------------------
/** Mapped points on a lattice (mm), spacing in mm, slightly jittered as a roving catheter would sample. */
export function samplePoints(spacing) {
  const pts = [], W = PATCH.w * PATCH.mm, H = PATCH.h * PATCH.mm;
  for (let y = spacing / 2; y < H; y += spacing) for (let x = spacing / 2; x < W; x += spacing) {
    const j = spacing > 1 ? 0.3 * spacing : 0;
    pts.push([Math.min(W - 0.25, x + j * (hash(Math.round(x * 10), Math.round(y * 10)) - 0.5)), Math.min(H - 0.25, y + j * (hash(Math.round(y * 10), Math.round(x * 10)) - 0.5))]);
  }
  return pts;
}

/**
 * A map: the value at every mapped point (bipolar or unipolar voltage, or
 * the annotated LAT) and an interpolated value at every display pixel
 * (inverse distance weighting of the mapped points within the fill radius;
 * null where no point is close enough).
 */
export function buildMap({ kind = 'bipolar', spacing = 1, annotation = 'firstSharp', ...opts } = {}) {
  const o = { catheter: 'pentaray', orientation: 'x', contact: 'good', wave: 'left', ...opts };
  return cached(`m|${kind}|${spacing}|${annotation}|${o.catheter}|${o.orientation}|${o.contact}|${o.wave}`, () => {
    const points = samplePoints(spacing).map((p) => {
      const rec = record(p, o);
      // No LAT where there is no local signal (noise level).
      const value = kind === 'bipolar' ? rec.bipolarV : kind === 'unipolar' ? rec.unipolarV : rec.bipolarV < NOISE ? null : annotate(rec, annotation);
      return { p, value };
    });
    const fill = Math.max(1.2, spacing * 1.25);
    const grid = new Array(PATCH.w * PATCH.h).fill(null);
    for (let k = 0; k < grid.length; k++) {
      const [x, y] = pixelOf(k), qx = toMm(x), qy = toMm(y);
      let sw = 0, sv = 0;
      for (const { p, value } of points) {
        if (value == null) continue;
        const d = Math.hypot(p[0] - qx, p[1] - qy);
        if (d > fill) continue;
        const w = 1 / (d * d + 0.05);
        sw += w; sv += w * value;
      }
      grid[k] = sw ? sv / sw : null;
    }
    return { points, grid, fill };
  });
}

/** Share (0..1) of the channel's centre line that reads above the scar cut-off on a bipolar map. */
export function channelSeen(map, cut = CUTS.scar) {
  const y = CENTRE[1];
  const xs = [];
  for (let x = CENTRE[0] - AXES[0] + 3; x <= CENTRE[0] + AXES[0] - 3; x++) xs.push(key(x, y));
  return xs.filter((k) => map.grid[k] != null && map.grid[k] >= cut).length / xs.length;
}

/** Named points (mm). */
export const SITES = Object.freeze({
  healthy: [6, 6],
  border: [toMm(CENTRE[0]), toMm(CENTRE[1] - AXES[1] - 2)],
  channel: [toMm(CENTRE[0]), toMm(CENTRE[1]) - 0.25],
  scar: [toMm(CENTRE[0]), toMm(CENTRE[1] - 5)],
  channelEnd: [toMm(CENTRE[0] - AXES[0] + 3), toMm(CENTRE[1]) - 0.25]
});

/** Tissue under a point (mm): 'healthy', 'border', 'scar' or 'channel'. */
export function tissueAt([xm, ym]) {
  const x = Math.min(PATCH.w - 1, Math.max(0, Math.floor(xm / PATCH.mm))), y = Math.min(PATCH.h - 1, Math.max(0, Math.floor(ym / PATCH.mm)));
  return TISSUE.type[key(x, y)];
}

/** Scar ellipse and channel rows (pixels), for drawing the true tissue. */
export const OUTLINE = Object.freeze({ centre: CENTRE, axes: AXES, channelRows: [CENTRE[1] - 1, CENTRE[1]] });
