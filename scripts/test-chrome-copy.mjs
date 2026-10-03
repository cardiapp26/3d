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
assert.equal(getUiModes().length, 16);
// Listed (and numbered) in the order the grouped mode menu shows them.
assert.deepEqual(getUiModes().map(([id]) => id), [
  'anatomy',
  'atria',
  'ra',
  'rv',
  'lv',
  'defects',
  'exam',
  'angiography',
  'cath',
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
assert.equal(getUiModes().find(([id]) => id === 'rv')[2], 'Right ventricle');
assert.equal(getUiModes().find(([id]) => id === 'lv')[2], 'Left ventricle');
const englishSpider = getAngioDescription('spider');

setContentLanguage('tr');
assert.equal(getUiModes().length, 16);
assert.equal(getTranslation('wallClosed'), 'Kapalı');
assert.equal(getUiModes().find(([id]) => id === 'atria')[2], 'Sol atriyum & LAA');
assert.equal(getUiModes().find(([id]) => id === 'ra')[2], 'Sağ atriyum');
assert.equal(getUiModes().find(([id]) => id === 'rv')[2], 'Sağ ventrikül');
assert.equal(getUiModes().find(([id]) => id === 'lv')[2], 'Sol ventrikül');
assert.match(getAngioDescription('spider'), /Spider|bifurk/i);
assert.notEqual(getAngioDescription('spider'), englishSpider);
assert.match(getViewerTitle('bachmann'), /Bachmann/);
assert.match(getViewerTitle('cath'), /basınç|eğri/i);

setContentLanguage(previous);
console.log('PASS: chrome copy switches between Turkish and English for modes, titles, and projections');
