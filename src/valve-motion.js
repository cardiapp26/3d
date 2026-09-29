/**
 * Valve leaflet motion: semilunar cusps flare about their root centre; AV
 * leaflets swing about their measured annular hinge in the annulus frame.
 */
import { rememberRest } from './chamber-field.js';

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

export function writeLeaflet(mesh, opening, center, maxR, kind) {
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
  { ids: ['lcc', 'rcc', 'ncc'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['pulmonary-valve'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['mitral'], kind: 'av', channel: 'avValveOpening' },
  { ids: ['tricuspid'], kind: 'av', channel: 'avValveOpening' }
];

/** Leaflet groups of the atlas, measured once, opened every frame from rest. */
export function createValveMotion(meshMap) {
  const valveCache = new Map();

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

  return { apply: applyValves };
}
