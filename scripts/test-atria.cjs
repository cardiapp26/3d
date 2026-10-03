const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const shotDir = process.env.SHOT_DIR || 'research/screenshots';
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    fs.mkdirSync(shotDir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.APP_URL || 'http://127.0.0.1:5177') + '/#/mode/atria?structure=laa');
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    const visible = () => page.evaluate(() => window.heart.getState().structures.filter(s => s.visible).map(s => s.id).sort());
    assert.deepEqual(await visible(), ['coumadin-ridge','la','laa']); // with the left lateral ridge
    assert.equal(await page.locator('#structure-select').inputValue(), 'laa');
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 3); // LA, LAA, Coumadin ridge
    for (const id of ['la','laa']) {
      await page.hover('.workspace > aside');
      await page.locator(`[data-chamber-focus=${id}]`).click();
      assert.equal(await page.locator('#structure-select').inputValue(), id);
      await page.waitForSelector('#viewport[data-camera-settled=true]');
      await page.screenshot({ path: path.join(shotDir, `${id}-model.png`) });
      if (id === 'la') {
        const fit = await page.evaluate(async () => {
          const THREE = await import('/node_modules/three/build/three.module.js');
          let la, camera;
          window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id === 'la') la = o; if (o.isPerspectiveCamera) camera = o; });
          const points = la.geometry.attributes.position;
          let max = 0;
          for (let i = 0; i < points.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(points, i).applyMatrix4(la.matrixWorld).project(camera);
            max = Math.max(max, Math.abs(v.x), Math.abs(v.y));
          }
          return max;
        });
        assert.ok(fit < .95, 'LA fits inside viewport instead of being cropped');
      }

    }
    assert.equal(await page.evaluate(() => {
      let marker;
      window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id === 'laa') marker = o; });
      return marker.userData.contourMethod;
    }), 'surface-intersection', 'real atlas supplies a noncircular neck contour');
    const laOpacity = () => page.evaluate(() => {
      let opacity;
      window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id === 'la') opacity = o.material.opacity; });
      return opacity;
    });
    assert.ok(await laOpacity() <= .32, 'LAA focus reveals neck through surrounding tissue');
    await page.hover('.workspace > aside');
    await page.locator('[data-chamber-focus=la]').click();
    assert.equal(await laOpacity(), 1, 'LA focus restores tissue opacity');
    await page.hover('.workspace > aside');
    await page.locator('[data-chamber-focus=laa]').click();
    await page.hover('.workspace > aside');
    await page.locator('[data-chamber-wall=la]').fill('50');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.la), .5);
    await page.evaluate(() => { window.heart.setLayer('vessels', true); window.heart.setFlowVisible(true); });
    assert.deepEqual(await visible(), ['coumadin-ridge','la','laa']); // with the left lateral ridge
    await page.screenshot({ path: path.join(shotDir, 'atria.png') });

    // Test RA mode
    await page.locator('[data-mode=ra]').dispatchEvent('click');
    // Tools opened on mode entry only peek: a slim edge tab that slides open on hover.
    await page.mouse.move(800, 500);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.body.dataset.drawerPeek), 'true', 'tools drawer peeks on mode entry');
    const asideWidth = () => page.locator('.workspace > aside').evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(await asideWidth() <= 40, `collapsed to an edge tab (${await asideWidth()} px)`);
    await page.hover('.workspace > aside');
    await page.waitForTimeout(300);
    assert.ok(await asideWidth() > 200 && await asideWidth() <= 240, `slides open on hover, compact (${await asideWidth()} px)`);
    // The RA and its inner landmarks: the crista terminalis (report section 13), the Eustachian valve and the Chiari network.
    // The Chiari network is a variant: off until the optional switch is turned on.
    assert.deepEqual(await visible(), ['crista-terminalis', 'eustachian-valve', 'ra']);
    await page.hover('.workspace > aside');
    await page.locator('[data-chiari-network]').evaluate((box) => { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); });
    assert.deepEqual(await visible(), ['chiari-network', 'crista-terminalis', 'eustachian-valve', 'ra']);
    await page.hover('.workspace > aside');
    await page.locator('[data-chiari-network]').evaluate((box) => { box.checked = false; box.dispatchEvent(new Event('change', { bubbles: true })); });
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 4);
    assert.equal(await page.locator('#structure-select').inputValue(), 'ra');
    await page.hover('.workspace > aside');
    assert.equal(await page.locator('#ra-tools').isVisible(), true);
    await page.hover('.workspace > aside');
    assert.equal(await page.locator('#atria-tools').isVisible(), false);
    await page.hover('.workspace > aside');
    await page.locator('[data-chamber-wall=ra]').fill('40');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.ra), .4);

    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.ok((await visible()).includes('lv'));
    await page.evaluate(() => window.heart.setLayer('la', false));
    await page.locator('[data-mode=atria]').dispatchEvent('click');
    assert.deepEqual(await visible(), ['coumadin-ridge','la','laa']); // with the left lateral ridge
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.ok(!(await visible()).includes('la'), 'original layer preference restored');
    await page.locator('[data-mode=atria]').dispatchEvent('click');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.deepEqual(errors, []);
    console.log('PASS: atrial isolation (LA+LAA), separate RA mode, deep link, focus, wall cuts, mode restoration and mobile reset');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
