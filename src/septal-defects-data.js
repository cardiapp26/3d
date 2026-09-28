const atrialSource = {
  title: 'Naqvi et al. (2018): Anatomy of the atrial septum and interatrial communications',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6174145/',
};
const ventricularSource = {
  title: 'Lopez et al. (2018): ISNPCHD ventricular septal defect classification',
  url: 'https://ipccc.net/wp-content/uploads/2024/01/2018-11-ANNALS-Lopez-2018-VSD-Classification.pdf',
};

export const DEFECT_TYPES = [
  {
    id: 'asd-secundum', family: 'asd', code: 'Secundum',
    title: { tr: 'Ostium secundum ASD', en: 'Ostium secundum ASD' },
    location: { tr: 'Fossa ovalis', en: 'Oval fossa' },
    detail: { tr: 'Fossa ovalis tabanındaki doku eksikliğidir; gerçek atriyal septum içindedir.', en: 'Tissue deficiency in the oval fossa floor, within the true atrial septum.' },
    source: atrialSource,
  },
  {
    id: 'asd-primum', family: 'asd', code: 'Primum',
    title: { tr: 'Ostium primum (AVSD)', en: 'Ostium primum (AVSD)' },
    location: { tr: 'AV bileşke komşuluğu', en: 'Adjacent to the AV junction' },
    detail: { tr: 'Ortak atriyoventriküler bileşkeli AVSD spektrumundadır; gerçek septum dışındadır.', en: 'Part of the AVSD spectrum with a common atrioventricular junction; outside the true septum.' },
    source: atrialSource,
  },
  {
    id: 'asd-sinus-superior', family: 'asd', code: 'SV sup.',
    title: { tr: 'Superior sinus venosus', en: 'Superior sinus venosus' },
    location: { tr: 'SVC-atriyum birleşimi', en: 'SVC-atrial junction' },
    detail: { tr: 'Gerçek septum dışındadır. Sağ üst pulmoner venin parsiyel anormal bağlantısı sıklıkla eşlik eder.', en: 'Outside the true septum. Partial anomalous connection of the right upper pulmonary vein commonly accompanies it.' },
    source: atrialSource,
  },
  {
    id: 'asd-sinus-inferior', family: 'asd', code: 'SV inf.',
    title: { tr: 'İnferior sinus venosus', en: 'Inferior sinus venosus' },
    location: { tr: 'IVC-atriyum birleşimi', en: 'IVC-atrial junction' },
    detail: { tr: 'Gerçek septum dışındadır; sağ alt pulmoner venin anormal bağlantısı eşlik edebilir.', en: 'Outside the true septum; anomalous connection of the right lower pulmonary vein may coexist.' },
    source: atrialSource,
  },
  {
    id: 'asd-coronary-sinus', family: 'asd', code: 'CS',
    title: { tr: 'Koroner sinüs defekti', en: 'Coronary sinus defect' },
    location: { tr: 'Koroner sinüs-sol atriyum duvarı', en: 'Coronary sinus-left atrial wall' },
    detail: { tr: 'Çatısız koroner sinüste LA ile sinüs arasında açıklık bulunur; bağlantı RA’ya sinüs yoluyla uzanır. Fossa defekti değildir.', en: 'An unroofed coronary sinus communicates with the LA and connects to the RA through the sinus. Not a fossa defect.' },
    source: atrialSource,
  },
  {
    id: 'vsd-perimembranous', family: 'vsd', code: 'Perim.',
    title: { tr: 'Santral perimembranöz VSD', en: 'Central perimembranous VSD' },
    location: { tr: 'Membranöz septum komşuluğu', en: 'Membranous septal region' },
    detail: { tr: 'Posteroinferior sınır fibrözdür; tipik olarak aort ve triküspit kapakların fibröz devamlılığına komşudur.', en: 'Its posteroinferior rim is fibrous, typically adjoining aortic-tricuspid fibrous continuity.' },
    source: ventricularSource,
  },
  {
    id: 'vsd-muscular', family: 'vsd', code: 'Musc.',
    title: { tr: 'Trabeküler müsküler VSD', en: 'Trabecular muscular VSD' },
    location: { tr: 'Trabeküler septum', en: 'Trabecular septum' },
    detail: { tr: 'Çevresi tamamen kastır. Orta septal, apikal veya çoklu açıklıklar olabilir; burada tek örnek gösterilir.', en: 'Entirely muscular borders. Sites include midseptal and apical regions; multiple defects can occur. One example is shown.' },
    source: ventricularSource,
  },
  {
    id: 'vsd-inlet', family: 'vsd', code: 'Inlet',
    title: { tr: 'Giriş tipi VSD', en: 'Inlet VSD' },
    location: { tr: 'AV kapakların altında RV girişi', en: 'RV inlet beneath the AV valves' },
    detail: { tr: 'Müsküler veya perimembranöz olabilir. Ortak AV bileşkeli AVSD’nin ventriküler bileşeni ayrı sınıflanır.', en: 'May have muscular or perimembranous borders. The ventricular component of AVSD with a common AV junction is classified separately.' },
    source: ventricularSource,
  },
  {
    id: 'vsd-outlet', family: 'vsd', code: 'Outlet',
    title: { tr: 'Çıkış tipi VSD', en: 'Outlet VSD' },
    location: { tr: 'Sağ ventrikül çıkım yolu', en: 'Right ventricular outflow tract' },
    detail: { tr: 'Müsküler, perimembranöz veya çift arteriyel komşuluklu juxta-arteriyel alt tipler içerir; yalnız subarteriyel defekt demek değildir.', en: 'Includes muscular, perimembranous and doubly committed juxta-arterial subtypes; not synonymous with a subarterial defect.' },
    source: ventricularSource,
  },
];

export const DEFECT_COPY = {
  tr: {
    title: 'ASD & VSD',
    intro: 'Atriyal iletişimlerin ve ventriküler septal defektlerin tipik konumlarını karşılaştırın.',
    schematic: 'Sağlam atlas üzerinde anatomik konum şemasıdır; gerçek doğumsal defekt geometrisi değildir.',
    flowNote: 'Şant genellikle soldan sağadır; basınçlar ve damar dirençlerine göre çift yönlü olabilir veya tersine dönebilir. Akım simülasyonu değildir.',
    pfoNote: 'PFO, örtüşen septal dokular arasındaki kapaklı geçittir; secundum ASD ile aynı değildir.',
  },
  en: {
    title: 'ASD & VSD',
    intro: 'Compare typical sites of interatrial communications and ventricular septal defects.',
    schematic: 'Anatomical site schematic on an intact atlas, not an actual congenital defect mesh.',
    flowNote: 'Shunting is usually left to right; pressures and vascular resistance can make it bidirectional or reversed. This is not a flow simulation.',
    pfoNote: 'A PFO is a flap-like passage between overlapping septal tissues, not a secundum ASD.',
  },
};
