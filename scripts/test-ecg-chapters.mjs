// ECG chapter models: the cell action potential (ecg-cell-model.js), the recording chain and the QT
// tools (ecg-recording-model.js). Checks the published action potential numbers, Einthoven and
// the cable reversals, the filters and the QT methods and formulas.
import assert from 'node:assert/strict';
import { paceCell, restitution, phaseAt } from '../src/ecg/ecg-cell-model.js';
import { recordElectrodes, trueLeads, recordLeads, addArtifacts, beatMeasures, beatForQt, qtOfLead, qtAtRate, QT_FORMULAS, gradeQtc, LEADS } from '../src/ecg/ecg-recording-model.js';
import { atrialLobes, pMeasures, atrialCriteria, ventricleLobes, qrsVoltages, qrsAxis, hypertrophyCriteria } from '../src/ecg/ecg-structure-model.js';
import { simulatePacing, pacedMeasures, renderStrip, NBG } from '../src/ecg/ecg-pacing-model.js';
import { CLINICAL_CONDITIONS, sampleConditionLeadMv } from '../src/ecg/clinical-ecg-simulator.js';
import { cascadeTiming, cellAt, cellMeasures, currentsAt, ecgRegionAt, CASCADE_CELLS } from '../src/ecg/ecg-conduction-cells.js';
import { PHASES } from '../src/ecg/ecg-cell-cascade-text.js';
import { bundleRefractory, avNode, prematureBeat, conductRun, outcomeMap, afRun, renderBeats, qrsWidth, aberrancyClues } from '../src/ecg/ecg-ashman-model.js';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

