const atrialSource = {
  title: 'Naqvi et al. (2018): Anatomy of the atrial septum and interatrial communications',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6174145/',
};
const atrialReview = {
  title: 'Geva, Martins & Wald (2014): Atrial septal defects, Lancet',
  url: 'https://doi.org/10.1016/S0140-6736(13)62145-5',
};
const ventricularSource = {
  title: 'Lopez et al. (2018): ISNPCHD ventricular septal defect classification',
  url: 'https://ipccc.net/wp-content/uploads/2024/01/2018-11-ANNALS-Lopez-2018-VSD-Classification.pdf',
};
const ventricularReview = {
  title: 'Penny & Vick (2011): Ventricular septal defect, Lancet',
  url: 'https://doi.org/10.1016/S0140-6736(10)61339-6',
};
const ventricularImaging = {
  title: 'Fusco et al. (2022): Imaging of ventricular septal defect',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11658130/',
};

/**
 * Nine teaching categories. `mark` is the short code shared by the 3D site
 * label and the 2D map. Clinical fields are qualitative summaries of the
 * cited reviews, not patient data.
 */
export const DEFECT_TYPES = [
  {
    id: 'asd-secundum', family: 'asd', code: 'Secundum', mark: 'II',
    title: { tr: 'Ostium secundum ASD', en: 'Ostium secundum ASD' },
    location: { tr: 'Fossa ovalis', en: 'Oval fossa' },
    detail: { tr: 'Fossa ovalis tabanındaki (septum primum) doku eksikliğidir; gerçek atriyal septum içindedir. Genellikle kaval venler, pulmoner venler, koroner sinüs veya AV kapaklarla devamlılık göstermez.', en: 'Tissue deficiency in the oval fossa floor (septum primum), within the true atrial septum. Usually not confluent with the caval veins, pulmonary veins, coronary sinus or AV valves.' },
    prevalence: { tr: 'En sık ASD tipi; PFO dışında atriyal düzey şantın en yaygın nedeni. Çap birkaç mm ile 2–3 cm arasında değişir.', en: 'The commonest ASD and, apart from PFO, the commonest cause of an atrial-level shunt. Size ranges from a few millimetres to 2–3 cm.' },
    associations: { tr: 'Çoğunlukla izole. Büyük defektlerde septum primum belirgin eksik olabilir; küçük defektler (≤4 mm) sıklıkla kendiliğinden küçülür veya kapanır.', en: 'Mostly isolated. Large defects often show marked septum primum deficiency; small defects (≤4 mm) frequently shrink or close spontaneously.' },
    conduction: { tr: 'İleti aksı normal konumdadır; defekt AV düğümden uzaktır.', en: 'The conduction axis is normally positioned; the defect is remote from the AV node.' },
    closure: { tr: 'Kateterle cihaz kapatma ilk seçenek olabilir: cihazı tutacak yeterli rimler, en geniş çap yaklaşık ≤36–40 mm, AV kapak ve ven drenajına engel olmama. Uygun değilse cerrahi.', en: 'Transcatheter device closure is often first choice: adequate rims to anchor the device, maximal diameter roughly ≤36–40 mm, no interference with AV valves or venous drainage. Otherwise surgery.' },
    source: atrialSource, references: [atrialReview],
  },
  {
    id: 'asd-primum', family: 'asd', code: 'Primum', mark: 'I',
    title: { tr: 'Ostium primum (parsiyel AVSD)', en: 'Ostium primum (partial AVSD)' },
    location: { tr: 'Fossa ovalisin anteroinferior kenarı ile AV kapaklar arası', en: 'Between the anteroinferior fossa margin and the AV valves' },
    detail: { tr: 'Ortak atriyoventriküler bileşkeli AVSD spektrumundadır; gerçek septum dışındadır. Tek AV orifis, ventriküler septum krestine yapışan kapak dokusuyla iki anülüse ayrılır.', en: 'Part of the AVSD spectrum with a common atrioventricular junction; outside the true septum. A common AV orifice is divided into two annuli by valve tissue adherent to the ventricular septal crest.' },
    prevalence: { tr: 'AVSD spektrumunun parsiyel formu; trizomi 21 ile güçlü ilişki.', en: 'The partial form of the AVSD spectrum; strongly associated with trisomy 21.' },
    associations: { tr: 'Sol AV kapakta (anterior mitral yaprakçık) kleft hemen daima vardır; sol AV kapak yetersizliği eşlik eder.', en: 'A cleft in the left AV valve (anterior mitral leaflet) is almost always present, with left AV valve regurgitation.' },
    conduction: { tr: 'AV düğüm ve His demeti posteroinferiora yer değiştirmiştir; yama dikişi sırasında blok riski.', en: 'The AV node and His bundle are displaced posteroinferiorly; risk of heart block during patch suturing.' },
    closure: { tr: 'Cerrahi: yama kapatma ve kleft onarımı. Cihazla kapatma uygun değildir.', en: 'Surgical: patch closure with cleft repair. Not suitable for device closure.' },
    source: atrialSource, references: [atrialReview],
  },
  {
    id: 'asd-sinus-superior', family: 'asd', code: 'SV sup.', mark: 'SV↑',
    title: { tr: 'Superior sinus venosus defekti', en: 'Superior sinus venosus defect' },
    location: { tr: 'SVC-RA bileşkesi, fossanın posterosuperioru', en: 'SVC-RA junction, posterosuperior to the fossa' },
    detail: { tr: 'Gerçek septum dışındadır: sağ üst pulmoner ven ile SVC’nin kardiyak ucunu ayıran doku eksiktir; SVC septum üzerine "biner".', en: 'Outside the true septum: deficiency of the tissue separating the right upper pulmonary vein from the cardiac end of the SVC, so the SVC overrides the septum.' },
    prevalence: { tr: 'Sinus venosus defektleri ASD’lerin yaklaşık %4–11’i; bunların ~%87’si SVC tipidir.', en: 'Sinus venosus defects are about 4–11% of ASDs; roughly 87% are the SVC type.' },
    associations: { tr: 'Sağ üst pulmoner venin SVC/RA’ya parsiyel anormal bağlantısı tipiktir.', en: 'Partial anomalous connection of the right upper pulmonary vein to the SVC/RA is typical.' },
    conduction: { tr: 'İleti aksı normal; SA düğüm SVC-RA bileşkesinde defekte komşudur (cerrahi sonrası sinüs düğümü disfonksiyonu riski).', en: 'Normal conduction axis; the SA node lies beside the defect at the SVC-RA junction (risk of postoperative sinus node dysfunction).' },
    closure: { tr: 'Cerrahi: yama ile pulmoner venler LA’ya yönlendirilir, gerekirse SVC translokasyonu (Warden).', en: 'Surgical: patch baffling of the pulmonary veins to the LA, with SVC translocation (Warden) when needed.' },
    source: atrialSource, references: [atrialReview],
  },
  {
    id: 'asd-sinus-inferior', family: 'asd', code: 'SV inf.', mark: 'SV↓',
    title: { tr: 'İnferior sinus venosus defekti', en: 'Inferior sinus venosus defect' },
    location: { tr: 'IVC-RA bileşkesinin hemen üstü, posteroinferior duvar', en: 'Just above the IVC-RA junction, posteroinferior wall' },
    detail: { tr: 'Gerçek septum dışındadır; IVC ağzı fossanın altında septum üzerine biner. Eustachian valf ile karışabilir.', en: 'Outside the true septum; the IVC mouth overrides the septum below the fossa. Can be confused with the Eustachian valve.' },
    prevalence: { tr: 'Sinus venosus defektlerinin nadir alt tipidir.', en: 'The rare subtype of sinus venosus defect.' },
    associations: { tr: 'Sağ alt ve orta pulmoner venlerin anormal bağlantısı eşlik edebilir.', en: 'Anomalous connection of the right lower and middle pulmonary veins may coexist.' },
    conduction: { tr: 'İleti aksı normal konumdadır.', en: 'The conduction axis is normally positioned.' },
    closure: { tr: 'Cerrahi yama kapatma; IVC akımı RA’ya, pulmoner venler LA’ya yönlendirilir.', en: 'Surgical patch closure, directing IVC flow to the RA and the pulmonary veins to the LA.' },
    source: atrialSource, references: [atrialReview],
  },
  {
    id: 'asd-coronary-sinus', family: 'asd', code: 'CS', mark: 'CS',
    title: { tr: 'Koroner sinüs defekti', en: 'Coronary sinus defect' },
    location: { tr: 'Koroner sinüs ile LA arasındaki duvar (çatı), ostiyuma yakın', en: 'Wall (roof) between the coronary sinus and LA, near the ostium' },
    detail: { tr: 'Çatısız koroner sinüste sinüs ile LA arasındaki doku kısmen veya tamamen eksiktir; şant defekt ve koroner sinüs ostiyumu üzerinden RA’ya ulaşır. Fossa defekti değildir.', en: 'In an unroofed coronary sinus the tissue between sinus and LA is partly or wholly absent; the shunt reaches the RA through the defect and the coronary sinus orifice. Not a fossa defect.' },
    prevalence: { tr: 'En nadir atriyal iletişim.', en: 'The rarest interatrial communication.' },
    associations: { tr: 'Persistan sol SVC ile birlikteliği Raghib sendromu olarak adlandırılır; desatürasyon görülebilir.', en: 'Association with a persistent left SVC is termed Raghib syndrome; desaturation may occur.' },
    conduction: { tr: 'AV düğüm Koch üçgeninde CS ostiyumuna komşudur; onarımda dikkat gerekir.', en: 'The AV node lies in Koch’s triangle adjacent to the CS ostium; care is needed at repair.' },
    closure: { tr: 'Cerrahi: çatı yeniden oluşturulur veya ostiyum LA’ya dahil edilerek kapatılır.', en: 'Surgical: the roof is reconstructed or the ostium is closed and committed to the LA.' },
    source: atrialSource, references: [atrialReview],
  },
  {
    id: 'vsd-perimembranous', family: 'vsd', code: 'Perim.', mark: 'PM',
    title: { tr: 'Santral perimembranöz VSD', en: 'Central perimembranous VSD' },
    location: { tr: 'Membranöz septum; aort ve triküspit kapak fibröz devamlılığı', en: 'Membranous septum; aortic-tricuspid fibrous continuity' },
    detail: { tr: 'Posteroinferior kenarı fibrözdür (aort-triküspit devamlılığı). RV tarafında septal triküspit yaprakçığın altında, LV tarafında aort kapağının hemen altındadır; girişe veya çıkışa doğru uzanabilir.', en: 'Its posteroinferior rim is fibrous (aortic-tricuspid continuity). It lies beneath the septal tricuspid leaflet on the RV side and just below the aortic valve on the LV side; it may extend toward the inlet or outlet.' },
    prevalence: { tr: 'VSD’lerin yaklaşık %80’i; en sık tip.', en: 'About 80% of VSDs; the commonest type.' },
    associations: { tr: 'Septal triküspit dokusuyla kısmi kapanma (anevrizmatik doku), sağ koroner küspis prolapsusu ve aort yetersizliği, çift odacıklı RV.', en: 'Partial closure by septal tricuspid tissue (aneurysmal tissue), right coronary cusp prolapse with aortic regurgitation, double-chambered RV.' },
    conduction: { tr: 'His demeti defektin posteroinferior kenarında seyreder; dikiş veya cihaz bu kenarda blok yapabilir.', en: 'The His bundle runs along the posteroinferior rim; sutures or a device on that rim can cause heart block.' },
    closure: { tr: 'Cerrahi yama (transatriyal) standarttır; seçilmiş olgularda cihaz kapatma, blok riski nedeniyle ihtiyatla.', en: 'Transatrial surgical patch is standard; device closure in selected cases, with caution because of heart block risk.' },
    source: ventricularSource, references: [ventricularReview, ventricularImaging],
  },
  {
    id: 'vsd-muscular', family: 'vsd', code: 'Musc.', mark: 'M',
    title: { tr: 'Trabeküler müsküler VSD', en: 'Trabecular muscular VSD' },
    location: { tr: 'Trabeküler septum (orta, apikal, anterior veya posterior)', en: 'Trabecular septum (mid, apical, anterior or posterior)' },
    detail: { tr: 'Çevresi tamamen kastır. Orta septal, apikal veya çoklu ("İsviçre peyniri") açıklıklar olabilir; burada tek örnek gösterilir.', en: 'Entirely muscular borders. Sites include midseptal and apical regions; multiple ("Swiss cheese") defects can occur. One example is shown.' },
    prevalence: { tr: 'VSD’lerin yaklaşık %5–20’si; en sık kendiliğinden kapanan tip (çoğu 2 yaşa kadar).', en: 'About 5–20% of VSDs; the type that most often closes spontaneously (mostly by 2 years).' },
    associations: { tr: 'Çoklu defektler; apikal yerleşimde RV trabekülleri arasında gizlenebilir.', en: 'Multiple defects; apical ones can hide among RV trabeculations.' },
    conduction: { tr: 'İleti aksından uzaktır; blok riski düşüktür.', en: 'Remote from the conduction axis; low risk of heart block.' },
    closure: { tr: 'Küçükse izlem. Kapatma gerekirse cihazla (özellikle orta ve apikal) veya cerrahi; apikal çoklu defektler cerrahi için zordur.', en: 'Observation if small. When closure is needed: device (especially mid and apical) or surgery; multiple apical defects are surgically difficult.' },
    source: ventricularSource, references: [ventricularReview, ventricularImaging],
  },
  {
    id: 'vsd-inlet', family: 'vsd', code: 'Inlet', mark: 'IN',
    title: { tr: 'Giriş (inlet) tipi VSD', en: 'Inlet VSD' },
    location: { tr: 'Septal triküspit yaprakçığın altı, posteroinferior septum', en: 'Beneath the septal tricuspid leaflet, posteroinferior septum' },
    detail: { tr: 'RV girişine açılır. Kenarları müsküler veya perimembranöz olabilir. Ortak AV bileşkeli AVSD’nin ventriküler bileşeni ayrı sınıflanır.', en: 'Opens into the RV inlet. Borders may be muscular or perimembranous. The ventricular component of AVSD with a common AV junction is classified separately.' },
    prevalence: { tr: 'İzole inlet defektleri nadirdir; girişe açılan defektlerin çoğu AVSD bileşenidir.', en: 'Isolated inlet defects are uncommon; most inlet communications are components of AVSD.' },
    associations: { tr: 'AV kapağın ata biner (straddling) kordaları; AVSD spektrumu.', en: 'Straddling AV valve chords; the AVSD spectrum.' },
    conduction: { tr: 'Müsküler inlet: aks anterosuperior kenardadır. Perimembranöz uzanımlı inlet: aks posteroinferior kenardadır.', en: 'Muscular inlet: the axis lies on the anterosuperior rim. Inlet with perimembranous extension: the axis lies on the posteroinferior rim.' },
    closure: { tr: 'Cerrahi (transatriyal) yama kapatma; cihaz kapatma triküspit komşuluğu nedeniyle genellikle uygun değildir.', en: 'Transatrial surgical patch closure; device closure is usually unsuitable because of tricuspid proximity.' },
    source: ventricularSource, references: [ventricularReview, ventricularImaging],
  },
  {
    id: 'vsd-outlet', family: 'vsd', code: 'Outlet', mark: 'OUT',
    title: { tr: 'Çıkış (outlet) tipi VSD', en: 'Outlet VSD' },
    location: { tr: 'İnfundibüler septum, pulmoner kapağın altı', en: 'Infundibular septum, beneath the pulmonary valve' },
    detail: { tr: 'RV çıkım yoluna açılır. Müsküler, perimembranöz veya çift arteriyel komşuluklu juxta-arteriyel (DCJA) alt tipleri vardır; DCJA’da tavan aort-pulmoner fibröz devamlılığıdır.', en: 'Opens into the RV outflow tract. Subtypes are muscular, perimembranous and doubly committed juxta-arterial (DCJA); in DCJA the roof is aortic-pulmonary fibrous continuity.' },
    prevalence: { tr: 'DCJA tipi Batı’da VSD’lerin ~%5–7’si, Doğu Asya’da %30’a kadar.', en: 'The DCJA type is ~5–7% of VSDs in the West and up to 30% in East Asia.' },
    associations: { tr: 'Sağ koroner küspis prolapsusu; DCJA’da %50’ye varan aort yetersizliği. Çift odacıklı RV.', en: 'Right coronary cusp prolapse; aortic regurgitation in up to 50% of DCJA defects. Double-chambered RV.' },
    conduction: { tr: 'Posteroinferior kenar müskülerse aks uzaktır; perimembranöz uzanımda His demeti kenara yaklaşır.', en: 'With a muscular posteroinferior rim the axis is remote; with perimembranous extension the His bundle approaches the rim.' },
    closure: { tr: 'Cerrahi (transpulmoner veya transatriyal); küspis prolapsusu başlamadan erken kapatma. Cihaz semilunar kapak komşuluğu nedeniyle genellikle uygun değildir.', en: 'Surgical (transpulmonary or transatrial), ideally before cusp prolapse develops. Device closure is usually unsuitable because of semilunar valve proximity.' },
    source: ventricularSource, references: [ventricularReview, ventricularImaging],
  },
];

