// Atrial pacing laboratory (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md, phase A;
// storyboard: research/EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md section 4). Every
// storyboard row is checked from the events: the learner's input changes the
// signal, a stimulus that does not capture gives no route answer, the same
// input gives the same recording, measurements come from the events.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PACING_CASES, PACE_SITES, PACE_MODES, PACE_COUNTS, PACE_ANSWERS, ATRIAL_ERP,
  deliverPacing, pacingMeasures, gradePacingAnswer, compareExtrastimuli, pacingScene, pacingKey, normalizePacing
} from '../src/ep-pacing-lab.js';
import { PACE_TEXT } from '../src/ep-pacing-text.js';
import { EP_MANEUVERS } from '../src/ep-case-text.js';
import { EP_CASES, resolveRef } from '../src/ep-cases.js';

const inWindow = (r) => Object.values(r.events).every((list) => list.every((e) => e.t >= 0 && e.t <= r.windowMs));
const m = (r) => pacingMeasures(r);
const first = (r, ch, type) => (r.events[ch] || []).filter((e) => e.type === type);

// Grid: every case, protocol, site, drive and interval gives a frozen, measurable recording inside its window.
let count = 0;
for (const caseId of Object.keys(PACING_CASES)) {
  assert.ok(EP_CASES.some((c) => c.id === caseId), `${caseId}: a catalog case`);
  for (const site of PACE_SITES) for (const s1 of [300, 400, 500, 600, 700]) {
    for (const n of PACE_COUNTS) {
      const choices = [{ caseId, mode: 'incremental', site, s1, count: n }];
      for (let s2 = 180; s2 <= Math.min(500, s1); s2 += 20) choices.push({ caseId, mode: 'extra', site, s1, count: n, s2 });
      for (const c of choices) {
        const r = deliverPacing(c);
        count++;
        assert.ok(inWindow(r), `${pacingKey(c)}: events inside the window`);
        for (const [label, value] of Object.entries(m(r))) assert.ok(Number.isFinite(value), `${pacingKey(c)}: ${label} measured`);
        for (const cal of r.calipers) assert.ok(resolveRef(r, cal.a) && resolveRef(r, cal.b), `${pacingKey(c)}: ${cal.label} resolves`);
        assert.ok(Object.isFrozen(r) && Object.isFrozen(r.events), 'frozen recording');
        assert.ok(EP_MANEUVERS[r.maneuver], `${r.maneuver}: maneuver card`);
        for (const lang of ['tr', 'en']) assert.ok(PACE_TEXT[lang].reasons[r.reason], `${r.reason}: ${lang} reason`);
        assert.ok(r.test.answer === null || PACE_ANSWERS.includes(r.test.answer));
        // No capture: never a route answer and never a diagnostic result.
        if (!r.test.captured) assert.equal(r.result, 'invalidCapture');
        if (r.result === 'invalidCapture') assert.equal(r.test.answer, null);
      }
    }
  }
}
assert.ok(count > 1000, `${count} protocols exercised`);

// Reproducible state: the same input gives the same recording; a different input changes it.
assert.equal(JSON.stringify(deliverPacing({ caseId: 'avnrt-typical', s2: 300 })), JSON.stringify(deliverPacing({ caseId: 'avnrt-typical', s2: 300 })));
assert.notEqual(JSON.stringify(deliverPacing({ caseId: 'avnrt-typical', s2: 300 }).events), JSON.stringify(deliverPacing({ caseId: 'avnrt-typical', s2: 310 }).events));
assert.equal(normalizePacing({ caseId: 'nope', s1: 999, s2: 999, count: 5, site: 'x', mode: 'y' }).s2, 500, 'inputs are clamped');

// Rows 1-3: normal node. AH rises with prematurity without a 50 ms step; block below the nodal refractory period; no capture below the atrial one.
let prev = null;
for (let s2 = 500; s2 >= 230; s2 -= 10) {
  const r = deliverPacing({ caseId: 'focal-at', s2 });
  assert.equal(r.test.answer, 'avn');
  const ah = m(r)['AH (S2)'];
  if (prev != null) assert.ok(ah >= prev && ah - prev < 50, `S2 ${s2}: continuous curve (${prev} -> ${ah})`);
  prev = ah;
}
const block = deliverPacing({ caseId: 'focal-at', s2: 220 });
assert.equal(block.reason, 'block');
assert.equal(block.test.answer, 'none');
assert.equal(first(block, 'his-d', 'A').length, 3, 'the blocked S2 still has its A');
assert.equal(first(block, 'his-d', 'H').length, 2, '... but no H');
const noCapture = deliverPacing({ caseId: 'focal-at', s2: ATRIAL_ERP - 10 });
assert.equal(noCapture.reason, 'noCapture');
assert.equal(first(noCapture, 'hra', 'S').length, 3, 'the stimulus is drawn');
assert.equal(first(noCapture, 'hra', 'A').length, 2, 'no atrial capture');
assert.equal(gradePacingAnswer(noCapture, 'avn'), 'unavailable');

