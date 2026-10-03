// EGM basics model (src/eps/egm-basics-model.js): each claim of the tab.
// A wave leaving its origin gives a unipolar QS, a passing wave rS; the
// bipolar reduces the far field but does not erase it (more with a wider
// pair) and loses the local signal for a wave crossing the pair axis; a
// high-pass filter at 30 Hz destroys the QS and the unipolar keeps it with
// a low cut-off; a lower low-pass flattens the downstroke; intervals are
// ranged (HV limits 55, 70, 100); each block case reads at its level; the
// decremental AV node has no jump on its own and a jump of 50 ms or more
// with a slow pathway.
import assert from 'node:assert/strict';
import {
  SPACINGS, HIGH_PASS, LOW_PASS, BLOCK_CASES, electrodePair, filterBeat, classifyIntervals, blockCase, ahAt, ahCurve, AVN_ERP, FAST_ERP
} from '../../src/eps/egm-basics-model.js';
import { BASICS_TEXT } from '../../src/eps/egm-basics-text.js';

// Unipolar and bipolar.
assert.equal(electrodePair({ source: 'origin' }).morphology, 'QS', 'a focus gives a unipolar QS');
assert.equal(electrodePair({ source: 'passing' }).morphology, 'rS', 'a passing wave gives rS');
const base = electrodePair({ source: 'passing', angle: 0, spacing: 5 });
assert.ok(base.farRatio > 0 && base.farRatio < 0.1, `far field reduced but not erased (${base.farRatio})`);
assert.ok(electrodePair({ spacing: 10 }).farRatio > electrodePair({ spacing: 1 }).farRatio, 'wider pair, more far field');
assert.ok(electrodePair({ spacing: 10 }).bipolarAmp > electrodePair({ spacing: 1 }).bipolarAmp, 'wider pair, larger local signal');
assert.ok(electrodePair({ angle: 90 }).bipolarAmp < 0.01, 'across the pair axis the local bipolar signal vanishes');
assert.ok(electrodePair({ angle: 60 }).bipolarAmp < base.bipolarAmp, 'oblique wave: smaller bipolar signal');
assert.equal(SPACINGS.length, 4);

// Filters.
const wide = filterBeat({ hp: 0.05, lp: 500 }), narrow = filterBeat({ hp: 30, lp: 500 });
assert.ok(wide.qs && wide.overshoot < 0.16, 'wide unipolar band keeps the QS');
assert.ok(!narrow.qs && narrow.overshoot > 0.5, '30 Hz high-pass adds a large rebound');
assert.ok(filterBeat({ hp: 1, lp: 500 }).overshoot > wide.overshoot, 'a higher cut-off, more rebound');
assert.ok(narrow.wander < wide.wander, 'the high-pass removes baseline wander');
assert.ok(filterBeat({ hp: 0.05, lp: 40 }).slopeRatio < filterBeat({ hp: 0.05, lp: 500 }).slopeRatio, 'a low low-pass flattens the downstroke');
assert.equal(HIGH_PASS.length + LOW_PASS.length, 8);

// Intervals.
assert.deepEqual(classifyIntervals({ pa: 40, ah: 85, hv: 45 }), { pa: 'normal', ah: 'normal', hv: 'normal' });
assert.equal(classifyIntervals({ pa: 40, ah: 85, hv: 60 }).hv, 'borderline');
assert.equal(classifyIntervals({ pa: 40, ah: 85, hv: 80 }).hv, 'long');
assert.equal(classifyIntervals({ pa: 40, ah: 85, hv: 100 }).hv, 'high');
assert.equal(classifyIntervals({ pa: 40, ah: 85, hv: 30 }).hv, 'short');
assert.equal(classifyIntervals({ pa: 40, ah: 230, hv: 45 }).ah, 'long');

// Block levels.
const levels = Object.fromEntries(BLOCK_CASES.map((id) => [id, blockCase(id)]));
assert.deepEqual(Object.fromEntries(Object.entries(levels).map(([id, c]) => [id, c.level])), {
  normal: 'normal', 'nodal-first-degree': 'delay', 'wenckebach-nodal': 'nodal', 'intra-his': 'intraHis', 'mobitz2-infra': 'infraHis', 'mobitz1-infra': 'infraHis'
});
const his = (c) => c.events['his-d'];
const blocked = (c) => c.beats.find((b) => b.stop);
const near = (c, t, type) => his(c).filter((e) => e.type === type && e.t >= t - 5 && e.t <= t + 200);
// Nodal: A without H. Infra: A and H without V. Intra: H without H'.
const nodal = levels['wenckebach-nodal'], nb = blocked(nodal);
assert.equal(near(nodal, nb.a, 'H').length, 0, 'nodal block: no H');
assert.ok(nodal.beats.slice(0, 3).every((b, i, a) => !i || b.ah > a[i - 1].ah), 'Wenckebach: AH lengthens');
const infra = levels['mobitz2-infra'], ib = blocked(infra);
assert.equal(near(infra, ib.a, 'H').length, 1, 'infra-His block: H seen');
assert.equal(ib.v, null, 'infra-His block: no V');
assert.ok(infra.wide, 'wide QRS in the infra-His cases');
const m1 = levels['mobitz1-infra'];
assert.ok(m1.beats.slice(0, 3).every((b, i, a) => !i || b.hv > a[i - 1].hv) && m1.level === 'infraHis', 'Mobitz 1 pattern with HV lengthening reads infra-His');
const intra = levels['intra-his'], xb = blocked(intra);
assert.equal(near(intra, xb.a, 'H').length, 1, 'intra-His block: only the first potential');
assert.equal(intra.beats[0].split, true);
assert.equal(near(intra, intra.beats[0].a, 'H').length, 2, 'conducted beats: split His');
assert.ok(levels.normal.beats.every((b) => !b.stop && b.v != null), 'normal: every beat conducts');

// Decremental AV node.
const plain = ahCurve({ dual: false }), dual = ahCurve({ dual: true });
assert.ok(plain.jump < 40, `no jump on its own (${plain.jump})`);
assert.ok(dual.jump >= 50 && dual.jumpAt === FAST_ERP - 10, `jump with a slow pathway (${dual.jump} at ${dual.jumpAt})`);
assert.ok(ahAt(300, {}).ah > ahAt(500, {}).ah, 'earlier A2, longer AH');
assert.equal(ahAt(AVN_ERP - 10, {}).ah, null, 'below the node ERP: no conduction');
assert.equal(ahAt(300, { dual: true }).pathway, 'slow');
assert.equal(ahAt(400, { dual: true }).pathway, 'fast');

// Texts in both languages.
for (const lang of ['tr', 'en']) {
  const t = BASICS_TEXT[lang];
  for (const id of BLOCK_CASES) assert.ok(t.block.cases[id], `${lang} case ${id}`);
  for (const level of ['normal', 'delay', 'nodal', 'intraHis', 'infraHis']) assert.equal(t.block.levels[level].length, 2, `${lang} ${level}`);
  for (const id of ['hra', 'his', 'cs', 'rv']) assert.ok(t.catheters.items[id].lines.length >= 3, `${lang} ${id}`);
  for (const k of ['short', 'normal', 'long', 'borderline', 'high']) assert.ok(t.intervals.states[k]);
}
console.log('PASS egm-basics: unipolar QS vs rS, bipolar far field reduced not erased and lost across the axis, filter band (QS kept, 30 Hz rebound, baseline, downstroke), interval ranges and HV limits, six block cases at their level, decremental AH and the jump with a slow pathway, TR/EN texts');
