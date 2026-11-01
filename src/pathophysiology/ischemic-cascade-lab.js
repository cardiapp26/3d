// Ischemic Heart Disease & The Ischemic Cascade Lab
// Classical myocardial oxygen supply/demand mechanics and temporal cascade

import { ISCHEMIA_CASCADE_STAGES, MVO2_DETERMINANTS } from './pathophysiology-data.js';

export function createIschemicCascadeLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createIschemicCascadeLab requires a mount container');

  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => (opts.lang === 'en' ? 'en' : 'tr');
  let lang = getLang() === 'en' ? 'en' : 'tr';

  let stenosis = 75; // %
  let workload = 'moderate'; // rest | moderate | heavy
  let plaqueState = 'stable'; // stable | ruptured
  let activeStage = 1;
  let isPlaying = false;
  let playTimer = null;

  const root = document.createElement('div');
  root.className = 'ischemic-cascade-lab';

  function tr(obj) {
    if (!obj) return '';
    return obj[lang] || obj.tr || obj.en || '';
  }

  function getMvo2Values() {
    let hr = 70;
    let sbp = 120;
    let dbp = 80;
    let lvedp = 10;
    let contractility = 1.0;

    if (workload === 'rest') {
      hr = 68; sbp = 118; dbp = 78; lvedp = 10; contractility = 1.0;
    } else if (workload === 'moderate') {
      hr = 120; sbp = 150; dbp = 85; lvedp = 18; contractility = 1.5;
    } else if (workload === 'heavy') {
      hr = 165; sbp = 185; dbp = 95; lvedp = 25; contractility = 2.1;
    }

    if (plaqueState === 'ruptured') {
      lvedp += 8;
    }

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

  function render() {
    const vals = getMvo2Values();
    const stageData = ISCHEMIA_CASCADE_STAGES[activeStage - 1] || ISCHEMIA_CASCADE_STAGES[0];

    root.innerHTML = `
      <div class="ischemic-grid">
        <!-- TOP CONTROL TOOLBAR -->
        <div class="ischemic-control-bar">
          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Coronary Stenosis' : 'Koroner Darlık'}: <strong>${plaqueState === 'ruptured' ? '100% (ACS)' : stenosis + '%'}</strong></span>
            <input type="range" class="stenosis-slider" min="0" max="95" step="5" value="${stenosis}" ${plaqueState === 'ruptured' ? 'disabled' : ''} />
            <span class="stenosis-badge ${stenosis >= 70 || plaqueState === 'ruptured' ? 'badge-danger' : stenosis >= 50 ? 'badge-warning' : 'badge-ok'}">
              ${plaqueState === 'ruptured' ? (lang === 'en' ? 'Occlusive Thrombus' : 'Tam Oklüzif Trombüs') : stenosis >= 70 ? (lang === 'en' ? 'Exertional Angina (≥70%)' : 'Efor Anginası Eşiği (≥%70)') : (lang === 'en' ? 'Non-obstructive (<70%)' : 'Anlamlı Olmayan Darlık (<%70)')}
            </span>
          </div>

          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Myocardial Workload' : 'Miyokard İş Yükü / Egzersiz'}:</span>
            <div class="btn-group">
              <button class="stage-btn ${workload === 'rest' ? 'active' : ''}" data-workload="rest">${lang === 'en' ? 'Rest' : 'İstirahat'}</button>
              <button class="stage-btn ${workload === 'moderate' ? 'active' : ''}" data-workload="moderate">${lang === 'en' ? 'Moderate' : 'Orta Egzersiz'}</button>
              <button class="stage-btn ${workload === 'heavy' ? 'active' : ''}" data-workload="heavy">${lang === 'en' ? 'Heavy' : 'Ağır Efor'}</button>
            </div>
          </div>

          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Plaque Status' : 'Plak Morfolojisi'}:</span>
            <div class="btn-group">
              <button class="stage-btn ${plaqueState === 'stable' ? 'active' : ''}" data-plaque="stable">${lang === 'en' ? 'Stable Plaque' : 'Stabil Plak'}</button>
              <button class="stage-btn ${plaqueState === 'ruptured' ? 'active' : ''}" data-plaque="ruptured">${lang === 'en' ? 'Ruptured / ACS' : 'Plak Rüptürü (AKS)'}</button>
            </div>
          </div>

          <div class="control-cluster">
            <button class="action-btn sim-play-btn ${isPlaying ? 'btn-active' : ''}">
              ${isPlaying ? (lang === 'en' ? 'Pause Cascade' : 'Durdur') : (lang === 'en' ? 'Play Cascade Sequence' : 'Kaskadı Sırayla Oynat')}
            </button>
          </div>
        </div>

        <!-- 3 MAIN PANELS -->
        <div class="ischemic-panels-row">
          <!-- PANEL 1: MVO2 BALANCE SCALE -->
          <div class="ischemic-card mvo2-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '1. Myocardial O2 Supply-Demand Balance (MVO2)' : '1. Miyokard Oksijen Arz-Talep Dengesi (MVO2)'}</h3>
              <span class="badge ${vals.isIschemic ? 'badge-danger' : 'badge-ok'}">
                ${vals.isIschemic ? (lang === 'en' ? 'ISCHEMIA TRIGGERED' : 'İSKEMİ TETİKLENDİ') : (lang === 'en' ? 'BALANCED' : 'DENGEDE')}
              </span>
            </div>

            <div class="mvo2-scale-container">
              <svg viewBox="0 0 400 210" class="mvo2-scale-svg">
                <!-- Fulcrum Triangle -->
                <polygon points="200,165 185,195 215,195" fill="var(--text-sub)" opacity="0.6"/>
                <line x1="80" y1="195" x2="320" y2="195" stroke="var(--border)" stroke-width="3" stroke-linecap="round"/>

                <!-- Beam, tilted according to demand vs supply -->
                <!-- If demand > supply, beam tilts down on the right (Demand side) -->
                ${(() => {
                  const tilt = Math.max(-18, Math.min(18, (vals.demandScore - vals.supplyScore) * 0.45));
                  const rad = (tilt * Math.PI) / 180;
                  const cos = Math.cos(rad);
                  const sin = Math.sin(rad);
                  const x1 = 200 - 140 * cos;
                  const y1 = 165 - 140 * sin;
                  const x2 = 200 + 140 * cos;
                  const y2 = 165 + 140 * sin;

                  return `
                    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--text-main)" stroke-width="4" stroke-linecap="round"/>
                    <circle cx="200" cy="165" r="5" fill="#f59e0b"/>

                    <!-- Left Pan: Supply (Arz) -->
                    <line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 + 35}" stroke="var(--text-sub)" stroke-width="1.5"/>
                    <rect x="${x1 - 45}" y="${y1 + 35}" width="90" height="24" rx="4" fill="#0284c7" opacity="0.25" stroke="#0284c7" stroke-width="1.5"/>
                    <text x="${x1}" y="${y1 + 51}" font-size="11" font-weight="700" fill="#0284c7" text-anchor="middle">
                      ${lang === 'en' ? 'SUPPLY' : 'ARZ'}: ${vals.supplyScore.toFixed(0)}
                    </text>

                    <!-- Right Pan: Demand (Talep) -->
                    <line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 + 35}" stroke="var(--text-sub)" stroke-width="1.5"/>
                    <rect x="${x2 - 45}" y="${y2 + 35}" width="90" height="24" rx="4" fill="#ef4444" opacity="0.25" stroke="#ef4444" stroke-width="1.5"/>
                    <text x="${x2}" y="${y2 + 51}" font-size="11" font-weight="700" fill="#ef4444" text-anchor="middle">
                      ${lang === 'en' ? 'DEMAND' : 'TALEP'}: ${vals.demandScore.toFixed(0)}
                    </text>
                  `;
                })()}

                <text x="200" y="30" font-size="12" font-weight="800" fill="${vals.isIschemic ? '#dc2626' : '#16a34a'}" text-anchor="middle">
                  ${vals.isIschemic ? (lang === 'en' ? 'O2 Deficit = ' + vals.deficit.toFixed(0) + ' (Supply < Demand)' : 'O2 Açığı = ' + vals.deficit.toFixed(0) + ' (Arz < Talep)') : (lang === 'en' ? 'O2 Equilibrium Maintained' : 'Miyokard O2 Dengesi Korunuyor')}
                </text>
              </svg>
            </div>

            <div class="mvo2-params-grid">
              <div class="param-box">
                <span class="p-title">${lang === 'en' ? 'Heart Rate' : 'Kalp Hızı'}</span>
                <span class="p-val">${vals.hr} /min</span>
              </div>
              <div class="param-box">
                <span class="p-title">${lang === 'en' ? 'Systolic BP (Wall Stress)' : 'Sistolik KB (Duvar Stresi)'}</span>
                <span class="p-val">${vals.sbp} mmHg</span>
              </div>
              <div class="param-box">
                <span class="p-title">${lang === 'en' ? 'Coronary Perfusion Pressure' : 'Koroner Perfüzyon Basıncı (CPP)'}</span>
                <span class="p-val">${vals.cpp} mmHg</span>
              </div>
              <div class="param-box">
                <span class="p-title">${lang === 'en' ? 'LV End-Diastolic Pressure' : 'LV Diyastol Sonu Basıncı (LVEDP)'}</span>
                <span class="p-val ${vals.lvedp >= 18 ? 'text-danger' : ''}">${vals.lvedp} mmHg</span>
              </div>
            </div>
          </div>

          <!-- PANEL 2: TEMPORAL ISCHEMIC CASCADE -->
          <div class="ischemic-card cascade-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '2. Temporal Ischemic Cascade' : '2. Zamansal İskemik Kaskad'}</h3>
              <span class="badge badge-accent">${lang === 'en' ? 'Chronological Flow' : 'Zaman Sıralı Akış'}</span>
            </div>

            <div class="cascade-stepper">
              ${ISCHEMIA_CASCADE_STAGES.map(s => `
                <button class="cascade-step-btn ${s.stage === activeStage ? 'active-step' : ''} ${s.stage < activeStage ? 'passed-step' : ''}" data-stage="${s.stage}">
                  <span class="step-num">${s.stage}</span>
                  <div class="step-text">
                    <strong class="step-title">${tr(s.title)}</strong>
                    <span class="step-time">${tr(s.time)}</span>
                  </div>
                </button>
              `).join('')}
            </div>

            <div class="stage-detail-box">
              <h4>${tr(stageData.title)}</h4>
              <p class="stage-desc">${tr(stageData.desc)}</p>
              <div class="stage-findings">
                <strong>${lang === 'en' ? 'Key Clinical Findings' : 'Kilit Klinik Bulgular'}:</strong> ${tr(stageData.findings)}
              </div>
            </div>
          </div>

          <!-- PANEL 3: BEDSIDE MONITOR & LV MYOCARDIUM -->
          <div class="ischemic-card monitor-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '3. Bedside Monitor & LV Motion' : '3. Yatak Başı Monitör & LV Duvar Hareketi'}</h3>
              <span class="badge ${activeStage >= 4 ? 'badge-danger' : 'badge-subtle'}">
                ${activeStage >= 5 ? (lang === 'en' ? 'ANGINA PAIN (10/10)' : 'ANGİNA AĞRISI (10/10)') : activeStage === 4 ? (lang === 'en' ? 'ECG ST-T SHIFT' : 'EKG ST-T SAPMASI') : (lang === 'en' ? 'PRE-SYMPTOMATIC' : 'AĞRISIZ / PRE-SEMPTOMATİK')}
              </span>
            </div>

            <!-- LV Short-Axis Cross Section SVG -->
            <div class="lv-cross-section-svg-box">
              <svg viewBox="0 0 240 160" class="lv-short-svg">
                <!-- Normal LV Outer wall -->
                <circle cx="120" cy="80" r="60" fill="none" stroke="var(--border)" stroke-width="12" />
                <!-- Normal LV Cavity -->
                <circle cx="120" cy="80" r="48" fill="var(--bg-subtle)" stroke="var(--border)" stroke-width="1.5" />

                <!-- Anterior/Lateral Ischemic Segment (top-right quadrant) -->
                ${activeStage >= 3 ? `
                  <!-- Dyskinetic / Akinetic ballooning -->
                  <path d="M 120,20 A 68,68 0 0,1 188,80" fill="none" stroke="#ef4444" stroke-width="${activeStage >= 4 ? '6' : '9'}" stroke-dasharray="4,2" />
                  <text x="165" y="42" font-size="10.5" font-weight="700" fill="#ef4444">${activeStage >= 4 ? (lang === 'en' ? 'Dyskinesia' : 'Diskinezi') : (lang === 'en' ? 'Akinesia' : 'Akinezi')}</text>
                ` : `
                  <path d="M 120,20 A 60,60 0 0,1 180,80" fill="none" stroke="#22c55e" stroke-width="12" />
                  <text x="155" y="45" font-size="10" font-weight="700" fill="#22c55e">${lang === 'en' ? 'Normokinetic' : 'Normokinetik'}</text>
                `}

                <text x="120" y="84" font-size="11" font-weight="800" fill="var(--text-sub)" text-anchor="middle">LV</text>
              </svg>
            </div>

            <!-- Lead V5 ECG Trace SVG -->
            <div class="ecg-lead-preview-box">
              <span class="lead-label">Lead V5 (EKG Trasesi)</span>
              <svg viewBox="0 0 320 80" class="ecg-strip-svg">
                <!-- Grid background lines -->
                <defs>
                  <pattern id="ecgGridMini" width="10" height="10" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(239,68,68,0.12)" stroke-width="0.5"/>
                    <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(239,68,68,0.12)" stroke-width="0.5"/>
                  </pattern>
                </defs>
                <rect width="320" height="80" fill="#fff" opacity="0.04" />
                <rect width="320" height="80" fill="url(#ecgGridMini)" />

                ${activeStage <= 3 ? `
                  <!-- Normal P-QRS-T -->
                  <path d="M 10,45 L 40,45 Q 45,38 50,45 L 70,45 L 74,48 L 80,10 L 86,52 L 90,45 L 120,45 Q 140,28 160,45 L 200,45" fill="none" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round" />
                  <text x="210" y="48" font-size="10.5" font-weight="700" fill="#22c55e">${lang === 'en' ? 'Normal ST segment' : 'Normal İzolektrik ST'}</text>
                ` : plaqueState === 'ruptured' ? `
                  <!-- Transmural STEMI ST elevation -->
                  <path d="M 10,45 L 40,45 Q 45,38 50,45 L 70,45 L 74,48 L 80,12 L 85,32 Q 95,15 130,22 Q 150,30 170,45 L 200,45" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" />
                  <text x="210" y="32" font-size="10.5" font-weight="800" fill="#dc2626">${lang === 'en' ? 'STEMI (Transmural)' : 'ST Elevasyonu (STEMI)'}</text>
                ` : `
                  <!-- Subendocardial ST depression -->
                  <path d="M 10,45 L 40,45 Q 45,38 50,45 L 70,45 L 74,48 L 80,10 L 86,52 L 90,56 L 125,56 Q 145,62 165,45 L 200,45" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" />
                  <text x="210" y="60" font-size="10.5" font-weight="800" fill="#f59e0b">${lang === 'en' ? 'Horizontal ST Depr (≥1mm)' : 'Yatay ST Çökmesi (≥1mm)'}</text>
                `}
              </svg>
            </div>

            <!-- Clinical Indicators -->
            <div class="bedside-indicators">
              <div class="indicator-item">
                <span class="lbl">${lang === 'en' ? 'LVEDP (Pulm. Capillary)' : 'LVEDP (Diyastol Sonu Basınç)'}:</span>
                <strong class="${vals.lvedp >= 18 ? 'val-danger' : 'val-ok'}">${vals.lvedp} mmHg ${vals.lvedp >= 18 ? (lang === 'en' ? '(Congestion / S4)' : '(Konjesyon / S4 Galo)') : ''}</strong>
              </div>
              <div class="indicator-item">
                <span class="lbl">${lang === 'en' ? 'Angina Pain (VAS 0-10)' : 'Göğüs Ağrısı Şiddeti'}:</span>
                <strong class="${activeStage >= 5 ? 'val-danger' : 'val-subtle'}">${activeStage >= 5 ? '8 - 10 / 10' : activeStage === 4 ? '1 - 3 / 10' : '0 / 10 (Ağrısız)'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- CORE PATHOPHYSIOLOGY HIGHLIGHT & MECHANICAL COMPLICATIONS -->
        <div class="patho-callout-card">
          <div class="callout-badge">
            <span class="icon">📖</span>
            <strong>${lang === 'en' ? 'Core Pathophysiological Principles & Cellular Mechanisms:' : 'Temel Patofizyolojik İlkeler ve Hücresel Mekanizmalar:'}</strong>
          </div>
          <div class="callout-columns">
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Why does Diastolic Failure precede Systolic Failure?' : 'Neden Diyastolik Gevşeme Sistolik Kasılmadan Önce Bozulur?'}</h4>
              <p>${lang === 'en' 
                ? 'Myocardial relaxation (lusitropy) is an active, highly energy-demanding process! When ATP drops, SERCA2a cannot rapidly resequester Ca2+ into the sarcoplasmic reticulum. Cytosolic Ca2+ remains elevated, cross-bridge detachment is delayed, and ventricular compliance falls immediately, spiking LVEDP and causing exertional dyspnea before systolic ejection fraction declines.'
                : 'Miyokardiyal gevşeme (lüzitropi) pasif değil, enerjiye en duyarlı aktif süreçtir! ATP azaldığında SERCA2a pompası kalsiyumu sarkoplazmik retikuluma geri çekemez. Sitoplazmik kalsiyum yüksek kalır, aktomiyozin ayrılması gecikir ve ventrikül sertleşir; bu nedenle EF düşmeden çok önce LVEDP fırlar ve efor dispnesi başlar.'}</p>
            </div>
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Why is Angina the Final Step? (Silent Ischemia)' : 'Neden Angina Kaskadın En Son Halkasıdır? (Sessiz İskemi)'}</h4>
              <p>${lang === 'en'
                ? 'Pain requires local metabolic threshold accumulation (adenosine, bradykinin, serotonin) sufficient to depolarize unmyelinated sympathetic C-fibres transmitting to T1-T4 spinal segments. If ischemia is brief or sensory thresholds are blunted (e.g., diabetic autonomic neuropathy), patients experience profound diastolic/systolic dysfunction and ST depression without chest pain (Silent Ischemia).'
                : 'Ağrı hissi ancak yeterli miktarda adenozin, bradikinin ve serotonin birikerek sempatik C liflerini ve T1-T4 spinal segmentlerini uyardığında doğar. İskemi kısa sürerse veya nöropati varsa (örn. diyabette) hasta hiç ağrı hissetmeden ağır duvar kusuru ve ST çökmesi yaşayabilir (Sessiz İskemi).'}</p>
            </div>
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Infarct Wavefront & Mechanical Complications' : 'İskemik Nekroz Dalgası ve Mekanik Komplikasyonlar'}</h4>
              <p>${lang === 'en'
                ? 'Reimer & Jennings wavefront: Subendocardial necrosis begins at 20 min, extending to epicardium over 6 hours. Mechanical complications: 1) Papillary muscle rupture (posteromedial single RCA supply -> Acute Severe MR & Flash Pulmonary Edema); 2) Free wall rupture -> Cardiac Tamponade; 3) Ventricular Septal Rupture (VSR).'
                : 'Reimer-Jennings nekroz dalgası: İskeminin 20. dakikasında subendokarddan başlar, 6 saatte transmural olur. Mekanik komplikasyonlar: 1) Papiller kas rüptürü (posteromedial papiller kas tek RCA ile beslenir -> Akut Ağır MR ve Ani Akciğer Ödemi); 2) Serbest duvar yırtılması -> Perikard tamponadı; 3) Ventriküler Septal Defekt (VSR).'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    const slider = root.querySelector('.stenosis-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        stenosis = parseInt(e.target.value, 10);
        updateCascadeForConditions();
        render();
      });
    }

    root.querySelectorAll('[data-workload]').forEach(btn => {
      btn.addEventListener('click', () => {
        workload = btn.dataset.workload;
        updateCascadeForConditions();
        render();
      });
    });

    root.querySelectorAll('[data-plaque]').forEach(btn => {
      btn.addEventListener('click', () => {
        plaqueState = btn.dataset.plaque;
        if (plaqueState === 'ruptured') activeStage = 5;
        updateCascadeForConditions();
        render();
      });
    });

    root.querySelectorAll('[data-stage]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeStage = parseInt(btn.dataset.stage, 10);
        render();
      });
    });

    const playBtn = root.querySelector('.sim-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', togglePlay);
    }
  }

  function updateCascadeForConditions() {
    const vals = getMvo2Values();
    if (plaqueState === 'ruptured') {
      activeStage = 5;
    } else if (vals.deficit > 45) {
      activeStage = 5;
    } else if (vals.deficit > 30) {
      activeStage = 4;
    } else if (vals.deficit > 20) {
      activeStage = 3;
    } else if (vals.deficit > 10) {
      activeStage = 2;
    } else {
      activeStage = 1;
    }
  }

  function togglePlay() {
    if (isPlaying) {
      clearInterval(playTimer);
      isPlaying = false;
      render();
    } else {
      isPlaying = true;
      activeStage = 1;
      render();
      playTimer = setInterval(() => {
        if (activeStage < 5) {
          activeStage++;
          render();
        } else {
          clearInterval(playTimer);
          isPlaying = false;
          render();
        }
      }, 1600);
    }
  }

  render();
  container.appendChild(root);

  return {
    destroy() {
      if (playTimer) clearInterval(playTimer);
      root.remove();
    },
    update() {
      render();
    },
    setLanguage(nextLang) {
      lang = nextLang === 'en' ? 'en' : 'tr';
      render();
    }
  };
}
