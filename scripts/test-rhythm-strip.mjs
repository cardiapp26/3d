import assert from 'node:assert/strict';
import { RHYTHM_EXAMPLES } from '../src/ecg/ecg-lab-model.js';
import { STRIP_SECONDS, rhythmLadder, stripSample } from '../src/ecg/rhythm-strip.js';

const L = kind => rhythmLadder(kind);
// Sinus: every P conducts with PR 160 ms; each QRS has exactly one P.
const sinus = L('sinus');
assert.ok(sinus.atrial.length >= 7 && sinus.atrial.every(a => a.conducted && Math.abs(a.pr - 0.16) < 1e-9));
assert.equal(new Set(sinus.atrial.map(a => a.qrs)).size, sinus.ventricular.length);
// First degree: all conduct, PR 280 ms.
assert.ok(L('first').atrial.every(a => a.conducted && Math.abs(a.pr - 0.28) < 1e-9));
// Wenckebach: PR 160 → 200 → 240 then a non-conducted P, twice.
const w = L('wenckebach').atrial;
assert.deepEqual(w.slice(0, 4).map(a => (a.conducted ? Math.round(a.pr * 1000) : 'x')), [160, 200, 240, 'x']);
assert.equal(w.filter(a => !a.conducted).length, 2);
// Complete block: P and QRS dissociated; QRS are escape beats.
const cb = L('complete');
assert.ok(cb.atrial.every(a => a.dissociated && !a.conducted) && cb.ventricular.every(v => v.origin === 'escape'));
// PVC: one ectopic beat; the sinus P falling in it does not conduct.
const pvc = L('pvc');
assert.equal(pvc.ventricular.filter(v => v.origin === 'ectopic').length, 1);
assert.equal(pvc.atrial.filter(a => !a.conducted).length, 1);
// AF: no P, fibrillation flag; flutter: 300/min F waves, 3:1 conduction.
assert.ok(L('af').fibrillation && L('af').atrial.length === 0);
const fl = L('flutter');
assert.equal(fl.atrial.length, Math.round(STRIP_SECONDS / 0.2));
assert.equal(fl.atrial.filter(a => a.conducted).length, fl.ventricular.length);
// P waves are visible on the strip (≥ 0.15 mV) where a sinus P is; finite everywhere.
for (const r of RHYTHM_EXAMPLES) for (let i = 0; i <= 600; i++) assert.ok(Number.isFinite(stripSample((i / 600) * STRIP_SECONDS, r.id)));
const pPeak = sinus.atrial[0].at + 0.045;
assert.ok(stripSample(pPeak, 'sinus') >= 0.15, 'sinus P wave visible');
assert.ok(Math.abs(stripSample(pPeak, 'af')) < 0.15, 'no P wave in AF');
console.log('PASS rhythm strip: P→QRS pairing (sinus, 1st degree, Wenckebach, complete block, PVC, flutter 3:1, AF), visible P waves');
