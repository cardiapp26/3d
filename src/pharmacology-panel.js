import { PHARMA_TOPICS, PHARMA_SOURCES, PHARMA_INTERACTIONS, PHARMA_QUESTIONS } from './pharmacology-data.js';
import { activateEffect, effectMarkup, hasEffect } from './drug-effect-anim.js';
import { pharmaText, allPharmaCards, findPharmaCards, concentrationCurve, remainingFraction } from './pharmacology-model.js';
import './pharmacology.css';

const WORDS = {
  tr: { search: 'Bu başlıkta ilaç veya mekanizma ara', classes: 'İlaç sınıfları', compare: 'Karşılaştır', quiz: 'Bilgi testi', mechanism: 'Mekanizma', use: 'Klinik bağlam', risk: 'Önemli risk', monitor: 'İzlem', examples: 'Örnek ilaçlar', sources: 'Kaynaklar', focus: 'Haritada göster', effect: 'Etkiyi göster', effectHide: 'Etkiyi gizle', noTarget: 'Hedef: sistemik damarlar / kalp', empty: 'Aramayla eşleşen sınıf yok.', choose: 'Karşılaştırmak için iki sınıf seçin.', limit: 'En fazla iki sınıf karşılaştırılabilir. Önce bir seçimi kaldırın.', remove: 'Kaldır', clear: 'Seçimleri temizle', correct: 'Doğru', incorrect: 'Tekrar düşünün', next: 'Sonraki soru', reset: 'Testi yeniden başlat', answered: 'Yanıtlanan', safety: 'Eğitim özeti: hasta seçimi, doz ve reçete kararı içermez.', anatomy: 'Etki haritası şematiktir; ilaç yanıtını simüle etmez.', pkTitle: 'Yarı ömür: konsantrasyon nasıl azalır?', halfLife: 'Yarı ömür (saat)', pkAxis: 'Başlangıç konsantrasyonunun yüzdesi', hours: 'Saat', pkLimit: 'Tek bölmeli, birinci derece eliminasyon. Emilim, tekrar doz ve aktif metabolitler modellenmez. Değerler ilaç veya hasta verisi değildir.', left: '24. saatte kalan', why: 'Neden?', action: 'Güvenlik noktası', count: 'sınıf', quizLead: 'Mekanizmayı ve güvenlik noktasını seçin.' },
  en: { search: 'Search drugs or mechanisms in this topic', classes: 'Drug classes', compare: 'Compare', quiz: 'Knowledge check', mechanism: 'Mechanism', use: 'Clinical context', risk: 'Key risk', monitor: 'Monitoring', examples: 'Example drugs', sources: 'Sources', focus: 'Show on map', effect: 'Show the effect', effectHide: 'Hide the effect', noTarget: 'Target: systemic vessels / heart', empty: 'No matching drug class.', choose: 'Select two classes to compare.', limit: 'Compare up to two classes. Remove one selection first.', remove: 'Remove', clear: 'Clear selections', correct: 'Correct', incorrect: 'Think again', next: 'Next question', reset: 'Restart quiz', answered: 'Answered', safety: 'Educational summary: no patient selection, dosing or prescribing decisions.', anatomy: 'The target map is schematic; it does not simulate drug response.', pkTitle: 'Half-life: how does concentration fall?', halfLife: 'Half-life (hours)', pkAxis: 'Percentage of initial concentration', hours: 'Hours', pkLimit: 'One compartment, first-order elimination. Absorption, repeated doses and active metabolites are not modeled. Values are not drug or patient data.', left: 'Remaining at 24 hours', why: 'Why?', action: 'Safety point', count: 'classes', quizLead: 'Choose the mechanism and safety point.' }
};

