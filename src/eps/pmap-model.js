/*
 * Pace mapping teaching model (pure). The left ventricle unrolled on a
 * pixel grid (columns around the circumference, septal / anterior /
 * lateral / inferior, wrapping; rows from base to apex) and placed on a
 * cone in body coordinates (x left, y inferior, z anterior). A wavefront
 * spreads from the captured tissue (Dijkstra on the tissue graph: muscle,
 * slow channels inside scar, a papillary muscle beside the cavity, an
 * insulated Purkinje network). Each activated pixel adds a dipole along its
 * propagation plus an endocardium-to-epicardium part; the heart vector
 * projected on twelve lead axes gives the surface QRS. The match score is
 * the mean correlation of the paced QRS with the clinical template over
 * the twelve leads, aligned at QRS onset, as mapping systems compute it;
 * stim-QRS is the delay from the stimulus to the paced QRS onset.
 * Pacing output sets the virtual electrode (the captured radius, across
 * any gap); the coupling interval leaves tissue with a longer refractory
 * period slow (muscle) or blocked (channel); entrainment during VT keeps
 * the functional block of the circuit. Schematic teaching grid; the
 * morphologies are not real ECGs.
 */

export const GRID = Object.freeze({ w: 36, h: 20 });
export const SEGMENTS = Object.freeze([
  { id: 'septal', from: 0, to: 8 }, { id: 'anterior', from: 9, to: 17 },
  { id: 'lateral', from: 18, to: 26 }, { id: 'inferior', from: 27, to: 35 }
]);
// Captured radius (pixels) of the virtual electrode at each output.
export const OUTPUTS = Object.freeze({ threshold: 0, mid: 1, high: 1.6 });
export const COUPLINGS = Object.freeze([600, 460, 400, 340, 280]);
export const LEADS = Object.freeze(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']);

const CV = 6;            // ms per pixel, working muscle
const CHANNEL = 20;      // ms per pixel, surviving strands inside scar
const CHANNEL_SLOW = 40; // ms per pixel, the slowest part (VT entrance)
const LATENCY = 10;      // ms from the stimulus to capture
const PURKINJE = 1.2;    // ms per pixel along the Purkinje network
const PMJ = 6;           // Purkinje-muscle junction
const ERP = 250;         // default refractory period
const SLOWED = 4;        // delay factor of muscle not yet recovered
const TRANSMURAL = 3;    // weight of the endocardium-to-epicardium part
const SIGMA = 6;         // ms, smoothing of the heart vector
const ONSET = 0.05;      // QRS onset / end: share of the peak heart vector
const MASS = { wall: 1, pap: 0.3, channel: 0.04 };
const SINUS = { offset: 45, cells: [[4, 7, 0], [12, 5, 6], [31, 9, 10]] };   // breakthroughs of a sinus beat (pixel, ms)

const key = (x, y) => y * GRID.w + ((x % GRID.w) + GRID.w) % GRID.w;
const rect = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const row = (y, x0, x1) => rect(Math.min(x0, x1), y, Math.max(x0, x1), y);
export const cellKey = key;
export const cellOf = (k) => [k % GRID.w, Math.floor(k / GRID.w)];

// Channels of the scar scenario: the VT isthmus with its slow entrance (E,
// left) and exit (X, right), a dead-end bystander that joins the exit side,
// and a separate strand right above the isthmus (touching it, not
// connected) that leaves the scar at once at Y, where the scar is thin.
const ENTRANCE = row(13, 10, 12), ISTHMUS = row(13, 13, 19), EXIT = row(13, 20, 22);
const BYSTANDER = [[21, 14], [21, 15], ...row(15, 16, 20)];
const STRAND = row(12, 17, 19);
const NOTCH = rect(18, 10, 20, 11);

/**
 * Scenarios. templates: the clinical beats (source pixels or a Purkinje
 * point; block: pixels in functional block during that VT); coupling: the
 * clinical coupling interval / VT cycle; start: first catheter position;
 * sites: named positions for the jump list.
 */
export const SCENARIOS = Object.freeze({
  focal: {
    templates: [{ id: 'pvc', cells: [[13, 4]] }], coupling: 460, start: [19, 9],
    erp: [{ cells: rect(16, 2, 17, 17), erp: 330 }],
    sites: { origin: [13, 4], near: [15, 6], far: [24, 13] }
  },
  papillary: {
    templates: [{ id: 'pvc', cells: [[24, 11]] }], coupling: 460, start: [20, 8],
    cavity: rect(25, 5, 25, 12), pap: rect(24, 5, 24, 12),
    sites: { base: [24, 11], tip: [24, 6], between: [25, 9], wall: [22, 9] }
  },
  fascicular: {
    templates: [{ id: 'pvc', purkinje: [1, 10] }], coupling: 460, start: [6, 12],
    purkinje: { trunk: [[4, 0], [4, 4]], fascicles: [[[4, 4], [8, 8], [12, 13], [14, 18]], [[4, 4], [2, 9], [-2, 14], [-4, 18]]], junctionFrom: 10 },
    sites: { origin: [1, 10], septum: [5, 12] }
  },
  scar: {
    templates: [
      { id: 'vt1', cells: [[16, 13]], block: [[10, 13]] },
      { id: 'vt2', cells: [[16, 13]], block: [[22, 13]] }
    ],
    coupling: 400, start: [16, 13], entrainment: true,
    scar: rect(10, 10, 22, 17).filter(([x, y]) => !NOTCH.some(([a, b]) => a === x && b === y)),
    channels: [...ENTRANCE, ...ISTHMUS, ...EXIT, ...BYSTANDER, ...STRAND], separate: STRAND, slow: ENTRANCE,
    erp: [{ cells: EXIT, erp: 360 }],
    circuit: [[9, 13], ...ENTRANCE, ...ISTHMUS, ...EXIT, [23, 13]],
    paths: { entrance: ENTRANCE, isthmus: ISTHMUS, exit: EXIT, bystander: BYSTANDER, strand: STRAND },
    exits: { E: [9, 13], X: [23, 13], Y: [18, 11] },
    sites: { isthmus: [15, 13], deep: [18, 13], exit: [23, 13], bystander: [16, 15], strand: [18, 12], remote: [30, 4] }
  }
});

// ---- geometry: the unrolled ventricle on a cone ---------------------------
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const AXIS = norm([0.6, 0.5, 0.45]);                       // base to apex: left, inferior, anterior
const S0 = [-0.7, 0, 0.7];
const SEPT = norm(S0.map((c, i) => c - dot(S0, AXIS) * AXIS[i]));   // septal wall faces right and anterior
const ANT = (() => { const q = norm(cross(AXIS, SEPT)); return q[2] - q[1] > 0 ? q : q.map((c) => -c); })();

/** Body position and outward normal of a (fractional) grid point. */
export function place(x, y, inset = 1) {
  const phi = (2 * Math.PI * (x - 4.5)) / GRID.w;          // septum centre at 0, anterior 90, lateral 180, inferior 270 degrees
  const n = SEPT.map((c, i) => Math.cos(phi) * c + Math.sin(phi) * ANT[i]);
  const f = y / (GRID.h - 1), r = 2.6 * (1 - 0.75 * f * f) * inset;
  return { pos: AXIS.map((c, i) => c * 8 * f + r * n[i]), normal: n };
}

// Lead axes (x left, y inferior, z anterior): hexaxial limb leads, precordial leads in the horizontal plane.
const deg = (d) => (d * Math.PI) / 180;
const LEAD_AXES = [
  ...[0, 60, 120, -150, -30, 90].map((a) => [Math.cos(deg(a)), Math.sin(deg(a)), 0]),
  ...[120, 95, 75, 60, 35, 0].map((a) => [Math.cos(deg(a)), 0, Math.sin(deg(a))])
];

// ---- tissue graph -----------------------------------------------------------
function purkinjeNodes(spec) {
  const nodes = [], edges = [];
  const add = (x, y, along) => { nodes.push({ x, y, along }); return nodes.length - 1; };
  const walk = (points, from, startAlong) => {
    let prev = from, along = startAlong;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1], [x1, y1] = points[i];
      const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
      for (let s = 1; s <= steps; s++) {
        const x = x0 + ((x1 - x0) * s) / steps, y = y0 + ((y1 - y0) * s) / steps;
        const d = Math.hypot(x1 - x0, y1 - y0) / steps;
        along += d;
        const n = add(x, y, along);
        edges.push([prev, n, d * PURKINJE]);
        prev = n;
      }
    }
    return prev;
  };
  const top = add(...spec.trunk[0], -Infinity);
  const split = walk(spec.trunk, top, -Infinity);
  nodes[split].along = 0;
  for (const f of spec.fascicles) walk(f, split, 0);
  return { nodes, edges };
}

