import * as THREE from 'three';
import { centroid, ringNormal, sharedRim } from './mesh-utils.js';

// The atlas has no anterior mitral or anterior tricuspid leaflet node.
// These sails close that gap on the measured annular arc the existing
// leaflets do not occupy. They are schematic, not registered anatomy.

function longestSelectedRun(rim, selected) {
  const count = rim.length;
  let bestStart = 0;
  let bestLength = 0;
  let run = 0;
  for (let i = 0; i < count * 2; i++) {
    if (!selected.has(i % count)) {
      run = 0;
      continue;
    }
    run += 1;
    if (run <= count && run > bestLength) {
      bestLength = run;
      bestStart = (i - run + 1 + count) % count;
    }
  }
  if (bestLength < count * 0.2 || bestLength > count * 0.65) return [];
  return Array.from({ length: bestLength }, (_, index) => rim[(bestStart + index) % count]);
}

export function oppositeArc(rim, samples) {
  if (rim.length < 8 || samples.length < 3) return [];
  const center = centroid(rim.map(point => point.clone()));
  const leaflet = centroid(samples.map(point => point.clone()));
  const away = center.clone().sub(leaflet);
  if (away.lengthSq() < 1e-10) return [];
  away.normalize();
  const selected = new Set();
  rim.forEach((point, index) => {
    if (point.clone().sub(center).dot(away) > 0) selected.add(index);
  });
  return longestSelectedRun(rim, selected);
}

export function sailGeometry(arc, coaptation, bulge) {
  const positions = [];
  const push = point => positions.push(point.x, point.y, point.z);
  for (const point of arc) push(point);
  const midStart = arc.length;
  for (const point of arc) push(point.clone().lerp(coaptation, 0.5).add(bulge));
  const tip = positions.length / 3;
  push(coaptation);
  const indices = [];
  for (let i = 0; i < arc.length - 1; i++) {
    indices.push(i, i + 1, midStart + i, midStart + i, i + 1, midStart + i + 1);
    indices.push(midStart + i, midStart + i + 1, tip);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafletSamples(meshes) {
  const samples = [];
  for (const mesh of meshes) {
    const position = mesh.geometry?.attributes?.position;
    if (!position) continue;
    const stride = Math.max(1, Math.floor(position.count / 800));
    for (let i = 0; i < position.count; i += stride) {
      samples.push(new THREE.Vector3().fromBufferAttribute(position, i));
    }
  }
  return samples;
}

function addSail({ rim, samples, id, leaflet, name, sourceName, register, parent }) {
  const center = centroid(rim.map(point => point.clone()));
  const radius = rim.reduce((sum, point) => sum + point.distanceTo(center), 0) / rim.length;
  const arc = oppositeArc(rim, samples);
  if (arc.length < 8) return null;
  const leafletCenter = centroid(samples.map(point => point.clone()));
  const bulge = ringNormal(rim, leafletCenter.clone().sub(center)).multiplyScalar(radius * 0.45);
  const geometry = sailGeometry(arc, center, bulge);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.65,
    metalness: 0,
    side: THREE.DoubleSide
  }));
  mesh.name = name;
  mesh.userData = {
    id,
    leaflet,
    layer: 'valves',
    provenance: 'schematic',
    sourceName
  };
  parent.add(mesh);
  register(mesh, id);
  return mesh;
}

export function addSchematicAvLeaflets({ getMeshes, register, parent }) {
  const created = [];
  const mitralRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]);
  const mitralSamples = leafletSamples(getMeshes('mitral'));
  if (mitralRim && mitralSamples.length) {
    const mesh = addSail({
      rim: mitralRim,
      samples: mitralSamples,
      id: 'mitral',
      leaflet: 'anterior',
      name: 'Anterior mitral leaflet (schematic)',
      sourceName: 'Schematic anterior mitral leaflet on the uncovered measured annular arc. The atlas has no anterior leaflet node.',
      register,
      parent
    });
    if (mesh) created.push(mesh);
  }
  const tricuspidRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);
  const tricuspidSamples = leafletSamples(getMeshes('tricuspid'));
  if (tricuspidRim && tricuspidSamples.length) {
    const mesh = addSail({
      rim: tricuspidRim,
      samples: tricuspidSamples,
      id: 'tricuspid',
      leaflet: 'anterior',
      name: 'Anterior tricuspid leaflet (schematic)',
      sourceName: 'Schematic anterior tricuspid leaflet on the uncovered measured annular arc. The atlas has septal and inferior leaflets only.',
      register,
      parent
    });
    if (mesh) created.push(mesh);
  }
  return created;
}
