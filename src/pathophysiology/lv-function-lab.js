import { pvParams, pvModelLoop } from '../hemo-pv-model.js';
import { wallStress } from '../hemo-loads-model.js';
import { createCycleClock, createMotionBar, cyclePhaseAt, loopPointAt } from './cycle-clock.js';
import { LV_FUNCTION_TEXT } from './lv-function-text.js';
import './lv-function.css';

const GEOMETRY = { axisRatio: 1.65, wallCm: 1.2 };
const CASES = {
  baseline: {},
  preload: { edv: 155 },
  afterload: { ea: 1.9 },
  contractility: { ees: 3.7 },
  geometry: { geometry: { axisRatio: 1.15, wallCm: 0.9 } }
};
const METRICS = ['edv', 'esv', 'sv', 'ef', 'stress'];
const clamp01 = x => Math.max(0, Math.min(1, x));
const shortRadius = (volume, axisRatio) => Math.cbrt(3 * volume / (4 * Math.PI * axisRatio));

function buildCase(id) {
  const { geometry = GEOMETRY, ...input } = CASES[id];
  const loop = pvModelLoop(pvParams(input));
  const esRadius = shortRadius(loop.esv, geometry.axisRatio);
  return { loop, geometry, stress: wallStress({ p: loop.esp, r: esRadius, h: geometry.wallCm }) };
}

function excitationAt(phase, windows) {
  const start = windows.ivc[0], opening = windows.ejection[0], closing = windows.ejection[1];
  const release = start + (opening - start) * 0.35;
  const calcium = phase <= opening
    ? clamp01((phase - release) / (opening - release))
    : clamp01(1 - (phase - opening) / (1 - opening));
  let step = 4;
  if (phase < start) step = 0;
  else if (phase < release) step = 1;
  else if (phase < opening) step = 2;
  else if (phase < closing) step = 3;
  return { step, calcium, influx: clamp01((phase - start) / (release - start)) };
}

function cavityPath(volume, { axisRatio, wallCm }, wall = false) {
  const r = shortRadius(volume, axisRatio);
  const width = (r + (wall ? wallCm : 0)) * 19;
  const height = (r * axisRatio + (wall ? wallCm : 0)) * 25;
  const l = 160 - width, right = 160 + width;
  return `M${l} 52 Q160 34 ${right} 52 C${right + 4} 84 ${160 + width * 0.72} ${40 + height * .94} 160 ${42 + height}
    C${160 - width * .74} ${39 + height * .95} ${l - 4} 82 ${l} 52Z`;
}

