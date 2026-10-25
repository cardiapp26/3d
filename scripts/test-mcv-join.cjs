const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { startApp } = require('./lib/app-server.cjs');

// The middle cardiac vein drains into the coronary sinus at rest and through the beat.
(async () => {
  const app = await startApp();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${app.url}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]', { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const { tubeComponents } = await import('/src/coronary-branches.js');
      const h = window.heart;
      const join = h.atlasAdjustments().middleCardiacVein;
      const longest = m => tubeComponents(m.geometry).reduce((a, c) => (c.rings.length > a.rings.length ? c : a));
      // Gap between the nearest MCV vertex and the CS centreline, minus the CS radius estimate.
      const gapAt = phase => {
        h.setBeating(false); h.seekCycle(phase);
        const cs = h.getMeshes('cs')[0], mcv = h.getMeshes('mcv')[0];
        const centre = longest(cs).rings, pos = mcv.geometry.attributes.position, csPos = cs.geometry.attributes.position;
        const v = new centre[0].constructor();
        let best = Infinity, at = null;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          for (const c of centre) { const d = v.distanceTo(c); if (d < best) { best = d; at = c; } }
        }
        let r = Infinity; for (let i = 0; i < csPos.count; i++) r = Math.min(r, v.fromBufferAttribute(csPos, i).distanceTo(at));
        return { centreline: best, wall: r };
      };
      return { join, rest: gapAt(0), systole: gapAt(0.6) };
    });
    assert.ok(result.join, 'middle cardiac vein joined to the coronary sinus');
    assert.ok(result.join.gap > 0.04 && result.join.gap < 0.6, `bridged gap ${result.join.gap.toFixed(3)}`);
    for (const key of ['rest', 'systole']) {
      const { centreline, wall } = result[key];
      assert.ok(centreline <= wall + 0.005, `${key}: the MCV reaches inside the CS lumen (${centreline.toFixed(3)} vs wall ${wall.toFixed(3)})`);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS mcv-join: middle cardiac vein drains into the coronary sinus (bridge ${result.join.gap.toFixed(2)}, inside lumen at rest and in systole)`);
  } finally { await browser.close(); await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
