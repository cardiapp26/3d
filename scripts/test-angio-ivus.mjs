import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  CLINICAL_CASES,
  MORPHOLOGY_ATLAS,
  REFERENCES,
  SHELL_TEXT,
  TRANSDUCER_MODES,
  WORKSPACE_MODES,
} from '../src/angio/ivus/coronary-ivus-data.js';
import {
  computeCalciumScore,
  computePullbackProfile,
  evaluateIvusCalculator,
  findIvusCase,
  findTransducerMode,
  sampleIvusSlice,
} from '../src/angio/ivus/coronary-ivus-sim.js';
import { NORMAL_SEGMENTS } from '../src/angio/ivus/ivus-anatomy.js';
import { structureAt, frameMeasures, buildFrame, aLine, VESSEL_CENTRE, WIRE_POSITION, FRAME_PRESETS } from '../src/angio/ivus/ivus-basics-frame.js';
import { QUIZ_LEVELS, QUIZ_TEXT, questionTarget, questionOptions } from '../src/angio/ivus/ivus-quiz-data.js';
import { BASICS_TEXT, ECHO_CATEGORIES, READING_STEPS, SYSTEM_ROWS, WORKFLOW, STRUCTURES, STRUCTURE_NAMES, ECHO_LABEL } from '../src/angio/ivus/ivus-basics-data.js';
import { renderIvusAngioCoRegSvg } from '../src/angio/ivus/coronary-ivus-render.js';
import { SITE_BADGES, SITE_MODULES } from '../src/site-modules.js';

function assertBilingual(value, context) {
  assert.equal(typeof value, 'object', `${context} must be a bilingual object`);
  assert.ok(typeof value.tr === 'string' && value.tr.trim().length > 0, `${context}.tr must be non-empty`);
  assert.ok(typeof value.en === 'string' && value.en.trim().length > 0, `${context}.en must be non-empty`);
}

// 1. Metadata & catalog completeness
assert.ok(SHELL_TEXT.tr.title && SHELL_TEXT.en.title);
assert.equal(WORKSPACE_MODES.length, 4);
WORKSPACE_MODES.forEach((mode) => assertBilingual(mode.label, `mode ${mode.id}`));

assert.equal(TRANSDUCER_MODES.length, 3);
TRANSDUCER_MODES.forEach((tx) => {
  assertBilingual(tx.label, `transducer ${tx.id}`);
  assert.equal(findTransducerMode(tx.id).id, tx.id);
});

assert.equal(CLINICAL_CASES.length, 10, 'Must ship 10 clinical coronary IVUS cases');
assert.equal(MORPHOLOGY_ATLAS.length, 6, 'Must ship 6 IVUS tissue/morphology cards');
assert.equal(ARTIFACT_CATALOG.length, 5, 'Must ship 5 IVUS artifact cards');
assert.equal(CALCULATOR_CARDS.length, 6, 'Must ship 6 IVUS calculator cards');
assert.equal(CALCULATOR_CARDS[0].id, 'normal-mla', 'Normal lumen / MLA card must come first');
assert.ok(REFERENCES.length >= 8, 'Must ship guideline and trial references');

CLINICAL_CASES.forEach((item) => {
  assert.ok(item.id, 'case id required');
  assertBilingual(item.name, `${item.id}.name`);
  assertBilingual(item.segment, `${item.id}.segment`);
  assertBilingual(item.brief, `${item.id}.brief`);
  assertBilingual(item.teaching, `${item.id}.teaching`);
  assert.equal(findIvusCase(item.id).id, item.id);
});

MORPHOLOGY_ATLAS.forEach((m) => {
  assertBilingual(m.name, `morphology ${m.id}.name`);
  assertBilingual(m.echogenicity, `morphology ${m.id}.echogenicity`);
  assertBilingual(m.clinical, `morphology ${m.id}.clinical`);
});

ARTIFACT_CATALOG.forEach((art) => {
  assertBilingual(art.name, `artifact ${art.id}.name`);
  assertBilingual(art.mechanism, `artifact ${art.id}.mechanism`);
  assertBilingual(art.fix, `artifact ${art.id}.fix`);
});

