/**
 * Slow pathway mapping panel in the Koch step of the ablation lesson: the
 * schematic places the 3D ablation tip, the reading follows the site, the
 * RAO/LAO buttons show the close-ups under fluoroscopy, other steps hide it.
 * Usage: APP_URL=... node scripts/test-koch-sp-browser.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || null;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('#steps [data-step="1"]').click();
    const panel = page.locator('.ksp');
    assert.equal(await panel.isVisible(), true, 'mapping panel in the Koch step');
    assert.equal(await panel.getAttribute('data-zone'), 'target');

    const tip3d = () => page.evaluate(() => {
      const h = window.heart;
      const tip = h.scene.getObjectByName('Slow pathway catheter tip').position;
      return {
        site: h.getKochTip(),
        toTarget: tip.distanceTo(h.scene.getObjectByName('Slow pathway / septal isthmus (ablation target)').position),
        toAv: tip.distanceTo(h.scene.getObjectByName('Compact AV node (Koch apex)').position)
      };
    });
    const start = await tip3d();
    assert.ok(start.toTarget < 1e-6, 'default tip on the slow pathway target');

    // Click near the apex of the schematic: His zone, tip moves up toward the node.
    const clickSchematic = (x, y) => page.evaluate(([sx, sy]) => {
      const root = document.querySelector('.ksp-schematic');
      const p = new DOMPoint(sx, sy).matrixTransform(root.getScreenCTM());
      return { x: p.x, y: p.y };
    }, [x, y]).then(p => page.mouse.click(p.x, p.y));
    await clickSchematic(232, 72);
    assert.equal(await panel.getAttribute('data-zone'), 'his');
    assert.match(await page.locator('.ksp-advice').textContent(), /AV blok/);
    const high = await tip3d();
    assert.ok(high.site.u > 0.75, `site near the apex (${JSON.stringify(high.site)})`);
    assert.ok(high.toAv < start.toAv * 0.5, '3D tip moved toward the compact AV node');
    if (SHOTS) await panel.screenshot({ path: `${SHOTS}/koch-sp-his.png` });

    // Keyboard: down the triangle leaves the danger zone.
    await page.locator('.ksp-tip').focus();
    for (let i = 0; i < 22; i++) await page.keyboard.press('ArrowDown');
    const low = await tip3d();
    assert.ok(low.site.u < 0.15, 'arrow keys lower the tip');
    assert.ok(!['his', 'fast', 'mid'].includes(await panel.getAttribute('data-zone')));

    // Annulus side: too ventricular; back to target.
    for (let i = 0; i < 26; i++) await page.keyboard.press('ArrowRight');
    assert.equal(await panel.getAttribute('data-zone'), 'ventricular');
    assert.equal(await page.locator('#steps .current').getAttribute('data-step'), '1', 'arrow keys on the tip do not change the lesson step');
    await page.locator('[data-ksp-action=target]').click();
    assert.equal(await panel.getAttribute('data-zone'), 'target');
    assert.ok((await tip3d()).toTarget < 1e-6, 'go to target restores the target tip');

    // Functional layers (Sakamoto 2026): toggles draw on the schematic, a landmark moves the tip.
    assert.equal(await page.locator('.ksp-func > *').count(), 0, 'no layer by default');
    await page.locator('[data-ksp-layer=pf]').click();
    assert.equal(await page.locator('.ksp-heat-pf polygon').count(), 400);
    await page.locator('[data-ksp-layer=vectors]').click();
    assert.ok(await page.locator('.ksp-vec').count() > 30);
    await page.locator('[data-ksp-layer=landmarks]').click();
    assert.equal(await page.locator('.ksp-lm').count(), 5);
    await page.locator('[data-landmark=a]').click();
    assert.equal(await panel.getAttribute('data-zone'), 'his', 'landmark a (His) moves the tip to the His zone');
    assert.match(await page.locator('.ksp-func-point').textContent(), /His/);
    await page.locator('[data-landmark=c]').click();
    assert.equal(await panel.getAttribute('data-zone'), 'target');
    assert.match(await page.locator('.ksp-funcbox .ksp-facts').textContent(), /100 %/, 'PF and wave speed at the entrance');
    for (const id of ['pf', 'vectors', 'landmarks']) await page.locator(`[data-ksp-layer=${id}]`).click();
    assert.equal(await page.locator('.ksp-func > *').count(), 0, 'layers off again');

    // Fluoroscopy close-ups from the panel.
    await page.locator('[data-ksp-action=rao]').click();
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    const rao = await page.evaluate(() => ({ laoRao: window.heart.getState().angio.laoRao, fluoro: document.querySelector('main').classList.contains('fluoroscopy-active') }));
    assert.deepEqual(rao, { laoRao: -30, fluoro: true });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/koch-sp-rao.png` });
    await page.locator('[data-ksp-action=lao]').click();
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    assert.equal(await page.evaluate(() => window.heart.getState().angio.laoRao), 45);
    await page.locator('[data-ksp-action="3d"]').click();
    assert.equal(await page.evaluate(() => document.querySelector('main').classList.contains('fluoroscopy-active')), false);

    // Language and other steps.
    await page.locator('#lang-btn').click();
    assert.equal(await page.locator('.ksp-zone').textContent(), 'Suitable site');
    await page.locator('#steps [data-step="2"]').click();
    assert.equal(await panel.isVisible(), false, 'PVI step hides the mapping panel');
    await page.locator('#steps [data-step="1"]').click();
    assert.equal(await panel.isVisible(), true);

    // Phone: inside the Learn sheet, no horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    if (await page.evaluate(() => document.body.dataset.sheet !== 'learn')) await page.locator('.mobile-tab[data-sheet=learn]').click();
    await panel.scrollIntoViewIfNeeded();
    const box = await panel.evaluate(el => ({ w: el.clientWidth, s: el.scrollWidth }));
    assert.ok(box.s <= box.w + 1, 'no horizontal overflow on a phone');
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await panel.screenshot({ path: `${SHOTS}/koch-sp-mobile.png` }); }

    assert.deepEqual(errors, []);
    console.log('PASS koch-sp browser: schematic places the 3D tip, His/ventricular/target readings, keyboard, functional layers, fluoro RAO/LAO, language, steps, phone');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
