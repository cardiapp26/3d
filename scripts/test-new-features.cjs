const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const url = process.env.APP_URL || 'http://127.0.0.1:5173';
    await page.goto(url);
    await page.waitForSelector('#viewport[data-model-ready=true]');

    fs.mkdirSync('research/screenshots', { recursive: true });

    // 1. Check initial C-Arm panel position
    const carmPanel = page.locator('#carm-panel');
    const header = page.locator('#carm-header');
    assert.ok(await carmPanel.isVisible(), 'C-Arm panel is visible');

    const initialBox = await carmPanel.boundingBox();
    console.log('Initial panel box:', initialBox);

    // 2. Drag C-Arm panel across the screen
    await header.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 350, initialBox.y - 200, { steps: 15 });
    await page.mouse.up();

    const draggedBox = await carmPanel.boundingBox();
    console.log('Dragged panel box:', draggedBox);
    assert.ok(Math.abs(draggedBox.x - initialBox.x) > 50, 'Panel moved horizontally');
    assert.ok(Math.abs(draggedBox.y - initialBox.y) > 50, 'Panel moved vertically');
    await page.screenshot({ path: 'research/screenshots/carm-panel-dragged.png' });

    // 3. Test Veins toggle button in carm panel
    const veinsBtn = page.locator('#carm-veins-toggle');
    const veinsCheckbox = page.locator('input[data-layer="veins"]');
    assert.ok(await veinsCheckbox.isChecked(), 'Veins checked initially');

    // Click to hide veins
    await veinsBtn.click();
    assert.ok(!await veinsCheckbox.isChecked(), 'Veins checkbox unchecked after carm button toggle');
    await page.screenshot({ path: 'research/screenshots/veins-hidden.png' });

    // Click to show veins again
    await veinsBtn.click();
    assert.ok(await veinsCheckbox.isChecked(), 'Veins checkbox re-checked');

    // 4. Test Conduction system
    const conductionBtn = page.locator('#carm-conduction-toggle');
    const conductionCheckbox = page.locator('input[data-layer="conduction"]');
    assert.ok(await conductionCheckbox.isChecked(), 'Conduction checked initially');

    // 5. Test Valves & Subvalvular structures toggle
    const valvesBtn = page.locator('#carm-valves-toggle');
    const valvesCheckbox = page.locator('input[data-layer="valves"]');
    assert.ok(await valvesCheckbox.isChecked(), 'Valves checked initially');

    // Open wall cuts to 80% to see inside chambers
    for (const id of ['rv','lv','la','ra']) {
      await page.locator(`[data-wall=${id}]`).fill('80');
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'research/screenshots/valves-visible-inside-chambers.png' });

    // Click to hide all valves & papillary muscles
    await valvesBtn.click();
    assert.ok(!await valvesCheckbox.isChecked(), 'Valves checkbox unchecked after toggle');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'research/screenshots/valves-hidden-inside-chambers.png' });

    // Click to show valves again
    await valvesBtn.click();
    assert.ok(await valvesCheckbox.isChecked(), 'Valves checkbox re-checked');

    // Test individual sublayer: uncheck papillary muscles
    const papillaryCheckbox = page.locator('input[data-layer="papillary"]');
    await papillaryCheckbox.uncheck();
    assert.ok(!await papillaryCheckbox.isChecked(), 'Papillary unchecked');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'research/screenshots/valves-papillary-hidden.png' });

    // Recheck papillary
    await papillaryCheckbox.check();

    // Reset walls
    await page.locator('#restore-walls').click();

    assert.deepEqual(errors, []);
    console.log('ALL TESTS PASSED: C-Arm dragging, Veins toggle, Conduction system, Valves & Subvalvular toggles.');
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
