/*
 * Substrate mapping teaching model (pure). The unrolled left ventricle of
 * pmap-model.js (same grid, cone geometry, wavefront spread and twelve-lead
 * QRS) with a healed infarct: dense scar, a border zone, and surviving
 * channels inside the scar (the VT isthmus with a slow entrance, a dead-end
 * bystander branch off the isthmus, and a separate dead-end strand). Every
 * pixel carries a bipolar and a unipolar voltage, so a voltage map with
 * adjustable cut-offs shows the scar and, at a lower scar cut-off, the
 * channels. A sinus beat (or RV apical pacing) gives every pixel an
 * activation time; a catheter site records a far field (the surrounding
 * muscle) and, over a channel, a delayed near field: late potentials
 * (after the QRS) and local abnormal ventricular activity. During the VT
 * the wave runs through the isthmus and back around the scar (the outer
 * loop); pacing at a site during the VT gives the postpacing interval, the
 * QRS (concealed or manifest fusion) and the stimulus to QRS interval, and
 * the classification of Stevenson (exit, central, proximal, inner loop,
 * outer loop, adjacent or remote bystander). Ablation strategies (clinical
 * VT, late potentials, scar dechanneling, core isolation, homogenization)
 * give a lesion set; the model says whether the clinical VT can still run
 * and which abnormal signals are left.
 * Voltage definitions after Marchlinski (bipolar 0.5 / 1.5 mV, unipolar
 * 8.27 mV for the LV), entrainment criteria after Stevenson and Josephson,
 * strategies after Cardiac Mapping 5th ed. (Wiley 2019), chapters 69, 72
 * and 79. Schematic teaching grid; numbers are the grid's own.
 */
import { GRID, place, spread, qrs, compare, cellKey as key, cellOf, wrapDistance } from './pmap-model.js';

export { GRID, cellOf };
export const cellKey = key;

export const CUTOFFS = Object.freeze({ scar: [0.5, 0.2, 0.1], normal: [1.5, 1.0], unipolar: 8.27 });
export const RHYTHMS = Object.freeze(['sinus', 'rv', 'vt']);
export const STRATEGIES = Object.freeze(['none', 'clinical', 'lp', 'dechanneling', 'core', 'homogenization']);
export const SITE_CLASSES = Object.freeze(['exit', 'central', 'proximal', 'inner', 'outer', 'adjacent', 'remote']);

const CV = { wall: 6, border: 7 };   // ms per pixel
const LATENCY = 10;                  // stimulus to local capture
const ENTRAIN_FASTER = 40;           // pacing cycle = VT cycle - 40 ms
const LP_GAP = 20;                   // isolated near field: at least 20 ms after the far field
const CONCEALED = 99;                // QRS match (%) read as concealed fusion
const NORMAL_EGM = { amplitude: 1.5, duration: 70 };
const RATIO = [0.3, 0.5, 0.7];

const rect = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const row = (y, x0, x1) => rect(x0, y, x1, y);

// Inferolateral infarct. Isthmus: entrance on the left (slow), exit on the right.
const ISTHMUS = row(11, 21, 28);
const BYSTANDER = [[25, 12], [25, 13], [24, 13], [23, 13]];   // joins the isthmus at (25, 11)
const STRAND = row(9, 21, 25);                                  // opens on the wall at (20, 9)

export const SCENARIOS = Object.freeze({
  ischemic: {
    scar: rect(21, 8, 28, 14),
    channels: {
      isthmus: { cells: ISTHMUS, delay: (i) => (i < 3 ? 34 : 24), voltage: [0.24, 0.45] },
      bystander: { cells: BYSTANDER, delay: () => 25, voltage: [0.22, 0.4], joins: [25, 11] },
      strand: { cells: STRAND, delay: () => 30, voltage: [0.25, 0.42] }
    },
    circuit: { isthmus: 'isthmus', entrance: [20, 11], exit: [29, 11] },
    start: [25, 11],
    sites: {
      exit: [28, 11], central: [24, 11], proximal: [22, 11], bystander: [23, 13], strand: [23, 9],
      outerLoop: [24, 6], border: [30, 15], remote: [5, 12]
    }
  },
  nicm: {
    // Non-ischaemic: epicardial basolateral scar, endocardium spared.
    scar: [], epicardial: rect(18, 0, 26, 6), channels: {}, circuit: null,
    start: [22, 3],
    sites: { epicardial: [22, 3], edge: [17, 4], remote: [5, 12] }
  }
});