// 2. Planimetry, MLA, Plaque Burden, and Glagov Remodeling
const classicLad = findIvusCase('lad-fibrocalcific');
const mlaSlice = sampleIvusSlice(classicLad, classicLad.mlaMm);
const distSlice = sampleIvusSlice(classicLad, classicLad.distalRefMm);
const proxSlice = sampleIvusSlice(classicLad, classicLad.proxRefMm);

assert.ok(mlaSlice.lumenAreaMm2 < 3.0, `Expected tight MLA < 3.0 mm2 at lesion center, got ${mlaSlice.lumenAreaMm2}`);
assert.ok(mlaSlice.plaqueBurdenPct > 70, `Expected high plaque burden > 70% at MLA, got ${mlaSlice.plaqueBurdenPct}`);
assert.ok(distSlice.plaqueBurdenPct < 50 && proxSlice.plaqueBurdenPct < 50, 'Reference landing zones must have plaque burden < 50%');

// Positive remodeling in ACS attenuated plaque case
const acsRca = findIvusCase('rca-attenuated-acs');
const acsSlice = sampleIvusSlice(acsRca, acsRca.mlaMm);
assert.ok(acsSlice.remodelingIndex > 1.1, `ACS attenuated plaque case must show positive remodeling RI > 1.1 (got ${acsSlice.remodelingIndex})`);
// RI is an area ratio: lesion EEM area / mean of proximal and distal reference EEM areas
const areaOf = (d) => Math.PI * (d / 2) ** 2;
const expectedRi = acsSlice.eemAreaMm2 / ((areaOf(acsRca.distalRef.eemDiamMm) + areaOf(acsRca.proxRef.eemDiamMm)) / 2);
assert.ok(Math.abs(acsSlice.remodelingIndex - expectedRi) < 0.01, `RI must be an EEM area ratio (got ${acsSlice.remodelingIndex}, expected ${expectedRi.toFixed(2)})`);
assert.ok(Math.abs(acsSlice.remodelingIndex - acsRca.lesion.eemDiamMm / acsRca.distalRef.eemDiamMm) > 0.05, 'RI must not be a diameter ratio');
assert.equal(acsSlice.thrombus, true);

// 3. IVUS Calcium Score (0-4) and Heavy Calcified Ring
const heavyCaCase = findIvusCase('lad-concentric-ca-360');
const heavyProfileUnstented = computePullbackProfile(heavyCaCase);
assert.equal(heavyProfileUnstented.caScore.score, 2, `320 deg / 7.5 mm / EEM 3.3 mm calcium case must score 2/4 (got ${heavyProfileUnstented.caScore.score})`);
assert.ok(heavyProfileUnstented.caScore.score >= 2 && heavyProfileUnstented.caScore.applicable);
assert.equal(heavyProfileUnstented.caScore.needsModification, true);

// Zhang 2021 IVUS calcium score: >270° & >5 mm, 360°, nodule, vessel <3.5 mm
const caDefault = computeCalciumScore({ caArcDeg: 290, caLenMm: 6, hasNodule: false, vesselEemMm: 3.25 });
assert.equal(caDefault.score, 2, 'Calculator default 290°/6 mm/no nodule/3.25 mm must score 2');
assert.equal(caDefault.needsModification, true);
const caMax = computeCalciumScore({ caArcDeg: 360, caLenMm: 6, hasNodule: true, vesselEemMm: 3.0 });
assert.equal(caMax.score, 4, '360°/6 mm/nodule/3.0 mm must score 4');
assert.equal(caMax.highestRisk, true);
const caLowArc = computeCalciumScore({ caArcDeg: 200, caLenMm: 8, hasNodule: false, vesselEemMm: 3.0 });
assert.equal(caLowArc.applicable, false, 'Arc <=270° must flag the score as not applicable');
assert.equal(typeof caLowArc.score, 'number');
assert.equal(caLowArc.needsModification, false);
const caShort = computeCalciumScore({ caArcDeg: 300, caLenMm: 5, hasNodule: false, vesselEemMm: 3.8 });
assert.equal(caShort.ptArc270Len5, 0, 'Calcium length must exceed 5 mm');
const caCard = CALCULATOR_CARDS.find((c) => c.id === 'calcium-score');
const caCardDefaults = Object.fromEntries(caCard.inputs.map((inp) => [inp.key, inp.defaultVal]));
assert.equal(evaluateIvusCalculator('calcium-score', caCardDefaults, 'tr').rows[0].value, '2 / 4');

