/**
 * Echo studio in the browser: the mitral apparatus (two papillary muscles, chordae, annulus)
 * is in the cut, and the valve pathology card switches the lesion on the echo image, draws the
 * spectral Doppler and the colour jet of the right phase.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const idsInCut = (page) => page.evaluate(() => [...new Set((window.cardiaEcho.getSection()?.contours || []).map((c) => c.id))]);
const countOf = (page, id) => page.evaluate((id) => (window.cardiaEcho.getSection()?.contours || []).filter((c) => c.id === id).length, id);
// Saturated (colour Doppler) pixels on the echo canvas; the B-mode image is grey.
const colourPixels = (page) => page.evaluate(() => {
  const c = document.querySelector('[data-echo-slot="echo"] canvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 16) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mx - mn > 90) n++; }
  return n;
});

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/echo/?lang=tr&modality=tte`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.cardiaEcho?.getSection?.(), null, { timeout: 60000 });
    await page.evaluate(() => window.heart.setBeating(false));
    const show = async (view, phase) => {
      await page.click(`[data-echo-view="${view}"]`);
      await page.evaluate((p) => window.heart.seekCycle(p), phase);
      await page.waitForTimeout(600);
    };

    // Mitral apparatus in the cut.
    await show('a4c', 0.62);
    const a4c = await idsInCut(page);
    for (const id of ['mitral', 'mitral-annulus', 'lv-papillary', 'mitral-chordae']) assert.ok(a4c.includes(id), `A4C cuts ${id}`);
    await show('psax-pm', 0.62);
    assert.ok(await countOf(page, 'lv-papillary') >= 2, 'PSAX papillary level: two papillary muscles');
    assert.ok(!(await idsInCut(page)).includes('mitral'), 'PSAX papillary level: below the leaflets');

    // Pathology card: every lesion draws its Doppler; the jet follows the phase.
    const lesions = await page.$$eval('[data-ep-lesion]', (b) => b.map((x) => x.dataset.epLesion));
    assert.equal(lesions.length, 6, 'normal and five severe lesions');
    for (const id of lesions) {
      await page.click(`[data-ep-lesion="${id}"]`);
      assert.equal(await page.evaluate(() => window.cardiaEcho.getPathology().lesion), id);
      const lit = await page.evaluate(() => {
        const c = document.querySelector('[data-ep-doppler]');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 120) n++;
        return n;
      });
      assert.ok(lit > 2000, `${id}: spectral Doppler drawn (${lit})`);
      if (id !== 'normal') assert.ok(await page.locator('.ep-table tr').count() >= 3, `${id}: quantification rows`);
    }
    await page.click('[data-ep-lesion="mr-severe-primary"]');
    await show('a4c', 0.62);
    const systolic = await colourPixels(page);
    await show('a4c', 0.15);
    const diastolic = await colourPixels(page);
    assert.ok(systolic > 300 && systolic > diastolic * 3, `MR jet in systole only (${systolic} vs ${diastolic})`);
    await page.click('[data-ep-view="a2c"]');
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => window.cardiaEcho.getState().view), 'a2c', 'recommended view button switches the view');
    // Colour off: the lesion stays (thick valve), the jet goes.
    await page.uncheck('[data-ep-color]');
    await show('a4c', 0.62);
    assert.ok(await colourPixels(page) < systolic / 5, 'colour Doppler switch hides the jet');
    assert.deepEqual(errors, []);
    console.log(`PASS echo pathology browser: apparatus in A4C and PSAX (two papillary muscles), ${lesions.length} lesions with Doppler and quantification, MR jet ${systolic} px in systole vs ${diastolic} in diastole`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
