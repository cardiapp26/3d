import {
  SHELL_TEXT,
  WORKSPACE_MODES,
  WINDOW_PRESETS,
  ANATOMICAL_LEVELS,
  CLINICAL_CT_CASES,
  CAD_RADS_TABLE,
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  REFERENCES
} from './cardiac-ct-data.js';
import {
  findCtCase,
  findWindowPreset,
  computeCprAndCtFfrProfile,
  computeTaviCoplanarCurve,
  evaluateCtCalculator
} from './cardiac-ct-sim.js';
import { createCtVolumeViewer } from './ct-volume-viewer.js';
import {
  levelForZ,
  pickAxialRegion,
  AXIAL_CANVAS_SIZE,
  renderSagittalScoutSvg,
  renderAxialCtSliceCanvas,
  renderCprAndCtFfrCanvas,
  renderTaviPlanningCanvas,
  renderCtArtifactPreviewCanvas
} from './cardiac-ct-render.js';
import {
  CT_FOV_MODES,
  computeCtSegmentationReport,
  renderCtTriPanelVrtCanvas,
  renderCtTriPanelMipCanvas,
  renderCtTriPanelMprCanvas
} from './cardiac-ct-segmentation.js';

function t(entry, lang) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry[lang] || entry.en || entry.tr || '';
}

function formatHu(hu) {
  return `${hu > 0 ? '+' : ''}${hu} HU`;
}

