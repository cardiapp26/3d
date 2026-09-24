# Cardiac Hemodynamics Reference (for the teaching module)

Clinical reference note that drives the interactive hemodynamics module. All content is paraphrased from four sources. Machine-readable scenario values live in `hemodynamics-scenarios.json` next to this file.

## Sources and citation convention

| N | Source | Pages |
|---|--------|-------|
| 1 | Stouffer GA (ed.). *Cardiovascular Hemodynamics for the Clinician*, 2nd ed. Wiley, 2017 | 384 |
| 2 | Hahn RT. *Hemodynamics I: Basic Calculations* (State-of-the-Art Echo 2013 slides) | 48 |
| 3 | Oh JK. *Hemodynamic Cases: Decision Making* (Hemodynamics III, 2013 slides) | 51 |
| 4 | Wu P, Patel AH, Kern MJ. *Right and left heart hemodynamics – The PCR-EAPCI Textbook* (2023) | 28 |

**Every page number below is the PDF page number, not the printed page number.** For Source 1 the PDF page equals the printed page + 12 (e.g., printed p. 41 = PDF p. 53). Slide decks (Sources 2 and 3) are cited by PDF page, which equals the slide number. Citation format: [Source N, p. X].

Sources 2 and 3 are echocardiography courses; they contribute Doppler-derived pressure relations and a few worked examples, not catheter-lab technique.

---

## A. Measurement technique and artifacts

### Zero and leveling
- The transducer is zeroed at right atrial level; in a supine patient that is the phlebostatic axis, where the 4th intercostal space meets the midaxillary line [Source 1, p. 36–37]. Source 4 describes the same point as "mid chest" and says an incorrect zero exaggerates or underestimates pressures [Source 4, p. 12].
- Each centimeter of leveling error shifts readings by about 0.75 mmHg: a transducer placed too high reads falsely low, and one placed too low reads falsely high [Source 1, p. 38].
- An incorrectly zeroed LV transducer can fake a persistent diastolic PCWP-LV gradient that looks like mitral stenosis [Source 1, p. 354].

### Tubing, scale, ECG
- Keep tubing short, stiff and non-compliant; use few stopcocks and connections; remove all air. Narrow, long or compliant tubing, loose connections, transducer faults and a partly occluded lumen (e.g., thrombus) all damp the signal [Source 1, p. 36–38]. Source 4 adds that loose connections can make LV pressure read falsely low and aortic pressure falsely high [Source 4, p. 13].
- Match the scale to the chamber: about 0–200 mmHg for LV, 0–25 mmHg for atrial waveforms (a, v, x, y detail is lost on a large scale) [Source 1, p. 38]. For mitral gradients use 0–50 mmHg at 100 mm/s paper speed [Source 1, p. 146–147].
- Always read pressures against a simultaneous ECG; a dual-channel recording is preferred [Source 1, p. 38]. Arrhythmias or conduction defects that are missed on a single displayed lead commonly distort waveform interpretation [Source 4, p. 13].

### End-expiration and respiratory variation
- Read at end-expiration, when pleural pressure is closest to atmospheric [Source 1, p. 38; Source 1, p. 64].
- Spontaneous breathing: intrathoracic pressure falls from about −3 to −4 mmHg at end-expiration to −7 to −8 mmHg at end-inspiration, so intracardiac pressures dip on inspiration [Source 1, p. 38; Source 1, p. 64].
- Positive-pressure ventilation reverses this (pressures rise on inspiration; intrathoracic pressure can exceed 10 mmHg), and high intrathoracic pressure can make the wedge underestimate LA pressure [Source 1, p. 38; Source 1, p. 64]. With pressure-support breaths, end-expiration is the point just before the brief inspiratory dip [Source 1, p. 38–40; Source 1, p. 47].
- Normal systolic arterial pressure drops about 5 mmHg with inspiration [Source 1, p. 74].

### Fluid-filled vs micromanometer (high-fidelity) catheters
- Fluid-filled systems commonly show resonance ("ringing") from an under-damped line; an air bubble produced overshoot spikes that disappeared after flushing [Source 4, p. 11–12].
- Source 1 shows the opposite failure mode for a bubble: an over-damped LV trace with rounded peaks and poorly defined systolic and diastolic phases [Source 1, p. 356]. The simulator should treat both as air-in-line artifacts (under-damped: overshoot and ringing; over-damped: rounded, blunted, low systolic and falsely high diastolic).
- Micromanometer catheters above and below the aortic valve show the true LV-Ao relation; fluid-filled femoral sheath pressure arrives late and overshoots [Source 4, p. 13; Source 4, p. 15]. Ranked from least to most accurate for LV-Ao gradients: single-catheter pullback, LV plus femoral sheath, LV plus long aortic sheath, bilateral femoral access, double-lumen pigtail, transseptal LV plus ascending aorta, pressure wire plus ascending aorta, multi-transducer micromanometer [Source 4, p. 12; Source 4, p. 15].
- Constriction criteria were derived with high-fidelity catheters; soft, small fluid-filled catheters can distort waveforms substantially [Source 1, p. 225; Source 1, p. 241].

### Catheter position artifacts
- Pigtail side holes straddling the aortic valve contaminate LV and aortic pressure, lower the measured AS gradient and inflate valve area; a telltale sign is LV pressure falling during diastole [Source 1, p. 124; Source 1, p. 356; Source 4, p. 13–14].
- A catheter slipping in and out of the tricuspid valve can mimic high RA pressure with a large v wave [Source 1, p. 356].
- An RV waveform from the distal port of an indwelling PA catheter means the tip has fallen back into the RV [Source 1, p. 34–36].
- Catheter whip (fling) is not described in any of the four sources.

### Wedging, over-wedging and confirming a true wedge
- Inflate slowly while watching the waveform, stop once a wedge tracing appears, do not exceed 1.5 mL of air, avoid wedging for more than 2 respiratory cycles, never flush while wedged; wedging with 0.5 mL or less suggests the tip is too distal [Source 1, p. 45].
- Over-wedging: the trace climbs or falls steadily in a straight line; deflate immediately and check tip position on chest X-ray [Source 1, p. 45].
- Spontaneous wedge can occur as the catheter softens and migrates distally [Source 1, p. 44].
- Confirm a true wedge by: (1) distinct a and v waves timed to the ECG or LV trace, so it is not a damped PA pressure; (2) end-hole wedge blood saturation above 95% [Source 4, p. 17–18; Source 1, p. 149]. A high PCWP can be spuriously raised by incomplete wedging, pulmonary vein stenosis or lung disease; an uncertain or poor-quality wedge should prompt transseptal LA measurement [Source 4, p. 16–17].
- PCWP does not reflect LA pressure in veno-occlusive disease or cor triatriatum [Source 1, p. 149; Source 1, p. 367].
- "Hybrid" (partially wedged PA/PCWP) tracings and fluoroscopic confirmation of wedge position are not described in these sources.

