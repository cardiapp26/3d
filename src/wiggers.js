import { CARDIAC_INTERVALS, CYCLE_SYNC } from './cardiac-cycle.js';

/**
 * Procedural Wiggers diagram, drawn from the same normalized cycle clock as
 * the 3D animation and the ECG strip. Curves are schematic teaching shapes
 * (typical adult values), not patient data.
 */

const S = CYCLE_SYNC;

function gauss(t, center, width) {
  const d = Math.min(Math.abs(t - center), 1 - Math.abs(t - center));
  return Math.exp(-(d * d) / (2 * width * width));
}

function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** Left ventricular pressure (mmHg) at normalized phase t. */
export function ventricularPressure(t) {
  const base = 6 + 6 * gauss(t, S.pPeak + 0.03, 0.035); // atrial kick transmitted
  const rise = smoothstep(S.ivcStart, S.semilunarOpen, t);
  const fall = 1 - smoothstep(S.semilunarCloseStart, S.ivrStart + 0.08, t);
  const systolic = 118 * Math.sin(Math.PI * Math.min(1, Math.max(0,
    (t - S.ivcStart) / (S.ivrStart + 0.06 - S.ivcStart)))) ** 1.15;
  return Math.max(base, base + systolic * rise * fall);
}

/** Aortic pressure (mmHg): diastolic runoff plus the ejection pulse. */
export function aorticPressure(t) {
  // Diastolic decay from ~95 after valve closure toward ~78 at the next opening.
  const sinceClose = ((t - S.semilunarCloseStart) % 1 + 1) % 1;
  const runoff = 95 - 17 * (sinceClose / (1 - (S.semilunarCloseStart - S.semilunarOpen)));
  const open = t >= S.semilunarOpen - 0.005 && t <= S.semilunarCloseStart + 0.01;
  if (open) {
    return Math.max(runoff, ventricularPressure(t) - 1.5);
  }
  // Dicrotic notch just after closure.
  const notch = 6 * gauss(t, S.semilunarCloseStart + 0.018, 0.008);
  return Math.max(72, runoff) - notch + 8 * gauss(t, S.semilunarCloseStart + 0.035, 0.012);
}

/** Left atrial pressure (mmHg) with a, c and v waves. */
export function atrialPressure(t) {
  return 5
    + 5.5 * gauss(t, S.pPeak + 0.04, 0.03)              // a wave (atrial systole)
    + 2.5 * gauss(t, S.qrsPeak + 0.05, 0.02)            // c wave (AV valve bulge)
    + 4.0 * gauss(t, S.semilunarCloseStart - 0.02, 0.05); // v wave (atrial filling)
}

/** Left ventricular volume (ml): EDV ~120, ESV ~50. */
export function ventricularVolume(t) {
  const rapid = 50 + 45 * smoothstep(0, CARDIAC_INTERVALS[0].end, t);
  const diastasis = 10 * smoothstep(CARDIAC_INTERVALS[0].end, S.atrialStart + 0.05, t);
  const kick = 15 * smoothstep(S.atrialStart + 0.02, S.atrialEnd, t);
  const filled = rapid + diastasis + kick; // 120 at end-diastole
  const ejected = 70 * smoothstep(S.ejectionStart, S.semilunarCloseStart, t);
  return filled - ejected;
}

/** Schematic ECG (arbitrary units, roughly -0.3..1). */
export function ecgValue(t) {
  return 0.18 * gauss(t, S.pPeak, 0.022)
    - 0.16 * gauss(t, S.qrsPeak - 0.016, 0.006)
    + 1.0 * gauss(t, S.qrsPeak, 0.008)
    - 0.28 * gauss(t, S.qrsPeak + 0.017, 0.007)
    + 0.32 * gauss(t, S.tPeak, 0.03);
}

/** Systole/diastole split for a given BPM (model convention: IVC -> end of ejection). */
export function cycleTiming(bpm) {
  const cycleSec = 60 / bpm;
  const systoleFrac = S.ivrStart - S.ivcStart; // isovolumetric contraction + ejection
  return {
    cycleSec,
    systoleSec: cycleSec * systoleFrac,
    diastoleSec: cycleSec * (1 - systoleFrac)
  };
}

const SHORT_LABELS = {
  'rapid-filling': { en: 'Rapid inflow', tr: 'Hızlı doluş' },
  diastasis: { en: 'Diastasis', tr: 'Diyastaz' },
  'atrial-systole': { en: 'Atrial systole', tr: 'Atriyal sistol' },
  'isovolumetric-contraction': { en: 'Isovol. contraction', tr: 'İzovol. kasılma' },
  'ventricular-ejection': { en: 'Ejection', tr: 'Ejeksiyon' },
  'isovolumetric-relaxation': { en: 'Isovol. relaxation', tr: 'İzovol. gevşeme' }
};

const COLORS = {
  grid: 'rgba(93, 138, 120, 0.16)',
  boundary: 'rgba(63, 94, 82, 0.35)',
  cursor: '#e0524d',
  ventricular: '#d63a70',
  aortic: '#8a5fb0',
  atrial: '#b58a3c',
  volume: '#2e7fb8',
  ecg: '#3f7d5f',
  text: '#5c7267',
  label: '#3d5348'
};

/**
 * Draw the full diagram. `state` is the cardiac-cycle state ({phase, bpm}),
 * `lang` 'tr' | 'en'. Returns the plot's x-range so callers can map pointer
 * positions back to a phase.
 */
