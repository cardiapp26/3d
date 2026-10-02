// Live EP laboratory model (src/ep-live-model.js): sinus intervals, the
// stimulator train, AV nodal jump and AVNRT induction from refractoriness,
// atypical AVNRT, orthodromic AVRT and PJRT, pre-excitation and pre-excited
// AF, focal AT, CTI flutter, scar VT, RF lesions, cardioversion and determinism. All values are read back
// from the generated events.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveHeart, planTrain, liveIntervals, LIVE_CASES } from '../src/ep-live-model.js';

const times = (e, ch, type) => (e[ch] || []).filter((x) => x.type === type).map((x) => x.t);
const run = (caseId, train, until) => { const h = createLiveHeart(caseId); h.stimulate(train); h.advanceTo(until); return h; };
const train = (site, s2, s1 = 600) => planTrain({ site, start: 1000, s1, n: 8, extras: [s2] });
const lastCl = (h, until) => { const v = times(h.events(until - 2000, until), 'rv', 'V'); return Math.round(v[v.length - 1] - v[v.length - 2]); };

// Stimulator: S1 × n then the coupled extrastimuli; 0 stops the list.
assert.deepEqual(planTrain({ site: 'hra', start: 100, s1: 500, n: 3, extras: [300, 0, 250] }).map((s) => s.t), [100, 600, 1100, 1400]);
assert.deepEqual(planTrain({ site: 'nope', start: 0, s1: 500, n: 3 }), []);

// Sinus: PP = RR 800, AH ~75, HV 45, no VA.
const sinus = run('normal', [], 6000);
const iv = liveIntervals(sinus.events(4000, 6000));
assert.equal(iv.pp, 800); assert.equal(iv.rr, 800); assert.equal(iv.hv, 45); assert.ok(iv.ah >= 70 && iv.ah <= 85, `AH ${iv.ah}`); assert.equal(iv.va, null);

// AVNRT substrate: S2 at 390 conducts over the fast pathway (no jump, no tachycardia);
// S2 at 370 meets a refractory fast pathway: slow-pathway AH jump and sustained typical AVNRT.
const ahOf = (h, k) => { const b = h.beats().filter((x) => x.origin === 'his' && x.v > 1000); return Math.round(b[k].h - b[k].aJunction); };
const noJump = run('avnrt-typical', train('hra', 390), 9000);
assert.ok(ahOf(noJump, 8) < 200, `S2 390: fast pathway AH ${ahOf(noJump, 8)}`);
assert.equal(lastCl(noJump, 9000), 800, 'S2 390: sinus resumes');
const induced = run('avnrt-typical', train('hra', 370), 9000);
assert.ok(ahOf(induced, 8) - ahOf(induced, 7) >= 50, `S2 370: AH jump ${ahOf(induced, 7)} -> ${ahOf(induced, 8)}`);
assert.ok(Math.abs(lastCl(induced, 9000) - 348) <= 5, `AVNRT CL ${lastCl(induced, 9000)}`);
const avnrt = liveIntervals(induced.events(7000, 9000));
assert.ok(avnrt.va != null && avnrt.va <= 40, `AVNRT VA ${avnrt.va}`);
const lastA = (h, ch) => times(h.events(8200, 9000), ch, 'A').pop();
assert.ok(lastA(induced, 'his-d') < lastA(induced, 'cs-12'), 'AVNRT: concentric (His before distal CS)');

// Atrial ERP: an S2 inside it does not capture (no A follows the stimulus).
const refractory = run('avnrt-typical', train('hra', 200), 6000);
const s2 = times(refractory.events(0, 6000), 'hra', 'S').pop();
assert.ok(!times(refractory.events(s2, s2 + 60), 'hra', 'A').length, 'S2 inside the atrial ERP: no capture');

// Normal conduction: no extrastimulus induces a tachycardia.
for (const c of [450, 350, 300, 250]) assert.equal(lastCl(run('normal', train('hra', c), 9000), 9000), 800, `normal: S2 ${c} induces nothing`);

// Concealed left lateral pathway: ventricular S2 250 induces orthodromic AVRT, eccentric and with a long VA.
const ort = run('ort-left', train('rv', 250), 9000);
const ortIv = liveIntervals(ort.events(7000, 9000));
assert.ok(lastCl(ort, 9000) > 280 && lastCl(ort, 9000) < 380, `ORT CL ${lastCl(ort, 9000)}`);
assert.ok(ortIv.va >= 100, `ORT VA ${ortIv.va}`);
assert.ok(lastA(ort, 'cs-12') < lastA(ort, 'his-d'), 'ORT: eccentric (distal CS first)');
// In sinus rhythm the pathway is concealed: no retrograde A after the V.
assert.equal(liveIntervals(run('ort-left', [], 6000).events(4000, 6000)).va, null);

