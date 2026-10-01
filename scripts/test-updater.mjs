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

console.log('PASS: PWA updater, aligned release metadata, no-JS message and i18n');
