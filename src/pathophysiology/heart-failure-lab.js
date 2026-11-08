// Heart Failure & Cardiomyopathy Pathophysiology Lab
// Frank-Starling, Laplace remodeling and neurohormonal mechanisms, animated on the
// shared cardiac clock. Each phenotype's own P-V loop (built through its Starling
// working point) drives the beating ventricle, the loop cursor, congestion signs and
// the neurohormonal cycle. Static layer: re-rendered on preset or language change.
// Live layer: setAttribute per frame. Numbers are didactic, not patient data.
import { HF_PHENOTYPES } from './pathophysiology-data.js';
import { PV_V0, pvModelLoop } from '../hemo-pv-model.js';
import { createCycleClock, createMotionBar, cyclePhaseAt, loopPointAt, tweenValues } from './cycle-clock.js';

// Node tests import this module, so the stylesheet loads only in the browser (Vite).
if (typeof document !== 'undefined') import('./heart-failure-motion.css');

const BPM = 72;
const GLIDE_MS = 650;
const TOKENS = 3;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = x => ((x % 1) + 1) % 1;
const bump = (x, c, s) => { const d = Math.min(Math.abs(x - c), 1 - Math.abs(x - c)); return Math.exp(-((d / s) ** 2)); };

// Per phenotype: end-systolic pressure (mmHg), EDPVR stiffness, diastolic wall thickness
// in the geometry sketch (px), filling-time warp (>1 slow relaxation, <1 rapid
// restrictive early filling), the gallop heard and the right atrial estimate [base, slope].
const SPEC = Object.freeze({
  normal: { esp: 95, stiffness: 0.025, wall: 12, fill: 1, gallop: null, rap: [4, 0.3] },
  hfref: { esp: 95, stiffness: 0.018, wall: 8, fill: 1, gallop: 'S3', rap: [6, 0.5] },
  hfpef: { esp: 120, stiffness: 0.045, wall: 20, fill: 1.8, gallop: 'S4', rap: [6, 0.4] },
  hcm: { esp: 100, stiffness: 0.05, wall: 14, fill: 1.8, gallop: 'S4', rap: [6, 0.4] },
  dcm: { esp: 85, stiffness: 0.016, wall: 7, fill: 1, gallop: 'S3', rap: [6, 0.55] },
  rcm: { esp: 100, stiffness: 0.055, wall: 18, fill: 0.55, gallop: 'S3', rap: [6, 0.8] }
});

/** Frank-Starling working point (LVEDP mmHg, SV mL) of a phenotype and volume state. */
export function workingPoint(id, preload, maneuver) {
  if (id === 'normal') return { low: { lvedp: 6, sv: 55 }, optimal: { lvedp: 10, sv: 75 } }[preload] || { lvedp: 16, sv: 85 };
  if (id === 'hfref') return { low: { lvedp: 12, sv: 32 }, optimal: { lvedp: 18, sv: 44 } }[preload] || { lvedp: 26, sv: 42 };
  if (id === 'hfpef') return { low: { lvedp: 10, sv: 48 }, optimal: { lvedp: 16, sv: 60 } }[preload] || { lvedp: 25, sv: 64 };
  if (id === 'hcm') return { valsalva: { lvedp: 14, sv: 40 }, squatting: { lvedp: 24, sv: 68 } }[maneuver] || { lvedp: 20, sv: 55 };
  if (id === 'dcm') return preload === 'congested' ? { lvedp: 28, sv: 38 } : { lvedp: 19, sv: 36 };
  if (id === 'rcm') return { lvedp: 26, sv: 46 };
  return { lvedp: 10, sv: 75 };
}

const refPressure = text => { const n = String(text).match(/\d+(\.\d+)?/g); return n ? Number(n[n.length - 1]) : 10; };

const STATES = { hcm: [['rest', 'valsalva'], ['rest', 'rest'], ['rest', 'squatting']] };
const statesOf = id => STATES[id] || [['low', 'rest'], ['optimal', 'rest'], ['congested', 'rest']];
const typicalEf = pt => parseFloat(pt.ef) / 100;

/**
 * EF matching is plausible when EDV = SV / typical EF rises with LVEDP across the phenotype's
 * volume states and, at the state nearest the card's LVEDP, lies within 25% of the card's EDV.
 * HFrEF and DCM fail (their Starling SVs give a non-dilated ventricle); they keep the EDPVR rule.
 */
export function efMatchPlausible(pt) {
  const ef = typicalEf(pt);
  if (!(ef > 0 && ef < 1)) return false;
  const pts = statesOf(pt.id).map(([pre, man]) => workingPoint(pt.id, pre, man))
    .map(wp => ({ lvedp: wp.lvedp, edv: wp.sv / ef })).sort((a, b) => a.lvedp - b.lvedp);
  if (pts.some((q, i) => i && q.lvedp > pts[i - 1].lvedp && q.edv < pts[i - 1].edv)) return false;
  const ref = refPressure(pt.lvedp);
  const near = pts.reduce((a, b) => (Math.abs(b.lvedp - ref) < Math.abs(a.lvedp - ref) ? b : a));
  return Math.abs(near.edv / pt.edv - 1) <= 0.25;
}

/**
 * Loop target through the Starling working point (SV, LVEDP). Plausible phenotypes: EDV = SV / typical EF,
 * so the loop EF equals the card EF. Others: EDV read off an EDPVR through the card's EDV and LVEDP.
 * loopFrom then fits the EDPVR scale through (EDV, LVEDP) and the ESPVR through (ESV, ESP).
 */
export function phenotypeTarget(pt, preload, maneuver) {
  const spec = SPEC[pt.id] || SPEC.normal;
  const wp = workingPoint(pt.id, preload, maneuver);
  const efMatched = efMatchPlausible(pt);
  const scale = refPressure(pt.lvedp) / (Math.exp(spec.stiffness * (pt.edv - PV_V0)) - 1);
  return {
    ...wp, stiffness: spec.stiffness, esp: spec.esp, efMatched,
    edv: efMatched ? wp.sv / typicalEf(pt) : PV_V0 + Math.log(wp.lvedp / scale + 1) / spec.stiffness,
    valve: pt.id === 'hcm' && maneuver !== 'squatting' ? 'as' : null
  };
}

/** P-V loop whose stroke volume equals the working-point SV (ESPVR and Ea solved for the target ESP). */
export function loopFrom(s) {
  const esv = Math.max(PV_V0 + 5, s.edv - s.sv);
  const sv = s.edv - esv;
  return pvModelLoop({
    edv: s.edv, stiffness: s.stiffness, valve: s.valve,
    scale: s.lvedp / (Math.exp(s.stiffness * (s.edv - PV_V0)) - 1),
    ees: s.esp / (esv - PV_V0), ea: s.esp / sv
  });
}

/** Drive of the neurohormonal cycle (0..1) from congestion and low output. */
export const cycleSeverity = ({ lvedp, sv }) => clamp(0.12 + 0.6 * clamp((lvedp - 10) / 18, 0, 1) + 0.4 * clamp((60 - sv) / 30, 0, 1), 0.1, 1);

