/**
 * Cell chapter, conduction-system section: the action potentials of the SA node, atrium, AV node,
 * Purkinje fibre and ventricle on one time axis above lead II, with a shared time cursor. The
 * focused cell's membrane shows, at the cursor, which channels are open and which ions enter or
 * leave; the phase table and the "now" line tie each phase to the part of the ECG it falls on.
 * Autonomic tone and an If blocker change the SA rate, the PR and the QT (ecg-conduction-cells.js).
 */
import { CASCADE_CELLS, CHANNELS, cascadeTiming, cellAt, cellMeasures, channelsOf, currentsAt, ecgRegionAt } from './ecg-conduction-cells.js';
import { CASCADE_TEXT, CELL_FACTS, PHASES } from './ecg-cell-cascade-text.js';
import { ecgSample } from './guyton-render.js';
import { fitCanvas, el, segmented } from './ecg-paper.js';

const COLORS = Object.freeze({ sa: '#f472b6', atrial: '#fbbf24', av: '#a78bfa', purkinje: '#34d399', ventricle: '#38bdf8' });
const IONS = Object.freeze({ Na: { color: '#facc15', label: 'Na⁺' }, Ca: { color: '#4ade80', label: 'Ca²⁺' }, K: { color: '#c084fc', label: 'K⁺' } });
const PHASE_FILL = ['rgba(239,68,68,.20)', 'rgba(16,185,129,.16)', 'rgba(56,189,248,.12)', 'rgba(245,158,11,.16)', 'rgba(148,163,184,.07)'];
const SPEEDS = [0.1, 0.25, 1];
const SVG = 'http://www.w3.org/2000/svg';
const PARTICLES = 4;
const svg = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const [a, v] of Object.entries(attrs)) n.setAttribute(a, String(v)); return n; };

