// Pace mapping model (src/eps/pmap-model.js): each teaching claim of the
// Pace map tab, read from the grid. Pacing at the source reproduces the
// template and the match falls off within millimetres; output hardly
// matters in smooth myocardium; a short coupling interval or a fused beat
// changes the QRS at the right site; the papillary muscle matches from its
// tip but not when the catheter also touches the wall or at high output;
// a fascicular source never matches fully; in scar a bystander matches with
// a long stim-QRS and a long PPI - TCL, the isthmus mismatches in sinus
// rhythm but matches during VT, high output at the isthmus captures an
// adjacent strand, and a short coupling interval sends the wave out of the
// entrance (the paired VT).
import assert from 'node:assert/strict';
import { SCENARIOS, LEADS, paceAt, scoreMap, cellOf } from '../../src/eps/pmap-model.js';
import { PMAP_TEXT } from '../../src/eps/pmap-text.js';

const pace = (id, site, opts) => paceAt(id, SCENARIOS[id].sites[site] || site, opts);

// Focal PVC: the source reproduces the template; a few mm away still close; 1 cm and further clearly different.
const origin = pace('focal', 'origin');
assert.equal(origin.perLead.length, LEADS.length);
assert.ok(origin.score > 99.5, `source matches (${origin.score})`);
assert.ok(pace('focal', [14, 4]).score > 97, 'one pixel away still close');
assert.ok(pace('focal', 'near').score < 90, '1 cm away clearly lower');
assert.ok(pace('focal', 'far').score < 50, 'remote site does not match');
const best = [...scoreMap('focal')].sort((a, b) => b[1] - a[1])[0];
assert.deepEqual(cellOf(best[0]), SCENARIOS.focal.sites.origin, 'the match map peaks at the source');
// Output in smooth myocardium: little change; coupling interval and fusion: the right site gives another QRS.
assert.ok(pace('focal', 'origin', { output: 'high' }).score > 97, 'smooth myocardium: output hardly matters');
assert.ok(pace('focal', 'origin', { ci: 340 }).score > 99, 'band recovered at 340 ms');
assert.ok(pace('focal', 'origin', { ci: 280 }).score < 90, 'band not recovered at 280 ms');
assert.ok(pace('focal', 'origin', { fusion: true }).score < 90, 'a fused beat does not match');
assert.ok(origin.sqrs < 20, 'healthy myocardium: short stim-QRS');

// Papillary muscle: tip matches with a longer stim-QRS; touching both surfaces, or high output, does not.
const base = pace('papillary', 'base'), tip = pace('papillary', 'tip');
assert.ok(base.score > 99 && tip.score > 97, 'base and tip match at threshold');
assert.ok(tip.sqrs > base.sqrs + 20, 'tip: longer stim-QRS');
assert.ok(pace('papillary', 'between').score < 70, 'catheter on both surfaces: poor match');
assert.ok(pace('papillary', 'base', { output: 'high' }).score < 90, 'high output captures the adjacent wall');
assert.ok(pace('papillary', 'wall').score < 85, 'the adjacent wall does not match');

// Fascicular: even the source does not match fully; nowhere does; the source has the earliest Purkinje potential.
const fasc = pace('fascicular', 'origin');
assert.ok(fasc.score < 92, `source: incomplete match (${fasc.score})`);
assert.ok(Math.max(...scoreMap('fascicular').values()) < 95, 'no site matches fully');
assert.ok(fasc.capture.length > 1, 'Purkinje and local myocardium captured together');
assert.ok(fasc.purkinjeLead > 0 && fasc.purkinjeLead > (pace('fascicular', [8, 8]).purkinjeLead ?? -Infinity), 'earliest Purkinje potential at the source');

// Scar VT.
const tcl = pace('scar', 'remote').template.tcl;
assert.ok(tcl > 350 && tcl < 500, `VT cycle length (${tcl})`);
const exit = pace('scar', 'exit');
assert.ok(exit.score > 97 && exit.sqrs < 20, 'exit: match with a short stim-QRS');
const bystander = pace('scar', 'bystander');
assert.ok(bystander.score > 97 && bystander.sqrs > 100, 'bystander: match with a long stim-QRS');
assert.ok(pace('scar', 'bystander', { mode: 'vt' }).ppiMinusTcl > 100, 'bystander: long PPI - TCL');
const isthmusSinus = pace('scar', 'isthmus'), isthmusVt = pace('scar', 'isthmus', { mode: 'vt' });
assert.ok(isthmusSinus.score < 80, `isthmus in sinus: both ends exit (${isthmusSinus.score})`);
assert.ok(isthmusVt.score > 99 && isthmusVt.ppiMinusTcl <= 10, 'isthmus during VT: match, PPI - TCL ~ 0');
const deep = pace('scar', 'deep'), deepHigh = pace('scar', 'deep', { output: 'high' });
assert.ok(deep.score > 97 && deep.sqrs > 60, 'isthmus near the exit at threshold: match, long stim-QRS');
assert.ok(deepHigh.score < 80 && deepHigh.sqrs < deep.sqrs - 40, 'high output: adjacent strand, short stim-QRS, other QRS');
assert.ok(pace('scar', 'strand').score < 80, 'the adjacent strand exits elsewhere');
const paired = pace('scar', 'deep', { ci: 340, templateId: 'vt2' });
assert.ok(pace('scar', 'deep', { ci: 340 }).score < 50 && paired.score > 97, 'short coupling: the exit channel blocks, the wave leaves at the entrance (VT 2)');
assert.equal(pace('scar', [16, 11]).paced, null, 'dense scar: no capture');

// Texts: both languages carry every scenario, site, template and control.
for (const lang of ['tr', 'en']) {
  const t = PMAP_TEXT[lang];
  for (const [id, s] of Object.entries(SCENARIOS)) {
    assert.ok(t.scenarios[id]?.name && t.scenarios[id].lesson && t.scenarios[id].truth, `${lang} ${id}`);
    for (const site of Object.keys(s.sites)) assert.ok(t.scenarios[id].sites[site], `${lang} ${id} site ${site}`);
    for (const tpl of s.templates) assert.ok(t.templates[tpl.id], `${lang} template ${tpl.id}`);
  }
  for (const k of ['good', 'close', 'poor', 'none']) assert.ok(t.verdict[k]);
}
console.log('PASS pmap: source match and fall-off, output in smooth myocardium, coupling interval, fusion, papillary tip / contact / high output, fascicular incomplete match and earliest Purkinje potential, scar exit / bystander / isthmus sinus vs VT / high output strand / paired VT at short coupling, TR/EN texts');
