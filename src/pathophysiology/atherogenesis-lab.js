// Interactive Atherogenesis, Cumulative LDL Exposure, MASLD & Immuno-Thrombosis Canvas
// Sources: Boren et al. (2025), Ference & Braunwald (2024), Averna et al. (2026),
// Porsch & Binder (2024), Gelfand et al. (2025), Rashedi et al. (2026).

import { ATHEROMA_STAGES, ATHEROMA_MODIFIERS } from './pathophysiology-data.js';

export function createAtherogenesisLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-athero-lab';

  let currentStageIndex = 0;
  let currentModifierId = 'physiological';
  let selectedHotspot = 'endothelium';
  let motionEnabled = false;
  let apoBFlux = 130;       // LDL-C / ApoB proxy (mg/dL)
  let inflammation = 2.0;   // hsCRP (mg/L)
  let capThickness = 85;    // µm
  let patientAge = 55;      // Years for Ference cumulative exposure
  let statinStartAge = 0;   // 0 = untreated, or 35 / 50

  const HOTSPOTS = {
    liver: {
      title: { tr: 'Karaciğer ve MASLD (Averna 2026)', en: 'Liver & MASLD (Averna 2026)' },
      body: {
        tr: 'İnsülin direnci ve hepatik steatoz (MASLD), MTP ve de novo lipogenez yoluyla büyük VLDL1 salınımını artırır. CETP aktivitesiyle kolesterol esteri kaybedip trigliserid kazanan LDL partikülleri hepatik lipaz tarafından küçültülerek subendotelyal proteoglikanlara çok yüksek afinite gösteren küçük-yoğun LDL (sdLDL) haline gelir.',
        en: 'Insulin resistance and hepatic steatosis (MASLD) drive large VLDL1 overproduction. CETP-mediated lipid exchange and hepatic lipase remodeling generate highly atherogenic small dense LDL (sdLDL) and remnants.'
      }
    },
    endothelium: {
      title: { tr: 'Endotel Bariyeri ve Transsitoz (Borén 2025)', en: 'Endothelial Barrier & Transcytosis (Borén 2025)' },
      body: {
        tr: 'Arteriyel dallanma noktalarındaki düşük/osilatuar kayma gerilimi (shear stress) glikokaliksi inceltir ve eNOS kaynaklı NO üretimini düşürür. Çapı <70 nm olan ApoB partikülleri SR-BI ve ALK1 reseptör aracılı kaveoler transsitozla intimaya geçer.',
        en: 'Low oscillatory shear stress at arterial bifurcations thins the glycocalyx and reduces eNOS nitric oxide. ApoB lipoproteins (<70 nm) cross the endothelium via SR-BI and ALK1 caveolar transcytosis.'
      }
    },
    proteoglycan: {
      title: { tr: 'Proteoglikan Retansiyon Tuzağı (Williams & Tabas / Borén 2025)', en: 'Proteoglycan Retention Trap (Borén 2025)' },
      body: {
        tr: 'Aterogenezi başlatan temel olay: ApoB-100 üzerindeki pozitif yüklü (B-bölgesi) aminoasit dizileri, subendotelyal biglikan ve versikan proteoglikanlarının negatif yüklü kondroitin sülfat zincirlerine kilitlenir. Tutulan partiküller ROS ve sfingomiyelinaz ile agregasyona ve oksidasyona (oxLDL) uğrar.',
        en: 'The initiating step of atherogenesis: positively charged site-B residues on apoB-100 bind negatively charged chondroitin sulfate chains on intimal biglycan and versican, trapping particles for oxidation into oxLDL.'
      }
    },
    foamcell: {
      title: { tr: 'Makrofaj Köpük Hücresi ve NLRP3 (Porsch 2024)', en: 'Macrophage Foam Cell & NLRP3 (Porsch 2024)' },
      body: {
        tr: 'CD36 ve SR-A çöpçü reseptörleri LDL reseptörünün aksine hücre içi kolesterol artsa bile kapanmaz. Aşırı kolesterol esteri birikimi köpük hücresini oluşturur; serbest kolesterol kristalleri lizozomu yırtarak NLRP3 inflamazomunu ve IL-1β / IL-6 kaskadını tetikler.',
        en: 'Unlike LDLR, scavenger receptors CD36 and SR-A lack sterol downregulation. Unchecked oxLDL uptake forms foam cells; intracellular cholesterol crystals rupture lysosomes to activate NLRP3 and IL-1β/IL-6.'
      }
    },
    cap: {
      title: { tr: 'Fibröz Kılıf, TCFA (<65 µm) ve Tromboz (Rashedi 2026)', en: 'Fibrous Cap, TCFA (<65 µm) & Thrombosis (Rashedi 2026)' },
      body: {
        tr: 'VSMC tarafından sentezlenen kollajen kılıf plağı stabilize eder. Ancak makrofaj MMP-1/8/13 kollajenazları kılıfı <65 µm altına incelttiğinde (TCFA) omuz bölgesinden yırtılır. Antifosfolipid antikorları (anti-β2GPI) endotel ve trombositlerde Doku Faktörü (TF) ekspresyonunu artırarak oklüzif trombozu hızlandırır.',
        en: 'VSMC collagen stabilizes the cap, but macrophage MMP-1/8/13 degradation creates a Thin-Cap Fibroatheroma (<65 µm). Rupture exposes Tissue Factor, while antiphospholipid antibodies (anti-β2GPI) amplify thrombosis.'
      }
    }
  };

  root.innerHTML = `
    <div class="athero-story-head">
      <div><span class="athero-eyebrow" data-athero-i18n="storyEyebrow"></span>
      <h3 data-athero-i18n="storyTitle"></h3><p data-athero-i18n="storyHint"></p></div>
      <button type="button" class="preset-pill" data-athero-motion aria-pressed="false"></button>
    </div>
    <div class="athero-stepper" role="group" aria-label="Stages"></div>
    <div class="athero-story-nav">
      <button type="button" class="preset-pill" data-athero-prev></button>
      <p data-athero-story-status role="status"></p>
      <button type="button" class="preset-pill" data-athero-next></button>
    </div>
    <div class="preset-pill-group" style="margin-top:10px" data-athero-modifiers></div>
    <div class="pathophys-grid">
      <div class="pathophys-stage athero-stage">
        <svg viewBox="0 0 640 360" class="pathophys-svg athero-svg" role="group" aria-label="Atherogenesis Multi-Organ Cross Section"></svg>
        <div class="athero-hotspot-bar" data-athero-hotspots></div>
        <div class="clinical-desc-box" style="width:100%;margin-top:8px" data-athero-inspector></div>
        <div class="athero-cumulative-box" style="width:100%;margin-top:12px">
          <div class="lab-card-header" style="margin-bottom:6px">
            <div>
              <h4 style="margin:0;font-size:14px" data-athero-i18n="cumTitle"></h4>
              <p style="margin:2px 0 0;font-size:11.5px;color:var(--text-muted)" data-athero-i18n="cumSub"></p>
            </div>
            <div class="pathophys-segmented" data-athero-statin-bar></div>
          </div>
          <svg viewBox="0 0 580 185" class="pathophys-svg athero-cum-svg" role="img" aria-label="Cumulative LDL Exposure Curve"></svg>
        </div>
      </div>
      <div class="pathophys-controls athero-controls">
        <div class="athero-stage-info">
          <h3 data-athero-title></h3>
          <p data-athero-desc></p>
          <ul class="athero-feature-list" data-athero-features></ul>
        </div>

        <div class="clinical-desc-box" data-athero-mod-card></div>

        <div class="pathophys-sliders">
          <div class="card-head">
            <h3 data-athero-i18n="simTitle"></h3>
          </div>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblApoB"></strong> <small>(mg/dL)</small></span>
            <input type="range" data-athero-slider="apob" min="40" max="240" step="5" value="130">
            <span class="slider-val" data-athero-val="apob">130 mg/dL</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblAge"></strong> <small>(yıl / yrs)</small></span>
            <input type="range" data-athero-slider="age" min="20" max="80" step="1" value="55">
            <span class="slider-val" data-athero-val="age">55</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblCrp"></strong> <small>(hsCRP mg/L)</small></span>
            <input type="range" data-athero-slider="crp" min="0.5" max="10.0" step="0.5" value="2.0">
            <span class="slider-val" data-athero-val="crp">2.0 mg/L</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblCap"></strong> <small>(µm)</small></span>
            <input type="range" data-athero-slider="cap" min="25" max="150" step="5" value="85">
            <span class="slider-val" data-athero-val="cap">85 µm</span>
          </label>
        </div>

        <div class="athero-vulnerability-card">
          <div class="vulnerability-header">
            <span class="vulnerability-label" data-athero-i18n="lblVuln"></span>
            <strong class="vulnerability-badge" data-athero-vuln-badge></strong>
          </div>
          <div class="vulnerability-bar-track">
            <div class="vulnerability-bar-fill" data-athero-vuln-bar></div>
          </div>
          <p class="vulnerability-note" data-athero-vuln-note></p>
        </div>
      </div>
    </div>
  `;

  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => Array.from(root.querySelectorAll(sel));
  const t = obj => (getLang() === 'en' ? obj.en : obj.tr);

  $$('[data-athero-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const k = input.dataset.atheroSlider;
      const v = parseFloat(input.value);
      if (k === 'apob') apoBFlux = v;
      if (k === 'age') patientAge = v;
      if (k === 'crp') inflammation = v;
      if (k === 'cap') capThickness = v;
      render();
    });
  });

  const stageTargets = ['endothelium', 'proteoglycan', 'foamcell', 'cap', 'cap'];
  function selectStage(index) {
    currentStageIndex = Math.max(0, Math.min(ATHEROMA_STAGES.length - 1, index));
    selectedHotspot = stageTargets[currentStageIndex];
    if (currentStageIndex === 4 && capThickness > 60) {
      capThickness = 50;
      $('[data-athero-slider="cap"]').value = '50';
    }
    render();
  }
  $('[data-athero-prev]').addEventListener('click', () => selectStage(currentStageIndex - 1));
  $('[data-athero-next]').addEventListener('click', () => selectStage(currentStageIndex + 1));
  $('[data-athero-motion]').addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    render();
  });

  // Original schematic thumbnails: same tissue layers, progressively different contents.
  function stageThumbnail(index) {
    return `<svg viewBox="0 0 160 76" aria-hidden="true" class="athero-thumbnail">
      <rect x="2" y="2" width="156" height="72" rx="12" fill="#fff8ed"/>
      <path d="M 3 12 Q 80 2 157 12 L 157 35 L 3 35 Z" fill="#fee2e2"/>
      <path d="M 3 37 H 157" stroke="#e87979" stroke-width="4" stroke-dasharray="16 3"/>
      <path d="M 3 67 H 157" stroke="#fda4af" stroke-width="10"/>
      ${index < 2 ? [45, 80, 115].map((x, i) => `<circle cx="${x}" cy="${index ? 49 : 20 + i * 9}" r="5" fill="#eab308" stroke="#a16207"/>`).join('') : ''}
      ${index === 2 ? [52, 80, 108].map(x => `<circle cx="${x}" cy="50" r="12" fill="#fef08a" stroke="#d97706"/><circle cx="${x - 3}" cy="47" r="3" fill="#d97706"/><circle cx="${x + 4}" cy="54" r="3" fill="#d97706"/>`).join('') : ''}
      ${index >= 3 ? `<path d="M 30 61 Q 80 12 130 61 Z" fill="#eab308"/><path d="M 30 60 Q 80 10 130 60" fill="none" stroke="${index === 4 ? '#dc2626' : '#0d9488'}" stroke-width="${index === 4 ? 2 : 5}" ${index === 4 ? 'stroke-dasharray="8 5"' : ''}/>` : ''}
      ${index === 4 ? '<ellipse cx="82" cy="27" rx="22" ry="12" fill="#b91c1c"/>' : ''}
    </svg>`;
  }

  function getActiveModifier() {
    return ATHEROMA_MODIFIERS.find(m => m.id === currentModifierId) || ATHEROMA_MODIFIERS[0];
  }

  function computeVulnerability() {
    const mod = getActiveModifier();
    const apoBScore = Math.min(100, Math.max(0, ((apoBFlux * mod.apoBMult - 50) / 170) * 100));
    const crpScore = Math.min(100, Math.max(0, ((inflammation * mod.inflamMult - 0.5) / 9.5) * 100));
    const capScore = Math.min(100, Math.max(0, ((150 - capThickness) / 125) * 100));
    const stageWeight = (currentStageIndex + 1) / 5;
    const raw = (apoBScore * 0.25 + crpScore * 0.30 + capScore * 0.45) * (0.55 + 0.45 * stageWeight) * Math.sqrt(mod.thrombMult);
    return Math.min(100, Math.round(raw));
  }

  function computeCumulativeExposure(age, baseLdl, statinAge) {
    let totalMgYears = 0;
    for (let a = 1; a <= age; a++) {
      const annualLdl = (statinAge > 0 && a >= statinAge) ? baseLdl * 0.45 : baseLdl;
      totalMgYears += annualLdl;
    }
    return Math.round(totalMgYears);
  }

  function render() {
    const en = getLang() === 'en';
    const mod = getActiveModifier();

    const shortNames = en
      ? ['Entry', 'Retention', 'Foam cells', 'Fibrous cap', 'Rupture']
      : ['Geçiş', 'Tutulum', 'Köpük hücreleri', 'Fibröz kılıf', 'Rüptür'];
    root.classList.toggle('athero-motion-on', motionEnabled);
    $('[data-athero-motion]').textContent = motionEnabled
      ? (en ? 'Ⅱ Pause flow' : 'Ⅱ Akışı duraklat')
      : (en ? '▷ Animate flow' : '▷ Akışı canlandır');
    $('[data-athero-motion]').setAttribute('aria-pressed', String(motionEnabled));
    $('[data-athero-prev]').textContent = en ? '← Previous' : '← Önceki';
    $('[data-athero-next]').textContent = en ? 'Next →' : 'Sonraki →';
    $('[data-athero-prev]').disabled = currentStageIndex === 0;
    $('[data-athero-next]').disabled = currentStageIndex === 4;
    $('[data-athero-story-status]').textContent = `${currentStageIndex + 1} / 5 · ${shortNames[currentStageIndex]}`;
    $('.athero-stepper').setAttribute('aria-label', en ? 'Plaque evolution stages' : 'Plak gelişim evreleri');
    $('.athero-svg').setAttribute('aria-label', en ? 'Interactive artery wall schematic' : 'Etkileşimli damar duvarı şeması');

    // 1. Stepper
    const stepper = $('.athero-stepper');
    stepper.innerHTML = ATHEROMA_STAGES.map((st, idx) => `
      <button type="button" class="stage-btn ${idx === currentStageIndex ? 'active' : ''}" data-stage-idx="${idx}" aria-pressed="${idx === currentStageIndex}">
        ${stageThumbnail(idx)}
        <span class="stage-btn-num">${en ? 'Stage' : 'Evre'} ${st.stage}</span>
        <span class="stage-btn-label">${shortNames[idx]}</span>
      </button>
    `).join('');
    $$('[data-stage-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectStage(parseInt(btn.dataset.stageIdx, 10));
        $(`[data-stage-idx="${currentStageIndex}"]`).focus({ preventScroll: true });
      });
    });

    // 2. Systemic Modifier Pills
    const modBar = $('[data-athero-modifiers]');
    modBar.innerHTML = `
      <span class="preset-label">${en ? 'Systemic Phenotype:' : 'Sistemik Fenotip:'}</span>
      ${ATHEROMA_MODIFIERS.map(m => `
        <button type="button" class="preset-pill ${m.id === currentModifierId ? 'active' : ''}" data-mod-id="${m.id}">
          ${t(m.name)}
        </button>
      `).join('')}
    `;
    $$('[data-mod-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentModifierId = btn.dataset.modId;
        render();
      });
    });

    // 3. Hotspot selector pills
    const hotspotKeys = [
      { id: 'liver', label: en ? '1. Liver (MASLD)' : '1. Karaciğer (MASLD)' },
      { id: 'endothelium', label: en ? '2. Endothelium' : '2. Endotel Bariyeri' },
      { id: 'proteoglycan', label: en ? '3. Proteoglycan Trap' : '3. Proteoglikan Tuzağı' },
      { id: 'foamcell', label: en ? '4. Foam Cell & NLRP3' : '4. Köpük Hücresi & NLRP3' },
      { id: 'cap', label: en ? '5. Fibrous Cap & TF' : '5. Fibröz Kılıf & Trombüs' }
    ];
    const hsBar = $('[data-athero-hotspots]');
    hsBar.innerHTML = `
      <div class="preset-pill-group" style="margin-top:8px;padding-bottom:0;border-bottom:0">
        <span class="preset-label">${en ? 'Inspect Structure:' : 'Yapıyı İncele:'}</span>
        ${hotspotKeys.map(h => `
          <button type="button" class="preset-pill ${selectedHotspot === h.id ? 'active' : ''}" data-hs-id="${h.id}">
            ${h.label}
          </button>
        `).join('')}
      </div>
    `;
    $$('[data-hs-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedHotspot = btn.dataset.hsId;
        render();
      });
    });

    const hs = HOTSPOTS[selectedHotspot] || HOTSPOTS.proteoglycan;
    $('[data-athero-inspector]').innerHTML = `
      <h4>${t(hs.title)}</h4>
      <p>${t(hs.body)}</p>
    `;

    // 4. Statin intervention toggle bar for Ference curve
    const statinBar = $('[data-athero-statin-bar]');
    const statinOpts = [
      { age: 0, label: en ? 'Untreated' : 'Tedavisiz' },
      { age: 35, label: en ? 'Rx at Age 35 (-55%)' : '35 Yaşta Tedavi (-%55)' },
      { age: 50, label: en ? 'Rx at Age 50 (-55%)' : '50 Yaşta Tedavi (-%55)' }
    ];
    statinBar.innerHTML = statinOpts.map(o => `
      <button type="button" class="seg-btn ${statinStartAge === o.age ? 'active' : ''}" data-statin-age="${o.age}">
        ${o.label}
      </button>
    `).join('');
    $$('[data-statin-age]').forEach(btn => {
      btn.addEventListener('click', () => {
        statinStartAge = parseInt(btn.dataset.statinAge, 10);
        render();
      });
    });

    // 5. Stage Details & Mod Card
    const st = ATHEROMA_STAGES[currentStageIndex];
    $('[data-athero-title]').textContent = t(st.title);
    $('[data-athero-desc]').textContent = t(st.desc);
    $('[data-athero-features]').innerHTML = st.features.map(f => `<li>${t(f)}</li>`).join('');

    $('[data-athero-mod-card]').innerHTML = `
      <h4>${t(mod.name)} <small style="font-weight:500;color:var(--text-sub)">(${mod.source})</small></h4>
      <p>${t(mod.summary)}</p>
    `;

    // 6. Labels & Sliders
    const I18N = {
      storyEyebrow: en ? 'INSIDE THE ARTERY WALL' : 'DAMAR DUVARININ İÇİNDE',
      storyTitle: en ? 'Follow the life of a plaque' : 'Bir plağın gelişimini izle',
      storyHint: en ? 'Select a stage, then explore the structures in the artery. Schematic stages, not a fixed timeline.' : 'Bir evre seç, ardından damar üzerindeki yapıları keşfet. Evreler şematiktir; sabit bir zaman çizelgesi değildir.',
      simTitle: en ? 'Plaque Microenvironment & Exposure Parameters' : 'Plak Mikroçevresi ve Maruziyet Parametreleri',
      lblApoB: en ? 'Plasma LDL-C / ApoB Load' : 'Plazma LDL-C / ApoB Yükü',
      lblAge: en ? 'Patient Age (Cumulative Exposure)' : 'Hasta Yaşı (Kümülatif Maruziyet)',
      lblCrp: en ? 'Systemic Inflammation (hsCRP)' : 'Sistemik İnflamasyon (hsCRP)',
      lblCap: en ? 'Fibrous Cap Thickness' : 'Fibröz Kılıf Kalınlığı',
      lblVuln: en ? 'Plaque Vulnerability Index (PVI)' : 'Plak Kırılganlık İndeksi (PVI)',
      cumTitle: en ? 'Ference & Braunwald (2024) Cumulative LDL Exposure Curve' : 'Ference ve Braunwald (2024) Kümülatif LDL Maruziyet Eğrisi',
      cumSub: en
        ? 'Plaque burden accumulates as (LDL-C × Years). Crossing 5,000 mg/dL·years (~130 mmol·years) steeply increases MI risk.'
        : 'Plak yükü (LDL-C × Yıl) olarak birikir; 5.000 mg/dL·yıl (~130 mmol·yıl) eşiği aşılınca MI riski logaritmik artar.'
    };
    $$('[data-athero-i18n]').forEach(el => {
      const k = el.dataset.atheroI18n;
      if (I18N[k]) el.textContent = I18N[k];
    });

    $('[data-athero-val="apob"]').textContent = `${apoBFlux} mg/dL`;
    $('[data-athero-val="age"]').textContent = `${patientAge} ${en ? 'yrs' : 'yıl'}`;
    $('[data-athero-val="crp"]').textContent = `${inflammation.toFixed(1)} mg/L`;
    $('[data-athero-val="cap"]').textContent = `${capThickness} µm ${capThickness < 65 ? (en ? '(TCFA!)' : '(TCFA!)') : ''}`;

    // 7. Vulnerability Readout
    const vuln = computeVulnerability();
    const badge = $('[data-athero-vuln-badge]');
    const bar = $('[data-athero-vuln-bar]');
    const note = $('[data-athero-vuln-note]');

    bar.style.width = `${vuln}%`;
    if (vuln >= 70 || capThickness < 65) {
      badge.textContent = `${vuln}/100 · ${en ? 'High Risk (TCFA)' : 'Yüksek Risk (TCFA)'}`;
      badge.className = 'vulnerability-badge vuln-high';
      note.textContent = en
        ? 'Critical thin-cap fibroatheroma (<65 µm) with intense MMP / inflammatory activity; high risk of acute plaque rupture and thrombosis.'
        : 'Kritik ince kılıflı fibroaterom (<65 µm) ve yüksek MMP / inflamatuar aktivite; akut plak rüptürü ve tromboz riski çok yüksek.';
    } else if (vuln >= 40) {
      badge.textContent = `${vuln}/100 · ${en ? 'Moderate Risk' : 'Orta Risk'}`;
      badge.className = 'vulnerability-badge vuln-mod';
      note.textContent = en
        ? 'Growing lipid-rich necrotic core; aggressive apoB lowering (Statin + Ezetimibe / PCSK9i) stabilizes the cap.'
        : 'Büyüyen nekrotik çekirdek; yoğun apoB düşürücü tedavi (Statin + Ezetimib / PCSK9i) fibröz kılıfı kalınlaştırarak stabilize eder.';
    } else {
      badge.textContent = `${vuln}/100 · ${en ? 'Stable Lesion' : 'Stabil Lezyon'}`;
      badge.className = 'vulnerability-badge vuln-low';
      note.textContent = en
        ? 'Thick VSMC collagen cap protects the lumen from thrombogenic necrotic core exposure.'
        : 'Kalın VSMC kollajen fibröz kılıf, trombojenik çekirdeğin lümenle temasını güvenle engelliyor.';
    }

    drawAtheroSvg(currentStageIndex, en, mod);
    drawCumulativeSvg(en, mod);
  }

  function drawAtheroSvg(stageIdx, en, mod) {
    const svg = $('.athero-svg');
    const isMasld = mod.id === 'masld';
    const isAuto = mod.id === 'autoimmune';
    const isAps = mod.id === 'aps';

    // Top-left mini Liver organ box showing hepatic VLDL output into circulation
    const liverFill = isMasld ? '#d97706' : '#9a3412';
    const steatosisDots = isMasld
      ? `<circle cx="42" cy="36" r="5" fill="#fde047"/><circle cx="58" cy="32" r="4.5" fill="#fde047"/><circle cx="50" cy="46" r="5" fill="#fde047"/><circle cx="68" cy="44" r="4" fill="#fde047"/>`
      : `<circle cx="48" cy="38" r="2.5" fill="#fed7aa" opacity="0.5"/>`;

    // ApoB particle count in lumen
    const numParticles = Math.min(18, Math.max(5, Math.round((apoBFlux * mod.apoBMult) / 14)));
    const lumenParticles = [];
    for (let i = 0; i < numParticles; i++) {
      const px = 145 + ((i * 31) % 465);
      const py = 30 + ((i * 19) % 52);
      const isSdLdl = isMasld && i % 2 === 0;
      const isLpa = i % 5 === 0;
      const r = isSdLdl ? 4.8 : 6.2;
      const fill = isLpa ? '#a855f7' : (isSdLdl ? '#ea580c' : '#eab308');
      const stroke = isLpa ? '#6b21a8' : '#92400e';
      lumenParticles.push(`
        <g class="athero-flow-particle" style="--flow-delay: ${-i * 0.3}s">
          <circle cx="${px}" cy="${py}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
          ${isLpa ? `<path d="M ${px + r} ${py - 3} Q ${px + r + 5} ${py}, ${px + r} ${py + 3}" fill="none" stroke="#7e22ce" stroke-width="1.5"/>` : ''}
        </g>
      `);
    }

    // Antiphospholipid antibodies or autoimmune cytokines in lumen
    let immuneLumen = '';
    if (isAps) {
      immuneLumen = `
        <g stroke="#be123c" stroke-width="1.8" fill="none">
          <path d="M 250 78 L 250 86 M 250 82 L 245 76 M 250 82 L 255 76"/>
          <path d="M 340 76 L 340 84 M 340 80 L 335 74 M 340 80 L 345 74"/>
          <path d="M 430 78 L 430 86 M 430 82 L 425 76 M 430 82 L 435 76"/>
        </g>
        <text x="340" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="#9f1239">Anti-β2GPI / aPL → TLR4</text>
      `;
    } else if (isAuto) {
      immuneLumen = `
        <g fill="#db2777">
          <circle cx="235" cy="76" r="3"/><circle cx="295" cy="78" r="3"/><circle cx="385" cy="75" r="3"/><circle cx="455" cy="77" r="3"/>
        </g>
        <text x="345" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="#9d174d">IL-17 · TNF · IFN-γ · NETs</text>
      `;
    }

    // Subendothelial Proteoglycan web (always visible in intima so learner sees retention mechanism)
    const proteoglycanWeb = `
      <g stroke="#d97706" stroke-width="1.2" opacity="0.55" fill="none">
        <path d="M 80 145 Q 110 135, 140 148 T 200 145 T 260 150"/>
        <path d="M 95 162 Q 130 152, 165 164 T 235 160"/>
        <line x1="110" y1="138" x2="110" y2="165"/><line x1="155" y1="140" x2="155" y2="166"/><line x1="195" y1="138" x2="195" y2="165"/>
      </g>
    `;

    // Stage-dependent intimal progression
    let intimaContent = '';
    if (stageIdx === 0) {
      intimaContent = `
        <g stroke="#d97706" stroke-width="2" stroke-dasharray="3 2" fill="none">
          <path d="M 190 68 L 190 135"/>
          <path d="M 310 68 L 310 138"/>
          <path d="M 430 68 L 430 135"/>
        </g>
        <circle cx="190" cy="142" r="6" fill="#eab308" stroke="#92400e" stroke-width="1.5"/>
        <circle cx="310" cy="146" r="6" fill="#eab308" stroke="#92400e" stroke-width="1.5"/>
        <circle cx="430" cy="142" r="6" fill="#a855f7" stroke="#6b21a8" stroke-width="1.5"/>
        <text x="320" y="185" text-anchor="middle" font-size="12" font-weight="700" fill="#92400e">
          ${en ? 'SR-BI / ALK1 Transcytosis of ApoB Particles into Intima' : 'ApoB Partiküllerinin SR-BI / ALK1 ile İntimaya Transsitozu'}
        </text>
      `;
    } else if (stageIdx === 1) {
      intimaContent = `
        <g>
          <circle cx="120" cy="150" r="7" fill="#d97706" stroke="#78350f" stroke-width="2"/>
          <circle cx="155" cy="155" r="7" fill="#d97706" stroke="#78350f" stroke-width="2"/>
          <circle cx="195" cy="148" r="7" fill="#d97706" stroke="#78350f" stroke-width="2"/>
          <circle cx="290" cy="154" r="7.5" fill="#ea580c" stroke="#7c2d12" stroke-width="2"/>
          <circle cx="340" cy="148" r="7.5" fill="#ea580c" stroke="#7c2d12" stroke-width="2"/>
          <circle cx="395" cy="156" r="7.5" fill="#ea580c" stroke="#7c2d12" stroke-width="2"/>
          <text x="340" y="185" text-anchor="middle" font-size="12" font-weight="800" fill="#9a3412">
            ${en ? 'Proteoglycan-Bound ApoB → ROS Oxidation (oxLDL & OxPL)' : 'Proteoglikana Bağlı ApoB → ROS Oksidasyonu (oxLDL ve OxPL)'}
          </text>
        </g>
      `;
    } else if (stageIdx === 2) {
      intimaContent = `
        <g>
          <!-- Monocyte diapedesis -->
          <circle cx="235" cy="84" r="8" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
          <path d="M 235 94 L 250 132" stroke="#2563eb" stroke-width="2" stroke-dasharray="3 2"/>
          <!-- Foam cells with lipid droplets -->
          ${[260, 325, 390, 450].map((cx, i) => `
            <g transform="translate(${cx}, ${165 + (i % 2) * 14})">
              <circle cx="0" cy="0" r="20" fill="#f59e0b" fill-opacity="0.28" stroke="#b45309" stroke-width="2"/>
              <circle cx="-6" cy="-5" r="4.5" fill="#eab308"/><circle cx="6" cy="-4" r="4" fill="#eab308"/>
              <circle cx="-4" cy="6" r="4" fill="#eab308"/><circle cx="6" cy="5" r="4.5" fill="#eab308"/>
              <!-- Cholesterol crystal needles -->
              <line x1="-8" y1="9" x2="9" y2="-8" stroke="#fef08a" stroke-width="2"/>
            </g>
          `).join('')}
          <text x="355" y="218" text-anchor="middle" font-size="12" font-weight="800" fill="#7c2d12">
            ${en ? 'CD36/SR-A Foam Cells + Cholesterol Crystals → NLRP3 → IL-1β / IL-6' : 'CD36/SR-A Köpük Hücreleri + Kolesterol Kristalleri → NLRP3 → IL-1β / IL-6'}
          </text>
        </g>
      `;
    } else if (stageIdx === 3) {
      const capStroke = Math.max(3, Math.round(capThickness / 14));
      intimaContent = `
        <g>
          <!-- Necrotic Core -->
          <path d="M 190 225 Q 345 115, 500 225 Z" fill="#eab308" fill-opacity="0.48" stroke="#b45309" stroke-width="2"/>
          <!-- Cholesterol crystals inside necrotic core -->
          <g stroke="#fef9c3" stroke-width="2.2">
            <line x1="295" y1="195" x2="325" y2="180"/><line x1="340" y1="185" x2="375" y2="200"/><line x1="360" y1="208" x2="395" y2="192"/>
          </g>
          <!-- Protective Fibrous Cap -->
          <path d="M 175 222 Q 345 ${110 - capStroke}, 515 222" fill="none" stroke="#0d9488" stroke-width="${capStroke}" stroke-linecap="round"/>
          <text x="345" y="132" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0f766e">
            ${en ? `VSMC Collagen Fibrous Cap (${capThickness} µm)` : `VSMC Kollajen Fibröz Kılıf (${capThickness} µm)`}
          </text>
          <text x="345" y="215" text-anchor="middle" font-size="12" font-weight="800" fill="#713f12">
            ${en ? 'Acellular Lipid-Rich Necrotic Core (Defective Efferocytosis)' : 'Hücresiz Lipid-Zengin Nekrotik Çekirdek (Kusurlu Efferositoz)'}
          </text>
        </g>
      `;
    } else {
      intimaContent = `
        <g>
          <!-- Large Necrotic Core -->
          <path d="M 175 225 Q 345 102, 515 225 Z" fill="#ca8a04" fill-opacity="0.55" stroke="#854d0e" stroke-width="2"/>
          <!-- Thin ruptured cap with gap at shoulder/apex -->
          <path d="M 165 222 Q 255 140, 325 135" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5 3"/>
          <path d="M 370 135 Q 440 140, 525 222" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5 3"/>
          <!-- Occlusive Platelet + Fibrin Thrombus in Lumen -->
          <ellipse cx="348" cy="96" rx="58" ry="26" fill="#b91c1c" fill-opacity="0.9" stroke="#450a0a" stroke-width="2.5"/>
          <g stroke="#fecaca" stroke-width="1.4">
            <line x1="305" y1="90" x2="390" y2="104"/><line x1="310" y1="106" x2="385" y2="86"/><line x1="330" y1="78" x2="365" y2="114"/>
          </g>
          <text x="348" y="100" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">
            ${en ? 'THROMBUS (TF + Factor VIIa)' : 'TROMBÜS (TF + Faktör VIIa)'}
          </text>
          <text x="348" y="195" text-anchor="middle" font-size="12" font-weight="800" fill="#7f1d1d">
            ${en ? 'MMP-1/8/13 Cap Rupture (<65 µm TCFA)' : 'MMP-1/8/13 Kılıf Yırtılması (<65 µm TCFA)'}
          </text>
        </g>
      `;
    }

    svg.innerHTML = `
      <defs>
        <linearGradient id="atheroLumenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fee2e2"/>
          <stop offset="100%" stop-color="#fecaca"/>
        </linearGradient>
      </defs>

      <!-- Arterial Lumen -->
      <rect x="10" y="10" width="620" height="84" fill="url(#atheroLumenGrad)" rx="8"/>
      <text x="615" y="28" text-anchor="end" font-size="11" font-weight="700" fill="#991b1b">
        ${en ? 'Arterial Lumen (Bloodstream)' : 'Arter Lümeni (Kan Akımı)'}
      </text>

      <!-- Hepatic Steatosis / Liver Origin Widget (Top Left) -->
      <g class="athero-clickable" data-svg-hs="liver" style="cursor:pointer">
        <rect x="18" y="16" width="112" height="62" rx="8" fill="#fff7ed" stroke="${selectedHotspot === 'liver' ? '#0d9488' : '#fdba74'}" stroke-width="2"/>
        <path d="M 30 48 C 28 28, 56 22, 82 30 C 92 34, 88 52, 65 54 C 48 56, 32 54, 30 48 Z" fill="${liverFill}"/>
        ${steatosisDots}
        <text x="74" y="69" text-anchor="middle" font-size="9.5" font-weight="800" fill="#7c2d12">
          ${isMasld ? (en ? 'MASLD Liver: ↑VLDL1' : 'MASLD Karaciğer: ↑VLDL1') : (en ? 'Liver: ApoB Secretion' : 'Karaciğer: ApoB Salınımı')}
        </text>
      </g>

      <!-- Circulating Lipoprotein Particles -->
      ${lumenParticles.join('')}
      ${immuneLumen}

      <!-- Endothelial Monolayer -->
      <g class="athero-clickable" data-svg-hs="endothelium" style="cursor:pointer">
        ${[15, 85, 155, 225, 295, 365, 435, 505, 575].map((x, idx) => {
          const damaged = stageIdx >= 0 && idx >= 2 && idx <= 6;
          return `<rect x="${x}" y="96" width="52" height="13" rx="5" fill="${damaged ? '#f87171' : '#fca5a5'}" stroke="${damaged ? '#b91c1c' : '#dc2626'}" stroke-width="1.5"/>`;
        }).join('')}
      </g>

      <!-- Subendothelial Tunica Intima -->
      <rect x="10" y="112" width="620" height="122" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5" rx="4"/>
      <text x="24" y="128" font-size="10.5" font-weight="800" fill="#92400e">
        ${en ? 'Tunica Intima (Proteoglycan Matrix)' : 'Tunica İntima (Proteoglikan Matriksi)'}
      </text>

      <g class="athero-clickable" data-svg-hs="proteoglycan" style="cursor:pointer">
        ${proteoglycanWeb}
      </g>

      <g class="athero-clickable" data-svg-hs="${stageTargets[stageIdx]}" style="cursor:pointer">
        ${intimaContent}
      </g>

      <!-- Internal Elastic Lamina -->
      <line x1="10" y1="236" x2="630" y2="236" stroke="#7c2d12" stroke-width="2.5" stroke-dasharray="10 4"/>

      <!-- Tunica Media (VSMCs) -->
      <rect x="10" y="240" width="620" height="58" fill="#fecdd3" stroke="#be123c" stroke-width="1.5" rx="6"/>
      <text x="24" y="274" font-size="11" font-weight="700" fill="#881337">
        ${en ? 'Tunica Media (Vascular Smooth Muscle Cells - VSMCs)' : 'Tunica Media (Vasküler Düz Kas Hücreleri - VSMC)'}
      </text>

      <!-- Particle Legend Bar at bottom of SVG -->
      <g transform="translate(18, 316)" font-size="10" font-weight="700" fill="#334155">
        <circle cx="8" cy="8" r="5.5" fill="#eab308" stroke="#92400e"/><text x="18" y="12">LDL (ApoB-100)</text>
        <circle cx="115" cy="8" r="4.5" fill="#ea580c" stroke="#7c2d12"/><text x="124" y="12">${en ? 'sdLDL / Remnant' : 'sdLDL / Kalıntı'}</text>
        <circle cx="230" cy="8" r="5.5" fill="#a855f7" stroke="#6b21a8"/><text x="240" y="12">Lp(a) + OxPL</text>
        <circle cx="335" cy="8" r="6" fill="#d97706" stroke="#78350f"/><text x="346" y="12">oxLDL</text>
        <circle cx="405" cy="8" r="6.5" fill="#f59e0b" fill-opacity="0.4" stroke="#b45309"/><text x="416" y="12">${en ? 'Foam Cell' : 'Köpük Hücresi'}</text>
        <rect x="498" y="3" width="16" height="9" rx="2" fill="#0d9488"/><text x="518" y="12">${en ? 'Fibrous Cap' : 'Fibröz Kılıf'}</text>
      </g>
    `;

    svg.querySelectorAll('[data-svg-hs]').forEach(g => {
      const id = g.dataset.svgHs;
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', t(HOTSPOTS[id].title));
      g.setAttribute('aria-pressed', String(selectedHotspot === id));
      const activate = () => {
        selectedHotspot = id;
        render();
        svg.querySelector(`[data-svg-hs="${id}"]`)?.focus({ preventScroll: true });
      };
      g.addEventListener('click', activate);
      g.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function drawCumulativeSvg(en, mod) {
    const svg = $('.athero-cum-svg');
    const w = 580, h = 185;
    const padL = 52, padR = 24, padT = 18, padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxAge = 80, minAge = 20;
    const maxExp = 12000; // mg/dL * years
    const toX = a => padL + ((a - minAge) / (maxAge - minAge)) * plotW;
    const toY = exp => padT + ((maxExp - Math.min(maxExp, exp)) / maxExp) * plotH;

    const effLdl = Math.round(apoBFlux * mod.apoBMult);
    const ptsUntreated = [];
    const ptsTreated = [];
    for (let a = minAge; a <= maxAge; a += 2) {
      ptsUntreated.push(`${toX(a).toFixed(1)},${toY(computeCumulativeExposure(a, effLdl, 0)).toFixed(1)}`);
      if (statinStartAge > 0) {
        ptsTreated.push(`${toX(a).toFixed(1)},${toY(computeCumulativeExposure(a, effLdl, statinStartAge)).toFixed(1)}`);
      }
    }

    const currentExp = computeCumulativeExposure(patientAge, effLdl, statinStartAge);
    const thresholdY = toY(5000);
    const ptX = toX(patientAge);
    const ptY = toY(currentExp);

    svg.innerHTML = `
      <!-- Threshold zone above 5000 mg/dL-years -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${thresholdY - padT}" fill="rgba(239, 68, 68, 0.08)"/>
      <line x1="${padL}" y1="${thresholdY}" x2="${w - padR}" y2="${thresholdY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="5 3"/>
      <text x="${padL + 6}" y="${thresholdY - 5}" font-size="9.5" font-weight="700" fill="#dc2626">
        ${en ? 'Clinical MI Threshold: 5,000 mg/dL·yrs (~130 mmol·yrs)' : 'Klinik MI Eşiği: 5.000 mg/dL·yıl (~130 mmol·yıl)'}
      </text>

      <!-- Axes -->
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#64748b" stroke-width="1.5"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#64748b" stroke-width="1.5"/>

      ${[20, 30, 40, 50, 60, 70, 80].map(a => `
        <text x="${toX(a)}" y="${h - padB + 14}" text-anchor="middle" font-size="9.5" fill="#64748b">${a}</text>
      `).join('')}
      ${[0, 5000, 10000].map(val => `
        <text x="${padL - 6}" y="${toY(val) + 3}" text-anchor="end" font-size="9" fill="#64748b">${val / 1000}k</text>
      `).join('')}

      <!-- Untreated trajectory -->
      <polyline points="${ptsUntreated.join(' ')}" fill="none" stroke="${statinStartAge > 0 ? '#94a3b8' : '#d97706'}" stroke-width="2.4" stroke-dasharray="${statinStartAge > 0 ? '4 3' : 'none'}"/>

      <!-- Treated trajectory if active -->
      ${statinStartAge > 0 ? `<polyline points="${ptsTreated.join(' ')}" fill="none" stroke="#0d9488" stroke-width="2.8"/>` : ''}

      <!-- Patient current coordinate -->
      <circle cx="${ptX}" cy="${ptY}" r="5.5" fill="${currentExp >= 5000 ? '#dc2626' : '#0d9488'}" stroke="#fff" stroke-width="1.8"/>
      <text x="${Math.min(w - 85, Math.max(padL + 60, ptX))}" y="${Math.max(padT + 14, ptY - 9)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0f172a">
        ${currentExp.toLocaleString()} mg/dL·${en ? 'yr' : 'yıl'}
      </text>

      <text x="${padL + plotW / 2}" y="${h - 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">
        ${en ? 'Age (Years) → Cumulative Arterial Plaque Burden' : 'Yaş (Yıl) → Kümülatif Arteriyel Plak Yükü'}
      </text>
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
