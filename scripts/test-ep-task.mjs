// Narrow QRS tachycardia task (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md, phase B;
// rules: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md). Every classification is traced to
// measured events; an invalid precondition is uninterpretable for every mechanism; the
// true mechanism is never argued against by valid evidence; the existing cases are unchanged.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TASK_CASES, MECHANISMS, TASK_ANSWER, EVIDENCE_STATES, SEPTAL_VA,
  taskOrder, taskBaseline, taskView, classifyEvidence, gradeTask
} from '../src/ep-task.js';
import { SIM_CASES, SIM_SITES, SIM_PARAHIS_OUTPUTS, HIS_PVC_RANGE, simulate } from '../src/ep-maneuver-sim.js';
import { TASK_TEXT } from '../src/ep-task-text.js';
import { EP_SIM_TEXT } from '../src/ep-case-text.js';
import { resolveRef, measure, epRecording } from '../src/ep-cases.js';

const noteText = (lang, key) => TASK_TEXT[lang].notes[key] || EP_SIM_TEXT[lang].reasons[key];

// Baseline: measured from the events, the roving catheter off the strip, rules per storyboard.
const expected = {
  'avnrt-typical': { first: 'his-p', notes: ['shortSeptalVa'], supports: ['avnrt-typical'] },
  'avnrt-atypical': { first: 'cs-910', notes: ['septalVaLong', 'csOstiumTrap'], supports: [] },
  'ap-left-lateral': { first: 'cs-12', notes: ['septalVaLong', 'eccentric'], supports: ['avrt'] },
  'ap-inf-paraseptal': { first: 'cs-910', notes: ['septalVaLong', 'csOstiumTrap'], supports: [] },
  'ap-parahisian': { first: 'his-p', notes: ['septalVaLong', 'septalEarliest'], supports: [] },
  pjrt: { first: 'cs-910', notes: ['septalVaLong', 'csOstiumTrap'], supports: [] },
  'focal-at': { first: 'hra', notes: ['septalVaLong', 'hraEarliest'], supports: ['focal-at'] }
};
for (const caseId of TASK_CASES) {
  const r = taskBaseline(caseId);
  assert.ok(!r.channels.includes('abl-d') && !r.events['abl-d'], `${caseId}: no ablation catheter on the task strip`);
  for (const c of r.calipers) assert.ok(resolveRef(r, c.a) && resolveRef(r, c.b), `${caseId}: ${c.label} resolves`);
  const e = classifyEvidence(r);
  assert.equal(e.first, expected[caseId].first, `${caseId}: earliest A`);
  assert.deepEqual(e.notes, expected[caseId].notes, `${caseId}: rules applied`);
  assert.deepEqual(MECHANISMS.filter((m) => e.states[m] === 'supports'), expected[caseId].supports, `${caseId}: supported mechanisms`);
  assert.equal(e.measures['VA (His)'] < SEPTAL_VA, caseId === 'avnrt-typical', `${caseId}: septal VA read from the events`);
  for (const lang of ['tr', 'en']) for (const key of e.notes) assert.ok(noteText(lang, key), `${key} ${lang}`);
}
// The corrected para-Hisian pathway case: its septal VA is no longer below 70 ms (source B1).
const ph = epRecording('ph-svt');
assert.equal(measure(ph, ph.calipers[1]), 75);

