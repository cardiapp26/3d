// Echo scoring and probe counterexamples (research/TTE_TEE_IYILESTIRME_RAPORU.md,
// P1 and section 5): a clipped apex never passes, the bicaval view needs the
// IVC orifice and the atrial septum, the mitral views are told apart by how the
// plane crosses the annulus, lateral flexion is not the multiplane angle, the
// tip stays in the lumen and the TTE probe stays on the chest surface.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criteriaAtPhase, evaluateView, mitralChord, foreshortening, visibleLengths, contourGap, visibleRuns } from '../src/echo-training.js';
import { imageFrame } from '../src/echo-section.js';
import { mitralMapData, mapCutLine } from '../src/echo-mitral-map.js';
import { fossaFrame, septalCut, septalCutCheck, sectorAt } from '../src/echo-septal-map.js';
import { createProbePath, teeFrame, tteFrame, surfaceHit, ontoSurface, LUMEN, BEND_LENGTH } from '../src/echo-probe.js';

const label = id => id;
const frame = imageFrame([0, 0, 0], [0, 1, 0], [1, 0, 0]);   // beam +y, screen right +x, normal -z
const apical = { required: ['lv'], avoid: [], apical: true };
const lvLine = { contours: [{ id: 'lv', points: [[0, 0.2], [0, 1]], closed: false, length: 0.8 }] };
const anatomy = { mv: { center: [0, 0, 0], normal: [0, 1, 0], radius: 0.4 }, apex: [0, 1, 0], lvLength: 1, av: { center: [0.5, 0, 0.4] }, ivc: [0, 1, 0] };
const ctx = (depth, sectorAngle = Math.PI / 2, extra = {}) => ({ sectorAngle, depth, frame, anatomy: { ...anatomy, ...extra }, label, lang: 'tr' });

// 1. The report's counterexample: apex beyond the image depth must fail, with the depth message.
const clipped = evaluateView(lvLine, apical, ctx(0.6));
assert.equal(clipped.achieved, false, 'apex beyond the depth: not achieved');
assert.ok(clipped.foreshortening.inPlane && clipped.foreshortening.beyondDepth);
assert.ok(clipped.messages.some(m => /derinliği artırın/.test(m)), 'depth message, not "misses the apex"');
assert.ok(clipped.foreshortening.ratio < 0.7, 'only the visible LV counts toward its length');
const deep = evaluateView(lvLine, apical, ctx(1.2));
assert.equal(deep.achieved, true, 'enough depth: the same cut passes');
// Apex outside the sector angle (in the plane, within depth): fails with the sector message.
const sideApex = { contours: [{ id: 'lv', points: [[0, 0.2], [0.9, 0.3]], closed: false, length: 0.9 }] };
const sideCtx = { ...ctx(2, Math.PI / 3), anatomy: { ...anatomy, apex: [0.9, 0.3, 0] } };
const outside = evaluateView(sideApex, apical, sideCtx);
assert.equal(outside.achieved, false);
assert.ok(outside.foreshortening.outsideAngle && outside.messages.some(m => /sektörün dışında/.test(m)));
// Apex off the plane: "the plane misses the apex".
const off = evaluateView(lvLine, apical, { ...ctx(1.2), anatomy: { ...anatomy, apex: [0, 1, 0.4] } });
assert.equal(off.achieved, false);
assert.ok(!off.foreshortening.inPlane && off.messages.some(m => /apeksten geçmiyor/.test(m)));
assert.deepEqual(Object.keys(foreshortening(lvLine, frame, anatomy)).sort(), ['apexOffPlane', 'beyondDepth', 'inImage', 'inPlane', 'ok', 'outsideAngle', 'ratio']);

