# ASD and VSD teaching module provenance

Date: 2026-09-27. Authority: execute for the assigned content artifacts. Purpose: compare typical anatomical sites of five interatrial communication categories and four ventricular communication categories. This is a qualitative educational schematic, not a patient study, diagnostic model or physiological simulation. Hypothesis testing, sample size, effect estimates and uncertainty intervals are not applicable.

## Inputs and method

Local input: `public/models/cardiovascular.glb`, identity declared in `src/atlas.js` as `ATLAS_SHA256 = 05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757`. The model represents intact anatomy. Named chambers, caval veins, coronary sinus and valves provide anatomical context. No congenital defect is segmented in this input.

Data flow: published morphology and classification -> concise Turkish/English descriptions in `src/septal-defects-data.js` -> illustrative site overlays on intact atlas. The publications establish anatomical relationships, not coordinates in this atlas. Any numeric overlay positions are authored schematic placement parameters; they are not measured defect locations. Do not infer a real opening, patient anatomy, ostial dimensions, rim adequacy, valve abnormalities or anomalous venous pathways from them.

## Source-to-site mapping

- Secundum: oval fossa, within true atrial septum.
- Primum: inferior atrial communication by the AV junction. AVSD with a common AV junction, not simply a low secundum opening. Its abnormal valve/junction morphology is not reconstructed.
- Superior and inferior sinus venosus: caval-atrial junctions outside the true septum; anomalous pulmonary venous connections can accompany them and are described, not reconstructed.
- Coronary sinus: communication between LA and the coronary sinus channel in the unroofed variant, not an oval fossa opening. The coronary sinus provides the route toward RA.
- Central perimembranous VSD: membranous region, usually beside aortic-tricuspid fibrous continuity.
- Trabecular muscular VSD: representative muscular septal site, not a map of all possible openings.
- Inlet VSD: ventricular inlet near AV valves; muscular/perimembranous borders are possible.
- Outlet VSD: RV outflow region; includes muscular, perimembranous and doubly committed juxta-arterial variants.

These are broad teaching categories. Geography and border classification overlap, particularly for inlet/outlet VSD. Shared AV junction defects belong to the AVSD category. PFO is not presented as a tissue-deficiency ASD. Shunt direction is conditional, not fixed; the view does not calculate pressures, vascular resistance or flows.

## Sources and access

1. Naqvi N, McCarthy KP, Ho SY. [Anatomy of the atrial septum and interatrial communications](https://pmc.ncbi.nlm.nih.gov/articles/PMC6174145/). J Thorac Dis. 2018;10(Suppl 24):S2837–S2847. DOI: [10.21037/jtd.2018.02.18](https://doi.org/10.21037/jtd.2018.02.18). Morphology and named atrial communication sites, especially Figures 7–8 and corresponding sections.
2. Lopez L et al. [Classification of Ventricular Septal Defects for the Eleventh Iteration of the International Classification of Diseases—Striving for Consensus](https://ipccc.net/wp-content/uploads/2024/01/2018-11-ANNALS-Lopez-2018-VSD-Classification.pdf). Ann Thorac Surg. 2018;106:1578–1589. DOI: [10.1016/j.athoracsur.2018.06.020](https://doi.org/10.1016/j.athoracsur.2018.06.020). Table 1 and anatomical classification sections underpin VSD categories and limits.
3. Fusco F et al. [Imaging of ventricular septal defect: Native and post-repair](https://pmc.ncbi.nlm.nih.gov/articles/PMC11658130/). Int J Cardiol Congenit Heart Dis. 2022;7:100335. DOI: [10.1016/j.ijcchd.2022.100335](https://doi.org/10.1016/j.ijcchd.2022.100335). Classification and conditional shunt direction cross-check.

Accessed 2026-09-27. Direct PMC opens returned a browser-check page; indexed passages from those exact PMC articles were available through web search. IPCCC PDF opened successfully. No publication figures or source prose were copied into the module. Content is newly written paraphrase; source links retain attribution. No patient data used.

## Verification and limits

`node --check src/septal-defects-data.js`: exit 0. Content contract: nine unique IDs, five ASD and four VSD, bilingual strings and per-entry source URL. The atlas identity above is taken exactly from the existing source declaration; independent GLB hashing belongs to the integration verification.

Medical text was checked against the cited source passages by its author. This is not independent clinical validation. Source-supported relationships do not validate numeric overlay registration. Inspect orientation, landmark proximity and all nine selections visually before release; retain the visible schematic qualification. No claim of surgical planning suitability or full congenital morphology reconstruction is made.

Integration verified 2026-09-28: syntax suite, complete unit suite and production build passed. Real-atlas Chrome test verifies nine finite distinct sites, all type selections, deep-link reload, exit cleanup and mobile overflow. ASD/VSD screenshots inspected. Numeric landmark registration remains illustrative, not clinical validation.

Existing browser regression suite also passed all seven priority requirements. Vite logged ResizeObserver loop notifications during that suite; the new defect-specific test recorded no page errors.