const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createPharmacologyPanel({ mount, getLang = () => 'tr', onTopic, onFocus, showTopicNav = true }) {
  let topicIndex = 0, view = 'classes', query = '', halfLife = 6, questionIndex = 0;
  const selected = new Set(), answers = new Map(), openEffects = new Set(), effectStates = new Map();
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const t = value => pharmaText(value, lang());
  const w = () => WORDS[lang()];
  const topic = () => PHARMA_TOPICS[topicIndex];
  const button = (attrs, label) => `<button type="button" ${attrs}>${escape(label)}</button>`;
  const refs = ids => `<small class="pharma-refs">${escape(w().sources)}: ${ids.map(id => `<a href="#pharma-source-${escape(id)}" data-pharma-source="${escape(id)}">${escape(id)}</a>`).join(' · ')}</small>`;
  const field = (key, card) => `<div class="pharma-field${key === 'risk' ? ' pharma-risk' : ''}"><dt>${escape(w()[key])}</dt><dd>${escape(t(card[key]))}</dd></div>`;

  function sourceList() {
    return `<details class="pharma-sources"><summary>${escape(w().sources)}</summary><ol>${PHARMA_SOURCES.map(source => `<li id="pharma-source-${escape(source.id)}"><strong>${escape(source.id)} · ${escape(typeof source.title === 'string' ? source.title : t(source.title))}</strong><p>${escape(typeof source.detail === 'string' ? source.detail : t(source.detail))}</p>${source.url ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.url)}</a>` : ''}</li>`).join('')}</ol></details>`;
  }

  function cardsMarkup() {
    const cards = findPharmaCards(topic().id, query, lang());
    const interactions = topicIndex === PHARMA_TOPICS.length - 1 ? `<div class="pharma-interactions">${PHARMA_INTERACTIONS.map(item => `<section class="pharma-card"><h4>${escape(t(item.title))}</h4><dl><div class="pharma-field"><dt>${escape(w().why)}</dt><dd>${escape(t(item.why))}</dd></div><div class="pharma-field pharma-risk"><dt>${escape(w().action)}</dt><dd>${escape(t(item.action))}</dd></div></dl>${refs(item.sources)}</section>`).join('')}</div>` : '';
    return `<label class="pharma-search-label">${escape(w().search)}<input type="search" data-pharma-search value="${escape(query)}" autocomplete="off"></label><p class="pharma-result-count" role="status">${cards.length} ${escape(w().count)}</p><div class="pharma-cards">${cards.map(card => `<section class="pharma-card" data-pharma-card="${escape(card.id)}"><h4>${escape(t(card.name))}</h4><p class="pharma-examples">${escape(t(card.examples))}</p><dl>${['mechanism', 'use', 'risk', 'monitor'].map(key => field(key, card)).join('')}</dl>${openEffects.has(card.id) ? effectMarkup(card.id, lang(), effectStates.get(card.id) || 'drug') : ''}<div class="pharma-card-actions">${hasEffect(card.id) ? button(`data-pharma-effect="${escape(card.id)}" aria-expanded="${openEffects.has(card.id)}"`, openEffects.has(card.id) ? w().effectHide : `▶ ${w().effect}`) : ''}${button(`data-pharma-compare="${escape(card.id)}" aria-pressed="${selected.has(card.id)}"`, `${selected.has(card.id) ? '✓ ' : '+ '}${w().compare}`)}${onFocus ? button(`data-pharma-focus="${escape(card.target)}"`, w().focus) : ''}</div>${refs(card.sources)}</section>`).join('') || `<p>${escape(w().empty)}</p>`}</div>${interactions}${topicIndex === 0 ? pkMarkup() : ''}`;
  }

  function pkMarkup() {
    const points = concentrationCurve(halfLife).map(({ hours, fraction }) => `${40 + hours / 24 * 240},${130 - fraction * 100}`).join(' ');
    return `<section class="pharma-pk"><h4>${escape(w().pkTitle)}</h4><label>${escape(w().halfLife)} <output data-pharma-half-life-value>${halfLife}</output><input type="range" data-pharma-half-life min="1" max="12" step="1" value="${halfLife}"></label><svg viewBox="0 0 320 170" role="img" aria-label="${escape(w().pkAxis)}"><path d="M40 30V130H280" fill="none" stroke="currentColor" opacity=".4"/><text x="7" y="34">100%</text><text x="18" y="134">0%</text><text x="38" y="150">0</text><text x="150" y="150">12</text><text x="267" y="150">24</text><text x="135" y="168">${escape(w().hours)}</text><polyline points="${points}" fill="none" stroke="#257967" stroke-width="3"/></svg><p>${escape(w().left)}: <strong data-pharma-remaining>${(remainingFraction(24, halfLife) * 100).toFixed(1)}%</strong></p><small>${escape(w().pkLimit)}</small></section>`;
  }

  function compareMarkup() {
    const cards = allPharmaCards().filter(card => selected.has(card.id));
    return `<p>${escape(w().choose)}</p>${cards.length ? `<div class="pharma-compare-scroll"><table class="pharma-compare-table"><caption>${escape(w().compare)}</caption><thead><tr><th scope="col">${escape(w().classes)}</th>${cards.map(card => `<th scope="col">${escape(t(card.name))}${button(`data-pharma-remove="${escape(card.id)}" aria-label="${escape(w().remove + ': ' + t(card.name))}"`, '×')}</th>`).join('')}</tr></thead><tbody>${['examples', 'mechanism', 'use', 'risk', 'monitor'].map(key => `<tr><th scope="row">${escape(w()[key])}</th>${cards.map(card => `<td>${escape(t(card[key]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${button('data-pharma-clear', w().clear)}` : ''}`;
  }

  function quizMarkup() {
    const question = PHARMA_QUESTIONS[questionIndex], answer = answers.get(question.id), answered = answer !== undefined;
    return `<section class="pharma-quiz"><p>${escape(w().quizLead)}</p><p>${escape(w().answered)}: ${answers.size}/${PHARMA_QUESTIONS.length}</p><h4>${questionIndex + 1}. ${escape(t(question.prompt))}</h4><div class="pharma-options">${question.options.map((option, index) => button(`data-pharma-answer="${index}" ${answered ? 'disabled' : ''} class="${answered && index === question.answer ? 'correct' : answered && index === answer ? 'incorrect' : ''}"`, t(option))).join('')}</div>${answered ? `<div class="pharma-feedback" role="status"><strong>${escape(answer === question.answer ? w().correct : w().incorrect)}</strong><p>${escape(t(question.explanation))}</p>${refs(question.sources)}</div>` : ''}<div class="pharma-card-actions">${button('data-pharma-next-question', w().next)}${button('data-pharma-reset-quiz', w().reset)}</div></section>`;
  }

  function render({ restoreFocus = false } = {}) {
    const focus = restoreFocus ? document.activeElement : null;
    const isSearch = focus?.matches('[data-pharma-search]');
    const selection = isSearch ? [focus.selectionStart, focus.selectionEnd] : null;
    mount.innerHTML = `<div class="pharma-panel">${showTopicNav ? `<nav class="pharma-topic-nav" aria-label="${escape(w().classes)}">${PHARMA_TOPICS.map((item, index) => button(`data-pharma-topic="${index}" aria-current="${index === topicIndex ? 'true' : 'false'}"`, t(item.title))).join('')}</nav>` : ''}<p class="pharma-safety">${escape(w().safety)}</p><div class="pharma-view-nav" role="group" aria-label="${escape(w().classes)}">${['classes', 'compare', 'quiz'].map(key => button(`data-pharma-view="${key}" aria-pressed="${view === key}"`, `${w()[key]}${key === 'compare' ? ` (${selected.size}/2)` : ''}`)).join('')}</div><p class="pharma-notice" role="status"></p><div class="pharma-content">${view === 'compare' ? compareMarkup() : view === 'quiz' ? quizMarkup() : cardsMarkup()}</div><p class="pharma-anatomy-note">${escape(w().anatomy)}</p>${sourceList()}</div>`;
    mount.querySelectorAll('.fxanim').forEach(node => activateEffect(node, lang(), (id, state) => effectStates.set(id, state)));
    if (isSearch) {
      const input = mount.querySelector('[data-pharma-search]');
      input?.focus();
      if (input && selection[0] !== null) input.setSelectionRange(...selection);
    }
  }

  mount.addEventListener('input', event => {
    if (event.target.matches('[data-pharma-search]')) { query = event.target.value; render({ restoreFocus: true }); }
    if (event.target.matches('[data-pharma-half-life]')) {
      halfLife = Number(event.target.value);
      // Update only the curve, so dragging and keyboard focus stay on the slider.
      const pk = mount.querySelector('.pharma-pk');
      pk.querySelector('output').textContent = halfLife;
      pk.querySelector('polyline').setAttribute('points', concentrationCurve(halfLife).map(({ hours, fraction }) => `${40 + hours / 24 * 240},${130 - fraction * 100}`).join(' '));
      pk.querySelector('[data-pharma-remaining]').textContent = `${(remainingFraction(24, halfLife) * 100).toFixed(1)}%`;
    }
  });
  mount.addEventListener('click', event => {
    const control = event.target.closest('button, [data-pharma-source]');
    if (!control || !mount.contains(control)) return;
    const data = control.dataset;
    if (data.pharmaSource !== undefined) {
      event.preventDefault();
      mount.querySelector('.pharma-sources').open = true;
      const source = mount.querySelector(`#pharma-source-${CSS.escape(data.pharmaSource)}`);
      source?.setAttribute('tabindex', '-1');
      source?.focus({ preventScroll: true });
      source?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (data.pharmaTopic !== undefined) { onTopic?.(Number(data.pharmaTopic)); return; }
    if (data.pharmaFocus !== undefined) { onFocus?.(data.pharmaFocus); return; }
    if (data.pharmaEffect !== undefined) {
      const id = data.pharmaEffect;
      if (openEffects.has(id)) openEffects.delete(id); else { openEffects.add(id); effectStates.set(id, 'base'); }
      render();
      mount.querySelector(`[data-pharma-effect="${CSS.escape(id)}"]`)?.focus();
      // Open on the untreated state, then switch so the change itself is animated.
      const node = mount.querySelector(`[data-fx-card="${CSS.escape(id)}"]`);
      if (node) setTimeout(() => node.querySelector('[data-fx-state=drug]')?.click(), 700);
      return;
    }
    if (data.pharmaView !== undefined) view = data.pharmaView;
    if (data.pharmaCompare !== undefined) {
      if (selected.has(data.pharmaCompare)) selected.delete(data.pharmaCompare);
      else if (selected.size < 2) selected.add(data.pharmaCompare);
      else { mount.querySelector('.pharma-notice').textContent = w().limit; return; }
    }
    if (data.pharmaRemove !== undefined) selected.delete(data.pharmaRemove);
    if (data.pharmaClear !== undefined) selected.clear();
    if (data.pharmaAnswer !== undefined && !answers.has(PHARMA_QUESTIONS[questionIndex].id)) answers.set(PHARMA_QUESTIONS[questionIndex].id, Number(data.pharmaAnswer));
    if (data.pharmaNextQuestion !== undefined) questionIndex = (questionIndex + 1) % PHARMA_QUESTIONS.length;
    if (data.pharmaResetQuiz !== undefined) { answers.clear(); questionIndex = 0; }
    const focusKey = ['pharmaView', 'pharmaCompare', 'pharmaNextQuestion', 'pharmaResetQuiz', 'pharmaAnswer', 'pharmaRemove', 'pharmaClear'].find(key => data[key] !== undefined);
    const focusValue = focusKey ? data[focusKey] : null;
    render();
    if (focusKey) {
      const same = [...mount.querySelectorAll('button')].find(node => node.dataset[focusKey] === focusValue && !node.disabled);
      (same || (focusKey === 'pharmaRemove' || focusKey === 'pharmaClear'
        ? mount.querySelector('[data-pharma-remove]') || mount.querySelector('[data-pharma-view=compare]')
        : mount.querySelector('[data-pharma-next-question]')))?.focus();
    }
  });

  return {
    enter() { mount.hidden = false; render(); },
    exit() { mount.hidden = true; },
    setTopic(index, { relabel = false } = {}) {
      if (!Number.isInteger(index) || !PHARMA_TOPICS[index]) return;
      if (!relabel) { query = ''; view = 'classes'; }
      topicIndex = index;
      render();
    },
    refresh() { if (!mount.hidden) render(); }
  };
}