// Manifest pathway: pre-excited sinus beats (short HV, delta on II).
const wpw = run('wpw-left', [], 6000);
assert.ok(liveIntervals(wpw.events(4000, 6000)).hv < 25, 'WPW: short HV');
assert.ok(times(wpw.events(0, 6000), 'ecg-ii', 'delta').length >= 5, 'WPW: delta wave every beat');

// Cardioversion ends the tachycardia; sinus resumes.
const shocked = run('avnrt-typical', train('hra', 370), 7000);
shocked.cardiovert(7000); shocked.advanceTo(12000);
assert.equal(lastCl(shocked, 12000), 800, 'cardioversion: sinus rhythm');

// ---- Phase 2 substrates ----
const rrs = (h, a, b) => { const v = times(h.events(a, b), 'rv', 'V'); return v.slice(1).map((x, i) => Math.round(x - v[i])); };
const aSeqEarliest = (h, from, to) => { const chs = ['hra', 'his-d', 'cs-910', 'cs-56', 'cs-12']; const last = Object.fromEntries(chs.map((c) => [c, times(h.events(from, to), c, 'A').pop()])); return chs.reduce((a, b) => (last[a] <= last[b] ? a : b)); };

// Atypical AVNRT: ventricular pacing, retrograde over the slow pathway; long VA, CS ostium earliest.
const atyp = run('avnrt-atypical', train('rv', 330), 9000);
const atypIv = liveIntervals(atyp.events(7000, 9000));
assert.ok(lastCl(atyp, 9000) > 380 && lastCl(atyp, 9000) < 450 && atypIv.va > 200, `atypical AVNRT ${lastCl(atyp, 9000)} VA ${atypIv.va}`);
assert.equal(aSeqEarliest(atyp, 8400, 9000), 'cs-910', 'atypical AVNRT: CS ostium earliest');
// In sinus rhythm the antegrade wave collides in the slow pathway: no echo.
assert.equal(liveIntervals(run('avnrt-atypical', [], 6000).events(4000, 6000)).va, null);

// PJRT: long VA over a decremental posteroseptal pathway.
const pj = run('pjrt', train('hra', 280), 9000);
assert.ok(liveIntervals(pj.events(7000, 9000)).va > 180, 'PJRT: long VA');
assert.equal(aSeqEarliest(pj, 8400, 9000), 'cs-910', 'PJRT: posteroseptal earliest');

// Focal AT: a burst at 400 does not trigger, at 300 the focus runs at 380 with eccentric activation.
assert.equal(lastCl(run('at-focal', planTrain({ site: 'hra', start: 1000, s1: 400, n: 8 }), 9000), 9000), 800);
const at = run('at-focal', planTrain({ site: 'hra', start: 1000, s1: 300, n: 8 }), 9000);
assert.ok(at.status().atActive && rrs(at, 7000, 9000).every((x) => Math.abs(x - 380) <= 2), 'AT at 380');
assert.equal(aSeqEarliest(at, 8400, 9000), 'cs-12', 'AT: distal CS earliest');
// An automatic focus survives cardioversion; focus ablation ends it.
at.cardiovert(9000); at.advanceTo(13000);
assert.ok(at.status().atActive, 'AT resumes after a shock');
at.rfStart('la-focus', 13000); at.advanceTo(21000);
assert.ok(!at.status().atActive && rrs(at, 18500, 21000).every((x) => x === 800), 'focus ablation: sinus');

// Typical flutter: rapid atrial pacing, atrial 240 with 2:1 conduction; F waves; CTI ablation ends it.
const fl = run('flutter-cti', planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }), 9000);
assert.ok(fl.status().flutterActive, 'flutter induced');
assert.deepEqual([...new Set(rrs(fl, 7000, 9000))], [480], '2:1 conduction');
assert.ok(times(fl.events(7000, 9000), 'ecg-ii', 'F').length >= 7, 'saw-tooth F waves');
fl.rfStart('cti', 9000); fl.advanceTo(15000);
assert.ok(!fl.status().flutterActive && !fl.status().flutter, 'CTI ablation');
fl.stimulate(planTrain({ site: 'hra', start: 15500, s1: 250, n: 8 })); fl.advanceTo(22000);
assert.ok(!fl.status().flutterActive, 'not inducible after CTI block');

