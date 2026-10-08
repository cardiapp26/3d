import { N, FRAMES, FRAME_MS, CFAE_MS, LEVEL, RESOLUTIONS, ABLATIONS, SCENARIOS, simulate, ablationLesions, outcome, electrogram, deflections, cfeMean, dominantFrequency, truePs, mappedPs, mappedPhase, psStats, rotorCore, siteMaps, electrodes, inPatch } from './afmap-model.js';
import { COLORS } from './amap-model.js';
import { AFMAP_TEXT } from './afmap-text.js';

/*
 * AF mapping panel (the AF mapping tab): the atrial sheet of
 * afmap-model.js as a playable activation or phase map (true PS as rings,
 * the PS found at the chosen electrode resolution as crosses, basket
 * electrodes as dots), or as the DF and CFE-mean maps; the catheter
 * (click to move); below, its electrogram over three seconds with the
 * deflections and the power spectrum with the DF. The side column holds
 * the controls, the reading at the catheter and over the sheet, the
 * ablation outcome and the lesson.
 */

const BG = '#0e1815', MUTED = '#9fc7b6', NO_DATA = '#2b3b35', LESION = '#7f1d1d';
const PLAY_STEP = 2;   // frames per animation tick
const START_FRAME = 600;   // mid recording, away from the edges of the Hilbert window

const phaseColor = (p) => `hsl(${Math.round(((p + Math.PI) / (2 * Math.PI)) * 300)}, 85%, 55%)`;
const activationColor = (u) => { const v = Math.max(0, Math.min(1, u)); return `rgb(${Math.round(30 + 225 * v)}, ${Math.round(40 + 190 * v)}, ${Math.round(45 + 30 * v)})`; };
const scaleColor = (f) => COLORS[Math.max(0, Math.min(COLORS.length - 1, Math.floor(f * COLORS.length)))];

