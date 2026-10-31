/**
 * 2D anterior diagram of the conduction lesson (fallback when WebGL or the atlas fails, and a
 * choice of its own): the same structures, selection, beat animation, block markers and
 * blood-supply colours as the 3D view. Free walls have an endocardial and an epicardial layer
 * so the endocardium-to-epicardium order is visible. Viewer's left is the patient's right.
 */
import { STRUCTURE_IDS, impulseProgress, blockReached, localTime, regionProgress, supplyColors } from './conduction-model.js';

const NS = 'http://www.w3.org/2000/svg';
const PATHS = Object.freeze({
  internodal: ['M112,72 C140,95 160,130 172,168', 'M112,72 C125,110 150,140 172,168', 'M112,72 C92,120 120,165 172,168'],
  bachmann: ['M112,72 C150,56 212,58 270,72'],
  his: ['M172,170 L190,182 L204,192'],
  rbb: ['M204,192 C200,222 196,260 192,292 C180,302 160,300 140,288'],
  lbb: ['M204,192 L218,200'],
  laf: ['M218,200 C245,196 280,192 312,196'],
  lpf: ['M218,200 C232,232 255,262 285,280'],
  septal: ['M218,200 C214,218 214,232 216,246', 'M218,200 C224,214 228,224 230,236'],
  purkinje: ['M140,288 L118,270', 'M140,288 L128,302', 'M192,292 L208,318', 'M312,196 L332,216', 'M312,196 L322,238', 'M285,280 L302,306', 'M285,280 L264,314']
});
const NODES = Object.freeze({ sa: [112, 72, 7], avn: [172, 170, 6] });
const REGIONS = Object.freeze({
  ra: 'M110,75 C150,75 168,112 166,140 C164,178 140,198 110,198 C78,198 55,172 55,136 C55,100 74,75 110,75 Z',
  la: 'M200,95 C204,66 240,54 270,56 C306,58 332,74 332,98 C332,122 304,134 268,134 C234,134 198,124 200,95 Z',
  rvFree: 'M70,215 C110,196 168,188 203,190 L214,332 C176,328 104,292 70,215 Z',
  lvFree: 'M206,190 C256,176 316,168 346,180 C370,226 354,302 300,336 C268,352 236,344 216,332 Z',
  septum: 'M199,190 L213,190 L222,330 L208,330 Z',
  apex: 'M176,318 C202,344 262,352 302,336 L292,302 C262,314 222,314 190,302 Z',
  posterobasal: 'M302,174 C326,168 342,172 349,184 C356,208 352,228 346,240 L312,214 Z M148,193 C170,188 190,187 203,190 L202,210 C186,206 166,206 147,210 Z'
});
const LABEL_AT = Object.freeze({ sa: [112, 58], internodal: [128, 128], bachmann: [190, 52], avn: [150, 184], his: [206, 178], rbb: [176, 250], lbb: [228, 186], laf: [292, 184], lpf: [266, 258], septal: [236, 248], purkinje: [326, 262] });
const REST = '#36456a', WAVE = '#ffe98a', DEPOL = '#e86f3c';


