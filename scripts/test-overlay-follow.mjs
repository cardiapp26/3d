import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildOwnerGrid } from '../src/surface-followers.js';
import { frameDisplacement, fieldCoefficients, CHAMBER_LAW } from '../src/chamber-field.js';
import { chamberProfile, insideWeight, bindPoints, displacePoints, createOverlayFollow } from '../src/overlay-follow.js';
import { createBloodFlow } from '../src/blood-flow.js';

console.log('Running Overlay Follow Unit Tests...\n');

// A mock chamber: an open cylinder of radius 0.5 around +y, base at the
// origin (valve plane), length 2. Its wall moves by its own field.
const RADIUS = 0.5, LENGTH = 2;
const rest = [];
for (let j = 0; j <= 40; j++) for (let a = 0; a < 48; a++) {
  const th = a / 48 * Math.PI * 2;
  rest.push(RADIUS * Math.cos(th), j / 40 * LENGTH, RADIUS * Math.sin(th));
}
const restArr = new Float32Array(rest);
const frame = { base: [0, 0, 0], axis: [0, 1, 0], length: LENGTH };
const law = CHAMBER_LAW.lv;
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const owner = { rest: restArr, matrix: I, current: new Float32Array(restArr) };
const owners = [owner];
const ctxAt = shape => {
  const d = [0, 0, 0];
  for (let i = 0; i < restArr.length; i += 3) {
    frameDisplacement(restArr[i], restArr[i + 1], restArr[i + 2], frame, shape, law, d);
    owner.current[i] = restArr[i] + d[0]; owner.current[i + 1] = restArr[i + 1] + d[1]; owner.current[i + 2] = restArr[i + 2] + d[2];
  }
  owner.disp = new Float32Array(restArr.length);
  for (let i = 0; i < restArr.length; i++) owner.disp[i] = owner.current[i] - restArr[i];
  return { owners, grid, chambers: [{ id: 'lv', rest: restArr, frame, law }], weights: shape ? { ventricularShape: shape } : null, coefficients: shape ? [fieldCoefficients(frame, law, shape)] : null, stamp: shape };
};
const grid = buildOwnerGrid(owners);

// 1. Inside weight: full in the cavity, zero well outside and beyond the ends.
{
  const profile = chamberProfile(restArr, frame);
  assert.ok(insideWeight(profile, 0, 1, 0) > 0.99, 'axis is inside');
  assert.ok(insideWeight(profile, 0.3, 1, 0) > 0.99, 'cavity is inside');
  assert.equal(insideWeight(profile, 0.8, 1, 0), 0, 'well outside the wall');
  assert.equal(insideWeight(profile, 0, -0.5, 0), 0, 'beyond the valve plane');
  const w = [0.42, 0.46, 0.5, 0.54].map(x => insideWeight(profile, x, 1, 0));
  assert.ok(w.every((v, i) => i === 0 || v <= w[i - 1]), 'weight falls off smoothly across the wall');
  console.log('PASS: chamber profile and inside weight');
}

// 2. A point on the wall moves with the wall; a cavity point with the field;
//    a distant point stays still; at rest nothing moves.
{
  const ctx = ctxAt(1);
  const pts = new Float32Array([RADIUS, 1.5, 0, 0.2, 1.5, 0, 2.5, 1, 0]);
  const binding = bindPoints(ctx, pts);
  const out = displacePoints(ctx, binding, new Float32Array(9));
  // Wall vertex nearest (0.5, 1.5, 0): column a = 0, row 30.
  const wi = (30 * 48) * 3;
  assert.ok(Math.hypot(out[0] - owner.disp[wi], out[1] - owner.disp[wi + 1], out[2] - owner.disp[wi + 2]) < 2e-3, 'wall point follows its wall vertex');
  const f = frameDisplacement(0.2, 1.5, 0, frame, 1, law, [0, 0, 0]);
  assert.ok(Math.hypot(out[3] - f[0], out[4] - f[1], out[5] - f[2]) < 1e-3, 'cavity point follows the chamber field');
  assert.deepEqual([...out.slice(6)], [0, 0, 0], 'distant point stays still');
  const restCtx = ctxAt(0);
  assert.ok(displacePoints(restCtx, bindPoints(restCtx, pts), new Float32Array(9)).every(v => v === 0), 'no field at rest');
  console.log('PASS: wall contact, cavity field, far field, rest');
}

