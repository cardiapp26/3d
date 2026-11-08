// Interactive PV Loop Lab: Time-varying elastance and ventricular-arterial coupling.
import { PV_PRESETS, PV_V0, pvParams, pvModelLoop } from '../hemo-pv-model.js';
import { PV_SCENARIOS } from './pathophysiology-data.js';
import { createCycleClock, createMotionBar, cyclePhaseAt, loopPointAt, tweenValues, PHASE_TEXT } from './cycle-clock.js';
import { createHemodynamics } from '../hemodynamics.js';
import { samplePvLoop } from '../hemo-pv-loop.js';

// Catheter scenarios that have a matching elastance preset: choosing one also sets the sliders.
const CATH_PRESET = { normal: 'normal', aortic_stenosis_severe: 'as', aortic_regurgitation_severe: 'ar', mitral_regurgitation_severe: 'mr', acute_lv_failure: 'hfref' };

// Plot frame shared by the static and live layers.
const W = 540, H = 380, PAD = { l: 50, r: 20, t: 30, b: 40 }, X_MAX = 280, Y_MAX = 240;
const toX = v => PAD.l + (v / X_MAX) * (W - PAD.l - PAD.r);
const toY = p => H - PAD.b - (p / Y_MAX) * (H - PAD.t - PAD.b);
const VALVE_EVENTS = [
  { key: 'mvClose', at: p => p.phases.ivc[0], tr: 'MK kapanır', en: 'MV closes', dx: 8, dy: 16 },
  { key: 'avOpen', at: p => p.phases.ejection[0], tr: 'AK açılır', en: 'AV opens', dx: 8, dy: -8 },
  { key: 'avClose', at: p => p.phases.ivr[0], tr: 'AK kapanır', en: 'AV closes', dx: -8, dy: -10, anchor: 'end' },
  { key: 'mvOpen', at: () => 0, tr: 'MK açılır', en: 'MV opens', dx: -8, dy: 16, anchor: 'end' }
];

