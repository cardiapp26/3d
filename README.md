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

- **C-Arm Angiography Gantry**: 2D trackpad joystick, standard projections (Spider, RAO/LAO Cranial/Caudal), and fluoroscopy X-ray shading. Starts collapsed (`+`) in anatomy mode to preserve 3D visibility, opens automatically in angiography mode, and behaves as a responsive bottom sheet drawer on mobile viewports (`<= 768px`). Exiting fluoroscopy cleanly restores coronary material roughness (0.65) and metalness (0).
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
