// Echo scoring and probe counterexamples (research/TTE_TEE_IYILESTIRME_RAPORU.md,
// P1 and section 5): a clipped apex never passes, the bicaval view needs the
// IVC orifice and the atrial septum, the mitral views are told apart by how the
// plane crosses the annulus, lateral flexion is not the multiplane angle, the
// tip stays in the lumen and the TTE probe stays on the chest surface.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateView, mitralChord, foreshortening } from '../src/echo-training.js';
import { imageFrame } from '../src/echo-section.js';
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

// 2. Bicaval: IVC orifice in the cut and the atrial septum (LA next to RA) both required.
const bicavalView = { required: ['la', 'ra'], avoid: [], bicaval: true };
const atria = gap => ({ contours: [
  { id: 'la', points: [[-0.5, 1], [-0.1, 1.5]], closed: false, length: 0.64 },
  { id: 'ra', points: [[-0.1 + gap, 1.5], [0.4 + gap, 1]], closed: false, length: 0.7 }
] });
assert.equal(evaluateView(atria(0.05), bicavalView, ctx(3, Math.PI / 2, { ivc: [0.3, 2, 0] })).achieved, true, 'IVC and septum: passes');
const noIvc = evaluateView(atria(0.05), bicavalView, ctx(3, Math.PI / 2, { ivc: [0.3, 2, 0.6] }));
assert.equal(noIvc.achieved, false, 'IVC orifice off the cut: not a full bicaval view');
assert.ok(noIvc.messages.some(m => /İVK ağzı/.test(m)));
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

for (const file of ['../src/echo-training.js', '../src/echo-probe.js', '../src/echo-views.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log('PASS echo-training: clipped apex fails (depth/sector/plane messages), bicaval IVC and septum, mitral cut angle, flexion vs multiplane, lumen limit, chest contact');
