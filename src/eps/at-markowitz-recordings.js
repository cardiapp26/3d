import { ev, far, mono, merge, surfaceBeat } from './ep-beats.js';
import { ref, cal } from './ep-caliper.js';

export const AT_SOURCE = 'https://doi.org/10.15420/aer.2019.17.2';
export const AT_EXAMPLES = [
  ['at-map-focal', 'Fokal AT: erken A ve unipolar sinyal', 'Focal AT: early A and unipolar signal'],
  ['at-adenosine-triggered', 'AT: adenozinle sonlanma', 'AT: termination with adenosine'],
  ['at-adenosine-automatic', 'AT: geçici baskılanma ve dönüş', 'AT: transient suppression and return'],
  ['at-microreentry-block', 'Lokalize reentry: AV blok ve fraksiyonasyon', 'Localized reentry: AV block and fractionation'],
  ['at-atrial-entrainment', 'Makroreentran AT: atriyal PPI', 'Macroreentrant AT: atrial PPI']
];
export const AT_RECORDING_TEXT = {
  'at-map-focal': {
    tr: 'Şekil 1B ilkeleri: lokal ABL A, P başlangıcından 35 ms erken; uzak atriyal kanallar daha sonra aktive oluyor. U, negatif unipolar sinyalin basitleştirilmiş temsilidir; gerçek QS morfolojisi veya kalibre mV değildir. Erken A ve QS, fokal kaynak haritalamasını destekler; tek başına otomatik/tetiklenmiş mekanizmayı kanıtlamaz.',
    en: 'Figure 1B principles: local ABL A precedes P onset by 35 ms; remote atrial channels activate later. U is a simplified negative unipolar signal, not a measured QS morphology or calibrated mV. Early A and QS support focal source mapping but do not alone establish automaticity or triggered activity.'
  },
  'at-adenosine-triggered': {
    tr: 'Şekil 1A ilkesi: adenozin işaretinden sonra AT sonlanıyor. Makale tetiklenmiş aktiviteyle uyumlu bu yanıtı, otomatik AT’nin geçici baskılanmasından ayırır. Sonlanma tek başına AT tanısı koymaz; AVNRT/AVRT de sonlanabilir. Sonrasındaki sinüs/kaçış ritmi bu kısa şemada modellenmedi; boş alan asistoli anlamına gelmez.',
    en: 'Figure 1A principle: AT terminates after the adenosine marker. The review separates this response, consistent with triggered activity, from transient suppression of automatic AT. Termination alone does not diagnose AT; AVNRT/AVRT can also terminate. Subsequent sinus/escape rhythm is omitted from this short schematic; the blank region does not represent asystole.'
  },
  'at-adenosine-automatic': {
    tr: 'Adenozin sonrası atriyal kaynak geçici baskılanıyor, sonra aynı A dizilimi dönüyor. Bu öğretim örneği otomatik AT yanıtını temsil eder. Ara süre ve dönüş zamanı hasta kaydından alınmadı; klinik doz/yanıt süresi modellenmez. Ara dönemin sinüs/kaçış ritmi çizilmedi.',
    en: 'The atrial source is transiently suppressed after adenosine, then the same atrial sequence returns. This example represents an automatic AT response. Pause and return times are designed, not patient measurements; no clinical dose or response kinetics are modeled. Interval sinus/escape rhythm is omitted.'
  },
  'at-microreentry-block': {
    tr: 'Şekil 1C–D ilkeleri: adenozin sonrası A–A 300 ms sabit; AV iletim 2:1 olurken AT sürüyor. ABL kanalında her siklusta 270 ms boyunca küçük fraksiyonlar var; bunlar ayrı atriyal atımlar değildir. Genlik kalibre mV değildir. Bu sinyal tek başına mikroreentry kanıtı değildir: bystander fraksiyonasyon ve pseudo-reentry dışlanmalı, yüksek yoğunluklu harita/entrainment ile devre doğrulanmalıdır. Ladder yalnızca A–AV–V ilişkisini gösterir; küçük atriyal devrenin geometrisini çizmez.',
    en: 'Figure 1C–D principles: A–A remains 300 ms after adenosine; AT continues while AV conduction becomes 2:1. Small ABL fragments span 270 ms of each cycle and are not separate atrial beats. Amplitude is not calibrated mV. This signal alone does not prove microreentry: exclude bystander fractionation and pseudo-reentry, and verify the circuit with high-density mapping/entrainment. The ladder shows A–AV–V relationships, not the geometry of the small atrial circuit.'
  },
  'at-atrial-entrainment': {
    tr: 'Makroreentry için kısaltılmış atriyal entrainment örneği: TCL 300, pacing CL 240, PPI 320 ms; PPI−TCL 20 ms. PPI son HRA S’den aynı HRA elektrodunun ilk dönen A’sına ölçülür; paced A sayılmaz. Yakalama ve hızlandırılmış A dizilimi gösteriliyor; gerçek fusion/yüksek yoğunluklu harita modellenmedi. Tek bölgedeki kısa PPI, tek başına makroreentry tanısı değildir. Makaledeki ≤30 ms yakınlık ölçütü ancak geçerli entrainment bağlamında değerlendirilir; hasta miyokardında pacing gecikmesi PPI’yi uzatabilir.',
    en: 'Abbreviated atrial entrainment example for macroreentry: TCL 300, pacing CL 240, PPI 320 ms; PPI−TCL 20 ms. PPI runs from the last HRA S to the first returned A at that same electrode, excluding paced A. Capture and accelerated atrial sequence are shown; actual fusion/high-density mapping is not modeled. A short PPI at one site alone does not diagnose macroreentry. The review’s ≤30 ms proximity criterion requires valid entrainment; pacing delay in diseased myocardium can prolong PPI.'
  }
};
const channels = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-56', 'cs-12', 'rv', 'abl-d', 'abl-uni'];
function beat(t, { conducted = true, fragmented = false, stimulus = null } = {}) {
  const h = t + 100, v = h + 45;
  const b = {
    'ecg-ii': [mono('P', t + 35, 0.22, 10)], 'ecg-v1': [mono('P', t + 35, -0.18, 10)],
    hra: [ev('A', t + 12, 0.7)], 'his-p': [ev('A', t + 18, 0.6)], 'his-d': [ev('A', t + 20, 0.4)],
    'cs-910': [ev('A', t + 30, 0.7)], 'cs-56': [ev('A', t + 45, 0.7)], 'cs-12': [ev('A', t + 60, 0.7)],
    rv: [], 'abl-d': [ev('A', t, fragmented ? 0.12 : 0.7)], 'abl-uni': [mono('U', t, -0.7, 7)]
  };
  if (stimulus != null) {
    b.hra[0].t = stimulus + 5;
    b['abl-d'][0].t = stimulus + 25;
    b['abl-uni'][0].t = stimulus + 25;
    b.hra.push(ev('S', stimulus, 0.5, 2));
  }
  if (fragmented) b['abl-d'].push(...[30, 60, 90, 120, 150, 180, 210, 240, 270].map((dt, i) => ev('fragment', t + dt, i % 2 ? -0.09 : 0.09, 3)));
  if (!conducted) return b;
  return merge(b, surfaceBeat(v), {
    'his-p': [ev('H', h, 0.35, 4), ev('V', v, 0.7)], 'his-d': [ev('H', h, 0.7, 4), ev('V', v, 0.9)],
    rv: [ev('V', v, 0.9)], 'cs-910': [far('V', v + 15, 0.4)], 'cs-56': [far('V', v + 20, 0.4)],
    'cs-12': [far('V', v + 25, 0.4)], 'abl-d': [far('V', v + 10, 0.25)]
  });
}
const aa = cal('A–A', ref('hra', 'A'), ref('hra', 'A', 1), 'hra');
const recordings = new Map();
function add(id, times, options = {}) {
  recordings.set(id, { id, mechanism: options.mechanism || 'focal-at', windowMs: options.windowMs || 2900, channels,
    events: merge(...times.map((t, i) => beat(t, options.beatOptions?.(i) || {}))),
    markers: options.markers || [], calipers: options.calipers || [aa], derivedMeasurements: options.derivedMeasurements || [] });
}
add('at-map-focal', [150, 450, 750, 1050, 1350], { windowMs: 1700, calipers: [aa,
  cal('A local→P', ref('abl-d', 'A'), ref('ecg-ii', 'P')), cal('AH', ref('his-d', 'A'), ref('his-d', 'H')),
  cal('HV', ref('his-d', 'H'), ref('his-d', 'V'))] });