// 1b. ICE criteria (research/ICE_INCELEME_RAPORU.md): vein identities and their group, minimum
// target length, relations (ostium on the LA), near/far order, image side and point landmarks.
const line = (id, a, b) => ({ id, points: [a, b], closed: false });
const veins = { contours: [line('la', [-0.3, 1], [0.3, 1]), line('lspv', [0.3, 1], [0.6, 1.3]), line('lipv', [0.32, 1.05], [0.62, 1.0])] };
const wide = ctx(3, Math.PI);
assert.ok(visibleLengths(veins, Math.PI, 3).pv > 0.6, 'the pulmonary vein group sums its members');
const leftPv = { required: ['la', 'lspv', 'lipv'], relations: [{ a: 'la', b: 'lspv' }, { a: 'la', b: 'lipv' }], avoid: ['rspv', 'ripv'] };
assert.equal(evaluateView(veins, leftPv, wide).achieved, true, 'both left veins with their ostia on the LA');
const rightPv = { required: ['la', 'rspv', 'ripv'], avoid: ['lspv', 'lipv'] };
const rWrong = evaluateView(veins, rightPv, wide);
assert.ok(!rWrong.achieved && rWrong.missing.includes('rspv') && rWrong.wrong.includes('lspv'), 'left veins never meet the right-vein view');
assert.ok(evaluateView(veins, { required: ['pv'], avoid: [] }, wide).achieved, "a 'pv' requirement (TEE) is met by any vein");
const detached = { contours: [line('la', [-0.3, 1], [0.3, 1]), line('lspv', [0.8, 1.4], [1.1, 1.7]), line('lipv', [0.32, 1.05], [0.62, 1.0])] };
const noOstium = evaluateView(detached, leftPv, wide);
assert.ok(!noOstium.achieved && noOstium.relations.find(r => r.b === 'lspv').ok === false, 'a vein off the LA: ostium not in the cut');
assert.ok(noOstium.messages.some(m => /birleşmiyor/.test(m)));
assert.ok(Math.abs(contourGap(visibleRuns(veins, Math.PI, 3), 'la', 'lspv')) < 1e-9);
// Minimum length: a sliver of LAA does not count as the target.
const sliver = { contours: [line('laa', [0.4, 1], [0.6, 1])] };
assert.equal(evaluateView(sliver, { required: ['laa'], minLength: { laa: 0.4 }, avoid: [] }, wide).achieved, false, 'LAA sliver is not a recognisable LAA');
assert.equal(evaluateView(sliver, { required: ['laa'], avoid: [] }, wide).achieved, false, 'shorter than the default visibility length too');
// Side: the LAA on the image right (+x), not the left.
const laaRight = { contours: [line('laa', [0.3, 1], [0.9, 1.2])] };
assert.equal(evaluateView(laaRight, { required: ['laa'], side: { laa: 'right' }, avoid: [] }, wide).achieved, true);
const laaLeft = evaluateView(laaRight, { required: ['laa'], side: { laa: 'left' }, avoid: [] }, wide);
assert.ok(!laaLeft.achieved && laaLeft.messages.some(m => /solunda olmalı/.test(m)));
// Order: RA near field, LA far field (septal view facing the septum from the right).
const raLa = { contours: [line('ra', [-0.3, 0.4], [0.3, 0.4]), line('la', [-0.3, 1.2], [0.3, 1.2])] };
assert.equal(evaluateView(raLa, { required: ['ra', 'la'], order: [['ra', 'la']], avoid: [] }, wide).achieved, true);
const flipped = evaluateView(raLa, { required: ['ra', 'la'], order: [['la', 'ra']], avoid: [] }, wide);
assert.ok(!flipped.achieved && flipped.messages.some(m => /yakın alanda/.test(m)), 'a reversed near/far order fails');
// Landmarks: in the plane and in the image; unknown when the atlas lacks them (never a pass).
const withFossa = (center) => ({ ...wide, anatomy: { ...anatomy, fossa: { center } } });
const fossaView = { required: [], landmarks: ['fossa'], avoid: [] };
assert.equal(evaluateView(raLa, fossaView, withFossa([0, 0.8, 0])).achieved, true, 'fossa in the cut');
assert.equal(evaluateView(raLa, fossaView, withFossa([0, 0.8, 0.5])).achieved, false, 'fossa off the plane');
const unknown = evaluateView(raLa, fossaView, wide);
assert.ok(!unknown.achieved && unknown.landmarks[0].unknown && unknown.messages.some(m => /değerlendirilemedi, başarı sayılmaz/.test(m)), 'unmeasured landmark is not assumed');
// Optional structures are reported, never required.
const opt = evaluateView(raLa, { required: ['ra'], optional: ['la'], avoid: [] }, wide);
assert.ok(opt.achieved && opt.messages.some(m => /zorunlu değil/.test(m)));

