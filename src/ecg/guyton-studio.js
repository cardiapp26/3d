// Interactive Guyton ECG Studio UI Panel Component
import { createEcgLab } from './ecg-labs.js';
import { createLessonExperiments } from './lesson-experiments.js';
import { createAxisLab } from './axis-lab.js';
import { createQrsVectorLab } from './qrs-vector-lab.js';
import { createLeadCameraLab } from './lead-camera-lab.js';
import './lead-camera-lab.css';
import { createStemiCameraLab } from './stemi-camera-lab.js';
import './stemi-camera-lab.css';
import { createDaVinciAnatomyLab } from './davinci-anatomy-lab.js';
import {
  createClinicalEcgSimulator,
  CARDIAC_CHANNELOPATHY_NODES,
  CHANNELOPATHY_ACRONYMS,
  buildChannelopathyApSvg
} from './clinical-ecg-simulator.js';
import './clinical-ecg-simulator.css';
import { GUYTON_TOPICS } from './guyton-data.js';
import { drawEcgGrid, drawCalibratedWave, generateEcgPoints, drawVectorHexaxial } from './guyton-render.js';

export function createGuytonEcgStudio({ mount, getLang = () => 'tr' }) {
  let activeTopicIdx = 0;
  let isDaVinci = new URLSearchParams(location.search).get('lesson') === 'davinci';
  let vectorAngle = 59; // Normal axis
  let vectorMag = 1.0;
  let activeInjuryCase = 'anterior_mi';
  let activeChanNodeId = 'phase0_ina';
  let lab = null;
  let cameraLab = null;
  let stemiLab = null;
  let daVinciLab = null;
  let clinicalSim = null;
  const labStates = {};
  const container = document.createElement('div');
  container.className = 'guyton-studio';

  function render() {
    lab?.destroy();
    lab = null;
    cameraLab?.destroy();
    cameraLab = null;
    stemiLab?.destroy();
    stemiLab = null;
    daVinciLab?.destroy();
    daVinciLab = null;
    clinicalSim?.destroy();
    clinicalSim = null;
    const lang = getLang();
    const isTr = lang === 'tr';
    const topic = GUYTON_TOPICS[activeTopicIdx];

    const currentTitle = isDaVinci
      ? (isTr ? '12 Derivasyonlu EKG Anatomisi (Da Vinci Köşesi)' : '12-Lead Electrocardiographic Anatomy (Da Vinci Corner)')
      : topic.title[lang];
    const currentSubtitle = isDaVinci
      ? (isTr ? 'Bradfield, Shivkumar ve Mori (JACC 2025): Cabrera panoramik sıralaması, prekordiyal 3D düzlem farkları ve anatomik terminoloji' : 'Bradfield, Shivkumar, and Mori (JACC 2025): Cabrera panoramic sequence, 3D precordial height levels, and anatomical nomenclature')
      : topic.subtitle[lang];
    const currentBadge = isDaVinci
      ? (isTr ? 'JACC 2025 · DA VINCI KÖŞESİ' : 'JACC 2025 · DA VINCI CORNER')
      : (isTr ? 'EKG Fizyolojisi · Etkileşimli çalışma alanı' : 'ECG Physiology · Interactive workspace');

    container.innerHTML = `
      <nav class="guyton-chapters" aria-label="${isTr ? 'Bölümler' : 'Chapters'}">
        <p class="guyton-chapters-title">${isTr ? 'Bölümler' : 'Chapters'}</p>
        <div class="guyton-tabs" role="tablist" aria-orientation="vertical">
          ${GUYTON_TOPICS.map((t, idx) => `
            <button type="button" role="tab" tabindex="${idx === activeTopicIdx && !isDaVinci ? 0 : -1}" aria-selected="${idx === activeTopicIdx && !isDaVinci}" class="guyton-tab-btn ${idx === activeTopicIdx && !isDaVinci ? 'active' : ''}" data-topic="${idx}">
              <span class="guyton-tab-ch">${isTr ? 'Bölüm' : 'Chapter'} ${t.chapter}</span>
              <span class="guyton-tab-name">${t.title[lang]}</span>
            </button>
          `).join('')}
          <button type="button" role="tab" tabindex="${isDaVinci ? 0 : -1}" aria-selected="${isDaVinci}" class="guyton-tab-btn davinci-tab-pill ${isDaVinci ? 'active' : ''}" data-davinci-tab="true">
            <span class="guyton-tab-ch">${isTr ? 'Ek' : 'Appendix'} · JACC 2025</span>
            <span class="guyton-tab-name">${isTr ? '12 Derivasyon EKG Anatomisi' : '12-Lead ECG Anatomy'}</span>
          </button>
        </div>
      </nav>

      <div class="guyton-content-area">
        <div id="clinical-sim-mount"></div>
        <header class="guyton-header-block">
          <span class="guyton-badge">${currentBadge}</span>
          <h2 class="guyton-title">${currentTitle}</h2>
          <p class="guyton-subtitle">${currentSubtitle}</p>
        </header>

        <div class="guyton-dynamic-view" id="guyton-view"></div>
      </div>
    `;

    const simMount = container.querySelector('#clinical-sim-mount');
    if (simMount) {
      clinicalSim = createClinicalEcgSimulator({
        mount: simMount,
        getLang,
        initialCollapsed: activeTopicIdx !== 0 || isDaVinci
      });
      if (!isDaVinci) {
        if (topic.id === 'ch12_injury') clinicalSim.selectCategory('ischemia', 'anterior_stemi');
        else if (topic.id === 'ch13_arrhythmias') clinicalSim.selectCategory('arrhythmia', 'afib');
        else if (topic.id === 'ch12_axis') clinicalSim.selectCategory('conduction', 'lafb_ashman');
        else if (topic.id === 'ch12_vectors') clinicalSim.selectCategory('conduction', 'rbbb');
      }
    }

    // Bind topic tabs
    container.querySelectorAll('[data-topic]').forEach(btn => {
      btn.addEventListener('keydown', e => {
        // A vertical list on wide screens, a row on phones: both arrow pairs move.
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        e.preventDefault();
        isDaVinci = false;
        const step = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1;
        activeTopicIdx = e.key === 'Home' ? 0 : e.key === 'End' ? GUYTON_TOPICS.length - 1 : (activeTopicIdx + step + GUYTON_TOPICS.length) % GUYTON_TOPICS.length;
        render(); container.querySelector(`[data-topic="${activeTopicIdx}"]`)?.focus();
      });
      btn.addEventListener('click', () => {
        isDaVinci = false;
        activeTopicIdx = Number(btn.dataset.topic);
        render();
        container.querySelector(`[data-topic="${activeTopicIdx}"]`)?.focus();
      });
    });

    const davinciBtn = container.querySelector('[data-davinci-tab]');
    if (davinciBtn) {
      davinciBtn.addEventListener('click', () => {
        isDaVinci = true;
        render();
      });
    }

    const viewArea = container.querySelector('#guyton-view');
    if (isDaVinci) {
      daVinciLab = createDaVinciAnatomyLab({
        mount: viewArea,
        getLang,
        state: labStates.davinci ||= {}
      });
    } else {
      renderActiveTopic(viewArea, lang);
    }
    if (!isDaVinci) createLessonExperiments({ mount: viewArea, topic: topic.id, getLang });
    container.querySelectorAll('canvas').forEach(c => { c.setAttribute('role','img'); c.setAttribute('aria-label', c.closest('.guyton-card')?.querySelector('h3')?.textContent || (isDaVinci ? 'Da Vinci Anatomy' : topic.title[lang])); });
  }

  function renderActiveTopic(mountNode, lang) {
    lab?.destroy(); lab = null;
    cameraLab?.destroy(); cameraLab = null;
    stemiLab?.destroy(); stemiLab = null;
    const isTr = lang === 'tr';
    const topic = GUYTON_TOPICS[activeTopicIdx];

    if (topic.id === 'ch11_basics') {
      mountNode.replaceChildren();
      cameraLab = createLeadCameraLab({ mount: mountNode, getLang, state: labStates.leadCamera ||= {} });
    } else if (topic.id === 'ch11_leads') {
      renderChapter11Leads(mountNode, isTr);
    } else if (topic.id === 'ch12_vectors') {
      // Continuous QRS genesis: activation map, vector loop and six leads (qrs-vector-lab.js).
      mountNode.replaceChildren();
    } else if (topic.id === 'ch12_axis') {
      // One interactive lab: hexaxial wheel, six leads, reading methods and quiz (axis-lab.js).
      mountNode.replaceChildren();
    } else if (topic.id === 'ch12_injury') {
      renderChapter12Injury(mountNode, isTr);
    } else if (topic.id === 'ch13_arrhythmias') {
      mountNode.replaceChildren();
    }
    const source = document.createElement('details'); source.className = 'ecg-topic-sources';
    const summary = document.createElement('summary'); summary.textContent = isTr ? 'Kaynaklar ve çizim kapsamı' : 'Sources and drawing scope';
    const sourceText = document.createElement('p');
    const plates = { ch11_basics:'2-15 (PDF 1)', ch11_leads:'2-16 (PDF 2)', ch12_vectors:'2-17–2-18 (PDF 3–4)', ch12_axis:'2-19–2-22 (PDF 5–8)', ch12_injury:'2-15, 2-28 (PDF 1, 14)', ch13_arrhythmias:'2-24–2-27 (PDF 10–13)' };
    sourceText.textContent = `${isTr ? 'Netter, 2. baskı (2014), levha' : 'Netter, 2nd edition (2014), plate'} ${plates[topic.id]}. ${isTr ? 'Guyton & Hall: 11–13. bölümler. Özgün şematik çizimler; hasta kaydı veya kitap şeklinin sayısallaştırılması değildir.' : 'Guyton & Hall: chapters 11–13. Original schematic drawings, not patient recordings or digitized textbook figures.'}`;
    source.append(summary,sourceText);
    for (const [title,url] of [
      ['AHA/ACCF/HRS · ECG technology (2007)','https://doi.org/10.1016/j.jacc.2007.01.024'],
      ['ESC · QT interval measurement','https://www.escardio.org/communities/councils/genomics/scientific-documents-and-publications/cardiogenomics-insights/volume-9/how-to-measure-the-qt-interval/'],
      ['Cardiac propagation and re-entry','https://doi.org/10.1161/CIRCEP.113.000311']
    ]) { const a=document.createElement('a'); a.textContent=title;a.href=url;a.target='_blank';a.rel='noopener noreferrer';source.append(a); }

    lab = topic.id === 'ch12_axis'
      ? createAxisLab({ mount: mountNode, getLang, conditions: topic.conditions, state: labStates[topic.id] ||= {} })
      : topic.id === 'ch12_vectors'
      ? createQrsVectorLab({ mount: mountNode, getLang, steps: topic.vectors, state: labStates[topic.id] ||= {} })
      : createEcgLab({ mount: mountNode, topic: topic.id, getLang, state: labStates[topic.id] ||= {},
      getExternal: () => ({ caseId:activeInjuryCase, vectorAngle }) });
    if (topic.id === 'ch11_basics') {
      renderChannelopathyAtlasCard(mountNode, isTr);
    }
    mountNode.append(source);
  }

  // Chapter 11 Basics: Interactive Cardiac Channelopathies (Phase 0-4 Ion Currents, Genes & Syndromes)
  function renderChannelopathyAtlasCard(mountNode, isTr) {
    const card = document.createElement('section');
    card.className = 'guyton-card chan-atlas-card';
    card.setAttribute('data-channelopathy-atlas', 'true');

    function updateAtlasCard() {
      const activeNode = CARDIAC_CHANNELOPATHY_NODES.find(n => n.id === activeChanNodeId) || CARDIAC_CHANNELOPATHY_NODES[0];
      card.innerHTML = `
        <div class="chan-atlas-header">
          <div>
            <span class="guyton-badge" style="margin-bottom:4px;display:inline-block;">
              ${isTr ? 'FAZ 0–4 İYON KANALLARI · KALITSAL KANALOPATİ HARİTASI' : 'PHASE 0–4 ION CURRENTS · INHERITED CHANNELOPATHY ATLAS'}
            </span>
            <h3>${isTr ? 'Kardiyak Kanalopatiler: Ventriküler Aksiyon Potansiyeli, Genler ve Sendromlar' : 'Cardiac Channelopathies: Ventricular Action Potential, Genes & Syndromes'}</h3>
          </div>
          <button type="button" class="chan-sim-launch-btn" data-launch-chan-sim="${activeNode.id}">
            ⚡ ${isTr ? 'Canlı EKG Monitöründe Simüle Et' : 'Simulate on Live ECG Monitor'} (${activeNode.current})
          </button>
        </div>

        <div class="clin-chan-node-pills" role="group" aria-label="${isTr ? 'Faz 0–4 İyon Kanalı Seçimi' : 'Select Phase 0–4 Ion Channel'}">
          ${CARDIAC_CHANNELOPATHY_NODES.map(n => `
            <button type="button" class="clin-chan-pill ${n.id === activeNode.id ? 'active' : ''} ${n.direction}" data-atlas-chan-node="${n.id}">
              <span class="clin-chan-pill-dot"></span>
              <span>${n.phase}: <strong>${n.current}</strong> · ${n.genes.join(', ')}</span>
            </button>
          `).join('')}
        </div>

        <div class="chan-atlas-grid">
          <div class="chan-atlas-svg-box">
            ${buildChannelopathyApSvg(activeNode.id, isTr)}
          </div>

          <div class="chan-atlas-info-col">
            <div class="clin-chan-detail-box">
              <div class="clin-chan-detail-title">${isTr ? activeNode.titleTr : activeNode.titleEn}</div>
              <p class="clin-chan-detail-desc">${isTr ? activeNode.mechTr : activeNode.mechEn}</p>
              <div class="clin-chan-syndrome-tags">
                ${activeNode.syndromes.map(s => `<span class="clin-chan-syn-tag">${s}</span>`).join('')}
              </div>
            </div>

            <div class="chan-acronym-table" role="region" aria-label="${isTr ? 'Kardiyak Kanalopati Kısaltmaları' : 'Cardiac Channelopathy Acronyms'}">
              <div class="chan-acronym-head">${isTr ? 'Klinik Sendrom & Gen Kısaltmaları' : 'Clinical Syndrome & Gene Legend'}</div>
              <div class="chan-acronym-grid">
                ${CHANNELOPATHY_ACRONYMS.map(a => `
                  <div class="chan-acronym-item">
                    <strong>${a.code}</strong>
                    <span>${isTr ? a.tr : a.en}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      card.querySelectorAll('[data-atlas-chan-node], [data-chan-node]').forEach(el => {
        el.addEventListener('click', () => {
          const nid = el.getAttribute('data-atlas-chan-node') || el.getAttribute('data-chan-node');
          const found = CARDIAC_CHANNELOPATHY_NODES.find(n => n.id === nid);
          if (!found) return;
          activeChanNodeId = found.id;
          updateAtlasCard();
          clinicalSim?.selectCategory('channelopathy', found.condId, found.id);
        });
      });

      card.querySelector('[data-launch-chan-sim]')?.addEventListener('click', () => {
        clinicalSim?.selectCategory('channelopathy', activeNode.condId, activeNode.id);
        container.querySelector('#clinical-sim-mount')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    updateAtlasCard();
    mountNode.appendChild(card);
  }

  // Chapter 11 Leads: Unified Einthoven Hexaxial Vector Studio & Cabrera Link
  function renderChapter11Leads(mountNode, isTr) {
    mountNode.innerHTML = `
      <div class="guyton-grid-2col">
        <div class="guyton-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <h3>${isTr ? "Einthoven Kanunu ve Heksaksiyel İzdüşüm" : "Einthoven's Law & Hexaxial Projection"}</h3>
            <div class="guyton-slider-row" style="margin:0;flex:1;min-width:220px;">
              <label for="vec-slider">${isTr ? 'Dipol Açısı:' : 'Dipole Angle:'} <strong id="vec-angle-val">${vectorAngle}°</strong></label>
              <input type="range" id="vec-slider" min="-180" max="180" value="${vectorAngle}" />
            </div>
          </div>

          <div class="guyton-canvas-wrap">
            <canvas id="einthoven-canvas" width="560" height="310"></canvas>
          </div>
        </div>

        <div class="guyton-card" style="justify-content:space-between;">
          <div>
            <h3>${isTr ? 'Canlı Cebirsel Doğrulama (I + III = II)' : 'Live Algebraic Verification (I + III = II)'}</h3>
            <div class="guyton-law-box" id="einthoven-law-box"></div>
          </div>

          <div class="davinci-lead-banner" style="margin-top:8px;">
            <div class="davinci-banner-content">
              <span class="davinci-badge">JACC 2025 · DA VINCI KÖŞESİ</span>
              <h4>${isTr ? 'Cabrera Panoramik Dizilimi (aVL → I → −aVR → II → aVF → III)' : 'Cabrera Panoramic Sequence (aVL → I → −aVR → II → aVF → III)'}</h4>
            </div>
            <button type="button" class="davinci-banner-btn" data-go-davinci="true">
              ${isTr ? '3B Cabrera & Düzlem Stüdyosu →' : '3D Cabrera & Planes Studio →'}
            </button>
          </div>
        </div>
      </div>
    `;

    mountNode.querySelector('[data-go-davinci]')?.addEventListener('click', () => {
      isDaVinci = true;
      render();
    });

    const canvas = mountNode.querySelector('#einthoven-canvas');
    const lawBox = mountNode.querySelector('#einthoven-law-box');
    const slider = mountNode.querySelector('#vec-slider');
    const angleVal = mountNode.querySelector('#vec-angle-val');

    function update() {
      if (!canvas) return;
      const logicalW = 560;
      const logicalH = 310;
      const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
      if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
        canvas.width = Math.round(logicalW * dpr);
        canvas.height = Math.round(logicalH * dpr);
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const res = drawVectorHexaxial(ctx, logicalW, logicalH, vectorAngle, vectorMag);
      angleVal.textContent = `${vectorAngle}°`;
      lab?.sync();

      const v1Mv = (res.lead1).toFixed(2);
      const v2Mv = (res.lead2).toFixed(2);
      const v3Mv = (res.lead3).toFixed(2);
      const sum = (Number(v1Mv) + Number(v3Mv)).toFixed(2);

      lawBox.innerHTML = `
        <div class="guyton-formula">${isTr ? 'Der' : 'Lead'} I (${v1Mv} mV) + ${isTr ? 'Der' : 'Lead'} III (${v3Mv} mV) = <strong>${sum} mV</strong></div>
        <div class="guyton-formula-check ${Math.abs(sum - v2Mv) < 0.05 ? 'valid' : ''}">
          ${isTr ? 'Derivasyon II değeri:' : 'Lead II value:'} <strong>${v2Mv} mV</strong> 
          <span>${Math.abs(sum - v2Mv) < 0.05 ? (isTr ? '✓ Einthoven kanunu doğrulandı' : '✓ Einthoven law verified') : (isTr ? 'Yuvarlama farkı' : 'Rounding difference')}</span>
        </div>
        <div class="guyton-voltage-table">
          <div class="row"><span>Lead I (0°):</span> <strong>${v1Mv} mV</strong></div>
          <div class="row"><span>Lead II (+60°):</span> <strong>${v2Mv} mV</strong></div>
          <div class="row"><span>Lead III (+120°):</span> <strong>${v3Mv} mV</strong></div>
        </div>
      `;
    }

    slider.addEventListener('input', (e) => {
      vectorAngle = Number(e.target.value);
      update();
    });

    // Direct pointer-drag on #einthoven-canvas to rotate electrical vector
    let draggingVec = false;
    function setAngleFromPointer(e) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const deg = Math.round((Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI);
      vectorAngle = Math.max(-180, Math.min(180, deg));
      if (slider) slider.value = String(vectorAngle);
      update();
    }
    canvas?.addEventListener('pointerdown', (e) => {
      draggingVec = true;
      canvas.setPointerCapture?.(e.pointerId);
      setAngleFromPointer(e);
    });
    canvas?.addEventListener('pointermove', (e) => {
      if (draggingVec) setAngleFromPointer(e);
    });
    canvas?.addEventListener('pointerup', () => { draggingVec = false; });

    update();
  }

  // Chapter 12 Injury: Streamlined STEMI Camera Studio + Compact J-Point Case Bar
  function renderChapter12Injury(mountNode, isTr) {
    const topic = GUYTON_TOPICS[4];

    mountNode.innerHTML = `
      <div id="stemi-camera-mount"></div>
      <div class="guyton-card guyton-injury-toolbar">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
          <div class="guyton-toggle-group" style="margin:0;">
            ${topic.cases.map(c => `
              <button type="button" class="guyton-tab-btn ${c.id === activeInjuryCase ? 'active' : ''}" data-case="${c.id}">
                ${c.title[isTr ? 'tr' : 'en']}
              </button>
            `).join('')}
          </div>
          <div id="injury-case-details" class="guyton-injury-inline-summary"></div>
        </div>
      </div>
    `;

    const stemiMount = mountNode.querySelector('#stemi-camera-mount');
    const detailsNode = mountNode.querySelector('#injury-case-details');

    function updateCase(caseId, syncStemi = true) {
      activeInjuryCase = caseId;
      lab?.sync();
      if (syncStemi && stemiLab) {
        stemiLab.selectTerritory(caseId === 'posterior_mi' ? 'posterior_mi' : 'anterior_lad');
      }
      mountNode.querySelectorAll('[data-case]').forEach(b => { b.classList.toggle('active', b.dataset.case === caseId); b.setAttribute('aria-pressed', String(b.dataset.case === caseId)); });
      const c = topic.cases.find(x => x.id === caseId) || topic.cases[0];

      if (detailsNode) {
        detailsNode.innerHTML = `
          <span class="guyton-injury-pill">
            <strong>${isTr ? 'J Noktası:' : 'J-Point:'}</strong>
            ${isTr ? c.jPointShift : (caseId === 'anterior_mi' ? '+2.5 mm STE (V1–V4)' : 'V1–V3 Reciprocal STD · V7–V9 STE')}
          </span>
          <span class="guyton-injury-pill subtle">
            <strong>${isTr ? 'ST Vektörü:' : 'ST Vector:'}</strong>
            ${c.vectorDirection[isTr ? 'tr' : 'en']}
          </span>
        `;
      }
    }

    stemiLab = createStemiCameraLab({
      mount: stemiMount,
      getLang,
      state: labStates.stemiCamera ||= {},
      onTerritoryChange: (terrId) => {
        if (terrId === 'posterior_mi') updateCase('posterior_mi', false);
        else if (terrId === 'anterior_lad') updateCase('anterior_mi', false);
      }
    });

    mountNode.querySelectorAll('[data-case]').forEach(btn => {
      btn.addEventListener('click', () => {
        updateCase(btn.dataset.case, true);
      });
    });

    updateCase(activeInjuryCase, false);
  }

  // Initial render
  mount.appendChild(container);
  render();

  return {
    render,
    destroy() {
      lab?.destroy();
      cameraLab?.destroy();
      stemiLab?.destroy();
      daVinciLab?.destroy();
      clinicalSim?.destroy();
      container.remove();
    }
  };
}
