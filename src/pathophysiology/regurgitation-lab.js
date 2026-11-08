// Acute vs chronic mitral and aortic regurgitation: four apical long-axis
// schematics beating on the shared cycle clock, regurgitant jets driven by the
// transvalvular pressure gradient, a live pressure strip per panel and an
// acute-to-chronic remodeling tween. Parameter sets are didactic, not patient data.
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';

// Node (scripts/test-pathophysiology.mjs) cannot load CSS; the browser build pulls it in here.
if (typeof document !== 'undefined') import('./regurgitation.css');

const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const frac = x => x - Math.floor(x);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const n1 = x => (Math.round(x * 10) / 10).toString();
const DEG = Math.PI / 180;

const CX = 140, BY = 150, VIEW_W = 280, VIEW_H = 238;
const TRACE = { x0: 30, x1: 272, y0: 74, y1: 8, max: 170, samples: 120 };
const COLORS = Object.freeze({ lv: '#c92a2a', la: '#1971c2', ao: '#e67700' });
const SERIES = Object.freeze({ mr: ['lv', 'la'], ar: ['lv', 'ao', 'la'] });
const PARTICLES = 14;

/** Phase windows of the shared reference cycle: ivc0, ej0, ej1 (isovolumic relaxation runs to 1). */
export function cycleWindows(step = 0.001) {
  let ivc0 = null, ej0 = null, ej1 = null;
  for (let u = 0; u < 1; u += step) {
    const ph = cycleShape(u).phase;
    if (ph === 'ivc' && ivc0 == null) ivc0 = u;
    if (ph === 'ejection' && ej0 == null) ej0 = u;
    if (ph === 'ivr' && ej1 == null) ej1 = u;
  }
  return Object.freeze({ ivc0, ej0, ej1 });
}
const WIN = cycleWindows();
const DIA_LEN = 1 - WIN.ej1 + WIN.ivc0;
const P_ED = cycleShape(WIN.ivc0).pressure;

/** Where u sits in the cycle: systolic fraction s (MV closure to AV closure), diastolic fraction d. */
export function cycleFractions(u) {
  const w = frac(u);
  const systolic = w >= WIN.ivc0 && w < WIN.ej1;
  const s = systolic ? (w - WIN.ivc0) / (WIN.ej1 - WIN.ivc0) : 0;
  const d = systolic ? 0 : (w >= WIN.ej1 ? w - WIN.ej1 : w + 1 - WIN.ej1) / DIA_LEN;
  return { u: w, systolic, s, d, filling: w < WIN.ivc0, ejection: w >= WIN.ej0 && w < WIN.ej1, ivr: w >= WIN.ej1 };
}

// Acute: normal sized, non-compliant chambers. Chronic: eccentric remodeling.
// Pressures in mmHg; geometry in SVG units; riseFast: steep early diastolic LV rise.
const BASE = { lvA: 38, lvL: 98, wall: 12, laRx: 30, laRy: 26, aoR: 13, laPulse: 0.1, squeeze: 0.22, lvMin: 5, edp: 10,
  lvPeak: 120, riseFast: 0, laBase: 10, laA: 5, laV: 8, vExp: 1.6, aoDia: 78, aoK: 1.4, mvGap: 0, flail: 0, avGap: 0,
  jetReach: 0, jetW: 20, jetTilt: 0 };
const LESIONS = Object.freeze({
  mr: {
    acute: { ...BASE, squeeze: 0.27, edp: 25, lvMin: 7, lvPeak: 100, riseFast: 0.45, laBase: 18, laA: 4, laV: 45, vExp: 0.7,
      laPulse: 0.06, flail: 1, mvGap: 0.4, jetReach: 0.95, jetW: 26, jetTilt: 22, aoDia: 65 },
    chronic: { ...BASE, lvA: 50, lvL: 120, wall: 13, laRx: 44, laRy: 40, squeeze: 0.2, edp: 14, lvPeak: 125, laBase: 12,
      laA: 3, laV: 16, vExp: 1.3, laPulse: 0.12, mvGap: 0.75, jetReach: 0.9, jetW: 38, jetTilt: 4 }
  },
  ar: {
    acute: { ...BASE, squeeze: 0.2, edp: 38, lvMin: 12, lvPeak: 100, riseFast: 1, laBase: 22, laA: 1, laV: 6, aoDia: 58,
      aoK: 2.6, avGap: 0.7, jetReach: 0.6, jetW: 22, jetTilt: 14 },
    chronic: { ...BASE, lvA: 52, lvL: 122, wall: 14, aoR: 18, squeeze: 0.19, edp: 14, lvPeak: 165, laBase: 12, laA: 5,
      laV: 9, aoDia: 45, aoK: 3.4, avGap: 0.6, jetReach: 0.85, jetW: 30, jetTilt: 12 }
  }
});

