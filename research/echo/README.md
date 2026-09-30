# Echo module: implementation record

Date: 2026-09-30. Scope: `research/TTE_TEE_ENTEGRASYON_RAPORU.md`, stages 0–3. Teaching geometry on the atlas; no patient data, no expert review.

## What exists

Mode **12 · Ekokardiyografi (TTE/TEE)**, group "Görüntüleme / Imaging". Left: the probe, its imaging fan and the 3D heart. Right panel: the 2D sector section of the same plane, feedback, controls. Four lesson steps: TTE views, TEE views, "find the view" task, limits.

| Module | Responsibility |
|---|---|
| `src/echo-section.js` | Plane cut of the current (beating) triangles; cut points welded by edge, joined into contours, each closed or open; 2D image coordinates (x lateral = screen right, y depth). |
| `src/echo-probe.js` | TTE: window base frame on a schematic ellipsoid chest surface; rotation about the beam first, then tilt and rock on the turned plane, slide along the surface (contact kept). TEE: path with arc-length advance and a parallel-transported face; flexion (ante/retro, left/right) bends a 2 cm distal section into an arc, so the tip moves and stops at the lumen (0.3 units in the oesophagus, 1.2 in the stomach); the multiplane angle turns the image about the beam without moving the tip. |
| `src/echo-anatomy.js` | Sectioned structures (LA split into body and appendage lobe), landmarks, schematic oesophagus-stomach path, heart-surface exit distance. |
| `src/echo-views.js` | 8 TTE views (PLAX, PSAX AV/MV/PM, A4C, A2C, A3C, subcostal 4C) and 8 TEE views (ME 4C, mitral commissural, 2C, LAX, AV SAX, bicaval, LAA; TG mid SAX) with required and avoided structures, landmark presets and the atlas calibration. |
| `src/echo-training.js` | Feedback on the model's starting criteria: structures in the sector (at least 0.25 units of contour), structures that should not be there; apical views: the true apex in the plane (0.15 units), inside the image (depth and sector, separate messages) and the visible LV at least 90 % of the measured length; bicaval: the estimated IVC orifice in the cut and the atrial septum (LA next to RA); mitral views: angle of the annulus chord to the commissural axis (commissural 0–22°, two-chamber at least 25° without the outflow tract, long axis 55–90° with it). |
| `src/echo-renderer.js` | 2D sector: anatomical colour or schematic grey; relative depth ticks, index marker, labels, watermark ("not an ultrasound image"). |
| `src/echo-mode.js`, `src/echo-panel.js` | Mode lifecycle, 3D overlay (probe, fan, oesophagus, TEE shaft), panel, task. |

## Coordinate contract

- Patient (atlas): +x patient left, +y superior, +z anterior. 1 unit is about 34 mm (mitral annulus 0.875 units, about 30 mm; `research/LAA_BACHMANN.md`); this is not a validated physical scale, so depth is shown as a percentage, never in cm.
- Probe / image: origin at the transducer; beam = depth (down on screen); lateral = screen right; normal = beam × lateral.
- TTE: the index marker (green dot on the fan and on the sector) is screen right. A4C and subcostal: patient left on screen right; PSAX: patient left on screen right; PLAX and A3C: aortic side on screen right; A2C: the anterior wall on screen right.
- TEE (ASE/SCA 2013): at 0° the patient's left is on screen right, at 90° the cephalad side, at 180° the mirror of 0°. Shaft rotation + turns the transducer toward the patient's right; flexion + is anteflexion; lateral flexion + is toward the patient's left.
- Orientation is tested with an asymmetric phantom (`scripts/test-echo-section.mjs`: reversing the lateral axis mirrors the image) and on the atlas (`scripts/test-echo.cjs`: A4C left heart on screen right, ME 4C LA nearest the transducer, 0° and 180° mirror each other).

## Stage 0: source and topology audit

`node scripts/echo-audit.cjs` writes `topology-report.json`: the atlas SHA-256 (checked against `src/atlas.js`), each sectioned mesh's boundary loops (open or closed surface) and, per view preset, the closed and open contour counts per structure.

