/*
 * Wide Complex Tachycardia (WCT) and Scar VT Entrainment recordings
 * based on Reginald T. Ho MD (2019, Chapters 17 & 20) and Stevenson WG (1993).
 * Synthetic teaching timelines on a millisecond scale; fiducial events stand
 * for measured onsets and electrograms.
 */
import { surfaceBeat, svtBeat, merge, ev, far, mono, CH_SVT } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

export const WCT_SOURCE = 'https://pubmed.ncbi.nlm.nih.gov/8222110/'; // Stevenson 1993 / Ho 2019

export const WCT_EXAMPLES = Object.freeze([
  ['wct-vt-vs-svt', 'WCT: VT vs Aberran SVT (HV Aralığı)', 'WCT: VT vs Aberrant SVT (HV Interval)'],
  ['scar-vt-entrain', 'Skar VT: Gizli Entrainment ve İshmus', 'Scar VT: Concealed Entrainment and Isthmus']
].map(Object.freeze));

// ---------------------------------------------------------------------------
// 1. WCT: VT vs SVT with LBBB aberrancy (Ho 2019 Ch 17 Figs 17-1, 17-21)
// Beat 0: SVT with LBBB aberrancy. A precedes H (AH = 110 ms), H precedes wide V
//         with normal HV = +50 ms.
// Beat 1: Spontaneous PVC initiates VT.
// Beats 2-4: Ventricular tachycardia (TCL = 380 ms). AV dissociation: sinus A's
//            march through independently (P-P = 760 ms). No antegrade His spike;
//            retrograde His deflection is buried after V onset (HV < 0 ms / negative HV).
// Beat 5: Fusion/capture beat: narrow QRS with normal HV = 50 ms.
// ---------------------------------------------------------------------------
const wctAberrantBeat = (v) => {
  const h = v - 50;
  const a = h - 110;
  return merge(surfaceBeat(v, { p: a - 10, wide: true }), {
    hra: [ev('A', a - 5, 0.85), far('V', v + 15, 0.25)],
    'his-p': [ev('A', a - 2, 0.6), ev('H', h, 0.4, 4), ev('V', v, 0.75)],
    'his-d': [ev('A', a, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', a + 15, 0.75), far('V', v + 20, 0.4)],
    'cs-56': [ev('A', a + 30, 0.7), far('V', v + 25, 0.4)],
    'cs-12': [ev('A', a + 50, 0.65), far('V', v + 30, 0.4)],
    rv: [ev('V', v - 10, 0.95)]
  });
};

const wctVtBeat = (v, { retrogradeHis = true } = {}) => {
  // VT: ventricular origin. His occurs after V onset (retrograde) or dissociated.
  const hRetro = v + 40;
  return merge(surfaceBeat(v, { wide: true }), {
    'his-p': [ev('V', v, 0.75), ...(retrogradeHis ? [ev('H', hRetro, 0.35, 4)] : [])],
    'his-d': [ev('V', v, 0.9), ...(retrogradeHis ? [ev('H', hRetro, 0.55, 4)] : [])],
    rv: [ev('V', v - 25, 0.95)], // Early RV apical activation
    'cs-910': [far('V', v + 20, 0.4)],
    'cs-56': [far('V', v + 25, 0.4)],
    'cs-12': [far('V', v + 30, 0.4)]
  });
};

const recordings = {};

recordings['wct-vt-vs-svt'] = {
  id: 'wct-vt-vs-svt', mechanism: 'fascicular-reentry', windowMs: 2500, channels: CH_SVT,
  events: merge(
    wctAberrantBeat(250),
    wctVtBeat(680),
    wctVtBeat(1060),
    wctVtBeat(1440),
    wctVtBeat(1820),
    wctAberrantBeat(2200), // capture beat
    // Independent sinus atrial activity showing AV dissociation
    {
      hra: [ev('A', 800, 0.85), ev('A', 1560, 0.85)],
      'ecg-ii': [mono('P', 790, 0.2, 10), mono('P', 1550, 0.2, 10)]
    }
  ),
  markers: [
    { t: 250, label: { tr: 'Aberran SVT: HV = +50 ms (H, V\'yi önceler)', en: 'Aberrant SVT: HV = +50 ms (H precedes V)' } },
    { t: 680, label: { tr: 'VT başlangıcı: Negatif/retrograd HV (H, V\'den sonra)', en: 'VT onset: Negative/retrograde HV (H follows V)' } },
    { t: 800, label: { tr: 'AV Disosiasyon: Bağımsız sinüs P dalgası', en: 'AV Dissociation: Independent sinus P wave' } },
    { t: 2200, label: { tr: 'Yakalama vuruşu (Capture beat): Normal HV', en: 'Capture beat: Normal HV restored' } }
  ],
  calipers: [
    cal('HV (Aberrans)', ref('his-d', 'H', 0), ref('his-d', 'V', 0), 'his-d'),
    cal('TCL (VT)', ref('rv', 'V', 1), ref('rv', 'V', 2), 'rv'),
    cal('V-H (VT retrograd)', ref('his-d', 'V', 1), ref('his-d', 'H', 1), 'his-d')
  ],
  derivedMeasurements: []
};

// ---------------------------------------------------------------------------
// 2. Scar VT Entrainment & Critical Isthmus (Ho 2019 Ch 20 Figs 20-11 to 20-17)
// Post-infarct LV scar reentry. Spontaneous TCL = 400 ms.
// ABL catheter in the critical protected isthmus records a sharp mid-diastolic
// potential (MDP) 110 ms before surface QRS.
// Overdrive pacing from ABL at 370 ms (3 beats):
// - Concealed entrainment: paced 12-lead QRS is identical to VT.
// - S-QRS = 110 ms equals local MDP-QRS = 110 ms.
// - Post-Pacing Interval (PPI) = 380 ms (PPI - TCL = 10 ms <= 30 ms).
// ---------------------------------------------------------------------------
const CH_SCAR_VT = ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'rv', 'abl-d', 'abl-p'];

const scarVtSpontaneousBeat = (v) => merge(surfaceBeat(v, { wide: true }), {
  'his-d': [far('V', v, 0.4)],
  rv: [ev('V', v + 20, 0.7)],
  'abl-d': [
    ev('MDP', v - 110, 0.55, 4), // Mid-diastolic potential in slow isthmus
    ev('V', v + 15, 0.85, 6)     // Local exit / far-field ventricular component
  ],
  'abl-p': [ev('V', v + 20, 0.7, 6)],
  hra: [ev('A', v - 40, 0.3)]   // Dissociated or retrogradely conducting A
});

const scarVtPacedBeat = (s) => {
  const v = s + 110; // S-QRS = 110 ms exactly equals MDP-QRS
  return merge(surfaceBeat(v, { wide: true }), {
    'abl-d': [ev('S', s, 1.0, 3), ev('V', v + 15, 0.85, 6)],
    'abl-p': [ev('S', s, 0.8, 3), ev('V', v + 20, 0.7, 6)],
    rv: [ev('V', v + 20, 0.7)],
    'his-d': [far('V', v, 0.4)]
  });
};

recordings['scar-vt-entrain'] = {
  id: 'scar-vt-entrain', mechanism: 'fascicular-reentry', windowMs: 2900, channels: CH_SCAR_VT,
  events: merge(
    scarVtSpontaneousBeat(200),
    scarVtSpontaneousBeat(600),
    scarVtPacedBeat(970),
    scarVtPacedBeat(1340),
    scarVtPacedBeat(1710), // Last paced beat (s = 1710)
    scarVtSpontaneousBeat(2230), // First returned spontaneous beat (MDP at 2120, return V at 2230 -> PPI = 2120 - 1710 = 410 ms)
    scarVtSpontaneousBeat(2630)
  ),
  markers: [
    { t: 600, label: { tr: 'Spontan VT (TCL 400 ms): ABL kanalında mid-diyastolik potansiyel (MDP)', en: 'Spontaneous VT (TCL 400 ms): Mid-diastolic potential (MDP) on ABL' } },
    { t: 970, label: { tr: 'İsthmus Pacing: Gizli entrainment (aynı QRS morfolojisi)', en: 'Isthmus Pacing: Concealed entrainment (identical QRS morphology)' } },
    { t: 1710, label: { tr: 'Son S: PPI ve S-QRS ölçümü', en: 'Last S: PPI and S-QRS measurement' } }
  ],
  calipers: [
    cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
    cal('PCL', ref('abl-d', 'S', 0), ref('abl-d', 'S', 1), 'abl-d'),
    cal('PPI', ref('abl-d', 'S', 2), ref('abl-d', 'MDP', 2), 'abl-d'),
    cal('S-QRS', ref('abl-d', 'S', 2), ref('ecg-ii', 'V', 4), 'abl-d'),
    cal('MDP-QRS', ref('abl-d', 'MDP', 1), ref('ecg-ii', 'V', 1), 'abl-d')
  ],
  derivedMeasurements: [
    { label: 'PPI−TCL', subtract: ['PPI', 'TCL'] }
  ]
};

/** Fresh copy so caliper/recorder callers cannot mutate other examples. */
export function wctRecording(id) {
  return recordings[id] ? structuredClone({ markers: [], ...recordings[id] }) : null;
}

export function wctMeasurements(recording) {
  if (!recording) return {};
  const values = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  for (const { label, subtract: [a, b] } of recording.derivedMeasurements || []) {
    values[label] = values[a] == null || values[b] == null ? null : values[a] - values[b];
  }
  return values;
}

export const WCT_TEXT = Object.freeze({
  'wct-vt-vs-svt': {
    tr: 'Geniş QRS Taşikardi (WCT) Ayırıcı Tanısı (Ho 2019 Bölüm 17, Şekil 17-1 ve 17-21): Aberran iletili SVT\'de supraventriküler uyarı His-Purkinje ekseni üzerinden ventriküle ulaştığı için His potansiyeli QRS\'ten önce gelir ve HV aralığı normaldir (burada HV = +50 ms). Ventrikül taşikardisinde (VT) ise odak myokard veya distal Purkinje kaynaklıdır; His defleksiyonu ya atriyumla birlikte bağımsız seyreder (AV disosiasyon) ya da ventrikülden sonra retrograd uyarılır (HV < 0 ms / negatif HV). İntermitan sinüs yakalama vuruşları (capture beat) dar QRS ve normal HV ile taşikardiyi keserek VT tanısını doğrular.',
    en: 'Wide Complex Tachycardia (WCT) Differential Diagnosis (Ho 2019 Chapter 17, Figs 17-1 & 17-21): In SVT with aberrancy, conduction proceeds antegradely through the His-Purkinje system; the His bundle spike precedes QRS with a normal HV interval (here HV = +50 ms). In Ventricular Tachycardia (VT), activation originates in the ventricle; His activation is either dissociated from the ventricles (AV dissociation) or conducted retrogradely, yielding a negative HV interval (His follows ventricular onset). Intermittent capture beats demonstrate narrow QRS with normal HV, confirming VT.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/8222110/'
  },
  'scar-vt-entrain': {
    tr: 'Skar Zeminli VT Entrainment ve Kritik İsthmus Haritalaması (Ho 2019 Bölüm 20, Stevenson 1993): Enfarktüs skarı zemininde makroreentry VT (TCL = 400 ms). Ablasyon kateteri korunan yavaş iletim koridorunda (kritik isthmus) yer aldığında tipik düşük voltajlı mid-diyastolik potansiyel (MDP) kaydeder. Taşikardi hızından biraz daha hızlı pacing (PCL = 370 ms) yapıldığında: 1) Gizli entrainment (concealed entrainment: 12 derivasyon yüzey QRS morfolojisi spontan VT ile 12/12 aynıdır), 2) Post-pacing interval (PPI = 410 ms) ile TCL farkı ≤30 ms\'dir (burada PPI−TCL = 10 ms), 3) Stimulus-QRS aralığı (S-QRS = 110 ms), lokal MDP-QRS aralığına tam eşittir (110 ms). Bu üç kriter kateterin ablasyonla taşikardiyi sonlandıracak kritik koridorda olduğunu kanıtlar.',
    en: 'Scar-Related VT Entrainment and Critical Isthmus Mapping (Ho 2019 Chapter 20, Stevenson 1993): In post-infarct scar-related macroreentry VT (TCL = 400 ms), the ablation catheter located within the protected slow conduction isthmus records a characteristic mid-diastolic potential (MDP). Overdrive pacing slightly faster than VT (PCL = 370 ms) reveals: 1) Concealed entrainment (paced 12-lead QRS is identical to VT without fusion), 2) PPI−TCL ≤ 30 ms (here PPI = 410 ms, difference = 10 ms, proving the site is within the circuit), 3) Stimulus-QRS (S-QRS = 110 ms) equals local MDP-QRS (110 ms). Meeting all three criteria identifies the ideal target for successful radiofrequency ablation.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/8222110/'
  }
});
