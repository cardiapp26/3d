import { GRID, CUTOFFS, RHYTHMS, STRATEGIES, SCENARIOS, cellOf, cellKey, tissueOf, voltageClass, beat, electrogram, egmTrace, unipolarTrace, egmMap, vt, entrain, lesions, outcome } from './smap-model.js';
import { SEGMENTS } from './pmap-model.js';
import { COLORS } from './amap-model.js';
import { SMAP_TEXT } from './smap-text.js';
import { PMAP_TEXT } from './pmap-text.js';

/*
 * Substrate mapping panel (the Substrate tab): the unrolled left ventricle
 * of smap-model.js as a bipolar or unipolar voltage map (adjustable
 * cut-offs) or an activation map, with late potential / LAVA tags, the
 * lesions of the chosen ablation strategy and the catheter (click or arrow
 * keys). Below the map: the local bipolar EGM with lead II in sinus rhythm
 * or RV pacing, or, during the VT, the VT QRS beside the QRS while
 * entraining from the catheter. The side column holds the controls, the
 * reading (EGM kind or the entrainment class with its intervals), the
 * strategy outcome and the lesson.
 */

const BG = '#0e1815', GRID_TEXT = '#9fc7b6', SCAR_GREY = '#55534d';
const TEMPLATE_COLOR = '#22c55e', PACED_COLOR = '#facc15', UNIPOLAR_COLOR = '#60a5fa';
const ECG_LEADS = [0, 1, 2, 6, 8, 11];   // I, II, III, V1, V3, V6
const LEAD_NAMES = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const LEVEL = { exit: 'good', central: 'good', proximal: 'good', inner: 'close', outer: 'close', adjacent: 'poor', remote: 'poor' };

/** Colour of a voltage on a red (low) ... purple (high) scale between two bounds. */
function scaleColor(v, lo, hi) {
  if (v < lo) return COLORS[0];
  if (v > hi) return COLORS[COLORS.length - 1];
  const f = (v - lo) / (hi - lo || 1);
  return COLORS[Math.min(COLORS.length - 2, 1 + Math.floor(f * (COLORS.length - 2)))];
}

