import * as THREE from 'three';

// Atlas-anchored teaching geometry, not segmented conduction tissue.
export function createBachmannGeometry(meshVertices) {
  const ra = meshVertices('ra');
  const la = meshVertices('la');
  if (!ra.length || !la.length) throw new Error('Bachmann illustration requires both atrial meshes');
  const rb = new THREE.Box3().setFromPoints(ra);
  const lb = new THREE.Box3().setFromPoints(la);
  const nearest = (vertices, point) => vertices.reduce((best, v) =>
    v.distanceToSquared(point) < best.distanceToSquared(point) ? v : best).clone();
  const bandAnchor = nearest(ra, new THREE.Vector3(rb.max.x, rb.max.y - .35, .05));
  // The atlas has no wall-layer segmentation. This inward offset distinguishes
  // the conceptual endocardial endpoint; it is not a measured wall thickness.
  const target = bandAnchor.clone().addScaledVector(rb.getCenter(new THREE.Vector3()).sub(bandAnchor).normalize(), .065);
  const start = nearest(ra, new THREE.Vector3(rb.getCenter(new THREE.Vector3()).x, target.y, .3));
  const end = nearest(la, new THREE.Vector3(lb.getCenter(new THREE.Vector3()).x + .45, lb.max.y - .2, .45));
  const middle = bandAnchor.clone().lerp(end, .5);
  middle.y += .1;
  const curve = new THREE.CatmullRomCurve3([start, bandAnchor, middle, end]);
  const positions = [], indices = [];
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const width = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
    const halfWidth = .035 + .075 * Math.sin(Math.PI * t);
    for (const side of [-1, 1]) positions.push(...point.clone().addScaledVector(width, side * halfWidth).toArray());
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, target, bandAnchor };
}
