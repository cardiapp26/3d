/*
 * Atypical accessory pathways and unusual electrophysiologic phenomena,
 * after Ho RT, Electrophysiology of Arrhythmias, 2nd ed. 2019 (fig 11-20
 * antidromic atriofascicular reentry, fig 12-22 Mahaim potential and
 * ablation, figs 22-1 and 22-2 supernormality in the right bundle) and
 * Sternick EB et al. (Mahaim fibres).
 * Synthetic teaching timelines on a millisecond scale; fiducial events stand
 * for measured onsets and electrograms.
 */
import { surfaceBeat, merge, ev, far, mono, CH_SVT } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

export const ATYPICAL_PHENOMENA_SOURCE = 'https://doi.org/10.15420/aer.2022.12'; // Sternick, Mahaim revisited 2022; Ho 2019 (book, ISBN 9781975101107)

export const ATYPICAL_PHENOMENA_EXAMPLES = Object.freeze([
  ['ap-mahaim', 'Atipik AP: Mahaim (atriyofasiküler) yol ve M potansiyeli', 'Atypical AP: Mahaim (atriofascicular) pathway and M potential'],
  ['ep-supernormality', 'Sıradışı fenomen: süpernormal iletim', 'Unusual phenomenon: supernormal conduction']
].map(Object.freeze));

const CH_MAHAIM = ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'abl-d', 'cs-910', 'cs-12', 'rv'];

// ---------------------------------------------------------------------------
// 1. Mahaim Fiber (Atriofascicular pathway) during antidromic tachycardia (TCL = 340 ms)
// Antegrade over the Mahaim pathway to the distal right bundle branch (LBBB pattern).
// Retrograde up the right bundle, His and AV node (concentric retrograde atrial sequence):
// the His follows the V onset (V-H 15 ms).
// ABL at the lateral tricuspid annulus (the atrial insertion) records, in order, the local A of
// the retrograde atrial activation (the latest atrial site, 150 ms after the V), the Mahaim
// potential (M) and the local V (M-V 40 ms).
// ---------------------------------------------------------------------------
const MAHAIM_TCL = 340;
const mahaimBeat = (v) => {
  const m = v - 40;  // Mahaim potential on the lateral annulus, 40 ms before V
  const hRetro = v + 15; // His retrogradely activated
  const aRetro = hRetro + 105; // Concentric retrograde A (His catheter)
  return merge(surfaceBeat(v, { wide: true }), {
    'abl-d': [
      ev('A', v + 150 - MAHAIM_TCL, 0.4, 5),   // local lateral annulus A of the previous cycle's retrograde activation
      ev('M', m, 0.75, 3),                     // sharp Mahaim potential (ablation target)
      ev('V', v, 0.8, 6)                       // local ventricular potential (M-V = 40 ms)
    ],
    hra: [ev('A', aRetro + 25, 0.8), far('V', v + 25, 0.3)],
    'his-d': [ev('V', v, 0.85), ev('H', hRetro, 0.45, 4), ev('A', aRetro, 0.6)],
    'cs-910': [ev('A', aRetro + 15, 0.7), far('V', v + 20, 0.35)],
    'cs-12': [ev('A', aRetro + 45, 0.65), far('V', v + 25, 0.35)],
    rv: [ev('V', v - 10, 0.95)] // RV apex early due to right fascicular insertion
  });
};

// ---------------------------------------------------------------------------
// 2. Supernormal conduction (Ho 2019 figs 22-1 and 22-2)
// Baseline rhythm: sinus with Right Bundle Branch Block (RBBB, wide QRS = 140 ms).
// P-P = 800 ms.
// At t = 1180 ms, a critically timed PAC (coupling interval = 380 ms) arrives
// exactly during the supernormal period of the right bundle branch.
// The right bundle, blocked at the sinus rate, conducts this one impulse: the QRS
// narrows, with the same HV (no equal bilateral bundle delay).
// ---------------------------------------------------------------------------
const supernormalSinusRbbb = (t) => {
  const aHis = t + 35;
  const h = aHis + 80;
  const v = h + 45;
  return merge(surfaceBeat(v, { p: t, wide: true }), {
    hra: [ev('A', t, 0.9), far('V', v + 15, 0.25)],
    'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', t + 45, 0.8), far('V', v + 20, 0.35)],
    'cs-56': [ev('A', t + 60, 0.7), far('V', v + 22, 0.35)],
    'cs-12': [ev('A', t + 75, 0.7), far('V', v + 25, 0.35)],
    rv: [ev('V', v + 35, 0.9)] // Delayed RV activation in RBBB
  });
};

