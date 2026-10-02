// Jugular venous pulse model (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md, section 9):
// wave timing on the shared clock, the pathological patterns, breathing,
// units, the catheterization cross-check, and the text in both languages.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CYCLE_SYNC as S, CARDIAC_INTERVALS, timeToPhase } from '../src/cardiac-cycle.js';
import { realTimeMean, createHemodynamics } from '../src/hemodynamics.js';
import { JVP_SCENARIOS, jvpCurve, targetMean, heightAboveSternalAngle, tricuspidOpen, WAVE_PHASE } from '../src/jvp-physiology.js';
import { JVP_TEXT } from '../src/jvp-content.js';

const at = (id, wave, opts) => jvpCurve(id, opts).labels.find(l => l.id === wave);
const baseline = (id, opts) => jvpCurve(id, opts).pressure(0.28);   // diastasis level
const interval = id => CARDIAC_INTERVALS.find(i => i.id === id);

// Normal timing: a after the P wave and before ventricular systole; c at QRS/S1;
// v while the tricuspid valve is closed; y after it opens.
const normal = jvpCurve('normal');
assert.ok(at('normal', 'a').u > S.pPeak && at('normal', 'a').u < S.avClosed, 'a after P, before ventricular systole');
assert.ok(at('normal', 'c').u >= S.qrsOnset && at('normal', 'c').u <= S.ejectionStart, 'c at QRS/S1');
assert.ok(!tricuspidOpen(at('normal', 'v').u) && !tricuspidOpen(at('normal', 'xp').u), 'v and x′ with the tricuspid valve closed');
assert.ok(tricuspidOpen(at('normal', 'y').u) && at('normal', 'y').u < interval('rapid-filling').end, 'y in rapid filling, valve open');
assert.ok(at('normal', 'x').u > at('normal', 'a').u && at('normal', 'x').u < at('normal', 'c').u, 'x (relaxation) between a and c');
assert.ok(at('normal', 'xp').u > interval('ventricular-ejection').start && at('normal', 'xp').u < interval('ventricular-ejection').end, 'x′ in ejection');
for (const w of ['a', 'c', 'v']) assert.ok(at('normal', w).p > at('normal', 'xp').p, `${w} above the x′ trough`);

// Every curve: finite, continuous across the cycle boundary, mean as specified.
for (const id of JVP_SCENARIOS) for (const respiration of ['exp', 'insp']) {
  const c = jvpCurve(id, { respiration });
  for (let i = 0; i <= 1000; i++) assert.ok(Number.isFinite(c.pressure(i / 1000)), `${id} finite`);
  assert.ok(Math.abs(c.pressure(0.9999) - c.pressure(0)) < 0.05, `${id} ${respiration}: continuous at the cycle boundary`);
  assert.ok(Math.abs(realTimeMean(c.pressure, 72) - c.mean) < 1e-9);
  // Real-time weighting: a different rate changes the time mean but the curve is on the same phase.
  assert.ok(Number.isFinite(realTimeMean(c.pressure, 130)));
}
assert.ok(Math.abs(normal.mean - targetMean('normal')) < 0.05, 'normal mean as specified');

// Cross-check with the catheterization module: same mean RA pressure.
for (const [jvpId, hemoId] of [['normal', 'normal'], ['constriction', 'constrictive_pericarditis'], ['tamponade', 'tamponade']]) {
  const hemo = createHemodynamics(hemoId);
  const hemoMean = hemo.getScenario().stations.ra.mean;
  assert.ok(Math.abs(jvpCurve(jvpId).mean - hemoMean) < 0.1, `${jvpId}: mean ${jvpCurve(jvpId).mean.toFixed(1)} = catheterization RA mean ${hemoMean}`);
}