const drug = [{ t: 1250, label: { tr: 'Adenozin yanıtı (şematik)', en: 'Adenosine response (schematic)' } }];
add('at-adenosine-triggered', [150, 450, 750, 1050], { markers: drug });
add('at-adenosine-automatic', [150, 450, 750, 1050, 2050, 2350, 2650], { markers: drug,
  calipers: [aa, cal('AT A dönüş arası / return gap', ref('hra', 'A', 3), ref('hra', 'A', 4))] });
add('at-microreentry-block', [150, 450, 750, 1050, 1350, 1650, 1950, 2250], {
  mechanism: 'at-localized-reentry', markers: drug,
  beatOptions: (i) => ({ fragmented: true, conducted: i < 4 || i % 2 === 0 }),
  calipers: [aa, cal('A–A post', ref('hra', 'A', 4), ref('hra', 'A', 5)),
    cal('V–V post', ref('rv', 'V', 4), ref('rv', 'V', 5)), cal('Fragment span', ref('abl-d', 'A'), ref('abl-d', 'fragment', 8), 'abl-d')]
});
add('at-atrial-entrainment', [100, 400, 700, 820, 1060, 1300, 1540, 1848, 2148], {
  mechanism: 'at-macroreentry', windowMs: 2700,
  beatOptions: (i) => ({ stimulus: i >= 3 && i <= 6 ? [820, 1060, 1300, 1540][i - 3] : null }),
  markers: [{ t: 1540, label: { tr: 'Son HRA S', en: 'Last HRA S' } }],
  calipers: [cal('TCL', ref('hra', 'A'), ref('hra', 'A', 1)), cal('PCL', ref('hra', 'S'), ref('hra', 'S', 1)),
    cal('PPI', ref('hra', 'S', 3), ref('hra', 'A', 7), 'hra')],
  derivedMeasurements: [{ label: 'PPI−TCL', subtract: ['PPI', 'TCL'] }]
});
export const atRecording = (id) => recordings.has(id) ? structuredClone(recordings.get(id)) : null;
