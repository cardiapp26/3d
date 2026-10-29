// Coronary Physiology Lab · Interactive Cath-Lab Workstation Panel
// Combines the 4 invasive physiology modalities, hemodynamic simulator, artifact QA, and calculators.

import {
  WORKSPACE_MODES,
  PHYSIOLOGY_MODALITIES,
  CORONARY_TERRITORIES,
  HYPEREMIC_AGENTS,
  CLINICAL_CASES,
  ARTIFACT_CATALOG,
  CALCULATOR_CARDS,
  REFERENCES
} from './coronary-physiology-data.js';

import {
  clamp,
  findClinicalCase,
  computePullbackAnalysis,
  computeConsoleReadout,
  computeBolusThermodilution,
  computeContinuousThermodilution,
  computeDopplerAssessment,
  simulateHemodynamicCircuit,
  evaluateCalculatorCard
} from './coronary-physiology-sim.js';

import { fluoroCardHtml, drawFluoro, bindFluoro } from './coronary-physiology-fluoro-view.js';

import {
  renderVesselCutawaySvg,
  renderPressureConsoleCanvas,
  renderModalityDetailCanvas,
  renderSimulatorCanvas,
  renderArtifactPreviewCanvas
} from './coronary-physiology-render.js';

const pick = (obj, lang) => (obj && typeof obj === 'object' ? (obj[lang === 'en' ? 'en' : 'tr'] ?? obj.tr ?? '') : String(obj ?? ''));

