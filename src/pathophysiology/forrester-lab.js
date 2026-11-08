// Forrester Matrix & Acute Heart Failure Lab: 2x2 hemodynamic classification,
// animated on the shared cardiac clock (patient point, treatments, live heart panel).
import { FORRESTER_PROFILES } from './pathophysiology-data.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';

// Styles load only in the browser so the Node test runner can import this module.
if (typeof document !== 'undefined') import('./forrester-motion.css');

const BPM = 75;
const CI_CUT = 2.2;
const PCWP_CUT = 18;
const PLOT = { w: 540, h: 380, top: 35, right: 30, bottom: 45, left: 55, pMin: 4, pMax: 36, cMin: 1.0, cMax: 4.0 };
const PLOT_W = PLOT.w - PLOT.left - PLOT.right;
const PLOT_H = PLOT.h - PLOT.top - PLOT.bottom;
// Plausible range for treatment results (profiles span CI 1.5-2.8, PCWP 11-26).
const LIMITS = { ciMin: 1.3, ciMax: 3.4, pMin: 8, pMax: 30 };
const TRAIL_MS = 2600;
const ARROW_MS = 4200;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const scaleX = pcwp => PLOT.left + ((clamp(pcwp, PLOT.pMin, PLOT.pMax) - PLOT.pMin) / (PLOT.pMax - PLOT.pMin)) * PLOT_W;
const scaleY = ci => PLOT.top + ((PLOT.cMax - clamp(ci, PLOT.cMin, PLOT.cMax)) / (PLOT.cMax - PLOT.cMin)) * PLOT_H;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function determineQuadrant(ci, pcwp) {
  if (ci >= CI_CUT && pcwp <= PCWP_CUT) return 'I';
  if (ci >= CI_CUT) return 'II';
  if (pcwp <= PCWP_CUT) return 'III';
  return 'IV';
}

/** Perfusion (0 cold .. 1 warm) and congestion (0 dry .. 1 wet) on continuous scales. */
export const warmth = ci => clamp((ci - 1.4) / 1.4, 0, 1);
export const wetness = pcwp => clamp((pcwp - 14) / 12, 0, 1);
/** Stroke volume index (mL/m2) = CI / HR. */
export const strokeVolumeIndex = (ci, bpm = BPM) => (ci * 1000) / bpm;

// Treatment vectors on the CI-PCWP plane, with the context-dependent caveats taught at the bedside.
export const TREATMENTS = Object.freeze([
  {
    id: 'diuretic', color: '#0ea5e9',
    label: { tr: 'Diüretik / venodilatatör', en: 'Diuretic / venodilator' },
    note: { tr: 'Ön-yük azalır: PCWP düşer; düz Starling eğrisinde CI pek değişmez (sola kayış).', en: 'Preload falls: PCWP drops while CI barely changes on a flat Starling curve (shift left).' },
    warn: { tr: 'Uyarı: kuru hastada diürez ön-yükü ve CI\'yı düşürür.', en: 'Caution: diuresis in a dry patient lowers preload and CI.' },
    apply: ({ ci, pcwp }) => ({ ci: pcwp - 7 < 13 ? ci - 0.2 : ci, pcwp: pcwp - 7 }),
    isRisky: ({ pcwp }) => pcwp <= 14
  },
  {
    id: 'inotrope', color: '#a855f7',
    label: { tr: 'İnotrop (dobutamin)', en: 'Inotrope (dobutamine)' },
    note: { tr: 'Kontraktilite artar: CI yükselir, PCWP hafif düşer (yukarı kayış).', en: 'Contractility rises: CI increases, PCWP falls slightly (shift up).' },
    warn: { tr: 'Not: sıcak hastada inotrop endikasyonu yoktur (aritmi, miyokard O2 tüketimi).', en: 'Note: inotropes are not indicated when warm (arrhythmia, myocardial O2 demand).' },
    apply: ({ ci, pcwp }) => ({ ci: ci + 0.6, pcwp: pcwp - 2 }),
    isRisky: ({ ci }) => ci >= CI_CUT
  },
  {
    id: 'vasodilator', color: '#22c55e',
    label: { tr: 'Vazodilatatör (nitroprussid)', en: 'Vasodilator (nitroprusside)' },
    note: { tr: 'Ard-yük ve ön-yük azalır: CI artar, PCWP düşer (sol-yukarı kayış).', en: 'Afterload and preload fall: CI rises, PCWP drops (shift up and left).' },
    warn: { tr: 'Uyarı: hipotansiyonda (SKB < 90 mmHg) vazodilatatörden kaçınılır.', en: 'Caution: avoid vasodilators when hypotensive (SBP < 90 mmHg).' },
    apply: ({ ci, pcwp }) => ({ ci: ci + 0.4, pcwp: pcwp - 6 }),
    isRisky: ({ ci, pcwp }) => determineQuadrant(ci, pcwp) === 'IV'
  },
  {
    id: 'fluids', color: '#f97316',
    label: { tr: 'Sıvı yükleme (250-500 mL)', en: 'Fluid challenge (250-500 mL)' },
    note: { tr: 'Ön-yük artar: Starling eğrisinde CI yükselir, PCWP artar (sağ-yukarı kayış). Soğuk-kuru profil içindir.', en: 'Preload rises: CI climbs the Starling curve, PCWP increases (shift up and right). For cold and dry.' },
    warn: { tr: 'Uyarı: ıslak hastada sıvı CI\'yı artırmaz, konjesyonu ağırlaştırır.', en: 'Caution: in a wet patient fluid adds congestion without raising CI.' },
    apply: ({ ci, pcwp }) => ({ ci: pcwp > PCWP_CUT ? ci + 0.05 : ci + 0.45, pcwp: pcwp + 5 }),
    isRisky: ({ pcwp }) => pcwp > PCWP_CUT
  }
]);

