// Flutter circuit of the live EP laboratory in LAO (ep-flutter-circuit.js): the counterclockwise
// front is timed from the His A of each cycle, passes the His and HRA catheters when their A is
// recorded, is slowest in the isthmus, and lead II splits into the limbs as the literature maps
// it (descending limb: septum and roof; nadir: the free wall starts its craniocaudal activation;
// positive part: lateral wall; plateau: isthmus).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveHeart, planTrain, LIVE_SITES, SITE_CHANNEL, LIVE_CHANNELS } from '../../src/eps/ep-live-model.js';
import { planOverdrive, overdriveStart, analyzeOverdrive, interpretSite } from '../../src/eps/ep-live-maneuvers.js';
import { ORIGINS } from '../../src/eps/ep-live-substrates.js';
import { CIRCUIT_SEGMENTS, CIRCUIT_SITES, circuitAngle, segmentSpeeds, circuitAt, circuitClock, flutterAnchors, lastActivation, originSpot, leadIiTrace, normAngle, entrainmentAt, blockCheck, pacedSpread, LESION_ANGLE } from '../../src/eps/ep-flutter-circuit.js';
import { LIVE_TEXT } from '../../src/eps/ep-live-text.js';

// ---- Geometry and time course of one cycle ----
assert.deepEqual(CIRCUIT_SEGMENTS.map((s) => s.id), ['septum', 'roof', 'lateral', 'cti']);
const loop = CIRCUIT_SEGMENTS.reduce((sum, s) => sum + (s.from - s.to), 0);
assert.equal(loop, 360, 'the limbs close the ring');
CIRCUIT_SEGMENTS.forEach((s, i) => assert.equal(normAngle(s.to), normAngle(CIRCUIT_SEGMENTS[(i + 1) % 4].from), `${s.id} joins the next limb`));
assert.deepEqual(circuitAngle(0), { angle: CIRCUIT_SITES.his, segment: 'roof' }, 'at the His A the front is at the His region');
const speeds = segmentSpeeds(240);
assert.ok(speeds.cti < Math.min(speeds.septum, speeds.roof, speeds.lateral), `isthmus slowest ${JSON.stringify(speeds)}`);
// Counterclockwise in LAO: up the septum (right side), across the top, down the lateral wall (left side).
let prev = null, unwrapped = 0;
for (let tau = 0; tau < 240; tau += 5) {
  const a = circuitAngle(tau).angle;
  if (prev != null) { const d = ((a - prev + 540) % 360) - 180; assert.ok(d < 0, `angle decreases at ${tau} ms`); unwrapped += d; }
  prev = a;
}
assert.ok(unwrapped < -340 && unwrapped > -360, 'one turn per cycle');
assert.deepEqual(circuitAngle(240 + 37), circuitAngle(37), 'periodic');
assert.deepEqual(circuitAngle(-10), circuitAngle(230), 'before the His: still climbing the septum');
assert.equal(circuitAngle(-10).segment, 'septum');
assert.ok(CIRCUIT_SITES.hra > 240 && CIRCUIT_SITES.hra < 300, `HRA on the high lateral wall (${CIRCUIT_SITES.hra})`);
assert.equal(circuitAngle(ORIGINS.flutter.hra - ORIGINS.flutter['his-d']).segment, 'lateral');

// ---- Origins of a non-flutter activation ----
assert.deepEqual(['flutter', 'sinus', 'hra', 'cs-prox', 'cs-dist', 'cti', 'avn-fast', 'ap-ps', 'ap-left', 'la-focus', 'af', 'vt'].map(originSpot),
  ['circuit', 'sinus', 'hra', 'cs', 'cs', 'cti', 'septal', 'septal', 'left', 'left', 'af', 'other']);

// ---- On the live heart ----
const sinus = createLiveHeart('normal');
sinus.advanceTo(3000);
const sEv = sinus.events(0, 3000);
assert.equal(circuitAt(sEv, 2900), null, 'no circuit in sinus rhythm');
assert.equal(lastActivation(sEv, 3000).origin, 'sinus');
assert.equal(lastActivation(sEv, 3000).spot, 'sinus');

