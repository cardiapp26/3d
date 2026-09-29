# Beat motion: attached structures follow the moving heart

Date: 2026-09-29. Scope: report section 12 ("Atım görsellerini iyileştirme planı"), Phase A (inventory, make the problem measurable), Phase B (moving surface versus static attached structures), Phase C (shape and tension channels, local chamber axes, seams, normals) and Phase D (lesson overlays, devices and flow). Phase B left the contraction curve and deformation law unchanged, as the report asks, so the attachment fix is seen on its own; Phase C then replaced the law. Schematic motion; amplitudes are not patient data.

## Phase A: inventory

| Class | Structures | Motion source |
|---|---|---|
| Independent (owners) | LV, RV | `writeChamber`, ventricular contraction, valve plane fixed |
| Independent (owners) | LA, RA | `writeChamber`, atrial contraction, valve plane fixed |
| Independent | LAA marker | LA motion (existing) |
| Independent | Mitral and tricuspid leaflets | AV opening in the annulus frame (existing) |
| Independent | Aortic cusps, pulmonary valve | semilunar opening (existing) |
| Attached (new, Phase B) | Coronary arteries (LM, LAD, LCx, RCA and branches, septal) | nearest wall vertex, groove-smoothed |
| Attached (new) | Cardiac veins (CS, GCV, MCV, PVLV) | nearest wall vertex, groove-smoothed |
| Attached (new) | Great-vessel roots (aorta, pulmonary trunk and branches, SVC, pulmonary veins) | nearest wall vertex, fading to still over distance |
| Attached (new) | Papillary muscles | own ventricle's continuous deformation field |
| Attached (new) | Mitral and tricuspid annulus rings | own atrium and ventricle only, smoothed |
| Attached (new) | Conduction system (SA and AV nodes, internodal tracts, Bachmann, His, bundle branches, Purkinje) | nearest wall vertex, smoothed |
| Fixed by policy | Diaphragm, phrenic nerves, vertebral column | none (surroundings; respiration out of scope) |
| Fixed by policy | Septal defect markers | beating is stopped in the ASD/VSD mode (existing policy) |
| Attached (Phase D) | Transseptal overlays and catheters, EP landmarks (Koch triangle, CTI, PVI/WACA, roof and mitral lines, lesions), pacemaker leads and tips, cath catheters and stations, flow particles | wall binding near walls, chamber field inside cavities |
| Follows by construction | Mitral scallop labels | re-projected each render from a leaflet vertex |
| Fixed by policy | Auscultation markers | chest wall, not the heart |
| Fixed by policy | ASD/VSD site rings and labels | defect mode keeps the heart still |

## Method (Phase B)

- `src/animation-channels.js`: surface followers are bound once, at rest, and ahead of the first beat (browser idle time). A vertex in contact with a wall (within 0.15 units) follows it fully; the weight fades smoothly to zero at 0.45 units, so the far aortic arch or a distant pulmonary vein stays still.
- Each vertex keeps its nearest vertex on every chamber. The chamber mix uses inverse fourth power distance (the wall it lies on dominates). For thin tubes (coronary vessels, cardiac veins, conduction tracts) and the annulus rings, the mix is smoothed over the mesh's own edges, with coincident seam vertices welded. A vessel in the interventricular groove therefore moves as one tube instead of tearing along the groove.
- Anatomical owners: a papillary muscle belongs to its ventricle, the mitral annulus to LA and LV, the tricuspid annulus to RA and RV.
- Papillary muscles sit inside the cavity; they follow the ventricle's continuous deformation field evaluated at their own vertices (`chamberFieldOffset`, the same law as the wall, clamped to the chamber height). Nearest-vertex binding would jump between opposite walls across the cavity.
- Every frame starts from the rest pose (no accumulated drift); reset restores followers as well.

## Measurement

`npm run test:beat` (`scripts/measure-beat-attachment.cjs`, running server). For structures within 0.06 units of a chamber at rest, the offset to the nearest chamber vertex should stay constant; the script samples 24 phases plus both sides of each phase boundary and reports the largest change as a percentage of heart length (3.3 units). Contacts where a second chamber lies within 0.05 units (grooves between two walls, intramural septal tracts) are reported separately as seam contacts.

