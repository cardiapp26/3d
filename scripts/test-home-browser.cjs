/**
 * Welcome page in the browser: the bare root shows the module cards with thumbnails, a card
 * opens its module, the module brand returns to the welcome page, a 3D route boots the 3D
 * shell on the same page and Back returns to the welcome page; no overflow on a phone.
 */
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`${APP}/?lang=tr`, { waitUntil: 'networkidle' });
    const cards = await page.locator('[data-home-card]').count();
    assert.ok(cards >= 14, `module cards (${cards})`);
    assert.equal(await page.locator('#viewport').count(), 0, 'the 3D shell is not loaded on the welcome page');
    // Thumbnails load once scrolled into view.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
    await page.waitForTimeout(400);
    const broken = await page.evaluate(() => [...document.querySelectorAll('.home-thumb img')].filter((i) => !(i.complete && i.naturalWidth > 0)).length);
    assert.equal(broken, 0, 'every thumbnail loads');

    // Card -> module -> brand -> welcome page.
    await page.click('[data-home-card="angio-ivus"]');
    await page.waitForURL(/\/angio\/ivus\/$/);
    await page.click('.site-brand');
    await page.waitForSelector('[data-home-card]');
    assert.equal(new URL(page.url()).pathname, '/', 'module brand returns to the welcome page');

    // 3D route on the same page, then Back.
    await page.click('.home-hero .home-cta');
    await page.waitForSelector('#viewport', { timeout: 60000 });
    assert.match(page.url(), /#\/mode\/anatomy$/);
    assert.equal(await page.locator('#home').count(), 0, 'welcome page removed when the 3D shell boots');
    assert.match(await page.getAttribute('.site-modules [data-simulator-link]', 'href'), /#\/mode\/anatomy$/, '3D Anatomy menu link keeps a route');
    await page.goBack();
    await page.waitForSelector('[data-home-card]', { timeout: 20000 });

    // A 3D deep link boots the shell directly.
    await page.goto(`${APP}/#/mode/atria?structure=laa`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#viewport', { timeout: 60000 });
    assert.equal(await page.locator('#home').count(), 0);

    // Language toggle.
    await page.goto(`${APP}/?lang=tr`, { waitUntil: 'networkidle' });
    await page.click('[data-home-lang="en"]');
    assert.match(await page.title(), /Interactive cardiology studio/);
    await page.click('[data-home-lang="tr"]');

    // From a depth-2 module the brand still reaches the welcome page.
    await page.goto(`${APP}/angio/carotid/`, { waitUntil: 'networkidle' });
    await page.click('.site-brand');
    await page.waitForSelector('[data-home-card]');

    const phone = await browser.newPage({ ...devices['iPhone 13'] });
    await phone.goto(`${APP}/?lang=tr`, { waitUntil: 'networkidle' });
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow on a phone');
    assert.deepEqual(errors, []);
    console.log(`PASS welcome page browser: ${cards} cards with thumbnails, card -> module -> brand -> home, 3D route and Back, deep link, TR/EN, phone`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