// Stenting without plaque modification on 320 deg calcium causes underexpansion; modification + POT achieves optimal expansion
const heavyStentNoMod = computePullbackProfile(heavyCaCase, {
  stentDeployed: true,
  plaqueModified: false,
  potPerformed: false,
});
const heavyStentWithMod = computePullbackProfile(heavyCaCase, {
  stentDeployed: true,
  plaqueModified: true,
  potPerformed: true,
});
assert.ok(heavyStentWithMod.msaMm2 > heavyStentNoMod.msaMm2, 'Plaque modification + POT must increase MSA over unmodified calcified stenting');
assert.equal(heavyStentWithMod.ultimateOptimal, true);

// 4. Stent Malapposition resolved by POT
const malappCase = findIvusCase('rca-stent-malapposition');
const malappBeforePot = computePullbackProfile(malappCase, { potPerformed: false });
assert.ok(malappBeforePot.maxMalappMm >= 0.4, `Malapposition case must have gap >= 0.4 mm before POT (got ${malappBeforePot.maxMalappMm})`);
const malappAfterPot = computePullbackProfile(malappCase, { potPerformed: true });
assert.equal(malappAfterPot.maxMalappMm, 0, 'POT must resolve proximal stent malapposition');
assert.equal(malappBeforePot.criterionApposition, false, 'Malapposition must fail the separate OCT-derived apposition check');
assert.equal(malappAfterPot.criterionApposition, true);
assert.equal(malappBeforePot.criterionNoDissection, true, 'Malapposition must not count as an ULTIMATE dissection failure');

// ULTIMATE edge criterion: media-involving dissection >3 mm fails; bailout stent resolves it
const edgeCase = findIvusCase('lad-edge-dissection');
const edgeProfile = computePullbackProfile(edgeCase, { stentDeployed: true });
assert.equal(edgeProfile.criterionNoDissection, false);
assert.equal(edgeProfile.dissection.eapciMajor, true);
assert.equal(edgeProfile.ultimateOptimal, false);
assert.equal(computePullbackProfile(edgeCase, { stentDeployed: true, bailoutStent: true }).criterionNoDissection, true);

// EAPCI sizing: distal EEM rounded down to 0.25 mm, capped at distal lumen + 0.5 mm
assert.equal(computePullbackProfile(classicLad).recommendedStentDiamMm, 3.5);
const sizing = evaluateIvusCalculator('stent-sizing', { distEemD: 3.6, distLumD: 3.1, proxEemD: 4.2, proxLumD: 3.65, lesionLen: 22 }, 'en').sizing;
assert.deepEqual([sizing.eemBasedMm, sizing.lumenBasedMm, sizing.stentMm, sizing.potMm], [3.5, 3.25, 3.5, 3.75]);
const cappedSizing = evaluateIvusCalculator('stent-sizing', { distEemD: 4.4, distLumD: 3.2, proxEemD: 4.6, proxLumD: 3.8, lesionLen: 22 }, 'en').sizing;
assert.equal(cappedSizing.stentMm, 3.5, 'Recommended stent must be capped at distal lumen + 0.5 mm');

