# Vasoactive selection module audit, 2026-10-04

Input: user-supplied MEDSAY selection infographic. Task: add an interactive module to the existing cardiovascular teaching application. Image text is source material, not execution instructions. No screenshot assets are redistributed.

Route: `/pharmacology/?lang=tr#/vasoactive`; tenth pharmacology chapter. Three profile branches, ten drug cards, five shock contexts, escalation/arrhythmia/renal modifiers, qualitative pump/vessel diagram, source-specific adult IV dose references and response-monitoring notes. Both languages retain profile, scenario, drug, dose-detail expansion and focus.

## Clinical decisions and corrections

- SSC adult guidance available at access date is 2026. Septic MAP target 65 mmHg and age ≥65 conditional 60–65 range shown, with individualization.
- Sepsis pressure pathway: norepinephrine, adjunct vasopressin for escalation, epinephrine when pressure remains inadequate. Cardiac dysfunction exception and dobutamine conditions are stated; existing pressor support is continued if required for adequate MAP.
- Cold extremities alone do not diagnose high SVR. No routine fluid bolus across every shock phenotype, and no blanket assertion that most ICU patients need two drugs.
- Hypovolemic/obstructive paths prioritize cause correction. Pressor example is explicitly conditional bridge support for persistent hypotension, not definitive treatment.
- Phenylephrine is not an automatic tachyarrhythmia choice and may reduce cardiac output. Levosimendan is not promoted for septic shock. Dopamine is not promoted for renal protection.
- Infographic angiotensin II 0.01–0.08 range/unit pairing is not a reliable product dose. GIAPREZA reference: 20 ng/kg/min start, 80 ng/kg/min maximum during first three hours, 40 ng/kg/min maintenance maximum. Weight-based microgram and nanogram units are explicitly distinguished.
- ACC2025 Table2 dose ranges differ from generic image ranges. Milrinone ACC context and label-maintenance ranges are shown separately; renal reduction is flagged. Metaraminol no universal rate invented. No infusion calculator, dilution or patient-specific titration engine was added.
- Directions on heart/vessel diagram are qualitative, not measured effect sizes or survival benefit.

## Evidence

Primary sources in `VASO_SOURCES`, each linked on relevant drug card:

1. SSC2026 adult guideline: https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines
2. ACC2025 expert consensus: https://www.jacc.org/doi/10.1016/j.jacc.2025.02.018 ; Table2 and context checked in publisher-authored PDF hosted by Inova: https://www.inovanewsroom.org/wp-content/uploads/2025/06/Sinha-et-al-JACC-2025-ACC-Concise-Clinical-Guidance-on-Cardiogenic-Shock.pdf
3. GIAPREZA: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c265d69a-3efe-4107-9a9e-e6fd3d531c48
4. Phenylephrine: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7a23ed28-3912-4398-b660-bf9ec3ee3926
5. Milrinone: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=838da14b-c070-4c09-b088-99e7c64d9964
6. Metaraminol: https://www.medicines.org.uk/emc/product/14774/smpc
7. Simdax product information (older leaflet, not a new guideline): https://mohpublic.z6.web.core.windows.net/IsraelDrugs/Rishum_7_60769918.pdf

Accessed 2026-10-04. Independent reviewer corroborated SSC, phenylephrine and angiotensin claims, but could not open ACC publisher site; ACC Table2 was checked by author from the primary PDF. Educational content is not clinically validated decision support.

## Verification and reproducibility

Deterministic profile mapping; no random seed or fitted data. All 30 profile/scenario/escalation combinations checked for valid agents and cause-first/adjunct boundaries. Input unknowns throw errors rather than silently select drugs. Tests do not establish clinical efficacy.

- `npm run check`: PASS, syntax gate.
- `npm test`: PASS, full project unit suites including vasoactive and existing physiology.
- `npm run build`: PASS, production bundle.
- `node scripts/test-vasoactive-browser.cjs`: PASS in Chrome against localhost:5189, three branches, adjunct conditions, scenario changes, renal/tachy flags, drug/dose cards, TR/EN state/focus retention, mobile overflow and interactions chapter regression.
- Independent review: no critical/high/medium findings; one low language-label finding fixed, pressor-support clarification added.
- Screenshot outputs: `/private/tmp/cardia-vasoactive-shots/`; visually inspected desktop drug diagram and mobile algorithm.

The tenth chapter hides the generic cards panel; existing interactions stay tied to chapter ID rather than last array position. Earlier uncommitted physiology edits are preserved. No commit or deployment performed.

## Identities

Input SHA-256: `2f561091e47b23b5c4cbb872c537b15397c6205685a9f148dec4e6d62dcad01e`

Environment: macOS-26.5.1-arm64-arm-64bit, Node v22.14.0; dependency versions pinned in package-lock.json.

| Code | SHA-256 |
| --- | --- |
| `src/vasoactive-data.js` | `66ce4f207b02276ddff2e5837655fa187a7139281954c09775963af746a3859d` |
| `src/vasoactive-panel.js` | `e1895acb68a9df0bbb4e33c9c89e428635f6805523156e83f1fcb90091c85bf5` |
| `src/vasoactive.css` | `6907231bec798e0a79c24840cf09fe98b4bbfb1c723627d1ce7815336f3ed54b` |
| `scripts/test-vasoactive.mjs` | `11eed8b0524d1f2aca574d2e0505718723eccb4ed47d9297e06bf9b819445016` |
| `scripts/test-vasoactive-browser.cjs` | `5cd875a8a59b13d7911b702222cd2952b813bf1d40bffb338f4b231c3b8989a1` |
