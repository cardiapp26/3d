/**
 * EP exercise panels in the browser: atropine / Isuprel examples, the
 * atrial pacing laboratory (routes on the schematic only after the answer),
 * the narrow QRS task, the PAC / PVC source region with the 12-lead ECG,
 * phase D cases and the PVI exercise on the 2D lesion map (mouse clicks and
 * keyboard on the map points).
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
    await page.goto(`${APP}/#/maneuver`);
    await page.waitForSelector('.ep-lesson');

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
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().lab), 'pharma');
    assert.match(await pharmaMeasure('pp'), /850 ms650 ms/);
    assert.match(await pharmaMeasure('drive'), /500 ms500 ms/);
    assert.match(await pharmaMeasure('ah'), /80 ms65 ms/);
    await page.locator('[data-ep-pharma-phase=before]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().phase), 'before');
    assert.match(await page.locator('.egm-title').textContent(), /Atropin.*Önce/);
    await page.locator('[data-ep-pharma-control=drug]').selectOption('isuprel');
    assert.equal(await page.locator('[data-ep-pharma-comparison]').isHidden(), true, 'new selection retires the previous comparison');
    assert.notEqual(await page.evaluate(() => window.epsLab.panel.getRecording().lab), 'pharma', 'stale EGM cleared');
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
    await page.evaluate(() => window.epsLab.setLang('en'));
    assert.match(await page.locator('.egm-title').textContent(), /Isuprel.*After/);
    assert.match(await pharmaMeasure('induced'), /AbsentPresent/);
    await page.evaluate(() => window.epsLab.setLang('tr'));
    await page.locator('[data-ep-pharma-control=example]').selectOption('noninduced');
    await page.locator('[data-ep-pharma-action=show]').click();
    assert.match(await pharmaMeasure('induced'), /YokYok/);
    assert.match(await pharma.locator('.ep-pace-result').textContent(), /aritmiyi dışlamaz/);


    // Atrial pacing laboratory (EasyECG report phase A): the manifest pathway case is listed in the
    // Maneuvers tab, the input changes the recording, the route question grades the test beat, and
    // the schematic routes appear only after the answer; a non-capturing S2 asks no route question.
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    assert.equal(await page.locator('[data-ep-pace]').isVisible(), true, 'pacing laboratory in the Maneuvers tab');
    const pace = (key, value) => page.evaluate(([key, value]) => { const el = document.querySelector(`[data-ep-pace-control="${key}"]`); el.value = String(value); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }, [key, value]);
    await pace('site', 'cs-dist');
    await page.locator('[data-ep-pace-action=deliver]').click();
    const paced = await page.evaluate(() => window.epsLab.panel.getRecording());
    assert.equal(paced.lab, 'pacing');
    assert.equal(paced.test.answer, 'ap', 'distal CS pacing: full preexcitation');
    assert.deepEqual(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().paths), [], 'routes hidden before the answer');
    await page.locator('[data-ep-pace-answer=ap]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-grade').getAttribute('data-grade'), 'correct');
    assert.equal(await page.evaluate(() => Boolean(document.querySelector('.ep-schematic [data-shape=ap]'))), true, 'pathway route drawn after the answer');
    await pace('site', 'hra');
    await pace('s2', 260);
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().reason), 'apRefractoryEcho', 'S2 below the pathway refractory period');
    await page.locator('[data-ep-pace-answer=fusion]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-grade').getAttribute('data-grade'), 'incorrect');
    assert.deepEqual(await page.evaluate(() => window.epsLab.panel.schematic.getOptions()), { zone: 'left-free-wall', halo: false, circuit: 'orthodromic', paths: ['avn'], origin: null }, 'nodal route and orthodromic echo circuit');
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
    await page.locator('[data-egm-scenario]').first().click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-quiz').isHidden(), true, 'quiz hidden while a clip is shown');
    assert.deepEqual(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().paths), [], 'no pacing routes for a clip');
    await page.locator('[data-ep-pace-control=mode]').selectOption('incremental');
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('[data-ep-pace] .ep-pace-compare').isHidden(), true, 'no stale comparison after an incremental delivery');
    // A pacing-only case entered from Diagnosis shows no stale strip before the first delivery.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    await page.locator('[data-ep-section=maneuver]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getState().caseId), 'ap-left-manifest', 'case kept in the Maneuvers tab');
    assert.equal(await page.locator('.egm-canvas').isHidden(), true, 'no strip before a delivery');
    await page.locator('[data-ep-pace-action=deliver]').click();
    assert.equal(await page.locator('.egm-canvas').isVisible(), true, 'strip after the delivery');

    // Narrow QRS task (EasyECG report phase B): hidden case, neutral title and zone until the answer,
    // each delivered maneuver classified in the ledger from its events.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.evaluate(() => window.epsLab.panel.task.start('pjrt'));
    assert.match(await page.locator('.egm-title').textContent(), /^Görev \d+: Taşikardi kaydı$/, 'neutral task title');
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().zone), null, 'zone hidden during the task');
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().channels.includes('abl-d')), false, 'no ablation catheter on the task strip');
    const taskSim = page.locator('[data-ep-task-sim]');
    await taskSim.locator('[data-ep-task-sim-control=maneuver]').selectOption('his-pvc');
    await page.evaluate(() => { const el = document.querySelector('[data-ep-task-sim-control=timing]'); el.value = '15'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await taskSim.locator('[data-ep-task-sim-action=deliver]').click();
    assert.match(await page.locator('.egm-title').textContent(), /His-refrakter PVC$/);
    const cells = await page.locator('[data-ep-task-ledger] tr:last-child td[data-state]').evaluateAll((tds) => tds.map((td) => td.dataset.state));
    assert.deepEqual(cells, ['against', 'against', 'neutral', 'supports', 'neutral'], 'A delayed by a His-refractory PVC supports PJRT');
    await page.locator('[data-ep-task-answer]').selectOption('pjrt');
    await page.locator('[data-ep-task-action=answer]').click();
    assert.equal(await page.locator('[data-ep-task] .ep-pace-grade').getAttribute('data-grade'), 'correct');
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().zone), 'inferior-paraseptal', 'zone revealed after the answer');
    assert.equal(await taskSim.isHidden(), true, 'no maneuvers after the answer');
    assert.equal(await page.evaluate(() => window.epsLab.panel.task.getEvidence().length), 2, 'evidence closed with the answer');

    // Source region (phase C): the 12 leads are drawn, an overlapping pattern grades as compatible,
    // the schematic marker appears after the answer; an atrial focus puts its catheter activation on the strip.
    await page.evaluate(() => window.epsLab.panel.origin.show('pvc-rvot-v3'));
    assert.equal(await page.locator('[data-ep-origin] .ecg12-canvas').isVisible(), true, '12-lead canvas');
    assert.ok(await page.locator('[data-ep-origin] .ecg12-canvas').evaluate((c) => c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 1 && v > 200)), '12-lead traces drawn');
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().origin), null, 'no marker before the answer');
    await page.locator('[data-ep-origin-answer="lvot-cusp"]').click();
    assert.equal(await page.locator('[data-ep-origin] .ep-pace-grade').getAttribute('data-grade'), 'compatible');
    assert.equal(await page.evaluate(() => Boolean(document.querySelector('.ep-schematic [data-shape=rvot]'))), true, 'source region marked on the schematic');
    await page.evaluate(() => window.epsLab.panel.origin.show('pac-rspv'));
    assert.notEqual(await page.evaluate(() => window.epsLab.panel.getRecording()?.lab), 'origin', 'catheter strip held back until the answer');
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().origin), null, 'marker cleared with the next example');
    await page.locator('[data-ep-origin-answer="rspv"]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().lab), 'origin', 'catheter activation on the strip after the answer');
    assert.match(await page.locator('[data-ep-origin]').textContent(), /örnekleme sınırı/, 'sampling limit explained');
    await page.locator('[data-ep-case]').selectOption({ index: 1 });
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().origin), null, 'marker cleared by a case change');
    await page.evaluate(() => window.epsLab.setLang('en'));
    assert.match(await page.locator('[data-ep-task] summary').textContent(), /narrow QRS/i, 'task panel follows the language');
    await page.evaluate(() => window.epsLab.setLang('tr'));

    // Advanced cases (phase D): the BBR diagnosis carries H before V on the
    // strip, and the fascicular VT entrainment clip lives in the Maneuvers tab.
    await page.locator('[data-ep-section=diagnosis]').click();
    await page.locator('[data-ep-case]').selectOption('bbr-vt');
    await page.locator('[data-egm-scenario=bbr-vt]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /HV \(VT\) 95 ms/, 'BBR VT HV measured from events');
    await page.locator('[data-ep-evidence]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.schematic.getOptions().zone), 'right-bundle', 'right bundle zone revealed');
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('fascicular-vt');
    await page.locator('[data-egm-scenario=fvt-entrain]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /P1-P1 \(pacing\) 310 ms/, 'entrainment P1 cycle measured');
    assert.match(await page.locator('.ep-card').textContent(), /eksitabl/i, 'entrain-rv card rendered');

    // PVI exercise: the Treatment tab of the AF case activates the 2D lesion map;
    // burning a full ring silences the vein, all four return sinus, reset restores AF.
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-ep-case]').selectOption('af-pvi');
    assert.equal(await page.locator('[data-ep-pvi]').isVisible(), true, 'PVI panel in the Treatment tab');
    assert.equal(await page.evaluate(() => window.epsLab.panel.pvi.map.isActive() && window.epsLab.panel.pvi.map.dotCount() === 40), true, '40 candidate dots over 4 veins');
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording()?.lab), 'pvi', 'PVI strip on open');
    assert.equal(await page.evaluate(() => { const r = window.epsLab.panel.getRecording(); return r.events.pv.some((e) => e.type === 'PV'); }), true, 'PV potentials while conducting');
    await page.evaluate(() => { for (let i = 0; i < 10; i++) window.epsLab.panel.pvi.map.burn('lspv', i); });
    assert.equal(await page.evaluate(() => { const r = window.epsLab.panel.getRecording(); return r.events.pv.some((e) => e.type === 'PV'); }), false, 'entrance block: PV potentials gone');
    assert.match(await page.locator('[data-ep-pvi-veins]').textContent(), /10 \/ 10/, 'vein progress rendered');
    await page.evaluate(() => { for (const v of ['lipv', 'rspv', 'ripv']) for (let i = 0; i < 10; i++) window.epsLab.panel.pvi.map.burn(v, i); });
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().sinus), true, 'sinus after all four rings');
    await page.locator('[data-ep-pvi-action=reset]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getRecording().sinus), false, 'reset restores AF');
    await page.locator('[data-ep-section=diagnosis]').click();

    // PVI by hand: clicks on the map points and the keyboard ablate them.
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-ep-case]').selectOption('af-pvi');
    await page.locator('[data-ep-pvi-action=reset]').click();
    await page.locator('[data-pvi-dot="rspv:0"]').click();
    await page.locator('[data-pvi-dot="rspv:1"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.epsLab.panel.pvi.map.burnedCount('rspv')), 2, 'mouse and keyboard ablate');
    assert.equal(await page.locator('[data-pvi-dot="rspv:0"]').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('[data-ep-pvi]').textContent(), /Şemada/);
    assert.deepEqual(errors, []);
    console.log('PASS ep-labs-browser: atropine/Isuprel examples, atrial pacing laboratory with schematic routes after the answer, narrow QRS task, PAC/PVC source region and 12 leads, phase D cases, PVI on the 2D lesion map (mouse, keyboard, entrance block, sinus, reset)');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
