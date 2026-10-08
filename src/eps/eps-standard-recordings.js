/* Designed teaching timelines, in ms; not patient recordings. Fiducial events
 * stand for measured onsets, even though the renderer draws schematic waves.
 * Recovery/entrainment clips abbreviate pacing trains, not clinical protocols. */
import { sinusBeat, atrialPacedBeat, svtBeat, pacedBeat, surfaceBeat, mono, merge, ev, far,
  CH_SVT, A_TYPICAL, A_NODAL_PACED } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

const sinus = (t) => merge(sinusBeat(t, { ablA: null }), {
  'cs-56': [ev('A', t + 60, 0.7), far('V', t + 179, 0.4, 8)],
  rv: [ev('V', t + 160, 0.9)]
});

export const STANDARD_EPS_EXAMPLES = Object.freeze([
  ['eps-baseline', 'Normal EPS: PA / AH / HV / PR', 'Normal EPS: PA / AH / HV / PR'],
  ['eps-snrt', 'Sinüs düğümü: SNRT / cSNRT', 'Sinus node: SNRT / cSNRT'],
  ['eps-block-intranodal', 'AV Blok: İntranodal (uzamış AH)', 'AV Block: Intranodal (prolonged AH)'],
  ['eps-block-intrahis', 'AV Blok: İntrahisian (Split His / H-H\')', 'AV Block: Intra-Hisian (Split His / H-H\')'],
  ['eps-block-infrahis', 'AV Blok: İnfrahisian (patolojik HV / H var V yok)', 'AV Block: Infra-Hisian (prolonged HV / H without V)'],
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

recordings['eps-block-intranodal'] = {
  id: 'eps-block-intranodal', mechanism: 'av-block-intranodal', windowMs: 2800, channels: CH_SVT,
  events: merge(
    surfaceBeat(360, { p: 95 }), surfaceBeat(1760, { p: 1495 }),
    {
      'ecg-ii': [mono('P', 95, 0.22, 10), mono('P', 795, 0.22, 10), mono('P', 1495, 0.22, 10), mono('P', 2195, 0.22, 10)],
      hra: [ev('A', 100, 0.9), ev('A', 800, 0.9), ev('A', 1500, 0.9), ev('A', 2200, 0.9)],
      'his-d': [
        ev('A', 135, 0.35), ev('H', 315, 0.75, 4), ev('V', 360, 0.9),
        ev('A', 835, 0.35),
        ev('A', 1535, 0.35), ev('H', 1715, 0.75, 4), ev('V', 1760, 0.9),
        ev('A', 2235, 0.35)
      ],
      'his-p': [
        ev('A', 132, 0.6), ev('H', 315, 0.35, 4), ev('V', 360, 0.7),
        ev('A', 832, 0.6),
        ev('A', 1532, 0.6), ev('H', 1715, 0.35, 4), ev('V', 1760, 0.7),
        ev('A', 2232, 0.6)
      ],
      'cs-910': [ev('A', 145, 0.8), ev('A', 845, 0.8), ev('A', 1545, 0.8), ev('A', 2245, 0.8)],
      'cs-56': [ev('A', 160, 0.7), ev('A', 860, 0.7), ev('A', 1560, 0.7), ev('A', 2260, 0.7)],
      'cs-12': [ev('A', 175, 0.7), ev('A', 875, 0.7), ev('A', 1575, 0.7), ev('A', 2275, 0.7)],
      rv: [ev('V', 355, 0.9), ev('V', 1755, 0.9)]
    }
  ),
  markers: [
    { t: 800, label: { tr: 'Bloke P: A var, H ve V yok (intranodal blok)', en: 'Blocked P: A present, no H or V (intranodal block)' } }
  ],
  calipers: [
    cal('P-P', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii'),
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0), 'his-d'),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0), 'his-d')
  ],
  derivedMeasurements: []
};