| Group | Contacts | Before, max | After, max off seam | After, max incl. seams |
|---|---|---|---|---|
| Coronary arteries and veins (coronary layer) | 4128 | 6.17% | 0.62% | 2.12% |
| Cardiac veins (subset) | 2203 | 6.17% | 0.62% | 1.70% |
| Papillary muscles | 1330 | 5.48% | 0.32% | 0.32% |
| Annulus rings | 842 | 2.60% | 0.20% | 1.45% |
| Great vessels | 1185 | 4.24% | 0.06% | 0.74% |
| Conduction system | 2921 | 6.17% | 0.27% | 1.79% |

Integrity: largest edge-length change on coronary meshes 0.74% of heart length (before the groove smoothing the middle cardiac vein tore by 2.46%), annulus rings 0.43%. Papillary muscles shorten by up to 1.58% of heart length, continuously along their length as the ventricle contracts. Drift after 100 cycles: 0. Gap to rest after reset: 0.

Cost (desktop Chrome, headless): binding about 0.3 s once, at idle time after load; one beat frame including chamber deformation, followers and valves about 2 ms. First beat after idle binding about 50 ms.

The `--assert` gate: off-seam deviation below 1% for every group, no drift, exact reset. Before and after renders at end-systole (phase 0.65): anterior, posterior, LAO and RAO; in the posterior view the posterior coronary branches and veins no longer hang outside the contracted ventricle.

## Remaining after Phase B

- Seams: adjacent chambers deformed with separate fields, so walls separated along the grooves and the AV junction (the "incl. seams" column). Done in Phase C, below.
- Phase D and Phase E: see the end of this file.

## Phase C: phase-motion relation (written first, as the report asks)

Accepted by the project owner on 2026-09-29 for implementation; still to be reviewed by a domain expert. Geometry follows a schematic chamber volume proxy; nothing here is a measured volume.

Ventricular shape s_v (0 = end-diastolic size, 1 = end-systolic size), separated from ventricular tension (the existing `ventricularContraction`, which keeps driving chordal tension and the narrative):

| Interval (engine phase) | Tension | Shape s_v | Reason |
|---|---|---|---|
| Rapid filling (0 to 0.18) | 0 | 1 to 0.25, fast then slow | early diastolic filling |
| Diastasis (0.18 to 0.32) | 0 | 0.25 to 0.18 | slow filling |
| Atrial systole (0.32 to 0.45) | 0 | 0.18 to 0 | atrial kick completes filling (sinus) |
| Isovolumetric contraction (0.45 to 0.53) | rising | 0 | both valves shut: size unchanged |
| Ejection (0.53 to 0.88) | peak, then falling | 0 to 1, fast then slow | volume falls until aortic closure |
| Isovolumetric relaxation (0.88 to 1) | falling | 1 | both valves shut: size unchanged |

Previously one weight drove both: geometry peaked mid-ejection and returned to full size at S2, i.e. the ventricle re-expanded during isovolumetric relaxation.

Atrial shape s_a (0 = largest, just before the AV valves open): conduit emptying 0 to 0.35 in rapid filling, steady in diastasis, booster 0.35 to 1 in atrial systole, reservoir filling 1 to 0 through ventricular systole and relaxation. Atrial fibrillation: no booster (s_a stays 0.35 until the AV valves close, then refills) and no atrial kick in the ventricle (diastasis runs on to end-diastole).

Deformation components per chamber, in the chamber's own frame (valve orifice centre to apex for the ventricles, to the chamber body for the atria) instead of world Y and bounding boxes:
- radial: toward the long axis, growing with distance from the valve plane (ventricles 11 %, atria 8 % at the far end);
- longitudinal: toward the valve plane (ventricles 7 %, atria 5 %); the valve plane stays fixed, as before, so leaflet hinges stay on the atlas orifice (real hearts also move the AV plane toward the apex; this schematic keeps the apex-to-base shortening instead). Superseded after Phase D: the ventricular 7 % is now the AV plane descending toward a still apex, see "Closing the open items";
- torsion: left ventricle only, low amplitude (about 6 degrees at the apex at end-systole), about the long axis;
- seams: where two chambers meet (interventricular septum and grooves, interatrial septum), vertices within 0.25 units of the other chamber blend toward the other chamber's field (half at contact), so the walls no longer separate along the seam;
- normals: the torsion rotation is applied to the rest normals so lighting follows the twist.

