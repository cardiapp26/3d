# Beat motion: attached structures follow the moving heart

Date: 2026-09-29. Scope: report section 12 ("Atım görsellerini iyileştirme planı"), first delivery Phase A (inventory, make the problem measurable) and Phase B (moving surface versus static attached structures). The contraction curve and chamber deformation law were deliberately left unchanged (the report asks for that in Phase B, so the attachment fix is seen on its own). Schematic motion; amplitudes are not patient data.

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

## Remaining (not done in this delivery)

- Phase C: seams. Adjacent chambers deform with separate fields (LV and RV centres, atrial and ventricular valve locks in world Y), so the walls themselves separate along the interventricular grooves and the AV junction; a follower in a seam sits between them and differs from either wall by up to about half of that separation (the "incl. seams" column). A shared seam field, local apex-base axes, separate shape and tension channels and recomputed normals belong to Phase C, with the motion-phase relation to be confirmed by a domain expert first.
- Phase D: lesson overlays, leads, catheters, labels and flow routes listed above.
- Phase E: quality levels, play speed separate from heart rate, real-device frame time and heat.
- Leaflets are not carried by the chamber; the valve plane is locked in the current law so hinges stay put, and Phase C should revisit this together with the annulus frame.
