// Figures and clinical checks of Bradfield et al., 12-Lead Electrocardiographic Anatomy
// (JACC: Case Reports 2026;31(1):105998, DOI 10.1016/j.jaccas.2025.105998), placed inside the
// workbench topic they illustrate. The paper's images are not reproduced: each figure panel is
// redrawn from our own model (davinci-figure-states.js), as a still of the 3D atlas heart and as
// the ECG strips the workbench computes for the same state.
import { JACC_PAPER_META, JACC_FIGURES, JACC_CLINICAL_CHALLENGES } from './davinci-data.js';
import { wavePath, workbenchAxis } from './davinci-model.js';
import { figurePanelState, figurePanelSignals, figurePanelTarget } from './davinci-figure-states.js';
import './davinci-figures.css';

const FIGURES = Object.values(JACC_FIGURES).sort((a, b) => a.num - b.num);
const VIEW_NAMES = { anterior: ['Önden', 'Anterior'], superior: ['Üstten', 'Superior'], left: ['Soldan', 'Left'], posterior: ['Arkadan', 'Posterior'] };
const SNAPSHOT_SIZE = { width: 720, height: 520 };

/** Figures owned by a workbench topic, in paper order. */
export const figuresForTab = (tab) => FIGURES.filter((f) => f.workbench?.tab === tab);
export const challengesForTab = (tab) => JACC_CLINICAL_CHALLENGES.filter((c) => c.workbench?.tab === tab);

