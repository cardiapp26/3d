# Fluoroscopic anatomy digest (PCR-EAPCI Textbook, ch. 1.03, Pighi, Piazza et al.)

Paraphrased teaching digest. Source folder: `EAPCI/01-FOUNDATIONS.../03-Fluoroscopic anatomy for the guidance of transcatheter structural and c/`.

**How sources are cited.** `Fig N [_k]` is the caption text in `PCR-EAPCI_Textbook_Chapte_k.pptx`, where `_` alone is the file with no number suffix. `[big sN]` is slide N of `pcr-textbook-chapter_1.03.pptx` (17 MB, 2022 edition). That file has no caption text; its figures are images, so these items were read by OCR plus a visual check. Big slides 1-44 match figure numbers 1-44. Big slides 45-52 match Figs 56-63, and big slides 53-54 are Tables 1-2.

**Caveats**
- Files `_10`, `_37` and `_71` have no text. Fig 45 [`_38`] has an empty caption.
- `figure 3.pptx` is the same as Fig 3 [`_3`].
- Figs 7 and 8 have identical captions, and so do Figs 9 and 14 (Fig 14 is probably a copy-paste error in the source).
- Figs 16 and 18 both give "LAO 90 / CRA 10" for the bicaval and the RVOT views. That value is suspect in at least one of them.
- Angles marked "example" are patient-specific screen readouts, not reference values.

---

## 0. Core concepts (for the C-arm engine)

- How the heart looks depends on the viewing angle, not on the modality. A three-chamber view looks the same in anatomy, echo, fluoro, CT and MRI. Fig 1 [`_`]
- Use attitudinal naming: anterior means closer to the viewer, and superior means toward the head. On the image, the patient's right appears on the viewer's left. Fig 2 [`_2`]
- The C-arm angle is the source-to-detector vector (Vd). A structure is seen in plane whenever Vd is perpendicular to the structure's axis (Vs). Plotting all such angles gives the **optimal projection curve ("S-curve")**. Fig 3 [`_3`, `figure 3.pptx`]
- CRA/CAU is read on the sagittal plane and RAO/LAO on the axial plane, both from an anterior viewpoint. Fig 4 [`_4`]
- CT and fluoro both rely on X-ray attenuation. A CT volume can therefore be ray-cast into a simulated fluoro image and rotated with a virtual C-arm. This is the same principle the app uses. Fig 5 [`_5`]
- Equation: if you know a structure's en-face angle (θ en-face, ∅ en-face), you can compute the CRA/CAU angle on its S-curve for any RAO/LAO angle θ. Two in-plane views can replace the en-face view as input. Fig 19 [`_75`]
- The S-curve is a continuous set of in-plane C-arm pairs, and each structure has its own curve. Where two curves cross, both structures are in plane. Fig 20 [`_76`]. The OCR of the plot shows curves for the aortic root, mitral annulus, LAA ostium and atrial septum [big s20].
- **Table 1, "10 commandments" of the S-curve** [big s53]:
  - Each LAO/RAO angle has one matching CRA/CAU angle on the curve.
  - Any structure that can be defined by a plane has a curve (SVC, IVC, CS, TV, PV, PAs, PVs, MV, AV, coronaries).
  - The curve crosses three quadrants. The fourth quadrant is where the structure appears en face.
  - A vertical curve means a vertical structure, and a horizontal curve means a horizontal one.
  - The tangent at a point gives the structure's orientation on the screen.
  - The crossing of two curves gives the view where both structures are in plane.
  - The area between two curves grows with the angle between the two structures.
- Chamber-view colour code used throughout: 1-chamber blue, 2-chamber yellow, 3-chamber red, 4-chamber green. Fig 6 [`_6`]

## 1. Projections and what each shows best

### Reference chamber views (Fig 6 table [big s6], Table 2 [big s54], Fig 9 panels [big s9])

