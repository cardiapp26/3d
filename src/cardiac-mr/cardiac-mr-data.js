// Interface text, structure labels and planning steps (TR/EN).
// Source: Kramer CM, et al. J Cardiovasc Magn Reson 2020;22:17 (PMC7038611).

export const SOURCE_URL = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/';

export const UI = {
  tr: {
    title: 'Kardiyak MR', eyebrow: 'GÖRÜNTÜLEME ÇALIŞMA ALANI',
    intro: 'SCMR 2020 standart protokolüne göre düzlem planlama, standart kesitler ve temel sekanslar.',
    badge: 'Özgün eğitim şeması',
    planningTitle: 'Düzlem planlama', planningSteps: 'Planlama adımları',
    sourceImg: 'Kaynak görüntü', resultImg: 'Elde edilen kesit', step: 'Adım',
    dialTitle: 'LV çevresinde uzun eksen düzlemleri',
    dialCaption: 'Orta SAX, apeksten bakış; AHA 17 segment konumları',
    dialNote: 'İlk 4 boşluk (yatay uzun eksen) 2 boşluk düzlemine dik planlanır, sonra SAX üzerinde LV ve RV ortasından geçecek şekilde düzeltilir.',
    sectionsTitle: 'Standart kesitler', sectionsGroup: 'Kesit seçimi', labels: 'Etiketler', legend: 'Kısaltmalar ve yapılar',
    sequencesTitle: 'Sekanslar', sequencesGroup: 'Sekans seçimi',
    purpose: 'Amaç', how: 'Ne zaman ve nasıl', measures: 'Ne ölçer', pitfall: 'Tuzak',
    illustrative: 'Şematik örnek; ölçüm değildir',
    disclaimer: 'Şemalar hasta MR görüntüsü değildir ve ölçüm ya da tanı üretmez. Sekans seçimi hasta görüntüsü sentezlemez; her sekans için yalnızca özgün bir öğretim şeması gösterilir. Gösterilen sayılar şemadan hesaplanan örneklerdir.',
    sourceTitle: 'Kaynak', reference: 'Kramer CM, ve ark. Standart kardiyovasküler MR protokolleri: 2020 güncellemesi. J Cardiovasc Magn Reson 2020;22:17',
    protocolNote: 'Normal değer aralıkları ve kantitatif perfüzyon ayrı SCMR belgelerinde ele alınır; 2025 SCMR belgeleri bu protokolün yerini almaz.',
    reset: 'Başlangıca dön', stack: 'SAX yığını', longAxis: 'Uzun eksen', lvCentre: 'LV merkezi', avCentre: 'Aort kapağı merkezi',
    apexMitral: 'apeks-mitral merkez', base: 'Bazal', midLevel: 'Orta', apexLevel: 'Apikal'
  },
  en: {
    title: 'Cardiac MR', eyebrow: 'IMAGING WORKSPACE',
    intro: 'Plane planning, standard views and core sequences following the SCMR 2020 standardized protocols.',
    badge: 'Original teaching schematic',
    planningTitle: 'Plane planning', planningSteps: 'Planning steps',
    sourceImg: 'Source image', resultImg: 'Resulting view', step: 'Step',
    dialTitle: 'Long-axis planes around the LV',
    dialCaption: 'Mid SAX viewed from the apex; AHA 17-segment positions',
    dialNote: 'The initial 4-chamber (horizontal long axis) is planned perpendicular to the 2-chamber, then refined on the SAX to pass through the LV and RV.',
    sectionsTitle: 'Standard views', sectionsGroup: 'View selection', labels: 'Labels', legend: 'Abbreviations and structures',
    sequencesTitle: 'Sequences', sequencesGroup: 'Sequence selection',
    purpose: 'Purpose', how: 'When and how', measures: 'What it measures', pitfall: 'Pitfall',
    illustrative: 'Illustrative schematic; not a measurement',
    disclaimer: 'Schematics are not patient MR images and produce no measurements or diagnoses. Selecting a sequence does not synthesize patient images; each sequence shows only an original teaching schematic. Numbers shown are examples computed from the schematic.',
    sourceTitle: 'Source', reference: 'Kramer CM, et al. Standardized cardiovascular magnetic resonance imaging (CMR) protocols: 2020 update. J Cardiovasc Magn Reson 2020;22:17',
    protocolNote: 'Reference ranges and quantitative perfusion are covered by separate SCMR documents; the 2025 SCMR documents do not replace this protocol.',
    reset: 'Reset workspace', stack: 'SAX stack', longAxis: 'Long axis', lvCentre: 'LV centre', avCentre: 'Aortic valve centre',
    apexMitral: 'apex-mitral centre', base: 'Basal', midLevel: 'Mid', apexLevel: 'Apical'
  }
};

