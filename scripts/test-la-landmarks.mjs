import assert from 'node:assert/strict';
import * as THREE from 'three';
import { laaOrifice } from '../src/la-landmarks.js';

// Synthetic left atrium: a sphere (body) with a tube lobe on its left,
// anterior side, joined through a narrower neck.
function sphere(radius, n = 1500) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + 0.5) / n;
    const r = Math.sqrt(1 - y * y);
    const t = i * 2.399963;
    out.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r).multiplyScalar(radius));
  }
  return out;
}
function tube(cx, cy, z0, z1, radius, rings = 12) {
  const out = [];
  for (let k = 0; k <= rings; k++) {
    const z = z0 + (z1 - z0) * k / rings;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      out.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, z));
    }
  }
  return out;
}

const body = sphere(1);
const neck = tube(0.5, 0.3, 0.85, 1.15, 0.22, 4);
const lobe = tube(0.5, 0.3, 1.15, 2.0, 0.4, 10);
const orifice = laaOrifice([...body, ...neck, ...lobe]);
assert.ok(orifice, 'the anterior lobe is found');
assert.ok(Math.abs(orifice.center.x - 0.5) < 0.1 && Math.abs(orifice.center.y - 0.3) < 0.1, 'the orifice sits on the lobe axis');
assert.ok(orifice.center.z > 0.8 && orifice.center.z < 1.2, 'the orifice is at the neck, between body and lobe');
assert.ok(orifice.axis.z > 0.95, 'the appendage axis points anteriorly');
assert.ok(orifice.radius > 0.15 && orifice.radius < 0.32, 'the orifice radius is the neck radius');
assert.ok(orifice.tip.z > 1.8, 'the tip is the most anterior slice');

assert.equal(laaOrifice(sphere(1)), null, 'a plain atrium without a lobe has no appendage orifice');
assert.equal(laaOrifice(sphere(1).slice(0, 50)), null, 'too few vertices give no guess');

// A lobe that is not narrower than the body is not an appendage neck.
const wideLobe = tube(0.5, 0.3, 0.85, 2.0, 0.95, 14);
assert.equal(laaOrifice([...body, ...wideLobe]), null, 'a lobe without a neck is not marked');

console.log('PASS: left atrial appendage orifice is measured at the neck of the anterior lobe');
