// ECG chapter labs in the browser: Cell, Recording and QT tabs open from the left panel and by
// ?lesson=, their controls change the readouts, canvases are drawn, TR/EN switches and phones fit.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const APP=(process.env.APP_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${APP}/ecg/?lang=tr`);
  await page.locator('[data-chapter-tab="cell"]').waitFor();
  const painted=sel=>page.locator(sel).evaluate(c=>{const ctx=c.getContext('2d');const d=ctx.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4*97)if(d[i]+d[i+1]+d[i+2]>60)n++;return c.width>0&&n>20;});
  // Cell: epicardial at 1000 ms, then the M cell is longer and a sodium block slows the upstroke.
  await page.locator('[data-chapter-tab="cell"]').click();
  await page.locator('[data-ecg-chapter="cell"]').waitFor();
  assert.equal(await page.locator('[data-chapter-tab="cell"]').getAttribute('aria-selected'),'true');
  const readout=async i=>Number((await page.locator('[data-cell-readouts] .ecgc-qt-cell strong').nth(i).textContent()).replace(/[^\d-]/g,''));
  await page.waitForFunction(()=>document.querySelector('[data-cell-readouts] .ecgc-qt-cell'));
  const apd90=await readout(4);assert.ok(apd90>255&&apd90<285,`epi APD90 ${apd90}`);
  await page.locator('[data-cell="mid"]').click();await page.waitForTimeout(150);
  assert.ok(await readout(4)>apd90+100,'M cell longer');
  const dvdt=await readout(2);
  await page.locator('[data-cell-fi]').evaluate(n=>{n.value='25';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(250);
  assert.ok(await readout(2)<dvdt/2,'sodium block slows the upstroke');
  for(const sel of ['[data-cell-ap]','[data-cell-restitution]','[data-cell-currents]'])assert.ok(await painted(sel),sel);
  // Recording: LA-RA reversal explained; a 0.5 Hz filter and artifacts redraw; settings survive a tab round trip.
  await page.locator('[data-chapter-tab="recording"]').click();
  await page.locator('[data-ecg-chapter="recording"]').waitFor();
  await page.locator('[data-reversal="la-ra"]').click();
  await page.waitForFunction(()=>/Kol kabloları ters/.test(document.querySelector('[data-rec-explain]')?.textContent||''));
  await page.locator('[data-reversal="ra-rl"]').click();
  await page.waitForFunction(()=>/düz çizgi/.test(document.querySelector('[data-rec-explain]')?.textContent||''));
  await page.locator('[data-hp="0.5"]').click();await page.locator('[data-rec-tremor]').check();await page.locator('[data-rec-mains]').check();
  for(const sel of ['[data-rec-page]','[data-rec-beat]'])assert.ok(await painted(sel),sel);
  await page.locator('[data-chapter-tab="qt"]').click();await page.locator('[data-chapter-tab="recording"]').click();
  assert.equal(await page.locator('[data-reversal="ra-rl"]').getAttribute('aria-pressed'),'true','lab state kept');
  // QT: at 120/min Bazett reads long for a QT of 430 at 60/min, Fridericia does not; the U wave lengthens the threshold QT.
  await page.goto(`${APP}/ecg/?lang=tr&lesson=qt`);
  await page.locator('[data-ecg-chapter="qt"]').waitFor();
  await page.locator('[data-qt-qt60]').evaluate(n=>{n.value='430';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[data-qt-hr]').evaluate(n=>{n.value='120';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForTimeout(200);
  await page.waitForFunction(()=>/Bazett/.test(document.querySelector('[data-qt-table]')?.textContent||''));
  const cell=k=>page.locator('[data-qt-table] .ecgc-qt-cell').filter({hasText:k});
  assert.equal(await cell('QTc Bazett').getAttribute('data-grade'),'long');assert.equal(await cell('QTc Fridericia').getAttribute('data-grade'),'normal');
  await page.locator('[data-qt-hr]').evaluate(n=>{n.value='60';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[data-lead="V3"]').click();await page.locator('[data-qt-u]').check();await page.locator('[data-method="threshold"]').click();
  await page.waitForTimeout(200);
  const thr=Number((await cell('Ölçülen QT').locator('strong').textContent()).replace(/\D/g,''));
  await page.locator('[data-method="tangent"]').click();await page.waitForTimeout(200);
  const tan=Number((await cell('Ölçülen QT').locator('strong').textContent()).replace(/\D/g,''));
  assert.ok(thr>tan+30,`U wave: threshold ${thr} vs tangent ${tan}`);
  for(const sel of ['[data-qt-beat]','[data-qt-plot]'])assert.ok(await painted(sel),sel);
  // Atrial abnormality: left enlargement meets the left criteria, right enlargement the right ones.
  await page.goto(`${APP}/ecg/?lang=tr&lesson=atria`);await page.locator('[data-ecg-chapter="atria"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-atria-criteria] [data-group]'));
  assert.equal(await page.locator('[data-atria-criteria] [data-group="left"]').getAttribute('data-met'),'true');
  await page.locator('[data-atria="right"]').click();await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-atria-criteria] [data-group="right"]').getAttribute('data-met'),'true');
  assert.equal(await page.locator('[data-atria-criteria] [data-group="left"]').getAttribute('data-met'),'false');
  assert.ok(await painted('[data-atria-beat]'));
  // Hypertrophy: 9 mm meets nothing, 18 mm meets Sokolow and Peguero; RV 10 mm meets the RVH criteria.
  await page.locator('[data-chapter-tab="hypertrophy"]').click();await page.locator('[data-ecg-chapter="hypertrophy"]').waitFor();
  const setRange=async(sel,v)=>page.locator(sel).evaluate((n,x)=>{n.value=String(x);n.dispatchEvent(new Event('input',{bubbles:true}));},v);
  await setRange('[data-hyp-lv]',9);await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-hyp-criteria] [data-met="true"]').count(),0);
  await setRange('[data-hyp-lv]',18);await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-hyp-criteria] [data-criterion="sokolow"]').getAttribute('data-met'),'true');
  assert.equal(await page.locator('[data-hyp-criteria] [data-criterion="peguero"]').getAttribute('data-met'),'true');
  await setRange('[data-hyp-lv]',9);await setRange('[data-hyp-rv]',10);await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-hyp-criteria] [data-criterion="rvh"]').getAttribute('data-met'),'true');
  assert.ok(await painted('[data-hyp-page]'));
  // Pacing: the NBG code follows the mode; faults and lead positions change the explanation and the paced beat.
  await page.locator('[data-chapter-tab="pacing"]').click();await page.locator('[data-ecg-chapter="pacing"]').waitFor();
  await page.locator('[data-mode="DDD"]').click();
  assert.equal((await page.locator('[data-pacing-nbg] strong').allTextContents()).slice(0,3).join(''),'DDD');
  await page.locator('[data-fault="oversensing"]').click();
  await page.waitForFunction(()=>/Fazla algılama/.test(document.querySelector('[data-pacing-explain]')?.textContent||''));
  await page.locator('[data-site="lbbap"]').click();await page.waitForTimeout(200);
  assert.match(await page.locator('[data-pacing-readouts]').textContent(),/pozitif/);
  await page.locator('[data-site="rvApex"]').click();await page.waitForTimeout(200);
  assert.match(await page.locator('[data-pacing-readouts]').textContent(),/negatif/);
  for(const sel of ['[data-pacing-strip]','[data-pacing-beat]'])assert.ok(await painted(sel),sel);
  // Ashman: classic long-short gives RBBB, a short preceding cycle narrows it, presets and AF mode work.
  await page.locator('[data-chapter-tab="ashman"]').click();await page.locator('[data-ecg-chapter="ashman"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-ash-pattern]'));
  assert.equal(await page.locator('[data-ash-pattern]').getAttribute('data-ash-pattern'),'rbbb');
  assert.match(await page.locator('[data-ash-explain]').textContent(),/Ashman/);
  await setRange('[data-ash-cycle]',600);await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-ash-pattern]').getAttribute('data-ash-pattern'),'normal','short preceding cycle: narrow');
  assert.ok(Number(await page.locator('[data-ash-coupling]').getAttribute('max'))<=590,'coupling stays shorter than the cycle');
  await page.locator('[data-ash-preset="blocked"]').click();await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-ash-pattern]').getAttribute('data-ash-pattern'),'blocked-avn');
  await page.locator('[data-ash-preset="lafb"]').click();await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-ash-pattern]').getAttribute('data-ash-pattern'),'rbbb-lafb');
  assert.match(await page.locator('[data-ash-status]').textContent(),/refrakter/);
  assert.equal(await page.locator('[data-ash-clues] .ecgc-crit-group').first().getAttribute('data-met'),'true');
  for(const sel of ['[data-ash-strip]','[data-ash-bars]','[data-ash-map]'])assert.ok(await painted(sel),sel);
  // The heart is the 3D atlas once it loads (the 2D section stands in until then).
  await page.waitForFunction(()=>document.querySelector('[data-ash-heart]')?.dataset.loaded!=='false',null,{timeout:60000});
  assert.equal(await page.locator('[data-ash-heart]').getAttribute('data-loaded'),'true','atlas heart loads');
  const gl=await page.locator('[data-ash-heart] .ash-3d-gl canvas').evaluate(c=>({w:c.width,h:c.height}));
  assert.ok(gl.w>100&&gl.h>100,'3D canvas sized');
  const pins=await page.locator('[data-ash-heart] .ash-3d-pin:not([hidden])').allTextContents();
  for(const name of ['AV nod','His','Sağ dal','Sol dal','LAF','LPF'])assert.ok(pins.includes(name),`pin ${name}`);
  await page.locator('[data-ash-mode="af"]').click();await page.waitForTimeout(250);
  assert.match(await page.locator('[data-ash-explain]').textContent(),/linking/);
  const before=await page.locator('[data-ash-cells]').textContent();
  await page.locator('[data-ash-reseed]').click();await page.waitForTimeout(250);
  assert.notEqual(await page.locator('[data-ash-cells]').textContent(),before,'new AF strip');
  for(const sel of ['[data-ash-strip]','[data-ash-tach]'])assert.ok(await painted(sel),sel);
  await page.locator('[data-chapter-tab="pacing"]').click();await page.locator('[data-ecg-chapter="pacing"]').waitFor();
  // English, then a phone.
  await page.locator('[data-ecg-lang="en"]').click();
  await page.waitForFunction(()=>/Pacing: code/.test(document.querySelector('[data-ecg-chapter="pacing"]')?.textContent||''));
  assert.match(await page.locator('[data-chapter-tab="recording"]').textContent(),/Recording/);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-ecg-chapter="pacing"]').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,'no horizontal overflow on a phone');
  assert.deepEqual(errors,[]);
  console.log('PASS ecg chapters browser: Cell, Recording, QT, Atrial abnormality, Hypertrophy criteria, Ashman (long-short, presets, AF), Pacing (NBG, faults, lead position), TR/EN, 390px; no page errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
