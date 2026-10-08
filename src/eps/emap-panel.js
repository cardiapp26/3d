import { PATCH, CATHETERS, WAVES, ORIENTATIONS, CONTACTS, DENSITIES, ANNOTATIONS, CUTS, NOISE, SITES, OUTLINE, record, annotate, trueLat, buildMap, channelSeen, tissueAt, pixelOf } from './emap-model.js';
import { COLORS } from './amap-model.js';
import { EMAP_TEXT } from './emap-text.js';

/*
 * Mapping basics panel (the Mapping basics tab): the tissue patch of
 * emap-model.js as an interpolated bipolar, unipolar or LAT map built with
 * the chosen catheter, bipole direction, wavefront, contact, point spacing
 * and annotation rule; the catheter drawn at true size (click to move it);
 * below, the unipolar and bipolar recording at the catheter with the true
 * activation and the three annotation rules marked. The side column holds
 * the controls, the reading (true tissue against what the map shows, with
 * the likely reasons when they differ) and the experiments to try.
 */

const BG = '#0e1815', MUTED = '#9fc7b6', NO_DATA = '#2b3b35';
const MARK = { truth: '#22c55e', firstSharp: '#facc15', maxPeak: '#f97316', unipolar: '#60a5fa' };

function voltageColor(v, lo, hi) {
  if (v < lo) return COLORS[0];
  if (v > hi) return COLORS[COLORS.length - 1];
  const f = (v - lo) / (hi - lo || 1);
  return COLORS[Math.min(COLORS.length - 2, 1 + Math.floor(f * (COLORS.length - 2)))];
}
const voltageClass = (v) => (v < CUTS.scar ? 'scar' : v <= CUTS.normal ? 'border' : 'normal');