## Phase C: results

Implementation (`src/animation-channels.js`): `shapeChannels` gives `ventricularShape` and `atrialShape`; `ventricularContraction` and `atrialContraction` stay as tension (chordae, flow gating, narrative). Each chamber is measured once from its rest mesh and the annulus centre (`measureChamberFrame`); without a known annulus it falls back to the old bounding-box frame. Per-vertex frame terms and seam links are cached, so a frame is multiply-adds only.

| Group | Contacts | Phase B, incl. seams | Phase C, off seam | Phase C, incl. seams |
|---|---|---|---|---|
| Coronary arteries and veins (coronary layer) | 4128 | 2.12% | 0.18% | 0.60% |
| Cardiac veins (subset) | 2203 | 1.70% | 0.01% | 0.60% |
| Papillary muscles | 1330 | 0.32% | 0.76% | 0.76% |
| Annulus rings | 842 | 1.45% | 0.00% | 0.01% |
| Great vessels | 1185 | 0.74% | 0.02% | 0.31% |
| Conduction system | 2921 | 1.79% | 0.12% | 0.12% |

Values are the largest change of wall offset over the cycle as a percentage of heart length. Papillary muscles rise from 0.32% to 0.76% because the new law adds torsion and the measured tilted axis; they still follow the continuous field of their ventricle and stay within the gate.

Seams: 1084 chamber vertex pairs across the septa and grooves; their separation changes by at most 0.83% of heart length over the cycle. Integrity: coronary edges change by at most 0.61% of heart length, annulus rings 0.01%, papillary muscles 1.34% (continuous shortening with the ventricle). Drift after 100 cycles: 0. Gap to rest after reset: 0. Normals of the twisting LV are rotated with the torsion; the other chambers keep rest normals (their tilt from the squeeze is small).

The `--assert` gate is now stricter: every group below 1% including seam contacts (Phase B gated only off-seam contacts), seam separation below 1%, no drift, exact reset.

Cost: after caching the frame terms, compacting follower bindings to non-zero owners and skipping follower vertices without an owner, a beat frame costs the same as Phase B when both are measured back to back on the same machine (median 5.5 ms versus 5.6 to 5.8 ms over 600 frames, on a heavily loaded desktop, load average near 40; Phase B measured about 2 ms when the machine was idle, Phase C has not been timed idle yet). Binding stays at idle time after load.

Unit tests (`scripts/test-animation-channels.mjs`): size constant through both isovolumetric intervals, monotonic ejection and filling, atrial kick in sinus rhythm and none in AF, a tilted measured frame, fixed valve plane, apex motion along the axis, torsion preserving radius, LV torsion 3 to 10 degrees, no RV torsion, seam weights. The old mock test that expected a relaxed ventricle throughout filling encoded the previous law and was updated.

## Remaining after Phase C

- Expert review of the phase-motion relation above (accepted by the project owner only).
- The valve plane stays fixed: the AV plane descent toward the apex in systole is not modelled, and leaflets are not carried by the chamber. Moving it needs the leaflet hinges, annulus rings and valve frames to move together.
- Geometry follows a schematic volume proxy; no chamber volume or ejection fraction is measured from the mesh.
- Phase E: quality levels, play speed separate from heart rate, real-device frame time and heat.

## Phase D: lesson overlays, devices and flow

Implementation (`src/overlay-follow.js`, wired in `src/heart.js`, field from `channels.fieldContext()`):
- Every visible mesh or line in the EP, pacemaker, transseptal and cath groups is bound from its rest shape. A point near a wall takes the displacement of its nearest wall vertices (the Phase B binding, fading to still 0.45 units away). A point inside a cavity takes the chamber's own continuous field, so a catheter crossing a cavity does not jump between opposite walls. A smooth inside weight from a per-chamber radius profile (16 axial bins by 12 sectors around the valve-to-apex axis) blends the two.
- Small objects (lesion dots, electrode rings, lead tips, stations; radius below 0.08, or geometry shared by several objects) move rigidly with the field at their centre, so they keep their shape.
- Lesson code rebuilds tubes as a lead or catheter advances and moves tips and balloons: a replaced geometry or a changed transform is rebound from its own rest. Hidden overlays go back to rest and are unbound. With the heart at rest (never beaten, reduced motion, defect mode, reset) nothing is bound and overlays are at rest.
- Flow particles: each route is sampled at 49 points and bound once; per frame the samples are displaced and every particle takes the interpolated displacement at its position along the route. Particle meshes are no longer frustum-culled by a stale bound.
- Builders that measure the live geometry lazily (measured flow routes, auscultation markers) now measure the rest anatomy even when first shown mid-beat.
- Bounds: deformed meshes and overlays pad their bounding sphere by 0.2 units, so picking and culling still find the moving surface.