function mix(a, b, f) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',')})`;
}

/** Fill of a region whose activation window is `range` at local time t. */
function regionFill(range, t, plateau) {
  if (t === null || !range || t < range[0]) return REST;
  const f = regionProgress(range, t);
  if (f < 1) return mix(WAVE, DEPOL, f * 0.7);
  const after = t - range[1];
  return after < plateau ? DEPOL : mix(DEPOL, REST, Math.min(1, (after - plateau) / 120));
}

/**
 * @param {{ doc?: Document, text: () => object, onSelect: (id: string) => void }} options
 */
export function createConductionDiagram({ doc = globalThis.document, text, onSelect }) {
  const svg = (tag, attrs = {}) => {
    const n = doc.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const element = doc.createElement('div');
  element.className = 'cond-diagram';
  const root = svg('svg', { viewBox: '0 0 400 360', role: 'img' });
  element.append(root);
  const regions = {};
  const layer = svg('g');
  root.append(layer);
  root.append(svg('rect', { x: 92, y: 8, width: 34, height: 70, rx: 8, fill: '#243258', stroke: '#435789' }));   // SVC
  for (const [id, d] of Object.entries(REGIONS)) {
    const path = svg('path', { d, fill: REST, stroke: '#5a6d99', 'stroke-width': 1 });
    layer.append(path);
    regions[id] = { outer: path };
    if (id === 'rvFree' || id === 'lvFree') {
      // Endocardial layer: the same shape scaled toward its centre.
      const inner = svg('path', { d, fill: REST, stroke: 'none', transform: id === 'rvFree' ? 'translate(146 262) scale(.62) translate(-146 -262)' : 'translate(292 262) scale(.55) translate(-292 -262)' });
      layer.append(inner);
      regions[id].inner = inner;
    }
  }
  layer.append(regions.septum.outer, regions.apex.outer, regions.posterobasal.outer);
  const parts = new Map(STRUCTURE_IDS.map((id) => [id, { base: [], dual: [], active: [], hit: [], node: null, block: null, label: null }]));
  const lines = svg('g', { fill: 'none', 'stroke-linecap': 'round' });
  root.append(lines);
  for (const [id, list] of Object.entries(PATHS)) {
    const part = parts.get(id);
    for (const d of list) {
      const width = id === 'purkinje' ? 1.6 : id === 'septal' ? 2 : id === 'bachmann' ? 4 : 3;
      const base = svg('path', { d, stroke: '#c9a447', 'stroke-width': width });
      const dual = svg('path', { d, stroke: 'transparent', 'stroke-width': width, 'stroke-dasharray': '5 5' });
      const active = svg('path', { d, stroke: '#fff6c8', 'stroke-width': width + 1.6, opacity: 0 });
      const hit = svg('path', { d, stroke: 'transparent', 'stroke-width': 14, 'data-structure': id, style: 'cursor:pointer;pointer-events:stroke' });
      lines.append(base, dual, active, hit);
      part.base.push(base); part.dual.push(dual); part.active.push(active); part.hit.push(hit);
    }
  }
  for (const [id, [cx, cy, r]] of Object.entries(NODES)) {
    const node = svg('circle', { cx, cy, r, fill: '#c9a447', stroke: '#1b252b', 'stroke-width': 1.5, 'data-structure': id, style: 'cursor:pointer' });
    const hit = svg('circle', { cx, cy, r: r + 9, fill: 'transparent', 'data-structure': id, style: 'cursor:pointer' });
    lines.append(node, hit);
    parts.get(id).node = node;
    parts.get(id).hit.push(hit);
  }
  for (const [id, [x, y]] of Object.entries(LABEL_AT)) {
    const label = svg('text', { x, y, 'font-size': 10, 'font-weight': 600, fill: '#d3dcf0', 'text-anchor': 'middle', 'data-structure': id, style: 'cursor:pointer;paint-order:stroke;stroke:#0b1530;stroke-width:3px' });
    root.append(label);
    parts.get(id).label = label;
  }
  for (const [id, part] of parts) {
    const block = svg('text', { 'font-size': 16, 'font-weight': 800, fill: '#ff4d4d', 'text-anchor': 'middle', 'dominant-baseline': 'central', opacity: 0 });
    block.textContent = '×';
    root.append(block);
    part.block = block;
    part.head = svg('circle', { r: 3.4, fill: '#ffffff', opacity: 0 });
    root.append(part.head);
    part.id = id;
  }
  root.addEventListener('click', (e) => {
    const id = e.target.closest?.('[data-structure]')?.getAttribute('data-structure');
    if (id) onSelect(id);
  });

  const lengthOf = (p) => (typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0);
  function pointOn(part, f) {
    const p = part.base[0];
    if (!p || typeof p.getPointAtLength !== 'function') {
      const [cx, cy] = NODES[part.id] || [0, 0];
      return { x: cx, y: cy };
    }
    return p.getPointAtLength(lengthOf(p) * f);
  }

  function update({ beat, t, selected, supply, labels }) {
    const tt = (id) => (beat && t !== null ? localTime(beat, id, t) : null);
    const atrial = tt('atria');
    regions.ra.outer.setAttribute('fill', regionFill(beat?.atria.ra, atrial, 140));
    regions.la.outer.setAttribute('fill', regionFill(beat?.atria.la, atrial, 140));
    for (const id of ['septum', 'apex', 'posterobasal']) regions[id].outer.setAttribute('fill', regionFill(beat?.ventricles[id], t === null ? null : t, 270));
    for (const id of ['rvFree', 'lvFree']) {
      const range = beat?.ventricles[id];
      const split = range ? range[0] + (range[1] - range[0]) * 0.4 : 0;
      regions[id].inner.setAttribute('fill', regionFill(range && [range[0], split], t, 270));
      regions[id].outer.setAttribute('fill', regionFill(range && [split, range[1]], t, 270));
    }
    const words = text();
    for (const [id, part] of parts) {
      const colors = supply ? supplyColors(id) : [id === selected ? '#ffe27a' : '#c9a447'];
      for (const b of part.base) { b.setAttribute('stroke', colors[0]); b.setAttribute('opacity', id === selected || supply ? 1 : 0.75); }
      for (const d of part.dual) d.setAttribute('stroke', colors[1] || 'transparent');
      if (part.node) { part.node.setAttribute('fill', colors[0]); part.node.setAttribute('stroke', id === selected ? '#ffffff' : '#1b252b'); }
      const f = beat && t !== null ? impulseProgress(beat, id, t) : null;
      const seg = beat?.segments[id];
      const reverse = Boolean(seg?.reverse);
      for (const a of part.active) {
        const len = lengthOf(a);
        a.setAttribute('opacity', f ? 1 : 0);
        a.setAttribute('stroke-dasharray', `${len} ${len}`);
        a.setAttribute('stroke-dashoffset', String(reverse ? -len * (1 - (f || 0)) : len * (1 - (f || 0))));
      }
      const running = f !== null && seg && tt(id) <= seg.end + 4;
      if (part.node) part.node.setAttribute('r', String(NODES[id][2] * (running ? 1.4 : 1)));
      if (part.base.length && running && f > 0) {
        const p = pointOn(part, reverse ? 1 - f : f);
        part.head.setAttribute('cx', p.x); part.head.setAttribute('cy', p.y); part.head.setAttribute('opacity', 1);
      } else part.head.setAttribute('opacity', 0);
      const blocked = beat && beat.blocks[id] !== undefined;
      if (blocked) {
        const p = pointOn(part, beat.blocks[id]);
        part.block.setAttribute('x', p.x); part.block.setAttribute('y', p.y);
        part.block.setAttribute('font-size', t !== null && blockReached(beat, id, t) ? 20 : 16);
      }
      part.block.setAttribute('opacity', blocked ? 1 : 0);
      part.label.textContent = words.structure[id].short;
      part.label.setAttribute('opacity', labels || id === selected ? 1 : 0);
      part.label.setAttribute('fill', id === selected ? '#ffe27a' : '#d3dcf0');
    }
    root.setAttribute('aria-label', words.diagramLabel);
    element.dataset.selected = selected;
  }

  return { element, update };
}
