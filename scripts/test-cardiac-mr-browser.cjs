const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
const SHOTS = process.env.CMR_SHOTS || '';

const STEP_RESULTS = { 'axial-2ch': '2ch', '2ch-4ch': '4ch', 'sax-stack': 'sax', 'basal-3ch': '3ch' };
const STEP_SOURCES = { 'axial-2ch': ['axial'], '2ch-4ch': ['2ch'], 'sax-stack': ['2ch', '4ch'], 'basal-3ch': ['basal'] };
const REQUIRED = {
  sax: ['lv', 'rv', 'ivs', 'wall-ant', 'wall-inf', 'wall-lat', 'pm-al', 'pm-pm', 'rvip-ant', 'rvip-inf'],
  '2ch': ['lv', 'la', 'mv', 'wall-ant', 'wall-inf', 'apex'],
  '3ch': ['lv', 'la', 'ao', 'lvot', 'mv', 'av', 'wall-as', 'wall-il'],
  '4ch': ['lv', 'rv', 'la', 'ra', 'mv', 'tv', 'ivs', 'wall-lat', 'apex']
};
const SEQUENCES = ['cine', 'lge', 't1', 't2', 'pc', 'perfusion', 'mra'];

async function noOverflow(page, what) {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  assert.ok(ok, `no horizontal overflow (${what})`);
}

