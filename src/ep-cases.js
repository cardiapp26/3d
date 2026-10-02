/*
 * Electrophysiological anatomy case catalog
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md, sections 5, 7, 9).
 * Every recording is a designed synthetic timing on a millisecond timeline:
 * never a clinical recording, never a measured interval, never a decision
 * rule. Cases separate mechanism, pathway zone and conduction direction
 * (report section 3); maneuver clips carry a valid / invalidCapture /
 * insufficientEvidence result. Events are the single source: calipers are
 * measured from the events themselves, not written next to them. DOM free.
 */

/** Recorder channels, top to bottom; each clip lists the subset it shows. */
export const EP_CHANNELS = Object.freeze([
  { id: 'ecg-ii', label: 'II', surface: true },
  { id: 'ecg-v1', label: 'V1', surface: true },
  { id: 'hra', label: 'HRA', noElectrode: true },
  { id: 'his-p', label: 'His p' },
  { id: 'his-d', label: 'His d' },
  // Right bundle potential (phase D, bundle branch reentry); no atlas electrode.
  { id: 'rb', label: 'RB', noElectrode: true },
  { id: 'cs-910', label: 'CS 9-10' },
  { id: 'cs-78', label: 'CS 7-8' },
  { id: 'cs-56', label: 'CS 5-6' },
  { id: 'cs-34', label: 'CS 3-4' },
  { id: 'cs-12', label: 'CS 1-2' },
  // Circular (Lasso) catheter summary channel of the PVI exercise; no atlas electrode.
  { id: 'pv', label: 'PV (Lasso)', noElectrode: true },
  { id: 'rv', label: 'RV' },
  // Left ventricular septal catheter, basal and apical bipoles (phase D, fascicular VT); no atlas electrode.
  { id: 'lv-sep-b', label: 'LVS baz', noElectrode: true },
  { id: 'lv-sep-a', label: 'LVS apx', noElectrode: true },
  { id: 'abl-d', label: 'ABL d' },
  { id: 'abl-uni', label: 'ABL uni', unipolar: true },
  // Right annular Halo (schematic decapolar, 5 bipoles): 9-10 proximal at the
  // high anterolateral annulus, 1-2 distal at the low lateral wall next to the CTI.
  { id: 'halo-910', label: 'Halo 9-10' },
  { id: 'halo-78', label: 'Halo 7-8' },
  { id: 'halo-56', label: 'Halo 5-6' },
  { id: 'halo-34', label: 'Halo 3-4' },
  { id: 'halo-12', label: 'Halo 1-2' }
].map(Object.freeze));

/**
 * Channel to 3D electrode identity (report section 6: the recorded bipole and
 * its 3D marker share one identity). Names are the electrode meshes built by
 * ep-landmarks.js (His, CS, ABL) and ep-zones.js (Halo, RV). HRA and the
 * surface leads have no 3D electrode.
 */
export const CHANNEL_ELECTRODES = Object.freeze({
  'his-p': ['His reference catheter (schematic) electrode 1', 'His reference catheter (schematic) electrode 2'],
  'his-d': ['His reference catheter (schematic) electrode 3', 'His reference catheter (schematic) electrode 4'],
  'cs-910': ['CS 9 electrode', 'CS 10 electrode'], 'cs-78': ['CS 7 electrode', 'CS 8 electrode'],
  'cs-56': ['CS 5 electrode', 'CS 6 electrode'], 'cs-34': ['CS 3 electrode', 'CS 4 electrode'],
  'cs-12': ['CS 1 electrode', 'CS 2 electrode'],
  'abl-d': ['Slow pathway catheter tip', 'Slow pathway ablation catheter (schematic) electrode 3'],
  'abl-uni': ['Slow pathway catheter tip'],
  rv: ['RV pacing tip'],
  'halo-910': ['Halo 9 electrode', 'Halo 10 electrode'], 'halo-78': ['Halo 7 electrode', 'Halo 8 electrode'],
  'halo-56': ['Halo 5 electrode', 'Halo 6 electrode'], 'halo-34': ['Halo 3 electrode', 'Halo 4 electrode'],
  'halo-12': ['Halo 1 electrode', 'Halo 2 electrode']
});

import {
  FLUTTER_CCW, flutterRun, atrialSitePacing, unipolar, hisPvcClip,
  AH, A_ATYPICAL, A_INF_PS, A_LEFT_LAT, A_NODAL_PACED, A_PJRT, A_TYPICAL, CH_CS_FULL, CH_LEGACY, CH_SVT, HV, afBeat, atrialPacedBeat, ev, fWaves, far, junctionalBeat, merge, mono, pacedBeat, paraHisBeat, sinusBeat, surfaceBeat, svtBeat, svtRun
} from './ep-beats.js';
import { ref, cal, resolveRef, measure } from './ep-caliper.js';
import { ADVANCED_DEFS, ADVANCED_CASES } from './ep-cases-advanced.js';

// Calipers are measured from the events (ep-caliper.js); re-exported for the module's callers.
export { ref, cal, resolveRef, measure };

const DEFS = [];
const define = (def) => { DEFS.push(def); return def.id; };