| View | Left heart | Right heart (RH) |
|---|---|---|
| 1-chamber (short axis) | LAO 50 / CAU 20 | LAO 55 / CAU 15 |
| 2-chamber | RAO 30 / CRA 15 | RH 2-ch: RAO 60 / CAU 50 |
| 3-chamber | RAO 60 / CAU 45 | RH 3-ch: RAO 25 / CRA 15 |
| 4-chamber | LAO 10 / CRA 60 | LAO 5 / CRA 60 |

Fig 7 and Fig 12 place these as regions on the grid [`_7`, `_68`; big s7, s12]:
- Left heart: 4-chamber is LAO CRA, 2-chamber is RAO CRA, 3-chamber is RAO CAU, and 1-chamber is LAO CAU.
- Right heart: 4-chamber is LAO CRA, 3-chamber is RAO CRA, 2-chamber is RAO CAU, and 1-chamber is LAO CAU.

**Left heart, with the matching echo views** (Fig 9 [`_9`, big s9]; Fig 10 example panels [big s10])
- **1-chamber, LAO 50 / CAU 20.** Matches the PSAX and transgastric SAX echo views.
  - Shows both axes of the mitral and aortic annuli.
  - Separates the AV from the MV, the AML from the PML, and all scallops.
  - The LVOT is severely foreshortened.
  - The LAA overlaps the left upper PV. Fig 10A (example CAU 33 / LAO 59) shows the LAA ostium in plane on its major axis and the septum in plane.
- **2-chamber, RAO 30 / CRA 15.** Matches the apical 2-ch and ME 2-ch echo views.
  - Shows the major axes of the aortic and mitral annuli.
  - AML and PML overlap, while A1/A2/A3 and P1/P2/P3 are separated.
  - The papillary muscles are separated.
  - The atrial septum is nearly in plane, and the LAA is separated from the LUPV. Fig 10B (example CRA 6 / RAO 26) shows the LAA ostium on its minor axis.
- **3-chamber, RAO 60 / CAU 45.** Matches the apical 3-ch, PLAX and ME long-axis echo views.
  - Shows the minor axes of both annuli.
  - **The aortic and mitral annuli are both in plane**, at the crossing of the two S-curves, so this is where the aorto-mitral angle is measured.
  - AML and PML are separated, but the scallops overlap.
  - The LVOT is elongated.
  - **The LAA ostium and the atrial septum are seen en face.** Fig 10C example: CAU 54 / RAO 82.
- **4-chamber, LAO 10 / CRA 60.** Matches the apical 4-ch and ME 4-ch echo views.
  - The septum is in plane, with full separation of the atria and of the ventricles.
  - The AV and MV nearly superimpose.
  - The leaflets and scallops overlap, and the papillary muscles overlap.
  - Fig 10D example: CRA 42 / LAO 5.
- **Impella and stiff wire:** the 3-chamber view lays both papillary muscles over the inferior LV, so you can steer away from them. Fig 11 [`_67`]; example CAU 54 / RAO 69 [big s11].

**Right heart / tricuspid** (Fig 13 [`_69`], Fig 14 [big s14], Fig 15 [big s15], Fig 50 [`_43`])
- **RH 1-chamber, LAO 55 / CAU 15.**
  - The TV is seen en face with all three leaflets apart.
  - The RCA and CS are both visible, and the septum is in plane.
  - The RVOT is severely foreshortened.
  - Fig 15A example: CAU 13 / LAO 62.
- **RH 2-chamber, RAO 60 / CAU 50.**
  - Separates the anterior and posterior TV leaflets.
  - The TV annulus is in plane together with the **CS**, the **IVC** and the RAA.
  - The **interatrial septum is seen en face**.
  - Fig 15B example: CAU 24 / RAO 39.
- **RH 3-chamber, RAO 25 / CRA 15.**
  - Separates the posterior and septal TV leaflets.
  - The TV is in plane together with the **PV** and with the **SVC**.
  - The RVOT is elongated, and the **CS ostium is seen en face**.
  - Fig 15C example: CRA 5 / RAO 18.
