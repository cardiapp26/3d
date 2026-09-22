import { ventricularPressure, aorticPressure, atrialPressure, ventricularVolume, ecgValue, cycleTiming } from '../src/wiggers.js';
import { CYCLE_SYNC } from '../src/cardiac-cycle.js';

let failures = 0;
const check = (name, ok) => { if (!ok) { failures++; console.error('FAIL:', name); } else console.log('PASS:', name); };

const S = CYCLE_SYNC;
const maxOf = fn => Math.max(...Array.from({length: 400}, (_, i) => fn(i / 400)));
const minOf = fn => Math.min(...Array.from({length: 400}, (_, i) => fn(i / 400)));

check('LV pressure peaks 100-130 mmHg', maxOf(ventricularPressure) > 100 && maxOf(ventricularPressure) < 130);
check('LV diastolic pressure < 15 mmHg', ventricularPressure(0.2) < 15);
check('Aortic pressure stays 70-130 mmHg', minOf(aorticPressure) > 65 && maxOf(aorticPressure) < 130);
check('Aortic ~ LV during ejection', Math.abs(aorticPressure(S.ejectionPeak) - ventricularPressure(S.ejectionPeak)) < 6);
check('LV exceeds aortic before opening', ventricularPressure(S.semilunarOpen + 0.01) >= aorticPressure(S.semilunarOpen + 0.01) - 3);
check('Atrial pressure low (0-20 mmHg)', minOf(atrialPressure) >= 0 && maxOf(atrialPressure) < 20);
check('EDV ~120 ml at end-diastole', Math.abs(ventricularVolume(S.ivcStart) - 120) < 8);
check('ESV ~50 ml after ejection', Math.abs(ventricularVolume(S.semilunarCloseStart) - 50) < 8);
check('Volume constant during IVC', Math.abs(ventricularVolume(S.ivcStart) - ventricularVolume(S.ejectionStart)) < 6);
check('ECG R peak at QRS', ecgValue(S.qrsPeak) > 0.8);
const t72 = cycleTiming(72);
check('Cycle time at 72 bpm ~0.83s', Math.abs(t72.cycleSec - 0.833) < 0.01);
check('Systole shorter than diastole at 72', t72.systoleSec < t72.diastoleSec);
const t180 = cycleTiming(180);
check('Cycle shortens at 180 bpm', t180.cycleSec < 0.34);

if (failures) { console.error(failures + ' failures'); process.exit(1); }
console.log('ALL WIGGERS TESTS PASSED');
