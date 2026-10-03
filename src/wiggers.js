import { CARDIAC_INTERVALS, CYCLE_SYNC, phaseToTime, timeToPhase, cycleSeconds } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';

/**
 * Procedural Wiggers diagram on the shared cycle clock. Curves are schematic
 * teaching shapes (typical adult values), not patient data.
 *
 * Consistency rules (checked by scripts/test-wiggers.mjs):
 * - Valve events are the template interval boundaries used by the panel and
 *   the ECG strip: mitral closes 0.45 (S1), aortic opens 0.53, aortic closes
 *   0.88 (S2, end of T), mitral opens 0.00/1.00. QRS onset (0.41) precedes
 *   S1; the P wave (0.27) precedes atrial contraction (0.32).
 * - Each event sits on the matching pressure crossing.
 * - Mitral open: LA > LV. Aortic closed: aortic pressure never rises above
 *   its closure value (dicrotic notch = dip, then a small peak below it).
 * - Curves take the physiologic phase u; the diagram x axis is real time,
 *   so rate changes reshape the curves (diastasis is consumed first).
 */

const S = CYCLE_SYNC;
// Valve events are the shared clock's interval boundaries.
export const EVENTS = Object.freeze({
  mitralOpen: 0.0,
  mitralClose: S.ivcStart,
  aorticOpen: S.ejectionStart,
  aorticClose: S.ivrStart
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

/**
 * Pressure profile (mmHg) of the curves. The default is the textbook normal
 * the strip has always drawn; a hemodynamic scenario (cath mode) gives its
 * own station targets through profileFromStations, so the strip and the
 * catheter tracings show the same numbers.
 * aoOpen: aortic diastolic at valve opening; aoClose: at S2; aoSys: aortic
 * systolic (below lvPeak with an outflow gradient); avOpen: LA = LV at mitral
 * opening (v-wave peak); lvedp: with an atrial kick (AFib: 4 lower).
 */
export const DEFAULT_PROFILE = Object.freeze({ lvPeak: 122, aoSys: 122, aoOpen: 80, aoClose: 96, avOpen: 12, lvedp: 11 });

/** Profile from hemodynamic station targets ({ lv, ao, pcwp }, hemo-scenarios.js). */
export function profileFromStations(stations) {
  const lv = stations?.lv, ao = stations?.ao, pcwp = stations?.pcwp;
  if (!lv || !ao) return DEFAULT_PROFILE;
  const aoOpen = ao.diastolic, aoSys = Math.min(ao.systolic, lv.systolic);
  return Object.freeze({
    lvPeak: lv.systolic, aoSys, aoOpen,
    aoClose: aoOpen + 0.4 * (aoSys - aoOpen),
    avOpen: Math.max(pcwp?.v ?? lv.edp + 1, lv.edp + 1),
    lvedp: lv.edp
  });
}

const hasAtrialKick = rhythm => rhythm !== 'afib';
const edpOf = (p, rhythm) => (hasAtrialKick(rhythm) ? p.lvedp : Math.max(3, p.lvedp - 4));

/** Left ventricular pressure (mmHg) at physiologic phase u. */
export function ventricularPressure(u, rhythm = 'sinus', p = DEFAULT_PROFILE) {
  const uu = wrap(u);
  const lvedp = edpOf(p, rhythm);
  const k = p.lvedp / DEFAULT_PROFILE.lvedp;   // diastolic shape scales with the filling pressure
  if (uu < EVENTS.mitralClose) {
    // Diastole: early drop below LA (suction), slow rise, atrial kick to LVEDP.
    return through([
      [0.0, p.avOpen],
      [0.06, 3.5 * k],
      [0.18, 4.8 * k],
      [0.32, 5.8 * k],
      [0.42, hasAtrialKick(rhythm) ? 9.6 * k : 6.6 * k],
      [EVENTS.mitralClose, lvedp]
    ], uu);
  }
  // Systole keeps its slope through the valve events (smoothstep would
  // flatten LV at opening and closure, breaking the pressure crossings).
  if (uu < EVENTS.aorticOpen) {
    const f = (uu - EVENTS.mitralClose) / (EVENTS.aorticOpen - EVENTS.mitralClose);
    return lvedp + (p.aoOpen - lvedp) * Math.pow(f, 1.6);     // isovolumetric contraction
  }
  if (uu < S.ejectionPeak) {
    const f = (uu - EVENTS.aorticOpen) / (S.ejectionPeak - EVENTS.aorticOpen);
    return p.aoOpen + (p.lvPeak - p.aoOpen) * (1 - (1 - f) * (1 - f)); // rapid ejection
  }
  if (uu < EVENTS.aorticClose) {
    const f = (uu - S.ejectionPeak) / (EVENTS.aorticClose - S.ejectionPeak);
    return p.lvPeak - (p.lvPeak - p.aoClose) * Math.pow(f, 2.2);        // reduced ejection
  }
  // Isovolumetric relaxation: steep exponential fall to the LA v-wave level.
  const decay = Math.exp(-(uu - EVENTS.aorticClose) / 0.022);
  const tail = Math.exp(-(1 - EVENTS.aorticClose) / 0.022);
  return p.avOpen + (p.aoClose - p.avOpen) * (decay - tail) / (1 - tail);
}

/** Aortic pressure (mmHg). */
export function aorticPressure(u, rhythm = 'sinus', p = DEFAULT_PROFILE) {
  const uu = wrap(u);
  if (uu >= EVENTS.aorticOpen && uu <= EVENTS.aorticClose) {
    // LV slightly above aorta early in ejection, slightly below late; the two
    // cross exactly at opening, at the peak and at closure. An outflow
    // gradient (LV peak above aortic systolic) opens between them mid-ejection.
    const lv = ventricularPressure(uu, rhythm, p);
    const early = uu < S.ejectionPeak ? -2 * Math.sin(Math.PI * (uu - EVENTS.aorticOpen) / (S.ejectionPeak - EVENTS.aorticOpen)) : 0;
    const late = uu >= S.ejectionPeak ? 2.5 * Math.sin(Math.PI * (uu - S.ejectionPeak) / (EVENTS.aorticClose - S.ejectionPeak)) : 0;
    const f = (uu - EVENTS.aorticOpen) / (EVENTS.aorticClose - EVENTS.aorticOpen);
    const fp = (S.ejectionPeak - EVENTS.aorticOpen) / (EVENTS.aorticClose - EVENTS.aorticOpen);
    const gradient = Math.max(0, p.lvPeak - p.aoSys) * Math.sin(Math.PI * f) / Math.sin(Math.PI * fp);
    return lv + early + late - gradient;
  }
  // Closed: runoff from the closure value down to the opening value.
  const s = wrap(uu - EVENTS.aorticClose);
  const span = 1 - (EVENTS.aorticClose - EVENTS.aorticOpen);
  const runoff = p.aoClose - (p.aoClose - p.aoOpen) * Math.pow(s / span, 0.85);
  const notch = 5 * gauss(s, 0.012, 0.006);   // incisura: dip right after closure
  const bump = 1.2 * gauss(s, 0.032, 0.009);  // dicrotic wave, stays below the closure value
  return runoff - notch + bump;
}

/** Left atrial pressure (mmHg): a, c, v waves with x and y descents. */
export function atrialPressure(u, rhythm = 'sinus', p = DEFAULT_PROFILE) {
  const uu = wrap(u);
  const kick = hasAtrialKick(rhythm);
  const k = p.lvedp / DEFAULT_PROFILE.lvedp;
  if (uu < EVENTS.mitralClose) {
    // Mitral open: LA sits just above LV, forward gradient into the ventricle.
    // The gradient builds from zero at opening, so LA = LV at the crossing (no step at the cycle wrap).
    const lv = ventricularPressure(uu, rhythm, p);
    const opening = smoothstep(0, 0.012, uu);
    const yDescent = 3.2 * Math.exp(-uu / 0.03) * opening;
    const aWave = kick ? 2.6 * gauss(uu, 0.405, 0.022) : 0;
    const close = 1 - smoothstep(0.43, EVENTS.mitralClose, uu); // gradient -> 0 at closure
    return lv + (1.3 * opening + yDescent + aWave) * close;
  }
  // Mitral closed: c wave, x descent, then the v wave building to opening.
  const cWave = 2.2 * gauss(uu, S.qrsPeak + 0.02, 0.012);
  const base = through([
    [EVENTS.mitralClose, edpOf(p, rhythm)],
    [0.5, 6.5 * k],
    [0.6, 4.2 * k],         // x descent
    [EVENTS.aorticClose, 9.5 * k],
    [1.0, p.avOpen]         // v wave peak at mitral opening
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
    { id: 'S1', u: EVENTS.mitralClose, strong: true },
    { id: 'S2', u: EVENTS.aorticClose, strong: true },
    // S3 and S4 are drawn at their timing for teaching; often not heard in adults (optional, dashed).
    { id: 'S3', u: 0.06, strong: false, optional: true }
  ];
  if (hasAtrialKick(rhythm)) list.push({ id: 'S4', u: 0.425, strong: false, optional: true });
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
  // Same colours as the catheter channels (hemodynamics.js): LV red, Ao dark, LA amber like the PCWP.
  ventricular: '#d23a4f',
  aortic: '#2f3a36',
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
export function drawWiggers(canvas, state, lang = 'tr', profile = DEFAULT_PROFILE) {
  const p = profile || DEFAULT_PROFILE;
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
    pressure: { y: top, h: hPressure, min: 0, max: Math.max(130, Math.ceil((p.lvPeak + 10) / 10) * 10) },
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
      const yy = yIn(band, fn(u, rhythm, p));
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
  // Tags sit on their curve at the right edge (LV just below, LA just above: they meet there).
  const end = timeToPhase(0.985, bpm);
  tagAt(lang === 'tr' ? 'Aort' : 'Aortic', bands.pressure, aorticPressure(end, rhythm, p), COLORS.aortic);
  tagAt('LV', bands.pressure, ventricularPressure(end, rhythm, p) - 6, COLORS.ventricular);
  tagAt('LA', bands.pressure, atrialPressure(end, rhythm, p) + 4, COLORS.atrial);
  tagAt(lang === 'tr' ? 'LV hacim' : 'LV volume', bands.volume, ventricularVolume(end, rhythm), COLORS.volume);
  tagAt('EKG', bands.ecg, ecgValue(end, rhythm) + 0.25, COLORS.ecg);
  // Axis units at the top left of each band.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`mmHg (0–${bands.pressure.max})`, left + 3, bands.pressure.y + 9);
  ctx.fillText('ml', left + 3, bands.volume.y + 9);
  ctx.textAlign = 'right';

  // Valve events at their pressure crossings.
  const events = [
    [EVENTS.mitralClose, lang === 'tr' ? 'MV kapanır' : 'MV closes', ventricularPressure(EVENTS.mitralClose, rhythm, p)],
    [EVENTS.aorticOpen, lang === 'tr' ? 'Ao açılır' : 'Ao opens', p.aoOpen],
    [EVENTS.aorticClose, lang === 'tr' ? 'Ao kapanır' : 'Ao closes', p.aoClose],
    [EVENTS.mitralOpen, lang === 'tr' ? 'MV açılır' : 'MV opens', p.avOpen]
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
    ctx.setLineDash(snd.optional ? [2, 2] : []);
    ctx.beginPath();
    ctx.moveTo(xx, sb.y + (snd.strong ? 0 : 3));
    ctx.lineTo(xx, sb.y + sb.h - (snd.strong ? 0 : 3));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.label;
    ctx.fillText(snd.optional ? `(${snd.id})` : snd.id, xx + (snd.optional ? 12 : 9), sb.y + sb.h - 2);
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
    ? `Döngü ${f(cycleSec)} · Sistol ${f(systoleSec)} · Diyastol ${f(diastoleSec)} (${bpm}/dk) · (S3), (S4): zamanlama gösterimi, erişkinde çoğu kez duyulmaz`
    : `Cycle ${f(cycleSec)} · Systole ${f(systoleSec)} · Diastole ${f(diastoleSec)} (${bpm}/min) · (S3), (S4): timing shown for teaching, often not heard in adults`;
}
