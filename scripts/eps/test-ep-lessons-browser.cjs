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

    // Ladder diagram: locked while neutral, then a strip under the recording with its conduction lines.
    const ladderBtn = page.locator('[data-ep-ladder]');
    await page.locator('[data-ep-evidence]').click();   // back to the neutral view
    assert.equal(await ladderBtn.isDisabled(), true, 'ladder locked in the neutral diagnosis');
    await page.locator('[data-ep-evidence]').click();
    await ladderBtn.click();
    assert.equal(await page.locator('[data-ep-ladder-canvas]').isVisible(), true, 'ladder under the strip once the reading is open');
    const lb = await page.locator('[data-ep-ladder-canvas]').boundingBox(), sb = await page.locator('.egm-canvas').boundingBox();
    assert.ok(lb.y >= sb.y + sb.height - 1 && Math.abs(lb.width - sb.width) < 2, 'same width, below the strip');
    assert.ok(await page.locator('[data-ep-ladder-canvas]').evaluate((c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 0 && v > 200)), 'ladder lines drawn');

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

    // Ladder on the channels: on and remembered; the strip still draws.
    await page.locator('[data-ep-links]').click();
    assert.equal(await page.locator('[data-ep-links]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => localStorage.getItem('eps-strip-links')), '1');
    assert.equal(await page.evaluate(() => window.epsLab.panel.getView().links), true);
    await page.locator('[data-ep-links]').click();

    // Full-screen strip.
    await page.locator('[data-ep-fullscreen-open]').click();
    assert.equal(await page.locator('.ep-fullscreen').isVisible(), true, 'full-screen strip open');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ep-fullscreen').isVisible(), false, 'Escape closes it');

    // Activation mapping tab: the colour map, the timeline and the reading follow the controls.
    await page.locator('[data-ep-section=mapping]').click();
    assert.equal(await page.evaluate(() => location.hash), '#/mapping');
    assert.equal(await page.locator('[data-amap]').isVisible(), true, 'mapping view shown');
    assert.equal(await page.locator('.ep-lesson').isHidden(), true);
    const red = () => page.evaluate(() => window.epsLab.panel.mapping.set({}).reading);
    assert.equal((await red()).redRegions, 1, 'focal map: one red region');
    await page.locator('[data-amap-scenario]').selectOption('slow-scar');
    assert.equal(await page.locator('[data-amap-verdict]').getAttribute('data-level'), 'impossible', 'Y > X verdict');
    assert.ok((await red()).redRegions > 1, 'misleading map across both atria');
    await page.locator('[data-amap-window]').selectOption('dePonti');
    assert.match(await page.locator('[data-amap-warn]').textContent(), /De Ponti/, 'no diastole for De Ponti');
    await page.locator('[data-amap-window]').selectOption('symmetric');
    await page.locator('[data-amap-region]').selectOption('ra');
    assert.equal((await red()).redRegions, 1, 'right atrium alone: one red region');
    await page.locator('[data-amap-truth]').click();
    assert.equal(await page.locator('[data-amap-truth]').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.locator('[data-amap-map]').evaluate((c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 0 && v > 200)), 'map drawn');
    assert.ok(await page.locator('[data-amap-timeline]').evaluate((c) => c.width > 0), 'timeline drawn');

    // Pace map tab: catheter by click and jump list, the twelve-lead comparison and the reading follow the controls.
    await page.locator('[data-ep-section=pacemap]').click();
    assert.equal(await page.evaluate(() => location.hash), '#/pacemap');
    assert.equal(await page.locator('[data-pmap]').isVisible(), true, 'pace map view shown');
    assert.equal(await page.locator('[data-amap]').isHidden(), true);
    await page.locator('[data-pmap-site]').selectOption('origin');
    assert.equal(await page.locator('[data-pmap-verdict]').getAttribute('data-level'), 'good', 'source: excellent match');
    const box = await page.locator('[data-pmap-map]').boundingBox();
    await page.mouse.click(box.x + box.width * 0.72, box.y + box.height * 0.85);
    assert.equal(await page.locator('[data-pmap-verdict]').getAttribute('data-level'), 'poor', 'clicked remote site: poor match');
    await page.locator('[data-pmap-scenario]').selectOption('scar');
    assert.equal(await page.locator('[data-pmap-mode]').isVisible(), true, 'rhythm choice for the scar VT');
    await page.locator('[data-pmap-site]').selectOption('isthmus');
    assert.equal(await page.locator('[data-pmap-verdict]').getAttribute('data-level'), 'poor', 'isthmus in sinus rhythm');
    await page.locator('[data-pmap-mode]').selectOption('vt');
    assert.equal(await page.locator('[data-pmap-verdict]').getAttribute('data-level'), 'good', 'isthmus during VT');
    assert.match(await page.locator('[data-pmap-readout]').textContent(), /PPI - TCL/);
    await page.locator('[data-pmap-mode]').selectOption('sinus');
    await page.locator('[data-pmap-site]').selectOption('bystander');
    assert.ok(await page.locator('[data-pmap-warn] li').count() > 0, 'long stim-QRS warning');
    await page.locator('[data-pmap-scoremap]').click();
    assert.equal(await page.locator('[data-pmap-legend]').isVisible(), true, 'match map legend');
    await page.locator('[data-pmap-truth]').click();
    assert.ok(await page.locator('[data-pmap-ecg]').evaluate((c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 1 && v > 180)), 'twelve leads drawn');

    // English labels follow the switch; back to the live tab.
    await page.locator('[data-app-lang-option=en]').click();
    assert.equal(await page.locator('[data-ep-section=treatment]').textContent(), 'Treatment');
    await page.locator('[data-ep-section=live]').click();
    assert.equal(await page.locator('.ep-lesson').isHidden(), true);
    assert.equal(await page.locator('[data-ep-live]').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS ep-lessons-browser: hash tab, strip + side layout, neutral diagnosis then evidence zone, ladder locked until the reading, ladder on the channels, delivered maneuver, treatment zone on the schematic, full-screen strip, activation mapping tab (focal, Y > X, De Ponti, region, truth), pace map tab (source, click, scar sinus vs VT, warnings, match map), TR/EN, live tab');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
