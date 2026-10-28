// CSP case finish (src/eps/csp/csp-finish.mjs) and fluoroscopy screening (csp-fluoro.mjs):
// score items, follow-up clinic determinism and decisions, pulsed screening with last image hold.
import assert from 'node:assert/strict';
import { simulate } from '../../src/eps/csp/csp-model.mjs';
import { initialProcedure, act, modelOf, criteria, acceptCheck, startThreshold, thresholdBeat, anatomyOf } from '../../src/eps/csp/csp-procedure.mjs';
import { scoreCase, followUp, gradeFollowUp, FLUORO_LIMIT_S } from '../../src/eps/csp/csp-finish.mjs';
import { createFluoroState, tickFluoro, moved, puff, isLive, contrastOf, clockOf, FPS } from '../../src/eps/csp/csp-fluoro.mjs';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const run = (proc, actions) => actions.reduce((p, a) => act(p, a).proc, proc);

function finishedCase(caseId = 'baseline', slack = 'right') {
  const p0 = initialProcedure(caseId);
  let p = run(p0, [...Array(10).fill({ type: 'torque', delta: 5 }), { type: 'site', level: anatomyOf(p0).lbb }, ...Array(8).fill({ type: 'rotate', turns: 1 })]);
  let t = startThreshold(p);
  for (let i = 0; i < 300 && !t.done; i++) t = thresholdBeat(t, modelOf(p)).test;
  const list = criteria(simulate(modelOf(p)), p, t);
  p = run(p, [{ type: 'accept', reasons: acceptCheck(p, list, t) }, { type: 'pacing', on: false }, { type: 'pacing', on: true },
    { type: 'withdrawSheath', threshold: t.threshold }, { type: 'slit' }, { type: 'slack', value: slack }, { type: 'breath' }]);
  return { p, t, list };
}

test('a clean case scores 100; each missed step costs its own item', () => {
  const { p, t, list } = finishedCase();
  const full = scoreCase(p, list, t, { fluoroSec: 40, sites: 1, complications: 0 });
  assert.equal(full.score, 100); assert.ok(full.items.every(i => i.ok));
  const little = finishedCase('baseline', 'little');
  assert.equal(scoreCase(little.p, little.list, little.t, { fluoroSec: 40 }).items.find(i => i.id === 'slack').ok, false);
  const messy = scoreCase(p, list, t, { fluoroSec: FLUORO_LIMIT_S + 1, sites: 3, complications: 1 });
  assert.deepEqual(messy.items.filter(i => !i.ok).map(i => i.id), ['complications', 'sites', 'fluoro']);
  const unslit = scoreCase({ ...p, finish: { withdraw: true } }, list, t, {});
  assert.equal(unslit.items.find(i => i.id === 'slit').ok, false);
});
test('follow-up clinic: reproducible per seed, decisions follow the thresholds, risk rises with little slack', () => {
  const { p, t } = finishedCase();
  for (const visit of ['day1', 'week6']) for (const seed of [1, 2, 3, 4, 5, 6]) {
    const a = followUp(p, t, visit, seed);
    assert.deepEqual(a, followUp(p, t, visit, seed));
    if (a.captured === 'conduction') assert.equal(a.action, a.output >= 2 * a.thresholds.lbb ? 'keep' : 'increase');
    if (a.dislodged === 'macro') assert.notEqual(a.captured, 'conduction');
    assert.deepEqual(gradeFollowUp(a, { captured: a.captured, action: a.action }), { captured: true, action: true });
  }
  const count = (proc) => Array.from({ length: 200 }, (_, i) => followUp(proc, t, 'week6', i + 1)).filter(f => f.dislodged).length;
  assert.ok(count({ ...p, slack: 'little' }) > count(p) + 20, 'too little slack dislodges more often');
});
test('fluoroscopy screening: pulsed frames while live, one hold frame after, timer counts only live time', () => {
  const fx = createFluoroState(), proc = { depthMm: 3 };
  assert.equal(isLive(fx, 0), false);
  assert.equal(tickFluoro(fx, 0, 16, proc), 'hold'); assert.equal(tickFluoro(fx, 16, 16, proc), null);
  moved(fx, 100); assert.ok(isLive(fx, 200));
  let frames = 0;
  for (let ms = 100; ms < 1100; ms += 10) if (tickFluoro(fx, ms, 10, proc) === 'frame') frames++;
  assert.ok(Math.abs(frames - FPS) <= 1, `about ${FPS} frames per second, got ${frames}`);
  assert.ok(Math.abs(fx.seconds - 1) < .02);
  const after = [];
  for (let ms = 1100; ms < 1700; ms += 10) after.push(tickFluoro(fx, ms, 10, proc));
  assert.equal(after.filter(x => x === 'hold').length, 1, 'one hold frame when auto-fluoro ends');
  const s = fx.seconds;
  assert.equal(tickFluoro(fx, 1700, 10, proc), null); assert.equal(fx.seconds, s, 'no screening, no fluoro time');
  assert.ok(Math.abs(fx.shownDepth - 3) < 1e-9, 'the drawn tip has caught up with the depth');
  fx.auto = false; moved(fx, 2000); assert.equal(isLive(fx, 2100), false, 'auto-fluoro off');
  puff(fx, 3000); assert.ok(contrastOf(fx, 3000) > .99 && contrastOf(fx, 6000) === 0);
  fx.on = true; assert.ok(isLive(fx, 9999));
  assert.equal(clockOf(75), '1:15');
});
console.log(`${passed} finish tests passed`);
