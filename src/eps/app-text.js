// Shell texts of the EPS laboratory (header, language switch, site notice),
// the language choice (?lang= in the address, then the saved choice, then
// Turkish) and the panel view named in the address hash.

export const LANGS = Object.freeze(['tr', 'en']);
export const LANG_KEY = 'eps-lang';

export const APP_TEXT = Object.freeze({
  tr: {
    title: 'EPS Laboratuvarı',
    subtitle: 'Elektrofizyoloji çalışması kayıt sistemi',
    langLabel: 'Dil',
    shortcuts: 'Boşluk: dondur / devam',
    disclaimer: 'Bilgilendirme ve eğitim amaçlıdır. Kayıtlar, eğriler ve sayısal değerler öğretim için tasarlanmış sentetik verilerdir; tanı veya tedavi kararında kullanılmaz. Klinik bilgi için uzman hekime ve doğrulanmış kaynaklara başvurun.'
  },
  en: {
    title: 'EPS Laboratory',
    subtitle: 'Electrophysiology study recording system',
    langLabel: 'Language',
    shortcuts: 'Space: freeze / resume',
    disclaimer: 'For information and teaching only. Recordings, curves and values are synthetic teaching data designed for learning; do not use them for diagnosis or treatment decisions. For clinical information, consult a specialist and verified sources.'
  }
});

/** Language from the query string, then the stored choice, else Turkish. */
export function resolveLang(search = '', stored = null) {
  const query = new URLSearchParams(search).get('lang');
  if (LANGS.includes(query)) return query;
  return LANGS.includes(stored) ? stored : 'tr';
}

/** Panel view named in the address (#/live, #/diagnosis ...); live by default. */
export function viewFromHash(hash = '', views = []) {
  const id = String(hash).replace(/^#\/?/, '');
  return views.includes(id) ? id : 'live';
}
