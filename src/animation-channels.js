/**
 * Cardia Animation Channels Controller
 * Deterministic, channel-based anatomical motion synchronized with CardiacCycle.
 * Chamber motion is a schematic volume change. Vertices on the valve plane stay
 * put so leaflet hinges are not pulled off the atlas orifice.
 */

import { CYCLE_SYNC as SYNC } from './cardiac-cycle.js';

/**
 * Computes normalized channel weights (0..1) for any phase in [0, 1).
 * Valve open/close times are the same marks as the ECG (P, QRS, T/S2).
 */
export function computeChannelWeights(phase) {
  const p = ((phase % 1) + 1) % 1;

  // P wave / atrial systole. Contraction ends as the AV valves finish closing.
  let atrialContraction = 0;
  if (p >= SYNC.atrialStart && p < SYNC.atrialEnd) {
    const t = (p - SYNC.atrialStart) / (SYNC.atrialEnd - SYNC.atrialStart);
    atrialContraction = Math.sin(Math.PI * t);
  }

  // QRS starts isovolumetric contraction. Pressure falls back to baseline at S2,
  // the start of isovolumetric relaxation, so the ventricle is relaxed while both valves are shut.
  let ventricularContraction = 0;
  if (p >= SYNC.ivcStart && p < SYNC.ivrStart) {
    if (p < SYNC.ejectionPeak) {
      const t = (p - SYNC.ivcStart) / (SYNC.ejectionPeak - SYNC.ivcStart);
      ventricularContraction = Math.sin((Math.PI / 2) * t);
    } else {
      const t = (p - SYNC.ejectionPeak) / (SYNC.ivrStart - SYNC.ejectionPeak);
      ventricularContraction = Math.cos((Math.PI / 2) * t);
    }
  }

  // AV valves stay shut through isovolumetric contraction, ejection, and isovolumetric relaxation.
  // They reopen only with the next rapid filling, after the cycle wraps.
  let avValveOpening = 0;
  if (p < SYNC.avCloseStart) {
    if (p < SYNC.fillingOpenEnd) {
      avValveOpening = Math.sin((Math.PI / 2) * (p / SYNC.fillingOpenEnd));
    } else {
      avValveOpening = 1;
    }
  } else if (p < SYNC.avClosed) {
    const t = (p - SYNC.avCloseStart) / (SYNC.avClosed - SYNC.avCloseStart);
    avValveOpening = Math.cos((Math.PI / 2) * t);
  }

  // Semilunar valves open after QRS, at ejection, and finish closing at S2 / isovolumetric relaxation.
  let semilunarValveOpening = 0;
  if (p >= SYNC.ejectionStart && p < SYNC.ivrStart) {
    if (p < SYNC.semilunarOpen) {
      const t = (p - SYNC.ejectionStart) / (SYNC.semilunarOpen - SYNC.ejectionStart);
      semilunarValveOpening = Math.sin((Math.PI / 2) * t);
    } else if (p < SYNC.semilunarCloseStart) {
      semilunarValveOpening = 1;
    } else {
      const t = (p - SYNC.semilunarCloseStart) / (SYNC.ivrStart - SYNC.semilunarCloseStart);
      semilunarValveOpening = Math.cos((Math.PI / 2) * t);
    }
  }

  let chordaeTension = 0;
  if (p >= SYNC.avClosed && p < SYNC.ivrStart) {
    chordaeTension = ventricularContraction;
  }

  return {
    phase: p,
    atrialContraction,
    ventricularContraction,
    avValveOpening,
    semilunarValveOpening,
    chordaeTension
  };
}

function rememberRest(mesh) {
  const attr = mesh.geometry?.attributes?.position;
  if (!attr) return null;
  if (!mesh.userData.restPosition) {
    mesh.userData.restPosition = new Float32Array(attr.array);
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    mesh.userData.motion = {
      minY: box.min.y,
      maxY: box.max.y,
      cx: (box.min.x + box.max.x) / 2,
      cz: (box.min.z + box.max.z) / 2
    };
  }
  return attr;
}

