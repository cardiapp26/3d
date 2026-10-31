/**
 * EPS laboratory in the browser: the full-screen workstation (monitor beside
 * the console), Space freezes the sweep, the language switch, a programmed
 * S2 induces AVNRT in the dual-pathway substrate, freeze enables review and vertical calipers,
 * cardioversion restores sinus rhythm, hidden case quiz, RF, maneuvers and
 * the AV block cycle length protocol.
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
    await page.goto(`${APP}/`);
    await page.waitForSelector('[data-ep-live]');
    assert.equal(await page.locator('[data-ep-live]').isVisible(), true, 'live laboratory shown');

    // Workstation: the monitor fills most of the screen, the console is beside it.
    const layout = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return { canvas: r('.ep-live-canvas'), deck: r('.ep-live-console'), scroll: document.documentElement.scrollHeight };
    });
    assert.ok(layout.canvas.height >= 900 * 0.55 && layout.canvas.width >= 900, `monitor fills the screen ${JSON.stringify(layout.canvas)}`);
    assert.ok(layout.deck.left >= layout.canvas.right, 'console to the right of the monitor');
    assert.ok(layout.scroll <= 900, 'no page scroll on desktop');

    // The monitor sweeps on its own (animation loop).
    const t0 = await page.evaluate(() => window.epsLab.live.getState().now);
    await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => window.epsLab.live.getState().now) > t0 + 300, 'simulation time advances');

    // Space freezes and resumes; the language switch relabels the console.
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), false, 'Space freezes');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), true, 'Space resumes');
    // With a console button focused (after a click), Space still toggles the sweep and does not press the button.
    await page.locator('[data-ep-live-waves]').focus();
    const wavesBefore = await page.locator('[data-ep-live-waves]').getAttribute('aria-pressed');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), false, 'Space freezes with a button focused');
    assert.equal(await page.locator('[data-ep-live-waves]').getAttribute('aria-pressed'), wavesBefore, 'the focused button is not pressed');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), true, 'Space resumes with a button focused');
    // With a select or number input focused, Space still toggles the sweep.
    await page.locator('[data-ep-live-speed]').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), false, 'Space freezes with speed select focused');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), true, 'Space resumes with speed select focused');
    await page.locator('[data-ep-live-stim=s1]').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), false, 'Space freezes with S1 number input focused');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().running), true, 'Space resumes with S1 number input focused');
    // Wave names: on in the running sweep, kept when frozen, shared with the lesson strips, off again.
    await page.locator('[data-ep-live-waves]').click();
    assert.equal(await page.locator('[data-ep-live-waves]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().waves), true, 'wave names in the live sweep');
    await page.locator('[data-ep-live-run]').click();
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().waves), true, 'kept on the frozen strip');
    await page.locator('[data-ep-live-run]').click();
    await page.locator('[data-ep-section=diagnosis]').click();
    assert.equal(await page.locator('[data-ep-waves]').getAttribute('aria-pressed'), 'true', 'same choice on the lesson strip');
    await page.locator('[data-ep-section=live]').click();
    await page.reload();
    await page.waitForSelector('[data-ep-live]');
    assert.equal(await page.locator('[data-ep-live-waves]').getAttribute('aria-pressed'), 'true', 'choice remembered');
    await page.locator('[data-ep-live-waves]').click();
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().waves), false, 'turned off');

    // Ladder diagram: a strip under the monitor on the same time axis; kept frozen, remembered, off again.
    assert.equal(await page.locator('[data-ep-live-ladder-canvas]').isHidden(), true, 'ladder off by default');
    await page.locator('[data-ep-live-ladder]').click();
    assert.equal(await page.locator('[data-ep-live-ladder-canvas]').isVisible(), true, 'ladder shown');
    const ladderBox = await page.locator('[data-ep-live-ladder-canvas]').boundingBox();
    const stripBox = await page.locator('.ep-live-canvas').boundingBox();
    assert.ok(ladderBox.y >= stripBox.y + stripBox.height - 1 && Math.abs(ladderBox.width - stripBox.width) < 2, 'under the strip, same width');
    await page.locator('[data-ep-live-run]').click();
    assert.equal(await page.locator('[data-ep-live-ladder-canvas]').isVisible(), true, 'kept on the frozen strip');
    await page.locator('[data-ep-live-run]').click();
    await page.reload();
    await page.waitForSelector('[data-ep-live]');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().ladder), true, 'ladder choice remembered');
    await page.locator('[data-ep-live-ladder]').click();
    assert.equal(await page.locator('[data-ep-live-ladder-canvas]').isHidden(), true, 'ladder off');
    // Ladder on the channels: drawn on the strip itself, remembered, free during a hidden case.
    await page.locator('[data-ep-live-links]').click();
    assert.equal(await page.locator('[data-ep-live-links]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().links), true);

    await page.locator('[data-app-lang-option=en]').click();
    assert.equal(await page.locator('[data-ep-live-action=shock]').textContent(), 'Cardiovert');
    assert.match(await page.locator('[data-app-disclaimer]').textContent(), /teaching only/);
    await page.locator('[data-app-lang-option=tr]').click();
    assert.equal(await page.locator('[data-ep-live-action=shock]').textContent(), 'Kardiyoversiyon');

    // Freeze to step deterministically; S1 600 × 8 + S2 370 from HRA induces AVNRT.
    await page.locator('[data-ep-live-run]').click();
    await page.locator('[data-ep-live-case]').selectOption('avnrt-typical');
    await page.locator('[data-ep-live-stim=s1]').fill('600');
    await page.locator('[data-ep-live-stim=s2]').fill('370');
    await page.locator('[data-ep-live-action=pace]').click();   // resumes the sweep
    await page.locator('[data-ep-live-run]').click();           // freeze again, step by hand
    await page.evaluate(() => { window.epsLab.live.advance(9000); });
    const iv = await page.evaluate(() => window.epsLab.live.intervals());
    assert.ok(iv.rr > 330 && iv.rr < 370 && iv.va <= 40, `AVNRT induced: ${JSON.stringify(iv)}`);
    assert.match(await page.locator('[data-ep-live-intervals]').textContent(), /VA 3\d ms/);
    // Stop pacing: the stimuli stop at once, the induced tachycardia goes on and the status says so.
    await page.locator('[data-ep-live-run]').click();
    await page.locator('[data-ep-live-action=stop]').click();
    await page.waitForFunction(() => /ritim sürüyor/.test(document.querySelector('.ep-live-info')?.textContent || ''), null, { timeout: 15000 });
    await page.locator('[data-ep-live-run]').click();

    // Frozen: review slider active; two clicks place vertical calipers.
    assert.equal(await page.locator('[data-ep-live-review]').isDisabled(), false, 'review enabled when frozen');
    await page.locator('[data-ep-live-caliper]').click();
    const box = await page.locator('.ep-live-canvas').boundingBox();
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.6);
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
    const cal = await page.evaluate(() => window.epsLab.live.getState().caliper);
    assert.ok(cal.a != null && cal.b != null && cal.b > cal.a, `caliper placed ${JSON.stringify(cal)}`);
    assert.match(await page.locator('.ep-live-info').textContent(), /Kaliper: \d+ ms/);
    assert.doesNotMatch(await page.locator('.ep-live-info').textContent(), /sürükle/, 'no drag hint on the live monitor');

    // Cardioversion: sinus rhythm returns.
    await page.locator('[data-ep-live-action=shock]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(6000); });
    assert.equal((await page.evaluate(() => window.epsLab.live.intervals())).rr, 800, 'sinus after cardioversion');

    // Hidden case: the name is withheld until the diagnosis is answered; hints follow.
    await page.evaluate(() => window.epsLab.live.setCase('flutter-cti', { hidden: true }));
    assert.equal(await page.locator('[data-ep-live-case]').inputValue(), 'hidden', 'name hidden');
    assert.equal(await page.locator('[data-ep-live-ladder]').isDisabled(), true, 'ladder locked during a hidden case');
    assert.equal(await page.locator('[data-ep-live-links]').isDisabled(), false, 'activations still joined on the channels (no conduction lines)');
    await page.locator('[data-ep-live-diagnose]').click();
    await page.locator('[data-ep-live-answer=avnrt-typical]').click();
    assert.equal(await page.locator('[data-ep-live-ladder]').isDisabled(), false, 'ladder free after the answer');
    assert.match(await page.locator('[data-ep-live-quiz] .ep-pace-result').textContent(), /Yanlış\. Doğru yanıt: Tipik \(CTI bağımlı\) atriyal flutter/);
    assert.equal(await page.locator('[data-ep-live-case]').inputValue(), 'flutter-cti', 'name revealed after the answer');
    assert.equal(await page.locator('[data-ep-live-hint-list] li').count() >= 3, true, 'hints shown');

    // RF: induce flutter, ablate the CTI; the lesion ends it.
    await page.locator('[data-ep-live-stim=s1]').fill('250');
    await page.locator('[data-ep-live-action=burst]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(5000); });
    assert.equal(await page.evaluate(() => window.epsLab.live.status().flutterActive), true, 'flutter induced');
    await page.locator('[data-ep-live-target]').selectOption('cti');
    await page.locator('[data-ep-live-rf]').click();   // resumes the sweep
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(5000); });
    assert.equal(await page.evaluate(() => window.epsLab.live.status().flutterActive), false, 'CTI lesion ends flutter');
    assert.match(await page.locator('[data-ep-live-lesion]').textContent(), /CTI bloğu/);
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().rfOn), false, 'RF stops when the lesion completes');

    // Maneuvers: His-refractory PVC advances the atrium in ORT; V overdrive reads AVNRT.
    const runCase = async (id, site, s2) => {
      await page.evaluate((c) => window.epsLab.live.setCase(c), id);
      await page.locator('[data-ep-live-stim=site]').selectOption(site);
      await page.locator('[data-ep-live-stim=s1]').fill('600');
      await page.locator('[data-ep-live-stim=n]').fill('8');
      await page.locator('[data-ep-live-stim=s2]').fill(String(s2));
      await page.locator('[data-ep-live-action=pace]').click();
      await page.locator('[data-ep-live-run]').click();
      await page.evaluate(() => { window.epsLab.live.advance(8000); });
    };
    await runCase('ort-left', 'rv', 250);
    await page.locator('[data-ep-live-maneuver=his-pvc]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(3000); });
    assert.match(await page.locator('[data-ep-live-maneuver-result]').textContent(), /erken geldi.*aksesuar yol var/);
    await runCase('avnrt-typical', 'hra', 370);
    await page.locator('[data-ep-live-maneuver=v-od]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(12000); });
    const vod = await page.locator('[data-ep-live-maneuver-result]').textContent();
    assert.match(vod, /cPPI−TCL \d+ ms.*yanıt V-A-V.*AVNRT lehine/, vod);
    await page.locator('[data-ep-live-maneuver=a-od]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(8000); });
    const aod = await page.locator('[data-ep-live-maneuver-result]').textContent();
    assert.match(aod, /VA\(SVT\) \d+ · VA\(dönüş\) \d+ · ΔVA 0 ms.*ΔVA < 10 ms \(VA bağlı\): AVNRT veya ORT lehine/, aod);

    // Protocol: incremental atrial pacing finds the AV block cycle length.
    await page.evaluate(() => window.epsLab.live.setCase('normal'));
    await page.locator('[data-ep-live-stim=site]').selectOption('hra');
    await page.locator('[data-ep-live-protocol]').selectOption('avbcl');
    await page.locator('[data-ep-live-protocol-run]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(100000); });
    const proto = await page.evaluate(() => window.epsLab.live.protocol());
    assert.equal(proto.running, false);
    assert.match(proto.summary, /AV blok siklusu \(Wenckebach\): 290 ms/);
    assert.match(proto.summary, /PR hiçbir adımda PP'yi aşmadı/, 'normal node: no PR > PP');

    // Dual AV nodal physiology with incremental pacing: AH jump, then PR > PP; the train stops at the first block.
    await page.evaluate(() => window.epsLab.live.setCase('avnrt-typical'));
    await page.locator('[data-ep-live-protocol]').selectOption('avbcl');
    await page.locator('[data-ep-live-protocol-run]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(120000); });
    const dual = await page.evaluate(() => window.epsLab.live.protocol());
    assert.equal(dual.running, false, 'protocol ends at the first block');
    assert.match(dual.summary, /AH sıçraması 370 ms'de/);
    assert.match(dual.summary, /PR, PP'yi 350 ms'de aştı \(AH \d+ ms\): uyarı yavaş yoldan iniyor; dual AV düğüm fizyolojisini destekler/);
    assert.ok((await page.locator('[data-ep-live-protocol-rows] li').allTextContents()).some((t) => /^S1 350: 1:1, AH \d+, PR \d+ > PP$/.test(t)), 'row marks PR > PP');
    assert.ok(await page.locator('[data-ep-live-protocol-rows] li').count() >= 10, 'protocol rows listed');

    // Programmed stimulation: auto decrement of S2 from a mid CS bipole finds the AV nodal and atrial ERPs.
    await page.evaluate(() => window.epsLab.live.setCase('normal'));
    assert.ok(await page.locator('[data-ep-live-stim=site] option[value=cs-56]').count(), 'every CS bipole is a pacing site');
    await page.locator('[data-ep-live-stim=site]').selectOption('cs-56');
    await page.locator('[data-ep-live-stim=s1]').fill('600');
    await page.locator('[data-ep-live-stim=s2]').fill('320');
    await page.locator('[data-ep-live-stim=s3]').fill('0');
    await page.locator('[data-ep-live-stim=step]').fill('20');
    await page.locator('[data-ep-live-action=prog]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(90000); });
    const prog = await page.evaluate(() => window.epsLab.live.programmed());
    assert.equal(prog.running, false, 'run ends at the refractory period');
    assert.match(await page.locator('[data-ep-live-prog-summary]').textContent(), /AERP 2\d0 · AV nodal ERP 2\d0\. Refrakter periyoda ulaşıldı\./);
    assert.match((await page.locator('[data-ep-live-prog-rows] li').allTextContents())[0], /^S2 320: A-H \d+$/);
    // Typical AVNRT from the HRA: the jump, the echo and the induction stop the run.
    await page.evaluate(() => window.epsLab.live.setCase('avnrt-typical'));
    await page.locator('[data-ep-live-stim=site]').selectOption('hra');
    await page.locator('[data-ep-live-stim=s2]').fill('400');
    await page.locator('[data-ep-live-stim=step]').fill('10');
    await page.locator('[data-ep-live-action=prog]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(40000); });
    assert.match(await page.locator('[data-ep-live-prog-summary]').textContent(), /sıçrama S2 370 · echo S2 370 · taşikardi S2 370\. Taşikardi başladığı için durdu\./);
    assert.match(await page.locator('[data-ep-live-intervals]').textContent(), /^Hız 1[5-9]\d\/dk/, 'live heart rate of the tachycardia');
    // Continuous pacing: runs at S1 until stopped, a new S1 applies at once.
    await page.evaluate(() => window.epsLab.live.setCase('normal'));
    await page.locator('[data-ep-live-stim=s1]').fill('500');
    await page.locator('[data-ep-live-action=continuous]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(6000); });
    assert.equal((await page.evaluate(() => window.epsLab.live.intervals())).pp, 500);
    await page.locator('[data-ep-live-stim=s1]').fill('400');
    await page.locator('[data-ep-live-stim=s1]').dispatchEvent('change');
    await page.evaluate(() => { window.epsLab.live.advance(3000); });
    assert.equal((await page.evaluate(() => window.epsLab.live.intervals())).pp, 400, 'new S1 applied');
    assert.match(await page.locator('[data-ep-live-intervals]').textContent(), /^Hız 150\/dk/);
    await page.locator('[data-ep-live-action=continuous]').click();
    await page.evaluate(() => { window.epsLab.live.advance(4000); });
    assert.equal((await page.evaluate(() => window.epsLab.live.intervals())).pp, 800, 'sinus after continuous pacing stops');

    // Recorder: per-channel gain (chooser, a click on a channel name, all channels at once).
    await page.locator('[data-ep-live-gain-ch]').selectOption('his-d');
    await page.locator('[data-ep-live-gain=up]').click();
    await page.locator('[data-ep-live-gain=up]').click();
    assert.equal((await page.evaluate(() => window.epsLab.live.getState().gains))['his-d'], 2, 'His d gain raised twice');
    assert.equal(await page.locator('[data-ep-live-gain-val]').textContent(), '×2');
    const strip = await page.locator('.ep-live-canvas').boundingBox();
    await page.mouse.click(strip.x + 12, strip.y + strip.height - 26);   // RV, the last row
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().gainCh), 'rv', 'channel name picks the gain channel');
    await page.locator('[data-ep-live-gain-ch]').selectOption('all');
    await page.locator('[data-ep-live-gain=down]').click();
    const gains = await page.evaluate(() => window.epsLab.live.getState().gains);
    assert.equal(gains['his-d'], 1.5); assert.equal(gains.rv, 0.75);
    assert.equal(await page.locator('[data-ep-live-gain-val]').textContent(), '×…', 'mixed gains');
    // Pacing artifact: the calipers across a paced HRA train read the saturated bipole; RV reads its own signal.
    for (const [k, v] of [['site', 'hra'], ['s1', '600'], ['n', '3'], ['s2', '0']]) {
      if (k === 'site') await page.locator('[data-ep-live-stim=site]').selectOption(v); else await page.locator(`[data-ep-live-stim=${k}]`).fill(v);
    }
    await page.locator('[data-ep-live-action=pace]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(3000); });
    if (!(await page.evaluate(() => window.epsLab.live.getState().caliper))) await page.locator('[data-ep-live-caliper]').click();
    const unit = (strip.height - 34) / (3 * 1.55 + 9);
    const rowY = (i) => strip.y + 18 + 3 * 1.55 * unit + (i - 3 + 0.5) * unit;   // rows 3.. are the intracardiac channels
    const across = async (y) => { await page.mouse.click(strip.x + 66, y); await page.mouse.click(strip.x + strip.width - 12, y); return page.evaluate(() => window.epsLab.live.getState().caliper); };
    const hraCal = await across(rowY(3));
    assert.equal(hraCal.ch, 'hra');
    assert.ok(hraCal.amp >= 5, `paced bipole saturates: ${JSON.stringify(hraCal)}`);
    assert.match(await page.locator('.ep-live-info').textContent(), /HRA tepe-tepe ≥ 5 mV \(satürasyon\)/);
    const rvCal = await across(rowY(11));
    assert.equal(rvCal.ch, 'rv');
    assert.ok(rvCal.amp > 0.5 && rvCal.amp < 5, `RV amplitude ${rvCal.amp}`);
    assert.match(await page.locator('.ep-live-info').textContent(), /RV tepe-tepe \d\.\d\d mV/);
    // Review page by page.
    assert.equal(await page.locator('[data-ep-live-page=next]').isDisabled(), true, 'already at the current page');
    await page.locator('[data-ep-live-page=prev]').click();
    const back1 = await page.evaluate(() => window.epsLab.live.getState().back);
    assert.ok(back1 > 2000, `one page back: ${back1}`);
    assert.match(await page.locator('[data-ep-live-page-at]').textContent(), /^\d+\.\d s geride$/);
    await page.locator('[data-ep-live-page=first]').click();
    assert.ok(await page.evaluate(() => window.epsLab.live.getState().back) >= back1, 'oldest page');
    await page.locator('[data-ep-live-page=last]').click();
    assert.equal(await page.evaluate(() => window.epsLab.live.getState().back), 0);
    assert.equal(await page.locator('[data-ep-live-page-at]').textContent(), 'şimdi');

    // Drugs and coach: echo-only AVNRT is not inducible at baseline, isoproterenol (S1 below the sinus cycle) induces it.
    for (const id of ['avnrt-jump', 'avnrt-echo', 'va-block']) assert.ok(await page.locator(`[data-ep-live-case] option[value=${id}]`).count(), `case ${id}`);
    await page.evaluate(() => window.epsLab.live.setCase('avnrt-echo'));
    assert.match(await page.locator('.ep-live-drugs .ep-pace-note').textContent(), /dekrement protokolü/);
    for (const [k, v] of [['s1', '600'], ['n', '8'], ['s2', '400'], ['s3', '0'], ['step', '10']]) await page.locator(`[data-ep-live-stim=${k}]`).fill(v);
    await page.locator('[data-ep-live-action=prog]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(180000); });
    assert.match(await page.locator('[data-ep-live-prog-summary]').textContent(), /sıçrama S2 370 · echo S2 370\. Refrakter periyoda ulaşıldı\./);
    assert.match(await page.locator('[data-ep-live-coach] li').first().textContent(), /echo var ama taşikardi sürmedi.*İzoproterenol ile/);
    await page.locator('[data-ep-live-drug=iso]').click();
    assert.equal(await page.locator('[data-ep-live-drug=iso]').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('[data-ep-live-coach] li').first().textContent(), /^İzoproterenol başladı, sinüs siklusu 560 ms/);
    await page.evaluate(() => { window.epsLab.live.advance(4000); });
    assert.equal((await page.evaluate(() => window.epsLab.live.intervals())).pp, 560, 'faster sinus on isoproterenol');
    await page.locator('[data-ep-live-stim=s1]').fill('500');
    await page.locator('[data-ep-live-action=prog]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.epsLab.live.advance(90000); });
    assert.match(await page.locator('[data-ep-live-prog-summary]').textContent(), /taşikardi S2 300\. Taşikardi başladığı için durdu\./);
    assert.match(await page.locator('[data-ep-live-coach] li').first().textContent(), /^İlaç altında S2 300 ms ile taşikardi başladı/);
    assert.equal(await page.locator('[data-ep-live-coach] li').count(), 3, 'run, drug and run notes');
    await page.evaluate(() => window.epsLab.live.setCase('normal'));
    assert.equal(await page.locator('[data-ep-live-drug=iso]').getAttribute('aria-pressed'), 'false', 'a new case starts without drugs');
    assert.equal(await page.locator('[data-ep-live-coach] li').count(), 0);

    // AF mapping: Space plays and pauses the activation / phase map (a focused button is not pressed); no playback on the DF map.
    await page.locator('[data-ep-section=afmap]').click();
    await page.waitForFunction(() => window.epsLab.panel.afmap.getState().active);
    await page.locator('[data-afmap-truth]').focus();
    const truthBefore = await page.evaluate(() => window.epsLab.panel.afmap.getState().truth);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.panel.afmap.getState().playing), true, 'Space plays the AF map');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.panel.afmap.getState().playing), false, 'Space pauses the AF map');
    assert.equal(await page.evaluate(() => window.epsLab.panel.afmap.getState().truth), truthBefore, 'the focused button is not pressed');
    await page.evaluate(() => window.epsLab.panel.afmap.set({ map: 'df' }));
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.epsLab.panel.afmap.getState().playing), false, 'DF map: nothing to play');

    assert.deepEqual(errors, []);
    console.log('PASS ep-live-browser: full-screen workstation, Space freeze, wave names on/off (live, frozen, lessons, remembered), ladder on the channels, ladder diagram on/off, TR/EN switch, sweeping monitor, S2-induced AVNRT, freeze + review + calipers, cardioversion, hidden case quiz and hints, flutter + CTI RF, His-refractory PVC, V overdrive verdict, AVBCL protocol, incremental pacing with AH jump and PR > PP, auto-decrement S2 from a CS bipole (ERPs) and in AVNRT (jump, echo, induction), continuous pacing with live S1 change and heart rate, per-channel gain, saturating pacing artifact and caliper amplitude, page-by-page review, drugs (isoproterenol) with the coach on an echo-only AVNRT, Space play / pause on the AF map');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
