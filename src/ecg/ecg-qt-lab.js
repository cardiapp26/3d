/**
 * Chapter lab "QT": measuring the QT and correcting it for rate (ecg-recording-model.js).
 * The patient has a QT at 60/min; the heart rate changes the measured QT along a log-linear
 * relation, and each formula corrects it differently. The lead and the method decide where the
 * T wave ends (a U wave fools the threshold method). Thresholds follow the sex of the patient.
 */
import { recordElectrodes, trueLeads, beatForQt, qtOfLead, qtAtRate, QT_FORMULAS, QTC_LIMITS, gradeQtc, INTERVALS } from './ecg-recording-model.js';
import { fitCanvas, drawPaper, drawTrace, label, chartFrame, polyline, el, segmented, PAPER } from './ecg-paper.js';

const TEXT = {
  tr: {
    title: 'QT aralığı: ölçüm ve hız düzeltmesi', hr: 'Kalp hızı', qt60: 'Hastanın 60/dk QT’si', sex: 'Cinsiyet', sexes: { male: 'Erkek', female: 'Kadın' },
    lead: 'Derivasyon', method: 'T sonu yöntemi', methods: { tangent: 'Tanjant', threshold: 'Eşik (0,02 mV)' }, u: 'U dalgası',
    formulas: { bazett: 'Bazett', fridericia: 'Fridericia', framingham: 'Framingham', hodges: 'Hodges' },
    measured: 'Ölçülen QT', rr: 'RR', grade: { normal: 'normal', long: 'uzun', high: 'yüksek risk (≥ 500)' },
    beat: 'Tek atım · 50 mm/s · 10 mm/mV', plot: 'QTc ve kalp hızı: aynı hastada her formül', truth: 'gerçek (60/dk QT)',
    explain: (b, f, hr) => `${hr}/dk'da Bazett ${b} ms, Fridericia ${f} ms. 60/dk'da her formül QT’yi değiştirmez; hız arttıkça Bazett fazla, yavaşladıkça eksik düzeltir.`,
    note: 'QTc ≥ 450 ms (erkek), ≥ 460 ms (kadın) uzundur; > 500 ms yüksek risklidir. Torsade riski olan bir ilaçta QTc > 500 ms ya da ≥ 60 ms artış hızlı müdahale gerektirir (AHA/ACCF/HRS 2009, ESC 2022). QT’yi en uzun olduğu derivasyonda (çoğu zaman V2–V3) ölç; U dalgası varsa tanjant yöntemi kullan. Öğretim modeli.'
  },
  en: {
    title: 'The QT interval: measuring it and correcting for rate', hr: 'Heart rate', qt60: 'Patient’s QT at 60/min', sex: 'Sex', sexes: { male: 'Male', female: 'Female' },
    lead: 'Lead', method: 'End-of-T method', methods: { tangent: 'Tangent', threshold: 'Threshold (0.02 mV)' }, u: 'U wave',
    formulas: { bazett: 'Bazett', fridericia: 'Fridericia', framingham: 'Framingham', hodges: 'Hodges' },
    measured: 'Measured QT', rr: 'RR', grade: { normal: 'normal', long: 'prolonged', high: 'high risk (≥ 500)' },
    beat: 'One beat · 50 mm/s · 10 mm/mV', plot: 'QTc against heart rate: every formula on the same patient', truth: 'true (QT at 60/min)',
    explain: (b, f, hr) => `At ${hr}/min Bazett gives ${b} ms, Fridericia ${f} ms. At 60/min no formula changes the QT; faster, Bazett over-corrects, slower, it under-corrects.`,
    note: 'A QTc of 450 ms or more (men) or 460 ms or more (women) is prolonged; above 500 ms is high risk. On a drug that can cause torsade, a QTc above 500 ms or a rise of 60 ms or more calls for prompt action (AHA/ACCF/HRS 2009, ESC 2022). Measure the QT where it is longest (usually V2-V3); with a U wave, use the tangent method. Teaching model.'
  }
};
const FORMULA_COLORS = Object.freeze({ bazett: '#f87171', fridericia: '#34d399', framingham: '#60a5fa', hodges: '#fbbf24' });
const LEAD_CHOICES = Object.freeze(['II', 'V2', 'V3', 'V5']);