/** Treatment result kept inside the plausible range. */
export function applyTreatment(id, point) {
  const tx = TREATMENTS.find(t => t.id === id);
  if (!tx) return { ...point };
  const next = tx.apply(point);
  return { ci: clamp(next.ci, LIMITS.ciMin, LIMITS.ciMax), pcwp: clamp(next.pcwp, LIMITS.pMin, LIMITS.pMax) };
}

/** Point on a gently curved path from a to b at k (quadratic Bezier in normalised plot space). */
export function glidePoint(a, b, k) {
  const n = p => ({ x: (p.pcwp - PLOT.pMin) / (PLOT.pMax - PLOT.pMin), y: (p.ci - PLOT.cMin) / (PLOT.cMax - PLOT.cMin) });
  const A = n(a), B = n(b);
  const dx = B.x - A.x, dy = B.y - A.y;
  const C = { x: (A.x + B.x) / 2 - dy * 0.18, y: (A.y + B.y) / 2 + dx * 0.18 };
  const u = 1 - k;
  const x = u * u * A.x + 2 * u * k * C.x + k * k * B.x;
  const y = u * u * A.y + 2 * u * k * C.y + k * k * B.y;
  return { pcwp: PLOT.pMin + x * (PLOT.pMax - PLOT.pMin), ci: PLOT.cMin + y * (PLOT.cMax - PLOT.cMin) };
}

// Atrial kick and v-wave timing taken from the reference cycle (phase windows).
const CYCLE_MARKS = (() => {
  let ivc = 0.4, ivr = 0.9, prev = cycleShape(0).phase;
  for (let i = 1; i < 400; i += 1) {
    const ph = cycleShape(i / 400).phase;
    if (prev === 'filling' && ph === 'ivc') ivc = i / 400;
    if (prev === 'ejection' && ph === 'ivr') ivr = i / 400;
    prev = ph;
  }
  return { ivc, ivr };
})();
const bump = (u, c, w) => { const d = Math.min(Math.abs(u - c), 1 - Math.abs(u - c)); return Math.exp(-(d * d) / (2 * w * w)); };
/** Schematic jugular venous waveform (0..1): a wave at atrial systole, v wave at end-systole. */
export const jvpWave = u => 0.9 * bump(u, CYCLE_MARKS.ivc - 0.04, 0.035) + 0.6 * bump(u, CYCLE_MARKS.ivr, 0.05);

function mix(c1, c2, f) {
  return `rgb(${c1.map((c, i) => Math.round(c + (c2[i] - c) * f)).join(',')})`;
}