### PA diastolic as a wedge surrogate
- If PA diastolic and PCWP agree within about 6 mmHg (rule of thumb), PA diastolic can be followed instead of repeated wedging [Source 1, p. 45]. PA diastolic tracks PCWP only when the pulmonary vasculature is not remodeled [Source 1, p. 217].

---

## B. Normal values

### Pressures (mmHg)

| Site | Component | Source 1 Table 3.1 range | Other statements in sources |
|---|---|---|---|
| RA | mean | 2–8 [Source 1, p. 53] | 0–5 in Table 5.2 [Source 1, p. 86]; 5 in schematic [Source 1, p. 142]; 2–8 again [Source 1, p. 217] |
| RA | a, v | no numbers given | a > v in RA [Source 1, p. 83] |
| RV | systolic | 17–32 [Source 1, p. 53; p. 55] | about 25 [Source 1, p. 34]; 20 in schematic [Source 1, p. 142] |
| RV | end-diastolic | 2–8 [Source 1, p. 53; p. 55] | 0–8 [Source 1, p. 34] |
| PA | systolic | 17–32 [Source 1, p. 53] | 18–25 [Source 1, p. 322] |
| PA | diastolic | 4–13 [Source 1, p. 53] | 6–10 [Source 1, p. 322] |
| PA | mean | 9–19 [Source 1, p. 53] | below 20 [Source 1, p. 322]; 20/8 (12) in schematic [Source 1, p. 142] |
| PCWP / LA | mean | 2–12 [Source 1, p. 53; p. 56] | 6 in schematic [Source 1, p. 142] |
| PCWP / LA | a, v | no numbers given | v ≥ a in LA [Source 1, p. 83; p. 368] |
| LV | systolic | 90–140 [Source 1, p. 53; p. 57] | 120 in schematic [Source 1, p. 142] |
| LV | end-diastolic | 5–12 [Source 1, p. 53; p. 57] | normally below 12 [Source 1, p. 60] |
| Aorta | mean | 70–105 [Source 1, p. 53] | |
| Aorta | systolic/diastolic | not tabulated | 120/80 in schematic [Source 1, p. 142] |

Mean LA pressure normally exceeds mean RA pressure [Source 1, p. 83; Source 4, p. 20].

### Saturations, flow and resistance

| Quantity | Value | Citation |
|---|---|---|
| Mixed venous (PA) SvO2 | 60–80% | [Source 1, p. 43] |
| Mixed venous SvO2 | about 75% | [Source 1, p. 218] |
| Right-heart chambers (schematic) | about 75%; left side 95–97% | [Source 1, p. 144] |
| Systemic arterial (example) | 98% | [Source 1, p. 111] |
| Pulmonary venous, if not sampled | assume 98% | [Source 1, p. 108] |
| Pulmonary venous, if not sampled | assume 95% | [Source 4, p. 18] |
| Normal RA-PA saturation difference | 2.3 ± 1.7% | [Source 1, p. 107] |
| Normal SVC-RA saturation difference | 3.9 ± 2.4% | [Source 1, p. 107] |
| Cardiac output (schematic) | 6 L/min | [Source 1, p. 142] |
| Cardiac index | 2.5–4 L/min/m2 | [Source 1, p. 41] |
| CI incompatible with life | below 1 L/min/m2 | [Source 1, p. 94] |
| SVR | 800–1200 dyn·s·cm-5 | [Source 1, p. 41] |
| SVR | 700–1600 dyn·s·cm-5 | [Source 1, p. 95] |
| PVR | 40–150 dyn·s·cm-5 | [Source 1, p. 42] |
| PVR | 20–130 dyn·s·cm-5 | [Source 1, p. 95] |
| TPG | abnormal above 15 mmHg | [Source 1, p. 219; p. 328] |
| RV stroke work index | 5–10 g·m2/beat | [Source 1, p. 219] |

**Where the sources disagree:** RA mean (2–8 vs 0–5), PA systolic/diastolic ranges (17–32/4–13 vs 18–25/6–10), SVR (800–1200 vs 700–1600), PVR (40–150 vs 20–130), assumed pulmonary venous saturation (98% vs 95%). No source gives numeric normal ranges for the individual a and v waves, for SVC/IVC saturations, or for DPG.

---

## C. Normal waveform morphology and ECG timing

### Mechanical sequence
- Order: RA contracts, LA contracts, LV starts contracting, mitral valve closes, RV starts contracting, tricuspid closes, pulmonic opens, aortic opens, aortic closes, pulmonic closes, tricuspid opens, mitral opens [Source 1, p. 49].

### Atrial waveform (RA and LA/PCWP)
- **a wave**: atrial contraction; begins right after the P wave, its peak trailing the P-wave peak by about 60–80 ms in the RA [Source 1, p. 53; Source 1, p. 81]. On the RA trace it falls within the PR interval [Source 1, p. 34]. Absent in atrial fibrillation [Source 1, p. 81; Source 4, p. 3].
- **x descent**: atrial relaxation plus descent of the AV junction in early systole [Source 1, p. 53].
- **c wave**: AV valve closure at the onset of ventricular systole; a small bump just after the QRS, separated from the a wave by roughly the PR interval, more visible in RA than PCWP and with long PR intervals; the descent after it is x′ [Source 1, p. 53–54; Source 1, p. 83].
- **v wave**: atrial filling against a closed AV valve; peaks at end-systole just before the AV valve opens, coinciding with the T wave or its end [Source 1, p. 34; Source 1, p. 54; Source 1, p. 83].
- **y descent**: AV valve opening and rapid early ventricular filling [Source 1, p. 54; Source 1, p. 83].
- Tachycardia shortens diastole and can merge v and a waves; bradycardia separates them and may show an **h wave** (mid-late diastolic plateau) [Source 1, p. 83].
- RA: a usually > v. LA: v > a or about equal [Source 1, p. 83]. Mean atrial pressure normally falls with inspiration [Source 1, p. 83].
- Compliant atria give small waves even with large flow; stiff atria exaggerate waves at normal volumes [Source 4, p. 3].

