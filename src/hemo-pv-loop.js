// Left ventricular pressure-volume loop of the hemodynamics lesson. The
// pressure comes from the scenario's LV curve (hemodynamics.js); the volume
// is the schematic LV volume curve (wiggers.js) scaled to the scenario's
// stroke volume (CO / HR) and end-diastolic volume. The end-systolic and
// end-diastolic pressure-volume relations (ESPVR, EDPVR) and the arterial
// elastance line (Ea) are teaching reference lines drawn through the loop's
// own corner points (Suga and Sagawa's framework), not fitted data. Loops of
// regurgitant lesions are drawn with the forward stroke volume only, and the
// canvas labels them as forward values. A ventricular shunt adds its flow to
// the left ventricular stroke volume (systemic stroke volume x Qp/Qs). The
// volume curve follows the cycle rhythm; the heart rate stays the scenario's.

import { CYCLE_SYNC as S } from './cardiac-cycle.js';
import { ventricularVolume } from './wiggers.js';

/** Default end-diastolic volumes (ml) per scenario; the rest use EDV = SV / 0.62. */
export const SCENARIO_EDV = Object.freeze({
  normal: 130, aortic_stenosis_severe: 130, mitral_stenosis_severe: 95, mitral_regurgitation_severe: 160,
  aortic_regurgitation_severe: 220, hocm: 100, constrictive_pericarditis: 95, restrictive_cardiomyopathy: 90,
  tamponade: 80, precapillary_ph: 100, postcapillary_ph: 140, rv_infarct: 95, asd_left_to_right: 110,
  vsd_left_to_right: 200, acute_lv_failure: 190
});
/** Scenarios whose loop omits the regurgitant volume (forward flow only). */
export const REGURGITANT = Object.freeze(['mitral_regurgitation_severe', 'aortic_regurgitation_severe']);
/** Scenarios whose left ventricle also ejects the shunt flow (Qp/Qs x systemic stroke volume). */
export const VENTRICULAR_SHUNT = Object.freeze(['vsd_left_to_right']);

const V0 = 10;          // unstressed volume of the reference lines (ml)
const EDPVR_K = 0.025;  // stiffness constant of the exponential EDPVR (1/ml)
const BASE_ESV = 50;   // end-systolic extreme of the schematic volume curve

const wrap = u => ((u % 1) + 1) % 1;

// Atrial fibrillation: no atrial kick, so the volume stops rising at the end of rapid filling (wiggers.js) and the LV
// pressure has no a-wave: it holds the value it had when the filling stopped instead of climbing at constant volume.
const AF_FILLING_END = 0.3;

/**
 * Sample the loop and its reference relations for a scenario.
 * @param {{ pressure: (station: string, u: number) => number, getScenario: () => object, metrics?: () => object }} hemo
 * @param {number} [n] samples per cycle
 * @param {{ rhythm?: string }} [options] cycle rhythm of the volume curve (no atrial kick in atrial fibrillation)
 */
