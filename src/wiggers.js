import { CARDIAC_INTERVALS, CYCLE_SYNC, phaseToTime, timeToPhase, cycleSeconds } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';

/**
 * Procedural Wiggers diagram on the shared cycle clock. Curves are schematic
 * teaching shapes (typical adult values), not patient data.
 *
 * Consistency rules (checked by scripts/test-wiggers.mjs):
 * - Valve events are the template interval boundaries used by the panel and
 *   the ECG strip: mitral closes 0.45 (S1), aortic opens 0.53, aortic closes
 *   0.88 (S2, end of T), mitral opens 0.00/1.00.
 * - Each event sits on the matching pressure crossing.
 * - Mitral open: LA > LV. Aortic closed: aortic pressure never rises above
 *   its closure value (dicrotic notch = dip, then a small peak below it).
 * - Curves take the physiologic phase u; the diagram x axis is real time,
 *   so rate changes reshape the curves (diastasis is consumed first).
 */

const S = CYCLE_SYNC;
export const EVENTS = Object.freeze({
  mitralOpen: 0.0,
  mitralClose: 0.45,
  aorticOpen: 0.53,
  aorticClose: 0.88
});

function wrap(u) {
  return ((u % 1) + 1) % 1;
}

function gauss(t, center, width) {
  const d = Math.min(Math.abs(t - center), 1 - Math.abs(t - center));
  return Math.exp(-(d * d) / (2 * width * width));
}

function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

// Piecewise smooth interpolation through [u, value] anchors (u ascending).
function through(anchors, u) {
  if (u <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [u0, v0] = anchors[i];
    const [u1, v1] = anchors[i + 1];
    if (u <= u1) return v0 + (v1 - v0) * smoothstep(u0, u1, u);
  }
  return anchors[anchors.length - 1][1];
}

const AO_OPEN_P = 80;    // aortic diastolic pressure at valve opening
const AO_CLOSE_P = 96;   // pressure at S2
const LV_PEAK = 122;
const AV_OPEN_P = 12;    // LA = LV at mitral opening (v-wave peak)

const hasAtrialKick = rhythm => rhythm !== 'afib';

/** Left ventricular pressure (mmHg) at physiologic phase u. */
export function ventricularPressure(u, rhythm = 'sinus') {
  const uu = wrap(u);
  const lvedp = hasAtrialKick(rhythm) ? 11 : 7;
  if (uu < EVENTS.mitralClose) {
    // Diastole: early drop below LA (suction), slow rise, atrial kick to LVEDP.
    return through([
      [0.0, AV_OPEN_P],
      [0.06, 3.5],
      [0.18, 4.8],
      [0.32, 5.8],
      [0.42, hasAtrialKick(rhythm) ? 9.6 : 6.6],
      [EVENTS.mitralClose, lvedp]
    ], uu);
  }
  // Systole keeps its slope through the valve events (smoothstep would
  // flatten LV at opening and closure, breaking the pressure crossings).
  if (uu < EVENTS.aorticOpen) {
    const f = (uu - EVENTS.mitralClose) / (EVENTS.aorticOpen - EVENTS.mitralClose);
    return lvedp + (AO_OPEN_P - lvedp) * Math.pow(f, 1.6);     // isovolumetric contraction
  }
  if (uu < 0.64) {
    const f = (uu - EVENTS.aorticOpen) / (0.64 - EVENTS.aorticOpen);
    return AO_OPEN_P + (LV_PEAK - AO_OPEN_P) * (1 - (1 - f) * (1 - f)); // rapid ejection
  }
  if (uu < EVENTS.aorticClose) {
    const f = (uu - 0.64) / (EVENTS.aorticClose - 0.64);
    return LV_PEAK - (LV_PEAK - AO_CLOSE_P) * Math.pow(f, 2.2);        // reduced ejection
  }
  // Isovolumetric relaxation: steep exponential fall to the LA v-wave level.
  const decay = Math.exp(-(uu - EVENTS.aorticClose) / 0.022);
  const tail = Math.exp(-(1 - EVENTS.aorticClose) / 0.022);
  return AV_OPEN_P + (AO_CLOSE_P - AV_OPEN_P) * (decay - tail) / (1 - tail);
}

