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
 * Local frame of a valve annulus: rim centroid, ring normal pointing toward
 * `towardPoint` (the ventricle), an in-plane basis and the mean rim radius.
 * Leaflet depth below the annulus is measured along `normal`.
 */
export function annulusFrame(rim, towardPoint) {
  const center = centroid(rim.map(point => point.clone()));
  const normal = ringNormal(rim, towardPoint.clone().sub(center));
  const u = rim[0].clone().sub(center).projectOnPlane(normal).normalize();
  const w = new THREE.Vector3().crossVectors(normal, u);
  const radius = rim.reduce((sum, point) => sum + point.distanceTo(center), 0) / rim.length;
  return { center, normal, u, w, radius };
}

/** A world point in annulus coordinates: in-plane x/y and depth d toward the ventricle. */
export function toFrame(frame, point) {
  const v = point.clone().sub(frame.center);
  return { x: v.dot(frame.u), y: v.dot(frame.w), d: v.dot(frame.normal) };
}

/** Inverse of toFrame. */
export function fromFrame(frame, x, y, d) {
  return frame.center.clone()
    .addScaledVector(frame.u, x)
    .addScaledVector(frame.w, y)
    .addScaledVector(frame.normal, d);
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
 * Interventricular septum as RV/LV cavity vertex pairs: each RV vertex with
 * an LV vertex within `maxThickness` spans the septum from its RV side to its
 * LV side. `d` is the local septal thickness.
 */
export function septalPairs(rvVerts, lvVerts, maxThickness = 0.35) {
  const pairs = [];
  const maxSq = maxThickness * maxThickness;
  for (let i = 0; i < rvVerts.length; i += 2) {
    const v = rvVerts[i];
    let best = null;
    let bestD = Infinity;
    for (let j = 0; j < lvVerts.length; j += 3) {
      const d = v.distanceToSquared(lvVerts[j]);
      if (d < bestD) { bestD = d; best = lvVerts[j]; }
    }
    if (bestD < maxSq) pairs.push({ rvSide: v, lvSide: best, d: Math.sqrt(bestD) });
  }
  return pairs;
}

/** The septal pair whose RV side lies nearest `target`. */
export function septalSiteNear(pairs, target) {
  if (!pairs.length) return null;
  return pairs.reduce((b, o) => (o.rvSide.distanceTo(target) < b.rvSide.distanceTo(target) ? o : b));
}

/**
 * Distal (branching) His bundle on the crest of the muscular septum, just
 * under the membranous septum: the mid-septal point nearest the NCC/RCC
 * commissure among points 1-2 cm from the compact AV node where the septum is
 * muscular (at least ~6 mm thick). Lengths are atlas units (the normalized
 * atlas has ~3.7 cm per unit, from its measured AV annuli).
 */
export function hisBundleEnd(pairs, avNode, commissure, { minReach = 0.27, maxReach = 0.54, minThickness = 0.16 } = {}) {
  let best = null;
  let bestD = Infinity;
  for (const pair of pairs) {
    if (pair.d < minThickness) continue;
    const mid = pair.rvSide.clone().lerp(pair.lvSide, 0.5);
    const reach = mid.distanceTo(avNode);
    if (reach < minReach || reach > maxReach) continue;
    const d = mid.distanceTo(commissure);
    if (d < bestD) { bestD = d; best = mid; }
  }
  return best;
}

/**
 * Measured centerline of a tubular vessel mesh, proximal to distal. The
 * proximal end is the vertex nearest `origin`; wall vertices are binned into
 * shells by distance from it and each shell's centroid is one lumen point.
 */
export function vesselCenterline(verts, origin, step = 0.12, minCount = 4) {
  if (!verts.length) return [];
  const start = verts.reduce((best, v) => v.distanceTo(origin) < best.distanceTo(origin) ? v : best);
  const bins = new Map();
  for (const v of verts) {
    const k = Math.round(v.distanceTo(start) / step);
    if (!bins.has(k)) bins.set(k, []);
    bins.get(k).push(v);
  }
  return [...bins.keys()].sort((a, b) => a - b)
    .filter(k => bins.get(k).length >= minCount)
    .map(k => centroid(bins.get(k)));
}

/**
 * Typical radius of a tube mesh: median radius of its open-end loops (tube
 * cross-sections). Long loops are seams or cut edges, not cross-sections.
 */
export function tubeRadius(mesh, fallback = 0.04) {
  const loops = boundaryLoops(mesh, 4).filter(l => l.pts.length <= 48);
  if (!loops.length) return fallback;
  const radii = loops
    .map(l => l.pts.reduce((s, p) => s + p.distanceTo(l.center), 0) / l.pts.length)
    .sort((a, b) => a - b);
  return radii[Math.floor(radii.length / 2)];
}

function shortestPaths(mesh, startIndex) {
  const position = mesh.geometry.attributes.position;
  const index = mesh.geometry.index.array;
  const count = position.count;
  const neighbors = Array.from({ length: count }, () => []);
  for (let i = 0; i < index.length; i += 3) {
    for (const [a, b] of [[index[i], index[i + 1]], [index[i + 1], index[i + 2]], [index[i + 2], index[i]]]) {
      neighbors[a].push(b);
      neighbors[b].push(a);
    }
  }
  const dist = new Float64Array(count).fill(Infinity);
  const prev = new Int32Array(count).fill(-1);
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  // Binary heap of [distance, vertex].
  const heap = [[0, startIndex]];
  dist[startIndex] = 0;
  const push = item => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, v] = pop();
    if (d > dist[v]) continue;
    pa.fromBufferAttribute(position, v);
    for (const n of neighbors[v]) {
      const nd = d + pa.distanceTo(pb.fromBufferAttribute(position, n));
      if (nd < dist[n]) {
        dist[n] = nd;
        prev[n] = v;
        push([nd, n]);
      }
    }
  }
  return { dist, prev };
}

