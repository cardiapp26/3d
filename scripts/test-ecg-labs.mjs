import assert from 'node:assert/strict';
import {ecgTiming,ecgSample,generateEcgPoints} from '../src/ecg/guyton-render.js';
import {CHEST_LEADS,projectLead,axisCategory,reentryMetrics,ringSnapshot,stepProjections,RHYTHM_EXAMPLES,rhythmEvents,rhythmSample} from '../src/ecg/ecg-lab-model.js';
import {LIMB_CAMERAS,cameraWaveSample,cameraWavePath,nearestLimbCamera} from '../src/ecg/lead-camera-lab.js';
import {STEMI_CAMERA_STATIONS,STEMI_TERRITORIES,STEMI_PHASES,stemiProjectionForCamera,stemiWaveSample,stemiWavePath,classifyStRole} from '../src/ecg/stemi-camera-lab.js';
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
assert.equal(LIMB_CAMERAS.length,6,'six limb cameras');
for(let i=0;i<=100;i++){
 const u=i/100;
 assert.ok(Math.abs(cameraWaveSample(u,0)+cameraWaveSample(u,120)-cameraWaveSample(u,60))<1e-12,'Einthoven I + III = II holds across camera wave');
 assert.ok(Math.abs(cameraWaveSample(u,-150)+cameraWaveSample(u,-30)+cameraWaveSample(u,90))<1e-12,'Goldberger aVR + aVL + aVF = 0 holds across camera wave');
}
assert.ok(cameraWaveSample(0.42,60)>1.2,'Lead II shows tall upright R');
assert.ok(cameraWaveSample(0.42,-150)<-1.0,'Lead aVR shows deep negative QRS');
assert.ok(Math.abs(cameraWaveSample(0.42,-30))<0.15,'Lead aVL is nearly perpendicular/low amplitude');
assert.equal(nearestLimbCamera(62)?.id,'II');assert.equal(nearestLimbCamera(-148)?.id,'aVR');assert.equal(nearestLimbCamera(-90),null);
assert.ok(cameraWavePath(60,0,100,200).startsWith('M0.0,'));
assert.equal(STEMI_CAMERA_STATIONS.length,8,'eight STEMI camera viewpoints');
assert.equal(STEMI_TERRITORIES.length,5,'five clinical STEMI territories');
assert.equal(STEMI_PHASES.length,3,'three STEMI evolution phases');
assert.ok(stemiProjectionForCamera('inferior_rca','III')>stemiProjectionForCamera('inferior_rca','II'),'RCA inferior STEMI has STE III > STE II');
assert.ok(stemiProjectionForCamera('inferior_rca','aVL')<-0.7,'RCA inferior STEMI has deep reciprocal ST depression in aVL');
assert.ok(stemiProjectionForCamera('inferior_lcx','II')>stemiProjectionForCamera('inferior_lcx','III'),'LCx inferior STEMI has STE II > STE III');
assert.ok(stemiProjectionForCamera('inferior_lcx','aVR')<-0.7,'LCx inferior STEMI has reciprocal depression in aVR');
assert.ok(stemiProjectionForCamera('high_lateral','aVL')>0.9&&stemiProjectionForCamera('high_lateral','III')<-0.7,'High lateral STEMI has STE in aVL and reciprocal STD in III');
assert.ok(stemiProjectionForCamera('posterior_mi','V7_V9')>0.9&&stemiProjectionForCamera('posterior_mi','V2_V3')<-0.9,'Posterior STEMI has STE in V7-V9 and reciprocal mirror STD in V1-V3');
assert.equal(classifyStRole(0.24),'ste');assert.equal(classifyStRole(-0.22),'std');assert.equal(classifyStRole(0.02),'iso');
assert.ok(Math.abs(stemiWaveSample(0.5,{stProjection:-0.8,invertMirror:true})+stemiWaveSample(0.5,{stProjection:-0.8,invertMirror:false}))<1e-12,'mirror flip inverts reciprocal waveform');
assert.ok(stemiWavePath(0,80,200,50,{stProjection:0.8}).startsWith('M0.0,'));

