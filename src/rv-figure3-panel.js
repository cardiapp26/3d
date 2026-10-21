import { FIG3_TEXT, ELECTRODE_COLORS } from './rv-thorax.js';

/*
 * Left-panel tools of the RV mode's Figure 3 view (Miyazaki 2026, Fig. 3A-B):
 * switch, electrode legend, the measured V2-RVOT relation and outflow axes.
 */
export function createRvFigure3Panel(doc, { getLang = () => 'tr', onToggle = () => {}, onLevel = () => {}, getMeasures = () => null } = {}) {
  const state = { on: false, level: null };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const el = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const root = el('div', 'rvot-section-tools rv-fig3-tools', { 'data-rv-fig3': '' });
  const toggleLabel = el('label', 'layer');
  const swatch = el('i', '', { style: 'background:linear-gradient(90deg,#2f6fd6,#86aee8,#c8443c)' });
  const toggleText = el('span');
  const toggle = el('input', '', { type: 'checkbox', 'data-rv-fig3-toggle': '' });
  toggleLabel.append(swatch, toggleText, toggle);
  const body = el('div', 'rvot-section-body');
  const intro = el('p', 'ep-note'), legend = el('ul', 'rv-fig2-legend');
  const levelRow = el('div', 'rvot-section-pick', { role: 'group' }), levelNote = el('p', 'ep-note', { 'data-rv-fig3-level-note': '' });
  const levelButtons = new Map(['front', 'root', 'high', 'low'].map((id) => {
    const b = el('button', '', { type: 'button', 'data-rv-fig3-level': id });
    b.addEventListener('click', () => { state.level = id === 'front' ? null : id; onLevel(state.level); render(); });
    levelRow.append(b);
    return [id, b];
  }));
  const measured = el('div', 'rvot-section-card', { 'data-rv-fig3-measure': '' });
  const points = el('ul', 'rvot-section-general'), limits = el('p', 'ep-note');
  body.append(intro, levelRow, levelNote, legend, measured, points, limits);
  root.append(toggleLabel, body);
  toggle.addEventListener('change', () => { state.on = toggle.checked; state.level = null; onToggle(state.on); render(); });

  function render() {
    const T = FIG3_TEXT[L()];
    toggleText.textContent = T.toggle;
    toggle.checked = state.on;
    body.hidden = !state.on;
    intro.textContent = T.intro;
    for (const [id, b] of levelButtons) { b.textContent = T.levels[id]; b.setAttribute('aria-pressed', String((state.level || 'front') === id)); }
    levelNote.textContent = state.level ? `${T.levelNote[state.level]} ${T.levelLimits}` : '';
    levelNote.hidden = !state.level;
    legend.replaceChildren(...Object.entries(ELECTRODE_COLORS).map(([id, color]) => {
      const li = el('li'), dot = el('i', '', { style: `background:${color}` });
      li.append(dot, id);
      return li;
    }));
    const m = getMeasures();
    measured.hidden = !m;
    if (m) {
      const a = el('p'), b = el('p');
      a.textContent = T.v2(m.v2); b.textContent = T.axes(m);
      measured.replaceChildren(a, b);
    }
    points.replaceChildren(...T.points.map((p) => { const li = el('li'); li.textContent = p; return li; }));
    limits.textContent = T.limits;
  }

  render();
  return { element: root, render, setOn(on) { state.on = Boolean(on); state.level = null; render(); }, getState: () => ({ ...state }) };
}
