// Peripheral angiography teaching copy and the view index.
// Geometry lives in the sibling data files. This module does not touch the DOM.

import { AORTOILIAC, FEMORAL_MAP } from './peripheral-data-lower.js';
import { SECTIONS } from './peripheral-data-sections.js';
import { RUNOFF } from './peripheral-data-runoff.js';
import { VISCERAL } from './peripheral-data-visceral.js';
import { ARM } from './peripheral-data-arm.js';

export const SHELL = {
  tr: {
    title: 'Cardia · Periferik anjiyografi',
    disclaimer: 'Şematik eğitim çizimidir, hasta görüntülemesi değildir. Eğitim amaçlıdır.'
  },
  en: {
    title: 'Cardia · Peripheral angiography',
    disclaimer: 'Schematic teaching drawing, not patient imaging; for education.'
  }
};

export const UI = {
  tr: {
    kicker: 'Periferik anjiyografi',
    lead: 'Aortoiliyak inflow, femoral giriş, bacak akımı, visseral dallar ve radiyal erişim. Tüm çizimler orijinal şematik eğitim geometrisidir.',
    tabs: 'Görünümler',
    empty: 'Bir yapı seçin',
    emptyHint: 'Damarın, bandın veya kesitin üzerine gelin. Tıklayınca açıklama kartı açılır.',
    desc: 'Açıklama',
    pearl: 'Anjiyografik karşılık',
    cardKicker: 'Seçilen yapı',
    scaleNote: 'Anatomik ölçek değildir. Dallar öğretim için ayrılmıştır.',
    watermark: 'Şematik eğitim geometrisi',
    legend: 'Lejant',
    refs: 'Kaynaklar',
    refsNote: 'Çizimler orijinal şemadır. Atlas figürü kopyalanmamıştır.',
    scales: 'Sınıflama',
    artery: 'Arter',
    branch: 'Dal',
    safe: 'Güvenli bant',
    risk: 'Risk',
    variant: 'Varyant',
    vein: 'Ven',
    bone: 'Kemik'
  },
  en: {
    kicker: 'Peripheral angiography',
    lead: 'Aortoiliac inflow, femoral access, leg runoff, visceral branches, and radial access. Every drawing is original schematic teaching geometry.',
    tabs: 'Views',
    empty: 'Select a structure',
    emptyHint: 'Point at a vessel, band, or section. A click opens the detail card.',
    desc: 'Description',
    pearl: 'Angiographic relevance',
    cardKicker: 'Selected structure',
    scaleNote: 'Not anatomic scale. Branches are separated for teaching.',
    watermark: 'Schematic teaching geometry',
    legend: 'Legend',
    refs: 'References',
    refsNote: 'Drawings are original schematics. No atlas figure is reproduced.',
    scales: 'Classification',
    artery: 'Artery',
    branch: 'Branch',
    safe: 'Safe zone',
    risk: 'Risk',
    variant: 'Variant',
    vein: 'Vein',
    bone: 'Bone'
  }
};

const mode = (id, tr, en, w, h) => ({ id, tr, en, viewBox: [w, h] });

