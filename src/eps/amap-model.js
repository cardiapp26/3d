/*
 * Activation mapping teaching model (pure). Two atria on a pixel grid
 * (right atrium left, left atrium right, joined by Bachmann's bundle and the
 * low septum / CS); holes for the caval veins, the tricuspid and mitral
 * annuli and the pulmonary veins. A wavefront spreads up/down/left/right
 * with a per-pixel conduction time (slower beside scar). Each scenario gives
 * every pixel an activation time in one beat; beats repeat every cycle
 * length (TCL). A reference pixel and a window of interest then assign each
 * sampled pixel a local activation time (LAT): the occurrence of its
 * activation that falls inside the window. That single rule reproduces the
 * classic pitfalls: reference shift in macroreentry, incomplete mapping,
 * a line of block, one wrong point, and windowing when the chamber
 * activation time approaches or exceeds the cycle length.
 * Schematic teaching grid; not an electroanatomical mapping system.
 */

export const GRID = Object.freeze({ w: 30, h: 16 });
export const RA_COLS = 14;   // columns 0..13: right atrium; 14..15: septum; 16..29: left atrium

const key = (x, y) => y * GRID.w + x;
const rect = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };

// Anatomy: holes (not tissue) with labels for the drawing.
export const HOLES = Object.freeze([
  { id: 'svc', label: { tr: 'SVC', en: 'SVC' }, cells: rect(5, 0, 7, 1) },
  { id: 'ivc', label: { tr: 'VCI', en: 'IVC' }, cells: rect(3, 14, 6, 15) },
  { id: 'tv', label: { tr: 'TK', en: 'TV' }, cells: rect(7, 6, 10, 9) },
  { id: 'mv', label: { tr: 'MK', en: 'MV' }, cells: rect(20, 6, 23, 9) },
  { id: 'rspv', label: { tr: 'RSPV', en: 'RSPV' }, cells: rect(17, 0, 18, 1) },
  { id: 'ripv', label: { tr: 'RIPV', en: 'RIPV' }, cells: rect(17, 14, 18, 15) },
  { id: 'lspv', label: { tr: 'LSPV', en: 'LSPV' }, cells: rect(26, 0, 27, 1) },
  { id: 'lipv', label: { tr: 'LIPV', en: 'LIPV' }, cells: rect(26, 14, 27, 15) }
].map(Object.freeze));
// Interatrial septum (columns 14-15) conducts only at Bachmann's bundle (top) and the low septum / CS (bottom).
const SEPTUM = rect(14, 0, 15, 15).filter(([, y]) => !(y <= 2 || y >= 12));
// Cavotricuspid isthmus: the floor between the tricuspid annulus and the IVC.
export const CTI = Object.freeze(rect(7, 10, 7, 13));

// Reference electrode positions (pixels).
export const REFERENCES = Object.freeze({
  'cs-910': { at: [13, 13], label: 'CS 9-10' },
  'cs-56': { at: [20, 13], label: 'CS 5-6' },
  'cs-12': { at: [28, 12], label: 'CS 1-2' },
  crista: { at: [2, 2], label: { tr: 'Krista / SVC', en: 'Crista / SVC' } }
});

/**
 * Scenarios. origin: focal source pixel; cv: ms per pixel; slow: ms per pixel
 * beside scar; scar: blocked patches; line: extra line of block; reentry:
 * macroreentry around the tricuspid annulus started at the CTI and running
 * one way; artifact: the pixel a wrong annotation lands on.
 */
export const SCENARIOS = Object.freeze({
  'focal-ra': { tcl: 330, origin: [2, 3], cv: 4, reference: 'cs-56', artifact: [24, 12] },
  'focal-la': { tcl: 340, origin: [17, 8], cv: 4, reference: 'cs-56', artifact: [2, 12] },
  flutter: { tcl: null, region: 'ra', reentry: { start: [7, 11], blockSide: [[6, 10], [6, 11], [6, 12], [6, 13]] }, cv: 10, reference: 'cs-56', artifact: [24, 3] },
  'focal-cti-line': { tcl: 330, origin: [9, 12], cv: 4, line: CTI, reference: 'cs-56', artifact: [24, 3] },
  'slow-scar': {
    tcl: 280, origin: [11, 1], cv: 8, slow: 30, reference: 'cs-910', artifact: [24, 12],
    scar: [...rect(9, 3, 10, 4), ...rect(24, 10, 25, 12), ...rect(19, 3, 20, 4), ...rect(21, 12, 22, 13)]
  }
});