- **RH 4-chamber, LAO 5 / CRA 60.**
  - Separates the anterior and septal TV leaflets.
  - The septum and TV are in plane, and the RAA ostium is seen en face.
  - Fig 15D example: CRA 62 / LAO 0.
- **Tricuspid S-curve** [`_43`, Fig 50]: it runs through LAO CRA, shallow RAO CRA and RAO CAU. The en-face view lies at steep LAO with shallow CAU.

**Bicaval view** (Fig 16 [`_72`], Figs 40-41 [`_33`, `_34`])
- The SVC, IVC and septum are all in plane, and the TV is en face with its leaflets separated.
- The caption gives LAO 90 / CRA 10 (see caveat). The Fig 42 example on screen reads CAU 4 / LAO 47 [big s42].
- If the CT line is moved toward the TV, the view becomes a combined right- and left-heart 1-chamber view (LAO CAU), with both the TV and the MV en face. Fig 40
- During clip steering in this view [Fig 41]:
  - Moving superior points toward the septum, and moving inferior points toward the posteroseptal commissure.
  - Counter-clockwise rotation moves the device anterior, and clockwise moves it posterior.

**Coronary sinus** (Fig 17 [`_73`, big s17])
- The CS S-curve gives example views of 2C at RAO 30 / CAU 69 and 1C at LAO 54 / CAU 15.
- The en-face view of the CS ostium in the example is RAO 30 / CRA 24.
- The 1C view shows the CS ostium in plane and its course in short axis.

**RVOT and pulmonary artery** (Fig 18 [`_74`])
- The RVOT and PA appear elongated, separated by the PV annulus line. The caption gives the angle as LAO 90 / CRA 10 (suspect).

**Coronary angiography** (Figs 56-63 [`_49` to `_56`, big s45-52])
- **4-chamber (LAO CRA):**
  - The coronaries lie on two axes. The AV-groove (short) axis runs rightward and down; the RCA follows it around the TV.
  - The interventricular (long) axis runs leftward and down toward the apex; the LAD follows it.
  - An LV gram in this view shows the anterolateral, apical and anteroseptal walls.
  - Source: Fig 56 [`_49`]
- **1-chamber (LAO CAU, "spider"-type):** the RCA and LCx are elongated along the AV groove, while the PDA and LAD are foreshortened. Fig 57 [`_50`]
- **2-chamber (RAO CRA):** the LAD is fully elongated along the anterior wall, the LCx is foreshortened, and only the mid RCA is seen well. Fig 58 [`_51`]
- **3-chamber (RAO CAU):** the MV and AV are in plane. The LAD (anteroseptal) is clearly apart from the LCx (inferolateral), and the mid RCA is elongated. Fig 59 [`_52`]
- **Ostial and proximal LM:** cross the aortic-annulus S-curve with the ostial-LM S-curve to remove aortic-root parallax. Cross the ostial-LM curve with the proximal-LM curve (8 mm in) to remove parallax of the proximal LM. Fig 61 [`_54`]
- **Bifurcations:** the en-face plane of the bifurcation, defined by 3 points about 5 mm around the carina, is the best working view. Example LAD-D: RAO 45 / CRA 45. Fig 62 [`_55`, big s51]
- CT-derived example optimal angles from 100 patients (Fig 63 [`_56`, big s52]); population examples, not fixed rules:

  | Target | Angle |
  |---|---|
  | LM bifurcation | LAO 0 / CAU 49 |
  | Ostial RCA | LAO 79 / CRA 41 |
  | Cx-OM | LAO 24 / CRA 33 |
  | LAD-diagonal | LAO 11 / CRA 71 |
  | PDA-PLA | LAO 44 / CRA 34 |

