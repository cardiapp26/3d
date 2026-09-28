import assert from 'node:assert/strict';
import * as THREE from 'three';
import { coronarySinusOstium } from '../src/mesh-utils.js';

// Synthetic right atrium: a closed sphere of radius 1 at the origin. The
// tricuspid orifice is the rim of a cap cut at y = -0.6 (ventricle below),
// the left atrium a wall at x = +1.2, the sinus an open tube whose mouth sits
// on the tricuspid rim at the septal (+x) side.
const ra = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32));
const la = new THREE.Mesh(new THREE.PlaneGeometry(3, 3, 12, 12));
la.rotation.y = -Math.PI / 2;
la.position.set(1.2, 0, 0);
const rimRadius = Math.sqrt(1 - .6 * .6);
const tvRim = Array.from({ length: 48 }, (_, i) => {
  const a = i / 48 * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * rimRadius, -.6, Math.sin(a) * rimRadius);
});
// Seamless open tube along +x (CylinderGeometry carries a seam that would
// chain both rims into one boundary loop).
function openTube(radius, length, segments = 12) {
  const positions = [], index = [];
  for (const x of [0, length]) for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2;
    positions.push(x, Math.cos(a) * radius, Math.sin(a) * radius);
  }
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    index.push(i, j, segments + i, j, segments + j, segments + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return geometry;
}
const cs = new THREE.Mesh(openTube(.12, 1.2));
cs.position.set(rimRadius, -.6, 0);
for (const m of [ra, la, cs]) m.updateWorldMatrix(true, false);
const towardVentricle = new THREE.Vector3(0, -3, 0);
const avNode = new THREE.Vector3(.96, .28, 0);

const mouth = coronarySinusOstium({ raMesh: ra, laMesh: la, csMesh: cs, tvRim, towardVentricle, avNode });
assert.ok(mouth, 'a mouth is measured');
assert.ok(Math.abs(mouth.center.length() - 1) < .02, 'the mouth lies on the RA wall');
assert.ok(mouth.center.y > -.6, 'the mouth is on the atrial side of the tricuspid plane');
const dRim = Math.min(...tvRim.map(r => r.distanceTo(mouth.center)));
assert.ok(dRim > .2 && dRim < .4, `one septal isthmus from the hinge (${dRim.toFixed(2)})`);
assert.ok(mouth.center.x > .7, 'the mouth is paraseptal, beside the interatrial wall');
assert.ok(mouth.sinusEnd.distanceTo(new THREE.Vector3(rimRadius, -.6, 0)) < .05, 'the sinus termination is its rim-side open loop');
assert.ok(mouth.posteriorLip.distanceTo(mouth.hinge) > mouth.center.distanceTo(mouth.hinge), 'the posterior lip lies beyond the mouth, away from the hinge');
assert.ok(Math.abs(mouth.posteriorLip.length() - 1) < .02, 'the lip is on the wall too');
assert.equal(coronarySinusOstium({ raMesh: null, csMesh: cs, tvRim, towardVentricle }), null, 'no atrium, no mouth');
assert.equal(coronarySinusOstium({ raMesh: ra, csMesh: cs, tvRim: tvRim.slice(0, 4), towardVentricle }), null, 'a degenerate rim yields nothing');
console.log('PASS: coronary sinus ostium is measured on the paraseptal RA wall one isthmus above the hinge');
