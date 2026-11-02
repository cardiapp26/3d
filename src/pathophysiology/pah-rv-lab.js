// Pulmonary Arterial Hypertension (PAH) 4-Pathway Signaling & RV-LV Interdependence Lab
// Source: Ghofrani, Gomberg-Maitland, Zhao & Grimminger (Nature Reviews Cardiology 2025).

export function createPahRvLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-pah-lab';

  let stageId = 'moderate-pah'; // 'normal' | 'early-pah' | 'moderate-pah' | 'plexiform-rv-fail'
  let pvrWood = 6.5;            // Pulmonary Vascular Resistance (1.2 to 14 Wood units)
  let rvContractility = 1.1;    // RV Ees (0.4 to 1.8 mmHg/mL)
  let selectedPathway = 'bmpr2-activin';
  let tripleTherapyOn = false;
  let sotaterceptOn = false;

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let paused = Boolean(reducedMotion);
  let speed = 1;
  let cyclePhase = 0; // 0..100 (% of cardiac cycle)
  let rafId = null;
  let lastTs = 0;

  // Particles for arteriole lumen blood flow, molecular signaling ligands, and RV/LV chamber circulation
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    zone: i < 8 ? 'lumen' : i < 14 ? 'ligand' : i < 19 ? 'rv' : 'lv',
    progress: (i / 24) % 1,
    angle: (i * 1.35) % (Math.PI * 2)
  }));

  const STAGES = [
    {
      id: 'normal',
      name: { tr: 'Normal Pulmoner Dolaşım', en: 'Normal Pulmonary Circulation' },
      pvr: 1.5, rvEes: 1.2, triple: false, sota: false,
      desc: {
        tr: 'Düşük dirençli, yüksek kompliyanslı pulmoner yatak (mPAP <20 mmHg, PVR <2 WU). BMPR2-Smad1/5/8 antiproliferatif sinyali aktiftir; LV dairesel kesitini korur.',
        en: 'Low-resistance, high-compliance pulmonary vascular bed (mPAP <20 mmHg, PVR <2 WU). Intact antiproliferative BMPR2-Smad1/5/8 signaling; circular LV geometry.'
      }
    },
    {
      id: 'early-pah',
      name: { tr: 'Erken PAH (Vazokonstriksiyon + Mediyal Hipertrofi)', en: 'Early PAH (Vasoconstriction + Medial Hypertrophy)' },
      pvr: 4.2, rvEes: 1.45, triple: false, sota: false,
      desc: {
        tr: 'Endotelyal NO ve prostasiklin azalırken Endotelin-1 artar. Pulmoner arter düz kas hücreleri (PASMC) hipertrofiye uğrar; RV adaptif konsantrik hipertrofi ile eşleşmeyi (Ees/Ea) korur.',
        en: 'Endothelial NO and prostacyclin decline while Endothelin-1 rises. PASMC medial hypertrophy increases PVR; adaptive RV hypertrophy preserves RV-PA coupling.'
      }
    },
    {
      id: 'moderate-pah',
      name: { tr: 'İlerleyici PAH (BMPR2 Kaybı + İntimal Proliferasyon)', en: 'Progressive PAH (BMPR2 Loss + Intimal Proliferation)' },
      pvr: 7.5, rvEes: 1.1, triple: false, sota: false,
      desc: {
        tr: 'BMPR2 sinyal kaybı ve aşırı Activin A / GDF8/11 -> ActRIIA -> Smad2/3 aktivasyonu apoptoza dirençli miyofibroblast ve endotel proliferasyonu yapar. Septum sistol/diyastolde sola düzleşir (D-şekilli LV).',
        en: 'Loss of BMPR2 and unopposed Activin A / GDF -> ActRIIA -> Smad2/3 signaling drive apoptosis-resistant intimal proliferation. Interventricular septum flattens into a D-shaped LV.'
      }
    },
    {
      id: 'plexiform-rv-fail',
      name: { tr: 'İleri Pleksiform PAH ve Sağ Kalp Yetersizliği', en: 'Severe Plexiform PAH & RV Uncoupling' },
      pvr: 11.8, rvEes: 0.65, triple: false, sota: false,
      desc: {
        tr: 'Lümende tıkayıcı pleksiform lezyonlar oluşur. Sağ ventrikül ard-yükünü karşılayamaz (Ees/Ea <0.8 uncoupling), masif RV dilatasyonu ve triküspit yetersizliği LV dolumunu boğarak düşük debi şokuna götürür.',
        en: 'Occlusive plexiform lesions obliterate arterioles. RV-PA uncoupling (Ees/Ea <0.8), severe RV dilation, and septal shift compress the LV cavity, causing low-output failure.'
      }
    }
  ];

  const PATHWAYS = {
    'bmpr2-activin': {
      title: { tr: '1. BMPR2 / Activin-Inhibin Dengesi (Sotatercept Hedefi)', en: '1. BMPR2 / Activin-Inhibin Balance (Sotatercept Target)' },
      drug: { tr: 'Sotatercept (ActRIIA-Fc Tuzak Proteini)', en: 'Sotatercept (ActRIIA-Fc Fusion Trap)' },
      body: {
        tr: 'Sağlıklı damarda BMPR2 -> Smad1/5/8 antiproliferatif fren görevi görür. PAH’ta BMPR2 azalır; karşıt Activin A, GDF8 ve GDF11 ligandları ActRIIA reseptörü üzerinden Smad2/3ü ateşleyerek damar duvarını kalınlaştırır. Sotatercept fazla Activin ligandlarını tuzaklayarak proliferasyonu tersine çevirir (STELLAR çalışması, Ghofrani 2025).',
        en: 'Healthy BMPR2 -> Smad1/5/8 restrains cell growth. In PAH, BMPR2 loss allows Activin A and GDF8/11 to hyperactivate ActRIIA -> Smad2/3 proliferation. Sotatercept traps excess activins to restore antiproliferative balance (STELLAR trial, Ghofrani 2025).'
      }
    },
    endothelin: {
      title: { tr: '2. Endotelin-1 (ETA / ETB) Yolağı', en: '2. Endothelin-1 (ETA / ETB) Pathway' },
      drug: { tr: 'ERA: Bosentan · Macitentan · Ambrisentan', en: 'ERAs: Bosentan · Macitentan · Ambrisentan' },
      body: {
        tr: 'Endotel hücrelerinden aşırı salınan Endotelin-1 (ET-1), düz kas hücrelerindeki ETA ve ETB reseptörlerine bağlanarak PLC-IP3-Ca2+ aracılı şiddetli vazokonstriksiyon ve mitojenik hipertrofi yaratır.',
        en: 'Endothelial Endothelin-1 (ET-1) engages PASMC ETA and ETB receptors, triggering PLC-IP3-Ca2+ vasoconstriction and mitogenic vascular smooth muscle hypertrophy.'
      }
    },
    'no-cgmp': {
      title: { tr: '3. Nitrik Oksit (NO) - sGC - cGMP Yolağı', en: '3. Nitric Oxide (NO) - sGC - cGMP Pathway' },
      drug: { tr: 'PDE5i (Sildenafil/Tadalafil) · sGC Uyarıcı (Riociguat)', en: 'PDE5i (Sildenafil/Tadalafil) · sGC Stimulator (Riociguat)' },
      body: {
        tr: 'Endotel disfonksiyonu nedeniyle NO sentezi düşer. Çözünür guanilat siklaz (sGC) uyarılamaz ve cGMP azalır. PDE5 inhibitörleri cGMP yıkımını önlerken, Riociguat NO’dan bağımsız olarak sGC’yi doğrudan uyarır.',
        en: 'Endothelial dysfunction depletes NO and intracellular cGMP. PDE5 inhibitors prevent cGMP degradation, while Riociguat directly stimulates soluble guanylate cyclase (sGC) independently of NO.'
      }
    },
    prostacyclin: {
      title: { tr: '4. Prostasiklin (PGI2) - IP Reseptör - cAMP Yolağı', en: '4. Prostacyclin (PGI2) - IP Receptor - cAMP Pathway' },
      drug: { tr: 'Epoprostenol · Treprostinil · İloprost · Selexipag', en: 'Epoprostenol · Treprostinil · Iloprost · Selexipag' },
      body: {
        tr: 'Endotelyal prostasiklin sentaz azalması IP reseptör -> adenilat siklaz -> cAMP sinyalini zayıflatır. Prostasiklin analogları ve IP reseptör agonisti Selexipag güçlü vazodilatasyon, antitrombotik ve antiproliferatif etki sağlar.',
        en: 'Deficient endothelial prostacyclin synthase lowers IP receptor -> cAMP signaling. Prostacyclin analogues and Selexipag restore cAMP-mediated vasodilation, cytoprotection, and platelet inhibition.'
      }
    }
  };

  function computeMetrics() {
    let effPvr = pvrWood;
    if (tripleTherapyOn) effPvr *= 0.68;
    if (sotaterceptOn) effPvr *= 0.65;
    effPvr = Math.max(1.3, effPvr);

    const rvEa = effPvr * 0.22;
    const coupling = rvContractility / Math.max(0.2, rvEa);
    const co = Math.max(2.1, Math.min(6.0, 5.4 * Math.min(1.1, Math.pow(coupling / 1.2, 0.45))));
    const mpap = Math.round(10 + effPvr * co);
    const eccentricity = (1.0 + Math.max(0, (mpap - 20) * 0.022)).toFixed(2);

    return { effPvr, mpap, co, coupling, eccentricity };
  }

  function render() {
    const en = getLang() === 'en';
    const m = computeMetrics();
    const activeStage = STAGES.find(s => s.id === stageId) || STAGES[0];
    const pw = PATHWAYS[selectedPathway] || PATHWAYS['bmpr2-activin'];

    root.innerHTML = `
      <div class="preset-pill-group pathophys-motion-bar" style="margin-bottom:10px">
        <span class="preset-label">${en ? 'Live Pulmonary & RV-LV Motion:' : 'Canlı Pulmoner ve RV-LV Hareketi:'}</span>
        <button type="button" class="preset-pill ${!paused ? 'active' : ''}" data-motion-toggle aria-pressed="${!paused}">
          ${paused ? (en ? '▷ Play' : '▷ Oynat') : (en ? 'Ⅱ Pause' : 'Ⅱ Duraklat')}
        </button>
        <label class="motion-speed-label">
          ${en ? 'Speed' : 'Hız'}
          <select data-motion-speed>
            <option value="0.5" ${speed === 0.5 ? 'selected' : ''}>0.5×</option>
            <option value="1" ${speed === 1 ? 'selected' : ''}>1×</option>
            <option value="2" ${speed === 2 ? 'selected' : ''}>2×</option>
          </select>
        </label>
      </div>

      <div class="preset-pill-group" style="margin-bottom:10px">
        <span class="preset-label">${en ? 'Disease Stage:' : 'Hastalık Evresi:'}</span>
        ${STAGES.map(s => `
          <button type="button" class="preset-pill ${s.id === stageId ? 'active' : ''}" data-pah-stage="${s.id}">
            ${en ? s.name.en : s.name.tr}
          </button>
        `).join('')}
      </div>

      <div class="preset-pill-group" style="margin-bottom:12px">
        <span class="preset-label">${en ? 'Signaling Pathway (Ghofrani 2025):' : 'Moleküler Yolak (Ghofrani 2025):'}</span>
        ${Object.entries(PATHWAYS).map(([k, val]) => `
          <button type="button" class="preset-pill ${k === selectedPathway ? 'active' : ''}" data-pah-pw="${k}">
            ${(en ? val.title.en : val.title.tr).split('(')[0].trim()}
          </button>
        `).join('')}
      </div>

      <div class="pathophys-grid">
        <div class="pathophys-stage">
          <svg viewBox="0 0 640 380" class="pathophys-svg pah-svg" role="img" aria-label="PAH Arteriole Remodeling and Biventricular Interdependence">
            ${buildPahSvg(en, m)}
          </svg>
          <div class="preset-pill-group" style="margin-top:10px;padding-bottom:0;border-bottom:0">
            <span class="preset-label">${en ? 'Targeted Therapy Simulation:' : 'Hedefe Yönelik Tedavi Simülasyonu:'}</span>
            <button type="button" class="preset-pill ${tripleTherapyOn ? 'active' : ''}" data-pah-toggle="triple">
              ${en ? 'ERA + PDE5i + Prostacyclin (Vasodilator)' : 'ERA + PDE5i + Prostasiklin (Vazodilatatör)'}
            </button>
            <button type="button" class="preset-pill ${sotaterceptOn ? 'active' : ''}" data-pah-toggle="sota">
              ${en ? '+ Sotatercept (Activin Trap Reverse Remodeling)' : '+ Sotatercept (Activin Tuzağı Ters Yeniden Yapılanma)'}
            </button>
          </div>
        </div>

        <div class="pathophys-controls">
          <div class="pathophys-readouts">
            <div class="readout-card">
              <span class="readout-title">mPAP / PVR</span>
              <strong class="readout-value" style="color:${m.mpap >= 35 ? '#dc2626' : '#0f766e'}">${m.mpap} mmHg · ${m.effPvr.toFixed(1)} WU</strong>
            </div>
            <div class="readout-card">
              <span class="readout-title">${en ? 'RV-PA Coupling (Ees/Ea)' : 'RV-PA Eşleşme (Ees/Ea)'}</span>
              <strong class="readout-value" style="color:${m.coupling < 0.8 ? '#dc2626' : '#0f766e'}">${m.coupling.toFixed(2)}</strong>
            </div>
            <div class="readout-card">
              <span class="readout-title">${en ? 'LV Eccentricity (D-Sign)' : 'LV Eksantrisite (D-İşareti)'}</span>
              <strong class="readout-value">${m.eccentricity} · CO ${m.co.toFixed(1)} L/m</strong>
            </div>
          </div>

          <div class="pathophys-sliders">
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${en ? 'Baseline PVR (Pulmonary Vascular Resistance)' : 'Bazal PVR (Pulmoner Vasküler Direnç)'}</strong> <small>(Wood Units)</small></span>
              <input type="range" data-pah-slider="pvr" min="1.2" max="14.0" step="0.4" value="${pvrWood}">
              <span class="slider-val">${pvrWood.toFixed(1)} WU</span>
            </label>
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${en ? 'RV Contractility (RV Ees)' : 'Sağ Ventrikül Kontraktilitesi (RV Ees)'}</strong> <small>(mmHg/mL)</small></span>
              <input type="range" data-pah-slider="ees" min="0.45" max="1.80" step="0.05" value="${rvContractility}">
              <span class="slider-val">${rvContractility.toFixed(2)} mmHg/mL</span>
            </label>
          </div>

          <div class="clinical-desc-box">
            <h4>${en ? activeStage.name.en : activeStage.name.tr}</h4>
            <p>${en ? activeStage.desc.en : activeStage.desc.tr}</p>
          </div>

          <div class="clinical-desc-box management-box">
            <h4>${en ? pw.title.en : pw.title.tr}</h4>
            <p style="margin-bottom:6px"><strong>${en ? 'Therapeutic Class:' : 'Tedavi Sınıfı:'}</strong> ${en ? pw.drug.en : pw.drug.tr}</p>
            <p>${en ? pw.body.en : pw.body.tr}</p>
          </div>
        </div>
      </div>
    `;

    const toggleBtn = root.querySelector('[data-motion-toggle]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        paused = !paused;
        toggleBtn.setAttribute('aria-pressed', String(!paused));
        toggleBtn.classList.toggle('active', !paused);
        toggleBtn.textContent = paused
          ? (getLang() === 'en' ? '▷ Play' : '▷ Oynat')
          : (getLang() === 'en' ? 'Ⅱ Pause' : 'Ⅱ Duraklat');
      });
    }

    const speedSel = root.querySelector('[data-motion-speed]');
    if (speedSel) {
      speedSel.addEventListener('change', (e) => {
        speed = Number(e.target.value) || 1;
      });
    }

    root.querySelectorAll('[data-pah-stage]').forEach(btn => {
      btn.addEventListener('click', () => {
        const st = STAGES.find(item => item.id === btn.dataset.pahStage);
        if (st) {
          stageId = st.id;
          pvrWood = st.pvr;
          rvContractility = st.rvEes;
          render();
        }
      });
    });

    root.querySelectorAll('[data-pah-pw]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPathway = btn.dataset.pahPw;
        render();
      });
    });

    root.querySelectorAll('[data-pah-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.pahToggle === 'triple') tripleTherapyOn = !tripleTherapyOn;
        if (btn.dataset.pahToggle === 'sota') sotaterceptOn = !sotaterceptOn;
        render();
      });
    });

    root.querySelectorAll('[data-pah-slider]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.dataset.pahSlider === 'pvr') pvrWood = parseFloat(input.value);
        if (input.dataset.pahSlider === 'ees') rvContractility = parseFloat(input.value);
        render();
      });
    });

    updateAnimationFrame(0);
  }

  function buildPahSvg(en, m) {
    const lumenR = Math.max(12, Math.round(48 - m.effPvr * 3.1));
    const intimaR = Math.min(54, lumenR + Math.round(m.effPvr * 1.9));
    const mediaR = 64;

    const rvExpand = Math.min(48, Math.max(0, (m.mpap - 18) * 0.95));
    const septumFlatX = 465 + Math.min(34, Math.max(0, (m.mpap - 20) * 0.65));
    const lvRx = Math.max(28, 52 - Math.round((m.mpap - 20) * 0.42));

    return `
      <!-- Left Box: Pulmonary Arteriole Remodeling & 4 Pathways -->
      <rect x="12" y="12" width="302" height="356" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="24" y="32" font-size="11.5" font-weight="800" fill="#0f172a">
        ${en ? '1. Distal Pulmonary Arteriole (Ghofrani 2025)' : '1. Distal Pulmoner Arteriyol (Ghofrani 2025)'}
      </text>

      <!-- Arteriole Concentric Layers -->
      <g transform="translate(163, 122)">
        <circle cx="0" cy="0" r="72" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <circle data-pah-media cx="0" cy="0" r="${mediaR}" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/>
        <circle data-pah-intima cx="0" cy="0" r="${intimaR}" fill="#fde047" fill-opacity="0.7" stroke="#ca8a04" stroke-width="2"/>
        <circle data-pah-lumen cx="0" cy="0" r="${lumenR}" fill="#fee2e2" stroke="#991b1b" stroke-width="2"/>
        ${m.effPvr > 8.5 ? `
          <circle cx="-6" cy="-5" r="5" fill="#ef4444"/><circle cx="7" cy="-4" r="4.5" fill="#ef4444"/><circle cx="1" cy="7" r="5" fill="#ef4444"/>
        ` : ''}

        <!-- Flowing Lumen RBCs & Molecular Signaling Particles -->
        <g data-pah-arteriole-particles>
          ${particles.filter(p => p.zone === 'lumen' || p.zone === 'ligand').map(p => `
            <circle class="pah-particle hf-live-particle" data-pah-p="${p.id}" cx="0" cy="0" r="${p.zone === 'lumen' ? 4.2 : 4.6}"
              fill="${p.zone === 'lumen' ? '#dc2626' : (sotaterceptOn ? '#059669' : '#d97706')}" stroke="#ffffff" stroke-width="1.1"/>
          `).join('')}
        </g>

        <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="800" fill="#7f1d1d">
          ${m.effPvr > 8.5 ? (en ? 'Plexiform' : 'Pleksiform') : `r=${lumenR}`}
        </text>
      </g>

      <!-- 4 Pathway Mini Cards inside Left Box -->
      <g transform="translate(22, 212)" font-size="9.5" font-weight="700">
        <rect x="0" y="0" width="136" height="64" rx="6" fill="${selectedPathway === 'bmpr2-activin' ? '#ecfdf5' : '#ffffff'}" stroke="${selectedPathway === 'bmpr2-activin' ? '#059669' : '#cbd5e1'}" stroke-width="1.8"/>
        <text x="8" y="16" fill="#065f46">BMPR2 vs Activin A</text>
        <text x="8" y="30" font-size="8.5" fill="#475569">↓Smad1/5/8 · ↑Smad2/3</text>
        <text x="8" y="46" font-size="8.5" fill="#059669">${sotaterceptOn ? '✓ Sotatercept Aktif' : 'Hedef: Sotatercept'}</text>

        <rect x="146" y="0" width="136" height="64" rx="6" fill="${selectedPathway === 'endothelin' ? '#fef2f2' : '#ffffff'}" stroke="${selectedPathway === 'endothelin' ? '#dc2626' : '#cbd5e1'}" stroke-width="1.8"/>
        <text x="154" y="16" fill="#991b1b">Endotelin-1 (ET-1)</text>
        <text x="154" y="30" font-size="8.5" fill="#475569">↑ETA / ETB → ↑Ca2+</text>
        <text x="154" y="46" font-size="8.5" fill="#dc2626">Hedef: Macitentan/Bosentan</text>

        <rect x="0" y="74" width="136" height="64" rx="6" fill="${selectedPathway === 'no-cgmp' ? '#eff6ff' : '#ffffff'}" stroke="${selectedPathway === 'no-cgmp' ? '#2563eb' : '#cbd5e1'}" stroke-width="1.8"/>
        <text x="8" y="90" fill="#1e40af">NO → sGC → cGMP</text>
        <text x="8" y="104" font-size="8.5" fill="#475569">↓Endotelyal NO / cGMP</text>
        <text x="8" y="120" font-size="8.5" fill="#2563eb">Hedef: Tadalafil / Riociguat</text>

        <rect x="146" y="74" width="136" height="64" rx="6" fill="${selectedPathway === 'prostacyclin' ? '#fffbeb' : '#ffffff'}" stroke="${selectedPathway === 'prostacyclin' ? '#d97706' : '#cbd5e1'}" stroke-width="1.8"/>
        <text x="154" y="90" fill="#92400e">Prostasiklin (PGI2)</text>
        <text x="154" y="104" font-size="8.5" fill="#475569">↓IP Reseptör → ↓cAMP</text>
        <text x="154" y="120" font-size="8.5" fill="#d97706">Hedef: Epoprostenol/Selexipag</text>
      </g>

      <!-- Right Box: Biventricular Short-Axis Interdependence (D-Shaped LV) -->
      <rect x="326" y="12" width="302" height="356" rx="10" fill="#fff1f2" stroke="#fecdd3"/>
      <text x="338" y="32" font-size="11.5" font-weight="800" fill="#881337">
        ${en ? '2. RV Overload & Septal Shift (D-Shaped LV)' : '2. Sağ Ventrikül Yükü ve Septal Kayma (D-Şekilli LV)'}
      </text>

      <!-- Pericardial constraint ring -->
      <ellipse cx="478" cy="158" rx="126" ry="96" fill="#ffe4e6" stroke="#9f1239" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="478" y="54" text-anchor="middle" font-size="9.5" font-weight="700" fill="#9f1239">
        ${en ? 'Pericardial Constraint (Ventricular Interdependence)' : 'Perikardiyal Sınırlama (Ventriküler İnterdependans)'}
      </text>

      <!-- Dilated Right Ventricle (Left side of short-axis view) -->
      <path data-pah-rv-path d="M ${septumFlatX} 86 C ${380 - rvExpand * 0.5} 82, ${368 - rvExpand * 0.6} 234, ${septumFlatX} 230 Z"
        fill="#38bdf8" fill-opacity="0.45" stroke="#0284c7" stroke-width="4"/>
      <text x="${412 - rvExpand * 0.2}" y="156" text-anchor="middle" font-size="13" font-weight="800" fill="#0369a1">RV</text>
      <text x="${412 - rvExpand * 0.2}" y="172" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0369a1">
        mPAP ${m.mpap}
      </text>

      <!-- Interventricular Septum (bowing into LV as RV pressure rises) -->
      <path data-pah-septum d="M ${septumFlatX} 86 Q ${septumFlatX + (m.mpap > 32 ? 22 : -14)} 158, ${septumFlatX} 230"
        fill="none" stroke="#be123c" stroke-width="9" stroke-linecap="round"/>

      <!-- Left Ventricle (Compressed into D-shape when RV pressure is high) -->
      <ellipse data-pah-lv-ellipse cx="525" cy="158" rx="${lvRx}" ry="66" fill="#f87171" fill-opacity="0.45" stroke="#b91c1c" stroke-width="10"/>
      <text x="${525 + (52 - lvRx) * 0.3}" y="156" text-anchor="middle" font-size="13" font-weight="800" fill="#7f1d1d">LV</text>
      <text x="${525 + (52 - lvRx) * 0.3}" y="172" text-anchor="middle" font-size="9.5" font-weight="700" fill="#7f1d1d">
        EI=${m.eccentricity}
      </text>

      <!-- Circulating RV and LV Cavity Blood Particles -->
      <g data-pah-chamber-particles>
        ${particles.filter(p => p.zone === 'rv' || p.zone === 'lv').map(p => `
          <circle class="pah-particle hf-live-particle" data-pah-p="${p.id}" cx="${p.zone === 'rv' ? 415 : 525}" cy="158" r="4.8"
            fill="${p.zone === 'rv' ? '#0284c7' : '#dc2626'}" stroke="#ffffff" stroke-width="1.2"/>
        `).join('')}
      </g>

      <!-- Septal shift arrows -->
      ${m.mpap > 30 ? `
        <g stroke="#be123c" stroke-width="2.2" fill="#be123c">
          <line x1="${septumFlatX - 10}" y1="138" x2="${septumFlatX + 16}" y2="138"/>
          <polygon points="${septumFlatX + 16},134 ${septumFlatX + 23},138 ${septumFlatX + 16},142"/>
          <line x1="${septumFlatX - 10}" y1="178" x2="${septumFlatX + 16}" y2="178"/>
          <polygon points="${septumFlatX + 16},174 ${septumFlatX + 23},178 ${septumFlatX + 16},182"/>
        </g>
      ` : ''}

      <!-- Hemodynamic Sequence Summary Box at bottom right -->
      <rect x="340" y="270" width="274" height="84" rx="8" fill="#ffffff" stroke="#fda4af"/>
      <text x="352" y="290" font-size="10.5" font-weight="800" fill="#881337">
        ${m.coupling < 0.8
          ? (en ? '⚠ RV-PA Uncoupling (Ees/Ea < 0.8): Decompensation' : '⚠ RV-PA Eşleşme Kaybı (Ees/Ea < 0.8): Dekompansasyon')
          : (en ? '✓ Preserved RV-PA Coupling (Ees/Ea ≥ 0.8)' : '✓ Korunmuş RV-PA Eşleşmesi (Ees/Ea ≥ 0.8)')}
      </text>
      <text x="352" y="308" font-size="9.5" fill="#334155">
        ${en ? `• Septal flattening compresses LV preload → CO = ${m.co.toFixed(1)} L/min` : `• Septal düzleşme LV ön-yükünü kısıtlar → Debi = ${m.co.toFixed(1)} L/dk`}
      </text>
      <text x="352" y="324" font-size="9.5" fill="#334155">
        ${en ? '• High RV wall tension increases O2 demand & ischemia' : '• Yüksek RV duvar gerilimi koroner perfüzyonu bozar'}
      </text>
      <text x="352" y="340" font-size="9.5" font-weight="700" fill="#0f766e">
        ${sotaterceptOn || tripleTherapyOn
          ? (en ? '• Active therapy unloads RV & restores LV cavity' : '• Aktif tedavi PVR’yi düşürerek LV dolumunu kurtarır')
          : (en ? '• Toggle ERA/PDE5i + Sotatercept to unload RV' : '• RV yükünü azaltmak için Sotatercept/Kombinasyon açın')}
      </text>
    `;
  }

  function updateAnimationFrame(dtSec) {
    if (!root.isConnected) return;
    const m = computeMetrics();
    const baseLumenR = Math.max(12, Math.round(48 - m.effPvr * 3.1));
    const rvExpand = Math.min(48, Math.max(0, (m.mpap - 18) * 0.95));
    const baseSeptumX = 465 + Math.min(34, Math.max(0, (m.mpap - 20) * 0.65));
    const baseLvRx = Math.max(28, 52 - Math.round((m.mpap - 20) * 0.42));

    cyclePhase = (cyclePhase + dtSec * 40 * speed) % 100;
    const beat = Math.sin((cyclePhase / 100) * Math.PI * 2);

    // 1. Pulsate Pulmonary Arteriole Lumen
    const lumenEl = root.querySelector('[data-pah-lumen]');
    if (lumenEl) {
      lumenEl.setAttribute('r', Math.max(8, baseLumenR + 1.8 * beat).toFixed(1));
    }

    // 2. Animate Beating RV, LV, and Septal D-Flattening
    const septumBow = (m.mpap > 32 ? 22 : -14) + beat * (m.mpap > 32 ? 9 : 4);
    const septumX = baseSeptumX + beat * 3;
    const rvPath = root.querySelector('[data-pah-rv-path]');
    const septumPath = root.querySelector('[data-pah-septum]');
    const lvEllipse = root.querySelector('[data-pah-lv-ellipse]');

    if (rvPath) {
      const rvBeat = rvExpand + beat * 6;
      rvPath.setAttribute('d', `M ${septumX.toFixed(1)} 86 C ${(380 - rvBeat * 0.5).toFixed(1)} 82, ${(368 - rvBeat * 0.6).toFixed(1)} 234, ${septumX.toFixed(1)} 230 Z`);
    }
    if (septumPath) {
      septumPath.setAttribute('d', `M ${septumX.toFixed(1)} 86 Q ${(septumX + septumBow).toFixed(1)} 158, ${septumX.toFixed(1)} 230`);
    }
    if (lvEllipse) {
      const lvRxNow = Math.max(22, baseLvRx - beat * 4.5);
      const lvRyNow = 66 - beat * 4.5;
      lvEllipse.setAttribute('rx', lvRxNow.toFixed(1));
      lvEllipse.setAttribute('ry', lvRyNow.toFixed(1));
    }

    // 3. Move Particles in Arteriole Lumen, Signaling Ring, and RV/LV Chambers
    const coSpeed = (m.co / 5.0) * speed;
    particles.forEach(p => {
      const node = root.querySelector(`[data-pah-p="${p.id}"]`);
      if (!node) return;

      if (p.zone === 'lumen') {
        p.angle = (p.angle + dtSec * 2.1 * coSpeed) % (Math.PI * 2);
        const r = Math.max(4, (baseLumenR - 5) * (0.35 + 0.55 * ((p.id % 3) / 2)));
        node.setAttribute('cx', (Math.cos(p.angle) * r).toFixed(1));
        node.setAttribute('cy', (Math.sin(p.angle) * r).toFixed(1));
      } else if (p.zone === 'ligand') {
        // Signaling ligands in media/intima ring
        p.angle = (p.angle - dtSec * 1.3 * speed) % (Math.PI * 2);
        const r = sotaterceptOn ? 67 : (baseLumenR + 10);
        node.setAttribute('cx', (Math.cos(p.angle) * r).toFixed(1));
        node.setAttribute('cy', (Math.sin(p.angle) * r).toFixed(1));
      } else if (p.zone === 'rv') {
        p.angle = (p.angle + dtSec * 1.8 * coSpeed) % (Math.PI * 2);
        const rX = 22 + rvExpand * 0.25;
        const rY = 44;
        const cx = (412 - rvExpand * 0.18) + Math.cos(p.angle) * rX;
        const cy = 158 + Math.sin(p.angle) * rY;
        node.setAttribute('cx', cx.toFixed(1));
        node.setAttribute('cy', cy.toFixed(1));
      } else {
        p.angle = (p.angle + dtSec * 2.2 * coSpeed) % (Math.PI * 2);
        const rX = Math.max(12, baseLvRx - 12);
        const rY = 42;
        const cx = 528 + Math.cos(p.angle) * rX;
        const cy = 158 + Math.sin(p.angle) * rY;
        node.setAttribute('cx', cx.toFixed(1));
        node.setAttribute('cy', cy.toFixed(1));
      }
    });
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.06, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      if (!paused) {
        updateAnimationFrame(dt);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  mount.append(root);
  render();
  startLoop();

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      render();
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      root.remove();
    }
  };
}
