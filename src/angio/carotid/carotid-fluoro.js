import { ARCH_TYPES, ARCH_VARIANTS, calculateNascet } from './carotid-data.js';

// Original teaching centerlines; not reconstructed patient anatomy.
// Model axes: +X patient left, +Y cranial, +Z posterior (descending aorta, ICA and
// basilar sit at +Z). The projector flips Z to the detector-facing (anterior) axis
// used by the coronary and peripheral engines, so LAO moves posterior structures
// (spine, descending aorta) to image right and opens the arch.
const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const point = (x, y, z = 0) => [x, y, z];
const line = (id, points, width = .055, extra = {}) => ({ id, points, width, ...extra });
const scope = {
  tr: 'Özgün 3B şematik skopi · Hasta görüntüsü değil · Ölçeksiz',
  en: 'Original 3D schematic fluoroscopy · Not patient imaging · Not to scale'
};

function archModel(options) {
  const variant = ARCH_VARIANTS.some(v => v.id === options.archVariant) ? options.archVariant : 'normal';
  const type = ARCH_TYPES.some(v => v.id === options.archType) ? options.archType : 'I';
  const offset = { I: 0, II: .13, III: .28 }[type];
  const ascending = point(-.62, -.05, -.23);
  const apex = point(-.07, .61, .02);
  const distal = point(.73, -.1, .34);
  const bOrigin = point(-.5 - offset * .28, .34 - offset, -.13);
  const lOrigin = point(-.12 - offset * .5, .59 - offset * .2, .01);
  const sOrigin = point(.34, .48, .22);
  const fork = point(-.62, .92, -.11);
  const a = [point(-.62, -1.1, -.23), ascending, bOrigin, point(-.3, .54, -.06), lOrigin, apex, point(.15, .58, .13), sOrigin, point(.59, .27, .3), distal, point(.73, -1.1, .35)];
  const vessels = [line('ascending-aorta', a.slice(0, 2), .19), line('aortic-arch', a.slice(1, -1), .19), line('descending-aorta', a.slice(-2), .18)];
  let rightSub = [fork, point(-.95, .77, -.02), point(-1.25, .56, .02)];
  let leftSub = [sOrigin, point(.76, .83, .2), point(1.25, .57, .15)];
  if (variant === 'lusoria') {
    vessels.push(line('rcca', [bOrigin, point(-.67, .91, -.1), point(-.66, 1.28, -.1)], .068));
    rightSub = [distal, point(.25, .03, .62), point(-.45, .32, .63), point(-1.25, .56, .02)];
  } else {
    vessels.push(line('bct', [bOrigin, point(-.59, .68, -.15), fork], .10));
    vessels.push(line('rcca', [fork, point(-.66, 1.28, -.1)], .068));
  }
  const lccaOrigin = variant === 'common' ? bOrigin : variant === 'lcca-bct' ? point(-.59, .68, -.15) : lOrigin;
  vessels.push(line('lcca', [lccaOrigin, point(-.04, .92, .02), point(-.04, 1.28, .03)], .068));
  vessels.push(line('rsub', rightSub, .08), line('lsub', leftSub, .08));
  for (const [side, path] of [['r', rightSub], ['l', leftSub]]) {
    const sign = side === 'r' ? -1 : 1;
    const root = path[1];
    const keys = ['vertebral', 'internal-thoracic', 'thyrocervical', 'costocervical'];
    keys.forEach((key, i) => {
      const origin = mix(root, path.at(-1), .12 + i * .20);
      const end = key === 'internal-thoracic' ? point(origin[0], -.12, -.2)
        : point(origin[0] + sign * (i ? .14 : -.10), 1.22 - i * .09, .30 + i * .08);
      const start = side === 'l' && key === 'vertebral' && variant === 'left-vertebral' ? point(.15, .58, .13) : origin;
      // Insert exact branch roots into the parent centerline, avoiding gaps.
      if (start === origin) path.splice(path.length - 1, 0, origin);
      // Direct left vertebral root already coincides with an arch centerline node.
      vessels.push(line(`${side}-${key}`, [start, mix(start, end, .5), end], key === 'vertebral' ? .045 : .027));
    });
  }
  if (variant === 'right-arch') {
    // A right arch with aberrant LSCA, matching the companion anatomy panel.
    for (const vessel of vessels) {
      vessel.points = vessel.points.map(p => [-p[0], p[1], p[2]]);
      vessel.id = ({rcca:'lcca',lcca:'rcca',rsub:'lsub',lsub:'rsub'})[vessel.id] || vessel.id.replace(/^r-/, 'TEMP-').replace(/^l-/, 'r-').replace(/^TEMP-/, 'l-');
    }
    const bct = vessels.find(v => v.id === 'bct');
    const lcca = vessels.find(v => v.id === 'lcca');
    lcca.points = [bct.points[0], ...lcca.points];
    vessels.splice(vessels.indexOf(bct), 1);
    const lsub = vessels.find(v => v.id === 'lsub');
    lsub.points = [point(-.73, -.1, .34), point(-.25, .03, .62), point(.45, .32, .63), point(1.25, .56, .02)];
    // Reconnect small subclavian branches to the new retro-oesophageal route.
    vessels.filter(v => v.id.startsWith('l-')).forEach((v, i) => { v.points[0] = mix(lsub.points[2], lsub.points[3], .12 + i * .20); });
  }
  return { vessels, archType: type, archVariant: variant };
}