const heart = createLiveHeart('flutter-cti');
heart.advanceTo(1000);
heart.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }));
heart.advanceTo(9000);
assert.ok(heart.status().flutterActive, 'flutter induced');
const ev = heart.events(6000, 9000);
const anchors = flutterAnchors(ev);
assert.ok(anchors.length >= 10);
assert.ok(anchors.slice(1).every((t, i) => t - anchors[i] === 240), 'one His A per 240 ms cycle');
const his = anchors[anchors.length - 3];
const clock = circuitClock(ev);
assert.equal(clock(his).angle, CIRCUIT_SITES.his, 'front at the His when the His A is recorded');
const hraA = ev.hra.find((e) => e.type === 'A' && e.origin === 'flutter' && e.t > his).t;
assert.equal(Math.round(clock(hraA).angle), CIRCUIT_SITES.hra, 'front at the HRA tip when the HRA A is recorded');
assert.equal(clock(his + 30).tcl, 240);
assert.equal(circuitAt(ev, anchors[0] - 50), null, 'not before the first cycle in the window');
assert.equal(circuitAt(ev, anchors.at(-1) + 240), null, 'not past the last cycle');

// Lead II limb by limb over one cycle.
const trace = leadIiTrace(ev, his - 90, his + 150, 240);
const nadir = trace.reduce((m, p) => (p.f < m.f ? p : m));
assert.equal(Math.round(nadir.t - his), 60, 'F nadir 60 ms after the His A');
assert.equal(nadir.segment, 'lateral', 'nadir as the free wall starts its craniocaudal activation');
assert.ok(clock(nadir.t).angle > 270, 'nadir with the front high on the lateral wall');
const range = (seg) => trace.filter((p) => p.segment === seg).reduce((r, p) => ({ min: Math.min(r.min, p.f), max: Math.max(r.max, p.f) }), { min: Infinity, max: -Infinity });
const depth = -nadir.f;
const roof = range('roof'), sept = range('septum'), lat = range('lateral'), cti = range('cti');
assert.ok(roof.max < -0.4 * depth, 'roof: steep descending limb');
assert.ok(sept.min < -0.3 * depth && sept.max <= 0.01, 'septum: the slow descending limb');
assert.ok(lat.max > 0, 'lateral wall: back up to the positive part');
assert.ok(Math.max(Math.abs(cti.min), Math.abs(cti.max)) < 0.15 * depth, 'isthmus: plateau');
const t0 = trace[0], tEnd = trace[trace.length - 1];
assert.ok(Number.isFinite(t0.full) && Number.isFinite(tEnd.full), 'full lead sampled');

// ---- Phase 2: the model behind entrainment ----
assert.ok(LIVE_SITES.includes('cti') && SITE_CHANNEL.cti === 'abl-d' && LIVE_CHANNELS.includes('abl-d'), 'CTI pacing on the ablation catheter');
const FLO = ORIGINS.flutter;
assert.ok(FLO['cs-910'] < FLO['his-d'] && FLO['his-d'] < FLO.hra && FLO.hra < FLO['abl-d'], 'CCW: CS ostium, His, high lateral RA, isthmus last');
assert.equal(FLO.f - FLO['his-d'], 60, 'F nadir 60 ms after the His A');
assert.equal(CIRCUIT_SITES.csOs, 150, 'CS ostium at 5 o\'clock');
assert.ok(CIRCUIT_SITES.cti > 165 && CIRCUIT_SITES.cti < 210, `ablation catheter on the isthmus (${CIRCUIT_SITES.cti})`);

