// Electrophysiological anatomy case catalog
// (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md): mechanism, zone
// and conduction as separate axes, calipers measured from the events, the
// corrected VA block wording, maneuver validity states, the CS ostium
// comparison, and the neutral diagnosis texts that hide their own mechanism.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EP_CHANNELS, EP_SECTIONS, EP_CASES, EP_RECORDING_IDS, CS_OSTIUM_COMPARISON,
  MANEUVER_RESULTS, CHANNEL_ELECTRODES, epRecording, epClips, measure, resolveRef
} from '../src/ep-cases.js';
import { activationSequence, earliestChannels } from '../src/ep-activation-map.js';
import { EP_TEXT, EP_CASE_TEXT, EP_CLIP_TEXT, EP_MANEUVERS, EP_ZONE_TEXT, EP_DISCLAIMER, EP_COMPARE } from '../src/ep-case-text.js';

const channelIds = new Set(EP_CHANNELS.map((c) => c.id));
const first = (r, ch, type, occ = 0) => resolveRef(r, { ch, type, occ });

// Every recording: known channels, events inside the window (no clipped
// maneuver clip, acceptance item 14), calipers measured from the events equal
// the declared teaching numbers, and complete TR/EN text.
for (const id of EP_RECORDING_IDS) {
  const r = epRecording(id);
  assert.ok(r && Object.isFrozen(r), `${id} resolves frozen`);
  assert.ok(EP_SECTIONS.includes(r.section), `${id} section`);
  assert.ok(EP_CASES.some((c) => c.id === r.caseId), `${id} case exists`);
  assert.ok(r.channels.length >= 6 && r.channels.every((ch) => channelIds.has(ch)), `${id} channels known`);
  for (const [ch, list] of Object.entries(r.events)) {
    assert.ok(channelIds.has(ch), `${id} event channel ${ch}`);
    for (const e of list) assert.ok(e.t >= 0 && e.t <= r.windowMs, `${id} ${ch} ${e.type}@${e.t} inside ${r.windowMs} ms`);
  }
  assert.ok(r.calipers.length >= 1, `${id} has calipers`);
  for (const c of r.calipers) {
    const value = measure(r, c);
    assert.ok(Number.isFinite(value), `${id} ${c.label} measured`);
    const want = r.teachingNumbers[c.label];
    if (want !== undefined) assert.equal(value, want, `${id} ${c.label}: measured ${value} = declared ${want}`);
  }
  const text = EP_CLIP_TEXT[id];
  assert.ok(text, `${id} text`);
  for (const lang of ['tr', 'en']) {
    const t = text[lang];
    assert.ok(t.title.length > 3, `${id} ${lang} title`);
    const bodies = t.text ? [t.text] : [t.neutral, t.evidence];
    assert.ok(bodies.every(Boolean), `${id} ${lang} body`);
    const disclaimed = bodies.some((b) => b.includes(EP_DISCLAIMER[lang]));
    assert.ok(disclaimed, `${id} ${lang} carries the synthetic disclaimer`);
  }
}
assert.equal(EP_RECORDING_IDS.length, 43, '43 recordings in the catalog');

// Cases: separate axes and citations; text and clips in every section they claim.
for (const c of EP_CASES) {
  assert.ok(c.mechanism && c.pathwayZone && c.conduction.length, `${c.id} axes`);
  assert.ok(c.citations.length >= 1 && c.citations.every((r) => /^R\d+$/.test(r)), `${c.id} citations`);
  for (const lang of ['tr', 'en']) assert.ok(EP_CASE_TEXT[c.id][lang].name && EP_CASE_TEXT[c.id][lang].endpoint, `${c.id} ${lang} name/endpoint`);
  assert.ok(EP_SECTIONS.some((s) => epClips(c.id, s).length), `${c.id} has clips`);
}
// WPW is not a zone and concealed is not a side: the same zone appears with
// different conduction, and the same mechanism with different zones.
const zone = (id) => EP_CASES.find((c) => c.id === id).pathwayZone;
assert.equal(zone('ap-left-lateral'), zone('ap-left-manifest'), 'left free wall: concealed and manifest share the zone');
assert.equal(zone('ap-inf-paraseptal'), zone('pjrt'), 'inferior paraseptal: AVRT and PJRT share the zone');
assert.notEqual(EP_CASES.find((c) => c.id === 'pjrt').conduction.join(), EP_CASES.find((c) => c.id === 'ap-inf-paraseptal').conduction.join(), 'conduction axis differs');

