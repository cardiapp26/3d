import { ecgSample, ecgTiming } from './guyton-render.js';
import { CHEST_LEADS, projectLead, axisCategory, reentryMetrics, ringSnapshot, stepProjections, RHYTHM_EXAMPLES, rhythmSample, rhythmEvents } from './ecg-lab-model.js';
import { ventricularSample } from '../physiology-model.js';
import './ecg-labs.css';
const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(attrs.stroke)n.style.stroke=attrs.stroke;if(text)n.textContent=text;return n;};
const path=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
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
 if(topic==='ch12_axis')sliders.angle=slider('angle',tr('Frontal QRS aksı (°)','Frontal QRS axis (°)'),-180,180);
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
 function heart(step=-1){svg.append(svgNode('path',{d:'M135 110C85 40 28 96 62 160L135 238L209 160C242 96 185 40 135 110Z',class:'lab-heart'}));const pts=[[132,123],[136,201],[185,158],[139,91],[135,165]];pts.slice(0,step===4?4:Math.max(0,step+1)).forEach(([cx,cy],i)=>svg.append(svgNode('circle',{cx,cy,r:i===step?20:13,class:i===step?'lab-active':'lab-activated'})));text(135,272,tr('Aktivasyon şeması','Activation schematic'),{'text-anchor':'middle'});}
 function draw(){
  svg.replaceChildren();for(const [key,{input,out}] of Object.entries(sliders)){input.value=state[key];out.textContent=state[key];}
  controls.querySelectorAll('[data-lab-control]').forEach(b=>{const [key,...parts]=b.dataset.labControl.split('-');b.setAttribute('aria-pressed',String(String(state[key])===parts.join('-')));});
  if(topic==='ch11_basics')drawBasics();if(topic==='ch11_leads')drawLeads();if(topic==='ch12_vectors')drawVectors();if(topic==='ch12_axis')drawAxis();if(topic==='ch12_injury')drawInjury();if(topic==='ch13_arrhythmias')drawRing();
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
  CHEST_LEADS.forEach((l,i)=>{const x=30+i*95,y=340;line([[x,y],[x+10,y],[x+14,y+4],[x+24,y-l.r*45],[x+36,y-l.s*45],[x+52,y],[x+70,y]],'lab-trace',{stroke:l.id===state.lead?'#f2b651':'#789dab'});text(x+30,407,l.id,{'text-anchor':'middle'});});
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
  line([[60,340],[180,340],[200,340-v*50],[220,340],[540,340]],'lab-trace');text(300,395,`${state.lead}: ${v.toFixed(2)} · ${angle}°`,{'text-anchor':'middle'});
  result.textContent=`${state.lead}: ${positive}(+) − ${negative}(−)`;
  note.textContent=tr('Augmented derivasyonların eksi kutbu diğer iki ekstremitenin ortalamasıdır. Altın çizgi ölçüm yönünü gösterir. Üstteki açı kaydırıcısı frontal izdüşümü değiştirir; genlikler aynı ideal dipol ölçeğinde göreli örneklerdir. Netter Levha 2-16.','Augmented leads reference the average of the other two limbs. Gold line shows measurement direction. Angle slider above changes frontal projection; amplitudes are relative examples on the same ideal-dipole scale. Netter Plate 2-16.');
 }
 function drawVectors(){
  const {step,index}=getExternal(),waves=stepProjections(step);heart(index);
  const steps=getExternal().steps,keys=['lead1','lead2','lead3','v1','v6'];
  keys.forEach((key,j)=>{const y=64+j*60;line([[275,y],[570,y]],'lab-divider');const values=steps.map(s=>stepProjections(s)[key]);line([[275,y],...values.map((v,i)=>[290+i*60,y-v*24]),[560,y]],'lab-trace');text(248,y+4,['I','II','III','V1','V6'][j],{'text-anchor':'end'});svg.append(svgNode('circle',{cx:290+index*60,cy:y-waves[key]*24,r:5,class:'lab-active'}));});
  line([[290+index*60,35],[290+index*60,325]],'lab-cursor');text(410,356,tr('QRS içi örnek zaman noktaları','Example times within QRS'),{'text-anchor':'middle'});
  result.textContent=`${step.time} · ${step.name[getLang()==='en'?'en':'tr']} · I + III − II = ${(waves.lead1+waves.lead3-waves.lead2).toFixed(3)}`;
  note.textContent=tr('Frontal I–II–III izleri aynı vektörün izdüşümünden hesaplanır. V1/V6 bağımsız yatay düzlem öğretim örnekleridir; frontal aksın doğrudan izdüşümü değildir. Noktalar arası çizgi ölçülmüş EKG değildir.','Frontal I–II–III traces project the same vector. V1/V6 are independent horizontal-plane teaching examples, not direct frontal-axis projections. Connecting sampled points does not produce a measured ECG.');
 }
 function drawAxis(){
  const a=state.angle,category=axisCategory(a),names={normal:tr('Normal aralık','Normal range'),left:tr('Sol aks sapması','Left axis deviation'),right:tr('Sağ aks sapması','Right axis deviation'),extreme:tr('Ekstrem aks','Extreme axis')};
  const cx=170,cy=185,r=125;svg.append(svgNode('circle',{cx,cy,r,fill:'#0e2637',stroke:'#496777'}));
  line([[cx-r,cy],[cx+r,cy]],'lab-axis');line([[cx,cy-r],[cx,cy+r]],'lab-axis');text(cx+r+7,cy,'I 0°');text(cx,cy+r+25,'aVF +90°',{'text-anchor':'middle'});
  const rad=a*Math.PI/180,xx=cx+r*.85*Math.cos(rad),yy=cy+r*.85*Math.sin(rad);line([[cx,cy],[xx,yy]],'lab-measure');svg.append(svgNode('circle',{cx:xx,cy:yy,r:6,class:'lab-active'}));
  [['I',0],['aVF',90],['II',60]].forEach(([name,angle],i)=>{const v=projectLead(a,1,angle),y=100+i*100;line([[370,y],[566,y]],'lab-divider');line([[370,y],[425,y],[436,y-v*38],[450,y],[560,y]],'lab-trace');text(370,y-35,`${name}: ${Math.abs(v)<.01?'≈0':v>0?'+':'−'} (${v.toFixed(2)})`);});
  result.textContent=`${a}° · ${names[category]}`;note.textContent=tr('I+/aVF− bölgesinde II pozitifse −30° ile 0° arası normal olabilir; II negatifse sol aks sapmasını destekler. Aks tek başına hipertrofi veya dal bloğu tanısı koydurmaz; RBBB/LBBB normal aksla da görülebilir.','With I+/aVF−, positive II may indicate normal −30° to 0°; negative II supports left axis deviation. Axis alone does not diagnose hypertrophy or bundle block; RBBB/LBBB can have a normal axis.');
 }
 function drawInjury(){
  const anterior=getExternal().caseId!=='posterior_mi',shift=state.shift;
  const leads=anterior?[['V2',shift],['V3',shift],['V4',shift],['III',-shift*.5]]:[['V1',-shift],['V2',-shift],['V3',-shift],['V7–V9',shift]];
  leads.forEach(([name,st],i)=>{const y=40+i*85;grid(55,y,495,62);const base=waveform(55,y,495,62,{stElev:st,pxSec:350,gain:36},'#293c43');const timing=ecgTiming({stElev:st}),jX=55+timing.j*350;line([[55,base],[550,base]],'lab-baseline');svg.append(svgNode('circle',{cx:jX,cy:base-st*36,r:4,class:'lab-active'}));if(state.reference==='J')line([[jX,base-st*36],[jX+100,base-st*36]],'lab-measure');text(12,y+30,name);text(557,y+34,`${st>=0?'+':''}${st.toFixed(2)}`);});
  result.textContent=tr('TP: izoelektrik bazal referans · J: QRS sonu / ST başlangıcı','TP: isoelectric baseline reference · J: QRS end / ST onset');
  note.textContent=tr('J noktası evrensel “gerçek sıfır” değildir. ST, uygun TP/PR bazal çizgisine göre değerlendirilir. Örnek kaymalar tanı eşiği değildir; ardışık derivasyon, yaş/cinsiyet, semptom ve seri EKG gerekir. Posterior örnekte inferior elevasyon zorunlu değildir; V7–V9 ek bakış sağlar.','J point is not universal “true zero”. Evaluate ST against appropriate TP/PR baseline. Example shifts are not diagnostic cutoffs; contiguous leads, age/sex, symptoms and serial ECG matter. Inferior elevation is not required in posterior involvement; V7–V9 provide an additional view.');
 }
 function drawRing(){
  const m=reentryMetrics(state.length,state.velocity,state.erp,state.block),cx=230,cy=200,r=120;
  svg.append(svgNode('circle',{cx,cy,r,class:'lab-ring'}));
  const snap=ringSnapshot(m,state.time*1000,state.erp,state.block),angle=-Math.PI/2+snap.progress*Math.PI*2;
  if(state.block){
    if(snap.tail>0){const tail=angle-snap.tail*Math.PI*2;line(Array.from({length:121},(_,i)=>{const a=tail+i/120*(angle-tail);return [cx+r*Math.cos(a),cy+r*Math.sin(a)];}),'lab-refractory');}
    if(snap.head)svg.append(svgNode('circle',{cx:cx+r*Math.cos(angle),cy:cy+r*Math.sin(angle),r:12,class:'lab-active'}));
    text(230,53,tr('Başlangıçta tek yönlü blok','Initiating unidirectional block'),{'text-anchor':'middle'});
  } else {
    if(snap.collision)svg.append(svgNode('circle',{cx,cy:cy+r,r:14,class:'lab-active'}));
    if(snap.head)for(const sign of [-1,1]){const a=-Math.PI/2+sign*snap.progress*Math.PI;svg.append(svgNode('circle',{cx:cx+r*Math.cos(a),cy:cy+r*Math.sin(a),r:12,class:'lab-active'}));}
    text(230,53,tr('İki dalga → çarpışma → sönme','Two waves → collision → extinction'),{'text-anchor':'middle'});
  }
  text(230,192,`λ ${m.wavelengthCm.toFixed(1)} cm`,{'text-anchor':'middle'});text(230,217,`L ${state.length} cm`,{'text-anchor':'middle'});
  text(405,145,tr('Tur süresi','Loop time'));text(405,170,`${m.loopMs.toFixed(0)} ms`);text(405,218,'ERP');text(405,242,`${state.erp} ms`);text(405,290,tr('Boşluk','Gap'));text(405,314,`${m.gapCm.toFixed(1)} cm`);
  result.textContent=`λ = CV × ERP = ${m.wavelengthCm.toFixed(1)} cm · ${m.possible?tr('Sürme koşulu mümkün','Sustaining condition possible'):tr('Bu modelde sürmez','Not sustained in this model')}`;
  note.textContent=tr('Mor: refrakter kuyruk · altın: dalga başı · gri: uyarılabilir doku. Basit homojen halka: tek yönlü başlatma + L > λ. Uzun yol, yavaş iletim ve kısa ERP üç ayrı zorunlu koşul değil, dalga boyunu/yol oranını etkileyen etmenlerdir. Fibrilasyon veya hasta ritmi modellenmez.','Purple: refractory tail · gold: wavefront · gray: excitable tissue. Simple homogeneous ring: unidirectional initiation + L > λ. Long path, slow conduction and short ERP are factors affecting wavelength/path ratio, not three separate mandatory conditions. No fibrillation or patient rhythm is modeled.');
  root.querySelector('[data-lab-action=play]').textContent=state.running?tr('Duraklat','Pause'):tr('Başlat','Play');
 }
 let rhythmSvg, rhythmResult;
 function drawRhythm(){
  if(!rhythmSvg)return;
  rhythmSvg.replaceChildren();
  rhythmSvg.append(svgNode('rect',{x:40,y:35,width:520,height:110,fill:'#fff7ef'}));
  for(let sec=0;sec<=6;sec++){rhythmSvg.append(svgNode('path',{d:`M${40+sec/6*520} 35V145`,class:'lab-grid-major'}),svgNode('text',{x:40+sec/6*520,y:170,'text-anchor':'middle'},`${sec}s`));}
  rhythmSvg.append(svgNode('path',{d:path(Array.from({length:1561},(_,i)=>[40+i/1560*520,112-rhythmSample(i/1560*6,state.rhythm)*45])),class:'lab-trace',stroke:'#243a45'}));
  const events=rhythmEvents(state.rhythm);events.p.forEach(at=>rhythmSvg.append(svgNode('text',{x:40+at/6*520,y:30,'text-anchor':'middle'},'P')));events.q.forEach(({at,pvc})=>rhythmSvg.append(svgNode('text',{x:40+at/6*520,y:190,'text-anchor':'middle'},pvc?'PVC':'R')));
  const descriptions={sinus:tr('P → QRS, sabit PR, düzenli RR','P → QRS, fixed PR, regular RR'),first:tr('Her P iletilir; PR örneği 280 ms','Every P conducts; example PR 280 ms'),wenckebach:tr('PR: 160 → 200 → 240 ms; ardından iletilmeyen P','PR: 160 → 200 → 240 ms; then a nonconducted P'),complete:tr('P ve kaçış QRS dizileri bağımsız; bu örnekte geniş kaçış','Independent P and escape-QRS sequences; wide escape in this example'),pvc:tr('Erken geniş vuru; örnek tam kompanzatuvar duraklama','Premature wide beat; illustrative full compensatory pause'),af:tr('Organize P yok; düzensiz RR','No organized P; irregular RR'),flutter:tr('Atriyal testere dişi; örnek düzenli 3:1 iletim','Atrial sawtooth pattern; illustrative regular 3:1 conduction')};
  const r=RHYTHM_EXAMPLES.find(x=>x.id===state.rhythm);rhythmResult.textContent=`${descriptions[state.rhythm]} · Netter ${tr('PDF s.','PDF p.')} ${r.pdf}`;
  root.querySelectorAll('[data-lab-rhythm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.labRhythm===state.rhythm)));
 }
 if(topic==='ch13_arrhythmias'){
  const section=document.createElement('section');section.className='ecg-rhythm-gallery';const title=document.createElement('h3');title.textContent=tr('Ritim şeridini karşılaştır','Compare rhythm strips');const nav=document.createElement('div');nav.className='ecg-lab-controls';
  for(const rhythm of RHYTHM_EXAMPLES){const b=document.createElement('button');b.type='button';b.dataset.labRhythm=rhythm.id;b.textContent=rhythm[getLang()==='en'?'en':'tr'];b.addEventListener('click',()=>{state.rhythm=rhythm.id;drawRhythm();});nav.append(b);}
  rhythmSvg=svgNode('svg',{viewBox:'0 0 600 215',role:'img','aria-label':tr('Örnek 6 saniyelik ritim şeridi','Illustrative six-second rhythm strip')});rhythmResult=document.createElement('p');rhythmResult.className='ecg-lab-result';rhythmResult.setAttribute('role','status');const disclaimer=document.createElement('p');disclaimer.className='ecg-lab-note';disclaimer.textContent=tr('Şematik karşılaştırma; morfolojiden tek başına tanı konmaz. Tam AV blokta kaçış QRS dar veya geniş olabilir. PVC duraklaması her zaman tam kompanzatuvar değildir.','Schematic comparison; morphology alone is not a diagnosis. Complete-block escape may be narrow or wide. PVC pauses need not always be fully compensatory.');const visual=document.createElement('div');visual.className='ecg-lab-visual';visual.append(rhythmSvg);section.append(title,nav,visual,rhythmResult,disclaimer);root.append(section);drawRhythm();
 }
 function tick(now){if(state.running&&!document.hidden){if(last!==null)state.time+=(now-last)/1000;draw();}last=now;raf=requestAnimationFrame(tick);}
 draw();if(topic==='ch13_arrhythmias')raf=requestAnimationFrame(tick);
 return {sync(external={}){if(external.angle!==undefined)state.angle=external.angle;draw();},destroy(){if(raf!==null)cancelAnimationFrame(raf);root.remove();}};
}
