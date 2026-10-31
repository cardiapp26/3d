// Drugs and substrate variants of the live EP laboratory (ep-live-model.js, ep-live-substrates.js)
// and the coach (ep-live-coach.js): isoproterenol and atropine rescale the case timings, a jump-only
// and an echo-only AVNRT become inducible on drugs, VA block opens on isoproterenol, a sinus
// tachycardia is not read as an induced one, and the coach names the finding and the next step.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveHeart, LIVE_CASES, DRUGS } from '../../src/eps/ep-live-model.js';
import { planProgrammed, placeDrive, driveStart, analyzeDrive, driveEnds, markJumps, summarizeProgrammed } from '../../src/eps/ep-live-stim.js';
import { notesAfterRun, noteForDrug, addNotes, COACH_MAX } from '../../src/eps/ep-live-coach.js';
import { LIVE_TEXT, LIVE_CASE_TEXT } from '../../src/eps/ep-live-text.js';

function run(caseId, settings, drugs = []) {
  const heart = createLiveHeart(caseId);
  for (const d of drugs) heart.setDrug(d, true);
  heart.advanceTo(2500);
  const rows = [];
  for (const p of planProgrammed(settings)) {
    const now = heart.now();
    const d = placeDrive(p, driveStart(heart.events(now - 3000, now), now, p.site, p.s1));
    heart.stimulate(d.stims);
    heart.advanceTo(d.end);
    const r = analyzeDrive(heart.events(d.stims[0].t - 100, d.end), d);
    rows.push(r);
    if (driveEnds(r)) break;
  }
  return { rows: markJumps(rows), sum: summarizeProgrammed(rows), heart };
}
const atrial = (s1) => ({ site: 'hra', s1, n: 8, extras: [400], step: 10, limit: 200 });
const rvRun = (s1) => ({ site: 'rv', s1, n: 8, extras: [s1 - 20], step: 20, limit: 200 });

// ---- Drug factors: on and off, combined, ablated elements stay gone ----
const h = createLiveHeart('avnrt-typical');
assert.equal(h.param('sinusCl'), 800);
assert.equal(h.setDrug('digoxin', true), false, 'unknown drug refused');
h.setDrug('iso', true);
assert.equal(h.param('sinusCl'), Math.round(800 * DRUGS.iso.sinusCl));
assert.equal(h.param('fp.retroErp'), Math.round(250 * DRUGS.iso['fp.retroErp']));
h.setDrug('atropine', true);
assert.equal(h.param('sinusCl'), Math.round(800 * DRUGS.iso.sinusCl * DRUGS.atropine.sinusCl), 'factors multiply');
assert.equal(h.param('vErp'), Math.round(240 * DRUGS.iso.vErp), 'atropine leaves the ventricle alone');
h.setDrug('iso', false); h.setDrug('atropine', false);
assert.equal(h.param('sinusCl'), 800, 'back to the case value');
assert.deepEqual(h.drugs(), { iso: false, atropine: false });
const abl = createLiveHeart('avnrt-typical');
abl.rfStart('slow-pathway', 0); abl.advanceTo(5000);
abl.setDrug('iso', true);
assert.equal(abl.param('sp.erp'), null, 'an ablated slow pathway stays gone on the drug');
const sinus = createLiveHeart('normal');
sinus.setDrug('iso', true); sinus.advanceTo(9000);
const pp = sinus.events(4000, 9000).hra.filter((e) => e.type === 'A').map((e) => e.t);
assert.ok(pp.slice(1).every((t, i) => Math.round(t - pp[i]) === 560), 'sinus cycle 560 ms on isoproterenol');
assert.equal(LIVE_CASES.normal.sinusCl, 800, 'case table not changed by a drug');

// ---- Sinus tachycardia on isoproterenol is not an induced tachycardia ----
const normalIso = run('normal', atrial(500), ['iso']);
assert.equal(normalIso.sum.induced, null, 'normal heart on isoproterenol: nothing induced');
assert.ok(normalIso.sum.nodeErp != null);

// ---- Jump only: dual physiology, no echo; echoes on isoproterenol; AVNRT on both drugs ----
const jump = run('avnrt-jump', atrial(600));
assert.equal(jump.sum.jump, 370);
assert.equal(jump.sum.echo, null);
assert.equal(jump.sum.induced, null);
const jumpIso = run('avnrt-jump', atrial(500), ['iso']);
assert.ok(jumpIso.sum.echo != null && jumpIso.sum.induced == null, `echo only on isoproterenol ${JSON.stringify(jumpIso.sum)}`);
const jumpBoth = run('avnrt-jump', atrial(400), ['iso', 'atropine']);
assert.ok(jumpBoth.sum.induced != null, 'AVNRT on isoproterenol and atropine');

// ---- Echo only: single echoes at baseline, AVNRT on isoproterenol or atropine ----
const echo = run('avnrt-echo', atrial(600));
assert.equal(echo.sum.echo, 370);
assert.equal(echo.sum.induced, null);
assert.equal(echo.sum.reason, 'erp');
const echoIso = run('avnrt-echo', atrial(500), ['iso']);
assert.equal(echoIso.sum.induced, 300);
assert.equal(echoIso.sum.jump, 300);
assert.ok(run('avnrt-echo', atrial(600), ['atropine']).sum.induced != null, 'atropine is enough here');

