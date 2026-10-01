// PAC / PVC source-region exercise (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md, phase C;
// patterns: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md). The 12 leads come from one dipole and
// keep their time and polarity relations; each example's features are read back from its
// leads; overlapping patterns give low confidence; a scar example locates an exit only; the
// atrial catheter recording shows the sampling limit; no accuracy percentage is shown.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEADS, leadsOf, sampleLeads, polarity, transitionLead } from '../src/ecg12.js';
import {
  ORIGIN_KINDS, ORIGIN_EXAMPLES, REGIONS, REGION_PATTERNS,
  originFeatures, likelyRegions, gradeOrigin, originRecording, nextExample
} from '../src/ep-origin.js';
import { ORIGIN_TEXT } from '../src/ep-origin-text.js';
import { resolveRef, measure } from '../src/ep-cases.js';

// 1. One dipole: Einthoven and the augmented leads hold at every sample of every example.
for (const e of ORIGIN_EXAMPLES) {
  const s = sampleLeads(e.lobes, { from: 0, to: 230, step: 5 });
  s.t.forEach((_, i) => {
    const v = Object.fromEntries(LEADS.map((l) => [l, s.leads[l][i]]));
    assert.ok(Math.abs(v.III - (v.II - v.I)) < 1e-12, `${e.id}: III = II - I`);
    assert.ok(Math.abs(v.aVR + v.aVL + v.aVF) < 1e-12, `${e.id}: aVR + aVL + aVF = 0`);
  });
}
// A pure leftward vector is positive in I and V6, negative in aVR; a pure inferior one positive in II, III, aVF.
const left = leadsOf([1, 0, 0]);
assert.ok(left.I > 0 && left.V6 > 0 && left.aVR < 0);
const down = leadsOf([0, 1, 0]);
assert.ok(down.II > 0 && down.III > 0 && down.aVF > 0 && down.V1 < 0, 'an inferior vector is negative in the superiorly placed V1');
// A flat lead is never the transition: a pure inferior vector leaves V5-V6 flat and V1-V4 negative.
assert.equal(transitionLead(sampleLeads([{ dir: [0, 1, 0], t: 50, sigma: 20, amp: 1 }], { from: 0, to: 120 })), null);
assert.equal(transitionLead(sampleLeads([], { from: 0, to: 50 })), null, 'all-zero leads: no transition');
assert.equal(polarity([0, 0.5, -0.1]), '+');
assert.equal(polarity([0, 0.3, -0.3]), '±');
assert.equal(polarity([0, 0.001, -0.001]), '0');

// 2. Each example: the features read from its leads and the likely regions (storyboard C).
const expected = {
  'pvc-rvot': { bundle: 'LBBB', axis: 'inferior', transition: 'V4', likely: ['rvot'], confidence: 'moderate' },
  'pvc-rvot-v3': { bundle: 'LBBB', axis: 'inferior', transition: 'V3', likely: ['rvot', 'lvot-cusp'], confidence: 'low' },
  'pvc-lvot-cusp': { axis: 'inferior', transition: 'V2', leadI: '-', likely: ['lvot-cusp'], confidence: 'moderate' },
  'pvc-mitral-superior': { bundle: 'RBBB', axis: 'inferior', likely: ['mitral-superior'], confidence: 'moderate' },
  'pvc-ta-free-wall': { bundle: 'LBBB', axis: 'superior', leadI: '+', aVL: '+', likely: ['ta-free-wall'], confidence: 'moderate' },
  'vt-lv-inferior-scar': { bundle: 'RBBB', axis: 'superior', likely: ['lv-inferior'], confidence: 'moderate', reasons: ['single', 'scarExit'] },
  'pac-crista-high': { v1: '±', axis: 'inferior', leadI: '+', aVR: '-', likely: ['crista-high'], confidence: 'moderate' },
  'pac-cs-ostium': { axis: 'superior', aVL: '+', likely: ['cs-ostium'], confidence: 'moderate' },
  'pac-ta-superior': { v1: '-', likely: ['ta-superior'], confidence: 'moderate' },
  'pac-rspv': { v1: '+', axis: 'inferior', likely: ['crista-high', 'rspv'], confidence: 'low' },
  'pac-laa': { v1: '+', axis: 'inferior', leadI: '-', aVL: '-', likely: ['laa'], confidence: 'moderate' }
};
for (const e of ORIGIN_EXAMPLES) {
  const want = expected[e.id];
  assert.ok(want, `${e.id}: storyboard row`);
  const r = likelyRegions(e);
  for (const key of ['bundle', 'axis', 'transition', 'leadI', 'aVL', 'aVR', 'v1']) if (key in want) assert.equal(r.features[key], want[key], `${e.id}: ${key}`);
  assert.deepEqual(r.likely, want.likely, `${e.id}: likely regions`);
  assert.equal(r.confidence, want.confidence, `${e.id}: confidence`);
  if (want.reasons) assert.deepEqual(r.reasons, want.reasons);
  assert.ok(r.likely.includes(e.region), `${e.id}: the source region is among the likely ones`);
  assert.equal(gradeOrigin(e, e.region), 'match');
  for (const other of REGIONS[e.kind].filter((x) => x !== e.region)) {
    assert.equal(gradeOrigin(e, other), r.likely.includes(other) ? 'compatible' : 'mismatch', `${e.id} vs ${other}`);
  }
  assert.ok(REGIONS[e.kind].includes(e.region));
}
for (const kind of ORIGIN_KINDS) for (const region of REGIONS[kind]) {
  assert.ok(REGION_PATTERNS[region], `${region}: pattern`);
  assert.ok(ORIGIN_EXAMPLES.some((e) => e.region === region), `${region}: an example`);
}
// The transition read from the leads is the first precordial lead with R at least S.
const rvot = sampleLeads(ORIGIN_EXAMPLES.find((e) => e.id === 'pvc-rvot').lobes, { from: 0, to: 230 });
assert.equal(transitionLead(rvot), 'V4');
assert.ok(Math.max(...rvot.leads.V3) < Math.max(...rvot.leads.V3.map((v) => -v)), 'V3 still S-dominant');

