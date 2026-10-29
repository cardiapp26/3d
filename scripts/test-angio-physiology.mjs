import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  CLINICAL_CASES,
  CORONARY_TERRITORIES,
  HYPEREMIC_AGENTS,
  PHYSIOLOGY_MODALITIES,
  REFERENCES,
  SHELL_TEXT,
  WORKSPACE_MODES,
} from '../src/angio/physiology/coronary-physiology-data.js';
import {
  computeBolusThermodilution,
  computeConsoleReadout,
  computeContinuousThermodilution,
  computeDopplerAssessment,
  computeIfrFromFfr,
  computePullbackAnalysis,
  evaluateCalculatorCard,
  findClinicalCase,
  sampleBolusCurve,
  samplePressureBeat,
  samplePullbackRatio,
  simulateHemodynamicCircuit,
} from '../src/angio/physiology/coronary-physiology-sim.js';
import { renderVesselCutawaySvg } from '../src/angio/physiology/coronary-physiology-render.js';
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

assert.equal(PHYSIOLOGY_MODALITIES.length, 4);
PHYSIOLOGY_MODALITIES.forEach((mod) => {
  assertBilingual(mod.title, `modality ${mod.id}.title`);
  assertBilingual(mod.subtitle, `modality ${mod.id}.subtitle`);
  assertBilingual(mod.summary, `modality ${mod.id}.summary`);
});

assert.equal(CORONARY_TERRITORIES.length, 3);
assert.equal(HYPEREMIC_AGENTS.length, 3);
assert.ok(CLINICAL_CASES.length >= 12, 'Must ship at least 12 clinical coronary physiology cases');
assert.equal(ARTIFACT_CATALOG.length, 5, 'Must ship 5 cath-lab physiology artifacts');
assert.equal(CALCULATOR_CARDS.length, 5, 'Must ship 5 interactive formula calculator cards');
assert.ok(REFERENCES.length >= 10, 'Must ship guideline and trial references');

CLINICAL_CASES.forEach((item) => {
  assert.ok(item.id, 'case id required');
  assertBilingual(item.name, `${item.id}.name`);
  assertBilingual(item.brief, `${item.id}.brief`);
  assertBilingual(item.hint, `${item.id}.hint`);
  assertBilingual(item.takeaway, `${item.id}.takeaway`);
  assert.equal(findClinicalCase(item.id).id, item.id);
});

ARTIFACT_CATALOG.forEach((art) => {
  assertBilingual(art.name, `artifact ${art.id}.name`);
  assertBilingual(art.recognize, `artifact ${art.id}.recognize`);
  assertBilingual(art.fix, `artifact ${art.id}.fix`);
});

// 2. Epicardial FFR, iFR, Pullback PPG, and Virtual PCI / TSG
const focalLad = findClinicalCase('focal-lad');
const diffuseLad = findClinicalCase('diffuse-lad');
const serialLad = findClinicalCase('serial-lad');

const focalAnalysisHyperemia = computePullbackAnalysis(focalLad, {
  stentedIds: [],
  underexpanded: false,
});
assert.ok(focalAnalysisHyperemia.ffrDistal <= 0.8, 'Focal mid-LAD stenosis must be functionally ischemic (FFR <= 0.80)');
assert.ok(focalAnalysisHyperemia.ifrDistal <= 0.89, 'Focal mid-LAD stenosis must have iFR <= 0.89');
assert.ok(focalAnalysisHyperemia.ppg >= 0.62, `Focal mid-LAD lesion must have focal PPG >= 0.62 (got ${focalAnalysisHyperemia.ppg})`);
assert.equal(focalAnalysisHyperemia.pattern, 'focal');

const diffuseAnalysis = computePullbackAnalysis(diffuseLad, {
  stentedIds: [],
  underexpanded: false,
});
assert.ok(diffuseAnalysis.ffrDistal <= 0.8, 'Diffuse LAD atherosclerosis case is ischemic distally');
assert.ok(diffuseAnalysis.ppg < 0.62, `Diffuse LAD lesion must have diffuse PPG < 0.62 (got ${diffuseAnalysis.ppg})`);
assert.equal(diffuseAnalysis.pattern, 'diffuse');