function getQuadrantInfo(quadrant, isTr) {
  switch (quadrant) {
    case 'I':
      return {
        title: isTr ? 'Profil I: Sıcak ve Kuru (Normal / Kompanse)' : 'Profile I: Warm & Dry (Normal / Compensated)',
        status: isTr ? 'Yeterli Perfüzyon · Konjesyon Yok' : 'Adequate Perfusion · No Congestion',
        color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', mortality: '1 - 3%',
        clinical: isTr
          ? 'Ekstremiteler sıcak, perfüzyon tam. Pulmoner raller veya periferik ödem yoktur. Hastanın doku oksijenasyonu ve venöz dolum basınçları dengededir.'
          : 'Warm extremities with crisp capillary refill. No pulmonary rales or peripheral edema. Balanced systemic oxygen delivery and physiological filling pressures.',
        management: isTr
          ? 'Kılavuz bazlı medikal tedavi (GDMT: SGLT2i, ARNI/ACEi, Beta-bloker, MRA) optimizasyonu ve poliklinik takibi.'
          : 'Optimize guideline-directed medical therapy (GDMT: SGLT2i, ARNI/ACEi, Beta-blocker, MRA) and elective follow-up.'
      };
    case 'II':
      return {
        title: isTr ? 'Profil II: Sıcak ve Islak (Pulmoner Konjestif KY)' : 'Profile II: Warm & Wet (Pulmonary Congestion)',
        status: isTr ? 'Yeterli Perfüzyon · Akut Pulmoner Konjesyon' : 'Adequate Perfusion · Pulmonary Congestion',
        color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', mortality: '8 - 11%',
        clinical: isTr
          ? 'Ekstremiteler sıcak ancak solunumsal sıkıntı belirgindir: Akut dispne, ortopne, akciğer bazallerinde yaş raller, juguler venöz dolgunluk (JVD) ve S3 gallop.'
          : 'Warm extremities with preserved perfusion but acute dyspnea, orthopnea, bilateral pulmonary crackles, elevated JVP, and S3 gallop.',
        management: isTr
          ? 'Agresif dekonjesyon: İntravenöz loop diüretik (furosemid) bolus/infüzyon. Kan basıncı normotansif/hipertansif ise İV vazodilatatör (nitrogliserin).'
          : 'Aggressive decongestion: IV loop diuretics (furosemide bolus/infusion). If normotensive/hypertensive, add IV vasodilators (nitroglycerin) to reduce preload.'
      };
    case 'III':
      return {
        title: isTr ? 'Profil III: Soğuk ve Kuru (Hipovolemik / Düşük Debi)' : 'Profile III: Cold & Dry (Hypoperfusion without Congestion)',
        status: isTr ? 'Doku Hipoperfüzyonu · Konjesyon Yok (Düşük Dolum)' : 'Hypoperfusion · No Congestion (Low Filling)',
        color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', mortality: '18 - 22%',
        clinical: isTr
          ? 'Ekstremiteler soğuk ve soluk, nabızlar filiform, mental konfüzyon riski, oligüri ve prerenal azotemi. Akciğer sesleri temizdir (dolum basıncı yetersizdir).'
          : 'Cool, pale extremities, thready pulses, altered sensorium, oliguria, and prerenal azotemia. Lungs are clear (depleted ventricular filling volume).',
        management: isTr
          ? 'Aşırı diürezden kaçınma. Dikkatli sıvı yükleme (250-500 mL kristalloid ile sol ventrikül dolum basıncı 14-16 mmHg olana dek test). Düzelmezse inotropik destek.'
          : 'Stop diuresis. Cautious fluid bolus (250-500 mL crystalloid challenge aiming for PCWP 14-16 mmHg). If hypoperfusion persists, consider inotropes.'
      };
    default:
      return {
        title: isTr ? 'Profil IV: Soğuk ve Islak (Kardiyojenik Şok)' : 'Profile IV: Cold & Wet (Cardiogenic Shock)',
        status: isTr ? 'Ağır Doku Hipoperfüzyonu + Ağır Pulmoner Konjesyon' : 'Severe Hypoperfusion + Severe Congestion',
        color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', mortality: '40 - 55%',
        clinical: isTr
          ? 'En ağır klinik tablo: Hipotansiyon (SKB < 90 mmHg), soğuk terli ekstremiteler, laktik asidoz (>2 mmol/L), bilateral yaygın raller, anüri ve koma meyli.'
          : 'Critically ill: Refractory hypotension (SBP < 90 mmHg), cold clammy extremities, lactic acidosis, diffuse wet crackles, anuria, and organ failure.',
        management: isTr
          ? 'Acil inotrop (dobutamin, milrinon), vazopressör (ortalama arter basıncını >65 mmHg tutmak için noradrenalin), erken perkütan mekanik dolaşım desteği (Impella / ECMO / IABP).'
          : 'Emergency inotropes (dobutamine/milrinone), vasopressors (norepinephrine to maintain MAP > 65), and early mechanical circulatory support (Impella, ECMO).'
      };
  }
}

/** Estimated readouts (MAP and CVP assumed per profile, as in the original station). */
export function estimateHemodynamics(ci, pcwp) {
  const q = determineQuadrant(ci, pcwp);
  const map = q === 'IV' ? 62 : (q === 'III' ? 70 : 88);
  const cvp = q === 'IV' ? 16 : (q === 'II' ? 14 : (q === 'III' ? 4 : 6));
  return { quadrant: q, map, cvp, svri: Math.round(((map - cvp) / ci) * 80), cpo: (map * ci * 1.8) / 451 };
}

function quadrantRects(isTr) {
  const cx = scaleX(PCWP_CUT), cy = scaleY(CI_CUT), r = PLOT.w - PLOT.right, b = PLOT.h - PLOT.bottom;
  const quads = [
    { x: PLOT.left, y: PLOT.top, w: cx - PLOT.left, h: cy - PLOT.top, fill: 'rgba(16, 185, 129, 0.08)', c: '#10b981', ty: PLOT.top + 24, t: `I: ${isTr ? 'SICAK & KURU' : 'WARM & DRY'}` },
    { x: cx, y: PLOT.top, w: r - cx, h: cy - PLOT.top, fill: 'rgba(245, 158, 11, 0.08)', c: '#f59e0b', ty: PLOT.top + 24, t: `II: ${isTr ? 'SICAK & ISLAK' : 'WARM & WET'}` },
    { x: PLOT.left, y: cy, w: cx - PLOT.left, h: b - cy, fill: 'rgba(6, 182, 212, 0.08)', c: '#06b6d4', ty: cy + 28, t: `III: ${isTr ? 'SOĞUK & KURU' : 'COLD & DRY'}` },
    { x: cx, y: cy, w: r - cx, h: b - cy, fill: 'rgba(239, 68, 68, 0.09)', c: '#ef4444', ty: cy + 28, t: `IV: ${isTr ? 'SOĞUK & ISLAK (ŞOK)' : 'COLD & WET (SHOCK)'}` }
  ];
  return quads.map(q => `<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" fill="${q.fill}" />
    <text x="${q.x + q.w / 2}" y="${q.ty}" text-anchor="middle" class="quadrant-watermark" fill="${q.c}">${q.t}</text>`).join('');
}

