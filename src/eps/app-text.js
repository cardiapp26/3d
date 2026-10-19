// Shell texts of the EPS laboratory (page title, language switch, shortcut
// hint, site notice), the language choice (?lang= in the address,
// else the choice shared with the 3D page) and the panel view named in the
// address hash (a tab, or one recording: #/clip/<id>).

export const LANGS = Object.freeze(['tr', 'en']);

export const APP_TEXT = Object.freeze({
  tr: {
    title: 'EPS Laboratuvarı',
    langLabel: 'Dil',
    shortcuts: 'Boşluk: dondur / devam',
    disclaimer: 'Bilgilendirme ve eğitim amaçlıdır. Kayıtlar, eğriler ve sayısal değerler öğretim için tasarlanmış sentetik verilerdir; tanı veya tedavi kararında kullanılmaz. Klinik bilgi için uzman hekime ve doğrulanmış kaynaklara başvurun.'
  },
  en: {
    title: 'EPS Laboratory',
    langLabel: 'Language',
    shortcuts: 'Space: freeze / resume',
    disclaimer: 'For information and teaching only. Recordings, curves and values are synthetic teaching data designed for learning; do not use them for diagnosis or treatment decisions. For clinical information, consult a specialist and verified sources.'
  }
});

/** Language from the query string, else the fallback (the shared choice), else Turkish. */
export function resolveLang(search = '', fallback = null) {
  const query = new URLSearchParams(search).get('lang');
  if (LANGS.includes(query)) return query;
  return LANGS.includes(fallback) ? fallback : 'tr';
}

/** Panel view named in the address (#/live, #/diagnosis ...); live by default. */
export function viewFromHash(hash = '', views = []) {
  const id = String(hash).replace(/^#\/?/, '');
  return views.includes(id) ? id : 'live';
}

/** Recording named in the address (#/clip/<id>, the 3D lessons link here), or null. */
export function clipFromHash(hash = '') {
  const match = /^#\/?clip\/([\w-]+)$/.exec(String(hash));
  return match ? match[1] : null;
}
