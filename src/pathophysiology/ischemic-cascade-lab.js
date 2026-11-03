// Ischemic Heart Disease & The Ischemic Cascade Lab
// Classical myocardial oxygen supply/demand mechanics and temporal cascade,
// animated on the shared cardiac cycle clock: an ischemia time that advances
// through the cascade, a beating LV short axis whose ischemic segment loses
// thickening, a sweeping ECG pen and phasic coronary flow past the stenosis.

import { ISCHEMIA_CASCADE_STAGES } from './pathophysiology-data.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';
// Dynamic so Node (scripts/test-pathophysiology.mjs imports this module) never loads CSS.
if (typeof document !== 'undefined') import('./ischemic-motion.css');

const wrap = x => ((x % 1) + 1) % 1;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));

// Ischemia time (s) at which each cascade step begins (pathophysiology-data.js "time").
const STAGE_START = [0, 10, 20, 30, 60];
const STAGE_PICK_T = [5, 15, 25, 45, 75];
const T_END = 90;
const ISCHEMIA_SEC_PER_BEAT = 5; // time-compressed play-through
const stageAt = t => STAGE_START.reduce((s, start, i) => (t >= start ? i + 1 : s), 1);

// LV short axis geometry (viewBox 240x160).
const LV = { cx: 120, cy: 80, rEndo: 44, wall: 16, inward: 16, thicken: 12, samples: 96 };
const SEG_CENTER = -45 * Math.PI / 180; // anterior / anterolateral (LAD)
const SEG_CORE = 40 * Math.PI / 180, SEG_EDGE = 65 * Math.PI / 180;

// ECG strip (viewBox 320x80): two beats per sweep.
const ECG = { x0: 10, cols: 300, beatsPerSweep: 2, base: 45, gain: 25, gap: 10 };
// Coronary (viewBox 400x70).
const COR = { x0: 20, x1: 380, cy: 35, r: 14, sx: 200, sw: 34, particles: 22, speed: 150 };

/** Phase offset of the QRS: just before isovolumic contraction starts. */
function findQrsPhase() {
  for (let i = 1; i < 400; i++) if (cycleShape(i / 400).phase === 'ivc') return wrap(i / 400 - 0.025);
  return 0.6;
}
const QRS_U = findQrsPhase();

/** ECG voltage (arbitrary mV) at cycle phase u for an ST shift st and T amplitude. */
function ecgValue(u, st, tAmp) {
  let d = wrap(u - QRS_U);
  if (d > 0.5) d -= 1;
  const stWindow = d > 0.02 && d < 0.24 ? Math.min(1, (d - 0.02) / 0.012) * Math.min(1, (0.24 - d) / 0.07) : 0;
  return 0.15 * gauss(d + 0.13, 0.018) - 0.12 * gauss(d + 0.012, 0.005) + 1.3 * gauss(d, 0.007)
    - 0.3 * gauss(d - 0.013, 0.006) + st * stWindow + tAmp * gauss(d - 0.17, 0.035);
}

