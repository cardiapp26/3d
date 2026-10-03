/*
 * Plane sections of the atlas meshes for the echo module (research/
 * TTE_TEE_ENTEGRASYON_RAPORU.md, section 6A): the imaging plane cuts the
 * current, deformed triangles; the cut segments are joined into contours and
 * each contour is reported as closed or open. The atlas surfaces are open
 * and sometimes double-sheeted, so an open contour is shown as a line, never
 * filled with invented tissue. Coordinates of the result are those of the
 * 2D image: x along the lateral axis (screen right), y along the beam
 * (depth from the transducer). Meshes with a per-vertex part table
 * (`userData.parts`: LV segments, leaflets) give each contour point its part.
 */

const WELD_QUANTUM = 1e4;          // vertices closer than 1e-4 units are one vertex
const welds = new WeakMap();

/** Canonical vertex per position, cached per geometry (topology does not change in the beat). */
function weldOf(key, positions) {
  const cached = welds.get(key);
  if (cached && cached.length === positions.length / 3) return cached;
  const root = new Int32Array(positions.length / 3);
  const seen = new Map();
  for (let i = 0; i < root.length; i++) {
    const k = `${Math.round(positions[3 * i] * WELD_QUANTUM)},${Math.round(positions[3 * i + 1] * WELD_QUANTUM)},${Math.round(positions[3 * i + 2] * WELD_QUANTUM)}`;
    const first = seen.get(k);
    if (first === undefined) { seen.set(k, i); root[i] = i; } else root[i] = first;
  }
  welds.set(key, root);
  return root;
}

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * An orthonormal image frame from a transducer origin, beam direction and a
 * lateral hint (made perpendicular to the beam). All plain [x, y, z] arrays.
 * @returns {{ origin: number[], beam: number[], lateral: number[], normal: number[] }}
 */
