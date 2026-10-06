import { ev, far, merge, sinusBeat, pacedBeat } from './ep-beats.js';
import { cal, ref } from './ep-caliper.js';

export const AP_ABLATION_SOURCE = 'https://doi.org/10.1016/j.hrthm.2025.02.023';
export const AP_ABLATION_EXAMPLES = [
  ['ap-map-antegrade', 'AP ablasyonu: erken lokal V ve delta kaybı', 'AP ablation: early local V and loss of delta'],
  ['ap-map-potential', 'AP haritalama: ayrı yol potansiyeli', 'AP mapping: discrete pathway potential'],
  ['ap-map-retrograde', 'AP ablasyonu: lokal VA ve RV pacing', 'AP ablation: local VA and RV pacing']
];
export const AP_ABLATION_TEXT = {
  'ap-map-antegrade': {
    tr: 'Şekil 1 ilkelerine göre sağ posteroseptal antegrad yol örneği. İlk üç atımda ABL lokal V, delta başlangıcından 40 ms erken; birbirine yakın lokal A ve V, arada aktivite oluşturuyor. Ayrı AP potansiyeli gösterilmedi. Son üç atımda delta kayboluyor, nodal AH/HV iletimi sürüyor. Geçiş sentetik; makaledeki RF başlangıcından yaklaşık 2,5 saniye sonra kayıp süresi burada yeniden üretilmedi. Yazarın 25–30 ms erken lokal V tercihi evrensel başarı eşiği değildir.',
    en: 'Right posteroseptal antegrade pathway example based on Figure 1 principles. On the first three beats, local ABL V precedes delta onset by 40 ms; closely spaced local A and V produce intervening activity. No discrete AP potential is identified. On the last three beats, delta disappears and nodal AH/HV conduction persists. The transition is synthetic; the reported loss about 2.5 seconds after RF onset is not reproduced. The author’s preference for local V 25–30 ms early is not a universal success threshold.'
  },
  'ap-map-potential': {
    tr: 'Şekil 2 ilkelerine göre lokal A ile V arasına ayrı AP potansiyeli yerleştirildi; AP, delta başlangıcından 40 ms erken. AP etiketi bu öğretim örneğinin bilinen varsayımıdır, klinikte ayrı bir defleksiyon görmek kanıt değildir: pacing manevralarıyla doğrulama gerekir. Şekil 1’deki kesintisiz A–V aktivitesiyle karşılaştırın; her hedefte ayrı yol potansiyeli bulunmaz.',
    en: 'A discrete AP potential is placed between local A and V, following Figure 2 principles; AP precedes delta onset by 40 ms. The AP label is a known assumption of this teaching example, not proof from a clinical deflection: pacing maneuvers must validate it. Compare with continuous A–V activity in Figure 1; a discrete pathway potential is not present at every target.'
  },
  'ap-map-retrograde': {
    tr: 'Şekil 4 ilkelerine göre sol lateral concealed yol: ilk üç RV paced atımında lokal ABL VA 65 ms, RV S–ABL A 145 ms. Aradaki 80 ms, RV uyarımından sol annüler lokal V’ye geçişi içerir; S–A ile lokal VA aynı ölçüm değildir. Ablasyon sonrası üç atımda erken distal A kaybolur, daha geç His komşuluğu A öne geçer. Kalan nodal VA iletimi başarısızlık değildir; bu kısa kayıt kalıcı başarıyı kanıtlamaz. 60–70 ms lokal VA, makaledeki yavaş olmayan yollar için hedef tercihi; evrensel eşik değildir.',
    en: 'Left lateral concealed pathway following Figure 4 principles: on the first three RV paced beats, local ABL VA is 65 ms and RV S–ABL A is 145 ms. The intervening 80 ms includes transit from the RV stimulus to local left annular V; S–A and local VA are different measurements. After ablation, early distal A disappears and a later His-region A becomes earliest. Residual nodal VA conduction is not failure; this short strip does not prove durable success. Local VA 60–70 ms is a target preference for nonslow pathways in the paper, not a universal threshold.'
  }
};
const channels = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-56', 'cs-12', 'rv', 'abl-d'];
function antegrade(t, potential = false, post = false) {
  const delta = post ? null : t + (potential ? 120 : 100);
  const beat = sinusBeat(t, { delta, ablA: 48, ablV: post ? 165 : (potential ? 100 : 60) });
  beat.rv = [ev('V', post ? t + 160 : delta + 20, 0.9)];
  beat['cs-56'] = [ev('A', t + 60, 0.7), far('V', post ? t + 180 : delta + 40, 0.4)];
  if (potential) beat['abl-d'].push(ev('AP', t + 80, 0.22, 3));
  return beat;
}
// All times designed, not digitized patient data. No RF dosing or catheter coordinates.
const recordings = new Map();
recordings.set('ap-map-antegrade', {
  id: 'ap-map-antegrade', mechanism: 'wpw-pattern', windowMs: 3700, channels,
  events: merge(...[150, 750, 1350, 1950, 2550, 3150].map((t, i) => antegrade(t, false, i >= 3))),
  markers: [{ t: 1850, label: { tr: 'Yol iletimi kaybı (şematik)', en: 'Pathway conduction loss (schematic)' } }],
  calipers: [cal('V local→delta', ref('abl-d', 'V'), ref('ecg-ii', 'delta')),
    cal('AH post', ref('his-d', 'A', 3), ref('his-d', 'H', 3)), cal('HV post', ref('his-d', 'H', 3), ref('his-d', 'V', 3))]
});
recordings.set('ap-map-potential', {
  id: 'ap-map-potential', mechanism: 'wpw-pattern', windowMs: 2100, channels,
  events: merge(...[150, 750, 1350].map((t) => antegrade(t, true))), markers: [],
  calipers: [cal('AP→delta', ref('abl-d', 'AP'), ref('ecg-ii', 'delta')), cal('A→AP local', ref('abl-d', 'A'), ref('abl-d', 'AP'))]
});
recordings.set('ap-map-retrograde', {
  id: 'ap-map-retrograde', mechanism: 'avrt-orthodromic', windowMs: 3400, channels,
  events: merge(...[150, 650, 1150, 1850, 2350, 2850].map((s, i) => {
    const post = i >= 3;
    const b = pacedBeat(s, post
      ? { 'his-p': 200, 'his-d': 202, 'cs-910': 215, 'cs-56': 235, 'cs-12': 250, 'abl-d': 245, hra: 240 }
      : { 'abl-d': 145, 'cs-12': 155, 'cs-56': 175, 'cs-910': 195, 'his-p': 205, 'his-d': 207, hra: 225 });
    b['abl-d'].push(ev('V', s + 80, 0.8));
    if (post) for (const list of Object.values(b)) for (const e of list) {
      if (e.type === 'A') e.ladderOrigin = 'avn-fast';
    }
    return b;
  })),
  markers: [{ t: 1700, label: { tr: 'Ablasyon sonrası (şematik)', en: 'After ablation (schematic)' } }],
  calipers: [cal('VA local pre', ref('abl-d', 'V'), ref('abl-d', 'A')),
    cal('S–A pre', ref('rv', 'S'), ref('abl-d', 'A')), cal('S–V local', ref('rv', 'S'), ref('abl-d', 'V')),
    cal('S–A His post', ref('rv', 'S', 3), ref('his-p', 'A', 3))]
});
export const apAblationRecording = (id) => recordings.has(id) ? structuredClone(recordings.get(id)) : null;
