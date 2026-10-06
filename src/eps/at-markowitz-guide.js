import { AT_SOURCE } from './at-markowitz-recordings.js';
const text = {
  tr: {
    title: 'Atriyal taşikardi: Markowitz 2019',
    points: [
      'Fokal AT: sınırlı erken bölgeden santrifugal yayılım; tetiklenmiş aktivite veya otomatik kaynak. P dalgasında izoelektrik aralık destekleyebilir fakat fokal mekanizmayı kanıtlamaz. Önceki ablasyon, cerrahi ve atriyal miyopati P morfolojisini değiştirebilir.',
      'Haritalama: erken lokal A, P başlangıcından önce gelir; makalede en az 30 ms erken A ve keskin negatif QS unipolar sinyal anlatılır. Bir polarite veya tek erken nokta yeterli değildir; bütün atriyal aktivasyonla birlikte değerlendirilir.',
      'Adenozin karşılaştırması: tetiklenmiş AT sonlanabilir, otomatik AT geçici baskılanabilir. Reentran AT ise AV blok oluşurken sürebilir. Bu yanıtlar mekanizma için ipucudur; sonlanma AVNRT/AVRT’den tek başına ayırmaz.',
      'Para-Hisian AT: erken His komşuluğu A, kesin ablasyon hedefi değildir. RA septumu, nonkoroner aortik cusp (NCC) ve LA septumu karşılaştırılır. Şekil 3’te NCC biraz daha geç olmasına rağmen başarılı hedef; yer seçimi AV blok riski ve anatomiyle birlikte değerlendirilir.',
      'Makroreentry: haritada tüm TCL’nin açıklanması, erken-geç komşuluğu ve uygun entrainment/fusion aranır. Geçerli entrainment sırasında PPI’nin TCL’ye 30 ms içinde olması devre yakınlığını destekler. Birden çok atriyal bölgeyle doğrulama gerekir; pacing devreyi sonlandırabilir, değiştirebilir veya yavaş iletim nedeniyle yalancı uzun PPI oluşturabilir.',
      'Lokalize reentry: küçük alanda TCL’nin çoğunu kaplayan düşük genlikli, uzun fraksiyone elektrogramlar görülebilir. Bunlar bystander bölgede de bulunabilir; tek sinyal veya renkli harita pseudo-reentry’den ayrım yapmaz.',
      'Ablasyon sonlanımı: fokal kaynağın ortadan kalkması ile lineer reentry lezyonunun iki yönlü iletim bloğu farklıdır. Taşikardinin durması tek başına lineer blok kanıtı değildir. İki taraftan pacing, aktivasyonun dolanması ve diferansiyel pacing birlikte değerlendirilir; mitral istmustaki epikardiyal köprüler pseudo-blok oluşturabilir.',
      'Recorder örnekleri sentetik. Ladder A–AV–V ilişkisini gösterir; santrifugal harita, atriyal devre geometrisi, lezyon seti veya enerji/doz simülasyonu değildir.'
    ]
  },
  en: {
    title: 'Atrial tachycardia: Markowitz 2019',
    points: [
      'Focal AT: centrifugal spread from a discrete early region, due to triggered activity or automaticity. An isoelectric P-wave interval may support but does not establish a focal mechanism. Prior ablation, surgery and atrial myopathy can change P-wave morphology.',
      'Mapping: local early A precedes P onset; the review describes A at least 30 ms early and a sharp negative QS unipolar signal. One polarity or early point is insufficient; assess the complete atrial activation pattern.',
      'Adenosine comparison: triggered AT may terminate and automatic AT may be transiently suppressed. Reentrant AT may continue while AV block develops. These are mechanism clues; termination alone does not separate AT from AVNRT/AVRT.',
      'Para-Hisian AT: early His-region A is not a definitive ablation target. Compare RA septum, noncoronary aortic cusp (NCC) and LA septum. In Figure 3, a slightly later NCC site was successful; site choice considers AV block risk and anatomy.',
      'Macroreentry: account for the full TCL on the map, adjacent early/late activation and appropriate entrainment/fusion. During valid entrainment, PPI within 30 ms of TCL supports circuit proximity. Confirm at multiple atrial regions; pacing may terminate/transform the circuit or cause misleadingly long PPI through conduction slowing.',
      'Localized reentry: low-amplitude, prolonged fractionated signals may span most of the TCL in a small area. Such signals can occur at bystanders; one electrogram or color map does not exclude pseudo-reentry.',
      'Ablation endpoints: eliminating a focal source differs from bidirectional conduction block across a reentry line. Tachycardia termination alone does not prove line block. Assess pacing from both sides, activation detour and differential pacing together; epicardial bridges at the mitral isthmus can create pseudoblock.',
      'Recorder examples are synthetic. The ladder shows A–AV–V relationships, not centrifugal mapping, atrial circuit geometry, lesion sets or energy/dose simulation.'
    ]
  }
};
export function createAtGuide(doc, getLang) {
  const root = doc.createElement('details'); root.className = 'basics-card'; root.setAttribute('data-at-markowitz', '');
  const title = doc.createElement('summary'), list = doc.createElement('ol'), source = doc.createElement('a');
  list.className = 'basics-lines'; source.href = AT_SOURCE; source.target = '_blank'; source.rel = 'noopener noreferrer';
  source.textContent = 'Markowitz et al., AER 2019;8:131–137'; root.append(title, list, source);
  function render() {
    const t = text[getLang() === 'en' ? 'en' : 'tr']; title.textContent = t.title;
    list.replaceChildren(...t.points.map((p) => { const li = doc.createElement('li'); li.textContent = p; return li; }));
  }
  render(); return { element: root, render };
}
