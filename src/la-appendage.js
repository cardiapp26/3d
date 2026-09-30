import * as THREE from 'three';
import { laaNeckContour, smoothLaNormals, laaOrificeOf } from './la-landmarks.js';
import { nearestLoop } from './mesh-utils.js';
import { surface, taperedTube, resample } from './atrial-surface.js';

/*
 * Left atrial appendage size and the left lateral (Coumadin) ridge.
 *
 * Size: the atlas appendage measures about 51 mm from its neck to the tip
 * (the upper end of the published range, 16 to 51 mm, mean 30; 220 resin
 * casts, Veinot et al. 1997). At the project owner's request (report section
 * 13 follow-up) the lobe beyond the measured neck is scaled toward the neck
 * so its length is near 35 mm. The neck (orifice) itself is unchanged, and
 * the scale grows smoothly from the neck, so there is no crease.
 *
 * Ridge: the fold of the LA wall between the appendage orifice (anterior)
 * and the left pulmonary vein ostia (posterior), on the endocardium; its
 * crest lies midway between the appendage rim and the nearest vein rim.
 */
export const LAA_SCALE = 0.68;
const SCALE_RAMP = 0.25;          // units beyond the neck over which the scale reaches LAA_SCALE
const LOBE_REACH = 0.3;           // a piece beyond the neck reaching this share of the tip depth is lobe
const RIDGE_EXTEND = 0.12;       // ridge continues this far above the superior vein
const RIDGE_OFFSET = 0.015;       // crest this far into the cavity from the wall

const smoothstep = x => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

/**
 * Scale the appendage lobe of an LA geometry (atlas coordinates) toward its
 * neck. Returns what was done, for the record.
 * @param {THREE.Mesh} mesh the LA mesh (atlas coordinates); its orifice is
 *   measured here, before the change, and kept on the mesh (laaOrificeOf)
 */
export function shrinkAppendage(mesh, factor = LAA_SCALE) {
  const geometry = mesh.geometry;
  const pos = geometry.attributes.position;
  const verts = Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
  const found = appendageLobe(mesh, verts);
  if (!found) return null;
  const { orifice, lobe, root, weldCount } = found;
  const { center, axis, tip } = orifice;
  const depth = v => v.clone().sub(center).dot(axis);
  const lengthBefore = Math.max(...[...lobe].map(i => depth(verts[i])));
  let moved = 0;
  for (let i = 0; i < pos.count; i++) {
    if (!lobe.has(root[i])) continue;
    const v = verts[i], s = 1 - (1 - factor) * smoothstep(depth(v) / SCALE_RAMP);
    pos.setXYZ(i, center.x + (v.x - center.x) * s, center.y + (v.y - center.y) * s, center.z + (v.z - center.z) * s);
    moved++;
  }
  pos.needsUpdate = true;
  geometry.boundingBox = null; geometry.boundingSphere = null;
  smoothLaNormals(geometry);
  const after = Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
  const lengthAfter = Math.max(...[...lobe].map(i => depth(after[i])));
  // The kept orifice: same neck, tip moved with the lobe.
  mesh.userData.laaOrifice = { ...orifice, tip: center.clone().add(tip.clone().sub(center).multiplyScalar(factor)) };
  return { factor, moved, lobeShare: lobe.size / weldCount, lengthBefore, lengthAfter };
}

/**
 * The appendage lobe of the LA mesh: the pieces beyond the measured neck
 * plane that reach toward the tip (both leaves of the double-sheeted wall),
 * as welded vertex roots (coincident vertices share one).
 * @param {THREE.Mesh} mesh the LA mesh (atlas coordinates)
 * @param {THREE.Vector3[]} [verts] its vertices, if already read
 * @returns {{ orifice: object, lobe: Set<number>, root: Int32Array, weldCount: number } | null}
 */
