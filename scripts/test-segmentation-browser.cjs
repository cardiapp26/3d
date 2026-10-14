/**
 * Segmentation-style view in the browser: the dock button and G show the label
 * colours and a legend of the labels on screen, the legend follows layers, modes
 * and language, fluoroscopy and this view exclude each other, the original
 * materials are untouched, and reset turns it off.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');
const ALL = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa', 'caval', 'pv', 'lad', 'lcx', 'rca', 'cardiac-veins', 'leaflets', 'papillary'];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const state = () => page.evaluate(() => window.heart.getSegmentation());
    const legend = page.locator('.seg-legend');
    const button = page.locator('#segmentation-toggle');
    const lvColor = () => page.evaluate(() => window.heart.scene.getObjectByName('Left ventricle').material.color.getHex());
    const settle = () => page.waitForTimeout(250);
    const LV_NAME = { tr: 'Sol ventrikül', en: 'Left ventricle' };
    const lang = () => page.evaluate(() => document.documentElement.lang);
    const startLang = await lang();

    assert.deepEqual(await state(), { on: false, shown: false, labels: [] }, 'off at start');
    assert.equal(await legend.isVisible(), false);
    const atlasLv = await lvColor();

    await button.click();
    await settle();
    assert.deepEqual(await state(), { on: true, shown: true, labels: ALL }, 'every label on screen in anatomy mode');
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.equal(await legend.locator('li').count(), ALL.length);
    assert.equal(await legend.locator('li').first().innerText(), LV_NAME[startLang]);
    assert.equal(await lvColor(), atlasLv, 'label colours are swapped in for the frame only');
    assert.equal(await page.evaluate(() => window.heart.getState().segmentation), true);

    // The legend lists only what is drawn.
    await page.evaluate(() => window.heart.setLayer('coronaries', false));
    await settle();
    assert.deepEqual((await state()).labels, ALL.filter((key) => !['lad', 'lcx', 'rca', 'cardiac-veins'].includes(key)), 'coronary labels leave with the layer');
    await page.evaluate(() => window.heart.setLayer('coronaries', true));

    await page.locator('#lang-btn').click();
    await settle();
    assert.notEqual(await lang(), startLang);
    assert.equal(await legend.locator('li').first().innerText(), LV_NAME[await lang()], 'legend follows the language');
    await page.locator('#lang-btn').click();
    await settle();

    // Fluoroscopy and the label view exclude each other, from either side.
    await page.keyboard.press('x');
    await settle();
    assert.equal(await page.evaluate(() => window.heart.getState().fluoroscopy), true);
    assert.deepEqual(await state(), { on: false, shown: false, labels: [] }, 'fluoroscopy turns the label view off');
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
    assert.equal(await legend.isVisible(), false);
    await page.keyboard.press('g');
    await settle();
    assert.equal(await page.evaluate(() => window.heart.getState().fluoroscopy), false, 'G turns fluoroscopy off');
    assert.equal(await page.locator('#fluoro-toggle-dock').getAttribute('aria-pressed'), 'false');
    assert.equal((await state()).shown, true);

    // A chamber mode shows that chamber's labels only.
    await page.evaluate(() => { location.hash = '#/mode/lv'; });
    await page.waitForTimeout(900);
    const lvMode = (await state()).labels;
    assert.ok(lvMode.includes('lv') && !lvMode.includes('rv') && !lvMode.includes('aorta'), `LV mode lists its own labels (${lvMode})`);
    await page.evaluate(() => { location.hash = '#/mode/anatomy'; });
    await page.waitForTimeout(900);

    await page.keyboard.press('0');
    await settle();
    assert.deepEqual(await state(), { on: false, shown: false, labels: [] }, 'reset turns it off');
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
    assert.equal(await lvColor(), atlasLv);

    // Phone: the button stays on screen and the legend does not overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    await button.click();
    await settle();
    const phone = await page.evaluate(() => {
      const box = (sel) => document.querySelector(sel).getBoundingClientRect();
      const b = box('#segmentation-toggle'), l = box('.seg-legend');
      return { button: b.left >= 0 && b.right <= innerWidth && b.height >= 32, legend: l.left >= 0 && l.right <= innerWidth, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.deepEqual(phone, { button: true, legend: true, overflow: 0 }, 'phone: button tappable, legend inside the screen');
    assert.ok((await button.getAttribute('title')).trim(), 'the icon-only button keeps its tooltip');

    assert.deepEqual(errors, []);
    console.log('PASS segmentation-browser: button and G, 14 labels, legend follows layers, chamber mode and language, exclusive with fluoroscopy, atlas materials intact, reset, phone layout');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
