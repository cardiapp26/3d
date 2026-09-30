import * as THREE from 'three';
import { surface, resample, placeOnSurface } from './atrial-surface.js';

/*
 * Crista terminalis: the muscular ridge on the right atrial endocardium that
 * separates the smooth venous sinus (posterior) from the trabeculated,
 * pectinate part and the appendage (anterior). It starts in front of the
 * superior caval orifice on the septal side, arches anterolaterally around
 * it (the sinus node lies epicardially at this end, in the sulcus
 * terminalis), descends along the lateral wall and fades in front of the
 * inferior caval orifice toward the Eustachian ridge. Placed from measured
 * landmarks of the atlas (the atlas has no separate crista); teaching
 * geometry. Ho and Sánchez-Quintana, PMC4668306; Sánchez-Quintana et al.
 */
const RIDGE_OFFSET = 0.02;     // ridge axis this far into the cavity from the wall
const RADIAL_SEGMENTS = 10;

/** Ridge radius along the crest (t from the septal start to the caval end). */
export function cristaRadius(t) {
  return t < 0.15 ? 0.03 + (0.05 - 0.03) * (t / 0.15) : 0.05 + (0.018 - 0.05) * ((t - 0.15) / 0.85);
}

/** A tube whose radius follows `radiusAt(t)`, oriented by the wall normal at each sample. */
function taperedTube(path, radiusAt) {
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

/**
 * @param {{ raMeshes: THREE.Mesh[], svcMeshes: THREE.Mesh[], ivcOstium: THREE.Vector3 | null }} input
 * @returns {{ geometry: THREE.BufferGeometry, path: THREE.Vector3[], landmarks: Record<string, THREE.Vector3>, sulcus: THREE.Vector3 }}
 */
export function createCristaTerminalis({ raMeshes, svcMeshes, ivcOstium }) {
  const ra = surface(raMeshes);
  const svc = surface(svcMeshes).all;
  if (!ra.inner.length || !svc.length || !ivcOstium) throw new Error('Crista terminalis needs the RA inner wall, the SVC and the IVC ostium');

  // Superior caval orifice: SVC vertices touching the RA; its radius in the horizontal plane.
  const nearRa = svc.filter(v => ra.all.some(w => w.p.distanceToSquared(v.p) < 0.01)).map(v => v.p);
  const junction = nearRa.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(nearRa.length);
  const svcRadius = nearRa.reduce((sum, p) => sum + Math.hypot(p.x - junction.x, p.z - junction.z), 0) / nearRa.length;
  const onRim = (dx, dz) => { const d = Math.hypot(dx, dz); return junction.clone().add(new THREE.Vector3(dx / d * svcRadius, 0, dz / d * svcRadius)); };
  // Atlas axes: +x patient left (septal for the RA), +z anterior.
  const septalStart = onRim(0.5, 1);
  const anterolateral = onRim(-1, 1);

  // Lateral wall at mid height: the most lateral inner wall, at the middle of its front-to-back span.
  const midY = (junction.y + ivcOstium.y) / 2;
  const slab = ra.inner.filter(v => Math.abs(v.p.y - midY) < 0.1);
  const lateralX = Math.min(...slab.map(v => v.p.x));
  const wall = slab.filter(v => v.p.x < lateralX + 0.12);
  const zs = wall.map(v => v.p.z).sort((a, b) => a - b);
  const lateral = new THREE.Vector3(lateralX + 0.02, midY, zs[Math.floor(zs.length / 2)]);

  // Inferior end: in front of the inferior caval orifice, on its lateral side.
  const cavalEnd = ivcOstium.clone().add(new THREE.Vector3(-0.2, 0.08, 0.2));

  const samples = resample([septalStart, anterolateral, lateral, cavalEnd]);
  const path = placeOnSurface(samples, () => ra.inner, RIDGE_OFFSET);
  // Its epicardial counterpart (sulcus terminalis) in the upper third, where
  // Bachmann's inferior right limb heads.
  const upper = path[Math.round(path.length * 0.3)].p;
  const sulcus = ra.outer.reduce((best, v) => (!best || v.p.distanceToSquared(upper) < best.p.distanceToSquared(upper) ? v : best), null).p.clone();

  return {
    geometry: taperedTube(path, cristaRadius),
    path: path.map(s => s.p),
    landmarks: { junction, septalStart, anterolateral, lateral, cavalEnd, ivcOstium: ivcOstium.clone() },
    sulcus,
  };
}
