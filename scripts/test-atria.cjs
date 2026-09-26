const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.APP_URL || 'http://127.0.0.1:5177') + '/#/mode/atria?structure=laa');
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    const visible = () => page.evaluate(() => window.heart.getState().structures.filter(s => s.visible).map(s => s.id).sort());
    assert.deepEqual(await visible(), ['la','laa']);
    assert.equal(await page.locator('#structure-select').inputValue(), 'laa');
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 2);
    for (const id of ['la','laa']) {
      await page.locator(`[data-atria-focus=${id}]`).click();
      assert.equal(await page.locator('#structure-select').inputValue(), id);
    }
    await page.locator('[data-atria-wall=la]').fill('50');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.la), .5);
    await page.evaluate(() => { window.heart.setLayer('vessels', true); window.heart.setFlowVisible(true); });
    assert.deepEqual(await visible(), ['la','laa']);
    await page.screenshot({ path: 'research/screenshots/atria.png' });

    // Test RA mode
    await page.locator('[data-mode=ra]').click();
    assert.deepEqual(await visible(), ['ra']);
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 1);
    assert.equal(await page.locator('#structure-select').inputValue(), 'ra');
    assert.equal(await page.locator('#ra-tools').isVisible(), true);
    assert.equal(await page.locator('#atria-tools').isVisible(), false);
    await page.locator('[data-ra-wall=ra]').fill('40');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.ra), .4);

    await page.locator('[data-mode=anatomy]').click();
    assert.ok((await visible()).includes('lv'));
    await page.evaluate(() => window.heart.setLayer('la', false));
    await page.locator('[data-mode=atria]').click();
    assert.deepEqual(await visible(), ['la','laa']);
    await page.locator('[data-mode=anatomy]').click();
    assert.ok(!(await visible()).includes('la'), 'original layer preference restored');
    await page.locator('[data-mode=atria]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.deepEqual(errors, []);
    console.log('PASS: atrial isolation (LA+LAA), separate RA mode, deep link, focus, wall cuts, mode restoration and mobile reset');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
