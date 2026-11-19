// Guided beat timeline for the atheroma station. Every stage is told as three
// or four numbered beats; one stage progress value u (0..1) drives the caption,
// the focus ring, the plaque geometry and the stage actors together, so what
// moves on screen is always the thing the active caption describes.
// Sequence checked against UpToDate "Overview of atherosclerosis" (Oct 2026)
// and Borén et al. 2025. Schematic teaching aid, not calibrated kinetics.

import {
  PLAQUE_CX, capYAt, bump, mixHex, clamp01, ramp, smooth, lerp, frac, f1, f2
} from './atherogenesis-motion.js';

const t = (tr, en) => ({ tr, en });

/** Captions per stage, one entry per beat. */
export const STAGE_BEATS = [
  [
    t('Dallanma noktasında akım yavaşlar ve yön değiştirir. Endotel daha az nitrik oksit (NO) üretir, bariyer gevşer.',
      'At a branch point flow slows and reverses. The endothelium makes less nitric oxide (NO) and its barrier loosens.'),
    t('LDL ve diğer apoB partikülleri endotel hücresinin içinden taşınarak (transsitoz) intimaya geçer.',
      'LDL and other apoB particles are carried through the endothelial cell (transcytosis) into the intima.'),
    t('Giriş, kandaki partikül sayısıyla orantılıdır. Tutulmayan partikül lümene geri dönebilir; sorun içeride kalanlardır.',
      'Entry scales with the number of particles in blood. A particle that is not retained can return to the lumen; the ones that stay are the problem.')
  ],
  [
    t('ApoB\'nin pozitif yüklü bölgesi, proteoglikanların negatif yüklü zincirlerine yapışır. Partikül artık çıkamaz: aterogenezi başlatan olay budur.',
      'The positively charged region of apoB sticks to the negatively charged proteoglycan chains. The particle can no longer leave: this is the initiating event.'),
    t('Tutulan LDL oksitlenir ve kümeleşir (oxLDL). Vücut onu artık yabancı madde gibi görür.',
      'Retained LDL is oxidized and aggregates (oxLDL). The body now treats it as foreign material.'),
    t('Uyarılan endotel yüzeyine yapışma molekülleri (VCAM-1) çıkarır ve MCP-1 salgılar: monositlere çağrı.',
      'The activated endothelium displays adhesion molecules (VCAM-1) and secretes MCP-1: a call for monocytes.')
  ],
  [
    t('Kandaki monosit endotel üzerinde yuvarlanır ve VCAM-1\'e tutunur.',
      'A circulating monocyte rolls along the endothelium and attaches to VCAM-1.'),
    t('Hücrelerin arasından intimaya geçer ve makrofaja dönüşür.',
      'It squeezes between the cells into the intima and becomes a macrophage.'),
    t('Makrofaj oxLDL\'yi çöpçü reseptörlerle (CD36, SR-A) yutar. Bu reseptörlerin freni yoktur; hücre yağla dolup köpük hücresi olur.',
      'The macrophage engulfs oxLDL through scavenger receptors (CD36, SR-A). These have no brake, so the cell fills with lipid and becomes a foam cell.'),
    t('Hücre içi kolesterol kristalleri NLRP3\'ü tetikler: IL-1β, IL-6, ardından CRP. Köpük hücresi yığını yağlı çizgiyi oluşturur.',
      'Intracellular cholesterol crystals trigger NLRP3: IL-1β, IL-6, then CRP. The pile of foam cells is the fatty streak.')
  ],
  [
    t('Mediadaki düz kas hücreleri intimaya göç eder.',
      'Smooth muscle cells migrate from the media into the intima.'),
    t('Kollajen örerek lipidin üstüne fibröz kılıf kurarlar. Kılıf, trombojenik içeriği kandan ayırır.',
      'They lay down collagen and build a fibrous cap over the lipid. The cap keeps the thrombogenic contents away from blood.'),
    t('Ölen köpük hücreleri temizlenemez (kusurlu efferositoz). Hücresiz, lipidden zengin nekrotik çekirdek büyür.',
      'Dying foam cells are not cleared (defective efferocytosis). An acellular, lipid-rich necrotic core grows.'),
    t('Damar önce dışa doğru genişler (Glagov). Lümen uzun süre korunur; anjiyografi plak yükünü olduğundan az gösterir.',
      'The artery first expands outward (Glagov). The lumen is preserved for a long time, so angiography underestimates plaque burden.')
  ],
  [
    t('İnflamasyon kılıfı inceltir: makrofaj MMP\'leri kollajeni yıkar, IFN-γ yeni kollajen yapımını baskılar. 65 µm altı = ince kılıflı fibroaterom (TCFA).',
      'Inflammation thins the cap: macrophage MMPs digest collagen and IFN-γ suppresses new collagen. Below 65 µm = thin-cap fibroatheroma (TCFA).'),
    t('Kılıf, gerilimin en yüksek olduğu omuz bölgesinden yırtılır. Doku faktöründen (TF) zengin çekirdek kanla temas eder.',
      'The cap tears at the shoulder, where stress is highest. The tissue factor (TF) rich core meets blood.'),
    t('Trombositler yapışır, fibrin ağı örülür. Trombüs dakikalar içinde lümeni daraltır veya tıkar: akut koroner sendrom.',
      'Platelets adhere and a fibrin mesh forms. Within minutes the thrombus narrows or occludes the lumen: acute coronary syndrome.'),
    t('Akut olaya yol açan plak, öncesinde sıklıkla %50\'den az darlık yapar. Koroner trombozların yaklaşık dörtte üçü rüptür, kalanı çoğunlukla erozyondur.',
      'The plaque behind an acute event often caused less than 50% stenosis beforehand. About three quarters of coronary thrombi follow rupture; most of the rest follow erosion.')
  ]
];

