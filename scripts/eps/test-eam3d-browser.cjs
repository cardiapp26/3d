// 3D EAM & Whole-Heart Simulation workstation browser test:
// Opens #/eam3d, loads the 3D four-chamber atlas (or 2D fallback), verifies scenario and map mode
// switching, chamber/wall levers, C-arm views, 26-channel live polygraph painting, Space play/pause,
// programmed stimulation (burst termination & S1-S2 induction), 3D RF ablation line application,
// "Find the Circuit" probabilistic circuit survey, 2D-to-3D bridge buttons, TR/EN localization,
// and 390px mobile responsiveness with zero console/page errors.

const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);
const assert = require('node:assert/strict');
const { startApp } = require('../lib/app-server.cjs');

const watch = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) {
      errors.push(m.text());
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
};

const painted = (page, sel) =>
  page.locator(sel).evaluate((c) => {
    const ctx = c.getContext('2d');
    if (!ctx) return 0;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 47) {
      if (d[i] + d[i + 1] + d[i + 2] > 180) n++;
    }
    return n;
  });

(async () => {
  const server = process.env.EPS_URL
    ? { url: process.env.EPS_URL.replace(/\/eps\/?$/, ''), close: async () => {} }
    : await startApp();
  const APP = (process.env.EPS_URL || `${server.url.replace(/\/$/, '')}/eps`).replace(/\/$/, '');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = watch(page);

    await page.goto(`${APP}/?lang=tr#/eam3d`);
    const ws = page.locator('[data-eam3d-workstation]');
    await ws.waitFor({ state: 'visible' });

    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'eam3d');
    assert.equal(
      await page.locator('[data-ep-section="eam3d"]').getAttribute('aria-selected'),
      'true',
    );

    // Wait briefly for 3D atlas or fallback readiness
    await page.waitForFunction(
      () => {
        const atlas = window.epsLab?.panel?.eam3d?.getAtlas?.();
        const fallback = document
          .querySelector('[data-eam3d-stage]')
          ?.classList.contains('is-fallback');
        return Boolean((atlas && atlas.isReady()) || fallback);
      },
      null,
      { timeout: 45000 },
    );

    // Verify 26-channel polygraph canvas is actively painted
    await page.waitForTimeout(250);
    const polyPixels = await painted(page, '[data-eam3d-poly-canvas]');
    assert.ok(polyPixels > 25, `26-channel polygraph painted (${polyPixels} bright samples)`);

    // Space bar toggles simulation running state
    const runningBefore = await page.evaluate(
      () => window.epsLab.panel.eam3d.getState().running,
    );
    await page.locator('body').click({ position: { x: 8, y: 8 } });
    await page.keyboard.press('Space');
    const runningAfter = await page.evaluate(
      () => window.epsLab.panel.eam3d.getState().running,
    );
    assert.equal(runningAfter, !runningBefore, 'Space toggles 3D EAM simulation running');
    await page.keyboard.press('Space');
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().running),
      runningBefore,
    );

    // Map mode buttons (live, lat, voltage, phase)
    for (const mode of ['lat', 'voltage', 'phase', 'live']) {
      await ws.locator(`[data-eam3d-map-mode="${mode}"]`).click();
      assert.equal(
        await page.evaluate(() => window.epsLab.panel.eam3d.getState().mapMode),
        mode,
      );
    }

    // Wall layer buttons and C-arm presets
    await ws.locator('[data-eam3d-wall="endo"]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().levers.wallLayer),
      'endo',
    );
    await ws.locator('[data-eam3d-wall="all"]').click();

    for (const carm of ['rao30', 'lao30', 'xray', 'ap']) {
      await ws.locator(`[data-eam3d-carm="${carm}"]`).click();
      assert.equal(
        await page.evaluate(() => window.epsLab.panel.eam3d.getState().carmPreset),
        carm,
      );
    }

    // Programmed Stimulation: Burst overdrive in AVNRT terminates to sinus; S1-S2 re-induces AVNRT
    await ws.locator('[data-eam3d-stim-mode="burst"]').click();
    await ws.locator('[data-eam3d-stim-bcl]').fill('240');
    await ws.locator('[data-eam3d-stim-bcl]').dispatchEvent('change');
    await ws.locator('[data-eam3d-deliver-stim]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().scenarioId),
      'sinus',
      'Burst overdrive terminates AVNRT to sinus',
    );

    await ws.locator('[data-eam3d-stim-mode="s1s2"]').click();
    await ws.locator('[data-eam3d-stim-s2]').fill('270');
    await ws.locator('[data-eam3d-stim-s2]').dispatchEvent('change');
    await ws.locator('[data-eam3d-deliver-stim]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().scenarioId),
      'avnrt',
      'S1-S2 270 ms re-induces AVNRT',
    );

    // 3D RF Ablation: Slow pathway ablation terminates AVNRT
    await ws.locator('[data-eam3d-ablate-line="slow-pathway"]').click();
    const verdictTr = await ws.locator('[data-eam3d-ablation-verdict]').textContent();
    assert.ok(verdictTr.includes('Sinüs'), `Slow pathway ablation terminates AVNRT: ${verdictTr}`);
    await ws.locator('[data-eam3d-clear-lesions]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().appliedLesions.length),
      0,
    );

    // Probabilistic Circuit Survey ("Find the circuit")
    await ws.locator('[data-eam3d-import-map]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().activeRail),
      'survey',
    );
    assert.equal(await ws.locator('[data-eam3d-circuit-row]').count(), 6);
    await ws.locator('[data-eam3d-circuit-row="1"]').click();
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().selectedCircuitIndex),
      1,
    );

    // Apply proposed minimal-intervention ablation line
    await ws.locator('[data-eam3d-apply-line]').first().click();
    assert.ok(
      (await page.evaluate(() => window.epsLab.panel.eam3d.getState().appliedLesions.length)) >= 1,
    );

    // Bridge buttons from 2D mapping panels open 3D EAM with matching preset
    await page.locator('[data-ep-section="substrate"]').click();
    await page.locator('[data-open-eam3d="substrate"]').click();
    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'eam3d');
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().scenarioId),
      'vt-ischemic',
    );
    assert.equal(
      await page.evaluate(() => window.epsLab.panel.eam3d.getState().mapMode),
      'voltage',
    );

    // English language switch
    await page.evaluate(() => window.epsLab.setLang('en'));
    assert.equal(
      await page.locator('[data-ep-section="eam3d"]').textContent(),
      '3D electroanatomic map',
    );
    assert.ok(
      (await ws.locator('.eam3d-deck-title').textContent()).includes('3D Electroanatomical Mapping'),
    );

    assert.deepEqual(errors, [], `desktop errors: ${errors.join(' | ')}`);
    await page.close();

    // Mobile 390px viewport check (no horizontal overflow)
    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const phoneErrors = watch(phone);
    await phone.goto(`${APP}/?lang=en#/eam3d`);
    await phone.locator('[data-eam3d-workstation]').waitFor({ state: 'visible' });
    const fit = await phone.evaluate(() => {
      const el = document.querySelector('[data-eam3d-workstation]');
      return {
        docScrollW: document.documentElement.scrollWidth,
        wsOverflow: el.scrollWidth - el.clientWidth,
      };
    });
    assert.ok(fit.docScrollW <= 390, `mobile scrollWidth ${fit.docScrollW} <= 390`);
    assert.equal(fit.wsOverflow, 0, 'workstation has no horizontal overflow on 390px');
    assert.deepEqual(phoneErrors, [], `phone errors: ${phoneErrors.join(' | ')}`);
    await phone.close();

    console.log(
      'PASS test-eam3d-browser: 3D EAM workstation, 4-chamber atlas, 26-channel polygraph, stimulation, RF ablation, circuit survey, bridges, TR/EN, mobile 390px',
    );
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