// 3. Atrial catheter recordings: the earliest recorded A relative to P onset, measured from the events.
for (const e of ORIGIN_EXAMPLES.filter((x) => x.kind === 'atrial')) {
  const rec = originRecording(e);
  for (const c of rec.calipers) assert.ok(resolveRef(rec, c.a) && resolveRef(rec, c.b));
  assert.equal(measure(rec, rec.calipers[0]), rec.earliestLead, `${e.id}: P-A measured from the events`);
  assert.ok(Object.values(rec.events).flat().every((ev) => ev.t >= 0 && ev.t <= rec.windowMs));
}
// The strip's surface P comes from the same dipole: its dominant sign in II and V1 matches the 12-lead.
for (const e of ORIGIN_EXAMPLES.filter((x) => x.kind === 'atrial')) {
  const rec = originRecording(e);
  const f = originFeatures(e);
  for (const [ch, pol] of [['ecg-ii', polarity(sampleLeads(e.lobes, { from: 0, to: 130 }).leads.II, 0.01)], ['ecg-v1', f.v1]]) {
    const ps = rec.events[ch].filter((x) => x.type === 'P');
    const pos = Math.max(0, ...ps.map((x) => x.amp)), neg = Math.max(0, ...ps.map((x) => -x.amp));
    const strip = pos > neg * 1.25 ? '+' : neg > pos * 1.25 ? '-' : '±';
    assert.equal(strip, pol, `${e.id} ${ch}: strip P ${strip} = 12-lead ${pol}`);
  }
}
assert.ok(originRecording(ORIGIN_EXAMPLES.find((e) => e.id === 'pac-crista-high')).earliestLead < 0, 'catheter near the focus: A before P');
assert.ok(originRecording(ORIGIN_EXAMPLES.find((e) => e.id === 'pac-rspv')).earliestLead > 0, 'unsampled focus: earliest A after P');
assert.equal(originRecording(ORIGIN_EXAMPLES.find((e) => e.id === 'pvc-rvot')), null, 'PVC examples have no catheter strip');

// 4. Deterministic order, text and wording: no accuracy percentage, no definite-target claim.
assert.equal(nextExample('atrial').id, 'pac-crista-high');
assert.equal(nextExample('atrial', 'pac-laa').id, 'pac-crista-high', 'wraps around');
for (const lang of ['tr', 'en']) {
  const t = ORIGIN_TEXT[lang];
  for (const kind of ORIGIN_KINDS) for (const region of REGIONS[kind]) assert.ok(t.regions[region], `${region} ${lang}`);
  for (const key of ['single', 'overlap', 'partial', 'scarExit']) assert.ok(t.reasons[key]);
  const all = JSON.stringify(t, (k, v) => (typeof v === 'function' ? v.toString() : v));
  assert.ok(!all.includes('%'), `${lang}: no accuracy percentage`);
}
for (const file of ['../src/ecg12.js', '../src/ep-origin.js', '../src/ep-origin-text.js', '../src/ep-origin-panel.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log(`PASS ep-origin: one-dipole 12 leads (Einthoven), ${ORIGIN_EXAMPLES.length} examples read back from their leads, overlap gives low confidence, scar example locates an exit, atrial sampling limit from events`);
