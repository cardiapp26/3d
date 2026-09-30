/**
 * Practice loop: Explore / Learn / Test yourself on one example lesson.
 * Goal -> act in the scene -> feedback -> explanation -> retry. Only picks
 * made in the 3D scene count; the structure list and search are not answers.
 * The session engine is pure (no DOM) so it can be tested directly.
 */
export const LESSON_VERSION = 1;
const STORAGE_KEY = 'cardia.practice.v1';

/** Example lesson: find core landmarks in general anatomy. */
export const BASIC_LESSON = {
  id: 'basic-landmarks',
  title: { tr: 'Temel yapıları bul', en: 'Find core structures' },
  goal: {
    tr: 'Sahneyi döndürerek beş temel yapıyı 3D modelde seçin. İpucu kullanımı ve hatalar ayrı kaydedilir.',
    en: 'Rotate the scene and select five core structures in the 3D model. Hints and errors are recorded separately.',
  },
  tasks: [
    {
      id: 'tricuspid', accept: ['tricuspid', 'tricuspid-septal', 'tricuspid-inferior', 'tricuspid-anterior', 'tricuspid-annulus'],
      prompt: { tr: 'Triküspit kapağı seçin.', en: 'Select the tricuspid valve.' },
      hint: { tr: 'Sağ atriyum ile sağ ventrikül arasındaki kapaktır. Miyokardı saydamlaştırıp önden bakın.', en: 'It is the valve between the right atrium and right ventricle. Make the myocardium transparent and look from the front.' },
      explain: { tr: 'Triküspit kapak sağ AV bileşkededir; septal yaprakçığı Koch üçgeninin bir kenarını oluşturur.', en: 'The tricuspid valve sits at the right AV junction; its septal leaflet forms one side of Koch’s triangle.' },
    },
    {
      id: 'laa', accept: ['laa'],
      prompt: { tr: 'Sol atriyal apendiksi (LAA) seçin.', en: 'Select the left atrial appendage (LAA).' },
      hint: { tr: 'Sol atriyumun anterolateral duvarından öne ve sola uzanır; pulmoner trunkun solundadır.', en: 'It projects forward and leftward from the anterolateral left atrial wall, to the left of the pulmonary trunk.' },
      explain: { tr: 'LAA atriyal fibrilasyonda en sık trombüs yeridir; kapatma cihazları ağız çapına göre seçilir.', en: 'The LAA is the commonest thrombus site in atrial fibrillation; occluders are sized to its orifice.' },
    },
    {
      id: 'cs', accept: ['cs'],
      prompt: { tr: 'Koroner sinüsü seçin.', en: 'Select the coronary sinus.' },
      hint: { tr: 'Posterior AV olukta seyreder ve sağ atriyuma açılır; arka (posterior) görünüm işinizi kolaylaştırır.', en: 'It runs in the posterior AV groove and opens into the right atrium; the posterior view helps.' },
      explain: { tr: 'Koroner sinüs kardiyak venleri toplar; ostiyumu Koch üçgeninin tabanındadır.', en: 'The coronary sinus collects the cardiac veins; its ostium lies at the base of Koch’s triangle.' },
    },
    {
      id: 'lad', accept: ['lad'],
      prompt: { tr: 'Sol ön inen arteri (LAD) seçin.', en: 'Select the left anterior descending artery (LAD).' },
      hint: { tr: 'Anterior interventriküler olukta apekse doğru iner; önden bakışta görünür.', en: 'It descends toward the apex in the anterior interventricular groove; visible from the front.' },
      explain: { tr: 'LAD septal dallarla ön septumu ve diyagonallerle ön duvarı besler.', en: 'The LAD supplies the anterior septum through septal branches and the anterior wall through diagonals.' },
    },
    {
      id: 'pulmonary-valve', accept: ['pulmonary-valve'],
      prompt: { tr: 'Pulmoner kapağı seçin.', en: 'Select the pulmonary valve.' },
      hint: { tr: 'Sağ ventrikül çıkış yolunun ucunda, aort kökünün önünde ve solundadır.', en: 'It sits at the end of the right ventricular outflow tract, in front of and to the left of the aortic root.' },
      explain: { tr: 'Pulmoner kapak, supraventriküler krista ile triküspit kapaktan ayrılır.', en: 'The pulmonary valve is separated from the tricuspid valve by the supraventricular crest.' },
    },
  ],
};