// 2. Bicaval: IVC orifice in the cut and the atrial septum (LA next to RA) both required.
const bicavalView = { required: ['la', 'ra'], avoid: [], bicaval: true };
const atria = gap => ({ contours: [
  { id: 'la', points: [[-0.5, 1], [-0.1, 1.5]], closed: false, length: 0.64 },
  { id: 'ra', points: [[-0.1 + gap, 1.5], [0.4 + gap, 1]], closed: false, length: 0.7 }
] });
assert.equal(evaluateView(atria(0.05), bicavalView, ctx(3, Math.PI / 2, { ivc: [0.3, 2, 0] })).achieved, true, 'IVC and septum: passes');
const noIvc = evaluateView(atria(0.05), bicavalView, ctx(3, Math.PI / 2, { ivc: [0.3, 2, 0.6] }));
assert.equal(noIvc.achieved, false, 'IVC orifice off the cut: not a full bicaval view');
assert.ok(noIvc.messages.some(m => /IVC ağzı/.test(m)));
const noSeptum = evaluateView(atria(1.2), bicavalView, ctx(3, Math.PI / 2, { ivc: [0.3, 2, 0] }));
assert.equal(noSeptum.achieved, false, 'LA and RA apart: no septum in the cut');
assert.ok(noSeptum.messages.some(m => /septum/.test(m)));

// 3. Mitral cut: the commissural axis is perpendicular to the aortic direction.
// Annulus normal +y, aortic valve toward +x (+z offset), so the commissural axis is along z.
const mv = { ...anatomy, mv: { center: [0, 0, 0], normal: [0, 1, 0], radius: 0.4 }, av: { center: [0.6, 0.2, 0] } };
const planeWithNormal = normal => ({ origin: [0, -2, 0], normal, beam: [0, 1, 0], lateral: [0, 0, 1] });
assert.ok(mitralChord(planeWithNormal([1, 0, 0]), mv).angle < 5, 'plane along the commissural axis: ~0 degrees');
assert.ok(mitralChord(planeWithNormal([0, 0, 1]), mv).angle > 85, 'plane along the aortic direction: ~90 degrees');
const commissuralView = { required: [], avoid: [], mitralChord: [0, 22] };
const wrongCut = evaluateView({ contours: [] }, commissuralView, { sectorAngle: 1, depth: 3, frame: planeWithNormal([0, 0, 1]), anatomy: mv, label, lang: 'en' });
assert.equal(wrongCut.achieved, false, 'a long-axis cut is not the commissural view');
assert.ok(wrongCut.messages.some(m => /commissural axis/.test(m)));
assert.equal(evaluateView({ contours: [] }, commissuralView, { sectorAngle: 1, depth: 3, frame: planeWithNormal([1, 0, 0]), anatomy: mv, label, lang: 'en' }).achieved, true);
const offCentre = mitralChord({ ...planeWithNormal([1, 0, 0]), origin: [0.35, -2, 0] }, mv);
assert.equal(offCentre.centred, false, 'a plane through the annulus edge is not centred');

// 4. TEE: lateral flexion and the multiplane angle are different motions.
const path = createProbePath([[0, 3, 0], [0, 0, 0], [0, -3, 0]], { smoothing: 0, wideFrom: 0.9 });
const rest = teeFrame(path, { advance: 0.5 });
const lateral = teeFrame(path, { advance: 0.5, lateralFlexion: 20 });
const multiplane = teeFrame(path, { advance: 0.5, omega: 20 });
const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
assert.ok(dist(lateral.origin, multiplane.origin) > 0.05, 'lateral flexion moves the tip, multiplane does not');
assert.ok(dist(multiplane.tip, rest.tip) < 1e-9 && dist(multiplane.beam, rest.beam) < 1e-9, 'multiplane keeps the tip and the central beam');
assert.ok(dist(teeFrame(path, { advance: 0.5, flexion: 30 }).tip, rest.tip) > 0.05, 'flexion moves the tip');
// Lumen: in the oesophagus the tip swings at most the lumen radius; the stomach allows more.
const sideways = f => { const along = f.tip.map((v, i) => v - rest.tip[i]); return Math.hypot(along[0], along[2]); };
const hard = teeFrame(path, { advance: 0.5, flexion: 100 });
assert.ok(hard.limited && sideways(hard) <= LUMEN.oesophagus + 1e-6, 'oesophageal lumen limits the bend');
const gastric = teeFrame(path, { advance: 0.95, flexion: 100 });
assert.ok(!gastric.limited && gastric.bend > hard.bend, 'the stomach allows a larger bend');
assert.ok(BEND_LENGTH > 0);

// 5. TTE contact: the transducer stays on the chest surface while sliding.
const surface = { center: [0, 0, 0], radii: [3, 2, 2.5] };
const on = surfaceHit([0, 0, 0], [0, 0, 1], surface);
assert.ok(Math.abs(on[2] - 2.5) < 1e-9, 'ray leaves the ellipsoid at its surface');
const base = { origin: on, beam: [0, 0, -1], lateral: [1, 0, 0], surface };
for (const adj of [{ slideLateral: 0.4 }, { slideElevation: -0.4 }, { slideLateral: 0.3, slideElevation: 0.3, rotation: 40 }]) {
  const f = tteFrame(base, adj);
  const k = Math.hypot(...f.origin.map((v, i) => v / surface.radii[i]));
  assert.ok(Math.abs(k - 1) < 1e-9, 'origin on the chest surface after sliding');
}
assert.ok(Math.abs(Math.hypot(...ontoSurface([5, 0, 0], surface).map((v, i) => v / surface.radii[i])) - 1) < 1e-9);

