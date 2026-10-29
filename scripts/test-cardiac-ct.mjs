import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_MODULES, SITE_BADGES } from '../src/site-modules.js';
import { HOME_MODULES } from '../src/home/home-data.js';
import {
  SHELL_TEXT,
  WORKSPACE_MODES,
  WINDOW_PRESETS,
  ANATOMICAL_LEVELS,
  CLINICAL_CT_CASES,
  CAD_RADS_TABLE,
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  REFERENCES
} from '../src/ct/cardiac-ct-data.js';
import {
  findCtCase,
  findWindowPreset,
  findNearestAnatomicalLevel,
  huToGrayscale,
  computeCprAndCtFfrProfile,
  computeTaviCoplanarCurve,
  taviCoplanarCraCauDeg,
  evaluateCtCalculator
} from '../src/ct/cardiac-ct-sim.js';
import { renderSagittalScoutSvg, levelForZ, axialTissueHu } from '../src/ct/cardiac-ct-render.js';
import {
  CT_FOV_MODES,
  CT_SEGMENTATION_CLASSES,
  computeCtSegmentationReport,
  buildCt3dVolumeGraph,
  isSegmentVisible
} from '../src/ct/cardiac-ct-segmentation.js';

// 1. Verify top-level site module registration and welcome page card
const ctModule = SITE_MODULES.find((m) => m.id === 'ct');
assert.ok(ctModule, 'SITE_MODULES must include main module id="ct"');
assert.equal(ctModule.path, './ct/', 'Cardiac CT module path must be ./ct/');
assert.equal(ctModule.label.tr, 'Kardiyak BT');
assert.equal(ctModule.label.en, 'Cardiac CT');
assert.ok(SITE_BADGES.ct, 'SITE_BADGES must include ct badge');
assert.equal(SITE_BADGES.ct.tr, 'KARDİYAK BT');
assert.equal(SITE_BADGES.ct.en, 'CARDIAC CT');

const homeCard = HOME_MODULES.find((m) => m.id === 'ct');
assert.ok(homeCard, 'HOME_MODULES must include Cardiac CT card');
assert.equal(homeCard.domain, 'imaging');
assert.equal(homeCard.path, './ct/');
assert.equal(homeCard.thumb, 'ct');

// 2. Verify dataset completeness and bilingual strings
assert.ok(SHELL_TEXT.tr.title && SHELL_TEXT.en.title);
assert.equal(WORKSPACE_MODES.length, 5, 'Must provide 5 Cardiac CT workspace modes (real CT first)');
assert.equal(WORKSPACE_MODES[0].id, 'realct', 'Real CT is the first workspace');
assert.equal(WINDOW_PRESETS.length, 4, 'Must provide 4 HU window presets');
assert.equal(ANATOMICAL_LEVELS.length, 4, 'Must provide 4 craniocaudal anatomical levels');
assert.equal(CLINICAL_CT_CASES.length, 10, 'Must provide 10 clinical Cardiac CT cases');
assert.equal(CAD_RADS_TABLE.length, 7, 'Must provide 7 CAD-RADS 2.0 categories (0..5)');
assert.equal(ARTIFACT_CATALOG.length, 5, 'Must provide 5 Cardiac CT artifacts');
assert.equal(CALCULATOR_CARDS.length, 5, 'Must provide 5 quantitative Cardiac CT calculators');
assert.ok(REFERENCES.length >= 8, 'Must provide at least 8 consensus references');

for (const c of CLINICAL_CT_CASES) {
  assert.ok(c.id && c.tag && c.vessel, `Case ${c.id} must have id, tag, and vessel`);
  assert.ok(c.name.tr && c.name.en, `Case ${c.id} must have bilingual name`);
  assert.ok(c.brief.tr && c.brief.en, `Case ${c.id} must have bilingual brief`);
  assert.ok(c.teaching.tr && c.teaching.en, `Case ${c.id} must have bilingual teaching pearl`);
}

// 3. Verify simulation functions
assert.equal(huToGrayscale(-1000, 800, 250), 0, 'Air (-1000 HU) maps to 0');
assert.equal(huToGrayscale(250, 800, 250), 128, 'Window level maps to mid-gray (~128)');
assert.equal(huToGrayscale(1000, 800, 250), 255, 'Dense calcium (1000 HU) maps to 255');

