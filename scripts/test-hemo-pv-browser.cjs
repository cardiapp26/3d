/**
 * P-V loop tab in the browser (catheterization mode): the model source shows
 * its own measurements instead of the catheter scenario's grid, the scenario
 * source keeps the scenario grid, the stiffness slider keeps the filling
 * pressure in range without moving the systolic arch, and a leaking lesion
 * names its forward and regurgitant volumes.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('[data-mode=cath]:not([data-mode-step])').dispatchEvent('click');
    await page.waitForSelector('.hemo-panel');
    const click = (sel) => page.locator(sel).first().dispatchEvent('click');
    const metrics = async () => Object.fromEntries(await page.locator('.hemo-metric').evaluateAll((cells) => cells.map((c) => [c.querySelector('.hemo-metric-label').textContent, c.querySelector('.hemo-metric-value').textContent])));
    const title = () => page.locator('.hemo-metrics-title').textContent();
    const setSlider = (key, value) => page.locator(`[data-pv-param=${key}]`).evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);

    // Scenario source: the catheter grid (cardiac index, SVR...) under its own title.
    await click('.hemo-tab[data-hemo-view=pv]');
    await page.waitForTimeout(200);
    const scenarioTitle = await title();
    const scenarioGrid = await metrics();
    assert.ok(Object.keys(scenarioGrid).some((k) => /SVR|CI|KI|SVD/i.test(k)), 'scenario grid has haemodynamic rows: ' + Object.keys(scenarioGrid).join(', '));

    // Model source: its own measurements replace the grid, and they agree with the model.
    await click('.hemo-tab[data-pv-source=model]');
    await page.waitForTimeout(200);
    const modelTitle = await title();
    assert.notEqual(modelTitle, scenarioTitle, 'the measurements title changes with the source');
    const model = await metrics();
    const keys = Object.keys(model);
    assert.ok(keys.length >= 11 && !keys.some((k) => /SVR|PVR|CI\b/.test(k)), 'model grid: ' + keys.join(', '));
    assert.equal(model[keys[0]], '130', 'normal model EDV equals the scenario normal');
    await click('.hemo-tab[data-pv-source=scenario]');
    await page.waitForTimeout(200);
    assert.equal(await title(), scenarioTitle, 'back to the scenario grid');
    await click('.hemo-tab[data-pv-source=model]');

    // Stiffness sweep: EDP in range, systolic pressure unchanged.
    const peaks = new Set(), edps = [];
    for (const k of [0.01, 0.03, 0.045, 0.06]) {
      await setSlider('stiffness', k);
      await page.waitForTimeout(80);
      const m = await metrics();
      const mk = Object.keys(m);
      peaks.add(m[mk.find((x) => /peak|tepe/i.test(x))]);
      edps.push(Number(m[mk.find((x) => /^EDP/.test(x))]));
    }
    assert.equal(peaks.size, 1, 'the systolic arch does not move with stiffness: ' + [...peaks]);
    assert.ok(edps.every((v, i) => v <= 36 && (i === 0 || v > edps[i - 1])), 'EDP rises with stiffness and stays in range: ' + edps);

    // The source toggle reports its state and has an accessible name.
    assert.equal(await page.locator('.hemo-pv-source').getAttribute('aria-label') !== null, true, 'the loop-source group is named');
    assert.equal(await page.locator('.hemo-tab[data-pv-source=model]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.hemo-tab[data-pv-source=scenario]').getAttribute('aria-pressed'), 'false');

    // A scenario change while the model is on screen leaves the model grid and loop alone.
    const before = await metrics();
    await page.locator('.hemo-select').selectOption('aortic_stenosis_severe');
    await page.waitForTimeout(150);
    assert.deepEqual(await metrics(), before, 'the model measurements do not follow the scenario menu');
    await page.locator('.hemo-select').selectOption('normal');

    // A language switch keeps the P-V tab, the source and the condition the user chose.
    await page.locator('[data-pv-condition]').selectOption('hfpef');
    const langButton = page.locator('#lang-btn, [data-lang-toggle], #language-toggle').first();
    if (await langButton.count()) {
      await langButton.dispatchEvent('click');
      await page.waitForTimeout(300);
      assert.equal(await page.locator('.hemo-tab[data-pv-source=model]').getAttribute('aria-pressed'), 'true', 'language switch keeps the model source');
      assert.equal(await page.locator('[data-pv-condition]').inputValue(), 'hfpef', 'and the condition');
      assert.equal(await page.locator('.hemo-pv-wrap').isHidden(), false, 'and stays on the P-V tab');
      await langButton.dispatchEvent('click');
      await page.waitForTimeout(200);
    }

    // Acute MR: forward and regurgitant rows appear.
    await page.locator('[data-pv-condition]').selectOption('mitral-regurgitation-acute');
    await page.waitForTimeout(150);
    const mr = await metrics();
    assert.ok(Object.keys(mr).some((k) => /Forward|İleri/.test(k)) && Object.keys(mr).some((k) => /Regurgitant|Regürjitan/.test(k)), 'MR rows: ' + Object.keys(mr).join(', '));
    assert.equal(errors.length, 0, 'no page errors: ' + errors.join('; '));
    console.log('PASS: P-V tab shows model measurements for the model, keeps the stiffness arch, names MR volumes');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
