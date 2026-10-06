import { drawEgm } from './ep-egm.js';
import { sinusBeat, merge, ev } from './ep-beats.js';
import {
  SPACINGS, HIGH_PASS, LOW_PASS, NORMAL_RANGE, HV_LIMITS, BLOCK_CASES, BLOCK_WINDOW_MS, A1A2_RANGE, AVN_ERP,
  electrodePair, filterBeat, classifyIntervals, blockCase, ahAt, ahCurve
} from './egm-basics-model.js';
import { BASICS_TEXT } from './egm-basics-text.js';
import { functionalAt, vectorAt, ENTRANCE, LANDMARKS } from '../koch-sp-functional.js';

/*
 * EGM basics tab: six interactive cards, each a diagram first and a caption
 * second. (1) one wave past a unipolar and a bipolar pair, animated, with
 * the far field; (2) the filter band on a unipolar QS; (3) the four
 * catheters on a heart schematic with their strips; (4) PA, AH, HV against
 * their ranges; (5) the level of AV block read from A-H-V with a decision
 * diagram; (6) the decremental AV node and the AH jump.
 */

const SVG = 'http://www.w3.org/2000/svg';
const COLORS = { uni: '#e8f3ee', bip: '#facc15', far: '#93c5fd', raw: 'rgba(159, 199, 182, 0.45)', good: '#4ade80', bad: '#f87171', slow: '#fb923c' };
const CATHETERS = {
  hra: { at: [196, 46], channels: ['ecg-ii', 'hra'] },
  his: { at: [150, 112], channels: ['ecg-ii', 'his-d'] },
  cs: { at: [178, 150], channels: ['ecg-ii', 'cs-910', 'cs-12'] },
  rv: { at: [128, 206], channels: ['ecg-ii', 'rv'] }
};
const SPEED = 3;   // px per ms of the wave in the tissue strip