function cervicalModel() {
  const fork = point(0, -.42, 0);
  const eca = [fork, point(-.1, -.10, -.17), point(-.14, .27, -.24), point(-.12, .65, -.23), point(-.11, .99, -.21)];
  const vessels = [line('cca', [point(0, -1.2, 0), fork], .125), line('bulb', [fork, point(.09, -.22, .09)], .15), line('cervical-ica', [point(.09, -.22, .09), point(.16, .2, .2), point(.15, .67, .25), point(.10, 1.25, .26)], .095), line('eca', eca, .078, { selectable: false })];
  const ids = ['sup-thyroid', 'asc-pharyngeal', 'lingual', 'facial', 'occipital', 'post-auricular', 'maxillary', 'superficial-temporal'];
  ids.forEach((id, i) => {
    const t = i < 6 ? .12 + i * .14 : 1;
    const index = Math.min(eca.length - 2, Math.floor(t * (eca.length - 1)));
    const root = mix(eca[index], eca[index + 1], t * (eca.length - 1) - index);
    const anterior = [0,2,3,6].includes(i);
    const end = point(root[0] + (i === 1 ? .15 : anterior ? -.55 : .48), root[1] + (i === 0 ? -.28 : .27), anterior ? -.55 : .5);
    if (i === 7) { end[0] = root[0] - .1; end[1] = 1.35; end[2] = -.25; }
    vessels.push(line(id, [root, mix(root, end, .5), end], .032));
  });
  return { vessels };
}

function icaModel() {
  const p = [point(-.3,-1.2,.12),point(-.25,-.5,.2),point(.16,-.31,.28),point(.2,-.14,.12),point(.09,.58,-.24),point(.16,.76,-.2),point(.3,.92,-.05),point(.38,1.1,.04)];
  const vessels = p.slice(0,-1).map((start,i) => line(`c${i+1}`, i === 3 ? [start, point(.48,.02,.1),point(.52,.34,-.1),point(.25,.42,-.22),p[4]] : [start,p[i+1]], .085));
  vessels.push(line('c7', [p[7],point(.8,1.2,.14)], .055),line('c7',[p[7],point(.0,1.35,.12)],.05));
  return { vessels };
}

function circleModel() {
  const vessels = [];
  const add = (id, points, width=.055) => vessels.push(line(id,points,width));
  const top = point(0,-.25,.36);
  add('basilar',[point(0,-1.05,.4),top],.08);
  add('vertebral-circle',[point(-.36,-1.45,.33),point(0,-1.05,.4)],.065);
  add('vertebral-circle',[point(.36,-1.45,.33),point(0,-1.05,.4)],.065);
  for (const sign of [-1,1]) {
    const terminal=point(sign*.52,.4,-.14), posterior=point(sign*.45,-.15,.3), anterior=point(sign*.09,.91,-.32), fork=point(sign*.96,.41,-.02);
    add('p1',[top,posterior]); add('pcomm',[posterior,terminal],.04);
    add('a1',[terminal,point(sign*.29,.73,-.27),anterior]);
    add('a2',[anterior,point(sign*.1,1.25,-.1)],.05);
    add('m1',[terminal,fork],.07);
    for (const s of [-1,1]) {
      const split=point(sign*1.08,.41+s*.13,.02), insula=point(sign*1.24,.41+s*.42,.22), operculum=point(sign*1.3,.41+s*.67,-.08);
      add('mca-bif',[fork,split],.05); add('m2',[split,insula],.045); add('m3',[insula,operculum],.035);
      add('m4',[operculum,point(sign*1.4,.41+s*.85,-.35)],.025);
    }
  }
  add('acomm',[point(-.09,.91,-.32),point(.09,.91,-.32)],.04);
  // Persistent embryonic variants are optional anatomy in the companion panel,
  // not part of the normal circle represented in this projection.
  return { vessels, omitted: ['primitive'] };
}