test('cell: the epicardial cell at 1 Hz matches the published minimal model (APD90 about 270 ms, notch)', () => {
  const { measures: m } = paceCell({ cell: 'epi', cycleLength: 1000 });
  near(m.apd90, 269, 6, 'APD90'); near(m.apd50, 221, 8, 'APD50'); near(m.rest, -84, 2, 'rest'); assert.ok(m.peak > 30 && m.peak < 50);
  assert.ok(m.notch != null, 'spike and dome'); assert.equal(m.di, 1000 - m.apd90);
});
test('cell: the M cell outlasts the others by more than 100 ms; only the epicardial cell has a notch', () => {
  const epi = paceCell({ cell: 'epi' }).measures, endo = paceCell({ cell: 'endo' }).measures, mid = paceCell({ cell: 'mid' }).measures;
  assert.ok(mid.apd90 - Math.max(epi.apd90, endo.apd90) > 100);
  assert.equal(endo.notch, null); assert.equal(mid.notch, null);
});
test('cell: less fast inward current slows the upstroke, not the duration; less outward current lengthens it', () => {
  const base = paceCell({ cell: 'epi' }).measures, na = paceCell({ cell: 'epi', fastInward: .25 }).measures, k = paceCell({ cell: 'epi', slowOutward: .5 }).measures;
  assert.ok(na.maxDvdt < base.maxDvdt / 2); near(na.apd90, base.apd90, 15, 'APD90 with Na block');
  assert.ok(k.apd90 > base.apd90 + 80);
});
test('cell: restitution: the action potential shortens at faster rates', () => {
  const curve = restitution({ cell: 'epi' });
  for (let i = 1; i < curve.length; i++) assert.ok(curve[i].apd90 >= curve[i - 1].apd90 - 1);
  assert.ok(curve.at(-1).apd90 - curve[0].apd90 > 30);
  const beat = paceCell({ cell: 'epi' });
  assert.equal(phaseAt(beat, .1), 4); assert.equal(phaseAt(beat, 150), 2); assert.equal(phaseAt(beat, 900), 4);
});
const rec = recordElectrodes({ seconds: 6, hr: 72 }), truth = trueLeads(rec.electrodes), beat = rec.rr * 3;
const sign = (L, l) => { const m = beatMeasures(L[l], beat); return Math.sign(m.r + m.s); };
const size = (L, l) => { const m = beatMeasures(L[l], beat); return Math.max(m.r, -m.s); };
test('recording: Einthoven holds, aVR is negative, R progression crosses at V3-V4 and T is upright V2-V6', () => {
  for (let i = 0; i < truth.I.length; i += 37) near(truth.II[i], truth.I[i] + truth.III[i], 1e-5, 'II = I + III');
  assert.equal(sign(truth, 'aVR'), -1); assert.equal(sign(truth, 'V1'), -1); assert.equal(sign(truth, 'V5'), 1);
  const rs = l => beatMeasures(truth[l], beat);
  assert.ok(rs('V2').r < -rs('V2').s && rs('V4').r > -rs('V4').s);
});
test('recording: cable reversals change the leads as on a real machine', () => {
  const swap = r => recordLeads(rec.electrodes, { reversal: r, highPassHz: 0, lowPassHz: 0 });
  const laRa = swap('la-ra');
  assert.equal(sign(laRa, 'I'), -sign(truth, 'I')); near(size(laRa, 'II'), size(truth, 'III'), .01, 'II <- III'); near(size(laRa, 'aVL'), size(truth, 'aVR'), .01, 'aVL <- aVR');
  near(size(laRa, 'aVF'), size(truth, 'aVF'), .01, 'aVF spared'); near(size(laRa, 'V4'), size(truth, 'V4'), .01, 'chest spared');
  assert.ok(size(swap('ra-rl'), 'II') < .03, 'RA-RL: II nearly flat');
  const laLl = swap('la-ll'); near(size(laLl, 'I'), size(truth, 'II'), .01, 'I <- II'); assert.equal(sign(laLl, 'III'), -sign(truth, 'III'));
  const v = swap('v1-v2'); near(size(v, 'V1'), size(truth, 'V2'), .01, 'V1 <- V2');
});
test('recording: a 0.5 Hz causal high-pass shifts the ST segment, zero phase spares it; 40 Hz shrinks the QRS', () => {
  const st = opts => beatMeasures(recordLeads(rec.electrodes, opts).II, beat).st;
  const diag = st({}), causal = st({ highPassHz: .5 }), zero = st({ highPassHz: .5, zeroPhaseFilters: true });
  assert.ok(Math.abs(causal - diag) > .03); assert.ok(Math.abs(zero - diag) < Math.abs(causal - diag) / 2);
  assert.ok(beatMeasures(recordLeads(rec.electrodes, { lowPassHz: 40 }).V5, beat).r < beatMeasures(recordLeads(rec.electrodes, {}).V5, beat).r * .98);
  const noisy = addArtifacts(rec.electrodes, { breathing: true, tremor: true, mains: true });
  assert.equal(noisy.RA.length, rec.electrodes.RA.length); assert.notDeepEqual(noisy.RA, rec.electrodes.RA);
  assert.equal(LEADS.length, 12);
});
test('QT: the tangent end lands on the asked QT; a U wave fools the threshold method', () => {
  for (const qt of [340, 400, 480]) {
    const r = recordElectrodes({ seconds: 4, hr: 60, beat: beatForQt(qt).beat }), L = trueLeads(r.electrodes);
    near(qtOfLead(L.II, r.rr * 2, r.rr).tangent, qt, 3, `tangent ${qt}`);
  }
  const { beat: b, uWave } = beatForQt(400), r = recordElectrodes({ seconds: 4, hr: 60, beat: [...b, uWave] }), L = trueLeads(r.electrodes);
  const q = qtOfLead(L.V3, r.rr * 2, r.rr);
  assert.ok(q.threshold - q.tangent > 40, `threshold ${q.threshold} tangent ${q.tangent}`);
});
test('QT: every formula leaves the QT at 60/min; Bazett over-corrects fast and under-corrects slow', () => {
  for (const f of Object.values(QT_FORMULAS)) near(f(400, 1000), 400, 1e-9, 'at 60/min');
  const fast = 120, slow = 45;
  assert.ok(QT_FORMULAS.bazett(qtAtRate(400, fast), 60000 / fast) > 420);
  assert.ok(QT_FORMULAS.bazett(qtAtRate(400, slow), 60000 / slow) < 395);
  near(QT_FORMULAS.fridericia(qtAtRate(400, fast), 60000 / fast), 400, 15, 'Fridericia near truth');
  assert.equal(gradeQtc(455, 'male'), 'long'); assert.equal(gradeQtc(455, 'female'), 'normal'); assert.equal(gradeQtc(505, 'female'), 'high');
});
test('atria: normal P meets no criterion; left enlargement is long, notched, deep in V1; right is tall in II and V1', () => {
  const crit = o => atrialCriteria(pMeasures(atrialLobes(o)));
  assert.deepEqual(Object.values(crit({ atria: 'normal' })).filter(Boolean), []);
  const left = crit({ atria: 'left' }); assert.ok(left.duration && left.notch && left.ptfv1); assert.ok(!left.tallII);
  const right = crit({ atria: 'right' }); assert.ok(right.tallII && right.v1Initial); assert.ok(!right.duration && !right.notch);
  const both = crit({ atria: 'both' }); assert.ok(both.duration && both.tallII);
  assert.ok(pMeasures(atrialLobes({ slowed: true })).duration >= 120, 'interatrial block lengthens the P wave');
});
test('hypertrophy: thicker walls cross the voltage criteria step by step; thresholds follow sex; RVH from the right ventricle', () => {
  const crit = (lv, rv, sex = 'male') => { const L = ventricleLobes({ lvWall: lv, rvWall: rv }); return hypertrophyCriteria(qrsVoltages(L), sex, qrsAxis(L)); };
  const normal = crit(9, 4); assert.ok(!normal.sokolow.met && !normal.cornell.met && !normal.peguero.met && !normal.rvh.met);
  assert.ok(crit(15, 4).sokolow.met); assert.ok(!crit(15, 4).cornell.met && crit(15, 4, 'female').cornell.met);
  assert.ok(crit(18, 4).peguero.met && crit(18, 4).cornell.met);
  for (let lv = 9; lv < 18; lv++) assert.ok(crit(lv + 1, 4).sokolow.value >= crit(lv, 4).sokolow.value - .5, 'Sokolow rises with the wall');
  assert.ok(crit(10, 10).rvh.met); assert.ok(qrsAxis(ventricleLobes({ rvWall: 10 })) > 100, 'right axis');
});
test('pacing: AAI paces the atrium, VVI the ventricle with independent P waves, DDD tracks every P', () => {
  const kinds = r => r.events.reduce((m, e) => ({ ...m, [e.kind]: (m[e.kind] || 0) + 1 }), {});
  const aai = kinds(simulatePacing({ mode: 'AAI' })); assert.ok(aai.spikeA >= 8 && !aai.spikeV && aai.QRS >= 8);
  const vvi = simulatePacing({ mode: 'VVI' }), v = kinds(vvi); assert.ok(v.spikeV >= 8 && v.P >= 12 && !v.spikeA);
  const gaps = vvi.events.filter(e => e.kind === 'spikeV').map((e, i, a) => (i ? e.t - a[i - 1].t : null)).filter(Boolean);
  assert.ok(gaps.every(g => Math.abs(g - 1000) <= 2), 'VVI at the lower rate');
  const ddd = simulatePacing({ mode: 'DDD' }), d = kinds(ddd); assert.equal(d.spikeV, d.P, 'every P tracked');
  const asVp = ddd.markers.map((m, i, a) => (m.label === 'VP' && a[i - 1]?.label === 'AS' ? m.t - a[i - 1].t : null)).filter(x => x != null);
  assert.ok(asVp.every(x => x === 150));
  assert.deepEqual(NBG.DDD, ['D', 'D', 'D']);
});
test('pacing faults: lost capture leaves spikes alone, undersensing lets spikes march, oversensing makes pauses', () => {
  const lost = simulatePacing({ mode: 'VVI', fault: 'capture' }).events.filter(e => e.kind === 'pacedQRS' && !e.captured);
  assert.ok(lost.length >= 2);
  const under = simulatePacing({ mode: 'VVI', fault: 'undersensing' });
  assert.ok(under.events.filter(e => e.kind === 'QRS').length >= 8 && under.events.filter(e => e.kind === 'spikeV').length >= 8, 'own beats and spikes together');
  const over = simulatePacing({ mode: 'VVI', fault: 'oversensing' }), spikes = over.events.filter(e => e.kind === 'spikeV').map(e => e.t);
  const maxGap = Math.max(...spikes.map((t, i) => (i ? t - spikes[i - 1] : 0)));
  assert.ok(maxGap > 1400, `pause ${maxGap}`);
  const strip = renderStrip(over, { site: 'rvApex' }); assert.equal(strip.II.length, 10000); assert.ok(Math.max(...strip.II) > 1.5, 'spikes drawn');
});
test('paced QRS by lead position: RV apex wide with a superior axis, LBBAP narrower with a terminal R in V1, His keeps the native QRS after a latency', () => {
  const apex = pacedMeasures('rvApex'), lbbap = pacedMeasures('lbbap'), his = pacedMeasures('his'), sept = pacedMeasures('rvSeptum'), biv = pacedMeasures('biv');
  assert.ok(apex.width >= 140 && apex.axis < -30 && apex.v1Terminal < 0);
  assert.ok(sept.width >= 130 && sept.axis > 0);
  assert.ok(lbbap.width < apex.width - 30 && lbbap.v1Terminal > 0);
  assert.ok(his.latency >= 35 && his.width < 100);
  assert.ok(biv.width < apex.width && biv.axis < -90);
});
test('clinical simulator: the conditions added from the gap analysis exist and draw their key sign', () => {
  const ids = CLINICAL_CONDITIONS.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  const added = ['rv_mi', 'focal_at', 'mat', 'aflutter_reverse', 'pvc_bigeminy', 'pvc_couplet', 'lpfb', 'avb_high_grade', 'brugada_2', 'rvh', 'takotsubo', 'pericarditis_late', 'amyloid', 'apical_hcm', 'hypothermia', 'lithium'];
  for (const id of added) { const c = CLINICAL_CONDITIONS.find(x => x.id === id); assert.ok(c, id); assert.ok(c.tr && c.en && c.pearlTr && c.pearlEn, `${id} texts`); }
  const cond = id => CLINICAL_CONDITIONS.find(c => c.id === id);
  const range = (id, lead, beat = 0, from = 0, to = 1) => { let hi = -9, lo = 9; for (let p = from; p < to; p += .002) { const v = sampleConditionLeadMv(cond(id), lead, p, beat); hi = Math.max(hi, v); lo = Math.min(lo, v); } return { hi, lo }; };
  assert.ok(range('rvh', 'V1').hi > .8 && range('rvh', 'V6').lo < -.6, 'RVH: tall R V1, deep S V6');
  assert.ok(range('amyloid', 'II').hi < range('normal_sinus', 'II').hi / 2, 'amyloid: low voltage');
  assert.ok(range('pvc_bigeminy', 'II', 1).hi > range('pvc_bigeminy', 'II', 0).hi, 'bigeminy: the odd beat is the PVC');
  assert.ok(range('avb_high_grade', 'V5', 1, .25, .35).hi < .2 && range('avb_high_grade', 'V5', 0, .25, .35).hi > .5, '3:1 block drops two QRS of three');
  assert.ok(range('apical_hcm', 'V4', 0, .4, .7).lo < -.7, 'apical HCM: giant negative T');
  assert.ok(range('hypothermia', 'II', 0, .32, .35).hi > .2, 'Osborn J wave');
  assert.ok(range('focal_at', 'II', 0, 0, .2).lo < -.08, 'low atrial focus: negative P in II');
  const slope = id => sampleConditionLeadMv(cond(id), 'II', .2) - sampleConditionLeadMv(cond(id), 'II', .05);   // within one flutter wave
  assert.ok(slope('aflutter_reverse') > 0 && slope('aflutter_2to1') < 0, 'reverse flutter: the sawtooth turns over in II');
  assert.ok(range('brugada_2', 'V1', 0, .45, .56).hi > .2, 'Brugada type 2: positive T after the saddle');
  assert.ok(range('takotsubo', 'V3', 0, .45, .75).lo < -.35 && range('takotsubo', 'aVR', 0, .45, .75).hi > .2, 'takotsubo: deep T inversion, upright in aVR');
});
test('Ashman: bundle refractoriness grows with the preceding cycle; right longest at slow rates, left at fast rates', () => {
  for (const b of ['rbb', 'laf', 'lbb']) assert.ok(bundleRefractory(b, 1200).erp > bundleRefractory(b, 600).erp + 50, b);
  assert.ok(bundleRefractory('rbb', 1000).erp > bundleRefractory('laf', 1000).erp && bundleRefractory('laf', 1000).erp > bundleRefractory('lbb', 1000).erp);
  assert.ok(bundleRefractory('lbb', 400).erp > bundleRefractory('rbb', 400).erp, 'the lines cross at short cycles');
  assert.ok(bundleRefractory('rbb', 1000, { diseased: true }).erp > bundleRefractory('rbb', 1000).erp * 1.15);
  const n = avNode(1000, 330), late = avNode(1000, 600);
  assert.ok(n.conducts && n.ah > late.ah + 30, 'decremental AV nodal conduction'); assert.equal(avNode(1000, 250).conducts, false);
});
test('Ashman: the same early beat is aberrant after a long cycle and narrow after a short one (long-short)', () => {
  const long = prematureBeat({ cycle: 1000, coupling: 380 }).pac, short = prematureBeat({ cycle: 600, coupling: 380 }).pac;
  assert.equal(long.pattern, 'rbbb'); assert.equal(short.pattern, 'normal');
  assert.ok(long.h1h2 < bundleRefractory('rbb', 1000).erp && long.h1h2 > bundleRefractory('lbb', 1000).erp);
  // AV nodal delay protects the bundles: the P' coupling is inside the RBB ERP, the H1-H2 is not.
  const protect = prematureBeat({ cycle: 700, coupling: 300 }).pac;
  assert.ok(protect.pattern === 'normal' && 300 < bundleRefractory('rbb', 700).erp && protect.h1h2 > bundleRefractory('rbb', 700).erp);
  assert.equal(prematureBeat({ cycle: 1000, coupling: 260 }).pac.pattern, 'blocked-avn');
  assert.equal(prematureBeat({ cycle: 1000, coupling: 370, brisk: true }).pac.pattern, 'rbbb-lafb');
  const incomplete = prematureBeat({ cycle: 1000, coupling: 440 }).pac;
  assert.equal(incomplete.pattern, 'rbbb-incomplete'); assert.ok(qrsWidth('rbbb-incomplete', incomplete.bundles) < qrsWidth('rbbb'));
  // The sinus node is reset: the cycle after the PAC is about one sinus cycle, not compensatory.
  const r = prematureBeat({ cycle: 1000, coupling: 380 }), i = r.beats.indexOf(r.pac);
  assert.equal(r.beats[i + 1].a - r.pac.a, 1000);
});
test('Ashman: a blocked bundle is activated late across the septum, so it can stay refractory (linking)', () => {
  const h = [0, 1200, 2400, 2840, 3200, 3560, 4800];
  const run = conductRun(h);
  assert.ok(run[3].pattern.startsWith('rbbb')); assert.notEqual(run[4].pattern, 'normal', 'linking on the next short cycle');
  assert.equal(run[6].pattern, 'normal', 'a long cycle ends it');
  let aberrant = 0, linked = 0;
  for (let seed = 1; seed <= 30; seed++) { const af = afRun({ seed }); aberrant += af.beats.filter(b => b.aberrant).length; linked += af.beats.filter(b => b.linked).length; for (const b of af.beats.filter(x => x.aberrant && !x.linked)) assert.ok(b.cycle < 520, `seed ${seed}: an Ashman beat ends a short cycle`); }
  assert.ok(aberrant >= 30 && linked >= 5, `AF: ${aberrant} aberrant, ${linked} linked`);
});
test('Ashman: aberrant shapes: rsR\u2032 in V1 with wide S in I for RBBB, QS in V1 for LBBB, superior axis with LAFB', () => {
  const beat = p => renderBeats([{ a: null, v: 100, pattern: p, bundles: null }], 500, ['I', 'aVF', 'V1']);
  const peak = (L, l, a, z) => { let hi = -9, lo = 9; for (let i = 100 + a; i < 100 + z; i++) { hi = Math.max(hi, L[l][i]); lo = Math.min(lo, L[l][i]); } return { hi, lo }; };
  const n = beat('normal'), r = beat('rbbb'), l = beat('lbbb'), f = beat('rbbb-lafb');
  assert.ok(peak(r, 'V1', 70, 140).hi > .5 && peak(n, 'V1', 70, 140).hi < .1, 'late R\u2032 in V1');
  assert.ok(peak(r, 'I', 70, 140).lo < -.3, 'wide S in I');
  assert.ok(peak(r, 'V1', 0, 30).hi > .2, 'initial r kept (same septal vector)');
  assert.ok(peak(l, 'V1', 0, 140).hi < .05 && peak(l, 'V1', 0, 140).lo < -1, 'QS in V1');
  assert.ok(peak(f, 'aVF', 20, 70).lo < -.6, 'LAFB: negative aVF');
  const af = renderBeats([], 2000, ['V1'], { fib: true }); assert.ok(Math.max(...af.V1) > .03, 'f waves');
  const clues = aberrancyClues(prematureBeat({ cycle: 1000, coupling: 380 }));
  assert.ok(clues.aberrant && clues.clues.every(c => c.met));
  const map = outcomeMap({ cycles: [600, 1400, 200], couplings: [260, 700, 20] });
  const flat = map.rows.flatMap(r => r.cells);
  for (const p of ['normal', 'rbbb', 'blocked-avn']) assert.ok(flat.includes(p), `map has ${p}`);
});

