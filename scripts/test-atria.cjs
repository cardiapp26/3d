const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.APP_URL || 'http://127.0.0.1:5177') + '/#/mode/atria?structure=laa');
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    const visible = () => page.evaluate(() => window.heart.getState().structures.filter(s => s.visible).map(s => s.id).sort());
    assert.deepEqual(await visible(), ['la','laa']);
    assert.equal(await page.locator('#structure-select').inputValue(), 'laa');
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 2);
    for (const id of ['la','laa']) {
      await page.locator(`[data-atria-focus=${id}]`).click();
      assert.equal(await page.locator('#structure-select').inputValue(), id);
      await page.waitForSelector('#viewport[data-camera-settled=true]');
      await page.screenshot({ path: `research/screenshots/${id}-model.png` });
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
    await page.locator('[data-atria-focus=la]').click();
    assert.equal(await laOpacity(), 1, 'LA focus restores tissue opacity');
    await page.locator('[data-atria-focus=laa]').click();
    await page.locator('[data-atria-wall=la]').fill('50');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.la), .5);
    await page.evaluate(() => { window.heart.setLayer('vessels', true); window.heart.setFlowVisible(true); });
    assert.deepEqual(await visible(), ['la','laa']);
    await page.screenshot({ path: 'research/screenshots/atria.png' });

    // Test RA mode
    await page.locator('[data-mode=ra]').click();
    // The RA and its inner landmark, the crista terminalis (report section 13).
    assert.deepEqual(await visible(), ['crista-terminalis', 'ra']);
    assert.equal(await page.locator('#structure-select option:not([disabled])').count(), 2);
    assert.equal(await page.locator('#structure-select').inputValue(), 'ra');
    assert.equal(await page.locator('#ra-tools').isVisible(), true);
    assert.equal(await page.locator('#atria-tools').isVisible(), false);
    await page.locator('[data-ra-wall=ra]').fill('40');
    assert.equal(await page.evaluate(() => window.heart.getState().wallCuts.ra), .4);

    await page.locator('[data-mode=anatomy]').click();
    assert.ok((await visible()).includes('lv'));
    await page.evaluate(() => window.heart.setLayer('la', false));
    await page.locator('[data-mode=atria]').click();
    assert.deepEqual(await visible(), ['la','laa']);
    await page.locator('[data-mode=anatomy]').click();
    assert.ok(!(await visible()).includes('la'), 'original layer preference restored');
    await page.locator('[data-mode=atria]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.deepEqual(errors, []);
    console.log('PASS: atrial isolation (LA+LAA), separate RA mode, deep link, focus, wall cuts, mode restoration and mobile reset');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
