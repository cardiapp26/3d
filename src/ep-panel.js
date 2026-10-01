import { EP_SECTIONS, EP_CASES, EP_CHANNELS, CS_OSTIUM_COMPARISON, epRecording, epClips, measure } from './ep-cases.js';
import { EP_TEXT, EP_CASE_TEXT, EP_CLIP_TEXT, EP_MANEUVERS, EP_ZONE_TEXT, EP_CITATION_NOTE, EP_COMPARE } from './ep-case-text.js';
import { drawEgm, selectableChannels, timeAtX, eventsNear } from './ep-egm.js';
import { activationSequence, drawActivationMap } from './ep-activation-map.js';
import { createSimPanel } from './ep-sim-panel.js';
import { createPacingPanel } from './ep-pacing-panel.js';
import { createTaskPanel } from './ep-task-panel.js';
import { createOriginPanel } from './ep-origin-panel.js';
import { createEpFullscreen } from './ep-fullscreen.js';

/*
 * Electrophysiological anatomy panel: Diagnosis / Maneuvers / Treatment tabs
 * over the synthetic case catalog (ep-cases.js). A diagnosis clip opens
 * neutrally (mechanism hidden, cases numbered) and "Show evidence" reveals
 * the reading; maneuver clips carry their card and validity; treatment clips
 * state the electrical endpoint. The recording lives on its own millisecond
 * timeline, so the heart clock draws no cursor over it. One view state
 * (visible channels, time zoom and pan, inspection cursor) is shared by the
 * panel canvas and the full-screen view and survives clip changes. In the
 * Maneuvers tab the learner can also deliver a maneuver (ep-sim-panel.js) or
 * run the atrial pacing laboratory (ep-pacing-panel.js); the Diagnosis tab
 * holds the hidden-case narrow QRS task (ep-task-panel.js) and the PAC / PVC
 * source-region exercise (ep-origin-panel.js). A delivered
 * recording replaces the clip until another clip is chosen.
 */

