/**
 * Fluoroscopic anatomy contours in the browser: shown with fluoroscopy (on by
 * default), all ten structures outlined, different outlines in RAO and LAO
 * (the annuli face the viewer in LAO), the Contours button hides them, and
 * leaving fluoroscopy hides the overlay.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const state = () => page.evaluate(() => window.heart.getFluoroContours());
    assert.equal((await state()).visible, false, 'no contours without fluoroscopy');
    assert.equal(await page.locator('#fluoro-contours-toggle').isVisible(), false);

    await page.locator('#fluoro-toggle-dock').click();
    await page.locator('[data-view=rao]').first().click();
    await page.waitForTimeout(1200);
    const rao = await state();
    assert.equal(rao.visible, true);
    const ids = rao.contours.map((c) => c.id).sort();
    assert.deepEqual(ids, ['aorta', 'cs', 'la', 'lv', 'mitral-annulus', 'pa', 'ra', 'rv', 'svc', 'tricuspid-annulus'], 'all ten structures');
    assert.equal(await page.locator('#fluoro-contours-toggle').isVisible(), true);
    // In LAO the right-sided annulus (TA) is on the screen left of the mitral annulus (MA).
    await page.locator('[data-view=lao]').first().click();
    await page.waitForTimeout(1200);
    const lao = await state();
    const at = (s, id) => s.contours.find((c) => c.id === id).centroid;
    assert.ok(at(lao, 'tricuspid-annulus')[0] < at(lao, 'mitral-annulus')[0], 'LAO: TA left of MA on screen');
    assert.ok(Math.hypot(...at(lao, 'lv').map((v, i) => v - at(rao, 'lv')[i])) > 10, 'outlines follow the C-arm');

    await page.locator('#fluoro-contours-toggle').click();
    await page.waitForTimeout(300);
    assert.equal((await state()).visible, false, 'Contours button hides them');
    await page.locator('#fluoro-contours-toggle').click();
    await page.waitForTimeout(300);
    assert.equal((await state()).visible, true);
    await page.locator('#fluoro-toggle-dock').click();
    await page.waitForTimeout(300);
    assert.equal((await state()).visible, false, 'hidden when fluoroscopy is off');
    assert.equal(await page.locator('#fluoro-contours-toggle').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS fluoro-contours-browser: shown with fluoroscopy, ten structures, RAO vs LAO (TA left of MA in LAO), toggle, hidden without fluoroscopy');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
