// CSP implant procedure (src/eps/csp/csp-procedure.mjs) and live recorder (csp-live.mjs):
// site, sheath and turns map onto the signal model; the criteria read the recording.
import assert from 'node:assert/strict';
import { simulate } from '../../src/eps/csp/csp-model.mjs';
import { initialProcedure, act, modelOf, stageOf, criteria, guidance, startThreshold, thresholdBeat, summary, offsetOf, thicknessOf, fromModel, ANATOMY } from '../../src/eps/csp/csp-procedure.mjs';
import { createRecorder, advance, beatFromResult } from '../../src/eps/csp/csp-live.mjs';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const run = (proc, actions) => actions.reduce((p, a) => act(p, a).proc, proc);
const status = (list, id) => list.find(c => c.id === id).status;
const onTarget = caseId => run(initialProcedure(caseId), [...Array(5).fill({ type: 'torque', delta: 10 }), { type: 'site', level: ANATOMY[caseId].lbb }]);

test('start: tip on the anterior free wall, wide QRS, guidance to torque counter-clockwise', () => {
  const p = initialProcedure();
  assert.ok(offsetOf(p.sheath) < -.5 && thicknessOf(p) === 5);
  const r = simulate(modelOf(p));
  assert.equal(r.capture.type, 'rv'); assert.ok(r.metrics.qrsDuration > 160);
  assert.equal(guidance(p, r, criteria(r, p)).key, 'offAnterior');
  assert.equal(stageOf(p), 0);
});
test('torque and site bring the pace map: stage 1, septal level sets the limb-lead axis', () => {
  const p = onTarget('baseline');
  assert.equal(p.sheath, 0); assert.equal(stageOf(p), 1);
  const r = simulate(modelOf(p));
  assert.equal(guidance(p, r, criteria(r, p)).key, 'paceMapOk');
  const basal = simulate(modelOf({ ...p, level: .1 })), apical = simulate(modelOf({ ...p, level: .8 }));
  const peak = (values, sign) => Math.max(...values.slice(55, 250).map(v => sign * v));
  assert.ok(peak(basal.leads.III, 1) > peak(basal.leads.III, -1), 'basal septum: III positive');
  assert.ok(peak(apical.leads.II, -1) > peak(apical.leads.II, 1), 'apical septum: II negative');
});
test('turns advance the helix, the V1 notch becomes a terminal r′ and LBB capture meets the criteria', () => {
  let p = onTarget('baseline');
  const seen = [];
  for (let i = 0; i < 8; i++) { p = act(p, { type: 'rotate', turns: 1 }).proc; seen.push(simulate(modelOf(p)).capture.type); }
  assert.equal(seen[0], 'rv'); assert.equal(seen.at(-1), 'nonselective');
  assert.ok(seen.includes('deep'));
  const r = simulate(modelOf(p)), list = criteria(r, p);
  for (const id of ['terminalR', 'v6Rwpt', 'interpeak', 'safety', 'fixation']) assert.equal(status(list, id), 'met', id);
  assert.equal(status(list, 'transition'), 'untested');
  assert.equal(guidance(p, r, list).key, 'confirmTest');
  assert.equal(stageOf(p), 3);
});
test('one turn too many perforates; unscrewing comes back into the septum', () => {
  let p = run(onTarget('baseline'), Array(9).fill({ type: 'rotate', turns: 1 }));
  assert.equal(simulate(modelOf(p)).capture.type, 'perforation');
  const back = act(p, { type: 'unscrew' });
  assert.ok(back.events.some(e => e.type === 'withdrawn'));
  assert.notEqual(simulate(modelOf(back.proc)).capture.type, 'perforation');
  assert.ok(act(p, { type: 'accept' }).events.some(e => e.type === 'acceptRefused'));
});
test('screwed in: site and sheath are locked; a large sheath angle drills in place', () => {
  const p = act(onTarget('baseline'), { type: 'rotate', turns: 1 }).proc;
  assert.equal(act(p, { type: 'torque', delta: 10 }).events[0].type, 'locked');
  assert.equal(act(p, { type: 'site', level: .6 }).proc.level, p.level);
  const skewed = { ...onTarget('baseline'), sheath: 60 };
  const out = act(skewed, { type: 'rotate', turns: 1 });
  assert.ok(out.events.some(e => e.type === 'drilling')); assert.ok(out.proc.depthMm < .3);
});
test('live threshold test steps down, logs the transition and finds the threshold', () => {
  const p = run(onTarget('baseline'), Array(8).fill({ type: 'rotate', turns: 1 }));
  let t = startThreshold(p); const events = [];
  for (let i = 0; i < 300 && !t.done; i++) { const o = thresholdBeat(t, modelOf(p)); t = o.test; events.push(...o.events); }
  assert.ok(t.done); assert.ok(t.rows.length > 5);
  assert.ok(events.some(e => e.type === 'transition'));
  assert.ok(t.threshold > 0 && t.threshold < 1.5);
  const r = simulate(modelOf(p)), list = criteria(r, p, t);
  assert.equal(status(list, 'transition'), 'met');
  assert.equal(summary(act(p, { type: 'accept' }).proc, r, list, t).verdict, 'lbbp');
});
test('teaching cases differ: scar never reaches conduction tissue, equal thresholds show no transition', () => {
  const scar = run(onTarget('scar'), Array(14).fill({ type: 'rotate', turns: 1 }));
  assert.ok(!['nonselective', 'selective'].includes(simulate(modelOf(scar)).capture.type));
  let equal = onTarget('equal');
  for (let i = 0; i < 12 && simulate(modelOf(equal)).capture.type !== 'nonselective'; i++) equal = act(equal, { type: 'rotate', turns: 1 }).proc;
  let t = startThreshold(equal);
  for (let i = 0; i < 300 && !t.done; i++) t = thresholdBeat(t, modelOf(equal)).test;
  assert.equal(t.transitions.length, 0);
});
test('instructor values map back onto the physical state', () => {
  const p = fromModel(onTarget('baseline'), { depth: .5, angle: 20, level: .4 });
  const m = modelOf(p);
  assert.ok(Math.abs(m.depth - .5) < 1e-9); assert.equal(m.angle, 20); assert.equal(m.level, .4);
});
test('recorder writes beats back to back with the pacing interval', () => {
  const rec = createRecorder(50);
  const r = simulate({});
  const starts = [];
  for (let i = 0; i < 8; i++) advance(rec, 250, time => { starts.push(time); return beatFromResult(r, 600); });   // a frame advances at most 250 ms
  assert.deepEqual(starts.slice(0, 3), [1, 601, 1201]);
  assert.ok(rec.buffers.V6.some(v => Math.abs(v) > .1));
  const fixation = beatFromResult(r, 600, { stimulus: false });
  assert.ok(Math.abs(fixation.channels.I[50]) < Math.abs(beatFromResult(r, 600).channels.I[50]), 'no pacing artefact');
});
console.log(`${passed} procedure tests passed`);