// Row 4: incremental pacing. 1:1 at 400 with a rising AH; Wenckebach at 350 (progressive AH, then an A without H).
const oneToOne = deliverPacing({ caseId: 'focal-at', mode: 'incremental', s1: 400, count: 8 });
assert.equal(first(oneToOne, 'his-d', 'H').length, 8);
assert.ok(m(oneToOne)['AH (max)'] > m(oneToOne)['AH (1)']);
const wb = deliverPacing({ caseId: 'focal-at', mode: 'incremental', s1: 350, count: 8 });
assert.equal(wb.reason, 'wenckebach');
const ahs = first(wb, 'his-d', 'H').map((h, i) => h.t - first(wb, 'his-d', 'A')[i].t);
assert.ok(ahs[1] > ahs[0] && ahs[2] > ahs[1], `progressive AH ${ahs.join(', ')}`);
assert.ok(first(wb, 'his-d', 'H').length < first(wb, 'his-d', 'A').length, 'a blocked beat');
assert.equal(m(wb).PCL, 350);

// Nodal Wenckebach is found from the His channel even when a manifest pathway keeps conducting the V;
// AH (max) is the longest AH of the train, measured from the events.
for (const [caseId, s1] of [['ap-left-manifest', 300], ['ap-left-manifest', 330], ['avnrt-typical', 300], ['focal-at', 350]]) {
  const r = deliverPacing({ caseId, mode: 'incremental', site: 'hra', s1, count: 8 });
  const hs = first(r, 'his-d', 'H');
  const as = first(r, 'his-d', 'A');
  assert.equal(r.reason, 'wenckebach', `${caseId} ${s1}: nodal block found`);
  assert.ok(hs.length < as.length, `${caseId} ${s1}: an A without H`);
  const longest = Math.max(...hs.map((h) => {
    const a = as.filter((x) => x.t < h.t).pop();
    return Math.round(h.t - a.t);
  }));
  assert.equal(m(r)['AH (max)'], longest, `${caseId} ${s1}: AH (max) ${m(r)['AH (max)']} = ${longest}`);
}
// The drive beat before the window still ends inside it: its late V is drawn, its stimulus and A are not.
const shortDrive = deliverPacing({ caseId: 'focal-at', site: 'hra', s1: 350, count: 6, s2: 300 });
assert.ok(first(shortDrive, 'his-d', 'V')[0].t < first(shortDrive, 'hra', 'S')[0].t, 'late V of the earlier drive beat kept');
assert.equal(first(shortDrive, 'hra', 'S').length, 3);
// The window ends after the last H and V.
const lateH = deliverPacing({ caseId: 'ap-left-manifest', site: 'cs-dist', s1: 350, count: 4, s2: 310 });
assert.ok(Math.max(...Object.values(lateH.events).flat().map((e) => e.t)) <= lateH.windowMs - 40, 'no event clipped at the right edge');

// Row 5: dual physiology. 10 ms shorter S2 gives an AH jump of at least 50 ms; the comparison reads it from the events.
const fast = deliverPacing({ caseId: 'avnrt-typical', s2: 310 });
const slow = deliverPacing({ caseId: 'avnrt-typical', s2: 300 });
assert.equal(fast.test.route, 'fast');
assert.equal(slow.test.route, 'slow');
assert.equal(slow.test.answer, 'avn-slow');
const jump = compareExtrastimuli(fast, slow);
assert.ok(jump.jump && jump.dS2 === -10 && jump.dAH >= 50, `AH jump ${jump.dAH} ms`);
assert.equal(compareExtrastimuli(deliverPacing({ caseId: 'focal-at', s2: 310 }), deliverPacing({ caseId: 'focal-at', s2: 300 })).jump, false, 'no jump in a single pathway');
assert.equal(compareExtrastimuli(fast, deliverPacing({ caseId: 'avnrt-typical', s2: 300, site: 'cs-prox' })), null, 'different site: not comparable');
assert.equal(gradePacingAnswer(slow, 'avn'), 'partial');
assert.equal(gradePacingAnswer(slow, 'avn-slow'), 'correct');
assert.equal(gradePacingAnswer(fast, 'avn-slow'), 'incorrect');
assert.equal(slow.test.echo, null, 'jump without echo at 300');

