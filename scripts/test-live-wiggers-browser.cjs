const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || '/tmp/cardia-live-wiggers';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('cardia_lang', 'tr');
      localStorage.setItem('cardia_lang_explicit', '1');
    });
    await page.goto(`${APP}/hemo/#/mode/cath`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('.hemo-panel');
    const click = selector => page.locator(selector).first().dispatchEvent('click');
    await page.evaluate(() => {
      const heart = window.heart;
      heart.setBeating(false); heart.setRhythm('bradycardia'); heart.setBpm(84); heart.setCycleSpeed(1.5); heart.seekCycle(.31);
      heart.setGraft('lima');
      heart.setOpacity(.73);
      window.__liveBefore = {
        clock: heart.getCycleState(), flags: heart.getState().visibility,
        camera: heart.getZoomInfo(), graft: heart.getState().graft,
        materials: new Map(heart.getState().structures.flatMap(s => heart.getMeshes(s.valveId || s.id)).map(m => [m, m.material]))
      };
    });
    await click('[data-hemo-view=wiggers]');
    await page.waitForFunction(() => window.heart.getState().mode === 'left-heart-wiggers');
    assert.equal(await page.locator('.live-wiggers').isVisible(), true);
    assert.equal(await page.locator('.hemo-header').isVisible(), false);
    assert.equal(await page.locator('.hemo-metrics').isVisible(), false);
    assert.equal(await page.locator('#cycle-panel').isVisible(), false);
    assert.equal(await page.evaluate(() => window.heart.getState().graft), null, 'bypass overlay hidden in left-heart-only view');
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    for (const key of ['x', 'g', 'f', 'w']) await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => window.heart.getState().fluoroscopy), false);
    assert.equal(await page.evaluate(() => window.heart.getState().segmentation), false);
    assert.equal(await page.evaluate(() => window.heart.getState().flow), false);
    const visibility = await page.evaluate(() => {
      const ids = new Set(window.heart.getState().structures.flatMap(s => window.heart.getMeshes(s.valveId || s.id)).filter(m => m.visible).map(m => m.userData.id));
      return [...ids];
    });
    assert.ok(['la', 'lv', 'aorta', 'lcc', 'rcc', 'ncc', 'mitral', 'mitral-annulus'].every(id => visibility.includes(id)), `left structures visible: ${visibility}`);
    assert.ok(visibility.every(id => ['la', 'lv', 'aorta', 'lcc', 'rcc', 'ncc', 'mitral', 'mitral-annulus'].includes(id)), `right heart and PA hidden: ${visibility}`);

    // All outputs consume the same frame, including exact valve boundaries.
    for (const phase of [.2, .45, .49, .53, .7, .88, .94]) {
      await page.evaluate(p => { window.heart.setBeating(false); window.heart.seekCycle(p); }, phase);
      const snapshot = await page.evaluate(async () => {
        const { leftHeartFrame, pressureColor } = await import('/src/left-heart-pressures.js');
        const f = leftHeartFrame(window.heart.getCycleState());
        const pressures = Object.fromEntries(['la', 'lv', 'ao'].map(key => {
          const card = document.querySelector(`[data-pressure=${key}]`);
          return [key, { value: Number(card.querySelector('strong').textContent), color: card.style.getPropertyValue('--pressure-color') }];
        }));
        const mesh = window.heart.getMeshes('lv')[0];
        const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <worldpos_vertex>', fragmentShader: '#include <common>\n#include <color_fragment>' };
        mesh.material.onBeforeCompile(shader, {});
        return {
          f, pressures, colors: Object.fromEntries(['la', 'lv', 'ao'].map(k => [k, pressureColor(f[k])])),
          nativeLvColor: `#${shader.uniforms.leftHeartPressureColor.value.getHexString()}`,
          valves: [...document.querySelectorAll('.live-wiggers__valves > span:not([hidden])')].map(n => n.dataset.open),
          labels: window.heart.scene.getObjectByName('Live Wiggers native left-heart pressure readouts').children.filter(c => c.isSprite).length
        };
      });
      for (const key of ['la', 'lv', 'ao']) {
        assert.ok(Math.abs(snapshot.pressures[key].value - snapshot.f[key]) <= .051, `${key} pressure agrees with Wiggers at ${phase}`);
        assert.equal(snapshot.pressures[key].color, snapshot.colors[key]);
      }
      assert.equal(snapshot.nativeLvColor, snapshot.colors.lv, 'native cutaway uses same absolute pressure color');
      assert.deepEqual(snapshot.valves, [String(snapshot.f.mitralOpen), String(snapshot.f.aorticOpen)]);
      assert.equal(snapshot.labels, 5, 'three chamber pressures and both native valve labels');
    }
    const pose = () => page.evaluate(() => Array.from(window.heart.getMeshes('lv')[0].geometry.attributes.position.array.slice(0, 300)));
    await page.evaluate(() => window.heart.seekCycle(.2)); const filled = await pose();
    await page.evaluate(() => window.heart.seekCycle(.7)); const ejecting = await pose();
    assert.ok(ejecting.some((v, i) => Math.abs(v - filled[i]) > 1e-5), 'original atlas geometry deforms across cycle');
    await click('.live-wiggers__play');
    const moving = await pose(); await page.waitForTimeout(350);
    const later = await pose();
    assert.ok(later.some((v, i) => Math.abs(v - moving[i]) > 1e-5), 'play advances native heart');
    await click('.live-wiggers__play');
    const frozen = await page.evaluate(() => window.heart.getCycleState().phase);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.heart.getCycleState().phase), frozen, 'pause freezes common clock');
    await page.locator('.live-wiggers__canvas').focus(); await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.evaluate(() => window.heart.getCycleState().phase), frozen, 'keyboard scrubs common clock');
    await page.locator('.live-wiggers__speed').evaluate(el => { el.value = '0.25'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.evaluate(() => window.heart.getCycleState().speed), .25);
    await page.locator('.live-wiggers__control input:not(.live-wiggers__speed)').first().evaluate(el => { el.value = '110'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.evaluate(() => window.heart.getCycleState().bpm), 110);
    const languagePhase = await page.evaluate(() => window.heart.getCycleState().phase);
    await click('#lang-btn');
    assert.equal(await page.locator('.live-wiggers__title').textContent(), 'Live Wiggers');
    assert.equal(await page.locator('[data-hemo-view=wiggers]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.evaluate(() => window.heart.getCycleState().phase), languagePhase);
    await click('[data-hemo-view=pressure]');
    const restored = await page.evaluate(() => ({
      clock: window.heart.getCycleState(), flags: window.heart.getState().visibility, mode: window.heart.getState().mode,
      materials: [...window.__liveBefore.materials].every(([m, material]) => m.material === material), before: window.__liveBefore.clock,
      camera: window.heart.getZoomInfo(), beforeCamera: window.__liveBefore.camera,
      graft: window.heart.getState().graft, beforeGraft: window.__liveBefore.graft,
      beforeFlags: window.__liveBefore.flags,
      overlayHidden: !window.heart.scene.getObjectByName('Live Wiggers native left-heart pressure readouts').visible
    }));
    for (const key of ['phase', 'bpm', 'speed', 'rhythm', 'playing']) assert.equal(restored.clock[key], restored.before[key], `restore ${key}`);
    assert.deepEqual(restored.flags, restored.beforeFlags, 'restore native layer flags');
    assert.equal(restored.graft, restored.beforeGraft, 'restore previous graft');
    for (const key of ['position', 'target']) assert.ok(restored.camera[key].every((v, i) => Math.abs(v - restored.beforeCamera[key][i]) < 1e-6), `restore camera ${key}`);
    assert.equal(restored.mode, 'cath'); assert.ok(restored.materials && restored.overlayHidden, 'restore original materials and hide pressure overlay');
    assert.equal(await page.evaluate(() => { window.heart.setLayer('flow', window.heart.getState().flow); return window.heart.getMeshes('lv')[0].material.opacity; }), .73, 'restore internal tissue opacity, including later state refresh');
    assert.equal(await page.locator('.hemo-header').isVisible(), true);

    // Re-selecting the same mode must tear down isolation before its reset.
    await click('[data-hemo-view=wiggers]');
    await page.waitForFunction(() => window.heart.getState().mode === 'left-heart-wiggers');
    await click('[data-mode=cath]:not([data-mode-step])');
    await page.waitForFunction(() => window.heart.getState().mode === 'cath');
    assert.equal(await page.locator('[data-hemo-view=pressure]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.evaluate(() => window.heart.getMeshes('pa').some(m => m.visible)), true, 'same-mode reset restores pulmonary artery');

    await click('[data-hemo-view=wiggers]');
    await page.waitForFunction(() => window.heart.getState().mode === 'left-heart-wiggers');
    await page.evaluate(() => { window.heart.setBeating(false); window.heart.seekCycle(.7); });
    await page.waitForTimeout(700);
    if (await page.locator('#up-later').isVisible()) await click('#up-later');
    // Interval buttons seek to the middle of the interval: mid-ejection shows the systolic plateau.
    await click('.live-wiggers__presets [data-interval=ventricular-ejection]');
    const mid = await page.evaluate(() => Number(document.querySelector('[data-pressure=lv] strong').textContent));
    assert.ok(mid > 110, `mid-ejection LV pressure (${mid})`);
    assert.equal(await page.locator('[data-live-wiggers-la]').isVisible(), true, 'LA strip on its own scale');
    assert.ok(await page.locator('[data-live-wiggers-la]').evaluate(c => c.width > 0), 'LA strip drawn');
    const leaders = await page.evaluate(() => { let n = 0; window.heart.scene.traverse(o => { if (o.isLine && o.renderOrder === 11 && o.visible) n++; }); return n; });
    assert.ok(leaders >= 2, `valve labels carry leader lines (${leaders})`);
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/desktop.png` });

    // Right heart: its own cut, readouts and 0-30 mmHg chart on the same clock.
    await click('[data-live-side=right]');
    await page.waitForFunction(() => window.heart.getState().mode === 'right-heart-wiggers');
    await page.waitForTimeout(400);
    const rightVisible = await page.evaluate(() => [...new Set(window.heart.getState().structures.flatMap(s => window.heart.getMeshes(s.valveId || s.id)).filter(m => m.visible).map(m => m.userData.id))]);
    assert.ok(['ra', 'rv', 'pa'].every(id => rightVisible.includes(id)), `right structures visible: ${rightVisible}`);
    assert.ok(!rightVisible.includes('lv') && !rightVisible.includes('aorta'), `left hidden on right side: ${rightVisible}`);
    assert.equal(await page.locator('[data-pressure=rv]').isVisible(), true);
    assert.equal(await page.locator('[data-pressure=lv]').isVisible(), false);
    assert.equal(await page.locator('[data-live-wiggers-right]').isVisible(), true, 'right chart shown');
    await click('.live-wiggers__presets [data-interval=ventricular-ejection]');
    const rvMid = await page.evaluate(() => Number(document.querySelector('[data-pressure=rv] strong').textContent));
    assert.ok(rvMid > 18 && rvMid < 28, `mid-ejection RV pressure (${rvMid})`);
    await page.screenshot({ path: `${SHOTS}/right.png` });

    // Both sides at once.
    const phaseBefore = await page.evaluate(() => window.heart.getCycleState().phase);
    await click('[data-live-side=both]');
    await page.waitForFunction(() => window.heart.getState().mode === 'heart-wiggers');
    await page.waitForTimeout(400);
    const bothVisible = await page.evaluate(() => [...new Set(window.heart.getState().structures.flatMap(s => window.heart.getMeshes(s.valveId || s.id)).filter(m => m.visible).map(m => m.userData.id))]);
    assert.ok(['la', 'lv', 'aorta', 'ra', 'rv', 'pa'].every(id => bothVisible.includes(id)), `both sides visible: ${bothVisible}`);
    assert.equal(await page.evaluate(() => window.heart.getCycleState().phase), phaseBefore, 'side switch keeps the clock');
    for (const key of ['la', 'lv', 'ao', 'ra', 'rv', 'pa']) assert.equal(await page.locator(`[data-pressure=${key}]`).isVisible(), true, `${key} card in both`);
    await page.screenshot({ path: `${SHOTS}/both.png` });
    await click('[data-live-side=left]');
    await page.waitForFunction(() => window.heart.getState().mode === 'left-heart-wiggers');
    await page.setViewportSize({ width: 390, height: 844 });
    if (await page.evaluate(() => document.body.dataset.sheet !== 'learn')) await click('.mobile-tab[data-sheet=learn]');
    await page.locator('.live-wiggers__play').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('.live-wiggers__play').isVisible(), 'mobile has its own shared play control');
    const bounds = await page.evaluate(() => {
      const root = document.querySelector('.live-wiggers');
      const main = document.querySelector('.workspace>main').getBoundingClientRect();
      const panel = document.querySelector('.workspace>article').getBoundingClientRect();
      return { width: root.clientWidth, scroll: root.scrollWidth, sceneHeight: main.height, sceneBottom: main.bottom, panelTop: panel.top };
    });
    assert.ok(bounds.scroll <= bounds.width + 1, 'no horizontal overflow on mobile');
    assert.ok(bounds.sceneHeight > 130 && bounds.sceneBottom <= bounds.panelTop + 2, `mobile retains native scene above panel: ${JSON.stringify(bounds)}`);
    await page.screenshot({ path: `${SHOTS}/mobile.png` });
    assert.deepEqual(errors, []);
    console.log('PASS live-wiggers browser: native isolation/deformation, pressures/colors/valves, shared controls, TR/EN, restore and mobile');
    console.log(`Screenshots: ${SHOTS}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
