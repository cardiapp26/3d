// Browser tests: open a 3D lesson mode. A mode of the current page is a click
// on its menu button; a mode hosted on another page (src/cardia-pages.js)
// loads that page and waits until the atlas is ready and the mode is entered.
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PAGES_MODULE = pathToFileURL(path.join(__dirname, '..', '..', 'src', 'cardia-pages.js')).href;

async function modeUrl(base, mode, query = '') {
  const { modeHref } = await import(PAGES_MODULE);
  const href = modeHref(mode, query);
  if (!href) throw new Error(`No page hosts mode ${mode}`);
  return `${base.replace(/\/$/, '')}/${href.replace(/^\.\//, '')}`;
}

async function openMode(page, base, mode) {
  const button = page.locator(`#mode-nav [data-mode="${mode}"]:not([data-mode-step])`);
  if (await button.count()) {
    await button.first().dispatchEvent('click');
    return;
  }
  await page.goto(await modeUrl(base, mode));
  await page.waitForSelector('#viewport[data-model-ready=true]');
  await page.waitForFunction(m => document.documentElement.dataset.appMode === m, mode);
}

module.exports = { openMode, modeUrl };