/** Short label drawn in the SVG and full name for the legend. */
export const STRUCTURES = {
  lv: { short: { tr: 'LV', en: 'LV' }, full: { tr: 'Sol ventrikül', en: 'Left ventricle' } },
  rv: { short: { tr: 'RV', en: 'RV' }, full: { tr: 'Sağ ventrikül', en: 'Right ventricle' } },
  la: { short: { tr: 'LA', en: 'LA' }, full: { tr: 'Sol atriyum', en: 'Left atrium' } },
  ra: { short: { tr: 'RA', en: 'RA' }, full: { tr: 'Sağ atriyum', en: 'Right atrium' } },
  ao: { short: { tr: 'Ao', en: 'Ao' }, full: { tr: 'Aort kökü', en: 'Aortic root' } },
  lvot: { short: { tr: 'LVOT', en: 'LVOT' }, full: { tr: 'Sol ventrikül çıkış yolu', en: 'LV outflow tract' } },
  mv: { short: { tr: 'Mitral kapak', en: 'Mitral valve' }, full: { tr: 'Mitral kapak', en: 'Mitral valve' } },
  tv: { short: { tr: 'Triküspit\nkapak', en: 'Tricuspid\nvalve' }, full: { tr: 'Triküspit kapak', en: 'Tricuspid valve' } },
  av: { short: { tr: 'Aort kapağı', en: 'Aortic valve' }, full: { tr: 'Aort kapağı', en: 'Aortic valve' } },
  ivs: { short: { tr: 'Septum', en: 'Septum' }, full: { tr: 'İnterventriküler septum', en: 'Interventricular septum' } },
  'wall-ant': { short: { tr: 'Anterior duvar', en: 'Anterior wall' }, full: { tr: 'Anterior duvar', en: 'Anterior wall' } },
  'wall-inf': { short: { tr: 'İnferior duvar', en: 'Inferior wall' }, full: { tr: 'İnferior duvar', en: 'Inferior wall' } },
  'wall-lat': { short: { tr: 'Lateral\nduvar', en: 'Lateral\nwall' }, full: { tr: 'Lateral duvar', en: 'Lateral wall' } },
  'wall-as': { short: { tr: 'Anteroseptal duvar', en: 'Anteroseptal wall' }, full: { tr: 'Anteroseptal duvar', en: 'Anteroseptal wall' } },
  'wall-il': { short: { tr: 'İnferolateral duvar', en: 'Inferolateral wall' }, full: { tr: 'İnferolateral duvar', en: 'Inferolateral wall' } },
  apex: { short: { tr: 'Apeks', en: 'Apex' }, full: { tr: 'LV apeksi', en: 'LV apex' } },
  laa: { short: { tr: 'LAA', en: 'LAA' }, full: { tr: 'Sol atriyal apendiks', en: 'Left atrial appendage' } },
  'pm-al': { short: { tr: 'AL papiller kas', en: 'AL papillary m.' }, full: { tr: 'Anterolateral papiller kas', en: 'Anterolateral papillary muscle' } },
  'pm-pm': { short: { tr: 'PM papiller kas', en: 'PM papillary m.' }, full: { tr: 'Posteromedial papiller kas', en: 'Posteromedial papillary muscle' } },
  'rvip-ant': { short: { tr: 'Anterior RV\ninsersiyonu', en: 'Anterior RV\ninsertion' }, full: { tr: 'Anterior RV insersiyon noktası', en: 'Anterior RV insertion point' } },
  'rvip-inf': { short: { tr: 'İnferior RV\ninsersiyonu', en: 'Inferior RV\ninsertion' }, full: { tr: 'İnferior RV insersiyon noktası', en: 'Inferior RV insertion point' } },
  dao: { short: { tr: 'İnen Ao', en: 'Desc. Ao' }, full: { tr: 'İnen aorta', en: 'Descending aorta' } },
  spine: { short: { tr: 'Omurga', en: 'Spine' }, full: { tr: 'Vertebra korpusu', en: 'Vertebral body' } }
};

