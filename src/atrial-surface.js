import * as THREE from 'three';

/*
 * Atrial surfaces for placed teaching structures (Bachmann's bundle on the
 * epicardium, the crista terminalis on the endocardium). The atlas atria are
 * double-sheeted in places, so vertices are split by facing: normals turned
 * away from the chamber centre are the outer (epicardial) face, the others
 * the inner (endocardial) face, whose normals point into the cavity.
 */
const SURFACE_K = 10;          // local surface: mean of this many nearest vertices
const SAMPLE_STEP = 0.04;
const SMOOTH_PASSES = 6;

/** World vertices with normals; split into outer and inner faces. */
export function surface(meshes) {
  const points = [];
  for (const mesh of meshes) {
    const pos = mesh.geometry?.attributes?.position, nor = mesh.geometry?.attributes?.normal;
    if (!pos || !nor) continue;
    mesh.updateWorldMatrix(true, false);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      points.push({ p: new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld), n: new THREE.Vector3().fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize() });
    }
  }
  const centre = points.reduce((s, v) => s.add(v.p), new THREE.Vector3()).divideScalar(Math.max(1, points.length));
  const outer = [], inner = [];
  for (const v of points) (v.n.dot(v.p.clone().sub(centre)) >= 0 ? outer : inner).push(v);
  return { all: points, outer, inner, centre };
}

export const nearest = (list, point) => {
  let best = null, bd = Infinity;
  for (const v of list) { const d = v.p.distanceToSquared(point); if (d < bd) { bd = d; best = v; } }
  return best;
};

/** Sample the polyline through `points` every SAMPLE_STEP. */
export function resample(points, step = SAMPLE_STEP) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / step));
    for (let k = 0; k < n; k++) out.push(a.clone().lerp(b, k / n));
  }
  out.push(points[points.length - 1].clone());
  return out;
}

/** The local surface at a point: mean position and normal of its nearest vertices in `list`. */
export function localSurface(list, point) {
  const best = [];
  for (const v of list) {
    const d = v.p.distanceToSquared(point);
    if (best.length < SURFACE_K || d < best[best.length - 1].d) {
      best.push({ v, d });
      best.sort((a, b) => a.d - b.d);
      if (best.length > SURFACE_K) best.pop();
    }
  }
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (const { v } of best) { p.add(v.p); n.add(v.n); }
  return { p: p.divideScalar(best.length), n: n.normalize() };
}

/**
 * Place samples on a surface: the local mean of `listAt(i)`, lifted `offset`
 * along its normal (outward on the outer face, into the cavity on the inner
 * face); smoothed along the path and placed again. Ends are held.
 */
export function placeOnSurface(samples, listAt, offset) {
  let pts = samples.map(p => p.clone());
  const place = () => pts.map((p, i) => { const v = localSurface(listAt(i, pts.length), p); return { p: v.p.clone().addScaledVector(v.n, offset), n: v.n.clone() }; });
  let placed = place();
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    pts = placed.map((s, i) => (i === 0 || i === placed.length - 1) ? s.p.clone() : placed[i - 1].p.clone().add(s.p.clone().multiplyScalar(2)).add(placed[i + 1].p).multiplyScalar(0.25));
    placed = place();
  }
  return placed;
}

const RADIAL_SEGMENTS = 10;

/** A tube whose radius follows `radiusAt(t)`, oriented by the wall normal at each sample. */
export function taperedTube(path, radiusAt) {
  const positions = [], indices = [];
  const ring = RADIAL_SEGMENTS + 1;
  let lastB = null;
  path.forEach((s, i) => {
    const prev = path[Math.max(0, i - 1)].p, next = path[Math.min(path.length - 1, i + 1)].p;
    const tangent = next.clone().sub(prev).normalize();
    const n = s.n.clone().projectOnPlane(tangent).normalize();
    const b = new THREE.Vector3().crossVectors(tangent, n).normalize();
    if (lastB && b.dot(lastB) < 0) { b.negate(); n.negate(); }
    lastB = b;
    const r = radiusAt(i / (path.length - 1));
    for (let k = 0; k <= RADIAL_SEGMENTS; k++) {
      const a = (k / RADIAL_SEGMENTS) * Math.PI * 2;
      positions.push(...s.p.clone().addScaledVector(n, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r).toArray());
    }
    if (i < path.length - 1) for (let k = 0; k < RADIAL_SEGMENTS; k++) {
      const a = i * ring + k, c = a + ring;
      indices.push(a, c, a + 1, a + 1, c, c + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
