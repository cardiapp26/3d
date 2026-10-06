# Ector 2020 AVNRT induction reconstruction

Source: Ector J, Haemers P, Garweg C, Willems R. Diagnosis and treatment of atrioventricular nodal reentrant tachycardia: a case report illustrating clinical management and ablation strategy. European Heart Journal - Case Reports (2020), doi:10.1093/ehjcr/ytaa129. Figure 3, PDF page 4; catheter locations Figure 2, page 3.

Input PDF SHA-256: `444c069b863f23c7a47d6e587445ad54d79fe1de8399d37f5e7adeeecb8eabfd`.
Inspected 2026-10-06 with pdftotext -layout and pdftoppm, pages 3–4. PDF remains outside repository. Published figures are not bundled or copied into application. PDF states CC BY-NC 4.0; application uses an original schematic reconstruction with source attribution.

Source observations: four atrial pacing stimuli from RAA, first two antegrade FP beats, next two SP beats with AH prolongation, retrograde FP return after fourth paced beat followed by typical slow-fast AVNRT. Source channels: I, II, V1; RAA; His p/3/2/d; ABL p/d; five CS bipoles proximal to distal. No RV recording. Source Figure 3 speed is 100 mm/s; application retains a millisecond time axis, not a physical recording-speed calibration.

All waveform shapes, catheter-to-catheter delays, pacing intervals and numerical calipers in reconstruction are designed teaching parameters, not digitized measurements of patient trace. AH = 80,90,240,250 ms for four paced beats; HV45; retrograde septal VA30; reconstructed sustained TCL320. Source emergency ECG rate 192/min belongs to Figure 1 and is not asserted for Figure 3 or assigned to synthetic TCL. No statistical uncertainty estimate applies to designed values.

Code: `src/eps/avnrt-ector-recording.js`; display integration `src/eps/svt-dx-recordings.js`. Deterministic, no random seed. Source RAA uses existing internal hra id with per-recording RAA label. Source pacing P is labeled S to distinguish surface P wave. New I, His3, His2, ABLp recorder channels preserve source ordering. Signal amplitudes of additional bipoles are schematic.

Reproduce: `node scripts/eps/test-avnrt-ector.mjs`; project checks `npm run check`, `npm test`, `npm run build`; browser `APP_URL=http://127.0.0.1:5199 node scripts/eps/test-svt-recordings-browser.cjs`. Unit test verifies stimulus count, source channel count, event intervals, absence of duplicated H/V, stimulus-free retrograde A, sustained tachycardia and FP→SP ladder transition. Independent agent checked PDF Figure 3 and calculated intervals from events; this is software/source verification, not clinical validation.
