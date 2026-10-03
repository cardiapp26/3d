import { GRID, SEGMENTS, OUTPUTS, COUPLINGS, LEADS, SCENARIOS, paceAt, scoreMap, tissue, cellOf, cellKey } from './pmap-model.js';
import { COLORS } from './amap-model.js';
import { PMAP_TEXT } from './pmap-text.js';

/*
 * Pace mapping panel (the Pace map tab): the unrolled left ventricle of
 * pmap-model.js with the catheter (click or arrow keys), its captured zone
 * and an optional match map, the twelve-lead comparison of the paced QRS
 * with the clinical template, and the controls (scenario, template, site,
 * output, coupling interval, rhythm, fused beat, the true source) with the
 * reading and its warnings.
 */

const TEMPLATE_COLOR = '#22c55e';
const PACED_COLOR = '#facc15';
const TISSUE = { wall: '#2b3b35', pap: '#4f7a66', cavity: '#0b1210', scar: '#55534d', channel: '#b07a3f' };
// Match map bands (%): red best ... purple worst.
const BANDS = [97, 94, 90, 85, 80, 70];
const bandOf = (score) => { const i = BANDS.findIndex((b) => score >= b); return i < 0 ? 6 : i; };
const GOOD = 97, CLOSE = 90, LONG_SQRS = 40;

