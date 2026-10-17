const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1080},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.APP_URL||'http://127.0.0.1:5192'}/ecg/?lang=tr`);
  await page.locator('[data-davinci-tab]').click();
  await page.locator('.da-atlas[data-loaded=true]').waitFor({timeout:30000});
  assert.equal(await page.locator('.lesson-experiments').count(),0,'Da Vinci opens directly into anatomy');
  assert.equal(await page.locator('.da-webgl canvas').count(),1);
  const section=async id=>page.locator(`[data-davinci-section="${id}"]`).click();
  const slide=async(key,value)=>page.locator(`[data-da-slider="${key}"]`).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
  const trace=id=>page.locator(`[data-da-lead="${id}"] .da-trace`).getAttribute('d');
  await slide('rvotFocus',0);const before=await trace('I');
  await page.locator('[data-da-save]').click();await slide('rvotFocus',1);
  assert.notEqual(await trace('I'),before);assert.equal(await page.locator('.da-trace-a').count(),6);
  assert.match(await page.locator('.da-reading').textContent(),/Mediyal/);
  await page.locator('[data-cab-mode="standard"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-cab-mode="standard"]').evaluate(e=>e===document.activeElement),true);
  await page.locator('[data-da-lead="aVR"]').click();
  assert.equal(await page.locator('.da-pin').filter({hasText:/^aVR$/}).isVisible(),true);
  await page.locator('[data-cab-mode="cabrera"]').click();assert.equal(await page.locator('[data-da-lead="-aVR"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-scenario="sinus_p"]').click();
  assert.match(await page.locator('[data-da-lead="II"] .da-strip-sign').textContent(),/P pozitif/);
  await page.locator('[data-scenario="mi_contiguous"]').click();assert.match(await page.locator('.da-strip-sign').first().textContent(),/ST/);
  await page.locator('[data-scenario="rvot_shift"]').click();await page.locator('[data-da-clear]').click();
  await page.locator('[data-da-view="superior"]').click();assert.equal(await page.locator('.da-atlas').getAttribute('data-view'),'superior');
  await page.locator('[data-da-view="anterior"]').click();
  await page.locator('.da-workbench').screenshot({path:'/tmp/davinci-v2-desktop.png'});
  // Pointer drag actually changes the rendered canvas.
  const canvas=page.locator('.da-webgl canvas'),box=await canvas.boundingBox(),imageBefore=await canvas.screenshot();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:12});await page.mouse.up();
  await page.waitForTimeout(300);assert.notDeepEqual(await canvas.screenshot(),imageBefore,'orbit changes the rendered anatomy');
  await section('heights');
  for(const id of ['superior','middle','inferior']){await page.locator(`[data-plane="${id}"]`).focus();await page.keyboard.press('Enter');assert.equal(await page.locator(`[data-plane="${id}"]`).evaluate(e=>e===document.activeElement),true);}
  await page.locator('[data-da-site="inferoseptal"]').click();assert.match(await page.locator('.da-evidence-main').textContent(),/R konkordansı/);
  assert.equal(await page.locator('.da-strip-sign').filter({hasText:'R baskın'}).count(),6);
  await page.locator('[data-da-site="inferomedial"]').click();assert.equal(await page.locator('.da-strip-sign').filter({hasText:'Başlangıç Q'}).count(),4);
  await slide('bodyShift',.5);await slide('opacity',.35);await page.locator('[data-da-view="superior"]').click();
  await page.locator('.da-workbench').screenshot({path:'/tmp/davinci-v2-heights.png'});
  await section('nomenclature');await page.locator('[data-nom="papillary"]').click();await page.locator('[data-da-site="superolateral"]').click();
  assert.equal(await page.locator('.da-pin').filter({hasText:/^V6$/}).isVisible(),true,'papillary strips have visible electrodes');
  assert.equal(await page.locator('.da-pin').filter({hasText:/^II$/}).isVisible(),false,'unsupported papillary lead not selectable');
  await page.locator('[data-nom="bundles"]').click();const right=await trace('V1');
  await page.locator('[data-da-bundle="left"]').click();assert.notEqual(await trace('V1'),right);
  await section('atrial');
  assert.equal(await page.locator('.da-pin').filter({hasText:/^V2$/}).isVisible(),false,'unsupported atrial lead hidden');
  await page.locator('.da-pin').filter({hasText:/^II$/}).waitFor({state:'visible'});
  assert.equal(await page.locator('.da-pin').filter({hasText:/^II$/}).isVisible(),true,'atrial II strip has matching direction');
  for(const site of ['RSPV','RIPV','LSPV','LIPV','RAA','LAA']){await page.locator(`[data-pv="${site}"]`).click();assert.match(await page.locator('.da-reading').textContent(),new RegExp(site));}
  assert.match(await page.locator('[data-da-lead="aVL"] .da-strip-sign').textContent(),/P negatif/);
  await page.locator('[data-pv="RAA"]').click();assert.match(await page.locator('[data-da-lead="V1"] .da-strip-sign').textContent(),/P negatif/);
  await page.locator('[data-ecg-lang="en"]').click();await page.locator('.da-atlas[data-loaded=true]').waitFor();
  assert.equal(await page.locator('[data-pv="RAA"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('.da-evidence-main').textContent(),/right atrial appendage/i);
  await section('icns');assert.equal(await page.locator('[data-sgp]').count(),8);await page.locator('[data-sgp="ldsgp"]').click();assert.equal(await page.locator('.davinci-content>.davinci-card').count(),1);
  await page.setViewportSize({width:390,height:844});
  for(const tab of ['cabrera','heights','nomenclature','atrial','icns']){await section(tab);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`mobile overflow ${tab}`);}
  await section('cabrera');await page.locator('.da-workbench').screenshot({path:'/tmp/davinci-v2-mobile.png'});
  // Native tab keyboard navigation covers all five source sections.
  await page.locator('[data-davinci-section="cabrera"]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[data-davinci-section="icns"]').getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
  console.log('PASS Da Vinci browser: real atlas load/orbit, source-based controls, A/B comparison, aVR selection, P/ST changes, height/site relations, papillary and bundle patterns, all six atrial sites, keyboard focus, TR/EN retention, ICNS and five mobile views');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
