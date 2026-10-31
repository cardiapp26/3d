// Programmed stimulation (ep-live-stim.js) on the live heart: drive trains synced to the last
// spontaneous beat, the last extrastimulus decremented each drive, and the readouts (atrial and
// AV nodal ERP, AH jump with echo and AVNRT induction, VERP and VA block, CS bipole pacing).
import assert from 'node:assert/strict';
import { createLiveHeart, LIVE_SITES, SITE_CHANNEL, originOf } from '../../src/eps/ep-live-model.js';
import { normalizeStim, planProgrammed, placeDrive, driveStart, analyzeDrive, driveEnds, markJumps, summarizeProgrammed, STIM_RANGE } from '../../src/eps/ep-live-stim.js';

// Settings are clamped; extrastimuli stop at the first 0.
const n = normalizeStim({ site: 'nowhere', s1: 50, n: 99, extras: [380, 0, 300], step: 0, limit: 1000, rest: 0 });
assert.deepEqual(n, { site: 'hra', s1: STIM_RANGE.s1[0], n: STIM_RANGE.n[1], extras: [380], step: STIM_RANGE.step[0], limit: STIM_RANGE.limit[1], rest: STIM_RANGE.rest[0] });

// Plan: one drive per step, only the last extrastimulus shortens, readout until the next drive.
const plan = planProgrammed({ site: 'hra', s1: 600, n: 8, extras: [400, 300], step: 20, limit: 200, rest: 2 });
assert.equal(plan.length, 6);
assert.deepEqual(plan.map((d) => d.couplings), [[400, 300], [400, 280], [400, 260], [400, 240], [400, 220], [400, 200]]);
assert.equal(plan[0].stims.length, 10);
assert.equal(plan[0].stims[9].t - plan[0].stims[8].t, 300);
assert.equal(plan[0].end, plan[0].stims[9].t + 2000 - 50);
assert.deepEqual(planProgrammed({ extras: [0] }), [], 'no extrastimulus, no run');
const placed = placeDrive(plan[1], 5000);
assert.equal(placed.stims[0].t, 5000);
assert.equal(placed.end, plan[1].end + 5000);
assert.equal(plan[1].stims[0].t, 0, 'placing does not change the plan');

// The first S1 comes one drive cycle after the last spontaneous atrial beat.
const sync = driveStart({ hra: [{ type: 'A', t: 900 }, { type: 'A', t: 1700 }] }, 2000, 'hra', 600);
assert.equal(sync, 2300);
assert.equal(driveStart({}, 2000, 'rv', 600), 2100);

// Every CS bipole is a pacing site and activates first itself, its neighbours 10 ms per bipole later.
for (const site of ['cs-78', 'cs-56', 'cs-34']) {
  const o = originOf(site), ch = SITE_CHANNEL[site];
  assert.ok(LIVE_SITES.includes(site));
  assert.equal(Math.min(...['cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'].map((c) => o[c])), o[ch], `${site} earliest`);
}
assert.ok(originOf('cs-56').hra > originOf('cs-prox').hra && originOf('cs-56').hra < originOf('cs-dist').hra);

function run(caseId, settings) {
  const heart = createLiveHeart(caseId);
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
  heart.stopPacing();
  return { rows: markJumps(rows), sum: summarizeProgrammed(rows), heart };
}

// Typical AVNRT: AH lengthens, jumps (fast to slow pathway), echoes and the tachycardia starts; the run stops.
const avnrt = run('avnrt-typical', { site: 'hra', s1: 600, n: 8, extras: [400], step: 10, limit: 200 });
const jumpRow = avnrt.rows.find((r) => r.jump);
assert.ok(jumpRow && jumpRow.path === 'slow' && jumpRow.echo && jumpRow.sustained, JSON.stringify(avnrt.rows));
assert.equal(avnrt.sum.reason, 'induced');
assert.equal(avnrt.sum.jump, avnrt.sum.induced);
assert.ok(avnrt.rows.slice(0, -1).every((r) => r.path === 'fast' && !r.echo));
assert.ok(avnrt.heart.status().sp, 'slow pathway still present');
// The same from the proximal CS.
assert.equal(run('avnrt-typical', { site: 'cs-prox', extras: [400] }).sum.reason, 'induced');

// Normal heart: AV nodal ERP (atrial capture without His) before the atrial ERP; no jump or echo.
const normal = run('normal', { site: 'hra', extras: [400] });
assert.equal(normal.sum.reason, 'erp');
assert.ok(normal.sum.nodeErp > normal.sum.erp, JSON.stringify(normal.sum));
assert.equal(normal.sum.jump, null);
assert.equal(normal.sum.echo, null);
for (let i = 1; i < normal.rows.length; i++) if (normal.rows[i].ah != null && normal.rows[i - 1].ah != null) assert.ok(normal.rows[i].ah >= normal.rows[i - 1].ah, 'decremental AV node');
// A mid CS bipole measures the same AV nodal ERP.
assert.equal(run('normal', { site: 'cs-56', extras: [400] }).sum.nodeErp, normal.sum.nodeErp);
// S3 decremented after a fixed S2.
const s3 = run('normal', { site: 'hra', extras: [400, 300] });
assert.equal(s3.sum.label, 'S3');
assert.ok(s3.rows.every((r) => r.label === 'S3'));

// RV extrastimuli: VA conduction, then retrograde block, then the ventricular ERP.
const rv = run('normal', { site: 'rv', extras: [400] });
assert.equal(rv.sum.ventricular, true);
assert.ok(rv.rows[0].va > 0 && rv.rows[0].retro === 'avn-fast');
assert.ok(rv.sum.vaBlock > rv.sum.erp, JSON.stringify(rv.sum));
// Orthodromic AVRT: VA over the pathway at every coupling until the tachycardia starts.
const ort = run('ort-left', { site: 'rv', extras: [400] });
assert.equal(ort.sum.reason, 'induced');
assert.ok(ort.rows.every((r) => r.retro === 'ap-left'));
assert.equal(ort.sum.erp, null, 'loss of capture during the tachycardia is not an ERP');

console.log(`PASS ep-live-stim: clamped settings, decremental drive plans, sinus-synced trains, CS bipole sites, AVNRT jump/echo/induction (HRA, CS), AERP and AV nodal ERP, S3, VERP and VA block, ORT induction`);
