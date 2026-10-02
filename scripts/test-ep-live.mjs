// Live EP laboratory model (src/ep-live-model.js): sinus intervals, the
// stimulator train, AV nodal jump and AVNRT induction from refractoriness,
// orthodromic AVRT over a concealed pathway, pre-excitation, atrial ERP,
// termination by cardioversion and determinism. All values are read back
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

// Determinism: same case and train, same events.
assert.deepEqual(run('avnrt-typical', train('hra', 340), 6000).events(0, 6000), run('avnrt-typical', train('hra', 340), 6000).events(0, 6000));
assert.ok(Object.keys(LIVE_CASES).length >= 4);

for (const f of ['../src/ep-live-model.js', '../src/ep-live-panel.js']) assert.ok(!readFileSync(new URL(f, import.meta.url), 'utf8').includes('\u2014'), `${f}: no em dash`);
console.log('PASS ep-live: stimulator train, sinus intervals, AH jump and AVNRT induction, atrial ERP, ORT over a concealed pathway, pre-excitation, cardioversion, determinism');