// 3. A catheter crossing the cavity from wall to wall moves continuously
//    (no jump where the nearest wall changes side).
{
  const ctx = ctxAt(1);
  const N = 200, line = new Float32Array((N + 1) * 3);
  for (let i = 0; i <= N; i++) { line[i * 3] = -0.7 + 1.4 * i / N; line[i * 3 + 1] = 1.2; line[i * 3 + 2] = 0.05; }
  const out = displacePoints(ctx, bindPoints(ctx, line), new Float32Array(line.length));
  let jump = 0;
  for (let i = 1; i <= N; i++) jump = Math.max(jump, Math.hypot(out[i * 3] - out[i * 3 - 3], out[i * 3 + 1] - out[i * 3 - 2], out[i * 3 + 2] - out[i * 3 - 1]));
  assert.ok(jump < 0.01, `continuous across the cavity (largest step ${jump.toFixed(4)} for a 0.007 spacing)`);
  console.log('PASS: continuous motion across a cavity');
}

// 4. The controller: per-vertex meshes, small rigid objects, rebinding on
//    rebuilt geometry, reset and hidden groups back to rest.
{
  let ctx = ctxAt(1);
  const root = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0.49, 0.5, 0), new THREE.Vector3(0.49, 1.8, 0)), 16, 0.01, 6, false));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6)); dot.position.set(0.48, 1.5, 0);
  root.add(tube, dot);
  const follow = createOverlayFollow({ getContext: () => ctx, roots: () => [root] });
  const tubeRest = new Float32Array(tube.geometry.attributes.position.array);
  follow.sync();
  assert.equal(follow.recordCount(), 2);
  assert.ok(tube.geometry.attributes.position.array.some((v, i) => Math.abs(v - tubeRest[i]) > 1e-4), 'tube deformed');
  const dotMoved = dot.position.clone();
  assert.ok(dotMoved.distanceTo(new THREE.Vector3(0.48, 1.5, 0)) > 1e-3, 'small object moves rigidly');
  // Same pose: nothing to do. New geometry (lesson progress): rebound from its own rest.
  assert.equal(follow.sync(), false, 'no work when nothing changed');
  const old = tube.geometry;
  tube.geometry = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0.49, 0.5, 0), new THREE.Vector3(0.49, 1.2, 0)), 8, 0.01, 6, false);
  const newRest = new Float32Array(tube.geometry.attributes.position.array);
  follow.sync();
  assert.ok(old.attributes.position.array.every((v, i) => v === tubeRest[i]), 'replaced geometry restored to rest');
  assert.ok(tube.geometry.attributes.position.array.some((v, i) => Math.abs(v - newRest[i]) > 1e-4), 'new geometry follows');
  // Lesson code moves the dot: that position is the new rest.
  dot.position.set(0.48, 1.0, 0);
  follow.sync();
  const offset = dot.position.distanceTo(new THREE.Vector3(0.48, 1.0, 0));
  assert.ok(offset > 1e-4 && offset < 0.2, 'moved object rebound at its new place');
  // Hidden: back to rest and unbound.
  root.visible = false; follow.sync();
  assert.equal(follow.recordCount(), 0);
  assert.ok(tube.geometry.attributes.position.array.every((v, i) => v === newRest[i]), 'hidden overlay at rest');
  assert.deepEqual(dot.position.toArray(), [0.48, 1.0, 0]);
  // Reset through a null context (heart at rest).
  root.visible = true; follow.sync(); ctx = null; follow.sync();
  assert.ok(tube.geometry.attributes.position.array.every((v, i) => v === newRest[i]), 'rest pose restores overlays');
  console.log('PASS: overlay controller (per-vertex, rigid, rebinding, hidden, reset)');
}

// 5. Flow particles take the field displacement along their curve.
{
  const shift = 0.1;
  const field = { bind: pts => ({ n: pts.length }), displace: (b, out) => { for (let i = 0; i < out.length; i += 3) { out[i] = shift; out[i + 1] = 0; out[i + 2] = 0; } return out; }, stamp: () => 1 };
  const flow = createBloodFlow();
  const mesh = flow.group.children.find(o => o.isInstancedMesh);
  const m = new THREE.Matrix4(), a = new THREE.Vector3(), b = new THREE.Vector3();
  flow.update({ phase: 0.3, bpm: 72 }); mesh.getMatrixAt(0, m); a.setFromMatrixPosition(m);
  flow.setField(field); flow.update({ phase: 0.3, bpm: 72 }); mesh.getMatrixAt(0, m); b.setFromMatrixPosition(m);
  assert.ok(Math.abs(b.x - a.x - shift) < 1e-6 && Math.abs(b.y - a.y) < 1e-6, 'particle shifted by the field');
  assert.equal(mesh.frustumCulled, false, 'moving particles are not culled by a stale bound');
  console.log('PASS: flow particles follow the field');
}

console.log('\nALL OVERLAY FOLLOW TESTS PASSED!');
