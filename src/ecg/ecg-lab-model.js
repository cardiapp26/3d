export const CHEST_LEADS = [
  {id:'V1',x:236,y:120,r:.2,s:-1.1,tr:'4. interkostal aralık, sağ sternal kenar',en:'4th intercostal space, right sternal border'},
  {id:'V2',x:278,y:120,r:.35,s:-.95,tr:'4. interkostal aralık, sol sternal kenar',en:'4th intercostal space, left sternal border'},
  {id:'V3',x:303,y:149,r:.65,s:-.65,tr:'V2 ile V4 arasında',en:'Between V2 and V4'},
  {id:'V4',x:330,y:178,r:1,s:-.35,tr:'5. interkostal aralık, midklaviküler hat',en:'5th intercostal space, midclavicular line'},
  {id:'V5',x:375,y:178,r:1.2,s:-.18,tr:'V4 ile aynı yatay düzey, ön aksiller hat',en:'Same horizontal level as V4, anterior axillary line'},
  {id:'V6',x:420,y:178,r:1.1,s:-.1,tr:'V4 ile aynı yatay düzey, midaksiller hat',en:'Same horizontal level as V4, midaxillary line'}
];
export const projectLead = (angle, magnitude, leadAngle) => magnitude*Math.cos((angle-leadAngle)*Math.PI/180);
export function axisCategory(angle) {
  if(!Number.isFinite(angle)||angle < -180 || angle > 180)throw new RangeError('Axis outside -180…180');
  return angle>=-30&&angle<=90?'normal':angle < -30&&angle>=-90?'left':angle>90?'right':'extreme';
}
export function reentryMetrics(lengthCm, velocityCmS, erpMs, block) {
  if(![lengthCm,velocityCmS,erpMs].every(x=>Number.isFinite(x)&&x>0))throw new RangeError('Invalid ring parameters');
  const wavelengthCm=velocityCmS*erpMs/1000,loopMs=lengthCm/velocityCmS*1000;
  return {wavelengthCm,loopMs,gapCm:Math.max(0,lengthCm-wavelengthCm),possible:!!block&&lengthCm>wavelengthCm};
}
export function stepProjections(step) {
  return {lead1:projectLead(step.vectorAngle,step.magnitude,0),lead2:projectLead(step.vectorAngle,step.magnitude,60),lead3:projectLead(step.vectorAngle,step.magnitude,120),v1:step.waves.v1,v6:step.waves.v6};
}
export const RHYTHM_EXAMPLES = [
 {id:'sinus',tr:'Sinüs ritmi',en:'Sinus rhythm',pdf:10},
 {id:'first',tr:'1. derece AV blok',en:'1st-degree AV block',pdf:12},
 {id:'wenckebach',tr:'Wenckebach',en:'Wenckebach',pdf:12},
 {id:'complete',tr:'Tam AV blok',en:'Complete AV block',pdf:12},
 {id:'pvc',tr:'PVC / erken vuru',en:'PVC / premature beat',pdf:11},
 {id:'af',tr:'Atriyal fibrilasyon',en:'Atrial fibrillation',pdf:13},
 {id:'flutter',tr:'Flutter · 3:1',en:'Flutter · 3:1',pdf:13}
];
export function rhythmEvents(kind) {
 if(!RHYTHM_EXAMPLES.some(x=>x.id===kind))throw new RangeError('Unknown rhythm example');
 const p=[],q=[];
 if(kind==='af'){let at=.3;const rr=[.64,.91,.48,.76,.57,.95,.61];let i=0;while(at<6){q.push({at,width:.08});at+=rr[i++%rr.length];}}
 else if(kind==='flutter'){for(let at=.3;at<6;at+=.6)q.push({at,width:.08});}
 else if(kind==='complete'){for(let at=.12;at<6;at+=.8)p.push(at);for(let at=.34;at<6;at+=1.5)q.push({at,width:.14});}
 else for(let i=0;i<8;i++){const atrial=.12+i*.8,pr=kind==='first'?.28:kind==='wenckebach'?[.16,.2,.24,null][i%4]:.16;p.push(atrial);if(pr!==null)q.push({at:atrial+pr,width:.08});}
 if(kind==='pvc'){const prev=q[2].at,next=q[3].at;q.splice(3,1,{at:prev+.48,width:.16,pvc:true});q[4].at=prev+1.6;}
 return {p,q};
}
export function rhythmSample(t,kind) {
 const {p,q}=rhythmEvents(kind);let mv=kind==='af'?.025*Math.sin(t*51)+.018*Math.sin(t*83):kind==='flutter'?.16*(1-2*((t/.2)%1)):0;
 for(const at of p)if(t>=at&&t<at+.08)mv+=.18*Math.sin((t-at)/.08*Math.PI);
 for(const beat of q){const f=(t-beat.at)/beat.width;if(f>=0&&f<=1){const a=beat.pvc?[[0,0],[.25,-.6],[.5,1.05],[1,0]]:[[0,0],[.12,-.12],[.35,1.2],[.65,-.3],[1,0]];for(let i=1;i<a.length;i++)if(f<=a[i][0]){mv+=a[i-1][1]+(a[i][1]-a[i-1][1])*(f-a[i-1][0])/(a[i][0]-a[i-1][0]);break;}}const tw=(t-(beat.at+beat.width+.08))/.14;if(tw>=0&&tw<=1)mv+=(beat.pvc?-.3:.3)*Math.sin(tw*Math.PI);}
 return mv;
}

export function ringSnapshot(metrics,timeMs,erpMs,block) {
 const age=Math.max(0,timeMs),loop=metrics.loopMs;
 if(!block)return {progress:Math.min(1,age/loop*2),head:age<loop/2,collision:age>=loop/2&&age<loop/2+50,tail:0};
 const head=metrics.possible||age<loop;
 const progress=metrics.possible?(age/loop)%1:Math.min(1,age/loop);
 const tail=metrics.possible?Math.min(age/loop,erpMs/loop):Math.max(0,Math.min(age/loop,1)-Math.max(0,(age-erpMs)/loop));
 return {progress,head,collision:false,tail};
}