/** Share of each beat spent moving; the remainder holds the result for reading. */
const ACTIVE_SHARE = 0.72;
export const beatCount = idx => STAGE_BEATS[idx].length;
export const beatIndex = (idx, u) => Math.min(beatCount(idx) - 1, Math.floor(clamp01(u) * beatCount(idx)));
/** Progress of beat i (0 before it, eased 0..1 while it plays, 1 afterwards). */
const seg = (u, i, n) => smooth(clamp01((u * n - i) / ACTIVE_SHARE));
/** Stage progress at which beat i has just finished moving. */
export const beatSettledU = (idx, i) => Math.min(0.9995, (i + ACTIVE_SHARE + 0.02) / beatCount(idx));
export const beatStartU = (idx, i) => i / beatCount(idx);

/** Fractional plaque stage shown at progress u of stage idx (see plaqueGeometry). */
export function stageP(idx, u) {
  if (idx <= 1) return idx;
  if (idx === 2) return 1.5 + 0.25 * seg(u, 2, 4) + 0.25 * seg(u, 3, 4);
  if (idx === 3) return 2.2 + 0.3 * seg(u, 1, 4) + 0.25 * seg(u, 2, 4) + 0.25 * seg(u, 3, 4);
  return 3 + 0.4 * seg(u, 0, 4) + 0.3 * seg(u, 1, 4) + 0.3 * seg(u, 2, 4);
}

const LDL_X = [285, 345, 405];
const TRAP = [[292, 158], [345, 166], [398, 158]];
const CELL = [345, 172];
const DROPLET = [[-7, -5], [7, -4], [0, 7]];
const SMC_X = [232, 312, 392, 462];
const HALO = 'stroke="#fffbeb" stroke-width="3" paint-order="stroke"';

/** Proteoglycan mesh in the intima under the lesion-prone endothelium. */
export function proteoglycanMarkup() {
  return `<g stroke="#d97706" stroke-width="1.3" opacity="0.6" fill="none">
      <path d="M 250 152 Q 285 142 320 156 T 390 152 T 440 156"/>
      <path d="M 262 170 Q 300 160 338 172 T 428 168"/>
      ${[278, 318, 358, 398, 428].map(x => `<line x1="${x}" y1="146" x2="${x}" y2="174"/>`).join('')}
    </g>
    <g font-size="11" font-weight="800" fill="#1d4ed8" aria-hidden="true">
      ${[[270, 166], [330, 150], [372, 180], [416, 166]].map(([x, y]) => `<text x="${x}" y="${y}">−</text>`).join('')}
    </g>`;
}

const ldlMarkup = () => `<g data-a="ldl"><circle data-skin r="6.2" fill="#eab308" stroke="#92400e" stroke-width="1.5"/>
  <path data-ros d="M 9 -9 l 2 4 l 4 -2 l -2 4 l 4 2 l -4 1 l 1 4 l -4 -2 l -2 4 l -1 -4 z" fill="#ef4444" opacity="0"/></g>`;
const vcamMarkup = () => `<g data-a="vcam" stroke="#1e40af" stroke-width="1.8" stroke-linecap="round">
  ${[290, 312, 334, 356, 378, 400].map(x => `<path d="M ${x} 97 V 89 M ${x - 3} 89 H ${x + 3}"/>`).join('')}</g>`;