function cellArt(prefix) {
  const particles = Array.from({ length: 10 }, (_, index) => `<circle data-lvf-particle="${index}" r="${index === 0 ? 4.5 : 3}" fill="#94e9fa" opacity="0"/>`).join('');
  return `
    <defs>
      <linearGradient id="${prefix}-cell-bg" x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#173b3c"/><stop offset="1" stop-color="#101e30"/>
      </linearGradient>
      <linearGradient id="${prefix}-sr" x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#d17a92"/><stop offset="1" stop-color="#6d3b66"/>
      </linearGradient>
    </defs>
    <rect width="320" height="235" rx="10" fill="url(#${prefix}-cell-bg)"/>
    <path d="M0 49H76C91 49 96 59 96 72V110C96 125 103 132 114 132S132 125 132 110V72C132 59 137 49 153 49H320V235H0Z" fill="#7e637a" opacity=".24"/>
    <path d="M0 49H76C91 49 96 59 96 72V110C96 125 103 132 114 132S132 125 132 110V72C132 59 137 49 153 49H320" fill="none" stroke="#aeacbf" stroke-width="5"/>
    <path d="M0 49H76C91 49 96 59 96 72V110C96 125 103 132 114 132S132 125 132 110V72C132 59 137 49 153 49H320" fill="none" stroke="#686e89" stroke-width="2"/>
    <g fill="#a4e6f2" opacity=".7">
      <circle cx="79" cy="30" r="3"/><circle cx="121" cy="31" r="3.5"/><circle cx="174" cy="29" r="2.7"/><circle cx="225" cy="24" r="3"/>
    </g>
    <rect x="125" y="91" width="15" height="19" rx="4" fill="#64cce2" stroke="#c1f1ff" data-lvf-gate/>
    <path d="M93 98h29" fill="none" stroke="#aeccd5" opacity=".75"/>
    <rect x="156" y="72" width="91" height="43" rx="14" fill="url(#${prefix}-sr)" stroke="#e5a2b1"/>
    <rect x="153" y="90" width="10" height="15" rx="3" fill="#f4baca" data-lvf-ryr/>
    <g fill="#ffe1c0">
      <circle cx="173" cy="84" r="2.3"/><circle cx="184" cy="97" r="2.5"/><circle cx="194" cy="85" r="2.2"/>
      <circle cx="204" cy="100" r="2.2"/><circle cx="216" cy="85" r="2.5"/><circle cx="227" cy="100" r="2.4"/>
    </g>
    ${particles}
    <path d="M63 170H257" stroke="#8e7494" stroke-width="1" stroke-dasharray="4 5"/>
    <g data-lvf-fibre="left">
      <path d="M62 156V194" stroke="#b6adcb" stroke-width="5"/>
      <path d="M62 162H156M62 186H156" stroke="#a2bdda" stroke-width="3" stroke-dasharray="3 2"/>
    </g>
    <g data-lvf-fibre="right">
      <path d="M258 156V194" stroke="#b6adcb" stroke-width="5"/>
      <path d="M258 162H164M258 186H164" stroke="#a2bdda" stroke-width="3" stroke-dasharray="3 2"/>
    </g>
    <path d="M108 174H212" stroke="#f08f83" stroke-width="7" stroke-linecap="round"/>
    <path d="M122 174l7-7m8 7 7 8m8-8 7-7m8 7 7 8m8-8 7-7m8 7 7 8" fill="none" stroke="#f8c1aa" stroke-width="1.6" data-lvf-bridges/>
    <g fill="#f4eef5" font-size="11.5" font-weight="650" text-anchor="middle">
      <text x="160" y="17" data-lvf-label="calcium"></text>
      <text x="62" y="91" data-lvf-label="trigger"></text>
      <text x="203" y="129" data-lvf-label="store"></text>
      <text x="160" y="217" data-lvf-label="sarcomere"></text>
    </g>
  `;
}

function pumpArt(prefix) {
  return `
    <defs>
      <linearGradient id="${prefix}-pump-bg" x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#173a3a"/><stop offset="1" stop-color="#13292b"/>
      </linearGradient>
      <radialGradient id="${prefix}-wall" cx=".44" cy=".36" r=".75">
        <stop stop-color="#e28e81"/><stop offset=".72" stop-color="#a85360"/><stop offset="1" stop-color="#6f3448"/>
      </radialGradient>
      <linearGradient id="${prefix}-blood" x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#9d4a62"/><stop offset="1" stop-color="#421f3c"/>
      </linearGradient>
      <pattern id="${prefix}-fibres" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
        <path d="M0 1H7M0 4H7" stroke="#f8c0a6" stroke-width=".65" opacity=".2"/>
      </pattern>
    </defs>
    <rect width="320" height="235" rx="10" fill="url(#${prefix}-pump-bg)"/>
    <path d="M80 111Q160 17 244 111M68 136Q160 222 252 136" fill="none" stroke="#a4c8bd" opacity=".19" stroke-dasharray="3 5"/>
    <path d="M177 48V30Q177 15 199 15H223V37H199V52" fill="#c87876" stroke="#f5b7a5" stroke-width="1.3"/>
    <path d="M186 43V31Q186 25 200 25H222" fill="none" stroke="#693447" stroke-width="5"/>
    <path d="M140 47V29Q120 18 98 24L94 44Q114 37 124 44V55" fill="#99748b" stroke="#d6a1ac" stroke-width="1.1"/>
    <path data-lvf-wall fill="url(#${prefix}-wall)" stroke="#f1a798" stroke-width="1.3"/>
    <path data-lvf-wall-texture fill="url(#${prefix}-fibres)"/>
    <path data-lvf-cavity fill="url(#${prefix}-blood)" stroke="#e2aaa6" stroke-width="1.3"/>
    <path data-lvf-reference fill="none" stroke="#fbd9b9" stroke-width="1.2" stroke-dasharray="4 4" opacity=".78"/>
    <path d="M102 56Q120 69 139 53M161 54Q178 65 197 54" fill="none" stroke="#f0d4bb" stroke-width="2.4" stroke-linecap="round"/>
    <path data-lvf-outflow d="M183 51V33Q183 25 195 25H216m-5-4 5 4-5 4" fill="none" stroke="#ffe0ab" stroke-width="2.3" opacity="0"/>
    <path d="M24 111H61l24-20" fill="none" stroke="#ddaea9" opacity=".68"/>
    <path d="M242 110h-28l-38-18" fill="none" stroke="#ddaea9" opacity=".68"/>
    <g fill="#f5eeed" font-size="11.5" font-weight="650">
      <text x="23" y="105" data-lvf-label="wall"></text>
      <text x="297" y="104" text-anchor="end" data-lvf-label="cavity"></text>
      <text x="160" y="219" text-anchor="middle" data-lvf-label="diastolicContour"></text>
    </g>
  `;
}

