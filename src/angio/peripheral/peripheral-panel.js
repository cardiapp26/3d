// Peripheral angiography panel: tabs, projection modes, detail card, scales.
// One delegated listener on the mount so a re-render keeps clicks and keys.

import { REFERENCES, SCALES, UI, VIEWS, findStructure, loc, structuresFor, viewById } from './peripheral-data.js';
import { renderPeripheralSvg } from './peripheral-svg.js';

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const LEGEND = ['artery', 'branch', 'safe', 'risk', 'variant', 'vein', 'bone'];

function placeTip(tip, event) {
  tip.hidden = false;
  tip.style.left = '0px';
  tip.style.top = '0px';
  const box = tip.getBoundingClientRect();
  const pad = 8;
  let x = event.clientX + 14;
  let y = event.clientY + 18;
  if (x + box.width > window.innerWidth - pad) x = window.innerWidth - box.width - pad;
  if (y + box.height > window.innerHeight - pad) y = event.clientY - box.height - 12;
  tip.style.left = `${Math.max(pad, x)}px`;
  tip.style.top = `${Math.max(pad, y)}px`;
}

function scaleCard(scale, lang) {
  const rows = scale.rows.map(row =>
    `<span class="peri-grade">${esc(row.grade)}</span><span>${esc(loc(row, lang))}</span>`
  ).join('');
  const note = scale.note ? `<p class="peri-scale-note">${esc(loc(scale.note, lang))}</p>` : '';
  return `<article class="peri-scale">
    <h3>${esc(loc(scale.title, lang))}</h3>
    <p class="peri-scale-source">${esc(loc(scale.source, lang))}</p>
    <div class="peri-scale-rows">${rows}</div>
    ${note}
  </article>`;
}

function cardHtml(item, lang, ui) {
  const name = item ? loc(item.name, lang) : ui.empty;
  const text = item ? loc(item.text, lang) : ui.emptyHint;
  const pearl = item ? loc(item.pearl, lang) : '';
  return `<p class="peri-card-kicker" data-card-kicker>${esc(ui.cardKicker)}</p>
    <h2 data-card-name>${esc(name)}</h2>
    <h3 data-card-text-h>${esc(ui.desc)}</h3>
    <p data-card-text>${esc(text)}</p>
    <h3 data-card-pearl-h>${esc(ui.pearl)}</h3>
    <p data-card-pearl>${esc(pearl)}</p>`;
}

