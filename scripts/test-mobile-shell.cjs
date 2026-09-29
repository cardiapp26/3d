const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const sheet = page => page.evaluate(() => document.body.dataset.sheet || null);
const visibleAside = page => page.evaluate(() => getComputedStyle(document.querySelector('.workspace > aside')).visibility === 'visible');
const visibleArticle = page => page.evaluate(() => getComputedStyle(document.querySelector('.workspace > article')).visibility === 'visible');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');

    // Scene first: no sheet open, scene takes at least half the height, no page overflow.
    assert.equal(await sheet(page), null);
    const layout = await page.evaluate(() => ({ main: document.querySelector('main').getBoundingClientRect().height, vh: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth }));
    assert.ok(layout.main >= layout.vh * 0.5, `scene keeps at least half the screen (${layout.main}/${layout.vh})`);
    assert.equal(layout.overflow, 0, 'no horizontal page overflow');
    assert.equal(await visibleAside(page), false, 'left panel is not stacked under the scene');

    // Tab bar: four sheets, Tools only when the mode has tools; 44 px targets.
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.mobile-tab')].map(b => ({ id: b.dataset.sheet, hidden: b.hidden, h: b.getBoundingClientRect().height })));
    assert.deepEqual(tabs.map(t => t.id), ['modes', 'layers', 'learn', 'tools']);
    assert.equal(tabs.find(t => t.id === 'tools').hidden, true, 'no Tools sheet in general anatomy');
    for (const t of tabs.filter(t => !t.hidden)) assert.ok(t.h >= 44, `${t.id} tab is a 44 px target`);

    // Layers sheet: layer controls only, groups usable.
    await page.locator('.mobile-tab[data-sheet=layers]').click();
    assert.equal(await sheet(page), 'layers');
    assert.equal(await visibleAside(page), true);
    assert.equal(await page.locator('aside nav').isVisible(), false, 'mode list is not in the Layers sheet');
    assert.equal(await page.locator('#layers').isVisible(), true);
    await page.locator('[data-group=valves] .group-toggle').click();
    assert.equal(await page.locator('input[data-layer="papillary"]').isVisible(), true);
    const toggleH = await page.locator('[data-group=valves] .group-toggle').evaluate(b => b.getBoundingClientRect().height);
    assert.ok(toggleH >= 44, 'group toggles are 44 px targets');

    // One sheet at a time: opening Learn closes Layers; focus moves into the sheet.
    await page.locator('.mobile-tab[data-sheet=learn]').click();
    assert.equal(await sheet(page), 'learn');
    assert.equal(await visibleAside(page), false, 'only one sheet is open');
    assert.equal(await visibleArticle(page), true);
    assert.ok(await page.evaluate(() => document.activeElement.classList.contains('sheet-close')), 'focus moves to the sheet');
    const heights = [];
    heights.push(await page.locator('.workspace > article').evaluate(a => a.getBoundingClientRect().height));
    for (let i = 0; i < 2; i++) {
      await page.locator('.workspace > article .sheet-btn[data-sheet-size]').click();
      await page.waitForTimeout(250);
      heights.push(await page.locator('.workspace > article').evaluate(a => a.getBoundingClientRect().height));
    }
    assert.ok(heights[0] < heights[1] && heights[1] < heights[2], `Learn grows peek < half < full (${heights.join(' / ')})`);
    await page.keyboard.press('Escape');
    assert.equal(await sheet(page), null, 'Escape closes the sheet');
    assert.ok(await page.evaluate(() => document.activeElement?.dataset.sheet === 'learn'), 'focus returns to the opener');

    // Selection is shared with the scene and survives opening/closing sheets.
    await page.locator('.mobile-tab[data-sheet=learn]').click();
    await page.locator('#structure-select').selectOption('ra');
    await page.locator('.workspace > article .sheet-close').click();
    assert.equal(await page.evaluate(() => window.heart.getState().selected), 'ra', 'selection kept after closing');
    await page.locator('.mobile-tab[data-sheet=learn]').click();
    assert.match(await page.locator('#structure-title').innerText(), /RA/, 'reopened sheet shows the same structure');
    await page.locator('.workspace > article .sheet-close').click();

    // Modes sheet: choosing a mode returns to the scene and exposes its tools.
    await page.locator('.mobile-tab[data-sheet=modes]').click();
    await page.locator('[data-mode=atria]').click();
    assert.equal(await sheet(page), null, 'mode choice returns to the scene');
    assert.equal(await page.locator('.mobile-tab[data-sheet=tools]').isVisible(), true, 'atria mode offers Tools');
    assert.equal(await page.locator('.mobile-tab[data-sheet=layers]').isVisible(), false, 'isolated atria mode has no layer list');
    await page.locator('.mobile-tab[data-sheet=tools]').click();
    assert.equal(await page.locator('#atria-tools').isVisible(), true);
    await page.locator('.workspace > aside .sheet-close').click();

    // Language switch relabels the shell.
    await page.locator('#lang-btn').click();
    assert.deepEqual(await page.locator('.mobile-tab:visible .mobile-tab-label').allInnerTexts(), ['Modes', 'Learn', 'Tools']);
    await page.locator('#lang-btn').click();

    // C-Arm tool: hidden while collapsed, full-width above the tab bar when open.
    await page.locator('[data-mode=anatomy]').evaluate(b => b.click());
    assert.equal(await page.locator('#carm-panel').isVisible(), false);
    await page.locator('#carm-toggle-dock').click();
    const carm = await page.locator('#carm-panel').evaluate(el => ({ w: el.getBoundingClientRect().width, bottom: el.getBoundingClientRect().bottom, bar: document.querySelector('.mobile-tabs').getBoundingClientRect().top }));
    assert.ok(Math.abs(carm.w - 390) < 2 && carm.bottom <= carm.bar + 1, 'C-Arm opens full width above the tab bar');
    // The open drawer covers the scene dock; its header closes it.
    await page.locator('#carm-header .carm-title-group').click();
    assert.equal(await page.locator('#carm-panel').isVisible(), false, 'C-Arm header closes the drawer');

    // Scene dock: presets scroll, the tools stay on screen, clear of the cycle panel, and are tappable.
    const dockCheck = () => page.evaluate(() => {
      const box = s => document.querySelector(s).getBoundingClientRect();
      const tools = ['#carm-toggle-dock', '#fluoro-toggle-dock', '#reset'].map(box);
      const cycle = box('#cycle-panel'), dock = box('.view-controls');
      return { inside: tools.every(r => r.left >= 0 && r.right <= innerWidth), clear: dock.bottom <= cycle.top, minH: Math.min(...tools.map(r => r.height)) };
    });
    for (const [w, h] of [[390, 844], [320, 568]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      const dock = await dockCheck();
      assert.ok(dock.inside, `${w} px: C-Arm, fluoroscopy and reset stay on screen`);
      assert.ok(dock.clear, `${w} px: dock clear of the cycle panel`);
      assert.ok(dock.minH >= 32, `${w} px: dock tools tappable (${dock.minH})`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const firstViews = await page.evaluate(() => {
      const strip = document.querySelector('.view-presets').getBoundingClientRect();
      return ['anterior', 'posterior', 'rao', 'lao'].filter(id => document.querySelector(`[data-view=${id}]`).getBoundingClientRect().right <= strip.right + 0.5);
    });
    assert.deepEqual(firstViews, ['anterior', 'posterior', 'rao', 'lao'], 'Ant, Post, RAO and LAO fit without scrolling');
    await page.locator('#fluoro-toggle-dock').click();
    assert.equal(await page.locator('main').evaluate(el => el.classList.contains('fluoroscopy-active')), true, 'fluoroscopy toggles from the phone dock');
    await page.locator('#fluoro-toggle-dock').click();

    // Small phone: still usable, no overflow, scene visible.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(200);
    const small = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, main: document.querySelector('main').getBoundingClientRect().height }));
    assert.equal(small.overflow, 0, '320 px: no horizontal overflow');
    assert.ok(small.main > 250, `320 px: scene visible (${small.main})`);

    // Desktop: tabs in the right panel, Sources shows the selected structure's source.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.mobile-tabs').isVisible(), false, 'no phone tab bar on desktop');
    assert.equal(await visibleAside(page), true);
    await page.locator('#structure-select').selectOption('la');
    await page.locator('#panel-tab-sources').click();
    assert.equal(await page.locator('#panel-learn').isVisible(), false);
    assert.match(await page.locator('#panel-sources').innerText(), /Ho et al\., 2012/);
    // Tab order: Learn | Findings | Sources; arrow keys move through it.
    await page.locator('#panel-tab-sources').press('ArrowLeft');
    assert.equal(await page.locator('#panel-findings').isVisible(), true, 'ArrowLeft from Sources opens Findings');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#panel-learn').isVisible(), true, 'arrow keys switch tabs');

    assert.deepEqual(errors, []);
    console.log('PASS: phone sheets (one at a time, focus, sizes, Escape), shared selection, mode tools, TR/EN, C-Arm drawer, dock tools on screen, 320 px, desktop Learn/Sources tabs');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