export function createQtLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { hr: state.hr || 72, qt60: state.qt60 || 410, sex: state.sex || 'male', lead: state.lead || 'II', method: state.method || 'tangent', u: Boolean(state.u) });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'qt' });
  let frame = null, leads = null, rr = 1000, qt = null, measured = null;

  function compute() {
    qt = qtAtRate(s.qt60, s.hr);
    const { beat, uWave } = beatForQt(qt);
    const rec = recordElectrodes({ seconds: 4, hr: s.hr, beat: s.u ? [...beat, uWave] : beat });
    rr = rec.rr; leads = trueLeads(rec.electrodes);
    measured = qtOfLead(leads[s.lead], rr * 2, rr);
  }
  /** QTc by each formula from the QT the chosen method measured. */
  function corrected() {
    const q = measured?.[s.method];
    return Object.fromEntries(Object.keys(QT_FORMULAS).map(k => [k, q == null ? null : Math.round(QT_FORMULAS[k](q, rr))]));
  }
  const range = (key, label, lo, hi, step, unit) => {
    const wrap = el('label', 'ecgc-range'); const span = el('span'); const out = el('output');
    const input = el('input', '', { type: 'range', min: lo, max: hi, step, value: s[key], [`data-qt-${key}`]: '' });
    input.addEventListener('input', () => { s[key] = Number(input.value); out.textContent = `${s[key]} ${unit}`; update(); });
    span.textContent = label; out.textContent = `${s[key]} ${unit}`; wrap.append(span, input, out); return wrap;
  };
  const field = (title, node) => { const f = el('div', 'ecgc-field'); const sp = el('span', 'ecgc-label'); sp.textContent = title; f.append(sp, node); return f; };

  function build() {
    const T = t();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    const pick = key => v => { s[key] = v; build(); };
    const uBox = el('label', 'ecgc-check'); const ui = el('input', '', { type: 'checkbox', 'data-qt-u': '' }); ui.checked = s.u;
    ui.addEventListener('change', () => { s.u = ui.checked; update(); }); const us = el('span'); us.textContent = T.u; uBox.append(ui, us);
    controls.append(
      range('hr', T.hr, 40, 150, 5, '/min'), range('qt60', T.qt60, 360, 520, 5, 'ms'),
      field(T.sex, segmented('sex', ['male', 'female'].map(id => ({ id, label: T.sexes[id] })), s.sex, pick('sex'))),
      field(T.lead, segmented('lead', LEAD_CHOICES.map(id => ({ id, label: id })), s.lead, pick('lead'))),
      field(T.method, segmented('method', ['tangent', 'threshold'].map(id => ({ id, label: T.methods[id] })), s.method, pick('method'))),
      field('', uBox)
    );
    const table = el('div', 'ecgc-qt-table', { 'data-qt-table': '' });
    const explain = el('p', 'ecgc-explain', { 'data-qt-explain': '', 'aria-live': 'polite' });
    const grid = el('div', 'ecgc-grid');
    const beat = el('canvas', 'ecgc-canvas ecgc-tall', { 'data-qt-beat': '', role: 'img', 'aria-label': T.beat });
    const plot = el('canvas', 'ecgc-canvas ecgc-tall', { 'data-qt-plot': '', role: 'img', 'aria-label': T.plot });
    grid.append(beat, plot);
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(head, controls, table, explain, grid, note);
    update();
  }

  function update() { compute(); if (frame == null) frame = globalThis.requestAnimationFrame?.(draw) ?? (draw(), null); }

  function draw() {
    frame = null;
    const T = t(), qtc = corrected(), q = measured?.[s.method];
    const cells = [[T.measured, q == null ? '·' : `${q} ms`, ''], [T.rr, `${Math.round(rr)} ms`, '']];
    for (const k of Object.keys(QT_FORMULAS)) { const v = qtc[k]; const g = v == null ? '' : gradeQtc(v, s.sex); cells.push([`QTc ${T.formulas[k]}`, v == null ? '·' : `${v} ms`, g]); }
    root.querySelector('[data-qt-table]').replaceChildren(...cells.map(([k, v, g]) => {
      const c = el('div', 'ecgc-qt-cell', g ? { 'data-grade': g } : {}); const a = el('span'); a.textContent = k; const b = el('strong'); b.textContent = v;
      c.append(a, b); if (g) { const badge = el('em'); badge.textContent = T.grade[g]; c.append(badge); } return c;
    }));
    root.querySelector('[data-qt-explain]').textContent = T.explain(qtc.bazett ?? '·', qtc.fridericia ?? '·', s.hr);
    drawBeat(root.querySelector('[data-qt-beat]'), T);
    drawPlot(root.querySelector('[data-qt-plot]'), T);
  }

  function drawBeat(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, span = Math.min(rr + 120, 900);
    const pxPerMm = Math.min(w / (span * 50 / 1000 + 4), h / 30);
    drawPaper(ctx, w, h, pxPerMm);
    const start = rr * 2 + INTERVALS.pOnset - 20, y = h * .6, x = 8, opts = { pxPerMm, speed: 50, gain: 10 };
    const off = leads[s.lead][Math.round(rr * 2 + INTERVALS.qrsOnset - 15)];
    drawTrace(ctx, leads[s.lead], start, span, x, y, { ...opts, offset: off });
    const pxMs = ms => x + (ms - (INTERVALS.pOnset - 20)) * 50 / 1000 * pxPerMm;
    const mark = (ms, color, text, row) => { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(pxMs(ms), 18); ctx.lineTo(pxMs(ms), h - 10); ctx.stroke(); ctx.setLineDash([]); label(ctx, text, pxMs(ms) + 3, 28 + row * 12, { color }); };
    mark(INTERVALS.qrsOnset, '#1d4ed8', 'Q', 0);
    if (measured.tangent != null) mark(INTERVALS.qrsOnset + measured.tangent, s.method === 'tangent' ? '#b91c1c' : 'rgba(185,28,28,.4)', `${T.methods.tangent} ${measured.tangent}`, 1);
    if (measured.threshold != null) mark(INTERVALS.qrsOnset + measured.threshold, s.method === 'threshold' ? '#7c2d12' : 'rgba(124,45,18,.4)', `${T.methods.threshold} ${measured.threshold}`, 2);
    label(ctx, `${s.lead} · ${T.beat}`, w - 6, 13, { align: 'right' });
  }

  function drawPlot(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k;
    const f = chartFrame(ctx, w, h, { x: [40, 150], y: [340, 560], xTicks: [40, 60, 80, 100, 120, 140], yTicks: [350, 400, 450, 500, 550], xLabel: `${T.hr} (/min)`, yLabel: 'QTc (ms)' });
    const limit = s.sex === 'female' ? QTC_LIMITS.female : QTC_LIMITS.male;
    for (const [y, color] of [[limit, 'rgba(251,191,36,.6)'], [QTC_LIMITS.high, 'rgba(248,113,113,.7)']]) polyline(ctx, [[f.L, f.py(y)], [f.R, f.py(y)]], color, 1, [5, 4]);
    polyline(ctx, [[f.L, f.py(s.qt60)], [f.R, f.py(s.qt60)]], 'rgba(226,232,240,.75)', 1.4);
    label(ctx, T.truth, f.L + 4, f.py(s.qt60) - 4, { color: '#e2e8f0', font: '10px system-ui, sans-serif' });
    Object.keys(QT_FORMULAS).forEach((key, i) => {
      const pts = [];
      for (let hr = 40; hr <= 150; hr += 2) { const r = 60000 / hr; pts.push([f.px(hr), f.py(QT_FORMULAS[key](qtAtRate(s.qt60, hr), r))]); }
      polyline(ctx, pts, FORMULA_COLORS[key], 2);
      label(ctx, T.formulas[key], f.R - 74, f.B - 8 - (3 - i) * 12, { color: FORMULA_COLORS[key], font: '600 10px system-ui, sans-serif' });
    });
    polyline(ctx, [[f.px(s.hr), f.T], [f.px(s.hr), f.B]], 'rgba(148,163,184,.6)', 1, [2, 3]);
    label(ctx, T.plot, f.L + 4, f.T + 10, { color: '#cbd5e1', font: '600 10px system-ui, sans-serif' });
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: build, getMeasured: () => ({ ...measured, rr, qtc: corrected() }), destroy() { globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
