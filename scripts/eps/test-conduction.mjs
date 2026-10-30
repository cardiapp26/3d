// Conduction system lesson: structure facts (rates, velocities, supply), the beat of every
// scenario (order, intervals, block points), the lead II / V1 morphology, the atlas helpers,
// the baked atlas data and the TR / EN texts.
import assert from 'node:assert/strict';
import {
  STRUCTURE_IDS, STRUCTURES, SCENARIO_IDS, VENTRICULAR_REGIONS, PHASES, beatTimeline, intervalsOf, whatIfOf, structureOfScenario,
  impulseProgress, blockReached, localTime, regionProgress, phaseAt, leadVoltage, leadTrace, activationTime, rescaleTimes, simplifyPath, supplyColors, ARTERIES
} from '../../src/eps/conduction-model.js';
import { CONDUCTION_TEXT, CONDUCTION_REFERENCES } from '../../src/eps/conduction-text.js';
import { ATLAS_CONDUCTION_EXTRAS } from '../../src/eps/conduction-atlas-extras.js';
import { ATLAS_CONDUCTION } from '../../src/ecg/ecg-atlas-conduction.js';

let passed = 0;
const test = (name, fn) => { fn(); passed++; };

test('rates: SA 60-100 > AV junction 40-60 > ventricular 20-40', () => {
  assert.deepEqual(STRUCTURES.sa.rate, [60, 100]);
  assert.deepEqual(STRUCTURES.avn.rate, [40, 60]);
  for (const id of ['rbb', 'lbb', 'laf', 'lpf', 'purkinje']) assert.deepEqual(STRUCTURES[id].rate, [20, 40], id);
  for (const id of ['internodal', 'bachmann']) assert.equal(STRUCTURES[id].rate, null, id);
});

test('velocities: AV node slowest, Purkinje fastest, His 1-1.5, bundles 2', () => {
  assert.deepEqual(STRUCTURES.sa.velocity, [0.05, 0.05]);
  assert.deepEqual(STRUCTURES.avn.velocity, [0.01, 0.05]);
  assert.deepEqual(STRUCTURES.his.velocity, [1, 1.5]);
  assert.deepEqual(STRUCTURES.internodal.velocity, [0.3, 1]);
  assert.deepEqual(STRUCTURES.purkinje.velocity, [2, 4]);
  const min = Math.min(...STRUCTURE_IDS.map((id) => STRUCTURES[id].velocity[0]));
  const max = Math.max(...STRUCTURE_IDS.map((id) => STRUCTURES[id].velocity[1]));
  assert.equal(STRUCTURES.avn.velocity[0], min);
  assert.equal(STRUCTURES.purkinje.velocity[1], max);
  for (const id of ['rbb', 'lbb', 'laf', 'lpf']) assert.deepEqual(STRUCTURES[id].velocity, [2, 2], id);
});

test('blood supply: SA 60/40, AV node 90% RCA, LAF LAD only, LPF dual LAD + PDA', () => {
  assert.deepEqual(STRUCTURES.sa.supply, [{ artery: 'rca', share: 60 }, { artery: 'lcx', share: 40 }]);
  assert.deepEqual(STRUCTURES.avn.supply[0], { artery: 'rca', share: 90 });
  assert.deepEqual(STRUCTURES.laf.supply.map((s) => s.artery), ['lad']);
  assert.deepEqual(STRUCTURES.rbb.supply.map((s) => s.artery), ['lad']);
  assert.deepEqual(STRUCTURES.lpf.supply.map((s) => s.artery), ['lad', 'rca']);
  assert.equal(STRUCTURES.his.supply[0].artery, 'lad');
  assert.deepEqual(supplyColors('sa'), [ARTERIES.rca.color], 'a variant supply shows the usual artery');
  assert.deepEqual(supplyColors('lpf'), [ARTERIES.lad.color, ARTERIES.rca.color], 'a dual supply shows both');
  assert.deepEqual(supplyColors('nope'), []);
});