- Coronary CT (CCTA) helps plan access, equipment and viewing angles, and can reduce contrast, radiation and errors. Fig 60 [`_53`]

## 2. Landmark and geometry rules

**Aortic root / TAVI**
- **Slope of the annulus S-curve** [Fig 21, `_11`]:
  - A steep slope means a vertical annulus, which goes with a horizontal aorta.
  - A shallow slope means a horizontal annulus, which goes with a vertical aorta.
  - A neutral slope is the most common.
- **Cusp positions along the annulus S-curve** [Fig 22, `_12`; Video 1, `_13`; big s22]. The three views within easy reach of the table are the R-L overlap, the 3-cusp coplanar and the R-N overlap. Approximate positions read from the example grid:

  | View | Approx. angle | Cusp appearance |
  |---|---|---|
  | R-L cusp overlap | about RAO 30 / CAU 25 | NCC lateralized to screen left |
  | 3-cusp coplanar | near AP | RCC cut anteriorly |
  | R-N cusp overlap | about LAO 25 / CRA 15 | LCC lateralized to screen right |
  | L-N cusp overlap | about LAO 80 / CRA 40 | RCC to screen left |
  | Other coplanar views | extreme RAO-CAU or LAO-CRA | LCC or NCC cut posteriorly |

- **Crossing the valve** [Fig 23, `_14`; big s23]:
  - Move along the S-curve until the calcium nodules separate in systole. In the example this happened at RAO/CAU, which was the R-L overlap.
  - Near AP, a calcified RCC sits in front of the orifice.
  - At LAO/CRA, the R-L commissural calcium did not separate.
- **R-L overlap compared with 3-cusp coplanar** [Fig 24, `_15`; big s24]:

  | Feature | R-L overlap | 3-cusp coplanar |
  |---|---|---|
  | Aortic arch | More closed | More open |
  | Annulus plane | More horizontal | More vertical |
  | Annulus axis shown | Minor axis (3-chamber-like) | Major axis (2-chamber-like) |
  | LVOT | Elongated | Foreshortened |

- **Double S-curve** [Fig 25, `_16`; Fig 26, `_17`; big s26]:
  - The annulus curve is crossed with the delivery-catheter curve, which is built from two parallax-free views. The tolerance is about 5%.
  - The crossing point usually falls in RAO-CAU.
  - A near R-L overlap view approximates the crossing point, with minimal tilt (under 5 deg in the figure).
  - Working further LAO separates the two curves, which tilts the valve and spoils the depth reading (about 25 deg tilt shown).
- **Commissural alignment** [Fig 27, `_18`; big s27]:
  - In the R-L overlap view, the RCC-LCC commissure points to screen right.
  - ACURATE neo2 and Navitor: one commissure post lateralized to the right, with the other two overlapping on the left.
  - Evolut FX: one "dot" marker on the right, with the other two overlapping on the left.
- **Exposing the coronary ostia** [Fig 28, `_19`; big s28]. There are two methods:
  - Method 1: put the RCA ostium at screen left or the LCA ostium at screen right, using a perpendicular view.
  - Method 2: use the crossing of the annulus and ostium S-curves.
  - Example RCA: LAO 61 / CRA 42 (near L-N overlap).
  - Example LCA: LAO 12 / CRA 12 (near R-N overlap).
- **BASILICA** [Fig 29, `_20`]:
  - A "side view" of the target leaflet checks catheter depth, orientation and wire traversal.
  - A "central view" centres the catheter on the leaflet.
  - Both views are found from cusp positions on the S-curve.
- **Aortic paravalvular leak** [Fig 30, `_21`; big s30]:
  - Use a view perpendicular to the leak origin, so the leak sits at the edge of the image.
  - For an NCC leak this is near R-L overlap; example RAO 46 / CAU 31.