test('conduction cells: the SA node sets the rate; sympathetic tone speeds it, vagal tone and ivabradine slow it', () => {
  const base = cascadeTiming(), sym = cascadeTiming({ tone: 1 }), vag = cascadeTiming({ tone: -1 }), ivab = cascadeTiming({ ivabradine: true });
  near(base.rate, 72, 2, 'baseline rate');
  assert.ok(sym.rate > base.rate + 30 && vag.rate < base.rate - 25, `rates ${sym.rate} / ${vag.rate}`);
  assert.ok(ivab.rate < base.rate - 5 && ivab.rate > base.rate - 20, `ivabradine ${ivab.rate}`);
  assert.ok(vag.pr > base.pr && sym.pr < base.pr, 'vagal tone lengthens and sympathetic tone shortens the PR');
  assert.ok(sym.qt < base.qt && vag.qt > base.qt, 'QT follows the rate');
  assert.equal(base.mdp, -60); assert.ok(vag.mdp < base.mdp, 'vagal tone lowers the maximum diastolic potential');
});

test('conduction cells: activation order on the ECG: SA before the P, atrium in the P, AV in the PR, Purkinje before the QRS, ventricle in the QRS', () => {
  const k = cascadeTiming(), e = k.ecg, o = k.onsets;
  assert.ok(o.sa < e.p && o.atrial >= e.p && o.atrial < e.pEnd, 'SA then atrium');
  assert.ok(o.av > o.atrial && o.av < e.q, 'AV node during the PR');
  assert.ok(o.purkinje < e.q && o.ventricle > e.q && o.ventricle < e.j, 'Purkinje just before the QRS, ventricle inside it');
  assert.equal(ecgRegionAt(e.q + 10, k), 'QRS'); assert.equal(ecgRegionAt(e.j + 20, k), 'ST'); assert.equal(ecgRegionAt(e.pEnd + 10, k), 'PR');
  // The ventricle is on its plateau during the ST and back near rest after the T.
  assert.equal(cellAt('ventricle', e.j + 40, k).phase, 2);
  assert.equal(cellAt('ventricle', e.tEnd + 20, k).phase, 4);
});

