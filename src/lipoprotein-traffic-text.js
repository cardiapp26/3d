// Interface words of the lipoprotein traffic lab (TR / EN).
const FIELD = {
  tr: { ldl: 'LDL-C', tg: 'TG', hdl: 'HDL-C', lpa: 'Lp(a)' },
  en: { ldl: 'LDL-C', tg: 'TG', hdl: 'HDL-C', lpa: 'Lp(a)' }
};

export const LPT_WORDS = {
  tr: {
    eyebrow: 'LİPOPROTEİN TRAFİĞİ',
    title: 'Kamyon benzetmesinden bilime: kanda kim neyi taşır?',
    intro: 'Sosyal medyada yaygın bir infografik lipitleri yoldaki kamyonlarla anlatıyor: LDL teslimat, HDL geri dönüşüm, ApoB plaka. Burada aynı yol, bilimsel ayrıntıyla canlandırıldı. Bir partikül seçin; profili ve müdahaleleri değiştirin; yoldaki ve arter duvarındaki apoB partiküllerini izleyin. Gönderideki iddialar en altta tek tek kontrol edildi.',
    svgTitle: 'Bağırsak ve karaciğerden çıkan lipoproteinler, plazmada dolaşım, kas ve yağ dokusunda LPL, arter intimasında apoB partikül tutulumu',
    labels: { intestine: 'Bağırsak', liver: 'Karaciğer', tissue: 'Kas / yağ', plasma: 'Plazma', intima: 'Arter intiması' },
    chips: 'Lipoprotein sınıfları',
    apobOff: 'ApoB plakalarını göster', apobOn: 'ApoB görünümü açık: HDL soluk',
    count: ({ road, wall }) => `Yolda ${road} apoB partikülü · intimada tutulan ${wall}`,
    size: 'Boyut', density: 'Yoğunluk', cargo: 'Ana yük', apos: 'Apolipoproteinler', apoB: 'ApoB plakası', apoBYes: 'Var, partikül başına bir', apoBNo: 'Yok (apoA-I taşır)', route: 'Yol', atherogenic: 'Aterojenik mi?',
    analogy: 'Benzetme (gönderi)', science: 'Bilimsel not',
    labTitle: 'Profil laboratuvarı: aynı LDL-C, farklı kamyon sayısı',
    labIntro: 'Bir başlangıç profili seçin veya değerleri girin, sonra yaşam tarzı ve ilaç seçeneklerini işaretleyin. Etkiler kanıtın orta değerlerine yuvarlanmış öğretim büyüklükleridir ve çarpımsal birleşir. "Aterojenik dislipidemi" profilinde LDL-C referansla aynıdır ama apoB partikülü fazladır. Animasyon "Sonra" sütununu izler.',
    presets: 'Başlangıç profilleri',
    inputs: { ldl: 'LDL-C · mg/dL', tg: 'Trigliserid · mg/dL', hdl: 'HDL-C · mg/dL', lpa: 'Lp(a) · nmol/L' },
    lifestyle: 'Yaşam tarzı', drugs: 'İlaç (karşılaştırma için)',
    head: ['Değer', 'Başlangıç', 'Sonra', 'Değişim'],
    rows: [
      ['ldl', 'LDL-C', 'mg/dL', 0], ['tg', 'Trigliserid', 'mg/dL', 0], ['hdl', 'HDL-C', 'mg/dL', 0],
      ['nonHdl', 'non-HDL-C', 'mg/dL', 0], ['remnantC', 'Remnant-C (TG/5)', 'mg/dL', 0], ['lpa', 'Lp(a)', 'nmol/L', 0],
      ['tgHdl', 'TG/HDL-C', '', 1], ['p.apoB', 'ApoB (şematik tahmin)', 'mg/dL', 0], ['p.total', 'ApoB partikül sayısı (şematik)', 'nmol/L', 0]
    ],
    flags: {
      'tg-estimate': 'TG ≥400 mg/dL: TG/5 ile remnant kolesterol tahmini güvenilir değildir.',
      'tg-high': 'TG ≥150 mg/dL: remnant partikülleri ve küçük yoğun LDL artar.',
      'lpa-high': 'Lp(a) ≥125 nmol/L: yüksek (EAS 2022). Yaşam tarzıyla değişmez; diğer riskler daha sıkı yönetilir.',
      'ldl-severe': 'LDL-C ≥190 mg/dL: ailesel hiperkolesterolemi açısından değerlendirilir; yaşam tarzı tek başına yetmez.',
      'hdl-very-high': 'HDL-C ≥90 mg/dL: koruyucu varsayılmaz; çok yüksek değerlerde mortalite artabilir.',
      'hdl-low': 'HDL-C <40 mg/dL: risk işaretidir, tedavi hedefi değildir.',
      'apob-discordant': 'ApoB, LDL-C’nin tek başına düşündürdüğünden yüksek: kamyon sayısı fazla (küçük yoğun LDL, remnant veya Lp(a)). Ölçülen apoB yararlıdır.'
    },
    invalid: ({ field, min, max }) => `${FIELD.tr[field]} için ${min} ile ${max} arasında bir değer girin.`,
    claimsTitle: 'Gönderideki iddialar: ne doğru, ne eksik?',
    claimsIntro: 'Her iddiayı açın. Yeşil: doğru. Sarı: düzeltme gerekir. Kırmızı: yanıltıcı.',
    verdicts: { ok: 'Doğru', partial: 'Eksik', wrong: 'Yanıltıcı' },
    sourcesLabel: 'Kaynak',
    limit: 'Özgün, basitleştirilmiş öğretim modeli. Partikül sayıları ve apoB tahmini şematiktir (LDL-C başına sabit partikül, TG ile küçük yoğun LDL düzeltmesi); ölçülen apoB veya NMR yerine geçmez. Animasyonda Lp(a), VLDL ve HDL görünürlük için büyütülmüştür; hızlar ve boyutlar ölçekli değildir. Yaşam tarzı ve ilaç etkileri popülasyon ortalamalarıdır, kişisel öngörü veya tedavi önerisi değildir. * Gönderide olmayan sınıf.',
    sources: 'Kaynaklar'
  },
  en: {
    eyebrow: 'LIPOPROTEIN TRAFFIC',
    title: 'From the truck analogy to the science: who carries what in blood?',
    intro: 'A popular infographic explains lipids as trucks on a road: LDL delivers, HDL recycles, ApoB is the licence plate. Here the same road is animated with the scientific detail. Pick a particle, change the profile and the levers, and watch apoB particles on the road and in the arterial wall. The post’s claims are checked one by one at the end.',
    svgTitle: 'Lipoproteins leaving the intestine and liver, circulating in plasma, LPL in muscle and adipose tissue, and apoB particle retention in the arterial intima',
    labels: { intestine: 'Intestine', liver: 'Liver', tissue: 'Muscle / fat', plasma: 'Plasma', intima: 'Arterial intima' },
    chips: 'Lipoprotein classes',
    apobOff: 'Show ApoB plates', apobOn: 'ApoB view on: HDL dimmed',
    count: ({ road, wall }) => `${road} apoB particles on the road · ${wall} retained in the intima`,
    size: 'Size', density: 'Density', cargo: 'Main load', apos: 'Apolipoproteins', apoB: 'ApoB plate', apoBYes: 'Yes, one per particle', apoBNo: 'No (carries apoA-I)', route: 'Route', atherogenic: 'Atherogenic?',
    analogy: 'Analogy (post)', science: 'Scientific note',
    labTitle: 'Profile lab: same LDL-C, different truck count',
    labIntro: 'Pick a starting profile or enter values, then tick lifestyle and drug options. Effects are teaching magnitudes rounded to the middle of the evidence and combine multiplicatively. The "atherogenic dyslipidemia" profile has the same LDL-C as the reference but more apoB particles. The animation follows the "After" column.',
    presets: 'Starting profiles',
    inputs: { ldl: 'LDL-C · mg/dL', tg: 'Triglycerides · mg/dL', hdl: 'HDL-C · mg/dL', lpa: 'Lp(a) · nmol/L' },
    lifestyle: 'Lifestyle', drugs: 'Drugs (for comparison)',
    head: ['Value', 'Start', 'After', 'Change'],
    rows: [
      ['ldl', 'LDL-C', 'mg/dL', 0], ['tg', 'Triglycerides', 'mg/dL', 0], ['hdl', 'HDL-C', 'mg/dL', 0],
      ['nonHdl', 'non-HDL-C', 'mg/dL', 0], ['remnantC', 'Remnant-C (TG/5)', 'mg/dL', 0], ['lpa', 'Lp(a)', 'nmol/L', 0],
      ['tgHdl', 'TG/HDL-C', '', 1], ['p.apoB', 'ApoB (schematic estimate)', 'mg/dL', 0], ['p.total', 'ApoB particle count (schematic)', 'nmol/L', 0]
    ],
    flags: {
      'tg-estimate': 'TG ≥400 mg/dL: the TG/5 remnant cholesterol estimate is unreliable.',
      'tg-high': 'TG ≥150 mg/dL: remnant particles and small dense LDL increase.',
      'lpa-high': 'Lp(a) ≥125 nmol/L: high (EAS 2022). Lifestyle does not change it; other risks are managed harder.',
      'ldl-severe': 'LDL-C ≥190 mg/dL: assess for familial hypercholesterolemia; lifestyle alone is not enough.',
      'hdl-very-high': 'HDL-C ≥90 mg/dL: not assumed protective; mortality may rise at very high values.',
      'hdl-low': 'HDL-C <40 mg/dL: a risk marker, not a treatment target.',
      'apob-discordant': 'ApoB is higher than LDL-C alone suggests: more trucks (small dense LDL, remnants or Lp(a)). Measured apoB helps.'
    },
    invalid: ({ field, min, max }) => `Enter a value between ${min} and ${max} for ${FIELD.en[field]}.`,
    claimsTitle: 'The post’s claims: what holds, what is missing?',
    claimsIntro: 'Open each claim. Green: correct. Amber: needs a correction. Red: misleading.',
    verdicts: { ok: 'Correct', partial: 'Incomplete', wrong: 'Misleading' },
    sourcesLabel: 'Source',
    limit: 'Original, simplified teaching model. Particle counts and the apoB estimate are schematic (fixed particles per LDL-C, small dense LDL correction with TG); they do not replace measured apoB or NMR. In the animation Lp(a), VLDL and HDL are enlarged for visibility; speeds and sizes are not to scale. Lifestyle and drug effects are population averages, not personal predictions or treatment advice. * Class not in the post.',
    sources: 'Sources'
  }
};
