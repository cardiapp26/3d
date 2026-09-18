# Current geometry revision (15 September 2026)

Active geometry is the existing local `public/models/cardiovascular.glb`, with shared source coordinates for chambers and vasculature. Its upstream provenance and license are unverified; no HuBMAP or Z-Anatomy attribution is asserted. See [coronary correction audit](research/CORONARY_FIX.md). Source checks and browser registration tests do not establish clinical validity. Wall controls are derived geometric viewing cuts, not segmented anatomical or histological layers.

Coronary descriptions now also cite [University of Minnesota coronary anatomy](https://www.vhlab.umn.edu/atlas/coronary-system-tutorial/coronary-arterial-anatomy.shtml), [Joshi et al. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2815286/) and [Nasr & El Tahlawi 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6172585/). The supplied mini atlas PDF p. 7 was visually inspected during reassessment. Earlier text-only inspection notes below are retained as history, not current geometry claims.

---

## Historical initial-prototype notes (superseded geometry)

# Source notes and model limits

The source folder was read locally. No PDF pages, illustrations, or book files are bundled in the application. Descriptions are original concise paraphrases. Page numbers below are **1-based PDF file pages**, not printed journal pagination. Text was extracted with `pdftotext -layout`; figure captions were read, but figures were not used to reconstruct or validate the mesh.

## Inspected local PDFs

Source directory: `/Users/yh/Library/CloudStorage/OneDrive-Personal/eps için kaynak makale ve kitaplar/anatomy for electrophysiologist`

- **2003 Ho - Anatomy of the AVN & AV conduction system.pdf**: PDF pp. 1, 3–5, 8. Specialized myocytes; Koch’s triangle boundaries; compact AV node; penetrating bundle and central fibrous body; right and left bundle courses; microscopic architecture. PDF p. 3 corresponds to printed p. 3667.
- **The inferior right atrial isthmus (2005)**: PDF pp. 1–6, especially pp. 2–3 for the isthmus boundaries, sectors and anatomical variation, and pp. 4–5 for nearby arterial anatomy. Specimen findings are not translated into patient-specific dimensions or energy recommendations.
- **Anatomy for right ventricular lead implantation.pdf**: PDF pp. 1–7, especially p. 2 for inlet/outlet/apex, septomarginal trabeculation, moderator band, tricuspid apparatus and thin apical wall. The application does not adopt a preferred clinical pacing site from this review.
- **Coronary sinus and cardiac venous anatomy for cardiac resynchronization   therapy- A Clinician's view.pdf**: PDF pp. 3–5. CS course, ostium, valves and venous variation. Clinical technical instructions are not reproduced.
- **2012 Ho - Left Atrial Anatomy Revisited.pdf**: PDF pp. 2–9, especially pp. 2–3 for posterior LA position, surrounding anatomy and pulmonary vein sleeves; p. 6 for muscle arrangement; p. 7 for mitral vestibule/isthmus; pp. 8–9 for extracardiac neighbors. PDF p. 2 is printed p. 220. DOI: [10.1161/CIRCEP.111.962720](https://doi.org/10.1161/CIRCEP.111.962720).
- **Kardiyak Anatomi Mini Atlası**: PDF pp. 5–10, 12–20, 37–39: contents and extracted textual headings/captions for gross structure, fluoroscopic correlation, right atrial landmarks, sinus nodal region, caval sleeves, CTI, Koch’s triangle and mitral–aortic continuity. This is a figure-heavy atlas; extraction does not amount to visual inspection of its anatomical plates. No shape fidelity is claimed.

## Official web reference

[American Heart Association: Coronary Angiogram](https://www.heart.org/en/health-topics/heart-attack/diagnosing-a-heart-attack/coronary-angiogram), consulted 12 September 2026. Supports the basic concept of X-ray coronary imaging with contrast. It does not validate the application’s rendering, camera presets or coronary geometry. LAD and circumflex centerlines are general anatomical schematic elements, not segmented vessels from these PDFs.

## Educational scope

- Original, idealized geometry, not patient CT/MRI segmentation, photogrammetry, a licensed anatomical mesh, or a measured reconstruction of a book figure.
- Chamber size, position, wall thickness, coronary branching and conduction overlays are schematic. No metric anatomical accuracy is established.
- Microstructure is a conceptual enlarged diagram, not histology. No specimen scale, measured fiber orientations, cellular electrophysiology or tissue mechanics.
- Blood/contrast effects are animations, not fluid dynamics, X-ray attenuation or angiographic image formation. Viewing presets are not calibrated C-arm geometry.
- Catheter and lead routes are visual aids. No contact forces, torque, collision validation, electrograms, pacing measurements, lesion model, radiation model, perforation model or skill assessment.
- CTI, Koch’s triangle and pulmonary vein regions represent distinct anatomical concepts. The application does not prescribe targets or procedural parameters.
- This prototype is not a validated clinical simulator, procedural certification tool, diagnostic device or patient-specific planning system. Real procedural decisions require qualified supervision and current clinical standards.

## Verification

`node --check src/content.js` passed after content creation. Anatomical statements were checked against the extracted passages listed above. Geometry and clinical training validity require independent expert review. No scite tool was used; this task was source-grounded content creation, not a citation support audit.

## Bachmann bundle teaching module

- User-supplied anatomical and AP/LAO 40° fluoroscopy screenshots (2026-09-18): distinction between RAA anterior orientation and high right atrial region pacing; broad atrial roof band.
- [Alternative atrial pacing site to improve cardiac function: focus on Bachmann’s bundle pacing](https://academic.oup.com/eurheartjsupp/article/25/Supplement_G/G44/7394338), European Heart Journal Supplements (2023).
- [Fundamental Anatomy and Its Impact on Clinical Practice: The Rightward Extension of Bachmann's Bundle (Part II-III)](https://www.jacc.org/doi/10.1016/j.jaccas.2026.108795), JACC: Case Reports (2026).

The band uses the existing RA/LA atlas geometry as spatial context, not a segmented bundle. Its right-sided pacing endpoint has a small illustrative inward offset from the band anchor, not a millimetre measurement or an inferred wall layer. Lead trajectory is schematic. AP/LAO orientation does not prove conduction capture; ECG and intracardiac electrograms remain separate evidence. No simulated thresholds, capture results or outcome benefits are assigned. Source discovery used publisher search excerpts and supplied captions; full-text publisher fetches were blocked (403/redirect).
