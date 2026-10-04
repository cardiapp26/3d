# WPW visual workbook

Added 2026-10-04. Entry: `/eps/#/wpw`.

Four learning pages retain the existing localization, coronary-sinus, ablation and refractory-period models. Localization now includes a keyboard-accessible schematic valve-plane map with nine selectable teaching examples, illustrated ECG choices, progressive lead disclosure and a decision trail. Selecting a region loads an example; manual lead choices run the existing algorithm. Both Turkish and English preserve page and input state.

`src/eps/wpw-loc-visual.js` generates all diagrams. Its example fixtures map to the nine existing algorithm outputs and are checked by `scripts/eps/test-wpw-loc.mjs`. ECG drawings represent the stated polarity/R-to-S options, not measured recordings. The valve-plane map is LAO-like and approximate; overlapping clinical regions have representative markers. Coronary-sinus trace onsets come directly from `csSequence`, relative to the first V, on a labeled millisecond axis. The ablation drawing illustrates the existing lecture case with masked LBBB, not a universal outcome of ablation. No diagnostic accuracy or patient-specific catheter coordinates are implied.

Content provenance remains the existing Kardiyopedi lecture summary in `wpw-loc-text.js` and `wpw-loc-model.js`. The teaching algorithm was not replaced. No new clinical localization rule was introduced.

Verification:

- `node scripts/eps/test-wpw-loc.mjs`: all nine examples resolve to their labeled regions; section navigation and original behaviors pass.
- `APP_URL=http://127.0.0.1:5189 npm run test:wpw-browser`: map selection, keyboard focus, manual decisions, language retention, CS/ablation controls and mobile overflow.
- `npm run check`, `npm test`, `npm run build`.

Background code review was attempted but the reviewer agent could not run because its usage limit was reached. Local diff and visual review completed; no independent clinical validation performed.
