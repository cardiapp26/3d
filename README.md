# Cardia: cardiac anatomy studio

## Current revision: coronary registration and wall windows

Heart chambers, aortic root/arch, coronary arteries, cardiac veins and leaflets load from the **same existing local `public/models/cardiovascular.glb`**. Every source node transform is preserved before a single uniform normalization. The earlier mixture of HuBMAP chambers and hand-authored vessel curves is no longer displayed.

- Separate left main, LAD, LCx and RCA selection.
- Left/right coronary filters, with displayed tissue opacity updated to match.
- Aortic root viewing section; source leaflets are distinct from sinus walls and ostia.
- Independent RV anterior/free-wall-direction, LV lateral, LA posterior and RA lateral **geometric section windows**. These are viewing cuts, not labelled anatomical free-wall segments or histological layers. Only the chosen chamber is clipped. Valves, papillary muscles and vessels remain independent.
- One button restores all wall windows. Chamber checkboxes hide whole chambers.
- Selection, orbit/zoom, view presets, keyboard shortcuts and conceptual lessons remain available.

The source atlas contains no named endocardium, epicardium or RV free-wall segments. It does not establish clinical correctness, continuous coronary lumens or procedural safety. Its upstream author/license is not verified from available project records; do not describe it as HuBMAP or Z-Anatomy. The original HRA files remain in the workspace but are not combined with the active atlas.

Unregistered legacy catheter curves are no longer superimposed on this anatomy. The cardiac conduction system (SA node, AV node, Bundle of His) is a 3D procedural schematic model positioned at standard anatomical landmarks, distinct from the segmented atlas meshes. The UI explicitly separates provenance:
- **Atlas structures** (`ATLAS MESH · SHARED COORDINATES`): Chambers, vessels, coronaries, cardiac veins, and valve leaflets originating from `cardiovascular.glb`.
- **Schematic 3D models** (`SCHEMATIC CONCEPT / 3D ILLUSTRATION`): Procedural conduction landmarks (SA node, halo, AV node, bundle branches) and microscopic myocyte illustrations.
- **Reference notes** (`REFERENCE NOTE / NO REGISTERED MESH`): Contextual learning landmarks without dedicated 3D geometry.

## Interactive Features & Ergonomics

- **Bachmann bundle (06)**: Independently selectable, atlas-anchored schematic atrial roof band under the conduction layer, with its own visibility toggle. A separate bilingual lesson compares RAA pacing with a right-sided Bachmann-area lead in AP and LAO 40° views. The progress slider advances the lead. The endocardial teaching target is offset inward from the band anchor; this is not measured wall thickness or segmented conduction tissue. Fluoroscopy does not establish electrical capture. Run `npm run test:bachmann` for the dedicated browser checks.

- **Catheterization and hemodynamics (07)**: One module for right-heart (Swan-Ganz) and left-heart catheterization and interactive hemodynamics. The 3D catheter route and measurement stations drive the tracing panel: lesson steps advance the catheters to the stations in view, picking a 3D station adds its channel, and toggling channels in the panel advances or withdraws the catheters. The former `#/mode/hemodynamics` link opens this mode. Right and left heart pressure tracings (RA, RV, PA, PCWP, LV, aorta) synthesized on the shared cardiac clock, so they stay in step with the ECG strip, the Wiggers diagram and the 3D valve motion. Fifteen scenarios (normal, aortic and mitral stenosis, mitral and aortic regurgitation, HOCM, constriction, restriction, tamponade, pre- and post-capillary pulmonary hypertension, RV infarction, ASD, VSD, acute LV failure) set per-station targets, saturations, output and waveform signs (giant v wave, square-root sign, spike-and-dome, Brockenbrough after a triggered PVC, pulsus paradoxus and Kussmaul with respiration on, ventricular interdependence). Overlaid channels shade the LV-aortic or LV-wedge gradient; Gorlin and Hakki areas, Fick output, SVR/PVR, TPG/DPG, mixed venous saturation, oximetry step-up and Qp/Qs are computed from the same curves and are editable in the calculators. Scenario values are textbook figures interpolated inside the ranges and worked examples cited in `research/HEMODYNAMICS_REFERENCE.md` (page-referenced) and `research/hemodynamics-scenarios.json`; they are teaching caricatures, not patient recordings, and no diagnostic use is intended. Run `node scripts/test-hemodynamics.mjs` for the model checks.

- **Physical examination (08)**: Auscultation findings (HOCM with dynamic LVOT obstruction, aortic stenosis, mitral regurgitation, VSD, MVP, aortic regurgitation, mitral stenosis, tricuspid regurgitation, pulmonic stenosis, innocent murmur) and bedside maneuvers (respiration, Valsalva strain and release, squat and stand, passive leg raise, handgrip, transient arterial occlusion, amyl nitrite, post-PVC beat, phenylephrine, left lateral decubitus, brief exercise). Each maneuver perturbs preload, right-heart return, afterload, contractility, heart rate and apex proximity; each finding responds through declared sensitivities, and the model is tested against the textbook response table and the Lembo 1988 (NEJM) accuracies. A phonocardiogram on the shared cardiac clock, an optional synthesized schematic sound, an LVOT gradient gauge and five schematic 3D auscultation areas complete the mode. Data driven so it can grow: see `research/PHYSICAL_EXAM.md`. Run `node scripts/test-exam.mjs`.

- **C-Arm Angiography Gantry**: 2D trackpad joystick, standard projections (Spider, RAO/LAO Cranial/Caudal), and grayscale fluoroscopy shading. Fluoroscopy uses a light detector background, translucent anatomy, dark procedural devices and dark coronary contrast in angiography mode. This is an educational mesh projection, without radiographic tissue-density simulation. Original materials remain intact when leaving the mode. Starts collapsed (`+`) in anatomy mode and opens automatically in angiography mode.
- **Unified Reset**: Keyboard shortcut `0` and the `#reset` button execute the exact same state restoration (camera, opacity, all wall cut windows, layer toggles, coronary filters, and fluoroscopy).
- **Bilingual Interface**: Seamless Turkish / English (`TR` / `EN`) switcher preserving active selection and lesson context.
- **On-Demand Rendering**: Dirty-flag rendering loop idles when camera and animations are static, significantly lowering GPU/CPU consumption.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Port 5173 is preferred; Vite chooses the next available port if occupied.

## Verify

```sh
npm run check
npm test
npm run build
```

Browser integration tests require Playwright and installed Chrome:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright APP_URL=http://127.0.0.1:5174 npm run test:browser
```

The script defaults to this workstation's bundled Playwright. It verifies source-to-browser geometry registration, chamber-specific clipping, coronary filtering, selection, modes, root section, conduction toggle and SA halo hiding, reset equality, and mobile overflow. Screenshots are written to `research/screenshots` after camera transitions settle.

Geometry tests use the actual Draco mesh, its checksum, node transforms, boundary loops and relative distances. Passing tests detects implementation regressions; it is **not clinical anatomical validation**. See `research/CORONARY_FIX.md` and `research/coronary-geometry-report.json`.

Vendor chunking splits Three.js into a separate cacheable chunk (`vendor-three`), keeping all bundles well under the 500 kB threshold. Google Fonts is optional; system fonts remain available offline.
