const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const baseUrl = process.env.APP_URL || 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/angio/carotid/?lang=tr`, { waitUntil: 'networkidle' });
    await page.locator('[data-render-view="arch"]').waitFor();

    assert.equal((await page.locator('[data-site-badge]').textContent()).trim(), 'KAROTİS ANJİYOGRAFİ');
    assert.match(await page.locator('h1').textContent(), /Karotis ve serebral/);
    assert.equal(await page.locator('[data-view-tab]').count(), 5, 'five tabs rendered');

    const views = ['arch', 'cervical', 'ica', 'circle', 'stenosis'];
    for (const view of views) {
      await page.locator(`[data-view-tab="${view}"]`).click();
      await page.locator(`[data-render-view="${view}"]`).waitFor();
      const structures = page.locator('.carotid-structure');
      const count = await structures.count();
      assert.ok(count >= 3, `${view} renders selectable structures`);
      for (let index = 0; index < count; index += 1) {
        const structure = structures.nth(index);
        const id = await structure.getAttribute('data-structure');
        assert.equal(await structure.getAttribute('role'), 'button', `${id} has button role`);
        assert.equal(await structure.getAttribute('tabindex'), '0', `${id} is keyboard focusable`);
        assert.ok(await structure.getAttribute('aria-label'), `${id} has accessible name`);
        await structure.evaluate(node => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        assert.equal(await page.locator('[data-detail-id]').getAttribute('data-detail-id'), id, `${id} opens detail card`);
      }
    }

    await page.locator('[data-view-tab="arch"]').click();
    const archBefore = await page.locator('[data-structure="bct"] .vessel').getAttribute('d');
    await page.locator('[data-arch-type="III"]').click();
    const archAfter = await page.locator('[data-structure="bct"] .vessel').getAttribute('d');
    assert.notEqual(archBefore, archAfter, 'arch type redraws geometry');
    await page.locator('[data-arch-variant="lusoria"]').click();
    assert.match(await page.locator('[data-variant-note]').textContent(), /lusoria|son dal/i);

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
    await page.locator('[data-ica-angle]').fill('80');
    assert.match(await page.locator('[data-tortuosity-class]').textContent(), /Kink/);

    await page.screenshot({ path: '/tmp/angio-carotid-desktop.png', fullPage: true });

    await page.locator('[data-carotid-lang="en"]').click();
    assert.equal((await page.locator('[data-site-badge]').textContent()).trim(), 'CAROTID ANGIOGRAPHY');
    assert.match(await page.locator('h1').textContent(), /Carotid and cerebral/);
    assert.match(await page.locator('[data-nascet-output]').textContent(), /severe/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, '390px viewport has no horizontal page overflow');
    await page.screenshot({ path: '/tmp/angio-carotid-mobile.png', fullPage: true });

    assert.deepEqual(errors, [], 'page has no runtime errors');
    console.log('PASS carotid browser: badge, 5 views, all SVG structures clickable, keyboard access, redraw controls, NASCET, TR/EN, 390px overflow');
    console.log('Screenshots: /tmp/angio-carotid-desktop.png, /tmp/angio-carotid-mobile.png');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
