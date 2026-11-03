// Vessel wall mechanics lab: animated Laplace stresses (straight segment and dilating aortic root)
// and Hagen-Poiseuille wall shear. Mounted under the hypertension and vascular station.
import {
  laplaceStresses, dilatedAorta, wallShear, oscillatoryShearIndex, pulsePressureAt, flowFactorAt,
  poiseuilleVelocity, AORTA_REFERENCE, MMHG_TO_KPA
} from './vessel-wall-model.js';
import { laplaceSvg, aortaSvg, shearSvg, SHEAR_GEOMETRY, VW_COLORS } from './vessel-wall-svg.js';
import { VW_TEXT } from './vessel-wall-text.js';

const LAPLACE_PRESETS = Object.freeze({
  normal: { sbp: 120, pext: 0, r: 12.5, h: 2.0 },
  htn: { sbp: 180, pext: 0, r: 13.5, h: 2.0 },
  hypertrophy: { sbp: 180, pext: 0, r: 13.5, h: 3.0 },
  external: { sbp: 120, pext: 30, r: 12.5, h: 2.0 }
});
const SHEAR_PRESETS = Object.freeze({
  coronary: { v: 0.2, d: 3.5, mu: 3.5, osc: false },
  bifurcation: { v: 0.07, d: 6, mu: 3.5, osc: true },
  stenosis: { v: 0.9, d: 1.4, mu: 3.5, osc: false },
  polycythemia: { v: 0.2, d: 3.5, mu: 6, osc: false }
});
const REFERENCE_HOOP = laplaceStresses({ pInt: 120, r: 12.5, h: 2 }).hoop;
const BEATS_PER_SECOND = 1.2;
const PARTICLES = 34;
const diastolic = sbp => 40 + sbp / 3;

