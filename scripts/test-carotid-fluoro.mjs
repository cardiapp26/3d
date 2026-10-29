import assert from 'node:assert/strict';
import { ARCH_VARIANTS, ARCH_TYPES, STRUCTURES } from '../src/angio/carotid/carotid-data.js';
import { buildCarotidModel, projectCarotidPoint, renderCarotidFluoro, hitTestCarotid, sampleCarotidCenterline } from '../src/angio/carotid/carotid-fluoro.js';

const ids=new Set(STRUCTURES.map(s=>s.id));
for(const view of ['arch','cervical','ica','circle','stenosis']) {
  const model=buildCarotidModel({view});
  assert.equal(model.calibrated,false);
  assert(model.vessels.length>2);
  assert(new Set(model.vessels.flatMap(v=>v.points.map(p=>p[2]))).size>2,`${view}: real depth`);
  for(const vessel of model.vessels) {
    const smooth=sampleCarotidCenterline(vessel.points);
    assert.equal(smooth.length,(vessel.points.length-1)*12+1);
    vessel.points.forEach((p,i)=>p.forEach((value,k)=>assert(Math.abs(smooth[i*12][k]-value)<1e-12,'junction vertex preserved')));
    for(const p of smooth) {
      assert(p.every(Number.isFinite));
      for(const alpha of [-90,0,90]) for(const beta of [-40,0,40]) {
        const q=projectCarotidPoint(p,alpha,beta);
        assert(Math.abs(q.u)<1.9&&Math.abs(q.v)<1.9,'smooth fixed projection volume');
      }
    }
    assert(vessel.selectable===false||ids.has(vessel.id),vessel.id);
    for(const p of vessel.points) for(const alpha of [-90,-40,0,40,90]) for(const beta of [-40,0,40]) {
      const q=projectCarotidPoint(p,alpha,beta);
      assert([q.u,q.v,q.depth,q.perspective].every(Number.isFinite));
      assert(Math.abs(q.u)<1.9&&Math.abs(q.v)<1.9,'fixed projection volume');
    }
  }
}
for(const variant of ARCH_VARIANTS) for(const type of ARCH_TYPES) {
  const model=buildCarotidModel({view:'arch',archVariant:variant.id,archType:type.id});
  assert.equal(model.archVariant,variant.id);assert.equal(model.archType,type.id);
  assert.equal(model.vessels.filter(v=>v.id==='lcca').length,1);
  assert.equal(model.vessels.filter(v=>v.id==='rcca').length,1);
}
// Model +Z is posterior. LAO puts posterior structures (spine) on image right, RAO on image left;
// a cranial tilt projects posterior structures higher (smaller v) on the image.
const a=projectCarotidPoint([0,0,1],45,0),b=projectCarotidPoint([0,0,1],-45,0);
assert(a.u>0&&b.u<0,'LAO/RAO convention: posterior point to image right in LAO');
assert(projectCarotidPoint([0,0,1],0,30).v<0,'cranial projection convention: posterior point rises');
assert(projectCarotidPoint([0,0,-1],0,0).perspective<projectCarotidPoint([0,0,1],0,0).perspective,'detector-side (anterior) structures magnify less');
// LAO 30-45 opens the arch: ascending and descending aorta separate more than in AP; RAO closes it.
{
  const arch=buildCarotidModel({view:'arch'});
  const asc=arch.vessels.find(v=>v.id==='ascending-aorta').points[1],desc=arch.vessels.find(v=>v.id==='descending-aorta').points[0];
  const gap=angle=>projectCarotidPoint(desc,angle,0).u-projectCarotidPoint(asc,angle,0).u;
  assert(gap(35)>gap(0)&&gap(0)>gap(-35),'LAO opens the arch, RAO closes it');
  // Left cervical carotid in a lateral (LAO 90) view: anterior ECA projects to image left of the posterior ICA.
  const neck=buildCarotidModel({view:'cervical'});
  const ica=neck.vessels.find(v=>v.id==='cervical-ica').points[2],eca=neck.vessels.find(v=>v.id==='eca').points[2];
  assert(projectCarotidPoint(eca,90,0).u<projectCarotidPoint(ica,90,0).u,'lateral: ECA anterior, ICA posterior');
}
assert.deepEqual(projectCarotidPoint([1,1,1],NaN,Infinity),projectCarotidPoint([1,1,1],0,0));
const tight=buildCarotidModel({view:'stenosis',residual:.5,distal:4});
const wide=buildCarotidModel({view:'stenosis',residual:3,distal:4});
assert(tight.vessels[1].radii[1]<wide.vessels[1].radii[1]);
assert(buildCarotidModel({view:'stenosis',residual:0,distal:4}).vessels[1].occluded);
assert.equal(buildCarotidModel({view:'stenosis',residual:-1,distal:0}).measurementValid,false);
assert.notDeepEqual(buildCarotidModel({view:'stenosis',coil:true}).vessels[2].points,wide.vessels[2].points);
assert.notDeepEqual(buildCarotidModel({view:'stenosis',angle:100}).vessels[2].points,wide.vessels[2].points);
let strokes=0;
const ctx={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},stroke(){assert(Number.isFinite(this.lineWidth)&&this.lineWidth>0);strokes++;}};
const canvas={width:900,height:600,getContext:()=>ctx};
const empty=renderCarotidFluoro(canvas,{contrast:0});
assert.equal(strokes,0);assert.equal(empty.hitRegions.length,0);
for(const view of ['arch','cervical','ica','circle','stenosis']) for(const imagingMode of ['dsa','fluoro']) {
  const result=renderCarotidFluoro(canvas,{view,imagingMode,alpha:40,beta:-20,contrast:.7});
  assert(result.hitRegions.length);
  const region=result.hitRegions.find(r=>r.points.length>1),p=region.points[0];
  assert(hitTestCarotid(result.hitRegions,p.x,p.y));
  assert.equal(hitTestCarotid(result.hitRegions,-100,-100),null);
}
assert(strokes>0);
strokes=0;
const plain=renderCarotidFluoro(canvas,{view:'cervical'}),plainStrokes=strokes;
strokes=0;
const selected=renderCarotidFluoro(canvas,{view:'cervical',selected:'cca'});
assert.equal(strokes,plainStrokes+1,'selection adds visible outline');
assert.deepEqual(selected.hitRegions,plain.hitRegions,'selection keeps hit geometry');
const cervicalModel=buildCarotidModel({view:'cervical'});
const icaRegion=plain.hitRegions.find(r=>r.id==='cervical-ica');
assert.equal(icaRegion.points.length,sampleCarotidCenterline(cervicalModel.vessels.find(v=>v.id==='cervical-ica').points).length);
assert(!ctx.strokeStyle.includes('rgba'),'opaque vessel shade prevents overlap accumulation');
strokes=0;
renderCarotidFluoro(canvas,{view:'stenosis',residual:0,distal:4});
const occludedStrokes=strokes;
strokes=0;
renderCarotidFluoro(canvas,{view:'stenosis',residual:.1,distal:4});
assert.equal(strokes-occludedStrokes,2,'zero lumen skips both subsegments adjacent to the occluded node');
assert.equal(renderCarotidFluoro(null,{}).hitRegions.length,0);
{
  const hiCtx={...ctx,setTransform(){}},hi={width:1800,height:1200,getContext:()=>hiCtx};
  const lo=renderCarotidFluoro(canvas,{view:'cervical'}),dense=renderCarotidFluoro(hi,{view:'cervical',pixelRatio:2});
  assert.deepEqual(dense.hitRegions,lo.hitRegions,'pixelRatio keeps hit regions in logical units');
}
console.log('PASS carotid fluoroscopy: 5 3D models, arch variants/types, LAO/RAO and cranial conventions, arch opening, DPR, fixed fit, stenosis, invalid input, contrast-zero, hit regions');
