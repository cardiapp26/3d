import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tubeComponents } from './coronary-branches.js';
import { taperedTube } from './coronary-pda.js';

/*
 * The atlas middle cardiac vein runs up the inferior interventricular groove
 * into the coronary sinus; once the sinus is seated on the measured RA
 * ostium (heart.js seatCoronarySinus) its proximal end moves about 1 cm away
 * and the vein would drain nowhere.
 * Anatomically it opens into the coronary sinus just before the CS ostium.
 * Its open end is continued here by a short curved segment of the same
 * calibre that enters the CS lumen at the nearest point of the CS centreline
 * (proximal sinus, near the ostium). The segment is merged into the MCV mesh
 * so it beats, hides and is picked with the vein. Teaching geometry.
 */
export const JOIN_OVERLAP = 0.03;   // the new segment starts this far inside the vein's open end
export const MIN_GAP = 0.04;        // already joined below this end-to-centreline distance

const longest = mesh => {
  const comps = mesh ? tubeComponents(mesh.geometry) : [];
  return comps.length ? comps.reduce((a, b) => (b.rings.length > a.rings.length ? b : a)) : null;
};

/** Mean distance from `centre` to the `count` nearest vertices of the geometry. */
function radiusAt(geometry, centre, count = 12) {
  const pos = geometry.attributes.position, v = new THREE.Vector3(), d = [];
  for (let i = 0; i < pos.count; i++) d.push(v.fromBufferAttribute(pos, i).distanceTo(centre));
  d.sort((a, b) => a - b);
  const near = d.slice(0, count);
  return near.reduce((s, x) => s + x, 0) / near.length;
}

/**
 * @param {THREE.Mesh} mcv atlas middle cardiac vein (baked world geometry)
 * @param {THREE.Mesh} cs atlas coronary sinus
 * @returns {{ from: number[], to: number[], gap: number, radius: number } | null}
 */
export function joinMiddleCardiacVein(mcv, cs) {
  const vein = longest(mcv), sinus = longest(cs);
  if (!vein || !sinus || vein.rings.length < 6) return null;
  const centreline = sinus.rings;
  const nearest = p => centreline.reduce((best, q) => (q.distanceTo(p) < best.distanceTo(p) ? q : best), centreline[0]);
  // The vein end closer to the sinus is its open (draining) end.
  const [first, last] = [vein.rings[0], vein.rings[vein.rings.length - 1]];
  const atEnd = nearest(last).distanceTo(last) <= nearest(first).distanceTo(first);
  const rings = atEnd ? vein.rings : [...vein.rings].reverse();
  const end = rings[rings.length - 1], direction = end.clone().sub(rings[rings.length - 5]).normalize();
  const target = nearest(end), gap = end.distanceTo(target);
  if (gap < MIN_GAP) return null;
  const radius = radiusAt(mcv.geometry, end);
  const start = end.clone().addScaledVector(direction, -JOIN_OVERLAP);
  const control = end.clone().addScaledVector(direction, gap * 0.5);
  const curve = new THREE.QuadraticBezierCurve3(start, control, target);
  // Same calibre at the vein, widening slightly as it opens into the sinus.
  const tube = taperedTube(curve, 24, u => radius * (1 + 0.25 * u));
  tube.deleteAttribute('uv');
  const merged = mergeGeometries([mcv.geometry, tube]);
  if (!merged) return null;
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  mcv.geometry.dispose();
  mcv.geometry = merged;
  return { from: end.toArray(), to: target.toArray(), gap, radius };
}