/** Aortic pressure (mmHg). */
export function aorticPressure(u, rhythm = 'sinus') {
  const uu = wrap(u);
  if (uu >= EVENTS.aorticOpen && uu <= EVENTS.aorticClose) {
    // LV slightly above aorta early in ejection, slightly below late; the two
    // cross exactly at opening, at the peak and at closure.
    const lv = ventricularPressure(uu, rhythm);
    const early = uu < 0.64 ? -2 * Math.sin(Math.PI * (uu - EVENTS.aorticOpen) / (0.64 - EVENTS.aorticOpen)) : 0;
    const late = uu >= 0.64 ? 2.5 * Math.sin(Math.PI * (uu - 0.64) / (EVENTS.aorticClose - 0.64)) : 0;
    return lv + early + late;
  }
  // Closed: runoff from the closure value down to the opening value.
  const s = wrap(uu - EVENTS.aorticClose);
  const span = 1 - (EVENTS.aorticClose - EVENTS.aorticOpen);
  const runoff = AO_CLOSE_P - (AO_CLOSE_P - AO_OPEN_P) * Math.pow(s / span, 0.85);
  const notch = 5 * gauss(s, 0.012, 0.006);   // incisura: dip right after closure
  const bump = 1.2 * gauss(s, 0.032, 0.009);  // dicrotic wave, stays below AO_CLOSE_P
  return runoff - notch + bump;
}

/** Left atrial pressure (mmHg): a, c, v waves with x and y descents. */
export function atrialPressure(u, rhythm = 'sinus') {
  const uu = wrap(u);
  const kick = hasAtrialKick(rhythm);
  if (uu < EVENTS.mitralClose) {
    // Mitral open: LA sits just above LV, forward gradient into the ventricle.
    const lv = ventricularPressure(uu, rhythm);
    const yDescent = 3.2 * Math.exp(-uu / 0.03) * smoothstep(0, 0.012, uu);
    const aWave = kick ? 2.6 * gauss(uu, 0.405, 0.022) : 0;
    const close = 1 - smoothstep(0.43, EVENTS.mitralClose, uu); // gradient -> 0 at closure
    return lv + (1.3 + yDescent + aWave) * close;
  }
  // Mitral closed: c wave, x descent, then the v wave building to opening.
  const cWave = 2.2 * gauss(uu, S.qrsPeak + 0.02, 0.012);
  const base = through([
    [EVENTS.mitralClose, kick ? 11 : 7],
    [0.5, 6.5],
    [0.6, 4.2],             // x descent
    [EVENTS.aorticClose, 9.5],
    [1.0, AV_OPEN_P]        // v wave peak at mitral opening
  ], uu);
  return base + cWave;
}

/** Left ventricular volume (ml): EDV ~120 (sinus), ESV ~50. */
export function ventricularVolume(u, rhythm = 'sinus') {
  const uu = wrap(u);
  const kick = hasAtrialKick(rhythm) ? 15 : 0;
  const edv = 105 + kick;
  if (uu < EVENTS.mitralClose) {
    const rapid = 45 * (1 - Math.pow(1 - Math.min(1, uu / 0.18), 2.2));
    const slow = 10 * smoothstep(0.18, 0.32, uu);
    const atrial = kick * smoothstep(0.36, 0.44, uu);
    return 50 + rapid + slow + atrial;
  }
  if (uu < EVENTS.aorticOpen) return edv;           // isovolumetric contraction
  if (uu < EVENTS.aorticClose) {
    const f = (uu - EVENTS.aorticOpen) / (EVENTS.aorticClose - EVENTS.aorticOpen);
    return edv - (edv - 50) * (1 - Math.pow(1 - f, 2.2)); // rapid then reduced ejection
  }
  return 50;                                         // isovolumetric relaxation
}

/** Schematic ECG: the same lead II shape as the ECG strip (AFib: no P wave). */
export function ecgValue(u, rhythm = 'sinus') {
  return ecgSample(u, rhythm);
}