export function createEgmBasicsPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const svg = (tag, attrs = {}) => {
    const n = (doc.createElementNS ? doc.createElementNS(SVG, tag) : doc.createElement(tag));
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => BASICS_TEXT[L()];
  const state = {
    active: false, playing: true, phase: -80,
    source: 'passing', angle: 0, spacing: 5, far: true,
    hp: 0.05, lp: 500,
    catheter: 'his',
    pa: 40, ah: 85, hv: 45,
    block: 'wenckebach-nodal',
    a1a2: 400, dual: false, sweeping: false, kochPf: true
  };

  const root = el('section', 'basics', { 'data-basics': '' });
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const source = el('p', 'amap-source');
  const grid = el('div', 'basics-grid');
  root.append(heading, intro, grid, source);
  const texts = [];   // [node, getter] refreshed on every render
  const bind = (node, get) => { texts.push([node, get]); return node; };
  const card = (name) => {
    const c = el('section', 'basics-card', { 'data-basics-card': name });
    const h = bind(el('h4'), () => T()[name].title);
    c.append(h);
    grid.append(c);
    return c;
  };
  const button = (attrs, onClick) => { const b = el('button', 'amap-toggle', { type: 'button', ...attrs }); b.addEventListener('click', onClick); return b; };
  const chips = () => el('dl', 'amap-readout');
  const setChips = (dl, rows) => dl.replaceChildren(...rows.flatMap(([label, value]) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; }));
  const slider = (name, min, max, step, onInput) => { const i = el('input', '', { type: 'range', min: String(min), max: String(max), step: String(step), [`data-basics-${name}`]: '' }); i.addEventListener('input', () => onInput(Number(i.value))); return i; };
  const field = (get, control, out) => { const l = el('label', 'amap-field'); const s = bind(el('span'), get); l.append(s, control); if (out) l.append(out); return l; };

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
  const line = (ctx, pts, color, w = 1.4, dash = []) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke(); ctx.setLineDash([]);
  };

  // ---- 1. one wave, two recordings -------------------------------------------
  const poles = card('poles');
  const polesCanvas = el('canvas', 'basics-canvas basics-poles', { role: 'img', 'data-basics-poles-canvas': '' });
  const sourceBtns = ['origin', 'passing'].map((id) => button({ 'data-basics-source': id }, () => { state.source = id; render(); }));
  const angleIn = slider('angle', 0, 90, 5, (v) => { state.angle = v; render(); });
  const angleOut = el('output');
  const spacingBtns = SPACINGS.map((mm) => button({ 'data-basics-spacing': String(mm) }, () => { state.spacing = mm; render(); }));
  const farBtn = button({ 'data-basics-far': '' }, () => { state.far = !state.far; render(); });
  const playBtn = button({ 'data-basics-play': '' }, () => { state.playing = !state.playing; if (state.playing) schedule(); render(); });
  const polesChips = chips();
  const polesNote = bind(el('p', 'amap-note'), () => T().poles.note);
  const row = (...kids) => { const r = el('div', 'amap-toggles'); r.append(...kids); return r; };
  poles.append(polesCanvas, row(...sourceBtns), field(() => T().poles.angle, angleIn, angleOut), row(...spacingBtns, farBtn, playBtn), polesChips, polesNote);

  function drawPoles() {
    const c = canvasContext(polesCanvas);
    if (!c) return;
    const { ctx, width, height } = c;
    const t = T().poles, pair = electrodePair({ source: state.source, angle: state.angle, spacing: state.spacing });
    const zoneH = height * 0.36;
    const xe = width * 0.42, ye = zoneH * 0.55, mm = 6;
    // Tissue strip, the wavefront and the two poles.
    ctx.fillStyle = '#25322d'; ctx.fillRect(16, ye - 15, width - 32, 30);
    const px = xe + SPEED * state.phase;
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5;
    if (state.source === 'origin') {
      if (state.phase >= 0) { ctx.beginPath(); ctx.arc(xe, ye, Math.max(2, SPEED * state.phase), -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(xe, ye, 4, 0, Math.PI * 2); ctx.fill();
    } else if (px > 16 && px < width - 16) {
      line(ctx, [[px, ye - 15], [px, ye + 15]], '#facc15', 2.5);
    }
    const a = (state.angle * Math.PI) / 180, p2 = [xe + state.spacing * mm * Math.cos(a), ye - state.spacing * mm * Math.sin(a)];
    line(ctx, [[xe, ye], p2], 'rgba(232, 243, 238, 0.5)', 1);
    for (const [i, p] of [[1, [xe, ye]], [2, p2]]) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fc7b6'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText(String(i), p[0] - 3, p[1] - 8);
    }
    if (state.far) {
      const glow = Math.exp(-0.5 * ((state.phase - 45) / 18) ** 2);
      ctx.fillStyle = `rgba(147, 197, 253, ${0.15 + 0.7 * glow})`; ctx.beginPath(); ctx.ellipse(width - 52, ye, 26, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.far; ctx.font = '10px ui-monospace, monospace'; ctx.fillText(t.farName, width - 76, ye + 36);
    }
    // Traces on the same time axis.
    const rowH = (height - zoneH - 10) / 2, left = 74, plotW = width - left - 14;
    const xt = (ms) => left + ((ms + 80) / 160) * plotW;
    [[t.unipolar, pair.uni, COLORS.uni, 0], [t.bipolar, pair.bip, COLORS.bip, 1]].forEach(([name, values, color, i]) => {
      const mid = zoneH + 10 + rowH * (i + 0.5), gain = rowH * 0.36;
      ctx.fillStyle = color; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText(name, 8, mid + 3);
      line(ctx, [[xt(-80), mid], [xt(80), mid]], 'rgba(159, 199, 182, 0.18)', 1);
      const all = pair.times.map((ms, k) => [xt(ms), mid - (state.far ? values[k] : (i ? pair.bipLocal : pair.uniLocal)[k]) * gain]);
      line(ctx, all, 'rgba(159, 199, 182, 0.22)', 1);
      const upto = all.filter((_, k) => pair.times[k] <= state.phase);
      if (upto.length > 1) line(ctx, upto, color, 1.8);
    });
    if (pair.morphology === 'QS' && state.source === 'origin') { ctx.fillStyle = COLORS.uni; ctx.fillText('QS', xt(0) + 8, zoneH + 10 + rowH * 0.5 + rowH * 0.34); }
    line(ctx, [[xt(state.phase), zoneH + 6], [xt(state.phase), height - 4]], 'rgba(255, 236, 168, 0.8)', 1.2);
    polesCanvas.setAttribute('aria-label', t.title);
  }
  function renderPoles() {
    const t = T().poles, pair = electrodePair({ source: state.source, angle: state.angle, spacing: state.spacing });
    sourceBtns.forEach((b, i) => { const id = ['origin', 'passing'][i]; b.textContent = t[id]; b.setAttribute('aria-pressed', String(state.source === id)); });
    spacingBtns.forEach((b, i) => { b.textContent = `${SPACINGS[i]} mm`; b.setAttribute('aria-pressed', String(state.spacing === SPACINGS[i])); });
    angleIn.value = String(state.angle); angleOut.textContent = `${state.angle}°`;
    farBtn.textContent = t.far; farBtn.setAttribute('aria-pressed', String(state.far));
    playBtn.textContent = state.playing ? T().pause : T().play; playBtn.setAttribute('aria-pressed', String(state.playing));
    setChips(polesChips, [
      [t.chips.morphology, pair.morphology === 'QS' ? 'QS' : 'rS'],
      [t.chips.amp, `${Math.round(pair.bipolarAmp * 100)} %`],
      [t.chips.ratio, `${(pair.farRatio * 100).toFixed(1)} %`]
    ]);
  }

  // ---- 2. filters --------------------------------------------------------------
  const filters = card('filters');
  const filterCanvas = el('canvas', 'basics-canvas basics-filter', { role: 'img', 'data-basics-filter-canvas': '' });
  const hpBtns = HIGH_PASS.map((hz) => button({ 'data-basics-hp': String(hz) }, () => { state.hp = hz; render(); }));
  const lpBtns = LOW_PASS.map((hz) => button({ 'data-basics-lp': String(hz) }, () => { state.lp = hz; render(); }));
  const presetBip = button({ 'data-basics-preset': 'bipolar' }, () => { state.hp = 30; state.lp = 500; render(); });
  const presetUni = button({ 'data-basics-preset': 'unipolar' }, () => { state.hp = 0.05; state.lp = 500; render(); });
  const hpLabel = bind(el('p', 'amap-note'), () => T().filters.hp), lpLabel = bind(el('p', 'amap-note'), () => T().filters.lp);
  const filterChips = chips();
  const filterNote = bind(el('p', 'amap-note'), () => T().filters.note);
  filters.append(filterCanvas, row(presetUni, presetBip), hpLabel, row(...hpBtns), lpLabel, row(...lpBtns), filterChips, filterNote);

  function drawFilters() {
    const c = canvasContext(filterCanvas);
    if (!c) return;
    const { ctx, width, height } = c;
    const f = filterBeat({ hp: state.hp, lp: state.lp });
    const left = 10, plotW = width - 20, mid = height * 0.62;
    const x = (i) => left + (i / (f.view.length - 1)) * plotW, y = (v) => mid - v * height * 0.42;
    line(ctx, [[left, y(0)], [left + plotW, y(0)]], 'rgba(159, 199, 182, 0.18)', 1);
    line(ctx, f.rawView.map((v, i) => [x(i), y(v)]), COLORS.raw, 1);
    line(ctx, f.view.map((v, i) => [x(i), y(v)]), COLORS.uni, 1.8);
    line(ctx, [[x(f.beatIndex), 6], [x(f.beatIndex), height - 6]], 'rgba(255, 236, 168, 0.35)', 1, [3, 3]);
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = COLORS.raw; ctx.fillText(T().filters.raw, 10, 14);
    ctx.fillStyle = COLORS.uni; ctx.fillText(T().filters.filtered, 52, 14);
    filterCanvas.setAttribute('aria-label', T().filters.title);
  }
  function renderFilters() {
    const t = T().filters, f = filterBeat({ hp: state.hp, lp: state.lp });
    hpBtns.forEach((b, i) => { b.textContent = String(HIGH_PASS[i]).replace('.', ','); b.setAttribute('aria-pressed', String(state.hp === HIGH_PASS[i])); });
    lpBtns.forEach((b, i) => { b.textContent = String(LOW_PASS[i]); b.setAttribute('aria-pressed', String(state.lp === LOW_PASS[i])); });
    presetBip.textContent = t.bipolarPreset; presetUni.textContent = t.unipolarPreset;
    setChips(filterChips, [
      [t.chips.qs, f.qs ? t.yes : t.no],
      [t.chips.overshoot, `${Math.round(f.overshoot * 100)} %`],
      [t.chips.slope, `${Math.round(f.slopeRatio * 100)} %`],
      [t.chips.wander, `${Math.round(f.wander * 100)} %`]
    ]);
  }

  // ---- 3. catheters ---------------------------------------------------------------
  const catheters = card('catheters');
  const heart = svg('svg', { viewBox: '0 0 300 250', class: 'basics-svg', role: 'img', 'data-basics-heart': '' });
  heart.append(
    svg('ellipse', { cx: 108, cy: 76, rx: 64, ry: 52, class: 'basics-chamber' }),
    svg('ellipse', { cx: 206, cy: 78, rx: 58, ry: 46, class: 'basics-chamber' }),
    svg('path', { d: 'M60 128 Q 64 224 150 236 L 150 132 Z', class: 'basics-chamber' }),
    svg('path', { d: 'M154 132 L 154 236 Q 244 222 252 124 Z', class: 'basics-chamber' }),
    svg('path', { d: 'M150 100 Q 190 156 250 138', class: 'basics-cs' })
  );
  const labels = [['RA', 84, 72], ['LA', 220, 96], ['RV', 98, 190], ['LV', 206, 190]].map(([name, x, y]) => { const tx = svg('text', { x, y, class: 'basics-chamber-label' }); tx.textContent = name; return tx; });
  heart.append(...labels);
  const catheterBtns = Object.entries(CATHETERS).map(([id, c]) => {
    const g = svg('g', { class: 'basics-catheter', tabindex: '0', role: 'button', 'data-basics-catheter': id });
    g.append(svg('circle', { cx: c.at[0], cy: c.at[1], r: 9 }));
    const tx = svg('text', { x: c.at[0] + 13, y: c.at[1] + 4 });
    g.append(tx);
    const choose = () => { state.catheter = id; render(); };
    g.addEventListener('click', choose);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); choose(); } });
    heart.append(g);
    return [id, g, tx];
  });
  const cathCanvas = el('canvas', 'basics-canvas basics-strip', { role: 'img', 'data-basics-catheter-canvas': '' });
  const cathTitle = el('p', 'amap-verdict', { 'data-basics-catheter-name': '' });
  const cathLines = el('ul', 'basics-lines');
  // His catheter: where the slow pathway entrance lies (Sakamoto 2026), as a small triangle of Koch with
  // peak frequency, converging vectors and the His / nodal-His / entrance points.
  const kochBox = el('div', 'basics-koch', { 'data-basics-koch': '' });
  const kochSvg = svg('svg', { viewBox: '0 0 330 170', class: 'basics-svg basics-koch-svg', role: 'img' });
  const kochTop = [[22, 150], [100, 160], [168, 158], [190, 22]];   // Todaro corner, CS ostium, hinge, apex
  const kochPoint = ({ u, v }) => {
    const [t, c, h, a] = kochTop;
    const base = v <= 0.5 ? [t[0] + (c[0] - t[0]) * v * 2, t[1] + (c[1] - t[1]) * v * 2] : [c[0] + (h[0] - c[0]) * (v * 2 - 1), c[1] + (h[1] - c[1]) * (v * 2 - 1)];
    return [base[0] + (a[0] - base[0]) * u, base[1] + (a[1] - base[1]) * u];
  };
  const kochPf = button({ 'data-basics-koch-pf': '' }, () => { state.kochPf = !state.kochPf; render(); });
  const kochNote = el('p', 'amap-note');
  kochBox.append(kochPf, kochSvg, kochNote);
  catheters.append(heart, cathTitle, cathLines, cathCanvas, kochBox);
  const sinusRecording = () => {
    const beats = [150, 950].map((t0) => sinusBeat(t0));
    const rv = { rv: beats.map((_, i) => ev('V', 150 + i * 800 + 35 + 80 + 45 - 5, 0.9)) };
    return { id: 'basics-sinus', channels: ['ecg-ii', 'hra', 'his-d', 'cs-910', 'cs-12', 'rv'], windowMs: 1500, events: merge(...beats, rv), calipers: [], markers: [] };
  };
  function renderCatheters() {
    const t = T().catheters, item = t.items[state.catheter];
    for (const [id, g, tx] of catheterBtns) { tx.textContent = t.items[id].name; g.setAttribute('aria-pressed', String(id === state.catheter)); g.setAttribute('aria-label', t.items[id].name); g.setAttribute('class', `basics-catheter${id === state.catheter ? ' is-on' : ''}`); }
    cathTitle.textContent = `${item.name}: ${item.where}`;
    cathLines.replaceChildren(...item.lines.map((x) => { const li = el('li'); li.textContent = x; return li; }));
    renderKoch();
  }
  function renderKoch() {
    const t = T().catheters.koch;
    kochBox.hidden = state.catheter !== 'his';
    kochPf.textContent = t.toggle; kochPf.setAttribute('aria-pressed', String(state.kochPf));
    kochNote.textContent = t.note;
    kochSvg.replaceChildren();
    kochSvg.setAttribute('aria-label', t.title);
    const [tt, cs, hh, ap] = kochTop;
    kochSvg.append(svg('path', { d: `M${tt} L${hh} L${ap} Z`, class: 'basics-koch-tri' }));
    if (state.kochPf) {
      const N = 14;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const [u0, u1, v0, v1] = [i / N, (i + 1) / N, j / N, (j + 1) / N];
        const f = functionalAt({ u: (u0 + u1) / 2, v: (v0 + v1) / 2 }).pf;
        const pts = [[u0, v0], [u0, v1], [u1, v1], [u1, v0]].map(([u, v]) => kochPoint({ u, v }).map((n) => n.toFixed(1)).join(','));
        kochSvg.append(svg('polygon', { points: pts.join(' '), fill: `hsl(${(215 - 215 * f).toFixed(0)} 85% ${(38 + 14 * f).toFixed(0)}%)`, 'fill-opacity': (0.3 + 0.45 * f).toFixed(2) }));
      }
      for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) {
        const s = { u: i / 6, v: j / 6 }, vec = vectorAt(s);
        if (vec.kind === 'convergence') continue;
        const [x0, y0] = kochPoint(s), [x1, y1] = kochPoint({ u: s.u + vec.du * 0.09, v: s.v + vec.dv * 0.09 });
        kochSvg.append(svg('path', { d: `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`, class: 'basics-koch-vec' }));
      }
    }
    kochSvg.append(svg('path', { d: `M${tt} Q ${(tt[0] + ap[0]) / 2 - 8} ${(tt[1] + ap[1]) / 2} ${ap}`, class: 'basics-koch-edge' }), svg('path', { d: `M${hh} L${ap}`, class: 'basics-koch-edge' }), svg('path', { d: `M${tt} L${hh}`, class: 'basics-koch-edge' }));
    const mark = (id, label, cls) => {
      const l = id === 'c' ? ENTRANCE : LANDMARKS.find((x) => x.id === id), [x, y] = kochPoint(l);
      const g = svg('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, class: `basics-koch-pt ${cls}` });
      g.append(svg('circle', { r: 8 }), svg('text', { y: 3.5, 'text-anchor': 'middle' }));
      g.lastChild.textContent = id;
      const lab = svg('text', { x: 12, y: 4, class: 'basics-koch-lbl' }); lab.textContent = label;
      g.append(lab);
      kochSvg.append(g);
    };
    mark('a', t.his, 'is-his'); mark('b', t.transition, 'is-his'); mark('c', t.entrance, 'is-entrance');
  }
  function drawCatheters() {
    drawEgm(cathCanvas, sinusRecording(), { lang: L(), channels: CATHETERS[state.catheter].channels, waves: true });
  }

  // ---- 4. intervals ------------------------------------------------------------------
  const intervals = card('intervals');
  const ivRows = [['pa', 10, 90], ['ah', 30, 350], ['hv', 20, 130]].map(([id, min, max]) => {
    const input = slider(id, min, max, 1, (v) => { state[id] = v; render(); });
    const track = el('div', 'basics-track');
    const band = el('div', 'basics-band');
    const [lo, hi] = NORMAL_RANGE[id];
    band.style.left = `${((lo - min) / (max - min)) * 100}%`; band.style.width = `${((hi - lo) / (max - min)) * 100}%`;
    const warn = id === 'hv' ? [HV_LIMITS.abnormal, HV_LIMITS.high].map((v) => { const m = el('div', 'basics-mark'); m.style.left = `${((v - min) / (max - min)) * 100}%`; return m; }) : [];
    track.append(band, ...warn);
    const out = el('output', 'basics-iv-out', { 'data-basics-iv': id });
    const label = bind(el('span'), () => `${T().intervals[id]}: ${T().intervals.what[id]}`);
    const wrap = el('div', 'basics-iv');
    wrap.append(label, track, input, out);
    return [id, input, out, wrap];
  });
  const ivNote = bind(el('p', 'amap-note'), () => T().intervals.hvLimits);
  const ivCanvas = el('canvas', 'basics-canvas basics-strip', { role: 'img', 'data-basics-interval-canvas': '' });
  intervals.append(...ivRows.map((r) => r[3]), ivNote, ivCanvas);
  function renderIntervals() {
    const cls = classifyIntervals(state), t = T().intervals;
    for (const [id, input, out] of ivRows) {
      input.value = String(state[id]);
      out.textContent = `${state[id]} ms · ${t.states[cls[id]]}`;
      out.setAttribute('data-state', cls[id]);
    }
  }
  const blockRecording = (id) => {
    const c = blockCase(id, { pa: state.pa, ah: state.ah, hv: state.hv });
    return { c, recording: { id: `basics-${id}`, channels: ['ecg-ii', 'hra', 'his-d', 'rv'], windowMs: BLOCK_WINDOW_MS, events: c.events, calipers: [], markers: [] } };
  };
  function drawIntervals() { drawEgm(ivCanvas, blockRecording('normal').recording, { lang: L(), waves: true }); }

  // ---- 5. block level ----------------------------------------------------------------
  const block = card('block');
  const caseBtns = BLOCK_CASES.map((id) => button({ 'data-basics-block': id }, () => { state.block = id; render(); }));
  const blockCanvas = el('canvas', 'basics-canvas basics-strip', { role: 'img', 'data-basics-block-canvas': '' });
  const flow = svg('svg', { viewBox: '0 0 360 70', class: 'basics-svg basics-flow', role: 'img', 'data-basics-flow': '' });
  const nodes = ['a', 'h', 'hh', 'v'].map((id, i) => {
    const g = svg('g', { 'data-basics-node': id });
    g.append(svg('rect', { x: 8 + i * 90, y: 14, width: 70, height: 34, rx: 6 }), (() => { const tx = svg('text', { x: 43 + i * 90, y: 36 }); return tx; })());
    if (i) flow.append(svg('path', { d: `M${78 + (i - 1) * 90} 31 L ${8 + i * 90} 31`, class: 'basics-arrow' }));
    flow.append(g);
    return [id, g];
  });
  const levelBox = el('div', 'basics-level', { 'data-basics-level': '' });
  const levelName = el('strong'), levelText = el('span');
  levelBox.append(levelName, levelText);
  const caveat = bind(el('p', 'amap-note'), () => T().block.caveat);
  const blockSource = el('p', 'amap-source');
  const guideline = bind(el('a', '', { href: 'https://academic.oup.com/eurheartj/article/42/35/3427/6358547', target: '_blank', rel: 'noopener noreferrer' }), () => T().block.guideline);
  blockSource.append(guideline);
  const flowTitle = bind(el('p', 'amap-note'), () => T().block.flowTitle);
  block.append(row(...caseBtns), blockCanvas, flowTitle, flow, levelBox, caveat, blockSource);
  function renderBlock() {
    const t = T().block, { c } = blockRecording(state.block);
    caseBtns.forEach((b, i) => { b.textContent = t.cases[BLOCK_CASES[i]]; b.setAttribute('aria-pressed', String(state.block === BLOCK_CASES[i])); });
    const stop = c.beats.find((b) => b.stop) || null, split = c.beats.some((b) => b.split);
    const seen = { a: true, h: stop?.stop !== 'nodal', hh: split && stop?.stop !== 'intra' && stop?.stop !== 'nodal', v: !stop };
    for (const [id, g] of nodes) {
      const hidden = id === 'hh' && !split;
      g.setAttribute('class', `basics-node ${hidden ? 'is-off' : seen[id] ? 'is-seen' : 'is-missing'}`);
      g.lastChild.textContent = t.flow[id];
    }
    const [name, text] = t.levels[c.level];
    levelBox.setAttribute('data-level', c.level);
    levelName.textContent = name; levelText.textContent = ` ${text}`;
  }
  function drawBlock() { drawEgm(blockCanvas, blockRecording(state.block).recording, { lang: L(), waves: true }); }

  // ---- 6. decremental conduction -------------------------------------------------------
  const decremental = card('decremental');
  const decCanvas = el('canvas', 'basics-canvas basics-curve', { role: 'img', 'data-basics-curve-canvas': '' });
  const a1a2In = slider('a1a2', A1A2_RANGE[1], A1A2_RANGE[0], 5, (v) => { state.a1a2 = v; state.sweeping = false; render(); });
  const a1a2Out = el('output');
  const dualBtn = button({ 'data-basics-dual': '' }, () => { state.dual = !state.dual; render(); });
  const sweepBtn = button({ 'data-basics-sweep': '' }, () => { state.a1a2 = A1A2_RANGE[0]; state.sweeping = true; schedule(); render(); });
  const decChips = chips();
  const decNote = bind(el('p', 'amap-note'), () => T().decremental.jumpNote);
  decremental.append(decCanvas, field(() => T().decremental.a1a2, a1a2In, a1a2Out), row(dualBtn, sweepBtn), decChips, decNote);
  function drawCurve() {
    const c = canvasContext(decCanvas);
    if (!c) return;
    const { ctx, width, height } = c;
    const curve = ahCurve({ dual: state.dual });
    const left = 40, right = 12, top = 14, bottom = 26, w = width - left - right, h = height - top - bottom, maxAh = 460;
    const x = (v) => left + ((A1A2_RANGE[0] - v) / (A1A2_RANGE[0] - A1A2_RANGE[1] + 10)) * w, y = (v) => top + h - (Math.min(v, maxAh) / maxAh) * h;
    ctx.font = '10px ui-monospace, monospace'; ctx.fillStyle = '#9fc7b6';
    for (const v of [100, 200, 300, 400]) { line(ctx, [[left, y(v)], [left + w, y(v)]], 'rgba(159, 199, 182, 0.14)', 1); ctx.fillText(String(v), 8, y(v) + 3); }
    for (const v of [600, 500, 400, 300]) ctx.fillText(String(v), x(v) - 9, height - 8);
    ctx.fillText('AH', 8, 10);
    // The node's own refractory period and the curve (fast green, slow orange).
    line(ctx, [[x(AVN_ERP - 5), top], [x(AVN_ERP - 5), top + h]], COLORS.bad, 1, [4, 3]);
    const pts = curve.points.filter((p) => p.ah != null);
    for (let i = 1; i < pts.length; i++) line(ctx, [[x(pts[i - 1].a1a2), y(pts[i - 1].ah)], [x(pts[i].a1a2), y(pts[i].ah)]], pts[i].pathway === 'slow' ? COLORS.slow : COLORS.good, 2.2);
    if (curve.jump >= 50) {
      const at = pts.find((p) => p.a1a2 === curve.jumpAt), before = pts.find((p) => p.a1a2 === curve.jumpAt + 10);
      line(ctx, [[x(before.a1a2), y(before.ah)], [x(at.a1a2), y(at.ah)]], COLORS.bip, 2, [3, 3]);
    }
    const now = ahAt(state.a1a2, { dual: state.dual });
    if (now.ah != null) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x(state.a1a2), y(now.ah), 5, 0, Math.PI * 2); ctx.fill(); }
    else line(ctx, [[x(state.a1a2) - 5, y(20) - 5], [x(state.a1a2) + 5, y(20) + 5]], COLORS.bad, 2);
    decCanvas.setAttribute('aria-label', T().decremental.title);
  }
  function renderDecremental() {
    const t = T().decremental, now = ahAt(state.a1a2, { dual: state.dual }), curve = ahCurve({ dual: state.dual });
    a1a2In.value = String(state.a1a2); a1a2Out.textContent = `${state.a1a2} ms`;
    dualBtn.textContent = t.dual; dualBtn.setAttribute('aria-pressed', String(state.dual));
    sweepBtn.textContent = t.play;
    setChips(decChips, [
      [t.chips.ah, now.ah == null ? t.block : `${now.ah} ms`],
      [t.chips.path, now.pathway ? t.paths[now.pathway] : '-'],
      [t.chips.jump, `${curve.jump} ms`]
    ]);
  }

  // ---- shared ----------------------------------------------------------------------------
  function drawAll() { drawPoles(); drawFilters(); drawCatheters(); drawIntervals(); drawBlock(); drawCurve(); }
  function render() {
    const t = T();
    heading.textContent = t.heading; intro.textContent = t.intro; source.textContent = t.source;
    for (const [node, get] of texts) node.textContent = get();
    renderPoles(); renderFilters(); renderCatheters(); renderIntervals(); renderBlock(); renderDecremental();
    drawAll();
  }

  // Animation: the wave in card 1 and the A2 sweep in card 6.
  let frame = null, last = 0;
  const reduced = () => { try { return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches); } catch { return false; } };
  function tick(now) {
    frame = null;
    if (!state.active) return;
    const dt = Math.min(50, now - last || 16); last = now;
    if (state.playing && !reduced()) { state.phase += dt * 0.04; if (state.phase > 80) state.phase = -80; renderPoles(); drawPoles(); }
    if (state.sweeping) {
      state.a1a2 = Math.max(A1A2_RANGE[1], state.a1a2 - dt * 0.09);
      if (state.a1a2 <= A1A2_RANGE[1]) state.sweeping = false;
      state.a1a2 = Math.round(state.a1a2); renderDecremental(); drawCurve();
    }
    schedule();
  }
  function schedule() {
    if (frame != null || !state.active || typeof globalThis.requestAnimationFrame !== 'function') return;
    if ((state.playing && !reduced()) || state.sweeping) frame = globalThis.requestAnimationFrame(tick);
  }

  return {
    element: root,
    render,
    setActive(flag) {
      state.active = Boolean(flag); root.hidden = !state.active;
      if (state.active) { render(); schedule(); } else if (frame != null) { globalThis.cancelAnimationFrame?.(frame); frame = null; }
    },
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); render(); return { ...state }; },
    getState: () => ({ ...state })
  };
}
