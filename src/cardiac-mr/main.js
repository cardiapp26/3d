import { mountSiteHeader } from '../site-header.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { UI, STEPS, SECTIONS, SECTION_STRUCTURES, STRUCTURES, DIAL_PLANES, SOURCE_URL } from './cardiac-mr-data.js';
import { SEQUENCES, LGE_PATTERNS, LGE_NOTES } from './cmr-sequences-data.js';
import { planningStep, dialSvg } from './cmr-planning.js';
import { sectionSvg } from './cmr-sections.js';
import { cineSvg, lgeSvg, t1Svg, t2Svg } from './cmr-seq-tissue.js';
import { pcSvg, perfusionSvg, mraSvg } from './cmr-seq-flow.js';
import { escapeText as esc } from './cmr-svg.js';
import './cardiac-mr.css';

const DEFAULT_STATE = Object.freeze({ step: STEPS[0].id, section: 'sax', sequence: 'cine', lgePattern: 'subendo', labels: true });
const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
let state = { ...DEFAULT_STATE };
const mount = document.querySelector('[data-cmr-root]');

const SCHEMATICS = {
  cine: cineSvg, lge: l => lgeSvg(l, state.lgePattern), t1: t1Svg, t2: t2Svg, pc: pcSvg, perfusion: perfusionSvg, mra: mraSvg
};

const pressed = on => `aria-pressed="${on}"`;
const shortName = id => STRUCTURES[id].short[lang].replace(/\n/g, ' ');

function labelsButton(t) {
  return `<button type="button" class="cmr-toggle" data-cmr-labels ${pressed(state.labels)}>${t.labels}</button>`;
}

function planningPanel(t) {
  const { step, sources, result } = planningStep(state.step, { lang, labels: state.labels });
  const resultName = SECTIONS.find(s => s.id === step.result).label[lang];
  const tabs = STEPS.map((s, i) => `<button type="button" data-cmr-step="${s.id}" ${pressed(s.id === state.step)}><span class="cmr-step-num">${i + 1}</span><span>${esc(s.short[lang])}</span></button>`).join('');
  const dialList = DIAL_PLANES.map(d => `<li class="cmr-dial-key-${d.plane}">${esc(d.label[lang])}</li>`).join('');
  return `<section class="cmr-panel" aria-labelledby="cmr-planning-title">
    <div class="cmr-panel-head"><h2 id="cmr-planning-title">${t.planningTitle}</h2>${labelsButton(t)}</div>
    <div class="cmr-steps" role="group" aria-label="${t.planningSteps}">${tabs}</div>
    <div class="cmr-plan-grid" data-cmr-step-view="${step.id}">
      <figure class="cmr-fig cmr-fig-source${sources.length > 1 ? ' cmr-fig-pair' : ''}"><div class="cmr-fig-svgs" data-cmr-source>${sources.join('')}</div><figcaption>${t.sourceImg}: ${esc(step.source[lang])}</figcaption></figure>
      <div class="cmr-arrow" aria-hidden="true">→</div>
      <figure class="cmr-fig"><div class="cmr-fig-svgs" data-cmr-result>${result}</div><figcaption>${t.resultImg}: ${esc(resultName)}</figcaption></figure>
    </div>
    <ul class="cmr-bullets" data-cmr-step-text>${step.bullets[lang].map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    <div class="cmr-dial">
      <figure class="cmr-fig cmr-fig-dial">${dialSvg({ lang })}<figcaption>${t.dialCaption}</figcaption></figure>
      <div><h3>${t.dialTitle}</h3><ul class="cmr-dial-list">${dialList}</ul><p class="cmr-note" data-cmr-dial-note>${t.dialNote}</p></div>
    </div>
  </section>`;
}

function sectionsPanel(t) {
  const sec = SECTIONS.find(s => s.id === state.section);
  const tabs = SECTIONS.map(s => `<button type="button" data-cmr-section="${s.id}" ${pressed(s.id === state.section)}><strong>${s.short}</strong><span>${esc(s.label[lang])}</span></button>`).join('');
  const legend = SECTION_STRUCTURES[sec.id].map(id => `<li><b>${esc(shortName(id))}</b><span>${esc(STRUCTURES[id].full[lang])}</span></li>`).join('');
  return `<section class="cmr-panel" aria-labelledby="cmr-sections-title">
    <div class="cmr-panel-head"><h2 id="cmr-sections-title">${t.sectionsTitle}</h2>${labelsButton(t)}</div>
    <div class="cmr-tabs" role="group" aria-label="${t.sectionsGroup}">${tabs}</div>
    <div class="cmr-section-grid">
      <figure class="cmr-fig" data-cmr-section-view="${sec.id}">${sectionSvg(sec.id, { lang, labels: state.labels, title: sec.label[lang] })}<figcaption>${esc(sec.note[lang])}</figcaption></figure>
      <div class="cmr-legend"><h3>${t.legend}</h3><ul>${legend}</ul></div>
    </div>
  </section>`;
}

