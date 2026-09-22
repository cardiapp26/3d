import * as THREE from 'three';

/** Centroid of an array of Vector3. */
export function centroid(points) {
  return points.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / points.length);
}

/**
 * Boundary loops of a mesh: ordered chains of edges referenced by exactly one
 * triangle. Atlas chambers and vessels are open surfaces, so their orifices
 * (valve rims, vein ostia, cut ends) come back as loops of world-space points.
 */
export function boundaryLoops(mesh, minLength = 12) {
  const g = mesh.geometry;
  if (!g.index) return [];
  const idx = g.index.array;
  const edgeCount = new Map();
  for (let i = 0; i < idx.length; i += 3) {
    for (const [a, b] of [[idx[i], idx[i + 1]], [idx[i + 1], idx[i + 2]], [idx[i + 2], idx[i]]]) {
      const k = a < b ? a + '_' + b : b + '_' + a;
      edgeCount.set(k, (edgeCount.get(k) || 0) + 1);
    }
  }
  const adj = new Map();
  for (const [k, c] of edgeCount) {
    if (c !== 1) continue;
    const [a, b] = k.split('_').map(Number);
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(b).push(a);
  }
  const pos = g.attributes.position;
  mesh.updateWorldMatrix(true, false);
  const seen = new Set();
  const loops = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const chain = [];
    let cur = start, prev = -1;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur);
      chain.push(cur);
      const nexts = (adj.get(cur) || []).filter(n => n !== prev && !seen.has(n));
      prev = chain[chain.length - 1];
      cur = nexts[0];
    }
    if (chain.length < minLength) continue;
    const pts = chain.map(i => new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
    loops.push({ pts, center: centroid(pts) });
  }
  return loops;
}

/** The boundary loop of `mesh` whose centroid lies nearest `point`. */
export function nearestLoop(mesh, point) {
  if (!mesh) return null;
  const loops = boundaryLoops(mesh);
  if (!loops.length) return null;
  return loops.reduce((best, l) =>
    l.center.distanceTo(point) < best.center.distanceTo(point) ? l : best);
}

/**
 * The orifice rim two chamber meshes share: the loop pair with the closest
 * centroids. Returns the second mesh's loop points, lightly smoothed
 * (closed moving average) against mesh jaggies.
 */
export function sharedRim(meshA, meshB, maxCenterDist = 0.3) {
  if (!meshA || !meshB) return null;
  const loopsA = boundaryLoops(meshA);
  const loopsB = boundaryLoops(meshB);
  let best = null;
  for (const a of loopsA) for (const b of loopsB) {
    const d = a.center.distanceTo(b.center);
    if (!best || d < best.d) best = { d, loop: b };
  }
  if (!best || best.d > maxCenterDist) return null;
  let pts = best.loop.pts.map(v => v.clone());
  for (let pass = 0; pass < 2; pass++) {
    pts = pts.map((pt, i) => pt.clone().multiplyScalar(2)
      .add(pts[(i - 1 + pts.length) % pts.length])
      .add(pts[(i + 1) % pts.length])
      .multiplyScalar(0.25));
  }
  return pts;
}

/**
 * Best-fit ring normal (Newell's method), oriented along `towardDir`.
 */
export function ringNormal(pts, towardDir) {
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n.x += (a.y - b.y) * (a.z + b.z);
    n.y += (a.z - b.z) * (a.x + b.x);
    n.z += (a.x - b.x) * (a.y + b.y);
  }
  n.normalize();
  if (n.dot(towardDir) < 0) n.negate();
  return n;
}

/**
 * Contact patch between two chamber meshes: vertices of `meshA` lying within
 * `thresh` of `meshB`. For the two atria this is the interatrial septum.
 * Returns the patch points (A side), their centroid and the average A->B
 * direction as the patch normal.
 */
export function contactPatch(meshA, meshB, thresh = 0.12) {
  if (!meshA || !meshB) return null;
  const collect = (mesh, step) => {
    mesh.updateWorldMatrix(true, false);
    const p = mesh.geometry.attributes.position;
    const out = [];
    for (let i = 0; i < p.count; i += step) {
      out.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld));
    }
    return out;
  };
  const A = collect(meshA, 2);
  const B = collect(meshB, 3);
  const points = [];
  const normal = new THREE.Vector3();
  const threshSq = thresh * thresh;
  for (const a of A) {
    let bestSq = Infinity, bestB = null;
    for (const b of B) {
      const d = a.distanceToSquared(b);
      if (d < bestSq) { bestSq = d; bestB = b; }
    }
    if (bestSq < threshSq) {
      points.push(a);
      normal.add(bestB.clone().sub(a));
    }
  }
  if (points.length < 20) return null;
  return { points, centroid: centroid(points), normal: normal.normalize() };
}
