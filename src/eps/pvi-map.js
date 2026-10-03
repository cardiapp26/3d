import { PVI_VEINS, PVI_DOTS, createPviState, burnDot, burnedCount, isolated, allIsolated } from './pvi-model.js';

/*
 * Two-dimensional PVI lesion map: a posterior view of the left atrium with
 * the four pulmonary vein ostia, each ringed by PVI_DOTS candidate antral
 * lesion points. Clicking (or Enter / Space on) a point ablates it; the
 * lesion state lives in pvi-model.js (immutable). It replaces Cardia's 3D
 * lesion rings (pvi-lab.js) with the same interface (setActive, burn, reset,
 * getState, onChange ...). Schematic: no lesion set, gap or energy model.
 */

export const MAP_VIEW = Object.freeze({ w: 300, h: 210 });
const LA = Object.freeze({ cx: 150, cy: 112, rx: 92, ry: 70 });
// Posterior view: the patient's left veins on the viewer's left.
const VEIN_CENTERS = Object.freeze({ lspv: [78, 62], lipv: [74, 158], rspv: [222, 62], ripv: [226, 158] });
const OSTIUM_R = 15;
const RING_R = 27;

/** Vein centers and candidate point positions (pure, tested). */
export function pviMapLayout() {
  return PVI_VEINS.map((v) => {
    const [cx, cy] = VEIN_CENTERS[v.id];
    const dots = Array.from({ length: PVI_DOTS }, (_, i) => {
      const a = (i / PVI_DOTS) * Math.PI * 2 - Math.PI / 2;
      return { index: i, x: Math.round((cx + RING_R * Math.cos(a)) * 10) / 10, y: Math.round((cy + RING_R * Math.sin(a)) * 10) / 10 };
    });
    return { id: v.id, label: v.label, cx, cy, r: OSTIUM_R, ring: RING_R, dots };
  });
}

const TEXT = {
  tr: { title: 'Sol atriyum, posterior görünüm (şematik)', dot: (vein, i) => `${vein}, nokta ${i + 1}`, burned: 'ablate edildi', idle: 'ablate edilmedi', la: 'LA' },
  en: { title: 'Left atrium, posterior view (schematic)', dot: (vein, i) => `${vein}, point ${i + 1}`, burned: 'ablated', idle: 'not ablated', la: 'LA' }
};
const SHORT = Object.freeze({ lspv: 'LSPV', lipv: 'LIPV', rspv: 'RSPV', ripv: 'RIPV' });
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {Document} doc
 * @param {{ getLang?: () => string }} [options]
 */
export function createPviMap(doc, { getLang = () => 'tr' } = {}) {
  let state = createPviState();
  let active = false;
  const listeners = new Set();
  const layout = pviMapLayout();

  const root = doc.createElement('figure');
  root.className = 'pvi-map';
  root.setAttribute('data-pvi-map', '');
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${MAP_VIEW.w} ${MAP_VIEW.h}`);
  const caption = doc.createElement('figcaption');
  root.append(svg, caption);

  const node = (tag, attrs) => {
    const n = doc.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };

  const handle = (event) => {
    const key = event.target?.getAttribute?.('data-pvi-dot');
    if (!key || !active) return;
    if (event.type === 'keydown') {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault?.();
    }
    const [vein, index] = key.split(':');
    burn(vein, Number(index));
  };
  svg.addEventListener('click', handle);
  svg.addEventListener('keydown', handle);

  function render() {
    const t = TEXT[getLang() === 'en' ? 'en' : 'tr'];
    const children = [
      node('ellipse', { cx: LA.cx, cy: LA.cy, rx: LA.rx, ry: LA.ry, class: 'pvi-la' }),
      Object.assign(node('text', { x: LA.cx, y: LA.cy + 4, class: 'pvi-label' }), { textContent: t.la })
    ];
    for (const v of layout) {
      const done = isolated(state, v.id);
      children.push(node('circle', { cx: v.cx, cy: v.cy, r: v.ring, class: done ? 'pvi-ring is-isolated' : 'pvi-ring' }));
      children.push(node('circle', { cx: v.cx, cy: v.cy, r: v.r, class: 'pvi-ostium' }));
      children.push(Object.assign(node('text', { x: v.cx, y: v.cy + 4, class: 'pvi-label' }), { textContent: SHORT[v.id] }));
      for (const d of v.dots) {
        const burned = Boolean(state[v.id][d.index]);
        const name = v.label[getLang() === 'en' ? 'en' : 'tr'];
        children.push(node('circle', {
          cx: d.x, cy: d.y, r: 5.5, class: burned ? 'pvi-dot is-burned' : 'pvi-dot',
          'data-pvi-dot': `${v.id}:${d.index}`, role: 'button', tabindex: active && !burned ? 0 : -1,
          'aria-pressed': burned, 'aria-label': `${t.dot(name, d.index)}: ${burned ? t.burned : t.idle}`
        }));
      }
    }
    svg.replaceChildren(...children);
    svg.setAttribute('aria-label', t.title);
    caption.textContent = t.title;
  }

  const emit = () => { for (const listener of listeners) listener(state); };

  function burn(veinId, index) {
    const next = burnDot(state, veinId, index);
    if (next === state) return false;
    state = next;
    render();
    emit();
    return true;
  }

  render();
  return {
    element: root,
    render,
    /** Accept clicks only while the PVI exercise is open. */
    setActive(flag) { active = Boolean(flag); render(); },
    isActive: () => active,
    burn,
    reset() { state = createPviState(); render(); emit(); },
    getState: () => state,
    burnedCount: (veinId) => burnedCount(state, veinId),
    isolated: (veinId) => isolated(state, veinId),
    allIsolated: () => allIsolated(state),
    dotCount: () => layout.length * PVI_DOTS,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}
