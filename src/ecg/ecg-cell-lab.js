/**
 * Chapter lab "Cell". First the conduction system (ecg-cell-cascade.js): SA node, atrium, AV node,
 * Purkinje and ventricle on one time axis with lead II and the ions of each phase. Then the
 * ventricular action potential of one cell (ecg-cell-model.js). Choose the
 * cell (endocardial, M, epicardial), the pacing cycle length and two drug-like scales; read the
 * resting and peak voltage, upstroke velocity, APD50/APD90 and the diastolic interval; see the
 * restitution curve and where the QRS, ST segment and T wave fall on the action potential.
 */
import { paceCell, restitution } from './ecg-cell-model.js';
import { recordElectrodes, trueLeads, INTERVALS } from './ecg-recording-model.js';
import { fitCanvas, chartFrame, polyline, el, segmented } from './ecg-paper.js';
import { createCellCascade } from './ecg-cell-cascade.js';

const TEXT = {
  tr: {
    title: 'Hücre: ventrikül aksiyon potansiyeli', cell: 'Hücre', cells: { endo: 'Endokardiyal', mid: 'Midmiyokardiyal (M)', epi: 'Epikardiyal' },
    cl: 'Pacing siklus uzunluğu', fi: 'Hızlı içe akım (sodyum benzeri)', so: 'Yavaş dışa akım (potasyum benzeri)',
    rest: 'Dinlenim potansiyeli', peak: 'Tepe', dvdt: 'Maks. çıkış hızı (dV/dt)', apd50: 'APD50', apd90: 'APD90', di: 'Diyastolik aralık',
    phases: ['Faz 0', 'Faz 1', 'Faz 2', 'Faz 3', 'Faz 4'], ref: 'gri: aynı hücre, ilaçsız', restit: 'Restitüsyon: APD90 ve siklus uzunluğu',
    ecg: 'Aynı zaman ekseninde EKG (II)', qrs: 'QRS: faz 0', st: 'ST: plato', t: 'T: faz 3',
    currents: 'Akımlar (modelin üç toplu akımı)', jfi: 'hızlı içe', jsi: 'yavaş içe', jso: 'yavaş dışa', noCapture: 'Uyarı yanıtsız: hızlı içe akım çok düşük.',
    explain: m => `${m.cell}: dinlenimde ${m.rest} mV, ${m.dvdt} V/s ile ${m.peak} mV'a çıkar${m.notch != null ? `, ${m.notch} mV'da çentik yapar` : ''}; %90 repolarizasyon çıkıştan ${m.apd90} ms sonra.`,
    note: 'Bueno-Orovio, Cherry ve Fenton (2008) minimal insan ventrikül modeli; özgün uygulama. Akımlar fenomenolojik gruplardır: model tek tek kanalları ayırmaz (örneğin IKr ayrı değildir).'
  },
  en: {
    title: 'Cell: the ventricular action potential', cell: 'Cell', cells: { endo: 'Endocardial', mid: 'Midmyocardial (M)', epi: 'Epicardial' },
    cl: 'Pacing cycle length', fi: 'Fast inward current (sodium-like)', so: 'Slow outward current (potassium-like)',
    rest: 'Resting potential', peak: 'Peak', dvdt: 'Max upstroke (dV/dt)', apd50: 'APD50', apd90: 'APD90', di: 'Diastolic interval',
    phases: ['Phase 0', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'], ref: 'grey: same cell, drug-free', restit: 'Restitution: APD90 against cycle length',
    ecg: 'The ECG on the same time axis (II)', qrs: 'QRS: phase 0', st: 'ST: plateau', t: 'T: phase 3',
    currents: 'Currents (the model\'s three lumped currents)', jfi: 'fast inward', jsi: 'slow inward', jso: 'slow outward', noCapture: 'No response: fast inward current too low.',
    explain: m => `${m.cell}: rests at ${m.rest} mV, rises at ${m.dvdt} V/s to ${m.peak} mV${m.notch != null ? `, notches at ${m.notch} mV` : ''}; 90% repolarized ${m.apd90} ms after the upstroke.`,
    note: 'Minimal human ventricular model of Bueno-Orovio, Cherry and Fenton (2008); original implementation. Currents are phenomenological groups: the model does not single out channels (IKr is not separate, for example).'
  }
};
const LIMITS = Object.freeze({ cl: [300, 2000], fi: [25, 100], so: [50, 100] });
const CELL_COLORS = Object.freeze({ endo: '#38bdf8', mid: '#f59e0b', epi: '#34d399' });

export function createCellLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { cell: state.cell || 'epi', cl: state.cl || 1000, fi: state.fi ?? 100, so: state.so ?? 100 });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'cell' });
  // The conduction-system section stays mounted; only the ventricular part below is rebuilt.
  const cascade = createCellCascade({ getLang, state: s.cascade ||= {} });
  const vent = el('div', 'ecgc-vent', { 'data-cell-ventricle': '' });
  root.append(cascade.element, vent);
  let frame = null, beat = null, ref = null, curve = null, ecg = null;

  function compute() {
    beat = paceCell({ cell: s.cell, cycleLength: s.cl, fastInward: s.fi / 100, slowOutward: s.so / 100 });
    ref = paceCell({ cell: s.cell, cycleLength: s.cl });
    curve = restitution({ cell: s.cell, fastInward: s.fi / 100, slowOutward: s.so / 100 });
    const rec = recordElectrodes({ seconds: 2.4, hr: 60 });
    ecg = trueLeads(rec.electrodes).II;
  }
  const range = (key, label, [lo, hi], step, unit) => {
    const wrap = el('label', 'ecgc-range'); const span = el('span'); const out = el('output');
    const input = el('input', '', { type: 'range', min: lo, max: hi, step, value: s[key], [`data-cell-${key}`]: '' });
    input.addEventListener('input', () => { s[key] = Number(input.value); out.textContent = `${s[key]} ${unit}`; schedule(); });
    span.textContent = label; out.textContent = `${s[key]} ${unit}`; wrap.append(span, input, out); return wrap;
  };

  function build() {
    const T = t();
    vent.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    const cellField = el('div', 'ecgc-field'); const cellLabel = el('span', 'ecgc-label'); cellLabel.textContent = T.cell;
    cellField.append(cellLabel, segmented('cell', ['endo', 'mid', 'epi'].map(id => ({ id, label: T.cells[id] })), s.cell, id => { s.cell = id; build(); }));
    controls.append(cellField, range('cl', T.cl, LIMITS.cl, 50, 'ms'), range('fi', T.fi, LIMITS.fi, 5, '%'), range('so', T.so, LIMITS.so, 5, '%'));
    const readouts = el('div', 'ecgc-qt-table', { 'data-cell-readouts': '' });
    const explain = el('p', 'ecgc-explain', { 'data-cell-explain': '', 'aria-live': 'polite' });
    const grid = el('div', 'ecgc-grid');
    const ap = el('canvas', 'ecgc-canvas ecgc-tall', { 'data-cell-ap': '', role: 'img', 'aria-label': T.title });
    const side = el('div', 'ecgc-stack');
    const rest = el('canvas', 'ecgc-canvas', { 'data-cell-restitution': '', role: 'img', 'aria-label': T.restit });
    const cur = el('canvas', 'ecgc-canvas ecgc-short', { 'data-cell-currents': '', role: 'img', 'aria-label': T.currents });
    side.append(rest, cur); grid.append(ap, side);
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    vent.append(head, controls, readouts, explain, grid, note);
    compute(); draw();
  }

  function draw() {
    frame = null;
    const T = t(), m = beat.measures;
    const items = [[T.rest, `${m.rest} mV`], [T.peak, `${m.peak} mV`], [T.dvdt, `${m.maxDvdt} V/s`], [T.apd50, m.apd50 == null ? '·' : `${m.apd50} ms`], [T.apd90, m.apd90 == null ? '·' : `${m.apd90} ms`], [T.di, m.di == null ? '·' : `${m.di} ms`]];
    root.querySelector('[data-cell-readouts]').replaceChildren(...items.map(([k, v]) => { const c = el('div', 'ecgc-qt-cell'); const a = el('span'); a.textContent = k; const b = el('strong'); b.textContent = v; c.append(a, b); return c; }));
    root.querySelector('[data-cell-explain]').textContent = m.captured ? T.explain({ ...m, cell: T.cells[s.cell], dvdt: m.maxDvdt }) : T.noCapture;
    drawAp(root.querySelector('[data-cell-ap]'), T);
    drawRestitution(root.querySelector('[data-cell-restitution]'), T);
    drawCurrents(root.querySelector('[data-cell-currents]'), T);
  }

  function drawAp(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, span = Math.min(700, s.cl);
    const ecgH = h * .3;
    // Upper strip: lead II, its QRS onset placed on the upstroke.
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h);
    const L = 46, R = w - 12, px = ms => L + (ms / span) * (R - L);
    const shift = INTERVALS.qrsOnset - 6;   // ECG ms at the upstroke
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let ms = 0; ms <= span; ms += 2) { const v = ecg[Math.round(1000 + shift + ms)] ?? 0; const y = 14 + ecgH * .55 - v * ecgH * .45; if (ms) ctx.lineTo(px(ms), y); else ctx.moveTo(px(ms), y); }
    ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(T.ecg, L, 11);
    // Lower: the action potential.
    const f = chartFrame(ctx, w, h, { x: [0, span], y: [-95, 60], pad: { l: L, r: 12, t: ecgH + 18, b: 26 }, xTicks: [0, 100, 200, 300, 400, 500, 600, 700].filter(x => x <= span), yTicks: [-80, -40, 0, 40], xLabel: 'ms', yLabel: 'mV' });
    // Restore the ECG strip that chartFrame painted over.
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let ms = 0; ms <= span; ms += 2) { const v = ecg[Math.round(1000 + shift + ms)] ?? 0; const y = 14 + ecgH * .55 - v * ecgH * .45; if (ms) ctx.lineTo(px(ms), y); else ctx.moveTo(px(ms), y); }
    ctx.stroke(); ctx.fillStyle = '#94a3b8'; ctx.fillText(T.ecg, L, 11);
    const m = beat.measures;
    if (m.captured && m.apd90) {   // phase bands
      const peakT = beat.t[beat.mv.indexOf(Math.max(...beat.mv))];
      // Phase 3 starts where the plateau gives way (well before APD50) and ends near APD90.
      const p1 = peakT + (m.notch != null ? 25 : 8), p3 = Math.max(p1 + 20, m.apd50 - .6 * (m.apd90 - m.apd50) - 20);
      const bands = [[0, peakT, 0], [peakT, p1, 1], [p1, p3, 2], [p3, m.apd90 + 10, 3], [m.apd90 + 10, span, 4]];
      const colors = ['rgba(239,68,68,.16)', 'rgba(16,185,129,.14)', 'rgba(56,189,248,.10)', 'rgba(245,158,11,.14)', 'rgba(148,163,184,.06)'];
      for (const [a, b, i] of bands) { if (b <= a) continue; ctx.fillStyle = colors[i]; ctx.fillRect(f.px(a), f.T, f.px(Math.min(b, span)) - f.px(a), f.B - f.T); ctx.fillStyle = '#cbd5e1'; ctx.font = '600 10px system-ui, sans-serif'; if (f.px(Math.min(b, span)) - f.px(a) > 34) ctx.fillText(T.phases[i], f.px(a) + 3, f.T + 12); }
    }
    polyline(ctx, ref.t.filter(x => x <= span).map((x, i) => [f.px(x), f.py(ref.mv[i])]), 'rgba(203,213,225,.35)', 1.4, [4, 3]);
    polyline(ctx, beat.t.filter(x => x <= span).map((x, i) => [f.px(x), f.py(beat.mv[i])]), CELL_COLORS[s.cell], 2.2);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(T.ref, f.R - ctx.measureText(T.ref).width - 4, f.T + 24);
  }

  function drawRestitution(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, pts = curve.filter(p => p.captured && p.apd90 != null);
    const ys = pts.map(p => p.apd90), lo = Math.floor((Math.min(...ys, 200) - 20) / 50) * 50, hi = Math.ceil((Math.max(...ys, 300) + 20) / 50) * 50;
    const f = chartFrame(ctx, w, h, { x: [250, 2050], y: [lo, hi], xTicks: [500, 1000, 1500, 2000], yTicks: [lo, (lo + hi) / 2, hi].map(Math.round), xLabel: `${T.cl} (ms)`, yLabel: 'APD90 (ms)' });
    ctx.fillStyle = '#cbd5e1'; ctx.font = '600 10px system-ui, sans-serif'; ctx.fillText(T.restit, f.L + 4, f.T + 10);
    polyline(ctx, pts.map(p => [f.px(p.cycleLength), f.py(p.apd90)]), CELL_COLORS[s.cell], 2);
    for (const p of pts) { ctx.fillStyle = CELL_COLORS[s.cell]; ctx.beginPath(); ctx.arc(f.px(p.cycleLength), f.py(p.apd90), 2.5, 0, Math.PI * 2); ctx.fill(); }
    if (beat.measures.apd90) { ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(f.px(s.cl), f.py(beat.measures.apd90), 5, 0, Math.PI * 2); ctx.fill(); }
  }

  function drawCurrents(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, span = Math.min(700, s.cl), c = beat.currents;
    const f = chartFrame(ctx, w, h, { x: [0, span], y: [-1, 1], pad: { l: 46, r: 12, t: 14, b: 22 }, xTicks: [0, 200, 400, 600].filter(x => x <= span), yTicks: [] });
    const sq = v => Math.sign(v) * Math.min(1, Math.sqrt(Math.abs(v)) / 3.2);   // compress: the fast current is huge and brief
    const series = [['fi', '#ef4444', T.jfi], ['si', '#f59e0b', T.jsi], ['so', '#10b981', T.jso]];
    series.forEach(([key, color, name], i) => {
      polyline(ctx, beat.t.filter(x => x <= span).map((x, j) => [f.px(x), f.py(-sq(c[key][j]))]), color, 1.4);
      ctx.fillStyle = color; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(name, f.R - 74, f.B - 6 - (2 - i) * 11);
    });
    ctx.fillStyle = '#cbd5e1'; ctx.font = '600 10px system-ui, sans-serif'; ctx.fillText(T.currents, f.L + 4, f.T + 10);
  }

  function schedule() { if (frame == null) frame = globalThis.requestAnimationFrame?.(() => { compute(); draw(); }) ?? (compute(), draw(), null); }
  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: () => { cascade.render(); build(); }, getCascade: () => cascade.getState(), getBeat: () => beat, getCurve: () => curve, destroy() { cascade.destroy(); globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