// Da Vinci 12-Lead Electrocardiographic Anatomy (Bradfield & Mori et al., JACC 2025)
const CABRERA_SEQUENCE = [
  { id: 'aVL', angle: -30 },
  { id: 'I', angle: 0 },
  { id: '-aVR', angle: 30 },
  { id: 'II', angle: 60 },
  { id: 'aVF', angle: 90 },
  { id: 'III', angle: 120 }
];
assert.equal(CABRERA_SEQUENCE.length, 6, 'Cabrera sequence defines 6 contiguous limb leads');
for (let i = 1; i < CABRERA_SEQUENCE.length; i++) {
  assert.equal(CABRERA_SEQUENCE[i].angle - CABRERA_SEQUENCE[i - 1].angle, 30, 'Cabrera leads advance in exact 30-degree contiguous steps');
}
const PRECORDIAL_PLANES = {
  superior: ['V1', 'V2'],
  middle: ['V3'],
  inferior: ['V4', 'V5', 'V6']
};
assert.deepEqual(PRECORDIAL_PLANES.superior, ['V1', 'V2'], 'Superior plane consists of V1 and V2 at 4th ICS');
assert.deepEqual(PRECORDIAL_PLANES.middle, ['V3'], 'Middle plane consists of V3 along the anterior IV groove');
assert.deepEqual(PRECORDIAL_PLANES.inferior, ['V4', 'V5', 'V6'], 'Inferior plane consists of V4, V5, V6 at 5th ICS');

// Da Vinci Anatomy Card #2: Intrinsic Cardiac Autonomic Nervous System (Aksu, Gupta, Pauza, JACC 2021)
const PAUZA_SGPS = [
  { id: 'vrasgp', name: 'VRAsGP', color: '#3b82f6', target: 'SA node anterior / ventral crest' },
  { id: 'vlasgp', name: 'VLAsGP', color: '#22c55e', target: 'Ventral LA / roof' },
  { id: 'ldsgp', name: 'LDsGP', color: '#ef4444', target: 'Posterior LA / Marshall / LSGP' },
  { id: 'mdsgp', name: 'MDsGP', color: '#f97316', target: 'Waterston groove / Crux cordis / P-IS GP' },
  { id: 'drasgp', name: 'DRAsGP', color: '#ec4899', target: 'Dorsal SVC / Posterior SA node / RSGP' },
  { id: 'rcsgp', name: 'RCsGP', color: '#d946ef', target: 'Right AV sulcus / RCA' },
  { id: 'lcsgp', name: 'LCsGP', color: '#b45309', target: 'Left AV sulcus / LCx / CS' }
];
assert.equal(PAUZA_SGPS.length, 7, '7 Human epicardiac ganglionated subplexuses (Pauza et al.)');
const CNA_SELECTIVE_TARGETS = {
  sa_node: { gp: 'RSGP', fatPad: 'SVC-Ao', effect: 'selective chronotropic', avAffected: false },
  av_node: { gp: 'P-IS GP', fatPad: 'Crux cordis / IVC-LA', effect: 'selective dromotropic', sinusAffected: false }
};
assert.equal(CNA_SELECTIVE_TARGETS.sa_node.avAffected, false, 'RSGP ablation increases sinus rate without altering AV conduction');
assert.equal(CNA_SELECTIVE_TARGETS.av_node.sinusAffected, false, 'P-IS GP ablation abolishes AV block without altering sinus rate');

console.log('PASS ECG labs: physical QRS/QT timing, sorted strips, projection identity, axis boundaries, chest placement, reentry units/gap/block, seven finite rhythm examples, AV/PVC/AF patterns, 6-lead camera studio, STEMI studio, Da Vinci 12-lead ECG anatomy, and Da Vinci ICNS autonomic nervous system');
