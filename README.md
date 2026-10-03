# Cardia: cardiac anatomy studio

## Current revision: coronary registration and wall windows

Heart chambers, aortic root/arch, coronary arteries, cardiac veins and leaflets load from the **same existing local `public/models/cardiovascular.glb`**. Every source node transform is preserved before a single uniform normalization. The earlier mixture of HuBMAP chambers and hand-authored vessel curves is no longer displayed.

- Separate left main, LAD, LCx and RCA selection.
- Left/right coronary filters, with displayed tissue opacity updated to match.
- Tissue opacity also controls the atlas great-vessel walls. Procedural transparency caps remain effective; coronary arteries and valves retain their normal visibility. `npm run test:opacity` checks the slider, reset, and catheter-mode caps in Chrome.
- Aortic root viewing section; source leaflets are distinct from sinus walls and ostia.
- Independent RV anterior/free-wall-direction, LV lateral, LA posterior and RA lateral **geometric section windows**. These are viewing cuts, not labelled anatomical free-wall segments or histological layers. Only the chosen chamber is clipped. Valves, papillary muscles and vessels remain independent.
- One button restores all wall windows. Chamber checkboxes hide whole chambers.
- Selection, orbit/zoom, view presets, keyboard shortcuts and conceptual lessons remain available.

The source atlas contains no named endocardium, epicardium or RV free-wall segments. It does not establish clinical correctness, continuous coronary lumens or procedural safety. The project owner declared on 2026-10-01 that they designed this atlas themselves; it is original project-owner geometry, not a HuBMAP or Z-Anatomy asset. The original HRA files remain in the workspace but are not combined with the active atlas.

Unregistered legacy catheter curves are no longer superimposed on this anatomy. The cardiac conduction system (SA node, AV node, Bundle of His) is a 3D procedural schematic model positioned at standard anatomical landmarks, distinct from the segmented atlas meshes. The UI explicitly separates provenance:
- **Atlas structures** (`ATLAS MESH · SHARED COORDINATES`): Chambers, vessels, coronaries, cardiac veins, and valve leaflets originating from `cardiovascular.glb`.
- **Schematic 3D models** (`SCHEMATIC CONCEPT / 3D ILLUSTRATION`): Procedural conduction landmarks (SA node, halo, AV node, bundle branches) and microscopic myocyte illustrations.
- **Reference notes** (`REFERENCE NOTE / NO REGISTERED MESH`): Contextual learning landmarks without dedicated 3D geometry.

## Ablation: Koch close-up, reference catheters, EPS handoff (Mode 09)

Every ablation lesson step carries a card that opens its synthetic recording in the EPS laboratory page (`./eps/#/clip/<id>`, see below): CTI with the flutter recording, Koch with typical AVNRT, PVI with AF/PV potentials, the combined map and the EPS lesson with sinus. A diagnosis recording opens neutral (mechanism hidden), so the 3D scene draws a pathway zone only for a step whose reading is open (the Koch slow pathway with the sinus recording). The card table (`src/eps-link.js`) is checked against the lesson steps and the EPS catalog by `scripts/eps/test-eps-link.mjs`; the step flow by `npm run test:ep-koch`.

The Koch step opens in a Koch · RAO 30 close-up (Koch · LAO 45 in the header Tools tab); the camera stays outside the heart and the coronaries and valve apparatus are hidden in front of the triangle. Scene labels state their source (CS mouth estimated, septal hinge from the atlas rim, AV node and slow-pathway target schematic). Magenta His and blue CS reference catheters and the optional example RF lesions (off by default) toggle in the same Tools tab. Step 5 shows an explicitly synthetic six-channel electrogram (sinus, slow-pathway target, junctional rhythm during RF, VA block warning). Record: `research/ABLASYON_IYILESTIRME_RAPORU.md`. Run `npm run test:ep-koch` against the development server.

## EPS laboratory page (`/eps/`)