// Diagnosis clips hide their own mechanism in the neutral text.
const BANNED = {
  'avnrt-typ-svt': /AVNRT/i, 'avnrt-atyp-svt': /AVNRT/i, 'ap-ll-svt': /AVRT|serbest duvar|free wall/i,
  'ap-ips-svt': /paraseptal/i, 'pjrt-svt': /PJRT/i, 'ap-lm-sinus': /WPW/i,
  'ap-lm-avrt': /AVRT|WPW/i, 'af-preexcited': /preeksit|preexcit|WPW/i,
  'ap-lm-antidromic': /antidromi|AVRT|WPW/i, 'at-svt': /fokal|focal/i,
  'flutter-svt': /flutter|\bCTI\b|istmus|isthmus/i, 'ph-svt': /para-His|paraseptal|\bAP\b|pathway/i
};
for (const [id, banned] of Object.entries(BANNED)) {
  for (const lang of ['tr', 'en']) {
    const t = EP_CLIP_TEXT[id][lang];
    assert.ok(!banned.test(t.neutral), `${id} ${lang}: neutral text hides its mechanism`);
    assert.ok(t.evidence.length > 80, `${id} ${lang}: evidence text explains`);
  }
}

// Concentric vs eccentric retrograde sequences.
const typ = epRecording('avnrt-typ-svt');
assert.ok(first(typ, 'cs-910', 'A').t < first(typ, 'cs-12', 'A').t, 'typical AVNRT: concentric (proximal before distal CS)');
assert.ok(first(typ, 'his-d', 'A').t - first(typ, 'his-d', 'V').t <= 40, 'typical AVNRT: short septal VA');
const ll = epRecording('ap-ll-svt');
assert.ok(first(ll, 'cs-12', 'A').t < first(ll, 'cs-910', 'A').t, 'left lateral pathway: eccentric (distal earliest)');
assert.ok(first(ll, 'abl-d', 'A').t < first(ll, 'cs-12', 'A').t, 'annular ABL local A earlier than distal CS');
const atyp = epRecording('avnrt-atyp-svt');
assert.ok(measure(atyp, atyp.calipers[1]) > 150, 'atypical AVNRT: long VA');
const ips = epRecording('ap-ips-svt');
assert.ok(first(ips, 'abl-d', 'A').t < first(ips, 'cs-910', 'A').t, 'inferior paraseptal: earliest A at the CS ostium ABL');

// CS ostium comparison (report section 5): four diagnosis clips from four cases.
assert.equal(CS_OSTIUM_COMPARISON.length, 4);
assert.equal(new Set(CS_OSTIUM_COMPARISON.map((id) => epRecording(id).caseId)).size, 4, 'four different cases');
assert.ok(CS_OSTIUM_COMPARISON.every((id) => epRecording(id).section === 'diagnosis'));