export function createPvLoopLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-pv-lab';

  let currentPreset = 'normal';
  let params = { ...PV_SCENARIOS[0].params };
  const HR = 75; // typical resting heart rate for cardiac output calculation
  // Loop on screen: glides toward `params` when a slider or preset changes.
  let shown = { ...params }, shownLoop = null, cancelTween = () => {};
  const clock = createCycleClock({ bpm: HR, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: { tr: 'Canlı döngü:', en: 'Live loop:' } });

  root.innerHTML = `
    <div class="pathophys-presets-bar" role="group" aria-label="Presets"></div>
    <div class="pathophys-cath-row">
      <label><span data-i18n-pv="cathLabel"></span> <select data-pv-cath></select></label>
      <p data-pv-cath-note></p>
    </div>
    <div class="pathophys-grid">
      <div class="pathophys-stage">
        <svg viewBox="0 0 540 380" class="pathophys-svg pathophys-pv-svg" role="img" aria-label="Pressure-Volume Loop">
          <g data-pv-static></g>
          <g data-pv-live>
            <polyline data-pv-trace fill="none" stroke="#087f5b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
            <g data-pv-events></g>
            <circle data-pv-dot r="8" fill="#0b7285" stroke="#fff" stroke-width="2.5"/>
            <g data-pv-lv transform="translate(468 70)">
              <ellipse data-pv-lv-cavity cx="0" cy="0" rx="22" ry="34" fill="#f8d7da" stroke="#8c2d38" stroke-width="5"/>
              <text data-pv-lv-text y="58" text-anchor="middle" class="axis-num"></text>
            </g>
            <text data-pv-live-text x="${PAD.l + 10}" y="${PAD.t + 14}" class="pv-live-text"></text>
          </g>
        </svg>
        <div class="pathophys-legend">
          <span><i class="legend-color legend-pv"></i> <strong data-i18n-pv="loop"></strong></span>
          <span><i class="legend-color legend-espvr"></i> <strong data-i18n-pv="espvr"></strong></span>
          <span><i class="legend-color legend-edpvr"></i> <strong data-i18n-pv="edpvr"></strong></span>
          <span><i class="legend-color legend-ea"></i> <strong data-i18n-pv="ea"></strong></span>
          <span data-pv-cath-legend hidden><i class="legend-color legend-cath"></i> <strong data-i18n-pv="cathLoop"></strong></span>
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
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rVols">EDV / ESV</span>
            <strong class="readout-value" data-pv-out="vols">--</strong>
          </div>
          <div class="readout-card">
            <span class="readout-title" data-i18n-pv="rEdp">EDP</span>
            <strong class="readout-value" data-pv-out="edp">--</strong>
          </div>
        </div>
        <div class="pathophys-scenario-card">
          <h4 data-pv-scen-title></h4>
          <p data-pv-scen-desc></p>
        </div>
      </div>
    </div>
  `;
  root.prepend(motionBar.element);
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
      glide();
    });
    presetsBar.append(btn);
  });

  // Catheter scenario: its loop (from the catheterization module's pressures) drawn dashed over this one.
  const hemo = createHemodynamics('normal');
  let cathId = '', cathLoop = null;
  const cathSelect = $('[data-pv-cath]');
  cathSelect.addEventListener('change', () => {
    cathId = cathSelect.value;
    cathLoop = cathId && hemo.setScenario(cathId) ? samplePvLoop(hemo, 160) : null;
    const preset = CATH_PRESET[cathId] && PV_SCENARIOS.find(sc => sc.id === CATH_PRESET[cathId]);
    if (preset) { currentPreset = preset.id; params = { ...preset.params }; syncSliders(); glide(); }
    render();
  });

  ['edv', 'ees', 'ea', 'stiffness'].forEach(key => {
    const input = $(`[data-pv-slider="${key}"]`);
    input.addEventListener('input', () => {
      params[key] = Number(input.value);
      currentPreset = 'custom';
      render();
      glide();
    });
  });

  // Animate the drawn loop from what is on screen to the new parameters.
  function glide() {
    cancelTween();
    cancelTween = tweenValues(shown, params, values => { shown = values; drawStatic(); clock.refresh(); });
  }

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
      rEsp: en ? 'Peak / End-systolic Pressure' : 'Tepe / Sistol Sonu Basınç',
      rVols: en ? 'End-diastolic / End-systolic Volume' : 'Diyastol Sonu / Sistol Sonu Hacim',
      rEdp: en ? 'End-diastolic Pressure (EDP)' : 'Diyastol Sonu Basınç (EDP)',
      cathLabel: en ? 'Catheter scenario' : 'Kateter senaryosu',
      cathLoop: en ? 'Catheter scenario loop' : 'Kateter senaryosu döngüsü'
    };
    $$('[data-i18n-pv]').forEach(node => {
      const k = node.dataset.i18nPv;
      if (I18N[k]) node.textContent = I18N[k];
    });
    // Catheter scenario picker; labels follow the language.
    const lang = en ? 'en' : 'tr';
    cathSelect.replaceChildren(
      Object.assign(document.createElement('option'), { value: '', textContent: en ? 'None' : 'Seçilmedi' }),
      ...hemo.listScenarios().map(({ id, label: name }) => Object.assign(document.createElement('option'), { value: id, textContent: name[lang] || name.tr }))
    );
    cathSelect.value = cathId;
    $('[data-pv-cath-note]').textContent = cathId
      ? (en ? 'Dashed: this scenario\'s loop from the catheterization module pressures (forward volume in regurgitant lesions). Bring the solid loop toward it with the sliders.'
        : 'Kesik çizgi: bu senaryonun kateterizasyon modülündeki basınçlardan çizilen döngüsü (yetersizliklerde ileri hacim). Kaydırıcılarla düz döngüyü ona yaklaştırın.')
      : (en ? 'Overlay the loop of a catheterization scenario on this plot.' : 'Bir kateterizasyon senaryosunun döngüsünü bu grafiğin üstüne çizin.');
    $('[data-pv-cath-legend]').hidden = !cathLoop;

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
    $('[data-pv-out="vols"]').textContent = `${Math.round(p.edv)} / ${Math.round(p.esv)} mL`;
    $('[data-pv-out="edp"]').textContent = `${Math.round(p.edp)} mmHg`;

    // Active scenario info
    const activeScen = PV_SCENARIOS.find(s => s.id === currentPreset) || {
      name: t({ tr: 'Özel Ayar', en: 'Custom Adjustment' }),
      desc: t({ tr: 'Sürgülerle dinamik olarak değiştirilmiş ventrikül parametreleri.', en: 'Dynamically adjusted ventricular mechanics parameters.' })
    };
    $('[data-pv-scen-title]').textContent = typeof activeScen.name === 'object' ? t(activeScen.name) : activeScen.name;
    $('[data-pv-scen-desc]').textContent = typeof activeScen.desc === 'object' ? t(activeScen.desc) : activeScen.desc;

    drawStatic();
    clock.refresh();
  }

  /** Grid, axes, ESPVR, EDPVR, Ea and the loop for the parameters on screen. */
  /** Dashed loop of the chosen catheter scenario, clipped to the plot. */
  function cathPath() {
    if (!cathLoop) return '';
    const pts = cathLoop.points.map(s => `${toX(Math.min(X_MAX, s.v)).toFixed(1)},${toY(Math.min(Y_MAX, s.p)).toFixed(1)}`).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#7048e8" stroke-width="2.5" stroke-dasharray="7 5" stroke-linejoin="round" data-pv-cath-loop/>`;
  }

  function drawStatic() {
    const currentParams = shown;
    const p = pvModelLoop(pvParams(shown, currentPreset || 'normal'));
    shownLoop = p;
    const layer = $('[data-pv-static]');

    // Coordinate mapping
    // X: Volume 0 to 280 mL
    // Y: Pressure 0 to 240 mmHg
    const yMax = Y_MAX;
    const padL = PAD.l, padR = PAD.r, padT = PAD.t, padB = PAD.b, w = W, h = H;

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

    layer.innerHTML = `
      ${gridLines.join('')}
      ${axes}
      ${labels.join('')}
      ${edpvrPath}
      ${espvrLine}
      ${eaLine}
      ${pvLoopPath}
      ${esvPt}
      ${edvPt}
      ${cathPath()}
    `;
  }

  /** Live layer: moving point, traced segment, valve events and the beating LV glyph. */
  function drawLive(state) {
    const p = shownLoop;
    if (!p) return;
    const en = getLang() === 'en';
    const u = state.phase, pt = loopPointAt(p.points, u), phase = cyclePhaseAt(u, p.phases);
    const dot = $('[data-pv-dot]');
    dot.setAttribute('cx', toX(pt.v).toFixed(1));
    dot.setAttribute('cy', toY(pt.p).toFixed(1));
    // Trace the current phase only, so each phase lights up in turn.
    const start = { filling: 0, ivc: p.phases.ivc[0], ejection: p.phases.ejection[0], ivr: p.phases.ivr[0] }[phase];
    const trace = p.points.filter(s => s.u >= start && s.u <= u).concat([{ ...pt }]);
    $('[data-pv-trace]').setAttribute('points', trace.map(s => `${toX(s.v).toFixed(1)},${toY(s.p).toFixed(1)}`).join(' '));
    $('[data-pv-events]').innerHTML = VALVE_EVENTS.map(ev => {
      const at = ev.at(p), q = loopPointAt(p.points, at);
      const near = Math.min(Math.abs(u - at), 1 - Math.abs(u - at)) < 0.04;
      const x = toX(q.v), y = toY(q.p);
      return `<g class="pv-event${near ? ' is-now' : ''}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${near ? 6 : 3.5}"/>
        <text x="${(x + ev.dx).toFixed(1)}" y="${(y + ev.dy).toFixed(1)}" text-anchor="${ev.anchor || 'start'}">${en ? ev.en : ev.tr}</text></g>`;
    }).join('');
    // LV glyph: cavity width follows volume, colour follows pressure.
    const k = Math.sqrt(pt.v / 140), heat = Math.min(1, pt.p / 160);
    const cav = $('[data-pv-lv-cavity]');
    cav.setAttribute('rx', (22 * k).toFixed(1));
    cav.setAttribute('ry', (34 * Math.cbrt(pt.v / 140)).toFixed(1));
    cav.setAttribute('fill', `rgb(${Math.round(248 - 40 * heat)},${Math.round(215 - 150 * heat)},${Math.round(218 - 150 * heat)})`);
    $('[data-pv-lv-text]').textContent = `${Math.round(pt.v)} mL`;
    $('[data-pv-live-text]').textContent = `${PHASE_TEXT[phase][en ? 'en' : 'tr']} · ${Math.round(pt.v)} mL · ${Math.round(pt.p)} mmHg`;
    motionBar.render(state, phase);
  }

  syncSliders();
  render();
  const unsubscribe = clock.subscribe(drawLive);

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      motionBar.setLanguage();
      render();
    },
    getState: () => ({ phase: clock.getState().phase, playing: clock.getState().playing, preset: currentPreset, cath: cathId || null }),
    destroy() { cancelTween(); unsubscribe(); clock.destroy(); root.remove(); }
  };
}

export const createPVLoopLab = createPvLoopLab;