// ---- VA block: none at baseline or on atropine; 1:1 concentric VA on isoproterenol ----
const va = run('va-block', rvRun(400));
assert.ok(va.rows.every((r) => r.va == null), 'no VA at baseline');
assert.ok(run('va-block', rvRun(500), ['atropine']).rows.every((r) => r.va == null), 'atropine alone does not open it');
const vaIso = run('va-block', rvRun(500), ['iso']);
assert.equal(vaIso.rows[0].va, 145);
assert.equal(vaIso.rows[0].retro, 'avn-fast');
assert.ok(vaIso.sum.vaBlock != null && vaIso.sum.vaBlock < 480);

// ---- Coach ----
const keys = (notes) => notes.map((n) => n.key);
assert.deepEqual(keys(notesAfterRun(jump.rows, jump.sum, { drugs: {} })), ['jumpOnly']);
assert.equal(notesAfterRun(jump.rows, jump.sum, { drugs: {} })[0].drug, 'iso', 'suggests isoproterenol first');
assert.equal(notesAfterRun(jumpIso.rows, jumpIso.sum, { drugs: { iso: true } })[0].key, 'echoOnly');
assert.equal(notesAfterRun(jumpIso.rows, jumpIso.sum, { drugs: { iso: true } })[0].drug, 'atropine', 'then atropine');
assert.equal(notesAfterRun(echo.rows, echo.sum, { drugs: { iso: true, atropine: true } })[0].drug, null, 'no drug left');
assert.deepEqual(keys(notesAfterRun(echoIso.rows, echoIso.sum, { drugs: { iso: true } })), ['inducedOnDrug']);
assert.deepEqual(keys(notesAfterRun(run('avnrt-typical', atrial(600)).rows, run('avnrt-typical', atrial(600)).sum)), ['induced']);
assert.deepEqual(keys(notesAfterRun(run('normal', atrial(600)).rows, run('normal', atrial(600)).sum)), ['noDual']);
assert.deepEqual(keys(notesAfterRun(va.rows, va.sum, { drugs: {} })), ['noVa']);
assert.deepEqual(keys(notesAfterRun(vaIso.rows, vaIso.sum, { drugs: { iso: true } })), ['vaNodal']);
const ort = run('ort-left', rvRun(600));
assert.deepEqual(keys(notesAfterRun(ort.rows.filter((r) => !r.sustained), summarizeProgrammed(ort.rows.filter((r) => !r.sustained)))), ['vaEccentric']);
// A train slower than the sinus node: the first drive does not capture.
const slow = { capture: false, sustained: false, ventricular: false, ah: null, coupling: 400, label: 'S2' };
assert.equal(notesAfterRun([slow], summarizeProgrammed([slow]), { s1: 600, sinusCl: 560 })[0].key, 'syncS1');
assert.deepEqual(notesAfterRun([], null), []);
// Log: newest first, an older copy of the same note dropped, capped.
let log = addNotes([], [noteForDrug('iso', true, 560)]);
log = addNotes(log, [{ key: 'noDual' }]);
log = addNotes(log, [noteForDrug('iso', true, 560)]);
assert.deepEqual(keys(log), ['drugOn', 'noDual']);
assert.equal(addNotes(log, []), log, 'nothing new, same log');
for (let i = 0; i < 8; i++) log = addNotes(log, [{ key: 'noDual', drug: i }]);
assert.equal(log.length, COACH_MAX);

// ---- Texts: every note key and every case in both languages, no em dash ----
for (const lang of ['tr', 'en']) {
  const c = LIVE_TEXT[lang].coach;
  for (const k of ['syncS1', 'induced', 'inducedOnDrug', 'echoOnly', 'jumpOnly', 'noDual', 'noVa', 'vaNodal', 'vaEccentric', 'vaSeptalAp', 'drugOn', 'drugOff']) {
    assert.equal(typeof c[k]({ label: 'S2', coupling: 300, drug: 'iso', sinusCl: 560, s1: 600, vaBlock: 440 }), 'string', `${lang} ${k}`);
  }
  for (const id of Object.keys(LIVE_CASES)) assert.ok(LIVE_CASE_TEXT[id]?.[lang]?.name, `${lang} name of ${id}`);
}
for (const f of ['ep-live-coach.js', 'ep-live-text.js', 'ep-live-substrates.js', 'ep-live-model.js']) {
  assert.ok(!readFileSync(new URL(`../../src/eps/${f}`, import.meta.url), 'utf8').includes(String.fromCharCode(0x2014)), `no em dash in ${f}`);
}

console.log('PASS ep-live-drugs: isoproterenol and atropine factors (on, off, combined, ablated element), no sinus tachycardia read as induced, jump-only / echo-only AVNRT inducible on drugs, VA block opened by isoproterenol, coach notes and log');
