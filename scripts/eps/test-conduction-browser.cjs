// Conduction system lesson in a real browser: the tab opens from the address, the atlas heart
// loads, structure cards switch from the list, the 3D view and the 2D diagram, one beat plays
// to the end (ventricles activated, trace drawn), a "what if" scenario changes the intervals,
// the blood-supply overlay toggles, TR / EN both render, a phone fits without horizontal
// scroll, and the 2D diagram takes over when WebGL is missing. No page or console errors.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.EPS_URL || `${(process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')}/eps`).replace(/\/$/, '');

const watch = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Failed requests are reported with their address (the console line has none).
  page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
};
const state = (page) => page.evaluate(() => window.epsLab.panel.conduction.getState());
const atlasSettled = (page) => page.waitForFunction(() => ['ready', 'failed', 'nowebgl'].includes(document.querySelector('[data-conduction]')?.dataset.atlas), null, { timeout: 60000 });
const painted = (page, sel) => page.locator(sel).evaluate((c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 53) if (d[i] + d[i + 1] + d[i + 2] > 420) n++;
  return n;
});

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = watch(page);
    await page.goto(`${APP}/?lang=tr#/conduction`);
    const lab = page.locator('[data-conduction]');
    await lab.waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.epsLab.panel.getActiveView()), 'conduction');
    assert.equal(await page.locator('[data-ep-section=conduction]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-ep-section=treatment]').getAttribute('aria-selected'), 'false');
    assert.equal(await lab.locator('h2').textContent(), 'SA düğümünden Purkinje ağına: bir atımın yolu');
    await atlasSettled(page);
    const atlas = await lab.getAttribute('data-atlas');
    assert.equal(atlas, 'ready', 'the atlas heart loads in Chrome');
    assert.equal(await lab.getAttribute('data-mode'), '3d');

    // Structure cards switch from the list.
    const cards = { sa: ['Sinüs düğümü (SA)', '60-100/dk', '0,05 m/sn'], avn: ['AV düğüm', '40-60/dk', '0,01-0,05 m/sn'], purkinje: ['Purkinje ağı', '20-40/dk', '2-4 m/sn'], bachmann: ['Bachmann demeti', 'Normalde pacemaker değildir', '1-1,7 m/sn'] };
    for (const [id, [name, rate, velocity]] of Object.entries(cards)) {
      await lab.locator(`[data-cond-structure=${id}]`).click();
      assert.equal(await lab.locator('[data-cond-card] h3').textContent(), name);
      assert.equal(await lab.locator('[data-cond-rate]').textContent(), rate);
      assert.equal(await lab.locator('[data-cond-velocity]').textContent(), velocity);
      assert.equal(await lab.locator(`[data-cond-structure=${id}]`).getAttribute('aria-pressed'), 'true');
    }

    // Clicking the SA node on the 3D heart selects it.
    const point = await page.evaluate(() => window.epsLab.panel.conduction.getAtlas().screenPoint('sa'));
    await page.mouse.click(point.x, point.y);
    assert.equal((await state(page)).selected, 'sa');
    assert.equal(await lab.locator('[data-cond-card] h3').textContent(), 'Sinüs düğümü (SA)');

    // One beat plays to the end: phases advance, ventricles activate, the trace is drawn.
    await lab.locator('[data-cond-speed]').selectOption('1');
    await lab.locator('[data-cond-play]').click();
    await page.waitForFunction(() => document.querySelector('[data-conduction]').dataset.playing === 'true');
    await page.waitForFunction(() => document.querySelector('[data-conduction]').dataset.phase === 'avn', null, { timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('[data-conduction]').dataset.playing === 'false', null, { timeout: 15000 });
    const end = await state(page);
    assert.equal(end.time, 800);
    assert.equal(await lab.getAttribute('data-phase'), 'repolarisation');
    const activation = await page.evaluate(() => window.epsLab.panel.conduction.getAtlas().getActivation());
    assert.ok(activation.atria > 0.99 && activation.ventricles > 0.99, JSON.stringify(activation));
    assert.ok(await painted(page, '[data-cond-trace]') > 20, 'trace drawn');
    await page.evaluate(() => window.epsLab.panel.conduction.seek(200));
    const mid = await page.evaluate(() => window.epsLab.panel.conduction.getAtlas().getActivation());
    assert.ok(mid.ventricles > 0.02 && mid.ventricles < 0.8, `mid-QRS ${mid.ventricles}`);
    assert.equal(await lab.locator('[data-cond-step].is-now').getAttribute('data-cond-step'), 'ventricles');

    // "What if": right bundle branch block widens the QRS; back to normal.
    await lab.locator('[data-cond-structure=rbb]').click();
    await lab.locator('[data-cond-whatif]').click();
    assert.equal((await state(page)).scenario, 'rbbb');
    assert.equal(await lab.locator('[data-cond-whatif]').getAttribute('aria-pressed'), 'true');
    assert.equal(await lab.locator('[data-cond-interval=qrs] strong').textContent(), '140 ms');
    await lab.locator('[data-cond-normal]').click();
    assert.equal((await state(page)).scenario, 'normal');
    assert.equal(await lab.locator('[data-cond-interval=qrs] strong').textContent(), '90 ms');
    await lab.locator('[data-cond-structure=avn]').click();
    await lab.locator('[data-cond-whatif]').click();
    assert.equal(await lab.locator('[data-cond-interval=pr] strong').textContent(), '280 ms');
    await lab.locator('[data-cond-normal]').click();

    // Blood-supply overlay and views.
    await lab.locator('[data-cond-supply]').click();
    assert.equal(await lab.locator('[data-cond-supply]').getAttribute('aria-pressed'), 'true');
    assert.ok(await lab.locator('.cond-legend').isVisible());
    await lab.locator('[data-cond-view=lao]').click();
    assert.equal(await lab.locator('.cond-atlas').getAttribute('data-view'), 'lao');
    await lab.locator('[data-cond-supply]').click();

    // 2D diagram: same selection by clicking a structure.
    await lab.locator('[data-cond-mode="2d"]').click();
    assert.equal(await lab.getAttribute('data-mode'), '2d');
    assert.ok(await lab.locator('.cond-diagram').isVisible());
    assert.ok(!(await lab.locator('.cond-atlas').isVisible()));
    await lab.locator('.cond-diagram circle[data-structure=avn]').first().click({ force: true });
    assert.equal((await state(page)).selected, 'avn');
    await lab.locator('.cond-diagram text[data-structure=lpf]').click();
    assert.equal(await lab.locator('[data-cond-card] h3').textContent(), 'Sol posterior fasikül');
    await page.evaluate(() => window.epsLab.panel.conduction.seek(230));
    assert.equal(await lab.locator('[data-cond-step].is-now').getAttribute('data-cond-step'), 'ventricles');
    await lab.locator('[data-cond-mode="3d"]').click();
    assert.equal(await lab.getAttribute('data-mode'), '3d');

    // English.
    await page.evaluate(() => window.epsLab.setLang('en'));
    assert.equal(await lab.locator('h2').textContent(), 'From the SA node to the Purkinje network: the path of one beat');
    assert.equal(await page.locator('[data-ep-section=conduction]').textContent(), 'Conduction system');
    assert.equal(await lab.locator('[data-cond-card] h3').textContent(), 'Left posterior fascicle');
    assert.equal(await lab.locator('[data-cond-rate]').textContent(), '20-40/min');
    assert.ok((await lab.locator('.cond-sources a').count()) === 9);
    assert.ok((await lab.locator('.cond-table tbody tr').count()) === 11);
    assert.deepEqual(errors, [], `desktop errors: ${errors.join(' | ')}`);
    await page.close();

    // Phone: 375 px wide, no horizontal page scroll, the card and the trace fit.
    const phone = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const phoneErrors = watch(phone);
    await phone.goto(`${APP}/?lang=en#/conduction`);
    await phone.locator('[data-conduction]').waitFor({ state: 'visible' });
    await atlasSettled(phone);
    await phone.locator('[data-cond-structure=his]').click();
    const fit = await phone.evaluate(() => {
      const lab = document.querySelector('[data-conduction]');
      const over = [...lab.querySelectorAll('*')].filter((e) => e.offsetParent !== null && !e.closest('.cond-table-scroll') && e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.className || e.tagName);
      return { doc: document.documentElement.scrollWidth, lab: lab.scrollWidth - lab.clientWidth, over, trace: document.querySelector('[data-cond-trace]').getBoundingClientRect().width };
    });
    assert.ok(fit.doc <= 375, `page scroll width ${fit.doc}`);
    assert.equal(fit.lab, 0, 'lesson has no horizontal scroll');
    assert.deepEqual(fit.over, [], `overflowing: ${fit.over.join(', ')}`);
    assert.ok(fit.trace > 300 && fit.trace <= 375);
    assert.equal(await phone.locator('[data-cond-card] h3').textContent(), 'His bundle');
    assert.deepEqual(phoneErrors, [], `phone errors: ${phoneErrors.join(' | ')}`);
    await phone.close();

    // No WebGL: the 2D diagram takes over with a notice.
    const flat = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await flat.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(kind, ...rest) { return /webgl/i.test(kind) ? null : original.call(this, kind, ...rest); };
    });
    const flatErrors = watch(flat);
    await flat.goto(`${APP}/?lang=tr#/conduction`);
    await flat.locator('[data-conduction]').waitFor({ state: 'visible' });
    await atlasSettled(flat);
    const flatLab = flat.locator('[data-conduction]');
    assert.equal(await flatLab.getAttribute('data-atlas'), 'nowebgl');
    assert.equal(await flatLab.getAttribute('data-mode'), '2d');
    assert.ok(await flatLab.locator('.cond-diagram').isVisible());
    assert.equal(await flatLab.locator('.cond-status').textContent(), 'WebGL kullanılamıyor; 2D şema gösteriliyor.');
    await flatLab.locator('[data-cond-structure=laf]').click();
    await flatLab.locator('[data-cond-whatif]').click();
    assert.equal((await state(flat)).scenario, 'lafb');
    assert.equal(await flatLab.locator('.cond-diagram').getAttribute('data-selected'), 'laf');
    assert.deepEqual(flatErrors, [], `fallback errors: ${flatErrors.join(' | ')}`);
    await flat.close();
    console.log('PASS conduction lesson browser: atlas, cards, 3D and 2D selection, beat, what-if, supply, TR/EN, phone, no-WebGL fallback');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
