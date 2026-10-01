import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = process.env.APP_URL;
if (!base) throw new Error('APP_URL must point to a server using nginx.conf (not Vite)');
const assets = fs.readdirSync('dist/assets').filter(name => /-[A-Za-z0-9_-]{8,}\.(js|css|wasm)$/.test(name));
assert.ok(assets.length, 'build dist before deployment verification');
for (const path of ['/index.html', '/sw.js', '/models/cardiovascular.glb', '/draco/draco_decoder.wasm']) {
  const res = await fetch(new URL(path, base), { method: 'HEAD', cache: 'no-store' });
  assert.equal(res.status, 200, path);
  assert.match(res.headers.get('cache-control') || '', /no-cache/, path);
  assert.doesNotMatch(res.headers.get('cache-control') || '', /immutable/, path);
}
const release = await fetch(new URL('/version.json', base), { cache: 'no-store' });
assert.equal(release.status, 200);
assert.match(release.headers.get('cache-control') || '', /no-store/);
const expected = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
assert.deepEqual(await release.json(), expected, 'served release is current');
const index = await (await fetch(new URL('/index.html', base), { cache: 'no-store' })).text();
assert.equal(index.match(/name="app-build" content="([^"]+)"/)?.[1], expected.build, 'served HTML build agrees');
assert.equal(index.match(/name="app-version" content="([^"]+)"/)?.[1], expected.version, 'served HTML version agrees');
const worker = await (await fetch(new URL('/sw.js', base), { cache: 'no-store' })).text();
assert.equal(worker.match(/const VERSION = '([^']+)'/)?.[1], expected.build, 'served worker cache agrees');
for (const name of assets) {
  const res = await fetch(new URL(`/assets/${name}`, base), { method: 'HEAD' });
  assert.equal(res.status, 200, name);
  assert.match(res.headers.get('cache-control') || '', /max-age=31536000/);
  assert.match(res.headers.get('cache-control') || '', /immutable/);
}
assert.equal((await fetch(new URL('/models/heart.glb', base), { method: 'HEAD' })).status, 404, 'legacy model is not distributed');
assert.equal((await fetch(new URL('/assets/missing-12345678.js', base), { method: 'HEAD' })).status, 404, 'missing assets never receive SPA HTML');
console.log('PASS deployment: live nginx cache headers, release stamp, legacy exclusion and missing asset responses');
