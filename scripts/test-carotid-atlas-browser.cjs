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
    await page.goto(`${app.url}/angio/carotid/?lang=tr`, { waitUntil: 'domcontentloaded' });
    const detector = page.locator('[data-carotid-fluo]');
    await page.waitForFunction(() => document.querySelector('[data-carotid-fluo]')?.dataset.periAtlas === 'ready');
    const pixels = () => detector.evaluate(c => c.toDataURL());
    const images = new Set();
    for (const view of ['arch', 'cervical', 'ica', 'circle']) {
      await page.locator(`[data-view-tab="${view}"]`).click();
      assert.equal(await detector.getAttribute('data-image-source'), 'atlas');
      assert.ok(Number(await detector.getAttribute('data-atlas-meshes')) >= 7, `${view}: source meshes present`);
      images.add(await pixels());
      await detector.screenshot({ path: `/tmp/carotid-atlas-${view}.png` });
    }
    assert.equal(images.size, 4);
    const ap = await pixels();
    await page.locator('[data-fluo-alpha]').fill('40');
    assert.notEqual(await pixels(), ap, 'angle changes source geometry projection');
    const oblique = await pixels();
    await page.locator('[data-fluo-contrast]').fill('0');
    assert.notEqual(await pixels(), oblique, 'contrast hides vessels');
    await page.locator('[data-fluo-contrast]').fill('100');
    await page.locator('[data-carotid-atlas-anatomy]').click();
    const anatomy = await pixels();
    assert.notEqual(anatomy, oblique);
    await detector.hover(); await page.mouse.wheel(0, -300); await page.waitForTimeout(100);
    assert.notEqual(await pixels(), anatomy, 'zoom changes anatomy');
    await page.locator('[data-view-tab="arch"]').click();
    await page.locator('[data-arch-variant="lusoria"]').click();
    assert.equal(await detector.getAttribute('data-image-source'), 'simulation');
    await page.locator('[data-arch-variant="normal"]').click();
    assert.equal(await detector.getAttribute('data-image-source'), 'atlas');
    await page.locator('[data-view-tab="stenosis"]').click();
    assert.equal(await detector.getAttribute('data-image-source'), 'simulation');
    await page.locator('[data-view-tab="cervical"]').click();
    await page.locator('[data-carotid-lang="en"]').click();
    assert.match(await page.locator('[data-fluo-note]').textContent(), /Cardia atlas meshes/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.carotidAngio.dispose());
    console.log('PASS carotid atlas: four mesh regions, projection, contrast, anatomy, zoom, variant and stenosis handoff, TR/EN, mobile, disposal');
  } finally { await browser.close(); await app.close(); }
})().catch(e => { console.error(e); process.exit(1); });