// Maneuvers: validity states, cards, and the physiology of each response.
for (const id of EP_RECORDING_IDS) {
  const r = epRecording(id);
  if (r.section !== 'maneuver') continue;
  assert.ok(MANEUVER_RESULTS.includes(r.result), `${id} result state`);
  assert.ok(EP_MANEUVERS[r.maneuver], `${id} card exists`);
  for (const lang of ['tr', 'en']) {
    const card = EP_MANEUVERS[r.maneuver][lang];
    for (const key of ['name', 'goal', 'precondition', 'expected', 'inference', 'pitfall']) assert.ok(card[key], `${r.maneuver} ${lang} ${key}`);
  }
}
// His-refractory PVC: participation advances the A (A-A < TCL); the negative response leaves it unchanged.
const aa = (id) => { const r = epRecording(id); return { tcl: measure(r, r.calipers[0]), aa: measure(r, r.calipers[1]) }; };
assert.ok(aa('ap-ll-hispvc').aa < aa('ap-ll-hispvc').tcl, 'left lateral: A advanced');
assert.ok(aa('ap-ips-hispvc').aa < aa('ap-ips-hispvc').tcl, 'inferior paraseptal: A advanced');
assert.equal(aa('avnrt-typ-hispvc').aa, aa('avnrt-typ-hispvc').tcl, 'typical AVNRT: A unchanged');
assert.ok(EP_CLIP_TEXT['avnrt-typ-hispvc'].tr.text.includes('dışlamaz'), 'negative response does not exclude a pathway');
// The stimulus lands after the committed His of that beat (His refractory).
for (const id of ['ap-ll-hispvc', 'ap-ips-hispvc', 'avnrt-typ-hispvc']) {
  const r = epRecording(id);
  const s = first(r, 'rv', 'S');
  const priorH = r.events['his-d'].filter((e) => e.type === 'H' && e.t <= s.t).pop();
  assert.ok(priorH && s.t - priorH.t < 30, `${id}: stimulus just after the committed H`);
}
// Overdrive: PPI from the events; no capture computes nothing and continues at TCL.
const vop = epRecording('avnrt-typ-vop');
assert.equal(measure(vop, vop.calipers[0]), vop.teachingNumbers.PPI);
const non = epRecording('avnrt-typ-vop-noncapture');
assert.equal(non.result, 'invalidCapture');
assert.ok(!non.calipers.some((c) => c.label === 'PPI'), 'no PPI without entrainment');
for (const s of non.events.rv.filter((e) => e.type === 'S')) {
  assert.ok(!non.events.rv.some((e) => e.type === 'V' && Math.abs(e.t - s.t) < 12), 'stimulus without a paced V');
}
// Decremental retrograde conduction: S-A lengthens at the faster rate.
const pjrt = epRecording('pjrt-vpace');
const sa = Object.fromEntries(pjrt.calipers.map((c) => [c.label, measure(pjrt, c)]));
assert.ok(sa['S-A (380 ms)'] > sa['S-A (500 ms)'], 'PJRT: decremental retrograde');

// Corrected VA block teaching (report section 2): typical and atypical clips
// are separate, antegrade AV conduction is shown on a recorded sinus beat,
// and the cycle length is contextual, not an automatic danger threshold.
const jvb = epRecording('junctional-va-block');
const blockedBeat = jvb.events['his-d'].filter((e) => e.type === 'V').some((v) =>
  !jvb.events['his-d'].some((e) => e.type === 'A' && e.t > v.t && e.t < v.t + 150));
assert.ok(blockedBeat, 'typical clip: a V without retrograde A');
assert.equal(measure(jvb, jvb.calipers[0]), 80, 'antegrade AH shown on the recorded sinus beat');
for (const lang of ['tr', 'en']) {
  const t = EP_CLIP_TEXT['junctional-va-block'][lang].text;
  assert.match(t, lang === 'tr' ? /durdurma uyarısıdır/ : /warning to stop energy delivery/);
  assert.match(t, lang === 'tr' ? /kesin AV blok kanıtı değildir/ : /not proof of AV block/);
  assert.match(t, lang === 'tr' ? /[Aa]tipik/ : /atypical/, 'names the atypical distinction');
  assert.ok(!/hızlı junctional/.test(t) && !/[Ff]ast junctional rhythm appears/.test(t), 'cycle count is not framed as automatic danger');
}
const avb = epRecording('avnrt-atyp-vablock');
assert.equal(measure(avb, avb.calipers[0]), 80, 'atypical clip also records antegrade AH');
assert.notEqual(EP_CLIP_TEXT['avnrt-atyp-vablock'].tr.text, EP_CLIP_TEXT['junctional-va-block'].tr.text, 'separate clips, separate texts');
assert.ok(EP_CLIP_TEXT['junctional-rf'].tr.text.includes('tek başına'), 'junctional alone is not success');

