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
const RING_TUBE = 0.012;

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

/** Smooth shading across duplicated atlas vertices without moving any surface point. */
export function smoothLaNormals(geometry) {
  const p = geometry.attributes.position;
  const index = geometry.index;
  const sums = new Map();
  const keys = Array.from({ length: p.count }, (_, i) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map(v => Math.round(v * 1e5)).join(','));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const ids = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j);
    a.fromBufferAttribute(p, ids[0]); b.fromBufferAttribute(p, ids[1]); c.fromBufferAttribute(p, ids[2]);
    const normal = b.sub(a).cross(c.sub(a));
    for (const id of ids) {
      if (!sums.has(keys[id])) sums.set(keys[id], new THREE.Vector3());
      sums.get(keys[id]).add(normal);
    }
  }
  const normals = new Float32Array(p.count * 3);
  keys.forEach((key, i) => sums.get(key).clone().normalize().toArray(normals, i * 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
}

/** Closed LA surface/neck-plane intersection nearest the estimated appendage neck. */
export function laaNeckContour(mesh, { center, axis, radius }) {
  mesh.updateWorldMatrix(true, false);
  const p = mesh.geometry.attributes.position, index = mesh.geometry.index;
  const nodes = new Map();
  const key = point => point.toArray().map(v => Math.round(v * 1e5)).join(',');
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const vertices = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(p, index ? index.getX(i + j) : i + j).applyMatrix4(mesh.matrixWorld));
    const hits = [];
    for (let j = 0; j < 3; j++) {
      const a = vertices[j], b = vertices[(j + 1) % 3];
      const da = a.clone().sub(center).dot(axis), db = b.clone().sub(center).dot(axis);
      if ((da < 0) === (db < 0) || Math.abs(da - db) < 1e-10) continue;
      hits.push(a.clone().lerp(b, da / (da - db)));
    }
    if (hits.length !== 2) continue;
    const [a, b] = hits.map(key);
    if (a === b) continue;
    hits.forEach((point, j) => {
      const id = j ? b : a, neighbor = j ? a : b;
      if (!nodes.has(id)) nodes.set(id, { point, edges: new Set() });
      nodes.get(id).edges.add(neighbor);
    });
  }
  const seen = new Set(), loops = [];
  for (const start of nodes.keys()) {
    if (seen.has(start)) continue;
    const points = [];
    let current = start, previous = null;
    do {
      if (seen.has(current)) break;
      seen.add(current);
      const node = nodes.get(current);
      if (node.edges.size !== 2) break;
      points.push(node.point);
      const next = [...node.edges].find(id => id !== previous);
      previous = current; current = next;
    } while (current !== start);
    if (current !== start || points.length < 8) continue;
    const middle = centroid(points.map(v => v.clone()));
    const extent = Math.max(...points.map(v => v.distanceTo(middle)));
    if (middle.distanceTo(center) < radius * 1.5 && extent < radius * 3 && extent > radius * .4) {
      loops.push({ points, distance: middle.distanceTo(center) });
    }
  }
  return loops.sort((a, b) => a.distance - b.distance)[0]?.points ?? null;
}

/** Schematic orifice ring on the measured appendage neck, registered as `laa`. */
export function addLaaMarker({ meshVertices, getMeshes = () => [], register, parent }) {
  const orifice = laaOrifice(meshVertices('la'));
  if (!orifice) return null;
  const { center, axis, radius, tip } = orifice;
  const u = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0));
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
  u.normalize();
  const w = new THREE.Vector3().crossVectors(axis, u);
  const contour = getMeshes('la')[0] ? laaNeckContour(getMeshes('la')[0], orifice) : null;
  const points = contour || [];
  for (let i = 0; !contour && i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    points.push(center.clone().addScaledVector(u, Math.cos(a) * radius).addScaledVector(w, Math.sin(a) * radius));
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 128, RING_TUBE, 8, true),
    new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide })
  );
  mesh.name = 'Left atrial appendage orifice (schematic ring)';
  mesh.userData = {
    id: 'laa',
    layer: 'chambers',
    provenance: 'schematic',
    sourceName: 'Schematic orifice ring on the measured neck of the atlas LA anterior lobe. The atlas has no separate appendage node.',
    contourMethod: contour ? 'surface-intersection' : 'circular-estimate',
    contour: points.map(point => point.toArray()),
    orifice: center.toArray(),
    axis: axis.toArray(),
    radius,
    tip: tip.toArray()
  };
  parent.add(mesh);
  register(mesh, 'laa');
  return mesh;
}
