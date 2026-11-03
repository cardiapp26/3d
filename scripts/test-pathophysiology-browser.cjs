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

    // Verify 16 station buttons in sidebar, grouped under 4 headings
    const stations = await page.$$eval('.pathophys-nav-item', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    assert.equal(stations.length, 16, `Should have 16 stations in nav, found: ${stations.length}`);
    assert.equal(await page.locator('.pathophys-nav-group').count(), 4, 'four station groups');

    // Station 1: PV loop
    assert.ok(await page.$('.pathophys-pv-svg'), 'PV loop SVG should render');
    const efReadout = await page.$eval('[data-pv-out="ef"]', el => el.textContent.trim());
    assert.ok(efReadout.includes('%'), `EF readout should be percentage, got: ${efReadout}`);

    // Station 2: preload / afterload explorer (moved here from the catheter panel)
    await page.click('[data-station="loads"]');
    await page.waitForSelector('.pathophys-loads-lab .hemo-loads');
    assert.equal(Number(await page.getAttribute('[data-load-stress]', 'data-load-stress')), 15, 'baseline preload wall stress');
    await page.click('[data-load-mode="afterload"]');
    assert.equal(Number(await page.getAttribute('[data-load-stress]', 'data-load-stress')), 125, 'baseline afterload wall stress');

    // Click Station 3: Starling & Laplace
    await page.click('[data-station="starling-laplace"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.starling-svg'), 'Starling SVG should render');
    assert.ok(await page.$('.laplace-svg'), 'Laplace SVG should render');

    // Click Station 3: Atherogenesis
    await page.click('[data-station="atherogenesis"]');
    await page.waitForTimeout(200);
    assert.ok(await page.$('.athero-stepper'), 'Atherogenesis stepper should render');
    assert.ok(await page.$('.athero-cum-svg polyline'), 'Cumulative LDL curve should render');
    await page.click('[data-mod-id="masld"]');
    await page.click('[data-statin-age="35"]');
    assert.equal(await page.locator('.athero-cum-svg polyline').count(), 2, 'treated and untreated LDL trajectories');
    await page.screenshot({ path: '/Users/yh/.gemini/antigravity/brain/65400f76-60ad-41ef-8e98-3578bd82623f/athero_screenshot.png' });

    // New source-based stations
    const shots = '/Users/yh/.gemini/antigravity/brain/65400f76-60ad-41ef-8e98-3578bd82623f';
    await page.click('[data-station="hypertension-vascular"]');
    await page.waitForSelector('.htn-svg');
    const bpBefore = await page.locator('.pathophys-htn-lab .readout-value').first().textContent();
    await page.click('[data-htn-drug="baxdrostat"]');
    assert.notEqual(await page.locator('.pathophys-htn-lab .readout-value').first().textContent(), bpBefore, 'drug lowers central BP');
    await page.screenshot({ path: `${shots}/htn_screenshot.png` });

    // Vessel wall stresses (Laplace + Hagen-Poiseuille) under the vascular station
    await page.waitForSelector('[data-vessel-wall-lab] [data-vw-hoop]');
    const toggleVw = page.locator('[data-vw-toggle]');
    if ((await toggleVw.getAttribute('aria-pressed')) !== 'true') await toggleVw.click();
    await page.locator('[data-vw-card="shear"]').scrollIntoViewIfNeeded();
    const rbcBefore = await page.locator('.vw-rbc').first().getAttribute('cx');
    await page.waitForTimeout(400);
    assert.notEqual(await page.locator('.vw-rbc').first().getAttribute('cx'), rbcBefore, 'red cells move with the flow');
    assert.equal(await page.locator('[data-vw-shear-zone]').getAttribute('data-zone'), 'protective', 'coronary laminar shear is protective');
    await page.click('[data-vw-preset="shear.bifurcation"]');
    assert.equal(await page.locator('[data-vw-shear-zone]').getAttribute('data-zone'), 'low', 'bifurcation outer wall is atheroprone');
    await page.click('[data-vw-preset="shear.stenosis"]');
    assert.equal(await page.locator('[data-vw-shear-zone]').getAttribute('data-zone'), 'high', 'stenosis throat has very high shear');
    const hoopBefore = await page.locator('[data-vw-bar="hoop"] em').textContent();
    await page.click('[data-vw-preset="lap.htn"]');
    assert.notEqual(await page.locator('[data-vw-bar="hoop"] em').textContent(), hoopBefore, 'hypertension raises hoop stress');
    await page.locator('[data-vw-input="aorta.diameter"]').fill('56');
    assert.equal(await page.locator('[data-vw-aorta-zone]').getAttribute('data-zone'), 'surgery', '56 mm crosses the surgical threshold');

    await page.click('[data-station="pah-rv"]');
    await page.waitForSelector('.pah-svg');
    await page.click('[data-pah-toggle="sota"]');
    await page.screenshot({ path: `${shots}/pah_screenshot.png` });

    await page.click('[data-station="myocardial-ckm"]');
    await page.waitForSelector('.ckm-svg');
    for (const m of ['ckm', 'lymphatic', 'takotsubo']) { await page.click(`[data-ckm-mode="${m}"]`); await page.waitForSelector('.ckm-svg'); }
    await page.screenshot({ path: `${shots}/ckm_screenshot.png` });

    await page.click('[data-station="achd-shunts"]');
    await page.waitForSelector('.achd-svg');
    await page.click('[data-achd-preset="eisen"]');
    assert.match(await page.locator('.achd-svg').textContent(), /Eisenmenger/, 'Eisenmenger reversal shown');
    await page.screenshot({ path: `${shots}/achd_screenshot.png` });

    // Test Classic Pathophysiology Stations
    await page.click('[data-station="ischemic-cascade"]');
    await page.waitForSelector('.mvo2-scale-svg');
    assert.ok(await page.$('.cascade-stepper'), 'Ischemic cascade stepper should render');
    await page.click('[data-workload="heavy"]');
    await page.screenshot({ path: `${shots}/ischemia_screenshot.png` });

    await page.click('[data-station="heart-failure"]');
    await page.waitForSelector('.starling-curve-svg');
    assert.ok(await page.$('.geom-svg'), 'Heart failure geometry should render');
    await page.click('[data-phenotype="hcm"]');
    await page.screenshot({ path: `${shots}/hf_screenshot.png` });

    await page.click('[data-station="pericardial"]');
    await page.waitForSelector('.pericardial-pv-svg');
    assert.ok(await page.$('.septal-shift-svg'), 'Pericardial septal shift should render');
    await page.click('[data-disorder="constriction"]');
    await page.screenshot({ path: `${shots}/pericardial_screenshot.png` });

    assert.equal(errors.length, 0, `Page errors after new stations: ${errors.join('; ')}`);

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