/** Structures every section schematic must label. */
export const SECTION_STRUCTURES = {
  sax: ['lv', 'rv', 'ivs', 'wall-ant', 'wall-inf', 'wall-lat', 'pm-al', 'pm-pm', 'rvip-ant', 'rvip-inf'],
  '2ch': ['lv', 'la', 'mv', 'wall-ant', 'wall-inf', 'apex', 'laa'],
  '3ch': ['lv', 'la', 'ao', 'lvot', 'mv', 'av', 'wall-as', 'wall-il', 'apex'],
  '4ch': ['lv', 'rv', 'la', 'ra', 'mv', 'tv', 'ivs', 'wall-lat', 'apex'],
  axial: ['lv', 'rv', 'la', 'ra', 'dao', 'spine', 'apex', 'mv'],
  basal: ['lv', 'rv', 'mv', 'lvot', 'av']
};

export const SECTIONS = [
  { id: 'sax', short: 'SAX', label: { tr: 'Kısa eksen (orta)', en: 'Short axis (mid)' }, note: { tr: 'Apeksten bakış: RV görüntünün solunda, anterior yukarıda.', en: 'Viewed from the apex: RV on image left, anterior up.' } },
  { id: '2ch', short: '2CH', label: { tr: 'İki boşluk (dikey uzun eksen)', en: 'Two-chamber (vertical long axis)' }, note: { tr: 'Anterior duvar yukarıda, inferior duvar aşağıda; LA görüntünün sağ üstünde.', en: 'Anterior wall up, inferior wall down; LA at image upper right.' } },
  { id: '3ch', short: '3CH', label: { tr: 'Üç boşluk (LVOT)', en: 'Three-chamber (LVOT)' }, note: { tr: 'Aort kökü öndedir (yukarıda); LA arkada, mitral kapağın ötesinde.', en: 'The aortic root is anterior (up); the LA is posterior, beyond the mitral valve.' } },
  { id: '4ch', short: '4CH', label: { tr: 'Dört boşluk (yatay uzun eksen)', en: 'Four-chamber (horizontal long axis)' }, note: { tr: 'RV görüntünün solunda; triküspit anulus mitralden biraz daha apikaldedir.', en: 'RV on image left; the tricuspid annulus sits slightly more apical than the mitral.' } }
];

