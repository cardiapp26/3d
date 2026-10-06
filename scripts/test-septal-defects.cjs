const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1050}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.APP_URL || 'http://127.0.0.1:5177')+'/#/mode/defects?structure=asd-secundum');
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const state=()=>page.evaluate(()=>window.heart.getState());
    assert.equal((await state()).defects.available.length,9);
    // Type pickers sit on top of the right panel card only (no hover drawer needed, no duplicate).
    assert.equal(await page.locator('#defect-details [data-defect-family=asd]').isVisible(),true);
    assert.equal(await page.locator('#defect-tools [data-defect-family]').count(),0);
    for(const id of (await state()).defects.available){
      await page.locator(`[data-defect-family=${id.split('-')[0]}]`).click();
      await page.locator(`[data-defect-id=${id}]`).click();
      assert.equal((await state()).selected,id);
      assert.equal((await state()).defects.selected,id);
      assert.equal(await page.locator('#structure-select').inputValue(),id);
      await page.waitForSelector('#viewport[data-camera-settled=true]');
    }
    const sites=await page.evaluate(()=>{const a=[];window.heart.scene.traverse(o=>{if(o.userData.anchor&&o.userData.pickId)a.push({id:o.name,p:o.position.toArray()});});return a;});
    assert.equal(sites.length,9);for(const s of sites)assert.ok(s.p.every(Number.isFinite));
    for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++)assert.ok(Math.hypot(...sites[i].p.map((v,k)=>v-sites[j].p[k]))>.1,'distinct atlas sites');
    await page.screenshot({path:'research/screenshots/defects-vsd.png'});
    await page.reload();await page.waitForSelector('#viewport[data-model-ready=true]');
    assert.equal((await state()).selected,'vsd-outlet');
    await page.locator('[data-defect-family=asd]').click();
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    await page.screenshot({path:'research/screenshots/defects-asd.png'});
    await page.locator('[data-mode=anatomy]').dispatchEvent('click');assert.equal((await state()).defects.visible,false);
    assert.equal(await page.locator('#defect-tools').isVisible(),false);
    await page.locator('[data-mode=defects]').dispatchEvent('click');
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    assert.deepEqual(errors,[]);
    console.log('ASD/VSD: 9 selections, atlas anchors, deep link, exit, mobile passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