/**
 * Lumen path through a (possibly branched, curved) tubular vessel mesh, from
 * the end nearest `origin` to the vertex nearest `toward`, or to the most
 * distant end (the longest run of the vessel tree) when `toward` is null.
 * The route follows the surface along mesh edges; each sample is recentred
 * on the centroid of the wall within one diameter, which is the lumen axis.
 * Mesh geometry must be in world space (the atlas meshes are baked).
 */
export function vesselPath(mesh, origin, toward = null, step = 0.06) {
  const position = mesh?.geometry?.attributes?.position;
  if (!position || !mesh.geometry.index) return [];
  const nearestVertex = point => {
    let best = 0;
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      const d = v.fromBufferAttribute(position, i).distanceToSquared(point);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };
  const start = nearestVertex(origin);
  const { dist, prev } = shortestPaths(mesh, start);
  // Atlas vessels can be several disconnected tube pieces: only vertices
  // reachable from the start can end the path.
  let end = start;
  if (toward) {
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < dist.length; i++) {
      if (!Number.isFinite(dist[i])) continue;
      const d = v.fromBufferAttribute(position, i).distanceToSquared(toward);
      if (d < bestD) { bestD = d; end = i; }
    }
  } else {
    for (let i = 0; i < dist.length; i++) if (Number.isFinite(dist[i]) && dist[i] > dist[end]) end = i;
  }
  if (!Number.isFinite(dist[end]) || end === start) return [];
  const chain = [];
  for (let v = end; v !== -1; v = prev[v]) chain.push(new THREE.Vector3().fromBufferAttribute(position, v));
  chain.reverse();
  const samples = [chain[0]];
  let run = 0;
  for (let i = 1; i < chain.length; i++) {
    run += chain[i].distanceTo(chain[i - 1]);
    if (run >= step) { samples.push(chain[i]); run = 0; }
  }
  if (samples[samples.length - 1] !== chain[chain.length - 1]) samples.push(chain[chain.length - 1]);
  const radius = tubeRadius(mesh);
  const v = new THREE.Vector3();
  const wallCentroid = (point, reach) => {
    const reachSq = reach * reach;
    const sum = new THREE.Vector3();
    let n = 0;
    for (let i = 0; i < position.count; i++) {
      if (v.fromBufferAttribute(position, i).distanceToSquared(point) < reachSq) { sum.add(v); n++; }
    }
    return n ? sum.multiplyScalar(1 / n) : point.clone();
  };
  // A sphere around a wall point catches the near side of the neighbouring
  // rings and pulls toward the wall; re-centring on the axis estimate with a
  // smaller sphere takes whole rings symmetrically.
  return samples.map(sample => {
    let center = wallCentroid(sample, 2.2 * radius);
    for (let pass = 0; pass < 2; pass++) center = wallCentroid(center, 1.5 * radius);
    return center;
  });
}

/**
 * Trim plane across a vessel at arc distance `keep` from its proximal end.
 * The proximal end is the point of `verts` nearest `origin`; the centerline
 * comes from binning vertices by distance to it. Returns a THREE.Plane whose
 * positive side is the kept (proximal) part, or null if the vessel is
 * already shorter than `keep`.
 */
export function vesselTrimPlane(verts, origin, keep, step = 0.12) {
  const line = vesselCenterline(verts, origin, step);
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
