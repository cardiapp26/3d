import { FIG2_TEXT, FIG2_COLORS, FIG2_NAMES, FIG2_LABELS } from './rv-outflow-structures.js';

/*
 * Left-panel tools of the RV mode's Figure 2 view (Miyazaki 2026): switch,
 * colour legend, the three outflow structures, clinical notes and naming.
 */
export function createRvFigure2Panel(doc, { getLang = () => 'tr', onToggle = () => {} } = {}) {
  const state = { on: false };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const el = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const root = el('div', 'rvot-section-tools rv-fig2-tools', { 'data-rv-fig2': '' });
  const toggleLabel = el('label', 'layer');
  const swatch = el('i', '', { style: `background:linear-gradient(90deg,${FIG2_COLORS.inflow},${FIG2_COLORS.outflow},${FIG2_COLORS.crest},${FIG2_COLORS.smt},${FIG2_COLORS.apical})` });
  const toggleText = el('span');
  const toggle = el('input', '', { type: 'checkbox', 'data-rv-fig2-toggle': '' });
  toggleLabel.append(swatch, toggleText, toggle);
  const body = el('div', 'rvot-section-body', { 'data-rv-fig2-body': '' });
  const intro = el('p', 'ep-note'), legendTitle = el('strong'), legend = el('ul', 'rv-fig2-legend');
  const structures = el('dl', 'rvot-section-card'), clinical = el('ul', 'rvot-section-general'), names = el('p', 'ep-note'), limits = el('p', 'ep-note');
  body.append(intro, legendTitle, legend, structures, clinical, names, limits);
  root.append(toggleLabel, body);
  toggle.addEventListener('change', () => { state.on = toggle.checked; onToggle(state.on); render(); });

  function render() {
    const lang = L(), T = FIG2_TEXT[lang];
    toggleText.textContent = T.toggle;
    toggle.checked = state.on;
    body.hidden = !state.on;
    intro.textContent = T.intro;
    legendTitle.textContent = T.legend;
    legend.replaceChildren(...['inflow', 'outflow', 'apical', 'crest', 'smt'].map((id) => {
      const li = el('li'), dot = el('i', '', { style: `background:${FIG2_COLORS[id]}` });
      li.append(dot, FIG2_NAMES[id][lang]);
      return li;
    }));
    structures.replaceChildren(...T.items.flatMap(([id, text]) => {
      const dt = el('dt'), dd = el('dd');
      dt.textContent = id === 'band' ? FIG2_LABELS.band[lang] : FIG2_NAMES[id][lang];
      dd.textContent = text;
      return [dt, dd];
    }));
    clinical.replaceChildren(...T.clinical.map((c) => { const li = el('li'); li.textContent = c; return li; }));
    names.textContent = T.names;
    limits.textContent = T.limits;
  }

  render();
  return { element: root, render, setOn(on) { state.on = Boolean(on); render(); }, getState: () => ({ ...state }) };
}
