import { LEADS, LEAD_OPTIONS, localize, PHASES, CS_CHANNELS, csSequence, ablationFindings, epTimeline, ERP_RANGE, pathwayRisk } from './wpw-loc-model.js';
import { WPW_EXAMPLES, visualSvg, renderAnnulusMap, renderPolarity, renderEpMonitor } from './wpw-loc-visual.js';
import { WPW_LOC_TEXT } from './wpw-loc-text.js';
import { createBostonGuide } from './ap-boston-guide.js';

/*
 * WPW visual workbook: three learning pages. (1) the surface ECG algorithm:
 * delta polarity chosen lead by lead, the next lead named, the site decided;
 * (2) CS activation and ablation: no pathway, the selected pathway before
 * ablation and after it, on one laboratory monitor (lead I, aVL, His,
 * ablation tip, CS) with the CS order, the ablation steps of its wall and
 * the masked left bundle branch block of the lecture patient; (3) the
 * anterograde refractory period cut-off.
 * Pure logic lives in wpw-loc-model.js.
 */

export function createWpwLocPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => WPW_LOC_TEXT[L()];
  const state = { active: false, page: 'loc', allLeads: false, leads: {}, csPhase: 'before', csSite: 'leftLateral', erp: 210 };

  const root = el('section', 'basics wpw', { 'data-wpw': '' });
  root.hidden = true;
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const source = el('p', 'amap-source');
  const grid = el('div', 'wpw-workspace');
  const nav = el('nav', 'wpw-page-nav');
  const navButtons = new Map();
  root.append(heading, intro, nav, grid, source);
  const card = (name) => { const c = el('section', 'basics-card', { 'data-wpw-card': name }); const h = el('h4'); c.append(h); grid.append(c); return { c, h }; };
  const button = (attrs, onClick) => { const b = el('button', 'amap-toggle', { type: 'button', ...attrs }); b.addEventListener('click', onClick); return b; };
  const chips = () => el('dl', 'amap-readout');
  const setChips = (dl, rows) => dl.replaceChildren(...rows.flatMap(([label, value]) => { const dt = el('dt'); dt.textContent = label; const dd = el('dd'); dd.textContent = value; return [dt, dd]; }));
  const note = () => el('p', 'amap-note');
  for (const id of ['loc', 'cs', 'risk']) {
    const b = button({ 'data-wpw-page': id }, () => { state.page = id; root.scrollTop = 0; render(); });
    nav.append(b); navButtons.set(id, b);
  }

  // ---- 1. localization ---------------------------------------------------------------------
  const loc = card('loc');
  const locHint = note();
  const allLeads = button({ 'data-wpw-all-leads': '' }, () => { state.allLeads = !state.allLeads; render(); });
  const locLayout = el('div', 'wpw-localize-layout');
  const locInputs = el('div', 'wpw-inputs');
  const mapCard = el('aside', 'wpw-map-card');
  const mapHeading = el('h4'), mapNote = note();
  const mapSvg = visualSvg(doc, '0 0 420 275', 'wpw-annulus-map');
  const mapList = el('div', 'wpw-site-list');
  const siteButtons = new Map();
  for (const [i, id] of Object.keys(WPW_EXAMPLES).entries()) {
    const b = button({ 'data-wpw-example': id }, () => { state.leads = { ...WPW_EXAMPLES[id] }; state.csSite = id; render(); });
    const number = el('span', 'wpw-site-number'); number.textContent = String(i + 1);
    const label = el('span'); b.append(number, label); mapList.append(b); siteButtons.set(id, { b, label });
  }
  mapCard.append(mapHeading, mapSvg, mapNote, mapList);
  locLayout.append(locInputs, mapCard);
  const leadBlocks = new Map();
  for (const lead of LEADS) {
    const block = el('div', 'wpw-lead', { 'data-wpw-lead': lead });
    const name = el('strong');
    const hint = el('span', 'svt-note');
    const row = el('div', 'amap-toggles');
    const buttons = new Map();
    for (const option of LEAD_OPTIONS[lead]) {
      const b = button({ 'data-wpw-option': `${lead}:${option}` }, () => {
        if (state.leads[lead] === option) delete state.leads[lead]; else state.leads[lead] = option;
        render();
      });
      const wave = visualSvg(doc, '0 0 114 84', 'wpw-option-wave');
      const caption = el('span');
      b.append(wave, caption);
      buttons.set(option, { b, wave, caption }); row.append(b);
    }
    block.append(name, hint, row);
    leadBlocks.set(lead, { block, name, hint, buttons });
  }
  const verdict = el('p', 'svt-verdict', { 'data-wpw-verdict': '', role: 'status' });
  const pathList = el('ul', 'basics-lines', { 'data-wpw-path': '' });
  const locReset = button({ 'data-wpw-reset': '' }, () => { state.leads = {}; render(); });
  const progress = el('div', 'wpw-progress', { 'data-wpw-progress': '', role: 'status' });
  locInputs.append(...['d1', 'v1', 'd2', 'avf', 'd3'].map(id => leadBlocks.get(id).block), allLeads);
  loc.c.append(locHint, progress, locLayout, verdict, pathList, locReset);
  const boston = createBostonGuide(doc, L);
  loc.c.append(boston.element);

  // ---- 2. coronary sinus -------------------------------------------------------------------
  const cs = card('cs');
  const csHint = note();
  const csLayout = el('div', 'wpw-cs-layout');
  const csMapCard = el('aside', 'wpw-map-card');
  const csMapHeading = el('h4'), csMapNote = note();
  const csMapSvg = visualSvg(doc, '0 0 420 275', 'wpw-annulus-map');
  const csSiteList = el('div', 'wpw-site-list');
  const csSiteButtons = new Map();
  const selectCsSite = id => { state.csSite = id; state.leads = { ...WPW_EXAMPLES[id] }; if (state.csPhase === 'normal') state.csPhase = 'before'; render(); };
  for (const [i, id] of Object.keys(WPW_EXAMPLES).entries()) {
    const b = button({ 'data-wpw-cs-site': id }, () => selectCsSite(id));
    const number = el('span', 'wpw-site-number'); number.textContent = String(i + 1);
    const label = el('span'); b.append(number, label); csSiteList.append(b); csSiteButtons.set(id, { b, label });
  }
  csMapCard.append(csMapHeading, csMapSvg, csMapNote, csSiteList);
  const csTraceCard = el('div', 'wpw-cs-detail');
  const csSiteHeading = el('h4', '', { 'data-wpw-cs-title': '', role: 'status' });
  const csBtns = PHASES.map((id) => button({ 'data-wpw-cs-phase': id }, () => { state.csPhase = id; render(); }));
  const csRow = el('div', 'amap-toggles'); csRow.append(...csBtns);
  const csBars = el('div', 'wpw-bars', { role: 'img', 'data-wpw-cs-bars': '' });
  const csRows = new Map(CS_CHANNELS.map((id) => {
    const r = el('div', 'wpw-bar', { 'data-wpw-cs-channel': id });
    const label = el('span'); const track = el('span', 'wpw-track'); const fill = el('span', 'wpw-fill');
    track.append(fill); r.append(label, track); csBars.append(r);
    return [id, { r, label, fill }];
  }));
  const csChips = chips();
  const csNote = note();
  const monitor = visualSvg(doc, '0 0 420 330', 'wpw-ablation-ecg');
  const monitorNote = note();
  const ablChips = chips();
  const steps = el('ol', 'basics-lines', { 'data-wpw-steps': '' });
  const masked = el('p', 'svt-verdict', { 'data-wpw-masked': '' });
  csTraceCard.append(csSiteHeading, csRow, monitor, monitorNote, ablChips, csBars, csChips, csNote, steps, masked);
  csLayout.append(csMapCard, csTraceCard);
  cs.c.append(csHint, csLayout);

  // ---- 3. refractory period ----------------------------------------------------------------
  const risk = card('risk');
  const erpLabel = el('label', 'amap-field');
  const erpName = el('span');
  const erpIn = el('input', '', { type: 'range', min: String(ERP_RANGE[0]), max: String(ERP_RANGE[1]), step: '5', 'data-wpw-erp': '' });
  const erpOut = el('output');
  erpIn.addEventListener('input', () => { state.erp = Number(erpIn.value); render(); });
  erpLabel.append(erpName, erpIn, erpOut);
  const riskVerdict = el('p', 'svt-verdict', { 'data-wpw-risk': '', role: 'status' });
  const riskGauge = el('div', 'wpw-risk-gauge');
  const riskMarker = el('span');
  riskGauge.append(riskMarker);
  const riskNote = note();
  risk.c.append(erpLabel, riskGauge, riskVerdict, riskNote);

  function render() {
    const t = T();
    heading.textContent = t.heading; intro.textContent = t.intro; source.textContent = t.source;
    nav.setAttribute('aria-label', t.page.navigation);
    const cards = { loc, cs, risk };
    for (const [i, [id, b]] of [...navButtons].entries()) {
      b.textContent = `${String(i + 1).padStart(2, '0')} · ${t.page[id]}`;
      b.setAttribute('aria-pressed', String(state.page === id));
      cards[id].c.hidden = state.page !== id;
    }

    // 1
    boston.render();
    loc.h.textContent = t.loc.title; locHint.textContent = t.loc.hint; locReset.textContent = t.loc.reset;
    const result = localize(state.leads);
    if (result.site) state.csSite = result.site;
    allLeads.textContent = state.allLeads ? t.page.guided : t.page.allLeads;
    allLeads.setAttribute('aria-pressed', String(state.allLeads));
    for (const [lead, parts] of leadBlocks) {
      const text = t.loc.leads[lead];
      parts.name.textContent = text.name; parts.hint.textContent = text.hint;
      parts.block.setAttribute('data-next', String(result.next === lead));
      for (const [option, { b, wave, caption }] of parts.buttons) {
        caption.textContent = text.options[option];
        b.setAttribute('aria-label', `${text.name}: ${text.options[option]}`);
        b.setAttribute('aria-pressed', String(state.leads[lead] === option));
        renderPolarity(doc, wave, option, L());
      }
      parts.block.setAttribute('data-read', String(result.path.some(p => p.lead === lead)));
      parts.block.hidden = !state.allLeads && lead !== 'd1' && lead !== result.next && !result.path.some(p => p.lead === lead);
    }
    mapHeading.textContent = t.page.mapTitle; mapNote.textContent = t.page.mapNote;
    renderAnnulusMap(doc, mapSvg, { lang: L(), site: result.site, sites: t.loc.sites, onSelect(id) {
      state.leads = { ...WPW_EXAMPLES[id] }; state.csSite = id; render();
      mapSvg.querySelector?.(`[data-wpw-map-site=${id}]`)?.focus();
    } });
    for (const [id, { b, label }] of siteButtons) {
      label.textContent = t.loc.sites[id].name;
      b.setAttribute('aria-pressed', String(result.site === id));
    }
    progress.textContent = result.site ? t.page.complete : result.stalled ? t.loc.stalled : `${t.page.read}: ${t.loc.leads[result.next].name} · ${result.path.length} ${t.page.decisions}`;
    verdict.setAttribute('data-state', result.site ? 'single' : result.stalled ? 'conflict' : 'open');
    verdict.setAttribute('data-site', result.site || '');
    verdict.textContent = result.site ? `${t.loc.result}: ${t.loc.sites[result.site].name}. ${t.loc.sites[result.site].note}`
      : result.stalled ? t.loc.stalled : `${t.loc.next} ${t.loc.leads[result.next].name}`;
    pathList.replaceChildren(...result.path.map((p) => { const li = el('li', '', { 'data-wpw-step': p.lead }); li.textContent = `${t.loc.leads[p.lead].name}: ${t.loc.leads[p.lead].options[p.option]}. ${t.loc.means[p.means]}`; return li; }));

    // 2
    cs.h.textContent = t.cs.title; csHint.textContent = t.cs.hint;
    csMapHeading.textContent = t.page.mapTitle; csMapNote.textContent = t.cs.mapNote;
    // "No accessory pathway": no site is selected anywhere on this page.
    const csSite = state.csPhase === 'normal' ? null : state.csSite;
    csSiteHeading.textContent = csSite ? t.loc.sites[csSite].name : t.cs.normalTitle;
    csSiteHeading.setAttribute('data-site', csSite || 'none');
    renderAnnulusMap(doc, csMapSvg, { lang: L(), site: csSite, sites: t.loc.sites, onSelect(id) {
      selectCsSite(id);
      csMapSvg.querySelector?.(`[data-wpw-map-site=${id}]`)?.focus();
    } });
    for (const [id, { b, label }] of csSiteButtons) {
      label.textContent = t.loc.sites[id].name;
      b.setAttribute('aria-pressed', String(csSite === id));
    }
    csNote.textContent = t.cs.profiles[state.csPhase !== 'before' ? 'normal' : state.csSite === 'leftLateral' ? 'lateral' : state.csSite === 'leftPosterior' ? 'posterior' : 'proximal'];
    csBtns.forEach((b, i) => { b.textContent = t.cs.phases[PHASES[i]]; b.setAttribute('aria-pressed', String(state.csPhase === PHASES[i])); });
    const seq = csSequence(state.csPhase, state.csSite);
    for (const [id, parts] of csRows) {
      parts.label.textContent = t.cs.channels[id];
      parts.fill.setAttribute('style', `width:${8 + seq.onsets[id] * 2}px`);
      parts.r.setAttribute('data-earliest', String(seq.earliest === id));
      parts.r.setAttribute('data-onset', String(seq.onsets[id]));
    }
    csBars.setAttribute('aria-label', t.cs.title);
    const proximalFirst = seq.earliest === CS_CHANNELS[0];
    setChips(csChips, [[t.cs.earliest, t.cs.channels[seq.earliest]], [t.cs.title.split(' (')[0], proximalFirst ? t.cs.order.proximal : seq.earliest === 'cs12' ? t.cs.order.distal : t.cs.order.middle]]);
    csChips.setAttribute('data-earliest', seq.earliest);

    // The same beat on the laboratory monitor, with the ablation reading.
    const f = ablationFindings(state.csPhase, state.csSite);
    renderEpMonitor(doc, monitor, epTimeline(state.csPhase, state.csSite), L(), { ...t.abl.channels, cs: t.cs.channels });
    monitor.setAttribute('data-site', csSite || 'none');
    monitor.setAttribute('data-phase', state.csPhase);
    monitorNote.textContent = t.abl.monitor;
    setChips(ablChips, [
      [t.abl.chips.delta, f.delta ? t.abl.present : t.abl.absent],
      [t.abl.chips.pr, `${f.pr} ms · ${f.shortPr ? t.abl.shortPr : t.abl.normalPr}`],
      [t.abl.chips.hv, `${f.hv} ms · ${f.hv < 35 ? t.abl.hvShort : t.abl.hvNormal}`],
      [t.abl.chips.ablLead, f.ablLead === null ? t.abl.notApplicable : `${f.ablLead} ms ${t.abl.earlier} · ${t.abl.fused}`],
      ...(f.lbbbPresent ? [[t.abl.chips.lbbb, f.lbbbVisible ? t.abl.shown : t.abl.hidden]] : [])
    ]);
    ablChips.setAttribute('data-phase', state.csPhase);
    ablChips.setAttribute('data-group', f.group);
    steps.hidden = state.csPhase === 'normal';
    steps.replaceChildren(...t.abl.steps[f.group].map((line) => { const li = el('li'); li.textContent = line; return li; }));
    masked.textContent = t.abl.masked;
    masked.hidden = !f.lbbbVisible;

    // 3
    risk.h.textContent = t.risk.title; erpName.textContent = t.risk.label;
    erpIn.value = String(state.erp); erpOut.textContent = `${state.erp} ms`;
    const r = pathwayRisk(state.erp);
    riskVerdict.textContent = t.risk[r]; riskVerdict.setAttribute('data-state', r === 'short' ? 'conflict' : 'single'); riskVerdict.setAttribute('data-risk', r);
    riskNote.textContent = t.risk.note;
    riskMarker.setAttribute('style', `left:${(state.erp - ERP_RANGE[0]) / (ERP_RANGE[1] - ERP_RANGE[0]) * 100}%`);
    riskMarker.textContent = `${state.erp} ms`;
    riskGauge.setAttribute('aria-hidden', 'true');
  }

  return {
    element: root,
    render,
    setActive(flag) { state.active = Boolean(flag); root.hidden = !state.active; if (state.active) render(); },
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); render(); return { ...state, leads: { ...state.leads } }; },
    getState: () => ({ ...state, leads: { ...state.leads } })
  };
}
