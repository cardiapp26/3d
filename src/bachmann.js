import * as THREE from 'three';
import { aortaClearance } from './transverse-sinus.js';
import { surface, nearest, resample, placeOnSurface } from './atrial-surface.js';

export { aortaClearance };

/*
 * Bachmann's bundle, placed from measured landmarks of the atlas (report
 * section 13). Reference anatomy: the most superficial myocardial band of the
 * anterosuperior atria; it crosses the anterior interatrial groove behind the
 * ascending aorta, reaches rightward toward the superior cavoatrial junction
 * and the right atrial appendage, and leftward branches around the neck of
 * the left atrial appendage (Ho and Sánchez-Quintana, PMC4668306).
 * Route: right limb start in front of the SVC junction, the groove point
 * (the most anterosuperior RA/LA contact just behind the aortic root), then
 * the LAA neck; every sample sits on the outer (epicardial) atrial surface.
 * The RA endocardial pacing target is a separate point on the inner side.
 * Teaching geometry, not segmented conduction tissue.
 */
const EPI_OFFSET = 0.03;       // band lifted this far off the epicardial surface
const CONTACT = 0.12;          // RA/LA vertices this close form the interatrial junction
const NECK_ARM = 0.4;          // share of the LAA neck contour each arm wraps
const TARGET_DEPTH = 0.03;     // pacing target inside the RA wall's inner surface
const AORTA_MARGIN = 0.1;      // band centre line keeps this clearance from the ascending aorta
const EDGE_MARGIN = 0.07;      // ribbon edges too: the aortic root descends with the AV plane in systole, about 0.05 toward the band
const GROOVE_NEAR_AORTA = 0.3; // groove candidates lie within this of the aortic wall

/**
 * Ribbon lying in the surface: width across the path, in the tangent plane.
 * An edge that would enter the aorta is pulled back toward the centre line.
 */