/** Tissue graph of a scenario at a pacing coupling interval. */
export function tissue(id, ci = SCENARIOS[id].coupling) {
  const s = SCENARIOS[id];
  const n = GRID.w * GRID.h;
  const type = new Array(n).fill('wall');
  for (const [x, y] of s.scar || []) type[key(x, y)] = 'scar';
  for (const [x, y] of s.channels || []) type[key(x, y)] = 'channel';
  for (const [x, y] of s.cavity || []) type[key(x, y)] = 'cavity';
  for (const [x, y] of s.pap || []) type[key(x, y)] = 'pap';
  const separate = new Set((s.separate || []).map(([x, y]) => key(x, y)));
  const papRoot = s.pap ? key(...s.pap[s.pap.length - 1]) : -1;
  const erp = new Array(n).fill(ERP);
  for (const band of s.erp || []) for (const [x, y] of band.cells) erp[key(x, y)] = band.erp;
  const unrecovered = erp.map((e) => e > ci);
  const conducts = (k) => type[k] !== 'scar' && type[k] !== 'cavity' && !(type[k] === 'channel' && unrecovered[k]);
  const slow = new Set((s.slow || []).map(([x, y]) => key(x, y)));
  const base = (k) => (type[k] === 'channel' ? (slow.has(k) ? CHANNEL_SLOW : CHANNEL) : CV) * (unrecovered[k] && type[k] !== 'channel' ? SLOWED : 1);
  const pos = [], normal = [], mass = [];
  const adj = Array.from({ length: n }, () => []);
  for (let k = 0; k < n; k++) {
    const [x, y] = cellOf(k);
    const p = place(x, y);
    pos.push(p.pos); normal.push(p.normal);
    mass.push(conducts(k) ? MASS[type[k]] : 0);
    if (!conducts(k)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ny = y + dy;
      if (ny < 0 || ny >= GRID.h) continue;
      const m = key(x + dx, ny);
      if (!conducts(m)) continue;
      const diagonal = dx && dy;
      // Narrow structures (channels, the papillary muscle) connect side to side only.
      if (diagonal && (type[k] !== 'wall' || type[m] !== 'wall')) continue;
      // A separate strand touches its neighbours without connecting; the papillary muscle joins the wall at its root only.
      if (separate.has(k) !== separate.has(m) && type[k] === 'channel' && type[m] === 'channel') continue;
      if ((type[k] === 'pap') !== (type[m] === 'pap') && !((k === papRoot || m === papRoot) && dx === 0)) continue;
      adj[k].push([m, base(m) * (diagonal ? Math.SQRT2 : 1)]);
    }
  }
  let purkinje = null;
  if (s.purkinje) {
    const { nodes, edges } = purkinjeNodes(s.purkinje);
    purkinje = nodes.map((p, i) => ({ ...p, node: n + i }));
    for (const p of purkinje) {
      const pl = place(p.x, p.y, 0.97);
      pos.push(pl.pos); normal.push(pl.normal); mass.push(0); adj.push([]);
    }
    for (const [a, b, d] of edges) { adj[n + a].push([n + b, d]); adj[n + b].push([n + a, d]); }
    // Insulated proximally; distal junctions every second point.
    purkinje.forEach((p, i) => {
      if (!(p.along >= s.purkinje.junctionFrom) || i % 2) return;
      const k = key(Math.round(p.x), Math.round(p.y));
      adj[p.node].push([k, PMJ]); adj[k].push([p.node, PMJ]);
    });
  }
  return { id, ci, type, unrecovered, pos, normal, mass, adj, purkinje, size: pos.length, delay: base };
}

