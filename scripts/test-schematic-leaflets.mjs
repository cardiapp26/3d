import assert from 'node:assert/strict';
import * as THREE from 'three';
import { annulusFrame, toFrame } from '../src/mesh-utils.js';
import { chordGeometries, freeEdge, leafletGeometry, uncoveredArc } from '../src/schematic-leaflets.js';

// Unit annulus in the XZ plane; the ventricle lies toward +Y.
const rim = [];
for (let i = 0; i < 48; i++) {
  const angle = (i / 48) * Math.PI * 2;
  rim.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
}
const frame = annulusFrame(rim, new THREE.Vector3(0, 1, 0));
assert.ok(Math.abs(frame.normal.y - 1) < 1e-6, 'annulus normal points toward the ventricle');
assert.ok(Math.abs(frame.radius - 1) < 1e-6, 'annulus radius is the mean rim distance');

// Existing (atlas-like) leaflet: hinged on the x > 0.15 arc, its body hangs
// 0.3 into the ventricle and its free edge reaches just past the axis (x = -0.05).
const existing = [];
for (let i = 0; i <= 40; i++) {
  const angle = -Math.PI / 2.4 + (i / 40) * (Math.PI / 1.2);
  for (let j = 0; j <= 10; j++) {
    const t = j / 10;
    const hinge = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const edge = new THREE.Vector3(-0.05, 0.3, Math.sin(angle) * 0.9);
    existing.push(hinge.lerp(edge, t));
  }
}
const samples = existing.map(point => toFrame(frame, point));

const arc = uncoveredArc(rim, samples, frame);
assert.ok(arc.length >= 12 && arc.length <= 34, 'the uncovered part of the ring becomes one leaflet arc');
assert.ok(arc.every(point => point.x < 0.45), 'the new leaflet hinges opposite the existing leaflet');
assert.equal(uncoveredArc(rim, [], frame).length, 0, 'no existing leaflet means no guessed leaflet');

const edge = freeEdge(arc, samples, frame);
assert.equal(edge.length, arc.length);
assert.ok(edge.every(point => point.y > 0.05), 'the free edge hangs below the annulus into the ventricle');
const middle = edge[Math.floor(edge.length / 2)];
assert.ok(middle.x > -0.3, 'the free edge reaches the existing leaflet across the axis (coaptation)');
const nearest = Math.min(...existing.map(point => point.distanceTo(middle)));
assert.ok(nearest < 0.2, 'the free edge meets the existing leaflet body');

const sheet = leafletGeometry(arc, edge, frame);
const position = sheet.attributes.position;
assert.equal(position.count, arc.length * 11, 'sheet is a hinge-to-edge loft');
const firstHinge = new THREE.Vector3().fromBufferAttribute(position, 0);
assert.ok(firstHinge.distanceTo(arc[0]) < 1e-6, 'the hinge row sits on the measured rim');

const tips = [new THREE.Vector3(-0.3, 1.2, 0.2), new THREE.Vector3(-0.3, 1.25, 0.25)];
const heads = [{ tips, x: -0.3, y: -0.2 }];
const chords = chordGeometries(arc, edge, heads, frame);
assert.equal(chords.length, 5, 'marginal chordae tether the free edge');
for (const chord of chords) {
  chord.computeBoundingBox();
  assert.ok(chord.boundingBox.max.y > 1.1, 'each chord reaches a papillary head');
}
assert.equal(chordGeometries(arc, edge, [], frame).length, 0, 'no papillary muscle means no chordae');

console.log('PASS: schematic AV leaflet hinges on the uncovered arc, coapts and is tethered by chordae');
