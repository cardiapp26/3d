import { TRAFFIC_JOURNEYS, TRAFFIC_TARGETS, JOURNEY_WORDS } from './lipoprotein-journey-data.js';
import { createMetabolismScene } from './lipoprotein-metabolism.js';

const NS = 'http://www.w3.org/2000/svg';
const STAGE_SECONDS = 8;
const MORPH_SECONDS = 3.5;
const COLORS = ['#f5c518', '#ff8a1c', '#6b3f1f', '#1f4fd1'];
const ease = x => x * x * (3 - 2 * x);
const lerp = (a, b, p) => a + (b - a) * p;

/** A single enlarged particle, driven by the traffic scene's scaled, pausable clock. */
export function createLipoproteinJourney({ mount, getLang, onManual = () => {} }) {
  let pathway = TRAFFIC_JOURNEYS[0], stage = 0, elapsed = 0, targetId = 'ldlr', selectedParticle = 'ldl', ezetimibe = false;
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const t = value => typeof value === 'string' ? value : value[lang()];
  const w = () => JOURNEY_WORDS[lang()];
  mount.innerHTML = `<section class="lpt-journey">
    <h3></h3><p class="lpt-journey-intro"></p><p class="lpt-journey-lpa" hidden></p>
    <div class="lpt-pathways" role="group"></div><ol class="lpt-stages"></ol>
    <svg class="lpt-morph" viewBox="70 0 420 250" role="img"><title></title>
      <text x="180" y="22" text-anchor="middle" data-journey-change></text>
      <ellipse cx="180" cy="120" fill="none" stroke="#7d9f8e" stroke-width="1.5" stroke-dasharray="5 4" data-journey-before/>
      <path d="M355 62Q395 38 437 62V188Q395 212 355 188Z" fill="#e3ede6" stroke="#91aa9a" stroke-width="2" data-journey-cell/>
      <text x="398" y="228" text-anchor="middle" data-journey-destination></text>
      <g data-journey-particle><ellipse cx="180" cy="120" fill="#fff8dc" stroke="#5aa9e6" stroke-width="5" data-journey-shell/>
        <g data-journey-lipids></g><path fill="none" stroke-width="9" stroke-linecap="round" data-journey-protein/>
      </g><g data-journey-transfer></g>
      <path fill="none" stroke="#527763" stroke-width="2" data-journey-arrow/>
      <text x="180" y="226" text-anchor="middle" data-journey-identity></text>
      <text x="398" y="120" text-anchor="middle" data-journey-target></text>
    </svg><div class="lpt-journey-legend" data-journey-legend></div>
    <svg class="lpt-metabolism" viewBox="0 0 420 224" role="img" hidden><title></title>
      <g data-metabolism-art></g><g data-metabolism-paths></g>
    </svg><div class="lpt-journey-legend" data-metabolism-legend hidden></div>
    <label class="lpt-metabolism-toggle" hidden><input type="checkbox" data-metabolism-ezetimibe><span></span></label>
    <div class="lpt-journey-transport" aria-live="polite"></div>
    <div class="lpt-stage-copy" aria-live="polite"><h4></h4><p></p></div>
    <div class="lpt-journey-controls"><button type="button" data-lpt-prev></button><label><span data-lpt-timeline-label></span><input type="range" min="0" step="1" value="0" data-lpt-timeline></label><button type="button" data-lpt-next></button></div>
    <p class="lpt-journey-identity"></p><p class="lpt-journey-note"></p>
  </section><section class="lpt-targets"><h3></h3><p class="lpt-target-hint"></p>
    <div class="lpt-target-buttons" role="group"></div><article class="lpt-target-card" aria-live="polite"><h4></h4><p class="lpt-target-kind"></p><dl></dl></article>
  </section>`;
  const $ = selector => mount.querySelector(selector);
  const svg = $('.lpt-morph');
  const metabolismSvg = $('.lpt-metabolism');
  const metabolism = createMetabolismScene(metabolismSvg, $('[data-metabolism-legend]'));
  const ezetimibeToggle = $('[data-metabolism-ezetimibe]');
  ezetimibeToggle.addEventListener('change', () => {
    ezetimibe = ezetimibeToggle.checked;
    renderStage();
  });
  const add = (parent, tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node); return node;
  };
  const dots = ['tg', 'ce', 'fc'].flatMap((kind, k) => Array.from({ length: 22 }, (_, i) => ({
    kind, i, node: add($('[data-journey-lipids]'), 'circle', { r: 5.5, fill: COLORS[k], stroke: '#fff', 'stroke-width': 1 })
  })));
  const transfers = Array.from({ length: 6 }, () => add($('[data-journey-transfer]'), 'circle', { r: 5, stroke: '#fff', 'stroke-width': 1.2 }));
  const pathwayButtons = TRAFFIC_JOURNEYS.map(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.lptPathway = item.id;
    button.addEventListener('click', () => {
      onManual(); pathway = item; stage = 0; elapsed = 0; selectedParticle = item.id;
      buildStages(); refresh();
      if (item.stages[0].target) selectTarget(item.stages[0].target);
    });
    $('.lpt-pathways').append(button); return button;
  });
  const targetButtons = TRAFFIC_TARGETS.map(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.lptTarget = item.id;
    button.addEventListener('click', () => selectTarget(item.id));
    $('.lpt-target-buttons').append(button); return button;
  });

  function selectTarget(id) {
    if (!TRAFFIC_TARGETS.some(item => item.id === id)) return;
    targetId = id; renderTarget();
  }
  function renderTarget() {
    const item = TRAFFIC_TARGETS.find(value => value.id === targetId);
    for (const button of targetButtons) {
      const entry = TRAFFIC_TARGETS.find(value => value.id === button.dataset.lptTarget);
      button.textContent = `${entry.label} · ${t(entry.kind)}`;
      button.setAttribute('aria-pressed', String(entry.id === targetId));
    }
    $('.lpt-target-card').dataset.target = targetId;
    $('.lpt-target-card h4').textContent = `${item.label}: ${t(item.name)}`;
    $('.lpt-target-kind').textContent = t(item.kind);
    $('.lpt-target-card dl').replaceChildren(...[[w().location, t(item.site)], [w().role, t(item.role)]].flatMap(([name, value]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = name; dd.textContent = value; return [dt, dd];
    }));
  }
  function buildStages() {
    $('.lpt-stages').replaceChildren(...pathway.stages.map((item, i) => {
      const li = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.dataset.lptStage = i;
      button.addEventListener('click', () => seek(i)); li.append(button); return li;
    }));
    $('[data-lpt-timeline]').max = pathway.stages.length - 1;
  }
  function seek(index) {
    onManual();
    stage = Math.max(0, Math.min(pathway.stages.length - 1, index));
    elapsed = pathway.stages[stage].scene ? 0 : MORPH_SECONDS;
    renderStage({ followTarget: true });
  }
  $('[data-lpt-prev]').addEventListener('click', () => seek(stage - 1));
  $('[data-lpt-next]').addEventListener('click', () => seek(stage + 1));
  $('[data-lpt-timeline]').addEventListener('input', event => seek(Number(event.target.value)));

  function renderStage({ followTarget = false } = {}) {
    const current = pathway.stages[stage];
    const hasScene = Boolean(current.scene);
    svg.toggleAttribute('hidden', hasScene);
    $('[data-journey-legend]').hidden = hasScene;
    metabolismSvg.toggleAttribute('hidden', !hasScene);
    if (!hasScene) $('[data-metabolism-legend]').hidden = true;
    ezetimibeToggle.closest('label').hidden = current.scene !== 'uptake';
    ezetimibeToggle.nextElementSibling.textContent = lang() === 'tr' ? 'Ezetimib etkisini göster' : 'Show ezetimibe effect';
    $('.lpt-journey').dataset.pathway = pathway.id;
    $('.lpt-journey').dataset.stage = stage;
    for (const button of mount.querySelectorAll('[data-lpt-stage]')) {
      const i = Number(button.dataset.lptStage);
      button.textContent = `${i + 1}. ${t(pathway.stages[i].label)}`;
      button.setAttribute('aria-pressed', String(i === stage));
      if (i === stage) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    }
    $('.lpt-stage-copy h4').textContent = t(current.title);
    $('.lpt-stage-copy p').textContent = t(current.detail);
    $('[data-lpt-timeline]').value = stage;
    $('[data-lpt-timeline]').setAttribute('aria-valuetext', `${stage + 1}/${pathway.stages.length}: ${t(current.label)}`);
    $('[data-lpt-timeline-label]').textContent = `${w().progress} ${stage + 1}/${pathway.stages.length}`;
    $('[data-lpt-prev]').disabled = stage === 0;
    $('[data-lpt-next]').disabled = stage === pathway.stages.length - 1;
    $('.lpt-journey-transport').textContent = current.transfer ? w()[current.transfer] : t(current.label);
    if (followTarget && current.target) selectTarget(current.target);
    if (hasScene) {
      metabolismSvg.querySelector('title').textContent = `${t(current.title)}. ${t(current.detail)}`;
      metabolism.show(current.scene, lang(), ezetimibe);
      draw();
      return;
    }
    svg.querySelector('title').textContent = `${t(current.title)}. ${t(current.detail)}`;
    $('[data-journey-identity]').textContent = pathway.apo;
    $('[data-journey-change]').textContent = stage > 0 && ['out', 'esterify', 'in'].includes(current.transfer)
      ? `${t(pathway.stages[stage - 1].label)} → ${t(current.label)}` : t(current.label);
    $('[data-journey-destination]').textContent = current.transfer === 'out' ? (lang() === 'tr' ? 'Doku' : 'Tissue') : current.transfer === 'in' ? (lang() === 'tr' ? 'Hücre' : 'Cell') : current.transfer === 'whole' || current.transfer === 'selective' ? (lang() === 'tr' ? 'Karaciğer' : 'Liver') : '';
    $('[data-journey-target]').textContent = current.target ? TRAFFIC_TARGETS.find(item => item.id === current.target).label : '';
    const cellTransfer = ['in', 'out', 'whole', 'selective'].includes(current.transfer);
    $('[data-journey-cell]').setAttribute('visibility', cellTransfer ? 'visible' : 'hidden');
    $('[data-journey-arrow]').setAttribute('d', !cellTransfer ? '' : current.transfer === 'in'
      ? 'M337 120H270M280 111L269 120L280 129'
      : 'M270 120H337M327 111L338 120L327 129');
    draw();
  }

  function draw() {
    const current = pathway.stages[stage], prev = pathway.stages[Math.max(0, stage - 1)];
    const raw = Math.min(1, elapsed / MORPH_SECONDS), p = ease(raw);
    if (current.scene) {
      metabolism.draw(p);
      return;
    }
    const radius = lerp(prev.radius, current.radius, p);
    const uptake = current.transfer === 'whole' ? p : 0;
    const isDisk = pathway.id === 'hdl';
    const diskHeight = index => isDisk && index < 2 ? 0.32 : 1;
    const aspect = lerp(diskHeight(Math.max(0, stage - 1)), diskHeight(stage), p);
    const shell = $('[data-journey-shell]');
    shell.setAttribute('rx', radius); shell.setAttribute('ry', radius * aspect);
    shell.setAttribute('opacity', isDisk && stage < 2 ? (stage === 0 ? 0 : p) : 1);
    const before = $('[data-journey-before]');
    before.setAttribute('rx', prev.radius); before.setAttribute('ry', prev.radius * diskHeight(Math.max(0, stage - 1)));
    before.setAttribute('visibility', stage > 0 && ['out', 'in', 'esterify'].includes(current.transfer) ? 'visible' : 'hidden');
    const group = $('[data-journey-particle]');
    group.setAttribute('transform', `translate(${uptake * 215} 0)`);
    group.setAttribute('opacity', 1 - uptake * 0.85);
    // Surface identity remains attached throughout remodelling and whole-particle uptake.
    const protein = $('[data-journey-protein]');
    protein.setAttribute('stroke', isDisk ? '#14a35a' : '#1f4fd1');
    const r = radius + 4;
    protein.setAttribute('d', `M${180 - r * 0.87} ${120 + r * 0.5 * aspect}A${r} ${r * aspect} 0 0 0 ${180 + r * 0.87} ${120 + r * 0.5 * aspect}`);
    for (const { kind, i, node } of dots) {
      const n = lerp(prev[kind] || 0, current[kind] || 0, p);
      const a = i * 2.39996, dist = radius * 0.76 * Math.sqrt((i + 0.5) / 22);
      node.setAttribute('cx', 180 + Math.cos(a) * dist);
      node.setAttribute('cy', 120 + Math.sin(a) * dist * aspect);
      if (kind === 'fc') {
        const angle = i * 2 * Math.PI / 6;
        node.setAttribute('cx', 180 + Math.cos(angle) * (radius - 5));
        node.setAttribute('cy', 120 + Math.sin(angle) * (radius - 5) * aspect);
      } else if (kind === 'ce') {
        node.setAttribute('cx', 180 + Math.cos(a + 1.2) * dist * 0.65);
        node.setAttribute('cy', 120 + Math.sin(a + 1.2) * dist * 0.65 * aspect);
      }
      node.setAttribute('opacity', Math.max(0, Math.min(1, n - i)));
    }
    const moving = ['out', 'in', 'selective', 'esterify'].includes(current.transfer) && raw < 1;
    for (let i = 0; i < transfers.length; i++) {
      const node = transfers[i], f = Math.max(0, Math.min(1, raw * 1.6 - i * 0.12));
      const incoming = current.transfer === 'in', esterify = current.transfer === 'esterify';
      const x = esterify ? lerp(180 + radius, 180, f) : incoming ? lerp(355, 180 + radius * 0.6, f) : lerp(180 + radius * 0.6, 365, f);
      node.setAttribute('cx', x); node.setAttribute('cy', 95 + (i % 3) * 24);
      node.setAttribute('fill', current.transfer === 'out' ? '#f5c518' : incoming ? '#6b3f1f' : '#ff8a1c');
      node.setAttribute('opacity', moving && f > 0 && f < 1 ? Math.sin(f * Math.PI) : 0);
    }
  }
  function refresh() {
    $('.lpt-journey h3').textContent = w().title;
    $('.lpt-journey-intro').textContent = w().intro;
    $('.lpt-journey-lpa').hidden = selectedParticle !== 'lpa';
    $('.lpt-journey-lpa').textContent = w().lpa;
    for (const button of pathwayButtons) {
      const item = TRAFFIC_JOURNEYS.find(value => value.id === button.dataset.lptPathway);
      button.textContent = t(item.name); button.setAttribute('aria-pressed', String(item.id === pathway.id));
    }
    $('.lpt-pathways').setAttribute('aria-label', w().pathways);
    $('[data-lpt-prev]').textContent = w().previous; $('[data-lpt-next]').textContent = w().next;
    $('[data-lpt-timeline]').setAttribute('aria-label', w().progress);
    $('[data-journey-legend]').replaceChildren(...w().legend.map((text, i) => {
      const span = document.createElement('span'); span.textContent = text;
      span.style.setProperty('--lpt-dot', i === 3 && pathway.id === 'hdl' ? '#14a35a' : COLORS[i]); return span;
    }));
    $('.lpt-journey-identity').textContent = t(pathway.identity);
    $('.lpt-journey-note').textContent = w().note;
    $('.lpt-targets h3').textContent = w().targets;
    $('.lpt-target-hint').textContent = w().targetHint;
    $('.lpt-target-buttons').setAttribute('aria-label', w().targets);
    renderStage(); renderTarget();
  }
  buildStages(); refresh();
  return {
    refresh, selectTarget,
    selectParticle(id) {
      selectedParticle = id;
      const next = TRAFFIC_JOURNEYS.find(item => item.particles.includes(id));
      if (next !== pathway) { pathway = next; stage = 0; elapsed = 0; buildStages(); }
      refresh();
    },
    advance(dt) {
      elapsed += dt;
      if (elapsed >= STAGE_SECONDS && stage < pathway.stages.length - 1) {
        stage += 1; elapsed -= STAGE_SECONDS; renderStage({ followTarget: true });
      } else if (pathway.stages[stage].scene) {
        if (elapsed >= STAGE_SECONDS) elapsed %= STAGE_SECONDS;
        if (elapsed - dt < MORPH_SECONDS) draw();
      } else if (stage > 0 && elapsed - dt < MORPH_SECONDS) draw();
    }
  };
}
