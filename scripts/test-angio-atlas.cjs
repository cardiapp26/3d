const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { startApp } = require('./lib/app-server.cjs');
const assert = require('node:assert/strict');
(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${app.url}/angio/?lang=tr#a=-35&b=-45&sys=left`);
    assert.equal(await page.locator('[data-atlas-viewport]').count(), 2, 'anatomy and fluoroscopy reuse atlas engine');
    await page.waitForFunction(() => document.querySelector('[data-angio-atlas]').dataset.ready === 'true', undefined, { timeout: 60000 });
    const state = () => page.evaluate(() => window.angioStudio.getAtlasState());
    let initial = await state();
    assert.ok(initial.anatomy.structures.filter(m => m.provenance === 'atlas').length >= 30);
    assert.equal(initial.fluoro.fluoroscopy, true);
    assert.equal(initial.anatomy.fluoroscopy, false);
    for (const view of [initial.anatomy, initial.fluoro]) {
      assert.equal(view.angio.laoRao, -35);
      assert.equal(view.angio.craCau, -45);
    }
    const initialDist = initial.anatomy.angio.distance;
    await page.waitForTimeout(260);
    const afterBeat = await state();
    for (const view of [afterBeat.anatomy, afterBeat.fluoro]) {
      assert.equal(view.angio.laoRao, -35, 'laoRao must not drift across frames');
      assert.equal(view.angio.craCau, -45, 'craCau must not drift or jitter across frames');
      assert.ok(Math.abs(view.angio.distance - initialDist) < 1e-6, 'camera distance must not jitter across frames');
    }
    const viewport = await page.locator('[data-atlas-viewport=anatomy]').elementHandle();
    await page.locator('[data-toggle-cine]').click();
    const phase = (await state()).cycle.phase;
    await page.waitForTimeout(220);
    assert.equal((await state()).cycle.phase, phase, 'freeze stops shared cycle');
    await page.locator('[data-angio-view=rao-cranial]').click();
    for (const view of [(await state()).anatomy, (await state()).fluoro]) {
      assert.equal(view.angio.laoRao, -30); assert.equal(view.angio.craCau, 30);
    }
    assert.equal((await state()).device.alpha, -30);
    assert.equal((await state()).device.beta, 30);
    await page.locator('[data-atlas-layer=veins]').check();
    assert.equal((await state()).anatomy.veins, true);
    assert.equal((await state()).fluoro.veins, true);
    await page.locator('[data-angio-sys=right]').click();
    initial = await state();
    assert.equal(initial.anatomy.system, 'right'); assert.equal(initial.fluoro.system, 'right');
    await page.locator('[data-angio-lang=en]').click();
    assert.equal(await viewport.evaluate(el => el.isConnected), true, 'model survives language and system rerenders');
    await page.locator('[data-toggle-cine]').click();
    await page.waitForTimeout(220);
    assert.notEqual((await state()).cycle.phase, phase);
    initial = await state();
    assert.ok(Math.abs(initial.cycle.phase - initial.fluoroCycle.phase) < .04, 'both views share cardiac phase');
    await page.locator('[data-device-beam]').uncheck();
    assert.equal((await state()).device.beam, false);
    // Fluoroscopy console: grafts with their own geometry, angle rail, cine corners.
    await page.locator('[data-console-bar] [data-angio-sys="lima"]').click();
    await page.waitForFunction(() => window.angioStudio.getAtlasState().fluoro.graft === 'lima');
    assert.equal(await page.locator('[data-cine-system]').textContent(), 'LIMA');
    assert.equal(await page.locator('[data-graft-switch="on"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-graft-switch="off"]').click();
    await page.waitForFunction(() => window.angioStudio.getAtlasState().fluoro.graft === null);
    await page.locator('[data-console-alpha]').fill('13');
    await page.locator('[data-console-beta]').fill('37');
    assert.equal(await page.locator('[data-cine-angle]').textContent(), 'LAO 13 CRA 37');
    const angio = (await state()).fluoro.angio;
    assert.deepEqual([angio.laoRao, angio.craCau], [13, 37], 'console sliders drive the C-arm');
    // Venous phase: coronary veins only, in both views.
    await page.locator('[data-atlas-veins-only]').click();
    await page.waitForFunction(() => window.angioStudio.getAtlasState().fluoro.system === 'veins');
    assert.equal(await page.locator('[data-cine-system]').textContent(), 'VEINS');
    await page.locator('[data-atlas-veins-only]').click();
    await page.waitForFunction(() => window.angioStudio.getAtlasState().fluoro.system !== 'veins');
    // Hover names a structure over the anatomy view.
    const box = await page.locator('[data-atlas-viewport=anatomy]').boundingBox();
    let tip = null;
    for (let y = box.y + box.height * .4; y < box.y + box.height * .85 && !tip; y += 20)
      for (let x = box.x + box.width * .3; x < box.x + box.width * .7 && !tip; x += 20) {
        await page.mouse.move(x, y);
        tip = await page.evaluate(() => { const t = document.querySelector('[data-atlas-viewport=anatomy] .angio-atlas-tip'); return t && !t.hidden ? t.textContent : null; });
      }
    assert.ok(tip, 'hover shows a structure name');
    // Atlas camera bar over the anatomy view: C-arm presets move both views, anatomy-only cameras do not.
    assert.equal(await page.locator('[data-angio-viewbar] [data-viewbar-view]').count(), 7, 'seven camera presets');
    await page.locator('[data-viewbar-view=spider]').click();
    for (const view of [(await state()).anatomy, (await state()).fluoro]) assert.deepEqual([view.angio.laoRao, view.angio.craCau], [45, -35], 'Spider drives both views');
    assert.equal(await page.locator('[data-viewbar-view=spider]').getAttribute('aria-pressed'), 'true');
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('p');
    assert.equal((await state()).anatomyView, 'posterior');
    await page.waitForTimeout(500);
    const fluoroAngles = (await state()).fluoro.angio;
    assert.deepEqual([fluoroAngles.laoRao, fluoroAngles.craCau], [45, -35], 'posterior camera leaves the C-arm alone');
    assert.ok(Math.abs((await state()).anatomy.angio.laoRao) > 120, 'anatomy view turns to the back');
    await page.keyboard.press('a');
    assert.equal((await state()).anatomyView, null);
    for (const view of [(await state()).anatomy, (await state()).fluoro]) assert.deepEqual([view.angio.laoRao, view.angio.craCau], [0, 0], 'Anterior re-attaches the anatomy view');
    await page.locator('[data-viewbar-view=mitral]').click();
    assert.equal((await state()).anatomyView, 'mitral');
    assert.equal((await state()).anatomy.valves, true, 'mitral view shows the valves');
    await page.keyboard.press('0');
    assert.equal((await state()).anatomyView, null, 'reset returns to the C-arm view');
    await page.keyboard.press('x');
    assert.equal(await page.locator('.angio-fluoro-console').isVisible(), false, 'X hides the fluoroscopy panel');
    await page.keyboard.press('x');
    assert.equal(await page.locator('.angio-fluoro-console').isVisible(), true);
    await page.keyboard.press('g');
    assert.equal((await state()).anatomy.segmentation, true, 'G turns on segmentation colours');
    assert.equal((await state()).fluoro.segmentation, false);
    await page.keyboard.press('g');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `no overflow ${width}`);
    }
    await page.screenshot({ path: '/tmp/angio-atlas-after.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS angio atlas: shared original model, anatomy/fluoro, angles, device, shared cine, layers, graft console and cine corners, persistent renderers, TR/EN, responsive layout');
  } finally { await browser.close(); await app.close(); }
})().catch(e => { console.error(e); process.exit(1); });
