const { chromium } = require('/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
const page=await browser.newPage({viewport:{width:1400,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${process.env.EPS_URL || 'http://127.0.0.1:5173/eps'}/#/mapping`);await page.locator('[data-amap-map]').waitFor();
// The wave plays by itself when the tab opens; Full map stops it for the deterministic steps.
await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.epsLab.panel.mapping.getState().playing),true,'autoplay on open');
await page.locator('[data-amap-full]').click();assert.equal(await page.evaluate(()=>window.epsLab.panel.mapping.getState().playing),false);
const map=page.locator('[data-amap-map]');await map.focus();await page.keyboard.press('ArrowRight');assert.match(await page.locator('[data-amap-point]').textContent(),/LAT/);
await page.evaluate(()=>window.mappingOption = document.querySelector('[data-amap-reference] option'));
await page.locator('[data-amap-play]').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.mappingOption === document.querySelector('[data-amap-reference] option')),true,'playback preserves dropdown options');let state=await page.evaluate(()=>window.epsLab.panel.mapping.getState());assert.ok(state.playing && state.progress>0 && state.progress<100);
await page.locator('[data-amap-play]').click();state=await page.evaluate(()=>window.epsLab.panel.mapping.getState());assert.equal(state.playing,false);
await page.locator('[data-amap-full]').click();assert.equal(await page.locator('[data-amap-progress]').inputValue(),'100');
await page.locator('[data-amap-scenario]').selectOption('slow-scar');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.epsLab.panel.mapping.getState().playing),true,'autoplay on scenario change');await page.locator('[data-amap-window]').selectOption('dePonti');assert.equal(await page.locator('[data-amap-play]').isDisabled(),true);assert.equal(await page.locator('[data-amap-play]').getAttribute('aria-pressed'),'false');
await page.locator('[data-amap-scenario]').selectOption('focal-ra');await page.locator('[data-amap-full]').click();await page.evaluate(()=>window.epsLab.setLang('en'));assert.match(await page.locator('[data-amap-play]').textContent(),/Play the spread/);
await page.locator('[data-amap-play]').click();await page.locator('[data-ep-section=live]').click();assert.equal(await page.evaluate(()=>window.epsLab.panel.mapping.getState().playing),false);
await page.locator('[data-ep-section=mapping]').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'no horizontal overflow');
await page.setViewportSize({width:1400,height:900});await page.waitForTimeout(100);assert.deepEqual(errors,[]);console.log('PASS mapping UI: autoplay on open and scenario change, selection, playback, pause, full map, invalid window, EN, hidden-tab stop, mobile overflow, resize');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
