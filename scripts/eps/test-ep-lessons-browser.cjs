/**
 * EP lessons in the browser: the address opens a tab, the strip column sits
 * beside the side column and fills the screen, the neutral diagnosis keeps
 * the schematic zone hidden until "Show evidence", a delivered maneuver
 * replaces the clip, the treatment zone shows on the schematic, the
 * full-screen strip opens and closes, and the tab is written back to the
 * address.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
// The EPS page of Cardia: EPS_URL, else APP_URL + /eps.
const APP = (process.env.EPS_URL || `${(process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '')}/eps`).replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/diagnosis`);
    await page.waitForSelector('.ep-lesson');
    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'diagnosis', 'hash opens the tab');
    assert.equal(await page.locator('[data-ep-live]').isHidden(), true, 'live laboratory hidden');

    // Layout: strip column left and tall, side column right, no page scroll.
    const layout = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return { strip: r('.ep-strip'), side: r('.ep-side'), canvas: r('.egm-canvas'), scroll: document.documentElement.scrollHeight };
    });
    assert.ok(layout.side.left >= layout.strip.right, 'side column beside the strip');
    assert.ok(layout.canvas.height >= 450 && layout.canvas.width >= 850, `strip fills the screen ${JSON.stringify(layout.canvas)}`);
    assert.ok(layout.scroll <= 900, 'no page scroll on desktop');

    // Neutral diagnosis: no zone until the evidence is open.
    assert.equal(await page.locator('.ep-schematic .sch-zone').count(), 0, 'zone hidden while neutral');
    assert.match(await page.locator('.egm-title').textContent(), /mekanizma gizli/);
    await page.locator('[data-ep-evidence]').click();
    assert.equal(await page.locator('.ep-schematic .sch-zone').count(), 1, 'evidence reveals the zone');
    assert.match(await page.locator('.ep-schematic-legend').textContent(), /Koch/);

    // Maneuvers: deliver the His-refractory PVC from the simulator.
    await page.locator('[data-ep-section=maneuver]').click();
    assert.equal(await page.evaluate(() => location.hash), '#/maneuver', 'tab written to the address');
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.ok(await page.evaluate(() => Boolean(window.epsLab.panel.getView().sim)), 'delivered maneuver on the strip');
    assert.equal(await page.locator('.egm-scenarios [aria-pressed=true]').count(), 0, 'no clip pressed while the delivery is shown');

    // Treatment: zone on the schematic for a left free wall pathway.
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-lateral');
    assert.equal(await page.locator('.ep-schematic .sch-zone').getAttribute('data-shape'), 'left-free-wall');
    assert.match(await page.locator('.ep-endpoint').textContent(), /\S/);

    // Full-screen strip.
    await page.locator('[data-ep-fullscreen-open]').click();
    assert.equal(await page.locator('.ep-fullscreen').isVisible(), true, 'full-screen strip open');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ep-fullscreen').isVisible(), false, 'Escape closes it');

    // English labels follow the switch; back to the live tab.
    await page.locator('[data-app-lang-option=en]').click();
    assert.equal(await page.locator('[data-ep-section=treatment]').textContent(), 'Treatment');
    await page.locator('[data-ep-section=live]').click();
    assert.equal(await page.locator('.ep-lesson').isHidden(), true);
    assert.equal(await page.locator('[data-ep-live]').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS ep-lessons-browser: hash tab, strip + side layout, neutral diagnosis then evidence zone, delivered maneuver, treatment zone on the schematic, full-screen strip, TR/EN, live tab');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
