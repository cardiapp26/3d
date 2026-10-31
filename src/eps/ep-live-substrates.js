/*
 * Substrates of the live EP laboratory (ep-live-model.js): activation
 * sequences per origin and the tissue parameters of each case. Designed
 * teaching timings (ms), not patient physiology or localization rules.
 */

// Atrial activation sequences: channel A times after the origin fires;
// avj: arrival at the AV junction; ap / aps: arrival at the left lateral /
// posteroseptal pathway insertion; p: surface P onset, pAmp: its polarity.
export const ORIGINS = Object.freeze({
  sinus: { hra: 0, 'his-p': 32, 'his-d': 35, 'cs-910': 45, 'cs-78': 55, 'cs-56': 63, 'cs-34': 72, 'cs-12': 80, 'abl-d': 62, avj: 35, ap: 75, aps: 40, p: 0, pAmp: 0.22 },
  hra: { hra: 2, 'his-p': 34, 'his-d': 37, 'cs-910': 47, 'cs-78': 57, 'cs-56': 65, 'cs-34': 74, 'cs-12': 82, 'abl-d': 64, avj: 37, ap: 77, aps: 42, p: 4, pAmp: 0.22 },
  'cs-prox': { 'cs-910': 2, 'cs-78': 12, 'his-d': 18, 'his-p': 20, 'cs-56': 22, 'cs-34': 32, 'cs-12': 42, hra: 55, 'abl-d': 12, avj: 15, ap: 40, aps: 5, p: 6, pAmp: -0.14 },
  'cs-dist': { 'cs-12': 2, 'cs-34': 12, 'cs-56': 22, 'cs-78': 32, 'cs-910': 42, 'his-d': 55, 'his-p': 57, hra: 80, 'abl-d': 52, avj: 55, ap: 5, aps: 45, p: 10, pAmp: 0.12 },
  // Retrograde over the fast pathway: His first, concentric.
  'avn-fast': { 'his-d': 0, 'his-p': -2, 'cs-910': 10, 'cs-78': 18, 'cs-56': 26, 'cs-34': 36, 'cs-12': 46, hra: 25, 'abl-d': 18, avj: 0, ap: 45, aps: 10, p: 5, pAmp: -0.15 },
  // Retrograde over the slow pathway: CS ostium first, still concentric.
  'avn-slow': { 'cs-910': 0, 'cs-78': 10, 'his-p': 13, 'his-d': 15, 'cs-56': 20, 'cs-34': 30, 'cs-12': 40, hra: 35, 'abl-d': 6, avj: 0, ap: 45, aps: 3, p: 5, pAmp: -0.15 },
  // Retrograde over a left lateral pathway: distal CS first, eccentric.
  'ap-left': { 'cs-12': 0, 'cs-34': 14, 'cs-56': 28, 'cs-78': 42, 'cs-910': 56, 'his-d': 62, 'his-p': 64, hra: 85, 'abl-d': 66, avj: 62, ap: 0, aps: 55, p: 10, pAmp: -0.15 },
  // Retrograde over a posteroseptal pathway: CS ostium first.
  'ap-ps': { 'cs-910': 0, 'cs-78': 12, 'his-d': 12, 'his-p': 14, 'cs-56': 22, 'cs-34': 32, 'cs-12': 42, hra: 40, 'abl-d': 8, avj: 5, ap: 45, aps: 0, p: 5, pAmp: -0.18 },
  // Left atrial focus (left superior pulmonary vein region): distal CS early, high RA late.
  'la-focus': { 'cs-12': 10, 'cs-34': 18, 'cs-56': 28, 'cs-78': 38, 'cs-910': 48, 'his-d': 55, 'his-p': 57, hra: 70, 'abl-d': 60, avj: 55, ap: 15, aps: 50, p: 0, pAmp: 0.2 },
  // Counterclockwise CTI flutter, timed from the CS ostium (the septal exit of the isthmus): the
  // front climbs the septum to the His, CS proximal to distal spreads into the left atrium,
  // the front crosses anterior to the SVC to the high lateral RA, descends the lateral wall and
  // returns through the slow isthmus (abl-d: catheter at the mid isthmus); f: the lead II F
  // nadir, as the free wall starts its craniocaudal activation. ep-flutter-circuit.js draws the
  // same timing on the LAO ring.
  flutter: { 'cs-910': 0, 'cs-78': 10, 'cs-56': 20, 'cs-34': 30, 'cs-12': 40, 'his-d': 62, 'his-p': 64, hra: 137, 'abl-d': 205, avj: 50, ap: 40, aps: 0, f: 122, p: null, pAmp: 0 },
  // Pacing from the ablation catheter at the mid isthmus: inferior septal origin, negative P in II.
  cti: { 'abl-d': 2, 'cs-910': 16, 'cs-78': 26, 'his-d': 40, 'his-p': 42, 'cs-56': 36, 'cs-34': 46, 'cs-12': 56, hra: 72, avj: 30, ap: 56, aps: 14, p: 8, pAmp: -0.16 }
});

