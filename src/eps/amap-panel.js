import {
  GRID, HOLES, CTI, REFERENCES, SCENARIOS, COLORS, activationTimes, windowPreset, localTimes, readMap,
  colourIndex, cellOf, cellKey, sampledCells
} from './amap-model.js';
import { AMAP_TEXT } from './amap-text.js';

/*
 * Activation mapping panel (the Mapping tab): the colour map of the
 * teaching grid (amap-model.js), a timeline of every sampled point over
 * three consecutive beats with the window on it, and the controls
 * (scenario, reference, window, mapped region, colour scale, a wrong point,
 * the true mechanism) with the reading.
 */

const GUIDE = {
  tr: { play: '▶ LAT sırasını oynat', pause: 'Ⅱ Duraklat', full: 'Tüm harita', time: 'LAT sırası', hint: '1 · Kırmızıdan mora zamanı takip edin. 2 · Noktaya dokunun veya ok tuşlarıyla seçin. 3 · Referans ve pencereyi değiştirip karşılaştırın.', pick: 'Ölçüm için haritada bir nokta seçin.', outside: 'Haritalanmamış nokta', missing: 'Pencere dışında', point: 'Seçili nokta', beat: 'Atım', note: 'Oynatma, pencereye atanmış LAT sırasını gösterir; gerçek yayılımın doğrulaması değildir.', anatomy: 'TK: triküspit · MK: mitral · SVC/IVC: ana venler · PV: pulmoner ven · ○ referans · × hatalı nokta' },
  en: { play: '▶ Play LAT sequence', pause: 'Ⅱ Pause', full: 'Full map', time: 'LAT sequence', hint: '1 · Follow time from red to purple. 2 · Tap a point or select with arrow keys. 3 · Change reference and window to compare.', pick: 'Select a map point to inspect its timing.', outside: 'Unsampled point', missing: 'Outside window', point: 'Selected point', beat: 'Beat', note: 'Playback shows the assigned LAT order within the window; it does not validate true propagation.', anatomy: 'TV: tricuspid · MV: mitral · SVC/IVC: caval veins · PV: pulmonary vein · ○ reference · × wrong point' }
};

const BEAT_COLORS = { '-1': '#60a5fa', 0: '#e8f3ee', 1: '#fbbf24' };