// 5. Left Main Bifurcation MLA < 4.5 mm2
const lmcaCase = findIvusCase('lmca-bifurcation');
const lmcaMla = sampleIvusSlice(lmcaCase, lmcaCase.mlaMm);
assert.ok(lmcaMla.lumenAreaMm2 < 4.5, `LMCA bifurcation MLA must be < 4.5 mm2 (got ${lmcaMla.lumenAreaMm2})`);
const lmcaStented = computePullbackProfile(lmcaCase, { stentDeployed: true, potPerformed: true });
assert.deepEqual(lmcaStented.lmSegments.map((s) => [s.id, s.targetMm2]), [['ladOstium', 6], ['poc', 7], ['distalLm', 8], ['lcxOstium', 5]]);
assert.ok(lmcaStented.lmSegments.filter((s) => s.measured).length === 3, 'LAD ostium, POC and distal LM must be measured on a LAD-to-LM pullback');

// Normal lumen area & segment MLA cut-off calculator
const segIdx = (id) => NORMAL_SEGMENTS.findIndex((s) => s.id === id);
const mlaCalc = (vals) => evaluateIvusCalculator('normal-mla', { segment: segIdx('plad'), refDiam: 0, mla: 3.2, asian: 0, ...vals }, 'tr');
const pladRes = mlaCalc({});
assert.ok(Math.abs(pladRes.assessment.normalAreaMm2 - 10.75) < 0.02, `pLAD normal area must be ~10.75 mm2 (got ${pladRes.assessment.normalAreaMm2})`);
assert.equal(pladRes.rows.length, 6);
assert.equal(mlaCalc({ segment: segIdx('lm'), mla: 5.5 }).assessment.verdict, 'below', 'LM MLA 5.5 must be below the Western 6.0 cut-off');
assert.equal(mlaCalc({ segment: segIdx('lm'), mla: 5.5, asian: 1 }).assessment.verdict, 'above', 'LM MLA 5.5 must be above the Asian 4.5 cut-off');
assert.equal(mlaCalc({ segment: segIdx('lm'), mla: 5.5 }).rows.at(-1).status, 'bad');
assert.equal(mlaCalc({ refDiam: 2.8 }).assessment.cutoffMm2, 2.4);
assert.equal(mlaCalc({ refDiam: 3.2 }).assessment.cutoffMm2, 2.7);
assert.equal(mlaCalc({ refDiam: 3.8 }).assessment.cutoffMm2, 3.6);
assert.equal(mlaCalc({ mla: 2.0, refDiam: 3.8 }).rows.at(-1).value, 'FFR/iFR ile doğrula (IVUS MLA tek başına özgüllüğü düşük)');
assert.equal(mlaCalc({ segment: segIdx('dlad'), mla: 1.5 }).rows.at(-1).status, 'warn', 'Small vessels (<2.5 mm) must warn that the cut-off is unreliable');

// 6. Calculators & Co-registration SVG
CALCULATOR_CARDS.forEach((card) => {
  const defaults = Object.fromEntries(card.inputs.map((inp) => [inp.key, inp.defaultVal]));
  const result = evaluateIvusCalculator(card.id, defaults, 'tr');
  assert.ok(result && Array.isArray(result.rows) && result.rows.length > 0, `Calculator ${card.id} must return rows`);
});

const svgMarkup = renderIvusAngioCoRegSvg(classicLad, { posMm: 20, stentDeployed: true }, 'tr');
assert.match(svgMarkup, /<svg[\s\S]*20\.0 mm[\s\S]*<\/svg>/);


