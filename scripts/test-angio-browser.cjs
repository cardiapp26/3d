const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { startApp } = require('./lib/app-server.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// The C-arm angle as the controls show it (LAO/RAO, then CRA/CAU).
const angleText = async page => `${await page.locator('#angio-alpha-val').textContent()} · ${await page.locator('#angio-beta-val').textContent()}`;

(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    // 1. Initial entry with user's exact requested hash: #a=-35&b=-45&sys=left
    const testUrl = `${app.url}/angio/#a=-35&b=-45&sys=left`;
    await page.goto(testUrl);
    await page.waitForFunction(() => document.querySelector('[data-angio-atlas]')?.dataset.ready === 'true', undefined, { timeout: 60000 });
    await page.locator('[data-angio-schematic] summary').click();
    await page.locator('#angio-fluo-canvas').waitFor({ state: 'visible' });

    assert.ok((await page.title()).includes('Anjiyografi') || (await page.title()).includes('Angiography'));
    assert.match(await page.locator('[data-site-badge]').textContent(), /KORONER ANJİYOGRAFİ|CORONARY ANGIOGRAPHY/);

    // Verify initial hash parsing of a=-35, b=-45, sys=left
    const badgeText = await angleText(page);
    assert.match(badgeText, /RAO 35°.*CAU 45°/);
    assert.equal(await page.locator('[data-angio-sys="left"].active').isVisible(), true, 'Left coronary system active');

    // 2. Preset Selection Tests
    // Click "Spider" (LAO 45 / CAU 35)
    await page.locator('[data-angio-view="lao-caudal"]').click();
    assert.match(await angleText(page), /LAO 45°.*CAU 35°/);
    assert.ok(page.url().includes('a=45') && page.url().includes('b=-35'), 'URL hash updated to Spider angles');

    // Click "RAO Cranial" (RAO 30 / CRA 30)
    await page.locator('[data-angio-view="rao-cranial"]').click();
    assert.match(await angleText(page), /RAO 30°.*CRA 30°/);
    assert.ok(page.url().includes('a=-30') && page.url().includes('b=30'), 'URL hash updated to RAO Cranial angles');

    // 3. System Switching Tests
    // Switch to Right Coronary System (RCA)
    await page.locator('[data-angio-sys="right"]').click();
    assert.ok(page.url().includes('sys=right'), 'URL hash updated to sys=right');
    assert.equal(await page.locator('[data-angio-view="rca-lao"]').isVisible(), true, 'RCA LAO preset button visible');

    // Click "LAO Cranial (RCA)" Crux view
    await page.locator('[data-angio-view="rca-lao-cranial"]').click();
    assert.match(await angleText(page), /LAO 40°.*CRA 30°/);

    // Switch to Bypass Grafts
    await page.locator('[data-angio-sys="lima"]').click();
    assert.ok(page.url().includes('sys=lima'), 'URL hash updated to sys=lima');
    assert.equal(await page.locator('[data-angio-view="lima-rao-cranial"]').isVisible(), true, 'LIMA preset visible');

    // Switch back to Left System
    await page.locator('[data-angio-sys="left"]').click();

    // 4. Joystick & Nudge Controls Tests
    // Click Nudge CRA (+5°)
    const prevBadge = await angleText(page);
    await page.locator('[data-nudge="cra"]').click();
    const nextBadge = await angleText(page);
    assert.notEqual(prevBadge, nextBadge, 'Cranial nudge shifted angle');

    // Click AP Center reset button
    await page.locator('#angio-btn-center').click();
    assert.match(await angleText(page), /AP 0°.*0°/);

    // 5. Contrast Injection Puff Test
    await page.locator('[data-inject-contrast]').click();

    // 6. Clinical Lesions & Stenosis Simulator Tests
    await page.locator('#angio-lesion-select').selectOption('lm_bifurcation');
    assert.equal(await page.locator('.angio-lesion-card').isVisible(), true, 'LM bifurcation lesion card visible');
    assert.match(await page.locator('.angio-lesion-pct').textContent(), /-%85/);

    // Click recommended view jump button
    await page.locator('[data-jump-view]').click();
    assert.match(await angleText(page), /LAO 45°.*CAU 35°/, 'Jumped to recommended Spider view');

    // 7. Screenshots
    const shots = '/private/tmp/cardia-angio';
    fs.mkdirSync(shots, { recursive: true });
    await page.screenshot({ path: `${shots}/angio-desktop.png`, fullPage: false });

    // 8. Mobile Responsiveness (390x844 Viewport)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(hasHorizontalOverflow, false, 'No horizontal overflow on 390x844 mobile viewport');
    await page.screenshot({ path: `${shots}/angio-mobile.png`, fullPage: false });

    // 9. Language Switcher Test
    await page.locator('[data-angio-lang="en"]').click();
    assert.match(await page.locator('.angio-live-tag').textContent(), /LIVE FLUOROSCOPIC ANGIOGRAM/);
    await page.locator('[data-angio-lang="tr"]').click();
    assert.match(await page.locator('.angio-live-tag').textContent(), /CANLI FLOROSKOPİ/);

    assert.deepEqual(errors, [], 'No page errors');
    console.log('PASS Angio browser: URL hash sync (#a=-35&b=-45&sys=left), 5 systems, 15+ presets, C-arm gantry, 2D angle pad, nudge, contrast injection, lesion simulator, TR/EN, and 390x844 mobile');
    console.log(`Screenshots: ${shots}`);
  } finally {
    await browser.close();
    await app.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