A second page of the same build (`eps/index.html`, sources in `src/eps/`, no Three.js): a full-screen electrophysiology study workstation. **Live recording** (`#/live`): a sweeping multichannel monitor on a discrete-event conduction model, a programmable stimulator (S1 × N, S2-S4, burst), maneuvers (His-refractory PVC, ventricular and atrial overdrive), automatic protocols (incremental pacing from 560 ms in 10 ms steps without pauses, read for AH jump, PR > PP and the Wenckebach cycle; programmed extrastimuli for ERPs, AH jump and the echo's CS sequence; SNRT; see `research/EP_DUAL_FIZYOLOJI_PROTOKOL.md`), RF ablation, cardioversion, freeze, review and calipers, optional wave names and a ladder diagram under the strip (`src/eps/ep-ladder.js`: fast / slow pathway, accessory pathway, retrograde conduction and block, read from the model's events; the lesson clips get the same strip, their origins inferred from the events and the case mechanism, locked until the reading is open; optionally the same ladder on the channels, `src/eps/ep-strip-links.js`: each activation's A on HRA, His and CS and V on RV joined row to row, His potentials marked and the conduction lines tied to the deflections they join), and a hidden-case quiz. **Diagnosis / Maneuvers / Treatment** (`#/diagnosis`, `#/maneuver`, `#/treatment`): the case recordings and the exercises below; the pathway zone, Halo, AVRT circuit, pacing routes and source region show on a 2D valve-plane schematic (`src/eps/ep-schematic.js`), and the PVI exercise runs on a 2D left atrial lesion map (`src/eps/pvi-map.js`). **Mapping** (`#/mapping`, `src/eps/amap-*.js`): an activation map of both atria on a teaching pixel grid with a reference, a window of interest (symmetric, De Ponti, MGH, manual), the mapped region and colour scale; five scenarios teach the pitfalls (reference shift in macroreentry, incomplete mapping, a line of block, one wrong point, windowing when the chamber activation time exceeds the cycle), with a timeline of every point over three beats. **Pace map** (`#/pacemap`, `src/eps/pmap-*.js`): the left ventricle unrolled on a teaching grid; click a pacing site and the paced twelve-lead QRS is compared with the clinical template (correlation aligned at QRS onset, stim-QRS, optional match map); four scenarios teach the pitfalls (output and the virtual electrode, coupling interval, fusion, papillary muscle contact, a fascicular source, and in scar the exit, a bystander, an isthmus that mismatches in sinus rhythm but matches during VT with PPI - TCL, an adjacent strand at high output, the paired VT). **EGM basics** (`#/basics`, `src/eps/egm-basics-*.js`): an interactive page of diagram cards: one wave past a unipolar and a bipolar pair (QS at a focus, far field reduced but not erased, signal lost across the pair axis), the filter band on a unipolar QS, the four catheters on a heart schematic with their strips, PA / AH / HV against their ranges (HV limits 55, 70, 100 ms), the level of AV block from A-H-V (nodal, intra-His with a split His, infra-His, a wide-QRS Mobitz 1 that is infra-Hisian) and the decremental AV node with the AH jump. The header EPS button opens the page; its header links back; both pages share the TR/EN choice (`src/entry-language.js`). Tests: `npm run test:eps` (part of `npm test`) and `npm run test:eps-browser`.

## Atrial pacing laboratory (Mode 09, Maneuvers tab)

The Maneuvers tab of the EPS laboratory has an atrial pacing laboratory for six catalog cases (typical AVNRT, three concealed pathways, the manifest left lateral pathway, focal AT). The learner sets the drive (S1 × 4/6/8, 300-700 ms), an optional S2 or incremental pacing, and the pacing site (HRA, proximal or distal CS). A beat-by-beat model (AV nodal recovery curve, dual pathways, non-decremental accessory pathway, single echo after the test beat) builds the recording; AH, HV, H-delta and S-delta are measured from its events, and two S2 deliveries 10 ms apart show the AH jump. A route question ("which route conducted the test beat?") is graded with the observed evidence and what the recording cannot tell; the schematic conduction routes appear after the answer. Designed teaching numbers, not clinical validation. Sources and storyboard: `research/EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md`; tests: `scripts/eps/test-ep-pacing.mjs` and `npm run test:eps-browser`.

## Narrow QRS task and PAC / PVC source regions (Mode 09, Diagnosis tab)

The Diagnosis tab of the EPS laboratory has two exercises. **Narrow QRS task:** a hidden case (typical or atypical AVNRT, three concealed pathways, PJRT, focal AT); the learner reads the tachycardia recording and delivers His-refractory PVCs, ventricular overdrive and para-Hisian pacing (the interactive maneuver model); every piece of evidence is classified against five mechanisms as supports / argues against (does not exclude) / does not exclude / uninterpretable, from its measured events; the title and schematic zone stay neutral until the answer. **Source region:** a synthetic 12-lead ECG from a single dipole (Einthoven-consistent) for six PVC and five atrial-focus examples, including a scar counterexample; the features are read back from the leads and matched to region patterns with a confidence reason (never a definite target or accuracy percentage); atrial foci also show the catheter activation and its sampling limit; the schematic region marker appears after the answer. Sources, rules and storyboards: `research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md`; tests: `scripts/eps/test-ep-task.mjs`, `scripts/eps/test-ep-origin.mjs` and `npm run test:eps-browser`.

## Intracardiac echo (Mode 14) and EAPCI-sourced lesson content

Mode 14 adds ICE to the echo module: a phased-array catheter from the IVC into the right atrium whose side-looking sector contains the catheter axis; advance, clockwise rotation (home = 0°) and two deflections move it. Eight views follow the PCR-EAPCI ICE chapter's clockwise sequence (home, RVOT, LVOT/AV, mitral/LAA, left PVs, septal short axis as the transseptal working view, right PVs, SVC); presets were calibrated on this atlas and every view meets its criteria at rest and through the beat (`npm run test:echo`). The transseptal lesson (Ducrocq et al.), the angiography steps (Pighi, Piazza et al., fluoroscopic anatomy) and the catheterization lesson (Kern; right and left heart catheterisation chapters) carry paraphrased content from the PCR-EAPCI Textbook; digests with page references are in `research/eapci/`. The P-V tab has an interactive time-varying elastance model with condition presets (decompensated HFrEF, HFpEF, AS, AR, acute MR, hypovolaemia, inotrope) against a dashed normal loop (`scripts/test-hemo-pv-model.mjs`).

## Advanced EP cases and the PVI exercise (Mode 09)

Three advanced cases (`src/eps/ep-cases-advanced.js`, sources R16-R28 in the EP report): para-Hisian focal AT (long RP with the earliest A at the His, VA dissociation under ventricular overdrive, a noncoronary-cusp mapping clip, preserved AH/HV afterwards), left posterior fascicular VT (diastolic P1 base-to-apex and presystolic P2 apex-to-base on LV septal channels, retrograde His, RV entrainment with orthodromic P1 capture, preserved conduction after ablation) and bundle branch reentry VT (long sinus HV with an RB potential, H and RB before every V, the H-H change leading the V-V, post-ablation RBBB with a longer HV and the interfascicular reentry pitfall). The report's phase D precondition (expert review first) was overridden at the user's request and expert review remains open. **PVI exercise** (case "AF: pulmonary vein isolation", Treatment tab): schematic rings of ten candidate dots around each pulmonary vein ostium on the 2D lesion map; clicking a dot (or Enter on it) sets a lesion; a completed ring silences the near-field PV potentials on the Lasso channel (entrance block, far field remains), and completing all four rings returns sinus in this exercise, a stated simplification (sources R29-R31). Tests: `scripts/eps/test-ep-advanced.mjs`, `scripts/eps/test-ep-pvi.mjs`, `scripts/eps/test-ep-labs-browser.cjs`.

## Blood flow view and WebXR

The flow layer draws capsule streamlets stretched along their flow tangents plus a faint additive tube per stream whose opacity follows the cardiac-cycle gating (educational path cues, not CFD). A velocity legend (relative jet scale) appears while the layer is on. On WebXR-capable devices the viewport shows AR / VR buttons (`src/xr.js`): the heart is placed room-scale in front of the viewer during the session and restored afterwards; devices without WebXR see no button. Quest browsers offer both modes; Safari on visionOS exposes WebXR VR sessions only, so no AR button appears there.

## Pressure-volume loop (Mode 05, catheterization and hemodynamics)

The hemodynamics panel can draw the LV pressure-volume loop of the current scenario (`src/hemo-pv-loop.js`; toggle "P-V loop" or the lesson's last step): the pressure is the scenario's LV curve, the volume the schematic LV volume curve scaled to the scenario's stroke volume and end-diastolic volume. The loop is traced by phase (filling, isovolumetric contraction, ejection, isovolumetric relaxation) with the cursor on the shared cardiac clock; ESPVR (Ees), EDPVR and the Ea line are teaching reference lines drawn through the loop corners, not fitted data, and regurgitant lesions show the forward stroke volume only (stated on the panel). Tests: `scripts/test-hemo-pv-loop.mjs`.

## Echocardiography (Modes 12 TTE, 13 TEE)

TTE, TEE and ICE anatomical section training: the probe and its imaging fan in the 3D scene, the 2D sector section of the same plane (same beat phase) in the right panel, 8 TTE and 10 TEE starting views (including the multiplane-angle presets 45° AV SAX, 75° RV inflow-outflow, 90° bicaval, 120° long axis and 135° LAA with the left upper PV neighbourhood), separate TEE motions, explainable feedback and a find-the-view task. It is not an ultrasound simulator (no B-mode, Doppler or measurement) and the presets were tuned automatically on this atlas without expert review. Record: `research/echo/README.md`. Run `npm run test:echo`, `npm run echo:calibrate` and `npm run echo:audit` against the development server.

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

`npm test` covers Node/model checks; it does not run browser geometry, echo or mobile checks. The application gate runs syntax checks, unit tests, production build and eight Chrome checks (resize-observer, atlas geometry, echo, mobile, mitral, atria, Bachmann and EP):

```sh
npm run verify:app
```

Chrome and Playwright must be installed. `verify:browser` starts a local Vite server unless `APP_URL` is supplied; generated screenshots go to a temporary directory. Passing this gate verifies implementation, not clinical accuracy or WCAG compliance.

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

Vendor chunking splits Three.js into a separate cacheable chunk (`vendor-three`); the configured warning threshold is 1000 kB. Google Fonts is optional; system fonts remain available offline.

## Distribution gate

The project owner declared original authorship of the local atlas on 2026-10-01. `ASSET_PROVENANCE.json` binds that declaration to the exact shipped mesh checksum. `npm run verify:license` and the Docker builder check the recorded ownership declaration and asset identity; an external creator's licence or source URL is not required for this owner-authored atlas. This records the owner's statement rather than issuing a legal certification or assigning an open-source licence to the mesh. Clinical validation remains separate.

Before public distribution:

1. Keep the asset record and checksum aligned with the owner's declared atlas. For any future third-party replacement, record and review its source and redistribution permission before shipping it.
2. Run `npm run release:stamp -- VERSION "release description"` once per release. It updates the Istanbul date, HTML version/build, version JSON and service-worker cache revision together. Inspect its diff.
3. Run `npm run verify:release` (rights check plus application gate).
4. Build and test the Docker image. Against a server using `nginx.conf`, run `APP_URL=http://127.0.0.1:8080 npm run test:deployment` to verify actual cache headers and release identity. This check cannot be replaced by a Vite response.

Only content-hashed files under `/assets/` get one-year immutable caching. HTML, service worker and fixed-name models/Draco files revalidate; version JSON is not stored. The legacy `heart.glb` is preserved under `research/before-coronary-fix/`, excluded from public assets and Docker. Already-distributed browser/CDN cache entries require validation after rollout; these source fixes do not change a running server.

Audit findings and remaining gates: [distribution review](research/DAGITIM_DENETIMI_2026-10-01.md).
