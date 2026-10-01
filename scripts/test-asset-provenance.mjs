import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cardia-provenance-'));
const bytes = Buffer.from('provenance-test-fixture');
fs.mkdirSync(path.join(dir, 'public/models'), { recursive: true });
fs.writeFileSync(path.join(dir, 'public/models/fixture.glb'), bytes);
const original = {
  path: 'public/models/fixture.glb', sha256: createHash('sha256').update(bytes).digest('hex'),
  origin: 'original', status: 'owner-declared', author: 'Fixture owner',
  ownershipDeclaration: 'I designed this fixture.', declaredOn: '2026-10-01',
  license: null, sourceUrl: null
};
const run = asset => {
  fs.writeFileSync(path.join(dir, 'ASSET_PROVENANCE.json'), JSON.stringify({ assets: [asset] }));
  return spawnSync(process.execPath, [path.resolve('scripts/verify-asset-license.mjs')], { cwd: dir, encoding: 'utf8' });
};
assert.equal(run(original).status, 0, 'original owner declaration requires no external license or source URL');
assert.equal(run({ ...original, ownershipDeclaration: '' }).status, 1, 'missing declaration is not implicitly accepted');
assert.equal(run({ ...original, sha256: 'changed' }).status, 1, 'record remains tied to actual asset bytes');
assert.equal(run({ ...original, origin: 'imported', status: 'unverified' }).status, 1, 'owner path does not bypass imported-asset records');
console.log('PASS asset provenance: original ownership accepted, missing record/change/imported controls retained');
