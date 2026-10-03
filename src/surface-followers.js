import { fieldTerms, fieldAt, FIELD_TERMS } from './chamber-field.js';

/*
 * Surface followers (report section 12, phase B). Structures lying on or near
 * a chamber (coronary arteries and veins, great-vessel roots, papillary
 * muscles, annuli, conduction markers) are bound once, at rest, to the
 * nearest vertex of up to two chambers. Every frame they take that vertex's
 * current displacement, weighted by distance, starting again from the rest
 * pose so nothing drifts. Within FOLLOW_CONTACT they move fully with the
 * wall; the weight fades to zero at FOLLOW_FADE, so the far aortic arch or a
 * distant pulmonary vein stays still.
 */
export const FOLLOW_CONTACT = 0.15;
export const FOLLOW_FADE = 0.45;
const FOLLOW_CELL = 0.15;
export const OWNER_IDS = ['lv', 'rv', 'la', 'ra'];
const FOLLOWER_IDS = new Set(['mitral-annulus', 'tricuspid-annulus', 'lv-papillary', 'rv-papillary', 'crista-terminalis', 'coumadin-ridge', 'eustachian-valve', 'chiari-network']);
// Anatomical owners: a papillary muscle belongs to its ventricle, an annulus
// to its atrium and ventricle. Others may bind to any chamber.
export const FOLLOWER_OWNERS = {
  'lv-papillary': ['lv'], 'rv-papillary': ['rv'],
  'mitral-annulus': ['la', 'lv'], 'tricuspid-annulus': ['ra', 'rv'],
  'crista-terminalis': ['ra'], 'coumadin-ridge': ['la'], 'eustachian-valve': ['ra'], 'chiari-network': ['ra'],
};

/** Which meshes follow the chamber walls. Leaflets keep their own opening motion. */
export function isSurfaceFollower(userData = {}) {
  if (userData.micro || OWNER_IDS.includes(userData.id) || userData.id === 'laa') return false;
  return FOLLOWER_IDS.has(userData.id) || ['coronaries', 'vessels', 'conduction'].includes(userData.layer);
}

/** Full weight in contact, smooth fade to zero at FOLLOW_FADE. */
export function followWeight(distance) {
  if (distance <= FOLLOW_CONTACT) return 1;
  if (distance >= FOLLOW_FADE) return 0;
  const t = (distance - FOLLOW_CONTACT) / (FOLLOW_FADE - FOLLOW_CONTACT);
  return 1 - t * t * (3 - 2 * t);
}