function stenosisModel(options) {
  const angle=clamp(options.angle,0,160,25)*Math.PI/180;
  const valid=calculateNascet(options.residual ?? 1.2, options.distal ?? 4) !== null;
  const ratio=valid ? Number(options.residual ?? 1.2)/Number(options.distal ?? 4) : 1;
  const start=point(.02,-.12,.06);
  const distal = options.coil ? [start,point(.43,.1,.18),point(.5,.56,.32),point(.08,.77,.36),point(-.22,.45,.15),point(.1,.27,-.12),point(.45,.57,-.18),point(.23,1.16,-.16)]
    : [start,point(Math.sin(angle)*.38,.4,.12),point(Math.sin(angle*1.2)*.6,1.16,.2)];
  return { vessels:[line('stenosis-cca',[point(0,-1.2,0),point(0,-.5,0)],.13),line('stenosis-lesion',[point(0,-.5,0),point(.01,-.31,.03),start],.10,{radii:[1,ratio,1],occluded:valid&&ratio===0}),line('stenosis-distal',distal,.09)], measurementValid:valid, nearOcclusion:Boolean(options.nearOcclusion) };
}

export function buildCarotidModel(options = {}) {
  const view=['arch','cervical','ica','circle','stenosis'].includes(options.view) ? options.view : 'arch';
  const data=view==='arch' ? archModel(options) : view==='cervical' ? cervicalModel() : view==='ica' ? icaModel() : view==='circle' ? circleModel() : stenosisModel(options);
  insertJunctions(data.vessels);
  return { view, ...data, scope, calibrated:false };
}

export function projectCarotidPoint(p, alpha=0, beta=0) {
  const a=clamp(alpha,-90,90,0)*Math.PI/180, b=clamp(beta,-40,40,0)*Math.PI/180;
  const anterior=-p[2];
  const x=p[0]*Math.cos(a)-anterior*Math.sin(a), z=p[0]*Math.sin(a)+anterior*Math.cos(a);
  const y=p[1]*Math.cos(b)-z*Math.sin(b), depth=p[1]*Math.sin(b)+z*Math.cos(b);
  // depth > 0 is nearer the detector and so magnified less than source-side structures.
  const perspective=9/(9+depth*.35);
  return {u:x*perspective,v:-y*perspective,depth,perspective};
}