- Licence: the atlas author and licence are unverified (`README.md`). The echo module must not be published or distributed as a product until this is resolved. This work did not resolve it.
- Topology: the chambers and vessels are open surfaces (valve rims, vessel ends), so many cuts give open contours. Open contours are drawn as lines and never filled; a closed contour of a chamber is filled only in the anatomical colour style, as blood pool, never as myocardium. No wall thickness is invented.
- Scale: see the coordinate contract.
- Result (2026-09-30): atlas SHA-256 `05f373a2…09b757` matches `src/atlas.js`; of 31 sectioned meshes, 19 are open surfaces. Every view preset gives both closed and open contours (for example A4C 11 closed / 15 open, ME 4C 19 / 9, TG SAX 7 / 2); open ones are shown as lines.

## Presets and calibration

Presets come from measured landmarks (mitral and tricuspid annulus frames, LV apex, aortic cusp plane, papillary muscle, LA, LAA orifice). `node scripts/echo-calibrate.cjs` then searches a grid around each preset for the smallest probe adjustment whose section meets the view's criteria at rest and at four phases of the beat (the worst phase counts; the AV plane descends in systole). TEE multiplane angles stay within each view's guideline range. The resulting offsets are stored in `src/echo-views.js`. They fit this atlas only and are not an expert review; the report asks for expert calibration and that is still open.

Result: all 16 presets meet their criteria at rest and through the beat on this atlas (`scripts/test-echo.cjs`, `scripts/echo-calibrate.cjs`).

Model decisions recorded here:
- TG mid SAX: the pulmonary artery, LAA, LA, mitral valve and aorta must stay out of the sector; the oblique atlas LV axis otherwise brings the outflow tract into the far field.
- PSAX AV: the atlas LV reaches the aortic annulus, so the plane sits 0.1 units above the cusp centres and a short outflow-tract cut (LV contour up to 1 unit) is allowed.
- TEE path: the atlas has no oesophagus or stomach. The oesophagus runs 0.35 units (about 12 mm) behind the posterior LA wall at the LA centre, vertically; below the mitral level it turns forward and left to a stomach point 0.3 units below the inferior LV wall at 60 % of the mitral-to-apex axis. The transducer face is carried along the bend, so a probe in the stomach faces the heart, as a real scope does.
- TTE windows: where the window line leaves a schematic ellipsoid chest surface around the heart (0.35 units beyond the heart's bounding box; parasternal: anterior; apical: beyond the true apex, aimed at the AV valves; subcostal: inferior, anterior, slightly right). No ribs, intercostal spaces or acoustic windows; the controls do not represent intercostal placement.
- Review of 30 September 2026 (`research/TTE_TEE_IYILESTIRME_RAPORU.md`): the three P1 findings and the code parts of the P2 findings are addressed; counterexample tests in `scripts/test-echo-training.mjs`.

## Checks

| Check | Command |
|---|---|
| Section engine on phantoms (closed/open, welding, mirror, matrix, live positions) | `node scripts/test-echo-section.mjs` |
| Sector renderer (geometry, clipping, both styles, labels, robustness) | `node scripts/test-echo-renderer.mjs` |
| Mode on the atlas: 16 presets, orientation, separate TEE motions, phase-locked section, freeze, task, speed | `npm run test:echo` (running server) |
| Preset calibration | `node scripts/echo-calibrate.cjs` (running server) |
| Stage 0 audit | `node scripts/echo-audit.cjs` (running server) |

The section is computed from the geometry of the current phase (after the heart deforms), so the 2D image and the 3D heart show the same moment; freezing stops the shared heartbeat.

## Not done (stages 4–6 and open items)

- Stage 4 (teaching pilot with pre/post tests), stage 5 (licensed reference clips or volumes, synthetic B-mode, pathology) and stage 6 (M-mode, colour and spectral Doppler, measurements, hardware) are outside code-only work and were not started. Each needs its own data, licence and validation gate.
- No echocardiographer has reviewed the presets, thresholds or orientations.
- Performance was measured on one development machine only (section time per frame in `test:echo`); the report's 30 fps / 100 ms p95 target has not been measured on a fixed test device.