export function leafletOffset(x, y, z, opening, center, maxR, kind) {
  const amount = Math.max(0, Math.min(1, opening));
  const dx = x - center.x;
  const dz = z - center.z;
  const radial = Math.hypot(dx, dz);
  const safeR = Math.max(maxR, 1e-4);
  const fromHinge = Math.max(0, 1 - radial / safeR);
  const k = amount * fromHinge * fromHinge;
  const nx = radial > 1e-6 ? dx / radial : 0;
  const nz = radial > 1e-6 ? dz / radial : 0;
  const flare = safeR * (kind === 'semilunar' ? 0.22 : 0.16) * k;
  const yShift = safeR * (kind === 'semilunar' ? 0.06 : -0.1) * k;
  return [x + nx * flare, y + yShift, z + nz * flare];
}

function writeLeaflet(mesh, opening, center, maxR, kind) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const out = attr.array;
  for (let i = 0; i < rest.length; i += 3) {
    const next = leafletOffset(rest[i], rest[i + 1], rest[i + 2], opening, center, maxR, kind);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

// AV leaflets swing about their measured annular hinge, in the annulus frame
// (valves are tilted, so world axes do not describe their motion). Lengths
// are fractions of the measured annulus radius.
const AV_SWING = 0.8;         // open vertex moves toward its hinge side by this fraction of its hinge distance
const AV_DROP = 0.45;         // ...and this fraction deeper into the ventricle
const AV_REACH = 1;           // hinge distance is capped at this (the free edge of a long leaflet)
const AV_BODY_DEPTH = 0.8;    // deeper vertices are chordae, tethered to the papillary tips
const AV_HINGE_DEPTH = 0.25;  // vertices this shallow define a leaflet's hinge side

const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * How far a leaflet vertex swings open, in annulus radii. Like a leaflet
 * rotating on its hinge, the swing grows with distance from the annulus, so
 * the hinge stays put and short leaflets do not swing past the ring. Along the chordae
 * it fades back to none at the papillary tips (the deepest valve vertices).
 */
export function avLeafletWeight(hingeDistance, depth, radius, maxDepth) {
  const reach = Math.min(hingeDistance / radius, AV_REACH);
  const bodyDepth = AV_BODY_DEPTH * radius;
  if (depth <= bodyDepth || maxDepth <= bodyDepth) return reach;
  return reach * (1 - clamp01((depth - bodyDepth) / (maxDepth - bodyDepth)));
}

/** Open pose of one AV leaflet vertex: toward the leaflet's hinge side and into the ventricle. */
export function avLeafletOffset(x, y, z, opening, weight, outward, normal, radius) {
  const k = clamp01(opening) * weight;
  const swing = AV_SWING * radius * k;
  const drop = AV_DROP * radius * k;
  return [
    x + outward.x * swing + normal.x * drop,
    y + outward.y * swing + normal.y * drop,
    z + outward.z * swing + normal.z * drop
  ];
}

/**
 * Per-mesh AV pose: the in-plane direction of the leaflet's hinge side and a
 * swing weight per vertex, measured against the annulus rim and frame.
 */
function avPose(mesh, frame, rim, maxDepth) {
  const rest = mesh.userData.restPosition;
  const { center, normal, radius } = frame;
  const outward = { x: 0, y: 0, z: 0 };
  const depths = new Float32Array(rest.length / 3);
  const hinge = new Float32Array(rest.length / 3);
  for (let i = 0, v = 0; i < rest.length; i += 3, v++) {
    const dx = rest[i] - center.x;
    const dy = rest[i + 1] - center.y;
    const dz = rest[i + 2] - center.z;
    const d = dx * normal.x + dy * normal.y + dz * normal.z;
    depths[v] = d;
    if (d < AV_HINGE_DEPTH * radius) {
      outward.x += dx - d * normal.x;
      outward.y += dy - d * normal.y;
      outward.z += dz - d * normal.z;
    }
    let best = Infinity;
    for (const point of rim) {
      const q = (rest[i] - point.x) ** 2 + (rest[i + 1] - point.y) ** 2 + (rest[i + 2] - point.z) ** 2;
      if (q < best) best = q;
    }
    hinge[v] = Math.sqrt(best);
  }
  const length = Math.hypot(outward.x, outward.y, outward.z);
  if (length > 1e-6) {
    outward.x /= length;
    outward.y /= length;
    outward.z /= length;
  }
  const weights = new Float32Array(depths.length);
  for (let v = 0; v < depths.length; v++) {
    weights[v] = avLeafletWeight(hinge[v], depths[v], radius, maxDepth);
  }
  return { outward, weights };
}

function writeAvLeaflet(mesh, opening, frame) {
  const attr = mesh.geometry.attributes.position;
  const rest = mesh.userData.restPosition;
  const { outward, weights } = mesh.userData.avPose;
  const out = attr.array;
  for (let i = 0, v = 0; i < rest.length; i += 3, v++) {
    const next = avLeafletOffset(rest[i], rest[i + 1], rest[i + 2], opening, weights[v], outward, frame.normal, frame.radius);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

/**
 * The chamber's displacement field at any point (the same law writeChamber
 * applies to the wall), with the valve distance clamped to the chamber so
 * points above the base or below the apex are not overdriven. Continuous in
 * space, so structures inside a cavity can follow it directly.
 */
export function chamberFieldOffset(x, y, z, motion, weight, lockAtMaxY) {
  const { minY, maxY, cx, cz } = motion;
  const height = Math.max(1e-4, maxY - minY);
  const radial = lockAtMaxY ? 0.11 : 0.08;
  const axial = lockAtMaxY ? 0.07 : 0.05;
  const amount = Math.max(0, Math.min(1, weight));
  // Clamp to the chamber's height: the valve distance and the axial lever.
  const yc = Math.max(minY, Math.min(maxY, y));
  const fromValve = lockAtMaxY ? (maxY - yc) / height : (yc - minY) / height;
  const k = amount * fromValve * fromValve;
  return [-(x - cx) * radial * k, (lockAtMaxY ? (maxY - yc) : (minY - yc)) * axial * k, -(z - cz) * radial * k];
}

function writeChamber(mesh, weight, lockAtMaxY, referenceMotion = null) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const { minY, maxY, cx, cz } = referenceMotion || mesh.userData.motion;
  const height = Math.max(1e-4, maxY - minY);
  const out = attr.array;
  const radial = lockAtMaxY ? 0.11 : 0.08;
  const axial = lockAtMaxY ? 0.07 : 0.05;
  const amount = Math.max(0, Math.min(1, weight));
  for (let i = 0; i < rest.length; i += 3) {
    const x = rest[i];
    const y = rest[i + 1];
    const z = rest[i + 2];
    const fromValve = lockAtMaxY ? (maxY - y) / height : (y - minY) / height;
    const k = amount * fromValve * fromValve;
    out[i] = x - (x - cx) * radial * k;
    out[i + 1] = lockAtMaxY ? y + (maxY - y) * axial * k : y + (minY - y) * axial * k;
    out[i + 2] = z - (z - cz) * radial * k;
  }
  attr.needsUpdate = true;
}

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
const OWNER_IDS = ['lv', 'rv', 'la', 'ra'];
const FOLLOWER_IDS = new Set(['mitral-annulus', 'tricuspid-annulus', 'lv-papillary', 'rv-papillary']);
// Anatomical owners: a papillary muscle belongs to its ventricle, an annulus
// to its atrium and ventricle. Others may bind to any chamber.
export const FOLLOWER_OWNERS = {
  'lv-papillary': ['lv'], 'rv-papillary': ['rv'],
  'mitral-annulus': ['la', 'lv'], 'tricuspid-annulus': ['ra', 'rv'],
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
export function bindFollower(owners, follower) {
  const n = owners.length;
  const ownerWorld = owners.map(o => { const w = new Float32Array(o.rest.length); for (let i = 0; i < o.rest.length; i += 3) worldPoint(o.matrix, o.rest[i], o.rest[i + 1], o.rest[i + 2], w, i); return w; });
  const grid = new Map();
  // Numeric cell key (cells within +-1024 of the origin; the heart spans ~30).
  const key = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
  ownerWorld.forEach((w, c) => {
    for (let i = 0; i < w.length; i += 3) {
      const k = key(Math.floor(w[i] / FOLLOW_CELL), Math.floor(w[i + 1] / FOLLOW_CELL), Math.floor(w[i + 2] / FOLLOW_CELL));
      let list = grid.get(k); if (!list) grid.set(k, list = []);
      list.push(c, i);
    }
  });
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
  return { index, weight, owners: n };
}

/** Invert the linear part of a column-major 4x4 matrix (rigid or uniform-scale use). */
function inverseLinear(e) {
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
    const { motion, weight, lock } = follower.field;
    for (let o = 0; o < rest.length; o += 3) {
      const d = chamberFieldOffset(rest[o], rest[o + 1], rest[o + 2], motion, weight(), lock);
      out[o] = rest[o] + d[0]; out[o + 1] = rest[o + 1] + d[1]; out[o + 2] = rest[o + 2] + d[2];
    }
    return;
  }
  const { index, weight, owners: n } = binding;
  const count = rest.length / 3;
  for (let v = 0; v < count; v++) {
    let wx = 0, wy = 0, wz = 0;
    for (let c = 0; c < n; c++) {
      const wt = weight[v * n + c];
      if (!wt) continue;
      const o = owners[c], i = index[v * n + c], e = o.matrix;
      const lx = o.current[i] - o.rest[i], ly = o.current[i + 1] - o.rest[i + 1], lz = o.current[i + 2] - o.rest[i + 2];
      wx += wt * (e[0] * lx + e[4] * ly + e[8] * lz);
      wy += wt * (e[1] * lx + e[5] * ly + e[9] * lz);
      wz += wt * (e[2] * lx + e[6] * ly + e[10] * lz);
    }
    const o = v * 3;
    out[o] = rest[o] + m[0] * wx + m[1] * wy + m[2] * wz;
    out[o + 1] = rest[o + 1] + m[3] * wx + m[4] * wy + m[5] * wz;
    out[o + 2] = rest[o + 2] + m[6] * wx + m[7] * wy + m[8] * wz;
  }
}

/**
 * Creates an anatomical animation channel controller attached to a Heart instance.
 */
const VALVE_GROUPS = [
  { ids: ['lcc', 'rcc', 'ncc'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['pulmonary-valve'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['mitral'], kind: 'av', channel: 'avValveOpening' },
  { ids: ['tricuspid'], kind: 'av', channel: 'avValveOpening' }
];

export function createAnimationChannels({ meshMap }) {
  const valveCache = new Map();
  let followers = null;
  let lastWeights = {};
  const isIdentity = e => e.every((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) < 1e-9);

  // Bound lazily on the first frame, when every mesh (including conduction
  // tracts built after the atlas) exists.
  function followerSetup() {
    if (followers) return followers;
    const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const matrixOf = mesh => { mesh.updateWorldMatrix?.(true, false); return mesh.matrixWorld?.elements?.slice() || IDENTITY.slice(); };
    const owners = [];
    for (const id of OWNER_IDS) {
      const mesh = (meshMap.get(id) || [])[0];
      const attr = mesh && rememberRest(mesh);
      if (attr) owners.push({ mesh, rest: mesh.userData.restPosition, current: attr.array, matrix: matrixOf(mesh) });
    }
    const seen = new Set();
    const ownerIndex = new Map(owners.map((o, i) => [o.mesh.userData.id, i]));
    followers = [];
    for (const list of meshMap.values()) for (const mesh of list) {
      if (!owners.length || seen.has(mesh) || !isSurfaceFollower(mesh.userData) || !mesh.geometry?.attributes?.position) continue;
      seen.add(mesh);
      const attr = rememberRest(mesh);
      const matrix = matrixOf(mesh);
      const follower = { mesh, attr, rest: mesh.userData.restPosition, out: attr.array, matrix, matrixInverse: inverseLinear(matrix), index: mesh.geometry.index?.array, smooth: ['coronaries', 'conduction'].includes(mesh.userData.layer) || !!FOLLOWER_OWNERS[mesh.userData.id], fullAttach: /papillary/.test(mesh.userData.id),
        allowed: FOLLOWER_OWNERS[mesh.userData.id]?.map(id => ownerIndex.get(id)).filter(i => i !== undefined) };
      const ownerId = FOLLOWER_OWNERS[mesh.userData.id]?.[0];
      const owner = follower.fullAttach && owners[ownerIndex.get(ownerId)];
      if (owner && isIdentity(matrix) && isIdentity(owner.matrix)) {
        const lock = ownerId === 'lv' || ownerId === 'rv';
        follower.field = { motion: owner.mesh.userData.motion, lock, weight: () => lastWeights[lock ? 'ventricularContraction' : 'atrialContraction'] || 0 };
        followers.push({ follower, binding: null });
        continue;
      }
      const binding = bindFollower(owners, follower);
      if (binding.weight.some(w => w > 0)) followers.push({ follower, binding });
    }
    followers.owners = owners;
    return followers;
  }

  function applyFollowers() {
    const setup = followerSetup();
    for (const { follower, binding } of setup) {
      writeFollower(follower, binding, setup.owners);
      follower.attr.needsUpdate = true;
    }
  }

  function deform(id, weight, lockAtMaxY) {
    for (const mesh of meshMap.get(id) || []) writeChamber(mesh, weight, lockAtMaxY);
  }

  function valveGroup(ids) {
    const key = ids.join('|');
    if (valveCache.has(key)) return valveCache.get(key);
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    const meshes = [];
    for (const id of ids) {
      for (const mesh of meshMap.get(id) || []) {
        if (!rememberRest(mesh)) continue;
        meshes.push(mesh);
        const box = mesh.geometry.boundingBox;
        minX = Math.min(minX, box.min.x);
        minY = Math.min(minY, box.min.y);
        minZ = Math.min(minZ, box.min.z);
        maxX = Math.max(maxX, box.max.x);
        maxY = Math.max(maxY, box.max.y);
        maxZ = Math.max(maxZ, box.max.z);
      }
    }
    if (!meshes.length) {
      valveCache.set(key, null);
      return null;
    }
    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
    let maxR = 1e-4;
    for (const mesh of meshes) {
      const rest = mesh.userData.restPosition;
      for (let i = 0; i < rest.length; i += 3) {
        const radial = Math.hypot(rest[i] - center.x, rest[i + 2] - center.z);
        if (radial > maxR) maxR = radial;
      }
    }
    const group = { meshes, center, maxR, frame: null };
    // AV valves move in their measured annulus frame when the ring is known.
    const ring = ids.length === 1 ? (meshMap.get(`${ids[0]}-annulus`) || [])[0]?.userData : null;
    if (ring?.frame && ring.rim) {
      const { center: c, normal } = ring.frame;
      let maxDepth = 0;
      for (const mesh of meshes) {
        const rest = mesh.userData.restPosition;
        for (let i = 0; i < rest.length; i += 3) {
          const d = (rest[i] - c.x) * normal.x + (rest[i + 1] - c.y) * normal.y + (rest[i + 2] - c.z) * normal.z;
          if (d > maxDepth) maxDepth = d;
        }
      }
      for (const mesh of meshes) mesh.userData.avPose = avPose(mesh, ring.frame, ring.rim, maxDepth);
      group.frame = ring.frame;
    }
    valveCache.set(key, group);
    return group;
  }

  function applyValves(weights) {
    for (const group of VALVE_GROUPS) {
      const pose = valveGroup(group.ids);
      if (!pose) continue;
      const opening = weights[group.channel];
      for (const mesh of pose.meshes) {
        if (group.kind === 'av' && pose.frame) writeAvLeaflet(mesh, opening, pose.frame);
        else writeLeaflet(mesh, opening, pose.center, pose.maxR, group.kind);
      }
    }
  }

  /**
   * Chamber volume and leaflet pose share computeChannelWeights with the ECG.
   */
  function applyChannels(cycleState) {
    if (!cycleState || cycleState.reducedMotion) {
      reset();
      return;
    }
    const weights = computeChannelWeights(cycleState.phase);
    lastWeights = weights;
    deform('lv', weights.ventricularContraction, true);
    deform('rv', weights.ventricularContraction, true);
    deform('la', weights.atrialContraction, false);
    const laMotion = meshMap.get('la')?.[0]?.userData.motion;
    if (laMotion) for (const marker of meshMap.get('laa') || []) writeChamber(marker, weights.atrialContraction, false, laMotion);
    deform('ra', weights.atrialContraction, false);
    applyFollowers();
    applyValves(weights);
    return weights;
  }

  function restoreMesh(mesh) {
    const attr = mesh.geometry?.attributes?.position;
    const rest = mesh.userData.restPosition;
    if (attr && rest) {
      attr.array.set(rest);
      attr.needsUpdate = true;
    }
    mesh.scale.set(1, 1, 1);
    mesh.position.set(0, 0, 0);
  }

  function reset() {
    for (const id of ['lv', 'rv', 'la', 'laa', 'ra', 'lcc', 'rcc', 'ncc', 'pulmonary-valve', 'mitral', 'tricuspid', 'lv-papillary', 'rv-papillary']) {
      for (const mesh of meshMap.get(id) || []) restoreMesh(mesh);
    }
    for (const { follower } of followers || []) {
      follower.out.set(follower.rest);
      follower.attr.needsUpdate = true;
    }
  }

  return {
    applyChannels,
    computeChannelWeights,
    reset,
    // Bind the surface followers ahead of the first beat (idle time).
    prepare: () => { followerSetup(); },
    followerCount: () => followerSetup().length
  };
}
