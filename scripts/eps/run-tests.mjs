// EPS unit tests: every scripts/eps/test-*.mjs in its own process, plus a
// syntax check of the EPS sources and scripts and the no em dash rule.
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('../../', import.meta.url);
const path = (file) => fileURLToPath(new URL(file, root));
const list = (dir, re) => readdirSync(new URL(dir, root)).filter((n) => re.test(n)).map((n) => `${dir}${n}`);
const sources = [...list('src/eps/', /\.(js|css)$/), ...list('scripts/eps/', /\.(m?js|cjs)$/), 'eps/index.html'];
for (const file of sources.filter((f) => /\.(m?js|cjs)$/.test(f))) execFileSync(process.execPath, ['--check', path(file)]);
const dashed = sources.filter((f) => readFileSync(new URL(f, root), 'utf8').includes(String.fromCharCode(0x2014)));
assert.deepEqual(dashed, [], `em dash in: ${dashed.join(', ')}`);
console.log(`PASS eps check: ${sources.length} files parse, no em dash`);
for (const test of list('scripts/eps/', /^test-.*\.mjs$/)) execFileSync(process.execPath, [path(test)], { stdio: 'inherit' });
