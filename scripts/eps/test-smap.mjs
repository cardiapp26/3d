// Substrate mapping model (src/eps/smap-model.js): each teaching claim of the
// Substrate tab, read from the grid. Voltage cut-offs (Marchlinski) make the
// scar one area at 0.5 mV and show the channels at 0.2 mV (Arenal); late
// potentials sit in the channels after the QRS; entrainment classifies the
// sites as in Stevenson's scheme (exit, central, proximal, outer loop,
// adjacent and remote bystander) with S-QRS - EGM-QRS about twice the
// bystander's distance; the strategies of Cardiac Mapping chapter 69 stop
// the clinical VT and differ in what they leave; in the non-ischaemic
// scenario only the unipolar map shows the epicardial substrate.
import assert from 'node:assert/strict';
import { SCENARIOS, STRATEGIES, CUTOFFS, tissue, voltageClass, beat, electrogram, egmTrace, unipolarTrace, egmMap, vt, entrain, lesions, outcome, cellOf, cellKey } from '../../src/eps/smap-model.js';
import { SMAP_TEXT } from '../../src/eps/smap-text.js';

const s = SCENARIOS.ischemic;
const t = tissue('ischemic');
const keys = (cells) => cells.map(([x, y]) => cellKey(x, y));
const isthmus = keys(s.channels.isthmus.cells), all = keys(Object.values(s.channels).flatMap((c) => c.cells));

// Voltage: wall normal, border 0.5-1.5, dense scar < 0.2, channels 0.2-0.5.
for (let k = 0; k < t.size; k++) {
  const v = t.bipolar[k];
  if (t.type[k] === 'wall') assert.ok(v > 1.5, `wall ${cellOf(k)} ${v}`);
  if (t.type[k] === 'border') assert.ok(v >= 0.5 && v <= 1.5, `border ${v}`);
  if (t.type[k] === 'scar') assert.ok(v < 0.2, `dense scar ${v}`);
  if (t.type[k] === 'channel') assert.ok(v > 0.2 && v < 0.5, `channel ${v}`);
}
assert.ok(all.every((k) => voltageClass(t.bipolar[k], 0.5) === 'scar'), 'at 0.5 mV the channels hide in the scar');
assert.ok(all.every((k) => voltageClass(t.bipolar[k], 0.2) === 'border'), 'at 0.2 mV the channels appear');

// Sinus rhythm: late potentials in the channels only, after the QRS, isolated from the far field.
const sinus = egmMap('ischemic', 'sinus');
const lp = [...sinus].filter(([, kind]) => kind === 'lp').map(([k]) => k);
assert.ok(lp.length >= 4, `late potentials found (${lp.length})`);
assert.ok(lp.every((k) => t.type[k] === 'channel'), 'late potentials only in channels');
const b = beat('ischemic', 'sinus');
for (const k of lp) { const e = electrogram('ischemic', cellOf(k)); assert.ok(e.local > b.end && e.gap >= 20, 'LP after the QRS, 20 ms or more after the far field'); }
assert.equal(electrogram('ischemic', s.sites.exit).kind, 'lava', 'the exit end: near field inside the QRS (LAVA)');
assert.equal(electrogram('ischemic', s.sites.remote).kind, 'normal', 'remote septum: normal EGM');
assert.equal(electrogram('ischemic', [24, 12]).kind, 'none', 'dense scar: noise level');
assert.ok(beat('ischemic', 'rv').end > b.end + 40, 'RV apical pacing: a wider QRS');
// Unipolar beside the bipole: steepest downstroke at the local activation over muscle; the far field stays over scar.
const p2p = (a) => Math.max(...a) - Math.min(...a);
const wallEgm = electrogram('ischemic', s.sites.remote), wallUni = unipolarTrace(wallEgm, 400);
const drops = Array.from(wallUni, (v, i) => (i ? wallUni[i - 1] - v : -Infinity));
const steepest = drops.indexOf(Math.max(...drops));
assert.ok(Math.abs(steepest - wallEgm.local) <= 1, 'wall: unipolar -dV/dt at the local activation');
for (const site of [s.sites.central, [24, 12]]) {
  const e = electrogram('ischemic', site);
  assert.ok(p2p(unipolarTrace(e, 400)) > 3 * p2p(egmTrace(e, 400)), 'scar / channel: unipolar keeps the far field');
}

