const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  // Pure ranking: Turkish folding, abbreviations, both languages, modes first.
  const { normalizeSearch, abbreviations, rankSearch } = await import(pathToFileURL(path.join(__dirname, '../src/quick-search.js')).href);
  assert.equal(normalizeSearch('Sağ İleti ŞİŞLİ Çıkış'), 'sag ileti sisli cikis');
  assert.deepEqual(abbreviations('Sol ventrikül • LV'), ['lv']);
  const items = [
    { kind: 'structure', id: 'lv', label: 'Sol ventrikül • LV', alt: 'Left ventricle • LV' },
    { kind: 'structure', id: 'lad', label: 'Sol ön inen arter • LAD', alt: 'Left anterior descending • LAD' },
    { kind: 'structure', id: 'tricuspid', label: 'Triküspit kapak', alt: 'Tricuspid valve' },
    { kind: 'mode', id: 'ablation', label: 'Ablasyon anatomisi', alt: 'Ablation anatomy' },
    { kind: 'structure', id: 'koch', label: 'Koch üçgeni (ablasyon)', alt: 'Triangle of Koch' },
  ];
  assert.equal(rankSearch('lv', items)[0].id, 'lv', 'abbreviation wins');
  assert.equal(rankSearch('triküs', items)[0].id, 'tricuspid', 'Turkish prefix');
  assert.equal(rankSearch('trikus', items)[0].id, 'tricuspid', 'without diacritics');
  assert.equal(rankSearch('tricuspid', items)[0].id, 'tricuspid', 'other language');
  assert.equal(rankSearch('ablas', items)[0].id, 'ablation', 'mode before structure on a tie');
  assert.equal(rankSearch('sol on', items)[0].id, 'lad', 'multi-word prefixes');
  assert.deepEqual(rankSearch('', items), []);
  assert.deepEqual(rankSearch('zzz', items), []);

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const input = page.locator('#header-search input');

    // Empty query: grouped mode picker with the current mode marked.
    await input.focus();
    assert.equal(await input.getAttribute('aria-expanded'), 'true');
    assert.ok((await page.locator('#header-search .quick-search-group').allInnerTexts()).length >= 3, 'mode groups listed');
    assert.equal(await page.locator('#header-search [aria-current=true]').first().getAttribute('data-id'), 'anatomy');

    // Pick a mode by typing; the recent list remembers the previous one.
    await input.fill('ablas');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'ablation');
    await input.focus();
    assert.equal(await page.locator('#header-search .quick-search-option').first().getAttribute('data-id'), 'anatomy', 'recent mode first');
    await page.keyboard.press('Escape');
    await page.locator('[data-mode=anatomy]').click();

    // Hidden structure: search shows it, opens its group and selects it.
    await page.locator('[data-group=valves] input[data-layer=valves]').uncheck();
    await input.fill('trikus');
    const first = page.locator('#header-search .quick-search-option').first();
    assert.equal(await first.getAttribute('data-kind'), 'structure');
    await page.keyboard.press('Enter');
    const picked = await page.evaluate(() => window.heart.getState().selected);
    assert.match(picked, /^tricuspid/);
    assert.equal(await page.locator('input[data-layer=valves]').isChecked(), true, 'layer switched back on');
    assert.equal(await page.locator('[data-group=valves] .group-toggle').getAttribute('aria-expanded'), 'true', 'group opened');
    assert.match(await page.locator('#structure-title').innerText(), /Trik|Tric/);

    // Keyboard: ArrowDown moves the active option; Escape closes, then clears.
    await input.fill('ven');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#header-search [aria-selected=true]').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await input.getAttribute('aria-expanded'), 'false');
    await page.keyboard.press('Escape');
    assert.equal(await input.inputValue(), '');

    // A structure outside an isolated mode leaves that mode.
    await page.locator('[data-mode=atria]').click();
    await input.fill('LAD');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.equal(await page.evaluate(() => window.heart.getState().selected), 'lad');

    // Ctrl+K focuses the search from the scene; typing does not trigger shortcuts.
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Control+k');
    assert.equal(await page.evaluate(() => document.activeElement?.closest('#header-search') != null), true);
    await page.keyboard.type('a');
    assert.equal(await page.evaluate(() => document.querySelector('[data-view].selected')?.dataset.view), 'anterior', 'typing "a" stays in the field');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');

    // English labels and bilingual matching.
    await page.locator('#lang-btn').click();
    assert.equal(await input.getAttribute('placeholder'), 'Search structure or mode');
    await input.fill('kapak');
    assert.ok(await page.locator('#header-search .quick-search-option').count() > 0, 'Turkish query finds English-labelled structures');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.locator('#lang-btn').click();

    // Phone: search lives in the Modes sheet; picking a structure opens Learn.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#header-search').isVisible(), false);
    await page.keyboard.press('Control+k');
    assert.equal(await page.evaluate(() => document.body.dataset.sheet), 'modes');
    const mobileInput = page.locator('#aside-search input');
    assert.equal(await mobileInput.isVisible(), true);
    assert.ok((await mobileInput.boundingBox()).height >= 44);
    await mobileInput.fill('mitral kapak');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.body.dataset.sheet), 'learn', 'Learn opens with the description');
    assert.match(await page.locator('#structure-title').innerText(), /Mitral/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    assert.deepEqual(errors, []);
    console.log('PASS: quick search ranking (TR folding, abbreviations, bilingual, modes first), mode picker with recents, hidden-structure reveal, mode exit, keyboard, Ctrl+K, TR/EN, phone sheet');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
