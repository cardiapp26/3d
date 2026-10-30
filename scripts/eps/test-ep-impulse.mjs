// Impulse timeline (ep-impulse.js): read from the ladder for every case and SVT recording, with
// the mechanism's conduction steps (AVNRT slow down / fast up, orthodromic AVRT up the pathway,
// antidromic AVRT down the pathway, flutter around the annulus, AF wavelets, VT exit, block).
import assert from 'node:assert/strict';
import { impulseTimeline, impulseAt, impulseSteps, stepText, flutterAngle, pointAlong, routeLength, ROUTES, RECOVERY_MS } from '../../src/eps/ep-impulse.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';
import { EP_CASES, EP_RECORDING_IDS, epRecording } from '../../src/eps/ep-cases.js';
import { SVT_EXAMPLES, svtExampleRecording } from '../../src/eps/svt-dx-recordings.js';

function timelineOf(recording) {
  const known = EP_CASES.find((c) => c.id === recording.caseId);
  const mechanism = recording.mechanism || known?.mechanism || null;
  const ladder = buildLadder(inferLadderEvents(recording.events, { mechanism }), { until: recording.windowMs });
  return impulseTimeline(recording, ladder, { mechanism, pathwayZone: known?.pathwayZone || null });
}
const svt = (id) => timelineOf(svtExampleRecording(id));
const texts = (tl, lang = 'tr') => impulseSteps(tl, lang).map((s) => s.text);

// Geometry helpers.
const line = [[0, 0], [10, 0], [10, 10]];
assert.equal(routeLength(line), 20);
assert.deepEqual(pointAlong(line, 0), [0, 0]);
assert.deepEqual(pointAlong(line, 0.5), [10, 0]);
assert.deepEqual(pointAlong(line, 1), [10, 10]);
assert.deepEqual(pointAlong(line, 2), [10, 10]);

// Every recording gives a finite timeline; every step has text in both languages, inside the window.
const all = [...EP_RECORDING_IDS.map(epRecording), ...SVT_EXAMPLES.map((e) => svtExampleRecording(e[0]))].filter(Boolean);
assert.ok(all.length > 90);
for (const r of all) {
  const tl = timelineOf(r);
  for (const it of tl.items) {
    assert.ok(Number.isFinite(it.t0) && Number.isFinite(it.t1) && it.t1 >= it.t0, `${r.id}: item times`);
    if (it.kind === 'path') assert.ok(ROUTES[it.route] || it.route === 'hps', `${r.id}: route ${it.route}`);
  }
  const hasV = tl.items.some((it) => it.kind === 'ventricle');
  const steps = impulseSteps(tl, 'tr');
  if (hasV) assert.ok(steps.length >= 1, `${r.id}: steps`);
  for (const lang of ['tr', 'en']) for (const s of impulseSteps(tl, lang)) assert.ok(s.text && s.t >= -100 && s.t <= r.windowMs, `${r.id}: step ${lang}`);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i].t >= steps[i - 1].t, `${r.id}: steps in time order`);
}

// Typical AVNRT: down the slow pathway, up the fast one, septal atrial activation.
const avnrt = texts(svt('avnrt-typ-svt'));
assert.ok(avnrt.indexOf('AV düğüm: yavaş yoldan aşağı') >= 0 && avnrt.indexOf('Hızlı yoldan yukarı (retrograd)') > avnrt.indexOf('AV düğüm: yavaş yoldan aşağı'));
assert.ok(avnrt[0].includes('Koch'));
// Atypical AVNRT: down the fast pathway, up the slow one.
const atyp = texts(svt('avnrt-atyp-svt'));
assert.ok(atyp.includes('AV düğüm: hızlı yoldan aşağı') && atyp.includes('Yavaş yoldan yukarı (retrograd)'));

// Orthodromic AVRT over a left lateral pathway: up the pathway, eccentric left atrial activation.
const ll = svt('ap-ll-svt');
assert.equal(ll.apZone, 'left-free-wall');
assert.ok(texts(ll).includes('Aksesuar yoldan yukarı (retrograd)'));
assert.ok(texts(ll).some((t) => t.includes('sol lateral')));
assert.ok(ll.items.some((it) => it.kind === 'atrium' && it.seeds[0][0] > 250), 'left lateral atrial site');
// Inferior paraseptal and para-Hisian pathways sit where their names say.
assert.equal(svt('ap-ips-svt').apZone, 'inferior-paraseptal');
assert.equal(svt('ph-svt').apZone, 'superior-paraseptal');
// Antidromic AVRT: down the pathway (wide QRS from the pathway end), up the node.
const anti = texts(svt('ap-lm-antidromic'));
assert.ok(anti.includes('Aksesuar yoldan aşağı (preeksitasyon)') && anti.some((t) => t.includes('geniş QRS, delta')));

// Flutter: one wavefront circling counter-clockwise (the angle falls with time) and AV block.
const fl = svt('flutter-svt');
const ring = fl.items.find((it) => it.kind === 'flutter');
assert.ok(ring && ring.cl > 150 && ring.cl < 350);
assert.ok(flutterAngle(ring, ring.anchors[0] + 20) < flutterAngle(ring, ring.anchors[0]));
assert.ok(fl.items.some((it) => it.kind === 'block'));
assert.ok(texts(fl)[0].includes('triküspit'));
// AF: scattered wavelets, no organized atrial activation.
const af = timelineOf(epRecording('af-pvi-baseline'));
assert.ok(af.items.filter((it) => it.kind === 'wavelet').length >= 5);
assert.equal(af.items.filter((it) => it.kind === 'atrium').length, 0);
// VT: ventricular activation from the exit, wide QRS.
const vt = svt('wct-vt-vs-svt');
assert.ok(vt.items.some((it) => it.kind === 'ventricle' && it.origin === 'vt' && it.wide));

// Sinus: SA node, fast pathway, His-Purkinje, then the ventricles once the bundles arrive.
const sinus = svt('eps-baseline');
const steps = impulseSteps(sinus, 'en').map((s) => s.text);
assert.deepEqual(steps, ['The sinus node activates the atria', 'AV node: down the fast pathway', 'His-Purkinje: along the His and the bundle branches', 'The ventricles activate over the bundle branches (narrow QRS)']);
const hps = sinus.items.find((it) => it.kind === 'path' && it.route === 'hps');
const ventricle = sinus.items.find((it) => it.kind === 'ventricle' && it.t0 > hps.t0);
assert.ok(ventricle.t0 >= hps.t0 + 20, 'ventricles start after the His');

// State at a time: progress in [0, 1], recovery fades after the item ends.
const at = impulseAt(sinus, hps.t0 + (hps.t1 - hps.t0) / 2).find((it) => it.route === 'hps');
assert.ok(at.active && Math.abs(at.progress - 0.5) < 0.02);
const late = impulseAt(sinus, hps.t1 + RECOVERY_MS / 2).find((it) => it.route === 'hps');
assert.ok(!late.active && late.recovery > 0.4 && late.recovery < 0.6);
assert.equal(impulseAt(sinus, hps.t1 + RECOVERY_MS + 5).find((it) => it.route === 'hps'), undefined);
assert.equal(stepText({ kind: 'atrium', origin: 'sinus' }, 'en', 'focal-at'), 'An atrial focus activates the atrium');

console.log(`PASS ep-impulse: ${all.length} recordings, steps in time order (TR/EN), AVNRT slow/fast, AVRT pathway sites, antidromic, flutter ring, AF wavelets, VT exit, His before ventricles, progress/recovery`);