/** Heart sounds on the physiologic clock. S4 needs an atrial kick. */
export function heartSounds(rhythm = 'sinus') {
  const list = [
    { id: 'S1', u: EVENTS.mitralClose + 0.004, strong: true },
    { id: 'S2', u: EVENTS.aorticClose + 0.004, strong: true },
    { id: 'S3', u: 0.06, strong: false }
  ];
  if (hasAtrialKick(rhythm)) list.push({ id: 'S4', u: 0.425, strong: false });
  return list;
}

/** Systole/diastole seconds at a rate (from the engine's time warp). */
export function cycleTiming(bpm) {
  return cycleSeconds(bpm);
}

const SHORT_LABELS = {
  'rapid-filling': { en: 'Rapid inflow', tr: 'Hızlı doluş' },
  diastasis: { en: 'Diastasis', tr: 'Diyastaz' },
  'atrial-systole': { en: 'Atrial systole', tr: 'Atriyal sistol' },
  'isovolumetric-contraction': { en: 'IVC', tr: 'İVK' },
  'ventricular-ejection': { en: 'Ejection', tr: 'Ejeksiyon' },
  'isovolumetric-relaxation': { en: 'IVR', tr: 'İVG' }
};

const COLORS = {
  grid: 'rgba(93, 138, 120, 0.16)',
  boundary: 'rgba(63, 94, 82, 0.35)',
  cursor: '#e0524d',
  ventricular: '#2f6fb3',
  aortic: '#d23a4f',
  atrial: '#c0843a',
  volume: '#3a8fb8',
  ecg: '#3f7d5f',
  text: '#5c7267',
  label: '#3d5348'
};

/**
 * Draw the diagram. x axis = real time over one RR interval at state.bpm;
 * every curve samples the physiologic phase u = timeToPhase(tau).
 */