`npm run test:overlay` (`scripts/measure-overlay-attachment.cjs`, running server) walks every lesson step, takes overlay vertices within 0.06 units of a chamber at rest and samples 24 phases plus both sides of each boundary, as the Phase B script does.

| Step | Overlays | Contacts | Before, max | After, max | Worst after |
|---|---|---|---|---|---|
| Ablation 0 (CTI) | 12 | 2677 | 0.01% | 0.01% | CTI line |
| Ablation 1 (Koch) | 18 | 3277 | 0.12% | 0.08% | pyramidal space |
| Ablation 2 (PVI) | 34 | 5578 | 2.06% | 0.65% | right WACA ring |
| Ablation 3 (all) | 64 | 11532 | 2.06% | 0.65% | right WACA ring |
| Pacemaker 0 to 3 | 5 | 255 to 446 | 0.06 to 2.75% | 0.02 to 0.25% | lead body |
| Bachmann 1, 2 | 5 | 386, 397 | 0.06%, 1.11% | 0.02%, 0.21% | lead body |
| Transseptal 0 to 3 | 20 to 24 | 1251 to 2087 | 1.02% | 0.73% | septal region disc |
| Cath 0 to 4 | 5 to 14 | 0 | n/a | n/a | catheters float in the cavities |

Values are the largest change of wall offset over the cycle, as a percentage of heart length. Overlays move up to 2.6% of heart length over the cycle. The CTI line and Koch landmarks sit next to the tricuspid valve plane, which stays fixed, so they barely move; that is consistent with the wall there. The cath catheters touch no wall and are checked for continuity by the unit test instead.

Lesson progress, beat and camera together: the pacemaker leads are advanced over 41 frames while the heart beats and the camera changes view; at the end the pose equals a fresh binding at the same phase exactly (gap 0). Reduced motion returns every overlay to rest exactly and unbinds them.

Cost: a beat frame in the lesson modes stays within the display frame (16.7 ms at 60 Hz, same as the anatomy mode, on a heavily loaded desktop). Entering a lesson mode while the heart beats binds its overlays once: 28 ms (pacemaker) to 138 ms (transseptal) on the same loaded machine.

Unit tests (`scripts/test-overlay-follow.mjs`): inside weight, wall point equal to its wall vertex, cavity point equal to the chamber field, distant point still, continuous motion across a cavity from wall to wall, per-vertex and rigid objects, rebinding on replaced geometry and on moved objects, hidden overlays and rest pose restored, flow particles shifted by the field.

### Section planes and labels, per tool

| Tool | Attached to | Behaviour while beating |
|---|---|---|
| Wall cut (per chamber) | world, placed from the rest chamber | the plane stays; the wall contracts through it |
| IVC window, root window | world, from rest anatomy | fixed |
| Great-vessel trims | world, from rest vessels | fixed; the trimmed ends are far from the heart where following has faded out |
| Lesson overlays | no section planes | follow the heart |
| Mitral scallop labels | a leaflet vertex | follow the leaflet each render |
| ASD/VSD labels | defect sites | defect mode keeps the heart still (policy kept) |
| Hover badge | screen (no 3D position) | not affected |

## Closing the open items (after Phase D)

### Module split

`src/animation-channels.js` had grown to 940 lines. It is now the per-heart controller (about 300 lines) plus four modules, with the old exports kept:
- `src/cycle-channels.js`: tension and shape channels from the shared clock;
- `src/chamber-field.js`: chamber laws, measured frames, the AV plane, and one field kernel (`fieldTerms`, `fieldAt`) used by the walls, papillary muscles, leaflets, LAA marker and overlays (it was written out four times before);
- `src/surface-followers.js`: wall binding of attached structures;
- `src/valve-motion.js`: leaflet opening.

The split alone changed no measurement.