function axesSvg(isTr) {
  const cx = scaleX(PCWP_CUT), cy = scaleY(CI_CUT), r = PLOT.w - PLOT.right, b = PLOT.h - PLOT.bottom;
  const xt = [8, 12, 16, 20, 24, 28, 32].map(p => `<line x1="${scaleX(p)}" y1="${b}" x2="${scaleX(p)}" y2="${b + 5}" stroke="var(--border, #94a3b8)" />
    <text x="${scaleX(p)}" y="${b + 16}" text-anchor="middle" font-size="10" fill="var(--text-sub, #64748b)">${p}</text>`).join('');
  const yt = [1.5, 2.0, 2.5, 3.0, 3.5].map(c => `<line x1="${PLOT.left - 5}" y1="${scaleY(c)}" x2="${PLOT.left}" y2="${scaleY(c)}" stroke="var(--border, #94a3b8)" />
    <text x="${PLOT.left - 8}" y="${scaleY(c) + 3.5}" text-anchor="end" font-size="10" fill="var(--text-sub, #64748b)">${c.toFixed(1)}</text>`).join('');
  return `
    <line x1="${cx}" y1="${PLOT.top}" x2="${cx}" y2="${b}" stroke="var(--accent, #3b82f6)" stroke-width="2" stroke-dasharray="4 3" />
    <line x1="${PLOT.left}" y1="${cy}" x2="${r}" y2="${cy}" stroke="var(--accent, #3b82f6)" stroke-width="2" stroke-dasharray="4 3" />
    <text x="${cx + 4}" y="${PLOT.top + 12}" fill="var(--accent, #3b82f6)" font-size="10" font-weight="600">PCWP = 18 mmHg</text>
    <text x="${r - 4}" y="${cy - 6}" text-anchor="end" fill="var(--accent, #3b82f6)" font-size="10" font-weight="600">CI = 2.2 L/min/m²</text>
    <rect x="${PLOT.left}" y="${PLOT.top}" width="${PLOT_W}" height="${PLOT_H}" fill="none" stroke="var(--border, #cbd5e1)" stroke-width="1.5" />
    ${xt}${yt}
    <text x="${PLOT.left + PLOT_W / 2}" y="${PLOT.h - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
      ${isTr ? 'Pulmoner Kapiller Uç Basıncı (PCWP, mmHg) → [Konjesyon Ekseni]' : 'Pulmonary Capillary Wedge Pressure (PCWP, mmHg) → [Congestion Axis]'}
    </text>
    <text transform="rotate(-90)" x="${-(PLOT.top + PLOT_H / 2)}" y="16" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
      ${isTr ? 'Kardiyak İndeks (CI, L/min/m²) → [Perfüzyon Ekseni]' : 'Cardiac Index (CI, L/min/m²) → [Perfusion Axis]'}
    </text>`;
}

function plotSvg(isTr) {
  return `
    <svg viewBox="0 0 ${PLOT.w} ${PLOT.h}" class="forrester-svg" id="forrester-matrix-svg" role="img"
      aria-label="${isTr ? 'Forrester CI-PCWP matrisi' : 'Forrester CI-PCWP matrix'}">
      <defs>
        <filter id="glow-forrester" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="forrester-tx-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="context-stroke" />
        </marker>
      </defs>
      ${quadrantRects(isTr)}
      ${axesSvg(isTr)}
      <g data-fx-arrow></g>
      <g data-fx-trail></g>
      <g data-fx-point class="forrester-point">
        <circle data-fx-ring r="12" fill="none" stroke="#2563eb" stroke-width="2" />
        <circle data-fx-dot r="9" fill="#2563eb" filter="url(#glow-forrester)" />
        <circle data-fx-core r="4" fill="#ffffff" />
        <text data-fx-label text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-main, #0f172a)"></text>
      </g>
    </svg>`;
}

const CIRCUIT = 'M172 138 C220 92 300 96 360 104 L470 104 C522 104 522 196 470 196 L360 196 C300 196 220 196 168 166';
const LUNGS = '<ellipse cx="86" cy="138" rx="44" ry="64" /><ellipse cx="204" cy="138" rx="44" ry="64" />';

function livePanelSvg(isTr) {
  const bLines = [60, 76, 94, 110, 180, 196, 214, 230].map(x => `<line x1="${x}" y1="${88}" x2="${x}" y2="${196}" />`).join('');
  return `
    <svg viewBox="0 0 560 230" class="forrester-live-svg" role="img"
      aria-label="${isTr ? 'Atan kalp, akciğer konjesyonu ve periferik perfüzyon' : 'Beating heart, pulmonary congestion and peripheral perfusion'}">
      <defs><clipPath id="forrester-lung-clip">${LUNGS}</clipPath></defs>
      <g class="forrester-jvp">
        <rect x="137" y="6" width="16" height="64" rx="7" class="forrester-vein-wall" />
        <rect data-live-jvp x="140" y="60" width="10" height="8" rx="4" fill="#3b5bdb" />
        <line x1="128" y1="58" x2="162" y2="58" class="forrester-ref-line" />
        <text x="168" y="22" class="forrester-live-label" data-live-jvp-text></text>
      </g>
      <g data-live-lungs class="forrester-lungs">${LUNGS}</g>
      <g clip-path="url(#forrester-lung-clip)">
        <rect data-live-fluid x="30" y="202" width="230" height="0" fill="#60a5fa" opacity="0.55" />
        <g data-live-blines class="forrester-blines">${bLines}</g>
      </g>
      <text x="145" y="222" text-anchor="middle" class="forrester-live-label" data-live-lung-text></text>
      <rect data-live-tissue x="430" y="88" width="108" height="124" rx="22" />
      <text x="484" y="80" text-anchor="middle" class="forrester-live-label" data-live-tissue-text></text>
      <path data-live-circuit d="${CIRCUIT}" class="forrester-circuit" />
      <g data-live-particles>${Array.from({ length: 12 }, () => '<circle r="4.5" />').join('')}</g>
      <g data-live-heart class="forrester-heart">
        <path d="M145 128 C126 106 98 120 108 148 C114 164 132 176 145 188 C158 176 176 164 182 148 C192 120 164 106 145 128 Z" />
      </g>
      <text x="330" y="222" text-anchor="middle" class="forrester-live-label" data-live-sv-text></text>
    </svg>`;
}

