// RF ablation model of the 3D map (src/eps/eam3d-rf-model.js): index calibration,
// line gaps, oedema versus durable block after the wait, safety stops.
import assert from 'node:assert/strict';
import { EAM3D_ABLATION_LINES } from '../../src/eps/eam3d-model.js';
import {
  doseRate, indexFromDose, secondsToIndex, lesionGeometry, driftMm, pointOnLine,
  deliverAtOnce, evaluateLine, blockedLines, ageLesions, idealLesions, lesionGrade, defaultLineFor,
  RF_LINE_TISSUE, RF_ESOPHAGUS_LIMIT_C
} from '../../src/eps/eam3d-rf-model.js';

const steadyIndex = (forceG, powerW, seconds) => indexFromDose(doseRate(forceG, powerW) * seconds);

// 1. Index calibration: ~450 at 35 W, 10 g, 30 s; HPSD 50 W 10 g 10 s ~ 375; more force, more index.
const i35 = steadyIndex(10, 35, 30);
assert.ok(i35 > 430 && i35 < 470, `35 W 10 g 30 s index ${i35.toFixed(0)}`);
const iHpsd = steadyIndex(10, 50, 10);
assert.ok(iHpsd > 350 && iHpsd < 400, `50 W 10 g 10 s index ${iHpsd.toFixed(0)}`);
assert.ok(steadyIndex(20, 35, 30) > i35 && steadyIndex(3, 35, 30) < i35, 'index rises with contact force');
assert.ok(Math.abs(steadyIndex(10, 35, secondsToIndex(450, 10, 35)) - 450) < 0.5, 'secondsToIndex inverts the index');
const deep = lesionGeometry(450, 35), wide = lesionGeometry(450, 50);
assert.ok(deep.depthMm > 4.5 && deep.depthMm < 5, `depth at index 450: ${deep.depthMm} mm`);
assert.ok(wide.diameterMm > deep.diameterMm, 'HPSD lesions are wider for the same depth');

// 2. Drift: deterministic, small with good contact, wide with poor contact.
assert.equal(driftMm(12, 7), driftMm(12, 7));
const spread = (g) => Math.max(...Array.from({ length: 60 }, (_, k) => Math.abs(driftMm(g, k + 1))));
assert.ok(spread(15) < 2.1 && spread(2) > 3, `drift good ${spread(15)} vs poor ${spread(2)}`);

// 3. Geometry: points lie on the line's polyline ends.
const cti = EAM3D_ABLATION_LINES['cti-line'];
assert.deepEqual(pointOnLine('cti-line', 0, 0).map((v) => v.toFixed(3)), cti.points[0].map((v) => v.toFixed(3)));
assert.deepEqual(pointOnLine('cti-line', cti.lengthMm, 0).map((v) => v.toFixed(3)), cti.points[cti.points.length - 1].map((v) => v.toFixed(3)));

// 4. Ideal lesions block every line, and each line's own arrhythmia.
for (const id of Object.keys(EAM3D_ABLATION_LINES)) {
  const r = evaluateLine(id, idealLesions(id));
  assert.equal(r.complete, true, `${id}: ideal lesions complete the line (${JSON.stringify(r.gaps)})`);
  assert.ok(RF_LINE_TISSUE[id], `${id}: tissue defined`);
}
assert.equal(defaultLineFor('flutter-typical'), 'cti-line');
assert.equal(defaultLineFor('avnrt'), 'slow-pathway');

// 5. Gap rule: CTI lesions every 5 mm block; drop one in the middle -> one gap > 6 mm.
const at = (s, k, overrides = {}) => deliverAtOnce({ lineId: 'cti-line', sMm: s, powerW: 35, forceG: 15, seed: k, ...overrides }, k).lesion;
const steps = [2, 7, 12, 17, 22, 26];
const full = steps.map((s, k) => at(s, k + 1));
assert.ok(full.every((l) => Math.abs(l.offsetMm) <= 3), 'good contact keeps lesions on the line');
assert.equal(evaluateLine('cti-line', full).complete, true, 'CTI blocks with lesions every 5 mm');
assert.ok(blockedLines(full).has('cti-line'));
const holed = full.filter((l) => l.sMm !== 12);
const r = evaluateLine('cti-line', holed);
assert.equal(r.complete, false);
assert.deepEqual(r.gaps, [{ fromMm: 10, toMm: 14 }], 'the missing lesion leaves 10-14 mm uncovered');
assert.deepEqual(evaluateLine('cti-line', [full[0]]).gaps, [{ fromMm: 5, toMm: 28 }], 'one lesion at 2 mm: the rest of the line is open');

// 6. Oedema: lesions at 75-100% of the wall block now, reconnect after the 20-minute wait.
const shallowIndex = 0.85 * RF_LINE_TISSUE['cti-line'].wallMm * 95;
const shallow = steps.map((s, k) => at(s, k + 1, { autoStop: false, powerW: 30, forceG: 12 }))
  .map((l) => ({ ...l, index: Math.round(shallowIndex), ...lesionGeometry(shallowIndex, 30) }));
assert.ok(shallow.every((l) => lesionGrade(l) === 'acute'), 'lesions reach 75% of the wall: acute grade');
assert.equal(evaluateLine('cti-line', shallow).complete, true, 'acute (oedema) block');
const aged = ageLesions(shallow);
assert.equal(evaluateLine('cti-line', aged).complete, false, 'conduction returns after the wait');
assert.ok(aged.every((l) => lesionGrade(l) === 'weak'));
assert.equal(evaluateLine('cti-line', ageLesions(full)).complete, true, 'full-thickness lesions keep the block');

// 7. Safety stops.
const eso = deliverAtOnce({ lineId: 'posterior-box', sMm: 5, powerW: 35, forceG: 15, seed: 3, autoStop: false }, 1).delivery;
assert.equal(eso.stopReason, 'esophagus', 'posterior wall at 35 W without auto-stop heats the oesophagus');
assert.ok(eso.esophagusC >= RF_ESOPHAGUS_LIMIT_C && eso.t < 30, `stopped at ${eso.esophagusC.toFixed(1)} C after ${eso.t.toFixed(1)} s`);
const hpsd = deliverAtOnce({ lineId: 'posterior-box', sMm: 5, powerW: 50, forceG: 15, seed: 3 }, 1).delivery;
assert.equal(hpsd.stopReason, 'target', 'HPSD reaches the posterior target before the oesophagus limit');
const node = deliverAtOnce({ lineId: 'slow-pathway', sMm: 10, powerW: 35, forceG: 15, seed: 2 }, 1).delivery;
assert.equal(node.stopReason, 'avblock', 'top of the slow pathway: AV block risk stop');
const sp = deliverAtOnce({ lineId: 'slow-pathway', sMm: 5, powerW: 35, forceG: 15, seed: 2 }, 1).delivery;
assert.equal(sp.junctional, true, 'mid slow pathway: junctional rhythm');
assert.equal(sp.stopReason, 'target');
const pop = deliverAtOnce({ lineId: 'cti-line', sMm: 5, powerW: 40, forceG: 35, seed: 2, autoStop: false }, 1);
assert.equal(pop.delivery.stopReason, 'pop', 'high force and power: steam pop');
assert.equal(pop.lesion.pop, true);

console.log('PASS eam3d-rf: index calibration, gaps, oedema vs durable block, oesophagus / AV node / steam pop stops');