test('normal beat: order SA > atria > AV node > His > bundles > Purkinje > QRS', () => {
  const b = beatTimeline('normal');
  const s = b.segments;
  assert.ok(s.sa.end <= s.internodal.start);
  assert.ok(s.internodal.end <= s.avn.start + 1);
  assert.ok(s.avn.end <= s.his.start);
  for (const id of ['rbb', 'lbb']) assert.ok(s.his.end <= s[id].start, id);
  for (const id of ['laf', 'lpf', 'septal']) assert.ok(s.lbb.start < s[id].start, id);
  assert.ok(s.purkinje.end > b.qrsOnset && s.purkinje.start < b.qrsOnset);
  assert.equal(b.septalDirection, 'leftToRight');
  // The AV node holds the impulse longest and sets most of the PR interval.
  const longest = Object.entries(s).reduce((a, [id, v]) => (v.end - v.start > a[1] ? [id, v.end - v.start] : a), ['', 0]);
  assert.equal(longest[0], 'avn');
  assert.ok((s.avn.end - s.avn.start) / b.intervals.pr > 0.45);
});

test('normal intervals inside the normal ranges', () => {
  const iv = beatTimeline('normal').intervals;
  assert.ok(iv.pr >= 120 && iv.pr <= 200, `PR ${iv.pr}`);
  assert.ok(iv.ah >= 50 && iv.ah <= 120, `AH ${iv.ah}`);
  assert.ok(iv.hv >= 35 && iv.hv <= 55, `HV ${iv.hv}`);
  assert.ok(iv.qrs < 120 && iv.p < 120);
  assert.ok(iv.rate >= 60 && iv.rate <= 100);
});

test('ventricular order: septum first, posterobasal last (Durrer)', () => {
  for (const id of ['normal', 'lpfb', 'rbbb', 'firstDegree']) {
    const v = beatTimeline(id).ventricles;
    assert.deepEqual(Object.keys(v).sort(), [...VENTRICULAR_REGIONS].sort());
    const starts = VENTRICULAR_REGIONS.map((r) => v[r][0]), ends = VENTRICULAR_REGIONS.map((r) => v[r][1]);
    assert.equal(v.septum[0], Math.min(...starts), `${id} septum first`);
    assert.equal(v.posterobasal[1], Math.max(...ends), `${id} posterobasal last`);
  }
  const n = beatTimeline('normal');
  assert.equal(Math.max(...VENTRICULAR_REGIONS.map((r) => n.ventricles[r][1])), n.qrsOnset + n.qrsDuration);
  // LAFB: the inferoposterior wall comes early through the LPF, the anterosuperior / lateral LV last.
  const l = beatTimeline('lafb').ventricles;
  assert.ok(l.lvFree[1] > l.posterobasal[1] && l.posterobasal[0] < beatTimeline('normal').ventricles.posterobasal[0]);
});

test('scenarios change the beat as the cards say', () => {
  const b = Object.fromEntries(SCENARIO_IDS.map((id) => [id, beatTimeline(id)]));
  assert.equal(b.sinusArrest.pOnsets.length, 0);
  assert.equal(b.sinusArrest.intervals.pr, null);
  assert.ok(b.sinusArrest.rate >= 40 && b.sinusArrest.rate <= 60);
  assert.ok(b.sinusArrest.retroP > b.sinusArrest.qrsOnset, 'retrograde P after the QRS onset');
  assert.ok(b.sinusArrest.retroP > b.sinusArrest.atria.ra[0] && b.sinusArrest.retroP < b.sinusArrest.atria.la[1], 'retrograde P inside the retrograde atrial activation');
  assert.ok(b.sinusArrest.atria.ra[0] > b.sinusArrest.qrsOnset);
  assert.equal(b.sinusArrest.segments.internodal.reverse, true);
  assert.ok(b.interatrialBlock.intervals.p >= 120);
  assert.ok(b.interatrialBlock.atria.la[0] > b.normal.atria.la[0]);
  assert.equal(b.interatrialBlock.blocks.bachmann, undefined, 'partial block: slowed, not stopped');
  assert.ok(b.interatrialBlock.segments.bachmann.end - b.interatrialBlock.segments.bachmann.start > b.normal.segments.bachmann.end - b.normal.segments.bachmann.start);
  assert.equal(b.interatrialBlock.intervals.pr, b.normal.intervals.pr);
  assert.ok(b.firstDegree.intervals.pr > 200);
  assert.ok(b.firstDegree.intervals.ah > b.normal.intervals.ah);
  assert.equal(b.firstDegree.intervals.hv, b.normal.intervals.hv);
  assert.equal(b.hisBlock.intervals.pr, null);
  assert.ok(b.hisBlock.pOnsets.length >= 2, 'P waves march on');
  assert.ok(b.hisBlock.rate >= 20 && b.hisBlock.rate <= 40);
  assert.ok(b.hisBlock.qrsDuration >= 120);
  for (const id of ['laf', 'lpf', 'septal']) assert.equal(b.hisBlock.segments[id], null, id);
  assert.ok(b.hisBlock.blocks.rbb !== undefined && b.hisBlock.blocks.lbb !== undefined && b.hisBlock.blocks.his === undefined, 'infra-Hisian: both bundles blocked, His conducts');
  for (const id of ['rbbb', 'lbbb']) assert.ok(b[id].qrsDuration >= 120, id);
  for (const id of ['lafb', 'lpfb']) assert.ok(b[id].qrsDuration < 120, id);
  assert.equal(b.lbbb.septalDirection, 'rightToLeft');
  assert.equal(b.lbbb.segments.septal, null);
  assert.ok(b.rbbb.ventricles.rvFree[1] > b.rbbb.ventricles.lvFree[1], 'RBBB: RV last');
  assert.ok(b.lbbb.ventricles.lvFree[1] > b.lbbb.ventricles.rvFree[1], 'LBBB: LV last');
  assert.ok(!('rvModerator' in b.rbbb.sources) && !('septalLeft' in b.lbbb.sources) && !('lafEnd' in b.lafb.sources) && !('lpfEnd' in b.lpfb.sources));
  assert.equal(beatTimeline('nope'), b.normal);
  assert.ok(Object.isFrozen(b.normal) && Object.isFrozen(b.normal.segments.avn));
});

