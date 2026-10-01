const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const { createServer } = await import('vite');
  const server = process.env.APP_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  if (server) await server.listen();
  const url = process.env.APP_URL || `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    await page.addInitScript(() => {
      const Native = window.ResizeObserver;
      window.resizeErrors = [];
      let recent = [];
      window.ResizeObserver = class extends Native {
        constructor(callback) {
          const source = new Error().stack;
          super((entries, observer) => {
            recent.push({ source, targets: entries.map(e => e.target.id || e.target.className) });
            recent = recent.slice(-5);
            callback(entries, observer);
          });
        }
      };
      window.addEventListener('error', e => { if (/ResizeObserver/.test(e.message)) window.resizeErrors.push({ message: e.message, recent }); });
    });
    await page.goto(url);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    for (const size of [{ width: 390, height: 844 }, { width: 640, height: 800 }, { width: 1300, height: 900 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(350);
    }
    const errors = await page.evaluate(() => window.resizeErrors);
    assert.deepEqual(errors, [], 'viewport changes must not create ResizeObserver feedback loops');
    console.log('PASS resize-observer: initial load and desktop/mobile resizing without feedback loops');
  } finally {
    await browser?.close();
    await server?.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