// ---------------------------------------------------------------------------
// Typical AVNRT (slow-fast). Diagnosis, maneuvers and the migrated slow
// pathway treatment clips of the previous lesson (with the corrected VA
// block wording, report section 2).
// ---------------------------------------------------------------------------
const TYP_VS = [200, 560, 920, 1280];
define({
  id: 'avnrt-typ-svt', caseId: 'avnrt-typical', section: 'diagnosis', windowMs: 1500, channels: CH_SVT,
  events: svtRun(TYP_VS, A_TYPICAL),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('his-d', 'V', 2), ref('his-d', 'A', 2))
  ],
  teachingNumbers: { TCL: 360, VA: 30 }
});
{
  const clip = hisPvcClip(360, A_TYPICAL, 0);
  define({
    id: 'avnrt-typ-hispvc', caseId: 'avnrt-typical', section: 'maneuver', maneuver: 'his-pvc', result: 'valid',
    windowMs: clip.windowMs, channels: CH_SVT, events: clip.events, markers: clip.markers,
    calipers: [
      cal('TCL', ref('cs-12', 'A', 0), ref('cs-12', 'A', 1)),
      cal('A-A', ref('cs-12', 'A', 1), ref('cs-12', 'A', 2))
    ],
    teachingNumbers: { TCL: 360, 'A-A': 360 }
  });
}
{
  const stims = [180, 500, 820];
  define({
    id: 'avnrt-typ-vop', caseId: 'avnrt-typical', section: 'maneuver', maneuver: 'v-overdrive', result: 'valid',
    windowMs: 1600, channels: CH_SVT,
    events: merge(
      ...stims.map((s) => pacedBeat(s, A_TYPICAL)),
      svtBeat(1335, A_TYPICAL)   // V-A-V: the last paced retrograde A is followed by V then A
    ),
    markers: stims.map((t) => ({ t, label: { tr: 'S', en: 'S' } })),
    calipers: [cal('PPI', ref('rv', 'S', 2), ref('rv', 'V', 3), 'rv')],
    teachingNumbers: { PPI: 510, TCL: 360 }
  });
  define({
    id: 'avnrt-typ-vop-noncapture', caseId: 'avnrt-typical', section: 'maneuver', maneuver: 'v-overdrive', result: 'invalidCapture',
    windowMs: 1500, channels: CH_SVT,
    events: merge(svtRun(TYP_VS, A_TYPICAL), ...stims.map((s) => pacedBeat(s, {}, { capture: false }))),
    markers: stims.map((t) => ({ t, label: { tr: 'S (yakalama yok)', en: 'S (no capture)' } })),
    calipers: [cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2))],
    teachingNumbers: { TCL: 360 }
  });
}
{
  // Para-Hisian pacing: first stimulus captures His and RV, the second only RV.
  const nodal1 = { 'his-d': 100, 'his-p': 98, 'cs-910': 110, hra: 120, 'cs-12': 145 };
  const nodal2 = { 'his-d': 145, 'his-p': 143, 'cs-910': 155, hra: 165, 'cs-12': 190 };
  define({
    id: 'avnrt-typ-parahis', caseId: 'avnrt-typical', section: 'maneuver', maneuver: 'para-his', result: 'valid',
    windowMs: 1400, channels: CH_SVT,
    events: merge(paraHisBeat(150, nodal1, true), paraHisBeat(750, nodal2, false)),
    markers: [
      { t: 150, label: { tr: 'S: His+RV', en: 'S: His+RV' } },
      { t: 750, label: { tr: 'S: yalnız RV', en: 'S: RV only' } }
    ],
    calipers: [
      cal('S-A (His+RV)', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d'),
      cal('S-A (RV)', ref('rv', 'S', 1), ref('his-d', 'A', 1), 'his-d')
    ],
    teachingNumbers: { 'S-A (His+RV)': 100, 'S-A (RV)': 145 }
  });
  const extra1 = { 'abl-d': 95, 'cs-910': 110, 'his-d': 125, 'his-p': 123, hra: 160, 'cs-12': 175 };
  define({
    id: 'ap-ips-parahis', caseId: 'ap-inf-paraseptal', section: 'maneuver', maneuver: 'para-his', result: 'valid',
    windowMs: 1400, channels: CH_CS_FULL,
    events: merge(paraHisBeat(150, extra1, true), paraHisBeat(750, extra1, false)),
    markers: [
      { t: 150, label: { tr: 'S: His+RV', en: 'S: His+RV' } },
      { t: 750, label: { tr: 'S: yalnız RV', en: 'S: RV only' } }
    ],
    calipers: [
      cal('S-A (His+RV)', ref('rv', 'S', 0), ref('abl-d', 'A', 0), 'abl-d'),
      cal('S-A (RV)', ref('rv', 'S', 1), ref('abl-d', 'A', 1), 'abl-d')
    ],
    teachingNumbers: { 'S-A (His+RV)': 95, 'S-A (RV)': 95 }
  });
}
{
  // Two abbreviated 600 ms drive trains, followed by S2 at 350 and 340 ms.
  // Comparing successive S2 responses demonstrates a true AH jump; comparing
  // a drive beat with a much earlier S2 would also include normal decrement.
  const paced = merge(
    atrialPacedBeat(100, AH), atrialPacedBeat(700, AH), atrialPacedBeat(1050, 100),
    atrialPacedBeat(1900, AH), atrialPacedBeat(2500, AH), atrialPacedBeat(2840, 180)
  );
  const echoV = 2840 + 40 + 180 + HV;
  for (const [id, section, echo] of [
    ['avnrt-ah-jump', 'diagnosis', false],
    ['avnrt-jump-echo', 'diagnosis', true],
    ['avnrt-dual-echo', 'maneuver', true]
  ]) define({
    id, caseId: 'avnrt-typical', section, maneuver: 'a-extra', result: 'valid',
    windowMs: 3450, channels: CH_SVT,
    events: merge(paced, ...(echo ? [
      Object.fromEntries(Object.entries(A_TYPICAL).map(([ch, dt]) => [ch, [ev('A', echoV + dt, 0.7)]]))
    ] : [])),
    markers: [
      ...[100, 700, 1900, 2500].map((t) => ({ t, label: { tr: 'S1', en: 'S1' } })),
      { t: 1050, label: { tr: 'S2: 350 ms', en: 'S2: 350 ms' } },
      { t: 2840, label: { tr: 'S2: 340 ms', en: 'S2: 340 ms' } },
      ...(echo ? [{ t: echoV + A_TYPICAL['his-d'], label: { tr: 'Tek echo A', en: 'Single echo A' } }] : [])
    ].sort((a, b) => a.t - b.t),
    calipers: [
      cal('AH (S2-1)', ref('his-d', 'A', 2), ref('his-d', 'H', 2)),
      cal('AH (S2-2)', ref('his-d', 'A', 5), ref('his-d', 'H', 5)),
      cal('S1-S2 (1)', ref('hra', 'S', 1), ref('hra', 'S', 2), 'hra'),
      cal('S1-S2 (2)', ref('hra', 'S', 4), ref('hra', 'S', 5), 'hra'),
      ...(echo ? [cal('VA (echo)', ref('his-d', 'V', 5), ref('his-d', 'A', 6))] : [])
    ],
    teachingNumbers: { 'AH (S2-1)': 100, 'AH (S2-2)': 180, 'S1-S2 (1)': 350, 'S1-S2 (2)': 340, ...(echo ? { 'VA (echo)': 30 } : {}) }
  });
}
define({
  id: 'sinus', caseId: 'avnrt-typical', section: 'treatment', windowMs: 1300, channels: CH_LEGACY, rf: false,
  events: merge(sinusBeat(100), sinusBeat(700)),
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0))
  ],
  teachingNumbers: { AH, HV }
});
define({
  id: 'slow-target', caseId: 'avnrt-typical', section: 'treatment', windowMs: 1300, channels: CH_LEGACY, rf: false,
  events: merge(sinusBeat(100, { fragmented: true }), sinusBeat(700, { fragmented: true })),
  calipers: [cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0))],
  teachingNumbers: { AH }
});
define({
  id: 'junctional-rf', caseId: 'avnrt-typical', section: 'treatment', windowMs: 1300, channels: CH_LEGACY, rf: true,
  events: merge(junctionalBeat(130), junctionalBeat(870)),
  calipers: [cal('VA', ref('his-d', 'V', 0), ref('his-d', 'A', 0))],
  teachingNumbers: { VA: 70 }
});
define({
  id: 'junctional-va-block', caseId: 'avnrt-typical', section: 'treatment', windowMs: 1800, channels: CH_LEGACY, rf: true,
  // Fast junctional run with one beat losing the retrograde A, then a sinus
  // beat: antegrade AV conduction is shown on a recorded beat, not assumed.
  events: merge(junctionalBeat(70), junctionalBeat(540, { vaBlock: true }), junctionalBeat(1010), sinusBeat(1330)),
  markers: [{ t: 655, label: { tr: 'V, retrograd A yok', en: 'V, no retrograde A' } }],
  calipers: [cal('AH', ref('his-d', 'A', 2), ref('his-d', 'H', 3))],
  teachingNumbers: { AH, CL: 470 }
});

