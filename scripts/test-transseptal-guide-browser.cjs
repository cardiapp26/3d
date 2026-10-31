/**
 * Transseptal guide panel in the transseptal lesson (EP anatomy page): tabs,
 * needle and clock in Equipment, the pullback jumps in Step by step with the
 * 3D step link, the LA confirmation rule, the site map driving the 3D rings,
 * the knowledge check, TR/EN, and no horizontal overflow at 375 px.
 * Usage: APP_URL=... node scripts/test-transseptal-guide-browser.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || null;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/eps/anatomy/#/mode/transseptal`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForFunction(() => window.heart.getState().mode === 'transseptal');
    const guide = page.locator('[data-ts-guide]');
    assert.equal(await guide.isVisible(), true, 'guide visible in the transseptal lesson');
    // Under the lesson step, closed by default so the step text stays in view.
    assert.equal(await page.evaluate(() => Boolean(document.querySelector('#step-detail').compareDocumentPosition(document.querySelector('[data-ts-guide]')) & Node.DOCUMENT_POSITION_FOLLOWING)), true, 'guide follows the step detail');
    assert.equal(await page.locator('[data-tsg-toggle]').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('.tsg-tab').count(), 0, 'closed guide shows only its header');
    await page.locator('[data-tsg-toggle]').click();
    assert.equal(await page.locator('[data-tsg-toggle]').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.tsg-tab').count(), 8);
    assert.equal(await page.locator('.tsg-kicker').textContent(), 'TRANSSEPTAL REHBER');
    const tab = id => page.locator(`[data-tsg-tab="${id}"]`).click();

    // Equipment: part card, needle position, clock verdict.
    await page.locator('[data-tsg-part="stylet"]').click();
    assert.match(await page.locator('.tsg-card h5').textContent(), /Stile/);
    await page.locator('[data-needle-pos="out"]').click();
    assert.equal(await page.locator('.tsg-note.warn').count(), 1, 'needle out warns');
    const hour = async v => page.locator('[data-tsg-hour]').evaluate((n, val) => { n.value = val; n.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    await hour('12');
    assert.equal(await page.locator('[data-clock-verdict]').getAttribute('data-clock-verdict'), 'anterior');
    await hour('4.5');
    assert.equal(await page.locator('[data-clock-verdict]').getAttribute('data-clock-verdict'), 'ok');

    // Step by step: pullback slider passes two jumps into tenting; the 3D link opens the lesson step.
    await tab('steps');
    await page.locator('[data-step-go="4"]').click();
    assert.match(await page.locator('[data-step-counter]').textContent(), /5\/10/);
    const pull = async v => page.locator('[data-tsg-pull]').evaluate((n, val) => { n.value = val; n.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    await pull('0.1');
    assert.equal(await page.locator('.tsg-badges').getAttribute('data-jumps'), '0');
    await pull('0.5');
    assert.equal(await page.locator('.tsg-badges').getAttribute('data-jumps'), '1');
    await pull('0.95');
    assert.equal(await page.locator('.tsg-badges').getAttribute('data-jumps'), '2');
    assert.equal(await page.locator('.tsg-badges').getAttribute('data-tent'), 'true');
    await page.locator('[data-tsg-view="rao"]').click();
    assert.match(await page.locator('[data-tsg-fluoro]').textContent(), /RAO 30/);
    await page.locator('[data-step-go="7"]').click();
    await page.locator('.tsg-btn-3d').click();
    await page.waitForTimeout(300);
    assert.match(await page.locator('#steps button.current').first().textContent(), /Septal geçiş/, '3D lesson moves to the crossing step');
    assert.equal(await guide.isVisible(), true, 'guide stays open on the lesson step');

    // LA confirmation: subjective signs are not enough, pressure makes it enough, an alarm sign overrides.
    await tab('confirm');
    const tick = id => page.locator(`[data-tsg-sign="${id}"]`).check();
    await tick('give'); await tick('tent');
    assert.equal(await page.locator('[data-la-verdict]').getAttribute('data-la-verdict'), 'more');
    await tick('pressure');
    assert.equal(await page.locator('[data-la-verdict]').getAttribute('data-la-verdict'), 'enough');
    await tick('aortic');
    assert.equal(await page.locator('[data-la-verdict]').getAttribute('data-la-verdict'), 'aortic');

    // Sites: pick LAA occlusion on the map, then show the rings in 3D.
    await tab('sites');
    await page.locator('[data-tsg-site="laac"]').first().click();
    assert.equal(await page.locator('[data-site-card]').getAttribute('data-site-card'), 'laac');
    assert.equal(await page.evaluate(() => window.heart.getCatheterVisibility().sites), false);
    await page.locator('[data-site-show]').click();
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.heart.getCatheterVisibility().sites), true, '3D target rings shown');
    assert.equal(await page.locator('[data-ts-cath=sites]').isChecked(), true, 'left panel switch follows');

    for (const id of ['trouble', 'complications', 'history']) {
      await tab(id);
      assert.ok((await page.locator('[data-tsg-panel]').textContent()).length > 200, `${id} has content`);
    }

    // Knowledge check: right and wrong feedback, score.
    await tab('quiz');
    await page.locator('[data-quiz-pick="0"]').click();
    assert.equal(await page.locator('[data-quiz-feedback]').getAttribute('data-quiz-feedback'), 'right');
    await page.locator('[data-quiz-next]').click();
    await page.locator('[data-quiz-pick="0"]').click();
    assert.equal(await page.locator('[data-quiz-feedback]').getAttribute('data-quiz-feedback'), 'wrong');
    assert.equal(await page.locator('[data-quiz-score]').getAttribute('data-quiz-score'), '1');

    // English.
    await page.locator('#lang-btn').click();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.tsg-kicker').textContent(), 'TRANSSEPTAL GUIDE');
    assert.equal(await page.locator('[data-tsg-tab="steps"]').textContent(), 'Step by step');
    assert.match(await page.locator('[data-tsg-panel]').textContent(), /Score/);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await guide.screenshot({ path: `${SHOTS}/ts-guide-desktop.png` }); }

    // Phone, 375 px: every tab fits without horizontal overflow.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    if (await page.evaluate(() => document.body.dataset.sheet !== 'learn')) await page.locator('.mobile-tab[data-sheet=learn]').click();
    for (const id of ['equipment', 'steps', 'confirm', 'sites', 'trouble', 'complications', 'history', 'quiz']) {
      await tab(id);
      await guide.scrollIntoViewIfNeeded();
      const box = await guide.evaluate(el => ({ w: el.clientWidth, s: el.scrollWidth, right: el.getBoundingClientRect().right }));
      assert.ok(box.s <= box.w + 1, `${id}: no overflow inside the guide (${box.s} > ${box.w})`);
      assert.ok(box.right <= 376, `${id}: guide within the phone width (${box.right})`);
      const page375 = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(page375 <= 376, `${id}: no page overflow (${page375})`);
    }
    if (SHOTS) await guide.screenshot({ path: `${SHOTS}/ts-guide-mobile.png` });

    assert.deepEqual(errors, [], 'no console errors');
    console.log('PASS transseptal guide browser: equipment, pullback jumps, 3D step link, LA rule, site rings, quiz, TR/EN, 375 px');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
