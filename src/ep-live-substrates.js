/*
 * Substrates of the live EP laboratory (ep-live-model.js): activation
 * sequences per origin and the tissue parameters of each case. Designed
 * teaching timings (ms), not patient physiology or localization rules.
 */

// Atrial activation sequences: channel A times after the origin fires;
// avj: arrival at the AV junction; ap / aps: arrival at the left lateral /
// posteroseptal pathway insertion; p: surface P onset, pAmp: its polarity.
export const ORIGINS = Object.freeze({
  sinus: { hra: 0, 'his-p': 32, 'his-d': 35, 'cs-910': 45, 'cs-78': 55, 'cs-56': 63, 'cs-34': 72, 'cs-12': 80, avj: 35, ap: 75, aps: 40, p: 0, pAmp: 0.22 },
  hra: { hra: 2, 'his-p': 34, 'his-d': 37, 'cs-910': 47, 'cs-78': 57, 'cs-56': 65, 'cs-34': 74, 'cs-12': 82, avj: 37, ap: 77, aps: 42, p: 4, pAmp: 0.22 },
  'cs-prox': { 'cs-910': 2, 'cs-78': 12, 'his-d': 18, 'his-p': 20, 'cs-56': 22, 'cs-34': 32, 'cs-12': 42, hra: 55, avj: 15, ap: 40, aps: 5, p: 6, pAmp: -0.14 },
  'cs-dist': { 'cs-12': 2, 'cs-34': 12, 'cs-56': 22, 'cs-78': 32, 'cs-910': 42, 'his-d': 55, 'his-p': 57, hra: 80, avj: 55, ap: 5, aps: 45, p: 10, pAmp: 0.12 },
  // Retrograde over the fast pathway: His first, concentric.
  'avn-fast': { 'his-d': 0, 'his-p': -2, 'cs-910': 10, 'cs-78': 18, 'cs-56': 26, 'cs-34': 36, 'cs-12': 46, hra: 25, avj: 0, ap: 45, aps: 10, p: 5, pAmp: -0.15 },
  // Retrograde over the slow pathway: CS ostium first, still concentric.
  'avn-slow': { 'cs-910': 0, 'cs-78': 10, 'his-p': 13, 'his-d': 15, 'cs-56': 20, 'cs-34': 30, 'cs-12': 40, hra: 35, avj: 0, ap: 45, aps: 3, p: 5, pAmp: -0.15 },
  // Retrograde over a left lateral pathway: distal CS first, eccentric.
  'ap-left': { 'cs-12': 0, 'cs-34': 14, 'cs-56': 28, 'cs-78': 42, 'cs-910': 56, 'his-d': 62, 'his-p': 64, hra: 85, avj: 62, ap: 0, aps: 55, p: 10, pAmp: -0.15 },
  // Retrograde over a posteroseptal pathway: CS ostium first.
  'ap-ps': { 'cs-910': 0, 'cs-78': 12, 'his-d': 12, 'his-p': 14, 'cs-56': 22, 'cs-34': 32, 'cs-12': 42, hra: 40, avj: 5, ap: 45, aps: 0, p: 5, pAmp: -0.18 },
  // Left atrial focus (left superior pulmonary vein region): distal CS early, high RA late.
  'la-focus': { 'cs-12': 10, 'cs-34': 18, 'cs-56': 28, 'cs-78': 38, 'cs-910': 48, 'his-d': 55, 'his-p': 57, hra: 70, avj: 55, ap: 15, aps: 50, p: 0, pAmp: 0.2 },
  // Counterclockwise CTI flutter: septum and CS proximal to distal first, the high lateral RA mid-cycle.
  flutter: { 'his-d': 0, 'his-p': 2, 'cs-910': 10, 'cs-78': 20, 'cs-56': 30, 'cs-34': 40, 'cs-12': 50, hra: 120, avj: 0, ap: 50, aps: 10, p: null, pAmp: 0 }
});

const BASE = {
  sinusCl: 800, aErp: 220, vErp: 240, hpsErp: 260, hv: 45, escapeCl: 1700,
  fp: { ah: 75, dec: 110, tau: 110, erp: 300, retro: 75, retroErp: 300 },
  sp: null, ap: null, at: null, flutter: null, vt: null, af: null
};
const fp = (over) => ({ ...BASE.fp, ...over });

/**
 * Cases. sp.retro: slow-pathway retrograde time (atypical AVNRT); ap.insertion:
 * 'ap' (left lateral) or 'aps' (posteroseptal); ap.retroDec/retroTau: a
 * decremental retrograde pathway (PJRT); at / flutter / af: triggered by
 * rapid atrial capture (count captures at a cycle of at most triggerCl);
 * vt: triggered by two ventricular captures coupled at most triggerCl.
 */
export const LIVE_CASES = Object.freeze({
  normal: { ...BASE },
  'avnrt-typical': { ...BASE, fp: fp({ erp: 380 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250 } },
  'avnrt-atypical': { ...BASE, fp: fp({ retroErp: 700 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250, retro: 300, retroErp: 250 } },
  'ort-left': { ...BASE, fp: fp({ erp: 250, dec: 120, tau: 130 }), ap: { insertion: 'ap', origin: 'ap-left', ante: false, retro: 70, erp: 180, anteDelay: 25 } },
  pjrt: { ...BASE, fp: fp({ erp: 250, dec: 120, tau: 130, retroErp: 700 }), ap: { insertion: 'aps', origin: 'ap-ps', ante: false, retro: 190, retroDec: 60, retroTau: 90, erp: 200, anteDelay: 25 } },
  'wpw-left': { ...BASE, ap: { insertion: 'ap', origin: 'ap-left', ante: true, retro: 70, erp: 240, anteDelay: 25 }, af: { triggerCl: 250, triggerCount: 6, min: 130, max: 210 } },
  'at-focal': { ...BASE, at: { cl: 380, origin: 'la-focus', triggerCl: 330, triggerCount: 4 } },
  'flutter-cti': { ...BASE, flutter: { tcl: 240, triggerCl: 260, triggerCount: 6 } },
  'vt-scar': { ...BASE, fp: fp({ retroErp: 1000 }), vt: { cl: 380, triggerCl: 300 } }
});

/** RF targets and the substrate element each one eliminates. */
export const ABLATION_TARGETS = Object.freeze(['slow-pathway', 'compact-node', 'left-lateral', 'posteroseptal', 'cti', 'la-focus', 'vt-isthmus']);
export const RF_LESION_MS = 4000;   // continuous RF time that completes a lesion