export function createAfMappingPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const T = () => AFMAP_TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const state = { scenario: 'rotor', map: 'phase', resolution: 'full', ablation: 'none', site: null, frame: START_FRAME, playing: false, truth: true, active: false };

  const root = el('section', 'amap pmap afmap', { 'data-afmap': '' });
  const view = el('div', 'amap-view');
  const mapCanvas = el('canvas', 'amap-canvas pmap-canvas', { role: 'img', tabindex: '0', 'data-afmap-map': '' });
  const timeRow = el('div', 'amap-toggles');
  const playBtn = el('button', 'amap-toggle', { type: 'button', 'data-afmap-play': '' });
  const slider = el('input', '', { type: 'range', min: '0', max: String(FRAMES - 1), step: '1', 'data-afmap-time': '' });
  slider.setAttribute('style', 'flex: 1');
  const clock = el('span', 'amap-legend-times');
  timeRow.append(playBtn, slider, clock);
  const legend = el('div', 'amap-legend', { 'data-afmap-legend': '' });
  const traceCanvas = el('canvas', 'pmap-ecg', { role: 'img', 'data-afmap-trace': '' });
  view.append(mapCanvas, timeRow, legend, traceCanvas);
  const side = el('aside', 'amap-side');
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const field = (labelKey, control) => { const l = el('label', 'amap-field'); const s = el('span'); s.dataset.key = labelKey; l.append(s, control); return l; };
  const select = (name) => el('select', '', { [`data-afmap-${name}`]: '' });
  const sel = { scenario: select('scenario'), map: select('map'), resolution: select('resolution'), ablation: select('ablation'), site: select('site') };
  const truthBtn = el('button', 'amap-toggle', { type: 'button', 'data-afmap-truth': '' });
  const toggles = el('div', 'amap-toggles');
  toggles.append(truthBtn);
  const verdict = el('p', 'amap-verdict', { 'aria-live': 'polite', 'data-afmap-verdict': '' });
  const readout = el('dl', 'amap-readout', { 'data-afmap-readout': '' });
  const ablationNote = el('p', 'amap-note', { 'data-afmap-ablation-text': '' });
  const lesson = el('p', 'amap-lesson');
  const truth = el('p', 'amap-truth');
  const source = el('p', 'amap-source');
  side.append(heading, intro, field('scenario', sel.scenario), field('map', sel.map), field('resolution', sel.resolution), field('ablation', sel.ablation), field('site', sel.site),
    toggles, verdict, readout, ablationNote, lesson, truth, source);
  root.append(view, side);

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };
  const defaultSite = (id) => { const core = rotorCore(simulate(id)); return core && core.perFrame < 2 ? [Math.round(core.x), Math.round(core.y)] : [N / 2, N / 2]; };
  const sites = () => ({ ...(state.scenario === 'rotor' ? { core: defaultSite('rotor') } : {}), ...SCENARIOS[state.scenario].sites });

  sel.scenario.addEventListener('change', () => { state.scenario = sel.scenario.value; state.ablation = 'none'; state.site = null; state.frame = START_FRAME; render(); });
  sel.map.addEventListener('change', () => { state.map = sel.map.value; render(); });
  sel.resolution.addEventListener('change', () => { state.resolution = sel.resolution.value; render(); });
  sel.ablation.addEventListener('change', () => { state.ablation = sel.ablation.value; render(); });
  sel.site.addEventListener('change', () => { const p = sites()[sel.site.value]; if (p) { state.site = p; render(); } });
  truthBtn.addEventListener('click', () => { state.truth = !state.truth; render(); });
  slider.addEventListener('input', () => { state.frame = Number(slider.value); drawOnly(); });
  playBtn.addEventListener('click', () => { state.playing = !state.playing; if (state.playing) tick(); render(); });

  let layout = null;
  mapCanvas.addEventListener('click', (e) => {
    if (!layout || typeof mapCanvas.getBoundingClientRect !== 'function') return;
    const r = mapCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - layout.ox) / layout.cs), y = Math.floor((e.clientY - r.top - layout.oy) / layout.cs);
    if (x >= 0 && y >= 0 && x < N && y < N) { state.site = [x, y]; render(); }
  });
  mapCanvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault?.();
    const [x, y] = state.site;
    state.site = [Math.min(N - 1, Math.max(0, x + step[0])), Math.min(N - 1, Math.max(0, y + step[1]))];
    render();
  });

  // Playback: a few frames per animation tick, looping.
  function tick() {
    if (!state.playing || !state.active) { state.playing = false; return; }
    state.frame = (state.frame + PLAY_STEP) % FRAMES;
    drawOnly();
    globalThis.requestAnimationFrame?.(tick);
  }

  function compute() {
    const sim = simulate(state.scenario, ablationLesions(state.scenario, state.ablation));
    if (!state.site) state.site = defaultSite(state.scenario);
    const egm = electrogram(sim, state.site);
    const times = deflections(egm);
    const spectrum = dominantFrequency(egm);
    return { sim, egm, times, spectrum, cfe: cfeMean(times), maps: siteMaps(sim), stats: psStats(sim, state.resolution), core: rotorCore(sim), result: state.ablation === 'none' ? null : outcome(sim) };
  }
  let last = null;

  function canvasContext(canvas) {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!(width >= 2) || !(height >= 2) || typeof canvas.getContext !== 'function') return null;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, width, height);
    return { ctx, width, height };
  }

  /** Mapped phase at a pixel: nearest lattice point (basket) or the pixel itself. */
  function phaseAt(m, x, y, f) {
    if (m.step === 1) return m.phases[y * N + x] ? m.phases[y * N + x][f] : NaN;
    const i = Math.min(m.w - 1, Math.max(0, Math.round((x - m.first) / m.step))), j = Math.min(m.h - 1, Math.max(0, Math.round((y - m.first) / m.step)));
    return m.phases[j * m.w + i][f];
  }

  function drawMap(c) {
    const cv = canvasContext(mapCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const cs = Math.max(2, Math.floor(Math.min((width - 12) / N, (height - 12) / N)));
    const ox = Math.floor((width - cs * N) / 2), oy = Math.floor((height - cs * N) / 2);
    layout = { cs, ox, oy };
    const { sim } = c, f = state.frame;
    const cx = (x) => ox + (x + 0.5) * cs, cy = (y) => oy + (y + 0.5) * cs;
    if (state.map === 'activation' || state.map === 'phase') {
      const m = state.map === 'phase' ? mappedPhase(sim, state.resolution) : null;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const k = y * N + x;
        if (sim.blocked[k]) ctx.fillStyle = sim.lesions.has(k) ? LESION : NO_DATA;
        else if (m) { const p = phaseAt(m, x, y, f); ctx.fillStyle = Number.isNaN(p) ? NO_DATA : phaseColor(p); }
        else ctx.fillStyle = activationColor(sim.U[f * N * N + k] / LEVEL);
        ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
      }
      if (m) {
        if (state.truth) for (const p of truePs(sim, f)) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx(p.x - 0.5), cy(p.y - 0.5), cs * 1.6, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
        for (const p of mappedPs(sim, state.resolution, f)) {
          const px = cx(p.x - 0.5), py = cy(p.y - 0.5), r = cs * 1.1;
          ctx.beginPath(); ctx.moveTo(px - r, py - r); ctx.lineTo(px + r, py + r); ctx.moveTo(px + r, py - r); ctx.lineTo(px - r, py + r); ctx.stroke();
        }
      }
    } else {
      // DF / CFE-mean on the 3 mm lattice.
      const values = c.maps.map((s) => (state.map === 'df' ? s.df : s.cfe)).filter((v) => v != null);
      const lo = Math.min(...values), hi = Math.max(...values);
      c.range = { lo, hi };
      ctx.fillStyle = NO_DATA; ctx.fillRect(ox, oy, cs * N, cs * N);
      for (const s of c.maps) {
        const v = state.map === 'df' ? s.df : s.cfe;
        if (v == null) continue;
        ctx.fillStyle = state.map === 'df' ? scaleColor(1 - (v - lo) / (hi - lo || 1)) : (v < CFAE_MS ? COLORS[0] : scaleColor(0.2 + 0.8 * Math.min(1, (v - CFAE_MS) / 120)));
        ctx.fillRect(ox + (s.x - 1.5) * cs, oy + (s.y - 1.5) * cs, cs * 3, cs * 3);
      }
      for (let k = 0; k < N * N; k++) if (sim.lesions.has(k)) { ctx.fillStyle = LESION; ctx.fillRect(ox + (k % N) * cs, oy + Math.floor(k / N) * cs, cs, cs); }
    }
    // Basket electrodes: in contact (white) or not (red).
    const { points, lost } = electrodes(state.resolution);
    if (points) points.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(cx(x), cy(y), Math.max(2, cs * 0.45), 0, Math.PI * 2); ctx.fillStyle = lost.has(i) ? '#ef4444' : '#f8fafc'; ctx.fill(); });
    // Catheter.
    const [sx, sy] = state.site;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx(sx), cy(sy), cs * 1.8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx(sx) - 2, cy(sy) - 2, 4, 4);
    // Scale bar: 1 cm.
    ctx.strokeStyle = MUTED; ctx.fillStyle = MUTED; ctx.lineWidth = 2; ctx.font = '11px ui-monospace, monospace';
    ctx.beginPath(); ctx.moveTo(ox + 6, oy + cs * N - 8); ctx.lineTo(ox + 6 + cs * 10, oy + cs * N - 8); ctx.stroke();
    ctx.fillText('1 cm', ox + 10 + cs * 10, oy + cs * N - 4);
    mapCanvas.setAttribute('aria-label', `${T().heading}: ${T().maps[state.map]}`);
  }

  function drawTrace(c) {
    const cv = canvasContext(traceCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const { egm, times, spectrum } = c;
    const specW = Math.min(220, Math.max(120, width * 0.28));
    const x0 = 8, w = width - specW - 24, top = 24, bottom = height - 18;
    ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = MUTED;
    ctx.fillText(T().traceTitle, 6, 13);
    // One gain for the sheet (a typical site's deflection), so a small signal, as at the rotor core, looks small.
    const reference = electrogram(c.sim, SCENARIOS[state.scenario].sites.periphery || SCENARIOS[state.scenario].sites.edge);
    const peak = Math.max(0.02, ...Array.from(reference, (v) => -v), ...Array.from(egm, (v) => -v));
    const mid = top + (bottom - top) * 0.35, gain = ((bottom - top) * 0.55) / peak;
    const x = (ms) => x0 + (ms / (FRAMES * FRAME_MS)) * w;
    ctx.strokeStyle = 'rgba(159, 199, 182, 0.18)'; ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x0 + w, mid); ctx.stroke();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.2; ctx.beginPath();
    egm.forEach((v, f) => { const yy = mid - v * gain; if (f === 0) ctx.moveTo(x(f * FRAME_MS), yy); else ctx.lineTo(x(f * FRAME_MS), yy); });
    ctx.stroke();
    ctx.strokeStyle = '#facc15';
    for (const t of times) { ctx.beginPath(); ctx.moveTo(x(t), bottom - 14); ctx.lineTo(x(t), bottom - 4); ctx.stroke(); }
    // Playback cursor.
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)'; ctx.beginPath(); ctx.moveTo(x(state.frame * FRAME_MS), top); ctx.lineTo(x(state.frame * FRAME_MS), bottom); ctx.stroke();
    ctx.fillStyle = MUTED;
    for (let ms = 0; ms <= FRAMES * FRAME_MS; ms += 500) ctx.fillText(String(ms), x(ms) - 8, height - 4);
    // Spectrum (0-20 Hz) with the DF.
    const sx0 = width - specW - 6, sw = specW, sTop = top + 8, sBottom = bottom - 4;
    ctx.strokeStyle = 'rgba(159, 199, 182, 0.3)'; ctx.strokeRect(sx0, sTop, sw, sBottom - sTop);
    const pts = spectrum.spectrum.filter(([hz]) => hz <= 20);
    const pmax = Math.max(...pts.map(([, p]) => p)) || 1;
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.2; ctx.beginPath();
    pts.forEach(([hz, p], i) => { const px = sx0 + (hz / 20) * sw, py = sBottom - (p / pmax) * (sBottom - sTop - 4); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    if (spectrum.df) {
      const px = sx0 + (spectrum.df / 20) * sw;
      ctx.strokeStyle = '#facc15'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(px, sTop); ctx.lineTo(px, sBottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#facc15'; ctx.fillText(`DF ${spectrum.df} Hz`, Math.min(px + 3, sx0 + sw - 70), sTop + 12);
    }
    ctx.fillStyle = MUTED; ctx.fillText('0', sx0, height - 4); ctx.fillText('20 Hz', sx0 + sw - 34, height - 4);
    traceCanvas.setAttribute('aria-label', T().traceTitle);
  }

  function renderLegend(c) {
    const lg = T().legend;
    const text = el('span', 'amap-legend-times');
    text.textContent = state.map === 'df' ? lg.df(c.range?.lo ?? '', c.range?.hi ?? '') : lg[state.map];
    const sw = state.map === 'phase' ? Array.from({ length: 7 }, (_, i) => phaseColor(-Math.PI + (i * 2 * Math.PI) / 6)) : state.map === 'activation' ? [0, 0.25, 0.5, 0.75, 1].map(activationColor) : COLORS;
    legend.replaceChildren(...sw.map((color) => { const s = el('span', 'amap-swatch'); s.style.background = color; return s; }), text);
  }

  function renderReading(c) {
    const tt = T(), r = tt.readout;
    const row = (label, value) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; };
    const items = [
      ...row(r.df, c.spectrum.df ? `${c.spectrum.df} Hz` : '-'),
      ...row(r.regularity, c.spectrum.regularity.toFixed(2)),
      ...row(r.cfe, c.cfe ? `${Math.round(c.cfe)} ms` : '-'),
      ...row(r.cfae, c.cfe && c.cfe < CFAE_MS ? r.yes : r.no),
      ...row(r.beats, String(c.times.length)),
      ...row(r.truePs, c.stats.truePs.toFixed(1)),
      ...row(r.mappedPs, c.stats.mappedPs.toFixed(1)),
      ...row(r.precision, c.stats.precision == null ? '-' : `${Math.round(c.stats.precision * 100)} %`)
    ];
    if (c.core && c.core.perFrame < 2) items.push(...row(r.core, `${Math.round(c.core.x)}, ${Math.round(c.core.y)} mm`), ...row(r.spread, `${c.core.spread.toFixed(1)} mm`));
    if (c.result) items.push(...row(r.outcome, tt.outcomes[c.result]));
    readout.replaceChildren(...items);
    const v = tt.verdicts;
    let text, level;
    if (state.resolution !== 'full' && c.stats.precision != null && c.stats.precision < 0.5) { text = v.falsePs; level = 'poor'; }
    else if (state.scenario === 'wavelets') { text = v.wavelets; level = 'close'; }
    else if (c.core && c.core.perFrame < 2 && Math.hypot(state.site[0] - c.core.x, state.site[1] - c.core.y) <= 5) { text = v.rotorCore; level = 'good'; }
    else if (c.cfe && c.cfe < CFAE_MS) { text = v.cfaeSite; level = 'poor'; }
    else if (inPatch(state.scenario, state.site)) { text = v.slowed; level = 'close'; }
    else { text = v.driven; level = 'good'; }
    verdict.textContent = text;
    verdict.dataset.level = level;
    ablationNote.textContent = tt.ablationText[state.ablation];
  }

  function drawOnly() {
    if (!last) return;
    slider.value = String(state.frame);
    clock.textContent = `${T().time}: ${state.frame * FRAME_MS} ms`;
    drawMap(last);
    drawTrace(last);
  }

  function render() {
    const tt = T(), s = SCENARIOS[state.scenario];
    heading.textContent = tt.heading;
    intro.textContent = tt.intro;
    for (const span of side.querySelectorAll?.('[data-key]') || []) span.textContent = tt[span.dataset.key];
    sel.scenario.replaceChildren(...Object.keys(SCENARIOS).map((id) => option(id, tt.scenarios[id].name)));
    sel.scenario.value = state.scenario;
    sel.map.replaceChildren(...Object.keys(tt.maps).map((id) => option(id, tt.maps[id])));
    sel.map.value = state.map;
    sel.resolution.replaceChildren(...RESOLUTIONS.map((id) => option(id, tt.resolutions[id])));
    sel.resolution.value = state.resolution;
    sel.ablation.replaceChildren(...ABLATIONS.filter((id) => id !== 'cfae' || s.patch).map((id) => option(id, tt.ablations[id])));
    sel.ablation.value = state.ablation;
    const c = compute();
    last = c;
    const named = sites();
    sel.site.replaceChildren(option('', tt.sitePick), ...Object.keys(named).map((id) => option(id, tt.sites[id])));
    const hit = Object.entries(named).find(([, p]) => p[0] === state.site[0] && p[1] === state.site[1]);
    sel.site.value = hit ? hit[0] : '';
    playBtn.textContent = state.playing ? tt.pause : tt.play;
    playBtn.setAttribute('aria-pressed', String(state.playing));
    timeRow.hidden = !(state.map === 'activation' || state.map === 'phase');
    truthBtn.textContent = tt.truth;
    truthBtn.setAttribute('aria-pressed', String(state.truth));
    truthBtn.hidden = state.map !== 'phase';
    lesson.textContent = tt.scenarios[state.scenario].lesson;
    truth.textContent = tt.scenarios[state.scenario].truth;
    source.textContent = tt.source;
    drawMap(c);
    renderLegend(c);
    renderReading(c);
    drawOnly();
    return c;
  }

  // Redraw when the canvases change size (first layout, window, panel width).
  if (typeof globalThis.ResizeObserver === 'function') {
    let pending = false;
    const observer = new globalThis.ResizeObserver(() => {
      if (!state.active || pending) return;
      pending = true;
      globalThis.requestAnimationFrame(() => { pending = false; if (state.active) drawOnly(); });
    });
    observer.observe(mapCanvas); observer.observe(traceCanvas);
  }

  return {
    element: root,
    render,
    setActive(flag) {
      state.active = Boolean(flag);
      root.hidden = !state.active;
      if (state.active) render(); else state.playing = false;
    },
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); return render(); },
    getState: () => ({ ...state })
  };
}
