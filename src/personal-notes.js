import './personal-notes.css';
import { sendNotes } from './notes-transfer.js';
import { SITE_MODULES } from './site-modules.js';

// Personal notes: a drawer that slides in from the right edge on every page,
// opened from the "Notes" button in the shared header. Each section (a 3D
// lesson mode, or a module page) keeps its own note in this browser; "Send"
// copies every stored note, from all pages, to Cardi.

const WORDS = Object.freeze({
  tr: {
    open: 'Notlar', title: 'Kişisel notlar', close: 'Notları kapat', placeholder: 'Bu bölüm için notlarınızı yazın…',
    hint: 'Notlar yalnızca bu tarayıcıda saklanır. Gönder düğmesiyle Cardi’ye kopyalayabilirsiniz.',
    saved: 'Kaydedildi', error: 'Kayıt yapılamadı. Notunuzu kopyalayın; sayfayı kapatmayın.', send: 'Tüm notları Cardi’ye gönder',
    waiting: 'Cardi kayıt onayı bekleniyor…', sent: count => `${count} not Cardi’ye kaydedildi.`,
    empty: 'Gönderilecek not yok.', popup: 'Cardi penceresi açılamadı. Açılır pencereye izin verip yeniden deneyin.',
    limit: 'Notlar aktarım boyut sınırını aşıyor; hiçbir not gönderilmedi.',
    failed: 'Kayıt onayı alınamadı. Yeniden deneyebilirsiniz; aynı not tekrar oluşturulmaz.', unreadable: 'Notlar okunamadı. Tarayıcı depolamasını kontrol edin.'
  },
  en: {
    open: 'Notes', title: 'Personal notes', close: 'Close notes', placeholder: 'Write your notes for this section…',
    hint: 'Notes are stored only in this browser. Use Send to copy them to Cardi.',
    saved: 'Saved', error: 'Could not save. Copy your note before closing this page.', send: 'Send all notes to Cardi',
    waiting: 'Waiting for Cardi to confirm saving…', sent: count => `${count} notes saved in Cardi.`,
    empty: 'No notes to send.', popup: 'Allow popups and try again.',
    limit: 'Notes exceed the transfer size limit; nothing was sent.',
    failed: 'Saving was not confirmed. Retry safely; unchanged notes are not duplicated.', unreadable: 'Could not read notes. Check browser storage.'
  }
});

const PREFIX = 'cardia.personal-notes.v1.';
const TITLES_KEY = 'cardia.personal-notes-titles.v1';
const key = id => `${PREFIX}${id}`;
// Transfer errors with their own message; anything else reads as "not confirmed".
const KNOWN_ERRORS = Object.freeze(['empty', 'popup', 'limit']);

/** The current page as a section: the module it belongs to (pages without lesson modes). */
function pageContext(lang) {
  const page = document.querySelector('.site-header')?.dataset.sitePage || 'anatomy';
  const module = SITE_MODULES.find(m => m.id === page || m.pages?.some(p => p.id === page));
  const sub = module?.pages?.find(p => p.id === page);
  const pick = text => text?.[lang === 'en' ? 'en' : 'tr'];
  return { id: page, title: pick(sub && sub.id !== module.id ? sub.label : module?.label) || page };
}

function readTitles() {
  try { return JSON.parse(localStorage.getItem(TITLES_KEY) || '{}') || {}; } catch { return {}; }
}

/** Every stored note, all pages, as { section, title, text } (drafts that failed to save win). */
function storedNotes(drafts) {
  const titles = readTitles();
  const ids = new Set(drafts.keys());
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i);
    if (name?.startsWith(PREFIX)) ids.add(name.slice(PREFIX.length));
  }
  return [...ids].map(id => ({ section: id, title: titles[id] || id, text: drafts.has(id) ? drafts.get(id) : localStorage.getItem(key(id)) || '' }))
    .filter(note => note.text.trim());
}

/**
 * @param {{ getLang: () => string, getContext?: () => { id: string, title: string } }} options
 *   getContext: the section being worked on (default: this page's module).
 */
