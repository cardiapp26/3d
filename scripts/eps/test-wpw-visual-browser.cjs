const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5189').replace(/\/$/, '');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/eps/?lang=tr#/wpw`);
    await page.locator('[data-wpw]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-wpw-card=loc] [data-wpw-map-site]').count(), 9);
    const guide = page.locator('[data-wpw] [data-ap-boston-guide]');
    await guide.locator('summary').click();
    assert.match(await guide.textContent(), /delta.*retrograd P/s);
    assert.match(await guide.textContent(), /anteroseptal yollarda da/);
    assert.equal(await guide.locator('table tr').count(), 4);
    assert.equal(await guide.locator('a').count(), 4);
    const verdict = () => page.locator('[data-wpw-verdict]').getAttribute('data-site');
    await page.locator('[data-wpw-example=leftLateral]').click();
    assert.equal(await verdict(), 'leftLateral');
    assert.equal(await page.locator('[data-wpw-card=loc] [data-wpw-map-site=leftLateral]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-wpw-card=loc] [data-wpw-map-site=midseptal]').focus();
    await page.keyboard.press('Enter'); assert.equal(await verdict(), 'midseptal');
    assert.equal(await page.locator('[data-wpw-card=loc] [data-wpw-map-site=midseptal]').evaluate(el => el === document.activeElement), true, 'map retains keyboard focus');
    await page.locator('[data-wpw-reset]').click(); assert.equal(await verdict(), '');
    for (const option of ['v1:rGtS', 'd1:negIso', 'avf:neg']) await page.locator(`[data-wpw-option="${option}"]`).click();
    assert.equal(await verdict(), 'leftPosterior');
    await page.locator('[data-app-lang-option=en]').click(); assert.equal(await verdict(), 'leftPosterior');
    assert.match(await page.locator('[data-wpw-progress]').textContent(), /Algorithm complete/);
    assert.match(await guide.textContent(), /Negative P in I also occurs with anteroseptal pathways/);
    assert.match(await guide.textContent(), /synthetic and were not measured/);
    const shots = process.env.SHOT_DIR || '/private/tmp/cardia-wpw-shots'; fs.mkdirSync(shots, { recursive: true });
    await page.locator('[data-wpw]').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: `${shots}/wpw-desktop.png`, fullPage: true });
    for (const section of ['cs', 'abl', 'risk', 'loc']) {
      await page.locator(`[data-wpw-page=${section}]`).click();
      assert.equal(await page.locator(`[data-wpw-card=${section}]`).isVisible(), true);
      assert.equal(await page.locator('[data-wpw-card]:visible').count(), 1);
      if (section === 'cs') {
        await page.locator('[data-wpw-cs-phase=normal]').click();
        assert.equal(await page.locator('[data-wpw-cs-bars] [data-earliest=true]').getAttribute('data-wpw-cs-channel'), 'cs910');
        assert.equal(await page.locator('[data-wpw-cs-title]').getAttribute('data-site'), 'none', 'no pathway: neutral title');
        assert.equal(await page.locator('[data-wpw-card=cs] [data-wpw-map-site][aria-pressed=true]').count(), 0, 'no region marked without a pathway');
        await page.locator('[data-wpw-cs-site=leftLateral]').click();
        await page.locator('[data-wpw-cs-phase=before]').click();
        assert.equal(await page.locator('[data-wpw-cs-bars] [data-earliest=true]').getAttribute('data-wpw-cs-channel'), 'cs12');
      }
      if (section === 'cs') {
        for (const site of ['leftLateral', 'leftPosterior', 'posteroseptal', 'septalAnnulus', 'midseptal', 'anteroseptal', 'rightAnterior', 'rightLateral', 'rightPosterior']) {
          await page.locator(`[data-wpw-cs-site=${site}]`).click();
          assert.equal(await page.locator(`[data-wpw-card=cs] [data-wpw-map-site=${site}]`).getAttribute('aria-pressed'), 'true');
          const expected = site === 'leftLateral' ? 'cs12' : site === 'leftPosterior' ? 'cs56' : 'cs910';
          assert.equal(await page.locator('[data-wpw-cs-bars] [data-earliest=true]').getAttribute('data-wpw-cs-channel'), expected);
        }
        const map = await page.locator('[data-wpw-card=cs] .wpw-map-card').boundingBox();
        const trace = await page.locator('.wpw-cs-detail').boundingBox();
        assert.ok(map.x + map.width <= trace.x, 'desktop map and tracing side by side');
        await page.screenshot({ path: `${shots}/wpw-cs-desktop.png`, fullPage: true });
      }
      if (section === 'abl') {
        await page.locator('[data-wpw-abl-site]').selectOption('posteroseptal');
        await page.locator('[data-wpw-abl-phase=before]').click();
        assert.equal(await page.locator('[data-wpw-monitor]').count(), 9, 'lead I, aVL, His, ABL d and five CS channels');
        assert.equal(await page.locator('.amap-readout[data-group]').getAttribute('data-group'), 'septal');
        await page.locator('[data-wpw-abl-phase=after]').click();
        assert.equal(await page.locator('[data-wpw-masked]').isVisible(), false, 'no masked block outside the lecture patient');
        await page.screenshot({ path: `${shots}/wpw-ablation-septal.png`, fullPage: true });
        await page.locator('[data-wpw-abl-site]').selectOption('leftLateral');
        assert.equal(await page.locator('[data-wpw-masked]').isVisible(), true);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-wpw-example=rightLateral]').click(); assert.equal(await verdict(), 'rightLateral');
    const bounds = await page.locator('[data-wpw]').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    assert.ok(bounds.scroll <= bounds.width + 1, `mobile overflow ${JSON.stringify(bounds)}`);
    await page.screenshot({ path: `${shots}/wpw-mobile.png`, fullPage: true });
    await page.locator('[data-wpw-page=cs]').click();
    const csBounds = await page.locator('[data-wpw]').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    assert.ok(csBounds.scroll <= csBounds.width + 1, 'CS mobile has no overflow');
    await page.screenshot({ path: `${shots}/wpw-cs-mobile.png`, fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: WPW map/examples, manual ECG decisions, keyboard, language, four pages, CS/ablation, mobile overflow');
    console.log(`Screenshots: ${shots}`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
