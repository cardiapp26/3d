import assert from 'node:assert/strict';
import { register } from 'node:module';

// exam-panel.js imports its stylesheet for Vite; resolve .css imports to an empty module under Node.
register('data:text/javascript,' + encodeURIComponent(
  "export async function resolve(specifier, context, next) {" +
  "  if (specifier.endsWith('.css')) return { url: 'stub:css', shortCircuit: true };" +
  "  return next(specifier, context);" +
  "}" +
  "export async function load(url, context, next) {" +
  "  if (url === 'stub:css') return { format: 'module', source: '', shortCircuit: true };" +
  "  return next(url, context);" +
  "}"
));

const { sampleExamStrip, responseTable, createExamPanel } = await import('../src/exam-panel.js');
const { CYCLE_SYNC: S } = await import('../src/cardiac-cycle.js');
const { MANEUVER_IDS } = await import('../src/exam-physiology.js');
const { FINDING_IDS } = await import('../src/exam-findings.js');
const { TEXT, maneuverStage, murmurTexture, samGeometry } = await import('../src/exam-panel-parts.js');

assert.equal(typeof createExamPanel, 'function', 'createExamPanel exported');
const columns = 400;

// Lengths match columns for every finding
for (const findingId of FINDING_IDS) {
  const strip = sampleExamStrip({ findingId, maneuverId: 'rest', level: 0, beats: 2, bpm: 72, rhythm: 'sinus', columns });
  for (const key of ['times', 'phases', 'murmur', 'ecg']) assert.equal(strip[key].length, columns, `${findingId}.${key} length`);
  assert.ok(strip.murmur.every(v => Number.isFinite(v) && v >= 0), `${findingId} murmur finite and non-negative`);
  assert.ok(strip.sounds.every(s => s.x >= 0 && s.x < columns), `${findingId} sound columns in range`);
}

// Aortic stenosis at rest: silent in diastole, present in mid-systole
const as = sampleExamStrip({ findingId: 'aortic_stenosis', maneuverId: 'rest', level: 0, beats: 2, bpm: 72, columns });
let diastolic = 0, midSystolic = 0;
for (let i = 0; i < columns; i++) {
  const u = as.phases[i];
  if (u < S.avClosed || u > S.ivrStart) { diastolic++; assert.equal(as.murmur[i], 0, `AS silent in diastole (u=${u.toFixed(3)})`); }
  if (Math.abs(u - 0.7) < 0.03) { midSystolic++; assert.ok(as.murmur[i] > 0, `AS audible in mid-systole (u=${u.toFixed(3)})`); }
}
assert.ok(diastolic > 50 && midSystolic > 5, 'diastolic and mid-systolic columns were sampled');

// Exactly two S1 events over two beats, one per beat
const s1 = as.sounds.filter(s => s.label === 'S1');
assert.equal(s1.length, 2, 'two S1 events for two beats');
assert.ok(s1[0].x < columns / 2 && s1[1].x >= columns / 2, 'one S1 in each beat');
assert.equal(sampleExamStrip({ findingId: 'aortic_stenosis', beats: 2, bpm: 110, columns }).sounds.filter(s => s.label === 'S1').length, 2, 'two S1 at 110 bpm');
assert.ok(Math.abs(as.times[columns - 1] - 2 * 60 / 72) < 1e-3, 'two beats at 72 bpm span 1.667 s');

// HOCM is louder during Valsalva strain than at rest
const peak = arr => Math.max(...arr);
const hocmRest = sampleExamStrip({ findingId: 'hocm', maneuverId: 'rest', level: 0, columns });
const hocmStrain = sampleExamStrip({ findingId: 'hocm', maneuverId: 'valsalva_strain', level: 1, columns });
assert.ok(peak(hocmStrain.murmur) > peak(hocmRest.murmur), `HOCM Valsalva peak ${peak(hocmStrain.murmur).toFixed(3)} > rest ${peak(hocmRest.murmur).toFixed(3)}`);

// Response table: a row per maneuver, HOCM agrees with the textbook
const hocm = responseTable('hocm', 'tr');
assert.equal(hocm.length, MANEUVER_IDS.length, 'one row per maneuver');
assert.deepEqual(hocm.map(r => r.maneuverId), [...MANEUVER_IDS], 'rows follow MANEUVER_IDS order');
assert.ok(hocm.filter(r => r.match === true).length >= 10, 'at least 10 HOCM matches');
assert.ok(!hocm.some(r => r.match === false), 'no HOCM mismatches');
const stand = hocm.find(r => r.maneuverId === 'stand');
assert.equal(stand.modelText, '↑');
assert.equal(stand.lembo, 'Se %95, Sp %84');
assert.ok(stand.lvot > 40, 'standing provokes the LVOT gradient');
assert.equal(hocm.find(r => r.maneuverId === 'rest').expected, null, 'rest has no textbook entry');
assert.equal(responseTable('hocm', 'en').find(r => r.maneuverId === 'stand').lembo, 'Se 95%, Sp 84%');
assert.equal(responseTable('aortic_stenosis', 'en').find(r => r.maneuverId === 'handgrip').expected, '↓/↔', 'alternatives joined with a slash');
assert.deepEqual(responseTable('nope', 'tr'), [], 'unknown finding gives no rows');

// MVP uses timing words, not arrows
const durTr = Object.values(TEXT.tr.durDir), durEn = Object.values(TEXT.en.durDir);
const mvpTr = responseTable('mvp', 'tr');
assert.ok(mvpTr.every(r => durTr.includes(r.modelText)), 'MVP model column uses the Turkish duration wording');
assert.equal(mvpTr.find(r => r.maneuverId === 'valsalva_strain').modelText, 'daha erken/uzun');
assert.equal(responseTable('mvp', 'en').find(r => r.maneuverId === 'squat').modelText, 'later/shorter');
assert.ok(responseTable('mvp', 'en').every(r => durEn.includes(r.modelText)));

// Helpers
assert.equal(maneuverStage('rest', 3).stage, 'rest');
const vs = maneuverStage('valsalva_strain', 5);
assert.equal(vs.stage, 'hold');
assert.equal(vs.total, 3 + 10 + 3);
assert.equal(maneuverStage('valsalva_strain', 99).stage, 'done');
for (let i = 0; i < 200; i++) for (const p of ['low', 'harsh', 'blowing', 'musical']) {
  const v = murmurTexture(i, p);
  assert.ok(v >= 0.3 && v <= 1.0001, `texture in range (${p})`);
}
assert.ok(samGeometry(120).gap < samGeometry(20).gap, 'SAM gap narrows as the gradient rises');

// No em dash in any UI string
const walk = v => (typeof v === 'string' ? [v] : typeof v === 'function' ? [v('1', '2', '3')] : v && typeof v === 'object' ? Object.values(v).flatMap(walk) : []);
assert.ok(!walk(TEXT).some(s => s.includes('\u2014')), 'no em dash in TEXT');

console.log('exam-panel tests passed');