// ---- deterministic texture --------------------------------------------------
function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const between = ([lo, hi], u) => lo + (hi - lo) * u;
const round2 = (v) => Math.round(v * 100) / 100;

// ---- tissue ----------------------------------------------------------------
/** Tissue of a scenario; ablated: pixel keys turned into lesions. */
export function tissue(id, ablated = new Set()) {
  const s = SCENARIOS[id];
  const n = GRID.w * GRID.h;
  const type = new Array(n).fill('wall');
  const group = new Array(n).fill(null);
  const delay = new Array(n).fill(CV.wall);
  const order = new Array(n).fill(-1);
  for (const [x, y] of s.scar) type[key(x, y)] = 'scar';
  for (const [name, ch] of Object.entries(s.channels)) {
    ch.cells.forEach(([x, y], i) => { const k = key(x, y); type[k] = 'channel'; group[k] = name; delay[k] = ch.delay(i); order[k] = i; });
  }
  // Border zone: muscle within two pixels of the dense scar.
  const scarCells = s.scar.map(([x, y]) => [x, y]);
  const scarDist = new Array(n).fill(Infinity);
  for (let k = 0; k < n; k++) {
    if (type[k] !== 'wall') continue;
    const [x, y] = cellOf(k);
    for (const [a, b] of scarCells) scarDist[k] = Math.min(scarDist[k], Math.max(Math.abs(a - x), Math.abs(b - y)));
    if (scarDist[k] <= 2) { type[k] = 'border'; delay[k] = CV.border; }
  }
  const epi = new Set((s.epicardial || []).map(([x, y]) => key(x, y)));
  const bipolar = new Array(n), unipolar = new Array(n);
  for (let k = 0; k < n; k++) {
    const [x, y] = cellOf(k), u = hash(x, y, 1), v = hash(x, y, 2);
    if (type[k] === 'scar') { bipolar[k] = between([0.04, 0.17], u); unipolar[k] = between([2.2, 4.8], v); }
    else if (type[k] === 'channel') { bipolar[k] = between(s.channels[group[k]].voltage, u); unipolar[k] = between([3.5, 5.5], v); }
    else if (type[k] === 'border') { bipolar[k] = between(scarDist[k] === 1 ? [0.6, 0.95] : [1.0, 1.4], u); unipolar[k] = between([5.8, 7.8], v); }
    else if (epi.has(k)) { bipolar[k] = between([1.7, 2.6], u); unipolar[k] = between([4.6, 7.4], v); }
    else { bipolar[k] = between([1.9, 4.6], u); unipolar[k] = between([8.9, 13], v); }
    bipolar[k] = round2(bipolar[k]); unipolar[k] = round2(unipolar[k]);
  }
  const conducts = (k) => type[k] !== 'scar' && !ablated.has(k);
  const joinOf = Object.fromEntries(Object.entries(s.channels).filter(([, ch]) => ch.joins).map(([name, ch]) => [name, key(...ch.joins)]));
  const pos = [], normal = [], mass = [];
  const adj = Array.from({ length: n }, () => []);
  for (let k = 0; k < n; k++) {
    const p = place(...cellOf(k));
    pos.push(p.pos); normal.push(p.normal);
    mass.push(conducts(k) && type[k] !== 'channel' ? 1 : 0);
    if (!conducts(k)) continue;
    const [x, y] = cellOf(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ny = y + dy;
      if (ny < 0 || ny >= GRID.h) continue;
      const m = key(x + dx, ny);
      if (!conducts(m)) continue;
      const diagonal = dx && dy, chK = type[k] === 'channel', chM = type[m] === 'channel';
      // Channels are one pixel wide: side-to-side links only, within one channel or at its junction.
      if ((chK || chM) && diagonal) continue;
      if (chK && chM && group[k] !== group[m] && joinOf[group[k]] !== m && joinOf[group[m]] !== k) continue;
      adj[k].push([m, delay[m] * (diagonal ? Math.SQRT2 : 1)]);
    }
  }
  return { id, type, group, delay, order, bipolar, unipolar, epicardial: epi, pos, normal, mass, adj, size: n, ablated };
}

