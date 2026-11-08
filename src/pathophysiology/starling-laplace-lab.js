// Frank-Starling Law and Laplace Wall Stress interactive simulator.
import { wallStress } from '../hemo-loads-model.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';

const INOTROPY = Object.freeze({ enhanced: { max: 130, k: 0.016 }, normal: { max: 95, k: 0.014 }, depressed: { max: 55, k: 0.012 } });
const strokeVolume = (edv, state) => Math.max(10, INOTROPY[state].max * (1 - Math.exp(-INOTROPY[state].k * Math.max(0, edv - 35))));
const LAPLACE_REFERENCE = Object.freeze({ p: 120, r: 2.5, h: 1.0 });
const LAPLACE_PRESETS = {
  normal: LAPLACE_REFERENCE,
  concentric: { p: 200, r: 2.3, h: 1.8 },
  eccentric: { p: 125, r: 4.2, h: 0.75 },
  radius: { ...LAPLACE_REFERENCE, r: 3.5 },
  thickness: { ...LAPLACE_REFERENCE, h: 1.5 }
};
/** End-diastolic sarcomere length (µm): 1.75 at small EDV to 2.3 at large EDV. */
export const diastolicSarcomere = edv => 1.75 + 0.55 * Math.min(1, Math.max(0, (edv - 60) / 190));
/** Sarcomere length during the beat: shortens with the ejected fraction. */
export const sarcomereAt = (edv, sv, contraction) => {
  const ld = diastolicSarcomere(edv);
  return ld - (ld - 1.6) * Math.min(1, (sv / edv) / 0.7) * contraction;
};
/** Laplace geometry during the beat: wall area held constant, so the wall thickens as the cavity shrinks. */
export function laplaceAt(lap, shape) {
  const pressure = lap.p * (0.08 + 0.92 * shape.pressure);
  const r = lap.r * (1 - 0.22 * shape.contraction);
  const area = (lap.r + lap.h) ** 2 - lap.r ** 2;
  const h = Math.sqrt(r * r + area) - r;
  return { p: pressure, r, h, sigma: wallStress({ p: pressure, r, h }) };
}
// Stress colour: teal at rest, amber near 160, red from 280 mmHg.
function stressColor(sigma) {
  const stops = [[0, [47, 125, 98]], [160, [230, 119, 0]], [280, [217, 38, 38]]];
  const x = Math.min(280, Math.max(0, sigma));
  const i = x <= 160 ? 0 : 1, [a, ca] = stops[i], [b, cb] = stops[i + 1], f = (x - a) / (b - a);
  return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * f)).join(',')})`;
}

export function createStarlingLaplaceLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-starling-lab';

  let edv = 130;
  let inotropyState = 'normal'; // 'normal', 'enhanced', 'depressed'

  // Laplace parameters: P (mmHg), r (cm), h (cm)
  let laplace = { ...LAPLACE_REFERENCE };
  let currentLaplacePreset = 'normal';
  // Values on screen glide toward the chosen ones.
  let shownStarling = { edv, sv: strokeVolume(edv, inotropyState) }, shownLap = { ...laplace };
  let cancelStarling = () => {}, cancelLap = () => {};
  const clock = createCycleClock({ bpm: 75, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: { tr: 'Canlı kalp atımı:', en: 'Live heartbeat:' } });

  root.innerHTML = `
    <div class="pathophys-sl-grid">
      <!-- Section 1: Frank-Starling Mechanism -->
      <section class="pathophys-card">
        <div class="card-head">
          <h3 data-sl="starlingTitle"></h3>
          <p data-sl="starlingIntro"></p>
        </div>
        <div class="starling-visual">
          <svg viewBox="0 0 480 260" class="pathophys-svg starling-svg" role="img" aria-label="Frank-Starling Curve">
            <g data-starling-static></g>
            <circle data-starling-pulse r="7" fill="none" stroke="#1f4fd1" stroke-width="2"/>
          </svg>
          <svg viewBox="0 0 480 110" class="pathophys-svg sarcomere-svg" role="img" aria-label="Sarcomere"></svg>
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
            <input type="range" data-laplace-slider="h" min="0.6" max="2.2" step="0.05">
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
        <div class="clinical-desc-box">
          <h4 data-sl="laplaceCompareTitle"></h4>
          <div class="laplace-presets-row">
            <button type="button" class="laplace-preset-btn" data-lap-preset="radius" data-sl="presRadius"></button>
            <button type="button" class="laplace-preset-btn" data-lap-preset="thickness" data-sl="presThickness"></button>
          </div>
          <p><output data-laplace-comparison></output></p>
          <p data-sl="laplaceClinical"></p>
          <p>
            <a href="https://www.jci.org/articles/view/108079" target="_blank" rel="noopener noreferrer">Grossman et al. (1975)</a> ·
            <a href="https://www.jci.org/articles/view/105734" target="_blank" rel="noopener noreferrer">Graham et al. (1968)</a>
          </p>
        </div>
      </section>
    </div>
  `;
  root.prepend(motionBar.element);
  mount.append(root);

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  // Inotropy buttons
  $$('[data-inotrop]').forEach(btn => {
    btn.addEventListener('click', () => {
      inotropyState = btn.dataset.inotrop;
      render();
      glideStarling();
    });
  });

  // Starling Preload Slider
  $('[data-starling-edv]').addEventListener('input', e => {
    edv = Number(e.target.value);
    $('[data-starling-edv-val]').textContent = `${edv} mL`;
    render();
    glideStarling();
  });

  $$('[data-lap-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLaplacePreset = btn.dataset.lapPreset;
      laplace = { ...LAPLACE_PRESETS[currentLaplacePreset] };
      syncLaplaceSliders();
      render();
      glideLaplace();
    });
  });

  ['p', 'r', 'h'].forEach(k => {
    $(`[data-laplace-slider="${k}"]`).addEventListener('input', e => {
      laplace[k] = Number(e.target.value);
      currentLaplacePreset = 'custom';
      render();
      glideLaplace();
    });
  });

  function glideStarling() {
    cancelStarling();
    cancelStarling = tweenValues(shownStarling, { edv, sv: strokeVolume(edv, inotropyState) }, v => {
      shownStarling = v; drawStarlingSvg(v.edv, inotropyState, v.sv); clock.refresh();
    });
  }
  function glideLaplace() {
    cancelLap();
    cancelLap = tweenValues(shownLap, laplace, v => { shownLap = v; clock.refresh(); });
  }

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
        ? 'The thin-walled sphere approximates wall stress as σ ≈ P·r / (2h). P is transmural pressure. The diagram follows the beat, and the readout uses the selected inputs.'
        : 'İnce duvarlı küre yaklaşımında duvar stresi σ ≈ P·r / (2h). P, transmural basınç farkıdır. Çizim atım boyunca değişir, hesap ise seçilen girdileri kullanır.',
      presNorm: en ? 'Normal Baseline' : 'Normal Referans',
      presConc: en ? 'Concentric Hypertrophy (AS/HTN)' : 'Konsantrik Hipertrofi (AD/HT)',
      presEcc: en ? 'Eccentric Dilation (DCM)' : 'Eksantrik Dilatasyon (KMP)',
      laplaceCompareTitle: en ? 'One variable at a time' : 'Tek değişkenli karşılaştırma',
      presRadius: en ? 'Increase radius (r)' : 'Yarıçapı artır (r)',
      presThickness: en ? 'Increase thickness (h)' : 'Kalınlığı artır (h)',
      laplaceClinical: en
        ? 'In heart failure, dilation raises wall stress if pressure and thickness stay the same. Higher stress can increase myocardial oxygen demand and contribute to remodeling. Heart rate and contractility also affect oxygen demand. At the same pressure and radius, concentric thickening reduces stress.'
        : 'Kalp yetersizliğinde, basınç ve duvar kalınlığı sabitse dilatasyon duvar stresini artırır. Yüksek stres miyokardın oksijen talebini artırabilir ve yeniden şekillenmeye katkıda bulunabilir. Kalp hızı ve kontraktilite de oksijen talebini etkiler. Aynı basınç ve yarıçapta konsantrik kalınlaşma stresi azaltır.',
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
    const currentSv = strokeVolume(edv, inotropyState);
    const tensionRel = ((currentSv / 75) * 100).toFixed(0);

    $('[data-starling-sv]').textContent = `${currentSv.toFixed(0)} mL`;
    $('[data-starling-tension]').textContent = `${tensionRel}%`;

    drawStarlingSvg(shownStarling.edv, inotropyState, shownStarling.sv);

    // Laplace Calculation
    $$('[data-lap-preset]').forEach(btn => {
      const selected = btn.dataset.lapPreset === currentLaplacePreset;
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('active', selected);
    });

    $('[data-laplace-val="p"]').textContent = `${laplace.p} mmHg`;
    $('[data-laplace-val="r"]').textContent = `${laplace.r.toFixed(1)} cm`;
    $('[data-laplace-val="h"]').textContent = `${laplace.h.toFixed(2).replace(/0$/, '')} cm`;

    const sigma = wallStress(laplace);
    $('[data-laplace-stress]').textContent = `${Math.round(sigma)} mmHg`;
    const comparison = $('[data-laplace-comparison]');
    if (currentLaplacePreset === 'radius' || currentLaplacePreset === 'thickness') {
      const fixed = currentLaplacePreset === 'radius' ? 'P, h' : 'P, r';
      const referenceStress = wallStress(LAPLACE_REFERENCE);
      comparison.textContent = `${Math.round(referenceStress)} → ${Math.round(sigma)} mmHg · ${fixed} ${en ? 'fixed' : 'sabit'}`;
    } else {
      comparison.textContent = en
        ? 'Both comparisons start from the normal baseline.'
        : 'İki karşılaştırma da normal referans ayarlarından başlar.';
    }

    // Remodeling classification
    const rH = laplace.r / laplace.h; // normal is ~2.5 - 3.0
    let remodelText = en ? 'Normal Geometry' : 'Normal Geometri';
    if (laplace.h >= 1.5 && rH <= 2.2) remodelText = en ? 'Concentric Hypertrophy' : 'Konsantrik Hipertrofi';
    else if (laplace.r >= 3.6 && laplace.h <= 0.9) remodelText = en ? 'Eccentric Dilation' : 'Eksantrik Dilatasyon';
    else if (laplace.h >= 1.4 && laplace.r >= 3.5) remodelText = en ? 'Mixed Remodeling' : 'Mikst Hipertrofi / Dilatasyon';
    $('[data-laplace-remodel-status]').textContent = remodelText;

    clock.refresh();
  }

  function drawStarlingSvg(curEdv, inotrop, curSv) {
    const svg = $('[data-starling-static]');
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
    const en = getLang() === 'en';
    const cx = 240, cy = 130;

    // Radius scaling: 1 cm -> 26 pixels
    const scale = 26;
    const rInner = lap.r * scale;
    const rOuter = (lap.r + lap.h) * scale;

    // Stress color scale: from calm teal (<=120) to amber (180) to bright crimson (>=280)
    const muscleColor = stressColor(sigma);
    const arrow = 0.35 + 0.45 * Math.min(1, lap.p / 220);

    svg.innerHTML = `
      <!-- Outer Myocardium ring -->
      <circle cx="${cx}" cy="${cy}" r="${rOuter.toFixed(1)}" fill="${muscleColor}" opacity="0.88" stroke="#1c3028" stroke-width="2"/>
      <!-- Inner Cavity (Lumen) -->
      <circle cx="${cx}" cy="${cy}" r="${rInner.toFixed(1)}" fill="#fdfaf3" stroke="#8c2d38" stroke-width="2"/>
      
      <!-- Arrows inside lumen representing cavity pressure P -->
      <g stroke="#c92a2a" stroke-width="1.8" opacity="0.75" marker-end="url(#laplace-arrow)">
        <line x1="${cx}" y1="${cy}" x2="${(cx + rInner * arrow).toFixed(1)}" y2="${cy}"/>
        <line x1="${cx}" y1="${cy}" x2="${(cx - rInner * arrow).toFixed(1)}" y2="${cy}"/>
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - rInner * arrow).toFixed(1)}"/>
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy + rInner * arrow).toFixed(1)}"/>
      </g>
      
      <!-- Cavity Label -->
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-weight="700" font-size="13" fill="#691b17">P = ${Math.round(lap.p)}</text>
      <text x="${cx}" y="248" text-anchor="middle" font-weight="700" font-size="12" fill="#1c3028">${en ? 'Instant' : 'Anlık'} σ = ${Math.round(sigma)} mmHg</text>
      
      <!-- Radius Dimension Dimension line -->
      <line x1="${cx}" y1="${cy}" x2="${(cx + rInner).toFixed(1)}" y2="${cy}" stroke="#1f4fd1" stroke-width="2"/>
      <text x="${(cx + rInner / 2).toFixed(1)}" y="${cy - 7}" text-anchor="middle" font-weight="700" font-size="11" fill="#1f4fd1">r = ${lap.r.toFixed(1)}</text>
      
      <!-- Wall Thickness Dimension line -->
      <line x1="${(cx + rInner).toFixed(1)}" y1="${cy}" x2="${(cx + rOuter).toFixed(1)}" y2="${cy}" stroke="#ffffff" stroke-width="2.5"/>
      <text x="${(cx + rInner + (rOuter - rInner) / 2).toFixed(1)}" y="${cy - 8}" text-anchor="middle" font-weight="800" font-size="11" fill="#ffffff">h = ${lap.h.toFixed(1)}</text>
    `;
  }

  /** Sarcomere: Z lines, thin (actin) and thick (myosin) filaments at length L µm. */
  function drawSarcomere(L, ld) {
    const en = getLang() === 'en';
    const s = 120, cx = 240, cy = 52, half = (L * s) / 2, actin = 1.0 * s, myo = 0.8 * s;
    const zl = cx - half, zr = cx + half;
    const rows = [-18, -6, 6, 18];
    const thin = rows.map(y => `<line x1="${zl}" y1="${cy + y}" x2="${zl + actin}" y2="${cy + y}"/><line x1="${zr}" y1="${cy + y}" x2="${zr - actin}" y2="${cy + y}"/>`).join('');
    const thick = [-12, 0, 12].map(y => {
      const heads = [];
      for (let x = cx - myo + 8; x <= cx + myo - 8; x += 12) if (Math.abs(x - cx) > 10) heads.push(`<line x1="${x}" y1="${cy + y}" x2="${x + (x < cx ? -4 : 4)}" y2="${cy + y - 4}"/>`);
      return `<line x1="${cx - myo}" y1="${cy + y}" x2="${cx + myo}" y2="${cy + y}" stroke-width="5"/>${heads.join('')}`;
    }).join('');
    const overlap = Math.max(0, Math.min(zl + actin, cx + myo) - Math.max(zl, cx - myo));
    $('.sarcomere-svg').innerHTML = `
      <rect x="${(cx - myo).toFixed(1)}" y="${cy - 26}" width="${(2 * myo).toFixed(1)}" height="52" fill="#fff3bf" opacity="0.7"/>
      <g stroke="#1971c2" stroke-width="2">${thin}</g>
      <g stroke="#c2255c" stroke-width="2">${thick}</g>
      <g stroke="#343a40" stroke-width="3"><line x1="${zl}" y1="${cy - 28}" x2="${zl}" y2="${cy + 28}"/><line x1="${zr}" y1="${cy - 28}" x2="${zr}" y2="${cy + 28}"/></g>
      <text x="12" y="20" class="axis-num">${en ? 'Sarcomere' : 'Sarkomer'}: ${L.toFixed(2)} µm</text>
      <text x="12" y="98" class="axis-num">${en ? 'End-diastole' : 'Diyastol sonu'}: ${ld.toFixed(2)} µm · ${en ? 'overlap' : 'örtüşme'} ${(overlap / s).toFixed(2)} µm</text>
      <text x="468" y="98" text-anchor="end" class="axis-num"><tspan fill="#1971c2">${en ? 'actin' : 'aktin'}</tspan> · <tspan fill="#c2255c">${en ? 'myosin' : 'miyozin'}</tspan></text>`;
  }

  function drawLive(state) {
    const shape = cycleShape(state.phase);
    const { edv: e, sv } = shownStarling;
    drawSarcomere(sarcomereAt(e, sv, shape.contraction), diastolicSarcomere(e));
    // Operating point pulses with each beat.
    const pulse = $('[data-starling-pulse]'), dot = $('[data-starling-static] circle');
    if (dot) {
      pulse.setAttribute('cx', dot.getAttribute('cx'));
      pulse.setAttribute('cy', dot.getAttribute('cy'));
      pulse.setAttribute('r', (7 + 12 * shape.contraction).toFixed(1));
      pulse.setAttribute('opacity', (1 - 0.8 * shape.contraction).toFixed(2));
    }
    const live = laplaceAt(shownLap, shape);
    drawLaplaceSvg(live, live.sigma);
    motionBar.render(state, shape.phase);
  }

  syncLaplaceSliders();
  render();
  const unsubscribe = clock.subscribe(drawLive);

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      motionBar.setLanguage();
      render();
    },
    getState: () => ({ phase: clock.getState().phase, playing: clock.getState().playing, laplace: laplaceAt(shownLap, cycleShape(clock.getState().phase)) }),
    destroy() { cancelStarling(); cancelLap(); unsubscribe(); clock.destroy(); root.remove(); }
  };
}