// ---- activation -----------------------------------------------------------
function heapPush(h, item) { h.push(item); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function heapPop(h) {
  const top = h[0], last = h.pop();
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]]; i = m;
    }
  }
  return top;
}

/** Earliest activation of every node from timed sources; blocked: node keys that do not conduct. */
export function spread(t, sources, blocked = new Set()) {
  const time = new Array(t.size).fill(Infinity), parent = new Array(t.size).fill(-1);
  const h = [];
  for (const [k, t0] of sources) if (!blocked.has(k) && t0 < time[k]) { time[k] = t0; heapPush(h, [t0, k]); }
  while (h.length) {
    const [tk, k] = heapPop(h);
    if (tk > time[k]) continue;
    for (const [m, d] of t.adj[k]) {
      if (blocked.has(m)) continue;
      const tm = tk + d;
      if (tm < time[m]) { time[m] = tm; parent[m] = k; heapPush(h, [tm, m]); }
    }
  }
  return { time, parent };
}

const nearestPurkinje = (t, [x, y]) => {
  let best = null, bd = Infinity;
  for (const p of t.purkinje || []) { const d = wrapDistance(p.x, p.y, x, y); if (d < bd) { bd = d; best = p; } }
  return best;
};
export function wrapDistance(x0, y0, x1, y1) {
  const dx = Math.abs(x0 - x1) % GRID.w;
  return Math.hypot(Math.min(dx, GRID.w - dx), y0 - y1);
}

