// Interactive maneuver model (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md,
// section 15): the learner's choice changes the recording, an invalid
// precondition never gives a diagnostic result, the same choices give the
// same recording, and every generated strip is measurable and inside its window.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIM_CASES, SIM_MANEUVERS, SIM_SITES, SIM_PARAHIS_OUTPUTS, HIS_PVC_RANGE, simulate, simMeasures, defaultChoices, choiceKey } from '../src/ep-maneuver-sim.js';
import { EP_SIM_TEXT } from '../src/ep-case-text.js';
import { resolveRef } from '../src/ep-cases.js';

const inWindow = (r) => Object.values(r.events).every((list) => list.every((e) => e.t >= 0 && e.t <= r.windowMs));

// Every case, maneuver and choice: finite measurements, events inside the window, known result and reason text.
const grid = [];
for (const caseId of Object.keys(SIM_CASES)) {
  const tcl = SIM_CASES[caseId].tcl;
  for (let timing = HIS_PVC_RANGE.min; timing <= HIS_PVC_RANGE.max; timing += 10) grid.push({ caseId, maneuver: 'his-pvc', timing });
  for (const site of SIM_SITES) for (const pcl of [tcl - 100, tcl - 60, tcl - 30, tcl - 10, tcl, tcl + 30]) grid.push({ caseId, maneuver: 'v-overdrive', site, pcl });
  for (const output of SIM_PARAHIS_OUTPUTS) grid.push({ caseId, maneuver: 'para-his', output });
}
for (const choice of grid) {
  const r = simulate(choice);
  assert.ok(inWindow(r), `${choiceKey(r.choices)}: events inside the window`);
  for (const [label, value] of Object.entries(simMeasures(r))) assert.ok(Number.isFinite(value), `${choiceKey(r.choices)}: ${label} measured`);
  assert.ok(['valid', 'invalidCapture', 'insufficientEvidence'].includes(r.result));
  for (const lang of ['tr', 'en']) assert.ok(EP_SIM_TEXT[lang].reasons[r.reason], `${r.reason} ${lang} text`);
  assert.ok(Object.isFrozen(r) && Object.isFrozen(r.events), 'frozen recording');
}
assert.ok(grid.length > 150, `${grid.length} choice sets exercised`);

// Reproducible state: the same choices give the same recording; a different choice changes it.
const a = simulate({ caseId: 'ap-left-lateral', maneuver: 'his-pvc', timing: 15 });
assert.deepEqual(simulate({ caseId: 'ap-left-lateral', maneuver: 'his-pvc', timing: 15 }), a, 'same choices, same recording');
assert.equal(a.id, `sim:${choiceKey(a.choices)}`);
assert.notDeepEqual(simulate({ caseId: 'ap-left-lateral', maneuver: 'his-pvc', timing: -30 }).events, a.events, 'timing changes the recording');

// His-refractory PVC: the window decides validity; only a valid PVC reads participation.
const hisPvc = (caseId, timing) => simulate({ caseId, maneuver: 'his-pvc', timing });
for (const caseId of Object.keys(SIM_CASES)) {
  assert.equal(hisPvc(caseId, -30).result, 'insufficientEvidence', `${caseId}: stimulus before H is not His-refractory`);
  assert.equal(hisPvc(caseId, -30).feedback.hisRefractory, false);
  assert.equal(hisPvc(caseId, 45).result, 'invalidCapture', `${caseId}: stimulus in refractory ventricle does not capture`);
  assert.equal(hisPvc(caseId, 45).feedback.capture, false);
  const valid = hisPvc(caseId, 15);
  assert.equal(valid.result, 'valid');
  const m = simMeasures(valid);
  const model = SIM_CASES[caseId];
  assert.equal(m.TCL - m['A-A'], model.pull, `${caseId}: A moves by the model's pull (${model.pull})`);
  // The committed H of the beat precedes the stimulus (His refractory).
  const s = resolveRef(valid, { ch: 'rv', type: 'S', occ: 0 });
  const priorH = valid.events['his-d'].filter((e) => e.type === 'H' && e.t <= s.t).pop();
  assert.ok(priorH && s.t - priorH.t === 15);
}
assert.equal(hisPvc('ap-left-lateral', 15).reason, 'aAdvanced');
assert.equal(hisPvc('avnrt-typical', 15).reason, 'aUnchanged');
assert.equal(hisPvc('pjrt', 15).reason, 'aDelayed', 'decremental pathway delays the A');
assert.equal(hisPvc('focal-at', 15).reason, 'aUnchanged');