### AV-plane descent, leaflets carried

Longitudinal shortening is now the AV plane descending toward a still apex, as in real hearts, instead of the apex rising toward a fixed valve plane. The amount is unchanged: 7 % of ventricle length at end-systole, from the same shape channel.
- The plane is shared by the four chambers. It passes through the midpoint of the two AV orifices, along the mean ventricular axis. Its descent is the mean of the two ventricles'.
- Each point takes a share of the descent from its position alone: 1 on the plane, falling to 0 at the apex and at the atrial roofs. Coincident vertices of two chambers therefore move identically in this component. The atria are stretched as the plane descends (reservoir), their roofs and veins stay.
- AV leaflets open in their annulus frame as before, then are carried by their ventricle's field at the opened position. Hinges stay on the moving annulus, and chordal tips stay on the papillary heads, which ride the same field.
- Semilunar cusps are bound to their own root wall (aorta, pulmonary trunk) and take its motion.

| Measure (% of heart length) | Phase C | Now |
|---|---|---|
| Coronary arteries, incl. seams | 0.60 | 0.52 |
| Papillary muscles | 0.76 | 0.46 |
| Great vessels | 0.31 | 0.31 |
| Conduction | 0.12 | 0.12 |
| Annulus rings | 0.01 | 0.10 |
| Seam separation | 0.83 | 0.56 |
| Mitral chord tips on LV papillary heads (valve closed) | 1.15 | 0.13 |
| Tricuspid chord tips on RV papillary heads | 0.65 | 0.14 |
| Mitral hinges on the annulus ring | 0.04 | 0.15 |
| Tricuspid hinges on the annulus ring | 0.02 | 0.31 |
| Aortic cusps on the aortic root | 0.23 | 0.00 |
| Pulmonary cusps on the pulmonary trunk | 1.18 | 0.00 |
| Lesson overlays, worst step | 0.73 | 0.73 |

Leaflets are measured while the valve is closed (AV valves through ventricular systole, semilunar valves through diastole), so the opening swing itself is not counted. The annulus hinges now move with the plane, hence the small rise from almost zero; they stay well within the gate. `npm run test:beat` now also gates the leaflets below 1 %.

A first version gave each chamber its own descent and fading. The two ventricles then descended along different axes, and seams (1.20 %) and coronaries (1.19 %) failed the gate. Sharing one plane and a position-only share fixed both. With the descent, overlays and structures near the base move up to about 5 % of heart length over the cycle; the overlay script's sanity limit is 8 %.

Unit tests updated with the reason: the valve plane descends by axial × length without squeeze, the apex keeps its place along the axis, and an atrium carries the descent at its base but not at its roof. The old assertions encoded the fixed valve plane.

Cost: a beat frame stays at 5.0 to 5.8 ms on a quiet desktop (Phase D level). The shared kernel was first slower (13 to 19 ms): mixed Float32/Float64 term arrays kept it from being inlined. All callers now pass Float32Array terms and a Float64Array result.

### Entering a lesson while the heart beats

Overlay bindings are cached by their world points, and every overlay group is bound in short idle slices (12 ms) after load. Measured back to back on the same machine: ablation 48 to 24 ms, pacemaker 19 to 8 ms, transseptal 80 to 30 ms. The rest of the entry frame is mode set-up and rendering.

### Tubes and normals

Thin tubes (catheters, leads, lines) bound per vertex sheared their cross-section: faces rotated up to 63 degrees (99th percentile 19). Two changes:
- tubes now move ring by ring, with the field at each ring's centre, smoothed along the tube over about 0.12 units, so a change of nearest wall vertex does not kink them;
- markers (rings, spheres, electrode cylinders up to 0.2 units) move rigidly.

Face rotation over the cycle is now at the 99th percentile 2.4 degrees for ablation lines, 3.2 for leads and 6 for catheters. The largest values (up to 27 degrees) are single faces in tight bends such as the pigtail curl, on tubes 0.02 units thick. Normals are not recomputed: recomputing them on tube geometry creates a shading seam where the tube's first and last radial vertices meet, which is a worse artefact than these rotations.

## Remaining

- Expert review of the phase-motion relation (Phase C table, now with the AV-plane descent).
- Phase E: quality levels, play speed separate from heart rate, real-device frame time and heat.
