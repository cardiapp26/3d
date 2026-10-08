import { VES_REGIONS, VES_INPUTS, VES_OPTIONS, VES_SOURCES, VES_POSITIONS, vesRegion, vesEcg, vesFrontalAxis, vesFeatures, localizeVes, v2TransitionRatio, vesRecording } from './ves-loc-model.js';
import { VES_TEXT } from './ves-loc-text.js';
import { vesSvg, renderVesOption, renderVesEcg, renderVesRecording } from './ves-loc-visual.js';
import { renderVesMap, renderV1Gradient, renderFrontalVector, VIEW_SITES } from './ves-loc-map.js';

export function createVesLocPanel(doc, { getLang = () => 'tr' } = {}) {
  const state = { active: false, page: 'loc', mapView: 'base', atlas3d: false, v1Principle: false, selected: 'rvot-septal', inputs: vesFeatures('rvot-septal'), position: 'near', scar: false, amplitudes: {} };
  const L = () => getLang() === 'en' ? 'en' : 'tr';
  const el = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag); n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const note = () => el('p', 'amap-note');
  const button = (attrs, action) => { const b = el('button', 'amap-toggle', { type: 'button', ...attrs }); b.addEventListener('click', action); return b; };
  const root = el('section', 'basics ves', { 'data-ves': '' }); root.hidden = true;
  const heading = el('h3', 'amap-title'), intro = note();
  const nav = el('nav', 'wpw-page-nav');
  const navButtons = new Map(['loc', 'recordings'].map(id => {
    const b = button({ 'data-ves-page': id }, () => { state.page = id; root.scrollTop = 0; render(); });
    nav.append(b); return [id, b];
  }));
  const pages = new Map();
  for (const id of ['loc', 'recordings']) pages.set(id, el('section', 'basics-card ves-page', { 'data-ves-card': id }));
  root.append(heading, intro, nav, ...pages.values());

  function select(id) {
    if (!vesRegion(id)) return;
    state.selected = id; state.inputs = vesFeatures(id); state.position = 'near'; state.amplitudes = {};
    // Stay on an opened view (root, RVOT) when the example is drawn there; otherwise show its home view.
    state.mapView = VIEW_SITES[state.mapView]?.[id] ? state.mapView : vesRegion(id).view;
    render();
  }
  const mapParts = [];
  function buildMap(parent, recording = false) {
    const box = el('aside', 'ves-atlas');
    const h = el('h4');
    const viewRow = el('div', 'amap-toggles');
    const viewButtons = new Map(['base', 'root', 'rvot', 'chambers'].map(view => {
      const b = button({ 'data-ves-map-view': view }, () => { state.mapView = view; render(); });
      viewRow.append(b); return [view, b];
    }));
    const atlasToggle = button({ 'data-ves-atlas-3d': '', 'aria-pressed': 'false' }, () => { state.atlas3d = !state.atlas3d; render(); });
    atlasToggle.textContent = '3D'; viewRow.append(atlasToggle);
    const principleToggle = button({ 'data-ves-v1-principle': '', 'aria-pressed': 'false' }, () => { state.v1Principle = !state.v1Principle; render(); });
    viewRow.append(principleToggle);
    const svg = vesSvg(doc, '0 0 760 350', 'ves-map');
    const gradient = vesSvg(doc, '0 0 370 100', 'ves-v1-gradient');
    const frontal = vesSvg(doc, '0 0 370 214', 'ves-frontal');
    // SVG elements have no `hidden` property; the wrapper div carries it.
    const frontalBox = el('div', 'ves-frontal-box'); frontalBox.append(frontal);
    const n = note(), list = el('div', 'ves-site-list');
    const buttons = new Map(VES_REGIONS.map(r => {
      const b = button({ 'data-ves-example': r.id }, () => select(r.id));
      list.append(b); return [r.id, b];
    }));
    box.append(h, viewRow, svg, gradient, frontalBox, n, list); parent.append(box);
    mapParts.push({ h, svg, gradient, frontal, frontalBox, n, buttons, viewButtons, atlasToggle, principleToggle, recording });
  }
  const loc = pages.get('loc'), recordings = pages.get('recordings');
  const locLayout = el('div', 'ves-localize-layout');
  const findings = el('div', 'ves-findings');
  locLayout.append(findings); buildMap(locLayout); loc.append(locLayout);
  const progress = el('p', 'wpw-progress', { 'data-ves-progress': '', role: 'status' }); findings.append(progress);
  const inputParts = new Map();
  for (const key of VES_INPUTS) {
    const block = el('div', 'ves-finding', { 'data-ves-input': key });
    const name = el('strong'), hint = note(), row = el('div', 'ves-options');
    const buttons = new Map(VES_OPTIONS[key].map(option => {
      const b = button({ 'data-ves-option': `${key}:${option}` }, () => {
        if (state.inputs[key] === option) delete state.inputs[key]; else state.inputs[key] = option;
        state.selected = null; state.amplitudes = {}; render();
      });
      const wave = vesSvg(doc, '0 0 100 60', 'ves-option-wave'), caption = el('span');
      b.append(wave, caption); row.append(b); return [option, { b, wave, caption }];
    }));
    block.append(name, row, hint); findings.append(block); inputParts.set(key, { block, name, hint, buttons });
  }
  const reset = button({ 'data-ves-reset': '' }, () => { state.inputs = {}; state.selected = null; state.amplitudes = {}; render(); });
  const scarLabel = el('label', 'ves-scar');
  const scarInput = el('input', '', { type: 'checkbox', 'data-ves-scar': '' }), scarText = el('span');
  scarInput.addEventListener('change', () => { state.scar = scarInput.checked; render(); });
  scarLabel.append(scarInput, scarText); findings.append(reset, scarLabel);
  const verdict = el('p', 'svt-verdict', { 'data-ves-verdict': '', role: 'status' });
  const overlap = note(), pathHeading = el('h4'), path = el('ol', 'ves-path', { 'data-ves-path': '' });
  loc.append(verdict, overlap, pathHeading, path);

  const ecgBox = el('section', 'ves-surface');
  const exampleTitle = el('h4', '', { 'data-ves-example-title': '' }), synthetic = note();
  const ecgSvg = vesSvg(doc, '0 0 800 305', 'ves-ecg');
  const ecgWindow = el('div', 'ves-strip-window', { tabindex: '0', role: 'region' }); ecgWindow.append(ecgSvg);
  const ecgScrollHint = note(); ecgScrollHint.className = 'amap-note ves-scroll-hint';
  const manualNote = note();
  const openRecord = button({ 'data-ves-open-recording': '' }, () => { state.page = 'recordings'; root.scrollTop = 0; render(); });
  ecgBox.append(exampleTitle, synthetic, ecgWindow, ecgScrollHint, manualNote, openRecord); loc.append(ecgBox);

  const ratioBox = el('section', 'ves-ratio');
  const ratioHeading = el('h4'), formula = el('p', 'ves-formula'), ratioNote = note();
  const ampRow = el('div', 'ves-amplitudes'), ampParts = new Map();
  for (const key of ['pvcR', 'pvcS', 'sinusR', 'sinusS']) {
    const label = el('label', 'amap-field'), text = el('span');
    const input = el('input', '', { type: 'number', min: '0', step: '0.01', 'data-ves-amplitude': key });
    input.addEventListener('input', () => { state.amplitudes[key] = input.value; render(); });
    label.append(text, input); ampRow.append(label); ampParts.set(key, { text, input });
  }
  const ratioVerdict = el('p', 'svt-verdict', { 'data-ves-ratio-result': '', role: 'status' });
  ratioBox.append(ratioHeading, formula, ratioNote, ampRow, ratioVerdict); loc.append(ratioBox);

  const recordLayout = el('div', 'ves-record-layout'); buildMap(recordLayout, true);
  const detail = el('div', 'ves-detail'), recordTitle = el('h4', '', { 'data-ves-record-title': '' });
  const fields = el('dl', 'ves-anatomy', { 'data-ves-anatomy': '' });
  const posTitle = el('strong'), posRow = el('div', 'amap-toggles');
  const positionButtons = new Map(VES_POSITIONS.map(id => {
    const b = button({ 'data-ves-position': id }, () => { state.position = id; render(); }); posRow.append(b); return [id, b];
  }));
  const readout = el('dl', 'amap-readout', { 'data-ves-readout': '' });
  const monitor = vesSvg(doc, '0 0 800 505', 'ves-monitor');
  const monitorWindow = el('div', 'ves-strip-window', { tabindex: '0', role: 'region' }); monitorWindow.append(monitor);
  const monitorScrollHint = note(); monitorScrollHint.className = 'amap-note ves-scroll-hint';
  const recordNote = note(), catheterNote = note(), noRecord = note(), recordSynthetic = note();
  detail.append(recordTitle, noRecord, posTitle, posRow, monitorWindow, monitorScrollHint, readout, fields, recordNote, catheterNote, recordSynthetic);
  recordLayout.append(detail); recordings.append(recordLayout);

  const sourceDetails = el('details', 'ves-sources'), sourceSummary = el('summary'), sourceNote = note();
  const sourceList = el('ul');
  for (const source of VES_SOURCES) {
    const li = el('li'), a = el('a', 'ep-ref', { href: source.url, target: '_blank', rel: 'noopener noreferrer' });
    a.textContent = source.title; li.append(a); sourceList.append(li);
  }
  sourceDetails.append(sourceSummary, sourceNote, sourceList); root.append(sourceDetails);
  const optionText = (t, key, value) => key === 'transition' ? t.transitionOptions[value] || t.options[value] : t.options[value];
  const fillDl = (dl, rows) => dl.replaceChildren(...rows.flatMap(([k, v]) => { const dt = el('dt'), dd = el('dd'); dt.textContent = k; dd.textContent = v; return [dt, dd]; }));

  function render() {
    const t = VES_TEXT[L()], result = localizeVes(state.inputs, { scar: state.scar });
    const selected = vesRegion(state.selected), candidateIds = state.scar ? [] : result.candidates;
    heading.textContent = t.heading; intro.textContent = t.intro; nav.setAttribute('aria-label', t.nav);
    for (const [id, b] of navButtons) { b.textContent = t.pages[id]; b.setAttribute('aria-pressed', state.page === id); pages.get(id).hidden = state.page !== id; }
    progress.textContent = result.next ? `${t.next}: ${t.inputNames[result.next]}` : t.decision;
    for (const [key, parts] of inputParts) {
      parts.name.textContent = t.inputNames[key]; parts.hint.textContent = t.hints[key];
      parts.block.setAttribute('data-next', result.next === key);
      for (const [option, part] of parts.buttons) {
        part.caption.textContent = optionText(t, key, option); part.b.setAttribute('aria-pressed', state.inputs[key] === option);
        part.b.setAttribute('aria-label', `${t.inputNames[key]}: ${optionText(t, key, option)}`);
        renderVesOption(doc, part.wave, key, option);
      }
    }
    reset.textContent = t.reset; scarText.textContent = t.scar; scarInput.checked = state.scar;
    verdict.setAttribute('data-candidates', candidateIds.join(',')); verdict.setAttribute('data-state', state.scar ? 'scar' : result.status);
    verdict.textContent = state.scar ? t.scarNote : result.conflict ? t.conflict : candidateIds.length ? `${t.result}: ${candidateIds.map(id => t.sites[id].name).join(' · ')}` : t[result.status === 'unresolved' ? 'unresolved' : 'pending'];
    overlap.textContent = t.overlap; pathHeading.textContent = t.decision;
    path.replaceChildren(...result.path.map(p => { const li = el('li'); li.textContent = `${t.inputNames[p.key]}: ${optionText(t, p.key, p.value)}`; return li; }));
    for (const parts of mapParts) {
      parts.h.textContent = t.map; parts.n.textContent = t.mapNote;
      for (const [view, b] of parts.viewButtons) { b.textContent = t[view]; b.setAttribute('aria-pressed', state.mapView === view); }
      parts.atlasToggle.setAttribute('aria-pressed', state.atlas3d); parts.atlasToggle.hidden = state.mapView !== 'base';
      parts.principleToggle.textContent = t.v1Principle; parts.principleToggle.setAttribute('aria-pressed', state.v1Principle); parts.principleToggle.hidden = state.mapView !== 'chambers';
      renderVesMap(doc, parts.svg, { t, selected: state.selected, candidates: candidateIds, position: parts.recording && selected ? state.position : null, view: state.mapView, atlas3d: state.atlas3d, v1Principle: state.v1Principle,
        onSelect(id) { select(id); parts.svg.querySelector?.(`[data-ves-map-site="${id}"]`)?.focus(); } });
      renderV1Gradient(doc, parts.gradient, { t, selected: state.selected });
      renderFrontalVector(doc, parts.frontal, { t, selected: state.selected, axis: selected ? vesFrontalAxis(selected.id) : null });
      parts.frontalBox.hidden = !selected;
      for (const [id, b] of parts.buttons) {
        b.textContent = `${vesRegion(id).number} · ${t.sites[id].name}`; b.setAttribute('aria-pressed', state.selected === id);
        b.setAttribute('data-candidate', candidateIds.includes(id));
      }
    }
    exampleTitle.textContent = selected ? `${t.example}: ${t.sites[selected.id].name}` : t.manual;
    synthetic.textContent = t.synthetic; synthetic.hidden = !selected;
    manualNote.textContent = t.manualEcg; manualNote.hidden = Boolean(selected);
    ecgSvg.hidden = ecgWindow.hidden = ecgScrollHint.hidden = !selected; openRecord.hidden = !selected; openRecord.textContent = t.openRecord;
    ecgWindow.setAttribute('aria-label', t.synthetic); ecgScrollHint.textContent = t.scrollHint;
    if (selected) renderVesEcg(doc, ecgSvg, vesEcg(selected.id), t);
    ratioHeading.textContent = t.ratio; formula.textContent = t.formula; ratioNote.textContent = t.ratioNote;
    const ratio = state.scar ? { status: 'outside', value: null } : v2TransitionRatio(state.inputs, state.amplitudes);
    ratioVerdict.textContent = `${ratio.value == null ? '' : `${ratio.value.toFixed(3)} · `}${t.ratioStatus[ratio.status]}`;
    ratioVerdict.setAttribute('data-result', ratio.status);
    for (const [key, parts] of ampParts) {
      parts.text.textContent = t.amplitude[key];
      if (doc.activeElement !== parts.input) parts.input.value = state.amplitudes[key] ?? '';
      parts.input.disabled = ratio.status === 'outside';
    }

    recordTitle.textContent = selected ? `${t.selected}: ${t.sites[selected.id].name}` : t.noSelected;
    noRecord.textContent = t.noSelected; noRecord.hidden = Boolean(selected);
    for (const n of [fields, posTitle, posRow, monitorWindow, monitorScrollHint, monitor, readout, recordNote, catheterNote, recordSynthetic]) n.hidden = !selected;
    monitorWindow.setAttribute('aria-label', t.monitor); monitorScrollHint.textContent = t.scrollHint;
    posTitle.textContent = t.position;
    for (const [id, b] of positionButtons) { b.textContent = t.positions[id]; b.setAttribute('aria-pressed', state.position === id); }
    if (selected) {
      const r = vesRecording(selected.id, state.position), text = t.sites[selected.id];
      fillDl(fields, ['anatomy', 'ecg', 'record', 'caution'].map(key => [t[key], text[key === 'record' ? 'recording' : key]]));
      fillDl(readout, [[t.local, `${r.local} ms`], [t.uni, r.unipolar], ...(r.purkinje == null ? [] : [[t.purkinje, `${r.purkinje} ms`]])]);
      readout.setAttribute('data-local', r.local); readout.setAttribute('data-unipolar', r.unipolar);
      renderVesRecording(doc, monitor, r, t);
    }
    recordNote.textContent = t.recordNote; catheterNote.textContent = t.catheterNote; recordSynthetic.textContent = t.synthetic;
    sourceSummary.textContent = t.sources; sourceNote.textContent = t.sourceNote;
  }

  return { element: root, render, select,
    setActive(flag) { state.active = Boolean(flag); root.hidden = !state.active; if (state.active) render(); },
    getState: () => ({ ...state, inputs: { ...state.inputs }, amplitudes: { ...state.amplitudes } }),
    getRecording: () => vesRecording(state.selected, state.position)
  };
}