// ---------------------------------------------------------------------------
// Atypical AVNRT: long RP with earliest retrograde A near the CS ostium.
// ---------------------------------------------------------------------------
const ATYP_VS = [150, 530, 910, 1290];
define({
  id: 'avnrt-atyp-svt', caseId: 'avnrt-atypical', section: 'diagnosis', windowMs: 1560, channels: CH_SVT,
  events: svtRun(ATYP_VS, A_ATYPICAL),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('cs-910', 'V', 1), ref('cs-910', 'A', 1), 'cs-910')
  ],
  teachingNumbers: { TCL: 380, VA: 185 }
});
define({
  id: 'avnrt-atyp-vablock', caseId: 'avnrt-atypical', section: 'treatment', windowMs: 1800, channels: CH_LEGACY, rf: true,
  events: merge(junctionalBeat(80), junctionalBeat(550, { vaBlock: true }), junctionalBeat(1020, { vaBlock: true }), sinusBeat(1340)),
  markers: [{ t: 665, label: { tr: 'retrograd A kayboldu', en: 'retrograde A lost' } }],
  calipers: [cal('AH', ref('his-d', 'A', 1), ref('his-d', 'H', 3))],
  teachingNumbers: { AH }
});

// ---------------------------------------------------------------------------
// Left lateral concealed accessory pathway (report storyboard 1).
// ---------------------------------------------------------------------------
const LL_VS = [150, 510, 870, 1230];
define({
  id: 'ap-ll-svt', caseId: 'ap-left-lateral', section: 'diagnosis', windowMs: 1450, channels: CH_CS_FULL,
  events: svtRun(LL_VS, A_LEFT_LAT, { ablV: -5 }),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('cs-12', 'V', 1), ref('cs-12', 'A', 1), 'cs-12'),
    cal('VA-ABL', ref('abl-d', 'V', 1), ref('abl-d', 'A', 1), 'abl-d')
  ],
  teachingNumbers: { TCL: 360, VA: 32, 'VA-ABL': 50 }
});
{
  const clip = hisPvcClip(360, A_LEFT_LAT, 25, { ablV: -5 });
  define({
    id: 'ap-ll-hispvc', caseId: 'ap-left-lateral', section: 'maneuver', maneuver: 'his-pvc', result: 'valid',
    windowMs: clip.windowMs, channels: CH_CS_FULL, events: clip.events, markers: clip.markers,
    calipers: [
      cal('TCL', ref('cs-12', 'A', 0), ref('cs-12', 'A', 1)),
      cal('A-A', ref('cs-12', 'A', 1), ref('cs-12', 'A', 2))
    ],
    teachingNumbers: { TCL: 360, 'A-A': 335 }
  });
}
define({
  id: 'ap-ll-post-retro', caseId: 'ap-left-lateral', section: 'treatment', windowMs: 1500, channels: CH_SVT,
  events: merge(pacedBeat(150, A_NODAL_PACED), pacedBeat(750, A_NODAL_PACED)),
  markers: [{ t: 150, label: { tr: 'S', en: 'S' } }, { t: 750, label: { tr: 'S', en: 'S' } }],
  calipers: [cal('S-A', ref('rv', 'S', 0), ref('his-d', 'A', 0))],
  teachingNumbers: { 'S-A': 140 }
});