export function createPaceMapPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => PMAP_TEXT[L()];
  const state = { scenario: 'focal', template: 'pvc', site: SCENARIOS.focal.start, output: 'threshold', ci: SCENARIOS.focal.coupling, mode: 'sinus', fusion: false, scoremap: false, truth: false, active: false };

  const root = el('section', 'amap pmap', { 'data-pmap': '' });
  const view = el('div', 'amap-view');
  const mapCanvas = el('canvas', 'amap-canvas pmap-canvas', { role: 'img', tabindex: '0', 'data-pmap-map': '' });
  const legend = el('div', 'amap-legend', { 'data-pmap-legend': '' });
  const ecgCanvas = el('canvas', 'pmap-ecg', { role: 'img', 'data-pmap-ecg': '' });
  view.append(mapCanvas, legend, ecgCanvas);
  const side = el('aside', 'amap-side');
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const field = (labelKey, control) => { const l = el('label', 'amap-field'); const s = el('span'); s.dataset.key = labelKey; l.append(s, control); return l; };
  const select = (name) => el('select', '', { [`data-pmap-${name}`]: '' });
  const scenarioSel = select('scenario'), templateSel = select('template'), siteSel = select('site'), outputSel = select('output'), ciSel = select('ci'), modeSel = select('mode');
  const templateField = field('template', templateSel), modeField = field('mode', modeSel);
  const toggle = (name) => el('button', 'amap-toggle', { type: 'button', [`data-pmap-${name}`]: '' });
  const fusionBtn = toggle('fusion'), mapBtn = toggle('scoremap'), truthBtn = toggle('truth');
  const toggles = el('div', 'amap-toggles');
  toggles.append(fusionBtn, mapBtn, truthBtn);
  const verdict = el('p', 'amap-verdict', { 'aria-live': 'polite', 'data-pmap-verdict': '' });
  const warn = el('ul', 'pmap-warn', { 'data-pmap-warn': '' });
  const readout = el('dl', 'amap-readout', { 'data-pmap-readout': '' });
  const lesson = el('p', 'amap-lesson', { 'data-pmap-lesson': '' });
  const truth = el('p', 'amap-truth', { 'data-pmap-truth-text': '' });
  const source = el('p', 'amap-source');
  side.append(heading, intro, field('scenario', scenarioSel), templateField, field('site', siteSel), field('output', outputSel), field('ci', ciSel), modeField,
    toggles, verdict, warn, readout, lesson, truth, source);
  root.append(view, side);

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };
  const scenario = () => SCENARIOS[state.scenario];

  function setScenario(id) {
    if (!SCENARIOS[id]) return;
    const s = SCENARIOS[id];
    Object.assign(state, { scenario: id, template: s.templates[0].id, site: s.start, output: 'threshold', ci: s.coupling, mode: 'sinus', fusion: false, truth: false });
    render();
  }
  scenarioSel.addEventListener('change', () => setScenario(scenarioSel.value));
  templateSel.addEventListener('change', () => { state.template = templateSel.value; render(); });
  siteSel.addEventListener('change', () => { const p = scenario().sites[siteSel.value]; if (p) { state.site = p; render(); } });
  outputSel.addEventListener('change', () => { state.output = outputSel.value; render(); });
  ciSel.addEventListener('change', () => { state.ci = Number(ciSel.value); render(); });
  modeSel.addEventListener('change', () => { state.mode = modeSel.value; render(); });
  fusionBtn.addEventListener('click', () => { state.fusion = !state.fusion; render(); });
  mapBtn.addEventListener('click', () => { state.scoremap = !state.scoremap; render(); });
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

  const options = () => ({ output: state.output, ci: state.ci, mode: state.mode, fusion: state.fusion, templateId: state.template });
  const tissueCache = new Map();
  const tissueNow = () => { const k = `${state.scenario}|${state.ci}`; if (!tissueCache.has(k)) tissueCache.set(k, tissue(state.scenario, state.ci)); return tissueCache.get(k); };

  /** Everything the drawings and the reading need. */
  function compute() {
    const result = paceAt(state.scenario, state.site, options());
    return { result, t: tissueNow(), map: state.scoremap ? scoreMap(state.scenario, options()) : null };
  }

  function canvasContext(canvas) {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!(width >= 2) || !(height >= 2) || typeof canvas.getContext !== 'function') return null;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0e1815'; ctx.fillRect(0, 0, width, height);
    return { ctx, width, height };
  }

  function drawMap({ result, t, map }) {
    const c = canvasContext(mapCanvas);
    if (!c) return;
    const { ctx, width, height } = c;
    const cs = Math.max(4, Math.floor(Math.min((width - 34) / GRID.w, (height - 22) / GRID.h)));
    const ox = Math.floor((width - cs * GRID.w + 26) / 2), oy = 18;
    layout = { cs, ox, oy };
    const px = (x) => ox + x * cs, py = (y) => oy + y * cs;
    const s = scenario();
    for (let k = 0; k < GRID.w * GRID.h; k++) {
      const [x, y] = cellOf(k);
      let fill = TISSUE[t.type[k]];
      if (map?.has(k)) fill = COLORS[bandOf(map.get(k))];
      ctx.fillStyle = fill;
      ctx.fillRect(px(x) + 0.5, py(y) + 0.5, cs - 1, cs - 1);
      // Tissue not yet recovered at this coupling interval.
      if (t.unrecovered[k] && t.type[k] !== 'scar' && t.type[k] !== 'cavity') {
        ctx.fillStyle = 'rgba(167, 139, 250, 0.45)';
        ctx.fillRect(px(x) + 0.5, py(y) + 0.5, cs - 1, cs - 1);
      }
    }
    // Purkinje network (not across the wrap).
    if (t.purkinje) {
      ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2;
      const wrapX = (x) => ((x % GRID.w) + GRID.w) % GRID.w;
      for (let i = 1; i < t.purkinje.length; i++) {
        const a = t.purkinje[i - 1], b = t.purkinje[i];
        if (Math.hypot(a.x - b.x, a.y - b.y) > 1.6) continue;   // a new fascicle starts at the split
        const ax = wrapX(a.x), bx = wrapX(b.x);
        if (Math.abs(ax - bx) > 2) continue;
        ctx.beginPath(); ctx.moveTo(px(ax + 0.5), py(a.y + 0.5)); ctx.lineTo(px(bx + 0.5), py(b.y + 0.5)); ctx.stroke();
      }
    }
    // Captured tissue outlined.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; ctx.lineWidth = 1;
    for (const k of result.capture) if (k < GRID.w * GRID.h) { const [x, y] = cellOf(k); ctx.strokeRect(px(x) + 1.5, py(y) + 1.5, cs - 3, cs - 3); }
    // Segment and base / apex labels.
    const tt = T();
    ctx.font = `600 ${Math.max(9, Math.min(12, Math.floor(cs * 0.6)))}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#9fc7b6';
    for (const seg of SEGMENTS) ctx.fillText(tt.segments[seg.id], px((seg.from + seg.to + 1) / 2), oy - 9);
    ctx.save(); ctx.translate(ox - 12, py(1.5)); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText(tt.base, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(ox - 12, py(GRID.h - 1.5)); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'left'; ctx.fillText(tt.apex, 0, 0); ctx.restore();
    // The true source / circuit.
    if (state.truth) drawTruth(ctx, px, py, cs, s);
    // Catheter and its virtual electrode.
    const [sx, sy] = state.site;
    const radius = Math.max(OUTPUTS[state.output], t.type[cellKey(sx, sy)] === 'cavity' ? 1 : 0);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    if (radius > 0) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(px(sx + 0.5), py(sy + 0.5), (radius + 0.5) * cs, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath(); ctx.arc(px(sx + 0.5), py(sy + 0.5), cs * 0.32, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    mapCanvas.setAttribute('aria-label', `${tt.heading}: ${tt.scenarios[state.scenario].name}`);
  }

  function drawTruth(ctx, px, py, cs, s) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    const tpl = s.templates.find((x) => x.id === state.template) || s.templates[0];
    if (s.paths) {
      // Circuit through the isthmus (entrance, isthmus, exit) and the labels of the exits.
      const circuit = [...s.paths.entrance, ...s.paths.isthmus, ...s.paths.exit];
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      circuit.forEach(([x, y], i) => (i ? ctx.lineTo(px(x + 0.5), py(y + 0.5)) : ctx.moveTo(px(x + 0.5), py(y + 0.5))));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 ${Math.max(10, Math.floor(cs * 0.7))}px ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
      for (const [name, [x, y]] of Object.entries(s.exits)) ctx.fillText(name, px(x + 0.5), py(y + 0.5));
      const [bx, by] = s.paths.bystander[s.paths.bystander.length - 1];
      ctx.fillText('B', px(bx - 0.5), py(by + 0.5));
      return;
    }
    const at = tpl.purkinje || tpl.cells[0];
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(px(((at[0] % GRID.w) + GRID.w) % GRID.w + 0.5), py(at[1] + 0.5), cs * 1.2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawEcg({ result }) {
    const c = canvasContext(ecgCanvas);
    if (!c) return;
    const { ctx, width, height } = c;
    const tpl = result.template.qrs, paced = result.paced;
    const narrow = width < 520;
    const cols = narrow ? 1 : 2, rows = LEADS.length / cols;
    const top = 16, cellW = (width - 8) / cols, cellH = (height - top - 4) / rows;
    const pre = Math.min(paced ? paced.onset : 0, 220) + 20;           // ms shown before the QRS onset
    const span = pre + Math.max(tpl.duration, paced?.duration || 0) + 40;
    const peak = Math.max(...tpl.leads.flat().map(Math.abs)) || 1;
    const gain = (cellH * 0.42) / peak;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = '#9fc7b6'; ctx.fillText(narrow ? T().ecgTitleShort : T().ecgTitle, 6, 11);
    LEADS.forEach((name, i) => {
      const col = Math.floor(i / rows), r = i % rows;
      const x0 = 4 + col * cellW + 34, w = cellW - 44, yMid = top + r * cellH + cellH / 2;
      const x = (ms) => x0 + ((ms + pre) / span) * w;
      ctx.strokeStyle = 'rgba(159, 199, 182, 0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x0 + w, yMid); ctx.stroke();
      ctx.fillStyle = '#c8f0dc'; ctx.textAlign = 'left'; ctx.fillText(name, 4 + col * cellW, yMid + 3);
      const trace = (q, color, lw) => {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (let ms = -pre; ms <= span - pre; ms++) {
          const v = q.leads[i][q.onset + ms] ?? 0;
          const yy = Math.max(yMid - cellH / 2 + 1, Math.min(yMid + cellH / 2 - 1, yMid - v * gain));
          if (ms === -pre) ctx.moveTo(x(ms), yy); else ctx.lineTo(x(ms), yy);
        }
        ctx.stroke();
      };
      trace(tpl, TEMPLATE_COLOR, 2.2);
      if (paced) {
        trace(paced, PACED_COLOR, 1.3);
        // Stimulus: stim-QRS before the paced onset.
        ctx.strokeStyle = PACED_COLOR; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x(-paced.onset), yMid - cellH * 0.38); ctx.lineTo(x(-paced.onset), yMid + cellH * 0.38); ctx.stroke();
        const rr = result.perLead[i];
        ctx.fillStyle = rr >= 0.9 ? '#9fc7b6' : '#fca5a5'; ctx.textAlign = 'right';
        ctx.fillText(rr.toFixed(2), x0 + w + 8, yMid - cellH / 2 + 10);
      }
    });
    ctx.textAlign = 'left';
    ecgCanvas.setAttribute('aria-label', T().ecgTitle);
  }

  function renderLegend({ map }) {
    legend.hidden = !map;
    if (!map) return;
    legend.replaceChildren(...COLORS.map((color) => { const s = el('span', 'amap-swatch'); s.style.background = color; return s; }));
    const text = el('span', 'amap-legend-times');
    text.textContent = T().legend(BANDS[BANDS.length - 1]);
    legend.append(text);
  }

  /** Warnings that explain the reading at this site. */
  function warnings({ result, t }) {
    const w = T().warn, out = [];
    const site = cellKey(...state.site);
    if (!result.paced) { if (t.type[site] === 'scar') out.push(w.scar); return out; }
    if (result.sqrs > LONG_SQRS) out.push(w.long);
    if (t.type[site] === 'cavity') out.push(w.contact);
    const kinds = capturedKinds(result, t);
    if (state.output !== 'threshold' && result.capture.length > 1 && (kinds.size > 1 || kinds.has('channel'))) out.push(w.output);
    if (kinds.has('purkinje')) out.push(w.purkinje);
    if (state.ci < scenario().coupling - 50 && result.unrecovered.some(Boolean)) out.push(w.fast);
    if (state.fusion) out.push(w.fusion);
    return out;
  }
  function capturedKinds(result, t) {
    const n = GRID.w * GRID.h;
    return new Set(result.capture.map((k) => (k >= n ? 'purkinje' : t.type[k])));
  }

  function renderReading(c) {
    const tt = T(), r = tt.readout, { result, t } = c;
    const s = scenario();
    const row = (label, value) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; };
    const paced = result.paced;
    const weak = paced ? LEADS.filter((_, i) => result.perLead[i] < 0.9) : [];
    const kinds = capturedKinds(result, t);
    readout.replaceChildren(
      ...row(r.score, paced ? `${result.score.toFixed(1)} %` : '-'),
      ...row(r.sqrs, paced ? `${result.sqrs} ms` : '-'),
      ...row(r.paced, paced ? `${paced.duration} ms` : '-'),
      ...row(r.clinical, `${result.template.qrs.duration} ms`),
      ...(result.template.tcl ? row(r.tcl, `${result.template.tcl} ms`) : []),
      ...(state.mode === 'vt' && result.ppiMinusTcl != null ? row(r.ppi, `${result.ppiMinusTcl} ms`) : []),
      ...(s.purkinje ? row(r.purkinje, result.purkinjeLead == null ? '-' : r.purkinjeValue(result.purkinjeLead)) : []),
      ...row(r.captured, kinds.size ? [...kinds].map((k) => tt.capturedKinds[k] || k).join(', ') : '-'),
      ...row(r.weak, paced ? (weak.length ? weak.join(' ') : r.none) : '-')
    );
    const level = !paced ? 'none' : result.score >= GOOD ? 'good' : result.score >= CLOSE ? 'close' : 'poor';
    verdict.textContent = tt.verdict[level];
    verdict.dataset.level = level;
    const items = warnings(c);
    warn.replaceChildren(...items.map((text) => { const li = el('li'); li.textContent = text; return li; }));
    warn.hidden = !items.length;
  }

  function render() {
    const tt = T(), s = scenario(), st = tt.scenarios[state.scenario];
    heading.textContent = tt.heading;
    intro.textContent = tt.intro;
    for (const span of side.querySelectorAll?.('[data-key]') || []) span.textContent = tt[span.dataset.key];
    scenarioSel.replaceChildren(...Object.keys(SCENARIOS).map((id) => option(id, tt.scenarios[id].name)));
    scenarioSel.value = state.scenario;
    templateSel.replaceChildren(...s.templates.map((x) => option(x.id, tt.templates[x.id])));
    templateSel.value = state.template;
    templateField.hidden = s.templates.length < 2;
    siteSel.replaceChildren(option('', tt.sitePick), ...Object.keys(s.sites).map((id) => option(id, st.sites[id])));
    const named = Object.entries(s.sites).find(([, p]) => p[0] === state.site[0] && p[1] === state.site[1]);
    siteSel.value = named ? named[0] : '';
    outputSel.replaceChildren(...Object.keys(OUTPUTS).map((id) => option(id, tt.outputs[id])));
    outputSel.value = state.output;
    const cis = [...new Set([...COUPLINGS, s.coupling])].sort((a, b) => b - a);
    ciSel.replaceChildren(...cis.map((v) => option(String(v), v === s.coupling ? `${v} (${tt.clinicalCi})` : String(v))));
    ciSel.value = String(state.ci);
    modeSel.replaceChildren(...Object.keys(tt.modes).map((id) => option(id, tt.modes[id])));
    modeSel.value = state.mode;
    modeField.hidden = !s.entrainment;
    for (const [btn, key] of [[fusionBtn, 'fusion'], [mapBtn, 'scoremap'], [truthBtn, 'truth']]) { btn.textContent = tt[key]; btn.setAttribute('aria-pressed', String(state[key])); }
    lesson.textContent = st.lesson;
    truth.textContent = st.truth;
    truth.hidden = !state.truth;
    source.textContent = tt.source;
    const c = compute();
    renderReading(c);
    renderLegend(c);
    drawMap(c);
    drawEcg(c);
    return c;
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
