import json

with open('research/ecg-anatomy/jacc_figures_verified.json') as f:
    figs = json.load(f)

meta = {
  "title": {
    "tr": "Girişimlerin Güvenliğini Artırmak İçin Kardiyak Anatomi ve Görüntülemeyi Anlamak",
    "en": "Understanding Cardiac Anatomy and Imaging to Improve Safety of Procedures"
  },
  "subtitle": {
    "tr": "12 Derivasyonlu Elektrokardiyografik Anatomi",
    "en": "12-Lead Electrocardiographic Anatomy"
  },
  "journal": "JACC: Case Reports",
  "section": "The Four Corners: “Da Vinci” Anatomy Corner",
  "doi": "10.1016/j.jaccas.2025.105998",
  "doiUrl": "https://doi.org/10.1016/j.jaccas.2025.105998",
  "pmid": "41204941",
  "pmcid": "PMC12833672",
  "year": 2026,
  "volume": 31,
  "issue": 1,
  "articleNumber": "105998",
  "authors": [
    { "name": "Emersyn P. Bradfield", "affiliation": "UCLA" },
    { "name": "Mark Rimmer, MS", "affiliation": "UCLA" },
    { "name": "Yuichiro Miyazaki, MD, PhD", "affiliation": "UCLA" },
    { "name": "Peter Hanna, MD, PhD", "affiliation": "UCLA" },
    { "name": "Justin H. Hayase, MD", "affiliation": "UCLA" },
    { "name": "Duc H. Do, MD, MS", "affiliation": "UCLA" },
    { "name": "Shili Xu, PhD", "affiliation": "UCLA" },
    { "name": "Shintaro Yamagami, MD", "affiliation": "Tenri Hospital" },
    { "name": "Kalyanam Shivkumar, MD, PhD", "affiliation": "UCLA" },
    { "name": "Shumpei Mori, MD, PhD", "affiliation": "UCLA", "corresponding": True }
  ],
  "affiliations": {
    "tr": "David Geffen School of Medicine at UCLA, Los Angeles, California, ABD; Tenri Hospital Kardiyoloji Bölümü, Nara, Japonya.",
    "en": "David Geffen School of Medicine at UCLA, Los Angeles, California, USA; Department of Cardiology, Tenri Hospital, Nara, Japan."
  },
  "takeHomeMessages": [
    {
      "tr": "Kardiyak yapılar ile her bir elektrot arasındaki 3B uzaysal ilişkilerin kapsamlı bir şekilde anlaşılması, 12 derivasyonlu EKG'yi doğru okumanın temel şartıdır.",
      "en": "A comprehensive understanding of the 3D relationships between the cardiac structures and each electrode is fundamental to reading 12-lead ECGs."
    },
    {
      "tr": "12 derivasyonlu EKG'nin mantıksal yorumlanması için kalbi elde tutulan pozisyona (Valentine) göre değil, göğüs içindeki in situ anatomik terminolojiye göre değerlendirmek zorunludur.",
      "en": "Applying the concept of anatomical nomenclature is essential for logical interpretation of the 12-lead ECG."
    },
    {
      "tr": "Cabrera sekansı / formatı (-aVR kullanımı ile 30° panoramik ardışıklık), ekstremite derivasyonlarındaki bulguların sezgisel ve anatomik olarak kavranmasında standart düzene göre çok üstündür.",
      "en": "The Cabrera sequence/format applied is useful for intuitive, anatomical comprehension of the findings in the limb leads."
    }
  ],
  "introduction": {
    "tr": "İnsan elektrokardiyogramı ilk olarak 1902'de Willem Einthoven tarafından kaydedildi. Kaydettiği P-QRS-T dalga kompleksinin altında yatan mekanizma, Sunao Tawara (Tahara) tarafından 1906'da ortaya konan anatomik ve fizyolojik içgörülere atıfta bulunan 1908 tarihli yayınında daha da aydınlatıldı. Modern 12 derivasyonlu elektrokardiyografi daha sonra 1934'te Frank N. Wilson tarafından kuruldu. 12 derivasyonlu EKG, kalbin elektriksel yayılımını yansıtır. Bu nedenle uyarının 3 boyutlu yerel yayılımının yanı sıra kalbin çoklu bölgelerinde eşzamanlı meydana gelen elektriksel kuvvetlerin toplamı ve iptali (cancellation) anlaşılmalıdır. Bu fizyolojik özellikler; kalbin konumu, şekli, ileti sistemi ve çevre dokular (akciğerler, hava, perikardiyal efüzyon) bağlamında yorumlanmalıdır.",
    "en": "The human electrocardiogram (ECG) was first recorded by Willem Einthoven in 1902. The mechanism underlying the P-QRS-T complex was further elucidated in his 1908 publication referring to anatomical and physiological insights by Sunao Tawara (Tahara) in 1906. Modern 12-lead electrocardiography was subsequently established by Frank N. Wilson in 1934. The 12-lead ECG reflects precise 3D electrical propagation, summation, and cancellation of forces taking place simultaneously across the myocardium, modulated by thoracic anatomy, lungs, fluid, and individual heart orientation."
  }
}

