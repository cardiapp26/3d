/**
 * Welcome page in the browser: the bare root shows the module cards with thumbnails, a card
 * opens its module, the module brand returns to the welcome page, a 3D route boots the 3D
 * shell on the same page and Back returns to the welcome page; the DRTR platform section links
 * the other apps in new tabs; no overflow on a phone.
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

    // DRTR platform section: 14 external links in new tabs, thumbnails load, nav anchor leaves no hash.
    const apps = await page.$$eval('#home-drtr a.home-app', (as) => as.map((a) => ({
      href: a.href, target: a.target, rel: a.rel, name: a.textContent.replace(/\s+/g, ' ').trim(),
      img: (() => { const i = a.querySelector('img'); return i && i.loading === 'lazy' && i.complete && i.naturalWidth > 0; })()
    })));
    assert.equal(apps.length, 14, `DRTR links (${apps.length})`);
    for (const a of apps) {
      assert.match(a.href, /^https:\/\/([a-z0-9-]+\.)?drtr\.uk\//, `DRTR link ${a.href}`);
      assert.equal(a.target, '_blank', `${a.href}: new tab`);
      assert.match(a.rel, /\bnoopener\b/, `${a.href}: rel noopener`);
      assert.ok(a.name.length > 10, `${a.href}: accessible name`);
      assert.ok(a.img, `${a.href}: lazy thumbnail loads after scrolling`);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('.home-links a[href="#home-drtr"]');
    await page.waitForFunction(() => document.getElementById('home-drtr').getBoundingClientRect().top < innerHeight / 2);
    assert.equal(new URL(page.url()).hash, '', 'DRTR anchor leaves no hash');

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
    const phoneApps = await phone.evaluate(() => {
      const grid = document.querySelector('#home-drtr .home-apps');
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const box = grid.getBoundingClientRect();
      const inside = [...grid.querySelectorAll('.home-app')].every((a) => { const r = a.getBoundingClientRect(); return r.left >= box.left - 1 && r.right <= box.right + 1; });
      return { cols, inside, right: box.right, width: innerWidth };
    });
    assert.equal(phoneApps.cols, 2, 'DRTR cards in two columns on a phone');
    assert.ok(phoneApps.inside && phoneApps.right <= phoneApps.width, 'DRTR cards stay inside the phone width');
    assert.deepEqual(errors, []);
    console.log(`PASS welcome page browser: ${cards} cards with thumbnails, ${apps.length} DRTR links in new tabs, card -> module -> brand -> home, 3D route and Back, deep link, TR/EN, phone`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