test('what-if toggles map to their structure and back', () => {
  for (const id of STRUCTURE_IDS) {
    const sc = whatIfOf(id);
    if (sc) { assert.ok(SCENARIO_IDS.includes(sc), id); assert.equal(structureOfScenario(sc), id); }
  }
  assert.deepEqual(STRUCTURE_IDS.filter((id) => !whatIfOf(id)), ['internodal', 'septal', 'purkinje']);
  assert.equal(structureOfScenario('normal'), null);
  for (const sc of SCENARIO_IDS.filter((s) => s !== 'normal')) {
    const owner = structureOfScenario(sc);
    assert.ok(owner, sc);
    const blocks = Object.keys(beatTimeline(sc).blocks);
    if (['firstDegree', 'interatrialBlock'].includes(sc)) assert.deepEqual(blocks, [], `${sc} slows, does not stop`);
    else if (sc === 'hisBlock') assert.deepEqual(blocks.sort(), ['lbb', 'rbb']);
    else assert.deepEqual(blocks, [owner], `${sc} blocks ${owner}`);
  }
});

test('impulse progress, block points and repeated P waves', () => {
  const n = beatTimeline('normal');
  assert.equal(impulseProgress(n, 'his', 100), null);
  assert.equal(impulseProgress(n, 'his', n.segments.his.start), 0);
  assert.equal(impulseProgress(n, 'his', 1000), 1);
  const mid = impulseProgress(n, 'avn', (n.segments.avn.start + n.segments.avn.end) / 2);
  assert.ok(mid > 0.45 && mid < 0.55);
  const r = beatTimeline('rbbb');
  assert.equal(impulseProgress(r, 'rbb', 500), r.blocks.rbb);
  assert.ok(blockReached(r, 'rbb', 500) && !blockReached(r, 'rbb', 140) && !blockReached(n, 'rbb', 500));
  const h = beatTimeline('hisBlock');
  assert.equal(impulseProgress(h, 'laf', 1000), null);
  assert.equal(impulseProgress(h, 'his', 300), 1, 'the His bundle conducts');
  assert.ok(impulseProgress(h, 'rbb', 300) <= h.blocks.rbb && blockReached(h, 'lbb', 300));
  assert.equal(localTime(h, 'avn', 860), 60, 'the second P restarts the AV node');
  assert.ok(impulseProgress(h, 'avn', 860) > 0);
  assert.equal(localTime(h, 'purkinje', 1690), 1690, 'the escape does not repeat');
  assert.equal(localTime(n, 'avn', 300), 300);
  const s = beatTimeline('sinusArrest');
  assert.ok(blockReached(s, 'sa', 0));
  assert.equal(impulseProgress(s, 'sa', 500), null);
  assert.equal(regionProgress([10, 20], 5), 0);
  assert.equal(regionProgress([10, 20], 15), 0.5);
  assert.equal(regionProgress([10, 20], 25), 1);
  assert.equal(regionProgress(null, 25), 0);
});

