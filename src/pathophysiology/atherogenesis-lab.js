// Interactive Atherogenesis, Cumulative LDL Exposure, MASLD & Immuno-Thrombosis Canvas
// Sources: Boren et al. (2025), Ference & Braunwald (2024), Averna et al. (2026),
// Porsch & Binder (2024), Gelfand et al. (2025), Rashedi et al. (2026).

import { ATHEROMA_STAGES, ATHEROMA_MODIFIERS } from './pathophysiology-data.js';
import { HOTSPOTS } from './atherogenesis-text.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';
import { plaqueGeometry, morphMarkup, immuneLumenMarkup, applyGeometry, animateFlow, flowStep, mixHex } from './atherogenesis-motion.js';
import {
  STAGE_BEATS, beatCount, beatIndex, beatStartU, beatSettledU, stageP,
  proteoglycanMarkup, actorMarkup, collectActors, animateActors, focusFor
} from './atherogenesis-beats.js';

if (typeof document !== 'undefined') import('./atherogenesis-motion.css');

const STORY_HOLD_MS = 4800;
const MORPH_MS = 520;
// Cardiac cycles one stage timeline lasts (about 3.5 s per beat at default 0.5x speed).
const CYCLES_PER_BEAT = 2.1;
const LESION_ENDO = [2, 6];

