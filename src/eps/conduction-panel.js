/**
 * Conduction system lesson of the EPS laboratory (its own tab, #/conduction): the 3D atlas
 * heart with the conduction system (conduction-atlas.js, loaded on demand) or the 2D diagram
 * (conduction-diagram.js; the fallback when WebGL or the atlas fails), the structure list and
 * card, "play one beat" with a speed control and the lead II / V1 trace, the blood-supply
 * overlay, one "what if" scenario per structure, the summary table, clinical notes, the
 * corrections to the source schema and the sources. Same contract as the other EPS panels.
 */
import { STRUCTURE_IDS, STRUCTURES, ARTERIES, PHASES, beatTimeline, phaseAt, whatIfOf, structureOfScenario } from './conduction-model.js';
import { CONDUCTION_TEXT, CONDUCTION_REFERENCES } from './conduction-text.js';
import { drawConductionTrace } from './conduction-trace.js';
import { createConductionDiagram } from './conduction-diagram.js';

export const CONDUCTION_SPEEDS = Object.freeze([0.1, 0.25, 0.5, 1]);
const VIEW_IDS = ['anterior', 'rao', 'lao', 'posterior'];

const hasWebGL = (doc) => {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch { return false; }
};

/**
 * @param {Document} doc
 * @param {{ getLang?: () => string, loadAtlas?: () => Promise<{ createConductionAtlas: Function }> }} [options]
 */
