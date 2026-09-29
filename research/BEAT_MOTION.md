# Beat motion: attached structures follow the moving heart

Date: 2026-09-29. Scope: report section 12 ("Atım görsellerini iyileştirme planı"), Phase A (inventory, make the problem measurable), Phase B (moving surface versus static attached structures) and Phase C (shape and tension channels, local chamber axes, seams, normals). Phase B left the contraction curve and deformation law unchanged, as the report asks, so the attachment fix is seen on its own; Phase C then replaced the law. Schematic motion; amplitudes are not patient data.

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
| Phase D | Transseptal overlays (fossa disc, limbus, septal disc), EP landmarks (Koch triangle, CTI and PVI lines), pacemaker leads, cath catheters, mitral scallop labels, flow routes and particles, hover and site labels, auscultation markers | not yet attached |

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
- longitudinal: toward the valve plane (ventricles 7 %, atria 5 %); the valve plane stays fixed, as before, so leaflet hinges stay on the atlas orifice (real hearts also move the AV plane toward the apex; this schematic keeps the apex-to-base shortening instead);
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
- Phase D: lesson overlays, leads, catheters, labels and flow routes listed in the inventory.
- Phase E: quality levels, play speed separate from heart rate, real-device frame time and heat.
