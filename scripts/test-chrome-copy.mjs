import assert from 'node:assert/strict';
import {
  getAngioDescription,
  getContentLanguage,
  getTranslation,
  getUiModes,
  getViewerTitle,
  setContentLanguage
} from '../src/content.js';

const previous = getContentLanguage();

setContentLanguage('en');
assert.equal(getUiModes().length, 14);
// Listed (and numbered) in the order the grouped mode menu shows them.
assert.deepEqual(getUiModes().map(([id]) => id), [
  'anatomy',
  'atria',
  'ra',
  'defects',
  'cath',
  'exam',
  'angiography',
  'transseptal',
  'ablation',
  'pacemaker',
  'bachmann',
  'echo',
  'tee',
  'ice'
]);
assert.match(getViewerTitle('angiography'), /projection/i);
assert.match(getAngioDescription('spider'), /spider/i);
assert.match(getAngioDescription('custom', { laoRaoStr: 'LAO 12°', craCauStr: 'CRA 4°' }), /LAO 12°/);
assert.equal(getTranslation('wallClosed'), 'Closed');
assert.equal(getUiModes().find(([id]) => id === 'atria')[2], 'Left atrium & LAA');
assert.equal(getUiModes().find(([id]) => id === 'ra')[2], 'Right atrium');
const englishSpider = getAngioDescription('spider');

setContentLanguage('tr');
assert.equal(getUiModes().length, 14);
assert.equal(getTranslation('wallClosed'), 'Kapalı');
assert.equal(getUiModes().find(([id]) => id === 'atria')[2], 'Sol atriyum & LAA');
assert.equal(getUiModes().find(([id]) => id === 'ra')[2], 'Sağ atriyum');
assert.match(getAngioDescription('spider'), /Spider|bifurk/i);
assert.notEqual(getAngioDescription('spider'), englishSpider);
assert.match(getViewerTitle('bachmann'), /Bachmann/);
assert.match(getViewerTitle('cath'), /basınç|eğri/i);

setContentLanguage(previous);
console.log('PASS: chrome copy switches between Turkish and English for modes, titles, and projections');