export function appendageLobe(mesh, verts = null) {
  const geometry = mesh?.geometry;
  const pos = geometry?.attributes.position, index = geometry?.index;
  if (!pos || !index) return null;
  const points = verts || Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
  const orifice = laaOrificeOf(mesh, points);
  if (!orifice) return null;
  const { center, axis, tip } = orifice;
  const depth = v => v.clone().sub(center).dot(axis);
  // Weld coincident vertices, then flood from the tip over the far side of the neck plane.
  const key = v => `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;
  const weld = new Map(), root = new Int32Array(pos.count);
  points.forEach((v, i) => { const k = key(v); if (!weld.has(k)) weld.set(k, i); root[i] = weld.get(k); });
  const adjacency = new Map();
  const link = (a, b) => { if (!adjacency.has(a)) adjacency.set(a, []); adjacency.get(a).push(b); };
  for (let t = 0; t < index.count; t += 3) {
    const [a, b, c] = [0, 1, 2].map(j => root[index.getX(t + j)]);
    link(a, b); link(a, c); link(b, a); link(b, c); link(c, a); link(c, b);
  }
  // The atlas appendage is double-sheeted (inner and outer leaf, joined only
  // at the neck): each leaf is its own piece beyond the neck plane. Every
  // piece that reaches well past the neck belongs to the lobe; a leaf left
  // out would stay full size around the scaled one (a double contour).
  const lobe = new Set(), seen = new Set();
  for (const [r] of adjacency) {
    if (seen.has(r) || depth(points[r]) <= 0) continue;
    const piece = [r], stack = [r];
    seen.add(r);
    while (stack.length) for (const n of adjacency.get(stack.pop()) || []) if (!seen.has(n) && depth(points[n]) > 0) { seen.add(n); piece.push(n); stack.push(n); }
    if (Math.max(...piece.map(i => depth(points[i]))) > LOBE_REACH * depth(tip)) piece.forEach(i => lobe.add(i));
  }
  return { orifice, lobe, root, weldCount: weld.size };
}

/**
 * The left lateral (Coumadin) ridge on the LA endocardium.
 * @param {{ laMesh: THREE.Mesh, veins: THREE.Mesh[] }} input `veins`: pulmonary vein meshes (named by vein)
 * @returns {{ geometry: THREE.BufferGeometry, path: THREE.Vector3[], veins: string[] } | null}
 */
export function createCoumadinRidge({ laMesh, veins }) {
  const laVerts = surface([laMesh]);
  const orifice = laaOrificeOf(laMesh, laVerts.all.map(v => v.p));
  const contour = orifice && laaNeckContour(laMesh, orifice);
  if (!contour) return null;
  const laCentre = laVerts.centre;
  // Left veins, top to bottom (superior first).
  const leftVeins = veins.filter(m => /left (superior|inferior)/i.test(m.name))
    .map(m => ({ mesh: m, rim: nearestLoop(m, laCentre) })).filter(v => v.rim)
    .sort((a, b) => b.rim.center.y - a.rim.center.y);
  if (!leftVeins.length) return null;
  // For each vein: the closest pair of appendage-rim and vein-rim points;
  // the crest is midway. The ridge runs from just above the superior vein
  // down past the inferior one, along the wall between them and the orifice.
  const mids = leftVeins.map(({ rim }) => {
    let best = null;
    for (const a of contour) for (const b of rim.pts) { const d = a.distanceToSquared(b); if (!best || d < best.d) best = { a, b, d }; }
    return best.a.clone().lerp(best.b, 0.5);
  });
  const up = new THREE.Vector3(0, 1, 0);
  const crest = [mids[0].clone().addScaledVector(up, RIDGE_EXTEND), ...mids, mids[mids.length - 1].clone().addScaledVector(up, -RIDGE_EXTEND * 0.5)];
  // Onto the endocardium: from the LA centre toward each crest sample, the
  // first wall hit (exact triangle, not a vertex average); smoothed, placed again.
  const raycaster = new THREE.Raycaster();
  const side = laMesh.material.side;
  laMesh.material.side = THREE.DoubleSide;
  const toWall = q => {
    const dir = q.clone().sub(laCentre).normalize();
    raycaster.set(laCentre, dir);
    const hit = raycaster.intersectObject(laMesh, false)[0];
    return hit ? { p: hit.point.clone().addScaledVector(dir, -RIDGE_OFFSET), n: dir.clone().negate() } : { p: q.clone(), n: dir.clone().negate() };
  };
  let pts = resample(crest, 0.03);
  let placed = pts.map(toWall);
  for (let pass = 0; pass < 4; pass++) {
    pts = placed.map((s, i) => (i === 0 || i === placed.length - 1) ? s.p.clone() : placed[i - 1].p.clone().add(s.p.clone().multiplyScalar(2)).add(placed[i + 1].p).multiplyScalar(0.25));
    placed = pts.map(toWall);
  }
  laMesh.material.side = side;
  const path = placed;
  return {
    geometry: taperedTube(path, t => 0.02 + 0.018 * Math.sin(Math.PI * t)),
    path: path.map(s => s.p),
    veins: leftVeins.map(v => v.mesh.name),
  };
}
