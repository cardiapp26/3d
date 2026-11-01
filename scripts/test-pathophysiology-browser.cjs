const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const { startApp } = require('./lib/app-server.cjs');

(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    console.log(`Navigating to ${app.url}/pathophysiology/?lang=tr ...`);
    await page.goto(`${app.url}/pathophysiology/?lang=tr`, { waitUntil: 'networkidle' });

    assert.equal(errors.length, 0, `Page errors: ${errors.join('; ')}`);

    // Verify Header modules order: Pathophysiology must be right after Anatomy
    const moduleLinks = await page.$$eval('.site-modules .site-module', (links) => links.map(l => l.getAttribute('data-site-link') || l.id));
    const anatIdx = moduleLinks.findIndex(id => id.includes('anatomy'));
    const pathoIdx = moduleLinks.findIndex(id => id.includes('pathophysiology'));
    assert.ok(anatIdx !== -1, 'Anatomy link must exist');
    assert.ok(pathoIdx !== -1, 'Pathophysiology link must exist');
    assert.equal(pathoIdx, anatIdx + 1, `Pathophysiology (${pathoIdx}) must be immediately next to Anatomy (${anatIdx})`);

    // Verify Active module tab
    const activeModule = await page.$eval('.site-module[aria-current="page"]', el => el.textContent.trim());
    assert.ok(activeModule.toLowerCase().includes('patofizyoloji') || activeModule.toLowerCase().includes('pathophysiology'), 'Active module should be Patofizyoloji');

    // Verify 6 station buttons in sidebar
    const stations = await page.$$eval('.pathophys-nav-item', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    assert.equal(stations.length, 6, `Should have 6 stations in nav, found: ${stations.length}`);

    // Station 1: PV loop
    assert.ok(await page.$('.pathophys-pv-svg'), 'PV loop SVG should render');
    const efReadout = await page.$eval('[data-pv-out="ef"]', el => el.textContent.trim());
    assert.ok(efReadout.includes('%'), `EF readout should be percentage, got: ${efReadout}`);

    // Click Station 2: Starling & Laplace
    await page.click('[data-station="starling-laplace"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.starling-svg'), 'Starling SVG should render');
    assert.ok(await page.$('.laplace-svg'), 'Laplace SVG should render');

    // Click Station 3: Atherogenesis
    await page.click('[data-station="atherogenesis"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.athero-stepper'), 'Atherogenesis stepper should render');

    // Click Station 4: Electrophysiology
    await page.click('[data-station="electrophys"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.ep-svg, .pathophys-ep-svg'), 'Electrophysiology SVG should render');

    // Click Station 5: Forrester
    await page.click('[data-station="forrester"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.forrester-svg'), 'Forrester SVG should render');
    const quadBadge = await page.$eval('.quadrant-badge', el => el.textContent.trim());
    assert.ok(quadBadge.includes('Kuadran') || quadBadge.includes('Quadrant'), 'Quadrant badge should be present');
    await page.screenshot({ path: '/Users/yh/.gemini/antigravity/brain/65400f76-60ad-41ef-8e98-3578bd82623f/forrester_screenshot.png' });

    // Click Station 6: Valvular
    await page.click('[data-station="valvular"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.valvular-svg'), 'Valvular SVG should render');
    await page.screenshot({ path: '/Users/yh/.gemini/antigravity/brain/65400f76-60ad-41ef-8e98-3578bd82623f/valvular_screenshot.png' });

    // Test Language switch to EN
    await page.click('[data-pathophys-lang="en"]');
    await page.waitForTimeout(250);
    const enStationTitle = await page.$eval('[data-pathophys-station-title]', el => el.textContent.trim());
    assert.ok(enStationTitle.includes('Valvular') || enStationTitle.includes('Pressure'), `EN title expected, got: ${enStationTitle}`);

    // Test Language switch back to TR
    await page.click('[data-pathophys-lang="tr"]');
    await page.waitForTimeout(250);
    const trStationTitle = await page.$eval('[data-pathophys-station-title]', el => el.textContent.trim());
    assert.ok(trStationTitle.includes('Kapak') || trStationTitle.includes('Gradyan'), `TR title expected, got: ${trStationTitle}`);

    // Switch back to Station 1 (PV loop) and take screenshot
    await page.click('[data-station="pv-loop"]');
    await page.waitForTimeout(250);
    const screenshotPath = '/Users/yh/.gemini/antigravity/brain/65400f76-60ad-41ef-8e98-3578bd82623f/pathophysiology_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);

    console.log('PASS: Pathophysiology browser verification completed successfully.');
  } finally {
    await browser.close();
    await app.close();
  }
})();