export function createSubstratePanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => SMAP_TEXT[L()];
  const state = { scenario: 'ischemic', map: 'bipolar', scarCut: 0.5, normalCut: 1.5, rhythm: 'sinus', strategy: 'none', site: SCENARIOS.ischemic.start, tags: false, truth: false, active: false };

  const root = el('section', 'amap pmap smap', { 'data-smap': '' });
  const view = el('div', 'amap-view');
  const mapCanvas = el('canvas', 'amap-canvas pmap-canvas', { role: 'img', tabindex: '0', 'data-smap-map': '' });
  const legend = el('div', 'amap-legend', { 'data-smap-legend': '' });
  const traceCanvas = el('canvas', 'pmap-ecg', { role: 'img', 'data-smap-trace': '' });
  view.append(mapCanvas, legend, traceCanvas);
  const side = el('aside', 'amap-side');
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const field = (labelKey, control) => { const l = el('label', 'amap-field'); const s = el('span'); s.dataset.key = labelKey; l.append(s, control); return l; };
  const select = (name) => el('select', '', { [`data-smap-${name}`]: '' });
  const scenarioSel = select('scenario'), mapSel = select('map'), scarSel = select('scar-cut'), normalSel = select('normal-cut'), rhythmSel = select('rhythm'), strategySel = select('strategy'), siteSel = select('site');
  const scarField = field('scarCut', scarSel), normalField = field('normalCut', normalSel), strategyField = field('strategy', strategySel);
  const toggle = (name) => el('button', 'amap-toggle', { type: 'button', [`data-smap-${name}`]: '' });
  const tagsBtn = toggle('tags'), truthBtn = toggle('truth');
  const toggles = el('div', 'amap-toggles');
  toggles.append(tagsBtn, truthBtn);
  const verdict = el('p', 'amap-verdict', { 'aria-live': 'polite', 'data-smap-verdict': '' });
  const readout = el('dl', 'amap-readout', { 'data-smap-readout': '' });
  const strategyNote = el('p', 'amap-note', { 'data-smap-strategy-text': '' });
  const strategyReadout = el('dl', 'amap-readout', { 'data-smap-outcome': '' });
  const lesson = el('p', 'amap-lesson', { 'data-smap-lesson': '' });
  const truth = el('p', 'amap-truth', { 'data-smap-truth-text': '' });
  const source = el('p', 'amap-source');
  side.append(heading, intro, field('scenario', scenarioSel), field('map', mapSel), scarField, normalField, field('rhythm', rhythmSel), field('site', siteSel),
    toggles, verdict, readout, strategyField, strategyNote, strategyReadout, lesson, truth, source);
  root.append(view, side);

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };
  const scenario = () => SCENARIOS[state.scenario];
  const hasCircuit = () => Boolean(scenario().circuit);

  function setScenario(id) {
    if (!SCENARIOS[id]) return;
    Object.assign(state, { scenario: id, site: SCENARIOS[id].start, strategy: 'none', truth: false, rhythm: state.rhythm === 'vt' && !SCENARIOS[id].circuit ? 'sinus' : state.rhythm });
    render();
  }
  scenarioSel.addEventListener('change', () => setScenario(scenarioSel.value));
  mapSel.addEventListener('change', () => { state.map = mapSel.value; render(); });
  scarSel.addEventListener('change', () => { state.scarCut = Number(scarSel.value); render(); });
  normalSel.addEventListener('change', () => { state.normalCut = Number(normalSel.value); render(); });
  rhythmSel.addEventListener('change', () => { state.rhythm = rhythmSel.value; render(); });
  strategySel.addEventListener('change', () => { state.strategy = strategySel.value; render(); });
  siteSel.addEventListener('change', () => { const p = scenario().sites[siteSel.value]; if (p) { state.site = p; render(); } });
  tagsBtn.addEventListener('click', () => { state.tags = !state.tags; render(); });
  truthBtn.addEventListener('click', () => { state.truth = !state.truth; render(); });

  // Catheter: click a pixel, or move it with the arrow keys (the ventricle wraps around).
  let layout = null;
  mapCanvas.addEventListener('click', (e) => {
    if (!layout || typeof mapCanvas.getBoundingClientRect !== 'function') return;
    const r = mapCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - layout.ox) / layout.cs), y = Math.floor((e.clientY - r.top - layout.oy) / layout.cs);
    if (x >= 0 && y >= 0 && x < GRID.w && y < GRID.h) { state.site = [x, y]; render(); }
  });
  mapCanvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault?.();
    const [x, y] = state.site;
    state.site = [(x + step[0] + GRID.w) % GRID.w, Math.min(GRID.h - 1, Math.max(0, y + step[1]))];
    render();
  });

  /** Everything the drawings and the reading need. */
  function compute() {
    const ablated = lesions(state.scenario, state.strategy);
    const t = tissueOf(state.scenario, ablated);
    const egmRhythm = state.rhythm === 'vt' ? 'sinus' : state.rhythm;
    const b = beat(state.scenario, egmRhythm, ablated);
    const egm = electrogram(state.scenario, state.site, egmRhythm, ablated);
    const kinds = state.tags ? egmMap(state.scenario, egmRhythm, ablated) : null;
    const circuit = hasCircuit() ? vt(state.scenario, ablated) : null;
    const ent = state.rhythm === 'vt' ? entrain(state.scenario, state.site, ablated) : null;
    const result = state.strategy === 'none' ? null : outcome(state.scenario, state.strategy);
    return { ablated, t, b, egm, kinds, circuit, ent, result };
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

  /** Activation times shown on the LAT map: the beat, or the VT from its QRS onset. */
  function latTimes({ t, b, circuit }) {
    if (state.rhythm !== 'vt') return b.time.map((x, k) => (t.type[k] === 'scar' ? Infinity : x));
    if (!circuit) return null;
    return circuit.time.map((x) => (Number.isFinite(x) ? (((x - circuit.onset) % circuit.tcl) + circuit.tcl) % circuit.tcl : Infinity));
  }

  function pixelColor(k, c, lat) {
    const { t, ablated } = c;
    if (state.map === 'bipolar') return scaleColor(ablated.has(k) ? 0.05 : t.bipolar[k], state.scarCut, state.normalCut);
    if (state.map === 'unipolar') return scaleColor(ablated.has(k) ? 1 : t.unipolar[k], 4, CUTOFFS.unipolar);
    if (!lat || !Number.isFinite(lat.time[k])) return SCAR_GREY;
    const f = (lat.time[k] - lat.min) / (lat.max - lat.min || 1);
    return COLORS[Math.min(COLORS.length - 1, Math.floor(f * COLORS.length))];
  }

  function drawMap(c) {
    const cv = canvasContext(mapCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const cs = Math.max(4, Math.floor(Math.min((width - 34) / GRID.w, (height - 22) / GRID.h)));
    const ox = Math.floor((width - cs * GRID.w + 26) / 2), oy = 18;
    layout = { cs, ox, oy };
    const px = (x) => ox + x * cs, py = (y) => oy + y * cs;
    const times = state.map === 'lat' ? latTimes(c) : null;
    const finite = times ? times.filter(Number.isFinite) : [];
    const lat = times ? { time: times, min: Math.min(...finite), max: Math.max(...finite) } : null;
    c.lat = lat;
    for (let k = 0; k < GRID.w * GRID.h; k++) {
      const [x, y] = cellOf(k);
      ctx.fillStyle = pixelColor(k, c, lat);
      ctx.fillRect(px(x) + 0.5, py(y) + 0.5, cs - 1, cs - 1);
    }
    // Lesions, then the LP / LAVA tags.
    for (const k of c.ablated) {
      const [x, y] = cellOf(k);
      ctx.beginPath(); ctx.arc(px(x + 0.5), py(y + 0.5), cs * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#7f1d1d'; ctx.fill(); ctx.strokeStyle = '#fecaca'; ctx.lineWidth = 1; ctx.stroke();
    }
    if (c.kinds) {
      for (const [k, kind] of c.kinds) {
        if (kind !== 'lp' && kind !== 'lava') continue;
        const [x, y] = cellOf(k);
        ctx.beginPath(); ctx.arc(px(x + 0.5), py(y + 0.5), cs * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = kind === 'lp' ? '#ffffff' : '#f9a8d4'; ctx.fill();
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    if (state.truth) drawTruth(ctx, px, py, cs);
    // Segment and base / apex labels.
    const pt = PMAP_TEXT[L()];
    ctx.font = `600 ${Math.max(9, Math.min(12, Math.floor(cs * 0.6)))}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = GRID_TEXT;
    for (const seg of SEGMENTS) ctx.fillText(pt.segments[seg.id], px((seg.from + seg.to + 1) / 2), oy - 9);
    ctx.save(); ctx.translate(ox - 12, py(1.5)); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(pt.base, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(ox - 12, py(GRID.h - 1.5)); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'left'; ctx.fillText(pt.apex, 0, 0); ctx.restore();
    // Catheter.
    const [sx, sy] = state.site;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px(sx + 0.5), py(sy + 0.5), cs * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px(sx + 0.5), py(sy + 0.5), cs * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    mapCanvas.setAttribute('aria-label', `${T().heading}: ${T().scenarios[state.scenario].name}, ${T().maps[state.map]}`);
  }

  /** Channels outlined, the isthmus direction and the outer loop return. */
  function drawTruth(ctx, px, py, cs) {
    const s = scenario();
    const colors = { isthmus: '#fde047', bystander: '#fb923c', strand: '#93c5fd' };
    for (const [name, ch] of Object.entries(s.channels)) {
      ctx.strokeStyle = colors[name] || '#ffffff'; ctx.lineWidth = 2;
      for (const [x, y] of ch.cells) ctx.strokeRect(px(x) + 1.5, py(y) + 1.5, cs - 3, cs - 3);
    }
    if (s.epicardial) {
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
      const xs = s.epicardial.map(([x]) => x), ys = s.epicardial.map(([, y]) => y);
      ctx.strokeRect(px(Math.min(...xs)), py(Math.min(...ys)), (Math.max(...xs) - Math.min(...xs) + 1) * cs, (Math.max(...ys) - Math.min(...ys) + 1) * cs);
      ctx.setLineDash([]);
    }
    if (!s.circuit) return;
    const [ex, ey] = s.circuit.entrance, [xx, xy] = s.circuit.exit;
    const arrow = (x0, y0, x1, y1) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4)); ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };
    ctx.strokeStyle = '#fde047'; ctx.fillStyle = '#fde047'; ctx.lineWidth = 2;
    arrow(px(ex + 0.5), py(ey + 0.5), px(xx + 0.5), py(xy + 0.5));
    // Outer loop: back around the scar (above and below).
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
    const ys = s.scar.map(([, y]) => y);
    for (const yEdge of [Math.min(...ys) - 2, Math.max(...ys) + 3]) {
      ctx.beginPath(); ctx.moveTo(px(xx + 0.5), py(xy + 0.5)); ctx.lineTo(px(xx + 0.5), py(yEdge)); ctx.lineTo(px(ex + 0.5), py(yEdge)); ctx.lineTo(px(ex + 0.5), py(ey + 0.5)); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawEgm(c) {
    const cv = canvasContext(traceCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const { b, egm } = c;
    const span = Math.max(400, Math.ceil(b.end + 220));
    const x0 = 44, w = width - x0 - 10;
    const x = (ms) => x0 + (ms / span) * w;
    ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = GRID_TEXT;
    ctx.fillText(T().egmTitle(T().rhythms[state.rhythm]), 6, 13);
    // QRS window.
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.fillRect(x(b.onset), 20, x(b.end) - x(b.onset), height - 40);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'; ctx.setLineDash([3, 3]);
    for (const ms of [b.onset, b.end]) { ctx.beginPath(); ctx.moveTo(x(ms), 20); ctx.lineTo(x(ms), height - 20); ctx.stroke(); }
    ctx.setLineDash([]);
    const lanes = [{ name: 'II', y: 20 + (height - 40) * 0.2 }, { name: 'ABL bi', y: 20 + (height - 40) * 0.55 }, { name: 'ABL uni', y: 20 + (height - 40) * 0.86 }];
    for (const lane of lanes) {
      ctx.strokeStyle = 'rgba(159, 199, 182, 0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, lane.y); ctx.lineTo(x0 + w, lane.y); ctx.stroke();
      ctx.fillStyle = '#c8f0dc'; ctx.fillText(lane.name, 6, lane.y + 4);
    }
    const lane = (values, y, gain, color, lw) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
      values.forEach((v, ms) => { const yy = Math.max(22, Math.min(height - 22, y - v * gain)); if (ms === 0) ctx.moveTo(x(ms), yy); else ctx.lineTo(x(ms), yy); });
      ctx.stroke();
    };
    const lead = Array.from({ length: span }, (_, ms) => b.qrs.leads[1][ms] ?? 0);
    const peak = Math.max(...lead.map(Math.abs)) || 1;
    lane(lead, lanes[0].y, ((height - 40) * 0.22) / peak, TEMPLATE_COLOR, 1.6);
    // The EGM at a fixed gain (mV), so low voltage looks low.
    const trace = egmTrace(egm, span);
    lane(Array.from(trace), lanes[1].y, (height - 40) * 0.065, '#f8fafc', 1.4);
    // Unipolar from the distal electrode: its own gain (about 13 mV fits), the far field stays in it.
    lane(Array.from(unipolarTrace(egm, span)), lanes[2].y, ((height - 40) * 0.11) / 7, UNIPOLAR_COLOR, 1.4);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f8fafc'; ctx.fillText(`${egm.voltage.toFixed(2)} mV`, width - 8, lanes[1].y - 6);
    ctx.fillStyle = UNIPOLAR_COLOR; ctx.fillText(`${egm.unipolar.toFixed(2)} mV`, width - 8, lanes[2].y - 6);
    ctx.textAlign = 'left';
    // Late potential: mark the isolated near field.
    if (egm.kind === 'lp' || egm.kind === 'lava') {
      ctx.fillStyle = egm.kind === 'lp' ? '#ffffff' : '#f9a8d4';
      ctx.fillText(T().legend[egm.kind === 'lp' ? 'tagLp' : 'tagLava'], x(egm.local) - 6, lanes[1].y - (height - 40) * 0.13);
    }
    ctx.fillStyle = GRID_TEXT;
    for (let ms = 0; ms <= span; ms += 100) ctx.fillText(String(ms), x(ms) - 8, height - 6);
    traceCanvas.setAttribute('aria-label', T().egmTitle(T().rhythms[state.rhythm]));
  }

  function drawEntrainment(c) {
    const cv = canvasContext(traceCanvas);
    if (!cv) return;
    const { ctx, width, height } = cv;
    const { ent, circuit } = c;
    ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = GRID_TEXT;
    ctx.fillText(T().ecgTitle, 6, 13);
    traceCanvas.setAttribute('aria-label', T().ecgTitle);
    if (!circuit) { ctx.fillText(T().classes.noVt, 6, 34); return; }
    const vtQ = circuit.qrs, paced = ent?.capture ? ent.paced : null;
    const pre = Math.max(60, (ent?.sqrs ?? 0) + 20), span = Math.max(vtQ.duration, paced?.duration || 0) + pre + 40;
    const cols = width < 520 ? 1 : 2, rows = Math.ceil(ECG_LEADS.length / cols);
    const top = 22, cellW = (width - 8) / cols, cellH = (height - top - 4) / rows;
    const peak = Math.max(...ECG_LEADS.flatMap((i) => vtQ.leads[i].map(Math.abs))) || 1;
    const gain = (cellH * 0.42) / peak;
    ECG_LEADS.forEach((li, n) => {
      const col = Math.floor(n / rows), r = n % rows;
      const x0 = 4 + col * cellW + 30, w = cellW - 40, yMid = top + r * cellH + cellH / 2;
      const x = (ms) => x0 + ((ms + pre) / span) * w;
      ctx.strokeStyle = 'rgba(159, 199, 182, 0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x0 + w, yMid); ctx.stroke();
      ctx.fillStyle = '#c8f0dc'; ctx.fillText(LEAD_NAMES[li], 4 + col * cellW, yMid + 3);
      const trace = (q, color, lw) => {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (let ms = -pre; ms <= span - pre; ms++) {
          const v = q.leads[li][q.onset + ms] ?? 0;
          const yy = Math.max(yMid - cellH / 2 + 1, Math.min(yMid + cellH / 2 - 1, yMid - v * gain));
          if (ms === -pre) ctx.moveTo(x(ms), yy); else ctx.lineTo(x(ms), yy);
        }
        ctx.stroke();
      };
      trace(vtQ, TEMPLATE_COLOR, 2.2);
      if (paced) {
        trace(paced, PACED_COLOR, 1.3);
        // Stimulus: S-QRS before the QRS onset when the fusion is concealed.
        if (ent.sqrs != null) {
          ctx.strokeStyle = PACED_COLOR; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x(-ent.sqrs), yMid - cellH * 0.38); ctx.lineTo(x(-ent.sqrs), yMid + cellH * 0.38); ctx.stroke();
        }
      }
    });
  }

  function renderLegend(c) {
    const lg = T().legend;
    const text = el('span', 'amap-legend-times');
    if (state.map === 'bipolar') text.textContent = lg.bipolar(state.scarCut, state.normalCut);
    else if (state.map === 'unipolar') text.textContent = lg.unipolar;
    else if (state.rhythm === 'vt') text.textContent = lg.latVt;
    else text.textContent = c.lat ? lg.lat(Math.round(c.lat.min), Math.round(c.lat.max)) : '';
    const swatches = COLORS.map((color) => { const s = el('span', 'amap-swatch'); s.style.background = color; return s; });
    const extra = [];
    if (state.tags) for (const [color, label] of [['#ffffff', lg.tagLp], ['#f9a8d4', lg.tagLava]]) { const s = el('span', 'amap-swatch'); s.style.background = color; s.style.borderRadius = '50%'; const t = el('span', 'amap-legend-times'); t.textContent = label; extra.push(s, t); }
    if (c.ablated.size) { const s = el('span', 'amap-swatch'); s.style.background = '#7f1d1d'; s.style.borderRadius = '50%'; const t = el('span', 'amap-legend-times'); t.textContent = lg.lesion; extra.push(s, t); }
    legend.replaceChildren(...swatches, text, ...extra);
  }

  function renderReading(c) {
    const tt = T(), r = tt.readout, { egm, ent, result } = c;
    const row = (label, value) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; };
    const ms = (v) => (v == null ? '-' : `${Math.round(v)} ms`);
    const items = [
      ...row(r.bipolar, `${egm.voltage.toFixed(2)} mV (${voltageClass(egm.voltage, state.scarCut, state.normalCut)})`),
      ...row(r.unipolar, `${egm.unipolar.toFixed(2)} mV`)
    ];
    if (state.rhythm === 'vt') {
      if (ent?.capture) {
        items.push(
          ...row(r.tcl, ms(ent.tcl)), ...row(r.pcl, ms(ent.pcl)), ...row(r.ppi, ms(ent.ppi)), ...row(r.ppiDiff, ms(ent.ppiMinusTcl)),
          ...row(r.match, `${ent.match.toFixed(1)} %`), ...row(r.sqrs, ms(ent.sqrs)), ...row(r.egmQrs, ms(ent.egmQrs)), ...row(r.delta, ms(ent.delta)),
          ...row(r.ratio, ent.ratio == null ? '-' : ent.ratio.toFixed(2)), ...row(r.josephson, ent.josephson ? r.yes : r.no)
        );
      }
      const key = !c.circuit ? 'noVt' : !ent?.capture ? 'noCapture' : ent.cls;
      verdict.textContent = tt.classes[key];
      verdict.dataset.level = LEVEL[key] || 'none';
    } else {
      items.push(...row(r.egm, egm.kind.toUpperCase()), ...row(r.duration, ms(egm.duration)), ...row(r.far, ms(egm.farTime)), ...row(r.near, ms(egm.local)), ...row(r.qrsEnd, ms(egm.qrsEnd)));
      verdict.textContent = egm.kind === 'normal' && egm.unipolar < CUTOFFS.unipolar ? `${tt.kinds.normal} ${tt.unipolarLow}` : tt.kinds[egm.kind];
      verdict.dataset.level = egm.kind === 'normal' ? (egm.unipolar < CUTOFFS.unipolar ? 'close' : 'good') : egm.kind === 'none' ? 'none' : egm.kind === 'abnormal' ? 'close' : 'poor';
    }
    readout.replaceChildren(...items);
    strategyNote.textContent = tt.strategyText[state.strategy];
    strategyReadout.hidden = !result;
    if (result) {
      strategyReadout.replaceChildren(
        ...row(r.lesions, String(result.lesions)),
        ...(result.vtInducible == null ? [] : row(r.vt, result.vtInducible ? r.inducible : r.notInducible)),
        ...row(r.residualLp, String(result.residual.lp)), ...row(r.residualLava, String(result.residual.lava)),
        ...(result.exitBlock == null ? [] : row(r.exitBlock, result.exitBlock ? r.blocked : r.notBlocked))
      );
    }
  }

  function render() {
    const tt = T(), s = scenario(), st = tt.scenarios[state.scenario];
    heading.textContent = tt.heading;
    intro.textContent = tt.intro;
    for (const span of side.querySelectorAll?.('[data-key]') || []) span.textContent = tt[span.dataset.key];
    scenarioSel.replaceChildren(...Object.keys(SCENARIOS).map((id) => option(id, tt.scenarios[id].name)));
    scenarioSel.value = state.scenario;
    mapSel.replaceChildren(...Object.keys(tt.maps).map((id) => option(id, tt.maps[id])));
    mapSel.value = state.map;
    scarSel.replaceChildren(...CUTOFFS.scar.map((v) => option(String(v), `${v} mV`)));
    scarSel.value = String(state.scarCut);
    normalSel.replaceChildren(...CUTOFFS.normal.map((v) => option(String(v), `${v} mV`)));
    normalSel.value = String(state.normalCut);
    scarField.hidden = normalField.hidden = state.map !== 'bipolar';
    rhythmSel.replaceChildren(...RHYTHMS.filter((id) => id !== 'vt' || s.circuit).map((id) => option(id, tt.rhythms[id])));
    rhythmSel.value = state.rhythm;
    strategySel.replaceChildren(...STRATEGIES.filter((id) => s.circuit || id === 'none').map((id) => option(id, tt.strategies[id])));
    strategySel.value = state.strategy;
    strategyField.hidden = !s.circuit;
    siteSel.replaceChildren(option('', tt.sitePick), ...Object.keys(s.sites).map((id) => option(id, st.sites[id])));
    const named = Object.entries(s.sites).find(([, p]) => p[0] === state.site[0] && p[1] === state.site[1]);
    siteSel.value = named ? named[0] : '';
    for (const [btn, key] of [[tagsBtn, 'tags'], [truthBtn, 'truth']]) { btn.textContent = tt[key]; btn.setAttribute('aria-pressed', String(state[key])); }
    lesson.textContent = st.lesson;
    truth.textContent = st.truth;
    truth.hidden = !state.truth;
    source.textContent = tt.source;
    const c = compute();
    drawMap(c);
    renderLegend(c);
    renderReading(c);
    if (state.rhythm === 'vt') drawEntrainment(c); else drawEgm(c);
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
    setScenario,
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); return render(); },
    getState: () => ({ ...state })
  };
}