/** Parameters of a lesion ('mr' | 'ar') at chronicity 0 (acute) .. 1 (chronic). */
export function regurgParams(lesion, chron) {
  const set = LESIONS[lesion] || LESIONS.mr, k = clamp01(chron), out = { lesion: lesion === 'ar' ? 'ar' : 'mr', chron: k };
  for (const key of Object.keys(set.acute)) out[key] = lerp(set.acute[key], set.chronic[key], k);
  return out;
}

function lvPressure(p, f) {
  const pn = clamp01((cycleShape(f.u).pressure - P_ED) / (1 - P_ED));
  const shape = lerp(Math.pow(f.d, 1.8), smooth(0.3, 0.95, f.d), p.riseFast);
  const dia = f.systolic ? lerp(p.edp, p.lvMin, f.s) : p.lvMin + (p.edp - p.lvMin) * shape;
  return dia + (p.lvPeak - dia) * pn;
}

function laPressure(p, f) {
  const v = f.systolic ? Math.pow(f.s, p.vExp) : (f.ivr ? 1 : Math.exp(-f.u / 0.05));
  const aWave = f.filling ? Math.exp(-(((f.u - (WIN.ivc0 - 0.05)) / 0.03) ** 2)) : 0;
  return p.laBase + p.laV * v + p.laA * aWave;
}

function aoPressure(p, f, lv) {
  const notch = lvPressure(p, cycleFractions(WIN.ej1 - 1e-4));
  if (f.ejection) return Math.max(lv, p.aoDia);
  const t = frac(f.u - WIN.ej1) / (1 - WIN.ej1 + WIN.ej0);
  const e = (Math.exp(-p.aoK * t) - Math.exp(-p.aoK)) / (1 - Math.exp(-p.aoK));
  // Once LV pressure reaches the aortic pressure in isovolumic contraction the two travel together.
  return Math.max(p.aoDia + (notch - p.aoDia) * e, f.systolic ? lv : lv + 1);
}

/** LV, LA and aortic pressures (mmHg) at cycle phase u. */
export function pressuresAt(p, u) {
  const f = cycleFractions(u), lv = lvPressure(p, f);
  return { lv, la: laPressure(p, f), ao: aoPressure(p, f, lv) };
}

/** Regurgitant jet strength 0..1 from the driving gradient while the leaking valve is shut. */
export function jetIntensity(p, u) {
  const f = cycleFractions(u), pr = pressuresAt(p, u);
  if (p.lesion === 'mr') return f.filling ? 0 : clamp01((pr.lv - pr.la - 2) / 30);
  return f.ejection ? 0 : clamp01((pr.ao - pr.lv - 2) / 50);
}

/** Mid-diastolic phase where LV pressure first exceeds LA pressure (early MV closure), else null. */
export function earlyMitralClosure(p) {
  for (let u = 0.12; u < WIN.ivc0 - 0.04; u += 0.004) {
    const pr = pressuresAt(p, u);
    if (pr.lv >= pr.la) return u;
  }
  return null;
}

/** Valve openness 0..1: MV opens in filling (until LV exceeds LA), AV in ejection. */
export function valveOpenness(u, mvCloseAt = WIN.ivc0) {
  const f = cycleFractions(u);
  const mv = f.filling ? smooth(0, 0.035, f.u) * (1 - smooth(mvCloseAt - 0.03, mvCloseAt, f.u)) : 0;
  const av = f.ejection ? smooth(WIN.ej0, WIN.ej0 + 0.02, f.u) * (1 - smooth(WIN.ej1 - 0.02, WIN.ej1, f.u)) : 0;
  return { mv, av };
}

/** Effective LV contraction: MR empties during "isovolumic" contraction, AR refills during relaxation. */
function contractionAt(lesion, u) {
  const sh = cycleShape(u), f = cycleFractions(u);
  if (lesion === 'mr' && sh.phase === 'ivc') return Math.max(sh.contraction, 0.25 * f.s / ((WIN.ej0 - WIN.ivc0) / (WIN.ej1 - WIN.ivc0)));
  if (lesion === 'ar' && f.ivr) return sh.contraction * (1 - 0.35 * (f.u - WIN.ej1) / (1 - WIN.ej1));
  return sh.contraction;
}