const supernormalNarrowBeat = (t) => {
  const aHis = t + 40;
  const h = aHis + 105; // Decremental AH on premature beat
  const v = h + 45;     // Normal HV
  return merge(surfaceBeat(v, { p: t, wide: false }), { // narrow QRS: the right bundle conducts
    hra: [ev('A', t, 0.9), far('V', v + 10, 0.25)],
    'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', t + 45, 0.8), far('V', v + 15, 0.35)],
    'cs-56': [ev('A', t + 60, 0.7), far('V', v + 18, 0.35)],
    'cs-12': [ev('A', t + 75, 0.7), far('V', v + 20, 0.35)],
    rv: [ev('V', v - 5, 0.9)] // Normal simultaneous RV activation
  });
};

const recordings = {};

recordings['ap-mahaim'] = {
  id: 'ap-mahaim', mechanism: 'mahaim-antidromic', windowMs: 2200, channels: CH_MAHAIM,
  events: merge(
    mahaimBeat(200),
    mahaimBeat(540),
    mahaimBeat(880),
    mahaimBeat(1220),
    mahaimBeat(1560),
    mahaimBeat(1900)
  ),
  markers: [
    { t: 540, label: { tr: 'Antidromik taşikardi (LBBB morfolojisi, TCL 340 ms)', en: 'Antidromic tachycardia (LBBB morphology, TCL 340 ms)' } },
    { t: 840, label: { tr: 'ABL: Triküspit anulusunda keskin M potansiyeli (M-V 40 ms)', en: 'ABL: Sharp M potential on tricuspid annulus (M-V 40 ms)' } }
  ],
  calipers: [
    cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
    cal('M-V', ref('abl-d', 'M', 2), ref('abl-d', 'V', 2), 'abl-d'),
    cal('V-A (retrograd)', ref('his-d', 'V', 2), ref('his-d', 'A', 2), 'his-d')
  ],
  derivedMeasurements: []
};