export function createCellCascade({ getLang = () => 'tr', state = {} } = {}) {
  const s = Object.assign(state, {
    focus: CASCADE_CELLS.includes(state.focus) ? state.focus : 'sa', tone: state.tone ?? 0, ivab: Boolean(state.ivab),
    playing: state.playing ?? true, speed: SPEEDS.includes(state.speed) ? state.speed : .25, ms: state.ms ?? 0
  });
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => CASCADE_TEXT[lang()];
  const root = el('section', 'ecgc-cascade', { 'data-cascade': '' });
  let k = timing(), raf = null, last = null, cache = null, dragging = false, shown = '';
  let membrane = null;   // { flows: [{ id, ion, dir, nodes, x }], protein: Map }

  function timing() { return cascadeTiming({ tone: s.tone / 100, ivabradine: s.ivab }); }
  function retime() { const f = s.ms / k.rr; k = timing(); s.ms = f * k.rr; cache = null; readouts(); }

  /* ----- Layout ----- */
  function render() {
    const t = T();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = t.title; const lead = el('p', 'ecgc-note ecgc-cascade-lead'); lead.textContent = t.lead; head.append(h, lead);
    const controls = el('div', 'ecgc-controls');
    const cellField = el('div', 'ecgc-field'); const cellLabel = el('span', 'ecgc-label'); cellLabel.textContent = t.cell;
    cellField.append(cellLabel, segmented('cascade-cell', CASCADE_CELLS.map(id => ({ id, label: t.cells[id] })), s.focus, focus));
    const tone = el('label', 'ecgc-range'); const toneSpan = el('span'); toneSpan.textContent = `${t.tone}: ${t.vagal} ← → ${t.sympathetic}`;
    const toneInput = el('input', '', { type: 'range', min: -100, max: 100, step: 5, value: s.tone, 'data-cascade-tone': '' }); const toneOut = el('output', '', { 'data-cascade-tone-out': '' });
    toneInput.addEventListener('input', () => { s.tone = Number(toneInput.value); toneOut.textContent = toneText(); retime(); });
    tone.append(toneSpan, toneInput, toneOut);
    const checks = el('div', 'ecgc-checks'); const ivab = el('label', 'ecgc-check'); const box = el('input', '', { type: 'checkbox', 'data-cascade-ivabradine': '' }); box.checked = s.ivab;
    box.addEventListener('change', () => { s.ivab = box.checked; retime(); }); const ivabText = el('span'); ivabText.textContent = t.ivabradine; ivab.append(box, ivabText); checks.append(ivab);
    const playField = el('div', 'ecgc-field ecgc-cascade-play');
    const play = el('button', 'ecgc-cascade-btn', { type: 'button', 'data-cascade-play': '' }); play.addEventListener('click', () => { s.playing = !s.playing; last = null; syncPlay(); });
    const speedLabel = el('span', 'ecgc-label'); speedLabel.textContent = t.speed;
    playField.append(play, speedLabel, segmented('cascade-speed', SPEEDS.map(v => ({ id: v, label: `${v}×` })), s.speed, v => { s.speed = v; render(); }));
    const time = el('label', 'ecgc-range'); const timeSpan = el('span'); timeSpan.textContent = t.time;
    const timeInput = el('input', '', { type: 'range', min: 0, max: k.rr - 1, step: 1, value: Math.round(s.ms), 'data-cascade-time': '' }); const timeOut = el('output', '', { 'data-cascade-time-out': '' });
    timeInput.addEventListener('input', () => { s.ms = Number(timeInput.value); s.playing = false; syncPlay(); });
    time.append(timeSpan, timeInput, timeOut);
    controls.append(cellField, tone, checks, playField, time);
    const table = el('div', 'ecgc-qt-table', { 'data-cascade-readouts': '' });
    const grid = el('div', 'ecgc-cascade-grid');
    const canvas = el('canvas', 'ecgc-canvas ecgc-cascade-chart', { 'data-cascade-chart': '', role: 'img', 'aria-label': t.title });
    bindChart(canvas);
    const side = el('div', 'ecgc-cascade-side');
    const stateLine = el('p', 'ecgc-cascade-state', { 'data-cascade-state': '', 'aria-live': 'polite' });
    const membraneSvg = svg('svg', { viewBox: '0 0 400 250', class: 'ecgc-membrane', 'data-cascade-membrane': '', role: 'img' });
    const legend = el('div', 'ecgc-ion-legend');
    for (const ion of Object.values(IONS)) { const i = el('span'); i.style.setProperty('--ion', ion.color); i.textContent = ion.label; legend.append(i); }
    const active = el('div', 'ecgc-cascade-active', { 'data-cascade-active': '' });
    side.append(stateLine, membraneSvg, legend, active);
    grid.append(canvas, side);
    const now = el('p', 'ecgc-explain', { 'data-cascade-now': '' });
    const phases = el('div', 'ecgc-cascade-phases', { 'data-cascade-phases': '' });
    const note = el('p', 'ecgc-note'); note.textContent = `${t.note} ${t.pump}. ${t.ncx}.`;
    root.append(head, controls, table, grid, now, phases, note);
    toneOut.textContent = toneText();
    buildMembrane(membraneSvg); phaseTable(); readouts(); syncPlay(); shown = ''; cache = null;
    if (raf == null) raf = globalThis.requestAnimationFrame?.(tick) ?? null;
  }
  function toneText() { const t = T(); return s.tone === 0 ? t.neutral : `${s.tone < 0 ? t.vagal : t.sympathetic} %${Math.abs(s.tone)}`; }
  function focus(id) { s.focus = id; root.querySelectorAll('[data-cascade-cell]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cascadeCell === id))); buildMembrane(root.querySelector('[data-cascade-membrane]')); phaseTable(); readouts(); shown = ''; cache = null; }
  function syncPlay() { const b = root.querySelector('[data-cascade-play]'); if (!b) return; b.textContent = s.playing ? `⏸ ${T().pause}` : `▶ ${T().play}`; b.setAttribute('aria-pressed', String(s.playing)); }

  function readouts() {
    const t = T(), r = t.readouts, m = cellMeasures(s.focus, k), f = CELL_FACTS[s.focus];
    const items = [[r.rate, `${k.rate}/${lang() === 'tr' ? 'dk' : 'min'}`], [r.rr, `${k.rr} ms`], [r.pr, `${k.pr} ms`], [r.qt, `${k.qt} ms`],
      [`${t.cells[s.focus]} · ${r.rest}`, `${m.rest} mV`], [r.threshold, `${m.threshold} mV`], [r.peak, `${m.peak > 0 ? '+' : ''}${m.peak} mV`], [r.apd, `${m.apd} ms`],
      [r.dvdt, f.dvdt], [r.cv, f.cv], [r.intrinsic, f.intrinsic[lang()]]];
    root.querySelector('[data-cascade-readouts]')?.replaceChildren(...items.map(([a, b]) => { const c = el('div', 'ecgc-qt-cell'); const x = el('span'); x.textContent = a; const y = el('strong'); y.textContent = b; c.append(x, y); return c; }));
    const time = root.querySelector('[data-cascade-time]'); if (time) time.max = String(k.rr - 1);
  }

  function phaseTable() {
    const t = T(), host = root.querySelector('[data-cascade-phases]'); if (!host) return;
    const table = el('table', 'ecgc-phase-table');
    const head = el('tr'); for (const c of [t.phase, t.ecg, t.enters, t.leaves, '']) { const th = el('th'); th.textContent = c; head.append(th); }
    table.append(head);
    for (const p of PHASES[lang()][s.focus]) {
      const tr = el('tr', '', { 'data-cascade-phase-row': p.phase });
      for (const c of [`${t.phase} ${p.phase}`, p.ecg, p.enters || '·', p.leaves || '·', p.text]) { const td = el('td'); td.textContent = c; tr.append(td); }
      table.append(tr);
    }
    host.replaceChildren(table);
  }

  /* ----- Membrane: channels across the bilayer, ions streaming through ----- */
  function buildMembrane(node) {
    if (!node) return;
    const t = T(), ids = channelsOf(s.focus), slot = 384 / ids.length;
    node.replaceChildren();
    node.setAttribute('aria-label', `${t.cells[s.focus]} · ${t.channels}`);
    const text = (x, y, value, cls) => { const n = svg('text', { x, y, class: cls }); n.textContent = value; node.append(n); return n; };
    node.append(svg('rect', { x: 0, y: 0, width: 400, height: 104, class: 'mb-out' }), svg('rect', { x: 0, y: 146, width: 400, height: 104, class: 'mb-in' }));
    text(8, 15, t.outside, 'mb-side'); text(8, 243, t.inside, 'mb-side');
    for (let x = 4; x < 400; x += 8) node.append(svg('circle', { cx: x, cy: 107, r: 3.2, class: 'mb-head' }), svg('circle', { cx: x, cy: 143, r: 3.2, class: 'mb-head' }));
    node.append(svg('rect', { x: 0, y: 110, width: 400, height: 30, class: 'mb-tail' }));
    const flows = [], proteins = new Map();
    ids.forEach((id, i) => {
      const cx = 8 + slot * (i + .5), g = svg('g', { 'data-cascade-ion': id });
      g.append(svg('rect', { x: cx - 10, y: 96, width: 7, height: 58, rx: 3, class: 'mb-protein' }), svg('rect', { x: cx + 3, y: 96, width: 7, height: 58, rx: 3, class: 'mb-protein' }));
      const name = svg('text', { x: cx, y: 90, class: 'mb-name', 'text-anchor': 'middle' }); name.textContent = id;
      const gene = svg('text', { x: cx, y: 168, class: 'mb-gene', 'text-anchor': 'middle' }); gene.textContent = CHANNELS[id].gene;
      g.append(name, gene); node.append(g); proteins.set(id, g);
      CHANNELS[id].flows.forEach(([ion, dir], j, all) => {
        const x = cx + (all.length > 1 ? (j ? 3 : -3) : 0);
        const arrow = svg('path', { d: dir === 'in' ? `M${x} 40 L${x} 212 M${x - 4} 204 L${x} 212 L${x + 4} 204` : `M${x} 212 L${x} 40 M${x - 4} 48 L${x} 40 L${x + 4} 48`, class: 'mb-arrow', stroke: IONS[ion].color });
        node.append(arrow);
        const nodes = Array.from({ length: PARTICLES }, () => { const c = svg('circle', { r: 3.4, fill: IONS[ion].color, class: 'mb-ion' }); node.append(c); return c; });
        flows.push({ id, ion, dir, x, arrow, nodes });
      });
    });
    membrane = { flows, proteins };
  }

  function updateMembrane(ts, levels) {
    if (!membrane) return;
    for (const [id, g] of membrane.proteins) { const l = levels.get(id) ?? 0; g.style.opacity = String(.35 + .65 * Math.min(1, l * 1.4)); g.dataset.level = l.toFixed(2); }
    for (const f of membrane.flows) {
      const l = levels.get(f.id) ?? 0, on = l > .04;
      f.arrow.style.opacity = on ? String(.15 + .5 * l) : '0';
      f.nodes.forEach((c, j) => {
        if (!on) { c.style.opacity = '0'; return; }
        const p = ((ts / 1000) * (.25 + .9 * l) + j / PARTICLES) % 1, y = f.dir === 'in' ? 36 + 176 * p : 212 - 176 * p;
        c.setAttribute('cx', f.x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
        c.style.opacity = String(Math.min(1, .25 + l) * Math.sin(Math.PI * p) ** .4);
      });
    }
  }

  /* ----- Chart: five action potentials and lead II ----- */
  function geometry(w, h) { const L = 96, R = w - 10, top = 8, B = h - 22, lane = (B - top) / 6; return { L, R, top, B, lane, x: ms => L + (ms / k.rr) * (R - L), ms: x => Math.max(0, Math.min(k.rr - 1, ((x - L) / (R - L)) * k.rr)) }; }
  function traces(w, h) {
    if (cache && cache.w === w && cache.h === h && cache.focus === s.focus) return cache;
    const g = geometry(w, h), n = Math.max(2, Math.round(g.R - g.L)), lanes = {};
    for (const cell of CASCADE_CELLS) { const mv = new Float32Array(n + 1), ph = new Uint8Array(n + 1); for (let i = 0; i <= n; i++) { const c = cellAt(cell, (i / n) * k.rr, k); mv[i] = c.mv; ph[i] = c.phase; } lanes[cell] = { mv, ph }; }
    const ecg = new Float32Array(n + 1), opts = { rate: 60000 / k.rr, pr: k.pr / 1000, qt: k.qt / 1000 };
    for (let i = 0; i <= n; i++) ecg[i] = ecgSample(((i / n) * k.rr) / 1000, opts);
    return (cache = { w, h, n, focus: s.focus, lanes, ecg });
  }
  function drawChart(canvas) {
    const fit = fitCanvas(canvas); if (!fit) return;
    const { ctx, w, h } = fit, g = geometry(w, h), c = traces(w, h), t = T();
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h);
    const yOf = (lane, mv) => g.top + lane * g.lane + 4 + (g.lane - 8) * (1 - (mv + 95) / 135);
    CASCADE_CELLS.forEach((cell, lane) => {
      const y0 = g.top + lane * g.lane, focused = cell === s.focus, { mv, ph } = c.lanes[cell];
      if (focused) {
        ctx.fillStyle = 'rgba(56,189,248,.06)'; ctx.fillRect(0, y0, w, g.lane);
        let start = 0; for (let i = 1; i <= c.n + 1; i++) if (i === c.n + 1 || ph[i] !== ph[start]) { ctx.fillStyle = PHASE_FILL[ph[start]]; ctx.fillRect(g.L + start, y0 + 2, i - start, g.lane - 4); start = i; }
      }
      ctx.strokeStyle = 'rgba(148,163,184,.12)'; ctx.beginPath(); ctx.moveTo(g.L, y0 + g.lane); ctx.lineTo(g.R, y0 + g.lane); ctx.stroke();
      ctx.fillStyle = COLORS[cell]; ctx.font = `${focused ? 700 : 600} 11px system-ui, sans-serif`; ctx.fillText(t.cells[cell], 8, y0 + g.lane / 2 + 4);
      ctx.strokeStyle = COLORS[cell]; ctx.lineWidth = focused ? 2.2 : 1.4; ctx.beginPath();
      for (let i = 0; i <= c.n; i++) { const y = yOf(lane, mv[i]); if (i) ctx.lineTo(g.L + i, y); else ctx.moveTo(g.L, y); }
      ctx.stroke();
    });
    // Lead II with the ECG parts named.
    const y0 = g.top + 5 * g.lane, base = y0 + g.lane * .68, gain = g.lane * .5, e = k.ecg;
    for (const [a, b, name] of [[e.p, e.pEnd, 'P'], [e.q, e.j, 'QRS'], [e.tStart, Math.min(e.tEnd, k.rr), 'T']]) { ctx.fillStyle = '#64748b'; ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(name, g.x((a + b) / 2), y0 + g.lane - 2); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#cbd5e1'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillText(lang() === 'tr' ? 'EKG (DII)' : 'ECG (II)', 8, base);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= c.n; i++) { const y = base - c.ecg[i] * gain; if (i) ctx.lineTo(g.L + i, y); else ctx.moveTo(g.L, y); }
    ctx.stroke();
    // Time axis and cursor.
    ctx.fillStyle = '#64748b'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
    for (let ms = 0; ms < k.rr; ms += k.rr > 1200 ? 400 : 200) ctx.fillText(String(ms), g.x(ms), h - 7);
    ctx.textAlign = 'left';
    const x = g.x(s.ms);
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x, g.top); ctx.lineTo(x, g.B); ctx.stroke(); ctx.setLineDash([]);
    CASCADE_CELLS.forEach((cell, lane) => { const v = cellAt(cell, s.ms, k).mv; ctx.fillStyle = COLORS[cell]; ctx.beginPath(); ctx.arc(x, yOf(lane, v), cell === s.focus ? 4.5 : 3, 0, Math.PI * 2); ctx.fill(); });
  }
  function bindChart(canvas) {
    const at = e => { const r = canvas.getBoundingClientRect(), g = geometry(r.width, r.height); return { ms: g.ms(e.clientX - r.left), lane: Math.floor((e.clientY - r.top - g.top) / g.lane) }; };
    canvas.addEventListener('pointerdown', e => {
      const p = at(e); dragging = true; canvas.setPointerCapture?.(e.pointerId); s.ms = p.ms; s.playing = false; syncPlay();
      if (p.lane >= 0 && p.lane < CASCADE_CELLS.length && CASCADE_CELLS[p.lane] !== s.focus) focus(CASCADE_CELLS[p.lane]);
    });
    canvas.addEventListener('pointermove', e => { if (dragging) s.ms = at(e).ms; });
    const stop = () => { dragging = false; };
    canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  }

  /* ----- Live texts: only when the moment changes ----- */
  function texts(currents) {
    const t = T(), cur = cellAt(s.focus, s.ms, k), region = ecgRegionAt(s.ms, k);
    const phases = CASCADE_CELLS.map(c => `${t.cells[c]} ${t.phase.toLowerCase()} ${cellAt(c, s.ms, k).phase}`).join(' · ');
    const key = `${lang()}|${s.focus}|${cur.phase}|${region}|${phases}`;
    const stateLine = root.querySelector('[data-cascade-state]');
    if (stateLine) stateLine.textContent = `${t.cells[s.focus]} · ${t.phase} ${cur.phase} · ${Math.round(cur.mv)} mV`;
    if (key === shown) return;
    shown = key;
    const now = root.querySelector('[data-cascade-now]');
    if (now) { now.textContent = `${t.now}: ${t.regions[region]}. ${phases}.`; now.dataset.region = region; }
    root.querySelectorAll('[data-cascade-phase-row]').forEach(r => r.toggleAttribute('data-active', Number(r.dataset.cascadePhaseRow) === cur.phase));
    const active = root.querySelector('[data-cascade-active]');
    if (active) active.replaceChildren(...currents.filter(c => c.level > .1).slice(0, 5).map(c => {
      const chip = el('span', 'ecgc-ion-chip', { 'data-cascade-current': c.id });
      chip.style.setProperty('--ion', IONS[c.flows[0][0]].color);
      chip.textContent = `${c.id} (${c.gene}): ${c.flows.map(([ion, dir]) => `${IONS[ion].label} ${dir === 'in' ? t.into : t.out}`).join(', ')}`;
      return chip;
    }));
  }

  function tick(ts) {
    raf = null;
    if (!root.isConnected) { last = null; raf = globalThis.requestAnimationFrame?.(tick) ?? null; return; }
    if (s.playing && last != null) s.ms = (s.ms + (ts - last) * s.speed) % k.rr;
    last = ts;
    const currents = currentsAt(s.focus, s.ms, k);
    drawChart(root.querySelector('[data-cascade-chart]'));
    updateMembrane(ts, new Map(currents.map(c => [c.id, c.level])));
    texts(currents);
    const time = root.querySelector('[data-cascade-time]'), out = root.querySelector('[data-cascade-time-out]');
    if (time && document.activeElement !== time) time.value = String(Math.round(s.ms));
    if (out) out.textContent = `${Math.round(s.ms)} ms`;
    raf = globalThis.requestAnimationFrame?.(tick) ?? null;
  }

  render();
  return {
    element: root, render,
    getState: () => ({ ms: s.ms, focus: s.focus, playing: s.playing, timing: k, phase: cellAt(s.focus, s.ms, k).phase, region: ecgRegionAt(s.ms, k), currents: currentsAt(s.focus, s.ms, k) }),
    destroy() { if (raf != null) globalThis.cancelAnimationFrame?.(raf); raf = null; root.remove(); }
  };
}
