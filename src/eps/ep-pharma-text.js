// Alternative synthetic teaching examples, never patient response predictions.
export const PHARMA_SOURCES = [
  { id: 'F1', title: 'Stellbrink et al. (2001): Differential Effects of Atropine and Isoproterenol on Inducibility of AVNRT', url: 'https://doi.org/10.1023/A:1013258331023' },
  { id: 'F2', title: 'Hatzinikolaou et al. (1998): Isoprenaline and inducibility of atrioventricular nodal re-entrant tachycardia', url: 'https://doi.org/10.1136/hrt.79.2.165' },
  { id: 'F3', title: 'Akhtar et al. (1974): Electrophysiologic effects of atropine on atrioventricular conduction studied by His bundle electrogram', url: 'https://doi.org/10.1016/0002-9149(74)90313-0' },
];

export const PHARMA_TEXT = {
  tr: {
    heading: 'Farmakolojik provokasyon',
    intro: 'Atropin ve Isuprel sonrası hız, AV nodal iletim ve indüklenebilirliği önce/sonra karşılaştır. Her seçim ayrı bir örnektir.',
    drug: 'Manevra', example: 'Alternatif eğitim örneği', before: 'Önce', after: 'Sonra',
    show: 'Önce / sonra göster', reset: 'Örneği sıfırla', compareHead: ['Ölçüm', 'Önce', 'Sonra'],
    drugs: { atropine: 'Atropin', isuprel: 'Isuprel (izoproterenol)' },
    examples: {
      'sinus-av': 'Sinüs hızı ve AV nodal iletim',
      'echo-only': 'Tek echo, sürdürülen taşikardi yok',
      induced: 'Taşikardi indüklenen örnek',
      noninduced: 'Taşikardi indüklenmeyen örnek',
    },
    mechanism: {
      atropine: 'Atropin muskarinik reseptör blokajıyla vagal etkiyi azaltır. Sinüs hızı ve AV nodal iletim değişebilir; bu örnekteki AH kısalması aynı S1-S1 500 ms hızında karşılaştırılır. [F3]',
      isuprel: 'Isuprel beta-adrenerjik agonisttir. Sinüs hızı ve nodal yol özelliklerini değiştirebilir. Hızlı/yavaş yol iletimi ve refrakterliğine göre AVNRT indüksiyonunu kolaylaştırabilir veya engelleyebilir. [F1, F2]',
    },
    observed: {
      rate: 'Bu örnekte sinüs hızı artar, P-P kısalır. AH/HV karşılaştırması sabit S1-S1 500 ms ile yapılır; HV bu örnekte sabittir. Bu, tüm hastalarda beklenen yanıt veya infrahisiyen güvenlik göstergesi değildir.',
      echo: 'Bu örnekte S2 sonrası tek retrograd atriyal echo görülür. Tek echo sürdürülen SVT değildir; mekanizma için diğer EP bulguları gerekir.',
      induced: 'Bu örnekte S2 sonrası tekrarlayan A-H-V döngüleri oluşur. İlaç yanıtı tek başına taşikardi mekanizmasını tanımlamaz. [F1, F2]',
      noninduced: 'Bu örnekte provokasyon sonrası sürdürülen taşikardi oluşmaz. İndüklenememe aritmiyi dışlamaz; yanıt protokol ve nodal yol özelliklerine bağlıdır. [F1, F2]',
    },
    labels: { rate: 'Sinüs hızı', pp: 'P-P', drive: 'S1-S1', ah: 'AH (aynı S1)', hv: 'HV', s2: 'S1-S2', testAh: 'AH (S2)', va: 'VA (echo)', echo: 'Tek echo', induced: 'Taşikardi', tcl: 'TCL' },
    yes: 'Var', no: 'Yok', notMeasured: 'Ölçülmedi',
    stale: 'Seçim değişti. Yeni önce/sonra örneğini göster.',
    limits: 'Echo, indüksiyon ve indüklenememe birbirinden ayrı alternatif örneklerdir. İlaç yanıtı tek başına tanı koydurmaz veya aritmiyi dışlamaz. Doz ve uygulama protokolü modellenmez.',
    rateOnly: 'Bu vakada yalnız hız ve AV nodal iletim örneği vardır; indüksiyon örnekleri bu vaka için modellenmedi.',
    sources: 'Kaynaklar', strip: (drug, phase) => `${drug} · ${phase}`,
  },
  en: {
    heading: 'Pharmacological provocation',
    intro: 'Compare rate, AV nodal conduction and inducibility before/after atropine or Isuprel. Each selection is a separate example.',
    drug: 'Maneuver', example: 'Alternative teaching example', before: 'Before', after: 'After',
    show: 'Show before / after', reset: 'Reset example', compareHead: ['Measurement', 'Before', 'After'],
    drugs: { atropine: 'Atropine', isuprel: 'Isuprel (isoproterenol)' },
    examples: { 'sinus-av': 'Sinus rate and AV nodal conduction', 'echo-only': 'Single echo, no sustained tachycardia', induced: 'Tachycardia induced example', noninduced: 'Tachycardia not induced example' },
    mechanism: {
      atropine: 'Atropine reduces vagal influence through muscarinic receptor blockade. Sinus rate and AV nodal conduction may change; AH shortening in this example is compared at the same S1-S1 500 ms pacing rate. [F3]',
      isuprel: 'Isuprel is a beta-adrenergic agonist. It may change sinus rate and nodal pathway properties. Depending on fast/slow pathway conduction and refractoriness, it may facilitate or prevent AVNRT induction. [F1, F2]',
    },
    observed: {
      rate: 'In this example sinus rate rises and P-P shortens. AH/HV are compared at fixed S1-S1 500 ms; HV stays fixed in this example. This is neither a universal response nor an indicator of infrahisian safety.',
      echo: 'In this example S2 is followed by a single retrograde atrial echo. A single echo is not sustained SVT; mechanism requires other EP findings.',
      induced: 'In this example S2 is followed by repeating A-H-V cycles. Drug response alone does not establish the tachycardia mechanism. [F1, F2]',
      noninduced: 'In this example sustained tachycardia does not occur after provocation. Noninducibility does not exclude arrhythmia; response depends on protocol and nodal pathway properties. [F1, F2]',
    },
    labels: { rate: 'Sinus rate', pp: 'P-P', drive: 'S1-S1', ah: 'AH (same S1)', hv: 'HV', s2: 'S1-S2', testAh: 'AH (S2)', va: 'VA (echo)', echo: 'Single echo', induced: 'Tachycardia', tcl: 'TCL' },
    yes: 'Present', no: 'Absent', notMeasured: 'Not measured',
    stale: 'Selection changed. Show the new before/after example.',
    limits: 'Echo, induction and noninduction are separate alternative examples. Drug response alone neither diagnoses a mechanism nor excludes arrhythmia. Dose and administration protocol are not modeled.',
    rateOnly: 'This case offers the rate and AV nodal conduction example only; induction examples are not modeled for it.',
    sources: 'Sources', strip: (drug, phase) => `${drug} · ${phase}`,
  },
};
