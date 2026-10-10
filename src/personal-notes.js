import './personal-notes.css';
import { sendNotes } from './notes-transfer.js';

const WORDS = {
  tr: { title: 'Kişisel notlar', placeholder: 'Bu bölüm için notlarınızı yazın…', hint: 'Notlar yalnızca bu tarayıcıda saklanır.', saved: 'Kaydedildi', error: 'Kayıt yapılamadı. Notunuzu kopyalayın; sayfayı kapatmayın.', close: 'Notları gizle' },
  en: { title: 'Personal notes', placeholder: 'Write your notes for this section…', hint: 'Notes are stored only in this browser.', saved: 'Saved', error: 'Could not save. Copy your note before closing this page.', close: 'Hide notes' },
};

export function createPersonalNotes({ shell, getContext, getLang, getSections }) {
  const panel = shell.addTab({ id: 'notes', label: { tr: WORDS.tr.title, en: WORDS.en.title } });
  const heading = document.createElement('h3');
  const label = document.createElement('label');
  const input = document.createElement('textarea');
  input.id = 'personal-notes-input';
  input.rows = 12;
  label.htmlFor = input.id;
  const hint = document.createElement('p');
  const status = document.createElement('p');
  status.id = 'personal-notes-save-status';
  status.setAttribute('role', 'status');
  const close = document.createElement('button');
  const send = document.createElement('button');
  send.type = 'button';
  send.id = 'personal-notes-send';
  const transferStatus = document.createElement('p');
  transferStatus.setAttribute('role', 'status');
  transferStatus.id = 'personal-notes-transfer-status';
  send.addEventListener('click', () => {
    const tr = getLang() !== 'en';
    try {
      const notes = getSections().map(({ id, title }) => ({ section: id, title, text: drafts.has(id) ? drafts.get(id) : localStorage.getItem(key(id)) || '' })).filter(n => n.text.trim());
      send.disabled = true;
      transferStatus.textContent = tr ? 'Cardi kayıt onayı bekleniyor…' : 'Waiting for Cardi to confirm saving…';
      void sendNotes(notes).then(count => {
        transferStatus.textContent = tr ? `${count} not Cardi’ye kaydedildi.` : `${count} notes saved in Cardi.`;
      }).catch(error => {
        const messages = {
          empty: tr ? 'Gönderilecek not yok.' : 'No notes to send.',
          popup: tr ? 'Cardi penceresi açılamadı. Açılır pencereye izin verip yeniden deneyin.' : 'Allow popups and try again.',
          limit: tr ? 'Notlar aktarım boyut sınırını aşıyor; hiçbir not gönderilmedi.' : 'Notes exceed the transfer size limit; nothing was sent.',
        };
        transferStatus.textContent = messages[error.message] || (tr ? 'Kayıt onayı alınamadı. Yeniden deneyebilirsiniz; aynı not tekrar oluşturulmaz.' : 'Saving was not confirmed. Retry safely; unchanged notes are not duplicated.');
      }).finally(() => { send.disabled = false; });
    } catch {
      send.disabled = false;
      transferStatus.textContent = tr ? 'Notlar okunamadı. Tarayıcı depolamasını kontrol edin.' : 'Could not read notes. Check browser storage.';
    }
  });
  close.type = 'button';
  close.addEventListener('click', () => {
    shell.selectTab('learn');
    document.querySelector('#panel-tab-learn')?.focus();
  });
  panel.classList.add('personal-notes');
  panel.append(heading, label, input, hint, status, close, send, transferStatus);
  const drafts = new Map();
  const failures = new Set();
  let current = null;
  let failed = false;
  const words = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const key = id => `cardia.personal-notes.v1.${id}`;
  input.addEventListener('input', () => {
    drafts.set(current, input.value);
    try {
      localStorage.setItem(key(current), input.value);
      failed = false;
    } catch { failed = true; }
    if (failed) failures.add(current); else failures.delete(current);
    status.textContent = failed ? words().error : words().saved;
  });
  function refresh() {
    const context = getContext();
    if (current !== context.id) {
      current = context.id;
      failed = failures.has(current);
      if (!drafts.has(current)) {
        try { drafts.set(current, localStorage.getItem(key(current)) || ''); }
        catch { drafts.set(current, ''); failed = true; failures.add(current); }
      }
      input.value = drafts.get(current);
      status.textContent = '';
    }
    const w = words();
    heading.textContent = context.title;
    label.textContent = w.title;
    input.placeholder = w.placeholder;
    hint.textContent = w.hint;
    close.textContent = w.close;
    send.textContent = getLang() === 'en' ? 'Send all notes to Cardi' : 'Tüm notları Cardi’ye gönder';
    hint.textContent += getLang() === 'en' ? ' Use Send to copy them to Cardi.' : ' Gönder düğmesiyle Cardi’ye kopyalayabilirsiniz.';
    if (failed) status.textContent = w.error;
    else if (status.textContent) status.textContent = w.saved;
  }
  refresh();
  return { refresh };
}