async function shot(page, selector, name) {
  if (!SHOTS) return;
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.locator(selector).first().screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function walk(page, tag, { checkOverflow = false } = {}) {
  const sources = new Set();
  for (const [step, result] of Object.entries(STEP_RESULTS)) {
    await page.locator(`[data-cmr-step="${step}"]`).click();
    assert.equal(await page.locator(`[data-cmr-step="${step}"]`).getAttribute('aria-pressed'), 'true');
    const views = await page.locator('[data-cmr-source] svg').evaluateAll(n => n.map(s => s.dataset.cmrView));
    assert.deepEqual(views, STEP_SOURCES[step], `${step}: source schematic`);
    assert.ok(await page.locator('[data-cmr-source] [data-cmr-plan]').count() > 0, `${step}: planning lines drawn`);
    assert.equal(await page.locator('[data-cmr-result] svg').getAttribute('data-cmr-view'), result, `${step}: resulting view`);
    for (const id of REQUIRED[result]) assert.equal(await page.locator(`[data-cmr-result] [data-cmr-label="${id}"]`).count(), 1, `${step}: result labels ${id}`);
    sources.add(await page.locator('[data-cmr-source]').innerHTML());
    if (checkOverflow) await noOverflow(page, `step ${step}`);
    await shot(page, '[aria-labelledby="cmr-planning-title"]', `${tag}-plan-${step}`);
  }
  assert.equal(sources.size, 4, 'every step redraws the source schematic');
  assert.equal(await page.locator('[data-cmr-source] [data-cmr-plan="3ch"]').count(), 1, '3CH planned on the basal SAX');

  const seqViews = new Set();
  const purposes = new Set();
  for (const id of SEQUENCES) {
    await page.locator(`[data-cmr-sequence="${id}"]`).click();
    assert.equal(await page.locator(`[data-cmr-sequence="${id}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-cmr-seq-schematic] svg').getAttribute('data-cmr-seq-view'), id, `${id}: own schematic`);
    seqViews.add(await page.locator('[data-cmr-seq-schematic] svg').innerHTML());
    purposes.add(await page.locator('[data-cmr-purpose]').innerText());
    assert.ok(await page.locator('[data-cmr-how] li').count() >= 3, `${id}: how-to bullets`);
    assert.ok((await page.locator('[data-cmr-pitfall]').innerText()).trim().length > 20, `${id}: pitfall`);
    if (checkOverflow) await noOverflow(page, `sequence ${id}`);
    await shot(page, '[aria-labelledby="cmr-seq-title"]', `${tag}-seq-${id}`);
  }
  assert.equal(seqViews.size, 7, 'seven distinct sequence schematics');
  assert.equal(purposes.size, 7, 'seven distinct purposes');
}

async function realViewer(page, tag) {
  await page.waitForFunction(() => window.cardiacMR.getRealViewer()?.getState().loaded === 'patient061', null, { timeout: 30000 });
  const v = () => page.evaluate(() => window.cardiacMR.getRealViewer().getState());
  const colour = () => page.evaluate(() => {
    const d = document.querySelector('[data-cmrv-canvas]').getContext('2d').getImageData(0, 0, 512, 512).data;
    let grey = 0, tinted = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i] > 20) grey++; if (Math.abs(d[i] - d[i + 2]) > 40) tinted++; }
    return { grey, tinted };
  });
  assert.equal(await page.locator('[data-cmrv-case]').count(), 5, 'five ACDC cases');
  assert.equal(await page.locator('[data-cmrv-slice] canvas').count(), 9, 'one thumbnail per slice');
  // Cine plays unless the user prefers reduced motion.
  const f0 = (await v()).frame;
  await page.waitForTimeout(400);
  assert.notEqual((await v()).frame, f0, 'cine advances');
  await page.locator('[data-cmrv-play]').click();
  await page.locator('[data-cmrv-jump="ed"]').click();
  assert.equal(await page.locator('[data-cmrv-phase]').innerText(), 'ED');
  const ed = await colour();
  assert.ok(ed.grey > 50000 && ed.tinted > 2000, `ED frame shows the image and the expert contours (${ed.tinted})`);
  await page.locator('[data-cmrv-overlay="off"]').click();
  assert.ok((await colour()).tinted < ed.tinted / 10, 'contours off');
  await page.locator('[data-cmrv-overlay="phase"]').click();
  assert.match(await page.locator('[data-cmrv-lvef]').innerText(), /^6\d$/, 'normal LVEF');
  assert.equal(await page.locator('[data-cmrv-criteria] li.is-met').count(), 0, 'normal case meets no disease definition');
  assert.equal(await page.locator('[data-cmrv-ring] svg path').count(), 6, 'six-sector thickening ring');
  // Keyboard: next slice.
  const s0 = (await v()).slice;
  await page.locator('[data-cmrv-canvas]').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal((await v()).slice, s0 + 1, 'arrow key moves to the next slice');
  // HCM case.
  await page.locator('[data-cmrv-case="patient034"]').click();
  await page.waitForFunction(() => window.cardiacMR.getRealViewer().getState().loaded === 'patient034', null, { timeout: 30000 });
  assert.equal(await page.locator('[data-cmrv-criteria] li.is-met').getAttribute('data-group'), 'HCM', 'HCM definition met');
  if (SHOTS) await page.locator('.cmrv').screenshot({ path: path.join(SHOTS, `${tag}-real-hcm.png`) });
  await page.locator('[data-cmrv-case="patient061"]').click();
  await page.waitForFunction(() => window.cardiacMR.getRealViewer().getState().loaded === 'patient061');
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${APP}/cardiac-mr/?lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cmr-step]').first().waitFor();
    assert.match(await page.locator('[data-site-badge]').textContent(), /KARDİYAK MR/);
    assert.equal(await page.locator('[data-site-link="cardiac-mr"]').getAttribute('aria-current'), 'page');
    assert.equal(await page.locator('.site-brand').getAttribute('href'), '../', 'brand returns to the homepage');
    assert.equal(await page.locator('a[href*="PMC7038611"]').count(), 1, 'SCMR 2020 source link');
    assert.match(await page.locator('[data-cmr-disclaimer]').innerText(), /hasta MR görüntüsü değildir/);

    await realViewer(page, 'desktop-tr');
    const canvasBefore = await page.locator('[data-cmrv-canvas]').elementHandle();
    await walk(page, 'desktop-tr');
    assert.ok(await canvasBefore.evaluate(n => n.isConnected), 'real viewer survives page re-renders');

    // Sections and the labels toggle.
    for (const [id, ids] of Object.entries(REQUIRED)) {
      await page.locator(`[data-cmr-section="${id}"]`).click();
      assert.equal(await page.locator(`[data-cmr-section="${id}"]`).getAttribute('aria-pressed'), 'true');
      for (const sid of ids) assert.equal(await page.locator(`[data-cmr-section-view] [data-cmr-label="${sid}"]`).count(), 1, `${id} labels ${sid}`);
      await shot(page, '[aria-labelledby="cmr-sections-title"]', `desktop-tr-section-${id}`);
    }
    const toggle = page.locator('[aria-labelledby="cmr-sections-title"] [data-cmr-labels]');
    await toggle.click();
    assert.equal(await page.locator('[data-cmr-section-view] [data-cmr-label], [data-cmr-result] [data-cmr-label], [data-cmr-source] [data-cmr-label]').count(), 0, 'labels hidden');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('[data-cmr-section-view] [data-cmr-label]').count() > 0, 'labels restored from the keyboard');

    // LGE patterns.
    await page.locator('[data-cmr-sequence="lge"]').click();
    const scars = new Set();
    for (const id of ['subendo', 'transmural', 'midwall', 'epicardial']) {
      await page.locator(`[data-cmr-lge="${id}"]`).click();
      assert.equal(await page.locator(`[data-cmr-scar="${id}"]`).count(), 1, `LGE ${id} pattern drawn`);
      scars.add(await page.locator('[data-cmr-lge-note]').innerText());
    }
    assert.equal(scars.size, 2, 'ischaemic and non-ischaemic notes');

    // Language switch keeps state.
    await page.locator('[data-cmr-step="sax-stack"]').click();
    const trPurpose = await page.locator('[data-cmr-purpose]').innerText();
    await page.locator('[data-cmr-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(await page.locator('[data-site-badge]').textContent(), /CARDIAC MR/);
    assert.notEqual(await page.locator('[data-cmr-purpose]').innerText(), trPurpose, 'sequence content translates');
    const state = await page.evaluate(() => window.cardiacMR.getState());
    assert.equal(state.step, 'sax-stack'); assert.equal(state.sequence, 'lge'); assert.equal(state.lang, 'en');
    assert.match(await page.locator('[data-cmr-section-view]').innerHTML(), /Lateral/);
    assert.match(await page.locator('#cmrv-title').innerText(), /Real cine MR/, 'real viewer translates');
    await walk(page, 'desktop-en');

    // iPhone 13.
    const phone = await browser.newPage({ ...devices['iPhone 13'] });
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(`${APP}/cardiac-mr/?lang=tr`, { waitUntil: 'domcontentloaded' });
    await phone.locator('[data-cmr-step]').first().waitFor();
    await noOverflow(phone, 'initial mobile');
    await phone.waitForFunction(() => window.cardiacMR.getRealViewer()?.getState().loaded === 'patient061', null, { timeout: 30000 });
    await noOverflow(phone, 'real cine viewer on the phone');
    const frameBox = await phone.locator('.cmrv-frame').boundingBox();
    assert.ok(frameBox.width > 300 && frameBox.x + frameBox.width <= 390 + 1, 'cine fits the phone');
    await walk(phone, 'mobile-tr', { checkOverflow: true });
    const widest = await phone.evaluate(() => Math.max(...[...document.querySelectorAll('.cmr-svg')].map(s => s.getBoundingClientRect().right)));
    assert.ok(widest <= 390 + 1, 'schematics fit the phone width');
    await phone.locator('[data-cmr-reset]').click();
    const reset = await phone.evaluate(() => window.cardiacMR.getState());
    assert.deepEqual({ step: reset.step, section: reset.section, sequence: reset.sequence, labels: reset.labels }, { step: 'axial-2ch', section: 'sax', sequence: 'cine', labels: true }, 'reset');

    assert.deepEqual(errors, [], 'no browser errors');
    console.log('PASS cardiac MR browser: real ACDC cine (play, ED contours, slices, HCM), 4 planning steps, 4 labelled sections, 7 sequence schematics, LGE patterns, TR/EN state, iPhone 13 layout');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