function laFillAt(u) {
  const f = cycleFractions(u);
  if (f.systolic) return f.s;
  if (f.ivr) return 1;
  return clamp01(1 - 0.75 * smooth(0, 0.18, f.u) - 0.25 * smooth(WIN.ivc0 - 0.1, WIN.ivc0 - 0.02, f.u));
}

/** Chamber geometry for parameters p at contraction c (0..1) and LA filling (0..1). */
export function heartGeometry(p, c, laFill = 0) {
  const k = clamp01(c);
  const a = p.lvA * (1 - p.squeeze * k), h = p.lvL * (1 - p.squeeze * 0.5 * k);
  const b = p.lvA * 0.86 * (1 - 0.25 * p.squeeze * k);
  const wall = p.wall * (1 + 0.45 * k);
  const mvL = CX - b, mvR = CX + b - 2 * p.aoR - 6;
  const scale = 1 + p.laPulse * clamp01(laFill);
  const la = { cx: (mvL + mvR) / 2 - 4, rx: p.laRx * scale, ry: p.laRy * scale };
  la.cy = BY + la.ry * 0.72;
  return { a, h, b, wall, mvL, mvR, avL: CX + b - 2 * p.aoR, avR: CX + b, la };
}

function bulletPath(b, a, h) {
  return `M${n1(CX - b)} ${BY}C${n1(CX - a * 1.06)} ${n1(BY - h * 0.38)} ${n1(CX - a * 0.72)} ${n1(BY - h)} ${CX} ${n1(BY - h)}`
    + `C${n1(CX + a * 0.72)} ${n1(BY - h)} ${n1(CX + a * 1.06)} ${n1(BY - h * 0.38)} ${n1(CX + b)} ${BY}Z`;
}

function aortaPath(g) {
  const x = (g.avL + g.avR) / 2;
  return `M${n1(x)} ${BY - 1}L${n1(x)} ${BY + 10}C${n1(x)} ${BY + 40} ${n1(x + 30)} ${BY + 58} ${VIEW_W + 20} ${BY + 64}`;
}

/** Plume along +y: narrow vena contracta widening into the receiving chamber. */
function plumePath(len, w) {
  const nk = 2.5;
  return `M${-nk} 0C${-nk} ${n1(len * 0.2)} ${n1(-w)} ${n1(len * 0.35)} ${n1(-w)} ${n1(len * 0.62)}`
    + `C${n1(-w)} ${n1(len * 0.9)} ${n1(-w * 0.4)} ${n1(len)} 0 ${n1(len)}`
    + `C${n1(w * 0.4)} ${n1(len)} ${n1(w)} ${n1(len * 0.9)} ${n1(w)} ${n1(len * 0.62)}`
    + `C${n1(w)} ${n1(len * 0.35)} ${nk} ${n1(len * 0.2)} ${nk} 0Z`;
}

