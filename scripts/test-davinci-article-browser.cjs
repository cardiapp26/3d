// Bradfield et al. figures and clinical checks inside the Da Vinci workbench
// topics: no separate article tab, figures per topic, panels, lightbox,
// "show in the lab", in-topic clinical check and source note.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5192'}/ecg/?lang=tr`);
    await page.locator('[data-davinci-tab]').click();
    await page.locator('.da-atlas[data-loaded=true]').waitFor({ timeout: 30000 });

    assert.equal(await page.locator('[data-davinci-section="article"]').count(), 0, 'no separate article tab');
    const cards = async () => page.locator('.da-source-card').evaluateAll(n => n.map(c => c.id));
    assert.deepEqual(await cards(), ['da-card-1', 'da-card-2', 'da-card-10', 'da-card-11'], 'Cabrera topic shows Figures 1, 2, 10, 11');
    for (const [tab, ids] of [['heights', ['da-card-3', 'da-card-4', 'da-card-5', 'da-card-6', 'da-card-12']], ['nomenclature', ['da-card-7', 'da-card-8']], ['atrial', ['da-card-9']]]) {
      await page.locator(`[data-davinci-section="${tab}"]`).click();
      assert.deepEqual(await cards(), ids, `${tab} topic figures`);
    }
    await page.locator('[data-davinci-section="icns"]').click();
    assert.equal(await page.locator('.da-source-card').count(), 0, 'separate-source ICNS topic has no Bradfield figures');

    // Panels, legend and lightbox.
    await page.locator('[data-davinci-section="cabrera"]').click();
    const fig1 = page.locator('#da-card-1');
    await fig1.locator('[data-fig-panel="B"]').click();
    assert.match(await page.locator('#da-card-1 .da-source-panel').textContent(), /Nonkoroner aort sinüsü/);
    await page.locator('.da-fig-mini-card').click();
    await page.locator('.da-lightbox').waitFor({ state: 'visible' });
    assert.match(await page.locator('.da-lightbox-bar h4').textContent(), /Şekil 2/);
    await page.keyboard.press('ArrowRight');
    assert.match(await page.locator('.da-lightbox-bar h4').textContent(), /Şekil 3/);
    assert.match(await page.locator('.da-lightbox-cite').textContent(), /CC BY-NC-ND 4\.0/);
    await page.keyboard.press('Escape');
    await page.locator('.da-lightbox').waitFor({ state: 'detached' });

    // "Study below" scrolls to the in-topic card; "show in the lab" applies its target.
    await page.locator('[data-da-goto-article]').click();
    assert.equal(await page.locator('#da-card-2').evaluate(n => n.classList.contains('is-flash')), true);
    await page.locator('[data-cab-mode="standard"]').click();
    await page.locator('#da-card-10 [data-fig-try="10"]').click();
    assert.equal(await page.locator('[data-cab-mode="cabrera"]').getAttribute('aria-pressed'), 'true', 'Figure 10 target restores Cabrera order');
    await page.locator('#da-card-11 [data-fig-try="11"]').click();
    assert.equal(await page.locator('[data-scenario="mi_contiguous"]').getAttribute('aria-pressed'), 'true', 'Figure 11 target selects inferior ST');

    // In-topic clinical check: correct option is not always first; feedback and simulation.
    const check = page.locator('[data-challenge="rvot_vector"]');
    assert.notEqual(await check.locator('[data-opt-id]').first().getAttribute('data-opt-id'), 'opt_correct');
    await check.locator('[data-opt-id="opt_correct"]').click();
    await page.locator('[data-challenge="rvot_vector"] .da-check-feedback.is-right').waitFor();
    await page.locator('[data-challenge="rvot_vector"] [data-challenge-sim]').click();
    assert.equal(await page.locator('[data-scenario="rvot_shift"]').getAttribute('aria-pressed'), 'true');
    assert.equal(Number(await page.locator('[data-da-slider="rvotFocus"]').inputValue()), 0.85);
    assert.equal(await page.locator('[data-da-rvot-segments]').getAttribute('href'), '../eps/#/ves', 'RVOT slider links to the EPS segment map');
    assert.match(await page.locator('.da-evidence-body').textContent(), /Miyazaki 2026/);

    // Paper identity in the source note; English switch keeps topic.
    await page.locator('.da-evidence details summary').click();
    assert.match(await page.locator('.da-paper-note').textContent(), /Shumpei Mori/);
    assert.equal(await page.locator('.da-paper-note li').count(), 3, 'three take-home messages');
    await page.locator('[data-ecg-lang="en"]').click();
    assert.match(await page.locator('#da-card-1 .da-source-num').textContent(), /FIGURE 1/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#da-card-1').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, 'mobile has no horizontal overflow');
    assert.deepEqual(errors, []);
    console.log('PASS Da Vinci figures in topics: per-topic figure placement, no article tab, panels, lightbox with keyboard and license, scroll to card, show-in-lab targets, in-topic clinical check, paper note, EN, mobile');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
