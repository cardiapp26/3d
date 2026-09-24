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
assert.equal(getUiModes().length, 8);
assert.deepEqual(getUiModes().map(([id]) => id), [
  'anatomy',
  'angiography',
  'ablation',
  'pacemaker',
  'transseptal',
  'bachmann',
  'cath',
  'exam'
]);
assert.match(getViewerTitle('angiography'), /projection/i);
assert.match(getAngioDescription('spider'), /spider/i);
assert.match(getAngioDescription('custom', { laoRaoStr: 'LAO 12°', craCauStr: 'CRA 4°' }), /LAO 12°/);
assert.equal(getTranslation('wallClosed'), 'Closed');
const englishSpider = getAngioDescription('spider');

setContentLanguage('tr');
assert.equal(getUiModes().length, 8);
assert.equal(getTranslation('wallClosed'), 'Kapalı');
assert.match(getAngioDescription('spider'), /Spider|bifurk/i);
assert.notEqual(getAngioDescription('spider'), englishSpider);
assert.match(getViewerTitle('bachmann'), /Bachmann/);
assert.match(getViewerTitle('cath'), /basınç|eğri/i);

setContentLanguage(previous);
console.log('PASS: chrome copy switches between Turkish and English for modes, titles, and projections');
