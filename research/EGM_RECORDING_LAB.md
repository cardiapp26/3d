# EGM recording laboratory: source and modeling record

Date: 2026-10-21. Authority: execute within the authorized EPS teaching-module changes. This record concerns a synthetic, interactive explanation of recording principles, not reproduction of patient recordings or a clinical mapping-system validation.

## Source identity and rights

Ikram U. Haq, Ahmad Amin, Hanxu Niu, Nayani Makkar, Samuel J. Asirvatham. *Electrogram recording: Unipolar, bipolar, omnipolar and multipolar electrograms*. Indian Pacing and Electrophysiology Journal (2026). [DOI: 10.1016/j.ipej.2026.09.004](https://doi.org/10.1016/j.ipej.2026.09.004).

The user-supplied PDF is an 11-page pre-pagination/corrected-proof copy: its header retains `xxx (xxxx) xxx`. Its first page gives received 16 August 2026, revised 11 September 2026, accepted 15 September 2026, available online 16 September 2026. Use the DOI and PDF page numbers below; do not invent final volume, issue or page numbers. “Corrected proof” describes this supplied version, not a separately verified final publication status.

Local PDF: `/Users/yh/Library/CloudStorage/OneDrive-Personal/eps için kaynak makale ve kitaplar/Electrogram recording.pdf`.

- PDF SHA-256: `31dce31c26550f83e7f3790470aa0c669ac8aa72038a7de76964a1ed142f7d2e`.
- Working extraction: `/tmp/eps-electrogram-recording.txt`, read in full, SHA-256 `d86388879b75a41b11e86faad1a272b606e2cb8083cd38699b24c94946ae4554`.
- Page 1 states © 2026 Indian Heart Rhythm Society, published by Elsevier B.V., open access under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Interactive curves and diagrams are original synthetic illustrations inspired by the concepts. No PDF pages, clinical traces or patient cases are redistributed. If source figures are later reused, retain attribution, license link and a statement of changes, and inspect any figure-specific third-party credits.

## Scope and source mapping

The integrated page is `/eps/#/recording`, linked from EGM basics and retaining the EPS TR/EN language choice. Controls change the signal computation, with the same time and voltage scales for comparable channels. Reset restores the teaching baseline; freeze, zoom and calipers support inspection. Implementation status must be judged from current files and checks, not from this design table.

| Teaching experiment | Source location in supplied PDF | Permitted inference and required limit |
|---|---|---|
| Acquisition, amplification, common-mode interference | pp. 1–2, §2.1–2.2, Fig. 1 | Unequal coupling/contact can leave differential noise; subtraction also removes genuine shared activity. |
| Sampling, bit depth, quantization | p. 3, §2.3 | Sample rate and amplitude resolution are different controls. High-frequency components can alias when sampled too slowly. |
| HPF/LPF comparisons | pp. 2–4, §2.4, Figs. 2–3 | Raising HPF removes slow content and changes morphology; LPF 120/240/500 Hz changes sharp bundle potentials and noise. These examples are not universal clinical presets. |
| 50/60 Hz interference and notch | pp. 4–5, Fig. 4, §3, Table 1 | Notch suppresses a band containing physiologic content; first troubleshoot the actual noise source. |
| Same electrodes, different filter bands | p. 4, Fig. 5 | Recording configuration must be distinguished from the waveform's appearance. See the source-label inconsistency below. |
| Front-end/ADC saturation versus display gain | pp. 4–5, §2.5–2.6 | Clipping destroys information before display. Enlarging an already captured waveform does not restore or cause ADC clipping. |
| QS versus rS, contact and breakthrough | p. 6, §4.1–4.4 | QS can reflect centrifugal spread at a breakthrough or exit. It cannot independently identify the true source or an ablation target. |
| U1, U2 and their bipolar difference | pp. 6–8, §5–5.2, Fig. 6 | Define polarity explicitly as B = U1 − U2. If U1 is locally silent, B can resemble −U2. |
| Spacing, electrode size and field of view | pp. 7–8, Fig. 7, §5.3–5.4, Fig. 8 | Wider separation can retain deep/shared signals that a close pair suppresses; geometry, contact and electrode size remain confounders. |
| Bipolar blindness and virtual omnipole | pp. 8–9, §5.5–6.1, Fig. 9A–B | For an ideal planar wave, a perpendicular pair can cancel the local signal. An in-plane vector projection can reconstruct virtual directions. |
| Tripolar/common-component rejection | p. 10, §6.2.1–6.2.2, Fig. 10, Table 2 | T = E2 − ½(E1 + E3). Shared far field cancels under the stated assumptions; shared local activity can also be lost. |
| Frequency-based near-field interpretation | pp. 9–11, Fig. 9C, §6.2.3–6.2.4, Table 2 | Sharp/high-frequency components can help inspection. Peak frequency alone did not distinguish critical VT isthmus from bystander regions in the cited work. |

Suggested challenge cases: orientation-dependent low voltage mistaken for scar; QS mistaken for the true origin; a sharp conduction-system component attenuated by LPF; one silent electrode dominating the bipolar difference; genuine simultaneous local activation removed by common-component subtraction; a loose reference or unequal noise coupling obscuring a channel.

## Numerical and scientific contract

1. **Synthetic source.** Generate deterministic sampled voltage arrays with time in ms and voltage in mV. Label every teaching trace synthetic. Chosen amplitudes, durations, noise amounts, contact coefficients and propagation speed are model parameters, not fitted patient data or quantitative reproductions of figures. No diagnostic cutoffs or clinical accuracy estimates follow from them.
2. **Separate acquisition from display.** Front-end gain acts before saturation and ADC quantization. ADC full scale is a voltage range; bit depth sets available levels. Quantization-step convention must be documented in code. Display gain changes vertical scale only and must leave ADC samples and clipping counts unchanged. Viewport overflow is not acquisition clipping.
3. **Sampling and antialiasing.** The Nyquist frequency is fs/2. Exact equality at a band edge is not an adequate practical acquisition design; a realizable antialias filter needs transition margin. Any pre-sampling antialias filter must be applied before decimation, or the experiment must clearly say it is disabled to demonstrate aliasing. Post-sampling LPF cannot recover already aliased information. Do not describe a high-resolution digital source as an actual analog recording.
4. **Filter provenance.** State filter type/order, cutoff convention, causal versus zero-phase treatment, edge handling and whether processing is before or after sampling. Time shifts and attenuation may change a steepest-slope annotation; label it an algorithmic teaching estimate, not independently verified LAT. Do not claim a boxcar smoother or arbitrary shape interpolation reproduces a vendor HPF/LPF or spectral algorithm. Avoid separately autoscaling channels that would conceal amplitude changes.
5. **Polarity and shared reference.** Derive bipolar samples from the same simultaneous U1 and U2 arrays. Their common reference cancels algebraically, but unequal local coupling/contact or reference processing can leave differences. Common-component subtraction demonstrates an assumption, not anatomical proof of far field. Near field and far field depend on recording geometry, source distribution and wavelength; neither is an absolute label inferred solely from amplitude or frequency.
6. **Spacing.** Preserve only the model-specific behavior and label it. A delayed-copy planar-wave model with fixed wave shape, size and contact can show increasing peak-to-peak bipolar amplitude over a selected spacing range. It must not teach that spacing has a universally monotonic relationship with amplitude or reverse that relationship merely to match a sentence in the review.
7. **Omnipolar reconstruction.** State a single locally planar, homogeneous wavefront, constant local velocity, known electrode geometry and adequate contact. Reconstruct a virtual direction from simultaneous orthogonal components, such as Vθ(t) = Vx(t) cos θ + Vy(t) sin θ after the chosen spacing normalization. Searching these projections is different from taking max(|Vx|, |Vy|). The model reduces pair-orientation dependence within the sampled plane; it does not establish independence from all wavefront directions, curvature, collisions, fractionation or 3D substrate. Its maximum voltage cannot inherit conventional bipolar scar thresholds.
8. **Spatial and frequency methods.** A mean/common-component toy is not CARTO's PCA-based multipolar implementation. A time-frequency display or sharp-component toy is not EnSite X's proprietary peak-frequency algorithm. Tripolar subtraction is explicit and reproducible, but real clinical selectivity and outcomes are not established by the arithmetic. Include a counterexample where simultaneous local signals are also suppressed. High frequency alone must never identify a critical isthmus.

## Source ambiguities and contained corrections

**Spacing, §5.3, p. 8.** The review states that reducing spacing produces narrower, higher-amplitude EGM. This should not be turned into a universal simulation law. It differs from the existing basics model's fixed-waveform delayed-copy behavior and cannot be reconciled by merely reversing a slider. Electrode size, orientation, contact, tissue sources, temporal offset and measured amplitude definition matter. The basics TR/EN note now explicitly bounds its schematic and avoids a general monotonic claim; its model and tests remain unchanged.

**Fig. 5, p. 4.** The caption assigns the 1–300 and 30–300 Hz bands to B and U1 in an order conflicting with the adjoining prose. The safe supported lesson is that identical underlying electrode configuration can look different after different HPF settings. Do not reproduce the disputed label-to-band assignment without independent clarification.

**QS and filters.** The basics TR/EN text now states that QS alone cannot distinguish an origin from breakthrough or set an ablation target; contact and filtering must be checked. Bipolar blindness is bounded to the ideal planar example. The 30–500 Hz basics preset is identified as a teaching preset rather than a universal standard; the review's low unipolar HPF (typically ≤1–2 Hz, §4.1) and pseudo-QS caveat (§4.3) are reflected in the note. Existing Cooper attribution is retained and the Haq review is added for these limitations.

## Verification and reproducibility

Run from the project root with its installed Node/Vite toolchain. The source/text checks below used Node v22.14.0 on 2026-10-21. Verification of software behavior is separate from clinical validity. This source review uses the supplied full PDF; no scite citation audit or final-publisher metadata audit was requested or performed.

| Check | Command or method | Status at source-record creation |
|---|---|---|
| Supplied input identity | `shasum -a 256` on PDF and extracted text | Passed; hashes above. |
| Source mapping and limitations | Full PDF text reviewed against page/section/figure locations | Complete; same-agent source check, not independent clinical review. |
| Basics text syntax | `node --check src/eps/egm-basics-text.js` | Passed, exit 0; no syntax output. |
| Existing basics behavior/text contract | `node scripts/eps/test-egm-basics.mjs` | Passed, exit 0; `PASS egm-basics` with TR/EN texts and existing waveform/block/interval/decremental checks. |
| Owned diff whitespace | `git diff --check -- src/eps/egm-basics-text.js research/EGM_RECORDING_LAB.md` | Passed, exit 0. New document also reviewed directly. |
| Integrated EPS unit suite | `npm run test:eps` (also included in `npm test`) | Passed; EPS syntax and all model suites, including the recording lab. |
| Project syntax/unit/build gates | `npm run check`, `npm test`, `npm run build` | Passed, exit 0. Node v22.14.0, installed Vite 8.3.0. No separate TypeScript or ESLint gate configured for these JS files. |
| Recording numerical checks | `npm run test:recording` | Passed; deterministic sampled arrays, exact subtraction, vector projections/angle sweep, shared-local loss, sine frequency response, quantization, clipping, anti-alias and input bounds. |
| EPS browser regression suite | `EPS_URL=http://127.0.0.1:5191/eps APP_URL=http://127.0.0.1:5191 npm run test:eps-browser` | Passed; existing live/lesson/mapping/lab/link/VES journeys and recording lab; no page errors. |
| Production recording journey and offline reload | Build, serve with Vite preview on port 5192, then `APP_URL=http://127.0.0.1:5192 RECORDING_OFFLINE=1 npm run test:recording-browser` | Passed; controls/metrics, geometric counterexamples, calipers, quiz invalidation, TR/EN, Space, hidden animation, 390px overflow and cached route reload with interactive controls. |
| Adversarial code review | Separate code-reviewer and JavaScript-reviewer agents; targeted rerun after fixes | Complete; false canceled-signal LAT, unavailable radial-source omni, and four-neighbor topology corrected. No remaining reported critical/high/medium findings. Not independent clinical validation. |

The module's final test output, model source, parameters and installed runtime versions form the runnable implementation evidence. Do not mark an unexecuted command as passed or infer clinical performance from a green software test.


## Implemented numerical choices and review corrections

- Source clock: 8000 Hz over 600 ms, event center 250 ms, deterministic noise seed 2026. `DEFAULT_RECORDING_STATE` in `recording-model.js` holds the baseline controls. Every output includes normalized `state`, `geometry`, units and method metadata.
- Selected acquisition input is unipolar U1 or exact bipolar U1−U2. Four-pole shared interference cancels only under the explicitly ideal matched-input conditions. Noise RMS describes the input contamination in that selected path; it is not a clinical SNR or a post-filter quality estimate.
- ADC range is ±2 mV after analog pre-gain. Returned voltages are input-referred mV. Optional pre-ADC fourth-order Butterworth low-pass approximation uses cutoff 0.4 Fs; subsequent causal second-order HP/LP and notch filters use normalized biquad coefficients with zero initial state. Digital LP is bounded to 0.45 Fs. The displayed ADC samples use zero-order hold.
- The 64 ms Hann-window time-frequency profile uses a 32 ms hop at the actual ADC rate, processed samples and supported frequencies ≤min(900 Hz, 0.45 Fs). Display uses actual frequency/time coordinates. Power is normalized per result to 0–1; comparison does not provide absolute spectral power or a proprietary near-field classifier.
- Planar omnipolar demonstration reconstructs orthogonal spatial-gradient components integrated over a common aperture using the known synthetic 0.5 mm/ms conduction speed. Maximal peak-to-peak projection comes from the diameter of the local two-dimensional voltage loop; an independent angular sweep checks it. This is an explanatory approximation, not a clinical finite-electrode omnipolar implementation.
- At a radially symmetric focus/breakthrough center that planar approximation is invalid. `meta.omniAvailable=false`, null voltage metric and a specific warning accompany ∅ in the reconstruction plots. Collision remains an explicitly limited illustration.
- LAT is an algorithmic teaching annotation from the steepest negative slope within 238–280 ms. It excludes the earlier synthetic sharp conduction potential; prominence/noise/ADC-step and window-edge guards suppress annotations on canceled channels and filter-startup transients. It is not a validated clinical activation detector. Null LAT is shown as ∅.
- Nearfield diagram identifies central E2=U1, tripolar flanks E1/E3 and four-neighbor mean stencil E1/E3/E4/E5. These common-component operations can cancel genuine shared local activation, demonstrated by the counterexample.
- Initial browser-suite invocation with only APP_URL hit an existing mapping test's default port 5173 and failed with ERR_CONNECTION_REFUSED. The complete suite passed with both supported APP_URL and EPS_URL pointing at the same development server. No check was weakened.
- In-app browser automation bootstrap failed with a local classic-level code-signature error. Visual inspection and interactions used the project's installed Playwright/Chrome test infrastructure. Screenshots: `/tmp/eps-recording-desktop.png`, `/tmp/eps-recording-mobile.png` (temporary verification evidence).

### Guided-lesson revision (2026-10-21)

The six free-form modes were replaced by eight guided lessons following the paper's order: recording chain (§2.1–2.6), filters (§2.4, Figs. 2, 3, 5), noise (§2.2, §3, Figs. 1, 4, Table 1), unipolar morphology and LAT (§4), bipolar construction (§5.1–5.2, §5.4, Figs. 6, 8), orientation and spacing (§5.3, §5.5, Figs. 7, 9A), omnipolar (§6.1, Figs. 9A–B) and near-field discrimination (§6.2, Figs. 9C, 10, Table 2). Each lesson has its own clean baseline, concept text, key points, state-detected experiment steps with revealed observations, a live interpretation, two quiz questions and a clinical pearl.

- `recording-lessons.js`: lesson configuration, metric definitions and step-completion predicates.
- `recording-draw.js`: pipeline, differential-amplifier and tissue diagrams; signals with LAT marks; ADC close-up, −dV/dt, orientation curve, spectrum and voltage loop.
- Model addition: `deep` scenario (source 15 mm below, 4 mm upstream, 1 mm/ms spread) illustrating Fig. 7; close bipoles largely cancel it, wide bipoles keep it. Omni is marked unavailable for it. `bipolarAmplitudeByAngle` gives a noiseless local-only orientation curve.
- Noise checklist actions map Table 1 measures onto model inputs (stimulator disconnect sets imbalance 0; cable, grounding and connector measures scale mains amplitude). These mappings are teaching choices, not measured effects.
- Checks: `npm run check`, `npm test`, `npm run build`, `npm run test:eps-browser` passed on the dev server. Unit tests verify every lesson step is reachable from its baseline by its own apply action and is not already complete at baseline.
