// Forrester Matrix & Acute Heart Failure Lab: 2x2 hemodynamic classification
import { FORRESTER_PROFILES } from './pathophysiology-data.js';

export function createForresterLab(opts = {}) {
  const container = opts.container || opts.mount;
  let lang = typeof opts.getLang === 'function' ? opts.getLang() : (opts.lang || 'tr');
  let currentCI = 2.8;
  let currentPCWP = 12;
  let selectedPreset = 'profile-1';

  function determineQuadrant(ci, pcwp) {
    if (ci >= 2.2 && pcwp <= 18) return 'I';
    if (ci >= 2.2 && pcwp > 18) return 'II';
    if (ci < 2.2 && pcwp <= 18) return 'III';
    return 'IV';
  }

  function getQuadrantInfo(quadrant) {
    const isTr = lang === 'tr';
    switch (quadrant) {
      case 'I':
        return {
          title: isTr ? 'Profil I: Sıcak ve Kuru (Normal / Kompanse)' : 'Profile I: Warm & Dry (Normal / Compensated)',
          status: isTr ? 'Yeterli Perfüzyon · Konjesyon Yok' : 'Adequate Perfusion · No Congestion',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          mortality: '1 - 3%',
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
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          mortality: '8 - 11%',
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
          color: '#06b6d4',
          bg: 'rgba(6, 182, 212, 0.1)',
          mortality: '18 - 22%',
          clinical: isTr
            ? 'Ekstremiteler soğuk ve soluk, nabızlar filiform, mental konfüzyon riski, oligüri ve prerenal azotemi. Akciğer sesleri temizdir (dolum basıncı yetersizdir).'
            : 'Cool, pale extremities, thready pulses, altered sensorium, oliguria, and prerenal azotemia. Lungs are clear (depleted ventricular filling volume).',
          management: isTr
            ? 'Aşırı diürezden kaçınma. Dikkatli sıvı yükleme (250-500 mL kristalloid ile sol ventrikül dolum basıncı 14-16 mmHg olana dek test). Düzelmezse inotropik destek.'
            : 'Stop diuresis. Cautious fluid bolus (250-500 mL crystalloid challenge aiming for PCWP 14-16 mmHg). If hypoperfusion persists, consider inotropes.'
        };
      case 'IV':
      default:
        return {
          title: isTr ? 'Profil IV: Soğuk ve Islak (Kardiyojenik Şok)' : 'Profile IV: Cold & Wet (Cardiogenic Shock)',
          status: isTr ? 'Ağır Doku Hipoperfüzyonu + Ağır Pulmoner Konjesyon' : 'Severe Hypoperfusion + Severe Congestion',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          mortality: '40 - 55%',
          clinical: isTr
            ? 'En ağır klinik tablo: Hipotansiyon (SKB < 90 mmHg), soğuk terli ekstremiteler, laktik asidoz (>2 mmol/L), bilateral yaygın raller, anüri ve koma meyli.'
            : 'Critically ill: Refractory hypotension (SBP < 90 mmHg), cold clammy extremities, lactic acidosis, diffuse wet crackles, anuria, and organ failure.',
          management: isTr
            ? 'Acil inotrop (dobutamin, milrinon), vazopressör (ortalama arter basıncını >65 mmHg tutmak için noradrenalin), erken perkütan mekanik dolaşım desteği (Impella / ECMO / IABP).'
            : 'Emergency inotropes (dobutamine/milrinone), vasopressors (norepinephrine to maintain MAP > 65), and early mechanical circulatory support (Impella, ECMO).'
        };
    }
  }

  function renderPlot() {
    const isTr = lang === 'tr';
    const width = 540;
    const height = 380;
    const padding = { top: 35, right: 30, bottom: 45, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Scales: PCWP (4 to 36 mmHg), CI (1.0 to 4.0 L/min/m2)
    const pcwpMin = 4;
    const pcwpMax = 36;
    const ciMin = 1.0;
    const ciMax = 4.0;

    const scaleX = (pcwp) => padding.left + ((pcwp - pcwpMin) / (pcwpMax - pcwpMin)) * plotW;
    const scaleY = (ci) => padding.top + ((ciMax - ci) / (ciMax - ciMin)) * plotH;

    const cutoffX = scaleX(18);
    const cutoffY = scaleY(2.2);

    const pointX = scaleX(Math.max(pcwpMin, Math.min(pcwpMax, currentPCWP)));
    const pointY = scaleY(Math.max(ciMin, Math.min(ciMax, currentCI)));

    return `
      <svg viewBox="0 0 ${width} ${height}" class="forrester-svg" id="forrester-matrix-svg">
        <defs>
          <filter id="glow-forrester" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Quadrant Backgrounds -->
        <!-- Quadrant I: Warm & Dry (Top-Left) -->
        <rect x="${padding.left}" y="${padding.top}" width="${cutoffX - padding.left}" height="${cutoffY - padding.top}"
          fill="rgba(16, 185, 129, 0.08)" stroke="none" />
        <text x="${(padding.left + cutoffX) / 2}" y="${padding.top + 24}"
          text-anchor="middle" class="quadrant-watermark" fill="#10b981">
          I: ${isTr ? 'SICAK & KURU' : 'WARM & DRY'}
        </text>

        <!-- Quadrant II: Warm & Wet (Top-Right) -->
        <rect x="${cutoffX}" y="${padding.top}" width="${width - padding.right - cutoffX}" height="${cutoffY - padding.top}"
          fill="rgba(245, 158, 11, 0.08)" stroke="none" />
        <text x="${(cutoffX + width - padding.right) / 2}" y="${padding.top + 24}"
          text-anchor="middle" class="quadrant-watermark" fill="#f59e0b">
          II: ${isTr ? 'SICAK & ISLAK' : 'WARM & WET'}
        </text>

        <!-- Quadrant III: Cold & Dry (Bottom-Left) -->
        <rect x="${padding.left}" y="${cutoffY}" width="${cutoffX - padding.left}" height="${height - padding.bottom - cutoffY}"
          fill="rgba(6, 182, 212, 0.08)" stroke="none" />
        <text x="${(padding.left + cutoffX) / 2}" y="${cutoffY + 28}"
          text-anchor="middle" class="quadrant-watermark" fill="#06b6d4">
          III: ${isTr ? 'SOĞUK & KURU' : 'COLD & DRY'}
        </text>

        <!-- Quadrant IV: Cold & Wet (Bottom-Right) -->
        <rect x="${cutoffX}" y="${cutoffY}" width="${width - padding.right - cutoffX}" height="${height - padding.bottom - cutoffY}"
          fill="rgba(239, 68, 68, 0.09)" stroke="none" />
        <text x="${(cutoffX + width - padding.right) / 2}" y="${cutoffY + 28}"
          text-anchor="middle" class="quadrant-watermark" fill="#ef4444">
          IV: ${isTr ? 'SOĞUK & ISLAK (ŞOK)' : 'COLD & WET (SHOCK)'}
        </text>

        <!-- Threshold Reference Lines -->
        <line x1="${cutoffX}" y1="${padding.top}" x2="${cutoffX}" y2="${height - padding.bottom}"
          stroke="var(--accent, #3b82f6)" stroke-width="2" stroke-dasharray="4 3" />
        <line x1="${padding.left}" y1="${cutoffY}" x2="${width - padding.right}" y2="${cutoffY}"
          stroke="var(--accent, #3b82f6)" stroke-width="2" stroke-dasharray="4 3" />

        <!-- Threshold Labels -->
        <text x="${cutoffX + 4}" y="${padding.top + 12}" fill="var(--accent, #3b82f6)" font-size="10" font-weight="600">
          PCWP = 18 mmHg
        </text>
        <text x="${width - padding.right - 4}" y="${cutoffY - 6}" text-anchor="end" fill="var(--accent, #3b82f6)" font-size="10" font-weight="600">
          CI = 2.2 L/min/m²
        </text>

        <!-- Outer Boundary -->
        <rect x="${padding.left}" y="${padding.top}" width="${plotW}" height="${plotH}"
          fill="none" stroke="var(--border, #cbd5e1)" stroke-width="1.5" />

        <!-- Grid Lines & Ticks -->
        ${[8, 12, 16, 20, 24, 28, 32].map(p => `
          <line x1="${scaleX(p)}" y1="${height - padding.bottom}" x2="${scaleX(p)}" y2="${height - padding.bottom + 5}" stroke="var(--border, #94a3b8)" />
          <text x="${scaleX(p)}" y="${height - padding.bottom + 16}" text-anchor="middle" font-size="10" fill="var(--text-sub, #64748b)">${p}</text>
        `).join('')}

        ${[1.5, 2.0, 2.5, 3.0, 3.5].map(c => `
          <line x1="${padding.left - 5}" y1="${scaleY(c)}" x2="${padding.left}" y2="${scaleY(c)}" stroke="var(--border, #94a3b8)" />
          <text x="${padding.left - 8}" y="${scaleY(c) + 3.5}" text-anchor="end" font-size="10" fill="var(--text-sub, #64748b)">${c.toFixed(1)}</text>
        `).join('')}

        <!-- Axis Titles -->
        <text x="${padding.left + plotW / 2}" y="${height - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
          ${isTr ? 'Pulmoner Kapiller Uç Basıncı (PCWP, mmHg) → [Konjesyon Ekseni]' : 'Pulmonary Capillary Wedge Pressure (PCWP, mmHg) → [Congestion Axis]'}
        </text>
        <text transform="rotate(-90)" x="${-(padding.top + plotH / 2)}" y="16" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
          ${isTr ? 'Kardiyak İndeks (CI, L/min/m²) → [Perfüzyon Ekseni]' : 'Cardiac Index (CI, L/min/m²) → [Perfusion Axis]'}
        </text>

        <!-- Active Patient Coordinate -->
        <circle cx="${pointX}" cy="${pointY}" r="9" fill="#2563eb" filter="url(#glow-forrester)" />
        <circle cx="${pointX}" cy="${pointY}" r="4" fill="#ffffff" />
        <text x="${pointX}" y="${pointY - 14}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-main, #0f172a)">
          (${currentPCWP.toFixed(1)} mmHg, ${currentCI.toFixed(2)} L/m²)
        </text>
      </svg>
    `;
  }

  function render() {
    const isTr = lang === 'tr';
    const quadrant = determineQuadrant(currentCI, currentPCWP);
    const qInfo = getQuadrantInfo(quadrant);

    // Derived hemodynamics
    // Assuming MAP ~ 85 mmHg and CVP ~ 8 mmHg
    const estMAP = quadrant === 'IV' ? 62 : (quadrant === 'III' ? 70 : 88);
    const estCVP = quadrant === 'IV' ? 16 : (quadrant === 'II' ? 14 : (quadrant === 'III' ? 4 : 6));
    const svri = Math.round(((estMAP - estCVP) / currentCI) * 80);

    container.innerHTML = `
      <div class="forrester-layout">
        <!-- Controls & Plot Section -->
        <div class="forrester-main-card">
          <div class="lab-card-header">
            <div>
              <h2 class="lab-title">${isTr ? 'Forrester 2×2 Hemodinamik Sınıflandırma Matrisi' : 'Forrester 2×2 Hemodynamic Classification Matrix'}</h2>
              <p class="lab-desc">${isTr ? 'Klinik perfüzyon (Kardiyak İndeks) ve pulmoner konjesyon (PCWP) kesişiminde hasta fenotipi ve tedavi algoritması.' : 'Intersection of systemic perfusion (CI) and pulmonary congestion (PCWP) determining heart failure phenotypes.'}</p>
            </div>
            <div class="quadrant-badge" style="background: ${qInfo.bg}; color: ${qInfo.color}; border: 1px solid ${qInfo.color}40;">
              ${isTr ? 'Kuadran' : 'Quadrant'} ${quadrant}
            </div>
          </div>

          <!-- Presets -->
          <div class="preset-pill-group">
            <span class="preset-label">${isTr ? 'Klinik Profiller:' : 'Clinical Profiles:'}</span>
            ${FORRESTER_PROFILES.map(p => `
              <button type="button" class="preset-pill ${selectedPreset === p.id ? 'active' : ''}" data-profile-id="${p.id}">
                ${p.name[lang]}
              </button>
            `).join('')}
          </div>

          <div class="forrester-stage-container">
            ${renderPlot()}
          </div>

          <!-- Sliders -->
          <div class="controls-grid" style="grid-template-columns: 1fr 1fr; margin-top: 1rem;">
            <div class="control-box">
              <div class="control-header">
                <label for="forrester-ci-slider"><strong>${isTr ? 'Kardiyak İndeks (CI)' : 'Cardiac Index (CI)'}</strong></label>
                <span class="control-val">${currentCI.toFixed(2)} L/min/m²</span>
              </div>
              <input type="range" id="forrester-ci-slider" min="1.0" max="3.8" step="0.05" value="${currentCI}" class="range-slider" />
              <div class="slider-caption">${isTr ? 'Normal eşik: ≥ 2.2 L/min/m² (Sıcak Perfüzyon)' : 'Normal cutoff: ≥ 2.2 L/min/m² (Warm Perfusion)'}</div>
            </div>

            <div class="control-box">
              <div class="control-header">
                <label for="forrester-pcwp-slider"><strong>${isTr ? 'Uç Basıncı (PCWP)' : 'Wedge Pressure (PCWP)'}</strong></label>
                <span class="control-val">${currentPCWP.toFixed(1)} mmHg</span>
              </div>
              <input type="range" id="forrester-pcwp-slider" min="6" max="34" step="0.5" value="${currentPCWP}" class="range-slider" />
              <div class="slider-caption">${isTr ? 'Normal eşik: ≤ 18 mmHg (Kuru / Akciğer Temiz)' : 'Normal cutoff: ≤ 18 mmHg (Dry / Lungs Clear)'}</div>
            </div>
          </div>
        </div>

        <!-- Right Diagnostic Column -->
        <div class="forrester-side-panel">
          <div class="clinical-status-card" style="border-left: 4px solid ${qInfo.color};">
            <div class="status-top">
              <span class="status-name" style="color: ${qInfo.color}; font-weight: 700;">${qInfo.title}</span>
              <span class="mortality-tag">${isTr ? 'Mortalite Riski' : 'In-Hospital Mortality'}: ${qInfo.mortality}</span>
            </div>
            <div class="status-state">${qInfo.status}</div>
          </div>

          <!-- Hemodynamic Metrics -->
          <div class="metrics-card">
            <h3 class="metrics-title">${isTr ? 'Tahmini Hemodinamik Parametreler' : 'Estimated Hemodynamic Readout'}</h3>
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="metric-lbl">MAP</span>
                <span class="metric-num">${estMAP} <small>mmHg</small></span>
              </div>
              <div class="metric-item">
                <span class="metric-lbl">CVP (Sağ Atriyum)</span>
                <span class="metric-num">${estCVP} <small>mmHg</small></span>
              </div>
              <div class="metric-item">
                <span class="metric-lbl">SVRI (Direnç)</span>
                <span class="metric-num">${svri} <small>dyn·s/cm⁵·m²</small></span>
              </div>
              <div class="metric-item">
                <span class="metric-lbl">Kardiyak Güç (CPO)</span>
                <span class="metric-num">${((estMAP * currentCI * 1.8) / 451).toFixed(2)} <small>W</small></span>
              </div>
            </div>
          </div>

          <!-- Clinical Picture -->
          <div class="clinical-desc-box">
            <h4>${isTr ? 'Klinik Görünüm & Fizik Muayene' : 'Clinical Presentation & Exam'}</h4>
            <p>${qInfo.clinical}</p>
          </div>

          <!-- Guideline Management -->
          <div class="clinical-desc-box management-box">
            <h4>${isTr ? 'ESC / AHA Tedavi Önerileri' : 'ESC / AHA Management Guideline'}</h4>
            <p>${qInfo.management}</p>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const ciSlider = container.querySelector('#forrester-ci-slider');
    const pcwpSlider = container.querySelector('#forrester-pcwp-slider');

    if (ciSlider) {
      ciSlider.addEventListener('input', (e) => {
        currentCI = parseFloat(e.target.value);
        selectedPreset = null;
        render();
      });
    }

    if (pcwpSlider) {
      pcwpSlider.addEventListener('input', (e) => {
        currentPCWP = parseFloat(e.target.value);
        selectedPreset = null;
        render();
      });
    }

    // Presets
    container.querySelectorAll('[data-profile-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.profileId;
        const prof = FORRESTER_PROFILES.find(p => p.id === pid);
        if (prof) {
          selectedPreset = pid;
          currentCI = prof.ci;
          currentPCWP = prof.pcwp;
          render();
        }
      });
    });

    // SVG click to place point
    const svg = container.querySelector('#forrester-matrix-svg');
    if (svg) {
      svg.addEventListener('click', (e) => {
        const rect = svg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // ViewBox is 540 x 380, calculate relative svg coordinate
        const svgX = (clickX / rect.width) * 540;
        const svgY = (clickY / rect.height) * 380;

        const padding = { top: 35, right: 30, bottom: 45, left: 55 };
        const plotW = 540 - padding.left - padding.right;
        const plotH = 380 - padding.top - padding.bottom;

        if (svgX >= padding.left && svgX <= 540 - padding.right &&
            svgY >= padding.top && svgY <= 380 - padding.bottom) {
          const pcwp = 4 + ((svgX - padding.left) / plotW) * (36 - 4);
          const ci = 4.0 - ((svgY - padding.top) / plotH) * (4.0 - 1.0);
          currentPCWP = Math.round(pcwp * 10) / 10;
          currentCI = Math.round(ci * 100) / 100;
          selectedPreset = null;
          render();
        }
      });
    }
  }

  render();

  return {
    updateLanguage: (newLang) => {
      lang = newLang;
      render();
    }
  };
}
