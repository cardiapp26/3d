const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png' };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    // All production URLs are served from local build fixtures; no live notes sent.
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      const roots = { 'https://3d.drtr.uk': path.resolve('dist'), 'https://cardi.drtr.uk': '/Users/yh/Documents/projects/cardi/dist' };
      const root = roots[url.origin];
      if (!root) return route.abort();
      const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(root + path.sep)) return route.abort();
      try {
        const headers = { 'content-type': mime[path.extname(file)] || 'application/octet-stream' };
        if (url.origin === 'https://cardi.drtr.uk') headers['cross-origin-opener-policy'] = url.pathname === '/transfer.html' ? 'unsafe-none' : 'same-origin-allow-popups';
        await route.fulfill({ status: 200, headers, body: await readFile(file) });
      } catch { await route.fulfill({ status: 404, body: 'Missing local fixture' }); }
    });
    const page = await context.newPage();
    await page.goto('https://3d.drtr.uk/?lang=tr');
    await page.locator('#panel-tab-notes').click();
    await page.evaluate(() => localStorage.setItem('cardia.personal-notes.v1.angiography', 'Anjiyografi fixture notu'));
    await page.locator('#personal-notes-input').fill('Anatomi fixture notu');
    const popupPromise = context.waitForEvent('page');
    await page.locator('#personal-notes-send').click();
    const popup = await popupPromise;
    await page.waitForFunction(() => document.querySelector('#personal-notes-transfer-status').textContent.includes('2 not Cardi’ye kaydedildi'));
    const result = await popup.evaluate(async () => {
      const info = (await indexedDB.databases()).find(d => d.name.startsWith('cardi-'));
      const db = await new Promise((resolve, reject) => { const r = indexedDB.open(info.name); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
      const count = store => new Promise(resolve => { const r = db.transaction(store).objectStore(store).count(); r.onsuccess = () => resolve(r.result); });
      return { notes: await count('notes'), revisions: await count('revisions'), outbox: await count('outbox') };
    });
    assert.deepEqual(result, { notes: 2, revisions: 2, outbox: 2 });
    await page.locator('#personal-notes-send').click();
    await page.waitForFunction(() => document.querySelector('#personal-notes-transfer-status').textContent.includes('2 not Cardi’ye kaydedildi'));
    console.log('PASS production build fixture: real send button, exact 3d origin, separate transfer COOP, two notes, confirmed commit');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
