import { ev, merge, sinusBeat, pacedBeat } from './ep-beats.js';
import { cal, ref } from './ep-caliper.js';

// Concealed against manifest left lateral pathway on one strip: a manifest sinus beat (delta,
// short H-delta), a concealed sinus beat (no delta, normal AH and HV) and RV pacing in the
// concealed case (retrograde A eccentric, earliest on distal CS). Two patients side by side;
// all times are designed teaching values, not digitized recordings.
export const CONCEALED_SOURCE = 'https://doi.org/10.1093/eurheartj/ehz467';
export const CONCEALED_EXAMPLE = ['ap-concealed-compare', 'Gizli ve manifest yol: sinüs ve RV pacing', 'Concealed versus manifest pathway: sinus and RV pacing'];
export const CONCEALED_TEXT = {
  tr: 'İlk atım manifest sol lateral yol: delta var, H deltadan 25 ms önce (kısa H-delta) ve ABL lokal V erken. İkinci atım gizli sol lateral yol: aynı ritimde delta yok; AH 80 ms, HV 45 ms normal, ventrikül yalnız AV düğüm ve His-Purkinje ile aktive olur. Yol antegrad iletmez, bu yüzden sinüs EKG’si normaldir. RV pacing’de yol retrograd iletir: en erken A distal CS’de (S-A 140 ms), His A’sı 52 ms sonra gelir; eksantrik retrograd dizilim sol taraflı yolu düşündürür. Konsantrik dizilim septal bir yolu dışlamaz; ayrım için His-refrakter PVC, para-Hisian pacing ve dekrement testi gerekir. Gizli yol ortodromik AVRT’ye katılabilir. Sentetik öğretim kaydı; iki farklı hasta yan yana gösterilmiştir.',
  en: 'The first beat is a manifest left lateral pathway: a delta wave, H 25 ms before the delta (short H-delta) and an early local ABL V. The second beat is a concealed left lateral pathway: same rhythm, no delta; AH 80 ms and HV 45 ms are normal and the ventricles are activated over the AV node and His-Purkinje system only. The pathway does not conduct antegradely, so the sinus ECG is normal. During RV pacing it conducts retrogradely: the earliest A is on distal CS (S-A 140 ms) and the His A follows 52 ms later; an eccentric retrograde sequence suggests a left-sided pathway. A concentric sequence does not exclude a septal pathway; His-refractory PVCs, para-Hisian pacing and decremental testing separate them. A concealed pathway can sustain orthodromic AVRT. Synthetic teaching recording; two different patients are shown side by side.'
};

const channels = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-56', 'cs-12', 'rv', 'abl-d'];
// ABL sits on the lateral mitral annulus in both patients.
function manifestSinus(t0) {
  const beat = sinusBeat(t0, { delta: t0 + 140, ablV: 125, ablA: 55 });
  return merge(beat, { rv: [ev('V', t0 + 165, 0.9)], 'cs-56': [ev('A', t0 + 60, 0.7)] });
}
function concealedSinus(t0) {
  // Normal conduction: A at the His t0 + 35, H at + 115 (AH 80), V at + 160 (HV 45); lateral LV base late.
  const beat = sinusBeat(t0, { ablA: 70, ablV: 200 });
  return merge(beat, { rv: [ev('V', t0 + 155, 0.9)], 'cs-56': [ev('A', t0 + 60, 0.7)] });
}
function concealedPaced(s) {
  const beat = pacedBeat(s, { 'cs-12': 140, 'cs-56': 160, 'cs-910': 180, 'his-p': 190, 'his-d': 192, hra: 210 });
  const merged = merge(beat, { 'abl-d': [ev('V', s + 80, 0.8), ev('A', s + 135, 0.3)] });
  // The retrograde route is the pathway (known teaching assumption, not inferred from timing alone).
  for (const list of Object.values(merged)) for (const e of list) if (e.type === 'A') e.ladderOrigin = 'ap-left';
  return merged;
}

const recording = Object.freeze({
  id: CONCEALED_EXAMPLE[0], mechanism: 'avrt-orthodromic', windowMs: 3350, channels,
  events: merge(manifestSinus(300), concealedSinus(1050), ...[1850, 2400, 2950].map(concealedPaced)),
  markers: [
    // Labels sit in the gaps between beats so they do not cover P, QRS or wave names.
    { t: 40, label: { tr: 'Manifest yol: sinüs', en: 'Manifest pathway: sinus' } },
    { t: 700, label: { tr: 'Gizli yol: sinüs, delta yok', en: 'Concealed pathway: sinus, no delta' } },
    { t: 1500, label: { tr: 'Gizli yol: RV pacing', en: 'Concealed pathway: RV pacing' } }
  ],
  calipers: [
    cal('H-delta', ref('his-d', 'H', 0), ref('ecg-ii', 'delta', 0), 'his-d'),
    cal('HV', ref('his-d', 'H', 1), ref('his-d', 'V', 1), 'his-d'),
    cal('S-A CS 1-2', ref('rv', 'S', 0), ref('cs-12', 'A', 2), 'cs-12'),
    cal('S-A His', ref('rv', 'S', 0), ref('his-d', 'A', 2), 'his-d')
  ]
});
export const concealedRecording = (id) => (id === recording.id ? structuredClone(recording) : null);
