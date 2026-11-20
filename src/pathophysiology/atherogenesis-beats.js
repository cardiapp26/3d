// Guided beat timeline for the atheroma station. Every stage is told as three
// or four numbered beats; one stage progress value u (0..1) drives the caption,
// the focus ring, the plaque geometry and the stage actors together, so what
// moves on screen is always the thing the active caption describes, while
// continuous cellular micro-motion keeps the tissue alive across every beat.
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

/** Share of each beat spent in the primary transition; living micro-motion persists throughout. */
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

const LDL_X = [258, 302, 345, 388, 432];
const TRAP = [[268, 156], [308, 166], [345, 154], [384, 168], [422, 158]];
const CELL = [345, 172];
const DROPLET = [[-8, -5], [7, -5], [0, 7], [-5, 5], [6, 4]];
const SMC_X = [212, 265, 318, 372, 425, 476];
const HALO = 'stroke="#fffbeb" stroke-width="3" paint-order="stroke"';

/** Proteoglycan mesh in the intima under the lesion-prone endothelium. */
export function proteoglycanMarkup() {
  return `<g data-am="pg-mesh" stroke="#d97706" stroke-width="1.35" opacity="0.65" fill="none">
      <path data-am-pg="0" d="M 246 152 Q 285 142 320 156 T 390 152 T 444 156"/>
      <path data-am-pg="1" d="M 258 170 Q 300 160 338 172 T 432 168"/>
      ${[272, 310, 348, 386, 424].map(x => `<line x1="${x}" y1="145" x2="${x}" y2="176"/>`).join('')}
    </g>
    <g font-size="11" font-weight="800" fill="#1d4ed8" aria-hidden="true">
      ${[[262, 166], [326, 149], [368, 181], [412, 166]].map(([x, y]) => `<text x="${x}" y="${y}">−</text>`).join('')}
    </g>`;
}

const ldlMarkup = (i = 0) => {
  const isSd = i === 1 || i === 3;
  const isLpa = i === 4;
  const fill = isLpa ? '#a855f7' : (isSd ? '#ea580c' : '#eab308');
  const stroke = isLpa ? '#6b21a8' : (isSd ? '#7c2d12' : '#92400e');
  const r = isSd ? 5.2 : 6.2;
  return `<g data-a="ldl" data-kind="${isLpa ? 'lpa' : (isSd ? 'sd' : 'ldl')}">
    <circle data-vesicle r="${r + 4.2}" fill="#0d9488" fill-opacity="0.16" stroke="#0d9488" stroke-width="1.4" stroke-dasharray="3 2" opacity="0"/>
    <circle data-skin r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <text data-plus y="3" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff" opacity="0">+</text>
    <circle data-ros-ring r="10" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0"/>
    <path data-ros d="M 9 -9 l 2 4 l 4 -2 l -2 4 l 4 2 l -4 1 l 1 4 l -4 -2 l -2 4 l -1 -4 z" fill="#ef4444" opacity="0"/>
  </g>`;
};

const vcamMarkup = () => `<g data-a="vcam-wrap">
  ${[268, 290, 312, 334, 356, 378, 400, 422].map(x => `
    <g data-a="vcam-stalk" data-x="${x}" transform="translate(${x} 97)">
      <path d="M 0 0 V -9 M -3.5 -9 H 3.5" stroke="#1e40af" stroke-width="1.9" stroke-linecap="round" fill="none"/>
    </g>`).join('')}
</g>`;

const foamMarkup = (x, y, r = 15) => `<g data-a="foam" data-x="${x}" data-y="${y}">
  <circle data-membrane r="${r}" fill="#f59e0b" fill-opacity="0.32" stroke="#b45309" stroke-width="2"/>
  <circle cx="-5" cy="-4" r="3.6" fill="#eab308"/><circle cx="5" cy="-3" r="3.2" fill="#eab308"/>
  <circle cx="0" cy="6" r="3.6" fill="#eab308"/><circle cx="-6" cy="5" r="2.4" fill="#fde047"/>
  <line data-a="xtal" x1="-9" y1="9" x2="9" y2="-9" stroke="#fef9c3" stroke-width="2.2" stroke-linecap="round"/>
</g>`;

