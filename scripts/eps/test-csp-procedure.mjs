// CSP implant procedure (src/eps/csp/csp-procedure.mjs) and live recorder (csp-live.mjs):
// site, sheath and turns map onto the signal model; the criteria read the recording.
import assert from 'node:assert/strict';
import { simulate } from '../../src/eps/csp/csp-model.mjs';
import { initialProcedure, act, modelOf, stageOf, criteria, confirmation, acceptCheck, guidance, startThreshold, thresholdBeat, testFromRows, lbbThresholdOf, summary, offsetOf, thicknessOf, fromModel, rapidAllowed, anatomyOf, relAngle, ANATOMY, CUTOFFS, HEARTS } from '../../src/eps/csp/csp-procedure.mjs';
import { programmedSweep, thresholdSweep } from '../../src/eps/csp/csp-model.mjs';
import { coaching } from '../../src/eps/csp/csp-coaching.mjs';
import { trendPoint, pushTrend, trendDelta } from '../../src/eps/csp/csp-trends.mjs';
import { createRecorder, advance, beatFromResult } from '../../src/eps/csp/csp-live.mjs';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const run = (proc, actions) => actions.reduce((p, a) => act(p, a).proc, proc);
const status = (list, id) => list.find(c => c.id === id).status;
const onTarget = (caseId, seed) => { const p0 = initialProcedure(caseId, seed); return run(p0, [...Array(5).fill({ type: 'torque', delta: 10 }), { type: 'site', level: anatomyOf(p0).lbb }]); };
const screwIn = (caseId, turns = 8, seed) => run(onTarget(caseId, seed), Array(turns).fill({ type: 'rotate', turns: 1 }));

