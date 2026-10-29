// Coronary IVUS Lab · Interactive Intravascular Ultrasound Workstation & PCI Guidance Panel
// Combines B-mode cross-section, L-mode longitudinal pullback, morphology atlas, artifact QA, and calculators.

import {
  WORKSPACE_MODES,
  TRANSDUCER_MODES,
  CLINICAL_CASES,
  MORPHOLOGY_ATLAS,
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  REFERENCES
} from './coronary-ivus-data.js';

import {
  clamp,
  findIvusCase,
  sampleIvusSlice,
  computePullbackProfile,
  evaluateIvusCalculator
} from './coronary-ivus-sim.js';

import {
  renderIvusAngioCoRegSvg,
  renderIvusCrossSectionCanvas,
  renderIvusLongitudinalCanvas,
  renderIvusFeaturePreviewCanvas
} from './coronary-ivus-render.js';

import { modelStateDefaults, modelWorkspaceHtml, mountModelWorkspace } from './ivus-model-view.js';

// Interactive 3D vessel & stent model leads the page; the four classic workspaces follow.
const MODEL_MODE = Object.freeze({
  id: 'model',
  label: Object.freeze({ tr: '3B Damar & Stent Modeli', en: '3D Vessel & Stent Model' })
});
const ALL_MODES = Object.freeze([MODEL_MODE, ...WORKSPACE_MODES]);

const pick = (obj, lang) => (obj && typeof obj === 'object' ? (obj[lang === 'en' ? 'en' : 'tr'] ?? obj.tr ?? '') : String(obj ?? ''));

