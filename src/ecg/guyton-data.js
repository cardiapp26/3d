// Guyton & Hall ECG Data Model & Syllabus
// Chapters 11, 12, 13

export const GUYTON_TOPICS = [
  {
    id: 'ch11_basics',
    chapter: 11,
    title: {
      tr: 'Normal EKG İlkeleri ve Dalga Fizyolojisi',
      en: 'The Normal Electrocardiogram & Wave Principles'
    },
    subtitle: {
      tr: 'Monofazik aksiyon potansiyeli, depolarizasyon ve repolarizasyon dalgaları, kalibrasyon',
      en: 'Monophasic action potential, depolarization & repolarization waves, calibration'
    },
    sections: [
      {
        id: 'waves_and_potentials',
        title: { tr: 'Aksiyon Potansiyeli ve Yüzey EKG Eşleşmesi', en: 'Action Potential & Surface ECG Coupling' },
        desc: {
          tr: 'Ventrikül miyositinin monofazik aksiyon potansiyeli (Faz 0-4) ile yüzey EKG dalgaları arasındaki zamansal ve elektriksel ilişki. Repolarizasyonun neden bazal hatta dönüşle pozitif T dalgası ürettiği.',
          en: 'Temporal and electrical relationship between the ventricular monophasic action potential (Phases 0-4) and surface ECG waves. Why repolarization creates an upright T wave.'
        },
        keyConcept: {
          tr: 'Ventrikül aktivasyonu endokardiyal Purkinje ağından miyokarda yayılır. Repolarizasyon sırası aksiyon potansiyeli süre farklarına bağlıdır. QRS ve T polaritesi derivasyonun baktığı yöne göre değişir.',
          en: 'Ventricular activation spreads from the endocardial Purkinje network. Repolarization order depends on action-potential duration differences. QRS and T polarity depend on lead orientation.'
        }
      },
      {
        id: 'voltage_time_grid',
        title: { tr: 'Voltaj ve Zaman Kalibrasyonu', en: 'Voltage & Time Calibration Grid' },
        desc: {
          tr: 'Standart kağıt hızı 25 mm/sn ve voltaj kalibrasyonu 1 mV = 10 mm (10 küçük kare). Küçük kare = 0.04 sn (40 ms), büyük kare = 0.20 sn (200 ms). PR, QRS ve QT normal sınırları.',
          en: 'Standard paper speed 25 mm/s and calibration 1 mV = 10 mm. Small box = 0.04 s (40 ms), large box = 0.20 s (200 ms). Normal intervals for PR, QRS, and QT.'
        },
        intervals: {
          pr: '0.12 - 0.20 s (120-200 ms)',
          qrs: '0.06 - 0.10 s (60-100 ms)',
          qt: '0.36 - 0.44 s (hıza göre düzeltilir, QTc)'
        }
      }
    ]
  },
  {
    id: 'ch11_leads',
    chapter: 11,
    title: {
      tr: 'Einthoven Üçgeni ve 12 Derivasyon Sistemi',
      en: "Einthoven's Triangle & The 12-Lead System"
    },
    subtitle: {
      tr: 'Bipolar ekstremite derivasyonları, Einthoven kanunu, artırılmış tek kutuplu ve prekordiyal derivasyonlar',
      en: 'Bipolar limb leads, Einthoven law, augmented unipolar, and precordial leads'
    },
    sections: [
      {
        id: 'einthoven_law',
        title: { tr: "Einthoven Kanunu: Derivasyon I + III = II", en: "Einthoven's Law: Lead I + Lead III = Lead II" },
        desc: {
          tr: 'Herhangi bir anda Derivasyon I ve Derivasyon III potansiyellerinin cebirsel toplamı tam olarak Derivasyon II potansiyeline eşittir (Der I + Der III = Der II).',
          en: 'At any given instant, the electrical potentials recorded in Lead I and Lead III sum up algebraically to equal Lead II (Lead I + Lead III = Lead II).'
        }
      },
      {
        id: 'hexaxial_system',
        title: { tr: 'Heksaksiyel Referans Sistemi (Kombine Ekstremite Aksi)', en: 'Hexaxial Reference System' },
        desc: {
          tr: 'Standart (I, II, III) ve artırılmış (aVR, aVL, aVF) derivasyonların frontal düzlemde 30 derecelik açılarla oluşturduğu 360 derecelik dairesel koordinat sistemi.',
          en: 'The 360-degree circular coordinate system formed by 3 standard and 3 augmented limb leads intersecting at 30-degree intervals in the frontal plane.'
        },
        leadAngles: {
          lead1: 0,
          lead2: 60,
          lead3: 120,
          avr: -150,
          avl: -30,
          avf: 90
        }
      },
      {
        id: 'precordial_leads',
        title: { tr: 'Prekordiyal (Göğüs) Derivasyonları V1-V6', en: 'Precordial Leads V1-V6' },
        desc: {
          tr: 'Yatay (transvers) düzlemde elektriksel akımın yönü. V1-V2 sağ ventriküle ve septuma bakar (QS/rS baskın); V5-V6 sol serbest duvara bakar (yüksek R dalgası). Normal R dalga progresyonu.',
          en: 'Electrical vector in the horizontal plane. V1-V2 face the RV and septum (predominantly negative); V5-V6 face the lateral LV (tall R wave). Normal R wave progression.'
        }
      }
    ]
  },
  {
    id: 'ch12_vectors',
    chapter: 12,
    title: {
      tr: 'Vektöriyel Analiz ve QRS Oluşum Aşamaları',
      en: 'Vectorial Analysis & QRS Complex Generation'
    },
    subtitle: {
      tr: 'Anlık depolarizasyon vektörleri: Septal, apikal, serbest duvar ve bazal aktivasyon adımları',
      en: 'Sequential instantaneous depolarization vectors: Septal, apical, free wall, and basal activation'
    },
    vectors: [
      {
        step: 1,
        time: '0.01 s',
        name: { tr: 'Septal Depolarizasyon', en: 'Septal Depolarization' },
        vectorAngle: 110,
        magnitude: 0.25,
        details: {
          tr: 'İleti sol daldan septuma önce girer. Septal vektör soldan sağa, hafifçe öne ve aşağıya doğrudur. Derivasyon I ve V5-V6\'da küçük negatif Q dalgası, V1\'de küçük r dalgası üretir.',
          en: 'Conduction enters the septum from the left bundle branch. Vector runs left to right, slightly anterior. Produces small Q in I, V5-V6 and small r in V1.'
        },
        waves: { lead1: -0.08, lead2: 0.12, lead3: 0.20, v1: 0.15, v6: -0.08 }
      },
      {
        step: 2,
        time: '0.02 s',
        name: { tr: 'Apikal ve Erken Endokardiyal Yayılım', en: 'Apical & Early Endocardial Spread' },
        vectorAngle: 65,
        magnitude: 0.70,
        details: {
          tr: 'Depolarizasyon Purkinje sistemiyle apekse ve endokardiyal yüzeye yayılır. Vektör apeks yönünde (+60° civarı) hızla büyür. Derivasyon II doğrultusunda dik açıyla pozitif defleksiyon başlatır.',
          en: 'Depolarization spreads via Purkinje fibers to apex and endocardium. Vector grows strongly toward the apex (+60°). Starts steep positive deflection in Lead II.'
        },
        waves: { lead1: 0.35, lead2: 0.70, lead3: 0.40, v1: -0.10, v6: 0.60 }
      },
      {
        step: 3,
        time: '0.04 s',
        name: { tr: 'Büyük Ventrikül Serbest Duvar Aktivasyonu (Maksimum QRS)', en: 'Major Ventricular Free Wall Activation (Peak QRS)' },
        vectorAngle: 55,
        magnitude: 1.50,
        details: {
          tr: 'Sol ventrikülün kalın miyokard kitlesi depolarize olur. Sol ventrikül elektriksel olarak sağ ventrikülü ezer. Ortalama elektriksel aks yönünde (+55° to +60°) maksimum R dalgası tepeye ulaşır.',
          en: 'Thick LV free wall depolarizes, vastly overwhelming the RV electrically. Maximum instantaneous vector toward +55° to +60°, forming the peak of the R wave.'
        },
        waves: { lead1: 0.90, lead2: 1.45, lead3: 0.65, v1: -0.80, v6: 1.40 }
      },
      {
        step: 4,
        time: '0.06 s',
        name: { tr: 'Bazal Ventrikül ve Pulmoner Konus Depolarizasyonu', en: 'Basal Ventricles & Conus Depolarization' },
        vectorAngle: -45,
        magnitude: 0.40,
        details: {
          tr: 'Ventriküllerin en son aktive olan bazal bölgeleri (sol ventrikül tabanı ve pulmoner konus) depolarize olur. Terminal vektör bazal yönelime döner; her derivasyondaki son defleksiyon izdüşüme bağlıdır. Bu frontal −45° örneğinde I pozitif, II/III negatiftir.',
          en: 'Last parts to depolarize are basal posterolateral LV and pulmonary conus. Vector turns superiorly and posteriorly; in this frontal −45° example, Lead I is positive while terminal S waves are written in leads II and III.'
        },
        waves: { lead1: 0.28, lead2: -0.25, lead3: -0.15, v1: -0.30, v6: -0.20 }
      },
      {
        step: 5,
        time: '0.08 s',
        name: { tr: 'Tam Ventrikül Depolarizasyonu (ST Segmenti / J Noktası)', en: 'Full Depolarization (ST Segment / J Point)' },
        vectorAngle: 0,
        magnitude: 0.0,
        details: {
          tr: 'Tüm ventrikül miyokardı depolarize olmuştur. Hücreler arası potansiyel farkı sıfırdır. Akım durur ve kayıt izoelektrik bazal hatta (J noktası ve ST segmenti) oturur.',
          en: 'Entire ventricular myocardium is depolarized. Potential difference between all parts is zero. Net current stops; trace rests on isoelectric baseline.'
        },
        waves: { lead1: 0, lead2: 0, lead3: 0, v1: 0, v6: 0 }
      }
    ]
  },
  {
    id: 'ch12_axis',
    chapter: 12,
    title: {
      tr: 'Ortalama Elektriksel Aks ve Aks Deviasyonları',
      en: 'Mean Electrical Axis & Axis Deviations'
    },
    subtitle: {
      tr: 'Frontal QRS aksı hesaplama, sol aks sapması (LAD), sağ aks sapması (RAD) ve hipertrofi fizyopatolojisi',
      en: 'Calculating frontal QRS axis, left axis deviation (LAD), right axis deviation (RAD), and hypertrophy'
    },
    normalRange: { min: -30, max: 90, average: 59 },
    conditions: [
      {
        id: 'normal',
        name: { tr: 'Normal Aks (+59°)', en: 'Normal Axis (+59°)' },
        angle: 59,
        lead1Net: 1.0,
        lead3Net: 0.5,
        status: { tr: 'Normal fizyolojik aralık (-30° ile +90°)', en: 'Normal physiological range (-30° to +90°)' },
        causes: {
          tr: 'Sağlıklı birey, dengeli ventriküler kitle ve normal iletim sistemi.',
          en: 'Healthy individual, balanced ventricular mass, intact conduction system.'
        }
      },
      {
        id: 'lad_lvh',
        name: { tr: 'Sola Yönelim Örneği (-15°, normal aralık içinde)', en: 'Leftward Axis Example (-15°, within normal range)' },
        angle: -15,
        lead1Net: 1.4,
        lead3Net: -0.7,
        status: { tr: '−15° normal aralıkta; sol aks sapması < −30°', en: '−15° is within normal range; LAD is < −30°' },
        causes: {
          tr: 'Sistemik hipertansiyon, aort darlığı veya aort yetersizliği nedeniyle sol ventrikül kitlesinin belirgin artması. Elektriksel vektör hipertrofiye uğrayan sol tarafa doğru kayar.',
          en: 'Hypertension, aortic stenosis/regurgitation expanding LV muscle mass. Vector points predominantly leftward and superiorly.'
        }
      },
      {
        id: 'lad_lbbb',
        name: { tr: 'Sol Aks Sapması: Sol Dal Bloğu (LBBB, -50°)', en: 'Left Axis Deviation: LBBB (-50°)' },
        angle: -50,
        lead1Net: 1.6,
        lead3Net: -1.2,
        status: { tr: 'Belirgin Sol Aks Sapması (-50°)', en: 'Marked Left Axis Deviation (-50°)' },
        causes: {
          tr: 'Sol dal iletimi kesildiğinde, septum ve sağ ventrikül 2-3 kat önce uyarılır; sol ventrikül miyokard içinde yavaşça uyarılır. Gecikmiş sol aktivasyon QRS’yi genişletir; aks normal veya sapmış olabilir. Bu −50° yalnız bir örnektir.',
          en: 'Left bundle blocked; RV depolarizes long before LV. Impulse slowly creeps through LV myocardium unopposed, producing broad QRS; the axis may be normal or deviated. This −50° is one example.'
        }
      },
      {
        id: 'rad_rvh',
        name: { tr: 'Sağ Aks Sapması: Sağ Ventrikül Hipertrofisi (+120°)', en: 'Right Axis Deviation: RV Hypertrophy (+120°)' },
        angle: 120,
        lead1Net: -0.6,
        lead3Net: 1.3,
        status: { tr: 'Sağ Aks Sapması (+120° / > +90° patolojik)', en: 'Right Axis Deviation (+120° / > +90° abnormal)' },
        causes: {
          tr: 'Pulmoner hipertansiyon, pulmoner stenoz veya Fallot tetralojisi. Sağ ventrikül kas kitlesi artarak elektriksel vektörü sağa ve aşağıya çeker.',
          en: 'Pulmonary hypertension, pulmonary stenosis, Tetralogy of Fallot. Expanded RV mass pulls electrical forces rightward and inferiorly.'
        }
      },
      {
        id: 'rad_rbbb',
        name: { tr: 'RBBB ile Sağ Aks Örneği (+105°)', en: 'RBBB with Rightward Axis Example (+105°)' },
        angle: 105,
        lead1Net: -0.3,
        lead3Net: 1.1,
        status: { tr: 'Sağ Aks Sapması (+105°)', en: 'Right Axis Deviation (+105°)' },
        causes: {
          tr: 'Sağ dal kesintisi; sol ventrikül önce uyarılır, ardından sağ ventrikül gecikmeli olarak depolarize olur. Geç vektör sağa yönelir; V1\'de rSR\' (tavşan kulağı) görülebilir; sağ aks sapması zorunlu değildir.',
          en: 'RBBB: LV activates normally first, followed by slow delayed activation of RV. Terminal vector points rightward, producing rSR in V1.'
        }
      }
    ]
  },
  {
    id: 'ch12_injury',
    chapter: 12,
    title: {
      tr: 'Hasar Akımı (Current of Injury) ve J Noktası',
      en: 'Current of Injury & The J Point (Ischemia/Infarction)'
    },
    subtitle: {
      tr: 'İskemi, miyokard enfarktüsü, J noktası referansı ve ST elevasyon/depresyon fizyopatolojisi',
      en: 'Ischemia, myocardial infarction, J-point reference, and ST elevation/depression physiology'
    },
    mechanism: {
      tr: 'İskemik dokunun membran potansiyeli ve aksiyon potansiyeli sağlıklı dokudan farklılaşabilir. Diyastolik ve sistolik potansiyel farkları ST/T değişikliklerine katkı verir. J noktası QRS sonu ve ST başlangıcıdır; uygun TP/PR bazal çizgisiyle karşılaştırılır.',
      en: 'Ischemic tissue may differ from healthy tissue in membrane and action potentials. Diastolic and systolic voltage differences contribute to ST/T changes. J marks QRS end and ST onset; compare with an appropriate TP/PR baseline.'
    },
    cases: [
      {
        id: 'anterior_mi',
        title: { tr: 'Akut Anterior Duvar Enfarktüsü', en: 'Acute Anterior Wall MI' },
        jPointShift: '+2.5 mm ST elevasyonu (V1-V4)',
        vectorDirection: { tr: 'Apeks ve anterior duvara doğru (+)', en: 'Directed toward anterior apex (+)' },
        ecgSigns: {
          v2_v3: 'Belirgin ST elevasyonu (> 2 mm), hiperakut T dalgaları',
          lead2_3: 'Resiprokal ST depresyonu (özellikle III ve aVF)'
        },
        pathology: {
          tr: 'Sol ön inen arter (LAD) akut tıkanması. Anterior ventrikül duvarında subepikardiyal hasar akımı vektörü anterior göğüs duvarına doğru bakar.',
          en: 'Acute LAD occlusion. Subepicardial injury on anterior LV creates vector pointing outward toward anterior chest leads.'
        }
      },
      {
        id: 'posterior_mi',
        title: { tr: 'Akut Posterior Duvar Enfarktüsü', en: 'Acute Posterior Wall MI' },
        jPointShift: 'V1–V3’te ST depresyonu; V7–V9’da elevasyon görülebilir',
        vectorDirection: { tr: 'Arkaya ve tabana doğru (-)', en: 'Directed posteriorly and toward base (-)' },
        ecgSigns: {
          v1_v2: 'Ayna görüntüsü: horizontal ST depresyonu, uzun pozitif R, dik T',
          lead3_avf: 'İnferoposterior ST elevasyonu'
        },
        pathology: {
          tr: 'Sirkumfleks (LCx) veya sağ koroner arter (RCA) tıkanması. Vektör sırta doğru kaçtığı için V1-V2 elektrotları hasar akımının arkasını görür.',
          en: 'LCx or RCA occlusion. Vector points toward back of heart, creating mirror-image reciprocal ST depression in V1-V2.'
        }
      }
    ]
  },
  {
    id: 'ch13_arrhythmias',
    chapter: 13,
    title: {
      tr: 'Kardiyak Aritmiler ve Re-entry Fizyolojisi',
      en: 'Cardiac Arrhythmias & Circus Movement (Re-entry)'
    },
    subtitle: {
      tr: 'Sinüs disritmileri, AV tam bloklar, erken vurular (PVC), taşikardiler ve re-entry ve ritim örnekleri',
      en: 'Sinus dysrhythmias, AV blocks, PVCs, tachycardias, and re-entry and rhythm examples'
    },
    reentryConditions: [
      {
        rule: 1,
        title: { tr: 'Uzamış İleti Yolu (Kardiyomegali / Dilatasyon)', en: 'Long Pathway Length (Dilatation)' },
        desc: {
          tr: 'Yol ne kadar uzunsa, uyarı başlama noktasına geri dönene kadar başlangıçtaki doku refrakter periyodunu bitirmiş olur. Kalp genişlemesinde re-entry ve fibrilasyon riski bu yüzden fırlar.',
          en: 'The longer the pathway, the longer the travel time. By the time impulse returns, the starting muscle is out of refractory period.'
        }
      },
      {
        rule: 2,
        title: { tr: 'Azalmış İletim Hızı (İskemi / Hiperkalemi / Purkinje Bloğu)', en: 'Decreased Conduction Velocity (Ischemia)' },
        desc: {
          tr: 'İletim hızı yarıya indiğinde uyarının yolu tamamlama süresi iki katına çıkar. Doku dinlenme fazına geçmiş olur ve re-entry halkası kesintisiz döner.',
          en: 'If conduction velocity is halved, impulse travel time doubles, allowing previously stimulated muscle time to recover excitability.'
        }
      },
      {
        rule: 3,
        title: { tr: 'Kısalmış Refrakter Periyot (İlaçlar / Sempatik Stimülasyon / Epinefrin)', en: 'Shortened Refractory Period (Epinephrine)' },
        desc: {
          tr: 'Miyokart hücresinin refrakter kalma süresi kısalırsa, normal yoldan gelen uyarı bile dokuyu uyarılabilir bulur ve halka hareketini başlatır.',
          en: 'When the refractory period is shortened, impulse easily finds excitable tissue immediately ahead, sustaining circus movement.'
        }
      }
    ],
    arrhythmiaTypes: [
      { id: 'sinus_brady', name: { tr: 'Sinüs Bradikardisi (<60/dk)', en: 'Sinus Bradycardia (<60 bpm)' }, pr: 'Normal', rate: 48, qrs: 'Normal' },
      { id: 'sinus_tachy', name: { tr: 'Sinüs Taşikardisi (>100/dk)', en: 'Sinus Tachycardia (>100 bpm)' }, pr: 'Normal', rate: 135, qrs: 'Normal' },
      { id: 'av_block_1', name: { tr: '1. Derece AV Blok (PR > 0.20 sn)', en: '1st Degree AV Block (PR > 0.20 s)' }, pr: '0.28 s', rate: 70, qrs: 'Normal' },
      { id: 'av_block_2_mobitz1', name: { tr: '2. Derece Tip 1 (Wenckebach)', en: '2nd Degree Type 1 (Wenckebach)' }, pr: 'Gittikçe uzayan PR', rate: 60, qrs: 'Düşen QRS' },
      { id: 'av_block_3', name: { tr: '3. Derece Tam AV Blok (AV Disosiasyon)', en: '3rd Degree Complete AV Block' }, pr: 'Bağımsız P ve QRS', rate: 36, qrs: 'Geniş kaçış (Stokes-Adams)' },
      { id: 'pvc', name: { tr: 'Ventriküler Erken Vuru (PVC / VES)', en: 'Premature Ventricular Contraction' }, pr: 'Yok', rate: 80, qrs: 'Geniş, tuhaf, kompanzatuvar duraklama' },
      { id: 'vt', name: { tr: 'Ventriküler Taşikardi (VT)', en: 'Ventricular Tachycardia (VT)' }, pr: 'Disosiasyon', rate: 175, qrs: 'Geniş, hızlı ardışık monomorfik' },
      { id: 'vf', name: { tr: 'Ventriküler Fibrilasyon (VF)', en: 'Ventricular Fibrillation (VF)' }, pr: 'Yok', rate: 400, qrs: 'Kaotik, nabızsız dalgalar' },
      { id: 'afib', name: { tr: 'Atriyal Fibrilasyon (AF)', en: 'Atrial Fibrillation (AF)' }, pr: 'P dalgası yok (f dalgaları)', rate: 120, qrs: 'Tamamen düzensiz (irregüler)' },
      { id: 'aflutter', name: { tr: 'Atriyal Flutter (Testere Dişi)', en: 'Atrial Flutter (Sawtooth Waves)' }, pr: 'F dalgaları (2:1 / 3:1)', rate: 150, qrs: 'Düzenli ventrikül yanıtı' }
    ]
  }
];