function layoutHtml(isTr, lang, ui) {
  return `
    <div class="forrester-layout">
      <div class="forrester-main-card">
        <div class="lab-card-header">
          <div>
            <h2 class="lab-title">${isTr ? 'Forrester 2×2 Hemodinamik Sınıflandırma Matrisi' : 'Forrester 2×2 Hemodynamic Classification Matrix'}</h2>
            <p class="lab-desc">${isTr ? 'Klinik perfüzyon (Kardiyak İndeks) ve pulmoner konjesyon (PCWP) kesişiminde hasta fenotipi ve tedavi algoritması.' : 'Intersection of systemic perfusion (CI) and pulmonary congestion (PCWP) determining heart failure phenotypes.'}</p>
          </div>
          <div class="quadrant-badge" data-fx-badge></div>
        </div>
        <div class="preset-pill-group">
          <span class="preset-label">${isTr ? 'Klinik Profiller:' : 'Clinical Profiles:'}</span>
          ${FORRESTER_PROFILES.map(p => `<button type="button" class="preset-pill" data-profile-id="${p.id}">${p.name[lang]}</button>`).join('')}
        </div>
        <div class="forrester-stage-container">${plotSvg(isTr)}</div>
        <div class="preset-pill-group forrester-tx-group" role="group" aria-label="${isTr ? 'Tedavi' : 'Treatment'}">
          <span class="preset-label">${isTr ? 'Tedavi uygula:' : 'Apply treatment:'}</span>
          ${TREATMENTS.map(t => `<button type="button" class="preset-pill forrester-tx-btn" data-treatment="${t.id}" style="--tx-color:${t.color}">${t.label[lang]}</button>`).join('')}
        </div>
        <p class="forrester-tx-note" data-fx-note aria-live="polite">${ui.note || (isTr ? 'Bir tedavi seçin: hasta noktası, ilacın hemodinamik etkisi yönünde kayar.' : 'Pick a treatment: the patient point glides in the direction of its hemodynamic effect.')}</p>
        <div class="controls-grid" style="grid-template-columns: 1fr 1fr; margin-top: 1rem;">
          <div class="control-box">
            <div class="control-header">
              <label for="forrester-ci-slider"><strong>${isTr ? 'Kardiyak İndeks (CI)' : 'Cardiac Index (CI)'}</strong></label>
              <span class="control-val" data-fx-ci-val></span>
            </div>
            <input type="range" id="forrester-ci-slider" min="1.0" max="3.8" step="0.05" class="range-slider" />
            <div class="slider-caption">${isTr ? 'Normal eşik: ≥ 2.2 L/min/m² (Sıcak Perfüzyon)' : 'Normal cutoff: ≥ 2.2 L/min/m² (Warm Perfusion)'}</div>
          </div>
          <div class="control-box">
            <div class="control-header">
              <label for="forrester-pcwp-slider"><strong>${isTr ? 'Uç Basıncı (PCWP)' : 'Wedge Pressure (PCWP)'}</strong></label>
              <span class="control-val" data-fx-pcwp-val></span>
            </div>
            <input type="range" id="forrester-pcwp-slider" min="6" max="34" step="0.5" class="range-slider" />
            <div class="slider-caption">${isTr ? 'Normal eşik: ≤ 18 mmHg (Kuru / Akciğer Temiz)' : 'Normal cutoff: ≤ 18 mmHg (Dry / Lungs Clear)'}</div>
          </div>
        </div>
      </div>
      <div class="forrester-side-panel">
        <div class="forrester-live-card">
          <h3 class="metrics-title">${isTr ? 'Canlı hasta: kalp, akciğer ve periferi' : 'Live patient: heart, lungs and periphery'}</h3>
          ${livePanelSvg(isTr)}
          <p class="forrester-live-caption">${isTr ? 'Şematik: renk ve akım hızı CI\'yı (sıcak/soğuk), B-çizgileri, sıvı düzeyi ve JVP PCWP\'yi (ıslak/kuru) izler.' : 'Schematic: colour and flow speed track CI (warm/cold); B-lines, fluid level and JVP track PCWP (wet/dry).'}</p>
        </div>
        <div class="clinical-status-card" data-fx-status></div>
        <div class="metrics-card">
          <h3 class="metrics-title">${isTr ? 'Tahmini Hemodinamik Parametreler' : 'Estimated Hemodynamic Readout'}</h3>
          <div class="metrics-grid">
            <div class="metric-item"><span class="metric-lbl">MAP</span><span class="metric-num"><span data-fx-map></span> <small>mmHg</small></span></div>
            <div class="metric-item"><span class="metric-lbl">${isTr ? 'CVP (Sağ Atriyum)' : 'CVP (Right Atrium)'}</span><span class="metric-num"><span data-fx-cvp></span> <small>mmHg</small></span></div>
            <div class="metric-item"><span class="metric-lbl">${isTr ? 'SVRI (Direnç)' : 'SVRI (Resistance)'}</span><span class="metric-num"><span data-fx-svri></span> <small>dyn·s/cm⁵·m²</small></span></div>
            <div class="metric-item"><span class="metric-lbl">${isTr ? 'Kardiyak Güç (CPO)' : 'Cardiac Power (CPO)'}</span><span class="metric-num"><span data-fx-cpo></span> <small>W</small></span></div>
          </div>
        </div>
        <div class="clinical-desc-box"><h4>${isTr ? 'Klinik Görünüm & Fizik Muayene' : 'Clinical Presentation & Exam'}</h4><p data-fx-clinical></p></div>
        <div class="clinical-desc-box management-box"><h4>${isTr ? 'ESC / AHA Tedavi Önerileri' : 'ESC / AHA Management Guideline'}</h4><p data-fx-management></p></div>
      </div>
    </div>`;
}

