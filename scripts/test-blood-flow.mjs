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
  assert.equal(flow.group.children.length, 2, 'Two instanced meshes in group (Deoxy and Oxy)');

  const [meshDeoxy, meshOxy] = flow.group.children;
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