// Virtual PCI stent normalizes focal lesion; underexpansion leaves residual TSG >= 0.04
const focalStentedOptimal = computePullbackAnalysis(focalLad, {
  stentedIds: ['mid-lad'],
  underexpanded: false,
});
assert.ok(focalStentedOptimal.ffrDistal >= 0.9, `Optimal virtual PCI on focal lesion should restore FFR >= 0.90 (got ${focalStentedOptimal.ffrDistal})`);
assert.ok(focalStentedOptimal.tsg < 0.04, `Optimal stent should have TSG < 0.04 (got ${focalStentedOptimal.tsg})`);

const focalStentedUnderexpanded = computePullbackAnalysis(focalLad, {
  stentedIds: ['mid-lad'],
  underexpanded: true,
});
assert.ok(focalStentedUnderexpanded.tsg >= 0.04, `Underexpanded stent must yield TSG >= 0.04 (got ${focalStentedUnderexpanded.tsg})`);
assert.ok(focalStentedUnderexpanded.ffrDistal < focalStentedOptimal.ffrDistal);

// Tandem lesion pullback shows step-ups across both lesions
const tandemPullbackProx = samplePullbackRatio(serialLad, 5, { hyperemia: true });
const tandemPullbackMid = samplePullbackRatio(serialLad, 38, { hyperemia: true });
const tandemPullbackDistal = samplePullbackRatio(serialLad, 75, { hyperemia: true });
assert.ok(tandemPullbackProx > tandemPullbackMid && tandemPullbackMid > tandemPullbackDistal, 'Tandem lesion pullback drops across both proximal and distal stenoses');

assert.ok(computeIfrFromFfr(0.75) > 0.75 && computeIfrFromFfr(0.75) < 0.95);

// Console readout & pressure waveform sampling
const readout = computeConsoleReadout(focalLad, {
  sensorMm: 75,
  hyperemia: true,
  equalized: true,
  stentedIds: [],
  underexpanded: false,
});
assert.ok(readout.ffr <= 0.8);
assert.ok(readout.meanPd < readout.meanPa);

const beatSample = samplePressureBeat(0.35, {
  sys: 130,
  dia: 75,
  trueRatio: 0.72,
  hyperemia: true,
});
assert.ok(beatSample.pa > beatSample.pd);

// 3. Bolus Thermodilution (CFR, IMR, Yong IMR_corr, RRR, MRR)
const cmdStructCase = findClinicalCase('structural-cmd');
const cmdBolus = computeBolusThermodilution(cmdStructCase);
assert.ok(cmdBolus.cfr < 2.5, `Structural CMD case must have CFR < 2.5 (got ${cmdBolus.cfr})`);
assert.ok(cmdBolus.imr >= 25, `Structural CMD case must have IMR >= 25 (got ${cmdBolus.imr})`);
assert.equal(cmdBolus.classification, 'structural-cmd');

const cmdFuncCase = findClinicalCase('functional-cmd');
const funcBolus = computeBolusThermodilution(cmdFuncCase);
assert.ok(funcBolus.cfr < 2.5, `Functional CMD case must have CFR < 2.5 (got ${funcBolus.cfr})`);
assert.ok(funcBolus.imr < 25, `Functional CMD case must have IMR < 25 (got ${funcBolus.imr})`);
assert.equal(funcBolus.classification, 'functional-cmd');

// Yong collateral correction reduces apparent IMR in severe epicardial stenosis
const severeBolus = computeBolusThermodilution(focalLad);
assert.ok(severeBolus.imrCorr < severeBolus.imr, 'Yong collateral correction must be lower than uncorrected Pd * Tmn in severe epicardial disease');
assert.ok(sampleBolusCurve(1.0, 0.35) < -0.1, 'Bolus thermodilution curve deflects negatively after injection');

// 4. Continuous Thermodilution (Q = 1.08 * (Ti / T) * Qi, R_micro = Pd / Q, MRR)
const normalCase = findClinicalCase('normal-coronary');
const contNormal = computeContinuousThermodilution(normalCase);
assert.ok(contNormal.qRest >= 50 && contNormal.qRest <= 110, `Normal resting Q expected ~60-90 mL/min (got ${contNormal.qRest})`);
assert.ok(contNormal.qHyp >= 180, `Normal hyperemic Q expected >= 180 mL/min (got ${contNormal.qHyp})`);
assert.ok(contNormal.rmuHyp < 470, `Normal minimal R_micro expected < 470 WU (got ${contNormal.rmuHyp})`);
assert.ok(contNormal.mrr >= 2.7, `Normal MRR expected >= 2.7 (got ${contNormal.mrr})`);