recordings['eps-block-intrahis'] = {
  id: 'eps-block-intrahis', mechanism: 'av-block-intrahisian', windowMs: 2800, channels: CH_SVT,
  events: merge(
    surfaceBeat(305, { p: 95 }), surfaceBeat(1705, { p: 1495 }),
    {
      'ecg-ii': [mono('P', 95, 0.22, 10), mono('P', 795, 0.22, 10), mono('P', 1495, 0.22, 10), mono('P', 2195, 0.22, 10)],
      hra: [ev('A', 100, 0.9), ev('A', 800, 0.9), ev('A', 1500, 0.9), ev('A', 2200, 0.9)],
      'his-d': [
        ev('A', 135, 0.35), ev('H', 215, 0.75, 4), ev('H', 260, 0.6, 4), ev('V', 305, 0.9),
        ev('A', 835, 0.35), ev('H', 915, 0.75, 4),
        ev('A', 1535, 0.35), ev('H', 1615, 0.75, 4), ev('H', 1660, 0.6, 4), ev('V', 1705, 0.9),
        ev('A', 2235, 0.35), ev('H', 2315, 0.75, 4)
      ],
      'his-p': [
        ev('A', 132, 0.6), ev('H', 215, 0.35, 4), ev('V', 305, 0.7),
        ev('A', 832, 0.6), ev('H', 915, 0.35, 4),
        ev('A', 1532, 0.6), ev('H', 1615, 0.35, 4), ev('V', 1705, 0.7),
        ev('A', 2232, 0.6), ev('H', 2315, 0.35, 4)
      ],
      'cs-910': [ev('A', 145, 0.8), ev('A', 845, 0.8), ev('A', 1545, 0.8), ev('A', 2245, 0.8)],
      'cs-56': [ev('A', 160, 0.7), ev('A', 860, 0.7), ev('A', 1560, 0.7), ev('A', 2260, 0.7)],
      'cs-12': [ev('A', 175, 0.7), ev('A', 875, 0.7), ev('A', 1575, 0.7), ev('A', 2275, 0.7)],
      rv: [ev('V', 300, 0.9), ev('V', 1700, 0.9)]
    }
  ),
  markers: [
    { t: 800, label: { tr: 'İntrahisian blok: H var, H\' ve V yok (H-H\' bloğu)', en: 'Intra-Hisian block: H present, H\' and V absent (H-H\' block)' } }
  ],
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0), 'his-d'),
    cal('H-H\'', ref('his-d', 'H', 0), ref('his-d', 'H', 1), 'his-d'),
    cal('H\'-V', ref('his-d', 'H', 1), ref('his-d', 'V', 0), 'his-d')
  ],
  derivedMeasurements: []
};