const TEXT = {
  tr: {
    title: 'Akut ve kronik yetersizlik: MR ve AR',
    intro: 'Apikal 3 boşluk şeması. Aynı kaçak, farklı zaman: akutta boşluklar normal boyutta ve serttir, basınç fırlar; kronikte eksantrik yeniden şekillenme hacmi emer ve basınç uzun süre normale yakın kalır.',
    clock: 'Kalp döngüsü:', view: 'Görünüm:', all: 'Dört panel', remodel: 'Remodeling (MR + AR)',
    toChronic: 'Akut → Kronik', toAcute: 'Kronik → Akut',
    legend: { lv: 'LV', la: 'LA', ao: 'Ao' }, early: 'MK erken kapanır', giantV: 'dev v', v: 'v',
    jetMr: 'Sistolik jet LA içine', jetAr: 'Diyastolik jet LV içine', stage: { acute: 'Akut', chronic: 'Kronik' },
    panels: {
      mr: {
        acute: { name: 'Akut MR', cause: 'Korda veya papiller kas rüptürü, flail yaprakçık',
          take: 'Uyum için zaman yok: küçük ve sert LA dev v dalgası üretir, basınç akciğere yansır (pulmoner ödem).' },
        chronic: { name: 'Kronik MR', cause: 'Dejeneratif veya fonksiyonel MR, annüler dilatasyon',
          take: 'Eksantrik yeniden şekillenme: geniş LV ve kompliyan LA hacmi emer; LAP ve LVEDP dekompansasyona dek normale yakın.' }
      },
      ar: {
        acute: { name: 'Akut AR', cause: 'Endokardit, aort diseksiyonu, travma',
          take: 'Normal boyuttaki LV ani hacmi kaldıramaz: LVEDP diyastolde dik yükselir, mitral kapak erken kapanır, nabız basıncı geniş değildir.' },
        chronic: { name: 'Kronik AR', cause: 'Biküspit kapak, aort kökü dilatasyonu',
          take: 'Hacim ve basınç yükü: eksantrik hipertrofi ile büyük atım hacmi, geniş nabız basıncı (yüksek sistolik, düşük diyastolik Ao); LVEDP yıllarca normale yakın.' }
      }
    }
  },
  en: {
    title: 'Acute vs chronic regurgitation: MR and AR',
    intro: 'Apical 3-chamber schematic. Same leak, different time course: acutely the chambers are normal sized and stiff, so pressure soars; chronically eccentric remodeling absorbs the volume and pressure stays near normal for a long time.',
    clock: 'Cardiac cycle:', view: 'View:', all: 'Four panels', remodel: 'Remodeling (MR + AR)',
    toChronic: 'Acute → Chronic', toAcute: 'Chronic → Acute',
    legend: { lv: 'LV', la: 'LA', ao: 'Ao' }, early: 'early MV closure', giantV: 'giant v', v: 'v',
    jetMr: 'Systolic jet into the LA', jetAr: 'Diastolic jet into the LV', stage: { acute: 'Acute', chronic: 'Chronic' },
    panels: {
      mr: {
        acute: { name: 'Acute MR', cause: 'Chordal or papillary muscle rupture, flail leaflet',
          take: 'No time for compliance: a small stiff LA produces a giant v wave that is transmitted to the lungs (pulmonary edema).' },
        chronic: { name: 'Chronic MR', cause: 'Degenerative or functional MR, annular dilation',
          take: 'Eccentric remodeling: a large LV and compliant LA absorb the volume; LAP and LVEDP stay near normal until decompensation.' }
      },
      ar: {
        acute: { name: 'Acute AR', cause: 'Endocarditis, aortic dissection, trauma',
          take: 'A normal sized LV cannot take the sudden volume: LVEDP climbs steeply in diastole, the mitral valve closes early and pulse pressure is not wide.' },
        chronic: { name: 'Chronic AR', cause: 'Bicuspid valve, aortic root dilation',
          take: 'Volume plus pressure load: eccentric hypertrophy gives a large stroke volume and wide pulse pressure (high systolic, low diastolic Ao); LVEDP near normal for years.' }
      }
    }
  }
};

// Figure badges: [label, value, level] with level nl | mild | up | upup.
const BADGES = Object.freeze({
  mr: {
    acute: [['LVEDV', 'nl', 'nl'], ['LVEDP', '↑↑', 'upup'], ['LAVi', 'nl', 'nl'], ['LAP', '↑↑', 'upup']],
    chronic: [['LVEDV', '↑', 'up'], ['LVEDP', 'nl/↑', 'mild'], ['LAVi', '↑', 'up'], ['LAP', '↑', 'up']]
  },
  ar: {
    acute: [['LVEDV', 'nl', 'nl'], ['LVEDP', '↑↑', 'upup'], ['LAVi', 'nl', 'nl'], ['LAP', '↑↑', 'upup'], ['Ao PP', 'nl/↓', 'nl']],
    chronic: [['LVEDV', '↑', 'up'], ['LVEDP', 'nl/↑', 'mild'], ['LAVi', 'nl', 'nl'], ['LAP', 'nl/↑', 'mild'], ['Ao PP', '↑↑', 'upup']]
  }
});

const VIEWS = Object.freeze({
  all: [['mr', 0], ['mr', 1], ['ar', 0], ['ar', 1]],
  remodel: [['mr', 0], ['ar', 0]],
  'mr-acute': [['mr', 0]], 'mr-chronic': [['mr', 1]], 'ar-acute': [['ar', 0]], 'ar-chronic': [['ar', 1]]
});
const FOCUS_IDS = ['mr-acute', 'mr-chronic', 'ar-acute', 'ar-chronic'];

const traceX = u => TRACE.x0 + u * (TRACE.x1 - TRACE.x0);
const traceY = mm => TRACE.y0 - (Math.min(mm, TRACE.max) / TRACE.max) * (TRACE.y0 - TRACE.y1);

