/** Asset-level geometric checks, not clinical validation or proof of lumen continuity. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { ATLAS_SHA256 } from '../src/atlas.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = path.join(root, 'public/models/cardiovascular.glb');
const bytes = fs.readFileSync(assetPath);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), ATLAS_SHA256, 'Atlas changed: review provenance and geometry before updating expected checksum.');
const jsonEnd = 20 + bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString('utf8', 20, jsonEnd));
const binary = bytes.subarray(jsonEnd + 8);
const sandbox = {
  module: { exports: {} }, exports: {}, require: createRequire(import.meta.url),
  process, console, __dirname: path.join(root, 'public/draco'), Buffer, TextDecoder,
  setTimeout, clearTimeout,
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/draco/draco_decoder.js'), 'utf8'), sandbox);
const draco = await sandbox.module.exports();
const decoder = new draco.Decoder();
const parentByNode = new Map();
gltf.nodes.forEach((node, index) => (node.children || []).forEach(child => parentByNode.set(child, index)));
function matrix(index) {
  const node = gltf.nodes[index];
  const local = node.matrix ? new THREE.Matrix4().fromArray(node.matrix) : new THREE.Matrix4().compose(
    new THREE.Vector3(...(node.translation || [0, 0, 0])),
    new THREE.Quaternion(...(node.rotation || [0, 0, 0, 1])),
    new THREE.Vector3(...(node.scale || [1, 1, 1])),
  );
  return parentByNode.has(index) ? matrix(parentByNode.get(index)).multiply(local) : local;
}
function decode(name) {
  const index = gltf.nodes.findIndex(node => node.name === name);
  assert.ok(index >= 0, `Required anatomical source node missing: ${name}`);
  const node = gltf.nodes[index];
  const primitive = gltf.meshes[node.mesh].primitives[0];
  const extension = primitive.extensions.KHR_draco_mesh_compression;
  const view = gltf.bufferViews[extension.bufferView];
  const compressed = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const buffer = new draco.DecoderBuffer();
  const mesh = new draco.Mesh();
  const array = new draco.DracoFloat32Array();
  const face = new draco.DracoInt32Array();
  try {
    buffer.Init(compressed, compressed.length);
    const status = decoder.DecodeBufferToMesh(buffer, mesh);
    assert.ok(status.ok(), `${name}: ${status.error_msg()}`);
    const attribute = decoder.GetAttributeByUniqueId(mesh, extension.attributes.POSITION);
    decoder.GetAttributeFloatForAllPoints(mesh, attribute, array);
    const transform = matrix(index);
    const vertices = [];
    for (let i = 0; i < array.size(); i += 3) vertices.push(new THREE.Vector3(array.GetValue(i), array.GetValue(i + 1), array.GetValue(i + 2)).applyMatrix4(transform));
    const faces = [];
    for (let i = 0; i < mesh.num_faces(); i++) {
      decoder.GetFaceFromMesh(mesh, i, face);
      faces.push([face.GetValue(0), face.GetValue(1), face.GetValue(2)]);
    }
    return { name, index, vertices, faces, transform };
  } finally {
    draco.destroy(face); draco.destroy(array); draco.destroy(mesh); draco.destroy(buffer);
  }
}
function boundaryLoops(mesh) {
  const edges = new Map();
  mesh.faces.forEach(face => face.forEach((a, i) => {
    const b = face[(i + 1) % 3];
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    edges.set(key, (edges.get(key) || 0) + 1);
  }));
  const neighbors = new Map();
  for (const [edge, count] of edges) if (count === 1) {
    const [a, b] = edge.split(',').map(Number);
    if (!neighbors.has(a)) neighbors.set(a, []);
    if (!neighbors.has(b)) neighbors.set(b, []);
    neighbors.get(a).push(b); neighbors.get(b).push(a);
  }
  const seen = new Set();
  const loops = [];
  for (const start of neighbors.keys()) {
    if (seen.has(start)) continue;
    const ids = [], queue = [start]; seen.add(start);
    while (queue.length) {
      const id = queue.pop(); ids.push(id);
      for (const next of neighbors.get(id)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    const centroid = ids.reduce((sum, id) => sum.add(mesh.vertices[id]), new THREE.Vector3()).divideScalar(ids.length);
    loops.push({ centroid: centroid.toArray(), vertexCount: ids.length, closedLoop: ids.every(id => neighbors.get(id).length === 2) });
  }
  return loops;
}
function nearestVertices(a, b) {
  let squared = Infinity, pair;
  for (const va of a.vertices) for (const vb of b.vertices) {
    const d = va.distanceToSquared(vb);
    if (d < squared) { squared = d; pair = [va.toArray(), vb.toArray()]; }
  }
  return { distance: Math.sqrt(squared), closestSourcePoints: pair };
}
function pointSurfaceDistance(point, mesh) {
  const triangle = new THREE.Triangle(), nearest = new THREE.Vector3();
  let squared = Infinity;
  for (const [a, b, c] of mesh.faces) {
    triangle.set(mesh.vertices[a], mesh.vertices[b], mesh.vertices[c]);
    triangle.closestPointToPoint(point, nearest);
    squared = Math.min(squared, nearest.distanceToSquared(point));
  }
  return Math.sqrt(squared);
}
const names = {
  lm: 'Left coronary artery', lad: 'Anterior interventricular artery', lcx: 'Circumflex artery of heart',
  rca: 'Right coronary artery', aorta: 'Ascending aorta',
  la: 'Left atrium', lv: 'Left ventricle', ra: 'Right atrium', rv: 'Right ventricle',
};
const meshes = Object.fromEntries(Object.entries(names).map(([id, name]) => [id, decode(name)]));
draco.destroy(decoder);
const chamberBox = new THREE.Box3();
for (const id of ['la', 'lv', 'ra', 'rv']) for (const vertex of meshes[id].vertices) chamberBox.expandByPoint(vertex);
const size = chamberBox.getSize(new THREE.Vector3());
const span = Math.max(size.x, size.y, size.z);
const checks = [];
const separations = {};
for (const [a, b] of [['lm', 'aorta'], ['lm', 'lad'], ['lm', 'lcx'], ['lad', 'lcx'], ['rca', 'aorta']]) {
  const separation = nearestVertices(meshes[a], meshes[b]);
  separation.chamberSpanRatio = separation.distance / span;
  separations[`${a}_${b}`] = separation;
  checks.push({ name: `${a}–${b} source surface vertex proximity`, pass: separation.chamberSpanRatio < .035, measuredRatio: separation.chamberSpanRatio, maximumRatio: .035 });
}
const lmLoops = boundaryLoops(meshes.lm);
const endpointDistances = lmLoops.map(loop => ({ ...loop, distanceToSurface: Object.fromEntries(['aorta', 'lad', 'lcx'].map(id => [id, pointSurfaceDistance(new THREE.Vector3(...loop.centroid), meshes[id])])) }));
checks.push({ name: 'Left main contains two closed boundary loops', pass: lmLoops.length === 2 && lmLoops.every(loop => loop.closedLoop) });
if (endpointDistances.length === 2) {
  const [proximal, distal] = endpointDistances.toSorted((a, b) => a.distanceToSurface.aorta - b.distanceToSurface.aorta);
  checks.push({ name: 'Left main aortic endpoint differs from shared LAD/LCX endpoint', pass: proximal.distanceToSurface.aorta < distal.distanceToSurface.aorta && distal.distanceToSurface.lad < proximal.distanceToSurface.lad && distal.distanceToSurface.lcx < proximal.distanceToSurface.lcx });
}
const report = {
  asset: 'public/models/cardiovascular.glb', sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceUnits: 'Unverified source coordinate units; no millimetre conversion asserted.',
  method: 'Decode actual Draco positions and triangles; apply complete glTF node/ancestor transforms. Pair distances use closest source vertices (upper bounds on triangle-surface separation). Left-main boundary centroids use exact point-to-triangle distances.',
  thresholdReason: '3.5% of maximum four-chamber bounding-box extent is a gross registration/branch proximity regression guard, not a clinical tolerance or proof of lumen connection.',
  chamberBounds: { min: chamberBox.min.toArray(), max: chamberBox.max.toArray(), center: chamberBox.getCenter(new THREE.Vector3()).toArray(), maximumExtent: span },
  structures: Object.fromEntries(Object.entries(meshes).map(([id, mesh]) => [id, { name: mesh.name, sourceNode: mesh.index, bounds: { min: new THREE.Box3().setFromPoints(mesh.vertices).min.toArray(), max: new THREE.Box3().setFromPoints(mesh.vertices).max.toArray() }, vertexCount: mesh.vertices.length, triangleCount: mesh.faces.length, sourceWorldTransform: mesh.transform.elements, boundaryLoops: boundaryLoops(mesh) }])),
  separations, leftMainEndpointDistances: endpointDistances, checks,
  limits: ['Does not validate diagnosis, patient anatomy, catheter paths, perfusion territories, or vessel wall/lumen topology.', 'Does not exercise browser scene transforms; rendering must apply a single shared normalization to the selected structures.', 'Geometry proximity alone does not establish anatomical correctness; inspect source provenance and anterior/posterior/cutaway views.'],
};
fs.writeFileSync(path.join(root, 'research/coronary-geometry-report.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const check of checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}${check.measuredRatio === undefined ? '' : `: ${check.measuredRatio.toFixed(6)} chamber spans`}`);
console.log('Report: research/coronary-geometry-report.json');
assert.ok(checks.every(check => check.pass), 'Coronary source geometry checks failed; inspect report.');
