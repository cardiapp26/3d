import { getLesion, lesionColorJet } from './echo-valve-disease.js';
import { CYCLE_SYNC } from './cardiac-cycle.js';

/*
 * Per-frame valve pathology overlay for the echo image: the diseased valve's
 * look (thickening, calcification) and the colour Doppler jets of the current
 * cardiac phase. Pure: the heart's cycle phase (0 = start of rapid filling,
 * QRS at CYCLE_SYNC.qrsOnset) is turned into the RR fraction of the Doppler
 * model (QRS = 0). With a normal heart and colour on, laminar mitral inflow
 * (diastole) and LVOT outflow (systole) are shown.
 */

/** RR fraction (QRS = 0) of a heart cycle phase. */
export const rrFraction = (phase) => ((((phase - CYCLE_SYNC.qrsOnset) % 1) + 1) % 1);

/** Jet envelope 0..1 inside a phase window [a, b] of the RR interval (b > 1 wraps). */
export function windowStrength(rr, window, plateau = 1.6) {
  if (!window) return 0;
  const [a, b] = window;
  let t = rr;
  if (t < a) t += 1;
  if (t < a || t > b) return 0;
  return Math.min(1, Math.sin(Math.PI * ((t - a) / (b - a))) * plateau);
}

// Normal laminar flows (RR fractions): mitral E/A filling and LVOT ejection.
const NORMAL_FLOWS = Object.freeze([
  { valve: 'mitral', originId: 'mitral-annulus', to: 'lv', window: [0.5, 0.98], widthFrac: 0.8, lengthFrac: 0.45 },
  { valve: 'aortic-valve', to: 'aorta', from: 'lv', antegrade: true, window: [0.08, 0.42], widthFrac: 0.8, lengthFrac: 0.4 }
]);

/**
 * @param {string} lesionId VALVE_LESIONS id
 * @param {number} phase heart cycle phase 0..1
 * @param {{ color?: boolean, lang?: 'tr'|'en' }} opts
 * @returns {{ valveStyle: object|null, jets: object[], rr: number }}
 */
export function pathologyOverlay(lesionId, phase, { color = true, lang = 'tr' } = {}) {
  const rr = rrFraction(phase);
  const lesion = getLesion(lesionId);
  const out = { valveStyle: null, jets: [], rr };
  if (!lesion || lesion.id === 'normal') {
    if (color) {
      for (const f of NORMAL_FLOWS) {
        const strength = windowStrength(rr, f.window, 1.3);
        if (strength > 0) out.jets.push({ ...f, strength, mosaic: false, aliasingCms: 60 });
      }
    }
    return out;
  }
  const m = lesion.morphology || {};
  out.valveStyle = { ids: [lesion.valve], thickening: m.thickening || 0, calcification: m.calcification || 0 };
  if (!color) return out;
  const cj = lesionColorJet(lesion.id);
  if (!cj?.active) return out;
  const strength = windowStrength(rr, cj.phaseWindow, cj.direction === 'regurgitant' ? 2.2 : 1.6);
  out.jets.push({
    valve: lesion.valve,
    to: cj.to,
    from: cj.from,
    antegrade: cj.direction === 'antegrade',
    strength,
    widthFrac: cj.widthFrac,
    lengthFrac: cj.lengthFrac,
    eccentric: cj.eccentric || 0,
    // Anteriorly directed (flail posterior leaflet): toward the aortic root, else medially (atrial septum side).
    towardId: cj.eccentric ? ['aortic-valve', 'ra'] : undefined,
    originId: lesion.valve === 'mitral' ? 'mitral-annulus' : undefined,
    mosaic: cj.mosaic,
    pisaCm: cj.pisa?.radiusCm || 0,
    vcMm: cj.vcMm || 0,
    kind: lesion.kind,
    aliasingCms: cj.pisa?.aliasingCms ?? cj.aliasingCms,
    label: lesion.short[lang === 'en' ? 'en' : 'tr']
  });
  return out;
}