// Patterns.
const yDepth = id => { const c = jvpCurve(id); return c.pressure(WAVE_PHASE.v) - at(id, 'y').p; };
const xpDepth = id => { const c = jvpCurve(id); return c.pressure(WAVE_PHASE.c) - c.pressure(WAVE_PHASE.xp); };
assert.ok(yDepth('tamponade') < 0.35 * yDepth('normal'), 'tamponade: y blunted');
assert.ok(xpDepth('tamponade') > xpDepth('normal'), 'tamponade: systolic x′ preserved and prominent');
assert.ok(yDepth('constriction') > 1.5 * yDepth('normal'), 'constriction: deep y');
assert.ok(at('constriction', 'y').u < at('normal', 'y').u, 'constriction: rapid (early) y');
assert.ok(xpDepth('constriction') > 0.8 * xpDepth('normal'), 'constriction: x′ preserved');
const tr = jvpCurve('tr');
assert.ok(tr.pressure(WAVE_PHASE.xp) > tr.pressure(WAVE_PHASE.c), 'TR: no systolic x′ (pressure keeps rising after c)');
assert.ok(at('tr', 'cv').p - baseline('tr') > 2 * (at('normal', 'v').p - baseline('normal')), 'TR: prominent c-v wave');
assert.ok(yDepth('tr') > yDepth('normal'), 'TR: rapid, deep y');
assert.ok(at('ts', 'a').p - baseline('ts') > 3 * (at('normal', 'a').p - baseline('normal')), 'TS: large a');
assert.ok(at('ts', 'y').u > at('normal', 'y').u && yDepth('ts') < yDepth('normal'), 'TS: slow, shallow y');
const af = jvpCurve('af');
assert.ok(!af.labels.some(l => l.id === 'a' || l.id === 'x'), 'AF: no a wave, no x');
assert.ok(af.pressure(WAVE_PHASE.a) - baseline('af') < 0.5, 'AF: no atrial bump at the a phase');
const cannon = at('cannon', 'cannon');
assert.ok(!tricuspidOpen(cannon.u) && cannon.u > S.ejectionStart, 'cannon a: atrial contraction against the closed valve, in systole');
assert.ok(cannon.p - baseline('cannon') > 2 * (at('normal', 'a').p - baseline('normal')), 'cannon a: large');

// Breathing: normal falls on inspiration, Kussmaul (constriction) rises, pure tamponade does not get Kussmaul.
const mean = (id, respiration) => jvpCurve(id, { respiration }).mean;
assert.ok(mean('normal', 'insp') < mean('normal', 'exp'), 'normal inspiration: JVP falls');
assert.ok(mean('constriction', 'insp') > mean('constriction', 'exp'), 'constriction: Kussmaul');
assert.ok(mean('tamponade', 'insp') < mean('tamponade', 'exp') && !jvpCurve('tamponade').kussmaul, 'tamponade: no automatic Kussmaul');

// Units: mmHg at the atrium versus cm above the sternal angle (1.36 cmH2O per mmHg, 5 cm assumption).
assert.ok(Math.abs(heightAboveSternalAngle(5) - 1.8) < 1e-9);
assert.ok(heightAboveSternalAngle(20) > 20, 'constriction level is well above the sternal angle');
assert.ok(heightAboveSternalAngle(2) < 0, 'low pressure: below the sternal angle');

// Text: both languages cover every scenario and every labelled wave; no em dash; synthetic label.
for (const lang of ['tr', 'en']) {
  const t = JVP_TEXT[lang];
  for (const id of JVP_SCENARIOS) {
    assert.ok(t.scenarios[id]?.title && t.scenarios[id]?.text, `${lang} ${id}`);
    for (const l of jvpCurve(id).labels) assert.ok(t.waves[l.id]?.name && t.waves[l.id]?.text, `${lang} wave ${l.id}`);
  }
  assert.match(t.synthetic, lang === 'tr' ? /öğretim değer/ : /teaching values/);
  assert.ok(!/cm/.test(t.axis), 'the pressure axis is mmHg, not cm');
}
for (const file of ['../src/jvp-physiology.js', '../src/jvp-content.js', '../src/jvp-panel.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
assert.ok(Number.isFinite(timeToPhase(0.5, 72)));
console.log('PASS jvp: wave timing, TR/TS/AF/constriction/tamponade/cannon patterns, breathing and Kussmaul, units, catheterization cross-check, TR/EN text');