// ---------------------------------------------------------------------------
// Inferior paraseptal concealed pathway (report storyboard 2) and PJRT: the
// mandatory CS ostium comparison against typical and atypical AVNRT.
// ---------------------------------------------------------------------------
define({
  id: 'ap-ips-svt', caseId: 'ap-inf-paraseptal', section: 'diagnosis', windowMs: 1560, channels: CH_CS_FULL,
  events: svtRun(ATYP_VS, A_INF_PS, { ablV: -3 }),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA-ABL', ref('abl-d', 'V', 1), ref('abl-d', 'A', 1), 'abl-d')
  ],
  teachingNumbers: { TCL: 380, 'VA-ABL': 48 }
});
{
  const clip = hisPvcClip(380, A_INF_PS, 20, { ablV: -3 });
  define({
    id: 'ap-ips-hispvc', caseId: 'ap-inf-paraseptal', section: 'maneuver', maneuver: 'his-pvc', result: 'valid',
    windowMs: clip.windowMs, channels: CH_CS_FULL, events: clip.events, markers: clip.markers,
    calipers: [
      cal('TCL', ref('cs-910', 'A', 0), ref('cs-910', 'A', 1)),
      cal('A-A', ref('cs-910', 'A', 1), ref('cs-910', 'A', 2))
    ],
    teachingNumbers: { TCL: 380, 'A-A': 360 }
  });
}
define({
  id: 'pjrt-svt', caseId: 'pjrt', section: 'diagnosis', windowMs: 1660, channels: CH_SVT,
  events: svtRun([150, 570, 990, 1410], A_PJRT),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('cs-910', 'V', 1), ref('cs-910', 'A', 1), 'cs-910')
  ],
  teachingNumbers: { TCL: 420, VA: 165 }
});
define({
  id: 'pjrt-vpace', caseId: 'pjrt', section: 'maneuver', maneuver: 'v-decrement', result: 'valid',
  windowMs: 1900, channels: CH_SVT,
  // Two paced cycle lengths: the retrograde S-A lengthens at the faster rate (decremental).
  events: merge(
    pacedBeat(100, { 'cs-910': 160, 'his-d': 180, 'cs-12': 220, hra: 205 }),
    pacedBeat(600, { 'cs-910': 160, 'his-d': 180, 'cs-12': 220, hra: 205 }),
    pacedBeat(1100, { 'cs-910': 210, 'his-d': 230, 'cs-12': 270, hra: 255 }),
    pacedBeat(1480, { 'cs-910': 210, 'his-d': 230, 'cs-12': 270, hra: 255 })
  ),
  markers: [100, 600, 1100, 1480].map((t) => ({ t, label: { tr: 'S', en: 'S' } })),
  calipers: [
    cal('S-A (500 ms)', ref('rv', 'S', 1), ref('cs-910', 'A', 1), 'cs-910'),
    cal('S-A (380 ms)', ref('rv', 'S', 3), ref('cs-910', 'A', 3), 'cs-910')
  ],
  teachingNumbers: { 'S-A (500 ms)': 160, 'S-A (380 ms)': 210 }
});

// ---------------------------------------------------------------------------
// Manifest left lateral pathway (report storyboard 3): sinus preexcitation,
// then the post-ablation sinus and the separate retrograde test.
// ---------------------------------------------------------------------------
const manifestBeat = (t0) => sinusBeat(t0, { delta: t0 + 140, ablV: 125, ablA: 55 });
define({
  id: 'ap-lm-sinus', caseId: 'ap-left-manifest', section: 'diagnosis', windowMs: 1300, channels: CH_LEGACY,
  events: merge(manifestBeat(100), manifestBeat(700)),
  calipers: [
    cal('H-delta', ref('his-d', 'H', 0), ref('ecg-ii', 'delta', 0), 'his-d'),
    cal('V-delta', ref('ecg-ii', 'delta', 0), ref('abl-d', 'V', 0), 'abl-d')
  ],
  teachingNumbers: { 'H-delta': 25, 'V-delta': -15 }
});
define({
  id: 'ap-lm-avrt', caseId: 'ap-left-manifest', section: 'diagnosis', windowMs: 1400, channels: CH_CS_FULL,
  events: svtRun([150, 490, 830, 1170], A_LEFT_LAT, { ablV: -5 }),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('cs-12', 'V', 1), ref('cs-12', 'A', 1), 'cs-12'),
    cal('HV', ref('his-d', 'H', 1), ref('his-d', 'V', 1))
  ],
  teachingNumbers: { TCL: 340, VA: 32, HV },
  circuit: 'orthodromic'
});
{
  const vs = [];
  let t = 150;
  for (const rr of [300, 240, 420, 220, 360, 280]) { vs.push(t); t += rr; }
  vs.push(t);   // 1970
  const windowMs = 2150;
  define({
    id: 'af-preexcited', caseId: 'ap-left-manifest', section: 'diagnosis', windowMs,
    channels: ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'cs-910', 'cs-12', 'rv', 'abl-d'],
    events: merge(...vs.map((v, i) => afBeat(v, i !== 5)), fWaves(windowMs, ['hra', 'cs-910', 'cs-12'])),
    // SPERRI: the shortest RR between two preexcited beats (measured on the surface QRS).
    calipers: [cal('SPERRI', ref('ecg-ii', 'V', 3), ref('ecg-ii', 'V', 4), 'ecg-ii')],
    teachingNumbers: { SPERRI: 220 }
  });
}
{
  // Antidromic AVRT: fully preexcited wide QRS, retrograde A concentric over the node.
  const vs = [150, 470, 790, 1110];
  define({
    id: 'ap-lm-antidromic', caseId: 'ap-left-manifest', section: 'diagnosis', windowMs: 1350, channels: CH_CS_FULL,
    events: merge(...vs.map((v) => merge(surfaceBeat(v, { delta: v - 30, wide: true }), {
      'abl-d': [ev('V', v - 40, 0.8)],
      rv: [ev('V', v - 5, 0.9)],
      'his-p': [far('V', v + 16, 0.5, 12)],
      'his-d': [far('V', v + 18, 0.6, 12)],
      ...Object.fromEntries(['cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'].map((ch, i) => [ch, [far('V', v + 20 + i * 2, 0.4, 10)]])),
      ...Object.fromEntries(Object.entries(A_NODAL_PACED).map(([ch, dt]) => [ch, [ev('A', v + dt, 0.7)]]))
    }))),
    calipers: [
      cal('TCL', ref('rv', 'V', 1), ref('rv', 'V', 2), 'rv'),
      cal('VA', ref('rv', 'V', 1), ref('his-d', 'A', 1), 'his-d')
    ],
    teachingNumbers: { TCL: 320, VA: 145 },
    circuit: 'antidromic'
  });
}
define({
  id: 'ap-lm-post', caseId: 'ap-left-manifest', section: 'treatment', windowMs: 1300, channels: CH_LEGACY,
  events: merge(sinusBeat(100, { ablA: 55, ablV: 165 }), sinusBeat(700, { ablA: 55, ablV: 165 })),
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0))
  ],
  teachingNumbers: { AH, HV }
});
define({
  id: 'ap-lm-post-retro', caseId: 'ap-left-manifest', section: 'treatment', windowMs: 1500, channels: CH_SVT,
  events: merge(pacedBeat(150, A_NODAL_PACED), pacedBeat(750, A_NODAL_PACED)),
  markers: [{ t: 150, label: { tr: 'S', en: 'S' } }, { t: 750, label: { tr: 'S', en: 'S' } }],
  calipers: [cal('S-A', ref('rv', 'S', 0), ref('his-d', 'A', 0))],
  teachingNumbers: { 'S-A': 140 }
});