// Row 6: echo at a critical AH, concentric (His earliest), a single atrial echo and no tachycardia.
const echo = deliverPacing({ caseId: 'avnrt-typical', s2: 290 });
assert.equal(echo.reason, 'echoAvn');
assert.equal(echo.test.echoFirst, 'his-p');
assert.equal(first(echo, 'his-d', 'A').length, 4, 'three paced A and one echo');
assert.equal(first(echo, 'his-d', 'H').length, 3, 'no ventricular beat after the echo');

// Rows 7-8: manifest pathway. Fusion from the HRA, full preexcitation and a shorter stimulus-to-delta from the distal CS.
const hra = deliverPacing({ caseId: 'ap-left-manifest', site: 'hra', s2: 500 });
const csProx = deliverPacing({ caseId: 'ap-left-manifest', site: 'cs-prox', s2: 500 });
const csDist = deliverPacing({ caseId: 'ap-left-manifest', site: 'cs-dist', s2: 500 });
assert.equal(hra.test.answer, 'fusion');
assert.equal(csDist.test.answer, 'ap');
assert.ok(hra.test.preexcitation < csProx.test.preexcitation && csProx.test.preexcitation <= csDist.test.preexcitation, 'preexcitation grows toward the pathway');
assert.ok(m(csDist)['S-delta (S2)'] < m(csProx)['S-delta (S2)'] && m(csProx)['S-delta (S2)'] < m(hra)['S-delta (S2)'], 'shorter stimulus-to-delta near the pathway');
assert.ok(m(csDist)['HV (S2)'] < 0, 'His V before the H with full preexcitation');
assert.equal(m(hra)['HV (S2)'] > 30, true, 'His-channel HV stays near normal with modest fusion');

// Row 9: non-decremental pathway. Earlier S2: AH longer, stimulus-to-delta unchanged, preexcitation larger.
const late = deliverPacing({ caseId: 'ap-left-manifest', s2: 400 });
const early = deliverPacing({ caseId: 'ap-left-manifest', s2: 280 });
assert.equal(m(late)['S-delta (S2)'], m(early)['S-delta (S2)']);
assert.ok(m(early)['AH (S2)'] > m(late)['AH (S2)']);
assert.ok(early.test.preexcitation > late.test.preexcitation);

// Row 10: below the pathway's refractory period the delta is lost, conduction is nodal (HV 45), then an eccentric echo.
const apErp = deliverPacing({ caseId: 'ap-left-manifest', s2: 260 });
assert.equal(apErp.reason, 'apRefractoryEcho');
assert.equal(apErp.test.answer, 'avn');
assert.equal(first(apErp, 'ecg-ii', 'delta').length, 2, 'delta on the two S1 beats, not on S2');
assert.equal(m(apErp)['HV (S2)'], 45);
assert.equal(apErp.test.echoFirst, 'cs-12', 'eccentric echo, CS 1-2 earliest');
assert.deepEqual(pacingScene(apErp), { paths: ['avn'], circuit: 'orthodromic' });
assert.deepEqual(pacingScene(csDist).paths, ['avn', 'ap']);

// Row 11: concealed pathway. Never a delta; a long AH brings an eccentric echo; the answer is the node.
for (let s2 = 500; s2 >= 240; s2 -= 20) assert.equal(first(deliverPacing({ caseId: 'ap-left-lateral', s2 }), 'ecg-ii', 'delta').length, 0);
const concealed = deliverPacing({ caseId: 'ap-left-lateral', s2: 300 });
assert.equal(concealed.test.echo, 'ap');
assert.equal(concealed.test.echoFirst, 'cs-12');
assert.equal(concealed.test.answer, 'avn');
assert.equal(deliverPacing({ caseId: 'ap-left-lateral', s2: 400 }).reason, 'concealed');
assert.equal(pacingScene(deliverPacing({ caseId: 'ap-inf-paraseptal', s2: 340 })).circuit, null, 'the left free wall circuit is not drawn for a septal pathway');

// Every answer has TR/EN labels and "cannot tell" notes; text and code carry no em dash.
for (const lang of ['tr', 'en']) for (const a of PACE_ANSWERS) {
  assert.ok(PACE_TEXT[lang].answers[a] && PACE_TEXT[lang].cannot[a], `${a} ${lang}`);
}
for (const lang of ['tr', 'en']) for (const mode of PACE_MODES) assert.ok(PACE_TEXT[lang].modes[mode]);
for (const file of ['../src/ep-pacing-lab.js', '../src/ep-pacing-text.js', '../src/ep-pacing-panel.js', '../research/EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log(`PASS ep-pacing: ${count} protocols, storyboard rows 1-11 from events, AH jump comparison, capture/no-capture, Wenckebach, preexcitation by site and prematurity, pathway refractoriness, concentric/eccentric echo, 3D routes`);
