// Interactive Atherogenesis & Plaque Biology Simulator (5-stage cascade).
import { ATHEROMA_STAGES } from './pathophysiology-data.js';

export function createAtherogenesisLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-athero-lab';

  let currentStageIndex = 0;
  let apoBFlux = 120;       // mg/dL
  let inflammation = 2.5;   // hsCRP mg/L
  let capThickness = 80;    // µm

  root.innerHTML = `
    <div class="athero-stepper" role="group" aria-label="Stages"></div>
    <div class="pathophys-grid">
      <div class="pathophys-stage athero-stage">
        <svg viewBox="0 0 540 320" class="pathophys-svg athero-svg" role="img" aria-label="Arterial Plaque Cross Section"></svg>
        <div class="athero-stage-info">
          <h4 data-ath-title></h4>
          <p data-ath-desc></p>
          <ul class="athero-feature-list" data-ath-features></ul>
        </div>
      </div>
      <div class="pathophys-controls athero-controls">
        <div class="card-head">
          <h3 data-ath-vcard-title></h3>
          <p data-ath-vcard-intro></p>
        </div>
        <div class="pathophys-sliders">
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-ath-lbl-apob></strong> <small>(mg/dL)</small></span>
            <input type="range" data-ath-slider="apob" min="60" max="180" step="10" value="120">
            <span class="slider-val" data-ath-val="apob">120 mg/dL</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-ath-lbl-crp></strong> <small>(hsCRP mg/L)</small></span>
            <input type="range" data-ath-slider="crp" min="0.5" max="8.0" step="0.5" value="2.5">
            <span class="slider-val" data-ath-val="crp">2.5 mg/L</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-ath-lbl-cap></strong> <small>(µm)</small></span>
            <input type="range" data-ath-slider="cap" min="25" max="140" step="5" value="80">
            <span class="slider-val" data-ath-val="cap">80 µm</span>
          </label>
        </div>
        <div class="athero-vulnerability-card">
          <div class="vulnerability-header">
            <span class="vulnerability-label" data-ath-vul-label></span>
            <strong class="vulnerability-badge" data-ath-vul-badge>--</strong>
          </div>
          <div class="vulnerability-bar-track">
            <div class="vulnerability-bar-fill" data-ath-vul-bar></div>
          </div>
          <p class="vulnerability-note" data-ath-vul-note></p>
        </div>
      </div>
    </div>
  `;
  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  const stepper = $('.athero-stepper');
  ATHEROMA_STAGES.forEach((stage, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'athero-step-btn';
    btn.dataset.stageIdx = idx;
    btn.addEventListener('click', () => {
      currentStageIndex = idx;
      // Auto adjust cap thickness based on stage
      if (idx === 0) capThickness = 120;
      else if (idx === 1) capThickness = 110;
      else if (idx === 2) capThickness = 95;
      else if (idx === 3) capThickness = 75;
      else if (idx === 4) capThickness = 35; // thin cap <65 um
      $('[data-ath-slider="cap"]').value = capThickness;
      render();
    });
    stepper.append(btn);
  });

  $('[data-ath-slider="apob"]').addEventListener('input', e => {
    apoBFlux = Number(e.target.value);
    $('[data-ath-val="apob"]').textContent = `${apoBFlux} mg/dL`;
    render();
  });
  $('[data-ath-slider="crp"]').addEventListener('input', e => {
    inflammation = Number(e.target.value);
    $('[data-ath-val="crp"]').textContent = `${inflammation.toFixed(1)} mg/L`;
    render();
  });
  $('[data-ath-slider="cap"]').addEventListener('input', e => {
    capThickness = Number(e.target.value);
    $('[data-ath-val="cap"]').textContent = `${capThickness} µm`;
    if (capThickness < 50 && currentStageIndex < 4) currentStageIndex = 4;
    render();
  });

  function render() {
    const en = getLang() === 'en';
    const t = o => o[en ? 'en' : 'tr'];

    // Update step buttons
    $$('.athero-step-btn').forEach((btn, idx) => {
      const stage = ATHEROMA_STAGES[idx];
      btn.textContent = `${en ? 'Stage' : 'Evre'} ${stage.stage}`;
      btn.setAttribute('aria-pressed', String(idx === currentStageIndex));
    });

    // Stage text
    const curStage = ATHEROMA_STAGES[currentStageIndex];
    $('[data-ath-title]').textContent = t(curStage.title);
    $('[data-ath-desc]').textContent = t(curStage.desc);

    const featList = $('[data-ath-features]');
    featList.innerHTML = curStage.features.map(f => `<li>${t(f)}</li>`).join('');

    // Vulnerability card translations
    $('[data-ath-vcard-title]').textContent = en ? 'Plaque Vulnerability Engine' : 'Plak Kararlılığı ve Rüptür Skoru';
    $('[data-ath-vcard-intro]').textContent = en
      ? 'ApoB particle influx, local macrophage collagenolysis (MMP activity) and cap attenuation decide rupture risk.'
      : 'ApoB partikül yükü, lokal kollajen eritici enzimler (MMP) ve kılıf incelmesi plak rüptür riskini belirler.';
    $('[data-ath-lbl-apob]').textContent = en ? 'ApoB Particle Flux' : 'ApoB Partikül Akışı';
    $('[data-ath-lbl-crp]').textContent = en ? 'Systemic Inflammation' : 'İnflamasyon (hsCRP)';
    $('[data-ath-lbl-cap]').textContent = en ? 'Fibrous Cap Thickness' : 'Fibröz Kılıf Kalınlığı';
    $('[data-ath-vul-label]').textContent = en ? 'Rupture Vulnerability' : 'Plak Kırılganlığı / Rüptür Eğilimi';

    // Vulnerability computation
    // High apoB, high CRP, thin cap (<65 um) -> critical risk!
    const capScore = Math.max(0, Math.min(100, (120 - capThickness) * 1.1));
    const crpScore = Math.min(100, inflammation * 12);
    const apobScore = Math.min(100, (apoBFlux - 60) * 0.8);
    const vulnIndex = Math.min(100, Math.round(0.55 * capScore + 0.25 * crpScore + 0.20 * apobScore));

    const bar = $('[data-ath-vul-bar]');
    bar.style.width = `${vulnIndex}%`;

    let badgeText = en ? 'Stable Plaque' : 'Kararlı Plak';
    let badgeClass = 'badge-stable';
    let noteText = en
      ? 'Thick collagenous fibrous cap (>65 µm) protects against hemodynamic rupture.'
      : 'Kalın kollajen kılıf (>65 µm) hemodinamik kayma gerilimine karşı plağı korur.';

    if (vulnIndex > 45 && vulnIndex <= 75) {
      badgeText = en ? 'Vulnerable Plaque' : 'Kırılgan / Yüksek Riskli';
      badgeClass = 'badge-warning';
      noteText = en
        ? 'Expanding necrotic core and progressive collagenolysis. Monitor closely.'
        : 'Genişleyen nekrotik çekirdek ve ilerleyici kılıf incelmesi. Koroner olay riski yüksek.';
    } else if (vulnIndex > 75) {
      badgeText = en ? 'Critical Rupture Risk (TCFA)' : 'Kritik İnce Kılıf (TCFA / Rüptür)';
      badgeClass = 'badge-danger';
      noteText = en
        ? 'Thin-cap fibroatheroma (<65 µm). Imminent risk of fibrous cap rupture and acute coronary thrombosis!'
        : 'Kritik kılıf incelmesi (<65 µm). Doku faktörü açığa çıkışı ve lümen tıkayıcı tromboz riski!';
    }

    const badge = $('[data-ath-vul-badge]');
    badge.textContent = badgeText;
    badge.className = `vulnerability-badge ${badgeClass}`;
    $('[data-ath-vul-note]').textContent = noteText;

    drawAtheroSvg(currentStageIndex, capThickness, vulnIndex);
  }

  function drawAtheroSvg(stageIdx, capThick, vulnIdx) {
    const svg = $('.athero-svg');
    const w = 540, h = 320;

    // SVG elements based on stage (0: Endothelial, 1: Retention, 2: Foam cell, 3: Core, 4: Rupture)
    let extraElements = '';

    if (stageIdx === 0) {
      // ApoB particles approaching and penetrating between endothelial cells
      extraElements = `
        <g fill="#c92a2a" stroke="#fff" stroke-width="1.2">
          <circle cx="80" cy="70" r="5"/><circle cx="160" cy="85" r="5"/><circle cx="280" cy="75" r="5"/>
          <circle cx="390" cy="80" r="5"/><circle cx="470" cy="72" r="5"/>
          <!-- Penetrating particle -->
          <circle cx="210" cy="116" r="5.5" fill="#d92626"/>
        </g>
        <path d="M210 90V130" stroke="#c92a2a" stroke-width="2" stroke-dasharray="3 3"/>
      `;
    } else if (stageIdx === 1) {
      // Retention: apoB bound to matrix, oxidized (oxLDL in amber/fuchsia)
      extraElements = `
        <g fill="#e67700" stroke="#fff" stroke-width="1.2">
          <circle cx="180" cy="150" r="5"/><circle cx="220" cy="165" r="5.5"/><circle cx="260" cy="148" r="5"/>
          <circle cx="300" cy="170" r="5.5"/><circle cx="340" cy="155" r="5"/>
        </g>
        <text x="260" y="195" font-size="11" font-weight="700" fill="#a05206" text-anchor="middle">oxLDL + Proteoglycan Matrix</text>
      `;
    } else if (stageIdx === 2) {
      // Foam cells clusters (yellow lipid-laden macrophages)
      extraElements = `
        <g fill="#fab005" stroke="#b08800" stroke-width="1.5">
          <circle cx="190" cy="160" r="10"/><circle cx="188" cy="158" r="3" fill="#8c6d00"/>
          <circle cx="220" cy="175" r="12"/><circle cx="218" cy="173" r="3.5" fill="#8c6d00"/>
          <circle cx="260" cy="165" r="11"/><circle cx="258" cy="163" r="3" fill="#8c6d00"/>
          <circle cx="300" cy="178" r="12"/><circle cx="298" cy="176" r="3.5" fill="#8c6d00"/>
          <circle cx="330" cy="160" r="10"/><circle cx="328" cy="158" r="3" fill="#8c6d00"/>
        </g>
        <text x="260" y="210" font-size="11" font-weight="700" fill="#8c6d00" text-anchor="middle">Foam Cells / Fatty Streak</text>
      `;
    } else if (stageIdx === 3) {
      // Fibrous cap over large necrotic core
      extraElements = `
        <!-- Necrotic Core -->
        <path d="M140 220Q260 140 380 220Z" fill="#e9c46a" stroke="#c49b28" stroke-width="2"/>
        <text x="260" y="190" font-size="12" font-weight="800" fill="#805d00" text-anchor="middle">Necrotic Core</text>
        <!-- Fibrous Cap (VSMC Collagen) -->
        <path d="M120 135Q260 100 400 135L380 148Q260 120 140 148Z" fill="#38a169" opacity="0.85"/>
      `;
    } else if (stageIdx === 4) {
      // Plaque Rupture + Acute Thrombus!
      extraElements = `
        <!-- Necrotic Core -->
        <path d="M140 220Q260 140 380 220Z" fill="#e9c46a" stroke="#c49b28" stroke-width="2"/>
        <!-- Ruptured Cap with gap at center -->
        <path d="M120 135Q190 115 240 125" stroke="#38a169" stroke-width="6" stroke-linecap="round"/>
        <path d="M280 125Q330 115 400 135" stroke="#38a169" stroke-width="6" stroke-linecap="round"/>
        <!-- Thrombotic Clot in lumen! -->
        <g fill="#9b2226" stroke="#590d22" stroke-width="1.8">
          <ellipse cx="260" cy="115" rx="34" ry="22"/>
          <circle cx="245" cy="108" r="6" fill="#ae2012"/>
          <circle cx="275" cy="112" r="7" fill="#ae2012"/>
          <circle cx="260" cy="122" r="6" fill="#ae2012"/>
        </g>
        <!-- Fibrin mesh lines -->
        <path d="M235 110L285 120M240 122L280 108" stroke="#f8f9fa" stroke-width="1.4" opacity="0.8"/>
        <text x="260" y="80" font-size="12" font-weight="800" fill="#9b2226" text-anchor="middle">Acute Luminal Thrombus!</text>
      `;
    }

    svg.innerHTML = `
      <!-- Upper blood lumen -->
      <rect x="10" y="10" width="520" height="100" fill="#edf4f8" stroke="#8c3b45" stroke-width="1.8" rx="6"/>
      <text x="30" y="45" font-size="12" font-weight="700" fill="#355066">Plasma Bloodstream (Lumen)</text>
      
      <!-- Endothelial layer (Cobblestone cells) -->
      <g fill="#f2aba4" stroke="#8f342f" stroke-width="1.2">
        <rect x="20" y="102" width="55" height="12" rx="4"/>
        <rect x="85" y="102" width="55" height="12" rx="4"/>
        <rect x="150" y="102" width="50" height="12" rx="4"/>
        <rect x="210" y="102" width="50" height="12" rx="4"/>
        <rect x="270" y="102" width="50" height="12" rx="4"/>
        <rect x="330" y="102" width="55" height="12" rx="4"/>
        <rect x="395" y="102" width="55" height="12" rx="4"/>
        <rect x="460" y="102" width="55" height="12" rx="4"/>
      </g>
      
      <!-- Subendothelial Intima -->
      <rect x="10" y="118" width="520" height="130" fill="#fef8eb" stroke="#d4aa5e" stroke-width="1.5" rx="4"/>
      <text x="30" y="235" font-size="12" font-weight="700" fill="#916c28">Tunica Intima (Proteoglycans)</text>

      <!-- Media & Adventitia base -->
      <rect x="10" y="250" width="520" height="60" fill="#d88b86" stroke="#8c3b45" stroke-width="1.8" rx="6"/>
      <text x="30" y="285" font-size="12" font-weight="700" fill="#4d181e">Tunica Media (Smooth Muscle Cells)</text>

      <!-- Dynamic Stage Elements -->
      ${extraElements}
    `;
  }

  render();

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      render();
    }
  };
}
