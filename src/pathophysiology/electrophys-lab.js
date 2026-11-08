// Interactive Cardiac Action Potential, Ion Channel Traffic & Arrhythmogenesis Lab
import { drawVentricularScene, ventricularFrameAt, VENTRICULAR_PLAYBACK_MS } from './ventricular-ap-scene.js';

export function createElectrophysLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-ep-lab';

  let cellType = 'ventricular'; // 'ventricular' | 'nodal'
  let triggerMode = 'none';     // 'none' | 'ead' | 'dad' | 'reentry'

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let paused = Boolean(reducedMotion);
  let speed = 1;
  let ventricularElapsed = 0;
  let updateVentricularScene = null;
  let ventricularKeyframes;
  let animTimeMs = 120; // 0..500 ms across the AP timeline
  let rafId = null;
  let lastTs = 0;

  // Ion & wavefront particles for continuous animation
  const ionParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    kind: i < 8 ? 'na' : i < 16 ? 'ca' : 'k',
    progress: (i / 24) % 1,
    jitter: ((i * 29) % 100) / 100 - 0.5
  }));

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
      <div class="preset-pill-group pathophys-motion-bar" style="margin:0;padding:0;border:0">
        <button type="button" class="preset-pill" data-motion-toggle aria-pressed="${!paused}"></button>
        <label class="motion-speed-label">
          <span data-ep-i18n="lblSpeed"></span>
          <select data-motion-speed>
            <option value="0.5">0.5×</option>
            <option value="1" selected>1×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </div>
    </div>
    <div class="pathophys-grid">
      <div class="pathophys-stage ep-stage">
        <div class="ep-svg-frame" data-ep-film>
          <svg viewBox="0 0 580 553" class="pathophys-svg ep-svg" role="img"></svg>
        </div>
        <div class="ep-svg-frame" data-ep-legacy hidden>
          <svg viewBox="0 0 580 430" class="pathophys-svg ep-svg" role="img"></svg>
        </div>
        <div class="ep-film-controls" data-ep-film-controls hidden>
          <label class="ep-film-scrub">
            <span data-ep-i18n="lblScrub"></span>
            <input type="range" min="0" max="${VENTRICULAR_PLAYBACK_MS}" value="0" step="10" data-ep-scrub>
          </label>
          <a href="https://doi.org/10.1371/journal.pcbi.1002061" target="_blank" rel="noopener noreferrer" data-ep-i18n="source"></a>
        </div>
        <div class="ep-legend">
          <span><i class="legend-color legend-ap"></i> <strong data-ep-i18n="legVm"></strong></span>
          <span><i class="legend-color legend-ina"></i> <strong>INa (Na⁺)</strong></span>
          <span><i class="legend-color legend-ica"></i> <strong>ICa,L (Ca²⁺)</strong></span>
          <span><i class="legend-color legend-ik"></i> <strong>IK (K⁺)</strong></span>
          <span><i class="legend-color legend-if"></i> <strong>If / NCX</strong></span>
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
  const scrub = $('[data-ep-scrub]');

  function getApKeyframes(cell, trig) {
    if (cell === 'ventricular') {
      if (trig === 'ead') {
        return [
          [20, -90], [60, -90],
          [65, 30],   // Phase 0
          [80, 15],   // Phase 1
          [160, 8],   // Phase 2 plateau
          [210, -10], // Early repolarization
          [250, 12],  // EAD TRIGGER HUMP 1
          [310, -5],  // EAD HUMP 2
          [410, -75], // Phase 3 delayed
          [450, -90], [485, -90]
        ];
      }
      if (trig === 'dad') {
        return [
          [20, -90], [60, -90],
          [65, 30],   // Phase 0
          [78, 15],   // Phase 1
          [180, 5],   // Phase 2
          [280, -85], // Phase 3
          [310, -90], // Phase 4 resting
          [358, -62], // DAD TRIGGER HUMP
          [405, 25],  // TRIGGERED EXTRA AP
          [455, -45],
          [485, -90]
        ];
      }
      return [
        [20, -90], [60, -90],
        [65, 30],   // Phase 0
        [78, 15],   // Phase 1
        [190, 8],   // Phase 2 plateau
        [280, -75], // Phase 3
        [315, -90], // Phase 4
        [485, -90]
      ];
    }
    return [
      [20, -60],
      [90, -40],  // Phase 4 slow diastolic depolarization (If)
      [150, 10],  // Phase 0 Ca upstroke
      [230, -60], // Phase 3 K repolarization
      [320, -40], // Phase 4 repeat
      [380, 10],
      [460, -60],
      [485, -50]
    ];
  }

  function interpolateVm(tMs, keyframes) {
    if (tMs <= keyframes[0][0]) return keyframes[0][1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      const [t0, v0] = keyframes[i];
      const [t1, v1] = keyframes[i + 1];
      if (tMs >= t0 && tMs <= t1) {
        const p = (tMs - t0) / Math.max(0.001, t1 - t0);
        return v0 + (v1 - v0) * p;
      }
    }
    return keyframes[keyframes.length - 1][1];
  }

  function activePhaseInfo(tMs, cell, trig, en) {
    if (cell === 'nodal') {
      if ((tMs >= 20 && tMs < 95) || (tMs >= 235 && tMs < 325)) {
        return { phase: en ? 'Phase 4: If (HCN4) Pacemaker Depolarization' : 'Faz 4: If (HCN4) Pacemaker Depolarizasyonu', activeGate: 'if' };
      }
      if ((tMs >= 95 && tMs < 160) || (tMs >= 325 && tMs < 390)) {
        return { phase: en ? 'Phase 0: ICa,L Slow Ca2+ Upstroke' : 'Faz 0: ICa,L Yavaş Ca2+ Fırlaması', activeGate: 'ca' };
      }
      return { phase: en ? 'Phase 3: IK Repolarization (K+ Efflux)' : 'Faz 3: IK Repolarizasyonu (K+ Çıkışı)', activeGate: 'k' };
    }
    if (tMs >= 56 && tMs <= 74) {
      return { phase: en ? 'Phase 0: Rapid INa (Nav1.5) Na+ Influx' : 'Faz 0: Hızlı INa (Nav1.5) Na+ Girişi', activeGate: 'na' };
    }
    if (trig === 'ead' && tMs >= 205 && tMs <= 335) {
      return { phase: en ? '⚡ EAD Window: ICa,L Reactivation (Delayed IKr)' : '⚡ EAD Penceresi: ICa,L Erken Yeniden Aktivasyonu', activeGate: 'ca' };
    }
    if (trig === 'dad' && tMs >= 320 && tMs <= 450) {
      return { phase: en ? '⚡ DAD Trigger: SR RyR2 Ca2+ Leak -> NCX 3Na+ Inward' : '⚡ DAD Tetiklenmesi: SR RyR2 Ca2+ Sızıntısı -> NCX 3Na+ Girişi', activeGate: 'if' };
    }
    if (tMs > 74 && tMs <= 205) {
      return { phase: en ? 'Phase 2 Plateau: ICa,L Ca2+ Influx & CICR' : 'Faz 2 Plato: ICa,L Ca2+ Girişi ve Kasılma', activeGate: 'ca' };
    }
    if (tMs > 205 && tMs <= 325) {
      return { phase: en ? 'Phase 3: IKr / IKs Outward K+ Repolarization' : 'Faz 3: IKr / IKs Dışa K+ Repolarizasyonu', activeGate: 'k' };
    }
    return { phase: en ? 'Phase 4: IK1 Resting Equilibrium (-90 mV)' : 'Faz 4: IK1 İstirahat Dengesi (-90 mV)', activeGate: 'k' };
  }

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

  $('[data-motion-toggle]').addEventListener('click', () => {
    paused = !paused;
    syncPlaybackUi();
  });

  $('[data-motion-speed]').addEventListener('change', (e) => {
    speed = Number(e.target.value) || 1;
  });

  scrub.addEventListener('input', () => {
    ventricularElapsed = Number(scrub.value);
    paused = true;
    syncPlaybackUi();
    updateAnimationFrame(0);
  });

  function syncPlaybackUi() {
    const en = getLang() === 'en';
    const btn = $('[data-motion-toggle]');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(!paused));
    btn.classList.toggle('active', !paused);
    btn.textContent = paused ? (en ? '▷ Play' : '▷ Oynat') : (en ? 'Ⅱ Pause' : 'Ⅱ Duraklat');
  }

  function render() {
    const en = getLang() === 'en';

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
      currTitle: en ? 'Active Ion Channels & Phase Dynamics' : 'Aktif İyon Kanalları ve Faz Dinamikleri',
      lblSpeed: en ? 'Speed' : 'Hız',
      lblScrub: en ? 'Explore the beat' : 'Atımı incele',
      source: en ? 'Physiology source' : 'Fizyoloji kaynağı'
    };
    Object.entries(TEXT).forEach(([k, str]) => {
      const el = $(`[data-ep-i18n="${k}"]`);
      if (el) el.textContent = str;
    });
    syncPlaybackUi();

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
    updateAnimationFrame(0);
  }

  function drawEpSvg(cell, trig) {
    const en = getLang() === 'en';
    const showVentricularScene = cell === 'ventricular' && trig === 'none';
    $('[data-ep-film]').hidden = !showVentricularScene;
    $('[data-ep-legacy]').hidden = showVentricularScene;
    $('[data-ep-film-controls]').hidden = !showVentricularScene;
    $('.ep-legend').hidden = showVentricularScene;
    if (showVentricularScene) {
      ventricularKeyframes = getApKeyframes(cell, trig);
      updateVentricularScene = drawVentricularScene($('[data-ep-film] svg'), en ? 'en' : 'tr', ventricularKeyframes);
      return;
    }

    updateVentricularScene = null;
    const svg = $('[data-ep-legacy] svg');
    svg.setAttribute('aria-label', en ? 'Action potential and ion channels' : 'Aksiyon potansiyeli ve iyon kanalları');
    const w = 580, h = 430;

    if (trig === 'reentry') {
      svg.innerHTML = `
        <defs>
          <linearGradient id="reentry-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0ca678"/>
            <stop offset="0.5" stop-color="#fab005"/>
            <stop offset="1" stop-color="#c92a2a"/>
          </linearGradient>
        </defs>

        <rect x="12" y="10" width="556" height="408" rx="12" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="290" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#0f172a">
          ${en ? 'Sustained Reentrant Circus Movement & Excitable Gap' : 'Sürekli Reentry Devridaim Döngüsü ve Uyarılabilir Boşluk'}
        </text>
        <text x="290" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">
          ${en ? 'Slow antegrade conduction (left) + Unidirectional block (right) -> Retrograde loop' : 'Yavaş antegrad iletim (sol) + Tek yönlü blok (sağ) -> Retrograd geri dönüş'}
        </text>

        <!-- Proximal Conduction Entry & Distal Exit -->
        <path d="M 290 62 V 96" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
        <path d="M 290 324 V 364" stroke="#334155" stroke-width="10" stroke-linecap="round"/>

        <!-- Reentry Ring Pathway -->
        <circle cx="290" cy="210" r="108" fill="none" stroke="#e2e8f0" stroke-width="34"/>
        <circle data-reentry-tail cx="290" cy="210" r="108" fill="none" stroke="url(#reentry-grad)" stroke-width="26" stroke-dasharray="180 498" stroke-linecap="round"/>

        <!-- Center Barrier (Non-conductive core / Scar) -->
        <circle cx="290" cy="210" r="70" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/>
        <text x="290" y="205" text-anchor="middle" font-size="12" font-weight="800" fill="#cbd5e1">
          ${en ? 'Anatomical Barrier' : 'Anatomik Engel'}
        </text>
        <text x="290" y="222" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">
          ${en ? '(Fibrous Core / Scar)' : '(Fibröz Çekirdek / Skar)'}
        </text>

        <!-- Unidirectional Block Sign on Fast pathway (Right upper limb) -->
        <g transform="translate(384, 146)">
          <rect x="-16" y="-12" width="32" height="24" rx="5" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
          <line x1="-8" y1="-6" x2="8" y2="6" stroke="#ffffff" stroke-width="2.8"/>
          <line x1="8" y1="-6" x2="-8" y2="6" stroke="#ffffff" stroke-width="2.8"/>
          <text x="24" y="-2" font-size="11" font-weight="800" fill="#dc2626">
            ${en ? 'Unidirectional Block' : 'Tek Yönlü Blok'}
          </text>
          <text x="24" y="12" font-size="9.5" font-weight="700" fill="#64748b">
            ${en ? '(Antegrade Blocked, Retrograde Open)' : '(Antegrad Bloke, Retrograd Açık)'}
          </text>
        </g>

        <!-- Slow Pathway with tortuous wavy indicator (Left limb) -->
        <path d="M 182 155 Q 162 175 182 195 T 182 235 T 182 268" fill="none" stroke="#d97706" stroke-width="4"/>
        <text x="154" y="202" text-anchor="end" font-size="11" font-weight="800" fill="#b45309">
          ${en ? 'Slow Pathway (α)' : 'Yavaş Yol (α)'}
        </text>
        <text x="154" y="216" text-anchor="end" font-size="9.5" font-weight="700" fill="#64748b">
          ${en ? 'Delayed Conduction' : 'Yavaş İletim'}
        </text>

        <!-- Animated Circulating Wavefront Particles -->
        <g data-reentry-particles>
          ${ionParticles.slice(0, 14).map(p => `
            <circle class="ep-wave-particle hf-live-particle" data-reentry-id="${p.id}" cx="290" cy="102" r="${p.id < 10 ? 7 : 5.5}"
              fill="${p.id < 10 ? '#2563eb' : '#ef4444'}" stroke="#ffffff" stroke-width="1.8"/>
          `).join('')}
        </g>

        <text x="290" y="395" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0f766e" data-ep-live-phase>
          ${en ? '↻ Active Circus Wavefront Rotating Counter-Clockwise' : '↻ Aktif Reentry Dalgası Saat Yönünün Tersine Dönüyor'}
        </text>
      `;
      return;
    }

    // Top Panel: Animated Sarcolemma Membrane & Ion Channels (y = 10..158)
    // Bottom Panel: Action Potential Curve with Sweeping Voltage Tracer (y = 168..415)
    const padL = 54, padR = 26, padT = 188, padB = 34;
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

    const apPoints = getApKeyframes(cell, trig);
    const polylinePts = apPoints.map(([t, vm]) => `${toX(t).toFixed(1)},${toY(vm).toFixed(1)}`).join(' ');

    let triggerAnnotation = '';
    if (trig === 'ead') {
      triggerAnnotation = `
        <rect x="${toX(205)}" y="${toY(24)}" width="122" height="56" rx="6" fill="rgba(201,42,42,0.12)" stroke="#c92a2a" stroke-dasharray="3 3"/>
        <text x="${toX(266)}" y="${toY(24) - 6}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#c92a2a">
          ${en ? 'EAD Oscillation (Phase 2/3)' : 'EAD Salınımı (Faz 2/3)'}
        </text>
      `;
    } else if (trig === 'dad') {
      triggerAnnotation = `
        <rect x="${toX(325)}" y="${toY(32)}" width="142" height="82" rx="6" fill="rgba(230,119,0,0.14)" stroke="#e67700" stroke-dasharray="3 3"/>
        <text x="${toX(396)}" y="${toY(32) - 6}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#e67700">
          ${en ? 'DAD Triggered Beat (Phase 4)' : 'DAD Tetiklenmiş Atım (Faz 4)'}
        </text>
      `;
    }

    svg.innerHTML = `
      <!-- TOP SCENE: Animated Sarcolemma Phospholipid Bilayer, Ion Channels & SR -->
      <rect x="12" y="8" width="556" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="24" y="25" font-size="11" font-weight="800" fill="#0f172a">
        ${en ? '1. Live Sarcolemmal Ion Channel Traffic & SR Ca²⁺ Cycling' : '1. Canlı Sarkolemma İyon Kanal Trafiği ve SR Ca²⁺ Döngüsü'}
      </text>
      <text x="556" y="25" text-anchor="end" font-size="10.5" font-weight="800" fill="#0f766e" data-ep-live-phase></text>

      <!-- Extracellular Space (top band) -->
      <rect x="20" y="32" width="540" height="36" rx="6" fill="#e0f2fe"/>
      <text x="30" y="47" font-size="9.5" font-weight="800" fill="#0369a1">
        ${en ? 'EXTRACELLULAR ([Na⁺] 140 mM · [Ca²⁺] 1.8 mM)' : 'HÜCRE DIŞI ([Na⁺] 140 mM · [Ca²⁺] 1.8 mM)'}
      </text>

      <!-- Sarcolemma Phospholipid Bilayer -->
      <rect x="20" y="68" width="540" height="16" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>

      <!-- Intracellular Cytosol (bottom band) -->
      <rect x="20" y="84" width="540" height="68" rx="6" fill="#fef2f2"/>
      <text x="30" y="144" font-size="9.5" font-weight="800" fill="#991b1b">
        ${en ? 'CYTOSOL ([K⁺] 140 mM)' : 'SİTOZOL ([K⁺] 140 mM)'}
      </text>

      <!-- Gate 1: Nav1.5 (INa) at x=105 -->
      <g data-ep-gate="na">
        <rect x="86" y="60" width="38" height="32" rx="6" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
        <text x="105" y="79" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">INa</text>
        <text x="105" y="104" text-anchor="middle" font-size="8.5" font-weight="700" fill="#1e40af">${cell === 'nodal' ? (en ? 'Closed' : 'Kapalı') : 'Nav1.5'}</text>
      </g>

      <!-- Gate 2: Cav1.2 (ICa,L) at x=215 -->
      <g data-ep-gate="ca">
        <rect x="196" y="60" width="38" height="32" rx="6" fill="#d97706" stroke="#78350f" stroke-width="2"/>
        <text x="215" y="79" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">ICa,L</text>
        <text x="215" y="104" text-anchor="middle" font-size="8.5" font-weight="700" fill="#92400e">Cav1.2</text>
      </g>

      <!-- Gate 3: hERG / IKr / IKs at x=325 -->
      <g data-ep-gate="k">
        <rect x="306" y="60" width="38" height="32" rx="6" fill="${trig === 'ead' ? '#dc2626' : '#0ca678'}" stroke="#065f46" stroke-width="2"/>
        <text x="325" y="79" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">${trig === 'ead' ? 'IKr ✕' : 'IK'}</text>
        <text x="325" y="104" text-anchor="middle" font-size="8.5" font-weight="700" fill="${trig === 'ead' ? '#dc2626' : '#065f46'}">
          ${trig === 'ead' ? (en ? 'hERG Block' : 'hERG Bloke') : 'hERG / IKs'}
        </text>
      </g>

      <!-- Gate 4: NCX (3Na+/1Ca2+) or HCN4 (If) at x=435 -->
      <g data-ep-gate="if">
        <rect x="414" y="60" width="44" height="32" rx="6" fill="#7c3aed" stroke="#4c1d95" stroke-width="2"/>
        <text x="436" y="79" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">${cell === 'nodal' ? 'If' : 'NCX'}</text>
        <text x="436" y="104" text-anchor="middle" font-size="8.5" font-weight="700" fill="#5b21b6">${cell === 'nodal' ? 'HCN4' : '3Na⁺/1Ca²⁺'}</text>
      </g>

      <!-- Sarcoplasmic Reticulum (SR) & RyR2 organelle in Cytosol -->
      <g data-ep-sr>
        <rect x="478" y="96" width="74" height="48" rx="8" fill="${trig === 'dad' ? '#fee2e2' : '#ffedd5'}" stroke="${trig === 'dad' ? '#dc2626' : '#ea580c'}" stroke-width="2"/>
        <text x="515" y="114" text-anchor="middle" font-size="9" font-weight="800" fill="#9a3412">SR · RyR2</text>
        <text x="515" y="128" text-anchor="middle" font-size="8" font-weight="700" fill="${trig === 'dad' ? '#dc2626' : '#c2410c'}">
          ${trig === 'dad' ? (en ? 'Ca²⁺ Overload!' : 'Ca²⁺ Sızıntısı!') : (en ? 'Ca²⁺ Store' : 'Ca²⁺ Deposu')}
        </text>
      </g>

      <!-- Moving Ion Particles Layer -->
      <g data-ep-ion-particles>
        ${ionParticles.map(p => {
          const color = p.kind === 'na' ? '#2563eb' : p.kind === 'ca' ? '#d97706' : '#0ca678';
          return `<circle class="ep-ion-particle hf-live-particle" data-ep-ion="${p.id}" cx="105" cy="48" r="4.8" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>`;
        }).join('')}
      </g>

      <!-- BOTTOM SCENE: Action Potential Curve & Live Sweeping Voltage Tracer -->
      ${grid.join('')}
      <line x1="${padL}" y1="${toY(0)}" x2="${w - padR}" y2="${toY(0)}" stroke="#8fa89b" stroke-width="1.2" stroke-dasharray="6 4"/>
      <text x="${w - padR + 4}" y="${toY(0) + 4}" font-size="9.5" font-weight="700" fill="#6d877a">0 mV</text>

      <!-- Axes -->
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <text x="${w / 2}" y="${h - 8}" text-anchor="middle" class="axis-title">${en ? 'Time (ms)' : 'Zaman (ms)'}</text>
      <text x="14" y="${padT + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${padT + plotH / 2})" class="axis-title">${en ? 'Voltage (mV)' : 'Gerilim (mV)'}</text>

      ${triggerAnnotation}

      <!-- Action Potential Waveform -->
      <polyline points="${polylinePts}" fill="none" stroke="#1f4fd1" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- Live Sweeping Voltage Cursor & Glowing Tracer Dot -->
      <line data-ep-cursor x1="${toX(120)}" y1="${padT}" x2="${toX(120)}" y2="${h - padB}" stroke="#0f172a" stroke-width="1.6" stroke-dasharray="4 3"/>
      <circle data-ep-tracer cx="${toX(120)}" cy="${toY(0)}" r="6.5" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
    `;
  }

  function updateAnimationFrame(dtSec) {
    if (!root.isConnected) return;
    if (updateVentricularScene) {
      if (dtSec > 0) ventricularElapsed = (ventricularElapsed + dtSec * 1000 * speed) % VENTRICULAR_PLAYBACK_MS;
      const frame = ventricularFrameAt(ventricularElapsed);
      updateVentricularScene(frame, interpolateVm(frame.time, ventricularKeyframes));
      scrub.value = ventricularElapsed;
      scrub.setAttribute('aria-valuetext', `${frame.time.toFixed(1)} ms`);
      return;
    }

    const en = getLang() === 'en';

    // Advance timeline (500 ms AP sweep in ~ 3.2 seconds at 1x speed)
    animTimeMs = (animTimeMs + dtSec * 155 * speed) % 500;
    if (animTimeMs < 20) animTimeMs = 20;

    if (triggerMode === 'reentry') {
      // Animate circulating reentry wavefront particles & rotating tail
      const tail = root.querySelector('[data-reentry-tail]');
      const angleDeg = ((animTimeMs / 500) * 360) % 360;
      if (tail) {
        tail.setAttribute('transform', `rotate(${-angleDeg.toFixed(1)} 290 210)`);
      }

      ionParticles.slice(0, 14).forEach((p, idx) => {
        const node = root.querySelector(`[data-reentry-id="${p.id}"]`);
        if (!node) return;
        p.progress = (p.progress + dtSec * (idx < 10 ? 0.42 : 0.55) * speed) % 1;

        if (idx < 10) {
          // Counter-clockwise circus loop (down slow left limb, up fast right limb retrogradely)
          const theta = -Math.PI / 2 - p.progress * Math.PI * 2;
          const r = 108 + p.jitter * 12;
          const cx = 290 + Math.cos(theta) * r;
          const cy = 210 + Math.sin(theta) * r;
          node.setAttribute('cx', cx.toFixed(1));
          node.setAttribute('cy', cy.toFixed(1));
          node.setAttribute('opacity', '0.95');
        } else {
          // Blocked antegrade impulse hitting unidirectional block on right upper limb
          const sub = p.progress;
          const theta = -Math.PI / 2 + sub * 0.62;
          const cx = 290 + Math.cos(theta) * 108;
          const cy = 210 + Math.sin(theta) * 108;
          node.setAttribute('cx', cx.toFixed(1));
          node.setAttribute('cy', cy.toFixed(1));
          node.setAttribute('opacity', sub > 0.82 ? '0.15' : '0.9');
        }
      });
      return;
    }

    // Action Potential Mode: update sweeping cursor & tracer dot
    const keyframes = getApKeyframes(cellType, triggerMode);
    const vm = interpolateVm(animTimeMs, keyframes);
    const w = 580, h = 430, padL = 54, padR = 26, padT = 188, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const curX = (padL + (animTimeMs / 500) * plotW).toFixed(1);
    const curY = (h - padB - ((vm - -100) / 140) * plotH).toFixed(1);

    const legacy = $('[data-ep-legacy]');
    const cursorEl = legacy.querySelector('[data-ep-cursor]');
    const tracerEl = legacy.querySelector('[data-ep-tracer]');
    if (cursorEl) {
      cursorEl.setAttribute('x1', curX);
      cursorEl.setAttribute('x2', curX);
    }
    if (tracerEl) {
      tracerEl.setAttribute('cx', curX);
      tracerEl.setAttribute('cy', curY);
    }

    const info = activePhaseInfo(animTimeMs, cellType, triggerMode, en);
    const phaseLabel = legacy.querySelector('[data-ep-live-phase]');
    if (phaseLabel) {
      phaseLabel.textContent = `${info.phase} · Vm = ${Math.round(vm)} mV`;
    }

    // Highlight active channel gate
    ['na', 'ca', 'k', 'if'].forEach(gId => {
      const g = root.querySelector(`[data-ep-gate="${gId}"] rect`);
      if (g) {
        g.setAttribute('transform', info.activeGate === gId ? 'scale(1.08)' : 'scale(1)');
        g.style.transformBox = 'fill-box';
        g.style.transformOrigin = 'center';
      }
    });

    // Move ion particles through their respective channels
    ionParticles.forEach(p => {
      const node = root.querySelector(`[data-ep-ion="${p.id}"]`);
      if (!node) return;

      const isGateActive = p.kind === info.activeGate || (info.activeGate === 'if' && p.kind === 'na');
      const rate = (isGateActive ? 0.95 : 0.28) * speed;
      p.progress = (p.progress + dtSec * rate) % 1;

      let x = 105, y = 48;
      if (p.kind === 'na') {
        if (cellType === 'nodal' || (triggerMode === 'dad' && animTimeMs > 315)) {
          // Flow inward through If / NCX gate at x=436
          x = 436 + p.jitter * 18;
          y = 36 + p.progress * 96;
        } else {
          // Flow inward through Nav1.5 gate at x=105
          x = 105 + p.jitter * 18;
          y = 36 + p.progress * 96;
        }
      } else if (p.kind === 'ca') {
        if (triggerMode === 'dad' && p.id % 2 === 0) {
          // SR RyR2 calcium leak into cytosol toward NCX (x=515 -> x=440)
          x = 515 - p.progress * 78;
          y = 118 + p.jitter * 18;
        } else {
          // Inward Ca2+ through Cav1.2 at x=215
          x = 215 + p.jitter * 18;
          y = 36 + p.progress * 96;
        }
      } else {
        // Outward K+ efflux from cytosol (y=135) to extracellular (y=36) at x=325
        const effProg = triggerMode === 'ead' ? (p.progress * 0.45) : p.progress;
        x = 325 + p.jitter * 18;
        y = 136 - effProg * 98;
      }

      node.setAttribute('cx', x.toFixed(1));
      node.setAttribute('cy', y.toFixed(1));
      node.setAttribute('opacity', isGateActive ? '0.96' : '0.45');
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
