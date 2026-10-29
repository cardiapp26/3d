// Real chest CT case (public/ct-data/s0019, TotalSegmentator CC BY 4.0): files decode to the
// stated size, HU decoding is monotone and close to the knots, the radiological orientation
// holds (liver on the screen left, descending aorta on the screen right of the spine, heart
// anterior), structure volumes are plausible, and the teaching views land on their structures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { CT_CASE_ID, CT_LABELS, CT_CASE_VIEWS, CT_REAL_WINDOWS, huTable, windowTable, labelStats } from '../src/ct/ct-volume-data.js';

const dir = new URL(`../public/ct-data/${CT_CASE_ID}/`, import.meta.url);
const meta = JSON.parse(fs.readFileSync(new URL('meta.json', dir), 'utf8'));
const volume = zlib.gunzipSync(fs.readFileSync(new URL('volume.ctz', dir)));
const labels = zlib.gunzipSync(fs.readFileSync(new URL('labels.ctz', dir)));
const { x: X, y: Y, z: Z } = meta.dims;
assert.equal(volume.length, X * Y * Z, 'volume size');
assert.equal(labels.length, X * Y * Z, 'label size');
assert.equal(meta.source.license, 'CC BY 4.0');
for (const l of meta.labels) assert.ok(CT_LABELS[l.key], `label ${l.key} has a name and colour`);
for (const k of Object.keys(CT_LABELS)) for (const lang of ['tr', 'en']) assert.ok(CT_LABELS[k].name[lang], `${k}.${lang}`);

// HU decoding.
const hu = huTable(meta.huKnots);
for (const [h, b] of meta.huKnots) assert.ok(Math.abs(hu[b] - h) < 1e-3, `knot ${h} HU`);
for (let b = 1; b < 256; b++) assert.ok(hu[b] > hu[b - 1], 'HU table increases');
assert.ok(hu[100] - hu[99] < 4, 'soft-tissue steps under 4 HU');
const g = windowTable(hu, 800, 250);
assert.equal(g[0], 0);
assert.equal(g[255], 255);

// Orientation and anatomy from the labels.
const stats = labelStats(labels, meta.dims, meta.spacingMm, meta.labels.length);
const S = Object.fromEntries(meta.labels.map((l, i) => [l.key, stats[i]]));
assert.ok(S.liver.centroid.x < X / 2, 'liver on the screen left (patient right)');
assert.ok(S.lv.centroid.x > S.rv.centroid.x, 'LV to the screen right of the RV');
assert.ok(S.rv.centroid.y < S.la.centroid.y, 'RV anterior to the LA');
assert.ok(S['lung-rml'].centroid.x < X / 2 && S['lung-lul'].centroid.x > X / 2, 'right lobes left on screen, left lobes right');
assert.ok(S.trachea.centroid.z < S.lv.centroid.z, 'trachea cranial to the LV');
for (const [k, lo, hi] of [['lv', 60, 250], ['rv', 60, 280], ['la', 40, 200], ['ra', 30, 200], ['aorta', 80, 400], ['myocardium', 80, 250]]) {
  assert.ok(S[k].volumeMl > lo && S[k].volumeMl < hi, `${k} volume ${S[k].volumeMl.toFixed(0)} mL`);
}
// Contrast: blood pool bright, lungs dark.
const median = (key) => {
  const id = meta.labels.findIndex((l) => l.key === key) + 1;
  const v = [];
  for (let i = 0; i < labels.length; i += 7) if (labels[i] === id) v.push(hu[volume[i]]);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const huLv = median('lv'), huAo = median('aorta'), huLung = median('lung-rul');
assert.ok(huLv > 300 && huAo > 300, `contrast blood pool (LV ${huLv.toFixed(0)}, aorta ${huAo.toFixed(0)} HU)`);
assert.ok(huLung < -650, `aerated lung (${huLung.toFixed(0)} HU)`);

// Teaching views.
const labelAt = (c) => meta.labels[labels[(c.z * Y + c.y) * X + c.x] - 1]?.key;
const expect = { root: 'aorta', pa: 'pulmonary-artery' };
for (const v of CT_CASE_VIEWS) {
  assert.ok(v.cursor.x < X && v.cursor.y < Y && v.cursor.z < Z, `${v.id} inside the volume`);
  assert.ok(CT_REAL_WINDOWS.some((w) => w.id === v.windowId), `${v.id} window`);
  if (expect[v.id]) assert.equal(labelAt(v.cursor), expect[v.id], `${v.id} cursor on ${expect[v.id]}`);
}
for (const f of ['src/ct/ct-volume-data.js', 'src/ct/ct-volume-viewer.js', 'src/ct/ct-volume-viewer.css', 'scripts/ct/prepare-totalseg-case.py']) {
  assert.ok(!fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').includes('\u2014'), `${f} has no em dash`);
}
console.log(`PASS real chest CT: ${X}x${Y}x${Z} voxels, ${meta.labels.length} structures, LV ${S.lv.volumeMl.toFixed(0)} mL, LV ${huLv.toFixed(0)} HU, lung ${huLung.toFixed(0)} HU, radiological orientation, ${CT_CASE_VIEWS.length} teaching views`);
