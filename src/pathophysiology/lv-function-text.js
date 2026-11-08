export const LV_FUNCTION_TEXT = {
  tr: {
    kicker: 'HÜCREDEN VENTRİKÜLE',
    title: 'Sol ventrikül sistolik performansı',
    intro: 'Kalsiyum sinyali kuvveti başlatır. Ventrikülün ne kadar kan attığı, kasın kuvvet üretme kapasitesine, yüklerine ve geometrisine bağlıdır.',
    clock: 'Eşzamanlı döngü',
    scenarios: 'Tek bir belirleyiciyi karşılaştır',
    cases: {
      baseline: ['Başlangıç', 'Aynı kalp döngüsünde kalsiyum sinyalini, kısalmayı ve ventrikül boşalmasını takip edin.'],
      preload: ['Ön yük ↑', 'Diyastol sonu hacmi ve başlangıç gerimi artar. Bu aralıkta, diğer koşullar sabitken atım hacmi artar (Frank-Starling).'],
      afterload: ['Ard yük ↑', 'Etkin arteriyel elastans artar. Aynı doluş ve kontraktilitede ventrikülde daha fazla kan kalır ve atım hacmi düşer.'],
      contractility: ['Kontraktilite ↑', 'Sistol sonu elastansı artar. Aynı doluş ve ard yükte ventrikül daha çok boşalır.'],
      geometry: ['Geometri değişimi', 'Daha yuvarlak boşlukta kısa eksen yarıçapı büyür. Duvar da incelirse aynı basınçta yaklaşık duvar stresi artar. Bu karşılaştırmada hacim ve elastanslar sabittir.']
    },
    cell: 'Uyarılma-kasılma eşleşmesi', pump: 'Sol ventrikül kesiti',
    calcium: 'Hücre dışı Ca²⁺', trigger: 'L tipi kanal', store: 'SR · RyR2', sarcomere: 'Sarkomer',
    wall: 'Miyokart', cavity: 'LV boşluğu', diastolicContour: 'Diyastol sonu sınırı',
    stages: [
      ['Doluş', 'Sitozolik Ca²⁺ düşüktür. Doluş, kasılma öncesi lif uzunluğunu belirler.'],
      ['Ca²⁺ girişi', 'Depolarizasyon, L tipi kanalları açar. Az miktarda hücre dışı Ca²⁺ içeri girer.'],
      ['SR’den Ca²⁺ salınımı', 'Giren Ca²⁺, RyR2 kanallarını açar. Sarkoplazmik retikulum daha fazla Ca²⁺ salar. Ca²⁺ troponin C’ye bağlanınca izovolümik kasılmada kuvvet oluşmaya başlar.'],
      ['Kısalma ve ejeksiyon', 'Aktin ve miyozin kuvvet üretmeye devam eder. Aort kapağı açıldıktan sonra ventrikül kısalarak kanı dışarı atar.'],
      ['Gevşeme', 'SERCA ve Na⁺/Ca²⁺ değiştiricisi sitozolik Ca²⁺’yı azaltır. Gevşeme başlar.']
    ],
    metrics: ['Diyastol sonu hacim', 'Sistol sonu hacim', 'Atım hacmi', 'Ejeksiyon fraksiyonu', 'Yaklaşık duvar stresi'],
    measures: 'Ekoda ne ölçülür?',
    echo: [
      ['EF', 'Atım hacmi ÷ diyastol sonu hacmi. Yüke bağlıdır ve tek başına kontraktiliteyi ölçmez.'],
      ['Fraksiyonel kısalma', 'Kısa eksen iç çapının diyastolden sistole oransal azalması. Geometriye ve ölçüm düzlemine duyarlıdır.'],
      ['Doku hızı', 'Miyokardın veya anülüsün birim zamandaki yer değiştirmesi. Doku Doppler ile ölçülebilir.'],
      ['Strain (deformasyon)', 'Başlangıç uzunluğuna göre oransal değişim. Boyuna kısalma negatif strain oluşturur.']
    ],
    scope: 'Basınç ve hacimler eğitim amaçlı P–V modelinden gelir. Ca²⁺ ve sarkomer hareketi şematiktir. Geometri, sistol sonunda Laplace yaklaşımıyla yalnızca yaklaşık duvar stresini değiştirir.',
    sources: 'Fizyoloji ve ölçüm kaynakları'
  },
  en: {
    kicker: 'FROM CELL TO VENTRICLE',
    title: 'Left ventricular systolic performance',
    intro: 'Calcium initiates force generation. Ejection depends on intrinsic force generation, loading conditions and ventricular geometry.',
    clock: 'Synchronized beat',
    scenarios: 'Compare one determinant at a time',
    cases: {
      baseline: ['Baseline', 'Follow calcium signaling, shortening and ventricular emptying over the same beat.'],
      preload: ['Preload ↑', 'End-diastolic volume and initial stretch rise. Within this range, stroke volume increases at fixed contractility and afterload (Frank–Starling).'],
      afterload: ['Afterload ↑', 'Effective arterial elastance rises. With the same filling and contractility, more blood remains in the ventricle and stroke volume falls.'],
      contractility: ['Contractility ↑', 'End-systolic elastance rises. With the same filling and afterload, the ventricle ejects more blood.'],
      geometry: ['Geometry change', 'A rounder cavity has a larger short-axis radius. A thinner wall further raises estimated stress at the same pressure. Volume and elastance are held fixed here.']
    },
    cell: 'Excitation–contraction coupling', pump: 'Left ventricular section',
    calcium: 'Extracellular Ca²⁺', trigger: 'L-type channel', store: 'SR · RyR2', sarcomere: 'Sarcomere',
    wall: 'Myocardium', cavity: 'LV cavity', diastolicContour: 'End-diastolic outline',
    stages: [
      ['Filling', 'Cytosolic Ca²⁺ is low. Filling sets the initial stretch before contraction.'],
      ['Ca²⁺ influx', 'Depolarization opens L-type channels. A small amount of extracellular Ca²⁺ enters.'],
      ['SR Ca²⁺ release', 'Incoming Ca²⁺ opens RyR2 channels. The sarcoplasmic reticulum releases more Ca²⁺. Ca²⁺ binds troponin C and tension starts to build during isovolumic contraction.'],
      ['Shortening and ejection', 'Actin and myosin continue generating force. Once the aortic valve opens, the ventricle shortens and ejects blood.'],
      ['Relaxation', 'SERCA and Na⁺/Ca²⁺ exchange lower cytosolic Ca²⁺. Relaxation begins.']
    ],
    metrics: ['End-diastolic volume', 'End-systolic volume', 'Stroke volume', 'Ejection fraction', 'Estimated wall stress'],
    measures: 'What does echo measure?',
    echo: [
      ['EF', 'Stroke volume ÷ end-diastolic volume. It depends on load and cannot measure intrinsic contractility on its own.'],
      ['Fractional shortening', 'Relative reduction in short-axis cavity diameter from diastole to systole. It depends on geometry and measurement plane.'],
      ['Tissue velocity', 'Displacement of the myocardium or annulus per unit time. Tissue Doppler can measure it.'],
      ['Strain', 'Relative change from initial tissue length. Longitudinal shortening produces negative strain.']
    ],
    scope: 'Pressure and volumes come from the teaching P–V model. Calcium and sarcomere motion are schematic. Geometry changes only the approximate end-systolic wall stress calculated by the Laplace relation.',
    sources: 'Physiology and measurement sources'
  }
};