// ---------------------------------------------------------------------------
// Focal atrial tachycardia (report case 23): the long RP mimic whose earliest
// A is on the crista (HRA), and the A-A-V response after ventricular overdrive.
// ---------------------------------------------------------------------------
const A_CRISTAL = { hra: 190, 'his-d': 215, 'his-p': 213, 'cs-910': 225, 'cs-56': 240, 'cs-12': 260 };
define({
  id: 'at-svt', caseId: 'focal-at', section: 'diagnosis', windowMs: 1850, channels: CH_SVT,
  events: svtRun([150, 550, 950, 1350], A_CRISTAL),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('his-d', 'V', 1), ref('hra', 'A', 1), 'hra')
  ],
  teachingNumbers: { TCL: 400, VA: 190 }
});
{
  const stims = [150, 490, 830];
  const retro = { hra: 160, 'his-d': 175, 'cs-910': 185, 'cs-12': 215 };
  const tachyA = (t) => Object.fromEntries(Object.entries(A_CRISTAL).map(([ch, dt]) => [ch, [ev('A', t + dt - 190, 0.7)]]));
  define({
    id: 'at-vop', caseId: 'focal-at', section: 'maneuver', maneuver: 'v-overdrive', result: 'valid',
    windowMs: 1950, channels: CH_SVT,
    // After the last paced beat: A (retrograde), A (the focus resumes), then V: A-A-V.
    events: merge(
      ...stims.map((t) => pacedBeat(t, retro)),
      tachyA(1290), { 'his-d': [ev('H', 1370, 0.7, 4), ev('V', 1415, 0.9)], 'his-p': [ev('V', 1415, 0.7, 6)], rv: [ev('V', 1410, 0.9)], 'ecg-ii': [ev('V', 1415, 0.9, 8)], 'ecg-v1': [ev('V', 1415, -0.5, 8)] },
      tachyA(1690), { 'his-d': [ev('V', 1815, 0.9)], rv: [ev('V', 1810, 0.9)], 'ecg-ii': [ev('V', 1815, 0.9, 8)] }
    ),
    markers: [
      { t: 990, label: { tr: 'A', en: 'A' } },
      { t: 1290, label: { tr: 'A', en: 'A' } },
      { t: 1415, label: { tr: 'V', en: 'V' } }
    ],
    calipers: [cal('A-A (AT)', ref('hra', 'A', 3), ref('hra', 'A', 4), 'hra')],
    teachingNumbers: { 'A-A (AT)': 400 }
  });
}

// ---------------------------------------------------------------------------
// Focal AT additions: a non-diagnostic overdrive (the tachycardia stops during
// pacing, so no return sequence can be read) and the activation sequence map.
// ---------------------------------------------------------------------------
{
  const stims = [150, 490, 830];
  const retro = { hra: 160, 'his-d': 175, 'cs-910': 185, 'cs-12': 215 };
  define({
    id: 'at-vop-terminated', caseId: 'focal-at', section: 'maneuver', maneuver: 'v-overdrive', result: 'insufficientEvidence',
    windowMs: 1600, channels: CH_SVT,
    // After pacing: sinus resumes (P then A from HRA, AH, V): no A-A-V or V-A-V to read.
    events: merge(...stims.map((t) => pacedBeat(t, retro)), sinusBeat(1250)),
    markers: stims.map((t) => ({ t, label: { tr: 'S', en: 'S' } })).concat([{ t: 1250, label: { tr: 'sinüs', en: 'sinus' } }]),
    calipers: [cal('S-A', ref('rv', 'S', 2), ref('hra', 'A', 2), 'hra')],
    teachingNumbers: { 'S-A': 160 }
  });
}