/** Tissue map of a scenario: blocked cells and per-cell conduction time. */
export function tissue(scenario) {
  const blocked = new Set([...HOLES.flatMap((h) => h.cells), ...SEPTUM, ...(scenario.scar || []), ...(scenario.line || [])].map(([x, y]) => key(x, y)));
  const scar = (scenario.scar || []).map(([x, y]) => key(x, y));
  const delay = new Array(GRID.w * GRID.h).fill(scenario.cv);
  if (scenario.slow) {
    for (const k of scar) {
      const x = k % GRID.w, y = Math.floor(k / GRID.w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < GRID.w && ny < GRID.h) delay[key(nx, ny)] = scenario.slow;
      }
    }
  }
  return { blocked, delay };
}

// Shortest activation times from one source (4-neighbour spread, Dijkstra on a small grid).
function spread({ blocked, delay }, [sx, sy], extraBlocked = new Set()) {
  const time = new Array(GRID.w * GRID.h).fill(Infinity);
  const done = new Set();
  time[key(sx, sy)] = 0;
  for (;;) {
    let best = -1;
    for (let k = 0; k < time.length; k++) if (!done.has(k) && time[k] < Infinity && (best < 0 || time[k] < time[best])) best = k;
    if (best < 0) break;
    done.add(best);
    const x = best % GRID.w, y = Math.floor(best / GRID.w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID.w || ny >= GRID.h) continue;
      const n = key(nx, ny);
      if (blocked.has(n) || extraBlocked.has(n)) continue;
      const t = time[best] + delay[n];
      if (t < time[n]) time[n] = t;
    }
  }
  return time;
}

/**
 * Activation time of every pixel in one beat (ms from the earliest
 * activation), the cycle length and the chamber activation time.
 * @returns {{ time: number[], tcl: number, activation: number, blocked: Set<number> }}
 */
export function activationTimes(id) {
  const scenario = SCENARIOS[id];
  const t = tissue(scenario);
  let time, tcl = scenario.tcl;
  if (scenario.reentry) {
    // Macroreentry: the wave leaves the CTI one way only; the cycle closes when it returns to the other side.
    const side = scenario.reentry.blockSide.map(([x, y]) => key(x, y));
    time = spread(t, scenario.reentry.start, new Set(side));
    // The returning wave reaches the blocked side from the lateral wall: those pixels activate last.
    for (const k of side) {
      const x = k % GRID.w, y = Math.floor(k / GRID.w);
      const west = time[key(x - 1, y)];
      time[k] = Number.isFinite(west) ? west + scenario.cv : Infinity;
    }
    tcl = Math.round(Math.max(...side.map((k) => time[k]).filter(Number.isFinite)) + scenario.cv);
  } else {
    time = spread(t, scenario.origin);
  }
  const finite = time.filter(Number.isFinite);
  return { time, tcl, activation: Math.max(...finite) - Math.min(...finite), blocked: t.blocked };
}

/** Pixels in the mapped region ('ra' or 'both'). */
export function sampledCells({ time }, region = 'both') {
  const out = [];
  for (let k = 0; k < time.length; k++) {
    if (!Number.isFinite(time[k])) continue;
    if (region === 'ra' && k % GRID.w >= RA_COLS) continue;
    out.push(k);
  }
  return out;
}

/**
 * Window presets, relative to the reference (ms).
 * symmetric: +/- half the cycle; dePonti: left edge in mid electrical
 * diastole (null without diastole); mgh: 40 ms before P onset; both last
 * 95 % of the cycle.
 */
export function windowPreset(kind, { time, tcl, activation }, referenceTime) {
  const width = Math.round(tcl * 0.95);
  if (kind === 'symmetric') return { left: -Math.floor(tcl / 2), right: Math.floor(tcl / 2) - 1 };
  if (kind === 'mgh') { const left = Math.round(0 - 40 - referenceTime); return { left, right: left + width }; }
  if (kind === 'dePonti') {
    const diastole = tcl - activation;
    if (diastole <= 0) return null;
    const left = Math.round(activation - tcl + diastole / 2 - referenceTime);
    return { left, right: left + width };
  }
  return null;
}

