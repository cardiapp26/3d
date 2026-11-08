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
    // Catheter scenarios: picked in the exploration, their loop drawn dashed over the elastance loop.
    await page.waitForSelector('[data-pv-cath]');
    assert.ok((await page.locator('[data-pv-cath] option').count()) > 5, 'scenario menu filled');
    assert.equal(await page.locator('[data-pv-cath-loop]').count(), 0, 'no overlay before a choice');
    await page.locator('[data-pv-cath]').selectOption('mitral_stenosis_severe');
    await page.waitForTimeout(200);
    const ms = await page.locator('[data-pv-cath-loop]').getAttribute('points');
    assert.ok(ms && ms.split(' ').length > 50, 'scenario loop drawn');
    await page.locator('[data-pv-cath]').selectOption('aortic_stenosis_severe');
    await page.waitForTimeout(200);
    assert.notEqual(await page.locator('[data-pv-cath-loop]').getAttribute('points'), ms, 'scenario change redraws the loop');
    assert.equal(await page.locator('[data-pv-preset=as]').evaluate(b => b.classList.contains('active') || b.getAttribute('aria-pressed') === 'true'), true, 'matching preset follows the scenario');
    await page.locator('[data-pathophys-lang=en]').click();
    assert.match(await page.locator('.pathophys-cath-row label').textContent(), /Catheter scenario/);
    assert.equal(await page.locator('[data-pv-cath]').inputValue(), 'aortic_stenosis_severe', 'language keeps the scenario');
    assert.equal(errors.length, 0, 'no page errors: ' + errors.join('; '));
    console.log('PASS: catheter panel shows pressure tracings only; scenario P-V loop lives in Pathophysiology');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
