import {
  ventricularPressure as lv, aorticPressure as ao, atrialPressure as la,
  ventricularVolume as vol, ecgValue, cycleTiming, heartSounds, EVENTS
} from '../src/wiggers.js';
import { CYCLE_SYNC, phaseToTime, timeToPhase, intervalDurations } from '../src/cardiac-cycle.js';

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) { failures++; console.error('FAIL:', name, detail); } else console.log('PASS:', name);
};
const range = (a, b, n = 200) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const E = EVENTS;

// Peak values
const lvPeak = Math.max(...range(0, 1, 400).map(u => lv(u)));
check('LV peak 110-130 mmHg', lvPeak > 110 && lvPeak < 130, lvPeak.toFixed(1));
check('LV diastolic < 15 mmHg', range(0, E.mitralClose).every(u => lv(u) < 15));
const aoAll = range(0, 1, 400).map(u => ao(u));
check('Aortic 70-130 mmHg', Math.min(...aoAll) > 70 && Math.max(...aoAll) < 130);

// Valve events sit on the pressure crossings
check('Aortic opens on the LV/Ao crossing', Math.abs(lv(E.aorticOpen) - ao(E.aorticOpen)) < 1);
check('LV below aorta just before opening', lv(E.aorticOpen - 0.01) < ao(E.aorticOpen - 0.01));
check('Aortic closes on the LV/Ao crossing', Math.abs(lv(E.aorticClose) - ao(E.aorticClose)) < 1);
check('Mitral closes on the LA/LV crossing', Math.abs(lv(E.mitralClose) - la(E.mitralClose)) < 1);
check('Mitral opens on the LA/LV crossing', Math.abs(lv(0.999) - la(0.999)) < 1);

// Gradients while valves are open / closed
check('Mitral open: LA > LV throughout diastole',
  range(0.005, E.mitralClose - 0.01).every(u => la(u) > lv(u)));
check('Mitral closed: LV > LA throughout systole',
  range(E.mitralClose + 0.01, 0.995).every(u => lv(u) > la(u)));
check('Aortic closed: aorta above LV in IVC',
  range(E.mitralClose, E.aorticOpen - 0.005).every(u => ao(u) > lv(u)));
check('Aortic closed: aorta above LV in IVR',
  range(E.aorticClose + 0.005, 1).every(u => ao(u) > lv(u)));

// Dicrotic notch: no rise above the closure pressure once the valve is shut
const closeP = ao(E.aorticClose);
check('No aortic rise above closure value after S2',
  range(E.aorticClose + 0.002, 1.52).every(u => ao(u % 1) <= closeP + 0.01));
const notchMin = Math.min(...range(E.aorticClose, E.aorticClose + 0.03).map(u => ao(u)));
check('Dicrotic notch dips after closure', notchMin < closeP - 2);

// v wave peaks at mitral opening (not earlier), y descent follows
const vPeakU = range(E.aorticClose, 0.999, 300).reduce((best, u) => la(u) > la(best) ? u : best, E.aorticClose);
check('v wave peaks at mitral opening', vPeakU > 0.97, vPeakU.toFixed(3));
check('y descent after mitral opening', la(0.06) < la(0.001) - 3);

// Volumes
check('EDV ~120 ml (sinus)', Math.abs(vol(E.mitralClose) - 120) < 2);
check('ESV ~50 ml', Math.abs(vol(E.aorticClose) - 50) < 2);
check('Volume flat in isovolumetric contraction',
  Math.abs(vol(E.mitralClose + 0.001) - vol(E.aorticOpen - 0.001)) < 0.5);
check('Volume flat in isovolumetric relaxation',
  Math.abs(vol(E.aorticClose + 0.001) - vol(0.999)) < 0.5);
check('No ejection before aortic opening', vol(E.aorticOpen) > 119);

