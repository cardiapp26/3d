// Coronary Angiography Studio & C-Arm Projection Simulator Component
// Reuses the Cardia atlas and fluoroscopy engine with shared C-arm controls.

import {
  CORONARY_SYSTEMS,
  STANDARD_ANGIO_VIEWS,
  CORONARY_VESSEL_TREES,
  CLINICAL_LESIONS
} from './angio-data.js';

import {
  renderFluoroscopyCanvas,
  hitTestVessel,
  computeVesselForeshortening
} from './fluoroscopy-sim.js';

import { createAngioAtlas } from './angio-atlas.js';
import { createAngioDevice } from './angio-device.js';

/**
 * Parses URL hash parameters (#a=-35&b=-45&sys=left)
 */
function parseHashParams() {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#\/?/, '');
  const params = new URLSearchParams(hash);
  let alpha = 45; // Default Spider view LAO 45
  let beta = -35; // Default Spider view CAU 35
  let system = 'left';

  if (params.has('a')) {
    const parsedA = Number(params.get('a'));
    if (!Number.isNaN(parsedA)) alpha = Math.max(-90, Math.min(90, parsedA));
  }
  if (params.has('b')) {
    const parsedB = Number(params.get('b'));
    if (!Number.isNaN(parsedB)) beta = Math.max(-45, Math.min(45, parsedB));
  }
  if (params.has('sys') && CORONARY_SYSTEMS.some(s => s.id === params.get('sys'))) {
    system = params.get('sys');
  }

  return { alpha, beta, system };
}

/**
 * Updates URL hash without page reload (#a=-35&b=-45&sys=left)
 */
function updateHashParams(alpha, beta, system) {
  if (typeof window === 'undefined') return;
  const a = Math.round(alpha);
  const b = Math.round(beta);
  const newHash = `#a=${a}&b=${b}&sys=${system}`;
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }
}