**Atrial septum / transseptal**
- The septal S-curve crosses the RAO CRA, LAO CRA and LAO CAU quadrants. Fig 31 [`_22`]
- The septum is en face at RAO/CAU, which is the RH 2-chamber or LH 3-chamber view. Fig 32 [`_23`; big s32]
- Enlargement of the RA, LA or both re-orients the septum. A vertical septum gives a vertical curve, and a horizontal septum a horizontal curve. Fig 33 [`_24`]
- **Bicaval LAO-CAU view, best for reading septal orientation** [Fig 34, `_25`; big s34]:
  - With a vertical septum, the needle needs a wide curve and points left-to-right on screen.
  - With a horizontal septum, a smaller curve is enough and the needle points inferior-to-superior.
- The two TEE references for the puncture are the short-axis and bicaval views. Both have fluoro equivalents marked on the septal S-curve. Figs 35-36 [`_26`, `_27`]
- **Puncture for mitral procedures** [Fig 37, `_28`; example CRA 44 / RAO 68, big s37]: in the short-axis view of the AV, a posterior puncture (away from the aorta) sits higher above the mitral plane than an anterior one.
- **Height depends on the short-axis cut** [Fig 38, `_29`]: a short-axis cut near the annulus gives a shallower puncture than a cut near the STJ.
- **Puncture for LAAO** [Fig 39, `_30`; example CRA 38 / RAO 84, big s39]: the LAA is anterior to the septum, so a posterior puncture gives a more coaxial, central approach to the ostium.
- **Videos 2-3** [`_31`, `_32`]:
  - Two punctures that both look "superior" on bicaval can differ in height above the MV. The anterior one sits low and the posterior one high, which is judged from short-axis (RAO-CRA) and 4-ch (LAO-CRA) views.
  - Superior and inferior punctures on bicaval can end up at the same height in the 4-ch view.
- **Mitral TEER, superior-inferior axis** [Figs 42-43, `_35`, `_36`]:
  - On bicaval, the lateral commissure is superior and the medial commissure inferior. A1-P1, A2-P2 and A3-P3 are stacked from top to bottom.
  - An SVC-side (high) puncture lands near the right trigone and A2, which makes steering over the valve easier.
  - An IVC-side (low) puncture lands near the medial commissure, which helps reach the lateral commissure but makes work over the valve harder.

**Mitral**
- **Double S-curve for the mitral valve** [Fig 46, `_39`; big s39 shows CRA 38 / RAO 84]:
  - The crossing of the MV and AV curves is RAO CAU, where both are in plane. Use it for the aorto-mitral angle, which helps predict LVOT obstruction in TMVR.
  - The crossing of the septum and MV curves is a 4-chamber view. This is the best "pathway" view from the septum to the valve.
- **Clip steering across 1-, 2- and 3-chamber views** [Fig 47, `_40`]:
  - In the 1-chamber view: superior is up, anterior is left-superior, and posterior is right-inferior.
  - Rotation (CW/CCW) and push/pull map onto the AML (A1-A3) and PML (P1-P3).
- **TMVR step-by-step** [Fig 48, `_41`]:
  - Looping the wire around the annulus needs the 1-, 2- and 3-chamber views together.
  - The ring is best judged in the 1-chamber view.
  - Crossing from the septum and implanting the valve are best seen in the 4-chamber view.
- **Mitral paravalvular leak** [Fig 49, `_42`]: label the leak on the CT short-axis view, then pick the view perpendicular to it. A P2 leak was closed in a 3-chamber view.

**Tricuspid**
- **Clip steering across 1-, 3- and 4-chamber views** [Fig 51, `_44`]: in the 1-chamber view, anterior is left and posterior is right.
- **Patient-to-patient variation** [Figs 52-53, `_45`, `_46`]: how coaxial the IVC is with the TA, and how far the IVC is from the TA, both vary widely. The distance is judged in a near-3-chamber view (RAO with slight CAU).
- **Clip arm in the 1-chamber LAO CAU view** [Fig 54, `_47`]: for a septal-anterior grasp, the arm usually lies between 4 and 10 o'clock.
- **Tricuspid valve-in-valve** [Fig 55, `_48`]: the 3-chamber view puts the SVC, TA and PV in plane, so neither the wire nor the valve is foreshortened. The 1-, 2- and 4-chamber views foreshorten.