/** Animated actors for one stage; positioned every frame by animateActors. */
export function actorMarkup(stageIdx, en) {
  if (stageIdx === 0) {
    return `
      ${[210, 280, 350, 420, 490].map(x => `<circle data-a="junc" data-x="${x}" r="5.5" fill="#ef4444" fill-opacity="0.22" stroke="#dc2626" stroke-width="1.2" opacity="0"/>`).join('')}
      ${[250, 300, 345, 390, 440].map(() => `<g data-a="no"><circle r="8.5" fill="#ccfbf1" fill-opacity="0.7" stroke="#0f766e" stroke-width="1"/><text y="3" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0f766e">NO</text></g>`).join('')}
      ${LDL_X.map((_, i) => ldlMarkup(i)).join('')}
      ${[0, 1].map(() => `<path data-a="efflux" d="M 0 12 Q 5 0 0 -12 M -4 -7 L 0 -13 L 4 -7" fill="none" stroke="#0f766e" stroke-width="1.8" stroke-linecap="round" opacity="0"/>`).join('')}`;
  }
  if (stageIdx === 1) {
    return `
      ${TRAP.map(([x, y]) => `<circle data-a="bind-spark" data-x="${x}" data-y="${y}" r="11" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="3 3" opacity="0"/>`).join('')}
      ${LDL_X.map((_, i) => ldlMarkup(i)).join('')}
      ${vcamMarkup()}
      ${[0, 1, 2].map(() => `<circle data-a="mcp-wave" r="14" fill="none" stroke="#db2777" stroke-width="1.4" opacity="0"/>`).join('')}
      ${Array.from({ length: 8 }, () => '<circle data-a="mcp" r="3.1" fill="#db2777" stroke="#fff" stroke-width="0.6"/>').join('')}
      <text data-a="tag" x="484" y="88" font-size="10" font-weight="800" fill="#9d174d" ${HALO}>MCP-1</text>`;
  }
  if (stageIdx === 2) {
    return `${vcamMarkup()}
      ${foamMarkup(266, 188)}${foamMarkup(424, 188)}
      <circle data-a="adhere-glow" r="13" fill="none" stroke="#2563eb" stroke-width="2" opacity="0"/>
      <g data-a="mono-trail" opacity="0"><circle r="6.8" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.6"/>
        <path d="M -3 -1 Q 0 -4 3 -1 Q 1 3 -2 2 Z" fill="#1e3a8a" fill-opacity="0.55"/></g>
      <g data-a="mono">
        <circle data-a="nlrp3-ring" r="22" fill="none" stroke="#db2777" stroke-width="2" opacity="0"/>
        <circle data-a="nlrp3-ring" r="22" fill="none" stroke="#f43f5e" stroke-width="1.4" opacity="0"/>
        <g data-body>
          <circle data-skin r="8" stroke="#1e3a8a" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <path d="M -4 -2 Q 0 -6 4 -2 Q 2 3 -3 2 Z" fill="#1e3a8a" fill-opacity="0.55"/>
        </g>
        <line data-a="xtal" x1="-11" y1="11" x2="11" y2="-11" stroke="#fef9c3" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      ${TRAP.map(() => '<g data-a="ox"><circle r="5.8" fill="#c2410c" stroke="#78350f" stroke-width="1.4"/></g>').join('')}
      ${Array.from({ length: 10 }, () => '<circle data-a="cyto" r="3" fill="#db2777" stroke="#fff" stroke-width="0.5"/>').join('')}
      <text data-a="tag" x="482" y="148" font-size="10" font-weight="800" fill="#9d174d" ${HALO}>NLRP3 → IL-1β → IL-6</text>`;
  }
  if (stageIdx === 3) {
    return `${foamMarkup(294, 206, 12)}${foamMarkup(345, 194, 13)}${foamMarkup(396, 206, 12)}
      ${Array.from({ length: 8 }, () => '<circle data-a="debris" r="3.4" fill="#facc15" stroke="#b45309" stroke-width="0.8" opacity="0"/>').join('')}
      <g data-a="core-xtal" stroke="#fef9c3" stroke-width="2.2" stroke-linecap="round">
        <line x1="286" y1="202" x2="320" y2="184"/><line x1="334" y1="168" x2="372" y2="184"/>
        <line x1="360" y1="212" x2="398" y2="195"/><line x1="316" y1="214" x2="348" y2="224"/>
      </g>
      ${[[312, 178], [362, 172], [386, 208], [328, 204]].map(([x, y]) =>
        `<circle data-a="calc" data-x="${x}" data-y="${y}" r="2.6" fill="#ffffff" stroke="#0284c7" stroke-width="1.1" opacity="0"/>`
      ).join('')}
      <g data-a="vasa" stroke="#e11d48" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0">
        <path d="M 244 256 Q 254 234 268 220 M 256 236 Q 268 232 276 226"/>
        <path d="M 446 256 Q 436 234 422 220 M 434 236 Q 422 232 414 226"/>
      </g>
      ${SMC_X.map(x => `<g data-a="smc" data-x="${x}"><ellipse rx="10.5" ry="3.7" fill="#fb7185" stroke="#be123c" stroke-width="1.3"/><circle r="1.6" fill="#881337"/></g>`).join('')}
      ${Array.from({ length: 6 }, () => '<circle data-a="col-dot" r="2.6" fill="#14b8a6" stroke="#fff" stroke-width="0.6" opacity="0"/>').join('')}
      ${[275, 345, 415].map(x => `<path data-a="out" data-x="${x}" d="M 0 -8 V 7 M -5.5 2 L 0 8 L 5.5 2" fill="none" stroke="#9f1239" stroke-width="2.4" stroke-linecap="round"/>`).join('')}`;
  }
  return `
    ${[0, 1].map(i => `<g data-a="sh-mac" data-idx="${i}">
      <circle r="11" fill="#f59e0b" fill-opacity="0.45" stroke="#b45309" stroke-width="1.8"/>
      <circle cx="-3" cy="-2" r="2.6" fill="#eab308"/><circle cx="3" cy="2" r="2.4" fill="#eab308"/>
    </g>`).join('')}
    ${Array.from({ length: 10 }, () => '<circle data-a="mmp" r="2.9" fill="#dc2626" stroke="#fee2e2" stroke-width="0.6"/>').join('')}
    ${Array.from({ length: 7 }, () => '<circle data-a="tf-dot" r="3.4" fill="#facc15" stroke="#b91c1c" stroke-width="1.2" opacity="0"/>').join('')}
    <text data-a="tag" text-anchor="end" font-size="10" font-weight="800" fill="#b91c1c" ${HALO}>MMP-1/8/13</text>
    <text data-a="tf" text-anchor="end" font-size="11" font-weight="800" fill="#7f1d1d" ${HALO}>${en ? 'Tissue factor (TF)' : 'Doku faktörü (TF)'}</text>
    ${Array.from({ length: 14 }, () => `<g data-a="plt">
      <ellipse rx="4.4" ry="2.4" fill="#f9a8d4" stroke="#9d174d" stroke-width="1.1"/>
      <circle r="1.1" fill="#be123c"/>
    </g>`).join('')}`;
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
  const y = q < 0.35 ? lerp(66, 97, q / 0.35) : q < 0.7 ? lerp(97, 114, (q - 0.35) / 0.35) : lerp(114, 142, (q - 0.7) / 0.3);
  const inCell = q > 0.35 && q < 0.72;
  return { y, squeeze: inCell ? 0.74 : 1, inCell };
}

function animateEntry(A, u, time, ctx) {
  const a = seg(u, 0, 3), b = seg(u, 1, 3), c = seg(u, 2, 3);
  const fluxScale = clamp01(((ctx.apoBFlux || 130) - 40) / 200);

  // Beat 0: NO bubbles rise & shrink as barrier loosens; junction gaps pulse
  each(A.no, (el, i) => {
    const q = frac(time * 0.55 + i / 5);
    const fade = (1 - 0.85 * a) * Math.sin(q * Math.PI);
    const s = lerp(1.0, 0.55, a);
    place(el, 250 + i * 47 + 4 * Math.sin(time * 3 + i), lerp(95, 58, q), ` scale(${f2(s)})`);
    show(el, fade);
  });
  each(A.junc, (el, i) => {
    const x = Number(el.dataset.x);
    const pulse = 0.65 + 0.35 * Math.sin(time * 5 + i);
    place(el, x, 102, ` scale(${f2(0.75 + 0.35 * a * pulse)})`);
    show(el, a * 0.85 * pulse);
  });

  // Beat 1 & 2: Caveolar transcytosis with glowing vesicles; unretained particles efflux back
  each(A.ldl, (el, i) => {
    const isEfflux = (i === 1 || i === 4) && c > 0;
    let q;
    if (b <= 0) {
      // Even in Beat 0, particles visibly hover near the loosened endothelial surface
      const hover = 0.14 + 0.08 * Math.sin(time * 3.2 + i * 1.4);
      q = hover * a;
    } else if (isEfflux) {
      const cycle = c >= 0.98 ? frac(time * 0.45 + i * 0.3) : c;
      q = 1 - Math.sin(cycle * Math.PI * 0.5);
    } else {
      const enter = clamp01(b * 1.35 - i * 0.11);
      q = b >= 0.98 && i === 0 ? frac(time * 0.42 + 0.2) : enter;
    }
    const { y, squeeze, inCell } = crossing(q);
    const sway = Math.sin(time * 3.2 + i * 1.7) * (q >= 0.95 ? 4 : 2.5);
    place(el, LDL_X[i] + sway, y, ` scale(${f2(squeeze)} 1)`);
    show(el, b <= 0 ? a * (0.45 + 0.35 * fluxScale) : ramp(q, 0, 0.08));
    const ves = el.querySelector('[data-vesicle]');
    if (ves) show(ves, inCell ? 0.75 + 0.25 * Math.sin(time * 10 + i) : 0);
  });

  each(A.efflux, (el, idx) => {
    const x = LDL_X[idx === 0 ? 1 : 4];
    const q = frac(time * 0.65 + idx * 0.5);
    place(el, x + 13, lerp(136, 82, q));
    show(el, c * Math.sin(q * Math.PI) * 0.9);
  });

  return { injury: a, endoPart: 0 };
}

function animateRetention(A, u, time, ctx) {
  const a = seg(u, 0, 3), b = seg(u, 1, 3), c = seg(u, 2, 3);
  const inflamBoost = 0.7 + 0.6 * (ctx.inflam || 0.2);

  // Beat 0: Electrostatic docking onto proteoglycan chains (+ / - binding glow)
  each(A['bind-spark'], (el, i) => {
    const q = frac(time * 0.8 + i * 0.2);
    const x = Number(el.dataset.x), y = Number(el.dataset.y);
    place(el, x, y, ` scale(${f2(0.6 + 0.7 * q)})`);
    show(el, a * (1 - 0.6 * b) * (1 - q));
  });

  // Beat 0 & 1: Particles descend, lock, oxidize (continuous ROS sparks) & clump slightly
  each(A.ldl, (el, i) => {
    const clusterX = lerp(TRAP[i][0], PLAQUE_CX + (TRAP[i][0] - PLAQUE_CX) * 0.76, b);
    const clusterY = lerp(TRAP[i][1], 162 + (i % 2 ? 5 : -5), b);
    const x = lerp(LDL_X[i], clusterX, a) + Math.sin(time * 2.8 + i * 1.5) * (1.8 * (1 - 0.5 * a));
    const y = lerp(136, clusterY, a) + Math.cos(time * 3.5 + i) * 1.3;
    const oxPulse = 1 + 0.06 * b * Math.sin(time * 5 + i);
    place(el, x, y, ` scale(${f2(oxPulse)})`);
    el.querySelector('[data-skin]').setAttribute('fill', mixHex('#eab308', '#c2410c', b));
    const plus = el.querySelector('[data-plus]');
    if (plus) show(plus, a * (1 - b * 0.7));
    const ros = el.querySelector('[data-ros]');
    const rosRing = el.querySelector('[data-ros-ring]');
    const rosFlicker = b > 0.02 ? (0.4 + 0.6 * Math.abs(Math.sin(time * 7 * inflamBoost + i * 1.3))) * (b < 0.98 ? 1 : 0.45) : 0;
    if (ros) {
      ros.setAttribute('transform', `rotate(${f1(time * 90 + i * 45)})`);
      show(ros, rosFlicker);
    }
    if (rosRing) {
      const rq = frac(time * 0.75 * inflamBoost + i * 0.2);
      rosRing.setAttribute('transform', `scale(${f2(0.6 + 0.9 * rq)})`);
      show(rosRing, b * (1 - rq) * 0.7);
    }
  });

  // Beat 2: VCAM-1 stalks sprout up & sway; MCP-1 chemokine plume + signal rings rise
  each(A['vcam-stalk'], (el, i) => {
    const x = Number(el.dataset.x);
    const sway = Math.sin(time * 4 + i * 0.8) * 6 * c;
    el.setAttribute('transform', `translate(${x} 97) rotate(${f1(sway)}) scale(1 ${f2(Math.max(0.01, c))})`);
    show(el, c);
  });
  each(A['mcp-wave'], (el, i) => {
    const q = frac(time * 0.55 * inflamBoost + i / 3);
    place(el, 290 + i * 55, 96, ` scale(${f2(0.4 + 1.8 * q)})`);
    show(el, c * (1 - q) * 0.65);
  });
  each(A.mcp, (el, j) => {
    const q = frac(time * 0.68 * inflamBoost + j / 8);
    const x = 258 + j * 24 + 8 * Math.sin(q * Math.PI * 2 + j);
    place(el, x, lerp(102, 46, q));
    show(el, c * Math.sin(q * Math.PI));
  });
  each(A.tag, el => show(el, c));
  return { injury: 0.7 + 0.3 * c, endoPart: 0 };
}

function animateFoamCell(A, u, time, ctx) {
  const a = seg(u, 0, 4), b = seg(u, 1, 4), c = seg(u, 2, 4), d = seg(u, 3, 4);
  const inflamBoost = 0.7 + 0.7 * (ctx.inflam || 0.2);

  // VCAM stalks stay active and sway slightly
  each(A['vcam-stalk'], (el, i) => {
    const x = Number(el.dataset.x);
    el.setAttribute('transform', `translate(${x} 97) rotate(${f1(Math.sin(time * 3.5 + i) * 5)})`);
    show(el, 1);
  });

  // Trailing monocyte keeps rolling along the lumen for continuous recruitment feel
  each(A['mono-trail'], el => {
    const q = frac(time * 0.35);
    const tx = lerp(148, 304, q);
    const ty = 83 + Math.abs(Math.sin(q * Math.PI * 5)) * -3;
    place(el, tx, ty, ` rotate(${f1(q * 540)})`);
    show(el, Math.sin(q * Math.PI) * 0.85);
  });

  // Lead monocyte rolls, arrests on VCAM-1, transmigrates (parting endothelium), becomes foam cell
  const endoPart = b > 0 && c <= 0.15 ? Math.sin(Math.PI * clamp01(b)) : 0;
  each(A.mono, el => {
    let x, y, sx = 1, sy = 1, r = 8, rot = 0;
    if (b <= 0) {
      const rollK = Math.min(1, a / 0.78);
      x = lerp(155, 322, rollK);
      y = 83 - (a < 0.78 ? Math.abs(Math.sin(rollK * Math.PI * 5)) * 4 : 0);
      rot = a < 0.78 ? rollK * 480 : 0;
    } else if (c <= 0) {
      x = lerp(322, 326, b);
      y = lerp(83, 142, b);
      const squeeze = Math.sin(Math.PI * b);
      sx = 1 - 0.48 * squeeze;
      sy = 1 + 0.32 * squeeze;
      r = lerp(8, 12, b);
    } else {
      x = lerp(326, CELL[0], c);
      y = lerp(142, CELL[1], c);
      const breathe = 1 + 0.055 * Math.sin(time * 4.2);
      r = lerp(12, 21, c) * breathe;
    }
    place(el, x, y);
    el.querySelector('[data-body]').setAttribute('transform', `rotate(${f1(rot % 360)}) scale(${f2(sx * r / 8)} ${f2(sy * r / 8)})`);
    const skin = el.querySelector('[data-skin]');
    skin.setAttribute('fill', mixHex('#3b82f6', '#f59e0b', c));
    skin.setAttribute('fill-opacity', f2(lerp(0.95, 0.36, c)));
    show(el, ramp(a, 0, 0.05));
  });

  // Adhesion sparkle when monocyte docks on VCAM-1
  each(A['adhere-glow'], el => {
    const q = frac(time * 0.9);
    const active = a > 0.7 && b < 0.4 ? 1 : 0;
    place(el, 322, 92, ` scale(${f2(0.6 + 0.8 * q)})`);
    show(el, active * (1 - q));
  });

  // 5 oxLDL clusters pulled into the macrophage as lipid droplets
  each(A.ox, (el, i) => {
    const pull = smooth(clamp01(c * 1.25 - i * 0.06));
    const jitter = (1 - pull) * 2 * Math.sin(time * 4 + i);
    place(
      el,
      lerp(TRAP[i][0], CELL[0] + DROPLET[i][0], pull) + jitter,
      lerp(TRAP[i][1], CELL[1] + DROPLET[i][1], pull),
      ` scale(${f2(lerp(1, 0.58, pull))})`
    );
  });

  // Neighboring foam cells grow smoothly with breathing pulse
  each(A.foam, (el, i) => {
    const grow = lerp(0.35, 1, c);
    const pulse = grow * (1 + 0.05 * Math.sin(time * 3.4 + i * 2));
    place(el, Number(el.dataset.x), Number(el.dataset.y), ` scale(${f2(pulse)})`);
    show(el, ramp(c, 0.1, 0.7));
  });

  // Beat 3: Cholesterol crystal glint + NLRP3 expanding rings + continuous IL-1b/IL-6 shower
  each(A.xtal, (el, i) => {
    const glint = 0.72 + 0.28 * Math.sin(time * 6 + i * 1.6);
    show(el, d * glint);
  });
  each(A['nlrp3-ring'], (el, i) => {
    const q = frac(time * 0.55 * inflamBoost + i * 0.5);
    el.setAttribute('transform', `scale(${f2(0.6 + 1.5 * q)})`);
    show(el, d * (1 - q) * 0.85);
  });
  each(A.cyto, (el, j) => {
    const q = frac(time * 0.62 * inflamBoost + j / 10);
    const ang = -Math.PI * 0.95 + (j / 9) * Math.PI * 1.9;
    const rr = 22 + 38 * q;
    place(el, CELL[0] + rr * Math.cos(ang), CELL[1] + 0.72 * rr * Math.sin(ang) - 8 * q);
    show(el, d * Math.sin(q * Math.PI));
  });
  each(A.tag, el => show(el, d));
  return { injury: 1, endoPart };
}

function animateCap(A, u, time, geo) {
  const a = seg(u, 0, 4), b = seg(u, 1, 4), c = seg(u, 2, 4), d = seg(u, 3, 4);

  // Beat 0 & 1: 6 VSMCs migrate along curved paths through IEL & align on the dome
  each(A.smc, (el, i) => {
    const x0 = Number(el.dataset.x);
    const stagger = smooth(clamp01(a * 1.25 - (i % 3) * 0.08));
    const targetX = lerp(x0, PLAQUE_CX + (x0 - PLAQUE_CX) * 0.74, stagger);
    const yStart = 268 + geo.outward * 0.6 * bump(x0);
    const yCap = capYAt(geo, targetX) + 3;
    const arcX = Math.sin(stagger * Math.PI) * (x0 < PLAQUE_CX ? -10 : 10);
    const y = lerp(yStart, yCap, stagger) + (stagger > 0.95 ? 1.4 * Math.sin(time * 3.5 + i) : 0);
    const targetAngle = (targetX - PLAQUE_CX) * 0.14;
    const tilt = lerp(90, targetAngle, stagger);
    const synthPulse = 1 + 0.08 * b * Math.sin(time * 5 + i);
    place(el, targetX + arcX, y, ` rotate(${f1(tilt)}) scale(${f2(synthPulse)})`);
  });

  // Beat 1: VSMCs secrete collagen precursor droplets into the weaving fibrous cap
  each(A['col-dot'], (el, i) => {
    const x0 = PLAQUE_CX + (SMC_X[i] - PLAQUE_CX) * 0.74;
    const q = frac(time * 0.75 + i / 6);
    const yCap = capYAt(geo, x0);
    place(el, x0 + 6 * Math.sin(q * Math.PI + i), lerp(yCap + 8, yCap - 3, q));
    show(el, b * (1 - 0.4 * c) * Math.sin(q * Math.PI));
  });

  // Beat 2: Foam cells swell & lyse into necrotic lipid debris, crystal clefts, microcalcifications & vasa vasorum
  each(A.foam, (el, i) => {
    const wobble = c > 0.05 ? 2.2 * Math.sin(time * 10 + i * 2) * c : 0;
    place(el, Number(el.dataset.x) + wobble, Number(el.dataset.y), ` scale(${f2(1 + 0.35 * c)})`);
    show(el, 1 - c);
  });
  each(A.debris, (el, i) => {
    const ang = time * 0.9 + i * 0.8;
    const rx = 20 + (i % 4) * 14, ry = 8 + (i % 3) * 8;
    place(el, PLAQUE_CX + rx * Math.cos(ang), geo.base - geo.coreH * 0.45 + ry * Math.sin(ang));
    show(el, c * 0.85);
  });
  each(A.xtal, el => show(el, 0.9));
  each(A['core-xtal'], el => show(el, c * (0.78 + 0.22 * Math.sin(time * 4.5))));
  each(A.calc, (el, i) => {
    const x = Number(el.dataset.x), y = Number(el.dataset.y);
    const twinkle = 0.55 + 0.45 * Math.sin(time * 6 + i * 1.9);
    place(el, x, y, ` scale(${f2(0.75 + 0.4 * twinkle)})`);
    show(el, c * twinkle);
  });
  each(A.vasa, el => show(el, c * (0.75 + 0.25 * Math.sin(time * 3.8))));

  // Beat 3: Clear Glagov outward remodeling arrows inside the 340px viewport
  each(A.out, (el, i) => {
    const pulse = 3.5 * Math.sin(time * 4.5 + i * 0.8);
    place(el, Number(el.dataset.x), 305 + geo.outward * 0.65 + pulse);
    show(el, d);
  });
  return { injury: 1, endoPart: 0 };
}

function animateRupture(A, u, time, geo, ctx) {
  const a = seg(u, 0, 4), b = seg(u, 1, 4), c = seg(u, 2, 4);
  const bx = geo.breachX, by = capYAt(geo, bx);
  const inflamBoost = 0.75 + 0.65 * (ctx.inflam || 0.2);
  const isAps = ctx.modifierId === 'aps';

  // Beat 0: Shoulder macrophages pulse & fire a dense stream of MMP enzymes into the cap shoulder
  const digesting = a > 0.02 ? 1 - 0.7 * b : 0;
  each(A['sh-mac'], (el, i) => {
    const pulse = 1 + 0.1 * Math.sin(time * 5.5 * inflamBoost + i * 2);
    place(el, bx - 16 + i * 32, by + 34, ` scale(${f2(pulse)})`);
    show(el, ramp(a, 0, 0.15) * (1 - 0.35 * c));
  });
  each(A.mmp, (el, j) => {
    const q = frac(time * 0.88 * inflamBoost + j / 10);
    const sx = bx - 22 + (j % 5) * 11;
    place(el, lerp(sx, bx + (j % 3 - 1) * 6, q), lerp(by + 30, by - 2, q));
    show(el, digesting * Math.sin(q * Math.PI));
  });
  each(A.tag, el => { place(el, bx - 32, by + 38); show(el, digesting); });

  // Beat 1: Rupture spills necrotic lipid debris & glowing Tissue Factor (TF) out into the lumen
  each(A['tf-dot'], (el, i) => {
    const q = frac(time * 0.8 + i / 7);
    const spread = (i - 3) * 8;
    place(el, lerp(bx, bx + spread, q), lerp(by + 6, 78 - geo.encroach * 0.4 - (i % 3) * 7, q));
    show(el, b * (1 - 0.6 * c) * Math.sin(q * Math.PI));
  });
  each(A.tf, el => { place(el, bx - 22, by + 2); show(el, b); });

  // Beat 2 & 3: Platelets stream continuously from left lumen, stick & spin around the growing thrombus
  const k = Math.max(0.08, geo.clot), cy = 86 - geo.encroach * 0.5;
  const pltSpeed = isAps ? 1.15 : 0.78;
  each(A.plt, (el, i) => {
    const ang = Math.PI * (1.02 + 0.96 * (i / 13));
    const targetX = bx + 10 + 58 * k * Math.cos(ang);
    const targetY = cy - 26 * k * Math.sin(ang);
    // 5 platelets continuously stream in from the left lumen to show ongoing recruitment
    if (i >= 9 && c > 0.35) {
      const q = frac(time * pltSpeed + (i - 9) / 5);
      const x = lerp(142, targetX, q);
      const y = lerp(42 + (i % 3) * 14, targetY, q) + 4 * Math.sin(q * Math.PI * 2);
      place(el, x, y, ` rotate(${f1(time * 200 + i * 50)})`);
      show(el, c * Math.sin(q * Math.PI));
      return;
    }
    const arrive = smooth(clamp01(c * 1.25 - i * 0.04));
    const x = lerp(146 + (i % 3) * 18, targetX, arrive);
    const y = lerp(34 + (i * 9) % 42, targetY, arrive) + 3 * Math.sin(time * 6 + i) * (1 - arrive * 0.7);
    place(el, x, y, ` rotate(${f1(time * 130 + i * 42)})`);
    show(el, ramp(c, 0, 0.06));
  });
  return { injury: 1, endoPart: 0 };
}

/**
 * Per-frame actor update for stage idx at progress u. `time` (cardiac cycles)
 * drives continuous living micro-motion (vesicles, ROS, chemokines, rolling,
 * secretion, MMP attack, platelet influx). Returns { injury, endoPart }.
 */
export function animateActors(actors, idx, u, time, geo, ctx = {}) {
  if (idx === 0) return animateEntry(actors, u, time, ctx);
  if (idx === 1) return animateRetention(actors, u, time, ctx);
  if (idx === 2) return animateFoamCell(actors, u, time, ctx);
  if (idx === 3) return animateCap(actors, u, time, geo, ctx);
  return animateRupture(actors, u, time, geo, ctx);
}

const ring = (x, y, rx, ry) => ({ x, y, rx, ry });
const FOCUS = [
  [() => ring(345, 92, 126, 24), () => ring(345, 108, 106, 40), () => ring(345, 130, 104, 28)],
  [() => ring(345, 160, 114, 26), () => ring(345, 160, 114, 26), () => ring(345, 84, 120, 26)],
  [() => ring(246, 86, 98, 20), () => ring(324, 112, 28, 42), () => ring(345, 172, 74, 36), () => ring(345, 172, 92, 52)],
  [
    geo => ring(345, 258 + geo.outward * 0.5, 154, 24),
    geo => ring(345, capYAt(geo, 345) + 6, geo.coreW * 0.78, 22),
    geo => ring(345, geo.base - geo.coreH * 0.45, geo.coreW * 0.74, Math.max(18, geo.coreH * 0.56)),
    geo => ring(345, 305 + geo.outward * 0.55, 108, 16)
  ],
  [
    geo => ring(geo.breachX, capYAt(geo, geo.breachX) + 10, 56, 32),
    geo => ring(geo.breachX, capYAt(geo, geo.breachX) - 6, 52, 32),
    geo => ring(geo.breachX + 10, 84, 82, 38),
    () => ring(527, 40, 98, 14)
  ]
];

/** Ellipse (x, y, rx, ry) that frames what the active beat is about. */
export function focusFor(idx, beat, geo) {
  return FOCUS[idx][beat](geo);
}
