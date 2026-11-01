// Hypertension, Salt Sensitivity, Arterial Wave Reflection & Novel Pharmacology Lab
// Sources: Masenga et al. (Nat Rev Cardiol 2025), Sayer et al. (Nat Rev Cardiol 2025),
// Min et al. (Nat Rev Cardiol 2025), Physiological Reviews (2023).

export function createHypertensionLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-htn-lab';

  let phenotype = 'salt-sensitive'; // 'normotensive' | 'salt-sensitive' | 'stiff-aorta' | 'resistant-raas'
  let dietarySalt = 10;             // g/day NaCl (3 to 18)
  let arterialStiffness = 9.5;      // PWV m/s (5 to 16)
  let activeDrug = 'none';          // 'none' | 'zilebesiran' | 'baxdrostat' | 'aprocitentan'

  const PHENOTYPES = [
    {
      id: 'normotensive',
      name: { tr: 'Tuz Dirençli (Normal Natriürez)', en: 'Salt-Resistant (Normal Natriuresis)' },
      salt: 8, pwv: 6.2, drug: 'none',
      desc: {
        tr: 'Normal endotelyal glikokaliks ve eNOS aktivitesi; yüksek tuz alımında bile böbrek basınç-natriürez eğrisi dik kalarak kan basıncı yükselmeden sodyumu hızla atar.',
        en: 'Intact endothelial glycocalyx and eNOS bioactivity; a steep renal pressure-natriuresis curve excretes excess dietary sodium without raising systemic blood pressure.'
      }
    },
    {
      id: 'salt-sensitive',
      name: { tr: 'Tuz Duyarlı Hipertansiyon (Masenga 2025)', en: 'Salt-Sensitive Hypertension (Masenga 2025)' },
      salt: 13, pwv: 9.5, drug: 'none',
      desc: {
        tr: 'Bozulmuş renal tübüler ENaC/NCC regülasyonu, deri interstisyumunda hipertonik Na+ birikimi, Th17/IL-17 immün aktivasyonu ve endotelyal glikokaliks hasarıyla basınç-natriürez eğrisi sağa ve yatay konuma kayar.',
        en: 'Impaired renal ENaC/NCC regulation, hypertonic skin Na+ storage, Th17/IL-17 immune activation, and endothelial glycocalyx shedding shift the pressure-natriuresis curve rightward.'
      }
    },
    {
      id: 'stiff-aorta',
      name: { tr: 'İzole Sistolik HT ve Yüksek PWV (Min 2025)', en: 'Isolated Systolic HTN & High PWV (Min 2025)' },
      salt: 9, pwv: 13.8, drug: 'none',
      desc: {
        tr: 'Aort duvarında elastin kırılması ve kollajen çapraz bağlanması nabız dalgası hızını (PWV >12 m/s) artırır. Periferden yansıyan dalga diyastol yerine geç sistolde aort köküne dönerek santral sistolik basıncı (Augmentasyon) yükseltir.',
        en: 'Aortic elastin fragmentation and collagen cross-linking elevate Pulse Wave Velocity (PWV >12 m/s). Early systolic wave reflection augments central aortic systolic pressure and widens pulse pressure.'
      }
    },
    {
      id: 'resistant-raas',
      name: { tr: 'Dirençli HT (Aldosteron + Endotelin Aksı)', en: 'Resistant HTN (Aldosterone + Endothelin Axis)' },
      salt: 14, pwv: 11.5, drug: 'none',
      desc: {
        tr: 'Kaçış aldosteron sentezi, otonomik sempatik aşırı deşarj ve vasküler Endotelin-1 (ETA/ETB) vazokonstriksiyonu; standart üçlü antihipertansif tedaviye rağmen direnç arteriyollerinde hipertrofik yeniden yapılanma sürer.',
        en: 'Aldosterone breakthrough, sympathetic overdrive, and Endothelin-1 (ETA/ETB) vasoconstriction drive hypertrophic resistance arteriole remodeling refractory to standard triple therapy.'
      }
    }
  ];

  const NOVEL_DRUGS = [
    {
      id: 'none',
      name: { tr: 'Tedavisiz (Bazal Patofizyoloji)', en: 'Untreated (Baseline Pathophysiology)' },
      target: { tr: 'İlaç Yok', en: 'No Drug' },
      sbpDelta: 0, dbpDelta: 0,
      mechanism: {
        tr: 'Karaciğer kaynaklı anjiyotensinojen (AGT), adrenal aldosteron sentaz (CYP11B2) ve vasküler Endotelin-1 (ET-1) yolakları baskılanmamış durumdadır.',
        en: 'Hepatic angiotensinogen (AGT), adrenal aldosterone synthase (CYP11B2), and vascular Endothelin-1 (ET-1) pathways remain uninhibited.'
      }
    },
    {
      id: 'zilebesiran',
      name: { tr: 'Zilebesiran (Hepatik AGT siRNA)', en: 'Zilebesiran (Hepatic AGT siRNA)' },
      target: { tr: 'Karaciğer AGT mRNA (6 Ayda Bir SC)', en: 'Hepatic AGT mRNA (Biannual SC)' },
      sbpDelta: -18, dbpDelta: -10,
      mechanism: {
        tr: 'GalNAc-konjuge küçük girişimci RNA (siRNA) hepatositlerde anjiyotensinojen (AGT) mRNA yıkımı yaparak RAAS kaskadını en üst basamakta >%90 susturur; 6 ay boyunca 24 saat tonik KB kontrolü sağlar (Sayer et al. 2025).',
        en: 'GalNAc-conjugated siRNA degrades hepatic angiotensinogen (AGT) mRNA, depleting upstream RAAS substrate by >90% with durable 6-month tonic blood pressure reduction (Sayer et al. 2025).'
      }
    },
    {
      id: 'baxdrostat',
      name: { tr: 'Baxdrostat / Lorundrostat (ASI)', en: 'Baxdrostat / Lorundrostat (ASI)' },
      target: { tr: 'Aldosteron Sentaz (CYP11B2)', en: 'Aldosterone Synthase (CYP11B2)' },
      sbpDelta: -16, dbpDelta: -9,
      mechanism: {
        tr: '11β-hidroksilazı (CYP11B1 / kortizol sentezini) etkilemeden seçici olarak Aldosteron Sentazı (CYP11B2) inhibe eder; hem genomik (ENaC) hem de non-genomik vasküler aldosteron etkilerini ortadan kaldırır (Sayer et al. 2025).',
        en: 'Selectively inhibits Aldosterone Synthase (CYP11B2) while sparing cortisol synthesis (CYP11B1), abolishing both genomic renal ENaC sodium retention and non-genomic vascular fibrosis.'
      }
    },
    {
      id: 'aprocitentan',
      name: { tr: 'Aprocitentan (Dual ETA / ETB Antagonisti)', en: 'Aprocitentan (Dual ETA / ETB Antagonist)' },
      target: { tr: 'Vasküler ETA ve ETB Reseptörleri', en: 'Vascular ETA & ETB Receptors' },
      sbpDelta: -14, dbpDelta: -9,
      mechanism: {
        tr: 'Dirençli hipertansiyonda güçlü vazokonstriktör, pro-inflamatuar ve sodyum tutucu Endotelin-1’in hem ETA hem ETB reseptörlerini bloke ederek sistemik vasküler direnci düşürür (PRECISION çalışması, Sayer et al. 2025).',
        en: 'Blocks both ETA and ETB receptors to reverse Endothelin-1-mediated vasoconstriction, vascular hypertrophy, and renal sodium retention in resistant hypertension (PRECISION trial, Sayer et al. 2025).'
      }
    }
  ];

  function computeHemodynamics() {
    const isSaltSens = phenotype === 'salt-sensitive' || phenotype === 'resistant-raas';
    const saltExcess = Math.max(0, dietarySalt - 5);
    const saltSlope = isSaltSens ? 3.2 : 0.7;
    const drug = NOVEL_DRUGS.find(d => d.id === activeDrug) || NOVEL_DRUGS[0];

    // Forward wave pressure + Reflected wave augmentation from PWV
    const baseMap = 88 + saltExcess * saltSlope + (phenotype === 'resistant-raas' ? 14 : 0) + drug.dbpDelta;
    const augPressure = Math.round(Math.max(2, (arterialStiffness - 5.5) * 3.4));
    const centralSbp = Math.round(baseMap + 28 + augPressure + (drug.sbpDelta - drug.dbpDelta));
    const centralDbp = Math.round(Math.max(52, baseMap - 14 - Math.max(0, (arterialStiffness - 9) * 1.4)));
    const pulsePressure = centralSbp - centralDbp;
    const aix = Math.round((augPressure / Math.max(20, pulsePressure)) * 100);
    const wallLumenRatio = (0.09 + (centralSbp - 110) * 0.0018).toFixed(2);

    return { centralSbp, centralDbp, pulsePressure, augPressure, aix, wallLumenRatio, drug };
  }

  function render() {
    const en = getLang() === 'en';
    const hemo = computeHemodynamics();
    const activePheno = PHENOTYPES.find(p => p.id === phenotype) || PHENOTYPES[0];

    root.innerHTML = `
      <div class="preset-pill-group" style="margin-bottom:10px">
        <span class="preset-label">${en ? 'Clinical Phenotype:' : 'Klinik Fenotip:'}</span>
        ${PHENOTYPES.map(p => `
          <button type="button" class="preset-pill ${p.id === phenotype ? 'active' : ''}" data-htn-pheno="${p.id}">
            ${en ? p.name.en : p.name.tr}
          </button>
        `).join('')}
      </div>

      <div class="preset-pill-group" style="margin-bottom:12px">
        <span class="preset-label">${en ? 'Novel Therapeutics (Sayer 2025):' : 'Yeni Nesil Hedefler (Sayer 2025):'}</span>
        ${NOVEL_DRUGS.map(d => `
          <button type="button" class="preset-pill ${d.id === activeDrug ? 'active' : ''}" data-htn-drug="${d.id}">
            ${en ? d.name.en : d.name.tr}
          </button>
        `).join('')}
      </div>

      <div class="pathophys-grid">
        <div class="pathophys-stage">
          <svg viewBox="0 0 640 390" class="pathophys-svg htn-svg" role="img" aria-label="Hypertension Multi-Organ and Pulse Wave Reflection Canvas">
            ${buildHtnSvg(en, hemo)}
          </svg>
        </div>

        <div class="pathophys-controls">
          <div class="pathophys-readouts">
            <div class="readout-card">
              <span class="readout-title">${en ? 'Central Aortic BP' : 'Santral Aort KB'}</span>
              <strong class="readout-value" style="color:${hemo.centralSbp >= 140 ? '#dc2626' : '#0f766e'}">${hemo.centralSbp}/${hemo.centralDbp} <small>mmHg</small></strong>
            </div>
            <div class="readout-card">
              <span class="readout-title">${en ? 'Augmentation (AP / AIx)' : 'Augmentasyon (AP / AIx)'}</span>
              <strong class="readout-value">+${hemo.augPressure} mmHg (${hemo.aix}%)</strong>
            </div>
            <div class="readout-card">
              <span class="readout-title">${en ? 'Arteriole Wall/Lumen' : 'Arteriyol Duvar/Lümen'}</span>
              <strong class="readout-value">${hemo.wallLumenRatio}</strong>
            </div>
          </div>

          <div class="pathophys-sliders">
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${en ? 'Dietary Salt Intake (NaCl)' : 'Günlük Tuz Alımı (NaCl)'}</strong> <small>(g/day)</small></span>
              <input type="range" data-htn-slider="salt" min="3" max="18" step="1" value="${dietarySalt}">
              <span class="slider-val">${dietarySalt} g/${en ? 'day' : 'gün'}</span>
            </label>
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${en ? 'Aortic Pulse Wave Velocity (PWV)' : 'Aortik Nabız Dalgası Hızı (PWV)'}</strong> <small>(m/s)</small></span>
              <input type="range" data-htn-slider="pwv" min="5.5" max="16.0" step="0.5" value="${arterialStiffness}">
              <span class="slider-val">${arterialStiffness.toFixed(1)} m/s ${arterialStiffness >= 10 ? (en ? '(Stiff Aorta)' : '(Sert Aort)') : ''}</span>
            </label>
          </div>

          <div class="clinical-desc-box">
            <h4>${en ? activePheno.name.en : activePheno.name.tr}</h4>
            <p>${en ? activePheno.desc.en : activePheno.desc.tr}</p>
          </div>

          <div class="clinical-desc-box management-box">
            <h4>${en ? hemo.drug.name.en : hemo.drug.name.tr} · <small>${en ? hemo.drug.target.en : hemo.drug.target.tr}</small></h4>
            <p>${en ? hemo.drug.mechanism.en : hemo.drug.mechanism.tr}</p>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-htn-pheno]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = PHENOTYPES.find(item => item.id === btn.dataset.htnPheno);
        if (p) {
          phenotype = p.id;
          dietarySalt = p.salt;
          arterialStiffness = p.pwv;
          render();
        }
      });
    });

    root.querySelectorAll('[data-htn-drug]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDrug = btn.dataset.htnDrug;
        render();
      });
    });

    root.querySelectorAll('[data-htn-slider]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.dataset.htnSlider === 'salt') dietarySalt = parseFloat(input.value);
        if (input.dataset.htnSlider === 'pwv') arterialStiffness = parseFloat(input.value);
        render();
      });
    });
  }

  function buildHtnSvg(en, hemo) {
    // Top row: 3 interconnected organ/vascular boxes:
    // 1. Renal Guyton Pressure-Natriuresis Curve (left)
    // 2. Resistance Arteriole Cross-Section + Neurohormonal (center-right)
    // Bottom row: Central Aortic Waveform Decomposition (Forward + Reflected = Augmented Central BP)

    const isSaltSens = phenotype === 'salt-sensitive' || phenotype === 'resistant-raas';
    const lumenR = Math.max(15, 34 - Math.round((hemo.centralSbp - 115) * 0.22));
    const wallR = 46;

    // Generate Aortic Pressure Waveforms (0..100% cardiac cycle)
    const fwdPts = [];
    const refPts = [];
    const sumPts = [];
    const waveX = i => 55 + (i / 100) * 545;
    const waveY = p => 360 - ((p - 50) / 145) * 145;

    // Reflection arrival time shifts earlier as PWV increases
    const refPeakIdx = Math.max(22, Math.round(52 - (arterialStiffness - 5.5) * 2.6));

    for (let i = 0; i <= 100; i++) {
      const fwd = i <= 42
        ? hemo.centralDbp + (hemo.centralSbp - hemo.augPressure - hemo.centralDbp) * Math.sin((i / 42) * Math.PI)
        : hemo.centralDbp + 12 * Math.exp(-(i - 42) / 28);

      const dist = Math.abs(i - refPeakIdx);
      const ref = dist < 26 ? hemo.augPressure * Math.cos((dist / 26) * (Math.PI / 2)) : 0;
      const total = Math.max(hemo.centralDbp, fwd + ref);

      fwdPts.push(`${waveX(i).toFixed(1)},${waveY(fwd).toFixed(1)}`);
      refPts.push(`${waveX(i).toFixed(1)},${waveY(hemo.centralDbp + ref).toFixed(1)}`);
      sumPts.push(`${waveX(i).toFixed(1)},${waveY(total).toFixed(1)}`);
    }

    return `
      <!-- Top Left: Renal Pressure-Natriuresis Plot (Masenga 2025) -->
      <rect x="14" y="12" width="305" height="175" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="26" y="30" font-size="11.5" font-weight="800" fill="#0f172a">
        ${en ? '1. Renal Pressure-Natriuresis (Masenga 2025)' : '1. Böbrek Basınç-Natriürez Eğrisi (Masenga 2025)'}
      </text>
      <line x1="52" y1="158" x2="298" y2="158" stroke="#64748b" stroke-width="1.5"/>
      <line x1="52" y1="44" x2="52" y2="158" stroke="#64748b" stroke-width="1.5"/>
      <text x="175" y="176" text-anchor="middle" font-size="9.5" font-weight="700" fill="#475569">
        ${en ? 'Mean Arterial Pressure (MAP, mmHg) →' : 'Ortalama Arter Basıncı (MAP, mmHg) →'}
      </text>
      <text x="24" y="102" text-anchor="middle" transform="rotate(-90 24 102)" font-size="9.5" font-weight="700" fill="#475569">
        ${en ? 'Na+ Excretion' : 'Na+ Atılımı'}
      </text>

      <!-- Normal Steep Curve -->
      <line x1="110" y1="154" x2="128" y2="48" stroke="#10b981" stroke-width="2.5" stroke-dasharray="${isSaltSens ? '4 3' : 'none'}"/>
      <text x="118" y="44" text-anchor="middle" font-size="9" font-weight="700" fill="#059669">${en ? 'Salt-Resistant' : 'Tuz Dirençli'}</text>

      <!-- Salt-Sensitive Right-Shifted & Flattened Curve -->
      <line x1="145" y1="154" x2="265" y2="54" stroke="#dc2626" stroke-width="2.5"/>
      <text x="242" y="50" text-anchor="middle" font-size="9" font-weight="700" fill="#dc2626">${en ? 'Salt-Sensitive (ENaC/IL-17)' : 'Tuz Duyarlı (ENaC/IL-17)'}</text>

      <!-- Operating Point -->
      <circle cx="${isSaltSens ? 155 + dietarySalt * 5.2 : 118}" cy="${154 - dietarySalt * 5.2}" r="6" fill="#2563eb" stroke="#fff" stroke-width="2"/>

      <!-- Top Right: Resistance Arteriole Remodeling & Targets (Sayer 2025) -->
      <rect x="330" y="12" width="296" height="175" rx="10" fill="#fff7ed" stroke="#fed7aa"/>
      <text x="342" y="30" font-size="11.5" font-weight="800" fill="#7c2d12">
        ${en ? '2. Resistance Arteriole & Targets (Sayer 2025)' : '2. Direnç Arteriyolü ve Hedefler (Sayer 2025)'}
      </text>

      <!-- Arteriole Cross Section -->
      <circle cx="402" cy="105" r="${wallR}" fill="#ea580c" fill-opacity="0.32" stroke="#9a3412" stroke-width="2.5"/>
      <circle cx="402" cy="105" r="${lumenR}" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
      <text x="402" y="109" text-anchor="middle" font-size="10" font-weight="800" fill="#991b1b">r=${lumenR}</text>
      <text x="402" y="168" text-anchor="middle" font-size="9.5" font-weight="700" fill="#7c2d12">
        ${en ? 'Poiseuille: R ∝ 1 / r⁴' : 'Poiseuille Yasası: Direnç ∝ 1 / r⁴'}
      </text>

      <!-- Neurohormonal Pathway Badges -->
      <g transform="translate(465, 48)" font-size="9.5" font-weight="700">
        <rect x="0" y="0" width="148" height="32" rx="6" fill="${activeDrug === 'zilebesiran' ? '#dcfce7' : '#ffffff'}" stroke="${activeDrug === 'zilebesiran' ? '#16a34a' : '#fdba74'}" stroke-width="1.5"/>
        <text x="8" y="14" fill="#0f172a">Karaciğer AGT → Ang II</text>
        <text x="8" y="26" font-size="8.5" fill="#059669">${activeDrug === 'zilebesiran' ? '✓ Zilebesiran (siRNA) Bloke' : 'AT1R Vazokonstriksiyon'}</text>

        <rect x="0" y="40" width="148" height="32" rx="6" fill="${activeDrug === 'baxdrostat' ? '#dcfce7' : '#ffffff'}" stroke="${activeDrug === 'baxdrostat' ? '#16a34a' : '#fdba74'}" stroke-width="1.5"/>
        <text x="8" y="54" fill="#0f172a">CYP11B2 → Aldosteron</text>
        <text x="8" y="66" font-size="8.5" fill="#059669">${activeDrug === 'baxdrostat' ? '✓ Baxdrostat (ASI) Bloke' : 'ENaC Na+ Tutulumu + Fibrozis'}</text>

        <rect x="0" y="80" width="148" height="32" rx="6" fill="${activeDrug === 'aprocitentan' ? '#dcfce7' : '#ffffff'}" stroke="${activeDrug === 'aprocitentan' ? '#16a34a' : '#fdba74'}" stroke-width="1.5"/>
        <text x="8" y="94" fill="#0f172a">Endotelin-1 (ETA/ETB)</text>
        <text x="8" y="106" font-size="8.5" fill="#059669">${activeDrug === 'aprocitentan' ? '✓ Aprocitentan Bloke' : 'Düz Kas Hipertrofisi'}</text>
      </g>

      <!-- Bottom Panel: Central Aortic Pulse Wave Reflection & Augmentation (Min 2025) -->
      <rect x="14" y="198" width="612" height="182" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="26" y="216" font-size="11.5" font-weight="800" fill="#0f172a">
        ${en
          ? `3. Central Aortic Pulse Waveform & Reflected Wave Augmentation (PWV = ${arterialStiffness.toFixed(1)} m/s, AP = +${hemo.augPressure} mmHg)`
          : `3. Santral Aortik Nabız Dalgası ve Yansıyan Dalga Augmentasyonu (PWV = ${arterialStiffness.toFixed(1)} m/s, AP = +${hemo.augPressure} mmHg)`}
      </text>

      <line x1="55" y1="360" x2="600" y2="360" stroke="#64748b" stroke-width="1.5"/>
      <line x1="55" y1="225" x2="55" y2="360" stroke="#64748b" stroke-width="1.5"/>
      ${[80, 120, 160].map(p => `
        <line x1="55" y1="${waveY(p)}" x2="600" y2="${waveY(p)}" stroke="#e2e8f0" stroke-dasharray="3 3"/>
        <text x="48" y="${waveY(p) + 3}" text-anchor="end" font-size="9.5" fill="#64748b">${p}</text>
      `).join('')}

      <!-- Forward Incident Wave -->
      <polyline points="${fwdPts.join(' ')}" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 3"/>
      <!-- Reflected Wave -->
      <polyline points="${refPts.join(' ')}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 2"/>
      <!-- Summed Central Aortic Pressure Wave -->
      <polyline points="${sumPts.join(' ')}" fill="none" stroke="#dc2626" stroke-width="3"/>

      <!-- Legend inside waveform panel -->
      <g transform="translate(310, 232)" font-size="10" font-weight="700">
        <line x1="0" y1="6" x2="18" y2="6" stroke="#dc2626" stroke-width="3"/>
        <text x="24" y="10" fill="#0f172a">${en ? 'Central Aortic Pressure' : 'Santral Aort Basıncı'}</text>
        <line x1="150" y1="6" x2="168" y2="6" stroke="#0284c7" stroke-width="2" stroke-dasharray="4 2"/>
        <text x="174" y="10" fill="#0284c7">${en ? 'Forward Wave' : 'İleri Dalga'}</text>
        <line x1="0" y1="22" x2="18" y2="22" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 2"/>
        <text x="24" y="26" fill="#d97706">${en ? 'Reflected Wave (Early Return in Stiff Aorta)' : 'Yansıyan Dalga (Sert Aortta Erken Dönüş)'}</text>
      </g>
    `;
  }

  mount.append(root);
  render();

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      render();
    }
  };
}
