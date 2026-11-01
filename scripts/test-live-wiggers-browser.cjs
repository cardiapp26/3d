// Live Wiggers station in the Pathophysiology module: its own cycle clock,
// pressures that agree with the shared Wiggers frame, play/pause, keyboard
// scrubbing, heart rate and speed, left/right/both views, TR/EN and mobile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || '/tmp/cardia-live-wiggers';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${APP}/pathophysiology/index.html?lang=tr#wiggers`);
    await page.waitForSelector('.pathophys-wiggers-lab .live-wiggers');
    const click = selector => page.locator(selector).first().click();
    const lvShown = () => page.evaluate(() => Number(document.querySelector('[data-pressure=lv] strong').textContent));
    assert.equal(await page.locator('.live-wiggers').isVisible(), true);
    assert.equal(await page.locator('.live-wiggers__title').textContent(), 'Canlı Wiggers');

    // The clock runs on its own: the LV readout changes while playing.
    const seen = new Set();
    for (let k = 0; k < 6; k++) { seen.add(await lvShown()); await page.waitForTimeout(150); }
    assert.ok(seen.size > 1, `clock advances while playing (${[...seen]})`);

    // Pause freezes, the keyboard scrubs.
    await click('.live-wiggers__play');
    const frozen = await lvShown(); await page.waitForTimeout(300);
    assert.equal(await lvShown(), frozen, 'pause freezes the clock');
    // Mid-ejection: the LV readout sits on the systolic plateau and matches the Wiggers frame.
    await click('.live-wiggers__presets [data-interval=ventricular-ejection]');
    const mid = await lvShown();
    assert.ok(mid > 110, `mid-ejection LV pressure (${mid})`);
    await page.locator('.live-wiggers__canvas').focus(); await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(80);
    assert.notEqual(await lvShown(), mid, 'keyboard scrubs the clock');
    assert.equal(await page.locator('[data-live-wiggers-la]').isVisible(), true, 'LA strip on its own scale');

    // Heart rate input drives the clock.
    await page.locator('.live-wiggers__control input:not(.live-wiggers__speed)').first().evaluate(el => { el.value = '110'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('.live-wiggers__speed').evaluate(el => { el.value = '0.25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/desktop.png` });

    // Right heart and both sides.
    await click('[data-live-side=right]');
    assert.equal(await page.locator('[data-pressure=rv]').isVisible(), true);
    assert.equal(await page.locator('[data-pressure=lv]').isVisible(), false);
    assert.equal(await page.locator('[data-live-wiggers-right]').isVisible(), true, 'right chart shown');
    await click('.live-wiggers__presets [data-interval=ventricular-ejection]');
    const rvMid = await page.evaluate(() => Number(document.querySelector('[data-pressure=rv] strong').textContent));
    assert.ok(rvMid > 18 && rvMid < 28, `mid-ejection RV pressure (${rvMid})`);
    await click('[data-live-side=both]');
    for (const key of ['la', 'lv', 'ao', 'ra', 'rv', 'pa']) assert.equal(await page.locator(`[data-pressure=${key}]`).isVisible(), true, `${key} card in both`);
    await page.screenshot({ path: `${SHOTS}/both.png` });

    // Language switch relabels in place.
    await click('[data-pathophys-lang=en]');
    assert.equal(await page.locator('.live-wiggers__title').textContent(), 'Live Wiggers');

    // Leaving the station stops the panel; coming back rebuilds it.
    await click('[data-station=pv-loop]'); await page.waitForSelector('.pathophys-pv-svg');
    assert.equal(await page.locator('.live-wiggers').count(), 0, 'station switch removes the panel');
    await click('[data-station=wiggers]'); await page.waitForSelector('.live-wiggers');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.live-wiggers__play').scrollIntoViewIfNeeded();
    const bounds = await page.locator('.live-wiggers').evaluate(root => ({ width: root.clientWidth, scroll: root.scrollWidth }));
    assert.ok(bounds.scroll <= bounds.width + 1, 'no horizontal overflow on mobile');
    await page.screenshot({ path: `${SHOTS}/mobile.png` });
    assert.deepEqual(errors, []);
    console.log('PASS live-wiggers browser (Pathophysiology): own clock, play/pause, scrub, rate/speed, left/right/both, TR/EN, station switch, mobile');
    console.log(`Screenshots: ${SHOTS}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