export function createMappingBasicsPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const T = () => EMAP_TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const state = { map: 'bipolar', catheter: 'pentaray', orientation: 'best', wave: 'left', contact: 'good', spacing: 1, annotation: 'firstSharp', site: SITES.channel, truth: false, points: false, active: false };

  const root = el('section', 'amap pmap emap', { 'data-emap': '' });
  const view = el('div', 'amap-view');
  const mapCanvas = el('canvas', 'amap-canvas pmap-canvas', { role: 'img', tabindex: '0', 'data-emap-map': '' });
  const legend = el('div', 'amap-legend', { 'data-emap-legend': '' });
  const traceCanvas = el('canvas', 'pmap-ecg', { role: 'img', 'data-emap-trace': '' });
  view.append(mapCanvas, legend, traceCanvas);
  const side = el('aside', 'amap-side');
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const field = (labelKey, control) => { const l = el('label', 'amap-field'); const s = el('span'); s.dataset.key = labelKey; l.append(s, control); return l; };
  const select = (name) => el('select', '', { [`data-emap-${name}`]: '' });
  const sel = {
    map: select('map'), catheter: select('catheter'), orientation: select('orientation'), wave: select('wave'),
    contact: select('contact'), spacing: select('spacing'), annotation: select('annotation'), site: select('site')
  };
  const annotationField = field('annotation', sel.annotation);
  const toggle = (name) => el('button', 'amap-toggle', { type: 'button', [`data-emap-${name}`]: '' });
  const truthBtn = toggle('truth'), pointsBtn = toggle('points');
  const toggles = el('div', 'amap-toggles');
  toggles.append(truthBtn, pointsBtn);
  const verdict = el('p', 'amap-verdict', { 'aria-live': 'polite', 'data-emap-verdict': '' });
  const causes = el('ul', 'pmap-warn', { 'data-emap-causes': '' });
  const readout = el('dl', 'amap-readout', { 'data-emap-readout': '' });
  const lesson = el('p', 'amap-lesson');
  const source = el('p', 'amap-source');
  side.append(heading, intro, field('map', sel.map), field('catheter', sel.catheter), field('orientation', sel.orientation), field('wave', sel.wave),
    field('contact', sel.contact), field('spacing', sel.spacing), annotationField, field('site', sel.site), toggles, verdict, causes, readout, lesson, source);
  root.append(view, side);

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };
  for (const name of ['map', 'catheter', 'orientation', 'wave', 'contact', 'annotation']) sel[name].addEventListener('change', () => { state[name] = sel[name].value; render(); });
  sel.spacing.addEventListener('change', () => { state.spacing = Number(sel.spacing.value); render(); });
  sel.site.addEventListener('change', () => { const p = SITES[sel.site.value]; if (p) { state.site = p; render(); } });
  truthBtn.addEventListener('click', () => { state.truth = !state.truth; render(); });
  pointsBtn.addEventListener('click', () => { state.points = !state.points; render(); });

  // Catheter: click the patch, or move it 0.5 mm with the arrow keys.
  let layout = null;
  mapCanvas.addEventListener('click', (e) => {
    if (!layout || typeof mapCanvas.getBoundingClientRect !== 'function') return;
    const r = mapCanvas.getBoundingClientRect();
    const xm = (e.clientX - r.left - layout.ox) / layout.cs * PATCH.mm, ym = (e.clientY - r.top - layout.oy) / layout.cs * PATCH.mm;
    if (xm >= 0 && ym >= 0 && xm < PATCH.w * PATCH.mm && ym < PATCH.h * PATCH.mm) { state.site = [Math.round(xm * 4) / 4, Math.round(ym * 4) / 4]; render(); }
  });
  mapCanvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault?.();
    const W = PATCH.w * PATCH.mm - 0.25, H = PATCH.h * PATCH.mm - 0.25;
    state.site = [Math.min(W, Math.max(0.25, state.site[0] + step[0] * PATCH.mm)), Math.min(H, Math.max(0.25, state.site[1] + step[1] * PATCH.mm))];
    render();
  });

  const recordOpts = () => ({ catheter: state.catheter, orientation: state.orientation === 'best' && !CATHETERS[state.catheter].multi ? 'x' : state.orientation, contact: state.contact, wave: state.wave });

  function compute() {
    const opts = recordOpts();
    const rec = record(state.site, opts);
    const map = buildMap({ kind: state.map, spacing: state.spacing, annotation: state.annotation, ...opts });
    const voltageMap = state.map === 'bipolar' ? map : buildMap({ kind: 'bipolar', spacing: state.spacing, ...opts });
    const lats = Object.fromEntries(ANNOTATIONS.map((a) => [a, rec.bipolarV < NOISE ? null : annotate(rec, a)]));
    return { opts, rec, map, seen: channelSeen(voltageMap), lats, truth: trueLat(state.wave, state.site), tissue: tissueAt(state.site) };
  }

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

  function drawMap(c) {
    const cv = canvasContext(mapCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const cs = Math.max(2, Math.min((width - 16) / PATCH.w, (height - 16) / PATCH.h));
    const ox = (width - cs * PATCH.w) / 2, oy = (height - cs * PATCH.h) / 2;
    layout = { cs, ox, oy };
    const mm = (v) => (v / PATCH.mm) * cs;
    const values = c.map.grid.filter((v) => v != null);
    const lo = Math.min(...values), hi = Math.max(...values);
    c.range = { lo, hi };
    c.map.grid.forEach((v, k) => {
      const [x, y] = pixelOf(k);
      if (v == null) ctx.fillStyle = NO_DATA;
      else if (state.map === 'bipolar') ctx.fillStyle = voltageColor(v, CUTS.scar, CUTS.normal);
      else if (state.map === 'unipolar') ctx.fillStyle = voltageColor(v, 1.5, 8);
      else ctx.fillStyle = COLORS[Math.min(COLORS.length - 1, Math.floor(((v - lo) / (hi - lo || 1)) * COLORS.length))];
      ctx.fillRect(ox + x * cs, oy + y * cs, Math.ceil(cs), Math.ceil(cs));
    });
    if (state.points) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (const { p } of c.map.points) { ctx.beginPath(); ctx.arc(ox + mm(p[0]), oy + mm(p[1]), Math.max(1, cs * 0.35), 0, Math.PI * 2); ctx.fill(); }
    }
    if (state.truth) {
      const { centre, axes, channelRows } = OUTLINE;
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.ellipse(ox + (centre[0] + 0.5) * cs, oy + (centre[1] + 0.5) * cs, axes[0] * cs, axes[1] * cs, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      const x0 = centre[0] - axes[0] * 1.07, x1 = centre[0] + axes[0] * 1.07;
      ctx.strokeRect(ox + x0 * cs, oy + channelRows[0] * cs, (x1 - x0) * cs, (channelRows[1] - channelRows[0] + 1) * cs);
    }
    // The catheter at true size: tip (distal) and ring (proximal) electrodes along the bipole.
    const cat = CATHETERS[state.catheter], dir = c.rec.orientation === 'y' ? [0, 1] : [1, 0];
    const electrode = (sign, radius, fill) => {
      const x = state.site[0] + sign * dir[0] * cat.spacing / 2, y = state.site[1] + sign * dir[1] * cat.spacing / 2;
      ctx.beginPath(); ctx.arc(ox + mm(x), oy + mm(y), Math.max(2, mm(radius)), 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#0b1210'; ctx.lineWidth = 1; ctx.stroke();
    };
    electrode(-1, cat.ring, 'rgba(203, 213, 225, 0.9)');
    electrode(1, cat.tip, 'rgba(255, 255, 255, 0.95)');
    // Scale bar: 5 mm.
    ctx.strokeStyle = MUTED; ctx.fillStyle = MUTED; ctx.lineWidth = 2; ctx.font = '11px ui-monospace, monospace';
    ctx.beginPath(); ctx.moveTo(ox + 6, oy + cs * PATCH.h - 8); ctx.lineTo(ox + 6 + mm(5), oy + cs * PATCH.h - 8); ctx.stroke();
    ctx.fillText('5 mm', ox + 10 + mm(5), oy + cs * PATCH.h - 4);
    mapCanvas.setAttribute('aria-label', `${T().heading}: ${T().maps[state.map]}`);
  }

  function drawTrace(c) {
    const cv = canvasContext(traceCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const { rec, lats, truth } = c, tt = T();
    const bin = 0.25, n = rec.bipolar.length;
    const end = Math.min(n * bin, Math.max(120, (truth ?? 60) + 60));
    const x0 = 44, w = width - x0 - 10;
    const x = (ms) => x0 + (ms / end) * w;
    ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = MUTED;
    ctx.fillText(tt.traceTitle, 6, 13);
    const lanes = [{ name: 'UNI', y: 26 + (height - 50) * 0.25, data: rec.unipolar, color: '#60a5fa' }, { name: 'BI', y: 26 + (height - 50) * 0.72, data: rec.bipolar, color: '#f8fafc' }];
    // One gain for both lanes (mV), so their voltages compare.
    const peak = Math.max(...rec.unipolar.map(Math.abs), ...rec.bipolar.map(Math.abs), 0.5);
    const gain = ((height - 50) * 0.22) / peak;
    for (const lane of lanes) {
      ctx.strokeStyle = 'rgba(159, 199, 182, 0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, lane.y); ctx.lineTo(x0 + w, lane.y); ctx.stroke();
      ctx.fillStyle = '#c8f0dc'; ctx.fillText(lane.name, 6, lane.y + 4);
      ctx.strokeStyle = lane.color; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i * bin <= end && i < n; i++) { const yy = lane.y - lane.data[i] * gain; if (i === 0) ctx.moveTo(x(i * bin), yy); else ctx.lineTo(x(i * bin), yy); }
      ctx.stroke();
    }
    const marks = [['truth', truth], ...ANNOTATIONS.map((a) => [a, lats[a]])];
    marks.forEach(([id, t], i) => {
      if (t == null) return;
      ctx.strokeStyle = MARK[id]; ctx.lineWidth = id === 'truth' ? 2 : 1.2; ctx.setLineDash(id === 'truth' ? [] : [4, 3]);
      ctx.beginPath(); ctx.moveTo(x(t), 22); ctx.lineTo(x(t), height - 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MARK[id]; ctx.fillText(tt.marks[id], Math.min(width - 70, x(t) + 3), 32 + i * 12);
    });
    ctx.fillStyle = MUTED;
    for (let ms = 0; ms <= end; ms += 20) ctx.fillText(String(ms), x(ms) - 6, height - 5);
    traceCanvas.setAttribute('aria-label', tt.traceTitle);
  }

  function renderLegend(c) {
    const lg = T().legend;
    const text = el('span', 'amap-legend-times');
    text.textContent = state.map === 'lat' ? lg.lat(Math.round(c.range?.lo ?? 0), Math.round(c.range?.hi ?? 0)) : lg[state.map];
    legend.replaceChildren(...COLORS.map((color) => { const s = el('span', 'amap-swatch'); s.style.background = color; return s; }), text);
  }

  /** Why the reading misleads at this site, from the current settings. */
  function reasons(c) {
    const out = [];
    if (state.catheter === 'ablation') out.push('catheter');
    if (state.contact !== 'good') out.push('contact');
    if (c.rec.orientation === (state.wave === 'left' ? 'y' : 'x')) out.push('orientation');
    if (state.spacing > 1 && c.map.grid.some((v) => v == null || v < CUTS.scar)) out.push('spacing');
    return out;
  }

  function renderReading(c) {
    const tt = T(), r = tt.readout, { rec, lats, truth, tissue } = c;
    const row = (label, value) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; };
    const ms = (v) => (v == null ? '-' : `${Math.round(v * 10) / 10} ms`);
    const err = (v) => (v == null || truth == null ? '' : ` (${v - truth >= 0 ? '+' : ''}${Math.round(v - truth)})`);
    const times = ANNOTATIONS.map((a) => lats[a]).filter((v) => v != null);
    const reads = voltageClass(rec.bipolarV);
    readout.replaceChildren(
      ...row(r.tissue, tt.tissues[tissue]),
      ...row(r.bipolar, `${rec.bipolarV.toFixed(2)} mV`),
      ...row(r.reads, r.classes[reads]),
      ...row(r.unipolar, `${rec.unipolarV.toFixed(2)} mV`),
      ...row(r.truth, ms(truth)),
      ...row(r.firstSharp, ms(lats.firstSharp) + err(lats.firstSharp)),
      ...row(r.maxPeak, ms(lats.maxPeak) + err(lats.maxPeak)),
      ...row(r.unipolarLat, ms(lats.unipolar) + err(lats.unipolar)),
      ...row(r.spread, times.length ? ms(Math.max(...times) - Math.min(...times)) : '-'),
      ...row(r.channel, `${Math.round(c.seen * 100)} %`),
      ...row(r.points, String(c.map.points.length))
    );
    let level = 'good', key = 'right';
    if (tissue === 'scar') { key = rec.bipolarV < NOISE ? 'noise' : 'right'; level = 'none'; }
    else if (tissue === 'channel' && reads === 'scar') { key = 'falseScar'; level = 'poor'; }
    else if (tissue === 'healthy' && reads !== 'normal') { key = 'falseLow'; level = 'poor'; }
    verdict.textContent = tt.verdict[key];
    verdict.dataset.level = level;
    const why = key === 'falseScar' || key === 'falseLow' ? reasons(c) : [];
    causes.replaceChildren(...why.map((id) => { const li = el('li'); li.textContent = tt.verdict.causes[id]; return li; }));
    causes.hidden = !why.length;
  }

  function render() {
    const tt = T();
    heading.textContent = tt.heading;
    intro.textContent = tt.intro;
    for (const span of side.querySelectorAll?.('[data-key]') || []) span.textContent = tt[span.dataset.key];
    const fill = (name, ids, labels) => { sel[name].replaceChildren(...ids.map((id) => option(String(id), labels[id]))); sel[name].value = String(state[name]); };
    fill('map', Object.keys(tt.maps), tt.maps);
    fill('catheter', Object.keys(CATHETERS), tt.catheters);
    fill('orientation', ORIENTATIONS.filter((id) => id !== 'best' || CATHETERS[state.catheter].multi), tt.orientations);
    if (state.orientation === 'best' && !CATHETERS[state.catheter].multi) { state.orientation = 'x'; sel.orientation.value = 'x'; }
    fill('wave', WAVES, tt.waves);
    fill('contact', Object.keys(CONTACTS), tt.contacts);
    fill('spacing', DENSITIES, tt.spacings);
    fill('annotation', ANNOTATIONS, tt.annotations);
    sel.site.replaceChildren(option('', tt.sitePick), ...Object.keys(SITES).map((id) => option(id, tt.sites[id])));
    const named = Object.entries(SITES).find(([, p]) => p[0] === state.site[0] && p[1] === state.site[1]);
    sel.site.value = named ? named[0] : '';
    for (const [btn, key] of [[truthBtn, 'truth'], [pointsBtn, 'points']]) { btn.textContent = tt[key]; btn.setAttribute('aria-pressed', String(state[key])); }
    lesson.textContent = tt.lesson;
    source.textContent = tt.source;
    const c = compute();
    drawMap(c);
    renderLegend(c);
    renderReading(c);
    drawTrace(c);
    return c;
  }

  // Redraw when the canvases change size (first layout, window, panel width).
  if (typeof globalThis.ResizeObserver === 'function') {
    let pending = false;
    const observer = new globalThis.ResizeObserver(() => {
      if (!state.active || pending) return;
      pending = true;
      globalThis.requestAnimationFrame(() => { pending = false; if (state.active) render(); });
    });
    observer.observe(mapCanvas); observer.observe(traceCanvas);
  }

  return {
    element: root,
    render,
    setActive(flag) { state.active = Boolean(flag); root.hidden = !state.active; if (state.active) render(); },
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); return render(); },
    getState: () => ({ ...state })
  };
}
