import './echo-reference.css';
import { referencesForView } from './echo-reference-catalog.js';

const COPY = {
  tr: {
    title: 'Gerçek EKO ile karşılaştır', choose: 'Görüntü / video seç', remove: 'Kaldır',
    empty: 'Bu kesite henüz referans eklenmedi. Cihazınızdan EKO videosu veya görüntüsü seçin.',
    note: 'Kendi dosyalarınız yalnız bu sekmede tutulur, sunucuya gönderilmez. Sayfa yenilenince silinir. Yalnız kimlik bilgileri kaldırılmış kayıtları kullanın.',
    library: 'Hazır referans', topic: 'Konu referansı', records: 'Hazır kayıt', procedure: 'İşlem kaydı', cine: 'Gerçek EKO videosu', composite: 'Sabit EKO ve anatomik çizim', source: 'Kaynak', publication: 'Yayın', rest: 'Dinlenim kaydı', pathology: 'Patolojik olgu', unchanged: 'Dosya değiştirilmedi.',
    topicContext: 'Transseptal bölgeyle ilişkili klinik kayıt; atlasla aynı görüntü düzlemi değildir, prob hareketleriyle veya kalp döngüsüyle eşzamanlı değildir.',
    libraryContext: 'Seçili görünüm için yayımlanmış örnek; prob hareketleriyle veya kalp döngüsüyle eşzamanlı değildir. Bu atlasın hastaya eşlenmiş görüntüsü değildir.',
    context: 'Seçili hazır görünümün referansı; prob hareketleriyle veya kalp döngüsüyle eşzamanlı değildir. Görünüm eşleştirmesi kullanıcıya aittir.',
    attached: 'Kullanıcı tarafından eklenen kayıt', invalid: 'MP4, WebM, Ogg video veya PNG, JPEG, WebP, GIF görüntüsü seçin (en fazla 100 MB).',
    failed: 'Bu dosya açılamadı. Desteklenen başka bir kayıt seçin.', picker: 'Seçili kesit için yerel EKO kaydı',
  },
  en: {
    title: 'Compare with real echo', choose: 'Choose image / video', remove: 'Remove',
    empty: 'No reference added for this view. Choose an echo video or image from your device.',
    note: 'Your own files stay in this tab and are not uploaded. Reloading clears them. Use only de-identified recordings.',
    library: 'Reference library', topic: 'Topic reference', records: 'Reference recording', procedure: 'Procedure recording', cine: 'Real echo video', composite: 'Still echo and anatomical illustration', source: 'Source', publication: 'Publication', rest: 'Rest recording', pathology: 'Pathology case', unchanged: 'File unchanged.',
    topicContext: 'Clinical recording related to the transseptal region; not the same imaging plane as this atlas, and not synchronized with probe movements or the cardiac cycle.',
    libraryContext: 'Published example of the selected view; not synchronized with probe movements or the cardiac cycle. Not a patient-registered image of this atlas.',
    context: 'Reference for the selected preset; not synchronized with probe movements or the cardiac cycle. View matching is supplied by the user.',
    attached: 'User-added recording', invalid: 'Choose MP4, WebM, Ogg video or PNG, JPEG, WebP, GIF image (up to 100 MB).',
    failed: 'This file could not be opened. Choose another supported recording.', picker: 'Local echo recording for the selected view',
  }
};
const TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/** Local, session-only references keyed to presets, never inferred from a free probe pose. */
export function createEchoReference(doc) {
  const make = (tag, cls) => { const node = doc.createElement(tag); if (cls) node.className = cls; return node; };
  const element = make('details', 'echo-reference');
  const summary = make('summary');
  const body = make('div', 'echo-reference-body');
  const heading = make('h4');
  const recordingRow = make('label', 'echo-reference-recordings');
  const recordingLabel = make('span');
  const recordingSelect = make('select'); recordingSelect.dataset.echoReferenceChoice = '';
  recordingRow.append(recordingLabel, recordingSelect);
  const category = make('p', 'echo-reference-category');
  const sourceNote = make('p', 'echo-reference-source-note');
  const context = make('p', 'echo-reference-context');
  const stage = make('div', 'echo-reference-stage');
  const actions = make('div', 'echo-reference-actions');
  const choose = make('label', 'echo-reference-choose');
  const chooseText = make('span');
  const input = make('input');
  input.type = 'file'; input.accept = [...TYPES].join(',');
  input.dataset.echoReferenceFile = '';
  const remove = make('button'); remove.type = 'button'; remove.dataset.echoReferenceRemove = '';
  const status = make('p', 'echo-reference-status'); status.setAttribute('role', 'status');
  const credit = make('p', 'echo-reference-credit');
  const note = make('p', 'echo-reference-note');
  choose.append(chooseText, input); actions.append(choose, remove);
  body.append(heading, recordingRow, category, sourceNote, context, stage, credit, actions, status, note); element.append(summary, body);
  const records = new Map();
  const selectedReferences = new Map();
  const failedUrls = new Set();
  let current = null, lastKey = '', media = null, error = '';
  const urls = doc.defaultView.URL;
  const release = record => { if (record) urls.revokeObjectURL(record.url); };
  const stop = () => { if (media?.tagName === 'VIDEO') media.pause(); };

  function draw() {
    if (!current) return;
    const { lang, key, title, modality, view } = current, t = COPY[lang];
    const candidates = referencesForView(modality, view);
    const selected = candidates.find(record => record.url === selectedReferences.get(key)) || candidates[0];
    const local = records.get(key), record = local || selected;
    summary.textContent = t.title; heading.textContent = title;
    recordingLabel.textContent = t.records;
    recordingRow.hidden = candidates.length < 2;
    recordingSelect.replaceChildren(...candidates.map(record => {
      const option = make('option'); option.value = record.url; option.textContent = record.title?.[lang] || record.name; return option;
    }));
    recordingSelect.value = selected?.url || ''; recordingSelect.disabled = Boolean(local);
    context.textContent = record && !local ? (record.comparison === 'topic' ? t.topicContext : t.libraryContext) : t.context; chooseText.textContent = t.choose;
    category.textContent = record && !local ? `${record.comparison === 'topic' ? t.topic : t.library} · ${t[record.kind]}${record.sample ? ` · ${t[record.sample]}` : ''}` : '';
    category.hidden = !record || Boolean(local);
    category.dataset.sample = !local && record?.sample || '';
    sourceNote.textContent = !local && record?.sourceNote?.[lang] || '';
    sourceNote.hidden = !sourceNote.textContent;
    credit.replaceChildren(); credit.hidden = !record || Boolean(local);
    if (record && !local) {
      const source = make('a'); source.href = record.sourceUrl; source.textContent = t.source;
      const license = make('a'); license.href = record.licenseUrl; license.textContent = record.license;
      for (const link of [source, license]) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      credit.append(`${record.author} · `, source, ' · ', license);
      if (record.articleUrl) {
        const article = make('a'); article.href = record.articleUrl; article.textContent = t.publication;
        article.target = '_blank'; article.rel = 'noopener noreferrer'; credit.append(' · ', article);
      }
      credit.append(` · ${record.changesNote?.[lang] || t.unchanged}`);
    }
    input.setAttribute('aria-label', `${t.picker}: ${title}`);
    remove.textContent = t.remove; remove.hidden = !local;
    note.textContent = t.note; status.textContent = error;
    stop(); media = null; stage.replaceChildren();
    if (!record) { stage.textContent = t.empty; return; }
    // Do not fetch bundled media until the learner opens this optional panel.
    if (!element.open || element.hidden) return;
    media = make(record.type.startsWith('video/') ? 'video' : 'img');
    const thisMedia = media;
    media.addEventListener('error', () => {
      if (media === thisMedia) { failedUrls.add(record.url); status.textContent = COPY[current.lang].failed; }
    });
    media.addEventListener(media.tagName === 'VIDEO' ? 'loadeddata' : 'load', () => {
      if (media !== thisMedia) return;
      failedUrls.delete(record.url);
      if (!error) status.textContent = '';
    });
    if (media.tagName === 'VIDEO') {
      media.controls = true; media.playsInline = true; media.preload = 'metadata'; media.muted = true;
      media.loop = !local;
    } else media.alt = `${local ? t.attached : `${t.library} · ${t[record.kind]}`}: ${title}`;
    media.src = record.url;
    const caption = make('p', 'echo-reference-caption');
    caption.textContent = `${local ? t.attached : t.library} · ${record.title?.[lang] || record.name}`;
    stage.append(media, caption);
    if (failedUrls.has(record.url) && !error) status.textContent = t.failed;
  }

  recordingSelect.addEventListener('change', () => {
    if (!current || records.has(current.key)) return;
    selectedReferences.set(current.key, recordingSelect.value); error = ''; draw();
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0]; input.value = '';
    if (!file || !current) return;
    if (!TYPES.has(file.type) || file.size > 100 * 1024 * 1024 || file.size === 0) {
      error = COPY[current.lang].invalid; status.textContent = error; return;
    }
    stop();
    release(records.get(current.key));
    records.set(current.key, { url: urls.createObjectURL(file), type: file.type, name: file.name });
    error = ''; draw();
  });
  remove.addEventListener('click', () => {
    if (!current) return;
    stop(); release(records.get(current.key)); records.delete(current.key); error = ''; draw();
  });
  element.addEventListener('toggle', () => { if (!element.open) stop(); else if (!media) draw(); });
  const onPageHide = () => stop();
  doc.defaultView.addEventListener('pagehide', onPageHide);

  return {
    element,
    pause: stop,
    render({ state, view, lang }) {
      const key = `${state.modality}:${view.id}`;
      // Tasks name their target elsewhere; hiding the reference avoids unrelated playback.
      element.hidden = Boolean(state.task);
      if (element.hidden) stop();
      const renderKey = `${key}|${lang}|${Boolean(state.task)}`;
      if (lastKey === renderKey) return;
      lastKey = renderKey; error = '';
      current = { key, lang, title: view.title[lang], modality: state.modality, view: view.id };
      draw();
    },
    dispose() {
      stop(); records.forEach(release); records.clear(); selectedReferences.clear();
      doc.defaultView.removeEventListener('pagehide', onPageHide);
      element.remove();
    }
  };
}