const hrpCase = findCtCase('lad-hrp-napkin');
assert.equal(hrpCase.id, 'lad-hrp-napkin');
const hrpProfile = computeCprAndCtFfrProfile(hrpCase, { windowPresetId: 'cta-angio', rrPhasePct: 75 });
assert.equal(hrpProfile.points.length, 61);
assert.ok(hrpProfile.ffrCtDistal <= 0.75, 'HRP case must have ischemic distal FFR_CT <= 0.75');

const calcCase = findCtCase('multivessel-cac');
const softWinProfile = computeCprAndCtFfrProfile(calcCase, { windowPresetId: 'cta-angio', rrPhasePct: 75 });
const sharpWinProfile = computeCprAndCtFfrProfile(calcCase, { windowPresetId: 'calcium-sharp', rrPhasePct: 75 });
assert.ok(
  softWinProfile.effectiveMaxStenosisPct > sharpWinProfile.effectiveMaxStenosisPct,
  'Calcium blooming in soft window must increase apparent stenosis vs sharp window'
);

const bridgeCase = findCtCase('lad-myocardial-bridge-ct');
const systoleBridge = computeCprAndCtFfrProfile(bridgeCase, { rrPhasePct: 40 });
const diastoleBridge = computeCprAndCtFfrProfile(bridgeCase, { rrPhasePct: 75 });
assert.ok(
  systoleBridge.effectiveMaxStenosisPct > diastoleBridge.effectiveMaxStenosisPct,
  'Myocardial bridge must show greater systolic milking at 40% R-R than 75% diastasis'
);

const taviCase = findCtCase('tavi-aortic-root');
const taviData = computeTaviCoplanarCurve(taviCase);
assert.ok(taviData.dAreaMm > 20 && taviData.dPerimMm > 20);
assert.ok(taviData.sCurve.length > 10);
for (const view of [taviData.threeCuspView, taviData.cuspOverlapView]) {
  assert.equal(view.craCauDeg, taviCoplanarCraCauDeg(view.laoRaoDeg), 'TAVI projection markers must lie on the S-curve');
  assert.ok(view.label.tr && view.label.en, 'TAVI projection labels must be bilingual');
}
assert.equal(taviData.threeCuspView.craCauDeg, -10, '3-cusp coplanar view is LAO 12 CAU 10');
assert.equal(taviData.cuspOverlapView.craCauDeg, -24, 'Cusp-overlap view is RAO 16 CAU 24');

// Shared nearest-level rule and HU table
assert.equal(levelForZ(33).id, 'great-vessels');
assert.equal(levelForZ(35).id, 'aortic-root-ostia');
assert.equal(levelForZ(64).id, 'four-chamber-mid');
assert.equal(levelForZ(92).id, 'apical-diaphragm');
const delayedHu = axialTissueHu(findCtCase('laa-vein-mapping'), { delayedPhase60s: true });
assert.ok(delayedHu.blood >= 120 && delayedHu.blood <= 150, 'Delayed 60 s blood pool must be about 120-150 HU');
assert.equal(axialTissueHu(hrpCase, { windowPresetId: 'noncontrast-cac' }).blood, 45, 'Unenhanced blood is about 45 HU');
const baseHu = axialTissueHu(hrpCase, {});
assert.ok(baseHu.lung <= -800 && baseHu.fat <= -80 && baseHu.bone >= 700);

for (const row of CAD_RADS_TABLE) {
  assert.ok(row.stenosis.tr && row.stenosis.en, `CAD-RADS ${row.code} stenosis must be bilingual`);
}

// 4. Verify all 5 quantitative calculators
for (const calc of CALCULATOR_CARDS) {
  const defaults = {};
  for (const inp of calc.inputs) defaults[inp.key] = inp.defaultVal;
  const resTr = evaluateCtCalculator(calc.id, defaults, 'tr');
  const resEn = evaluateCtCalculator(calc.id, defaults, 'en');
  assert.ok(resTr.rows.length >= 3, `Calculator ${calc.id} must return >=3 output rows in TR`);
  assert.ok(resEn.rows.length >= 3, `Calculator ${calc.id} must return >=3 output rows in EN`);
}

