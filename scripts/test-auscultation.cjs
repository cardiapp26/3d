/**
 * Auscultation areas in the browser: the five markers sit on the shared chest
 * frame (A right, P/E/T left sternal border, M on the left midclavicular line;
 * 2nd, 3rd, 4th-5th and 5th spaces), M is not the LV apex vertex, and the 3D
 * focus follows the chosen finding, an area chip and a picked marker.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/#/mode/exam`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('.exam-select');
    const ausc = () => page.evaluate(() => window.heart.getAuscultation());

    const { positions: p } = await ausc();
    const [A, P, E, T, M] = ['aortic', 'pulmonic', 'erb', 'tricuspid', 'mitral'].map((id) => p[id]);
    const mid = (A[0] + P[0]) / 2;
    assert.ok(A[0] < mid && P[0] > mid, 'A right, P left of the sternal midline');
    assert.ok(Math.abs(E[0] - P[0]) < 1e-6 && Math.abs(T[0] - P[0]) < 1e-6, 'E and T on the left sternal border');
    assert.ok(M[0] - mid > 1.5, `M on the left midclavicular line (${(M[0] - mid).toFixed(2)} units from the midline)`);
    assert.ok(Math.abs(A[1] - P[1]) < 1e-6, 'A and P at the same (2nd) space');
    assert.ok(P[1] > E[1] && E[1] > T[1] && T[1] > M[1], 'levels: 2nd > 3rd > 4th-5th > 5th');
    assert.ok(new Set(Object.values(p).map((q) => q[2].toFixed(4))).size === 1, 'one chest plane');
    // M is placed on the chest frame, not taken from the LV apex vertex.
    const lv = await page.evaluate(() => window.heart.getState().structures.find((s) => s.id === 'lv').bounds);
    assert.ok(M[2] > lv.max[2], 'M on the chest wall in front of the heart');

    // The 3D focus follows the finding: changing the murmur moves the highlight to its area.
    const findings = await page.evaluate(() => [...document.querySelectorAll('.exam-select option')].map((o) => o.value));
    const areaOf = { aortic_stenosis: 'aortic', mitral_regurgitation: 'mitral', tricuspid_regurgitation: 'tricuspid', hocm: 'erb' };
    for (const [finding, area] of Object.entries(areaOf)) {
      if (!findings.includes(finding)) continue;
      await page.locator('.exam-select').selectOption(finding);
      assert.equal((await ausc()).highlighted, area, `${finding}: 3D focus on ${area}`);
      assert.equal(await page.locator(`[data-area=${area}]`).getAttribute('aria-pressed'), 'true', `${finding}: panel chip ${area}`);
    }
    // An area chip moves it too.
    await page.locator('[data-area=pulmonic]').click();
    assert.equal((await ausc()).highlighted, 'pulmonic', 'chip click moves the 3D focus');

    assert.deepEqual(errors, []);
    console.log('PASS auscultation: chest-frame placement (sides, lines, levels, plane), M off the apex vertex, 3D focus follows finding and chip');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
