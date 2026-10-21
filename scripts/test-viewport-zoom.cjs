const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  let viteServer;
  let url = process.env.APP_URL;
  if (!url) {
    const { createServer } = await import('vite');
    viteServer = await createServer({
      server: { port: 5176, host: '127.0.0.1' },
      logLevel: 'error'
    });
    await viteServer.listen();
    url = 'http://127.0.0.1:5176';
  }

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    // 1. Mobile viewport test (iPhone 14 / modern phone size)
    console.log('Testing mobile viewport zoom and fullscreen controls...');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const mobileErrors = [];
    mobilePage.on('pageerror', e => mobileErrors.push(e.message));

    await mobilePage.goto(`${url}/#/mode/anatomy`);
    await mobilePage.waitForSelector('#viewport[data-model-ready=true]');

    // Check HUD controls visibility and geometry on mobile
    const hudVisible = await mobilePage.locator('.viewport-hud-controls').isVisible();
    assert.ok(hudVisible, 'viewport-hud-controls is visible on mobile');

    const zoomInBtn = mobilePage.locator('#viewport-zoom-in');
    const zoomOutBtn = mobilePage.locator('#viewport-zoom-out');
    const fsBtn = mobilePage.locator('#viewport-fullscreen');
    const resetBtn = mobilePage.locator('#viewport-reset');

    assert.ok(await zoomInBtn.isVisible(), 'mobile zoom-in button is visible');
    assert.ok(await zoomOutBtn.isVisible(), 'mobile zoom-out button is visible');
    assert.ok(await fsBtn.isVisible(), 'mobile fullscreen button is visible');
    assert.ok(await resetBtn.isVisible(), 'mobile reset button is visible');

    // One set of view controls: the scene HUD; the bottom dock has no copies.
    for (const id of ['#zoom-in', '#zoom-out', '#fullscreen-toggle', '#reset']) assert.equal(await mobilePage.locator(id).count(), 0, `no duplicate ${id} in the dock`);

    // Initial camera position & distance
    const initialZoom = await mobilePage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(initialZoom.distance > 8.0, `initial distance should be around fitDistance (got ${initialZoom.distance})`);

    // Zoom in multiple steps
    for (let i = 0; i < 15; i++) {
      await zoomInBtn.click();
      await mobilePage.waitForTimeout(40);
    }

    const closeZoom = await mobilePage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(closeZoom.distance < initialZoom.distance, `zoom in decreased distance (${closeZoom.distance} < ${initialZoom.distance})`);

    // Keep zooming until inside the heart chambers
    for (let i = 0; i < 25; i++) {
      await zoomInBtn.click();
      await mobilePage.waitForTimeout(40);
    }

    const insideZoom = await mobilePage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(insideZoom.insideHeart, 'camera navigated into / inside the cardiac structure');
    assert.ok(insideZoom.distance <= 1.0, `distance inside is close (${insideZoom.distance})`);

    // Test Zoom Out
    for (let i = 0; i < 15; i++) {
      await zoomOutBtn.click();
      await mobilePage.waitForTimeout(40);
    }
    const backedZoom = await mobilePage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(backedZoom.distance > insideZoom.distance, `zoom out increased distance (${backedZoom.distance} > ${insideZoom.distance})`);

    // Test Reset
    await resetBtn.click();
    await mobilePage.waitForSelector('#viewport[data-camera-settled="true"]', { timeout: 3000 });
    const resetZoom = await mobilePage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(Math.abs(resetZoom.distance - initialZoom.distance) < 0.1, `reset restored view distance (${resetZoom.distance} ≈ ${initialZoom.distance})`);

    // Test Fullscreen toggle on mobile
    const fsPressedBefore = await fsBtn.getAttribute('aria-pressed');
    assert.equal(fsPressedBefore, 'false');
    await fsBtn.click();
    await mobilePage.waitForTimeout(150);
    const fsPressedAfter = await fsBtn.getAttribute('aria-pressed');
    assert.equal(fsPressedAfter, 'true', 'fullscreen aria-pressed is true after click');

    // Exit fullscreen
    await fsBtn.click();
    await mobilePage.waitForTimeout(150);
    assert.equal(await fsBtn.getAttribute('aria-pressed'), 'false', 'fullscreen aria-pressed is false after exit click');

    assert.equal(mobileErrors.length, 0, `no page errors on mobile: ${mobileErrors.join('; ')}`);
    console.log('Mobile viewport tests passed successfully!');

    // 2. Desktop viewport test
    console.log('Testing desktop viewport zoom and dock buttons...');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const deskErrors = [];
    desktopPage.on('pageerror', e => deskErrors.push(e.message));

    await desktopPage.goto(`${url}/#/mode/anatomy`);
    await desktopPage.waitForSelector('#viewport[data-model-ready=true]');

    for (const id of ['#viewport-zoom-in', '#viewport-zoom-out', '#viewport-fullscreen', '#viewport-reset']) assert.ok(await desktopPage.locator(id).isVisible(), `HUD ${id} visible on desktop`);
    for (const id of ['#zoom-in', '#zoom-out', '#fullscreen-toggle', '#reset']) assert.equal(await desktopPage.locator(id).count(), 0, `no duplicate ${id} in the dock`);

    const deskInitZoom = await desktopPage.evaluate(() => window.heart.getZoomInfo());

    // Test keyboard shortcut '+' and '-'
    await desktopPage.keyboard.press('+');
    await desktopPage.waitForTimeout(50);
    await desktopPage.keyboard.press('+');
    await desktopPage.waitForTimeout(50);
    const keyZoom = await desktopPage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(keyZoom.distance < deskInitZoom.distance, `keyboard + zoomed in (${keyZoom.distance} < ${deskInitZoom.distance})`);

    await desktopPage.keyboard.press('-');
    await desktopPage.waitForTimeout(50);
    const keyZoomOut = await desktopPage.evaluate(() => window.heart.getZoomInfo());
    assert.ok(keyZoomOut.distance > keyZoom.distance, `keyboard - zoomed out (${keyZoomOut.distance} > ${keyZoom.distance})`);

    assert.equal(deskErrors.length, 0, `no page errors on desktop: ${deskErrors.join('; ')}`);
    console.log('Desktop viewport tests passed successfully!');
    console.log('ALL VIEWPORT ZOOM AND FULLSCREEN TESTS PASSED!');
  } finally {
    await browser.close();
    if (viteServer) await viteServer.close();
  }
})();
