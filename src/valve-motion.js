/**
 * Valve leaflet motion: semilunar cusps flare about their root centre; AV
 * leaflets swing about their measured annular hinge in the annulus frame.
 */
import { rememberRest } from './chamber-field.js';

// Semilunar cusps open in their own valve frame (the aortic and pulmonary
// roots are tilted): free edges move from the centre toward the sinus wall and
// a little downstream; the attachment at the wall stays put. Lengths are
// fractions of the measured root radius.
const SL_OPEN = 0.78;    // an open free edge reaches this fraction of the root radius
const SL_LIFT = 0.18;    // ...and moves this far downstream along the valve axis

/**
 * Open pose of one cusp vertex.
 * @param {number[]} p rest position [x, y, z]
 * @param {number} opening 0 closed .. 1 open
 * @param {{ center: number[], axis: number[], radius: number }} pose valve frame (axis downstream)
 * @param {number[]} cuspDir unit in-plane direction from the valve centre to this cusp
 */
export function semilunarOffset(p, opening, pose, cuspDir) {
  const k = clamp01(opening);
  if (k === 0) return [p[0], p[1], p[2]];
  const { center: c, axis: n, radius } = pose;
  const r = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const along = r[0] * n[0] + r[1] * n[1] + r[2] * n[2];
  const rad = [r[0] - along * n[0], r[1] - along * n[1], r[2] - along * n[2]];
  const radial = Math.hypot(...rad);
  const w = clamp01(1 - radial / Math.max(radius, 1e-4));
  // Near the centre the radial direction is undefined: lean on the cusp's own direction.
  const dir = [rad[0] + cuspDir[0] * radius * 0.2, rad[1] + cuspDir[1] * radius * 0.2, rad[2] + cuspDir[2] * radius * 0.2];
  const len = Math.hypot(...dir) || 1;
  const out = Math.max(0, SL_OPEN * radius - radial) * w * k / len;
  const lift = SL_LIFT * radius * w * k;
  return [p[0] + dir[0] * out + n[0] * lift, p[1] + dir[1] * out + n[1] * lift, p[2] + dir[2] * out + n[2] * lift];
}

export function writeLeaflet(mesh, opening, pose) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const out = attr.array;
  const cuspDir = mesh.userData.cuspDir;
  const p = [0, 0, 0];
  for (let i = 0; i < rest.length; i += 3) {
    p[0] = rest[i]; p[1] = rest[i + 1]; p[2] = rest[i + 2];
    const next = semilunarOffset(p, opening, pose, cuspDir);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

/** Eigenvector of the smallest eigenvalue of a symmetric 3x3 matrix (Jacobi rotations). */
export function smallestAxis(m) {
  const a = m.map(row => [...row]);
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 30; sweep++) {
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-12) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < 3; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
    }
  }
  const i = [0, 1, 2].reduce((best, k) => (a[k][k] < a[best][best] ? k : best), 0);
  return [v[0][i], v[1][i], v[2][i]];
}

/**
 * Valve frame of a set of semilunar cusps: centre, axis (normal of the cusp
 * disc, pointing away from `upstream`, the ventricle) and root radius; each
 * mesh gets its cusp direction.
 */
export function semilunarPose(meshes, upstream) {
  let n = 0;
  const c = [0, 0, 0];
  for (const mesh of meshes) {
    const rest = mesh.userData.restPosition;
    for (let i = 0; i < rest.length; i += 3) { c[0] += rest[i]; c[1] += rest[i + 1]; c[2] += rest[i + 2]; n++; }
  }
  c[0] /= n; c[1] /= n; c[2] /= n;
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const mesh of meshes) {
    const rest = mesh.userData.restPosition;
    for (let i = 0; i < rest.length; i += 3) {
      const d = [rest[i] - c[0], rest[i + 1] - c[1], rest[i + 2] - c[2]];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) cov[r][k] += d[r] * d[k];
    }
  }
  const axis = smallestAxis(cov);
  if (upstream && (c[0] - upstream.x) * axis[0] + (c[1] - upstream.y) * axis[1] + (c[2] - upstream.z) * axis[2] < 0) axis.forEach((v, k) => { axis[k] = -v; });
  const inPlane = (d) => { const a = d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2]; return [d[0] - a * axis[0], d[1] - a * axis[1], d[2] - a * axis[2]]; };
  let radius = 1e-4;
  for (const mesh of meshes) {
    const rest = mesh.userData.restPosition;
    const m = [0, 0, 0];
    for (let i = 0; i < rest.length; i += 3) {
      const d = inPlane([rest[i] - c[0], rest[i + 1] - c[1], rest[i + 2] - c[2]]);
      radius = Math.max(radius, Math.hypot(...d));
      m[0] += d[0]; m[1] += d[1]; m[2] += d[2];
    }
    const len = Math.hypot(...m) || 1;
    mesh.userData.cuspDir = m.map(v => v / len);
  }
  return { center: c, axis, radius };
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

export function writeAvLeaflet(mesh, opening, frame) {
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

const VALVE_GROUPS = [
  { ids: ['lcc', 'rcc', 'ncc'], kind: 'semilunar', channel: 'semilunarValveOpening', upstream: 'lv' },
  { ids: ['pulmonary-valve'], kind: 'semilunar', channel: 'semilunarValveOpening', upstream: 'rv' },
  { ids: ['mitral'], kind: 'av', channel: 'avValveOpening' },
  { ids: ['tricuspid'], kind: 'av', channel: 'avValveOpening' }
];

/** Leaflet groups of the atlas, measured once, opened every frame from rest. */
export function createValveMotion(meshMap) {
  const valveCache = new Map();
  // Centre of the upstream ventricle (orients the semilunar valve axis downstream).
  const centreOf = (id) => {
    const mesh = (meshMap.get(id) || [])[0];
    if (!mesh) return null;
    mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox;
    return { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
  };

  function valveGroup({ ids, kind, upstream }) {
    const key = ids.join('|');
    if (valveCache.has(key)) return valveCache.get(key);
    const meshes = [];
    for (const id of ids) {
      for (const mesh of meshMap.get(id) || []) {
        if (!rememberRest(mesh)) continue;
        meshes.push(mesh);
      }
    }
    if (!meshes.length) {
      valveCache.set(key, null);
      return null;
    }
    const group = { meshes, frame: null, semilunar: kind === 'semilunar' ? semilunarPose(meshes, centreOf(upstream)) : null };
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
      const pose = valveGroup(group);
      if (!pose) continue;
      const opening = weights[group.channel];
      for (const mesh of pose.meshes) {
        if (group.kind === 'av' && pose.frame) writeAvLeaflet(mesh, opening, pose.frame);
        else if (pose.semilunar) writeLeaflet(mesh, opening, pose.semilunar);
      }
    }
  }

  return { apply: applyValves };
}