// ---- cache --------------------------------------------------------------------
const cache = new Map();
const cached = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };
const lesionKey = (ablated) => [...ablated].sort((a, b) => a - b).join(',');
export const tissueOf = (id, ablated = new Set()) => cached(`t|${id}|${lesionKey(ablated)}`, () => tissue(id, ablated));

// ---- voltage --------------------------------------------------------------------
/** Voltage class of a pixel at the chosen cut-offs: 'scar', 'border', 'normal'. */
export function voltageClass(v, scarCut = 0.5, normalCut = 1.5) {
  return v < scarCut ? 'scar' : v <= normalCut ? 'border' : 'normal';
}

// ---- sinus / paced activation ------------------------------------------------
const SOURCES = {
  sinus: [[4, 8, 0], [12, 6, 6], [32, 10, 12]],   // septal, anterior and posterior breakthroughs (pixel, ms)
  rv: [[4, 17, 25]]                               // RV apical pacing: transseptal, then the LV septum at the apex
};

/** Activation of one beat in sinus rhythm or with RV apical pacing: times, QRS, QRS onset and end. */
export function beat(id, rhythm = 'sinus', ablated = new Set()) {
  return cached(`b|${id}|${rhythm}|${lesionKey(ablated)}`, () => {
    const t = tissueOf(id, ablated);
    const act = spread(t, SOURCES[rhythm].map(([x, y, d]) => [key(x, y), d]));
    const q = qrs(t, act);
    return { time: act.time, parent: act.parent, qrs: q, onset: q.onset, end: q.end };
  });
}

// ---- local electrogram ----------------------------------------------------------
/**
 * Bipolar electrogram at a site in one beat: far field (the muscle around the
 * catheter) and the near field (the site itself). Components in ms; the
 * near field is isolated when it follows the far field by LP_GAP or more.
 * kind: 'normal' | 'abnormal' (low voltage or long) | 'lava' (isolated near
 * field inside the QRS) | 'lp' (isolated near field after the QRS) | 'none'
 * (no local signal: dense scar or a lesion at the noise level).
 */
export function electrogram(id, site, rhythm = 'sinus', ablated = new Set()) {
  const t = tissueOf(id, ablated), b = beat(id, rhythm, ablated);
  const k = key(...site);
  const voltage = ablated.has(k) ? 0.05 : t.bipolar[k];
  const far = [];
  for (let m = 0; m < t.size; m++) {
    if (!t.mass[m] || !Number.isFinite(b.time[m]) || m === k) continue;
    const d = wrapDistance(...cellOf(m), ...site);
    if (d <= 4.5) far.push({ t: b.time[m], w: 1 / (1 + d * d) });   // inside scar the far field comes from further away
  }
  const weight = far.reduce((s, f) => s + f.w, 0);
  const farTime = weight ? Math.round(far.reduce((s, f) => s + f.t * f.w, 0) / weight) : null;
  const local = Number.isFinite(b.time[k]) && !ablated.has(k) ? Math.round(b.time[k]) : null;
  const isChannel = t.type[k] === 'channel';
  const components = [];
  if (farTime != null) components.push({ t: farTime, near: false });
  if (local != null && (isChannel || t.type[k] === 'border' || !farTime || Math.abs(local - farTime) > 4)) components.push({ t: local, near: true });
  // Border zone: slow, non-uniform conduction splits the far field into a few deflections.
  const borderSplit = t.type[k] === 'border' && local != null;
  const gap = isChannel && local != null && farTime != null ? local - farTime : 0;
  const isolated = isChannel && gap >= LP_GAP;
  const span = components.length ? Math.max(...components.map((c) => c.t)) - Math.min(...components.map((c) => c.t)) : 0;
  const duration = (components.length ? 34 : 0) + span + (borderSplit ? 22 : 0);
  let kind = 'normal';
  if (t.type[k] === 'scar' || ablated.has(k) || local == null) kind = voltage < 0.2 ? 'none' : 'abnormal';
  else if (isolated) kind = local > b.end ? 'lp' : 'lava';
  else if (voltage < NORMAL_EGM.amplitude || duration >= NORMAL_EGM.duration) kind = 'abnormal';
  return { site, voltage, unipolar: t.unipolar[k], type: t.type[k], farTime, local, components, gap, isolated, duration, kind, qrsOnset: b.onset, qrsEnd: b.end, borderSplit };
}

