// Real cine CMR cases (public/cmr-data, ACDC CC BY-NC-SA 4.0): files match their metadata, the
// WebP sheet has one tile per slice and frame, the sheet unpacks in the right order, and the
// measurements from the expert ED/ES labels meet the ACDC definition of each case's group.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { CMR_CASES, CMR_LABEL, CMR_THRESHOLDS, bsaMosteller, cmrMetrics, acdcCriteria, unpackSheet, rayThickness } from '../src/cardiac-mr/cmr-real-data.js';

/** Width and height of a WebP file (VP8, VP8L or VP8X). */
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (kind === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  const b = buf.readUInt32LE(21);
  return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
}

assert.ok(Math.abs(bsaMosteller(180, 80) - 2.0) < 1e-9, 'Mosteller BSA');

// Sheet unpacking: tile (slice z, frame t) value z*10 + t lands at [t][z].
const dims = { rows: 2, cols: 3, slices: 2, frames: 4 };
const W = dims.frames * dims.cols, H = dims.slices * dims.rows;
const rgba = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) rgba[(y * W + x) * 4] = Math.floor(y / dims.rows) * 10 + Math.floor(x / dims.cols);
const cine = unpackSheet(rgba, dims);
for (let t = 0; t < 4; t++) for (let z = 0; z < 2; z++) assert.equal(cine[((t * 2 + z) * 2 + 1) * 3 + 2], z * 10 + t, `tile z${z} t${t}`);

// Ray thickness on a synthetic ring: cavity radius 10 px, myocardium to 16 px, 1 mm pixels.
const N = 48, ring = new Uint8Array(N * N);
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
  const d = Math.hypot(r - 24, c - 24);
  ring[r * N + c] = d < 10 ? CMR_LABEL.lv : d < 16 ? CMR_LABEL.myo : 0;
}
const ray = rayThickness(ring, 0, N, N, 1);
const meanRay = ray.mm.reduce((a, b) => a + b, 0) / ray.mm.length;
assert.ok(Math.abs(meanRay - 6) < 0.8, `ring thickness ${meanRay.toFixed(2)} mm`);

const expected = { NOR: [], DCM: ['DCM'], HCM: ['HCM'], MINF: ['DCM'], RV: ['RV'] };
const summary = [];
let bytes = 0;
for (const c of CMR_CASES) {
  const dir = new URL(`../public/cmr-data/${c.id}/`, import.meta.url);
  const meta = JSON.parse(fs.readFileSync(new URL('meta.json', dir), 'utf8'));
  const sheet = fs.readFileSync(new URL(meta.sheet.file, dir));
  const labelsGz = fs.readFileSync(new URL('labels.mrz', dir));
  bytes += sheet.length + labelsGz.length;
  const labels = zlib.gunzipSync(labelsGz);
  const { rows, cols, slices, frames } = meta.dims;
  assert.equal(meta.id, c.id);
  assert.equal(meta.group, c.group, `${c.id} group`);
  assert.equal(meta.source.license, 'CC BY-NC-SA 4.0');
  assert.match(meta.source.citation, /Bernard/);
  assert.equal(labels.length, 2 * rows * cols * slices, `${c.id} label size`);
  assert.deepEqual(webpSize(sheet), { w: frames * cols, h: slices * rows }, `${c.id} sheet size`);
  assert.ok(meta.edFrame >= 0 && meta.esFrame > meta.edFrame && meta.esFrame < frames, `${c.id} ED/ES frames`);
  assert.ok(new Set(labels).size === 4, `${c.id} has RV, myocardium and LV labels`);

  const m = cmrMetrics(labels, meta);
  const met = acdcCriteria(m).filter(x => x.met === true).map(x => x.group);
  assert.deepEqual(met, expected[c.group], `${c.id} (${c.group}) meets ${expected[c.group].join(',') || 'no'} definitions, got ${met.join(',')}`);
  assert.ok(m.lv.ef > 0 && m.lv.ef < 90 && m.rv.ef > 0 && m.rv.ef < 90, `${c.id} EF range`);
  assert.ok(m.lv.edv > m.lv.esv && m.rv.edv > m.rv.esv, `${c.id} ED larger than ES`);
  assert.ok(m.wall.segmentsMeasured >= 30, `${c.id} regional sectors measured`);
  // The RV lies on the screen left of the LV in every case (septum direction points left).
  assert.ok(Math.abs(m.septum) > Math.PI / 2, `${c.id} RV on the screen left`);
  if (c.group === 'NOR') assert.ok(m.lv.ef >= 55 && m.lv.edvi < 100 && m.wall.maxMm < 13, 'normal LV');
  if (c.group === 'HCM') assert.ok(m.wall.maxMm > 20 && m.wall.segmentsOver15 >= 5, 'HCM wall thickness');
  if (c.group === 'MINF') assert.equal(acdcCriteria(m).find(x => x.group === 'MINF').met, 'partial', 'MINF regional criterion is visual');
  for (const lang of ['tr', 'en']) assert.ok(c.points[lang].length >= 3 && c.name[lang] && c.short[lang], `${c.id} text ${lang}`);
  summary.push(`${c.group} EF ${m.lv.ef.toFixed(0)}`);
}
assert.ok(bytes < 8e6, `five cases under 8 MB (${(bytes / 1e6).toFixed(1)} MB)`);
assert.equal(CMR_THRESHOLDS.hcmWallMm, 15);

for (const f of ['src/cardiac-mr/cmr-real-data.js', 'src/cardiac-mr/cmr-real-viewer.js', 'src/cardiac-mr/cmr-real-viewer.css', 'scripts/cmr/prepare-acdc-case.py']) {
  assert.ok(!fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').includes('\\u2014'), `${f} has no em dash`);
}
console.log(`PASS real cine CMR: ${CMR_CASES.length} ACDC cases (${summary.join(', ')}), ${(bytes / 1e6).toFixed(1)} MB, sheet order, ring thickness, ACDC definitions`);