/**
 * Local activation times of the sampled pixels for a reference and window.
 * The occurrence of each pixel's activation that falls in [left, right]
 * relative to the reference is its LAT; none: not annotated (null); several
 * (window longer than the cycle): the earliest, as a system would.
 */
export function localTimes(at, { reference, left, right, region = 'both', artifact = null }) {
  const [rx, ry] = REFERENCES[reference].at;
  const r = at.time[key(rx, ry)];
  const lat = new Map(), beat = new Map();
  for (const k of sampledCells(at, region)) {
    const own = at.time[k] - r;
    let d = own;
    d -= Math.ceil((d - right) / at.tcl) * at.tcl;           // the latest occurrence not after the right edge
    while (d - at.tcl >= left) d -= at.tcl;                   // the earliest one still inside
    const inside = d >= left && d <= right;
    lat.set(k, inside ? Math.round(d) : null);
    // Which beat the annotated occurrence belongs to: 0 the beat of interest, -1 the previous, +1 the next.
    beat.set(k, inside ? Math.round((d - own) / at.tcl) : null);
  }
  if (artifact) {
    const k = key(...artifact);
    if (lat.has(k)) { lat.set(k, Math.round(left + 8)); beat.set(k, 'artifact'); }   // a blip annotated at the start of the window
  }
  return { lat, beat, referenceTime: r };
}

// Rainbow from earliest to latest; the compressed scale narrows red and widens purple.
export const COLORS = Object.freeze(['#ef4444', '#f97316', '#facc15', '#22c55e', '#22d3ee', '#3b82f6', '#a855f7']);
const EVEN = [1, 2, 3, 4, 5, 6, 7].map((i) => i / 7);
const COMPRESSED = [0.04, 0.16, 0.3, 0.45, 0.6, 0.75, 1];

/** Colour index (0 red ... 6 purple) of a LAT within [min, max]. */
export function colourIndex(lat, min, max, scale = 'even') {
  const edges = scale === 'compressed' ? COMPRESSED : EVEN;
  const f = max > min ? (lat - min) / (max - min) : 0;
  const i = edges.findIndex((e) => f <= e + 1e-9);
  return i < 0 ? 6 : i;
}

/** Map reading: LAT range, red regions (connected), early-meets-late borders. */
export function readMap(lat) {
  const values = [...lat.values()].filter((v) => v != null);
  if (!values.length) return { min: null, max: null, range: 0, redRegions: 0, earlyMeetsLate: 0, unannotated: lat.size };
  const min = Math.min(...values), max = Math.max(...values), range = max - min;
  const red = new Set([...lat].filter(([, v]) => v != null && colourIndex(v, min, max) === 0).map(([k]) => k));
  let regions = 0;
  const seen = new Set();
  for (const k of red) {
    if (seen.has(k)) continue;
    regions++;
    const stack = [k];
    while (stack.length) {
      const c = stack.pop();
      if (seen.has(c)) continue;
      seen.add(c);
      const x = c % GRID.w;
      for (const n of [c + 1, c - 1, c + GRID.w, c - GRID.w]) if (red.has(n) && !seen.has(n) && Math.abs((n % GRID.w) - x) <= 1) stack.push(n);
    }
  }
  // Neighbouring pixels (also across a one-pixel line of block) whose times
  // differ by more than 60 % of the range: early meets late.
  let eml = 0;
  for (const [k, v] of lat) {
    if (v == null) continue;
    const [x, y] = cellOf(k);
    for (const [dx, dy] of [[1, 0], [0, 1], [2, 0], [0, 2]]) {
      if (x + dx >= GRID.w || y + dy >= GRID.h) continue;
      const n = key(x + dx, y + dy), mid = key(x + dx / 2, y + dy / 2);
      if ((dx === 2 || dy === 2) && lat.has(mid)) continue;   // two apart only across a gap
      const w = lat.get(n);
      if (w != null && Math.abs(w - v) > range * 0.6) eml++;
    }
  }
  return { min, max, range, redRegions: regions, earlyMeetsLate: eml, unannotated: values.length < lat.size ? lat.size - values.length : 0 };
}

export const cellOf = (k) => [k % GRID.w, Math.floor(k / GRID.w)];
export const cellKey = key;
