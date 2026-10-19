// The ECG simulator's conduction band follows the synthesized trace: stages in
// beat order for sinus rhythm, no SA-node or atrial-spread stage without an
// organized sinus P (AF, flutter), none in VF, and no ventricular stages on a
// dropped Mobitz beat.
import assert from 'node:assert/strict';
import { conductionTimeline, conductionAt, CLINICAL_CONDITIONS } from '../src/ecg/clinical-ecg-simulator.js';

const cond = id => CLINICAL_CONDITIONS.find(c => c.id === id);
const stagesOf = (c, beat = 0) => {
  const tl = conductionTimeline(c), seen = [];
  for (let k = 0; k < 1000; k++) {
    const id = conductionAt(tl, k / 1000, beat).id;
    if (id && seen.at(-1) !== id) seen.push(id);
  }
  return seen;
};

const sinus = CLINICAL_CONDITIONS.find(c => !c.morph || Object.keys(c.morph).length === 0) || cond('anterior_stemi');
assert.deepEqual(stagesOf(sinus), ['sa', 'atria', 'avn', 'his', 'branches', 'purkinje', 'repol'], 'sinus: SA to repolarization in order');
const msAlong = [0.1, 0.2, 0.28, 0.32, 0.45].map(p => conductionAt(conductionTimeline(sinus), p).ms).filter(v => v !== null);
assert.deepEqual([...msAlong].sort((a, b) => a - b), msAlong, 'scrubber ms grows through the beat');

const af = stagesOf(cond('afib'));
assert.ok(!af.includes('sa') && !af.includes('atria'), 'AF: no SA-node or atrial-spread stage');
assert.ok(af.includes('fibrillation') && af.includes('purkinje'), 'AF: fibrillating atria, ventricles still activated');

const vf = CLINICAL_CONDITIONS.find(c => c.morph?.vfib);
if (vf) assert.deepEqual(stagesOf(vf), [], 'VF: no organized stage');

const mobitz = CLINICAL_CONDITIONS.find(c => c.morph?.mobitz2);
if (mobitz) {
  assert.ok(!stagesOf(mobitz, 2).includes('purkinje'), 'Mobitz II: the dropped beat has no ventricular stage');
  assert.ok(stagesOf(mobitz, 0).includes('purkinje'), 'Mobitz II: conducted beats do');
}
console.log('PASS conduction band: sinus order and monotone ms, AF without SA/atrial stages, VF none, Mobitz dropped beat');