let sequence = 0;

export function createLvFunctionLab({ lang = 'tr' } = {}) {
  let language = lang === 'en' ? 'en' : 'tr', scenario = 'baseline', model = buildCase(scenario);
  let shownStep = -1;
  const prefix = `lvf-${++sequence}`;
  const clock = createCycleClock({ bpm: 72, speed: 0.5 });
  const controller = new AbortController();
  const motion = createMotionBar(clock, {
    getLang: () => language,
    label: { tr: LV_FUNCTION_TEXT.tr.clock, en: LV_FUNCTION_TEXT.en.clock }
  });
  // Phase 1 wraps to the next beat. The final seekable frame is still relaxation.
  motion.element.querySelector('[data-cycle-scrub]').max = '0.995';
  const root = document.createElement('section');
  root.className = 'lvf';
  root.dataset.lvf = '';
  root.innerHTML = `
    <header class="lvf-head">
      <p class="lvf-kicker" data-lvf-label="kicker"></p>
      <h3 data-lvf-label="title"></h3><p class="lvf-intro" data-lvf-label="intro"></p>
    </header>
    <div class="lvf-presets" role="group" data-lvf-presets>
      ${Object.keys(CASES).map(id => `<button class="preset-pill" type="button" data-lvf-case="${id}"></button>`).join('')}
    </div>
    <div class="lvf-scenes">
      <figure>
        <figcaption id="${prefix}-cell-title" data-lvf-label="cell"></figcaption>
        <svg viewBox="0 0 320 235" role="img" aria-labelledby="${prefix}-cell-title" data-lvf-cell>${cellArt(prefix)}</svg>
      </figure>
      <figure>
        <figcaption id="${prefix}-pump-title" data-lvf-label="pump"></figcaption>
        <svg viewBox="0 0 320 235" role="img" aria-labelledby="${prefix}-pump-title" data-lvf-pump>${pumpArt(prefix)}</svg>
      </figure>
    </div>
    <div class="lvf-reading">
      <p><strong data-lvf-stage></strong><span data-lvf-detail></span></p>
      <p><strong data-lvf-selection></strong><span data-lvf-insight></span></p>
    </div>
    <dl class="lvf-metrics">
      ${METRICS.map(key => `<div><dt data-lvf-metric-label="${key}"></dt><dd data-lvf-metric="${key}"></dd></div>`).join('')}
    </dl>
    <h4 data-lvf-label="measures"></h4><dl class="lvf-echo"></dl>
    <p class="lvf-scope" data-lvf-label="scope"></p>
    <details><summary data-lvf-label="sources"></summary>
      <a href="https://pubmed.ncbi.nlm.nih.gov/7858131/" target="_blank" rel="noopener noreferrer">Cannell et al. · 1994</a>
      <a href="https://pubmed.ncbi.nlm.nih.gov/4841253/" target="_blank" rel="noopener noreferrer">Suga &amp; Sagawa · 1974</a>
      <a href="https://pubmed.ncbi.nlm.nih.gov/25712077/" target="_blank" rel="noopener noreferrer">Lang et al. · ASE/EACVI</a>
    </details>`;
  const $ = selector => root.querySelector(selector);
  const presets = $('[data-lvf-presets]');
  presets.before(motion.element);
  const buttons = [...presets.querySelectorAll('button')];
  const particles = [...root.querySelectorAll('[data-lvf-particle]')];
  const gate = $('[data-lvf-gate]'), ryr = $('[data-lvf-ryr]');
  const left = $('[data-lvf-fibre="left"]'), right = $('[data-lvf-fibre="right"]'), bridges = $('[data-lvf-bridges]');
  const cavity = $('[data-lvf-cavity]'), wall = $('[data-lvf-wall]'), wallTexture = $('[data-lvf-wall-texture]');
  const reference = $('[data-lvf-reference]'), outflow = $('[data-lvf-outflow]');
  const stage = $('[data-lvf-stage]'), detail = $('[data-lvf-detail]');

  function draw(state = clock.getState()) {
    const { phase } = state;
    const { loop, geometry } = model;
    const cycle = cyclePhaseAt(phase, loop.phases);
    const excitation = excitationAt(phase, loop.phases);
    motion.render(state, cycle);
    if (shownStep !== excitation.step) {
      shownStep = excitation.step;
      root.dataset.lvfStep = String(shownStep);
      const [name, description] = LV_FUNCTION_TEXT[language].stages[shownStep];
      stage.textContent = name;
      detail.textContent = description;
    }
    const { v } = loopPointAt(loop.points, phase);
    const shortening = phase < loop.phases.ejection[0] ? 0
      : phase < loop.phases.ejection[1] ? 1 - (v - loop.esv) / loop.sv
        : (1 - phase) / (1 - loop.phases.ejection[1]);
    const slide = (shortening * loop.sv / 100) * 17;
    left.setAttribute('transform', `translate(${slide} 0)`);
    right.setAttribute('transform', `translate(${-slide} 0)`);
    bridges.setAttribute('opacity', (0.35 + excitation.calcium * 0.65).toFixed(2));
    gate.setAttribute('opacity', excitation.step === 1 ? '1' : '0.58');
    ryr.setAttribute('opacity', excitation.step === 2 ? '1' : '0.54');
    for (const [index, dot] of particles.entries()) {
      if (index === 0) {
        dot.setAttribute('cx', String(113 + clamp01((excitation.influx - 0.6) / 0.4) * 34));
        dot.setAttribute('cy', String(48 + clamp01(excitation.influx / 0.6) * 50));
        dot.setAttribute('opacity', excitation.step === 1 ? '1' : '0');
      } else {
        const drift = clamp01(excitation.calcium + (1 - index / particles.length) * 0.2);
        dot.setAttribute('cx', String(151 + (index - 4) * (3 + drift * 6)));
        dot.setAttribute('cy', String(98 + drift * (24 + index * 4)));
        dot.setAttribute('opacity', excitation.calcium.toFixed(2));
      }
    }
    const outline = cavityPath(v, geometry, true);
    wall.setAttribute('d', outline);
    wallTexture.setAttribute('d', outline);
    cavity.setAttribute('d', cavityPath(v, geometry));
    outflow.setAttribute('opacity', cycle === 'ejection' ? '1' : '0');
  }

  function renderSelection() {
    const t = LV_FUNCTION_TEXT[language], { loop, geometry, stress } = model;
    const [name, insight] = t.cases[scenario];
    $('[data-lvf-selection]').textContent = name;
    $('[data-lvf-insight]').textContent = insight;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.lvfCase === scenario));
    const values = [loop.edv, loop.esv, loop.sv, loop.ef * 100, stress];
    const units = ['mL', 'mL', 'mL', '%', 'mmHg'];
    for (const [index, key] of METRICS.entries()) {
      const output = $(`[data-lvf-metric="${key}"]`);
      output.textContent = `${Math.round(values[index])} ${units[index]}`;
      output.dataset.value = String(values[index]);
    }
    reference.setAttribute('d', cavityPath(loop.edv, geometry));
    draw();
  }

  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'tr';
    const t = LV_FUNCTION_TEXT[language];
    for (const node of root.querySelectorAll('[data-lvf-label]')) node.textContent = t[node.dataset.lvfLabel];
    presets.setAttribute('aria-label', t.scenarios);
    for (const button of buttons) button.textContent = t.cases[button.dataset.lvfCase][0];
    for (const [index, key] of METRICS.entries()) $(`[data-lvf-metric-label="${key}"]`).textContent = t.metrics[index];
    $('.lvf-echo').replaceChildren(...t.echo.map(([term, description]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = description;
      row.append(dt, dd);
      return row;
    }));
    shownStep = -1;
    motion.setLanguage();
    renderSelection();
  }

  for (const button of buttons) button.addEventListener('click', () => {
    scenario = button.dataset.lvfCase;
    model = buildCase(scenario);
    renderSelection();
  }, { signal: controller.signal });
  setLanguage(language);
  clock.subscribe(draw);
  return {
    element: root,
    setLanguage,
    destroy() {
      controller.abort();
      clock.destroy();
      root.remove();
    }
  };
}