export const GUYTON_CALIBRATION = {
  paperSpeedMmPerSec: 25,
  voltageScaleMmPerMv: 10,
  smallBoxSec: 0.04,
  smallBoxMv: 0.1,
  largeBoxSec: 0.20,
  largeBoxMv: 0.5
};

export const EINTHOVEN_LEADS = [
  { id: 'I', name: 'Lead I', angleDeg: 0, positivePole: 'LA', negativePole: 'RA' },
  { id: 'II', name: 'Lead II', angleDeg: 60, positivePole: 'LL', negativePole: 'RA' },
  { id: 'III', name: 'Lead III', angleDeg: 120, positivePole: 'LL', negativePole: 'LA' },
  { id: 'aVR', name: 'Lead aVR', angleDeg: -150, positivePole: 'RA', negativePole: 'LA+LL' },
  { id: 'aVL', name: 'Lead aVL', angleDeg: -30, positivePole: 'LA', negativePole: 'RA+LL' },
  { id: 'aVF', name: 'Lead aVF', angleDeg: 90, positivePole: 'LL', negativePole: 'RA+LA' }
];

export const SEQUENTIAL_QRS_STEPS = [
  { id: 'step_1_septal', step: 1, name: { tr: 'Septal Depolarizasyon', en: 'Septal Depolarization' }, vectorAngle: 110, magnitude: 0.25 },
  { id: 'step_2_apical', step: 2, name: { tr: 'Apikal ve Erken Endokardiyal Yayılım', en: 'Apical & Early Endocardial Spread' }, vectorAngle: 65, magnitude: 0.70 },
  { id: 'step_3_freewall', step: 3, name: { tr: 'Büyük Ventrikül Serbest Duvar Aktivasyonu', en: 'Major Ventricular Free Wall Activation' }, vectorAngle: 55, magnitude: 1.50 },
  { id: 'step_4_basal', step: 4, name: { tr: 'Bazal Ventrikül Depolarizasyonu', en: 'Basal Ventricles Depolarization' }, vectorAngle: -45, magnitude: 0.40 },
  { id: 'step_5_jpoint', step: 5, name: { tr: 'Tam Ventrikül Depolarizasyonu (J Noktası)', en: 'Full Depolarization (J Point)' }, vectorAngle: 0, magnitude: 0.0 }
];

