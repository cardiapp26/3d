const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
// Layers and tools open as a drawer from the header tabs (tablet and desktop).
const openDrawer = async (page, id) => {
  const tab = page.locator(`[data-drawer=${id}]`);
  if (await tab.getAttribute('aria-expanded') !== 'true') await tab.click();
};

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  // Engine: correct / wrong / hint / reveal / next / summary.
  const { createPracticeSession, BASIC_LESSON } = await import(pathToFileURL(path.join(__dirname, '../src/practice.js')).href);
  const s = createPracticeSession(BASIC_LESSON, 'learn');
  assert.equal(s.pick('lv').result, 'wrong');
  assert.equal(s.next(), true, 'next is refused while the task is open');
  assert.equal(s.index, 0);
  assert.equal(s.pick('tricuspid-septal').result, 'correct', 'leaflet counts as the valve');
  assert.equal(s.pick('tricuspid').result, 'ignored', 'solved task ignores further picks');
  s.next();
  s.hint(); s.reveal(); s.next();
  s.pick('cs'); s.next();
  s.hint(); s.pick('lad'); s.next();
  s.pick('pulmonary-valve'); s.next();
  assert.equal(s.done, true);
  const sum = s.summary();
  assert.deepEqual([sum.independent, sum.withHint, sum.revealed, sum.errors, sum.hints], [3, 1, 1, 1, 2]);
  assert.deepEqual(sum.review, ['laa', 'lad']);

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.evaluate(() => localStorage.removeItem('cardia.practice.v1'));
    const state = () => page.evaluate(() => window.cardiaPractice.getState());

    // Lesson modes have their own steps: no practice switcher and no Findings tab there (compact right panel).
    assert.equal(await page.locator('.practice').isVisible(), false, 'practice switcher hidden in the EP lesson mode');
    assert.equal(await page.locator('.panel-tabs').isVisible(), false, 'single tab: no tab bar in lesson modes');
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');
    assert.equal(await page.locator('.practice').isVisible(), true, 'practice switcher in the anatomy mode');
    assert.deepEqual(await page.locator('.panel-tabs [role=tab]').allInnerTexts(), ['Öğren', 'İlerleme']);
    assert.equal(await page.locator('#practice-banner').isVisible(), false, 'no task in Explore');

    // Learn: starting moves to general anatomy and shows the task on the scene.
    await page.locator('[data-practice-select]').selectOption('learn');
    assert.equal(await page.evaluate(() => window.heart.getState().mode), 'anatomy');
    assert.match(await page.locator('#practice-banner').innerText(), /Görev 1\/5/);

    // A real click in the scene: hide the chambers, centre the tricuspid valve, click it.
    await openDrawer(page, 'layers');
    for (const layer of ['chambers', 'veins', 'vessels', 'coronaries']) await page.locator(`input[data-layer=${layer}]`).uncheck();
    await page.evaluate(() => window.heart.selectStructure('tricuspid', true));
    await page.waitForTimeout(300);
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    const box = await page.locator('#viewport canvas[data-engine]').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    assert.equal((await state()).summary.records[0].status, 'independent', 'scene click on the valve solves task 1');
    assert.match(await page.locator('#panel-learn .practice-feedback').innerText(), /Doğru/);
    for (const layer of ['chambers', 'veins', 'vessels', 'coronaries']) await page.locator(`input[data-layer=${layer}]`).check();

    // The structure list is not an answer.
    await page.locator('.practice-btn.primary-soft').click();
    await page.locator('#structure-select').selectOption('laa');
    assert.equal((await state()).summary.records[1].status, 'open', 'dropdown selection does not count');

    // Wrong pick in Learn: feedback names the pick and gives the hint; reveal appears.
    await page.evaluate(() => window.cardiaPractice.onScenePick('lv'));
    assert.match(await page.locator('#panel-learn .practice-feedback').innerText(), /hedef değil/);
    await page.getByRole('button', { name: 'Yanıtı göster' }).click();
    assert.equal(await page.evaluate(() => window.heart.getState().selected), 'laa', 'answer is shown in the scene');
    await page.locator('.practice-btn.primary-soft').click();
    for (const id of ['cs', 'lad', 'pulmonary-valve']) {
      await page.evaluate(pick => window.cardiaPractice.onScenePick(pick), id);
      await page.locator('.practice-btn.primary-soft').click();
    }
    assert.match(await page.locator('#panel-learn .practice-card h3').innerText(), /Ders tamamlandı/);
    assert.equal(await page.locator('#practice-banner').isVisible(), false);
    assert.match(await page.locator('#panel-learn .practice-review').innerText(), /Sol atriyal apendiks/);

    // Findings tab keeps the stored result across a reload.
    await page.reload();
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('#panel-tab-findings').click();
    assert.match(await page.locator('#panel-findings').innerText(), /Rehberli görev[\s\S]*Bağımsız/);

    // Test yourself: no names on hover, hint-free wrong feedback.
    await page.locator('#panel-tab-learn').click();
    await page.locator('[data-practice-select]').selectOption('test');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#hover-badge').isVisible(), false, 'hover name hidden while testing');
    await page.evaluate(() => window.cardiaPractice.onScenePick('lv'));
    assert.equal(await page.locator('#panel-learn .practice-feedback').innerText(), '✗ Doğru değil. Tekrar deneyin.'.replace('✗ ', ''));
    assert.equal(await page.getByRole('button', { name: 'Yanıtı göster' }).count(), 0, 'no reveal after one error in Test');

    // Leaving general anatomy ends the task; English labels.
    await page.locator('[data-mode=angiography]').dispatchEvent('click');
    assert.equal((await state()).style, 'explore');
    await page.locator('#lang-btn').click();
    assert.deepEqual(await page.locator('.practice-style-select option').allInnerTexts(), ['Free', 'Guided task', 'Test yourself']);
    await page.locator('#lang-btn').click();

    // Phone: starting from the Learn sheet returns to the scene with the task visible.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.evaluate(() => document.querySelector('[data-mode=anatomy]').click());   // the switcher belongs to the anatomy modes
    await page.locator('.mobile-tab[data-sheet=learn]').click();
    await page.locator('[data-practice-select]').selectOption('learn');
    assert.equal(await page.evaluate(() => document.body.dataset.sheet || null), null, 'sheet closes so the scene is usable');
    const banner = await page.locator('#practice-banner').boundingBox();
    assert.ok(banner && banner.x >= 0 && banner.x + banner.width <= 390, 'task banner fits the phone');
    const target = await page.locator('[data-practice-select]').evaluate(b => b.getBoundingClientRect().height);
    assert.ok(target >= 44, 'style select is a 44 px target');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    assert.deepEqual(errors, []);
    console.log('PASS: practice engine, Learn loop (scene click, list not an answer, hint, reveal, summary, review), stored findings, Test yourself hides hover names, mode exit, TR/EN, phone');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
