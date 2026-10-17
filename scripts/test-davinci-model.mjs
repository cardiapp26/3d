import assert from 'node:assert/strict';
import {CABRERA,CHEST,SITES,PV_SITES,limbValues,rvotAngle,wavePath} from '../src/ecg/davinci-model.js';
for(let i=1;i<CABRERA.length;i++)assert.equal(CABRERA[i].angle-CABRERA[i-1].angle,30);
const a=Object.fromEntries(limbValues(rvotAngle(0),'standard').map(l=>[l.id,l.net]));
const b=Object.fromEntries(limbValues(rvotAngle(1),'standard').map(l=>[l.id,l.net]));
assert.ok(b.I<a.I&&b.II<a.II&&b.III>a.III&&b.aVR>a.aVR&&b.aVL<a.aVL,'Figure 2 linked RVOT trends');
assert.deepEqual(CHEST.map(x=>x.plane),['superior','superior','middle','inferior','inferior','inferior']);
assert.ok(SITES.summit.chest[0]<0&&SITES.summit.chest[1]<0&&SITES.summit.chest[2]>0);
assert.ok(SITES.inferoseptal.chest.every(n=>n>0)&&SITES.inferoseptal.axis<0,'Figure 5D superior axis with R concordance');
assert.ok(SITES.inferomedial.qChest&&!SITES.inferoseptal.qChest,'Papillary Q waves are distinct from inferoseptal process');
assert.ok(PV_SITES.RIPV.ii>0&&PV_SITES.RIPV.ii<PV_SITES.RSPV.ii);
assert.ok(PV_SITES.RIPV.v1>PV_SITES.RSPV.v1&&PV_SITES.LIPV.ii<PV_SITES.LSPV.ii);
assert.ok(PV_SITES.LSPV.width>PV_SITES.RSPV.width&&PV_SITES.LIPV.width>PV_SITES.RIPV.width);
assert.ok(PV_SITES.RAA.v1<0&&PV_SITES.LAA.avl<0);
const points=p=>p.match(/[ML][^ML]+/g).map(pair=>pair.slice(1).trim().split(/\s+/).map(Number));
for(const angle of [75,90,120]){
 const net=Math.cos((angle-30)*Math.PI/180);
 for(const kind of ['qrs','st']){
  const p=points(wavePath({id:'-aVR',net,kind})),n=points(wavePath({id:'aVR',net:-net,kind}));
  assert.equal(p.length,n.length);p.forEach(([x,y],i)=>{assert.equal(x,n[i][0]);assert.ok(Math.abs(y+n[i][1]-92)<1e-9,'Figure 10 exact vertical inversion');});
 }
}
const q=points(wavePath({net:-.7,q:true}));assert.ok(q.find(([x,y])=>x===61&&y>46),'Q-first RVOT morphology');
const rbbb=points(wavePath({kind:'rbbb'})),lbbb=points(wavePath({kind:'lbbb'}));
assert.ok(rbbb.find(([x,y])=>x===80&&y<46),'RBBB terminal positive force');
assert.ok(lbbb.find(([x,y])=>x===94&&y>46),'LBBB terminal negative force');
console.log('PASS Da Vinci source relations: Figure 2 trends; Figures 4–5 height and concordance; Figure 8 distinct papillary Q and terminal bundle forces; Figure 9 P relations; Figure 10 exact inversion');