/** Template (clinical) sources of a scenario. */
function templateSources(t, tpl) {
  if (tpl.purkinje) return [[nearestPurkinje(t, tpl.purkinje).node, LATENCY]];
  return tpl.cells.map(([x, y]) => [key(x, y), LATENCY]);
}

/**
 * Tissue captured by the virtual electrode at a site: every conducting pixel
 * (and Purkinje point) within the output radius, across gaps. On a cavity
 * pixel the catheter touches the tissue on both sides even at threshold.
 */
export function captured(t, [x, y], output = 'threshold') {
  const site = key(x, y);
  const radius = Math.max(OUTPUTS[output] ?? 0, t.type[site] === 'cavity' ? 1 : 0);
  const out = [];
  for (let k = 0; k < GRID.w * GRID.h; k++) {
    if (!t.mass[k] && t.type[k] !== 'channel') continue;
    if (t.type[k] === 'scar' || t.type[k] === 'cavity' || !t.adj[k].length) continue;
    const [cx, cy] = cellOf(k);
    if (wrapDistance(cx, cy, x, y) <= radius + 1e-9) out.push(k);
  }
  for (const p of t.purkinje || []) if (wrapDistance(p.x, p.y, x, y) <= Math.max(radius, 0.8)) out.push(p.node);
  return out;
}

// ---- surface QRS -------------------------------------------------------------
/** Twelve-lead QRS of an activation: leads[12][ms], onset, end, peak. */
export function qrs(t, { time, parent }) {
  let last = 0;
  for (let k = 0; k < t.size; k++) if (t.mass[k] && Number.isFinite(time[k])) last = Math.max(last, time[k]);
  const len = Math.ceil(last) + 4 * SIGMA + 20;
  const hv = [new Float64Array(len), new Float64Array(len), new Float64Array(len)];
  for (let k = 0; k < t.size; k++) {
    if (!t.mass[k] || !Number.isFinite(time[k])) continue;
    const p = parent[k];
    const dir = p >= 0 ? norm(t.pos[k].map((c, i) => c - t.pos[p][i])) : [0, 0, 0];
    const bin = Math.round(time[k]);
    for (let i = 0; i < 3; i++) hv[i][bin] += t.mass[k] * (dir[i] + TRANSMURAL * t.normal[k][i]);
  }
  const kernel = [];
  for (let d = -3 * SIGMA; d <= 3 * SIGMA; d++) kernel.push(Math.exp(-(d * d) / (2 * SIGMA * SIGMA)));
  const smooth = hv.map((a) => { const o = new Float64Array(len); for (let j = 0; j < len; j++) { let s = 0; kernel.forEach((w, i) => { const q = j + i - 3 * SIGMA; if (q >= 0 && q < len) s += w * a[q]; }); o[j] = s; } return o; });
  const mag = Array.from({ length: len }, (_, j) => Math.hypot(smooth[0][j], smooth[1][j], smooth[2][j]));
  const peak = Math.max(...mag);
  const onset = mag.findIndex((m) => m >= ONSET * peak);
  let end = len - 1;
  while (end > onset && mag[end] < ONSET * peak) end--;
  const leads = LEAD_AXES.map((ax) => Array.from({ length: len }, (_, j) => ax[0] * smooth[0][j] + ax[1] * smooth[1][j] + ax[2] * smooth[2][j]));
  return { leads, onset, end, peak, duration: end - onset };
}

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let sab = 0, sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; sa += da * da; sb += db * db; }
  return sa && sb ? sab / Math.sqrt(sa * sb) : 0;
}

/** Correlation of a paced QRS with the template in every lead, aligned at onset over the template QRS. */
export function compare(template, paced) {
  const span = template.duration + 10;
  const cut = (q, i) => Array.from({ length: span }, (_, j) => q.leads[i][q.onset - 5 + j] ?? 0);
  const perLead = LEADS.map((_, i) => pearson(cut(template, i), cut(paced, i)));
  return { perLead, score: (100 * perLead.reduce((s, r) => s + r, 0)) / perLead.length };
}