export function createAtherogenesisLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => opts.lang || 'tr';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-athero-lab';

  let currentStageIndex = 0;
  let currentModifierId = 'physiological';
  let selectedHotspot = 'endothelium';
  let motionEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let apoBFlux = 130;       // LDL-C / ApoB proxy (mg/dL)
  let inflammation = 2.0;   // hsCRP (mg/L)
  let capThickness = 85;    // µm
  let patientAge = 55;      // Years for Ference cumulative exposure
  let statinStartAge = 0;   // 0 = untreated, or 35 / 50

  root.innerHTML = `
    <div class="athero-story-head">
      <div><span class="athero-eyebrow" data-athero-i18n="storyEyebrow"></span>
      <h3 data-athero-i18n="storyTitle"></h3><p data-athero-i18n="storyHint"></p></div>
      <div class="athero-head-actions">
        <button type="button" class="preset-pill" data-athero-story aria-pressed="false"></button>
        <button type="button" class="preset-pill" data-athero-motion aria-pressed="false"></button>
      </div>
    </div>
    <div class="athero-stepper" role="group" aria-label="Stages"></div>
    <div class="athero-story-nav">
      <button type="button" class="preset-pill" data-athero-prev></button>
      <p data-athero-story-status role="status"></p>
      <button type="button" class="preset-pill" data-athero-next></button>
    </div>
    <div class="preset-pill-group" style="margin-top:10px" data-athero-modifiers></div>
    <div class="pathophys-grid">
      <div class="pathophys-stage athero-stage">
        <svg viewBox="0 0 640 340" class="pathophys-svg athero-svg" role="group" aria-label="Atherogenesis Multi-Organ Cross Section"></svg>
        <div class="athero-beat-box">
          <p class="athero-beat-title" data-athero-i18n="beatTitle"></p>
          <ol class="athero-beats" data-athero-beats></ol>
        </div>
        <div class="athero-legend" data-athero-legend aria-hidden="true"></div>
        <div class="athero-hotspot-bar" data-athero-hotspots></div>
        <div class="clinical-desc-box" style="width:100%;margin-top:8px" data-athero-inspector></div>
        <div class="athero-cumulative-box" style="width:100%;margin-top:12px">
          <div class="lab-card-header" style="margin-bottom:6px">
            <div>
              <h4 style="margin:0;font-size:14px" data-athero-i18n="cumTitle"></h4>
              <p style="margin:2px 0 0;font-size:11.5px;color:var(--text-muted)" data-athero-i18n="cumSub"></p>
            </div>
            <div class="pathophys-segmented" data-athero-statin-bar></div>
          </div>
          <svg viewBox="0 0 580 185" class="pathophys-svg athero-cum-svg" role="img" aria-label="Cumulative LDL Exposure Curve"></svg>
        </div>
      </div>
      <div class="pathophys-controls athero-controls">
        <div class="athero-stage-info">
          <h3 data-athero-title></h3>
          <p data-athero-desc></p>
          <ul class="athero-feature-list" data-athero-features></ul>
        </div>

        <div class="clinical-desc-box" data-athero-mod-card></div>

        <div class="pathophys-sliders">
          <div class="card-head">
            <h3 data-athero-i18n="simTitle"></h3>
          </div>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblApoB"></strong> <small>(mg/dL)</small></span>
            <input type="range" data-athero-slider="apob" min="40" max="240" step="5" value="130">
            <span class="slider-val" data-athero-val="apob">130 mg/dL</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblAge"></strong> <small>(yıl / yrs)</small></span>
            <input type="range" data-athero-slider="age" min="20" max="80" step="1" value="55">
            <span class="slider-val" data-athero-val="age">55</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblCrp"></strong> <small>(hsCRP mg/L)</small></span>
            <input type="range" data-athero-slider="crp" min="0.5" max="10.0" step="0.5" value="2.0">
            <span class="slider-val" data-athero-val="crp">2.0 mg/L</span>
          </label>
          <label class="pathophys-slider-row">
            <span class="slider-label"><strong data-athero-i18n="lblCap"></strong> <small>(µm)</small></span>
            <input type="range" data-athero-slider="cap" min="25" max="150" step="5" value="85">
            <span class="slider-val" data-athero-val="cap">85 µm</span>
          </label>
        </div>

        <div class="athero-vulnerability-card">
          <div class="vulnerability-header">
            <span class="vulnerability-label" data-athero-i18n="lblVuln"></span>
            <strong class="vulnerability-badge" data-athero-vuln-badge></strong>
          </div>
          <div class="vulnerability-bar-track">
            <div class="vulnerability-bar-fill" data-athero-vuln-bar></div>
          </div>
          <p class="vulnerability-note" data-athero-vuln-note></p>
        </div>
      </div>
    </div>
  `;

  mount.append(root);
  root.classList.add('athero-clocked');

  const clock = createCycleClock({ bpm: 72, speed: 0.5 });
  const motionBar = createMotionBar(clock, {
    getLang,
    label: { tr: 'Kalp döngüsü · nabızlı akım', en: 'Cardiac cycle · pulsatile flow' }
  });
  root.prepend(motionBar.element);
  let morph = { p: 0 };
  let cancelMorph = () => {};
  let storyTimer = null;
  let storyOn = false;
  let refs = null;
  let flowS = 0, cellT = 0, lastPhase = null;
  let stageU = 0;           // progress through the current stage's beats (0..1)
  let holdUntil = 0;        // timeline waits while the plaque morphs to a new start
  let shownBeat = -1;
  const lastStage = ATHEROMA_STAGES.length - 1;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = sel => root.querySelector(sel);
  const $$ = sel => Array.from(root.querySelectorAll(sel));
  const t = obj => (getLang() === 'en' ? obj.en : obj.tr);

  $$('[data-athero-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const k = input.dataset.atheroSlider;
      const v = parseFloat(input.value);
      if (k === 'apob') apoBFlux = v;
      if (k === 'age') patientAge = v;
      if (k === 'crp') inflammation = v;
      if (k === 'cap') capThickness = v;
      render();
    });
  });

  const stageTargets = ['endothelium', 'proteoglycan', 'foamcell', 'cap', 'cap'];
  function stopStory() {
    if (storyTimer != null) clearTimeout(storyTimer);
    storyTimer = null;
    storyOn = false;
  }
  /** Morph the plaque to where the timeline now stands; the timeline waits meanwhile. */
  function retarget() {
    cancelMorph();
    holdUntil = performance.now() + MORPH_MS;
    cancelMorph = tweenValues({ p: morph.p }, { p: stageP(currentStageIndex, stageU) }, values => {
      morph = { p: values.p };
      paintGeometry();
    }, MORPH_MS);
  }
  function selectStage(index, { fromStory = false } = {}) {
    if (!fromStory) stopStory();
    currentStageIndex = Math.max(0, Math.min(lastStage, index));
    // Playing: start at the first beat. Paused or reduced motion: show the finished stage.
    stageU = clock.getState().playing ? 0 : beatSettledU(currentStageIndex, beatCount(currentStageIndex) - 1);
    selectedHotspot = stageTargets[currentStageIndex];
    if (currentStageIndex === 4 && capThickness > 60) {
      capThickness = 50;
      $('[data-athero-slider="cap"]').value = '50';
    }
    retarget();
    render();
  }
  function seekBeat(beat) {
    stopStory();
    stageU = clock.getState().playing ? beatStartU(currentStageIndex, beat) : beatSettledU(currentStageIndex, beat);
    retarget();
    syncMotionUi();
    if (refs) paintBeat(plaqueGeometry(morph.p, capThickness));
    clock.refresh();
  }
  $('[data-athero-prev]').addEventListener('click', () => selectStage(currentStageIndex - 1));
  $('[data-athero-next]').addEventListener('click', () => selectStage(currentStageIndex + 1));
  $('[data-athero-motion]').addEventListener('click', () => {
    clock.toggle();
    motionEnabled = clock.getState().playing;
    syncMotionUi();
  });
  // Without motion the story steps through the finished stages on a timer.
  function storyStepStatic(index) {
    selectStage(index, { fromStory: true });
    storyTimer = setTimeout(() => {
      if (index < lastStage) storyStepStatic(index + 1);
      else { stopStory(); syncMotionUi(); }
    }, STORY_HOLD_MS);
  }
  $('[data-athero-story]').addEventListener('click', () => {
    if (storyOn) { stopStory(); syncMotionUi(); return; }
    storyOn = true;
    if (reducedMotion()) storyStepStatic(0);
    else {
      if (!clock.getState().playing) clock.setPlaying(true);
      selectStage(0, { fromStory: true });
    }
    syncMotionUi();
  });

  function syncMotionUi() {
    const en = getLang() === 'en';
    root.classList.toggle('athero-motion-on', motionEnabled);
    const motionBtn = $('[data-athero-motion]');
    motionBtn.textContent = motionEnabled
      ? (en ? 'Ⅱ Pause flow' : 'Ⅱ Akışı duraklat')
      : (en ? '▷ Animate flow' : '▷ Akışı canlandır');
    motionBtn.setAttribute('aria-pressed', String(motionEnabled));
    const storyBtn = $('[data-athero-story]');
    const playingStory = storyOn;
    storyBtn.textContent = playingStory
      ? (en ? '■ Stop the story' : '■ Hikâyeyi durdur')
      : (en ? '▶ Play the whole story' : '▶ Tüm hikâyeyi oynat');
    storyBtn.setAttribute('aria-pressed', String(playingStory));
    storyBtn.classList.toggle('active', playingStory);
  }

  function getAnimCtx() {
    const mod = getActiveModifier();
    const inflam = Math.min(1, Math.max(0, (inflammation * mod.inflamMult - 0.5) / 9.5));
    return {
      time: cellT,
      modifierId: currentModifierId,
      inflam,
      apoBFlux: apoBFlux * mod.apoBMult
    };
  }

  function paintGeometry() {
    if (!refs) return;
    const ctx = getAnimCtx();
    applyGeometry(refs, plaqueGeometry(morph.p, capThickness), getLang() === 'en', 0, ctx.inflam, 0);
  }

  /** Advance the stage timeline by d cardiac cycles; loops, or moves on in story mode. */
  function advanceTimeline(d) {
    stageU += d / (CYCLES_PER_BEAT * beatCount(currentStageIndex));
    if (stageU < 1) {
      morph = { p: stageP(currentStageIndex, stageU) };
      return;
    }
    if (storyOn && currentStageIndex < lastStage) { selectStage(currentStageIndex + 1, { fromStory: true }); return; }
    if (storyOn) { stopStory(); syncMotionUi(); }
    stageU = 0;
    retarget();
  }

  function paintBeat(geo) {
    const beat = beatIndex(currentStageIndex, stageU);
    const n = beatCount(currentStageIndex);
    if (beat !== shownBeat) {
      shownBeat = beat;
      $$('[data-beat]').forEach((btn, i) => {
        btn.classList.toggle('active', i === beat);
        btn.classList.toggle('done', i < beat);
        if (i === beat) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
      });
    }
    $(`[data-beat="${beat}"]`)?.style.setProperty('--beat-k', (stageU * n - beat).toFixed(3));
    const f = focusFor(currentStageIndex, beat, geo);
    const el = refs.focus;
    el.setAttribute('cx', f.x.toFixed(1)); el.setAttribute('cy', f.y.toFixed(1));
    el.setAttribute('rx', f.rx.toFixed(1)); el.setAttribute('ry', f.ry.toFixed(1));
  }

  function frame(state) {
    const shape = cycleShape(state.phase);
    motionBar.render(state, shape.phase);
    if (state.playing !== motionEnabled) { motionEnabled = state.playing; syncMotionUi(); }
    let d = lastPhase == null ? 0 : ((state.phase - lastPhase) % 1 + 1) % 1;
    if (d > 0.25) d = 0;
    lastPhase = state.phase;
    if (!refs) return;
    if (d > 0 && performance.now() >= holdUntil) advanceTimeline(d);
    if (!refs) return;
    const geo = plaqueGeometry(morph.p, capThickness);
    flowS += flowStep(d, shape.pressure, geo);
    cellT += d;
    const ctx = getAnimCtx();
    const { injury, endoPart } = animateActors(refs.actors, currentStageIndex, stageU, cellT, geo, ctx);
    applyGeometry(refs, geo, getLang() === 'en', shape.pressure, ctx.inflam, endoPart);
    animateFlow(refs, flowS, shape.pressure, geo, { ...ctx, injury });
    // Subtle undulation of the intimal proteoglycan matrix
    if (refs.pgPaths) {
      const w = 2.4 * Math.sin(cellT * 2.6);
      refs.pgPaths[0]?.setAttribute('d', `M 246 152 Q 285 ${(142 + w).toFixed(1)} 320 156 T 390 ${(152 - w).toFixed(1)} T 444 156`);
      refs.pgPaths[1]?.setAttribute('d', `M 258 170 Q 300 ${(160 - w).toFixed(1)} 338 172 T 432 ${(168 + w).toFixed(1)}`);
    }
    const endoHeat = Math.min(1, injury * (0.75 + 0.25 * ctx.inflam));
    refs.endo.forEach((r, i) => {
      if (i < LESION_ENDO[0] || i > LESION_ENDO[1]) return;
      r.setAttribute('fill', mixHex('#fecaca', '#f87171', endoHeat));
      r.setAttribute('stroke', mixHex('#dc2626', '#b91c1c', endoHeat));
    });
    paintBeat(geo);
  }

  // Original schematic thumbnails: same tissue layers, progressively different contents.
  function stageThumbnail(index) {
    return `<svg viewBox="0 0 160 76" aria-hidden="true" class="athero-thumbnail">
      <rect x="2" y="2" width="156" height="72" rx="12" fill="#fff8ed"/>
      <path d="M 3 12 Q 80 2 157 12 L 157 35 L 3 35 Z" fill="#fee2e2"/>
      <path d="M 3 37 H 157" stroke="#e87979" stroke-width="4" stroke-dasharray="16 3"/>
      <path d="M 3 67 H 157" stroke="#fda4af" stroke-width="10"/>
      ${index < 2 ? [45, 80, 115].map((x, i) => `<circle cx="${x}" cy="${index ? 49 : 20 + i * 9}" r="5" fill="#eab308" stroke="#a16207"/>`).join('') : ''}
      ${index === 2 ? [52, 80, 108].map(x => `<circle cx="${x}" cy="50" r="12" fill="#fef08a" stroke="#d97706"/><circle cx="${x - 3}" cy="47" r="3" fill="#d97706"/><circle cx="${x + 4}" cy="54" r="3" fill="#d97706"/>`).join('') : ''}
      ${index >= 3 ? `<path d="M 30 61 Q 80 12 130 61 Z" fill="#eab308"/><path d="M 30 60 Q 80 10 130 60" fill="none" stroke="${index === 4 ? '#dc2626' : '#0d9488'}" stroke-width="${index === 4 ? 2 : 5}" ${index === 4 ? 'stroke-dasharray="8 5"' : ''}/>` : ''}
      ${index === 4 ? '<ellipse cx="82" cy="27" rx="22" ry="12" fill="#b91c1c"/>' : ''}
    </svg>`;
  }

  function getActiveModifier() {
    return ATHEROMA_MODIFIERS.find(m => m.id === currentModifierId) || ATHEROMA_MODIFIERS[0];
  }

  function computeVulnerability() {
    const mod = getActiveModifier();
    const apoBScore = Math.min(100, Math.max(0, ((apoBFlux * mod.apoBMult - 50) / 170) * 100));
    const crpScore = Math.min(100, Math.max(0, ((inflammation * mod.inflamMult - 0.5) / 9.5) * 100));
    const capScore = Math.min(100, Math.max(0, ((150 - capThickness) / 125) * 100));
    const stageWeight = (currentStageIndex + 1) / 5;
    const raw = (apoBScore * 0.25 + crpScore * 0.30 + capScore * 0.45) * (0.55 + 0.45 * stageWeight) * Math.sqrt(mod.thrombMult);
    return Math.min(100, Math.round(raw));
  }

  function computeCumulativeExposure(age, baseLdl, statinAge) {
    let totalMgYears = 0;
    for (let a = 1; a <= age; a++) {
      const annualLdl = (statinAge > 0 && a >= statinAge) ? baseLdl * 0.45 : baseLdl;
      totalMgYears += annualLdl;
    }
    return Math.round(totalMgYears);
  }

  function render() {
    const en = getLang() === 'en';
    const mod = getActiveModifier();

    const shortNames = en
      ? ['Entry', 'Retention', 'Foam cells', 'Fibrous cap', 'Rupture']
      : ['Geçiş', 'Tutulum', 'Köpük hücreleri', 'Fibröz kılıf', 'Rüptür'];
    root.dataset.atheroStage = String(currentStageIndex);
    syncMotionUi();
    $('[data-athero-prev]').textContent = en ? '← Previous' : '← Önceki';
    $('[data-athero-next]').textContent = en ? 'Next →' : 'Sonraki →';
    $('[data-athero-prev]').disabled = currentStageIndex === 0;
    $('[data-athero-next]').disabled = currentStageIndex === 4;
    $('[data-athero-story-status]').textContent = `${currentStageIndex + 1} / 5 · ${shortNames[currentStageIndex]}`;
    $('.athero-stepper').setAttribute('aria-label', en ? 'Plaque evolution stages' : 'Plak gelişim evreleri');
    $('.athero-svg').setAttribute('aria-label', en ? 'Interactive artery wall schematic' : 'Etkileşimli damar duvarı şeması');

    // 1. Stepper
    const stepper = $('.athero-stepper');
    stepper.innerHTML = ATHEROMA_STAGES.map((st, idx) => `
      <button type="button" class="stage-btn ${idx === currentStageIndex ? 'active' : ''}" data-stage-idx="${idx}" aria-pressed="${idx === currentStageIndex}">
        ${stageThumbnail(idx)}
        <span class="stage-btn-num">${en ? 'Stage' : 'Evre'} ${st.stage}</span>
        <span class="stage-btn-label">${shortNames[idx]}</span>
      </button>
    `).join('');
    $$('[data-stage-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectStage(parseInt(btn.dataset.stageIdx, 10));
        $(`[data-stage-idx="${currentStageIndex}"]`).focus({ preventScroll: true });
      });
    });

    // 2. Systemic Modifier Pills
    const modBar = $('[data-athero-modifiers]');
    modBar.innerHTML = `
      <span class="preset-label">${en ? 'Systemic Phenotype:' : 'Sistemik Fenotip:'}</span>
      ${ATHEROMA_MODIFIERS.map(m => `
        <button type="button" class="preset-pill ${m.id === currentModifierId ? 'active' : ''}" data-mod-id="${m.id}">
          ${t(m.name)}
        </button>
      `).join('')}
    `;
    $$('[data-mod-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentModifierId = btn.dataset.modId;
        render();
      });
    });

    // 3. Hotspot selector pills
    const hotspotKeys = [
      { id: 'liver', label: en ? '1. Liver (MASLD)' : '1. Karaciğer (MASLD)' },
      { id: 'endothelium', label: en ? '2. Endothelium' : '2. Endotel Bariyeri' },
      { id: 'proteoglycan', label: en ? '3. Proteoglycan Trap' : '3. Proteoglikan Tuzağı' },
      { id: 'foamcell', label: en ? '4. Foam Cell & NLRP3' : '4. Köpük Hücresi & NLRP3' },
      { id: 'cap', label: en ? '5. Fibrous Cap & TF' : '5. Fibröz Kılıf & Trombüs' }
    ];
    const hsBar = $('[data-athero-hotspots]');
    hsBar.innerHTML = `
      <div class="preset-pill-group" style="margin-top:8px;padding-bottom:0;border-bottom:0">
        <span class="preset-label">${en ? 'Inspect Structure:' : 'Yapıyı İncele:'}</span>
        ${hotspotKeys.map(h => `
          <button type="button" class="preset-pill ${selectedHotspot === h.id ? 'active' : ''}" data-hs-id="${h.id}">
            ${h.label}
          </button>
        `).join('')}
      </div>
    `;
    $$('[data-hs-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedHotspot = btn.dataset.hsId;
        render();
      });
    });

    const hs = HOTSPOTS[selectedHotspot] || HOTSPOTS.proteoglycan;
    $('[data-athero-inspector]').innerHTML = `
      <h4>${t(hs.title)}</h4>
      <p>${t(hs.body)}</p>
    `;

    // 4. Statin intervention toggle bar for Ference curve
    const statinBar = $('[data-athero-statin-bar]');
    const statinOpts = [
      { age: 0, label: en ? 'Untreated' : 'Tedavisiz' },
      { age: 35, label: en ? 'Rx at Age 35 (-55%)' : '35 Yaşta Tedavi (-%55)' },
      { age: 50, label: en ? 'Rx at Age 50 (-55%)' : '50 Yaşta Tedavi (-%55)' }
    ];
    statinBar.innerHTML = statinOpts.map(o => `
      <button type="button" class="seg-btn ${statinStartAge === o.age ? 'active' : ''}" data-statin-age="${o.age}">
        ${o.label}
      </button>
    `).join('');
    $$('[data-statin-age]').forEach(btn => {
      btn.addEventListener('click', () => {
        statinStartAge = parseInt(btn.dataset.statinAge, 10);
        render();
      });
    });

    // 4b. Guided beats: the caption list the animation steps through
    $('[data-athero-beats]').innerHTML = STAGE_BEATS[currentStageIndex].map((beat, i) => `
      <li><button type="button" class="athero-beat" data-beat="${i}">
        <span class="athero-beat-num">${i + 1}</span><span class="athero-beat-text">${t(beat)}</span>
      </button></li>`).join('');
    shownBeat = -1;
    $$('[data-beat]').forEach(btn => {
      btn.addEventListener('click', () => {
        seekBeat(parseInt(btn.dataset.beat, 10));
        $(`[data-beat="${btn.dataset.beat}"]`)?.focus({ preventScroll: true });
      });
    });
    const swatch = (fill, stroke, label, extra = '') => `<span><i style="background:${fill};border-color:${stroke};${extra}"></i>${label}</span>`;
    $('[data-athero-legend]').innerHTML = [
      swatch('#eab308', '#92400e', 'LDL (apoB-100)'),
      swatch('#ea580c', '#7c2d12', en ? 'sdLDL / remnant' : 'sdLDL / kalıntı'),
      swatch('#a855f7', '#6b21a8', 'Lp(a)'),
      swatch('#c2410c', '#78350f', 'oxLDL'),
      swatch('#3b82f6', '#1e3a8a', en ? 'Monocyte' : 'Monosit'),
      swatch('#fcd34d', '#b45309', en ? 'Foam cell' : 'Köpük hücresi'),
      swatch('#fb7185', '#be123c', en ? 'Smooth muscle cell' : 'Düz kas hücresi', 'border-radius:40%;'),
      swatch('#0d9488', '#0f766e', en ? 'Fibrous cap' : 'Fibröz kılıf', 'border-radius:2px;height:6px;')
    ].join('');

    // 5. Stage Details & Mod Card
    const st = ATHEROMA_STAGES[currentStageIndex];
    $('[data-athero-title]').textContent = t(st.title);
    $('[data-athero-desc]').textContent = t(st.desc);
    $('[data-athero-features]').innerHTML = st.features.map(f => `<li>${t(f)}</li>`).join('');

    $('[data-athero-mod-card]').innerHTML = `
      <h4>${t(mod.name)} <small style="font-weight:500;color:var(--text-sub)">(${mod.source})</small></h4>
      <p>${t(mod.summary)}</p>
    `;

    // 6. Labels & Sliders
    const I18N = {
      storyEyebrow: en ? 'INSIDE THE ARTERY WALL' : 'DAMAR DUVARININ İÇİNDE',
      storyTitle: en ? 'Follow the life of a plaque' : 'Bir plağın gelişimini izle',
      storyHint: en ? 'Each stage plays as numbered steps; the dashed ring shows where to look. Select a step to replay it. Schematic stages, not a fixed timeline.' : 'Her evre numaralı adımlar halinde oynar; kesikli halka nereye bakacağını gösterir. Bir adımı yeniden izlemek için üzerine dokun. Evreler şematiktir; sabit bir zaman çizelgesi değildir.',
      beatTitle: en ? 'What is happening now' : 'Şu anda ne oluyor',
      simTitle: en ? 'Plaque Microenvironment & Exposure Parameters' : 'Plak Mikroçevresi ve Maruziyet Parametreleri',
      lblApoB: en ? 'Plasma LDL-C / ApoB Load' : 'Plazma LDL-C / ApoB Yükü',
      lblAge: en ? 'Patient Age (Cumulative Exposure)' : 'Hasta Yaşı (Kümülatif Maruziyet)',
      lblCrp: en ? 'Systemic Inflammation (hsCRP)' : 'Sistemik İnflamasyon (hsCRP)',
      lblCap: en ? 'Fibrous Cap Thickness' : 'Fibröz Kılıf Kalınlığı',
      lblVuln: en ? 'Plaque Vulnerability Index (PVI)' : 'Plak Kırılganlık İndeksi (PVI)',
      cumTitle: en ? 'Ference & Braunwald (2024) Cumulative LDL Exposure Curve' : 'Ference ve Braunwald (2024) Kümülatif LDL Maruziyet Eğrisi',
      cumSub: en
        ? 'Plaque burden accumulates as (LDL-C × Years). Crossing 5,000 mg/dL·years (~130 mmol·years) steeply increases MI risk.'
        : 'Plak yükü (LDL-C × Yıl) olarak birikir; 5.000 mg/dL·yıl (~130 mmol·yıl) eşiği aşılınca MI riski logaritmik artar.'
    };
    $$('[data-athero-i18n]').forEach(el => {
      const k = el.dataset.atheroI18n;
      if (I18N[k]) el.textContent = I18N[k];
    });

    $('[data-athero-val="apob"]').textContent = `${apoBFlux} mg/dL`;
    $('[data-athero-val="age"]').textContent = `${patientAge} ${en ? 'yrs' : 'yıl'}`;
    $('[data-athero-val="crp"]').textContent = `${inflammation.toFixed(1)} mg/L`;
    $('[data-athero-val="cap"]').textContent = `${capThickness} µm ${capThickness < 65 ? (en ? '(TCFA!)' : '(TCFA!)') : ''}`;

    // 7. Vulnerability Readout
    const vuln = computeVulnerability();
    const badge = $('[data-athero-vuln-badge]');
    const bar = $('[data-athero-vuln-bar]');
    const note = $('[data-athero-vuln-note]');

    bar.style.width = `${vuln}%`;
    if (vuln >= 70 || capThickness < 65) {
      badge.textContent = `${vuln}/100 · ${en ? 'High Risk (TCFA)' : 'Yüksek Risk (TCFA)'}`;
      badge.className = 'vulnerability-badge vuln-high';
      note.textContent = en
        ? 'Critical thin-cap fibroatheroma (<65 µm) with intense MMP / inflammatory activity; high risk of acute plaque rupture and thrombosis.'
        : 'Kritik ince kılıflı fibroaterom (<65 µm) ve yüksek MMP / inflamatuar aktivite; akut plak rüptürü ve tromboz riski çok yüksek.';
    } else if (vuln >= 40) {
      badge.textContent = `${vuln}/100 · ${en ? 'Moderate Risk' : 'Orta Risk'}`;
      badge.className = 'vulnerability-badge vuln-mod';
      note.textContent = en
        ? 'Growing lipid-rich necrotic core; aggressive apoB lowering (Statin + Ezetimibe / PCSK9i) stabilizes the cap.'
        : 'Büyüyen nekrotik çekirdek; yoğun apoB düşürücü tedavi (Statin + Ezetimib / PCSK9i) fibröz kılıfı kalınlaştırarak stabilize eder.';
    } else {
      badge.textContent = `${vuln}/100 · ${en ? 'Stable Lesion' : 'Stabil Lezyon'}`;
      badge.className = 'vulnerability-badge vuln-low';
      note.textContent = en
        ? 'Thick VSMC collagen cap protects the lumen from thrombogenic necrotic core exposure.'
        : 'Kalın VSMC kollajen fibröz kılıf, trombojenik çekirdeğin lümenle temasını güvenle engelliyor.';
    }

    drawAtheroSvg(currentStageIndex, en, mod);
    drawCumulativeSvg(en, mod);
  }

  function drawAtheroSvg(stageIdx, en, mod) {
    const svg = $('.athero-svg');
    const isMasld = mod.id === 'masld';

    // Top-left mini Liver organ box showing hepatic VLDL output into circulation
    const liverFill = isMasld ? '#d97706' : '#9a3412';
    const steatosisDots = isMasld
      ? `<circle data-am-liver-dot cx="42" cy="36" r="5" fill="#fde047"/><circle data-am-liver-dot cx="58" cy="32" r="4.5" fill="#fde047"/><circle data-am-liver-dot cx="50" cy="46" r="5" fill="#fde047"/><circle data-am-liver-dot cx="68" cy="44" r="4" fill="#fde047"/>`
      : `<circle data-am-liver-dot cx="48" cy="38" r="2.8" fill="#fed7aa" opacity="0.6"/>`;

    // ApoB particle count in lumen
    const numParticles = Math.min(20, Math.max(6, Math.round((apoBFlux * mod.apoBMult) / 12)));
    const lumenParticles = [];
    for (let i = 0; i < numParticles; i++) {
      const px = 145 + ((i * 31) % 465);
      const py = 26 + ((i * 19) % 54);
      const isSdLdl = isMasld && i % 2 === 0;
      const isLpa = i % 5 === 0;
      const r = isSdLdl ? 4.8 : 6.2;
      const fill = isLpa ? '#a855f7' : (isSdLdl ? '#ea580c' : '#eab308');
      const stroke = isLpa ? '#6b21a8' : '#92400e';
      lumenParticles.push(`
        <g class="athero-flow-particle" data-x0="${px}" data-y0="${py}" style="--flow-delay: ${-i * 0.7}s; --particle-x: ${px}px">
          <circle cx="${px}" cy="${py}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
          ${isLpa ? `<path d="M ${px + r} ${py - 3} Q ${px + r + 5} ${py}, ${px + r} ${py + 3}" fill="none" stroke="#7e22ce" stroke-width="1.5"/>` : ''}
        </g>
      `);
    }

    const immuneLumen = immuneLumenMarkup(mod.id);

    const mm = morphMarkup(en);
    svg.innerHTML = `
      <defs>
        <linearGradient id="atheroLumenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fee2e2"/>
          <stop offset="100%" stop-color="#fecaca"/>
        </linearGradient>
      </defs>

      <!-- Arterial Lumen (height pulses with the cardiac cycle) -->
      <rect data-am="lumen" x="10" y="10" width="620" height="84" fill="url(#atheroLumenGrad)" rx="8"/>
      ${mm.streamlines}
      ${mm.rbcs}
      <text x="615" y="28" text-anchor="end" font-size="11" font-weight="700" fill="#991b1b" stroke="#fff5f5" stroke-width="2.5" paint-order="stroke">
        ${en ? 'Arterial Lumen (Bloodstream)' : 'Arter Lümeni (Kan Akımı)'}
      </text>

      <!-- Hepatic Steatosis / Liver Origin Widget (Top Left) -->
      <g class="athero-clickable" data-svg-hs="liver" style="cursor:pointer">
        <rect x="18" y="16" width="112" height="62" rx="8" fill="#fff7ed" stroke="${selectedHotspot === 'liver' ? '#0d9488' : '#fdba74'}" stroke-width="2"/>
        <path d="M 30 48 C 28 28, 56 22, 82 30 C 92 34, 88 52, 65 54 C 48 56, 32 54, 30 48 Z" fill="${liverFill}"/>
        ${steatosisDots}
        <text x="74" y="69" text-anchor="middle" font-size="8.4" font-weight="800" fill="#7c2d12">
          ${isMasld ? (en ? 'MASLD Liver: ↑VLDL1' : 'MASLD Karaciğer: ↑VLDL1') : (en ? 'Liver: ApoB Secretion' : 'Karaciğer: ApoB Salınımı')}
        </text>
      </g>
      ${mm.liverBuds}

      <!-- Circulating Lipoprotein Particles (pulsatile: fast in systole, slow in diastole) -->
      ${lumenParticles.join('')}
      ${immuneLumen}
      ${mm.shear}
      ${mm.readout}

      <g data-am="wall">
        ${mm.mound}
        ${mm.glycocalyx}
        <!-- Endothelial Monolayer -->
        <g class="athero-clickable" data-svg-hs="endothelium" style="cursor:pointer">
          ${[15, 85, 155, 225, 295, 365, 435, 505, 575].map((x, idx) => {
            const lesion = idx >= LESION_ENDO[0] && idx <= LESION_ENDO[1];
            return `<rect data-am-endo x="${x}" y="96" width="52" height="13" rx="5" fill="${lesion ? '#fecaca' : '#fca5a5'}" stroke="#dc2626" stroke-width="1.5"/>`;
          }).join('')}
        </g>

        <!-- Subendothelial Tunica Intima (bottom bulges outward with the plaque) -->
        <path data-am="intima" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5"/>
        <text x="24" y="128" font-size="10.5" font-weight="800" fill="#92400e">
          ${en ? 'Tunica Intima (Proteoglycan Matrix)' : 'Tunica İntima (Proteoglikan Matriksi)'}
        </text>

        <g class="athero-clickable" data-svg-hs="proteoglycan" style="cursor:pointer">
          ${proteoglycanMarkup()}
        </g>

        <!-- Tunica Media (VSMCs), drawn before the plaque so migrating SMCs stay visible -->
        <path data-am="media" fill="#fecdd3" stroke="#be123c" stroke-width="1.5"/>
        <path data-am="iel" fill="none" stroke="#7c2d12" stroke-width="2.5" stroke-dasharray="10 4"/>
        <text x="24" y="274" font-size="11" font-weight="700" fill="#881337">
          ${en ? 'Tunica Media (Vascular Smooth Muscle Cells - VSMCs)' : 'Tunica Media (Vasküler Düz Kas Hücreleri - VSMC)'}
        </text>
        ${mm.remodel}

        <g class="athero-clickable" data-svg-hs="${stageTargets[stageIdx]}" style="cursor:pointer">
          ${mm.core}
          ${mm.thrombus}
        </g>

        <!-- Stage cells (schematic trajectories on the shared cardiac clock) -->
        <g aria-hidden="true" class="athero-mechanism-cells" data-am="actors">${actorMarkup(stageIdx, en)}</g>
        ${mm.focus}
      </g>
    `;

    const am = key => svg.querySelector(`[data-am="${key}"]`);
    refs = {
      lumen: am('lumen'), wall: am('wall'), mound: am('mound'), intima: am('intima'), iel: am('iel'), media: am('media'),
      core: am('core'), coreInner: am('core-inner'), cap: am('cap'), collagen: am('collagen'), capStress: am('cap-stress'),
      breach: am('breach'), thrombus: am('thrombus'), remodel: am('remodel'),
      readout: am('readout'), shear: am('shear'), focus: am('focus'), actors: collectActors(am('actors')),
      endo: Array.from(svg.querySelectorAll('[data-am-endo]')),
      arrows: Array.from(svg.querySelectorAll('[data-am-shear-arrow]')),
      eddies: Array.from(svg.querySelectorAll('[data-am-eddy]')),
      streams: Array.from(svg.querySelectorAll('[data-am-stream]')),
      rbcs: Array.from(svg.querySelectorAll('[data-am-rbc]')).map(el => ({
        el, x0: Number(el.dataset.x0), lane: Number(el.dataset.lane)
      })),
      liverBuds: Array.from(svg.querySelectorAll('[data-am-liver-bud]')),
      liverDots: Array.from(svg.querySelectorAll('[data-am-liver-dot]')),
      cilia: Array.from(svg.querySelectorAll('[data-am-cilia]')),
      fibrin: Array.from(svg.querySelectorAll('[data-am-fibrin]')),
      pheno: Array.from(svg.querySelectorAll('[data-am-pheno]')),
      pgPaths: Array.from(svg.querySelectorAll('[data-am-pg]')),
      particles: Array.from(svg.querySelectorAll('.athero-flow-particle')).map(el => ({
        el, x0: Number(el.dataset.x0), y0: Number(el.dataset.y0)
      }))
    };
    paintGeometry();
    clock.refresh();

    svg.querySelectorAll('[data-svg-hs]').forEach(g => {
      const id = g.dataset.svgHs;
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', t(HOTSPOTS[id].title));
      g.setAttribute('aria-pressed', String(selectedHotspot === id));
      const activate = () => {
        selectedHotspot = id;
        render();
        svg.querySelector(`[data-svg-hs="${id}"]`)?.focus({ preventScroll: true });
      };
      g.addEventListener('click', activate);
      g.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function drawCumulativeSvg(en, mod) {
    const svg = $('.athero-cum-svg');
    const w = 580, h = 185;
    const padL = 52, padR = 24, padT = 18, padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxAge = 80, minAge = 20;
    const maxExp = 12000; // mg/dL * years
    const toX = a => padL + ((a - minAge) / (maxAge - minAge)) * plotW;
    const toY = exp => padT + ((maxExp - Math.min(maxExp, exp)) / maxExp) * plotH;

    const effLdl = Math.round(apoBFlux * mod.apoBMult);
    const ptsUntreated = [];
    const ptsTreated = [];
    for (let a = minAge; a <= maxAge; a += 2) {
      ptsUntreated.push(`${toX(a).toFixed(1)},${toY(computeCumulativeExposure(a, effLdl, 0)).toFixed(1)}`);
      if (statinStartAge > 0) {
        ptsTreated.push(`${toX(a).toFixed(1)},${toY(computeCumulativeExposure(a, effLdl, statinStartAge)).toFixed(1)}`);
      }
    }

    const currentExp = computeCumulativeExposure(patientAge, effLdl, statinStartAge);
    const thresholdY = toY(5000);
    const ptX = toX(patientAge);
    const ptY = toY(currentExp);

    svg.innerHTML = `
      <!-- Threshold zone above 5000 mg/dL-years -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${thresholdY - padT}" fill="rgba(239, 68, 68, 0.08)"/>
      <line x1="${padL}" y1="${thresholdY}" x2="${w - padR}" y2="${thresholdY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="5 3"/>
      <text x="${padL + 6}" y="${thresholdY - 5}" font-size="9.5" font-weight="700" fill="#dc2626">
        ${en ? 'Clinical MI Threshold: 5,000 mg/dL·yrs (~130 mmol·yrs)' : 'Klinik MI Eşiği: 5.000 mg/dL·yıl (~130 mmol·yıl)'}
      </text>

      <!-- Axes -->
      <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#64748b" stroke-width="1.5"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#64748b" stroke-width="1.5"/>

      ${[20, 30, 40, 50, 60, 70, 80].map(a => `
        <text x="${toX(a)}" y="${h - padB + 14}" text-anchor="middle" font-size="9.5" fill="#64748b">${a}</text>
      `).join('')}
      ${[0, 5000, 10000].map(val => `
        <text x="${padL - 6}" y="${toY(val) + 3}" text-anchor="end" font-size="9" fill="#64748b">${val / 1000}k</text>
      `).join('')}

      <!-- Untreated trajectory -->
      <polyline points="${ptsUntreated.join(' ')}" fill="none" stroke="${statinStartAge > 0 ? '#94a3b8' : '#d97706'}" stroke-width="2.4" stroke-dasharray="${statinStartAge > 0 ? '4 3' : 'none'}"/>

      <!-- Treated trajectory if active -->
      ${statinStartAge > 0 ? `<polyline points="${ptsTreated.join(' ')}" fill="none" stroke="#0d9488" stroke-width="2.8"/>` : ''}

      <!-- Patient current coordinate -->
      <circle class="athero-cum-pulse" cx="${ptX}" cy="${ptY}" r="9.5" fill="none" stroke="${currentExp >= 5000 ? '#dc2626' : '#0d9488'}" stroke-width="2"/>
      <circle cx="${ptX}" cy="${ptY}" r="5.5" fill="${currentExp >= 5000 ? '#dc2626' : '#0d9488'}" stroke="#fff" stroke-width="1.8"/>
      <text x="${Math.min(w - 85, Math.max(padL + 60, ptX))}" y="${Math.max(padT + 14, ptY - 9)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0f172a">
        ${currentExp.toLocaleString()} mg/dL·${en ? 'yr' : 'yıl'}
      </text>

      <text x="${padL + plotW / 2}" y="${h - 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">
        ${en ? 'Age (Years) → Cumulative Arterial Plaque Burden' : 'Yaş (Yıl) → Kümülatif Arteriyel Plak Yükü'}
      </text>
    `;
  }

  render();
  const unsubscribe = clock.subscribe(frame);

  return {
    render() { render(); },
    updateLanguage(newLang) {
      if (typeof newLang === 'string') opts.lang = newLang;
      motionBar.setLanguage();
      render();
    },
    destroy() {
      stopStory();
      cancelMorph();
      unsubscribe();
      clock.destroy();
      refs = null;
      root.remove();
    }
  };
}
