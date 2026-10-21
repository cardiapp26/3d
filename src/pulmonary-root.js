import * as THREE from 'three';

/*
 * The atlas pulmonary trunk is a short open tube (6 rings of 23 vertices).
 * Its root ring stops up to about 0.1 unit (4 mm) short of the RV
 * infundibulum, so a crescent of background shows where the trunk meets the
 * RVOT; its distal ring abuts the bifurcation tube (a 12-gon) edge to edge.
 * Both open rings are pushed along the trunk axis so the trunk overlaps
 * its neighbours: the root sinks into the infundibulum, the distal end
 * slides inside the bifurcation. The change fades over the adjacent ring,
 * so the trunk's shape is otherwise untouched. Mutates the geometry once,
 * before any measurement.
 */
export const ROOT_SINK = 0.11;    // about 3.7 mm into the infundibulum: closes the gap (up to 0.1) and stays clear of the PLAX echo plane
export const DISTAL_OVERLAP = 0.06;

/** Open boundary loops of an indexed geometry: arrays of vertex indices. */
export function boundaryLoops(geometry) {
  const idx = geometry.index?.array;
  if (!idx) return [];
  const count = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const u = idx[t + a], v = idx[t + b], key = u < v ? `${u}_${v}` : `${v}_${u}`;
      count.set(key, (count.get(key) || 0) + 1);
    }
  }
  const adj = new Map();
  for (const [key, n] of count) {
    if (n !== 1) continue;
    const [u, v] = key.split('_').map(Number);
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u).push(v); adj.get(v).push(u);
  }
  const seen = new Set(), loops = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = [], stack = [start];
    while (stack.length) {
      const x = stack.pop();
      if (seen.has(x)) continue;
      seen.add(x); loop.push(x); stack.push(...adj.get(x));
    }
    loops.push(loop);
  }
  return loops;
}

const centreOf = (pos, list) => list.reduce((c, i) => c.add(new THREE.Vector3().fromBufferAttribute(pos, i)), new THREE.Vector3()).multiplyScalar(1 / list.length);

/**
 * @param {THREE.Mesh} trunk atlas 'Pulmonary trunk' (geometry in the shared atlas frame)
 * @param {THREE.Vector3} rvCentre RV centre in the same frame (picks the root ring)
 * @returns {{ root: number[], distal: number[], sink: number, overlap: number } | null}
 */
export function seatPulmonaryTrunk(trunk, rvCentre) {
  const geometry = trunk?.geometry;
  const loops = geometry ? boundaryLoops(geometry) : [];
  if (loops.length !== 2 || !rvCentre) return null;
  const pos = geometry.attributes.position;
  const centres = loops.map(l => centreOf(pos, l));
  const r = centres[0].distanceTo(rvCentre) < centres[1].distanceTo(rvCentre) ? 0 : 1;
  const root = centres[r], distal = centres[1 - r];
  const axis = root.clone().sub(distal).normalize();   // trunk axis, toward the RV
  const length = root.distanceTo(distal);
  const fade = length * 0.25;                          // about one ring spacing
  const rootSet = new Set(loops[r]), distalSet = new Set(loops[1 - r]);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const fromRoot = v.clone().sub(root).dot(axis);        // <= 0 inside the trunk, 0 at the root
    const fromDistal = v.clone().sub(distal).dot(axis);    // >= 0 inside the trunk, 0 at the distal end
    // The open rings move whole (a ring may be tilted to the axis); their neighbours follow less.
    const wRoot = rootSet.has(i) ? 1 : THREE.MathUtils.clamp(1 - Math.max(-fromRoot, 0) / fade, 0, 1);
    const wDistal = distalSet.has(i) ? 1 : THREE.MathUtils.clamp(1 - Math.max(fromDistal, 0) / fade, 0, 1);
    v.addScaledVector(axis, ROOT_SINK * wRoot ** 2 - DISTAL_OVERLAP * wDistal ** 2);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return { root: root.toArray(), distal: distal.toArray(), sink: ROOT_SINK, overlap: DISTAL_OVERLAP };
}
