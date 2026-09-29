/**
 * Quick search: one combobox that finds learning modes and anatomical
 * structures by name or abbreviation in either language. With an empty query
 * it doubles as the mode picker (recent modes first, then grouped modes).
 * The ranking is a pure function so it can be tested without a DOM.
 */
const WORDS = {
  tr: { placeholder: 'Yapı veya mod ara', label: 'Yapı veya eğitim modu ara', modes: 'Modlar', recent: 'Son kullanılan', structures: 'Yapılar', none: 'Sonuç yok. Başka bir ad veya kısaltma deneyin.', hint: 'Ctrl K' },
  en: { placeholder: 'Search structure or mode', label: 'Search a structure or learning mode', modes: 'Modes', recent: 'Recent', structures: 'Structures', none: 'No results. Try another name or abbreviation.', hint: 'Ctrl K' },
};
const RECENT_KEY = 'cardia.recentModes';
const MAX_RESULTS = 8;

/** Lowercase, Turkish-aware, diacritic-free form for matching. */
export function normalizeSearch(text) {
  return String(text || '')
    .replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
    .replace(/ı/g, 'i').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Abbreviations written in the title, e.g. "Sol ventrikül • LV" -> ["lv"]. */
export function abbreviations(text) {
  return [...String(text || '').matchAll(/\b[A-Z][A-Z0-9]{1,5}\b/g)].map(m => m[0].toLowerCase());
}

/**
 * Rank `items` ({ kind, id, label, alt? }) for `query`. Exact abbreviation,
 * then word prefix, then substring; modes win ties so "ablasyon" finds the
 * mode before any structure mentioning it.
 */
export function rankSearch(query, items, limit = MAX_RESULTS) {
  const q = normalizeSearch(query);
  if (!q) return [];
  const scored = [];
  for (const item of items) {
    const texts = [item.label, item.alt, item.id].filter(Boolean);
    let best = 0;
    for (const text of texts) {
      const norm = normalizeSearch(text);
      const words = norm.split(' ');
      if (abbreviations(text).includes(q) || norm === q) best = Math.max(best, 100);
      else if (words.some(w => w.startsWith(q))) best = Math.max(best, 60 - Math.min(20, norm.indexOf(q)));
      else if (norm.includes(q)) best = Math.max(best, 30);
      else if (q.includes(' ') && q.split(' ').every(part => words.some(w => w.startsWith(part)))) best = Math.max(best, 45);
    }
    if (best) scored.push({ item, score: best + (item.kind === 'mode' ? 5 : 0) });
  }
  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map(entry => entry.item);
}

function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(id => typeof id === 'string').slice(0, 3); } catch { return []; }
}
/** Remember a visited mode (most recent first, three kept). */
export function rememberMode(id) {
  try {
    const next = [id, ...readRecent().filter(other => other !== id)].slice(0, 3);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* storage unavailable: recents are a convenience only */ }
}

let instances = 0;
/**
 * Mount a combobox in `mount`. `getItems()` returns the searchable items,
 * `getModeGroups()` the grouped modes for the empty query, `getMode()` the
 * current mode; `onPick(item)` performs the selection.
 */
export function createQuickSearch({ mount, getLang = () => 'tr', getItems, getModeGroups, getMode = () => '', onPick }) {
  const n = ++instances;
  const words = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const root = document.createElement('div');
  root.className = 'quick-search';
  const input = document.createElement('input');
  // Plain text: a native search field clears itself on Escape and reopens
  // the list; the combobox owns Escape here.
  input.type = 'text';
  input.setAttribute('enterkeyhint', 'search');
  input.id = `quick-search-${n}`;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', `quick-search-list-${n}`);
  const hint = document.createElement('kbd');
  hint.className = 'quick-search-hint';
  const list = document.createElement('div');
  list.id = `quick-search-list-${n}`;
  list.className = 'quick-search-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  root.append(input, hint, list);
  mount.append(root);

  let options = [];
  let active = -1;

  function option(item, index) {
    const el = document.createElement('div');
    el.id = `${list.id}-opt-${index}`;
    el.className = 'quick-search-option';
    el.setAttribute('role', 'option');
    el.dataset.kind = item.kind;
    el.dataset.id = item.id;
    const label = document.createElement('span');
    label.textContent = item.label;
    el.append(label);
    if (item.meta) {
      const meta = document.createElement('small');
      meta.textContent = item.meta;
      el.append(meta);
    }
    if (item.kind === 'mode' && item.id === getMode()) el.setAttribute('aria-current', 'true');
    el.addEventListener('mousedown', event => event.preventDefault());
    el.addEventListener('click', () => pick(index));
    return el;
  }
  function heading(text) {
    const el = document.createElement('div');
    el.className = 'quick-search-group';
    el.setAttribute('role', 'presentation');
    el.textContent = text;
    return el;
  }

  function render() {
    const w = words();
    const query = input.value;
    list.replaceChildren();
    options = [];
    const add = item => { const el = option(item, options.length); options.push(item); list.append(el); };
    if (normalizeSearch(query)) {
      const found = rankSearch(query, getItems());
      const modes = found.filter(item => item.kind === 'mode');
      const structures = found.filter(item => item.kind === 'structure');
      if (modes.length) { list.append(heading(w.modes)); modes.forEach(add); }
      if (structures.length) { list.append(heading(w.structures)); structures.forEach(add); }
      if (!found.length) {
        const empty = document.createElement('div');
        empty.className = 'quick-search-empty';
        empty.textContent = w.none;
        list.append(empty);
      }
    } else {
      const byId = new Map(getModeGroups().flatMap(([, items]) => items).map(item => [item.id, item]));
      const recent = readRecent().filter(id => byId.has(id) && id !== getMode()).map(id => byId.get(id));
      if (recent.length) { list.append(heading(w.recent)); recent.forEach(add); }
      for (const [title, items] of getModeGroups()) { list.append(heading(title)); items.forEach(add); }
    }
    setActive(options.length ? 0 : -1);
  }
  function setActive(index) {
    active = index;
    [...list.querySelectorAll('[role=option]')].forEach((el, i) => el.setAttribute('aria-selected', String(i === index)));
    const current = list.querySelector(`#${list.id}-opt-${index}`);
    if (current) { input.setAttribute('aria-activedescendant', current.id); current.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function openList() {
    render();
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function closeList() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }
  function pick(index) {
    const item = options[index];
    if (!item) return;
    closeList();
    input.value = '';
    input.blur();
    onPick(item);
  }

  input.addEventListener('focus', openList);
  input.addEventListener('input', openList);
  input.addEventListener('blur', () => setTimeout(closeList, 120));
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); if (list.hidden) openList(); else setActive(Math.min(options.length - 1, active + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (event.key === 'Enter') { event.preventDefault(); pick(active); }
    else if (event.key === 'Escape') {
      event.stopPropagation();
      if (!list.hidden) closeList(); else { input.value = ''; input.blur(); }
    }
  });

  function relabel() {
    const w = words();
    input.placeholder = w.placeholder;
    input.setAttribute('aria-label', w.label);
    hint.textContent = w.hint;
    if (!list.hidden) render();
  }
  relabel();
  return { refresh: relabel, focus: () => input.focus(), input };
}