recordings['eps-block-infrahis'] = {
  id: 'eps-block-infrahis', mechanism: 'av-block-infrahisian', windowMs: 2800, channels: CH_SVT,
  events: merge(
    surfaceBeat(300, { p: 95, wide: true }), surfaceBeat(1700, { p: 1495, wide: true }),
    {
      'ecg-ii': [mono('P', 95, 0.22, 10), mono('P', 795, 0.22, 10), mono('P', 1495, 0.22, 10), mono('P', 2195, 0.22, 10)],
      hra: [ev('A', 100, 0.9), ev('A', 800, 0.9), ev('A', 1500, 0.9), ev('A', 2200, 0.9)],
      'his-d': [
        ev('A', 135, 0.35), ev('H', 215, 0.75, 4), ev('V', 300, 0.9),
        ev('A', 835, 0.35), ev('H', 915, 0.75, 4),
        ev('A', 1535, 0.35), ev('H', 1615, 0.75, 4), ev('V', 1700, 0.9),
        ev('A', 2235, 0.35), ev('H', 2315, 0.75, 4)
      ],
      'his-p': [
        ev('A', 132, 0.6), ev('H', 215, 0.35, 4), ev('V', 300, 0.7),
        ev('A', 832, 0.6), ev('H', 915, 0.35, 4),
        ev('A', 1532, 0.6), ev('H', 1615, 0.35, 4), ev('V', 1700, 0.7),
        ev('A', 2232, 0.6), ev('H', 2315, 0.35, 4)
      ],
      'cs-910': [ev('A', 145, 0.8), ev('A', 845, 0.8), ev('A', 1545, 0.8), ev('A', 2245, 0.8)],
      'cs-56': [ev('A', 160, 0.7), ev('A', 860, 0.7), ev('A', 1560, 0.7), ev('A', 2260, 0.7)],
      'cs-12': [ev('A', 175, 0.7), ev('A', 875, 0.7), ev('A', 1575, 0.7), ev('A', 2275, 0.7)],
      rv: [ev('V', 295, 0.9), ev('V', 1695, 0.9)]
    }
  ),
  markers: [
    { t: 800, label: { tr: 'İnfrahisian blok: A ve H var, V yok (HV 85 ms)', en: 'Infra-Hisian block: A and H present, no V (HV 85 ms)' } }
  ],
  calipers: [
    cal('AH', ref('his-d', 'A', 0), ref('his-d', 'H', 0), 'his-d'),
    cal('HV', ref('his-d', 'H', 0), ref('his-d', 'V', 0), 'his-d'),
    cal('P-P', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii')
  ],
  derivedMeasurements: []
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
  'eps-block-intranodal': {
    tr: 'İntranodal 2:1 AV blok (Ho 2019 Şekil 1-14, Narula 1971): İletilen atımda AH belirgin uzamıştır (180 ms), ancak HV aralığı tamamen normaldir (45 ms). Bloke P dalgasında HRA ve His kateterinde A potansiyeli kaydedilir, fakat AV düğüm içinde blok nedeniyle His (H) defleksiyonu ve ventrikül (V) oluşmaz (A var, H ve V yok). Genellikle vagal tonus, iskemi veya ilaç kaynaklıdır; prognozu daha iyi seyreder.',
    en: 'Intranodal 2:1 AV block (Ho 2019 Fig 1-14, Narula 1971): In conducted beats, AH is markedly prolonged (180 ms), whereas HV is strictly normal (45 ms). In blocked P waves, A is recorded on HRA and His, but due to intra-nodal block, no His spike (H) or ventricular spike (V) occurs (A without H or V). Usually responsive to atropine and has a more benign prognosis.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/5094380/'
  },
  'eps-block-intrahis': {
    tr: 'İntrahisian AV blok ve Split His (Ho 2019 Şekil 1-17, 1-18): His kateterinde proksimal (H) ve distal (H\') olmak üzere çift His potansiyeli kaydedilir (H-H\' = 45 ms). İletilen atımda uyarı A → H → H\' → V sırasıyla iletilir. Bloke atımda ise H potansiyeli mevcuttur ancak ileti tam olarak His demetinin kendi içinde kesilir; H\' ve V oluşmaz. Ciddi ileti sistemi hastalığı göstergesidir.',
    en: 'Intra-Hisian AV block and Split His (Ho 2019 Figs 1-17, 1-18): His recording shows double His spikes: proximal (H) and distal (H\') with H-H\' = 45 ms. Conducted beats show A → H → H\' → V sequence. In blocked beats, H is recorded but conduction fails within the His bundle itself; H\' and V are absent. Represents intrinsic His-Purkinje trunk pathology.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/4331599/'
  },
  'eps-block-infrahis': {
    tr: 'İnfrahisian AV blok (Ho 2019 Şekil 1-20, 1-21): Geniş QRS zemininde 2:1 blok. İletilen atımda AH normaldir (80 ms), ancak HV aralığı patolojik olarak uzamıştır (85 ms; normal <55 ms, patolojik >70 ms). Bloke P dalgasında ise A ve H potansiyelleri normal kaydedilir fakat ileti His distalindeki Purkinje sisteminde kesilir (H var, V yok). Kalıcı kalp pili (PPM) için sınıf I endikasyondur.',
    en: 'Infra-Hisian AV block (Ho 2019 Figs 1-20, 1-21): 2:1 block with underlying wide QRS. Conducted beats show normal AH (80 ms) but pathologically prolonged HV (85 ms; normal <55 ms, abnormal >70 ms). In blocked beats, A and H are recorded on His catheter, but conduction fails below the His bundle (H without V). Represents high-grade distal Purkinje disease and a Class I pacemaker indication.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/5094380/'
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