/** Schematic congestion signs: PCWP ~ LVEDP, right atrial estimate, JVP above the sternal angle, edema grade. */
export function congestionSigns(id, lvedp) {
  const [base, k] = (SPEC[id] || SPEC.normal).rap;
  const rap = clamp(base + k * (lvedp - 10), 2, 22);
  return {
    pcwp: lvedp, rap,
    jvpCm: clamp(rap * 1.36 - 5, 0, 15),
    lung: lvedp > 25 ? 'alveolar' : lvedp >= 18 ? 'interstitial' : 'clear',
    edema: rap < 10 ? 0 : rap < 13 ? 1 : rap < 16 ? 2 : 3
  };
}

export const THERAPIES = Object.freeze([
  { id: 'arni', label: { tr: '1. ARNI / ACEi', en: '1. ARNI / ACEi' }, note: { tr: 'RAAS: anjiyotensin II etkisi azalır; ARNI (sakubitril) ayrıca neprilizini inhibe ederek natriüretik peptidleri artırır.', en: 'RAAS: angiotensin II action falls; ARNI (sacubitril) also inhibits neprilysin, raising natriuretic peptides.' } },
  { id: 'bb', label: { tr: '2. Beta-Bloker', en: '2. Beta-blocker' }, note: { tr: 'SNS: β1 aracılı taşikardi, miyosit toksisitesi ve renin salınımı baskılanır.', en: 'SNS: β1-mediated tachycardia, myocyte toxicity and renin release are blunted.' } },
  { id: 'mra', label: { tr: '3. MRA', en: '3. MRA' }, note: { tr: 'Aldosteron reseptörü blokajı: miyokard fibrozisi ve Na tutulumu azalır.', en: 'Aldosterone receptor blockade: less myocardial fibrosis and sodium retention.' } },
  { id: 'sglt2', label: { tr: '4. SGLT2i', en: '4. SGLT2i' }, note: { tr: 'Natriürez ve osmotik diürez: konjesyon ve duvar gerilimi azalır (çok etkenli kardiyorenal yarar).', en: 'Natriuresis and osmotic diuresis: less congestion and wall stress (multifactorial cardiorenal benefit).' } }
]);

/** Gain of each cycle link (1 = untreated) for the active therapies. */
export function linkGains(on = {}) {
  return {
    coSns: 1, coRaas: 1,
    snsRem: on.bb ? 0.3 : 1,
    raasRem: (on.arni ? 0.45 : 1) * (on.mra ? 0.55 : 1),
    remCo: on.sglt2 ? 0.6 : 1,
    np: on.arni ? 1.7 : 1
  };
}

const LINKS = Object.freeze([
  { key: 'coSns', d: 'M 114,44 Q 68,46 68,78', color: '#d97706', head: 'amber' },
  { key: 'coRaas', d: 'M 206,44 Q 252,46 252,78', color: '#7c3aed', head: 'violet' },
  { key: 'snsRem', d: 'M 68,114 Q 68,150 110,166', color: '#d97706', head: 'amber', breakable: true },
  { key: 'raasRem', d: 'M 252,114 Q 252,150 210,166', color: '#7c3aed', head: 'violet', breakable: true },
  { key: 'remCo', d: 'M 160,166 L 160,62', color: '#dc2626', head: 'red', breakable: true },
  { key: 'npSns', gain: 'np', d: 'M 222,14 C 150,0 40,4 40,78', color: '#16a34a', head: 'bar' },
  { key: 'npRaas', gain: 'np', d: 'M 284,30 L 284,78', color: '#16a34a', head: 'bar' }
]);

// P-V plot scale.
const pvX = v => 40 + clamp(v, 0, 300) * 0.95;
const pvY = p => 200 - clamp(p, 0, 165) * 1.1;
const loopPath = pts => `${pts.map((q, i) => `${i ? 'L' : 'M'}${pvX(q.v).toFixed(1)} ${pvY(q.p).toFixed(1)}`).join(' ')} Z`;
// Geometry sketch: cavity radius ~ cube root of volume, wall volume conserved (systolic thickening).
const GEOM = { lv: { K: 9.5, cx: 160 }, hcm: { K: 5.04, cx: 230 } };

function rings(K, edv, wall, v) {
  const rd = K * Math.cbrt(edv);
  const W = (rd + wall) ** 3 - rd ** 3;
  const r = K * Math.cbrt(Math.max(1, v));
  const R = Math.cbrt(r ** 3 + W);
  return { r, R, h: R - r };
}

