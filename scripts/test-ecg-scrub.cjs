/**
 * ECG cursor scrubbing: dragging the yellow cursor on the ECG strip moves the
 * cardiac cycle and the beating heart with it; playback pauses while dragging
 * and resumes on release; arrow keys step the phase.
 * Usage: APP_URL=... node scripts/test-ecg-scrub.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const phase = () => page.evaluate(() => window.heart.getCycleState().phase);
    const lvSum = () => page.evaluate(() => { let lv; window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id === 'lv' && !lv) lv = o; }); return Array.from(lv.geometry.attributes.position.array.slice(0, 300)).reduce((a, b) => a + b, 0); });

    await page.evaluate(() => window.heart.setBeating(true));
    const box = await page.locator('#ecg-canvas').boundingBox();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), false, 'playback pauses while dragging');
    const before = await lvSum();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 6 });
    const held = await phase();
    await page.waitForTimeout(300);
    assert.equal(await phase(), held, 'the cycle stays under the cursor while held');
    assert.ok(Math.abs(held - 0.7) < 0.1, `phase follows the cursor (${held.toFixed(3)})`);
    assert.ok(Math.abs((await lvSum()) - before) > 1e-5, 'the heart moves with the cursor');
    await page.mouse.up();
    assert.equal(await page.evaluate(() => window.heart.getCycleState().playing), true, 'playback resumes on release');

    await page.evaluate(() => window.heart.setBeating(false));
    await page.locator('#ecg-canvas').focus();
    const k0 = await phase();
    await page.keyboard.press('ArrowRight');
    assert.ok(Math.abs((await phase()) - k0 - 0.01) < 1e-6, 'arrow key steps the phase');
    assert.equal(await page.locator('#ecg-canvas').getAttribute('role'), 'slider');
    assert.deepEqual(errors, []);
    console.log('PASS: ECG cursor drag scrubs the cycle and the heart, pauses and resumes playback, arrow keys step');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