// ---- one pace map ------------------------------------------------------------
const cache = new Map();
const cached = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };
const tissueOf = (id, ci) => cached(`t|${id}|${ci}`, () => tissue(id, ci));
const blockOf = (t, tpl) => new Set((tpl?.block || []).map(([x, y]) => key(x, y)));

/** The clinical beat of a scenario. */
export function template(id, templateId = SCENARIOS[id].templates[0].id) {
  return cached(`tpl|${id}|${templateId}`, () => {
    const s = SCENARIOS[id];
    const tpl = s.templates.find((x) => x.id === templateId) || s.templates[0];
    const t = tissueOf(id, s.coupling);
    const beat = spread(t, templateSources(t, tpl), blockOf(t, tpl));
    return { tpl, beat, qrs: qrs(t, beat), tcl: s.entrainment ? cycleLength(t, s) : null };
  });
}

// Reentry cycle: along the circuit channels from E to X, then around the scar back to E.
function cycleLength(t, s) {
  const inside = s.circuit.reduce((sum, [a, b]) => sum + (t.type[key(a, b)] === 'channel' ? t.delay(key(a, b)) : 0), CV);
  const [e, x] = [s.exits.E, s.exits.X].map(([a, b]) => key(a, b));
  const outside = spread(t, [[x, 0]], new Set((s.channels || []).map(([a, b]) => key(a, b)))).time[e];
  return Math.round(inside + outside);
}

/**
 * Pace from a site. opts: output, ci (coupling interval), mode ('sinus':
 * pace mapping; 'vt': pacing during the VT, the functional block of the
 * template circuit in place), fusion (a sinus beat arrives during the paced
 * beat), templateId.
 */
export function paceAt(id, site, { output = 'threshold', ci = SCENARIOS[id].coupling, mode = 'sinus', fusion = false, templateId } = {}) {
  const s = SCENARIOS[id];
  const tp = template(id, templateId);
  const t = tissueOf(id, ci);
  const capture = captured(t, site, output);
  if (!capture.length) return { capture, template: tp, paced: null, score: null, perLead: null, sqrs: null, ppiMinusTcl: null, unrecovered: t.unrecovered };
  const sources = capture.map((k) => [k, LATENCY]);
  if (fusion) for (const [x, y, d] of SINUS.cells) sources.push([key(x, y), LATENCY + SINUS.offset + d]);
  const blocked = mode === 'vt' ? blockOf(t, tp.tpl) : new Set();
  const beat = spread(t, sources, blocked);
  // No QRS when the wave never leaves the captured strand (refractory exit, block).
  const bulk = [...beat.time.keys()].some((k) => t.type[k] === 'wall' && Number.isFinite(beat.time[k]));
  if (!bulk) return { capture: [], template: tp, paced: null, score: null, perLead: null, sqrs: null, ppiMinusTcl: null, unrecovered: t.unrecovered };
  const paced = qrs(t, beat);
  const { perLead, score } = compare(tp.qrs, paced);
  // Purkinje potential under the catheter in the clinical beat: how far it precedes the QRS onset.
  const near = nearestPurkinje(t, site);
  const purkinjeLead = near && wrapDistance(near.x, near.y, ...site) <= 1 ? Math.round(tp.qrs.onset - tp.beat.time[near.node]) : null;
  let ppiMinusTcl = null;
  if (mode === 'vt' && s.circuit) {
    const from = spread(t, capture.map((k) => [k, 0])).time;
    ppiMinusTcl = Math.round(2 * Math.min(...s.circuit.map(([x, y]) => from[key(x, y)])));
  }
  return { capture, template: tp, beat, paced, score, perLead, sqrs: paced.onset, ppiMinusTcl, purkinjeLead, unrecovered: t.unrecovered };
}

/** Match score of every pacing site (the pace map), for the current settings. */
export function scoreMap(id, opts = {}) {
  const k = `map|${id}|${JSON.stringify(opts)}`;
  return cached(k, () => {
    const out = new Map();
    const t = tissueOf(id, opts.ci ?? SCENARIOS[id].coupling);
    for (let c = 0; c < GRID.w * GRID.h; c++) {
      if (t.type[c] === 'scar' || t.type[c] === 'cavity') continue;
      const r = paceAt(id, cellOf(c), opts);
      if (r.score != null) out.set(c, r.score);
    }
    return out;
  });
}
