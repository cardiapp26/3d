// Interactive LV pressure-volume loop model for teaching (time-varying
// elastance framework of Suga and Sagawa). Four controls: preload (EDV),
// contractility (ESPVR slope Ees), afterload (arterial elastance Ea) and
// diastolic stiffness (EDPVR exponent). Ventricular-arterial coupling gives
// the end-systolic point: ESV = (Ees·V0 + Ea·EDV) / (Ees + Ea). Condition
// presets are didactic parameter sets chosen to reproduce the textbook loop
// shapes, not patient data or fitted values. The output has the shape that
// drawPvLoop (hemo-pv-loop.js) draws.

import { CYCLE_SYNC as S } from './cardiac-cycle.js';

export const PV_V0 = 10;   // unstressed volume (ml)
export const PV_LIMITS = Object.freeze({
  edv: [60, 280], ees: [0.4, 5], ea: [0.5, 5], stiffness: [0.01, 0.06]
});
// Filling pressure the stiffness slider can reach at a condition's reference volume (mmHg).
const REFERENCE_EDP = [2, 35];
// Share of the total stroke volume that leaks back: into the left atrium during
// isovolumic contraction (acute MR) or from the aorta during relaxation (AR).
export const PV_LEAK = Object.freeze({ mr: 0.4, ar: 0.3 });
const LEAK = PV_LEAK;
// Filling pressures beyond this grow only logarithmically: a ventricle that fills this far is in pulmonary oedema,
// and the exponential EDPVR would otherwise reach hundreds of mmHg at the slider extremes.
const EDP_SOFT = 40, EDP_SOFT_SCALE = 15;
const softEdp = p => (p <= EDP_SOFT ? p : EDP_SOFT + EDP_SOFT_SCALE * Math.log1p((p - EDP_SOFT) / EDP_SOFT_SCALE));

/**
 * Condition presets. edp: end-diastolic pressure the EDPVR passes through at
 * the preset EDV (sets the EDPVR scale); valve: 'mr' (no true isovolumic
 * contraction, ejection into the left atrium starts with the mitral valve
 * incompetent), 'ar' (no true isovolumic relaxation, the aorta refills the
 * ventricle), 'as' (an LV-aortic systolic gradient raises the LV pressure).
 */
export const PV_PRESETS = Object.freeze({
  // Normal matches the catheter scenario's normal (EDV 130, SV 81, EF 63%, ESP 90, Ees 2.3, Ea 1.1).
  normal: { edv: 130, ees: 2.34, ea: 1.11, stiffness: 0.025, edp: 10 },
  'hfref-decompensated': { edv: 220, ees: 0.6, ea: 1.9, stiffness: 0.02, edp: 28 },
  hfpef: { edv: 110, ees: 3.5, ea: 2.2, stiffness: 0.045, edp: 25 },
  'aortic-stenosis': { edv: 125, ees: 3.5, ea: 2.6, stiffness: 0.03, edp: 20, valve: 'as' },
  'aortic-regurgitation': { edv: 230, ees: 1.8, ea: 1.0, stiffness: 0.018, edp: 14, valve: 'ar' },
  'mitral-regurgitation-acute': { edv: 160, ees: 2.5, ea: 0.9, stiffness: 0.03, edp: 25, valve: 'mr' },
  // Hypovolaemia and the inotrope sit on the normal EDPVR (same stiffness; EDP read off the normal curve at their EDV).
  hypovolemia: { edv: 80, ees: 2.34, ea: 1.4, stiffness: 0.025, edp: 2.5 },
  inotrope: { edv: 130, ees: 4.5, ea: 1.3, stiffness: 0.025, edp: 10 }
});

// Peak systolic pressure over the end-systolic (aortic closure) pressure: the ESP sits below the peak.
const PEAK_OVER_ESP = 1.25;

/** Amplitude of the sinusoidal arch over the open-to-ESP line so the highest ejection pressure equals `peak`. */
function archAmplitude(open, esp, peak) {
  const top = amp => {
    let max = 0;
    for (let i = 0; i <= 48; i++) { const f = i / 48; max = Math.max(max, open + (esp - open) * f + amp * Math.sin(Math.PI * f)); }
    return max;
  };
  let lo = 0, hi = Math.max(peak, 1);
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (top(mid) > peak) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Number(v)));
/** Preset values overridden by the finite numeric entries of `input` only (undefined, NaN and text are ignored). */
const merged = (base, input) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(input || {})) if (key in base && typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  return out;
};