export function drawWiggers(canvas, state, lang = 'tr') {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 600;
  const cssH = canvas.clientHeight || 200;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const bpm = state?.bpm || 72;
  const rhythm = state?.rhythm || 'sinus';
  const left = 8, right = cssW - 8, top = 16;
  const plotW = right - left;
  const xTau = tau => left + tau * plotW;
  const xU = u => xTau(phaseToTime(u, bpm));

  const bandGap = 5;
  const drawable = cssH - top - 6;
  const hSounds = 12;
  const hPressure = drawable * 0.50;
  const hVolume = drawable * 0.20;
  const hEcg = drawable - hPressure - hVolume - hSounds - bandGap * 3;
  const bands = {
    pressure: { y: top, h: hPressure, min: 0, max: 130 },
    sounds: { y: top + hPressure + bandGap, h: hSounds },
    volume: { y: top + hPressure + hSounds + bandGap * 2, h: hVolume, min: 40, max: 130 },
    ecg: { y: top + hPressure + hSounds + hVolume + bandGap * 3, h: hEcg, min: -0.35, max: 1.05 }
  };
  const yIn = (band, v) => band.y + band.h - ((v - band.min) / (band.max - band.min)) * band.h;

  // Interval boundaries (real-time positions) + active interval tint.
  const active = state?.interval?.id;
  for (const interval of CARDIAC_INTERVALS) {
    const x0 = xU(interval.start);
    const x1 = interval.end >= 1 ? right : xU(interval.end);
    if (interval.id === active) {
      ctx.fillStyle = 'rgba(88, 156, 125, 0.10)';
      ctx.fillRect(x0, top - 4, x1 - x0, drawable + 6);
    }
    ctx.strokeStyle = COLORS.boundary;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x0, top - 4);
    ctx.lineTo(x0, top + drawable);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = COLORS.grid;
  for (const key of ['pressure', 'volume', 'ecg']) {
    const band = bands[key];
    ctx.strokeRect(left, band.y, plotW, band.h);
  }

  function plot(fn, band, color, width = 1.6, from = 0, to = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    const n = 320;
    let started = false;
    for (let i = 0; i <= n; i++) {
      const tau = i / n;
      const u = timeToPhase(tau, bpm);
      if (u < from || u > to) { started = false; continue; }
      const yy = yIn(band, fn(u, rhythm));
      if (!started) { ctx.moveTo(xTau(tau), yy); started = true; }
      else ctx.lineTo(xTau(tau), yy);
    }
    ctx.stroke();
  }

  plot(aorticPressure, bands.pressure, COLORS.aortic, 1.5);
  plot(atrialPressure, bands.pressure, COLORS.atrial, 1.3);
  plot(ventricularPressure, bands.pressure, COLORS.ventricular, 1.9);
  plot(ventricularVolume, bands.volume, COLORS.volume, 1.8);
  plot(ecgValue, bands.ecg, COLORS.ecg, 1.4);

  // Curve tags at the right edge.
  ctx.font = '600 8.5px "DM Sans", sans-serif';
  ctx.textAlign = 'right';
  const tagAt = (label, band, value, color) => {
    ctx.fillStyle = color;
    ctx.fillText(label, right - 3, yIn(band, value) - 3);
  };
  tagAt(lang === 'tr' ? 'Aort' : 'Aortic', bands.pressure, aorticPressure(0.985, rhythm), COLORS.aortic);
  tagAt(lang === 'tr' ? 'LV' : 'LV', bands.pressure, 26, COLORS.ventricular);
  tagAt(lang === 'tr' ? 'LA' : 'LA', bands.pressure, 16, COLORS.atrial);
  tagAt(lang === 'tr' ? 'LV hacim' : 'LV volume', bands.volume, ventricularVolume(0.985, rhythm), COLORS.volume);
  tagAt('EKG', bands.ecg, 0.75, COLORS.ecg);

  // Valve events at their pressure crossings.
  const events = [
    [EVENTS.mitralClose, lang === 'tr' ? 'MV kapanır' : 'MV closes', ventricularPressure(EVENTS.mitralClose, rhythm)],
    [EVENTS.aorticOpen, lang === 'tr' ? 'Ao açılır' : 'Ao opens', AO_OPEN_P],
    [EVENTS.aorticClose, lang === 'tr' ? 'Ao kapanır' : 'Ao closes', AO_CLOSE_P],
    [EVENTS.mitralOpen, lang === 'tr' ? 'MV açılır' : 'MV opens', AV_OPEN_P]
  ];
  ctx.font = '600 8px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  events.forEach(([u, label, pressure]) => {
    const xx = u === 0 ? left : xU(u);
    const yy = yIn(bands.pressure, pressure);
    ctx.fillStyle = COLORS.label;
    ctx.beginPath();
    ctx.arc(xx, yy, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(label, Math.min(Math.max(xx, 30), right - 30), top - 5);
  });

  // Heart sounds lane.
  const sb = bands.sounds;
  ctx.strokeStyle = 'rgba(49, 71, 61, 0.35)';
  ctx.beginPath();
  ctx.moveTo(left, sb.y + sb.h / 2);
  ctx.lineTo(right, sb.y + sb.h / 2);
  ctx.stroke();
  ctx.font = '600 7.5px "DM Sans", sans-serif';
  for (const snd of heartSounds(rhythm)) {
    const xx = xU(snd.u);
    ctx.strokeStyle = snd.strong ? '#31473d' : 'rgba(49, 71, 61, 0.45)';
    ctx.lineWidth = snd.strong ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(xx, sb.y + (snd.strong ? 0 : 3));
    ctx.lineTo(xx, sb.y + sb.h - (snd.strong ? 0 : 3));
    ctx.stroke();
    ctx.fillStyle = COLORS.label;
    ctx.fillText(snd.id, xx + 9, sb.y + sb.h - 2);
  }

  // Interval labels.
  ctx.fillStyle = COLORS.text;
  ctx.font = '7.5px "DM Sans", sans-serif';
  for (const interval of CARDIAC_INTERVALS) {
    const x0 = xU(interval.start);
    const x1 = interval.end >= 1 ? right : xU(interval.end);
    const short = SHORT_LABELS[interval.id];
    if (x1 - x0 > 30) ctx.fillText(lang === 'tr' ? short.tr : short.en, (x0 + x1) / 2, bands.pressure.y + bands.pressure.h - 4);
  }

  // Phase cursor at the real-time position of the current physiologic phase.
  const xc = xU(state?.phase ?? 0);
  ctx.strokeStyle = COLORS.cursor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xc, top - 6);
  ctx.lineTo(xc, top + drawable);
  ctx.stroke();
  ctx.fillStyle = COLORS.cursor;
  ctx.beginPath();
  ctx.arc(xc, top - 6, 3, 0, Math.PI * 2);
  ctx.fill();

  return { left, width: plotW };
}

