/**
 * Link between the two pages of Cardia: the 3D header carries the EPS link,
 * a language click on the 3D page carries over to the EPS page and back, and
 * the EPS header links back to the 3D simulator.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/`);
    await page.waitForSelector('#eps-link');
    assert.equal(await page.locator('#eps-link').isVisible(), true, 'EPS link in the 3D header');

    // An explicit English choice on the 3D page opens the EPS page in English.
    if ((await page.locator('#lang-btn').textContent()).trim() !== 'EN') await page.locator('#lang-btn').click();
    assert.match(await page.locator('#eps-link').getAttribute('title'), /EPS laboratory/);
    await Promise.all([page.waitForURL(/\/eps\/$/), page.locator('#eps-link').click()]);
    await page.waitForSelector('[data-ep-live]');
    assert.equal(await page.evaluate(() => window.epsLab.getLang()), 'en', 'language carried to the EPS page');
    assert.equal(await page.locator('[data-app-back]').textContent(), '3D Anatomy');

    // Turkish on the EPS page, then back: the 3D page follows.
    await page.locator('[data-app-lang-option=tr]').click();
    await Promise.all([page.waitForURL((url) => !url.pathname.startsWith('/eps')), page.locator('[data-app-back]').click()]);
    await page.waitForSelector('#lang-btn');
    assert.equal((await page.locator('#lang-btn').textContent()).trim(), 'TR', 'language carried back to the 3D page');
    assert.match(await page.locator('#eps-link').getAttribute('title'), /EPS laboratuvarı/);

    // Mobile: the link stays in the header with a touch-sized target.
    await page.setViewportSize({ width: 390, height: 844 });
    const box = await page.locator('#eps-link').boundingBox();
    assert.ok(box && box.height >= 44, `mobile link ${JSON.stringify(box)}`);
    const right = await page.evaluate(() => Math.max(...[...document.querySelectorAll('header .header-right > *')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().right)));
    assert.ok(right <= 390, `header row fits the phone: right edge ${right}`);
    assert.deepEqual(errors, []);
    console.log('PASS eps-link-browser: 3D header link to /eps/, shared TR/EN choice both ways, back link to the 3D page, mobile touch target');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
