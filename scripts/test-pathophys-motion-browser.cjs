// Browser check for the shared cycle clock in the PV loop and Starling/Laplace
// stations: motion, pause, scrub, gliding transitions, TR/EN and mobile width.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { startApp } = require('./lib/app-server.cjs');

const OUT = process.env.SHOT_DIR || '/tmp/cardia-pathophys-motion';

(async () => {
  mkdirSync(OUT, { recursive: true });
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    // PV loop: the point travels, pause holds it, scrub moves it, presets glide.
    await page.goto(`${app.url}/pathophysiology/?lang=tr#pv-loop`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-pv-dot]');
    const dot = () => page.$eval('[data-pv-dot]', d => `${d.getAttribute('cx')},${d.getAttribute('cy')}`);
    const a = await dot(); await page.waitForTimeout(500); const b = await dot();
    assert.notEqual(a, b, 'PV point should move while playing');
    await page.click('[data-motion-toggle]');
    const c = await dot(); await page.waitForTimeout(400);
    assert.equal(await dot(), c, 'PV point should hold while paused');
    await page.$eval('[data-cycle-scrub]', s => { s.value = '0.6'; s.dispatchEvent(new Event('input')); });
    await page.waitForTimeout(80);
    assert.match(await page.textContent('[data-cycle-phase]'), /Ejeksiyon/);
    assert.equal(await page.$$eval('.pv-event', e => e.length), 4, 'four valve events');
    const poly = () => page.$eval('[data-pv-static] polygon', p => p.getAttribute('points'));
    const before = await poly();
    await page.click('[data-pv-preset="hfref"]');
    await page.waitForTimeout(120);
    const mid = await poly();
    await page.waitForTimeout(600);
    const end = await poly();
    assert.ok(before !== mid && mid !== end, 'loop should glide between presets');
    await page.click('[data-motion-toggle]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/pv-loop.png` });

    // Starling/Laplace: sarcomere and ring beat, presets glide.
    await page.click('[data-station="starling-laplace"]');
    await page.waitForSelector('.sarcomere-svg text');
    const sar = () => page.textContent('.sarcomere-svg text');
    const lap = () => page.$eval('.laplace-svg circle', c => c.getAttribute('r'));
    const s1 = [await sar(), await lap()];
    await page.waitForTimeout(300);
    const s2 = [await sar(), await lap()];
    await page.waitForTimeout(300);
    const s3 = [await sar(), await lap()];
    assert.ok(s1.join() !== s2.join() || s2.join() !== s3.join(), 'sarcomere and ring should beat');
    await page.click('[data-lap-preset="eccentric"]');
    await page.waitForTimeout(700);
    await page.click('[data-motion-toggle]');
    await page.$eval('[data-cycle-scrub]', s => { s.value = '0.0'; s.dispatchEvent(new Event('input')); });
    await page.waitForTimeout(80);
    const ring = Number(await lap());
    assert.ok(ring > 100, `eccentric cavity+wall ring should be large, got ${ring}`);
    await page.click('[data-motion-toggle]');
    await page.screenshot({ path: `${OUT}/starling-laplace.png`, fullPage: true });

    // English labels.
    await page.goto(`${app.url}/pathophysiology/?lang=en#starling-laplace`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.sarcomere-svg text');
    assert.match(await page.textContent('[data-cycle-label]'), /Live heartbeat/);
    assert.match(await sar(), /Sarcomere/);

    // Mobile: no horizontal overflow on either station.
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
    mobile.on('pageerror', e => errors.push(e.message));
    for (const id of ['pv-loop', 'starling-laplace']) {
      await mobile.goto(`${app.url}/pathophysiology/?lang=tr#${id}`, { waitUntil: 'networkidle' });
      await mobile.waitForSelector('[data-cycle-scrub]');
      const over = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 1, `${id} overflows by ${over}px at 375px`);
      await mobile.screenshot({ path: `${OUT}/${id}-mobile.png`, fullPage: true });
    }

    assert.equal(errors.length, 0, `Page errors: ${errors.join('; ')}`);
    console.log(`PASS pathophysiology motion: PV point, pause, scrub, glide, sarcomere and Laplace beat, TR/EN, mobile. Screenshots: ${OUT}`);
  } finally {
    await browser.close();
    await app.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
