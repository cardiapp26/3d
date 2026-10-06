/* Designed teaching timelines, in ms; not patient recordings. Fiducial events
 * stand for measured onsets, even though the renderer draws schematic waves.
 * Recovery/entrainment clips abbreviate pacing trains, not clinical protocols. */
import { sinusBeat, atrialPacedBeat, svtBeat, pacedBeat, merge, ev, far,
  CH_SVT, A_TYPICAL, A_NODAL_PACED } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

const sinus = (t) => merge(sinusBeat(t, { ablA: null }), {
  'cs-56': [ev('A', t + 60, 0.7), far('V', t + 179, 0.4, 8)],
  rv: [ev('V', t + 160, 0.9)]
});

export const STANDARD_EPS_EXAMPLES = Object.freeze([
  ['eps-baseline', 'Normal EPS: PA / AH / HV / PR', 'Normal EPS: PA / AH / HV / PR'],
  ['eps-snrt', 'Sinüs düğümü: SNRT / cSNRT', 'Sinus node: SNRT / cSNRT'],
  ['eps-ppi', 'Entrainment: PPI / TCL', 'Entrainment: PPI / TCL'],
  ['eps-cppi', 'Septal AVRT: düzeltilmiş PPI', 'Septal AVRT: corrected PPI']
].map(Object.freeze));

const recordings = {
  'eps-baseline': {
    id: 'eps-baseline', mechanism: 'sinus', windowMs: 2800, channels: CH_SVT,
    events: merge(...[100, 900, 1700, 2500].map(sinus)),
    calipers: [
      cal('PA', ref('ecg-ii', 'P', 1), ref('his-d', 'A', 1)),
      cal('AH', ref('his-d', 'A', 1), ref('his-d', 'H', 1)),
      cal('HV', ref('his-d', 'H', 1), ref('his-d', 'V', 1)),
      cal('PR', ref('ecg-ii', 'P', 1), ref('ecg-ii', 'V', 1)),
      cal('P-P', ref('ecg-ii', 'P', 1), ref('ecg-ii', 'P', 2), 'ecg-ii')
    ], derivedMeasurements: []
  },
  'eps-snrt': {
    id: 'eps-snrt', mechanism: 'sinus', windowMs: 4900, channels: CH_SVT,
    events: merge(sinus(100), sinus(900),
      ...[1600, 2100, 2600].map((s) => atrialPacedBeat(s, 100)), sinus(3800), sinus(4600)),
    markers: [
      { t: 1600, label: { tr: 'Kısaltılmış HRA pacing dizisi', en: 'Abbreviated HRA pacing train' } },
      { t: 2600, label: { tr: 'Son S', en: 'Last S' } },
      { t: 3800, label: { tr: 'İlk dönen sinüs A', en: 'First returned sinus A' } }
    ],
    calipers: [
      cal('Sinus CL', ref('hra', 'A', 0), ref('hra', 'A', 1), 'hra'),
      cal('PCL', ref('hra', 'S', 1), ref('hra', 'S', 2), 'hra'),
      cal('SNRT', ref('hra', 'S', 2), ref('hra', 'A', 5), 'hra')
    ],
    derivedMeasurements: [{ label: 'cSNRT', subtract: ['SNRT', 'Sinus CL'] }]
  },
  'eps-ppi': {
    id: 'eps-ppi', mechanism: 'avnrt-typical', windowMs: 2500, channels: CH_SVT,
    events: merge(svtBeat(200, A_TYPICAL), svtBeat(560, A_TYPICAL),
      ...[800, 1120, 1440].map((s) => pacedBeat(s, A_NODAL_PACED)),
      svtBeat(1955, A_TYPICAL), svtBeat(2315, A_TYPICAL)),
    markers: [
      { t: 800, label: { tr: 'Kısaltılmış RV entrainment dizisi', en: 'Abbreviated RV entrainment train' } },
      { t: 1440, label: { tr: 'Son RV S', en: 'Last RV S' } },
      { t: 1950, label: { tr: 'İlk dönen RV V', en: 'First returned RV V' } }
    ],
    calipers: [
      cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
      cal('PCL', ref('rv', 'S', 1), ref('rv', 'S', 2), 'rv'),
      cal('PPI', ref('rv', 'S', 2), ref('rv', 'V', 5), 'rv')
    ],
    derivedMeasurements: [{ label: 'PPI−TCL', subtract: ['PPI', 'TCL'] }]
  }
};

// Septal ORT: VA 130 + antegrade AH 225 + HV 45 = TCL 400 ms.
// Return AH 305 ms adds 80 ms of AV nodal delay to the first return cycle.
const septalA = { 'his-p': 128, 'his-d': 130, 'cs-910': 110, 'cs-56': 145, 'cs-12': 165, hra: 155 };
const septalBeat = (v) => {
  const beat = svtBeat(v, septalA);
  beat.rv.find((e) => e.type === 'V').t = v;
  return beat;
};
recordings['eps-cppi'] = {
  id: 'eps-cppi', mechanism: 'avrt-orthodromic', windowMs: 4000, channels: CH_SVT,
  events: merge(...[100, 500, 900].map(septalBeat),
    ...[1300, 1660, 2020, 2380].map((s) => pacedBeat(s,
      { ...A_NODAL_PACED, 'his-p': 198, 'his-d': 200 })),
    ...[2930, 3330, 3730].map(septalBeat)),
  markers: [{ t: 2380, label: { tr: 'Son RV S', en: 'Last RV S' } }],
  calipers: [
    cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
    cal('PPI', ref('rv', 'S', 3), ref('rv', 'V', 7), 'rv'),
    cal('AH tachy', ref('his-d', 'A', 0), ref('his-d', 'H', 1)),
    cal('AH return', ref('his-d', 'A', 6), ref('his-d', 'H', 3))
  ],
  derivedMeasurements: [
    { label: 'PPI−TCL', subtract: ['PPI', 'TCL'] },
    { label: 'ΔAH', subtract: ['AH return', 'AH tachy'] },
    { label: 'cPPI−TCL', subtract: ['PPI−TCL', 'ΔAH'] }
  ]
};