const foamMarkup = (x, y, r = 15) => `<g data-a="foam" data-x="${x}" data-y="${y}">
  <circle r="${r}" fill="#f59e0b" fill-opacity="0.3" stroke="#b45309" stroke-width="2"/>
  <circle cx="-5" cy="-4" r="3.6" fill="#eab308"/><circle cx="5" cy="-3" r="3.2" fill="#eab308"/><circle cx="0" cy="6" r="3.6" fill="#eab308"/>
  <line data-a="xtal" x1="-8" y1="8" x2="8" y2="-8" stroke="#fef9c3" stroke-width="2.2"/></g>`;

/** Animated actors for one stage; positioned every frame by animateActors. */
export function actorMarkup(stageIdx, en) {
  if (stageIdx === 0) {
    return `${LDL_X.map(() => `<text data-a="no" text-anchor="middle" font-size="10" font-weight="800" fill="#0f766e" ${HALO}>NO</text>`).join('')}
      ${LDL_X.map(ldlMarkup).join('')}`;
  }
  if (stageIdx === 1) {
    return `${LDL_X.map(ldlMarkup).join('')}${vcamMarkup()}
      ${[0, 1, 2].map(() => '<circle data-a="mcp" r="3.2" fill="#db2777"/>').join('')}
      <text data-a="tag" x="474" y="92" font-size="10" font-weight="800" fill="#9d174d" ${HALO}>MCP-1</text>`;
  }
  if (stageIdx === 2) {
    return `${vcamMarkup()}${foamMarkup(272, 188)}${foamMarkup(418, 188)}
      <g data-a="mono"><g data-body><circle data-skin r="8" stroke="#1e3a8a" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <path d="M -4 -2 Q 0 -6 4 -2 Q 2 3 -3 2 Z" fill="#1e3a8a" fill-opacity="0.55"/></g>
        <line data-a="xtal" x1="-11" y1="11" x2="11" y2="-11" stroke="#fef9c3" stroke-width="2.4"/></g>
      ${TRAP.map(() => '<g data-a="ox"><circle r="6.2" fill="#c2410c" stroke="#78350f" stroke-width="1.5"/></g>').join('')}
      ${[0, 1, 2, 3, 4, 5].map(() => '<circle data-a="cyto" r="3" fill="#db2777"/>').join('')}
      <text data-a="tag" x="478" y="150" font-size="10" font-weight="800" fill="#9d174d" ${HALO}>NLRP3 → IL-1β → IL-6</text>`;
  }
  if (stageIdx === 3) {
    return `${foamMarkup(300, 206, 12)}${foamMarkup(345, 196, 12)}${foamMarkup(390, 206, 12)}
      <g data-a="core-xtal" stroke="#fef9c3" stroke-width="2.2">
        <line x1="290" y1="200" x2="322" y2="184"/><line x1="335" y1="168" x2="372" y2="184"/><line x1="360" y1="212" x2="398" y2="196"/><line x1="318" y1="212" x2="345" y2="222"/></g>
      ${SMC_X.map(x => `<g data-a="smc" data-x="${x}"><ellipse rx="10" ry="3.6" fill="#fb7185" stroke="#be123c" stroke-width="1.3"/><circle r="1.6" fill="#881337"/></g>`).join('')}
      ${[290, 400].map(x => `<path data-a="out" data-x="${x}" d="M 0 -9 V 7 M -5 2 L 0 8 L 5 2" fill="none" stroke="#9f1239" stroke-width="2.4" stroke-linecap="round"/>`).join('')}`;
  }
  return `${[0, 1, 2, 3].map(() => '<circle data-a="mmp" r="3" fill="#dc2626"/>').join('')}
    <text data-a="tag" font-size="10" font-weight="800" fill="#b91c1c" ${HALO}>MMP</text>
    <text data-a="tf" font-size="11" font-weight="800" fill="#7f1d1d" ${HALO}>${en ? 'Tissue factor' : 'Doku faktörü'}</text>
    ${Array.from({ length: 9 }, () => '<g data-a="plt"><ellipse rx="4.2" ry="2.3" fill="#f9a8d4" stroke="#9d174d" stroke-width="1.1"/></g>').join('')}`;
}

/** Group the actor elements of a freshly drawn stage by their data-a name. */
export function collectActors(group) {
  const out = {};
  group.querySelectorAll('[data-a]').forEach(el => { (out[el.dataset.a] ||= []).push(el); });
  return out;
}

