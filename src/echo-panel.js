import { TTE_LIMITS, TEE_LIMITS } from './echo-probe.js';

/*
 * Echo panel: TTE / TEE choice, the view set, the 2D sector, explainable
 * feedback, probe controls (TEE motions are separate controls, report
 * section 5), display options, the "find the view" task and the limits.
 * DOM only; echo-mode.js owns the state.
 */
const SHORT = {
  plax: 'PLAX', 'psax-av': 'PSAX AV', 'psax-mv': 'PSAX MV', 'psax-pm': 'PSAX PM', a4c: 'A4C', a2c: 'A2C', a3c: 'A3C', sc4c: 'SC 4C',
  me4c: 'ME 4C', memc: 'ME MC', me2c: 'ME 2C', melax: 'ME LAX', meavsax: 'ME AV SAX', mebicaval: { tr: 'ME bikaval', en: 'ME bicaval' }, melaa: 'ME LAA', tgsax: 'TG SAX'
};
const T = {
  tr: {
    heading: 'EKOKARDİYOGRAFİ · ANATOMİK KESİT', tte: 'TTE', tee: 'TEE', views: 'Görünümler', reset: 'Görünüme dön', restart: 'Başlangıca dön', task: 'Görünümü bul', endTask: 'Görevi bitir', newTask: 'Yeni görev',
    freeze: 'Dondur', play: 'Oynat', look: 'Düzleme bak', style: 'Görüntü', anatomy: 'Anatomik renk', gray: 'Şematik gri', labels: 'Yapı etiketleri', sector: 'Sektör genişliği', depth: 'Derinlik (göreli)',
    rotation: 'Rotasyon', tilt: 'Tilt (eğim)', rock: 'Rock (düzlem içi)', slideLateral: 'Kaydır (işaret yönü)', slideElevation: 'Kaydır (dik yön)',
    advance: 'İlerlet / geri çek (göreli)', shaft: 'Şaft rotasyonu (sağ +)', flexion: 'Antefleksiyon (+) / retrofleksiyon (−)', lateralFlexion: 'Sol (+) / sağ (−) fleksiyon', omega: 'Multiplan açı',
    probe: 'Prob hareketleri', display: 'Görüntü ayarları', feedback: 'Geri bildirim', target: 'Hedef', done: 'Görev tamamlandı: hedef görünümün model ölçütleri bir kez karşılandı.', atlasAngle: 'Atlas başlangıç açısı', guideline: 'ASE/SCA yaklaşık aralığı', teePath: 'Şematik özofagus-mide yolu', current: 'Şu anki kesit', enlarge: 'Büyüt', shrink: 'Küçült',
    window: { parasternal: 'Parasternal pencere', apical: 'Apikal pencere', subcostal: 'Subkostal pencere' },
    limits: 'Geri bildirim dinlenme (diyastol sonu) geometrisinde değerlendirilir; eşikler uzman kalibrasyonu yapılmamış öğretim değerleridir. Anatomik kesit simülatörüdür: gerçek B-mod, Doppler veya ölçüm yoktur. Kesit atlas yüzeylerinden hesaplanır; açık konturlar çizgi olarak gösterilir, doku kalınlığı uydurulmaz. TTE probu kalbi saran şematik elipsoid bir göğüs yüzeyine oturur ve kaydırmada bu yüzeyde kalır; kaburga, interkostal aralık ve akustik pencere yoktur, kontroller interkostal yerleşimi temsil etmez. TEE yolu sol atriyumun arkasına yerleştirilmiş şematik özofagus-midedir; fleksiyon 2 cm uzunluğundaki distal segmenti büker ve uç lümen sınırında durur (temas kuvveti modellenmez); multiplan açısı ucu oynatmaz. Derinlik gerçek santimetre değildir. Hazır pozlar bu atlasta otomatik ayarlanmıştır; ekokardiyografi uzmanı onayı yoktur. Atlasın kaynağı ve lisansı doğrulanmamıştır.'
  },
  en: {
    heading: 'ECHOCARDIOGRAPHY · ANATOMICAL SECTION', tte: 'TTE', tee: 'TEE', views: 'Views', reset: 'Back to the view', restart: 'Back to the start', task: 'Find the view', endTask: 'End task', newTask: 'New task',
    freeze: 'Freeze', play: 'Play', look: 'Face the plane', style: 'Image', anatomy: 'Anatomical colour', gray: 'Schematic grey', labels: 'Structure labels', sector: 'Sector width', depth: 'Depth (relative)',
    rotation: 'Rotation', tilt: 'Tilt', rock: 'Rock (in plane)', slideLateral: 'Slide (marker side)', slideElevation: 'Slide (across)',
    advance: 'Advance / withdraw (relative)', shaft: 'Shaft rotation (right +)', flexion: 'Anteflexion (+) / retroflexion (−)', lateralFlexion: 'Left (+) / right (−) flexion', omega: 'Multiplane angle',
    probe: 'Probe motions', display: 'Display', feedback: 'Feedback', target: 'Target', done: 'Task done: the target view’s model criteria were met once.', atlasAngle: 'Atlas starting angle', guideline: 'ASE/SCA approximate range', teePath: 'Schematic oesophagus-stomach path', current: 'Current cut', enlarge: 'Enlarge', shrink: 'Reduce',
    window: { parasternal: 'Parasternal window', apical: 'Apical window', subcostal: 'Subcostal window' },
    limits: 'The feedback is judged on the rest (end-diastolic) geometry; thresholds are teaching values without expert calibration. An anatomical section simulator: no real B-mode, Doppler or measurement. The section is computed from the atlas surfaces; open contours are drawn as lines, no tissue thickness is invented. The TTE probe sits on a schematic ellipsoid chest surface around the heart and stays on it while sliding; there are no ribs, intercostal spaces or acoustic windows, and the controls do not represent intercostal placement. The TEE path is a schematic oesophagus and stomach placed behind the left atrium; flexion bends a 2 cm distal section and the tip stops at the lumen wall (no contact force is modelled); the multiplane angle does not move the tip. Depth is not real centimetres. Presets were tuned automatically on this atlas; no echocardiographer has reviewed them. The atlas source and licence are unverified.'
  }
};
const MAX_DEPTH = 6;