// 6b. IVUS basics frame: layers from inside out, echo against the adventitia, shadows along the beam
{
  const at = (rho, hour, opts) => { const a = (hour / 12) * Math.PI * 2; return structureAt(VESSEL_CENTRE.x + rho * Math.sin(a), VESSEL_CENTRE.y - rho * Math.cos(a), opts); };
  assert.deepEqual([1.0, 1.85, 2.0, 2.4].map(r => at(r, 12, { preset: 'normal' }).id), ['lumen', 'intima', 'media', 'adventitia'], 'normal wall: lumen, intima, media, adventitia');
  assert.equal(at(2.0, 12, { preset: 'normal' }).echo, 'hypoechoic', 'media is hypoechoic');
  assert.equal(at(2.4, 12, { preset: 'normal' }).echo, 'reference', 'adventitia is the brightness reference');
  const fib = at(1.4, 4, { preset: 'fibrous' });
  assert.equal(fib.id, 'fibrous'); assert.equal(fib.echo, 'hyperechoic');
  // Clock positions are read from the image centre (the catheter), as on the console.
  const four = structureAt(1.7 * Math.sin(Math.PI * 2 / 3), -1.7 * Math.cos(Math.PI * 2 / 3), { preset: 'fibrous' });
  assert.equal(four.id, 'fibrous'); assert.equal(Math.round(four.clock), 4, 'fibrous plaque seen at 4 o\u2019clock from the catheter');
  assert.deepEqual([1.4, 1.6, 2.4].map(r => at(r, 10, { preset: 'calcium' }).id), ['calcium', 'calciumShadow', 'calciumShadow'], 'calcium casts a shadow behind it');
  assert.equal(at(1.4, 10, { preset: 'calcium' }).echo, 'shadowed');
  assert.ok(['lipid', 'fibrous'].includes(at(1.3, 1.5, { preset: 'mixed' }).id) && at(1.3, 1.5, { preset: 'mixed' }).within === 'mixed', 'mixed plaque');
  assert.equal(structureAt(WIRE_POSITION.x, WIRE_POSITION.y, { system: 'rotational-40' }).id, 'wire', 'rotational: wire visible');
  assert.equal(structureAt(WIRE_POSITION.x * 2, WIRE_POSITION.y * 2, { system: 'rotational-40' }).id, 'wireShadow', 'rotational: wire shadow');
  assert.notEqual(structureAt(WIRE_POSITION.x, WIRE_POSITION.y, { system: 'phased-20' }).id, 'wire', 'phased array: no wire artifact');
  assert.equal(structureAt(0, 0, { system: 'phased-20' }).id, 'catheter');
  const normal = frameMeasures('normal'), fibrous = frameMeasures('fibrous');
  assert.ok(normal.lumenArea > fibrous.lumenArea && fibrous.burden > normal.burden, 'plaque shrinks the lumen and raises the burden');
  assert.ok(Math.abs(normal.eelDiameter - normal.midMediaDiameter) <= .25, 'EEL-to-EEL and mid-media diameters differ by a clinically negligible amount');
  const frame = buildFrame(120, { preset: 'calcium', system: 'rotational-60' });
  assert.equal(frame.data.length, 120 * 120 * 4); assert.ok(frame.lumen.length > 500, 'lumen pixels listed for blood speckle');
  const beam = aLine(3, { preset: 'normal' });
  assert.ok(beam.some(s => s.id === 'media') && beam.some(s => s.id === 'adventitia'), 'A-line crosses media and adventitia');
  for (const id of Object.keys(STRUCTURE_NAMES)) { assertBilingual(STRUCTURE_NAMES[id], `structure ${id}`); assertBilingual(STRUCTURES[id], `structure text ${id}`); }
  for (const id of ['anechoic', 'hypoechoic', 'hyperechoic', 'shadowed', 'mixed']) assert.ok(ECHO_CATEGORIES.some(c => c.id === id) && ECHO_LABEL[id], `echo category ${id}`);
  assert.equal(READING_STEPS.length, 7); assert.equal(SYSTEM_ROWS.length, 7); assert.ok(WORKFLOW.length >= 4);
  for (const key of Object.keys(BASICS_TEXT)) assertBilingual(BASICS_TEXT[key], `basics text ${key}`);
  assert.deepEqual(Object.keys(FRAME_PRESETS), ['normal', 'fibrous', 'calcium', 'mixed', 'nodule', 'attenuated', 'thrombus', 'hematoma', 'dissection', 'stent', 'sidebranch', 'nurd']);
}

