// Valvular Hemodynamics Lab: Simultaneous LV, LA, and Aorta pressure curves and gradients
export function createValvularLab(opts = {}) {
  const container = opts.container || opts.mount;
  let lang = typeof opts.getLang === 'function' ? opts.getLang() : (opts.lang || 'tr');
  let currentLesion = 'as'; // 'normal', 'as', 'ar', 'ms', 'mr'
  let severity = 75; // 0 to 100%

  const LESIONS = [
    {
      id: 'as',
      nameTr: 'Aort Darlığı (AS)',
      nameEn: 'Aortic Stenosis (AS)',
      badgeTr: 'Sistolik Basınç Gradyanı',
      badgeEn: 'Systolic Pressure Gradient'
    },
    {
      id: 'ar',
      nameTr: 'Aort Yetersizliği (AR)',
      nameEn: 'Aortic Regurgitation (AR)',
      badgeTr: 'Geniş Nabız Basıncı & Hacim Yükü',
      badgeEn: 'Wide Pulse Pressure & Volume Load'
    },
    {
      id: 'ms',
      nameTr: 'Mitral Darlığı (MS)',
      nameEn: 'Mitral Stenosis (MS)',
      badgeTr: 'Diyastolik LA-LV Gradyanı',
      badgeEn: 'Diastolic LA-LV Gradient'
    },
    {
      id: 'mr',
      nameTr: 'Mitral Yetersizliği (MR)',
      nameEn: 'Mitral Regurgitation (MR)',
      badgeTr: 'Dev Sol Atriyal v Dalgası',
      badgeEn: 'Giant Left Atrial v Wave'
    },
    {
      id: 'normal',
      nameTr: 'Normal Hemodinami',
      nameEn: 'Normal Hemodynamics',
      badgeTr: 'Fizyolojik Referans',
      badgeEn: 'Physiological Baseline'
    }
  ];

  function getLesionDetails(lesion, sev) {
    const isTr = lang === 'tr';
    const factor = sev / 100;

    switch (lesion) {
      case 'as': {
        const peakLV = Math.round(120 + factor * 90); // 120 -> 210 mmHg
        const peakAo = Math.round(120 - factor * 15); // 120 -> 105 mmHg
        const peakGrad = peakLV - peakAo;
        const meanGrad = Math.round(peakGrad * 0.65);
        const ava = (2.5 - factor * 1.9).toFixed(2); // 2.5 cm2 -> 0.6 cm2
        return {
          title: isTr ? 'Aort Darlığı (Aortic Stenosis)' : 'Aortic Stenosis (AS)',
          peakLV,
          peakAo,
          grad: peakGrad,
          meanGrad,
          ava,
          summary: isTr
            ? 'LV çıkım yolu tıkanıklığı nedeniyle sol ventrikül sistolde aşırı yüksek basınç üretmek zorundadır. LV ile Aort arasında geniş bir sistolik basınç gradyanı oluşur. Pulsus parvus et tardus (gecikmiş ve zayıf karotis vuruşu) görülür.'
            : 'Fixed LV outflow obstruction forces the left ventricle to generate supra-systemic systolic pressures. A large systolic transvalvular gradient develops with a delayed, dampened carotid upstroke (pulsus parvus et tardus).',
          auscultation: isTr
            ? 'Kreşendo-dekreşendo sistolik ejeksiyon üfürümü (sağ 2. İKB), boyna (karotislere) yayılır. S2 tek veya paradoksik çiftleşebilir; S4 gallop sıktır.'
            : 'Crescendo-decrescendo systolic ejection murmur at right 2nd ICS radiating to carotids. Soft S2 with potential paradoxical splitting; audible S4.',
          criteria: isTr
            ? `Ciddi AS Kriterleri: AVA < 1.0 cm² (veya AVAi < 0.6 cm²/m²), Ortalama Gradyan ≥ 40 mmHg, Tepe Hız Vmax ≥ 4.0 m/s.`
            : `Severe AS Criteria: AVA < 1.0 cm² (or indexed AVA < 0.6 cm²/m²), Mean Gradient ≥ 40 mmHg, Peak Velocity Vmax ≥ 4.0 m/s.`
        };
      }
      case 'ar': {
        const sbp = Math.round(120 + factor * 40); // 120 -> 160
        const dbp = Math.round(80 - factor * 45); // 80 -> 35
        const pp = sbp - dbp;
        const regVol = Math.round(factor * 75); // 0 -> 75 mL
        const regFrac = Math.round(factor * 60); // 0 -> 60%
        return {
          title: isTr ? 'Aort Yetersizliği (Aortic Regurgitation)' : 'Aortic Regurgitation (AR)',
          sbp,
          dbp,
          pp,
          regVol,
          regFrac,
          summary: isTr
            ? 'Diyastol boyunca aorttan sol ventriküle kan geri kaçar. Aortik diyastolik basınç hızla düşerken ventrikül diyastol sonu basıncı (LVEDP) hızla yükselir. Devasa vuru hacmi ve genişlemiş nabız basıncı gelişir.'
            : 'Retrograde diastolic runoff from aorta into LV produces a precipitously falling aortic pressure and steep early elevation of LVEDP. Hallmark wide pulse pressure with hyperdynamic circulation.',
          auscultation: isTr
            ? 'Sol sternal kenarda (Erb odağı) erken diyastolik dekreşendo üfürüm, hasta öne eğilip nefesini verdiğinde belirginleşir. Austin Flint üfürümü ve periferik nabız bulguları (Corrigan nabzı, Duroziez belirtisi).'
            : 'Early diastolic decrescendo high-pitched blowing murmur at left 3rd-4th ICS, accentuated leaning forward in end-expiration. Austin Flint murmur and peripheral signs (Corrigan pulse).',
          criteria: isTr
            ? `Ciddi AR Kriterleri: Regürjitan Fraksiyon ≥ 50%, Regürjitan Hacim ≥ 60 mL, Vena Contracta > 6 mm, PHT < 200 ms.`
            : `Severe AR Criteria: Regurgitant Fraction ≥ 50%, Regurgitant Volume ≥ 60 mL, Vena Contracta > 6 mm, Pressure Half-Time (PHT) < 200 ms.`
        };
      }
      case 'ms': {
        const meanLA = Math.round(8 + factor * 22); // 8 -> 30 mmHg
        const meanGrad = Math.round(factor * 16); // 0 -> 16 mmHg
        const mva = (4.0 - factor * 3.1).toFixed(2); // 4.0 -> 0.9 cm2
        return {
          title: isTr ? 'Mitral Darlığı (Mitral Stenosis)' : 'Mitral Stenosis (MS)',
          meanLA,
          meanGrad,
          mva,
          summary: isTr
            ? 'Diyastolde sol atriyumdan sol ventriküle dolum kısıtlanmıştır. Bütün diyastol boyunca LA basıncı LV basıncından belirgin derecede yüksek kalarak kalıcı diyastolik gradyan oluşturur; sol atriyal dilatasyon ve pulmoner hipertansiyon kaçınılmazdır.'
            : 'Impaired diastolic emptying of left atrium into LV produces a sustained LA-LV pressure gradient throughout diastole, leading to marked LA dilation, atrial fibrillation, and secondary pulmonary hypertension.',
          auscultation: isTr
            ? 'Apeks üzerinde açılma sesi (Opening Snap, OS) ardından alçak frekanslı middiyastolik rulman ve presistolik şiddetlenme (sinüs ritminde). S1 sertleşmiştir.'
            : 'Loud S1 followed by high-pitched Opening Snap (OS) and low-pitched mid-diastolic decrescendo-crescendo rumbling murmur at apex in left lateral position.',
          criteria: isTr
            ? `Ciddi MS Kriterleri: Mitral Kapak Alanı (MVA) ≤ 1.5 cm² (Çok ciddi ≤ 1.0 cm²), Ortalama Gradyan ≥ 5-10 mmHg, PHT ≥ 150 ms.`
            : `Severe MS Criteria: Mitral Valve Area (MVA) ≤ 1.5 cm² (Very severe ≤ 1.0 cm²), Mean Gradient ≥ 5-10 mmHg, PHT ≥ 150 ms.`
        };
      }
      case 'mr': {
        const vWave = Math.round(10 + factor * 45); // 10 -> 55 mmHg
        const regVol = Math.round(factor * 70); // 0 -> 70 mL
        const regFrac = Math.round(factor * 62); // 0 -> 62%
        const ero = (factor * 0.55).toFixed(2); // 0 -> 0.55 cm2
        return {
          title: isTr ? 'Mitral Yetersizliği (Mitral Regurgitation)' : 'Mitral Regurgitation (MR)',
          vWave,
          regVol,
          regFrac,
          ero,
          summary: isTr
            ? 'Ventrikül sistolü sırasında kanın sol atriyuma kaçması, LA basınç trasesinde dev sistolik "v dalgası" oluşturur. İzovolümetrik kontraksiyon fazı ortadan kalkar; sol atriyum basıncı sistolde dramatik olarak fırlar.'
            : 'Systolic regurgitant flow into the compliant LA produces a prominent, giant systolic v-wave. Abolishes pure isovolumic phases and subjects the pulmonary venous bed to acute pressure spikes.',
          auscultation: isTr
            ? 'Apekste duyulan, aksillaya yayılan holosistolik (pansistolik) üfürüm. S1 hafifleyebilir; S3 dolum gallopu hacim aşırı yükünü gösterir.'
            : 'Holosystolic (pansystolic) blowing murmur at apex radiating to left axilla. Soft S1, prominent S3 gallop reflecting rapid early diastolic filling.',
          criteria: isTr
            ? `Ciddi MR Kriterleri: EROA ≥ 0.40 cm², Regürjitan Hacim ≥ 60 mL, Vena Contracta ≥ 7 mm, Regürjitan Fraksiyon ≥ 50%.`
            : `Severe MR Criteria: EROA ≥ 0.40 cm², Regurgitant Volume ≥ 60 mL, Vena Contracta ≥ 7 mm, Regurgitant Fraction ≥ 50%.`
        };
      }
      default: {
        return {
          title: isTr ? 'Normal Fizyolojik Basınç Eğrileri' : 'Normal Physiological Pressure Traces',
          summary: isTr
            ? 'Sol ventrikül tepe sistolik basıncı (120 mmHg) aort tepe basıncı ile özdeştir (gradyan 0 mmHg). Diyastolde sol ventrikül ve sol atriyum basınçları dengededir (gradyan yok).'
            : 'LV peak systolic pressure matches aortic pressure with zero transvalvular gradient. Diastolic LV and LA pressures equilibrate normally.',
          auscultation: isTr ? 'Normal S1 ve S2 kalp sesleri, patolojik üfürüm veya ek ses duyulmaz.' : 'Normal S1 and S2 heart sounds, physiological split, no pathological murmurs.',
          criteria: isTr ? 'Aort/Mitral kapak yaprakçıkları ince, hareketli ve tam koaptasyondadır.' : 'Thin, pliable aortic and mitral leaflets with complete coaptation and laminar flow.'
        };
      }
    }
  }

  function renderPressureCurves() {
    const isTr = lang === 'tr';
    const width = 640;
    const height = 360;
    const padding = { top: 30, right: 30, bottom: 45, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxPressure = currentLesion === 'as' ? 230 : (currentLesion === 'ar' ? 180 : 150);
    const scaleY = (p) => padding.top + ((maxPressure - p) / maxPressure) * plotH;
    const scaleX = (tPct) => padding.left + (tPct / 100) * plotW;

    // Generate path data across 100 time points (t = 0 to 100% of cardiac cycle)
    // Systole: 0 to 38%
    // Diastole: 38% to 100%
    const f = severity / 100;

    const pointsLV = [];
    const pointsAo = [];
    const pointsLA = [];

    for (let i = 0; i <= 100; i++) {
      const t = i;
      let pLV = 10;
      let pAo = 80;
      let pLA = 8;

      if (currentLesion === 'as') {
        // Aortic Stenosis: LV reaches huge peak (e.g. 120 + 90*f = 210)
        const peakLV = 120 + 90 * f;
        const peakAo = 120 - 15 * f;
        if (t <= 38) {
          const st = t / 38;
          pLV = 10 + (peakLV - 10) * Math.sin(st * Math.PI);
          // Aorta delayed peak
          pAo = st < 0.15 ? 80 : 80 + (peakAo - 80) * Math.sin(((st - 0.15) / 0.85) * Math.PI);
        } else {
          const dt = (t - 38) / 62;
          pLV = 8 + 4 * Math.exp(-dt * 4) + (dt > 0.8 ? 5 * (dt - 0.8) * 5 : 0);
          pAo = peakAo - (peakAo - 80) * (1 - Math.exp(-dt * 2.2));
        }
        pLA = 8 + (t > 85 ? 6 : 2);
      } else if (currentLesion === 'ar') {
        // Aortic Regurgitation: rapid diastolic runoff in aorta, elevated LVEDP
        const sbp = 120 + 40 * f;
        const dbp = 80 - 45 * f;
        if (t <= 38) {
          const st = t / 38;
          pLV = 15 + (sbp - 15) * Math.sin(st * Math.PI);
          pAo = st < 0.1 ? dbp : dbp + (sbp - dbp) * Math.sin(((st - 0.1) / 0.9) * Math.PI);
        } else {
          const dt = (t - 38) / 62;
          // Rapid runoff
          pAo = sbp - (sbp - dbp) * Math.pow(dt, 0.7);
          // Rapid equilibration of LVEDP towards aortic pressure
          pLV = 10 + (25 * f) * Math.pow(dt, 0.8);
        }
        pLA = 8 + (t > 85 ? 8 : 3);
      } else if (currentLesion === 'ms') {
        // Mitral Stenosis: LA pressure elevated, slow diastolic decay, persisting gradient
        const peakLA = 8 + 22 * f;
        if (t <= 38) {
          const st = t / 38;
          pLV = 8 + (120 - 8) * Math.sin(st * Math.PI);
          pAo = st < 0.12 ? 80 : 80 + 40 * Math.sin(((st - 0.12) / 0.88) * Math.PI);
          pLA = peakLA - 4 * Math.sin(st * Math.PI);
        } else {
          const dt = (t - 38) / 62;
          pLV = 6 + 4 * (1 - Math.exp(-dt * 3));
          pAo = 120 - 40 * (1 - Math.exp(-dt * 2));
          // LA remains way above LV
          pLA = peakLA - (6 * f) * dt + (dt > 0.8 ? 5 * f : 0);
        }
      } else if (currentLesion === 'mr') {
        // Mitral Regurgitation: giant systolic v-wave in LA
        const vPeak = 10 + 45 * f;
        if (t <= 38) {
          const st = t / 38;
          pLV = 10 + 115 * Math.sin(st * Math.PI);
          pAo = st < 0.12 ? 78 : 78 + 38 * Math.sin(((st - 0.12) / 0.88) * Math.PI);
          // Giant v wave peaking at late systole
          pLA = 10 + (vPeak - 10) * Math.pow(st, 1.4);
        } else {
          const dt = (t - 38) / 62;
          pLV = 8 + 6 * (1 - Math.exp(-dt * 3));
          pAo = 116 - 38 * (1 - Math.exp(-dt * 2));
          pLA = 10 + (vPeak - 10) * Math.exp(-dt * 6) + (dt > 0.8 ? 4 : 0);
        }
      } else {
        // Normal
        if (t <= 38) {
          const st = t / 38;
          pLV = 8 + 112 * Math.sin(st * Math.PI);
          pAo = st < 0.12 ? 80 : 80 + 40 * Math.sin(((st - 0.12) / 0.88) * Math.PI);
          pLA = 8 + 4 * Math.sin(st * Math.PI * 2);
        } else {
          const dt = (t - 38) / 62;
          pLV = 6 + 4 * (1 - Math.exp(-dt * 3));
          pAo = 120 - 40 * (1 - Math.exp(-dt * 2));
          pLA = 7 + (dt > 0.8 ? 4 : 1);
        }
      }

      pointsLV.push({ x: scaleX(t), y: scaleY(Math.max(0, pLV)), p: pLV });
      pointsAo.push({ x: scaleX(t), y: scaleY(Math.max(0, pAo)), p: pAo });
      pointsLA.push({ x: scaleX(t), y: scaleY(Math.max(0, pLA)), p: pLA });
    }

    const pathLV = pointsLV.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const pathAo = pointsAo.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const pathLA = pointsLA.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    // Gradient shading between LV and Ao for AS
    let gradientFillAS = '';
    if (currentLesion === 'as') {
      const asPoints = [];
      for (let i = 0; i <= 38; i++) {
        asPoints.push(`${pointsLV[i].x.toFixed(1)},${pointsLV[i].y.toFixed(1)}`);
      }
      for (let i = 38; i >= 0; i--) {
        asPoints.push(`${pointsAo[i].x.toFixed(1)},${pointsAo[i].y.toFixed(1)}`);
      }
      gradientFillAS = `<polygon points="${asPoints.join(' ')}" fill="rgba(239, 68, 68, 0.22)" stroke="none" />`;
    }

    // Gradient shading between LA and LV for MS
    let gradientFillMS = '';
    if (currentLesion === 'ms') {
      const msPoints = [];
      for (let i = 38; i <= 100; i++) {
        msPoints.push(`${pointsLA[i].x.toFixed(1)},${pointsLA[i].y.toFixed(1)}`);
      }
      for (let i = 100; i >= 38; i--) {
        msPoints.push(`${pointsLV[i].x.toFixed(1)},${pointsLV[i].y.toFixed(1)}`);
      }
      gradientFillMS = `<polygon points="${msPoints.join(' ')}" fill="rgba(6, 182, 212, 0.25)" stroke="none" />`;
    }

    const gridLines = [];
    for (let p = 40; p <= maxPressure - 10; p += 40) {
      gridLines.push(`
        <line x1="${padding.left}" y1="${scaleY(p)}" x2="${width - padding.right}" y2="${scaleY(p)}" stroke="var(--border, #cbd5e1)" stroke-dasharray="3 3" opacity="0.6"/>
        <text x="${padding.left - 8}" y="${scaleY(p) + 4}" text-anchor="end" font-size="10" fill="var(--text-sub, #64748b)">${p}</text>
      `);
    }

    return `
      <svg viewBox="0 0 ${width} ${height}" class="valvular-svg">
        <!-- Cardiac Phase Backgrounds -->
        <!-- Systole: 0 to 38% -->
        <rect x="${scaleX(0)}" y="${padding.top}" width="${scaleX(38) - scaleX(0)}" height="${plotH}"
          fill="rgba(239, 68, 68, 0.04)" />
        <text x="${(scaleX(0) + scaleX(38)) / 2}" y="${padding.top + 16}" text-anchor="middle" font-size="11" font-weight="700" fill="#dc2626">
          ${isTr ? 'SİSTOL' : 'SYSTOLE'}
        </text>

        <!-- Diastole: 38% to 100% -->
        <rect x="${scaleX(38)}" y="${padding.top}" width="${scaleX(100) - scaleX(38)}" height="${plotH}"
          fill="rgba(59, 130, 246, 0.04)" />
        <text x="${(scaleX(38) + scaleX(100)) / 2}" y="${padding.top + 16}" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb">
          ${isTr ? 'DİYASTOL' : 'DIASTOLE'}
        </text>

        <!-- Valve Events Markers -->
        <line x1="${scaleX(38)}" y1="${padding.top}" x2="${scaleX(38)}" y2="${height - padding.bottom}"
          stroke="var(--border, #94a3b8)" stroke-width="1.5" stroke-dasharray="4 2" />

        ${gridLines.join('')}

        <!-- Gradient fills -->
        ${gradientFillAS}
        ${gradientFillMS}

        <!-- Pressure Traces -->
        <!-- LV: Red -->
        <path d="${pathLV}" fill="none" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round" />
        <!-- Aorta: Amber/Orange -->
        <path d="${pathAo}" fill="none" stroke="#d97706" stroke-width="2.4" stroke-dasharray="${currentLesion === 'ar' ? 'none' : 'none'}" />
        <!-- LA: Blue -->
        <path d="${pathLA}" fill="none" stroke="#0284c7" stroke-width="2.2" />

        <!-- Axis Lines -->
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="var(--border, #94a3b8)" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="var(--border, #94a3b8)" stroke-width="1.5" />

        <!-- Axis Labels -->
        <text x="${padding.left + plotW / 2}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
          ${isTr ? 'Kardiyak Döngü Zamanı (% Zaman) →' : 'Cardiac Cycle Time (% Cycle) →'}
        </text>
        <text transform="rotate(-90)" x="${-(padding.top + plotH / 2)}" y="16" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-main, #1e293b)">
          ${isTr ? 'Basınç (mmHg) →' : 'Pressure (mmHg) →'}
        </text>
      </svg>
    `;
  }

  function render() {
    const isTr = lang === 'tr';
    const details = getLesionDetails(currentLesion, severity);

    container.innerHTML = `
      <div class="valvular-layout">
        <!-- Main Plot Card -->
        <div class="valvular-main-card">
          <div class="lab-card-header">
            <div>
              <h2 class="lab-title">${isTr ? 'Kapak Patolojileri & Dinamik Basınç Gradyanları' : 'Valvular Disease & Dynamic Pressure Gradients'}</h2>
              <p class="lab-desc">${isTr ? 'Eşzamanlı Sol Ventrikül (LV), Sol Atriyum (LA) ve Aort basınç traseleri üzerinde patolojik gradyanlar ve volüm aşırı yükü.' : 'Simultaneous LV, LA, and Aorta pressure waveforms illustrating transvalvular pressure gradients and volume overload.'}</p>
            </div>
            <div class="lesion-badge">
              ${LESIONS.find(l => l.id === currentLesion)?.[isTr ? 'badgeTr' : 'badgeEn'] || ''}
            </div>
          </div>

          <!-- Lesion Selector Buttons -->
          <div class="preset-pill-group">
            <span class="preset-label">${isTr ? 'Kapak Lezyonu:' : 'Valve Lesion:'}</span>
            ${LESIONS.map(l => `
              <button type="button" class="preset-pill ${currentLesion === l.id ? 'active' : ''}" data-lesion-id="${l.id}">
                ${isTr ? l.nameTr : l.nameEn}
              </button>
            `).join('')}
          </div>

          <!-- Plot Area -->
          <div class="valvular-stage-container">
            ${renderPressureCurves()}
            <div class="waveform-legend">
              <span class="legend-chip"><span class="legend-color-dot" style="background: #dc2626;"></span> ${isTr ? 'Sol Ventrikül (LV)' : 'Left Ventricle (LV)'}</span>
              <span class="legend-chip"><span class="legend-color-dot" style="background: #d97706;"></span> ${isTr ? 'Aort (Ao)' : 'Aorta (Ao)'}</span>
              <span class="legend-chip"><span class="legend-color-dot" style="background: #0284c7;"></span> ${isTr ? 'Sol Atriyum (LA)' : 'Left Atrium (LA)'}</span>
            </div>
          </div>

          <!-- Severity Slider -->
          <div class="controls-grid" style="margin-top: 1rem;">
            <div class="control-box">
              <div class="control-header">
                <label for="valvular-severity-slider"><strong>${isTr ? 'Lezyon Ağırlığı (Darlık / Yetersizlik Derecesi)' : 'Lesion Severity (Stenosis / Regurgitation)'}</strong></label>
                <span class="control-val">%${severity} (${severity < 35 ? (isTr ? 'Hafif' : 'Mild') : (severity < 70 ? (isTr ? 'Orta' : 'Moderate') : (isTr ? 'İleri / Ciddi' : 'Severe'))})</span>
              </div>
              <input type="range" id="valvular-severity-slider" min="5" max="100" step="5" value="${severity}" class="range-slider" />
              <div class="slider-caption">${isTr ? 'Derece arttıkça basınç gradyanı, geriye kaçış fraksiyonu ve patolojik hemodinamik bozulma katlanır.' : 'Higher severity compounds transvalvular gradients, regurgitant fraction, and clinical hemodynamic compromise.'}</div>
            </div>
          </div>
        </div>

        <!-- Right Diagnostic Column -->
        <div class="valvular-side-panel">
          <!-- Numerical Gradient Readout -->
          <div class="metrics-card">
            <h3 class="metrics-title">${isTr ? 'Kantitatif Hemodinamik Ölçümler' : 'Quantitative Hemodynamic Readout'}</h3>
            <div class="metrics-grid">
              ${currentLesion === 'as' ? `
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Tepe LV Basıncı' : 'Peak LV Pressure'}</span>
                  <span class="metric-num">${details.peakLV} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Tepe Gradyan' : 'Peak Gradient'}</span>
                  <span class="metric-num" style="color: #dc2626;">${details.grad} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Ortalama Gradyan' : 'Mean Gradient'}</span>
                  <span class="metric-num" style="color: #ea580c;">${details.meanGrad} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Aort Kapak Alanı' : 'Valve Area (AVA)'}</span>
                  <span class="metric-num">${details.ava} <small>cm²</small></span>
                </div>
              ` : ''}

              ${currentLesion === 'ar' ? `
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Sistolik KB' : 'Systolic BP'}</span>
                  <span class="metric-num">${details.sbp} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Diyastolik KB' : 'Diastolic BP'}</span>
                  <span class="metric-num" style="color: #0284c7;">${details.dbp} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Nabız Basıncı' : 'Pulse Pressure'}</span>
                  <span class="metric-num" style="color: #ea580c;">${details.pp} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Kaçış Hacmi' : 'Regurgitant Vol'}</span>
                  <span class="metric-num">${details.regVol} <small>mL</small></span>
                </div>
              ` : ''}

              ${currentLesion === 'ms' ? `
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Ortalama LA Basıncı' : 'Mean LA Pressure'}</span>
                  <span class="metric-num" style="color: #0284c7;">${details.meanLA} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Ortalama Gradyan' : 'Mean Gradient'}</span>
                  <span class="metric-num" style="color: #dc2626;">${details.meanGrad} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Mitral Alan (MVA)' : 'Valve Area (MVA)'}</span>
                  <span class="metric-num">${details.mva} <small>cm²</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'PHT Süresi' : 'Pressure Half-Time'}</span>
                  <span class="metric-num">${Math.round(220 / parseFloat(details.mva))} <small>ms</small></span>
                </div>
              ` : ''}

              ${currentLesion === 'mr' ? `
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Tepe v Dalgası' : 'Peak v Wave'}</span>
                  <span class="metric-num" style="color: #dc2626;">${details.vWave} <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Kaçış Hacmi' : 'Regurgitant Vol'}</span>
                  <span class="metric-num">${details.regVol} <small>mL</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Kaçış Fraksiyonu' : 'Regurgitant Frac'}</span>
                  <span class="metric-num" style="color: #ea580c;">%${details.regFrac}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">${isTr ? 'Etkin Delik (EROA)' : 'Effective Orifice'}</span>
                  <span class="metric-num">${details.ero} <small>cm²</small></span>
                </div>
              ` : ''}

              ${currentLesion === 'normal' ? `
                <div class="metric-item">
                  <span class="metric-lbl">LV Sistolik</span>
                  <span class="metric-num">120 <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">Aort Sistolik</span>
                  <span class="metric-num">120 <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">LV-Ao Gradyanı</span>
                  <span class="metric-num">0 <small>mmHg</small></span>
                </div>
                <div class="metric-item">
                  <span class="metric-lbl">Ortalama LA</span>
                  <span class="metric-num">8 <small>mmHg</small></span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Hemodynamic Mechanism -->
          <div class="clinical-desc-box">
            <h4>${isTr ? 'Fizyopatolojik Mekanizma' : 'Pathophysiological Mechanism'}</h4>
            <p>${details.summary}</p>
          </div>

          <!-- Auscultation -->
          <div class="clinical-desc-box">
            <h4>${isTr ? 'Oskültasyon ve Fizik Muayene' : 'Auscultation & Physical Signs'}</h4>
            <p>${details.auscultation}</p>
          </div>

          <!-- Guideline Criteria -->
          <div class="clinical-desc-box management-box">
            <h4>${isTr ? 'Kılavuz Ağırlık / Ciddiyet Kriterleri' : 'Guideline Severity Criteria'}</h4>
            <p>${details.criteria}</p>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const slider = container.querySelector('#valvular-severity-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        severity = parseInt(e.target.value, 10);
        render();
      });
    }

    container.querySelectorAll('[data-lesion-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentLesion = btn.dataset.lesionId;
        render();
      });
    });
  }

  render();

  return {
    updateLanguage: (newLang) => {
      lang = newLang;
      render();
    }
  };
}
