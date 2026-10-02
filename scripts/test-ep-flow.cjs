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
    assert.equal(await page.locator('#egm-panel').isVisible(), true, 'EP opens its signal panel on the first lesson');
    assert.equal(await page.locator('#structure-info').isVisible(), false, 'generic IVC card does not precede EP');
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().id), 'flutter-svt', 'CTI opens with flutter recording');
    for (const [step, clip] of [[1, 'avnrt-typ-svt'], [2, 'af-pvi-baseline'], [3, 'sinus'], [0, 'flutter-svt']]) {
      await page.locator(`#steps [data-step="${step}"]`).click();
      assert.equal(await page.locator('#egm-panel').isVisible(), true, `EP panel remains open at step ${step}`);
      assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().id), clip, `step ${step} has its matching recording`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    if (!(await page.locator('#egm-panel').isVisible())) await page.locator('[data-sheet=learn]').click();
    assert.equal(await page.locator('#egm-panel').isVisible(), true, 'phone Learn opens EP directly');
    assert.equal(await page.locator('#structure-info').isVisible(), false, 'phone hides unrelated IVC card');
    await page.setViewportSize({ width: 1300, height: 900 });
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.equal(await page.locator('#egm-panel').isVisible(), false, 'leaving EP closes its panel');
    assert.equal(await page.locator('#structure-info').isVisible(), true, 'anatomy restores structure information');
    await page.locator('[data-mode=ablation]:not([data-mode-step])').dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().id), 'flutter-svt', 'returning to EP opens its first lesson');
    const steps = await page.locator('#steps button').count();
    await page.locator(`#steps [data-step="${steps - 1}"]`).click();
    await page.waitForSelector('#egm-panel:not([hidden]) .egm-canvas');
    const view = () => page.evaluate(() => window.cardiaEp.getView());

    // 1. Channel choice and time zoom survive a clip change; inspection reads the events.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('avnrt-typical');
    await page.locator('[data-egm-scenario=avnrt-ah-jump]').click();
    assert.equal(await page.locator('[data-ep-section=diagnosis]').getAttribute('aria-selected'), 'true', 'AH jump stays in the diagnostic workup');
    assert.match(await page.locator('.egm-title').textContent(), /Atriyal ekstrastimulus/);
    assert.equal(await page.locator('.ep-card').isVisible(), false, 'neutral workup hides the inference card');
    assert.match(await page.locator('.ep-measures').textContent(), /AH \(S2-1\) 100 ms.*AH \(S2-2\) 180 ms/);
    assert.match(await page.locator('.ep-measures').textContent(), /S1-S2 \(1\) 350 ms.*S1-S2 \(2\) 340 ms/);
    await page.locator('[data-ep-evidence]').click();
    assert.match(await page.locator('.egm-text').textContent(), /10 ms kısalmaya 80 ms artış/);
    await page.locator('[data-egm-scenario=avnrt-jump-echo]').click();
    assert.equal(await page.locator('[data-ep-section=diagnosis]').getAttribute('aria-selected'), 'true', 'echo stays in the diagnostic workup');
    assert.match(await page.locator('.ep-measures').textContent(), /VA \(echo\) 30 ms/);
    assert.match(await page.locator('.egm-text').textContent(), /tek atriyal echo/);
    assert.match(await page.locator('.egm-text').textContent(), /tanısını kesinleştirmez/);
    await page.locator('[data-ep-evidence]').click();
    await page.locator('[data-egm-scenario=avnrt-typ-svt]').click();
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
    assert.equal(await page.locator('[data-ep-sim] .ep-sim-result').getAttribute('data-result'), 'valid');
    assert.match(await page.locator('[data-ep-sim] .ep-sim-reason').textContent(), /A ilerledi/);
    const firstId = await page.evaluate(() => window.cardiaEp.getRecording().id);
    await setRange('timing', -30);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-sim] .ep-sim-result').getAttribute('data-result'), 'insufficientEvidence', 'stimulus before H: not diagnostic');
    assert.match(await page.locator('[data-ep-sim] .ep-sim-feedback').textContent(), /His refrakter: yok/);
    assert.notEqual(await page.evaluate(() => window.cardiaEp.getRecording().id), firstId, 'the choice changed the recording');
    await setRange('timing', 15);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().id), firstId, 'same choices, same recording (reproducible)');
    await page.locator('[data-ep-sim-control=maneuver]').selectOption('v-overdrive');
    await setRange('pcl', 380);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-sim] .ep-sim-result').getAttribute('data-result'), 'insufficientEvidence', 'not faster than TCL: no entrainment');
    assert.doesNotMatch(await page.locator('.ep-measures').textContent(), /PPI/, 'no PPI without entrainment');
    await setRange('pcl', 330);
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /PPI \d+ ms/);
    assert.match(await page.locator('[data-ep-sim] .ep-sim-result').textContent(), /PPI-TCL \d+ ms · SA-VA \d+ ms/);
    await page.locator('[data-ep-sim-action=retry]').click();
    assert.equal(await page.locator('[data-ep-sim] .ep-sim-result').isHidden(), true, 'retry clears the result');
    assert.equal(await page.evaluate(() => window.cardiaEp.getView().sim), null);
    await page.locator('[data-ep-sim-control=maneuver]').selectOption('para-his');
    await page.locator('[data-ep-sim-control=output]').selectOption('direct-a');
    await page.locator('[data-ep-sim-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-sim] .ep-sim-result').getAttribute('data-result'), 'invalidCapture', 'direct A capture: uninterpretable');

    // Atropine and Isuprel: paired recordings, matching pacing rate, alternative
    // single-echo/induced/noninduced examples, and stale-result cleanup.
    await page.locator('[data-ep-case]').selectOption('avnrt-typical');
    const pharma = page.locator('[data-ep-pharma]');
    assert.equal(await pharma.isVisible(), true);
    // The maneuver row chip leads to the panel; every case, flutter included, offers it.
    await page.locator('[data-ep-pharma-jump]').click();
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-ep-pharma-control')), 'drug');
    await page.locator('[data-ep-case]').selectOption('flutter-cti');
    assert.equal(await pharma.isVisible(), true, 'drug challenge in the flutter case');
    assert.deepEqual(await page.locator('[data-ep-pharma-control=example] option').evaluateAll((o) => o.map((x) => x.value)), ['sinus-av']);
    await page.locator('[data-ep-case]').selectOption('avnrt-typical');
    const pharmaMeasure = (key) => page.locator(`[data-ep-pharma-measure="${key}"]`).textContent();
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().lab), 'pharma');
    assert.match(await pharmaMeasure('pp'), /850 ms650 ms/);
    assert.match(await pharmaMeasure('drive'), /500 ms500 ms/);
    assert.match(await pharmaMeasure('ah'), /80 ms65 ms/);
    await page.locator('[data-ep-pharma-phase=before]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().phase), 'before');
    assert.match(await page.locator('.egm-title').textContent(), /Atropin.*Önce/);
    await page.locator('[data-ep-pharma-control=drug]').selectOption('isuprel');
    assert.equal(await page.locator('[data-ep-pharma-comparison]').isHidden(), true, 'new selection retires the previous comparison');
    assert.notEqual(await page.evaluate(() => window.cardiaEp.getRecording().lab), 'pharma', 'stale EGM cleared');
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.match(await pharmaMeasure('pp'), /850 ms550 ms/);
    assert.match(await pharmaMeasure('ah'), /80 ms55 ms/);
    assert.match(await pharmaMeasure('induced'), /YokYok/);
    await page.locator('[data-ep-pharma-control=example]').selectOption('echo-only');
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.match(await pharmaMeasure('echo'), /YokVar/);
    assert.match(await pharmaMeasure('induced'), /YokYok/);
    assert.match(await pharmaMeasure('va'), /30 ms/);
    await page.locator('[data-ep-pharma-control=example]').selectOption('induced');
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.match(await pharmaMeasure('induced'), /YokVar/);
    assert.match(await pharmaMeasure('tcl'), /330 ms/);
    await page.evaluate(() => window.cardiaEp.setLanguage('en'));
    assert.match(await page.locator('.egm-title').textContent(), /Isuprel.*After/);
    assert.match(await pharmaMeasure('induced'), /AbsentPresent/);
    await page.evaluate(() => window.cardiaEp.setLanguage('tr'));
    await page.locator('[data-ep-pharma-control=example]').selectOption('noninduced');
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.match(await pharmaMeasure('induced'), /YokYok/);
    assert.match(await pharma.locator('.ep-pace-result').textContent(), /aritmiyi dışlamaz/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    if (!(await page.locator('[data-ep-pharma-phase=before]').isVisible())) await page.locator('[data-sheet=learn]').click();
    await pharma.scrollIntoViewIfNeeded();
    const mobilePharma = await pharma.boundingBox();
    assert.ok(mobilePharma.x >= 0 && mobilePharma.x + mobilePharma.width <= 391, 'drug controls fit the mobile viewport');
    await page.locator('[data-ep-pharma-phase=before]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().phase), 'before', 'mobile before button works');
    await page.locator('[data-ep-pharma-phase=after]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().phase), 'after', 'mobile after button works');
    await page.setViewportSize({ width: 1300, height: 900 });

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

    // Atrial pacing laboratory (EasyECG report phase A): the manifest pathway case is listed in the
    // Maneuvers tab, the input changes the recording, the route question grades the test beat, and
    // the 3D routes appear only after the answer; a non-capturing S2 asks no route question.
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    assert.equal(await page.locator('[data-ep-pace]').isVisible(), true, 'pacing laboratory in the Maneuvers tab');
    const pace = (key, value) => page.evaluate(([key, value]) => { const el = document.querySelector(`[data-ep-pace-control="${key}"]`); el.value = String(value); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }, [key, value]);
    await pace('site', 'cs-dist');
    await page.locator('[data-ep-pace-action=deliver]').click();
    const paced = await page.evaluate(() => window.cardiaEp.getRecording());
    assert.equal(paced.lab, 'pacing');
    assert.equal(paced.test.answer, 'ap', 'distal CS pacing: full preexcitation');
    assert.deepEqual(await page.evaluate(() => window.heart.getEpZoneOptions().paths), [], '3D routes hidden before the answer');
    await page.locator('[data-ep-pace-answer=ap]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-grade').getAttribute('data-grade'), 'correct');
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('EP pacing path: ap').visible), true, 'pathway route drawn after the answer');
    await pace('site', 'hra');
    await pace('s2', 260);
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().reason), 'apRefractoryEcho', 'S2 below the pathway refractory period');
    await page.locator('[data-ep-pace-answer=fusion]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-grade').getAttribute('data-grade'), 'incorrect');
    assert.deepEqual(await page.evaluate(() => window.heart.getEpZoneOptions()), { halo: false, circuit: 'orthodromic', paths: ['avn'], origin: null }, 'nodal route and orthodromic echo circuit');
    await pace('s2', 190);
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-result').getAttribute('data-result'), 'invalidCapture');
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-answers').isHidden(), true, 'no route question without capture');
    await page.locator('[data-ep-case]').selectOption('avnrt-typical');
    await pace('s2', 310);
    await page.locator('[data-ep-pace-action=deliver]').click();
    await pace('s2', 300);
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-compare').getAttribute('data-jump'), 'true', 'AH jump measured against the previous delivery');
    await page.locator('[data-ep-pace-answer=avn-slow]').click();
    // Another recording on the strip hides the laboratory's result and question (no stale answer).
    await page.locator('#egm-panel [data-egm-scenario]').first().click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-quiz').isHidden(), true, 'quiz hidden while a clip is shown');
    assert.deepEqual(await page.evaluate(() => window.heart.getEpZoneOptions().paths), [], 'no pacing routes for a clip');
    await page.locator('[data-ep-pace-control=mode]').selectOption('incremental');
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-compare').isHidden(), true, 'no stale comparison after an incremental delivery');
    // A pacing-only case entered from Diagnosis shows no stale strip before the first delivery.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    await page.locator('[data-ep-section=maneuver]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getState().caseId), 'ap-left-manifest', 'case kept in the Maneuvers tab');
    assert.equal(await page.locator('#egm-panel .egm-canvas').isHidden(), true, 'no strip before a delivery');
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('#egm-panel .egm-canvas').isVisible(), true, 'strip after the delivery');

    // Narrow QRS task (EasyECG report phase B): hidden case, neutral title and zone until the answer,
    // each delivered maneuver classified in the ledger from its events.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.evaluate(() => window.cardiaEp.task.start('pjrt'));
    assert.match(await page.locator('#egm-panel .egm-title').textContent(), /^Görev \d+: Taşikardi kaydı$/, 'neutral task title');
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), null, 'zone hidden during the task');
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().channels.includes('abl-d')), false, 'no ablation catheter on the task strip');
    const taskSim = page.locator('[data-ep-task-sim]');
    await taskSim.locator('[data-ep-task-sim-control=maneuver]').selectOption('his-pvc');
    await page.evaluate(() => { const el = document.querySelector('[data-ep-task-sim-control=timing]'); el.value = '15'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await taskSim.locator('[data-ep-task-sim-action=deliver]').click();
    assert.match(await page.locator('#egm-panel .egm-title').textContent(), /His-refrakter PVC$/);
    const cells = await page.locator('[data-ep-task-ledger] tr:last-child td[data-state]').evaluateAll((tds) => tds.map((td) => td.dataset.state));
    assert.deepEqual(cells, ['against', 'against', 'neutral', 'supports', 'neutral'], 'A delayed by a His-refractory PVC supports PJRT');
    await page.locator('[data-ep-task-answer]').selectOption('pjrt');
    await page.locator('[data-ep-task-action=answer]').click();
    assert.equal(await page.locator('[data-ep-task] .ep-pace-grade').getAttribute('data-grade'), 'correct');
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), 'inferior-paraseptal', 'zone revealed after the answer');
    assert.equal(await taskSim.isHidden(), true, 'no maneuvers after the answer');
    assert.equal(await page.evaluate(() => window.cardiaEp.task.getEvidence().length), 2, 'evidence closed with the answer');

    // Source region (phase C): the 12 leads are drawn, an overlapping pattern grades as compatible,
    // the 3D marker appears after the answer; an atrial focus puts its catheter activation on the strip.
    await page.evaluate(() => window.cardiaEp.origin.show('pvc-rvot-v3'));
    assert.equal(await page.locator('[data-ep-origin] .ecg12-canvas').isVisible(), true, '12-lead canvas');
    assert.ok(await page.locator('[data-ep-origin] .ecg12-canvas').evaluate((c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 1 && v > 200)), '12-lead traces drawn');
    assert.equal(await page.evaluate(() => window.heart.getEpZoneOptions().origin), null, 'no marker before the answer');
    await page.locator('[data-ep-origin-answer="lvot-cusp"]').click();
    assert.equal(await page.locator('[data-ep-origin] .ep-pace-grade').getAttribute('data-grade'), 'compatible');
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('EP origin region: rvot').visible), true, 'source region marked in 3D');
    await page.evaluate(() => window.cardiaEp.origin.show('pac-rspv'));
    assert.notEqual(await page.evaluate(() => window.cardiaEp.getRecording()?.lab), 'origin', 'catheter strip held back until the answer');
    assert.equal(await page.evaluate(() => window.heart.getEpZoneOptions().origin), null, 'marker cleared with the next example');
    await page.locator('[data-ep-origin-answer="rspv"]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().lab), 'origin', 'catheter activation on the strip after the answer');
    assert.match(await page.locator('[data-ep-origin]').textContent(), /örnekleme sınırı/, 'sampling limit explained');
    await page.locator('[data-ep-case]').selectOption({ index: 1 });
    assert.equal(await page.evaluate(() => window.heart.getEpZoneOptions().origin), null, 'marker cleared by a case change');
    await page.evaluate(() => window.cardiaEp.setLanguage('en'));
    assert.match(await page.locator('[data-ep-task] summary').textContent(), /narrow QRS/i, 'task panel follows the language');
    await page.evaluate(() => window.cardiaEp.setLanguage('tr'));

    // Advanced cases (phase D): the BBR diagnosis carries H before V on the
    // strip, and the fascicular VT entrainment clip lives in the Maneuvers tab.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('bbr-vt');
    await page.locator('[data-egm-scenario=bbr-vt]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /HV \(VT\) 95 ms/, 'BBR VT HV measured from events');
    await page.locator('[data-ep-evidence]').click();
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), 'right-bundle', 'right bundle zone revealed');
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('fascicular-vt');
    await page.locator('[data-egm-scenario=fvt-entrain]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /P1-P1 \(pacing\) 310 ms/, 'entrainment P1 cycle measured');
    assert.match(await page.locator('.ep-card').textContent(), /eksitabl/i, 'entrain-rv card rendered');

    // PVI exercise: the Treatment tab of the AF case activates the 3D rings;
    // burning a full ring silences the vein, all four return sinus, reset restores AF.
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-ep-case]').selectOption('af-pvi');
    assert.equal(await page.locator('[data-ep-pvi]').isVisible(), true, 'PVI panel in the Treatment tab');
    assert.equal(await page.evaluate(() => window.heart.pvi.isActive() && window.heart.pvi.dotCount() === 40), true, '40 candidate dots over 4 veins');
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording()?.lab), 'pvi', 'PVI strip on open');
    assert.equal(await page.evaluate(() => { const r = window.cardiaEp.getRecording(); return r.events.pv.some((e) => e.type === 'PV'); }), true, 'PV potentials while conducting');
    await page.evaluate(() => { for (let i = 0; i < 10; i++) window.heart.pvi.burn('lspv', i); });
    assert.equal(await page.evaluate(() => { const r = window.cardiaEp.getRecording(); return r.events.pv.some((e) => e.type === 'PV'); }), false, 'entrance block: PV potentials gone');
    assert.match(await page.locator('[data-ep-pvi-veins]').textContent(), /10 \/ 10/, 'vein progress rendered');
    await page.evaluate(() => { for (const v of ['lipv', 'rspv', 'ripv']) for (let i = 0; i < 10; i++) window.heart.pvi.burn(v, i); });
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().sinus), true, 'sinus after all four rings');
    await page.locator('[data-ep-pvi-action=reset]').click();
    assert.equal(await page.evaluate(() => window.cardiaEp.getRecording().sinus), false, 'reset restores AF');
    await page.locator('[data-ep-section=diagnosis]').click();
    assert.equal(await page.evaluate(() => window.heart.pvi.isActive()), false, 'rings retire outside the Treatment tab');

    // Leaving the mode clears the zone and the circuit.
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.heart.getEpZone()), null);
    assert.deepEqual(errors, []);
    console.log('PASS ep-flow: channel/zoom/inspection state, interactive maneuvers, atropine/Isuprel before-after examples and mobile controls, circuits, AT map, CTI and para-Hisian flows, Halo/CS identity, full screen portrait/landscape, atrial pacing laboratory, narrow QRS task, PAC/PVC source region, phase D cases, PVI exercise');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
