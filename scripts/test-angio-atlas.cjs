const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5193'}/angio/?lang=tr#a=-35&b=-45&sys=left`);
    assert.equal(await page.locator('[data-atlas-viewport]').count(), 2, 'anatomy and fluoroscopy reuse atlas engine');
    await page.waitForFunction(() => document.querySelector('[data-angio-atlas]').dataset.ready === 'true', undefined, { timeout: 60000 });
    const state = () => page.evaluate(() => window.angioStudio.getAtlasState());
    let initial = await state();
    assert.ok(initial.anatomy.structures.filter(m => m.provenance === 'atlas').length >= 30);
    assert.equal(initial.fluoro.fluoroscopy, true);
    assert.equal(initial.anatomy.fluoroscopy, false);
    for (const view of [initial.anatomy, initial.fluoro]) {
      assert.equal(view.angio.laoRao, -35);
      assert.equal(view.angio.craCau, -45);
    }
    const viewport = await page.locator('[data-atlas-viewport=anatomy]').elementHandle();
    await page.locator('[data-toggle-cine]').click();
    const phase = (await state()).cycle.phase;
    await page.waitForTimeout(220);
    assert.equal((await state()).cycle.phase, phase, 'freeze stops shared cycle');
    await page.locator('[data-angio-view=rao-cranial]').click();
    for (const view of [(await state()).anatomy, (await state()).fluoro]) {
      assert.equal(view.angio.laoRao, -30); assert.equal(view.angio.craCau, 30);
    }
    assert.equal((await state()).device.alpha, -30);
    assert.equal((await state()).device.beta, 30);
    await page.locator('[data-atlas-layer=veins]').check();
    assert.equal((await state()).anatomy.veins, true);
    assert.equal((await state()).fluoro.veins, true);
    await page.locator('[data-angio-sys=right]').click();
    initial = await state();
    assert.equal(initial.anatomy.system, 'right'); assert.equal(initial.fluoro.system, 'right');
    await page.locator('[data-angio-lang=en]').click();
    assert.equal(await viewport.evaluate(el => el.isConnected), true, 'model survives language and system rerenders');
    await page.locator('[data-toggle-cine]').click();
    await page.waitForTimeout(220);
    assert.notEqual((await state()).cycle.phase, phase);
    initial = await state();
    assert.ok(Math.abs(initial.cycle.phase - initial.fluoroCycle.phase) < .04, 'both views share cardiac phase');
    await page.locator('[data-device-beam]').uncheck();
    assert.equal((await state()).device.beam, false);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `no overflow ${width}`);
    }
    await page.screenshot({ path: '/tmp/angio-atlas-after.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS angio atlas: shared original model, anatomy/fluoro, angles, device, shared cine, layers, persistent renderers, TR/EN, responsive layout');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