// Every maneuver choice of every hidden case: valid evidence never argues against the true
// mechanism; an invalid precondition classifies as uninterpretable for all five.
let n = 0;
for (const caseId of TASK_CASES) {
  const tcl = SIM_CASES[caseId].tcl;
  const grid = [];
  for (let timing = HIS_PVC_RANGE.min; timing <= HIS_PVC_RANGE.max; timing += 5) grid.push({ maneuver: 'his-pvc', timing });
  for (const site of SIM_SITES) for (let pcl = tcl - 120; pcl <= tcl + 40; pcl += 10) grid.push({ maneuver: 'v-overdrive', site, pcl });
  for (const output of SIM_PARAHIS_OUTPUTS) grid.push({ maneuver: 'para-his', output });
  for (const choice of grid) {
    const r = simulate({ caseId, ...choice });
    const e = classifyEvidence(r);
    n++;
    for (const m of MECHANISMS) assert.ok(EVIDENCE_STATES.includes(e.states[m]));
    if (r.result !== 'valid') {
      assert.deepEqual(new Set(Object.values(e.states)), new Set(['uninterpretable']), `${caseId} ${r.reason}: uninterpretable`);
    } else {
      assert.notEqual(e.states[TASK_ANSWER[caseId]], 'against', `${caseId} ${choice.maneuver} ${r.reason}: true mechanism not argued against`);
      assert.ok(!Object.values(e.states).includes('uninterpretable'), 'valid evidence is interpretable');
    }
    for (const lang of ['tr', 'en']) for (const key of e.notes) assert.ok(noteText(lang, key), `${key} ${lang}`);
    // The task view never carries the roving ablation catheter: not a channel, not an event, not a caliper.
    const view = taskView(r);
    assert.ok(!view.channels.includes('abl-d') && !view.events['abl-d'], `${caseId} ${r.id}: no ablation catheter`);
    assert.ok(view.calipers.every((c) => c.a.ch !== 'abl-d' && c.b.ch !== 'abl-d'));
    assert.equal(view.lab, 'task');
  }
}
assert.ok(n > 300, `${n} maneuver deliveries classified`);

// Key discriminations from maneuvers, as the storyboard lists them.
const ev = (caseId, choice) => classifyEvidence(simulate({ caseId, ...choice }));
assert.equal(ev('pjrt', { maneuver: 'his-pvc', timing: 15 }).states.pjrt, 'supports', 'His-refractory PVC delays the A over a decremental pathway');
assert.equal(ev('ap-left-lateral', { maneuver: 'his-pvc', timing: 15 }).states.avrt, 'supports');
assert.equal(ev('avnrt-typical', { maneuver: 'his-pvc', timing: 15 }).states.avrt, 'neutral', 'a negative His-refractory PVC does not exclude a pathway');
assert.equal(ev('focal-at', { maneuver: 'v-overdrive', pcl: 370 }).states['focal-at'], 'supports', 'A-A-V');
assert.equal(ev('avnrt-atypical', { maneuver: 'v-overdrive', pcl: 350 }).states['avnrt-atypical'], 'supports', 'long PPI-TCL and SA-VA');
assert.equal(ev('ap-inf-paraseptal', { maneuver: 'para-his', output: 'standard' }).states.avrt, 'supports', 'extranodal para-Hisian response');
assert.equal(ev('pjrt', { maneuver: 'para-his', output: 'standard' }).states.avrt, 'neutral', 'a nodal response does not exclude a pathway');
assert.deepEqual(new Set(Object.values(ev('ap-parahisian', { maneuver: 'para-his', output: 'direct-a' }).states)), new Set(['uninterpretable']));

// Every case can be solved: the evidence set of the baseline and the three default maneuvers
// supports its true mechanism at least once.
for (const caseId of TASK_CASES) {
  const evidence = [classifyEvidence(taskBaseline(caseId)),
    ev(caseId, { maneuver: 'his-pvc', timing: 15 }), ev(caseId, { maneuver: 'v-overdrive', pcl: SIM_CASES[caseId].tcl - 30 }), ev(caseId, { maneuver: 'para-his', output: 'standard' })];
  const g = gradeTask(caseId, TASK_ANSWER[caseId], evidence);
  assert.equal(g.grade, 'correct');
  assert.ok(g.support >= 1 && g.against === 0, `${caseId}: supported ${g.support}, against ${g.against}`);
}
assert.equal(gradeTask('pjrt', 'avrt').grade, 'partial');
assert.equal(gradeTask('focal-at', 'avrt').grade, 'incorrect');

// Seeded order: a permutation of the cases, reproducible.
assert.deepEqual([...taskOrder(7)].sort(), [...TASK_CASES].sort());
assert.deepEqual(taskOrder(7), taskOrder(7));
assert.notDeepEqual(taskOrder(7), taskOrder(8));

for (const lang of ['tr', 'en']) for (const m of MECHANISMS) assert.ok(TASK_TEXT[lang].mechanisms[m] && TASK_TEXT[lang].short[m]);
for (const file of ['../src/ep-task.js', '../src/ep-task-text.js', '../src/ep-task-panel.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log(`PASS ep-task: 7 hidden cases, baseline rules from events, ${n} maneuver deliveries classified (invalid = uninterpretable, true mechanism never argued against), every case solvable, seeded order`);