export const VIEWS = [
  {
    id: 'aortoiliac',
    tab: { tr: 'Aortoiliyak', en: 'Aortoiliac' },
    title: { tr: 'Aortoiliyak arterler', en: 'Aortoiliac arteries' },
    lead: {
      tr: 'Karın aortundan inguinal ligamana kadar inflow. Görüntünün solu hastanın sağıdır.',
      en: 'Inflow from the abdominal aorta to the inguinal ligament. Image left is the patient\'s right.'
    },
    pearl: {
      tr: 'Karşı oblik, yaklaşık 20–30°, iliyak bifurkasyonu açar: sağ için LAO, sol için RAO. İnferior epigastrik arter anjiyoda inguinal ligamanın işaretidir. Aralıklar şematik eğitim geometrisidir.',
      en: 'A contralateral oblique of about 20–30° opens the iliac bifurcation: LAO for the right side, RAO for the left. The inferior epigastric artery marks the inguinal ligament on angiography. Spacing is schematic teaching geometry.'
    },
    modes: [mode('map', 'Harita', 'Map', 720, 800)],
    structures: AORTOILIAC
  },
  {
    id: 'femoral',
    tab: { tr: 'Femoral', en: 'Femoral' },
    title: { tr: 'Femoral arter ve erişim', en: 'Femoral artery and access' },
    lead: {
      tr: 'Sağ kasık, AP. Görüntünün solu lateral, sağı medialdir. Kesit düğmesi beş aksiyel düzeyi açar.',
      en: 'Right groin, AP. Image left is lateral and image right is medial. The section control opens five axial levels.'
    },
    pearl: {
      tr: 'İpsilateral oblik 20–40° femoral bifurkasyonu açar (sağda RAO, solda LAO). Güvenli giriş inferior epigastrik arterin altında, bifurkasyonun üstünde ve femur başının üzerindedir. Yüksek girişte retroperitoneal kanama, alçak girişte psödoanevrizma ve AV fistül riski artar. Kesitlerde ven medial ve arkadadır.',
      en: 'An ipsilateral oblique of 20–40° opens the femoral bifurcation (RAO on the right, LAO on the left). The safe stick is below the inferior epigastric artery, above the bifurcation, and over the femoral head. A high stick risks retroperitoneal bleeding. A low stick risks pseudoaneurysm and AV fistula. On the sections the vein is medial and posterior.'
    },
    modes: [mode('map', 'Harita', 'Map', 720, 800), mode('xs', 'Kesitler', 'Sections', 720, 1120)],
    structures: [...FEMORAL_MAP, ...SECTIONS]
  },
  {
    id: 'runoff',
    tab: { tr: 'Bacak', en: 'Runoff' },
    title: { tr: 'Uyluktan ayağa akım', en: 'Thigh to foot runoff' },
    lead: {
      tr: 'Sağ bacak, AP. Görüntünün solu lateraldir. Peroneal arter normalde plantar arka inmez.',
      en: 'Right leg, AP. Image left is lateral. The peroneal artery does not normally reach the plantar arch.'
    },
    pearl: {
      tr: 'Lateral veya oblik projeksiyon ön tibial arteri peroneal arterden ayırır. TASC II: P1 addüktör hiatusundan patellanın proksimal kenarına, P2 diz eklem aralığının merkezine, P3 ön tibial arter çıkışına kadar uzanır. Orta geniküler arter P2 metnindedir, ayrı düğme değildir.',
      en: 'A lateral or oblique projection separates the anterior tibial artery from the peroneal artery. TASC II: P1 runs from the adductor hiatus to the proximal border of the patella, P2 to the center of the knee joint space, and P3 to the origin of the anterior tibial artery. The middle genicular artery is mentioned on the P2 card, not as its own button.'
    },
    modes: [mode('map', 'Harita', 'Map', 720, 1280)],
    structures: RUNOFF
  },
  {
    id: 'visceral',
    tab: { tr: 'Visseral', en: 'Visceral' },
    title: { tr: 'Visseral ve renal arterler', en: 'Visceral and renal arteries' },
    lead: {
      tr: 'AP adlandırma görünümüdür. Karaciğer görüntünün solunda, dalak sağındadır.',
      en: 'AP is the naming view. The liver is image left and the spleen is image right.'
    },
    pearl: {
      tr: 'Çölyak ve SMA ağızları için lateral, renal ağızlar için hafif ipsilateral veya karşı oblik kullanılır. Oblik çizim sığ bir şemadır, ölçülmüş bir açı değildir. Sık çalışma aralığı 10–20° LAO veya hafif ipsilateral obliktir.',
      en: 'Use a lateral projection for the celiac and SMA ostia, and a slight ipsilateral or contralateral oblique for the renal ostia. The oblique drawing is a shallow schematic, not a measured angle. A common working range is 10–20° LAO or a slight ipsilateral oblique.'
    },
    modes: [
      mode('ap', 'AP', 'AP', 720, 820),
      mode('lateral', 'Lateral', 'Lateral', 720, 820),
      mode('oblique', 'Oblik', 'Oblique', 720, 820)
    ],
    structures: VISCERAL
  },
  {
    id: 'arm',
    tab: { tr: 'Kol', en: 'Arm' },
    title: { tr: 'Üst ekstremite ve radiyal erişim', en: 'Upper extremity and radial access' },
    lead: {
      tr: 'Sol kol. Göğüs duvarı dalı LIMA\'dır. Ulnar taraf görüntünün solunda, radiyal taraf sağındadır.',
      en: 'Left arm. The chest-wall branch is the LIMA. The ulnar side is image left and the radial side is image right.'
    },
    pearl: {
      tr: 'Varyant düğmesi radiyal loop ve yüksek bifurkasyonu gösterir. Distal radiyal giriş (anatomik enfiye çukuru) her iki moddadır. Sağ subklavyanın distal dalları aynıdır, ikinci kol çizilmez. Ark tipleri I–III kateter öğretim dilidir (Myla tipi): tip I brakiosefalik arter dış kurvaturda, tip II arasında, tip III iç kurvaturda veya altındadır. Tip III femoralden zor angajmandır. Bu şema üç tipi çizmez. Madhwal ve arkadaşları (J Invasive Cardiol 2008) LCCA çapı yöntemiyle ark tipinin karotis stentlemesini zorlaştırdığını göstermiştir.',
      en: 'The variant toggle shows a radial loop and a high bifurcation. Distal radial access (anatomical snuffbox) is in both modes. The right subclavian artery has the same distal branches, and a second arm is not drawn. Arch types I–III are catheterization teaching language (Myla type): type I has the innominate on the outer curvature, type II lies between, and type III is at or below the inner curve. Type III makes femoral engagement difficult. This schematic does not depict the three types. Madhwal and colleagues (J Invasive Cardiol 2008) showed, with the LCCA-diameter method, that arch type predicts difficult carotid stenting.'
    },
    modes: [mode('typical', 'Tipik', 'Typical', 720, 1160), mode('variant', 'Varyant', 'Variant', 720, 1160)],
    structures: ARM
  }
];