### PCWP delay relative to LA and ECG
- The wedge waveform is damped and delayed relative to LA because pressure travels back through the pulmonary veins and capillaries [Source 1, p. 56; Source 1, p. 81].
- PCWP a wave starts in or at the end of the QRS; the v wave falls later, in the T-P interval [Source 1, p. 36]. P-wave onset to PCWP a wave is about 200 ms (may exceed 200 ms), versus about 85 ms from P onset to actual LA contraction [Source 1, p. 53; Source 1, p. 81].
- Reported LA-to-wedge transmission delay: 140–200 ms [Source 1, p. 86] versus 40–120 ms [Source 1, p. 149]. The sources disagree; a simulator value near 100–150 ms sits between them.
- The PCWP v wave onset trails the PA upstroke by about 110 ms (large-v-wave patients) [Source 1, p. 87]. For gradient work, shift the wedge left so its v wave lines up with the LV downstroke [Source 1, p. 90; Source 4, p. 18].

### Ventricular waveforms
- RV systole: rapid upstroke with or right after the QRS, rounded peak, rapid fall [Source 1, p. 55]. RV and PA systolic peaks coincide with the T wave [Source 1, p. 36].
- Diastole in three phases: rapid early filling (60–75% of filling; the early "dip"), slow filling or diastasis (15–25%), and atrial kick (10–25%) [Source 1, p. 55]. The RV a wave is simultaneous with, and matches, the RA a wave [Source 1, p. 55–56].
- **EDP point**: the nadir after the a wave (RV) [Source 1, p. 56]; for LV, the "Z point" on the downslope of the LV a wave at the LA-LV crossover, coincident with the R wave [Source 1, p. 59–60]. Source 4 places LVEDP at the R-wave intersection, where the mitral valve also closes [Source 4, p. 2–3].
- LV pressure peaks during the T wave [Source 1, p. 57]. Abnormal relaxation: pressure keeps falling into mid-diastole. Stiff ventricle: tall a wave with a high EDP even if pre-a pressure is normal [Source 1, p. 60].

### PA waveform
- Tracks RV systole while the pulmonic valve is open; the peak falls within the T wave [Source 1, p. 58].
- Pulmonic closure produces a dicrotic notch that marks the end of ejection; afterwards pressure declines gradually [Source 1, p. 58].
- PA diastolic should approximate PCWP without vascular remodeling [Source 1, p. 217]; rule-of-thumb agreement within 6 mmHg [Source 1, p. 45].
- Catheter distances from the right internal jugular vein: RV at 25 ± 3 cm, PA at 36 ± 4 cm, wedge at 43 ± 6 cm [Source 1, p. 36].

### Aortic waveform
- Steep upstroke (**anacrotic limb**) at aortic valve opening, then a rounded **anacrotic shoulder** during reduced ejection [Source 1, p. 71; Source 1, p. 73].
- The **dicrotic notch (incisura)** on the downslope marks aortic valve closure and end of LV ejection, then diastolic pressure declines gradually as blood runs off to the periphery [Source 1, p. 73; Source 4, p. 3]. In hypovolemia the notch is delayed, the dicrotic limb steeper and pulse pressure narrower [Source 1, p. 73].
- Without valve disease, aortic systolic equals LV systolic [Source 1, p. 59].
- **Peripheral amplification**: femoral or brachial systolic and pulse pressure exceed central aortic values while mean pressure is unchanged; most marked in the young and in AR [Source 1, p. 77; Source 1, p. 157]. Femoral pressure is also delayed [Source 4, p. 13].
- Reading: systolic is the peak, diastolic the trough, pulse pressure their difference, mean is the time-average [Source 1, p. 69]. MAP ≈ DBP + 1/3 pulse pressure, valid near 60 bpm and progressively wrong at faster rates [Source 1, p. 17–18; Source 1, p. 70]. Mean PAP is estimated the same way [Source 1, p. 42].
- Systolic pressure depends mainly on stroke volume; diastolic mainly on SVR [Source 1, p. 70].

---

## D. Cardiac output and derived indices

### Fick
- CO = VO2 / [Hb (g/dL) × 1.36 × 10 × (SaO2 − SvO2)] [Source 1, p. 41; Source 1, p. 96]. All sources use **1.36 mL O2/g Hb**; the alternative 1.34 constant is not mentioned (the only "1.34" is the cm-blood to mmHg conversion for venous pressure [Source 1, p. 92]).
- Assumed VO2: 125 mL/min/m2 in adults [Source 1, p. 96]; 130 mL/min/m2 in the RHC and heart-failure chapters [Source 1, p. 41; Source 1, p. 218]. Empirical formulas (Krovetz-Goldbloom, LaFarge-Miettinen, Bergstra) also exist [Source 1, p. 96].
- Measured VO2 varies widely: mean 126 ± 26 mL/min/m2 in one series, 71–176 in another; over half of assumed values missed measured values by more than 10% [Source 1, p. 96]. Assumed-Fick error is at least 10–15% [Source 1, p. 97].
- Worked example: VO2 130 × BSA 1.7, Hb 12, SaO2 0.98, SvO2 0.55 gives 3.48 L/min [Source 1, p. 41].
- Fick is most accurate in low-output states (large A-V difference) and with irregular rhythms; avoid changing supplemental O2 during measurement [Source 1, p. 97]. In end-stage HF an assumed VO2 can overestimate CO [Source 1, p. 218].

### Thermodilution
- 10 mL of cold saline into the RA via the proximal port, temperature sensed in the PA; the area under the temperature curve is inversely related to CO [Source 1, p. 97]. Inject smoothly in under 4 s; the computation constant must match injectate volume and temperature [Source 1, p. 40].
- Unreliable with significant TR (about 20% lower than Fick in one series; worse with PEEP-induced TR) [Source 1, p. 97–99], with irregular rhythms [Source 1, p. 99], and at low output (overestimates: higher than Fick whenever Fick CO was below 3.5 L/min, differing by about 35% when at or below 2.5 L/min) [Source 1, p. 99]. Most accurate at high output; error 5–20% under ideal conditions [Source 1, p. 95; Source 1, p. 99]. Iced injectate warms about 1 °C per 28 s at room temperature [Source 1, p. 99].
- Intracardiac shunts are not discussed as a thermodilution limitation; Source 1 notes only that thermodilution measures right-sided output [Source 1, p. 127].

