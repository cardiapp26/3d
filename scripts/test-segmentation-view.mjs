import assert from 'node:assert/strict';
import { atlasParts } from '../src/atlas.js';
import { uiTranslations } from '../src/content.js';
import { SEGMENTATION_LABELS, segmentationLabelFor, visibleSegmentationLabels, labelCss } from '../src/segmentation-view.js';

// 1. Every atlas structure belongs to exactly one label.
const atlasIds = [...new Set(Object.values(atlasParts).map(part => part.id))];
for (const id of atlasIds) assert.ok(segmentationLabelFor(id), `${id}: has a segmentation label`);
const owners = new Map();
for (const label of SEGMENTATION_LABELS) {
  for (const id of label.ids) {
    assert.ok(!owners.has(id), `${id}: listed once (${owners.get(id)} and ${label.key})`);
    owners.set(id, label.key);
    assert.ok(atlasIds.includes(id), `${id}: is an atlas structure, schematic overlays keep their own material`);
  }
}
assert.equal(segmentationLabelFor('mitral-annulus'), null, 'schematic annulus has no label');
assert.equal(segmentationLabelFor(undefined), null);

// 2. Label colours are distinct enough to tell neighbours apart.
const rgb = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const distance = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
for (const [i, a] of SEGMENTATION_LABELS.entries()) {
  for (const b of SEGMENTATION_LABELS.slice(i + 1)) {
    assert.ok(distance(a.color, b.color) >= 60, `${a.key} and ${b.key}: colours ${Math.round(distance(a.color, b.color))} apart`);
  }
}
assert.equal(labelCss(SEGMENTATION_LABELS[0]), '#' + SEGMENTATION_LABELS[0].color.toString(16).padStart(6, '0'));

// 3. Every label and the legend text exist in both interface languages.
for (const lang of ['tr', 'en']) {
  for (const label of SEGMENTATION_LABELS) assert.ok(uiTranslations[lang][label.i18n]?.trim(), `${label.i18n}: ${lang} name`);
  for (const key of ['segmentationBtn', 'segmentationTitle', 'segmentationShortcut', 'segmentationLegendTitle', 'segmentationNote']) {
    assert.ok(uiTranslations[lang][key]?.trim(), `${key}: ${lang} text`);
  }
}

// 4. The legend lists only labels that are on screen, in catalogue order, once each.
assert.deepEqual(visibleSegmentationLabels([]), []);
assert.deepEqual(visibleSegmentationLabels(['rv', 'lv', 'lv', 'mitral-annulus']).map(l => l.key), ['lv', 'rv']);
assert.deepEqual(visibleSegmentationLabels(['lspv', 'ripv']).map(l => l.key), ['pv']);
assert.deepEqual(visibleSegmentationLabels(atlasIds).map(l => l.key), SEGMENTATION_LABELS.map(l => l.key));

console.log(`PASS: ${SEGMENTATION_LABELS.length} segmentation labels cover ${atlasIds.length} atlas structures with distinct colours and TR/EN names`);