/**
 * @param {HTMLElement} mount
 * @param {{ getLang: () => 'tr'|'en', views: { tte: object[], tee: object[] }, onView, onModality, onControl, onReset, onTask, onEndTask, onFreeze, onLookAtPlane, onResize? }} handlers
 */
export function createEchoPanel(mount, handlers) {
  let lang = handlers.getLang() === 'en' ? 'en' : 'tr';
  const doc = mount.ownerDocument;
  const el = (tag, cls, attrs = {}) => { const n = doc.createElement(tag); if (cls) n.className = cls; for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  const root = el('section', 'echo-panel');
  const heading = el('p', 'eyebrow');
  const modality = el('div', 'echo-modality', { role: 'group' });
  const modalityButtons = ['tte', 'tee'].map(id => { const b = el('button', '', { type: 'button', 'data-echo-modality': id }); b.addEventListener('click', () => handlers.onModality(id)); modality.append(b); return b; });
  const viewRow = el('div', 'echo-views', { role: 'group' });
  const title = el('h3', 'echo-title');
  const sub = el('p', 'echo-sub');
  const canvas = el('canvas', 'echo-canvas', { role: 'img' });
  const feedback = el('div', 'echo-feedback', { 'aria-live': 'polite' });
  const taskRow = el('div', 'echo-task-row');
  const resetBtn = el('button', '', { type: 'button', 'data-echo-action': 'reset' });
  const taskBtn = el('button', '', { type: 'button', 'data-echo-action': 'task' });
  const freezeBtn = el('button', '', { type: 'button', 'data-echo-action': 'freeze' });
  resetBtn.addEventListener('click', () => handlers.onReset());
  taskBtn.addEventListener('click', () => (taskBtn.dataset.mode === 'end' ? handlers.onEndTask() : handlers.onTask()));
  freezeBtn.addEventListener('click', () => handlers.onFreeze());
  const lookBtn = el('button', 'echo-look', { type: 'button', 'data-echo-action': 'look', title: '3B / 3D' });
  lookBtn.addEventListener('click', () => handlers.onLookAtPlane());
  // Larger sector for reading the labels; the renderer redraws at the new size.
  const sizeBtn = el('button', '', { type: 'button', 'data-echo-action': 'size', 'aria-pressed': 'false' });
  sizeBtn.addEventListener('click', () => { const large = !canvas.classList.contains('is-large'); canvas.classList.toggle('is-large', large); sizeBtn.setAttribute('aria-pressed', String(large)); handlers.onResize?.(); });
  taskRow.append(resetBtn, taskBtn, freezeBtn, lookBtn, sizeBtn);
  // A past success (the task) and the current cut are separate states.
  const taskStatus = el('p', 'echo-task-status', { 'aria-live': 'polite' });
  const probeBox = el('details', 'echo-controls'); probeBox.open = true;
  const probeSummary = el('summary');
  const probeSliders = el('div', 'echo-sliders');
  probeBox.append(probeSummary, probeSliders);
  const displayBox = el('details', 'echo-controls');
  const displaySummary = el('summary');
  const displayBody = el('div', 'echo-sliders');
  displayBox.append(displaySummary, displayBody);
  const limits = el('p', 'echo-limits');
  // Compact order: the sector and the probe controls come right after the view choice.
  heading.hidden = true;
  root.append(heading, modality, viewRow, title, canvas, sub, taskStatus, feedback, taskRow, probeBox, displayBox, limits);
  mount.append(root);

  // Probe sliders are rebuilt when the modality changes.
  const sliderDefs = {
    tte: [['rotation', 'rotation', -TTE_LIMITS.rotation, TTE_LIMITS.rotation, 1, '°'], ['tilt', 'tilt', -TTE_LIMITS.tilt, TTE_LIMITS.tilt, 1, '°'], ['rock', 'rock', -TTE_LIMITS.rock, TTE_LIMITS.rock, 1, '°'],
      ['slideLateral', 'slideLateral', -TTE_LIMITS.slide, TTE_LIMITS.slide, 0.02, ''], ['slideElevation', 'slideElevation', -TTE_LIMITS.slide, TTE_LIMITS.slide, 0.02, '']],
    tee: [['advance', 'advance', 0, 1, 0.005, '%'], ['rotation', 'shaft', -TEE_LIMITS.rotation, TEE_LIMITS.rotation, 1, '°'], ['flexion', 'flexion', ...TEE_LIMITS.flexion, 1, '°'],
      ['lateralFlexion', 'lateralFlexion', -TEE_LIMITS.lateralFlexion, TEE_LIMITS.lateralFlexion, 1, '°'], ['omega', 'omega', ...TEE_LIMITS.omega, 1, '°']]
  };
  let builtFor = null;
  const sliders = new Map();
  const format = (value, unit) => unit === '%' ? `${Math.round(value * 100)}%` : unit === '°' ? `${Math.round(value)}°` : Number(value).toFixed(2);
  function slider(parent, key, labelKey, min, max, step, unit, onInput) {
    const row = el('label', 'echo-slider');
    const name = el('span'); const out = el('output');
    const input = el('input', '', { type: 'range', min: String(min), max: String(max), step: String(step), 'data-echo-control': key });
    input.addEventListener('input', () => { out.textContent = format(Number(input.value), unit); onInput(Number(input.value)); });
    row.append(name, out, input);
    parent.append(row);
    sliders.set(key, { input, out, name, labelKey, unit });
  }
  function buildProbe(kind) {
    if (builtFor === kind) return;
    builtFor = kind;
    for (const key of [...sliders.keys()]) if (!['sectorAngle', 'depth'].includes(key)) sliders.delete(key);
    probeSliders.replaceChildren();
    for (const [key, labelKey, min, max, step, unit] of sliderDefs[kind]) slider(probeSliders, key, labelKey, min, max, step, unit, v => handlers.onControl('probe', key, v));
    labelSliders();
  }
  // Display options.
  const styleRow = el('label', 'echo-slider echo-select');
  const styleName = el('span');
  const styleSelect = el('select', '', { 'data-echo-control': 'style' });
  const styleOptions = ['anatomy', 'gray'].map(v => { const o = el('option', '', { value: v }); styleSelect.append(o); return o; });
  styleSelect.addEventListener('change', () => handlers.onControl('display', 'style', styleSelect.value));
  styleRow.append(styleName, styleSelect);
  const labelsRow = el('label', 'layer echo-check');
  const labelsName = el('span');
  const labelsBox = el('input', '', { type: 'checkbox', 'data-echo-control': 'labels' });
  labelsBox.addEventListener('change', () => handlers.onControl('display', 'labels', labelsBox.checked));
  labelsRow.append(labelsName, labelsBox);
  displayBody.append(styleRow, labelsRow);
  slider(displayBody, 'sectorAngle', 'sector', 60, 90, 1, '°', v => handlers.onControl('display', 'sectorAngle', (v * Math.PI) / 180));
  slider(displayBody, 'depth', 'depth', 2.5, MAX_DEPTH, 0.1, 'depth', v => handlers.onControl('display', 'depth', v));
  sliders.get('depth').unit = 'depth';

  function labelSliders() {
    const t = T[lang];
    for (const s of sliders.values()) s.name.textContent = t[s.labelKey];
  }
  let lastViews = null;
  function renderViews(views, current, task) {
    const key = `${views.map(v => v.id).join()}|${lang}`;
    if (key !== lastViews) {
      lastViews = key;
      viewRow.replaceChildren(...views.map(v => {
        const b = el('button', '', { type: 'button', 'data-echo-view': v.id, title: v.title[lang] });
        const short = SHORT[v.id]; b.textContent = typeof short === 'string' ? short : short[lang];
        b.addEventListener('click', () => handlers.onView(v.id));
        return b;
      }));
    }
    for (const b of viewRow.children) {
      b.setAttribute('aria-pressed', String(!task && b.dataset.echoView === current));
      b.disabled = Boolean(task && !task.done);
    }
  }

  const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  let feedbackKey = '';
  function render({ state, result, view, playing, presetOmega }) {
    const t = T[lang];
    setText(heading, t.heading);
    modalityButtons.forEach(b => { setText(b, t[b.dataset.echoModality]); b.setAttribute('aria-pressed', String(b.dataset.echoModality === state.modality)); b.disabled = Boolean(state.task && !state.task.done); });
    renderViews(handlers.views[state.modality], state.view, state.task);
    buildProbe(state.modality);
    const probe = state[state.modality];
    for (const [key, s] of sliders) {
      const value = key === 'sectorAngle' ? (state.sectorAngle * 180) / Math.PI : key === 'depth' ? state.depth : probe[key];
      if (value === undefined) continue;
      if (doc.activeElement !== s.input) s.input.value = String(value);
      setText(s.out, s.unit === 'depth' ? `${Math.round((value / MAX_DEPTH) * 100)}%` : format(value, s.unit));
    }
    // The sector names the view; the heading line is only needed for a task target.
    title.hidden = !state.task;
    if (state.task) setText(title, `${t.target}: ${view.title[lang]}`);
    // Atlas starting angle and the guideline's approximate range are different things.
    setText(sub, state.modality === 'tte' ? `${t.window[view.window]} · ${view.source}`
      : `${t.atlasAngle}: ${Math.round(presetOmega ?? 0)}° · ${t.guideline}: ${view.ase[lang]} · ${t.teePath} · ${view.source}`);
    canvas.setAttribute('aria-label', `${view.title[lang]}: ${lang === 'en' ? 'anatomical section, not an ultrasound image' : 'anatomik kesit, ultrason görüntüsü değil'}`);
    taskStatus.hidden = !state.task?.done;
    setText(taskStatus, state.task?.done ? `✓ ${t.done}` : '');
    feedback.dataset.state = result.achieved ? 'ok' : 'hint';
    // Rebuilt only when the messages change (live region: no re-announcing every frame).
    const messages = [state.task?.done ? `${t.current}:` : null, ...result.messages].filter(Boolean);
    if (messages.join('|') !== feedbackKey) {
      feedbackKey = messages.join('|');
      feedback.replaceChildren(...messages.map(text => { const p = el('p'); p.textContent = text; return p; }));
    }
    setText(resetBtn, state.task ? t.restart : t.reset);
    taskBtn.dataset.mode = state.task ? (state.task.done ? 'new' : 'end') : 'start';
    setText(taskBtn, state.task ? (state.task.done ? t.newTask : t.endTask) : t.task);
    setText(freezeBtn, playing ? t.freeze : t.play);
    setText(lookBtn, t.look);
    setText(sizeBtn, canvas.classList.contains('is-large') ? t.shrink : t.enlarge);
    setText(probeSummary, t.probe); setText(displaySummary, t.display);
    setText(styleName, t.style); styleOptions.forEach(o => setText(o, t[o.value]));
    styleSelect.value = state.style;
    setText(labelsName, t.labels); labelsBox.checked = state.labels;
    setText(limits, t.limits);
  }

  return {
    element: root, canvas, render,
    setLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; lastViews = null; labelSliders(); }
  };
}
