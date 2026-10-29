const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
);
const assert = require('node:assert/strict');
const { startApp } = require('./lib/app-server.cjs');

async function assertNoHorizontalOverflow(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(160);
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert.ok(
    metrics.docScrollWidth <= metrics.innerWidth + 1,
    `Document overflow at ${width}px: ${metrics.docScrollWidth} > ${metrics.innerWidth}`
  );
  assert.ok(
    metrics.bodyScrollWidth <= metrics.innerWidth + 1,
    `Body overflow at ${width}px: ${metrics.bodyScrollWidth} > ${metrics.innerWidth}`
  );
}

async function main() {
  const app = await startApp();
  const BASE_URL = app.url;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Verify C-arm Studio CTA link to ./physiology/
    await page.goto(`${BASE_URL}/angio/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-angio-physiology-link]');
    const ctaHref = await page.getAttribute('[data-angio-physiology-link]', 'href');
    assert.equal(ctaHref, './physiology/');

    // 2. Open Coronary Physiology Lab
    await page.goto(`${BASE_URL}/angio/physiology/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.phys-lab');

    const subpageCurrent = await page
      .locator('.site-subpage[aria-current="page"]')
      .textContent();
    assert.match(subpageCurrent || '', /Koroner fizyoloji|Coronary physiology/);

    // Verify canvases render non-zero dimensions
    const consoleBox = await page.locator('[data-phys-pressure-canvas]').boundingBox();
    const detailBox = await page.locator('[data-phys-detail-canvas]').boundingBox();
    assert.ok(consoleBox && consoleBox.width > 240 && consoleBox.height > 120, 'Pressure console canvas must render');
    assert.ok(detailBox && detailBox.width > 240 && detailBox.height > 120, 'Modality detail canvas must render');

    // 2b. Angiographic view: tapping on the measured vessel moves the sensor (readout follows),
    // the arrow keys step it, and the image type and C-arm projection switch.
    const fluoro = page.locator('[data-phys-fluoro-canvas]');
    const fluoroBox = await fluoro.boundingBox();
    assert.ok(fluoroBox && fluoroBox.width > 300 && fluoroBox.height > 250, 'Angiographic canvas must render');
    const target = await fluoro.evaluate((el) => el._physHit.path.find((q) => q.mm >= 20));
    await page.mouse.click(fluoroBox.x + target.x, fluoroBox.y + target.y);
    await page.waitForTimeout(120);
    const tappedMm = Number((await page.locator('[data-ro-sensor]').textContent()).replace(/[^0-9]/g, ''));
    assert.ok(Math.abs(tappedMm - target.mm) <= 2, `Tap on the angiogram moves the sensor (${tappedMm} vs ${target.mm})`);
    assert.equal(Number(await fluoro.getAttribute('aria-valuenow')), tappedMm, 'Angiogram slider value follows the sensor');
    await fluoro.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(80);
    assert.equal(Number(await fluoro.getAttribute('aria-valuenow')), tappedMm + 2, 'Arrow key steps the sensor');
    await page.click('[data-phys-fluoro-view="map"]');
    await page.click('[data-phys-fluoro-proj="1"]');
    await page.waitForTimeout(120);
    assert.equal(await page.getAttribute('[data-phys-fluoro-view="map"]', 'aria-pressed'), 'true', 'Pd/Pa map view selected');
    assert.equal(await page.getAttribute('[data-phys-fluoro-proj="1"]', 'aria-pressed'), 'true', 'Second projection selected');
    await page.click('[data-phys-fluoro-view="cine"]');
    await page.click('[data-phys-fluoro-proj="0"]');
    // Back to the default sensor position for the pullback checks below.
    await page.locator('[data-phys-sensor]').evaluate((el) => { el.value = '75'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(80);

    // 3. Test Epicardial FFR / Pullback / Virtual PCI & Underexpanded Stent TSG
    const initialFfr = await page.locator('[data-pb-ffr]').textContent();
    assert.ok(Number(initialFfr) <= 0.8, `Expected ischemic FFR on initial focal LAD case, got ${initialFfr}`);

    await page.check('[data-phys-stent="mid-lad"]');
    await page.waitForTimeout(80);
    const stentedFfr = await page.locator('[data-pb-ffr]').textContent();
    assert.ok(Number(stentedFfr) > Number(initialFfr), `Virtual PCI must improve FFR (${initialFfr} -> ${stentedFfr})`);

    await page.check('[data-phys-underexpanded]');
    await page.waitForTimeout(80);
    const underexpandedTsg = await page.locator('[data-pb-tsg]').textContent();
    assert.ok(Number(underexpandedTsg) >= 0.04, `Underexpanded stent must create TSG >= 0.04, got ${underexpandedTsg}`);

    // Switch to diffuse LAD case and check PPG < 0.62
    await page.selectOption('[data-phys-case]', 'diffuse-lad');
    await page.waitForTimeout(80);
    const diffusePpg = await page.locator('[data-pb-ppg]').textContent();
    assert.ok(Number(diffusePpg) < 0.62, `Diffuse LAD case must show PPG < 0.62, got ${diffusePpg}`);

    // 4. Switch to Bolus Thermodilution modality
    await page.click('[data-phys-modality="bolus"]');
    await page.waitForTimeout(80);
    await page.selectOption('[data-phys-case]', 'structural-cmd');
    await page.waitForTimeout(80);
    await page.click('[data-phys-action="inject-bolus"]');
    await page.waitForTimeout(80);
    const bolusText = await page.locator('.phys-lab').textContent();
    assert.match(bolusText || '', /IMR/);
    assert.match(bolusText || '', /CFR/);

    // 5. Switch to Continuous Thermodilution modality
    await page.click('[data-phys-modality="continuous"]');
    await page.waitForTimeout(80);
    await page.click('[data-phys-action="sensor-tip"]');
    await page.waitForTimeout(80);
    const contText = await page.locator('.phys-lab').textContent();
    assert.match(contText || '', /1\.08/);
    assert.match(contText || '', /Rμ/);

    // 6. Switch to Doppler & Acetylcholine Provocation modality
    await page.click('[data-phys-modality="doppler"]');
    await page.waitForTimeout(80);
    await page.selectOption('[data-phys-case]', 'doppler-epispasm');
    await page.waitForTimeout(80);
    await page.click('[data-phys-ach="3"]');
    await page.waitForTimeout(80);
    const dopplerHighText = await page.locator('.phys-lab').textContent();
    assert.match(dopplerHighText || '', /-92%|≥90%|≥%90/);
    await page.click('[data-phys-action="reverse-spasm"]');
    await page.waitForTimeout(80);

    // 7. Switch to Hemodynamic Simulator workspace mode
    await page.click('[data-phys-mode="simulator"]');
    await page.waitForTimeout(100);
    const simCanvasBox = await page.locator('[data-sim-canvas]').boundingBox();
    assert.ok(simCanvasBox && simCanvasBox.width > 240, 'Simulator canvas must render');

    // 8. Switch to Pitfalls & Artifacts workspace mode and test quiz
    await page.click('[data-phys-mode="pitfalls"]');
    await page.waitForTimeout(100);
    const artCanvasBox = await page.locator('[data-spot-canvas]').boundingBox();
    assert.ok(artCanvasBox && artCanvasBox.width > 240, 'Artifact preview canvas must render');
    await page.click('[data-spot-ans="drift"]');
    await page.waitForTimeout(60);

    // 9. Switch to Formulas & Calculator workspace mode
    await page.click('[data-phys-mode="calculator"]');
    await page.waitForTimeout(100);
    const calcCount = await page.locator('[data-calc-results]').count();
    assert.equal(calcCount, 5, 'All 5 calculator cards must render');

    // 10. Language toggle TR -> EN -> TR
    await page.click('[data-phys-lang="en"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Coronary Physiology Lab/);
    await page.click('[data-phys-lang="tr"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Koroner Fizyoloji Laboratuvarı/);

    // 11. Responsive layout checks (390px, 768px, 1440px) in Lab mode
    await page.click('[data-phys-mode="lab"]');
    await page.click('[data-phys-modality="epicardial"]');
    await assertNoHorizontalOverflow(page, 1440, 920);
    await assertNoHorizontalOverflow(page, 768, 1024);
    await assertNoHorizontalOverflow(page, 390, 844);

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);

    console.log('Coronary Physiology Lab browser verification passed.');
  } finally {
    await browser.close();
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
