// Advanced EP cases (EasyECG report phase D; sources and storyboard:
// research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md section 3). Every teaching claim
// is read back from the events, not from stored numbers; the generic catalog
// invariants run in test-ep-cases.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EP_CASES, EP_CHANNELS, epRecording, epClips, measure, resolveRef } from '../src/ep-cases.js';
import { ADVANCED_CASES } from '../src/ep-cases-advanced.js';
import { EP_CASE_TEXT, EP_CLIP_TEXT, EP_ZONE_TEXT, EP_MANEUVERS } from '../src/ep-case-text.js';
import { activationSequence } from '../src/ep-activation-map.js';

const first = (r, ch, type, occ = 0) => resolveRef(r, { ch, type, occ });
const val = (r, label) => measure(r, r.calipers.find((c) => c.label === label));

// The three cases exist with separate axes, zone text and TR/EN names.
for (const c of ADVANCED_CASES) {
  assert.ok(EP_CASES.some((e) => e.id === c.id), `${c.id} in the catalog`);
  assert.ok(EP_ZONE_TEXT[c.pathwayZone], `${c.id} zone text`);
  for (const lang of ['tr', 'en']) assert.ok(EP_CASE_TEXT[c.id][lang].name && EP_CASE_TEXT[c.id][lang].endpoint);
}

// --- Para-Hisian focal AT -------------------------------------------------
{
  const svt = epRecording('pat-svt');
  // Long RP with the earliest A at the His; the surface P exists for the AT A.
  assert.ok(val(svt, 'VA') > 150, 'long RP');
  const seq = activationSequence(svt, 1);
  assert.equal(seq.find((r) => r.rel === 0).ch, 'his-p', 'earliest A at the His');
  assert.ok((svt.events['ecg-ii'] || []).some((e) => e.type === 'P'), 'surface P drawn');

  // His-refractory PVC leaves the A unchanged.
  const pvc = epRecording('pat-hispvc');
  assert.equal(val(pvc, 'A-A'), val(pvc, 'TCL'), 'A unchanged');

  // Overdrive: the atrial rate is unchanged during and after pacing (VA dissociation).
  const vop = epRecording('pat-vop-dissoc');
  assert.equal(val(vop, 'A-A (pacing)'), 420);
  assert.equal(val(vop, 'A-A (sonra)'), 420);

  // NCC mapping: the ABL A precedes the surface P onset by 15 ms (R20) and
  // matches the right para-Hisian A; the case text forbids a prescription.
  const map = epRecording('pat-ncc-map');
  assert.equal(val(map, 'ABL A → P'), 15);
  assert.ok(Math.abs(val(map, 'ABL A → His p A')) <= 5);
  assert.match(EP_CLIP_TEXT['pat-ncc-map'].tr.text, /reçete/);
  assert.equal(epRecording('pat-post').teachingNumbers.HV, 45, 'conduction preserved after the procedure');
}

// --- Left posterior fascicular VT ----------------------------------------
{
  const vt = epRecording('fvt-vt');
  // P1 base before apex in diastole; P2 apex before base presystolic; both precede the QRS.
  const p1b = first(vt, 'lv-sep-b', 'P1', 1), p1a = first(vt, 'lv-sep-a', 'P1', 1);
  const p2b = first(vt, 'lv-sep-b', 'P2', 1), p2a = first(vt, 'lv-sep-a', 'P2', 1);
  const qrs = first(vt, 'ecg-ii', 'V', 1);
  assert.ok(p1b.t < p1a.t && p1a.t < qrs.t, 'P1 base to apex, diastolic');
  assert.ok(p2a.t < p2b.t && p2b.t < qrs.t + 20, 'P2 apex to base, presystolic');
  // Retrograde His: the H comes after the QRS onset (negative HV).
  assert.ok(val(vt, 'H-V (VT)') < 0, 'retrograde His');
  // AV dissociation: the sinus A rate is independent of the V rate.
  assert.equal(val(vt, 'A-A (sinüs)'), 880);
  assert.notEqual(val(vt, 'A-A (sinüs)') % val(vt, 'TCL'), 0);

  // Entrainment: P1 follows the paced cycle in the same direction, the VT
  // resumes at its own cycle, and the RV PPI exceeds the TCL.
  const en = epRecording('fvt-entrain');
  assert.equal(val(en, 'P1-P1 (pacing)'), 310);
  assert.equal(val(en, 'P1-P1 (sonra)'), 340);
  assert.equal(val(en, 'TCL'), 340);
  assert.ok(val(en, 'PPI') - val(en, 'TCL') > 40, 'RV outside the circuit');
  const eb = first(en, 'lv-sep-b', 'P1', 3), ea = first(en, 'lv-sep-a', 'P1', 3);
  assert.ok(eb.t < ea.t, 'orthodromic capture keeps the P1 direction');

  // After ablation: normal HV and the antegrade Purkinje potential before the local V.
  const post = epRecording('fvt-post');
  assert.equal(val(post, 'HV'), 45);
  assert.ok(first(post, 'lv-sep-b', 'Pk', 0).t < first(post, 'lv-sep-b', 'V', 0).t);
}