**Landmarks the request asked about that are NOT in these captions**
- No caption gives spine or heart-shadow rules.
- No caption describes a CS catheter or a pigtail in the NCC as a landmark.
- Do not attribute any of these to this chapter.

## 3. Procedure angle summary (from the deck)

| Procedure / target | View | Angle | Source |
|---|---|---|---|
| TAVI implant, self-expanding | Near R-L cusp overlap (double-S crossing) | RAO-CAU quadrant, about RAO 30 / CAU 25 on the example grid | Figs 22, 26 [`_12`, `_17`] |
| TAVI reference | 3-cusp coplanar | Near AP in the example | Fig 22 |
| RCA ostium (TAVI / redo access) | Near L-N overlap | LAO 61 / CRA 42 (example) | Fig 28 [big s28] |
| LCA ostium | Near R-N overlap | LAO 12 / CRA 12 (example) | Fig 28 |
| Aortic paravalvular leak at the NCC | Near R-L overlap | RAO 46 / CAU 31 (example) | Fig 30 [big s30] |
| Transseptal, septal orientation | Bicaval LAO-CAU | Example CAU 4 / LAO 47; caption says LAO 90 / CRA 10 | Figs 16, 34, 42 |
| Transseptal, anterior vs posterior | AV short-axis (RAO-CRA) | Example CRA 44 / RAO 68 | Fig 37 [big s37] |
| Septum en face | RH 2-ch / LH 3-ch | RAO 60 / CAU 45-50 | Figs 6, 32 |
| LAAO puncture planning | RAO-CRA | Example CRA 38 / RAO 84 | Fig 39 [big s39] |
| LAA ostium en face | LH 3-chamber | RAO 60 / CAU 45 (example CAU 54 / RAO 82) | Figs 9, 10 |
| LAA ostium major axis | LH 1-chamber | LAO 50 / CAU 20 | Fig 10A |
| Mitral TEER, scallop separation | LH 2-chamber | RAO 30 / CRA 15 | Table 2 |
| Mitral TEER, A-P separation | LH 3-chamber | RAO 60 / CAU 45 | Table 2 |
| Mitral annuloplasty | 1-chamber; RH 2-ch for CS engagement | LAO 50 / CAU 20; RAO 60 / CAU 50 | Table 2 |
| Mitral valve implantation | 2-, 3- and 4-chamber | LAO 10 / CRA 60 for the 4-ch | Table 2, Fig 48 |
| Tricuspid TEER | RH 2-ch (A-P), RH 3-ch (P-S), 4-ch (A-S), 1-ch LAO CAU en face | See the table in section 1 | Table 2, Fig 54 |
| Tricuspid valve-in-valve | RH 3-chamber | RAO 25 / CRA 15 | Fig 55, Table 2 |
| CS cannulation | 1C / 2C | LAO 54 / CAU 15; RAO 30 / CAU 69 (example) | Fig 17 |
| PFO / ASD closure | None | No PFO/ASD-specific angles in the captions | |

## 4. Teaching statements for the app (TR / EN)

1. **[Angiography]** [Fig 57, `_50`]
   - TR: LAO kaudal (tek odacık, "spider") görüntüde RCA ve Cx AV oluk boyunca uzun görünür; LAD ve PDA kısalır.
   - EN: In LAO caudal (1-chamber, "spider") the RCA and LCx are elongated along the AV groove, while the LAD and PDA are foreshortened.
2. **[Angiography]** [Fig 58, `_51`]
   - TR: RAO kranial (iki odacık) LAD'yi ön duvar boyunca tam uzunlukta gösterir; Cx kısalır.
   - EN: RAO cranial (2-chamber) lays out the whole LAD along the anterior wall; the LCx is foreshortened.
