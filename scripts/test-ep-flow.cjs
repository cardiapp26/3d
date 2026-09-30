/**
 * Electrophysiological anatomy, section 15 closure checks in the browser
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md): channel choice,
 * time zoom and inspection that survive clip changes, the interactive
 * maneuver flow (choice changes the result, invalid preconditions are not
 * diagnostic, reproducible state, retry), full-screen signal on a phone in
 * portrait and landscape, Halo and CS electrode identity in 3D, the reentry
 * circuit arrows, the focal AT activation map, and the CTI and para-Hisian
 * case flows end to end. Teaching checks, not clinical validation.
 * Usage: APP_URL=... node scripts/test-ep-flow.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const steps = await page.locator('#steps button').count();
    await page.locator(`#steps [data-step="${steps - 1}"]`).click();
    await page.waitForSelector('#egm-panel:not([hidden]) .egm-canvas');
    const view = () => page.evaluate(() => window.cardiaEp.getView());

    // 1. Channel choice and time zoom survive a clip change; inspection reads the events.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('.ep-channels summary').click();
    await page.locator('[data-ep-channel="cs-56"]').uncheck();
    await page.locator('[data-ep-channel="cs-78"]').check();
    await page.locator('[data-ep-zoom]').selectOption('2');
    await page.locator('[data-ep-pan]').fill('500');
    let v = await view();
    assert.ok(!v.channels.includes('cs-56') && v.channels.includes('cs-78') && v.zoom === 2 && Math.abs(v.pan - 0.5) < 0.01, 'channel and zoom choice applied');
    await page.locator('[data-ep-case]').selectOption('avnrt-atypical');
    v = await view();
    assert.ok(!v.channels.includes('cs-56') && v.channels.includes('cs-78') && v.zoom === 2, 'view state survives a clip change');
    const box = await page.locator('.egm-canvas').boundingBox();
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
    assert.match(await page.locator('.ep-inspect').textContent(), /^t = \d+ ms/, 'inspection readout');
    assert.ok(Number.isFinite((await view()).cursorMs));
    await page.locator('[data-ep-zoom]').selectOption('1');

    // 2. Interactive maneuver: the choice changes the recording and its result.
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-lateral');
    assert.equal(await page.locator('[data-ep-sim]').isVisible(), true, 'maneuver controls in the Maneuvers tab');
    const setRange = (key, value) => page.evaluate(([key, value]) => { const el = document.querySelector(`[data-ep-sim-control="${key}"]`); el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, [key, value]);
    await page.locator('[data-ep-sim-control=maneuver]').selectOption('his-pvc');
    await setRange('timing', 15);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('.ep-sim-result').getAttribute('data-result'), 'valid');
    assert.match(await page.locator('.ep-sim-reason').textContent(), /A ilerledi/);
    const firstId = await page.evaluate(() => window.cardiaEp.getRecording().id);
    await setRange('timing', -30);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('.ep-sim-result').getAttribute('data-result'), 'insufficientEvidence', 'stimulus before H: not diagnostic');
    assert.match(await page.locator('.ep-sim-feedback').textContent(), /His refrakter: yok/);
    assert.notEqual(await page.evaluate(() => window.cardiaEp.getRecording().id), firstId, 'the choice changed the recording');
    await setRange('timing', 15);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().id), firstId, 'same choices, same recording (reproducible)');
    await page.locator('[data-ep-sim-control=maneuver]').selectOption('v-overdrive');
    await setRange('pcl', 380);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('.ep-sim-result').getAttribute('data-result'), 'insufficientEvidence', 'not faster than TCL: no entrainment');
    assert.doesNotMatch(await page.locator('.ep-measures').textContent(), /PPI/, 'no PPI without entrainment');
    await setRange('pcl', 330);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /PPI \d+ ms/);
    assert.match(await page.locator('.ep-sim-result').textContent(), /PPI-TCL \d+ ms · SA-VA \d+ ms/);
    await page.locator('[data-ep-sim-action=retry]').click();
    assert.equal(await page.locator('.ep-sim-result').isHidden(), true, 'retry clears the result');
    assert.equal(await page.evaluate(() => window.cardiaEp.getView().sim), null);
    await page.locator('[data-ep-sim-control=maneuver]').selectOption('para-his');
    await page.locator('[data-ep-sim-control=output]').selectOption('direct-a');
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('.ep-sim-result').getAttribute('data-result'), 'invalidCapture', 'direct A capture: uninterpretable');

    // 3. Circuit arrows follow the revealed clip; neutral diagnosis shows none.
    const circuits = () => page.evaluate(() => ['orthodromic', 'antidromic'].filter(k => { const o = window.heart.scene.getObjectByName(`EP circuit: ${k}`); return o && o.visible && o.parent.visible; }));
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    await page.locator('[data-egm-scenario="ap-lm-antidromic"]').click();
    assert.deepEqual(await circuits(), [], 'neutral: no circuit');
    await page.locator('[data-ep-evidence]').click();
    assert.deepEqual(await circuits(), ['antidromic']);
    assert.match(await page.locator('.ep-compare-card').textContent(), /VT/, 'VT differential card');
    await page.locator('[data-egm-scenario="ap-lm-avrt"]').click();
    assert.deepEqual(await circuits(), ['orthodromic']);
    const dir = await page.evaluate(() => { const o = window.heart.scene.getObjectByName('EP circuit: antidromic').userData, r = window.heart.scene.getObjectByName('EP circuit: orthodromic').userData; return { a: o.from, r: r.to }; });
    assert.ok(dir.a && dir.r, 'circuit endpoints recorded');

    // 4. Focal AT: activation map with the earliest channel, comparison card.
    await page.locator('[data-ep-case]').selectOption('focal-at');
    await page.locator('[data-ep-evidence]').click();
    assert.match(await page.locator('.ep-map-canvas').getAttribute('aria-label'), /^HRA 0 ms/);
    assert.match(await page.locator('.ep-compare-card').textContent(), /A-A-V/);
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), 'crista-terminalis');

    // 5. CTI case end to end: sequence, entrainment with PPI, invalid attempts, bidirectional block; Halo identity in 3D.
    await page.locator('[data-ep-case]').selectOption('flutter-cti');
    await page.locator('[data-ep-evidence]').click();
    assert.match(await page.locator('.egm-text').textContent(), /saat yönü tersi/);
    await page.locator('[data-ep-section=maneuver]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /PPI 250 ms · TCL 240 ms/);
    await page.locator('[data-egm-scenario="flutter-entrain-noncapture"]').click();
    assert.equal(await page.locator('.ep-result').getAttribute('data-result'), 'invalidCapture');
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-egm-scenario="cti-cs-pacing-after"]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /DP 120 ms/);
    assert.match(await page.locator('.ep-endpoint').textContent(), /Çift yönlü CTI bloğu/);
    const identity = await page.evaluate(async () => {
      const { CHANNEL_ELECTRODES } = await import('/src/ep-cases.js');
      const scene = window.heart.scene, get = n => scene.getObjectByName(n);
      const missing = Object.values(CHANNEL_ELECTRODES).flat().filter(n => !get(n));
      const V = scene.position.constructor;
      const wp = n => get(n).getWorldPosition(new V());
      const ivc = get('IVC ostium (measured)').getWorldPosition(new V());
      const cs = get('Coronary sinus ostium (estimated)').getWorldPosition(new V());
      return {
        missing, haloVisible: get('Halo catheter (schematic)').visible,
        halo1ToIvc: wp('Halo 1 electrode').distanceTo(ivc), halo10ToIvc: wp('Halo 10 electrode').distanceTo(ivc),
        cs9ToOs: wp('CS 9 electrode').distanceTo(cs), cs1ToOs: wp('CS 1 electrode').distanceTo(cs)
      };
    });
    assert.deepEqual(identity.missing, [], 'every bipole has its 3D electrodes');
    assert.equal(identity.haloVisible, true, 'Halo shown with the CTI case');
    assert.ok(identity.halo1ToIvc < identity.halo10ToIvc, 'Halo 1-2 distal, next to the CTI / IVC');
    assert.ok(identity.cs9ToOs < identity.cs1ToOs, 'CS 9-10 proximal at the ostium');

    // 6. Para-Hisian case 16: capture labels, H-A reference, direct A capture.
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-parahisian');
    assert.match(await page.locator('.ep-result').textContent(), /Para-Hisian pacing \(sinüste; entrainment değil\)/, 'title kept apart from entrainment');
    await page.locator('[data-egm-scenario="ph-parahis-nodal-ha"]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /H-A \(His\+RV\) 55 ms · H-A \(RV\) 55 ms/);
    await page.locator('[data-egm-scenario="ph-parahis-direct-a"]').click();
    assert.equal(await page.locator('.ep-result').getAttribute('data-result'), 'invalidCapture');
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), 'superior-paraseptal');

    // 7. Full screen: same view state, zoom from inside, Escape returns focus; phone portrait and landscape.
    await page.locator('[data-ep-zoom]').selectOption('2');
    await page.locator('[data-ep-fullscreen-open]').click();
    await page.waitForSelector('[data-ep-fullscreen]:not([hidden])');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.epFullscreen), 'true');
    await page.locator('[data-ep-fs=zoom-in]').click();
    assert.equal((await view()).zoom, 4, 'zoom inside full screen updates the shared view');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-ep-fullscreen]').isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-ep-fullscreen-open')), true, 'focus returns to the opener');
    assert.equal(await page.locator('[data-ep-zoom]').inputValue(), '4', 'panel shows the zoom set in full screen');
    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(250);
      if (!(await page.locator('[data-ep-fullscreen-open]').isVisible())) await page.locator('[data-sheet=learn]').click();
      await page.locator('[data-ep-fullscreen-open]').click();
      const fs = await page.evaluate(() => { const c = document.querySelector('.ep-fs-canvas'); const r = c.getBoundingClientRect(); return { w: r.width, h: r.height, overflow: document.documentElement.scrollWidth > innerWidth, iw: innerWidth, ih: innerHeight }; });
      assert.ok(fs.w >= fs.iw - 2 && fs.h > fs.ih * 0.5 && !fs.overflow, `full-screen canvas fills ${size.width}x${size.height} (${Math.round(fs.w)}x${Math.round(fs.h)})`);
      const before = (await view()).pan;
      const c = await page.locator('.ep-fs-canvas').boundingBox();
      await page.mouse.move(c.x + c.width * 0.7, c.y + c.height / 2);
      await page.mouse.down();
      await page.mouse.move(c.x + c.width * 0.3, c.y + c.height / 2, { steps: 6 });
      await page.mouse.up();
      assert.ok((await view()).pan > before, 'swipe moves forward in time');
      await page.locator('[data-ep-fs=close]').click();
      assert.equal(await page.locator('[data-ep-fullscreen]').isHidden(), true);
      assert.equal((await view()).zoom, 4, 'state kept after closing');
    }
    await page.setViewportSize({ width: 1300, height: 900 });

    // Leaving the mode clears the zone and the circuit.
    await page.locator('[data-mode=anatomy]').click();
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), null);
    assert.deepEqual(errors, []);
    console.log('PASS ep-flow: channel/zoom/inspection state, interactive maneuver (choice-dependent, non-diagnostic preconditions, reproducible, retry), circuits, AT map, CTI and para-Hisian flows, Halo/CS identity, full screen portrait/landscape');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
