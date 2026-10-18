// Links from the standalone module pages (EPS, pharmacology, ECG, angiography,
// echo) to the 3D lesson pages; renderShell of each page keeps them in the
// chosen language.
const LABELS = Object.freeze({
  exam: { tr: 'Fizik muayene', en: 'Physical exam' },
  hemo: { tr: 'Hemodinami', en: 'Hemodynamics' },
  'ep-anatomy': { tr: '3D EP anatomisi', en: '3D EP anatomy' },
  'angio-3d': { tr: '3D koroner anjiyo', en: '3D coronary angio' }
});

export function syncModuleNav(lang, doc = globalThis.document) {
  const key = lang === 'en' ? 'en' : 'tr';
  doc?.querySelectorAll('[data-module-link]').forEach(link => {
    const words = LABELS[link.dataset.moduleLink];
    if (words) link.textContent = words[key];
  });
}