### Derived indices
- CI = CO / BSA [Source 1, p. 17; Source 1, p. 41].
- SVR = (MAP − RAP) / CO × 80 dyn·s·cm-5 [Source 1, p. 41; Source 1, p. 95]. Example: MAP 93, CVP 3, CO 5 gives 1440 [Source 1, p. 42].
- PVR = (mean PAP − PCWP) / CO, in Wood units; × 80 converts to dyn·s·cm-5 (1 WU = 80 dyn·s·cm-5; 160 dyn·s·cm-5 = 2 WU) [Source 1, p. 42; Source 1, p. 326].
- TPG = mean PAP − mean PCWP [Source 1, p. 219].
- **DPG** (PA diastolic − PCWP) is not defined in any source.
- SV = CO / HR [Source 1, p. 95]. Doppler SV = LVOT area (D² × 0.785) × LVOT VTI [Source 2, p. 29; Source 1, p. 100].
- SvO2 relation: SvO2 = SaO2 − VO2 / (Hb × 1.36 × Q) [Source 1, p. 218].

---

## E. Shunts

### Oximetry run
- Sample on room air or no more than 30% O2 (dissolved O2 otherwise inflates Qp) [Source 1, p. 105].
- Sites: SVC just above the RA, IVC just below the diaphragm (to include hepatic venous blood), low/mid/high RA, RV, PA (main or branches), PCWP or LA, LV or systemic artery; draw the arterial sample at the same time [Source 1, p. 105–106]. Source 4 lists a finer sequence (high and low SVC and IVC, RA at several levels, RV inflow/mid/apex/outflow, main and branch PA, aorta and, if crossing an ASD, pulmonary vein or LA) [Source 4, p. 16].
- Many operators run it retrograde from the PA to shorten collection time; aspirate slowly (fast aspiration raises saturation); flush between samples [Source 1, p. 106].
- Normal sampling variability in O2 content: about 2 mL/dL in RA, 1 in RV, 0.5 in PA [Source 1, p. 105]. With Hb 15, a 5% saturation difference ≈ 1 mL O2/dL [Source 1, p. 106].

### Step-up thresholds
- Source 4 table: atrial level (SVC/IVC to RA) ≥7%; ventricular ≥5%; great vessel ≥5% [Source 4, p. 19]. Its text also cites a PA saturation more than 7% above RA for an atrial shunt [Source 4, p. 18].
- Source 1 (Hillis): cut-offs of 8.7% between SVC and RA and 5.7% between RA and PA (mean + 2 SD); alternatively 8% SVC-to-PA and 5% RV-to-PA [Source 1, p. 107].
- Step-ups are larger when Hb or CO is low: a 5% step-up corresponds to about 3400, 1300 or 285 mL/min of shunt at systemic flows of 7.5, 5 or 2.5 L/min [Source 1, p. 106–107]. Oximetry misses small shunts and loses accuracy at high output [Source 1, p. 106].

### Mixed venous saturation and Qp/Qs
- Mixed venous (MV) = sample one chamber proximal to the step-up [Source 4, p. 18]. ASD: MV = (3 × SVC + IVC) / 4 (Flamm); VSD: use RA; PDA: use RV [Source 1, p. 108; Source 1, p. 110]. Other published MV formulas: (2 SVC + IVC)/3, (SVC + 2 IVC)/3, (SVC + IVC)/2, IVC alone, SVC alone [Source 1, p. 110].
- Qs = VO2 / (arterial − MV content); Qp = VO2 / (PV − PA content); effective pulmonary flow Qep = VO2 / (PV − MV content) [Source 4, p. 19; Source 1, p. 108].
- Simplified: **Qp/Qs = (SaO2 − MV sat) / (PV sat − PA sat)** [Source 1, p. 108]. PV may be replaced by LA, wedge or systemic arterial saturation if no right-to-left shunt, or assumed 98% [Source 1, p. 108–109].
- Shunt flow = Qp − Qs; the ratio alone does not give shunt volume [Source 1, p. 109]. Left-to-right: pulmonary flow exceeds effective flow by the shunt amount [Source 4, p. 20].
- Worked ASD example: SVC 69, IVC 64, RV 82, PA 84, arterial 98 gives MV 67.75 and Qp/Qs ≈ 2.2 [Source 1, p. 111]. A second ASD case gives Qp/Qs = (94 − 59)/(94 − 77) = 2.1 [Source 1, p. 367].
- Qp/Qs is unaffected by Hb and relates linearly to shunt flow, unlike the raw step-up [Source 1, p. 107].

### Significance
- Qp/Qs 1–1.5: observe; 1.5–2.0: consider closure if procedural risk is low; above 2: close unless contraindicated [Source 1, p. 109–110]. Source 4: ASDs with Qp/Qs above 1.5 mainly need closure [Source 4, p. 20].
- ASD shunting may grow with age as LV compliance falls and shrink with pulmonary hypertension [Source 1, p. 110].
- Typical ASD/VSD/PDA pressure profiles are not tabulated in these sources; the scenario JSON values are interpolated.

### Right-to-left shunt
- Suspect when left-heart or aortic samples are desaturated; localize by sequential LA, LV and aortic sampling [Source 4, p. 18]. Qp/Qs is then below 1 [Source 1, p. 110]. Mostly seen in Eisenmenger physiology [Source 1, p. 103; Source 1, p. 327]. Valsalva can transiently put RA above LA and open a PFO [Source 4, p. 20].

---

## F. Valvular stenosis

