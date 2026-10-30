/**
 * Canvas drawings of the EGM recording laboratory. Pure functions of the
 * panel state, the simulated result and the active lesson; no DOM state.
 * Voltages share one mV-per-row scale within the signal plot so amplitude
 * changes are never hidden by per-channel autoscaling.
 */
import { EVENT_MS, ADC_FULL_SCALE, bipolarAmplitudeByAngle } from './recording-model.js';

const C = {
  bg: '#090d16', tissue: '#121a2c', grid: '#1d2a48', axis: '#202e4f', axisMinor: '#151e32',
  text: '#b4bac8', dim: '#9a9fac', wave: '#64d6ad', electrode: '#f5ca70', faded: '#a48468',
  warn: '#ef8f7a', amber: '#e5c990', blue: '#9fbaff', light: '#e2e5ed'
};
const TRACE_COLORS = ['#b4bac8', '#76d9b1', '#f5ca70', '#9fbaff'];
const CV = 0.5; // mm/ms, same synthetic planar speed as the model

export function prepare(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return null;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.font = '12px system-ui';
  return { ctx, w, h };
}

const dot = (ctx, x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const line = (ctx, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
function arrow(ctx, x1, y1, x2, y2, color, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  line(ctx, x1, y1, x2, y2);
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}
function label(ctx, text, x, y, color = C.light) { ctx.fillStyle = color; ctx.fillText(text, x, y); }

/* ---------- Lesson diagrams ---------- */

/** Recording chain blocks; the stage that currently damages the signal turns red. */
export function drawPipeline(c, s, r, t) {
  const { ctx, w, h } = c;
  const L = t.lang === 'en';
  const clipped = r.metrics.clippedPercent > 0;
  const stages = [
    { title: L ? 'Electrode' : 'Elektrot', sub: s.recordingType === 'bipolar' ? 'U1 − U2' : 'U1 − WCT' },
    { title: L ? 'Diff. amplifier' : 'Diferansiyel amp.', sub: 'CMRR' },
    { title: L ? 'Pre-gain' : 'Ön kazanç', sub: `×${s.gain}`, bad: clipped, note: clipped ? (L ? 'clipping!' : 'kırpılma!') : `±${(ADC_FULL_SCALE / s.gain).toFixed(2)} mV` },
    { title: 'Anti-alias', sub: s.antiAlias ? `${Math.round(s.sampleRate * 0.4)} Hz` : (L ? 'off' : 'kapalı'), off: !s.antiAlias, bad: !s.antiAlias && s.sampleRate < 1000 },
    { title: 'ADC', sub: `${s.sampleRate} Hz · ${s.bits} bit`, note: `${2 ** s.bits} ${L ? 'levels' : 'seviye'}`, bad: s.sampleRate < 1000 },
    { title: L ? 'Digital filter' : 'Dijital filtre', sub: `${s.hp}–${s.lp} Hz`, note: s.notch ? `notch ${s.notch}` : '', bad: s.hp >= 70 || s.lp <= 120 },
    { title: L ? 'Display' : 'Ekran', sub: `${s.display} mV/${L ? 'row' : 'satır'}`, note: L ? 'drawing only' : 'yalnız çizim' }
  ];
  const gap = 10, boxW = Math.max(70, (w - 24 - gap * (stages.length - 1)) / stages.length), boxH = Math.min(78, h - 46);
  const y = (h - boxH) / 2 + 6;
  const compact = boxW < 105;
  stages.forEach((stage, i) => {
    const x = 12 + i * (boxW + gap);
    ctx.fillStyle = stage.bad ? '#3a1d17' : stage.off ? '#0e1422' : '#121a2d';
    ctx.strokeStyle = stage.bad ? C.warn : stage.off ? '#1d2a48' : '#3b496b';
    ctx.lineWidth = stage.bad ? 2 : 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, boxW, boxH, 6); else ctx.rect(x, y, boxW, boxH);
    ctx.fill(); ctx.stroke();
    ctx.font = `600 ${compact ? 10 : 12}px system-ui`;
    label(ctx, stage.title, x + 7, y + 18, stage.off ? '#5e6d8e' : C.light);
    ctx.font = `${compact ? 10 : 11}px system-ui`;
    label(ctx, stage.sub, x + 7, y + 36, stage.bad ? '#ffb4a2' : C.text);
    if (stage.note) label(ctx, stage.note, x + 7, y + 53, stage.bad ? C.warn : C.dim);
    if (i < stages.length - 1) arrow(ctx, x + boxW + 1, y + boxH / 2, x + boxW + gap - 1, y + boxH / 2, '#3b496b', 1);
  });
  ctx.font = '11px system-ui';
  label(ctx, L ? 'Signal path: every block can change the waveform' : 'Sinyal yolu: her blok dalga şeklini değiştirebilir', 12, 16, C.dim);
}

/** Differential amplifier with two inputs; imbalance makes common noise differential. */
export function drawAmplifier(c, s, r, t) {
  const { ctx, w, h } = c;
  const L = t.lang === 'en';
  const midY = h / 2, ampX = w * 0.58;
  const in1 = midY - 34, in2 = midY + 34;
  // Mains source
  const sx = w * 0.14, sy = 28;
  ctx.font = '11px system-ui';
  label(ctx, L ? `Mains 50 Hz · ${s.mains.toFixed(2)} mV` : `Şebeke 50 Hz · ${s.mains.toFixed(2)} mV`, sx - 40, sy - 8, s.mains > 0 ? C.amber : C.dim);
  const coupling = (yTarget, strength) => {
    if (s.mains <= 0) return;
    ctx.strokeStyle = `rgba(229,201,144,${0.25 + 0.6 * strength})`; ctx.lineWidth = 1 + 2.5 * strength;
    ctx.setLineDash([4, 4]); line(ctx, sx + 30, sy, w * 0.36, yTarget); ctx.setLineDash([]);
  };
  coupling(in1, 1); coupling(in2, 1 - s.mismatch);
  // Electrode inputs
  ctx.strokeStyle = '#7482a3'; ctx.lineWidth = 2;
  line(ctx, w * 0.2, in1, ampX - 30, in1); line(ctx, w * 0.2, in2, ampX - 30, in2);
  dot(ctx, w * 0.2, in1, 7, C.electrode); dot(ctx, w * 0.2, in2, 7, s.mismatch > 0 ? C.faded : C.electrode);
  ctx.font = '12px system-ui';
  label(ctx, 'U1 (+)', w * 0.2 - 50, in1 + 4); label(ctx, 'U2 (−)', w * 0.2 - 50, in2 + 4);
  if (s.mismatch > 0) label(ctx, L ? `imbalance ${s.mismatch.toFixed(2)}` : `dengesizlik ${s.mismatch.toFixed(2)}`, w * 0.22, in2 + 22, C.warn);
  // Amplifier triangle
  ctx.fillStyle = '#121a2d'; ctx.strokeStyle = '#76d9b1'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ampX - 30, midY - 58); ctx.lineTo(ampX - 30, midY + 58); ctx.lineTo(ampX + 60, midY); ctx.closePath(); ctx.fill(); ctx.stroke();
  label(ctx, '+', ampX - 22, in1 + 4, C.light); label(ctx, '−', ampX - 22, in2 + 4, C.light);
  ctx.font = '600 11px system-ui'; label(ctx, 'U1 − U2', ampX - 8, midY + 4, C.light);
  // Output and notch
  const outX = ampX + 60;
  ctx.strokeStyle = '#7482a3'; ctx.lineWidth = 2; line(ctx, outX, midY, w - 140, midY);
  ctx.fillStyle = s.notch ? '#2a2414' : '#0e1422'; ctx.strokeStyle = s.notch ? C.amber : '#1d2a48';
  ctx.beginPath(); ctx.rect(w - 140, midY - 20, 70, 40); ctx.fill(); ctx.stroke();
  ctx.font = '11px system-ui'; label(ctx, s.notch ? `notch ${s.notch}` : 'notch –', w - 132, midY + 4, s.notch ? C.amber : '#5e6d8e');
  arrow(ctx, w - 70, midY, w - 18, midY, '#7482a3', 2);
  const residual = r.metrics.noiseRms;
  label(ctx, `${L ? 'differential noise' : 'farka geçen gürültü'}: ${residual.toFixed(3)} mV RMS`, outX + 6, midY - 14, residual > 0.01 ? C.warn : '#76d9b1');
}

