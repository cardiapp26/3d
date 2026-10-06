const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5198'}/eps/#/svt`);
    await page.locator('[data-svt-example-list]').waitFor();
    const examples = await page.locator('[data-svt-example] option').evaluateAll((nodes) => nodes.map((n) => n.value));
    // Desktop: grouped side list, every example once, the select hidden; the chosen item is pressed.
    assert.deepEqual(await page.locator('[data-svt-example-item]').evaluateAll((nodes) => nodes.map((n) => n.dataset.svtExampleItem)), examples);
    assert.equal(await page.locator('[data-svt-example]').isVisible(), false);
    assert.equal(await page.locator('[data-svt-example-item][aria-pressed=true]').count(), 1);
    assert.equal(examples.length, 32);
    for (const id of examples) {
      await page.locator(`[data-svt-example-item="${id}"]`).click();
      assert.equal(await page.locator('[data-svt-recordings]').getAttribute('data-recording'), id);
      assert.ok(await page.locator('[data-svt-strip]').evaluate((c) => c.width > 0 && c.height > 0));
      assert.ok(await page.locator('[data-svt-ladder]').evaluate((c) => c.width > 0 && c.height > 0));
      assert.equal(await page.locator('[data-svt-mechanism][data-status=possible]').count(), 7);
      assert.ok((await page.locator('[data-svt-interpretation]').textContent()).length > 20);
    }
    await page.locator('[data-svt-example-item="at-microreentry-block"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /A–A post 300 ms.*V–V post 600 ms.*Fragment span 270 ms/);
    assert.match(await page.locator('[data-svt-localization-source]').getAttribute('href'), /aer.2019.17.2/);
    await page.locator('[data-svt-example-item="at-atrial-entrainment"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /TCL 300 ms.*PCL 240 ms.*PPI 320 ms.*PPI−TCL 20 ms/);
    const atGuide = page.locator('[data-svt] [data-at-markowitz]');
    await atGuide.locator('summary').click();
    assert.match(await atGuide.textContent(), /NCC.*pseudo-blok/s);
    for (const id of ['avrt-left-anterolateral', 'avrt-left-posterolateral']) {
      await page.locator(`[data-svt-example-item="${id}"]`).click();
      assert.match(await page.locator('[data-svt-measures]').textContent(), /TCL 400 ms.*VA local 85 ms/);
      assert.match(await page.locator('[data-svt-interpretation]').textContent(), /Boston/);
    }
    await page.locator('[data-svt-example-item="ap-map-retrograde"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /VA local pre 65 ms.*S–A pre 145 ms.*S–V local 80 ms/);
    assert.match(await page.locator('[data-svt-localization-source]').getAttribute('href'), /2025.02.023/);
    await page.locator('[data-svt-example-item="avnrt-ector-induction"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /AH FP 90 ms.*AH SP 240 ms.*TCL 320 ms/);
    assert.equal(await page.locator('[data-svt-induction-stages] li').count(), 3);
    assert.match(await page.locator('[data-svt-signal-legend]').textContent(), /S: pacing.*RAA/);
    assert.match(await page.locator('[data-svt-localization-source]').getAttribute('href'), /ytaa129/);
    await page.locator('[data-svt-example-item="eps-baseline"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /PA 35 ms.*AH 80 ms.*HV 45 ms.*PR 160 ms/);
    await page.locator('[data-svt-example-item="eps-snrt"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /SNRT 1200 ms.*cSNRT 400 ms/);
    await page.locator('[data-svt-example-item="eps-ppi"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /PPI 510 ms.*PPI−TCL 150 ms/);
    await page.locator('[data-svt-example-item="eps-cppi"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /cPPI−TCL 70 ms/);
    await page.locator('[data-svt-example-item="avrt-right-lateral"]').click();
    const channelLabel = await page.locator('[data-svt-strip]').getAttribute('aria-label');
    assert.match(channelLabel, /halo-56/);
    assert.match(channelLabel, /abl-d/);
    assert.match(await page.locator('[data-svt-measures]').textContent(), /VA local 85 ms/);
    assert.equal(await page.locator('[data-svt-localization-source]').isVisible(), true);
    await page.locator('[data-svt-example-item="avnrt-typ-svt"]').click();
    assert.match(await page.locator('[data-svt-measures]').textContent(), /TCL 360 ms.*VA 30 ms/);
    await page.locator('[data-svt-option="va:lt70"]').click();
    await page.locator('[data-svt-example-item="at-svt"]').click();
    assert.equal(await page.locator('[data-svt-option="va:lt70"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-svt-display=ladder]').click();
    assert.equal(await page.locator('[data-svt-ladder]').isHidden(), true);
    await page.locator('[data-svt-display=ladder]').click();
    await page.evaluate(() => window.epsLab.setLang('en'));
    assert.match(await page.locator('[data-svt-recordings] h4').textContent(), /Worked recordings/);
    assert.match(await atGuide.textContent(), /bidirectional conduction block.*pseudoblock/s);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('[data-svt-example-list]').isVisible(), false, 'phone: no side list');
    assert.equal(await page.locator('[data-svt-example]').isVisible(), true, 'phone: compact picker');
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    assert.ok(await page.locator('[data-svt-strip]').evaluate((c) => c.getBoundingClientRect().width >= 720 && c.width > 0));
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: '/tmp/svt-recordings.png' });
    await page.locator('[data-ep-section=basics]').click();
    await page.locator('[data-basics-block=mobitz1-infra]').click();
    assert.match(await page.locator('[data-basics-card=block]').textContent(), /HV lengthens.*permanent pacing/);
    await page.locator('[data-ep-section=treatment]').click();
    await page.locator('[data-ep-case]').selectOption('at-parahisian');
    assert.equal(await page.locator('[data-at-markowitz]:visible').count(), 1);
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    await page.locator('[data-ap-ablation] > summary').click();
    for (const id of ['ap-map-antegrade', 'ap-map-potential', 'ap-map-retrograde']) {
      await page.locator(`[data-ap-recording="${id}"]`).click();
      assert.ok((await page.locator('[data-ap-ablation]').textContent()).includes('Prystowsky'));
      assert.ok((await page.locator('canvas.egm-canvas').first().getAttribute('aria-label')).includes('AP'));
    }
    await page.locator('[data-ep-case]').selectOption('af-pvi');

    await page.locator('[data-ep-pvi-energy] summary').click();
    assert.match(await page.locator('[data-ep-pvi-energy]').textContent(), /irreversible electroporation.*does not mean zero risk/);
    await page.evaluate(() => window.epsLab.setLang('tr'));
    assert.match(await page.locator('[data-ep-pvi-energy]').textContent(), /geri dönüşümsüz elektroporasyon/);
    await page.locator('[data-ep-section=svt]').click();
    assert.deepEqual(errors, []);
    console.log('PASS EPS recordings browser: 32 examples, Ector induction and signal definitions, PA/AH/HV, SNRT/cSNRT, PPI/cPPI, localization channels, rendering, findings preservation, toggles, translation, mobile resize, infra-His warning, PFA text');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
