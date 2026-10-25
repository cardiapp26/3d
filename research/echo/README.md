# Echo module: implementation record

## ICE topic references (2026-10-25)

Two CC BY 2.0 clinical recordings are available independently under the septal
working view (`ice-septal-sax`): Citro et al. 2004, supplementary movie 1,
10.1186/1476-7120-2-20 (after fossa ovalis puncture); and Shalganov et al. 2005,
additional file 2, 10.1186/1476-7120-3-5 (distorted septal anatomy). Both use
360° mechanical/radial ICE and are explicitly labeled as topic references,
not one-to-one matches to the phased-array simulator plane. The latter case is
labeled pathological and says that the authors abandoned the LA procedure.

The reference selector is optional, with no required order. Switching recordings
does not move the catheter. Choice survives TR/EN and view changes. A local file
overrides the choice; removing it restores the selected bundled recording.
Other ICE presets keep their local-file option without inheriting septal media.
This does not constitute clinical validation of the existing geometric presets.

One otherwise relevant supplementary file was excluded because its description
identifies it as TEE. A further candidate was excluded because its modality could
not be confirmed from the displayed recording. Neither is shipped as ICE.

Header name/ID/date fields were masked before lossless WebM/VP9 conversion.
The originals are kept outside the repository for temporary verification only.
All 279 decoded frames match the expected header-masked source frames. The
ultrasound field was retained without cropping or resizing. Sources, authors,
licenses, original hashes and exact filters are in `ice-media-sources.json` and
`ice-media-verification.json`. Reproduce from the public source URL, verify its
SHA-256, apply the recorded filter with `-vf`, then use the lossless encoding and
framemd5 comparison documented in the TEE section below. Do not redistribute
unredacted originals.

Checks: `npm run test:echo-references`; against the server,
`npm run test:echo-browser` checks selection, local override, modality isolation
and TR/EN; `npm run test:ice` checks the existing geometry, controls, sweep and
transseptal stages. `APP_URL=http://127.0.0.1:5198/echo` targets the standalone
studio for the legacy ICE geometry script.

## TEE references and ME 2C caveat (2026-10-25)

The known ME two-chamber anatomical limitation now appears above the sector,
including during a task. Its feedback is amber (`data-state=limited`), even when
the programmed model criteria pass. Probe geometry, grading thresholds and
clinical validation status are unchanged. The existing full atlas note remains
available below the controls. Regression checks distinguish a model pass from
the anatomical caveat and check that other views do not inherit the warning.

Five licensed TEE recordings are attached to their named presets: resting ME 4C,
ME 2C, ME long axis / three-chamber, TG mid-papillary SAX (Legault et al. 2010,
10.1186/1476-7120-8-30) and a pathological bicaval SVC mass case (Tzortzis et al.
2008, 10.1186/1757-1626-1-272). All are CC BY 2.0. The resting study videos are
not labeled normal. The source ME 2C protocol uses 60°, explicitly distinguished
from this atlas's 105° preset in the panel. Bicaval is labeled as pathological
and includes color Doppler. Commissural, AV SAX and LAA remain without bundled
media because no suitable source was verified for those views in this pass.

Original Ogg files and source metadata are retained in `source-media/` and
`tee-media-sources.json`. Browser-compatible WebM/VP9 files use lossless encoding;
FFmpeg framemd5 found 218 identical decoded frames across all five sources.
`tee-media-verification.json` records per-file checksums, frame counts and decoded
frame-list digests. No cropping, resizing or annotation removal was performed.

Reproduce encoding for each source:

```sh
ffmpeg -i SOURCE.ogv -map 0:v:0 -an -c:v libvpx-vp9 -lossless 1 -row-mt 1 -threads 2 -fps_mode passthrough OUTPUT.webm
ffmpeg -i SOURCE.ogv -map 0:v:0 -f framemd5 source.frames
ffmpeg -i OUTPUT.webm -map 0:v:0 -f framemd5 output.frames
```

Compare each frame's final MD5 column; container time bases may differ. Run
`npm run test:echo-references` for source/output integrity and classification,
and `npm run test:echo-browser` plus `npm run test:echo` against the running studio
for the warning, TR/EN, video identity, missing-view state and probe regressions.

## Bundled reference library (2026-10-25)

The optional comparison panel includes four source-linked TTE examples: PLAX
(still echo plus anatomical illustration), A2C, A3C and A4C (real cine loops).
PLAX is CC BY 2.5 (Patrick J. Lynch and C. Carl Jaffe); the apical recordings are
CC BY-SA 3.0 (CardioNetworks: Vdbilt). Files remain unchanged; on-screen credits
are retained. Attribution ships in `public/echo-references/README.md`; the catalog
records download URLs, source pages, access date and SHA-256 values.

Bundled media load from this application's origin only when the panel is opened.
They do not autoplay. A local file overrides that preset's bundled reference;
removing it restores the bundled example. Other TTE views, TEE and ICE retain
their local-file option without substituting a different view. The published
examples do not follow free probe movement or cardiac phase. No diagnostic
interpretation or severity assessment is added.

Run `npm run test:echo-references` for source-record, checksum, media-header and
modality-isolation checks; this command also runs through `npm test`.

## Local reference comparison (2026-10-23)