export function createForresterLab(opts = {}) {
  const container = opts.container || opts.mount;
  let lang = typeof opts.getLang === 'function' ? opts.getLang() : (opts.lang || 'tr');
  const getLang = () => lang;
  let shown = { ci: 2.8, pcwp: 12 };
  let selectedPreset = 'profile-1';
  let ui = { note: '', noteRisky: false, quadKey: '' };
  let trail = [];
  let arrow = null;
  let cancelGlide = () => {};
  let lastPhase = 0;
  let beats = 0;
  let flowPos = 0;
  let pathLen = 0;

  const clock = createCycleClock({ bpm: BPM, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: { tr: 'Canlı kalp atımı:', en: 'Live heartbeat:' } });
  const root = document.createElement('div');
  root.className = 'pathophys-lab forrester-lab';
  const body = document.createElement('div');
  root.append(motionBar.element, body);
  container.append(root);

  const $ = sel => body.querySelector(sel);
  const $$ = sel => body.querySelectorAll(sel);
  const setText = (sel, text) => { const el = $(sel); if (el && el.textContent !== text) el.textContent = text; };

  function renderLayout() {
    const isTr = lang === 'tr';
    body.innerHTML = layoutHtml(isTr, lang, ui);
    ui = { ...ui, quadKey: '' };
    const circuit = $('[data-live-circuit]');
    pathLen = circuit && typeof circuit.getTotalLength === 'function' ? circuit.getTotalLength() : 0;
    bindEvents();
    updateNote();
    updateValues();
    clock.refresh();
  }

  function updateQuadrantText(quadrant) {
    const key = `${quadrant}-${lang}`;
    if (ui.quadKey === key) return;
    ui = { ...ui, quadKey: key };
    const isTr = lang === 'tr';
    const q = getQuadrantInfo(quadrant, isTr);
    const badge = $('[data-fx-badge]');
    badge.style.cssText = `background:${q.bg};color:${q.color};border:1px solid ${q.color}40;`;
    badge.textContent = `${isTr ? 'Kuadran' : 'Quadrant'} ${quadrant}`;
    const status = $('[data-fx-status]');
    status.style.borderLeft = `4px solid ${q.color}`;
    status.innerHTML = `<div class="status-top"><span class="status-name" style="color:${q.color};font-weight:700;">${q.title}</span>
      <span class="mortality-tag">${isTr ? 'Mortalite Riski' : 'In-Hospital Mortality'}: ${q.mortality}</span></div>
      <div class="status-state">${q.status}</div>`;
    setText('[data-fx-clinical]', q.clinical);
    setText('[data-fx-management]', q.management);
    const dot = $('[data-fx-dot]'), ring = $('[data-fx-ring]');
    if (dot) dot.setAttribute('fill', q.color);
    if (ring) ring.setAttribute('stroke', q.color);
  }

  function updateSliders() {
    const ciS = $('#forrester-ci-slider'), pS = $('#forrester-pcwp-slider');
    if (ciS && document.activeElement !== ciS) ciS.value = String(shown.ci);
    if (pS && document.activeElement !== pS) pS.value = String(shown.pcwp);
  }

  function updateValues() {
    const h = estimateHemodynamics(shown.ci, shown.pcwp);
    updateQuadrantText(h.quadrant);
    setText('[data-fx-ci-val]', `${shown.ci.toFixed(2)} L/min/m²`);
    setText('[data-fx-pcwp-val]', `${shown.pcwp.toFixed(1)} mmHg`);
    setText('[data-fx-map]', String(h.map));
    setText('[data-fx-cvp]', String(h.cvp));
    setText('[data-fx-svri]', String(h.svri));
    setText('[data-fx-cpo]', h.cpo.toFixed(2));
    setText('[data-fx-label]', `(${shown.pcwp.toFixed(1)} mmHg, ${shown.ci.toFixed(2)} L/m²)`);
    $$('[data-profile-id]').forEach(b => b.classList.toggle('active', b.dataset.profileId === selectedPreset));
    updateSliders();
    drawPoint(cycleShape(clock.getState().phase));
  }

  function updateNote() {
    const el = $('[data-fx-note]');
    if (!el || !ui.note) return;
    el.textContent = ui.note;
    el.classList.toggle('is-risky', ui.noteRisky);
  }

  function drawPoint(shape) {
    const x = scaleX(shown.pcwp), y = scaleY(shown.ci);
    const g = $('[data-fx-point]');
    if (!g) return;
    g.querySelectorAll('circle').forEach(c => { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); });
    const label = $('[data-fx-label]');
    label.setAttribute('x', x.toFixed(1));
    label.setAttribute('y', (y - 16).toFixed(1));
    // Beat pulse: a ring that expands with ejection, larger when CI (stroke volume) is higher.
    const amp = 6 + 10 * warmth(shown.ci);
    const ring = $('[data-fx-ring]');
    ring.setAttribute('r', (11 + amp * shape.contraction).toFixed(1));
    ring.setAttribute('opacity', (0.85 - 0.75 * shape.contraction).toFixed(2));
    $('[data-fx-dot]').setAttribute('r', (8.5 + 1.5 * shape.pressure).toFixed(2));
  }

  function drawTrail(t) {
    trail = trail.filter(p => t - p.t < TRAIL_MS);
    const g = $('[data-fx-trail]');
    if (g) {
      g.innerHTML = trail.map(p => {
        const a = 1 - (t - p.t) / TRAIL_MS;
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(2 + 3 * a).toFixed(1)}" fill="${p.color}" opacity="${(0.6 * a).toFixed(2)}" />`;
      }).join('');
    }
    const ag = $('[data-fx-arrow]');
    if (!ag) return;
    if (arrow && t - arrow.t > ARROW_MS) arrow = null;
    ag.innerHTML = arrow ? `<path d="${arrow.d}" fill="none" stroke="${arrow.color}" stroke-width="2.5" stroke-dasharray="6 4"
      marker-end="url(#forrester-tx-head)" opacity="${(0.9 * (1 - (t - arrow.t) / ARROW_MS)).toFixed(2)}" />` : '';
  }

  function arrowPath(from, to) {
    const pts = [0, 0.25, 0.5, 0.75, 1].map(k => glidePoint(from, to, k));
    return pts.map((p, i) => `${i ? 'L' : 'M'}${scaleX(p.pcwp).toFixed(1)} ${scaleY(p.ci).toFixed(1)}`).join(' ');
  }

  function glideTo(target, { ms = 700, color = '#2563eb', showArrow = false } = {}) {
    cancelGlide();
    const from = { ...shown };
    if (showArrow) arrow = { d: arrowPath(from, target), color, t: now() };
    cancelGlide = tweenValues({ k: 0 }, { k: 1 }, ({ k }) => {
      shown = k >= 1 ? { ...target } : glidePoint(from, target, k);
      trail = [...trail.slice(-40), { x: scaleX(shown.pcwp), y: scaleY(shown.ci), t: now(), color }];
      updateValues();
      drawTrail(now());
    }, ms);
  }

  function applyTx(id) {
    const tx = TREATMENTS.find(t => t.id === id);
    if (!tx) return;
    const isTr = lang === 'tr';
    const risky = tx.isRisky(shown);
    ui = { ...ui, note: `${tx.note[isTr ? 'tr' : 'en']}${risky ? ` ${tx.warn[isTr ? 'tr' : 'en']}` : ''}`, noteRisky: risky };
    selectedPreset = null;
    updateNote();
    glideTo(applyTreatment(id, shown), { ms: 900, color: tx.color, showArrow: true });
  }

  function drawHeart(shape) {
    const heart = $('[data-live-heart]');
    if (!heart) return;
    // Stroke volume index scales the beat amplitude (larger SV, deeper contraction).
    const amp = 0.05 + 0.13 * clamp((strokeVolumeIndex(shown.ci) - 15) / 30, 0, 1);
    const s = 1 - amp * shape.contraction;
    heart.setAttribute('transform', `translate(145 150) scale(${s.toFixed(3)}) translate(-145 -150)`);
  }

  function drawLungs(state) {
    const w = wetness(shown.pcwp);
    const breathsPerBeat = 1 / (4 - 1.5 * w); // tachypnoea as congestion rises
    const breath = Math.sin(2 * Math.PI * (beats + state.phase) * breathsPerBeat);
    const lungs = $('[data-live-lungs]');
    lungs.setAttribute('transform', `translate(145 138) scale(${(1 + 0.025 * breath).toFixed(3)}) translate(-145 -138)`);
    lungs.style.fill = mix([253, 226, 228], [176, 196, 222], w);
    const fluid = $('[data-live-fluid]');
    const fh = 46 * w + (w > 0 ? 1.5 * Math.sin(2 * Math.PI * state.phase) : 0);
    fluid.setAttribute('y', (202 - fh).toFixed(1));
    fluid.setAttribute('height', Math.max(0, fh).toFixed(1));
    const bl = $('[data-live-blines]');
    bl.setAttribute('opacity', (w * (0.55 + 0.35 * (0.5 + 0.5 * breath))).toFixed(2));
  }

  function drawJvp(state) {
    // Column height: about 3 cm above the sternal angle when dry, up to 12 cm when wet.
    const cm = 3 + 9 * wetness(shown.pcwp);
    const h = cm * 4.2 + 3 * jvpWave(state.phase) * (0.5 + 0.5 * wetness(shown.pcwp));
    const col = $('[data-live-jvp]');
    col.setAttribute('y', (68 - h).toFixed(1));
    col.setAttribute('height', h.toFixed(1));
  }

  function drawPeriphery(state, shape) {
    const warm = warmth(shown.ci);
    const tissue = $('[data-live-tissue]');
    const blush = warm * 0.12 * shape.pressure;
    tissue.style.fill = mix([186, 200, 222], [252, 165, 165], clamp(warm + blush, 0, 1));
    const dPhase = ((state.phase - lastPhase) % 1 + 1) % 1;
    // Forward flow is pulsatile: most of it moves during ejection.
    flowPos = (flowPos + dPhase * shown.ci * 0.16 * (0.35 + 1.3 * shape.pressure)) % 1;
    const circuit = $('[data-live-circuit]');
    if (!circuit || !pathLen) return;
    const dots = $$('[data-live-particles] circle');
    dots.forEach((c, i) => {
      const f = (flowPos + i / dots.length) % 1;
      const p = circuit.getPointAtLength(f * pathLen);
      c.setAttribute('cx', p.x.toFixed(1));
      c.setAttribute('cy', p.y.toFixed(1));
      c.setAttribute('fill', f < 0.55 ? '#dc2626' : '#2563eb');
    });
  }

  function updateLiveText() {
    const isTr = lang === 'tr';
    const warm = shown.ci >= CI_CUT, wet = shown.pcwp > PCWP_CUT;
    setText('[data-live-tissue-text]', warm ? (isTr ? 'Sıcak periferi' : 'Warm periphery') : (isTr ? 'Soğuk periferi' : 'Cold periphery'));
    setText('[data-live-lung-text]', wet ? (isTr ? 'Islak: B-çizgileri, sıvı' : 'Wet: B-lines, fluid') : (isTr ? 'Kuru: akciğer temiz' : 'Dry: clear lungs'));
    setText('[data-live-jvp-text]', wet ? (isTr ? 'JVP yüksek' : 'JVP raised') : (isTr ? 'JVP normal' : 'JVP normal'));
    setText('[data-live-sv-text]', `SVI ≈ ${strokeVolumeIndex(shown.ci).toFixed(0)} mL/m² · ${BPM} ${isTr ? 'atım/dk' : 'bpm'}`);
  }

  function drawLive(state) {
    if (!$('[data-fx-point]')) return;
    if (state.phase < lastPhase - 0.5) beats += 1;
    const shape = cycleShape(state.phase);
    drawPoint(shape);
    drawTrail(now());
    drawHeart(shape);
    drawLungs(state);
    drawJvp(state);
    drawPeriphery(state, shape);
    updateLiveText();
    lastPhase = state.phase;
    motionBar.render(state, shape.phase);
  }

  function setDirect(patch) {
    cancelGlide();
    shown = { ...shown, ...patch };
    selectedPreset = null;
    updateValues();
    clock.refresh();
  }

  function plotClick(e, svg) {
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * PLOT.w;
    const svgY = ((e.clientY - rect.top) / rect.height) * PLOT.h;
    if (svgX < PLOT.left || svgX > PLOT.w - PLOT.right || svgY < PLOT.top || svgY > PLOT.h - PLOT.bottom) return;
    const pcwp = PLOT.pMin + ((svgX - PLOT.left) / PLOT_W) * (PLOT.pMax - PLOT.pMin);
    const ci = PLOT.cMax - ((svgY - PLOT.top) / PLOT_H) * (PLOT.cMax - PLOT.cMin);
    selectedPreset = null;
    glideTo({ pcwp: Math.round(pcwp * 10) / 10, ci: Math.round(ci * 100) / 100 });
  }

  function bindEvents() {
    $('#forrester-ci-slider')?.addEventListener('input', e => setDirect({ ci: parseFloat(e.target.value) }));
    $('#forrester-pcwp-slider')?.addEventListener('input', e => setDirect({ pcwp: parseFloat(e.target.value) }));
    $$('[data-profile-id]').forEach(btn => btn.addEventListener('click', () => {
      const prof = FORRESTER_PROFILES.find(p => p.id === btn.dataset.profileId);
      if (!prof) return;
      selectedPreset = prof.id;
      glideTo({ ci: prof.ci, pcwp: prof.pcwp });
    }));
    $$('[data-treatment]').forEach(btn => btn.addEventListener('click', () => applyTx(btn.dataset.treatment)));
    const svg = $('#forrester-matrix-svg');
    svg?.addEventListener('click', e => plotClick(e, svg));
  }

  renderLayout();
  const unsubscribe = clock.subscribe(drawLive);

  return {
    updateLanguage(newLang) {
      if (typeof newLang === 'string') lang = newLang;
      ui = { ...ui, note: '', noteRisky: false };
      motionBar.setLanguage();
      renderLayout();
    },
    getState: () => ({ ...shown, quadrant: determineQuadrant(shown.ci, shown.pcwp), phase: clock.getState().phase }),
    destroy() {
      cancelGlide();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}