export const DEFECT_COPY = {
  tr: {
    title: 'ASD & VSD',
    intro: 'Atriyal iletişimlerin ve ventriküler septal defektlerin tipik konumlarını karşılaştırın.',
    schematic: 'Sağlam atlas üzerinde anatomik konum şemasıdır; gerçek doğumsal defekt geometrisi değildir.',
    flowNote: 'Şant genellikle soldan sağadır; basınçlar ve damar dirençlerine göre çift yönlü olabilir veya tersine dönebilir. Akım simülasyonu değildir.',
    pfoNote: 'PFO, örtüşen septal dokular arasındaki kapaklı geçittir; secundum ASD ile aynı değildir.',
    avsdNote: 'Ortak AV bileşkeli tam AVSD ayrı bir kategoridir; burada yalnız parsiyel formun atriyal bileşeni gösterilir.',
  },
  en: {
    title: 'ASD & VSD',
    intro: 'Compare typical sites of interatrial communications and ventricular septal defects.',
    schematic: 'Anatomical site schematic on an intact atlas, not an actual congenital defect mesh.',
    flowNote: 'Shunting is usually left to right; pressures and vascular resistance can make it bidirectional or reversed. This is not a flow simulation.',
    pfoNote: 'A PFO is a flap-like passage between overlapping septal tissues, not a secundum ASD.',
    avsdNote: 'Complete AVSD with a common AV junction is a separate category; only the atrial component of the partial form is shown here.',
  },
};
