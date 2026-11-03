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

// Normal reference: no murmur, grade 0, A2 before P2
assert.equal(FINDINGS.normal.kind, 'reference');
assert.equal(respond('normal', 'handgrip').grade, 0, 'normal stays without a murmur');
for (let u = 0; u < 1; u += 0.01) assert.equal(murmurEnvelope('normal', u, restPhysio), 0, `no murmur in normal (u=${u.toFixed(2)})`);
const normalEvents = heartSoundEvents('normal', restPhysio);
assert.deepEqual(normalEvents.map(e => e.label), ['S1', 'A2', 'P2'], 'normal: S1, A2, P2 only');
assert.ok(normalEvents[1].u < normalEvents[2].u, 'A2 precedes P2');

// Acute severe MR: early decrescendo that stops well before A2, with an S3
const amr = u => murmurEnvelope('acute_mitral_regurgitation', u, restPhysio);
assert.equal(FINDINGS.acute_mitral_regurgitation.kind, 'systolic');
assert.ok(amr(S.avClosed + 0.03) > 0, 'acute MR starts at S1');
assert.ok(amr(S.avClosed + 0.03) > amr(S.avClosed + 0.15), 'acute MR decrescendo');
const amrEnd = S.avClosed + 0.004 + FINDINGS.acute_mitral_regurgitation.span;
assert.ok(amrEnd < S.ivrStart - 0.1, 'acute MR ends well before A2');
for (let u = amrEnd + 0.005; u < 1; u += 0.01) assert.equal(amr(u), 0, `acute MR silent after mid-systole (u=${u.toFixed(2)})`);
assert.ok(amr(0.2) === 0, 'acute MR silent in diastole');
assert.ok(heartSoundEvents('acute_mitral_regurgitation', restPhysio).some(e => e.label === 'S3'), 'acute MR has an S3');
assert.ok(Math.max(...[0.5, 0.55, 0.6].map(amr)) < murmurEnvelope('mitral_regurgitation', 0.55, restPhysio), 'acute MR fainter than chronic');

// Acute severe AR: short early diastolic decrescendo, soft systolic flow murmur, soft S1, loud P2, S3
const aar = u => murmurEnvelope('acute_aortic_regurgitation', u, restPhysio);
const ar = u => murmurEnvelope('aortic_regurgitation', u, restPhysio);
assert.ok(aar(S.ivrStart + 0.01) > aar(S.ivrStart + 0.12), 'acute AR decrescendo');
assert.equal(aar(0.15), 0, 'acute AR is over by mid-diastole');
assert.ok(ar(0.15) > 0, 'chronic AR still audible there (longer murmur)');
assert.ok(aar(0.64) > 0 && aar(0.64) < murmurEnvelope('aortic_stenosis', FINDINGS.aortic_stenosis.peak, restPhysio), 'soft systolic flow murmur in acute AR');
assert.equal(aar(S.avClosed + 0.03), 0, 'flow murmur waits for ejection');
const aarEvents = Object.fromEntries(heartSoundEvents('acute_aortic_regurgitation', restPhysio).map(e => [e.label, e]));
const normalBy = Object.fromEntries(normalEvents.map(e => [e.label, e]));
assert.ok(aarEvents.S1.amp < 0.4 * normalBy.S1.amp, 'acute AR: soft or absent S1 (premature mitral closure)');
assert.ok(aarEvents.P2.amp > aarEvents.A2.amp && aarEvents.P2.amp > normalBy.P2.amp, 'acute AR: loud P2, soft A2');
assert.ok(aarEvents.S3, 'acute AR has an S3');

// Chronic MS: loud S1, loud P2, OS after A2; chronic AS: soft A2, late peak
const ms = Object.fromEntries(heartSoundEvents('mitral_stenosis', restPhysio).map(e => [e.label, e]));
assert.ok(ms.S1.amp > normalBy.S1.amp && ms.P2.amp > normalBy.P2.amp && ms.OS, 'MS: loud S1, loud P2, opening snap');
const asA2 = heartSoundEvents('aortic_stenosis', restPhysio).find(e => e.label === 'A2');
assert.ok(asA2.amp < normalBy.A2.amp, 'AS: soft A2');
assert.ok(FINDINGS.aortic_stenosis.peak > (S.ejectionStart + S.ivrStart) / 2, 'AS peaks after mid-systole');
for (const id of FINDING_IDS) for (const text of [FINDINGS[id].label, FINDINGS[id].teaching, FINDINGS[id].radiation]) {
  for (const v of Object.values(text)) assert.ok(!v.includes('\u2014'), `${id}: no em dash`);
  assert.ok(text.tr && text.en, `${id}: bilingual text`);
}

console.log(`PASS: physical examination model reproduces ${checked} textbook maneuver responses and LVOT provocation`);
