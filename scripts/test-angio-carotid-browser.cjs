const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const baseUrl = process.env.APP_URL || 'http://localhost:5173';

// Click points along the vessel (midpoint first); a point at a branch origin may belong to the branch's
// hit stroke, so the next sample is tried. Returns the selected id.
async function clickPathMidpoint(page, structure, id) {
  await structure.scrollIntoViewIfNeeded();
  let selected = null;
  for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) {
    const point = await structure.locator('.vessel-hit').first().evaluate((path, at) => {
      const local = path.getPointAtLength(path.getTotalLength() * at);
      const matrix = path.getScreenCTM();
      if (!matrix) throw new Error('SVG path has no screen transform');
      return {
        x: local.x * matrix.a + local.y * matrix.c + matrix.e,
        y: local.x * matrix.b + local.y * matrix.d + matrix.f
      };
    }, f);
    await page.mouse.click(point.x, point.y);
    selected = await page.locator('[data-detail-id]').getAttribute('data-detail-id');
    if (selected === id) break;
  }
  return selected;
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const contextWarnings = [];
    page.on('console', message => { if (/Too many active WebGL contexts|CONTEXT_LOST_WEBGL/i.test(message.text())) contextWarnings.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/angio/carotid/?lang=tr`, { waitUntil: 'networkidle' });
    await page.locator('[data-render-view="arch"]').waitFor();

    const originalDevice = await page.locator('[data-carotid-device] canvas').elementHandle();
    await page.evaluate(() => { for (let i = 0; i < 25; i++) window.carotidAngio.render(); });
    assert.equal(await originalDevice.evaluate(canvas => canvas === document.querySelector('[data-carotid-device] canvas')), true, 'rerenders retain WebGL canvas and inspection state');
    const detector = page.locator('[data-carotid-fluo]');
    await detector.waitFor({ state: 'visible' });
    const detectorImage = () => detector.evaluate(canvas => canvas.toDataURL());
    const detectorPixels = () => detector.evaluate(canvas => {
      // Exclude text readouts: an angle label alone must not satisfy this test.
      const pixels = canvas.getContext('2d').getImageData(30, 70, canvas.width - 60, canvas.height - 140).data;
      let hash = 2166136261;
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
      return hash >>> 0;
    });
    assert.equal(await page.locator('[data-carotid-anatomy]').getAttribute('open'), null, 'anatomy starts secondary and collapsed');
    const detectorBounds = await detector.boundingBox();
    const deviceBounds = await page.locator('[data-carotid-device]').boundingBox();
    assert.ok(detectorBounds.width > 500 && detectorBounds.height <= 471, 'primary detector remains large without excessive upscaling');
    assert.ok(deviceBounds.x > detectorBounds.x + detectorBounds.width, 'gantry is beside the detector');
    const pad = await page.locator('[data-carotid-pad]').boundingBox();
    await page.mouse.click(pad.x + pad.width * .75, pad.y + pad.height * .25);
    assert.deepEqual(await page.evaluate(() => [window.carotidAngio.getState().alpha, window.carotidAngio.getState().beta]), [45, 20], 'angle pad drives both axes');
    assert.deepEqual(await page.evaluate(() => window.carotidAngio.getDeviceState()), {alpha: 45, beta: 20, beam: true}, 'gantry follows detector angles');
    await page.locator('[data-carotid-beam]').uncheck();
    assert.equal(await page.evaluate(() => window.carotidAngio.getDeviceState().beam), false);
    await page.locator('[data-fluo-preset="0"]').click();
    assert.equal(await page.locator('[data-fluo-alpha]').inputValue(), '0', 'AP preset resets angle');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: '/tmp/card-carotid-after.png' });
    await page.locator('[data-carotid-anatomy] > summary').click();
    const initialDetector = await detectorPixels();
    await page.locator('[data-fluo-alpha]').fill('40');
    assert.notEqual(await detectorPixels(), initialDetector, 'C-arm rotation changes vessel pixels');
    await page.locator('[data-fluo-beta]').fill('20');
    const obliqueDetector = await detectorPixels();
    await page.locator('[data-fluo-contrast]').fill('0');
    assert.notEqual(await detectorPixels(), obliqueDetector, 'contrast changes visible vessels');
    await page.locator('[data-fluo-contrast]').fill('100');
    await page.locator('[data-fluo-mode="fluoro"]').click();
    assert.notEqual(await detectorPixels(), obliqueDetector, 'native skopi changes detector display');
    assert.equal(await page.locator('[data-fluo-mode="fluoro"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-fluo-mode="dsa"]').click();

    const { buildCarotidModel, projectCarotidPoint } = await import('../src/angio/carotid/carotid-fluoro.js');
    const rcca = buildCarotidModel({ view: 'arch' }).vessels.find(vessel => vessel.id === 'rcca');
    const end = rcca.points.at(-1), start = rcca.points.at(-2);
    const target = projectCarotidPoint(start.map((value, axis) => value * .25 + end[axis] * .75), 40, 20);
    await detector.scrollIntoViewIfNeeded();
    const box = await detector.boundingBox();
    const unselected = await detectorPixels();
    await page.mouse.click(box.x + (270 + target.u * 118.8) * box.width / 540, box.y + (220 + target.v * 118.8) * box.height / 440);
    assert.equal(await page.locator('[data-detail-id]').getAttribute('data-detail-id'), 'rcca', 'detector vessel click opens matching detail');
    assert.notEqual(await detectorPixels(), unselected, 'selected detector vessel has visible highlight');

    assert.equal((await page.locator('[data-site-badge]').textContent()).trim(), 'KAROTİS ANJİYOGRAFİ');
    assert.match(await page.locator('h1').textContent(), /Karotis ve serebral/);
    assert.equal(await page.locator('[data-view-tab]').count(), 5, 'five tabs rendered');

    const views = ['arch', 'cervical', 'ica', 'circle', 'stenosis'];
    for (const view of views) {
      await page.locator(`[data-view-tab="${view}"]`).click();
      await page.locator(`[data-render-view="${view}"]`).waitFor();
      assert.equal(await page.locator('[data-fluo-alpha]').inputValue(), '40', 'angle survives view switch');
      assert.ok((await detectorImage()).length > 3000, `${view} has rendered skopi image`);
      const structures = page.locator('.carotid-structure');
      const count = await structures.count();
      assert.ok(count >= 3, `${view} renders selectable structures`);
      for (let index = 0; index < count; index += 1) {
        const structure = structures.nth(index);
        const id = await structure.getAttribute('data-structure');
        assert.equal(await structure.getAttribute('role'), 'button', `${id} has button role`);
        assert.equal(await structure.getAttribute('tabindex'), '0', `${id} is keyboard focusable`);
        assert.ok(await structure.getAttribute('aria-label'), `${id} has accessible name`);
        assert.equal(await clickPathMidpoint(page, structure, id), id, `${id} opens detail card`);
      }
    }

    await page.locator('[data-view-tab="arch"]').click();
    const archBefore = await page.locator('[data-structure="bct"] .vessel').getAttribute('d');
    await page.locator('[data-arch-type="III"]').click();
    const archAfter = await page.locator('[data-structure="bct"] .vessel').getAttribute('d');
    assert.notEqual(archBefore, archAfter, 'arch type redraws geometry');
    await page.locator('[data-arch-variant="lusoria"]').click();
    assert.match(await page.locator('[data-variant-note]').textContent(), /lusoria|son dal/i);
    assert.equal(await page.locator('[data-structure="bct"]').count(), 0, 'lusoria omits absent BCT');
    await clickPathMidpoint(page, page.locator('[data-structure="rsub"]'), 'rsub');
    assert.equal(await page.locator('[data-detail-id]').getAttribute('data-detail-id'), 'rsub', 'lusoria is really clickable');
    await page.locator('[data-arch-variant="right-arch"]').click();
    await page.locator('[data-arch-type="I"]').click();
    const rightArchI = await page.locator('[data-structure="rcca"] .vessel').getAttribute('d');
    await page.locator('[data-arch-type="III"]').click();
    const rightArchIII = await page.locator('[data-structure="rcca"] .vessel').getAttribute('d');
    assert.notEqual(rightArchI, rightArchIII, 'right arch type redraws origins');
    assert.equal(await page.locator('[data-structure="bct"]').count(), 0, 'right arch with aberrant LSCA omits absent BCT');

    await page.locator('[data-view-tab="cervical"]').click();
    const cervicalBefore = await page.locator('[data-structure="cervical-ica"] .vessel').getAttribute('d');
    await page.locator('[data-projection="ap"]').click();
    const cervicalAfter = await page.locator('[data-structure="cervical-ica"] .vessel').getAttribute('d');
    assert.notEqual(cervicalBefore, cervicalAfter, 'projection redraws cervical geometry');
    const firstStructure = page.locator('.carotid-structure').first();
    await firstStructure.focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('[data-detail-id]').isVisible(), 'Enter selects a structure');

    await page.locator('[data-view-tab="stenosis"]').click();
    await page.locator('[data-nascet-residual]').fill('1.2');
    await page.locator('[data-nascet-distal]').fill('4');
    assert.match(await page.locator('[data-nascet-output]').textContent(), /70\.0%/);
    await page.locator('[data-nascet-residual]').fill('1.2016');
    assert.match(await page.locator('[data-nascet-output]').textContent(), /69\.9%.*orta/s);
    await page.locator('[data-near-occlusion]').check();
    assert.match(await page.locator('[data-nascet-output]').textContent(), /Tama yakın oklüzyon/);
    await page.locator('[data-near-occlusion]').uncheck();
    await page.locator('[data-ica-angle]').fill('100');
    assert.match(await page.locator('[data-tortuosity-class]').textContent(), /Kink/);
    await page.locator('[data-coil-course]').check();
    assert.match(await page.locator('[data-tortuosity-class]').textContent(), /Koil/);
    await page.locator('[data-coil-course]').uncheck();

    await page.screenshot({ path: '/tmp/angio-carotid-desktop.png', fullPage: true });

    await page.locator('[data-carotid-lang="en"]').click();
    assert.equal(await page.locator('[data-fluo-alpha]').inputValue(), '40', 'TR/EN retains C-arm angle');
    assert.match(await page.locator('[data-fluo-note]').textContent(), /schematic/i);
    assert.equal(await page.evaluate(() => window.carotidAngio.getDeviceState().beam), false, 'beam choice survives rerenders and language switch');
    assert.equal((await page.locator('[data-site-badge]').textContent()).trim(), 'CAROTID ANGIOGRAPHY');
    assert.match(await page.locator('h1').textContent(), /Carotid and cerebral/);
    assert.match(await page.locator('[data-nascet-output]').textContent(), /moderate/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, '390px viewport has no horizontal page overflow');
    const mobileControls = await page.locator('.carotid-control-column').boundingBox();
    const mobileAnatomy = await page.locator('[data-carotid-anatomy]').boundingBox();
    const mobileDetector = await detector.boundingBox();
    assert.ok(mobileControls.y >= mobileDetector.y + mobileDetector.height, 'mobile controls follow detector');
    assert.ok(mobileAnatomy.y >= mobileControls.y + mobileControls.height, 'mobile anatomy follows controls');
    await page.screenshot({ path: '/tmp/angio-carotid-mobile.png', fullPage: true });

    assert.deepEqual(errors, [], 'page has no runtime errors');
    assert.deepEqual(contextWarnings, [], 'rerenders do not exhaust WebGL contexts');
    console.log('PASS carotid browser: badge, 5 views, all SVG structures clickable, keyboard access, redraw controls, NASCET, TR/EN, 390px overflow');
    console.log('Screenshots: /tmp/angio-carotid-desktop.png, /tmp/angio-carotid-mobile.png');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
