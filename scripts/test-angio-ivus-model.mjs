// Coronary IVUS Lab 3D model: normal-lumen / MLA references (ivus-anatomy.js) and the stent
// mechanics (ivus-stent-model.js): undersizing, post-dilation, POT, platform limit, apposition.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NORMAL_SEGMENTS,
  PULLBACK_ROUTES,
  assessMla,
  firstMlaCutoff,
  finetLmDiameter,
  normalLumenDiameterAt,
  segmentAtRoute
} from '../src/angio/ivus/ivus-anatomy.js';
import {
  createModelState,
  modelSlice,
  nativeSlice,
  sliceLayout,
  stentMetrics,
  platformLimitMm,
  MALAPPOSITION_MM
} from '../src/angio/ivus/ivus-stent-model.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg} (${a} vs ${b})`);

// Normal values (Dodge 1992) and MLA cut-offs (FIRST, LITRO, Park 2014).
const byId = Object.fromEntries(NORMAL_SEGMENTS.map((s) => [s.id, s]));
assert.equal(byId.lm.diamMm, 4.5);
assert.equal(byId.plad.diamMm, 3.7);
assert.equal(byId.dlad.diamMm, 1.9);
near(assessMla({ segmentId: 'plad', mlaMm2: 3 }).normalAreaMm2, 10.75, 0.01, 'proximal LAD normal lumen area');
assert.equal(firstMlaCutoff(2.8).cutoffMm2, 2.4);
assert.equal(firstMlaCutoff(3.2).cutoffMm2, 2.7);
assert.equal(firstMlaCutoff(3.8).cutoffMm2, 3.6);
assert.equal(assessMla({ segmentId: 'lm', mlaMm2: 5.5 }).verdict, 'below', 'LM 5.5 mm² is below the Western 6.0 cut-off');
assert.equal(assessMla({ segmentId: 'lm', mlaMm2: 5.5, population: 'asian' }).verdict, 'above', 'LM 5.5 mm² is above the Asian 4.5 cut-off');
assert.equal(assessMla({ segmentId: 'dlad', mlaMm2: 1.5 }).smallVessel, true, 'distal LAD <2.5 mm: cut-off unreliable');
near(finetLmDiameter(3.7, 3.4), 4.81, 0.01, 'Finet law');

// Route taper and segment mapping.
assert.equal(segmentAtRoute('LAD', 5).id, 'lm');
assert.equal(segmentAtRoute('LAD', 20).id, 'plad');
assert.equal(segmentAtRoute('RCA', 60).id, 'drca');
assert.ok(normalLumenDiameterAt('LAD', 2) > normalLumenDiameterAt('LAD', 40), 'LAD tapers distally');
for (const v of Object.keys(PULLBACK_ROUTES)) assert.ok(PULLBACK_ROUTES[v].branches.length >= 1, `${v} has side branches`);

// Native vessel: normal plaque burden, lesion narrows the lumen.
const native = createModelState('native');
const ref = nativeSlice(native, 20);
assert.ok(ref.plaqueBurdenPct < 25, `normal wall plaque burden (${ref.plaqueBurdenPct})`);
const under = createModelState('undersize');
const lesion = nativeSlice(under, under.lesion.centerMm);
near(lesion.plaqueBurdenPct, under.lesion.pbMax * 100, 0.5, 'lesion plaque burden');

// Undersized stent: low expansion, malapposition, flagged; resizing + post-dilation + POT fixes it.
const m0 = stentMetrics(under);
assert.equal(m0.undersized, true, 'undersized stent is flagged');
assert.ok(m0.expansionPct < 90 && !m0.ultimateExpansion, `undersized stent expansion < 90% (${m0.expansionPct})`);
assert.ok(m0.malapposed && m0.maxGapMm > MALAPPOSITION_MM, 'undersized stent is malapposed');
const fixed = { ...under, stent: { ...under.stent, diamMm: 3.0, post: { diamMm: 3.0, atm: 18 }, pot: { diamMm: 3.5, atm: 14 } } };
const m1 = stentMetrics(fixed);
assert.equal(m1.undersized, false);
assert.ok(m1.ultimateOptimal && !m1.malapposed, 'resized + post-dilated + POT is optimal and apposed');
// Over-dilating a small platform beyond its maximal diameter is flagged.
const over = { ...under, stent: { ...under.stent, post: { diamMm: 3.75, atm: 18 } } };
assert.equal(platformLimitMm(2.5), 3.5);
assert.equal(stentMetrics(over).overLimit, true, 'post-dilation beyond the platform limit is flagged');

// LM-LAD crossover: malapposed LM struts until POT; Kang segment areas reported.
const app = createModelState('apposition');
const a0 = stentMetrics(app);
assert.ok(a0.malapposed, 'LM struts malapposed before POT');
assert.ok(a0.kang, 'Kang LM targets evaluated');
const a1 = stentMetrics({ ...app, stent: { ...app.stent, pot: { diamMm: 4.5, atm: 14 } } });
assert.equal(a1.malapposed, false, 'POT resolves LM malapposition');
assert.ok(a1.kang.lmMsa > a0.kang.lmMsa, 'POT enlarges the LM stent area');

// Layout: a malapposed stent touches the plaque side (small gap) and floats on the far side.
const f = modelSlice(app, 4);
const L = sliceLayout(f);
assert.ok(f.inStent && f.gapMm > 0);
const nearGap = L.gapAt(L.phiPlaque);
const farGap = L.gapAt(L.phiPlaque + Math.PI);
assert.ok(nearGap < farGap, 'gap is smallest on the plaque side');
near(farGap, f.maxGapMm, 0.05, 'far-side gap equals maxGapMm');
// Side-branch ostium struts are not counted as malapposition.
const ost = modelSlice(app, PULLBACK_ROUTES.LAD.branches[0].at);
assert.equal(ost.gapMm, 0, 'struts across the LCx ostium are not malapposition');

for (const file of ['ivus-anatomy.js', 'ivus-stent-model.js', 'ivus-model-3d.js', 'ivus-model-cross.js', 'ivus-model-view.js']) {
  assert.ok(!fs.readFileSync(new URL(`../src/angio/ivus/${file}`, import.meta.url), 'utf8').includes('\u2014'), `${file} has no em dash`);
}
console.log('PASS coronary IVUS 3D model: normal lumen/MLA cut-offs, undersizing, post-dilation, POT, platform limit, LM apposition');
