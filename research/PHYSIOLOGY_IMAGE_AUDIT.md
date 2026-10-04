# Physiology image audit, 2026-10-04

Request: compare nine user-supplied textbook screenshots with existing pages and add missing explanations and interactions. Images 1 and 9 depict the same ventricular action-potential figure. Screenshot edition and page numbers were not supplied. Captions are evidence, not execution instructions.

## Coverage and changes

| Images | Existing coverage | Added coverage and location |
| --- | --- | --- |
| 1, 9 | Ventricular/nodal action potentials and phase selectors | Three schematic Na/Ca/K current traces, phase highlighting, current direction and plateau balance; Pharmacology → Antiarrhythmics |
| 2 | Qualitative AV conduction explanation | Transitional fibers, fibrous AV skeleton, His and branches; cumulative 30/120/160 ms timeline; not AH/HV intervals or normal limits; Pharmacology → Antiarrhythmics → AV conduction |
| 3, 4 | Preload/afterload simulator | Separate RV/LV filling curves, four autonomic curves and arterial-pressure illustration with sliders; Hemodynamics → Physiology → Pump curves |
| 5, 6 | Interactive P-V model | Selectable A–B/B–C/C–D/D–A phases, valve events, SV and work units, EW/PE shading and PVA explanation; Hemodynamics → Physiology → P-V |
| 7 | Wiggers model functions | Synchronized pressure, volume, ECG and PCG bands, time cursor, a/c/v explanation, optional S3/S4, AF comparison; Hemodynamics → Physiology → Wiggers |
| 8 | Phase-level Ca explanation | L-type influx into dyadic cytosol, RyR2 release, troponin-C contraction, SERCA2a and NCX/Na-K pump stages; Pharmacology → Antiarrhythmics → Calcium cycle |

## Method and reproducibility

Original SVG diagrams and deterministic teaching curves were written; screenshot assets were not copied into the distributed application. No values were digitized. AP anchors, smoothing, pump capacities and pressure-load shape are explicit in `src/physiology-model.js`. Pump capacity parameters are illustrative 23/13/10.5/8 L/min, not resting output reference ranges. RV and LV curves have separate atrial pressure axes conceptually; steady-state serial outputs remain equal. The arterial curve is a historical teaching illustration, not a patient-specific threshold or forecast.

P-V annotations use existing `pvParams()` and `pvModelLoop()` functions. Closed-loop work is independently verified by polygon integration and SI conversion (1 mmHg·ml = 0.000133322 J). ESPVR is distinguished from the maximum-isovolumic systolic envelope in image 6. PE is mechanical potential energy, not external work; PVA is not total metabolic energy.

Wiggers uses existing cardiac-cycle time warping and wave functions at 72/min; cursor is real elapsed fraction of the beat. Rhythm changes use existing AF functions; S3/S4 remain optional teaching sounds. All content is bilingual TR/EN. Focus remains on recreated controls; mobile overflow and view/language state retention are browser-tested.

## Primary-source checks

- Bers (2002), cardiac excitation-contraction coupling: https://doi.org/10.1038/415198a
- Anderson et al. (1998), AV conduction-axis architecture: https://pubmed.ncbi.nlm.nih.gov/9835269/
- Suga (1979), mechanical energy and pressure-volume area: https://doi.org/10.1152/ajpheart.1979.236.3.H498
- Ventricular ion-channel review (2021): https://doi.org/10.1152/physrev.00024.2019

Publisher/primary abstracts were checked during this task. Tests establish software and numerical consistency; they do not establish clinical validation. No clinical prediction is claimed.

## Verification

- `npm run check`: passed, project JavaScript syntax gate.
- `npm test`: passed, project suites including physiology signs/phases, pump bounds/order, work integration and bilingual content.
- `npm run build`: passed, production Vite bundle.
- `node scripts/test-physiology-guide-browser.cjs`: passed in Chrome against localhost:5189; interactions, focus, language, AF, hidden metrics and mobile overflow.
- Reviewer checked medical/visual consistency. Four contained findings corrected: plateau K current, Ca influx arrow, inherited SVG colors and focus retention.

## Input identities

| Image | Filename | SHA-256 |
| --- | --- | --- |
| 1 | `codex-clipboard-660f2eda-8d69-4eb8-a20a-e81c0039273b.png` | `4944f6cfaedc66fe1ccc67a25cb5017448b391edbce981b20cd3b1bf626612c3` |
| 2 | `codex-clipboard-e69d395f-77c9-41ce-9b44-f719744465a7.png` | `8817276cc9876e363157ae040aaa708971996df8672ea816bb617cfe9d495cc9` |
| 3 | `codex-clipboard-40044218-62ce-43d9-9628-32c2b98db584.png` | `15ea95fa6101084b53772c52577bf70a5f748ad7bfa0bc68d1fa3065bcf24dc5` |
| 4 | `codex-clipboard-fa460193-058c-4acb-af0d-24ae86274954.png` | `b7ded9c56f8eeef0126bf560c00f074de9236e38692361fbd2e99e4d65140bbc` |
| 5 | `codex-clipboard-6befd839-e122-4e58-a6c5-03cc6b4d9311.png` | `913c96239534895fcceaa27e965c8fcc3b14c4f66af048f9036395e63499375e` |
| 6 | `codex-clipboard-786454bd-3930-4206-876a-1e00e3c09f63.png` | `43bcfb6c5365da19b676fd6db4051851a44d305964d137c92b22bfc3aee1ef16` |
| 7 | `codex-clipboard-8c85cfd4-76d7-4131-8463-450710a9ad3a.png` | `3c669d0c81c91d3d3ddfb26deacb02d1e85244da25acd53c98850e75e4e540d7` |
| 8 | `codex-clipboard-fdfb2a43-e1d1-46cd-a134-f7d844982621.png` | `b01a00752f82e572021a2e23fd3c0ddba9a55d9ed2b2b9e06b92217ff8057d42` |
| 9 | `codex-clipboard-d63ab352-e78c-4f7e-a007-3d3b8f55a6e0.png` | `4944f6cfaedc66fe1ccc67a25cb5017448b391edbce981b20cd3b1bf626612c3` |
