// Peripheral angiography studio: 5 vascular territories, 71-structure interactive SVG atlas,
// live C-arm fluoroscopy/DSA/roadmap projection engine, 3D C-arm gantry, 2D angle joystick,
// contrast bolus-chase animation, clinical lesion/CTO simulator, and ABI/TBI calculator.

import { REFERENCES, SCALES, UI, VIEWS, findStructure, loc, structuresFor, viewById } from './peripheral-data.js';
import { renderPeripheralSvg } from './peripheral-svg.js';
import {
  PERIPHERAL_LESIONS,
  PERIPHERAL_PRESETS,
  computeAbiTbi,
  computePeripheralTelemetry,
  hitTestPeripheralVessel,
  renderPeripheralFluoroscopyCanvas
} from './peripheral-sim.js';
import { createAngioDevice } from '../angio-device.js';

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const LEGEND = ['artery', 'branch', 'safe', 'risk', 'variant', 'vein', 'bone'];

const STUDIO_COPY = {
  tr: {
    anatomyTitle: 'Şematik anatomi ve bölge rehberi',
    liveTag: '● CANLI C-ARM DSA & FLOROSKOPİ STÜDYOSU',
    injectBtn: '💉 Kontrast Ver (Bolus)',
    injectingBtn: '💉 Bolus İlerliyor...',
    cinePause: '⏸ Dondur',
    cinePlay: '▶ Sine',
    shareBtn: '🔗 Paylaş',
    sharedBtn: '✓ Kopyalandı',
    dsaTitle: 'C-Arm Dijital Subtraksiyon (DSA) & Floroskopi Simülatörü',
    modeDsa: 'DSA Subtraksiyon',
    modeFluoro: 'Nativ Floroskopi',
    modeRoadmap: 'Yol Haritası (Roadmap)',
    togLabels: 'Damar Etiketleri',
    togBones: 'Kemik Referans',
    togCatheter: 'Kateter / Kılıf',
    togHeatmap: 'Kısalma Isı Haritası',
    teleVessel: 'HEDEF DAMAR / BÖLGE',
    teleElong: 'UZAMA / PROFİL İNDEKSİ',
    teleOverlap: 'BİFURKASYON DURUMU',
    joyTitle: '2B C-Arm Açı Kumandası (Joystick)',
    resetAp: 'AP (0°/0°) Sıfırla',
    presetsTitle: 'Standart Periferik Anjiyografi Projeksiyonları',
    lesionTitle: 'Klinik Lezyon, CTO & Girişim Simülatörü',
    lesionLabel: 'Patoloji / Senaryo Seçin:',
    jumpOptimal: '🎯 Önerilen Açıya Git',
    accessLabel: 'Önerilen Erişim / Kateter:',
    deviceTitle: '3B C-Arm Gantri & Kateter Laboratuvarı',
    deviceSub: 'Dedektör üstte (mavi) · X-ışını tüpü altta (kehribar)',
    beamToggle: 'Işın konisini göster',
    abiTitle: 'İnteraktif ABI & TBI Hemodinamik Hesaplayıcı (2016 AHA/ACC)',
    abiAnkle: 'Ayak Bileği Sistolik (DP/PT mmHg)',
    abiBrachial: 'Brakiyal Sistolik (Kol mmHg)',
    abiToe: 'Başparmak Sistolik (TBI mmHg)',
    abiResult: 'Hesaplanan İndeks',
    optViewBadge: 'Optimal Çalışma Açısı:'
  },
  en: {
    anatomyTitle: 'Schematic anatomy and territory guide',
    liveTag: '● LIVE C-ARM DSA & FLUOROSCOPY STUDIO',
    injectBtn: '💉 Inject Contrast (Bolus)',
    injectingBtn: '💉 Bolus Chasing...',
    cinePause: '⏸ Freeze',
    cinePlay: '▶ Cine',
    shareBtn: '🔗 Share View',
    sharedBtn: '✓ Copied',
    dsaTitle: 'C-Arm Digital Subtraction (DSA) & Fluoroscopy Simulator',
    modeDsa: 'DSA Subtraction',
    modeFluoro: 'Native Fluoroscopy',
    modeRoadmap: 'Roadmap Mask',
    togLabels: 'Vessel Labels',
    togBones: 'Bony Landmarks',
    togCatheter: 'Catheter / Sheath',
    togHeatmap: 'Foreshortening Heatmap',
    teleVessel: 'TARGET STRUCTURE',
    teleElong: 'ELONGATION / PROFILE INDEX',
    teleOverlap: 'BIFURCATION STATUS',
    joyTitle: '2D C-Arm Angle Trackpad (Joystick)',
    resetAp: 'Reset AP (0°/0°)',
    presetsTitle: 'Standard Peripheral Angiographic Projections',
    lesionTitle: 'Clinical Lesion, CTO & Intervention Simulator',
    lesionLabel: 'Select Pathology / Scenario:',
    jumpOptimal: '🎯 Jump to Optimal View',
    accessLabel: 'Recommended Access / Catheter:',
    deviceTitle: '3D C-Arm Gantry & Cath Lab Geometry',
    deviceSub: 'Detector above (blue) · X-ray tube below (amber)',
    beamToggle: 'Show X-ray beam cone',
    abiTitle: 'Interactive ABI & TBI Hemodynamic Calculator (2016 AHA/ACC)',
    abiAnkle: 'Ankle Systolic (DP/PT mmHg)',
    abiBrachial: 'Brachial Systolic (Arm mmHg)',
    abiToe: 'Hallux Toe Systolic (TBI mmHg)',
    abiResult: 'Calculated Index',
    optViewBadge: 'Optimal Working View:'
  }
};