export function createConductionPanel(doc, { getLang = () => 'tr', loadAtlas = () => import('./conduction-atlas.js') } = {}) {
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const t = () => CONDUCTION_TEXT[lang()];
  const state = { selected: 'sa', scenario: 'normal', supply: false, labels: true, mode: '3d', view: 'anterior', speed: 0.25, playing: false, time: null };
  let active = false, frame = null, lastFrame = 0, atlas = null, atlasStatus = 'idle', atlasRequested = false, stepsKey = '';

  const node = (tag, className, attrs = {}) => {
    const n = doc.createElement(tag);
    if (className) n.className = className;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const button = (className, attrs = {}) => { const b = node('button', className, attrs); b.type = 'button'; return b; };

  const root = node('section', 'cond-lab', { 'data-conduction': '' });
  root.hidden = true;
  const header = node('header', 'cond-header');
  const eyebrow = node('span', 'cond-eyebrow'), title = node('h2'), intro = node('p');
  const headText = node('div');
  headText.append(eyebrow, title, intro);
  header.append(headText);

  // Visual column: toolbar, stage, legend, play bar, trace and intervals.
  const visual = node('div', 'cond-visual');
  const toolbar = node('div', 'cond-toolbar');
  const modeGroup = node('div', 'cond-group', { role: 'group' });
  const modeButtons = ['3d', '2d'].map((id) => { const b = button('', { 'data-cond-mode': id }); b.addEventListener('click', () => setMode(id)); modeGroup.append(b); return b; });
  const viewGroup = node('div', 'cond-group', { role: 'group' });
  const viewButtons = VIEW_IDS.map((id) => { const b = button('', { 'data-cond-view': id }); b.addEventListener('click', () => { state.view = id; atlas?.view(id); refresh(); }); viewGroup.append(b); return b; });
  const supplyBtn = button('', { 'data-cond-supply': '' });
  supplyBtn.addEventListener('click', () => { state.supply = !state.supply; refresh(); });
  const labelsBtn = button('', { 'data-cond-labels': '' });
  labelsBtn.addEventListener('click', () => { state.labels = !state.labels; refresh(); });
  toolbar.append(modeGroup, viewGroup, supplyBtn, labelsBtn);
  const stage = node('div', 'cond-stage');
  const status = node('p', 'cond-status', { role: 'status' });
  const hint = node('p', 'cond-hint');
  const diagram = createConductionDiagram({ doc, text: t, onSelect: (id) => select(id) });
  stage.append(diagram.element, status, hint);
  const legend = node('p', 'cond-legend');
  const playbar = node('div', 'cond-playbar');
  const playBtn = button('cond-play', { 'data-cond-play': '' });
  playBtn.addEventListener('click', () => play());
  const speedLabel = node('label', 'cond-speed');
  const speedText = node('span');
  const speedSelect = node('select', '', { 'data-cond-speed': '' });
  for (const s of CONDUCTION_SPEEDS) { const o = node('option'); o.value = String(s); speedSelect.append(o); }
  speedSelect.value = String(state.speed);
  speedSelect.addEventListener('change', () => { state.speed = Number(speedSelect.value) || 0.25; });
  speedLabel.append(speedText, speedSelect);
  const phase = node('p', 'cond-phase', { 'data-cond-phase': '', 'aria-live': 'polite' });
  playbar.append(playBtn, speedLabel, phase);
  const trace = node('canvas', 'cond-trace', { 'data-cond-trace': '', role: 'img' });
  const intervals = node('div', 'cond-intervals', { 'data-cond-intervals': '' });
  const intervalsNote = node('p', 'cond-note');
  visual.append(toolbar, stage, legend, playbar, trace, intervals, intervalsNote);

  // Console: structure list, card with the "what if" toggle, scenario, steps.
  const console_ = node('aside', 'cond-console');
  const listTitle = node('h3', 'cond-small-title');
  const list = node('div', 'cond-list', { role: 'group' });
  const listButtons = STRUCTURE_IDS.map((id) => { const b = button('', { 'data-cond-structure': id }); b.addEventListener('click', () => select(id)); list.append(b); return b; });
  const card = node('article', 'cond-card', { 'data-cond-card': '' });
  const scenarioBox = node('div', 'cond-scenario', { 'data-cond-scenario': '' });
  const stepsTitle = node('h3', 'cond-small-title');
  const steps = node('ol', 'cond-steps', { 'data-cond-steps': '' });
  console_.append(listTitle, list, card, scenarioBox, stepsTitle, steps);

  const grid = node('div', 'cond-grid');
  grid.append(visual, console_);
  const sections = node('div', 'cond-sections');
  root.append(header, grid, sections);

  const fmt = (x) => (lang() === 'tr' ? String(x).replace('.', ',') : String(x));
  const rateText = (id) => {
    const r = STRUCTURES[id].rate;
    return r ? `${r[0]}-${r[1]}${t().perMin}` : t().noPacemaker;
  };
  const velocityText = (id) => {
    const [a, b] = STRUCTURES[id].velocity;
    return `${a === b ? fmt(a) : `${fmt(a)}-${fmt(b)}`} ${t().velocityUnit}`;
  };
  const supplyChips = (id) => STRUCTURES[id].supply.map((s) => {
    const share = s.share ? (lang() === 'tr' ? ` %${s.share}` : ` ${s.share}%`) : '';
    return `<span class="cond-artery"><i style="background:${ARTERIES[s.artery].color}"></i>${t().arteries[s.artery]}${share}</span>`;
  }).join('');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function renderCard() {
    const words = t(), s = words.structure[state.selected], id = state.selected;
    const whatIf = whatIfOf(id);
    const on = whatIf && state.scenario === whatIf;
    card.innerHTML = `
      <h3>${esc(s.name)}</h3>
      <dl>
        <dt>${esc(words.card.location)}</dt><dd>${esc(s.location)}</dd>
        <dt>${esc(words.card.rate)}</dt><dd data-cond-rate>${esc(rateText(id))}</dd>
        <dt>${esc(words.card.velocity)}</dt><dd data-cond-velocity>${esc(velocityText(id))}</dd>
        <dt>${esc(words.card.ecg)}</dt><dd>${esc(s.ecg)}</dd>
        <dt>${esc(words.card.supply)}</dt><dd><div class="cond-arteries">${supplyChips(id)}</div>${esc(s.supply)}</dd>
        <dt>${esc(words.card.function)}</dt><dd>${esc(s.function)}</dd>
      </dl>
      <p class="cond-correction"><strong>${esc(words.card.note)}:</strong> ${esc(s.note)}</p>
      <div class="cond-whatif">
        ${whatIf ? `<button type="button" data-cond-whatif aria-pressed="${on}">${esc(words.whatIf)} · ${esc(words.scenario[whatIf].name)}</button>` : `<p class="cond-muted">${esc(words.whatIfNone)}</p>`}
      </div>`;
    card.querySelector('[data-cond-whatif]')?.addEventListener('click', () => setScenario(on ? 'normal' : whatIf));
  }

  function renderScenario() {
    const words = t(), sc = words.scenario[state.scenario];
    scenarioBox.innerHTML = `<span class="cond-small-title">${esc(words.scenarioLabel)}</span><strong>${esc(sc.name)}</strong><p>${esc(sc.effect)}</p>${state.scenario === 'normal' ? '' : `<button type="button" data-cond-normal>${esc(words.backToNormal)}</button>`}`;
    scenarioBox.classList.toggle('is-abnormal', state.scenario !== 'normal');
    scenarioBox.querySelector('[data-cond-normal]')?.addEventListener('click', () => setScenario('normal'));
  }

  function renderIntervals() {
    const words = t(), iv = beatTimeline(state.scenario).intervals;
    intervals.innerHTML = ['pr', 'ah', 'hv', 'p', 'qrs', 'rate'].map((k) => {
      const v = iv[k];
      const value = v === null ? '∅' : k === 'rate' ? `${v}${words.perMin}` : `${v} ${words.ms}`;
      return `<span class="cond-interval" data-cond-interval="${k}"><em>${esc(words.intervals[k])}</em><strong>${esc(value)}</strong></span>`;
    }).join('');
  }

  function renderSections() {
    const words = t();
    const rows = STRUCTURE_IDS.map((id) => {
      const s = words.structure[id];
      return `<tr><th scope="row">${esc(s.name)}</th><td>${esc(s.location)}</td><td>${esc(rateText(id))}</td><td>${esc(velocityText(id))}</td><td>${esc(s.function)}</td><td>${esc(s.ecg)}</td></tr>`;
    }).join('');
    const li = (items) => items.map((x) => `<li>${esc(x)}</li>`).join('');
    sections.innerHTML = `
      <section><h3>${esc(words.ventricularTitle)}</h3><ol>${li(words.ventricularOrder)}</ol></section>
      <section><h3>${esc(words.clinicalTitle)}</h3><ul>${li(words.clinical)}</ul></section>
      <section class="cond-corrections"><h3>${esc(words.correctionsTitle)}</h3><ul>${li(words.corrections)}</ul></section>
      <section class="cond-table-box"><h3>${esc(words.tableTitle)}</h3><div class="cond-table-scroll"><table class="cond-table"><thead><tr>${words.tableHead.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="cond-sources"><h3>${esc(words.sourcesTitle)}</h3><ol>${CONDUCTION_REFERENCES.map((r) => `<li><a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener noreferrer">${esc(r.cite)}</a></li>`).join('')}</ol>
      <p class="cond-muted">${esc(words.schematicNote)}</p><p class="cond-muted">${esc(words.disclaimer)}</p></section>`;
  }

  function renderSteps() {
    const words = t(), beat = beatTimeline(state.scenario);
    const now = state.time === null ? null : phaseAt(beat, state.time);
    const ids = PHASES.filter((p) => p !== 'pause' || beat.escape);
    // Rebuilt only when the step or the language changes, so the live region is not re-announced every frame.
    const key = `${lang()}|${state.scenario}|${now}`;
    if (key === stepsKey) return;
    stepsKey = key;
    steps.innerHTML = ids.map((p) => `<li data-cond-step="${p}" class="${p === now ? 'is-now' : ''}">${esc(words.phases[p])}</li>`).join('');
    phase.textContent = now ? `${words.phaseLabel}: ${words.phases[now]}` : '';
    root.dataset.phase = now || '';
  }

  function drawTrace() {
    const words = t();
    trace.setAttribute('aria-label', words.traceLabel);
    drawConductionTrace(trace, beatTimeline(state.scenario), { t: state.time, labels: words.lead, marks: { p: words.intervals.p, pr: words.intervals.pr, qrs: words.intervals.qrs } });
  }

  function paintView() {
    const view = { beat: beatTimeline(state.scenario), t: state.time, selected: state.selected, supply: state.supply, labels: state.labels };
    if (state.mode === '3d' && atlas) atlas.setState(view);
    else diagram.update(view);
  }

  function refreshText() {
    const words = t();
    eyebrow.textContent = words.eyebrow; title.textContent = words.title; intro.textContent = words.intro;
    modeButtons[0].textContent = words.view3d; modeButtons[1].textContent = words.view2d;
    modeGroup.setAttribute('aria-label', `${words.view3d} / ${words.view2d}`);
    viewGroup.setAttribute('aria-label', words.viewLabel);
    viewButtons.forEach((b, i) => { b.textContent = words.views[VIEW_IDS[i]]; });
    supplyBtn.textContent = words.supply; labelsBtn.textContent = words.labels;
    legend.textContent = words.legend;
    hint.textContent = state.mode === '3d' && atlas ? words.dragHint : '';
    speedText.textContent = words.speed;
    [...speedSelect.options].forEach((o) => { o.textContent = words.speedOption(fmt(o.value)); });
    playBtn.textContent = state.playing ? words.playing : state.time !== null ? words.replay : words.play;
    intervalsNote.textContent = words.intervalsNote;
    listTitle.textContent = words.structures; list.setAttribute('aria-label', words.structures);
    listButtons.forEach((b, i) => { b.textContent = words.structure[STRUCTURE_IDS[i]].name; });
    stepsTitle.textContent = words.steps;
    status.textContent = atlasStatus === 'loading' && state.mode === '3d' ? words.loading : atlasStatus === 'failed' ? words.failed : atlasStatus === 'nowebgl' ? words.fallback : '';
    status.hidden = !status.textContent;
    renderCard(); renderScenario(); renderIntervals(); renderSections(); renderSteps();
  }

  /** Buttons' pressed state, the visible stage and the view; cheap, run on every change. */
  function refresh() {
    for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.dataset.condMode === state.mode));
    for (const b of viewButtons) b.setAttribute('aria-pressed', String(b.dataset.condView === state.view));
    viewGroup.hidden = state.mode !== '3d' || !atlas;
    supplyBtn.setAttribute('aria-pressed', String(state.supply));
    labelsBtn.setAttribute('aria-pressed', String(state.labels));
    legend.hidden = !state.supply;
    for (const b of listButtons) b.setAttribute('aria-pressed', String(b.dataset.condStructure === state.selected));
    diagram.element.hidden = state.mode === '3d' && Boolean(atlas);
    if (atlas) atlas.element.hidden = state.mode !== '3d';
    Object.assign(root.dataset, { mode: state.mode === '3d' && atlas ? '3d' : '2d', scenario: state.scenario, selected: state.selected, playing: String(state.playing), atlas: atlasStatus });
    paintView();
    drawTrace();
  }

  function ensureAtlas() {
    if (atlasRequested || state.mode !== '3d') return;
    atlasRequested = true;
    if (!hasWebGL(doc)) { atlasStatus = 'nowebgl'; state.mode = '2d'; render(); return; }
    atlasStatus = 'loading';
    loadAtlas().then(({ createConductionAtlas }) => {
      let view = null;
      view = createConductionAtlas({
        getLang: lang, text: t, onSelect: (id) => select(id),
        onStatus: (s) => {
          atlasStatus = s;
          if (s === 'failed') { view?.destroy?.(); atlas = null; state.mode = '2d'; }
          render();
        }
      });
      if (!view.ok || atlasStatus === 'failed') { atlas = null; state.mode = '2d'; render(); return; }
      atlas = view;
      stage.prepend(view.element);
      atlas.view(state.view);
      render();
    }).catch((error) => {
      console.warn('Conduction atlas module:', error);
      atlasStatus = 'failed'; state.mode = '2d'; render();
    });
  }

  function render() {
    refreshText();
    refresh();
  }

  function select(id) {
    if (!STRUCTURE_IDS.includes(id)) return;
    state.selected = id;
    renderCard();
    refresh();
  }

  function setScenario(id) {
    const beat = beatTimeline(id);
    state.scenario = beat.id;
    stop();
    state.time = null;
    const owner = structureOfScenario(beat.id);
    if (owner) state.selected = owner;
    render();
    if (beat.id !== 'normal') play();
  }

  function setMode(id) {
    // Without WebGL or after an atlas failure the 2D diagram stays.
    state.mode = id === '2d' || ['failed', 'nowebgl'].includes(atlasStatus) ? '2d' : '3d';
    if (state.mode === '3d') ensureAtlas();
    render();
  }

  function stop() {
    if (frame !== null) globalThis.cancelAnimationFrame?.(frame);
    frame = null; lastFrame = 0; state.playing = false;
  }

  function tick(now) {
    frame = null;
    if (!active || !state.playing) return;
    const beat = beatTimeline(state.scenario);
    const dt = lastFrame ? Math.min(64, now - lastFrame) : 0;
    lastFrame = now;
    state.time = Math.min(beat.duration, (state.time ?? 0) + dt * state.speed);
    if (state.time >= beat.duration) { state.playing = false; refreshText(); }
    else frame = globalThis.requestAnimationFrame?.(tick) ?? null;
    renderSteps();
    refresh();
  }

  function play() {
    stop();
    state.time = 0;
    state.playing = true;
    refreshText();
    refresh();
    frame = globalThis.requestAnimationFrame?.(tick) ?? null;
  }

  return {
    element: root,
    render,
    draw() { if (active) refresh(); },
    setActive(next) {
      active = Boolean(next);
      root.hidden = !active;
      if (active) { ensureAtlas(); render(); }
      else stop();
    },
    select, setScenario, setMode, play,
    /** Jump to a time of the beat without playing (tests, stepping). */
    seek(ms) { stop(); state.time = Math.max(0, Math.min(beatTimeline(state.scenario).duration, Number(ms) || 0)); renderSteps(); refreshText(); refresh(); },
    getState: () => ({ ...state, atlas: atlasStatus }),
    getAtlas: () => atlas
  };
}