### Aortic stenosis
- Normal AVA about 4 cm2; gradient rises exponentially as area falls [Source 1, p. 115–116].
- Cath lab traditionally reports **peak-to-peak** (LV peak − aortic peak, not simultaneous, no echo equivalent) whereas echo reports **peak instantaneous**; peak-to-peak is always below peak instantaneous. Mean gradients agree well between modalities [Source 1, p. 121–122]. Hypothetical example: peak instantaneous 56, mean 38, peak-to-peak 30 mmHg [Source 1, p. 121]. Echo rule: mean ≈ 0.66 × maximal instantaneous gradient, and peak-to-peak approximates mean [Source 2, p. 21].
- Use simultaneous LV and ascending aortic pressures; pullback is suboptimal (heart rate changes between beats) [Source 1, p. 122; Source 1, p. 125].
- Femoral surrogate pitfalls: Source 1 says peripheral amplification causes **underestimation** of the gradient, while iliac stenosis causes overestimation [Source 1, p. 123]. Source 4 says the femoral delay and overshoot artificially **increase** the mean gradient [Source 4, p. 13]. Disagreement: both agree central aortic pressure is preferred.
- **Gorlin**: AVA (cm2) = [CO (mL/min) / (SEP (s/beat) × HR)] / (44.3 × √mean gradient) [Source 1, p. 123]. SEP runs from aortic opening to closure [Source 1, p. 123]. Example: CO 4200, HR 70, SEP 0.33, mean 110 gives 0.4 cm2 [Source 1, p. 128].
- **Hakki**: AVA ≈ CO (L/min) / √(peak-to-peak gradient) [Source 1, p. 123; Source 4, p. 8].
- Echo severity (ACC/AHA): severe = jet above 4 m/s, mean above 40 mmHg, AVA below 1.0 cm2, indexed below 0.6 cm2/m2 [Source 1, p. 121].
- Low-flow low-gradient: raise CO with dobutamine or nitroprusside. True AS: gradient and CO rise with AVA unchanged or smaller, contractile reserve ≥25% SV increase. Pseudo-AS: little gradient rise, calculated AVA increases [Source 1, p. 126–127] (example: true AS CO 2 to 4 L/min, mean 25 to 50 mmHg, AVA 0.8 constant) [Source 1, p. 127]. Gorlin may overestimate severity at low flow [Source 4, p. 8].
- Heart rate: Gorlin and Hakki diverge in bradycardia and tachycardia and in mild-moderate AS [Source 4, p. 8].
- Concomitant AR: Fick/thermodilution undercount transvalvular flow, overestimating AS severity [Source 1, p. 127].
- Fixed obstruction: gradient falls with preload reduction and pulse pressure rises after a PVC (negative Brockenbrough) [Source 1, p. 122]. Carabello sign: aortic systolic rises more than 5 mmHg when the catheter is pulled out of the LV, seen in 15 of 20 patients with AVA below 0.6 cm2 [Source 1, p. 129].
- Aortic contour: slow rising pulsus parvus et tardus [Source 1, p. 73–76].

### Mitral stenosis
- Normal MVA 4–6 cm2; symptoms usually once below 2 cm2 [Source 1, p. 141].
- Findings: high LA pressure, LA-LV gradient throughout diastole, prominent a wave, slowed y descent, rising right-heart pressures [Source 1, p. 143]. LVEDP usually normal (low in about 15%) [Source 1, p. 146].
- Measure simultaneous LV and LA (direct transseptal LA is most accurate) or PCWP [Source 4, p. 9; Source 1, p. 146]. Average 5 beats in sinus rhythm, 10 in AF [Source 1, p. 147; Source 1, p. 150; Source 4, p. 10].
- **Wedge delay correction**: phase-shift PCWP left so its v wave falls on the LV downstroke; without correction the gradient and MVA are significantly wrong [Source 1, p. 90; Source 1, p. 149]. With good technique PCWP tracks LA closely (r = 0.97) [Source 1, p. 150].
- **Gorlin (mitral)**: MVA = [CO (mL/min) / (DFP (s/beat) × HR)] / (37.7 × √mean gradient), where 37.7 = 44.3 × 0.85; DFP runs from the PCWP/LV crossover to the R-wave peak [Source 1, p. 149].
- Severity: MVA below 1 cm2 severe, 1–1.5 moderate, 1.5–2 mild; mean gradient above 10 severe, 5–10 moderate, below 5 mild [Source 1, p. 147].
- Heart rate and AF: faster rates shorten diastole and raise the gradient for the same valve (example: 22 mmHg on a short R-R interval) [Source 4, p. 9–10]; tachycardia raises LA pressure [Source 1, p. 146]. Gradient also scales with flow (exercise, anemia, MR) [Source 1, p. 147]. Model assumption: HR × DFP ≈ 32 [Source 1, p. 142].
- Coexisting MR raises transmitral flow; using forward CO then overstates MS severity [Source 1, p. 150].
- Example hemodynamic stages (schematic): tight MS without pulmonary vascular disease RA 5, RV 45/5, PA 45/25 (32), LA 25, LV 120/5, flow 5 L/min; with pulmonary vascular disease RA 20, RV 130/20, PA 130/80 (100), LA 30, flow 3 L/min [Source 1, p. 142].

### Pulmonic and tricuspid stenosis (brief)
- PS is graded by peak-to-peak RV-PA gradient at cath rather than area [Source 1, p. 185]. Echo: mild below 36, moderate 36–64, severe above 64 mmHg peak (below 3, 3–4, above 4 m/s) [Source 1, p. 183; Source 1, p. 188]. Balloon valvuloplasty for peak-to-peak above 40 mmHg, or above 30 with symptoms [Source 1, p. 188].
- TS gradients are small, usually 4–8 mmHg; significant TS usually ≤1.5 cm2; use simultaneous RA and RV catheters if CO is low; blunted y descent and prominent a wave [Source 1, p. 180]. Case: mean RA 13, RVEDP 8, mean gradient 7.3, area 1 cm2 [Source 1, p. 182].

---

## G. Regurgitation

### Mitral regurgitation
- The v wave reflects LA volume inflow, LA compliance and size; it coincides with the T wave and the LV downstroke [Source 1, p. 170; Source 1, p. 89].
- Grading proposal (not widely validated): v wave more than 2 × mean PCWP suggests severe MR; more than 3 × is diagnostic [Source 1, p. 87; Source 1, p. 89].
- A prominent v wave is neither sensitive nor specific: absent when a large, compliant LA absorbs the volume (chronic MR), present with a stiff LA or normal-compliance LA plus large flow (acute MR), and also seen with LV failure or, occasionally, MS with a stiff LA [Source 1, p. 87; Source 1, p. 170; Source 1, p. 216; Source 4, p. 10].
- Acute MR: abrupt LA pressure rise with large v waves, "camelback" PA trace (reflected v wave), rapid y descent, pseudoconstriction, normal-size hyperdynamic LV [Source 1, p. 167; Source 1, p. 172–174].
- Chronic compensated: LA dilates over 6–12 months, small v wave, near-normal right pressures; decompensated: high PCWP, PA and right pressures with falling EF [Source 1, p. 168; Source 1, p. 174].
- A large v wave inflates mean PCWP above LVEDP (about 30%); the trough before the next upstroke better estimates LVEDP (the chapter text names the x-descent trough, Table 5.3 the y-descent trough) [Source 1, p. 87; Source 1, p. 89].
- Pure MR: rapid y descent; mixed MS/MR: gradual y [Source 1, p. 170–171]. Pseudo-MS: in severe MR transmitral flow can exceed twice CO and mimic a stenotic gradient [Source 1, p. 174].
- MR volume is labile, depending on orifice size, LA compliance, systolic LV-LA gradient, systolic duration and afterload [Source 1, p. 168; Source 1, p. 173].
- Doppler: LA pressure = systolic BP − 4 × (MR velocity)² [Source 2, p. 23; Source 3, p. 5].