/** Tissue plane with the moving wave and the lesson's electrode layout. */
export function drawTissue(c, s, r, lesson, t) {
  const { ctx, w, h } = c;
  const L = t.lang === 'en';
  const cx = w * 0.5, cy = h * 0.56, top = 28, bottom = h - 10;
  ctx.fillStyle = C.tissue; ctx.fillRect(12, top, w - 24, bottom - top);
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let y = top + 8; y < bottom; y += 14) line(ctx, 14, y, w - 14, y);
  // Fit the widest pair in the panel; wave travel uses the same mm scale.
  const mm = Math.min(14, (bottom - top - 40) / 2 / Math.max(3, s.spacing));
  const travel = (s.cursor - EVENT_MS) * CV * mm;
  ctx.save(); ctx.beginPath(); ctx.rect(12, top, w - 24, bottom - top); ctx.clip();
  drawWave(ctx, s, cx, cy, travel, mm, w, top, bottom, t);
  ctx.restore();
  const theta = s.angle * Math.PI / 180;
  const len = s.spacing * mm;
  const at = (dx, dy) => [cx + dx * mm, cy + dy * mm];
  const ex = Math.cos(theta), ey = Math.sin(theta);
  ctx.font = '12px system-ui';
  if (lesson.id === 'unipolar') {
    dot(ctx, cx, cy, 8, C.electrode); label(ctx, 'U1', cx - 8, cy - 14);
    ctx.font = '11px system-ui';
    label(ctx, L ? 'Reference: WCT, far from the heart' : 'Referans: WCT, kalpten uzakta', w - 220, top + 16, C.dim);
  } else if (lesson.id === 'omni') {
    const b = [cx + ex * len, cy + ey * len], cc = [cx - ey * len, cy + ex * len];
    ctx.strokeStyle = C.light; ctx.lineWidth = 2; line(ctx, cx, cy, ...b); line(ctx, cx, cy, ...cc);
    ctx.font = '11px system-ui';
    label(ctx, 'Bx', (cx + b[0]) / 2 + 4, (cy + b[1]) / 2 - 6, TRACE_COLORS[0]);
    label(ctx, 'By', (cx + cc[0]) / 2 + 6, (cy + cc[1]) / 2, TRACE_COLORS[1]);
    for (const [x, y, name] of [[cx, cy, 'A'], [...b, 'B'], [...cc, 'C']]) { dot(ctx, x, y, 7, C.electrode); label(ctx, name, x - 4, y - 12); }
    if (r.meta.omniAvailable) {
      const g = theta + r.geometry.direction * Math.PI / 180;
      arrow(ctx, cx, cy, cx + Math.cos(g) * 60, cy + Math.sin(g) * 60, '#9fbaff', 2.5);
      const v = theta + s.virtualAngle * Math.PI / 180;
      ctx.strokeStyle = C.electrode; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      line(ctx, cx - Math.cos(v) * 55, cy - Math.sin(v) * 55, cx + Math.cos(v) * 55, cy + Math.sin(v) * 55); ctx.setLineDash([]);
    }
  } else if (lesson.id === 'nearfield') {
    const pts = [[0, 0, 'E2'], [-ex * s.spacing, -ey * s.spacing, 'E1'], [ex * s.spacing, ey * s.spacing, 'E3'], [-ey * s.spacing, ex * s.spacing, 'E4'], [ey * s.spacing, -ex * s.spacing, 'E5']];
    ctx.strokeStyle = C.light; ctx.lineWidth = 2; line(ctx, ...at(pts[1][0], pts[1][1]), ...at(pts[2][0], pts[2][1]));
    ctx.setLineDash([3, 3]); line(ctx, ...at(pts[3][0], pts[3][1]), ...at(pts[4][0], pts[4][1])); ctx.setLineDash([]);
    pts.forEach(([x, y, name], i) => { const [px, py] = at(x, y); dot(ctx, px, py, i ? 6 : 8, i ? C.electrode : '#76d9b1'); label(ctx, name, px - 8, py - 12); });
  } else {
    const contact = lesson.id === 'bipolar' || lesson.id === 'spacing' ? s.contact : 1;
    const lift = (1 - contact) * 22;
    const e2 = [cx + ex * len, cy + ey * len - lift];
    ctx.strokeStyle = C.light; ctx.lineWidth = 2; line(ctx, cx, cy, ...e2);
    dot(ctx, cx, cy, 7, C.electrode); label(ctx, 'U1', cx - 8, cy - 13);
    dot(ctx, ...e2, 7, contact < 0.5 ? C.faded : C.electrode); label(ctx, 'U2', e2[0] - 8, e2[1] - 13);
    if (contact < 0.5) { ctx.font = '11px system-ui'; label(ctx, L ? 'in blood pool' : 'kan havuzunda', e2[0] + 10, e2[1] + 4, C.faded); }
  }
  if (s.scenario === 'deep' && lesson.id === 'spacing') {
    const [dx, dy] = at(-4, 0);
    ctx.strokeStyle = C.blue; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '11px system-ui'; label(ctx, L ? 'deep source (15 mm below)' : 'derin kaynak (15 mm altta)', dx - 70, dy + 26, C.blue);
    const pulse = Math.exp(-0.5 * ((s.cursor - (EVENT_MS + 95)) / 10) ** 2);
    if (pulse > 0.05) { ctx.strokeStyle = `rgba(159,186,255,${pulse})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx, dy, 14 + 30 * (1 - pulse), 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.font = '12px system-ui';
  label(ctx, `${t.scenarios[s.scenario]} · ${Math.round(s.cursor)} ms`, 16, 18, C.text);
}

function drawWave(ctx, s, cx, cy, travel, mm, w, top, bottom, t) {
  const L = t.lang === 'en';
  ctx.strokeStyle = C.wave; ctx.lineWidth = 3;
  if (s.scenario === 'focus' || s.scenario === 'breakthrough') {
    if (travel >= 0) { ctx.beginPath(); ctx.arc(cx, cy, travel, 0, Math.PI * 2); ctx.stroke(); }
    if (s.scenario === 'breakthrough') {
      ctx.strokeStyle = C.blue; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      line(ctx, cx - 60, bottom - 4, cx - 4, cy + 8); ctx.setLineDash([]);
      ctx.font = '11px system-ui'; label(ctx, L ? 'source deeper / elsewhere' : 'kaynak derinde / başka yerde', cx - 160, bottom - 8, C.blue);
    }
    return;
  }
  if (s.scenario === 'shared-local') {
    ctx.fillStyle = `rgba(100,214,173,${0.3 * Math.exp(-0.5 * ((s.cursor - EVENT_MS) / 8) ** 2)})`;
    ctx.fillRect(12, top, w - 24, bottom - top);
    return;
  }
  const x = cx + travel;
  line(ctx, x, top + 2, x, bottom - 2);
  arrow(ctx, x + 4, top + 14, x + 22, top + 14, C.wave, 2);
  if (s.scenario === 'purkinje') {
    const px = cx + (s.cursor - (EVENT_MS - 18)) * CV * mm;
    ctx.strokeStyle = C.electrode; ctx.lineWidth = 1.2; line(ctx, px, top + 2, px, bottom - 2);
  }
  if (s.scenario === 'collision') {
    const d = (s.cursor - (EVENT_MS + 9)) * CV * mm;
    const px = cx - 0.6 * d, py = cy + 0.8 * d;
    ctx.strokeStyle = C.electrode; ctx.lineWidth = 3;
    line(ctx, px - 0.8 * w, py - 0.6 * w, px + 0.8 * w, py + 0.6 * w);
  }
}

/* ---------- Signals ---------- */

export function drawSignals(c, s, r, lesson, t, plotRef) {
  const { ctx, w, h } = c;
  const left = Math.min(150, w * 0.3), right = w - 12, top = 18, bottom = h - 24;
  const duration = 600 / s.zoom;
  const from = Math.max(0, Math.min(EVENT_MS + 20 - duration / 2, 600 - duration));
  const to = from + duration;
  Object.assign(plotRef, { left, right, from, to });
  const x = (ms) => left + (ms - from) / duration * (right - left);
  ctx.lineWidth = 1;
  for (let ms = Math.ceil(from / 25) * 25; ms <= to; ms += 25) {
    ctx.strokeStyle = ms % 100 === 0 ? C.axis : C.axisMinor; line(ctx, x(ms), top, x(ms), bottom);
    if (ms % 100 === 0 && ms < to - 20) label(ctx, String(ms), x(ms) - 9, h - 7, C.dim);
  }
  label(ctx, 'ms', w - 24, h - 7, C.dim);
  const traces = lesson.traces, row = (bottom - top) / traces.length;
  traces.forEach((key, i) => {
    const values = r.traces[key]; if (!values) return;
    const y0 = top + (i + 0.5) * row, scale = row / s.display;
    ctx.strokeStyle = C.axis; line(ctx, left, y0, right, y0);
    ctx.font = '11px system-ui';
    wrapLabel(ctx, t.traces[key], 8, y0 - 4, left - 14, TRACE_COLORS[i % 4]);
    label(ctx, `${s.display} mV`, 8, y0 + row * 0.38, '#627092');
    if (lesson.id === 'omni' && !r.meta.omniAvailable) { label(ctx, '∅', left + 12, y0, C.amber); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(left, top + i * row + 1, right - left, row - 2); ctx.clip();
    ctx.strokeStyle = TRACE_COLORS[i % 4]; ctx.lineWidth = 1.3; ctx.beginPath();
    // Per-pixel min/max envelope keeps brief potentials visible when zoomed out.
    const n = r.times.length, dt = r.times[1] - r.times[0];
    for (let px = 0; px <= Math.ceil(right - left); px++) {
      const lo = Math.max(0, Math.floor((from + px / (right - left) * duration) / dt));
      const hi = Math.min(n, Math.max(lo + 1, Math.ceil((from + (px + 1) / (right - left) * duration) / dt)));
      let min = Infinity, max = -Infinity;
      for (let k = lo; k < hi; k++) { if (values[k] < min) min = values[k]; if (values[k] > max) max = values[k]; }
      if (!Number.isFinite(min)) continue;
      if (px === 0) ctx.moveTo(left + px, y0 - max * scale); else ctx.lineTo(left + px, y0 - max * scale);
      ctx.lineTo(left + px, y0 - min * scale);
    }
    ctx.stroke();
    if (key === 'sampled' && s.gain > 1) {
      const limit = ADC_FULL_SCALE / s.gain * scale;
      ctx.strokeStyle = 'rgba(239,143,122,.6)'; ctx.setLineDash([4, 4]);
      line(ctx, left, y0 - limit, right, y0 - limit); line(ctx, left, y0 + limit, right, y0 + limit); ctx.setLineDash([]);
    }
    ctx.restore();
    if (lesson.lat) {
      const lat = key === 'raw' ? r.metrics.rawLat : key === 'filtered' ? r.metrics.filteredLat : null;
      if (Number.isFinite(lat) && lat >= from && lat <= to) {
        ctx.fillStyle = '#f5ca70'; const lx = x(lat), ly = top + i * row + 4;
        ctx.beginPath(); ctx.moveTo(lx - 5, ly); ctx.lineTo(lx + 5, ly); ctx.lineTo(lx, ly + 7); ctx.closePath(); ctx.fill();
        ctx.font = '10px system-ui'; label(ctx, 'LAT', lx + 7, ly + 7, '#f5ca70');
      }
    }
  });
  for (const [ms, color] of [[s.cursor, '#a6adbc'], ...s.marks.map((m) => [m, C.electrode])]) {
    if (ms < from || ms > to) continue;
    ctx.strokeStyle = color; ctx.lineWidth = 1; line(ctx, x(ms), top, x(ms), bottom);
  }
}

function wrapLabel(ctx, text, x, y, maxWidth, color) {
  ctx.fillStyle = color;
  let current = '', yy = y;
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) { ctx.fillText(current, x, yy); current = word; yy += 13; }
    else current = next;
  }
  ctx.fillText(current, x, yy);
}

/* ---------- Lesson-specific extra plots ---------- */

let orientationCache = { key: '', values: [] };
const ORIENTATION_ANGLES = Array.from({ length: 37 }, (_, i) => i * 5);

export function drawExtra(kind, c, s, r, t) {
  if (kind === 'adc') return drawAdc(c, s, r, t);
  if (kind === 'spectrum') return drawSpectrum(c, r);
  if (kind === 'derivative') return drawDerivative(c, s, r);
  if (kind === 'orientation') return drawOrientation(c, s, t);
  if (kind === 'loop') return drawLoop(c, s, r);
  return undefined;
}

function drawAdc(c, s, r, t) {
  const { ctx, w, h } = c;
  const from = EVENT_MS - 28, to = EVENT_MS + 12;
  const idx = r.times.map((tm, i) => tm >= from && tm <= to ? i : -1).filter((i) => i >= 0);
  let lo = Infinity, hi = -Infinity;
  for (const i of idx) { lo = Math.min(lo, r.traces.raw[i], r.traces.sampled[i]); hi = Math.max(hi, r.traces.raw[i], r.traces.sampled[i]); }
  const pad = (hi - lo) * 0.15 || 0.1; lo -= pad; hi += pad;
  const left = 50, right = w - 12, top = 12, bottom = h - 22;
  const X = (tm) => left + (tm - from) / (to - from) * (right - left);
  const Y = (v) => bottom - (v - lo) / (hi - lo) * (bottom - top);
  ctx.strokeStyle = C.axis; ctx.lineWidth = 1; line(ctx, left, top, left, bottom); line(ctx, left, bottom, right, bottom);
  ctx.font = '11px system-ui';
  label(ctx, `${hi.toFixed(2)} mV`, 4, top + 8, C.dim); label(ctx, `${lo.toFixed(2)}`, 4, bottom, C.dim);
  for (let tm = Math.ceil(from / 10) * 10; tm <= to; tm += 10) label(ctx, String(tm), X(tm) - 9, h - 6, C.dim);
  const clip = ADC_FULL_SCALE / s.gain;
  for (const v of [clip, -clip]) if (v > lo && v < hi) { ctx.strokeStyle = C.warn; ctx.setLineDash([4, 4]); line(ctx, left, Y(v), right, Y(v)); ctx.setLineDash([]); label(ctx, t.lang === 'en' ? 'ADC limit' : 'ADC sınırı', right - 70, Y(v) - 4, C.warn); }
  ctx.strokeStyle = 'rgba(180,186,200,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
  idx.forEach((i, k) => { const px = X(r.times[i]), py = Y(r.traces.raw[i]); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke();
  ctx.strokeStyle = '#76d9b1'; ctx.lineWidth = 1.6; ctx.beginPath();
  idx.forEach((i, k) => { const px = X(r.times[i]), py = Y(r.traces.sampled[i]); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke();
  const period = 1000 / s.sampleRate;
  ctx.fillStyle = '#76d9b1';
  for (let tm = Math.ceil(from / period) * period; tm <= to; tm += period) {
    const i = Math.round(tm * 8); if (r.traces.sampled[i] === undefined) continue;
    ctx.beginPath(); ctx.arc(X(tm), Y(r.traces.sampled[i]), 2.2, 0, Math.PI * 2); ctx.fill();
  }
  label(ctx, t.lang === 'en' ? 'grey: raw · green: ADC samples (held)' : 'gri: ham · yeşil: ADC örnekleri (tutulmuş)', left + 8, top + 10, C.dim);
}

function drawSpectrum(c, r) {
  const { ctx, w, h } = c;
  if (!r.spectrum) return;
  const { times, freqs, power } = r.spectrum;
  const left = 48, top = 12, width = w - 60, height = h - 36, maxHz = freqs[freqs.length - 1];
  const half = times.length > 1 ? (times[1] - times[0]) / 2 : 16;
  for (let i = 0; i < times.length; i++) {
    for (let j = 0; j < freqs.length; j++) {
      const p = Math.max(0, Math.min(1, power[i]?.[j] || 0));
      ctx.fillStyle = `hsl(${220 - p * 175} 70% ${8 + 55 * Math.sqrt(p)}%)`;
      const high = j === freqs.length - 1 ? freqs[j] : (freqs[j] + freqs[j + 1]) / 2;
      const low = j === 0 ? 0 : (freqs[j - 1] + freqs[j]) / 2;
      ctx.fillRect(left + (times[i] - half) / 600 * width, top + (1 - high / maxHz) * height, 2 * half / 600 * width + 1, (high - low) / maxHz * height + 1);
    }
  }
  ctx.font = '11px system-ui';
  label(ctx, `${maxHz} Hz`, 3, top + 8, C.text); label(ctx, `${Math.round(maxHz / 2)}`, 12, top + height / 2, C.text); label(ctx, '0', 20, top + height, C.text);
  for (let ms = 0; ms <= 500; ms += 100) label(ctx, String(ms), left + ms / 600 * width - 8, h - 7, C.text);
  label(ctx, 'ms', w - 22, h - 7, C.text);
}

function drawDerivative(c, s, r) {
  const { ctx, w, h } = c;
  const from = EVENT_MS - 40, to = EVENT_MS + 70, step = Math.round(8000 / s.sampleRate);
  const pts = [];
  for (let i = step; i + step < r.times.length; i += step) {
    const tm = r.times[i]; if (tm < from || tm > to) continue;
    pts.push([tm, -(r.traces.filtered[i + step] - r.traces.filtered[i - step]) / (2 * step / 8)]);
  }
  if (!pts.length) return;
  const max = Math.max(0.05, ...pts.map((p) => Math.abs(p[1])));
  const left = 50, right = w - 12, top = 12, bottom = h - 22, mid = (top + bottom) / 2;
  const X = (tm) => left + (tm - from) / (to - from) * (right - left), Y = (v) => mid - v / max * (bottom - top) / 2;
  ctx.strokeStyle = C.axis; ctx.lineWidth = 1; line(ctx, left, mid, right, mid);
  ctx.font = '11px system-ui';
  label(ctx, `${max.toFixed(2)} mV/ms`, 2, top + 8, C.dim);
  for (let tm = Math.ceil(from / 20) * 20; tm <= to; tm += 20) label(ctx, String(tm), X(tm) - 9, h - 6, C.dim);
  ctx.strokeStyle = '#76d9b1'; ctx.lineWidth = 1.5; ctx.beginPath();
  pts.forEach(([tm, v], k) => { if (k) ctx.lineTo(X(tm), Y(v)); else ctx.moveTo(X(tm), Y(v)); });
  ctx.stroke();
  const lat = r.metrics.filteredLat;
  if (Number.isFinite(lat)) {
    ctx.strokeStyle = C.electrode; ctx.setLineDash([4, 3]); line(ctx, X(lat), top, X(lat), bottom); ctx.setLineDash([]);
    label(ctx, `LAT ${lat.toFixed(1)} ms`, X(lat) + 6, top + 10, C.electrode);
  }
}

function drawOrientation(c, s, t) {
  const { ctx, w, h } = c;
  const key = `${s.scenario}|${s.spacing}|${s.contact}`;
  if (orientationCache.key !== key) orientationCache = { key, values: bipolarAmplitudeByAngle(s, ORIENTATION_ANGLES) };
  const values = orientationCache.values, max = Math.max(0.1, ...values) * 1.1;
  const left = 50, right = w - 12, top = 12, bottom = h - 22;
  const X = (a) => left + a / 180 * (right - left), Y = (v) => bottom - v / max * (bottom - top);
  ctx.strokeStyle = C.axis; ctx.lineWidth = 1; line(ctx, left, top, left, bottom); line(ctx, left, bottom, right, bottom);
  ctx.font = '11px system-ui';
  label(ctx, `${max.toFixed(1)} mV`, 4, top + 8, C.dim); label(ctx, '0', 30, bottom, C.dim);
  for (const a of [0, 45, 90, 135, 180]) label(ctx, `${a}°`, X(a) - 8, h - 6, C.dim);
  ctx.fillStyle = 'rgba(239,143,122,.12)'; ctx.fillRect(X(80), top, X(100) - X(80), bottom - top);
  label(ctx, t.lang === 'en' ? 'blind zone' : 'kör bölge', X(90) - 24, top + 12, C.warn);
  ctx.strokeStyle = '#f5ca70'; ctx.lineWidth = 2; ctx.beginPath();
  values.forEach((v, i) => { const px = X(ORIENTATION_ANGLES[i]), py = Y(v); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke();
  const [current] = bipolarAmplitudeByAngle(s, [s.angle]);
  dot(ctx, X(s.angle), Y(current), 5, C.light);
  label(ctx, `${s.angle}° · ${current.toFixed(2)} mV`, Math.min(X(s.angle) + 8, right - 100), Math.max(Y(current) - 8, top + 24), C.light);
}

function drawLoop(c, s, r) {
  const { ctx, w, h } = c;
  if (!r.meta.omniAvailable) { ctx.font = '16px system-ui'; label(ctx, '∅', w / 2, h / 2, C.amber); return; }
  const a = r.traces.fieldX, b = r.traces.fieldY;
  const cx = w / 2, cy = h / 2, radius = Math.min(w / 2 - 20, h / 2 - 16), scale = radius / 1.6;
  ctx.strokeStyle = C.axis; ctx.lineWidth = 1; line(ctx, cx - radius, cy, cx + radius, cy); line(ctx, cx, cy - radius, cx, cy + radius);
  ctx.font = '11px system-ui';
  label(ctx, 'Bx', cx + radius - 16, cy - 6, TRACE_COLORS[0]); label(ctx, 'By', cx + 6, cy - radius + 10, TRACE_COLORS[1]);
  label(ctx, '1 mV', cx + scale - 12, cy + 14, C.dim);
  ctx.strokeStyle = '#76d9b1'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < a.length; i += 2) { const x = cx + a[i] * scale, y = cy - b[i] * scale; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.stroke();
  const d = r.geometry.direction * Math.PI / 180;
  arrow(ctx, cx, cy, cx + Math.cos(d) * radius * 0.9, cy - Math.sin(d) * radius * 0.9, '#9fbaff', 2);
  const v = s.virtualAngle * Math.PI / 180;
  ctx.strokeStyle = C.electrode; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
  line(ctx, cx - radius * Math.cos(v), cy + radius * Math.sin(v), cx + radius * Math.cos(v), cy - radius * Math.sin(v)); ctx.setLineDash([]);
}