const contCmd = computeContinuousThermodilution(cmdStructCase);
assert.ok(contCmd.rmuHyp >= 470, `Structural CMD continuous thermodilution must show R_micro >= 470 WU (got ${contCmd.rmuHyp})`);

// 5. Doppler & Acetylcholine Provocation
const vasospasticCase = findClinicalCase('doppler-epispasm');
const achHighEpi = computeDopplerAssessment(vasospasticCase, { achStep: 3, ntgGiven: false });
assert.ok(achHighEpi.activeAch.diamDeltaPct <= -90, 'Epicardial spasm case at high ACh must constrict >= 90%');
assert.equal(achHighEpi.activeAch.ecg, 'st-elevation');
assert.equal(achHighEpi.achEndotype, 'epicardial-spasm');

const mvSpasmCase = findClinicalCase('doppler-microspasm');
const achHighMv = computeDopplerAssessment(mvSpasmCase, { achStep: 3, ntgGiven: false });
assert.ok(achHighMv.activeAch.diamDeltaPct > -90, 'Microvascular spasm has <90% epicardial constriction');
assert.equal(achHighMv.activeAch.ecg, 'st-depression');
assert.equal(achHighMv.achEndotype, 'microvascular-spasm');

// 6. Coupled Hemodynamic Simulator & Formula Calculators
const simNormal = simulateHemodynamicCircuit({
  mapMmHg: 96,
  heartRate: 66,
  stenosisPct: 20,
  diffusePct: 4,
  rmuHypWu: 300,
  lvedpMmHg: 8,
});
assert.ok(simNormal.ffr > 0.85 && simNormal.cfr > 2.5);

const simSevere = simulateHemodynamicCircuit({
  mapMmHg: 96,
  heartRate: 68,
  stenosisPct: 82,
  diffusePct: 8,
  rmuHypWu: 310,
  lvedpMmHg: 8,
});
assert.ok(simSevere.ffr < 0.75, `82% stenosis should yield FFR < 0.75 (got ${simSevere.ffr})`);

CALCULATOR_CARDS.forEach((card) => {
  const defaults = Object.fromEntries(card.inputs.map((inp) => [inp.key, inp.defaultVal]));
  const result = evaluateCalculatorCard(card.id, defaults);
  assert.ok(result && Array.isArray(result.rows) && result.rows.length > 0, `Calculator ${card.id} must return rows`);
});

// 7. SVG renderer sanity check
const svgMarkup = renderVesselCutawaySvg(focalLad, {
  sensorMm: 54,
  stentedIds: ['mid-lad'],
  underexpanded: false,
  modality: 'epicardial',
}, 'tr');
assert.match(svgMarkup, /<svg[\s\S]*54 mm[\s\S]*<\/svg>/);

// 8. Site routing, page shell, CSS & em-dash checks
const angioModule = SITE_MODULES.find((mod) => mod.id === 'angio');
assert.ok(angioModule?.pages?.some((p) => p.id === 'angio-physiology' && p.path === './angio/physiology/'));
assert.ok(SITE_BADGES['angio-physiology']);

const html = fs.readFileSync(new URL('../angio/physiology/index.html', import.meta.url), 'utf8');
assert.match(html, /data-site-page="angio-physiology"/);
assert.match(html, /data-phys-root/);
assert.match(html, /src="\.\.\/\.\.\/src\/angio\/physiology\/main\.js"/);

const css = fs.readFileSync(new URL('../src/angio/physiology/coronary-physiology.css', import.meta.url), 'utf8');
assert.doesNotMatch(css, /https?:\/\//);
assert.doesNotMatch(css, /overflow-x\s*:\s*hidden/i);
assert.doesNotMatch(css, /font-weight\s*:\s*(650|750|800)\b/);

for (const file of [
  '../src/angio/physiology/coronary-physiology-data.js',
  '../src/angio/physiology/coronary-physiology-sim.js',
  '../src/angio/physiology/coronary-physiology-render.js',
  '../src/angio/physiology/coronary-physiology-panel.js',
  '../src/angio/physiology/coronary-physiology.css',
  '../src/angio/physiology/main.js',
  '../angio/physiology/index.html',
]) {
  const content = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!content.includes('\u2014'), `${file} must not contain em-dash`);
}

console.log('Coronary Physiology Lab unit tests passed.');