// ---------------------------------------------------------------------------
// Case 24: typical (counterclockwise) CTI-dependent flutter. Entrainment from
// the CTI, a non-capturing and a terminating attempt, and the bidirectional
// block assessment after ablation (proximal CS and low lateral RA pacing).
// ---------------------------------------------------------------------------
const CH_FLUTTER = ['ecg-ii', 'hra', 'his-d', 'cs-910', 'cs-12', 'halo-910', 'halo-78', 'halo-56', 'halo-34', 'halo-12', 'abl-d', 'rv'];
const TCL_FL = 240;
define({
  id: 'flutter-svt', caseId: 'flutter-cti', section: 'diagnosis', windowMs: 1300, channels: CH_FLUTTER,
  events: flutterRun(60, TCL_FL, 5),
  calipers: [
    cal('TCL', ref('halo-12', 'A', 1), ref('halo-12', 'A', 2)),
    cal('Halo 9-10 → 1-2', ref('halo-910', 'A', 1), ref('halo-12', 'A', 1), 'halo-12')
  ],
  teachingNumbers: { TCL: 240, 'Halo 9-10 → 1-2': 100 },
  catheters: ['halo']
});
{
  // Pacing from the CTI (ABL) at 225 ms: every atrial channel follows the paced
  // cycle with the flutter sequence (orthodromic capture of the circuit); after
  // the last stimulus the first return at the pacing site is the PPI.
  const pcl = 225, n = 5, s0 = 300;
  const stims = Array.from({ length: n }, (_, i) => s0 + i * pcl);
  const shift = FLUTTER_CCW['abl-d'];   // the CTI site fires at stimulus time
  const paced = merge(...stims.map((s) => {
    const beat = { 'abl-d': [ev('S', s, 0.5, 2)] };
    for (const [ch, dt] of Object.entries(FLUTTER_CCW)) if (ch !== 'abl-d') (beat[ch] ??= []).push(ev('A', s + dt - shift + TCL_FL, 0.6));
    return beat;
  }));
  const last = stims[n - 1];
  const ppi = 250;   // return cycle at the pacing site
  const resumeBase = last + ppi - shift;   // flutter cycle whose ABL A lands at last + PPI
  define({
    id: 'flutter-entrain-cti', caseId: 'flutter-cti', section: 'maneuver', maneuver: 'entrain-cti', result: 'valid',
    windowMs: 2400, channels: CH_FLUTTER,
    // The resumed run's first ABL A lands at last + PPI (shift equals the ABL offset).
    events: merge(flutterRun(0, TCL_FL, 1), paced, flutterRun(resumeBase, TCL_FL, 3)),
    markers: stims.map((t, i) => ({ t, label: { tr: i ? 'S' : 'S (CTI, 225 ms)', en: i ? 'S' : 'S (CTI, 225 ms)' } })),
    calipers: [
      cal('PPI', ref('abl-d', 'S', n - 1), ref('abl-d', 'A', 1)),
      cal('TCL', ref('halo-12', 'A', n + 1), ref('halo-12', 'A', n + 2))
    ],
    teachingNumbers: { PPI: 250, TCL: 240 },
    catheters: ['halo']
  });
  define({
    id: 'flutter-entrain-noncapture', caseId: 'flutter-cti', section: 'maneuver', maneuver: 'entrain-cti', result: 'invalidCapture',
    windowMs: 1500, channels: CH_FLUTTER,
    events: merge(flutterRun(60, TCL_FL, 6), { 'abl-d': stims.map((t) => ev('S', t, 0.5, 2)) }),
    markers: stims.map((t) => ({ t, label: { tr: 'S (yakalama yok)', en: 'S (no capture)' } })),
    calipers: [cal('TCL', ref('halo-12', 'A', 1), ref('halo-12', 'A', 2))],
    teachingNumbers: { TCL: 240 },
    catheters: ['halo']
  });
  define({
    id: 'flutter-entrain-terminated', caseId: 'flutter-cti', section: 'maneuver', maneuver: 'entrain-cti', result: 'insufficientEvidence',
    windowMs: 2300, channels: CH_FLUTTER,
    // The train terminates the flutter: sinus follows, there is no return cycle to measure.
    events: merge(flutterRun(0, TCL_FL, 1), paced, atrialSitePacing([], 'hra', {}), sinusBeat(last + 700)),
    markers: stims.map((t) => ({ t, label: { tr: 'S', en: 'S' } })).concat([{ t: last + 700, label: { tr: 'sinüs', en: 'sinus' } }]),
    calipers: [cal('PCL', ref('abl-d', 'S', 0), ref('abl-d', 'S', 1))],
    teachingNumbers: { PCL: 225 },
    catheters: ['halo']
  });
}
{
  // Block assessment in sinus rhythm with pacing at 600 ms (report section 8; R15).
  const stims = [150, 750];
  // Proximal CS pacing. Before ablation the wavefront crosses the CTI: the low
  // lateral wall (Halo 1-2) activates early and collides on the lateral wall.
  const csBefore = { 'cs-910': 8, 'his-d': 35, 'cs-12': 60, hra: 95, 'halo-12': 90, 'halo-34': 105, 'halo-56': 118, 'halo-78': 112, 'halo-910': 100, 'abl-d': 45 };
  // After block: no isthmus crossing; the lateral wall activates from the top down.
  const csAfter = { 'cs-910': 8, 'his-d': 35, 'cs-12': 60, hra: 95, 'halo-910': 110, 'halo-78': 135, 'halo-56': 160, 'halo-34': 185, 'halo-12': 210, 'abl-d': 25 };
  define({
    id: 'cti-cs-pacing-before', caseId: 'flutter-cti', section: 'treatment', windowMs: 1200, channels: CH_FLUTTER,
    events: atrialSitePacing(stims, 'cs-910', csBefore),
    markers: stims.map((t) => ({ t, label: { tr: 'S (proksimal CS)', en: 'S (proximal CS)' } })),
    calipers: [cal('S → Halo 1-2', ref('cs-910', 'S', 0), ref('halo-12', 'A', 0), 'halo-12')],
    teachingNumbers: { 'S → Halo 1-2': 90 },
    catheters: ['halo']
  });
  define({
    id: 'cti-cs-pacing-after', caseId: 'flutter-cti', section: 'treatment', windowMs: 1200, channels: CH_FLUTTER,
    // Double potentials on the line: the second component (the far side of the line) arrives late.
    events: merge(atrialSitePacing(stims, 'cs-910', csAfter), { 'abl-d': stims.map((t) => ev('A', t + 145, 0.3)) }),
    markers: stims.map((t) => ({ t, label: { tr: 'S (proksimal CS)', en: 'S (proximal CS)' } })),
    calipers: [
      cal('S → Halo 1-2', ref('cs-910', 'S', 0), ref('halo-12', 'A', 0), 'halo-12'),
      cal('DP', ref('abl-d', 'A', 0), ref('abl-d', 'A', 1))
    ],
    teachingNumbers: { 'S → Halo 1-2': 210, DP: 120 },
    catheters: ['halo']
  });
  // Low lateral RA pacing after ablation: the CS ostium is reached only around the roof and down the septum.
  const llAfter = { 'halo-12': 8, 'halo-34': 30, 'halo-56': 55, 'halo-78': 80, 'halo-910': 105, hra: 120, 'his-d': 165, 'cs-910': 185, 'cs-12': 215, 'abl-d': 30 };
  define({
    id: 'cti-lowlat-pacing-after', caseId: 'flutter-cti', section: 'treatment', windowMs: 1200, channels: CH_FLUTTER,
    events: merge(atrialSitePacing(stims, 'halo-12', llAfter), { 'abl-d': stims.map((t) => ev('A', t + 150, 0.3)) }),
    markers: stims.map((t) => ({ t, label: { tr: 'S (düşük lateral RA)', en: 'S (low lateral RA)' } })),
    calipers: [cal('S → CS 9-10', ref('halo-12', 'S', 0), ref('cs-910', 'A', 0), 'cs-910')],
    teachingNumbers: { 'S → CS 9-10': 185 },
    catheters: ['halo']
  });
}