export function createMappingPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => AMAP_TEXT[L()];
  const state = { scenario: 'focal-ra', reference: 'cs-56', windowKind: 'symmetric', left: -165, width: 100, region: 'both', scale: 'even', artifact: false, truth: false, active: false, selected: null, progress: 0, playing: false, motion: 'live', speed: 0.15, elapsed: 0 };

  const root = el('section', 'amap', { 'data-amap': '' });
  const view = el('div', 'amap-view');
  const mapCanvas = el('canvas', 'amap-canvas', { role: 'img', tabindex: '0', 'data-amap-map': '' });
  const legend = el('div', 'amap-legend', { 'data-amap-legend': '' });
  const timeCanvas = el('canvas', 'amap-timeline', { role: 'img', 'data-amap-timeline': '' });
  const guide = el('p', 'amap-guide');
  const transport = el('div', 'amap-transport');
  const play = el('button', 'amap-toggle', { type: 'button', 'data-amap-play': '' });
  const full = el('button', 'amap-toggle', { type: 'button', 'data-amap-full': '' });
  const scrubLabel = el('label', 'amap-scrub');
  const scrubText = el('span');
  const scrub = el('input', '', { type: 'range', min: '0', max: '100', step: '1', 'data-amap-progress': '' });
  const cursorTime = el('output');
  scrubLabel.append(scrubText, scrub, cursorTime);
  const motion = el('select', '', { 'data-amap-motion': '', 'aria-label': 'Animation mode' });
  const speed = el('select', '', { 'data-amap-speed': '', 'aria-label': 'Playback speed' });
  const liveStatus = el('p', 'amap-point', { 'data-amap-live-status': '' });
  transport.append(motion, speed, play, full, scrubLabel);
  const point = el('p', 'amap-point', { 'aria-live': 'polite', 'data-amap-point': '' });
  const anatomy = el('p', 'amap-note');
  const playbackNote = el('p', 'amap-note');
  view.append(guide, transport, liveStatus, mapCanvas, legend, point, anatomy, playbackNote, timeCanvas);
  let timer = null;
  let geometry = null;
  const stop = () => { if (timer != null) globalThis.clearInterval(timer); timer = null; state.playing = false; };
  const start = () => {
    stop();
    if (state.motion === 'lat' && state.progress >= 100) state.progress = 0;
    state.playing = true;
    let previous = globalThis.performance.now();
    timer = globalThis.setInterval(() => {
      const now = globalThis.performance.now(), dt = now - previous; previous = now;
      if (state.motion === 'live') {
        state.elapsed += dt * state.speed;
        state.progress = (state.elapsed % model().tcl) / model().tcl * 100;
      } else {
        state.progress = Math.min(100, state.progress + dt / 50);
        if (state.progress >= 100) stop();
      }
      renderPlayback(compute());
    }, 30);
  };
  play.addEventListener('click', () => {
    if (state.playing) stop(); else start();
    renderPlayback(compute());
  });
  motion.addEventListener('change', () => {
    stop(); state.motion = motion.value; state.elapsed = 0; state.progress = state.motion === 'live' ? 0 : 100;
    if (state.motion === 'live' && state.active) start();
    render();
  });
  speed.addEventListener('change', () => { state.speed = Number(speed.value); renderPlayback(compute()); });
  full.addEventListener('click', () => { stop(); state.progress = 100; state.motion = 'lat'; render(); });
  scrub.addEventListener('input', () => { stop(); state.progress = Number(scrub.value); state.elapsed = state.progress / 100 * model().tcl; render(); });
  mapCanvas.addEventListener('click', (event) => {
    if (!geometry) return;
    const rect = mapCanvas.getBoundingClientRect();
    const { cs, ox, oy } = geometry;
    const x = Math.floor((event.clientX - rect.left - ox) / cs);
    const y = Math.floor((event.clientY - rect.top - oy) / cs);
    if (x < 0 || y < 0 || x >= GRID.w || y >= GRID.h) return;
    const k = cellKey(x, y);
    if (!Number.isFinite(model().time[k]) || model().blocked.has(k)) return;
    state.selected = k; render();
  });
  mapCanvas.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const cells = sampledCells(model(), state.region).sort((a, b) => a - b);
    const i = cells.indexOf(state.selected);
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    state.selected = cells[(i + delta + cells.length) % cells.length]; render();
  });
  const side = el('aside', 'amap-side');
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const field = (labelKey, control) => { const l = el('label', 'amap-field'); const s = el('span'); s.dataset.key = labelKey; l.append(s, control); return l; };
  const select = (name) => el('select', '', { [`data-amap-${name}`]: '' });
  const scenarioSel = select('scenario'), referenceSel = select('reference'), windowSel = select('window'), regionSel = select('region'), scaleSel = select('scale');
  const leftInput = el('input', '', { type: 'range', min: '-400', max: '200', step: '5', 'data-amap-left': '' });
  const widthInput = el('input', '', { type: 'range', min: '50', max: '120', step: '5', 'data-amap-width': '' });
  const leftOut = el('output'), widthOut = el('output');
  const manual = el('div', 'amap-manual');
  const leftField = field('left', leftInput); leftField.append(leftOut);
  const widthField = field('width', widthInput); widthField.append(widthOut);
  manual.append(leftField, widthField);
  const toggle = (name) => { const b = el('button', 'amap-toggle', { type: 'button', [`data-amap-${name}`]: '' }); return b; };
  const artifactBtn = toggle('artifact'), truthBtn = toggle('truth');
  const toggles = el('div', 'amap-toggles');
  toggles.append(artifactBtn, truthBtn);
  const warn = el('p', 'amap-warn', { 'aria-live': 'polite', 'data-amap-warn': '' });
  const readout = el('dl', 'amap-readout', { 'data-amap-readout': '' });
  const verdict = el('p', 'amap-verdict', { 'data-amap-verdict': '' });
  const lesson = el('p', 'amap-lesson', { 'data-amap-lesson': '' });
  const truth = el('p', 'amap-truth', { 'data-amap-truth-text': '' });
  const source = el('p', 'amap-source');
  side.append(heading, intro,
    field('scenario', scenarioSel), field('reference', referenceSel), field('window', windowSel), manual,
    field('region', regionSel), field('scale', scaleSel), toggles, warn, verdict, readout, lesson, truth, source);
  root.append(view, side);

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };
  const refName = (id) => { const l = REFERENCES[id].label; return typeof l === 'string' ? l : l[L()]; };

  function setScenario(id) {
    if (!SCENARIOS[id]) return;
    const s = SCENARIOS[id];
    stop(); state.selected = null; state.elapsed = 0; state.progress = state.motion === 'live' ? 0 : 100;
    Object.assign(state, { scenario: id, reference: s.reference, region: s.region || 'both', windowKind: 'symmetric', artifact: false, truth: false });
    if (state.motion === 'live' && state.active) start();
    render();
  }
  scenarioSel.addEventListener('change', () => setScenario(scenarioSel.value));
  referenceSel.addEventListener('change', () => { state.reference = referenceSel.value; render(); });
  windowSel.addEventListener('change', () => {
    // Manual starts from the window in view, so the edges move from there.
    if (windowSel.value === 'manual') { const w = currentWindow().window; if (w) Object.assign(state, { left: w.left, width: Math.round(((w.right - w.left) / model().tcl) * 100) }); }
    state.windowKind = windowSel.value; render();
  });
  regionSel.addEventListener('change', () => { state.region = regionSel.value; render(); });
  scaleSel.addEventListener('change', () => { state.scale = scaleSel.value; render(); });
  leftInput.addEventListener('input', () => { state.left = Number(leftInput.value); state.windowKind = 'manual'; render(); });
  widthInput.addEventListener('input', () => { state.width = Number(widthInput.value); state.windowKind = 'manual'; render(); });
  artifactBtn.addEventListener('click', () => { state.artifact = !state.artifact; render(); });
  truthBtn.addEventListener('click', () => { state.truth = !state.truth; render(); });

  const cache = new Map();
  const model = () => { if (!cache.has(state.scenario)) cache.set(state.scenario, activationTimes(state.scenario)); return cache.get(state.scenario); };

  /** Window in view (null when the preset cannot be defined) and the reference time. */
  function currentWindow() {
    const at = model();
    const r = at.time[cellKey(...REFERENCES[state.reference].at)];
    if (state.windowKind === 'manual') return { window: { left: state.left, right: state.left + Math.round((at.tcl * state.width) / 100) }, referenceTime: r };
    return { window: windowPreset(state.windowKind, regionActivation(at), r), referenceTime: r };
  }
  // Activation time of the mapped region (the window methods read the P wave of what is mapped).
  function regionActivation(at) {
    const cells = sampledCells(at, state.region).map((k) => at.time[k]);
    return { ...at, activation: Math.max(...cells) - Math.min(...cells) };
  }

  /** Everything the drawings and the reading need. */
  function compute() {
    const at = model();
    const { window: win, referenceTime } = currentWindow();
    const scenario = SCENARIOS[state.scenario];
    const result = win ? localTimes(at, { reference: state.reference, left: win.left, right: win.right, region: state.region, artifact: state.artifact ? scenario.artifact : null }) : null;
    const reading = result ? readMap(result.lat) : null;
    return { at, win, referenceTime, result, reading, activation: regionActivation(at).activation };
  }

  function drawMap(c) {
    const canvas = mapCanvas;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!(width >= 2) || !(height >= 2) || typeof canvas.getContext !== 'function') return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0e1815'; ctx.fillRect(0, 0, width, height);
    const cs = Math.floor(Math.min(width / GRID.w, height / GRID.h));
    const ox = Math.floor((width - cs * GRID.w) / 2), oy = Math.floor((height - cs * GRID.h) / 2);
    geometry = { cs, ox, oy };
    const px = (x) => ox + x * cs, py = (y) => oy + y * cs;
    const { at, result, reading } = c;
    for (let k = 0; k < at.time.length; k++) {
      const [x, y] = cellOf(k);
      let fill = '#14201c';                                         // septum, holes
      if (Number.isFinite(at.time[k]) && !at.blocked.has(k)) {
        const v = result?.lat.get(k);
        fill = !result?.lat.has(k) ? '#25322d' : v == null ? '#4b5a54' : COLORS[colourIndex(v, reading.min, reading.max, state.scale)];
      }
      if ((SCENARIOS[state.scenario].scar || []).some(([sx, sy]) => sx === x && sy === y)) fill = '#55534d';
      const lat = result?.lat.get(k);
      const cursor = reading?.min + (reading?.max - reading?.min) * state.progress / 100;
      const age = ((state.elapsed - at.time[k]) % at.tcl + at.tcl) % at.tcl;
      const trail = Math.min(45, at.tcl * 0.16);
      const isLive = state.motion === 'live';
      const sampled = state.region === 'both' || x < 14;
      ctx.globalAlpha = isLive ? (sampled && age < trail ? 1 - age / trail * 0.65 : 0.18) : lat != null && lat > cursor ? 0.16 : 1;
      if (isLive && sampled && Number.isFinite(at.time[k]) && !at.blocked.has(k) && age < trail) fill = age < trail * 0.25 ? '#ffffff' : '#34d399';
      ctx.fillStyle = fill;
      ctx.fillRect(px(x) + 0.5, py(y) + 0.5, cs - 1, cs - 1);
    }
    ctx.globalAlpha = 1;
    if (state.selected != null) {
      const [sx, sy] = cellOf(state.selected);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(px(sx) - 2, py(sy) - 2, cs + 4, cs + 4);
    }
    // Anatomy labels, the old CTI line.
    ctx.font = `600 ${Math.max(9, Math.floor(cs * 0.45))}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9fc7b6';
    for (const h of HOLES) {
      const xs = h.cells.map(([x]) => x), ys = h.cells.map(([, y]) => y);
      ctx.fillText(h.label[L()], px((Math.min(...xs) + Math.max(...xs) + 1) / 2), py((Math.min(...ys) + Math.max(...ys) + 1) / 2));
    }
    ctx.fillText(L() === 'en' ? 'RA' : 'SAĞ A', px(RA_LABEL[0]), py(RA_LABEL[1]));
    ctx.fillText(L() === 'en' ? 'LA' : 'SOL A', px(LA_LABEL[0]), py(LA_LABEL[1]));
    if (SCENARIOS[state.scenario].line) {
      ctx.fillStyle = '#f87171';
      for (const [x, y] of CTI) ctx.fillRect(px(x) + cs * 0.3, py(y), cs * 0.4, cs);
    }
    // Reference electrode.
    const [rx, ry] = REFERENCES[state.reference].at;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px(rx + 0.5), py(ry + 0.5), cs * 0.42, 0, Math.PI * 2); ctx.stroke();
    // A wrong point is marked when added.
    if (state.artifact) {
      const [ax, ay] = SCENARIOS[state.scenario].artifact;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px(ax) + 3, py(ay) + 3); ctx.lineTo(px(ax + 1) - 3, py(ay + 1) - 3); ctx.moveTo(px(ax + 1) - 3, py(ay) + 3); ctx.lineTo(px(ax) + 3, py(ay + 1) - 3); ctx.stroke();
    }
    // The true mechanism.
    if (state.truth) {
      const s = SCENARIOS[state.scenario];
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      if (s.reentry) {
        const cx = px(8.5 + 0.5), cy = py(7.5 + 0.5);
        ctx.beginPath(); ctx.ellipse(cx, cy, cs * 3.4, cs * 3.4, 0, 0.2, Math.PI * 2 - 0.2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(cx + cs * 3.4, cy - 10); ctx.lineTo(cx + cs * 3.4 - 6, cy - 2); ctx.lineTo(cx + cs * 3.4 + 6, cy - 2); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      } else {
        const [ox2, oy2] = s.origin;
        ctx.beginPath(); ctx.arc(px(ox2 + 0.5), py(oy2 + 0.5), cs * 1.1, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    mapCanvas.setAttribute('aria-label', `${T().heading}: ${T().scenarios[state.scenario].name}`);
  }

  function drawTimeline(c) {
    const canvas = timeCanvas;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!(width >= 2) || !(height >= 2) || typeof canvas.getContext !== 'function') return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0e1815'; ctx.fillRect(0, 0, width, height);
    const { at, win, referenceTime, result } = c;
    const cells = sampledCells(at, state.region).sort((a, b) => at.time[a] - at.time[b]);
    // On a narrow canvas the legend takes a second line.
    const narrow = width < 640;
    const from = -1.6 * at.tcl, to = 1.6 * at.tcl, left = 8, plotW = width - 16, top = narrow ? 34 : 22, plotH = height - top - 16;
    const x = (t) => left + ((t - from) / (to - from)) * plotW;
    if (win) {
      ctx.fillStyle = 'rgba(63, 181, 143, 0.16)';
      ctx.fillRect(x(win.left), top, x(win.right) - x(win.left), plotH);
      ctx.strokeStyle = '#3fb58f'; ctx.lineWidth = 1.5;
      for (const t of [win.left, win.right]) { ctx.beginPath(); ctx.moveTo(x(t), top); ctx.lineTo(x(t), top + plotH); ctx.stroke(); }
    }
    ctx.strokeStyle = '#f87171'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x(0), top); ctx.lineTo(x(0), top + plotH); ctx.stroke(); ctx.setLineDash([]);
    cells.forEach((k, i) => {
      const y = top + (cells.length > 1 ? (i / (cells.length - 1)) * (plotH - 2) : plotH / 2) + 1;
      if (k === state.selected) {
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(left, y - 2, plotW, 4);
      }
      for (const n of [-1, 0, 1]) {
        const t = at.time[k] - referenceTime + n * at.tcl;
        if (t < from || t > to) continue;
        const chosen = result && result.lat.get(k) != null && Math.abs(result.lat.get(k) - t) < 1;
        ctx.fillStyle = BEAT_COLORS[n];
        ctx.globalAlpha = chosen ? 1 : 0.28;
        ctx.fillRect(x(t) - (chosen ? 1.5 : 1), y - (chosen ? 1 : 0.5), chosen ? 3 : 2, chosen ? 2 : 1);
      }
    });
    ctx.globalAlpha = 1;
    const t = T().timeline;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = '#9fc7b6'; ctx.fillText(t.title, left, 12);
    const legendItems = [[BEAT_COLORS[-1], t.prev], [BEAT_COLORS[0], t.cur], [BEAT_COLORS[1], t.next], ['#f87171', t.ref], ['#3fb58f', t.win]];
    if (narrow) {
      // Second line, left to right, smaller.
      ctx.font = '9px ui-monospace, monospace';
      let lx = left;
      for (const [color, name] of legendItems) { ctx.fillStyle = color; ctx.fillText(name, lx, 26); lx += (ctx.measureText(name)?.width || name.length * 5.5) + 8; }
    } else {
      let lx = width - 8;
      ctx.textAlign = 'right';
      for (const [color, name] of [...legendItems].reverse()) {
        ctx.fillStyle = color; ctx.fillText(name, lx, 12);
        lx -= (ctx.measureText(name)?.width || name.length * 6) + 14;
      }
      ctx.textAlign = 'left';
    }
    timeCanvas.setAttribute('aria-label', t.title);
  }

  function renderLegend(c) {
    const { reading } = c;
    legend.replaceChildren(...COLORS.map((color) => { const s = el('span', 'amap-swatch'); s.style.background = color; return s; }));
    const times = el('span', 'amap-legend-times');
    times.textContent = reading?.min != null ? T().legendTimes(reading.min, reading.max) : '';
    legend.append(times);
  }

  function renderReading(c) {
    const t = T(), r = t.readout, { at, win, reading, result, activation } = c;
    const scenario = SCENARIOS[state.scenario];
    const row = (label, value) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; };
    const wrong = result ? [...result.beat.values()].filter((b) => b === -1 || b === 1).length : 0;
    readout.replaceChildren(
      ...row(r.tcl, `${at.tcl} ms`),
      ...row(r.act, `${activation} ms`),
      ...row(r.windowLabel, win ? `${win.left} … ${win.right} ms (${Math.round(((win.right - win.left) / at.tcl) * 100)} %)` : '-'),
      ...row(r.red, reading ? String(reading.redRegions) : '-'),
      ...row(r.eml, reading ? (reading.earlyMeetsLate ? r.yes : r.no) : '-'),
      ...(scenario.reentry ? [] : row(r.wrong, String(wrong))),
      ...row(r.unannotated, reading ? String(reading.unannotated) : '-')
    );
    verdict.textContent = scenario.reentry ? r.reentry : activation >= at.tcl ? r.impossible : activation >= at.tcl * 0.8 ? r.hard : r.easy;
    verdict.dataset.level = scenario.reentry ? 'reentry' : activation >= at.tcl ? 'impossible' : activation >= at.tcl * 0.8 ? 'hard' : 'easy';
    warn.textContent = !win ? t.noDiastole : win.right - win.left > at.tcl ? r.wide : '';
    warn.hidden = !warn.textContent;
  }

  function renderPlayback(c) {
    const g = GUIDE[L()];
    play.disabled = scrub.disabled = state.motion === 'lat' && c.reading?.min == null;
    if (play.disabled) stop();
    play.textContent = state.playing ? g.pause : state.motion === 'live' ? (L() === 'en' ? '▶ Live propagation' : '▶ Canlı yayılım') : g.play;
    play.setAttribute('aria-pressed', String(state.playing));
    scrub.value = String(state.progress);
    liveStatus.hidden = state.motion !== 'live';
    const cycle = Math.floor(state.elapsed / c.at.tcl) + 1;
    liveStatus.textContent = L() === 'en'
      ? `${SCENARIOS[state.scenario].reentry ? 'Reentry: wave returns around the tricuspid annulus' : 'Focal: repeated spread from the source'} · Cycle ${cycle} · TCL ${c.at.tcl} ms · ${state.speed}×`
      : `${SCENARIOS[state.scenario].reentry ? 'Reentry: dalga triküspit anulus çevresinde geri dönüyor' : 'Fokal: odaktan tekrarlayan yayılım'} · Siklus ${cycle} · TCL ${c.at.tcl} ms · ${state.speed}×`;
    scrubText.textContent = state.motion === 'live' ? (L() === 'en' ? 'Cycle phase' : 'Siklus fazı') : g.time;
    if (state.motion === 'live') cursorTime.textContent = `${Math.round(state.elapsed % c.at.tcl)} / ${c.at.tcl} ms`;
    else cursorTime.textContent = c.reading?.min == null ? '-' : `${Math.round(c.reading.min + (c.reading.max - c.reading.min) * state.progress / 100)} ms`;
    drawMap(c);
  }

  function render() {
    const t = T(), g = GUIDE[L()];
    guide.textContent = g.hint;
    anatomy.textContent = g.anatomy;
    playbackNote.textContent = state.motion === 'live'
      ? (L() === 'en' ? 'White: wavefront · green: recently activated tissue. Teaching-model propagation; independent of reference, annotation error and window. Colours underneath remain the LAT map.' : 'Beyaz: dalga cephesi · yeşil: yeni aktive olmuş doku. Öğretim modelinin yayılımı; referans, hatalı nokta ve pencereden bağımsız. Alttaki renkler LAT haritasıdır.') : g.note;
    motion.replaceChildren(option('lat', L() === 'en' ? 'LAT sequence' : 'LAT sırası'), option('live', L() === 'en' ? 'Live propagation / reentry' : 'Canlı yayılım / reentry'));
    motion.value = state.motion;
    motion.setAttribute('aria-label', L() === 'en' ? 'Animation mode' : 'Animasyon modu');
    speed.replaceChildren(...[0.15, 0.3, 1].map(v => option(String(v), `${v}×`)));
    speed.value = String(state.speed); speed.hidden = state.motion !== 'live';
    speed.setAttribute('aria-label', L() === 'en' ? 'Playback speed' : 'Oynatma hızı');
    play.textContent = state.playing ? g.pause : state.motion === 'live' ? (L() === 'en' ? '▶ Live propagation' : '▶ Canlı yayılım') : g.play;
    play.setAttribute('aria-pressed', String(state.playing));
    full.textContent = g.full; scrubText.textContent = g.time; scrub.value = String(state.progress);
    heading.textContent = t.heading;
    intro.textContent = t.intro;
    for (const span of side.querySelectorAll?.('[data-key]') || []) span.textContent = t[span.dataset.key];
    scenarioSel.replaceChildren(...Object.keys(SCENARIOS).map((id) => option(id, t.scenarios[id].name)));
    scenarioSel.value = state.scenario;
    referenceSel.replaceChildren(...Object.keys(REFERENCES).map((id) => option(id, refName(id))));
    referenceSel.value = state.reference;
    windowSel.replaceChildren(...Object.keys(t.windows).map((id) => option(id, t.windows[id])));
    windowSel.value = state.windowKind;
    regionSel.replaceChildren(...Object.keys(t.regions).map((id) => option(id, t.regions[id])));
    regionSel.value = state.region;
    scaleSel.replaceChildren(...Object.keys(t.scales).map((id) => option(id, t.scales[id])));
    scaleSel.value = state.scale;
    const c = compute();
    renderPlayback(c);
    const k = state.selected;
    if (k == null) point.textContent = g.pick;
    else {
      const [x, y] = cellOf(k), lat = c.result?.lat.get(k), beat = c.result?.beat.get(k);
      const value = !c.result?.lat.has(k) ? g.outside : lat == null ? g.missing : `LAT ${lat} ms · ${g.beat}: ${beat > 0 ? '+' : ''}${beat}`;
      point.textContent = `${g.point} (${x + 1}, ${y + 1}) · ${x < 14 ? t.regions.ra : L() === 'en' ? 'Left atrium / septum' : 'Sol atriyum / septum'} · ${value}`;
    }
    manual.hidden = state.windowKind !== 'manual';
    if (c.win) { leftInput.value = String(c.win.left); widthInput.value = String(Math.round(((c.win.right - c.win.left) / c.at.tcl) * 100)); }
    leftOut.textContent = `${leftInput.value} ms`;
    widthOut.textContent = `${widthInput.value} %`;
    artifactBtn.textContent = t.artifact; artifactBtn.setAttribute('aria-pressed', String(state.artifact));
    truthBtn.textContent = t.truth; truthBtn.setAttribute('aria-pressed', String(state.truth));
    lesson.textContent = t.scenarios[state.scenario].lesson;
    truth.textContent = t.scenarios[state.scenario].truth;
    truth.hidden = !state.truth;
    source.textContent = t.source;
    renderReading(c);
    renderLegend(c);
    drawMap(c);
    drawTimeline(c);
    return c;
  }

  if (typeof globalThis.ResizeObserver === 'function') {
    const observer = new globalThis.ResizeObserver(() => { if (state.active) { const c = compute(); drawMap(c); drawTimeline(c); } });
    observer.observe(mapCanvas); observer.observe(timeCanvas);
  }
  return {
    element: root,
    render,
    setActive(flag) { const opening = !state.active && Boolean(flag); state.active = Boolean(flag); if (!state.active) stop(); root.hidden = !state.active; if (opening && state.motion === 'live') start(); if (state.active) render(); },
    setScenario,
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); return render(); },
    getState: () => ({ ...state })
  };
}

const RA_LABEL = [3.5, 12.5];
const LA_LABEL = [22, 4.5];
