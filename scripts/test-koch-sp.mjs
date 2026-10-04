import assert from 'node:assert/strict';
import { DEFAULT_SITE, ZONES, assessSite, clampSite, ratioLabel, sitePoint, siteSignals, siteZone } from '../src/koch-sp-model.js';
import { EGM_BEATS, EGM_CHANNELS, EGM_TIMES, channelTrace, peakBetween } from '../src/koch-sp-egm.js';
import { KOCH_SP_TEXT } from '../src/koch-sp-text.js';

// The default site is the slow pathway target: small A, large V, no His.
const target = assessSite(DEFAULT_SITE);
assert.equal(target.zone, 'target');
assert.ok(target.ratio > 0.15 && target.ratio < 0.5, `target A:V ${target.ratioText}`);
assert.ok(target.his < 0.01 && target.slowPotential > 0.99 && !target.danger);

// Direction rules: toward the annulus the A shrinks, toward Todaro it grows; up the triangle a His appears.
assert.ok(siteSignals({ u: 0.18, v: 0.95 }).ratio < target.ratio, 'annulus side: smaller A:V');
assert.ok(siteSignals({ u: 0.18, v: 0.55 }).ratio > target.ratio, 'Todaro side: larger A:V');
for (let u = 0; u < 0.5; u += 0.05) assert.equal(siteSignals({ u, v: 0.8 }).his, 0, `no His potential low in the triangle (u ${u})`);
assert.ok(siteSignals({ u: 0.9, v: 0.8 }).his > siteSignals({ u: 0.7, v: 0.8 }).his, 'His grows toward the apex');

// Zones.
assert.equal(siteZone({ u: 0.9, v: 0.6 }), 'his');
assert.equal(siteZone({ u: 0.55, v: 0.2 }), 'fast');
assert.equal(siteZone({ u: 0.5, v: 0.8 }), 'mid');
assert.equal(siteZone({ u: 0.04, v: 0.5 }), 'cs');
assert.equal(siteZone({ u: 0.1, v: 0.35 }), 'atrial');
assert.equal(siteZone({ u: 0.1, v: 1 }), 'ventricular');
assert.ok(assessSite({ u: 0.9, v: 0.6 }).danger && assessSite({ u: 0.55, v: 0.2 }).danger);
const seen = new Set();
for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) seen.add(siteZone({ u: i / 20, v: j / 20 }));
assert.deepEqual([...seen].sort(), [...ZONES].sort(), 'every zone is reachable on the triangle');

// Inputs and labels.
assert.deepEqual(clampSite({ u: -1, v: 2 }), { u: 0, v: 1 });
assert.throws(() => clampSite({ u: NaN, v: 0 }), RangeError);
assert.equal(ratioLabel(0.25), '1:4.0');
assert.equal(ratioLabel(2), '2.0:1');

// Triangle map: corners and the CS ostium at the middle of the base.
const lerp = (a, b, f) => a + (b - a) * f;
const frame = { todaro: 0, csOs: 10, hinge: 20, apex: 100 };
assert.equal(sitePoint({ u: 0, v: 0 }, frame, lerp), 0);
assert.equal(sitePoint({ u: 0, v: 0.5 }, frame, lerp), 10);
assert.equal(sitePoint({ u: 0, v: 1 }, frame, lerp), 20);
assert.equal(sitePoint({ u: 1, v: 0.3 }, frame, lerp), 100);

// Recording: the ablation channel follows the model; reference channels do not move.
const T = EGM_TIMES;
const abl = site => channelTrace('abld', assessSite(site));
const aPeak = trace => peakBetween(trace, T.ablA - 10, T.ablA + 10);
const vPeak = trace => peakBetween(trace, T.ablV - 15, T.ablV + 15);
const atAnnulus = abl({ u: 0.18, v: 0.98 }), atTodaro = abl({ u: 0.18, v: 0.3 });
assert.ok(aPeak(atAnnulus) < aPeak(atTodaro) && vPeak(atAnnulus) > vPeak(atTodaro), 'A falls and V rises toward the annulus');
const hisWindow = trace => peakBetween(trace, T.hisH - 4, T.hisH + 4);
assert.ok(hisWindow(abl({ u: 0.9, v: 0.7 })) > 3 * hisWindow(abl(DEFAULT_SITE)) + 0.05, 'His deflection on the ablation channel near the apex');
assert.deepEqual(channelTrace('csp', assessSite({ u: 0.9, v: 0.1 })), channelTrace('csp', target), 'CS reference independent of the tip');
assert.ok(EGM_BEATS.length === 2 && EGM_CHANNELS.length === 7);
assert.ok(T.csp < T.csd && T.hra < T.csp, 'sinus: HRA first, then proximal before distal CS (concentric)');
assert.ok(T.hisH - T.hisA >= 60 && T.hisV - T.hisH >= 35, 'AH and HV in a normal range');

// Texts: both languages carry every zone and advice ({r} placeholder where the ratio matters).
for (const lang of ['tr', 'en']) {
  const t = KOCH_SP_TEXT[lang];
  for (const zone of ZONES) assert.ok(t.zones[zone] && t.advice[zone], `${lang} ${zone}`);
  for (const zone of ['target', 'atrial', 'ventricular']) assert.ok(t.advice[zone].includes('{r}'));
  assert.ok(!JSON.stringify(t).includes(String.fromCharCode(0x2014)), `${lang}: no em dash`);
}
console.log('PASS koch-sp: target site, A:V and His direction rules, all zones, triangle map, recording, texts');