export function createPersonalNotes({ getLang, getContext }) {
  const words = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const context = () => (getContext ? getContext() : pageContext(getLang()));

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'notes-toggle';
  toggle.className = 'notes-toggle';
  toggle.setAttribute('aria-controls', 'notes-drawer');
  toggle.setAttribute('aria-expanded', 'false');

  const drawer = document.createElement('aside');
  drawer.id = 'notes-drawer';
  drawer.className = 'notes-drawer personal-notes';
  drawer.setAttribute('aria-labelledby', 'notes-drawer-title');
  drawer.inert = true;
  drawer.innerHTML = `
    <div class="notes-drawer-head">
      <h2 id="notes-drawer-title"></h2>
      <button type="button" class="notes-drawer-close" data-notes-close>×</button>
    </div>
    <p class="notes-drawer-section" data-notes-section></p>
    <label for="personal-notes-input" class="notes-drawer-label"></label>
    <textarea id="personal-notes-input" rows="12"></textarea>
    <p id="personal-notes-save-status" role="status"></p>
    <p data-notes-hint></p>
    <button type="button" id="personal-notes-send"></button>
    <p id="personal-notes-transfer-status" role="status"></p>`;
  document.body.append(drawer);

  const $ = selector => drawer.querySelector(selector);
  const input = $('#personal-notes-input');
  const status = $('#personal-notes-save-status');
  const send = $('#personal-notes-send');
  const transferStatus = $('#personal-notes-transfer-status');
  const closeButton = $('[data-notes-close]');

  const drafts = new Map();
  const failures = new Set();
  let current = null;

  function setOpen(open, { focus = true } = {}) {
    drawer.classList.toggle('is-open', open);
    drawer.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { refresh(); if (focus) input.focus(); }
    else if (focus && drawer.contains(document.activeElement)) toggle.focus();
  }
  const isOpen = () => drawer.classList.contains('is-open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  closeButton.addEventListener('click', () => setOpen(false));
  drawer.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } });

  input.addEventListener('input', () => {
    drafts.set(current.id, input.value);
    try {
      localStorage.setItem(key(current.id), input.value);
      localStorage.setItem(TITLES_KEY, JSON.stringify({ ...readTitles(), [current.id]: current.title }));
      failures.delete(current.id);
    } catch {
      failures.add(current.id);
    }
    status.textContent = failures.has(current.id) ? words().error : words().saved;
  });

  send.addEventListener('click', () => {
    const w = words();
    let notes;
    try { notes = storedNotes(drafts); } catch { transferStatus.textContent = w.unreadable; return; }
    send.disabled = true;
    transferStatus.textContent = w.waiting;
    void sendNotes(notes)
      .then(count => { transferStatus.textContent = w.sent(count); })
      .catch(error => { transferStatus.textContent = KNOWN_ERRORS.includes(error.message) ? w[error.message] : w.failed; })
      .finally(() => { send.disabled = false; });
  });

  /** Follow the section and the language (call after a mode or language change). */
  function refresh() {
    const section = context();
    if (current?.id !== section.id) {
      if (!drafts.has(section.id)) {
        try { drafts.set(section.id, localStorage.getItem(key(section.id)) || ''); }
        catch { drafts.set(section.id, ''); failures.add(section.id); }
      }
      input.value = drafts.get(section.id);
      status.textContent = '';
    }
    current = section;
    const w = words();
    toggle.textContent = `✎ ${w.open}`;
    toggle.title = w.title;
    $('#notes-drawer-title').textContent = w.title;
    $('[data-notes-section]').textContent = section.title;
    $('.notes-drawer-label').textContent = section.title;
    closeButton.setAttribute('aria-label', w.close);
    closeButton.title = w.close;
    input.placeholder = w.placeholder;
    $('[data-notes-hint]').textContent = w.hint;
    send.textContent = w.send;
    if (failures.has(section.id)) status.textContent = w.error;
    else if (status.textContent) status.textContent = w.saved;
    // The shared header re-renders its own parts; keep the button first among the page controls.
    const actions = document.querySelector('.site-header .site-header-actions');
    if (actions && toggle.parentElement !== actions) actions.prepend(toggle);
  }

  refresh();
  return { refresh, open: () => setOpen(true), close: () => setOpen(false), isOpen };
}
