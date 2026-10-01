const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const shotDir = process.env.SHOT_DIR || 'research/screenshots';
// Layers and tools open as a drawer from the header tabs (tablet and desktop).
const openDrawer = async (page, id) => {
  const tab = page.locator(`[data-drawer=${id}]`);
  if (await tab.getAttribute('aria-expanded') !== 'true') await tab.click();
};
(async () => {
  const { createServer } = await import('vite');
  const server = process.env.APP_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 5186 }, logLevel: 'error' });
  if (server) await server.listen();
  const url = process.env.APP_URL || `http://127.0.0.1:${server.config.server.port}`;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    await page.addInitScript(() => {
      localStorage.setItem('cardia_lang', 'tr');
      localStorage.setItem('cardia_lang_explicit', '1');
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && m.text().includes('THREE.')) errors.push(m.text()); });
    await page.goto(`${url}/#/mode/bachmann?structure=bachmann`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const settle = async () => {
      await page.waitForSelector('#viewport[data-camera-settled=true]');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const leads = () => page.evaluate(() => {
      const group = window.heart.scene.getObjectByName('Pacemaker Leads');
      return group.visible ? group.children.filter(x => x.visible).map(x => ({name:x.name,tip:x.children[1].position.toArray()})) : [];
    });
    await settle();
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'bachmann');
    assert.equal(await page.locator('.structure-index').getAttribute('data-provenance'), 'schematic');
    assert.deepEqual(await leads(), [], 'anatomy step has no pacing lead, including on a cold deep link');
    assert.equal(await page.locator('#progress').evaluate(x => x.hidden), true);
    assert.equal(await page.locator('#steps button').count(), 4);
    const band = await page.evaluate(() => window.heart.getState().structures.filter(s => s.id === 'bachmann'));
    assert.equal(band.length, 1, 'one independently selectable Bachmann band');
    assert.equal(band[0].provenance, 'schematic');
    assert.ok(await page.evaluate(() => {
      const band = window.heart.scene.getObjectByName("Bachmann's bundle (schematic atrial roof band)");
      return Math.hypot(...band.userData.bandAnchor.map((v,i) => v-band.userData.pacingTarget[i])) > .05;
    }), 'endocardial teaching target is distinct from epicardial band anchor');
    fs.mkdirSync(shotDir, {recursive:true});
    await page.screenshot({path:path.join(shotDir, 'bachmann-anatomy.png')});
    await openDrawer(page, 'layers');
    await page.locator('[data-layer=bachmann]').uncheck();
    assert.equal(await page.evaluate(() => window.heart.getState().structures.find(s => s.id === 'bachmann').visible), false);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.heart.getState().visibility.bachmann), true);
    await page.locator('[data-mode=bachmann]').dispatchEvent('click');
    await page.locator('#steps [data-step="1"]').click();
    await settle();
    assert.match((await leads())[0].name, /Appendage/);
    assert.equal((await leads()).length, 1);
    assert.equal(await page.evaluate(() => window.heart.getState().angio.laoRao), 40);
    const raaTip = (await leads())[0].tip;
    await page.locator('#steps [data-step="2"]').click();
    await settle();
    assert.equal(await page.evaluate(() => window.heart.getState().angio.laoRao), 0);
    const bb = await leads();
    assert.equal(bb.length, 1); assert.match(bb[0].name, /Bachmann/);
    assert.ok(bb[0].tip[2] < raaTip[2], 'BB region target posterior to RAA target in atlas coordinates');
    assert.ok(bb[0].tip[1] > raaTip[1], 'BB region target superior to RAA target');
    await page.locator('#progress').fill('40');
    const advanced = (await leads())[0].tip;
    assert.ok(Math.hypot(...advanced.map((v,i) => v-bb[0].tip[i])) > .1, 'progress moves lead tip');
    await page.locator('#steps [data-step="3"]').click();
    await settle();
    assert.equal(await page.evaluate(() => window.heart.getState().angio.laoRao), 40);
    if (await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed'))) await page.locator('#carm-edge-tab').click(); await page.locator('#fluoroscopy-toggle').click(); await settle();
    await page.screenshot({path:path.join(shotDir, 'bachmann-pacing-lao40.png')});
    await page.locator('#lang-btn').click();
    assert.match(await page.locator('#lesson-title').textContent(), /Bachmann bundle/);
    assert.equal(await page.locator('#steps .current').getAttribute('data-step'), '3');
    assert.match((await leads())[0].name, /Bachmann/);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.heart.getState().fluoroscopy), false);
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.deepEqual(await leads(), []);
    await page.locator('[data-mode=bachmann]').dispatchEvent('click');
    await page.locator('#steps [data-step="3"]').click();
    assert.match((await leads())[0].name, /Bachmann/, 'lesson can resume after reset');
    await page.locator('[data-mode=pacemaker]').dispatchEvent('click');
    for (const [step, expected] of [[0,/Appendage/],[1,/RV/],[2,/CSP/],[3,/CRT/]]) {
      await page.locator(`#steps [data-step="${step}"]`).click();
      assert.equal((await leads()).length, 1);
      assert.match((await leads())[0].name, expected);
    }
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.deepEqual(await leads(), []);
    await page.locator('#structure-select').selectOption('bachmann');
    assert.match(await page.locator('#structure-title').textContent(), /Bachmann/);
    await openDrawer(page, 'layers');
    await page.locator('input[data-layer=conduction]').uncheck();
    assert.equal(await page.evaluate(() => window.heart.getState().structures.find(s=>s.id==='bachmann').visible), false);
    assert.deepEqual(errors, []);
    console.log('PASS: Bachmann cold deep link, schematic anatomy, independent/conduction toggles, RAA vs BB targets, AP/LAO40, lead progress, TR/EN, reset, pacemaker step mapping; no rendering errors.');
  } finally { await browser.close(); await server?.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