// Short button labels for the clip row (titles live in ep-case-text.js).
const BTN = {
  sinus: { tr: 'Sinüs', en: 'Sinus' },
  'slow-target': { tr: 'Yavaş yol', en: 'Slow pathway' },
  'junctional-rf': { tr: 'RF junctional', en: 'RF junctional' },
  'junctional-va-block': { tr: 'VA blok', en: 'VA block' },
  'avnrt-typ-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'avnrt-typ-hispvc': { tr: 'His-refrakter PVC', en: 'His-refractory PVC' },
  'avnrt-typ-vop': { tr: 'Overdrive', en: 'Overdrive' },
  'avnrt-typ-vop-noncapture': { tr: 'Yakalama yok', en: 'No capture' },
  'avnrt-atyp-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'avnrt-atyp-vablock': { tr: 'VA blok (atipik)', en: 'VA block (atypical)' },
  'ap-ll-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'ap-ll-hispvc': { tr: 'His-refrakter PVC', en: 'His-refractory PVC' },
  'ap-ll-post-retro': { tr: 'Retrograd test', en: 'Retrograde test' },
  'ap-ips-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'ap-ips-hispvc': { tr: 'His-refrakter PVC', en: 'His-refractory PVC' },
  'pjrt-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'pjrt-vpace': { tr: 'İki hızda pacing', en: 'Two-rate pacing' },
  'avnrt-dual-echo': { tr: 'AH sıçraması / echo', en: 'AH jump / echo' },
  'ap-lm-sinus': { tr: 'Sinüs (delta)', en: 'Sinus (delta)' },
  'ap-lm-avrt': { tr: 'Taşikardi (dar QRS)', en: 'Tachycardia (narrow QRS)' },
  'af-preexcited': { tr: 'Taşikardi (düzensiz)', en: 'Tachycardia (irregular)' },
  'avnrt-typ-parahis': { tr: 'Para-Hisian', en: 'Para-Hisian' },
  'ap-ips-parahis': { tr: 'Para-Hisian', en: 'Para-Hisian' },
  'ap-lm-antidromic': { tr: 'Taşikardi (geniş QRS)', en: 'Tachycardia (wide QRS)' },
  'at-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'at-vop': { tr: 'Overdrive (A-A-V)', en: 'Overdrive (A-A-V)' },
  'ap-lm-post': { tr: 'RF sonrası sinüs', en: 'Post-RF sinus' },
  'ap-lm-post-retro': { tr: 'Retrograd test', en: 'Retrograde test' },
  'at-vop-terminated': { tr: 'Overdrive (sonlandı)', en: 'Overdrive (terminated)' },
  'flutter-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'flutter-entrain-cti': { tr: 'CTI entrainment', en: 'CTI entrainment' },
  'flutter-entrain-noncapture': { tr: 'Yakalama yok', en: 'No capture' },
  'flutter-entrain-terminated': { tr: 'Sonlandı', en: 'Terminated' },
  'cti-cs-pacing-before': { tr: 'CS pacing (öncesi)', en: 'CS pacing (before)' },
  'cti-cs-pacing-after': { tr: 'CS pacing (sonrası)', en: 'CS pacing (after)' },
  'cti-lowlat-pacing-after': { tr: 'Düşük lateral pacing', en: 'Low lateral pacing' },
  'ph-svt': { tr: 'Taşikardi', en: 'Tachycardia' },
  'ph-parahis-extranodal': { tr: 'Para-Hisian', en: 'Para-Hisian' },
  'ph-parahis-nodal-ha': { tr: 'Karşılaştırma (H-A)', en: 'Comparison (H-A)' },
  'ph-parahis-direct-a': { tr: 'Doğrudan A yakalama', en: 'Direct A capture' },
  'ph-post': { tr: 'RF sonrası sinüs', en: 'Post-RF sinus' },
  'ap-lm-uni-site1': { tr: 'Nokta 1 (uni rS)', en: 'Site 1 (uni rS)' },
  'ap-lm-uni-site2': { tr: 'Nokta 2 (uni QS)', en: 'Site 2 (uni QS)' }
};

const ZOOMS = [1, 2, 4];

const pick = (obj, lang) => (lang === 'en' ? obj.en : obj.tr);

/**
 * @param {HTMLElement} mount
 * @param {{ getLang?: () => string, onScenario?: (id: string) => void }} [options]
 */
