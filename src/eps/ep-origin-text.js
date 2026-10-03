/*
 * TR/EN text of the PAC / PVC source-region exercise (ep-origin.js). Source
 * ids C1-C11 refer to research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md.
 */
export const ORIGIN_TEXT = Object.freeze({
  tr: {
    heading: 'Kaynak bölgesi: PAC / PVC',
    intro: '12 derivasyonlu EKG\'yi oku ve olası kaynak bölgesini seç. Yanıt, EKG\'den okunan özelliklerle, olası bölgelerle ve güven düzeyinin gerekçesiyle değerlendirilir.',
    kind: 'Alıştırma', kinds: { ventricular: 'PVC (QRS)', atrial: 'Atriyal odak (P dalgası)' },
    next: 'Yeni örnek',
    contexts: { normal: 'Yapısal kalp hastalığı yok.', inferiorScar: 'Eski inferior miyokard enfarktüsü (skar) var.' },
    regions: {
      rvot: 'RVOT', 'lvot-cusp': 'Aort kökü (sol koroner kusp)', 'lv-summit': 'LV summit (epikardiyal)', 'mitral-superior': 'Mitral anulus, süperior', 'ta-free-wall': 'Triküspit anulus, serbest duvar', 'lv-inferior': 'LV inferior bazal',
      'crista-high': 'Krista terminalis, yüksek', 'cs-ostium': 'CS ağzı', 'ta-superior': 'Triküspit anulus süperior / RAA', rspv: 'Sağ üst pulmoner ven', laa: 'Sol atriyal apendiks'
    },
    question: 'Olası kaynak bölgesi hangisi?',
    grades: {
      match: 'Kaynak bölge bu.',
      compatible: 'Bu EKG ile uyumlu, ama örneğin kaynağı başka bir bölgeydi: desen bu iki bölgeyi ayırmıyor.',
      mismatch: 'EKG deseni bu bölgeyle uyuşmuyor.'
    },
    source: 'Örneğin kaynağı',
    featuresTitle: 'EKG\'den okunan özellikler',
    featureLines: (f) => [
      ...(f.bundle ? [`V1: ${f.bundle === 'LBBB' ? 'sol dal bloğu benzeri (baskın negatif)' : f.bundle === 'RBBB' ? 'sağ dal bloğu benzeri (baskın R)' : 'belirsiz (bifazik)'}`] : [`V1: ${POL_TR[f.v1]}`]),
      `Eksen: ${f.axis === 'inferior' ? 'inferior (II, III, aVF pozitif)' : f.axis === 'superior' ? 'süperior (aVF negatif)' : 'ara'}`,
      `DI: ${POL_TR[f.leadI]} · aVL: ${POL_TR[f.aVL]} · aVR: ${POL_TR[f.aVR]}`,
      ...(f.kind === 'ventricular' && f.aVL === '-' ? [`aVL negatif sapması aVR'ninkinden ${f.avlAvr > 1.1 ? 'derin' : 'derin değil'}`] : []),
      ...(f.kind === 'ventricular' ? [`Prekordiyal geçiş: ${f.transition || 'yok'}`] : [])
    ],
    likelyTitle: 'Olası bölgeler',
    confidence: { moderate: 'Güven: orta (desen tek bölgeye uyuyor; kesin hedef değildir).', low: 'Güven: düşük.' },
    reasons: {
      single: 'Tek bölgenin deseni tam uyuyor; komşu yapılar yine de benzer EKG verebilir, kesin yer haritalamayla bulunur.',
      overlap: 'Birden çok bölgenin deseni uyuyor: yüzey EKG bu bölgeleri ayırmaz; haritalama gerekir.',
      partial: 'Hiçbir bölgenin deseni tam uymuyor; en yakın olanlar listelendi.',
      scarExit: 'Yapısal kalp hastalığında yüzey EKG devrenin çıkışını gösterir; kritik istmus ve ablasyon hedefi haritalama ve entrainment ile bulunur (C8).'
    },
    sampling: (ch, ms) => `En erken kayıtlı A: ${ch}, P başlangıcına göre ${ms > 0 ? '+' : ''}${ms} ms.`,
    before: 'A, P başlangıcından önce: bu kateter odağa yakın.',
    after: 'En erken kayıtlı A bile P başlangıcından sonra: odak kayıt kateterlerinin olmadığı bir yerde (örnekleme sınırı). En erken kanal odak değildir.',
    stripTitle: 'Atriyal odak: kateter aktivasyonu',
    scene: 'Şemada kaynak bölge turuncu daire ile işaretlendi.',
    limits: 'Kalp vektörleri öğretim için tasarlandı; amplitüd görecelidir. Desenler kaynaklardaki bulguların sadeleştirilmiş karşılığıdır. LV summit: Yamada 2010 (C10), Kuniewicz 2021 (C11); summit büyük kardiyak ven ile ulaşılabilir alt ve koroner arterlere yakınlık nedeniyle ulaşılamaz üst bölgeye ayrılır. Kaynaklar C1-C11: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md.'
  },
  en: {
    heading: 'Source region: PAC / PVC',
    intro: 'Read the 12-lead ECG and choose the likely source region. The answer is judged against the features read from the ECG, the likely regions and the reason for the confidence level.',
    kind: 'Exercise', kinds: { ventricular: 'PVC (QRS)', atrial: 'Atrial focus (P wave)' },
    next: 'New example',
    contexts: { normal: 'No structural heart disease.', inferiorScar: 'Old inferior myocardial infarction (scar).' },
    regions: {
      rvot: 'RVOT', 'lvot-cusp': 'Aortic root (left coronary cusp)', 'lv-summit': 'LV summit (epicardial)', 'mitral-superior': 'Mitral annulus, superior', 'ta-free-wall': 'Tricuspid annulus, free wall', 'lv-inferior': 'Basal inferior LV',
      'crista-high': 'High crista terminalis', 'cs-ostium': 'CS ostium', 'ta-superior': 'Superior tricuspid annulus / RAA', rspv: 'Right superior pulmonary vein', laa: 'Left atrial appendage'
    },
    question: 'Which is the likely source region?',
    grades: {
      match: 'This is the source region.',
      compatible: 'Compatible with this ECG, but the example came from another region: the pattern does not separate the two.',
      mismatch: 'The ECG pattern does not fit this region.'
    },
    source: 'Source of the example',
    featuresTitle: 'Features read from the ECG',
    featureLines: (f) => [
      ...(f.bundle ? [`V1: ${f.bundle === 'LBBB' ? 'left bundle branch block-like (dominant negative)' : f.bundle === 'RBBB' ? 'right bundle branch block-like (dominant R)' : 'indeterminate (biphasic)'}`] : [`V1: ${POL_EN[f.v1]}`]),
      `Axis: ${f.axis === 'inferior' ? 'inferior (II, III, aVF positive)' : f.axis === 'superior' ? 'superior (aVF negative)' : 'intermediate'}`,
      `I: ${POL_EN[f.leadI]} · aVL: ${POL_EN[f.aVL]} · aVR: ${POL_EN[f.aVR]}`,
      ...(f.kind === 'ventricular' && f.aVL === '-' ? [`aVL negative deflection ${f.avlAvr > 1.1 ? 'deeper' : 'not deeper'} than aVR`] : []),
      ...(f.kind === 'ventricular' ? [`Precordial transition: ${f.transition || 'none'}`] : [])
    ],
    likelyTitle: 'Likely regions',
    confidence: { moderate: 'Confidence: moderate (the pattern fits one region; not a definite target).', low: 'Confidence: low.' },
    reasons: {
      single: 'One region\'s pattern fits fully; neighbouring structures can still give a similar ECG, and the exact site is found by mapping.',
      overlap: 'More than one region\'s pattern fits: the surface ECG does not separate them; mapping is needed.',
      partial: 'No region\'s pattern fits fully; the closest are listed.',
      scarExit: 'In structural heart disease the surface ECG shows the exit of the circuit; the critical isthmus and the ablation target are found by mapping and entrainment (C8).'
    },
    sampling: (ch, ms) => `Earliest recorded A: ${ch}, ${ms > 0 ? '+' : ''}${ms} ms from P onset.`,
    before: 'The A comes before the P onset: this catheter is close to the focus.',
    after: 'Even the earliest recorded A comes after the P onset: the focus lies where no recording catheter is (a sampling limit). The earliest channel is not the focus.',
    stripTitle: 'Atrial focus: catheter activation',
    scene: 'The schematic marks the source region with an orange circle.',
    limits: 'The heart vectors were designed for teaching; amplitude is relative. The patterns are simplified versions of published findings. Sources C1-C11: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md. LV summit: Yamada 2010 (C10), Kuniewicz 2021 (C11); the great cardiac vein splits the summit into an accessible inferior area and an inaccessible superior area close to the coronary arteries.'
  }
});

const POL_TR = { '+': 'pozitif', '-': 'negatif', '±': 'bifazik', 0: 'izoelektrik' };
const POL_EN = { '+': 'positive', '-': 'negative', '±': 'biphasic', 0: 'isoelectric' };
