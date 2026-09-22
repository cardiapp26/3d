import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getTranslation, setContentLanguage } from '../src/content.js';

// 1. Verify version.json
const versionJsonPath = path.resolve('public/version.json');
assert.ok(fs.existsSync(versionJsonPath), 'public/version.json must exist');
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
assert.equal(versionData.build, 'v9', 'build must be v9');
assert.equal(versionData.version, '1.9.0', 'version must be 1.9.0');

// 2. Verify sw.js
const swPath = path.resolve('public/sw.js');
assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
const swContent = fs.readFileSync(swPath, 'utf8');
assert.match(swContent, /VERSION\s*=\s*['"]v9['"]/, 'sw.js must define VERSION = v9');
assert.match(swContent, /CACHE\s*=\s*`cardia-\$\{VERSION\}`/, 'sw.js must define cache name with cardia-${VERSION}');
assert.match(swContent, /navigate/, 'sw.js must handle navigate requests');
assert.match(swContent, /SKIP_WAITING/, 'sw.js must support SKIP_WAITING');

// 3. Verify index.html meta tags
const indexPath = path.resolve('index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert.match(indexContent, /name=["']app-version["']\s+content=["']1\.9\.0["']/, 'index.html must have app-version meta tag');
assert.match(indexContent, /name=["']app-build["']\s+content=["']v9["']/, 'index.html must have app-build meta tag');

// 4. Verify translation strings
setContentLanguage('tr');
assert.equal(getTranslation('updateBtn'), 'Güncelle');
assert.equal(getTranslation('upTitle'), 'Yeni sürüm hazır');
assert.equal(getTranslation('upReload'), 'Güncellemek için yenile');

setContentLanguage('en');
assert.equal(getTranslation('updateBtn'), 'Update');
assert.equal(getTranslation('upTitle'), 'New version ready');
assert.equal(getTranslation('upReload'), 'Reload to update');

// 5. Verify updater module syntax and exports
const updater = await import('../src/updater.js');
assert.equal(typeof updater.initUpdater, 'function', 'initUpdater must be a function');
assert.equal(typeof updater.showUpdatePrompt, 'function', 'showUpdatePrompt must be a function');
assert.equal(typeof updater.dismissUpdatePrompt, 'function', 'dismissUpdatePrompt must be a function');
assert.equal(typeof updater.checkAppUpdate, 'function', 'checkAppUpdate must be a function');
assert.equal(typeof updater.triggerAppUpdate, 'function', 'triggerAppUpdate must be a function');

console.log('PASS: PWA updater, sw.js v9, version.json, and i18n verified successfully');
