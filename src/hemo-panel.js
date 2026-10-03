// Hemodynamics lesson panel: multi-channel pressure tracing on real time over
// several beats, key metrics and editable calculators. Built on the shared
// cardiac clock (cardiac-cycle.js) and the hemodynamics model; the tracings
// are teaching caricatures of textbook recordings, not patient data.

import './hemo-panel.css';
import { STATIONS, STATION_INFO } from './hemodynamics.js';
import { CYCLE_SYNC as S, phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';
import { createCalculators, fmt, metricRows } from './hemo-panel-calculators.js';
import { samplePvLoop, drawPvLoop } from './hemo-pv-loop.js';
import { PV_PRESETS, PV_LIMITS, pvParams, pvModelLoop } from './hemo-pv-model.js';

const TEXT = {
  tr: {
    scenario: 'Senaryo', presets: 'Hazır:', beats: 'Atım', resp: 'Solunum', pvc: 'Ekstrasistol (PVC)',
    postPvc: 'PVC sonrası', insp: 'insp.', noChannel: 'Kanal seçin', metrics: 'Ölçümler', pvMetrics: 'Model ölçümleri', pvMetric: { edv: 'EDV (ml)', esv: 'ESV (ml)', sv: 'Toplam SV (ml)', fsv: 'İleri SV (ml)', rgv: 'Regürjitan hacim (ml)', ef: 'EF (%)', esp: 'Sistol sonu basınç (mmHg)', peak: 'LV tepe basınç (mmHg)', edp: 'EDP (mmHg)', ees: 'Ees (mmHg/ml)', ea: 'Ea (mmHg/ml)', coupling: 'Ea/Ees', sw: 'Atım işi (mmHg·ml)' }, pvLoop: 'P-V döngüsü', pvSource: 'Döngü kaynağı', pvFromScenario: 'Kateter senaryosu', pvModel: 'Etkileşimli model', pvCondition: 'Durum', pvEdv: 'Ön yük (EDV, ml)', pvEes: 'Kontraktilite (Ees, mmHg/ml)', pvEa: 'Ard yük (Ea, mmHg/ml)', pvStiff: 'Diyastolik sertlik (EDPVR)', pvGhost: 'Kesikli gri: normal döngü', pvReset: 'Duruma dön', pvNote: 'Öğretim modeli: zaman-değişken elastans (Suga-Sagawa); ESV = (Ees·V0 + Ea·EDV)/(Ees + Ea). Hazır durumlar ders kitabı döngü şekillerini veren parametrelerdir, hasta verisi değildir. Model kateter senaryosundan bağımsızdır: senaryo menüsü modeli değiştirmez ve bu sekmedeki ölçümler modelin kendi değerleridir. Diyastolik sertlik kaydırıcısı, durumun başvuru hacmindeki doluş basıncını orantılı olarak değiştirir. Döngü kalp hızından bağımsızdır.', pvConditions: { normal: 'Normal', 'hfref-decompensated': 'Dekompanse KY (HFrEF)', hfpef: 'HFpEF (diyastolik)', 'aortic-stenosis': 'Aort darlığı', 'aortic-regurgitation': 'Aort yetersizliği (kronik)', 'mitral-regurgitation-acute': 'Mitral yetersizliği (akut)', hypovolemia: 'Hipovolemi', inotrope: 'İnotrop (dobutamin)' }, pvExplain: { normal: 'EF ~%55; Ea/Ees ~0,6-1 ile ventrikül-arter eşleşmesi verimli.', 'hfref-decompensated': 'ESPVR eğimi düşmüş (kontraktilite azalmış), döngü sağa kaymış ve daralmış: EDV ve EDP yüksek, SV ve EF düşük. Ea/Ees çok yüksek: eşleşme bozuk; ard yük azaltma SV\'yi artırır.', hfpef: 'EDPVR dikleşmiş: normal döngüden küçük ya da ona yakın bir EDV için EDP yüksek (110 ml için 25 mmHg); EF korunmuş, döngü dar ve yukarıda.', 'aortic-stenosis': 'Ard yük ve LV-aort gradyanı LV sistolik basıncını yükseltir: uzun, yüksek döngü; hipertrofi ile EDPVR dikleşir.', 'aortic-regurgitation': 'Hacim yükü: döngü geniş ve sağda; diyastolde aorttan geri dolum gerçek izovolümik gevşemeyi ortadan kaldırır (sol kenar eğik).', 'mitral-regurgitation-acute': 'Düşük empedanslı LA\'ya erken boşalım: gerçek izovolümik kasılma yok (sağ kenar eğik), ESV küçük, toplam SV büyük ama ileri akım azalmış (grafik başlığında toplam ve ileri SV ayrı yazılır); EDP yüksek.', hypovolemia: 'Ön yük düşük: döngü EDPVR boyunca sola kayar, SV azalır; ESPVR değişmez.', inotrope: 'ESPVR dikleşir: ESV küçülür, SV ve EF artar.' }, pressureTab: 'Basınç eğrileri', viewTabs: 'Hemodinamik görünüm', pvCanvas: 'Sol ventrikül basınç-hacim döngüsü (şematik)',
    gradAo: 'LV−Ao ort. gradyan', gradMi: 'LV−PCWP ort. gradyan', canvas: 'Eşzamanlı basınç traseleri ve EKG',
    badge: sc => `KH ${sc.hr}/dk · KD ${fmt(sc.co)} L/dk`,
    presetTitles: ['Aort darlığı: LV-Ao gradyanı', 'Mitral darlık: diyastolik gradyan', 'Sağ kalp: RA ve RV', 'Pulmoner arter ve kama basıncı']
  },
  en: {
    scenario: 'Scenario', presets: 'Presets:', beats: 'Beats', resp: 'Respiration', pvc: 'PVC beat',
    postPvc: 'post-PVC', insp: 'insp', noChannel: 'Select a channel', metrics: 'Measurements', pvMetrics: 'Model measurements', pvMetric: { edv: 'EDV (ml)', esv: 'ESV (ml)', sv: 'Total SV (ml)', fsv: 'Forward SV (ml)', rgv: 'Regurgitant volume (ml)', ef: 'EF (%)', esp: 'End-systolic pressure (mmHg)', peak: 'LV peak pressure (mmHg)', edp: 'EDP (mmHg)', ees: 'Ees (mmHg/ml)', ea: 'Ea (mmHg/ml)', coupling: 'Ea/Ees', sw: 'Stroke work (mmHg·ml)' }, pvLoop: 'P-V loop', pvSource: 'Loop source', pvFromScenario: 'Catheter scenario', pvModel: 'Interactive model', pvCondition: 'Condition', pvEdv: 'Preload (EDV, ml)', pvEes: 'Contractility (Ees, mmHg/ml)', pvEa: 'Afterload (Ea, mmHg/ml)', pvStiff: 'Diastolic stiffness (EDPVR)', pvGhost: 'Dashed grey: normal loop', pvReset: 'Back to condition', pvNote: 'Teaching model: time-varying elastance (Suga-Sagawa); ESV = (Ees·V0 + Ea·EDV)/(Ees + Ea). The condition presets are parameter sets that reproduce textbook loop shapes, not patient data. The model is independent of the catheter scenario: the scenario menu does not change it and the measurements on this tab are the model\'s own. The stiffness slider changes the filling pressure at the condition\'s reference volume in proportion. The loop does not depend on the heart rate.', pvConditions: { normal: 'Normal', 'hfref-decompensated': 'Decompensated HF (HFrEF)', hfpef: 'HFpEF (diastolic)', 'aortic-stenosis': 'Aortic stenosis', 'aortic-regurgitation': 'Aortic regurgitation (chronic)', 'mitral-regurgitation-acute': 'Mitral regurgitation (acute)', hypovolemia: 'Hypovolaemia', inotrope: 'Inotrope (dobutamine)' }, pvExplain: { normal: 'EF ~55%; Ea/Ees ~0.6-1 gives efficient ventricular-arterial coupling.', 'hfref-decompensated': 'The ESPVR slope is reduced (lower contractility); the loop shifts right and narrows: high EDV and EDP, low SV and EF. Ea/Ees is very high (uncoupled); afterload reduction raises the SV.', hfpef: 'The EDPVR is steeper: a high EDP at an EDV below or near the normal loop (25 mmHg at 110 ml); EF preserved, the loop narrow and high.', 'aortic-stenosis': 'Afterload and the LV-aortic gradient raise LV systolic pressure: a tall loop; hypertrophy steepens the EDPVR.', 'aortic-regurgitation': 'Volume load: a wide loop shifted right; diastolic refilling from the aorta removes true isovolumic relaxation (sloped left edge).', 'mitral-regurgitation-acute': 'Early emptying into the low-impedance LA: no true isovolumic contraction (sloped right edge), small ESV, large total SV but reduced forward flow (the canvas header gives total and forward SV separately); high EDP.', hypovolemia: 'Low preload: the loop slides left along the EDPVR and the SV falls; the ESPVR is unchanged.', inotrope: 'The ESPVR steepens: smaller ESV, higher SV and EF.' }, pressureTab: 'Pressure tracings', viewTabs: 'Hemodynamics view', pvCanvas: 'Left ventricular pressure-volume loop (schematic)',
    gradAo: 'LV−Ao mean gradient', gradMi: 'LV−PCWP mean gradient', canvas: 'Simultaneous pressure tracings and ECG',
    badge: sc => `HR ${sc.hr} bpm · CO ${fmt(sc.co)} L/min`,
    presetTitles: ['Aortic stenosis: LV-Ao gradient', 'Mitral stenosis: diastolic gradient', 'Right heart: RA and RV', 'Pulmonary artery and wedge']
  }
};

const BEAT_OPTIONS = [1, 2, 3, 4, 6];
const PRESETS = [['lv', 'ao'], ['lv', 'pcwp'], ['ra', 'rv'], ['pa', 'pcwp']];
const DEFAULT_CHANNELS = ['lv', 'ao'];
const RESP_PERIOD_SEC = 4;   // 15 breaths/min
const FONT = '9px "DM Sans", sans-serif';
const SMALL_FONT = '8px "DM Sans", sans-serif';
const COLORS = {
  bg: '#fcfdfb', grid: 'rgba(93, 138, 120, 0.16)', boundary: 'rgba(63, 94, 82, 0.28)', cursor: '#e0524d',
  ecg: '#3f7d5f', text: '#5c7267', insp: 'rgba(63, 134, 182, 0.08)', aoShade: 'rgba(210, 58, 79, 0.2)',
  miShade: 'rgba(192, 132, 58, 0.28)', rhAxis: '#3f6f8f', lhAxis: '#8e4a58', pvc: '#8e2f47'
};

/** Measurement rows of a model loop: [label, value, title]; leak rows only for the leaking lesions. */
export function pvMetricRows(loop, labels) {
  const f = (v, d = 0) => v.toFixed(d);
  const rows = [['edv', f(loop.edv)], ['esv', f(loop.esv)], ['sv', f(loop.sv)]];
  if (loop.regurgVolume > 0) rows.push(['fsv', f(loop.forwardSv)], ['rgv', f(loop.regurgVolume)]);
  rows.push(['ef', f(loop.ef * 100)], ['esp', f(loop.esp)], ['peak', f(loop.peak)], ['edp', f(loop.edp, 1)],
    ['ees', f(loop.ees, 2)], ['ea', f(loop.ea, 2)], ['coupling', f(loop.ea / loop.ees, 2)], ['sw', f(loop.strokeWork)]);
  return rows.map(([key, value]) => [labels[key], value, labels[key]]);
}

const clampBeats = n => Math.min(6, Math.max(1, Math.round(Number(n)) || 3));
const orderChannels = list => STATIONS.filter(s => list.includes(s));
/** Left-heart axis for lv and ao; the wedge joins it when drawn against the LV (common scale for the gradient). */
// Right- and left-heart channels keep their own scales, except where the
// teaching point is a comparison on one scale: with the LV shown, the RV
// (equalized diastolic pressures, discordance) and the wedge (mitral gradient)
// move to the LV axis.
const axisOf = (station, channels) =>
  STATION_INFO[station].side === 'left' || ((station === 'pcwp' || station === 'rv') && channels.includes('lv')) ? 'lh' : 'rh';

/**
 * Sample N consecutive beats on a real-time axis. No DOM; unit tested.
 * @returns {{ times: Float32Array, insp: Float32Array, phases: Float32Array, series: Object<string, Float32Array>, ecg: Float32Array, postPvcBeat: number|null }}
 */
export function sampleStrip({ hemo, channels = [], beats = 3, bpm, respiration = false, pvcBeat = null, columns = 300, rhythm = 'sinus' }) {
  const n = Math.max(2, Math.round(columns) || 2);
  const nb = clampBeats(beats);
  const rate = bpm > 0 ? bpm : hemo.getScenario().hr;
  const rr = 60 / rate;
  const total = rr * nb;
  const postPvcBeat = Number.isInteger(pvcBeat) && pvcBeat >= 0 && pvcBeat < nb ? pvcBeat : null;
  const list = orderChannels(channels);
  const times = new Float32Array(n), insp = new Float32Array(n), phases = new Float32Array(n), ecg = new Float32Array(n);
  const series = Object.fromEntries(list.map(s => [s, new Float32Array(n)]));
  for (let i = 0; i < n; i++) {
    const t = (i * total) / (n - 1);
    const k = Math.min(nb - 1, Math.floor(t / rr));
    const tau = Math.min((t - k * rr) / rr, 0.99999);
    const u = timeToPhase(tau, rate);
    const breath = respiration ? Math.sin((2 * Math.PI * t) / RESP_PERIOD_SEC) : 0;
    const opts = { insp: breath, postPvc: k === postPvcBeat };
    times[i] = t; insp[i] = breath; phases[i] = u;
    ecg[i] = ecgSample(u, rhythm);
    for (const s of list) series[s][i] = hemo.pressure(s, u, opts);
  }
  return { times, insp, phases, series, ecg, postPvcBeat };
}

function runs(n, test) {
  const out = [];
  let start = -1;
  for (let i = 0; i < n; i++) {
    if (test(i)) { if (start < 0) start = i; } else if (start >= 0) { out.push([start, i - 1]); start = -1; }
  }
  if (start >= 0) out.push([start, n - 1]);
  return out;
}

function el(tag, cls, text, props) {
  const node = Object.assign(document.createElement(tag), props);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function textEl(tag, cls, key) {
  const node = el(tag, cls);
  node.dataset.k = key;
  return node;
}

/** Static panel DOM; texts are filled by data-k keys in applyText. */
function buildDom() {
  const refs = { element: el('div', 'hemo-panel'), select: el('select', 'hemo-select'), badge: el('span', 'hemo-badge'), pills: {} };
  const header = el('div', 'hemo-header');
  header.append(refs.select, refs.badge);
  const channelRow = el('div', 'hemo-channels');
  for (const s of STATIONS) {
    const info = STATION_INFO[s];
    const pill = el('label', 'hemo-pill');
    const box = el('input', null, null, { type: 'checkbox', value: s });
    pill.style.setProperty('--hemo-station', info.color);
    pill.append(box, el('span', 'hemo-dot'), el('span', 'hemo-pill-text', info.short));
    refs.pills[s] = { pill, box };
    channelRow.append(pill);
  }
  const presetRow = el('div', 'hemo-presets');
  presetRow.append(textEl('span', 'hemo-presets-label', 'presets'));
  refs.presetButtons = PRESETS.map(p => el('button', 'hemo-preset', p.map(s => STATION_INFO[s].short).join('+'), { type: 'button' }));
  presetRow.append(...refs.presetButtons);
  refs.canvasWrap = el('div', 'hemo-canvas-wrap');
  refs.canvasWrap.append(refs.canvas = el('canvas', 'hemo-canvas', null, { role: 'img' }));
  refs.beatsSelect = el('select', 'hemo-beats');
  refs.beatsSelect.append(...BEAT_OPTIONS.map(n => el('option', null, String(n), { value: String(n) })));
  const beatsLabel = el('label', 'hemo-control');
  beatsLabel.append(textEl('span', null, 'beats'), refs.beatsSelect);
  refs.respBox = el('input', null, null, { type: 'checkbox' });
  const respLabel = el('label', 'hemo-control hemo-toggle');
  respLabel.append(refs.respBox, textEl('span', null, 'resp'));
  refs.pvcButton = Object.assign(textEl('button', 'hemo-pvc', 'pvc'), { type: 'button' });
  const controls = el('div', 'hemo-controls');
  controls.append(beatsLabel, respLabel, refs.pvcButton);
  // Sub-tabs under the scenario header: pressure tracings or the LV
  // pressure-volume loop (hemo-pv-loop.js); metrics and calculators stay shared.
  refs.tabs = el('div', 'hemo-tabs', null, { role: 'tablist' });
  refs.tabButtons = ['pressure', 'pv'].map(view => {
    const b = Object.assign(textEl('button', 'hemo-tab', view === 'pv' ? 'pvLoop' : 'pressureTab'), { type: 'button' });
    b.setAttribute('role', 'tab');
    b.dataset.hemoView = view;
    refs.tabs.append(b);
    return b;
  });
  refs.pressureView = el('div', 'hemo-view hemo-view-pressure');
  refs.pressureView.append(channelRow, presetRow, refs.canvasWrap, controls);
  refs.pvWrap = el('div', 'hemo-pv-wrap hemo-view', null, { hidden: true });
  // Loop source: the catheter scenario, or the interactive elastance model with its controls.
  refs.pvSource = el('div', 'hemo-tabs hemo-pv-source', null, { role: 'group' });
  refs.pvSourceButtons = ['scenario', 'model'].map(src => {
    const b = Object.assign(textEl('button', 'hemo-tab', src === 'model' ? 'pvModel' : 'pvFromScenario'), { type: 'button' });
    b.dataset.pvSource = src;
    refs.pvSource.append(b);
    return b;
  });
  const pvCanvasWrap = el('div', 'hemo-canvas-wrap');
  pvCanvasWrap.append(refs.pvCanvas = el('canvas', 'hemo-pv-canvas', null, { role: 'img' }));
  refs.pvControls = el('div', 'hemo-pv-controls');
  const condLabel = el('label', 'hemo-control hemo-pv-condition');
  refs.pvConditionSelect = el('select', 'hemo-beats');
  refs.pvConditionSelect.dataset.pvCondition = '';
  refs.pvConditionSelect.append(...Object.keys(PV_PRESETS).map(id => el('option', null, id, { value: id })));
  condLabel.append(textEl('span', null, 'pvCondition'), refs.pvConditionSelect);
  refs.pvSliders = {};
  const sliderRow = (key, labelKey, [min, max], step) => {
    const row = el('label', 'hemo-pv-slider');
    const input = el('input', null, null, { type: 'range', min: String(min), max: String(max), step: String(step) });
    input.dataset.pvParam = key;
    const out = el('output', 'hemo-pv-out');
    row.append(textEl('span', 'hemo-pv-label', labelKey), input, out);
    refs.pvSliders[key] = { input, out };
    return row;
  };
  refs.pvResetButton = Object.assign(textEl('button', 'hemo-pvc', 'pvReset'), { type: 'button' });
  refs.pvExplain = el('p', 'hemo-hint hemo-pv-explain');
  refs.pvNote = textEl('p', 'hemo-formula', 'pvNote');
  refs.pvControls.append(condLabel,
    sliderRow('edv', 'pvEdv', PV_LIMITS.edv, 5), sliderRow('ees', 'pvEes', PV_LIMITS.ees, 0.1),
    sliderRow('ea', 'pvEa', PV_LIMITS.ea, 0.1), sliderRow('stiffness', 'pvStiff', PV_LIMITS.stiffness, 0.001),
    refs.pvResetButton, textEl('p', 'hemo-formula', 'pvGhost'), refs.pvExplain, refs.pvNote);
  refs.pvWrap.append(refs.pvSource, pvCanvasWrap, refs.pvControls);
  refs.hint = el('p', 'hemo-hint', null, { hidden: true });
  refs.grid = el('div', 'hemo-grid hemo-metrics');
  refs.metricsTitle = textEl('h4', 'hemo-metrics-title', 'metrics');
  refs.element.append(header, refs.tabs, refs.pressureView, refs.pvWrap, refs.hint, refs.metricsTitle, refs.grid);
  return refs;
}

function polyline(ctx, g, values, yOf) {
  ctx.beginPath();
  for (let i = 0; i < g.n; i++) {
    const yy = yOf(values[i]);
    if (i === 0) ctx.moveTo(g.x(i), yy); else ctx.lineTo(g.x(i), yy);
  }
  ctx.stroke();
}

function shadeBetween(ctx, g, upper, lower, test, color) {
  ctx.fillStyle = color;
  for (const [i0, i1] of runs(g.n, test)) {
    if (i1 <= i0) continue;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) ctx.lineTo(g.x(i), g.y('lh', upper[i]));
    for (let i = i1; i >= i0; i--) ctx.lineTo(g.x(i), g.y('lh', lower[i]));
    ctx.closePath();
    ctx.fill();
  }
}

function drawGrid(ctx, g) {
  const both = g.scales.rh && g.scales.lh;
  const primary = g.scales.lh ? 'lh' : 'rh';
  ctx.lineWidth = 1;
  for (const axis of ['rh', 'lh']) {
    const sc = g.scales[axis];
    if (!sc) continue;
    const step = sc[1] - sc[0] > 60 ? 20 : 10;
    const rhs = axis === 'rh';
    ctx.textAlign = rhs ? 'right' : 'left';
    ctx.fillStyle = both ? COLORS[`${axis}Axis`] : COLORS.text;
    const lx = rhs ? g.left - 3 : g.right + 3;
    ctx.font = FONT;
    for (let v = Math.ceil(sc[0] / step) * step; v <= sc[1]; v += step) {
      const yy = g.y(axis, v);
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      if (axis === primary) { ctx.moveTo(g.left, yy); ctx.lineTo(g.right, yy); } else { ctx.moveTo(g.left - 2, yy); ctx.lineTo(g.left + 4, yy); }
      ctx.stroke();
      ctx.fillText(String(v), lx, yy + 3);
    }
    ctx.font = SMALL_FONT;
    ctx.fillText('mmHg', lx, g.top - 7);
  }
}

function drawBands(ctx, g) {
  ctx.fillStyle = COLORS.insp;
  for (const [i0, i1] of runs(g.n, i => g.strip.insp[i] > 0)) ctx.fillRect(g.x(i0), g.top, g.x(i1) - g.x(i0), g.bottom - g.top);
  ctx.strokeStyle = COLORS.boundary;
  ctx.setLineDash([3, 3]);
  for (let k = 1; k < g.beats; k++) {
    ctx.beginPath();
    ctx.moveTo(g.left + k * g.beatW, g.top);
    ctx.lineTo(g.left + k * g.beatW, g.h - 3);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (g.strip.postPvcBeat != null) {
    const bx = g.left + g.strip.postPvcBeat * g.beatW;
    ctx.fillStyle = 'rgba(142, 47, 71, 0.05)';
    ctx.fillRect(bx, g.top, g.beatW, g.bottom - g.top);
  }
}

/** Text on a light backdrop; returns its [x0, x1] extent. */
function tag(ctx, text, x, y, align, color) {
  const w = ctx.measureText(text).width;
  const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  ctx.fillStyle = 'rgba(252, 253, 251, 0.8)';
  ctx.fillRect(x0 - 2, y - 8, w + 4, 11);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(text, x0, y);
  return [x0 - 2, x0 + w + 2];
}

function drawLabels(ctx, g, metrics, T) {
  const { series, insp, postPvcBeat } = g.strip;
  ctx.font = FONT;
  ctx.textAlign = 'left';
  let lx = g.left + 2;
  if (!g.channels.length) { ctx.fillStyle = COLORS.text; ctx.fillText(T.noChannel, lx, 11); }
  for (const s of g.channels) {
    const info = STATION_INFO[s];
    Object.assign(ctx, { strokeStyle: info.color, lineWidth: 2, fillStyle: info.color });
    ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(lx + 9, 8); ctx.stroke();
    ctx.fillText(info.short, lx + 12, 11);
    lx += 18 + ctx.measureText(info.short).width;
  }
  const grads = [];
  if (series.lv && series.ao) grads.push([`${T.gradAo} ${fmt(metrics.gradients.lvAoMean)} mmHg`, COLORS.pvc]);
  if (series.lv && series.pcwp) grads.push([`${T.gradMi} ${fmt(metrics.gradients.lvPcwpMean)} mmHg`, '#9a6425']);
  grads.forEach(([text, color], i) => tag(ctx, text, g.right - 3, g.top + 10 + i * 12, 'right', color));
  // Bottom row: post-PVC tag, then inspiration labels that do not collide with it.
  let taken = null;
  if (postPvcBeat != null) {
    ctx.font = `600 ${SMALL_FONT}`;
    taken = tag(ctx, T.postPvc, g.left + postPvcBeat * g.beatW + 3, g.bottom - 3, 'left', COLORS.pvc);
  }
  ctx.font = SMALL_FONT;
  const w = ctx.measureText(T.insp).width;
  for (const [i0, i1] of runs(g.n, i => insp[i] > 0)) {
    const cx = (g.x(i0) + g.x(i1)) / 2;
    if (g.x(i1) - g.x(i0) < w + 8 || (taken && cx + w / 2 > taken[0] && cx - w / 2 < taken[1])) continue;
    tag(ctx, T.insp, cx, g.bottom - 3, 'center', COLORS.rhAxis);
  }
}

function drawTraces(ctx, g) {
  const { series, phases, ecg } = g.strip;
  if (series.lv && series.ao) {
    shadeBetween(ctx, g, series.lv, series.ao, i => phases[i] >= S.ejectionStart && phases[i] < S.ivrStart, COLORS.aoShade);
  }
  if (series.lv && series.pcwp) shadeBetween(ctx, g, series.pcwp, series.lv, i => phases[i] < S.ivcStart, COLORS.miShade);
  ctx.save();
  ctx.beginPath();
  ctx.rect(g.left, g.top - 2, g.right - g.left, g.bottom - g.top + 2);
  ctx.clip();
  Object.assign(ctx, { lineWidth: 1.6, lineJoin: 'round' });
  for (const s of g.channels) { ctx.strokeStyle = STATION_INFO[s].color; polyline(ctx, g, series[s], v => g.y(g.axis[s], v)); }
  ctx.restore();
  Object.assign(ctx, { strokeStyle: COLORS.ecg, lineWidth: 1 });
  polyline(ctx, g, ecg, v => g.ecgTop + g.ecgH - ((v + 0.35) / 1.4) * g.ecgH);
}

/**
 * Create the hemodynamics panel inside root.
 * @param {HTMLElement} root empty container provided by the integrator
 * @param {{ hemo: object, lang?: 'tr'|'en', getCycleState?: () => ({ phase: number, bpm: number, rhythm: string, playing: boolean }),
 *   onScenarioChange?: (id: string) => void, onChannelsChange?: (stations: string[]) => void, onStationFocus?: (station: string) => void }} options
 */
export function createHemoPanel(root, options = {}) {
  const { hemo, getCycleState = () => ({}), onScenarioChange, onChannelsChange, onStationFocus } = options;
  if (!root || !hemo) throw new Error('createHemoPanel: root and options.hemo are required');
  let lang = options.lang === 'en' ? 'en' : 'tr';
  const state = { channels: [...DEFAULT_CHANNELS], beats: 3, respiration: false, pvc: false, pvLoop: false, scenarioId: hemo.getScenario().id };
  let pvCache = { id: null, data: null };
  // Interactive P-V model state: source, condition preset and the four parameters.
  const pv = { source: 'scenario', condition: 'normal', params: pvParams({}, 'normal') };
  const pvGhost = pvModelLoop(pvParams({}, 'normal'));
  const ac = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: ac.signal });
  let destroyed = false;
  let cache = { key: '', g: null };
  let metricsCache = { id: null, value: null };
  const metrics = () => {
    if (metricsCache.id !== state.scenarioId) metricsCache = { id: state.scenarioId, value: hemo.metrics() };
    return metricsCache.value;
  };

  root.textContent = '';
  const { element, select, badge, pills, presetButtons, canvasWrap, canvas, beatsSelect, respBox, pvcButton, tabs, tabButtons, pressureView, pvWrap, pvCanvas, pvSourceButtons, pvControls, pvConditionSelect, pvSliders, pvResetButton, pvExplain, hint, grid, metricsTitle } = buildDom();
  beatsSelect.value = String(state.beats);
  const calculators = createCalculators({ lang, signal: ac.signal });
  element.append(calculators.element);
  root.append(element);
  const layer = document.createElement('canvas');

  function renderScenarioOptions() {
    select.replaceChildren(...hemo.listScenarios().map(({ id, label }) => el('option', null, label[lang] || label.tr, { value: id })));
    select.value = state.scenarioId;
  }

  /** The model loop on screen shows its own measurements; every other view shows the catheter scenario's. */
  const modelOnScreen = () => state.pvLoop && pv.source === 'model';

  function renderMetrics() {
    const model = modelOnScreen();
    const T = TEXT[lang];
    metricsTitle.dataset.k = model ? 'pvMetrics' : 'metrics';
    metricsTitle.textContent = T[model ? 'pvMetrics' : 'metrics'];
    const rows = model ? pvMetricRows(pvModelLoop(pv.params), T.pvMetric) : metricRows({ hemo, metrics: metrics(), channels: state.channels, lang });
    grid.replaceChildren(...rows.map(([label, value, title]) => {
      const cell = el('div', 'hemo-metric', null, { title: title || '' });
      cell.append(el('span', 'hemo-metric-label', label), el('b', 'hemo-metric-value', value));
      return cell;
    }));
  }

  function applyText() {
    const T = TEXT[lang];
    for (const node of element.querySelectorAll('[data-k]')) node.textContent = T[node.dataset.k];
    presetButtons.forEach((b, i) => { b.title = T.presetTitles[i]; });
    canvas.setAttribute('aria-label', T.canvas);
    pvCanvas.setAttribute('aria-label', T.pvCanvas);
    tabs.setAttribute('aria-label', T.viewTabs);
    select.setAttribute('aria-label', T.scenario);
    badge.textContent = T.badge(hemo.getScenario());
  }

  function refreshScenario() {
    state.pvc = false;
    pvcButton.setAttribute('aria-pressed', 'false');
    select.value = state.scenarioId;
    badge.textContent = TEXT[lang].badge(hemo.getScenario());
    renderMetrics();
    calculators.prefill(hemo);
  }

  function syncScenario() {
    const id = hemo.getScenario().id;
    if (id === state.scenarioId) return;
    state.scenarioId = id;
    refreshScenario();
  }

  function applyChannels(list, emit) {
    state.channels = orderChannels(list);
    for (const s of STATIONS) {
      pills[s].box.checked = state.channels.includes(s);
      pills[s].pill.classList.toggle('is-active', pills[s].box.checked);
    }
    renderMetrics();
    if (emit) onChannelsChange?.([...state.channels]);
    draw();
  }

  function geometry(w, h, bpm, rhythm) {
    const channels = state.channels;
    const axis = Object.fromEntries(channels.map(s => [s, axisOf(s, channels)]));
    const range = side => {
      const list = channels.filter(s => axis[s] === side);
      if (!list.length) return null;
      return [Math.min(...list.map(s => hemo.range(s)[0])), Math.max(...list.map(s => hemo.range(s)[1]))];
    };
    const scales = { rh: range('rh'), lh: range('lh') };
    const top = 20, ecgH = Math.max(16, Math.round(h * 0.13));
    const bottom = h - 4 - ecgH - 5;
    const left = scales.rh ? 28 : 8, right = w - (scales.lh ? 28 : 8);
    const n = Math.max(2, Math.round(right - left));
    const strip = sampleStrip({
      hemo, channels, beats: state.beats, bpm, respiration: state.respiration,
      pvcBeat: state.pvc ? Math.min(1, state.beats - 1) : null, columns: n, rhythm
    });
    const x = i => left + (i * (right - left)) / (n - 1);
    const y = (side, v) => bottom - ((v - scales[side][0]) / (scales[side][1] - scales[side][0])) * (bottom - top);
    return { channels, axis, scales, top, bottom, left, right, n, x, y, h, strip, beats: state.beats, beatW: (right - left) / state.beats, ecgTop: bottom + 5, ecgH };
  }

  function renderLayer(w, h, dpr, bpm, rhythm) {
    layer.width = Math.round(w * dpr);
    layer.height = Math.round(h * dpr);
    const ctx = layer.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const g = geometry(w, h, bpm, rhythm);
    const T = TEXT[lang];
    drawBands(ctx, g);
    drawGrid(ctx, g);
    drawTraces(ctx, g);
    drawLabels(ctx, g, metrics(), T);
    return g;
  }

  /** Redraw; cheap on a normal tick (cached layer + cursor), resamples only when inputs change. */
  function draw(cycleState) {
    if (destroyed) return;
    const cs = cycleState || getCycleState() || {};
    syncScenario();
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (state.pvLoop) {
      // P-V tab: only the loop is on screen.
      const loopPhase = Number.isFinite(cs.phase) ? ((cs.phase % 1) + 1) % 1 : 0;
      let data, ghost = null;
      if (pv.source === 'model') {
        data = pvModelLoop(pv.params);
        ghost = pv.condition === 'normal' && pvAtPreset() ? null : pvGhost;
      } else {
        const rhythm = cs.rhythm || 'sinus';
        const cacheId = `${state.scenarioId}|${rhythm}`;
        if (pvCache.id !== cacheId) pvCache = { id: cacheId, data: samplePvLoop(hemo, 240, { rhythm }) };
        data = pvCache.data;
      }
      if (pvCanvas.clientWidth >= 40) drawPvLoop(pvCanvas, data, { phase: loopPhase, lang, dpr, ghost });
      return;
    }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 40 || h < 40) return;
    const bpm = cs.bpm > 0 ? cs.bpm : hemo.getScenario().hr;
    const rhythm = cs.rhythm || 'sinus';
    const key = [state.scenarioId, state.channels.join(','), state.beats, state.respiration, state.pvc,
      Math.round(bpm * 10), rhythm, lang, w, h, dpr].join('|');
    if (key !== cache.key) cache = { key, g: renderLayer(w, h, dpr, bpm, rhythm) };
    if (canvas.width !== layer.width || canvas.height !== layer.height) { canvas.width = layer.width; canvas.height = layer.height; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phase = Number.isFinite(cs.phase) ? ((cs.phase % 1) + 1) % 1 : 0;
    const cx = cache.g.left + phaseToTime(phase, bpm) * cache.g.beatW;   // cursor on the first beat
    Object.assign(ctx, { strokeStyle: COLORS.cursor, lineWidth: 1.3 });
    ctx.beginPath(); ctx.moveTo(cx, cache.g.top - 3); ctx.lineTo(cx, h - 3); ctx.stroke();
  }
  function pvAtPreset() {
    const base = pvParams({}, pv.condition);
    return ['edv', 'ees', 'ea', 'stiffness'].every(k => Math.abs(base[k] - pv.params[k]) < 1e-9);
  }
  function renderPv() {
    const T = TEXT[lang];
    for (const b of pvSourceButtons) b.setAttribute('aria-selected', String(b.dataset.pvSource === pv.source));
    pvControls.hidden = pv.source !== 'model';
    for (const o of pvConditionSelect.options) o.textContent = T.pvConditions[o.value] || o.value;
    pvConditionSelect.value = pv.condition;
    const fmtParam = (k, v) => (k === 'edv' ? String(Math.round(v)) : k === 'stiffness' ? v.toFixed(3) : v.toFixed(1));
    for (const [k, { input, out }] of Object.entries(pvSliders)) {
      if (document.activeElement !== input) input.value = String(pv.params[k]);
      out.textContent = fmtParam(k, pv.params[k]);
    }
    pvExplain.textContent = T.pvExplain[pv.condition] || '';
    renderMetrics();
  }
  function setPvCondition(id) {
    if (!PV_PRESETS[id]) return;
    pv.condition = id;
    pv.params = pvParams({}, id);
    renderPv();
    draw();
  }
  function applyPvLoop(enabled) {
    state.pvLoop = Boolean(enabled);
    pvWrap.hidden = !state.pvLoop;
    pressureView.hidden = state.pvLoop;
    for (const b of tabButtons) b.setAttribute('aria-selected', String((b.dataset.hemoView === 'pv') === state.pvLoop));
    cache.key = '';
    renderMetrics();
    draw();
  }

  on(select, 'change', () => {
    if (!hemo.setScenario(select.value)) { select.value = state.scenarioId; return; }
    state.scenarioId = select.value;
    refreshScenario();
    onScenarioChange?.(state.scenarioId);
    draw();
  });
  for (const s of STATIONS) {
    on(pills[s].box, 'change', () => {
      applyChannels(STATIONS.filter(id => pills[id].box.checked), true);
      if (pills[s].box.checked) onStationFocus?.(s);
    });
  }
  presetButtons.forEach((b, i) => on(b, 'click', () => applyChannels(PRESETS[i], true)));
  on(beatsSelect, 'change', () => { state.beats = clampBeats(beatsSelect.value); draw(); });
  on(respBox, 'change', () => { state.respiration = respBox.checked; draw(); });
  on(pvcButton, 'click', () => panel.triggerPvc());
  for (const b of tabButtons) on(b, 'click', () => applyPvLoop(b.dataset.hemoView === 'pv'));
  for (const b of pvSourceButtons) on(b, 'click', () => { pv.source = b.dataset.pvSource; renderPv(); draw(); });
  on(pvConditionSelect, 'change', () => setPvCondition(pvConditionSelect.value));
  for (const [k, { input }] of Object.entries(pvSliders)) {
    on(input, 'input', () => { pv.params = pvParams({ ...pv.params, [k]: Number(input.value) }, pv.condition); renderPv(); draw(); });
  }
  on(pvResetButton, 'click', () => setPvCondition(pv.condition));
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
  observer?.observe(canvasWrap);

  const panel = {
    element,
    draw,
    setLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      renderScenarioOptions();
      applyText();
      renderPv();
      renderMetrics();
      calculators.setLanguage(lang);
      draw();
    },
    setScenario(id) {
      if (!hemo.setScenario(id)) return false;
      state.scenarioId = id;
      refreshScenario();
      draw();
      return true;
    },
    setChannels(list) { applyChannels(Array.isArray(list) ? list : [], false); },
    getChannels: () => [...state.channels],
    setBeats(n) {
      state.beats = clampBeats(n);
      const v = String(state.beats);
      if (![...beatsSelect.options].some(o => o.value === v)) beatsSelect.append(el('option', null, v, { value: v }));
      beatsSelect.value = v;
      draw();
    },
    setRespiration(enabled) { state.respiration = Boolean(enabled); respBox.checked = state.respiration; draw(); },
    /** Toggle the post-PVC beat (the beat after the cursor's first beat). */
    triggerPvc() { state.pvc = !state.pvc; pvcButton.setAttribute('aria-pressed', String(state.pvc)); draw(); },
    setHint(text) { hint.textContent = text || ''; hint.hidden = !text; },
    /** Show or hide the LV pressure-volume loop. */
    setPvLoop(enabled) { applyPvLoop(enabled); },
    getPvLoop: () => (state.pvLoop ? (pv.source === 'model' ? pvModelLoop(pv.params) : pvCache.data) : null),
    /** Interactive P-V model: source ('scenario' | 'model'), condition preset and parameter overrides. */
    setPvModel({ source = 'model', condition = null, params = null } = {}) {
      pv.source = source === 'scenario' ? 'scenario' : 'model';
      if (condition && PV_PRESETS[condition]) { pv.condition = condition; pv.params = pvParams({}, condition); }
      if (params) pv.params = pvParams({ ...pv.params, ...params }, pv.condition);
      renderPv();
      draw();
    },
    getPvModel: () => ({ source: pv.source, condition: pv.condition, params: { ...pv.params } }),
    setCalculatorsOpen(open) { calculators.element.open = Boolean(open); },
    destroy() {
      destroyed = true;
      ac.abort();
      observer?.disconnect();
      root.textContent = '';
    }
  };

  renderScenarioOptions();
  applyText();
  applyChannels(state.channels, false);
  calculators.prefill(hemo);
  pvcButton.setAttribute('aria-pressed', 'false');
  renderPv();
  applyPvLoop(false);
  return panel;
}