export function imageFrame(origin, beam, lateralHint) {
  const b = normalize(beam);
  const along = dot3(lateralHint, b);
  const l = normalize([lateralHint[0] - along * b[0], lateralHint[1] - along * b[1], lateralHint[2] - along * b[2]]);
  return { origin: [...origin], beam: b, lateral: l, normal: cross(b, l) };
}

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function normalize(v) {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

/**
 * Cut one mesh. Returns its segments as pairs of cut-point keys plus the points.
 * @param {{ positions: ArrayLike<number>, index?: ArrayLike<number>|null, matrix?: number[]|null, key?: object }} item
 */
function cutMesh(item, frame) {
  const src = item.positions, m = item.matrix;
  const count = src.length / 3;
  // World positions (the atlas meshes are baked, so the matrix is usually identity).
  let world = src;
  if (m && !isIdentity(m)) {
    world = new Float64Array(src.length);
    for (let i = 0; i < count; i++) {
      const x = src[3 * i], y = src[3 * i + 1], z = src[3 * i + 2];
      world[3 * i] = m[0] * x + m[4] * y + m[8] * z + m[12];
      world[3 * i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
      world[3 * i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    }
  }
  const root = weldOf(item.key || src, src);
  const [ox, oy, oz] = frame.origin, [nx, ny, nz] = frame.normal;
  const dist = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const d = (world[3 * i] - ox) * nx + (world[3 * i + 1] - oy) * ny + (world[3 * i + 2] - oz) * nz;
    dist[i] = d === 0 ? 1e-12 : d;   // a vertex on the plane counts as in front: no degenerate cuts
  }
  const points = new Map();          // edge key -> [x, y] in the image
  const segments = [];
  const parts = item.mesh?.userData?.parts || null;
  const partOf = parts ? new Map() : null;   // edge key -> part name (nearer vertex), or null
  const [lx, ly, lz] = frame.lateral, [bx, by, bz] = frame.beam;
  const cutPoint = (a, b) => {
    const ra = root[a], rb = root[b];
    const key = ra < rb ? `${ra}_${rb}` : `${rb}_${ra}`;
    if (!points.has(key)) {
      const t = dist[a] / (dist[a] - dist[b]);
      const x = world[3 * a] + (world[3 * b] - world[3 * a]) * t - ox;
      const y = world[3 * a + 1] + (world[3 * b + 1] - world[3 * a + 1]) * t - oy;
      const z = world[3 * a + 2] + (world[3 * b + 2] - world[3 * a + 2]) * t - oz;
      points.set(key, [x * lx + y * ly + z * lz, x * bx + y * by + z * bz]);
      if (partOf) { const k = parts.byVertex[t < 0.5 ? a : b]; partOf.set(key, k >= 0 ? parts.names[k] : null); }
    }
    return key;
  };
  const idx = item.index;
  const triangles = idx ? idx.length / 3 : count / 3;
  for (let t = 0; t < triangles; t++) {
    const a = idx ? idx[3 * t] : 3 * t, b = idx ? idx[3 * t + 1] : 3 * t + 1, c = idx ? idx[3 * t + 2] : 3 * t + 2;
    const sa = dist[a] > 0, sb = dist[b] > 0, sc = dist[c] > 0;
    if (sa === sb && sb === sc) continue;
    const cuts = [];
    if (sa !== sb) cuts.push(cutPoint(a, b));
    if (sb !== sc) cuts.push(cutPoint(b, c));
    if (sc !== sa) cuts.push(cutPoint(c, a));
    if (cuts.length === 2 && cuts[0] !== cuts[1]) segments.push(cuts);
  }
  return { points, segments, triangles, partOf };
}

function isIdentity(m) {
  for (let i = 0; i < 16; i++) if (Math.abs(m[i] - (i % 5 === 0 ? 1 : 0)) > 1e-12) return false;
  return true;
}

/** Join segments into chains; a chain whose ends meet is closed. Branch points end chains. */
function joinSegments(points, segments, partOf = null) {
  const links = new Map();
  segments.forEach(([a, b], i) => {
    if (!links.has(a)) links.set(a, []);
    if (!links.has(b)) links.set(b, []);
    links.get(a).push(i); links.get(b).push(i);
  });
  const used = new Uint8Array(segments.length);
  const walk = (start, first) => {
    const chain = [start];
    let at = start, seg = first;
    while (seg !== undefined && !used[seg]) {
      used[seg] = 1;
      const [a, b] = segments[seg];
      at = a === at ? b : a;
      chain.push(at);
      const next = links.get(at);
      if (next.length !== 2) break;             // open end or branch point
      seg = next[0] === seg ? next[1] : next[0];
    }
    return chain;
  };
  const chains = [];
  // Open chains first (from their ends), then the remaining loops.
  for (const [key, list] of links) {
    if (list.length === 2) continue;
    for (const seg of list) if (!used[seg]) chains.push(walk(key, seg));
  }
  segments.forEach(([a], i) => { if (!used[i]) chains.push(walk(a, i)); });
  return chains.map(chain => {
    const closed = chain.length > 3 && chain[0] === chain[chain.length - 1] && links.get(chain[0]).length === 2;
    const pts = chain.map(k => points.get(k));
    let length = 0;
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return partOf ? { points: pts, closed, length, parts: chain.map(k => partOf.get(k) ?? null) } : { points: pts, closed, length };
  });
}

/**
 * Section a list of meshes by the image plane.
 * @param {{ id: string, positions: ArrayLike<number>, index?: ArrayLike<number>|null, matrix?: number[]|null, key?: object }[]} items
 * @param {{ origin: number[], beam: number[], lateral: number[], normal: number[] }} frame
 * @param {{ minLength?: number }} [options] contours shorter than this are dropped (cut noise)
 */
export function sectionMeshes(items, frame, { minLength = 0.01 } = {}) {
  const contours = [];
  const stats = { triangles: 0, segments: 0, closed: 0, open: 0 };
  for (const item of items) {
    const { points, segments, triangles, partOf } = cutMesh(item, frame);
    stats.triangles += triangles;
    stats.segments += segments.length;
    for (const contour of joinSegments(points, segments, partOf)) {
      if (contour.length < minLength) continue;
      contours.push({ id: item.id, ...contour });
      stats[contour.closed ? 'closed' : 'open']++;
    }
  }
  return { contours, structures: summarize(contours), stats };
}

/** Per structure: total length, closed/open counts and the centroid of its longest contour. */
export function summarize(contours) {
  const out = {};
  for (const c of contours) {
    const s = out[c.id] || (out[c.id] = { length: 0, closed: 0, open: 0, centroid: null, longest: 0 });
    s.length += c.length;
    s[c.closed ? 'closed' : 'open']++;
    if (c.length > s.longest) {
      s.longest = c.length;
      const n = c.points.length;
      s.centroid = c.points.reduce((acc, p) => [acc[0] + p[0] / n, acc[1] + p[1] / n], [0, 0]);
    }
  }
  return out;
}