export const STEPS = [
  {
    id: 'axial-2ch', short: { tr: 'Aksiyel → 2CH', en: 'Axial → 2CH' },
    source: { tr: 'Aksiyel lokalizör', en: 'Axial localizer' }, result: '2ch',
    bullets: {
      tr: ['Planlama çizgisi apeksten ve mitral kapağın ortasından geçer.', 'Sonuç: iki boşluk (dikey uzun eksen) görüntüsü; LV, LA, anterior ve inferior duvarlar.'],
      en: ['The planning line passes through the apex and the middle of the mitral valve.', 'Result: the two-chamber (vertical long axis) view with LV, LA, anterior and inferior walls.']
    }
  },
  {
    id: '2ch-4ch', short: { tr: '2CH → 4CH', en: '2CH → 4CH' },
    source: { tr: 'İki boşluk', en: 'Two-chamber' }, result: '4ch',
    bullets: {
      tr: ['4 boşluk düzlemi 2 boşluk düzlemine diktir; 2 boşluk görüntüsünde apeks-mitral merkez çizgisi olarak görünür.', 'Düzlem apeksten, mitral ve triküspit kapakların ortasından geçer; SAX üzerinde LV ve RV ortasından geçecek şekilde düzeltilir.'],
      en: ['The 4-chamber plane is perpendicular to the 2-chamber plane; on the 2-chamber image it appears as the apex to mitral centre line.', 'The plane passes through the apex and the middle of the mitral and tricuspid valves; refine it on the SAX through the LV and RV.']
    }
  },
  {
    id: 'sax-stack', short: { tr: '2CH + 4CH → SAX', en: '2CH + 4CH → SAX' },
    source: { tr: 'İki boşluk ve dört boşluk', en: 'Two-chamber and four-chamber' }, result: 'sax',
    bullets: {
      tr: ['Kesitler LV uzun eksenine (apeks-mitral merkez) diktir ve iki uzun eksen görüntüsünde birlikte kontrol edilir.', 'Yığın bazalden apekse eşit aralıklıdır; mitral anulusa paralel olması gerekmez.', 'Kesit kalınlığı 6–8 mm, aralık 2–4 mm (toplam 10 mm); hacimler ve EF bu yığından hesaplanır.'],
      en: ['Slices are perpendicular to the LV long axis (apex to mitral centre), checked on both long-axis images.', 'The stack runs base to apex at equal spacing; it need not be parallel to the mitral annulus.', 'Slice thickness 6–8 mm with 2–4 mm gaps (10 mm in total); volumes and EF come from this stack.']
    }
  },
  {
    id: 'basal-3ch', short: { tr: 'Bazal SAX → 3CH', en: 'Basal SAX → 3CH' },
    source: { tr: 'Bazal kısa eksen', en: 'Basal short axis' }, result: '3ch',
    bullets: {
      tr: ['Bazal SAX üzerinde çizgi LV merkezinden ve LVOT/aort kapağından geçer.', 'Sonuç: apeks, mitral merkez ve aort kapağını içeren üç boşluk (LVOT) görüntüsü.'],
      en: ['On the basal SAX the line passes through the LV centre and the LVOT/aortic valve.', 'Result: the three-chamber (LVOT) view containing the apex, mitral centre and aortic valve.']
    }
  }
];

export const DIAL_PLANES = [
  { plane: '2ch', label: { tr: '2CH: anterior-inferior', en: '2CH: anterior-inferior' } },
  { plane: '4ch', label: { tr: '4CH: inferoseptal-anterolateral (RV içinden)', en: '4CH: inferoseptal-anterolateral (through RV)' } },
  { plane: '3ch', label: { tr: '3CH: anteroseptal-inferolateral (LVOT içinden)', en: '3CH: anteroseptal-inferolateral (through LVOT)' } }
];

export const SEGMENT_NAMES = {
  anterior: { tr: 'Anterior', en: 'Anterior' }, anterolateral: { tr: 'Anterolateral', en: 'Anterolateral' },
  inferolateral: { tr: 'İnferolateral', en: 'Inferolateral' }, inferior: { tr: 'İnferior', en: 'Inferior' },
  inferoseptal: { tr: 'İnferoseptal', en: 'Inferoseptal' }, anteroseptal: { tr: 'Anteroseptal', en: 'Anteroseptal' }
};

export const ORIENTATION = {
  tr: { right: 'Sağ', left: 'Sol', anterior: 'Ön', posterior: 'Arka' },
  en: { right: 'R', left: 'L', anterior: 'Ant', posterior: 'Post' }
};
