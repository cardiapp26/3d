import assert from 'node:assert/strict';
import { CYCLE_SYNC as S } from '../src/cardiac-cycle.js';
import {
  LVOT_THRESHOLDS, MANEUVERS, MANEUVER_IDS, lvotClass, lvotGradient, maneuverLevel, physiologyOf
} from '../src/exam-physiology.js';
import {
  FINDINGS, FINDING_IDS, heartSoundEvents, matchesExpected, murmurEnvelope, mvpClickPhase, respond
} from '../src/exam-findings.js';

// Every textbook response in the findings table is reproduced by the model.
let checked = 0;
for (const findingId of FINDING_IDS) {
  for (const maneuverId of Object.keys(FINDINGS[findingId].expected)) {
    assert.ok(MANEUVERS[maneuverId], `${findingId}: unknown maneuver ${maneuverId}`);
    const { direction, score } = respond(findingId, maneuverId);
    assert.equal(matchesExpected(findingId, maneuverId, direction), true,
      `${findingId} with ${maneuverId}: model ${direction} (score ${score.toFixed(2)}), expected ${FINDINGS[findingId].expected[maneuverId]}`);
    checked++;
  }
  // Lembo directions agree with the expected table.
  for (const [maneuverId, entry] of Object.entries(FINDINGS[findingId].lembo || {})) {
    assert.equal(matchesExpected(findingId, maneuverId, entry.direction), true, `${findingId}: Lembo ${maneuverId} direction`);
  }
}
assert.ok(checked > 60, `checked ${checked} textbook responses`);

// Classic discriminators
assert.equal(respond('hocm', 'valsalva_strain').direction, '+');
assert.equal(respond('aortic_stenosis', 'valsalva_strain').direction, '-');
assert.equal(respond('aortic_stenosis', 'post_pvc').direction, '+', 'AS louder after a PVC');
assert.equal(respond('mitral_regurgitation', 'post_pvc').direction, '0', 'MR unchanged after a PVC');
assert.equal(respond('tricuspid_regurgitation', 'inspiration').direction, '+', 'Carvallo sign');
for (const id of ['hocm', 'aortic_stenosis', 'mitral_regurgitation', 'vsd']) assert.equal(respond(id, 'inspiration').direction, '-', `${id}: left-sided murmurs fall with inspiration (Lembo Table 1)`);

// Dynamic LVOT obstruction: provocation raises it past the 50 mmHg threshold
const rest = lvotGradient(40, physiologyOf('rest'));
assert.ok(Math.abs(rest - 40) < 1e-9, 'rest gradient is the rest value');
assert.equal(lvotClass(rest), 'obstructive');
assert.ok(lvotGradient(40, physiologyOf('valsalva_strain')) >= LVOT_THRESHOLDS.severe, 'Valsalva provokes >= 50 mmHg');
assert.ok(lvotGradient(40, physiologyOf('amyl_nitrite')) >= LVOT_THRESHOLDS.severe, 'amyl nitrite provokes >= 50 mmHg');
assert.ok(lvotGradient(40, physiologyOf('squat')) < LVOT_THRESHOLDS.obstructive, 'squatting relieves obstruction');
assert.ok(lvotGradient(40, physiologyOf('phenylephrine')) < rest, 'phenylephrine lowers the gradient');
assert.ok(lvotGradient(10, physiologyOf('valsalva_strain')) > 20, 'latent obstruction is provocable');
assert.ok(lvotGradient(40, physiologyOf('post_pvc')) > rest, 'post-PVC gradient rises (Brockenbrough)');
for (const id of MANEUVER_IDS) assert.ok(lvotGradient(200, physiologyOf(id)) <= 180, 'gradient is capped');

// Maneuver time course
assert.equal(maneuverLevel('rest', 5), 0);
assert.equal(maneuverLevel('valsalva_strain', 0), 0);
assert.equal(maneuverLevel('valsalva_strain', 5), 1);
assert.ok(maneuverLevel('valsalva_strain', 1.5) > 0 && maneuverLevel('valsalva_strain', 1.5) < 1);
assert.equal(maneuverLevel('valsalva_strain', 60), 0, 'recovers after the hold');

// MVP: click earlier with a smaller LV, later with a larger LV
const clickRest = mvpClickPhase(physiologyOf('rest'));
assert.ok(mvpClickPhase(physiologyOf('valsalva_strain')) < clickRest);
assert.ok(mvpClickPhase(physiologyOf('squat')) > clickRest);
assert.ok(clickRest > S.ejectionStart && clickRest < S.ivrStart, 'click is mid-systolic at rest');

// Phonocardiogram timing on the shared clock
const restPhysio = physiologyOf('rest');
assert.ok(murmurEnvelope('aortic_stenosis', 0.7, restPhysio) > 0, 'AS murmur in ejection');
assert.equal(murmurEnvelope('aortic_stenosis', S.ivcStart + 0.02, restPhysio), 0, 'ejection murmur starts after isovolumetric contraction');
assert.equal(murmurEnvelope('aortic_stenosis', 0.2, restPhysio), 0, 'no AS murmur in diastole');
assert.ok(murmurEnvelope('mitral_regurgitation', S.avClosed + 0.02, restPhysio) > 0, 'MR starts with S1 (holosystolic)');
assert.ok(murmurEnvelope('aortic_regurgitation', S.ivrStart + 0.01, restPhysio) > murmurEnvelope('aortic_regurgitation', 0.2, restPhysio), 'AR decrescendo');
assert.equal(murmurEnvelope('aortic_regurgitation', 0.7, restPhysio), 0, 'no AR murmur in systole');
assert.ok(murmurEnvelope('mitral_stenosis', 0.42, restPhysio) > murmurEnvelope('mitral_stenosis', 0.3, restPhysio), 'presystolic accentuation');
assert.ok(murmurEnvelope('mitral_stenosis', 0.42, restPhysio, { rhythm: 'afib' }) < murmurEnvelope('mitral_stenosis', 0.42, restPhysio), 'no presystolic accentuation in AF');
assert.ok(murmurEnvelope('hocm', 0.7, physiologyOf('valsalva_strain')) > murmurEnvelope('hocm', 0.7, restPhysio), 'HOCM louder on Valsalva');

// S2 splitting widens with inspiration
const split = maneuver => {
  const e = heartSoundEvents('innocent', physiologyOf(maneuver));
  return e.find(x => x.label === 'P2').u - e.find(x => x.label === 'A2').u;
};
assert.ok(split('inspiration') > split('expiration'), 'physiologic S2 split widens on inspiration');
assert.ok(!heartSoundEvents('hocm', restPhysio, { rhythm: 'afib' }).some(e => e.label === 'S4'), 'no S4 in AF');

console.log(`PASS: physical examination model reproduces ${checked} textbook maneuver responses and LVOT provocation`);
