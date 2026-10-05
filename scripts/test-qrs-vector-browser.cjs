/**
 * QRS genesis lab: time slider, steps and play drive the activation map,
 * the vector loop and six leads; language and phone layout.
 * Usage: APP_URL=... node scripts/test-qrs-vector-browser.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/ecg/?lang=tr`);
    await page.locator('[data-topic="2"]').click();
    await page.locator('.vql').waitFor({ state: 'visible' });
    const cells = () => page.evaluate(() => {
      const c = { rest: 0, front: 0, done: 0 };
      document.querySelectorAll('.vql-cell').forEach(n => { c[n.dataset.state] += 1; });
      return c;
    });
    const setTime = ms => page.locator('[data-lab-param=time]').evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, ms);
    assert.equal(await page.locator('.vql-strip').count(), 6, 'six leads');

    await setTime(0);
    const c0 = await cells();
    assert.equal(c0.done + c0.front, 0, 'nothing activated at 0 ms');
    await page.locator('[data-step="0"]').click();
    assert.match(await page.locator('.ecg-lab-result').textContent(), /0\.01 s/);
    const c10 = await cells();
    assert.ok(c10.front + c10.done > 0 && c10.rest > c10.done * 3, 'early septal activation only');
    await setTime(80);
    const c80 = await cells();
    assert.equal(c80.rest, 0, 'all myocardium depolarized at 80 ms');
    assert.match(await page.locator('.ecg-lab-result').textContent(), /I \+ III − II = 0\.000/);

    // The loop grows with time; the lead value follows the vector.
    await setTime(40);
    const loop40 = await page.locator('.vql-loop').getAttribute('d');
    await setTime(20);
    assert.ok((await page.locator('.vql-loop').getAttribute('d')).length < loop40.length, 'loop drawn up to the current time');
    assert.match(await page.locator('[data-lead="V1"] .vql-strip-value').textContent(), /−/, 'V1 negative at 20 ms');

    // Play runs forward and stops at the end of the QRS.
    await setTime(0);
    await page.locator('[data-lab-action=play]').click();
    await page.waitForTimeout(900);
    const mid = Number(await page.locator('[data-lab-param=time]').inputValue());
    assert.ok(mid > 5 && mid < 80, `playing advances time (${mid} ms)`);
    await page.locator('[data-lab-action=play]').click();
    const paused = Number(await page.locator('[data-lab-param=time]').inputValue());
    await page.waitForTimeout(300);
    assert.equal(Number(await page.locator('[data-lab-param=time]').inputValue()), paused, 'pause stops');

    await page.locator('[data-ecg-lang=en]').click();
    assert.match(await page.locator('.vql-title').textContent(), /How the QRS forms/);
    assert.equal(Number(await page.locator('[data-lab-param=time]').inputValue()), paused, 'language keeps the time');

    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow on a phone');
    assert.deepEqual(errors, []);
    console.log('PASS QRS vector browser: activation map over time, steps, loop, leads, play/pause, language, phone');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
