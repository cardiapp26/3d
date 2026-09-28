import assert from 'node:assert/strict';
import { DEFECT_TYPES, DEFECT_COPY } from '../src/septal-defects-data.js';

const LANGS = ['tr', 'en'];
const TEXT_FIELDS = ['title', 'location', 'detail', 'prevalence', 'associations', 'conduction', 'closure'];

assert.equal(DEFECT_TYPES.length, 9, 'nine teaching categories');
assert.equal(DEFECT_TYPES.filter(item => item.family === 'asd').length, 5, 'five atrial communications');
assert.equal(DEFECT_TYPES.filter(item => item.family === 'vsd').length, 4, 'four ventricular categories');
assert.equal(new Set(DEFECT_TYPES.map(item => item.id)).size, 9, 'unique ids');
assert.equal(new Set(DEFECT_TYPES.map(item => item.mark)).size, 9, 'unique 3D/2D marks');

for (const item of DEFECT_TYPES) {
  assert.ok(item.id.startsWith(`${item.family}-`), `${item.id} id carries its family`);
  assert.ok(item.mark.length >= 1 && item.mark.length <= 3, `${item.id} mark is a short code`);
  for (const field of TEXT_FIELDS) for (const lang of LANGS) {
    const text = item[field]?.[lang];
    assert.ok(typeof text === 'string' && text.trim().length > 0, `${item.id}.${field}.${lang} is filled`);
    assert.ok(!text.includes('\u2014'), `${item.id}.${field}.${lang} has no em dash`);
  }
  assert.match(item.source.url, /^https:\/\//, `${item.id} primary source is a URL`);
  assert.ok(Array.isArray(item.references) && item.references.length >= 1, `${item.id} has further reading`);
  for (const ref of item.references) assert.match(ref.url, /^https:\/\/(doi\.org|pmc\.ncbi\.nlm\.nih\.gov)\//, `${item.id} reference resolves via DOI or PMC`);
}

// Classification guardrails from the cited reviews.
const byId = Object.fromEntries(DEFECT_TYPES.map(item => [item.id, item]));
assert.match(byId['asd-secundum'].closure.en, /device/i, 'secundum is the device-closure candidate');
for (const id of ['asd-primum', 'asd-sinus-superior', 'asd-sinus-inferior', 'asd-coronary-sinus']) {
  assert.match(byId[id].closure.en, /surg/i, `${id} needs surgical closure`);
}
assert.match(byId['vsd-perimembranous'].conduction.en, /posteroinferior/i, 'perimembranous: His bundle on the posteroinferior rim');
assert.match(byId['vsd-inlet'].conduction.en, /anterosuperior/i, 'muscular inlet: axis anterosuperior');
assert.match(byId['asd-primum'].conduction.en, /displaced/i, 'primum: displaced conduction axis');
assert.match(byId['vsd-outlet'].detail.en, /doubly committed/i, 'outlet includes the doubly committed subtype');

for (const lang of LANGS) {
  for (const key of ['title', 'intro', 'schematic', 'flowNote', 'pfoNote', 'avsdNote']) {
    assert.ok(DEFECT_COPY[lang][key]?.length, `copy.${lang}.${key} is filled`);
  }
}
console.log('PASS: ASD/VSD data contract, bilingual clinical fields and classification guardrails');