const place = (el, x, y, extra = '') => el.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${extra}`);
const show = (el, k) => el.setAttribute('opacity', f2(clamp01(k)));
const each = (list, fn) => (list || []).forEach(fn);

/** Path of a particle crossing the endothelium: q 0 lumen .. 1 intima. */
function crossing(q) {
  const y = q < 0.4 ? lerp(70, 97, q / 0.4) : q < 0.7 ? lerp(97, 113, (q - 0.4) / 0.3) : lerp(113, 140, (q - 0.7) / 0.3);
  return { y, squeeze: q > 0.4 && q < 0.7 ? 0.7 : 1 };
}

function animateEntry(A, u, time) {
  const a = seg(u, 0, 3), b = seg(u, 1, 3), c = seg(u, 2, 3);
  each(A.no, (el, i) => { place(el, LDL_X[i], 91 - 9 * a); show(el, 1 - a); });
  each(A.ldl, (el, i) => {
    const leaving = i === 2 && c > 0;
    const q = leaving ? 1 - c : clamp01(b * 1.3 - i * 0.15);
    const { y, squeeze } = crossing(q);
    const drift = q >= 1 ? 2 * Math.sin(time * 2 + i * 2) : 0;
    place(el, LDL_X[i] + drift, y, ` scale(${squeeze} 1)`);
    show(el, leaving ? ramp(q, 0, 0.12) : ramp(q, 0, 0.08));
  });
  return a;
}

function animateRetention(A, u, time) {
  const a = seg(u, 0, 3), b = seg(u, 1, 3), c = seg(u, 2, 3);
  each(A.ldl, (el, i) => {
    place(el, lerp(LDL_X[i], TRAP[i][0], a), lerp(140, TRAP[i][1], a));
    el.querySelector('[data-skin]').setAttribute('fill', mixHex('#eab308', '#c2410c', b));
    show(el.querySelector('[data-ros]'), b > 0.02 && b < 0.98 ? 0.5 + 0.5 * Math.sin(time * 9 + i) : 0);
  });
  each(A.vcam, el => show(el, c));
  each(A.mcp, (el, j) => {
    const q = frac(time * 0.6 + j / 3);
    place(el, 312 + 33 * j, lerp(104, 62, q));
    show(el, c * (1 - q));
  });
  each(A.tag, el => show(el, c));
}

function animateFoamCell(A, u, time) {
  const a = seg(u, 0, 4), b = seg(u, 1, 4), c = seg(u, 2, 4), d = seg(u, 3, 4);
  each(A.mono, el => {
    let x, y, sx = 1, r = 8, rot = 0;
    if (b <= 0) { x = lerp(170, 318, Math.min(1, a / 0.8)); y = 84; rot = a < 0.8 ? x * 4 : 0; }
    else if (c <= 0) { x = lerp(318, 322, b); y = lerp(84, 140, b); sx = 1 - 0.45 * Math.sin(Math.PI * b); r = lerp(8, 11, b); }
    else { x = lerp(322, CELL[0], c); y = lerp(140, CELL[1], c); r = lerp(11, 20, c); }
    place(el, x, y);
    el.querySelector('[data-body]').setAttribute('transform', `rotate(${f1(rot % 360)}) scale(${f2(sx * r / 8)} ${f2(r / 8)})`);
    const skin = el.querySelector('[data-skin]');
    skin.setAttribute('fill', mixHex('#3b82f6', '#f59e0b', c));
    skin.setAttribute('fill-opacity', f2(lerp(1, 0.35, c)));
    show(el, ramp(a, 0, 0.05));
  });
  each(A.ox, (el, i) => {
    place(el, lerp(TRAP[i][0], CELL[0] + DROPLET[i][0], c), lerp(TRAP[i][1], CELL[1] + DROPLET[i][1], c), ` scale(${f2(lerp(1, 0.6, c))})`);
  });
  each(A.foam, (el, i) => {
    place(el, Number(el.dataset.x), Number(el.dataset.y), ` scale(${f2(1 + 0.04 * Math.sin(time * 3 + i))})`);
    show(el, c);
  });
  each(A.xtal, el => show(el, d));
  each(A.cyto, (el, j) => {
    const q = frac(time * 0.5 + j / 6), ang = j * Math.PI / 3, rr = 24 + 28 * q;
    place(el, CELL[0] + rr * Math.cos(ang), CELL[1] + 0.8 * rr * Math.sin(ang));
    show(el, d * (1 - q));
  });
  each(A.tag, el => show(el, d));
}

function animateCap(A, u, time, geo) {
  const a = seg(u, 0, 4), c = seg(u, 2, 4), d = seg(u, 3, 4);
  each(A.smc, el => {
    const x0 = Number(el.dataset.x), yCap = capYAt(geo, x0 + 10) + 2;
    const tilt = 90 * (1 - a) + (x0 < PLAQUE_CX ? -18 : 18) * a;
    place(el, lerp(x0, x0 + 10, a), lerp(268 + geo.outward * 0.6 * bump(x0), yCap, a), ` rotate(${f1(tilt)})`);
  });
  each(A.foam, el => {
    place(el, Number(el.dataset.x), Number(el.dataset.y), ` scale(${f2(1 + 0.3 * c)})`);
    show(el, 1 - c);
  });
  each(A.xtal, el => show(el, 0.9));
  each(A['core-xtal'], el => show(el, c));
  each(A.out, (el, i) => {
    place(el, Number(el.dataset.x), 300 + geo.outward * 1.1 + 2 * Math.sin(time * 4 + i));
    show(el, d);
  });
}

function animateRupture(A, u, time, geo) {
  const a = seg(u, 0, 4), b = seg(u, 1, 4), c = seg(u, 2, 4);
  const bx = geo.breachX, by = capYAt(geo, bx);
  const digesting = a > 0.02 ? 1 - b : 0;
  each(A.mmp, (el, j) => {
    const q = frac(time * 0.7 + j / 4);
    place(el, lerp(bx - 18 + j * 13, bx, q), lerp(by + 28, by, q));
    show(el, digesting * (1 - q));
  });
  each(A.tag, el => { place(el, bx - 62, by + 34); show(el, digesting); });
  each(A.tf, el => { place(el, bx - 96, by + 6); show(el, b); });
  const k = Math.max(0.05, geo.clot), cy = 86 - geo.encroach * 0.5;
  each(A.plt, (el, i) => {
    const ang = Math.PI * (1.05 + 0.9 * (i / 8));
    const x = lerp(150 + (i % 3) * 20, bx + 10 + 60 * k * Math.cos(ang), c);
    const y = lerp(36 + (i * 7) % 40, cy - 27 * k * Math.sin(ang), c) + 3 * Math.sin(time * 6 + i) * (1 - c);
    place(el, x, y, ` rotate(${f1(time * 120 + i * 40)})`);
    show(el, ramp(c, 0, 0.06));
  });
}

/**
 * Per-frame actor update for stage idx at progress u. `time` (cardiac cycles)
 * only drives small loops such as flicker. Returns endothelial injury 0..1.
 */
export function animateActors(actors, idx, u, time, geo) {
  if (idx === 0) return animateEntry(actors, u, time);
  if (idx === 1) animateRetention(actors, u, time);
  else if (idx === 2) animateFoamCell(actors, u, time);
  else if (idx === 3) animateCap(actors, u, time, geo);
  else animateRupture(actors, u, time, geo);
  return 1;
}

const ring = (x, y, rx, ry) => ({ x, y, rx, ry });
const FOCUS = [
  [() => ring(345, 96, 122, 22), () => ring(345, 108, 96, 40), () => ring(345, 132, 96, 24)],
  [() => ring(345, 161, 108, 26), () => ring(345, 161, 108, 26), () => ring(345, 86, 116, 24)],
  [() => ring(246, 86, 96, 18), () => ring(321, 112, 26, 42), () => ring(345, 172, 66, 34), () => ring(345, 172, 82, 50)],
  [
    geo => ring(345, 262 + geo.outward * 0.5, 150, 22),
    geo => ring(345, capYAt(geo, 345) + 6, geo.coreW * 0.75, 20),
    geo => ring(345, geo.base - geo.coreH * 0.45, geo.coreW * 0.72, Math.max(16, geo.coreH * 0.55)),
    geo => ring(345, 298 + geo.outward, 150, 20)
  ],
  [
    geo => ring(geo.breachX, capYAt(geo, geo.breachX) + 10, 52, 30),
    geo => ring(geo.breachX, capYAt(geo, geo.breachX) - 6, 46, 30),
    geo => ring(geo.breachX + 10, 84, 78, 38),
    () => ring(527, 40, 98, 14)
  ]
];

/** Ellipse (x, y, rx, ry) that frames what the active beat is about. */
export function focusFor(idx, beat, geo) {
  return FOCUS[idx][beat](geo);
}
