const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { startApp } = require('./lib/app-server.cjs');
const assert = require('node:assert/strict');
(async()=>{const app=await startApp(),browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${app.url}/pathophysiology/?lang=tr#pv-loop`);await page.waitForSelector('[data-visual-handle]');
 assert.equal(await page.locator('.learning-studio').count(),0,'unwanted experiment panel removed');
 async function drag(selector,dx){const handle=page.locator(selector).first();await handle.waitFor({state:'visible'});const b=await handle.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+dx,b.y+b.height/2,{steps:8});await page.mouse.up();}
 const value=()=>page.locator('[data-pv-slider=edv]').inputValue();let before=Number(await value());
 await page.locator('.pathophys-pv-svg').scrollIntoViewIfNeeded();
 await drag('.pathophys-pv-svg [data-visual-handle]',45);assert.ok(Number(await value())>before,'drag changes actual EDV');
 await page.locator('.pathophys-pv-svg [data-visual-handle]').focus();before=Number(await value());await page.keyboard.press('ArrowLeft');assert.equal(Number(await value()),before-5);
 const svg=page.locator('.pathophys-pv-svg'),box=await svg.getAttribute('viewBox');
 await svg.locator('..').locator('[data-visual-action=plus]').first().click();assert.notEqual(await svg.getAttribute('viewBox'),box);
 await svg.locator('..').locator('[data-visual-action=reset]').first().click();assert.equal(await svg.getAttribute('viewBox'),box);
 await page.locator('[data-station=starling-laplace]').click();await page.waitForSelector('.laplace-svg [data-visual-handle]');
 const r=Number(await page.locator('[data-laplace-slider=r]').inputValue());await drag('.laplace-svg [data-visual-handle="0"]',15);assert.ok(Number(await page.locator('[data-laplace-slider=r]').inputValue())>r);
 const h=Number(await page.locator('[data-laplace-slider=h]').inputValue());await page.locator('.laplace-svg [data-visual-handle="1"]').focus();await page.keyboard.press('ArrowRight');assert.ok(Number(await page.locator('[data-laplace-slider=h]').inputValue())>h);
 const edv=Number(await page.locator('[data-starling-edv]').inputValue());await drag('.starling-svg [data-visual-handle]',35);assert.ok(Number(await page.locator('[data-starling-edv]').inputValue())>edv);
 await page.locator('[data-pathophys-lang=en]').click();assert.match(await page.locator('.visual-tools span').first().textContent(),/Drag/);
 const stations=await page.locator('[data-station]').evaluateAll(nodes=>nodes.map(n=>n.dataset.station));for(const id of stations){await page.locator(`[data-station="${id}"]`).click();assert.equal(await page.locator('.learning-studio').count(),0);}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-station=pv-loop]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.locator('.pathophys-pv-svg').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/pathophys-direct-manipulation.png'});
 assert.deepEqual(errors,[]);console.log('PASS direct visual interaction: PV/Starling/Laplace drag, keyboard, zoom/reset, all stations, language and mobile');
}finally{await browser.close();await app.close();}})().catch(e=>{console.error(e);process.exitCode=1});