3. **[Angiography]** [Fig 59, `_52`]
   - TR: RAO kaudal (üç odacık) LAD ile Cx'i birbirinden ayırır; mitral ve aort kapak aynı düzlemdedir.
   - EN: RAO caudal (3-chamber) separates the LAD from the LCx, with the mitral and aortic valves in plane.
4. **[Angiography]** [Fig 56, `_49`]
   - TR: LAO kranial (dört odacık) görüntüde RCA AV ekseni, LAD interventriküler ekseni izler.
   - EN: In LAO cranial (4-chamber) the RCA follows the AV axis and the LAD follows the interventricular axis toward the apex.
5. **[Aortic root/TAVI]** [Figs 22, 26, `_12`, `_17`]
   - TR: R-L kusp örtüşme görüntüsü (RAO-kaudal) NCC'yi sola ayırır ve kendiliğinden açılan kapakta paralaksı en aza indirir.
   - EN: The R-L cusp overlap view (RAO-caudal) isolates the NCC on screen left and minimises THV parallax for self-expanding valves.
6. **[Aortic root/TAVI]** [Fig 24, `_15`]
   - TR: Üç kusp koplanar görüntü anulusun büyük eksenini gösterir ve LVOT'u kısaltır; R-L örtüşme küçük ekseni gösterir ve LVOT'u uzatır.
   - EN: The 3-cusp coplanar view shows the annulus major axis and foreshortens the LVOT; the R-L overlap shows the minor axis and elongates it.
7. **[Aortic root/TAVI]** [Table 1, big s53; Fig 20, `_76`]
   - TR: İki S-eğrisinin kesiştiği C-kol açısında her iki yapı da aynı düzlemde görülür.
   - EN: At the C-arm angle where two S-curves cross, both structures are in plane at once.
8. **[Transseptal]** [Figs 32, 34, `_23`, `_25`]
   - TR: Bikaval LAO-kaudal görüntü septum yönünü gösterir; septum RAO-kaudalda (RH iki / LH üç odacık) karşıdan görülür.
   - EN: The bicaval LAO-caudal view reveals septal orientation; the septum is seen en face in RAO-caudal (RH 2-ch / LH 3-ch).
9. **[Transseptal / mitral]** [Figs 37, 43, `_28`, `_36`]
   - TR: Mitral işlemde aorta göre posterior ve SVC'ye yakın ponksiyon mitral düzlemin üzerinde daha yüksek kalır.
   - EN: For mitral work, a puncture that is posterior (away from the aorta) and toward the SVC sits higher above the mitral plane.
10. **[LAA]** [Figs 39, 10, `_30`; big s10]
    - TR: LAA septumun önündedir; posterior ponksiyon LAA ağzına daha eş eksenli yaklaşım sağlar. LAA ağzı RAO-kaudal üç odacıkta karşıdan görülür.
    - EN: The LAA lies anterior to the septum, so a posterior puncture gives a more coaxial approach. The LAA ostium is en face in the RAO-caudal 3-chamber view.
11. **[Mitral]** [Fig 46, `_39`; Fig 48, `_41`]
    - TR: Dört odacık (LAO kranial) septumdan mitrale giden yolu en iyi gösterir; halka yerleşimi tek odacıkta değerlendirilir.
    - EN: The 4-chamber view (LAO cranial) best shows the path from septum to mitral valve; ring placement is judged in the 1-chamber view.
12. **[Pacemaker / CS]** [Fig 17, `_73`; Fig 15, big s15]
    - TR: CS ağzı RH üç odacıkta (RAO kranial) karşıdan görülür; LAO kaudal tek odacık CS seyrini kısa eksende gösterir.
    - EN: The CS ostium is en face in the RH 3-chamber view (RAO cranial); the LAO caudal 1-chamber view shows the CS course in short axis.