/** Map a pointer x on the diagram to a physiologic phase. */
export function wiggersPhaseAt(canvas, clientX, bpm) {
  const rect = canvas.getBoundingClientRect();
  const tau = Math.min(1, Math.max(0, (clientX - rect.left - 8) / (rect.width - 16)));
  return timeToPhase(tau, bpm);
}

/** Caption text: cycle / systole / diastole seconds at the current BPM. */
export function formatCycleTiming(bpm, lang = 'tr') {
  const { cycleSec, systoleSec, diastoleSec } = cycleTiming(bpm);
  const f = v => `${v.toFixed(2)}s`;
  return lang === 'tr'
    ? `Döngü ${f(cycleSec)} · Sistol ${f(systoleSec)} · Diyastol ${f(diastoleSec)} (${bpm}/dk)`
    : `Cycle ${f(cycleSec)} · Systole ${f(systoleSec)} · Diastole ${f(diastoleSec)} (${bpm}/min)`;
}

// ---------------------------------------------------------------------------
// Catheterization: per-station pressure tracings (Netter-style normals).
// Right-heart shapes reuse the left-heart generators, rescaled to the
// low-pressure circuit; the wedge mirrors LA pressure slightly delayed.
// ---------------------------------------------------------------------------

function rescale(fn, srcMin, srcMax, dstMin, dstMax) {
  return t => dstMin + (fn(t) - srcMin) / (srcMax - srcMin) * (dstMax - dstMin);
}

export const CATH_STATIONS = {
  'cath-ra': {
    side: 'right',
    label: { tr: 'Sağ atriyum', en: 'Right atrium' },
    normal: { tr: 'ort < 5 mmHg', en: 'mean < 5 mmHg' },
    sat: 75,
    range: [0, 15],
    fn: rescale(atrialPressure, 4, 12, 1, 7)
  },
  'cath-rv': {
    side: 'right',
    label: { tr: 'Sağ ventrikül', en: 'Right ventricle' },
    normal: { tr: 'sistolik < 25 / diyastolik < 5', en: 'systolic < 25 / diastolic < 5' },
    sat: 75,
    range: [0, 30],
    fn: rescale(ventricularPressure, 6, 122, 3, 24)
  },
  'cath-pa': {
    side: 'right',
    label: { tr: 'Pulmoner arter', en: 'Pulmonary artery' },
    normal: { tr: 'sist < 25 / diy < 10 · ort < 15', en: 'sys < 25 / dia < 10 · mean < 15' },
    sat: 75,
    range: [0, 30],
    fn: rescale(aorticPressure, 72, 122, 9, 24)
  },
  'cath-wedge': {
    side: 'right',
    label: { tr: 'Pulmoner wedge (PCWP)', en: 'Pulmonary wedge (PCWP)' },
    normal: { tr: 'ort < 12 mmHg (LA yansıması)', en: 'mean < 12 mmHg (reflects LA)' },
    sat: 97,
    range: [0, 20],
    fn: t => rescale(atrialPressure, 4, 12, 5, 13)(((t - 0.06) % 1 + 1) % 1)
  },
  'cath-lv': {
    side: 'left',
    label: { tr: 'Sol ventrikül', en: 'Left ventricle' },
    normal: { tr: 'sistolik < 120 / diyastolik < 8', en: 'systolic < 120 / diastolic < 8' },
    sat: 95,
    range: [0, 140],
    fn: ventricularPressure
  },
  'cath-ao': {
    side: 'left',
    label: { tr: 'Aort', en: 'Aorta' },
    normal: { tr: 'sistolik < 120 / diyastolik < 80', en: 'systolic < 120 / diastolic < 80' },
    sat: 95,
    range: [40, 140],
    fn: aorticPressure
  }
};

