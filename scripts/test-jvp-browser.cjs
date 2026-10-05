/**
 * Jugular venous pulse panel in the physical examination mode
 * (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md, section 9): sub-tabs,
 * lesson steps, wave picking moves the shared clock, patterns and the normal
 * reference, breathing and Kussmaul, slow motion restored on exit, keyboard,
 * language and the phone layout.
 * Usage: APP_URL=... node scripts/test-jvp-browser.cjs
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
    await page.goto(`${APP}/#/mode/exam`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    // The step list shows one section at a time (auscultation, venous pressure); the total comes from the lesson.
    const steps = await page.evaluate(async () => (await import('/src/content.js')).lessons.exam.steps.length);
    assert.deepEqual(await page.locator('#steps .steps-group-link').allTextContents(), ['Manevralar ›', 'Venöz basınç (JVP) ›'], 'the other sections are heading links');
    assert.equal(await page.evaluate(() => window.cardiaExam.getView()), 'auscultation', 'exam opens on auscultation');
    assert.deepEqual(await page.locator('.exam-subtabs button').allTextContents(), ['Oskültasyon', 'Manevralar', 'Venöz basınç (JVP)'], 'three panel tabs');
    const visible = sel => page.locator(sel).isVisible();
    assert.equal(await visible('.exam-areas'), true, 'auscultation tab: areas shown');
    assert.equal(await visible('.exam-maneuvers'), false, 'auscultation tab: maneuver buttons hidden');
    // The Maneuvers tab: buttons and response table, no area chips; the lesson follows to its first step.
    await page.locator('[data-exam-view=maneuvers]').click();
    assert.equal(await visible('.exam-maneuvers'), true, 'maneuvers tab: buttons shown');
    assert.equal(await visible('.exam-table'), true, 'maneuvers tab: response table shown');
    assert.equal(await visible('.exam-areas'), false, 'maneuvers tab: areas hidden');
    assert.equal(await page.locator('#steps .steps-group:not(.steps-group-link)').textContent(), 'Manevralar', 'lesson moved to the maneuvers section');
    // A maneuvers step opens the maneuvers tab; an auscultation step goes back.
    await page.locator('#steps button[data-step]:not(.steps-group)').nth(2).click();
    assert.equal(await page.locator('[data-exam-view=maneuvers]').getAttribute('aria-selected'), 'true', 'maneuvers step keeps the maneuvers tab');
    await page.locator('#steps .steps-group-link', { hasText: 'Oskültasyon' }).click();
    assert.equal(await page.locator('[data-exam-view=auscultation]').getAttribute('aria-selected'), 'true', 'auscultation section opens its tab');

    // First venous pulse step: the JVP tab, the normal pattern, the a wave.
    await page.locator(`#steps [data-step="${steps - 6}"]`).click();
    await page.waitForSelector('.exam-view-jvp:not([hidden]) .jvp-canvas');
    assert.equal(await page.locator('[data-exam-view=jvp]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.exam-view-auscultation').isHidden(), true);
    const canvas = await page.evaluate(() => { const c = document.querySelector('.jvp-canvas'); return { w: c.width, h: c.clientHeight }; });
    assert.ok(canvas.w > 200 && canvas.h >= 240, `JVP canvas sized (${canvas.w}x${canvas.h})`);
    const readout = await page.locator('.jvp-readout').textContent();
    assert.match(readout, /5 mmHg/); assert.match(readout, /cm/);
    const a = await page.evaluate(() => ({ phase: window.heart.getCycleState().phase, playing: window.heart.getCycleState().playing }));
    assert.ok(Math.abs(a.phase - 0.4) < 0.01 && !a.playing, 'the a wave step moves the shared clock to atrial contraction and holds it');
    assert.equal(await page.locator('[data-jvp-wave=a]').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('.jvp-card-title').textContent(), /a dalgası/);

    // Picking a wave (button) seeks; keyboard arrows step through the waves.
    await page.locator('[data-jvp-wave=y]').click();
    assert.ok(Math.abs(await page.evaluate(() => window.heart.getCycleState().phase) - 0.1) < 0.01, 'y: early diastole');
    await page.locator('.jvp-canvas').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => window.cardiaExam.getJvp().getState().wave), 'v', 'arrow key: previous wave');

    // Patterns: TR shows a c-v wave and no x′; the normal reference stays on the same axis.
    await page.locator('[data-jvp-control=scenario]').selectOption('tr');
    const trWaves = await page.locator('[data-jvp-wave]').evaluateAll(bs => bs.map(b => b.dataset.jvpWave));
    assert.ok(trWaves.includes('cv') && !trWaves.includes('xp'), 'TR: c-v wave, no x′');
    await page.locator('[data-jvp-control=compare]').uncheck();
    assert.equal(await page.evaluate(() => window.cardiaExam.getJvp().getState().compare), false);
    await page.locator('[data-jvp-control=compare]').check();

    // Breathing: normal falls, constriction rises (Kussmaul), tamponade has no Kussmaul note.
    const meanOf = async () => Number((await page.locator('.jvp-readout').textContent()).match(/(\d+) mmHg/)[1]);
    await page.locator('[data-jvp-control=scenario]').selectOption('constriction');
    await page.locator('[data-jvp-resp=exp]').click();
    const expMean = await meanOf();
    await page.locator('[data-jvp-resp=insp]').click();
    assert.ok(await meanOf() > expMean, 'constriction: pressure rises on inspiration');
    assert.match(await page.locator('.jvp-resp-note').textContent(), /Kussmaul/);
    await page.locator('[data-jvp-control=scenario]').selectOption('tamponade');
    assert.doesNotMatch(await page.locator('.jvp-resp-note').textContent(), /yükseliyor/, 'tamponade: no Kussmaul rise');
    await page.locator('[data-jvp-control=scenario]').selectOption('normal');
    assert.ok(await meanOf() < 5, 'normal: falls on inspiration');

    // Slow motion changes the shared clock speed; leaving the mode restores it.
    await page.locator('[data-jvp-control=slow]').check();
    assert.ok(Math.abs(await page.evaluate(() => window.heart.getCycleState().speed) - 0.35) < 1e-6);
    await page.locator('[data-jvp-action=freeze]').click();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), true, 'play from the panel');
    await page.locator('[data-jvp-action=freeze]').click();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), false, 'freeze from the panel');

    // Strip views (JVP-01 to JVP-05): the panel clock drives the heart pose; every channel reads one timeline.
    const jvpState = () => page.evaluate(() => { const j = window.cardiaExam.getJvp(); const s = j.getStrip(); const st = j.getState(); return { view: st.view, t: st.t, playing: st.stripPlaying, heartPlaying: window.heart.getCycleState().playing, heartPhase: window.heart.getCycleState().phase, stripPhase: s ? s.phaseAt(st.t) : null }; });
    await page.locator(`#steps [data-step="${steps - 2}"]`).click();
    await page.waitForTimeout(400);
    let st = await jvpState();
    assert.equal(st.view, 'avd', 'lesson step opens the AV dissociation strip');
    assert.equal(st.heartPlaying, false, 'the heart is posed by the strip clock, not its own');
    assert.ok(st.t > 0.1 && st.playing, 'strip clock runs');
    assert.equal(await page.locator('[data-jvp-control=atrialRate]').isVisible(), true);
    assert.equal(await page.locator('.jvp-waves').isHidden(), true, 'wave buttons belong to the single-beat view');
    assert.equal(await page.locator('.jvp-resp').isHidden(), true, 'spontaneous breathing control hidden in strips');
    await page.locator('[data-jvp-action=freeze]').click();
    st = await jvpState();
    await page.waitForTimeout(250);
    const held = await jvpState();
    assert.ok(!held.playing && Math.abs(held.t - st.t) < 0.05, 'freeze holds the strip clock');
    assert.ok(Math.abs(held.heartPhase - held.stripPhase) < 1e-6, 'paused: the heart pose is the strip ventricular phase');
    await page.locator('[data-jvp-action=freeze]').click();
    await page.locator('[data-jvp-control=slow]').check();
    const s0 = await jvpState(); await page.waitForTimeout(1000); const s1 = await jvpState();
    const rate = ((s1.t - s0.t + 10.5) % 10.5);
    assert.ok(rate > 0.2 && rate < 0.5, `slow motion: strip clock at ~0.35x (${rate.toFixed(2)} s/s)`);
    assert.ok(Math.abs(s1.heartPhase - s1.stripPhase) < 0.05, 'slow: heart still on the strip phase');
    await page.locator('[data-jvp-control=slow]').uncheck();
    await page.locator('[data-jvp-action=restart]').click();
    assert.ok((await jvpState()).t < 0.3, 'restart returns to t = 0');
    // Acceptance 16: in the 3D heart the atria follow the atrial clock and the ventricles the ventricular clock.
    const beatWeights = await page.evaluate(async () => {
      const j = window.cardiaExam.getJvp(), s = j.getStrip(), out = [];
      for (const e of s.atrial) { j.seekStrip(e.t); out.push({ kind: e.kind, ...window.heart.getBeatWeights(), vPhase: window.heart.getCycleState().phase }); }
      j.seekStrip(0); window.cardiaExam.getJvp().getState();
      return out;
    });
    assert.ok(beatWeights.every(w => w.atrialContraction > 0.95), '3D atria contract on every atrial event');
    const vAtA = beatWeights.map(w => w.vPhase);
    assert.ok(Math.max(...vAtA) - Math.min(...vAtA) > 0.3, '3D ventricles are at different phases at each atrial contraction (dissociated)');
    assert.ok(beatWeights.some(w => w.kind === 'cannon' && w.ventricularContraction > 0.3), 'a cannon a coincides with 3D ventricular contraction');
    await page.locator('[data-jvp-action=freeze]').click();
    const cannons = async () => (await page.locator('.jvp-readout').textContent()).match(/cannon a: (\d+)\/(\d+)/).slice(1).join('/');
    const at75 = await cannons();
    await page.locator('[data-jvp-control=atrialRate]').selectOption('60');
    assert.notEqual(await cannons(), at75, 'another atrial rate, another cannon pattern');

    await page.locator('[data-jvp-control=view]').selectOption('af');
    assert.match(await page.locator('.jvp-readout').textContent(), /tohum 7/);

    // Abdominojugular test: judged only after release, by the protocol timing.
    await page.locator('[data-jvp-control=view]').selectOption('ajr');
    await page.locator('[data-jvp-control=response]').selectOption('transient');
    assert.match(await page.locator('.jvp-result').textContent(), /bırakmadan 3 s sonra/, 'no judgement before release');
    await page.evaluate(() => window.cardiaExam.getJvp().seekStrip(20));
    assert.match(await page.locator('.jvp-result').textContent(), /negatif.*geçici yükseliş/s, 'normal: transient rise, negative');
    await page.locator('[data-jvp-control=response]').selectOption('sustained');
    await page.evaluate(() => window.cardiaExam.getJvp().seekStrip(20));
    assert.equal(await page.locator('.jvp-result').getAttribute('data-positive'), 'true', 'sustained rise with a fall on release: positive');
    await page.locator('[data-jvp-action=restart]').click();
    assert.match(await page.locator('.jvp-readout').textContent(), /Başlangıç ölçümü/, 'restart: back to baseline');

    // Ventilator: its own controls; no spontaneous-breathing notes; PEEP raises the end-expiratory reading.
    await page.locator('[data-jvp-control=view]').selectOption('ppv');
    assert.equal(await page.locator('.jvp-resp-note').isHidden(), true);
    const endExp = async () => Number((await page.locator('.jvp-readout').textContent()).match(/okuma noktası\): ([\d.]+)/)[1]);
    const peep5 = await endExp();
    await page.locator('[data-jvp-control=peep]').selectOption('10');
    assert.ok(await endExp() > peep5, 'PEEP 10: higher end-expiratory level');

    // Data label on the page and in the export.
    assert.match(await page.locator('.jvp-data-label').textContent(), /öğretim değer/);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-jvp-action=export]').click()]);
    const csv = require('node:fs').readFileSync(await download.path(), 'utf8');
    assert.match(csv, /Synthetic teaching data: not patient data, not clinically validated/);
    assert.match(csv, /jvp-params-2026-09-30/);
    assert.match(csv, /^t_s,ra_mmHg,ecg_au,airway_cmH2O$/m);
    assert.equal(download.suggestedFilename(), 'cardia-jvp-ppv.csv');

    // Leaving a strip for auscultation gives the heart back its own clock.
    await page.locator('[data-exam-view=auscultation]').click();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), true, 'auscultation: heart beating again');
    await page.locator('[data-exam-view=jvp]').click();
    await page.waitForTimeout(200);
    assert.equal((await jvpState()).heartPlaying, false, 'back on the strip: the strip clock poses the heart again');
    await page.locator('[data-jvp-control=view]').selectOption('beat');
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), true, 'single beat: shared clock resumes');

    // Sub-tab back to auscultation; English labels.
    await page.locator('[data-exam-view=auscultation]').click();
    assert.equal(await page.locator('.exam-view-jvp').isHidden(), true);
    await page.locator('#lang-btn').click();
    assert.equal(await page.locator('[data-exam-view=jvp]').textContent(), 'Venous pressure (JVP)');
    await page.locator('[data-exam-view=jvp]').click();
    assert.match(await page.locator('.jvp-panel .eyebrow').textContent(), /JUGULAR VENOUS PULSE/);
    await page.locator('#lang-btn').click();
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.heart.getCycleState().speed), 1, 'slow motion restored when leaving the mode');

    // Phone: no horizontal overflow with the JVP panel.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${APP}/#/mode/exam`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.evaluate(() => window.cardiaExam.applyStep({ jvp: { scenario: 'normal' } }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone: no horizontal overflow');
    await page.evaluate(() => window.cardiaExam.applyStep({ jvp: { view: 'ajr' } }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone: no horizontal overflow with a strip');

    assert.deepEqual(errors, []);
    console.log('PASS jvp-browser: sub-tabs, lesson steps, wave picking on the shared clock, keyboard, patterns and normal reference, breathing and Kussmaul, strips (AVD/AF/AJR/PPV) driving the heart pose, freeze/slow/restart, protocol judgement, PEEP, export label, slow motion restored, TR/EN, phone');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