/** Flutter, then atrial overdrive 20 ms below the TCL from a site (as the maneuver does). */
function overdrive(site, n = 8) {
  const h = createLiveHeart('flutter-cti');
  h.advanceTo(1000);
  h.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }));
  h.advanceTo(9000);
  const st = planOverdrive({ site, start: overdriveStart(h.events(0, 9000), 9000, site, 240, 20), tcl: 240, offset: 20, n });
  h.stimulate(st);
  const end = st[st.length - 1].t + 2500;
  h.advanceTo(end);
  const events = h.events(0, end);
  return { h, st, end, events, r: analyzeOverdrive(events, st), opts: { tcl: 240, ppiExtra: h.param('flutter.ppiExtra') } };
}
const doubles = (events, ch, from, to) => {
  const a = events[ch].filter((e) => e.type === 'A' && e.t >= from && e.t <= to).map((e) => e.t).sort((x, y) => x - y);
  return a.slice(1).filter((t, i) => t - a[i] < 150).length;
};
const expected = { hra: ['inCircuit', 'manifest'], 'cs-prox': ['inCircuit', 'manifest'], cti: ['inCircuit', 'concealed'], 'cs-56': ['outside', 'none'], 'cs-dist': ['outside', 'none'] };
for (const [site, [verdict, fusion]] of Object.entries(expected)) {
  const { st, end, events, r, opts } = overdrive(site);
  assert.ok(r.captured && r.entrained && !r.terminated, `${site}: entrained ${JSON.stringify(r)}`);
  assert.equal(interpretSite(r), verdict, `${site}: maneuver verdict`);
  const last = st[st.length - 1].t;
  const ring = entrainmentAt(events, end, opts);
  assert.equal(ring.site, site);
  assert.equal(ring.ppiTcl, r.ppiTcl, `${site}: ring PPI matches the maneuver`);
  assert.equal(ring.verdict, verdict);
  assert.equal(ring.fusion, fusion);
  assert.equal(ring.outside, verdict === 'outside');
  // During the train: an orthodromic front on the ring, antidromic fronts that meet the wave ahead.
  let anti = 0, hits = 0, path = 0;
  for (let t = st[0].t; t < last + 240; t += 5) {
    const e = entrainmentAt(events, t, opts);
    if (!e) continue;
    if (e.fronts.some((f) => f.kind === 'anti')) anti++;
    if (e.collisions.length) hits++;
    if (e.path != null) path++;
  }
  assert.ok(anti > 0 && hits > 0, `${site}: antidromic fronts collide`);
  assert.equal(path > 0, verdict === 'outside', `${site}: the left atrial route to the CS ostium only from outside`);
  // The last orthodromic front hands over to the circuit clock without a jump.
  const hr = flutterAnchors(events).find((a) => a > last);
  const before = entrainmentAt(events, hr - 1, opts).fronts.find((f) => f.kind === 'ortho');
  const after = circuitAt(events, hr + 1);
  const gap = Math.abs(((before.angle - after.angle + 540) % 360) - 180);
  assert.ok(gap < 10, `${site}: seamless return (${before.angle} to ${after.angle})`);
  assert.equal(circuitAt(events, st[2].t + 30), null, `${site}: no free-running circuit drawn over the paced beats`);
  if (site === 'cti') {
    // Concealed entrainment: F waves go on at the paced cycle, the sequence stays the flutter's, no double activation.
    const fs = events['ecg-ii'].filter((e) => e.type === 'F' && e.t > st[2].t && e.t < last).map((e) => e.t);
    assert.ok(fs.length >= 4 && fs.slice(1).every((t, i) => Math.round(t - fs[i]) === 220), 'F waves at the pacing cycle');
    for (const ch of ['his-d', 'cs-910', 'hra', 'abl-d']) assert.equal(doubles(events, ch, st[0].t - 300, end), 0, `no double activation on ${ch}`);
    const paced = events['cs-910'].find((e) => e.type === 'A' && e.origin === 'cti');
    const his = events['his-d'].find((e) => e.type === 'A' && e.origin === 'cti' && e.t > paced.t);
    assert.equal(his.t - paced.t, FLO['his-d'] - FLO['cs-910'], 'CS ostium to His as in flutter');
  } else {
    assert.equal(events['ecg-ii'].filter((e) => e.type === 'F' && e.t > st[3].t + 50 && e.t < last).length, 0, `${site}: paced P waves replace the F waves (manifest)`);
  }
}
// Pacing in sinus rhythm is not entrainment.
const sinusPaced = createLiveHeart('normal');
sinusPaced.advanceTo(2000);
sinusPaced.stimulate(planTrain({ site: 'cti', start: 2100, s1: 500, n: 4 }));
sinusPaced.advanceTo(5000);
const spEv = sinusPaced.events(0, 5000);
assert.equal(entrainmentAt(spEv, 3200, { tcl: 240, ppiExtra: { hra: 20, 'cs-prox': 10, 'cs-dist': 120, cti: 5 } }), null);
assert.equal(lastActivation(spEv, 3200).spot, 'cti', 'paced from the isthmus');
assert.equal(entrainmentAt(spEv, 3200, { tcl: 240 }), null, 'no case return cycles, no entrainment');

