import assert from 'node:assert/strict';
import {
  ARCH_TYPES,
  ARCH_VARIANTS,
  REFERENCES,
  STRUCTURES,
  VIEW_DEFS,
  calculateNascet,
  nascetCategory,
  tortuosityClass,
  viewStructures
} from '../src/angio/carotid/carotid-data.js';
import { renderCarotidSvg } from '../src/angio/carotid/carotid-svg.js';

assert.equal(VIEW_DEFS.length, 5, 'five teaching views');
assert.equal(new Set(STRUCTURES.map(item => item.id)).size, STRUCTURES.length, 'structure ids unique');
for (const view of VIEW_DEFS) {
  assert.ok(viewStructures(view.id).length >= 3, `${view.id} has selectable structures`);
  const svg = renderCarotidSvg(view.id, {
    archType: 'I', archVariant: 'normal', projection: 'lateral', angle: 25
  }, 'en');
  assert.equal((svg.match(/class="carotid-structure"/g) || []).length, viewStructures(view.id).length, `${view.id} renders every structure once`);
  assert.equal((svg.match(/role="button"/g) || []).length, viewStructures(view.id).length, `${view.id} structures have button role`);
  assert.equal((svg.match(/tabindex="0"/g) || []).length, viewStructures(view.id).length, `${view.id} structures are keyboard focusable`);
}
for (const item of STRUCTURES) {
  for (const field of ['label', 'description', 'pearl']) {
    assert.ok(item[field]?.tr && item[field]?.en, `${item.id} ${field} bilingual`);
  }
}
assert.equal(ARCH_TYPES.length, 3);
assert.equal(ARCH_VARIANTS.length, 6);
assert.ok(REFERENCES.length >= 6);
assert.equal(calculateNascet(1.2, 4), 70);
assert.equal(calculateNascet(4, 4), 0);
assert.equal(calculateNascet(5, 4), null);
assert.match(nascetCategory(69, 'en'), /moderate/);
assert.match(nascetCategory(70, 'en'), /severe/);
assert.equal(tortuosityClass(65, 'en'), 'Kinked');
assert.notEqual(
  renderCarotidSvg('arch', { archType: 'I', archVariant: 'normal' }, 'en'),
  renderCarotidSvg('arch', { archType: 'III', archVariant: 'lusoria' }, 'en'),
  'arch controls redraw geometry'
);

console.log(`PASS carotid data: ${VIEW_DEFS.length} views, ${STRUCTURES.length} bilingual structures, ${ARCH_VARIANTS.length} arch variants, NASCET and tortuosity models`);
