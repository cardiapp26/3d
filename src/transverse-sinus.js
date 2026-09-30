import * as THREE from 'three';

/*
 * Transverse sinus (report section 13). In the atlas the atria partly enter
 * the aortic root (hundreds of RA vertices lie inside the ascending aorta);
 * in the heart the transverse sinus of the pericardium separates them. At
 * load, before any landmark is measured or any rest pose is kept, atrial
 * vertices inside the aorta (or closer than SINUS_GAP to its wall) are moved
 * radially out to that gap. The aorta itself is not changed.
 */
export const SINUS_GAP = 0.03;

/**
 * Clearance from the ascending aorta: the aorta near its root (descending
 * part excluded) cut into horizontal rings, each with a measured radius per
 * angular sector (the root is not circular: sinuses). Negative inside. The
 * atlas atria interpenetrate the aortic root in places, so the band must not
 * simply take the nearest atrial vertex there.
 * @param {THREE.Vector3[]} aorta world vertices of the aorta
 */
const AORTA_STEP = 0.08, AORTA_SECTORS = 16;
export function aortaClearance(aorta, root) {
  if (!root) return () => Infinity;
  const near = aorta.filter(v => Math.hypot(v.x - root.x, v.z - root.z) < 0.8 && v.y < root.y + 1.2);
  if (!near.length) return () => Infinity;
  const bins = new Map();
  for (const v of near) { const k = Math.round(v.y / AORTA_STEP); (bins.get(k) || bins.set(k, []).get(k)).push(v); }
  const sectorOf = (dx, dz) => Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * AORTA_SECTORS) % AORTA_SECTORS;
  const rings = [...bins.entries()].map(([k, list]) => {
    const c = list.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(list.length);
    const r = new Float32Array(AORTA_SECTORS);
    for (const v of list) { const s = sectorOf(v.x - c.x, v.z - c.z); r[s] = Math.max(r[s], Math.hypot(v.x - c.x, v.z - c.z)); }
    // A sector without vertices takes its neighbours' mean.
    for (let s = 0; s < AORTA_SECTORS; s++) if (!r[s]) r[s] = (r[(s + 1) % AORTA_SECTORS] + r[(s + AORTA_SECTORS - 1) % AORTA_SECTORS]) / 2;
    return { y: k * AORTA_STEP, c, r };
  });
  rings.sort((a, b) => a.y - b.y);
  const yMin = Math.min(...near.map(v => v.y)), yMax = Math.max(...near.map(v => v.y));
  // Continuous in height and angle (linear between rings and between sector
  // centres), so surfaces moved onto it stay smooth.
  const ringAt = y => {
    let i = 0;
    while (i < rings.length - 2 && rings[i + 1].y < y) i++;
    const a = rings[i], b = rings[Math.min(rings.length - 1, i + 1)];
    const t = b.y > a.y ? Math.max(0, Math.min(1, (y - a.y) / (b.y - a.y))) : 0;
    const c = a.c.clone().lerp(b.c, t);
    const radius = angle => {
      const f = ((angle + Math.PI) / (2 * Math.PI)) * AORTA_SECTORS - 0.5;
      const s0 = ((Math.floor(f) % AORTA_SECTORS) + AORTA_SECTORS) % AORTA_SECTORS, s1 = (s0 + 1) % AORTA_SECTORS, u = f - Math.floor(f);
      const at = ring => ring.r[s0] * (1 - u) + ring.r[s1] * u;
      return at(a) * (1 - t) + at(b) * t;
    };
    return { c, radius };
  };
  const clearance = q => {
    if (q.y < yMin || q.y > yMax) return Infinity;
    const ring = ringAt(q.y);
    const dx = q.x - ring.c.x, dz = q.z - ring.c.z;
    return Math.hypot(dx, dz) - ring.radius(Math.atan2(dz, dx));
  };
  clearance.model = { ringAt };
  return clearance;
}

/** Lowest part of the aorta mesh: its root. */
export function aorticRootOf(aortaVerts) {
  const low = aortaVerts.slice().sort((a, b) => a.y - b.y).slice(0, 60);
  return low.length ? low.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(low.length) : null;
}

/**
 * Move atrial vertices out of the ascending aorta (world = local here: the
 * atlas meshes carry identity transforms). Returns { moved, maxShift }.
 * @param {THREE.Mesh[]} atria meshes to separate (RA, LA)
 * @param {THREE.Mesh[]} aorta aorta meshes
 */
export function separateAtriaFromAorta(atria, aorta) {
  const verts = aorta.flatMap(m => { const p = m.geometry.attributes.position; return Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i)); });
  const root = aorticRootOf(verts);
  const clearance = aortaClearance(verts, root);
  const model = clearance.model;
  let moved = 0, maxShift = 0;
  if (!model) return { moved, maxShift };
  const v = new THREE.Vector3();
  for (const mesh of atria) {
    const pos = mesh.geometry.attributes.position;
    const movedHere = [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const c = clearance(v);
      if (!(c < SINUS_GAP)) continue;
      const ring = model.ringAt(v.y), dx = v.x - ring.c.x, dz = v.z - ring.c.z, d = Math.hypot(dx, dz) || 1e-6;
      const shift = SINUS_GAP - c;
      pos.setXYZ(i, v.x + dx / d * shift, v.y, v.z + dz / d * shift);
      movedHere.push(i);
      moved++; maxShift = Math.max(maxShift, shift);
    }
    if (!movedHere.length) continue;
    pos.needsUpdate = true; mesh.geometry.boundingBox = null; mesh.geometry.boundingSphere = null;
    // Moved vertices take normals of the new surface; the rest keep the atlas normals.
    const normal = mesh.geometry.attributes.normal;
    if (normal) {
      const fresh = mesh.geometry.clone(); fresh.computeVertexNormals();
      for (const i of movedHere) normal.setXYZ(i, fresh.attributes.normal.getX(i), fresh.attributes.normal.getY(i), fresh.attributes.normal.getZ(i));
      normal.needsUpdate = true; fresh.dispose();
    }
  }
  return { moved, maxShift };
}