export function createIschemicCascadeLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createIschemicCascadeLab requires a mount container');

  const getLangRaw = typeof opts.getLang === 'function' ? opts.getLang : () => (opts.lang === 'en' ? 'en' : 'tr');
  let lang = getLangRaw() === 'en' ? 'en' : 'tr';
  const getLang = () => lang;
  const L = (trText, enText) => (lang === 'en' ? enText : trText);

  let stenosis = 75; // %
  let workload = 'moderate'; // rest | moderate | heavy
  let plaqueState = 'stable'; // stable | ruptured
  let activeStage = 1;
  let isPlaying = false; // cascade play-through
  let ischemiaSec = 0;

  // Live animation state.
  let lastPhase = null, beats = 0, ecgCol = 0, refs = {};
  const ecgBuf = new Float32Array(ECG.cols);
  const particles = Array.from({ length: COR.particles }, (_, i) => ({
    s: i / COR.particles, lane: ((i * 0.37) % 1) * 2 - 1, gate: (i * 0.618) % 1
  }));
  let shownBal = null, cancelTween = () => {};

  const clock = createCycleClock({ bpm: 75, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: { tr: 'Kalp döngüsü:', en: 'Cardiac cycle:' } });

  const root = document.createElement('div');
  root.className = 'ischemic-cascade-lab';
  const content = document.createElement('div');
  root.append(motionBar.element, content);

  function tr(obj) {
    if (!obj) return '';
    return obj[lang] || obj.tr || obj.en || '';
  }

  function getMvo2Values() {
    let hr = 70, sbp = 120, dbp = 80, lvedp = 10, contractility = 1.0;
    if (workload === 'rest') {
      hr = 68; sbp = 118; dbp = 78; lvedp = 10; contractility = 1.0;
    } else if (workload === 'moderate') {
      hr = 120; sbp = 150; dbp = 85; lvedp = 18; contractility = 1.5;
    } else if (workload === 'heavy') {
      hr = 165; sbp = 185; dbp = 95; lvedp = 25; contractility = 2.1;
    }
    if (plaqueState === 'ruptured') lvedp += 8;

    const demandScore = (hr * 0.45) + (sbp * 0.35) + (contractility * 35);
    // Supply: CPP = dbp - lvedp. Diastolic filling time fraction decreases as HR rises.
    const diastoleFraction = Math.max(0.25, 0.65 - (hr - 60) * 0.0035);
    const cpp = Math.max(10, dbp - lvedp);
    const lumenFraction = plaqueState === 'ruptured' ? 0.05 : Math.max(0.08, 1 - (stenosis / 100));
    const supplyScore = cpp * diastoleFraction * lumenFraction * 2.8;
    const deficit = Math.max(0, demandScore - supplyScore);
    const isIschemic = deficit > 15 || plaqueState === 'ruptured';
    return { hr, sbp, dbp, lvedp, cpp, demandScore, supplyScore, deficit, isIschemic };
  }

  function balanceTarget(vals = getMvo2Values()) {
    return {
      tilt: clamp((vals.demandScore - vals.supplyScore) * 0.45, -18, 18),
      supply: vals.supplyScore,
      demand: vals.demandScore,
      flow: clamp(vals.supplyScore / vals.demandScore, 0.04, 1)
    };
  }

  /* ---------- Ischemia-time derived physiology ---------- */

  /** Regional kinesis: 1 normal, 0 akinetic, negative dyskinetic (systolic bulge). */
  function kinesisAt(t) {
    if (t < 20) return 1;
    if (t < 30) return 1 - (t - 20) / 10;
    if (plaqueState !== 'ruptured') return 0; // subendocardial: akinesia at most
    return -0.35 * Math.min(1, (t - 30) / 15); // transmural: dyskinesia
  }
  const relaxLagAt = t => (t >= 10 ? 0.07 * Math.min(1, (t - 10) / 10) : 0);
  const perfusionTint = t => Math.min(1, t / 10);
  function stShiftAt(t) {
    if (t < 30) return 0;
    const k = Math.min(1, (t - 30) / 10);
    return plaqueState === 'ruptured' ? 0.34 * k : -0.16 * k;
  }
  function tWaveAt(t) {
    const k = t < 30 ? 0 : Math.min(1, (t - 30) / 10);
    return plaqueState === 'ruptured' ? 0.3 + 0.2 * k : 0.3 - 0.42 * k;
  }

  function wallLabel(k, lag) {
    if (k <= -0.05) return { text: L('Diskinezi (sistolde dışa bombe)', 'Dyskinesia (systolic bulge)'), color: '#b91c1c' };
    if (k <= 0.15) return { text: L('Akinezi (kalınlaşma yok)', 'Akinesia (no thickening)'), color: '#dc2626' };
    if (k < 0.85) return { text: L('Hipokinezi', 'Hypokinesia'), color: '#ea580c' };
    if (lag > 0.01) return { text: L('Gecikmiş gevşeme (lüzitropi kaybı)', 'Delayed relaxation (lusitropy loss)'), color: '#d97706' };
    return { text: L('Normokinetik', 'Normokinetic'), color: '#16a34a' };
  }

  /* ---------- Static HTML ---------- */

  function controlBarHtml() {
    const badgeClass = stenosis >= 70 || plaqueState === 'ruptured' ? 'badge-danger' : stenosis >= 50 ? 'badge-warning' : 'badge-ok';
    const badgeText = plaqueState === 'ruptured' ? L('Tam Oklüzif Trombüs', 'Occlusive Thrombus')
      : stenosis >= 70 ? L('Efor Anginası Eşiği (≥%70)', 'Exertional Angina (≥70%)') : L('Anlamlı Olmayan Darlık (<%70)', 'Non-obstructive (<70%)');
    const btn = (attr, val, cur, text) => `<button class="stage-btn ${cur === val ? 'active' : ''}" data-${attr}="${val}">${text}</button>`;
    return `
      <div class="ischemic-control-bar">
        <div class="control-cluster">
          <span class="control-label">${L('Koroner Darlık', 'Coronary Stenosis')}: <strong data-ic-sten-label>${plaqueState === 'ruptured' ? '100% (ACS)' : stenosis + '%'}</strong></span>
          <input type="range" class="stenosis-slider" min="0" max="95" step="5" value="${stenosis}" ${plaqueState === 'ruptured' ? 'disabled' : ''} aria-label="${L('Koroner darlık', 'Coronary stenosis')}" />
          <span class="stenosis-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="control-cluster">
          <span class="control-label">${L('Miyokard İş Yükü / Egzersiz', 'Myocardial Workload')}:</span>
          <div class="btn-group">
            ${btn('workload', 'rest', workload, L('İstirahat', 'Rest'))}
            ${btn('workload', 'moderate', workload, L('Orta Egzersiz', 'Moderate'))}
            ${btn('workload', 'heavy', workload, L('Ağır Efor', 'Heavy'))}
          </div>
        </div>
        <div class="control-cluster">
          <span class="control-label">${L('Plak Morfolojisi', 'Plaque Status')}:</span>
          <div class="btn-group">
            ${btn('plaque', 'stable', plaqueState, L('Stabil Plak', 'Stable Plaque'))}
            ${btn('plaque', 'ruptured', plaqueState, L('Plak Rüptürü (AKS)', 'Ruptured / ACS'))}
          </div>
        </div>
        <div class="control-cluster">
          <button class="action-btn sim-play-btn ${isPlaying ? 'btn-active' : ''}" aria-pressed="${isPlaying}">
            ${isPlaying ? L('Durdur', 'Pause Cascade') : L('Kaskadı Sırayla Oynat', 'Play Cascade Sequence')}
          </button>
        </div>
      </div>`;
  }

  function mvo2CardHtml(vals) {
    const param = (title, val, cls = '') => `<div class="param-box"><span class="p-title">${title}</span><span class="p-val ${cls}">${val}</span></div>`;
    return `
      <div class="ischemic-card mvo2-card">
        <div class="card-head">
          <h3>${L('1. Miyokard Oksijen Arz-Talep Dengesi (MVO2)', '1. Myocardial O2 Supply-Demand Balance (MVO2)')}</h3>
          <span class="badge ${vals.isIschemic ? 'badge-danger ic-pulse' : 'badge-ok'}">
            ${vals.isIschemic ? L('İSKEMİ TETİKLENDİ', 'ISCHEMIA TRIGGERED') : L('DENGEDE', 'BALANCED')}
          </span>
        </div>
        <div class="mvo2-scale-container">
          <svg viewBox="0 0 400 210" class="mvo2-scale-svg">
            <polygon points="200,165 185,195 215,195" fill="var(--text-sub)" opacity="0.6"/>
            <line x1="80" y1="195" x2="320" y2="195" stroke="var(--border)" stroke-width="3" stroke-linecap="round"/>
            <g data-ic-beam></g>
            <text x="200" y="30" font-size="12" font-weight="800" fill="${vals.isIschemic ? '#dc2626' : '#16a34a'}" text-anchor="middle">
              ${vals.isIschemic ? L('O2 Açığı = ', 'O2 Deficit = ') + vals.deficit.toFixed(0) + L(' (Arz < Talep)', ' (Supply < Demand)') : L('Miyokard O2 Dengesi Korunuyor', 'O2 Equilibrium Maintained')}
            </text>
          </svg>
        </div>
        <div class="ic-coronary-box">
          <span class="lead-label">${L('LAD akımı: diyastolde baskın, darlık sonrası azalır', 'LAD flow: diastole-dominant, reduced beyond the stenosis')}</span>
          <svg viewBox="0 0 400 70" class="ic-coronary-svg" role="img" aria-label="${L('Koroner akım', 'Coronary flow')}">
            <g data-ic-cor-static></g>
            <g data-ic-particles>${particles.map(() => '<circle r="2.6" fill="#dc2626"/>').join('')}</g>
            <text data-ic-flow-text x="390" y="66" font-size="10" font-weight="700" text-anchor="end" fill="var(--text-sub)"></text>
          </svg>
        </div>
        <div class="mvo2-params-grid">
          ${param(L('Kalp Hızı', 'Heart Rate'), `${vals.hr} /min`)}
          ${param(L('Sistolik KB (Duvar Stresi)', 'Systolic BP (Wall Stress)'), `${vals.sbp} mmHg`)}
          ${param(L('Koroner Perfüzyon Basıncı (CPP)', 'Coronary Perfusion Pressure'), `${vals.cpp} mmHg`)}
          ${param(L('LV Diyastol Sonu Basıncı (LVEDP)', 'LV End-Diastolic Pressure'), `${vals.lvedp} mmHg`, vals.lvedp >= 18 ? 'text-danger' : '')}
        </div>
      </div>`;
  }

  function timelineHtml() {
    const x = t => 10 + (t / T_END) * 300;
    const ticks = STAGE_START.map((s, i) => `
      <line x1="${x(s)}" y1="14" x2="${x(s)}" y2="28" stroke="var(--text-sub)" stroke-width="1"/>
      <text x="${x(s) + 3}" y="12" font-size="9" font-weight="700" fill="var(--text-sub)">${i + 1}</text>`).join('');
    return `
      <div class="ic-timeline-box">
        <svg viewBox="0 0 320 44" class="ic-timeline-svg" role="img" aria-label="${L('İskemi süresi', 'Ischemia time')}">
          <rect x="10" y="18" width="300" height="6" rx="3" fill="var(--bg-subtle)" stroke="var(--border)"/>
          <rect data-ic-tl-fill x="10" y="18" width="0" height="6" rx="3" fill="#ef4444" opacity="0.7"/>
          ${ticks}
          <circle data-ic-tl-dot cx="10" cy="21" r="5" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>
          <text data-ic-tl-text x="10" y="40" font-size="10" font-weight="700" fill="var(--text-main)"></text>
        </svg>
      </div>`;
  }

  function cascadeCardHtml() {
    const stageData = ISCHEMIA_CASCADE_STAGES[activeStage - 1] || ISCHEMIA_CASCADE_STAGES[0];
    return `
      <div class="ischemic-card cascade-card">
        <div class="card-head">
          <h3>${L('2. Zamansal İskemik Kaskad', '2. Temporal Ischemic Cascade')}</h3>
          <span class="badge badge-accent">${L('Zaman Sıralı Akış', 'Chronological Flow')}</span>
        </div>
        ${timelineHtml()}
        <div class="cascade-stepper">
          ${ISCHEMIA_CASCADE_STAGES.map(s => `
            <button class="cascade-step-btn ${s.stage === activeStage ? 'active-step' : ''} ${s.stage < activeStage ? 'passed-step' : ''} ${s.stage === activeStage && isPlaying ? 'ic-step-live' : ''}" data-stage="${s.stage}" aria-pressed="${s.stage === activeStage}">
              <span class="step-num">${s.stage}</span>
              <div class="step-text">
                <strong class="step-title">${tr(s.title)}</strong>
                <span class="step-time">${tr(s.time)}</span>
              </div>
            </button>`).join('')}
        </div>
        <div class="stage-detail-box ic-detail-enter">
          <h4>${tr(stageData.title)}</h4>
          <p class="stage-desc">${tr(stageData.desc)}</p>
          <div class="stage-findings"><strong>${L('Kilit Klinik Bulgular', 'Key Clinical Findings')}:</strong> ${tr(stageData.findings)}</div>
        </div>
      </div>`;
  }

  function ecgLabel() {
    if (activeStage <= 3) return { text: L('Normal İzolektrik ST', 'Normal ST segment'), color: '#22c55e', y: 48 };
    if (plaqueState === 'ruptured') return { text: L('ST Elevasyonu (STEMI)', 'STEMI (Transmural)'), color: '#dc2626', y: 32 };
    return { text: L('Yatay ST Çökmesi (≥1mm)', 'Horizontal ST Depr (≥1mm)'), color: '#f59e0b', y: 60 };
  }

  function monitorCardHtml(vals) {
    const ecg = ecgLabel();
    const badge = activeStage >= 5 ? L('ANGİNA AĞRISI (10/10)', 'ANGINA PAIN (10/10)')
      : activeStage === 4 ? L('EKG ST-T SAPMASI', 'ECG ST-T SHIFT') : L('AĞRISIZ / PRE-SEMPTOMATİK', 'PRE-SYMPTOMATIC');
    const pain = activeStage >= 5 ? '8 - 10 / 10' : activeStage === 4 ? '1 - 3 / 10' : L('0 / 10 (Ağrısız)', '0 / 10 (Pain-free)');
    return `
      <div class="ischemic-card monitor-card">
        <div class="card-head">
          <h3>${L('3. Yatak Başı Monitör & LV Duvar Hareketi', '3. Bedside Monitor & LV Motion')}</h3>
          <span class="badge ${activeStage >= 4 ? 'badge-danger' : 'badge-subtle'} ${activeStage >= 5 ? 'ic-pulse' : ''}">${badge}</span>
        </div>
        <div class="lv-cross-section-svg-box">
          <svg viewBox="0 0 240 160" class="lv-short-svg" role="img" aria-label="${L('Sol ventrikül kısa eksen', 'LV short axis')}">
            <path data-ic-lv-cavity fill="var(--bg-subtle)" stroke="#b45a4f" stroke-width="1"/>
            <path data-ic-lv-wall fill="#f2b8ae" stroke="#b45a4f" stroke-width="1" fill-rule="evenodd"/>
            <path data-ic-lv-isch fill="#4338ca" opacity="0"/>
            <text x="120" y="84" font-size="11" font-weight="800" fill="var(--text-sub)" text-anchor="middle">LV</text>
            <text x="4" y="12" font-size="9" font-weight="700" fill="var(--text-sub)">${L('Anterior/anterolateral (LAD)', 'Anterior/anterolateral (LAD)')}</text>
            <text data-ic-wall-label x="4" y="24" font-size="10.5" font-weight="800"></text>
            <text data-ic-thick-text x="4" y="155" font-size="9.5" font-weight="700" fill="var(--text-sub)"></text>
          </svg>
        </div>
        <div class="ecg-lead-preview-box">
          <span class="lead-label">${L('Derivasyon V5 (EKG Trasesi)', 'Lead V5 (ECG Trace)')}</span>
          <svg viewBox="0 0 320 80" class="ecg-strip-svg">
            <defs>
              <pattern id="ecgGridMini" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(239,68,68,0.12)" stroke-width="0.5"/>
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(239,68,68,0.12)" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="320" height="80" fill="#fff" opacity="0.04" />
            <rect width="320" height="80" fill="url(#ecgGridMini)" />
            <polyline data-ic-ecg-old fill="none" stroke="${ecg.color}" stroke-width="2" opacity="0.4" stroke-linejoin="round"/>
            <polyline data-ic-ecg-new fill="none" stroke="${ecg.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            <circle data-ic-ecg-pen r="3" fill="${ecg.color}" class="ic-ecg-pen"/>
            <text x="314" y="${ecg.y - 26}" font-size="10.5" font-weight="800" fill="${ecg.color}" text-anchor="end">${ecg.text}</text>
          </svg>
        </div>
        <div class="bedside-indicators">
          <div class="indicator-item">
            <span class="lbl">${L('LVEDP (Diyastol Sonu Basınç)', 'LVEDP (Pulm. Capillary)')}:</span>
            <strong class="${vals.lvedp >= 18 ? 'val-danger' : 'val-ok'}">${vals.lvedp} mmHg ${vals.lvedp >= 18 ? L('(Konjesyon / S4 Galo)', '(Congestion / S4)') : ''}</strong>
          </div>
          <div class="indicator-item">
            <span class="lbl">${L('Göğüs Ağrısı Şiddeti', 'Angina Pain (VAS 0-10)')}:</span>
            <strong class="${activeStage >= 5 ? 'val-danger' : 'val-subtle'}">${pain}</strong>
          </div>
        </div>
      </div>`;
  }

  function calloutHtml() {
    return `
      <div class="patho-callout-card">
        <div class="callout-badge">
          <span class="icon">📖</span>
          <strong>${L('Temel Patofizyolojik İlkeler ve Hücresel Mekanizmalar:', 'Core Pathophysiological Principles & Cellular Mechanisms:')}</strong>
        </div>
        <div class="callout-columns">
          <div class="callout-col">
            <h4>${L('Neden Diyastolik Gevşeme Sistolik Kasılmadan Önce Bozulur?', 'Why does Diastolic Failure precede Systolic Failure?')}</h4>
            <p>${L(
              'Miyokardiyal gevşeme (lüzitropi) pasif değil, enerjiye en duyarlı aktif süreçtir! ATP azaldığında SERCA2a pompası kalsiyumu sarkoplazmik retikuluma geri çekemez. Sitoplazmik kalsiyum yüksek kalır, aktomiyozin ayrılması gecikir ve ventrikül sertleşir; bu nedenle EF düşmeden çok önce LVEDP fırlar ve efor dispnesi başlar.',
              'Myocardial relaxation (lusitropy) is an active, highly energy-demanding process! When ATP drops, SERCA2a cannot rapidly resequester Ca2+ into the sarcoplasmic reticulum. Cytosolic Ca2+ remains elevated, cross-bridge detachment is delayed, and ventricular compliance falls immediately, spiking LVEDP and causing exertional dyspnea before systolic ejection fraction declines.')}</p>
          </div>
          <div class="callout-col">
            <h4>${L('Neden Angina Kaskadın En Son Halkasıdır? (Sessiz İskemi)', 'Why is Angina the Final Step? (Silent Ischemia)')}</h4>
            <p>${L(
              'Ağrı hissi ancak yeterli miktarda adenozin, bradikinin ve serotonin birikerek sempatik C liflerini ve T1-T4 spinal segmentlerini uyardığında doğar. İskemi kısa sürerse veya nöropati varsa (örn. diyabette) hasta hiç ağrı hissetmeden ağır duvar kusuru ve ST çökmesi yaşayabilir (Sessiz İskemi).',
              'Pain requires local metabolic threshold accumulation (adenosine, bradykinin, serotonin) sufficient to depolarize unmyelinated sympathetic C-fibres transmitting to T1-T4 spinal segments. If ischemia is brief or sensory thresholds are blunted (e.g., diabetic autonomic neuropathy), patients experience profound diastolic/systolic dysfunction and ST depression without chest pain (Silent Ischemia).')}</p>
          </div>
          <div class="callout-col">
            <h4>${L('İskemik Nekroz Dalgası ve Mekanik Komplikasyonlar', 'Infarct Wavefront & Mechanical Complications')}</h4>
            <p>${L(
              'Reimer-Jennings nekroz dalgası: İskeminin 20. dakikasında subendokarddan başlar, 6 saatte transmural olur. Mekanik komplikasyonlar: 1) Papiller kas rüptürü (posteromedial papiller kas tek RCA ile beslenir -> Akut Ağır MR ve Ani Akciğer Ödemi); 2) Serbest duvar yırtılması -> Perikard tamponadı; 3) Ventriküler Septal Defekt (VSR).',
              'Reimer & Jennings wavefront: Subendocardial necrosis begins at 20 min, extending to epicardium over 6 hours. Mechanical complications: 1) Papillary muscle rupture (posteromedial single RCA supply -> Acute Severe MR & Flash Pulmonary Edema); 2) Free wall rupture -> Cardiac Tamponade; 3) Ventricular Septal Rupture (VSR).')}</p>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const vals = getMvo2Values();
    content.innerHTML = `
      <div class="ischemic-grid">
        ${controlBarHtml()}
        <div class="ischemic-panels-row">
          ${mvo2CardHtml(vals)}
          ${cascadeCardHtml()}
          ${monitorCardHtml(vals)}
        </div>
        ${calloutHtml()}
      </div>`;
    cacheRefs();
    if (!shownBal) shownBal = balanceTarget(vals);
    drawBeam();
    drawCoronaryStatic();
    if (!clock.getState().playing) fillEcg(clock.getState().phase);
    clock.refresh();
  }

  function cacheRefs() {
    const q = sel => content.querySelector(sel);
    refs = {
      beam: q('[data-ic-beam]'), corStatic: q('[data-ic-cor-static]'), flowText: q('[data-ic-flow-text]'),
      particles: [...content.querySelectorAll('[data-ic-particles] circle')],
      tlFill: q('[data-ic-tl-fill]'), tlDot: q('[data-ic-tl-dot]'), tlText: q('[data-ic-tl-text]'),
      cavity: q('[data-ic-lv-cavity]'), wall: q('[data-ic-lv-wall]'), isch: q('[data-ic-lv-isch]'),
      wallLabel: q('[data-ic-wall-label]'), thickText: q('[data-ic-thick-text]'),
      ecgOld: q('[data-ic-ecg-old]'), ecgNew: q('[data-ic-ecg-new]'), ecgPen: q('[data-ic-ecg-pen]'),
      stenLabel: q('[data-ic-sten-label]')
    };
  }

  /* ---------- Supply-demand beam and coronary ---------- */

  function drawBeam() {
    const b = shownBal;
    const rad = (b.tilt * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const x1 = 200 - 140 * cos, y1 = 165 - 140 * sin, x2 = 200 + 140 * cos, y2 = 165 + 140 * sin;
    const pan = (x, y, color, label, val) => `
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 35}" stroke="var(--text-sub)" stroke-width="1.5"/>
      <rect x="${x - 45}" y="${y + 35}" width="90" height="24" rx="4" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="1.5"/>
      <text x="${x}" y="${y + 51}" font-size="11" font-weight="700" fill="${color}" text-anchor="middle">${label}: ${val.toFixed(0)}</text>`;
    refs.beam.innerHTML = `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--text-main)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="200" cy="165" r="5" fill="#f59e0b"/>
      ${pan(x1, y1, '#0284c7', L('ARZ', 'SUPPLY'), b.supply)}
      ${pan(x2, y2, '#ef4444', L('TALEP', 'DEMAND'), b.demand)}`;
  }

  /** Lumen half-height at x for the current stenosis (or occlusive thrombus). */
  function lumenAt(x) {
    const sev = plaqueState === 'ruptured' ? 0.96 : stenosis / 100;
    return COR.r * (1 - sev * gauss(x - COR.sx, COR.sw / 2));
  }

  function drawCoronaryStatic() {
    const top = [], bot = [];
    for (let x = COR.x0; x <= COR.x1; x += 6) {
      const h = lumenAt(x);
      top.push(`${x},${(COR.cy - h).toFixed(1)}`);
      bot.push(`${x},${(COR.cy + h).toFixed(1)}`);
    }
    const wallY = COR.r + 4;
    const thrombus = plaqueState === 'ruptured'
      ? `<ellipse cx="${COR.sx}" cy="${COR.cy}" rx="16" ry="${COR.r - 2}" fill="#7f1d1d" opacity="0.85"/>` : '';
    refs.corStatic.innerHTML = `
      <rect x="${COR.x0}" y="${COR.cy - wallY}" width="${COR.x1 - COR.x0}" height="${wallY * 2}" rx="6" fill="#fde68a" stroke="#b45309" stroke-width="1.2"/>
      <polygon points="${top.join(' ')} ${bot.reverse().join(' ')}" fill="#fee2e2"/>
      ${thrombus}
      <text x="${COR.x0 + 2}" y="10" font-size="9.5" font-weight="700" fill="var(--text-sub)">${L('Proksimal', 'Proximal')}</text>
      <text x="${COR.sx}" y="10" font-size="9.5" font-weight="700" fill="#b45309" text-anchor="middle">${plaqueState === 'ruptured' ? L('Trombüs', 'Thrombus') : L('Plak', 'Plaque') + ' ' + stenosis + '%'}</text>
      <text x="${COR.x1 - 2}" y="10" font-size="9.5" font-weight="700" fill="var(--text-sub)" text-anchor="end">${L('Distal (iskemik bölge)', 'Distal (ischemic bed)')}</text>`;
  }

  function drawFlow(shape, dBeat) {
    const flow = shownBal.flow;
    // Systolic compression of intramural vessels: LV coronary flow is mostly diastolic.
    const phasic = 0.25 + 0.75 * (1 - shape.contraction);
    const span = COR.x1 - COR.x0;
    particles.forEach((p, i) => {
      const x = COR.x0 + p.s * span, h = lumenAt(x);
      const distal = x > COR.sx + COR.sw;
      const jet = Math.min(3, COR.r / Math.max(2, h));
      const v = COR.speed * phasic * (0.25 + 0.75 * flow) * (distal ? 1 : jet);
      p.s += (dBeat * v) / span;
      if (p.s > 1) p.s -= 1;
      const nx = COR.x0 + p.s * span, nh = lumenAt(nx);
      const hidden = nx > COR.sx + COR.sw * 0.5 && p.gate > flow;
      const el = refs.particles[i];
      el.setAttribute('cx', nx.toFixed(1));
      el.setAttribute('cy', (COR.cy + p.lane * nh * 0.7).toFixed(1));
      el.setAttribute('opacity', hidden ? '0' : '0.9');
    });
    refs.flowText.textContent = `${L('Distal akım / talep', 'Distal flow / demand')}: ${Math.round(flow * 100)}%`;
  }

  /* ---------- LV short axis ---------- */

  function segWeight(theta) {
    let d = Math.abs(theta - SEG_CENTER);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d <= SEG_CORE) return 1;
    if (d >= SEG_EDGE) return 0;
    return 0.5 + 0.5 * Math.cos(Math.PI * (d - SEG_CORE) / (SEG_EDGE - SEG_CORE));
  }

  function lvRadii(theta, cRemote, cSeg, k) {
    const w = segWeight(theta);
    const m = (1 - w) * cRemote + w * cSeg * k; // inward motion fraction
    const rEndo = LV.rEndo - LV.inward * m;
    const thick = LV.wall + LV.thicken * m;
    return { rEndo, rEpi: rEndo + thick, w, thick };
  }

  const pt = (r, th) => `${(LV.cx + r * Math.cos(th)).toFixed(1)},${(LV.cy + r * Math.sin(th)).toFixed(1)}`;

  function drawLv(u, shape) {
    const t = ischemiaSec, k = kinesisAt(t), lag = relaxLagAt(t);
    const cRemote = shape.contraction;
    const cSeg = lag > 0 ? Math.max(cRemote, cycleShape(u - lag).contraction) : cRemote;
    const epi = [], endo = [], segOuter = [], segInner = [];
    const transmural = plaqueState === 'ruptured' ? 1 : 0.5;
    let segThick = LV.wall;
    for (let i = 0; i < LV.samples; i++) {
      const th = (i / LV.samples) * 2 * Math.PI - Math.PI;
      const r = lvRadii(th, cRemote, cSeg, k);
      epi.push(pt(r.rEpi, th));
      endo.push(pt(r.rEndo, th));
      if (r.w > 0.02) {
        segInner.push(pt(r.rEndo, th));
        segOuter.push(pt(r.rEndo + r.thick * transmural, th));
      }
      if (r.w === 1) segThick = r.thick;
    }
    refs.cavity.setAttribute('d', `M${endo.join('L')}Z`);
    refs.wall.setAttribute('d', `M${epi.join('L')}Z M${endo.join('L')}Z`);
    refs.isch.setAttribute('d', segInner.length ? `M${segInner.join('L')}L${segOuter.reverse().join('L')}Z` : '');
    refs.isch.setAttribute('opacity', (0.75 * perfusionTint(t)).toFixed(2));
    const label = wallLabel(k, lag);
    if (refs.wallLabel.textContent !== label.text) {
      refs.wallLabel.textContent = label.text;
      refs.wallLabel.setAttribute('fill', label.color);
    }
    const remotePct = Math.round((LV.thicken * cRemote / LV.wall) * 100);
    const segPct = Math.round(((segThick - LV.wall) / LV.wall) * 100);
    refs.thickText.textContent = `${L('Duvar kalınlaşması', 'Wall thickening')}: ${L('uzak', 'remote')} ${remotePct}% · ${L('iskemik', 'ischemic')} ${segPct}%`;
  }

  /* ---------- ECG sweep ---------- */

  const colPhase = (col, u, sweepPos) => wrap(u - (sweepPos - col) / (ECG.cols / ECG.beatsPerSweep));
  const ecgY = v => (ECG.base - v * ECG.gain).toFixed(1);

  function sweepPos() {
    const beatsMod = ((beats % ECG.beatsPerSweep) + ECG.beatsPerSweep) % ECG.beatsPerSweep;
    return (beatsMod / ECG.beatsPerSweep) * ECG.cols;
  }

  /** Refill the whole strip (paused or after a parameter change while paused). */
  function fillEcg(u) {
    const pos = sweepPos(), st = stShiftAt(ischemiaSec), tw = tWaveAt(ischemiaSec);
    for (let c = 0; c < ECG.cols; c++) {
      const back = c <= pos ? c : c - ECG.cols;
      ecgBuf[c] = ecgValue(colPhase(back, u, pos), st, tw);
    }
    ecgCol = Math.floor(pos);
  }

  function drawEcg(u) {
    const pos = sweepPos(), col = Math.min(ECG.cols - 1, Math.floor(pos));
    const st = stShiftAt(ischemiaSec), tw = tWaveAt(ischemiaSec);
    let c = ecgCol;
    let guard = 0;
    while (c !== col && guard++ < ECG.cols) {
      c = (c + 1) % ECG.cols;
      const back = c <= pos ? c : c - ECG.cols;
      ecgBuf[c] = ecgValue(colPhase(back, u, pos), st, tw);
    }
    ecgCol = col;
    const fresh = [], old = [];
    for (let i = 0; i < ECG.cols; i++) {
      const p = `${ECG.x0 + i},${ecgY(ecgBuf[i])}`;
      if (i <= col) fresh.push(p);
      else if (i > col + ECG.gap) old.push(p);
    }
    refs.ecgNew.setAttribute('points', fresh.join(' '));
    refs.ecgOld.setAttribute('points', old.join(' '));
    refs.ecgPen.setAttribute('cx', ECG.x0 + col);
    refs.ecgPen.setAttribute('cy', ecgY(ecgBuf[col]));
  }

  /* ---------- Ischemia time ---------- */

  function drawTimeline() {
    const x = 10 + (ischemiaSec / T_END) * 300;
    refs.tlFill.setAttribute('width', (x - 10).toFixed(1));
    refs.tlDot.setAttribute('cx', x.toFixed(1));
    const text = `${L('İskemi süresi', 'Ischemia time')}: ${Math.round(ischemiaSec)} ${L('sn', 's')}${isPlaying ? L(' (zaman sıkıştırılmış)', ' (time-compressed)') : ''}`;
    if (refs.tlText.textContent !== text) refs.tlText.textContent = text;
  }

  function advanceIschemia(dt) {
    if (!isPlaying || dt <= 0) return;
    ischemiaSec = Math.min(T_END, ischemiaSec + dt);
    const stage = stageAt(ischemiaSec);
    const finished = ischemiaSec >= T_END;
    if (finished) isPlaying = false;
    if (stage !== activeStage || finished) {
      activeStage = stage;
      render();
    }
  }

  function onFrame(state) {
    const shape = cycleShape(state.phase);
    let dBeat = lastPhase == null || !state.playing ? 0 : wrap(state.phase - lastPhase);
    if (dBeat > 0.25) dBeat = 0;
    lastPhase = state.phase;
    beats += dBeat;
    advanceIschemia(dBeat * ISCHEMIA_SEC_PER_BEAT);
    drawLv(state.phase, shape);
    drawEcg(state.phase);
    drawFlow(shape, dBeat);
    drawTimeline();
    motionBar.render(state, shape.phase);
  }

  /* ---------- Controls ---------- */

  function glide() {
    cancelTween();
    cancelTween = tweenValues(shownBal, balanceTarget(), v => { shownBal = v; drawBeam(); }, 700);
  }

  function updateCascadeForConditions() {
    const vals = getMvo2Values();
    isPlaying = false;
    if (plaqueState === 'ruptured' || vals.deficit > 45) activeStage = 5;
    else if (vals.deficit > 30) activeStage = 4;
    else if (vals.deficit > 20) activeStage = 3;
    else if (vals.deficit > 10) activeStage = 2;
    else activeStage = 1;
    ischemiaSec = vals.isIschemic || vals.deficit > 10 ? STAGE_PICK_T[activeStage - 1] : 0;
  }

  function togglePlay() {
    if (isPlaying) {
      isPlaying = false;
    } else {
      isPlaying = true;
      activeStage = 1;
      ischemiaSec = 0;
      clock.setPlaying(true);
    }
    render();
  }

  function onClick(e) {
    const el = e.target.closest('[data-workload], [data-plaque], [data-stage], .sim-play-btn');
    if (!el || !content.contains(el)) return;
    if (el.classList.contains('sim-play-btn')) { togglePlay(); return; }
    if (el.dataset.stage) {
      isPlaying = false;
      activeStage = parseInt(el.dataset.stage, 10);
      ischemiaSec = STAGE_PICK_T[activeStage - 1];
      render();
      return;
    }
    if (el.dataset.workload) workload = el.dataset.workload;
    if (el.dataset.plaque) plaqueState = el.dataset.plaque;
    updateCascadeForConditions();
    render();
    glide();
  }

  function onSliderInput(e) {
    if (!e.target.classList.contains('stenosis-slider')) return;
    stenosis = parseInt(e.target.value, 10);
    if (refs.stenLabel) refs.stenLabel.textContent = `${stenosis}%`;
    drawCoronaryStatic();
    glide();
  }

  function onSliderChange(e) {
    if (!e.target.classList.contains('stenosis-slider')) return;
    updateCascadeForConditions();
    render();
    content.querySelector('.stenosis-slider')?.focus();
  }

  content.addEventListener('click', onClick);
  content.addEventListener('input', onSliderInput);
  content.addEventListener('change', onSliderChange);

  render();
  container.appendChild(root);
  const unsubscribe = clock.subscribe(onFrame);

  function updateLanguage(nextLang) {
    lang = (typeof nextLang === 'string' ? nextLang : getLangRaw()) === 'en' ? 'en' : 'tr';
    motionBar.setLanguage();
    render();
  }

  return {
    updateLanguage,
    update() { render(); },
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}
