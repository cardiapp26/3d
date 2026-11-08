// Section menu of the EPS laboratory: the section tabs (ep-panel.js) in a
// collapsible left column, grouped by what they teach, with the 3D EP anatomy
// lessons (eps/anatomy/, a 3D lesson page) listed under the group they belong
// to. Every tab stays a visible, clickable button while the menu is open.

const word = (tr, en) => ({ tr, en });
const STORE_KEY = 'cardia.eps.nav';

/** Groups in display order: section ids of EP_VIEWS, and 3D lessons by mode id. */
export const EP_NAV_GROUPS = Object.freeze([
  { id: 'cases', label: word('Tanı ve vaka', 'Diagnosis and cases'), sections: ['diagnosis', 'maneuver', 'treatment', 'svt'] },
  { id: 'recording', label: word('Kayıt', 'Recording'), sections: ['live', 'basics', 'recording'] },
  { id: 'mapping', label: word('Haritalama', 'Mapping'), sections: ['mapbasics', 'mapping', 'pacemap', 'substrate', 'afmap', 'eam3d'] },
  { id: 'localization', label: word('Lokalizasyon', 'Localization'), sections: ['wpw', 'ves'] },
  {
    id: 'pacing', label: word('Pacing ve kalp pili', 'Pacing and devices'), sections: ['csp'],
    lessons: [
      { mode: 'pacemaker', label: word('Kalp pili elektrotları', 'Pacemaker leads') },
      { mode: 'bachmann', label: word('Bachmann demeti ve pacing', 'Bachmann bundle and pacing') }
    ]
  },
  {
    id: 'anatomy', label: word('Anatomi', 'Anatomy'), sections: ['conduction'],
    lessons: [{ mode: 'ablation', label: word('Elektrofizyolojik anatomi', 'Electrophysiological anatomy') }]
  }
]);

const TEXT = {
  tr: { menu: 'Bölümler', collapse: 'Bölüm menüsünü daralt', expand: 'Bölüm menüsünü aç', lesson3d: '3D anatomi dersi, yeni sayfada açılır' },
  en: { menu: 'Sections', collapse: 'Collapse the section menu', expand: 'Open the section menu', lesson3d: '3D anatomy lesson, opens its page' }
};

/** Address of a 3D EP anatomy lesson, relative to the EPS page (eps/). */
export const lessonHref = (mode) => `./anatomy/#/mode/${mode}`;

/** Phone width: the menu sits above the content, starts closed and closes after a choice. */
const narrow = () => typeof matchMedia === 'function' && matchMedia('(max-width: 760px)').matches;

function readCollapsed() {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(STORE_KEY) === 'collapsed'; } catch { return false; }
}
function writeCollapsed(value) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, value ? 'collapsed' : 'open'); } catch { /* storage off: keep it for this visit */ }
}

/**
 * Regroup the section tabs into the left menu.
 * @param {Document} doc
 * @param {HTMLElement} tabs the tablist holding one button per section (data-ep-section)
 * @param {{ getLang: () => 'tr'|'en' }} opts
 * @returns {{ element: HTMLElement, render: () => void }}
 */
export function createSectionNav(doc, tabs, { getLang }) {
  const el = (tag, cls) => { const node = doc.createElement(tag); if (cls) node.className = cls; return node; };
  const buttons = new Map([...tabs.children].map((b) => [b.getAttribute('data-ep-section'), b]));
  const parts = EP_NAV_GROUPS.map((group) => {
    const box = el('div', 'ep-nav-group');
    box.setAttribute('role', 'group');
    box.setAttribute('data-ep-group', group.id);
    const label = el('span', 'ep-nav-label');
    label.setAttribute('aria-hidden', 'true');
    const links = (group.lessons || []).map((lesson) => {
      const a = el('a', 'ep-nav-3d');
      a.setAttribute('href', lessonHref(lesson.mode));
      a.setAttribute('data-ep-lesson', lesson.mode);
      return { a, lesson };
    });
    box.append(label, ...group.sections.map((id) => buttons.get(id)).filter(Boolean), ...links.map((l) => l.a));
    return { group, box, label, links };
  });
  tabs.replaceChildren(...parts.map((p) => p.box));
  tabs.setAttribute('aria-orientation', 'vertical');

  const element = el('div', 'ep-nav');
  const toggle = el('button', 'ep-nav-toggle');
  toggle.type = 'button';
  toggle.setAttribute('data-ep-nav-toggle', '');
  const toggleText = el('span');
  toggle.append(el('span', 'ep-nav-icon'), toggleText);
  element.append(toggle, tabs);
  let collapsed = narrow() || readCollapsed();
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    if (!narrow()) writeCollapsed(collapsed);
    render();
  });
  // On a phone a chosen section closes the menu (the section's own listener ran first).
  tabs.addEventListener('click', (event) => {
    if (!narrow() || !event.target?.closest?.('[data-ep-section]')) return;
    collapsed = true;
    render();
  });
  const currentLabel = () => [...buttons.values()].find((b) => b.getAttribute('aria-selected') === 'true')?.textContent || '';

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = TEXT[lang];
    element.setAttribute('data-collapsed', String(collapsed));
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? t.expand : t.collapse);
    toggle.title = collapsed ? t.expand : t.collapse;
    toggleText.textContent = t.menu;
    // The panel sets aria-selected after this call: name the open section once it has.
    if (collapsed && narrow()) queueMicrotask(() => { toggleText.textContent = [t.menu, currentLabel()].filter(Boolean).join(' · '); });
    tabs.setAttribute('aria-label', t.menu);
    tabs.hidden = collapsed;
    for (const { group, box, label, links } of parts) {
      label.textContent = group.label[lang];
      box.setAttribute('aria-label', group.label[lang]);
      for (const { a, lesson } of links) {
        a.textContent = lesson.label[lang];
        a.setAttribute('title', t.lesson3d);
      }
    }
  }
  render();
  return { element, render };
}