# Definitions of each figure with panels, tags, takeaways, and workbench links
data = {
    "fig1": {
        "num": 1,
        "title": {
            "tr": "Ekstremite Derivasyonları ile Kalp Arasındaki İlişki",
            "en": "Relationship Between the Limb Leads and the Heart"
        },
        "subtitle": {
            "tr": "Frontal düzlem anatomisi · Sagital bilgi eksikliği · Önden bakış kuralı",
            "en": "Frontal plane anatomy · No sagittal information · Anterior projection rule"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "İntakt Kalp ve Frontal Elektrotlar", "en": "Intact Heart & Frontal Electrodes"},
                "desc": {"tr": "Standart artırılmış tek kutuplu (aVR, aVL, aVF) ve çift kutuplu (I, II, III) derivasyonlar intakt kalbin ön yüzüne bindirilmiştir.", "en": "Standard augmented unipolar and bipolar limb electrodes overlaid on intact heart viewed anteriorly."}
            },
            {
                "id": "B",
                "label": {"tr": "Frontal Kesitli Kalp ve Aort Sinüsleri", "en": "Sectioned Heart & Aortic Sinuses"},
                "desc": {"tr": "Nonkoroner aort sinüsü (N), sol koroner sinüsün (L) sağında ve inferiorunda yerleşmiştir. Sagital derinlik ekstremite derivasyonlarında görülemez.", "en": "Noncoronary sinus (N) is right and inferior to left coronary sinus (L). Sagittal depth is invisible in limb leads."}
            }
        ],
        "takeaway": {
            "tr": "Ekstremite derivasyonları tamamen frontal düzlemle ilgilidir; dikey (üst/alt) ve yatay (sağ/sol) bilgi verir, sagital (ön/arka) bilgi VEREMEZ. Bu nedenle yapılar her zaman önden bakışla projelendirilmelidir.",
            "en": "Limb leads are all about frontal plane anatomy (superior/inferior and right/left). They cannot provide sagittal (anterior/posterior) information; structures must be projected and described on anterior views."
        },
        "caption": {
            "en": figs["fig1"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Standart artırılmış tek kutuplu (aVR, aVL, aVF) ve çift kutuplu (I, II, III) ekstremite elektrotları, önden (anterior) bakış açısıyla intakt (A) ve kesitli (B) kalbin üzerine bindirilmiştir. Ekstremite derivasyonları tamamen frontal düzlem anatomisi ile ilgilidir ve dikey (süperior veya inferior) ve yatay (sağ veya sol) uzaysal bilgi sağlar. Sagital (anterior veya posterior) yön hakkında uzaysal bilgi sağlayamazlar. Bu nedenle, ekstremite derivasyonlarını yorumlamak için, incelenen yapılar her zaman önden görüntülenmeli ve bu frontal düzlem görüntüleri üzerine projelendirilerek tanımlanmalıdır. Örneğin, nonkoroner aortik sinüs (N), sol koroner aortik sinüsün (L) sağında ve inferiorunda yer alan yapı olarak tanımlanabilir. Ardından, ilgilenilen yapının her bir P dalgası ve QRS dalgası morfolojisi, sırasıyla her bir atriyal veya ventriküler kitle bağlamında her bir elektrotla uzaysal ilişki içinde düşünülmelidir (Şekil 9)."
        },
        "workbench": {"tab": "cabrera", "cabreraMode": "cabrera", "cameraView": "anterior", "scenario": "rvot_shift"},
        "tags": ["limb", "frontal", "axis", "einthoven"]
    },
    "fig2": {
        "num": 2,
        "title": {
            "tr": "Ekstremite Derivasyonlarındaki Korelatif Değişimler",
            "en": "Correlative Changes in the Limb Leads"
        },
        "subtitle": {
            "tr": "RVOT PVC odak kayması · I, II, III, aVR, aVL eşzamanlı kuralı",
            "en": "RVOT PVC focal shift · Linked I, II, III, aVR, aVL structural rule"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "RVOT Serbest Duvar Odakları", "en": "RVOT Free Wall Foci"},
                "desc": {"tr": "PVC odağının posterolateral serbest duvardan (sarı yıldız) mediyal serbest duvara (kırmızı yıldız) sağdan sola hareketi.", "en": "PVC focus shift from posterolateral free wall (yellow) to medial free wall (red) of RVOT."}
            },
            {
                "id": "B-C",
                "label": {"tr": "Korelatif EKG Dalga Değişimleri", "en": "Correlative Lead Waveforms"},
                "desc": {"tr": "I'de Q artar; II'de R azalır; III'te R artar; aVR'de Q azalır; aVL'de Q artar. II/III R oranı düşer, aVR/aVL Q oranı düşer.", "en": "Q increases in I; R falls in II; R rises in III; Q falls in aVR; Q rises in aVL. II/III R ratio decreases."}
            }
        ],
        "takeaway": {
            "tr": "Ekstremite derivasyonlarındaki değişimler asla tek tek izole okunmamalıdır. Bir odaktaki sağ-sol kayma 6 derivasyonun tamamında yapısal anatomiyi yansıtan ortak bir kural dahilinde eşzamanlı değişir.",
            "en": "Changes in each limb lead should not be interpreted individually. All 6 limb leads follow a common correlative rule reflecting structural anatomy; a leftward shift simultaneously alters I, II, III, aVR, and aVL."
        },
        "caption": {
            "en": figs["fig2"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Her bir ekstremite derivasyonunda gözlenen değişiklikler, korelatif bir bakış açısı olmadan tek tek yorumlanmamalıdır. Standart 6 ekstremite derivasyonunda saptanan tüm değişiklikler, yapısal anatomiyi yansıtan ortak bir korelatif kurala uymalıdır. Örneğin, bir erken ventriküler kasılmanın (PVC) odağı sağ ventrikül çıkış yolunun (RVOT) posterolateral serbest duvarından (sarı yıldız) mediyal serbest duvarına (kırmızı yıldız) kaydığında (A), I derivasyonunda Q dalgası genliğinde bir artış gözlenir. Buna II'de R dalgası genliğinde azalma, III'te R dalgası genliğinde artış, aVR'de Q dalgası genliğinde azalma ve aVL'de Q dalgası genliğinde artış eşlik eder (B ve C); bu durum aritmojenik odağın sağdan sola hareketini ve sonuçta ortaya çıkan yayılım vektörü değişimini (sarı ve kırmızı kesikli oklar) yansıtır. Genel olarak, sola doğru bir kayma; II/III R dalgası oranında azalma (II/III Q dalgası oranında artış), aVR/aVL Q dalgası oranında azalma (aVR/aVL R dalgası oranında artış) ve I ile aVL R dalgası genliğinde azalma (I ve aVL Q dalgası genliğinde artış) eğilimi ile birliktedir (ve tersi). İlgilenilen uzaysal kayma/farklılık nedeniyle ekstremite derivasyonlarındaki korelatif değişiklikler, Cabrera sekansı/formatı kullanıldığında anatomik olarak daha sezgisel hale gelebilir (Şekil 10 ve 11)."
        },
        "workbench": {"tab": "cabrera", "cabreraMode": "cabrera", "scenario": "rvot_shift", "rvotFocus": 0.5},
        "tags": ["rvot", "pvc", "correlative", "limb-shift"]
    },
    "fig3": {
        "num": 3,
        "title": {
            "tr": "Prekordiyal Derivasyonlar ile Kalp Arasındaki İlişki",
            "en": "Relationship Between the Precordial Leads and the Heart"
        },
        "subtitle": {
            "tr": "Horizontal (aksiyel) düzlem · V1-V6 kalp ilişkisi · Sol akciğer mesafesi",
            "en": "Horizontal plane · V1-V6 cardiac relations · Left lung distance effect"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Önden Prekordiyal Projeksiyon", "en": "Anterior Precordial Projection"},
                "desc": {"tr": "V1/V2 sağ atriyal apendiks ve RVOT önünde; V3 ön interventriküler olukta; V4 apeks sol önünde yer alır.", "en": "V1/V2 anterior to RAA and RVOT; V3 in anterior groove; V4 left anterior to apex."}
            },
            {
                "id": "B-C",
                "label": {"tr": "Üstten (Aksiyel) Bakış ve Sol Akciğer", "en": "Superior View & Left Lung"},
                "desc": {"tr": "Prekordiyaller horizontal düzlemi (sağ-sol ve ön-arka) gösterir. V5 ve V6, araya giren sol akciğer dokusu nedeniyle kalbe V1-V4'e kıyasla daha uzaktır.", "en": "Precordial leads inform horizontal plane. V5-V6 distance is greater due to intervening left lung."}
            }
        ],
        "takeaway": {
            "tr": "Prekordiyal derivasyonlar öncelikle horizontal düzlemi (sağ-sol ve sagital ön-arka) bildirir ve üstten (süperior) bakış açısıyla değerlendirilmelidir. Sol akciğer V5-V6 mesafesini artırarak voltajı modüle eder.",
            "en": "Precordial leads inform horizontal (axial) plane anatomy (right/left, anterior/posterior) and must be viewed from the superior direction. Intervening left lung places V5/V6 farther from myocardium."
        },
        "caption": {
            "en": figs["fig3"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Standart prekordiyal elektrotlar, önden (A) ve üstten (B ve C) bakış açısıyla kalbin üzerine bindirilmiştir. Genel olarak V1 ve V2 sırasıyla sağ atriyal apendiks ve sağ ventrikül çıkış yolunun anteriorunda yer alır. V3, anterior interventriküler oluğun orta kısmında yer alır. V4, kardiyak apeksin sol anteriorunda yerleşmiştir. V1 ila V4 ile karşılaştırıldığında, araya giren sol akciğer nedeniyle V5 ve V6'nın kalbe olan mesafesi daha fazladır (C). Prekordiyal derivasyonlar öncelikle horizontal (aksiyel) düzlem anatomisini bildirir ve esas olarak yatay (sağ veya sol) ve sagital (anterior veya posterior) uzaysal bilgi sağlar (B ve C). Dolayısıyla, prekordiyal derivasyonları yorumlamak için incelenen yapılar üstten görüntülenmeli ve bu horizontal düzlem görüntüleri üzerine projelendirilmelidir. Örneğin, sağ koroner aortik sinüs (R), sol koroner aortik sinüsün (L) sağ anteriorunda ve nonkoroner aortik sinüsün (N) sol anteriorunda yer alan yapı olarak tanımlanabilir. Ardından, ilgilenilen yapının P ve QRS morfolojisi, atriyal veya ventriküler kitle bağlamında her bir elektrotla uzaysal ilişki içinde düşünülmelidir (Şekil 9)."
        },
        "workbench": {"tab": "heights", "cameraView": "superior", "heightPlane": "superior"},
        "tags": ["precordial", "horizontal", "lung", "axial"]
    },
    "fig4": {
        "num": 4,
        "title": {
            "tr": "Prekordiyal Derivasyonların 3 Düzlemli Yükseklik Farkı",
            "en": "Height Difference of Each Precordial Lead Demonstrated With Correlative Anatomy"
        },
        "subtitle": {
            "tr": "Tek düzlem yanılgısı · V1/V2 (süperior) · V3 (orta) · V4-V6 (inferior)",
            "en": "Single plane myth · V1/V2 (superior) · V3 (middle) · V4-V6 (inferior)"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Süperior Düzlem (V1-V2 / 4. İKB)", "en": "Superior Plane (V1-V2 / 4th ICS)"},
                "desc": {"tr": "RVOT, LVOT'un önünde; aort kökünün sol önünde, V2'nin arkasındadır. Süperolateral papiller kas (turuncu) ve R sinüsünü destekleyen ventriküler septum kresti (yeşil) bu düzlemdedir.", "en": "RVOT anterior to LVOT and left anterior to aortic root. Superolateral PM and septal crest at this level."}
            },
            {
                "id": "B",
                "label": {"tr": "İnferior Düzlem (V4-V6 / 5. İKB)", "en": "Inferior Plane (V4-V6 / 5th ICS)"},
                "desc": {"tr": "İnferomediyal papiller kas (mavi) ve LV ile RA arasındaki LV inferoseptal çıkıntısı (beyaz) inferior düzlemde yer alır.", "en": "Inferomedial PM and inferoseptal process of LV (between LV and RA) lie on this inferior plane."}
            }
        ],
        "takeaway": {
            "tr": "V1-V6 tek bir yatay düzlemde DEĞİLDİR! V1/V2 süperior (4. İKB), V3 orta (5. kosta), V4-V6 inferior (5. İKB) düzeydedir. Ventriküler taban yapıları bu yükseklik farkı bilinmeden doğru lokalize edilemez.",
            "en": "V1 through V6 are NOT on a single flat plane. They lie on three distinct heights of the ventricular mass: superior (V1/V2), middle (V3), and inferior (V4-V6). This 3D height difference is mandatory for reading precordial leads."
        },
        "caption": {
            "en": figs["fig4"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Literatürde prekordiyal derivasyonları tanımlamak için sıklıkla horizontal, iki boyutlu görüntüler kullanılsa da (Şekil 3), V1 ila V6 tek bir düz yatay düzlemde yer almaz. V1/V2 (A), V3 ve V4-V6 (B) elektrotlarını içeren horizontal düzlemler birbirinden farklıdır. Her bir düzlem, ventriküler kitlenin sırasıyla süperior, orta ve inferior seviyelerinde bulunur. Prekordiyal derivasyonları yorumlamak için bu yükseklik farkının bilinmesi şarttır. Süperior düzlemde (A), sağ ventrikül çıkış yolu sol ventrikül çıkış yolunun anteriorunda, aort kökünün sol anteriorunda ve V2'nin posteriorunda yer alır. Süperolateral papiller kas (turuncu yıldız) ve sağ koroner aort sinüsünü (R) destekleyen ventriküler septum kresti (yeşil yıldız) süperior düzlemde yer alır (A). İnferomediyal papiller kas (mavi yıldız) ve sol ventrikül ile sağ atriyum arasındaki sol ventrikül inferoseptal çıkıntısı (beyaz yıldız) inferior düzlemde yer alır (B). N = nonkoroner aort sinüsü."
        },
        "workbench": {"tab": "heights", "heightPlane": "superior", "focusSite": "summit"},
        "tags": ["heights", "3d-planes", "papillary", "septal-crest"]
    },
    "fig5": {
        "num": 5,
        "title": {
            "tr": "Prekordiyal Yükseklik Farkının Klinik Önemi: Summit ve İnferoseptal Çıkıntı",
            "en": "Importance of the Height Difference of Each Precordial Lead"
        },
        "subtitle": {
            "tr": "LV Summit (V1-V2 S baskınlığı / ani V3 geçişi) vs İnferoseptal Çıkıntı (R konkordansı)",
            "en": "LV Summit (V1-V2 S dominance / abrupt V3 transition) vs Inferoseptal Process (R concordance)"
        },
        "panels": [
            {
                "id": "A-B",
                "label": {"tr": "Sanal Aşamalı Diseksiyon", "en": "Virtual Progressive Dissection"},
                "desc": {"tr": "İzole LV miyokardında 2B bakış yükseklik farkını ayıramaz; ancak LV summit süperior düzlemde (V1-V2 hizası), inferoseptal çıkıntı ise inferior düzlemdedir (V4-V6 hizası).", "en": "2D view cannot distinguish height, but summit is on superior plane (V1/V2) and inferoseptal process on inferior plane (V4-V6)."}
            },
            {
                "id": "C",
                "label": {"tr": "LV Summit Aritmisi EKG'si", "en": "LV Summit Arrhythmia ECG"},
                "desc": {"tr": "İnferior aksın yanında V1 ve V2'de S dalgası baskınlığı ('ani V3 geçişi') görülür; çünkü odak düzlem içinde V1 ve V2 elektrotlarına çok yakındır.", "en": "Shows S-wave dominance in V1-V2 ('abrupt V3 transition') because the summit focus is close to V1-V2 in plane."}
            },
            {
                "id": "D",
                "label": {"tr": "İnferoseptal Çıkıntı Aritmisi EKG'si", "en": "Inferoseptal Process Arrhythmia ECG"},
                "desc": {"tr": "V1-V6 boyunca pozitif R dalgası konkordansı ve süperior aks görülür; çünkü bölge tüm V1-V6 elektrotlarından uzaktadır.", "en": "Demonstrates R-wave concordance throughout V1-V6 with superior axis, as it is distant from all precordial leads."}
            }
        ],
        "takeaway": {
            "tr": "Prekordiyal elektrotlar yükseklik farkları sayesinde dikey (süperior-inferior) bilgi sağlar. Bu nedenle sol ventrikül tabanı/ostiyumu kaynaklı tüm aritmiler R konkordansı göstermez; süperior düzlemdeki LV Summit S baskınlığı ve ani V3 geçişi verir!",
            "en": "Precordial leads provide vertical spatial information via height differences. Basal LV arrhythmias do NOT all show R concordance: superior plane LV summit shows S dominance in V1-V2, whereas inferior plane inferoseptal process shows R concordance."
        },
        "caption": {
            "en": figs["fig5"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Ekstremite inferior derivasyonları kadar sezgisel olmasa da, prekordiyal derivasyonlar yükseklik farkları nedeniyle dikey (süperior veya inferior) yön hakkında bir dereceye kadar uzaysal bilgi sağlayabilir. Örneğin, sanal aşamalı diseksiyon, diğer yapıları (aort kökü, sağ ventrikül, atriyumlar, koroner damarlar ve toraks dahil) (A)'dan çıkarıp üstten görüntüleyerek izole sol ventrikül miyokardını (B) gösterir. Bu tür geleneksel iki boyutlu, horizontal düzlem görüntüleri, her bir prekordiyal derivasyonun yüksekliğini incelenen her bir yapının yüksekliğinden ayırt edemez. Ancak, sağ koroner aortik sinüse (R) komşu sol ventrikül summit'inin (yeşil yıldız) septal ve aortik kenarları gerçekte V1 ve V2 seviyesindeki süperior düzlemde yer alır; sol ventrikülün inferoseptal çıkıntısı (beyaz yıldiz) ise V4 ila V6 seviyesindeki inferior düzlemde yer alır (Şekil 4). Bu nedenle, inferior aksa ek olarak, sol ventrikül summit'inin septal ve aortik kenarlarından köken alan ventriküler aritmiler, odak düzlem içinde V1 ve V2'ye yaklaştıkça V1 ve V2 elektrotlarında genellikle S dalgası baskınlığı gösterir (C; buna ani V3 geçişi de denir). Öte yandan, inferoseptal çıkıntıdan köken alan ventriküler aritmiler, bölge tüm V1-V6 derivasyonlarına uzak olduğundan, genellikle süperior aks ile birlikte V1-V6 boyunca R dalgası konkordansı gösterir (D). Dolayısıyla, sol ventrikül tabanından, yani sol ventrikül ostiyumundan köken alan ventriküler aritmilerin prekordiyal derivasyonlarda mutlaka R dalgası konkordansı göstermesi gerekmez. L = sol koroner aortik sinüs; N = nonkoroner aortik sinüs."
        },
        "workbench": {"tab": "heights", "heightPlane": "superior", "focusSite": "summit"},
        "tags": ["summit", "inferoseptal", "concordance", "v3-transition"]
    },
    "fig6": {
        "num": 6,
        "title": {
            "tr": "Sabit Prekordiyal Elektrotlar ile Değişken Kalp Anatomisi",
            "en": "Variable Relationship Between the Fixed Precordial Leads and the Heart"
        },
        "subtitle": {
            "tr": "Bireysel anatomik varyasyon · Kosta anomalileri · PVC geçiş zonu kayması",
            "en": "Individual variations · Rib count variations · Transition zone shift for identical PVC"
        },
        "panels": [
            {
                "id": "A-C",
                "label": {"tr": "Kalp–Toraks İlişkisi Varyasyonları", "en": "Heart-Thorax Relations"},
                "desc": {"tr": "Elektrotlar 4. ve 5. İKB'ye sabit konur; ancak kalbin ventriküler kitlesine göre rölatif konumu inferior (A), aynı seviyede (B) veya süperior (C) olabilir. Sternuma bağlanan kosta sayısı da genelde 7, nadiren 6 veya 8'dir.", "en": "Electrodes fixed at 4th/5th ICS, but relative position can be inferior (A), level (B), or superior (C). Sternum rib attachments can be 6, 7, or 8."}
            },
            {
                "id": "D",
                "label": {"tr": "Aynı PVC'de Elektrot Kaymasının Etkisi", "en": "Same PVC at Different Lead Heights"},
                "desc": {"tr": "Aynı monofokal PVC 2 kaburga yukarıdan 1 kaburga aşağıya kaydedildiğinde, R dalgası progresyonu ve geçiş zonu V6'dan V4'e doğru kayar ve QRS morfolojisi tamamen değişir.", "en": "For identical PVC, recording from 2 ICS above to 1 ICS below shifts R progression and transition from V6 to V4."}
            }
        ],
        "takeaway": {
            "tr": "Elektrotlar göğüs kafesinde sabittir ama kalp ve toraks hareketlidir/bireyseldir. Aynı odaktan çıkan bir PVC, elektrot yüksekliği değiştiğinde geçiş zonunu V6'dan V4'e kaydırabilir. Kadınlarda meme dokusu elektrot sapmalarına yol açabilir.",
            "en": "Electrodes are fixed to intercostal landmarks while the heart and thorax vary across individuals. For the SAME focal arrhythmia, moving leads shifts the transition zone between V6 and V4. Breast tissue in women also alters placement."
        },
        "caption": {
            "en": figs["fig6"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Kalbin boyutu ve oryantasyonunda ve göğüs kafesinin şeklinde, elektrotlar ile ilgilenilen kardiyak yapılar arasındaki 3 boyutlu ilişkileri ve akciğerler gibi ekstrakardiyak doku/organ/sıvı/hava miktarını etkileyen önemli bireysel varyasyonlar vardır. Prekordiyal derivasyonların en büyük kısıtlılıklarından biri bu varyasyondur; çünkü elektrotlar her zaman 4. ve 5. interkostal aralıklara göre sabit bir konuma yerleştirilir. Sonuç olarak, kaburgalarla (üst paneller) veya kaburgalar olmadan (alt paneller) gösterilen prekordiyal elektrotların göreceli konumu, ventriküler kitleye göre inferior (A), aynı seviyede (B) veya süperior (C) olabilir. Sternuma bağlanan her iki taraf kaburga sayısının da değişken olabileceğini unutmayın; genellikle 7'dir (A ve B) ve nadiren 6 veya 8'dir (C). Prekordiyal derivasyonların kalbe karşı bu uzaysal varyasyonu, prekordiyal derivasyonlardaki elektrokardiyografik bulguları etkileyebilir. Örneğin, aynı monofokal erken ventriküler kasılma (yıldız işaretleri) farklı konumlara (2 interkostal aralık yukarıdan yaklaşık 1 interkostal aralık aşağıya) yerleştirilmiş prekordiyal derivasyonlardan kaydedildiğinde, elektrotlar aşağıya doğru hareket ettikçe V6'dan V4'e doğru geçiş zonu kayması ile birlikte R dalgası progresyonu gözlenebilir ve bu da her bir QRS dalgası görünümünü farklı kılar (D). Bu uzaysal varyasyon, özellikle meme dokusu nedeniyle prekordiyal derivasyonların yanlış yerleştirilebildiği kadınlarda da geçerlidir. Daireler için renk anahtarı: kırmızı = V1; sarı = V2; yeşil = V3; kahverengi = V4; siyah = V5; mor = V6."
        },
        "workbench": {"tab": "heights", "bodyShift": 0.3, "heightPlane": "middle"},
        "tags": ["variability", "habitus", "transition-shift", "breast-misplacement"]
    },
    "fig7": {
        "num": 7,
        "title": {
            "tr": "EKG'yi Anlamada Anatomik (Attitudinal) Terminolojinin Önemi",
            "en": "Importance of Using Anatomical Nomenclature to Understand Electrocardiograms"
        },
        "subtitle": {
            "tr": "In situ koordinatlar · Valentine yanılgısı · Sağ ventrikül anterior, sol atriyum posteriordur",
            "en": "In situ coordinates · Valentine fallacy · RV is anterior, LA is posterior"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Anatomik (Attitudinal) Koordinatlar", "en": "Attitudinal Nomenclature"},
                "desc": {"tr": "Kraniyal=süperior, kaudal=inferior, ventral=anterior, dorsal=posterior. Anterior yüzey sternokostal (RV komşu), inferior yüzey diyafragmatiktir.", "en": "Cranial=superior, caudal=inferior, ventral=anterior, dorsal=posterior. Anterior is sternocostal; inferior is diaphragmatic."}
            },
            {
                "id": "B",
                "label": {"tr": "Valentine Terminolojisi Yanılgısı", "en": "Valentine Nomenclature Fallacy"},
                "desc": {"tr": "Kalbi elinde tutan patologların apeks üzerine diktiği pozisyondur. Diyafragmatik yüze 'posterior', süperior yüze 'anterior' denmesi klinik EKG ile çelişir.", "en": "Heart standing on apex in pathologist's hand. Calling diaphragmatic surface 'posterior' creates confusion in 12-lead ECG."}
            },
            {
                "id": "C",
                "label": {"tr": "Ekokardiyografi ve EKG Çelişkisi", "en": "Echo & ECG Discrepancy"},
                "desc": {"tr": "Ekoda 'anterior' ve 'inferior' terimleri karışık kullanılır. EKG'de bu 'anterior' segment aslında inferior segmentin süperiorundadır.", "en": "Echo mixes anterior and inferior terms. In ECG, this 'anterior' LV segment is superior to the inferior segment."}
            }
        ],
        "takeaway": {
            "tr": "12 derivasyonlu EKG frontal, horizontal ve sagital düzlemlere dayanır. Bu nedenle kalbi eldeki pozisyona (Valentine) göre değil, göğüs içindeki in situ anatomik pozisyona göre düşünmek zorunludur: Sağ ventrikül anterior odacık, sol atriyum posterior odacıktır!",
            "en": "The 12-lead ECG is built on frontal, horizontal, and sagittal planes. Valentine nomenclature creates confusion. Under attitudinal nomenclature, the right ventricle is the anterior chamber and the left atrium is the posterior chamber."
        },
        "caption": {
            "en": figs["fig7"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Anatomik terminolojide (attitudinal terminoloji), kraniyal, kaudal, sağ, sol, ventral ve dorsal yönler sırasıyla süperior, inferior, sağ, sol, anterior ve posterior olarak adlandırılır (A). Tüm kalp bağlamında, her bir anterior ve inferior yüzey, sırasıyla kalbin sternokostal (sağ ventrikül serbest duvarına komşu) ve diyafragmatik yüzeylerine karşılık gelir (A ve C). 12 derivasyonlu elektrokardiyografi kavramı frontal, horizontal ve sagital düzlemlere dayandığından (Şekil 1 ila 4), bu anatomik terminolojiye dayalı yapısal anatominin anlaşılması temeldir. Ancak kardiyoloji alanında Valentine terminolojisi (non-attitudinal terminoloji) yaygın olarak kullanılmaktadır (B). Bu, çıkarılan kalpleri ellerinde tutan patologların bakış açısına dayanır. Kalp, sanki apeksi üzerinde duruyormuş gibi gösterilir (B). Ellere bakan diyafragmatik yüzey 'posterior' yön, süperior yüzey 'anterior' yön, 'sağ' ve 'sol' ise sırasıyla sağ ve sol kalp odacıkları olarak adlandırılır (A ve B). Bu terminoloji bir dereceye kadar kullanışlı ve yaygın olsa da, 12 derivasyonlu elektrokardiyogramın mantıksal yorumlanması için anatomik terminolojiyi uygulamalıyız. Örneğin, sağ ventrikül ve sol atriyum sırasıyla anterior ve posterior odacıklar olarak tanınmalıdır. Kafa karıştırıcı bir şekilde ekokardiyografide, birbirine bakan sol ventrikül segmentlerini tanımlamak için hem 'inferior' (anatomik terminoloji) hem de 'anterior' (Valentine terminolojisi) karışık bir şekilde kullanılmaktadır (eklenti, C'deki kesikli çizgi boyunca olan kesit düzlemini temsil eder). 12 derivasyonlu elektrokardiyografiyi anlamak için, sol ventrikülün bu 'anterior' segmentinin inferior segmentin süperiorunda olduğu kabul edilmelidir (C)."
        },
        "workbench": {"tab": "nomenclature", "nomenclatureTopic": "fascicles"},
        "tags": ["nomenclature", "attitudinal", "valentine", "sternocostal"]
    },
    "fig8": {
        "num": 8,
        "title": {
            "tr": "Valentine Terminolojisinin Neden Olduğu Güçlükler",
            "en": "Difficulties Caused by Using the Valentine Nomenclature"
        },
        "subtitle": {
            "tr": "Süperior fasikül bloğu · Süperolateral / inferomediyal papiller kas · Anterior/posterior dal",
            "en": "Superior fascicular block · Superolateral / inferomedial PM · Anterior/posterior bundle branches"
        },
        "panels": [
            {
                "id": "A-B",
                "label": {"tr": "Süperior Fasikül Bloğu (LAFB Çelişkisi)", "en": "Superior Fascicular Block"},
                "desc": {"tr": "'Anterior' fasikül anatomik olarak süperior fasiküldür; bloğu süperior aks sapmasını sezgisel açıklar.", "en": "Anatomical superior fascicle intuitively explains superior axis deviation when blocked."}
            },
            {
                "id": "C",
                "label": {"tr": "Papiller Kas Ventriküler Aritmileri", "en": "Papillary Muscle Arrhythmias"},
                "desc": {"tr": "Anterolateral/posteromediyal değil; süperolateral (turuncu) ve inferomediyaldir (mavi). İnferomediyal PVC V3-V6'da Q dalgası ve süperolateral aks verir.", "en": "Superolateral PM vs inferomedial PM. Inferomedial PVC exhibits Q-wave in V3-V6 due to inferior plane location."}
            },
            {
                "id": "D",
                "label": {"tr": "Sağ ve Sol Dalın Gerçek Hizalanması", "en": "True Bundle Branch Alignment"},
                "desc": {"tr": "Sağ ve sol dallar anatomik olarak anterior ve posterior dizilimdedir. Sağ dal bloğu V1'de terminal anterior sapma (R') gösterir.", "en": "Right and left bundles align anterior-posterior. RBBB produces terminal anterior force (R' in V1)."}
            }
        ],
        "takeaway": {
            "tr": "1) 'Anterior fasikül bloğu'nda neden süperior aks sapması olduğunu anatomik süperior fasikül açıklar. 2) İnferomediyal papiller kas inferior düzlemde olduğundan PVC'lerinde V3-V6'da başlangıç Q dalgası görülür. 3) Sağ dal anterior, sol dal posteriordur.",
            "en": "1) Superior fascicular block intuitively explains superior-axis deviation. 2) Inferomedial PM is on the inferior plane, producing initial Q in V3-V6. 3) RBB and LBB align anterior-posterior, explaining anterior terminal R' in V1."
        },
        "caption": {
            "en": figs["fig8"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Sol dalın Valentine terminolojisine dayanan geleneksel 'anterior/posterior fasikül' terimleri kullanıldığında, 'anterior fasikül bloğu' ortamındaki süperior aks sapmasını açıklamak zordur. Ancak, anatomik terminolojiye (A) dayanarak bunlar süperior/inferior fasikül olarak anlaşıldığında, süperior fasikül bloğu (B), ekstremite derivasyonları tarafından temsil edildiği gibi, sezgisel olarak süperior aks sapması olarak anlaşılır. Başka bir örnek, sol ventrikül papiller kasları Valentine terminolojisine dayalı olarak anterolateral ve posteromediyal olarak tanımlandığında, her bir papiller kastan köken alan bir ventriküler aritminin QRS morfolojisini tanımlamanın zor olmasıdır. Ancak, papiller kaslar anatomik terminolojiye (C) dayalı olarak süperolateral (turuncu yıldız) ve inferomediyal (mavi yıldız) olarak adlandırıldığında, her bir ventriküler aritminin her bir inferomediyal ve süperolateral aksı, ekstremite derivasyonlarında temsil edildiği gibi sezgisel olarak anlaşılabilir. İnferomediyal papiller kastan köken alan bir ventriküler aritmi, inferior düzlemde yer aldığı için (Şekil 4), süperior düzlemde yer alan ve V3-V6'da bir RS dalgası sergileyen süperolateral papiller kastan köken alan bir aritmiye kıyasla V3-V6'da bir Q dalgası sergiler. Benzer şekilde, Valentine terminolojisine dayanan sağ ve sol dal demetleri, anatomik terminolojide gerçekte anterior ve posterior bir hizalanma sergiler (D). Bu nedenle, her bir dalın bloğu, anterior göğüs derivasyonu (V1) tarafından temsil edildiği gibi, sırasıyla anterior aks ve posterior aks sapması göstermelidir. N = nonkoroner aort sinüsü; R = sağ koroner aort sinüsü."
        },
        "workbench": {"tab": "nomenclature", "nomenclatureTopic": "papillary", "focusSite": "inferomedial"},
        "tags": ["fascicles", "papillary-vt", "bundle-branches", "rbbb-v1"]
    },
    "fig9": {
        "num": 9,
        "title": {
            "tr": "Yapıların Atriyal ve Ventriküler Kitle Bağlamında Değerlendirilmesi",
            "en": "Importance of Considering Each Structure Within the Context of Each Atrial or Ventricular Mass"
        },
        "subtitle": {
            "tr": "Pulmoner ven pacemap P morfolojileri · Sağ-sol atriyal senkroni · LAA/RAA polariteleri",
            "en": "Pulmonary vein pacemap P waves · Interatrial synchrony · LAA/RAA polarities"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Atriyal Anatomik Yükseklik ve Apendiksler", "en": "Atrial Heights & Appendages"},
                "desc": {"tr": "Süperior venler (RSPV, LSPV) inferior venlere göre süperior yerleşimlidir. LAA (yeşil) aVL'de negatif P; RAA (beyaz) V1'de negatif P dalgası verir.", "en": "Superior PVs are superior to inferior PVs. LAA produces negative P in aVL; RAA produces negative P in V1."}
            },
            {
                "id": "B-C",
                "label": {"tr": "Pulmoner Ven Pacemap EKG Karşılaştırması", "en": "PV Pacemap Waveforms"},
                "desc": {"tr": "Sol venlerde P dalgası süresi daha geniştir (sağ venler septuma yakın olup erken senkroni sağlar). V1'deki pozitif P, RIPV'de RSPV'ye göre daha yüksek genliktedir.", "en": "P duration is wider in left PVs. Positive P in V1 is taller in RIPV vs RSPV due to posteroinferior location of RIPV."}
            }
        ],
        "takeaway": {
            "tr": "Atriyal yapının atriyal kitle içerisindeki göreceli konumu P morfolojisini belirler: Sol pulmoner venlerde P süresi daha geniştir; RIPV'de V1 pozitifliği RSPV'den daha yüksektir. LAA'da P dalgası aVL'de negatiftir.",
            "en": "Relative location within atrial mass dictates P morphology. Left PVs have wider P duration than right PVs. V1 positive P is taller in RIPV than RSPV. LAA pacemap shows negative P in aVL."
        },
        "caption": {
            "en": figs["fig9"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "İncelenen yapılar anatomik terminolojiye göre tanımlansa bile, her bir yapıyı atriyum veya ventriküllerde, sırasıyla her bir atriyal veya ventriküler kitle bağlamında düşünmek önemlidir. Bunun nedeni, yapının atriyal veya ventriküler kitle içindeki göreceli konumunun, sırasıyla P dalgası (C'deki ok başları) veya QRS dalgası morfolojisini yorumlamada kritik olmasıdır. Örneğin, sağ inferior pulmoner ven (RIPV; kırmızı yıldız) ve sol inferior pulmoner ven (LIPV; mavi yıldız) pacemap'lerinin P dalgası, sırasıyla sağ süperior pulmoner ven (RSPV; sarı yıldız) ve sol süperior pulmoner ven (LSPV; pembe yıldız) ile karşılaştırıldığında II derivasyonunda daha yüksek genlik sergiler; çünkü süperior pulmoner venler inferior pulmoner venlere göre süperiyordadır (A). Ek olarak, sol pulmoner venlerde P dalgası süresi daha geniştir; çünkü sağ pulmoner venler atriyal septuma komşudur ve bu sayede atriyal senkroni sağlanır. Ayrıca, V1'deki pozitif P dalgası, RSPV'de RIPV'ye kıyasla daha düşük bir genlik sergiler; bu da ikincisinin birincisine göre posteroinferior konumunu yansıtır (B). Bu gözlemler, 12 derivasyonlu elektrokardiyogramın mükemmel uzaysal çözünürlüğünü ve anatomik terminoloji bağlamında yaşayan kalbin üç boyutlu yapısal anatomisinin ayrıntılı bir şekilde anlaşılmasının önemini ortaya koymaktadır. Sol atriyal apendiks (LAA; yeşil yıldız) ve sağ atriyal apendiks (RAA; beyaz yıldiz) pacemap'leri de gösterilmiş olup, atriyal kitleye göre bu derivasyonlarla olan uzaysal ilişkilerini yansıtarak sırasıyla aVL ve V1'de P dalgasının tipik negatif defleksiyonunu sergilemektedir (A ve B)."
        },
        "workbench": {"tab": "atrial", "pvSite": "RSPV"},
        "tags": ["atrial", "pulmonary-veins", "p-wave", "appendage"]
    },
    "fig10": {
        "num": 10,
        "title": {
            "tr": "Cabrera Sıralaması / Formatı Kavramı",
            "en": "Concept of the Cabrera Sequence/Format"
        },
        "subtitle": {
            "tr": "Standart dağınıklık vs Panoramik 30° dizilim · Ters çevrilmiş aVR (-aVR)",
            "en": "Arbitrary classic order vs Panoramic 30° sequence · Vertically inverted -aVR"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Klasik Ekstremite Dizilimi (Rastgele Sıra)", "en": "Classical Presentation"},
                "desc": {"tr": "Prekordiyalin aksine standart ekstremite derivasyonları (I, II, III, aVR, aVL, aVF) anatomik ardışık sırada değildir.", "en": "Limb leads are not aligned in an anatomically consecutive fashion in standard ECG."}
            },
            {
                "id": "B",
                "label": {"tr": "Cabrera Panoramik Formatı (-aVR Dahil)", "en": "Cabrera Sequence"},
                "desc": {"tr": "aVR dikey ters çevrilerek (-aVR) 30 derecelik anatomik ardışıklık kurulur: aVL (-30°), I (0°), -aVR (+30°), II (+60°), aVF (+90°), III (+120°).", "en": "Inverted aVR (-aVR) creates consecutive 30° alignment: aVL, I, -aVR, II, aVF, III."}
            }
        ],
        "takeaway": {
            "tr": "Cabrera formatı, aVR'yi dikey ters çevirerek (-aVR) 6 ekstremite derivasyonunu anatomik olarak 30 derecelik ardışık bir sıraya (aVL → I → -aVR → II → aVF → III) koyar. RVOT PVC yayılım vektörü anında görünür hale gelir.",
            "en": "Cabrera format inverts aVR to align frontal limb leads consecutively at 30° intervals (aVL, I, -aVR, II, aVF, III). Propagation vectors of arrhythmias become immediately intuitive."
        },
        "caption": {
            "en": figs["fig10"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Prekordiyal derivasyonlarla karşılaştırıldığında, ekstremite derivasyonlarının anatomik olarak ardışık bir şekilde hizalanmamış olması gariptir (A). aVR'nin dikey olarak ters çevrilmiş bir görüntüsü kullanılarak bir -aVR derivasyonu oluşturulduğunda, ekstremite derivasyonlarını anatomik olarak ardışık bir şekilde hizalamak mümkündür (B). Bu, Cabrera sekansı/formatı olarak adlandırılır (panoramik ekran olarak da bilinir). Cabrera sekansının kullanımı ekstremite derivasyonlarının alternatif bir sunum standardı olarak önerilmiş olsa da, 1979'dan beri ulusal standart olarak benimsendiği İsveç dışında dünya çapındaki klinik uygulamalarda rutin olarak kullanılmamaktadır. Örneğin, sağ ventrikül çıkış yolunun mediyal serbest duvarından (kırmızı yıldız) köken alan bir erken ventriküler kasılmanın (Şekil 2 ve 11) QRS dalga morfolojisi, önden bakış açısıyla anatomik görüntülerle birlikte bu Cabrera sekansı/formatında görselleştirildiğinde, yayılım vektörü (kırmızı kesikli oklar) anında belirgin hale gelir. R = sağ koroner aortik sinüs."
        },
        "workbench": {"tab": "cabrera", "cabreraMode": "cabrera", "scenario": "rvot_shift", "rvotFocus": 1.0},
        "tags": ["cabrera", "panoramic", "inversion", "lead-order"]
    },
    "fig11": {
        "num": 11,
        "title": {
            "tr": "Cabrera Formatının Klinik Uygulanabilirliği ve Yararı",
            "en": "Feasibility and Utility of the Cabrera Sequence/Format"
        },
        "subtitle": {
            "tr": "VT/PVC vektörü ve geçiş zonu · Sinüs P vektörü (+58°) · İnferior STEMI komşuluğu",
            "en": "VT/PVC vector & transition zone · Sinus P vector (+58°) · Contiguous ST in ACS"
        },
        "panels": [
            {
                "id": "A-B",
                "label": {"tr": "Ventriküler Aritmi Yayılım Vektörleri", "en": "Ventricular Arrhythmia Vectors"},
                "desc": {"tr": "R/S oranının 1.0 olduğu geçiş zonu (beyaz kesikli çizgi), ana yayılım vektörüne (noktalı ok) dik yönü anında gösterir.", "en": "Transition zone (R/S=1.0) indicates the direction perpendicular to the main propagation vector."}
            },
            {
                "id": "C",
                "label": {"tr": "Normal Sinüs P Dalgası Vektörü", "en": "Normal Sinus P Vector"},
                "desc": {"tr": "İnferior ve sola yönelen sinüs P vektörü (+58°), II'de pozitif; aVL'de küçük ve izoelektriğe yakın görünüm verir.", "en": "Sinus P vector directed inferiorly and leftward (+58°), giving upright P in II and near isoelectric in aVL."}
            },
            {
                "id": "D",
                "label": {"tr": "Akut Koroner Sendromda Komşu ST Yükselmesi", "en": "Contiguous ST Elevation in ACS"},
                "desc": {"tr": "İnferior MI'da II, aVF ve III boyunca komşu ve kesintisiz ST yükselmesi, aVL'de ise doğrudan resiprokal çökme görülür.", "en": "Shows contiguous ST elevation across II, aVF, III and reciprocal depression in aVL in inferior MI."}
            }
        ],
        "takeaway": {
            "tr": "Cabrera panoramik formatı: 1) VT/PVC yayılım vektörünü ve dik geçiş zonunu doğrudan gösterir; 2) Sinüs P vektörünü netleştirir; 3) Akut koroner sendromda iskemik ST yükselmesini komşu derivasyonlar boyunca kesintisiz sergiler.",
            "en": "Cabrera panoramic format allows immediate determination of ventricular arrhythmia vectors via transition zones, illuminates the normal sinus P vector (+58°), and displays contiguous ST elevation in myocardial infarction without jumping across leads."
        },
        "caption": {
            "en": figs["fig11"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Şekil 10'da gösterildiği gibi, kalbin önden bakış açısıyla görüntülendiği Cabrera sekansı/formatı (A ila D); ventriküler aritmilerin yayılım vektörünü (sarı ve kırmızı kesikli oklar) (A ve B), normal sinüs P dalgasının yayılım vektörünü (C) ve ST segment elevasyonunun (yıldız işaretleri) dağılımıyla ortaya konan miyokardiyal hasarın boyutunu (beyaz kesikli eğri) ve suçlu koroner arter bölgesini (D) anlamak için uygulanabilir. Geçiş zonu kavramı (R/S dalgası oranının 1.0 olması), prekordiyal derivasyonlara benzer şekilde uygulanabilir ve ventriküler aritmi bağlamında ana yayılım vektörüne dik yönü (beyaz kesikli çizgiler) gösterir (A ve B). Şekil 2'deki ayrıntılı açıklamalarla karşılaştırıldığında, ekstremite derivasyonlarının yorumlanması görsel olarak düzenli ve anatomik olarak sezgiseldir. L = sol koroner aortik sinüs; N = nonkoroner aortik sinüs; R = sağ koroner aortik sinüs."
        },
        "workbench": {"tab": "cabrera", "cabreraMode": "cabrera", "scenario": "mi_contiguous"},
        "tags": ["cabrera", "stemi", "transition-zone", "sinus-p", "panoramic-utility"]
    },
    "fig12": {
        "num": 12,
        "title": {
            "tr": "3 Boyutlu Anlayışı Kolaylaştıracak Dijital ve Fiziksel Kaynaklar",
            "en": "Resources to Facilitate 3-Dimensional Understanding"
        },
        "subtitle": {
            "tr": "Kardiyak BT modelleri · 3B poligon STL/3MF · Çıkarılabilir toraks ve akciğerler",
            "en": "Cardiac CT datasets · 3D polygon STL/3MF models · Detachable thorax and lungs"
        },
        "panels": [
            {
                "id": "A",
                "label": {"tr": "Dijital Poligon Model (Ek STL / 3MF)", "en": "Digital Polygon Model (Supplementary)"},
                "desc": {"tr": "Klinik kardiyak BT verilerinden oluşturulan dijital 3B model. Kalp, toraks kafesi ve akciğerlerin in situ uzaysal ilişkilerini sunar.", "en": "Digital 3D model obtained from clinical cardiac CT datasets showing in situ spatial relationships."}
            },
            {
                "id": "B-C",
                "label": {"tr": "Fiziksel 3B Baskı Modeli (TPU, %30 Ölçek)", "en": "Physical 3D Prints"},
                "desc": {"tr": "Termoplastik poliüretan ile basılmış, göğüs kafesi ve akciğerleri sökülebilir model. Elektrotların kalbe göre gerçek konumunu somutlaştırır.", "en": "3D print with detachable thoracic cage and lungs for hands-on spatial understanding."}
            }
        ],
        "takeaway": {
            "tr": "Prekordiyal derivasyonlar ile kalp arasındaki karmaşık uzaysal ilişkileri kavramak için klinik BT verilerinden elde edilen dijital 3B modeller (bu projede Three.js ile entegre) ve fiziksel baskılar paha biçilmez bir eğitim aracıdır.",
            "en": "Digital stereolithography (STL/3MF) polygon models obtained from clinical cardiac CT datasets and physical 3D prints enable interactive exploration of the fundamental 3D electrocardiographic anatomy."
        },
        "caption": {
            "en": figs["fig12"]["caption"].split("Bradfield et al")[0].strip(),
            "tr": "Prekordiyal derivasyonlar ile kalp arasındaki 3 boyutlu ilişki, klinik kardiyak bilgisayarlı tomografi veri setlerinden elde edilen dijital bir stereolitografi (STL) poligon modeli (Ek STL Dosyası) kullanılarak gösterilmekte ve üç boyutlu baskılarla (termoplastik poliüretan, %30 ölçek) sergilenmektedir. Göğüs kafesi ve her bir akciğer sökülebilir niteliktedir. Bu modelin STL dosyası, piyasada bulunan yazılım ve yazıcılar kullanılarak açılabilir ve basılabilir; bu da karmaşık ancak temel olan üç boyutlu elektrokardiyografik anatominin etkileşimli olarak keşfedilmesine ve daha iyi anlaşılmasına olanak tanır."
        },
        "workbench": {"tab": "heights", "cameraView": "superior", "bodyShift": 0},
        "tags": ["stl", "3mf", "ct-scan", "3d-print", "spatial-resources"]
    }
}

challenges = [
  {
    "id": "rvot_vector",
    "title": {
      "tr": "Vaka 1: RVOT PVC Odak Kayması ve Ekstremite Resiprositesi",
      "en": "Case 1: RVOT PVC Focal Shift and Limb Lead Reciprocity"
    },
    "figureRef": 2,
    "prompt": {
      "tr": "RVOT serbest duvarında PVC ablasyonu planlanan bir hastada, kateter posterolateral duvardan mediyal serbest duvara (sağdan sola) kaydırıldığında ekstremite derivasyonlarında hangi eşzamanlı değişim gözlenir?",
      "en": "In a patient undergoing RVOT PVC ablation, when the catheter shifts from the posterolateral to the medial free wall (right to left), which correlative limb lead changes are observed?"
    },
    "options": [
      {
        "id": "opt_correct",
        "text": {
          "tr": "Derivasyon I ve aVL'de Q dalgası artar; II'de R azalır, III'te R artar; aVR'de Q azalır (Şekil 2 kuralı).",
          "en": "Q-wave in I and aVL increases; R in II decreases, R in III increases; Q in aVR decreases (Figure 2 rule)."
        },
        "correct": True,
        "explanation": {
          "tr": "Doğru! Bradfield ve ark. Şekil 2'de gösterdiği gibi, odağın sağdan sola kayması yayılım vektörünü sola döndürür: II/III R oranı düşer, aVR/aVL Q oranı düşer, I ve aVL'de Q artar.",
          "en": "Correct! As proven in Figure 2, a right-to-left shift rotates the vector leftward: II/III R ratio falls, aVR/aVL Q ratio falls, and Q in I/aVL increases."
        }
      },
      {
        "id": "opt_wrong1",
        "text": {
          "tr": "Yalnızca derivasyon I değişir; diğer 5 ekstremite derivasyonu izole kalır.",
          "en": "Only lead I changes; the other 5 limb leads remain unaffected."
        },
        "correct": False,
        "explanation": {
          "tr": "Yanlış. Şekil 2'nin temel öğretisi: Ekstremite derivasyonlarındaki değişimler asla izole yorumlanamaz, 6 derivasyon ortak yapısal kuralı izler.",
          "en": "Incorrect. The central teaching of Figure 2 is that limb leads must never be read in isolation; all 6 follow a linked structural rule."
        }
      },
      {
        "id": "opt_wrong2",
        "text": {
          "tr": "II'de R dalgası artar, III'te R dalgası azalır, I'de saf R dalgası büyür.",
          "en": "R in II increases, R in III decreases, pure R in I enlarges."
        },
        "correct": False,
        "explanation": {
          "tr": "Yanlış. Bu değişim tam tersi yönde (soldan sağa / posterolateral serbest duvara) kaymada görülür.",
          "en": "Incorrect. This pattern reflects the opposite shift (from medial to posterolateral)."
        }
      }
    ],
    "workbench": { "tab": "cabrera", "scenario": "rvot_shift", "rvotFocus": 0.85 }
  },
  {
    "id": "summit_vs_inferoseptal",
    "title": {
      "tr": "Vaka 2: LV Summit vs İnferoseptal Çıkıntı ve Prekordiyal Yükseklik",
      "en": "Case 2: LV Summit vs Inferoseptal Process Precordial Heights"
    },
    "figureRef": 5,
    "prompt": {
      "tr": "Sol ventrikül tabanından (ostiyum) köken alan iki farklı ventriküler taşikardide; biri V1-V2'de S baskınlığı (\"ani V3 geçişi\"), diğeri ise V1-V6 boyunca pozitif R konkordansı sergilemektedir. Bu farkın anatomik temeli nedir?",
      "en": "In two VT foci arising from the LV base (ostium), one exhibits S-wave dominance in V1-V2 (\"abrupt V3 transition\"), while the other exhibits positive R concordance across V1-V6. What is the anatomical explanation?"
    },
    "options": [
      {
        "id": "opt_correct",
        "text": {
          "tr": "LV Summit V1-V2 seviyesindeki süperior düzlemdedir (S baskınlığı / ani V3 geçişi); LV inferoseptal çıkıntısı ise V4-V6 seviyesindeki inferior düzlemdedir (R konkordansı).",
          "en": "LV Summit lies on the superior plane at V1-V2 level (S dominance / abrupt V3 transition); inferoseptal process lies on the inferior plane at V4-V6 (R concordance)."
        },
        "correct": True,
        "explanation": {
          "tr": "Doğru! Şekil 4 ve 5'te kanıtlandığı üzere prekordiyal derivasyonlar tek bir yatay düzlemde değildir. V1-V2 süperior, V4-V6 inferiordur. Bu nedenle bazal LV aritmilerinin hepsi R konkordansı göstermez.",
          "en": "Correct! As proven in Figures 4 and 5, precordial leads span 3 distinct heights: V1/V2 superior, V4-V6 inferior. Hence not all basal LV foci exhibit R concordance."
        }
      },
      {
        "id": "opt_wrong1",
        "text": {
          "tr": "LV Summit kalbin en inferior ve apeksine en yakın bölgesidir, bu yüzden negatif görünür.",
          "en": "The LV summit is the most inferior apical region, which is why it appears negative."
        },
        "correct": False,
        "explanation": {
          "tr": "Yanlış. LV summit ventriküler kitlenin en tepesinde (süperiorunda), aort kökü ve V1-V2 hizasındadır.",
          "en": "Incorrect. The LV summit is at the very top (superior aspect) of the ventricular mass."
        }
      }
    ],
    "workbench": { "tab": "heights", "heightPlane": "superior", "focusSite": "summit" }
  },
  {
    "id": "nomenclature_fascicles",
    "title": {
      "tr": "Vaka 3: LAFB'de Süperior Aksın Anatomik Temeli",
      "en": "Case 3: Anatomical Basis of Superior Axis in LAFB"
    },
    "figureRef": 8,
    "prompt": {
      "tr": "Geleneksel Valentine terminolojisinde \"sol anterior fasikül bloğu\" denilen tabloda neden inferior aks değil de belirgin SÜPERİOR AKS SAPMASI (-30° ila -90°) gözlenir?",
      "en": "Why does traditional \"left anterior fascicular block\" manifest with marked SUPERIOR AXIS DEVIATION (-30° to -90°) rather than an inferior axis?"
    },
    "options": [
      {
        "id": "opt_correct",
        "text": {
          "tr": "Çünkü bu lifler göğüs içinde anatomik (in situ) olarak \"süperior fasiküldür\"; bloğunda aktivasyon son olarak süperiora yönelerek süperior aks sapması yaratır.",
          "en": "Because these fibers are attitudinally the \"superior fascicle\"; its block delays superior activation, intuitively creating superior axis deviation."
        },
        "correct": True,
        "explanation": {
          "tr": "Doğru! Şekil 7 ve 8'de açıklandığı gibi Valentine terminolojisi kalbi apeks üzerine diktiği için süperior liflere yanlışlıkla anterior demiştir. Anatomik terminoloji bu çelişkiyi çözer.",
          "en": "Correct! As shown in Figures 7 and 8, Valentine nomenclature mislabeled superior fibers as anterior by standing the heart on its apex."
        }
      },
      {
        "id": "opt_wrong1",
        "text": {
          "tr": "Çünkü sağ dal da aynı anda bloke olmuştur ve aksı yukarı çekmiştir.",
          "en": "Because the right bundle branch was also simultaneously blocked, pulling the axis upward."
        },
        "correct": False,
        "explanation": {
          "tr": "Yanlış. İzole sol süperior fasikül bloğu tek başına süperior aks oluşturur.",
          "en": "Incorrect. Isolated superior fascicular block alone accounts for superior axis deviation."
        }
      }
    ],
    "workbench": { "tab": "nomenclature", "nomenclatureTopic": "fascicles" }
  },
  {
    "id": "cabrera_acs",
    "title": {
      "tr": "Vaka 4: Akut Koroner Sendromda Cabrera Panoramik Formatının Üstünlüğü",
      "en": "Case 4: Advantage of Cabrera Panoramic Sequence in Acute Coronary Syndrome"
    },
    "figureRef": 11,
    "prompt": {
      "tr": "İnferior STEMI şüphesi olan bir hastada klasik ekstremite gösterimi (I, II, III, aVR, aVL, aVF) yerine Cabrera formatı (aVL, I, -aVR, II, aVF, III) kullanıldığında elde edilen temel tanısal avantaj nedir?",
      "en": "In suspected inferior STEMI, what is the core diagnostic advantage of using the Cabrera sequence (aVL, I, -aVR, II, aVF, III) over the classical limb display?"
    },
    "options": [
      {
        "id": "opt_correct",
        "text": {
          "tr": "İskemik ST elevasyonu komşu derivasyonlar boyunca (II, aVF, III) kesintisiz ve bitişik izlenir; aVL'deki resiprokal çökme de sıralı zincirin diğer ucunda doğrudan görülür.",
          "en": "Ischemic ST elevation is displayed contiguously across adjacent anatomical leads (II, aVF, III), with reciprocal ST depression in aVL directly evident at the other end."
        },
        "correct": True,
        "explanation": {
          "tr": "Doğru! Şekil 10 ve 11'de gösterildiği üzere Cabrera formatı 30 derecelik anatomik komşuluk sunar. Klasik EKG'deki derivasyon atlamaları ve kafa karışıklığı ortadan kalkar.",
          "en": "Correct! Figures 10 and 11 demonstrate that Cabrera format presents uninterrupted 30° anatomical contiguity, showing contiguous ST elevation directly."
        }
      },
      {
        "id": "opt_wrong1",
        "text": {
          "tr": "Cabrera formatı elektrotların hastanın vücudundaki yerini değiştirir ve sinyali yükseltir.",
          "en": "Cabrera format physically moves the limb electrodes on the patient and amplifies the voltage."
        },
        "correct": False,
        "explanation": {
          "tr": "Yanlış. Elektrotlar aynı kalır; Cabrera formatı yalnızca sinyallerin matematiksel ve görsel ardışıklığını (aVR ters çevrilerek) düzenler.",
          "en": "Incorrect. Patient electrodes are unchanged; Cabrera sequence only rearranges display order and vertically flips aVR."
        }
      }
    ],
    "workbench": { "tab": "cabrera", "cabreraMode": "cabrera", "scenario": "mi_contiguous" }
  }
]

output_js = "// Verified Dataset: Bradfield, Rimmer, Miyazaki, Hanna, Hayase, Do, Xu, Yamagami, Shivkumar, Mori\n"
output_js += "// \"Understanding Cardiac Anatomy and Imaging to Improve Safety of Procedures: 12-Lead Electrocardiographic Anatomy\"\n"
output_js += "// JACC: Case Reports 2026; 31(1): 105998. DOI: 10.1016/j.jaccas.2025.105998. PMID: 41204941. PMCID: PMC12833672.\n\n"
output_js += "export const JACC_PAPER_META = " + json.dumps(meta, indent=2, ensure_ascii=False) + ";\n\n"
output_js += "export const JACC_FIGURES = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n\n"
output_js += "export const JACC_CLINICAL_CHALLENGES = " + json.dumps(challenges, indent=2, ensure_ascii=False) + ";\n"

with open('src/ecg/davinci-data.js', 'w') as out:
    out.write(output_js)

print('Generated src/ecg/davinci-data.js successfully with JSON serialization!')
