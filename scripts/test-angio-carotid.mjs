import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ARCH_TYPES,
  ARCH_VARIANTS,
  REFERENCES,
  STRUCTURES,
  VIEW_DEFS,
  calculateNascet,
  formatNascetPercent,
  nascetCategory,
  tortuosityClass,
  viewStructures
} from '../src/angio/carotid/carotid-data.js';
import { renderCarotidSvg } from '../src/angio/carotid/carotid-svg.js';

const defaultState = {
  archType: 'I', archVariant: 'normal', projection: 'lateral', angle: 25,
  nearOcclusion: false, coil: false
};

assert.equal(VIEW_DEFS.length, 5, 'five teaching views');
assert.equal(new Set(STRUCTURES.map(item => item.id)).size, STRUCTURES.length, 'structure ids unique');
for (const view of VIEW_DEFS) {
  const items = viewStructures(view.id);
  assert.ok(items.length >= 3, `${view.id} has selectable structures`);
  const svg = renderCarotidSvg(view.id, defaultState, 'en');
  assert.equal((svg.match(/class="carotid-structure"/g) || []).length, items.length, `${view.id} renders every structure once`);
  assert.equal((svg.match(/role="button"/g) || []).length, items.length, `${view.id} structures have button role`);
  assert.equal((svg.match(/tabindex="0"/g) || []).length, items.length, `${view.id} structures are keyboard focusable`);
  for (const item of items) {
    const group = svg.match(new RegExp(`<g class="carotid-structure" data-structure="${item.id}"[\\s\\S]*?</g>`))?.[0] || '';
    assert.match(group, /class="vessel-hit"/, `${item.id} has transparent path hit target`);
    assert.match(group, /pointer|vessel-hit|stroke-width/, `${item.id} exposes wide stroke geometry`);
  }
}

for (const item of STRUCTURES) {
  for (const field of ['label', 'description', 'pearl']) {
    assert.ok(item[field]?.tr && item[field]?.en, `${item.id} ${field} bilingual`);
  }
}

const archIds = new Set(viewStructures('arch').map(item => item.id));
for (const id of ['ascending-aorta', 'aortic-arch', 'descending-aorta', 'bct', 'rcca', 'rsub', 'lcca', 'lsub']) {
  assert.ok(archIds.has(id), `${id} selectable in arch`);
}
for (const side of ['r', 'l']) {
  for (const branch of ['vertebral', 'internal-thoracic', 'thyrocervical', 'costocervical']) {
    assert.ok(archIds.has(`${side}-${branch}`), `${side}-${branch} selectable`);
  }
}
for (const type of ARCH_TYPES) {
  for (const variant of ARCH_VARIANTS) {
    const svg = renderCarotidSvg('arch', { ...defaultState, archType: type.id, archVariant: variant.id }, 'en');
    const pathData = [...svg.matchAll(/\sd="([^"]+)"/g)].map(match => match[1]);
    assert.ok(pathData.every(d => !/-\d/.test(d)), `${type.id}/${variant.id} paths remain inside non-negative viewBox coordinates`);
    const hitData = [...svg.matchAll(/<path class="vessel-hit" d="([^"]+)"/g)].map(match => match[1]);
    const hitNumbers = hitData.flatMap(d => [...d.matchAll(/[\d.]+/g)].map(match => Number(match[0])));
    assert.ok(hitNumbers.every(value => value >= 10 && value <= 410), `${type.id}/${variant.id} vessel paths retain viewBox margin`);
  }
}
const bctOriginY = ARCH_TYPES.map(type => {
  const svg = renderCarotidSvg('arch', { ...defaultState, archType: type.id }, 'en');
  const group = svg.match(/data-structure="bct"[\s\S]*?<path class="vessel-hit" d="M[\d.]+ ([\d.]+)/)?.[1];
  return Number(group);
});
assert.ok(bctOriginY.every(Number.isFinite), 'BCT origins are finite');
assert.ok(bctOriginY[0] < bctOriginY[1] && bctOriginY[1] < bctOriginY[2], 'BCT origin drops from type I to III');
for (const [index, type] of ARCH_TYPES.entries()) {
  const svg = renderCarotidSvg('arch', { ...defaultState, archType: type.id }, 'en');
  const wall = svg.match(/data-structure="aortic-arch"[\s\S]*?<path class="vessel vessel-wall" d="([^"]+)"/)[1];
  const values = [...wall.matchAll(/-?[\d.]+/g)].map(match => Number(match[0]));
  const apex = Math.min(...values.filter((_, i) => i % 2 === 1));
  const depth = (bctOriginY[index] - apex) / 10;
  assert.ok(Math.abs(depth - type.depth) < 0.01, `${type.id} branch depth matches LCCA diameter classification`);
}
assert.equal(new Set(ARCH_VARIANTS.map(variant => renderCarotidSvg('arch', { ...defaultState, archVariant: variant.id }, 'en'))).size, ARCH_VARIANTS.length, 'each arch variant redraws recognisably');
assert.match(ARCH_VARIANTS.find(variant => variant.id === 'lusoria').label.tr, /Aberran sağ subklavyen/, 'aberran spelling is consistent');
for (const variant of ['lusoria', 'right-arch']) {
  const svg = renderCarotidSvg('arch', { ...defaultState, archVariant: variant }, 'en');
  assert.doesNotMatch(svg, /data-structure="bct"/, `${variant} omits anatomically absent BCT`);
}
const rightArchI = renderCarotidSvg('arch', { ...defaultState, archType: 'I', archVariant: 'right-arch' }, 'en');
const rightArchIII = renderCarotidSvg('arch', { ...defaultState, archType: 'III', archVariant: 'right-arch' }, 'en');
assert.notEqual(rightArchI, rightArchIII, 'right arch responds to type control');

