import assert from 'node:assert/strict';
import { fetchCountryCode, initialLanguage, languageForCountry, readStoredLanguage } from '../src/entry-language.js';

assert.equal(languageForCountry('TR'), 'tr');
assert.equal(languageForCountry('tr'), 'tr');
assert.equal(languageForCountry(' US '), 'en');
assert.equal(languageForCountry(''), 'en');
assert.equal(languageForCountry(null), 'en');

const memory = new Map();
const storage = {
  getItem: key => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, value)
};
assert.equal(readStoredLanguage(storage), null);
storage.setItem('cardia_lang', 'en');
assert.equal(readStoredLanguage(storage), null, 'a saved language without an explicit click does not lock the entry language');
storage.setItem('cardia_lang_explicit', '1');
assert.equal(readStoredLanguage(storage), 'en');
assert.equal(initialLanguage(storage), 'en');

const fetched = await fetchCountryCode(async () => ({
  ok: true,
  json: async () => ({ country: 'TR' })
}));
assert.equal(fetched, 'TR');

console.log('PASS: Turkey maps to Turkish and every other country maps to English');
