// Supra-aortic branches on a synthetic arch (12-vertex rings like the atlas,
// two cap rings first): origins on the superior surface in right-anterior to
// left-posterior order, base rings on the wall, no ring under it, BCT
// daughters inside its dome, calibres in order.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildArchBranches, archCenterline, ARCH_BRANCHES } from '../src/aortic-arch-branches.js';

const R = 0.35, BEND = 0.85, RING = 12, N = 25;
// A 12-gon wall lies up to R(1 - cos 15°) inside the ideal circle.
const FACET = R * (1 - Math.cos(Math.PI / RING));
const centre = new THREE.Vector3(-0.2, 1.75, -0.7);
// Arch in the sagittal plane: anterior end (z > 0) to posterior end, apex up.
const axisPoint = a => centre.clone().add(new THREE.Vector3(0, BEND * Math.sin(a), BEND * Math.cos(a)));
const positions = [];
const ring = (a, radius) => {
  const c = axisPoint(a), radial = c.clone().sub(centre).normalize(), side = new THREE.Vector3(1, 0, 0);
  for (let k = 0; k < RING; k++) {
    const t = (k / RING) * Math.PI * 2;
    const v = c.clone().addScaledVector(radial, Math.cos(t) * radius).addScaledVector(side, Math.sin(t) * radius);
    positions.push(v.x, v.y, v.z);
  }
};
ring(Math.PI * 1.05, R * 0.6); ring(-0.05, R * 0.6);       // caps, as in the atlas
for (let i = 2; i < N; i++) ring(Math.PI * (i - 2) / (N - 3), R); // anterior (a=0, z>0) to posterior (a=pi)
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const index = [];
for (let r = 2; r < N - 1; r++) for (let k = 0; k < RING; k++) {
  const a = r * RING + k, b = r * RING + (k + 1) % RING, c = (r + 1) * RING + k, d = (r + 1) * RING + (k + 1) % RING;
  index.push(a, c, b, b, c, d);
}
geometry.setIndex(index);

const chain = archCenterline(geometry);
assert.equal(chain.length, N - 2, 'cap rings dropped from the arch centerline');
assert.ok(chain[0].c.z > chain[chain.length - 1].c.z, 'centerline runs from the ascending (anterior) end');

const branches = buildArchBranches(geometry);
const byId = Object.fromEntries(branches.map(b => [b.id, b]));
assert.deepEqual(branches.map(b => b.id), ARCH_BRANCHES.map(b => b.id));

// Distance of a point from the arch wall (signed: negative inside the lumen).
const wall = p => {
  let best = Infinity;
  for (let i = 0; i < 400; i++) {
    const a = Math.PI * i / 399, c = axisPoint(a);
    const tangent = new THREE.Vector3(0, Math.cos(a), -Math.sin(a));
    const off = p.clone().sub(c);
    if (Math.abs(off.dot(tangent)) > 0.01) continue;
    best = Math.min(best, off.length() - R);
  }
  return best;
};
const ringOf = (b, s) => {
  const pos = b.geometry.attributes.position, out = [];
  for (let r = 0; r < 17; r++) { const i = s * 17 + r; out.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))); }
  return out;
};
for (const id of ['brachiocephalic', 'lcca', 'lsca']) {
  const b = byId[id];
  const d = wall(b.origin);
  assert.ok(Math.abs(d) < FACET + 0.005, `${id} origin on the arch surface (${d.toFixed(4)})`);
  assert.ok(b.origin.y > centre.y + BEND, `${id} arises from the superior (convex) surface`);
  for (const v of ringOf(b, 0)) assert.ok(Math.abs(wall(v)) < FACET + 0.01, `${id} base ring sits on the wall (${wall(v).toFixed(4)})`);
  for (let s = 1; s <= 10; s++) for (const v of ringOf(b, s)) assert.ok(wall(v) > -FACET - 0.005, `${id} ring ${s} stays out of the lumen (${wall(v).toFixed(4)})`);
  assert.ok(b.end.y > b.origin.y + 0.5, `${id} runs superiorly`);
}
// Order along the arch: right/anterior to left/posterior.
const [bct, lcca, lsca] = ['brachiocephalic', 'lcca', 'lsca'].map(id => byId[id].origin);
assert.ok(bct.z > lcca.z && lcca.z > lsca.z, 'origins run anterior to posterior');
assert.ok(bct.x < lcca.x && lcca.x < lsca.x, 'origins run right to left');
// Directions: BCT and RSCA to the right, LSCA to the left, carotids up.
assert.ok(byId.brachiocephalic.end.x < bct.x - 0.3, 'BCT runs to the right');
assert.ok(byId.rsca.end.x < byId.rcca.end.x - 0.5, 'RSCA runs lateral to the RCCA');
assert.ok(byId.lsca.end.x > lsca.x + 1, 'LSCA runs to the left');
assert.ok(byId.rcca.end.y > byId.rsca.end.y && byId.lcca.end.y > byId.lsca.end.y, 'carotids run higher than the subclavians');
// BCT division: both daughters start inside its end dome.
for (const id of ['rcca', 'rsca']) assert.ok(byId[id].origin.distanceTo(byId.brachiocephalic.end) < byId.brachiocephalic.radius, `${id} leaves the BCT bifurcation`);
// Calibres: BCT largest, subclavians larger than carotids.
assert.ok(byId.brachiocephalic.radius > byId.lsca.radius && byId.lsca.radius > byId.lcca.radius && byId.rsca.radius > byId.rcca.radius);
for (const b of branches) assert.ok(b.geometry.attributes.position.array.every(Number.isFinite), `${b.id} geometry finite`);
console.log('PASS arch-branches: BCT, LCCA, LSCA seated on the superior arch wall right-anterior to left-posterior; BCT divides into RSCA and RCCA');
