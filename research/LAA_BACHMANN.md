# LAA appearance and Bachmann's bundle placement

Date: 2026-09-30. Scope: report section 13. Schematic teaching geometry on the atlas; no measured patient data.

## 1. Marker identity

In the LA and LAA mode (mode 02) only the LA and the LAA ring are shown; Bachmann's bundle is hidden there. A thin gold line in that mode was therefore the LAA orifice ring, not the bundle. Both were drawn in similar gold and amber tones.

Changes:
- the LAA orifice ring is now teal; the Bachmann band stays amber; the RA pacing target is a separate magenta marker;
- identity labels on the scene: "LAA ostiyum işareti", "Bachmann demeti (epikardiyal)", "Pacing hedefi (RA endokardı)" (EN: LAA orifice marker, Bachmann's bundle (epicardial), Pacing target (RA endocardium)). Each is anchored to a vertex of its structure and re-projected every render from the current, beating position; overlapping labels are lifted with a leader line. They are hidden over the fluoroscopy image;
- a badge on the scene names the active mode (with its number) and the selected structure, so a screenshot always says what it shows;
- the LA and LAA note says which ring is shown and that the bundle is hidden in that mode.

## 2. LAA size

Orthographic, same-scale views of the LA alone (anterior, superior, left lateral): `research/screenshots/laa-ortho.png`. Scale: the mitral annulus measures 0.875 units across; at about 30 mm this gives 1 unit = 34 mm (the LV long axis, 2.4 units, is then about 82 mm, consistent).

| Measure | Atlas | Published range (220 resin casts; mean) |
|---|---|---|
| LAA length, orifice to tip | 1.49 units, about 51 mm | 16 to 51 mm (30) |
| Orifice (measured neck) | 0.37 units, about 13 mm | minimum diameter 5 to 27 mm (15) |
| Largest cross-section of the lobe | 1.13 units, about 38 mm | width, mean 31 mm |
| Share of LA vertices in the lobe | 20 % | |

The atlas appendage is long and broad, at the upper end of the published range, but not outside it. The larger impression also has two viewing causes: the LA mode frames the LA closely in perspective, and the anterior appendage is the part nearest the camera.

Follow-up (2026-09-30): after seeing the result, the project owner still found the appendage too large and asked for it to be reduced. `src/la-appendage.js` (`shrinkAppendage`) now scales the lobe toward its measured neck at load, before any landmark is measured: the lobe is the part of the LA mesh beyond the neck plane connected to the tip (20 % of the LA vertices, 511 moved); the scale is 1 at the neck and reaches 0.68 over 0.25 units, so the neck (orifice, 13 mm) is unchanged and there is no crease. Length from the neck to the tip: 50 mm before, 34 mm after, near the published mean (30 mm). The neck is measured once before the change and kept on the mesh for every later consumer (orifice ring, Bachmann, ridge). This is a deliberate, recorded change to the atlas shape (`heart.atlasAdjustments().laaScale`), not a measurement.

## 2a. Left lateral (Coumadin) ridge

The fold of the LA endocardium between the appendage orifice (anterior) and the left pulmonary vein ostia (posterior), added as its own structure (`coumadin-ridge`, schematic, `src/la-appendage.js`). In the atlas the appendage points anteriorly and the left superior vein opens just behind its neck, so the ridge runs vertically on the lateral wall: for each left vein, the crest is midway between the closest pair of appendage-rim and vein-rim points; the ridge runs from just above the superior vein down past the inferior one, and is placed on the wall by casting from the LA centre (the exact triangle, not a vertex average), 0.015 units into the cavity. Length 19 mm. It follows the LA in the beat, is shown, selectable and labelled in the LA and LAA mode, and has TR/EN text (echo pseudo-thrombus, the anterior edge of the left WACA ring, the posterior border of the orifice in occluder sizing).

## 3. Bachmann's bundle: what was wrong

Reference anatomy (Ho and Sánchez-Quintana, PMC4668306): the most superficial myocardial band of the anterosuperior atrial wall; it crosses the anterior interatrial groove, on the right reaches toward the superior cavoatrial junction and the right atrial appendage, and on the left branches around the neck of the LAA.

The previous band (`research/screenshots/bachmann-before-ortho.png`) was placed from bounding-box corners and fixed offsets, with a posterior bias to avoid the aorta:
- 21 of its 98 vertices were inside the ascending aorta, up to 0.22 units deep (same sector model of the aorta as the checks below);
- it stood up to 0.30 units (about 10 mm) off the atrial surface;
- its course was chosen to avoid the aorta, not from the groove or the LAA neck.

## 4. Transverse sinus

In the atlas the atria partly enter the ascending aorta (285 RA and 41 LA vertices inside it); in the heart the transverse sinus of the pericardium separates them. `src/transverse-sinus.js` models the ascending aorta as horizontal rings with a measured radius per 16 angular sectors (the root is not circular), interpolated in height and angle. At load, before any landmark is measured or any rest pose is kept, atrial vertices inside the aorta or closer than 0.03 units to its wall are moved radially out to that gap: 776 vertices, at most 0.27 units (about 9 mm), with their normals taken from the new surface. The aorta is not changed. Afterwards no atrial vertex lies inside the aorta (`research/screenshots/transverse-sinus.png`: the atria without the aorta, showing where it sits).

## 5. Placement from measured landmarks

`src/bachmann.js` builds the band from:
- the sinus node (superior cavoatrial junction): the superior right limb starts there, on the RA surface;
- the anterior interatrial groove: RA and LA outer-surface contacts (within 0.12 units) outside the aorta; of those against the aortic wall, the highest (roof level). Measured behind and above the aortic root, 0.18 units from its wall;
- the LAA neck: a circle just outside the measured orifice, entered on the side facing the groove; two arms wrap 40 % of the neck each way;
- the inferior right limb: from the right limb around the base of the right atrial appendage to the sulcus terminalis over the upper crista terminalis (section 5a).

Every sample is placed on the outer (epicardial) surface: the mean of the 10 nearest outward-facing vertices, lifted 0.03 units along their normal, smoothed and placed again. Only atrial surface outside the aorta is used, with a margin (0.1 units for the centre line, 0.07 for the ribbon edges) because the aortic root descends with the AV plane in systole, about 0.05 units toward the band. Avoiding the aorta shapes the path between the landmarks; it does not choose them. With the transverse sinus in place the band keeps its full design width everywhere (no edge had to be pulled in).

The RA endocardial pacing target is a separate point: on the inner face of the RA wall under the right limb near the groove, 0.03 units into the cavity, 0.12 units from the band. The lead in the Bachmann lesson goes to this target (posterior and superior to the RAA target, as before).

Result (`research/screenshots/bachmann-after-ortho.png`, `bachmann-after-zoom.png`, `bachmann-labels.png`): from the sinus node region over the RA roof, behind the ascending aorta through the groove, along the anterosuperior LA wall to the LAA neck; a second right limb around the RAA base.

## 5a. Crista terminalis

`src/crista-terminalis.js` adds the crista as its own structure (`crista-terminalis`, schematic): the muscular ridge on the RA endocardium between the smooth venous sinus and the pectinate region. The atlas RA has no open caval orifices and no crista, so the ridge is placed from measured landmarks on the inner face of the RA wall (`src/atrial-surface.js`, shared with the Bachmann band):
- start in front of the superior caval orifice on the septal side, then its anterolateral rim (the orifice is where the SVC mesh meets the RA; its radius is measured);
- the lateral wall at mid height (the most lateral inner wall, at the middle of its front-to-back span);
- the end in front of the inferior caval orifice, on its lateral side (ostium from `inferiorCavalOstium`).

The ridge sits 0.02 units into the cavity; its radius is 0.03 at the septal start, 0.05 at the anterolateral arch and tapers to 0.018 at the caval end. Its epicardial counterpart, the sulcus terminalis over the upper third, is where Bachmann's inferior right limb ends; the sinus node lies 0.04 units from the upper crista. Length 2.75 units, the full height of the RA.

It follows the RA wall in the beat (bound to the RA only): 710 contacts, deviation 0. It is shown, selectable and labelled in the RA mode, stays opaque when the walls are faded, and has TR/EN text with its clinical use (cristal tachycardia, the posterior barrier of typical flutter, the CTI below its lower end). Image: `research/screenshots/crista-terminalis.png` (right lateral, anterior, posterior; RA translucent).

## 6. Checks

`npm run test:bachmann-placement` (`scripts/test-bachmann-placement.cjs`, running server):

| Check | Result |
|---|---|
| Transverse sinus | 776 atrial vertices moved; none inside the aorta afterwards |
| Groove point on both atria | RA 0.033, LA 0.045 units |
| Groove point outside the aorta, against it | 0.18 units from the wall; posterior to and above the root |
| Superior right limb at the sinus node region | starts 0.13 units from the node |
| Inferior right limb | ends over the upper crista (0.03 units from the sulcus terminalis point) |
| Crista terminalis on the RA endocardium | at most 0.033 units from the inner wall |
| Crista course | starts 0.28 units from the SVC orifice centre, 0.04 from the sinus node; descends 0.44 units lateral to the RA centre; ends 0.42 from the IVC ostium centre (at its rim) |
| Left end at the LAA neck | on the neck circle |
| Band on the atrial surface | at most 0.058 units (lift plus ribbon half-width) |
| Band clear of the aorta at rest | at least 0.077 units, every ribbon vertex |
| Band clear of the aorta through the beat (24 phases) | at least 0.068 units |
| Pacing target | separate (0.12 from the band), on the RA side, shown only in the Bachmann lesson |
| Labels | three distinct labels in the Bachmann lesson, one in the LA mode, none over fluoroscopy |

The band follows the beat as before (conduction layer). The beat and overlay gates, `bachmann-check` (lesson steps, lead targets), the septal defect, CS ostium, conduction path and atria tests all pass with the separated atria.

## 7. Limits

- The pacing target is a teaching point on the atlas wall, not a measured lead position: the atlas has no wall-thickness layers, so "endocardial" means the inner face of the RA mesh. Adding a wall thickness would be invented data.
- The LAA was scaled toward its neck at the owner's request (section 2): its shape is the atlas shape reduced, not a segmented appendage of another heart. The Coumadin ridge is drawn from landmarks; its height and thickness are schematic.
- The crista terminalis is drawn from landmarks, not segmented: the atlas has neither the ridge nor open caval orifices, and pectinate muscles are not modelled.