function formatAngleReadout(alpha, beta) {
  const aStr = Math.abs(alpha) < 0.5 ? 'AP 0°' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(alpha))}°`;
  const bStr = Math.abs(beta) < 0.5 ? '0°' : `${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(beta))}°`;
  return `${aStr} · ${bStr}`;
}

function placeTip(tip, event) {
  tip.hidden = false;
  tip.style.left = '0px';
  tip.style.top = '0px';
  const box = tip.getBoundingClientRect();
  const pad = 8;
  let x = event.clientX + 14;
  let y = event.clientY + 18;
  if (x + box.width > window.innerWidth - pad) x = window.innerWidth - box.width - pad;
  if (y + box.height > window.innerHeight - pad) y = event.clientY - box.height - 12;
  tip.style.left = `${Math.max(pad, x)}px`;
  tip.style.top = `${Math.max(pad, y)}px`;
}

function scaleCard(scale, lang) {
  const rows = scale.rows.map(row =>
    `<span class="peri-grade">${esc(row.grade)}</span><span>${esc(loc(row, lang))}</span>`
  ).join('');
  const note = scale.note ? `<p class="peri-scale-note">${esc(loc(scale.note, lang))}</p>` : '';
  return `<article class="peri-scale">
    <h3>${esc(loc(scale.title, lang))}</h3>
    <p class="peri-scale-source">${esc(loc(scale.source, lang))}</p>
    <div class="peri-scale-rows">${rows}</div>
    ${note}
  </article>`;
}

function cardHtml(item, lang, ui) {
  const name = item ? loc(item.name, lang) : ui.empty;
  const text = item ? loc(item.text, lang) : ui.emptyHint;
  const pearl = item ? loc(item.pearl, lang) : '';
  return `<p class="peri-card-kicker" data-card-kicker>${esc(ui.cardKicker)}</p>
    <h2 data-card-name>${esc(name)}</h2>
    <h3 data-card-text-h>${esc(ui.desc)}</h3>
    <p data-card-text>${esc(text)}</p>
    <h3 data-card-pearl-h>${esc(ui.pearl)}</h3>
    <p data-card-pearl>${esc(pearl)}</p>`;
}

export function createPeripheralPanel({ mount, getLang }) {
  const state = {
    viewId: VIEWS[0].id,
    modeId: VIEWS[0].modes[0].id,
    selectedId: null,
    hoveredId: null,
    alpha: 0,
    beta: 0,
    imagingMode: 'dsa',
    showLabels: true,
    showBones: true,
    showCatheter: true,
    showHeatmap: false,
    showBeam: true,
    lesionId: 'none',
    cinePlaying: true,
    beatPhase: 0,
    contrastOpacity: 1.0,
    bolusWave: 1.2,
    isInjecting: false,
    injectStartTime: 0,
    abiAnkle: 124,
    abiBrachial: 120,
    abiToe: 92
  };

  // Parse initial hash state if present
  try {
    const rawHash = (location.hash || '').replace(/^#/, '');
    if (rawHash) {
      const hp = new URLSearchParams(rawHash);
      if (hp.get('view') && VIEWS.some(v => v.id === hp.get('view'))) {
        state.viewId = hp.get('view');
        state.modeId = viewById(state.viewId).modes[0].id;
      }
      if (hp.get('mode') && viewById(state.viewId).modes.some(m => m.id === hp.get('mode'))) {
        state.modeId = hp.get('mode');
      }
      if (hp.has('a')) state.alpha = Math.max(-90, Math.min(90, Number(hp.get('a')) || 0));
      if (hp.has('b')) state.beta = Math.max(-45, Math.min(45, Number(hp.get('b')) || 0));
      if (hp.get('img') && ['dsa', 'fluoro', 'roadmap'].includes(hp.get('img'))) {
        state.imagingMode = hp.get('img');
      }
      if (hp.get('lesion') && PERIPHERAL_LESIONS.some(l => l.id === hp.get('lesion'))) {
        state.lesionId = hp.get('lesion');
      }
    }
  } catch (_) {
    // Ignore malformed hash
  }

  let skeletonReady = false;
  let device = null;
  let clickRegions = [];
  let animFrameId = null;
  let lastFrameTime = performance.now();
  let isDraggingJoy = false;

  function activeLesionObj() {
    const found = PERIPHERAL_LESIONS.find(l => l.id === state.lesionId) || PERIPHERAL_LESIONS[0];
    if (found.id === 'none' || found.view === state.viewId) return found;
    return PERIPHERAL_LESIONS[0];
  }

  function selectedItem() {
    const item = state.selectedId ? findStructure(state.selectedId) : null;
    if (!item || item.view !== state.viewId || !item.modes.includes(state.modeId)) return null;
    return item;
  }

  function syncUrlHash() {
    try {
      const hash = `#view=${state.viewId}&mode=${state.modeId}&a=${Math.round(state.alpha)}&b=${Math.round(state.beta)}&img=${state.imagingMode}`;
      history.replaceState(null, '', hash);
    } catch (_) {
      // Ignore history errors
    }
  }

  function buildSkeleton() {
    mount.innerHTML = `<div class="peri-page">
      <div class="peri-top-bar">
        <div>
          <p class="peri-kicker" data-peri-kicker></p>
          <p class="peri-intro" data-peri-intro></p>
        </div>
        <button type="button" class="peri-share-btn" data-peri-share></button>
      </div>
      <div class="peri-tabs" role="tablist" data-peri-tabs></div>
      <h1 data-peri-title></h1>
      <p class="peri-lead" data-peri-lead></p>

      <div class="peri-stage">
        <div class="peri-left-col">
          <div class="peri-console-head">
            <div class="peri-console-titles">
              <span class="peri-live-tag" data-peri-live-tag></span>
              <strong class="peri-angle-readout" data-peri-angle-readout></strong>
            </div>
            <div class="peri-console-actions">
              <button type="button" class="peri-inject-btn" data-peri-inject></button>
              <button type="button" class="peri-cine-btn" data-peri-cine></button>
            </div>
          </div>

          <section class="peri-fluoro-card" aria-label="C-Arm Fluoroscopy & DSA">
            <div class="peri-fluoro-head">
              <h2 class="peri-subcard-title" data-peri-dsa-title></h2>
              <div class="peri-img-modes" role="group" data-peri-img-modes></div>
            </div>
            <div class="peri-fluoro-canvas-wrap">
              <canvas id="peri-fluo-canvas" data-peri-fluo-canvas width="540" height="440"></canvas>
            </div>
            <div class="peri-toggle-strip" data-peri-toggles></div>
            <div class="peri-tele-strip">
              <div class="peri-tele-cell">
                <span class="peri-tele-label" data-peri-tele-lbl-vessel></span>
                <span class="peri-tele-val" data-peri-tele-vessel></span>
              </div>
              <div class="peri-tele-cell">
                <span class="peri-tele-label" data-peri-tele-lbl-elong></span>
                <span class="peri-tele-val" data-peri-tele-elong></span>
              </div>
              <div class="peri-tele-cell">
                <span class="peri-tele-label" data-peri-tele-lbl-overlap></span>
                <span class="peri-tele-val" data-peri-tele-overlap></span>
              </div>
            </div>
          </section>
          <aside class="peri-card" data-peri-card></aside>
        </div>

        <div class="peri-right-col">
          <section class="peri-device-box">
            <div class="peri-device-head">
              <span class="peri-subcard-title" data-peri-device-title></span>
              <span class="peri-device-sub" data-peri-device-sub></span>
            </div>
            <div class="peri-device-viewport" data-peri-device></div>
            <label class="peri-toggle-chip peri-beam-chip">
              <input type="checkbox" checked data-peri-beam />
              <span data-peri-beam-label></span>
            </label>
          </section>

          <section class="peri-pad-box" aria-label="C-Arm Joystick">
            <div class="peri-pad-header">
              <span class="peri-subcard-title" data-peri-joy-title></span>
              <button type="button" class="peri-reset-btn" data-peri-reset-ap></button>
            </div>
            <div class="peri-pad-flex">
              <div class="peri-joystick-wrap">
                <div class="peri-joy-pad" data-peri-joy-pad>
                  <div class="peri-joy-axis joy-h"></div>
                  <div class="peri-joy-axis joy-v"></div>
                  <div class="peri-joy-ring ring-30"></div>
                  <div class="peri-joy-ring ring-60"></div>
                  <div class="peri-joy-puck" data-peri-joy-puck></div>
                  <span class="peri-joy-lbl lbl-top">CRA</span>
                  <span class="peri-joy-lbl lbl-bottom">CAU</span>
                  <span class="peri-joy-lbl lbl-left">RAO</span>
                  <span class="peri-joy-lbl lbl-right">LAO</span>
                </div>
              </div>
              <div class="peri-nudge-col">
                <label class="peri-slider-item">
                  <span class="peri-slider-label">
                    <span>RAO (-) / LAO (+)</span>
                    <strong data-peri-lbl-alpha>0°</strong>
                  </span>
                  <input type="range" min="-90" max="90" step="1" value="0" data-peri-slider-alpha />
                </label>
                <label class="peri-slider-item">
                  <span class="peri-slider-label">
                    <span>CAU (-) / CRA (+)</span>
                    <strong data-peri-lbl-beta>0°</strong>
                  </span>
                  <input type="range" min="-45" max="45" step="1" value="0" data-peri-slider-beta />
                </label>
                <div class="peri-nudge-cluster">
                  <button type="button" class="peri-nudge-btn" data-peri-nudge="cra">▲ CRA</button>
                  <div class="peri-nudge-mid">
                    <button type="button" class="peri-nudge-btn" data-peri-nudge="rao">◀ RAO</button>
                    <button type="button" class="peri-nudge-btn" data-peri-nudge="ap">AP</button>
                    <button type="button" class="peri-nudge-btn" data-peri-nudge="lao">LAO ▶</button>
                  </div>
                  <button type="button" class="peri-nudge-btn" data-peri-nudge="cau">▼ CAU</button>
                </div>
              </div>
            </div>
          </section>

          <section class="peri-preset-box">
            <h2 class="peri-subcard-title" data-peri-presets-title></h2>
            <div class="peri-preset-grid" data-peri-preset-grid></div>
          </section>

          <section class="peri-lesion-box">
            <h2 class="peri-subcard-title" data-peri-lesion-title></h2>
            <div class="peri-lesion-picker">
              <label for="peri-lesion-select" data-peri-lesion-label></label>
              <select id="peri-lesion-select" class="peri-select" data-peri-lesion-select></select>
            </div>
            <div class="peri-lesion-card" data-peri-lesion-card hidden></div>
          </section>
        </div>
        <details class="peri-anatomy" data-peri-anatomy>
          <summary data-peri-anatomy-title></summary>
          <p class="peri-view-pearl" data-peri-view-pearl></p>
          <div class="peri-modes" data-peri-modes></div>
          <div class="peri-canvas">
            <div class="peri-svg-host" data-peri-svg></div>
            <p class="peri-scale-note" data-peri-scale-note></p>
            <p class="peri-legend-label" data-peri-legend-label></p>
            <ul class="peri-legend" data-peri-legend></ul>
          </div>
        </details>
      </div>

      <section class="peri-abi-box" data-peri-abi-section>
        <h2 data-peri-abi-title></h2>
        <div class="peri-abi-grid">
          <label class="peri-abi-field">
            <span data-peri-abi-lbl-ankle></span>
            <input type="number" min="0" max="300" step="2" value="${state.abiAnkle}" data-abi-ankle />
          </label>
          <label class="peri-abi-field">
            <span data-peri-abi-lbl-brachial></span>
            <input type="number" min="40" max="260" step="2" value="${state.abiBrachial}" data-abi-brachial />
          </label>
          <label class="peri-abi-field">
            <span data-peri-abi-lbl-toe></span>
            <input type="number" min="0" max="220" step="2" value="${state.abiToe}" data-abi-toe />
          </label>
          <output class="peri-abi-output" data-abi-output></output>
        </div>
      </section>

      <section class="peri-scales" data-peri-scales-sec>
        <h2 data-peri-scales-h></h2>
        <div class="peri-scale-grid" data-peri-scale-grid></div>
      </section>

      <section class="peri-refs">
        <h2 data-peri-refs-h></h2>
        <p data-peri-refs-note></p>
        <ol data-peri-refs-list></ol>
      </section>

      <div class="peri-tip" data-peri-tip hidden></div>
    </div>`;

    const deviceMount = mount.querySelector('[data-peri-device]');
    if (deviceMount) {
      try {
        device = createAngioDevice(deviceMount);
        device.setAngles(state.alpha, state.beta);
      } catch (_) {
        device = null;
      }
    }

    bindCanvasAndJoystickEvents();
    skeletonReady = true;
  }

  function updateAnglesUI() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const st = STUDIO_COPY[lang];
    const view = viewById(state.viewId);
    const presets = PERIPHERAL_PRESETS[view.id] || [];
    const matchedPreset = presets.find(
      p => Math.abs(p.alpha - state.alpha) <= 4 && Math.abs(p.beta - state.beta) <= 4
    );

    const readoutEl = mount.querySelector('[data-peri-angle-readout]');
    if (readoutEl) {
      const angleStr = formatAngleReadout(state.alpha, state.beta);
      readoutEl.textContent = matchedPreset
        ? `${loc(matchedPreset.name, lang)} (${angleStr})`
        : angleStr;
    }

    const sliderA = mount.querySelector('[data-peri-slider-alpha]');
    const sliderB = mount.querySelector('[data-peri-slider-beta]');
    if (sliderA) sliderA.value = String(Math.round(state.alpha));
    if (sliderB) sliderB.value = String(Math.round(state.beta));

    const lblA = mount.querySelector('[data-peri-lbl-alpha]');
    const lblB = mount.querySelector('[data-peri-lbl-beta]');
    if (lblA) {
      lblA.textContent = Math.abs(state.alpha) < 0.5
        ? 'AP 0°'
        : `${state.alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(state.alpha))}°`;
    }
    if (lblB) {
      lblB.textContent = Math.abs(state.beta) < 0.5
        ? '0°'
        : `${state.beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(state.beta))}°`;
    }

    // Update joystick puck position
    const puck = mount.querySelector('[data-peri-joy-puck]');
    if (puck) {
      const maxR = 46;
      const px = (state.alpha / 90) * maxR;
      const py = -(state.beta / 45) * maxR;
      puck.style.transform = `translate(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px))`;
    }

    // Update preset button active states
    mount.querySelectorAll('[data-peri-preset]').forEach(btn => {
      const pid = btn.dataset.periPreset;
      const isAct = matchedPreset && matchedPreset.id === pid;
      btn.classList.toggle('is-on', Boolean(isAct));
      btn.setAttribute('aria-pressed', String(Boolean(isAct)));
    });

    // Update 3D C-arm device
    device?.setAngles(state.alpha, state.beta);

    // Update telemetry strip
    const tele = computePeripheralTelemetry(view.id, state.alpha, state.beta, state.selectedId);
    const vEl = mount.querySelector('[data-peri-tele-vessel]');
    const eEl = mount.querySelector('[data-peri-tele-elong]');
    const oEl = mount.querySelector('[data-peri-tele-overlap]');

    if (vEl && tele.target) {
      vEl.textContent = lang === 'en' ? tele.target.nameEn : tele.target.nameTr;
    }
    if (eEl && tele.target) {
      const pct = Math.round(tele.target.elongation * 100);
      const tag = tele.target.rating === 'excellent'
        ? (lang === 'en' ? 'Optimal' : 'Optimal')
        : tele.target.rating === 'moderate'
          ? (lang === 'en' ? 'Moderate' : 'Orta')
          : (lang === 'en' ? 'Foreshortened' : 'Kısalmış');
      eEl.textContent = `%${pct} (${tag})`;
      eEl.className = `peri-tele-val ${tele.target.rating}`;
    }
    if (oEl && tele.overlapStatus) {
      oEl.textContent = lang === 'en' ? tele.overlapStatus.en : tele.overlapStatus.tr;
      oEl.className = `peri-tele-val ${tele.overlapStatus.state}`;
    }

    // Redraw fluoroscopy/DSA canvas
    drawFluoro();
    syncUrlHash();
  }

  function drawFluoro() {
    const canvas = mount.querySelector('[data-peri-fluo-canvas]');
    if (!canvas) return;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    clickRegions = renderPeripheralFluoroscopyCanvas(canvas, {
      viewId: state.viewId,
      alpha: state.alpha,
      beta: state.beta,
      imagingMode: state.imagingMode,
      activeLesion: activeLesionObj(),
      beatPhase: state.beatPhase,
      contrastOpacity: state.contrastOpacity,
      bolusWave: state.bolusWave,
      showLabels: state.showLabels,
      showBones: state.showBones,
      showCatheter: state.showCatheter,
      showHeatmap: state.showHeatmap,
      hoveredId: state.hoveredId,
      selectedId: state.selectedId,
      cinePlaying: state.cinePlaying,
      lang
    });
  }

  function updateAbiUI() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const st = STUDIO_COPY[lang];
    const res = computeAbiTbi({
      ankle: state.abiAnkle,
      brachial: state.abiBrachial,
      toe: state.abiToe
    });
    const out = mount.querySelector('[data-abi-output]');
    if (!out) return;
    if (!res.valid) {
      out.innerHTML = `<span>${esc(st.abiResult)}</span><strong>-</strong>`;
      return;
    }
    const label = lang === 'en' ? res.labelEn : res.labelTr;
    const stage = lang === 'en' ? res.stageEn : res.stageTr;
    const tbiText = res.tbi !== null ? ` · TBI ${res.tbi.toFixed(2)}` : '';
    out.className = `peri-abi-output status-${res.status}`;
    out.innerHTML = `<div class="peri-abi-main">
        <span>${esc(st.abiResult)}:</span>
        <strong data-abi-value>ABI ${res.abi.toFixed(2)}${esc(tbiText)}</strong>
        <span class="peri-abi-badge">${esc(label)}</span>
      </div>
      <p class="peri-abi-stage">${esc(stage)}</p>`;
  }

  function render() {
    if (!skeletonReady || !mount.querySelector('.peri-page')) {
      buildSkeleton();
    }
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const ui = UI[lang];
    const st = STUDIO_COPY[lang];
    const view = viewById(state.viewId);
    if (!view.modes.some(mode => mode.id === state.modeId)) state.modeId = view.modes[0].id;
    const item = selectedItem();
    const structures = structuresFor(view.id, state.modeId);
    const activeLesion = activeLesionObj();

    mount.querySelector('[data-peri-kicker]').textContent = ui.kicker;
    mount.querySelector('[data-peri-intro]').textContent = ui.lead;
    const shareBtn = mount.querySelector('[data-peri-share]');
    if (shareBtn && !shareBtn.dataset.copied) shareBtn.textContent = st.shareBtn;

    const tabsEl = mount.querySelector('[data-peri-tabs]');
    tabsEl.setAttribute('aria-label', ui.tabs);
    tabsEl.innerHTML = VIEWS.map(entry => {
      const on = entry.id === view.id;
      return `<button type="button" role="tab" data-peri-tab="${entry.id}" aria-selected="${on}" class="${on ? 'is-on' : ''}">${esc(loc(entry.tab, lang))}</button>`;
    }).join('');

    mount.querySelector('[data-peri-anatomy-title]').textContent = st.anatomyTitle;
    mount.querySelector('[data-peri-fluo-canvas]').setAttribute('aria-label', st.dsaTitle);
    mount.querySelector('[data-peri-title]').textContent = loc(view.title, lang);
    mount.querySelector('[data-peri-lead]').textContent = loc(view.lead, lang);
    mount.querySelector('[data-peri-view-pearl]').textContent = loc(view.pearl, lang);

    const modesEl = mount.querySelector('[data-peri-modes]');
    modesEl.innerHTML = view.modes.length > 1
      ? view.modes.map(mode => {
        const on = mode.id === state.modeId;
        return `<button type="button" data-peri-mode="${mode.id}" aria-pressed="${on}" class="${on ? 'is-on' : ''}">${esc(loc(mode, lang))}</button>`;
      }).join('')
      : '';

    mount.querySelector('[data-peri-live-tag]').textContent = st.liveTag;
    const injectBtn = mount.querySelector('[data-peri-inject]');
    if (injectBtn) {
      injectBtn.textContent = state.isInjecting ? st.injectingBtn : st.injectBtn;
      injectBtn.classList.toggle('is-injecting', state.isInjecting);
    }
    const cineBtn = mount.querySelector('[data-peri-cine]');
    if (cineBtn) {
      cineBtn.textContent = state.cinePlaying ? st.cinePause : st.cinePlay;
      cineBtn.classList.toggle('is-on', state.cinePlaying);
      cineBtn.setAttribute('aria-pressed', String(state.cinePlaying));
    }

    const svgHost = mount.querySelector('[data-peri-svg]');
    svgHost.innerHTML = renderPeripheralSvg({
      view: view.id,
      mode: state.modeId,
      structures,
      lang,
      selectedId: item ? item.id : null,
      activeLesion
    });

    mount.querySelector('[data-peri-scale-note]').textContent = ui.scaleNote;
    mount.querySelector('[data-peri-legend-label]').textContent = ui.legend;
    mount.querySelector('[data-peri-legend]').innerHTML = LEGEND.map(key =>
      `<li><span class="peri-swatch peri-swatch-${key}"></span>${esc(ui[key])}</li>`
    ).join('');

    // Fluoroscopy & DSA Console
    mount.querySelector('[data-peri-dsa-title]').textContent = st.dsaTitle;
    const imgModes = [
      { id: 'dsa', label: st.modeDsa },
      { id: 'fluoro', label: st.modeFluoro },
      { id: 'roadmap', label: st.modeRoadmap }
    ];
    mount.querySelector('[data-peri-img-modes]').innerHTML = imgModes.map(m => {
      const on = state.imagingMode === m.id;
      return `<button type="button" class="peri-chip ${on ? 'is-on' : ''}" data-peri-img-mode="${m.id}" aria-pressed="${on}">${esc(m.label)}</button>`;
    }).join('');

    const toggles = [
      { id: 'labels', checked: state.showLabels, label: st.togLabels },
      { id: 'bones', checked: state.showBones, label: st.togBones },
      { id: 'catheter', checked: state.showCatheter, label: st.togCatheter },
      { id: 'heatmap', checked: state.showHeatmap, label: st.togHeatmap }
    ];
    mount.querySelector('[data-peri-toggles]').innerHTML = toggles.map(t =>
      `<label class="peri-toggle-chip"><input type="checkbox" data-peri-toggle="${t.id}" ${t.checked ? 'checked' : ''}/><span>${esc(t.label)}</span></label>`
    ).join('');

    mount.querySelector('[data-peri-tele-lbl-vessel]').textContent = st.teleVessel;
    mount.querySelector('[data-peri-tele-lbl-elong]').textContent = st.teleElong;
    mount.querySelector('[data-peri-tele-lbl-overlap]').textContent = st.teleOverlap;

    // Selected structure card
    mount.querySelector('[data-peri-card]').innerHTML = cardHtml(item, lang, ui);

    // Joystick & Presets
    mount.querySelector('[data-peri-joy-title]').textContent = st.joyTitle;
    mount.querySelector('[data-peri-reset-ap]').textContent = st.resetAp;
    mount.querySelector('[data-peri-presets-title]').textContent = st.presetsTitle;

    const presets = PERIPHERAL_PRESETS[view.id] || [];
    mount.querySelector('[data-peri-preset-grid]').innerHTML = presets.map(p => {
      const ang = formatAngleReadout(p.alpha, p.beta);
      return `<button type="button" class="peri-preset-btn" data-peri-preset="${p.id}">
        <div class="peri-preset-top">
          <strong class="peri-preset-name">${esc(loc(p.name, lang))}</strong>
          <span class="peri-preset-ang">${esc(ang)}</span>
        </div>
        <div class="peri-preset-target">${esc(loc(p.target, lang))}</div>
      </button>`;
    }).join('');

    // Lesion Simulator
    mount.querySelector('[data-peri-lesion-title]').textContent = st.lesionTitle;
    mount.querySelector('[data-peri-lesion-label]').textContent = st.lesionLabel;
    const lesionSelect = mount.querySelector('[data-peri-lesion-select]');
    lesionSelect.innerHTML = PERIPHERAL_LESIONS.map(l => {
      const sel = l.id === state.lesionId ? 'selected' : '';
      return `<option value="${esc(l.id)}" ${sel}>${esc(loc(l.name, lang))}</option>`;
    }).join('');

    const lesionCard = mount.querySelector('[data-peri-lesion-card]');
    const pickedLesion = PERIPHERAL_LESIONS.find(l => l.id === state.lesionId) || PERIPHERAL_LESIONS[0];
    if (pickedLesion.id === 'none') {
      lesionCard.hidden = true;
      lesionCard.innerHTML = '';
    } else {
      lesionCard.hidden = false;
      const optStr = formatAngleReadout(pickedLesion.recAlpha, pickedLesion.recBeta);
      const badge = pickedLesion.isCto ? 'CTO %100' : `-%${pickedLesion.pct}`;
      lesionCard.innerHTML = `<div class="peri-lesion-head">
          <strong>${esc(loc(pickedLesion.name, lang))}</strong>
          <span class="peri-lesion-pct">${esc(badge)}</span>
        </div>
        <div class="peri-lesion-badges">
          <span class="peri-meta-pill">${esc(pickedLesion.tasc)}</span>
          ${pickedLesion.rutherford !== '-' ? `<span class="peri-meta-pill">Rutherford ${esc(pickedLesion.rutherford)}</span>` : ''}
        </div>
        <p class="peri-lesion-desc">${esc(loc(pickedLesion.desc, lang))}</p>
        <p class="peri-lesion-access"><strong>${esc(st.accessLabel)}</strong> ${esc(loc(pickedLesion.access, lang))}</p>
        <div class="peri-lesion-rec-row">
          <span>${esc(st.optViewBadge)} <strong>${esc(optStr)}</strong></span>
          <button type="button" class="peri-jump-btn" data-peri-jump-optimal>${esc(st.jumpOptimal)}</button>
        </div>`;
    }

    // 3D Device labels
    mount.querySelector('[data-peri-device-title]').textContent = st.deviceTitle;
    mount.querySelector('[data-peri-device-sub]').textContent = st.deviceSub;
    mount.querySelector('[data-peri-beam-label]').textContent = st.beamToggle;
    const beamChk = mount.querySelector('[data-peri-beam]');
    if (beamChk) beamChk.checked = state.showBeam;

    // ABI / TBI Calculator
    mount.querySelector('[data-peri-abi-title]').textContent = st.abiTitle;
    mount.querySelector('[data-peri-abi-lbl-ankle]').textContent = st.abiAnkle;
    mount.querySelector('[data-peri-abi-lbl-brachial]').textContent = st.abiBrachial;
    mount.querySelector('[data-peri-abi-lbl-toe]').textContent = st.abiToe;
    const inAnkle = mount.querySelector('[data-abi-ankle]');
    const inBrach = mount.querySelector('[data-abi-brachial]');
    const inToe = mount.querySelector('[data-abi-toe]');
    if (inAnkle && document.activeElement !== inAnkle) inAnkle.value = String(state.abiAnkle);
    if (inBrach && document.activeElement !== inBrach) inBrach.value = String(state.abiBrachial);
    if (inToe && document.activeElement !== inToe) inToe.value = String(state.abiToe);
    updateAbiUI();

    // Scales & References
    const scalesSec = mount.querySelector('[data-peri-scales-sec]');
    scalesSec.setAttribute('aria-label', ui.scales);
    mount.querySelector('[data-peri-scales-h]').textContent = ui.scales;
    mount.querySelector('[data-peri-scale-grid]').innerHTML = ['rutherford', 'fontaine', 'abi']
      .map(key => scaleCard(SCALES[key], lang))
      .join('');

    mount.querySelector('[data-peri-refs-h]').textContent = ui.refs;
    mount.querySelector('[data-peri-refs-note]').textContent = ui.refsNote;
    mount.querySelector('[data-peri-refs-list]').innerHTML = REFERENCES.map(line => `<li>${esc(line)}</li>`).join('');

    updateAnglesUI();
  }

  function setAngles(a, b) {
    state.alpha = Math.max(-90, Math.min(90, Number(a) || 0));
    state.beta = Math.max(-45, Math.min(45, Number(b) || 0));
    updateAnglesUI();
  }

  function triggerContrastBolus() {
    state.isInjecting = true;
    state.injectStartTime = performance.now();
    state.contrastOpacity = 1.0;
    state.bolusWave = 0.05;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const injectBtn = mount.querySelector('[data-peri-inject]');
    if (injectBtn) {
      injectBtn.textContent = STUDIO_COPY[lang].injectingBtn;
      injectBtn.classList.add('is-injecting');
    }
    const svgEl = mount.querySelector('.peri-svg');
    if (svgEl) {
      svgEl.classList.remove('is-bolus-flash');
      void svgEl.offsetWidth;
      svgEl.classList.add('is-bolus-flash');
    }
    drawFluoro();
  }

  function setView(id) {
    const view = viewById(id);
    state.viewId = view.id;
    state.modeId = view.modes[0].id;
    state.selectedId = null;
    render();
  }

  function setMode(id) {
    const view = viewById(state.viewId);
    if (!view.modes.some(mode => mode.id === id)) return;
    state.modeId = id;
    if (view.id === 'visceral') {
      if (id === 'ap') { state.alpha = 0; state.beta = 0; }
      else if (id === 'lateral') { state.alpha = 85; state.beta = 0; }
      else if (id === 'oblique') { state.alpha = 18; state.beta = 0; }
    }
    const current = state.selectedId ? findStructure(state.selectedId) : null;
    if (current && !current.modes.includes(id)) state.selectedId = null;
    render();
  }

  function select(id) {
    state.selectedId = id;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const ui = UI[lang];
    const item = selectedItem();
    const cardEl = mount.querySelector('[data-peri-card]');
    if (cardEl) cardEl.innerHTML = cardHtml(item, lang, ui);
    mount.querySelectorAll('[data-structure]').forEach(node => {
      const on = node.dataset.structure === (item ? item.id : null);
      node.classList.toggle('is-on', on);
      node.setAttribute('aria-pressed', String(on));
    });
    updateAnglesUI();
  }

  function bindCanvasAndJoystickEvents() {
    const joyPad = mount.querySelector('[data-peri-joy-pad]');
    if (joyPad) {
      const updateFromPointer = e => {
        const rect = joyPad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxR = rect.width / 2 - 10;
        const dx = Math.max(-maxR, Math.min(maxR, e.clientX - cx));
        const dy = Math.max(-maxR, Math.min(maxR, e.clientY - cy));
        setAngles(Math.round((dx / maxR) * 90), Math.round((-dy / maxR) * 45));
      };
      joyPad.addEventListener('pointerdown', e => {
        isDraggingJoy = true;
        joyPad.setPointerCapture?.(e.pointerId);
        updateFromPointer(e);
      });
      joyPad.addEventListener('pointermove', e => {
        if (!isDraggingJoy) return;
        updateFromPointer(e);
      });
      const stopJoy = () => { isDraggingJoy = false; };
      joyPad.addEventListener('pointerup', stopJoy);
      joyPad.addEventListener('pointercancel', stopJoy);
    }

    const canvas = mount.querySelector('[data-peri-fluo-canvas]');
    if (canvas) {
      const coords = e => {
        const rect = canvas.getBoundingClientRect();
        const lw = Number(canvas.dataset.logicalW || 540);
        const lh = Number(canvas.dataset.logicalH || 440);
        return {
          x: (e.clientX - rect.left) * (lw / Math.max(1, rect.width)),
          y: (e.clientY - rect.top) * (lh / Math.max(1, rect.height))
        };
      };
      canvas.addEventListener('pointermove', e => {
        const pt = coords(e);
        const hit = hitTestPeripheralVessel(clickRegions, pt.x, pt.y);
        if (hit !== state.hoveredId) {
          state.hoveredId = hit;
          canvas.style.cursor = hit ? 'pointer' : 'crosshair';
          drawFluoro();
        }
      });
      canvas.addEventListener('pointerleave', () => {
        if (state.hoveredId) {
          state.hoveredId = null;
          drawFluoro();
        }
      });
      canvas.addEventListener('click', e => {
        const pt = coords(e);
        const hit = hitTestPeripheralVessel(clickRegions, pt.x, pt.y);
        if (hit) select(hit);
      });
    }
  }

  mount.addEventListener('click', event => {
    const tab = event.target.closest?.('[data-peri-tab]');
    if (tab && mount.contains(tab)) {
      setView(tab.dataset.periTab);
      return;
    }
    const mode = event.target.closest?.('[data-peri-mode]');
    if (mode && mount.contains(mode)) {
      setMode(mode.dataset.periMode);
      return;
    }
    const hit = event.target.closest?.('[data-structure]');
    if (hit && mount.contains(hit)) {
      select(hit.dataset.structure);
      return;
    }
    const imgBtn = event.target.closest?.('[data-peri-img-mode]');
    if (imgBtn && mount.contains(imgBtn)) {
      state.imagingMode = imgBtn.dataset.periImgMode;
      render();
      return;
    }
    const presetBtn = event.target.closest?.('[data-peri-preset]');
    if (presetBtn && mount.contains(presetBtn)) {
      const presets = PERIPHERAL_PRESETS[state.viewId] || [];
      const found = presets.find(p => p.id === presetBtn.dataset.periPreset);
      if (found) {
        if (found.mode && viewById(state.viewId).modes.some(m => m.id === found.mode)) {
          state.modeId = found.mode;
        }
        if (found.targetId) state.selectedId = found.targetId;
        state.alpha = found.alpha;
        state.beta = found.beta;
        render();
      }
      return;
    }
    const nudgeBtn = event.target.closest?.('[data-peri-nudge]');
    if (nudgeBtn && mount.contains(nudgeBtn)) {
      const dir = nudgeBtn.dataset.periNudge;
      if (dir === 'ap') setAngles(0, 0);
      else if (dir === 'rao') setAngles(state.alpha - 10, state.beta);
      else if (dir === 'lao') setAngles(state.alpha + 10, state.beta);
      else if (dir === 'cra') setAngles(state.alpha, state.beta + 10);
      else if (dir === 'cau') setAngles(state.alpha, state.beta - 10);
      return;
    }
    const resetBtn = event.target.closest?.('[data-peri-reset-ap]');
    if (resetBtn && mount.contains(resetBtn)) {
      setAngles(0, 0);
      return;
    }
    const injectBtn = event.target.closest?.('[data-peri-inject]');
    if (injectBtn && mount.contains(injectBtn)) {
      triggerContrastBolus();
      return;
    }
    const cineBtn = event.target.closest?.('[data-peri-cine]');
    if (cineBtn && mount.contains(cineBtn)) {
      state.cinePlaying = !state.cinePlaying;
      render();
      return;
    }
    const jumpBtn = event.target.closest?.('[data-peri-jump-optimal]');
    if (jumpBtn && mount.contains(jumpBtn)) {
      const les = PERIPHERAL_LESIONS.find(l => l.id === state.lesionId);
      if (les && les.id !== 'none') {
        if (les.view !== 'all' && les.view !== state.viewId) {
          state.viewId = les.view;
          state.modeId = viewById(les.view).modes[0].id;
        }
        if (les.vesselId) state.selectedId = les.vesselId;
        state.alpha = les.recAlpha;
        state.beta = les.recBeta;
        render();
        triggerContrastBolus();
      }
      return;
    }
    const shareBtn = event.target.closest?.('[data-peri-share]');
    if (shareBtn && mount.contains(shareBtn)) {
      syncUrlHash();
      const lang = getLang() === 'en' ? 'en' : 'tr';
      navigator.clipboard?.writeText(location.href).catch(() => {});
      shareBtn.dataset.copied = '1';
      shareBtn.textContent = STUDIO_COPY[lang].sharedBtn;
      setTimeout(() => {
        delete shareBtn.dataset.copied;
        shareBtn.textContent = STUDIO_COPY[getLang() === 'en' ? 'en' : 'tr'].shareBtn;
      }, 1500);
    }
  });

  mount.addEventListener('input', event => {
    const t = event.target;
    if (t.matches?.('[data-peri-slider-alpha]')) {
      setAngles(Number(t.value), state.beta);
      return;
    }
    if (t.matches?.('[data-peri-slider-beta]')) {
      setAngles(state.alpha, Number(t.value));
      return;
    }
    if (t.matches?.('[data-abi-ankle]')) {
      state.abiAnkle = Number(t.value);
      updateAbiUI();
      return;
    }
    if (t.matches?.('[data-abi-brachial]')) {
      state.abiBrachial = Number(t.value);
      updateAbiUI();
      return;
    }
    if (t.matches?.('[data-abi-toe]')) {
      state.abiToe = Number(t.value);
      updateAbiUI();
    }
  });

  mount.addEventListener('change', event => {
    const t = event.target;
    if (t.matches?.('[data-peri-toggle]')) {
      const kind = t.dataset.periToggle;
      if (kind === 'labels') state.showLabels = t.checked;
      else if (kind === 'bones') state.showBones = t.checked;
      else if (kind === 'catheter') state.showCatheter = t.checked;
      else if (kind === 'heatmap') state.showHeatmap = t.checked;
      drawFluoro();
      return;
    }
    if (t.matches?.('[data-peri-beam]')) {
      state.showBeam = t.checked;
      device?.setBeam(state.showBeam);
      return;
    }
    if (t.matches?.('[data-peri-lesion-select]')) {
      state.lesionId = t.value;
      const picked = PERIPHERAL_LESIONS.find(l => l.id === state.lesionId);
      if (picked && picked.id !== 'none') {
        if (picked.view !== 'all' && picked.view !== state.viewId) {
          state.viewId = picked.view;
          state.modeId = viewById(picked.view).modes[0].id;
        }
        if (picked.vesselId) state.selectedId = picked.vesselId;
        if (picked.abiPreset) {
          state.abiAnkle = picked.abiPreset.ankle;
          state.abiBrachial = picked.abiPreset.brachial;
          state.abiToe = picked.abiPreset.toe;
        }
      }
      render();
    }
  });

  mount.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const hit = event.target.closest?.('[data-structure]');
    if (!hit || !mount.contains(hit)) return;
    event.preventDefault();
    select(hit.dataset.structure);
  });

  mount.addEventListener('pointerover', event => {
    const hit = event.target.closest?.('[data-structure]');
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip || !hit || !mount.contains(hit)) return;
    tip.textContent = hit.dataset.name || '';
    placeTip(tip, event);
  });

  mount.addEventListener('pointermove', event => {
    const hit = event.target.closest?.('[data-structure]');
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip || !hit || !mount.contains(hit) || tip.hidden) return;
    placeTip(tip, event);
  });

  mount.addEventListener('pointerout', event => {
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip) return;
    const current = event.target.closest?.('[data-structure]');
    const next = event.relatedTarget?.closest?.('[data-structure]');
    if (current && current === next) return;
    tip.hidden = true;
  });

  function animateLoop(now) {
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    let needsDraw = false;

    if (state.cinePlaying) {
      state.beatPhase = (state.beatPhase + dt * 1.15) % 1.0;
      needsDraw = true;
    }

    if (state.isInjecting) {
      const elapsed = (now - state.injectStartTime) / 1000;
      if (elapsed < 1.35) {
        state.bolusWave = 0.08 + (elapsed / 1.35) * 1.25;
        state.contrastOpacity = 1.0;
      } else if (elapsed < 2.6) {
        state.bolusWave = 1.33;
        const w = (elapsed - 1.35) / 1.25;
        state.contrastOpacity = Math.max(0.45, 1.0 - w * 0.55);
      } else {
        state.isInjecting = false;
        state.bolusWave = 1.25;
        state.contrastOpacity = 1.0;
        const lang = getLang() === 'en' ? 'en' : 'tr';
        const injectBtn = mount.querySelector('[data-peri-inject]');
        if (injectBtn) {
          injectBtn.textContent = STUDIO_COPY[lang].injectBtn;
          injectBtn.classList.remove('is-injecting');
        }
      }
      needsDraw = true;
    }

    if (needsDraw) drawFluoro();
    animFrameId = requestAnimationFrame(animateLoop);
  }

  render();
  animFrameId = requestAnimationFrame(animateLoop);

  return {
    render,
    setAngles,
    triggerContrastBolus,
    getState: () => ({ ...state }),
    dispose() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      device?.dispose();
    }
  };
}
