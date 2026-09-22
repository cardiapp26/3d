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

/**
 * Trim plane across a vessel at arc distance `keep` from its proximal end.
 * The proximal end is the point of `verts` nearest `origin`; the centerline
 * comes from binning vertices by distance to it. Returns a THREE.Plane whose
 * positive side is the kept (proximal) part, or null if the vessel is
 * already shorter than `keep`.
 */
export function vesselTrimPlane(verts, origin, keep, step = 0.12) {
  if (!verts.length) return null;
  const start = verts.reduce((best, v) => v.distanceTo(origin) < best.distanceTo(origin) ? v : best);
  const bins = new Map();
  for (const v of verts) {
    const k = Math.round(v.distanceTo(start) / step);
    if (!bins.has(k)) bins.set(k, []);
    bins.get(k).push(v);
  }
  const line = [...bins.keys()].sort((a, b) => a - b)
    .filter(k => bins.get(k).length >= 4)
    .map(k => centroid(bins.get(k)));
  if (line.length < 3) return null;
  let arc = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = line[i].distanceTo(line[i - 1]);
    if (arc + seg >= keep) {
      const f = (keep - arc) / seg;
      const point = line[i - 1].clone().lerp(line[i], f);
      const tangent = line[Math.min(i + 1, line.length - 1)].clone().sub(line[Math.max(i - 1, 0)]).normalize();
      const normal = tangent.clone().negate();
      return new THREE.Plane(normal, -normal.dot(point));
    }
    arc += seg;
  }
  return null;
}

/**
 * Inferior caval ostium measured from the right atrium. The atlas ships no
 * IVC mesh and the RA wall has no IVC hole, so the ostium is taken as the
 * posteroinferior RA floor (sinus venarum): centroid of the lowest 12% of RA
 * vertices behind the RA centroid, lifted slightly into the cavity.
 */
export function inferiorCavalOstium(raMesh) {
  if (!raMesh) return null;
  raMesh.updateWorldMatrix(true, false);
  const p = raMesh.geometry.attributes.position;
  const verts = [];
  for (let i = 0; i < p.count; i++) {
    verts.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(raMesh.matrixWorld));
  }
  if (verts.length < 50) return null;
  const center = centroid(verts);
  const ys = verts.map(v => v.y).sort((a, b) => a - b);
  const yCut = ys[Math.floor(ys.length * 0.12)];
  const floor = verts.filter(v => v.y <= yCut && v.z < center.z);
  if (floor.length < 10) return null;
  return centroid(floor).lerp(center, 0.1);
}
