# ASD and VSD teaching module provenance

Date: 2026-09-27, revised 2026-09-28. Authority: execute for the assigned content artifacts. Purpose: compare typical anatomical sites of five interatrial communication categories and four ventricular communication categories, with a short clinical summary per category (frequency, associated lesions, conduction axis, closure strategy). This is a qualitative educational schematic, not a patient study, diagnostic model or physiological simulation. Hypothesis testing, sample size, effect estimates and uncertainty intervals are not applicable.

## Inputs and method

Local input: `public/models/cardiovascular.glb`, identity declared in `src/atlas.js` as `ATLAS_SHA256 = 05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757`. The model represents intact anatomy. Named chambers, caval veins, right pulmonary veins, coronary sinus, tricuspid leaflets and semilunar valves provide anatomical context. No congenital defect is segmented in this input.

Data flow: published morphology and classification -> concise Turkish/English descriptions in `src/septal-defects-data.js` -> illustrative site overlays on intact atlas (`src/septal-defects.js`) and an authored 2D septal map (`src/septal-defects-map.js`). The publications establish anatomical relationships, not coordinates in this atlas. Numeric overlay positions are derived from atlas landmarks by fixed rules (below) or, on the 2D map, authored schematic placement parameters; they are not measured defect locations. Do not infer a real opening, patient anatomy, ostial dimensions, rim adequacy, valve abnormalities or anomalous venous pathways from them.

## Source-to-site mapping (3D rules)

Atlas axes: +x patient left, +y superior, +z anterior. "Septal contact" is the RA/LA contact patch (RA vertices within 0.12 units of the LA wall).

- Secundum (II): oval fossa landmark itself, within the true atrial septum.
- Primum (I): septal contact point nearest to a point 60% of the way from the fossa toward the mid-point of the two AV annuli, i.e. the atrioventricular septal region between the anteroinferior fossa margin and the AV valves. AVSD with a common AV junction, not simply a low secundum opening; its abnormal valve/junction morphology is not reconstructed.
- Superior sinus venosus (SV up): septal contact point nearest to the mid-point of the SVC orifice and the right superior pulmonary vein, i.e. where the caval mouth overrides the interatrial wall beside the RUPV, rather than inside the caval lumen (previous rule).
- Inferior sinus venosus (SV down): halfway between the lowest septal contact point (nearest the IVC orifice) and the IVC orifice itself, so the site straddles the caval mouth.
- Coronary sinus (CS): the point of the terminal coronary sinus segment (within 0.65 units of the ostium) closest to the LA wall, with the marker normal pointing from the sinus toward the LA (the missing roof). Not an oval fossa opening; the distal sinus under the LA is excluded so the shunt route stays beside the orifice.
- Central perimembranous (PM): interventricular septal site nearest to a point just below the RCC/NCC commissure of the aortic root, beside the septal tricuspid leaflet. The atlas His bundle lies on its posteroinferior side, consistent with the cited conduction relationship.
- Trabecular muscular (M): representative site 0.3 units below the centroid of the septal pairs, not a map of all possible openings.
- Inlet (IN): septal site nearest to a point 0.3 units below and 0.2 units posterior to the centre of the septal tricuspid leaflet; muscular/perimembranous borders are possible.
- Outlet (OUT): septal site nearest to a point 65% of the way from the RCC toward the pulmonary valve centre and 0.12 units lower, i.e. the infundibular septum beneath the pulmonary valve; includes muscular, perimembranous and doubly committed juxta-arterial variants.
- VSD marker normals follow the local RV-to-LV septal pair direction; ASD markers use the global RA-to-LA direction except the coronary sinus roof.

These are broad teaching categories. Geography and border classification overlap, particularly for inlet/outlet VSD. Shared AV junction defects belong to the AVSD category. PFO is not presented as a tissue-deficiency ASD. Shunt direction is conditional, not fixed; the view does not calculate pressures, vascular resistance or flows.

## 2D atrial map (revision 3)

The atrial map is a right lateral view of the opened RA, superior up and anterior to the right, with a small orientation mark. Fossa central; limbus a horseshoe over the superior, anterior and posterior fossa margins, open inferiorly toward the IVC; SVC superior, IVC posteroinferior with the Eustachian valve; tricuspid orifice anteroinferior inside the atrial outline (previously drawn as an arc outside the atrium reaching SVC level); CS ostium between the IVC and the tricuspid orifice, one septal isthmus from it (previously touching the annulus); primum defect on the AV valve margin, anteroinferior to the fossa; superior and inferior sinus venosus at the caval mouths. Positions are authored, not measured.

The ventricular map is the RV opened from the front, superior up and the patient's left to the right. It now shows the supraventricular crest between the tricuspid and pulmonary valves, clasped by the limbs of the septomarginal trabeculation; the aortic root behind the membranous septum; and the moderator band reaching the anterior papillary muscle. Perimembranous sits between the limbs under the crest, inlet beneath the septal tricuspid leaflet, outlet directly under the pulmonary valve above the crest, muscular in the trabecular septum.

