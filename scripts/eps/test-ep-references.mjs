// Every R number cited by the EPS cases or texts resolves to a reference
// with a link, and the case note does not point to a developer file.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { EP_REFERENCES, referenceHref } from '../../src/eps/ep-references.js';
import { EP_CASES } from '../../src/eps/ep-cases.js';
import { EP_CITATION_NOTE } from '../../src/eps/ep-case-text.js';

const dir = new URL('../../src/eps/', import.meta.url);
const cited = new Set();
for (const name of readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'ep-references.js')) {
  for (const m of readFileSync(new URL(name, dir), 'utf8').matchAll(/\bR(\d{1,2})\b/g)) cited.add(`R${m[1]}`);
}
for (const c of EP_CASES) for (const id of c.citations) cited.add(id);
const missing = [...cited].filter((id) => !EP_REFERENCES[id]);
assert.deepEqual(missing, [], `cited without a reference: ${missing.join(', ')}`);

for (const [id, ref] of Object.entries(EP_REFERENCES)) {
  assert.ok(ref.cite.length > 10, `${id} citation text`);
  assert.match(referenceHref(id), /^https:\/\/(doi\.org|pmc\.ncbi\.nlm\.nih\.gov)\//, `${id} link`);
}
assert.equal(referenceHref('R999'), null);
for (const lang of ['tr', 'en']) assert.doesNotMatch(EP_CITATION_NOTE[lang], /research\/|\.md\b|Josephson|Zipes/, `${lang} note names only real sources`);

console.log(`PASS ep references: ${cited.size} cited ids resolve, ${Object.keys(EP_REFERENCES).length} entries linked`);