export const AXIS_DEVIATIONS = {
  normal: { range: [-30, 90], avg: 59 },
  lad: { range: [-90, -30], causes: { tr: ['Sol Ventrikül Hipertrofisi (LVH)', 'Sol Dal Bloğu (LBBB)', 'Sol Anterior Hemiblok'], en: ['Left Ventricular Hypertrophy (LVH)', 'Left Bundle Branch Block (LBBB)', 'Left Anterior Fascicular Block'] } },
  rad: { range: [90, 180], causes: { tr: ['Sağ Ventrikül Hipertrofisi (RVH)', 'Sağ Dal Bloğu (RBBB)', 'Pulmoner Emboli / KOAH'], en: ['Right Ventricular Hypertrophy (RVH)', 'Right Bundle Branch Block (RBBB)', 'Pulmonary Embolism / COPD'] } },
  extreme: { range: [-180, -90], causes: { tr: ['Ventriküler Taşikardi', 'Hiperkalemi', 'Ters elektrot yerleşimi'], en: ['Ventricular Tachycardia', 'Severe Hyperkalemia', 'Lead Reversal'] } }
};

export const INJURY_CURRENT_CASES = {
  anterior_mi: {
    id: 'anterior_mi',
    title: { tr: 'Akut Anterior Duvar Enfarktüsü (LAD)', en: 'Acute Anterior Wall MI (LAD)' },
    jPointShiftMv: 0.25,
    vectorAngleDeg: 60
  },
  inferior_mi: {
    id: 'inferior_mi',
    title: { tr: 'Akut İnferior Duvar Enfarktüsü (RCA)', en: 'Acute Inferior Wall MI (RCA)' },
    jPointShiftMv: 0.20,
    vectorAngleDeg: 120
  },
  pericarditis: {
    id: 'pericarditis',
    title: { tr: 'Akut Yaygın Perikardit', en: 'Acute Diffuse Pericarditis' },
    jPointShiftMv: 0.15,
    vectorAngleDeg: 45
  }
};

export const REENTRY_CIRCUIT_DATA = {
  guytonThreeConditions: {
    tr: [
      'Uzamış İleti Yolu (Kardiyomegali / Ventrikül Dilatasyonu)',
      'Azalmış İletim Hızı (İskemi / Hiperkalemi / Purkinje Bloğu)',
      'Kısalmış Refrakter Periyot (Epinefrin / Sempatik Stimülasyon)'
    ],
    en: [
      'Increased Pathway Length (Cardiomegaly / Ventricular Dilatation)',
      'Decreased Conduction Velocity (Ischemia / Hyperkalemia / Purkinje Block)',
      'Shortened Refractory Period (Epinephrine / Sympathetic Stimulation)'
    ]
  }
};

