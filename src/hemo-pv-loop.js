// Left ventricular pressure-volume loop of the hemodynamics lesson. The
// pressure comes from the scenario's LV curve (hemodynamics.js); the volume
// is the schematic LV volume curve (wiggers.js) scaled to the scenario's
// stroke volume (CO / HR) and end-diastolic volume. The end-systolic and
// end-diastolic pressure-volume relations (ESPVR, EDPVR) and the arterial
// elastance line (Ea) are teaching reference lines drawn through the loop's
// own corner points (Suga and Sagawa's framework), not fitted data. Loops of
// regurgitant lesions are drawn with the forward stroke volume only, which
// the panel states.

import { CYCLE_SYNC as S } from './cardiac-cycle.js';
import { ventricularVolume } from './wiggers.js';

/** Default end-diastolic volumes (ml) per scenario; the rest use EDV = SV / 0.62. */
export const SCENARIO_EDV = Object.freeze({
  normal: 130, aortic_stenosis_severe: 130, mitral_stenosis_severe: 95, mitral_regurgitation_severe: 160,
  aortic_regurgitation_severe: 220, hocm: 100, constrictive_pericarditis: 95, restrictive_cardiomyopathy: 90,
  tamponade: 80, precapillary_ph: 100, postcapillary_ph: 140, rv_infarct: 95, asd_left_to_right: 110,
  vsd_left_to_right: 150, acute_lv_failure: 190
});
/** Scenarios whose loop omits the regurgitant volume (forward flow only). */
export const REGURGITANT = Object.freeze(['mitral_regurgitation_severe', 'aortic_regurgitation_severe']);

const V0 = 10;          // unstressed volume of the reference lines (ml)
const EDPVR_K = 0.025;  // stiffness constant of the exponential EDPVR (1/ml)
const BASE_ESV = 50, BASE_EDV = 120;   // extremes of the schematic volume curve (sinus)

const wrap = u => ((u % 1) + 1) % 1;

/**
 * Sample the loop and its reference relations for a scenario.
 * @param {{ pressure: (station: string, u: number) => number, getScenario: () => object }} hemo
 * @param {number} [n] samples per cycle
 */
export function samplePvLoop(hemo, n = 240) {
  const sc = hemo.getScenario();
  const sv = (sc.co * 1000) / sc.hr;
  const edv = Math.max(sv + 15, SCENARIO_EDV[sc.id] || Math.round(sv / 0.62));
  const esv = edv - sv;
  const volumeAt = u => esv + ((ventricularVolume(wrap(u), 'sinus') - BASE_ESV) / (BASE_EDV - BASE_ESV)) * (edv - esv);
  const points = Array.from({ length: n }, (_, i) => {
    const u = i / n;
    return { u, v: volumeAt(u), p: hemo.pressure('lv', u) };
  });
  const esp = hemo.pressure('lv', S.ivrStart);
  const edp = hemo.pressure('lv', S.ivcStart);
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
    phases: { ivc: [S.ivcStart, S.ejectionStart], ejection: [S.ejectionStart, S.ivrStart], ivr: [S.ivrStart, 1] }
  };
}

const TEXT = {
  tr: { volume: 'LV hacim (ml)', pressure: 'mmHg', espvr: 'ESPVR (Ees)', edpvr: 'EDPVR', ea: 'Ea', forward: 'Yalnız ileri akım hacmi: regürjitan hacim modellenmedi', fill: 'doluş', ivc: 'İVK', eject: 'ejeksiyon', ivr: 'İVG' },
  en: { volume: 'LV volume (ml)', pressure: 'mmHg', espvr: 'ESPVR (Ees)', edpvr: 'EDPVR', ea: 'Ea', forward: 'Forward stroke volume only: the regurgitant volume is not modeled', fill: 'filling', ivc: 'IVC', eject: 'ejection', ivr: 'IVR' }
};
const COLORS = { bg: '#fcfdfb', grid: 'rgba(93, 138, 120, 0.16)', axis: '#5c7267', loop: '#d23a4f', filling: '#3a8fb8', iso: '#6b7f74', ref: '#9a6425', ea: '#3f6f8f', cursor: '#e0524d', text: '#5c7267' };

const phaseOf = u => (u < S.ivcStart ? 'fill' : u < S.ejectionStart ? 'ivc' : u < S.ivrStart ? 'eject' : 'ivr');
const phaseColor = { fill: COLORS.filling, ivc: COLORS.iso, eject: COLORS.loop, ivr: COLORS.iso };

/**
 * Draw the loop. Pressure on y, volume on x; the loop is traced in phase
 * colors (filling, isovolumetric contraction, ejection, isovolumetric
 * relaxation) with the reference lines and the cursor at the current phase.
 * @returns {{ left: number, right: number, top: number, bottom: number }|null}
 */
