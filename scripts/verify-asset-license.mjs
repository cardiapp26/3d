import fs from 'node:fs';
import { createHash } from 'node:crypto';

// Original project assets use the owner's declaration; imported assets use rights records.
const manifest = JSON.parse(fs.readFileSync('ASSET_PROVENANCE.json', 'utf8'));
const models = fs.readdirSync('public/models').filter(name => /\.(glb|gltf)$/i.test(name));
const failures = [];
for (const name of models) {
  const path = `public/models/${name}`;
  const asset = manifest.assets.find(a => a.path === path);
  const sha = createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  if (!asset || asset.sha256 !== sha) failures.push(`${path}: missing record or changed asset checksum`);
  const filled = fields => fields.every(k => typeof asset?.[k] === 'string' && asset[k].trim());
  const original = asset?.origin === 'original' && asset.status === 'owner-declared' &&
    filled(['author', 'ownershipDeclaration', 'declaredOn']);
  const imported = asset?.status === 'verified' &&
    filled(['author', 'license', 'sourceUrl', 'permissionEvidence', 'reviewedBy', 'reviewedOn']);
  if (!original && !imported) {
    failures.push(`${path}: creator, license and documented redistribution permission require human verification`);
  }
}
if (failures.length) {
  console.error(`BLOCKED asset distribution:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log('PASS asset provenance: model checksums match owner declarations or imported-asset rights records');
