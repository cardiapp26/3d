// Source figures and clinical checks of Bradfield et al., 12-Lead
// Electrocardiographic Anatomy (JACC: Case Reports 2026;31(1):105998,
// DOI 10.1016/j.jaccas.2025.105998), placed inside the workbench topic they
// illustrate instead of a separate article tab. Each figure's `workbench`
// target says which topic owns it; each challenge follows its own target.
import { JACC_PAPER_META, JACC_FIGURES, JACC_CLINICAL_CHALLENGES } from './davinci-data.js';
import './davinci-figures.css';

const FIGURES = Object.values(JACC_FIGURES).sort((a, b) => a.num - b.num);
const figureSrc = (num, ext) => `../ecg-anatomy/figures/fig${num}.${ext}`;
const picture = (num, alt, lazy = true) => `<img src="${figureSrc(num, 'webp')}" alt="${alt}"${lazy ? ' loading="lazy"' : ''}>`;

/** Figures owned by a workbench topic, in paper order. */
export const figuresForTab = (tab) => FIGURES.filter((f) => f.workbench?.tab === tab);
export const challengesForTab = (tab) => JACC_CLINICAL_CHALLENGES.filter((c) => c.workbench?.tab === tab);

export function createDavinciFigures({ getLang = () => 'tr', onApply = () => {} } = {}) {
  const tr = (a, b) => getLang() === 'en' ? b : a;
  const key = () => getLang() === 'en' ? 'en' : 'tr';
  const panels = {}; // figure number -> selected panel id
  const answers = {}; // challenge id -> chosen option id
  let lightbox = null, lightboxNum = null, returnFocus = null;

  /* ----- Figures and checks for one topic ----- */
  function section(tab) {
    const figures = figuresForTab(tab), challenges = challengesForTab(tab);
    const root = document.createElement('section');
    root.className = 'da-sources';
    if (!figures.length && !challenges.length) return root;
    const nums = figures.map((f) => f.num).join(', ');
    root.innerHTML = `<header class="da-sources-head"><span class="da-eyebrow">${tr('MAKALEDEN', 'FROM THE PAPER')}</span><h4>${tr(`Bu konunun şekilleri · Şekil ${nums}`, `Figures for this topic · Fig. ${nums}`)}</h4><p>${tr('Şekli büyüt, panelleri oku, sonra “Laboratuvarda göster” ile aynı durumu yukarıdaki 3D modelde kur.', 'Zoom the figure, read its panels, then use “Show in the lab” to set up the same case in the 3D model above.')}</p></header><div class="da-source-figures"></div>${challenges.length ? `<div class="da-checks"><h4>${tr('Klinik kontrol', 'Clinical check')}</h4></div>` : ''}`;
    const list = root.querySelector('.da-source-figures');
    for (const fig of figures) list.append(figureCard(fig));
    const checks = root.querySelector('.da-checks');
    challenges.forEach((c) => checks?.append(challengeCard(c)));
    return root;
  }

  function figureCard(fig) {
    const k = key();
    const active = fig.panels.find((p) => p.id === panels[fig.num]) || fig.panels[0];
    const card = document.createElement('article');
    card.className = 'da-source-card';
    card.id = `da-card-${fig.num}`;
    card.innerHTML = `<button type="button" class="da-source-thumb" data-fig-zoom="${fig.num}" aria-label="${tr('Şekil', 'Figure')} ${fig.num} · ${tr('büyüt', 'zoom')}">${picture(fig.num, `${tr('Şekil', 'Figure')} ${fig.num}`)}<span>${tr('Büyüt', 'Zoom')}</span></button>
      <div class="da-source-body">
        <p class="da-source-num">${tr('ŞEKİL', 'FIGURE')} ${fig.num}</p>
        <h5>${fig.title[k]}</h5>
        <p class="da-source-sub">${fig.subtitle[k]}</p>
        <p class="da-source-take">${fig.takeaway[k]}</p>
        ${fig.panels.length ? `<div class="da-source-panels" role="group" aria-label="${tr('Paneller', 'Panels')}">${fig.panels.map((p) => `<button type="button" data-fig-panel="${p.id}" aria-pressed="${p.id === active.id}">${p.id}</button>`).join('')}</div><p class="da-source-panel"><strong>${active.id} · ${active.label[k]}.</strong> ${active.desc[k]}</p>` : ''}
        <details><summary>${tr('Makaledeki şekil açıklaması', 'Figure legend in the paper')}</summary><p>${fig.caption[k]}</p></details>
        <div class="da-source-actions"><button type="button" class="da-source-apply" data-fig-try="${fig.num}">${tr('Laboratuvarda göster ↑', 'Show in the lab ↑')}</button></div>
      </div>`;
    card.querySelector('[data-fig-zoom]').addEventListener('click', (e) => openLightbox(fig.num, e.currentTarget));
    card.querySelector('[data-fig-try]').addEventListener('click', () => onApply(fig.workbench));
    card.querySelectorAll('[data-fig-panel]').forEach((b) => b.addEventListener('click', () => {
      panels[fig.num] = b.dataset.figPanel;
      const next = figureCard(fig);
      card.replaceWith(next);
      next.querySelector(`[data-fig-panel="${b.dataset.figPanel}"]`)?.focus();
    }));
    return card;
  }

  function challengeCard(c) {
    const k = key();
    // The data lists the correct option first; rotate so position carries no hint.
    const index = JACC_CLINICAL_CHALLENGES.indexOf(c);
    const shift = 1 + index % (c.options.length - 1);
    const options = [...c.options.slice(shift), ...c.options.slice(0, shift)];
    const chosen = c.options.find((o) => o.id === answers[c.id]);
    const card = document.createElement('div');
    card.className = 'da-check';
    card.dataset.challenge = c.id;
    card.innerHTML = `<p class="da-check-title"><strong>${c.title[k]}</strong><span>${tr('Şekil', 'Fig.')} ${c.figureRef}</span></p><p class="da-check-prompt">${c.prompt[k]}</p><div class="da-check-options">${options.map((o) => `<button type="button" data-opt-id="${o.id}" class="${chosen ? (o.correct ? 'is-right' : o === chosen ? 'is-wrong' : '') : ''}" aria-pressed="${o === chosen}">${o.text[k]}</button>`).join('')}</div>${chosen ? `<div class="da-check-feedback ${chosen.correct ? 'is-right' : 'is-wrong'}" role="status"><p>${chosen.explanation[k]}</p><button type="button" class="da-source-apply" data-challenge-sim>${tr('Bu vakayı laboratuvarda kur ↑', 'Set up this case in the lab ↑')}</button></div>` : ''}`;
    card.querySelectorAll('[data-opt-id]').forEach((b) => b.addEventListener('click', () => {
      answers[c.id] = b.dataset.optId;
      const next = challengeCard(c);
      card.replaceWith(next);
      next.querySelector(`[data-opt-id="${b.dataset.optId}"]`)?.focus();
    }));
    card.querySelector('[data-challenge-sim]')?.addEventListener('click', () => onApply(c.workbench));
    return card;
  }

  /* ----- Paper identity for the workbench's source note ----- */
  function paperNote() {
    const k = key(), m = JACC_PAPER_META;
    return `<div class="da-paper-note"><p class="da-paper-note-title">${m.title[k]}: ${m.subtitle[k]}</p><p class="da-paper-note-authors">${m.authors.map((a) => a.name).join(', ')} · ${m.journal} ${m.year};${m.volume}(${m.issue}):${m.articleNumber}</p><ol>${m.takeHomeMessages.map((t) => `<li>${t[k]}</li>`).join('')}</ol><p class="da-paper-note-links"><a href="${m.doiUrl}" target="_blank" rel="noopener noreferrer">DOI ${m.doi} ↗</a> <a href="https://pubmed.ncbi.nlm.nih.gov/${m.pmid}/" target="_blank" rel="noopener noreferrer">PMID ${m.pmid} ↗</a> <a href="https://pmc.ncbi.nlm.nih.gov/articles/${m.pmcid}/" target="_blank" rel="noopener noreferrer">${m.pmcid} ↗</a></p><p class="da-paper-note-license">© ${tr('Yazarlar', 'The authors')} · ${m.journal} · <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0</a>. ${tr('Şekiller değiştirilmeden gösterilir; Türkçe metinler ve kısa çıkarımlar özet/çeviridir, makalenin yerine geçmez.', 'Figures are shown unmodified; short takeaways and Turkish texts are summaries/translations and do not replace the paper.')}</p></div>`;
  }

  /* ----- Figure lightbox ----- */
  function onKey(e) {
    if (lightboxNum === null) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft' && lightboxNum > 1) showLightbox(lightboxNum - 1);
    else if (e.key === 'ArrowRight' && lightboxNum < FIGURES.length) showLightbox(lightboxNum + 1);
  }
  function openLightbox(num, opener = document.activeElement) {
    returnFocus = opener;
    if (lightboxNum === null) window.addEventListener('keydown', onKey);
    showLightbox(num);
    lightbox.querySelector('.da-lightbox-close')?.focus();
  }
  function showLightbox(num) {
    const fig = JACC_FIGURES[`fig${num}`];
    if (!fig) return;
    const k = key();
    lightboxNum = num;
    lightbox?.remove();
    lightbox = document.createElement('div');
    lightbox.className = 'da-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', `${tr('Şekil', 'Figure')} ${fig.num}`);
    lightbox.innerHTML = `<div class="da-lightbox-bar"><div><h4>${tr('Şekil', 'Figure')} ${fig.num}: ${fig.title[k]}</h4><p>${fig.subtitle[k]}</p></div><div class="da-lightbox-tools"><button type="button" data-lb-try>${tr('Laboratuvarda göster', 'Show in the lab')}</button><button type="button" class="da-lightbox-close" aria-label="${tr('Kapat', 'Close')}">✕</button></div></div><div class="da-lightbox-body"><div class="da-lightbox-stage">${num > 1 ? `<button type="button" class="da-lightbox-prev" aria-label="${tr('Önceki şekil', 'Previous figure')}">‹</button>` : ''}${picture(fig.num, `${tr('Şekil', 'Figure')} ${fig.num}`, false)}${num < FIGURES.length ? `<button type="button" class="da-lightbox-next" aria-label="${tr('Sonraki şekil', 'Next figure')}">›</button>` : ''}</div><aside class="da-lightbox-side"><p class="da-source-take">${fig.takeaway[k]}</p>${fig.panels.map((p) => `<p class="da-source-panel"><strong>${p.id} · ${p.label[k]}.</strong> ${p.desc[k]}</p>`).join('')}<p class="da-lightbox-caption">${fig.caption[k]}</p><p class="da-lightbox-cite">Bradfield et al. · JACC: Case Reports 2026 · © ${'$'}{tr('Yazarlar', 'The authors')} · <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0</a> · ${'$'}{tr('Şekil değiştirilmeden gösterilir; metinler özet ve çeviridir.', 'Figure shown unmodified; texts are summaries and translations.')}</p></aside></div>`;
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    lightbox.querySelector('.da-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('[data-lb-try]').addEventListener('click', () => { closeLightbox(); onApply(fig.workbench); });
    lightbox.querySelector('.da-lightbox-prev')?.addEventListener('click', () => showLightbox(num - 1));
    lightbox.querySelector('.da-lightbox-next')?.addEventListener('click', () => showLightbox(num + 1));
    document.body.append(lightbox);
  }
  function closeLightbox() {
    if (lightboxNum === null) return;
    lightbox?.remove(); lightbox = null; lightboxNum = null;
    window.removeEventListener('keydown', onKey);
    returnFocus?.focus?.({ preventScroll: true });
  }

  return { section, paperNote, openLightbox, closeLightbox, destroy: closeLightbox };
}