// CTI ablation: the circuit stops.
const abl = createLiveHeart('flutter-cti');
abl.advanceTo(1000);
abl.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }));
abl.advanceTo(6000);
abl.rfStart('cti', 6000);
abl.advanceTo(20000);
assert.equal(circuitAt(abl.events(16000, 20000), 19900), null, 'no circuit after CTI ablation');

// ---- Phase 3: clockwise flutter, the isthmus line and the bidirectional block check ----
assert.deepEqual(circuitAngle(0, 240, 'cw'), circuitAngle(0), 'clockwise: same His position');
assert.equal(circuitAngle(ORIGINS['flutter-cw'].hra, 240, 'cw').angle, circuitAngle(ORIGINS.flutter.hra - ORIGINS.flutter['his-d']).angle, 'clockwise HRA at the same catheter');
assert.equal(Math.round(circuitAngle(ORIGINS['flutter-cw']['cs-910'], 240, 'cw').angle), CIRCUIT_SITES.csOs, 'clockwise CS ostium at the same catheter');
{
  let prevA = null;
  for (let tau = 0; tau < 240; tau += 5) {
    const a = circuitAngle(tau, 240, 'cw').angle;
    if (prevA != null) assert.ok(((a - prevA + 540) % 360) - 180 > 0, `clockwise angle increases at ${tau}`);
    prevA = a;
  }
}
const cw = createLiveHeart('flutter-cw');
cw.advanceTo(1000);
cw.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }));
cw.advanceTo(9000);
assert.ok(cw.status().flutterActive && cw.param('flutter.dir') === 'cw', 'clockwise flutter induced');
const cwEv = cw.events(6000, 9000);
assert.ok(cwEv['ecg-ii'].filter((e) => e.type === 'F').every((f) => f.amp > 0), 'positive F waves in II');
const cwClock = circuitClock(cwEv, { dir: 'cw' });
const cwHis = flutterAnchors(cwEv).at(-3);
assert.equal(cwClock(cwHis).angle, CIRCUIT_SITES.his);
const cwHra = cwEv.hra.find((e) => e.type === 'A' && e.origin === 'flutter' && e.t > cwHis).t;
assert.equal(Math.round(cwClock(cwHra).angle), CIRCUIT_SITES.hra, 'front at the HRA tip when its A is recorded (clockwise)');
const cwTrace = leadIiTrace(cwEv, cwHis, cwHis + 240, 240, { dir: 'cw' });
const peak = cwTrace.reduce((m, p) => (p.f > m.f ? p : m));
assert.ok(['lateral', 'roof'].includes(peak.segment), `positive F peak as the lateral wall climbs (${peak.segment})`);
for (const [site, verdict] of [['hra', 'inCircuit'], ['cs-prox', 'inCircuit'], ['cti', 'inCircuit'], ['cs-dist', 'outside']]) {
  const h = createLiveHeart('flutter-cw');
  h.advanceTo(1000); h.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 })); h.advanceTo(9000);
  const st = planOverdrive({ site, start: overdriveStart(h.events(0, 9000), 9000, site, 240, 20), tcl: 240, offset: 20, n: 8 });
  h.stimulate(st); h.advanceTo(st[st.length - 1].t + 2500);
  assert.equal(interpretSite(analyzeOverdrive(h.events(0, st[st.length - 1].t + 2500), st)), verdict, `clockwise entrainment from ${site}`);
}
assert.equal(entrainmentAt(cwEv, 8000, { tcl: 240, ppiExtra: cw.param('flutter.ppiExtra'), dir: 'cw' }), null, 'ring entrainment drawn for the typical circuit only');