// Manifest pathway (storyboard 3): fusion, not an early V glued on a sinus beat.
const lm = epRecording('ap-lm-sinus');
const delta = first(lm, 'ecg-ii', 'delta');
assert.ok(delta && first(lm, 'abl-d', 'V').t < delta.t, 'local annular V precedes the surface delta');
assert.ok(first(lm, 'his-d', 'H').t < delta.t, 'His fires before the delta: fusion of two wavefronts');
assert.ok(first(lm, 'ecg-ii', 'V'), 'the late (normal system) component is its own event');
const lmPost = epRecording('ap-lm-post');
assert.ok(!(lmPost.events['ecg-ii'] || []).some((e) => e.type === 'delta'), 'post-ablation: no delta');
assert.equal(measure(lmPost, lmPost.calipers[1]), 45, 'post-ablation HV normal');
assert.ok(EP_CLIP_TEXT['ap-lm-post'].tr.text.includes('retrograd'), 'delta loss alone does not assess retrograde conduction');
// Post-ablation retrograde tests: concentric nodal, labelled as normal, not failure.
for (const id of ['ap-ll-post-retro', 'ap-lm-post-retro']) {
  const r = epRecording(id);
  assert.ok(first(r, 'his-d', 'A').t < first(r, 'cs-12', 'A').t, `${id}: concentric retrograde`);
}
assert.match(EP_CLIP_TEXT['ap-ll-post-retro'].tr.text, /başarısız AP ablasyonu diye etiketlenmez/);

// Dual AV nodal physiology (case 02): the AH jump and the single echo are a
// finding, separated from the tachycardia diagnosis.
const dual = epRecording('avnrt-dual-echo');
const jump = measure(dual, dual.calipers[1]) - measure(dual, dual.calipers[0]);
assert.ok(jump >= 50, `AH jump ${jump} ms`);
assert.ok(first(dual, 'his-d', 'A', 3), 'a single atrial echo returns after the jump beat');
assert.ok(!first(dual, 'his-d', 'H', 3), 'the echo does not start a tachycardia in this clip');
assert.match(EP_CLIP_TEXT['avnrt-dual-echo'].tr.text, /tek başına klinik AVNRT kanıtı değildir/);

// Orthodromic AVRT over the manifest pathway: narrow QRS (no delta), eccentric A.
const avrt = epRecording('ap-lm-avrt');
assert.ok(!(avrt.events['ecg-ii'] || []).some((e) => e.type === 'delta'), 'no delta during orthodromic AVRT');
assert.equal(measure(avrt, avrt.calipers[2]), 45, 'normal HV: antegrade limb is the node');
assert.ok(first(avrt, 'cs-12', 'A').t < first(avrt, 'cs-910', 'A').t, 'eccentric retrograde A');

// Preexcited AF (report section 8): irregular RR, varying preexcitation, SPERRI
// measured between preexcited beats, safety wording without doses.
const af = epRecording('af-preexcited');
const vTimes = af.events['ecg-ii'].filter((e) => e.type === 'V').map((e) => e.t);
const rrs = vTimes.slice(1).map((t, i) => t - vTimes[i]);
assert.ok(new Set(rrs).size >= 5, 'irregular RR intervals');
assert.equal(measure(af, af.calipers[0]), 220, 'SPERRI from the events');
const deltas = af.events['ecg-ii'].filter((e) => e.type === 'delta');
assert.ok(deltas.length === vTimes.length - 1, 'one beat is narrow (fusion), the rest preexcited');
assert.ok((af.events.hra || []).length > 10, 'fibrillatory atrial activity on the atrial channels');
for (const lang of ['tr', 'en']) {
  const t = EP_CLIP_TEXT['af-preexcited'][lang];
  assert.match(t.evidence, /amiodaron|amiodarone/);
  assert.match(t.evidence, /kardiyoversiyon|cardioversion/);
  assert.match(t.evidence, /SPERRI/);
  assert.ok(!/\d+\s*(mg|joule|J\b)/i.test(t.evidence), 'no doses or energies');
  assert.match(t.neutral, lang === 'tr' ? /dar QRS taşikardi algoritması bu kayda uygulanmaz/i : /narrow QRS algorithm does not apply/i);
}

// Para-Hisian pacing (report section 7): the nodal response lengthens the S-A
// when His capture is lost, the extranodal response does not; the card keeps
// the capture preconditions and the masking pitfall.
const saOf = (id) => { const r = epRecording(id); return r.calipers.map((c) => measure(r, c)); };
const nodal = saOf('avnrt-typ-parahis');
assert.ok(nodal[1] - nodal[0] >= 30, `nodal: S-A lengthens (${nodal})`);
const extranodal = saOf('ap-ips-parahis');
assert.equal(extranodal[0], extranodal[1], 'extranodal: S-A unchanged');
for (const lang of ['tr', 'en']) {
  const card = EP_MANEUVERS['para-his'][lang];
  assert.match(card.precondition, lang === 'tr' ? /yakalama|capture/i : /capture/i);
  assert.match(card.pitfall, lang === 'tr' ? /maskelenebilir/ : /masked/);
  assert.match(card.pitfall, lang === 'tr' ? /entrainment ile aynı test değildir/ : /not the same test/);
}