// ECG / sounds alignment
check('R peak at QRS', ecgValue(CYCLE_SYNC.qrsPeak) > 0.8);
// Electromechanical sequence (72 bpm: 1 unit = 833 ms)
const ms = u => u * 60000 / 72;
check('P wave precedes atrial contraction by 30-100 ms',
  ms(CYCLE_SYNC.atrialStart - CYCLE_SYNC.pPeak) > 30 && ms(CYCLE_SYNC.atrialStart - CYCLE_SYNC.pPeak) < 100);
check('PR interval 120-200 ms', ms(CYCLE_SYNC.qrsOnset - (CYCLE_SYNC.pPeak - 0.04)) >= 120 && ms(CYCLE_SYNC.qrsOnset - (CYCLE_SYNC.pPeak - 0.04)) <= 200);
check('QRS onset precedes S1 (mitral closure) by 20-60 ms',
  ms(E.mitralClose - CYCLE_SYNC.qrsOnset) >= 20 && ms(E.mitralClose - CYCLE_SYNC.qrsOnset) <= 60);
check('QRS onset precedes aortic opening by 80-120 ms (PEP)',
  ms(E.aorticOpen - CYCLE_SYNC.qrsOnset) >= 80 && ms(E.aorticOpen - CYCLE_SYNC.qrsOnset) <= 120);
check('QRS lasts 60-100 ms', ms(CYCLE_SYNC.qrsEnd - CYCLE_SYNC.qrsOnset) >= 60 && ms(CYCLE_SYNC.qrsEnd - CYCLE_SYNC.qrsOnset) <= 100);
check('QT 350-440 ms', ms(E.aorticClose - CYCLE_SYNC.qrsOnset) >= 350 && ms(E.aorticClose - CYCLE_SYNC.qrsOnset) <= 440);
check('AV valve closure starts after QRS onset and is complete at S1',
  CYCLE_SYNC.avCloseStart >= CYCLE_SYNC.qrsOnset && Math.abs(CYCLE_SYNC.avClosed - E.mitralClose) < 1e-9);
check('c wave sits at mitral closure', la(E.mitralClose + 0.005) > la(E.mitralClose + 0.06));
check('Aortic closure after T peak (end of T)', E.aorticClose > CYCLE_SYNC.tPeak + 0.03);
const s = Object.fromEntries(heartSounds('sinus').map(x => [x.id, x.u]));
check('S1 at mitral closure', Math.abs(s.S1 - E.mitralClose) < 0.01);
check('S2 at aortic closure', Math.abs(s.S2 - E.aorticClose) < 0.01);

// Atrial fibrillation: no P, no a wave, no atrial kick, no S4
check('AFib: no P wave', Math.abs(ecgValue(CYCLE_SYNC.pPeak, 'afib')) < 0.1);
check('AFib: no atrial kick', vol(E.mitralClose, 'afib') < 108);
check('AFib: no S4', !heartSounds('afib').some(x => x.id === 'S4'));
check('AFib: no a wave', la(0.405, 'afib') - lv(0.405, 'afib') < 2);

// Rate dependence: diastole shortens more than systole; diastasis first
const t72 = cycleTiming(72), t130 = cycleTiming(130), t200 = cycleTiming(200);
check('72 bpm: cycle 0.83 s', Math.abs(t72.cycleSec - 0.833) < 0.01);
check('200 bpm: systole ~0.16 s, diastole ~0.14 s',
  Math.abs(t200.systoleSec - 0.16) < 0.015 && Math.abs(t200.diastoleSec - 0.14) < 0.015);
check('Diastole shrinks faster than systole',
  (t72.diastoleSec - t130.diastoleSec) > (t72.systoleSec - t130.systoleSec));
const dia130 = intervalDurations(130).find(i => i.id === 'diastasis').sec;
check('130 bpm: diastasis consumed', dia130 < 0.01, dia130.toFixed(3));
let rt = 0;
for (let i = 0; i < 40; i++) {
  const u = i / 40 + 0.007;
  rt = Math.max(rt, Math.abs(timeToPhase(phaseToTime(u, 130), 130) - u));
}
check('Time warp round-trips', rt < 1e-6);

if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('ALL WIGGERS TESTS PASSED');