/** Static curves of one parameter set: polyline points per series plus marker phases. */
function buildCurves(p) {
  const pts = { lv: [], la: [], ao: [] };
  for (let i = 0; i <= TRACE.samples; i++) {
    const u = i / TRACE.samples, pr = pressuresAt(p, Math.min(u, 0.9999));
    for (const key of Object.keys(pts)) pts[key].push(`${n1(traceX(u))},${n1(traceY(pr[key]))}`);
  }
  const vPeak = { u: WIN.ej1, la: pressuresAt(p, WIN.ej1 - 1e-4).la };
  const early = p.lesion === 'ar' ? earlyMitralClosure(p) : null;
  return { points: { lv: pts.lv.join(' '), la: pts.la.join(' '), ao: pts.ao.join(' ') }, vPeak, early };
}

let instanceCount = 0;

export function createRegurgitationLab({ container, lang = 'tr' } = {}) {
  const uid = `rg${++instanceCount}`;
  let curLang = lang === 'en' ? 'en' : 'tr';
  let view = 'all', slots = [], cancelTween = () => {};
  const t = () => TEXT[curLang];
  const clock = createCycleClock({ bpm: 70, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang: () => curLang, label: { tr: TEXT.tr.clock, en: TEXT.en.clock } });

  const root = document.createElement('section');
  root.className = 'pathophys-card rg-lab';
  root.setAttribute('data-regurg-lab', '');
  root.innerHTML = `
    <header class="rg-head"><h3 data-rg-title></h3><p data-rg-intro></p></header>
    <div class="rg-controls">
      <div class="preset-pill-group rg-views" role="group" data-rg-views></div>
      <button type="button" class="preset-pill rg-remodel" data-rg-remodel></button>
    </div>
    <div class="rg-grid" data-rg-grid></div>`;
  root.querySelector('.rg-head').after(motionBar.element);
  container.append(root);
  const grid = root.querySelector('[data-rg-grid]');

  function makeSlot(lesion, chron, index) {
    const p = regurgParams(lesion, chron);
    return { lesion, chron, index, p, curves: buildCurves(p), stage: null, readout: '' };
  }

  function heartSvg(slot) {
    const id = `${uid}-${slot.index}`;
    return `<svg class="rg-heart" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" data-rg-heart>
      <defs><linearGradient id="${id}-jet" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3f5f86" stop-opacity="0.95"/><stop offset="1" stop-color="#9fb3c8" stop-opacity="0.55"/>
      </linearGradient></defs>
      <ellipse class="rg-la-wall" data-rg="la-wall"/><ellipse class="rg-cavity" data-rg="la-cav"/>
      <path class="rg-ao-wall" data-rg="ao-wall"/><path class="rg-ao-lumen" data-rg="ao-lumen"/>
      <path class="rg-myo" data-rg="lv-myo"/><path class="rg-cavity" data-rg="lv-cav"/>
      <g data-rg="chordae" class="rg-chordae"><line data-rg="ch-post"/><line data-rg="ch-ant"/><line data-rg="ch-stub" class="rg-chord-broken"/></g>
      <ellipse class="rg-myo rg-pm" data-rg="pm" rx="9" ry="5.5"/>
      <g data-rg="jet"><path data-rg="plume" fill="url(#${id}-jet)"/>
        <g data-rg="particles">${Array.from({ length: PARTICLES }, () => '<circle r="1.7"/>').join('')}</g></g>
      <line class="rg-leaflet" data-rg="mv-post"/><line class="rg-leaflet" data-rg="mv-ant"/>
      <line class="rg-cusp" data-rg="av-l"/><line class="rg-cusp" data-rg="av-r"/>
      <text class="rg-chamber" data-rg="lbl-lv">LV</text><text class="rg-chamber" data-rg="lbl-la">LA</text>
      <text class="rg-chamber" data-rg="lbl-ao" x="${VIEW_W - 26}" y="${BY + 46}">Ao</text>
      <text class="rg-jet-label" data-rg="jet-label" x="8" y="${VIEW_H - 6}"></text>
    </svg>`;
  }

  function traceSvg(slot) {
    const lines = SERIES[slot.lesion].map(key => `<polyline class="rg-curve rg-curve-${key}" data-rg-curve="${key}" stroke="${COLORS[key]}"/>`).join('');
    const dots = SERIES[slot.lesion].map(key => `<circle r="3" fill="${COLORS[key]}" data-rg-dot="${key}"/>`).join('');
    const grid = [0, 50, 100, 150].map(mm => `<line x1="${TRACE.x0}" x2="${TRACE.x1}" y1="${n1(traceY(mm))}" y2="${n1(traceY(mm))}"/><text x="${TRACE.x0 - 4}" y="${n1(traceY(mm) + 3)}">${mm}</text>`).join('');
    return `<svg class="rg-trace" viewBox="0 0 ${VIEW_W} 84" aria-hidden="true" data-rg-trace>
      <g class="rg-trace-grid">${grid}<text x="${TRACE.x0}" y="83">mmHg</text></g>
      ${lines}<g data-rg-marker class="rg-marker"><circle r="3"/><text></text></g>
      <line class="rg-pen" data-rg-pen y1="${TRACE.y1 - 2}" y2="${TRACE.y0}"/>${dots}
    </svg>`;
  }

  function slotHtml(slot) {
    const legend = SERIES[slot.lesion].map(key => `<span><i style="background:${COLORS[key]}"></i>${t().legend[key]}</span>`).join('');
    return `<article class="rg-panel" data-rg-slot="${slot.index}" data-lesion="${slot.lesion}">
      <header class="rg-panel-head"><h4 data-rg-name></h4><span class="rg-cause" data-rg-cause></span></header>
      ${heartSvg(slot)}
      <ul class="rg-badges" data-rg-badges></ul>
      ${traceSvg(slot)}
      <div class="rg-trace-legend">${legend}<strong data-rg-readout></strong></div>
      <p class="rg-take" data-rg-take></p>
    </article>`;
  }

  function buildGrid() {
    slots = VIEWS[view].map(([lesion, chron], i) => makeSlot(lesion, chron, i));
    grid.dataset.count = String(slots.length);
    grid.innerHTML = slots.map(slotHtml).join('');
    slots.forEach(slot => {
      slot.el = grid.querySelector(`[data-rg-slot="${slot.index}"]`);
      slot.q = sel => slot.el.querySelector(sel);
      slot.parts = {};
      slot.el.querySelectorAll('[data-rg]').forEach(node => { slot.parts[node.dataset.rg] = node; });
      slot.particles = [...slot.parts.particles.children];
      applyCurves(slot);
    });
  }

  function applyCurves(slot) {
    SERIES[slot.lesion].forEach(key => slot.q(`[data-rg-curve="${key}"]`).setAttribute('points', slot.curves.points[key]));
    const marker = slot.q('[data-rg-marker]'), { early, vPeak } = slot.curves;
    const at = slot.lesion === 'ar' && early != null && early < WIN.ivc0 - 0.04
      ? { u: early, mm: pressuresAt(slot.p, early).la, label: t().early }
      : slot.lesion === 'mr' ? { u: vPeak.u, mm: vPeak.la, label: slot.p.laV > 30 ? t().giantV : t().v } : null;
    marker.style.display = at ? '' : 'none';
    if (!at) return;
    const x = traceX(at.u), y = traceY(at.mm);
    marker.querySelector('circle').setAttribute('cx', n1(x));
    marker.querySelector('circle').setAttribute('cy', n1(y));
    const label = marker.querySelector('text');
    label.setAttribute('x', n1(x + (x > 200 ? -6 : 6)));
    label.setAttribute('y', n1(Math.max(12, y - 6)));
    label.setAttribute('text-anchor', x > 200 ? 'end' : 'start');
    label.textContent = at.label;
  }

  function applyStageText(slot) {
    const stage = slot.chron >= 0.5 ? 'chronic' : 'acute';
    if (slot.stage === stage && slot.lang === curLang) return;
    slot.stage = stage; slot.lang = curLang;
    const txt = t().panels[slot.lesion][stage];
    slot.q('[data-rg-name]').textContent = txt.name;
    slot.q('[data-rg-cause]').textContent = txt.cause;
    slot.q('[data-rg-take]').textContent = txt.take;
    slot.q('[data-rg-heart]').setAttribute('aria-label', `${txt.name}: ${txt.cause}`);
    slot.parts['jet-label'].textContent = slot.lesion === 'mr' ? t().jetMr : t().jetAr;
    slot.q('[data-rg-badges]').innerHTML = BADGES[slot.lesion][stage]
      .map(([label, value, level]) => `<li data-level="${level}"><span>${label}</span><b>${value}</b></li>`).join('');
  }

  const set = (node, attrs) => { for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, typeof v === 'number' ? n1(v) : v); };

  function drawLeaflets(slot, g, open) {
    const { p, parts } = slot;
    const half = (g.mvR - g.mvL) / 2, len = half * (1.05 - 0.3 * p.mvGap);
    const closed = 12 + 14 * p.mvGap, tAnt = lerp(closed, 80, open.mv);
    const tPost = lerp(lerp(closed, -58, p.flail), 82, open.mv);
    const post = { x: g.mvL + Math.cos(tPost * DEG) * len, y: BY - Math.sin(tPost * DEG) * len };
    const ant = { x: g.mvR - Math.cos(tAnt * DEG) * len, y: BY - Math.sin(tAnt * DEG) * len };
    set(parts['mv-post'], { x1: g.mvL, y1: BY, x2: post.x, y2: post.y });
    set(parts['mv-ant'], { x1: g.mvR, y1: BY, x2: ant.x, y2: ant.y });
    const ah = p.aoR, alen = ah * (1.04 - 0.32 * p.avGap), tc = lerp(-12, 6, p.avGap), ta = lerp(tc, 80, open.av);
    set(parts['av-l'], { x1: g.avL, y1: BY, x2: g.avL + Math.cos(ta * DEG) * alen, y2: BY + Math.sin(ta * DEG) * alen });
    set(parts['av-r'], { x1: g.avR, y1: BY, x2: g.avR - Math.cos(ta * DEG) * alen, y2: BY + Math.sin(ta * DEG) * alen });
    return { post, ant };
  }

  function drawSubvalvular(slot, g, tips) {
    const { p, parts } = slot, pm = { x: CX - g.a * 0.7, y: BY - g.h * 0.42 };
    set(parts.pm, { cx: pm.x, cy: pm.y, transform: `rotate(-35 ${n1(pm.x)} ${n1(pm.y)})` });
    const tip = { x: pm.x + 6, y: pm.y + 4 }, broken = p.flail > 0.5;
    set(parts['ch-ant'], { x1: tip.x, y1: tip.y, x2: tips.ant.x, y2: tips.ant.y });
    set(parts['ch-post'], { x1: tip.x, y1: tip.y, x2: tips.post.x, y2: tips.post.y });
    parts['ch-post'].style.display = broken ? 'none' : '';
    parts['ch-stub'].style.display = broken ? '' : 'none';
    if (broken) set(parts['ch-stub'], { x1: tip.x, y1: tip.y, x2: tip.x - 5, y2: tip.y + 15 });
  }

  function drawJet(slot, g, u) {
    const { p, parts } = slot, I = jetIntensity(p, u);
    parts.jet.style.display = I > 0.02 ? '' : 'none';
    if (I <= 0.02) return;
    const mr = p.lesion === 'mr';
    const len = mr ? g.la.ry * 1.75 * p.jetReach * (0.5 + 0.5 * I) : g.h * p.jetReach * (0.4 + 0.6 * I);
    const w = (p.jetW / 2) * (0.5 + 0.5 * I);
    const ox = mr ? (g.mvL + g.mvR) / 2 : (g.avL + g.avR) / 2, oy = mr ? BY + 2 : BY - 2;
    const rot = mr ? -p.jetTilt : 180 - p.jetTilt;
    set(parts.jet, { transform: `translate(${n1(ox)} ${n1(oy)}) rotate(${n1(rot)})`, opacity: 0.35 + 0.6 * I });
    set(parts.plume, { d: plumePath(len, w) });
    slot.particles.forEach((dot, i) => {
      const k = frac(u * 7 + i / PARTICLES);
      set(dot, { cx: Math.sin(i * 2.39 + k * 5) * w * 0.55 * Math.min(1, k * 3), cy: k * len * 0.95, opacity: 1 - k * 0.6 });
    });
  }

  function drawHeart(slot, u) {
    const { p, parts } = slot;
    const g = heartGeometry(p, contractionAt(p.lesion, u), laFillAt(u));
    set(parts['la-wall'], { cx: g.la.cx, cy: g.la.cy, rx: g.la.rx + 4, ry: g.la.ry + 4 });
    set(parts['la-cav'], { cx: g.la.cx, cy: g.la.cy, rx: g.la.rx, ry: g.la.ry });
    const ao = aortaPath(g);
    set(parts['ao-wall'], { d: ao, 'stroke-width': 2 * p.aoR + 6 });
    set(parts['ao-lumen'], { d: ao, 'stroke-width': 2 * p.aoR });
    set(parts['lv-myo'], { d: bulletPath(g.b + g.wall * 0.6, g.a + g.wall, g.h + g.wall * 0.75) });
    set(parts['lv-cav'], { d: bulletPath(g.b, g.a, g.h) });
    const close = slot.curves.early != null && slot.curves.early < WIN.ivc0 ? slot.curves.early : WIN.ivc0;
    const tips = drawLeaflets(slot, g, valveOpenness(u, close));
    drawSubvalvular(slot, g, tips);
    drawJet(slot, g, u);
    set(parts['lbl-lv'], { x: CX + g.a * 0.15, y: BY - g.h * 0.62 });
    set(parts['lbl-la'], { x: g.la.cx - g.la.rx * 0.62, y: g.la.cy + g.la.ry * 0.62 });
  }

  function drawTrace(slot, u) {
    const pr = pressuresAt(slot.p, u), x = traceX(u);
    set(slot.q('[data-rg-pen]'), { x1: x, x2: x });
    SERIES[slot.lesion].forEach(key => set(slot.q(`[data-rg-dot="${key}"]`), { cx: x, cy: traceY(pr[key]) }));
    const readout = SERIES[slot.lesion].map(key => `${t().legend[key]} ${Math.round(pr[key])}`).join(' | ') + ' mmHg';
    if (readout !== slot.readout) { slot.readout = readout; slot.q('[data-rg-readout]').textContent = readout; }
  }

  function draw(state) {
    const u = state.phase;
    motionBar.render(state, cycleShape(u).phase);
    slots.forEach(slot => { applyStageText(slot); drawHeart(slot, u); drawTrace(slot, u); });
  }

  function renderControls() {
    const views = root.querySelector('[data-rg-views]');
    const ids = ['all', 'remodel', ...FOCUS_IDS];
    const name = id => {
      if (id === 'all' || id === 'remodel') return t()[id];
      const [lesion, stage] = id.split('-');
      return t().panels[lesion][stage].name;
    };
    views.innerHTML = `<span class="preset-label">${t().view}</span>` + ids
      .map(id => `<button type="button" class="preset-pill${id === view ? ' active' : ''}" data-rg-view="${id}" aria-pressed="${id === view}">${name(id)}</button>`).join('');
    const chronicNow = slots.length > 0 && slots.every(s => s.chron >= 0.5) && view !== 'all';
    root.querySelector('[data-rg-remodel]').textContent = chronicNow ? t().toAcute : t().toChronic;
  }

  function setView(next) {
    cancelTween();
    view = VIEWS[next] ? next : 'all';
    buildGrid();
    renderControls();
    draw(clock.getState());
  }

  /** Tween chronicity of every visible slot (all view switches to the two-panel remodeling view first). */
  function toggleRemodel() {
    if (view === 'all') setView('remodel');
    const from = slots[0].chron, to = from >= 0.5 ? 0 : 1;
    cancelTween();
    cancelTween = tweenValues({ chron: from }, { chron: to }, ({ chron }) => {
      slots = slots.map(slot => {
        const p = regurgParams(slot.lesion, chron);
        return Object.assign(slot, { chron, p, curves: buildCurves(p) });
      });
      slots.forEach(applyCurves);
      if (chron === to && FOCUS_IDS.includes(view)) view = `${slots[0].lesion}-${to ? 'chronic' : 'acute'}`;
      if (chron === to) renderControls();
      draw(clock.getState());
    }, 1600);
  }

  root.addEventListener('click', event => {
    const viewBtn = event.target.closest('[data-rg-view]');
    if (viewBtn) { setView(viewBtn.dataset.rgView); return; }
    if (event.target.closest('[data-rg-remodel]')) toggleRemodel();
  });

  function applyLanguage() {
    root.querySelector('[data-rg-title]').textContent = t().title;
    root.querySelector('[data-rg-intro]').textContent = t().intro;
    motionBar.setLanguage();
    renderControls();
  }

  applyLanguage();
  buildGrid();
  renderControls();
  const unsubscribe = clock.subscribe(draw);

  return {
    updateLanguage(next) {
      curLang = next === 'en' ? 'en' : 'tr';
      applyLanguage();
      slots.forEach(slot => {
        slot.q('.rg-trace-legend').querySelectorAll('span').forEach((span, i) => { span.lastChild.textContent = t().legend[SERIES[slot.lesion][i]]; });
        slot.readout = '';
        applyCurves(slot);
      });
      draw(clock.getState());
    },
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}