export function samplePvLoop(hemo, n = 240, { rhythm = 'sinus' } = {}) {
  const sc = hemo.getScenario();
  const systemicSv = (sc.co * 1000) / sc.hr;
  const shuntRatio = VENTRICULAR_SHUNT.includes(sc.id) && hemo.metrics ? Math.max(1, hemo.metrics().qpQs || 1) : 1;
  const sv = systemicSv * shuntRatio;
  const edv = Math.max(sv + 15, SCENARIO_EDV[sc.id] || Math.round(sv / 0.62));
  const esv = edv - sv;
  const baseEdv = ventricularVolume(S.ivcStart, rhythm);
  const volumeAt = u => esv + ((ventricularVolume(wrap(u), rhythm) - BASE_ESV) / (baseEdv - BASE_ESV)) * (edv - esv);
  const lv = u => hemo.pressure('lv', u);
  const holdP = lv(AF_FILLING_END), holdStep = lv(S.ivcStart) - holdP;
  // Pressure removed in atrial fibrillation: the late rise in late diastole, fading out across isovolumic contraction.
  const rhythmDrop = u => (rhythm !== 'afib' || u < AF_FILLING_END ? 0
    : u < S.ivcStart ? lv(u) - holdP
      : u < S.ejectionStart ? holdStep * (1 - (u - S.ivcStart) / (S.ejectionStart - S.ivcStart)) : 0);
  const points = Array.from({ length: n }, (_, i) => {
    const u = i / n;
    return { u, v: volumeAt(u), p: Math.max(1, lv(u) - rhythmDrop(u)) };
  });
  const esp = hemo.pressure('lv', S.ivrStart);
  const edp = Math.max(1, lv(S.ivcStart) - rhythmDrop(S.ivcStart));
  const ees = esp / Math.max(5, esv - V0);
  const ea = esp / sv;
  const edpvrA = edp / (Math.exp(EDPVR_K * (edv - V0)) - 1);
  // Stroke work: signed area of the loop (mmHg·ml); counterclockwise in P-V coordinates.
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i + 1) % n];
    area += (a.v * b.p - b.v * a.p) / 2;
  }
  return {
    points, edv, esv, sv, ef: sv / edv, esp, edp, ees, ea, v0: V0,
    espvr: v => Math.max(0, ees * (v - V0)),
    edpvr: v => Math.max(0, edpvrA * (Math.exp(EDPVR_K * (v - V0)) - 1)),
    strokeWork: Math.abs(area),
    counterclockwise: area > 0,
    forwardOnly: REGURGITANT.includes(sc.id),
    shunt: shuntRatio > 1 ? { systemicSv, ratio: shuntRatio } : null,
    phases: { ivc: [S.ivcStart, S.ejectionStart], ejection: [S.ejectionStart, S.ivrStart], ivr: [S.ivrStart, 1] }
  };
}

const TEXT = {
  tr: { volume: 'LV hacim (ml)', pressure: 'mmHg', espvr: 'ESPVR (Ees)', edpvr: 'EDPVR', ea: 'Ea', forward: 'Yalnız ileri hacim; regürjitan hacim modellenmedi', forwardSv: 'ileri SV', forwardEf: 'ileri EF', regurg: 'regürjitan', systemic: 'sistemik SV', shunt: 'LV toplam SV', fill: 'doluş', ivc: 'İVK', eject: 'ejeksiyon', ivr: 'İVG' },
  en: { volume: 'LV volume (ml)', pressure: 'mmHg', espvr: 'ESPVR (Ees)', edpvr: 'EDPVR', ea: 'Ea', forward: 'Forward volume only; regurgitant volume not modeled', forwardSv: 'forward SV', forwardEf: 'forward EF', regurg: 'regurgitant', systemic: 'systemic SV', shunt: 'LV total SV', fill: 'filling', ivc: 'IVC', eject: 'ejection', ivr: 'IVR' }
};
const COLORS = { bg: '#fcfdfb', grid: 'rgba(93, 138, 120, 0.16)', axis: '#5c7267', loop: '#d23a4f', filling: '#3a8fb8', iso: '#6b7f74', ref: '#9a6425', ea: '#3f6f8f', cursor: '#e0524d', text: '#5c7267' };

const phaseOf = u => (u < S.ivcStart ? 'fill' : u < S.ejectionStart ? 'ivc' : u < S.ivrStart ? 'eject' : 'ivr');
const phaseColor = { fill: COLORS.filling, ivc: COLORS.iso, eject: COLORS.loop, ivr: COLORS.iso };

/**
 * Header lines of the canvas. A regurgitant scenario loop holds the forward
 * stroke volume only, so its volume and EF are labelled forward and Ees / Ea
 * (computed from that rectangle) are left out; a leaking model loop adds its
 * forward and regurgitant volumes; a ventricular shunt adds the systemic volume.
 * @returns {string[]}
 */