for (const file of ['../src/echo-mitral-map.js', '../src/echo-septal-map.js', '../src/echo-training.js', '../src/echo-probe.js', '../src/echo-views.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
// Mitral scallops are scored only with the valve closed; other criteria stay.
const scallopView = { id: 'x', required: ['mitral'], avoid: [], parts: { mitral: ['A1', 'P1'], lv: ['3'] }, mitralPartsClosed: true };
assert.deepEqual(criteriaAtPhase(scallopView, 0.2).parts, { lv: ['3'] }, 'diastole: mitral scallops dropped');
assert.equal(criteriaAtPhase(scallopView, 0.6), scallopView, 'systole: full criteria');
assert.equal(criteriaAtPhase(scallopView, null), scallopView, 'rest: full criteria');
assert.equal(criteriaAtPhase({ ...scallopView, mitralPartsClosed: false }, 0.2).parts.mitral.length, 2);
// Mitral map: aortic valve up, A1 on the left; a cut through the A1-P1 side crosses the left of the map.
const ring = (part, x, y) => ({ part, p: [x, 0, y] });
const pts = [ring('A1', 0.6, 0.3), ring('A2', 0, 0.4), ring('A3', -0.6, 0.3), ring('P1', 0.7, -0.3), ring('P2', 0, -0.5), ring('P3', -0.7, -0.3)];
const map = mitralMapData({ points: pts, center: [0, 0, 0], normal: [0, -1, 0], aortic: [0, 0, 1.2] });
assert.ok(map.scallops.A1.c[0] < 0 && map.scallops.A3.c[0] > 0, 'A1 on the left, A3 on the right');
assert.ok(map.scallops.A2.c[1] > 0 && map.scallops.P2.c[1] < 0 && map.aortic[1] > 0, 'anterior leaflet and aortic valve up');
const cut = mapCutLine(map, { origin: [0.6, 0, 0], normal: [1, 0, 0] });
assert.ok(cut && Math.abs(cut[0][0] - cut[1][0]) < 1e-9 && cut[0][0] < 0, 'a cut through A1/P1 is a vertical line on the left');
assert.equal(mapCutLine(map, { origin: [0, 0.5, 0], normal: [0, 1, 0] }), null, 'a cut parallel to the annulus has no line');
// Septal map: sectors clockwise from superior toward anterior; a vertical cut through the fossa is
// bicaval-like (superior-inferior), a horizontal one anterior-posterior; a cut beside the fossa misses it.
assert.deepEqual([[0, 1], [0.8, 0.5], [0.8, -0.5], [0, -1], [-0.8, -0.5], [-0.8, 0.5]].map(sectorAt), ['S', 'AS', 'AI', 'I', 'PI', 'PS']);
const F = fossaFrame({ center: [0, 0, 0], normal: [1, 0, 0], radius: 0.2, across: 1 });
const vertical = septalCut(F, { origin: [0, 0, 0], normal: [0, 0, 1] });
assert.ok(vertical.through && vertical.angle < 1 && vertical.sectors.includes('S') && vertical.sectors.includes('I'), 'vertical cut: S and I');
assert.ok(septalCutCheck(F, { origin: [0, 0, 0], normal: [0, 0, 1] }, { axis: 'si', max: 35 }).ok, 'bicaval-like cut meets the si criterion');
assert.equal(septalCutCheck(F, { origin: [0, 0, 0], normal: [0, 1, 0] }, { axis: 'si', max: 35 }).ok, false, 'a horizontal cut is not bicaval');
assert.ok(septalCutCheck(F, { origin: [0, 0, 0], normal: [0, 1, 0] }, { axis: 'ap', max: 50 }).ok, 'a horizontal cut is anterior-posterior');
assert.equal(septalCut(F, { origin: [0, 0, 0.5], normal: [0, 0, 1] }).through, false, 'a cut beside the fossa misses it');
console.log('PASS echo-training: clipped apex fails (depth/sector/plane messages), ICE vein identities/group, ostium relations, LAA length and side, near/far order, fossa landmark (unknown is not a pass), optional, bicaval IVC and septum, mitral cut angle, flexion vs multiplane, lumen limit, chest contact');