export function createPeripheralPanel({ mount, getLang }) {
  const state = { viewId: VIEWS[0].id, modeId: VIEWS[0].modes[0].id, selectedId: null };

  function selectedItem() {
    const item = state.selectedId ? findStructure(state.selectedId) : null;
    if (!item || item.view !== state.viewId || !item.modes.includes(state.modeId)) return null;
    return item;
  }

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const ui = UI[lang];
    const view = viewById(state.viewId);
    if (!view.modes.some(mode => mode.id === state.modeId)) state.modeId = view.modes[0].id;
    const item = selectedItem();
    const structures = structuresFor(view.id, state.modeId);
    const tabs = VIEWS.map(entry => {
      const on = entry.id === view.id;
      return `<button type="button" role="tab" data-peri-tab="${entry.id}" aria-selected="${on}" class="${on ? 'is-on' : ''}">${esc(loc(entry.tab, lang))}</button>`;
    }).join('');
    const modes = view.modes.length > 1
      ? view.modes.map(mode => {
        const on = mode.id === state.modeId;
        return `<button type="button" data-peri-mode="${mode.id}" aria-pressed="${on}" class="${on ? 'is-on' : ''}">${esc(loc(mode, lang))}</button>`;
      }).join('')
      : '';
    const legend = LEGEND.map(key =>
      `<li><span class="peri-swatch peri-swatch-${key}"></span>${esc(ui[key])}</li>`
    ).join('');
    const scales = ['rutherford', 'fontaine', 'abi'].map(key => scaleCard(SCALES[key], lang)).join('');
    const refs = REFERENCES.map(line => `<li>${esc(line)}</li>`).join('');
    const svg = renderPeripheralSvg({
      view: view.id,
      mode: state.modeId,
      structures,
      lang,
      selectedId: item ? item.id : null
    });
    mount.innerHTML = `<div class="peri-page">
      <p class="peri-kicker">${esc(ui.kicker)}</p>
      <p class="peri-intro">${esc(ui.lead)}</p>
      <div class="peri-tabs" role="tablist" aria-label="${esc(ui.tabs)}">${tabs}</div>
      <h1 data-peri-title>${esc(loc(view.title, lang))}</h1>
      <p class="peri-lead">${esc(loc(view.lead, lang))}</p>
      <p class="peri-view-pearl" data-peri-view-pearl>${esc(loc(view.pearl, lang))}</p>
      <div class="peri-modes" data-peri-modes>${modes}</div>
      <div class="peri-stage">
        <div class="peri-canvas">
          <div class="peri-svg-host" data-peri-svg>${svg}</div>
          <p class="peri-scale-note">${esc(ui.scaleNote)}</p>
          <p class="peri-legend-label">${esc(ui.legend)}</p>
          <ul class="peri-legend">${legend}</ul>
        </div>
        <aside class="peri-card" data-peri-card>${cardHtml(item, lang, ui)}</aside>
      </div>
      <section class="peri-scales" aria-label="${esc(ui.scales)}">
        <h2>${esc(ui.scales)}</h2>
        <div class="peri-scale-grid">${scales}</div>
      </section>
      <section class="peri-refs">
        <h2>${esc(ui.refs)}</h2>
        <p>${esc(ui.refsNote)}</p>
        <ol>${refs}</ol>
      </section>
      <div class="peri-tip" data-peri-tip hidden></div>
    </div>`;
  }

  function setView(id) {
    const view = viewById(id);
    state.viewId = view.id;
    state.modeId = view.modes[0].id;
    state.selectedId = null;
    render();
  }

  function setMode(id) {
    const view = viewById(state.viewId);
    if (!view.modes.some(mode => mode.id === id)) return;
    state.modeId = id;
    const current = state.selectedId ? findStructure(state.selectedId) : null;
    if (current && !current.modes.includes(id)) state.selectedId = null;
    render();
  }

  function select(id) {
    state.selectedId = id;
    render();
  }

  mount.addEventListener('click', event => {
    const tab = event.target.closest?.('[data-peri-tab]');
    if (tab && mount.contains(tab)) {
      setView(tab.dataset.periTab);
      return;
    }
    const mode = event.target.closest?.('[data-peri-mode]');
    if (mode && mount.contains(mode)) {
      setMode(mode.dataset.periMode);
      return;
    }
    const hit = event.target.closest?.('[data-structure]');
    if (hit && mount.contains(hit)) select(hit.dataset.structure);
  });

  mount.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const hit = event.target.closest?.('[data-structure]');
    if (!hit || !mount.contains(hit)) return;
    event.preventDefault();
    select(hit.dataset.structure);
  });

  mount.addEventListener('pointerover', event => {
    const hit = event.target.closest?.('[data-structure]');
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip || !hit || !mount.contains(hit)) return;
    tip.textContent = hit.dataset.name || '';
    placeTip(tip, event);
  });

  mount.addEventListener('pointermove', event => {
    const hit = event.target.closest?.('[data-structure]');
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip || !hit || !mount.contains(hit) || tip.hidden) return;
    placeTip(tip, event);
  });

  mount.addEventListener('pointerout', event => {
    const tip = mount.querySelector('[data-peri-tip]');
    if (!tip) return;
    const current = event.target.closest?.('[data-structure]');
    const next = event.relatedTarget?.closest?.('[data-structure]');
    if (current && current === next) return;
    tip.hidden = true;
  });

  render();
  return { render };
}
