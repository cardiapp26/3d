import * as THREE from 'three';

/*
 * Moderator band (septomarginal band): the muscular bundle that leaves the
 * septomarginal trabeculation on the RV septal surface and crosses the cavity
 * to the base of the anterior papillary muscle on the free wall. It carries
 * the right bundle branch, so it runs along the measured RBB path
 * (conduction-paths.js measureRightBundle: septal insertion and papillary
 * base). Teaching geometry; the atlas has no moderator band node.
 * Ho and Nihoyannopoulos, Heart 2006;92(Suppl 1):i2-i13.
 */
const RADIUS = 0.05;          // about 3-4 mm at the atlas scale
const FLARE_SEPTAL = 0.9;     // the septal origin fans out into the trabeculation
const FLARE_PAPILLARY = 0.5;  // ...and the papillary end into the muscle base
const BOW = 0.08;             // the band sags toward the cavity centre
const TUBE_SEGMENTS = 32, RADIAL_SEGMENTS = 12;

/** Radius multiplier along the band (t from the septal insertion to the papillary base). */
export function moderatorRadius(t) {
  return 1 + FLARE_SEPTAL * (1 - t) ** 4 + FLARE_PAPILLARY * t ** 4;
}

/**
 * @param {{ septal: THREE.Vector3, papillary: THREE.Vector3, rvCenter: THREE.Vector3 }} input
 * @returns {{ geometry: THREE.BufferGeometry, path: THREE.Vector3[] }}
 */
export function createModeratorBand({ septal, papillary, rvCenter }) {
  if (!septal || !papillary || !rvCenter) throw new Error('Moderator band needs its septal insertion, the papillary base and the RV centre');
  const mid = septal.clone().lerp(papillary, 0.5);
  mid.add(rvCenter.clone().sub(mid).multiplyScalar(BOW));
  const curve = new THREE.CatmullRomCurve3([septal.clone(), mid, papillary.clone()]);
  const geometry = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, RADIUS, RADIAL_SEGMENTS, false);
  // Scale each ring about the curve to flare the two ends.
  const pos = geometry.attributes.position, ring = RADIAL_SEGMENTS + 1;
  for (let s = 0; s <= TUBE_SEGMENTS; s++) {
    const t = s / TUBE_SEGMENTS, centre = curve.getPointAt(t), k = moderatorRadius(t);
    for (let r = 0; r < ring; r++) {
      const i = s * ring + r;
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).sub(centre).multiplyScalar(k).add(centre);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return { geometry, path: curve.getSpacedPoints(16) };
}