export function createCoronaryPhysiologyPanel({ mount, getLang = () => 'tr' }) {
  const initialCalcValues = {};
  for (const card of CALCULATOR_CARDS) {
    initialCalcValues[card.id] = {};
    for (const inp of card.inputs) {
      initialCalcValues[card.id][inp.key] = inp.defaultVal;
    }
  }

  const state = {
    workspaceMode: 'lab',         // 'lab' | 'simulator' | 'pitfalls' | 'calculator'
    modality: 'epicardial',       // 'epicardial' | 'bolus' | 'continuous' | 'doppler'
    caseId: 'focal-lad',
    vessel: 'LAD',
    device: 'wire',               // 'wire' | 'mc'
    agent: 'iv-adenosine',
    sensorMm: 75,
    fluoroView: 'cine',           // 'cine' | 'fluoro' | 'map' (angiographic card)
    fluoroProj: 0,                // index into the vessel's standard projections
    hyperemia: true,
    frozen: false,
    flushed: true,
    connectionsChecked: true,
    ntgGiven: true,
    guideDisengaged: false,
    equalized: true,
    advancedDistal: true,
    pullingBack: false,
    pullbackDone: true,
    showLesionLabels: true,
    artifactFixed: false,
    stentedIds: [],
    underexpanded: false,
    // Bolus thermodilution state
    tempZeroed: true,
    bolusRestCount: 3,
    bolusHypCount: 3,
    // Continuous thermodilution state
    contProto: '1-run',
    mcPositioned: true,
    infusionRate: 20,
    infusing: true,
    // Doppler state
    dopplerOptimized: true,
    achMcPositioned: true,
    achStep: 0,                   // 0 = baseline/hyperemia, 1 = low, 2 = mid, 3 = high
    // Animation state
    phaseOffset: 0,
    // Simulator state
    simStateMode: 'hyp',          // 'rest' | 'hyp'
    simParams: {
      mapMmHg: 96,
      heartRate: 68,
      stenosisPct: 72,
      diffusePct: 6,
      rmuHypWu: 310,
      lvedpMmHg: 8
    },
    // Pitfalls state
    pitfallFixedMap: { drift: false, vent: false, damp: false, whip: false, leak: false },
    spotIndex: 0,
    spotSelected: null,
    // Calculator state
    calcValues: initialCalcValues
  };

  const root = document.createElement('div');
  root.className = 'phys-lab';
  mount.appendChild(root);

  let rafId = null;
  let pullbackTimer = null;
  let lastTs = 0;

  function casesForModality(modId) {
    const list = CLINICAL_CASES.filter(c => c.modalities.includes(modId));
    return list.length ? list : CLINICAL_CASES;
  }

  function applyCaseDefaults(caseObj) {
    state.vessel = caseObj.vessel || 'LAD';
    state.sensorMm = 75;
    state.stentedIds = [];
    state.underexpanded = false;
    state.artifactFixed = false;
    state.pullingBack = false;
    state.pullbackDone = true;
    state.hyperemia = state.modality !== 'doppler';
    state.achStep = state.modality === 'doppler' && caseObj.id.startsWith('doppler-') ? 3 : 0;
    state.ntgGiven = true;
    state.equalized = true;
    state.flushed = caseObj.artifact !== 'damp';
    state.connectionsChecked = caseObj.artifact !== 'leak';
    state.guideDisengaged = caseObj.artifact !== 'vent';
  }

  function setModality(modId) {
    if (!PHYSIOLOGY_MODALITIES.some(m => m.id === modId)) return;
    state.modality = modId;
    const validCases = casesForModality(modId);
    if (!validCases.some(c => c.id === state.caseId)) {
      state.caseId = validCases[0].id;
    }
    applyCaseDefaults(findClinicalCase(state.caseId));
    render();
  }

  function selectCase(caseId) {
    const found = findClinicalCase(caseId);
    state.caseId = found.id;
    applyCaseDefaults(found);
    render();
  }

  function startAnimatedPullback() {
    if (pullbackTimer) clearInterval(pullbackTimer);
    state.sensorMm = 75;
    state.hyperemia = true;
    state.pullingBack = true;
    state.pullbackDone = false;
    render();

    pullbackTimer = setInterval(() => {
      state.sensorMm = Math.max(0, state.sensorMm - 5);
      if (state.sensorMm <= 0) {
        clearInterval(pullbackTimer);
        pullbackTimer = null;
        state.pullingBack = false;
        state.pullbackDone = true;
      }
      syncDynamicLabReadouts();
    }, 60);
  }

  function buildProcedureSteps(caseObj, lang) {
    const isTr = lang === 'tr';
    if (state.modality === 'epicardial') {
      return [
        {
          done: state.flushed && state.connectionsChecked,
          text: isTr
            ? 'Kılavuz kateteri salin ile yıkayın (Flush) ve Y-konnektör bağlantılarını kontrol edin.'
            : 'Flush the guide catheter with saline and check Y-connector connections.'
        },
        {
          done: state.ntgGiven,
          text: isTr
            ? 'Epikardiyal tonusu standartlaştırmak için İK Nitrogliserin (100–200 µg) uygulayın.'
            : 'Administer IC Nitroglycerin (100–200 µg) to abolish epicardial vasomotor tone.'
        },
        {
          done: state.equalized,
          text: isTr
            ? 'Sensörü kılavuz kateter ucunun hemen önünde (0–2 mm) Equalize (Pd/Pa = 1.00) edin.'
            : 'Equalize pressure sensor just beyond the guide catheter tip (Pd/Pa = 1.00).'
        },
        {
          done: state.advancedDistal,
          text: isTr
            ? 'Basınç telini hedef damarın distal segmentine (≥2.0 mm kalibre, ~75 mm) ilerletin.'
            : 'Advance pressure wire to the distal third of the target vessel (~75 mm).'
        },
        {
          done: state.hyperemia,
          text: isTr
            ? 'IV Adenozin infüzyonu ile kararlı maksimal hiperemi sağlayın ve en düşük Pd/Pa (FFR) değerini kaydedin.'
            : 'Induce steady maximal hyperemia with IV Adenosine and record lowest stable Pd/Pa (FFR).'
        },
        {
          done: state.pullbackDone,
          text: isTr
            ? 'Hiperemi altında geri çekme (Pull back) yaparak PPG paternini ve kateter ucunda drift kontrolünü (1.00 ± 0.02) tamamlayın.'
            : 'Perform hyperemic pullback to map PPG pattern and verify guide-tip drift (1.00 ± 0.02).'
        }
      ];
    }

    if (state.modality === 'bolus') {
      return [
        {
          done: state.equalized && state.advancedDistal,
          text: isTr
            ? 'İK Nitrogliserin sonrası teli Equalize edin ve damarın distal 2/3 segmentine park edin.'
            : 'After IC Nitroglycerin, equalize and park the sensor in the distal two-thirds of the vessel.'
        },
        {
          done: state.tempZeroed,
          text: isTr
            ? 'Sıcaklık sensörünü sıfırlayın (Zero temperature) ve kateteri salin ile yıkayın.'
            : 'Zero the thermistor temperature sensor and flush the guide catheter.'
        },
        {
          done: state.bolusRestCount >= 3,
          text: isTr
            ? 'İstirahatte 3 kez hızlı 3 mL oda sıcaklığında salin enjekte ederek ortalama Tmn_rest ölçün.'
            : 'Perform 3 brisk 3 mL room-temperature saline injections at rest to measure mean Tmn_rest.'
        },
        {
          done: state.hyperemia && state.bolusHypCount >= 3,
          text: isTr
            ? 'Kararlı hiperemi altında 3 kez daha 3 mL salin enjekte ederek Tmn_hyp, CFR, IMR ve MRR hesaplayın.'
            : 'Under steady hyperemia, perform 3 additional 3 mL saline injections to compute Tmn_hyp, CFR, IMR, and MRR.'
        }
      ];
    }

    if (state.modality === 'continuous') {
      return [
        {
          done: state.equalized && state.advancedDistal,
          text: isTr
            ? 'Basınç/sıcaklık telini Equalize edin ve damarın distaline (~75 mm) ilerletin.'
            : 'Equalize the pressure/temperature wire and advance to the distal vessel (~75 mm).'
        },
        {
          done: state.mcPositioned && state.tempZeroed,
          text: isTr
            ? 'Yan delikli infüzyon mikrokateterini proksimal segmente yerleştirin ve sıcaklığı sıfırlayın (Zero T°).'
            : 'Position the side-hole infusion microcatheter in the proximal vessel and zero temperature (Zero T°).'
        },
        {
          done: state.infusing && state.sensorMm > 25,
          text: isTr
            ? 'Salin infüzyonunu (10 mL/dk istirahat ve 20 mL/dk hiperemi) başlatıp distal karışım sıcaklığını (T) kaydedin.'
            : 'Start saline infusion (10 mL/min rest and 20 mL/min hyperemia) and record distal mixture temperature (T).'
        },
        {
          done: state.infusing && state.sensorMm <= 20,
          text: isTr
            ? 'Sensörü mikrokateter ucuna geri çekerek (Sensor -> tip) infüzat çıkış sıcaklığını (Ti) ölçün ve Q ile Rμ hesaplayın.'
            : 'Pull sensor into the microcatheter tip (Sensor -> tip) to measure infusate temperature (Ti) and compute Q and Rμ.'
        }
      ];
    }

    return [
      {
        done: state.dopplerOptimized,
        text: isTr
          ? 'Doppler telini proksimal-orta segmente yerleştirip spektral zarf sinyalini optimize edin ve bazal APV kaydedin.'
          : 'Position Doppler wire in the proximal-mid vessel, optimize spectral envelope, and record resting APV.'
      },
      {
        done: state.hyperemia,
        text: isTr
          ? 'İK Adenozin ile zirve hiperemik APV ölçerek endotelden bağımsız CFR, HMR ve HSR hesaplayın.'
          : 'Administer IC Adenosine to measure peak APV and compute endothelium-independent CFR, HMR, and HSR.'
      },
      {
        done: state.achStep >= 3,
        text: isTr
          ? 'İnfüzyon kateterinden kademeli Asetilkolin (ACh Low → Mid → High) uygulayarak ΔCBF, damar çapı ve EKG yanıtını izleyin.'
          : 'Infuse graded Acetylcholine (ACh Low → Mid → High) and monitor ΔCBF, QCA diameter, and ECG.'
      },
      {
        done: state.ntgGiven,
        text: isTr
          ? 'Test sonunda (veya spazm geliştiğinde derhal) İK Nitrogliserin vererek vazospazmı çözün.'
          : 'Administer IC Nitroglycerin at test completion (or immediately if spasm occurs) to reverse constriction.'
      }
    ];
  }

  function renderLabWorkspace(lang) {
    const isTr = lang === 'tr';
    const caseObj = findClinicalCase(state.caseId);
    const validCases = casesForModality(state.modality);
    const consoleReadout = computeConsoleReadout(caseObj, state);
    const pbAnalysis = computePullbackAnalysis(caseObj, {
      stentedIds: state.stentedIds,
      underexpanded: state.underexpanded,
      microcatheter: state.device === 'mc'
    });
    const bolusData = computeBolusThermodilution(caseObj, {
      territory: state.vessel,
      stentedIds: state.stentedIds,
      underexpanded: state.underexpanded
    });
    const contData = computeContinuousThermodilution(caseObj, {
      territory: state.vessel,
      qiRest: 10,
      qiHyp: 20,
      stentedIds: state.stentedIds,
      underexpanded: state.underexpanded
    });
    const dopData = computeDopplerAssessment(caseObj, state);
    const steps = buildProcedureSteps(caseObj, lang);

    const activeModObj = PHYSIOLOGY_MODALITIES.find(m => m.id === state.modality) || PHYSIOLOGY_MODALITIES[0];
    const hasArtifact = caseObj.artifact && caseObj.artifact !== 'none' && !state.artifactFixed;

    let secondarySectionHtml = '';
    if (state.modality === 'epicardial') {
      const patternLabel = pbAnalysis.pattern === 'focal'
        ? (isTr ? 'Fokal Paterni (PPG ≥0.62)' : 'Focal Pattern (PPG ≥0.62)')
        : pbAnalysis.pattern === 'serial'
          ? (isTr ? 'Seri / Ardışık Lezyonlar' : 'Serial / Tandem Lesions')
          : pbAnalysis.pattern === 'diffuse'
            ? (isTr ? 'Diffüz Patern (PPG <0.62)' : 'Diffuse Pattern (PPG <0.62)')
            : (isTr ? 'Normal / İskemi Yok (FFR >0.80)' : 'Normal / Non-Ischemic (FFR >0.80)');
      const patternClass = pbAnalysis.pattern === 'focal' ? 'ok' : pbAnalysis.pattern === 'normal' ? 'ok' : 'warn';

      secondarySectionHtml = `
        <div class="phys-subcard" data-phys-pullback-card>
          <div class="phys-subcard-head">
            <div>
              <h3>${isTr ? 'Geri Çekme (Pullback) Analizi · PPG & Sanal PCI' : 'Pullback Analysis · PPG & Virtual PCI'}</h3>
              <p>${isTr ? 'Collet PPG indeksi darlığın fokal (≥0.62) veya diffüz (<0.62) doğasını nicelleştirir.' : 'Collet PPG index quantifies whether pressure loss is predominantly focal (≥0.62) or diffuse (<0.62).'}</p>
            </div>
            <span class="phys-pill ${patternClass}" data-phys-pattern-badge>${patternLabel}</span>
          </div>

          <div class="phys-detail-grid">
            <div class="phys-canvas-box">
              <canvas class="phys-detail-canvas" data-phys-detail-canvas width="620" height="210"></canvas>
            </div>
            <div class="phys-metrics-col">
              <div class="phys-metric-tiles">
                <div class="phys-tile">
                  <span class="phys-tile-k">${isTr ? 'Distal FFR' : 'Distal FFR'}</span>
                  <strong class="phys-tile-v ${pbAnalysis.ffrDistal <= 0.80 ? 'bad' : 'ok'}" data-pb-ffr>${pbAnalysis.ffrDistal.toFixed(2)}</strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">${isTr ? 'Toplam ΔFFR' : 'Total ΔFFR'}</span>
                  <strong class="phys-tile-v" data-pb-delta>${pbAnalysis.totalDelta.toFixed(2)}</strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">${isTr ? 'Maks ΔFFR (20 mm)' : 'Max ΔFFR (20 mm)'}</span>
                  <strong class="phys-tile-v" data-pb-max20>${pbAnalysis.maxDelta20.toFixed(2)}</strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">${isTr ? 'Fonksiyonel Uzunluk' : 'Functional Length'}</span>
                  <strong class="phys-tile-v" data-pb-len>${pbAnalysis.functionalLengthMm} mm</strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">PPG (Collet)</span>
                  <strong class="phys-tile-v ${pbAnalysis.ppg >= 0.62 ? 'ok' : 'warn'}" data-pb-ppg>${pbAnalysis.ppg.toFixed(2)}</strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">${isTr ? 'Trans-Stent (TSG)' : 'Trans-Stent (TSG)'}</span>
                  <strong class="phys-tile-v ${pbAnalysis.tsg >= 0.04 ? 'bad' : 'ok'}" data-pb-tsg>${pbAnalysis.tsg.toFixed(2)}</strong>
                </div>
              </div>

              <div class="phys-ppg-bar-wrap">
                <div class="phys-ppg-bar">
                  <span class="phys-ppg-cut" style="left:62%"><em>0.62</em></span>
                  <span class="phys-ppg-dot" style="left:${Math.round(pbAnalysis.ppg * 100)}%"></span>
                </div>
                <div class="phys-ppg-scale-labels">
                  <span>0.0 · ${isTr ? 'Diffüz' : 'Diffuse'}</span>
                  <span>1.0 · ${isTr ? 'Fokal' : 'Focal'}</span>
                </div>
              </div>

              ${caseObj.lesions.length > 0 ? `
                <div class="phys-vpci-box" data-phys-vpci>
                  <h4>${isTr ? 'Sanal PCI (Stent Simülasyonu & TARGET-FFR TSG)' : 'Virtual PCI (Stent Simulation & TARGET-FFR TSG)'}</h4>
                  <div class="phys-vpci-checks">
                    ${caseObj.lesions.map(l => `
                      <label class="phys-check-chip">
                        <input type="checkbox" data-phys-stent="${l.id}" ${state.stentedIds.includes(l.id) ? 'checked' : ''} />
                        <span>🩺 ${isTr ? 'Stentle:' : 'Stent:'} ${pick(l.label, lang)}</span>
                      </label>
                    `).join('')}
                    <label class="phys-check-chip warn">
                      <input type="checkbox" data-phys-underexpanded ${state.underexpanded ? 'checked' : ''} />
                      <span>⚠️ ${isTr ? 'Yetersiz Stent Açılması (Underexpanded · TSG ≥0.05)' : 'Underexpanded Stent (TSG ≥0.05)'}</span>
                    </label>
                  </div>
                </div>
              ` : `
                <p class="phys-note-box">${isTr ? 'Bu senaryoda fokal darlık bulunmamaktadır; diffüz hastalıkta kısa segment stentleme FFR değerini anlamlı yükseltmez.' : 'No focal stenosis in this scenario; in diffuse disease, focal stenting does not meaningfully restore FFR.'}</p>
              `}
            </div>
          </div>
        </div>
      `;
    } else if (state.modality === 'bolus') {
      secondarySectionHtml = `
        <div class="phys-subcard" data-phys-bolus-card>
          <div class="phys-subcard-head">
            <div>
              <h3>${isTr ? 'Bolus Termodilüsyon · Tmn · CFR · IMR · MRR' : 'Bolus Thermodilution · Tmn · CFR · IMR · MRR'}</h3>
              <p>${isTr ? '3 mL oda sıcaklığında salin enjeksiyonlarıyla ortalama geçiş süresi (Tmn) ve mikrodolaşım direnci (IMR) analizi.' : 'Mean transit time (Tmn) and index of microcirculatory resistance (IMR) from 3 mL room-temperature saline boluses.'}</p>
            </div>
            <span class="phys-pill ${bolusData.imr >= 25 || bolusData.cfr < 2.5 ? 'bad' : 'ok'}">
              ${bolusData.classification === 'structural-cmd'
                ? (isTr ? 'Yapısal CMD (CFR <2.5 · IMR ≥25)' : 'Structural CMD (CFR <2.5 · IMR ≥25)')
                : bolusData.classification === 'functional-cmd'
                  ? (isTr ? 'Fonksiyonel CMD (CFR <2.5 · IMR <25)' : 'Functional CMD (CFR <2.5 · IMR <25)')
                  : (isTr ? 'Normal Mikrodolaşım (CFR ≥2.5 · IMR <25)' : 'Normal Microcirculation (CFR ≥2.5 · IMR <25)')}
            </span>
          </div>

          <div class="phys-tmn-strip">
            <div class="phys-tmn-group">
              <span class="phys-tmn-tag rest">${isTr ? 'İstirahat Tmn (s)' : 'Rest Tmn (s)'}: <strong>${bolusData.tmnRest.toFixed(2)} s</strong></span>
              ${bolusData.restTrials.map((v, i) => `<span class="phys-tmn-chip">#${i + 1}: ${v.toFixed(2)}s</span>`).join('')}
            </div>
            <div class="phys-tmn-group">
              <span class="phys-tmn-tag hyp">${isTr ? 'Hiperemi Tmn (s)' : 'Hyperemic Tmn (s)'}: <strong>${bolusData.tmnHyp.toFixed(2)} s</strong></span>
              ${bolusData.hypTrials.map((v, i) => `<span class="phys-tmn-chip">#${i + 1}: ${v.toFixed(2)}s</span>`).join('')}
            </div>
          </div>

          <div class="phys-detail-grid">
            <div class="phys-canvas-box">
              <canvas class="phys-detail-canvas" data-phys-detail-canvas width="620" height="210"></canvas>
            </div>
            <div class="phys-metrics-col">
              <div class="phys-metric-tiles">
                <div class="phys-tile">
                  <span class="phys-tile-k">CFR (Bolus)</span>
                  <strong class="phys-tile-v ${bolusData.cfr < 2.5 ? 'bad' : 'ok'}" data-bolus-cfr>${bolusData.cfr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">${isTr ? 'Normal ≥2.5' : 'Normal ≥2.5'}</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">IMR</span>
                  <strong class="phys-tile-v ${bolusData.imr >= 25 ? 'bad' : 'ok'}" data-bolus-imr>${bolusData.imr.toFixed(1)}</strong>
                  <small class="phys-tile-ref">${isTr ? 'Anormal ≥25' : 'Abnormal ≥25'}</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">IMR (Yong corr)</span>
                  <strong class="phys-tile-v ${bolusData.imrCorr >= 25 ? 'bad' : 'ok'}" data-bolus-imrc>${bolusData.imrCorr.toFixed(1)}</strong>
                  <small class="phys-tile-ref">${isTr ? 'FFR ≤0.80 düzeltmeli' : 'Collateral corrected'}</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">MRR</span>
                  <strong class="phys-tile-v ${bolusData.mrr < 2.3 ? 'bad' : bolusData.mrr < 3.0 ? 'warn' : 'ok'}" data-bolus-mrr>${bolusData.mrr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">${isTr ? 'Normal ≥3.0' : 'Normal ≥3.0'}</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">RRR</span>
                  <strong class="phys-tile-v">${bolusData.rrr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">R_rest / R_hyp</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">FFR</span>
                  <strong class="phys-tile-v ${bolusData.ffr <= 0.80 ? 'bad' : 'ok'}">${bolusData.ffr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">Pd ${bolusData.pdHyp} / Pa ${bolusData.paHyp}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.modality === 'continuous') {
      const currentTemp = state.sensorMm <= 20
        ? (state.infusionRate > 12 ? contData.tiHyp : contData.tiRest)
        : (state.infusionRate > 12 ? contData.tHyp : contData.tRest);
      const currentQ = state.infusionRate > 12 ? contData.qHyp : contData.qRest;
      const currentRmu = state.infusionRate > 12 ? contData.rmuHyp : contData.rmuRest;

      secondarySectionHtml = `
        <div class="phys-subcard" data-phys-cont-card>
          <div class="phys-subcard-head">
            <div>
              <h3>${isTr ? 'Sürekli Termodilüsyon · Mutlak Akım (Q) ve Direnç (Rμ)' : 'Continuous Thermodilution · Absolute Flow (Q) & Resistance (Rμ)'}</h3>
              <p>${isTr ? 'Q = 1.08 × (Ti / T) × Qi denklemiyle hacimsel koroner kan akımı (mL/dk) ve mikrovasküler direnç (Wood Ünitesi, WU).' : 'Volumetric coronary blood flow (mL/min) and microvascular resistance (Wood Units, WU) via Q = 1.08 × (Ti / T) × Qi.'}</p>
            </div>
            <span class="phys-pill ${contData.rmuHyp > 470 || contData.mrr < 2.3 ? 'bad' : 'ok'}">
              ${state.sensorMm <= 20 ? (isTr ? 'Sensör: Kateter Ucu (Ti)' : 'Sensor: Catheter Tip (Ti)') : (isTr ? 'Sensör: Distal Damar (T)' : 'Sensor: Distal Vessel (T)')}
            </span>
          </div>

          <div class="phys-cont-livebar">
            <div><span>${isTr ? 'İnfüzyon Hızı (Qi)' : 'Infusion Rate (Qi)'}</span><strong data-cont-rate>${state.infusing ? `${state.infusionRate} mL/min` : 'OFF'}</strong></div>
            <div><span>${isTr ? 'Sensör Sıcaklığı' : 'Sensor Temperature'}</span><strong data-cont-temp>${currentTemp.toFixed(2)} °C (${state.sensorMm <= 20 ? 'Ti' : 'T'})</strong></div>
            <div><span>${isTr ? 'Anlık Q · Rμ' : 'Active Q · Rμ'}</span><strong data-cont-live-qr>${currentQ} mL/min · ${currentRmu} WU</strong></div>
          </div>

          <div class="phys-detail-grid">
            <div class="phys-canvas-box">
              <canvas class="phys-detail-canvas" data-phys-detail-canvas width="620" height="210"></canvas>
            </div>
            <div class="phys-metrics-col">
              <div class="phys-metric-tiles">
                <div class="phys-tile">
                  <span class="phys-tile-k">Q rest (10 mL/min)</span>
                  <strong class="phys-tile-v" data-cont-qrest>${contData.qRest} <small>mL/min</small></strong>
                  <small class="phys-tile-ref">LAD 50–100</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">Q hyp (20 mL/min)</span>
                  <strong class="phys-tile-v ${contData.qHyp < 170 ? 'bad' : 'ok'}" data-cont-qhyp>${contData.qHyp} <small>mL/min</small></strong>
                  <small class="phys-tile-ref">LAD 175–350</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">Rμ rest</span>
                  <strong class="phys-tile-v" data-cont-rmurest>${contData.rmuRest} <small>WU</small></strong>
                  <small class="phys-tile-ref">1200–1800 WU</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">Rμ hyp</span>
                  <strong class="phys-tile-v ${contData.rmuHyp > 470 ? 'bad' : 'ok'}" data-cont-rmuhyp>${contData.rmuHyp} <small>WU</small></strong>
                  <small class="phys-tile-ref">200–470 WU</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">CFR (Cont)</span>
                  <strong class="phys-tile-v ${contData.cfrCont < 2.0 ? 'bad' : 'ok'}" data-cont-cfr>${contData.cfrCont.toFixed(2)}</strong>
                  <small class="phys-tile-ref">&lt;2.0 ${isTr ? 'anormal' : 'abnormal'}</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">MRR</span>
                  <strong class="phys-tile-v ${contData.mrr < 2.3 ? 'bad' : contData.mrr < 3.0 ? 'warn' : 'ok'}" data-cont-mrr>${contData.mrr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">&ge;3.0 normal</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.modality === 'doppler') {
      const endotypeBadge = dopData.achEndotype === 'epicardial-spasm'
        ? (isTr ? 'Epikardiyal Vazospazm (≥%90 Daralma + ST↑)' : 'Epicardial Vasospasm (≥90% Constriction + ST↑)')
        : dopData.achEndotype === 'microvascular-spasm'
          ? (isTr ? 'Mikrovasküler Spazm (Angina + ST↓)' : 'Microvascular Spasm (Angina + ST↓)')
          : dopData.achEndotype === 'endothelial-dysfunction'
            ? (isTr ? 'Endotel Disfonksiyonu (ΔCBF <%50)' : 'Endothelial Dysfunction (ΔCBF <50%)')
            : (isTr ? 'Normal Endotel ve Koroner Fonksiyon' : 'Normal Endothelial & Coronary Function');

      secondarySectionHtml = `
        <div class="phys-subcard" data-phys-doppler-card>
          <div class="phys-subcard-head">
            <div>
              <h3>${isTr ? 'Spektral Doppler (CFR / HMR) & Asetilkolin (ACh) Provokasyon Testi' : 'Spectral Doppler (CFR / HMR) & Acetylcholine (ACh) Provocation'}</h3>
              <p>${isTr ? 'Adenozin ile endotelden bağımsız CFR/HMR ve Asetilkolin (Low/Mid/High) ile endotele bağımlı CBF ve spazm yanıtı.' : 'Endothelium-independent CFR/HMR with Adenosine and endothelium-dependent CBF & vasospasm testing with Acetylcholine.'}</p>
            </div>
            <span class="phys-pill ${dopData.achEndotype === 'normal' ? 'ok' : 'bad'}" data-doppler-badge>${endotypeBadge}</span>
          </div>

          <div class="phys-detail-grid">
            <div class="phys-canvas-box">
              <canvas class="phys-detail-canvas" data-phys-detail-canvas width="620" height="210"></canvas>
            </div>
            <div class="phys-metrics-col">
              <div class="phys-metric-tiles">
                <div class="phys-tile">
                  <span class="phys-tile-k">APV rest</span>
                  <strong class="phys-tile-v" data-dop-apvr>${dopData.apvRest} <small>cm/s</small></strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">APV hyperemia</span>
                  <strong class="phys-tile-v" data-dop-apvh>${dopData.apvHyp} <small>cm/s</small></strong>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">CFR (Doppler)</span>
                  <strong class="phys-tile-v ${dopData.cfrDop < 2.5 ? 'bad' : 'ok'}" data-dop-cfr>${dopData.cfrDop.toFixed(1)}</strong>
                  <small class="phys-tile-ref">&ge;2.5 normal</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">HMR</span>
                  <strong class="phys-tile-v ${dopData.hmr >= 2.5 ? 'bad' : 'ok'}" data-dop-hmr>${dopData.hmr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">&lt;2.5 mmHg·s/cm</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">HSR</span>
                  <strong class="phys-tile-v ${dopData.hsr > 0.8 ? 'bad' : 'ok'}">${dopData.hsr.toFixed(2)}</strong>
                  <small class="phys-tile-ref">&le;0.80 normal</small>
                </div>
                <div class="phys-tile">
                  <span class="phys-tile-k">CBF rest (D=${dopData.diamRest}mm)</span>
                  <strong class="phys-tile-v">${dopData.cbfRest} <small>mL/min</small></strong>
                </div>
              </div>

              <table class="phys-ach-table" data-dop-ach-table>
                <thead>
                  <tr>
                    <th>${isTr ? 'ACh Dozu' : 'ACh Dose'}</th>
                    <th>${isTr ? 'Çap (mm)' : 'Diam (mm)'}</th>
                    <th>ΔCBF</th>
                    <th>${isTr ? 'Semptom / EKG' : 'Symptom / ECG'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${dopData.achSteps.map((s, idx) => `
                    <tr class="${state.achStep === idx + 1 ? 'is-active' : ''}">
                      <td><strong>ACh ${s.dose.toUpperCase()}</strong></td>
                      <td>${s.diamMm} mm (${s.diamDeltaPct >= 0 ? '+' : ''}${s.diamDeltaPct}%)</td>
                      <td class="${s.flowDeltaPct < 50 ? 'bad' : 'ok'}">${s.flowDeltaPct >= 0 ? '+' : ''}${s.flowDeltaPct}% (${s.cbfMlMin} mL/dk)</td>
                      <td>${s.angina ? `⚠️ Angina · ${s.ecg.toUpperCase()}` : '✓ Normal'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <!-- 4 MODALITY SELECTOR TABS -->
      <nav class="phys-modtabs" role="tablist" aria-label="${isTr ? 'Koroner Fizyoloji Ölçüm Modülleri' : 'Coronary Physiology Modalities'}">
        ${PHYSIOLOGY_MODALITIES.map(m => `
          <button type="button" class="phys-modtab ${m.id === state.modality ? 'active' : ''}" data-phys-modality="${m.id}" aria-pressed="${m.id === state.modality}">
            <strong>${pick(m.title, lang)}</strong>
            <span>${pick(m.subtitle, lang)}</span>
          </button>
        `).join('')}
      </nav>

      <p class="phys-mod-summary">${pick(activeModObj.summary, lang)}</p>

      <!-- MAIN CATH-LAB 2-COLUMN WORKSTATION -->
      <div class="phys-workstation-grid">
        <!-- LEFT: HEMODYNAMIC CONSOLE + SECONDARY ANALYSIS -->
        <div class="phys-console-col">
          ${fluoroCardHtml(state, lang)}
          <section class="phys-console-card" aria-label="${isTr ? 'Canlı Hemodinamik Konsol' : 'Live Hemodynamic Console'}">
            <div class="phys-status-banner ${hasArtifact ? 'is-warn' : ''}" data-phys-status>
              <span>
                ${hasArtifact
                  ? (isTr ? '⚠️ DİKKAT: Dalga formunda teknik artefakt mevcut! Kurulum veya kateter kontrollerini uygulayın.' : '⚠️ WARNING: Technical waveform artifact present! Apply setup or catheter corrections.')
                  : (state.pullingBack
                    ? (isTr ? `Geri çekme (Pullback) devam ediyor… Sensör: ${state.sensorMm} mm` : `Pulling back sensor… Position: ${state.sensorMm} mm`)
                    : (isTr ? `Durum: ${state.hyperemia ? 'Kararlı Maksimal Hiperemi' : 'Bazal İstirahat'} · Sensör ${state.sensorMm} mm · Pd/Pa ${consoleReadout.pdPa.toFixed(2)}` : `State: ${state.hyperemia ? 'Steady Maximal Hyperemia' : 'Baseline Rest'} · Sensor ${state.sensorMm} mm · Pd/Pa ${consoleReadout.pdPa.toFixed(2)}`))}
              </span>
              <span class="phys-cuff-tag">${isTr ? 'Manşon KB:' : 'Cuff BP:'} ${caseObj.cuff[0]}/${caseObj.cuff[1]} mmHg</span>
            </div>

            <!-- CONTROL BARS -->
            <div class="phys-bars">
              <!-- Bar 1: Case & Vessel -->
              <div class="phys-bar">
                <span class="phys-bar-label">${isTr ? 'SENARYO' : 'CASE'}</span>
                <select class="phys-select" data-phys-case aria-label="${isTr ? 'Klinik Olgu Seçimi' : 'Select Clinical Case'}">
                  ${validCases.map(c => `
                    <option value="${c.id}" ${c.id === state.caseId ? 'selected' : ''}>[${c.tag}] ${pick(c.name, lang)}</option>
                  `).join('')}
                </select>
                <select class="phys-select phys-select-sm" data-phys-vessel aria-label="${isTr ? 'Hedef Damar' : 'Target Vessel'}">
                  ${CORONARY_TERRITORIES.map(t => `
                    <option value="${t.id}" ${t.id === state.vessel ? 'selected' : ''}>${t.label}</option>
                  `).join('')}
                </select>
                <button type="button" class="phys-btn ${state.frozen ? 'active' : ''}" data-phys-freeze aria-pressed="${state.frozen}">
                  ${state.frozen ? (isTr ? '▶ Devam Et' : '▶ Resume') : (isTr ? '⏸ Dondur (Freeze)' : '⏸ Freeze')}
                </button>
                <button type="button" class="phys-btn" data-phys-reset>${isTr ? '↺ Sıfırla' : '↺ Reset'}</button>
              </div>

              <!-- Bar 2: Cath Lab Setup & Artifact Fixes -->
              <div class="phys-bar">
                <span class="phys-bar-label">${isTr ? 'KURULUM' : 'SETUP'}</span>
                <button type="button" class="phys-btn ${state.flushed ? 'is-done' : ''}" data-phys-action="flush">
                  💧 ${isTr ? 'Kateteri Yıka (Flush)' : 'Flush Guide'}
                </button>
                <button type="button" class="phys-btn ${state.connectionsChecked ? 'is-done' : ''}" data-phys-action="connections">
                  🔒 ${isTr ? 'Valf & Bağlantılar' : 'Check Connections'}
                </button>
                <button type="button" class="phys-btn ${state.ntgGiven ? 'is-done' : ''}" data-phys-action="ntg">
                  💊 ${isTr ? 'İK Nitrogliserin' : 'IC Nitroglycerin'}
                </button>
                <button type="button" class="phys-btn ${state.guideDisengaged ? 'is-done' : ''}" data-phys-action="disengage">
                  ↩ ${isTr ? 'Kateteri Geri Çek' : 'Disengage Guide'}
                </button>
              </div>

              <!-- Bar 3: Wire & Pullback -->
              <div class="phys-bar">
                <span class="phys-bar-label">${isTr ? 'BASINÇ TELİ' : 'WIRE'}</span>
                <select class="phys-select phys-select-sm" data-phys-device aria-label="${isTr ? 'Ölçüm Cihazı' : 'Pressure Device'}">
                  <option value="wire" ${state.device === 'wire' ? 'selected' : ''}>${isTr ? 'Basınç Teli (0.014")' : 'Pressure Wire (0.014")'}</option>
                  <option value="mc" ${state.device === 'mc' ? 'selected' : ''}>${isTr ? 'Basınç Mikrokateteri' : 'Pressure Microcatheter'}</option>
                </select>
                <button type="button" class="phys-btn ${state.equalized ? 'is-done' : ''}" data-phys-action="equalize">
                  ⚖️ Equalize
                </button>
                <button type="button" class="phys-btn" data-phys-action="advance">
                  ⏩ ${isTr ? 'Distale İlerlet (75mm)' : 'Advance Distal'}
                </button>
                <button type="button" class="phys-btn" data-phys-action="step-back">-2 mm</button>
                <button type="button" class="phys-btn" data-phys-action="step-fwd">+2 mm</button>
                <input type="range" class="phys-sensor-slider" min="0" max="80" step="1" value="${state.sensorMm}" data-phys-sensor aria-label="${isTr ? 'Sensör Konumu (mm)' : 'Sensor Position (mm)'}" />
                <button type="button" class="phys-btn primary" data-phys-action="pullback">
                  ⬅ ${isTr ? 'Pull back (Geri Çek)' : 'Pull back'}
                </button>
              </div>

              <!-- Bar 4: Modality-Specific Controls -->
              ${state.modality === 'epicardial' || state.modality === 'bolus' ? `
                <div class="phys-bar">
                  <span class="phys-bar-label">${isTr ? 'HİPEREMİ' : 'HYPEREMIA'}</span>
                  <select class="phys-select" data-phys-agent aria-label="${isTr ? 'Hiperemik Ajan' : 'Hyperemic Agent'}">
                    ${HYPEREMIC_AGENTS.map(a => `<option value="${a.id}" ${a.id === state.agent ? 'selected' : ''}>${pick(a.label, lang)}</option>`).join('')}
                  </select>
                  <button type="button" class="phys-btn ${state.hyperemia ? 'primary' : ''}" data-phys-action="hyperemia" aria-pressed="${state.hyperemia}">
                    ${state.hyperemia ? (isTr ? '⏹ İnfüzyonu Durdur (İstirahat)' : '⏹ Stop Infusion (Rest)') : (isTr ? '💉 Hiperemi Başlat' : '💉 Start Hyperemia')}
                  </button>
                  ${state.modality === 'bolus' ? `
                    <button type="button" class="phys-btn ${state.tempZeroed ? 'is-done' : ''}" data-phys-action="zero-temp">🌡️ Zero T°</button>
                    <button type="button" class="phys-btn primary" data-phys-action="inject-bolus">💉 ${isTr ? '3 mL Salin Enjekte Et' : 'Inject 3 mL Saline'}</button>
                  ` : ''}
                </div>
              ` : ''}

              ${state.modality === 'continuous' ? `
                <div class="phys-bar">
                  <span class="phys-bar-label">${isTr ? 'İNFÜZYON' : 'INFUSION'}</span>
                  <button type="button" class="phys-btn ${state.mcPositioned ? 'is-done' : ''}" data-phys-action="position-mc">
                    🩺 ${isTr ? 'Mikrokateter Konumla' : 'Position Microcatheter'}
                  </button>
                  <button type="button" class="phys-btn ${state.tempZeroed ? 'is-done' : ''}" data-phys-action="zero-temp">🌡️ Zero T°</button>
                  <select class="phys-select phys-select-sm" data-phys-rate aria-label="${isTr ? 'Salin İnfüzyon Hızı' : 'Saline Infusion Rate'}">
                    <option value="10" ${state.infusionRate === 10 ? 'selected' : ''}>10 mL/min (${isTr ? 'İstirahat' : 'Rest'})</option>
                    <option value="20" ${state.infusionRate === 20 ? 'selected' : ''}>20 mL/min (${isTr ? 'Hiperemi' : 'Hyperemia'})</option>
                  </select>
                  <button type="button" class="phys-btn ${state.infusing ? 'primary' : ''}" data-phys-action="infuse">
                    ${state.infusing ? (isTr ? '⏹ İnfüzyonu Durdur' : '⏹ Stop Infusion') : (isTr ? '▶ İnfüzyonu Başlat' : '▶ Start Infusion')}
                  </button>
                  <button type="button" class="phys-btn" data-phys-action="sensor-tip">
                    ${state.sensorMm <= 20 ? (isTr ? '⏩ Sensör -> Distal (T)' : '⏩ Sensor -> Distal (T)') : (isTr ? '⬅ Sensör -> Kateter Ucu (Ti)' : '⬅ Sensor -> Tip (Ti)')}
                  </button>
                </div>
              ` : ''}

              ${state.modality === 'doppler' ? `
                <div class="phys-bar">
                  <span class="phys-bar-label">DOPPLER & ACh</span>
                  <button type="button" class="phys-btn ${state.dopplerOptimized ? 'is-done' : ''}" data-phys-action="optimize-doppler">
                    🔊 ${isTr ? 'Sinyali Optimize Et' : 'Optimize Signal'}
                  </button>
                  <button type="button" class="phys-btn ${state.hyperemia ? 'primary' : ''}" data-phys-action="hyperemia">
                    💉 ${isTr ? 'İK Adenozin (CFR/HMR)' : 'IC Adenosine (CFR/HMR)'}
                  </button>
                  <button type="button" class="phys-btn ${state.achStep === 1 ? 'primary' : ''}" data-phys-ach="1">ACh Low</button>
                  <button type="button" class="phys-btn ${state.achStep === 2 ? 'primary' : ''}" data-phys-ach="2">ACh Mid</button>
                  <button type="button" class="phys-btn ${state.achStep === 3 ? 'primary' : ''}" data-phys-ach="3">ACh High</button>
                  <button type="button" class="phys-btn" data-phys-action="reverse-spasm">
                    💊 ${isTr ? 'İK NTG (Spazmı Çöz)' : 'IC NTG (Reverse)'}
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- LIVE PRESSURE MONITOR CANVAS -->
            <div class="phys-monitor-wrap">
              <canvas class="phys-pressure-canvas" data-phys-pressure-canvas width="680" height="240"></canvas>
            </div>

            <!-- 6 READOUT TILES -->
            <div class="phys-readouts">
              <div class="phys-ro">
                <span class="phys-ro-k">Pa (${isTr ? 'Aort' : 'Aortic'})</span>
                <strong class="phys-ro-v pa" data-ro-pa>${consoleReadout.meanPa} <small>mmHg</small></strong>
              </div>
              <div class="phys-ro">
                <span class="phys-ro-k">Pd (${isTr ? 'Distal' : 'Distal'})</span>
                <strong class="phys-ro-v pd" data-ro-pd>${consoleReadout.meanPd} <small>mmHg</small></strong>
              </div>
              <div class="phys-ro">
                <span class="phys-ro-k">Pd/Pa (${isTr ? 'Anlık' : 'Live'})</span>
                <strong class="phys-ro-v ratio" data-ro-pdpa>${consoleReadout.pdPa.toFixed(2)}</strong>
              </div>
              <div class="phys-ro">
                <span class="phys-ro-k">FFR (${isTr ? 'Hiperemi' : 'Hyperemia'})</span>
                <strong class="phys-ro-v ${consoleReadout.ffr <= 0.80 ? 'bad' : 'ok'}" data-ro-ffr>${consoleReadout.ffr.toFixed(2)}</strong>
              </div>
              <div class="phys-ro">
                <span class="phys-ro-k">iFR / dNHPR</span>
                <strong class="phys-ro-v ${consoleReadout.ifr <= 0.89 ? 'bad' : 'ok'}" data-ro-ifr>${consoleReadout.ifr.toFixed(2)}</strong>
              </div>
              <div class="phys-ro">
                <span class="phys-ro-k">${isTr ? 'Sensör Konumu' : 'Sensor Position'}</span>
                <strong class="phys-ro-v" data-ro-sensor>${consoleReadout.sensorMm} <small>mm</small></strong>
              </div>
            </div>
          </section>

          <!-- SECONDARY MODALITY ANALYSIS CARD -->
          ${secondarySectionHtml}
        </div>

        <!-- RIGHT: OPEN-VESSEL CUTAWAY + PROCEDURE CHECKLIST + CASE BRIEF -->
        <aside class="phys-side-col">
          <section class="phys-vessel-card" aria-label="${isTr ? 'Damar Kesiti ve Sensör Haritası' : 'Vessel Cutaway and Sensor Map'}">
            <div class="phys-vessel-svg-mount" data-phys-vessel-mount>
              ${renderVesselCutawaySvg(caseObj, state, lang)}
            </div>
            <div class="phys-vessel-toolbar">
              <button type="button" class="phys-btn ${state.showLesionLabels ? 'active' : ''}" data-phys-toggle-labels aria-pressed="${state.showLesionLabels}">
                🏷️ ${isTr ? 'Plak Etiketleri' : 'Lesion Labels'}
              </button>
              <span class="phys-vessel-tip">${isTr ? 'Sensörü taşımak için damar üzerine tıklayın veya kaydırıcıyı kullanın.' : 'Click along the vessel or use the slider to move the sensor.'}</span>
            </div>
          </section>

          <section class="phys-proc-card" aria-label="${isTr ? 'Prosedür Kontrol Listesi' : 'Procedure Checklist'}">
            <h3>📋 ${isTr ? 'Kateter Laboratuvarı Prosedür Adımları' : 'Cath-Lab Procedure Checklist'}</h3>
            <ol class="phys-step-list" data-phys-steps>
              ${steps.map(s => `
                <li class="${s.done ? 'is-done' : 'is-pending'}">
                  <span class="phys-step-icon">${s.done ? '✓' : '○'}</span>
                  <span>${s.text}</span>
                </li>
              `).join('')}
            </ol>
          </section>

          <section class="phys-case-card" data-phys-case-card aria-label="${isTr ? 'Klinik Olgu Özeti ve Yorum' : 'Clinical Case Summary and Interpretation'}">
            <div class="phys-case-head">
              <span class="phys-case-tag">${caseObj.tag}</span>
              <h3>${pick(caseObj.name, lang)}</h3>
            </div>
            <p class="phys-case-brief">${pick(caseObj.brief, lang)}</p>
            <p class="phys-case-hint">💡 ${pick(caseObj.hint, lang)}</p>
            <div class="phys-case-takeaway">
              <strong>${isTr ? 'Klinik Çıkarım:' : 'Clinical Takeaway:'}</strong>
              <p>${pick(caseObj.takeaway, lang)}</p>
            </div>
          </section>
        </aside>
      </div>
    `;
  }

  function renderSimulatorWorkspace(lang) {
    const isTr = lang === 'tr';
    const simResult = simulateHemodynamicCircuit(state.simParams);

    const endotypeLabels = {
      normal: {
        cls: 'ok',
        title: isTr ? 'Normal Epikardiyal ve Mikrovasküler Fizyoloji' : 'Normal Epicardial & Microvascular Physiology',
        desc: isTr ? 'FFR >0.80, CFR ≥2.2, IMR <25 ve MRR ≥3.0. Akım sınırlayıcı epikardiyal darlık veya mikrovasküler disfonksiyon yok.' : 'FFR >0.80, CFR ≥2.2, IMR <25, and MRR ≥3.0. No flow-limiting epicardial stenosis or microvascular dysfunction.'
      },
      'epicardial-ischemia': {
        cls: 'bad',
        title: isTr ? 'Akım Sınırlayıcı Epikardiyal Darlık (FFR ≤0.80)' : 'Flow-Limiting Epicardial Stenosis (FFR ≤0.80)',
        desc: isTr ? 'İstirahatte otoregülasyon akımı korurken, hiperemide mikrovasküler yatak açıldığında darlık üzerinden belirgin basınç düşüşü (FFR ≤0.80) ortaya çıkar.' : 'Autoregulation preserves flow at rest, but hyperemic vasodilation unmasks a severe trans-stenotic pressure drop (FFR ≤0.80).'
      },
      'structural-cmd': {
        cls: 'bad',
        title: isTr ? 'Yapısal Mikrovasküler Disfonksiyon (Structural CMD · IMR ≥25 / Rμ >470)' : 'Structural Microvascular Dysfunction (Structural CMD · IMR ≥25 / Rμ >470)',
        desc: isTr ? 'Epikardiyal FFR normal (>0.80), ancak hiperemik minimal mikrovasküler direnç yüksek olduğu için maksimal akım ve CFR düşüktür.' : 'Epicardial FFR is normal (>0.80), but elevated minimal microvascular resistance blunts peak hyperemic flow and lowers CFR.'
      },
      'functional-cmd': {
        cls: 'warn',
        title: isTr ? 'Fonksiyonel Mikrovasküler Disfonksiyon (Functional CMD · Yüksek Bazal Akım)' : 'Functional Microvascular Dysfunction (Functional CMD · High Resting Flow)',
        desc: isTr ? 'Hiperemik direnç normal (IMR <25) olmasına karşın artmış istirahat akımı nedeniyle akım rezervi (CFR) azalmıştır.' : 'Hyperemic resistance is normal (IMR <25), but elevated resting blood flow exhausts coronary flow reserve (CFR).'
      },
      'mixed-epi-cmd': {
        cls: 'bad',
        title: isTr ? 'Kombine Epikardiyal Darlık + Mikrovasküler Disfonksiyon' : 'Combined Epicardial Stenosis + Microvascular Dysfunction',
        desc: isTr ? 'Hem FFR ≤0.80 hem de IMR ≥25. Yüksek mikrovasküler direnç maksimal akımı azalttığı için epikardiyal darlığın gerçek ciddiyetini kısmen maskeleyebilir.' : 'Both FFR ≤0.80 and IMR ≥25. Elevated microvascular resistance reduces hyperemic flow and partially blunts the epicardial gradient.'
      }
    };

    const endo = endotypeLabels[simResult.endotype] || endotypeLabels.normal;

    const sliders = [
      { key: 'mapMmHg', label: isTr ? 'Ortalama Aort Basıncı (Pa, mmHg)' : 'Mean Aortic Pressure (Pa, mmHg)', min: 60, max: 140, step: 2, val: state.simParams.mapMmHg, unit: 'mmHg' },
      { key: 'heartRate', label: isTr ? 'Kalp Hızı (atım/dk)' : 'Heart Rate (bpm)', min: 48, max: 120, step: 2, val: state.simParams.heartRate, unit: 'bpm' },
      { key: 'stenosisPct', label: isTr ? 'Fokal Epikardiyal Darlık (%)' : 'Focal Epicardial Stenosis (%)', min: 0, max: 90, step: 2, val: state.simParams.stenosisPct, unit: '%' },
      { key: 'diffusePct', label: isTr ? 'Diffüz Aterosklerotik Kayıp (%)' : 'Diffuse Atherosclerotic Loss (%)', min: 0, max: 40, step: 2, val: state.simParams.diffusePct, unit: '%' },
      { key: 'rmuHypWu', label: isTr ? 'Hiperemik Mikrovasküler Direnç (Rμ, WU)' : 'Hyperemic Microvascular Resistance (Rμ, WU)', min: 180, max: 850, step: 10, val: state.simParams.rmuHypWu, unit: 'WU' },
      { key: 'lvedpMmHg', label: isTr ? 'Sol Ventrikül Diyastol Sonu Basıncı (LVEDP)' : 'LV End-Diastolic Pressure (LVEDP)', min: 4, max: 28, step: 1, val: state.simParams.lvedpMmHg, unit: 'mmHg' }
    ];

    return `
      <section class="phys-sim-section" data-phys-simulator>
        <div class="phys-sim-top">
          <div>
            <h2>${isTr ? 'Nedensel Hemodinamik Simülatör · Otoregülasyon ve 4 Modül Karşılaştırması' : 'Causal Hemodynamic Simulator · Autoregulation & 4-Modality Readout'}</h2>
            <p>${isTr ? 'Kan basıncı, kalp hızı, fokal/diffüz darlık veya mikrovasküler direnci değiştirerek tüm koroner fizyoloji indekslerinin aynı anda nasıl yanıt verdiğini inceleyin.' : 'Adjust blood pressure, heart rate, focal/diffuse stenosis, or microvascular resistance and observe how all four invasive modalities respond together.'}</p>
          </div>
          <div class="phys-sim-presets">
            <button type="button" class="phys-btn" data-sim-preset="normal">${isTr ? 'Normal' : 'Normal'}</button>
            <button type="button" class="phys-btn" data-sim-preset="focal">${isTr ? 'Fokal Darlık (%76)' : 'Focal Stenosis (76%)'}</button>
            <button type="button" class="phys-btn" data-sim-preset="diffuse">${isTr ? 'Diffüz CAD' : 'Diffuse CAD'}</button>
            <button type="button" class="phys-btn" data-sim-preset="structural-cmd">Structural CMD</button>
            <button type="button" class="phys-btn" data-sim-preset="functional-cmd">Functional CMD</button>
          </div>
        </div>

        <div class="phys-sim-grid">
          <div class="phys-sim-sliders">
            ${sliders.map(s => `
              <label class="phys-slider-row">
                <div class="phys-slider-head">
                  <span>${s.label}</span>
                  <strong data-sim-val="${s.key}">${s.val} ${s.unit}</strong>
                </div>
                <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}" data-sim-slider="${s.key}" aria-label="${s.label}" />
              </label>
            `).join('')}
          </div>

          <div class="phys-sim-main">
            <canvas class="phys-sim-canvas" data-sim-canvas width="640" height="270"></canvas>

            <div class="phys-endo-banner ${endo.cls}" data-sim-endotype>
              <strong>${endo.title}</strong>
              <span>${endo.desc}</span>
            </div>

            <div class="phys-mod4-grid">
              <article class="phys-mod4-card">
                <h4>1 · ${isTr ? 'Epikardiyal (Basınç Teli)' : 'Epicardial (Pressure Wire)'}</h4>
                <div class="phys-mod4-vals">
                  <div><span>Pd/Pa (Rest)</span><strong>${simResult.restPdPa.toFixed(2)}</strong></div>
                  <div><span>iFR / NHPR</span><strong class="${simResult.ifr <= 0.89 ? 'bad' : 'ok'}">${simResult.ifr.toFixed(2)}</strong></div>
                  <div><span>FFR (Hyp)</span><strong class="${simResult.ffr <= 0.80 ? 'bad' : 'ok'}" data-sim-ffr>${simResult.ffr.toFixed(2)}</strong></div>
                </div>
              </article>

              <article class="phys-mod4-card">
                <h4>2 · ${isTr ? 'Bolus Termodilüsyon' : 'Bolus Thermodilution'}</h4>
                <div class="phys-mod4-vals">
                  <div><span>Tmn (R / H)</span><strong>${simResult.tmnRest.toFixed(2)} / ${simResult.tmnHyp.toFixed(2)}s</strong></div>
                  <div><span>CFR</span><strong class="${simResult.cfr < 2.2 ? 'bad' : 'ok'}" data-sim-cfr>${simResult.cfr.toFixed(2)}</strong></div>
                  <div><span>IMR</span><strong class="${simResult.imr >= 25 ? 'bad' : 'ok'}" data-sim-imr>${simResult.imr.toFixed(1)}</strong></div>
                </div>
              </article>

              <article class="phys-mod4-card">
                <h4>3 · ${isTr ? 'Sürekli Termodilüsyon' : 'Continuous Thermodilution'}</h4>
                <div class="phys-mod4-vals">
                  <div><span>Q (R / H)</span><strong>${simResult.qRest} / ${simResult.qHyp} mL/dk</strong></div>
                  <div><span>Rμ (Hyp)</span><strong class="${simResult.rmuHypWu > 470 ? 'bad' : 'ok'}">${simResult.rmuHypWu} WU</strong></div>
                  <div><span>MRR</span><strong class="${simResult.mrr < 2.3 ? 'bad' : 'ok'}" data-sim-mrr>${simResult.mrr.toFixed(2)}</strong></div>
                </div>
              </article>

              <article class="phys-mod4-card">
                <h4>4 · ${isTr ? 'Doppler Akım Hızı' : 'Doppler Flow Velocity'}</h4>
                <div class="phys-mod4-vals">
                  <div><span>APV (R / H)</span><strong>${simResult.apvRest} / ${simResult.apvHyp} cm/s</strong></div>
                  <div><span>CFR (Dop)</span><strong class="${simResult.cfr < 2.2 ? 'bad' : 'ok'}">${simResult.cfr.toFixed(2)}</strong></div>
                  <div><span>HMR</span><strong class="${simResult.hmr >= 2.5 ? 'bad' : 'ok'}">${simResult.hmr.toFixed(2)}</strong></div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPitfallsWorkspace(lang) {
    const isTr = lang === 'tr';
    const currentSpot = ARTIFACT_CATALOG[state.spotIndex % ARTIFACT_CATALOG.length];

    return `
      <section class="phys-pitfalls-section" data-phys-pitfalls>
        <div class="phys-spot-card">
          <div class="phys-spot-head">
            <div>
              <h3>🎯 ${isTr ? 'Artefaktı Tanı (Spot the Artifact Alıştırması)' : 'Spot the Artifact Interactive Quiz'}</h3>
              <p>${isTr ? 'Aşağıdaki canlı monitör kaydındaki dalga formu bozukluğunu inceleyin ve doğru artefaktı seçin.' : 'Inspect the live monitor tracing below and identify the pressure-waveform artifact.'}</p>
            </div>
            <button type="button" class="phys-btn primary" data-spot-next>↻ ${isTr ? 'Yeni Dalga Kaydı' : 'Next Tracing'}</button>
          </div>
          <canvas class="phys-spot-canvas" data-spot-canvas width="580" height="150"></canvas>
          <div class="phys-spot-options">
            ${ARTIFACT_CATALOG.map(a => {
              let cls = 'phys-btn';
              if (state.spotSelected) {
                if (a.id === currentSpot.id) cls += ' is-correct';
                else if (a.id === state.spotSelected) cls += ' is-wrong';
              }
              return `<button type="button" class="${cls}" data-spot-ans="${a.id}">${pick(a.name, lang)}</button>`;
            }).join('')}
          </div>
          ${state.spotSelected ? `
            <p class="phys-spot-feedback ${state.spotSelected === currentSpot.id ? 'ok' : 'bad'}" data-spot-feedback>
              <strong>${state.spotSelected === currentSpot.id ? (isTr ? '✓ Doğru!' : '✓ Correct!') : (isTr ? '✗ Yanlış seçim.' : '✗ Incorrect.')}</strong>
              ${pick(currentSpot.recognize, lang)} · <em>${pick(currentSpot.fix, lang)}</em>
            </p>
          ` : ''}
        </div>

        <div class="phys-pitfalls-grid">
          ${ARTIFACT_CATALOG.map(art => {
            const fixed = Boolean(state.pitfallFixedMap[art.id]);
            return `
              <article class="phys-pit-card" data-pit-card="${art.id}">
                <div class="phys-pit-top">
                  <h4>${pick(art.name, lang)}</h4>
                  <button type="button" class="phys-btn ${fixed ? 'primary' : ''}" data-pit-toggle="${art.id}">
                    ${fixed ? (isTr ? '✓ Düzeltme Sonrası' : '✓ After Fix') : (isTr ? '⚠ Artefakt Görünümü' : '⚠ Show Fix')}
                  </button>
                </div>
                <canvas class="phys-pit-canvas" data-pit-canvas="${art.id}" width="420" height="140"></canvas>
                <dl class="phys-pit-dl">
                  <dt>${isTr ? 'FFR Etkisi' : 'FFR Effect'}</dt>
                  <dd class="bad">${pick(art.effectOnFfr, lang)}</dd>
                  <dt>${isTr ? 'Neden Olur?' : 'Why It Happens'}</dt>
                  <dd>${pick(art.why, lang)}</dd>
                  <dt>${isTr ? 'Nasıl Tanınır?' : 'How to Recognize'}</dt>
                  <dd>${pick(art.recognize, lang)}</dd>
                  <dt>${isTr ? 'Çözüm' : 'How to Fix'}</dt>
                  <dd class="ok">${pick(art.fix, lang)}</dd>
                </dl>
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
      <section class="phys-calc-section" data-phys-calculator>
        <div class="phys-calc-grid">
          ${CALCULATOR_CARDS.map(card => {
            const vals = state.calcValues[card.id] || {};
            const res = evaluateCalculatorCard(card.id, vals);
            return `
              <article class="phys-calc-card" data-calc-card="${card.id}">
                <span class="phys-calc-cat">${pick(card.category, lang)}</span>
                <h3>${pick(card.title, lang)}</h3>
                <div class="phys-calc-eq">${card.formulaText}</div>
                <p class="phys-calc-norm">${pick(card.thresholds, lang)}</p>
                <div class="phys-calc-inputs">
                  ${card.inputs.map(inp => `
                    <label class="phys-calc-field">
                      <span>${pick(inp.label, lang)}</span>
                      <input type="number" step="${inp.step}" min="${inp.min}" max="${inp.max}" value="${vals[inp.key] ?? inp.defaultVal}" data-calc-card-id="${card.id}" data-calc-input="${inp.key}" />
                    </label>
                  `).join('')}
                </div>
                <div class="phys-calc-results" data-calc-results="${card.id}">
                  ${res.rows.map(r => `
                    <div class="phys-calc-row">
                      <span>${r.label}</span>
                      <strong class="${r.status}">${r.value}</strong>
                    </div>
                  `).join('')}
                </div>
              </article>
            `;
          }).join('')}
        </div>

        <details class="phys-refs-box" open>
          <summary>${isTr ? 'Temel Klinik Literatür ve Kılavuz Kaynakları' : 'Key Peer-Reviewed Literature & Guideline References'} (${REFERENCES.length})</summary>
          <ol class="phys-refs-list">
            ${REFERENCES.map(r => `<li>${r}</li>`).join('')}
          </ol>
        </details>
      </section>
    `;
  }

  function syncDynamicLabReadouts() {
    if (state.workspaceMode !== 'lab') return;
    const lang = getLang();
    const caseObj = findClinicalCase(state.caseId);
    const consoleReadout = computeConsoleReadout(caseObj, state);

    const setText = (sel, txt) => {
      const el = root.querySelector(sel);
      if (el) el.innerHTML = txt;
    };

    setText('[data-ro-pa]', `${consoleReadout.meanPa} <small>mmHg</small>`);
    setText('[data-ro-pd]', `${consoleReadout.meanPd} <small>mmHg</small>`);
    setText('[data-ro-pdpa]', consoleReadout.pdPa.toFixed(2));
    setText('[data-ro-ffr]', consoleReadout.ffr.toFixed(2));
    setText('[data-ro-ifr]', consoleReadout.ifr.toFixed(2));
    setText('[data-ro-sensor]', `${consoleReadout.sensorMm} <small>mm</small>`);

    const slider = root.querySelector('[data-phys-sensor]');
    if (slider && document.activeElement !== slider) slider.value = String(consoleReadout.sensorMm);

    const vesselMount = root.querySelector('[data-phys-vessel-mount]');
    if (vesselMount) vesselMount.innerHTML = renderVesselCutawaySvg(caseObj, state, lang);
    drawFluoro(root, state, caseObj, lang);

    renderPressureConsoleCanvas(root.querySelector('[data-phys-pressure-canvas]'), caseObj, state, lang);
    renderModalityDetailCanvas(root.querySelector('[data-phys-detail-canvas]'), state.modality, caseObj, state, lang);
  }

  function drawAllCanvases() {
    const lang = getLang();
    if (state.workspaceMode === 'lab') {
      const caseObj = findClinicalCase(state.caseId);
      renderPressureConsoleCanvas(root.querySelector('[data-phys-pressure-canvas]'), caseObj, state, lang);
      renderModalityDetailCanvas(root.querySelector('[data-phys-detail-canvas]'), state.modality, caseObj, state, lang);
      drawFluoro(root, state, caseObj, lang);
    } else if (state.workspaceMode === 'simulator') {
      const simResult = simulateHemodynamicCircuit(state.simParams);
      renderSimulatorCanvas(root.querySelector('[data-sim-canvas]'), simResult, 'pq', state.simStateMode, lang);
    } else if (state.workspaceMode === 'pitfalls') {
      const currentSpot = ARTIFACT_CATALOG[state.spotIndex % ARTIFACT_CATALOG.length];
      renderArtifactPreviewCanvas(root.querySelector('[data-spot-canvas]'), currentSpot.id, false, lang);
      ARTIFACT_CATALOG.forEach(art => {
        renderArtifactPreviewCanvas(
          root.querySelector(`[data-pit-canvas="${art.id}"]`),
          art.id,
          Boolean(state.pitfallFixedMap[art.id]),
          lang
        );
      });
    }
  }

  function bindEvents() {
    // Top workspace mode buttons
    root.querySelectorAll('[data-phys-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.workspaceMode = btn.dataset.physMode;
        render();
      });
    });

    // Modality tabs
    root.querySelectorAll('[data-phys-modality]').forEach(btn => {
      btn.addEventListener('click', () => {
        setModality(btn.dataset.physModality);
      });
    });

    // Case selector
    root.querySelector('[data-phys-case]')?.addEventListener('change', e => {
      selectCase(e.target.value);
    });

    // Vessel selector
    root.querySelector('[data-phys-vessel]')?.addEventListener('change', e => {
      state.vessel = e.target.value;
      state.fluoroProj = 0;
      render();
    });

    // Freeze / Reset
    root.querySelector('[data-phys-freeze]')?.addEventListener('click', () => {
      state.frozen = !state.frozen;
      render();
    });

    root.querySelector('[data-phys-reset]')?.addEventListener('click', () => {
      applyCaseDefaults(findClinicalCase(state.caseId));
      render();
    });

    // Device selector
    root.querySelector('[data-phys-device]')?.addEventListener('change', e => {
      state.device = e.target.value;
      render();
    });

    // Agent selector
    root.querySelector('[data-phys-agent]')?.addEventListener('change', e => {
      state.agent = e.target.value;
    });

    // Angiographic card: drag the sensor along the vessel, switch view and projection.
    bindFluoro(root, state, {
      onSensor: mm => {
        state.sensorMm = mm;
        if (findClinicalCase(state.caseId).artifact === 'whip') state.artifactFixed = true;
        syncDynamicLabReadouts();
      },
      onChange: render
    });

    // Sensor slider
    root.querySelector('[data-phys-sensor]')?.addEventListener('input', e => {
      state.sensorMm = clamp(Number(e.target.value), 0, 80);
      if (state.caseId === 'artifact-whip' || findClinicalCase(state.caseId).artifact === 'whip') {
        state.artifactFixed = true;
      }
      syncDynamicLabReadouts();
    });

    // Click along vessel SVG to position sensor
    const vesselMount = root.querySelector('[data-phys-vessel-mount]');
    vesselMount?.addEventListener('click', e => {
      const svg = vesselMount.querySelector('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 540;
      if (relX >= 68 && relX <= 504) {
        state.sensorMm = Math.round(clamp(((relX - 76) / 420) * 80, 0, 80));
        syncDynamicLabReadouts();
      }
    });

    // Action buttons
    root.querySelectorAll('[data-phys-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.physAction;
        const caseObj = findClinicalCase(state.caseId);
        if (act === 'flush') {
          state.flushed = true;
          if (caseObj.artifact === 'damp') state.artifactFixed = true;
        } else if (act === 'connections') {
          state.connectionsChecked = true;
          if (caseObj.artifact === 'leak') state.artifactFixed = true;
        } else if (act === 'ntg') {
          state.ntgGiven = true;
        } else if (act === 'disengage') {
          state.guideDisengaged = true;
          if (caseObj.artifact === 'vent') state.artifactFixed = true;
        } else if (act === 'equalize') {
          state.equalized = true;
          if (caseObj.artifact === 'drift') state.artifactFixed = true;
        } else if (act === 'advance') {
          state.sensorMm = 75;
          state.advancedDistal = true;
        } else if (act === 'step-back') {
          state.sensorMm = clamp(state.sensorMm - 2, 0, 80);
          if (caseObj.artifact === 'whip') state.artifactFixed = true;
        } else if (act === 'step-fwd') {
          state.sensorMm = clamp(state.sensorMm + 2, 0, 80);
          if (caseObj.artifact === 'whip') state.artifactFixed = true;
        } else if (act === 'pullback') {
          startAnimatedPullback();
          return;
        } else if (act === 'hyperemia') {
          state.hyperemia = !state.hyperemia;
        } else if (act === 'zero-temp') {
          state.tempZeroed = true;
        } else if (act === 'inject-bolus') {
          if (state.hyperemia) state.bolusHypCount = Math.min(3, state.bolusHypCount + 1);
          else state.bolusRestCount = Math.min(3, state.bolusRestCount + 1);
        } else if (act === 'position-mc') {
          state.mcPositioned = true;
        } else if (act === 'infuse') {
          state.infusing = !state.infusing;
        } else if (act === 'sensor-tip') {
          state.sensorMm = state.sensorMm <= 20 ? 75 : 14;
        } else if (act === 'optimize-doppler') {
          state.dopplerOptimized = true;
        } else if (act === 'reverse-spasm') {
          state.ntgGiven = true;
          state.achStep = 0;
        }
        render();
      });
    });

    // Continuous thermodilution infusion rate
    root.querySelector('[data-phys-rate]')?.addEventListener('change', e => {
      state.infusionRate = Number(e.target.value);
      state.hyperemia = state.infusionRate >= 15;
      render();
    });

    // Doppler ACh step buttons
    root.querySelectorAll('[data-phys-ach]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.achStep = Number(btn.dataset.physAch);
        state.ntgGiven = false;
        state.hyperemia = false;
        render();
      });
    });

    // Virtual PCI stent checkboxes
    root.querySelectorAll('[data-phys-stent]').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.dataset.physStent;
        const set = new Set(state.stentedIds);
        if (chk.checked) set.add(id);
        else set.delete(id);
        state.stentedIds = [...set];
        render();
      });
    });

    root.querySelector('[data-phys-underexpanded]')?.addEventListener('change', e => {
      state.underexpanded = e.target.checked;
      render();
    });

    root.querySelector('[data-phys-toggle-labels]')?.addEventListener('click', () => {
      state.showLesionLabels = !state.showLesionLabels;
      render();
    });

    // Simulator sliders & presets
    root.querySelectorAll('[data-sim-slider]').forEach(inp => {
      inp.addEventListener('input', () => {
        const key = inp.dataset.simSlider;
        state.simParams[key] = Number(inp.value);
        render();
      });
    });

    root.querySelectorAll('[data-sim-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.simPreset;
        if (p === 'normal') {
          state.simParams = { mapMmHg: 96, heartRate: 66, stenosisPct: 20, diffusePct: 4, rmuHypWu: 300, lvedpMmHg: 8 };
        } else if (p === 'focal') {
          state.simParams = { mapMmHg: 96, heartRate: 68, stenosisPct: 78, diffusePct: 4, rmuHypWu: 310, lvedpMmHg: 8 };
        } else if (p === 'diffuse') {
          state.simParams = { mapMmHg: 98, heartRate: 70, stenosisPct: 35, diffusePct: 32, rmuHypWu: 330, lvedpMmHg: 10 };
        } else if (p === 'structural-cmd') {
          state.simParams = { mapMmHg: 94, heartRate: 68, stenosisPct: 20, diffusePct: 5, rmuHypWu: 640, lvedpMmHg: 14 };
        } else if (p === 'functional-cmd') {
          state.simParams = { mapMmHg: 118, heartRate: 98, stenosisPct: 20, diffusePct: 5, rmuHypWu: 310, lvedpMmHg: 10 };
        }
        render();
      });
    });

    // Pitfalls events
    root.querySelector('[data-spot-next]')?.addEventListener('click', () => {
      state.spotIndex = (state.spotIndex + 1) % ARTIFACT_CATALOG.length;
      state.spotSelected = null;
      render();
    });

    root.querySelectorAll('[data-spot-ans]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.spotSelected = btn.dataset.spotAns;
        render();
      });
    });

    root.querySelectorAll('[data-pit-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pitToggle;
        state.pitfallFixedMap[id] = !state.pitfallFixedMap[id];
        render();
      });
    });

    // Calculator inputs
    root.querySelectorAll('[data-calc-input]').forEach(inp => {
      inp.addEventListener('input', () => {
        const cardId = inp.dataset.calcCardId;
        const key = inp.dataset.calcInput;
        state.calcValues[cardId][key] = Number(inp.value);
        const res = evaluateCalculatorCard(cardId, state.calcValues[cardId]);
        const outEl = root.querySelector(`[data-calc-results="${cardId}"]`);
        if (outEl) {
          outEl.innerHTML = res.rows.map(r => `
            <div class="phys-calc-row">
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
    if (state.workspaceMode === 'lab') bodyHtml = renderLabWorkspace(lang);
    else if (state.workspaceMode === 'simulator') bodyHtml = renderSimulatorWorkspace(lang);
    else if (state.workspaceMode === 'pitfalls') bodyHtml = renderPitfallsWorkspace(lang);
    else if (state.workspaceMode === 'calculator') bodyHtml = renderCalculatorWorkspace(lang);

    root.innerHTML = `
      <!-- TOP HEADER & MODE BAR -->
      <section class="phys-hero">
        <div class="phys-hero-title">
          <span class="phys-kicker">🫀 ${isTr ? 'KORONER FİZYOLOJİ MENTORU · CATH-LAB SİMÜLATÖRÜ' : 'CORONARY PHYSIOLOGY MENTOR · CATH-LAB SIMULATOR'}</span>
          <h1>${isTr ? 'Koroner Fizyoloji ve Mikrodolaşım Laboratuvarı' : 'Coronary Physiology and Microcirculation Lab'}</h1>
        </div>
        <div class="phys-mode-seg" role="group" aria-label="${isTr ? 'Çalışma Modu' : 'Workspace Mode'}">
          ${WORKSPACE_MODES.map(m => `
            <button type="button" class="phys-mode-btn ${m.id === state.workspaceMode ? 'active' : ''}" data-phys-mode="${m.id}" aria-pressed="${m.id === state.workspaceMode}">
              ${pick(m.label, lang)}
            </button>
          `).join('')}
        </div>
      </section>

      ${bodyHtml}
    `;

    bindEvents();
    drawAllCanvases();
  }

  function animLoop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;

    if (!state.frozen && state.workspaceMode === 'lab') {
      state.phaseOffset = (state.phaseOffset + dt * 0.85) % 1;
      const pCanvas = root.querySelector('[data-phys-pressure-canvas]');
      if (pCanvas) {
        renderPressureConsoleCanvas(pCanvas, findClinicalCase(state.caseId), state, getLang());
      }
    }

    rafId = requestAnimationFrame(animLoop);
  }

  // The angiographic canvas follows its box (column width changes with the window).
  const onResize = () => { if (state.workspaceMode === 'lab') drawFluoro(root, state, findClinicalCase(state.caseId), getLang()); };
  window.addEventListener('resize', onResize);

  render();
  rafId = requestAnimationFrame(animLoop);

  return {
    render,
    getState: () => ({ ...state, simParams: { ...state.simParams } }),
    setModality,
    selectCase,
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (pullbackTimer) clearInterval(pullbackTimer);
      window.removeEventListener('resize', onResize);
      root.remove();
    }
  };
}