const worldPoint = (e, x, y, z, out, o) => {
  out[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
  out[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
  out[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
};

const FOLLOW_SMOOTH_STEPS = 6;

/**
 * Bind follower vertices to owner vertices. `owners` are { rest (local),
 * matrix (world elements) }, `follower` is { rest, matrix, index? }. Each
 * vertex keeps, per owner, its nearest owner vertex within FOLLOW_FADE; the
 * owner mix is then smoothed over the follower's own edges (coincident seam
 * vertices welded) so a vessel lying in a groove between two chambers moves
 * as one tube instead of tearing along the groove. Returns flat arrays of
 * length count * owners.length: owner vertex index (-1 unbound) and weight.
 */
// Numeric cell key (cells within +-1024 of the origin; the heart spans ~30).
const cellKey = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);

/** Owner rest vertices in world space, bucketed for nearest queries. Reusable across bindings. */
export function buildOwnerGrid(owners) {
  const ownerWorld = owners.map(o => { const w = new Float32Array(o.rest.length); for (let i = 0; i < o.rest.length; i += 3) worldPoint(o.matrix, o.rest[i], o.rest[i + 1], o.rest[i + 2], w, i); return w; });
  const grid = new Map();
  ownerWorld.forEach((w, c) => {
    for (let i = 0; i < w.length; i += 3) {
      const k = cellKey(Math.floor(w[i] / FOLLOW_CELL), Math.floor(w[i + 1] / FOLLOW_CELL), Math.floor(w[i + 2] / FOLLOW_CELL));
      let list = grid.get(k); if (!list) grid.set(k, list = []);
      list.push(c, i);
    }
  });
  return { ownerWorld, grid };
}

export function bindFollower(owners, follower, prebuilt = buildOwnerGrid(owners)) {
  const n = owners.length;
  const { ownerWorld, grid } = prebuilt;
  const key = cellKey;
  const count = follower.rest.length / 3;
  const index = new Int32Array(count * n).fill(-1);
  const dist = new Float32Array(count * n).fill(Infinity); // squared while scanning
  const p = new Float32Array(3);
  const reach = Math.ceil(FOLLOW_FADE / FOLLOW_CELL);
  const scan = (v, cx, cy, cz, r) => {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      const list = grid.get(key(cx + dx, cy + dy, cz + dz)); if (!list) continue;
      for (let j = 0; j < list.length; j += 2) {
        const c = list[j], i = list[j + 1], w = ownerWorld[c];
        const dx = w[i] - p[0], dy = w[i + 1] - p[1], dz = w[i + 2] - p[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < dist[v * n + c]) { dist[v * n + c] = d; index[v * n + c] = i; }
      }
    }
  };
  for (let v = 0; v < count; v++) {
    worldPoint(follower.matrix, follower.rest[v * 3], follower.rest[v * 3 + 1], follower.rest[v * 3 + 2], p, 0);
    const cx = Math.floor(p[0] / FOLLOW_CELL), cy = Math.floor(p[1] / FOLLOW_CELL), cz = Math.floor(p[2] / FOLLOW_CELL);
    scan(v, cx, cy, cz, 1);
    // Widen only when no allowed owner is in contact: the fade zone. A second
    // owner beyond the first ring would carry a negligible fourth-power share.
    let found = false;
    for (let c = 0; c < n; c++) if (dist[v * n + c] <= FOLLOW_CONTACT * FOLLOW_CONTACT && (!follower.allowed || follower.allowed.includes(c))) found = true;
    if (!found) scan(v, cx, cy, cz, reach);
    for (let c = 0; c < n; c++) {
      const d = Math.sqrt(dist[v * n + c]);
      if (d > FOLLOW_FADE || (follower.allowed && !follower.allowed.includes(c))) { dist[v * n + c] = Infinity; index[v * n + c] = -1; } else dist[v * n + c] = d;
    }
  }
  // Owner mix per vertex (inverse fourth power: the nearer wall dominates),
  // and the overall attachment.
  const mix = new Float32Array(count * n);
  const attach = new Float32Array(count);
  for (let v = 0; v < count; v++) {
    let sum = 0, nearest = Infinity;
    for (let c = 0; c < n; c++) { const d = dist[v * n + c]; if (d === Infinity) continue; const f = 1 / (d ** 4 + 1e-10); mix[v * n + c] = f; sum += f; nearest = Math.min(nearest, d); }
    if (sum > 0) for (let c = 0; c < n; c++) mix[v * n + c] /= sum;
    // Papillary muscles ride their ventricle's field over their whole length.
    attach[v] = nearest === Infinity ? 0 : follower.fullAttach ? 1 : followWeight(nearest);
  }
  // Smooth the mix over the follower's edges (welded by position). Only thin
  // tubes that can lie in a groove need it; great vessels and muscles do not.
  if (follower.smooth && follower.index && follower.index.length) {
    const weld = new Int32Array(count);
    const seen = new Map();
    for (let v = 0; v < count; v++) {
      const k = `${Math.round(follower.rest[v * 3] * 1e4)},${Math.round(follower.rest[v * 3 + 1] * 1e4)},${Math.round(follower.rest[v * 3 + 2] * 1e4)}`;
      if (!seen.has(k)) seen.set(k, v);
      weld[v] = seen.get(k);
    }
    const neighbors = Array.from({ length: count }, () => new Set());
    const tri = follower.index;
    for (let t = 0; t + 2 < tri.length; t += 3) {
      const a = weld[tri[t]], b = weld[tri[t + 1]], c = weld[tri[t + 2]];
      neighbors[a].add(b).add(c); neighbors[b].add(a).add(c); neighbors[c].add(a).add(b);
    }
    const next = new Float32Array(mix.length);
    for (let step = 0; step < FOLLOW_SMOOTH_STEPS; step++) {
      for (let v = 0; v < count; v++) {
        const root = weld[v];
        if (root !== v) continue;
        const list = neighbors[v];
        for (let c = 0; c < n; c++) {
          let acc = 0;
          for (const u of list) acc += mix[u * n + c];
          next[v * n + c] = list.size ? 0.5 * mix[v * n + c] + 0.5 * acc / list.size : mix[v * n + c];
        }
      }
      for (let v = 0; v < count; v++) { const root = weld[v]; for (let c = 0; c < n; c++) mix[v * n + c] = next[root * n + c]; }
    }
  }
  // An owner without a bound vertex cannot contribute; renormalize the rest.
  const weight = new Float32Array(count * n);
  for (let v = 0; v < count; v++) {
    let sum = 0;
    for (let c = 0; c < n; c++) if (index[v * n + c] >= 0) sum += mix[v * n + c];
    if (sum <= 0) continue;
    for (let c = 0; c < n; c++) if (index[v * n + c] >= 0) weight[v * n + c] = attach[v] * mix[v * n + c] / sum;
  }
  // Compact form: only non-zero (owner, vertex, weight) entries per vertex.
  const offsets = new Uint32Array(count + 1);
  let nnz = 0;
  for (let v = 0; v < count; v++) { for (let c = 0; c < n; c++) if (weight[v * n + c] > 0) nnz++; offsets[v + 1] = nnz; }
  const cOwner = new Uint8Array(nnz), cIndex = new Int32Array(nnz), cWeight = new Float32Array(nnz);
  for (let v = 0, k = 0; v < count; v++) for (let c = 0; c < n; c++) if (weight[v * n + c] > 0) { cOwner[k] = c; cIndex[k] = index[v * n + c]; cWeight[k] = weight[v * n + c]; k++; }
  // Vertices with no owner never move; only the others are written per frame.
  const active = new Uint32Array(count);
  let na = 0;
  for (let v = 0; v < count; v++) if (offsets[v + 1] > offsets[v]) active[na++] = v;
  return { index, weight, distance: dist, owners: n, offsets, cOwner, cIndex, cWeight, active: active.subarray(0, na) };
}

/** Invert the linear part of a column-major 4x4 matrix (rigid or uniform-scale use). */
export function inverseLinear(e) {
  const a = e[0], b = e[4], c = e[8], d = e[1], f = e[5], g = e[9], h = e[2], i = e[6], j = e[10];
  const det = a * (f * j - g * i) - b * (d * j - g * h) + c * (d * i - f * h) || 1;
  return [(f * j - g * i) / det, (c * i - b * j) / det, (b * g - c * f) / det,
    (g * h - d * j) / det, (a * j - c * h) / det, (c * d - a * g) / det,
    (d * i - f * h) / det, (b * h - a * i) / det, (a * f - b * d) / det];
}

/**
 * Write one follower frame: rest + sum of weighted owner displacements, the
 * displacement taken in world space and brought back to the follower frame.
 */
export function writeFollower(follower, binding, owners) {
  const { rest, out, matrixInverse: m } = follower;
  if (follower.field) {
    // Inside a cavity: evaluate the owner's field at the vertex itself.
    const field = follower.field, co = field.coefficients(), d = new Float64Array(3);
    if (!field.terms) {
      field.terms = new Float32Array(rest.length / 3 * FIELD_TERMS);
      for (let o = 0, v = 0; o < rest.length; o += 3, v++) fieldTerms(rest[o], rest[o + 1], rest[o + 2], field.frame, field.terms, v * FIELD_TERMS, field.plane);
    }
    for (let o = 0, v = 0; o < rest.length; o += 3, v++) {
      fieldAt(field.terms, v * FIELD_TERMS, co, d);
      out[o] = rest[o] + d[0]; out[o + 1] = rest[o + 1] + d[1]; out[o + 2] = rest[o + 2] + d[2];
    }
    return;
  }
  const { offsets, cOwner, cIndex, cWeight, active } = binding;
  // World displacement of every owner vertex, computed once per frame by the
  // caller (owner.disp) or here when called on its own.
  for (const o of owners) if (owners.stamp === undefined || !o.disp || o.dispStamp !== owners.stamp) ownerDisplacement(o, owners.stamp);
  const identity = follower.identityInverse ??= isIdentityLinear(m);
  const disps = owners.map(o => o.disp);
  for (let a = 0; a < active.length; a++) {
    const v = active[a];
    let wx = 0, wy = 0, wz = 0;
    for (let k = offsets[v], end = offsets[v + 1]; k < end; k++) {
      const d = disps[cOwner[k]], i = cIndex[k], wt = cWeight[k];
      wx += wt * d[i]; wy += wt * d[i + 1]; wz += wt * d[i + 2];
    }
    const o = v * 3;
    if (identity) { out[o] = rest[o] + wx; out[o + 1] = rest[o + 1] + wy; out[o + 2] = rest[o + 2] + wz; continue; }
    out[o] = rest[o] + m[0] * wx + m[1] * wy + m[2] * wz;
    out[o + 1] = rest[o + 1] + m[3] * wx + m[4] * wy + m[5] * wz;
    out[o + 2] = rest[o + 2] + m[6] * wx + m[7] * wy + m[8] * wz;
  }
}

const isIdentityLinear = m => [1, 0, 0, 0, 1, 0, 0, 0, 1].every((x, i) => Math.abs(m[i] - x) < 1e-12);

/** Owner vertex displacement in world space (current - rest through the matrix). */
export function ownerDisplacement(o, stamp) {
  const n = o.rest.length;
  if (!o.disp || o.disp.length !== n) o.disp = new Float32Array(n);
  const e = o.matrix, identity = e[0] === 1 && e[5] === 1 && e[10] === 1 && !e[1] && !e[2] && !e[4] && !e[6] && !e[8] && !e[9];
  for (let i = 0; i < n; i += 3) {
    const lx = o.current[i] - o.rest[i], ly = o.current[i + 1] - o.rest[i + 1], lz = o.current[i + 2] - o.rest[i + 2];
    if (identity) { o.disp[i] = lx; o.disp[i + 1] = ly; o.disp[i + 2] = lz; continue; }
    o.disp[i] = e[0] * lx + e[4] * ly + e[8] * lz;
    o.disp[i + 1] = e[1] * lx + e[5] * ly + e[9] * lz;
    o.disp[i + 2] = e[2] * lx + e[6] * ly + e[10] * lz;
  }
  o.dispStamp = stamp;
}