// ---------------------------------------------------------------------------
// Case 16: superior paraseptal (para-Hisian) pathway. Para-Hisian pacing in
// sinus rhythm: His+RV versus RV-only capture, the extranodal response, and a
// direct atrial capture that makes the test uninterpretable. H-A is shown on
// the nodal comparison so S-A and H-A are not confused.
// ---------------------------------------------------------------------------
const A_PARAHIS = { 'his-d': 60, 'his-p': 58, 'cs-910': 75, hra: 80, 'cs-12': 110 };
define({
  id: 'ph-svt', caseId: 'ap-parahisian', section: 'diagnosis', windowMs: 1400, channels: CH_SVT,
  // Septal VA 75 ms: below 70 ms an orthodromic AVRT is argued against (R9); the pathway still conducts next to the His.
  events: svtRun([150, 480, 810, 1140], { 'his-p': 73, 'his-d': 75, 'cs-910': 93, hra: 90, 'cs-56': 107, 'cs-12': 125 }),
  calipers: [
    cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA', ref('his-d', 'V', 1), ref('his-d', 'A', 1))
  ],
  teachingNumbers: { TCL: 330, VA: 75 }
});
define({
  id: 'ph-parahis-extranodal', caseId: 'ap-parahisian', section: 'maneuver', maneuver: 'para-his', result: 'valid',
  windowMs: 1400, channels: CH_SVT,
  events: merge(paraHisBeat(150, A_PARAHIS, true), paraHisBeat(750, A_PARAHIS, false)),
  markers: [
    { t: 150, label: { tr: 'S: His+RV yakalama', en: 'S: His+RV capture' } },
    { t: 750, label: { tr: 'S: yalnız RV yakalama', en: 'S: RV-only capture' } }
  ],
  calipers: [
    cal('S-A (His+RV)', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d'),
    cal('S-A (RV)', ref('rv', 'S', 1), ref('his-d', 'A', 1), 'his-d')
  ],
  teachingNumbers: { 'S-A (His+RV)': 60, 'S-A (RV)': 60 }
});
define({
  id: 'ph-parahis-nodal-ha', caseId: 'ap-parahisian', section: 'maneuver', maneuver: 'para-his', result: 'valid',
  windowMs: 1400, channels: CH_SVT,
  // After ablation of the pathway (reference comparison): nodal response. With
  // RV-only capture the retrograde H appears after V; H-A stays constant while S-A lengthens.
  events: merge(
    paraHisBeat(150, { 'his-d': 100, 'his-p': 98, 'cs-910': 110, hra: 120, 'cs-12': 145 }, true),
    { 'his-d': [ev('H', 150 + 45, 0.4, 4)] },
    paraHisBeat(750, { 'his-d': 145, 'his-p': 143, 'cs-910': 155, hra: 165, 'cs-12': 190 }, false),
    { 'his-d': [ev('H', 750 + 90, 0.4, 4)] }
  ),
  markers: [
    { t: 150, label: { tr: 'S: His+RV yakalama', en: 'S: His+RV capture' } },
    { t: 750, label: { tr: 'S: yalnız RV yakalama', en: 'S: RV-only capture' } }
  ],
  calipers: [
    cal('S-A (His+RV)', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d'),
    cal('S-A (RV)', ref('rv', 'S', 1), ref('his-d', 'A', 1), 'his-d'),
    cal('H-A (His+RV)', ref('his-d', 'H', 0), ref('his-d', 'A', 0), 'his-p'),
    cal('H-A (RV)', ref('his-d', 'H', 1), ref('his-d', 'A', 1), 'his-p')
  ],
  teachingNumbers: { 'S-A (His+RV)': 100, 'S-A (RV)': 145, 'H-A (His+RV)': 55, 'H-A (RV)': 55 }
});
define({
  id: 'ph-parahis-direct-a', caseId: 'ap-parahisian', section: 'maneuver', maneuver: 'para-his', result: 'invalidCapture',
  windowMs: 1400, channels: CH_SVT,
  // High output: the stimulus also captures the atrium directly: A appears with the stimulus.
  events: merge(
    paraHisBeat(150, { 'his-d': 12, 'his-p': 10, 'cs-910': 35, hra: 45, 'cs-12': 70 }, true),
    paraHisBeat(750, { 'his-d': 12, 'his-p': 10, 'cs-910': 35, hra: 45, 'cs-12': 70 }, false)
  ),
  markers: [
    { t: 150, label: { tr: 'S: A + His + RV yakalama', en: 'S: A + His + RV capture' } },
    { t: 750, label: { tr: 'S: A + RV yakalama', en: 'S: A + RV capture' } }
  ],
  calipers: [cal('S-A', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d')],
  teachingNumbers: { 'S-A': 12 }
});
define({
  id: 'ph-post', caseId: 'ap-parahisian', section: 'treatment', windowMs: 1300, channels: CH_LEGACY,
  events: merge(sinusBeat(100), sinusBeat(700)),
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0)),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0))
  ],
  teachingNumbers: { AH, HV }
});