function htmlTemplates(t, en) {
  const toolbar = (pid, preload, maneuver) => `
    <div class="hf-toolbar">
      <div class="control-cluster">
        <span class="control-label">${en ? 'Clinical Phenotype' : 'Klinik Fenotip'}:</span>
        <div class="btn-group">
          ${HF_PHENOTYPES.map(p => `<button type="button" class="stage-btn ${p.id === pid ? 'active' : ''}" data-phenotype="${p.id}">${t(p.name).split('(')[0].trim()}</button>`).join('')}
        </div>
      </div>
      ${pid === 'hcm' ? `
        <div class="control-cluster">
          <span class="control-label">${en ? 'Dynamic Bedside Maneuver' : 'Dinamik Yatak Başı Manevrası'}:</span>
          <div class="btn-group">
            <button type="button" class="stage-btn ${maneuver === 'rest' ? 'active' : ''}" data-maneuver="rest">${en ? 'Rest' : 'İstirahat'}</button>
            <button type="button" class="stage-btn ${maneuver === 'valsalva' ? 'active' : ''}" data-maneuver="valsalva">${en ? 'Valsalva (Preload ↓)' : 'Valsalva (Ön Yük ↓)'}</button>
            <button type="button" class="stage-btn ${maneuver === 'squatting' ? 'active' : ''}" data-maneuver="squatting">${en ? 'Squatting (Preload ↑)' : 'Çömelme (Ön Yük ↑)'}</button>
          </div>
        </div>` : `
        <div class="control-cluster">
          <span class="control-label">${en ? 'Preload / Volume Status' : 'Ön Yük / Sıvı Durumu'}:</span>
          <div class="btn-group">
            <button type="button" class="stage-btn ${preload === 'low' ? 'active' : ''}" data-preload="low">${en ? 'Dehydrated' : 'Hipovolemik'}</button>
            <button type="button" class="stage-btn ${preload === 'optimal' ? 'active' : ''}" data-preload="optimal">${en ? 'Euvolemic' : 'Övolemik'}</button>
            <button type="button" class="stage-btn ${preload === 'congested' ? 'active' : ''}" data-preload="congested">${en ? 'Fluid Overload' : 'Konjesyon / Aşırı Yük'}</button>
          </div>
        </div>`}
    </div>`;

  const status = (pt, wp) => {
    const wet = wp.lvedp >= 18, low = wp.sv < 45;
    return `
    <div class="hf-status-bar">
      <div class="status-col"><strong>${t(pt.name)}</strong><p>${t(pt.mechanism)}</p></div>
      <div class="status-tags">
        <span class="badge ${wet ? 'badge-danger' : 'badge-ok'}">${wet ? (en ? 'BACKWARD FAILURE: CONGESTION (PCWP ≥18)' : 'GERİ YETERSİZLİK: AKCİĞER ÖDEMİ (PCWP ≥18)') : (en ? 'NO CONGESTION' : 'AKCİĞERLER TEMİZ')}</span>
        <span class="badge ${low ? 'badge-warning' : 'badge-ok'}">${low ? (en ? 'FORWARD FAILURE: LOW OUTPUT (SV <45 mL)' : 'İLERİ YETERSİZLİK: DÜŞÜK DEBİ (SV <45 mL)') : (en ? 'ADEQUATE PERFUSION' : 'PERFÜZYON YETERLİ')}</span>
      </div>
    </div>`;
  };

  const pvCard = (normalLoop, gallop) => `
    <div class="hf-card hf-live-card">
      <div class="card-head">
        <h3>${en ? 'Live P-V loop of this phenotype' : 'Bu fenotipin canlı P-V döngüsü'}</h3>
        <span class="badge badge-accent">${en ? 'Working point loop' : 'Çalışma noktası döngüsü'}</span>
      </div>
      <div class="starling-svg-box">
        <svg viewBox="0 0 340 230" class="hf-pv-svg" role="img" aria-label="${en ? 'Pressure-volume loop with a cursor moving through the cardiac cycle' : 'Kalp döngüsü boyunca ilerleyen imleçli basınç-hacim döngüsü'}">
          <line x1="40" y1="200" x2="330" y2="200" stroke="var(--border)" stroke-width="2"/>
          <line x1="40" y1="200" x2="40" y2="18" stroke="var(--border)" stroke-width="2"/>
          <text x="328" y="228" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="end">${en ? 'LV volume (mL)' : 'LV hacmi (mL)'}</text>
          <text x="44" y="14" font-size="10" font-weight="700" fill="var(--text-sub)">${en ? 'LV pressure (mmHg)' : 'LV basıncı (mmHg)'}</text>
          ${[100, 200, 300].map(v => `<text x="${pvX(v)}" y="211" font-size="8.5" fill="var(--text-sub)" text-anchor="middle">${v}</text>`).join('')}
          ${[50, 100, 150].map(p => `<text x="35" y="${pvY(p) + 3}" font-size="8.5" fill="var(--text-sub)" text-anchor="end">${p}</text>`).join('')}
          <path d="${loopPath(normalLoop.points)}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
          <path data-hf-espvr fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="2 3"/>
          <path data-hf-edpvr fill="none" stroke="#0284c7" stroke-width="1.6"/>
          <path data-hf-loop fill="rgba(239,68,68,0.1)" stroke="#ef4444" stroke-width="2.4" stroke-linejoin="round"/>
          <circle data-hf-pv-dot r="6" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
          <text x="300" y="34" font-size="8.5" fill="#16a34a" text-anchor="end">${en ? 'dashed: normal loop' : 'kesikli: normal döngü'}</text>
          ${gallop ? `<text data-hf-sound x="300" y="56" font-size="18" font-weight="900" fill="#be123c" text-anchor="end" opacity="0">${gallop}</text>` : ''}
        </svg>
      </div>
      <div class="hf-live-readouts">
        <div class="geom-metric"><span class="m-lbl">${en ? 'LV volume now' : 'Anlık LV hacmi'}</span><strong data-hf-v></strong></div>
        <div class="geom-metric"><span class="m-lbl">${en ? 'LV pressure now' : 'Anlık LV basıncı'}</span><strong data-hf-p></strong></div>
        <div class="geom-metric"><span class="m-lbl">EF</span><strong class="hf-ef-live" data-hf-ef></strong></div>
        <div class="geom-metric"><span class="m-lbl">EDV / ESV · SV</span><strong data-hf-vols></strong></div>
      </div>
      <p class="hf-live-note" data-hf-gallop-note></p>
      <p class="hf-live-note" data-hf-ef-note></p>
    </div>`;

  const congestionCard = () => `
    <div class="hf-card hf-live-card">
      <div class="card-head">
        <h3>${en ? 'Congestion: lungs, JVP, peripheral edema' : 'Konjesyon: akciğer, JVP, periferik ödem'}</h3>
        <span class="badge badge-subtle">${en ? 'Schematic' : 'Şematik'}</span>
      </div>
      <div class="vicious-cycle-box">
        <svg viewBox="0 0 320 170" class="hf-congestion-svg" aria-hidden="true">
          <defs><clipPath id="hf-lung-clip"><ellipse cx="52" cy="80" rx="34" ry="58"/><ellipse cx="128" cy="80" rx="34" ry="58"/></clipPath></defs>
          <g data-hf-lungs>
            <ellipse cx="52" cy="80" rx="34" ry="58" class="hf-lung"/><ellipse cx="128" cy="80" rx="34" ry="58" class="hf-lung"/>
            <rect data-hf-fluid x="10" y="138" width="160" height="0" fill="#3b82f6" opacity="0.45" clip-path="url(#hf-lung-clip)"/>
            <g data-hf-blines class="hf-blines" opacity="0">
              ${[100, 109, 118].map(y => `<line x1="20" y1="${y}" x2="32" y2="${y}"/><line x1="148" y1="${y}" x2="160" y2="${y}"/>`).join('')}
            </g>
          </g>
          <path d="M 90,20 L 90,44" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
          <rect x="204" y="20" width="16" height="120" rx="7" class="hf-vein"/>
          <rect data-hf-jvp x="207" y="140" width="10" height="0" rx="4" fill="#2563eb"/>
          <line x1="196" y1="110" x2="228" y2="110" stroke="#64748b" stroke-dasharray="3 2"/>
          <text x="223" y="107" font-size="7" fill="var(--text-sub)">${en ? 'sternal angle' : 'sternal açı'}</text>
          <path d="M 262,20 L 262,128 Q 262,150 286,152 L 306,152 Q 312,140 300,134 L 284,128 L 284,20" class="hf-leg"/>
          <ellipse data-hf-edema cx="273" cy="132" rx="6" ry="9" fill="#93c5fd" opacity="0"/>
          <text x="90" y="160" font-size="9" font-weight="700" fill="var(--text-sub)" text-anchor="middle">${en ? 'Lungs' : 'Akciğerler'}</text>
          <text x="212" y="160" font-size="9" font-weight="700" fill="var(--text-sub)" text-anchor="middle">JVP</text>
          <text x="284" y="166" font-size="9" font-weight="700" fill="var(--text-sub)" text-anchor="middle">${en ? 'Ankle' : 'Ayak bileği'}</text>
        </svg>
      </div>
      <ul class="hf-congestion-list">
        <li data-hf-lung-text></li><li data-hf-jvp-text></li><li data-hf-edema-text></li>
      </ul>
    </div>`;

  return { toolbar, status, pvCard, congestionCard };
}

