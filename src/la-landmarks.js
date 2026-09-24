import * as THREE from 'three';
import { centroid } from './mesh-utils.js';

// The atlas left atrium is one mesh; its appendage is the lobe projecting
// anteriorly from the left half of the chamber. The orifice is measured as
// the narrowest cross-section between the atrial body and the widest part
// of that lobe. The ring drawn there is a schematic marker on measured
// geometry, not a segmented appendage.

const ANTERIOR = new THREE.Vector3(0, 0, 1);
const LEFT = new THREE.Vector3(1, 0, 0);
const SLAB = 0.1;            // slice thickness along the anterior axis (atlas units)
const MIN_SLAB = 12;         // vertices a slice needs to count
const NECK_RATIO = 0.6;      // the neck must be this much narrower than body and lobe
const RING_TUBE = 0.028;

function slices(verts, body, anterior, slab) {
  const bins = new Map();
  for (const v of verts) {
    const d = v.clone().sub(body).dot(anterior);
    const key = Math.floor(d / slab);
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key).push(v);
  }
  return [...bins.entries()]
    .filter(([, list]) => list.length >= MIN_SLAB)
    .sort((a, b) => a[0] - b[0])
    .map(([key, list]) => {
      const box = new THREE.Box3().setFromPoints(list);
      const size = box.getSize(new THREE.Vector3());
      // Cross-section extent in the slice plane (the two axes other than `anterior`).
      const area = Math.abs(anterior.z) > 0.9 ? size.x * size.y : Math.abs(anterior.x) > 0.9 ? size.y * size.z : size.x * size.z;
      return { key, list, area, center: centroid(list.map(v => v.clone())) };
    });
}

/**
 * Orifice of the left atrial appendage on an LA mesh (world-space vertices).
 * @returns {{ center: THREE.Vector3, axis: THREE.Vector3, radius: number, tip: THREE.Vector3 } | null}
 *   null when the left half of the atrium has no anterior lobe.
 */
export function laaOrifice(laVerts, { anterior = ANTERIOR, left = LEFT, slab = SLAB } = {}) {
  if (laVerts.length < 100) return null;
  const body = centroid(laVerts.map(v => v.clone()));
  const lateral = laVerts.map(v => v.clone().sub(body).dot(left));
  const reach = Math.max(...lateral);
  const leftHalf = laVerts.filter((_, i) => lateral[i] > 0.25 * reach);
  const profile = slices(leftHalf, body, anterior, slab);
  if (profile.length < 5) return null;

  // Walk from the anterior tip backwards: the lobe widens, narrows to the
  // neck, then the atrial body widens again. The neck is the narrowest slice
  // of the first such waist that has a wider body behind it.
  const areas = profile.map(s => s.area);
  let neckIndex = -1;
  let anteriorMax = 0;
  for (let i = profile.length - 1; i > 0; i--) {
    anteriorMax = Math.max(anteriorMax, areas[i]);
    if (areas[i] >= NECK_RATIO * anteriorMax) continue;
    let j = i;
    let narrowest = i;
    while (j > 0 && areas[j] < NECK_RATIO * anteriorMax) {
      if (areas[j] < areas[narrowest]) narrowest = j;
      j--;
    }
    const bodyMax = Math.max(...areas.slice(0, j + 1));
    if (areas[narrowest] < NECK_RATIO * bodyMax) {
      neckIndex = narrowest;
      break;
    }
    i = j + 1;
  }
  if (neckIndex < 1 || neckIndex >= profile.length - 1) return null;
  const neck = profile[neckIndex];

  const lobe = centroid(profile.slice(neckIndex + 1).flatMap(s => s.list).map(v => v.clone()));
  const axis = lobe.clone().sub(neck.center).normalize();
  const radius = neck.list.reduce((sum, v) => sum + v.clone().sub(neck.center).projectOnPlane(axis).length(), 0) / neck.list.length;
  return { center: neck.center, axis, radius, tip: profile[profile.length - 1].center };
}

/** Schematic orifice ring on the measured appendage neck, registered as `laa`. */
export function addLaaMarker({ meshVertices, register, parent }) {
  const orifice = laaOrifice(meshVertices('la'));
  if (!orifice) return null;
  const { center, axis, radius, tip } = orifice;
  const u = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0));
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
  u.normalize();
  const w = new THREE.Vector3().crossVectors(axis, u);
  const points = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    points.push(center.clone().addScaledVector(u, Math.cos(a) * radius).addScaledVector(w, Math.sin(a) * radius));
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 64, RING_TUBE, 10, true),
    new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide })
  );
  mesh.name = 'Left atrial appendage orifice (schematic ring)';
  mesh.userData = {
    id: 'laa',
    layer: 'chambers',
    provenance: 'schematic',
    sourceName: 'Schematic orifice ring on the measured neck of the atlas LA anterior lobe. The atlas has no separate appendage node.',
    orifice: center.toArray(),
    axis: axis.toArray(),
    radius,
    tip: tip.toArray()
  };
  parent.add(mesh);
  register(mesh, 'laa');
  return mesh;
}