recordings['ep-supernormality'] = {
  id: 'ep-supernormality', mechanism: 'sinus', windowMs: 2600, channels: CH_SVT,
  events: merge(
    supernormalSinusRbbb(100),
    supernormalSinusRbbb(900),
    supernormalNarrowBeat(1280), // Critically timed PAC at supernormal period
    supernormalSinusRbbb(2000)
  ),
  markers: [
    { t: 900, label: { tr: 'Temel ritim: Sinüs + Sağ Dal Bloğu (Geniş QRS)', en: 'Baseline: Sinus + Right Bundle Branch Block (Wide QRS)' } },
    { t: 1280, label: { tr: 'Erken atriyal atım süpernormal pencerede: QRS daralır, HV aynı', en: 'Premature atrial beat in the supernormal window: narrow QRS, same HV' } }
  ],
  calipers: [
    cal('P-P (Sinüs)', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii'),
    cal('P1-P2 (PAC)', ref('ecg-ii', 'P', 1), ref('ecg-ii', 'P', 2), 'ecg-ii'),
    cal('HV', ref('his-d', 'H', 2), ref('his-d', 'V', 2), 'his-d')
  ],
  derivedMeasurements: []
};

/** Fresh copy so caliper/recorder callers cannot mutate other examples. */
export function atypicalPhenomenaRecording(id) {
  return recordings[id] ? structuredClone({ markers: [], ...recordings[id] }) : null;
}

export function atypicalPhenomenaMeasurements(recording) {
  if (!recording) return {};
  const values = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  for (const { label, subtract: [a, b] } of recording.derivedMeasurements || []) {
    values[label] = values[a] == null || values[b] == null ? null : values[a] - values[b];
  }
  return values;
}

export const ATYPICAL_PHENOMENA_TEXT = Object.freeze({
  'ap-mahaim': {
    tr: 'Mahaim (atriyofasiküler) yol ve M potansiyeli (Ho 2019, Şekil 11-20 ve 12-22; Sternick): Atriyofasiküler yol çoğunlukla lateral triküspit anulustan çıkar, sağ dalın distaline ya da yakınına girer; yalnız antegrad ve dekremental iletir. Sinüs ritminde preeksitasyon çok az ya da hiç olmayabilir, atriyal pacing ile ortaya çıkar. Antidromik taşikardide uyarı yoldan sağ dala iner (LBBB morfolojisi), sağ dal, His ve AV düğümden geri çıkar: His V başlangıcından sonra gelir (burada V-H 15 ms), atriyal aktivasyon konsantriktir. Ablasyon kateteri lateral triküspit anulusta, atriyal giriş yerinde, A ile V arasında keskin bir Mahaim potansiyeli (M, His benzeri potansiyel) kaydeder (burada M-V 40 ms). Ablasyon genellikle bu atriyal giriş yerinde yapılır.',
    en: 'Mahaim (atriofascicular) pathway and M potential (Ho 2019, figs 11-20 and 12-22; Sternick): an atriofascicular pathway usually arises from the lateral tricuspid annulus and inserts into or near the distal right bundle; it conducts only antegradely and decrementally. Pre-excitation in sinus rhythm may be minimal or absent and appears with atrial pacing. In antidromic tachycardia the impulse descends the pathway into the right bundle (LBBB morphology) and returns up the right bundle, His and AV node: the His follows the V onset (here V-H 15 ms) and atrial activation is concentric. At the lateral tricuspid annulus, the atrial insertion, the ablation catheter records a sharp Mahaim potential (M, a His-like potential) between the A and the V (here M-V 40 ms). Ablation usually targets this atrial insertion.',
    source: ATYPICAL_PHENOMENA_SOURCE
  },
  'ep-supernormality': {
    tr: 'Süpernormal iletim (Ho 2019, Şekil 22-1 ve 22-2): Süpernormalite, toparlanmanın sonundaki kısa bir pencerede, normalde eşik altında kalacak bir uyarının beklenmedik biçimde iletilmesi ya da uyarım yapmasıdır. Bu pencerede membran potansiyeli dinlenim düzeyine henüz tam inmemiştir, eşiğe daha yakındır; bu yüzden daha zayıf bir uyarı yeter. Temel ritim sağ dal bloklu sinüs ritmidir (P-P 800 ms). Repolarizasyonun sonuna denk gelen erken bir atriyal atım (P1-P2 380 ms) sağ dalın süpernormal penceresine düşer ve sağ dal bu atımı iletir: QRS daralır. HV uzamaz (45 ms); bu, daralmanın sol dalda eşit gecikmeden kaynaklanmadığını gösterir. Daha erken ya da daha geç gelen atımlar sağ dal bloğuyla iletilir.',
    en: 'Supernormal conduction (Ho 2019, figs 22-1 and 22-2): supernormality is a brief period at the end of recovery during which an otherwise subthreshold impulse unexpectedly conducts or excites. In that window the membrane has not yet returned fully to its resting level and lies closer to threshold, so a weaker stimulus suffices. The underlying rhythm is sinus with right bundle branch block (P-P 800 ms). A premature atrial beat at the end of repolarization (P1-P2 380 ms) falls into the supernormal window of the right bundle and the right bundle conducts it: the QRS narrows. The HV does not lengthen (45 ms), which shows the narrowing is not due to an equal delay in the left bundle. Earlier or later beats conduct with right bundle branch block.',
    source: ATYPICAL_PHENOMENA_SOURCE
  }
});