function starlingCardHtml(pid, en) {
  return `
    <div class="hf-card">
      <div class="card-head">
        <h3>${en ? '1. Frank-Starling Law & Congestion Limit' : '1. Frank-Starling Kanunu ve Konjesyon Sınırı'}</h3>
        <span class="badge badge-accent">Starling Curve</span>
      </div>
      <div class="starling-svg-box">
        <svg viewBox="0 0 340 220" class="starling-curve-svg">
          <line x1="45" y1="185" x2="320" y2="185" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
          <line x1="45" y1="185" x2="45" y2="25" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
          <text x="315" y="198" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="end">${en ? 'LVEDP / PCWP (mmHg)' : 'Ön Yük: LVEDP / PCWP (mmHg)'}</text>
          <text x="40" y="20" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="start">${en ? 'Stroke Volume (mL)' : 'Vuru Hacmi: SV (mL)'}</text>
          <line x1="198" y1="25" x2="198" y2="185" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3"/>
          <rect x="200" y="28" width="115" height="18" rx="3" fill="#fee2e2" opacity="0.85"/>
          <text x="204" y="41" font-size="9" font-weight="800" fill="#991b1b">${en ? 'Pulmonary Edema (≥18)' : 'Akciğer Konjesyonu (≥18)'}</text>
          <path d="M 45,180 Q 90,75 160,60 T 310,50" fill="none" stroke="#22c55e" stroke-width="2" opacity="${pid === 'normal' ? '1' : '0.4'}"/>
          <text x="270" y="45" font-size="9" font-weight="700" fill="#22c55e">Normal</text>
          <path d="M 45,182 Q 100,140 180,135 T 310,140" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="${pid === 'hfref' || pid === 'dcm' ? '1' : '0.4'}"/>
          <text x="270" y="152" font-size="9.5" font-weight="800" fill="#ef4444">HFrEF / DCM</text>
          <circle data-sl-ring r="9" fill="none" stroke="#f59e0b" stroke-width="2"/>
          <circle data-sl-point r="7" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
          <text data-sl-label font-size="10.5" font-weight="800" fill="#f59e0b"></text>
        </svg>
      </div>
      <div class="starling-notes">
        ${en
          ? '<strong>Frank-Starling Compensation Limit:</strong> In HFrEF, rising preload initially maintains stroke volume. Beyond 18 mmHg, the curve flattens into the descending limb: higher filling pressures no longer improve stroke volume but flood the pulmonary capillaries, precipitating dyspnea and rales.'
          : '<strong>Frank-Starling Kompansasyon Sınırı:</strong> HFrEF olgularında artan ön yük (EDV) başlangıçta atım hacmini korur. Ancak 18 mmHg aşıldığında eğri düzleşir ve iniş koluna girer; daha fazla sıvı atımı artırmaz, sadece akciğer kapillerlerini basarak dispne ve ral patlatır.'}
      </div>
    </div>`;
}

function geometrySvg(pid, maneuver, en) {
  if (pid === 'hcm') {
    const sam = { valsalva: en ? '(Severe obstruction!)' : '(Şiddetli Obstrüksiyon!)', squatting: en ? '(Open LVOT)' : '(Açık LVOT)' }[maneuver] || (en ? '(Dynamic narrowing)' : '(Dinamik Darlık)');
    return `
      <path d="M 60,80 Q 95,20 160,25 Q 165,80 160,135 Q 95,140 60,80 Z" fill="#0284c7" opacity="0.3" stroke="#0284c7" stroke-width="2"/>
      <rect x="140" y="25" width="45" height="110" rx="10" fill="#ef4444" opacity="0.75" stroke="#b91c1c" stroke-width="2"/>
      <text x="162" y="85" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">ASH (22mm)</text>
      <circle data-lv-wall cx="230" cy="80" r="30" fill="none" stroke="var(--border)" stroke-width="14"/>
      <path data-sam d="M 195,50 L 202,75" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <text x="210" y="78" font-size="10" font-weight="800" fill="#f59e0b" class="hf-geom-label">SAM ${sam}</text>
      <text x="230" y="84" font-size="11" font-weight="800" fill="var(--text-sub)" text-anchor="middle" class="hf-geom-label">LV</text>`;
  }
  const look = {
    normal: { c: '#16a34a', a: en ? 'Normal geometry' : 'Normal Geometri', b: en ? 'balanced h/r -> physiological σ' : 'h/r dengeli -> fizyolojik σ' },
    hfref: { c: '#ef4444', a: en ? 'Eccentric dilation' : 'Eksantrik Dilatasyon', b: en ? 'r ↑↑, h ↓ -> huge wall stress (σ)' : 'r ↑↑, h ↓ -> Devasa Duvar Stresi (σ)' },
    dcm: { c: '#ef4444', a: en ? 'Eccentric dilation' : 'Eksantrik Dilatasyon', b: en ? 'r ↑↑, h ↓ -> huge wall stress (σ)' : 'r ↑↑, h ↓ -> Devasa Duvar Stresi (σ)' },
    hfpef: { c: '#0284c7', a: en ? 'Concentric hypertrophy' : 'Konsantrik Hipertrofi', b: en ? 'h ↑↑, r ↓ -> wall stress preserved' : 'h ↑↑, r ↓ -> Duvar Stresi Korunur' },
    rcm: { c: '#0284c7', a: en ? 'Rigid infiltrated wall' : 'Rijit İnfiltratif Duvar', b: en ? 'h ↑, r normal -> filling restricted' : 'h ↑, r normal -> doluş kısıtlı' }
  }[pid] || { c: '#16a34a', a: '', b: '' };
  return `
    <circle data-lv-wall cx="160" cy="80" r="60" fill="none" stroke="${look.c}" stroke-width="10" opacity="0.8"/>
    <circle data-lv-cavity cx="160" cy="80" r="50" fill="${look.c}" opacity="0.15"/>
    <text x="160" y="75" font-size="10.5" font-weight="800" fill="${look.c}" text-anchor="middle" class="hf-geom-label">${look.a}</text>
    <text x="160" y="92" font-size="9" fill="var(--text-sub)" text-anchor="middle" class="hf-geom-label">${look.b}</text>`;
}

