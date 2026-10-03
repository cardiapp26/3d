import assert from 'node:assert/strict';
import { uiTranslations, rawLessons, rawStructures } from '../src/content.js';

const EM_DASH = '\u2014';
const strings = value => typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(strings)
  : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

// 1. Interface dictionary: same keys, same mode ids and numbers.
const tr = uiTranslations.tr, en = uiTranslations.en;
assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort(), 'TR and EN interface keys match');
for (const key of Object.keys(tr)) {
  assert.equal(typeof tr[key], typeof en[key], `${key}: same value type`);
  if (typeof tr[key] === 'string') assert.ok(tr[key].trim() && en[key].trim(), `${key}: both filled`);
}
assert.deepEqual(tr.modes.map(([id, n]) => [id, n]), en.modes.map(([id, n]) => [id, n]), 'modes share ids and numbers');
// Mode numbers follow the displayed order (anatomy, physiology, intervention, EP, imaging groups in main.js).
assert.deepEqual(tr.modes.map(([id]) => id), ['anatomy', 'atria', 'ra', 'rv', 'lv', 'defects', 'cath', 'exam', 'angiography', 'transseptal', 'ablation', 'pacemaker', 'bachmann', 'echo', 'tee', 'ice'], 'modes listed in display order');
assert.deepEqual(tr.modes.map(([, n]) => n), tr.modes.map((_, i) => String(i + 1).padStart(2, '0')), 'mode numbers run 01, 02, ... in display order');

// 2. Lessons: same modes, steps, landmarks and views in both languages.
for (const [id, lesson] of Object.entries(rawLessons)) {
  assert.ok(lesson.tr && lesson.en, `${id}: both languages`);
  assert.equal(lesson.tr.steps.length, lesson.en.steps.length, `${id}: same step count`);
  lesson.tr.steps.forEach((step, i) => {
    const other = lesson.en.steps[i];
    assert.equal(step.landmark, other.landmark, `${id}[${i}]: same landmark`);
    assert.equal(step.view, other.view, `${id}[${i}]: same view`);
    assert.ok(step.title && other.title && step.text && other.text, `${id}[${i}]: titles and text filled`);
  });
}

// 3. Structures: title and description in both languages.
for (const [id, s] of Object.entries(rawStructures)) {
  for (const lang of ['tr', 'en']) assert.ok(s[lang]?.title && s[lang]?.description != null, `${id}.${lang}: title and description`);
}

// 4. House style: no em dash anywhere in interface or lesson text.
for (const text of [...strings(uiTranslations), ...strings(rawLessons)]) assert.ok(!text.includes(EM_DASH), `no em dash: ${text.slice(0, 60)}`);

// 5. Redaction guardrails (report section 11).
assert.equal(tr.opacityLabel, 'Doku opaklığı');
assert.equal(en.opacityLabel, 'Tissue opacity');
assert.doesNotMatch(`${tr.fluoroDockTitle} ${en.fluoroDockTitle}`, /X-ışını|X-ray simulation/, 'fluoroscopy is schematic, not an X-ray simulation');
assert.equal(tr.modes.find(([id]) => id === 'pacemaker')[2], 'Kalp pili elektrotları');
assert.doesNotMatch(tr.chambers + tr.veins + tr.valves + tr.conduction, /\(/, 'no bilingual duplicates in TR layer names');
assert.doesNotMatch(tr.referencesLimits + en.referencesLimits, /Üst yazar|upstream author|kurmaz/, 'limits read as plain sentences');
assert.match(tr.modeShortcut, /1–9/);
assert.equal(tr.carmPill, 'ANJİYOGRAFİ', 'one spelling: anjiyografi');
const allLessons = strings(rawLessons).join(' ');
assert.doesNotMatch(allLessons, /data table entries|veri tablosuna eklenir/, 'developer notes are not student text');
assert.doesNotMatch(allLessons, /murmur (grows|softens)|\bsoftens\b/, 'loudness is louder/softer, not grows/softens');
assert.doesNotMatch(allLessons, /anchors securely/, 'no added certainty in EN');
assert.doesNotMatch(allLessons, /animasyonlar\./, 'transseptal intro reads as an instruction');
assert.match(rawLessons.pacemaker.en.steps[0].text, /lateral wall/, 'pacemaker step 1: EN and TR cover the same sites');
console.log('PASS: TR/EN key and lesson parity, filled structures, no em dash, redaction guardrails');