### Aortic regurgitation
- Chronic: wide pulse pressure (diastolic usually below half of systolic), low aortic diastolic, exaggerated peripheral amplification, sometimes a bisferiens contour or absent dicrotic notch; big LV can keep diastolic pressures normal until decompensation [Source 1, p. 156–157].
- Severe: LVEDP approaches or equals aortic diastolic pressure [Source 1, p. 157; Source 4, p. 9]. Rapid rise of LV diastolic pressure [Source 1, p. 61; Source 4, p. 9].
- Acute: no wide pulse pressure; steep LV diastolic rise, LV-Ao diastolic equalization, **premature mitral closure** when LV diastolic pressure overtakes LA pressure, high LVEDP, coronary ischemia from low perfusion pressure [Source 1, p. 155; Source 1, p. 159–160]. Example: BP 90/30 with aortic-LV diastolic equalization [Source 1, p. 161].
- Counter-example: pulse pressure 60, aortic diastolic 62 with dicrotic notch and LVEDP 15 was only 2+ AR [Source 1, p. 163].
- Doppler: LVEDP = diastolic BP − 4 × (AR end-diastolic velocity)²; example BP 110/64 with 2.6 m/s gives LVEDP 36 [Source 2, p. 22; Source 3, p. 12].

### Tricuspid regurgitation
- Large systolic "CV" or "S" wave replacing c and v; severe TR makes the RA trace resemble the RV trace (**ventricularization**), because RA and RV behave as one chamber [Source 1, p. 177–178; Source 1, p. 368].
- Ventricularization is specific but insensitive: 40% and 31% of severe TR in two series; Pitts: prominent RA v wave = above 15 mmHg, v minus mean above 5 mmHg, or v/mean above 1.5 [Source 1, p. 84–85].
- Severe TR with RV/PA systolic below 40 mmHg favors organic valve disease; very high RVSP favors functional TR [Source 1, p. 178–179].
- TR can raise RA mean above PCWP [Source 1, p. 217]. Early RV-RA equalization truncates the late TR jet (severe TR, ASD, poor RV) [Source 2, p. 13].

---

## H. Hypertrophic obstructive cardiomyopathy

- Dynamic LVOT obstruction varies with preload, afterload and contractility; gradients may exceed 100 mmHg [Source 1, p. 200].
- LV-Ao gradient: end-hole catheter at the LV apex against aorta, or slow LV pullback [Source 1, p. 202]. Echo classes: resting obstruction ≥30 mmHg (2.7 m/s), provocable, non-obstructive; invasive septal reduction considered for refractory class III–IV symptoms with gradient above 50 mmHg [Source 1, p. 208].
- **Spike-and-dome (bisferiens)** aortic pulse: rapid rise, small dip, second peak; enhanced by provocation; also possible in severe AR [Source 1, p. 202; Source 1, p. 200; Source 1, p. 74].
- **Brockenbrough-Braunwald-Morrow sign** (1961): in the first sinus beat after a PVC the LV-Ao gradient increases while aortic pulse pressure falls (fails to widen) [Source 1, p. 200; Source 1, p. 206; Source 1, p. 368]. Example: minimal resting gradient, above 100 mmHg post-PVC [Source 1, p. 368]. Not fully specific; reported in some AS [Source 1, p. 206].
- Provocation: Valsalva, nitroglycerin or amyl nitrite (reduce preload/afterload), post-PVC potentiation or isoproterenol (increase contractility); avoid dobutamine (can create gradients in normal hearts) [Source 1, p. 200; Source 1, p. 202; Source 1, p. 206]. Volume loading reduces obstruction [Source 1, p. 206].
- Diastolic dysfunction: elevated LVEDP, prominent LV a wave, prolonged rapid filling; PCWP often high with accentuated a and larger v (MR from SAM or stiff LA) [Source 1, p. 200–202]. Series values: LVEDP 16 ± 6 vs 11 ± 3 mmHg; PCWP 13 ± 5 vs 7 ± 3 [Source 1, p. 202].
- Echo-derived example: BP 131/56, LVOT gradient 65 gives LV systolic 196; MR velocity then implies LA pressure 45 mmHg [Source 3, p. 36].
- Versus fixed AS: AS gradient falls with preload reduction and pulse pressure rises after a PVC; AS has a parvus-tardus rather than spike-and-dome aortic trace; an LV pullback localizes subvalvular vs valvular obstruction [Source 1, p. 122; Source 1, p. 207; Source 1, p. 368].

---

## I. Pericardial and myocardial restriction

### Constrictive pericarditis
- Hallmarks: elevated and equalized RA, LA, RV and LV diastolic pressures; RVEDP and LVEDP within 5 mmHg [Source 1, p. 234]. Mayo series (high-fidelity): LVEDP − RVEDP 4 ± 4 mmHg; RVEDP/RVSP 0.57 ± 0.14 [Source 1, p. 239–240].
- Dip-and-plateau (square-root sign) from abrupt halt of early filling; prominent y (and x) descents; M or W RA contour [Source 1, p. 234–235; Source 4, p. 3; Source 4, p. 21].
- PA/RV systolic usually below 50 mmHg; RVEDP/RVSP above 1/3 [Source 1, p. 235–236; Source 1, p. 242].
- Kussmaul sign (no inspiratory fall or a rise in RA pressure) present in only 21% of surgically proven cases; also in RV failure, RV infarct, TS [Source 1, p. 241]. Source 4 lists it as nonspecific [Source 4, p. 5].
- Dissociation of intrathoracic and intracardiac pressure plus ventricular interdependence: on inspiration RV systolic rises while LV systolic falls (**discordance**); record RV and LV together on a 200 mmHg scale at slow sweep across several breaths [Source 1, p. 235; Source 1, p. 239]. Discordance was 100% sensitive and 100% specific in the Mayo series [Source 1, p. 241]; Source 4's table gives 100% sensitivity and 95% specificity [Source 4, p. 19; Source 4, p. 25].
- PA diastolic (occasionally PCWP) can drop below LVEDP in inspiration [Source 1, p. 240].
- Hypovolemia masks constriction; give fluid before excluding it [Source 1, p. 235; Source 1, p. 239].
- Pulsus paradoxus is usually minimal or absent in rigid constriction [Source 1, p. 235].
- Conventional criteria in Source 4 (LVEDP − RVEDP ≤5, RVEDP/RVSP above 1/3, PASP below 55, LV rapid filling wave ≥7 mmHg, RA respiratory change below 3 mmHg) are sensitive but poorly specific; PCWP/LV respiratory gradient ≥5 mmHg is 93% sensitive and 81% specific [Source 4, p. 19; Source 4, p. 21]. Source 1 gives specificity 71% for LVEDP − RVEDP ≤5 where Source 4 gives 38% [Source 1, p. 241; Source 4, p. 19]; the PASP cut-off is 50 in Source 1 and 55 in Source 4.
- The systolic area index (above 1.1) is not mentioned in any source.

