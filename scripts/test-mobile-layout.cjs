/**
 * Phone layout (iPhone 13, touch): no control is cut by the screen edge on the EPS laboratory sections,
 * the echo 3D view does not cover the TTE/TEE/ICE row, and a tapped vessel on the carotid and peripheral
 * angiography pages opens a detail card that is on screen; on the 3D lesson pages the cycle panel starts
 * collapsed (model on at least half the screen) and no sheet covers the model on load.
 */
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

// Leaf elements outside the screen with no horizontally scrolling ancestor.
const cutControls = (page) => page.evaluate(() => {
  const W = innerWidth, out = [];
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('.notes-drawer,.site-header')) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 3 || r.height < 3 || e.children.length) continue;
    if (!(r.right > W + 2 || r.left < -2)) continue;
    let scrolls = false;
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) { scrolls = true; break; }
    if (!scrolls && getComputedStyle(e).visibility !== 'hidden') out.push(`${e.tagName.toLowerCase()} "${(e.textContent || '').trim().slice(0, 20)}" right ${Math.round(r.right)}`);
  }
  return out;
});

const cardOnScreen = async (page, path, card, where) => {
  const box = await page.locator(card).boundingBox();
  const vh = await page.evaluate(() => innerHeight);
  assert.ok(box && box.y < vh - 60 && box.y + box.height > 60, `${path}: detail card on screen after a ${where} tap (top ${box && Math.round(box.y)}, viewport ${vh})`);
};

// The schematic anatomy now sits in a collapsible <details> below the detector view; open it before tapping.
async function tapVesselShowsCard(page, path, structure, hit, card, anatomy) {
  await page.goto(`${APP}${path}?lang=tr`, { waitUntil: 'networkidle' });
  await page.locator(`${anatomy} > summary`).tap();
  await page.waitForTimeout(150);
  for (let j = 0; j < 3; j++) {
    const pt = await page.evaluate(([s, h, j]) => {
      const node = document.querySelectorAll(s)[j], line = node.querySelector(h);
      line.scrollIntoView({ block: 'center' });
      const l = line.getPointAtLength(line.getTotalLength() / 2), m = line.getScreenCTM();
      return { x: l.x * m.a + l.y * m.c + m.e, y: l.x * m.b + l.y * m.d + m.f };
    }, [structure, hit, j]);
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForTimeout(250);
    await cardOnScreen(page, path, card, 'schematic');
  }
}

// Carotid detector (fluoroscopy canvas): tap the middle of a projected vessel from the panel's hit regions.
async function tapDetectorShowsCard(page) {
  await page.goto(`${APP}/angio/carotid/?lang=tr`, { waitUntil: 'networkidle' });
  const canvas = page.locator('[data-carotid-fluo]');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const region = await page.evaluate(() => window.carotidAngio.getHitRegions().find((r) => r.id === 'rcca'));
  const p = region.points[Math.floor(region.points.length / 2)];
  await page.touchscreen.tap(box.x + p.x * box.width / 540, box.y + p.y * box.height / 440);
  await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-detail-id]').getAttribute('data-detail-id'), 'rcca', 'detector tap selects the vessel');
  await cardOnScreen(page, '/angio/carotid/', '.detail-card', 'detector');
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // EPS laboratory: every section fits the phone width.
    await page.goto(`${APP}/eps/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const sections = await page.locator('[data-ep-section]').count();
    assert.ok(sections >= 5, 'EPS sections rendered');
    assert.deepEqual(await cutControls(page), [], 'EPS initial section fits');
    for (let i = 0; i < sections; i++) {
      await page.locator('[data-ep-section]').nth(i).click({ force: true });
      await page.waitForTimeout(500);
      assert.deepEqual(await cutControls(page), [], `EPS section ${i} fits the phone width`);
    }

    // Echo: the 3D view stays inside its box; the probe-mode row is tappable.
    await page.goto(`${APP}/echo/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const covered = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^(TTE|TEE|ICE)$/.test(b.textContent.trim()) && b.getBoundingClientRect().width > 0).filter((b) => {
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(t === b || b.contains(t));
    }).map((b) => b.textContent.trim()));
    assert.equal(covered.length, 0, `echo TTE/TEE/ICE buttons are not covered by the 3D view (${covered})`);
    const probeRow = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^(TTE|TEE|ICE)$/.test(b.textContent.trim()) && b.getBoundingClientRect().width > 0).length);
    assert.equal(probeRow, 3, 'echo shows the TTE/TEE/ICE row');

    // 3D lesson pages: the cycle panel starts collapsed so the model keeps most of the phone screen;
    // the chevron opens it; hemodynamics and coronary angiography do not open the Learn sheet on load.
    for (const path of ['/exam/', '/hemo/', '/angio/3d/']) {
      await page.goto(`${APP}${path}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#viewport[data-model-ready=true]', { timeout: 60000 });
      await page.waitForTimeout(800);
      const s = await page.evaluate(() => ({ h: document.querySelector('#viewport canvas').getBoundingClientRect().height, vh: innerHeight, sheet: document.body.dataset.sheet || null, ecg: getComputedStyle(document.querySelector('.ecg-strip')).display }));
      assert.ok(s.h >= 0.5 * s.vh, `${path}: model takes at least half the screen (${Math.round(s.h)} of ${s.vh})`);
      assert.equal(s.sheet, null, `${path}: no sheet open on load`);
      assert.equal(s.ecg, 'none', `${path}: cycle panel collapsed`);
    }
    const chevron = await page.locator('#cycle-collapse').boundingBox();
    await page.touchscreen.tap(chevron.x + chevron.width / 2, chevron.y + chevron.height / 2);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#cycle-collapse').getAttribute('aria-expanded'), 'true', 'chevron expands the cycle panel');
    assert.notEqual(await page.locator('.ecg-strip').evaluate((e) => getComputedStyle(e).display), 'none', 'expanded panel shows the ECG strip');

    await tapDetectorShowsCard(page);
    await tapVesselShowsCard(page, '/angio/carotid/', '.carotid-structure', '.vessel-hit', '.detail-card', '[data-carotid-anatomy]');
    await tapVesselShowsCard(page, '/angio/peripheral/', '[data-structure]', '.peri-hitstroke', '[data-peri-card]', '[data-peri-anatomy]');
    assert.deepEqual(errors, []);
    console.log(`PASS mobile layout: ${sections} EPS sections fit 390 px, echo probe row uncovered, 3D pages open with the model on half the screen and a collapsible cycle panel, carotid and peripheral cards dock on screen after a detector or schematic tap`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
