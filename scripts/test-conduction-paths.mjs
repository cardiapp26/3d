import assert from 'node:assert/strict';
import * as THREE from 'three';
import { measureLeftBundle, measureRightBundle } from '../src/conduction-paths.js';

// Synthetic ventricles: septum is the plane x = 0 (RV side x = -0.05, LV side
// x = +0.05), LV a hemisphere-ish cloud on +x, RV on -x. Base at y = 0, apex
// toward -y.
const grid = (x, fn) => {
  const out = [];
  for (let y = -1.6; y <= 0; y += .05) for (let z = -.6; z <= .6; z += .05) out.push(fn ? fn(y, z) : new THREE.Vector3(x, y, z));
  return out;
};
const septum = grid(0).map(p => ({ rvSide: new THREE.Vector3(-.05, p.y, p.z), lvSide: new THREE.Vector3(.05, p.y, p.z) }));
const bowl = (sign) => {
  const out = [];
  for (let a = 0; a < Math.PI; a += .08) for (let y = -1.6; y <= 0; y += .05) {
    const r = .7 * Math.sqrt(Math.max(.05, 1 + y / 1.7));
    out.push(new THREE.Vector3(sign * (.05 + r * Math.sin(a)), y, r * Math.cos(a)));
  }
  return out;
};
const lvVerts = [...bowl(1), ...septum.map(p => p.lvSide)];
const rvVerts = [...bowl(-1), ...septum.map(p => p.rvSide)];
const hisEnd = new THREE.Vector3(0, -.05, .1);
const hisFrom = new THREE.Vector3(-.15, 0, -.05);
const angle = (a, b, c) => b.clone().sub(a).normalize().angleTo(c.clone().sub(b).normalize()) * 180 / Math.PI;
// Largest turn between successive samples of the drawn Catmull-Rom tube axis.
const maxStep = points => {
  const c = new THREE.CatmullRomCurve3(points).getSpacedPoints(80);
  let max = 0;
  for (let i = 1; i < c.length - 1; i++) max = Math.max(max, angle(c[i - 1], c[i], c[i + 1]));
  return max;
};

const lbb = measureLeftBundle({
  hisEnd, hisFrom, septum, lvVerts,
  mitralCenter: new THREE.Vector3(.4, 0, 0), lvApex: new THREE.Vector3(.2, -1.6, 0),
  papillary: new THREE.Vector3(.6, -.9, -.35)
});
assert.ok(lbb, 'the left bundle is measured');
assert.ok(lbb.trunk[0].equals(hisFrom) && lbb.trunk[1].equals(hisEnd), 'the trunk starts inside the His');
const trunkEnd = lbb.trunk[lbb.trunk.length - 1];
assert.ok(trunkEnd.x > 0, 'the trunk ends on the LV side of the septum');
assert.ok(trunkEnd.y < hisEnd.y - .15, 'the trunk descends from the crest');
for (const f of [lbb.anterior, lbb.posterior]) {
  assert.ok(f[1].equals(trunkEnd), 'fascicles leave from the trunk end');
  assert.ok(maxStep(f) < 25, `no elbow along a fascicle (${maxStep(f).toFixed(1)} deg per step)`);
}
assert.ok(lbb.anterior.at(-1).z * lbb.posterior.at(-1).z < 0, 'anterior and posterior fascicles fan to opposite sides');
assert.equal(lbb.purkinje.length, 2, 'one Purkinje fan per fascicle');

const rbb = measureRightBundle({
  hisEnd, hisFrom, septum, rvVerts, rvCenter: new THREE.Vector3(-.4, -.6, 0),
  rvApex: new THREE.Vector3(-.2, -1.6, 0), anteriorPapillary: new THREE.Vector3(-.55, -1, .3)
});
assert.ok(rbb, 'the right bundle is measured');
assert.ok(rbb.path[0].equals(hisFrom) && rbb.path[1].equals(hisEnd), 'the RBB continues from inside the His');
assert.ok(rbb.band.x < 0 && rbb.band.y < -.5, 'the moderator band insertion is on the RV mid-apical septum');
assert.ok(maxStep(rbb.path.slice(0, 5)) < 25, `no kink where the RBB leaves the His (${maxStep(rbb.path.slice(0, 5)).toFixed(1)} deg per step)`);
assert.ok(maxStep(lbb.trunk) < 25, `no kink where the LBB leaves the His (${maxStep(lbb.trunk).toFixed(1)} deg per step)`);
assert.equal(measureLeftBundle({ hisEnd, septum: [], lvVerts, mitralCenter: hisEnd, lvApex: hisEnd }), null, 'no septum, no bundle');
console.log('PASS: bundle branches follow the septal subendocardium without elbows');
