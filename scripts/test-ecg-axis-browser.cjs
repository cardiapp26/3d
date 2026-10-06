/**
 * ECG axis lab: wheel drag sets the axis, the six strips follow, lead
 * projection, the three reading methods, quiz grading, language, phone.
 * Usage: APP_URL=... node scripts/test-ecg-axis-browser.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || null;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/ecg/?lang=tr`);
    await page.locator('[data-topic="3"]').click();
    const lab = page.locator('.axl');
    await lab.waitFor({ state: 'visible' });
    const result = () => page.locator('.axl-result').textContent();
    const net = id => page.locator(`[data-lead="${id}"] .axl-strip-net`).textContent();
    assert.equal(await page.locator('.axl-strip').count(), 6, 'six limb leads');
    assert.match(await result(), /\+59° · Normal aks/);

    // Drag on the wheel: a point up and to the right is -60° (left axis deviation).
    const wheelPoint = (angle, r = 100) => page.evaluate(([a, rr]) => {
      const root = document.querySelector('.axl-wheel');
      const p = new DOMPoint(180 + rr * Math.cos(a * Math.PI / 180), 180 + rr * Math.sin(a * Math.PI / 180)).matrixTransform(root.getScreenCTM());
      return { x: p.x, y: p.y };
    }, [angle, r]);
    await page.locator('.axl-wheel').scrollIntoViewIfNeeded();
    const at = await wheelPoint(-60, 70);
    await page.mouse.move(at.x, at.y); await page.mouse.down(); await page.mouse.up();
    assert.match(await result(), /−60° · Sol aks sapması/);
    assert.match(await net('aVL'), /\+/); assert.match(await net('II'), /−/);
    assert.match(await net('III'), /−/);

    // Lead projection: click the aVR strip.
    await page.locator('[data-lead="aVR"]').click();
    assert.match(await page.locator('.axl-proj').textContent(), /aVR: izdüşüm/);
    assert.equal(await page.locator('.axl-projection line').count(), 2);

    // Methods at +60°: quadrant, isoelectric aVL, atan2.
    await page.locator('[data-cond="normal"]').click();
    await page.locator('[data-lab-param=angle]').evaluate(el => { el.value = '60'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.match(await page.locator('.axl-steps').textContent(), /0° ile \+90° \(normal\)/);
    await page.locator('[data-axis-method="1"]').click();
    assert.match(await page.locator('.axl-steps').textContent(), /derivasyon: aVL[\s\S]*\+60°/);
    assert.equal(await page.locator('.axl-lead.is-iso').getAttribute('data-wheel-lead'), 'aVL');
    await page.locator('[data-axis-method="2"]').click();
    assert.match(await page.locator('.axl-steps').textContent(), /atan2[\s\S]*≈ \+60°/);
    await page.locator('[data-lab-param=angle]').evaluate(el => { el.value = '-180'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.match(await result(), /\+180° · Sağ aks sapması/);
    // Boundary reading uses equiphasic, not a floating-point positive sign.
    await page.locator('[data-axis-boundary="-30"]').click();
    await page.locator('[data-axis-method="0"]').click();
    assert.match(await result(), /−30° · Normal aks/);
    assert.match(await page.locator('[data-axis-decision="II"]').textContent(), /Eşfazlı/);
    assert.match(await page.locator('.axl-steps').textContent(), /Sınır/);
    await page.locator('[data-axis-region="extreme"]').click();
    assert.match(await result(), /−135° · Aşırı/);
    assert.equal(await page.locator('.axl-bar-row').count(), 6);
    await page.locator('[data-lab-param=angle]').evaluate(el => { el.value = '60'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('[data-axis-method="2"]').click();
    assert.equal(await page.locator('.axl-component-path').count(), 1);
    assert.match(await page.locator('.axl-steps').textContent(), /2·aVF\/√3/);
    // Keyboard on the arrow: +5°.
    await page.locator('.axl-arrow-user').focus(); await page.keyboard.press('ArrowRight');
    assert.match(await result(), /\+65°/);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await lab.screenshot({ style: 'header { visibility: hidden !important; }', path: `${SHOTS}/axis-explore.png` }); }

    // Quiz: the axis and the methods are hidden; the true axis of question 0 is +60°.
    await page.locator('[data-axis-mode="quiz"]').click();
    assert.equal(await page.locator('.axl-insights').isVisible(), false, 'projection bars hidden');
    assert.equal(await page.locator('.axl-legend').isVisible(), false, 'category hidden');
    assert.equal(await page.locator('.axl-method').isVisible(), false, 'methods hidden before answering');
    assert.equal(await page.locator('.axl-arrow-truth').isVisible(), false, 'true axis hidden');
    assert.equal(await page.locator('.axl-lead.is-iso').count(), 0, 'no isoelectric hint in the quiz');
    assert.doesNotMatch(await result(), /°/);
    await page.locator('[data-lab-param=angle]').evaluate(el => { el.value = '55'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('[data-axis-action=check]').click();
    assert.match(await page.locator('.axl-quiz-text').textContent(), /Doğru[\s\S]*\+60°[\s\S]*Hata 5°/);
    assert.match(await page.locator('.axl-score').textContent(), /1\/1/);
    assert.equal(await page.locator('[data-lab-param=angle]').isDisabled(), true, 'graded estimate locked');
    assert.equal(await page.locator('.axl-method').isVisible(), true, 'methods shown after answering');
    await page.locator('[data-axis-action=next]').click();
    assert.equal(await page.locator('[data-axis-action=check]').isDisabled(), false);
    if (SHOTS) await lab.screenshot({ style: 'header { visibility: hidden !important; }', path: `${SHOTS}/axis-quiz.png` });

    // Language keeps the state.
    await page.locator('[data-ecg-lang=en]').click();
    assert.match(await page.locator('.axl-score').textContent(), /Score: 1\/1/);
    await page.locator('[data-axis-mode="explore"]').click();
    assert.match(await result(), /\+65° · Normal axis/);

    // Phone: no horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow on a phone');
    if (SHOTS) await lab.screenshot({ style: 'header { visibility: hidden !important; }', path: `${SHOTS}/axis-mobile.png` });

    assert.deepEqual(errors, []);
    console.log('PASS ECG axis browser: wheel drag, six strips, lead projection, quadrant/isoelectric/atan2 methods, keyboard, quiz grading, language, phone');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
