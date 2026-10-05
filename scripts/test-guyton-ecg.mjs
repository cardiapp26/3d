import assert from 'node:assert/strict';
import {
  GUYTON_TOPICS,
  GUYTON_CALIBRATION,
  EINTHOVEN_LEADS,
  SEQUENTIAL_QRS_STEPS,
  AXIS_DEVIATIONS,
  INJURY_CURRENT_CASES,
  REENTRY_CIRCUIT_DATA
} from '../src/ecg/guyton-data.js';
import { generateEcgPoints } from '../src/ecg/guyton-render.js';

console.log('--- Testing Guyton ECG Physiology Module ---');

// 1. Check Topic Syllabus
assert.equal(GUYTON_TOPICS.length, 6, 'Should have 6 core Guyton chapters/subtopics');
for (const topic of GUYTON_TOPICS) {
  assert.ok(topic.id, 'Topic must have id');
  assert.ok([11, 12, 13].includes(topic.chapter), `Topic chapter must be 11, 12, or 13, got ${topic.chapter}`);
  assert.ok(topic.title.tr && topic.title.en, 'Topic must have bilingual titles');
  assert.ok(topic.subtitle.tr && topic.subtitle.en, 'Topic must have bilingual subtitles');
  assert.ok(
    topic.sections || topic.vectors || topic.conditions || topic.cases || topic.reentryConditions,
    'Topic must have structured physiological content'
  );
}
console.log('✓ Topics & Guyton Chapters 11-13 syllabus verified');

// 2. Check Standard Calibration Values (Guyton Fig 11-1)
assert.equal(GUYTON_CALIBRATION.paperSpeedMmPerSec, 25, 'Standard paper speed is 25 mm/s');
assert.equal(GUYTON_CALIBRATION.voltageScaleMmPerMv, 10, 'Standard voltage scale is 10 mm/mV');
assert.equal(GUYTON_CALIBRATION.smallBoxSec, 0.04, '1 small box = 0.04 s (40 ms)');
assert.equal(GUYTON_CALIBRATION.smallBoxMv, 0.1, '1 small box = 0.1 mV');
assert.equal(GUYTON_CALIBRATION.largeBoxSec, 0.20, '1 large box = 0.20 s (200 ms)');
assert.equal(GUYTON_CALIBRATION.largeBoxMv, 0.5, '1 large box = 0.5 mV');
console.log('✓ Guyton paper grid & millivolt calibration verified');

// 3. Check Einthoven's Law (Guyton Ch 11, Fig 11-6)
// Lead I + Lead III = Lead II for any angle theta
assert.equal(EINTHOVEN_LEADS.length, 6, 'Should define 6 limb leads (standard + augmented)');
const leadI = EINTHOVEN_LEADS.find(l => l.id === 'I');
const leadII = EINTHOVEN_LEADS.find(l => l.id === 'II');
const leadIII = EINTHOVEN_LEADS.find(l => l.id === 'III');
assert.ok(leadI && leadII && leadIII, 'Bipolar limb leads I, II, III must be defined');
assert.equal(leadI.angleDeg, 0);
assert.equal(leadII.angleDeg, 60);
assert.equal(leadIII.angleDeg, 120);

// Test across 360 degrees
for (let angle = 0; angle < 360; angle += 15) {
  const rad = (angle * Math.PI) / 180;
  const v1 = Math.cos(rad - (0 * Math.PI / 180));
  const v3 = Math.cos(rad - (120 * Math.PI / 180));
  const v2 = Math.cos(rad - (60 * Math.PI / 180));
  const sum = v1 + v3;
  assert.ok(
    Math.abs(sum - v2) < 1e-10,
    `Einthoven Law failure at angle ${angle}: I(${v1}) + III(${v3}) = ${sum} vs II(${v2})`
  );
}
console.log('✓ Einthoven\'s Law (Lead I + Lead III = Lead II) algebraically verified across all 360°');

// 4. Check Sequential QRS Depolarization Steps (Guyton Fig 12-1 to 12-5)
assert.equal(SEQUENTIAL_QRS_STEPS.length, 5, 'Should have 5 sequential QRS generation steps');
assert.equal(SEQUENTIAL_QRS_STEPS[0].id, 'step_1_septal');
assert.equal(SEQUENTIAL_QRS_STEPS[1].id, 'step_2_apical');
assert.equal(SEQUENTIAL_QRS_STEPS[2].id, 'step_3_freewall');
assert.equal(SEQUENTIAL_QRS_STEPS[3].id, 'step_4_basal');
assert.equal(SEQUENTIAL_QRS_STEPS[4].id, 'step_5_jpoint');
console.log('✓ Sequential 5-step QRS depolarization vectors verified');

// 5. Check Mean Electrical Axis & Deviations (Guyton Ch 12)
assert.equal(AXIS_DEVIATIONS.normal.range[0], -30);
assert.equal(AXIS_DEVIATIONS.normal.range[1], 90);
assert.ok(AXIS_DEVIATIONS.lad.causes.tr.length > 0 && AXIS_DEVIATIONS.lad.causes.en.length > 0);
assert.ok(AXIS_DEVIATIONS.rad.causes.tr.length > 0 && AXIS_DEVIATIONS.rad.causes.en.length > 0);
console.log('✓ Electrical axis deviation ranges and etiologies verified');

// 6. Check Current of Injury & J-Point Reference (Guyton Fig 12-13 to 12-19)
assert.ok(INJURY_CURRENT_CASES.anterior_mi, 'Must include anterior MI case');
assert.ok(INJURY_CURRENT_CASES.inferior_mi, 'Must include inferior MI case');
assert.ok(INJURY_CURRENT_CASES.pericarditis, 'Must include pericarditis case');
assert.ok(INJURY_CURRENT_CASES.anterior_mi.jPointShiftMv > 0, 'Anterior MI has ST elevation at J-point');
assert.ok(INJURY_CURRENT_CASES.inferior_mi.jPointShiftMv > 0, 'Inferior MI has ST elevation at J-point');
console.log('✓ Current of injury & J-point reference mechanics verified');

// 7. Check Circus Movement Re-entry Physics (Guyton Fig 13-15 to 13-17)
assert.ok(REENTRY_CIRCUIT_DATA.guytonThreeConditions.tr.length === 3, 'Must define Guyton 3 circus criteria in TR');
assert.ok(REENTRY_CIRCUIT_DATA.guytonThreeConditions.en.length === 3, 'Must define Guyton 3 circus criteria in EN');
console.log('✓ Circus movement re-entry criteria verified');

// 8. Check Synthetic Wave Generator
const points = generateEcgPoints(500, { rate: 75, stElev: 0.3 });
assert.ok(Array.isArray(points) && points.length > 50, 'Generated ECG points array must have elements');
for (const pt of points) {
  assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.mv), 'All points must have finite x and mv coordinates');
}
console.log('✓ Calibrated ECG wave coordinate generator verified');

console.log('All Guyton ECG test assertions passed successfully!');
