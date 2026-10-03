// Links from the 3D simulator to the EPS laboratory page (eps/index.html):
// the header button, and the card of the ablation lesson steps that carry a
// recording (`egm` in content.js), which opens that recording in the EPS page
// (#/clip/<id>). The two pages share the language choice (entry-language.js).

export const EPS_URL = './eps/';

/** EPS address of one recording. */
export const epsClipUrl = (clip) => `${EPS_URL}#/clip/${encodeURIComponent(clip)}`;

/*
 * Recordings of the ablation lesson steps. title: the EPS strip title (a
 * diagnosis clip opens neutral, mechanism hidden); zone: the pathway arc the
 * 3D scene shows with the step, only once the clip's reading is open (not for
 * a neutral diagnosis clip). scripts/eps/test-eps-link.mjs checks this table
 * against the EPS catalog and the lesson steps.
 */
export const LESSON_CLIPS = Object.freeze({
  'flutter-svt': { zone: null, title: { tr: 'Taşikardi kaydı (mekanizma gizli)', en: 'Tachycardia recording (mechanism hidden)' } },
  'avnrt-typ-svt': { zone: null, title: { tr: 'Taşikardi kaydı (mekanizma gizli)', en: 'Tachycardia recording (mechanism hidden)' } },
  'af-pvi-baseline': { zone: null, title: { tr: 'Taşikardi kaydı (mekanizma gizli)', en: 'Tachycardia recording (mechanism hidden)' } },
  sinus: { zone: 'koch-slow-pathway', title: { tr: 'Sinüs ritmi: AH ve HV', en: 'Sinus rhythm: AH and HV' } }
});

const WORDS = {
  tr: {
    headerTitle: 'EPS laboratuvarı: canlı kayıt, vakalar, manevralar, ablasyon',
    eyebrow: 'ELEKTROFİZYOLOJİ KAYDI',
    text: 'Bu adımın sentetik intrakardiyak kaydı EPS laboratuvarında tam ekran açılır: kanal seçimi, kaliper, manevralar ve canlı kayıt orada.',
    open: 'EPS laboratuvarında aç'
  },
  en: {
    headerTitle: 'EPS laboratory: live recording, cases, maneuvers, ablation',
    eyebrow: 'ELECTROPHYSIOLOGY RECORDING',
    text: 'The synthetic intracardiac recording of this step opens full screen in the EPS laboratory, with channel choice, calipers, maneuvers and live recording.',
    open: 'Open in the EPS laboratory'
  }
};
const words = (lang) => WORDS[lang === 'en' ? 'en' : 'tr'];

export function epsLinkMarkup(lang) {
  return `<a id="eps-link" class="eps-link" href="${EPS_URL}" title="${words(lang).headerTitle}"><span class="eps-link-icon" aria-hidden="true">⚡</span>EPS</a>`;
}

export function syncEpsLink(lang) {
  const link = typeof document !== 'undefined' ? document.querySelector('#eps-link') : null;
  if (link) link.title = words(lang).headerTitle;
}

/**
 * Lesson card in `mount`: show(clip) opens it for a recording of LESSON_CLIPS
 * (anything else hides it); render() follows the language.
 * @param {HTMLElement|null} mount
 * @param {{ getLang: () => string }} options
 */
export function createEpsHandoff(mount, { getLang }) {
  let clip = null;
  const doc = mount?.ownerDocument;
  if (!doc) return { show() {}, render() {}, getClip: () => null };
  const node = (tag, cls) => Object.assign(doc.createElement(tag), cls ? { className: cls } : {});
  const eyebrow = node('p', 'eps-handoff-eyebrow');
  const title = node('p', 'eps-handoff-title');
  const text = node('p', 'eps-handoff-text');
  const link = node('a', 'eps-handoff-link');
  link.setAttribute('data-eps-handoff-link', '');
  mount.append(eyebrow, title, text, link);

  function render() {
    mount.hidden = !clip;
    if (!clip) return;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const w = words(lang);
    eyebrow.textContent = w.eyebrow;
    title.textContent = LESSON_CLIPS[clip].title[lang];
    text.textContent = w.text;
    link.textContent = w.open;
    link.href = epsClipUrl(clip);
  }

  return {
    show(next) { clip = next && LESSON_CLIPS[next] ? next : null; render(); },
    render,
    getClip: () => clip
  };
}