// Ventricular overdrive: not faster or too fast is not diagnostic; V-A-V vs A-A-V by mechanism; differential RV pacing.
const vop = (caseId, pcl, site = 'rv-apex') => simulate({ caseId, maneuver: 'v-overdrive', pcl, site });
for (const caseId of Object.keys(SIM_CASES)) {
  const tcl = SIM_CASES[caseId].tcl;
  assert.equal(vop(caseId, tcl + 20).result, 'insufficientEvidence', `${caseId}: slower than TCL`);
  assert.equal(vop(caseId, tcl + 20).feedback.entrained, false);
  assert.equal(vop(caseId, tcl - 100).reason, 'terminated', `${caseId}: too fast terminates`);
  assert.equal(vop(caseId, tcl - 30).result, 'valid');
  assert.equal(vop(caseId, tcl - 30).feedback.entrained, true);
}
assert.equal(vop('focal-at', 370).reason, 'AAV', 'focal AT: A-A-V');
assert.equal(vop('avnrt-typical', 330).reason, 'VAV');
const ppiTcl = (caseId, site) => { const m = simMeasures(vop(caseId, SIM_CASES[caseId].tcl - 30, site)); return m.PPI - m.TCL; };
assert.equal(ppiTcl('avnrt-typical', 'rv-apex'), 150, 'PPI-TCL measured from the events');
assert.ok(ppiTcl('avnrt-typical', 'rv-base') - ppiTcl('avnrt-typical', 'rv-apex') > 30, 'AVNRT: base farther from the circuit than apex');
assert.ok(ppiTcl('ap-inf-paraseptal', 'rv-base') < ppiTcl('ap-inf-paraseptal', 'rv-apex'), 'septal pathway: base closer');
const saVa = (caseId) => { const m = simMeasures(vop(caseId, SIM_CASES[caseId].tcl - 30)); return m.SA - m.VA; };
assert.ok(saVa('avnrt-typical') > 85 && saVa('ap-inf-paraseptal') < 85, 'SA-VA contrast (R12 teaching values)');
// No PPI without entrainment.
assert.ok(!('PPI' in simMeasures(vop('avnrt-typical', 400))), 'no PPI when pacing is not faster');

// Para-Hisian: nodal / extranodal by case; direct A capture and pure His capture are not diagnostic.
const ph = (caseId, output) => simulate({ caseId, maneuver: 'para-his', output });
assert.equal(ph('ap-parahisian', 'standard').reason, 'extranodal');
assert.equal(ph('avnrt-typical', 'standard').reason, 'nodal');
assert.equal(ph('pjrt', 'standard').reason, 'nodal', 'decremental pathway masked by nodal conduction');
assert.equal(ph('ap-left-lateral', 'standard').reason, 'nodal', 'far left pathway masked');
assert.match(EP_SIM_TEXT.tr.reasons.nodal, /maskelenebilir/);
for (const caseId of Object.keys(SIM_CASES)) {
  assert.equal(ph(caseId, 'direct-a').result, 'invalidCapture');
  assert.equal(ph(caseId, 'pure-his').result, 'insufficientEvidence');
  const m = simMeasures(ph(caseId, 'standard'));
  if (ph(caseId, 'standard').reason === 'nodal') assert.ok(m['S-A (RV)'] > m['S-A (His+RV)']);
  else assert.equal(m['S-A (RV)'], m['S-A (His+RV)']);
}

// Defaults are valid starting points; text covers every control in both languages.
for (const caseId of Object.keys(SIM_CASES)) for (const maneuver of SIM_MANEUVERS) {
  assert.equal(simulate(defaultChoices(caseId, maneuver)).result, 'valid', `${caseId} ${maneuver}: default choice is valid`);
}
for (const lang of ['tr', 'en']) {
  const t = EP_SIM_TEXT[lang];
  assert.ok(SIM_MANEUVERS.every((m) => t.maneuvers[m]) && SIM_SITES.every((s) => t.sites[s]) && SIM_PARAHIS_OUTPUTS.every((o) => t.outputs[o]));
}
for (const file of ['../src/ep-maneuver-sim.js', '../src/ep-sim-panel.js', '../src/ep-fullscreen.js', '../src/ep-activation-map.js', '../src/ep-beats.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log(`PASS ep-sim: ${grid.length} choice sets, reproducible state, His-refractory window, entrainment conditions, V-A-V/A-A-V, differential RV pacing, para-Hisian capture states`);