export function createEpPanel(mount, { getLang, onScenario, onZone } = {}) {
  const doc = mount?.ownerDocument || globalThis.document;
  if (!mount || !doc) return null;
  let lang = (typeof getLang === 'function' && getLang()) === 'en' ? 'en' : 'tr';
  const state = { section: 'treatment', caseId: 'avnrt-typical', clipId: 'sinus', evidence: false, origin: false, large: false, sim: null };
  // View state shared with the full-screen view; channel overrides survive clip changes.
  const view = { overrides: new Map(), zoom: 1, pan: 0, cursorMs: null };

  const el = (tagName, className) => {
    const node = doc.createElement(tagName);
    if (className) node.className = className;
    return node;
  };
  const root = el('section', 'egm-panel');
  const eyebrow = el('p', 'eyebrow');
  const tabs = el('div', 'ep-sections');
  tabs.setAttribute('role', 'tablist');
  const sectionButtons = EP_SECTIONS.map((id) => {
    const button = el('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('data-ep-section', id);
    button.addEventListener('click', () => setSection(id));
    tabs.appendChild(button);
    return button;
  });
  const caseRow = el('label', 'ep-case');
  const caseName = el('span');
  const caseSelect = el('select');
  caseSelect.setAttribute('data-ep-case', '');
  caseSelect.addEventListener('change', () => setCase(caseSelect.value));
  caseRow.append(caseName, caseSelect);
  const title = el('h3', 'egm-title');
  const row = el('div', 'egm-scenarios');
  row.setAttribute('role', 'group');
  const canvas = el('canvas', 'egm-canvas');
  canvas.setAttribute('role', 'img');
  const viewBar = el('div', 'ep-view');
  const channelBox = el('details', 'ep-channels');
  const channelSummary = el('summary');
  const channelList = el('div', 'ep-channel-list');
  channelBox.append(channelSummary, channelList);
  const zoomSelect = el('select');
  zoomSelect.setAttribute('data-ep-zoom', '');
  zoomSelect.addEventListener('change', () => { view.zoom = Number(zoomSelect.value) || 1; renderView(); });
  const panInput = el('input');
  panInput.type = 'range';
  panInput.min = '0'; panInput.max = '1000'; panInput.step = '1';
  panInput.setAttribute('data-ep-pan', '');
  panInput.addEventListener('input', () => { view.pan = Number(panInput.value) / 1000; renderView(); });
  const fullBtn = el('button', 'ep-size');
  fullBtn.type = 'button';
  fullBtn.setAttribute('data-ep-fullscreen-open', '');
  fullBtn.addEventListener('click', () => fullscreen().open(fullBtn));
  viewBar.append(channelBox, zoomSelect, panInput, fullBtn);
  const inspect = el('p', 'ep-inspect');
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect?.();
    if (!rect || !lastDrawn) return;
    const t = timeAtX(event.clientX - rect.left, lastDrawn);
    view.cursorMs = t == null ? null : Math.round(t);
    renderView();
  });
  const measures = el('p', 'ep-measures');
  const simPanel = createSimPanel(doc, {
    getLang: () => lang,
    onRecording(recording) { state.sim = recording; view.cursorMs = null; render(); }
  });
  const pacingPanel = createPacingPanel(doc, {
    getLang: () => lang,
    onRecording(recording) { state.sim = recording; view.cursorMs = null; render(); },
    // Answering releases the 3D conduction routes of the test beat.
    onAnswer() { render(); }
  });
  const taskPanel = createTaskPanel(doc, {
    getLang: () => lang,
    // A task clears the source-region marker and any evidence view left from a clip.
    onRecording(recording) { Object.assign(state, { sim: recording, origin: false, evidence: false }); view.cursorMs = null; render(); },
    // Answering reveals the case and its zone.
    onAnswer() { render(); },
    caseName: (id) => pick(EP_CASE_TEXT[id], lang).name
  });
  // state.origin: the source-region exercise owns the Diagnosis view (its 3D marker may show).
  const originPanel = createOriginPanel(doc, {
    getLang: () => lang,
    onRecording(recording) { Object.assign(state, { sim: recording, origin: true, evidence: false }); view.cursorMs = null; render(); },
    // Answering puts an atrial focus's catheter activation on the strip and releases the 3D marker.
    onAnswer(recording) { Object.assign(state, { sim: recording, origin: true }); view.cursorMs = null; render(); }
  });
  const compareBox = el('div', 'ep-compare-card');
  const mapBox = el('div', 'ep-map');
  const mapTitle = el('p', 'ep-map-title');
  const mapCanvas = el('canvas', 'ep-map-canvas');
  mapCanvas.setAttribute('role', 'img');
  mapBox.append(mapTitle, mapCanvas);
  const sizeBtn = el('button', 'ep-size');
  sizeBtn.type = 'button';
  sizeBtn.setAttribute('data-ep-size', '');
  sizeBtn.addEventListener('click', () => { state.large = !state.large; render(); });
  const evidenceBtn = el('button', 'ep-evidence');
  evidenceBtn.type = 'button';
  evidenceBtn.setAttribute('data-ep-evidence', '');
  evidenceBtn.addEventListener('click', () => { state.evidence = !state.evidence; render(); });
  const result = el('p', 'ep-result');
  const text = el('p', 'egm-text');
  const card = el('dl', 'ep-card');
  const zoneLine = el('p', 'ep-zone');
  const compare = el('p', 'ep-compare');
  const endpoint = el('p', 'ep-endpoint');
  const sources = el('p', 'ep-sources');
  root.append(eyebrow, tabs, caseRow, title, row, taskPanel.element, originPanel.element, simPanel.element, pacingPanel.element, viewBar, canvas, inspect, measures, sizeBtn, evidenceBtn, result, text, card, compareBox, mapBox, zoneLine, compare, endpoint, sources);
  mount.appendChild(root);

  let lastDrawn = null;
  let fs = null;
  const fullscreen = () => (fs ??= createEpFullscreen(doc, {
    getLang: () => lang,
    getView: () => ({ zoom: view.zoom, pan: view.pan }),
    setView: (patch) => { Object.assign(view, patch); renderView(); },
    draw: (target) => drawRecording(target),
    describe: () => title.textContent
  }));
  const clipsOf = (caseId, section) => epClips(caseId, section);
  const current = () => state.sim || (state.clipId && epRecording(state.clipId)) || null;
  const visibleChannels = (recording) => selectableChannels(recording)
    .filter((ch) => (view.overrides.has(ch) ? view.overrides.get(ch) : recording.channels.includes(ch)));
  const currentCase = () => EP_CASES.find((c) => c.id === state.caseId);
  // A case belongs to a section when it has clips there; the Maneuvers tab also lists the pacing laboratory's cases.
  const inSection = (caseId, section) => clipsOf(caseId, section).length > 0 || (section === 'maneuver' && pacingPanel.supports(caseId));

  function setSection(section) {
    if (!EP_SECTIONS.includes(section) || section === state.section) return;
    state.section = section;
    if (!inSection(state.caseId, section)) {
      state.caseId = EP_CASES.find((c) => inSection(c.id, section))?.id || state.caseId;
    }
    state.clipId = clipsOf(state.caseId, section)[0] || null;
    state.evidence = false;
    state.sim = null;
    state.origin = false;
    render();
  }

  function setCase(caseId) {
    if (!EP_CASES.some((c) => c.id === caseId)) return;
    state.caseId = caseId;
    state.clipId = clipsOf(caseId, state.section)[0] || null;
    state.evidence = false;
    state.sim = null;
    state.origin = false;
    render();
  }

  function setClip(id) {
    const recording = epRecording(id);
    if (!recording) return;
    Object.assign(state, { section: recording.section, caseId: recording.caseId, clipId: id, sim: null, origin: false });
    view.cursorMs = null;
    render();
  }

  function drawRecording(target) {
    const recording = current();
    if (!recording) return null;
    const clipText = EP_CLIP_TEXT[state.clipId];
    const heading = state.sim ? pick(EP_MANEUVERS[state.sim.maneuver] || { tr: '', en: '' }, lang).name || ''
      : state.section === 'diagnosis' && !state.evidence ? EP_TEXT[lang].neutralTitle
        : (clipText && pick(clipText, lang).title) || '';
    return drawEgm(target, recording, { lang, title: heading, channels: visibleChannels(recording), zoom: view.zoom, pan: view.pan, cursorMs: view.cursorMs });
  }

  function redraw() {
    lastDrawn = drawRecording(canvas) || lastDrawn;
    if (fs?.isOpen()) fs.render();
  }

  // Channel chooser, zoom, pan and the inspection readout.
  function renderView() {
    const recording = current();
    // A pacing-only case in the Maneuvers tab has no clip until the first delivery: show no stale strip.
    for (const node of [viewBar, canvas, inspect, sizeBtn]) node.hidden = !recording;
    if (!recording) { lastDrawn = null; return; }
    const shown = new Set(visibleChannels(recording));
    channelSummary.textContent = `${lang === 'en' ? 'Channels' : 'Kanallar'} (${shown.size})`;
    channelList.replaceChildren(...selectableChannels(recording).map((ch) => {
      const label = el('label', 'ep-channel');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = shown.has(ch);
      box.setAttribute('data-ep-channel', ch);
      box.addEventListener('change', () => {
        // Keep at least one row.
        if (!box.checked && shown.size <= 1) { box.checked = true; return; }
        view.overrides.set(ch, box.checked);
        renderView();
      });
      const name = el('span');
      name.textContent = EP_CHANNELS.find((c) => c.id === ch)?.label || ch;
      label.append(box, name);
      return label;
    }));
    zoomSelect.replaceChildren(...ZOOMS.map((z) => { const o = doc.createElement('option'); o.value = String(z); o.textContent = `${z}×`; return o; }));
    zoomSelect.value = String(view.zoom);
    zoomSelect.setAttribute('aria-label', lang === 'en' ? 'Time zoom' : 'Zaman yakınlaştırma');
    panInput.disabled = view.zoom <= 1;
    panInput.value = String(Math.round(view.pan * 1000));
    panInput.setAttribute('aria-label', lang === 'en' ? 'Move in time' : 'Zamanda kaydır');
    fullBtn.textContent = lang === 'en' ? 'Full screen' : 'Tam ekran';
    if (view.cursorMs == null) inspect.textContent = lang === 'en' ? 'Click the strip to inspect a moment.' : 'Bir anı incelemek için şeride tıklayın.';
    else {
      const near = eventsNear(recording, view.cursorMs, [...shown]);
      const label = (ch) => EP_CHANNELS.find((c) => c.id === ch)?.label || ch;
      inspect.textContent = `t = ${view.cursorMs} ms${near.length ? `: ${near.slice(0, 6).map((e) => `${label(e.ch)} ${e.type} ${Math.round(e.t)}`).join(' · ')}` : ''}`;
    }
    redraw();
  }

  function render() {
    const t = EP_TEXT[lang];
    const recording = current();
    eyebrow.textContent = t.eyebrow;
    sectionButtons.forEach((button, i) => {
      button.textContent = t.sections[EP_SECTIONS[i]];
      button.setAttribute('aria-selected', String(EP_SECTIONS[i] === state.section));
    });
    // In diagnosis the case names stay hidden (numbered cases) until the evidence view.
    const cases = EP_CASES.filter((c) => inSection(c.id, state.section));
    caseName.textContent = t.caseLabel;
    caseSelect.replaceChildren(...cases.map((c, i) => {
      const option = doc.createElement('option');
      option.value = c.id;
      option.textContent = state.section === 'diagnosis'
        ? `${t.caseLabel} ${String(i + 1).padStart(2, '0')}`
        : pick(EP_CASE_TEXT[c.id], lang).name;
      return option;
    }));
    caseSelect.value = state.caseId;
    const clips = clipsOf(state.caseId, state.section);
    row.replaceChildren(...clips.map((id) => {
      const button = el('button');
      button.type = 'button';
      button.setAttribute('data-egm-scenario', id);
      button.setAttribute('aria-pressed', String(!state.sim && id === state.clipId));
      button.textContent = pick(BTN[id] || { tr: id, en: id }, lang);
      button.addEventListener('click', () => {
        setClip(id);
        if (typeof onScenario === 'function') onScenario(id);
      });
      return button;
    }));
    const clipText = state.clipId && EP_CLIP_TEXT[state.clipId] ? pick(EP_CLIP_TEXT[state.clipId], lang) : null;
    const diagnosis = state.section === 'diagnosis';
    const revealed = !diagnosis || state.evidence;
    const caseText = pick(EP_CASE_TEXT[state.caseId], lang);
    const task = state.sim?.lab === 'task';
    const origin = state.sim?.lab === 'origin';
    const simName = state.sim && !task && !origin ? pick(EP_MANEUVERS[state.sim.maneuver], lang).name : '';
    const clipTitle = clipText?.title || '';
    // Do not repeat the case name when the clip title already starts with it.
    // A task recording keeps the case hidden: task number and evidence kind only.
    title.textContent = task ? taskPanel.title(lang) : origin ? originPanel.stripTitle(lang) : state.sim ? `${caseText.name}: ${simName}` : revealed ? (!clipTitle || clipTitle.startsWith(caseText.name) ? clipTitle || caseText.name : `${caseText.name}: ${clipTitle}`) : t.neutralTitle;
    simPanel.setCase(state.caseId);
    simPanel.element.hidden = state.section !== 'maneuver' || !simPanel.supports(state.caseId);
    pacingPanel.setCase(state.caseId);
    pacingPanel.element.hidden = state.section !== 'maneuver' || !pacingPanel.supports(state.caseId);
    // Each panel shows its result only while its own recording is on the strip.
    simPanel.setActive(Boolean(state.sim) && state.sim === simPanel.getLast());
    pacingPanel.setActive(Boolean(state.sim) && state.sim === pacingPanel.getLast());
    taskPanel.element.hidden = state.section !== 'diagnosis';
    originPanel.element.hidden = state.section !== 'diagnosis';
    if (!originPanel.element.hidden) originPanel.draw();
    taskPanel.setActive(task && taskPanel.owns(state.sim));
    sizeBtn.textContent = state.large ? (lang === 'en' ? 'Shrink' : 'Küçült') : (lang === 'en' ? 'Enlarge' : 'Büyüt');
    canvas.classList?.toggle?.('is-large', state.large);
    evidenceBtn.hidden = !diagnosis || task || origin;
    evidenceBtn.textContent = state.evidence ? t.evidenceHide : t.evidenceShow;
    text.textContent = state.sim ? '' : clipText ? (diagnosis ? (state.evidence ? clipText.evidence : clipText.neutral) : clipText.text) : '';
    text.textContent += !state.sim && diagnosis && !state.evidence ? ` ${t.neutralPrompt}` : '';
    text.hidden = !text.textContent;
    // Measurements come from the events themselves.
    measures.textContent = recording && recording.calipers.length
      ? `${t.measures}: ${recording.calipers.map((c) => `${c.label} ${measure(recording, c)} ms`).join(' · ')}`
      : '';
    measures.hidden = !measures.textContent;
    // Maneuver card and validity.
    const maneuver = recording?.maneuver && EP_MANEUVERS[recording.maneuver];
    card.replaceChildren();
    if (maneuver) {
      const m = pick(maneuver, lang);
      for (const key of ['goal', 'precondition', 'expected', 'inference', 'pitfall']) {
        const dt = el('dt');
        dt.textContent = t.maneuverFields[key];
        const dd = el('dd');
        dd.textContent = m[key];
        card.append(dt, dd);
      }
    }
    card.hidden = !maneuver;
    result.textContent = recording?.result && !state.sim ? `${maneuver ? pick(maneuver, lang).name : ''}: ${t.results[recording.result]}` : '';
    result.hidden = !result.textContent;
    result.dataset.result = recording?.result || '';
    // The anatomical zone (and the 3D arc) stays hidden while the diagnosis is neutral.
    const taskZone = () => (taskPanel.isAnswered() ? EP_CASES.find((c) => c.id === state.sim.caseId)?.pathwayZone || null : null);
    const zoneId = task ? taskZone() : origin || state.origin ? null : revealed ? currentCase()?.pathwayZone : null;
    const zoneText = zoneId && EP_ZONE_TEXT[zoneId];
    zoneLine.textContent = zoneText ? `${lang === 'en' ? 'Zone' : 'Zon'}: ${pick(zoneText, lang).name}. ${pick(zoneText, lang).risk}` : '';
    zoneLine.hidden = !zoneLine.textContent;
    const halo = Boolean(recording && (recording.catheters || []).includes('halo'));
    // A pacing laboratory recording shows its conduction routes only once the learner answered.
    const pacing = state.sim?.lab === 'pacing' ? pacingPanel.getScene() : null;
    const circuit = state.sim?.lab === 'pacing' ? pacing?.circuit || null : revealed ? recording?.circuit || null : null;
    const originMark = diagnosis && state.origin ? originPanel.getScene()?.origin || null : null;
    if (typeof onZone === 'function') onZone(zoneId && EP_ZONE_TEXT[zoneId] ? zoneId : null, { halo: Boolean(zoneId) && halo, circuit, paths: pacing?.paths || [], origin: originMark });
    // Annotated comparison card (focal AT against AVNRT/AVRT, antidromic AVRT against VT).
    const cmp = revealed && !state.sim && EP_COMPARE[state.clipId];
    compareBox.replaceChildren();
    if (cmp) {
      const c = pick(cmp, lang);
      const head = el('p', 'ep-compare-title');
      head.textContent = c.title;
      const table = el('table');
      const tr = (cells, tag) => { const row = el('tr'); for (const cell of cells) { const td = el(tag); td.textContent = cell; row.append(td); } return row; };
      table.append(tr(c.head, 'th'), ...c.rows.map((r) => tr(r, 'td')));
      compareBox.append(head, table);
    }
    compareBox.hidden = !cmp;
    // Atrial activation sequence of a tachycardia beat, once the evidence is open.
    const seq = diagnosis && state.evidence && !task && !origin && recording ? activationSequence(recording, 1) : [];
    mapBox.hidden = seq.length < 3;
    if (!mapBox.hidden) {
      mapTitle.textContent = lang === 'en' ? 'Atrial activation sequence (schematic channel map, not an electroanatomical map)' : 'Atriyal aktivasyon dizisi (şematik kanal haritası, elektroanatomik harita değil)';
      mapCanvas.setAttribute('aria-label', seq.map((r) => `${r.label} ${r.rel} ms`).join(', '));
      drawActivationMap(mapCanvas, seq, { lang });
    }
    compare.textContent = diagnosis && CS_OSTIUM_COMPARISON.includes(state.clipId) ? t.csCompare : '';
    compare.hidden = !compare.textContent;
    endpoint.textContent = state.section === 'treatment' ? `${t.endpointLabel}: ${caseText.endpoint}` : '';
    endpoint.hidden = !endpoint.textContent;
    sources.textContent = `${t.sources}: ${(currentCase()?.citations || []).join(', ')}. ${pick(EP_CITATION_NOTE, lang)}`;
    canvas.setAttribute('aria-label', `${lang === 'en' ? 'Synthetic electrogram strip, not a clinical recording' : 'Sentetik elektrogram şeridi, klinik kayıt değil'}: ${title.textContent}`);
    renderView();
  }

  render();
  return {
    element: root,
    /** Open a clip by id (lesson steps use the legacy scenario ids). */
    setScenario: setClip,
    openLesson: setClip,
    getScenario: () => state.clipId,
    getState: () => ({ section: state.section, caseId: state.caseId, clipId: state.clipId, evidence: state.evidence, large: state.large }),
    /** View state (channels shown, zoom, pan, inspection cursor) and the delivered maneuver, if any. */
    getView: () => ({ channels: current() ? visibleChannels(current()) : [], zoom: view.zoom, pan: view.pan, cursorMs: view.cursorMs, sim: state.sim ? state.sim.choices : null }),
    getRecording: () => current(),
    sim: simPanel,
    task: taskPanel,
    origin: originPanel,
    pacing: pacingPanel,
    fullscreen: () => fullscreen(),
    /** Zone of the active case; null while the diagnosis view is still neutral. */
    getZone: () => (state.section === 'diagnosis' && !state.evidence ? null : currentCase()?.pathwayZone || null),
    setLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      render();
      taskPanel.render();
      originPanel.render();
    },
    /** The recording has its own millisecond timeline: the heart clock draws no cursor. */
    draw() { redraw(); },
    show() { root.hidden = false; redraw(); },
    hide() { root.hidden = true; }
  };
}
