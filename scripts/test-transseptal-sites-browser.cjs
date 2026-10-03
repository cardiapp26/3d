/**
 * Transseptal lesson in the browser: the Target sites switch shows five
 * procedure rings on the fossa (EHRA 2026 Figure 2), each names its procedure,
 * and the updated step texts carry the consensus items.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('[data-mode=transseptal]').dispatchEvent('click');
    await page.waitForTimeout(800);
    const toggle = page.locator('[data-ts-cath=sites]');
    assert.equal(await toggle.count(), 1, 'the Target sites switch exists');
    assert.equal(await toggle.evaluate((el) => el.checked), false, 'off by default');
    assert.equal(await page.evaluate(() => window.heart.getCatheterVisibility().sites), false);
    await toggle.evaluate((el) => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.heart.getCatheterVisibility().sites), true, 'sites shown after the switch');
    const next = page.locator('#steps button').nth(1);
    await next.click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.heart.getCatheterVisibility().sites), true, 'sites survive a step change');
    const text = await page.locator('#step-detail').textContent();
    assert.ok(/EHRA 2026/.test(text) && /LAA kapatmada posterior-inferior/.test(text), 'step 2 carries the site-by-procedure text');
    assert.equal(errors.length, 0, 'no page errors: ' + errors.join('; '));
    console.log('PASS: transseptal target sites switch and consensus step texts');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