/** Bipolar EGM waveform (mV, one value per ms over [0, length)). */
export function egmTrace(e, length) {
  const out = new Float64Array(length);
  const add = (t0, amp, width) => {
    for (let ms = Math.max(0, Math.floor(t0 - 4 * width)); ms < Math.min(length, t0 + 4 * width); ms++) {
      const u = (ms - t0) / width;
      out[ms] += amp * -u * Math.exp(-u * u / 2) * 1.65;
    }
  };
  if (e.kind === 'none') { for (let ms = 0; ms < length; ms++) out[ms] = 0.02 * Math.sin(ms * 1.7) * hash(ms, 3, 9); return out; }
  const near = e.components.find((c) => c.near), far = e.components.find((c) => !c.near);
  const isolated = e.isolated && near;
  if (far) add(far.t, isolated ? e.voltage * 0.35 + 0.15 : e.voltage * (near ? 0.55 : 1), 9);
  if (near) {
    if (isolated) { add(near.t, e.voltage * 0.6, 2.4); add(near.t + 9, -e.voltage * 0.45, 2.2); add(near.t + 17, e.voltage * 0.3, 2); }
    else add(near.t, e.voltage * 0.5, e.type === 'border' ? 5 : 4);
  }
  if (e.borderSplit && far) { add(far.t + 16, e.voltage * 0.3, 4); add(far.t + 27, -e.voltage * 0.22, 3); }
  return out;
}

/** Every pixel's EGM kind in one beat (the late potential / LAVA tags). */
export function egmMap(id, rhythm = 'sinus', ablated = new Set()) {
  return cached(`e|${id}|${rhythm}|${lesionKey(ablated)}`, () => {
    const out = new Map();
    for (let k = 0; k < GRID.w * GRID.h; k++) out.set(k, electrogram(id, cellOf(k), rhythm, ablated).kind);
    return out;
  });
}

// ---- the VT circuit ----------------------------------------------------------------
/** Wall-only activation (channels closed) from timed sources. */
function wallSpread(t, sources) {
  const channels = new Set();
  for (let k = 0; k < t.size; k++) if (t.type[k] === 'channel') channels.add(k);
  return spread(t, sources, channels);
}

/**
 * The clinical VT: isthmus times from the entrance (orthodromic), the time
 * through the isthmus (I), around the scar (O), the cycle length, the VT
 * activation and its QRS. Null when the scenario has no circuit or the
 * isthmus is interrupted (ablated).
 */
export function vt(id, ablated = new Set()) {
  return cached(`vt|${id}|${lesionKey(ablated)}`, () => {
    const s = SCENARIOS[id];
    if (!s.circuit) return null;
    const t = tissueOf(id, ablated);
    const cells = s.channels[s.circuit.isthmus].cells.map(([x, y]) => key(x, y));
    if (cells.some((k) => ablated.has(k))) return null;
    const E = key(...s.circuit.entrance), X = key(...s.circuit.exit);
    if (ablated.has(E) || ablated.has(X)) return null;
    const tIn = []; let acc = 0;
    for (const k of cells) { acc += t.delay[k]; tIn.push(acc); }
    const I = acc + t.delay[X];
    const fromX = wallSpread(t, [[X, 0]]);
    const O = fromX.time[E];
    if (!Number.isFinite(O)) return null;
    const time = new Array(t.size).fill(Infinity), parent = new Array(t.size).fill(-1);
    for (let k = 0; k < t.size; k++) if (Number.isFinite(fromX.time[k])) { time[k] = I + fromX.time[k]; parent[k] = fromX.parent[k]; }
    cells.forEach((k, i) => { time[k] = tIn[i]; });
    time[E] = 0;
    const q = qrs(t, { time, parent });
    const tcl = Math.round(I + O);
    // QRS onset after the exit (ms) and in the cycle (from the entrance).
    return { cells, tIn, I, O, tcl, E, X, time, qrs: q, exitToOnset: q.onset - I, onset: q.onset };
  });
}

/** Ordered path inside channels from a site to a target pixel (both in channels); null if none. */
function channelPath(t, from, to) {
  const prev = new Map([[from, -1]]), queue = [from];
  while (queue.length) {
    const k = queue.shift();
    if (k === to) break;
    for (const [m] of t.adj[k]) if (t.type[m] === 'channel' && !prev.has(m)) { prev.set(m, k); queue.push(m); }
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let k = to; k !== -1; k = prev.get(k)) path.unshift(k);
  return path;
}
const sumDelay = (t, cells) => cells.reduce((s, k) => s + t.delay[k], 0);

