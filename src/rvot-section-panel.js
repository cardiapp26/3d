import { RVOT_SEGMENTS, RVOT_SEGMENT_TEXT, RVOT_SEGMENT_SOURCES } from './eps/rvot-segments.js';
import { RVOT_SEGMENT_COLORS } from './rvot-section.js';

/*
 * Left-panel tools of the RV mode's RVOT superior section: the on/off switch,
 * one button per segment and the segment card (neighbour, surface, ablation,
 * devices, figure) with the posterior free-wall variant. Text is shared with
 * the EPS RVOT segment map (Miyazaki 2026; Aronis 2026).
 */
const UI = {
  tr: { camera: 'Bakış', cameras: { superior: 'Üstten (Şekil 4, 11C, 12C)', posterior: 'Arkadan (Şekil 11–12 A–B)' }, toggle: 'RVOT üstten kesit · 6 segment', note: 'Pulmoner kapağın hemen altından kesilmiş, yukarıdan bakış: ön yukarıda, hasta sağı sağda. Kesit ve segment sınırları bu atlasın geometrisinden türetilmiş öğretim bölgeleridir.', pick: 'Segment seç', all: 'Tümü', sources: 'Kaynaklar' },
  en: { camera: 'View', cameras: { superior: 'Superior (Figs. 4, 11C, 12C)', posterior: 'Posterior (Figs. 11–12 A–B)' }, toggle: 'RVOT superior section · 6 segments', note: 'Cut just below the pulmonary valve, seen from above: anterior up, patient right on the right. The cut and segment borders are teaching regions derived from this atlas geometry.', pick: 'Pick a segment', all: 'All', sources: 'Sources' }
};

export function createRvotSectionPanel(doc, { getLang = () => 'tr', onToggle = () => {}, onSegment = () => {}, onVariant = () => {}, onCamera = () => {} } = {}) {
  const state = { on: false, segment: null, variant: 'present', camera: 'superior' };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const el = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const root = el('div', 'rvot-section-tools', { 'data-rvot-section': '' });
  const toggleLabel = el('label', 'layer');
  const swatch = el('i', '', { style: `background:linear-gradient(90deg,${['anterior', 'lateral', 'posterolateral', 'posterior', 'medial'].map((id) => RVOT_SEGMENT_COLORS[id]).join(',')})` });
  const toggleText = el('span');
  const toggle = el('input', '', { type: 'checkbox', 'data-rvot-section-toggle': '' });
  toggleLabel.append(swatch, toggleText, toggle);
  const body = el('div', 'rvot-section-body');
  const note = el('p', 'ep-note');
  const pick = el('div', 'rvot-section-pick', { role: 'group' });
  const allButton = el('button', '', { type: 'button', 'data-rvot-section-segment': '' });
  const buttons = new Map(RVOT_SEGMENTS.map((seg) => {
    const b = el('button', '', { type: 'button', 'data-rvot-section-segment': seg.id });
    b.style.setProperty('--seg', RVOT_SEGMENT_COLORS[seg.id]);
    b.addEventListener('click', () => select(seg.id));
    return [seg.id, b];
  }));
  allButton.addEventListener('click', () => select(null));
  pick.append(allButton, ...buttons.values());
  const card = el('div', 'rvot-section-card', { 'data-rvot-section-card': '' });
  const title = el('strong'), fields = el('dl'), variantRow = el('div', 'rvot-section-variant'), variantNote = el('p', 'ep-note');
  const variantButtons = new Map(['present', 'absent'].map((id) => {
    const b = el('button', '', { type: 'button', 'data-rvot-section-variant': id });
    b.addEventListener('click', () => { state.variant = id; onVariant(id); render(); });
    variantRow.append(b);
    return [id, b];
  }));
  card.append(title, fields);
  // Figures 10-12: the posterior free wall variant changes the 3D section; the camera shows it from above or behind.
  const variantBox = el('div', 'rvot-section-card', { 'data-rvot-section-variant-box': '' }), variantTitle = el('strong');
  variantBox.append(variantTitle, variantRow, variantNote);
  const cameraRow = el('div', 'rvot-section-variant', { role: 'group' });
  const cameraButtons = new Map(['superior', 'posterior'].map((id) => {
    const b = el('button', '', { type: 'button', 'data-rvot-section-camera': id });
    b.addEventListener('click', () => { state.camera = id; onCamera(id); render(); });
    cameraRow.append(b);
    return [id, b];
  }));
  const general = el('ul', 'rvot-section-general');
  const sources = el('p', 'ep-note');
  body.append(note, cameraRow, pick, card, variantBox, general, sources);
  root.append(toggleLabel, body);
  toggle.addEventListener('change', () => { state.on = toggle.checked; if (!state.on) state.segment = null; state.camera = 'superior'; onToggle(state.on); if (state.on) onVariant(state.variant); render(); });

  function select(id) {
    state.segment = id;
    onSegment(id);
    render();
  }

  function render() {
    const lang = L(), T = RVOT_SEGMENT_TEXT[lang], U = UI[lang];
    toggleText.textContent = U.toggle;
    toggle.checked = state.on;
    body.hidden = !state.on;
    note.textContent = U.note;
    pick.setAttribute('aria-label', U.pick);
    allButton.textContent = U.all;
    allButton.setAttribute('aria-pressed', String(state.segment === null));
    for (const [id, b] of buttons) {
      const seg = RVOT_SEGMENTS.find((s) => s.id === id);
      b.textContent = seg.short;
      b.title = T.segments[id].name;
      b.setAttribute('aria-label', T.segments[id].name);
      b.setAttribute('aria-pressed', String(state.segment === id));
    }
    card.hidden = !state.segment;
    if (state.segment) {
      const text = T.segments[state.segment];
      title.textContent = text.name;
      fields.replaceChildren(...['neighbour', 'surface', 'procedure', 'device', 'figures'].flatMap((key) => {
        const dt = el('dt'), dd = el('dd');
        dt.textContent = T.fields[key]; dd.textContent = text[key];
        return [dt, dd];
      }));
    }
    variantTitle.textContent = T.variantTitle;
    for (const [id, b] of variantButtons) { b.textContent = T.variants[id]; b.setAttribute('aria-pressed', String(state.variant === id)); }
    variantNote.textContent = T.variantNote[state.variant];
    cameraRow.setAttribute('aria-label', U.camera);
    for (const [id, b] of cameraButtons) { b.textContent = U.cameras[id]; b.setAttribute('aria-pressed', String(state.camera === id)); }
    general.replaceChildren(...T.general.map((g) => { const li = el('li'); li.textContent = g; return li; }));
    sources.replaceChildren(`${U.sources}: `, ...RVOT_SEGMENT_SOURCES.flatMap((s, i) => {
      const a = el('a', 'ep-ref', { href: s.url, target: '_blank', rel: 'noopener noreferrer' });
      a.textContent = s.title;
      return i ? [' · ', a] : [a];
    }));
  }

  render();
  return { element: root, render, setOn(on) { state.on = Boolean(on); if (!state.on) state.segment = null; state.camera = 'superior'; render(); }, getState: () => ({ ...state }) };
}