// Interpolating cubic, evaluated in 3D before C-arm projection. Every control
// vertex remains an exact sample, so inserted branch junctions stay connected.
export function sampleCarotidCenterline(points, steps = 12) {
  if (points.length < 2) return points.map(p => [...p]);
  const samples = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const p0 = points[i - 1] || p1.map((v, k) => 2 * v - p2[k]);
    const p3 = points[i + 2] || p2.map((v, k) => 2 * v - p1[k]);
    for (let j = 0; j < steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t;
      samples.push(p1.map((v, k) => .5 * ((2 * v) + (-p0[k] + p2[k]) * t
        + (2 * p0[k] - 5 * v + 4 * p2[k] - p3[k]) * t2
        + (-p0[k] + 3 * v - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  samples.push([...points.at(-1)]);
  return samples;
}

function insertJunctions(vessels) {
  const roots = vessels.map(v => v.points[0]);
  for (const vessel of vessels) {
    if (vessel.radii) continue;
    const connected = [];
    for (let i = 1; i < vessel.points.length; i++) {
      const a = vessel.points[i - 1], b = vessel.points[i];
      const delta = b.map((v, k) => v - a[k]);
      const length2 = delta.reduce((n, v) => n + v * v, 0);
      const joins = roots.map(p => ({ p, t: p.reduce((n, v, k) => n + (v - a[k]) * delta[k], 0) / (length2 || 1) }))
        .filter(({p, t}) => t > 1e-6 && t < 1 - 1e-6 && Math.hypot(...p.map((v, k) => v - a[k] - t * delta[k])) < 1e-6)
        .sort((x, y) => x.t - y.t);
      connected.push(a, ...joins.filter((j, n) => !n || Math.abs(j.t - joins[n - 1].t) > 1e-6).map(j => j.p));
    }
    vessel.points = [...connected, vessel.points.at(-1)];
  }
}

export function hitTestCarotid(regions, x, y) {
  let hit=null, nearest=Infinity;
  for(const region of regions) for(let i=1;i<region.points.length;i++) {
    const a=region.points[i-1],b=region.points[i], dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
    const distance=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
    if(distance<=Math.max(6,region.width/2+3)&&distance<nearest) {nearest=distance;hit=region.id;}
  }
  return hit;
}

export function renderCarotidFluoro(canvas, options={}) {
  const model=buildCarotidModel(options), alpha=clamp(options.alpha,-90,90,0),beta=clamp(options.beta,-40,40,0),contrast=clamp(options.contrast,0,1,1);
  const imagingMode=['dsa','fluoro','roadmap'].includes(options.imagingMode)?options.imagingMode:'dsa';
  const ctx=canvas?.getContext?.('2d');
  if(!ctx) return {model,hitRegions:[],alpha,beta,contrast,imagingMode,scope};
  // pixelRatio backs the canvas at device resolution; hit regions stay in logical units.
  const pixelRatio=clamp(options.pixelRatio,1,4,1);
  const w=(canvas.width||640)/pixelRatio,h=(canvas.height||480)/pixelRatio,scale=Math.min(w*.28,h*.27);
  ctx.setTransform?.(pixelRatio,0,0,pixelRatio,0,0);
  ctx.clearRect(0,0,w,h); ctx.fillStyle=imagingMode==='dsa'?'#d8dcdf':imagingMode==='roadmap'?'#abb2b8':'#bfc5c9';ctx.fillRect(0,0,w,h);
  const hitRegions=[];
  const background = imagingMode === 'dsa' ? [216,220,223] : imagingMode === 'roadmap' ? [171,178,184] : [191,197,201];
  const vesselColor = `rgb(${background.map((v,i) => Math.round(v + ([15,20,24][i] - v) * .82 * contrast)).join(',')})`;
  if(contrast>0) for(const vessel of [...model.vessels].sort((a,b)=>projectCarotidPoint(a.points[0],alpha,beta).depth-projectCarotidPoint(b.points[0],alpha,beta).depth)) {
    const samples=sampleCarotidCenterline(vessel.points);
    const projected=samples.map(p=>{const q=projectCarotidPoint(p,alpha,beta);return {x:w/2+q.u*scale,y:h/2+q.v*scale};});
    const selected = (options.selected || options.selectedId) === vessel.id;
    ctx.lineCap='round';ctx.lineJoin='round';
    const drawPath = (color, extraWidth=0) => {
      ctx.strokeStyle=color;
      if (!vessel.radii) {
        ctx.lineWidth=vessel.width*scale+extraWidth;
        ctx.beginPath();ctx.moveTo(projected[0].x,projected[0].y);
        projected.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();
        return;
      }
      for(let i=1;i<projected.length;i++) {
        const segment=Math.floor((i-1)/12),t=((i-1)%12+.5)/12;
        const r0=vessel.radii[segment]??1,r1=vessel.radii[segment+1]??1,r=r0+(r1-r0)*t;
        if(r<.025 || (vessel.occluded && r<.12)) continue;
        ctx.lineCap=vessel.occluded?'butt':'round';ctx.lineWidth=vessel.width*scale*r+extraWidth;
        ctx.beginPath();ctx.moveTo(projected[i-1].x,projected[i-1].y);ctx.lineTo(projected[i].x,projected[i].y);ctx.stroke();
      }
    };
    // Opaque grayscale avoids cumulative dark seams at overlapping strokes.
    if(selected) drawPath(`rgb(${background.map(v=>Math.round(v+(255-v)*contrast*.8)).join(',')})`,Math.max(2,scale*.014));
    drawPath(vesselColor);
    if(vessel.selectable!==false) hitRegions.push({id:vessel.id,points:projected,width:vessel.width*scale});
  }
  ctx.fillStyle='#222b32';ctx.font=`${Math.max(10,Math.min(13,w/50))}px sans-serif`;ctx.textAlign='left';
  const lr=Math.round(alpha)===0?'AP':`${alpha>0?'LAO':'RAO'} ${Math.abs(Math.round(alpha))}°`;
  const cc=Math.round(beta)===0?'':` · ${beta>0?'CRA':'CAU'} ${Math.abs(Math.round(beta))}°`;
  ctx.fillText(`${imagingMode.toUpperCase()} · ${lr}${cc}`,14,24);
  const lang=options.lang==='en'?'en':'tr';
  // Two short lines remain legible on narrow canvases.
  ctx.fillText(lang==='tr'?'Özgün 3B şematik skopi':'Original 3D schematic fluoroscopy',14,h-30);
  ctx.fillText(lang==='tr'?'Hasta görüntüsü değil · Ölçeksiz':'Not patient imaging · Not to scale',14,h-14);
  if(model.nearOcclusion||model.measurementValid===false) ctx.fillText(lang==='tr'?(model.nearOcclusion?'Distal kollaps modellenmez; yüzde güvenilmez':'Geçersiz ölçüm; darlık gösterilmez'):(model.nearOcclusion?'Distal collapse not modeled; percentage unreliable':'Invalid measurement; stenosis not shown'),14,44);
  if(model.omitted?.length) ctx.fillText(lang==='tr'?'Normal dolaşım; primitif varyantlar gösterilmez':'Normal circulation; primitive variants omitted',14,44);
  return {model,hitRegions,alpha,beta,contrast,imagingMode,scope};
}
