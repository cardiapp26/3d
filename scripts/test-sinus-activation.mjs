// Sinus-beat activation snapshot that drives the ECG simulator's 3D heart (ecg-sinus-activation.js).
import assert from 'node:assert/strict';
import { sinusActivation } from '../src/ecg/ecg-sinus-activation.js';
import { CONDUCTION_STAGES } from '../src/ecg/clinical-ecg-simulator.js';

const at = (ms, beat) => sinusActivation(ms, beat).c;
// Stage names follow the simulator's scrubber stages.
for (const stage of CONDUCTION_STAGES) assert.equal(sinusActivation((stage.startMs + stage.endMs) / 2).stage, stage.id, `${stage.id} midpoint`);
// Order: SA fires, atria spread, AV node waits, His, bundles, ventricles.
assert.equal(at(10).sa, true); assert.equal(at(10).avn, null);
assert.ok(at(60).atria > 0 && at(60).atria < 1, 'atria spreading at 60 ms');
assert.ok(at(160).atria === 1 && at(160).avn > 0 && at(160).avn < 1 && at(160).his === null, 'AV node delay');
assert.ok(at(215).his > 0 && at(215).lv === null, 'His before the ventricles');
assert.ok(at(240).septal > 0 && at(240).septalToRv === true, 'septum activates left to right');
const mid = at(285);
assert.ok(mid.lv > 0 && mid.lv < 1 && mid.rv > 0 && mid.rv < 1, 'both ventricles activating during QRS');
// Every structure only moves forward while the beat depolarizes.
let prev = null;
for (let ms = 0; ms <= 330; ms += 5) {
  const c = at(ms);
  if (prev) for (const k of ['lv', 'rv']) if (prev[k] != null) assert.ok(c[k] >= prev[k], `${k} monotonic at ${ms}`);
  prev = c;
}
// ST plateau: ventricles fully active, not recovering; T wave: recovery; end of beat: recovered.
assert.ok(at(450).lv === 1 && at(450).recovery.ventricles === 0, 'ST plateau');
assert.ok(at(650).recovery.ventricles > 0 && at(650).recovery.ventricles < 1, 'T wave recovery');
assert.equal(at(850).recovery.ventricles, 1);
assert.equal(at(450).his, null, 'conduction system dark after activation');
assert.equal(at(450).purkinjeLit, false);
assert.equal(at(450).atria, null, 'atria recovered inside the QRS');
// Bundle branch blocks: block ring, late ventricle, reversed septum in LBBB.
const rbbb = at(300, { rbbb: true }), normal = at(300);
assert.ok(rbbb.blockedAt.rbb && rbbb.rv < normal.rv, 'RBBB: RV activates late');
const lbbb = at(300, { lbbb: true });
assert.ok(lbbb.blockedAt.lbb && lbbb.lv < normal.lv && lbbb.laf === null, 'LBBB: LV late, no fascicles');
assert.equal(at(240, { lbbb: true }).septalToRv, false, 'LBBB septum right to left');
assert.deepEqual(sinusActivation(300, { lbbb: true }).bundles.lbb, { state: 'block' });
// Atrial fibrillation: no sinus spread; dropped beat: block at the AV node, no ventricles.
assert.equal(at(60, { atrial: 'fibrillation' }).atria, null);
assert.equal(at(60, { atrial: 'fibrillation' }).sa, false);
const dropped = at(280, { dropped: true });
assert.ok(dropped.blockedAt.avn && dropped.lv === null && dropped.his === null, 'dropped beat stops at the AV node');
console.log('PASS sinus activation: stage order, AV delay, septum L to R, monotonic QRS, ST plateau, T recovery, RBBB/LBBB, AF, dropped beat');