/** Fresh copy so caliper/recorder callers cannot mutate other examples. */
export function standardEpsRecording(id) {
  return recordings[id] ? structuredClone({ markers: [], ...recordings[id] }) : null;
}

/** Every readout follows references to events, including subtraction results. */
export function standardEpsMeasurements(recording) {
  if (!recording) return {};
  const values = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  for (const { label, subtract: [a, b] } of recording.derivedMeasurements || []) {
    values[label] = values[a] == null || values[b] == null ? null : values[a] - values[b];
  }
  return values;
}

export const STANDARD_EPS_TEXT = Object.freeze({
  'eps-baseline': {
    tr: 'Sentetik sinüs kaydı: PA, yüzey P başlangıcından His kateterindeki A başlangıcına; AH, aynı His kanalında A’dan H’ye; HV, H’den en erken ventriküler başlangıca ölçülür. PR = PA + AH + HV. P-P temel sinüs siklusudur. Dalga biçimleri şematiktir; olay işaretleri ölçüm başlangıçlarını temsil eder.',
    en: 'Synthetic sinus recording: PA runs from surface P onset to atrial onset on the His catheter; AH runs from A to H on that His channel; HV runs from H to earliest ventricular onset. PR = PA + AH + HV. P-P is baseline sinus cycle length. Waveforms are schematic; event markers represent measurement onsets.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/832344/'
  },
  'eps-snrt': {
    tr: 'SNRT, son HRA stimulusundan ilk dönen sinüs A’sına ölçülür; son paced A veya ilk V başlangıcı kullanılmaz. cSNRT = SNRT − pacing öncesi temel sinüs CL. Burada pacing 500 ms, temel CL 800 ms, SNRT 1200 ms ve cSNRT 400 ms. Üç pacing atımı gösterim için kısaltılmıştır; klinik sinüs düğümü değerlendirmesi farklı hızlarda yeterli pacing süresi ve klinik bağlam gerektirir.',
    en: 'SNRT runs from the last HRA stimulus to the first returned sinus A, not from the last paced A or to the first V. cSNRT = SNRT − baseline sinus CL before pacing. Here pacing is 500 ms, baseline CL 800 ms, SNRT 1200 ms and cSNRT 400 ms. Three pacing beats abbreviate the display; clinical sinus node assessment requires adequate pacing duration at different rates and clinical context.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC481954/'
  },
  'eps-ppi': {
    tr: 'PPI, son RV stimulusundan aynı RV kateterindeki ilk dönen ventriküler elektrograma ölçülür. TCL pacing öncesi taşikardi V-V süresidir. Bu sentetik AVNRT örneğinde PPI 510 ms, TCL 360 ms, PPI−TCL 150 ms. PPI sinüs düğümü testi değildir; SNRT’nin atriyal sinüs dönüş sonlanımıyla karıştırmayın. Entrainment ve yakalama doğrulanmadan mekanizma yorumu yapılmaz. Pacing dizisi gösterim için kısaltılmıştır.',
    en: 'PPI runs from the last RV stimulus to the first returned ventricular electrogram on the same RV catheter. TCL is the tachycardia V-V interval before pacing. This synthetic AVNRT example has PPI 510 ms, TCL 360 ms and PPI−TCL 150 ms. PPI is not a sinus node test; distinguish its ventricular return endpoint from the sinus atrial return used for SNRT. Mechanism interpretation requires verified entrainment and capture. The pacing train abbreviates the display.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8648137/'
  },
  'eps-cppi': {
    tr: 'Septal AVRT’de pacing sonrası AV düğüm gecikmesi ham PPI−TCL’yi uzatabilir. Burada PPI 550 ms, TCL 400 ms: ham fark 150 ms. AH taşikardi sırasında 225 ms, ilk dönüşte 305 ms: ΔAH 80 ms. cPPI−TCL = 150 − 80 = 70 ms. Düzeltme, sinüs AH’sını değil taşikardi sırasındaki AH’yi kullanır. Doğrulanmış RV apeks entrainment bağlamında <110 ms ORT’yi destekler; tek başına kesin tanı değildir. Değerler sentetik, pacing dizisi kısaltılmıştır.',
    en: 'In septal AVRT, postpacing AV nodal delay can lengthen raw PPI−TCL. Here PPI 550 ms and TCL 400 ms yield 150 ms. AH is 225 ms during tachycardia and 305 ms on first return: ΔAH 80 ms. cPPI−TCL = 150 − 80 = 70 ms. Correction uses tachycardia AH, not sinus AH. In verified RV apical entrainment, <110 ms supports ORT; it is not a standalone diagnosis. Timings are synthetic and the pacing train is abbreviated.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/16731468/'
  }
});