// ---------------------------------------------------------------------------
// Manifest pathway: bipolar versus unipolar at two candidate sites in
// preexcited sinus rhythm (report section 6; R8).
// ---------------------------------------------------------------------------
{
  const CH_UNI = ['ecg-ii', 'ecg-v1', 'his-d', 'cs-910', 'cs-12', 'abl-d', 'abl-uni'];
  const site = (vLocal, kind, withA) => {
    const t0s = [100, 700];
    return merge(...t0s.map((t0) => merge(
      sinusBeat(t0, { delta: t0 + 140, ablV: 140 + vLocal, ablA: withA }),
      unipolar(t0 + 140 + vLocal, kind)
    )));
  };
  define({
    id: 'ap-lm-uni-site1', caseId: 'ap-left-manifest', section: 'treatment', windowMs: 1300, channels: CH_UNI,
    events: site(-12, 'rS', 60),
    calipers: [cal('V-delta', ref('ecg-ii', 'delta', 0), ref('abl-d', 'V', 0), 'abl-d')],
    teachingNumbers: { 'V-delta': -12 }
  });
  define({
    id: 'ap-lm-uni-site2', caseId: 'ap-left-manifest', section: 'treatment', windowMs: 1300, channels: CH_UNI,
    events: site(-20, 'QS', 55),
    calipers: [cal('V-delta', ref('ecg-ii', 'delta', 0), ref('abl-d', 'V', 0), 'abl-d')],
    teachingNumbers: { 'V-delta': -20 }
  });
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// Advanced cases (phase D: para-Hisian AT, fascicular VT, bundle branch reentry) live in ep-cases-advanced.js.
DEFS.push(...ADVANCED_DEFS);
const RECORDINGS = new Map(DEFS.map((def) => [def.id, deepFreeze({ markers: [], calipers: [], ...def })]));

/** Sections of the module, in order. */
export const EP_SECTIONS = Object.freeze(['diagnosis', 'maneuver', 'treatment']);

/**
 * Case catalog: mechanism, pathway zone and conduction direction are separate
 * axes (report section 3). Text lives in ep-case-text.js under the same ids.
 */
export const EP_CASES = Object.freeze([
  { id: 'avnrt-typical', mechanism: 'avnrt-typical', pathwayZone: 'koch-slow-pathway', conduction: ['antegrade-nodal', 'retrograde-fast'], citations: ['R1', 'R2', 'R9', 'R10'] },
  { id: 'avnrt-atypical', mechanism: 'avnrt-atypical', pathwayZone: 'koch-inferior-extensions', conduction: ['antegrade-fast', 'retrograde-slow'], citations: ['R1', 'R2', 'R12'] },
  { id: 'ap-left-lateral', mechanism: 'avrt-orthodromic', pathwayZone: 'left-free-wall', conduction: ['retrograde-only'], citations: ['R3', 'R10', 'R11'] },
  { id: 'ap-inf-paraseptal', mechanism: 'avrt-orthodromic', pathwayZone: 'inferior-paraseptal', conduction: ['retrograde-only'], citations: ['R5', 'R6', 'R10', 'R13'] },
  { id: 'pjrt', mechanism: 'pjrt', pathwayZone: 'inferior-paraseptal', conduction: ['retrograde-decremental'], citations: ['R4'] },
  { id: 'ap-left-manifest', mechanism: 'wpw-pattern', pathwayZone: 'left-free-wall', conduction: ['antegrade', 'retrograde'], citations: ['R3', 'R8', 'R14'] },
  { id: 'focal-at', mechanism: 'focal-at', pathwayZone: 'crista-terminalis', conduction: ['atrial-focus'], citations: ['R9', 'R10'] },
  { id: 'ap-parahisian', mechanism: 'avrt-orthodromic', pathwayZone: 'superior-paraseptal', conduction: ['retrograde-only'], citations: ['R4', 'R5', 'R13'] },
  { id: 'flutter-cti', mechanism: 'flutter-ccw', pathwayZone: 'cavotricuspid-isthmus', conduction: ['macroreentry-ccw'], citations: ['R15', 'R9', 'R10'] },
  ...ADVANCED_CASES
].map(deepFreeze));

/** The mandatory CS ostium comparison set (report section 5). */
export const CS_OSTIUM_COMPARISON = Object.freeze(['avnrt-typ-svt', 'avnrt-atyp-svt', 'ap-ips-svt', 'pjrt-svt']);

/** Frozen recording (clip) by id, or null. */
export function epRecording(id) {
  return RECORDINGS.get(id) || null;
}

/** Clip ids of a case within one section, in definition order. */
export function epClips(caseId, section) {
  return DEFS.filter((d) => d.caseId === caseId && d.section === section).map((d) => d.id);
}

/** All recording ids. */
export const EP_RECORDING_IDS = Object.freeze(DEFS.map((d) => d.id));

/** Maneuver result states (report section 10 contract). */
export const MANEUVER_RESULTS = Object.freeze(['valid', 'invalidCapture', 'insufficientEvidence']);