// Antidromic AVRT: fully preexcited every beat, concentric retrograde A over the node.
const anti = epRecording('ap-lm-antidromic');
const antiV = anti.events['ecg-ii'].filter((e) => e.type === 'V').length;
assert.equal(anti.events['ecg-ii'].filter((e) => e.type === 'delta').length, antiV, 'every beat preexcited');
assert.ok(first(anti, 'his-d', 'A').t < first(anti, 'cs-12', 'A').t, 'retrograde A concentric (nodal limb)');
assert.ok(first(anti, 'abl-d', 'V').t < first(anti, 'ecg-ii', 'delta').t + 15, 'annular V leads the wide QRS');

// Focal AT: earliest A on HRA; overdrive gives A-A-V (two A events before the next V).
const at = epRecording('at-svt');
assert.ok(first(at, 'hra', 'A').t < first(at, 'cs-910', 'A').t && first(at, 'hra', 'A').t < first(at, 'his-d', 'A').t, 'cristal AT: HRA earliest');
const atVop = epRecording('at-vop');
const lastS = atVop.events.rv.filter((e) => e.type === 'S').pop();
const lastPacedV = atVop.events.rv.filter((e) => e.type === 'V' && Math.abs(e.t - lastS.t) < 15).pop();
const nextAs = atVop.events.hra.filter((e) => e.type === 'A' && e.t > lastPacedV.t).map((e) => e.t);
// Skip the far-field V of the last paced beat itself: the next conducted V comes later.
const nextV = atVop.events['his-d'].filter((e) => e.type === 'V').map((e) => e.t).find((t) => t > lastPacedV.t + 100);
assert.ok(nextAs.length >= 2 && nextAs[0] < nextV && nextAs[1] < nextV, 'A-A-V: two atrial events before the first V');
assert.match(EP_CLIP_TEXT['at-vop'].tr.text, /V-A-V/, 'contrasts the V-A-V response');
assert.ok(!epClips('focal-at', 'treatment').length && EP_CASE_TEXT['focal-at'].tr.endpoint.includes('tedavi klibi yoktur'), 'no treatment clip is claimed');

// Zones: every case's pathwayZone has zone text, and the risk notes exist in both languages.
for (const c of EP_CASES) {
  assert.ok(EP_ZONE_TEXT[c.pathwayZone] || ['koch-slow-pathway', 'koch-inferior-extensions'].includes(c.pathwayZone), `${c.id} zone text`);
  const z = EP_ZONE_TEXT[c.pathwayZone];
  if (z) for (const lang of ['tr', 'en']) assert.ok(z[lang].name && z[lang].risk, `${c.pathwayZone} ${lang}`);
}
assert.ok(Object.keys(EP_ZONE_TEXT).length >= 13, 'zone matrix covered (report section 5)');
assert.match(EP_ZONE_TEXT['cs-mcv'].tr.risk, /Koroner/, 'CS/MCV carries the coronary risk note');
assert.match(EP_ZONE_TEXT['superior-paraseptal'].tr.risk, /AV blok/, 'para-Hisian carries the AV block risk');

// Section 15, focal AT: full channel sequences, the activation map finds the
// focus, a non-diagnostic overdrive, and the annotated comparison card.
const atSeq = activationSequence(epRecording('at-svt'), 1);
assert.deepEqual(earliestChannels(atSeq), ['hra'], 'activation map: earliest at the crista (HRA)');
assert.ok(atSeq.length >= 5 && atSeq.every((r) => r.rel >= 0));
for (const ch of epRecording('at-svt').channels) assert.ok((epRecording('at-svt').events[ch] || []).length, `at-svt ${ch}: events on every shown channel`);
assert.equal(epRecording('at-vop-terminated').result, 'insufficientEvidence', 'terminated overdrive is not diagnostic');
for (const lang of ['tr', 'en']) assert.equal(EP_COMPARE['at-svt'][lang].rows.length, 5, `${lang}: AT vs AVNRT/AVRT card`);
assert.deepEqual(earliestChannels(activationSequence(epRecording('ap-ll-svt'), 1)), ['abl-d'], 'left lateral AP: earliest at the annular ABL');

