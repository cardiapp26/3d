// Module menu and page badges of the shared Cardia header (site-header.js).
// Plain data, so Node tests can read it.

const word = (tr, en) => ({ tr, en });

/**
 * Module menu, in display order. A module with `pages` lists them in its left
 * drawer (site-header.js); a page entry with `mode` opens that 3D lesson on the
 * page `page` hosts. `aliases` are pages that belong to a module without being
 * listed (they light the module up in the menu).
 */
export const SITE_MODULES = Object.freeze([
  { id: 'anatomy', path: './#/mode/anatomy', label: word('3D Anatomi', '3D Anatomy') },
  { id: 'pathophysiology', path: './pathophysiology/', label: word('Patofizyoloji', 'Pathophysiology') },
  { id: 'exam', path: './exam/', label: word('Fizik muayene', 'Physical exam') },
  { id: 'hemo', path: './hemo/', label: word('Hemodinami', 'Hemodynamics') },
  { id: 'echo', path: './echo/', label: word('Eko', 'Echo') },
  { id: 'cardiac-mr', path: './cardiac-mr/', label: word('Kardiyak MR', 'Cardiac MR') },
  { id: 'ct', path: './ct/', label: word('Kardiyak BT', 'Cardiac CT') },
  {
    id: 'angio', path: './angio/', label: word('Anjiyografi', 'Angiography'),
    pages: [
      { id: 'angio', path: './angio/', label: word('Koroner anjiyografi', 'Coronary angiography') },
      { id: 'angio-3d', path: './angio/3d/', label: word('3D koroner anatomi', '3D coronary anatomy') },
      { id: 'angio-transseptal', page: 'angio-3d', path: './angio/3d/', mode: 'transseptal', label: word('Transseptal geçiş ve septostomi', 'Transseptal access and septostomy') },
      { id: 'angio-physiology', path: './angio/physiology/', label: word('Koroner fizyoloji', 'Coronary physiology') },
      { id: 'angio-ivus', path: './angio/ivus/', label: word('Koroner IVUS', 'Coronary IVUS') },
      { id: 'angio-carotid', path: './angio/carotid/', label: word('Karotis', 'Carotid') },
      { id: 'angio-peripheral', path: './angio/peripheral/', label: word('Periferik', 'Peripheral') }
    ]
  },
  { id: 'ecg', path: './ecg/', label: word('EKG', 'ECG') },
  {
    id: 'eps', path: './eps/', label: word('EPS', 'EPS'),
    title: word('EPS laboratuvarı: canlı kayıt, vakalar, haritalama, pacing ve 3D EP anatomisi', 'EPS laboratory: live recording, cases, mapping, pacing and 3D EP anatomy'),
    // The 3D EP anatomy lessons open from the laboratory's section menu (src/eps/ep-section-nav.js).
    aliases: ['ep-anatomy']
  },
  { id: 'pharmacology', path: './pharmacology/', label: word('Farmakoloji', 'Pharmacology') }
]);

/** Badge text of each page. */
export const SITE_BADGES = Object.freeze({
  anatomy: word('ANATOMİ STÜDYOSU', 'ANATOMY STUDIO'),
  pathophysiology: word('KARDİYOVASKÜLER PATOFİZYOLOJİ', 'CARDIOVASCULAR PATHOPHYSIOLOGY'),
  exam: word('FİZİK MUAYENE', 'PHYSICAL EXAMINATION'),
  hemo: word('KATETERİZASYON VE HEMODİNAMİ', 'CATHETERIZATION & HEMODYNAMICS'),
  echo: word('EKOKARDİYOGRAFİ', 'ECHOCARDIOGRAPHY'),
  'cardiac-mr': word('KARDİYAK MR', 'CARDIAC MR'),
  ct: word('KARDİYAK BT', 'CARDIAC CT'),
  angio: word('KORONER ANJİYOGRAFİ', 'CORONARY ANGIOGRAPHY'),
  'angio-3d': word('KORONER ANJİYOGRAFİ', 'CORONARY ANGIOGRAPHY'),
  'angio-physiology': word('KORONER FİZYOLOJİ', 'CORONARY PHYSIOLOGY'),
  'angio-ivus': word('KORONER IVUS', 'CORONARY IVUS'),
  'angio-carotid': word('KAROTİS ANJİYOGRAFİ', 'CAROTID ANGIOGRAPHY'),
  'angio-peripheral': word('PERİFERİK ANJİYOGRAFİ', 'PERIPHERAL ANGIOGRAPHY'),
  ecg: word('EKG FİZYOLOJİSİ', 'ECG PHYSIOLOGY'),
  eps: word('ELEKTROFİZYOLOJİ', 'ELECTROPHYSIOLOGY'),
  'ep-anatomy': word('ELEKTROFİZYOLOJİ', 'ELECTROPHYSIOLOGY'),
  pharmacology: word('KARDİYOVASKÜLER FARMAKOLOJİ', 'CARDIOVASCULAR PHARMACOLOGY')
});
