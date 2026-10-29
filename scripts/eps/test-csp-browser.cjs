// CSP / LBBAP laboratory inside the EPS page (#/csp): the implant console (sheath torque, RAO drag,
// turns from the keyboard, live threshold test, acceptance) and the kept analysis, blind and log pages.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const APP=(process.env.EPS_URL || `${(process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')}/eps`).replace(/\/$/, '');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${APP}/?lang=tr#/csp`);await page.evaluate(()=>localStorage.removeItem('cardia.csp.prototype.history.v1'));await page.reload();await page.locator('[data-csp]').waitFor({state:'visible'});
  const csp=fn=>page.evaluate(fn);
  const set=async(key,value)=>page.locator(`[data-csp-control=${key}]`).evaluate((n,v)=>{n.value=String(v);n.dispatchEvent(new Event(n.tagName==='SELECT'?'change':'input',{bubbles:true}));},value);
  const state=()=>csp(()=>{const s=window.epsLab.panel.csp.getState();delete s.liveTime;return s;});
  const capture=()=>csp(()=>window.epsLab.panel.csp.getResult().capture.type);
  const criterion=id=>page.locator(`[data-csp-criterion=${id}]`).getAttribute('data-status');

  // 1. Start on the free wall: wide QRS and the guidance to torque counter-clockwise.
  assert.equal(await capture(),'rv');
  assert.match(await page.locator('[data-csp-guide]').textContent(),/serbest duvar/);
  for(let i=0;i<10;i++)await page.locator('[data-csp-torque=ccw]').click();
  assert.equal((await state()).procedure.sheath,0);
  // 2. RAO: drag the tip along the His-apex line to about 30 % (21 mm from the His).
  await page.locator('[data-csp-anatomy]').scrollIntoViewIfNeeded();const box=await page.locator('[data-csp-anatomy]').boundingBox();
  const at=f=>[box.x+box.width*(.36+.38*f),box.y+box.height*(.3+.5*f)];
  await page.mouse.move(...at(.6));await page.mouse.down();await page.mouse.move(...at(.45),{steps:4});await page.mouse.move(...at(.3),{steps:4});await page.mouse.up();
  assert.ok(Math.abs((await state()).procedure.level-.3)<.03,'dragged level');
  assert.match(await page.locator('[data-csp-guide]').textContent(),/Pace map uygun/);
  // 3. Eight turns from the keyboard; the live recording runs.
  await page.locator('[data-csp-live]').click();
  await page.keyboard.press('r');
  const spinning=await state();assert.equal(spinning.spin.active,true);assert.equal(spinning.spin.pacingPaused,true,'lumenless lead: pacing paused while turning');
  assert.equal(spinning.procedure.turns,1,'the turn is applied at once');assert.equal(await page.locator('[data-csp-rotate="1"]').isEnabled(),true,'more turns can be queued');
  assert.match(await page.locator('[data-csp-guide]').textContent(),/pacing duraklatıldı/);
  for(let i=0;i<7;i++)await page.keyboard.press('r');
  assert.equal((await state()).spin.queued,7,'seven turns wait in the queue');
  await csp(()=>window.epsLab.panel.csp.tick(8*1000+1000));
  assert.equal((await state()).spin.active,false);assert.equal((await state()).spin.queued,0);
  assert.equal((await state()).procedure.turns,8);assert.equal(await capture(),'nonselective');
  assert.equal(await criterion('v6Rwpt'),'met');assert.equal(await criterion('interpeak'),'met');assert.equal(await criterion('transition'),'untested');
  await page.locator('[data-csp-torque=ccw]').isDisabled().then(v=>assert.equal(v,true,'sheath locked once screwed in'));
  await page.locator('[data-csp-rotate="3"]').isDisabled().then(v=>assert.equal(v,true,'no triple turn from the LV septum'));
  await page.locator('[data-csp-accept]').click();assert.match(await page.locator('[data-csp-log]').textContent(),/Kabul edilemez: eşik ölçülmedi/);
  assert.equal((await state()).trend.length,8,'one trend point per turn');
  assert.equal(await page.locator('[data-csp-coach-item=runThreshold]').count(),1,'coaching asks for the threshold test');
  assert.ok((await page.locator('[data-csp-trends]').boundingBox()).height>100,'trend charts drawn');
  const t0=await csp(()=>window.epsLab.panel.csp.getState().liveTime);await page.waitForTimeout(300);
  assert.ok(await csp(()=>window.epsLab.panel.csp.getState().liveTime)>t0,'live sweep runs');
  // 4. Live threshold test (fast-forwarded), then accept.
  await page.locator('[data-csp-test=threshold]').click();await csp(()=>window.epsLab.panel.csp.tick(60000));
  assert.equal(await csp(()=>window.epsLab.panel.csp.getTest().done),true);
  assert.equal(await criterion('transition'),'met');assert.match(await page.locator('[data-csp-log]').textContent(),/Eşik testi bitti/);
  await page.locator('[data-csp-accept]').click();
  assert.match(await page.locator('[data-csp-summary]').textContent(),/Sol dal alanı pacing/);
  // 4b. Finish: R wave with pacing off, withdraw, slit, deep breath; score and the follow-up clinic.
  assert.equal(await page.locator('[data-csp-finish]').isVisible(),true);
  await page.locator('[data-csp-pacing]').click();await page.locator('[data-csp-pacing]').click();
  assert.ok((await state()).procedure.rWave>4);assert.match(await page.locator('[data-csp-readouts]').textContent(),/R dalgası/);
  assert.equal(await page.locator('[data-csp-finish-step=slit]').isDisabled(),true,'slit waits for the withdrawal');
  await page.locator('[data-csp-finish-step=withdraw]').click();assert.match(await page.locator('[data-csp-log]').textContent(),/Kılıf çekildi: unipolar/);
  await page.locator('[data-csp-finish-step=slit]').click();await page.locator('[data-csp-finish-step=breath]').click();
  assert.match(await page.locator('[data-csp-guide]').textContent(),/Olgu tamam/);
  await page.locator('[data-csp-finish-case]').click();
  assert.match(await page.locator('[data-csp-score]').textContent(),/Puan \(öğretim amaçlı\): \d+ \/ 100/);
  assert.equal(await page.locator('[data-csp-score-item=proof][data-ok=true]').count(),1);
  await page.locator('[data-csp-visit=week6]').click();assert.match(await page.locator('[data-csp-clinic-readings]').textContent(),/Cihaz eşiği/);
  await page.locator('[data-csp-q1=conduction]').click();await page.locator('[data-csp-q2=keep]').click();await page.locator('[data-csp-clinic-check]').click();
  assert.match(await page.locator('[data-csp-clinic-feedback]').textContent(),/Doğru|Yanlış/);
  // 5. Freeze stops the sweep; a hidden panel stops it too.
  await page.locator('[data-csp-play]').click();const frozen=await csp(()=>window.epsLab.panel.csp.getState().liveTime);
  await page.waitForTimeout(150);assert.equal(await csp(()=>window.epsLab.panel.csp.getState().liveTime),frozen,'freeze');
  await page.locator('[data-csp-play]').click();
  await csp(()=>window.epsLab.panel.csp.setActive(false));const paused=await csp(()=>window.epsLab.panel.csp.getState().liveTime);
  await page.waitForTimeout(150);assert.equal(await csp(()=>window.epsLab.panel.csp.getState().liveTime),paused,'hidden panel stops animation');await csp(()=>window.epsLab.panel.csp.setActive(true));

  // 6. Analysis: output transitions, pinned reference, threshold rows, calipers.
  await page.locator('[data-csp-page=analysis]').click();
  await page.locator('[data-csp-reference]').click();const ref=await csp(()=>window.epsLab.panel.csp.getReference().leads.V6);
  await set('output',.7);assert.equal(await capture(),'selective');assert.deepEqual(await csp(()=>window.epsLab.panel.csp.getReference().leads.V6),ref,'pinned reference survives settings');
  await set('output',.1);assert.equal(await capture(),'none');await set('output',2);
  await set('pulseWidth',.2);assert.equal((await state()).pulseWidth,.2);await set('pulseWidth',.4);
  await page.locator('[data-csp-test=sweep]').click();assert.equal(await page.locator('[data-csp-row]').count(),33);
  await page.locator('[data-csp-row="29"]').click();assert.equal(await capture(),'selective','test row controls actual acquired beat');
  await page.locator('[data-csp-caliper]').click();await page.locator('[data-csp-time]').evaluate(n=>{n.value='50';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[data-csp-mark]').click();await page.locator('[data-csp-time]').evaluate(n=>{n.value='120';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('[data-csp-mark]').click();
  assert.equal(await page.locator('[data-csp-caliper-value]').textContent(),'Δt = 70 ms');
  const before=await state();await page.locator('[data-app-lang-option=en]').click();assert.deepEqual(await state(),before,'language preserves settings, test and measurements');
  assert.equal(await page.locator('[data-csp] h2').textContent(),'CSP / LBBAP Laboratory');
  await set('angle',20);assert.equal(await page.locator('[data-csp-row]').count(),0);assert.deepEqual((await state()).ui.marks,[]);

  // 7. S1-S2 on the slow-conduction case at the classic deep septal position.
  await page.locator('[data-csp-page=implant]').click();await page.locator('[data-csp-reset]').click();await set('caseId','slow');
  await set('level',.32);await set('angle',8);await set('depth',.88);
  await page.locator('[data-csp-test=s2]').click();assert.equal(await page.locator('[data-csp-row]').count(),28);
  await page.locator('[data-csp-row="17"]').click();assert.equal((await state()).s2,280);assert.equal(await capture(),'lvsp');

  // 8. Blind assessment, reveal, clearing.
  await page.locator('[data-csp-page=quiz]').click();assert.equal(await page.locator('[data-csp-truth]').isVisible(),false);assert.equal(await page.locator('[data-csp-control=caseId]').isVisible(),false);
  assert.equal((await state()).ui.projection,'rao');
  await page.locator('[data-csp-answer=lvsp]').click();assert.match(await page.locator('[data-csp-feedback]').textContent(),/Correct/);
  await page.locator('[data-csp-reveal]').click();
  await page.locator('[data-csp-page=implant]').click();assert.equal(await page.locator('[data-csp-truth]').isVisible(),true,'revealed truth on the implant page');
  await page.locator('[data-csp-page=quiz]').click();await page.locator('[data-csp-reveal]').click();
  await page.getByRole('button',{name:'Clear test',exact:true}).click();assert.equal((await state()).ui.revealed,false);assert.equal((await state()).ui.answer,null);assert.deepEqual((await state()).ui.marks,[]);assert.equal((await state()).s2,null);assert.equal(await csp(()=>window.epsLab.panel.csp.getReference()),null);

  // 9. Case log survives a reload; perforation warns.
  await page.locator('[data-csp-page=history]').click();await page.locator('[data-csp-save]').click();assert.equal(await csp(()=>window.epsLab.panel.csp.getHistory().length),1);
  await page.reload();await page.locator('[data-csp]').waitFor({state:'visible'});assert.equal(await csp(()=>window.epsLab.panel.csp.getHistory().length),1);
  await set('angle',8);await set('depth',1.1);assert.equal(await capture(),'perforation');assert.notEqual(await page.locator('[data-csp-warning]').textContent(),'');
  assert.match(await page.locator('[data-csp-guide]').textContent(),/Perforasyon|Perforation/);

  // 9b. Trap case: LBB threshold above the muscle threshold refuses acceptance until the output margin is set.
  await page.locator('[data-csp-page=implant]').click();await set('caseId','lbbHigh');
  await csp(()=>{const p=window.epsLab.panel.csp;for(let i=0;i<10;i++)p.act({type:'torque',delta:5});p.act({type:'site',level:.3});for(let i=0;i<8;i++)p.act({type:'rotate',turns:1});});
  await page.locator('[data-csp-test=threshold]').click();await csp(()=>window.epsLab.panel.csp.tick(60000));
  assert.match(await page.locator('[data-csp-log]').textContent(),/nonselektif → LV septal/);
  await page.locator('[data-csp-accept]').click();assert.match(await page.locator('[data-csp-log]').textContent(),/çıkış eşiğin 2 katından az/);
  await set('output',3.5);await page.locator('[data-csp-accept]').click();assert.match(await page.locator('[data-csp-summary]').textContent(),/Sol dal alanı pacing/);
  await csp(()=>window.epsLab.panel.csp.loadCase('random',7));const seeded=(await state()).procedure;assert.equal(seeded.seed,7);assert.ok(seeded.params&&seeded.anatomy);
  await page.locator('[data-csp-reseed]').click();assert.notEqual((await state()).procedure.seed,7,'a new patient has a new seed');
  // 9c. Fusion: the coaching flags it until the pacing rate rises; the bump case logs the complication.
  await set('caseId','fusion');assert.equal(await page.locator('[data-csp-coach-item=fusion]').count(),1);assert.match(await page.locator('[data-csp-guide]').textContent(),/Füzyon/);
  await set('rate',110);assert.equal((await state()).rate,110);assert.equal(await page.locator('[data-csp-coach-item=fusion]').count(),0,'rate 110 removes fusion');
  await set('caseId','bump');await csp(()=>{const p=window.epsLab.panel.csp;for(let i=0;i<10;i++)p.act({type:'torque',delta:5});p.act({type:'site',level:.2});p.act({type:'rotate',turns:1});});
  assert.match(await page.locator('[data-csp-log]').textContent(),/sağ dal travması/);assert.equal(await page.locator('[data-csp-coach-item=bumped]').count(),1);
  await page.locator('[data-csp-pacing]').click();assert.match(await page.locator('[data-csp-guide]').textContent(),/Pacing’i aç/);await page.locator('[data-csp-pacing]').click();

  // 4c. Fluoroscopy: holding the button screens (timer runs), contrast puffs, the heart and lead are chosen before fixation.
  await page.locator('[data-csp-reset]').click();
  const f0=(await state()).fluoro.seconds;const fb=await page.locator('[data-csp-fluoro]').boundingBox();
  await page.mouse.move(fb.x+fb.width/2,fb.y+fb.height/2);await page.mouse.down();await page.waitForTimeout(600);
  assert.equal((await state()).fluoro.live,true);await page.mouse.up();
  assert.ok((await state()).fluoro.seconds>f0+.3,'fluoro timer counts while screening');
  await page.locator('[data-csp-auto-fluoro]').uncheck();await page.waitForTimeout(1700);assert.equal((await state()).fluoro.live,false,'last image hold');
  await page.locator('[data-csp-contrast]').click();assert.ok((await state()).fluoro.contrast>.5);await page.locator('[data-csp-auto-fluoro]').check();
  await set('heart','vertical');assert.equal((await state()).procedure.heart,'vertical');
  await set('lead','stylet');assert.equal(await page.locator('[data-csp-support]').isVisible(),true);
  await page.locator('[data-csp-support]').uncheck();assert.equal((await state()).procedure.forwardSupport,false);
  await set('lead','lumenless');await set('heart','compact');
  // 10. Phone width, direct route, storage failure.
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('[data-csp]').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,'mobile no horizontal overflow in the CSP panel');
  assert.equal(await csp(()=>window.epsLab.panel.getActiveView()),'csp','direct #/csp route');
  await page.evaluate(async()=>{
   const { createCspPanel } = await import('/src/eps/csp/csp-panel.mjs');
   window.testStorage=createCspPanel(document,{getLang:()=> 'en',storage:{getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}}});
   document.body.append(window.testStorage.element);window.testStorage.setActive(true);
   window.testStorage.element.querySelector('[data-csp-page=history]').click();window.testStorage.element.querySelector('[data-csp-save]').click();
  });
  assert.equal(await csp(()=>window.testStorage.getHistory().length),1,'storage failure keeps session record');
  assert.match(await csp(()=>window.testStorage.element.textContent),/Persistent storage unavailable/);
  assert.deepEqual(errors,[]);
  console.log('PASS csp-browser (EPS #/csp): free-wall start, sheath torque, RAO drag, keyboard turns, live criteria, live threshold test, accept summary, freeze and hidden stop; analysis transitions, reference, rows, calipers, TR/EN, S1-S2, blind reveal, history reload/failure, perforation, 390px layout; no page errors');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
