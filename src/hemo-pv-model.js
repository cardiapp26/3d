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

/**
 * Condition presets. edp: end-diastolic pressure the EDPVR passes through at
 * the preset EDV (sets the EDPVR scale); valve: 'mr' (no true isovolumic
 * contraction, ejection into the left atrium starts with the mitral valve
 * incompetent), 'ar' (no true isovolumic relaxation, the aorta refills the
 * ventricle), 'as' (an LV-aortic systolic gradient raises the LV pressure).
 */
export const PV_PRESETS = Object.freeze({
  normal: { edv: 120, ees: 2.5, ea: 1.6, stiffness: 0.025, edp: 10 },
  'hfref-decompensated': { edv: 220, ees: 0.6, ea: 1.9, stiffness: 0.02, edp: 28 },
  hfpef: { edv: 110, ees: 3.5, ea: 2.2, stiffness: 0.045, edp: 25 },
  'aortic-stenosis': { edv: 125, ees: 3.5, ea: 2.6, stiffness: 0.03, edp: 20, valve: 'as' },
  'aortic-regurgitation': { edv: 230, ees: 1.8, ea: 1.0, stiffness: 0.018, edp: 14, valve: 'ar' },
  'mitral-regurgitation-acute': { edv: 160, ees: 2.5, ea: 0.9, stiffness: 0.03, edp: 25, valve: 'mr' },
  hypovolemia: { edv: 80, ees: 2.5, ea: 1.6, stiffness: 0.025, edp: 4 },
  inotrope: { edv: 110, ees: 4.0, ea: 1.4, stiffness: 0.025, edp: 8 }
});

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Number(v)));

/** Validated parameter set (unknown preset falls back to normal). */
export function pvParams(input = {}, presetId = 'normal') {
  const base = PV_PRESETS[presetId] || PV_PRESETS.normal;
  const p = { ...base, ...input };
  const edv = clamp(p.edv, PV_LIMITS.edv);
  const stiffness = clamp(p.stiffness, PV_LIMITS.stiffness);
  // EDPVR scale from the preset's (EDV, EDP) pair, so moving the preload slider walks along the curve.
  const scale = base.edp / (Math.exp(base.stiffness * (base.edv - PV_V0)) - 1);
  return {
    edv, stiffness, scale,
    ees: clamp(p.ees, PV_LIMITS.ees),
    ea: clamp(p.ea, PV_LIMITS.ea),
    valve: base.valve || null
  };
}

/**
 * Build one loop.
 * @returns {object} drawPvLoop data: points ({u, v, p}), edv, esv, sv, ef, esp, edp, ees, ea, v0, espvr, edpvr, strokeWork, counterclockwise, forwardOnly, phases
 */
export function pvModelLoop(params, n = 240) {
  const { edv, ees, ea, stiffness, scale, valve } = params;
  const edpvr = v => Math.max(0, scale * (Math.exp(stiffness * (v - PV_V0)) - 1));
  const espvr = v => Math.max(0, ees * (v - PV_V0));
  const esv = Math.max(PV_V0 + 5, (ees * PV_V0 + ea * edv) / (ees + ea));
  const esp = espvr(esv);
  const edp = edpvr(edv);
  const sv = edv - esv;
  // Aortic valve opening pressure: diastolic arterial pressure, a fraction of the end-systolic pressure.
  const open = Math.max(edp + 5, esp * 0.78);
  const gradient = valve === 'as' ? esp * 0.2 : 0;
  const peak = Math.max(esp, open) * 1.12 + gradient;
  const fillEnd = edpvr(esv) + 1;

  const seg = { ivc: [S.ivcStart, S.ejectionStart], ej: [S.ejectionStart, S.ivrStart], ivr: [S.ivrStart, 1] };
  const points = [];
  for (let i = 0; i < n; i++) {
    const u = i / n;
    let v, p;
    if (u < seg.ivc[0]) {
      // Filling along the EDPVR from the end-systolic volume to the EDV.
      const f = u / seg.ivc[0];
      v = esv + (edv - esv) * (1 - Math.pow(1 - f, 1.6));
      p = Math.max(edpvr(v), fillEnd * (1 - f) + edpvr(v) * f * 0.98);
    } else if (u < seg.ivc[1]) {
      // Isovolumic contraction; with mitral regurgitation the volume already falls (no isovolumic phase).
      const f = (u - seg.ivc[0]) / (seg.ivc[1] - seg.ivc[0]);
      v = valve === 'mr' ? edv - sv * 0.25 * f : edv;
      p = edp + (open - edp) * Math.pow(f, 1.4);
    } else if (u < seg.ej[1]) {
      // Ejection: volume falls from the opening volume to the ESV, pressure arches over the peak.
      const f = (u - seg.ej[0]) / (seg.ej[1] - seg.ej[0]);
      const v0 = valve === 'mr' ? edv - sv * 0.25 : edv;
      v = v0 - (v0 - esv) * (1 - Math.pow(1 - f, 1.8));
      p = open + (esp - open) * f + (peak - Math.max(open, esp)) * Math.sin(Math.PI * f);
    } else {
      // Isovolumic relaxation; with aortic regurgitation the ventricle refills during relaxation.
      const f = (u - seg.ivr[0]) / (seg.ivr[1] - seg.ivr[0]);
      v = valve === 'ar' ? esv + sv * 0.18 * f : valve === 'mr' ? esv : esv;
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
    points, edv, esv, sv, ef: sv / edv, esp, edp, ees, ea, v0: PV_V0,
    espvr, edpvr, strokeWork: Math.abs(area), counterclockwise: area > 0,
    forwardOnly: false, valve,
    phases: { ivc: seg.ivc, ejection: seg.ej, ivr: seg.ivr }
  };
}
