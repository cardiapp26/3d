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

## Ablation: Koch close-up, reference catheters, synthetic EGM (Mode 09)

The Koch step opens in a Koch · RAO 30 close-up (Koch · LAO 45 in the header Tools tab); the camera stays outside the heart and the coronaries and valve apparatus are hidden in front of the triangle. Scene labels state their source (CS mouth estimated, septal hinge from the atlas rim, AV node and slow-pathway target schematic). Magenta His and blue CS reference catheters and the optional example RF lesions (off by default) toggle in the same Tools tab. Step 5 shows an explicitly synthetic six-channel electrogram (sinus, slow-pathway target, junctional rhythm during RF, VA block warning). Record: `research/ABLASYON_IYILESTIRME_RAPORU.md`. Run `npm run test:ep-koch` against the development server.

## Echocardiography (Modes 12 TTE, 13 TEE)

TTE and TEE anatomical section training: the probe and its imaging fan in the 3D scene, the 2D sector section of the same plane (same beat phase) in the right panel, 8 TTE and 8 TEE starting views, separate TEE motions, explainable feedback and a find-the-view task. It is not an ultrasound simulator (no B-mode, Doppler or measurement) and the presets were tuned automatically on this atlas without expert review. Record: `research/echo/README.md`. Run `npm run test:echo`, `npm run echo:calibrate` and `npm run echo:audit` against the development server.

## Atrial inspection (Modes 02 & 03)

Mode **02 Sol atriyum & LAA / Left atrium & LAA** shows only the left atrium and the LAA orifice marker (the schematic gold ring indicating the transition from the LA body to the left atrial appendage). Focus buttons and the filtered structure selector inspect LA and LAA. The LA wall cut slider exposes the internal cavity and ridge anatomy.

Mode **03 Sağ atriyum / Right atrium** provides an isolated view of the right atrium alone. It includes its own RA focus button and wall section slider to inspect internal pectinate muscles and caval inflows without interference from other chambers.

Both modes isolate their respective anatomy, keep surrounding structures and flow hidden, and automatically restore original layer preferences when navigating back to other modes. Deep links: `#/mode/atria?structure=laa` and `#/mode/ra?structure=ra`.

Run `APP_URL=http://127.0.0.1:5177 npm run test:atria` against the development server.

LA surface shading shares normals at coincident vertices without changing atlas positions or openings. The LAA marker follows a closed intersection of the LA surface with the estimated neck plane when available; otherwise it retains the circular estimate. The thinner contour moves with LA contraction. LA focus fits the full chamber to the viewport; LAA focus uses an oblique view and translucent surrounding tissue to expose the neck. These changes improve inspection, not anatomical segmentation or source mesh resolution.

## Mitral scallop view

Use **Mitral** in the camera controls, or select a mitral structure in anatomy mode, to open an isolated atrial view. A1–A3 anterior segments and P1–P3 posterior scallops have paired colors and labels that follow leaflet animation. Leaflet visibility controls remain active. Another camera preset, selecting another structure, or reset restores the surrounding anatomy.

These are approximate teaching regions along the measured commissural axis, not atlas-segmented fissures or patient-specific scallop boundaries. Number 1 is lateral, number 3 medial. Anterior regions are segments, not natural scallops. Anatomical nomenclature: [Echocardiography of the mitral valve](https://pmc.ncbi.nlm.nih.gov/articles/PMC3727372/). Run `APP_URL=http://127.0.0.1:5177 npm run test:mitral` against a running development server.

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
