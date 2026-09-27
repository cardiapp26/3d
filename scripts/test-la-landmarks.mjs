import assert from 'node:assert/strict';
import * as THREE from 'three';
import { laaOrifice, laaNeckContour, smoothLaNormals } from '../src/la-landmarks.js';

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

// Preserve an elliptical section instead of replacing it with a circle.
const ellipse = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 48, 8, true));
ellipse.scale.set(.6, 1, .3);
const section = laaNeckContour(ellipse, { center: new THREE.Vector3(), axis: new THREE.Vector3(0, 1, 0), radius: .45 });
assert.ok(section && section.length >= 8, 'closed surface section is found');
assert.ok(section.every(p => Math.abs(p.y) < 1e-6), 'contour remains in neck plane');
const bounds = new THREE.Box3().setFromPoints(section).getSize(new THREE.Vector3());
assert.ok(Math.abs(bounds.x / bounds.z - 2) < .05, 'measured elliptical aspect ratio is preserved');
assert.equal(laaNeckContour(ellipse, { center: new THREE.Vector3(0, 4, 0), axis: new THREE.Vector3(0, 1, 0), radius: .45 }), null, 'no section is invented outside the mesh');
const surface = new THREE.SphereGeometry(1, 12, 8).toNonIndexed();
const original = surface.attributes.position.array.slice();
smoothLaNormals(surface);
assert.deepEqual(surface.attributes.position.array, original, 'smooth shading never moves atlas vertices');
const shared = new Map();
for (let i = 0; i < surface.attributes.position.count; i++) {
  const key = new THREE.Vector3().fromBufferAttribute(surface.attributes.position, i).toArray().map(v => Math.round(v * 1e5)).join(',');
  const normal = new THREE.Vector3().fromBufferAttribute(surface.attributes.normal, i);
  assert.ok(Number.isFinite(normal.length()) && Math.abs(normal.length() - 1) < 1e-5);
  if (shared.has(key)) assert.ok(normal.distanceTo(shared.get(key)) < 1e-6, 'duplicate positions share smooth normals');
  shared.set(key, normal);
}
console.log('PASS: LA vertex preservation, smooth seams and elliptical LAA surface contour');
