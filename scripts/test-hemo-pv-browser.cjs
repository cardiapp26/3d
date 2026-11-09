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
    // One scenario list: every button sets the elastance loop; catheter scenarios also draw their loop dashed.
    await page.waitForSelector('[data-pv-preset]');
    assert.equal(await page.locator('[data-pv-preset]').count(), 18, 'one list of 18 scenarios');
    assert.equal(await page.locator('[data-pv-cath], .pathophys-pv-lab select:not([data-motion-speed])').count(), 0, 'no separate scenario menu');
    assert.equal(await page.locator('[data-pv-cath-loop]').count(), 1, 'normal shows its catheter loop');
    await page.locator('[data-pv-preset=ms]').click();
    await page.waitForTimeout(200);
    const ms = await page.locator('[data-pv-cath-loop]').getAttribute('points');
    assert.ok(ms && ms.split(' ').length > 50, 'scenario loop drawn');
    assert.match(await page.locator('[data-pv-look]').textContent(), /sola kaymış/, 'scenario explanation');
    await page.locator('[data-pv-preset=as]').click();
    await page.waitForTimeout(700);
    assert.notEqual(await page.locator('[data-pv-cath-loop]').getAttribute('points'), ms, 'scenario change redraws the loop');
    const asPeak = await page.locator('[data-pv-out=esp]').textContent();
    const [peak, esp] = asPeak.match(/\d+/g).map(Number);
    assert.ok(peak - esp > 60, 'aortic stenosis loop keeps its valve gradient: ' + asPeak);
    await page.locator('[data-pv-cath-show]').uncheck();
    assert.equal(await page.locator('[data-pv-cath-loop]').count(), 0, 'overlay can be hidden');
    await page.locator('[data-pv-cath-show]').check();
    await page.locator('[data-pv-preset=hfpef]').click();
    assert.equal(await page.locator('[data-pv-cath-loop]').count(), 0, 'no overlay without a catheter scenario');
    assert.equal(await page.locator('.pathophys-cath-row').isVisible(), false, 'overlay toggle hidden without one');
    assert.equal(await page.locator('[data-pv-explain] li:not([hidden])').count(), 4, 'four lines explained');
    await page.locator('[data-pv-preset=tamponade]').click();
    await page.locator('[data-pv-slider=edv]').fill('100');
    assert.match(await page.locator('[data-pv-scen-title]').textContent(), /Özel Ayar \(Kardiyak Tamponad\)/, 'custom keeps its base scenario');
    await page.locator('[data-pathophys-lang=en]').click();
    assert.match(await page.locator('[data-pv-explain] h4').textContent(), /What the lines show/);
    assert.match(await page.locator('.pathophys-cath-row label').textContent(), /catheterization loop/);
    assert.equal(errors.length, 0, 'no page errors: ' + errors.join('; '));
    console.log('PASS: catheter panel shows pressure tracings only; scenario P-V loop lives in Pathophysiology');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