/** Builds a selector for the focused control so focus survives a full re-render. */
function focusSelectorFor(el, root) {
  if (!el || !root.contains(el)) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const attr = [...el.attributes].find((a) => a.name.startsWith('data-ct-'));
  return attr ? `[${attr.name}="${CSS.escape(attr.value)}"]` : null;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createCardiacCtPanel({ mount, getLang }) {
  if (!mount) throw new Error('Cardiac CT panel requires a mount element');

  const firstCase = CLINICAL_CT_CASES[0];
  const initialCalcState = {};
  for (const calc of CALCULATOR_CARDS) {
    initialCalcState[calc.id] = {};
    for (const inp of calc.inputs) {
      initialCalcState[calc.id][inp.key] = inp.defaultVal;
    }
  }

  const state = {
    mode: 'realct',
    caseId: firstCase.id,
    fovMode: 'full-cardiothoracic',
    vrtAlphaDeg: 0,
    vrtBetaDeg: 0,
    segColorMode: false,
    mprSegmentationOverlay: true,
    chambersSubtracted: false,
    selectedSegKey: null,
    hiddenSegments: [],
    zMm: firstCase.defaultZMm ?? 48,
    windowPresetId: 'cta-angio',
    rrPhasePct: 75,
    delayedPhase60s: false,
    roiProbe: null,
    cprDistalMm: 36,
    taviProjectionKey: 'threeCuspView',
    artifactFixedMap: {},
    calcValues: initialCalcState
  };

  function lang() {
    return (typeof getLang === 'function' ? getLang() : 'tr') || 'tr';
  }

  function currentCase() {
    return findCtCase(state.caseId);
  }

  function roiBarHtml(l, resolved) {
    if (resolved) {
      return `
        <span class="ct-roi-tag">${l === 'tr' ? 'AKTİF ROI ÖLÇÜMÜ' : 'ACTIVE ROI PROBE'}</span>
        <strong>${escapeHtml(resolved.name)}</strong>
        <span class="ct-mono">${formatHu(resolved.hu)}</span>
      `;
    }
    return `
      <span class="ct-roi-tag">${l === 'tr' ? 'İPUCU · ROI HOUNSFIELD ÖLÇÜMÜ' : 'TIP · ROI HOUNSFIELD PROBE'}</span>
      <span>${l === 'tr'
        ? 'Aksiyel BT kesiti üzerinde herhangi bir yapıya (Aort Kökü, LAD, RCA, LAA, Pulmoner Arter, LV/RV, akciğer, yağ, kemik) tıklayarak Hounsfield Ünitesi (HU) dansitesini ölçün.'
        : 'Click any structure on the axial CT slice (Aortic Root, LAD, RCA, LAA, Pulmonary Artery, LV/RV, lung, fat, bone) to measure its Hounsfield Unit (HU) attenuation.'}</span>
    `;
  }

  function cprReadoutHtml(l, cprProfile) {
    const pts = cprProfile.points;
    const idx = Math.min(pts.length - 1, Math.max(0, Math.round(state.cprDistalMm)));
    const pt = pts[idx] || pts[pts.length - 1];
    return `x = ${Math.round(state.cprDistalMm)} mm · ${l === 'tr' ? 'Lümen' : 'Lumen'} ${pt.lumenDiamMm} mm · FFR<sub>CT</sub> ${pt.ffrCt.toFixed(2)}`;
  }

  function selectCase(caseId) {
    const next = findCtCase(caseId);
    state.caseId = next.id;
    state.zMm = next.defaultZMm ?? 48;
    state.windowPresetId = 'cta-angio';
    state.rrPhasePct = 75;
    state.delayedPhase60s = false;
    state.roiProbe = null;
    state.cprDistalMm = 36;
    state.selectedSegKey = null;
    state.hiddenSegments = [];
    render();
  }

  function renderHeroBanner(l, c) {
    const shell = SHELL_TEXT[l] || SHELL_TEXT.tr;
    const liveFfr = computeCprAndCtFfrProfile(c, state).ffrCtDistal;
    return `
      <section class="ct-hero" aria-label="${escapeHtml(shell.heading)}">
        <div class="ct-hero-main">
          <div class="ct-kicker">${l === 'tr' ? 'KARDİYAK GÖRÜNTÜLEME · 3B VRT / MIP / MPR · OTOMATİK SEGMENTASYON' : 'CARDIAC IMAGING · 3D VRT / MIP / MPR · AUTOMATED SEGMENTATION'}</div>
          <h1 class="ct-title">${escapeHtml(shell.heading)}</h1>
          <p class="ct-subtitle">${escapeHtml(shell.subtitle)}</p>
        </div>
        <div class="ct-hero-badges">
          <span class="ct-pill ct-pill--accent">${escapeHtml(c.tag)} · ${escapeHtml(c.vessel)}</span>
          <span class="ct-pill">${escapeHtml(c.cadRads)}</span>
          <span class="ct-pill">CAC: ${c.cacScore} AU (${escapeHtml(c.plaqueBurdenTier)})</span>
          <span class="ct-pill" data-ct-hero-ffr>FFR<sub>CT</sub>: ${liveFfr.toFixed(2)}</span>
        </div>
      </section>
    `;
  }

  function renderModeTabs(l) {
    return `
      <nav class="ct-mode-tabs" role="tablist" aria-label="${l === 'tr' ? 'Kardiyak BT Çalışma Modları' : 'Cardiac CT Workspace Modes'}">
        ${WORKSPACE_MODES.map((m) => {
          const active = state.mode === m.id;
          return `
            <button
              type="button"
              role="tab"
              aria-selected="${active ? 'true' : 'false'}"
              class="ct-mode-tab ${active ? 'is-active' : ''}"
              data-ct-mode="${escapeHtml(m.id)}"
            >
              <span class="ct-mode-tab-label">${escapeHtml(t(m.label, l))}</span>
              <span class="ct-mode-tab-short">${escapeHtml(t(m.badge, l))}</span>
            </button>
          `;
        }).join('')}
      </nav>
    `;
  }

  function renderCaseStrip(l, activeCase) {
    return `
      <section class="ct-case-strip" aria-label="${l === 'tr' ? 'Klinik Olgu Seçimi' : 'Clinical Case Selection'}">
        <div class="ct-case-strip-header">
          <span class="ct-section-tag">${l === 'tr' ? 'KLİNİK KARDİYAK BT OLGULARI (10 OLGU)' : 'CLINICAL CARDIAC CT CASES (10 CASES)'}</span>
          <span class="ct-case-strip-meta">${escapeHtml(t(activeCase.brief, l))}</span>
        </div>
        <div class="ct-case-pills" role="list">
          ${CLINICAL_CT_CASES.map((item) => {
            const isSelected = item.id === activeCase.id;
            return `
              <button
                type="button"
                class="ct-case-pill ${isSelected ? 'is-active' : ''}"
                data-ct-case="${escapeHtml(item.id)}"
                aria-pressed="${isSelected ? 'true' : 'false'}"
              >
                <span class="ct-case-pill-title">${escapeHtml(item.tag)} · ${escapeHtml(t(item.name, l))}</span>
                <span class="ct-case-pill-sub">${escapeHtml(item.cadRads)} · FFR<sub>CT</sub> ${item.ffrCtDistal.toFixed(2)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  function renderTriPanelAndSegmentationSection(l, c) {
    const segReport = computeCtSegmentationReport(c, state, l);
    const selectedRow = segReport.rows.find((r) => r.key === state.selectedSegKey) || null;

    return `
      <section class="ct-card ct-card--tri-output" data-ct-tri-panel>
        <div class="ct-card-header">
          <div>
            <span class="ct-card-kicker">${l === 'tr' ? '3-PANELLİ KLİNİK REKONSTRÜKSİYON ÇIKTISI (3B VRT · 3B MIP · KORONAL MPR + SEGMENTASYON)' : '3-PANEL CLINICAL RECONSTRUCTION OUTPUT (3D VRT · 3D MIP · CORONAL MPR + SEGMENTATION)'}</span>
            <h2 class="ct-card-title">${l === 'tr' ? 'Kemiksiz 3B Hacim Rekonstrüksiyonu (VRT), Maksimum Yoğunluk Projeksiyonu (MIP) ve Otomatik Anatomik Segmentasyon' : 'Bone-Subtracted 3D Volume Rendering (VRT), Maximum Intensity Projection (MIP) & Automated Anatomical Segmentation'}</h2>
          </div>
          <div class="ct-btn-group">
            ${CT_FOV_MODES.map((fov) => `
              <button
                type="button"
                class="ct-chip-btn ${state.fovMode === fov.id ? 'is-active' : ''}"
                data-ct-fov="${escapeHtml(fov.id)}"
              >${escapeHtml(t(fov.short, l))}</button>
            `).join('')}
          </div>
        </div>

        <div class="ct-tri-grid">
          <figure class="ct-tri-viewport">
            <canvas
              class="ct-canvas ct-canvas--tri"
              data-ct-tri-vrt
              aria-label="${l === 'tr' ? '3B VRT Kemiksiz Damar ve Kalp Rekonstrüksiyonu' : '3D VRT Bone-Subtracted Vascular and Cardiac Reconstruction'}"
            ></canvas>
            <figcaption class="ct-tri-caption">
              <strong>1 · 3D VRT</strong>
              <span>${state.segColorMode
                ? (l === 'tr' ? '14-Sınıf Renkli Segmentasyon Haritası' : '14-Class Color Segmentation Map')
                : (l === 'tr' ? 'Kemiksiz 3B Hacim Rekonstrüksiyonu (5mm/div)' : 'Bone-Subtracted Volume Rendering (5mm/div)')}</span>
            </figcaption>
          </figure>

          <figure class="ct-tri-viewport">
            <canvas
              class="ct-canvas ct-canvas--tri"
              data-ct-tri-mip
              aria-label="${l === 'tr' ? '3B MIP Maksimum Yoğunluk Projeksiyonu' : '3D MIP Maximum Intensity Projection'}"
            ></canvas>
            <figcaption class="ct-tri-caption">
              <strong>2 · 3D MIP</strong>
              <span>${l === 'tr' ? 'Maksimum Yoğunluk Projeksiyonu & Kalsiyum Parlaklığı' : 'Maximum Intensity Projection & Calcium Highlight'}</span>
            </figcaption>
          </figure>

          <figure class="ct-tri-viewport">
            <canvas
              class="ct-canvas ct-canvas--tri"
              data-ct-tri-mpr
              aria-label="${l === 'tr' ? 'Koronal BTA MPR Kesiti ve Otomatik Segmentasyon Maskesi' : 'Coronal CTA MPR Slice and Automated Segmentation Mask'}"
            ></canvas>
            <figcaption class="ct-tri-caption">
              <strong>3 · ${l === 'tr' ? 'Koronal MPR + Segmentasyon' : 'Coronal MPR + Segmentation'}</strong>
              <span>${l === 'tr' ? 'Toraks-Boyun Kesiti & Otomatik Doku Sınırları' : 'Thoraco-Cervical Slice & Automated Tissue Contours'}</span>
            </figcaption>
          </figure>
        </div>

        <div class="ct-tri-toolbar">
          <div class="ct-btn-group">
            <button
              type="button"
              class="ct-chip-btn ${state.segColorMode ? 'is-active' : ''}"
              data-ct-seg-color-toggle
              aria-pressed="${state.segColorMode ? 'true' : 'false'}"
            >${l === 'tr' ? '3B Renkli Segmentasyon Haritası' : '3D Color Segmentation Map'}</button>

            <button
              type="button"
              class="ct-chip-btn ${state.mprSegmentationOverlay ? 'is-active' : ''}"
              data-ct-mpr-seg-toggle
              aria-pressed="${state.mprSegmentationOverlay ? 'true' : 'false'}"
            >${l === 'tr' ? 'MPR Segmentasyon Konturları' : 'MPR Segmentation Contours'}</button>

            <button
              type="button"
              class="ct-chip-btn ${state.chambersSubtracted ? 'is-active' : ''}"
              data-ct-chambers-sub-toggle
              aria-pressed="${state.chambersSubtracted ? 'true' : 'false'}"
            >${l === 'tr' ? 'Sadece Damar Ağacı (Odacık Çıkarma)' : 'Vascular Tree Only (Subtract Chambers)'}</button>

            ${state.selectedSegKey ? `
              <button
                type="button"
                class="ct-chip-btn ct-chip-btn--accent"
                data-ct-seg-clear
              >${l === 'tr' ? 'Segment Seçimini Sıfırla' : 'Clear Segment Highlight'}</button>
            ` : ''}
          </div>

          <div class="ct-tri-angles">
            <label class="ct-angle-slider">
              <span>LAO / RAO: <strong class="ct-mono" data-ct-vrt-alpha-readout>${state.vrtAlphaDeg}°</strong></span>
              <input
                type="range"
                min="-55"
                max="55"
                step="5"
                value="${state.vrtAlphaDeg}"
                class="ct-range"
                data-ct-vrt-alpha
              />
            </label>
            <label class="ct-angle-slider">
              <span>CRA / CAU: <strong class="ct-mono" data-ct-vrt-beta-readout>${state.vrtBetaDeg}°</strong></span>
              <input
                type="range"
                min="-35"
                max="35"
                step="5"
                value="${state.vrtBetaDeg}"
                class="ct-range"
                data-ct-vrt-beta
              />
            </label>
          </div>
        </div>

        <div class="ct-segmentation-drawer" data-ct-segmentation>
          <div class="ct-seg-header">
            <div>
              <span class="ct-section-tag">${l === 'tr' ? 'OTOMATİK 14-YAPI ANATOMİK SEGMENTASYON & HACMİ ANALİZİ' : 'AUTOMATED 14-STRUCTURE ANATOMICAL SEGMENTATION & VOLUMETRY'}</span>
              <span class="ct-case-strip-meta">
                ${l === 'tr'
                  ? `Aktif Segment: ${segReport.visibleCount}/${segReport.totalCount} · Toplam Segmente Hacim: ${segReport.totalVolumeMl} mL`
                  : `Active Segments: ${segReport.visibleCount}/${segReport.totalCount} · Total Segmented Volume: ${segReport.totalVolumeMl} mL`}
              </span>
            </div>
            ${selectedRow ? `
              <div class="ct-seg-active-pill" data-ct-seg-active-readout>
                <span class="ct-seg-swatch" style="background:${escapeHtml(selectedRow.color)}"></span>
                <strong>${escapeHtml(selectedRow.name)}</strong>
                <span class="ct-mono">${selectedRow.hu} HU · ${selectedRow.volMl} mL · Ø ${selectedRow.caliberMm} mm</span>
              </div>
            ` : ''}
          </div>

          <div class="ct-seg-chips" role="list">
            ${segReport.rows.map((row) => {
              const isSelected = state.selectedSegKey === row.key;
              return `
                <div
                  class="ct-seg-chip ${isSelected ? 'is-selected' : ''} ${row.visible ? '' : 'is-hidden'}"
                  role="listitem"
                >
                  <input
                    type="checkbox"
                    class="ct-seg-check"
                    data-ct-seg-vis="${escapeHtml(row.key)}"
                    ${row.visible ? 'checked' : ''}
                    aria-label="${escapeHtml(row.name)}"
                  />
                  <button
                    type="button"
                    class="ct-seg-chip-btn"
                    data-ct-seg-select="${escapeHtml(row.key)}"
                    aria-pressed="${isSelected ? 'true' : 'false'}"
                  >
                    <span class="ct-seg-swatch" style="background:${escapeHtml(row.color)}"></span>
                    <span class="ct-seg-chip-text">
                      <strong>${escapeHtml(row.name)}</strong>
                      <small class="ct-mono">${row.hu} HU · ${row.volMl} mL · Ø ${row.caliberMm} mm</small>
                    </span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderWorkstationMode(l, c) {
    const nearLevel = levelForZ(state.zMm);
    const winPreset = findWindowPreset(state.windowPresetId);
    const cprProfile = computeCprAndCtFfrProfile(c, state);
    const isIschemic = cprProfile.ffrCtDistal <= 0.75;
    const isAnomaly = c.plaqueType === 'anomaly';
    const rrOptions = [35, 40, 70, 75, 80];

    return `
      ${renderTriPanelAndSegmentationSection(l, c)}

      <div class="ct-workstation-grid">
        <div class="ct-card ct-card--axial">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'AKSİYEL TORAKS / KARDİYAK BT KESİTİ (MPR)' : 'AXIAL THORACIC / CARDIAC CT SLICE (MPR)'}</span>
              <h2 class="ct-card-title" data-ct-level-title>${escapeHtml(t(nearLevel.label, l))}</h2>
            </div>
            <div class="ct-window-badge">
              <span>${escapeHtml(t(winPreset.label, l))}</span>
              <span class="ct-mono">W:${winPreset.width} / L:${winPreset.level} HU</span>
            </div>
          </div>

          <div class="ct-axial-stage">
            <div class="ct-canvas-wrap ct-canvas-wrap--axial">
              <canvas
                class="ct-canvas ct-canvas--axial"
                data-ct-axial-canvas
                aria-label="${l === 'tr' ? 'Aksiyel Kardiyak BT Kesiti ve ROI HU Ölçümü' : 'Axial Cardiac CT Slice and ROI HU Probe'}"
              ></canvas>
            </div>
            <div class="ct-scout-column">
              <div class="ct-scout-box">
                <div class="ct-scout-title">${l === 'tr' ? 'Sagital Toraks Kılavuz (Scout)' : 'Sagittal Thoracic Scout'}</div>
                <div class="ct-scout-svg-wrap" data-ct-scout-wrap>
                  ${renderSagittalScoutSvg(c, state, l)}
                </div>
              </div>
              <div class="ct-level-buttons">
                ${ANATOMICAL_LEVELS.map((lvl) => {
                  const isNear = nearLevel.id === lvl.id;
                  return `
                    <button
                      type="button"
                      class="ct-level-btn ${isNear ? 'is-active' : ''}"
                      data-ct-level-z="${lvl.zMm}"
                    >
                      <span>${escapeHtml(t(lvl.label, l).split(' (')[0])}</span>
                      <span class="ct-mono">z=${lvl.zMm}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="ct-controls-bar">
            <div class="ct-control-group ct-control-group--slider">
              <label class="ct-control-label" for="ct-z-slider">
                <span>${l === 'tr' ? 'Kraniokaudal Kesit (Z Ekseni · 10..115 mm)' : 'Craniocaudal Slice (Z-Axis · 10..115 mm)'}</span>
                <strong class="ct-mono" data-ct-z-readout>z = ${Math.round(state.zMm)} mm</strong>
              </label>
              <input
                id="ct-z-slider"
                type="range"
                min="10"
                max="115"
                step="1"
                value="${Math.round(state.zMm)}"
                class="ct-range"
                data-ct-z-slider
              />
            </div>

            <div class="ct-control-group">
              <span class="ct-control-label">${l === 'tr' ? 'Hounsfield Penceresi (W/L Presets)' : 'Hounsfield Window (W/L Presets)'}</span>
              <div class="ct-btn-group">
                ${WINDOW_PRESETS.map((wp) => `
                  <button
                    type="button"
                    class="ct-chip-btn ${state.windowPresetId === wp.id ? 'is-active' : ''}"
                    data-ct-window="${escapeHtml(wp.id)}"
                  >${escapeHtml(t(wp.label, l))}</button>
                `).join('')}
              </div>
            </div>

            <div class="ct-control-group">
              <span class="ct-control-label">${l === 'tr' ? 'EKG R-R Fazı & 60 sn Geç Faz' : 'ECG R-R Phase & 60s Delayed Phase'}</span>
              <div class="ct-btn-group">
                ${rrOptions.map((pct) => `
                  <button
                    type="button"
                    class="ct-chip-btn ${state.rrPhasePct === pct ? 'is-active' : ''}"
                    data-ct-rr="${pct}"
                  >${pct}% R-R</button>
                `).join('')}
                <button
                  type="button"
                  class="ct-chip-btn ct-chip-btn--delayed ${state.delayedPhase60s ? 'is-active' : ''}"
                  data-ct-delayed-toggle
                  aria-pressed="${state.delayedPhase60s ? 'true' : 'false'}"
                >${l === 'tr' ? '+60 sn Geç Faz' : '+60s Delayed'}</button>
              </div>
            </div>
          </div>

          <div class="ct-roi-readout" data-ct-roi-bar aria-live="polite">${roiBarHtml(l, null)}</div>
        </div>

        <div class="ct-card ct-card--cpr">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'EĞRİSEL PLANAR REFORMASYON (CPR) & NON-İNVAZİV CT-FFR' : 'CURVED PLANAR REFORMATION (CPR) & NON-INVASIVE CT-FFR'}</span>
              <h2 class="ct-card-title">${escapeHtml(c.vessel)} · ${escapeHtml(t(c.name, l))}</h2>
            </div>
            <div class="ct-ffr-pill ${isIschemic ? 'is-ischemic' : 'is-normal'}">
              <span>Distal FFR<sub>CT</sub>:</span>
              <strong class="ct-mono">${cprProfile.ffrCtDistal.toFixed(2)}</strong>
            </div>
          </div>

          <div class="ct-canvas-wrap ct-canvas-wrap--cpr">
            <canvas
              class="ct-canvas ct-canvas--cpr"
              data-ct-cpr-canvas
              aria-label="${l === 'tr' ? 'Eğrisel Planar Reformasyon ve CT-FFR Profili' : 'Curved Planar Reformation and CT-FFR Profile'}"
            ></canvas>
          </div>

          <div class="ct-control-group ct-control-group--slider">
            <label class="ct-control-label" for="ct-cpr-slider">
              <span>${l === 'tr' ? 'CPR İmleç Pozisyonu (Proksimal → Distal Damar Ekseni)' : 'CPR Cursor Position (Proximal → Distal Vessel Axis)'}</span>
              <strong class="ct-mono" data-ct-cpr-readout>${cprReadoutHtml(l, cprProfile)}</strong>
            </label>
            <input
              id="ct-cpr-slider"
              type="range"
              min="0"
              max="60"
              step="1"
              value="${Math.round(state.cprDistalMm)}"
              class="ct-range"
              data-ct-cpr-slider
            />
          </div>

          <div class="ct-metrics-strip">
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'CAD-RADS 2.0 Kodu' : 'CAD-RADS 2.0 Code'}</span>
              <strong class="ct-metric-value">${escapeHtml(c.cadRads)}</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${isAnomaly
                ? (l === 'tr' ? 'Ostial daralma, non-aterosklerotik (E)' : 'Ostial narrowing, non-atherosclerotic (E)')
                : (l === 'tr' ? 'Efektif Maks. Darlık' : 'Effective Max Stenosis')}</span>
              <strong class="ct-metric-value">${l === 'tr' ? `%${cprProfile.effectiveMaxStenosisPct}` : `${cprProfile.effectiveMaxStenosisPct}%`}${isAnomaly
                ? (l === 'tr' ? ' · yarık ostium (CAD-RADS dışı)' : ' · slit-like ostium (not graded by CAD-RADS)')
                : (cprProfile.bloomingBiasPct > 0 ? (l === 'tr' ? ' (+Parlama)' : ' (+Blooming)') : '')}</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Plak HU & Remodeling' : 'Plaque HU & Remodeling'}</span>
              <strong class="ct-metric-value">${c.plaqueHu} HU · RI ${c.remodelingIndex.toFixed(2)}</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Agatston CAC & Plak Yükü' : 'Agatston CAC & Burden'}</span>
              <strong class="ct-metric-value">${c.cacScore} AU (${escapeHtml(c.plaqueBurdenTier)})</strong>
            </div>
          </div>

          <div class="ct-clinical-summary">
            <div class="ct-summary-block">
              <h3>${l === 'tr' ? 'Kesit Düzeyi Anatomik Yapılar' : 'Slice Level Anatomical Structures'}</h3>
              <p>${escapeHtml(t(nearLevel.structures, l))}</p>
              <p class="ct-management-note">${escapeHtml(t(winPreset.note, l))}</p>
            </div>
            <div class="ct-summary-block">
              <h3>${l === 'tr' ? 'Olgu Klinik Yorumu & Öğreti' : 'Clinical Case Interpretation & Pearl'}</h3>
              <p>${escapeHtml(t(c.teaching, l))}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCoronaryMode(l, c) {
    const hrpFlags = c.hrpFeatures || [];
    const hrpBadges = [
      { id: 'lap-lt-30', tr: 'Düşük Atenüasyonlu Plak (<30 HU)', en: 'Low-Attenuation Plaque (<30 HU)', active: hrpFlags.includes('lap-lt-30') || c.plaqueHu < 30 },
      { id: 'positive-remodeling', tr: 'Pozitif Remodeling (RI ≥ 1.10)', en: 'Positive Remodeling (RI ≥ 1.10)', active: hrpFlags.includes('positive-remodeling') || c.remodelingIndex >= 1.1 },
      { id: 'napkin-ring', tr: 'Peçete Halkası İşareti (Napkin-Ring)', en: 'Napkin-Ring Sign (NRS)', active: hrpFlags.includes('napkin-ring') },
      { id: 'spotty-ca', tr: 'Noktasal Kalsifikasyon (Spotty Ca <3 mm)', en: 'Spotty Calcification (<3 mm)', active: hrpFlags.includes('spotty-ca') }
    ];

    return `
      <div class="ct-coronary-layout">
        <div class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'SEÇİLİ OLGU KORONER PLAK & SCCT YÜKSEK RİSKLİ PLAK (HRP) ANALİZİ' : 'SELECTED CASE CORONARY PLAQUE & SCCT HIGH-RISK PLAQUE (HRP) ANALYSIS'}</span>
              <h2 class="ct-card-title">${escapeHtml(c.tag)} · ${escapeHtml(t(c.name, l))}</h2>
            </div>
            <span class="ct-pill ct-pill--accent">${escapeHtml(c.cadRads)}</span>
          </div>

          <div class="ct-hrp-grid">
            ${hrpBadges.map((b) => `
              <div class="ct-hrp-item ${b.active ? 'is-positive' : 'is-negative'}">
                <div class="ct-hrp-status">${b.active ? (l === 'tr' ? 'POZİTİF (+)' : 'POSITIVE (+)') : (l === 'tr' ? 'NEGATİF (-)' : 'NEGATIVE (-)')}</div>
                <div class="ct-hrp-title">${escapeHtml(l === 'tr' ? b.tr : b.en)}</div>
              </div>
            `).join('')}
          </div>

          <div class="ct-clinical-summary">
            <div class="ct-summary-block">
              <h3>${l === 'tr' ? 'Klinik Başvuru ve BTA Özeti' : 'Clinical Presentation & CCTA Summary'}</h3>
              <p>${escapeHtml(t(c.brief, l))}</p>
            </div>
            <div class="ct-summary-block">
              <h3>${l === 'tr' ? 'Kılavuz Temelli Öğreti' : 'Guideline Teaching Point'}</h3>
              <p>${escapeHtml(t(c.teaching, l))}</p>
            </div>
          </div>
        </div>

        <div class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'SCCT / ACC / ACR / NASCI 2022 KONSENSÜS MATRİSİ' : 'SCCT / ACC / ACR / NASCI 2022 CONSENSUS MATRIX'}</span>
              <h2 class="ct-card-title">${l === 'tr' ? 'CAD-RADS 2.0 Standart Raporlama ve Klinik Yönetim Tablosu' : 'CAD-RADS 2.0 Standardized Reporting & Clinical Management Table'}</h2>
            </div>
          </div>

          <div class="ct-table-wrap">
            <table class="ct-table">
              <thead>
                <tr>
                  <th>${l === 'tr' ? 'CAD-RADS Kodu' : 'CAD-RADS Code'}</th>
                  <th>${l === 'tr' ? 'Maksimal Koroner Darlık' : 'Maximal Coronary Stenosis'}</th>
                  <th>${l === 'tr' ? 'Kategori Tanımı' : 'Category Interpretation'}</th>
                  <th>${l === 'tr' ? 'Önerilen İnceleme & Klinik Yönetim' : 'Recommended Workup & Management'}</th>
                </tr>
              </thead>
              <tbody>
                ${CAD_RADS_TABLE.map((row) => {
                  const isHighlighted = (c.cadRads || '').includes(`CAD-RADS ${row.code}`);
                  return `
                    <tr class="${isHighlighted ? 'is-highlighted' : ''}">
                      <td class="ct-mono"><strong>CAD-RADS ${escapeHtml(row.code)}</strong></td>
                      <td class="ct-mono">${escapeHtml(t(row.stenosis, l))}</td>
                      <td>${escapeHtml(t(row.label, l))}</td>
                      <td>${escapeHtml(t(row.workup, l))}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderStructuralMode(l, c) {
    const taviData = computeTaviCoplanarCurve(c);
    const activeView = state.taviProjectionKey === 'cuspOverlapView' ? taviData.cuspOverlapView : taviData.threeCuspView;

    return `
      <div class="ct-structural-layout">
        <div class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'YAPISAL KALP · TAVI AORTİK ANÜLÜS & KOPLANAR S-EĞRİSİ' : 'STRUCTURAL HEART · TAVI AORTIC ANNULUS & COPLANAR S-CURVE'}</span>
              <h2 class="ct-card-title">${l === 'tr' ? 'Sistolik (%35 R-R) Sanal Bazal Halka Planimetrisi & Floroskopik İmplantasyon Açısı' : 'Systolic (35% R-R) Virtual Basal Ring Planimetry & Fluoroscopic Deployment Angle'}</h2>
            </div>
            <button
              type="button"
              class="ct-chip-btn ct-chip-btn--accent"
              data-ct-load-tavi-case
            >${l === 'tr' ? 'CT-7 Pre-TAVI Olgusunu Yükle' : 'Load CT-7 Pre-TAVI Case'}</button>
          </div>

          <div class="ct-canvas-wrap ct-canvas-wrap--tavi">
            <canvas
              class="ct-canvas ct-canvas--tavi"
              data-ct-tavi-canvas
              aria-label="${l === 'tr' ? 'TAVI Aortik Anülüs Planimetrisi ve 3-Cusp Koplanar S-Eğrisi' : 'TAVI Aortic Annulus Planimetry and 3-Cusp Coplanar S-Curve'}"
            ></canvas>
          </div>

          <div class="ct-control-group">
            <span class="ct-control-label">${l === 'tr' ? 'Floroskopik İmplantasyon Projeksiyonu Seçimi' : 'Fluoroscopic Deployment Projection Selection'}</span>
            <div class="ct-btn-group">
              <button
                type="button"
                class="ct-chip-btn ${state.taviProjectionKey === 'threeCuspView' ? 'is-active' : ''}"
                data-ct-tavi-proj="threeCuspView"
              >${escapeHtml(t(taviData.threeCuspView.label, l))}</button>
              <button
                type="button"
                class="ct-chip-btn ${state.taviProjectionKey === 'cuspOverlapView' ? 'is-active' : ''}"
                data-ct-tavi-proj="cuspOverlapView"
              >${escapeHtml(t(taviData.cuspOverlapView.label, l))}</button>
            </div>
          </div>

          <div class="ct-metrics-strip">
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Anülüs Alanı & Çevresi' : 'Annulus Area & Perimeter'}</span>
              <strong class="ct-metric-value">${taviData.annulusAreaMm2} mm² · ${taviData.annulusPerimMm} mm</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Alan / Çevre Türevli Çap' : 'Area / Perim Derived Diam'}</span>
              <strong class="ct-metric-value">${taviData.dAreaMm} mm / ${taviData.dPerimMm} mm</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Dmin × Dmax & Eksantrisite' : 'Dmin × Dmax & Eccentricity'}</span>
              <strong class="ct-metric-value">${taviData.dMinMm} × ${taviData.dMaxMm} mm (${taviData.eccentricity})</strong>
            </div>
            <div class="ct-metric-box">
              <span class="ct-metric-label">${l === 'tr' ? 'Koroner Yükseklik (LCA / RCA)' : 'Coronary Height (LCA / RCA)'}</span>
              <strong class="ct-metric-value">${taviData.lcaHeightMm} mm / ${taviData.rcaHeightMm} mm</strong>
            </div>
          </div>

          <p class="ct-structural-note">
            <strong>${escapeHtml(t(activeView.label, l))}:</strong>
            ${state.taviProjectionKey === 'cuspOverlapView'
              ? (l === 'tr'
                ? 'RAO / Kauda Cusp-Overlap açısında sol (LCC) ve sağ (RCC) koroner kasplar üst üste biner, non-koroner kasp (NCC) izole edilir ve LVOT/iletim sistemi boyunca kapak implantasyon derinliği hassas biçimde kontrol edilir.'
                : 'In the RAO / Caudal Cusp-Overlap projection, the LCC and RCC hinges overlap while isolating the NCC nadir, elongating the LVOT to minimize permanent pacemaker risk.')
              : (l === 'tr'
                ? 'Standart 3-Kasp Koplanar açıda sağ (RCC), sol (LCC) ve non-koroner (NCC) kaspların en alt noktaları (nadir) tek bir düzlemde, tek çizgi üzerinde görülür (LAO 12° · CAU 10°).'
                : 'In the standard 3-Cusp Coplanar view, all three nadirs (RCC, LCC and NCC) lie in one plane and line up on a single line (LAO 12° · CAU 10°).')
            }
          </p>
          ${c.taviMetrics ? '' : `
            <p class="ct-structural-note ct-structural-note--source" data-ct-tavi-source-note>
              ${l === 'tr'
                ? `Seçili olgu (${escapeHtml(c.tag)}) için TAVI ölçümü yok; gösterilen anülüs ve S-eğrisi değerleri CT-7 Pre-TAVI olgusundan alınmıştır.`
                : `The selected case (${escapeHtml(c.tag)}) has no TAVI study; the annulus and S-curve values shown are taken from the CT-7 Pre-TAVI case.`}
            </p>
          `}
        </div>

        <div class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'SOL ATRİYAL APENDİKS (LAA), PULMONER EMBOLİ & PERİKARDİYAL BT' : 'LEFT ATRIAL APPENDAGE (LAA), PULMONARY EMBOLISM & PERICARDIAL CT'}</span>
              <h2 class="ct-card-title">${l === 'tr' ? '60 sn Geç Faz LAA Trombüs Ayrımı, Koroner Obstrüksiyon Riski ve Perikard' : '60s Delayed LAA Thrombus Rule-Out, Coronary Obstruction Risk & Pericardium'}</h2>
            </div>
            <button
              type="button"
              class="ct-chip-btn"
              data-ct-load-laa-case
            >${l === 'tr' ? 'CT-8 LAA Olgusunu Yükle' : 'Load CT-8 LAA Case'}</button>
          </div>

          <div class="ct-structural-cards">
            <div class="ct-info-box">
              <h3>${l === 'tr' ? '1. LAA 60 Saniye Geç Faz Protokolü (Staz vs Trombüs)' : '1. LAA 60-Second Delayed Phase Protocol (Stasis vs Thrombus)'}</h3>
              <p>${l === 'tr'
                ? 'Erken arteriyel fazda LAA ucundaki dolum defekti sıklıkla yavaş akım stazına (psödotrombüs) bağlıdır. 60. saniye gecikmeli fazda LAA tamamen opaklaşıyorsa staz kanıtlanır; sebat eden <100 HU defekt (LAA/AAo oranı <0.25) gerçek organize trombüsü gösterir (%99 NPV).'
                : 'On early arterial-phase CCTA, an LAA tip filling defect often reflects circulatory stasis (pseudo-thrombus). Complete homogenization on a 60-second delayed scan confirms stasis, whereas a persistent defect <100 HU (LAA/AAo ratio <0.25) diagnoses organized thrombus (>99% NPV).'}</p>
            </div>
            <div class="ct-info-box">
              <h3>${l === 'tr' ? '2. TAVI Koroner Obstrüksiyon Riski (LCA <10 mm & VTC <4 mm)' : '2. TAVI Coronary Obstruction Risk (LCA <10 mm & VTC <4 mm)'}</h3>
              <p>${l === 'tr'
                ? 'Sol ana koroner ostium yüksekliğinin <10 mm olması, Valsalva sinüsü çapının <30 mm olması veya sanal kapak-koroner (VTC) mesafesinin <4 mm ölçülmesi akut koroner tıkanma riskini belirgin artırır; baca stentleme veya BASILICA planlanmalıdır.'
                : 'An LCA ostial height <10 mm combined with a Sinus of Valsalva diameter <30 mm or a virtual Valve-to-Coronary (VTC) distance <4 mm indicates high risk of acute coronary occlusion, warranting chimney stent protection or BASILICA.'}</p>
            </div>
            <div class="ct-info-box">
              <h3>${l === 'tr' ? '3. Konstriktif Perikardit (≥4 mm) & Triple Rule-Out' : '3. Constrictive Pericarditis (≥4 mm) & Triple Rule-Out'}</h3>
              <p>${l === 'tr'
                ? 'Kardiyak BT, perikard kalınlığını (≥4 mm patolojik) ve AV oluktaki yumurta kabuğu kalsifikasyonu (920 HU) en yüksek duyarlılıkla haritalar. Akut göğüs ağrısında Triple Rule-Out protokolü koronerleri, pulmoner emboliyi (RV/LV >1.0) ve aortu tek çekimde değerlendirir.'
                : 'Cardiac CT maps pericardial thickness (≥4 mm abnormal) and eggshell AV groove calcification (920 HU) with unmatched spatial resolution. In acute chest pain, Triple Rule-Out simultaneously evaluates the coronaries, pulmonary arteries (RV/LV >1.0), and thoracic aorta.'}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCalculatorsMode(l) {
    return `
      <div class="ct-calculators-layout">
        <section class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'KARDİYAK BT FİZİĞİ, REKONSTRÜKSİYON ARTEFAKTLARI VE ÇÖZÜM SİMÜLATÖRÜ' : 'CARDIAC CT PHYSICS, RECONSTRUCTION ARTIFACTS & MITIGATION SIMULATOR'}</span>
              <h2 class="ct-card-title">${l === 'tr' ? '5 Klasik Kardiyak BT Artefaktı · İnteraktif Düzeltme Simülasyonu' : '5 Classic Cardiac CT Artifacts · Interactive Mitigation Simulation'}</h2>
            </div>
          </div>

          <div class="ct-artifact-grid">
            ${ARTIFACT_CATALOG.map((art, idx) => {
              const isFixed = Boolean(state.artifactFixedMap[art.id]);
              return `
                <article class="ct-artifact-card" data-ct-artifact-card="${escapeHtml(art.id)}">
                  <div class="ct-artifact-top">
                    <div>
                      <span class="ct-artifact-badge">${l === 'tr' ? 'ARTEFAKT' : 'ARTIFACT'} ${idx + 1} / ${ARTIFACT_CATALOG.length}</span>
                      <h3 class="ct-artifact-title">${escapeHtml(t(art.name, l))}</h3>
                    </div>
                    <button
                      type="button"
                      class="ct-chip-btn ${isFixed ? 'is-active' : ''}"
                      data-ct-artifact-fix="${escapeHtml(art.id)}"
                      aria-pressed="${isFixed ? 'true' : 'false'}"
                    >${isFixed ? (l === 'tr' ? 'Düzeltme Aktif ✓' : 'Fix Applied ✓') : (l === 'tr' ? 'Artefaktı Düzelt' : 'Apply Physics Fix')}</button>
                  </div>

                  <div class="ct-canvas-wrap ct-canvas-wrap--artifact">
                    <canvas
                      class="ct-canvas ct-canvas--artifact"
                      data-ct-artifact-canvas="${escapeHtml(art.id)}"
                      aria-label="${escapeHtml(t(art.name, l))}"
                    ></canvas>
                  </div>

                  <p class="ct-artifact-text"><strong>${l === 'tr' ? 'Fiziksel Mekanizma:' : 'Physical Mechanism:'}</strong> ${escapeHtml(t(art.mechanism, l))}</p>
                  <p class="ct-artifact-text"><strong>${l === 'tr' ? 'Klinik Etki / Tuzak:' : 'Clinical Impact / Pitfall:'}</strong> ${escapeHtml(t(art.impact, l))}</p>
                  <p class="ct-artifact-text ct-artifact-fix-note"><strong>${l === 'tr' ? 'Çözüm Protokolü:' : 'Mitigation Protocol:'}</strong> ${escapeHtml(t(art.fix, l))}</p>
                </article>
              `;
            }).join('')}
          </div>
        </section>

        <section class="ct-card">
          <div class="ct-card-header">
            <div>
              <span class="ct-card-kicker">${l === 'tr' ? 'KANTİTATİF KARDİYAK BT HESAPLAYICILARI (5 HESAPLAYICI)' : 'QUANTITATIVE CARDIAC CT CALCULATORS (5 CALCULATORS)'}</span>
              <h2 class="ct-card-title">${l === 'tr' ? 'CAD-RADS 2.0, Agatston CAC, TAVI Anülüs, Glagov RI ve Radyasyon Dozu (DLP → mSv)' : 'CAD-RADS 2.0, Agatston CAC, TAVI Annulus, Glagov RI & Radiation Dose (DLP → mSv)'}</h2>
            </div>
          </div>

          <div class="ct-calc-grid">
            ${CALCULATOR_CARDS.map((calc) => {
              const vals = state.calcValues[calc.id] || {};
              const res = evaluateCtCalculator(calc.id, vals, l);
              return `
                <article class="ct-calc-card" data-ct-calc-card="${escapeHtml(calc.id)}">
                  <div class="ct-artifact-badge">${escapeHtml(t(calc.category, l))}</div>
                  <h3 class="ct-calc-title">${escapeHtml(t(calc.title, l))}</h3>
                  <p class="ct-calc-sub ct-mono">${escapeHtml(calc.formulaText)}</p>
                  <p class="ct-calc-sub">${escapeHtml(t(calc.thresholds, l))}</p>

                  <div class="ct-calc-inputs">
                    ${calc.inputs.map((inp) => `
                      <label class="ct-calc-field">
                        <span>${escapeHtml(t(inp.label, l))}</span>
                        <input
                          type="number"
                          min="${inp.min}"
                          max="${inp.max}"
                          step="${inp.step}"
                          value="${vals[inp.key] ?? inp.defaultVal}"
                          class="ct-input"
                          data-ct-calc-id="${escapeHtml(calc.id)}"
                          data-ct-calc-input="${escapeHtml(inp.key)}"
                        />
                      </label>
                    `).join('')}
                  </div>

                  <div class="ct-calc-output" data-ct-calc-output="${escapeHtml(calc.id)}">
                    ${(res.rows || []).map((r) => `
                      <div class="ct-calc-row">
                        <span class="ct-calc-row-label">${escapeHtml(r.label)}</span>
                        <strong class="ct-calc-row-val is-${escapeHtml(r.status || 'ok')}">${escapeHtml(r.value)}</strong>
                      </div>
                    `).join('')}
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderReferencesFooter(l) {
    return `
      <section class="ct-references" aria-label="${l === 'tr' ? 'Kılavuz ve Kaynaklar' : 'Guidelines & References'}">
        <h2 class="ct-references-title">${l === 'tr' ? 'Klinik Kılavuzlar ve Konsensüs Kaynakları' : 'Clinical Guidelines & Consensus References'}</h2>
        <ol class="ct-references-list">
          ${REFERENCES.map((ref) => `<li>${escapeHtml(ref)}</li>`).join('')}
        </ol>
      </section>
    `;
  }

  function paintSafely(canvas, paint) {
    if (!canvas) return;
    try {
      paint();
      delete canvas.dataset.ctPaintError;
    } catch (err) {
      // One failing canvas must not blank the others: show the failure on that canvas only.
      canvas.dataset.ctPaintError = String(err?.message || err);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#1f0a10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fb7185';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(lang() === 'tr' ? 'Görüntü çizilemedi' : 'View could not be drawn', 12, 24);
    }
  }

  function paintCanvases() {
    const l = lang();
    const c = currentCase();
    const q = (sel) => mount.querySelector(sel);

    const vrtCanvas = q('[data-ct-tri-vrt]');
    paintSafely(vrtCanvas, () => renderCtTriPanelVrtCanvas(vrtCanvas, c, state, l));
    const mipCanvas = q('[data-ct-tri-mip]');
    paintSafely(mipCanvas, () => renderCtTriPanelMipCanvas(mipCanvas, c, state, l));
    const mprCanvas = q('[data-ct-tri-mpr]');
    paintSafely(mprCanvas, () => renderCtTriPanelMprCanvas(mprCanvas, c, state, l));

    const axialCanvas = q('[data-ct-axial-canvas]');
    paintSafely(axialCanvas, () => renderAxialCtSliceCanvas(axialCanvas, c, state, l));

    const cprCanvas = q('[data-ct-cpr-canvas]');
    paintSafely(cprCanvas, () => renderCprAndCtFfrCanvas(cprCanvas, computeCprAndCtFfrProfile(c, state), c, state, l));

    const taviCanvas = q('[data-ct-tavi-canvas]');
    paintSafely(taviCanvas, () => renderTaviPlanningCanvas(taviCanvas, computeTaviCoplanarCurve(c), state, l));

    mount.querySelectorAll('[data-ct-artifact-canvas]').forEach((canvas) => {
      const artId = canvas.getAttribute('data-ct-artifact-canvas');
      const art = ARTIFACT_CATALOG.find((a) => a.id === artId);
      const label = art ? t(art.name, l).split(' (')[0] : artId;
      paintSafely(canvas, () => renderCtArtifactPreviewCanvas(canvas, artId, Boolean(state.artifactFixedMap[artId]), l, label));
    });

    syncRoiReadout();
  }

  /**
   * The probe stores only { regionKey, x, y }; name (current language) and HU come from the last
   * axial paint. A probe whose region no longer exists on this slice is cleared.
   */
  function syncRoiReadout() {
    const axialCanvas = mount.querySelector('[data-ct-axial-canvas]');
    const resolved = axialCanvas && state.roiProbe ? axialCanvas.__ctRoiResolved : null;
    if (state.roiProbe && axialCanvas && !resolved) state.roiProbe = null;
    const roiBar = mount.querySelector('[data-ct-roi-bar]');
    if (roiBar) roiBar.innerHTML = roiBarHtml(lang(), resolved);
  }

  /** Light update while a slider is dragged: readouts and canvases only, no DOM rebuild. */
  function updateLiveView() {
    const l = lang();
    const c = currentCase();
    const setHtml = (sel, html) => {
      const el = mount.querySelector(sel);
      if (el) el.innerHTML = html;
    };
    setHtml('[data-ct-vrt-alpha-readout]', `${state.vrtAlphaDeg}°`);
    setHtml('[data-ct-vrt-beta-readout]', `${state.vrtBetaDeg}°`);
    setHtml('[data-ct-z-readout]', `z = ${Math.round(state.zMm)} mm`);
    setHtml('[data-ct-scout-wrap]', renderSagittalScoutSvg(c, state, l));
    const level = levelForZ(state.zMm);
    setHtml('[data-ct-level-title]', escapeHtml(t(level.label, l)));
    mount.querySelectorAll('[data-ct-level-z]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.getAttribute('data-ct-level-z')) === level.zMm);
    });
    setHtml('[data-ct-cpr-readout]', cprReadoutHtml(l, computeCprAndCtFfrProfile(c, state)));
    paintCanvases();
  }

  function bindLiveSlider(selector, apply) {
    const slider = mount.querySelector(selector);
    if (!slider) return;
    slider.addEventListener('input', () => {
      apply(Number(slider.value));
      updateLiveView();
    });
    slider.addEventListener('change', () => {
      apply(Number(slider.value));
      render();
    });
  }

  function bindTriPanelHitClick(canvas) {
    if (!canvas) return;
    canvas.addEventListener('click', (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 380;
      const y = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * 390;
      const hits = canvas.__ctSegHits || [];
      let best = null;
      let bestDist = Infinity;
      for (const h of hits) {
        const d = Math.hypot(x - h.x, y - h.y);
        if (d <= (h.r || 16) + 6 && d < bestDist) {
          best = h;
          bestDist = d;
        }
      }
      if (best && best.segKey) {
        state.selectedSegKey = state.selectedSegKey === best.segKey ? null : best.segKey;
        render();
      }
    });
  }

  function bindEvents() {
    mount.querySelectorAll('[data-ct-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMode = btn.getAttribute('data-ct-mode');
        if (nextMode && nextMode !== state.mode) {
          state.mode = nextMode;
          render();
        }
      });
    });

    mount.querySelectorAll('[data-ct-case]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ct-case');
        if (id) selectCase(id);
      });
    });

    mount.querySelectorAll('[data-ct-fov]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fov = btn.getAttribute('data-ct-fov');
        if (fov && fov !== state.fovMode) {
          state.fovMode = fov;
          render();
        }
      });
    });

    const segColorBtn = mount.querySelector('[data-ct-seg-color-toggle]');
    if (segColorBtn) {
      segColorBtn.addEventListener('click', () => {
        state.segColorMode = !state.segColorMode;
        render();
      });
    }

    const mprSegBtn = mount.querySelector('[data-ct-mpr-seg-toggle]');
    if (mprSegBtn) {
      mprSegBtn.addEventListener('click', () => {
        state.mprSegmentationOverlay = !state.mprSegmentationOverlay;
        render();
      });
    }

    const chambersSubBtn = mount.querySelector('[data-ct-chambers-sub-toggle]');
    if (chambersSubBtn) {
      chambersSubBtn.addEventListener('click', () => {
        state.chambersSubtracted = !state.chambersSubtracted;
        render();
      });
    }

    const segClearBtn = mount.querySelector('[data-ct-seg-clear]');
    if (segClearBtn) {
      segClearBtn.addEventListener('click', () => {
        state.selectedSegKey = null;
        render();
      });
    }

    bindLiveSlider('[data-ct-vrt-alpha]', (v) => { state.vrtAlphaDeg = v; });
    bindLiveSlider('[data-ct-vrt-beta]', (v) => { state.vrtBetaDeg = v; });

    mount.querySelectorAll('[data-ct-seg-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-ct-seg-select');
        if (!key) return;
        state.selectedSegKey = state.selectedSegKey === key ? null : key;
        render();
      });
    });

    mount.querySelectorAll('[data-ct-seg-vis]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const key = chk.getAttribute('data-ct-seg-vis');
        if (!key) return;
        const hidden = new Set(state.hiddenSegments);
        if (chk.checked) hidden.delete(key);
        else hidden.add(key);
        state.hiddenSegments = [...hidden];
        render();
      });
    });

    bindTriPanelHitClick(mount.querySelector('[data-ct-tri-vrt]'));
    bindTriPanelHitClick(mount.querySelector('[data-ct-tri-mip]'));
    bindTriPanelHitClick(mount.querySelector('[data-ct-tri-mpr]'));

    bindLiveSlider('[data-ct-z-slider]', (v) => {
      state.zMm = v;
      state.roiProbe = null;
    });

    mount.querySelectorAll('[data-ct-level-z]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.zMm = Number(btn.getAttribute('data-ct-level-z'));
        state.roiProbe = null;
        render();
      });
    });

    mount.querySelectorAll('[data-ct-window]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.windowPresetId = btn.getAttribute('data-ct-window') || 'cta-angio';
        render();
      });
    });

    mount.querySelectorAll('[data-ct-rr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.rrPhasePct = Number(btn.getAttribute('data-ct-rr'));
        render();
      });
    });

    const delayedBtn = mount.querySelector('[data-ct-delayed-toggle]');
    if (delayedBtn) {
      delayedBtn.addEventListener('click', () => {
        state.delayedPhase60s = !state.delayedPhase60s;
        render();
      });
    }

    const axialCanvas = mount.querySelector('[data-ct-axial-canvas]');
    if (axialCanvas) {
      axialCanvas.addEventListener('click', (ev) => {
        const rect = axialCanvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * AXIAL_CANVAS_SIZE.w;
        const y = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * AXIAL_CANVAS_SIZE.h;
        const regionKey = pickAxialRegion(axialCanvas, x, y);
        state.roiProbe = regionKey ? { regionKey, x: Math.round(x), y: Math.round(y) } : null;
        paintCanvases();
      });
    }

    bindLiveSlider('[data-ct-cpr-slider]', (v) => { state.cprDistalMm = v; });

    const loadTaviBtn = mount.querySelector('[data-ct-load-tavi-case]');
    if (loadTaviBtn) {
      loadTaviBtn.addEventListener('click', () => {
        selectCase('tavi-aortic-root');
      });
    }

    const loadLaaBtn = mount.querySelector('[data-ct-load-laa-case]');
    if (loadLaaBtn) {
      loadLaaBtn.addEventListener('click', () => {
        selectCase('laa-vein-mapping');
      });
    }

    mount.querySelectorAll('[data-ct-tavi-proj]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.taviProjectionKey = btn.getAttribute('data-ct-tavi-proj') || 'threeCuspView';
        render();
      });
    });

    mount.querySelectorAll('[data-ct-artifact-fix]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ct-artifact-fix');
        if (!id) return;
        state.artifactFixedMap[id] = !state.artifactFixedMap[id];
        render();
      });
    });

    mount.querySelectorAll('[data-ct-calc-input]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const calcId = inp.getAttribute('data-ct-calc-id');
        const fieldId = inp.getAttribute('data-ct-calc-input');
        if (!calcId || !fieldId) return;
        if (!state.calcValues[calcId]) state.calcValues[calcId] = {};
        state.calcValues[calcId][fieldId] = Number(inp.value);
        const outEl = mount.querySelector(`[data-ct-calc-output="${calcId}"]`);
        if (outEl) {
          const l = lang();
          const res = evaluateCtCalculator(calcId, state.calcValues[calcId], l);
          outEl.innerHTML = (res.rows || []).map((r) => `
            <div class="ct-calc-row">
              <span class="ct-calc-row-label">${escapeHtml(r.label)}</span>
              <strong class="ct-calc-row-val is-${escapeHtml(r.status || 'ok')}">${escapeHtml(r.value)}</strong>
            </div>
          `).join('');
        }
      });
    });
  }

  // The real CT viewer keeps its decoded volume across panel re-renders: one host element is
  // created on first use and moved into the slot each time.
  let realHost = null;
  let realViewer = null;
  function attachRealViewer() {
    const slot = mount.querySelector('[data-ct-real-slot]');
    if (!slot) return;
    if (!realHost) {
      realHost = document.createElement('div');
      realViewer = createCtVolumeViewer({ mount: realHost, getLang: lang });
    } else {
      realViewer.render();
    }
    slot.replaceWith(realHost);
  }

  function render() {
    const l = lang();
    const c = currentCase();
    const focusSel = focusSelectorFor(document.activeElement, mount);

    let modeBody = '';
    if (state.mode === 'realct') {
      modeBody = '<div data-ct-real-slot></div>';
    } else if (state.mode === 'workstation') {
      modeBody = renderWorkstationMode(l, c);
    } else if (state.mode === 'coronary') {
      modeBody = renderCoronaryMode(l, c);
    } else if (state.mode === 'structural') {
      modeBody = renderStructuralMode(l, c);
    } else {
      modeBody = renderCalculatorsMode(l);
    }

    mount.innerHTML = `
      <div class="ct-shell">
        ${renderHeroBanner(l, c)}
        ${renderModeTabs(l)}
        ${state.mode === 'realct' ? '' : renderCaseStrip(l, c)}
        <div class="ct-mode-stage" data-ct-mode-stage="${escapeHtml(state.mode)}">
          ${modeBody}
        </div>
        ${renderReferencesFooter(l)}
      </div>
    `;

    bindEvents();
    attachRealViewer();
    paintCanvases();
    if (focusSel) mount.querySelector(focusSel)?.focus({ preventScroll: true });
  }

  render();

  return {
    render,
    getState() {
      return { ...state };
    },
    getRealViewer: () => realViewer,
    destroy() {
      realViewer?.destroy();
      mount.innerHTML = '';
    }
  };
}
