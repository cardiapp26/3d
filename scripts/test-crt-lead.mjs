import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildCrtPath } from '../src/pacemaker-leads.js';

const ra = new THREE.Vector3(-1, 0.2, 0.1);
const cs = [];
for (let i = 0; i < 8; i++) cs.push(new THREE.Vector3(-0.8 + i * 0.15, -0.45, -0.3 - i * 0.08));
const piv = [
  new THREE.Vector3(-0.15, -0.48, -0.62),
  new THREE.Vector3(0.3, -0.55, -0.52),
  new THREE.Vector3(0.72, -0.66, -0.4),
  new THREE.Vector3(1.05, -0.82, -0.22)
];
const path = buildCrtPath({
  entry: new THREE.Vector3(-0.95, 1.5, -0.2),
  highSvc: new THREE.Vector3(-0.9, 1.15, -0.15),
  ra,
  csPoints: cs,
  pivPoints: piv
});
const tip = path[path.length - 1];
assert.ok(tip.x > 0.5, 'tip sits on the lateral part of the posterior LV vein');
assert.ok(tip.z < -0.3, 'tip stays posterior, off the anterior interventricular course');
assert.ok(path.some(point => point.distanceTo(cs[0]) < 0.08), 'lead passes the CS ostium');
assert.ok(path.every(point => point.distanceTo(cs[cs.length - 1]) > 0.05), 'lead does not continue to the distal CS end');
assert.ok(tip.distanceTo(piv[piv.length - 1]) > 0.15, 'tip stops in the vein body, short of the distal twig');

console.log('PASS: CRT lead enters the CS ostium and ends in the posterior LV vein');
