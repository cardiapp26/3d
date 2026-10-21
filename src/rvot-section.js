import * as THREE from 'three';
import { RVOT_SEGMENTS } from './eps/rvot-segments.js';

/*
 * RVOT seen from above (Miyazaki et al., JACC Case Rep 2026;31(36):109418,
 * Fig. 4; Aronis, editorial, ibid. 110024, Fig. 1): the RV outflow vertices
 * get one of six segments, anterior, lateral, posterolateral, posterior and
 * medial free walls around the pulmonary axis and the septal wall next to the
 * LV. Angles are anchored to the atlas's own neighbours: the right coronary
 * aortic sinus direction is the centre of the posterolateral wall and the
 * nearest LAD point the centre of the medial wall, stretched piecewise in
 * between, so the walls face their named neighbours on this heart.
 * Geometric teaching regions from measured landmarks, not segmented tissue.
 */
export const RVOT_SEGMENT_COLORS = Object.freeze({
  anterior: '#8e9bd6', lateral: '#9cc26b', posterolateral: '#d1c25a', posterior: '#a07ac8', medial: '#4fb3a8', septal: '#2f7f86', other: '#6d4a4c'
});
const ARC = Object.fromEntries(RVOT_SEGMENTS.filter((s) => s.level === 'high').map((s) => [s.id, s]));
const centreOf = (id) => ((ARC[id].from + ARC[id].to) / 2) % 360;
const PL_CENTRE = centreOf('posterolateral'), M_CENTRE = centreOf('medial');
export const RVOT_SEPTAL_GAP = 0.32;   // RVOT vertices this close to the LV form the septal wall (as the RV septal region)
export const RVOT_CUT_DEPTH = 0.12;    // cut this far below the pulmonary valve centre, along the outflow axis
export const RVOT_SEPTAL_DEPTH = 0.3;  // the septal wall lies deeper than the encircling free wall (Fig. 4)

const norm = (deg) => ((deg % 360) + 360) % 360;

/**
 * Map a raw angle so `a` lands on `aTo` and `b` on `bTo`, linearly in the arc
 * from a to b (clockwise in raw angle) and over the complementary arc.
 */
export function twoAnchorAngles(a, aTo, b, bTo) {
  const rawSpan = norm(b - a), mapSpan = norm(bTo - aTo);
  return (theta) => {
    const past = norm(theta - a);
    if (past <= rawSpan) return norm(aTo + (past / rawSpan) * mapSpan);
    return norm(bTo + ((past - rawSpan) / (360 - rawSpan)) * (360 - mapSpan));
  };
}

/** High free-wall segment id of an SVG-convention angle (0 patient right, 90 posterior). */
export function freeWallAt(deg) {
  const a = norm(deg);
  for (const seg of RVOT_SEGMENTS) {
    if (seg.level !== 'high') continue;
    const from = norm(seg.from), span = norm(seg.to - seg.from) || 360;
    if (norm(a - from) < span) return seg.id;
  }
  return 'anterior';
}

const vertexAt = (pos, i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
const across = (v, axis) => v.clone().addScaledVector(axis, -v.dot(axis));

/**
 * @param {{ rvGeometry: THREE.BufferGeometry, rvotMask: (i:number)=>boolean, pulmonaryCenter: THREE.Vector3,
 *   rccCenter: THREE.Vector3, ladPoints: THREE.Vector3[], nearLv: (p:THREE.Vector3)=>boolean }} input
 * Frame: world y superior, +z anterior, -x patient right (the atlas frame).
 */
export function rvotSegments({ rvGeometry, rvotMask, pulmonaryCenter, rccCenter, ladPoints, nearLv }) {
  const pos = rvGeometry.attributes.position;
  const centroid = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < pos.count; i++) if (rvotMask(i)) { centroid.add(vertexAt(pos, i)); n++; }
  if (!n) return null;
  centroid.divideScalar(n);
  const axis = pulmonaryCenter.clone().sub(centroid).normalize();           // toward the pulmonary valve
  const anterior = across(new THREE.Vector3(0, 0, 1), axis).normalize();
  const right = across(new THREE.Vector3(-1, 0, 0), axis);
  right.addScaledVector(anterior, -right.dot(anterior)).normalize();
  // SVG convention used by the EPS schematic: 0° patient right, 90° posterior.
  const rawAngle = (p) => {
    const v = across(p.clone().sub(pulmonaryCenter), axis);
    return norm(THREE.MathUtils.radToDeg(Math.atan2(-v.dot(anterior), v.dot(right))));
  };
  const nearestLad = ladPoints.reduce((best, p) => (p.distanceTo(pulmonaryCenter) < best.distanceTo(pulmonaryCenter) ? p : best), ladPoints[0]);
  const plAt = rawAngle(rccCenter), mAt = rawAngle(nearestLad);
  const map = twoAnchorAngles(plAt, PL_CENTRE, mAt, M_CENTRE);
  const ids = [...RVOT_SEGMENTS.map((s) => s.id), 'other'];
  const byVertex = new Int8Array(pos.count).fill(ids.indexOf('other'));
  for (let i = 0; i < pos.count; i++) {
    if (!rvotMask(i)) continue;
    const p = vertexAt(pos, i);
    const depth = -p.clone().sub(pulmonaryCenter).dot(axis) - RVOT_CUT_DEPTH;
    byVertex[i] = ids.indexOf(depth > RVOT_SEPTAL_DEPTH && nearLv(p) ? 'septal' : freeWallAt(map(rawAngle(p))));
  }
  const cutPoint = pulmonaryCenter.clone().addScaledVector(axis, -RVOT_CUT_DEPTH);
  // The outflow runs left posterosuperiorly (Fig. 3); the papers view it from
  // above. Cut and look halfway between the outflow axis and the superior
  // direction, so the ring is seen nearly en face with anterior at the top.
  const view = axis.clone().add(new THREE.Vector3(0, 1, 0)).normalize();
  const viewAnterior = across(new THREE.Vector3(0, 0, 1), view).normalize();
  // Keep everything below the cut (three.js clips the negative side).
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(view.clone().negate(), cutPoint);
  return { ids, byVertex, frame: { axis, view, anterior: viewAnterior, right, centre: pulmonaryCenter.clone(), cutPoint, anchors: { posterolateral: plAt, medial: mAt } }, plane };
}