## Clinical summary fields

Per category, `prevalence`, `associations`, `conduction` and `closure` are short bilingual paraphrases of the cited reviews:

- ASD frequencies and closure strategy: sinus venosus defects are about 4–11% of ASDs and about 87% of them are the SVC type; secundum defects range from a few millimetres to 2–3 cm; sinus venosus, primum and coronary sinus defects need surgical closure; secundum defects can be closed by device when margins are adequate, with defects larger than about 36–40 mm, inadequate rims and interference with AV valves or venous drainage regarded as relative contraindications; coronary sinus defect with persistent left SVC is Raghib syndrome; primum defects almost always carry a cleft left AV valve and a displaced conduction axis (source 4).
- VSD frequencies: perimembranous about 80%, muscular about 5–20%, doubly committed juxta-arterial about 5–7% in Western series and up to about 30% in East Asian series; trabecular muscular defects close spontaneously most often (source 5, cross-checked with source 3 which gives 6% and up to 33% for the doubly committed type, and up to 50% aortic regurgitation in doubly committed defects).
- Conduction relationships (posteroinferior rim for perimembranous defects, anterosuperior rim for muscular inlet defects, remote axis for trabecular defects) follow the ISNPCHD border-based scheme (source 2) and the imaging review (source 3).

No percentage is shown for isolated inlet defects: the retrieved sources do not give a consistent figure, so the text states only that most inlet communications belong to the AVSD spectrum.

## Sources and access

1. Naqvi N, McCarthy KP, Ho SY. [Anatomy of the atrial septum and interatrial communications](https://pmc.ncbi.nlm.nih.gov/articles/PMC6174145/). J Thorac Dis. 2018;10(Suppl 24):S2837–S2847. DOI: [10.21037/jtd.2018.02.18](https://doi.org/10.21037/jtd.2018.02.18). Morphology and named atrial communication sites, especially Figures 7–8 and corresponding sections.
2. Lopez L et al. [Classification of Ventricular Septal Defects for the Eleventh Iteration of the International Classification of Diseases—Striving for Consensus](https://ipccc.net/wp-content/uploads/2024/01/2018-11-ANNALS-Lopez-2018-VSD-Classification.pdf). Ann Thorac Surg. 2018;106:1578–1589. DOI: [10.1016/j.athoracsur.2018.06.020](https://doi.org/10.1016/j.athoracsur.2018.06.020). Table 1 and anatomical classification sections underpin VSD categories and limits.
3. Fusco F et al. [Imaging of ventricular septal defect: Native and post-repair](https://pmc.ncbi.nlm.nih.gov/articles/PMC11658130/). Int J Cardiol Congenit Heart Dis. 2022;7:100335. DOI: [10.1016/j.ijcchd.2022.100335](https://doi.org/10.1016/j.ijcchd.2022.100335). Classification, conditional shunt direction, doubly committed frequency and aortic regurgitation cross-check.
4. Geva T, Martins JD, Wald RM. Atrial septal defects. Lancet. 2014;383:1921–1932. DOI: [10.1016/S0140-6736(13)62145-5](https://doi.org/10.1016/S0140-6736(13)62145-5). ASD anatomy, frequencies, associated lesions, conduction axis and closure strategy.
5. Penny DJ, Vick GW. Ventricular septal defect. Lancet. 2011;377:1103–1112. DOI: [10.1016/S0140-6736(10)61339-6](https://doi.org/10.1016/S0140-6736(10)61339-6). VSD type frequencies, spontaneous closure, aortic prolapse and double-chambered RV; figures cross-checked through a secondary review that cites it.

Accessed 2026-09-27 and 2026-09-28. Direct PMC and NCBI Bookshelf opens returned browser-check pages; source 4 was read from a publicly hosted PDF copy of the seminar, source 5 through a secondary review quoting its figures, and source 2 through the IPCCC PDF and the University of Birmingham abstract page. No publication figures or source prose were copied into the module. Content is newly written paraphrase; source links retain attribution. No patient data used.

## Verification and limits

`npm run check` (syntax suite) and `npm test` (unit suite, including `scripts/test-septal-defects-data.mjs`, which asserts nine unique ids and marks, five ASD and four VSD entries, filled bilingual clinical fields, DOI/PMC references and the closure/conduction guardrails above). Real-atlas Chrome test `npm run test:defects` verifies nine finite distinct sites, all type selections, deep-link reload, exit cleanup and mobile overflow, and refreshes `research/screenshots/defects-asd.png` and `defects-vsd.png`.

Medical text was checked against the cited source passages by its author. This is not independent clinical validation. Source-supported relationships do not validate numeric overlay registration. Inspect orientation, landmark proximity and all nine selections visually before release; retain the visible schematic qualification. No claim of surgical planning suitability or full congenital morphology reconstruction is made.