/**
 * Pure session: `pick(id)` returns { result: 'correct' | 'wrong' | 'ignored' },
 * `hint()`, `reveal()` and `next()` move through the tasks. `summary()` is the
 * report: independent / with-hint / revealed per task, errors and hints.
 */
export function createPracticeSession(lesson, style) {
  const records = lesson.tasks.map(task => ({ id: task.id, errors: 0, hints: 0, status: 'open', picks: [] }));
  let index = 0;
  const current = () => lesson.tasks[index];
  const record = () => records[index];
  return {
    style,
    get index() { return index; },
    get done() { return index >= lesson.tasks.length; },
    current, record,
    pick(id) {
      if (index >= lesson.tasks.length || record().status !== 'open') return { result: 'ignored' };
      record().picks.push(id);
      if (current().accept.includes(id)) {
        record().status = record().hints ? 'with-hint' : 'independent';
        return { result: 'correct' };
      }
      record().errors += 1;
      return { result: 'wrong' };
    },
    hint() {
      if (index < lesson.tasks.length && record().status === 'open') record().hints += 1;
      return current()?.hint;
    },
    reveal() {
      if (index < lesson.tasks.length && record().status === 'open') record().status = 'revealed';
    },
    next() {
      if (index < lesson.tasks.length && record().status !== 'open') index += 1;
      return !this.done;
    },
    summary() {
      const count = status => records.filter(r => r.status === status).length;
      return {
        lesson: lesson.id, version: LESSON_VERSION, style,
        total: records.length, independent: count('independent'), withHint: count('with-hint'), revealed: count('revealed'),
        errors: records.reduce((sum, r) => sum + r.errors, 0), hints: records.reduce((sum, r) => sum + r.hints, 0),
        review: records.filter(r => r.status === 'revealed' || r.status === 'with-hint' || r.errors > 1).map(r => r.id),
        records: records.map(r => ({ ...r, picks: [...r.picks] })),
      };
    },
  };
}

