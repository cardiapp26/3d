import { ecgSample, ecgTiming } from './guyton-render.js';
import { CHEST_LEADS, projectLead, reentryMetrics, ringSnapshot, RHYTHM_EXAMPLES } from './ecg-lab-model.js';
import { ventricularSample } from '../physiology-model.js';
import { drawRhythmStrip } from './rhythm-strip.js';
import './ecg-labs.css';
const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(attrs.stroke)n.style.stroke=attrs.stroke;if(text)n.textContent=text;return n;};
const path=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
// One smooth beat (P, R, S, T as gaussian deflections) across `width` px; amplitudes in mV.
const beatPoints=(x,base,width,{p=.12,r=0,s=0,t=.25},scale)=>Array.from({length:Math.ceil(width)+1},(_,i)=>{const u=i/width,g=(c,w,a)=>a*Math.exp(-(((u-c)/w)**2));return [x+i,base-(g(.16,.045,p)+g(.38,.018,r)-g(.425,.02,s)+g(.7,.075,t))*scale];});
export function createEcgLab({mount,topic,getLang,getExternal=()=>({}),state={}}){
 const defaults={rate:75,speed:25,gain:10,interval:'PR',cursor:300,lead:'V1',angle:59,shift:.25,reference:'TP',length:12,velocity:40,erp:250,block:true,running:false,time:0,rhythm:'sinus'};
 for(const [k,v] of Object.entries(defaults))if(state[k]===undefined)state[k]=v;
 let raf=null,last=null;
 const root=document.createElement('section');root.className='ecg-lab';root.dataset.ecgLab=topic;mount.append(root);
 const h=document.createElement('h3'),controls=document.createElement('div'),svg=svgNode('svg',{viewBox:'0 0 600 420',role:'img'}),result=document.createElement('p'),note=document.createElement('p');controls.className='ecg-lab-controls';result.className='ecg-lab-result';result.setAttribute('role','status');note.className='ecg-lab-note';const visual=document.createElement('div');visual.className='ecg-lab-visual';visual.append(svg);root.append(h,controls,visual,result,note);
 const tr=(a,b)=>getLang()==='en'?b:a;
 const text=(x,y,value,attrs={})=>svg.append(svgNode('text',{x,y,...attrs},value));
 const line=(points,cls='lab-trace',attrs={})=>svg.append(svgNode('path',{d:path(points),class:cls,...attrs}));
 function button(key,value,label){const b=document.createElement('button');b.type='button';b.dataset.labControl=`${key}-${value}`;b.textContent=label;b.addEventListener('click',()=>{state[key]=value;if(topic==='ch13_arrhythmias')state.time=0;draw();});controls.append(b);return b;}
 function slider(key,label,min,max,step=1){const row=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input'),out=document.createElement('output');span.textContent=label;Object.assign(input,{type:'range',min:String(min),max:String(max),step:String(step),value:String(state[key])});input.dataset.labParam=key;input.setAttribute('aria-label',label);row.append(span,out,input);controls.append(row);input.addEventListener('input',()=>{state[key]=Number(input.value);if(topic==='ch13_arrhythmias')state.time=0;draw();});return {input,out};}
 const sliders={};
 const names={ch11_basics:tr('Dalga ve ölçüm laboratuvarı','Wave and measurement lab'),ch11_leads:tr('Göğüs elektrotları ve R progresyonu','Chest electrodes and R progression'),ch12_vectors:tr('Aktivasyon haritası ve eşzamanlı QRS izleri','Activation map and synchronized QRS traces'),ch12_axis:tr('Aksı I–aVF–II ile test et','Test axis with I–aVF–II'),ch12_injury:tr('Bölgesel ST haritası ve referans çizgisi','Regional ST map and reference line'),ch13_arrhythmias:tr('Uyarılabilir boşluğu oluştur','Create an excitable gap')};h.textContent=names[topic];svg.setAttribute('aria-label',h.textContent);
 if(topic==='ch11_basics'){
  sliders.rate=slider('rate',tr('Kalp hızı (dk⁻¹)','Heart rate (min⁻¹)'),60,100);
  for(const v of [25,50])button('speed',v,`${v} mm/s`);for(const v of [5,10,20])button('gain',v,`${v} mm/mV`);
  for(const v of ['P','PR','QRS','QT','T'])button('interval',v,v);sliders.cursor=slider('cursor',tr('Atım içi zaman (ms)','Time within beat (ms)'),0,799);
 }
 if(topic==='ch11_leads')for(const id of ['I','II','III','aVR','aVL','aVF',...CHEST_LEADS.map(l=>l.id)])button('lead',id,id);
 if(topic==='ch12_injury'){sliders.shift=slider('shift',tr('ST değişimi (mV, örnek)','ST shift (mV, example)'),0,.5,.05);for(const r of ['TP','J'])button('reference',r,r);}
 if(topic==='ch13_arrhythmias'){
  sliders.length=slider('length',tr('Yol uzunluğu (cm)','Path length (cm)'),4,24);
  sliders.velocity=slider('velocity',tr('İletim hızı (cm/s)','Conduction velocity (cm/s)'),20,80);
  sliders.erp=slider('erp',tr('ERP (ms)','ERP (ms)'),100,600,10);
  button('block',true,tr('Tek yönlü başlangıç bloğu','Unidirectional initiating block'));button('block',false,tr('Blok yok: iki dalga çarpışır','No block: two waves collide'));
  const play=document.createElement('button');play.type='button';play.dataset.labAction='play';play.addEventListener('click',()=>{state.running=!state.running;last=null;draw();});controls.append(play);
  const advance=document.createElement('button');advance.type='button';advance.dataset.labAction='step';advance.textContent=tr('50 ms ilerlet','Advance 50 ms');advance.addEventListener('click',()=>{state.running=false;state.time+=.05;draw();});controls.append(advance);
 }
 function grid(x,y,w,height,pxMm=4){svg.append(svgNode('rect',{x,y,width:w,height,fill:'#fff7ef'}));for(let i=0;i<=w;i+=pxMm)line([[x+i,y],[x+i,y+height]],i%(pxMm*5)?'lab-grid':'lab-grid-major');for(let i=0;i<=height;i+=pxMm)line([[x,y+i],[x+w,y+i]],i%(pxMm*5)?'lab-grid':'lab-grid-major');}
 function waveform(x,y,w,height,opts={},color='#e9b66b'){const base=y+height*.62,scale=opts.gain??36;line(Array.from({length:Math.ceil(w*2)+1},(_,i)=>{const px=Math.min(w,i/2);return [x+px,base-ecgSample(px/(opts.pxSec??100),opts)*scale];}),'lab-trace',{stroke:color});return base;}
 function torso(){svg.append(svgNode('path',{d:'M200 35L170 70L140 245Q290 285 450 245L420 70L385 35L330 55H260Z',class:'lab-torso'}));line([[258,55],[258,215]],'lab-divider');text(135,40,tr('Hasta sağı','Patient right'));text(393,40,tr('Hasta solu','Patient left'));}
 function draw(){
  svg.replaceChildren();for(const [key,{input,out}] of Object.entries(sliders)){input.value=state[key];out.textContent=state[key];}
  controls.querySelectorAll('[data-lab-control]').forEach(b=>{const [key,...parts]=b.dataset.labControl.split('-');b.setAttribute('aria-pressed',String(String(state[key])===parts.join('-')));});
  if(topic==='ch11_basics')drawBasics();if(topic==='ch11_leads')drawLeads();if(topic==='ch12_injury')drawInjury();if(topic==='ch13_arrhythmias')drawRing();
 }
 function drawBasics(){
  const timing=ecgTiming({rate:state.rate}),pxSec=state.speed*4,pxMv=state.gain*4,rrMs=timing.rr*1000;
  sliders.cursor.input.max=String(Math.ceil(rrMs)-1);state.cursor=Math.min(state.cursor,Math.ceil(rrMs)-1);sliders.cursor.input.value=state.cursor;sliders.cursor.out.textContent=state.cursor;
  grid(40,225,520,120);waveform(40,225,520,120,{rate:state.rate,pxSec,gain:pxMv},'#192d38');
  text(40,212,`${state.speed} mm/s · ${state.gain} mm/mV`);text(40,24,tr('Ventrikül hücresi: mV','Ventricular cell: mV'));
  line([[40,40],[40,165],[560,165]],'lab-axis');text(7,55,'+20');text(7,163,'−90');
  line(Array.from({length:521},(_,i)=>{const ms=i/520*rrMs,ap=ventricularSample(ms-(timing.q*1000));return [40+i,165-(ap.voltage+90)/110*115];}));
  for(const ms of [0,rrMs/4,rrMs/2,rrMs*3/4,rrMs])text(40+ms/rrMs*520,185,String(Math.round(ms)),{'text-anchor':'middle'});text(572,185,'ms');
  const cursor=state.cursor;line([[40+cursor/rrMs*520,38],[40+cursor/rrMs*520,170]],'lab-cursor');
  line([[40+cursor/1000*pxSec,225],[40+cursor/1000*pxSec,345]],'lab-cursor');
  const spans={P:[timing.p,timing.pEnd],PR:[timing.p,timing.q],QRS:[timing.q,timing.j],QT:[timing.q,timing.tEnd],T:[timing.tStart,timing.tEnd]},[a,b]=spans[state.interval];
  svg.append(svgNode('rect',{x:40+a*pxSec,y:225,width:(b-a)*pxSec,height:120,class:'lab-band'}));line([[40+a*pxSec,365],[40+b*pxSec,365]],'lab-measure');text(40+(a+b)/2*pxSec,386,`${state.interval} ${Math.round((b-a)*1000)} ms`,{'text-anchor':'middle'});
  result.textContent=`${state.interval}: ${Math.round((b-a)*1000)} ms = ${((b-a)*state.speed).toFixed(1)} ${tr('küçük kare','small boxes')} · RR ${(timing.rr*1000).toFixed(0)} ms · QTcF ${(timing.qt/Math.cbrt(timing.rr)*1000).toFixed(0)} ms`;
  note.textContent=tr('Hız ve kazanç kare sayısını değiştirir; gerçek süre/voltajı değiştirmez. QTcF = QT/RR⅓; bu sabit QT örneği hız uyumunu modellemez. Tek hücre AP’si yüzey EKG değildir. P atriyumu, QRS ventriküler depolarizasyonu, T repolarizasyonu temsil eder; her derivasyonda pozitif olmak zorunda değildir.','Speed and gain change box counts, not actual time/voltage. QTcF = QT/RR⅓; this fixed-QT example does not model rate adaptation. Single-cell AP is not surface ECG. P represents atria, QRS ventricular depolarization, T repolarization; polarity depends on lead.');
 }
 function drawLeads(){
  torso();const chosen=CHEST_LEADS.find(l=>l.id===state.lead);
  if(!chosen){drawLimb();return;}
  CHEST_LEADS.forEach(l=>{const g=svgNode('g',{role:'button',tabindex:'0','aria-label':l.id,'aria-pressed':String(l.id===state.lead),class:'lab-electrode'});g.append(svgNode('circle',{cx:l.x,cy:l.y,r:13,class:l.id===state.lead?'lab-active':'lab-dot'}),svgNode('text',{x:l.x,y:l.y-19,'text-anchor':'middle'},l.id));const select=()=>{state.lead=l.id;draw();svg.querySelector(`[aria-label=${l.id}]`)?.focus();};g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select();}});svg.append(g);});
  CHEST_LEADS.forEach((l,i)=>{const x=22+i*95,y=345;line(beatPoints(x,y,86,{p:.1,r:l.r,s:-l.s,t:l.id==='V1'?-.05:.12+.12*l.r},40),'lab-trace',{stroke:l.id===state.lead?'#f2b651':'#789dab'});text(x+43,407,l.id,{'text-anchor':'middle'});});
  result.textContent=`${chosen.id}: ${chosen[getLang()==='en'?'en':'tr']}`;
  note.textContent=tr('Anatomik ölçekli değildir. V1 hastanın sağında, V2 solunda; V4–V6 aynı yatay düzeyde. Sağdan sola rS → geçiş → R baskın örneği. Geçiş çoğu kez V3–V4 civarıdır; değişkenlik ve elektrot hataları olabilir. V1–V2 kalbin “arka yüzünü” görmez.','Not anatomically to scale. V1 is patient-right, V2 patient-left; V4–V6 share a horizontal level. Illustrative rS → transition → R dominance. Transition often occurs near V3–V4; variation and placement errors occur. V1–V2 do not view the posterior heart directly.');
 }
 function drawLimb(){
  const endpoints={I:['RA','LA'],II:['RA','LL'],III:['LA','LL'],aVR:['LA+LL','RA'],aVL:['RA+LL','LA'],aVF:['RA+LA','LL']};
  const points={RA:[170,75],LA:[420,75],LL:[345,245],'LA+LL':[380,160],'RA+LL':[257,160],'RA+LA':[295,75]};
  const [negative,positive]=endpoints[state.lead],[a,b]=[points[negative],points[positive]];
  line([a,b],'lab-measure');svg.append(svgNode('circle',{cx:b[0],cy:b[1],r:12,class:'lab-active'}));
  for(const [id,pt] of Object.entries(points))if(['RA','LA','LL'].includes(id)){svg.append(svgNode('circle',{cx:pt[0],cy:pt[1],r:8,class:'lab-dot'}));text(pt[0],pt[1]-20,id,{'text-anchor':'middle'});}
  text(b[0]+20,b[1],'+');text(a[0]-20,a[1],'−');
  const angle=getExternal().vectorAngle??59,leadAngles={I:0,II:60,III:120,aVR:-150,aVL:-30,aVF:90},v=projectLead(angle,1,leadAngles[state.lead]);
  const r=(1+v)**2/4,sw=(1-v)**2/4;line(beatPoints(60,345,480,{p:.12*Math.cos((60-leadAngles[state.lead])*Math.PI/180),r,s:sw,t:.3*v},60),'lab-trace');text(300,395,`${state.lead}: ${v.toFixed(2)} · ${angle}°`,{'text-anchor':'middle'});
  result.textContent=`${state.lead}: ${positive}(+) − ${negative}(−)`;
  note.textContent=tr('Augmented derivasyonların eksi kutbu diğer iki ekstremitenin ortalamasıdır. Altın çizgi ölçüm yönünü gösterir. Üstteki açı kaydırıcısı frontal izdüşümü değiştirir; genlikler aynı ideal dipol ölçeğinde göreli örneklerdir. Netter Levha 2-16.','Augmented leads reference the average of the other two limbs. Gold line shows measurement direction. Angle slider above changes frontal projection; amplitudes are relative examples on the same ideal-dipole scale. Netter Plate 2-16.');
 }
 function drawInjury(){
  const anterior=getExternal().caseId!=='posterior_mi',shift=state.shift;
  const leads=anterior?[['V2',shift],['V3',shift],['V4',shift],['III',-shift*.5]]:[['V1',-shift],['V2',-shift],['V3',-shift],['V7–V9',shift]];
  leads.forEach(([name,st],i)=>{const y=40+i*85;grid(55,y,495,62);const base=waveform(55,y,495,62,{stElev:st,pxSec:350,gain:36},'#293c43');const timing=ecgTiming({stElev:st}),jX=55+timing.j*350;line([[55,base],[550,base]],'lab-baseline');svg.append(svgNode('circle',{cx:jX,cy:base-st*36,r:4,class:'lab-active'}));if(state.reference==='J')line([[jX,base-st*36],[jX+100,base-st*36]],'lab-measure');text(12,y+30,name);text(557,y+34,`${st>=0?'+':''}${st.toFixed(2)}`);});
  result.textContent=tr('TP: izoelektrik bazal referans · J: QRS sonu / ST başlangıcı','TP: isoelectric baseline reference · J: QRS end / ST onset');
  note.textContent=tr('J noktası evrensel “gerçek sıfır” değildir. ST, uygun TP/PR bazal çizgisine göre değerlendirilir. Örnek kaymalar tanı eşiği değildir; ardışık derivasyon, yaş/cinsiyet, semptom ve seri EKG gerekir. Posterior örnekte inferior elevasyon zorunlu değildir; V7–V9 ek bakış sağlar.','J point is not universal “true zero”. Evaluate ST against appropriate TP/PR baseline. Example shifts are not diagnostic cutoffs; contiguous leads, age/sex, symptoms and serial ECG matter. Inferior elevation is not required in posterior involvement; V7–V9 provide an additional view.');
 }
 function drawRing(){
  // Homogeneous ring: wavefront (gold, arrow), refractory tail (purple), excitable gap (green), block site (red).
  const m=reentryMetrics(state.length,state.velocity,state.erp,state.block),cx=200,cy=205,r=118;
  const snap=ringSnapshot(m,state.time*1000,state.erp,state.block),top=-Math.PI/2,head=top+snap.progress*Math.PI*2;
  const arcPts=(a0,a1,rad=r)=>{const n=Math.max(2,Math.ceil(Math.abs(a1-a0)/.03));return Array.from({length:n+1},(_,k)=>{const a=a0+(a1-a0)*k/n;return [cx+rad*Math.cos(a),cy+rad*Math.sin(a)];});};
  svg.append(svgNode('circle',{cx,cy,r,class:'lab-ring'}));
  text(cx,cy-r-34,tr('Uyarı girişi','Stimulus entry'),{'text-anchor':'middle',class:'ring-caption'});
  svg.append(svgNode('path',{d:`M${cx} ${cy-r-28}V${cy-r-12}`,class:'ring-entry'}),svgNode('path',{d:`M${cx-5} ${cy-r-18}L${cx} ${cy-r-10}L${cx+5} ${cy-r-18}`,class:'ring-entry'}));
  const arrowAt=(a,dir)=>{const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a),tx=-Math.sin(a)*dir,ty=Math.cos(a)*dir,nx=Math.cos(a),ny=Math.sin(a);svg.append(svgNode('path',{d:`M${x+tx*12} ${y+ty*12}L${x-tx*2+nx*9} ${y-ty*2+ny*9}L${x-tx*2-nx*9} ${y-ty*2-ny*9}Z`,class:'ring-head'}));};
  if(state.block){
    const tail=snap.tail*Math.PI*2;
    if(snap.head&&m.possible){const gapEnd=head-tail+Math.PI*2;line(arcPts(head,gapEnd),'ring-gap');}
    if(tail>0)line(arcPts(head-tail,head),'ring-refractory');
    // Block just counter-clockwise of the entry: the impulse can only travel clockwise.
    const b=top-.16;svg.append(svgNode('path',{d:`M${cx+(r-16)*Math.cos(b)} ${cy+(r-16)*Math.sin(b)}L${cx+(r+16)*Math.cos(b)} ${cy+(r+16)*Math.sin(b)}`,class:'ring-block'}));
    text(cx+(r+20)*Math.cos(b)-14,cy+(r+20)*Math.sin(b)+10,tr('tek yönlü blok','one-way block'),{class:'ring-caption ring-block-text','text-anchor':'end'});
    if(snap.head){svg.append(svgNode('circle',{cx:cx+r*Math.cos(head),cy:cy+r*Math.sin(head),r:11,class:'lab-active'}));arrowAt(head,1);}
  } else {
    for(const sign of [-1,1]){const a=top+sign*snap.progress*Math.PI;line(arcPts(top,a),'ring-refractory');if(snap.head){svg.append(svgNode('circle',{cx:cx+r*Math.cos(a),cy:cy+r*Math.sin(a),r:11,class:'lab-active'}));arrowAt(a,sign);}}
    if(snap.collision)svg.append(svgNode('circle',{cx,cy:cy+r,r:16,class:'ring-collision'}));
    text(cx,cy+r+30,tr('çarpışma → sönme','collision → extinction'),{'text-anchor':'middle',class:'ring-caption'});
  }
  text(cx,cy-6,`λ = ${m.wavelengthCm.toFixed(1)} cm`,{'text-anchor':'middle',class:'ring-centre'});text(cx,cy+18,`L = ${state.length} cm`,{'text-anchor':'middle',class:'ring-centre'});
  const cards=[[tr('Tur süresi','Loop time'),`${m.loopMs.toFixed(0)} ms`],['ERP',`${state.erp} ms`],[tr('Dalga boyu λ','Wavelength λ'),`${m.wavelengthCm.toFixed(1)} cm`],[tr('Uyarılabilir boşluk','Excitable gap'),`${m.gapCm.toFixed(1)} cm`]];
  cards.forEach(([k,v],n)=>{const y=70+n*70;svg.append(svgNode('rect',{x:372,y,width:200,height:56,rx:8,class:n===3?(m.gapCm>0?'ring-card ring-card-gap':'ring-card ring-card-none'):'ring-card'}));text(386,y+21,k,{class:'ring-card-label'});text(386,y+44,v,{class:'ring-card-value'});});
  result.textContent=`λ = CV × ERP = ${m.wavelengthCm.toFixed(1)} cm · ${m.possible?tr('Sürme koşulu mümkün','Sustaining condition possible'):tr('Bu modelde sürmez','Not sustained in this model')}`;
  note.textContent=tr('Mor: refrakter kuyruk · yeşil: uyarılabilir boşluk · altın: dalga cephesi · kırmızı: tek yönlü blok. Basit homojen halka: tek yönlü başlatma + L > λ. Uzun yol, yavaş iletim ve kısa ERP üç ayrı zorunlu koşul değil, dalga boyunu/yol oranını etkileyen etmenlerdir. Fibrilasyon veya hasta ritmi modellenmez.','Purple: refractory tail · green: excitable gap · gold: wavefront · red: one-way block. Simple homogeneous ring: unidirectional initiation + L > λ. Long path, slow conduction and short ERP are factors affecting wavelength/path ratio, not three separate mandatory conditions. No fibrillation or patient rhythm is modeled.');
  root.querySelector('[data-lab-action=play]').textContent=state.running?tr('Duraklat','Pause'):tr('Başlat','Play');
 }
 let rhythmSvg, rhythmResult;
 function drawRhythm(){
  if(!rhythmSvg)return;
  // Calibrated strip with P waves marked and an A / AV / V ladder (rhythm-strip.js).
  drawRhythmStrip(rhythmSvg,state.rhythm,{fWaves:tr('f dalgaları: organize P yok','f waves: no organized P'),ladder:tr('Merdiven diyagramı: A atriyum · AV ileti · V ventrikül','Ladder diagram: A atrium · AV conduction · V ventricle')});
  const descriptions={sinus:tr('P → QRS, sabit PR, düzenli RR','P → QRS, fixed PR, regular RR'),first:tr('Her P iletilir; PR örneği 280 ms','Every P conducts; example PR 280 ms'),wenckebach:tr('PR: 160 → 200 → 240 ms; ardından iletilmeyen P','PR: 160 → 200 → 240 ms; then a nonconducted P'),complete:tr('P ve kaçış QRS dizileri bağımsız; bu örnekte geniş kaçış','Independent P and escape-QRS sequences; wide escape in this example'),pvc:tr('Erken geniş vuru; örnek tam kompanzatuvar duraklama','Premature wide beat; illustrative full compensatory pause'),af:tr('Organize P yok; düzensiz RR','No organized P; irregular RR'),flutter:tr('Atriyal testere dişi; örnek düzenli 3:1 iletim','Atrial sawtooth pattern; illustrative regular 3:1 conduction')};
  const r=RHYTHM_EXAMPLES.find(x=>x.id===state.rhythm);rhythmResult.textContent=`${descriptions[state.rhythm]} · Netter ${tr('PDF s.','PDF p.')} ${r.pdf}`;
  root.querySelectorAll('[data-lab-rhythm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.labRhythm===state.rhythm)));
 }
 if(topic==='ch13_arrhythmias'){
  const section=document.createElement('section');section.className='ecg-rhythm-gallery';const title=document.createElement('h3');title.textContent=tr('Ritim şeridini karşılaştır','Compare rhythm strips');const nav=document.createElement('div');nav.className='ecg-lab-controls';
  for(const rhythm of RHYTHM_EXAMPLES){const b=document.createElement('button');b.type='button';b.dataset.labRhythm=rhythm.id;b.textContent=rhythm[getLang()==='en'?'en':'tr'];b.addEventListener('click',()=>{state.rhythm=rhythm.id;drawRhythm();});nav.append(b);}
  rhythmSvg=svgNode('svg',{viewBox:'0 0 760 320',role:'img',class:'rs-svg','aria-label':tr('Örnek 6 saniyelik ritim şeridi ve merdiven diyagramı','Illustrative six-second rhythm strip and ladder diagram')});const legend=document.createElement('ul');legend.className='rs-legend';for(const [cls,label] of [['conducted',tr('İletilen P','Conducted P')],['blocked',tr('İletilmeyen P (P×)','Non-conducted P (P×)')],['dissociated',tr('Disosiye P (AV ilişkisi yok)','Dissociated P (no AV relation)')],['ectopic',tr('Ektopik ventrikül vurusu (PVC)','Ectopic ventricular beat (PVC)')],['escape',tr('Kaçış vurusu','Escape beat')]]){const li=document.createElement('li');li.dataset.rs=cls;li.textContent=label;legend.append(li);}rhythmResult=document.createElement('p');rhythmResult.className='ecg-lab-result';rhythmResult.setAttribute('role','status');const disclaimer=document.createElement('p');disclaimer.className='ecg-lab-note';disclaimer.textContent=tr('Şematik karşılaştırma; morfolojiden tek başına tanı konmaz. Tam AV blokta kaçış QRS dar veya geniş olabilir. PVC duraklaması her zaman tam kompanzatuvar değildir.','Schematic comparison; morphology alone is not a diagnosis. Complete-block escape may be narrow or wide. PVC pauses need not always be fully compensatory.');const visual=document.createElement('div');visual.className='ecg-lab-visual';visual.append(rhythmSvg);section.append(title,nav,visual,legend,rhythmResult,disclaimer);root.append(section);drawRhythm();
 }
 function tick(now){if(state.running&&!document.hidden){if(last!==null)state.time+=(now-last)/1000;draw();}last=now;raf=requestAnimationFrame(tick);}
 draw();if(topic==='ch13_arrhythmias')raf=requestAnimationFrame(tick);
 return {sync(external={}){if(external.angle!==undefined)state.angle=external.angle;draw();},destroy(){if(raf!==null)cancelAnimationFrame(raf);root.remove();}};
}