test('start: tip on the anterior free wall, wide QRS, guidance to torque counter-clockwise', () => {
  const p = initialProcedure();
  assert.ok(offsetOf(p.sheath) < -.5 && thicknessOf(p) === 5);
  const r = simulate(modelOf(p));
  assert.equal(r.capture.type, 'rv'); assert.ok(r.metrics.qrsDuration > 160);
  assert.equal(guidance(p, r, criteria(r, p)).key, 'offAnterior');
  assert.equal(stageOf(p), 0);
});
test('torque and site bring the pace map: stage 1, septal level sets the limb-lead axis', () => {
  const p = onTarget('baseline');
  assert.equal(p.sheath, 0); assert.equal(stageOf(p), 1);
  const r = simulate(modelOf(p));
  assert.equal(guidance(p, r, criteria(r, p)).key, 'paceMapOk');
  const basal = simulate(modelOf({ ...p, level: .1 })), apical = simulate(modelOf({ ...p, level: .8 }));
  const peak = (values, sign) => Math.max(...values.slice(55, 250).map(v => sign * v));
  assert.ok(peak(basal.leads.III, 1) > peak(basal.leads.III, -1), 'basal septum: III positive');
  assert.ok(peak(apical.leads.II, -1) > peak(apical.leads.II, 1), 'apical septum: II negative');
});
test('turns advance the helix, the V1 notch becomes a terminal r′ and LBB capture meets the criteria', () => {
  let p = onTarget('baseline');
  const seen = [], rPrime = [];
  for (let i = 0; i < 8; i++) {
    p = act(p, { type: 'rotate', turns: 1 }).proc;
    const r = simulate(modelOf(p)); seen.push(r.capture.type); rPrime.push(status(criteria(r, p), 'terminalR'));
  }
  assert.equal(seen[0], 'rv'); assert.equal(seen.at(-1), 'nonselective');
  assert.ok(seen.includes('deep'));
  // The terminal r' appears with the LV septal layer, not with the mid-QRS notch of the deep septum.
  assert.deepEqual(rPrime.map((s, i) => [seen[i], s]).filter(([type]) => type === 'deep').map(([, s]) => s), rPrime.filter((_, i) => seen[i] === 'deep').map(() => 'not'));
  assert.equal(rPrime.at(-1), 'met');
  const r = simulate(modelOf(p)), list = criteria(r, p);
  for (const id of ['terminalR', 'v6Rwpt', 'interpeak', 'safety']) assert.equal(status(list, id), 'met', id);
  assert.equal(status(list, 'transition'), 'untested');
  assert.equal(status(list, 'fixation'), 'untested', 'no fixation beat was recorded yet');
  assert.ok(confirmation(list).definitive);
  assert.equal(guidance(p, r, list).key, 'confirmTest');
  assert.equal(stageOf(p), 3);
  assert.equal(rapidAllowed(p), false);
  assert.equal(act(p, { type: 'rotate', turns: 3 }).proc.turns, 9, 'three turns at once collapse to one from the LV septum');
});
test('fixation beats are evidence only once recorded, and backing out clears them', () => {
  const p = run(onTarget('baseline'), Array(7).fill({ type: 'rotate', turns: 1 }));
  assert.equal(p.rbbbFixation, false); assert.ok(p.fixation > 0, 'beats pending');
  const seen = act(p, { type: 'consumeFixation' });
  assert.equal(seen.events[0].type, 'fixationRbbb'); assert.equal(seen.proc.rbbbFixation, true);
  assert.equal(status(criteria(simulate(modelOf(seen.proc)), seen.proc), 'fixation'), 'met');
  assert.equal(act(seen.proc, { type: 'unscrew' }).proc.rbbbFixation, false);
  const shallow = act(run(onTarget('baseline'), Array(4).fill({ type: 'rotate', turns: 1 })), { type: 'consumeFixation' });
  assert.equal(shallow.events[0].type, 'fixation'); assert.equal(shallow.proc.rbbbFixation, false);
});
test('slow conduction stays in the grey band: supportive, not definitive, no accept', () => {
  const p = run(onTarget('slow'), Array(8).fill({ type: 'rotate', turns: 1 }));
  const r = simulate(modelOf(p)), list = criteria(r, p);
  assert.equal(r.capture.type, 'nonselective');
  assert.equal(status(list, 'v6Rwpt'), 'likely'); assert.equal(status(list, 'interpeak'), 'likely');
  assert.equal(confirmation(list).definitive, false); assert.deepEqual(confirmation(list).supportive, ['v6Rwpt', 'interpeak']);
  assert.equal(guidance(p, r, list).key, 'likelyTest');
  assert.equal(summary(p, r, list, null).verdict, 'lvsp');
  assert.ok(acceptCheck(p, list, null).includes('proof'));
});
test('one turn too many perforates; unscrewing comes back into the septum', () => {
  let p = run(onTarget('baseline'), Array(9).fill({ type: 'rotate', turns: 1 }));
  assert.equal(simulate(modelOf(p)).capture.type, 'perforation');
  const back = act(p, { type: 'unscrew' });
  assert.ok(back.events.some(e => e.type === 'withdrawn'));
  assert.notEqual(simulate(modelOf(back.proc)).capture.type, 'perforation');
  assert.ok(act(p, { type: 'accept' }).events.some(e => e.type === 'acceptRefused'));
});
test('screwed in: site and sheath are locked; a large sheath angle drills in place', () => {
  const p = act(onTarget('baseline'), { type: 'rotate', turns: 1 }).proc;
  assert.equal(act(p, { type: 'torque', delta: 10 }).events[0].type, 'locked');
  assert.equal(act(p, { type: 'site', level: .6 }).proc.level, p.level);
  const skewed = { ...onTarget('baseline'), sheath: 60 };
  const out = act(skewed, { type: 'rotate', turns: 1 });
  assert.ok(out.events.some(e => e.type === 'drilling')); assert.ok(out.proc.depthMm < .3);
});
const runThreshold = p => { let t = startThreshold(p); const events = []; for (let i = 0; i < 300 && !t.done; i++) { const o = thresholdBeat(t, modelOf(p)); t = o.test; events.push(...o.events); } return { t, events }; };
test('live threshold test steps down, classifies the transition and finds the threshold', () => {
  const p = run(onTarget('baseline'), Array(8).fill({ type: 'rotate', turns: 1 }));
  const { t, events } = runThreshold(p);
  assert.ok(t.done); assert.ok(t.rows.length > 5);
  assert.equal(t.polarity, 'uni');
  const transition = events.find(e => e.type === 'transition');
  assert.equal(transition.kind, 'toSelective'); assert.ok(transition.proof); assert.ok(transition.dLatency >= CUTOFFS.latencyStep); assert.ok(Math.abs(transition.dv6) < CUTOFFS.deltaV6Lvsp);
  assert.ok(t.threshold > 0 && t.threshold < 1.5);
  const r = simulate(modelOf(p)), list = criteria(r, p, t);
  assert.equal(status(list, 'transition'), 'met');
  assert.deepEqual(acceptCheck(p, list, t), []);
  const accepted = act(p, { type: 'accept', reasons: acceptCheck(p, list, t) });
  assert.equal(accepted.events[0].type, 'accepted');
  assert.equal(summary(accepted.proc, r, list, t).verdict, 'lbbp');
  assert.equal(guidance(p, r, list, t).key, 'acceptable');
});
test('a bipolar test proves nothing: anodal to cathodal is not a transition, acceptance asks for unipolar', () => {
  const p = { ...run(onTarget('baseline'), Array(8).fill({ type: 'rotate', turns: 1 })), polarity: 'bi', output: 5 };
  const { t } = runThreshold(p);
  const anodal = t.transitions.find(x => x.from > 4);
  assert.ok(anodal); assert.equal(anodal.kind, 'other'); assert.equal(anodal.proof, false);
  assert.ok(t.transitions.every(x => !x.proof));
  const list = criteria(simulate(modelOf(p)), p, t);
  assert.equal(status(list, 'transition'), 'untested');
  assert.ok(acceptCheck(p, list, t).includes('polarity'));
  assert.equal(guidance(p, simulate(modelOf(p)), list, t).key, 'fixSettings');
});
test('sweeps from the analysis page count as tests: S2 drops the slow case to LV septal capture', () => {
  const slow = { ...initialProcedure('slow'), sheath: 8, level: .32 };
  slow.depthMm = .88 * thicknessOf(slow);
  const s2 = testFromRows('s2', programmedSweep(modelOf(slow)), 'uni');
  assert.equal(s2.done, true); assert.equal(s2.threshold, null);
  const drop = s2.transitions.find(x => x.kind === 'toLvsp');
  assert.ok(drop && drop.proof); assert.ok(drop.dv6 >= CUTOFFS.deltaV6Lvsp);
  assert.ok(confirmation(criteria(simulate(modelOf(slow)), slow, s2)).definitive);
  const p = run(onTarget('baseline'), Array(8).fill({ type: 'rotate', turns: 1 }));
  const sweep = testFromRows('threshold', thresholdSweep(modelOf(p)), 'uni');
  assert.ok(sweep.threshold > 0 && sweep.threshold < 1.5); assert.ok(sweep.transitions.some(x => x.kind === 'toSelective' && x.proof));
});
test('acceptance gate: depth, unipolar, threshold, output margin and definitive proof', () => {
  const p = run(onTarget('baseline'), Array(8).fill({ type: 'rotate', turns: 1 }));
  const list = criteria(simulate(modelOf(p)), p);
  assert.deepEqual(acceptCheck(p, list, null), ['threshold']);
  assert.equal(act(p, { type: 'accept', reasons: acceptCheck(p, list, null) }).events[0].type, 'acceptRefused');
  const { t } = runThreshold(p);
  assert.ok(acceptCheck({ ...p, output: t.threshold * 1.5 }, list, t).includes('margin'));
  assert.ok(acceptCheck(p, list, { ...t, threshold: 2 }).includes('thresholdHigh'));
  const shallow = run(onTarget('baseline'), Array(6).fill({ type: 'rotate', turns: 1 }));
  assert.ok(acceptCheck(shallow, criteria(simulate(modelOf(shallow)), shallow), t).includes('depth'));
});
test('teaching cases differ: scar never reaches conduction tissue, equal thresholds show no transition', () => {
  const scar = run(onTarget('scar'), Array(14).fill({ type: 'rotate', turns: 1 }));
  assert.ok(!['nonselective', 'selective'].includes(simulate(modelOf(scar)).capture.type));
  let equal = onTarget('equal');
  for (let i = 0; i < 12 && simulate(modelOf(equal)).capture.type !== 'nonselective'; i++) equal = act(equal, { type: 'rotate', turns: 1 }).proc;
  let t = startThreshold(equal);
  for (let i = 0; i < 300 && !t.done; i++) t = thresholdBeat(t, modelOf(equal)).test;
  assert.equal(t.transitions.length, 0);
});
test('trap cases: selective unmasked, inverted refractoriness, dilated grey band, LBB threshold above muscle', () => {
  const sel = screwIn('selective'), selTest = runThreshold(sel).t;
  const selRows = selTest.rows.filter(r => r.capture.type === 'selective');
  assert.ok(selRows.length >= 8, 'a wide selective range'); assert.ok(selTest.transitions.some(x => x.kind === 'toSelective' && x.proof));
  const inv = screwIn('invertedErp');
  const s2 = testFromRows('s2', programmedSweep(modelOf(inv)), 'uni');
  assert.ok(s2.transitions.some(x => x.kind === 'toSelective' && x.proof), 'S2 drops the myocardium first');
  const dil = screwIn('dilated', 7), dilList = criteria(simulate(modelOf(dil)), dil);   // 11 mm septum: nonselective at 7 turns
  assert.equal(status(dilList, 'v6Rwpt'), 'likely'); assert.equal(status(dilList, 'interpeak'), 'likely'); assert.equal(confirmation(dilList).definitive, false);
  const dilTest = runThreshold(dil).t;
  assert.ok(confirmation(criteria(simulate(modelOf(dil)), dil, dilTest)).definitive, 'the transition proves it');
  const high = screwIn('lbbHigh'), highTest = runThreshold(high).t;
  const drop = highTest.transitions.find(x => x.kind === 'toLvsp');
  assert.ok(drop && drop.proof); assert.ok(drop.dv6 >= CUTOFFS.deltaV6Lvsp);
  assert.ok(lbbThresholdOf(highTest) > highTest.threshold, 'the conduction threshold sits above the capture threshold');
  const highList = criteria(simulate(modelOf(high)), high, highTest);
  assert.ok(acceptCheck(high, highList, highTest).includes('margin'));
  assert.deepEqual(acceptCheck({ ...high, output: 2 * lbbThresholdOf(highTest) }, highList, highTest), []);
});
test('mid-septal scar stall: turns advance nothing at the target level, a few mm apically they do', () => {
  let p = onTarget('stall'); const events = [];
  for (let i = 0; i < 6; i++) { const o = act(p, { type: 'rotate', turns: 1 }); p = o.proc; events.push(...o.events.map(e => e.type)); }
  assert.ok(events.filter(e => e === 'stall').length >= 2); assert.ok(p.depthMm < 6.5); assert.ok(p.stalls >= 2);
  assert.equal(guidance(p, simulate(modelOf(p)), criteria(simulate(modelOf(p)), p)).key, 'stall');
  const moved = run(act(p, { type: 'reposition' }).proc, [{ type: 'site', level: ANATOMY.stall.lbb + .07 }, ...Array(8).fill({ type: 'rotate', turns: 1 })]);
  assert.equal(moved.stalls, 0); assert.equal(simulate(modelOf(moved)).capture.type, 'nonselective');
});
test('random patient: reproducible from its seed, different between seeds, always bounded', () => {
  const a = initialProcedure('random', 7), b = initialProcedure('random', 7), c = initialProcedure('random', 8);
  assert.deepEqual(a, b); assert.notDeepEqual(a.params, c.params);
  assert.equal(a.seed, 7); assert.equal(initialProcedure('baseline').seed, null);
  for (const seed of [1, 2, 3, 4, 5]) {
    const p = initialProcedure('random', seed);
    assert.ok(p.anatomy.septumMm >= 10 && p.anatomy.septumMm <= 14); assert.ok(p.anatomy.lbb >= .26 && p.anatomy.lbb <= .36);
    assert.ok(p.params.scar >= 1 && p.params.scar <= 1.5);
    const r = simulate(modelOf(screwIn('random', 8, seed)));
    assert.ok(Object.values(r.leads).every(v => v.every(Number.isFinite)));
  }
});
test('coaching reads the state: checklist before fixation, trends and next step after it', () => {
  const start = initialProcedure('baseline'), r0 = simulate(modelOf(start));
  const first = coaching(start, r0, criteria(r0, start));
  assert.equal(first[0].key, 'offAnterior'); assert.equal(first.at(-1).key, 'nextFix');
  assert.ok(first.some(i => i.key === 'paceMap' && i.params.qrs > 160));
  const ready = onTarget('baseline'), r1 = simulate(modelOf(ready));
  const list = coaching(ready, r1, criteria(r1, ready));
  assert.deepEqual(list.map(i => i.key), ['sheathOk', 'siteOk', 'paceMap', 'nextRotate']);
  let p = ready, trend = [];
  for (let i = 0; i < 8; i++) { p = act(p, { type: 'rotate', turns: 1 }).proc; trend = pushTrend(trend, trendPoint(p, simulate(modelOf(p)))); }
  const r = simulate(modelOf(p)), deep = coaching(p, r, criteria(r, p), null, trend);
  assert.ok(deep.some(i => i.key === 'impedanceTrend' && i.params.to > i.params.from));
  assert.ok(deep.some(i => i.key === 'proof')); assert.equal(deep.at(-1).key, 'runThreshold');
  assert.equal(trendDelta(trend, 'impedance').delta > 0, true); assert.equal(trendDelta([], 'coi'), null);
  const { t } = runThreshold(p);
  assert.equal(coaching(p, r, criteria(r, p, t), t, trend).at(-1).key, 'accept');
  const stuck = run(onTarget('stall'), Array(5).fill({ type: 'rotate', turns: 1 }));
  const stuckTrend = [trendPoint({ ...stuck, depthMm: stuck.depthMm - .05 }, r), trendPoint(stuck, simulate(modelOf(stuck)))];
  assert.ok(coaching(stuck, simulate(modelOf(stuck)), criteria(simulate(modelOf(stuck)), stuck), null, stuckTrend).some(i => i.key === 'noProgress'));
  assert.deepEqual(coaching({ ...p, accepted: true }, r, criteria(r, p)).map(i => i.key), ['accepted', 'withdraw']);
});
test('rhythm cases: RBBB makes the r′ row useless, LBBB uses the 80 ms cut-off, fusion blocks the timing until the rate rises', () => {
  const rb = screwIn('rbbb'), rbList = criteria(simulate(modelOf(rb)), rb);
  assert.equal(status(rbList, 'terminalR'), 'na'); assert.equal(status(rbList, 'interpeak'), 'untested'); assert.equal(status(rbList, 'v6Rwpt'), 'met');
  const shallow = screwIn('rbbb', 3), shallowList = criteria(simulate(modelOf(shallow)), shallow);
  assert.equal(status(shallowList, 'terminalR'), 'na');
  const seven = screwIn('rbbb', 7), sevenResult = simulate(modelOf(seven)), sevenList = criteria(sevenResult, seven);
  assert.equal(guidance(seven, sevenResult, sevenList).key, 'likelyTest', 'the grey band comes first');
  const noTiming = sevenList.map(c => (c.group === 'proof' ? { ...c, status: 'not' } : c));
  assert.equal(guidance(seven, sevenResult, noTiming).key, 'deepRbbb');
  const lb = screwIn('lbbb'), lbResult = simulate(modelOf(lb)), lbList = criteria(lbResult, lb);
  assert.equal(lbList.find(c => c.id === 'v6Rwpt').cutoff, 80); assert.equal(status(lbList, 'v6Rwpt'), 'met');
  const fu = screwIn('fusion'), fuResult = simulate(modelOf(fu)), fuList = criteria(fuResult, fu);
  assert.ok(fuResult.metrics.fusion > .4); assert.equal(status(fuList, 'v6Rwpt'), 'untested'); assert.equal(status(fuList, 'terminalR'), 'untested');
  assert.equal(guidance(fu, fuResult, fuList).key, 'fusion');
  assert.ok(coaching(fu, fuResult, fuList).some(i => i.key === 'fusion' && i.params.sinus === 86));
  const fast = { ...fu, rate: 110 }, fastResult = simulate(modelOf(fast));
  assert.equal(fastResult.metrics.fusion, 0); assert.equal(status(criteria(fastResult, fast), 'v6Rwpt'), 'met');
});
test('right bundle bump: basal manipulation in the trauma case gives complete block with a slow wide escape', () => {
  const p = run(initialProcedure('bump'), Array(10).fill({ type: 'torque', delta: 5 }));
  assert.equal(p.bumped, false);
  const safe = act({ ...p, level: ANATOMY.bump.lbb }, { type: 'rotate', turns: 1 });
  assert.equal(safe.proc.bumped, false);
  const hit = act({ ...p, level: ANATOMY.bump.lbb - .1 }, { type: 'rotate', turns: 1 });
  assert.ok(hit.events.some(e => e.type === 'rbbBump')); assert.equal(hit.proc.bumped, true);
  const off = { ...hit.proc, pacing: false }, r = simulate(modelOf(off));
  assert.ok(r.metrics.qrsDuration >= 150); assert.equal(modelOf(off).params.intrinsicRate, 30);
  assert.equal(guidance(off, r, criteria(r, off)).key, 'bumpedOff');
  assert.ok(coaching(hit.proc, simulate(modelOf(hit.proc)), criteria(simulate(modelOf(hit.proc)), hit.proc)).some(i => i.key === 'bumped'));
  assert.equal(criteria(simulate(modelOf(hit.proc)), hit.proc).find(c => c.id === 'v6Rwpt').cutoff, 80, 'wide escape: 80 ms cut-off');
  assert.equal(act(hit.proc, { type: 'rotate', turns: 1 }).events.some(e => e.type === 'rbbBump'), false, 'bumped once');
});
test('heart position moves the ideal sheath angle and the target; lead type and forward support change the advance', () => {
  for (const [heart, h] of Object.entries(HEARTS)) {
    const p0 = initialProcedure('baseline', 1, { heart });
    assert.equal(relAngle(p0), -50, 'every heart starts on the anterior free wall');
    const p = run(p0, [...Array(10).fill({ type: 'torque', delta: 5 }), { type: 'site', level: anatomyOf(p0).lbb }]);
    assert.equal(p.sheath, h.ideal); assert.equal(relAngle(p), 0); assert.equal(stageOf(p), 1);
  }
  const vertical = initialProcedure('baseline', 1, { heart: 'vertical' });
  assert.ok(anatomyOf(vertical).septumMm < anatomyOf(initialProcedure('baseline')).septumMm);
  assert.equal(offsetOf(relAngle({ ...vertical, sheath: 0 })), 0, 'the compact heart perpendicular is 10° off on a vertical heart');
  const stylet = run(initialProcedure('baseline', 1, { lead: 'stylet' }), [...Array(10).fill({ type: 'torque', delta: 5 }), { type: 'site', level: .3 }]);
  const supported = act(stylet, { type: 'rotate', turns: 1 }), loose = act({ ...stylet, forwardSupport: false }, { type: 'rotate', turns: 1 });
  assert.ok(Math.abs(supported.proc.depthMm - 1.4) < 1e-9); assert.ok(Math.abs(loose.proc.depthMm - .7) < 1e-9);
  assert.ok(loose.events.some(e => e.type === 'noSupport'));
  assert.equal(guidance(loose.proc, simulate(modelOf(loose.proc)), criteria(simulate(modelOf(loose.proc)), loose.proc)).key, 'noSupport');
  assert.equal(act(supported.proc, { type: 'set', values: { heart: 'vertical' } }).events[0].type, 'locked', 'no heart change once screwed in');
  assert.equal(act(stylet, { type: 'set', values: { lead: 'bogus' } }).proc.lead, 'stylet');
});
test('finishing: R wave with pacing off, sheath withdrawal re-measures thresholds, slit, slack and deep breath in order', () => {
  let p = screwIn('baseline');
  const { t } = runThreshold(p);
  const list = criteria(simulate(modelOf(p)), p, t);
  p = act(p, { type: 'accept', reasons: acceptCheck(p, list, t) }).proc;
  assert.equal(guidance(p, simulate(modelOf(p)), list, t).key, 'withdrawSheath');
  const off = act(p, { type: 'pacing', on: false });
  assert.ok(off.proc.rWave > 4); assert.ok(off.events.some(e => e.type === 'rWave'));
  p = act(off.proc, { type: 'pacing', on: true }).proc;
  assert.deepEqual(act(p, { type: 'slit' }).proc.finish, {}, 'no slit before withdrawal');
  const out = act(p, { type: 'withdrawSheath', threshold: t.threshold });
  assert.equal(out.events[0].type, 'sheathOut'); assert.ok(out.proc.thresholds.bi > out.proc.thresholds.uni);
  p = act(out.proc, { type: 'slit' }).proc;
  assert.equal(guidance(p, simulate(modelOf(p)), list, t).key, 'checkSlack');
  assert.equal(act(p, { type: 'slack', value: 'bogus' }).proc.slack, 'right');
  const little = act(act(p, { type: 'slack', value: 'little' }).proc, { type: 'breath' });
  assert.equal(little.events[0].type, 'slackLittle');
  const fine = act(p, { type: 'breath' });
  assert.equal(fine.events[0].type, 'slackOk'); assert.equal(guidance(fine.proc, simulate(modelOf(fine.proc)), list, t).key, 'finished');
  assert.equal(act(fine.proc, { type: 'slack', value: 'much' }).proc.finish.breath, false, 'a new slack needs a new breath');
});
test('instructor values map back onto the physical state', () => {
  const p = fromModel(onTarget('baseline'), { depth: .5, angle: 20, level: .4 });
  const m = modelOf(p);
  assert.ok(Math.abs(m.depth - .5) < 1e-9); assert.equal(m.angle, 20); assert.equal(m.level, .4);
});
test('recorder writes beats back to back with the pacing interval', () => {
  const rec = createRecorder(50);
  const r = simulate({});
  const starts = [];
  for (let i = 0; i < 8; i++) advance(rec, 250, time => { starts.push(time); return beatFromResult(r, 600); });   // a frame advances at most 250 ms
  assert.deepEqual(starts.slice(0, 3), [1, 601, 1201]);
  assert.ok(rec.buffers.V6.some(v => Math.abs(v) > .1));
  const fixation = beatFromResult(r, 600, { stimulus: false });
  assert.ok(Math.abs(fixation.channels.I[50]) < Math.abs(beatFromResult(r, 600).channels.I[50]), 'no pacing artefact');
});
console.log(`${passed} procedure tests passed`);