test('conduction cells: resting and peak voltages, durations and the pacemaker phase 4', () => {
  const k = cascadeTiming(), m = Object.fromEntries(CASCADE_CELLS.map(c => [c, cellMeasures(c, k)]));
  assert.equal(m.sa.rest, -60); assert.equal(m.sa.threshold, -40);
  assert.ok(m.purkinje.rest <= -85 && m.ventricle.rest <= -84 && m.atrial.rest <= -79, 'working cells and Purkinje rest near −80 to −90 mV');
  assert.ok(m.purkinje.apd > m.ventricle.apd && m.ventricle.apd > m.atrial.apd, 'Purkinje longest, atrium shortest');
  assert.ok(m.sa.upstroke > 20 && m.av.upstroke > 20 && m.ventricle.upstroke < 5, 'nodal upstrokes are slow (calcium), working-cell upstrokes fast (sodium)');
  // SA phase 4 rises steadily from the MDP to threshold.
  const start = k.onsets.sa + k.up + k.rep, mid = cellAt('sa', start + 200, k).mv, late = cellAt('sa', start + 500, k).mv;
  assert.ok(mid > -60 && late > mid && late < -40, `SA diastolic depolarization ${mid} -> ${late}`);
  assert.equal(cellAt('sa', start + 200, k).phase, 4);
});

