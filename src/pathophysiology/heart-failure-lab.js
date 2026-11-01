// Heart Failure & Cardiomyopathy Pathophysiology Lab
// Classical Frank-Starling, Laplace remodeling, and neurohormonal mechanisms

import { HF_PHENOTYPES } from './pathophysiology-data.js';

export function createHeartFailureLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createHeartFailureLab requires a mount container');

  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => (opts.lang === 'en' ? 'en' : 'tr');
  let lang = getLang() === 'en' ? 'en' : 'tr';

  let currentPhenotypeId = 'hfref';
  let preloadState = 'congested'; // low | optimal | congested
  let hcmManeuver = 'rest'; // rest | valsalva | squatting

  const root = document.createElement('div');
  root.className = 'heart-failure-lab';

  function tr(obj) {
    if (!obj) return '';
    return obj[lang] || obj.tr || obj.en || '';
  }

  function getPhenotype() {
    return HF_PHENOTYPES.find(p => p.id === currentPhenotypeId) || HF_PHENOTYPES[1];
  }

  function render() {
    const pt = getPhenotype();

    // Calculate Frank-Starling working point
    let lvedpVal = 10;
    let svVal = 75;

    if (currentPhenotypeId === 'normal') {
      if (preloadState === 'low') { lvedpVal = 6; svVal = 55; }
      else if (preloadState === 'optimal') { lvedpVal = 10; svVal = 75; }
      else { lvedpVal = 16; svVal = 85; }
    } else if (currentPhenotypeId === 'hfref') {
      if (preloadState === 'low') { lvedpVal = 12; svVal = 32; }
      else if (preloadState === 'optimal') { lvedpVal = 18; svVal = 44; }
      else { lvedpVal = 26; svVal = 42; } // Descending flat limb!
    } else if (currentPhenotypeId === 'hfpef') {
      if (preloadState === 'low') { lvedpVal = 10; svVal = 48; }
      else if (preloadState === 'optimal') { lvedpVal = 16; svVal = 60; }
      else { lvedpVal = 25; svVal = 64; } // Steep EDPVR
    } else if (currentPhenotypeId === 'hcm') {
      if (hcmManeuver === 'valsalva') { lvedpVal = 14; svVal = 40; }
      else if (hcmManeuver === 'squatting') { lvedpVal = 24; svVal = 68; }
      else { lvedpVal = 20; svVal = 55; }
    } else if (currentPhenotypeId === 'dcm') {
      if (preloadState === 'congested') { lvedpVal = 28; svVal = 38; }
      else { lvedpVal = 19; svVal = 36; }
    } else if (currentPhenotypeId === 'rcm') {
      lvedpVal = 26; svVal = 46;
    }

    const hasCongestion = lvedpVal >= 18;
    const hasLowOutput = svVal < 45;

    root.innerHTML = `
      <div class="hf-grid">
        <!-- TOP TOOLBAR -->
        <div class="hf-toolbar">
          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Clinical Phenotype' : 'Klinik Fenotip'}:</span>
            <div class="btn-group">
              ${HF_PHENOTYPES.map(p => `
                <button class="stage-btn ${p.id === currentPhenotypeId ? 'active' : ''}" data-phenotype="${p.id}">
                  ${tr(p.name).split('(')[0].trim()}
                </button>
              `).join('')}
            </div>
          </div>

          ${currentPhenotypeId === 'hcm' ? `
            <div class="control-cluster">
              <span class="control-label">${lang === 'en' ? 'Dynamic Bedside Maneuver' : 'Dinamik Yatak Başı Manevrası'}:</span>
              <div class="btn-group">
                <button class="stage-btn ${hcmManeuver === 'rest' ? 'active' : ''}" data-maneuver="rest">${lang === 'en' ? 'Rest' : 'İstirahat'}</button>
                <button class="stage-btn ${hcmManeuver === 'valsalva' ? 'active' : ''}" data-maneuver="valsalva">${lang === 'en' ? 'Valsalva (Preload ↓)' : 'Valsalva (Ön Yük ↓)'}</button>
                <button class="stage-btn ${hcmManeuver === 'squatting' ? 'active' : ''}" data-maneuver="squatting">${lang === 'en' ? 'Squatting (Preload ↑)' : 'Çömelme (Ön Yük ↑)'}</button>
              </div>
            </div>
          ` : `
            <div class="control-cluster">
              <span class="control-label">${lang === 'en' ? 'Preload / Volume Status' : 'Ön Yük / Sıvı Durumu'}:</span>
              <div class="btn-group">
                <button class="stage-btn ${preloadState === 'low' ? 'active' : ''}" data-preload="low">${lang === 'en' ? 'Dehydrated' : 'Hipovolemik'}</button>
                <button class="stage-btn ${preloadState === 'optimal' ? 'active' : ''}" data-preload="optimal">${lang === 'en' ? 'Euvolemic' : 'Övolemik'}</button>
                <button class="stage-btn ${preloadState === 'congested' ? 'active' : ''}" data-preload="congested">${lang === 'en' ? 'Fluid Overload' : 'Konjesyon / Aşırı Yük'}</button>
              </div>
            </div>
          `}
        </div>

        <!-- STATUS BAR -->
        <div class="hf-status-bar">
          <div class="status-col">
            <strong>${tr(pt.name)}</strong>
            <p>${tr(pt.mechanism)}</p>
          </div>
          <div class="status-tags">
            <span class="badge ${hasCongestion ? 'badge-danger' : 'badge-ok'}">
              ${hasCongestion ? (lang === 'en' ? 'BACKWARD FAILURE: CONGESTION (PCWP ≥18)' : 'GERİ YETERSİZLİK: AKCİĞER ÖDEMİ (PCWP ≥18)') : (lang === 'en' ? 'NO CONGESTION' : 'AKCİĞERLER TEMİZ')}
            </span>
            <span class="badge ${hasLowOutput ? 'badge-warning' : 'badge-ok'}">
              ${hasLowOutput ? (lang === 'en' ? 'FORWARD FAILURE: LOW OUTPUT (SV <45 mL)' : 'İLERİ YETERSİZLİK: DÜŞÜK DEBİ (SV <45 mL)') : (lang === 'en' ? 'ADEQUATE PERFUSION' : 'PERFÜZYON YETERLİ')}
            </span>
          </div>
        </div>

        <!-- 3 MAIN PANELS -->
        <div class="hf-panels-row">
          <!-- PANEL 1: FRANK-STARLING RELATION -->
          <div class="hf-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '1. Frank-Starling Law & Congestion Limit' : '1. Frank-Starling Kanunu ve Konjesyon Sınırı'}</h3>
              <span class="badge badge-accent">Starling Curve</span>
            </div>

            <div class="starling-svg-box">
              <svg viewBox="0 0 340 220" class="starling-curve-svg">
                <!-- Axes -->
                <line x1="45" y1="185" x2="320" y2="185" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
                <line x1="45" y1="185" x2="45" y2="25" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
                <text x="315" y="198" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="end">${lang === 'en' ? 'LVEDP / PCWP (mmHg)' : 'Ön Yük: LVEDP / PCWP (mmHg)'}</text>
                <text x="40" y="20" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="start">${lang === 'en' ? 'Stroke Volume (mL)' : 'Vuru Hacmi: SV (mL)'}</text>

                <!-- Congestion Threshold Line at 18 mmHg (x = 45 + 18 * 8.5 = 198) -->
                <line x1="198" y1="25" x2="198" y2="185" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3"/>
                <rect x="200" y="28" width="115" height="18" rx="3" fill="#fee2e2" opacity="0.85"/>
                <text x="204" y="41" font-size="9" font-weight="800" fill="#991b1b">
                  ${lang === 'en' ? 'Pulmonary Edema (≥18)' : 'Akciğer Konjesyonu (≥18)'}
                </text>

                <!-- Normal Curve -->
                <path d="M 45,180 Q 90,75 160,60 T 310,50" fill="none" stroke="#22c55e" stroke-width="2" opacity="${currentPhenotypeId === 'normal' ? '1' : '0.4'}"/>
                <text x="270" y="45" font-size="9" font-weight="700" fill="#22c55e">${lang === 'en' ? 'Normal' : 'Normal'}</text>

                <!-- Depressed HFrEF / DCM Curve -->
                <path d="M 45,182 Q 100,140 180,135 T 310,140" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="${currentPhenotypeId === 'hfref' || currentPhenotypeId === 'dcm' ? '1' : '0.4'}"/>
                <text x="270" y="152" font-size="9.5" font-weight="800" fill="#ef4444">${lang === 'en' ? 'HFrEF / DCM' : 'HFrEF / DCM'}</text>

                <!-- Working point circle -->
                ${(() => {
                  const cx = 45 + Math.min(30, lvedpVal) * 8.5;
                  const cy = 185 - (svVal / 95) * 140;
                  return `
                    <circle cx="${cx}" cy="${cy}" r="7" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
                    <text x="${cx + 10}" y="${cy - 8}" font-size="10.5" font-weight="800" fill="#f59e0b">
                      ${svVal} mL @ ${lvedpVal} mmHg
                    </text>
                  `;
                })()}
              </svg>
            </div>

            <div class="starling-notes">
              ${lang === 'en'
                ? '<strong>Frank-Starling Compensation Limit:</strong> In HFrEF, rising preload initially maintains stroke volume. Beyond 18 mmHg, the curve flattens into the descending limb: higher filling pressures no longer improve stroke volume but flood the pulmonary capillaries, precipitating dyspnea and rales.'
                : '<strong>Frank-Starling Kompansasyon Sınırı:</strong> HFrEF olgularında artan ön yük (EDV) başlangıçta atım hacmini korur. Ancak 18 mmHg aşıldığında eğri düzleşir ve iniş koluna girer; daha fazla sıvı atımı artırmaz, sadece akciğer kapillerlerini basarak dispne ve ral patlatır.'}
            </div>
          </div>

          <!-- PANEL 2: VENTRICULAR GEOMETRY & LAPLACE WALL STRESS -->
          <div class="hf-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '2. Ventricular Remodeling & Laplace Stress' : '2. Ventrikül Geometrisi & Laplace Gerilimi'}</h3>
              <span class="badge ${currentPhenotypeId === 'hcm' ? 'badge-danger' : 'badge-subtle'}">
                ${currentPhenotypeId === 'hcm' ? 'SAM & LVOT' : 'Laplace: σ = P·r / 2h'}
              </span>
            </div>

            <div class="geometry-svg-box">
              <svg viewBox="0 0 320 160" class="geom-svg">
                ${currentPhenotypeId === 'hcm' ? `
                  <!-- HCM with Asymmetric Septal Hypertrophy and SAM -->
                  <!-- Thick Asymmetric Septum -->
                  <path d="M 60,80 Q 95,20 160,25 Q 165,80 160,135 Q 95,140 60,80 Z" fill="#0284c7" opacity="0.3" stroke="#0284c7" stroke-width="2"/>
                  <rect x="140" y="25" width="45" height="110" rx="10" fill="#ef4444" opacity="0.75" stroke="#b91c1c" stroke-width="2"/>
                  <text x="162" y="85" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">ASH (22mm)</text>

                  <!-- Mitral anterior leaflet sucked toward septum (SAM) -->
                  <path d="M 195,50 L ${hcmManeuver === 'valsalva' ? '184' : hcmManeuver === 'squatting' ? '202' : '189'},75" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
                  <text x="210" y="78" font-size="10" font-weight="800" fill="#f59e0b">SAM ${hcmManeuver === 'valsalva' ? '(Şiddetli Obstrüksiyon!)' : hcmManeuver === 'squatting' ? '(Açık LVOT)' : '(Dinamik Darlık)'}</text>

                  <!-- LV cavity -->
                  <circle cx="230" cy="80" r="30" fill="none" stroke="var(--border)" stroke-width="14"/>
                  <text x="230" y="84" font-size="11" font-weight="800" fill="var(--text-sub)" text-anchor="middle">LV</text>
                ` : currentPhenotypeId === 'hfref' || currentPhenotypeId === 'dcm' ? `
                  <!-- Eccentric Dilation (huge cavity, thin wall) -->
                  <circle cx="160" cy="80" r="65" fill="none" stroke="#ef4444" stroke-width="8" opacity="0.8"/>
                  <circle cx="160" cy="80" r="57" fill="#ef4444" opacity="0.15"/>
                  <text x="160" y="75" font-size="11" font-weight="800" fill="#ef4444" text-anchor="middle">Eksantrik Dilatasyon</text>
                  <text x="160" y="92" font-size="9.5" fill="var(--text-sub)" text-anchor="middle">r ↑↑, h ↓ -> Devasa Duvar Stresi (σ)</text>
                ` : `
                  <!-- Concentric Hypertrophy (thick wall, small cavity) -->
                  <circle cx="160" cy="80" r="58" fill="none" stroke="#0284c7" stroke-width="22" opacity="0.8"/>
                  <circle cx="160" cy="80" r="36" fill="#0284c7" opacity="0.15"/>
                  <text x="160" y="75" font-size="10.5" font-weight="800" fill="#0284c7" text-anchor="middle">Konsantrik Hipertrofi</text>
                  <text x="160" y="92" font-size="9" fill="var(--text-sub)" text-anchor="middle">h ↑↑, r ↓ -> Duvar Stresi Korunur</text>
                `}
              </svg>
            </div>

            <div class="geometry-metrics-grid">
              <div class="geom-metric">
                <span class="m-lbl">${lang === 'en' ? 'Ejection Fraction (EF)' : 'Ejeksiyon Fraksiyonu (EF)'}</span>
                <strong class="${parseInt(pt.ef, 10) < 40 ? 'text-danger' : 'text-ok'}">${pt.ef}</strong>
              </div>
              <div class="geom-metric">
                <span class="m-lbl">${lang === 'en' ? 'Wall Thickness' : 'Duvar Kalınlığı'}</span>
                <strong>${pt.wallThickness}</strong>
              </div>
              <div class="geom-metric">
                <span class="m-lbl">${lang === 'en' ? 'End-Diastolic Vol (EDV)' : 'Diyastol Sonu Hacim (EDV)'}</span>
                <strong class="${pt.edv >= 200 ? 'text-danger' : ''}">${pt.edv} mL</strong>
              </div>
              <div class="geom-metric">
                <span class="m-lbl">${lang === 'en' ? 'Classic Gallop Sound' : 'Karakteristik Galop Sesi'}</span>
                <strong>${tr(pt.gallop)}</strong>
              </div>
            </div>
          </div>

          <!-- PANEL 3: NEUROHORMONAL VICIOUS CYCLE & 4 PILLARS -->
          <div class="hf-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '3. Neurohormonal Vicious Cycle & GDMT' : '3. Nörohormonal Kısır Döngü ve Kılavuz Tedavisi'}</h3>
              <span class="badge badge-accent">${lang === 'en' ? 'SNS & RAAS Vicious Circle' : 'SNS & RAAS Kısır Döngüsü'}</span>
            </div>

            <div class="vicious-cycle-box">
              <svg viewBox="0 0 320 160" class="cycle-svg">
                <!-- Center: Falling Cardiac Output -->
                <circle cx="160" cy="80" r="28" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
                <text x="160" y="76" font-size="9.5" font-weight="800" fill="#991b1b" text-anchor="middle">Debi (CO) ↓</text>
                <text x="160" y="89" font-size="8" fill="#991b1b" text-anchor="middle">Hipotansiyon</text>

                <!-- Top: SNS Activation -->
                <rect x="25" y="15" width="120" height="34" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
                <text x="85" y="30" font-size="9.5" font-weight="700" fill="#92400e" text-anchor="middle">Sempatik Sistem (SNS)</text>
                <text x="85" y="42" font-size="8" fill="#92400e" text-anchor="middle">Taşikardi, Vazokonstriksiyon</text>

                <!-- Bottom: RAAS Activation -->
                <rect x="175" y="15" width="120" height="34" rx="4" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
                <text x="235" y="30" font-size="9.5" font-weight="700" fill="#5b21b6" text-anchor="middle">Renin-Anjiyotensin (RAAS)</text>
                <text x="235" y="42" font-size="8" fill="#5b21b6" text-anchor="middle">Anjiyo II, Aldosteron</text>

                <!-- Connecting arrows -->
                <path d="M 140,60 Q 110,48 85,50" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"/>
                <path d="M 180,60 Q 210,48 235,50" fill="none" stroke="#7c3aed" stroke-width="2" marker-end="url(#arrow)"/>

                <!-- Remodeling output -->
                <rect x="50" y="115" width="220" height="35" rx="4" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
                <text x="160" y="130" font-size="9.5" font-weight="800" fill="#991b1b" text-anchor="middle">Miyosit Apoptozu, Fibrozis, Ventrikül Genişlemesi</text>
                <text x="160" y="142" font-size="8.5" fill="#991b1b" text-anchor="middle">Ard Yük Artışı -> Kalp Yetmezliği Daha da Ağırlaşır!</text>
              </svg>
            </div>

            <!-- GDMT 4 PILLARS -->
            <div class="gdmt-pillars-box">
              <span class="gdmt-title">${lang === 'en' ? 'GDMT 4 Pillars Breaking the Cycle:' : 'Döngüyü Kıran Kılavuz Kılavuzlu 4 Sacayağı Tedavi:'}</span>
              <div class="pillars-row">
                <span class="pillar-tag">1. ARNI / ACEi</span>
                <span class="pillar-tag">2. Beta-Bloker</span>
                <span class="pillar-tag">3. MRA</span>
                <span class="pillar-tag">4. SGLT2i</span>
              </div>
            </div>
          </div>
        </div>

        <!-- GALLOP MECHANISMS HIGHLIGHT -->
        <div class="patho-callout-card">
          <div class="callout-badge">
            <span class="icon">🩺</span>
            <strong>${lang === 'en' ? 'Auscultation Mechanics of S3 vs S4 Gallops' : 'S3 ve S4 Galop Seslerinin Oskültasyon Mekanizmaları'}</strong>
          </div>
          <div class="callout-columns">
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Third Heart Sound (S3) - Ventricular Gallop' : 'Üçüncü Kalp Sesi (S3) - Ventriküler Galop ("Slosh-ing-in")'}</h4>
              <p>${lang === 'en'
                ? 'Occurs in early diastole during rapid ventricular filling (just after S2). Blood rushing into an already overfilled, dilated, noncompliant ventricle creates sudden deceleration vibrations. Highly specific for elevated left ventricular filling pressures and HFrEF in adults over 40.'
                : 'Erken diyastolde, hızlı ventriküler doluş evresinde (S2den hemen sonra) oluşur. Aşırı dolmuş, dilate sol ventriküle hızla çarpan kan kütlesinin yarattığı ani yavaşlama titreşimidir. 40 yaş üstü erişkinde HFrEF ve yüksek sol ventrikül dolum basıncının en özgül fizik muayene bulgusudur.'}</p>
            </div>
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Fourth Heart Sound (S4) - Atrial Gallop' : 'Dördüncü Kalp Sesi (S4) - Atriyal Galop ("A-stiff-wall")'}</h4>
              <p>${lang === 'en'
                ? 'Occurs in late diastole during active atrial contraction (just before S1). The atrium contracts forcefully against a stiff, hypertrophied, noncompliant ventricle (HFpEF, long-standing hypertension, aortic stenosis, hypertrophic cardiomyopathy). Absent in atrial fibrillation!'
                : 'Geç diyastolde, atriyumun aktif kasıldığı evrede (S1den hemen önce) oluşur. Atriyumun sertleşmiş, kalınlaşmış, elastikiyeti azalmış dirençli bir ventriküle karşı zorla kan fırlatmasıyla doğar (HFpEF, kronik hipertansiyon, aort darlığı, HCM). Atriyal fibrilasyonda atriyal kasılma olmadığı için S4 duyulamaz!'}</p>
            </div>
            <div class="callout-col">
              <h4>${lang === 'en' ? 'Dynamic Auscultation in HCM vs Aortic Stenosis' : 'HCM ve Aort Darlığı Ayırıcı Tanısında Dinamik Manevralar'}</h4>
              <p>${lang === 'en'
                ? 'Standing/Valsalva reduces LV preload: In HCM, smaller cavity allows anterior mitral leaflet to contact the septum earlier (SAM ↑), dramatically worsening LVOT gradient and murmur loudness! In fixed AS, murmur decreases. Squatting increases preload and afterload, opening the LVOT and reducing HCM murmur.'
                : 'Valsalva veya ayağa kalkma ön yükü azaltır: HCMde küçülen ventrikül lümeni nedeniyle mitral ön yaprakçık septuma daha kolay yapışır (SAM ↑); dinamik LVOT obstrüksiyonu ve üfürüm şiddetlenir! Sabit aort darlığında ise kan akımı azaldığı için üfürüm hafifler. Çömelme ön yükü artırarak LVOTyi açar ve HCM üfürümünü söndürür.'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    root.querySelectorAll('[data-phenotype]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPhenotypeId = btn.dataset.phenotype;
        render();
      });
    });

    root.querySelectorAll('[data-preload]').forEach(btn => {
      btn.addEventListener('click', () => {
        preloadState = btn.dataset.preload;
        render();
      });
    });

    root.querySelectorAll('[data-maneuver]').forEach(btn => {
      btn.addEventListener('click', () => {
        hcmManeuver = btn.dataset.maneuver;
        render();
      });
    });
  }

  render();
  container.appendChild(root);

  return {
    destroy() {
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