// The VT: through the isthmus and around the scar.
const circuit = vt('ischemic');
assert.ok(circuit.tcl > 300 && circuit.tcl < 450, `VT cycle ${circuit.tcl}`);
assert.ok(circuit.I > circuit.O, 'most of the cycle is spent in the slow isthmus (diastole)');

// Entrainment classes (Stevenson).
const at = (name) => entrain('ischemic', s.sites[name]);
for (const [name, cls] of [['exit', 'exit'], ['central', 'central'], ['proximal', 'proximal'], ['bystander', 'adjacent'], ['strand', 'remote'], ['outerLoop', 'outer'], ['remote', 'remote']]) {
  assert.equal(at(name).cls, cls, `${name} -> ${cls}`);
}
for (const k of isthmus) {
  const r = entrain('ischemic', cellOf(k));
  assert.ok(r.concealed && r.ppiMinusTcl === 0 && Math.abs(r.delta) <= 20, 'isthmus: concealed fusion, PPI = TCL, S-QRS = EGM-QRS');
}
const by = at('bystander');
assert.ok(by.concealed && by.ppiMinusTcl > 30, 'bystander: concealed but a long PPI');
assert.ok(Math.abs(by.delta - by.ppiMinusTcl) <= 20, 'bystander: S-QRS - EGM-QRS about the PPI excess (twice the distance)');
assert.ok(!at('outerLoop').concealed && at('outerLoop').ppiMinusTcl <= 30, 'outer loop: manifest fusion, PPI = TCL');
assert.ok(at('central').josephson && !by.josephson && !at('outerLoop').josephson, 'Josephson criteria at the isthmus only');
assert.equal(entrain('ischemic', [24, 12]).capture, false, 'no capture in dense scar');
// The S-QRS / TCL ratio grows from the exit to the entrance.
const ratios = isthmus.map((k) => entrain('ischemic', cellOf(k)).ratio);
assert.ok(ratios.every((r, i) => i === 0 || r < ratios[i - 1]), 'ratio falls toward the exit');

// Strategies.
const res = Object.fromEntries(STRATEGIES.map((id) => [id, outcome('ischemic', id)]));
assert.equal(res.none.vtInducible, true);
for (const id of STRATEGIES.filter((x) => x !== 'none')) assert.equal(res[id].vtInducible, false, `${id} stops the clinical VT`);
assert.ok(res.clinical.residual.lp > 0, 'clinical VT ablation leaves late potentials in the other channels');
assert.equal(res.dechanneling.residual.lp + res.dechanneling.residual.lava, 0, 'dechanneling disconnects every channel');
assert.equal(res.core.exitBlock, true, 'core isolation: exit block');
assert.equal(res.homogenization.residual.lp + res.homogenization.residual.lava, 0, 'homogenization leaves no abnormal channel signal');
assert.ok(res.homogenization.lesions > res.core.lesions && res.core.lesions > res.lp.lesions && res.dechanneling.lesions <= res.lp.lesions, 'homogenization > core > LP >= dechanneling (lesions)');
assert.ok([...lesions('ischemic', 'clinical')].every((k) => isthmus.includes(k)), 'clinical lesions in the isthmus');
assert.equal(entrain('ischemic', s.sites.central, lesions('ischemic', 'clinical')), null, 'no VT to entrain after ablation');

// Non-ischaemic: endocardial bipolar normal, unipolar low over the epicardial scar.
const n = tissue('nicm');
for (const [x, y] of SCENARIOS.nicm.epicardial) {
  const k = cellKey(x, y);
  assert.ok(n.bipolar[k] > 1.5 && n.unipolar[k] < CUTOFFS.unipolar, 'epicardial substrate: bipolar normal, unipolar low');
}
assert.equal(vt('nicm'), null);

// Texts: every scenario, site, strategy and class in both languages.
for (const lang of ['tr', 'en']) {
  const x = SMAP_TEXT[lang];
  for (const id of Object.keys(SCENARIOS)) for (const site of Object.keys(SCENARIOS[id].sites)) assert.ok(x.scenarios[id].sites[site], `${lang} ${id} ${site}`);
  for (const id of STRATEGIES) assert.ok(x.strategies[id] && x.strategyText[id], `${lang} ${id}`);
  for (const id of ['exit', 'central', 'proximal', 'inner', 'outer', 'adjacent', 'remote', 'noCapture', 'noVt']) assert.ok(x.classes[id], `${lang} class ${id}`);
  for (const id of ['normal', 'abnormal', 'lava', 'lp', 'none']) assert.ok(x.kinds[id], `${lang} kind ${id}`);
}
console.log('PASS substrate mapping model');
