// Frank-Starling Law and Laplace Wall Stress interactive simulator.
import { wallStress } from '../hemo-loads-model.js';

export function createStarlingLaplaceLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-starling-lab';

  let edv = 130;
  let inotropyState = 'normal'; // 'normal', 'enhanced', 'depressed'

  // Laplace parameters: P (mmHg), r (cm), h (cm)
  let laplace = { p: 120, r: 2.5, h: 1.0 };
  let currentLaplacePreset = 'normal';

  root.innerHTML = `
    <div class="pathophys-sl-grid">
      <!-- Section 1: Frank-Starling Mechanism -->
      <section class="pathophys-card">
        <div class="card-head">
          <h3 data-sl="starlingTitle"></h3>
          <p data-sl="starlingIntro"></p>
        </div>
        <div class="starling-visual">
          <svg viewBox="0 0 480 260" class="pathophys-svg starling-svg" role="img" aria-label="Frank-Starling Curve"></svg>
        </div>
        <div class="starling-controls">
          <div class="pathophys-segmented" role="group" aria-label="Inotropic State">
            <button type="button" class="seg-btn" data-inotrop="enhanced" data-sl="btnInoPlus"></button>
            <button type="button" class="seg-btn" data-inotrop="normal" data-sl="btnInoNorm"></button>
            <button type="button" class="seg-btn" data-inotrop="depressed" data-sl="btnInoFail"></button>
          </div>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-sl="lblPreload"></strong> <small>(mL)</small></span>
            <input type="range" data-starling-edv min="60" max="250" step="5" value="130">
            <span class="slider-val" data-starling-edv-val>130 mL</span>
          </label>
          <div class="starling-readout-row">
            <div class="readout-card">
              <span class="readout-title" data-sl="lblSv"></span>
              <strong class="readout-value" data-starling-sv>--</strong>
            </div>
            <div class="readout-card">
              <span class="readout-title" data-sl="lblTension"></span>
              <strong class="readout-value" data-starling-tension>--</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Laplace Law and Wall Stress -->
      <section class="pathophys-card">
        <div class="card-head">
          <h3 data-sl="laplaceTitle"></h3>
          <p data-sl="laplaceIntro"></p>
        </div>
        <div class="laplace-visual">
          <svg viewBox="0 0 480 260" class="pathophys-svg laplace-svg" role="img" aria-label="LV Cross Section"></svg>
        </div>
        <div class="laplace-presets-row" role="group" aria-label="Laplace Presets">
          <button type="button" class="laplace-preset-btn" data-lap-preset="normal" data-sl="presNorm"></button>
          <button type="button" class="laplace-preset-btn" data-lap-preset="concentric" data-sl="presConc"></button>
          <button type="button" class="laplace-preset-btn" data-lap-preset="eccentric" data-sl="presEcc"></button>
        </div>
        <div class="laplace-controls">
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-sl="lblP"></strong> <small>(mmHg)</small></span>
            <input type="range" data-laplace-slider="p" min="70" max="220" step="5">
            <span class="slider-val" data-laplace-val="p"></span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-sl="lblR"></strong> <small>(cm)</small></span>
            <input type="range" data-laplace-slider="r" min="1.8" max="4.6" step="0.1">
            <span class="slider-val" data-laplace-val="r"></span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-sl="lblH"></strong> <small>(cm)</small></span>
            <input type="range" data-laplace-slider="h" min="0.6" max="2.2" step="0.1">
            <span class="slider-val" data-laplace-val="h"></span>
          </label>
          <div class="laplace-readout-row">
            <div class="readout-card stress-card">
              <span class="readout-title" data-sl="lblStress"></span>
              <strong class="readout-value" data-laplace-stress>--</strong>
            </div>
            <div class="readout-card">
              <span class="readout-title" data-sl="lblRemodel"></span>
              <strong class="readout-value" data-laplace-remodel-status>--</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  // Inotropy buttons
  $$('[data-inotrop]').forEach(btn => {
    btn.addEventListener('click', () => {
      inotropyState = btn.dataset.inotrop;
      render();
    });
  });

  // Starling Preload Slider
  $('[data-starling-edv]').addEventListener('input', e => {
    edv = Number(e.target.value);
    $('[data-starling-edv-val]').textContent = `${edv} mL`;
    render();
  });

  // Laplace Presets
  const LAPLACE_PRESETS = {
    normal: { p: 120, r: 2.5, h: 1.0 },
    concentric: { p: 200, r: 2.3, h: 1.8 }, // Aortic stenosis / HTN
    eccentric: { p: 125, r: 4.2, h: 0.75 }  // Dilated cardiomyopathy / severe MR
  };

  $$('[data-lap-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLaplacePreset = btn.dataset.lapPreset;
      laplace = { ...LAPLACE_PRESETS[currentLaplacePreset] };
      syncLaplaceSliders();
      render();
    });
  });

  ['p', 'r', 'h'].forEach(k => {
    $(`[data-laplace-slider="${k}"]`).addEventListener('input', e => {
      laplace[k] = Number(e.target.value);
      currentLaplacePreset = 'custom';
      render();
    });
  });

  function syncLaplaceSliders() {
    ['p', 'r', 'h'].forEach(k => {
      $(`[data-laplace-slider="${k}"]`).value = laplace[k];
    });
  }

  function render() {
    const en = getLang() === 'en';

    // Text translations
    const TEXT = {
      starlingTitle: en ? 'Frank-Starling Length-Tension Mechanism' : 'Frank-Starling Gerim-Uzunluk Mekanizması',
      starlingIntro: en
        ? 'As end-diastolic volume increases, myofilament overlap and calcium sensitivity rise, generating greater stroke volume.'
        : 'Ön-yük (EDV) arttıkça sarkomer boyu ve kalsiyum duyarlılığı artar, miyokard daha güçlü kasılarak vuru hacmini büyütür.',
      btnInoPlus: en ? 'Increased Inotropy' : 'Artmış İnotropi',
      btnInoNorm: en ? 'Normal' : 'Normal',
      btnInoFail: en ? 'Heart Failure' : 'Kalp Yetersizliği',
      lblPreload: en ? 'Preload (EDV)' : 'Ön-yük (EDV)',
      lblSv: en ? 'Stroke Volume (SV)' : 'Vuru Hacmi (SV)',
      lblTension: en ? 'Myocardial Tension' : 'Miyokard Gerimi',
      laplaceTitle: en ? 'Laplace Law & Myocardial Wall Stress' : 'Laplace Yasası ve Duvar Gerimi',
      laplaceIntro: en
        ? 'Wall stress (σ = P·r / 2h): High pressure triggers concentric thickening (h↑), whereas volume overload thins the wall (r↑, h↓), multiplying stress.'
        : 'Duvar gerimi (σ = P·r / 2h): Basınç yükü konsantrik kalınlaşmayı (h↑), hacim dilatasyonu ise duvar incelmesini (r↑, h↓) tetikler.',
      presNorm: en ? 'Normal Baseline' : 'Normal Referans',
      presConc: en ? 'Concentric Hypertrophy (AS/HTN)' : 'Konsantrik Hipertrofi (AD/HT)',
      presEcc: en ? 'Eccentric Dilation (DCM)' : 'Eksantrik Dilatasyon (KMP)',
      lblP: en ? 'Systolic Pressure (P)' : 'Sistolik Basınç (P)',
      lblR: en ? 'Cavity Radius (r)' : 'Kavite Yarıçapı (r)',
      lblH: en ? 'Wall Thickness (h)' : 'Duvar Kalınlığı (h)',
      lblStress: en ? 'Wall Stress (σ)' : 'Duvar Stresi (σ)',
      lblRemodel: en ? 'Remodeling Pattern' : 'Yeniden Yapılanma'
    };

    Object.entries(TEXT).forEach(([k, str]) => {
      const el = $(`[data-sl="${k}"]`);
      if (el) el.textContent = str;
    });

    // Inotropy active states
    $$('[data-inotrop]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.inotrop === inotropyState));
    });

    // Starling Calculation
    // SV curve function: f(edv) = A * (1 - exp(-k * (edv - 40)))
    const inotropK = { enhanced: { max: 130, k: 0.016 }, normal: { max: 95, k: 0.014 }, depressed: { max: 55, k: 0.012 } }[inotropyState];
    const currentSv = Math.max(10, inotropK.max * (1 - Math.exp(-inotropK.k * Math.max(0, edv - 35))));
    const tensionRel = ((currentSv / 75) * 100).toFixed(0);

    $('[data-starling-sv]').textContent = `${currentSv.toFixed(0)} mL`;
    $('[data-starling-tension]').textContent = `${tensionRel}%`;

    drawStarlingSvg(edv, inotropyState, currentSv);

    // Laplace Calculation
    $$('[data-lap-preset]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lapPreset === currentLaplacePreset));
    });

    $('[data-laplace-val="p"]').textContent = `${laplace.p} mmHg`;
    $('[data-laplace-val="r"]').textContent = `${laplace.r.toFixed(1)} cm`;
    $('[data-laplace-val="h"]').textContent = `${laplace.h.toFixed(1)} cm`;

    // Wall stress: sigma = P * r / (2 * h) (relative units: mmHg * cm / cm = mmHg)
    const sigma = wallStress(laplace);
    $('[data-laplace-stress]').textContent = `${Math.round(sigma)} mmHg`;

    // Remodeling classification
    const rH = laplace.r / laplace.h; // normal is ~2.5 - 3.0
    let remodelText = en ? 'Normal Geometry' : 'Normal Geometri';
    if (laplace.h >= 1.5 && rH <= 2.2) remodelText = en ? 'Concentric Hypertrophy' : 'Konsantrik Hipertrofi';
    else if (laplace.r >= 3.6 && laplace.h <= 0.9) remodelText = en ? 'Eccentric Dilation' : 'Eksantrik Dilatasyon';
    else if (laplace.h >= 1.4 && laplace.r >= 3.5) remodelText = en ? 'Mixed Remodeling' : 'Mikst Hipertrofi / Dilatasyon';
    $('[data-laplace-remodel-status]').textContent = remodelText;

    drawLaplaceSvg(laplace, sigma);
  }

  function drawStarlingSvg(curEdv, inotrop, curSv) {
    const svg = $('.starling-svg');
    const w = 480, h = 260;
    const padL = 48, padR = 20, padT = 25, padB = 35;
    const plotW = w - padL - padR, plotH = h - padT - padB;

    const toX = v => padL + ((v - 50) / 200) * plotW;
    const toY = s => h - padB - ((s - 0) / 140) * plotH;

    const grid = [];
    for (let x = 80; x <= 240; x += 40) {
      grid.push(`<line x1="${toX(x)}" y1="${padT}" x2="${toX(x)}" y2="${h - padB}" stroke="#d5dfd9" stroke-dasharray="3 3"/>`);
      grid.push(`<text x="${toX(x)}" y="${h - padB + 16}" text-anchor="middle" class="axis-num">${x}</text>`);
    }
    for (let y = 30; y <= 120; y += 30) {
      grid.push(`<line x1="${padL}" y1="${toY(y)}" x2="${w - padR}" y2="${toY(y)}" stroke="#d5dfd9" stroke-dasharray="3 3"/>`);
      grid.push(`<text x="${padL - 8}" y="${toY(y) + 4}" text-anchor="end" class="axis-num">${y}</text>`);
    }

    // Draw the 3 inotropic curves
    const makeCurve = cfg => {
      const pts = [];
      for (let x = 50; x <= 250; x += 5) {
        const val = cfg.max * (1 - Math.exp(-cfg.k * Math.max(0, x - 35)));
        pts.push(`${toX(x).toFixed(1)},${toY(val).toFixed(1)}`);
      }
      return pts.join(' ');
    };

    const enhancedPts = makeCurve({ max: 130, k: 0.016 });
    const normalPts = makeCurve({ max: 95, k: 0.014 });
    const depressedPts = makeCurve({ max: 55, k: 0.012 });

    const opEnhanced = inotrop === 'enhanced' ? '1.0' : '0.35';
    const opNormal = inotrop === 'normal' ? '1.0' : '0.35';
    const opDepressed = inotrop === 'depressed' ? '1.0' : '0.35';

    const curPtX = toX(curEdv), curPtY = toY(curSv);

    svg.innerHTML = `
      ${grid.join('')}
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#345445" stroke-width="2"/>
      <text x="${w / 2}" y="${h - 6}" text-anchor="middle" class="axis-title">${getLang() === 'en' ? 'Preload: End-Diastolic Volume (mL)' : 'Ön-yük: Diyastol Sonu Hacim (mL)'}</text>
      <text x="14" y="${h / 2}" text-anchor="middle" transform="rotate(-90 14 ${h / 2})" class="axis-title">${getLang() === 'en' ? 'Stroke Volume (mL)' : 'Vuru Hacmi (mL)'}</text>
      
      <polyline points="${enhancedPts}" fill="none" stroke="#7048e8" stroke-width="2.6" opacity="${opEnhanced}"/>
      <polyline points="${normalPts}" fill="none" stroke="#0ca678" stroke-width="3" opacity="${opNormal}"/>
      <polyline points="${depressedPts}" fill="none" stroke="#e67700" stroke-width="2.6" opacity="${opDepressed}"/>

      <!-- Active Point Indicator -->
      <line x1="${curPtX}" y1="${padT}" x2="${curPtX}" y2="${h - padB}" stroke="#1f4fd1" stroke-dasharray="4 3" opacity="0.7"/>
      <line x1="${padL}" y1="${curPtY}" x2="${w - padR}" y2="${curPtY}" stroke="#1f4fd1" stroke-dasharray="4 3" opacity="0.7"/>
      <circle cx="${curPtX}" cy="${curPtY}" r="7" fill="#1f4fd1" stroke="#ffffff" stroke-width="2.5"/>
    `;
  }

  function drawLaplaceSvg(lap, sigma) {
    const svg = $('.laplace-svg');
    const cx = 240, cy = 130;

    // Radius scaling: 1 cm -> 26 pixels
    const scale = 26;
    const rInner = lap.r * scale;
    const rOuter = (lap.r + lap.h) * scale;

    // Stress color scale: from calm teal (<=120) to amber (180) to bright crimson (>=280)
    let muscleColor = '#2f7d62';
    if (sigma > 160 && sigma <= 240) muscleColor = '#e67700';
    else if (sigma > 240) muscleColor = '#d92626';

    svg.innerHTML = `
      <!-- Outer Myocardium ring -->
      <circle cx="${cx}" cy="${cy}" r="${rOuter.toFixed(1)}" fill="${muscleColor}" opacity="0.88" stroke="#1c3028" stroke-width="2"/>
      <!-- Inner Cavity (Lumen) -->
      <circle cx="${cx}" cy="${cy}" r="${rInner.toFixed(1)}" fill="#fdfaf3" stroke="#8c2d38" stroke-width="2"/>
      
      <!-- Arrows inside lumen representing cavity pressure P -->
      <g stroke="#c92a2a" stroke-width="1.8" opacity="0.75" marker-end="url(#laplace-arrow)">
        <line x1="${cx}" y1="${cy}" x2="${(cx + rInner * 0.7).toFixed(1)}" y2="${cy}"/>
        <line x1="${cx}" y1="${cy}" x2="${(cx - rInner * 0.7).toFixed(1)}" y2="${cy}"/>
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - rInner * 0.7).toFixed(1)}"/>
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy + rInner * 0.7).toFixed(1)}"/>
      </g>
      
      <!-- Cavity Label -->
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-weight="700" font-size="13" fill="#691b17">P = ${lap.p}</text>
      
      <!-- Radius Dimension Dimension line -->
      <line x1="${cx}" y1="${cy}" x2="${(cx + rInner).toFixed(1)}" y2="${cy}" stroke="#1f4fd1" stroke-width="2"/>
      <text x="${(cx + rInner / 2).toFixed(1)}" y="${cy - 7}" text-anchor="middle" font-weight="700" font-size="11" fill="#1f4fd1">r = ${lap.r.toFixed(1)}</text>
      
      <!-- Wall Thickness Dimension line -->
      <line x1="${(cx + rInner).toFixed(1)}" y1="${cy}" x2="${(cx + rOuter).toFixed(1)}" y2="${cy}" stroke="#ffffff" stroke-width="2.5"/>
      <text x="${(cx + rInner + (rOuter - rInner) / 2).toFixed(1)}" y="${cy - 8}" text-anchor="middle" font-weight="800" font-size="11" fill="#ffffff">h = ${lap.h.toFixed(1)}</text>
    `;
  }

  syncLaplaceSliders();
  render();

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      render();
    }
  };
}
