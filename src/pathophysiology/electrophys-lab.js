// Interactive Cardiac Action Potential & Arrhythmogenesis Lab.
export function createElectrophysLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-ep-lab';

  let cellType = 'ventricular'; // 'ventricular' | 'nodal'
  let triggerMode = 'none';      // 'none' | 'ead' | 'dad' | 'reentry'

  root.innerHTML = `
    <div class="ep-toggles-bar">
      <div class="pathophys-segmented" role="group" aria-label="Cell Type">
        <button type="button" class="seg-btn" data-ep-cell="ventricular" data-ep-i18n="cellVent"></button>
        <button type="button" class="seg-btn" data-ep-cell="nodal" data-ep-i18n="cellNodal"></button>
      </div>
      <div class="pathophys-segmented" role="group" aria-label="Arrhythmia Trigger">
        <button type="button" class="seg-btn" data-ep-trig="none" data-ep-i18n="trigNone"></button>
        <button type="button" class="seg-btn" data-ep-trig="ead" data-ep-i18n="trigEad"></button>
        <button type="button" class="seg-btn" data-ep-trig="dad" data-ep-i18n="trigDad"></button>
        <button type="button" class="seg-btn" data-ep-trig="reentry" data-ep-i18n="trigReentry"></button>
      </div>
    </div>
    <div class="pathophys-grid">
      <div class="pathophys-stage ep-stage">
        <svg viewBox="0 0 540 320" class="pathophys-svg ep-svg" role="img" aria-label="Action Potential Waveform"></svg>
        <div class="ep-legend">
          <span><i class="legend-color legend-ap"></i> <strong data-ep-i18n="legVm"></strong></span>
          <span><i class="legend-color legend-ina"></i> <strong>INa (Na⁺)</strong></span>
          <span><i class="legend-color legend-ica"></i> <strong>ICa,L (Ca²⁺)</strong></span>
          <span><i class="legend-color legend-ik"></i> <strong>IK (K⁺)</strong></span>
          <span><i class="legend-color legend-if"></i> <strong>If (Funny)</strong></span>
        </div>
      </div>
      <div class="pathophys-controls ep-controls">
        <div class="card-head">
          <h3 data-ep-head-title></h3>
          <p data-ep-head-desc></p>
        </div>
        <div class="ep-channels-box">
          <h4 data-ep-i18n="currTitle"></h4>
          <ul class="ep-curr-list" data-ep-curr-list></ul>
        </div>
        <div class="ep-mechanism-card" data-ep-mech-card>
          <h4 data-ep-mech-title></h4>
          <p data-ep-mech-body></p>
        </div>
      </div>
    </div>
  `;
  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  $$('[data-ep-cell]').forEach(btn => {
    btn.addEventListener('click', () => {
      cellType = btn.dataset.epCell;
      if (cellType === 'nodal' && (triggerMode === 'ead' || triggerMode === 'dad')) {
        triggerMode = 'none';
      }
      render();
    });
  });

  $$('[data-ep-trig]').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerMode = btn.dataset.epTrig;
      if (triggerMode === 'ead' || triggerMode === 'dad') {
        cellType = 'ventricular';
      }
      render();
    });
  });

  function render() {
    const en = getLang() === 'en';

    // Buttons active state
    $$('[data-ep-cell]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.epCell === cellType));
    });
    $$('[data-ep-trig]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.epTrig === triggerMode));
    });

    const TEXT = {
      cellVent: en ? 'Ventricular Myocyte (Fast)' : 'Ventrikül Hücresi (Hızlı Yanıt)',
      cellNodal: en ? 'SA / AV Nodal Cell (Slow)' : 'Sinüs / AV Düğüm (Yavaş Yanıt)',
      trigNone: en ? 'Physiological' : 'Fizyolojik',
      trigEad: en ? 'EAD (Long QT)' : 'EAD (Uzun QT)',
      trigDad: en ? 'DAD (Ca²⁺ Overload)' : 'DAD (Ca Aşırı Yükü)',
      trigReentry: en ? 'Reentry Circuit' : 'Reentry Döngüsü',
      legVm: en ? 'Membrane Potential (Vm)' : 'Membran Potansiyeli (Vm)',
      currTitle: en ? 'Active Ion Channels & Phase Dynamics' : 'Aktif İyon Kanalları ve Faz Dinamikleri'
    };
    Object.entries(TEXT).forEach(([k, str]) => {
      const el = $(`[data-ep-i18n="${k}"]`);
      if (el) el.textContent = str;
    });

    // Content for cell type & trigger
    let title = '', desc = '', currents = [], mechTitle = '', mechBody = '';

    if (cellType === 'ventricular') {
      title = en ? 'Ventricular Working Myocyte Action Potential' : 'Ventriküler Çalışan Miyosit Aksiyon Potansiyeli';
      desc = en
        ? 'Resting potential -90 mV. Phase 0 rapid INa upstroke, Phase 1 Ito notch, Phase 2 ICa,L plateau, Phase 3 IK repolarization, Phase 4 IK1 stabilization.'
        : 'İstirahat potansiyeli -90 mV. Faz 0 hızlı INa fırlaması, Faz 1 Ito çentiği, Faz 2 ICa,L platosu, Faz 3 IK repolarizasyonu, Faz 4 IK1 kararlılığı.';
      currents = [
        en ? 'Phase 0: INa (Nav1.5) rapid inward sodium current' : 'Faz 0: INa (Nav1.5) hızlı içe sodyum akımı',
        en ? 'Phase 1: Ito transient outward potassium current' : 'Faz 1: Ito geçici dışa potasyum akımı',
        en ? 'Phase 2: ICa,L (Cav1.2) plateau inward calcium current' : 'Faz 2: ICa,L (Cav1.2) plato içe kalsiyum akımı',
        en ? 'Phase 3: IKr (hERG) & IKs delayed rectifier potassium currents' : 'Faz 3: IKr (hERG) ve IKs gecikmiş doğrultucu K akımları',
        en ? 'Phase 4: IK1 inward rectifier maintaining -90 mV resting potential' : 'Faz 4: IK1 içe doğrultucu K akımı (-90 mV istirahat)'
      ];
    } else {
      title = en ? 'Sinoatrial Nodal Pacemaker Action Potential' : 'Sinoatriyal Düğüm Pacemaker Aksiyon Potansiyeli';
      desc = en
        ? 'No true resting potential (-60 mV max diastolic). Phase 4 spontaneous diastolic depolarization driven by funny current (If) and T-type Ca²⁺.'
        : 'Gerçek istirahat potansiyeli yoktur (maksimum -60 mV). Faz 4 kendiliğinden diyastolik depolarizasyon: Funny akımı (If) ve T-tipi Ca ile yürütülür.';
      currents = [
        en ? 'Phase 4: If (HCN4 funny current) hyperpolarization-activated inward Na/K' : 'Faz 4: If (HCN4 funny akımı) hiperpolarizasyonla tetiklenen içe akım',
        en ? 'Phase 0: ICa,L upstroke (no functional fast sodium channels)' : 'Faz 0: ICa,L içe akımı (hızlı sodyum kanalı yoktur)',
        en ? 'Phase 3: IK outward potassium repolarization' : 'Faz 3: IK dışa potasyum repolarizasyonu'
      ];
    }

    if (triggerMode === 'ead') {
      mechTitle = en ? 'Early Afterdepolarization (EAD) & Torsades de Pointes' : 'Erken Ard-Depolarizasyon (EAD) ve Torsades de Pointes';
      mechBody = en
        ? 'IKr blockade or congenital channelopathy delays Phase 3 repolarization (prolonged QT interval). Cav1.2 channels recover from inactivation in the plateau voltage window, triggering oscillatory depolarizations that spark polymorphic ventricular tachycardia.'
        : 'IKr blokajı veya genetik kanalopati Faz 3 repolarizasyonunu geciktirir (QT uzaması). Cav1.2 kalsiyum kanalları inaktivasyondan kurtulup erken tetiklenerek polimorfik VT / Torsades de Pointes başlatır.';
    } else if (triggerMode === 'dad') {
      mechTitle = en ? 'Delayed Afterdepolarization (DAD) & Triggered Activity' : 'Geç Ard-Depolarizasyon (DAD) ve Tetiklenmiş Aktivite';
      mechBody = en
        ? 'Diastolic sarcoplasmic reticulum (SR) calcium overload leads to spontaneous RyR2 release. Extrusion of 1 Ca²⁺ in exchange for 3 Na⁺ via the NCX exchanger generates a net inward current (Iti), depolarizing the membrane to threshold and firing ventricular premature beats.'
        : 'SR kalsiyum aşırı yüklenmesi sonucu diyastolde spontan RyR2 kalsiyum sızıntısı olur. 3 Na⁺ / 1 Ca²⁺ değişimi (NCX) net içe akım (Iti) yaratarak eşiği aşar ve tetiklenmiş ventriküler aritmileri (CPVT, digoksin toksisitesi) doğurur.';
    } else if (triggerMode === 'reentry') {
      mechTitle = en ? 'Reentry Circuit: Circus Movement & Sustained Arrhythmias' : 'Reentry Devresi: Devridaim Mekanizması ve Aritmiler';
      mechBody = en
        ? 'Three absolute prerequisites: (1) Multiple anatomically or functionally distinct conduction pathways, (2) Unidirectional conduction block in one branch, (3) Slow conduction in the alternate branch allowing the blocked tissue to recover excitability.'
        : 'Üç zorunlu koşul: (1) Çift iletim yolu, (2) Bir kolda tek yönlü blok, (3) Diğer kolda yavaş iletim (retrograd uyarının bloğu aşmış dokuyu uyarılabilir bulmasını sağlar). AVNRT, atrial flutter ve VT mekanizmasıdır.';
    } else {
      mechTitle = en ? 'Normal Physiological Conduction' : 'Normal Fizyolojik İletim';
      mechBody = en
        ? 'Homogeneous repolarization and refractory periods protect the myocardium against ectopic triggered activity and circus loop reentry.'
        : 'Homojen repolarizasyon ve refrakter periyotlar miyokardı ektopik tetiklenmelerden ve devridaim döngülerinden korur.';
    }

    $('[data-ep-head-title]').textContent = title;
    $('[data-ep-head-desc]').textContent = desc;
    $('[data-ep-curr-list]').innerHTML = currents.map(c => `<li>${c}</li>`).join('');
    $('[data-ep-mech-title]').textContent = mechTitle;
    $('[data-ep-mech-body]').textContent = mechBody;

    drawEpSvg(cellType, triggerMode);
  }

  function drawEpSvg(cell, trig) {
    const svg = $('.ep-svg');
    const w = 540, h = 320;

    if (trig === 'reentry') {
      // Draw interactive anatomical Reentry Circuit Ring!
      svg.innerHTML = `
        <defs>
          <linearGradient id="reentry-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0ca678"/>
            <stop offset="0.5" stop-color="#fab005"/>
            <stop offset="1" stop-color="#c92a2a"/>
          </linearGradient>
        </defs>
        <!-- Reentry Ring Pathway -->
        <circle cx="270" cy="160" r="95" fill="none" stroke="#d5dfd9" stroke-width="32"/>
        <circle cx="270" cy="160" r="95" fill="none" stroke="url(#reentry-grad)" stroke-width="26" stroke-dasharray="140 180"/>
        
        <!-- Center Barrier (Non-conductive core / Scar) -->
        <circle cx="270" cy="160" r="60" fill="#2d4239" stroke="#1c2d26" stroke-width="2"/>
        <text x="270" y="155" text-anchor="middle" font-size="12" font-weight="700" fill="#8ca699">Anatomical Barrier</text>
        <text x="270" y="172" text-anchor="middle" font-size="10" font-weight="600" fill="#6d8a7c">(Fibrous Ring / Scar)</text>

        <!-- Unidirectional Block Sign on Fast pathway (Right side) -->
        <rect x="350" y="148" width="28" height="24" rx="4" fill="#c92a2a" stroke="#fff" stroke-width="1.5"/>
        <line x1="355" y1="153" x2="373" y2="167" stroke="#fff" stroke-width="3"/>
        <line x1="373" y1="153" x2="355" y2="167" stroke="#fff" stroke-width="3"/>
        <text x="395" y="165" font-size="11" font-weight="800" fill="#c92a2a">Unidirectional Block</text>

        <!-- Slow Pathway with tortuous wavy indicator (Left side) -->
        <path d="M175 120Q155 140 175 160T175 200" fill="none" stroke="#e67700" stroke-width="4"/>
        <text x="145" y="165" text-anchor="end" font-size="11" font-weight="800" fill="#e67700">Slow Pathway</text>

        <!-- Animated circulating wavefront arrow -->
        <circle cx="270" cy="65" r="9" fill="#1f4fd1" stroke="#fff" stroke-width="2">
          <animateTransform attributeName="transform" type="rotate" from="0 270 160" to="360 270 160" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <text x="270" y="30" text-anchor="middle" font-size="14" font-weight="800" fill="#1f362d">Sustained Reentrant Circus Movement</text>
      `;
      return;
    }

    // Grid and axes for Action Potential
    const padL = 50, padR = 25, padT = 30, padB = 40;
    const plotW = w - padL - padR, plotH = h - padT - padB;

    const toX = t => padL + (t / 500) * plotW;
    const toY = vm => h - padB - ((vm - -100) / 140) * plotH;

    const grid = [];
    for (let t = 100; t <= 400; t += 100) {
      grid.push(`<line x1="${toX(t)}" y1="${padT}" x2="${toX(t)}" y2="${h - padB}" stroke="#d3ded6" stroke-dasharray="3 3"/>`);
      grid.push(`<text x="${toX(t)}" y="${h - padB + 16}" text-anchor="middle" class="axis-num">${t} ms</text>`);
    }
    for (let vm = -80; vm <= 20; vm += 20) {
      grid.push(`<line x1="${padL}" y1="${toY(vm)}" x2="${w - padR}" y2="${toY(vm)}" stroke="#d3ded6" stroke-dasharray="3 3"/>`);
      grid.push(`<text x="${padL - 8}" y="${toY(vm) + 4}" text-anchor="end" class="axis-num">${vm}</text>`);
    }

    let apPoints = [];
    if (cell === 'ventricular') {
      if (trig === 'ead') {
        // EAD hump during Phase 2/3
        apPoints = [
          [20, -90], [60, -90],
          [65, 30],   // Phase 0
          [80, 15],   // Phase 1
          [160, 8],   // Phase 2 plateau
          [210, -10], // Early repolarization
          [250, 10],  // EAD TRIGGER HUMP!
          [310, -5],  // Second hump
          [410, -75], // Phase 3 delayed
          [450, -90], [480, -90]
        ];
      } else if (trig === 'dad') {
        // DAD hump during Phase 4 resting
        apPoints = [
          [20, -90], [60, -90],
          [65, 30],   // Phase 0
          [78, 15],   // Phase 1
          [180, 5],   // Phase 2
          [280, -85], // Phase 3
          [310, -90], // Phase 4 resting
          [360, -65], // DAD TRIGGER HUMP!
          [410, 25],  // TRIGGERED EXTRA AP!
          [460, -40],
          [490, -90]
        ];
      } else {
        // Normal Ventricular
        apPoints = [
          [20, -90], [60, -90],
          [65, 30],   // Phase 0
          [78, 15],   // Phase 1
          [190, 8],   // Phase 2 plateau
          [280, -75], // Phase 3
          [315, -90], // Phase 4
          [480, -90]
        ];
      }
    } else {
      // Nodal AP
      apPoints = [
        [20, -60],
        [90, -40],  // Phase 4 slow diastolic depolarization (If)
        [150, 10],  // Phase 0 Ca upstroke
        [230, -60], // Phase 3 K repolarization
        [320, -40], // Phase 4 repeat
        [380, 10],
        [460, -60],
        [490, -50]
      ];
    }

    const polylinePts = apPoints.map(([t, vm]) => `${toX(t).toFixed(1)},${toY(vm).toFixed(1)}`).join(' ');

    let triggerAnnotation = '';
    if (trig === 'ead') {
      triggerAnnotation = `
        <rect x="${toX(210)}" y="${toY(22)}" width="115" height="60" rx="6" fill="rgba(201,42,42,0.12)" stroke="#c92a2a" stroke-dasharray="3 3"/>
        <text x="${toX(267)}" y="${toY(16) - 10}" text-anchor="middle" font-size="11" font-weight="800" fill="#c92a2a">EAD Trigger (Phase 2/3)</text>
      `;
    } else if (trig === 'dad') {
      triggerAnnotation = `
        <rect x="${toX(330)}" y="${toY(35)}" width="145" height="85" rx="6" fill="rgba(230,119,0,0.14)" stroke="#e67700" stroke-dasharray="3 3"/>
        <text x="${toX(390)}" y="${toY(25) - 12}" text-anchor="middle" font-size="11" font-weight="800" fill="#e67700">DAD Triggered Beat (Phase 4)</text>
      `;
    }

    svg.innerHTML = `
      ${grid.join('')}
      <!-- Zero Voltage Line -->
      <line x1="${padL}" y1="${toY(0)}" x2="${w - padR}" y2="${toY(0)}" stroke="#8fa89b" stroke-width="1.2" stroke-dasharray="6 4"/>
      <text x="${w - padR + 5}" y="${toY(0) + 4}" font-size="10" font-weight="700" fill="#6d877a">0 mV</text>

      <!-- Axes -->
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <text x="${w / 2}" y="${h - 8}" text-anchor="middle" class="axis-title">${getLang() === 'en' ? 'Time (ms)' : 'Zaman (ms)'}</text>
      <text x="14" y="${h / 2}" text-anchor="middle" transform="rotate(-90 14 ${h / 2})" class="axis-title">${getLang() === 'en' ? 'Transmembrane Voltage (mV)' : 'Membran Gerilimi (mV)'}</text>

      <!-- Action Potential Trace -->
      <polyline points="${polylinePts}" fill="none" stroke="#0ca678" stroke-width="3.5" stroke-linejoin="round"/>

      ${triggerAnnotation}
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
