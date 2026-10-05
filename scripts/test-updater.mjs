import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getTranslation, setContentLanguage } from '../src/content.js';

// 1. Verify version.json
const versionJsonPath = path.resolve('public/version.json');
assert.ok(fs.existsSync(versionJsonPath), 'public/version.json must exist');
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
assert.match(versionData.build, /^v\d+$/, 'build must have a revision');
assert.match(versionData.version, /^\d+\.\d+\.\d+$/, 'version must be semantic');
assert.match(versionData.date, /^\d{4}-\d{2}-\d{2}$/);

// 2. Verify sw.js
const swPath = path.resolve('public/sw.js');
assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
const swContent = fs.readFileSync(swPath, 'utf8');
assert.equal(swContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1], versionData.build, 'worker and release build agree');
assert.match(swContent, /CACHE\s*=\s*`cardia-\$\{VERSION\}`/, 'sw.js must define cache name with cardia-${VERSION}');
assert.match(swContent, /navigate/, 'sw.js must handle navigate requests');
assert.match(swContent, /SKIP_WAITING/, 'sw.js must support SKIP_WAITING');

// 3. Verify index.html meta tags
const indexPath = path.resolve('index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert.equal(indexContent.match(/name=["']app-version["']\s+content=["']([^'"]+)["']/)?.[1], versionData.version, 'HTML and release version agree');
assert.equal(indexContent.match(/name=["']app-build["']\s+content=["']([^'"]+)["']/)?.[1], versionData.build, 'HTML and worker cache revision agree');
assert.match(indexContent, /<noscript>/);

// 4. Verify translation strings
setContentLanguage('tr');
assert.equal(getTranslation('updateBtn'), 'Güncelleme denetle');
assert.equal(getTranslation('upTitle'), 'Yeni sürüm hazır');
assert.equal(getTranslation('upReload'), 'Güncellemek için yenile');

setContentLanguage('en');
assert.equal(getTranslation('updateBtn'), 'Check for updates');
assert.equal(getTranslation('upTitle'), 'New version ready');
assert.equal(getTranslation('upReload'), 'Reload to update');

// 5. Verify updater module syntax and exports
const updater = await import('../src/updater.js');
assert.equal(typeof updater.initUpdater, 'function', 'initUpdater must be a function');
assert.equal(typeof updater.showUpdatePrompt, 'function', 'showUpdatePrompt must be a function');
assert.equal(typeof updater.dismissUpdatePrompt, 'function', 'dismissUpdatePrompt must be a function');
assert.equal(typeof updater.checkAppUpdate, 'function', 'checkAppUpdate must be a function');
assert.equal(typeof updater.triggerAppUpdate, 'function', 'triggerAppUpdate must be a function');

// 6. An unstamped deploy: same version.json, different hashed files, is still an update.
const page = (js, css) => `<link rel="stylesheet" href="/assets/main-${css}.css"><script type="module" src="/assets/main-${js}.js"></script><link rel="modulepreload" href="/assets/three-Zz9yQw1x.js">`;
const sig = updater.bundleSignature;
assert.equal(typeof updater.checkBundleChange, 'function');
assert.equal(sig(page('Aa1Bb2Cc', 'Dd3Ee4Ff')), sig(`${page('Aa1Bb2Cc', 'Dd3Ee4Ff')}<p>other text</p>`), 'same files, same signature');
assert.notEqual(sig(page('Aa1Bb2Cc', 'Dd3Ee4Ff')), sig(page('Gg5Hh6Ii', 'Dd3Ee4Ff')), 'a new script hash changes the signature');
assert.notEqual(sig(page('Aa1Bb2Cc', 'Dd3Ee4Ff')), sig(page('Aa1Bb2Cc', 'Jj7Kk8Ll')), 'a new stylesheet hash changes the signature');
// Only files the server lists but the running page lacks count: lazy chunks and
// preload links the running page added must not report an update on every check.
const miss = updater.missingBundles;
const running = `${page('Aa1Bb2Cc', 'Dd3Ee4Ff')}<link rel="modulepreload" href="/assets/lazy-Mm1Nn2Oo.js"><link rel="stylesheet" href="/assets/panel-Pp3Qq4Rr.css">`;
assert.deepEqual(miss(page('Aa1Bb2Cc', 'Dd3Ee4Ff'), running), [], 'same build with extra loaded chunks: no update');
assert.deepEqual(miss(page('Gg5Hh6Ii', 'Dd3Ee4Ff'), running), ['/assets/main-Gg5Hh6Ii.js'], 'a new entry script is an update');
assert.deepEqual(miss(page('Aa1Bb2Cc', 'Dd3Ee4Ff'), '', ['https://x.test/assets/main-Aa1Bb2Cc.js', 'https://x.test/assets/main-Dd3Ee4Ff.css', 'https://x.test/assets/three-Zz9yQw1x.js']), [], 'loaded resources count as present');
assert.equal(sig(''), '');
assert.equal(sig(null), '');

console.log('PASS: PWA updater, aligned release metadata, no-JS message and i18n');
