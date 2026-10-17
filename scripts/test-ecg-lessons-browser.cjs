const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.APP_URL||'http://127.0.0.1:5192'}/ecg/?lang=tr`);
  await page.locator('.lesson-experiments').waitFor();
  const choose=async i=>{await page.locator(`[data-experiment="${i}"]`).click();};
  for(let topic=0;topic<6;topic++){
   await page.locator(`[data-topic="${topic}"]`).click();
   assert.equal(await page.locator('[data-experiment]').count(),3);
   for(let i=0;i<3;i++){
    await choose(i);
    assert.equal(await page.locator(`[data-experiment="${i}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.lesson-target').count(),1);
   }
   await page.locator('.lesson-question summary').click();
   await page.locator('[data-lesson-answer="1"]').click();
   assert.match(await page.locator('.lesson-feedback').textContent(),/Tekrar düşün/);
   await page.locator('[data-lesson-answer="0"]').click();
   assert.match(await page.locator('.lesson-feedback').textContent(),/Doğru/);
   const focus=page.locator('.lesson-focus');await focus.click();
   assert.equal(await focus.getAttribute('aria-pressed'),'true');await focus.click();
  }
  // Real model values, not only card selection.
  await page.locator('[data-topic="0"]').click();await choose(1);
  assert.match(await page.locator('.ecg-lab-result').textContent(),/80 ms = 4.0/);
  await page.locator('[data-topic="3"]').click();await choose(2);
  assert.equal(await page.locator('[data-lab-param="angle"]').inputValue(),'120');
  await page.locator('[data-ecg-lang="en"]').click();
  assert.equal(await page.locator('[data-lab-param="angle"]').inputValue(),'120');
  assert.match(await page.locator('.lesson-experiments h3').textContent(),/Rotate the axis/);
  await page.locator('[data-topic="5"]').click();await choose(1);
  assert.equal(await page.locator('[data-lab-param="erp"]').inputValue(),'600');
  assert.match(await page.locator('.ecg-lab-result').first().textContent(),/Not sustained/);
  await choose(2);assert.equal(await page.locator('[data-lab-control="block-false"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-topic="0"]').click();
  const svg=page.locator('[data-ecg-lab="ch11_basics"]>.ecg-lab-visual>svg');
  const box=await svg.boundingBox();await svg.click({position:{x:box.width*.5,y:box.height*.25}});
  assert.ok(Number(await page.locator('[data-lab-param="cursor"]').inputValue())>300);
  await page.locator('.guyton-dynamic-view').screenshot({path:'/tmp/cardia-lesson-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  for(let i=0;i<6;i++){
   await page.locator(`[data-topic="${i}"]`).click();
   await choose(0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`mobile overflow ${i}`);
  }
  await page.locator('.lesson-experiments').screenshot({path:'/tmp/cardia-lesson-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: 18 live presets, six quizzes, visual focus, model outputs, TR/EN retention, waveform pointer and six mobile layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