test('phases advance in order through a normal beat', () => {
  const n = beatTimeline('normal');
  let last = -1;
  for (let t = 0; t <= n.duration; t += 5) {
    const i = PHASES.indexOf(phaseAt(n, t));
    assert.ok(i >= last, `phase went back at ${t} ms`);
    last = i;
  }
  assert.equal(phaseAt(n, 5), 'sa');
  assert.equal(phaseAt(n, n.qrsOnset + 10), 'ventricles');
  assert.equal(phaseAt(beatTimeline('hisBlock'), 1000), 'pause');
});

// Lead morphology helpers.
const window_ = (beat, lead, from, to) => leadTrace(beat, lead, 1).filter((p) => p.t >= from && p.t <= to).map((p) => p.v);
const first = (beat, lead, ms) => window_(beat, lead, beat.qrsOnset, beat.qrsOnset + ms);

test('lead II and V1: septal q, small r in V1 and the block patterns', () => {
  const n = beatTimeline('normal');
  assert.ok(Math.min(...first(n, 'II', 14)) < -0.04, 'septal q in II');
  assert.ok(Math.max(...first(n, 'V1', 18)) > 0.15, 'initial r in V1');
  assert.ok(Math.max(...first(n, 'II', 90)) > 0.9, 'tall R in II');
  const l = beatTimeline('lbbb');
  assert.ok(Math.min(...first(l, 'II', 20)) > -0.01, 'no septal q in LBBB');
  assert.ok(Math.max(...first(l, 'V1', 40)) < 0.05, 'QS in V1 (LBBB)');
  const r = beatTimeline('rbbb');
  assert.ok(leadVoltage(r, 'V1', r.qrsOnset + 100) > 0.5, "R' in V1 (RBBB)");
  const lafb = first(beatTimeline('lafb'), 'II', 100);
  assert.ok(Math.min(...lafb) < -Math.max(...lafb), 'rS in II (LAFB)');
  const lpfb = first(beatTimeline('lpfb'), 'II', 100);
  assert.ok(Math.max(...lpfb) > 1.3 && Math.min(...lpfb) < 0, 'qR in II (LPFB)');
  // Interatrial block: bifid P in II (two peaks).
  const iab = beatTimeline('interatrialBlock');
  const p = window_(iab, 'II', iab.pOnsets[0], iab.pOnsets[0] + iab.pDuration);
  const peaks = p.filter((v, i) => i > 0 && i < p.length - 1 && v > p[i - 1] && v >= p[i + 1] && v > 0.05);
  assert.equal(peaks.length, 2);
  // Sinus arrest: no P before the QRS, an inverted retrograde P after it.
  const sa = beatTimeline('sinusArrest');
  assert.ok(Math.max(...window_(sa, 'II', 0, sa.qrsOnset - 20).map(Math.abs)) < 0.01);
  assert.ok(leadVoltage(sa, 'II', sa.retroP) < -0.08);
  // First-degree block keeps the QRS shape and moves it 120 ms later.
  const fd = beatTimeline('firstDegree');
  assert.ok(Math.abs(leadVoltage(fd, 'II', fd.qrsOnset + 36) - leadVoltage(n, 'II', n.qrsOnset + 36)) < 1e-9);
  assert.equal(leadTrace(n, 'II', 10).length, n.duration / 10 + 1);
});

test('atlas helpers: activation time, rescale, path simplification', () => {
  const sources = [{ p: [0, 0, 0], t: 10 }, { p: [1, 0, 0], t: 0 }];
  assert.equal(activationTime([1, 0, 0], sources, { velocity: 1, mmPerUnit: 10 }), 0);
  assert.equal(activationTime([0, 0, 0], sources, { velocity: 1, mmPerUnit: 10 }), 10);
  assert.equal(activationTime([0, 2, 0], [{ p: [0, 0, 0], t: 5 }], { velocity: 2, mmPerUnit: 10 }), 15);
  assert.deepEqual(rescaleTimes([5, 10, 15], 100, 50), [100, 125, 150]);
  assert.deepEqual(rescaleTimes([7, 7], 30, 10), [30, 30]);
  const path = [[0, 0, 0], [0.01, 0, 0], [0.5, 0, 0], [0.52, 0, 0], [1, 0, 0]];
  assert.deepEqual(simplifyPath(path, 0.1), [[0, 0, 0], [0.5, 0, 0], [1, 0, 0]]);
  assert.deepEqual(simplifyPath([[0, 0, 0], [1, 1, 1]]), [[0, 0, 0], [1, 1, 1]]);
});

