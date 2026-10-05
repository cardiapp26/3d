import assert from 'node:assert/strict';
import {ecgTiming,ecgSample,generateEcgPoints} from '../src/ecg/guyton-render.js';
import {CHEST_LEADS,projectLead,axisCategory,reentryMetrics,ringSnapshot,stepProjections,RHYTHM_EXAMPLES,rhythmEvents,rhythmSample} from '../src/ecg/ecg-lab-model.js';
import {GUYTON_TOPICS} from '../src/ecg/guyton-data.js';
for(const qrs of [.08,.12,.16])for(const pxPerSec of [100,200]){
 const opts={qrs,qt:.38,pxPerSec},t=ecgTiming(opts);
 assert.ok(Math.abs(t.j-t.q-qrs)<1e-12);assert.ok(Math.abs(t.tEnd-t.q-.38)<1e-12);
 const pts=generateEcgPoints(600,opts);assert.ok(pts.every((p,i)=>Number.isFinite(p.mv)&&(!i||p.x>=pts[i-1].x)));
 assert.ok(Math.abs(ecgSample(t.q+qrs*.35,opts)-1.25)<1e-10);
 assert.ok(Math.abs(ecgSample(t.j+.01,{...opts,stElev:.25})-.25)<1e-10);
}
assert.ok(Math.abs(ecgSample(.5999,{rate:100})-ecgSample(.6001,{rate:100}))<.01,'T remains continuous across RR boundary');
assert.ok(ecgSample(.61,{rate:100})>.1,'prior-beat T tail retained');
const stopped=reentryMetrics(12,40,600,true);assert.equal(ringSnapshot(stopped,1000,600,true).tail,0);assert.equal(ringSnapshot(stopped,1000,600,true).head,false);assert.equal(ringSnapshot(stopped,500,600,false).collision,false);
for(const a of [-180,-90,-30,-15,0,59,90,120,180])assert.ok(Math.abs(projectLead(a,1,0)+projectLead(a,1,120)-projectLead(a,1,60))<1e-12);
assert.equal(axisCategory(-15),'normal');assert.equal(axisCategory(-50),'left');assert.equal(axisCategory(105),'right');assert.equal(axisCategory(-120),'extreme');
for(const step of GUYTON_TOPICS[2].vectors){const p=stepProjections(step);assert.ok(Math.abs(p.lead1+p.lead3-p.lead2)<1e-12);}
assert.equal(CHEST_LEADS.length,6);assert.equal(CHEST_LEADS[3].y,CHEST_LEADS[4].y);assert.equal(CHEST_LEADS[4].y,CHEST_LEADS[5].y);assert.ok(CHEST_LEADS[0].x<CHEST_LEADS[1].x);
assert.deepEqual(reentryMetrics(12,40,250,true),{wavelengthCm:10,loopMs:300,gapCm:2,possible:true});assert.equal(reentryMetrics(12,40,300,true).possible,false);assert.equal(reentryMetrics(12,40,250,false).possible,false);assert.throws(()=>reentryMetrics(0,40,250,true),RangeError);
for(const r of RHYTHM_EXAMPLES)for(let i=0;i<1200;i++)assert.ok(Number.isFinite(rhythmSample(i/200,r.id)));
const w=rhythmEvents('wenckebach');assert.equal(w.p.length,8);assert.equal(w.q.length,6);assert.deepEqual(w.q.slice(0,3).map((b,i)=>Math.round((b.at-w.p[i])*1000)),[160,200,240]);
assert.equal(rhythmEvents('af').p.length,0);const af=rhythmEvents('af').q.map(b=>b.at);assert.ok(new Set(af.slice(1).map((at,i)=>(at-af[i]).toFixed(2))).size>3);
const pvc=rhythmEvents('pvc').q;assert.ok(Math.abs(pvc[4].at-pvc[2].at-1.6)<1e-12);assert.ok(pvc[3].width>pvc[2].width);
console.log('PASS ECG labs: physical QRS/QT timing, sorted strips, projection identity, axis boundaries, chest placement, reentry units/gap/block, seven finite rhythm examples and AV/PVC/AF patterns');