export const FLUTTER_TCL = 240;
/**
 * A capture from the isthmus during flutter: the paced front leaves the isthmus the same way
 * the circuit does (orthodromic), the antidromic one is lost inside it, so the atria and the F
 * wave follow the flutter sequence (concealed entrainment), shifted to the catheter's position.
 */
export const CTI_ENTRAINED = Object.freeze(Object.fromEntries(Object.entries(ORIGINS.flutter).map(([k, v]) => {
  const shift = FLUTTER_TCL - ORIGINS.flutter['abl-d'] + 2;
  if (k === 'abl-d') return [k, 2];
  return [k, typeof v === 'number' && !['pAmp'].includes(k) ? v + shift : v];
})));

const BASE = {
  sinusCl: 800, aErp: 220, vErp: 240, hpsErp: 260, hv: 45, escapeCl: 1700, snSuppression: 250,
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
 * ppiExtra: the return cycle beyond the TCL after entrainment from a site
 * (flutter per atrial site, VT from the RV apex); vt.atpCl/atpCaptures: a run
 * of captures at most atpCl long ends the VT (antitachycardia pacing).
 * snSuppression: extra sinus recovery after a paced atrial run (SNRT).
 */
export const LIVE_CASES = Object.freeze({
  normal: { ...BASE },
  'avnrt-typical': { ...BASE, fp: fp({ erp: 380, retroErp: 250 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250 } },
  // Dual AV nodal physiology with a weak retrograde fast pathway: a jump without an echo at baseline,
  // single echoes under isoproterenol, sustained AVNRT with isoproterenol and atropine together.
  'avnrt-jump': { ...BASE, fp: fp({ erp: 380, retroErp: 700 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250 } },
  // The retrograde fast pathway recovers for one echo but not for the next: echo only, inducible on a drug.
  'avnrt-echo': { ...BASE, fp: fp({ erp: 380, retroErp: 420 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250 } },
  'avnrt-atypical': { ...BASE, fp: fp({ retroErp: 700 }), sp: { ah: 260, dec: 90, tau: 50, erp: 250, retro: 300, retroErp: 250 } },
  'ort-left': { ...BASE, fp: fp({ erp: 250, dec: 120, tau: 130 }), ap: { insertion: 'ap', origin: 'ap-left', ante: false, retro: 70, erp: 180, anteDelay: 25 } },
  pjrt: { ...BASE, fp: fp({ erp: 250, dec: 120, tau: 130, retroErp: 700 }), ap: { insertion: 'aps', origin: 'ap-ps', ante: false, retro: 190, retroDec: 60, retroTau: 90, erp: 200, anteDelay: 25 } },
  'wpw-left': { ...BASE, ap: { insertion: 'ap', origin: 'ap-left', ante: true, retro: 70, erp: 240, anteDelay: 25 }, af: { triggerCl: 250, triggerCount: 6, min: 130, max: 210 } },
  'at-focal': { ...BASE, fp: fp({ retroErp: 220 }), at: { cl: 380, origin: 'la-focus', triggerCl: 330, triggerCount: 4 } },
  'flutter-cti': { ...BASE, flutter: { tcl: FLUTTER_TCL, triggerCl: 260, triggerCount: 6, ppiExtra: { hra: 20, 'cs-prox': 10, 'cs-dist': 120, cti: 5 } } },
  'vt-scar': { ...BASE, fp: fp({ retroErp: 1000 }), vt: { cl: 380, triggerCl: 300, ppiExtra: 80, atpCl: 320, atpCaptures: 6 } },
  // No retrograde AV nodal conduction (VA block on ventricular pacing); isoproterenol brings it out at long cycles.
  'va-block': { ...BASE, fp: fp({ retroErp: 700 }) },
  // Sinus node dysfunction: slower sinus rate and a long recovery after overdrive pacing.
  'sinus-node-disease': { ...BASE, sinusCl: 1000, snSuppression: 1600 }
});

/**
 * Drugs of the live laboratory: factors on the case parameters (a value is the
 * case's own times the factors of every drug given). Isoproterenol speeds the
 * sinus node and shortens atrial, AV nodal (antegrade and retrograde), His,
 * ventricular and accessory pathway refractoriness; atropine removes vagal tone:
 * the sinus node and the AV node only. Designed teaching factors.
 */
export const DRUGS = Object.freeze({
  iso: Object.freeze({ sinusCl: 0.7, aErp: 0.9, vErp: 0.9, hpsErp: 0.92, 'fp.ah': 0.75, 'fp.erp': 0.8, 'fp.retroErp': 0.65, 'sp.ah': 0.85, 'sp.erp': 0.8, 'sp.retroErp': 0.8, 'ap.erp': 0.85, 'at.cl': 0.85 }),
  atropine: Object.freeze({ sinusCl: 0.75, 'fp.ah': 0.85, 'fp.erp': 0.85, 'fp.retroErp': 0.75, 'sp.erp': 0.9, 'sp.retroErp': 0.85 })
});

/** RF targets and the substrate element each one eliminates. */
export const ABLATION_TARGETS = Object.freeze(['slow-pathway', 'compact-node', 'left-lateral', 'posteroseptal', 'cti', 'la-focus', 'vt-isthmus']);
export const RF_LESION_MS = 4000;   // continuous RF time that completes a lesion