// --- Bundle branch reentry VT ---------------------------------------------
{
  // Substrate: prolonged HV in sinus with an RB potential after the H.
  const sinus = epRecording('bbr-sinus');
  assert.ok(val(sinus, 'HV') > 55, 'prolonged sinus HV');
  assert.equal(val(sinus, 'H → RB'), 25);

  // VT: every V preceded by H then RB; atrium dissociated.
  const vt = epRecording('bbr-vt');
  for (let k = 0; k < 4; k++) {
    const h = first(vt, 'his-d', 'H', k), rb = first(vt, 'rb', 'RB', k), v = first(vt, 'ecg-ii', 'V', k);
    assert.ok(h.t < rb.t && rb.t < v.t, `beat ${k}: H then RB then V`);
  }
  assert.equal(val(vt, 'A-A (sinüs)'), 900, 'dissociated atrium');

  // The H-H change of one cycle reappears in the V-V of the same cycle.
  const wob = epRecording('bbr-hh-vv');
  assert.equal(val(wob, 'H-H (1)'), val(wob, 'V-V (1)'));
  assert.equal(val(wob, 'H-H (2)'), val(wob, 'V-V (2)'));
  assert.notEqual(val(wob, 'H-H (1)'), val(wob, 'H-H (2)'), 'the cycle length wobbles');

  // After right bundle ablation: no RB potential, longer HV, RBBB-type V1.
  const post = epRecording('bbr-post');
  assert.ok(!(post.events.rb || []).some((e) => e.type === 'RB'), 'RB potential gone');
  assert.ok(val(post, 'HV') > val(sinus, 'HV'), 'HV longer after ablation');
  assert.ok(first(post, 'ecg-v1', 'V', 0).amp > 0, 'RBBB-type V1');
  assert.match(EP_CLIP_TEXT['bbr-post'].tr.text, /interfasiküler/, 'interfascicular reentry pitfall');
}

// Clips exist per section; the entrain-rv card is complete; new channels are known.
assert.deepEqual(epClips('at-parahisian', 'diagnosis'), ['pat-svt']);
assert.equal(epClips('fascicular-vt', 'maneuver').length, 1);
assert.equal(epClips('bbr-vt', 'diagnosis').length, 3);
for (const lang of ['tr', 'en']) for (const key of ['name', 'goal', 'precondition', 'expected', 'inference', 'pitfall']) {
  assert.ok(EP_MANEUVERS['entrain-rv'][lang][key], `entrain-rv ${lang} ${key}`);
}
for (const id of ['rb', 'lv-sep-b', 'lv-sep-a']) assert.ok(EP_CHANNELS.some((c) => c.id === id && c.noElectrode), `${id} channel, no 3D electrode claimed`);

for (const file of ['../src/ep-cases-advanced.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log('PASS ep-advanced: para-Hisian AT (dissociation, NCC window), fascicular VT (P1/P2 directions, entrainment, preserved conduction), BBR-VT (H before V, H-H leads V-V, post-ablation RBBB), all read from events');
