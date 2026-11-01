/**
 * Catheterization panel keeps only right/left heart pressure tracings; the
 * P-V loop, preload/afterload, physiology guide and Live Wiggers moved to the
 * Pathophysiology module, where the catheter-scenario P-V loop follows the
 * scenario menu.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { openMode } = require('./lib/open-mode.cjs');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await openMode(page, APP, 'cath');
    await page.waitForSelector('.hemo-panel');
    assert.equal(await page.locator('.hemo-panel .hemo-tab').count(), 0, 'catheter panel has no view tabs');
    assert.equal(await page.locator('.hemo-panel .live-wiggers, .hemo-panel .phys-guide, .hemo-panel .hemo-loads, .hemo-pv-canvas').count(), 0, 'moved views are gone');
    assert.equal(await page.locator('.hemo-canvas').isVisible(), true, 'pressure tracings stay');
    assert.equal(await page.locator('.hemo-metrics').isVisible(), true, 'scenario measurements stay');

    await page.goto(`${APP}/pathophysiology/index.html?lang=tr#pv-loop`);
    await page.waitForSelector('.pathophys-scenario-pv canvas');
    const shot = () => page.evaluate(() => document.querySelector('.pathophys-scenario-pv canvas').toDataURL());
    await page.waitForTimeout(200);
    assert.ok((await page.locator('[data-scenario-pv] option').count()) > 5, 'scenario menu filled');
    await page.locator('[data-scenario-pv]').selectOption('aortic_stenosis_severe');
    await page.waitForTimeout(200);
    const as = await shot();
    await page.locator('[data-scenario-pv]').selectOption('normal');
    await page.waitForTimeout(200);
    assert.notEqual(await shot(), as, 'scenario change redraws the loop');
    await page.locator('[data-pathophys-lang=en]').click();
    assert.match(await page.locator('.pathophys-scenario-pv h3').textContent(), /catheter scenarios/);
    assert.equal(await page.locator('[data-scenario-pv]').inputValue(), 'normal', 'language keeps the scenario');
    assert.equal(errors.length, 0, 'no page errors: ' + errors.join('; '));
    console.log('PASS: catheter panel shows pressure tracings only; scenario P-V loop lives in Pathophysiology');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