// Section 15, CTI entrainment (case 24): pacing faster than TCL, the paced
// sequence matches the flutter sequence, PPI from the events, invalid and
// terminated attempts, and the separate bidirectional block assessment.
const fl = epRecording('flutter-entrain-cti');
const flStims = fl.events['abl-d'].filter((e) => e.type === 'S').map((e) => e.t);
const pclFl = flStims[1] - flStims[0];
assert.ok(pclFl < 240 && 240 - pclFl <= 20, `pacing ${pclFl} ms, 10-20 ms below the TCL`);
const flSeq = activationSequence(epRecording('flutter-svt'), 1).map((r) => r.ch);
const pacedSeq = activationSequence({ events: Object.fromEntries(Object.entries(fl.events).map(([ch, l]) => [ch, l.filter((e) => e.t > flStims[1] && e.t < flStims[2] + 30)])) }, 0)
  .sort((x, y) => x.rel - y.rel).map((r) => r.ch).filter((ch) => ch !== 'abl-d');
const flutterOrder = activationSequence(epRecording('flutter-svt'), 1).sort((x, y) => x.rel - y.rel).map((r) => r.ch).filter((ch) => ch !== 'abl-d');
assert.deepEqual(pacedSeq, flutterOrder, 'entrainment: the paced activation sequence equals the flutter sequence');
assert.ok(flSeq.includes('halo-910'));
const ppiFl = measure(fl, fl.calipers[0]), tclFl = measure(fl, fl.calipers[1]);
assert.ok(ppiFl - tclFl <= 20 && ppiFl - tclFl >= 0, `PPI-TCL ${ppiFl - tclFl} ms`);
assert.equal(epRecording('flutter-entrain-noncapture').result, 'invalidCapture');
assert.ok(!epRecording('flutter-entrain-noncapture').calipers.some((c) => c.label === 'PPI'), 'no PPI without capture');
assert.equal(epRecording('flutter-entrain-terminated').result, 'insufficientEvidence');
assert.ok(!epRecording('flutter-entrain-terminated').calipers.some((c) => c.label === 'PPI'), 'no PPI after termination');
const haloOrder = (id) => ['halo-910', 'halo-78', 'halo-56', 'halo-34', 'halo-12'].map((ch) => first(epRecording(id), ch, 'A').t);
const descending = (ts) => ts.every((t, i) => i === 0 || t > ts[i - 1]);
assert.ok(descending(haloOrder('flutter-svt')), 'flutter: lateral wall activates top down');
assert.ok(!descending(haloOrder('cti-cs-pacing-before')), 'before ablation, CS pacing: collision on the lateral wall');
assert.ok(descending(haloOrder('cti-cs-pacing-after')), 'after ablation, CS pacing: top down (no isthmus crossing)');
const before = epRecording('cti-cs-pacing-before'), after = epRecording('cti-cs-pacing-after');
const tict = (r) => measure(r, r.calipers[0]);
assert.ok(tict(after) >= 1.5 * tict(before), 'transisthmus time increases at least 50% (R15 teaching value)');
assert.ok(measure(after, after.calipers[1]) >= 100, 'double potentials 100 ms or more (R15 teaching value)');
const low = epRecording('cti-lowlat-pacing-after');
assert.ok(first(low, 'cs-910', 'A').t > first(low, 'halo-910', 'A').t, 'low lateral pacing: CS ostium after the high lateral wall (other direction blocked)');
assert.deepEqual(epClips('flutter-cti', 'treatment'), ['cti-cs-pacing-before', 'cti-cs-pacing-after', 'cti-lowlat-pacing-after'], 'block assessed separately, both directions');
for (const lang of ['tr', 'en']) assert.match(EP_CASE_TEXT['flutter-cti'][lang].endpoint, lang === 'tr' ? /tek başına sonlanım değildir/ : /not an endpoint/);

