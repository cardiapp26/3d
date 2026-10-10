const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5199/?lang=tr');
    await page.locator('#panel-tab-notes').click();
    await page.waitForSelector('#personal-notes-send');
    const notes = [{ section: 'anatomy', title: 'Anatomi', text: 'Anatomi notum <script>\nİkinci satır' }, { section: 'angiography', title: 'Anjiyografi', text: 'İkinci bölüm notum' }];
    const send = () => page.evaluate(async notes => (await import('/src/notes-transfer.js')).sendNotes(notes, 'http://127.0.0.1:5205'), notes);
    assert.equal(await send(), 2);
    assert.equal(await send(), 2);
    const cardi = await context.newPage();
    await cardi.goto('http://127.0.0.1:5205/');
    await cardi.waitForSelector('.main');
    const counts = await cardi.evaluate(async () => {
      const { getState } = await import('/src/app/state.ts');
      const db = getState().db;
      return { notes: await db.notes.count(), revisions: (await db.revisions.toArray()).filter(r => r.entityType === 'note').length, outbox: (await db.outbox.toArray()).filter(r => r.entityType === 'note').length };
    });
    assert.deepEqual(counts, { notes: 2, revisions: 2, outbox: 2 });
    const untrusted = await context.newPage();
    await untrusted.goto('http://127.0.0.1:5205/transfer.html#origin=https%3A%2F%2Fevil.drtr.uk&token=01234567890123456789012345678901');
    await untrusted.waitForFunction(() => document.querySelector('#status').textContent.includes('geçersiz'));
    await page.evaluate(() => { window.open = () => null; });
    assert.equal(await page.evaluate(async notes => {
      try { await (await import('/src/notes-transfer.js')).sendNotes(notes, 'http://127.0.0.1:5205'); } catch (e) { return e.message; }
    }, notes), 'popup');
    console.log('PASS cross-origin transfer: two sections, persistence, retry dedup, revisions/outbox, rejected origin, popup blocked');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
