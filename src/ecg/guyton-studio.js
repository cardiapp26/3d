// Interactive Guyton ECG Studio UI Panel Component
import { createEcgLab } from './ecg-labs.js';
import { createAxisLab } from './axis-lab.js';
import { createQrsVectorLab } from './qrs-vector-lab.js';
import { GUYTON_TOPICS } from './guyton-data.js';
import { drawEcgGrid, drawCalibratedWave, generateEcgPoints, drawVectorHexaxial } from './guyton-render.js';

export function createGuytonEcgStudio({ mount, getLang = () => 'tr' }) {
  let activeTopicIdx = 0;
  let vectorAngle = 59; // Normal axis
  let vectorMag = 1.0;
  let activeInjuryCase = 'anterior_mi';
  let lab = null;
  const labStates = {};
  const container = document.createElement('div');
  container.className = 'guyton-studio';

  function render() {
    lab?.destroy();
    lab = null;
    const lang = getLang();
    const isTr = lang === 'tr';
    const topic = GUYTON_TOPICS[activeTopicIdx];

    container.innerHTML = `
      <div class="guyton-tabs" role="tablist">
        ${GUYTON_TOPICS.map((t, idx) => `
          <button type="button" role="tab" tabindex="${idx === activeTopicIdx ? 0 : -1}" aria-selected="${idx === activeTopicIdx}" class="guyton-tab-btn ${idx === activeTopicIdx ? 'active' : ''}" data-topic="${idx}">
            <span class="guyton-tab-ch">CH ${t.chapter}</span>
            <span class="guyton-tab-name">${t.title[lang]}</span>
          </button>
        `).join('')}
      </div>

      <div class="guyton-content-area">
        <header class="guyton-header-block">
          <span class="guyton-badge">${isTr ? 'EKG Fizyolojisi · Etkileşimli çalışma alanı' : 'ECG Physiology · Interactive workspace'}</span>
          <h2 class="guyton-title">${topic.title[lang]}</h2>
          <p class="guyton-subtitle">${topic.subtitle[lang]}</p>
        </header>

        <div class="guyton-dynamic-view" id="guyton-view"></div>
      </div>
    `;

    // Bind topic tabs
    container.querySelectorAll('[data-topic]').forEach(btn => {
      btn.addEventListener('keydown', e => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        activeTopicIdx = e.key === 'Home' ? 0 : e.key === 'End' ? GUYTON_TOPICS.length - 1 : (activeTopicIdx + (e.key === 'ArrowRight' ? 1 : -1) + GUYTON_TOPICS.length) % GUYTON_TOPICS.length;
        render(); container.querySelector(`[data-topic="${activeTopicIdx}"]`)?.focus();
      });
      btn.addEventListener('click', () => {
        activeTopicIdx = Number(btn.dataset.topic);
        render();
        container.querySelector(`[data-topic="${activeTopicIdx}"]`)?.focus();
      });
    });

    const viewArea = container.querySelector('#guyton-view');
    renderActiveTopic(viewArea, lang);
    container.querySelectorAll('canvas').forEach(c => { c.setAttribute('role','img'); c.setAttribute('aria-label', c.closest('.guyton-card')?.querySelector('h3')?.textContent || topic.title[lang]); });
  }

  function renderActiveTopic(mountNode, lang) {
    lab?.destroy(); lab = null;
    const isTr = lang === 'tr';
    const topic = GUYTON_TOPICS[activeTopicIdx];

    if (topic.id === 'ch11_basics') {
      mountNode.replaceChildren();
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
    mountNode.append(source);
  }

  // Chapter 11 Leads: Einthoven Triangle & Law
  function renderChapter11Leads(mountNode, isTr) {
    mountNode.innerHTML = `
      <div class="guyton-grid-2col">
        <div class="guyton-card">
          <h3>${isTr ? "Einthoven Kanunu ve Ekstremite Derivasyonları" : "Einthoven's Law & Limb Leads"}</h3>
          <p class="guyton-card-desc">
            ${isTr
              ? 'Einthoven Kanunu: Herhangi bir anda Derivasyon I + Derivasyon III = Derivasyon II potansiyelini verir. Vektör açısını değiştirerek voltajları test edin:'
              : "Einthoven's Law: At any instant, Lead I + Lead III = Lead II. Adjust the vector angle to verify the algebraic sum:"}
          </p>

          <div class="guyton-slider-row">
            <label for="vec-slider">${isTr ? 'Elektriksel Vektör Açısı (°):' : 'Electrical Vector Angle (°):'} <strong id="vec-angle-val">${vectorAngle}°</strong></label>
            <input type="range" id="vec-slider" min="-180" max="180" value="${vectorAngle}" />
          </div>

          <div class="guyton-canvas-wrap">
            <canvas id="einthoven-canvas" width="560" height="340"></canvas>
          </div>
        </div>

        <div class="guyton-card">
          <h3>${isTr ? 'Canlı Voltaj Ölçümü ve Doğrulama' : 'Live Voltage Readouts & Verification'}</h3>
          <div class="guyton-law-box" id="einthoven-law-box"></div>
          
          <div class="guyton-callout" style="margin-top:16px;">
            <h4>${isTr ? 'Prekordiyal Derivasyonlar (V1-V6) ve R Dalgası Gelişimi' : 'Precordial Leads (V1-V6) & R Progression'}</h4>
            <p>${isTr
              ? 'V1–V2 sağ/anterior septal göğüs yerleşimidir. V5–V6 lateral bakış sağlar. R progresyonu elektrot yerleşimi ve bireysel anatomiye bağlıdır; aşağıdaki göğüs haritasını deneyin.'
              : 'V1–V2 have right/anterior septal chest positions; V5–V6 provide lateral views. R progression depends on electrode placement and individual anatomy; explore the chest map below.'}</p>
          </div>
        </div>
      </div>
    `;

    const canvas = mountNode.querySelector('#einthoven-canvas');
    const lawBox = mountNode.querySelector('#einthoven-law-box');
    const slider = mountNode.querySelector('#vec-slider');
    const angleVal = mountNode.querySelector('#vec-angle-val');

    function update() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const res = drawVectorHexaxial(ctx, canvas.width, canvas.height, vectorAngle, vectorMag);
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

    update();
  }

  // Chapter 12 Injury: Current of Injury & J Point
  function renderChapter12Injury(mountNode, isTr) {
    const topic = GUYTON_TOPICS[4];

    mountNode.innerHTML = `
      <div class="guyton-grid-2col">
        <div class="guyton-card">
          <h3>${isTr ? 'Hasar Akımı ve J Noktası Referansı' : 'Current of Injury & The J Point'}</h3>
          <p class="guyton-card-desc">
            ${topic.mechanism[isTr ? 'tr' : 'en']}
          </p>

          <div class="guyton-toggle-group">
            ${topic.cases.map(c => `
              <button type="button" class="guyton-tab-btn ${c.id === activeInjuryCase ? 'active' : ''}" data-case="${c.id}">
                ${c.title[isTr ? 'tr' : 'en']}
              </button>
            `).join('')}
          </div>

          <div class="guyton-canvas-wrap" style="margin-top:12px;">
            <canvas id="injury-canvas" width="560" height="240"></canvas>
          </div>
        </div>

        <div class="guyton-card" id="injury-case-details"></div>
      </div>
    `;

    const canvas = mountNode.querySelector('#injury-canvas');
    const detailsNode = mountNode.querySelector('#injury-case-details');

    function updateCase(caseId) {
      activeInjuryCase = caseId;
      lab?.sync();
      mountNode.querySelectorAll('[data-case]').forEach(b => { b.classList.toggle('active', b.dataset.case === caseId); b.setAttribute('aria-pressed', String(b.dataset.case === caseId)); });
      const c = topic.cases.find(x => x.id === caseId) || topic.cases[0];

      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawEcgGrid(ctx, canvas.width, canvas.height);
        const pts = generateEcgPoints(canvas.width, {
          rate: 80,
          stElev: caseId === 'anterior_mi' ? 0.25 : -0.25,
          invertT: false
        });
        drawCalibratedWave(ctx, pts, canvas.width, canvas.height, { color: '#dc2626', lineWidth: 2.2 });
      }

      detailsNode.innerHTML = `
        <h3>${c.title[isTr ? 'tr' : 'en']}</h3>
        <div class="guyton-metric-large">
          <span class="label">${isTr ? 'J Noktası ve ST Kayması' : 'J-Point & ST Shift'}</span>
          <span class="val">${isTr ? c.jPointShift : (caseId === 'anterior_mi' ? '+2.5 mm ST elevation example (V1–V4)' : 'ST depression in V1–V3; posterior leads may show elevation')}</span>
        </div>
        <div class="guyton-callout" style="margin-top:12px;">
          <strong>${isTr ? 'Vektör Yönü:' : 'Vector Direction:'}</strong>
          <p>${c.vectorDirection[isTr ? 'tr' : 'en']}</p>
        </div>
        <div class="guyton-callout" style="margin-top:12px;">
          <strong>${isTr ? 'Fizyopatoloji:' : 'Pathology:'}</strong>
          <p>${c.pathology[isTr ? 'tr' : 'en']}</p>
        </div>
      `;
    }

    mountNode.querySelectorAll('[data-case]').forEach(btn => {
      btn.addEventListener('click', () => {
        updateCase(btn.dataset.case);
      });
    });

    updateCase(activeInjuryCase);
  }

  // Initial render
  mount.appendChild(container);
  render();

  return {
    render,
    destroy() {
      lab?.destroy();
      container.remove();
    }
  };
}
