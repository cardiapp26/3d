# Da Vinci ECG anatomy: source and implementation map

Updated: 2026-10-17. Scope: spatial ECG teaching workbench, not clinical prediction.

## Input

User-supplied **12-Lead Electrocardiographic Anatomy.pdf**, Bradfield EP, Rimmer M,
Miyazaki Y, Hanna P, Hayase JH, Do DH, Xu S, Yamagami S, Shivkumar K, Mori S.
JACC: Case Reports, 2025, article 105998.
DOI: https://doi.org/10.1016/j.jaccas.2025.105998

- PDF: 14 pages, article-in-press version supplied by the user.
- SHA-256: `797e38e50835118e8672215782422c0195a7f76fb8cc87c0e9ff72c06bbe4787`.
- Read locally with installed PyMuPDF (`python3`, Python 3.10.7); each page's text
  extracted, each page rendered at 0.8 scale for inspection.
- Source figures/photos were inspected, not redistributed in this application.
- DOI browsing returned an access error; factual verification used the supplied
  full PDF and its figure captions, not an inferred publisher abstract.

## Figure-to-interaction map

| PDF page / figure | Teaching point | Interaction |
| --- | --- | --- |
| 2 / 1 | Limb leads provide frontal, not sagittal, spatial information | Frontal lead directions around rotatable atlas |
| 3 / 2 | Linked RVOT changes across I, II, III, aVR, aVL | RVOT slider and saved A vs current B traces |
| 4–5 / 3–4 | Precordial locations and three distinct heights | V1/V2, V3, V4–V6 plane selection |
| 6 / 5 | Summit versus inferoseptal-process arrhythmias | Separate sites with S-dominant V1/V2 versus R concordance |
| 7 / 6 | Fixed electrodes, variable heart–thorax relation | Heart translation relative to fixed schematic electrodes |
| 8–9 / 7–8 | Attitudinal names, papillary sites and branch alignment | Source-specific labels and distinct papillary / bundle examples |
| 10 / 9 | Atrial-mass context, PV comparisons, appendage polarities | Six selectable atrial sites and II/V1/aVL P curves |
| 11–12 / 10–11 | Cabrera sequence and exact aVR inversion | Consecutive six-row display, standard toggle, source scenarios |
| 13 / 12 | Physical/digital models aid spatial understanding | Existing project atlas rendered in Three.js |

## Model boundary

The heart mesh is the existing **local project atlas**, not the article's CT/STL.
Its identity remains documented in `src/atlas.js` and `ASSET_PROVENANCE.json`.
The standard project normalization is reused: bake node world transforms, center
on chamber bounds, apply one common scale of 3.3 / maximum chamber dimension.
No dependency or atlas asset was changed.

Electrode, focus and plane annotations are original schematic coordinates, not
measured or validated registrations from the paper. PV marker centers follow
local atlas vessel bounds. Other intracardiac points are schematic landmarks.

`davinci-model.js` encodes source-described qualitative relationships. Illustrative
angles and waveform heights/widths are not extracted patient measurements. No
mV/ms calibration or patient-specific localization claim is made. The height
slider changes geometry only; the selected source-example traces remain fixed,
as stated beside that control. The RBBB/LBBB drawings illustrate terminal direction,
not full diagnostic morphology criteria.

The previous conflation of inferoseptal process with inferomedial papillary muscle
was removed: Figure 5D describes precordial R concordance for the former; Figure 8C
describes initial Q in V3–V6 for the latter. RVOT slider direction now agrees with
all five linked Figure 2 changes. Q-first patterns, exact vertical aVR inversion
and terminal bundle forces have explicit regression checks.

The ICNS lesson is retained as a separate source section (Aksu et al., 2021); it is
not attributed to this 2025 paper and was not revalidated in this source review.

## Reproduction and checks

Use the repository's locked Node/Three.js/Vite environment (`npm ci`).

```sh
npm run check
npm test
npm run build
npm run dev -- --port 5192
APP_URL=http://127.0.0.1:5192 npm run test:davinci-browser
APP_URL=http://127.0.0.1:5192 npm run test:ecg-lessons-browser
APP_URL=http://127.0.0.1:5192 node scripts/test-ecg-labs-browser.cjs
```

`test:davinci` checks source-described sign/trend relations and waveform inversion;
these tests do not establish clinical accuracy. Browser checks cover real atlas
loading and rotation, comparisons, selections, focus, language state and overflow.
Independent agent reviews compare scientific claims to PDF captions and inspect
code separately; both remain model-based reviews, not human clinical validation.