export function createVesselWallLab({ container, lang = 'tr' } = {}) {
  const root = document.createElement('section');
  root.className = 'vw-lab';
  root.setAttribute('data-vessel-wall-lab', '');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    lang, paused: reduced, speed: 1, phase: 0.1, growTick: 0,
    lap: { ...LAPLACE_PRESETS.normal, preset: 'normal' },
    aorta: { diameter: 32, growing: false },
    shear: { ...SHEAR_PRESETS.coronary, preset: 'coronary' },
    particles: Array.from({ length: PARTICLES }, (_, i) => ({ x: (i * 97) % SHEAR_GEOMETRY.width, rho: ((i * 0.618) % 1) * 1.8 - 0.9 }))
  };
  let raf = 0, last = 0;
  const $ = sel => root.querySelector(sel);
  const text = () => VW_TEXT[state.lang] || VW_TEXT.tr;

  function slider(key, group, label, min, max, step, unit) {
    return `<label class="vw-slider"><span>${label}</span><input type="range" data-vw-input="${group}.${key}" min="${min}" max="${max}" step="${step}"><output data-vw-out="${group}.${key}" data-unit="${unit}"></output></label>`;
  }
  const presets = (group, labels) => `<div class="vw-presets" role="group">${Object.entries(labels).map(([id, name]) => `<button type="button" class="preset-pill" data-vw-preset="${group}.${id}">${name}</button>`).join('')}</div>`;

  function render() {
    const t = text();
    root.innerHTML = `
      <header class="vw-head">
        <div><h3>${t.title}</h3><p>${t.intro}</p></div>
        <div class="vw-motion"><strong>${t.motion}</strong><button type="button" class="preset-pill" data-vw-toggle></button>
          <label>${t.speed} <select data-vw-speed><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>
      </header>
      <div class="vw-grid">
        <article class="vw-card" data-vw-card="laplace">
          <h4>${t.lapTitle}</h4>${presets('lap', t.lapPresets)}
          <svg viewBox="0 0 320 300" class="vw-svg" role="img" aria-label="${t.lapTitle}" data-vw-svg="laplace"></svg>
          ${slider('sbp', 'lap', t.sbp, 90, 220, 5, 'mmHg')}${slider('pext', 'lap', t.pext, 0, 40, 1, 'mmHg')}
          ${slider('r', 'lap', t.radius, 5, 20, 0.5, 'mm')}${slider('h', 'lap', t.wall, 0.5, 4, 0.1, 'mm')}
          <div class="vw-bars" data-vw-bars></div>
          <p class="vw-meta" data-vw-lap-meta></p>
          <p class="vw-note">${t.lapNote}</p>
        </article>
        <article class="vw-card" data-vw-card="aorta">
          <h4>${t.aorTitle}</h4>
          <div class="vw-presets"><button type="button" class="preset-pill" data-vw-grow></button><button type="button" class="preset-pill" data-vw-reset>${t.reset}</button></div>
          <svg viewBox="0 0 320 300" class="vw-svg" role="img" aria-label="${t.aorTitle}" data-vw-svg="aorta"></svg>
          ${slider('diameter', 'aorta', t.diameter, 28, 70, 1, 'mm')}
          <p class="vw-meta" data-vw-aorta-meta></p>
          <p class="vw-zone" data-vw-aorta-zone></p>
          <ol class="vw-cycle" data-vw-cycle>${t.cycle.map(step => `<li>${step}</li>`).join('')}</ol>
          <p class="vw-note">${t.aorNote}</p>
        </article>
        <article class="vw-card" data-vw-card="shear">
          <h4>${t.shTitle}</h4>${presets('shear', t.shPresets)}
          <svg viewBox="0 0 360 244" class="vw-svg" role="img" aria-label="${t.shTitle}" data-vw-svg="shear"></svg>
          <ul class="vw-layers">${Object.entries(t.layers).map(([k, name]) => `<li><i style="background:${VW_COLORS[k]}"></i>${name}</li>`).join('')}</ul>
          ${slider('v', 'shear', t.velocity, 0.02, 1, 0.01, 'm/s')}${slider('d', 'shear', t.diam, 1, 30, 0.5, 'mm')}${slider('mu', 'shear', t.viscosity, 2.5, 7, 0.1, 'cP')}
          <p class="vw-meta" data-vw-shear-meta></p>
          <p class="vw-zone" data-vw-shear-zone></p>
          <p class="vw-note">${t.shNote}</p>
        </article>
      </div>`;
    bind();
    refresh();
  }

  function bind() {
    $('[data-vw-toggle]').addEventListener('click', () => { state.paused = !state.paused; refresh(); });
    $('[data-vw-speed]').addEventListener('change', e => { state.speed = Number(e.target.value) || 1; });
    root.querySelectorAll('[data-vw-input]').forEach(input => input.addEventListener('input', () => {
      const [group, key] = input.dataset.vwInput.split('.');
      state[group] = { ...state[group], [key]: Number(input.value), ...(group === 'aorta' ? { growing: false } : { preset: 'custom' }) };
      refresh();
    }));
    root.querySelectorAll('[data-vw-preset]').forEach(btn => btn.addEventListener('click', () => {
      const [group, id] = btn.dataset.vwPreset.split('.');
      const table = group === 'lap' ? LAPLACE_PRESETS : SHEAR_PRESETS;
      state[group] = { ...table[id], preset: id };
      refresh();
    }));
    $('[data-vw-grow]').addEventListener('click', () => {
      const restart = !state.aorta.growing && state.aorta.diameter >= 69;
      state.aorta = { diameter: restart ? 32 : state.aorta.diameter, growing: !state.aorta.growing };
      if (state.paused && state.aorta.growing) state.paused = false;
      refresh();
    });
    $('[data-vw-reset]').addEventListener('click', () => { state.aorta = { diameter: 32, growing: false }; refresh(); });
  }

  /** Static readouts and control values; the SVGs are redrawn by draw(). */
  function refresh() {
    const t = text(), { lap, aorta, shear } = state;
    root.querySelectorAll('[data-vw-input]').forEach(input => {
      const [group, key] = input.dataset.vwInput.split('.');
      const value = state[group][key];
      if (document.activeElement !== input) input.value = String(value);
      const out = root.querySelector(`[data-vw-out="${group}.${key}"]`);
      out.textContent = `${Number.isInteger(value) ? value : value.toFixed(key === 'v' ? 2 : 1)} ${out.dataset.unit}`;
    });
    root.querySelectorAll('[data-vw-preset]').forEach(btn => {
      const [group, id] = btn.dataset.vwPreset.split('.');
      const on = state[group].preset === id;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    const toggle = $('[data-vw-toggle]');
    toggle.textContent = state.paused ? t.play : t.pause;
    toggle.setAttribute('aria-pressed', String(!state.paused));
    $('[data-vw-speed]').value = String(state.speed);
    $('[data-vw-grow]').textContent = aorta.growing ? t.stopGrow : t.grow;

    const peak = laplaceStresses({ pInt: lap.sbp, pExt: lap.pext, r: lap.r, h: lap.h });
    const max = Math.max(peak.hoop, 1);
    const bars = [[t.hoop, peak.hoop, 'hoop'], [t.axial, peak.axial, 'axial'], [t.radial, Math.abs(peak.radialInner), 'radial']];
    $('[data-vw-bars]').innerHTML = bars.map(([name, value, key]) =>
      `<div class="vw-bar" data-vw-bar="${key}"><span>${name}</span><b style="width:${(100 * value / max).toFixed(1)}%"></b><em>${key === 'radial' ? '−' : ''}${value.toFixed(0)} kPa</em></div>`).join('');
    const hNeeded = (peak.transmural * lap.r * MMHG_TO_KPA) / REFERENCE_HOOP;
    $('[data-vw-lap-meta]').textContent = `${t.transmural} = ${Math.round(peak.transmural)} mmHg · ${t.rOverH} ${peak.rOverH.toFixed(1)} (${peak.thinWall ? t.thinWall : t.thickWall}) · ${t.hNeeded}: ${hNeeded.toFixed(1)} mm`;

    const dil = dilatedAorta({ diameter: aorta.diameter, pressure: lap.sbp });
    $('[data-vw-aorta-meta]').textContent = `${t.aorPressure} (${lap.sbp} mmHg) · ${t.wallNow} ${dil.wall.toFixed(1)} mm · σc ${Math.round(dil.hoop)} kPa · ${t.ratio} ×${dil.ratio.toFixed(2)}`;
    const zone = $('[data-vw-aorta-zone]');
    zone.textContent = t.zones[dil.zone];
    zone.dataset.zone = dil.zone;

    const sh = wallShear({ vMean: shear.v, diameter: shear.d, viscosity: shear.mu });
    const osi = oscillatoryShearIndex(shear.osc);
    const shearZone = shear.osc ? 'low' : sh.zone;
    $('[data-vw-shear-meta]').textContent = `${t.tau} = ${sh.tau.toFixed(2)} Pa (${sh.dyn.toFixed(1)} dyn/cm²) · ${t.reynolds} ${Math.round(sh.reynolds)}${sh.turbulent ? ` (${t.turbulent})` : ''} · ${t.osi} ${osi.toFixed(2)}`;
    const sz = $('[data-vw-shear-zone]');
    sz.innerHTML = `<strong>${t.zoneTitle}:</strong> ${t.shZones[shearZone]}`;
    sz.dataset.zone = shearZone;
    draw();
  }

  function frameState() {
    const { lap, aorta, shear } = state;
    const dbp = diastolic(lap.sbp);
    const pNow = pulsePressureAt(state.phase, lap.sbp, dbp);
    const pulse = (pNow - dbp) / Math.max(1, lap.sbp - dbp);
    const peak = laplaceStresses({ pInt: lap.sbp, pExt: lap.pext, r: lap.r, h: lap.h });
    const live = laplaceStresses({ pInt: pNow, pExt: lap.pext, r: lap.r, h: lap.h });
    const dil = dilatedAorta({ diameter: aorta.diameter, pressure: lap.sbp });
    const dilNow = dilatedAorta({ diameter: aorta.diameter, pressure: pNow });
    const factor = flowFactorAt(state.phase, shear.osc);
    const sh = wallShear({ vMean: shear.v * factor, diameter: shear.d, viscosity: shear.mu });
    const shearZone = shear.osc ? 'low' : wallShear({ vMean: shear.v, diameter: shear.d, viscosity: shear.mu }).zone;
    return {
      lap: { pNow, pExt: lap.pext, r: lap.r, h: lap.h, hoop: peak.hoop, axial: peak.axial, hoopNow: live.hoop, pulse },
      aorta: { diameter: aorta.diameter, wall: dil.wall, hoop: dil.hoop, hoopNow: dilNow.hoop, ratio: dil.ratio, pNow, pulse },
      shear: { diameter: shear.d, factor, tauNow: sh.tau, zone: shearZone, particles: state.particles }
    };
  }

  function draw() {
    const t = text(), s = frameState();
    $('[data-vw-svg="laplace"]').innerHTML = laplaceSvg(s.lap, t);
    $('[data-vw-svg="aorta"]').innerHTML = aortaSvg(s.aorta, t);
    $('[data-vw-svg="shear"]').innerHTML = shearSvg(s.shear, t);
    const active = state.aorta.growing ? Math.floor(state.growTick) % t.cycle.length : -1;
    root.querySelectorAll('[data-vw-cycle] li').forEach((li, i) => li.classList.toggle('is-on', i === active));
  }

  function step(dt) {
    const k = dt * state.speed;
    state.phase = (state.phase + k * BEATS_PER_SECOND) % 1;
    const factor = flowFactorAt(state.phase, state.shear.osc);
    const base = 30 + (200 * state.shear.v) / (state.shear.v + 0.3);
    for (const p of state.particles) {
      p.x += poiseuilleVelocity(1, p.rho) / 2 * factor * base * k;
      if (p.x > SHEAR_GEOMETRY.width + 6) p.x -= SHEAR_GEOMETRY.width + 12;
      if (p.x < -6) p.x += SHEAR_GEOMETRY.width + 12;
    }
    if (state.aorta.growing) {
      state.growTick += k * 1.4;
      const diameter = Math.min(70, state.aorta.diameter + k * 3 * (state.aorta.diameter / AORTA_REFERENCE.diameter) ** 2);
      state.aorta = { diameter, growing: diameter < 70 };
      refresh();
      return;
    }
    draw();
  }

  function tick(now) {
    const dt = Math.min(0.06, Math.max(0, (now - last) / 1000));
    last = now;
    if (!state.paused && root.isConnected) step(dt);
    raf = requestAnimationFrame(tick);
  }

  container.append(root);
  render();
  last = performance.now();
  raf = requestAnimationFrame(tick);

  return {
    element: root,
    state: () => ({ ...state, lap: { ...state.lap }, aorta: { ...state.aorta }, shear: { ...state.shear } }),
    setLanguage(next) { state.lang = next; render(); },
    destroy() { cancelAnimationFrame(raf); root.remove(); }
  };
}
