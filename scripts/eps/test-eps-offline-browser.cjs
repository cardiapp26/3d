/**
 * EPS page offline (needs a production build served with public/sw.js, e.g.
 * vite preview): a visitor who opens the EPS page first gets the shared
 * service worker, and after one online visit the page reloads offline with
 * its own shell (not the 3D simulator's), deep links included.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
// The EPS page of Cardia: EPS_URL, else APP_URL + /eps.
const APP = (process.env.EPS_URL || `${(process.env.APP_URL || 'http://localhost:4173/').replace(/\/$/, '')}/eps`).replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/`);
    await page.waitForSelector('[data-ep-live]');
    // The EPS page registers the shared worker; scope covers the whole site.
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    assert.equal(new URL(scope).pathname, '/', `worker scope ${scope}`);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    // One controlled online load caches the page's assets.
    await page.reload();
    await page.waitForSelector('[data-ep-live]');

    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('[data-ep-live]');
    assert.equal(await page.evaluate(() => typeof window.epsLab?.panel), 'object', 'EPS page works offline');
    await page.goto(`${APP}/?offline=1#/clip/sinus`);
    await page.waitForSelector('.ep-lesson');
    assert.deepEqual(await page.evaluate(() => { const s = window.epsLab.panel.getState(); return [s.section, s.clipId]; }), ['treatment', 'sinus'], 'offline deep link opens the EPS shell');
    assert.equal(await page.title(), 'EPS Laboratuvarı', 'EPS shell, not the 3D simulator');
    await context.setOffline(false);
    assert.deepEqual(errors, []);
    console.log('PASS eps-offline-browser: EPS page registers the shared worker (scope /), reloads offline, offline deep link gets the EPS shell');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