export function drawPvLoop(canvas, data, { phase = 0, lang = 'tr', dpr = 1 } = {}) {
  if (!canvas || !data) return null;
  const T = TEXT[lang === 'en' ? 'en' : 'tr'];
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  const left = 34, right = w - 10, top = 14, bottom = h - 24;
  const pMax = Math.ceil((Math.max(data.esp, ...data.points.map(p => p.p)) * 1.15) / 20) * 20;
  const vMax = Math.ceil((data.edv * 1.2) / 20) * 20;
  const x = v => left + (v / vMax) * (right - left);
  const y = p => bottom - (p / pMax) * (bottom - top);

  // Grid and axes.
  ctx.lineWidth = 1;
  ctx.font = '9px "DM Sans", sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.strokeStyle = COLORS.grid;
  const pStep = pMax > 150 ? 50 : 20, vStep = vMax > 200 ? 50 : 20;
  for (let p = 0; p <= pMax; p += pStep) { ctx.beginPath(); ctx.moveTo(left, y(p)); ctx.lineTo(right, y(p)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(p), left - 3, y(p) + 3); }
  for (let v = 0; v <= vMax; v += vStep) { ctx.beginPath(); ctx.moveTo(x(v), top); ctx.lineTo(x(v), bottom); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(v), x(v), bottom + 10); }
  ctx.textAlign = 'left';
  ctx.fillText(T.pressure, left - 30, top - 4);
  ctx.textAlign = 'right';
  ctx.fillText(T.volume, right, bottom + 20);

  // Reference relations.
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = COLORS.ref;
  ctx.beginPath();
  for (let v = data.v0; v <= vMax; v += 2) { const p = data.espvr(v); if (p > pMax) break; v === data.v0 ? ctx.moveTo(x(v), y(p)) : ctx.lineTo(x(v), y(p)); }
  ctx.stroke();
  ctx.beginPath();
  for (let v = data.v0; v <= vMax; v += 2) { const p = data.edpvr(v); if (p > pMax) break; v === data.v0 ? ctx.moveTo(x(v), y(p)) : ctx.lineTo(x(v), y(p)); }
  ctx.stroke();
  ctx.strokeStyle = COLORS.ea;
  ctx.beginPath(); ctx.moveTo(x(data.edv), y(0)); ctx.lineTo(x(data.esv), y(data.esp)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 8.5px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.ref;
  const espvrTop = Math.min(vMax, data.v0 + pMax / Math.max(0.01, data.ees));
  ctx.fillText(T.espvr, Math.min(x(espvrTop), right - 60), Math.max(top + 9, y(data.espvr(espvrTop)) - 3));
  ctx.fillText(T.edpvr, x(Math.min(vMax, data.edv + 12)), y(data.edpvr(Math.min(vMax, data.edv + 12))) - 3);
  ctx.fillStyle = COLORS.ea;
  ctx.fillText(T.ea, x((data.edv + data.esv) / 2) + 4, y(data.esp / 2));

  // Loop, by phase.
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  const pts = data.points;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    ctx.strokeStyle = phaseColor[phaseOf(a.u)];
    ctx.beginPath(); ctx.moveTo(x(a.v), y(a.p)); ctx.lineTo(x(b.v), y(b.p)); ctx.stroke();
  }
  // Corner labels and the cursor.
  ctx.font = '600 8.5px "DM Sans", sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(`EDV ${Math.round(data.edv)}`, x(data.edv), y(data.edp) + 12);
  ctx.fillText(`ESV ${Math.round(data.esv)}`, x(data.esv), y(data.esp) - 6);
  ctx.textAlign = 'left';
  ctx.fillText(`SV ${Math.round(data.sv)} ml · EF ${Math.round(data.ef * 100)}% · Ees ${data.ees.toFixed(1)} · Ea ${data.ea.toFixed(1)} mmHg/ml`, left + 4, top + 9);
  if (data.forwardOnly) { ctx.font = '8px "DM Sans", sans-serif'; ctx.fillText(T.forward, left + 4, top + 20); }
  // Phase legend.
  ctx.font = '8px "DM Sans", sans-serif';
  let lx = left + 4;
  for (const key of ['fill', 'ivc', 'eject', 'ivr']) {
    ctx.fillStyle = phaseColor[key]; ctx.fillRect(lx, bottom - 9, 8, 3);
    ctx.fillStyle = COLORS.text; ctx.fillText(T[key], lx + 10, bottom - 5);
    lx += 16 + ctx.measureText(T[key]).width;
  }
  const uu = wrap(phase);
  const cur = pts[Math.min(pts.length - 1, Math.floor(uu * pts.length))];
  ctx.fillStyle = COLORS.cursor;
  ctx.beginPath(); ctx.arc(x(cur.v), y(cur.p), 3.2, 0, Math.PI * 2); ctx.fill();
  return { left, right, top, bottom };
}