function sequencePanel(t) {
  const seq = SEQUENCES.find(s => s.id === state.sequence);
  const buttons = SEQUENCES.map(s => `<button type="button" data-cmr-sequence="${s.id}" ${pressed(s.id === state.sequence)}>${esc(s.label[lang])}</button>`).join('');
  const pattern = LGE_PATTERNS.find(p => p.id === state.lgePattern);
  const chips = seq.id === 'lge'
    ? `<div class="cmr-chips" role="group" aria-label="LGE">${LGE_PATTERNS.map(p => `<button type="button" class="cmr-chip cmr-chip-${p.group}" data-cmr-lge="${p.id}" ${pressed(p.id === state.lgePattern)}>${esc(p.label[lang])}</button>`).join('')}</div><p class="cmr-note" data-cmr-lge-note>${esc(LGE_NOTES[pattern.group][lang])}</p>`
    : '';
  return `<section class="cmr-panel" aria-labelledby="cmr-seq-title">
    <div class="cmr-panel-head"><h2 id="cmr-seq-title">${t.sequencesTitle}</h2><span class="cmr-badge-sm">${t.badge}</span></div>
    <div class="cmr-seq-buttons" role="group" aria-label="${t.sequencesGroup}">${buttons}</div>
    <div class="cmr-seq-grid">
      <figure class="cmr-fig" data-cmr-seq-schematic="${seq.id}">${SCHEMATICS[seq.id](lang)}${chips}</figure>
      <article class="cmr-seq-info" aria-live="polite">
        <h3 data-cmr-sequence-title>${esc(seq.label[lang])}</h3>
        <p class="cmr-kicker">${t.purpose}</p><p data-cmr-purpose>${esc(seq.purpose[lang])}</p>
        <p class="cmr-kicker">${t.how}</p><ul class="cmr-bullets" data-cmr-how>${seq.how[lang].map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        <p class="cmr-kicker">${t.measures}</p><p data-cmr-measures>${esc(seq.measures[lang])}</p>
        <p class="cmr-kicker cmr-kicker-warn">${t.pitfall}</p><p data-cmr-pitfall>${esc(seq.pitfall[lang])}</p>
      </article>
    </div>
  </section>`;
}

function footer(t) {
  return `<section class="cmr-panel cmr-footer">
    <p class="cmr-disclaimer" data-cmr-disclaimer>${t.disclaimer}</p>
    <div class="cmr-source"><h2>${t.sourceTitle}</h2><a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">${esc(t.reference)} ↗</a><p class="cmr-note">${t.protocolNote}</p></div>
    <button type="button" class="cmr-reset" data-cmr-reset>${t.reset}</button>
  </section>`;
}

function render(focusSelector) {
  const t = UI[lang];
  document.documentElement.lang = lang;
  document.title = `Cardia · ${t.title}`;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  document.querySelectorAll('[data-cmr-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cmrLang === lang)));
  mount.innerHTML = `<section class="cmr-hero"><div><span class="cmr-eyebrow">${t.eyebrow}</span><h1>${t.title}</h1><p>${t.intro}</p></div><span class="cmr-badge">${t.badge}</span></section>
    ${planningPanel(t)}${sectionsPanel(t)}${sequencePanel(t)}${footer(t)}`;
  if (focusSelector) mount.querySelector(focusSelector)?.focus({ preventScroll: true });
}

function update(patch, focusSelector) {
  state = { ...state, ...patch };
  render(focusSelector);
}

mount.addEventListener('click', event => {
  const el = event.target.closest('button');
  if (!el || !mount.contains(el)) return;
  const d = el.dataset;
  if (d.cmrStep) update({ step: d.cmrStep }, `[data-cmr-step="${d.cmrStep}"]`);
  else if (d.cmrSection) update({ section: d.cmrSection }, `[data-cmr-section="${d.cmrSection}"]`);
  else if (d.cmrSequence) update({ sequence: d.cmrSequence }, `[data-cmr-sequence="${d.cmrSequence}"]`);
  else if (d.cmrLge) update({ lgePattern: d.cmrLge }, `[data-cmr-lge="${d.cmrLge}"]`);
  else if ('cmrLabels' in d) {
    const panel = el.closest('section')?.getAttribute('aria-labelledby');
    update({ labels: !state.labels }, `[aria-labelledby="${panel}"] [data-cmr-labels]`);
  } else if ('cmrReset' in d) update({ ...DEFAULT_STATE }, '[data-cmr-reset]');
});

document.querySelectorAll('[data-cmr-lang]').forEach(button => button.addEventListener('click', () => {
  lang = button.dataset.cmrLang;
  rememberLanguage(lang);
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  render();
}));

render();
window.cardiacMR = {
  getState: () => ({ ...state, lang }),
  steps: () => STEPS.map(s => s.id),
  sequences: () => SEQUENCES.map(s => s.id),
  sections: () => SECTIONS.map(s => s.id)
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' })
    .catch(error => console.warn('Cardiac MR offline cache unavailable', error));
}
