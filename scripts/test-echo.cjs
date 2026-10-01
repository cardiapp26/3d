/**
 * Echo mode (research/TTE_TEE_ENTEGRASYON_RAPORU.md, stages 1-3) on the
 * atlas: every TTE and TEE starting view meets its structure criteria at its
 * preset, screen orientation follows the conventions (A4C LV on the right;
 * TEE 0 and 180 degrees mirror each other), the section is taken from the
 * current phase, freezing stops 3D and 2D together, the TEE motions are
 * separate, the find-the-view task works, and the section is fast enough.
 * Teaching checks, not an expert review.
 * Usage: APP_URL=... node scripts/test-echo.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
// TTE and TEE are separate modes of the one echo module.
const useModality = async (page, modality) => {
  await page.locator(`[data-mode=${modality === 'tee' ? 'tee' : 'echo'}]`).dispatchEvent('click');
  await page.waitForFunction(m => window.cardiaEcho?.getState().modality === m, modality);
};

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const SHOTS = process.env.SHOT_DIR || null;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/#/mode/echo`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('#echo-panel:not([hidden]) .echo-canvas');
    await page.waitForFunction(() => window.cardiaEcho?.getResult());

    // Every starting view at its preset.
    const views = { tte: ['plax', 'psax-av', 'psax-mv', 'psax-pm', 'a4c', 'a2c', 'a3c', 'sc4c'], tee: ['me4c', 'memc', 'me2c', 'melax', 'meavsax', 'mebicaval', 'melaa', 'mervio', 'melaapv', 'tgsax'] };
    for (const [modality, ids] of Object.entries(views)) {
      await useModality(page, modality);
      assert.equal(await page.locator('[data-echo-view]').count(), ids.length, `${modality}: ${ids.length} views`);
      for (const id of ids) {
        await page.locator(`[data-echo-view="${id}"]`).click();
        const r = await page.evaluate(() => window.cardiaEcho.getResult());
        assert.equal(r.view, id);
        assert.ok(r.achieved, `${id}: preset meets the criteria (missing ${r.missing}, wrong ${r.wrong})`);
        assert.equal(await page.locator('.echo-feedback').getAttribute('data-state'), 'ok');
        if (SHOTS && ['plax', 'a4c', 'me4c', 'tgsax'].includes(id)) await page.locator('.echo-canvas').screenshot({ path: `${SHOTS}/echo-${id}.png` });
      }
    }

    // Orientation: centroids of structures in image coordinates (x: screen right).
    const centroids = async id => {
      await page.locator(`[data-echo-view="${id}"]`).click();
      return page.evaluate(async () => {
        const { sectionMeshes } = await import('/src/echo-section.js');
        const { echoItems } = await import('/src/echo-anatomy.js');
        const r = window.cardiaEcho.getResult();
        const s = sectionMeshes(echoItems(id => window.heart.getMeshes(id)), r.frame);
        return Object.fromEntries(Object.entries(s.structures).map(([k, v]) => [k, v.centroid]));
      });
    };
    await useModality(page, 'tte');
    const a4c = await centroids('a4c');
    assert.ok(a4c.lv[0] > a4c.rv[0] && a4c.la[0] > a4c.ra[0], 'A4C: left heart on the right of the screen');
    assert.ok(a4c.lv[1] < a4c.la[1], 'A4C: apex (LV) near the transducer, atria far');
    await useModality(page, 'tee');
    const me4c = await centroids('me4c');
    assert.ok(me4c.la[1] < me4c.lv[1], 'ME 4C: LA nearest the transducer');
    assert.ok(me4c.lv[0] > me4c.ra[0], 'ME 4C at 0 degrees: patient left on the screen right');
    // TEE motions are separate: omega turns the image about the beam only; advance moves the transducer.
    const frameNow = () => page.evaluate(() => window.cardiaEcho.getResult().frame);
    const f0 = await frameNow();
    await page.locator('[data-echo-control="omega"]').fill('180');
    const f180 = await frameNow();
    assert.ok(f0.origin.every((v, i) => Math.abs(v - f180.origin[i]) < 1e-9) && f0.beam.every((v, i) => Math.abs(v - f180.beam[i]) < 1e-9), 'omega keeps origin and beam');
    assert.ok(f0.lateral.every((v, i) => Math.abs(v + f180.lateral[i]) < 1e-6), '180 degrees mirrors 0 degrees');
    const mirrored = await page.evaluate(async () => {
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { echoItems } = await import('/src/echo-anatomy.js');
      const s = sectionMeshes(echoItems(id => window.heart.getMeshes(id)), window.cardiaEcho.getResult().frame);
      return { lv: s.structures.lv.centroid, ra: s.structures.ra.centroid };
    });
    assert.ok(mirrored.lv[0] < mirrored.ra[0], 'ME 4C at 180 degrees: the image is mirrored');
    await page.locator('[data-echo-control="advance"]').fill('0.3');
    const fAdv = await frameNow();
    assert.ok(Math.abs(fAdv.origin[1] - f0.origin[1]) > 0.2, 'advance/withdraw moves the transducer along the oesophagus');
    await page.locator('[data-echo-control="flexion"]').fill('40');
    const fFlex = await frameNow();
    assert.ok(Math.abs(fFlex.beam[1] - fAdv.beam[1]) > 0.2, 'flexion bends the beam');

    // Same phase: the section follows the beat; freeze stops both images.
    await page.locator('[data-echo-view="me4c"]').click();
    // Seek, then read after the throttle interval (the trailing refresh draws the last phase).
    const lengthAt = async phase => { await page.evaluate(p => window.heart.seekCycle(p), phase); await page.waitForTimeout(80); return page.evaluate(() => window.cardiaEcho.getResult().lengths.lv); };
    const diastole = await lengthAt(0.05);
    const systole = await lengthAt(0.6);
    assert.ok(Math.abs(diastole - systole) > 0.05, `LV section changes with the phase (${diastole.toFixed(2)} vs ${systole.toFixed(2)})`);
    await page.locator('#beat').click();
    await page.waitForTimeout(300);
    await page.locator('[data-echo-action="freeze"]').click();
    const frozen = await page.evaluate(() => ({ playing: window.heart.getCycleState().playing, state: window.cardiaEcho.getState().frozen, phase: window.heart.getCycleState().phase }));
    assert.equal(frozen.playing, false); assert.equal(frozen.state, true);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.heart.getCycleState().phase), frozen.phase, 'frozen phase stays');

    // 3D overlay: fan and TEE probe visible; look-at-plane moves the camera.
    const overlay = await page.evaluate(() => ({ fan: window.heart.scene.getObjectByName('Echo imaging plane (sector)').visible, tee: window.heart.scene.getObjectByName('TEE probe (schematic)').visible, group: window.heart.scene.getObjectByName('Echo probe and imaging plane').visible }));
    assert.ok(overlay.fan && overlay.tee && overlay.group);
    await page.locator('[data-echo-action="look"]').click();
    await page.waitForTimeout(100);
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/echo-look.png` });

    // Find the view.
    await useModality(page, 'tte');
    await page.locator('[data-echo-action="task"]').click();
    const task = await page.evaluate(() => window.cardiaEcho.getState().task);
    assert.ok(task && task.target, 'task has a target');
    assert.equal(await page.locator('[data-echo-view]:disabled').count(), 8, 'view buttons locked during the task');
    // "Back" returns to the start pose, not to the answer; the answer is the target preset.
    const startPose = await page.evaluate(() => JSON.stringify(window.cardiaEcho.getState().tte));
    await page.locator('[data-echo-control="rotation"]').fill('0');
    await page.locator('[data-echo-action="reset"]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.cardiaEcho.getState().tte)), startPose, 'back to the task start');
    await page.evaluate(target => window.cardiaEcho.selectView(target, { keepTask: true }), task.target);
    const solved = await page.evaluate(() => ({ task: window.cardiaEcho.getState().task, r: window.cardiaEcho.getResult() }));
    assert.equal(solved.r.view, task.target); assert.equal(solved.task.done, true, `back at the target view: task done (${task.target}: missing ${solved.r.missing}, wrong ${solved.r.wrong}, phase ${await page.evaluate(() => window.heart.getCycleState().phase)})`);
    assert.match(await page.locator('.echo-task-status').textContent(), /Görev tamamlandı/, 'past success shown apart from the current cut');
    // A solved task unlocks the views; the language switch keeps the task and the pose.
    assert.equal(await page.locator('[data-echo-view]:disabled').count(), 0, 'views unlocked once the task is solved');
    await page.locator('[data-echo-action="task"]').click();
    const running = await page.evaluate(() => JSON.stringify({ task: window.cardiaEcho.getState().task?.target, tte: window.cardiaEcho.getState().tte }));
    await page.locator('#lang-btn').click();
    assert.equal(await page.evaluate(() => JSON.stringify({ task: window.cardiaEcho.getState().task?.target, tte: window.cardiaEcho.getState().tte })), running, 'language switch keeps the task');
    await page.locator('#lang-btn').click();
    await page.locator('.echo-controls summary').nth(1).click();
    await page.locator('[data-echo-control="labels"]').uncheck();
    assert.equal(await page.evaluate(() => window.cardiaEcho.getState().labels), false);

    // Every view at every sampled phase of the beat meets its criteria at the preset.
    const phases = await page.evaluate(async () => {
      const { measureEchoAnatomy, echoItems } = await import('/src/echo-anatomy.js');
      const { evaluateView } = await import('/src/echo-training.js');
      const { sectionMeshes } = await import('/src/echo-section.js');
      const V = await import('/src/echo-views.js');
      const gm = id => window.heart.getMeshes(id).filter(m => !m.userData.micro);
      const A = window.heart.withRestPose(() => measureEchoAnatomy({ getMeshes: gm }));
      const items = echoItems(gm), failures = [];
      for (const view of [...V.TTE_VIEWS, ...V.TEE_VIEWS]) {
        window.cardiaEcho.selectView(view.id);
        const { frame } = window.cardiaEcho.getResult(), st = window.cardiaEcho.getState();
        for (const phase of [0.1, 0.4, 0.55, 0.75]) {
          window.heart.seekCycle(phase);
          const e = evaluateView(sectionMeshes(items, frame), view, { sectorAngle: st.sectorAngle, depth: st.depth, frame, anatomy: A, label: x => x, lang: 'en' });
          if (!e.achieved) failures.push(`${view.id}@${phase}: ${e.messages.join(' ')}`);
        }
      }
      window.heart.seekCycle(0);
      return failures;
    });
    assert.deepEqual(phases, [], 'all 16 views meet their criteria at 4 phases of the beat');

    // A seeded task is reproducible and solvable with the keyboard alone (slider arrow keys).
    await useModality(page, 'tte');
    const seeded = await page.evaluate(() => { window.cardiaEcho.startTask('tte', { seed: 7 }); const a = window.cardiaEcho.getState(); window.cardiaEcho.startTask('tte', { seed: 7 }); const b = window.cardiaEcho.getState(); return { a: [a.task.target, a.tte], b: [b.task.target, b.tte] }; });
    assert.equal(JSON.stringify(seeded.a[1]), JSON.stringify(seeded.b[1]), 'same seed, same start pose');
    await page.locator('.echo-controls summary').first().evaluate(el => { el.parentElement.open = true; });
    for (const key of ['rotation', 'tilt', 'rock']) {
      const value = await page.evaluate(k => window.cardiaEcho.getState().tte[k], key);
      await page.locator(`[data-echo-control="${key}"]`).focus();
      for (let i = 0; i < Math.abs(value); i++) await page.keyboard.press(value > 0 ? 'ArrowLeft' : 'ArrowRight');
    }
    const keyboard = await page.evaluate(() => ({ task: window.cardiaEcho.getState().task, tte: window.cardiaEcho.getState().tte }));
    assert.ok(keyboard.task.done, `task solved with the keyboard (${JSON.stringify(keyboard.tte)})`);
    await page.locator('[data-echo-action="task"]').click();   // new task
    await page.evaluate(() => { const s = window.cardiaEcho.getState(); if (s.task) window.cardiaEcho.selectView(s.view); });

    // Enlarge while frozen: the sector redraws at the new size, the frozen phase stays.
    const before = await page.evaluate(() => ({ h: document.querySelector('.echo-canvas').height, phase: window.heart.getCycleState().phase, playing: window.heart.getCycleState().playing }));
    await page.locator('[data-echo-action="size"]').click();
    const after = await page.evaluate(() => ({ h: document.querySelector('.echo-canvas').height, css: document.querySelector('.echo-canvas').clientHeight, phase: window.heart.getCycleState().phase }));
    assert.ok(after.css === 440 && after.h > before.h, 'enlarged sector redrawn');
    assert.equal(after.phase, before.phase, 'frozen phase unchanged by the resize');
    await page.locator('[data-echo-action="size"]').click();

    // Interaction to image: probe slider input to a redrawn sector (synchronous refresh), p95.
    const latency = await page.evaluate(() => {
      const input = document.querySelector('[data-echo-control="rotation"]'), times = [];
      for (let i = 0; i < 40; i++) {
        const t0 = performance.now();
        input.value = String((i % 20) - 10);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      return { p50: times[20], p95: times[37] };
    });
    assert.ok(latency.p95 < 50, `slider-to-image p95 ${latency.p95.toFixed(1)} ms`);

    // Speed: sections per second on this machine (report target: interactive).
    const ms = await page.evaluate(async () => {
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { echoItems } = await import('/src/echo-anatomy.js');
      const items = echoItems(id => window.heart.getMeshes(id)), frame = window.cardiaEcho.getResult().frame;
      sectionMeshes(items, frame);
      const t0 = performance.now(); for (let i = 0; i < 20; i++) sectionMeshes(items, frame); return (performance.now() - t0) / 20;
    });
    assert.ok(ms < 30, `section time ${ms.toFixed(1)} ms`);

    // English, and leaving the mode hides the overlay and panel.
    await page.locator('#lang-btn').click();
    assert.match(await page.locator('.echo-panel .eyebrow').first().textContent(), /ECHOCARDIOGRAPHY/);
    await page.locator('[data-mode="anatomy"]').dispatchEvent('click');
    assert.equal(await page.locator('#echo-panel').isHidden(), true);
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('Echo probe and imaging plane').visible), false);

    assert.deepEqual(errors, []);
    // Phone: the echo panel fits without horizontal scrolling.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${APP}/#/mode/echo`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForFunction(() => window.cardiaEcho?.getResult());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone: no horizontal overflow');

    console.log(`PASS echo: 18 views at preset and at 4 phases, A4C/ME4C orientation, 0/180 mirror, separate TEE motions, phase-locked section, freeze, seeded keyboard task, enlarge while frozen, p95 ${latency.p95.toFixed(1)} ms, ${ms.toFixed(1)} ms per section, phone`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
