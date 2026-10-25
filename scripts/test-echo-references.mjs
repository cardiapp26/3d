import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ECHO_REFERENCES, referenceForView, referencesForView } from '../src/echo-reference-catalog.js';

const root = path.resolve(import.meta.dirname, '../public/echo-references');
assert.deepEqual(ECHO_REFERENCES.map(record => `${record.modality}:${record.view}`),
  ['tte:plax', 'tte:a2c', 'tte:a3c', 'tte:a4c', 'tee:me4c', 'tee:me2c', 'tee:melax', 'tee:tgsax', 'tee:mebicaval', 'ice:ice-septal-sax', 'ice:ice-septal-sax']);
const files = [];
for (const record of ECHO_REFERENCES) {
  assert.ok(referencesForView(record.modality, record.view).includes(record));
  for (const modality of ['tte', 'tee', 'ice'].filter(m => m !== record.modality)) {
    assert.equal(referenceForView(modality, record.view), null, 'references must not leak across modalities');
  }
  assert.match(record.url, /^\/echo-references\/[a-z0-9-]+\.(gif|webm)$/);
  const file = path.join(root, path.basename(record.url));
  const bytes = fs.readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, `${record.view}: unchanged licensed source bytes`);
  assert.ok(bytes.length > 1000 && bytes.length < 8 * 1024 * 1024, 'bounded real media file');
  assert.ok(record.author && record.name && record.accessed && record.changes);
  assert.equal(new URL(record.sourceUrl).hostname, 'commons.wikimedia.org');
  assert.equal(new URL(record.downloadUrl).hostname, 'upload.wikimedia.org');
  assert.equal(new URL(record.licenseUrl).hostname, 'creativecommons.org');
  if (record.kind === 'composite') {
    assert.equal(record.type, 'image/gif');
    assert.equal(record.license, 'CC BY 2.5');
    assert.match(bytes.subarray(0, 6).toString(), /^GIF8[79]a$/);
  } else {
    assert.equal(record.kind, 'cine');
    assert.equal(record.type, 'video/webm');
    assert.equal(record.license, record.modality === 'tte' ? 'CC BY-SA 3.0' : 'CC BY 2.0');
    assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3', 'WebM EBML header');
  }
  if (record.modality === 'tee') {
    assert.ok(record.originalPath.startsWith('research/echo/source-media/'));
    const original = fs.readFileSync(path.resolve(import.meta.dirname, '..', record.originalPath));
    assert.equal(original.subarray(0, 4).toString(), 'OggS');
    assert.equal(createHash('sha256').update(original).digest('hex'), record.sourceSha256);
    assert.ok(record.changesNote.tr && record.changesNote.en && record.sourceNote.tr && record.sourceNote.en);
    assert.equal(new URL(record.articleUrl).hostname, 'doi.org');
    assert.equal(record.sample, record.view === 'mebicaval' ? 'pathology' : 'rest');
    assert.doesNotMatch(record.name, /normal/i, 'rest and pathology recordings must not be mislabeled as normal');
  } else if (record.modality === 'ice') {
    assert.equal(record.comparison, 'topic');
    assert.equal(record.device, 'rotational');
    assert.equal(record.privacy, 'header-redacted');
    assert.ok(record.title.tr && record.title.en && record.sourceNote.tr && record.sourceNote.en);
    assert.match(record.sourceNote.en, /360°/);
    assert.match(record.sourceSha256, /^[a-f0-9]{64}$/);
    assert.equal(new URL(record.articleUrl).hostname, 'doi.org');
    const verified = JSON.parse(fs.readFileSync(new URL('../research/echo/ice-media-verification.json', import.meta.url))).find(item => item.sha256 === record.sha256);
    assert.ok(verified && verified.sourceSha256 === record.sourceSha256 && verified.frameCount > 1);
    assert.equal(verified.sourceRetainedInRepository, false);
    assert.match(verified.filter, /drawbox/);
    assert.equal(fs.existsSync(path.resolve(import.meta.dirname, '../research/echo/source-media', path.basename(record.url).replace('.webm', '.ogv'))), false, 'unredacted ICE originals stay outside the repository');
  } else assert.equal(record.changes, 'None');
  files.push(path.basename(file));
}
assert.equal(referenceForView('tte', 'psax-pm'), null);
assert.equal(referenceForView('ice', 'ice-home'), null);
assert.equal(referencesForView('ice', 'ice-septal-sax').length, 2);
assert.equal(referenceForView('ice', 'ice-septal-sax'), referencesForView('ice', 'ice-septal-sax')[0]);
assert.equal(referenceForView('tee', 'memc'), null, 'unverified views retain their empty state');
assert.equal(referenceForView('tee', 'melaa'), null);
assert.equal(referenceForView('tte', '__proto__'), null);
assert.deepEqual(fs.readdirSync(root).filter(file => /\.(gif|webm|mp4)$/i.test(file)).sort(), files.sort(), 'no uncredited media shipped');
console.log('PASS echo references: 11 source-linked assets, source/output hashes, licenses, media signatures, ICE header-redaction records, multiple selections and modality isolation');