// Section 15, para-Hisian case 16: His+RV and RV-only capture labels, S-A and
// H-A references, direct atrial capture uninterpretable, title separate from entrainment.
const phx = epRecording('ph-parahis-extranodal');
assert.equal(measure(phx, phx.calipers[0]), measure(phx, phx.calipers[1]), 'extranodal: S-A unchanged');
assert.ok(phx.markers.some((m) => /His\+RV/.test(m.label.en)) && phx.markers.some((m) => /RV-only/.test(m.label.en)), 'capture labels');
const nodalHa = epRecording('ph-parahis-nodal-ha');
const m4 = Object.fromEntries(nodalHa.calipers.map((c) => [c.label, measure(nodalHa, c)]));
assert.ok(m4['S-A (RV)'] > m4['S-A (His+RV)'] && m4['H-A (RV)'] === m4['H-A (His+RV)'], 'nodal: S-A lengthens, H-A constant');
assert.equal(epRecording('ph-parahis-direct-a').result, 'invalidCapture');
assert.ok(measure(epRecording('ph-parahis-direct-a'), epRecording('ph-parahis-direct-a').calipers[0]) < 30, 'direct A capture: A with the stimulus');
for (const lang of ['tr', 'en']) assert.match(EP_MANEUVERS['para-his'][lang].name, lang === 'tr' ? /entrainment değil/ : /not entrainment/);
assert.equal(EP_CASES.find((c) => c.id === 'ap-parahisian').pathwayZone, 'superior-paraseptal');

// Section 15, antidromic AVRT: surface and intracardiac events agree, the circuit is declared for 3D.
const ad = epRecording('ap-lm-antidromic');
assert.equal(ad.circuit, 'antidromic');
assert.equal(epRecording('ap-lm-avrt').circuit, 'orthodromic');
for (let k = 0; k < 4; k++) {
  const delta = first(ad, 'ecg-ii', 'delta', k), qrs = first(ad, 'ecg-ii', 'V', k), abl = first(ad, 'abl-d', 'V', k), rv = first(ad, 'rv', 'V', k);
  assert.ok(abl.t < delta.t + 15 && delta.t < qrs.t && rv.t <= qrs.t, `beat ${k}: annular V, delta, QRS in order`);
}
for (const lang of ['tr', 'en']) assert.match(EP_COMPARE['ap-lm-antidromic'][lang].rows.at(-1)[1], lang === 'tr' ? /kesin tanı vermez/ : /no definite diagnosis/);

// Section 15, Halo / unipolar: channel identity with 3D electrodes, QS vs rS.
for (const ch of EP_CHANNELS) {
  if (ch.surface || ch.id === 'hra') continue;
  assert.ok(CHANNEL_ELECTRODES[ch.id]?.length, `${ch.id}: 3D electrode identity`);
}
const uni = (id) => epRecording(id).events['abl-uni'];
assert.ok(uni('ap-lm-uni-site2').every((e) => e.amp < 0), 'site 2: QS (negative only)');
assert.ok(uni('ap-lm-uni-site1').some((e) => e.amp > 0) && uni('ap-lm-uni-site1').some((e) => e.amp < 0), 'site 1: rS');
assert.ok(measure(epRecording('ap-lm-uni-site1'), epRecording('ap-lm-uni-site1').calipers[0]) < 0, 'site 1 bipolar still looks early (V before delta)');

// Section labels and the neutral prompt exist in both languages; no em dash anywhere.
for (const lang of ['tr', 'en']) {
  assert.ok(EP_SECTIONS.every((s) => EP_TEXT[lang].sections[s]), `${lang} section labels`);
  assert.ok(EP_TEXT[lang].neutralPrompt.length > 40 && EP_TEXT[lang].csCompare.length > 40, `${lang} prompts`);
  assert.ok(MANEUVER_RESULTS.every((r) => EP_TEXT[lang].results[r]), `${lang} result labels`);
}
for (const file of ['../src/ep-cases.js', '../src/ep-case-text.js', '../src/ep-egm.js', '../src/ep-panel.js', '../src/ep-zones.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log('PASS ep-cases: 43 recordings with event-measured calipers, separate mechanism/zone/conduction axes, neutral diagnosis texts, His-refractory PVC and overdrive validity, decremental retrograde, corrected VA block wording, manifest fusion and post-ablation endpoints');
