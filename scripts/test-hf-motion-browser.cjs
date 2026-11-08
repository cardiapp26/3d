// Every animated pathophysiology station moves while playing and freezes when paused. Stations on the
// shared cycle clock (cycle-clock.js) redraw their SVG each frame; older ones move CSS particles
// (.hf-live-particle). The first play/pause button of a station drives the section it sits in.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {startApp}=require('./lib/app-server.cjs');
const assert=require('node:assert/strict');

const STATIONS=['heart-failure','pericardial','myocardial-ckm','forrester','ischemic-cascade','atherogenesis','pv-loop','starling-laplace','valvular','electrophys','hypertension-vascular','pah-rv','achd-shunts'];

/** Snapshot of the moving parts in the toggle's section: CSS particle position, else the SVG markup. */
const snapshot=page=>page.evaluate(()=>{
  const toggle=document.querySelector('[data-motion-toggle]');
  // The bar can sit in a toolbar beside the stage (electrophysiology): climb to the box that holds the drawing.
  let scope=toggle.closest('.pathophys-motion-bar').parentElement;
  while(scope.parentElement&&!scope.querySelector('svg, .hf-live-particle'))scope=scope.parentElement;
  const particle=scope.querySelector('.hf-live-particle')||document.querySelector('.hf-live-particle');
  const r=particle?.getBoundingClientRect();
  return {kind:particle?'particle':'svg',x:r?.x??0,y:r?.y??0,markup:[...scope.querySelectorAll('svg')].map(s=>s.outerHTML).join('')};
});
const moved=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)>4||a.markup!==b.markup;

(async()=>{
  const app=await startApp();
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:950}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const station of STATIONS){
      await page.goto(`${app.url}/pathophysiology/?lang=en#${station}`);
      const toggle=page.locator('[data-motion-toggle]').first();
      await toggle.waitFor();
      if((await toggle.getAttribute('aria-pressed'))==='false'||/Play|Oynat/.test(await toggle.textContent()))await toggle.click();
      const a=await snapshot(page);await page.waitForTimeout(380);const b=await snapshot(page);
      assert.ok(moved(a,b),`${station}: moves while playing (${a.kind})`);
      await toggle.click();await page.waitForTimeout(120);
      const c=await snapshot(page);await page.waitForTimeout(260);const d=await snapshot(page);
      assert.ok(!moved(c,d),`${station}: frozen when paused (${c.kind})`);
      console.log(`PASS ${station}: moves and pauses (${a.kind})`);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
