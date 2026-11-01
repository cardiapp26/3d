// Interactive PV Loop Lab: Time-varying elastance and ventricular-arterial coupling.
import { PV_PRESETS, PV_V0, pvParams, pvModelLoop } from '../hemo-pv-model.js';
import { PV_SCENARIOS } from './pathophysiology-data.js';

export function createPvLoopLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-pv-lab';

  let currentPreset = 'normal';
  let params = { ...PV_SCENARIOS[0].params };
  const HR = 75; // typical resting heart rate for cardiac output calculation

  root.innerHTML = `
    <div class="pathophys-presets-bar" role="group" aria-label="Presets"></div>
    <div class="pathophys-grid">
      <div class="pathophys-stage">
        <svg viewBox="0 0 540 380" class="pathophys-svg pathophys-pv-svg" role="img" aria-label="Pressure-Volume Loop"></svg>
        <div class="pathophys-legend">
          <span><i class="legend-color legend-pv"></i> <strong data-i18n-pv="loop"></strong></span>
          <span><i class="legend-color legend-espvr"></i> <strong data-i18n-pv="espvr"></strong></span>
          <span><i class="legend-color legend-edpvr"></i> <strong data-i18n-pv="edpvr"></strong></span>
          <span><i class="legend-color legend-ea"></i> <strong data-i18n-pv="ea"></strong></span>
        </div>
      </div>
      <div class="pathophys-controls">
        <div class="pathophys-sliders">
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-i18n-pv="lblEdv"></strong> <small>(mL)</small></span>
            <input type="range" data-pv-slider="edv" min="60" max="260" step="5">
            <span class="slider-val" data-pv-val="edv"></span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-i18n-pv="lblEes"></strong> <small>(mmHg/mL)</small></span>
            <input type="range" data-pv-slider="ees" min="0.5" max="5.0" step="0.1">
            <span class="slider-val" data-pv-val="ees"></span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-i18n-pv="lblEa"></strong> <small>(mmHg/mL)</small></span>
            <input type="range" data-pv-slider="ea" min="0.6" max="3.5" step="0.1">
            <span class="slider-val" data-pv-val="ea"></span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-i18n-pv="lblStiff"></strong> <small>(/mL)</small></span>
            <input type="range" data-pv-slider="stiffness" min="0.015" max="0.055" step="0.002">
            <span class="slider-val" data-pv-val="stiffness"></span>
          </label>
        </div>
        <div class="pathophys-readouts">
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rEf">EF</span>
            <strong class="readout-value" data-pv-out="ef">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rSv">SV</span>
            <strong class="readout-value" data-pv-out="sv">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rCo">CO</span>
            <strong class="readout-value" data-pv-out="co">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rSw">Stroke Work</span>
            <strong class="readout-value" data-pv-out="sw">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rVAc">Ea / Ees</span>
            <strong class="readout-value" data-pv-out="vac">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rEsp">Peak / ESP</span>
            <strong class="readout-value" data-pv-out="esp">--</strong>
          </div>
        </div>
        <div class="pathophys-scenario-card">
          <h4 data-pv-scen-title></h4>
          <p data-pv-scen-desc></p>
        </div>
      </div>
    </div>
  `;
  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  const presetsBar = $('.pathophys-presets-bar');
  PV_SCENARIOS.forEach(scen => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pathophys-preset-btn';
    btn.dataset.pvPreset = scen.id;
    btn.addEventListener('click', () => {
      currentPreset = scen.id;
      params = { ...scen.params };
      syncSliders();
      render();
    });
    presetsBar.append(btn);
  });

  ['edv', 'ees', 'ea', 'stiffness'].forEach(key => {
    const input = $(`[data-pv-slider="${key}"]`);
    input.addEventListener('input', () => {
      params[key] = Number(input.value);
      currentPreset = 'custom';
      render();
    });
  });

  function syncSliders() {
    ['edv', 'ees', 'ea', 'stiffness'].forEach(key => {
      const input = $(`[data-pv-slider="${key}"]`);
      if (input) input.value = params[key];
    });
  }

  function render() {
    const en = getLang() === 'en';
    const t = o => o[en ? 'en' : 'tr'];

    // Update preset buttons
    $$('.pathophys-preset-btn').forEach(btn => {
      const id = btn.dataset.pvPreset;
      const scen = PV_SCENARIOS.find(s => s.id === id);
      btn.textContent = t(scen.name);
      btn.setAttribute('aria-pressed', String(id === currentPreset));
    });

    // Update slider readouts
    $('[data-pv-val="edv"]').textContent = `${Math.round(params.edv)} mL`;
    $('[data-pv-val="ees"]').textContent = `${params.ees.toFixed(2)}`;
    $('[data-pv-val="ea"]').textContent = `${params.ea.toFixed(2)}`;
    $('[data-pv-val="stiffness"]').textContent = `${params.stiffness.toFixed(3)}`;

    // Text labels
    const I18N = {
      loop: en ? 'PV Loop' : 'PV Döngüsü',
      espvr: en ? 'ESPVR (Inotropy)' : 'ESPVR (Kontraktilite)',
      edpvr: en ? 'EDPVR (Compliance)' : 'EDPVR (Kompliyans)',
      ea: en ? 'Ea (Arterial Elastance)' : 'Ea (Arteriyel Elastans)',
      lblEdv: en ? 'Preload (EDV)' : 'Ön-yük (EDV)',
      lblEes: en ? 'Contractility (Ees)' : 'Kontraktilite (Ees)',
      lblEa: en ? 'Afterload (Ea)' : 'Ard-yük (Ea)',
      lblStiff: en ? 'Diastolic Stiffness' : 'Diyastolik Sertlik',
      rEf: en ? 'Ejection Fraction' : 'Ejeksiyon Fraksiyonu',
      rSv: en ? 'Stroke Volume' : 'Vuru Hacmi',
      rCo: en ? 'Cardiac Output' : 'Kardiyak Debi',
      rSw: en ? 'Stroke Work' : 'Vuru İşi',
      rVAc: en ? 'V-A Coupling (Ea/Ees)' : 'V-A Eşleşme (Ea/Ees)',
      rEsp: en ? 'Peak Pressure' : 'Tepe Basıncı'
    };
    $$('[data-i18n-pv]').forEach(node => {
      const k = node.dataset.i18nPv;
      if (I18N[k]) node.textContent = I18N[k];
    });

    // Calculate loop model
    const fullParams = pvParams(params, currentPreset || 'normal');
    const p = pvModelLoop(fullParams);
    const sv = p.sv;
    const ef = Math.round((p.ef || 0) * 100);
    const co = ((sv * HR) / 1000).toFixed(1);
    const swJ = (sv * p.esp * 0.000133322).toFixed(1);
    const vaRatio = (params.ea / params.ees).toFixed(2);

    $('[data-pv-out="ef"]').textContent = `${ef}%`;
    $('[data-pv-out="sv"]').textContent = `${Math.round(sv)} mL`;
    $('[data-pv-out="co"]').textContent = `${co} L/min`;
    $('[data-pv-out="sw"]').textContent = `${swJ} J`;
    $('[data-pv-out="vac"]').textContent = vaRatio;
    $('[data-pv-out="esp"]').textContent = `${Math.round(p.peak || p.esp)} / ${Math.round(p.esp)} mmHg`;

    // Active scenario info
    const activeScen = PV_SCENARIOS.find(s => s.id === currentPreset) || {
      name: t({ tr: 'Özel Ayar', en: 'Custom Adjustment' }),
      desc: t({ tr: 'Sürgülerle dinamik olarak değiştirilmiş ventrikül parametreleri.', en: 'Dynamically adjusted ventricular mechanics parameters.' })
    };
    $('[data-pv-scen-title]').textContent = typeof activeScen.name === 'object' ? t(activeScen.name) : activeScen.name;
    $('[data-pv-scen-desc]').textContent = typeof activeScen.desc === 'object' ? t(activeScen.desc) : activeScen.desc;

    // Draw SVG
    drawPvSvg(p, params);
  }

  function drawPvSvg(p, currentParams) {
    const svg = $('.pathophys-pv-svg');

    // Coordinate mapping
    // X: Volume 0 to 280 mL
    // Y: Pressure 0 to 240 mmHg
    const xMin = 0, xMax = 280;
    const yMin = 0, yMax = 240;
    const padL = 50, padR = 20, padT = 30, padB = 40;
    const w = 540, h = 380;
    const plotW = w - padL - padR, plotH = h - padT - padB;

    const toX = v => padL + ((v - xMin) / (xMax - xMin)) * plotW;
    const toY = pr => h - padB - ((pr - yMin) / (yMax - yMin)) * plotH;

    // SVG grid lines and axis labels
    const gridLines = [];
    const labels = [];

    for (let vol = 50; vol <= 250; vol += 50) {
      const gx = toX(vol);
      gridLines.push(`<line x1="${gx}" y1="${padT}" x2="${gx}" y2="${h - padB}" stroke="#d3ded6" stroke-dasharray="3 3"/>`);
      labels.push(`<text x="${gx}" y="${h - padB + 18}" text-anchor="middle" class="axis-num">${vol}</text>`);
    }
    for (let pr = 40; pr <= 200; pr += 40) {
      const gy = toY(pr);
      gridLines.push(`<line x1="${padL}" y1="${gy}" x2="${w - padR}" y2="${gy}" stroke="#d3ded6" stroke-dasharray="3 3"/>`);
      labels.push(`<text x="${padL - 10}" y="${gy + 4}" text-anchor="end" class="axis-num">${pr}</text>`);
    }

    // Axes
    const axes = `
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#3d5a4d" stroke-width="2"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#3d5a4d" stroke-width="2"/>
      <text x="${w / 2 + 20}" y="${h - 8}" text-anchor="middle" class="axis-title">${getLang() === 'en' ? 'Left Ventricular Volume (mL)' : 'Sol Ventrikül Hacmi (mL)'}</text>
      <text x="14" y="${h / 2}" text-anchor="middle" transform="rotate(-90 14 ${h / 2})" class="axis-title">${getLang() === 'en' ? 'Pressure (mmHg)' : 'Basınç (mmHg)'}</text>
    `;

    // ESPVR line: from V0 (10 mL, 0 mmHg) through (esv, esp) extended
    const v0X = toX(PV_V0), v0Y = toY(0);
    const espvrExtVol = 200;
    const espvrExtP = Math.min(yMax, currentParams.ees * (espvrExtVol - PV_V0));
    const espvrLine = `<line x1="${v0X}" y1="${v0Y}" x2="${toX(espvrExtVol)}" y2="${toY(espvrExtP)}" stroke="#c92a2a" stroke-width="2" stroke-dasharray="5 4" opacity="0.85"/>`;

    // Ea line: from (edv, 0) to (esv, esp)
    const eaLine = `<line x1="${toX(p.edv)}" y1="${toY(0)}" x2="${toX(p.esv)}" y2="${toY(p.esp)}" stroke="#1f4fd1" stroke-width="2" stroke-dasharray="4 4" opacity="0.8"/>`;

    // EDPVR diastolic curve
    const edpvrPoints = [];
    for (let vol = PV_V0; vol <= 270; vol += 5) {
      const edpVal = p.edpvr(vol);
      if (edpVal <= yMax + 20) {
        edpvrPoints.push(`${toX(vol).toFixed(1)},${toY(edpVal).toFixed(1)}`);
      }
    }
    const edpvrPath = `<polyline points="${edpvrPoints.join(' ')}" fill="none" stroke="#e67700" stroke-width="2.2" stroke-dasharray="6 4" opacity="0.9"/>`;

    // Closed PV loop polygon from samples
    const loopPoints = (p.points || []).map(s => `${toX(s.v).toFixed(1)},${toY(s.p).toFixed(1)}`).join(' ');
    const pvLoopPath = `<polygon points="${loopPoints}" fill="rgba(12, 166, 120, 0.22)" stroke="#0ca678" stroke-width="3" stroke-linejoin="round"/>`;

    // Key points markers
    const esvPt = `<circle cx="${toX(p.esv)}" cy="${toY(p.esp)}" r="5.5" fill="#c92a2a" stroke="#fff" stroke-width="1.8"/>`;
    const edvPt = `<circle cx="${toX(p.edv)}" cy="${toY(p.edp)}" r="5.5" fill="#e67700" stroke="#fff" stroke-width="1.8"/>`;

    svg.innerHTML = `
      ${gridLines.join('')}
      ${axes}
      ${labels.join('')}
      ${edpvrPath}
      ${espvrLine}
      ${eaLine}
      ${pvLoopPath}
      ${esvPt}
      ${edvPt}
    `;
  }

  syncSliders();
  render();

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      render();
    }
  };
}

export const createPVLoopLab = createPvLoopLab;