function geometryCardHtml(pt, maneuver, t, en) {
  return `
    <div class="hf-card">
      <div class="card-head">
        <h3>${en ? '2. Ventricular Remodeling & Laplace Stress' : '2. Ventrikül Geometrisi & Laplace Gerilimi'}</h3>
        <span class="badge ${pt.id === 'hcm' ? 'badge-danger' : 'badge-subtle'}">${pt.id === 'hcm' ? 'SAM & LVOT' : 'Laplace: σ = P·r / 2h'}</span>
      </div>
      <div class="geometry-svg-box">
        <svg viewBox="0 0 320 160" class="geom-svg">${geometrySvg(pt.id, maneuver, en)}</svg>
      </div>
      <p class="hf-live-note" data-hf-thick></p>
      <div class="geometry-metrics-grid">
        <div class="geom-metric"><span class="m-lbl">${en ? 'Ejection Fraction (EF)' : 'Ejeksiyon Fraksiyonu (EF)'}</span><strong class="${parseInt(pt.ef, 10) < 40 ? 'text-danger' : 'text-ok'}">${pt.ef}</strong></div>
        <div class="geom-metric"><span class="m-lbl">${en ? 'Wall Thickness' : 'Duvar Kalınlığı'}</span><strong>${pt.wallThickness}</strong></div>
        <div class="geom-metric"><span class="m-lbl">${en ? 'End-Diastolic Vol (EDV)' : 'Diyastol Sonu Hacim (EDV)'}</span><strong class="${pt.edv >= 200 ? 'text-danger' : ''}">${pt.edv} mL</strong></div>
        <div class="geom-metric"><span class="m-lbl">${en ? 'Classic Gallop Sound' : 'Karakteristik Galop Sesi'}</span><strong>${t(pt.gallop)}</strong></div>
      </div>
    </div>`;
}

