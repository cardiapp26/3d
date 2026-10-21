import { CASES, DEFAULTS, normalize, simulate, thresholdSweep, programmedSweep, evidence } from './csp-model.mjs';
import { TEXT } from './csp-text.mjs';
const LEADS = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
const TYPE_IDS = ['insufficient','selective','nonselective','lvsp','deep','rv','anodal','none','perforation','off'];
const VALUE = (x, digits = 1) => Number.isFinite(x) ? x.toFixed(digits) : '∅';
const HISTORY_KEY = 'cardia.csp.prototype.history.v1';

export function createCspPanel(doc, { getLang = () => 'tr', storage = null } = {}) {
  let state = { ...DEFAULTS }, result = simulate(state), rows = [], reference = null;
  const ui = { active:false, page:'implant', projection:'septum', instructor:true, blind:false, playing:false, cursor:50, caliper:false, marks:[], zoom:1, scale:4, selected:-1, testKind:null, answer:null, revealed:false };
  let frame = null, lastTime = null, plotted = null, history = [], storageStatus = '';
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const t = () => TEXT[lang()];
  try { storage ||= doc.defaultView?.localStorage; } catch { storage = null; }
  try {
    const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || '[]');
    history = Array.isArray(parsed) ? parsed.filter(x => x && typeof x.date === 'string' && CASES.some(c=>c.id===x.caseId) && TYPE_IDS.includes(x.capture)).slice(-50) : [];
  } catch { history = []; }
  const el = (tag, cls='', attrs={}) => {
    const n = doc.createElement(tag); n.className = cls;
    for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
    return n;
  };
  const bindings = [];
  const txt = (n, get) => { bindings.push([n,get]); return n; };
  const button = (get, fn, attr={}) => { const n=txt(el('button','',{type:'button',...attr}),get); n.addEventListener('click',fn); return n; };
  const root = el('section','csp-lab',{'data-csp':''}); root.hidden=true;
  const heading = el('header','csp-heading');
  const words = el('div'); words.append(txt(el('h2'),()=>t().title),txt(el('p'),()=>t().intro));
  const nav = el('nav','csp-actions');
  const pages = ['implant','analysis','quiz','history'];
  const pageButtons = pages.map(page=>{ const b=button(()=>t()[page],()=>{ui.page=page; if(page==='quiz'){ui.blind=true;ui.instructor=false;ui.projection='rao';ui.revealed=false;ui.answer=null;} render();},{'data-csp-page':page}); nav.append(b); return b; });
  heading.append(words,nav);
  const limits = txt(el('p','csp-note'),()=>t().limit);
  const first = txt(el('p','csp-intro'),()=>t().first);
  const phases = el('ol','csp-phases');
  const phaseNodes = Array.from({length:5},(_,i)=>{const n=txt(el('li'),()=>`${i+1}. ${t().modes[i]}`);phases.append(n);return n;});
  const grid=el('div','csp-grid');
  const anatomyBox=el('section','csp-anatomy');
  const projections=el('div','csp-actions');
  const projectionButtons=Object.keys(t().projections).map(id=>{const b=button(()=>t().projections[id],()=>{ui.projection=id;render();},{'data-csp-projection':id});projections.append(b);return b;});
  const anatomy=el('canvas','csp-anatomy-canvas',{role:'img','data-csp-anatomy':''});
  const anatomyNote=txt(el('p','csp-note'),()=>t().anatomy);
  const groundTruth=el('p','csp-truth',{'data-csp-truth':''});
  anatomyBox.append(projections,anatomy,anatomyNote,groundTruth);
  const monitor=el('section','csp-monitor');
  const toolbar=el('div','csp-actions');
  const play=button(()=>ui.playing?t().freeze:t().play,()=>{ui.playing=!ui.playing;render();},{'data-csp-play':''});
  const caliper=button(()=>t().caliper,()=>{ui.caliper=!ui.caliper;render();},{'data-csp-caliper':''});
  const mark=button(()=>t().mark,()=>addMark(ui.cursor),{'data-csp-mark':''});
  toolbar.append(play,caliper,mark,button(()=>t().clear,()=>{ui.marks=[];render();}),button(()=>t().reference,()=>{reference=result;render();},{'data-csp-reference':''}));
  const zoom=el('select','',{'data-csp-view':'zoom'}), scale=el('select','',{'data-csp-view':'scale'});
  for (const [select,values,key] of [[zoom,[1,2,4],'zoom'],[scale,[2,4,8],'scale']]) {
    const field=el('label');field.append(txt(el('span'),()=>t()[key]));
    for(const value of values){const o=el('option','',{value});o.textContent=String(value);select.append(o);}
    select.addEventListener('change',()=>{ui[key]=Number(select.value);render();});field.append(select);toolbar.append(field);
  }
  const strip=el('canvas','csp-strip',{role:'img','data-csp-strip':''});
  strip.addEventListener('click',event=>{
    if(!plotted)return;const px=event.clientX-strip.getBoundingClientRect().left;
    if(px<plotted.left||px>plotted.right)return;
    ui.cursor=plotted.from+(px-plotted.left)/(plotted.right-plotted.left)*(plotted.to-plotted.from);
    ui.playing=false;if(ui.caliper)addMark(ui.cursor);else render();
  });
  const timeline=el('label','csp-timeline');
  const time=el('input','',{type:'range',min:0,max:500,step:1,'data-csp-time':''});
  const clock=el('output'); time.addEventListener('input',()=>{ui.cursor=Number(time.value);ui.playing=false;render();});
  timeline.append(txt(el('span'),()=>t().cursor),time,clock);
  const caliperText=el('p','csp-caliper-value',{'data-csp-caliper-value':'','aria-live':'polite'});
  const overlayNote=txt(el('p','csp-note'),()=>t().overlay);
  const measure=el('dl','csp-metrics',{'data-csp-metrics':''});
  const unavailable=txt(el('p','csp-note'),()=>t().unavailable);
  monitor.append(txt(el('h3'),()=>t().signal),toolbar,strip,timeline,caliperText,overlayNote,measure,unavailable);
  const consoleBox=el('aside','csp-console');
  const caseField=el('label');const caseSelect=el('select','',{'data-csp-control':'caseId'});
  for(const c of CASES){const o=txt(el('option','',{value:c.id}),()=>c.name[lang()]);caseSelect.append(o);}
  caseField.append(txt(el('span'),()=>t().case),caseSelect);
  caseSelect.addEventListener('change',()=>{state={...DEFAULTS,caseId:caseSelect.value};reference=null;change();});
  const controlNodes={};
  const controls=el('div','csp-controls');
  const definitions={entry:[0,1,.01],angle:[0,85,1],depth:[0,1.15,.01],output:[0,8,.05],pulseWidth:[.2,1,.1],rate:[40,140,1],polarity:['uni','bi']};
  for(const [key,values] of Object.entries(definitions)){
    const label=el('label'),output=el('output');
    const range=key!=='polarity'; const input=el(range?'input':'select','',{'data-csp-control':key});
    if(range){for(const [name,v] of [['type','range'],['min',values[0]],['max',values[1]],['step',values[2]]])input.setAttribute(name,v);}
    else for(const value of values){const o=txt(el('option','',{value}),()=>t()[value]);input.append(o);}
    input.addEventListener(range?'input':'change',()=>{state[key]=range?Number(input.value):input.value;change();});
    label.append(txt(el('span'),()=>t().labels[key]),input,output);controls.append(label);controlNodes[key]={label,input,output};
  }
  const toggles=el('div','csp-actions');
  const pace=button(()=>state.pacing?t().on:t().off,()=>{state.pacing=!state.pacing;change();},{'data-csp-pacing':''});
  const teacher=button(()=>t().instructor,()=>{ui.instructor=!ui.instructor;if(ui.instructor)ui.blind=false;render();},{'data-csp-instructor':''});
  const blind=button(()=>t().blind,()=>{ui.blind=!ui.blind;if(ui.blind){ui.instructor=false;ui.projection='rao';}ui.answer=null;ui.revealed=false;render();},{'data-csp-blind':''});
  toggles.append(pace,teacher,blind);
  const leadControls=el('div','csp-actions');
  leadControls.append(button(()=>t().advance,()=>{
    const factor=Math.cos(state.angle*Math.PI/180)**2*(state.caseId==='scar'?.5:1);
    state.depth=Math.min(1.15,state.depth+.035*factor);change();
  },{'data-csp-advance':''}),button(()=>t().back,()=>{state.depth=Math.max(0,state.depth-.04);change();}),button(()=>t().newSite,()=>{state.depth=0;state.entry=.5;reference=null;change();}));
  const tests=el('div','csp-actions');
  tests.append(button(()=>t().threshold,()=>runTest('threshold'),{'data-csp-test':'threshold'}),button(()=>t().programmed,()=>runTest('s2'),{'data-csp-test':'s2'}),button(()=>t().clearTest,()=>{rows=[];ui.testKind=null;state.s2=null;ui.selected=-1;ui.answer=null;ui.revealed=false;ui.marks=[];reference=null;recompute();}));
  const warning=el('p','csp-warning',{'data-csp-warning':''});
  consoleBox.append(caseField,toggles,controls,leadControls,tests,warning,txt(el('p','csp-note'),()=>t().summary),button(()=>t().reset,()=>{state={...DEFAULTS};rows=[];reference=null;Object.assign(ui,{page:'implant',projection:'septum',instructor:true,blind:false,playing:false,cursor:50,caliper:false,marks:[],zoom:1,scale:4,selected:-1,testKind:null,answer:null,revealed:false});recompute();},{'data-csp-reset':''}));
  grid.append(anatomyBox,monitor,consoleBox);
  const analysis=el('section','csp-analysis',{'data-csp-analysis':''});
  const tableWrap=el('div','csp-table-wrap'); const table=el('table'); const thead=el('thead');const headRow=el('tr');
  for(let i=0;i<4;i++)headRow.append(txt(el('th','',{scope:'col'}),()=>t().testHeaders[i]));
  thead.append(headRow);const tbody=el('tbody');table.append(thead,tbody);tableWrap.append(table);
  const noTest=txt(el('p'),()=>t().noTest);
  analysis.append(txt(el('h3'),()=>t().rows),noTest,tableWrap);
  const quiz=el('section','csp-quiz');
  const question=txt(el('h3'),()=>t().assess);const choices=el('div','csp-actions');const feedback=el('p','',{'aria-live':'polite','data-csp-feedback':''});
  const answers=TYPE_IDS.map(type=>{const b=button(()=>t().types[type],()=>{ui.answer=type;render();},{'data-csp-answer':type});choices.append(b);return b;});
  quiz.append(question,txt(el('p','csp-note'),()=>t().quizNote),choices,feedback,button(()=>t().reveal,()=>{ui.revealed=true;render();},{'data-csp-reveal':''}));
  const historyBox=el('section','csp-history');const historyList=el('ol');const storageNote=el('p','',{'aria-live':'polite'});
  historyBox.append(txt(el('h3'),()=>t().history),txt(el('p','csp-note'),()=>t().logNote),button(()=>t().save,save,{'data-csp-save':''}),storageNote,historyList);
  const footer=el('footer','csp-footer');
  footer.append(txt(el('p'),()=>t().source));
  for(const [url,label] of [['https://doi.org/10.1093/europace/euad043','EHRA 2023'],['https://doi.org/10.1093/europace/euaf050','ESC 2025']]){const a=el('a','',{href:url,target:'_blank',rel:'noopener noreferrer'});a.textContent=label;footer.append(a);}
  root.append(heading,limits,first,phases,grid,analysis,quiz,historyBox,footer);

  function change(){state.s2=null;rows=[];ui.testKind=null;ui.selected=-1;ui.answer=null;ui.revealed=false;ui.marks=[];recompute();}
  function recompute(){state=normalize(state);result=simulate(state);render();}
  function runTest(kind){
    ui.marks=[];ui.answer=null;ui.revealed=false;ui.testKind=kind;ui.selected=-1;ui.page='analysis';
    state=normalize({...state,pacing:true,s2:null});result=simulate(state);
    rows=kind==='threshold'?thresholdSweep({...state,s2:null}):programmedSweep({...state,s2:null});
    reference=result;render();
  }
  function addMark(ms){if(!ui.caliper)return;if(ui.marks.length===2)ui.marks=[];ui.marks.push(Math.round(ms));ui.playing=false;render();}
  function expected(){
    if(['none','off','perforation'].includes(result.capture.type))return result.capture.type;
    return rows.length&&evidence(rows).hasTransition?result.capture.type:'insufficient';
  }
  function save(){
    const item={date:new Date().toISOString(),caseId:state.caseId,capture:result.capture.type,answer:ui.answer,output:state.output,pulseWidth:state.pulseWidth,test:ui.testKind};
    history=[...history,item].slice(-50);
    try{if(!storage)throw new Error('unavailable');storage.setItem(HISTORY_KEY,JSON.stringify(history));storageStatus='saved';}catch{storageStatus='saveFailed';}
    render();
  }
  function renderTable(){
    noTest.hidden=rows.length>0;tableWrap.hidden=!rows.length;
    tbody.replaceChildren(...rows.map((row,i)=>{
      const tr=el('tr');const td=el('td');const b=el('button','',{type:'button','data-csp-row':i,'aria-pressed':ui.selected===i});
      b.textContent=ui.testKind==='s2'?`${row.s2} ms`:`${VALUE(row.output,2)} V`;
      b.addEventListener('click',()=>{
        ui.selected=i;ui.answer=null;ui.revealed=false;ui.marks=[];
        if(ui.testKind==='s2')state.s2=row.s2;else{state.output=row.output;state.s2=null;}
        state=normalize(state);result=simulate(state);render();
      });td.append(b);tr.append(td);
      for(const value of [VALUE(row.metrics.qrsDuration),VALUE(row.metrics.v6Rwpt),ui.blind?'?':t().types[row.capture.type]]){const cell=el('td');cell.textContent=value;tr.append(cell);}
      return tr;
    }));
  }
  function render(){
    for(const [n,get] of bindings)n.textContent=get();
    root.setAttribute('lang',lang());
    pageButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(pages[i]===ui.page)));
    caseSelect.value=state.caseId;caseField.hidden=ui.blind;
    for(const [key,{label,input,output}] of Object.entries(controlNodes)){input.value=String(state[key]);output.textContent=key==='polarity'?'':String(state[key]);label.hidden=key==='depth'&&ui.blind;}
    pace.setAttribute('aria-pressed',String(state.pacing));teacher.setAttribute('aria-pressed',String(ui.instructor));blind.setAttribute('aria-pressed',String(ui.blind));
    play.setAttribute('aria-pressed',String(ui.playing));caliper.setAttribute('aria-pressed',String(ui.caliper));mark.disabled=!ui.caliper;
    zoom.value=String(ui.zoom);scale.value=String(ui.scale);
    projectionButtons.forEach((b,i)=>{const id=Object.keys(t().projections)[i];b.hidden=id==='septum'&&ui.blind;b.setAttribute('aria-pressed',String(id===ui.projection));});
    const phase=state.depth<.05?0:state.depth<.25?1:state.depth<.8?2:rows.length?4:3;
    phaseNodes.forEach((n,i)=>n.setAttribute('aria-current',i===phase?'step':'false'));
    warning.textContent=result.capture.type==='perforation'?t().warning:'';
    groundTruth.hidden=(!ui.instructor||ui.blind)&&!ui.revealed;groundTruth.textContent=`${t().capture}: ${t().types[result.capture.type]}`;
    const metricKeys=['v6Rwpt','v1Rwpt','interpeak','qrsDuration',...(ui.blind?[]:['impedance','coi'])];
    measure.replaceChildren(...metricKeys.flatMap(key=>{const dt=el('dt');dt.textContent=t().metrics[key];const dd=el('dd','',{'data-csp-metric':key});dd.textContent=`${VALUE(result.metrics[key])} ${key==='impedance'?'Ω':key==='coi'?'mV':'ms'}`;return[dt,dd];}));
    analysis.hidden=ui.page==='history';quiz.hidden=!['quiz','analysis'].includes(ui.page);historyBox.hidden=ui.page!=='history';
    renderTable();
    const truth=expected();feedback.textContent=ui.answer?`${ui.answer===truth?t().correct:t().incorrect} ${t().evidence}${ui.revealed?` ${t().types[result.capture.type]}`:''}`:'';
    answers.forEach((b,i)=>b.setAttribute('aria-pressed',String(TYPE_IDS[i]===ui.answer)));
    storageNote.textContent=storageStatus?t()[storageStatus]:'';
    historyList.replaceChildren(...(history.length?history.map(item=>{const n=el('li');const c=CASES.find(c=>c.id===item.caseId);n.textContent=`${item.date} · ${c.name[lang()]} · ${t().types[item.capture]}`;return n;}):[txtOnce(t().empty)]));
    anatomy.setAttribute('aria-label',`${t().anatomy}; ${ui.blind?'?':state.depth}`);strip.setAttribute('aria-label',`${t().signal}; mV, ms`);
    draw();
    if(ui.active&&ui.playing&&frame===null){lastTime=null;frame=globalThis.requestAnimationFrame?.(tick)??null;}
    if(!ui.playing&&frame!==null){globalThis.cancelAnimationFrame?.(frame);frame=null;}
  }
  function txtOnce(value){const n=el('li');n.textContent=value;return n;}
  function context(canvas){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return null;const ctx=canvas.getContext?.('2d');if(!ctx)return null;
    const dpr=Math.min(globalThis.devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0a1411';ctx.fillRect(0,0,w,h);ctx.font='11px system-ui';return{ctx,w,h};
  }
  function drawAnatomy(){
    const c=context(anatomy);if(!c)return;const{ctx,w,h}=c;
    ctx.fillStyle='#b3c6bb';ctx.fillText(t().projections[ui.projection],12,20);
    const cx=w*.5,top=48,bottom=h-40;
    ctx.strokeStyle='#426255';ctx.lineWidth=3;
    if(ui.projection==='septum'&&!ui.blind){
      const left=w*.28,right=w*.7;ctx.fillStyle='#294338';ctx.fillRect(left,top,right-left,bottom-top);
      ctx.fillStyle='#d2dccb';ctx.fillText('RV',left-26,top+15);ctx.fillText('LV',right+10,top+15);
      const y=top+(bottom-top)*state.entry;
      const tip=left+(right-left)*state.depth;
      ctx.strokeStyle='#e5bd68';ctx.beginPath();ctx.moveTo(12,y-20);ctx.lineTo(left,y);ctx.lineTo(tip,y);ctx.stroke();
      ctx.fillStyle='#78dba9';ctx.fillRect(right-14,top,4,bottom-top);
      ctx.fillStyle='#e5bd68';ctx.beginPath();ctx.arc(tip,y,5,0,Math.PI*2);ctx.fill();
    }else{
      ctx.beginPath();ctx.ellipse(cx,h*.53,w*.33,h*.36,ui.projection==='lao'?.3:-.3,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,bottom);ctx.stroke();ctx.setLineDash([]);
      const angle=state.angle*Math.PI/180;
      const y=top+(bottom-top)*state.entry,px=ui.projection==='lao'?cx-w*.15+state.depth*w*.26*Math.cos(angle):cx;
      ctx.strokeStyle='#e5bd68';ctx.beginPath();ctx.moveTo(w*.2,top);ctx.quadraticCurveTo(w*.12,y,px,y);ctx.stroke();
      ctx.fillStyle='#e5bd68';ctx.beginPath();ctx.arc(px,y,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#b3c6bb';ctx.fillText('His / TV',cx+6,top+12);
    }
  }
  function drawStrip(){
    const c=context(strip);if(!c)return;const{ctx,w,h}=c;
    const left=70,right=w-10,top=22,bottom=h-24,from=Math.max(0,Math.min(500-500/ui.zoom,ui.cursor-250/ui.zoom)),to=from+500/ui.zoom;
    plotted={left,right,from,to};const x=ms=>left+(ms-from)/(to-from)*(right-left);
    for(let ms=Math.ceil(from/10)*10;ms<=to;ms+=10){ctx.strokeStyle=ms%50===0?'#294036':'#16281f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(ms),top);ctx.lineTo(x(ms),bottom);ctx.stroke();if(ms%50===0&&ms<to-15){ctx.fillStyle='#839d8d';ctx.fillText(String(ms),x(ms)-5,h-7);}}
    ctx.fillStyle='#839d8d';ctx.fillText('ms',w-25,h-7);ctx.fillText('mV',8,14);
    const series=[...LEADS.map(id=>({id,data:result.leads[id],ref:reference?.leads[id]})),{id:'EGM F',data:result.egm.filtered,ref:reference?.egm.filtered},{id:'EGM U',data:result.egm.unfiltered,ref:reference?.egm.unfiltered}];
    const row=(bottom-top)/series.length;
    series.forEach(({id,data,ref},r)=>{
      const y=top+(r+.5)*row;ctx.fillStyle=['V1','V6'].includes(id)?'#f4cb75':'#b9cec0';ctx.fillText(id,8,y+3);
      ctx.save();ctx.beginPath();ctx.rect(left,top+r*row,right-left,row);ctx.clip();
      for(const [values,color] of [[ref,'#637169'],[data,['V1','V6'].includes(id)?'#f4cb75':r>11?'#65c9bb':'#c5d8ca']]){
        if(!values)continue;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
        for(let i=Math.max(0,Math.floor(from));i<result.times.length&&result.times[i]<=to;i++){const yy=y-values[i]*row/ui.scale;if(i===Math.floor(from))ctx.moveTo(x(result.times[i]),yy);else ctx.lineTo(x(result.times[i]),yy);}ctx.stroke();
      }ctx.restore();
    });
    for(const [ms,color] of [[ui.cursor,'#9cb6a4'],...ui.marks.map(ms=>[ms,'#e9be65'])]){if(ms<from||ms>to)continue;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x(ms),top);ctx.lineTo(x(ms),bottom);ctx.stroke();}
  }
  function draw(){if(!ui.active)return;time.value=String(Math.round(ui.cursor));clock.textContent=`${Math.round(ui.cursor)} ms`;caliperText.textContent=ui.marks.length===2?`Δt = ${Math.abs(ui.marks[1]-ui.marks[0])} ms`:ui.marks.length?`t₁ = ${ui.marks[0]} ms`:'';drawAnatomy();drawStrip();}
  function tick(now){frame=null;if(!ui.active||!ui.playing)return;if(lastTime!==null)ui.cursor=(ui.cursor+Math.min(100,now-lastTime)*.1)%500;lastTime=now;draw();frame=globalThis.requestAnimationFrame?.(tick)??null;}
  return {
    element:root,render,draw,
    setActive(active){ui.active=Boolean(active);root.hidden=!ui.active;if(ui.active)render();else{if(frame!==null)globalThis.cancelAnimationFrame?.(frame);frame=null;lastTime=null;}},
    getState:()=>({...state,ui:{...ui,marks:[...ui.marks]}}),getResult:()=>result,getReference:()=>reference,getRows:()=>rows,
    getHistory:()=>history.map(x=>({...x}))
  };
}
