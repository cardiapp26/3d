/**
 * Live EP recording system in the browser: the "Live recording" tab replaces
 * the lesson content, the monitor sweeps, a programmed S2 induces AVNRT in
 * the dual-pathway substrate, freeze enables review and vertical calipers,
 * cardioversion restores sinus rhythm, and the lesson tabs come back.
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
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('[data-ep-section=live]').click();
    assert.equal(await page.locator('.ep-lesson').isHidden(), true, 'lesson content hidden');
    assert.equal(await page.locator('[data-ep-live]').isVisible(), true, 'live laboratory shown');
    assert.equal(await page.evaluate(() => window.cardiaEp.getState().live), true);

    // The monitor sweeps on its own (animation loop).
    const t0 = await page.evaluate(() => window.cardiaEp.live.getState().now);
    await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => window.cardiaEp.live.getState().now) > t0 + 300, 'simulation time advances');
    const canvas = await page.evaluate(() => { const c = document.querySelector('.ep-live-canvas'); return { w: c.width, h: c.clientHeight }; });
    assert.ok(canvas.w > 400 && canvas.h >= 300, `monitor sized ${JSON.stringify(canvas)}`);

    // Freeze to step deterministically; S1 600 × 8 + S2 370 from HRA induces AVNRT.
    await page.locator('[data-ep-live-run]').click();
    await page.locator('[data-ep-live-case]').selectOption('avnrt-typical');
    await page.locator('[data-ep-live-stim=s1]').fill('600');
    await page.locator('[data-ep-live-stim=s2]').fill('370');
    await page.locator('[data-ep-live-action=pace]').click();   // resumes the sweep
    await page.locator('[data-ep-live-run]').click();           // freeze again, step by hand
    await page.evaluate(() => { window.cardiaEp.live.advance(9000); });
    const iv = await page.evaluate(() => window.cardiaEp.live.intervals());
    assert.ok(iv.rr > 330 && iv.rr < 370 && iv.va <= 40, `AVNRT induced: ${JSON.stringify(iv)}`);
    assert.match(await page.locator('[data-ep-live-intervals]').textContent(), /VA 3\d ms/);

    // Frozen: review slider active; two clicks place vertical calipers.
    assert.equal(await page.locator('[data-ep-live-review]').isDisabled(), false, 'review enabled when frozen');
    await page.locator('[data-ep-live-caliper]').click();
    const box = await page.locator('.ep-live-canvas').boundingBox();
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.6);
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
    const cal = await page.evaluate(() => window.cardiaEp.live.getState().caliper);
    assert.ok(cal.a != null && cal.b != null && cal.b > cal.a, `caliper placed ${JSON.stringify(cal)}`);
    assert.match(await page.locator('.ep-live-info').textContent(), /Kaliper: \d+ ms/);

    // Cardioversion: sinus rhythm returns.
    await page.locator('[data-ep-live-action=shock]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(6000); });
    assert.equal((await page.evaluate(() => window.cardiaEp.live.intervals())).rr, 800, 'sinus after cardioversion');

    // Back to a lesson section.
    await page.locator('[data-ep-section=diagnosis]').click();
    assert.equal(await page.locator('.ep-lesson').isVisible(), true);
    assert.equal(await page.locator('[data-ep-live]').isHidden(), true);
    assert.deepEqual(errors, []);
    console.log('PASS ep-live-browser: live tab, sweeping monitor, S2-induced AVNRT, freeze + review + calipers, cardioversion, back to lessons');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
