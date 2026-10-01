const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const { createServer } = await import('vite');
  const server = process.env.APP_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  let browser;
  try {
    if (server) await server.listen();
    const url = process.env.APP_URL || `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    await page.goto(`${url}/#/mode/angiography`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const materials = () => page.evaluate(() => {
      const result = [];
      window.heart.scene.traverse(m => {
        if (m.isMesh && ['vessels', 'coronaries', 'valves'].includes(m.userData.layer)) {
          result.push({ id: m.userData.id, layer: m.userData.layer, opacity: m.material.opacity, transparent: m.material.transparent, depthWrite: m.material.depthWrite });
        }
      });
      return result;
    });
    const setOpacity = async value => page.evaluate(value => {
      const input = document.querySelector('#myo-opacity');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await setOpacity('28');
    let state = await materials();
    for (const id of ['aorta', 'pa', 'svc']) assert.ok(state.some(m => m.id === id), `${id} is represented in the loaded atlas`);
    for (const m of state.filter(m => m.layer === 'vessels')) {
      assert.ok(m.opacity <= 0.28, `${m.id} follows tissue opacity`);
      assert.equal(m.transparent, true, m.id);
      assert.equal(m.depthWrite, false, m.id);
    }
    assert.ok(state.filter(m => m.layer === 'coronaries' || m.layer === 'valves').every(m => m.opacity === 1), 'coronaries and valves remain readable');
    await setOpacity('15');
    assert.ok((await materials()).filter(m => m.layer === 'vessels').every(m => m.opacity <= 0.15), 'lower slider value fades vessels further');
    await setOpacity('100');
    assert.ok((await materials()).filter(m => m.layer === 'vessels').every(m => m.opacity === 1 && !m.transparent && m.depthWrite), 'full opacity restores vessel depth rendering');
    await page.locator('#reset').click();
    assert.equal(await page.locator('#myo-opacity').inputValue(), '100');
    assert.ok((await materials()).filter(m => m.layer === 'vessels').every(m => m.opacity === 1), 'reset restores full opacity');
    await page.locator('[data-mode=transseptal]').dispatchEvent('click');
    await page.evaluate(() => window.heart.setOpacity(1));
    state = await materials();
    assert.ok(state.filter(m => ['aorta', 'pa', 'svc', 'ivc'].includes(m.id)).every(m => m.opacity <= 0.28), 'catheter teaching context keeps its transparency cap');
    await page.evaluate(() => window.heart.setOpacity(0.15));
    assert.ok((await materials()).filter(m => m.layer === 'vessels').every(m => m.opacity <= 0.15), 'slider also works inside catheter mode');
    console.log('PASS tissue-opacity: great vessels follow slider, coronaries/valves readable, reset and procedural caps preserved');
  } finally {
    await browser?.close();
    await server?.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