The optional **Compare with real echo / Gerçek EKO ile karşılaştır** panel below
the schematic sector accepts local MP4/WebM/Ogg video and PNG/JPEG/WebP/GIF images
(up to 100 MB per file). Each TTE, TEE or ICE preset keeps its own reference for
the current tab session. Switching presets pauses playback and restores that
preset's reference; switching language preserves the chosen files. Removing or
replacing a reference releases its object URL. Closing the panel, starting a task
or leaving echo pauses playback.

Files are read through browser object URLs, without upload or persistent storage;
reloading clears the selection. Use de-identified recordings. View association is
user-supplied: references do not track the free probe pose or cardiac phase and
are not clinically validated matches. The initial local-file change did not
bundle clinical clips; see the later bundled reference library above. The
existing schematic section is unchanged.

Date: 2026-09-30. Scope: `research/TTE_TEE_ENTEGRASYON_RAPORU.md`, stages 0–3. Teaching geometry on the atlas; no patient data, no expert review.

## What exists

Modes **12 · Ekokardiyografi (TTE)** and **13 · Transözofageal Eko (TEE)**, group "Görüntüleme / Imaging". Left: the probe, its imaging fan and the 3D heart. Right panel: the 2D sector section of the same plane, feedback, controls. Four lesson steps: TTE views, TEE views, "find the view" task, limits.

| Module | Responsibility |
|---|---|
| `src/echo-section.js` | Plane cut of the current (beating) triangles; cut points welded by edge, joined into contours, each closed or open; 2D image coordinates (x lateral = screen right, y depth). |
| `src/echo-probe.js` | TTE: window base frame on a schematic ellipsoid chest surface; rotation about the beam first, then tilt and rock on the turned plane, slide along the surface (contact kept). TEE: path with arc-length advance and a parallel-transported face; flexion (ante/retro, left/right) bends a 2 cm distal section into an arc, so the tip moves and stops at the lumen (0.3 units in the oesophagus, 1.2 in the stomach); the multiplane angle turns the image about the beam without moving the tip. |
| `src/echo-anatomy.js` | Sectioned structures (LA split into body and appendage lobe), landmarks, schematic oesophagus-stomach path, heart-surface exit distance. |
| `src/echo-views.js` | 8 TTE views (PLAX, PSAX AV/MV/PM, A4C, A2C, A3C, subcostal 4C) and 10 TEE views (ME 4C, mitral commissural, 2C, LAX, AV SAX, bicaval, LAA, RV inflow-outflow, LAA and left upper PV neighbourhood; TG mid SAX) with required and avoided structures, landmark presets and the atlas calibration. |
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

- Ownership update (2026-10-01): the project owner declared that they designed the atlas themselves. The earlier unknown-author assumption and its distribution block are superseded. `ASSET_PROVENANCE.json` records the declaration and exact checksum; the release/Docker check verifies that record and identity. No external creator's licence is required for this owner-authored atlas. This is not an open-source licence assignment or clinical validation of the echo module.
- Topology: the chambers and vessels are open surfaces (valve rims, vessel ends), so many cuts give open contours. Open contours are drawn as lines and never filled; a closed contour of a chamber is filled only in the anatomical colour style, as blood pool, never as myocardium. No wall thickness is invented.
- Scale: see the coordinate contract.
- Result (2026-09-30): atlas SHA-256 `05f373a2…09b757` matches `src/atlas.js`; of 31 sectioned meshes, 19 are open surfaces. Every view preset gives both closed and open contours (for example A4C 11 closed / 15 open, ME 4C 19 / 9, TG SAX 7 / 2); open ones are shown as lines.

## Presets and calibration

Presets come from measured landmarks (mitral and tricuspid annulus frames, LV apex, aortic cusp plane, papillary muscle, LA, LAA orifice). `node scripts/echo-calibrate.cjs` then searches a grid around each preset for the smallest probe adjustment whose section meets the view's criteria at rest and at four phases of the beat (the worst phase counts; the AV plane descends in systole). Guideline angle ranges and atlas preset angles are documented separately in `src/echo-views.js`; the RV inflow-outflow preset uses 75° and the LAA/PV neighbourhood preset uses a 135° sweep, outside their listed starting ranges. The resulting offsets are stored in `src/echo-views.js`. They fit this atlas only and are not an expert review; the report asks for expert calibration and that is still open.

The current catalogue contains 18 presets (8 TTE and 10 TEE). The historical 16-preset result predates the RV inflow-outflow and LAA/PV neighbourhood additions; `scripts/test-echo.cjs` now checks the current catalogue at four phases of the beat, and `scripts/echo-calibrate.cjs` iterates it. A test pass establishes the model's programmed criteria, not clinical validity.

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
| Mode on the atlas: 18 presets, orientation, separate TEE motions, phase-locked section, freeze, task, speed | `npm run test:echo` (running server) |
| Preset calibration | `node scripts/echo-calibrate.cjs` (running server) |
| Stage 0 audit | `node scripts/echo-audit.cjs` (running server) |

The section is computed from the geometry of the current phase (after the heart deforms), so the 2D image and the 3D heart show the same moment; freezing stops the shared heartbeat.

## Not done (stages 4–6 and open items)

- Stage 4 (teaching pilot with pre/post tests), stage 5 (licensed reference clips or volumes, synthetic B-mode, pathology) and stage 6 (M-mode, colour and spectral Doppler, measurements, hardware) are outside code-only work and were not started. Each needs its own data, licence and validation gate.
- No echocardiographer has reviewed the presets, thresholds or orientations.
- Performance was measured on one development machine only (section time per frame in `test:echo`); the report's 30 fps / 100 ms p95 target has not been measured on a fixed test device.
