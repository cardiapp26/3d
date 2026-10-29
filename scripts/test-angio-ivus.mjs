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
  '../src/angio/ivus/coronary-ivus.css',
  '../src/angio/ivus/main.js',
  '../angio/ivus/index.html',
  './test-angio-ivus.mjs',
]) {
  const content = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!content.includes('\u2014'), `${file} must not contain em-dash`);
}

console.log('Coronary IVUS Lab unit tests passed.');
