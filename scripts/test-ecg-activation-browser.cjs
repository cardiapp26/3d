// ECG simulator heart: the beat's activation on the 3D atlas, live while playing and on the scrubber.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/ecg/?lang=tr`);
    const heart = page.locator('#clin-heart-svg-mount [data-activation-heart]');
    await heart.waitFor({ timeout: 40000 });
    await page.waitForFunction(() => document.querySelector('[data-activation-heart]')?.dataset.loaded === 'true', undefined, { timeout: 40000 });
    assert.equal(await page.locator('#clin-heart-svg-mount .clin-heart-svg').count(), 0, 'the flat stage diagram is replaced');
    const clock = () => page.locator('[data-activation-heart] .ash-3d-time').textContent();
    // Playing: the heart follows the beat, not only the ms counter.
    const a = await clock();
    await page.waitForTimeout(700);
    assert.notEqual(await clock(), a, 'activation clock moves while the beat plays');
    // Scrubbing: each stage named with its time.
    for (const [ms, name] of [[20, 'SA Düğümü'], [160, 'AV Düğüm'], [285, 'Purkinje & Miyokard'], [650, 'Repolarizasyon']]) {
      await page.evaluate(v => { const s = document.querySelector('#clin-conduction-slider'); s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); }, ms);
      await page.waitForFunction(t => document.querySelector('[data-activation-heart] .ash-3d-time')?.textContent === t, `${name} · ${ms} ms`, { timeout: 5000 });
    }
    // Labels of the conduction system sit on the heart; the septal arrow shows during the bundles.
    await page.evaluate(() => { const s = document.querySelector('#clin-conduction-slider'); s.value = '240'; s.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-activation-heart] .ash-3d-pin')].some(p => !p.hidden && /septum soldan sağa/.test(p.textContent)));
    const pins = await page.locator('[data-activation-heart] .ash-3d-pin:not([hidden])').allTextContents();
    for (const label of ['SA düğüm', 'AV düğüm', 'His', 'Sağ dal', 'Sol dal']) assert.ok(pins.includes(label), `pin ${label}`);
    await page.setViewportSize({ width: 375, height: 812 });
    await heart.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'no horizontal overflow at 375 px');
    assert.deepEqual(errors, []);
    console.log('PASS ECG activation heart: 3D atlas replaces the flat diagram, live while playing, scrubber stages, conduction labels, septal arrow, 375 px');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
