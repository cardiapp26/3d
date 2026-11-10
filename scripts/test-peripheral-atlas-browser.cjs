const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const { startApp } = require('./lib/app-server.cjs');

(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && /THREE|Shader|WebGL/i.test(m.text())) errors.push(m.text()); });
    await page.goto(`${app.url}/angio/peripheral/?lang=tr`, { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('[data-peri-fluo-canvas]');
    await page.waitForFunction(() => document.querySelector('[data-peri-fluo-canvas]')?.dataset.periAtlas === 'ready');
    const pixels = () => canvas.evaluate(c => c.toDataURL());
    const regionImages = new Set();
    for (const region of ['aortoiliac', 'femoral', 'runoff', 'visceral', 'arm']) {
      await page.locator(`[data-peri-tab="${region}"]`).click();
      assert.equal(await canvas.getAttribute('data-image-source'), 'atlas');
      assert.ok(Number(await canvas.getAttribute('data-atlas-meshes')) > 5, `${region} loads multiple source meshes`);
      regionImages.add(await pixels());
      await canvas.screenshot({ path: `/tmp/peripheral-atlas-${region}.png` });
    }
    assert.equal(regionImages.size, 5, 'five distinct atlas regions rendered');
    await page.locator('[data-peri-tab="aortoiliac"]').click();
    const ap = await pixels();
    await page.locator('[data-peri-inject]').click();
    await page.waitForTimeout(100);
    const earlyBolus = await pixels();
    await page.waitForTimeout(650);
    assert.notEqual(await pixels(), earlyBolus, 'contrast front advances on actual atlas geometry');
    await page.waitForTimeout(2000);
    await page.locator('[data-peri-preset="ai-right-obl"]').click();
    assert.notEqual(await pixels(), ap, 'C-arm changes atlas projection');
    await page.locator('[data-peri-nudge="ap"]').click();
    await page.locator('[data-peri-atlas-anatomy]').click();
    const anatomy = await pixels();
    assert.notEqual(anatomy, ap, 'anatomy uses same meshes with anatomical material');
    await canvas.screenshot({ path: '/tmp/peripheral-atlas-anatomy.png' });
    await canvas.hover();
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(100);
    assert.notEqual(await pixels(), anatomy, 'wheel zoom changes the atlas view');
    await page.locator('[data-peri-atlas-anatomy]').click();
    await page.selectOption('[data-peri-lesion-select]', 'right-cia-ostial');
    assert.equal(await canvas.getAttribute('data-image-source'), 'simulation', 'case switches to explicit procedural simulation');
    assert.match(await page.locator('[data-peri-image-source]').textContent(), /şematik/);
    await page.selectOption('[data-peri-lesion-select]', 'none');
    assert.equal(await canvas.getAttribute('data-image-source'), 'atlas', 'clearing case restores atlas');
    await page.locator('[data-peri-lang="en"]').click();
    assert.match(await page.locator('[data-peri-image-source]').textContent(), /Cardia atlas meshes/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, 'no mobile overflow');
    assert.ok(await canvas.isVisible());
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.peripheralAngio.dispose());
    console.log('PASS peripheral atlas: five source-mesh regions, angle, anatomy, zoom, procedural handoff, language, mobile, disposal');
  } finally { await browser.close(); await app.close(); }
})().catch(error => { console.error(error); process.exit(1); });