export const SCALES = {
  rutherford: {
    title: { tr: 'Rutherford (1997)', en: 'Rutherford (1997)' },
    source: {
      tr: 'Rutherford RB et al. J Vasc Surg. 1997;26:517-538. Kategori / derece.',
      en: 'Rutherford RB et al. J Vasc Surg. 1997;26:517-538. Category / grade.'
    },
    rows: [
      { grade: '0', tr: 'Asemptomatik', en: 'Asymptomatic' },
      { grade: 'I/1', tr: 'Hafif klodikasyon', en: 'Mild claudication' },
      { grade: 'I/2', tr: 'Orta klodikasyon', en: 'Moderate claudication' },
      { grade: 'I/3', tr: 'Ağır klodikasyon', en: 'Severe claudication' },
      { grade: 'II/4', tr: 'İskemik istirahat ağrısı', en: 'Ischemic rest pain' },
      { grade: 'III/5', tr: 'Küçük doku kaybı', en: 'Minor tissue loss' },
      { grade: 'III/6', tr: 'Transmetatarsalin proksimalinde büyük doku kaybı, ayak kurtarılamaz', en: 'Major tissue loss above the transmetatarsal level, foot not salvageable' }
    ]
  },
  fontaine: {
    title: { tr: 'Fontaine (1954)', en: 'Fontaine (1954)' },
    source: {
      tr: 'Fontaine R, Kim M, Kieny R. Die chirurgische Behandlung der peripheren Durchblutungsstörungen. Helv Chir Acta. 1954;21:499-533. 200 m ayrımı yaygın öğretim bölümlemesidir.',
      en: 'Fontaine R, Kim M, Kieny R. Die chirurgische Behandlung der peripheren Durchblutungsstörungen. Helv Chir Acta. 1954;21:499-533. The 200 m split is the common teaching division.'
    },
    rows: [
      { grade: 'I', tr: 'Asemptomatik', en: 'Asymptomatic' },
      { grade: 'IIa', tr: 'Klodikasyon, 200 m üzerinde', en: 'Claudication beyond 200 m' },
      { grade: 'IIb', tr: 'Klodikasyon, 200 m altında', en: 'Claudication under 200 m' },
      { grade: 'III', tr: 'İstirahat ağrısı', en: 'Rest pain' },
      { grade: 'IV', tr: 'Ülser veya gangren', en: 'Ulcer or gangrene' }
    ]
  },
  abi: {
    title: { tr: 'ABI (2016 AHA/ACC)', en: 'ABI (2016 AHA/ACC)' },
    source: {
      tr: 'Gerhard-Herman MD et al. 2016 AHA/ACC alt ekstremite PAH kılavuzu. Circulation. 2017;135:e726-e779.',
      en: 'Gerhard-Herman MD et al. 2016 AHA/ACC lower extremity PAD guideline. Circulation. 2017;135:e726-e779.'
    },
    rows: [
      { grade: '>1.40', tr: 'Sıkıştırılamaz. TBI kullanın. TBI <0.70 anormaldir.', en: 'Noncompressible. Use TBI. TBI <0.70 is abnormal.' },
      { grade: '1.00–1.40', tr: 'Normal', en: 'Normal' },
      { grade: '0.91–0.99', tr: 'Sınırda', en: 'Borderline' },
      { grade: '0.41–0.90', tr: 'Hafif ile orta', en: 'Mild to moderate' },
      { grade: '≤0.40', tr: 'Ağır', en: 'Severe' }
    ],
    note: {
      tr: 'İstirahat ABI ≤0.90 periferik arter hastalığını destekler.',
      en: 'A resting ABI ≤0.90 supports PAD.'
    }
  }
};

