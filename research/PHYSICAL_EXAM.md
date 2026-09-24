# Physical examination module (mode 08)

Teaching model for auscultation findings and dynamic bedside maneuvers.
It is not a diagnostic tool; the sounds and phonocardiograms are
synthesized schematics.

## How it works

1. A **maneuver** (`src/exam-physiology.js`, `MANEUVERS`) is a vector of
   relative changes, from -1 to +1, in six determinants: `preload`,
   `rightReturn`, `afterload`, `contractility`, `hr` and `proximity`.
   `lvSize` is derived from them as `preload + 0.4·afterload − 0.4·contractility`.
   A maneuver also has an onset and a hold time. The panel ramps its level
   0 → 1 → 0 over that time course.
2. A **finding** (`src/exam-findings.js`, `FINDINGS`) declares how strongly
   it depends on each determinant (`sensitivity`). The response score is the
   weighted sum of the maneuver vector. Above +0.12 the finding is louder,
   below −0.12 it is softer, otherwise it is unchanged. The Levine grade moves
   about one step per 0.5 of score. For MVP the metric is timing: the click
   phase moves with `lvSize`.
3. The **dynamic LVOT obstruction** (`lvotGradient`) scales the rest gradient
   by `exp(−1.1·lvSize − 0.6·afterload + 0.6·contractility)`, with a 5 mmHg
   floor (latent obstruction) and a 180 mmHg cap. The classes follow the
   usual thresholds: at rest, 30 mmHg or more is obstructive; with
   provocation, 50 mmHg or more is the septal reduction threshold in
   symptomatic patients.
4. The **phonocardiogram** (`murmurEnvelope`, `heartSoundEvents`) runs on
   the shared cardiac clock in `cardiac-cycle.js`, so S1, S2, clicks and
   murmurs line up with the ECG strip, the Wiggers diagram and the 3D valve
   motion.
5. `scripts/test-exam.mjs` checks every `expected` entry, which is the
   textbook response table, against the model (73 responses at present). It
   also checks the classic discriminators and the LVOT provocation.

## Adding content

- **New maneuver:** add one `maneuver(...)` entry to `MANEUVERS`, with its
  delta, onset, hold and an optional bilingual note. It then appears in the
  panel and in every response table automatically.
- **New finding:** add one `f(...)` entry to `FINDINGS`. It needs a label,
  kind, side, area, radiation, shape, grade, pitch, sounds, sensitivity,
  expected, teaching, and `lembo` where accuracy data exist. If the timing
  shape is new, add a `case` to `murmurEnvelope`. Add its expected responses
  and run `node scripts/test-exam.mjs`: a failing row means the sensitivity
  weights disagree with the textbook table.
- **New heart sound:** add a label to a finding's `sounds` and an event in
  `heartSoundEvents`.
- **Lesson step:** add `{ title, text, finding, maneuver, area, view }` to
  `rawLessons.exam` in `src/content.js`.

Candidates for later: Austin Flint, Graham Steell, PDA (continuous),
ASD (fixed S2 split), paradoxical split, S3/S4 as standalone findings,
pericardial rub, jugular venous waveforms, arterial pulse palpation
(parvus et tardus, bisferiens, alternans, paradoxus), and the Valsalva
square-wave response in heart failure.

## Sources

- Lembo NJ, Dell'Italia LJ, Crawford MH, O'Rourke RA. Bedside diagnosis of
  systolic murmurs. N Engl J Med 1988;318:1572-8.
  doi:10.1056/NEJM198806163182404. This study (50 patients) provides the
  sensitivities and specificities in `lembo` and in the lesson:
  - **Right-sided murmurs:** louder with inspiration and softer with
    expiration, 100% / 88%.
  - **HCM:**
    - louder with Valsalva, 65% / 96%
    - louder on squat-to-stand, 95% / 84%
    - softer on stand-to-squat, 95% / 85%
    - softer with passive leg elevation, 85% / 91%
    - softer with handgrip, 85% / 75%
  - **MR or VSD:**
    - louder with handgrip, 68% / 92%
    - louder with transient arterial occlusion, 78% / 100%
    - softer with amyl nitrite, 80% / 90%
  - **AS:** no single maneuver identified it; it was diagnosed by exclusion.
- **Full text checked:** the model's response table was compared with
  Table 1 of the full paper (observation counts per maneuver and murmur).
  Corrections made after that check:
  - Left-sided systolic murmurs mostly fall with inspiration (AS 75%,
    HCM 90%, MR 67%, VSD 70% decrease) and rise with expiration. The
    earlier "left-sided murmurs do not change with breathing" was wrong.
  - AS was unchanged with handgrip in 65% and with arterial occlusion in 90%
    of observations, and rose with amyl nitrite in 56%; those expectations
    now accept "unchanged" too.
  - HCM was unchanged with arterial occlusion in 90% (accepted as "softer or
    unchanged").
  - MR responses to standing and squatting were varied (40/30/30%), so both
    directions are accepted.
  - The paper lists handgrip among the maneuvers that make the MVP murmur
    earlier, while other sources say it delays the click. The MVP handgrip
    row is therefore not tested and the lesson says the sources disagree.
  - The paper found the Müller maneuver not useful for right-sided murmurs;
    it is not modeled.
- LVOT physiology, provocation and the Brockenbrough-Braunwald-Morrow sign:
  `research/HEMODYNAMICS_REFERENCE.md` section H (Stouffer, *Cardiovascular
  Hemodynamics for the Clinician*, 2nd ed., 2017).
- **Standard physical diagnosis teaching:** the remaining response
  directions follow the usual textbook maneuver tables, including the
  diastolic murmurs, MVP timing, amyl nitrite in AS, MS and TR, and the
  phenylephrine column.
- **Magnitudes:** the sensitivity weights and maneuver deltas are teaching
  weights chosen to reproduce these directions. They are not measured
  effect sizes.
