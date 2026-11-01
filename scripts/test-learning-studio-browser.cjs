const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { startApp } = require('./lib/app-server.cjs');
const assert = require('node:assert/strict');
(async()=>{const app=await startApp();const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${app.url}/pathophysiology/?lang=tr`);await page.waitForSelector('.learning-studio');
 assert.equal(await page.locator('.learning-fine').count(),await page.locator('input[type=range]').count());
 await page.locator('[data-learn-metric]').selectOption('1');
 await page.locator('[data-learn-start]').click();
 const range=page.locator('[data-pv-slider=edv]');const before=Number(await range.inputValue());
 await range.locator('..').locator('.learning-fine button').last().click();
 assert.equal(Number(await range.inputValue()),before+5);
 await page.locator('[data-learn-compare]').click();assert.ok(await page.locator('.learning-results table').isVisible());
 assert.match(await page.locator('.learning-status').textContent(),/uyumlu/);
 await page.locator('.learning-reflection textarea').fill('EDV değişimini atım hacmi ile karşılaştırdım.');await page.locator('[data-learn-save]').click();
 assert.equal(await page.locator('[data-station=pv-loop]').getAttribute('data-experiment-complete'),'true');
 await page.locator('[data-pathophys-lang=en]').click();assert.match(await page.locator('.learning-studio h3').textContent(),/Build/);
 assert.equal(Number(await range.inputValue()),before+5,'language preserves model state');
 await page.reload();await page.waitForSelector('.learning-studio');assert.equal(await page.locator('[data-station=pv-loop]').getAttribute('data-experiment-complete'),'true');
 await page.locator('.pathophys-presets-bar button').nth(1).click();
 assert.equal(await page.locator('[data-pv-slider=edv]').inputValue(),await page.locator('[data-pv-slider=edv]').locator('..').locator('input[type=number]').inputValue(),'preset synchronizes precise editor');
 const ids=await page.locator('[data-station]').evaluateAll(nodes=>nodes.map(n=>n.dataset.station));
 for(const id of ids){await page.locator(`[data-station="${id}"]`).click();await page.waitForSelector('.learning-studio');console.log(id, 'metrics',await page.locator('[data-learn-metric] option').count());assert.equal(await page.locator('.learning-studio').count(),1);}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-station=pv-loop]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.ok(await page.locator('.pathophys-nav').evaluate(node=>node.getBoundingClientRect().height<120),'mobile navigation is compact horizontal strip');
 await page.screenshot({path:'/tmp/learning-studio-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS learning workflow: baseline, model control, feedback, persistence, language, all stations, mobile');
}finally{await browser.close();await app.close();}})().catch(e=>{console.error(e);process.exitCode=1});
