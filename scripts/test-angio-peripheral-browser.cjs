const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const REAL_CLICK = {
  aortoiliac: { map: 'aortic-bifurcation' },
  femoral: { map: 'femoral-bifurcation', xs: 'xs-popliteal' },
  runoff: { map: 'plantar-arch' },
  visceral: { ap: 'accessory-renal', lateral: 'accessory-renal', oblique: 'accessory-renal' },
  arm: { typical: 'distal-radial', variant: 'high-bifurcation' }
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    const url = `${process.env.APP_URL || 'http://localhost:5173'}/angio/peripheral/?lang=tr`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('[data-site-badge]').waitFor({ state: 'attached', timeout: 30000 });
    await page.locator('[data-structure]').first().waitFor({ state: 'attached' });

    assert.equal(errors.length, 0, `pageerror on load: ${errors.join(' | ')}`);
    assert.match(await page.locator('[data-site-badge]').textContent(), /PERİFERİK ANJİYOGRAFİ/);
    assert.equal(
      (await page.locator('[data-peri-disclaimer]').textContent()).trim(),
      'Şematik eğitim çizimidir, hasta görüntülemesi değildir. Eğitim amaçlıdır.'
    );
    const tabs = await page.locator('[data-peri-tab]').evaluateAll(nodes => nodes.map(node => node.dataset.periTab));
    assert.deepEqual(tabs, ['aortoiliac', 'femoral', 'runoff', 'visceral', 'arm']);

    const seen = new Set();
    for (const tab of tabs) {
      await page.locator(`[data-peri-tab="${tab}"]`).click();
      const modes = await page.locator('[data-peri-mode]').evaluateAll(nodes => nodes.map(node => node.dataset.periMode));
      const modeList = modes.length ? modes : ['map'];
      for (const mode of modeList) {
        if (modes.length) await page.locator(`[data-peri-mode="${mode}"]`).click();
        const ids = await page.locator('[data-structure]').evaluateAll(nodes => nodes.map(node => node.dataset.structure));
        assert.ok(ids.length > 0, `${tab}/${mode} rendered no structures`);
        for (const id of ids) {
          const hit = page.locator(`[data-structure="${id}"]`);
          const name = await hit.getAttribute('data-name');
          assert.equal(await hit.getAttribute('role'), 'button');
          assert.equal(await hit.getAttribute('tabindex'), '0');
          await hit.dispatchEvent('click');
          assert.equal((await page.locator('[data-card-name]').innerText()).trim(), name, `${id} card`);
          assert.equal(await page.locator(`[data-structure="${id}"]`).getAttribute('aria-pressed'), 'true');
          seen.add(id);
        }
        const realId = REAL_CLICK[tab][mode];
        await page.locator(`[data-structure="${realId}"] .peri-hitdot`).click({ timeout: 8000 });
        const realName = await page.locator(`[data-structure="${realId}"]`).getAttribute('data-name');
        assert.equal((await page.locator('[data-card-name]').innerText()).trim(), realName, `real click ${realId}`);
      }
    }
    assert.equal(seen.size, 71, `clicked ${seen.size} structures`);

    const keyTarget = page.locator('[data-structure="abdominal-aorta"]');
    await page.locator('[data-peri-tab="aortoiliac"]').click();
    await keyTarget.focus();
    await page.keyboard.press('Enter');
    assert.equal(
      (await page.locator('[data-card-name]').innerText()).trim(),
      await page.locator('[data-structure="abdominal-aorta"]').getAttribute('data-name')
    );
    await page.locator('[data-structure="aortic-bifurcation"]').focus();
    await page.keyboard.press('Space');
    assert.equal(
      (await page.locator('[data-card-name]').innerText()).trim(),
      await page.locator('[data-structure="aortic-bifurcation"]').getAttribute('data-name')
    );

    const hover = page.locator('[data-structure="common-iliac"] .peri-hitdot');
    const hoverName = await page.locator('[data-structure="common-iliac"]').getAttribute('data-name');
    await hover.hover();
    await page.locator('[data-peri-tip]:not([hidden])').waitFor({ state: 'visible' });
    assert.equal((await page.locator('[data-peri-tip]').innerText()).trim(), hoverName);
    await page.screenshot({ path: '/tmp/peripheral-desktop.png' });

    await page.locator('[data-peri-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(await page.locator('[data-site-badge]').textContent(), /PERIPHERAL ANGIOGRAPHY/);
    assert.match(await page.locator('[data-peri-tab="femoral"]').textContent(), /Femoral/);
    assert.match(await page.locator('[data-peri-disclaimer]').textContent(), /schematic teaching drawing/i);
    assert.match(await page.locator('[data-card-pearl-h]').textContent(), /Angiographic relevance/);
    assert.notEqual(
      (await page.locator('[data-card-name]').innerText()).trim(),
      'Bir yapı seçin'
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      let worst = null;
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 && rect.height < 2) continue;
        if (rect.right > window.innerWidth + 1 || rect.left < -1) {
          if (!worst || rect.right > worst.right) {
            worst = {
              tag: el.tagName,
              cls: String(el.className || '').slice(0, 80),
              right: Math.round(rect.right),
              left: Math.round(rect.left)
            };
          }
        }
      }
      return {
        scroll: doc.scrollWidth,
        inner: window.innerWidth,
        ok: doc.scrollWidth <= window.innerWidth + 1,
        worst
      };
    });
    assert.equal(overflow.ok, true, `horizontal overflow ${overflow.scroll} > ${overflow.inner} ${JSON.stringify(overflow.worst)}`);
    await page.screenshot({ path: '/tmp/peripheral-mobile.png' });
    assert.deepEqual(errors, [], `pageerror: ${errors.join(' | ')}`);
    console.log('PASS peripheral browser 71 structures');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
