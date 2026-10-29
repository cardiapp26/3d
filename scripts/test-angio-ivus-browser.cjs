const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
);
const assert = require('node:assert/strict');
const { startApp } = require('./lib/app-server.cjs');

async function assertNoHorizontalOverflow(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(160);
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert.ok(
    metrics.docScrollWidth <= metrics.innerWidth + 1,
    `Document overflow at ${width}px: ${metrics.docScrollWidth} > ${metrics.innerWidth}`
  );
  assert.ok(
    metrics.bodyScrollWidth <= metrics.innerWidth + 1,
    `Body overflow at ${width}px: ${metrics.bodyScrollWidth} > ${metrics.innerWidth}`
  );
}

async function main() {
  const app = await startApp();
  const BASE_URL = app.url;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Verify C-arm Studio CTA link to ./ivus/
    await page.goto(`${BASE_URL}/angio/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-angio-ivus-link]');
    const ctaHref = await page.getAttribute('[data-angio-ivus-link]', 'href');
    assert.equal(ctaHref, './ivus/');

    // 2. Open Coronary IVUS Lab
    await page.goto(`${BASE_URL}/angio/ivus/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.ivus-lab');

    const subpageCurrent = await page
      .locator('.site-subpage[aria-current="page"]')
      .textContent();
    assert.match(subpageCurrent || '', /Koroner IVUS|Coronary IVUS/);

    // 2a. 3D vessel & stent model leads the page: WebGL scene, live IVUS frame, normal-MLA table.
    assert.equal(await page.getAttribute('[data-ivus-mode="model"]', 'aria-pressed'), 'true', '3D model is the default workspace');
    await page.waitForSelector('[data-im-stage] canvas');
    const frameBox = await page.locator('[data-im-cross]').boundingBox();
    assert.ok(frameBox && frameBox.width > 220, 'model IVUS frame renders');
    assert.equal(await page.locator('[data-im-seg]').count(), 12, 'normal lumen table lists 12 segments');
    await page.click('[data-im-seg="lm"]');
    await page.waitForTimeout(80);
    assert.match(await page.locator('[data-im-mla]').textContent(), /LITRO/, 'LM frame uses the LM cut-off');
    await page.click('[data-im-pop="asian"]');
    assert.match(await page.locator('[data-im-mla]').textContent(), /Park 2014/, 'Asian LM cut-off');
    const probeBefore = await page.evaluate(() => window.coronaryIvus.getState().modelProbeMm);
    await page.focus('[data-im-cross]');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => window.coronaryIvus.getState().modelProbeMm), probeBefore + 0.5, 'arrow key moves the transducer');

    // Undersized stent: post-dilation + POT fixes expansion and apposition.
    await page.click('[data-im-scenario="undersize"]');
    await page.waitForSelector('[data-im-metrics]');
    assert.match(await page.locator('[data-im-metrics]').textContent(), /Küçük/, 'undersized stent is flagged');
    await page.selectOption('[data-im-stent="diamMm"]', '3');
    await page.check('[data-im-balloon="post"]');
    await page.selectOption('[data-im-balloon-d="pot"]', '3.5');
    await page.check('[data-im-balloon="pot"]');
    await page.waitForTimeout(80);
    const fixed = await page.locator('[data-im-metrics]').textContent();
    assert.match(fixed, /Optimal/, 'ULTIMATE optimal after resizing and POT');
    assert.doesNotMatch(fixed, /belirgin/, 'no relevant malapposition after POT');

    // LM-LAD crossover: malapposed LM struts until POT.
    await page.click('[data-im-scenario="apposition"]');
    await page.waitForSelector('[data-im-metrics]');
    assert.match(await page.locator('[data-im-metrics]').textContent(), /belirgin/, 'LM malapposition before POT');
    await page.selectOption('[data-im-balloon-d="pot"]', '4.5');
    await page.check('[data-im-balloon="pot"]');
    await page.waitForTimeout(80);
    assert.doesNotMatch(await page.locator('[data-im-metrics]').textContent(), /belirgin/, 'POT resolves LM malapposition');
    await assertNoHorizontalOverflow(page, 390, 844);
    await page.setViewportSize({ width: 1440, height: 920 });
    await page.click('[data-ivus-mode="console"]');
    await page.waitForSelector('[data-ivus-cross-canvas]');

    // Verify B-mode cross-section and L-mode longitudinal canvases render
    const crossBox = await page.locator('[data-ivus-cross-canvas]').boundingBox();
    const longBox = await page.locator('[data-ivus-long-canvas]').boundingBox();
    assert.ok(crossBox && crossBox.width > 220 && crossBox.height > 220, 'B-mode cross-section canvas must render');
    assert.ok(longBox && longBox.width > 240 && longBox.height > 100, 'L-mode longitudinal canvas must render');

    // 3. Test Distal Ref -> MLA jump and Virtual PCI Optimization on 320 deg Calcified LAD case
    await page.selectOption('[data-ivus-case]', 'lad-concentric-ca-360');
    await page.waitForTimeout(80);
    const caScoreText = await page.locator('[data-ivus-ca-score]').textContent();
    assert.match(caScoreText || '', /2\/4/, 'Zhang IVUS calcium score: >270° over >5 mm + vessel <3.5 mm = 2');

    await page.check('[data-ivus-pci="plaqueModified"]');
    await page.check('[data-ivus-pci="stentDeployed"]');
    await page.check('[data-ivus-pci="potPerformed"]');
    await page.waitForTimeout(80);
    const ultimateBadge = await page.locator('[data-ivus-ultimate-badge]').textContent();
    assert.match(ultimateBadge || '', /OPTİMAL PCI|OPTIMAL PCI/);

    // 4. Switch to Plaque Morphology & Calcium Score workspace mode
    await page.click('[data-ivus-mode="morphology"]');
    await page.waitForTimeout(100);
    const morphCards = await page.locator('[data-ivus-morph-card]').count();
    assert.equal(morphCards, 6, 'All 6 plaque morphology cards must render');

    // 5. Switch to Artifacts & Imaging Pitfalls workspace mode and test quiz + fix button
    await page.click('[data-ivus-mode="artifacts"]');
    await page.waitForTimeout(100);
    const quizCanvasBox = await page.locator('[data-ivus-quiz-canvas]').boundingBox();
    assert.ok(quizCanvasBox && quizCanvasBox.width > 200, 'Quiz artifact canvas must render');
    await page.click('[data-ivus-quiz-ans="nurd"]');
    await page.waitForTimeout(60);
    await page.click('[data-ivus-art-fix="nurd"]');
    await page.waitForTimeout(60);

    // 6. Switch to Sizing & PCI Calculators workspace mode
    await page.click('[data-ivus-mode="calculator"]');
    await page.waitForTimeout(100);
    const calcCards = await page.locator('[data-ivus-calc-card]').count();
    assert.equal(calcCards, 6, 'All 6 IVUS calculator cards (incl. normal MLA) must render');

    // 7. Language toggle TR -> EN -> TR
    await page.click('[data-ivus-lang="en"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Coronary IVUS Lab/);
    await page.click('[data-ivus-lang="tr"]');
    await page.waitForTimeout(80);
    assert.match(await page.title(), /Koroner IVUS Laboratuvarı/);

    // 8. Responsive layout checks (390px, 768px, 1440px) in Console mode
    await page.click('[data-ivus-mode="console"]');
    await assertNoHorizontalOverflow(page, 1440, 920);
    await assertNoHorizontalOverflow(page, 768, 1024);
    await assertNoHorizontalOverflow(page, 390, 844);

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);

    console.log('Coronary IVUS Lab browser verification passed.');
  } finally {
    await browser.close();
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