### Restrictive cardiomyopathy
- Diastolic pressures high and similar early, but LVEDP usually exceeds RVEDP by more than 5 mmHg (accentuated by exercise); RV/PA systolic may exceed 50; RVEDP/RVSP below 1/3; **concordant** inspiratory fall in RV and LV systolic pressures [Source 1, p. 224–225; Source 1, p. 242].
- Also: exaggerated y descent, M/W RA contour, dip-and-plateau [Source 1, p. 225].
- Predictive accuracy: LVEDP − RVEDP above 5 mmHg 85%, RVSP above 50 mmHg 70%, RVEDP/RVSP below 0.33 76%; if all three agree, above 90% correct; one quarter unclassifiable [Source 1, p. 225–227].
- Pulsus paradoxus: absent per the RCM chapter [Source 1, p. 225], but RCM is listed among causes of pulsus paradoxus in the tamponade chapter [Source 1, p. 253]. Kussmaul: absent in the textbook table [Source 1, p. 242], possible per Source 4 [Source 4, p. 3].
- Saline challenge (500 mL) raised RA, RVEDP and LVEDP and exposed RVEDP-LVEDP separation in sarcoid RCM [Source 1, p. 228].

### Cardiac tamponade
- Rising pericardial pressure impairs filling throughout the cycle; phase 1 affects the right heart, phase 2 raises PCWP with equalized EDPs within 5 mmHg, phase 3 lowers CO [Source 1, p. 247–249].
- RA: elevated with preserved or exaggerated x descent and blunted or absent y descent; no dip-and-plateau in RV (exception: RV hypertrophy) [Source 1, p. 249–250; Source 4, p. 23].
- **Pulsus paradoxus**: inspiratory systolic fall above 12 mmHg, ≥10 mmHg, or ≥9% (definitions vary); may be absent with acute AR, high LVEDP, ASD, pulmonary hypertension or RVH [Source 1, p. 74; Source 1, p. 252]. It reflects inspiratory RV filling that compromises LV filling [Source 1, p. 250–252].
- Respiratory variation in atrial pressure is preserved (intrathoracic pressure reaches the pericardial fluid) [Source 1, p. 252; Source 1, p. 243]. Inspiration lowers PCWP but not intracardiac pressure, so the left filling gradient falls [Source 4, p. 23].
- Low stroke volume; CO falls without tachycardia; narrow pulse pressure [Source 1, p. 252–253].
- After pericardiocentesis the y descent and early RV filling return; pericardial pressure falls toward 0 [Source 1, p. 250–251; Source 1, p. 256]. Case: BP 92/68, HR 112, pulsus 15–18 mmHg, 600 mL drained [Source 1, p. 256].
- Hypovolemia or severe LV dysfunction can mask tamponade [Source 1, p. 253].

### Effusive-constrictive pericarditis
- RA pressure stays high after pericardial pressure is brought to near zero; tamponade physiology converts to constriction (y descent returns, square-root sign) [Source 1, p. 260–261]. Example: RA 17 to 14, RVEDP 16 to 16, PCWP 17 to 14, pericardial 13 to 0 mmHg [Source 1, p. 263]. Ntsekhe criteria: pericardial pressure above 8 before, RA ≥11 or failing to fall by 50% after [Source 1, p. 261].

---

## J. Pulmonary hypertension

- Definition in these sources: mean PAP **≥25 mmHg** [Source 1, p. 322; Source 1, p. 324] (written as >25 elsewhere [Source 1, p. 216; Source 1, p. 331]). Mean PAP 21–24 is described as probably abnormal but not labeled [Source 1, p. 324]. The newer 20 mmHg threshold is not used by any source.
- PAH (pre-capillary): mean PAP ≥25, PCWP ≤15, PVR above 3 WU (5th World Symposium, 2013) [Source 1, p. 325–326]. A 2 WU threshold appears only as an echo cut-off (TRV/RVOT VTI ratio above 0.175–0.2) [Source 2, p. 18].
- Post-capillary (WHO group 2, left heart disease) is the most common form [Source 1, p. 216–217; Source 1, p. 322]. Pulmonary vascular remodeling on top of venous hypertension is suggested by TPG above 15 mmHg or PVR above 3 WU [Source 1, p. 219]. "Isolated" vs "combined" post-capillary categories and DPG are not defined in these sources.
- PVR = TPG / CO; 1 WU = 80 dyn·s·cm-5; PVR has fixed (remodeling) and dynamic (vasoconstriction) parts [Source 1, p. 326].
- RA and RV tracings: prominent RA a waves (stiff RV), prominent v waves with TR, ventricularized RA in severe RV failure [Source 1, p. 324–325]. End stage: RA above 20 mmHg with CI below 2.0 while PA pressure paradoxically falls [Source 1, p. 324].
- Example PAH: PA systolic 80, mean 48–50 [Source 1, p. 325]. Eisenmenger: PA 120 systolic, mean 82, RV equal to LV [Source 1, p. 327–328].
- **Vasoreactivity** (idiopathic, heritable, anorexigen PAH): inhaled NO (or IV adenosine or epoprostenol); positive if mean PAP falls ≥10 mmHg to below 40 mmHg with no fall in CO [Source 1, p. 326–327].
- Transplant evaluation: test reversibility (nitroprusside preferred) when PASP above 50, TPG above 15 or PVR above 3 WU [Source 1, p. 328–329]; PVR above 5 WU is an absolute contraindication [Source 1, p. 219]; PVR below 3 WU predicts better survival [Source 1, p. 42]. Example: PCWP 24, PA 65/34 (44), CO 2.9, PVR 7.0 fell to PCWP 8, PA 32/10 (17), CO 4.4, PVR 2.0 on nitroprusside [Source 1, p. 329].
- Exercise: pulmonary pressures and valve gradients scale with CO; exercise can unmask MS [Source 1, p. 355; Source 1, p. 148]. Fluid challenge is described for constriction and restriction, not as a PH protocol [Source 1, p. 235; Source 1, p. 228]. Exercise-PH criteria are not given.
- Echo PASP = 4v² (TR) + RAP [Source 1, p. 331; Source 2, p. 11]; subtract a PS gradient if present [Source 2, p. 12].