// The line: CTI lesion blocks the isthmus; paced from either side the wave goes the long way round.
const pace = (heart, site, at) => {
  heart.stimulate(planTrain({ site, start: at, s1: 600, n: 1 }));
  heart.advanceTo(at + 900);
  return blockCheck(heart.events(at - 2000, at + 900), at + 900);
};
const before = createLiveHeart('flutter-cti');
before.advanceTo(2000);
const open = pace(before, 'cs-prox', 2100);
assert.equal(open.block, false, `isthmus conducts before the line ${JSON.stringify(open)}`);
assert.ok(open.interval < 40);
const line = createLiveHeart('flutter-cti');
line.advanceTo(1000);
line.stimulate(planTrain({ site: 'hra', start: 1000, s1: 250, n: 8 }));
line.advanceTo(6000);
line.rfStart('cti', 6000);
line.advanceTo(12000);
assert.ok(line.status().ctiBlock && !line.status().flutterActive, 'line made, flutter over');
const fromCs = pace(line, 'cs-prox', 12100);
assert.ok(fromCs.block && fromCs.hraFirst && fromCs.interval >= 100, `CS ostium pacing: lateral isthmus late, high RA first ${JSON.stringify(fromCs)}`);
const fromLat = pace(line, 'cti', 13600);
assert.ok(fromLat.block && fromLat.hraFirst && fromLat.interval >= 100, `lateral pacing: CS ostium late ${JSON.stringify(fromLat)}`);
const latEv = line.events(13500, 14500);
const latHis = latEv['his-d'].find((e) => e.origin === 'cti').t, latOs = latEv['cs-910'].find((e) => e.origin === 'cti').t;
assert.ok(latHis < latOs, 'down the septum: His before the CS ostium');
assert.equal(blockCheck(cwEv, 9000), null, 'no block check during flutter');
// Drawing: a blocked front stops at the line, an open isthmus lets the fronts meet.
assert.ok(pacedSpread('cs-prox', 40, { block: true }).some((f) => f.blocked && f.angle === LESION_ANGLE), 'stopped at the line');
assert.equal(pacedSpread('cs-prox', 40).some((f) => f.blocked), false);
assert.deepEqual(pacedSpread('cs-prox', 200), [], 'open: the fronts met');
assert.ok(pacedSpread('cs-prox', 200, { block: true }).length === 2, 'blocked: still going the long way');
assert.ok(LESION_ANGLE > CIRCUIT_SITES.csOs && LESION_ANGLE < CIRCUIT_SITES.cti, 'line between the CS ostium and ABL d');

// ---- Texts ----
for (const lang of ['tr', 'en']) {
  const c = LIVE_TEXT[lang].circuit;
  for (const s of CIRCUIT_SEGMENTS) assert.equal(typeof c.segments[s.id], 'string', `${lang} ${s.id}`);
  for (const k of ['circuit', 'sinus', 'hra', 'cti', 'cs', 'septal', 'left', 'af', 'other']) assert.equal(typeof c.origins[k], 'string', `${lang} origin ${k}`);
  assert.match(c.front('x'), /x/);
  assert.equal(typeof c.noReentry(null), 'string');
  assert.equal(typeof LIVE_TEXT[lang].circuitBtn, 'string');
  assert.equal(typeof LIVE_TEXT[lang].sites.cti, 'string');
  for (const fusion of ['concealed', 'manifest', 'none']) assert.match(c.entrainResult({ siteName: 'X', ppi: 245, ppiTcl: 5, verdict: 'inCircuit', fusion }), /PPI−TCL 5 ms/);
  assert.match(c.entraining('X', 220), /220/);
  for (const id of CIRCUIT_SEGMENTS.map((x) => x.id)) assert.equal(typeof c.segmentsCw[id], 'string');
  assert.match(c.blockCheck({ siteName: 'X', site: 'cs-prox', interval: 127, hraFirst: true, block: true }), /127 ms/);
  assert.equal(typeof c.labels.lesion, 'string');
}
for (const f of ['ep-flutter-circuit.js', 'ep-flutter-view.js', 'ep-live-text.js', 'ep-live-substrates.js']) {
  assert.ok(!readFileSync(new URL(`../../src/eps/${f}`, import.meta.url), 'utf8').includes(String.fromCharCode(0x2014)), `no em dash in ${f}`);
}

console.log('PASS ep-flutter-circuit: counterclockwise LAO ring timed from the His A (His and HRA catheters in step), slowest isthmus, lead II limbs (septum and roof descending, nadir at the free wall, lateral positive, isthmus plateau), sinus and paced origins, entrainment from HRA, CS proximal, CTI (concealed fusion, no double activation), mid and distal CS (outside, via the CS ostium) with ring PPI equal to the maneuver and a seamless return, CTI ablation stops the drawn circuit; clockwise flutter (positive F, mirrored ring, entrainment by site); isthmus line and bidirectional block check (long way round from the CS ostium and from the lateral isthmus)');
