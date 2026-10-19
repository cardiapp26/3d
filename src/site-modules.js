// Module menu and page badges of the shared Cardia header (site-header.js).
// Plain data, so Node tests can read it.

const word = (tr, en) => ({ tr, en });

/** Module menu, in display order. A sub-page lists under its module. */
export const SITE_MODULES = Object.freeze([
  { id: 'anatomy', path: './', label: word('3D Anatomi', '3D Anatomy') },
  { id: 'exam', path: './exam/', label: word('Fizik muayene', 'Physical exam') },
  { id: 'hemo', path: './hemo/', label: word('Hemodinami', 'Hemodynamics') },
  { id: 'echo', path: './echo/', label: word('Eko', 'Echo') },
  {
    id: 'angio', path: './angio/', label: word('Anjiyografi', 'Angiography'),
    pages: [
      { id: 'angio', path: './angio/', label: word('C-kol stüdyosu', 'C-arm studio') },
      { id: 'angio-3d', path: './angio/3d/', label: word('3D koroner anatomi', '3D coronary anatomy') }
    ]
  },
  { id: 'ecg', path: './ecg/', label: word('EKG', 'ECG') },
  {
    id: 'eps', path: './eps/', label: word('EPS', 'EPS'),
    title: word('EPS laboratuvarı: canlı kayıt, vakalar, manevralar, ablasyon', 'EPS laboratory: live recording, cases, maneuvers, ablation'),
    pages: [
      { id: 'eps', path: './eps/', label: word('Laboratuvar', 'Laboratory') },
      { id: 'ep-anatomy', path: './eps/anatomy/', label: word('3D EP anatomisi', '3D EP anatomy') }
    ]
  },
  { id: 'pharmacology', path: './pharmacology/', label: word('Farmakoloji', 'Pharmacology') }
]);

/** Badge text of each page. */
export const SITE_BADGES = Object.freeze({
  anatomy: word('ANATOMİ STÜDYOSU', 'ANATOMY STUDIO'),
  exam: word('FİZİK MUAYENE', 'PHYSICAL EXAMINATION'),
  hemo: word('KATETERİZASYON VE HEMODİNAMİ', 'CATHETERIZATION & HEMODYNAMICS'),
  echo: word('EKOKARDİYOGRAFİ', 'ECHOCARDIOGRAPHY'),
  angio: word('KORONER ANJİYOGRAFİ', 'CORONARY ANGIOGRAPHY'),
  'angio-3d': word('KORONER ANJİYOGRAFİ', 'CORONARY ANGIOGRAPHY'),
  ecg: word('EKG FİZYOLOJİSİ', 'ECG PHYSIOLOGY'),
  eps: word('ELEKTROFİZYOLOJİ', 'ELECTROPHYSIOLOGY'),
  'ep-anatomy': word('ELEKTROFİZYOLOJİ', 'ELECTROPHYSIOLOGY'),
  pharmacology: word('KARDİYOVASKÜLER FARMAKOLOJİ', 'CARDIOVASCULAR PHARMACOLOGY')
});