export function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data && data.version === LESSON_VERSION ? data : { version: LESSON_VERSION, results: {} };
  } catch { return { version: LESSON_VERSION, results: {} }; }
}
function saveResult(summary) {
  try {
    const data = loadProgress();
    data.results[`${summary.lesson}:${summary.style}`] = { ...summary, completedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* progress is a local convenience; the session still completes */ }
}
function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const WORDS = {
  tr: {
    styles: { explore: 'Serbest', learn: 'Rehberli görev', test: 'Kendini sına' }, styleLabel: 'Kullanım biçimi',
    task: (i, n) => `Görev ${i}/${n}`, hint: 'İpucu göster', reveal: 'Yanıtı göster', next: 'Sonraki adım', finish: 'Sonucu gör', retry: 'Yeniden dene', toTest: 'Kendini sına',
    correct: 'Doğru.', wrong: picked => `Bu ${picked ? `“${picked}”` : 'yapı'}; hedef değil.`, wrongTest: 'Doğru değil. Tekrar deneyin.', revealed: 'Yanıt sahnede gösterildi.',
    sceneOnly: 'Seçimi 3D sahnede yapın; liste ve arama yanıt sayılmaz.',
    doneTitle: 'Ders tamamlandı', independent: 'Bağımsız', withHint: 'İpucuyla', revealedLabel: 'Gösterildi', errors: 'Hata', hints: 'İpucu',
    review: 'Tekrar önerilir', none: 'Tekrar gerektiren yapı yok.', findings: 'Bulgu', last: 'Son sonuçlar', noResults: 'Henüz tamamlanmış ders yok. Öğren veya Kendini sına ile başlayın.',
    current: 'Bu oturum', clear: 'İlerlemeyi sil', exploreNote: 'Serbest keşif: puan yok. Görevli çalışma için Rehberli görev veya Kendini sına seçin.',
    local: 'İlerleme yalnızca bu tarayıcıda saklanır.',
  },
  en: {
    styles: { explore: 'Free', learn: 'Guided task', test: 'Test yourself' }, styleLabel: 'Way of use',
    task: (i, n) => `Task ${i}/${n}`, hint: 'Show hint', reveal: 'Show answer', next: 'Next step', finish: 'See result', retry: 'Try again', toTest: 'Test yourself',
    correct: 'Correct.', wrong: picked => `That is ${picked ? `“${picked}”` : 'another structure'}, not the target.`, wrongTest: 'Not correct. Try again.', revealed: 'The answer is shown in the scene.',
    sceneOnly: 'Make the selection in the 3D scene; the list and search do not count as answers.',
    doneTitle: 'Lesson complete', independent: 'Independent', withHint: 'With hint', revealedLabel: 'Revealed', errors: 'Errors', hints: 'Hints',
    review: 'Review suggested', none: 'No structure needs review.', findings: 'Findings', last: 'Last results', noResults: 'No completed lesson yet. Start with Learn or Test yourself.',
    current: 'This session', clear: 'Clear progress', exploreNote: 'Free exploration: no score. Choose Guided task or Test yourself for tasks.',
    local: 'Progress is stored only in this browser.',
  },
};

function el(tag, cls, text) {
  const out = document.createElement(tag);
  if (cls) out.className = cls;
  if (text != null) out.textContent = text;
  return out;
}

/**
 * UI. `mount` (top of the Learn tab), `findings` (Findings tab panel),
 * `banner` (scene overlay). Callbacks: onStart(style) prepares the scene,
 * onReveal(id) shows the answer, getTitle(id) names a picked structure.
 */
export function createPractice({ mount, findings, banner, getLang = () => 'tr', onStart = () => {}, onReveal = () => {}, getTitle = id => id, lesson = BASIC_LESSON }) {
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const w = () => WORDS[lang()];
  let style = 'explore';
  let session = null;
  let feedback = null; // { kind, text }
  const root = el('section', 'practice');
  root.setAttribute('aria-label', lesson.title.tr);
  mount.prepend(root);
  banner.hidden = true;
  banner.setAttribute('aria-live', 'polite');

  function setStyle(next) {
    style = next;
    feedback = null;
    session = next === 'explore' ? null : createPracticeSession(lesson, next);
    if (session) onStart(next);
    render();
  }

  function renderSwitch() {
    // One compact select instead of a three-button row: the current style is shown, the others are one click away.
    const row = el('label', 'practice-styles');
    row.title = w().exploreNote;
    const name = el('span', 'practice-styles-label', w().styleLabel);
    const select = el('select', 'practice-style-select');
    select.dataset.practiceSelect = '';
    select.setAttribute('aria-label', w().styleLabel);
    for (const id of ['explore', 'learn', 'test']) {
      const option = el('option', '', w().styles[id]);
      option.value = id;
      option.dataset.practiceStyle = id;
      select.append(option);
    }
    select.value = style;
    select.addEventListener('change', () => setStyle(select.value));
    row.append(name, select);
    return row;
  }

  function action(label, handler, cls = '') {
    const b = el('button', `practice-btn ${cls}`.trim(), label);
    b.type = 'button';
    b.addEventListener('click', handler);
    return b;
  }

  function render() {
    root.replaceChildren(renderSwitch());
    if (!session) {
      banner.hidden = true;
      renderFindings();
      return;
    }
    const n = lesson.tasks.length;
    if (session.done) {
      const s = session.summary();
      const card = el('div', 'practice-card');
      card.append(el('div', 'eyebrow', lesson.title[lang()]), el('h3', '', w().doneTitle), summaryList(s));
      const row = el('div', 'practice-actions');
      row.append(action(w().retry, () => setStyle(style), 'primary-soft'));
      if (style === 'learn') row.append(action(w().toTest, () => setStyle('test')));
      card.append(row);
      root.append(card);
      banner.hidden = true;
      renderFindings();
      return;
    }
    const task = session.current();
    const rec = session.record();
    const card = el('div', 'practice-card');
    card.dataset.task = task.id;
    card.append(el('div', 'eyebrow', `${lesson.title[lang()]} · ${w().task(session.index + 1, n)}`));
    card.append(el('p', 'practice-prompt', task.prompt[lang()]));
    if (session.index === 0 && rec.status === 'open' && !feedback) card.append(el('p', 'practice-note', w().sceneOnly));
    if (feedback) {
      const f = el('p', `practice-feedback is-${feedback.kind}`, feedback.text);
      f.setAttribute('role', 'status');
      card.append(f);
    }
    const row = el('div', 'practice-actions');
    if (rec.status === 'open') {
      row.append(action(w().hint, () => {
        const hint = session.hint();
        feedback = { kind: 'hint', text: hint[lang()] };
        render();
      }));
      if (rec.hints || rec.errors >= 2) row.append(action(w().reveal, () => {
        session.reveal();
        feedback = { kind: 'revealed', text: `${w().revealed} ${task.explain[lang()]}` };
        onReveal(task.accept[0]);
        render();
      }));
    } else {
      const last = session.index === n - 1;
      row.append(action(last ? w().finish : w().next, () => {
        session.next();
        feedback = null;
        if (session.done) saveResult(session.summary());
        render();
      }, 'primary-soft'));
    }
    card.append(row);
    root.append(card);
    banner.hidden = false;
    banner.replaceChildren(el('strong', '', w().task(session.index + 1, n)), el('span', '', ` ${task.prompt[lang()]}`));
    if (feedback) banner.append(el('span', `practice-banner-state is-${feedback.kind}`, feedback.kind === 'correct' ? ' ✓' : feedback.kind === 'wrong' ? ' ✗' : ''));
    renderFindings();
  }

  function summaryList(s) {
    const dl = el('dl', 'practice-summary');
    for (const [label, value] of [[w().independent, s.independent], [w().withHint, s.withHint], [w().revealedLabel, s.revealed], [w().errors, s.errors], [w().hints, s.hints]]) {
      dl.append(el('dt', '', label), el('dd', '', `${value}${label === w().errors || label === w().hints ? '' : `/${s.total}`}`));
    }
    const wrap = el('div', '');
    wrap.append(dl);
    const titleOf = id => getTitle(lesson.tasks.find(t => t.id === id)?.accept[0] || id);
    wrap.append(el('p', 'practice-review', s.review.length ? `${w().review}: ${s.review.map(titleOf).join(', ')}` : w().none));
    return wrap;
  }

  function renderFindings() {
    if (!findings) return;
    findings.replaceChildren();
    const card = el('section', 'practice-findings');
    card.append(el('div', 'eyebrow', w().findings), el('h3', '', lesson.title[lang()]));
    if (session) {
      card.append(el('div', 'eyebrow', `${w().current} · ${w().styles[style]}`));
      const list = el('ol', 'practice-records');
      session.summary().records.forEach((r, i) => {
        const task = lesson.tasks[i];
        const status = { open: '…', independent: w().independent, 'with-hint': w().withHint, revealed: w().revealedLabel }[r.status];
        list.append(el('li', `is-${r.status}`, `${task.prompt[lang()]} · ${status}${r.errors ? ` · ${w().errors}: ${r.errors}` : ''}`));
      });
      card.append(list);
    }
    const stored = loadProgress().results;
    const keys = Object.keys(stored).filter(k => k.startsWith(`${lesson.id}:`));
    card.append(el('div', 'eyebrow', w().last));
    if (!keys.length) card.append(el('p', '', w().noResults));
    for (const key of keys) {
      const s = stored[key];
      const box = el('div', 'practice-last');
      box.append(el('strong', '', w().styles[s.style] || s.style), summaryList(s));
      card.append(box);
    }
    card.append(el('p', 'practice-note', w().local));
    if (keys.length) card.append(action(w().clear, () => { clearProgress(); renderFindings(); }));
    findings.append(card);
  }

  /** A pick made in the 3D scene. */
  function onScenePick(id) {
    if (!session || session.done) return;
    const task = session.current();
    const { result } = session.pick(id);
    if (result === 'correct') feedback = { kind: 'correct', text: `${w().correct} ${task.explain[lang()]}` };
    else if (result === 'wrong') {
      const rec = session.record();
      feedback = style === 'test'
        ? { kind: 'wrong', text: w().wrongTest }
        : { kind: 'wrong', text: `${w().wrong(getTitle(id))} ${rec.errors === 1 ? task.hint[lang()] : ''}`.trim() };
      if (style === 'learn' && rec.errors === 1) session.hint(); // the hint was shown with the feedback
    } else return;
    render();
  }

  render();
  return {
    onScenePick,
    setStyle,
    refresh: render,
    hidesLabels: () => style === 'test' && !!session && !session.done,
    isActive: () => !!session && !session.done,
    getState: () => ({ style, index: session?.index ?? null, done: session?.done ?? null, summary: session?.summary() ?? null }),
  };
}