---

## K. RV infarction, RV failure and acute LV failure

### RV infarction
- Classic triad: hypotension, clear lungs, raised JVP with inferior MI [Source 1, p. 314].
- RA: elevated, **blunted y descent**, Kussmaul sign; intact RA gives a W pattern (tall a, steep x, blunted y); combined RA and RV ischemia gives an M pattern (small a, blunted x and y) [Source 1, p. 316–318].
- RV: elevated and rapidly rising diastolic pressure, slow upstroke, low broad peak, delayed relaxation; abrupt dilation can give dip-and-plateau and equalized RV/LV diastolic pressures (pseudoconstriction) but with blunted, not steep, y [Source 1, p. 314–319; Source 1, p. 236].
- PA systolic and pulse pressure low; systemic hypotension with narrow pulse pressure; pulsus paradoxus possible [Source 1, p. 319].
- Diagnostic criteria: mean RA ≥10 mmHg with RA/PCWP ≥0.8; RA above 10 and within 1–5 mmHg of PCWP (sensitivity 73%, specificity 100%); y deeper than x (54.5%/97.4%); RA > PCWP (45%/100%); PA pulse pressure/RA 1.1 ± 0.6 vs 4.3–5.5 in controls [Source 1, p. 320; Source 1, p. 366].
- Volume loading may unmask the pattern; beyond PCWP about 15 mmHg more fluid rarely helps; dobutamine raised CI about 35% [Source 1, p. 320].

### RV failure (general)
- Suspect RV failure when RV systolic pressure is low despite RA above 15 mmHg and depressed CI [Source 1, p. 217]. Low RVSWI (below 5 g·m2/beat) predicts adverse outcome [Source 1, p. 219].

### Acute LV failure and low-output states
- PCWP often has a prominent v wave (stiff LA/LV or functional MR), and the mean then overstates preload [Source 1, p. 216–217]. A sudden rise to 17–20 mmHg can cause pulmonary edema in acute injury, whereas chronic HF patients may need 17–20 mmHg [Source 1, p. 216].
- Cardiogenic shock: CI below 2.2 L/min/m2 in new acute HF [Source 1, p. 218]. SvO2 often below 60%, as low as 30% [Source 1, p. 218].
- Case (anterior MI shock): CVP 15, PA 45/30, PCWP 26, CO 3.0, CI 1.7, HR 120, BP 86/40 (MAP 55), SVR 1067 [Source 1, p. 46–47]. LVEDP 32 with LV systolic 95 signals severely depressed contractility [Source 1, p. 367].
- Low CO with high LVEDP is ominous; low CO with low LVEDP suggests hypovolemia [Source 1, p. 355]. Septic vs cardiogenic shock: high CO/low SVR vs low CO/high SVR [Source 1, p. 18].
- Pulsus alternans signals a failing LV [Source 1, p. 219–220; Source 1, p. 74].

---

## L. Cardiac cycle timing (ECG vs mechanical events)

| Interval | Value | Citation |
|---|---|---|
| P onset to RA contraction | about 60–80 ms | [Source 1, p. 53; p. 81] |
| P onset to LA contraction | about 85 ms | [Source 1, p. 53] |
| P onset to PCWP a wave | about 200 ms, variable, may exceed 200 ms | [Source 1, p. 53; p. 81] |
| QRS to ventricular contraction | 15–30 ms | [Source 4, p. 3] |
| Q onset to LV contraction | about 52 ms | [Source 1, p. 53] |
| Q onset to RV contraction | about 65 ms | [Source 1, p. 53] |
| Q onset to RV ejection (pulmonic opening) | about 80 ms | [Source 1, p. 53] |
| Q onset to LV ejection (aortic opening) | about 115 ms | [Source 1, p. 53] |
| LA-to-wedge transmission | 140–200 ms vs 40–120 ms (sources differ) | [Source 1, p. 86; p. 149] |
| PA upstroke to PCWP v onset | about 110 ms | [Source 1, p. 87] |
| A2 to opening snap | above 100–110 ms mild MS; below 60–70 ms severe MS | [Source 1, p. 151] |

- **P wave to a wave**: each P wave triggers atrial systole, the a wave, followed by the x descent [Source 4, p. 2; Source 1, p. 52].
- **QRS to mitral closure (S1)**: ventricular pressure rises with the R wave; LVEDP and mitral closure sit at the R-wave point; then isovolumic contraction until LV exceeds aortic pressure and the aortic valve opens [Source 1, p. 59–60; Source 4, p. 2–3; Source 1, p. 32–33]. The AS murmur starts after S1 and ends before S2 [Source 1, p. 117].
- **T wave to aortic closure (S2)**: ejection continues until repolarization (T wave); LV relaxation then drops pressure below aortic pressure, the aortic valve closes and the dicrotic notch appears (A2 is the aortic component of S2) [Source 4, p. 3; Source 1, p. 73; Source 1, p. 117]. Pulmonic closure follows aortic closure [Source 1, p. 49].
- Isovolumic relaxation ends when LV falls below LA pressure and the mitral valve opens (y descent begins) [Source 4, p. 3; Source 1, p. 58].
- Systole shortens less than diastole at higher heart rates; MAP formulas assume diastole is twice systole at 60 bpm [Source 1, p. 18; Source 1, p. 33].
- None of the sources gives explicit millisecond values for S1 or S2 relative to the ECG.

---

## Topics not covered by the four sources (treat as textbook-independent assumptions)

Catheter whip; hybrid PA/PCWP tracings; fluoroscopic wedge confirmation; the 1.34 O2 constant; DPG definition and cut-offs; mean PAP >20 mmHg and PVR >2 WU (2022 ESC/ERS) thresholds; isolated vs combined post-capillary PH; exercise-PH and fluid-challenge PH protocols; thermodilution error in intracardiac shunts; systolic area index in constriction; normal numeric a/v wave amplitudes and SVC/IVC saturations; typical pressure sets for ASD, VSD and PDA; explicit ECG timing of heart sounds.
