import assert from 'node:assert/strict';
import { createEPLandmarks } from '../src/ep-landmarks.js';
import { rawStructures as structures } from '../src/content.js';

// Explicit fallback fixture, tests scene behavior, not clinical anatomy.
const ep = createEPLandmarks({ sourceCenter: () => null });
ep.setVisible(true);
ep.setStep(1);
const tip = ep.group.getObjectByName('Slow pathway catheter tip');
const target = ep.group.getObjectByName('Slow pathway / septal isthmus (ablation target)');
assert.ok(tip && target);
assert.ok(tip.position.distanceTo(target.position) < 1e-8);
assert.equal(tip.userData.provenance, 'schematic');
assert.equal(target.material.wireframe, true, 'target must not hide the electrode');
assert.ok(structures[tip.userData.pickId].tr.description);
assert.ok(structures[tip.userData.pickId].en.description);
ep.group.traverse(object => {
  const positions = object.geometry?.attributes.position;
  if (positions) assert.ok(Array.from(positions.array).every(Number.isFinite));
});
assert.equal(ep.targets.koch.visible, true);
ep.setStep(0);
assert.equal(ep.targets.koch.visible, false);
ep.setStep(2);
assert.equal(ep.targets.koch.visible, false);
ep.setStep(3);
assert.equal(ep.targets.koch.visible, true);
ep.setVisible(false);
assert.equal(ep.group.visible, false);
console.log('PASS: ablation catheter endpoint, finite geometry, bilingual picking, step visibility');
