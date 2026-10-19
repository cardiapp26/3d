const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5173'}/?lang=tr#/mode/anatomy`);
    await page.waitForSelector('#notes-toggle');
    assert.equal(await page.locator('#personal-notes-input').isVisible(), false, 'drawer starts hidden at the right edge');
    await page.locator('#notes-toggle').click();
    await page.waitForFunction(() => document.querySelector('#notes-drawer').getBoundingClientRect().right <= innerWidth + 1);
    await page.locator('#personal-notes-input').fill('Anatomi kişisel not <script>');
    await page.evaluate(() => { location.hash = '#/mode/atria'; });
    await page.waitForFunction(() => document.documentElement.dataset.appMode === 'atria');
    assert.equal(await page.locator('#personal-notes-input').inputValue(), '');
    await page.locator('#personal-notes-input').fill('Sol atriyum notu');
    await page.evaluate(() => { location.hash = '#/mode/anatomy'; });
    await page.waitForFunction(() => document.documentElement.dataset.appMode === 'anatomy');
    assert.equal(await page.locator('#personal-notes-input').inputValue(), 'Anatomi kişisel not <script>');
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
    await page.locator('#personal-notes-input').fill('Unsaved draft');
    await page.evaluate(() => { location.hash = '#/mode/atria'; });
    await page.waitForFunction(() => document.documentElement.dataset.appMode === 'atria');
    await page.evaluate(() => { location.hash = '#/mode/anatomy'; });
    await page.waitForFunction(() => document.documentElement.dataset.appMode === 'anatomy');
    assert.equal(await page.locator('#personal-notes-input').inputValue(), 'Unsaved draft');
    assert.match(await page.locator('#personal-notes-save-status').textContent(), /Kayıt yapılamadı/);
    await page.reload();
    await page.locator('#notes-toggle').click();
    assert.equal(await page.locator('#personal-notes-input').inputValue(), 'Anatomi kişisel not <script>');
    await page.locator('#lang-btn').click();
    await page.waitForFunction(() => document.querySelector('#notes-toggle').textContent.includes('Notes') && document.querySelector('#notes-drawer-title').textContent === 'Personal notes');
    assert.equal(await page.locator('#personal-notes-input').inputValue(), 'Anatomi kişisel not <script>');
    await page.setViewportSize({ width: 390, height: 844 });

    assert.equal(await page.locator('#personal-notes-input').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('[data-notes-close]').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#notes-drawer')).visibility === 'hidden');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'notes-toggle', 'focus returns to the Notes button');
    // Every module page has the drawer, with its own section note.
    for (const path of ['echo/', 'ecg/', 'angio/', 'eps/', 'pharmacology/', 'hemo/']) {
      await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5173'}/${path}`);
      await page.locator('#notes-toggle').click();
      await page.locator('#personal-notes-input').fill(`note ${path}`);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#notes-drawer')).visibility === 'hidden');
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('cardia.personal-notes.v1.ecg')), 'note ecg/');
    assert.equal(await page.evaluate(() => localStorage.getItem('cardia.personal-notes.v1.cath')), 'note hemo/');
    assert.deepEqual(errors, []);
    console.log('PASS personal notes: right-edge drawer, section isolation, persistence, language, mobile, close, every module page');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
