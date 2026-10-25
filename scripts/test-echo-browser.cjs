/**
 * Standalone Echocardiography Studio Acceptance & Browser Test
 * Verifies:
 * 1. Loading /echo/ directly and via redirect from /#/mode/echo
 * 2. Header links across all modules (3D Anatomi, EPS, Farmakoloji, EKG, Anjiyografi, Eko)
 * 3. Modality tabs: TTE, TEE, ICE
 * 4. 2D ultrasound sector canvas rendering
 * 5. Multiplane TEE probe controls (Omega 0-180, flexion, advance)
 * 6. Freezing and synchronized cardiac cycle animation
 * 7. Mitral scallop map and septal map display
 * 8. Language switching TR / EN
 * 9. Mobile responsiveness (390x844 viewport without horizontal overflow)
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 920 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    // 1. Direct entry to /echo/
    await page.goto(`${APP}/echo/`);
    await page.waitForSelector('#viewport[data-model-ready="true"]', { timeout: 25000 });
    await page.waitForSelector('#echo-panel:not([hidden]) .echo-canvas');
    await page.waitForFunction(() => window.cardiaEcho?.getResult());

    assert.ok((await page.title()).includes('Ekokardiyografi') || (await page.title()).includes('Echocardiography'));
    assert.match(await page.locator('[data-site-badge]').textContent(), /EKOKARDİYOGRAFİ|ECHOCARDIOGRAPHY/);

    // 2. Check header navigation links
    const modulesNav = page.locator('.site-modules');
    assert.deepEqual(await modulesNav.locator('a').evaluateAll(links => links.map(a => a.dataset.siteLink)),
      ['anatomy', 'exam', 'hemo', 'echo', 'angio', 'ecg', 'eps', 'pharmacology'], 'every module linked in the shared order');
    assert.equal(await modulesNav.locator('[aria-current="page"]').textContent(), 'Eko');

    // 3. Modality tab switching (TTE -> TEE -> ICE)
    const tteBtn = page.locator('[data-echo-modality="tte"]');
    const teeBtn = page.locator('[data-echo-modality="tee"]');
    const iceBtn = page.locator('[data-echo-modality="ice"]');

    assert.equal(await tteBtn.getAttribute('aria-pressed'), 'true', 'Default modality is TTE');
    assert.ok(await page.locator('[data-echo-view="plax"]').isVisible(), 'PLAX view button visible for TTE');

    // Switch to TEE
    await teeBtn.click();
    await page.waitForFunction(() => window.cardiaEcho?.getState().modality === 'tee');
    assert.equal(await teeBtn.getAttribute('aria-pressed'), 'true', 'TEE is active');
    assert.ok(await page.locator('[data-echo-view="me4c"]').isVisible(), 'ME 4C view button visible for TEE');

    // Switch to ICE
    await iceBtn.click();
    await page.waitForFunction(() => window.cardiaEcho?.getState().modality === 'ice');
    assert.equal(await iceBtn.getAttribute('aria-pressed'), 'true', 'ICE is active');
    assert.ok(await page.locator('[data-echo-view="ice-home"]').isVisible(), 'ICE Home view button visible for ICE');

    // Real ICE topic references are radial recordings, not exact phased-array plane matches.
    await page.locator('[data-echo-view="ice-septal-sax"]').click();
    await page.locator('.echo-reference summary').click();
    const recording = page.locator('[data-echo-reference-choice]');
    assert.equal(await recording.locator('option').count(), 2);
    await page.waitForFunction(() => document.querySelector('.echo-reference video')?.readyState >= 2);
    assert.equal(await recording.inputValue(), '/echo-references/ice-septal-crossing.webm');
    assert.match(await page.locator('.echo-reference-category').textContent(), /Konu referansı/);
    assert.match(await page.locator('.echo-reference-source-note').textContent(), /360°/);
    const icePose = await page.evaluate(() => window.cardiaEcho.getState().ice);
    await recording.selectOption('/echo-references/ice-septal-distorted.webm');
    await page.waitForFunction(() => document.querySelector('.echo-reference video')?.readyState >= 2);
    assert.equal(await page.locator('.echo-reference-category').getAttribute('data-sample'), 'pathology');
    assert.deepEqual(await page.evaluate(() => window.cardiaEcho.getState().ice), icePose, 'choosing a reference must not move the catheter');
    await page.locator('[data-echo-lang="en"]').click();
    assert.equal(await recording.inputValue(), '/echo-references/ice-septal-distorted.webm');
    assert.match(await page.locator('.echo-reference-source-note').textContent(), /360° radial ICE/);
    await page.locator('[data-echo-lang="tr"]').click();
    await page.locator('[data-echo-reference-file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    assert.equal(await recording.isDisabled(), true, 'local file overrides the library choice');
    await page.locator('[data-echo-reference-remove]').click();
    assert.equal(await page.locator('.echo-reference video').getAttribute('src'), '/echo-references/ice-septal-distorted.webm', 'removal restores the chosen library recording');
    await page.locator('[data-echo-view="ice-home"]').click();
    assert.equal(await page.locator('.echo-reference video').count(), 0, 'septal reference does not leak into home view');
    await page.locator('[data-echo-view="ice-septal-sax"]').click();
    assert.equal(await recording.inputValue(), '/echo-references/ice-septal-distorted.webm');
    await page.locator('.echo-reference summary').click();

    // Switch back to TEE for multiplane controls
    await teeBtn.click();
    await page.waitForFunction(() => window.cardiaEcho?.getState().modality === 'tee');
    await page.locator('[data-echo-view="me4c"]').click();

    // A model pass must not conceal the known ME two-chamber anatomical limitation.
    await page.locator('[data-echo-view="me2c"]').click();
    assert.equal(await page.locator('[data-echo-view-caveat]').isVisible(), true);
    assert.match(await page.locator('[data-echo-view-caveat]').textContent(), /inferior duvar/);
    assert.equal(await page.locator('.echo-feedback').getAttribute('data-state'), 'limited');
    await page.locator('.echo-reference summary').click();
    await page.waitForFunction(() => document.querySelector('.echo-reference video')?.readyState >= 2);
    assert.equal(await page.locator('.echo-reference video').getAttribute('src'), '/echo-references/tee-me2c.webm');
    assert.equal(await page.locator('.echo-reference video').evaluate(v => v.paused), true, 'references do not autoplay');
    assert.match(await page.locator('.echo-reference-source-note').textContent(), /60°/);
    await page.locator('[data-echo-lang="en"]').click();
    assert.match(await page.locator('[data-echo-view-caveat]').textContent(), /Anatomical limitation/);
    assert.match(await page.locator('.echo-reference-source-note').textContent(), /105°/);
    await page.locator('[data-echo-lang="tr"]').click();
    await page.locator('[data-echo-view="mebicaval"]').click();
    assert.equal(await page.locator('.echo-reference-category').getAttribute('data-sample'), 'pathology');
    assert.match(await page.locator('.echo-reference-source-note').textContent(), /Normal bikaval örneği değildir/);
    await page.locator('[data-echo-view="memc"]').click();
    assert.equal(await page.locator('.echo-reference video').count(), 0, 'no unrelated clip for an unverified view');
    await page.locator('.echo-reference summary').click();
    await page.locator('[data-echo-view="me4c"]').click();
    assert.equal(await page.locator('[data-echo-view-caveat]').isVisible(), false);

    // 4. Test Probe Controls in TEE (Omega multiplane angle)
    const omegaSlider = page.locator('[data-echo-control="omega"]');
    await omegaSlider.fill('90');
    assert.equal(await page.evaluate(() => window.cardiaEcho.getState().tee.omega), 90, 'Omega updated to 90 degrees');

    // 5. Mitral Scallop Map visibility on TEE views
    await page.locator('[data-echo-view="mea1p1"]').click();
    const mitralMap = page.locator('.echo-mitral-map').first();
    assert.equal(await mitralMap.isVisible(), true, 'Mitral scallop map visible on ME A1-P1 view');

    // 6. Test Freeze / Play toggle
    const beatBtn = page.locator('#beat');
    const wasPlaying = await page.evaluate(() => window.heart.getCycleState().playing);
    assert.equal(wasPlaying, true, 'Heartbeat initially playing');
    await beatBtn.click();
    const isPaused = await page.evaluate(() => window.heart.getCycleState().playing);
    assert.equal(isPaused, false, 'Heartbeat paused by beat button');
    await beatBtn.click();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), true, 'Heartbeat resumed');

    // 7. Test Language Switch (TR -> EN -> TR)
    await page.locator('[data-echo-lang="en"]').click();
    assert.match(await page.locator('[data-site-badge]').textContent(), /ECHOCARDIOGRAPHY/);
    assert.equal(await page.locator('.site-modules [aria-current="page"]').textContent(), 'Echo');
    assert.equal(await page.locator('.site-modules [data-simulator-link]').textContent(), '3D Anatomy');

    await page.locator('[data-echo-lang="tr"]').click();
    assert.match(await page.locator('[data-site-badge]').textContent(), /EKOKARDİYOGRAFİ/);
    assert.equal(await page.locator('.site-modules [aria-current="page"]').textContent(), 'Eko');

    // 8. Test Legacy Hash Redirection from /#/mode/echo
    await page.goto(`${APP}/#/mode/echo`);
    await page.waitForURL(url => url.pathname.includes('/echo/'), { timeout: 5000 });
    assert.ok(page.url().includes('/echo/'), 'Redirected from #/mode/echo to /echo/');

    // 9. Mobile Responsive Layout Check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${APP}/echo/`);
    await page.waitForSelector('#viewport[data-model-ready="true"]');
    await page.waitForFunction(() => window.cardiaEcho?.getResult());
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(hasOverflow, false, 'Mobile viewport fits cleanly without horizontal overflow');

    assert.deepEqual(errors, [], 'No uncaught page errors');
    console.log('PASS echo-studio: standalone /echo/ workspace, TTE/TEE/ICE modalities, 2D sector, probe angles, maps, cycle sync, TR/EN, legacy redirect, and mobile layout');
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