export function summaryLines(data, lang = 'tr') {
  const T = TEXT[lang === 'en' ? 'en' : 'tr'];
  const ml = v => `${Math.round(v)} ml`;
  const pct = `${Math.round(data.ef * 100)}%`;
  if (data.forwardOnly) return [`${T.forwardSv} ${ml(data.sv)} · ${T.forwardEf} ${pct}`, T.forward];
  const lines = [`SV ${ml(data.sv)} · EF ${pct} · Ees ${data.ees.toFixed(1)} · Ea ${data.ea.toFixed(1)} mmHg/ml`];
  if (data.regurgVolume > 0) lines.push(`${T.forwardSv} ${ml(data.forwardSv)} · ${T.regurg} ${ml(data.regurgVolume)}`);
  if (data.shunt) lines.push(`${T.shunt}: ${T.systemic} ${ml(data.shunt.systemicSv)} × Qp/Qs ${data.shunt.ratio.toFixed(1)}`);
  return lines;
}

const HEADER_FONT = ['600 8.5px "DM Sans", sans-serif', '8px "DM Sans", sans-serif'];

/** Greedy word wrap of the header lines to `maxWidth` (the first line is bold, the others regular). */
function wrapHeader(ctx, lines, maxWidth) {
  const out = [];
  lines.forEach((line, i) => {
    ctx.font = HEADER_FONT[i === 0 ? 0 : 1];
    let current = '';
    for (const word of line.split(' ')) {
      const next = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(next).width > maxWidth) { out.push({ text: current, bold: i === 0 }); current = word; } else current = next;
    }
    out.push({ text: current, bold: i === 0 });
  });
  return out;
}

/** Axis step giving at most `maxLines` grid lines (1, 2, 5 x 10^n). */
function niceStep(max, maxLines) {
  for (let magnitude = 1; ; magnitude *= 10) for (const m of [1, 2, 5]) if (max / (m * magnitude) <= maxLines) return m * magnitude;
}

/**
 * Draw the loop. Pressure on y, volume on x; the loop is traced in phase
 * colors (filling, isovolumetric contraction, ejection, isovolumetric
 * relaxation) with the reference lines and the cursor at the current phase.
 * A regurgitant scenario loop (forward volume only) keeps its EDPVR but not
 * the ESPVR and Ea lines, which would come from the forward-only rectangle.
 * @returns {{ left: number, right: number, top: number, bottom: number }|null}
 */
