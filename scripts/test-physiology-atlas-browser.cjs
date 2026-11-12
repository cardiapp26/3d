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
    await page.goto(`${app.url}/angio/physiology/?lang=tr`, { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('[data-phys-atlas-canvas]');
    await page.waitForFunction(() => document.querySelector('[data-phys-atlas-canvas]')?.dataset.periAtlas === 'ready');
    const pixels = () => canvas.evaluate(c => c.toDataURL());
    const images = new Set();
    for (const vessel of ['LAD', 'LCX', 'RCA']) {
      await page.selectOption('[data-phys-vessel]', vessel);
      assert.equal(Number(await canvas.getAttribute('data-atlas-meshes')), vessel === 'RCA' ? 2 : 4, `${vessel}: all coronary source meshes`);
      images.add(await pixels());
      await canvas.screenshot({ path: `/tmp/physiology-atlas-${vessel}.png` });
    }
    assert.equal(images.size, 3, 'vessel systems and selected vessel distinguish images');
    const initial = await pixels();
    await page.locator('[data-phys-fluoro-proj="1"]').click();
    assert.notEqual(await pixels(), initial, 'projection changes atlas');
    const oblique = await pixels();
    await page.locator('[data-phys-atlas-anatomy]').click();
    assert.notEqual(await pixels(), oblique, 'anatomy material changes');
    const anatomy = await pixels();
    await canvas.hover(); await page.mouse.wheel(0, -300); await page.waitForTimeout(100);
    assert.notEqual(await pixels(), anatomy, 'atlas zoom works');
    await page.locator('[data-phys-sensor]').fill('35');
    assert.equal(await page.locator('[data-phys-fluoro-canvas]').getAttribute('aria-valuenow'), '35', 'sensor exercise preserved');
    assert.equal(await page.evaluate(() => window.coronaryPhysiology.getState().sensorMm), 35);
    await page.locator('[data-phys-lang="en"]').click();
    assert.match(await page.locator('.phys-atlas-stage').textContent(), /not measured on the atlas/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.coronaryPhysiology.destroy());
    console.log('PASS physiology atlas: LAD/LCX/RCA, source meshes, projection, anatomy, zoom, sensor state, language, mobile, disposal');
  } finally { await browser.close(); await app.close(); }
})().catch(e => { console.error(e); process.exit(1); });
