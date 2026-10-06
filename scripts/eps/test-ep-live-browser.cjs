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

    assert.deepEqual(errors, []);
    console.log('PASS ep-live-browser: full-screen workstation, Space freeze, wave names on/off (live, frozen, lessons, remembered), ladder on the channels, ladder diagram on/off, TR/EN switch, sweeping monitor, S2-induced AVNRT, freeze + review + calipers, cardioversion, hidden case quiz and hints, flutter + CTI RF, His-refractory PVC, V overdrive verdict, AVBCL protocol, incremental pacing with AH jump and PR > PP');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