export function drawPvLoop(canvas, data, { phase = 0, lang = 'tr', dpr = 1, ghost = null } = {}) {
  if (!canvas || !data) return null;
  const T = TEXT[lang === 'en' ? 'en' : 'tr'];
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  const left = 34, right = w - 10, bottom = h - 24;
  const header = wrapHeader(ctx, summaryLines(data, lang), w - (left + 4) - 4);
  const top = 11 * header.length + 6;
  const all = ghost ? [...data.points, ...ghost.points] : data.points;
  const pMax = Math.ceil((Math.max(data.esp, ...all.map(p => p.p)) * 1.15) / 20) * 20;
  const vMax = Math.ceil((Math.max(data.edv, ghost ? ghost.edv : 0) * 1.2) / 20) * 20;
  const x = v => left + (v / vMax) * (right - left);
  const y = p => bottom - (p / pMax) * (bottom - top);
  const labelWidth = (text, font) => { ctx.font = font; return ctx.measureText(text).width; };

  // Grid and axes (at most about 8 lines per axis, whatever the scale).
  ctx.lineWidth = 1;
  ctx.font = '9px "DM Sans", sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.strokeStyle = COLORS.grid;
  const pStep = niceStep(pMax, 8), vStep = niceStep(vMax, 8);
  for (let p = 0; p <= pMax; p += pStep) { ctx.beginPath(); ctx.moveTo(left, y(p)); ctx.lineTo(right, y(p)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(p), left - 3, y(p) + 3); }
  for (let v = 0; v <= vMax; v += vStep) { ctx.beginPath(); ctx.moveTo(x(v), top); ctx.lineTo(x(v), bottom); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(v), x(v), bottom + 10); }
  ctx.textAlign = 'left';
  ctx.fillText(T.pressure, left - 30, top - 9);
  ctx.textAlign = 'right';
  ctx.fillText(T.volume, right, bottom + 20);

  // Reference relations: the EDPVR always; the ESPVR and Ea line only where the loop has a true end-systolic corner.
  const systolicLines = !data.forwardOnly;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = COLORS.ref;
  if (systolicLines) {
    ctx.beginPath();
    for (let v = data.v0; v <= vMax; v += 2) { const p = data.espvr(v); if (p > pMax) break; v === data.v0 ? ctx.moveTo(x(v), y(p)) : ctx.lineTo(x(v), y(p)); }
    ctx.stroke();
  }
  ctx.beginPath();
  for (let v = data.v0; v <= vMax; v += 2) { const p = data.edpvr(v); if (p > pMax) break; v === data.v0 ? ctx.moveTo(x(v), y(p)) : ctx.lineTo(x(v), y(p)); }
  ctx.stroke();
  if (systolicLines) {
    ctx.strokeStyle = COLORS.ea;
    ctx.beginPath(); ctx.moveTo(x(data.edv), y(0)); ctx.lineTo(x(data.esv), y(data.esp)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Corner labels first, with a halo, so the loop trace and the relation labels are drawn on top of them.
  const halo = (text, tx, ty) => { ctx.strokeStyle = COLORS.bg; ctx.lineWidth = 3; ctx.strokeText(text, tx, ty); ctx.fillText(text, tx, ty); };
  ctx.font = '600 8.5px "DM Sans", sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  halo(`EDV ${Math.round(data.edv)}`, x(data.edv), Math.min(y(data.edp) + 11, bottom - 3));
  halo(`ESV ${Math.round(data.esv)}`, x(data.esv), Math.max(top + 8, y(data.esp) - 6));

  // Relation labels, clamped inside the plot.
  const labelFont = '600 8.5px "DM Sans", sans-serif';
  ctx.font = labelFont;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.ref;
  if (systolicLines) {
    const espvrTop = Math.min(vMax, data.v0 + pMax / Math.max(0.01, data.ees));
    ctx.fillText(T.espvr, Math.min(x(espvrTop), right - 60), Math.max(top + 9, y(data.espvr(espvrTop)) - 3));
  }
  const edpvrAt = Math.min(vMax, data.edv + 12);
  ctx.fillText(T.edpvr, Math.min(x(edpvrAt), right - labelWidth(T.edpvr, labelFont) - 2), Math.max(top + 9, y(data.edpvr(edpvrAt)) - 3));
  if (systolicLines) {
    ctx.fillStyle = COLORS.ea;
    ctx.fillText(T.ea, x((data.edv + data.esv) / 2) + 4, y(data.esp / 2));
  }

  // Reference (normal) loop, faint, for comparison with the current condition.
  if (ghost) {
    ctx.strokeStyle = 'rgba(92, 114, 103, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ghost.points.forEach((pt, i) => (i ? ctx.lineTo(x(pt.v), y(pt.p)) : ctx.moveTo(x(pt.v), y(pt.p))));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Loop, by phase.
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  const pts = data.points;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    ctx.strokeStyle = phaseColor[phaseOf(a.u)];
    ctx.beginPath(); ctx.moveTo(x(a.v), y(a.p)); ctx.lineTo(x(b.v), y(b.p)); ctx.stroke();
  }
  // Header lines above the plot.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  header.forEach(({ text, bold }, i) => { ctx.font = HEADER_FONT[bold ? 0 : 1]; ctx.fillText(text, left + 4, 9 + i * 11); });
  // Phase legend on its own row under the plot (the filling limb runs along the plot floor).
  ctx.font = '8px "DM Sans", sans-serif';
  let lx = left;
  for (const key of ['fill', 'ivc', 'eject', 'ivr']) {
    ctx.fillStyle = phaseColor[key]; ctx.fillRect(lx, bottom + 17, 8, 3);
    ctx.fillStyle = COLORS.text; ctx.fillText(T[key], lx + 10, bottom + 21);
    lx += 16 + ctx.measureText(T[key]).width;
  }
  const uu = wrap(phase);
  const cur = pts[Math.min(pts.length - 1, Math.floor(uu * pts.length))];
  ctx.fillStyle = COLORS.cursor;
  ctx.beginPath(); ctx.arc(x(cur.v), y(cur.p), 3.2, 0, Math.PI * 2); ctx.fill();
  return { left, right, top, bottom };
}