/**
 * Entrainment from a site during the VT (pacing cycle 40 ms shorter).
 * Returns ppiMinusTcl, the entrained QRS and its match with the VT QRS,
 * concealed, sqrs (stimulus to QRS onset; null with manifest fusion),
 * egmQrs (local EGM to QRS onset during VT; null after the QRS), the ratio
 * S-QRS / TCL and the class (SITE_CLASSES). Null: no capture or no VT.
 */
export function entrain(id, site, ablated = new Set()) {
  const v = vt(id, ablated);
  if (!v) return null;
  const t = tissueOf(id, ablated), s = SCENARIOS[id];
  const k = key(...site);
  if (t.type[k] === 'scar' || ablated.has(k)) return { site, capture: false };
  const pcl = v.tcl - ENTRAIN_FASTER;
  const cellIndex = v.cells.indexOf(k);
  const join = s.channels.bystander?.joins ? key(...s.channels.bystander.joins) : -1;
  let ppiMinusTcl, sqrs = null, egmQrs = null, paced, where;

  if (cellIndex >= 0 || t.group[k] === 'bystander') {
    // Protected channel: the antidromic wave collides inside; only the exit makes the QRS.
    let toJoin = 0, back = 0, i = cellIndex;
    if (cellIndex < 0) {
      const path = channelPath(t, k, join);
      toJoin = sumDelay(t, path.slice(1));
      back = sumDelay(t, path.slice(0, -1));
      i = v.cells.indexOf(join);
      where = 'bystander';
    } else where = 'isthmus';
    const toExit = v.tIn[v.tIn.length - 1] - v.tIn[i] + t.delay[v.X];
    ppiMinusTcl = toJoin + back;
    sqrs = Math.round(LATENCY + toJoin + toExit + v.exitToOnset);
    egmQrs = Math.round(v.onset - (v.tIn[i] + back));
    paced = v.qrs;   // same morphology as the VT
  } else {
    // Wall (or the separate strand, which opens on the wall): direct wave n and the exit of wave n - 1.
    let mouth = k, out = 0, back = 0;
    if (t.type[k] === 'channel') {
      const opening = s.channels[t.group[k]].cells[0];
      const m = key(opening[0] - 1, opening[1]);
      const path = channelPath(t, k, key(...opening));
      out = sumDelay(t, path.slice(1)) + t.delay[m];
      back = sumDelay(t, path);
      mouth = m;
      where = 'strand';
    } else where = 'wall';
    const fromSite = wallSpread(t, [[mouth, LATENCY + out]]);
    const fromE = wallSpread(t, [[v.E, 0]]).time[mouth], fromX = wallSpread(t, [[v.X, 0]]).time[mouth];
    ppiMinusTcl = Math.round(fromE + fromX - v.O + out + back);
    const exitTime = LATENCY + out + fromE + v.I - pcl;
    const exitWave = wallSpread(t, [[v.X, exitTime]]);
    const time = fromSite.time.map((d, m) => Math.min(d, exitWave.time[m]));
    const parent = fromSite.time.map((d, m) => (d <= exitWave.time[m] ? fromSite.parent[m] : exitWave.parent[m]));
    const lo = Math.min(...time.filter(Number.isFinite));
    paced = qrs(t, { time: time.map((x) => x - lo), parent });
    const localVt = v.time[mouth];
    if (Number.isFinite(localVt) && localVt + out < v.onset) egmQrs = Math.round(v.onset - localVt - back);
    sqrs = LATENCY + out;   // the paced wave reaches the wall at once
  }
  const match = where === 'isthmus' || where === 'bystander' ? 100 : compare(v.qrs, paced).score;
  const concealed = match >= CONCEALED;
  if (!concealed) sqrs = null;
  const ratio = sqrs != null ? sqrs / v.tcl : null;
  const inCircuit = ppiMinusTcl <= 30;
  let cls;
  if (inCircuit && concealed) cls = ratio < RATIO[0] ? 'exit' : ratio < RATIO[1] ? 'central' : ratio <= RATIO[2] ? 'proximal' : 'inner';
  else if (inCircuit) cls = 'outer';
  else cls = concealed ? 'adjacent' : 'remote';
  const delta = sqrs != null && egmQrs != null ? sqrs - egmQrs : null;
  // Josephson: PPI - TCL <= 10, concealed fusion, S-QRS = EGM-QRS (10 ms), presystolic (< 70 % of the cycle).
  const josephson = concealed && ppiMinusTcl <= 10 && delta != null && Math.abs(delta) <= 10 && ratio != null && ratio < RATIO[2];
  return { site, capture: true, where, tcl: v.tcl, pcl, ppi: v.tcl + ppiMinusTcl, ppiMinusTcl, match, concealed, sqrs, egmQrs, delta, ratio, inCircuit, cls, josephson, vtQrs: v.qrs, paced };
}