/** Validated parameter set (unknown preset falls back to normal). */
export function pvParams(input = {}, presetId = 'normal') {
  const base = PV_PRESETS[presetId] || PV_PRESETS.normal;
  const p = merged(base, input);
  const edv = clamp(p.edv, PV_LIMITS.edv);
  const stiffness = clamp(p.stiffness, PV_LIMITS.stiffness);
  // EDPVR scale: the curve passes through the condition's reference volume at a pressure that follows
  // the stiffness slider in proportion (bounded to a filling-pressure range), so the slider lifts the
  // curve without the exponential blow-up of a fixed scale and moving the preload slider walks along it.
  const refEdp = clamp(base.edp * stiffness / base.stiffness, REFERENCE_EDP);
  const scale = refEdp / (Math.exp(stiffness * (base.edv - PV_V0)) - 1);
  return {
    edv, stiffness, scale,
    ees: clamp(p.ees, PV_LIMITS.ees),
    ea: clamp(p.ea, PV_LIMITS.ea),
    valve: base.valve || null
  };
}

/**
 * Build one loop.
 * @returns {object} drawPvLoop data: points ({u, v, p}), edv, esv, sv (total stroke volume), ef, esp, peak, edp, ees, ea (ESP / SV of the drawn loop),
 * regurgVolume and forwardSv (leaking lesions), v0, espvr, edpvr, strokeWork, counterclockwise, forwardOnly, phases
 */
export function pvModelLoop(params, n = 240) {
  const { edv, ees, ea, stiffness, scale, valve } = params;
  const edpvr = v => Math.max(0, softEdp(scale * (Math.exp(stiffness * (v - PV_V0)) - 1)));
  const espvr = v => Math.max(0, ees * (v - PV_V0));
  const esv = Math.max(PV_V0 + 5, (ees * PV_V0 + ea * edv) / (ees + ea));
  const esp = espvr(esv);
  const edp = edpvr(edv);
  const sv = edv - esv;
  // Aortic valve opening pressure: diastolic arterial pressure, a fraction of the end-systolic pressure.
  // The ejection arch follows the end-systolic pressure; a filling pressure above that only nudges the opening point.
  const open = Math.max(edp + 2, Math.min(Math.max(edp + 5, esp * 0.78), esp * 0.9));
  const gradient = valve === 'as' ? esp * 0.2 : 0;
  const peak = Math.max(esp, open) * PEAK_OVER_ESP + gradient;
  const arch = archAmplitude(open, esp, peak);
  // Aortic regurgitation refills the ventricle during relaxation, so filling starts from that volume and the loop closes.
  const leak = (LEAK[valve] || 0) * sv;
  const refill = valve === 'ar' ? leak : 0;
  const vStart = esv + refill;
  const fillEnd = edpvr(vStart) + 1;

  const seg = { ivc: [S.ivcStart, S.ejectionStart], ej: [S.ejectionStart, S.ivrStart], ivr: [S.ivrStart, 1] };
  const points = [];
  for (let i = 0; i < n; i++) {
    const u = i / n;
    let v, p;
    if (u < seg.ivc[0]) {
      // Filling along the EDPVR from the end-systolic volume to the EDV.
      const f = u / seg.ivc[0];
      v = vStart + (edv - vStart) * (1 - Math.pow(1 - f, 1.6));
      p = Math.max(edpvr(v), fillEnd * (1 - f) + edpvr(v) * f * 0.98);
    } else if (u < seg.ivc[1]) {
      // Isovolumic contraction; with mitral regurgitation the volume already falls (no isovolumic phase).
      const f = (u - seg.ivc[0]) / (seg.ivc[1] - seg.ivc[0]);
      v = valve === 'mr' ? edv - leak * f : edv;
      p = edp + (open - edp) * Math.pow(f, 1.4);
    } else if (u < seg.ej[1]) {
      // Ejection: volume falls from the opening volume to the ESV, pressure arches over the peak.
      const f = (u - seg.ej[0]) / (seg.ej[1] - seg.ej[0]);
      const v0 = valve === 'mr' ? edv - leak : edv;
      v = v0 - (v0 - esv) * (1 - Math.pow(1 - f, 1.8));
      p = open + (esp - open) * f + arch * Math.sin(Math.PI * f);
    } else {
      // Isovolumic relaxation; with aortic regurgitation the ventricle refills during relaxation.
      const f = (u - seg.ivr[0]) / (seg.ivr[1] - seg.ivr[0]);
      v = esv + refill * f;
      p = fillEnd + (esp - fillEnd) * Math.pow(1 - f, 2.2);
    }
    points.push({ u, v, p });
  }
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i + 1) % n];
    area += (a.v * b.p - b.v * a.p) / 2;
  }
  return {
    points, edv, esv, sv, ef: sv / edv, esp, peak: Math.max(...points.map(q => q.p)), edp, ees,
    // The ESV floor can bind at extreme settings; the labelled Ea is then the drawn loop's ESP / SV.
    ea: esp / sv, v0: PV_V0, regurgVolume: leak, forwardSv: sv - leak,
    espvr, edpvr, strokeWork: Math.abs(area), counterclockwise: area > 0,
    forwardOnly: false, valve,
    phases: { ivc: seg.ivc, ejection: seg.ej, ivr: seg.ivr }
  };
}