/** Draw one station's pressure tracing with a small ECG lane and phase cursor. */
export function drawCathTracing(canvas, stationId, state, lang = 'tr') {
  const station = CATH_STATIONS[stationId];
  if (!canvas || !station) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 260;
  const cssH = canvas.clientHeight || 150;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rightSide = station.side === 'right';
  ctx.fillStyle = rightSide ? '#e8f1f7' : '#f9ecec';
  ctx.fillRect(0, 0, cssW, cssH);

  const left = 30, right = cssW - 6, top = 20;
  const plotW = right - left;
  const hTrace = (cssH - top - 6) * 0.72;
  const hEcg = (cssH - top - 6) - hTrace - 4;
  const [pMin, pMax] = station.range;
  const x = t => left + t * plotW;
  const yP = v => top + hTrace - ((v - pMin) / (pMax - pMin)) * hTrace;
  const yE = v => top + hTrace + 4 + hEcg - ((v + 0.35) / 1.4) * hEcg;

  // Scale gridlines.
  ctx.strokeStyle = 'rgba(60,90,80,0.15)';
  ctx.fillStyle = '#5c7267';
  ctx.font = '8px "DM Sans", sans-serif';
  ctx.textAlign = 'right';
  const stepV = pMax - pMin > 60 ? 40 : pMax - pMin > 25 ? 10 : 5;
  for (let v = Math.ceil(pMin / stepV) * stepV; v <= pMax; v += stepV) {
    ctx.beginPath();
    ctx.moveTo(left, yP(v));
    ctx.lineTo(right, yP(v));
    ctx.stroke();
    ctx.fillText(String(v), left - 3, yP(v) + 3);
  }

  // Pressure curve + ECG on the real-time axis (same warp as the Wiggers strip).
  const bpm = state?.bpm || 72;
  const rhythm = state?.rhythm || 'sinus';
  const color = rightSide ? '#2e6f9e' : '#c23a4f';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const tau = i / 240;
    const yy = yP(station.fn(timeToPhase(tau, bpm)));
    if (i === 0) ctx.moveTo(x(tau), yy);
    else ctx.lineTo(x(tau), yy);
  }
  ctx.stroke();
  ctx.strokeStyle = '#3f7d5f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const tau = i / 240;
    const yy = yE(ecgValue(timeToPhase(tau, bpm), rhythm));
    if (i === 0) ctx.moveTo(x(tau), yy);
    else ctx.lineTo(x(tau), yy);
  }
  ctx.stroke();

  // Header: station, normals, saturation.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#31473d';
  ctx.font = '700 10px "DM Sans", sans-serif';
  const labelText = station.label[lang] || station.label.tr;
  ctx.fillText(labelText, left, 12);
  ctx.font = '9px "DM Sans", sans-serif';
  ctx.fillStyle = '#5c7267';
  ctx.textAlign = 'right';
  const normal = station.normal[lang] || station.normal.tr;
  const normalText = `${normal} · O₂ %${station.sat}`;
  const labelWidth = ctx.measureText(labelText).width;
  const normalWidth = ctx.measureText(normalText).width;
  if (left + labelWidth + 10 > right - normalWidth) {
    ctx.fillText(`O₂ %${station.sat}`, right, 12);
  } else {
    ctx.fillText(normalText, right, 12);
  }
  ctx.textAlign = 'left';

  // Phase cursor at the real-time position of the current phase.
  const phase = phaseToTime(((state?.phase ?? 0) % 1 + 1) % 1, bpm);
  ctx.strokeStyle = '#e0524d';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x(phase), top - 3);
  ctx.lineTo(x(phase), cssH - 4);
  ctx.stroke();
}
