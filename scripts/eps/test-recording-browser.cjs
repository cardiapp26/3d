// Real browser regression journey through the guided recording lessons:
// route, lesson navigation, step detection from state, signal-changing
// controls, noise checklist, quiz feedback, calipers, bilingual state,
// hidden-animation lifecycle, mobile layout and (optionally) offline reload.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.EPS_URL || `${(process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')}/eps`).replace(/\/$/, '');
const LESSONS = ['chain', 'filter', 'noise', 'unipolar', 'bipolar', 'spacing', 'omni', 'nearfield'];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/?lang=tr#/recording`);
    await page.locator('[data-recording]').waitFor({ state: 'visible' });
    const lab = page.locator('[data-recording]');
    const mode = async (id) => lab.locator(`[data-recording-mode=${id}]`).click();
    const control = (key) => lab.locator(`[data-recording-control=${key}]`);
    const state = () => page.evaluate(() => window.epsLab.panel.recording.getState());
    const metrics = () => page.evaluate(() => window.epsLab.panel.recording.getMetrics());
    const setRange = async (key, value) => {
      await control(key).evaluate((input, v) => { input.value = String(v); input.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    };
    const stepDone = (i) => lab.locator(`[data-recording-step="${i}"]`).getAttribute('data-done');
    const apply = (i) => lab.locator(`[data-recording-step-apply="${i}"]`).click();

    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'recording');
    for (const id of LESSONS) {
      await mode(id);
      assert.equal(await lab.locator(`[data-recording-mode=${id}]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await lab.locator('h2').textContent(), 'EGM Kayıt Laboratuvarı');
      assert.ok((await lab.locator('.recording-lesson-title').textContent()).length > 5, `${id} lesson title`);
      assert.ok((await lab.locator('[data-recording-live]').textContent()).length > 10, `${id} live interpretation`);
    }

    // Lesson 1: clipping is detected from the signal, display scale changes only the drawing.
    await mode('chain');
    assert.equal(await stepDone(0), 'false');
    await control('gain').selectOption('16');
    assert.ok((await metrics()).clippedPercent > 0);
    assert.equal(await stepDone(0), 'true', 'manual gain change completes step');
    assert.match(await lab.locator('[data-recording-step="0"]').textContent(), /Gözlem/);
    assert.equal(await lab.locator('[data-recording-warning=clipping]').isVisible(), true);
    const samples = await page.evaluate(() => window.epsLab.panel.recording.getResult().traces.sampled.slice());
    await apply(1);
    assert.equal((await state()).display, 1);
    assert.deepEqual(await page.evaluate(() => window.epsLab.panel.recording.getResult().traces.sampled), samples, 'display scale never changes samples');
    assert.equal(await stepDone(1), 'true');
    await apply(2); await apply(3);
    assert.equal(await lab.locator('[data-recording-warning=aliasing]').isVisible(), true);
    assert.equal(await lab.locator('[data-recording-progress]').textContent(), '4/4 adım tamamlandı');
    assert.equal(await lab.locator('[data-recording-mode=chain] .recording-mode-badge').textContent(), '✓');

    // Quiz: per-question feedback with right/wrong marking.
    await lab.locator('[data-question="0"][data-recording-answer="0"]').click();
    assert.match(await lab.locator('[data-recording-feedback="0"]').textContent(), /Tekrar düşün/);
    await lab.locator('[data-question="0"][data-recording-answer="2"]').click();
    assert.match(await lab.locator('[data-recording-feedback="0"]').textContent(), /Doğru/);

    // Lesson 2: LPF blunts the sharp potential; calipers measure.
    await lab.locator('[data-recording-next]').click();
    assert.equal((await state()).mode, 'filter');
    const wide = (await metrics()).sharpFiltered;
    await control('hp').selectOption('16'); await control('lp').selectOption('120');
    assert.ok((await metrics()).sharpFiltered < wide / 2, 'LPF reaches signal pipeline');
    assert.equal(await stepDone(2), 'true');
    await control('zoom').selectOption('2');
    await lab.locator('[data-recording-caliper]').click();
    await setRange('time', 240); await lab.locator('[data-recording-mark]').click();
    await setRange('time', 270); await lab.locator('[data-recording-mark]').click();
    assert.equal(await lab.locator('[data-recording-caliper-value]').textContent(), 'Δt = 30 ms');

    // Lesson 3: imbalance leaks noise; checklist removes the source.
    await mode('noise');
    assert.ok((await metrics()).noiseRms < 1e-9, 'balanced inputs cancel mains');
    await apply(0);
    const noisy = (await metrics()).noiseRms;
    assert.ok(noisy > 0.05);
    await lab.locator('[data-recording-check=stim]').click();
    assert.ok((await metrics()).noiseRms < noisy * 0.01, 'stimulator disconnect restores balance');
    assert.equal(await lab.locator('[data-recording-check=stim]').isDisabled(), true);
    assert.equal(await stepDone(3), 'true', 'source fixed without notch completes final step');

    // Lesson 4: unipolar QS for focus and breakthrough.
    await mode('unipolar');
    await control('scenario').selectOption('focus');
    assert.equal((await metrics()).morphRaw, 'QS');
    assert.equal(await stepDone(1), 'true');

    // Lesson 6: bipolar blindness and deep-source preservation.
    await mode('spacing');
    const aligned = (await metrics()).bipolarPp;
    await setRange('angle', 90);
    assert.ok((await metrics()).bipolarPp < aligned * 0.01, 'orientation changes computed bipolar signal');
    await apply(2);
    const close = await metrics();
    await apply(3);
    const wideDeep = await metrics();
    assert.ok(wideDeep.deepBi > 2 * close.deepBi, 'wide bipole keeps deep potential');

    // Lesson 7: virtual bipole search and invariance.
    await mode('omni');
    await apply(1);
    const omni = await metrics();
    assert.ok(Math.abs(omni.virtualPp - omni.omniPp) < 0.03 * omni.omniPp);
    assert.equal(await stepDone(1), 'true');
    await setRange('angle', 20);
    assert.ok(Math.abs((await metrics()).omniPp - omni.omniPp) < 1e-6, 'omni survives clique rotation');
    await control('scenario').selectOption('focus');
    assert.equal(await lab.locator('[data-recording-metric=omniPp]').textContent(), '∅ mV');

    // Lesson 8: shared local activity is removed.
    await mode('nearfield');
    await apply(1);
    assert.ok((await metrics()).tripolarPp < 1e-9, 'shared local counterexample cancels');
    assert.equal(await lab.locator('[data-recording-warning=shared-local-loss]').isVisible(), true);

    // Language switch keeps state; progress persists across lessons.
    const beforeLanguage = await state();
    await page.locator('[data-app-lang-option=en]').click();
    assert.equal(await lab.locator('h2').textContent(), 'EGM Recording Laboratory');
    assert.deepEqual(await state(), beforeLanguage, 'language change preserves controls');
    await mode('chain');
    assert.equal(await lab.locator('[data-recording-progress]').textContent(), '4/4 steps completed');
    await lab.locator('[data-recording-reset]').click();
    assert.equal(await lab.locator('[data-recording-progress]').textContent(), '0/4 steps completed', 'restart clears lesson progress');
    assert.equal((await state()).gain, 1);

    // Animation stops when hidden; Space toggles play once.
    await lab.locator('[data-recording-play]').click();
    await page.waitForFunction((before) => window.epsLab.panel.recording.getState().cursor !== before, (await state()).cursor);
    await page.locator('[data-ep-section=basics]').click();
    const hiddenAt = (await state()).cursor;
    await page.waitForTimeout(150);
    assert.equal((await state()).cursor, hiddenAt, 'hidden laboratory stops animation');
    await page.locator('.recording-entry').click();
    await lab.waitFor({ state: 'visible' });
    assert.match(page.url(), /#\/recording$/);
    await lab.locator('[data-recording-play]').click();
    assert.equal((await state()).playing, false);
    await lab.locator('[data-recording-play]').focus();
    await page.keyboard.press('Space');
    assert.equal((await state()).playing, true, 'Space toggles once on a focused play button');
    await page.keyboard.press('Space');
    assert.equal((await state()).playing, false);

    await page.setViewportSize({ width: 390, height: 844 });
    await mode('omni');
    await lab.locator('[data-recording-signal]').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, 'mobile no horizontal page overflow');
    assert.ok(await lab.locator('[data-recording-signal]').evaluate((canvas) => canvas.clientWidth > 250 && canvas.width >= canvas.clientWidth), 'mobile redraw uses actual canvas width');
    await page.reload();
    await lab.waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'recording', 'direct route survives reload');
    if (process.env.RECORDING_OFFLINE === '1') {
      await page.waitForFunction(() => navigator.serviceWorker?.controller);
      await page.context().setOffline(true);
      await page.reload();
      await lab.waitFor({ state: 'visible' });
      await mode('chain');
      await control('bits').selectOption('8');
      assert.equal((await state()).bits, 8, 'offline bundle computes and accepts input');
      await page.context().setOffline(false);
      console.log('PASS recording production offline: cached EPS route reloads and laboratory remains interactive');
    }
    assert.deepEqual(errors, []);
    console.log('PASS recording browser: eight guided lessons, state-detected steps, clipping/display, LPF, noise checklist, unipolar QS, blindness and deep source, omni search/invariance, shared-local loss, quiz, calipers, TR/EN, restart, hidden animation, Space and mobile layout');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