// 6c. Image reading quiz: every arrow lands on its answer, answers are named and explained
{
  assert.equal(QUIZ_LEVELS.length, 7, 'seven levels from the normal wall to stents');
  let count = 0;
  QUIZ_LEVELS.forEach((level, li) => {
    assertBilingual(level.title, `quiz level ${level.id}`); assertBilingual(level.intro, `quiz intro ${level.id}`);
    level.questions.forEach((question, qi) => {
      count++;
      const target = questionTarget(question);
      assert.ok(target, `${level.id} ${question.answer}: arrow target found`);
      assert.equal(structureAt(target.x, target.y, question).id, question.answer, `${level.id} ${question.answer}: arrow on the answer`);
      const options = questionOptions(question, qi + li);
      assert.equal(new Set(options).size, 3); assert.ok(options.includes(question.answer));
      for (const id of options) { assertBilingual(STRUCTURE_NAMES[id], `quiz option ${id}`); assertBilingual(STRUCTURES[id], `quiz explanation ${id}`); }
    });
  });
  assert.ok(count >= 24, 'at least 24 questions');
  for (const key of Object.keys(QUIZ_TEXT)) assertBilingual(QUIZ_TEXT[key], `quiz text ${key}`);
  // The new findings behave like their IVUS signs.
  const v = (rho, hour, preset) => { const a = (hour / 12) * Math.PI * 2; return structureAt(VESSEL_CENTRE.x + rho * Math.sin(a), VESSEL_CENTRE.y - rho * Math.cos(a), { preset }).id; };
  assert.equal(v(1.6, 10, 'nodule'), 'calciumShadow', 'a calcified nodule shadows what lies behind it');
  assert.equal(v(1.2, 2.5, 'attenuated'), 'attenuated'); assert.equal(v(2.0, 2.5, 'attenuated'), 'attenuation', 'attenuation without a bright edge');
  assert.deepEqual([1.0, 1.28, 1.5].map(r => v(r, 3, 'dissection')), ['trueLumen', 'flap', 'falseLumen'], 'flap between the true and the false lumen');
  assert.equal(v(1.6, 2.0, 'stent'), 'lumen', 'blood behind a malapposed strut');
}

// 7. Site routing, page shell, CSS & em-dash checks
const angioModule = SITE_MODULES.find((mod) => mod.id === 'angio');
assert.ok(angioModule?.pages?.some((p) => p.id === 'angio-ivus' && p.path === './angio/ivus/'));
assert.ok(SITE_BADGES['angio-ivus']);

const html = fs.readFileSync(new URL('../angio/ivus/index.html', import.meta.url), 'utf8');
assert.match(html, /data-site-page="angio-ivus"/);
assert.match(html, /data-ivus-root/);
assert.match(html, /src="\.\.\/\.\.\/src\/angio\/ivus\/main\.js"/);

const css = fs.readFileSync(new URL('../src/angio/ivus/coronary-ivus.css', import.meta.url), 'utf8');
assert.doesNotMatch(css, /https?:\/\//);
assert.doesNotMatch(css, /overflow-x\s*:\s*hidden/i);
assert.doesNotMatch(css, /font-weight\s*:\s*(650|750|800)\b/);

for (const file of [
  '../src/angio/ivus/coronary-ivus-data.js',
  '../src/angio/ivus/coronary-ivus-sim.js',
  '../src/angio/ivus/ivus-anatomy.js',
  '../src/angio/ivus/coronary-ivus-render.js',
  '../src/angio/ivus/coronary-ivus-panel.js',
  '../src/angio/ivus/ivus-basics.js',
  '../src/angio/ivus/ivus-basics-data.js',
  '../src/angio/ivus/ivus-basics-frame.js',
  '../src/angio/ivus/ivus-quiz.js',
  '../src/angio/ivus/ivus-quiz-data.js',
  '../src/angio/ivus/coronary-ivus.css',
  '../src/angio/ivus/main.js',
  '../angio/ivus/index.html',
  './test-angio-ivus.mjs',
]) {
  const content = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!content.includes('\u2014'), `${file} must not contain em-dash`);
}

console.log('Coronary IVUS Lab unit tests passed.');
