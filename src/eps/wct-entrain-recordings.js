/*
 * Wide complex tachycardia (WCT) and scar VT entrainment recordings, after
 * Ho RT, Electrophysiology of Arrhythmias, 2nd ed. 2019 (chapter 17: figs
 * 17-10 capture and fusion, 17-17 VT with AV dissociation, 17-18 SVT with
 * bundle branch block; chapter 20: fig 20-11 central isthmus site) and
 * Stevenson WG et al. 1993. Synthetic teaching timelines on a millisecond
 * scale; fiducial events stand for measured onsets and electrograms.
 */
import { surfaceBeat, merge, ev, far, mono, CH_SVT } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

export const WCT_SOURCE = 'https://doi.org/10.1161/01.cir.88.4.1647'; // Stevenson 1993; Ho 2019 (book, ISBN 9781975101107)

export const WCT_EXAMPLES = Object.freeze([
  ['wct-vt-vs-svt', 'WCT: VT mi aberran SVT mi? (HV aralığı)', 'WCT: VT or aberrant SVT? (HV interval)'],
  ['scar-vt-entrain', 'Skar VT: concealed entrainment ve istmus', 'Scar VT: concealed entrainment and isthmus']
].map(Object.freeze));

// ---------------------------------------------------------------------------
// 1. WCT (Ho figs 17-10, 17-17, 17-18). The first beat is a conducted sinus
// beat: A, H, then V with a normal HV (50 ms), the reference for any
// supraventricular rhythm, aberrant or not (H before every V, HV >= the
// sinus HV). A PVC then starts VT (TCL 380 ms): wide QRS, His after the V
// onset (retrograde), sinus P waves marching through at their own rate
// (P-P 640 ms, AV dissociation). One sinus P lands when the His-Purkinje
// system has recovered and captures the ventricles: a narrow QRS that comes
// early (before the next VT beat is due) with a normal HV.
// ---------------------------------------------------------------------------
const SINUS_PP = 640;
const conductedBeat = (a) => {
  const h = a + 90, v = h + 50;   // AH 90, HV 50
  return merge(surfaceBeat(v, { p: a - 10 }), {
    hra: [ev('A', a - 5, 0.85), far('V', v + 15, 0.25)],
    'his-p': [ev('A', a - 2, 0.6), ev('H', h, 0.4, 4), ev('V', v, 0.75)],
    'his-d': [ev('A', a, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', a + 15, 0.75), far('V', v + 20, 0.4)],
    'cs-56': [ev('A', a + 30, 0.7), far('V', v + 25, 0.4)],
    'cs-12': [ev('A', a + 50, 0.65), far('V', v + 30, 0.4)],
    rv: [ev('V', v + 5, 0.95)]
  });
};
// A sinus P during VT: atrial activation only (AV dissociation).
const dissociatedP = (a) => ({
  'ecg-ii': [mono('P', a - 10, 0.22, 10)],
  hra: [ev('A', a - 5, 0.85)],
  'his-p': [ev('A', a - 2, 0.6)],
  'his-d': [ev('A', a, 0.35)],
  'cs-910': [ev('A', a + 15, 0.75)],
  'cs-56': [ev('A', a + 30, 0.7)],
  'cs-12': [ev('A', a + 50, 0.65)]
});
const vtBeat = (v) => merge(surfaceBeat(v, { wide: true }), {
  'his-p': [ev('V', v, 0.75), ev('H', v + 40, 0.35, 4)],
  'his-d': [ev('V', v, 0.9), ev('H', v + 40, 0.55, 4)],   // retrograde His after the V onset
  hra: [far('V', v + 25, 0.3)],
  'cs-910': [far('V', v + 20, 0.4)],
  'cs-56': [far('V', v + 25, 0.4)],
  'cs-12': [far('V', v + 30, 0.4)],
  rv: [ev('V', v - 25, 0.95)]
});

const recordings = {};

// Sinus A every 640 ms: 100 (conducted), 740 and 1380 (during VT, dissociated), 2020 (capture: its QRS at
// 2160 comes 40 ms before the VT beat due at 2200).
const CAPTURE_A = 100 + 3 * SINUS_PP;
recordings['wct-vt-vs-svt'] = {
  id: 'wct-vt-vs-svt', mechanism: 'vt-scar', windowMs: 2500, channels: CH_SVT,
  events: merge(
    conductedBeat(100),
    vtBeat(680), vtBeat(1060), vtBeat(1440), vtBeat(1820),
    dissociatedP(100 + SINUS_PP), dissociatedP(100 + 2 * SINUS_PP),
    conductedBeat(CAPTURE_A)
  ),
  markers: [
    { t: 100, label: { tr: 'İletilen sinüs atımı: H, V\'den önce, HV 50 ms (referans)', en: 'Conducted sinus beat: H before V, HV 50 ms (reference)' } },
    { t: 680, label: { tr: 'VT: geniş QRS, His V\'den sonra (retrograd)', en: 'VT: wide QRS, His after the V (retrograde)' } },
    { t: 100 + SINUS_PP, label: { tr: 'AV disosiasyon: sinüs P kendi hızında', en: 'AV dissociation: sinus P at its own rate' } },
    { t: CAPTURE_A, label: { tr: 'Capture atımı: erken, dar QRS, HV 50 ms', en: 'Capture beat: early, narrow QRS, HV 50 ms' } }
  ],
  calipers: [
    cal('HV (sinüs)', ref('his-d', 'H', 0), ref('his-d', 'V', 0), 'his-d'),
    cal('TCL (VT)', ref('rv', 'V', 1), ref('rv', 'V', 2), 'rv'),
    cal('V-H (VT retrograd)', ref('his-d', 'V', 1), ref('his-d', 'H', 1), 'his-d'),
    cal('P-P (sinüs)', ref('hra', 'A', 1), ref('hra', 'A', 2), 'hra'),
    cal('HV (capture)', ref('his-d', 'H', 5), ref('his-d', 'V', 5), 'his-d')
  ],
  derivedMeasurements: []
};

// ---------------------------------------------------------------------------
// 2. Scar VT entrainment at a central isthmus site (Ho fig 20-11: S-QRS 39 %
// of the TCL, S-QRS - EGM-QRS 10 ms, PPI - TCL 10 ms). TCL 400 ms; the
// ablation catheter records a mid-diastolic potential (MDP) 145 ms before
// the QRS. Pacing from it at 370 ms: QRS identical to the VT (concealed
// fusion), S-QRS 155 ms, PPI 410 ms.
// ---------------------------------------------------------------------------
const CH_SCAR_VT = ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'rv', 'abl-d', 'abl-p'];
const EGM_QRS = 145, S_QRS = 155;

const scarVtBeat = (v) => merge(surfaceBeat(v, { wide: true }), {
  'his-d': [far('V', v, 0.4)],
  rv: [ev('V', v + 20, 0.7)],
  'abl-d': [ev('MDP', v - EGM_QRS, 0.55, 4), far('V', v + 15, 0.5)],
  'abl-p': [far('V', v + 20, 0.5)],
  hra: [ev('A', v - 40, 0.3)]   // dissociated atrial activity
});

const scarVtPacedBeat = (s) => {
  const v = s + S_QRS;
  return merge(surfaceBeat(v, { wide: true }), {
    'abl-d': [ev('S', s, 1.0, 3), far('V', v + 15, 0.5)],
    'abl-p': [ev('S', s, 0.8, 3), far('V', v + 20, 0.5)],
    rv: [ev('V', v + 20, 0.7)],
    'his-d': [far('V', v, 0.4)]
  });
};

// Last stimulus at 1710; the first return MDP comes one revolution later (PPI 410), its QRS 145 ms after.
const LAST_S = 1710, PPI = 410;
recordings['scar-vt-entrain'] = {
  id: 'scar-vt-entrain', mechanism: 'vt-scar', windowMs: 2900, channels: CH_SCAR_VT,
  events: merge(
    scarVtBeat(200), scarVtBeat(600),
    scarVtPacedBeat(970), scarVtPacedBeat(1340), scarVtPacedBeat(LAST_S),
    scarVtBeat(LAST_S + PPI + EGM_QRS), scarVtBeat(LAST_S + PPI + EGM_QRS + 400)
  ),
  markers: [
    { t: 600, label: { tr: 'VT (TCL 400 ms): ABL\'de mid-diyastolik potansiyel (MDP)', en: 'VT (TCL 400 ms): mid-diastolic potential (MDP) on ABL' } },
    { t: 970, label: { tr: 'İstmustan pacing: concealed füzyon (QRS VT ile aynı)', en: 'Pacing from the isthmus: concealed fusion (QRS identical to VT)' } },
    { t: LAST_S, label: { tr: 'Son S: PPI ve S-QRS', en: 'Last S: PPI and S-QRS' } }
  ],
  calipers: [
    cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
    cal('PCL', ref('abl-d', 'S', 0), ref('abl-d', 'S', 1), 'abl-d'),
    cal('PPI', ref('abl-d', 'S', 2), ref('abl-d', 'MDP', 2), 'abl-d'),
    cal('S-QRS', ref('abl-d', 'S', 2), ref('ecg-ii', 'V', 4), 'abl-d'),
    cal('MDP-QRS', ref('abl-d', 'MDP', 1), ref('ecg-ii', 'V', 1), 'abl-d')
  ],
  derivedMeasurements: [
    { label: 'PPI−TCL', subtract: ['PPI', 'TCL'] },
    { label: 'S-QRS − MDP-QRS', subtract: ['S-QRS', 'MDP-QRS'] }
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
    tr: 'Geniş QRS taşikardi ayırıcı tanısı (Ho 2019, Şekil 17-10, 17-17, 17-18): Aberran iletili SVT\'de uyarı ventriküle His-Purkinje sistemi üzerinden iner; her QRS\'ten önce bir His potansiyeli vardır ve HV, sinüs ritmindeki HV\'ye eşit ya da daha uzundur. VT\'de ise His potansiyeli ya görülmez ya QRS başlangıcından sonra gelir (retrograd His; burada V-H 40 ms) ya da QRS\'ten önce ama sinüs HV\'sinden kısa bir aralıkla gelir. Bu kayıtta ilk atım iletilen sinüs atımıdır (HV 50 ms, referans). Ardından VT başlar (TCL 380 ms); sinüs P dalgaları kendi hızında (P-P 640 ms) ilerler: AV disosiasyon. His-Purkinje sistemi toparlandığında gelen bir sinüs P ventrikülü yakalar: erken gelen, dar QRS\'li ve HV\'si normal bir capture atımı. AV disosiasyon ve capture atımları VT lehine güçlü bulgulardır.',
    en: 'Differential diagnosis of a wide complex tachycardia (Ho 2019, figs 17-10, 17-17, 17-18): in SVT with aberrancy the impulse reaches the ventricles over the His-Purkinje system; a His potential precedes every QRS and the HV equals or exceeds the sinus HV. In VT the His potential is absent, follows the QRS onset (retrograde His; here V-H 40 ms), or precedes the QRS with an HV shorter than in sinus rhythm. Here the first beat is a conducted sinus beat (HV 50 ms, the reference). VT then starts (TCL 380 ms); sinus P waves march through at their own rate (P-P 640 ms): AV dissociation. A sinus P arriving when the His-Purkinje system has recovered captures the ventricles: an early, narrow capture beat with a normal HV. AV dissociation and capture beats strongly favour VT.',
    source: WCT_SOURCE
  },
  'scar-vt-entrain': {
    tr: 'Skar VT\'de entrainment ve istmus (Ho 2019, Şekil 20-11; Stevenson 1993): Eski infarktüs skarında makroreentran VT (TCL 400 ms). Ablasyon kateteri korunmuş yavaş iletim koridorunda (istmus) diyastol ortasında düşük voltajlı bir potansiyel (MDP) kaydeder; MDP-QRS 145 ms. Taşikardiden biraz hızlı pacing (PCL 370 ms) ile: 1) concealed füzyon: 12 derivasyonda paced QRS VT ile aynıdır; 2) PPI 410 ms, PPI − TCL 10 ms (≤ 30 ms: nokta devrenin içinde); 3) S-QRS 155 ms, MDP-QRS 145 ms: fark 10 ms (≤ 20 ms: bystander değil); 4) S-QRS / TCL = 0,39: central istmus (0,3-0,5; < 0,3 exit, 0,5-0,7 proximal). Bu ölçütleri birlikte karşılayan nokta ablasyon için uygun hedeftir; Ho\'nun örneğinde RF taşikardiyi 9,2 saniyede sonlandırır.',
    en: 'Entrainment and the isthmus in scar VT (Ho 2019, fig 20-11; Stevenson 1993): macroreentrant VT in an old infarct scar (TCL 400 ms). In the protected slow conducting channel (isthmus) the ablation catheter records a low-voltage mid-diastolic potential (MDP); MDP-QRS 145 ms. Pacing slightly faster than the VT (PCL 370 ms) shows: 1) concealed fusion: the paced QRS is identical to the VT in 12 leads; 2) PPI 410 ms, PPI − TCL 10 ms (≤ 30 ms: the site is in the circuit); 3) S-QRS 155 ms against MDP-QRS 145 ms: 10 ms apart (≤ 20 ms: not a bystander); 4) S-QRS / TCL = 0.39: central isthmus (0.3-0.5; < 0.3 exit, 0.5-0.7 proximal). A site meeting these together is a good ablation target; in Ho\'s example RF ends the tachycardia in 9.2 s.',
    source: WCT_SOURCE
  }
});