// ---- ablation strategies ----------------------------------------------------------
const channelCells = (t) => [...Array(t.size).keys()].filter((k) => t.type[k] === 'channel');
const neighbours4 = (k) => { const [x, y] = cellOf(k); return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([, dy]) => y + dy >= 0 && y + dy < GRID.h).map(([dx, dy]) => key(x + dx, y + dy)); };

/** Lesion set (pixel keys) of a strategy in a scenario. */
export function lesions(id, strategy) {
  return cached(`l|${id}|${strategy}`, () => {
    const t = tissueOf(id), s = SCENARIOS[id], out = new Set();
    if (strategy === 'none') return out;
    if (strategy === 'clinical') {
      // Entrainment-guided: the sites that meet the Josephson criteria.
      if (s.circuit) for (const k of vt(id).cells) { const r = entrain(id, cellOf(k)); if (r?.josephson) out.add(k); }
      return out;
    }
    if (strategy === 'lp') {
      for (const rhythm of ['sinus', 'rv']) for (const [k, kind] of egmMap(id, rhythm)) if (kind === 'lp') out.add(k);
      return out;
    }
    if (strategy === 'dechanneling') {
      // Channel entrances: the channel pixel at each opening on the border zone, and the border pixel in front of it.
      for (const k of channelCells(t)) {
        const opening = neighbours4(k).filter((m) => t.type[m] === 'border' || t.type[m] === 'wall');
        if (opening.length) { out.add(k); for (const m of opening) out.add(m); }
      }
      return out;
    }
    if (strategy === 'core') {
      // Encircle the dense scar: the border pixels touching the scar or a channel opening.
      for (let k = 0; k < t.size; k++) {
        if (t.type[k] !== 'border') continue;
        const [x, y] = cellOf(k);
        const touches = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(([dx, dy]) => {
          const ny = y + dy; if (ny < 0 || ny >= GRID.h) return false;
          const m = key(x + dx, ny); return t.type[m] === 'scar' || t.type[m] === 'channel';
        });
        if (touches) out.add(k);
      }
      return out;
    }
    if (strategy === 'homogenization') {
      // Every abnormal electrogram in the scar and its border (not the dense scar at the noise level).
      for (const rhythm of ['sinus', 'rv']) for (const [k, kind] of egmMap(id, rhythm)) if ((kind === 'abnormal' || kind === 'lp' || kind === 'lava') && t.type[k] !== 'scar') out.add(k);
      return out;
    }
    return out;
  });
}

/**
 * Outcome of a strategy: lesion count, whether the clinical VT can still run,
 * the late potentials / LAVA left in sinus rhythm and with RV pacing, and
 * exit block from the isolated core (pacing inside does not reach the wall).
 */
export function outcome(id, strategy) {
  return cached(`o|${id}|${strategy}`, () => {
    const set = lesions(id, strategy);
    const t = tissueOf(id, set);
    const residual = { lp: 0, lava: 0 };
    for (const rhythm of ['sinus', 'rv']) for (const [, kind] of egmMap(id, rhythm, set)) if (kind === 'lp' || kind === 'lava') residual[kind]++;
    const channels = channelCells(t).filter((k) => !set.has(k));
    let exitBlock = null;
    if (strategy === 'core' && channels.length) {
      const reach = spread(t, [[channels[0], 0]]).time;
      exitBlock = ![...Array(t.size).keys()].some((k) => t.type[k] === 'wall' && Number.isFinite(reach[k]));
    }
    const s = SCENARIOS[id];
    return { lesions: set.size, vtInducible: s.circuit ? Boolean(vt(id, set)) : null, residual, exitBlock };
  });
}