export function createAngioStudio({ mount, getLang = () => 'tr' }) {
  const initial = parseHashParams();

  const state = {
    alpha: initial.alpha,       // -90 (RAO) to +90 (LAO)
    beta: initial.beta,         // -45 (CAU) to +45 (CRA)
    system: initial.system,     // 'left' | 'right' | 'lima' | 'svg-om' | 'svg-pda'
    activeLesionId: 'none',
    selectedVesselId: null,
    hoveredVesselId: null,
    cinePlaying: true,
    contrastOpacity: 1.0,
    contrastInjecting: false,
    contrastTimer: null,
    showLabels: true,
    showSpine: true,
    showDiaphragm: true,
    showCatheter: true,
    showForeshortening: false,
    beatPhase: 0
  };

  const container = document.createElement('div');
  container.className = 'angio-studio';

  let clickRegions = [];
  let rafId = null;
  let lastTs = 0;
  let isDraggingPad = false;
  let atlas = null, device = null;
  const atlasElement = document.createElement('div');
  atlasElement.className = 'angio-atlas';
  atlasElement.dataset.angioAtlas = '';
  atlasElement.innerHTML = `
    <div class="angio-atlas-pair">
      <section><h3 data-atlas-title="anatomy"></h3><div data-atlas-slot="anatomy"></div></section>
      <section><h3 data-atlas-title="fluoro"></h3><div data-atlas-slot="fluoro"></div></section>
    </div>
    <div class="angio-atlas-tools">
      <label><span data-atlas-opacity-label></span><input data-atlas-opacity type="range" min="0.08" max="1" step="0.01" value="0.25"></label>
      ${['veins', 'valves', 'conduction', 'thorax'].map(key => `<label><input type="checkbox" data-atlas-layer="${key}"><span data-atlas-layer-label="${key}"></span></label>`).join('')}
    </div>
    <p data-atlas-note></p><p data-atlas-selection role="status"></p>`;
  const deviceElement = document.createElement('div');
  deviceElement.className = 'angio-device-viewport';
  deviceElement.dataset.angioDevice = '';
  atlasElement.querySelector('[data-atlas-opacity]').addEventListener('input', e => atlas?.setOpacity(Number(e.target.value)));
  atlasElement.querySelectorAll('[data-atlas-layer]').forEach(input => input.addEventListener('change', () => atlas?.setLayer(input.dataset.atlasLayer, input.checked)));

  function syncAtlas() {
    const isTr = getLang() === 'tr';
    atlasElement.querySelector('[data-atlas-title=anatomy]').textContent = isTr ? '3B Anatomi · Cardia atlası' : '3D Anatomy · Cardia atlas';
    atlasElement.querySelector('[data-atlas-title=fluoro]').textContent = isTr ? 'Floroskopi · Aynı projeksiyon' : 'Fluoroscopy · Same projection';
    atlasElement.querySelector('[data-atlas-opacity-label]').textContent = isTr ? 'Doku opaklığı' : 'Tissue opacity';
    const names = isTr ? { veins: 'Venler', valves: 'Kapaklar', conduction: 'İleti sistemi', thorax: 'Toraks' }
      : { veins: 'Veins', valves: 'Valves', conduction: 'Conduction', thorax: 'Thorax' };
    atlasElement.querySelectorAll('[data-atlas-layer-label]').forEach(label => { label.textContent = names[label.dataset.atlasLayerLabel]; });
    atlas?.setAngles(state.alpha, state.beta);
    atlas?.setSystem(state.system);
    atlas?.setPlaying(state.cinePlaying);
    device?.setAngles(state.alpha, state.beta);
  }

  function getActiveLesion() {
    return CLINICAL_LESIONS.find(l => l.id === state.activeLesionId) || CLINICAL_LESIONS[0];
  }

  function getActivePreset() {
    return STANDARD_ANGIO_VIEWS.find(v =>
      v.system === state.system &&
      Math.abs(v.alpha - state.alpha) <= 3 &&
      Math.abs(v.beta - state.beta) <= 3
    ) || null;
  }

  function setAngles(alpha, beta, updateUrl = true) {
    state.alpha = Math.max(-90, Math.min(90, alpha));
    state.beta = Math.max(-45, Math.min(45, beta));
    if (updateUrl) updateHashParams(state.alpha, state.beta, state.system);
    syncAngleControls();
    atlas?.setAngles(state.alpha, state.beta);
    device?.setAngles(state.alpha, state.beta);
    renderCanvases();
  }

  function setSystem(sysId) {
    if (!CORONARY_SYSTEMS.some(s => s.id === sysId)) return;
    state.system = sysId;
    state.activeLesionId = 'none';
    state.selectedVesselId = null;
    state.hoveredVesselId = null;

    // Pick first standard view for this system
    const firstView = STANDARD_ANGIO_VIEWS.find(v => v.system === sysId);
    if (firstView) {
      state.alpha = firstView.alpha;
      state.beta = firstView.beta;
    }
    updateHashParams(state.alpha, state.beta, state.system);
    renderFull();
  }

  function triggerContrastInjection() {
    state.contrastOpacity = 1.0;
    state.contrastInjecting = true;
    syncContrastControl();
    if (state.contrastTimer) clearInterval(state.contrastTimer);

    let progress = 0;
    state.contrastTimer = setInterval(() => {
      progress += 0.04;
      if (progress >= 1.0) {
        clearInterval(state.contrastTimer);
        state.contrastTimer = null;
        state.contrastInjecting = false;
        state.contrastOpacity = 1.0;
      } else {
        // Pulse wave: sharp contrast onset, followed by physiologic capillary washout
        if (progress < 0.25) state.contrastOpacity = 0.4 + (progress / 0.25) * 0.6;
        else state.contrastOpacity = Math.max(0.2, 1.0 - (progress - 0.25) * 0.85);
      }
      syncContrastControl();
      renderCanvases();
    }, 40);
  }

  function syncContrastControl() {
    const button = container.querySelector('[data-inject-contrast]');
    if (!button) return;
    button.classList.toggle('injecting', state.contrastInjecting);
    button.setAttribute('aria-busy', String(state.contrastInjecting));
    button.textContent = state.contrastInjecting
      ? (getLang() === 'tr' ? '💉 Kontrast veriliyor…' : '💉 Injecting…')
      : (getLang() === 'tr' ? '💉 Kontrast Ver (Puff)' : '💉 Inject Contrast');
  }

  function renderCanvases() {
    const fluoCanvas = container.querySelector('#angio-fluo-canvas');
    if (fluoCanvas && container.querySelector('[data-angio-schematic]')?.open) {
      clickRegions = renderFluoroscopyCanvas(fluoCanvas, {
        alpha: state.alpha,
        beta: state.beta,
        system: state.system,
        activeLesion: getActiveLesion(),
        beatPhase: state.beatPhase,
        cinePlaying: state.cinePlaying,
        contrastOpacity: state.contrastOpacity,
        showLabels: state.showLabels,
        showSpine: state.showSpine,
        showDiaphragm: state.showDiaphragm,
        showCatheter: state.showCatheter,
        showForeshortening: state.showForeshortening,
        hoveredVesselId: state.hoveredVesselId,
        selectedVesselId: state.selectedVesselId,
        isTr: getLang() === 'tr'
      });
    }

    atlas?.setContrast(state.contrastOpacity);

    if (container.querySelector('[data-angio-schematic]')?.open) updateTelemetryBadges();
  }

  function syncAngleControls() {
    const isTr = getLang() === 'tr';
    const laoRao = Math.abs(state.alpha) < 0.5 ? 'AP 0°' : `${state.alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(state.alpha))}°`;
    const craCau = Math.abs(state.beta) < 0.5 ? '0°' : `${state.beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(state.beta))}°`;

    const badge = container.querySelector('#angio-angle-badge');
    if (badge) badge.textContent = `${laoRao} · ${craCau}`;

    const alphaSlider = container.querySelector('#angio-alpha-slider');
    if (alphaSlider) alphaSlider.value = String(Math.round(state.alpha));

    const betaSlider = container.querySelector('#angio-beta-slider');
    if (betaSlider) betaSlider.value = String(Math.round(state.beta));

    const alphaVal = container.querySelector('#angio-alpha-val');
    if (alphaVal) alphaVal.textContent = laoRao;

    const betaVal = container.querySelector('#angio-beta-val');
    if (betaVal) betaVal.textContent = craCau;

    // Joystick puck position: Pad dimensions are 160x160 (-80 to +80)
    // alpha maps -90..+90 to -70..+70 px
    // beta maps -45..+45 to +60..-60 px (Cranial is top, Caudal is bottom)
    const puck = container.querySelector('#angio-joy-puck');
    if (puck) {
      const px = (state.alpha / 90) * 65;
      const py = -(state.beta / 45) * 65;
      puck.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    }

    // Active preset buttons
    const activePreset = getActivePreset();
    container.querySelectorAll('[data-angio-view]').forEach(btn => {
      const on = btn.dataset.angioView === activePreset?.id;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    const presetName = container.querySelector('.angio-preset-name');
    if (presetName) presetName.textContent = activePreset
      ? `${activePreset.name} (${activePreset.optimalFor.join(', ')})`
      : (isTr ? 'Özel Projeksiyon' : 'Custom Angle');
    syncVesselDetails();
  }

  function syncVesselDetails() {
    const detail = container.querySelector('#angio-vessel-detail-card');
    if (!detail) return;
    const isTr = getLang() === 'tr';
    const vessel = CORONARY_VESSEL_TREES[state.system]?.find(v => v.id === state.selectedVesselId);
    const preset = getActivePreset();
    detail.querySelector('h4').textContent = vessel
      ? (isTr ? vessel.nameTr : vessel.nameEn)
      : (preset?.name || (isTr ? 'Serbest Açılı İzdüşüm' : 'Free Angulation'));
    detail.querySelector('p').textContent = vessel
      ? `${vessel.id} · ${vessel.caliberMm} mm · AHA ${vessel.ahaSegment ?? '—'}`
      : (preset ? (isTr ? preset.purposeTr : preset.purposeEn)
        : (isTr ? 'Açı kumandalarını veya joystick alanını kullanarak projeksiyonu ayarlayın. Damar seçmek için görüntüye dokunun.' : 'Adjust the projection with the sliders or joystick. Select a vessel in the image.'));
  }

  function updateTelemetryBadges() {
    const isTr = getLang() === 'tr';
    const metrics = computeVesselForeshortening(state.system, state.alpha, state.beta);
    const selId = state.selectedVesselId || (CORONARY_VESSEL_TREES[state.system]?.[0]?.id);
    const activeMetric = selId ? metrics[selId] : null;

    const targetNameNode = container.querySelector('#angio-tele-target');
    const elongNode = container.querySelector('#angio-tele-elong');
    const overlapNode = container.querySelector('#angio-tele-overlap');

    if (targetNameNode && activeMetric) {
      targetNameNode.textContent = `${activeMetric.id} (${isTr ? activeMetric.nameTr : activeMetric.nameEn})`;
    }

    if (elongNode && activeMetric) {
      const pct = Math.round(activeMetric.elongation * 100);
      elongNode.textContent = `%${pct} (${activeMetric.rating.toUpperCase()})`;
      elongNode.className = `angio-tele-val ${activeMetric.rating}`;
    }

    if (overlapNode) {
      const preset = getActivePreset();
      if (preset && preset.optimalFor.includes(selId)) {
        overlapNode.textContent = isTr ? '✓ Optimal Açılmış' : '✓ Optimal Profile';
        overlapNode.className = 'angio-tele-val ok';
      } else if (activeMetric && activeMetric.rating === 'severe') {
        overlapNode.textContent = isTr ? '⚠️ Belirgin Kısalma' : '⚠️ Foreshortened';
        overlapNode.className = 'angio-tele-val danger';
      } else {
        overlapNode.textContent = isTr ? 'Standart İzdüşüm' : 'Standard Projection';
        overlapNode.className = 'angio-tele-val';
      }
    }
  }

  function animLoop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;

    if (state.cinePlaying) {
      // 72 bpm cardiac cycle = ~0.83 sec period
      state.beatPhase = (state.beatPhase + dt * 1.2) % 1.0;
      renderCanvases();
    }

    rafId = requestAnimationFrame(animLoop);
  }

  function renderFull() {
    const schematicOpen = container.querySelector('[data-angio-schematic]')?.open || false;
    const isTr = getLang() === 'tr';
    const preset = getActivePreset();
    const lesion = getActiveLesion();
    const systemObj = CORONARY_SYSTEMS.find(s => s.id === state.system) || CORONARY_SYSTEMS[0];
    const systemVessels = CORONARY_VESSEL_TREES[state.system] || [];
    const systemViews = STANDARD_ANGIO_VIEWS.filter(v => v.system === state.system);

    container.innerHTML = `
      <!-- TOP NAVIGATION BAR -->
      <header class="angio-topbar">
        <div class="angio-brand-area">
          <div class="angio-brand-title">
            <span class="angio-pulse-dot"></span>
            <strong>CARDIA</strong> · ${isTr ? 'KORONER ANJİYOGRAFİ & C-ARM STÜDYOSU' : 'CORONARY ANGIOGRAPHY & C-ARM STUDIO'}
          </div>
          <span class="angio-badge-view" id="angio-angle-badge">AP 0° · 0°</span>
        </div>

        <div class="angio-top-tools">
          <button type="button" class="angio-tool-btn" id="angio-btn-share" title="${isTr ? 'Bağlantıyı Kopyala' : 'Copy Share URL'}">
            🔗 ${isTr ? 'Açıyı Paylaş (#a, #b)' : 'Share View URL'}
          </button>
        </div>
      </header>

      <!-- SYSTEM SELECTION TABS -->
      <nav class="angio-sys-tabs" role="tablist" aria-label="${isTr ? 'Arteriyel Sistem Seçimi' : 'Select Arterial System'}">
        ${CORONARY_SYSTEMS.map(sys => `
          <button type="button" role="tab" aria-selected="${sys.id === state.system}" class="angio-sys-btn ${sys.id === state.system ? 'active' : ''}" data-angio-sys="${sys.id}">
            <span class="angio-sys-icon">${sys.icon}</span>
            <span>${isTr ? sys.nameTr : sys.nameEn}</span>
          </button>
        `).join('')}
      </nav>

      <!-- MAIN WORKSPACE SPLIT GRID -->
      <div class="angio-stage-grid">
        <!-- LEFT COLUMN: Simulated Fluoroscopy C-Arm Angiogram -->
        <section class="angio-card angio-fluo-panel">
          <div class="angio-card-head">
            <div class="angio-head-left">
              <span class="angio-live-tag">☢ ${isTr ? 'CANLI FLOROSKOPİ · 3B ATLAS' : 'LIVE FLUOROSCOPIC ANGIOGRAM · 3D ATLAS'}</span>
              <span class="angio-preset-name">${preset ? `${preset.name} (${isTr ? preset.optimalFor.join(', ') : preset.optimalFor.join(', ')})` : (isTr ? 'Özel Projeksiyon' : 'Custom Angle')}</span>
            </div>
            <div class="angio-head-controls">
              <button type="button" aria-pressed="${state.cinePlaying}" class="angio-tool-btn ${state.cinePlaying ? 'active' : ''}" data-toggle-cine="true">
                ${state.cinePlaying ? (isTr ? '⏸ Durdur' : '⏸ Freeze') : (isTr ? '▶ Cine Akışı' : '▶ Play Cine')}
              </button>
              <button type="button" class="angio-inject-btn ${state.contrastInjecting ? 'injecting' : ''}" data-inject-contrast="true">
                💉 ${isTr ? 'Kontrast Ver (Puff)' : 'Inject Contrast'}
              </button>
            </div>
          </div>

          <div data-atlas-mount></div>
          <details data-angio-schematic ${schematicOpen ? 'open' : ''}>
            <summary>${isTr ? 'Şematik koroner ve lezyon alıştırması' : 'Schematic coronary and lesion exercise'}</summary>
          <!-- Main Interactive Fluoroscopy Canvas -->
          <div class="angio-canvas-wrap">
            <canvas id="angio-fluo-canvas" width="560" height="520" aria-label="${isTr ? 'Etkileşimli koroner damar projeksiyonu' : 'Interactive coronary vessel projection'}"></canvas>
          </div>

          <!-- Canvas Display Toggles Strip -->
          <div class="angio-toggle-strip">
            <label class="angio-toggle-chip">
              <input type="checkbox" id="toggle-labels" ${state.showLabels ? 'checked' : ''} />
              <span>🏷️ ${isTr ? 'Damar Etiketleri' : 'Vessel Labels'}</span>
            </label>
            <label class="angio-toggle-chip">
              <input type="checkbox" id="toggle-spine" ${state.showSpine ? 'checked' : ''} />
              <span>🦴 ${isTr ? 'Omurga Gölgesi' : 'Spine Shadow'}</span>
            </label>
            <label class="angio-toggle-chip">
              <input type="checkbox" id="toggle-diaphragm" ${state.showDiaphragm ? 'checked' : ''} />
              <span>🫁 ${isTr ? 'Diafragma Kubbesi' : 'Diaphragm'}</span>
            </label>
            <label class="angio-toggle-chip">
              <input type="checkbox" id="toggle-catheter" ${state.showCatheter ? 'checked' : ''} />
              <span>🩺 ${isTr ? 'Kateter (6F)' : 'Catheter (6F)'}</span>
            </label>
            <label class="angio-toggle-chip">
              <input type="checkbox" id="toggle-foreshorten" ${state.showForeshortening ? 'checked' : ''} />
              <span>📏 ${isTr ? 'Kısalma Isı Haritası' : 'Foreshortening'}</span>
            </label>
          </div>

          <!-- Real-Time Telemetry Readout Strip -->
          <div class="angio-tele-strip">
            <div class="angio-tele-cell">
              <span class="angio-tele-label">${isTr ? 'HEDEF DAMAR / SEGMENT' : 'TARGET VESSEL'}</span>
              <span class="angio-tele-val" id="angio-tele-target">—</span>
            </div>
            <div class="angio-tele-cell">
              <span class="angio-tele-label">${isTr ? 'UZAMA / ELONGASYON İNDEKSİ' : 'ELONGATION INDEX'}</span>
              <span class="angio-tele-val" id="angio-tele-elong">—</span>
            </div>
            <div class="angio-tele-cell">
              <span class="angio-tele-label">${isTr ? 'SÜPERPOZİSYON / ÇAKIŞMA' : 'OVERLAP STATUS'}</span>
              <span class="angio-tele-val" id="angio-tele-overlap">—</span>
            </div>
          </div>

          <!-- Vessel Click & Selection Anatomy Details Card -->
          <div class="angio-vessel-detail-card" id="angio-vessel-detail-card">
            <h4>${preset ? preset.name : (isTr ? 'Serbest Açılı İzdüşüm' : 'Free Angulation')}</h4>
            <p>${preset ? (isTr ? preset.purposeTr : preset.purposeEn) : (isTr ? 'Açı kumandalarını veya joystick trackpad’i kullanarak C-arm gantry rotasyonunu ve kraniyal-kaudal eğimini serbestçe ayarlayabilirsiniz.' : 'Freely adjust the C-arm gantry rotation and cranial-caudal angulation.')}</p>
          </div>
          </details>
        </section>

        <!-- RIGHT COLUMN: C-Arm Physical Gantry + Joystick Trackpad + Standard Presets + Lesions -->
        <section class="angio-card angio-controls-panel">
          <!-- 3D C-Arm Physical Cath Lab Room Simulator -->
          <div class="angio-carm-box">
            <div class="angio-carm-head">
              <span class="angio-carm-title">📐 ${isTr ? '3B C-Arm Gantry & Anjiyografi Laboratuvarı' : '3D C-Arm Gantry & Cath Lab Room'}</span>
              <span class="angio-carm-sub">${isTr ? 'X-Işını Tüpü (Altta) ⟷ Detektör (Üstte)' : 'X-Ray Tube (Under) ⟷ FPD Detector (Over)'}</span>
            </div>
            <div data-device-mount></div>
            <div class="angio-device-legend"><span>🔵 ${isTr ? 'Detektör' : 'Detector'}</span><span>🟠 ${isTr ? 'X-ışını tüpü' : 'X-ray tube'}</span><label><input type="checkbox" data-device-beam checked> ${isTr ? 'Işın geometrisi' : 'Beam geometry'}</label></div>
            <p class="angio-device-note">${isTr ? 'Şematik cihaz modeli. Cihazı çevirmek için sürükleyin; projeksiyonu aşağıdaki kumandalar değiştirir.' : 'Schematic device model. Drag to inspect the device; controls below drive the projection.'}</p>
          </div>

          <!-- 2D ANGLE JOYSTICK TRACKPAD & SLIDERS -->
          <div class="angio-pad-box">
            <div class="angio-pad-header">
              <span class="angio-pad-title">🕹️ ${isTr ? 'C-Arm Açı Kumandası (LAO/RAO & CRA/CAU)' : 'C-Arm Angle Pad'}</span>
              <button type="button" class="angio-reset-btn" id="angio-btn-center">AP 0° / 0°</button>
            </div>

            <div class="angio-pad-flex">
              <!-- Interactive 2D Coordinate Trackpad -->
              <div class="angio-joystick-wrap">
                <div class="angio-joy-label joy-top">CRANIAL (+45°)</div>
                <div class="angio-joy-label joy-bottom">CAUDAL (-45°)</div>
                <div class="angio-joy-label joy-left">RAO (90°)</div>
                <div class="angio-joy-label joy-right">LAO (90°)</div>
                <div class="angio-joy-pad" id="angio-joy-pad" title="${isTr ? 'Açıları ayarlamak için imleci sürükleyin' : 'Drag puck to drive C-arm'}">
                  <div class="angio-joy-axis joy-axis-h"></div>
                  <div class="angio-joy-axis joy-axis-v"></div>
                  <div class="angio-joy-ring joy-ring-30"></div>
                  <div class="angio-joy-ring joy-ring-45"></div>
                  <div class="angio-joy-puck" id="angio-joy-puck"></div>
                </div>
              </div>

              <!-- Sliders & Nudge Cluster -->
              <div class="angio-nudge-col">
                <div class="angio-slider-item">
                  <div class="angio-slider-label">
                    <span>${isTr ? 'Rotasyon (RAO / LAO):' : 'Rotation (RAO / LAO):'}</span>
                    <strong id="angio-alpha-val">0°</strong>
                  </div>
                  <input type="range" id="angio-alpha-slider" min="-90" max="90" value="${state.alpha}" />
                </div>

                <div class="angio-slider-item">
                  <div class="angio-slider-label">
                    <span>${isTr ? 'Angülasyon (CAU / CRA):' : 'Angulation (CAU / CRA):'}</span>
                    <strong id="angio-beta-val">0°</strong>
                  </div>
                  <input type="range" id="angio-beta-slider" min="-45" max="45" value="${state.beta}" />
                </div>

                <!-- 4-Way Nudge Cluster -->
                <div class="angio-nudge-cluster">
                  <button type="button" class="angio-nudge-btn nudge-up" data-nudge="cra" title="Cranial +5°">▲ CRA</button>
                  <div class="angio-nudge-mid">
                    <button type="button" class="angio-nudge-btn" data-nudge="rao" title="RAO +5°">◀ RAO</button>
                    <button type="button" class="angio-nudge-btn" data-nudge="ap" title="Sıfırla">AP</button>
                    <button type="button" class="angio-nudge-btn" data-nudge="lao" title="LAO +5°">LAO ▶</button>
                  </div>
                  <button type="button" class="angio-nudge-btn nudge-down" data-nudge="cau" title="Caudal -5°">▼ CAU</button>
                </div>
              </div>
            </div>
          </div>

          <!-- STANDARD ANGIOGRAPHIC PROJECTIONS GALLERY -->
          <div class="angio-preset-section">
            <div class="angio-preset-head">
              <span>📚 ${isTr ? 'Standart Kateterizasyon Açısı Önayarları' : 'Standard Angiographic Views'} (${systemViews.length})</span>
            </div>
            <div class="angio-preset-grid">
              ${systemViews.map(v => `
                <button type="button" class="angio-preset-btn ${preset?.id === v.id ? 'active' : ''}" data-angio-view="${v.id}">
                  <div class="angio-preset-top">
                    <strong class="angio-preset-title">${v.short}</strong>
                    <span class="angio-preset-angles">${v.alpha > 0 ? 'LAO ' + v.alpha : v.alpha < 0 ? 'RAO ' + Math.abs(v.alpha) : 'AP'} / ${v.beta > 0 ? 'CRA ' + v.beta : v.beta < 0 ? 'CAU ' + Math.abs(v.beta) : '0°'}</span>
                  </div>
                  <div class="angio-preset-target">${isTr ? v.targetTr : v.targetEn}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- CLINICAL CORONARY LESIONS & STENOSIS SIMULATOR -->
          <div class="angio-lesion-section">
            <div class="angio-preset-head">
              <span>🩺 ${isTr ? 'Klinik Lezyon & Bifurkasyon Darlığı Simülatörü' : 'Clinical Lesion & Bifurcation Simulator'}</span>
            </div>
            <div class="angio-lesion-picker">
              <label for="angio-lesion-select">${isTr ? 'Simüle Edilecek Koroner Darlık:' : 'Select Coronary Lesion:'}</label>
              <select id="angio-lesion-select" class="angio-select">
                ${CLINICAL_LESIONS.filter(l => l.id === 'none' || l.system === state.system).map(l => `
                  <option value="${l.id}" ${l.id === state.activeLesionId ? 'selected' : ''}>
                    ${isTr ? l.nameTr : l.nameEn}
                  </option>
                `).join('')}
              </select>
            </div>

            ${lesion.id !== 'none' ? `
              <div class="angio-lesion-card">
                <div class="angio-lesion-head">
                  <strong>${isTr ? lesion.nameTr : lesion.nameEn}</strong>
                  <span class="angio-lesion-pct">-%${lesion.pct}</span>
                </div>
                <p class="angio-lesion-desc">${isTr ? lesion.descTr : lesion.descEn}</p>
                ${lesion.bestViewId ? `
                  <div class="angio-lesion-rec-row">
                    <span>💡 ${isTr ? 'Önerilen Altın Standart Açı:' : 'Recommended Optimal View:'}</span>
                    <button type="button" class="angio-jump-view-btn" data-jump-view="${lesion.bestViewId}">
                      ${STANDARD_ANGIO_VIEWS.find(v => v.id === lesion.bestViewId)?.name || lesion.bestViewId}
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </section>
      </div>
    `;

    container.querySelector('[data-atlas-mount]').append(atlasElement);
    container.querySelector('[data-device-mount]').append(deviceElement);
    if (!atlas) {
      try { atlas = createAngioAtlas({ mount: atlasElement, getLang, onAngles: setAngles }); }
      catch (error) { console.warn('Angio atlas unavailable', error); }
    }
    if (!device && !deviceElement.dataset.failed) {
      try { device = createAngioDevice(deviceElement); }
      catch (error) { deviceElement.dataset.failed = 'true'; deviceElement.textContent = isTr ? '3B cihaz görüntüsü başlatılamadı.' : '3D device view unavailable.'; console.warn('Angio device unavailable', error); }
    }
    syncAtlas();
    bindEvents();
    syncAngleControls();
    syncContrastControl();
    renderCanvases();
  }

  function bindEvents() {
    container.querySelector('[data-angio-schematic]').addEventListener('toggle', renderCanvases);
    const beam = container.querySelector('[data-device-beam]');
    if (beam) {
      beam.checked = device?.getState().beam ?? true;
      beam.addEventListener('change', () => device?.setBeam(beam.checked));
    }
    // System tabs
    container.querySelectorAll('[data-angio-sys]').forEach(btn => {
      btn.addEventListener('click', () => {
        setSystem(btn.dataset.angioSys);
      });
    });

    // Preset buttons
    container.querySelectorAll('[data-angio-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.angioView;
        const v = STANDARD_ANGIO_VIEWS.find(x => x.id === viewId);
        if (v) {
          if (v.system !== state.system) state.system = v.system;
          setAngles(v.alpha, v.beta);
        }
      });
    });

    // Jump view button in lesion card
    container.querySelector('[data-jump-view]')?.addEventListener('click', e => {
      const vid = e.target.closest('[data-jump-view]').dataset.jumpView;
      const v = STANDARD_ANGIO_VIEWS.find(x => x.id === vid);
      if (v) {
        if (v.system !== state.system) state.system = v.system;
        setAngles(v.alpha, v.beta);
      }
    });

    // Sliders
    const aSlider = container.querySelector('#angio-alpha-slider');
    aSlider?.addEventListener('input', e => {
      setAngles(Number(e.target.value), state.beta);
    });

    const bSlider = container.querySelector('#angio-beta-slider');
    bSlider?.addEventListener('input', e => {
      setAngles(state.alpha, Number(e.target.value));
    });

    // Nudge cluster
    container.querySelectorAll('[data-nudge]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.nudge;
        if (act === 'cra') setAngles(state.alpha, state.beta + 5);
        else if (act === 'cau') setAngles(state.alpha, state.beta - 5);
        else if (act === 'lao') setAngles(state.alpha + 5, state.beta);
        else if (act === 'rao') setAngles(state.alpha - 5, state.beta);
        else if (act === 'ap') setAngles(0, 0);
      });
    });

    container.querySelector('#angio-btn-center')?.addEventListener('click', () => {
      setAngles(0, 0);
    });

    // Joystick 2D Trackpad dragging
    const pad = container.querySelector('#angio-joy-pad');
    if (pad) {
      const updateFromPointer = e => {
        const rect = pad.getBoundingClientRect();
        const px = e.clientX - rect.left - rect.width / 2;
        const py = e.clientY - rect.top - rect.height / 2;

        const maxRad = 65;
        const clampedX = Math.max(-maxRad, Math.min(maxRad, px));
        const clampedY = Math.max(-maxRad, Math.min(maxRad, py));

        const targetAlpha = Math.round((clampedX / maxRad) * 90);
        const targetBeta = Math.round(-(clampedY / maxRad) * 45); // Y inverted (Cranial is up)

        setAngles(targetAlpha, targetBeta);
      };

      pad.addEventListener('pointerdown', e => {
        isDraggingPad = true;
        pad.setPointerCapture?.(e.pointerId);
        updateFromPointer(e);
      });

      pad.addEventListener('pointermove', e => {
        if (isDraggingPad) updateFromPointer(e);
      });

      const stopDrag = () => { isDraggingPad = false; };
      pad.addEventListener('pointerup', stopDrag);
      pad.addEventListener('pointercancel', stopDrag);
    }

    // Fluoroscopy canvas interactive hover and clicks
    const fluoCanvas = container.querySelector('#angio-fluo-canvas');
    if (fluoCanvas) {
      const vesselAtPointer = e => {
        const rect = fluoCanvas.getBoundingClientRect();
        const scaleX = Number(fluoCanvas.dataset.logicalW) / rect.width;
        const scaleY = Number(fluoCanvas.dataset.logicalH) / rect.height;
        return hitTestVessel(clickRegions, (e.clientX - rect.left) * scaleX,
          (e.clientY - rect.top) * scaleY, 14 * Math.max(scaleX, scaleY));
      };
      fluoCanvas.addEventListener('pointermove', e => {
        const hit = vesselAtPointer(e);
        fluoCanvas.style.cursor = hit ? 'pointer' : 'crosshair';
        if (hit !== state.hoveredVesselId) {
          state.hoveredVesselId = hit;
          renderCanvases();
        }
      });

      fluoCanvas.addEventListener('pointerleave', () => {
        if (state.hoveredVesselId) {
          state.hoveredVesselId = null;
          renderCanvases();
        }
      });

      fluoCanvas.addEventListener('click', e => {
        const hit = vesselAtPointer(e);
        state.selectedVesselId = hit;
        syncVesselDetails();
        renderCanvases();
      });
    }

    // Cine Play/Pause
    container.querySelector('[data-toggle-cine]')?.addEventListener('click', () => {
      state.cinePlaying = !state.cinePlaying;
      renderFull();
    });

    // Contrast Injection Puff
    container.querySelector('[data-inject-contrast]')?.addEventListener('click', () => {
      triggerContrastInjection();
    });

    // Toggles
    container.querySelector('#toggle-labels')?.addEventListener('change', e => {
      state.showLabels = e.target.checked;
      renderCanvases();
    });

    container.querySelector('#toggle-spine')?.addEventListener('change', e => {
      state.showSpine = e.target.checked;
      renderCanvases();
    });

    container.querySelector('#toggle-diaphragm')?.addEventListener('change', e => {
      state.showDiaphragm = e.target.checked;
      renderCanvases();
    });

    container.querySelector('#toggle-catheter')?.addEventListener('change', e => {
      state.showCatheter = e.target.checked;
      renderCanvases();
    });

    container.querySelector('#toggle-foreshorten')?.addEventListener('change', e => {
      state.showForeshortening = e.target.checked;
      renderCanvases();
    });

    // Lesion selector
    container.querySelector('#angio-lesion-select')?.addEventListener('change', e => {
      state.activeLesionId = e.target.value;
      renderFull();
      container.querySelector('[data-angio-schematic]').open = true;
    });

    // Share URL button
    container.querySelector('#angio-btn-share')?.addEventListener('click', () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          const btn = container.querySelector('#angio-btn-share');
          if (btn) {
            const old = btn.textContent;
            btn.textContent = getLang() === 'tr' ? '✓ Kopyalandı!' : '✓ Link Copied!';
            setTimeout(() => { btn.textContent = old; }, 1800);
          }
        });
      }
    });
  }

  // Initial full render
  mount.appendChild(container);
  renderFull();
  rafId = requestAnimationFrame(animLoop);

  return {
    render: renderFull,
    setAngles,
    setSystem,
    getAtlasState: () => ({ ...atlas?.getState(), device: device?.getState() }),
    getSchematicRegions: () => clickRegions.map(({ id, points, midPoint }) => ({ id, points, midPoint })),
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (state.contrastTimer) clearInterval(state.contrastTimer);
      atlas?.dispose();
      device?.dispose();
      container.remove();
    }
  };
}
