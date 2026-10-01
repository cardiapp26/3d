import assert from 'node:assert/strict';
import * as THREE from 'three';
import { FLOW_STREAMS, createBloodFlow } from '../src/blood-flow.js';
import { computeChannelWeights } from '../src/animation-channels.js';

console.log('Running Blood Flow Unit Tests...\n');

// 1. Verify stream definitions and anatomical points
{
  assert.equal(FLOW_STREAMS.length, 15, 'Should have 15 anatomical flow streams');

  const requiredIds = [
    'svc-ra-rv', 'ivc-ra-rv',
    'rv-pa-left', 'rv-pa-right',
    'lspv-la-lv', 'lipv-la-lv', 'rspv-la-lv', 'ripv-la-lv',
    'lv-aorta',
    'coronary-lad', 'coronary-lcx', 'coronary-rca',
    'coronary-gcv', 'coronary-mcv', 'coronary-piv'
  ];

  for (const id of requiredIds) {
    const stream = FLOW_STREAMS.find(s => s.id === id);
    assert.ok(stream, `Stream ${id} should exist`);
    assert.ok(stream.points.length >= 4, `Stream ${id} should have at least 4 control points`);
    for (const pt of stream.points) {
      assert.equal(pt.length, 3, `Point in ${id} must have 3 coordinates`);
      assert.ok(pt.every(c => typeof c === 'number' && !Number.isNaN(c)), `Point coordinates in ${id} must be valid numbers`);
    }
  }

  console.log('PASS: All 15 anatomical flow streams defined with valid 3D points');
}

// 2. Verify gating functions across cardiac phases
{
  const fillingWeights = computeChannelWeights(0.15); // Rapid ventricular filling
  const ejectionWeights = computeChannelWeights(0.65); // Ventricular ejection

  const svcStream = FLOW_STREAMS.find(s => s.id === 'svc-ra-rv');
  const lvAortaStream = FLOW_STREAMS.find(s => s.id === 'lv-aorta');
  const ladStream = FLOW_STREAMS.find(s => s.id === 'coronary-lad');
  const gcvStream = FLOW_STREAMS.find(s => s.id === 'coronary-gcv');

  // During ventricular filling: AV inflow is accelerated, aortic ejection is quiescent
  assert.ok(svcStream.gating(fillingWeights) > 1.0, 'SVC inflow active in filling');
  assert.ok(lvAortaStream.gating(fillingWeights) < 0.2, 'Aortic ejection closed in filling');

  // During ventricular ejection: Aortic ejection peaks, AV inflow is low
  assert.ok(lvAortaStream.gating(ejectionWeights) > 2.0, 'Aortic ejection surges in systole');
  assert.ok(svcStream.gating(ejectionWeights) < 0.3, 'AV inflow resting in systole');

  // Coronary perfusion: higher during diastole than peak systole
  assert.ok(ladStream.gating(fillingWeights) > ladStream.gating(ejectionWeights), 'Coronary perfusion higher in diastole');

  // Coronary venous return: augmented during systole
  assert.ok(gcvStream.gating(ejectionWeights) > gcvStream.gating(fillingWeights), 'Coronary venous return augmented in systole');

  console.log('PASS: Physiological flow gating verified across Wiggers intervals');
}

// 3. Verify InstancedMesh allocation and tick
{
  const flow = createBloodFlow();
  assert.ok(flow.group instanceof THREE.Group, 'Group returned');
  assert.equal(flow.group.children.length, 4, 'Two instanced head meshes, the tube group and the pathline trails');

  const meshDeoxy = flow.group.children.find((c) => c.name === 'Deoxygenated Flow Particles');
  const meshOxy = flow.group.children.find((c) => c.name === 'Oxygenated Flow Particles');
  const tubes = flow.group.children.find((c) => c.name === 'Flow stream tubes');
  assert.equal(tubes.children.length, FLOW_STREAMS.length, 'One faint tube per stream');
  assert.ok(tubes.children.every((t) => t.material.transparent && t.material.opacity < 0.3), 'Tubes stay faint');
  // 4D-flow-MRI style: velocity-colored heads with comet trails.
  const trails = flow.group.children.find((c) => c.name === 'Flow pathline trails');
  assert.ok(trails && trails.isInstancedMesh, 'Pathline comet trails exist');
  assert.equal(trails.count, (240 + 240) * 9, 'TRAIL - 1 spheres per particle');
  assert.equal(meshDeoxy.count, 240, 'Deoxygenated mesh capacity 240');
  assert.equal(meshOxy.count, 240, 'Oxygenated mesh capacity 240');

  // Capture matrix before tick
  const matBefore = new THREE.Matrix4();
  meshOxy.getMatrixAt(0, matBefore);

  // Tick 100ms in ejection phase
  flow.tick(100, { phase: 0.65, bpm: 72 });
  const matAfter = new THREE.Matrix4();
  meshOxy.getMatrixAt(0, matAfter);

  assert.notDeepEqual(matBefore.elements, matAfter.elements, 'Particles advanced after tick');
  // Velocity color coding: instance colors exist and differ between a fast
  // ejection phase and a quiescent one for the aortic stream's particles.
  assert.ok(meshOxy.instanceColor, 'Per-instance velocity colors');
  const colorAt = (idx) => { const a = meshOxy.instanceColor.array; return [a[idx * 3], a[idx * 3 + 1], a[idx * 3 + 2]]; };
  const ejectColor = colorAt(0);
  flow.tick(16, { phase: 0.15, bpm: 72 });
  assert.notDeepEqual(colorAt(0), ejectColor, 'Velocity color changes with the cardiac phase');
  // Trails shrink toward the tail: the first trail sphere outscales the last.
  const m = new THREE.Matrix4();
  const scaleOf = (idx) => { trails.getMatrixAt(idx, m); return new THREE.Vector3().setFromMatrixScale(m).x; };
  assert.ok(scaleOf(0) > scaleOf(8), 'Comet trail tapers');
  assert.ok(trails.instanceColor, 'Trails carry velocity colors');
  flow.tick(16, { phase: 0.65, bpm: 72 });
  // Tube opacity follows the gate: the aortic tube brightens in ejection.
  const tubeOf = (id) => tubes.children.find((t) => t.name === `Flow stream tube: ${id}`);
  const aortaEject = tubeOf('lv-aorta').material.opacity;
  flow.tick(16, { phase: 0.15, bpm: 72 });
  assert.ok(tubeOf('lv-aorta').material.opacity < aortaEject, 'Aortic tube dims in filling');
  flow.tick(16, { phase: 0.65, bpm: 72 });

  // Low power mode test
  flow.setLowPower(true);
  assert.equal(flow.getLowPower(), true, 'Low power enabled');
  flow.tick(50, { phase: 0.65, bpm: 72 });

  // Mesh instance count should be halved for GPU optimization
  assert.equal(meshOxy.count, 120, 'Active particle count halved to 120 in low power mode');
  assert.equal(meshDeoxy.count, 120, 'Active deoxy particle count halved to 120 in low power mode');

  // Visibility toggle
  flow.setVisible(false);
  assert.equal(flow.getVisible(), false);
  assert.equal(flow.group.visible, false);

  // Dispose
  flow.dispose();
  console.log('PASS: InstancedMesh lifecycle, low-power mode, and disposal verified');
}

console.log('\nALL BLOOD FLOW UNIT TESTS PASSED!');
