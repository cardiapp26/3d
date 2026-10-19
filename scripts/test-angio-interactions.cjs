const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5189'}/angio/?lang=tr`);
    await page.waitForFunction(() => document.querySelector('[data-angio-atlas]')?.dataset.ready === 'true', undefined, { timeout: 60000 });
    await page.locator('[data-toggle-cine]').click();
    await page.locator('[data-angio-schematic] summary').click();
    await page.locator('[data-toggle-cine]').click();
    const canvas = page.locator('#angio-fluo-canvas');
    await canvas.waitFor();
    const frame = () => canvas.evaluate(el => el.toDataURL());
    const before = await frame();
    await page.waitForTimeout(180);
    assert.notEqual(await frame(), before, 'cine changes rendered pixels');
    await page.locator('[data-toggle-cine]').click();
    const frozen = await frame();
    await page.waitForTimeout(180);
    assert.equal(await frame(), frozen, 'freeze holds rendered pixels');

    const regions = () => page.evaluate(() => window.angioStudio.getSchematicRegions());
    for (const system of ['left', 'right', 'lima', 'svg-om', 'svg-pda']) {
      await page.locator(`[data-angio-sys="${system}"]`).click();
      const presets = await page.locator('[data-angio-view]').count();
      for (let i = 0; i < presets; i++) {
        await page.locator('[data-angio-view]').nth(i).click();
        for (const region of await regions()) for (const pt of region.points) {
          assert.ok(Math.hypot(pt.x - 280, pt.y - 270) < 520 * .47, `${system} ${region.id} fits detector`);
        }
      }
    }
    await page.locator('[data-angio-sys="left"]').click();
    await page.locator('[data-angio-view="ap-cranial"]').click();
    assert.match(await page.locator('.angio-preset-name').textContent(), /AP Cranial/);
    assert.match(await page.locator('#angio-vessel-detail-card').textContent(), /AP Cranial/);
    await page.locator('[data-nudge="lao"]').click();
    assert.match(await page.locator('.angio-preset-name').textContent(), /Özel/);
    await page.locator('#angio-btn-center').click();
    await canvas.scrollIntoViewIfNeeded();
    const target = (await regions()).find(r => r.id === 'dLAD').midPoint;
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + target.x / 560 * box.width, box.y + target.y / 520 * box.height);
    assert.match(await page.locator('#angio-tele-target').textContent(), /^dLAD/);
    assert.match(await page.locator('#angio-vessel-detail-card').textContent(), /dLAD/);
    await page.locator('#angio-lesion-select').selectOption('lad_proximal');
    assert.equal(await page.locator('.angio-lesion-card').count(), 1);
    await page.locator('[data-jump-view]').click();
    assert.equal(await page.locator('#angio-alpha-slider').inputValue(), '-30');
    await page.locator('[data-angio-sys="right"]').click();
    assert.equal(await page.locator('#angio-lesion-select').inputValue(), 'none');
    assert.equal(await page.locator('.angio-lesion-card').count(), 0);
    for (const id of ['labels', 'spine', 'diaphragm', 'catheter', 'foreshorten']) {
      const prior = await frame();
      await page.locator(`#toggle-${id}`).click();
      assert.notEqual(await frame(), prior, `${id} toggle changes pixels`);
      await page.locator(`#toggle-${id}`).click();
    }
    const preInjection = await frame();
    await page.locator('[data-inject-contrast]').click();
    assert.equal(await page.locator('[data-inject-contrast]').getAttribute('aria-busy'), 'true');
    await page.waitForFunction(prior => document.querySelector('#angio-fluo-canvas').toDataURL() !== prior, preInjection, { timeout: 900 });
    await page.waitForFunction(() => document.querySelector('[data-inject-contrast]').getAttribute('aria-busy') === 'false');
    await page.locator('[data-angio-lang="en"]').click();
    assert.match(await page.locator('[data-toggle-cine]').textContent(), /Play Cine/);
    assert.match(await page.locator('.site-brand').textContent(), /CARDIA/);
    assert.equal(await page.locator('.site-modules [aria-current=page]').textContent(), 'Angiography');
    assert.equal(await page.locator('.site-modules [data-simulator-link]').textContent(), '3D Anatomy');
    assert.equal(await page.locator('[data-angio-sys="right"]').getAttribute('aria-selected'), 'true');
    await page.locator('[data-toggle-cine]').click();
    const gantry = await page.locator('[data-angio-device] canvas').elementHandle();
    await page.waitForTimeout(180);
    assert.equal(await gantry.evaluate(el => el.isConnected), true, 'cine preserves gantry DOM');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `no overflow at ${width}`);
      await page.locator('[data-toggle-cine]').click();
      await page.locator('[data-angio-sys=left]').click();
      await page.locator('#angio-btn-center').click();
      await canvas.scrollIntoViewIfNeeded();
      const mobileTarget = (await regions()).find(r => r.id === 'dLAD').midPoint;
      const mobileBox = await canvas.boundingBox();
      await page.mouse.click(mobileBox.x + mobileTarget.x / 560 * mobileBox.width, mobileBox.y + mobileTarget.y / 520 * mobileBox.height);
      assert.match(await page.locator('#angio-tele-target').textContent(), /^dLAD/, `scaled selection at ${width}`);
      await page.locator('[data-toggle-cine]').click();
      await page.locator('#angio-joy-pad').scrollIntoViewIfNeeded();
      const pad = await page.locator('#angio-joy-pad').boundingBox();
      await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
      await page.mouse.down();
      await page.mouse.move(pad.x + pad.width / 2 + 30, pad.y + pad.height / 2 - 25);
      await page.mouse.up();
      assert.ok(Number(await page.locator('#angio-alpha-slider').inputValue()) > 0, 'pad drives rotation');
      assert.ok(Number(await page.locator('#angio-beta-slider').inputValue()) > 0, 'pad drives angulation');
    }
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '/tmp/angio-after.png', fullPage: true });
    console.log('PASS angiography: cine/freeze pixels, all systems/presets in detector, scaled vessel selection, angle details, lesions, contrast, TR/EN, stable gantry DOM, joystick and responsive layout');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
