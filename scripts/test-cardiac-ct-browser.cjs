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

    // 1. Open Cardiac CT Studio (/ct/)
    await page.goto(`${BASE_URL}/ct/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.ct-shell');

    // Verify top-level site header highlights Cardiac CT as active main module
    const activeModuleText = await page.locator('.site-module[aria-current="page"]').textContent();
    assert.match(activeModuleText || '', /Kardiyak BT|Cardiac CT/);

    // 1b. Real chest CT (TotalSegmentator case) opens first: three MPR panes, HU probe on the
    // LV blood pool, quick views move the cursor, wheel changes the slice, no overflow on a phone.
    await page.waitForFunction(() => window.cardiacCt.getRealViewer?.()?.getState().loaded, null, { timeout: 30000 });
    assert.equal(await page.locator('[data-ctv-canvas]').count(), 3, 'real CT: axial, coronal, sagittal');
    const lvProbe = await page.evaluate(() => window.cardiacCt.getRealViewer().probe());
    assert.equal(lvProbe.label, 'lv');
    assert.ok(lvProbe.hu > 250, `real CT: contrast LV blood pool (${lvProbe.hu} HU)`);
    await page.click('[data-ctv-view="root"]');
    assert.equal((await page.evaluate(() => window.cardiacCt.getRealViewer().probe())).label, 'aorta', 'aortic root view');
    const axialReal = page.locator('[data-ctv-canvas="axial"]');
    const zBefore = (await page.evaluate(() => window.cardiacCt.getRealViewer().probe())).cursor.z;
    await axialReal.hover();
    await page.mouse.wheel(0, 120);
    const zAfter = (await page.evaluate(() => window.cardiacCt.getRealViewer().probe())).cursor.z;
    assert.equal(zAfter, zBefore + 1, 'wheel moves one axial slice');
    const realBox = await axialReal.boundingBox();
    assert.ok(Math.abs(realBox.width / realBox.height - 221 / 211) < 0.02, 'real axial keeps its aspect');
    await page.click('[data-ct-mode="realct"]');
    assert.equal(await page.locator('[data-ctv-canvas]').count(), 3, 'real viewer survives a panel re-render');
    await page.click('[data-ct-mode="workstation"]');
    await page.waitForSelector('[data-ct-tri-vrt]');

    // 2. Verify 3-Panel Clinical Reconstruction Output (3D VRT, 3D MIP, Coronal MPR + Segmentation) & Workstation canvases
    const vrtBox = await page.locator('[data-ct-tri-vrt]').boundingBox();
    const mipBox = await page.locator('[data-ct-tri-mip]').boundingBox();
    const mprBox = await page.locator('[data-ct-tri-mpr]').boundingBox();
    assert.ok(vrtBox && vrtBox.width > 220 && vrtBox.height > 240, '3D VRT panel canvas must render');
    assert.ok(mipBox && mipBox.width > 220 && mipBox.height > 240, '3D MIP panel canvas must render');
    assert.ok(mprBox && mprBox.width > 220 && mprBox.height > 240, 'Coronal MPR + Segmentation panel canvas must render');

    // Verify 14-structure anatomical segmentation chips and interactive selection
    assert.equal(await page.locator('[data-ct-seg-select]').count(), 14, 'Must render 14 anatomical segmentation structure chips');
    await page.click('[data-ct-seg-select="lad"]');
    await page.waitForTimeout(60);
    assert.equal(await page.evaluate(() => window.cardiacCt.getState().selectedSegKey), 'lad');
    const activeSegReadout = await page.locator('[data-ct-seg-active-readout]').textContent();
    assert.match(activeSegReadout || '', /LAD/);

    // Test 3D Color Segmentation Map toggle, Chamber Subtraction toggle, and FOV switch
    await page.click('[data-ct-seg-color-toggle]');
    await page.click('[data-ct-chambers-sub-toggle]');
    await page.click('[data-ct-fov="aorto-cervical"]');
    await page.waitForTimeout(80);
    const triState = await page.evaluate(() => window.cardiacCt.getState());
    assert.equal(triState.segColorMode, true);
    assert.equal(triState.chambersSubtracted, true);
    assert.equal(triState.fovMode, 'aorto-cervical');

    const axialBox = await page.locator('[data-ct-axial-canvas]').boundingBox();
    const cprBox = await page.locator('[data-ct-cpr-canvas]').boundingBox();
    const scoutBox = await page.locator('[data-ct-scout-wrap] svg').boundingBox();
    assert.ok(axialBox && axialBox.width > 240 && axialBox.height > 240, 'Axial CT canvas must render');
    assert.ok(cprBox && cprBox.width > 240 && cprBox.height > 180, 'CPR + CT-FFR canvas must render');
    assert.ok(scoutBox && scoutBox.width > 120, 'Sagittal scout SVG must render');

    // Canvases keep their logical aspect ratio (no CSS stretching)
    const axialDims = await page.$eval('[data-ct-axial-canvas]', (el) => ({ w: el.clientWidth, h: el.clientHeight }));
    assert.ok(Math.abs(axialDims.w - axialDims.h) <= 2, `Axial canvas must render square, got ${axialDims.w}x${axialDims.h}`);
    const triDims = await page.$eval('[data-ct-tri-vrt]', (el) => ({ w: el.clientWidth, h: el.clientHeight }));
    assert.ok(Math.abs(triDims.h / triDims.w - 390 / 380) < 0.02, `Tri-panel canvas must keep 380x390 aspect, got ${triDims.w}x${triDims.h}`);

    // Dragging the z slider ('input') repaints without rebuilding the DOM; 'change' commits
    const zNodeKept = await page.evaluate(() => {
      const before = document.querySelector('[data-ct-z-slider]');
      before.value = '30';
      before.dispatchEvent(new Event('input', { bubbles: true }));
      const after = document.querySelector('[data-ct-z-slider]');
      return {
        same: before === after,
        z: window.cardiacCt.getState().zMm,
        readout: document.querySelector('[data-ct-z-readout]').textContent
      };
    });
    assert.equal(zNodeKept.same, true, "'input' on the z slider must keep the same slider DOM node");
    assert.equal(zNodeKept.z, 30);
    assert.match(zNodeKept.readout, /z = 30 mm/);
    await page.evaluate(() => {
      const slider = document.querySelector('[data-ct-z-slider]');
      slider.value = '48';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.equal(await page.evaluate(() => window.cardiacCt.getState().zMm), 48);

    // 3. Test interactive ROI HU probe click on axial CT slice
    await page.click('[data-ct-axial-canvas]', { position: { x: 180, y: 180 } });
    await page.waitForTimeout(80);
    const roiText = await page.locator('[data-ct-roi-bar]').textContent();
    assert.match(roiText || '', /[+-]?\d+ HU/, 'Clicking axial slice must display active ROI HU measurement');
    assert.equal(typeof (await page.evaluate(() => window.cardiacCt.getState().roiProbe?.regionKey)), 'string', 'ROI probe stores a region key');

    // Clicking lung parenchyma reports lung HU, not soft tissue
    const axialBoxNow = await page.locator('[data-ct-axial-canvas]').boundingBox();
    const toPx = (lx, ly) => ({ x: (lx / 440) * axialBoxNow.width, y: (ly / 440) * axialBoxNow.height });
    await page.click('[data-ct-axial-canvas]', { position: toPx(110, 200) });
    await page.waitForTimeout(60);
    const lungText = await page.locator('[data-ct-roi-bar]').textContent();
    const lungHu = Number((lungText.match(/([+-]?\d+) HU/) || [])[1]);
    assert.ok(lungHu <= -800 && lungHu > -950, `Lung ROI must read about -850 HU, got ${lungText}`);
    assert.match(lungText, /Akciğer|Lung/, 'Lung ROI must be named as lung');

    // 4. Test selecting clinical case CT-2 (Proximal LAD HRP) and CT-3 (Calcified Multivessel)
    await page.click('[data-ct-case="lad-hrp-napkin"]');
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(() => window.cardiacCt.getState().caseId), 'lad-hrp-napkin');

    await page.click('[data-ct-case="multivessel-cac"]');
    await page.waitForTimeout(80);
    await page.click('[data-ct-window="calcium-sharp"]');
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(() => window.cardiacCt.getState().windowPresetId), 'calcium-sharp');

    // Test Z-level quick jump and R-R phase buttons
    await page.click('[data-ct-level-z="78"]');
    await page.click('[data-ct-rr="40"]');
    await page.click('[data-ct-delayed-toggle]');
    await page.waitForTimeout(80);
    const st = await page.evaluate(() => window.cardiacCt.getState());
    assert.equal(st.zMm, 78);
    assert.equal(st.rrPhasePct, 40);
    assert.equal(st.delayedPhase60s, true);

    // 5. Switch to CAD-RADS 2.0 & High-Risk Plaque mode
    await page.click('[data-ct-mode="coronary"]');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.ct-hrp-item').count(), 4, 'Must render 4 SCCT HRP feature cards');
    assert.equal(await page.locator('.ct-table tbody tr').count(), 7, 'Must render 7 CAD-RADS 2.0 rows');

    // 6. Switch to Structural Heart (TAVI & LAA) mode
    await page.click('[data-ct-mode="structural"]');
    await page.waitForTimeout(100);
    const taviBox = await page.locator('[data-ct-tavi-canvas]').boundingBox();
    assert.ok(taviBox && taviBox.width > 240 && taviBox.height > 180, 'TAVI planimetry & S-curve canvas must render');
    await page.click('[data-ct-tavi-proj="cuspOverlapView"]');
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(() => window.cardiacCt.getState().taviProjectionKey), 'cuspOverlapView');

    // 7. Switch to Artifacts, Physics & Calculators mode
    await page.click('[data-ct-mode="calculators"]');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-ct-artifact-card]').count(), 5, 'Must render 5 CT artifact cards');
    assert.equal(await page.locator('[data-ct-calc-card]').count(), 5, 'Must render 5 CT calculator cards');
    await page.click('[data-ct-artifact-fix="blooming"]');
    await page.waitForTimeout(80);
    assert.equal(await page.getAttribute('[data-ct-artifact-fix="blooming"]', 'aria-pressed'), 'true');

    // 8. Language toggle TR -> EN -> TR
    await page.click('[data-ct-lang="en"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Cardiac CT Studio/);
    await page.click('[data-ct-lang="tr"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Kardiyak BT Stüdyosu/);

    // 9. Responsive layout checks (1440px, 768px, 390px)
    await page.click('[data-ct-mode="workstation"]');
    await assertNoHorizontalOverflow(page, 1440, 920);
    await assertNoHorizontalOverflow(page, 768, 1024);
    await assertNoHorizontalOverflow(page, 390, 844);

    assert.equal(await page.locator('[data-ct-paint-error]').count(), 0, 'No canvas may report a paint error');
    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);

    console.log('Cardiac CT Studio browser verification passed.');
  } finally {
    await browser.close();
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