function ribbon(path, halfWidthAt, positions, indices, clearance = () => Infinity) {
  const base = positions.length / 3;
  let lastAcross = null;
  for (let i = 0; i < path.length; i++) {
    const t = i / (path.length - 1);
    const prev = path[Math.max(0, i - 1)].p, next = path[Math.min(path.length - 1, i + 1)].p;
    const tangent = next.clone().sub(prev).normalize();
    const across = new THREE.Vector3().crossVectors(path[i].n, tangent).normalize();
    // Keep the ribbon from twisting where the surface normal wobbles.
    if (lastAcross && across.dot(lastAcross) < 0) across.negate();
    lastAcross = across;
    for (const side of [-1, 1]) {
      let w = halfWidthAt(t);
      const edge = () => path[i].p.clone().addScaledVector(across, side * w);
      for (let k = 0; k < 8 && clearance(edge()) < EDGE_MARGIN; k++) w *= 0.6;
      positions.push(...edge().toArray());
    }
    if (i < path.length - 1) { const a = base + i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
}

/**
 * @param {(id: string) => THREE.Mesh[]} getMeshes atlas meshes by id (ra, la, svc, aorta)
 * @param {{ center: THREE.Vector3, axis: THREE.Vector3, radius: number }} laaNeck the measured LAA orifice
 * @param {{ saNode?: THREE.Vector3, cristaSulcus?: THREE.Vector3 }} [options] the sinus node,
 *   where the superior right limb ends; the sulcus terminalis over the upper
 *   crista, where the inferior right limb ends
 */
export function createBachmannGeometry(getMeshes, laaNeck, { saNode = null, cristaSulcus = null } = {}) {
  const ra = surface(getMeshes('ra')), la = surface(getMeshes('la'));
  const svc = surface(getMeshes('svc')).all, aorta = surface(getMeshes('aorta')).all;
  if (!ra.outer.length || !la.outer.length) throw new Error('Bachmann illustration requires both atrial meshes');

  // Superior cavoatrial junction: SVC vertices touching the RA.
  const junctionPts = svc.filter(v => nearest(ra.all, v.p).p.distanceTo(v.p) < 0.1).map(v => v.p);
  const junction = junctionPts.length ? junctionPts.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(junctionPts.length) : ra.centre.clone().setY(ra.centre.y + 1);
  // Aortic root: the lowest part of the aorta mesh.
  const aoLow = aorta.slice().sort((a, b) => a.p.y - b.p.y).slice(0, 60).map(v => v.p);
  const aorticRoot = aoLow.length ? aoLow.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(aoLow.length) : null;

  const clearance = aortaClearance(aorta.map(v => v.p), aorticRoot);
  const free = list => list.filter(v => clearance(v.p) >= AORTA_MARGIN);
  const raFree = { ...ra, outer: free(ra.outer) }, laFree = { ...la, outer: free(la.outer) };

  // Anterior interatrial groove: RA/LA outer-surface contacts outside the
  // aorta; of those against the aortic wall (just behind it), the highest:
  // the band runs on the anterosuperior atrial wall, at roof level.
  const contacts = [];
  for (let i = 0; i < raFree.outer.length; i += 2) {
    const v = raFree.outer[i], w = nearest(laFree.outer, v.p);
    if (w && w.p.distanceTo(v.p) < CONTACT) contacts.push(v.p.clone().add(w.p).multiplyScalar(0.5));
  }
  if (!contacts.length) throw new Error('No RA/LA contact found for the interatrial groove');
  const behindAorta = contacts.filter(p => clearance(p) < GROOVE_NEAR_AORTA);
  const groove = (behindAorta.length ? behindAorta : contacts).reduce((best, p) => (p.y > best.y ? p : best));

  // Right limb start: RA outer surface in front of the SVC junction (toward the appendage).
  const start = raFree.outer.filter(v => v.p.distanceTo(junction) < 0.45).reduce((best, v) => (!best || v.p.z > best.p.z ? v : best), null)?.p || junction;

  // LAA neck: a circle around the measured orifice (the surface-cut contour
  // zigzags between wall sheets), entered at the side facing the groove.
  if (!laaNeck?.center) throw new Error('Bachmann illustration requires the LAA orifice');
  const axis = laaNeck.axis.clone().normalize();
  const u = new THREE.Vector3().subVectors(groove, laaNeck.center).projectOnPlane(axis).normalize();
  const w = new THREE.Vector3().crossVectors(axis, u);
  const around = angle => laaNeck.center.clone().addScaledVector(u, Math.cos(angle) * laaNeck.radius * 1.1).addScaledVector(w, Math.sin(angle) * laaNeck.radius * 1.1);
  const neck = around(0);

  // Trunk: superior right limb from the sinus node region (at the SVC
  // junction) on the RA, then across the groove onto the LA.
  const rightPart = resample(saNode && saNode.distanceTo(start) > 0.04 ? [saNode, start, groove] : [start, groove]);
  const leftPart = resample([groove, neck]).slice(1);
  const trunk = placeOnSurface([...rightPart, ...leftPart], i => (i < rightPart.length ? raFree : laFree).outer, EPI_OFFSET);
  // Arms around the LAA neck, both ways from the trunk end.
  const arm = dir => placeOnSurface(Array.from({ length: 13 }, (_, k) => around(dir * NECK_ARM * 2 * Math.PI * k / 12)), () => laFree.outer, EPI_OFFSET);

  // Inferior right limb: from the right limb, around the base of the right
  // atrial appendage toward the terminal crest (the band "embraces" the RAA).
  // RAA tip by the same rule as the RA pacing lead: the most anterior 8 % of
  // the upper 45 % of the RA.
  const ys = ra.outer.map(v => v.p.y).sort((a, b) => a - b);
  const upper = ra.outer.filter(v => v.p.y >= ys[Math.floor(ys.length * 0.55)]);
  const zs = upper.map(v => v.p.z).sort((a, b) => b - a);
  const pouch = upper.filter(v => v.p.z >= zs[Math.floor(zs.length * 0.08)]).map(v => v.p);
  const raaTip = pouch.length ? pouch.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(pouch.length) : null;
  const branchAt = trunk[Math.round(rightPart.length * 0.45)].p;
  const raaBase = cristaSulcus ? cristaSulcus.clone() : raaTip ? raaTip.clone().lerp(branchAt, 0.45).add(new THREE.Vector3(0, -0.3, 0)) : null;
  const inferiorLimb = raaBase ? placeOnSurface(resample([branchAt, raaBase]), () => raFree.outer, EPI_OFFSET) : [];

  const positions = [], indices = [];
  ribbon(trunk, t => 0.03 + 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.15)), positions, indices, clearance);
  for (const dir of [1, -1]) ribbon(arm(dir), t => 0.028 * (1 - 0.6 * t), positions, indices, clearance);
  if (inferiorLimb.length > 2) ribbon(inferiorLimb, t => 0.03 * (1 - 0.6 * t), positions, indices, clearance);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // RA endocardial pacing target: under the right limb, near the groove,
  // on the inner face of the RA wall (or, for a single-sheet wall, just
  // inside the outer surface).
  const anchorSample = trunk[Math.max(0, Math.round(rightPart.length * 0.75) - 1)];
  const bandAnchor = anchorSample.p.clone();
  const innerNear = ra.inner.length ? nearest(ra.inner, bandAnchor) : null;
  const target = innerNear && innerNear.p.distanceTo(bandAnchor) < 0.2
    ? innerNear.p.clone().addScaledVector(innerNear.n, TARGET_DEPTH)
    : bandAnchor.clone().addScaledVector(anchorSample.n, -(EPI_OFFSET + 0.065));

  const path = trunk.map(s => s.p);
  return { geometry, target, bandAnchor, landmarks: { junction, groove, start, neck, aorticRoot, saNode, raaTip, raaBase }, path, inferiorLimb: inferiorLimb.map(s => s.p), minAortaClearance: Math.min(...path.map(clearance)) };
}