test('conduction cells: the channels open in the right phase', () => {
  const k = cascadeTiming(), top = (cell, ms) => currentsAt(cell, ms, k)[0].id;
  assert.equal(top('sa', k.onsets.sa + k.up + k.rep + 30), 'If', 'early SA phase 4: If');
  assert.equal(top('sa', k.onsets.sa + 10), 'ICaL', 'SA phase 0: L-type calcium');
  assert.equal(top('ventricle', k.onsets.ventricle + 1), 'INa', 'ventricular phase 0: sodium');
  assert.ok(['ICaL', 'IKr', 'IKs'].includes(top('ventricle', k.onsets.ventricle + 120)), 'ventricular plateau: calcium in against potassium out');
  assert.equal(top('purkinje', k.onsets.purkinje + 1), 'INa');
  const vagal = cascadeTiming({ tone: -1 }), ach = currentsAt('sa', 400, vagal).find(c => c.id === 'IKACh');
  assert.ok(ach.level > .8, 'vagal tone opens IKACh');
  assert.equal(currentsAt('sa', 400, k).find(c => c.id === 'IKACh').level, 0, 'no IKACh without vagal tone');
  for (const lang of ['tr', 'en']) for (const cell of CASCADE_CELLS) assert.ok(PHASES[lang][cell].length >= 3, `${lang} ${cell} phase table`);
});
console.log(`${passed} ECG chapter tests passed`);