export const REFERENCES = [
  'Standring S, ed. Gray\'s Anatomy. 42nd ed. Elsevier; 2021.',
  'Moore KL, Dalley AF, Agur AMR. Clinically Oriented Anatomy. 9th ed. Wolters Kluwer; 2023.',
  'Norgren L et al. Inter-Society Consensus for the Management of Peripheral Arterial Disease (TASC II). J Vasc Surg. 2007;45(Suppl S):S5-S67.',
  'Aboyans V et al. 2017 ESC Guidelines on the diagnosis and treatment of peripheral arterial diseases. Eur Heart J. 2018;39:763-816.',
  'Gerhard-Herman MD et al. 2016 AHA/ACC guideline on the management of patients with lower extremity peripheral artery disease. Circulation. 2017;135:e726-e779.',
  'Rutherford RB et al. Recommended standards for reports dealing with lower extremity ischemia: revised version. J Vasc Surg. 1997;26:517-538.',
  'Fontaine R, Kim M, Kieny R. Die chirurgische Behandlung der peripheren Durchblutungsstörungen. Helv Chir Acta. 1954;21:499-533.',
  'Sandoval Y et al. Contemporary arterial access in the cardiac catheterization laboratory. JACC Cardiovasc Interv. 2017;10:2233-2241.',
  'Garrett PD et al. Fluoroscopic localization of the femoral head as a landmark for common femoral artery cannulation. Catheter Cardiovasc Interv. 2005;65:205-210.',
  'Attinger CE et al. Angiosomes of the foot and ankle and clinical implications for limb salvage. Plast Reconstr Surg. 2006;117(7 Suppl):261S-293S.',
  'Taylor GI, Palmer JH. The vascular territories (angiosomes) of the body: experimental study and clinical applications. Br J Plast Surg. 1987;40:113-141.',
  'Kiemeneij F. Left distal transradial access in the anatomical snuffbox for coronary angiography and interventions. EuroIntervention. 2017;13:851-857.',
  'Madhwal S et al. Predictors of difficult carotid stenting as determined by aortic arch angiography. J Invasive Cardiol. 2008;20:200-204.',
  'Uflacker R. Atlas of Vascular Anatomy: An Angiographic Approach. 2nd ed. Lippincott Williams and Wilkins; 2007. Drawings on this page are original schematics, not reproductions of the atlas.',
  'Naidu SS et al. SCAI expert consensus statement: 2016 best practices in the cardiac catheterization laboratory. Catheter Cardiovasc Interv. 2016;88:407-423.'
];

export const loc = (bag, lang) => (lang === 'en' ? bag.en : bag.tr);

export function viewById(id) {
  return VIEWS.find(view => view.id === id) || VIEWS[0];
}

export function viewBoxFor(viewId, modeId) {
  const view = viewById(viewId);
  const picked = view.modes.find(item => item.id === modeId) || view.modes[0];
  return picked.viewBox;
}

export function allStructures() {
  return VIEWS.flatMap(view => view.structures);
}

export function structuresFor(viewId, modeId) {
  return viewById(viewId).structures.filter(item => item.modes.includes(modeId));
}

export function findStructure(id) {
  return allStructures().find(item => item.id === id) || null;
}

export function hitPoint(item, modeId) {
  if (!item) return { x: 0, y: 0 };
  return item.hits?.[modeId] || item.hit;
}
