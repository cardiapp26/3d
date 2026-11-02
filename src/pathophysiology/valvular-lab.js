// Valvular Hemodynamics Lab: Simultaneous LV, LA, and Aorta pressure curves, valve motion, and animated blood flow
export function createValvularLab(opts = {}) {
  const container = opts.container || opts.mount;
  let lang = typeof opts.getLang === 'function' ? opts.getLang() : (opts.lang || 'tr');
  let currentLesion = 'as'; // 'normal', 'as', 'ar', 'ms', 'mr'
  let severity = 75; // 0 to 100%

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let paused = Boolean(reducedMotion);
  let speed = 1;
  let cyclePhase = 18; // 0..100 (% of cardiac cycle; 0..38 systole, 38..100 diastole)
  let rafId = null;
  let lastTs = 0;

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

  // Particle state for continuous circulation & jet dynamics
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    role: i < 18 ? 'forward' : 'jet',
    progress: (i / 28) % 1,
    lane: ((i * 37) % 100) / 100 - 0.5
  }));

  function samplePressuresAt(tPct, lesion, sev) {
    const f = sev / 100;
    const t = ((tPct % 100) + 100) % 100;
    let pLV = 10;
    let pAo = 80;
    let pLA = 8;

    if (lesion === 'as') {
      const peakLV = 120 + 90 * f;
      const peakAo = 120 - 15 * f;
      if (t <= 38) {
        const st = t / 38;
        pLV = 10 + (peakLV - 10) * Math.sin(st * Math.PI);
        pAo = st < 0.15 ? 80 : 80 + (peakAo - 80) * Math.sin(((st - 0.15) / 0.85) * Math.PI);
      } else {
        const dt = (t - 38) / 62;
        pLV = 8 + 4 * Math.exp(-dt * 4) + (dt > 0.8 ? 5 * (dt - 0.8) * 5 : 0);
        pAo = peakAo - (peakAo - 80) * (1 - Math.exp(-dt * 2.2));
      }
      pLA = 8 + (t > 85 ? 6 : 2);
    } else if (lesion === 'ar') {
      const sbp = 120 + 40 * f;
      const dbp = 80 - 45 * f;
      if (t <= 38) {
        const st = t / 38;
        pLV = 15 + (sbp - 15) * Math.sin(st * Math.PI);
        pAo = st < 0.1 ? dbp : dbp + (sbp - dbp) * Math.sin(((st - 0.1) / 0.9) * Math.PI);
      } else {
        const dt = (t - 38) / 62;
        pAo = sbp - (sbp - dbp) * Math.pow(dt, 0.7);
        pLV = 10 + (25 * f) * Math.pow(dt, 0.8);
      }
      pLA = 8 + (t > 85 ? 8 : 3);
    } else if (lesion === 'ms') {
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
        pLA = peakLA - (6 * f) * dt + (dt > 0.8 ? 5 * f : 0);
      }
    } else if (lesion === 'mr') {
      const vPeak = 10 + 45 * f;
      if (t <= 38) {
        const st = t / 38;
        pLV = 10 + 115 * Math.sin(st * Math.PI);
        pAo = st < 0.12 ? 78 : 78 + 38 * Math.sin(((st - 0.12) / 0.88) * Math.PI);
        pLA = 10 + (vPeak - 10) * Math.pow(st, 1.4);
      } else {
        const dt = (t - 38) / 62;
        pLV = 8 + 6 * (1 - Math.exp(-dt * 3));
        pAo = 116 - 38 * (1 - Math.exp(-dt * 2));
        pLA = 10 + (vPeak - 10) * Math.exp(-dt * 6) + (dt > 0.8 ? 4 : 0);
      }
    } else {
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
    return { pLV: Math.max(0, pLV), pAo: Math.max(0, pAo), pLA: Math.max(0, pLA) };
  }

  function getLesionDetails(lesion, sev) {
    const isTr = lang === 'tr';
    const factor = sev / 100;

    switch (lesion) {
      case 'as': {
        const peakLV = Math.round(120 + factor * 90);
        const peakAo = Math.round(120 - factor * 15);
        const peakGrad = peakLV - peakAo;
        const meanGrad = Math.round(peakGrad * 0.65);
        const ava = (2.5 - factor * 1.9).toFixed(2);
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
            ? 'Ciddi AS Kriterleri: AVA < 1.0 cm² (veya AVAi < 0.6 cm²/m²), Ortalama Gradyan ≥ 40 mmHg, Tepe Hız Vmax ≥ 4.0 m/s.'
            : 'Severe AS Criteria: AVA < 1.0 cm² (or indexed AVA < 0.6 cm²/m²), Mean Gradient ≥ 40 mmHg, Peak Velocity Vmax ≥ 4.0 m/s.'
        };
      }
      case 'ar': {
        const sbp = Math.round(120 + factor * 40);
        const dbp = Math.round(80 - factor * 45);
        const pp = sbp - dbp;
        const regVol = Math.round(factor * 75);
        const regFrac = Math.round(factor * 60);
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
            ? 'Ciddi AR Kriterleri: Regürjitan Fraksiyon ≥ 50%, Regürjitan Hacim ≥ 60 mL, Vena Contracta > 6 mm, PHT < 200 ms.'
            : 'Severe AR Criteria: Regurgitant Fraction ≥ 50%, Regurgitant Volume ≥ 60 mL, Vena Contracta > 6 mm, Pressure Half-Time (PHT) < 200 ms.'
        };
      }
      case 'ms': {
        const meanLA = Math.round(8 + factor * 22);
        const meanGrad = Math.round(factor * 16);
        const mva = (4.0 - factor * 3.1).toFixed(2);
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
            ? 'Ciddi MS Kriterleri: Mitral Kapak Alanı (MVA) ≤ 1.5 cm² (Çok ciddi ≤ 1.0 cm²), Ortalama Gradyan ≥ 5-10 mmHg, PHT ≥ 150 ms.'
            : 'Severe MS Criteria: Mitral Valve Area (MVA) ≤ 1.5 cm² (Very severe ≤ 1.0 cm²), Mean Gradient ≥ 5-10 mmHg, PHT ≥ 150 ms.'
        };
      }
      case 'mr': {
        const vWave = Math.round(10 + factor * 45);
        const regVol = Math.round(factor * 70);
        const regFrac = Math.round(factor * 62);
        const ero = (factor * 0.55).toFixed(2);
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
            ? 'Ciddi MR Kriterleri: EROA ≥ 0.40 cm², Regürjitan Hacim ≥ 60 mL, Vena Contracta ≥ 7 mm, Regürjitan Fraksiyon ≥ 50%.'
            : 'Severe MR Criteria: EROA ≥ 0.40 cm², Regurgitant Volume ≥ 60 mL, Vena Contracta ≥ 7 mm, Regurgitant Fraction ≥ 50%.'
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

  function renderAnimatedFlowScene() {
    const isTr = lang === 'tr';
    const f = severity / 100;

    // Build Phonocardiogram (PCG) murmur envelope path across x = 445..615
    const pcgLeft = 442;
    const pcgRight = 618;
    const pcgW = pcgRight - pcgLeft;
    const pcgMidY = 128;
    const pcgX = (pct) => pcgLeft + (pct / 100) * pcgW;

    const murmurBars = [];
    for (let p = 2; p <= 98; p += 3) {
      let amp = 1.5;
      if (currentLesion === 'as' && p > 4 && p < 36) {
        // Diamond-shaped systolic crescendo-decrescendo
        amp = 3 + 22 * f * Math.sin(((p - 4) / 32) * Math.PI);
      } else if (currentLesion === 'mr' && p >= 2 && p <= 37) {
        // Holosystolic plateau murmur
        amp = 4 + 17 * f;
      } else if (currentLesion === 'ar' && p >= 40 && p <= 88) {
        // Early diastolic decrescendo murmur
        amp = 2 + 20 * f * Math.exp(-((p - 40) / 30));
      } else if (currentLesion === 'ms' && p >= 46 && p <= 96) {
        // Opening snap + mid-diastolic rumble + presystolic accentuation
        const dt = (p - 46) / 50;
        amp = 3 + 14 * f * (Math.exp(-dt * 2.2) + (dt > 0.72 ? (dt - 0.72) * 3.2 : 0));
      }
      const x = pcgX(p).toFixed(1);
      const color = (currentLesion === 'as' || currentLesion === 'mr') ? '#dc2626' : '#0284c7';
      murmurBars.push(`<line x1="${x}" y1="${(pcgMidY - amp).toFixed(1)}" x2="${x}" y2="${(pcgMidY + amp).toFixed(1)}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${currentLesion === 'normal' ? 0.25 : 0.85}"/>`);
    }

    return `
      <svg viewBox="0 0 640 195" class="pathophys-svg valvular-flow-svg" role="img" aria-label="${isTr ? 'Canlı Kapak Hareketi, Kan Akımı ve Fonokardiyogram' : 'Live Valve Motion, Blood Flow Traffic and Phonocardiogram'}">
        <defs>
          <linearGradient id="valvLaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e0f2fe"/>
            <stop offset="100%" stop-color="#bae6fd"/>
          </linearGradient>
          <linearGradient id="valvLvGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fee2e2"/>
            <stop offset="100%" stop-color="#fecaca"/>
          </linearGradient>
          <linearGradient id="valvAoGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fef3c7"/>
            <stop offset="100%" stop-color="#fde68a"/>
          </linearGradient>
        </defs>

        <!-- Left Box: Animated LA -> MV -> LV -> AV -> Aorta Hemodynamic Conduit -->
        <rect x="10" y="10" width="415" height="175" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="22" y="28" font-size="11" font-weight="800" fill="#0f172a">
          ${isTr ? 'Canlı Sol Kalp Kapak Kinetiği ve Kan Akımı' : 'Live Left Heart Valve Kinetics & Blood Flow'}
        </text>
        <text x="412" y="28" text-anchor="end" font-size="10.5" font-weight="800" fill="#dc2626" data-valv-phase-tag>
          ${isTr ? 'SİSTOL' : 'SYSTOLE'}
        </text>

        <!-- Pulmonary Vein Inflow stub -->
        <path d="M 18 88 H 48 M 18 118 H 48" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>

        <!-- Left Atrium (LA) Chamber -->
        <g data-valv-la-group>
          <ellipse data-valv-la-chamber cx="92" cy="103" rx="46" ry="42" fill="url(#valvLaGrad)" stroke="#0284c7" stroke-width="3.5"/>
          <text x="86" y="75" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0369a1">LA</text>
        </g>

        <!-- Left Ventricle (LV) Chamber -->
        <g data-valv-lv-group>
          <ellipse data-valv-lv-chamber cx="215" cy="103" rx="68" ry="48" fill="url(#valvLvGrad)" stroke="#dc2626" stroke-width="5"/>
          <text x="215" y="70" text-anchor="middle" font-size="12" font-weight="800" fill="#991b1b">LV</text>
        </g>

        <!-- Ascending Aorta (Ao) Conduit -->
        <g data-valv-ao-group>
          <path data-valv-ao-chamber d="M 282 74 C 335 72, 378 74, 412 80 L 412 126 C 378 132, 335 134, 282 132 Z" fill="url(#valvAoGrad)" stroke="#d97706" stroke-width="3.5"/>
          <text x="362" y="66" text-anchor="middle" font-size="11.5" font-weight="800" fill="#b45309">${isTr ? 'Aort (Ao)' : 'Aorta (Ao)'}</text>
        </g>

        <!-- Mitral Valve (MV) Leaflets at x=142 -->
        <g data-valv-mv>
          <line data-mv-upper x1="140" y1="74" x2="148" y2="101" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
          <line data-mv-lower x1="140" y1="132" x2="148" y2="105" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
          <text x="142" y="152" text-anchor="middle" font-size="9.5" font-weight="800" fill="#334155">MV</text>
        </g>

        <!-- Aortic Valve (AV) Leaflets at x=282 -->
        <g data-valv-av>
          <line data-av-upper x1="280" y1="76" x2="294" y2="92" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
          <line data-av-lower x1="280" y1="130" x2="294" y2="114" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
          <text x="284" y="152" text-anchor="middle" font-size="9.5" font-weight="800" fill="#78350f">AV</text>
        </g>

        <!-- Dynamic Particle Layer -->
        <g data-valv-particles>
          ${particles.map(p => `
            <circle class="valvular-particle hf-live-particle" data-vp-id="${p.id}" cx="120" cy="103" r="${p.role === 'jet' ? 4.2 : 5}"
              fill="${p.role === 'jet' ? '#f59e0b' : '#dc2626'}" stroke="#ffffff" stroke-width="1.2"/>
          `).join('')}
        </g>

        <!-- Jet Legend Caption -->
        <text x="215" y="175" text-anchor="middle" font-size="10" font-weight="700" fill="#475569" data-valv-jet-caption></text>

        <!-- Right Box: Synchronized Phonocardiogram (PCG) Auscultation Strip -->
        <rect x="432" y="10" width="198" height="175" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="444" y="28" font-size="11" font-weight="800" fill="#0f172a">
          ${isTr ? 'Canlı Fonokardiyogram (PCG)' : 'Live Phonocardiogram (PCG)'}
        </text>
        <text x="444" y="43" font-size="9.5" font-weight="700" fill="#64748b">
          ${currentLesion === 'as' ? (isTr ? 'Sistolik Elmas Üfürüm' : 'Systolic Diamond Murmur')
            : currentLesion === 'ar' ? (isTr ? 'Erken Diyastolik Dekreşendo' : 'Early Diastolic Decrescendo')
            : currentLesion === 'ms' ? (isTr ? 'OS + Diyastolik Rulman' : 'OS + Diastolic Rumble')
            : currentLesion === 'mr' ? (isTr ? 'Holosistolik Üfürüm' : 'Holosystolic Murmur')
            : (isTr ? 'Normal S1 - S2 Sesleri' : 'Normal S1 - S2 Sounds')}
        </text>

        <line x1="${pcgLeft}" y1="${pcgMidY}" x2="${pcgRight}" y2="${pcgMidY}" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- S1 and S2 Heart Sound Spikes -->
        <rect x="${pcgX(1) - 3}" y="${pcgMidY - (currentLesion === 'ms' ? 32 : 24)}" width="6" height="${(currentLesion === 'ms' ? 64 : 48)}" rx="2" fill="#0f172a"/>
        <text x="${pcgX(1)}" y="${pcgMidY + 38}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0f172a">S1</text>

        <rect x="${pcgX(38) - 3}" y="${pcgMidY - 24}" width="6" height="48" rx="2" fill="#0f172a"/>
        <text x="${pcgX(38)}" y="${pcgMidY + 38}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0f172a">S2</text>

        ${currentLesion === 'ms' ? `
          <rect x="${pcgX(45) - 2}" y="${pcgMidY - 18}" width="4" height="36" rx="1.5" fill="#0284c7"/>
          <text x="${pcgX(45)}" y="${pcgMidY - 22}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0284c7">OS</text>
        ` : ''}

        <!-- Murmur Envelope Bars -->
        <g>${murmurBars.join('')}</g>

        <!-- Sweeping PCG Playhead -->
        <line data-valv-pcg-cursor x1="${pcgX(cyclePhase)}" y1="54" x2="${pcgX(cyclePhase)}" y2="172" stroke="#dc2626" stroke-width="2"/>
      </svg>
    `;
  }

  function renderPressureCurves() {
    const isTr = lang === 'tr';
    const width = 640;
    const height = 340;
    const padding = { top: 30, right: 30, bottom: 45, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxPressure = currentLesion === 'as' ? 230 : (currentLesion === 'ar' ? 180 : 150);
    const scaleY = (p) => padding.top + ((maxPressure - p) / maxPressure) * plotH;
    const scaleX = (tPct) => padding.left + (tPct / 100) * plotW;

    const pointsLV = [];
    const pointsAo = [];
    const pointsLA = [];

    for (let i = 0; i <= 100; i++) {
      const { pLV, pAo, pLA } = samplePressuresAt(i, currentLesion, severity);
      pointsLV.push({ x: scaleX(i), y: scaleY(pLV), p: pLV });
      pointsAo.push({ x: scaleX(i), y: scaleY(pAo), p: pAo });
      pointsLA.push({ x: scaleX(i), y: scaleY(pLA), p: pLA });
    }

    const pathLV = pointsLV.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const pathAo = pointsAo.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const pathLA = pointsLA.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    let gradientFillAS = '';
    if (currentLesion === 'as') {
      const asPoints = [];
      for (let i = 0; i <= 38; i++) asPoints.push(`${pointsLV[i].x.toFixed(1)},${pointsLV[i].y.toFixed(1)}`);
      for (let i = 38; i >= 0; i--) asPoints.push(`${pointsAo[i].x.toFixed(1)},${pointsAo[i].y.toFixed(1)}`);
      gradientFillAS = `<polygon points="${asPoints.join(' ')}" fill="rgba(239, 68, 68, 0.22)" stroke="none" />`;
    }

    let gradientFillMS = '';
    if (currentLesion === 'ms') {
      const msPoints = [];
      for (let i = 38; i <= 100; i++) msPoints.push(`${pointsLA[i].x.toFixed(1)},${pointsLA[i].y.toFixed(1)}`);
      for (let i = 100; i >= 38; i--) msPoints.push(`${pointsLV[i].x.toFixed(1)},${pointsLV[i].y.toFixed(1)}`);
      gradientFillMS = `<polygon points="${msPoints.join(' ')}" fill="rgba(6, 182, 212, 0.25)" stroke="none" />`;
    }

    const gridLines = [];
    for (let p = 40; p <= maxPressure - 10; p += 40) {
      gridLines.push(`
        <line x1="${padding.left}" y1="${scaleY(p)}" x2="${width - padding.right}" y2="${scaleY(p)}" stroke="var(--border, #cbd5e1)" stroke-dasharray="3 3" opacity="0.6"/>
        <text x="${padding.left - 8}" y="${scaleY(p) + 4}" text-anchor="end" font-size="10" fill="var(--text-sub, #64748b)">${p}</text>
      `);
    }

    const cur = samplePressuresAt(cyclePhase, currentLesion, severity);
    const curX = scaleX(cyclePhase);

    return `
      <svg viewBox="0 0 ${width} ${height}" class="valvular-svg">
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

        <line x1="${scaleX(38)}" y1="${padding.top}" x2="${scaleX(38)}" y2="${height - padding.bottom}"
          stroke="var(--border, #94a3b8)" stroke-width="1.5" stroke-dasharray="4 2" />

        ${gridLines.join('')}
        ${gradientFillAS}
        ${gradientFillMS}

        <!-- Pressure Traces -->
        <path d="${pathLV}" fill="none" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round" />
        <path d="${pathAo}" fill="none" stroke="#d97706" stroke-width="2.4" />
        <path d="${pathLA}" fill="none" stroke="#0284c7" stroke-width="2.2" />

        <!-- Live Sweeping Time Cursor & Instantaneous Pressure Dots -->
        <line data-valvular-cursor x1="${curX}" y1="${padding.top}" x2="${curX}" y2="${height - padding.bottom}" stroke="#0f172a" stroke-width="1.8" stroke-dasharray="4 3"/>
        <circle data-valv-dot="lv" cx="${curX}" cy="${scaleY(cur.pLV)}" r="5.5" fill="#dc2626" stroke="#ffffff" stroke-width="1.8"/>
        <circle data-valv-dot="ao" cx="${curX}" cy="${scaleY(cur.pAo)}" r="5.5" fill="#d97706" stroke="#ffffff" stroke-width="1.8"/>
        <circle data-valv-dot="la" cx="${curX}" cy="${scaleY(cur.pLA)}" r="5.5" fill="#0284c7" stroke="#ffffff" stroke-width="1.8"/>

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

  function updateAnimationFrame(dtSec) {
    if (!container || !container.isConnected) return;
    const isTr = lang === 'tr';
    const f = severity / 100;

    // Advance cardiac cycle (1 full cycle ~ 2.4 seconds at 1x speed)
    cyclePhase = (cyclePhase + dtSec * 41.6 * speed) % 100;
    const isSystole = cyclePhase <= 38;
    const sysProgress = isSystole ? cyclePhase / 38 : 0;
    const diaProgress = !isSystole ? (cyclePhase - 38) / 62 : 0;

    // 1. Update Pressure Curve Cursor & Dots
    const maxPressure = currentLesion === 'as' ? 230 : (currentLesion === 'ar' ? 180 : 150);
    const plotW = 640 - 55 - 30;
    const plotH = 340 - 30 - 45;
    const scaleX = (tPct) => 55 + (tPct / 100) * plotW;
    const scaleY = (p) => 30 + ((maxPressure - p) / maxPressure) * plotH;

    const cur = samplePressuresAt(cyclePhase, currentLesion, severity);
    const curX = scaleX(cyclePhase).toFixed(1);
    const cursorEl = container.querySelector('[data-valvular-cursor]');
    if (cursorEl) {
      cursorEl.setAttribute('x1', curX);
      cursorEl.setAttribute('x2', curX);
    }
    const dotLv = container.querySelector('[data-valv-dot="lv"]');
    const dotAo = container.querySelector('[data-valv-dot="ao"]');
    const dotLa = container.querySelector('[data-valv-dot="la"]');
    if (dotLv) { dotLv.setAttribute('cx', curX); dotLv.setAttribute('cy', scaleY(cur.pLV).toFixed(1)); }
    if (dotAo) { dotAo.setAttribute('cx', curX); dotAo.setAttribute('cy', scaleY(cur.pAo).toFixed(1)); }
    if (dotLa) { dotLa.setAttribute('cx', curX); dotLa.setAttribute('cy', scaleY(cur.pLA).toFixed(1)); }

    // 2. Update PCG Playhead
    const pcgCursor = container.querySelector('[data-valv-pcg-cursor]');
    if (pcgCursor) {
      const px = (442 + (cyclePhase / 100) * (618 - 442)).toFixed(1);
      pcgCursor.setAttribute('x1', px);
      pcgCursor.setAttribute('x2', px);
    }

    // 3. Update Phase Tag & Chamber Contraction
    const phaseTag = container.querySelector('[data-valv-phase-tag]');
    if (phaseTag) {
      phaseTag.textContent = isSystole
        ? `${isTr ? 'SİSTOL' : 'SYSTOLE'} · LV ${Math.round(cur.pLV)} / Ao ${Math.round(cur.pAo)} mmHg`
        : `${isTr ? 'DİYASTOL' : 'DIASTOLE'} · LA ${Math.round(cur.pLA)} / LV ${Math.round(cur.pLV)} mmHg`;
      phaseTag.setAttribute('fill', isSystole ? '#dc2626' : '#0284c7');
    }

    const lvChamber = container.querySelector('[data-valv-lv-chamber]');
    if (lvChamber) {
      const squeeze = isSystole ? Math.sin(sysProgress * Math.PI) : 0;
      const baseRy = (currentLesion === 'ar' || currentLesion === 'mr') ? 48 + 8 * f : 46;
      const ry = baseRy * (1 - 0.24 * squeeze);
      const rx = 68 * (1 - 0.14 * squeeze);
      lvChamber.setAttribute('rx', rx.toFixed(1));
      lvChamber.setAttribute('ry', ry.toFixed(1));
    }

    const laChamber = container.querySelector('[data-valv-la-chamber]');
    if (laChamber) {
      const mrExpand = currentLesion === 'mr' && isSystole ? 7 * f * Math.sin(sysProgress * Math.PI) : 0;
      const msBase = (currentLesion === 'ms' || currentLesion === 'mr') ? 43 + 7 * f : 40;
      laChamber.setAttribute('ry', (msBase + mrExpand).toFixed(1));
    }

    // 4. Update Mitral & Aortic Valve Leaflets
    const mvUpper = container.querySelector('[data-mv-upper]');
    const mvLower = container.querySelector('[data-mv-lower]');
    if (mvUpper && mvLower) {
      let mvGap = 0;
      if (!isSystole) {
        // Open in diastole; restricted opening in MS
        const maxOpen = currentLesion === 'ms' ? Math.max(4, 20 * (1 - 0.78 * f)) : 20;
        mvGap = maxOpen * Math.sin(Math.min(1, diaProgress * 1.4) * Math.PI * 0.85 + 0.15);
      } else if (currentLesion === 'mr') {
        // Incomplete coaptation gap in MR during systole
        mvGap = 3 + 9 * f;
      }
      mvUpper.setAttribute('x2', (148 + mvGap * 0.4).toFixed(1));
      mvUpper.setAttribute('y2', (103 - mvGap).toFixed(1));
      mvLower.setAttribute('x2', (148 + mvGap * 0.4).toFixed(1));
      mvLower.setAttribute('y2', (103 + mvGap).toFixed(1));
    }

    const avUpper = container.querySelector('[data-av-upper]');
    const avLower = container.querySelector('[data-av-lower]');
    if (avUpper && avLower) {
      let avGap = 0;
      if (isSystole) {
        // Open in systole; severely narrowed in AS
        const maxOpen = currentLesion === 'as' ? Math.max(3.5, 19 * (1 - 0.82 * f)) : 19;
        avGap = maxOpen * Math.sin(sysProgress * Math.PI);
      } else if (currentLesion === 'ar') {
        // Regurgitant gap in diastole for AR
        avGap = 3 + 8.5 * f;
      }
      avUpper.setAttribute('x2', (294 + avGap * 0.35).toFixed(1));
      avUpper.setAttribute('y2', (103 - avGap).toFixed(1));
      avLower.setAttribute('x2', (294 + avGap * 0.35).toFixed(1));
      avLower.setAttribute('y2', (103 + avGap).toFixed(1));
    }

    // 5. Update Flowing Blood Particles
    const jetCaption = container.querySelector('[data-valv-jet-caption]');
    if (jetCaption) {
      if (currentLesion === 'as' && isSystole) {
        jetCaption.textContent = isTr ? '⚡ Daralmış aort kapağından yüksek hızlı türbülan sistolik jet' : '⚡ High-velocity turbulent systolic jet across stenotic aortic valve';
      } else if (currentLesion === 'ar' && !isSystole) {
        jetCaption.textContent = isTr ? '↩ Diyastolde aorttan sol ventriküle retrograd kaçış jeti' : '↩ Retrograde diastolic regurgitant jet from Aorta into LV';
      } else if (currentLesion === 'ms' && !isSystole) {
        jetCaption.textContent = isTr ? '⚡ Dar mitral kapaktan diyastolik dolum jeti ve LA stazı' : '⚡ Diastolic transmitral jet and LA stasis across stenotic mitral valve';
      } else if (currentLesion === 'mr' && isSystole) {
        jetCaption.textContent = isTr ? '↩ Sistolde LV’den sol atriyuma holosistolik regürjitan jet (Dev v dalgası)' : '↩ Holosystolic regurgitant jet from LV into LA (Giant v-wave)';
      } else {
        jetCaption.textContent = isTr ? 'Laminer ileri yönlü kardiyak kan akımı (LA → LV → Aort)' : 'Laminar forward cardiac blood flow (LA → LV → Aorta)';
      }
    }

    particles.forEach(p => {
      const node = container.querySelector(`[data-vp-id="${p.id}"]`);
      if (!node) return;

      if (p.role === 'forward') {
        // Forward blood flow speeds up during active valve opening phase
        const flowSpeed = isSystole ? 0.55 : 0.48;
        p.progress = (p.progress + dtSec * flowSpeed * speed) % 1;
        const x = 35 + p.progress * 370;
        const spread = x > 140 && x < 158 ? 8 : x > 276 && x < 296 ? 8 : 26;
        const y = 103 + p.lane * spread + Math.sin(p.progress * 14 + p.id) * 3;
        node.setAttribute('cx', x.toFixed(1));
        node.setAttribute('cy', y.toFixed(1));
        node.setAttribute('fill', x < 145 ? '#0284c7' : '#dc2626');
        node.setAttribute('opacity', '0.9');
      } else {
        // Pathological jet particles (turbulent forward or retrograde regurgitant)
        const jetRate = (0.7 + f * 0.9) * speed;
        p.progress = (p.progress + dtSec * jetRate) % 1;
        let x = 215, y = 103, color = '#f59e0b', visible = true;

        if (currentLesion === 'as') {
          // Systolic high-velocity turbulent jet from AV (282) to Aorta (405)
          x = 280 + p.progress * 125;
          const swirl = (p.progress * 26) * Math.sin(p.progress * 18 + p.id);
          y = 103 + swirl * (0.4 + 0.6 * f);
          color = '#f59e0b';
          visible = isSystole;
        } else if (currentLesion === 'ar') {
          // Retrograde diastolic jet from Aorta (310) back into LV (175)
          x = 305 - p.progress * 130;
          y = 103 + p.lane * (6 + p.progress * 34 * f);
          color = '#fb7185';
          visible = !isSystole;
        } else if (currentLesion === 'ms') {
          // Diastolic narrow jet from MV (142) into LV (245)
          x = 140 + p.progress * 105;
          y = 103 + Math.sin(p.progress * 16 + p.id) * (4 + 12 * f);
          color = '#06b6d4';
          visible = !isSystole;
        } else if (currentLesion === 'mr') {
          // Retrograde systolic jet from LV (175) back into LA (55)
          x = 165 - p.progress * 108;
          y = 103 + p.lane * (6 + p.progress * 38 * f);
          color = '#a855f7';
          visible = isSystole;
        } else {
          // Normal laminar helper particles
          x = 150 + p.progress * 240;
          y = 103 + p.lane * 18;
          color = '#ef4444';
          visible = true;
        }
        node.setAttribute('cx', x.toFixed(1));
        node.setAttribute('cy', y.toFixed(1));
        node.setAttribute('fill', color);
        node.setAttribute('opacity', visible ? '0.95' : '0.18');
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
              <p class="lab-desc">${isTr ? 'Eşzamanlı Sol Ventrikül (LV), Sol Atriyum (LA) ve Aort basınç traseleri üzerinde patolojik gradyanlar ve canlı kapak/akım animasyonu.' : 'Simultaneous LV, LA, and Aorta pressure waveforms with live valve leaflet motion, jet traffic, and phonocardiogram.'}</p>
            </div>
            <div class="lesion-badge">
              ${LESIONS.find(l => l.id === currentLesion)?.[isTr ? 'badgeTr' : 'badgeEn'] || ''}
            </div>
          </div>

          <!-- Live Animation Playback Bar -->
          <div class="preset-pill-group pathophys-motion-bar">
            <span class="preset-label">${isTr ? 'Canlı Hemodinamik Akım:' : 'Live Hemodynamic Flow:'}</span>
            <button type="button" class="preset-pill ${!paused ? 'active' : ''}" data-motion-toggle aria-pressed="${!paused}">
              ${paused ? (isTr ? '▷ Oynat' : '▷ Play') : (isTr ? 'Ⅱ Duraklat' : 'Ⅱ Pause')}
            </button>
            <label class="motion-speed-label">
              ${isTr ? 'Hız' : 'Speed'}
              <select data-motion-speed>
                <option value="0.5" ${speed === 0.5 ? 'selected' : ''}>0.5×</option>
                <option value="1" ${speed === 1 ? 'selected' : ''}>1×</option>
                <option value="2" ${speed === 2 ? 'selected' : ''}>2×</option>
              </select>
            </label>
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

          <!-- Plot & Live Animation Area -->
          <div class="valvular-stage-container">
            ${renderAnimatedFlowScene()}
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

    updateAnimationFrame(0);
    bindEvents();
  }

  function bindEvents() {
    const toggleBtn = container.querySelector('[data-motion-toggle]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        paused = !paused;
        toggleBtn.setAttribute('aria-pressed', String(!paused));
        toggleBtn.classList.toggle('active', !paused);
        toggleBtn.textContent = paused
          ? (lang === 'tr' ? '▷ Oynat' : '▷ Play')
          : (lang === 'tr' ? 'Ⅱ Duraklat' : 'Ⅱ Pause');
      });
    }

    const speedSel = container.querySelector('[data-motion-speed]');
    if (speedSel) {
      speedSel.addEventListener('change', (e) => {
        speed = Number(e.target.value) || 1;
      });
    }

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
  startLoop();

  return {
    updateLanguage: (newLang) => {
      lang = newLang;
      render();
    },
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
