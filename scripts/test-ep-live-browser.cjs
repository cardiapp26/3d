/**
 * Live EP recording system in the browser: the "Live recording" tab replaces
 * the lesson content, the monitor sweeps, a programmed S2 induces AVNRT in
 * the dual-pathway substrate, freeze enables review and vertical calipers,
 * cardioversion restores sinus rhythm, and the lesson tabs come back.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('[data-ep-section=live]').click();
    assert.equal(await page.locator('.ep-lesson').isHidden(), true, 'lesson content hidden');
    assert.equal(await page.locator('[data-ep-live]').isVisible(), true, 'live laboratory shown');
    assert.equal(await page.evaluate(() => window.cardiaEp.getState().live), true);

    // The monitor sweeps on its own (animation loop).
    const t0 = await page.evaluate(() => window.cardiaEp.live.getState().now);
    await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => window.cardiaEp.live.getState().now) > t0 + 300, 'simulation time advances');
    const canvas = await page.evaluate(() => { const c = document.querySelector('.ep-live-canvas'); return { w: c.width, h: c.clientHeight }; });
    assert.ok(canvas.w > 400 && canvas.h >= 300, `monitor sized ${JSON.stringify(canvas)}`);

    // Freeze to step deterministically; S1 600 × 8 + S2 370 from HRA induces AVNRT.
    await page.locator('[data-ep-live-run]').click();
    await page.locator('[data-ep-live-case]').selectOption('avnrt-typical');
    await page.locator('[data-ep-live-stim=s1]').fill('600');
    await page.locator('[data-ep-live-stim=s2]').fill('370');
    await page.locator('[data-ep-live-action=pace]').click();   // resumes the sweep
    await page.locator('[data-ep-live-run]').click();           // freeze again, step by hand
    await page.evaluate(() => { window.cardiaEp.live.advance(9000); });
    const iv = await page.evaluate(() => window.cardiaEp.live.intervals());
    assert.ok(iv.rr > 330 && iv.rr < 370 && iv.va <= 40, `AVNRT induced: ${JSON.stringify(iv)}`);
    assert.match(await page.locator('[data-ep-live-intervals]').textContent(), /VA 3\d ms/);

    // Frozen: review slider active; two clicks place vertical calipers.
    assert.equal(await page.locator('[data-ep-live-review]').isDisabled(), false, 'review enabled when frozen');
    await page.locator('[data-ep-live-caliper]').click();
    const box = await page.locator('.ep-live-canvas').boundingBox();
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.6);
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
    const cal = await page.evaluate(() => window.cardiaEp.live.getState().caliper);
    assert.ok(cal.a != null && cal.b != null && cal.b > cal.a, `caliper placed ${JSON.stringify(cal)}`);
    assert.match(await page.locator('.ep-live-info').textContent(), /Kaliper: \d+ ms/);

    // Cardioversion: sinus rhythm returns.
    await page.locator('[data-ep-live-action=shock]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(6000); });
    assert.equal((await page.evaluate(() => window.cardiaEp.live.intervals())).rr, 800, 'sinus after cardioversion');

    // Hidden case: the name is withheld until the diagnosis is answered; hints follow.
    await page.evaluate(() => window.cardiaEp.live.setCase('flutter-cti', { hidden: true }));
    assert.equal(await page.locator('[data-ep-live-case]').inputValue(), 'hidden', 'name hidden');
    await page.locator('[data-ep-live-diagnose]').click();
    await page.locator('[data-ep-live-answer=avnrt-typical]').click();
    assert.match(await page.locator('[data-ep-live-quiz] .ep-pace-result').textContent(), /Yanlış\. Doğru yanıt: Tipik \(CTI bağımlı\) atriyal flutter/);
    assert.equal(await page.locator('[data-ep-live-case]').inputValue(), 'flutter-cti', 'name revealed after the answer');
    assert.equal(await page.locator('[data-ep-live-hint-list] li').count() >= 3, true, 'hints shown');

    // RF: induce flutter, ablate the CTI; the lesion ends it.
    await page.locator('[data-ep-live-stim=s1]').fill('250');
    await page.locator('[data-ep-live-action=burst]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(5000); });
    assert.equal(await page.evaluate(() => window.cardiaEp.live.status().flutterActive), true, 'flutter induced');
    await page.locator('[data-ep-live-target]').selectOption('cti');
    await page.locator('[data-ep-live-rf]').click();   // resumes the sweep
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(5000); });
    assert.equal(await page.evaluate(() => window.cardiaEp.live.status().flutterActive), false, 'CTI lesion ends flutter');
    assert.match(await page.locator('[data-ep-live-lesion]').textContent(), /CTI bloğu/);
    assert.equal(await page.evaluate(() => window.cardiaEp.live.getState().rfOn), false, 'RF stops when the lesion completes');

    // Maneuvers: His-refractory PVC advances the atrium in ORT; V overdrive reads AVNRT.
    const runCase = async (id, site, s2) => {
      await page.evaluate((c) => window.cardiaEp.live.setCase(c), id);
      await page.locator('[data-ep-live-stim=site]').selectOption(site);
      await page.locator('[data-ep-live-stim=s1]').fill('600');
      await page.locator('[data-ep-live-stim=n]').fill('8');
      await page.locator('[data-ep-live-stim=s2]').fill(String(s2));
      await page.locator('[data-ep-live-action=pace]').click();
      await page.locator('[data-ep-live-run]').click();
      await page.evaluate(() => { window.cardiaEp.live.advance(8000); });
    };
    await runCase('ort-left', 'rv', 250);
    await page.locator('[data-ep-live-maneuver=his-pvc]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(3000); });
    assert.match(await page.locator('[data-ep-live-maneuver-result]').textContent(), /erken geldi.*aksesuar yol var/);
    await runCase('avnrt-typical', 'hra', 370);
    await page.locator('[data-ep-live-maneuver=v-od]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(12000); });
    const vod = await page.locator('[data-ep-live-maneuver-result]').textContent();
    assert.match(vod, /yanıt V-A-V.*AVNRT ile uyumlu/, vod);

    // Protocol: incremental atrial pacing finds the AV block cycle length.
    await page.evaluate(() => window.cardiaEp.live.setCase('normal'));
    await page.locator('[data-ep-live-stim=site]').selectOption('hra');
    await page.locator('[data-ep-live-protocol]').selectOption('avbcl');
    await page.locator('[data-ep-live-protocol-run]').click();
    await page.locator('[data-ep-live-run]').click();
    await page.evaluate(() => { window.cardiaEp.live.advance(100000); });
    const proto = await page.evaluate(() => window.cardiaEp.live.protocol());
    assert.equal(proto.running, false);
    assert.match(proto.summary, /AV blok siklusu \(Wenckebach\): 280 ms/);
    assert.ok(await page.locator('[data-ep-live-protocol-rows] li').count() >= 10, 'protocol rows listed');

    // Back to a lesson section.
    await page.locator('[data-ep-section=diagnosis]').click();
    assert.equal(await page.locator('.ep-lesson').isVisible(), true);
    assert.equal(await page.locator('[data-ep-live]').isHidden(), true);
    assert.deepEqual(errors, []);
    console.log('PASS ep-live-browser: live tab, sweeping monitor, S2-induced AVNRT, freeze + review + calipers, cardioversion, hidden case quiz and hints, flutter + CTI RF, His-refractory PVC, V overdrive verdict, AVBCL protocol, back to lessons');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
