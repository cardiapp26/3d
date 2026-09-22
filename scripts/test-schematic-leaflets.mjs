import assert from 'node:assert/strict';
import * as THREE from 'three';
import { oppositeArc, sailGeometry } from '../src/schematic-leaflets.js';

const rim = [];
for (let i = 0; i < 48; i++) {
  const angle = (i / 48) * Math.PI * 2;
  rim.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
}
const occupied = rim.filter(point => point.x > 0.15);
const arc = oppositeArc(rim, occupied);

assert.ok(arc.length >= 16 && arc.length <= 30, 'the opposite half of the ring becomes one leaflet arc');
assert.ok(arc.every(point => point.x < 0.05), 'the new leaflet stays opposite the existing leaflet');

const geometry = sailGeometry(arc, new THREE.Vector3(), new THREE.Vector3(0, 0.2, 0));
assert.ok(geometry.attributes.position.count > arc.length);
const tip = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, geometry.attributes.position.count - 1);
assert.ok(tip.length() < 1e-6, 'the free edge meets the orifice center');

assert.equal(oppositeArc(rim, []).length, 0, 'no existing leaflet means no guessed sail');

console.log('PASS: schematic AV leaflet occupies only the uncovered annular arc');
