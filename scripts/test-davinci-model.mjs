import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CABRERA,CHEST,SITES,PV_SITES,limbValues,rvotAngle,wavePath} from '../src/ecg/davinci-model.js';
import {JACC_PAPER_META,JACC_FIGURES,JACC_CLINICAL_CHALLENGES} from '../src/ecg/davinci-data.js';

// Verify JACC Paper Metadata
assert.equal(JACC_PAPER_META.pmid, '41204941');
assert.equal(JACC_PAPER_META.pmcid, 'PMC12833672');
assert.equal(JACC_PAPER_META.doi, '10.1016/j.jaccas.2025.105998');
assert.equal(JACC_PAPER_META.takeHomeMessages.length, 3);
JACC_PAPER_META.takeHomeMessages.forEach(msg => {
  assert.ok(msg.tr && msg.tr.length > 20);
  assert.ok(msg.en && msg.en.length > 20);
});

// Verify all 12 figures integrity
for(let i=1; i<=12; i++){
  const fig = JACC_FIGURES[`fig${i}`];
  assert.ok(fig, `Figure ${i} must exist in JACC_FIGURES`);
  assert.equal(fig.num, i);
  assert.ok(fig.title.tr && fig.title.en, `Figure ${i} title must be bilingual`);
  assert.ok(fig.subtitle.tr && fig.subtitle.en);
  assert.ok(fig.takeaway.tr && fig.takeaway.en);
  assert.ok(fig.caption.tr && fig.caption.en);
  assert.ok(Array.isArray(fig.panels) && fig.panels.length > 0);
  assert.ok(fig.workbench && fig.workbench.tab);
  // Verify images exist in public/ecg-anatomy/figures
  assert.ok(fs.existsSync(`public/ecg-anatomy/figures/fig${i}.webp`), `fig${i}.webp must exist`);
}

// Verify Clinical Challenges
assert.ok(JACC_CLINICAL_CHALLENGES.length >= 4);
JACC_CLINICAL_CHALLENGES.forEach(c => {
  assert.ok(c.options.some(o => o.correct === true), `Challenge ${c.id} must have a correct option`);
  assert.ok(c.workbench && c.workbench.tab);
});

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

// Figures and challenges are placed inside workbench topics (no separate article tab).
const TOPICS = ['cabrera', 'heights', 'nomenclature', 'atrial'];
const placed = Object.values(JACC_FIGURES);
placed.forEach(fig => assert.ok(TOPICS.includes(fig.workbench.tab), `Figure ${fig.num} belongs to a workbench topic`));
TOPICS.forEach(tab => assert.ok(placed.some(fig => fig.workbench.tab === tab), `${tab} shows at least one source figure`));
JACC_CLINICAL_CHALLENGES.forEach(c => {
  assert.ok(TOPICS.includes(c.workbench.tab), `Challenge ${c.id} belongs to a workbench topic`);
  assert.equal(JACC_FIGURES[`fig${c.figureRef}`].workbench.tab, c.workbench.tab, `Challenge ${c.id} sits with its reference figure`);
});