test('baked atlas data: conduction parts and extras present', () => {
  for (const k of ['sa', 'avn', 'tractAnterior', 'tractMiddle', 'tractPosterior', 'his', 'rbb', 'lbb', 'laf', 'lpf', 'purkinjeRv', 'purkinjeLaf', 'purkinjeLpf']) assert.ok(ATLAS_CONDUCTION[k], k);
  assert.ok(ATLAS_CONDUCTION_EXTRAS.bachmann.length >= 5);
  for (const k of ['moderatorBand', 'rvAnteriorPapillary', 'lvPapillary', 'raCentre', 'laCentre', 'rvCentre', 'lvCentre']) assert.equal(ATLAS_CONDUCTION_EXTRAS[k].length, 3, k);
  // Anatomy sanity in the atlas frame: the RA lies to the patient's right of the LV, the LA behind the RV.
  assert.ok(ATLAS_CONDUCTION_EXTRAS.raCentre[0] < ATLAS_CONDUCTION_EXTRAS.lvCentre[0]);
  assert.ok(ATLAS_CONDUCTION_EXTRAS.laCentre[2] < ATLAS_CONDUCTION_EXTRAS.rvCentre[2]);
  // The Bachmann path runs from the SA region to the LA.
  const b = ATLAS_CONDUCTION_EXTRAS.bachmann, d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  assert.ok(d(b[0], ATLAS_CONDUCTION.sa) < 0.3 && d(b[b.length - 1], ATLAS_CONDUCTION_EXTRAS.laCentre) < d(b[0], ATLAS_CONDUCTION_EXTRAS.laCentre));
});

test('texts: both languages complete, same shape, no em dash', () => {
  const shape = (o) => (o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.length : shape(v)])) : typeof o);
  assert.deepEqual(shape(CONDUCTION_TEXT.tr), shape(CONDUCTION_TEXT.en));
  for (const lang of ['tr', 'en']) {
    const t = CONDUCTION_TEXT[lang];
    for (const id of STRUCTURE_IDS) for (const k of ['name', 'short', 'location', 'function', 'ecg', 'supply', 'note']) assert.ok(t.structure[id][k]?.length > 1, `${lang} ${id} ${k}`);
    for (const id of SCENARIO_IDS) assert.ok(t.scenario[id].name && t.scenario[id].effect, `${lang} ${id}`);
    for (const id of PHASES) assert.ok(t.phases[id], `${lang} phase ${id}`);
    for (const id of VENTRICULAR_REGIONS) assert.ok(t.regions[id], `${lang} region ${id}`);
    assert.equal(t.tableHead.length, 6);
    assert.ok(JSON.stringify(t).indexOf(String.fromCharCode(0x2014)) < 0, `${lang} em dash`);
  }
  assert.ok(/anterolateral/i.test(CONDUCTION_TEXT.en.structure.sa.location), 'SA node site corrected');
  assert.ok(/debated/i.test(CONDUCTION_TEXT.en.structure.internodal.note), 'internodal tracts debated');
  assert.ok(/left to right/i.test(CONDUCTION_TEXT.en.structure.septal.function));
});

test('references: unique, with DOIs, Tretter 2022 and Durrer 1970 cited', () => {
  const ids = CONDUCTION_REFERENCES.map((r) => r.id), dois = CONDUCTION_REFERENCES.map((r) => r.doi);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(dois).size, dois.length);
  for (const doi of dois) assert.match(doi, /^10\.\d{4,}\//);
  assert.ok(dois.includes('10.1093/europace/euab285') && dois.includes('10.1161/01.CIR.41.6.899') && dois.includes('10.1136/hrt.34.8.807'));
});

assert.ok(intervalsOf(beatTimeline('normal')).pr === 160);
console.log(`PASS conduction lesson: ${passed} groups`);