export function createCoronaryIvusPanel({ mount, getLang = () => 'tr' }) {
  const initialCalcValues = {};
  for (const card of CALCULATOR_CARDS) {
    initialCalcValues[card.id] = {};
    for (const inp of card.inputs) {
      initialCalcValues[card.id][inp.key] = inp.defaultVal;
    }
  }

  const state = {
    workspaceMode: 'model',            // 'model' | 'console' | 'morphology' | 'artifacts' | 'calculator'
    caseId: 'lad-fibrocalcific',
    transducerMode: 'rotational-60',   // 'rotational-60' | 'rotational-40' | 'phased-20'
    posMm: 20,                         // 0 (distal) .. 40 (proximal)
    pullingBack: false,
    pullbackSpeedMmPerSec: 1.0,
    // Planimetry & console toggles
    showEemOverlay: true,
    showLumenOverlay: true,
    showCalipers: true,
    showCalciumArc: true,
    chromaFlo: false,
    salineFlush: false,
    // Virtual PCI optimization toggles
    plaqueModified: false,
    stentDeployed: false,
    potPerformed: false,
    bailoutStent: false,
    // Animation state
    phaseOffset: 0,
    // Artifacts & Quiz state
    artifactFixedMap: {
      nurd: false,
      'ringdown-stasis': false,
      'wire-shadow': false,
      reverberation: false,
      'oblique-slicing': false
    },
    quizIndex: 0,
    quizSelected: null,
    // Calculator state
    calcValues: initialCalcValues,
    // 3D vessel & stent model (ivus-model-view.js)
    ...modelStateDefaults()
  };

  const root = document.createElement('div');
  root.className = 'ivus-lab';
  mount.appendChild(root);

  let rafId = null;
  let pullbackTimer = null;
  let lastTs = 0;
  let modelWorkspace = null;

  function applyCaseDefaults(caseObj) {
    if (pullbackTimer) {
      clearInterval(pullbackTimer);
      pullbackTimer = null;
    }
    state.pullingBack = false;
    state.posMm = caseObj?.mlaMm ?? 20;
    state.plaqueModified = false;
    state.stentDeployed = false;
    state.potPerformed = false;
    state.bailoutStent = false;
    state.salineFlush = false;
  }

  function selectCase(caseId) {
    const found = findIvusCase(caseId);
    state.caseId = found.id;
    applyCaseDefaults(found);
    render();
  }

  function startMotorizedPullback() {
    if (pullbackTimer) clearInterval(pullbackTimer);
    const caseObj = findIvusCase(state.caseId);
    const len = caseObj.pullbackLengthMm || 40;
    state.posMm = 0;
    state.pullingBack = true;
    render();

    pullbackTimer = setInterval(() => {
      state.posMm = roundPos(state.posMm + 1.0);
      if (state.posMm >= len) {
        state.posMm = len;
        state.pullingBack = false;
        clearInterval(pullbackTimer);
        pullbackTimer = null;
        render();
        return;
      }
      syncDynamicConsoleView();
    }, 55);
  }

  function roundPos(v) {
    return Math.round(clamp(v, 0, 40) * 2) / 2;
  }

  function renderConsoleWorkspace(lang) {
    const isTr = lang === 'tr';
    const caseObj = findIvusCase(state.caseId);
    const profile = computePullbackProfile(caseObj, state);
    const slice = sampleIvusSlice(caseObj, state.posMm, state);

    return `
      <!-- CASE BAR & TRANSDUCER CONTROLS -->
      <section class="ivus-toolbar">
        <div class="ivus-field">
          <label for="ivus-case-select">${isTr ? 'Klinik IVUS Olgusu (10 Senaryo):' : 'Clinical IVUS Case (10 Scenarios):'}</label>
          <select id="ivus-case-select" class="ivus-select" data-ivus-case>
            ${CLINICAL_CASES.map(c => `
              <option value="${c.id}" ${c.id === state.caseId ? 'selected' : ''}>
                [${c.tag} · ${c.vessel}] ${pick(c.name, lang)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="ivus-field">
          <label for="ivus-tx-select">${isTr ? 'IVUS Kateter / Frekans:' : 'IVUS Catheter / Frequency:'}</label>
          <select id="ivus-tx-select" class="ivus-select" data-ivus-transducer>
            ${TRANSDUCER_MODES.map(m => `
              <option value="${m.id}" ${m.id === state.transducerMode ? 'selected' : ''}>
                ${pick(m.label, lang)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="ivus-quick-jumps">
          <button type="button" class="ivus-btn" data-ivus-jump="${caseObj.distalRefMm}">${isTr ? 'Distal Ref' : 'Distal Ref'} (${caseObj.distalRefMm} mm)</button>
          <button type="button" class="ivus-btn primary" data-ivus-jump="${caseObj.mlaMm}">MLA (${caseObj.mlaMm} mm)</button>
          <button type="button" class="ivus-btn" data-ivus-jump="${caseObj.proxRefMm}">${isTr ? 'Proks Ref' : 'Prox Ref'} (${caseObj.proxRefMm} mm)</button>
          <button type="button" class="ivus-btn accent" data-ivus-pullback>
            ${state.pullingBack ? (isTr ? '⏸ Geri Çekiliyor...' : '⏸ Pulling Back...') : (isTr ? '▶ Motorize Pullback (0→40 mm)' : '▶ Motorized Pullback (0→40 mm)')}
          </button>
        </div>
      </section>

      <!-- MAIN 2-COLUMN CONSOLE STAGE -->
      <div class="ivus-console-grid">
        <!-- LEFT: POLAR B-MODE CROSS-SECTION + PLANIMETRY OVERLAYS -->
        <section class="ivus-card ivus-bmode-card">
          <div class="ivus-card-head">
            <div>
              <h2>${isTr ? 'B-Mod Aksiyel Kesit (Cross-Section)' : 'B-Mode Axial Cross-Section'}</h2>
              <p>${pick(caseObj.segment, lang)} · <span data-ivus-pos-label>${state.posMm.toFixed(1)} mm</span></p>
            </div>
            <span class="ivus-badge" data-ivus-plaque-badge>${slice.plaqueType.toUpperCase()}</span>
          </div>

          <div class="ivus-bmode-wrap">
            <canvas class="ivus-cross-canvas" data-ivus-cross-canvas width="440" height="440"></canvas>
          </div>

          <div class="ivus-overlay-toggles">
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="showEemOverlay" ${state.showEemOverlay ? 'checked' : ''} />
              <span>🟡 ${isTr ? 'EEM Sınırı' : 'EEM Border'}</span>
            </label>
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="showLumenOverlay" ${state.showLumenOverlay ? 'checked' : ''} />
              <span>🟢 ${isTr ? 'Lümen Sınırı' : 'Lumen Border'}</span>
            </label>
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="showCalipers" ${state.showCalipers ? 'checked' : ''} />
              <span>🔵 ${isTr ? 'Dmin / Dmax Çaplar' : 'Dmin / Dmax Calipers'}</span>
            </label>
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="showCalciumArc" ${state.showCalciumArc ? 'checked' : ''} />
              <span>🔴 ${isTr ? 'Kalsiyum Arkı (°)' : 'Calcium Arc (°)'}</span>
            </label>
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="chromaFlo" ${state.chromaFlo ? 'checked' : ''} />
              <span>🩸 ChromaFlo</span>
            </label>
            <label class="ivus-chip-check">
              <input type="checkbox" data-ivus-toggle="salineFlush" ${state.salineFlush ? 'checked' : ''} />
              <span>💧 ${isTr ? 'Salin Yıkama (Flush)' : 'Saline Flush'}</span>
            </label>
          </div>

          <!-- LIVE SLICE PLANIMETRY READOUT TILES -->
          <div class="ivus-readout-grid">
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'Lümen Alanı' : 'Lumen Area'}</span>
              <strong class="ivus-tile-v ${slice.lumenAreaMm2 < 4.0 ? 'bad' : 'ok'}" data-ro-lumen>${slice.lumenAreaMm2.toFixed(2)} mm²</strong>
            </div>
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'EEM (Dış Elastik) Alanı' : 'EEM Vessel Area'}</span>
              <strong class="ivus-tile-v" data-ro-eem>${slice.eemAreaMm2.toFixed(2)} mm²</strong>
            </div>
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'Plak Yükü (PB)' : 'Plaque Burden (PB)'}</span>
              <strong class="ivus-tile-v ${slice.plaqueBurdenPct >= 70 ? 'bad' : slice.plaqueBurdenPct >= 50 ? 'warn' : 'ok'}" data-ro-pb>%${slice.plaqueBurdenPct.toFixed(1)}</strong>
            </div>
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'Lümen Çapı (Dmin × Dmax)' : 'Lumen Diam (Dmin × Dmax)'}</span>
              <strong class="ivus-tile-v" data-ro-diam>${slice.dMin.toFixed(2)} × ${slice.dMax.toFixed(2)} mm</strong>
            </div>
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'Kalsiyum Arkı' : 'Calcium Arc'}</span>
              <strong class="ivus-tile-v ${slice.calciumArcDeg > 180 ? 'bad' : slice.calciumArcDeg > 0 ? 'warn' : 'ok'}" data-ro-ca>${slice.calciumArcDeg}°</strong>
            </div>
            <div class="ivus-tile">
              <span class="ivus-tile-k">${isTr ? 'Remodeling İndeksi (RI)' : 'Remodeling Index (RI)'}</span>
              <strong class="ivus-tile-v ${slice.remodelingIndex > 1.05 ? 'warn' : 'ok'}" data-ro-ri>${slice.remodelingIndex.toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <!-- RIGHT: CO-REGISTRATION SVG + LONGITUDINAL L-MODE + VIRTUAL PCI OPTIMIZATION -->
        <section class="ivus-card ivus-right-col">
          <div class="ivus-subbox">
            <div class="ivus-card-head">
              <div>
                <h3>${isTr ? 'Anjiyografik Ko-Rejistrasyon & Uzunlamasına (L-Mod) Geri Çekme' : 'Angiographic Co-Registration & Longitudinal (L-Mode) Pullback'}</h3>
                <p>${isTr ? 'Kaydırıcıyı veya L-mod kesitini tıklayarak kateter probunu (0–40 mm) hareket ettirin.' : 'Drag the slider or click along the L-mode view to move the transducer probe (0–40 mm).'}</p>
              </div>
            </div>

            <div class="ivus-coreg-mount" data-ivus-coreg-mount>
              ${renderIvusAngioCoRegSvg(caseObj, state, lang)}
            </div>

            <div class="ivus-lmode-wrap">
              <canvas class="ivus-long-canvas" data-ivus-long-canvas width="620" height="195"></canvas>
            </div>

            <div class="ivus-slider-row">
              <span>${isTr ? 'Proksimal (40 mm)' : 'Proximal (40 mm)'}</span>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value="${state.posMm}"
                class="ivus-pos-slider"
                data-ivus-pos-slider
                aria-label="${isTr ? 'IVUS Geri Çekme Konumu (mm)' : 'IVUS Pullback Position (mm)'}"
              />
              <span>${isTr ? 'Distal (0 mm)' : 'Distal (0 mm)'}</span>
            </div>
          </div>

          <!-- SIZING SUMMARY & VIRTUAL PCI OPTIMIZATION (ULTIMATE / IVUS-XPL) -->
          <div class="ivus-subbox ivus-pci-box">
            <div class="ivus-card-head">
              <div>
                <h3>${isTr ? 'IVUS-Rehberli Stent Boyutlandırma & Sanal PCI (ULTIMATE Kriterleri)' : 'IVUS-Guided Stent Sizing & Virtual PCI (ULTIMATE Criteria)'}</h3>
                <p>${isTr ? 'Distal/Proksimal referans ölçümlerine göre önerilen DES çapı, kalsiyum skoru ve post-PCI MSA kontrolü.' : 'Recommended DES diameter, calcium score, and post-PCI MSA check based on reference measurements.'}</p>
              </div>
              <span class="ivus-pill ${profile.ultimateOptimal ? 'ok' : 'warn'}" data-ivus-ultimate-badge>
                ${profile.minStentFrame
                  ? (profile.ultimateOptimal
                    ? (isTr ? '✓ OPTİMAL PCI' : '✓ OPTIMAL PCI')
                    : (isTr ? '⚠ SUBOPTİMAL PCI' : '⚠ SUBOPTIMAL PCI'))
                  : (isTr ? 'PRE-PCI PLANLAMA' : 'PRE-PCI PLANNING')}
              </span>
            </div>

            <div class="ivus-sizing-strip">
              <div class="ivus-size-item">
                <span>${isTr ? 'Distal Ref Lümen / EEM' : 'Distal Ref Lumen / EEM'}</span>
                <strong>${profile.distalRefSlice.meanLumenDiamMm.toFixed(2)} / ${profile.distalRefSlice.eemDiamMm.toFixed(2)} mm (PB %${profile.distalRefSlice.plaqueBurdenPct.toFixed(0)})</strong>
              </div>
              <div class="ivus-size-item">
                <span>${isTr ? 'Proksimal Ref Lümen / EEM' : 'Proximal Ref Lumen / EEM'}</span>
                <strong>${profile.proxRefSlice.meanLumenDiamMm.toFixed(2)} / ${profile.proxRefSlice.eemDiamMm.toFixed(2)} mm (PB %${profile.proxRefSlice.plaqueBurdenPct.toFixed(0)})</strong>
              </div>
              <div class="ivus-size-item">
                <span>${isTr ? 'Önerilen Stent & POT' : 'Recommended Stent & POT'}</span>
                <strong>${profile.recommendedStentDiamMm.toFixed(2)} × ${profile.recommendedStentLengthMm} mm · POT ${profile.recommendedPotDiamMm.toFixed(2)} mm</strong>
              </div>
              <div class="ivus-size-item">
                <span>${isTr ? 'IVUS Kalsiyum Skoru' : 'IVUS Calcium Score'}</span>
                <strong class="${profile.caScore.needsModification ? 'bad' : 'ok'}" data-ivus-ca-score>
                  ${profile.caScore.score}/4 ${profile.caScore.needsModification ? (isTr ? '(IVL / Rota Gerekli)' : '(Needs IVL / Rota)') : (isTr ? '(NC Balon Yeterli)' : '(NC Balloon OK)')}
                </strong>
              </div>
              ${profile.minStentFrame ? `
                <div class="ivus-size-item">
                  <span>${isTr ? 'Post-PCI MSA (%Açılım)' : 'Post-PCI MSA (%Expansion)'}</span>
                  <strong class="${profile.criterionExpansion ? 'ok' : 'bad'}" data-ivus-msa-readout>
                    ${profile.msaMm2.toFixed(2)} mm² (%${profile.expansionPct.toFixed(0)})
                  </strong>
                </div>
                <div class="ivus-size-item">
                  <span>${isTr ? 'Maks Malapozisyon' : 'Max Malapposition'}</span>
                  <strong class="${profile.maxMalappMm >= 0.4 ? 'bad' : 'ok'}" data-ivus-malapp-readout>
                    ${profile.maxMalappMm.toFixed(2)} mm
                  </strong>
                </div>
              ` : ''}
            </div>

            <div class="ivus-pci-actions">
              <label class="ivus-chip-check">
                <input type="checkbox" data-ivus-pci="plaqueModified" ${state.plaqueModified ? 'checked' : ''} />
                <span>⚡ ${isTr ? '1. Plak Modifikasyonu (IVL / Rotablasyon)' : '1. Plaque Modification (IVL / Atherectomy)'}</span>
              </label>
              <label class="ivus-chip-check">
                <input type="checkbox" data-ivus-pci="stentDeployed" ${state.stentDeployed ? 'checked' : ''} />
                <span>🩺 ${isTr ? '2. Sanal DES İmplantasyonu' : '2. Deploy Virtual DES Stent'}</span>
              </label>
              <label class="ivus-chip-check">
                <input type="checkbox" data-ivus-pci="potPerformed" ${state.potPerformed ? 'checked' : ''} />
                <span>🎈 ${isTr ? '3. NC Balon Post-Dilatasyon & POT' : '3. NC Balloon Post-Dilatation & POT'}</span>
              </label>
              ${caseObj.lesion?.dissectionArcDeg > 0 ? `
                <label class="ivus-chip-check">
                  <input type="checkbox" data-ivus-pci="bailoutStent" ${state.bailoutStent ? 'checked' : ''} />
                  <span>🛡 ${isTr ? '4. Distal Kenar Diseksiyonunu Ek Stent ile Ört' : '4. Cover Distal Edge Dissection with Stent'}</span>
                </label>
              ` : ''}
            </div>
          </div>

          <!-- CASE CLINICAL TEACHING CALLOUT -->
          <div class="ivus-teaching-box">
            <p class="ivus-brief"><strong>${isTr ? 'Klinik Senaryo:' : 'Clinical Scenario:'}</strong> ${pick(caseObj.brief, lang)}</p>
            <p class="ivus-takeaway"><strong>${isTr ? 'IVUS Yorumu & Karar:' : 'IVUS Interpretation & Decision:'}</strong> ${pick(caseObj.teaching, lang)}</p>
          </div>
        </section>
      </div>
    `;
  }

  function renderMorphologyWorkspace(lang) {
    const isTr = lang === 'tr';
    return `
      <section class="ivus-section">
        <div class="ivus-section-head">
          <h2>${isTr ? 'IVUS Plak Morfolojisi, Kalsiyum Skorlaması ve LMCA Kriterleri' : 'IVUS Plaque Morphology, Calcium Scoring & LMCA Criteria'}</h2>
          <p>${isTr ? 'Gri skala IVUS’ta doku karakterizasyonu adventisya ekojenitesi referans alınarak (yumuşak/düşük, fibröz/eşdeğer, kalsifik/parlak + akustik gölgelenme) yapılır.' : 'Grayscale IVUS tissue characterization references adventitial echogenicity (soft/lower, fibrous/similar, calcified/brighter with acoustic shadowing).'}</p>
        </div>

        <div class="ivus-morph-grid">
          ${MORPHOLOGY_ATLAS.map(item => `
            <article class="ivus-card ivus-morph-card" data-ivus-morph-card="${item.id}">
              <canvas class="ivus-preview-canvas" data-ivus-morph-canvas="${item.id}" width="280" height="200"></canvas>
              <div class="ivus-morph-body">
                <h3>${pick(item.name, lang)}</h3>
                <p><strong>${isTr ? 'Ekojenite:' : 'Echogenicity:'}</strong> ${pick(item.echogenicity, lang)}</p>
                <p><strong>${isTr ? 'Akustik Gölge:' : 'Acoustic Shadow:'}</strong> ${pick(item.shadowing, lang)}</p>
                <p class="ivus-morph-clinical"><strong>${isTr ? 'Klinik Önem:' : 'Clinical Impact:'}</strong> ${pick(item.clinical, lang)}</p>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderArtifactsWorkspace(lang) {
    const isTr = lang === 'tr';
    const currentQuizArt = ARTIFACT_CATALOG[state.quizIndex % ARTIFACT_CATALOG.length];
    const isCorrect = state.quizSelected === currentQuizArt.id;

    return `
      <section class="ivus-section">
        <!-- INTERACTIVE SPOT THE ARTIFACT QUIZ -->
        <div class="ivus-card ivus-quiz-card">
          <div class="ivus-card-head">
            <div>
              <h2>${isTr ? 'Artefaktı Tanı (Spot the IVUS Artifact Quiz)' : 'Spot the IVUS Artifact Quiz'}</h2>
              <p>${isTr ? 'Yandaki IVUS kesitinde görülen görüntüleme artefaktını seçin ve çözüm manevrasını doğrulayın.' : 'Identify the intravascular ultrasound imaging artifact shown in the preview and verify the corrective maneuver.'}</p>
            </div>
            <button type="button" class="ivus-btn" data-ivus-quiz-next>${isTr ? 'Sonraki Soru →' : 'Next Prompt →'}</button>
          </div>

          <div class="ivus-quiz-layout">
            <canvas class="ivus-preview-canvas" data-ivus-quiz-canvas width="280" height="200"></canvas>
            <div class="ivus-quiz-options">
              <div class="ivus-quiz-btns">
                ${ARTIFACT_CATALOG.map(a => `
                  <button
                    type="button"
                    class="ivus-btn ${state.quizSelected === a.id ? (a.id === currentQuizArt.id ? 'ok' : 'bad') : ''}"
                    data-ivus-quiz-ans="${a.id}"
                  >
                    ${pick(a.name, lang)}
                  </button>
                `).join('')}
              </div>
              <div class="ivus-quiz-feedback" data-ivus-quiz-feedback>
                ${state.quizSelected ? `
                  <p class="${isCorrect ? 'ok' : 'bad'}">
                    <strong>${isCorrect ? (isTr ? '✓ Doğru Tanı!' : '✓ Correct Diagnosis!') : (isTr ? '✗ Yanlış Seçim' : '✗ Try Again')}:</strong>
                    ${pick(currentQuizArt.appearance, lang)}
                  </p>
                  <p><strong>${isTr ? 'Çözüm:' : 'Fix:'}</strong> ${pick(currentQuizArt.fix, lang)}</p>
                ` : `
                  <p>${isTr ? 'Yukarıdaki 5 artefakt seçeneğinden birini tıklayın.' : 'Select one of the 5 artifact options above.'}</p>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- 5 ARTIFACT CARDS WITH INTERACTIVE FIX TOGGLE -->
        <div class="ivus-morph-grid">
          ${ARTIFACT_CATALOG.map(art => {
            const fixed = Boolean(state.artifactFixedMap[art.id]);
            return `
              <article class="ivus-card ivus-morph-card">
                <canvas class="ivus-preview-canvas" data-ivus-art-canvas="${art.id}" width="280" height="200"></canvas>
                <div class="ivus-morph-body">
                  <h3>${pick(art.name, lang)}</h3>
                  <p><strong>${isTr ? 'Mekanizma:' : 'Mechanism:'}</strong> ${pick(art.mechanism, lang)}</p>
                  <p><strong>${isTr ? 'Görünüm:' : 'Appearance:'}</strong> ${pick(art.appearance, lang)}</p>
                  <p class="ivus-morph-clinical"><strong>${isTr ? 'Çözüm:' : 'Correction:'}</strong> ${pick(art.fix, lang)}</p>
                  <button type="button" class="ivus-btn ${fixed ? 'ok' : 'accent'}" data-ivus-art-fix="${art.id}">
                    ${fixed ? (isTr ? '✓ Artefakt Giderildi (Artefaktı Göster)' : '✓ Corrected (Show Artifact)') : (isTr ? '🔧 Artefaktı Düzelt (Fix)' : '🔧 Troubleshoot & Fix')}
                  </button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  function renderCalculatorWorkspace(lang) {
    const isTr = lang === 'tr';
    return `
      <section class="ivus-section">
        <div class="ivus-section-head">
          <h2>${isTr ? 'IVUS Planimetri, Boyutlandırma ve Optimizasyon Hesaplayıcıları' : 'IVUS Planimetry, Sizing & Optimization Calculators'}</h2>
          <p>${isTr ? 'EEM/Lümen ölçümlerini girerek plak yükünü, Glagov remodeling indeksini, önerilen stent/POT çapını, kalsiyum skorunu ve ULTIMATE / Kang kriterlerini hesaplayın.' : 'Enter EEM/Lumen measurements to compute plaque burden, Glagov remodeling index, recommended stent/POT diameter, calcium score, and ULTIMATE / Kang criteria.'}</p>
        </div>

        <div class="ivus-calc-grid">
          ${CALCULATOR_CARDS.map(card => {
            const values = state.calcValues[card.id] || {};
            const res = evaluateIvusCalculator(card.id, values, lang);
            return `
              <article class="ivus-card ivus-calc-card" data-ivus-calc-card="${card.id}">
                <div class="ivus-calc-head">
                  <span class="ivus-kicker">${pick(card.category, lang)}</span>
                  <h3>${pick(card.title, lang)}</h3>
                  <code class="ivus-formula">${card.formulaText}</code>
                  <p class="ivus-thresholds">${pick(card.thresholds, lang)}</p>
                </div>

                <div class="ivus-calc-inputs">
                  ${card.inputs.map(inp => `
                    <label class="ivus-calc-field">
                      <span>${pick(inp.label, lang)}</span>
                      <input
                        type="number"
                        min="${inp.min}"
                        max="${inp.max}"
                        step="${inp.step}"
                        value="${values[inp.key] ?? inp.defaultVal}"
                        data-ivus-calc-input="${inp.key}"
                        data-ivus-calc-card-id="${card.id}"
                      />
                    </label>
                  `).join('')}
                </div>

                <div class="ivus-calc-results" data-ivus-calc-results="${card.id}">
                  ${res.rows.map(r => `
                    <div class="ivus-calc-row">
                      <span>${r.label}</span>
                      <strong class="${r.status}">${r.value}</strong>
                    </div>
                  `).join('')}
                </div>
              </article>
            `;
          }).join('')}
        </div>

        <footer class="ivus-card ivus-refs-card">
          <h3>${isTr ? 'Kılavuzlar ve Temel Klinik Çalışmalar (References)' : 'Guidelines & Landmark Clinical Trials (References)'}</h3>
          <ol class="ivus-refs-list">
            ${REFERENCES.map(r => `<li>${r}</li>`).join('')}
          </ol>
        </footer>
      </section>
    `;
  }

  function syncDynamicConsoleView() {
    if (state.workspaceMode !== 'console') return;
    const lang = getLang();
    const caseObj = findIvusCase(state.caseId);
    const profile = computePullbackProfile(caseObj, state);
    const slice = sampleIvusSlice(caseObj, state.posMm, state);

    const posLabel = root.querySelector('[data-ivus-pos-label]');
    if (posLabel) posLabel.textContent = `${state.posMm.toFixed(1)} mm`;

    const badge = root.querySelector('[data-ivus-plaque-badge]');
    if (badge) badge.textContent = slice.plaqueType.toUpperCase();

    const slider = root.querySelector('[data-ivus-pos-slider]');
    if (slider && document.activeElement !== slider) slider.value = String(state.posMm);

    const setRo = (sel, text, cls) => {
      const el = root.querySelector(sel);
      if (!el) return;
      el.textContent = text;
      if (cls) el.className = `ivus-tile-v ${cls}`;
    };

    setRo('[data-ro-lumen]', `${slice.lumenAreaMm2.toFixed(2)} mm²`, slice.lumenAreaMm2 < 4.0 ? 'bad' : 'ok');
    setRo('[data-ro-eem]', `${slice.eemAreaMm2.toFixed(2)} mm²`, '');
    setRo('[data-ro-pb]', `%${slice.plaqueBurdenPct.toFixed(1)}`, slice.plaqueBurdenPct >= 70 ? 'bad' : slice.plaqueBurdenPct >= 50 ? 'warn' : 'ok');
    setRo('[data-ro-diam]', `${slice.dMin.toFixed(2)} × ${slice.dMax.toFixed(2)} mm`, '');
    setRo('[data-ro-ca]', `${slice.calciumArcDeg}°`, slice.calciumArcDeg > 180 ? 'bad' : slice.calciumArcDeg > 0 ? 'warn' : 'ok');
    setRo('[data-ro-ri]', slice.remodelingIndex.toFixed(2), slice.remodelingIndex > 1.05 ? 'warn' : 'ok');

    const coregMount = root.querySelector('[data-ivus-coreg-mount]');
    if (coregMount) coregMount.innerHTML = renderIvusAngioCoRegSvg(caseObj, state, lang);

    renderIvusCrossSectionCanvas(root.querySelector('[data-ivus-cross-canvas]'), slice, caseObj, state, lang);
    renderIvusLongitudinalCanvas(root.querySelector('[data-ivus-long-canvas]'), profile, caseObj, state, lang);
  }

  function drawAllCanvases() {
    const lang = getLang();
    if (state.workspaceMode === 'console') {
      const caseObj = findIvusCase(state.caseId);
      const profile = computePullbackProfile(caseObj, state);
      const slice = sampleIvusSlice(caseObj, state.posMm, state);
      renderIvusCrossSectionCanvas(root.querySelector('[data-ivus-cross-canvas]'), slice, caseObj, state, lang);
      renderIvusLongitudinalCanvas(root.querySelector('[data-ivus-long-canvas]'), profile, caseObj, state, lang);
    } else if (state.workspaceMode === 'morphology') {
      MORPHOLOGY_ATLAS.forEach(item => {
        renderIvusFeaturePreviewCanvas(
          root.querySelector(`[data-ivus-morph-canvas="${item.id}"]`),
          item.id,
          false,
          lang
        );
      });
    } else if (state.workspaceMode === 'artifacts') {
      const currentQuizArt = ARTIFACT_CATALOG[state.quizIndex % ARTIFACT_CATALOG.length];
      renderIvusFeaturePreviewCanvas(
        root.querySelector('[data-ivus-quiz-canvas]'),
        currentQuizArt.id,
        false,
        lang
      );
      ARTIFACT_CATALOG.forEach(art => {
        renderIvusFeaturePreviewCanvas(
          root.querySelector(`[data-ivus-art-canvas="${art.id}"]`),
          art.id,
          Boolean(state.artifactFixedMap[art.id]),
          lang
        );
      });
    }
  }

  function bindEvents() {
    // Workspace mode tabs
    root.querySelectorAll('[data-ivus-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.workspaceMode = btn.dataset.ivusMode;
        render();
      });
    });

    // Case selector
    root.querySelector('[data-ivus-case]')?.addEventListener('change', e => {
      selectCase(e.target.value);
    });

    // Transducer selector
    root.querySelector('[data-ivus-transducer]')?.addEventListener('change', e => {
      state.transducerMode = e.target.value;
      render();
    });

    // Quick jumps (Distal Ref / MLA / Prox Ref)
    root.querySelectorAll('[data-ivus-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (pullbackTimer) {
          clearInterval(pullbackTimer);
          pullbackTimer = null;
          state.pullingBack = false;
        }
        state.posMm = roundPos(Number(btn.dataset.ivusJump));
        syncDynamicConsoleView();
      });
    });

    // Motorized pullback button
    root.querySelector('[data-ivus-pullback]')?.addEventListener('click', () => {
      if (state.pullingBack) {
        clearInterval(pullbackTimer);
        pullbackTimer = null;
        state.pullingBack = false;
        render();
      } else {
        startMotorizedPullback();
      }
    });

    // Position slider
    root.querySelector('[data-ivus-pos-slider]')?.addEventListener('input', e => {
      state.posMm = roundPos(Number(e.target.value));
      syncDynamicConsoleView();
    });

    // Click on L-mode longitudinal canvas to jump position
    const longCanvas = root.querySelector('[data-ivus-long-canvas]');
    longCanvas?.addEventListener('click', e => {
      const rect = longCanvas.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 620;
      const plotW = 620 - 44 - 20;
      const frac = clamp((relX - 44) / plotW, 0, 1);
      state.posMm = roundPos((1 - frac) * 40);
      syncDynamicConsoleView();
    });

    // Overlay checkboxes
    root.querySelectorAll('[data-ivus-toggle]').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.dataset.ivusToggle;
        state[key] = chk.checked;
        syncDynamicConsoleView();
      });
    });

    // Virtual PCI optimization checkboxes
    root.querySelectorAll('[data-ivus-pci]').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.dataset.ivusPci;
        state[key] = chk.checked;
        render();
      });
    });

    // Artifact quiz & fix buttons
    root.querySelector('[data-ivus-quiz-next]')?.addEventListener('click', () => {
      state.quizIndex = (state.quizIndex + 1) % ARTIFACT_CATALOG.length;
      state.quizSelected = null;
      render();
    });

    root.querySelectorAll('[data-ivus-quiz-ans]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.quizSelected = btn.dataset.ivusQuizAns;
        render();
      });
    });

    root.querySelectorAll('[data-ivus-art-fix]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.ivusArtFix;
        state.artifactFixedMap[id] = !state.artifactFixedMap[id];
        render();
      });
    });

    // Calculator inputs
    root.querySelectorAll('[data-ivus-calc-input]').forEach(inp => {
      inp.addEventListener('input', () => {
        const cardId = inp.dataset.ivusCalcCardId;
        const key = inp.dataset.ivusCalcInput;
        state.calcValues[cardId][key] = Number(inp.value);
        const res = evaluateIvusCalculator(cardId, state.calcValues[cardId], getLang());
        const outEl = root.querySelector(`[data-ivus-calc-results="${cardId}"]`);
        if (outEl) {
          outEl.innerHTML = res.rows.map(r => `
            <div class="ivus-calc-row">
              <span>${r.label}</span>
              <strong class="${r.status}">${r.value}</strong>
            </div>
          `).join('');
        }
      });
    });
  }

  function render() {
    const lang = getLang();
    const isTr = lang === 'tr';

    let bodyHtml = '';
    modelWorkspace?.dispose();
    modelWorkspace = null;
    if (state.workspaceMode === 'model') bodyHtml = modelWorkspaceHtml(state, lang);
    else if (state.workspaceMode === 'console') bodyHtml = renderConsoleWorkspace(lang);
    else if (state.workspaceMode === 'morphology') bodyHtml = renderMorphologyWorkspace(lang);
    else if (state.workspaceMode === 'artifacts') bodyHtml = renderArtifactsWorkspace(lang);
    else if (state.workspaceMode === 'calculator') bodyHtml = renderCalculatorWorkspace(lang);

    root.innerHTML = `
      <section class="ivus-hero">
        <div class="ivus-hero-title">
          <span class="ivus-kicker">🔬 ${isTr ? 'İNTRAVASKÜLER ULTRASON · KORONER GÖRÜNTÜLEME & PCI REHBERİ' : 'INTRAVASCULAR ULTRASOUND · CORONARY IMAGING & PCI GUIDANCE'}</span>
          <h1>${isTr ? 'Koroner IVUS ve Stent Optimizasyon Laboratuvarı' : 'Coronary IVUS and Stent Optimization Laboratory'}</h1>
        </div>
        <div class="ivus-mode-seg" role="group" aria-label="${isTr ? 'IVUS Çalışma Modu' : 'IVUS Workspace Mode'}">
          ${ALL_MODES.map(m => `
            <button
              type="button"
              class="ivus-mode-btn ${m.id === state.workspaceMode ? 'active' : ''}"
              data-ivus-mode="${m.id}"
              aria-pressed="${m.id === state.workspaceMode}"
            >
              ${pick(m.label, lang)}
            </button>
          `).join('')}
        </div>
      </section>

      ${bodyHtml}
    `;

    bindEvents();
    drawAllCanvases();
    if (state.workspaceMode === 'model') {
      modelWorkspace = mountModelWorkspace(root, state, { getLang, rerender: render });
    }
  }

  function animLoop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;

    if (state.workspaceMode === 'console' && !state.salineFlush) {
      state.phaseOffset = (state.phaseOffset + dt * 0.9) % 1;
      const cCanvas = root.querySelector('[data-ivus-cross-canvas]');
      if (cCanvas) {
        const caseObj = findIvusCase(state.caseId);
        const slice = sampleIvusSlice(caseObj, state.posMm, state);
        renderIvusCrossSectionCanvas(cCanvas, slice, caseObj, state, getLang());
      }
    }

    rafId = requestAnimationFrame(animLoop);
  }

  render();
  rafId = requestAnimationFrame(animLoop);

  return {
    render,
    getState: () => ({ ...state }),
    selectCase,
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (pullbackTimer) clearInterval(pullbackTimer);
      modelWorkspace?.dispose();
      root.remove();
    }
  };
}