const cadRads = (vals) => evaluateCtCalculator('cad-rads-gen', { maxStenosisPct: 40, lmOr3v: 0, cacScore: 50, hrpCount: 0, ffrCt: 0.9, ...vals }, 'en').codeStr;
assert.match(cadRads({ lmOr3v: 1, maxStenosisPct: 40 }), /^CAD-RADS 2\b/, 'LM/3V flag is ignored below 50% stenosis');
assert.match(cadRads({ lmOr3v: 1, maxStenosisPct: 55 }), /^CAD-RADS 4B/, 'LM/3V flag with >=50% gives 4B');
const tinyLesion = evaluateCtCalculator('agatston-cac', { areaMm2: 0.6, peakHu: 500, otherVesselsCac: 0 }, 'en');
assert.equal(tinyLesion.rows[1].value, '0 AU', 'Agatston lesion area < 1 mm2 scores 0');

// 5. Verify Sagittal Scout SVG renderer
const scoutSvg = renderSagittalScoutSvg(hrpCase, { zMm: 48 }, 'tr');
assert.match(scoutSvg, /<svg/);
assert.match(scoutSvg, /z = 48 mm/);

// 5b. Verify 3-Panel VRT / MIP / MPR Volume Graph & 14-Structure Anatomical Segmentation
assert.equal(CT_FOV_MODES.length, 3, 'Must provide 3 CT FOV scan modes');
assert.equal(CT_SEGMENTATION_CLASSES.length, 14, 'Must provide 14 anatomical CT segmentation classes');
const segReportTr = computeCtSegmentationReport(hrpCase, { chambersSubtracted: false }, 'tr');
assert.equal(segReportTr.rows.length, 14);
assert.equal(segReportTr.visibleCount, 14);
assert.ok(segReportTr.totalVolumeMl > 400);
const ladSegRow = segReportTr.rows.find((r) => r.key === 'lad');
assert.equal(ladSegRow.status, 'bad', 'LAD segment in HRP case must flag stenosis');

const segSubtracted = computeCtSegmentationReport(hrpCase, { chambersSubtracted: true }, 'en');
assert.equal(segSubtracted.visibleCount, 10, 'Subtracting 4 cardiac chambers leaves 10 vascular/structural segments');

assert.equal(isSegmentVisible('lv', { chambersSubtracted: true }), false);
assert.equal(isSegmentVisible('pa', { chambersSubtracted: true }), true);
assert.equal(isSegmentVisible('lad', { hiddenSegments: ['lad'] }), false);
const peReport = computeCtSegmentationReport(findCtCase('triple-rule-out-pe'), {}, 'en');
const peRv = peReport.rows.find((r) => r.key === 'rv');
const peLv = peReport.rows.find((r) => r.key === 'lv');
assert.ok(peRv.finding.includes((peRv.caliberMm / peLv.caliberMm).toFixed(2)), 'RV/LV ratio must be derived from the row calibers');

for (const fov of CT_FOV_MODES) {
  const graph = buildCt3dVolumeGraph(fov.id, hrpCase);
  assert.ok(graph.tubes.length >= 4, `FOV ${fov.id} must build 3D vascular tubes`);
}

// 6. Verify file hygiene (zero em-dashes, CSS rules, HTML metadata)
const filesToCheck = [
  'ct/index.html',
  'src/ct/main.js',
  'src/ct/cardiac-ct-data.js',
  'src/ct/cardiac-ct-sim.js',
  'src/ct/cardiac-ct-render.js',
  'src/ct/cardiac-ct-segmentation.js',
  'src/ct/cardiac-ct-panel.js',
  'src/ct/cardiac-ct.css'
];

for (const rel of filesToCheck) {
  const full = path.resolve(rel);
  assert.ok(fs.existsSync(full), `${rel} must exist`);
  const content = fs.readFileSync(full, 'utf8');
  assert.ok(!content.includes('\u2014'), `${rel} must not contain em-dash (U+2014)`);
}

const css = fs.readFileSync(path.resolve('src/ct/cardiac-ct.css'), 'utf8');
assert.doesNotMatch(css, /https?:\/\//i, 'CSS must not contain external URLs');
assert.doesNotMatch(css, /overflow-x\s*:\s*hidden/i, 'CSS must not use overflow-x: hidden');
assert.doesNotMatch(css, /font-weight\s*:\s*(650|750|800)\b/, 'CSS must use standard font weights');

console.log('PASS: Cardiac CT unit, simulation, calculator, and hygiene checks');