assert.equal(calculateNascet(1.2, 4), 70);
assert.equal(calculateNascet(4, 4), 0);
assert.equal(calculateNascet(5, 4), null);
const boundary = calculateNascet(1.2016, 4);
assert.ok(boundary < 70 && boundary > 69.9);
assert.equal(formatNascetPercent(boundary), '69.9', 'display cannot round moderate result into severe range');
assert.match(nascetCategory(boundary, 'en'), /moderate/);
assert.match(nascetCategory(70, 'en'), /severe/);
assert.match(nascetCategory(70, 'tr'), /ağır/);
assert.match(nascetCategory(70, 'tr', true), /Tama yakın oklüzyon/);

assert.equal(tortuosityClass(29, 'en'), 'Straight');
assert.equal(tortuosityClass(30, 'en'), 'Tortuous');
assert.equal(tortuosityClass(90, 'en'), 'Tortuous');
assert.equal(tortuosityClass(91, 'tr'), 'Kinking (açılanma)');
assert.match(tortuosityClass(20, 'tr', true), /Koil/);

assert.ok(REFERENCES.some(ref => /Neurosurgery\. 1996;38\(3\):425–433/.test(ref)), 'complete Bouthillier reference');
assert.ok(REFERENCES.some(ref => /Gibo H/.test(ref)), 'Gibo 1981 reference');

for (const file of [
  'src/angio/carotid/carotid-data.js', 'src/angio/carotid/carotid-panel.js',
  'src/angio/carotid/carotid-svg.js', 'src/angio/carotid/carotid.css',
  'src/angio/carotid/main.js', 'angio/carotid/index.html',
  'scripts/test-angio-carotid.mjs', 'scripts/test-angio-carotid-browser.cjs'
]) {
  assert.doesNotMatch(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), /\u2014/, `${file} contains no em dash`);
}

console.log(`PASS carotid data: ${VIEW_DEFS.length} views, ${STRUCTURES.length} bilingual structures, ${ARCH_VARIANTS.length} arch variants, real hit paths, NASCET boundaries, and tortuosity model`);