function cycleCardHtml(therapy, t, en) {
  const node = (x, y, w, h, fill, stroke, color, a, b) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 - 2}" font-size="8.6" font-weight="700" fill="${color}" text-anchor="middle">${a}</text>
    <text x="${x + w / 2}" y="${y + h / 2 + 10}" font-size="7.6" fill="${color}" text-anchor="middle">${b}</text>`;
  const heads = { amber: '#d97706', violet: '#7c3aed', red: '#dc2626' };
  return `
    <div class="hf-card">
      <div class="card-head">
        <h3>${en ? '3. Neurohormonal Vicious Cycle & GDMT' : '3. Nörohormonal Kısır Döngü ve Kılavuz Tedavisi'}</h3>
        <span class="badge badge-accent">${en ? 'SNS & RAAS Vicious Circle' : 'SNS & RAAS Kısır Döngüsü'}</span>
      </div>
      <div class="vicious-cycle-box">
        <svg viewBox="0 0 320 212" class="cycle-svg" role="img" aria-label="${en ? 'Neurohormonal cycle with moving signal tokens' : 'Hareketli sinyal parçacıklarıyla nörohormonal döngü'}">
          <defs>
            ${Object.entries(heads).map(([k, c]) => `<marker id="hf-head-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${c}"/></marker>`).join('')}
            <marker id="hf-head-bar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M5,0 L5,10" stroke="#16a34a" stroke-width="3"/></marker>
          </defs>
          ${LINKS.map(l => `<path data-hf-link="${l.key}" d="${l.d}" fill="none" stroke="${l.color}" stroke-width="2" ${l.head === 'bar' ? 'stroke-dasharray="4 3"' : ''} marker-end="url(#hf-head-${l.head})"/>`).join('')}
          <ellipse cx="160" cy="40" rx="48" ry="20" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
          <text x="160" y="38" font-size="9.5" font-weight="800" fill="#991b1b" text-anchor="middle">${en ? 'Cardiac output ↓' : 'Debi (CO) ↓'}</text>
          <text x="160" y="50" font-size="8" fill="#991b1b" text-anchor="middle">${en ? 'Hypotension' : 'Hipotansiyon'}</text>
          ${node(8, 80, 120, 34, '#fef3c7', '#d97706', '#92400e', en ? 'Sympathetic (SNS)' : 'Sempatik Sistem (SNS)', en ? 'Tachycardia, vasoconstriction' : 'Taşikardi, Vazokonstriksiyon')}
          ${node(192, 80, 120, 34, '#ede9fe', '#7c3aed', '#5b21b6', en ? 'Renin-angiotensin (RAAS)' : 'Renin-Anjiyotensin (RAAS)', en ? 'Ang II, aldosterone' : 'Anjiyo II, Aldosteron')}
          ${node(222, 2, 96, 28, '#dcfce7', '#16a34a', '#166534', 'NP (BNP/ANP) ↑', en ? 'Natriuresis, vasodilation' : 'Natriürez, vazodilatasyon')}
          ${node(10, 166, 300, 38, '#fee2e2', '#dc2626', '#991b1b', en ? 'Myocyte apoptosis, fibrosis, chamber dilation' : 'Miyosit Apoptozu, Fibrozis, Ventrikül Genişlemesi', en ? 'Afterload rises -> heart failure worsens further!' : 'Ard Yük Artışı -> Kalp Yetmezliği Daha da Ağırlaşır!')}
          <text x="166" y="124" font-size="8" fill="#991b1b">${en ? 'Afterload ↑' : 'Ard yük ↑'}</text>
          <text x="166" y="134" font-size="8" fill="#991b1b">${en ? 'Wall stress ↑' : 'Duvar gerilimi ↑'}</text>
          <g class="hf-tokens">${LINKS.map(l => Array.from({ length: TOKENS }, () => `<circle data-hf-token="${l.key}" r="3.4" fill="${l.color}" cx="-10" cy="-10"/>`).join('')).join('')}</g>
          ${LINKS.filter(l => l.breakable).map(l => `<g data-hf-break="${l.key}" opacity="0"><circle r="7" fill="#fff" stroke="#16a34a" stroke-width="2"/><path d="M -3.5,-3.5 L 3.5,3.5 M 3.5,-3.5 L -3.5,3.5" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round"/></g>`).join('')}
        </svg>
      </div>
      <p class="hf-live-note" data-hf-drive></p>
      <div class="gdmt-pillars-box">
        <span class="gdmt-title">${en ? 'GDMT 4 Pillars Breaking the Cycle (tap to toggle):' : 'Döngüyü Kıran Kılavuz Tedavisinin 4 Sacayağı (aç/kapat):'}</span>
        <div class="pillars-row">
          ${THERAPIES.map(x => `<button type="button" class="pillar-tag hf-pillar-btn ${therapy[x.id] ? 'active' : ''}" data-therapy="${x.id}" aria-pressed="${Boolean(therapy[x.id])}">${t(x.label)}</button>`).join('')}
        </div>
        <p class="hf-therapy-note" data-hf-therapy-note></p>
      </div>
    </div>`;
}

function calloutHtml(en) {
  return `
    <div class="patho-callout-card">
      <div class="callout-badge"><span class="icon">🩺</span><strong>${en ? 'Auscultation Mechanics of S3 vs S4 Gallops' : 'S3 ve S4 Galop Seslerinin Oskültasyon Mekanizmaları'}</strong></div>
      <div class="callout-columns">
        <div class="callout-col">
          <h4>${en ? 'Third Heart Sound (S3) - Ventricular Gallop' : 'Üçüncü Kalp Sesi (S3) - Ventriküler Galop ("Slosh-ing-in")'}</h4>
          <p>${en
            ? 'Occurs in early diastole during rapid ventricular filling (just after S2). Blood rushing into an already overfilled, dilated, noncompliant ventricle creates sudden deceleration vibrations. Highly specific for elevated left ventricular filling pressures and HFrEF in adults over 40.'
            : 'Erken diyastolde, hızlı ventriküler doluş evresinde (S2den hemen sonra) oluşur. Aşırı dolmuş, dilate sol ventriküle hızla çarpan kan kütlesinin yarattığı ani yavaşlama titreşimidir. 40 yaş üstü erişkinde HFrEF ve yüksek sol ventrikül dolum basıncının en özgül fizik muayene bulgusudur.'}</p>
        </div>
        <div class="callout-col">
          <h4>${en ? 'Fourth Heart Sound (S4) - Atrial Gallop' : 'Dördüncü Kalp Sesi (S4) - Atriyal Galop ("A-stiff-wall")'}</h4>
          <p>${en
            ? 'Occurs in late diastole during active atrial contraction (just before S1). The atrium contracts forcefully against a stiff, hypertrophied, noncompliant ventricle (HFpEF, long-standing hypertension, aortic stenosis, hypertrophic cardiomyopathy). Absent in atrial fibrillation!'
            : 'Geç diyastolde, atriyumun aktif kasıldığı evrede (S1den hemen önce) oluşur. Atriyumun sertleşmiş, kalınlaşmış, elastikiyeti azalmış dirençli bir ventriküle karşı zorla kan fırlatmasıyla doğar (HFpEF, kronik hipertansiyon, aort darlığı, HCM). Atriyal fibrilasyonda atriyal kasılma olmadığı için S4 duyulamaz!'}</p>
        </div>
        <div class="callout-col">
          <h4>${en ? 'Dynamic Auscultation in HCM vs Aortic Stenosis' : 'HCM ve Aort Darlığı Ayırıcı Tanısında Dinamik Manevralar'}</h4>
          <p>${en
            ? 'Standing/Valsalva reduces LV preload: In HCM, smaller cavity allows anterior mitral leaflet to contact the septum earlier (SAM ↑), dramatically worsening LVOT gradient and murmur loudness! In fixed AS, murmur decreases. Squatting increases preload and afterload, opening the LVOT and reducing HCM murmur.'
            : 'Valsalva veya ayağa kalkma ön yükü azaltır: HCMde küçülen ventrikül lümeni nedeniyle mitral ön yaprakçık septuma daha kolay yapışır (SAM ↑); dinamik LVOT obstrüksiyonu ve üfürüm şiddetlenir! Sabit aort darlığında ise kan akımı azaldığı için üfürüm hafifler. Çömelme ön yükü artırarak LVOTyi açar ve HCM üfürümünü söndürür.'}</p>
        </div>
      </div>
    </div>`;
}

export function createHeartFailureLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createHeartFailureLab requires a mount container');
  let lang = (typeof opts.getLang === 'function' ? opts.getLang() : opts.lang) === 'en' ? 'en' : 'tr';
  let currentId = 'hfref';
  let preloadState = 'congested'; // low | optimal | congested
  let hcmManeuver = 'rest'; // rest | valsalva | squatting
  let therapy = { arni: false, bb: false, mra: false, sglt2: false };
  let gains = linkGains(therapy);
  const getPt = () => HF_PHENOTYPES.find(p => p.id === currentId) || HF_PHENOTYPES[1];
  let shown = phenotypeTarget(getPt(), preloadState, hcmManeuver);
  let loop = loopFrom(shown);
  const normalLoop = loopFrom(phenotypeTarget(HF_PHENOTYPES[0], 'optimal', 'rest'));
  let cancelGlide = () => {}, cancelGains = () => {};
  let lastPhase = 0, beats = 0;
  let tokenPos = Object.fromEntries(LINKS.map(l => [l.key, 0]));
  let linkLen = {};

  const clock = createCycleClock({ bpm: BPM, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang: () => lang, label: { tr: 'Canlı kalp döngüsü:', en: 'Live cardiac cycle:' } });
  const root = document.createElement('div');
  root.className = 'heart-failure-lab';
  const body = document.createElement('div');
  body.className = 'hf-grid';
  root.append(motionBar.element, body);
  container.appendChild(root);

  const t = obj => (obj ? obj[lang] || obj.tr || obj.en || '' : '');
  const $ = sel => body.querySelector(sel);
  const $$ = sel => body.querySelectorAll(sel);
  const setText = (sel, text) => { const el = $(sel); if (el && el.textContent !== text) el.textContent = text; };
  const attr = (el, name, value) => { if (el) el.setAttribute(name, value); };

  function renderBody() {
    const en = lang === 'en', pt = getPt();
    const tpl = htmlTemplates(t, en);
    body.innerHTML = `
      ${tpl.toolbar(currentId, preloadState, hcmManeuver)}
      ${tpl.status(pt, workingPoint(currentId, preloadState, hcmManeuver))}
      <div class="hf-panels-row">${tpl.pvCard(normalLoop, SPEC[currentId]?.gallop)}${tpl.congestionCard()}</div>
      <div class="hf-panels-row">${starlingCardHtml(currentId, en)}${geometryCardHtml(pt, currentId === 'hcm' ? hcmManeuver : '', t, en)}${cycleCardHtml(therapy, t, en)}</div>
      ${calloutHtml(en)}`;
    measureLinks();
    bindEvents();
    drawStatic();
    clock.refresh();
  }

  function measureLinks() {
    linkLen = {};
    $$('[data-hf-link]').forEach(p => { linkLen[p.dataset.hfLink] = typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0; });
    $$('[data-hf-break]').forEach(g => {
      const path = $(`[data-hf-link="${g.dataset.hfBreak}"]`);
      const len = linkLen[g.dataset.hfBreak];
      if (!path || !len) return;
      const m = path.getPointAtLength(len / 2);
      g.setAttribute('transform', `translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`);
    });
  }

  // Drawn when the loop or therapy changes (not per frame).
  function drawStatic() {
    if (!$('[data-hf-loop]')) return;
    const en = lang === 'en';
    attr($('[data-hf-loop]'), 'd', loopPath(loop.points));
    const vTop = Math.min(300, loop.v0 + 150 / Math.max(loop.ees, 0.3));
    attr($('[data-hf-espvr]'), 'd', `M${pvX(loop.v0)} ${pvY(0)} L${pvX(vTop)} ${pvY(loop.espvr(vTop))}`);
    const edpvr = Array.from({ length: 31 }, (_, i) => loop.v0 + (i / 30) * (Math.min(300, loop.edv * 1.25) - loop.v0));
    attr($('[data-hf-edpvr]'), 'd', edpvr.map((v, i) => `${i ? 'L' : 'M'}${pvX(v).toFixed(1)} ${pvY(loop.edpvr(v)).toFixed(1)}`).join(' '));
    setText('[data-hf-ef]', `${Math.round(loop.ef * 100)}%`);
    setText('[data-hf-vols]', `${Math.round(loop.edv)} / ${Math.round(loop.esv)} · ${Math.round(loop.sv)} mL`);
    const g = SPEC[currentId]?.gallop;
    setText('[data-hf-gallop-note]', g
      ? (g === 'S3' ? (en ? 'S3 flashes at the end of rapid early filling into the overfilled ventricle.' : 'S3, aşırı dolu ventriküle hızlı erken doluşun sonunda yanıp söner.') : (en ? 'S4 flashes with the atrial kick against the stiff ventricle (late diastole).' : 'S4, sert ventriküle karşı atriyal vuruyla (geç diyastol) yanıp söner.'))
      : (en ? 'No gallop: normal early relaxation and compliance.' : 'Galop yok: erken gevşeme ve kompliyans normal.'));
    setText('[data-hf-ef-note]', shown.efMatched ? '' : (en
      ? 'This phenotype\'s Starling SV with its typical EF would give a non-dilated ventricle, so the loop keeps the dilated EDV and its EF differs from the typical value on the card.'
      : 'Bu fenotipte Starling SV\'si tipik EF ile dilate olmayan bir ventrikül verir; döngü dilate EDV\'yi korur, bu nedenle EF karttaki tipik değerden farklıdır.'));
    drawThickening(en);
    drawCongestionText(en);
    drawCycleText(en);
  }

  function drawThickening(en) {
    const g = currentId === 'hcm' ? GEOM.hcm : GEOM.lv, wall = SPEC[currentId].wall;
    const d = rings(g.K, loop.edv, wall, loop.edv), s = rings(g.K, loop.edv, wall, loop.esv);
    const thick = Math.round(((s.h - d.h) / d.h) * 100);
    setText('[data-hf-thick]', en
      ? `Live: wall volume is conserved, so systolic wall thickening is ${thick}% (normal about 40% or more).`
      : `Canlı: duvar hacmi korunur; sistolik duvar kalınlaşması %${thick} (normalde yaklaşık %40 ve üzeri).`);
  }

  function drawCongestionText(en) {
    const c = congestionSigns(currentId, shown.lvedp);
    const lung = { clear: en ? 'clear lungs' : 'akciğerler temiz', interstitial: en ? 'interstitial edema, Kerley B lines' : 'interstisyel ödem, Kerley B çizgileri', alveolar: en ? 'alveolar edema, crackles' : 'alveoler ödem, raller' }[c.lung];
    setText('[data-hf-lung-text]', `PCWP ≈ ${c.pcwp.toFixed(0)} mmHg: ${lung}`);
    setText('[data-hf-jvp-text]', en ? `Estimated RAP ≈ ${c.rap.toFixed(0)} mmHg · JVP ≈ ${c.jvpCm.toFixed(0)} cm above the sternal angle (a and v waves)` : `Tahmini RAP ≈ ${c.rap.toFixed(0)} mmHg · JVP ≈ sternal açının ${c.jvpCm.toFixed(0)} cm üstü (a ve v dalgaları)`);
    const grade = ['', '+', '++', '+++'][c.edema];
    setText('[data-hf-edema-text]', c.edema ? (en ? `Peripheral pitting edema ${grade}` : `Periferik gode bırakan ödem ${grade}`) : (en ? 'No peripheral edema' : 'Periferik ödem yok'));
  }

  function drawCycleText(en) {
    const sev = cycleSeverity(shown);
    const ring = (gains.coSns + gains.coRaas + gains.snsRem + gains.raasRem + gains.remCo) / 5;
    const np = clamp((shown.lvedp - 8) / 20, 0, 1) * gains.np;
    setText('[data-hf-drive]', en
      ? `Cycle drive ${Math.round(sev * ring * 100)}% · natriuretic peptide response ${Math.round(Math.min(1.5, np) * 100)}% (wall stretch). Tokens speed up with congestion and low output.`
      : `Döngü yoğunluğu %${Math.round(sev * ring * 100)} · natriüretik peptid yanıtı %${Math.round(Math.min(1.5, np) * 100)} (duvar gerilmesi). Parçacıklar konjesyon ve düşük debiyle hızlanır.`);
    const active = THERAPIES.filter(x => therapy[x.id]);
    setText('[data-hf-therapy-note]', active.length ? active.map(x => t(x.note)).join(' ') : (en ? 'No therapy: every link of the cycle runs at full gain.' : 'Tedavi yok: döngünün tüm halkaları tam güçte çalışır.'));
    $$('[data-hf-break]').forEach(g => g.setAttribute('opacity', clamp((1 - gains[g.dataset.hfBreak]) / 0.7, 0, 1).toFixed(2)));
    $$('[data-hf-link]').forEach(p => {
      const def = LINKS.find(l => l.key === p.dataset.hfLink);
      p.setAttribute('opacity', (0.3 + 0.7 * clamp(gains[def.gain || def.key], 0, 1)).toFixed(2));
    });
  }

  function lvAt(phase) {
    const ph = loop.phases, spec = SPEC[currentId] || SPEC.normal;
    const filling = phase < ph.ivc[0];
    const u = filling ? ph.ivc[0] * Math.pow(phase / ph.ivc[0], spec.fill) : phase;
    const q = loopPointAt(loop.points, u);
    return {
      v: q.v, p: q.p, phase: cyclePhaseAt(u, ph),
      fill: filling ? phase / ph.ivc[0] : -1,
      contraction: clamp((loop.edv - q.v) / loop.sv, 0, 1),
      pressure: clamp(q.p / loop.peak, 0, 1)
    };
  }

  function drawLv(lv) {
    const wallEl = $('[data-lv-wall]');
    if (!wallEl) return;
    const g = currentId === 'hcm' ? GEOM.hcm : GEOM.lv;
    const { r, R } = rings(g.K, loop.edv, SPEC[currentId].wall, lv.v);
    attr(wallEl, 'r', ((r + R) / 2).toFixed(1));
    attr(wallEl, 'stroke-width', (R - r).toFixed(1));
    attr($('[data-lv-cavity]'), 'r', r.toFixed(1));
    const sam = $('[data-sam]');
    if (sam) {
      // SAM: the anterior leaflet is drawn toward the septum in mid-systole (Venturi and drag forces).
      const reach = { valsalva: 18, squatting: 0 }[hcmManeuver] ?? 13;
      attr(sam, 'd', `M 195,50 L ${(202 - reach * lv.pressure ** 2).toFixed(1)},75`);
    }
  }

  function drawPv(lv) {
    const dot = $('[data-hf-pv-dot]');
    if (!dot) return;
    attr(dot, 'cx', pvX(lv.v).toFixed(1));
    attr(dot, 'cy', pvY(lv.p).toFixed(1));
    setText('[data-hf-v]', `${Math.round(lv.v)} mL`);
    setText('[data-hf-p]', `${Math.round(lv.p)} mmHg`);
    const ef = $('[data-hf-ef]');
    if (ef) ef.style.transform = `scale(${(1 + 0.12 * lv.contraction * loop.ef).toFixed(3)})`;
    const sound = $('[data-hf-sound]');
    if (sound && lv.fill >= 0) attr(sound, 'opacity', bump(lv.fill, SPEC[currentId].gallop === 'S3' ? 0.2 : 0.9, 0.06).toFixed(2));
    else if (sound) attr(sound, 'opacity', '0');
  }

  function drawStarling(lv) {
    const cx = 45 + Math.min(30, shown.lvedp) * 8.5, cy = 185 - (shown.sv / 95) * 140;
    const point = $('[data-sl-point]'), ring = $('[data-sl-ring]');
    if (!point) return;
    attr(point, 'cx', cx.toFixed(1)); attr(point, 'cy', cy.toFixed(1));
    attr(ring, 'cx', cx.toFixed(1)); attr(ring, 'cy', cy.toFixed(1));
    attr(ring, 'r', (9 + 10 * lv.contraction * (shown.sv / 85)).toFixed(1));
    attr(ring, 'opacity', (0.9 - 0.8 * lv.contraction).toFixed(2));
    const label = $('[data-sl-label]');
    const flip = cx > 220;
    attr(label, 'x', (flip ? cx - 10 : cx + 10).toFixed(1)); attr(label, 'y', (cy - 8).toFixed(1));
    attr(label, 'text-anchor', flip ? 'end' : 'start');
    setText('[data-sl-label]', `${Math.round(shown.sv)} mL @ ${Math.round(shown.lvedp)} mmHg`);
  }

  function jvpWave(phase) {
    const ph = loop.phases;
    return 0.9 * bump(phase, ph.ivc[0] - 0.04, 0.035) + 0.25 * bump(phase, ph.ivc[0] + 0.02, 0.02) + 0.6 * bump(phase, ph.ivr[0], 0.05);
  }

  function drawCongestion(state) {
    const lungs = $('[data-hf-lungs]');
    if (!lungs) return;
    const c = congestionSigns(currentId, shown.lvedp);
    const wet = clamp((c.pcwp - 14) / 14, 0, 1);
    const breath = Math.sin(2 * Math.PI * (beats + state.phase) * ((14 + 12 * wet) / BPM)); // tachypnoea with congestion
    attr(lungs, 'transform', `translate(90 80) scale(${(1 + 0.03 * breath).toFixed(3)}) translate(-90 -80)`);
    const fh = 52 * clamp((c.pcwp - 18) / 12, 0, 1) + (c.pcwp >= 18 ? 1.5 * Math.sin(2 * Math.PI * state.phase) : 0);
    const fluid = $('[data-hf-fluid]');
    attr(fluid, 'y', (138 - Math.max(0, fh)).toFixed(1));
    attr(fluid, 'height', Math.max(0, fh).toFixed(1));
    attr($('[data-hf-blines]'), 'opacity', (clamp((c.pcwp - 15) / 6, 0, 1) * (0.6 + 0.3 * breath)).toFixed(2));
    const h = (c.jvpCm + 5 + 1.4 * jvpWave(state.phase) * (0.4 + 0.6 * clamp(c.rap / 12, 0, 1))) * 6;
    const col = $('[data-hf-jvp]');
    attr(col, 'y', (140 - Math.min(118, h)).toFixed(1));
    attr(col, 'height', Math.min(118, h).toFixed(1));
    const edema = $('[data-hf-edema]');
    attr(edema, 'rx', (6 + 4 * c.edema).toFixed(1));
    attr(edema, 'opacity', (0.25 * c.edema).toFixed(2));
  }

  function drawTokens(dPhase) {
    const sev = cycleSeverity(shown);
    const npDrive = clamp((shown.lvedp - 8) / 20, 0, 1);
    LINKS.forEach(l => {
      const path = $(`[data-hf-link="${l.key}"]`), len = linkLen[l.key];
      if (!path || !len) return;
      const gain = gains[l.gain || l.key];
      const speed = l.gain === 'np' ? (0.15 + 0.6 * npDrive) * gain : (0.25 + 0.9 * sev) * gain;
      tokenPos = { ...tokenPos, [l.key]: wrap(tokenPos[l.key] + dPhase * speed) };
      const op = l.gain === 'np' ? clamp(0.25 + 0.5 * npDrive * gain, 0, 1) : 0.2 + 0.8 * clamp(gain, 0, 1) * (0.35 + 0.65 * sev);
      $$(`[data-hf-token="${l.key}"]`).forEach((dot, i) => {
        const pt = path.getPointAtLength(wrap(tokenPos[l.key] + i / TOKENS) * len);
        dot.setAttribute('cx', pt.x.toFixed(1));
        dot.setAttribute('cy', pt.y.toFixed(1));
        dot.setAttribute('opacity', op.toFixed(2));
      });
    });
  }

  function drawFrame(state) {
    if (!body.firstElementChild) return;
    if (state.phase < lastPhase - 0.5) beats += 1;
    const raw = wrap(state.phase - lastPhase);
    lastPhase = state.phase;
    const lv = lvAt(state.phase);
    drawLv(lv);
    drawPv(lv);
    drawStarling(lv);
    drawCongestion(state);
    drawTokens(raw > 0.5 ? 0 : raw);
    motionBar.render(state, lv.phase);
  }

  function glideTo(target) {
    cancelGlide();
    cancelGlide = tweenValues(shown, target, values => {
      shown = values;
      loop = loopFrom(shown);
      drawStatic();
      clock.refresh();
    }, GLIDE_MS);
  }

  function changeState(patch) {
    if (patch.currentId) currentId = patch.currentId;
    if (patch.preloadState) preloadState = patch.preloadState;
    if (patch.hcmManeuver) hcmManeuver = patch.hcmManeuver;
    renderBody();
    glideTo(phenotypeTarget(getPt(), preloadState, hcmManeuver));
  }

  function toggleTherapy(id) {
    therapy = { ...therapy, [id]: !therapy[id] };
    $$('[data-therapy]').forEach(b => {
      b.classList.toggle('active', Boolean(therapy[b.dataset.therapy]));
      b.setAttribute('aria-pressed', String(Boolean(therapy[b.dataset.therapy])));
    });
    cancelGains();
    cancelGains = tweenValues(gains, linkGains(therapy), values => { gains = values; drawCycleText(lang === 'en'); clock.refresh(); }, GLIDE_MS);
  }

  function bindEvents() {
    $$('[data-phenotype]').forEach(btn => btn.addEventListener('click', () => changeState({ currentId: btn.dataset.phenotype })));
    $$('[data-preload]').forEach(btn => btn.addEventListener('click', () => changeState({ preloadState: btn.dataset.preload })));
    $$('[data-maneuver]').forEach(btn => btn.addEventListener('click', () => changeState({ hcmManeuver: btn.dataset.maneuver })));
    $$('[data-therapy]').forEach(btn => btn.addEventListener('click', () => toggleTherapy(btn.dataset.therapy)));
  }

  renderBody();
  const unsubscribe = clock.subscribe(drawFrame);

  function updateLanguage(next) {
    lang = next === 'en' ? 'en' : 'tr';
    motionBar.setLanguage();
    renderBody();
  }

  return {
    updateLanguage,
    setLanguage: updateLanguage,
    update: renderBody,
    getState: () => ({ phenotype: currentId, preload: preloadState, maneuver: hcmManeuver, therapy: { ...therapy }, shown: { ...shown }, phase: clock.getState().phase }),
    destroy() {
      cancelGlide();
      cancelGains();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}