// Scar VT: RV S2 + S3; wide beats at 380 with AV dissociation; cardioversion ends it.
const vt = run('vt-scar', planTrain({ site: 'rv', start: 1000, s1: 600, n: 8, extras: [280, 260] }), 12000);
assert.ok(vt.status().vtActive, 'VT induced');
const vtBeats = vt.beats().filter((b) => b.v > 7000);
assert.ok(vtBeats.filter((b) => b.origin === 'vt').length > vtBeats.length * 0.7, 'mostly VT beats');
assert.equal(liveIntervals(vt.events(10000, 12000)).pp, 800, 'sinus A continues: AV dissociation');
assert.equal(lastCl(run('vt-scar', train('rv', 300), 9000), 9000), 800, 'single S2 does not induce VT');
vt.cardiovert(12000); vt.advanceTo(16000);
assert.ok(!vt.status().vtActive && lastCl(vt, 16000) === 800, 'VT cardioverted');

// Pre-excited AF: rapid atrial pacing in WPW; irregular, mostly pre-excited RR.
const af = run('wpw-left', planTrain({ site: 'hra', start: 1000, s1: 240, n: 10 }), 12000);
assert.ok(af.status().afActive, 'AF induced');
const afRr = rrs(af, 7000, 12000);
assert.ok(new Set(afRr).size >= 4 && Math.max(...afRr) - Math.min(...afRr) > 40, `irregular RR ${afRr.join(',')}`);
assert.ok(af.beats().filter((b) => b.v > 7000 && b.origin === 'ap').length >= afRr.length * 0.5, 'mostly pre-excited');

// RF: slow pathway ablation ends AVNRT (junctional beat during RF) and makes it non-inducible.
const sp = run('avnrt-typical', train('hra', 370), 8000);
sp.rfStart('slow-pathway', 8000); sp.advanceTo(12500); sp.rfStop(); sp.advanceTo(14000);
assert.ok(sp.beats().some((b) => b.v > 8000 && b.v < 12100 && b.aJunction == null && b.origin === 'his'), 'junctional beat during RF');
assert.ok(!sp.status().sp && rrs(sp, 13000, 14000).every((x) => x > 700), 'AVNRT ended');
sp.stimulate(planTrain({ site: 'hra', start: 14500, s1: 600, n: 8, extras: [340] })); sp.advanceTo(22000);
assert.equal(lastCl(sp, 22000), 800, 'non-inducible after slow-pathway ablation');
// RF stopped early: no lesion. Wrong site: no effect. Compact node: complete AV block, escape rhythm.
const early = run('avnrt-typical', [], 3000); early.rfStart('slow-pathway', 3000); early.advanceTo(5000); early.rfStop(); early.advanceTo(9000);
assert.ok(early.status().sp && early.lesions().length === 0, 'RF stopped before 4 s: no lesion');
const wrong = run('ort-left', train('rv', 250), 8000); wrong.rfStart('posteroseptal', 8000); wrong.advanceTo(13000);
assert.equal(wrong.lesions()[0].effect, null); assert.ok(lastCl(wrong, 13000) < 400, 'ORT continues after RF at the wrong site');
const block = run('normal', [], 2000); block.rfStart('compact-node', 2000); block.advanceTo(12000);
assert.ok(block.status().avBlock && rrs(block, 7000, 12000).every((x) => x === 1700), 'complete AV block, escape at 1700');
assert.ok(liveIntervals(block.events(10000, 12000)).pp === 800, 'atria continue at the sinus rate');

// Determinism: same case and train, same events.
assert.deepEqual(run('avnrt-typical', train('hra', 340), 6000).events(0, 6000), run('avnrt-typical', train('hra', 340), 6000).events(0, 6000));
assert.ok(Object.keys(LIVE_CASES).length >= 4);

for (const f of ['../src/ep-live-model.js', '../src/ep-live-panel.js']) assert.ok(!readFileSync(new URL(f, import.meta.url), 'utf8').includes('\u2014'), `${f}: no em dash`);
console.log('PASS ep-live: stimulator, sinus, AH jump/AVNRT, atypical AVNRT, ORT, PJRT, WPW and pre-excited AF, focal AT (survives DC), CTI flutter 2:1, scar VT with AV dissociation, RF lesions (slow pathway, CTI, focus, wrong site, compact node block), cardioversion, determinism');
