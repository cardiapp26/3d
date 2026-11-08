// Endovascular procedure panel on the peripheral angiography page: a right CIA case from
// wire to completion angiogram, severity restart, language switch and the no-lesion state.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const { startApp } = require('./lib/app-server.cjs');

(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${app.url}/angio/peripheral/?lang=tr`);
    const iv = page.locator('[data-peri-iv]');
    await iv.waitFor();
    assert.match(await iv.textContent(), /lezyon senaryosu seçin/, 'no lesion: the panel asks for one');

    await page.selectOption('[data-peri-lesion-select]', 'right-cia-ostial');
    const ds = () => iv.locator('[data-iv-qca="ds"] strong').textContent();
    const act = (name) => iv.locator(`[data-iv-act="${name}"]`).click();
    assert.equal(await ds(), '80%');
    assert.equal(await iv.locator('[data-iv-act="positionBalloon"]').isDisabled(), true, 'balloon step locked before the wire');

    await act('wire');
    assert.equal(await iv.locator('[data-iv-step="1"]').getAttribute('data-state'), 'done');
    await act('catheter');
    await act('pullback');
    assert.equal(await iv.locator('[data-iv-gradient]').getAttribute('data-significant'), 'true', '80% iliac stenosis is significant at rest');

    await act('positionBalloon');
    await act('nominal');
    assert.match(await iv.locator('[data-iv-balloon-status]').textContent(), /8 atm/);
    await act('deflate');
    const afterBalloon = parseInt(await ds(), 10);
    assert.ok(afterBalloon < 80, `balloon lowers the stenosis (${afterBalloon}%)`);

    await act('stent');
    await act('completion');
    const outcome = iv.locator('[data-iv-outcome]');
    assert.equal(await outcome.getAttribute('data-outcome'), 'success');
    assert.ok(parseInt(await ds(), 10) < 20, 'stented residual below 20%');
    assert.equal(await iv.locator('[data-iv-log] li').count(), 7, 'log: wire, catheter, gradient, balloon in/out, stent, completion');
    assert.match(await page.locator('.peri-lesion-pct').textContent(), /-%80/, 'lesion card keeps the baseline severity');

    // Severity chip restarts the procedure at that narrowing.
    await iv.locator('[data-iv-sev="50"]').click();
    assert.equal(await ds(), '50%');
    assert.equal(await iv.locator('[data-iv-step="1"]').getAttribute('data-state'), 'open');
    assert.match(await page.locator('.peri-lesion-pct').textContent(), /-%50/);

    // Language switch re-labels the panel.
    await page.locator('[data-peri-lang="en"]').click();
    await page.waitForURL(/lang|peripheral/);
    await iv.waitFor();
    assert.match(await iv.locator('.peri-subcard-title').first().textContent(), /Endovascular intervention/);

    assert.deepEqual(errors, [], `pageerror: ${errors.join(' | ')}`);
    console.log('PASS peripheral intervention browser: iliac case to completion, severity restart, language');
  } finally {
    await browser.close();
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