export function createDavinciFigures({ getLang = () => 'tr', onApply = () => {} } = {}) {
  const tr = (a, b) => getLang() === 'en' ? b : a;
  const key = () => getLang() === 'en' ? 'en' : 'tr';
  const panels = {}; // figure number -> selected panel id
  const answers = {}; // challenge id -> chosen option id
  let lightbox = null, lightboxNum = null, returnFocus = null;

  /* ----- Model stills: one atlas render per figure panel, made lazily and cached ----- */
  let atlas = null;
  const stills = new Map(); // "num:panel" -> data URL (or '' when the atlas cannot render)
  const queue = [];
  let pumping = false;
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      observer.unobserve(e.target);
      request(e.target.querySelector('img[data-fig-model]')?.dataset.figModel);
    }), { rootMargin: '200px' })
    : null;

  function attachAtlas(next) {
    atlas = next;
    atlas?.element?.addEventListener('da-atlas-ready', pump);
  }
  function paint(stillKey) {
    const url = stills.get(stillKey);
    document.querySelectorAll(`img[data-fig-model="${stillKey}"]`).forEach((img) => {
      const box = img.closest('.da-model-anat');
      if (url) { img.src = url; img.hidden = false; box?.classList.add('is-ready'); }
      else box?.classList.add('is-failed');
    });
  }
  function request(stillKey) {
    if (!stillKey) return;
    if (stills.has(stillKey)) { paint(stillKey); return; }
    if (!queue.includes(stillKey)) queue.push(stillKey);
    pump();
  }
  function pump() {
    if (pumping || !queue.length || !atlas?.isReady?.()) return;
    pumping = true;
    requestAnimationFrame(() => {
      pumping = false;
      const stillKey = queue.shift();
      if (stillKey && !stills.has(stillKey)) {
        const [num, panelId] = stillKey.split(':');
        const state = figurePanelState(Number(num), panelId);
        let url = '';
        try {
          const signals = figurePanelSignals(state);
          url = atlas.snapshot({ state: { ...state, angle: workbenchAxis(state.tab, state), visibleLeads: signals.map((s) => s.id) }, view: state.cameraView, ...SNAPSHOT_SIZE }) || '';
        } catch (error) { console.warn('Figure model still failed', stillKey, error); }
        stills.set(stillKey, url);
      }
      if (stillKey) paint(stillKey);
      pump();
    });
  }
  /** Starts the stills of every model figure inside `root` once it is near the viewport. The
   *  image stays hidden until painted, so its visible box is what gets observed. */
  function hydrate(root, eager = false) {
    root.querySelectorAll('img[data-fig-model]').forEach((img) => {
      if (stills.has(img.dataset.figModel)) paint(img.dataset.figModel);
      else if (eager || !observer) request(img.dataset.figModel);
      else observer.observe(img.parentElement);
    });
  }

  /* ----- A figure panel drawn by the model: atlas still and ECG strips ----- */
  const leadName = (id) => id === '-aVR' ? '−aVR' : id;
  function strip(s, selected) {
    const name = leadName(s.id);
    return `<figure class="da-model-strip${selected ? ' is-selected' : ''}"><figcaption style="color:${s.color}">${name}</figcaption><svg viewBox="0 0 160 92" preserveAspectRatio="none" aria-hidden="true"><path class="da-paper" d="M0 23H160M0 46H160M0 69H160M32 0V92M64 0V92M96 0V92M128 0V92"/>${s.compare ? `<path class="da-trace-a" d="${wavePath(s.compare)}"/>` : ''}<path class="da-trace" d="${wavePath(s)}" style="stroke:${s.color}"/></svg></figure>`;
  }
  function modelFigure(fig, panelId, size = 'card') {
    const state = figurePanelState(fig.num, panelId);
    if (!state) return '';
    const signals = figurePanelSignals(state);
    const view = VIEW_NAMES[state.cameraView] || VIEW_NAMES.anterior;
    const stillKey = `${fig.num}:${panelId}`;
    const alt = `${tr('Şekil', 'Figure')} ${fig.num}${panelId ? ` ${panelId}` : ''} · ${tr('Cardia 3B atlasından çizim', 'drawn from the Cardia 3D atlas')}`;
    return `<div class="da-model-fig" data-size="${size}" data-layout="${signals.length > 3 ? 'six' : 'few'}">
      <div class="da-model-anat"><img data-fig-model="${stillKey}" alt="${alt}" hidden><span class="da-model-wait">${tr('Model çiziliyor…', 'Drawing from the model…')}</span><span class="da-model-tag">${tr('3B atlas', '3D atlas')} · ${tr(...view)}</span></div>
      <div class="da-model-ecg" role="img" aria-label="${tr('Modelin EKG şeritleri', 'Model ECG strips')}: ${signals.map((s) => leadName(s.id)).join(', ')}">${signals.map((s) => strip(s, s.id === state.selectedLead)).join('')}</div>
      ${state.compare ? `<p class="da-model-legend">${tr('Kesik gri: karşılaştırılan durum', 'Dashed grey: compared state')}</p>` : ''}
    </div>`;
  }

  /* ----- Figures and checks for one topic ----- */
  function section(tab) {
    const figures = figuresForTab(tab), challenges = challengesForTab(tab);
    const root = document.createElement('section');
    root.className = 'da-sources';
    if (!figures.length && !challenges.length) return root;
    const nums = figures.map((f) => f.num).join(', ');
    root.innerHTML = `<header class="da-sources-head"><span class="da-eyebrow">${tr('MAKALEDEN · MODELDE', 'FROM THE PAPER · IN OUR MODEL')}</span><h4>${tr(`Bu konunun şekilleri · Şekil ${nums}`, `Figures for this topic · Fig. ${nums}`)}</h4><p>${tr('Her şekil paneli makaledeki görsel yerine kendi 3B atlasımız ve EKG modelimizle yeniden çizilir. Paneli seç, sonra “Laboratuvarda göster” ile aynı durumu yukarıdaki modelde aç.', 'Each figure panel is redrawn with our own 3D atlas and ECG model instead of the paper’s image. Pick a panel, then use “Show in the lab” to open the same state in the model above.')}</p></header><div class="da-source-figures"></div>${challenges.length ? `<div class="da-checks"><h4>${tr('Klinik kontrol', 'Clinical check')}</h4></div>` : ''}`;
    const list = root.querySelector('.da-source-figures');
    for (const fig of figures) list.append(figureCard(fig));
    const checks = root.querySelector('.da-checks');
    challenges.forEach((c) => checks?.append(challengeCard(c)));
    queueMicrotask(() => hydrate(root));
    return root;
  }

  const activePanel = (fig) => fig.panels.find((p) => p.id === panels[fig.num]) || fig.panels[0];
  function figureCard(fig) {
    const k = key();
    const active = activePanel(fig);
    const card = document.createElement('article');
    card.className = 'da-source-card';
    card.id = `da-card-${fig.num}`;
    card.innerHTML = `<button type="button" class="da-source-thumb" data-fig-zoom="${fig.num}" aria-label="${tr('Şekil', 'Figure')} ${fig.num} ${active.id} · ${tr('büyüt', 'zoom')}">${modelFigure(fig, active.id)}<span class="da-source-zoom">${tr('Büyüt', 'Zoom')}</span></button>
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
    card.querySelector('[data-fig-try]').addEventListener('click', () => applyPanel(fig, active.id));
    card.querySelectorAll('[data-fig-panel]').forEach((b) => b.addEventListener('click', () => {
      panels[fig.num] = b.dataset.figPanel;
      const next = figureCard(fig);
      card.replaceWith(next);
      hydrate(next, true);
      next.querySelector(`[data-fig-panel="${b.dataset.figPanel}"]`)?.focus();
    }));
    return card;
  }
  function applyPanel(fig, panelId) {
    const state = figurePanelState(fig.num, panelId);
    onApply(state ? figurePanelTarget(state) : fig.workbench);
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

  /* ----- Small model figure for the workbench's evidence row ----- */
  function miniFigure(num) {
    const fig = JACC_FIGURES[`fig${num}`];
    if (!fig) return '';
    const panelId = activePanel(fig).id;
    return `<img data-fig-model="${fig.num}:${panelId}" alt="${tr('Şekil', 'Figure')} ${fig.num} ${panelId} · ${tr('model çizimi', 'model drawing')}" hidden>`;
  }

  /* ----- Paper identity for the workbench's source note ----- */
  function paperNote() {
    const k = key(), m = JACC_PAPER_META;
    return `<div class="da-paper-note"><p class="da-paper-note-title">${m.title[k]}: ${m.subtitle[k]}</p><p class="da-paper-note-authors">${m.authors.map((a) => a.name).join(', ')} · ${m.journal} ${m.year};${m.volume}(${m.issue}):${m.articleNumber}</p><ol>${m.takeHomeMessages.map((t) => `<li>${t[k]}</li>`).join('')}</ol><p class="da-paper-note-links"><a href="${m.doiUrl}" target="_blank" rel="noopener noreferrer">DOI ${m.doi} ↗</a> <a href="https://pubmed.ncbi.nlm.nih.gov/${m.pmid}/" target="_blank" rel="noopener noreferrer">PMID ${m.pmid} ↗</a> <a href="https://pmc.ncbi.nlm.nih.gov/articles/${m.pmcid}/" target="_blank" rel="noopener noreferrer">${m.pmcid} ↗</a></p><p class="da-paper-note-license">${tr('Makalenin şekil görselleri burada kullanılmaz. Her panel, Cardia’nın kendi 3B atlası ve şematik EKG modeliyle yeniden çizilir; Türkçe metinler ve kısa çıkarımlar özet/çeviridir, makalenin yerine geçmez. Özgün şekiller için makaleye bakın', 'The paper’s figure images are not used here. Each panel is redrawn with Cardia’s own 3D atlas and schematic ECG model; short takeaways and Turkish texts are summaries/translations and do not replace the paper. See the paper for the original figures')} (© ${tr('Yazarlar', 'The authors')} · ${m.journal} · <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0</a>).</p></div>`;
  }

  /* ----- Figure lightbox: the same model figure, large, with panel choice ----- */
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
    const active = activePanel(fig);
    lightboxNum = num;
    lightbox?.remove();
    lightbox = document.createElement('div');
    lightbox.className = 'da-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', `${tr('Şekil', 'Figure')} ${fig.num}`);
    lightbox.innerHTML = `<div class="da-lightbox-bar"><div><h4>${tr('Şekil', 'Figure')} ${fig.num}: ${fig.title[k]}</h4><p>${fig.subtitle[k]}</p></div><div class="da-lightbox-tools"><button type="button" data-lb-try>${tr('Laboratuvarda göster', 'Show in the lab')}</button><button type="button" class="da-lightbox-close" aria-label="${tr('Kapat', 'Close')}">✕</button></div></div><div class="da-lightbox-body"><div class="da-lightbox-stage">${num > 1 ? `<button type="button" class="da-lightbox-prev" aria-label="${tr('Önceki şekil', 'Previous figure')}">‹</button>` : ''}${modelFigure(fig, active.id, 'large')}${num < FIGURES.length ? `<button type="button" class="da-lightbox-next" aria-label="${tr('Sonraki şekil', 'Next figure')}">›</button>` : ''}</div><aside class="da-lightbox-side"><div class="da-source-panels" role="group" aria-label="${tr('Paneller', 'Panels')}">${fig.panels.map((p) => `<button type="button" data-lb-panel="${p.id}" aria-pressed="${p.id === active.id}">${p.id}</button>`).join('')}</div><p class="da-source-take">${fig.takeaway[k]}</p>${fig.panels.map((p) => `<p class="da-source-panel${p.id === active.id ? ' is-active' : ''}"><strong>${p.id} · ${p.label[k]}.</strong> ${p.desc[k]}</p>`).join('')}<p class="da-lightbox-caption">${fig.caption[k]}</p><p class="da-lightbox-cite">Bradfield et al. · JACC: Case Reports 2026 · ${tr('Görsel: Cardia modeli (3B atlas ve şematik EKG); makale şekli değildir. Metinler özet ve çeviridir.', 'Image: Cardia model (3D atlas and schematic ECG), not the paper’s figure. Texts are summaries and translations.')}</p></aside></div>`;
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    lightbox.querySelector('.da-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('[data-lb-try]').addEventListener('click', () => { closeLightbox(); applyPanel(fig, active.id); });
    lightbox.querySelector('.da-lightbox-prev')?.addEventListener('click', () => showLightbox(num - 1));
    lightbox.querySelector('.da-lightbox-next')?.addEventListener('click', () => showLightbox(num + 1));
    lightbox.querySelectorAll('[data-lb-panel]').forEach((b) => b.addEventListener('click', () => {
      panels[fig.num] = b.dataset.lbPanel;
      showLightbox(num);
      lightbox.querySelector(`[data-lb-panel="${b.dataset.lbPanel}"]`)?.focus();
      document.getElementById(`da-card-${fig.num}`)?.replaceWith(figureCard(fig));
      const card = document.getElementById(`da-card-${fig.num}`);
      if (card) hydrate(card);
    }));
    document.body.append(lightbox);
    hydrate(lightbox, true);
  }
  function closeLightbox() {
    if (lightboxNum === null) return;
    lightbox?.remove(); lightbox = null; lightboxNum = null;
    window.removeEventListener('keydown', onKey);
    returnFocus?.isConnected && returnFocus.focus?.({ preventScroll: true });
  }

  return {
    section, paperNote, miniFigure, hydrate, attachAtlas, openLightbox, closeLightbox,
    destroy() { closeLightbox(); observer?.disconnect(); atlas?.element?.removeEventListener('da-atlas-ready', pump); queue.length = 0; }
  };
}