export function drawWiggers(canvas, state, lang = 'tr') {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 600;
  const cssH = canvas.clientHeight || 190;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const left = 8, right = cssW - 8, top = 14;
  const plotW = right - left;
  const x = t => left + t * plotW;

  // Bands: pressures (55%), volume (25%), ECG (20%) of the drawable height.
  const bandGap = 6;
  const drawable = cssH - top - 6;
  const hPressure = drawable * 0.53;
  const hVolume = drawable * 0.24;
  const hEcg = drawable - hPressure - hVolume - bandGap * 2;
  const bands = {
    pressure: { y: top, h: hPressure, min: 0, max: 130 },
    volume: { y: top + hPressure + bandGap, h: hVolume, min: 40, max: 130 },
    ecg: { y: top + hPressure + hVolume + bandGap * 2, h: hEcg, min: -0.35, max: 1.05 }
  };
  const yIn = (band, v) => band.y + band.h - ((v - band.min) / (band.max - band.min)) * band.h;

  // Interval boundaries + tinted current interval.
  const active = state?.interval?.id;
  for (const interval of CARDIAC_INTERVALS) {
    if (interval.id === active) {
      ctx.fillStyle = 'rgba(88, 156, 125, 0.10)';
      ctx.fillRect(x(interval.start), top - 4, (interval.end - interval.start) * plotW, drawable + 6);
    }
    ctx.strokeStyle = COLORS.boundary;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x(interval.start), top - 4);
    ctx.lineTo(x(interval.start), top + drawable);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Band separators.
  ctx.strokeStyle = COLORS.grid;
  for (const band of Object.values(bands)) {
    ctx.strokeRect(left, band.y, plotW, band.h);
  }

  function plot(fn, band, color, width = 1.6) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    const n = 240;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const yy = yIn(band, fn(t));
      if (i === 0) ctx.moveTo(x(t), yy);
      else ctx.lineTo(x(t), yy);
    }
    ctx.stroke();
  }

  plot(aorticPressure, bands.pressure, COLORS.aortic);
  plot(atrialPressure, bands.pressure, COLORS.atrial, 1.2);
  plot(ventricularPressure, bands.pressure, COLORS.ventricular, 1.8);
  plot(ventricularVolume, bands.volume, COLORS.volume, 1.8);
  plot(ecgValue, bands.ecg, COLORS.ecg, 1.4);

  // Curve tags (right edge).
  ctx.font = '600 8.5px "DM Sans", sans-serif';
  ctx.textAlign = 'right';
  const tag = (label, band, fn, color) => {
    ctx.fillStyle = color;
    ctx.fillText(label, right - 3, yIn(band, fn(0.985)) - 3);
  };
  tag(lang === 'tr' ? 'Aort' : 'Aortic', bands.pressure, aorticPressure, COLORS.aortic);
  tag(lang === 'tr' ? 'LV basınç' : 'LV pressure', bands.pressure, () => 26, COLORS.ventricular);
  tag(lang === 'tr' ? 'LA basınç' : 'LA pressure', bands.pressure, () => 3, COLORS.atrial);
  tag(lang === 'tr' ? 'LV hacim' : 'LV volume', bands.volume, ventricularVolume, COLORS.volume);
  tag('EKG', bands.ecg, () => 0.75, COLORS.ecg);

  // Valve events.
  ctx.fillStyle = COLORS.label;
  ctx.font = '600 8px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  const events = [
    [S.avCloseStart + 0.01, lang === 'tr' ? 'AV kapanır' : 'AV closes'],
    [S.semilunarOpen, lang === 'tr' ? 'Aort açılır' : 'Aortic opens'],
    [S.semilunarCloseStart, lang === 'tr' ? 'Aort kapanır' : 'Aortic closes'],
    [S.fillingOpenEnd - 0.05, lang === 'tr' ? 'AV açılır' : 'AV opens']
  ];
  events.forEach(([t, label], i) => {
    ctx.fillText(label, Math.min(Math.max(x(t), 34), right - 34), top - 5 + (i % 2) * 0);
  });

  // Interval labels along the bottom of the pressure band.
  ctx.fillStyle = COLORS.text;
  ctx.font = '7.5px "DM Sans", sans-serif';
  for (const interval of CARDIAC_INTERVALS) {
    const mid = (interval.start + interval.end) / 2;
    const short = SHORT_LABELS[interval.id];
    if ((interval.end - interval.start) * plotW > 46) {
      ctx.fillText(lang === 'tr' ? short.tr : short.en, x(mid), bands.pressure.y + bands.pressure.h - 4);
    }
  }

  // Phase cursor.
  const phase = ((state?.phase ?? 0) % 1 + 1) % 1;
  ctx.strokeStyle = COLORS.cursor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x(phase), top - 6);
  ctx.lineTo(x(phase), top + drawable);
  ctx.stroke();
  ctx.fillStyle = COLORS.cursor;
  ctx.beginPath();
  ctx.arc(x(phase), top - 6, 3, 0, Math.PI * 2);
  ctx.fill();

  return { left, width: plotW };
}

/** Caption text: cycle / systole / diastole seconds at the current BPM. */
export function formatCycleTiming(bpm, lang = 'tr') {
  const { cycleSec, systoleSec, diastoleSec } = cycleTiming(bpm);
  const f = v => `${v.toFixed(2)}s`;
  return lang === 'tr'
    ? `Döngü ${f(cycleSec)} · Sistol ${f(systoleSec)} · Diyastol ${f(diastoleSec)} (${bpm}/dk)`
    : `Cycle ${f(cycleSec)} · Systole ${f(systoleSec)} · Diastole ${f(diastoleSec)} (${bpm}/min)`;
}
