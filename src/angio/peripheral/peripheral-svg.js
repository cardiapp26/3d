// Original schematic SVG for the peripheral angiography views.
// Coordinates and names come from the data modules. This file only draws.

import { UI, hitPoint, loc, viewBoxFor } from './peripheral-data.js';

const KIND_ORDER = [
  'zone', 'safe', 'risk', 'warn', 'skin', 'bone', 'frame', 'landmark',
  'trunk', 'artery', 'branch', 'small', 'variant',
  'dot-nerve', 'dot-artery', 'dot-vein', 'marker'
];

const WIDTH = {
  trunk: 22, artery: 16, branch: 10, small: 6, variant: 6, landmark: 4, marker: 3
};

const VESSEL = new Set(['trunk', 'artery', 'branch', 'small', 'variant', 'landmark']);

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const num = value => Math.round(Number(value) * 100) / 100;

function rank(kind) {
  const index = KIND_ORDER.indexOf(kind);
  return index < 0 ? 40 : index;
}

/** Catmull-Rom to cubic Bezier. Two points stay a line. Closed shapes wrap, then Z. */
export function smooth(pts, close) {
  if (!pts || pts.length === 0) return '';
  const p = pts.map(pair => [num(pair[0]), num(pair[1])]);
  if (p.length === 1) return `M ${p[0][0]} ${p[0][1]}`;
  if (p.length === 2) {
    const line = `M ${p[0][0]} ${p[0][1]} L ${p[1][0]} ${p[1][1]}`;
    return close ? `${line} Z` : line;
  }
  const n = p.length;
  const at = index => {
    if (close) return p[((index % n) + n) % n];
    if (index < 0) return p[0];
    if (index >= n) return p[n - 1];
    return p[index];
  };
  let d = `M ${p[0][0]} ${p[0][1]}`;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = num(p1[0] + (p2[0] - p0[0]) / 6);
    const c1y = num(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = num(p2[0] - (p3[0] - p1[0]) / 6);
    const c2y = num(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return close ? `${d} Z` : d;
}

function shapeSvg(shape) {
  const kind = shape.kind || 'artery';
  const cls = `peri-shape peri-${kind}`;
  if (shape.type === 'line' || shape.type === 'poly') {
    const d = smooth(shape.pts, shape.type === 'poly');
    const w = shape.w || WIDTH[kind] || 3;
    const hit = shape.type === 'line' && VESSEL.has(kind)
      ? `<path class="peri-hitstroke" d="${d}" stroke-width="${w + 18}"/>`
      : '';
    const fill = shape.type === 'line' ? ' fill="none"' : '';
    return `${hit}<path class="${cls}" d="${d}" stroke-width="${w}"${fill}/>`;
  }
  if (shape.type === 'ellipse') {
    return `<ellipse class="${cls}" cx="${num(shape.cx)}" cy="${num(shape.cy)}" rx="${num(shape.rx)}" ry="${num(shape.ry)}"/>`;
  }
  if (shape.type === 'circle') {
    return `<circle class="${cls}" cx="${num(shape.cx)}" cy="${num(shape.cy)}" r="${num(shape.r)}"/>`;
  }
  if (shape.type === 'rect') {
    return `<rect class="${cls}" x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(shape.h)}" rx="${num(shape.rx || 0)}"/>`;
  }
  if (shape.type === 'text') {
    const anchor = shape.anchor || 'middle';
    return `<text class="peri-shape-text" x="${num(shape.x)}" y="${num(shape.y)}" text-anchor="${anchor}">${esc(loc(shape, argumentsLang))}</text>`;
  }
  return '';
}

let argumentsLang = 'tr';

// Visceral AP labels are stored on each structure. Lateral and oblique
// geometry moves, so those names are placed next to the active hit.
const FOLLOW = {
  ap: {
    'visceral-aorta': [388, 98, 'start'],
    'left-gastric': [396, 46, 'start'],
    'proper-hepatic': [214, 232, 'start'],
    renal: [8, 358, 'start'],
    'accessory-renal': [16, 462, 'start']
  },
  lateral: {
    'visceral-aorta': [236, 72, 'start'],
    celiac: [318, 132, 'start'],
    'left-gastric': [414, 84, 'start'],
    splenic: [430, 196, 'start'],
    'common-hepatic': [500, 158, 'start'],
    'proper-hepatic': [520, 236, 'start'],
    gastroduodenal: [500, 328, 'start'],
    sma: [430, 276, 'start'],
    ima: [300, 590, 'start'],
    renal: [36, 308, 'start'],
    'accessory-renal': [12, 434, 'start'],
    gonadal: [196, 468, 'end']
  },
  oblique: {
    'visceral-aorta': [318, 96, 'start'],
    celiac: [236, 124, 'start'],
    'left-gastric': [196, 72, 'start'],
    splenic: [360, 136, 'start'],
    'common-hepatic': [48, 168, 'start'],
    'proper-hepatic': [36, 214, 'start'],
    gastroduodenal: [48, 300, 'start'],
    sma: [210, 292, 'start'],
    ima: [450, 540, 'start'],
    renal: [48, 354, 'start'],
    'accessory-renal': [48, 430, 'start'],
    gonadal: [230, 530, 'start']
  }
};

function labelSvg(item, mode) {
  const label = item.label;
  if (!label) return '';
  const placed = FOLLOW[mode]?.[item.id];
  const x = placed ? placed[0] : label.x;
  const y = placed ? placed[1] : label.y;
  const anchor = placed ? placed[2] : (label.anchor || 'start');
  return `<text class="peri-label" x="${num(x)}" y="${num(y)}" text-anchor="${anchor}">${esc(loc(label, argumentsLang))}</text>`;
}

function structureSvg(item, mode, selectedId) {
  const name = loc(item.name, argumentsLang);
  const point = hitPoint(item, mode);
  const shapes = (item.draw?.[mode] || []).map(shapeSvg).join('');
  const on = item.id === selectedId ? ' is-on' : '';
  const pressed = item.id === selectedId ? 'true' : 'false';
  return `<g class="peri-structure peri-kind-${item.kind}${on}" data-structure="${esc(item.id)}" data-name="${esc(name)}" role="button" tabindex="0" aria-label="${esc(name)}" aria-pressed="${pressed}"><title>${esc(name)}</title>${shapes}${labelSvg(item, mode)}<circle class="peri-hitdot" cx="${num(point.x)}" cy="${num(point.y)}" r="16"/></g>`;
}

const cap = (x, y, text, anchor = 'start') =>
  `<text class="peri-caption" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;

function scenery(view, mode, lang) {
  const en = lang === 'en';
  if (view === 'aortoiliac') {
    return `<g class="peri-scenery">
      ${cap(28, 32, en ? 'RIGHT' : 'SAĞ')}
      ${cap(692, 32, en ? 'LEFT' : 'SOL', 'end')}
      ${cap(300, 338, 'L4')}
    </g>`;
  }
  if (view === 'femoral' && mode === 'map') {
    const iea = smooth([[400, 210], [470, 130], [548, 52]], false);
    return `<g class="peri-scenery">
      <path class="peri-ghost" d="${iea}" fill="none" stroke-width="6"/>
      ${cap(430, 96, en ? 'IEA marker (not a second target)' : 'İEA işareti (ayrı hedef değil)')}
      ${cap(28, 32, en ? 'RIGHT GROIN' : 'SAĞ KASIK')}
      ${cap(28, 776, en ? 'Lateral' : 'Lateral')}
      ${cap(692, 776, en ? 'Medial' : 'Medial', 'end')}
    </g>`;
  }
  if (view === 'femoral' && mode === 'xs') {
    return `<g class="peri-scenery">
      ${cap(360, 16, en ? 'Anterior' : 'Ön', 'middle')}
      ${cap(40, 1104, en ? 'Lateral' : 'Lateral')}
      ${cap(680, 1104, en ? 'Medial' : 'Medial', 'end')}
      ${cap(360, 1104, en ? 'Posterior' : 'Arka', 'middle')}
    </g>`;
  }
  if (view === 'runoff') {
    return `<g class="peri-scenery">
      ${cap(28, 32, en ? 'RIGHT LEG' : 'SAĞ BACAK')}
      <path class="peri-ghost" d="M120 560 H600" fill="none" stroke-width="2" stroke-dasharray="6 6"/>
      ${cap(128, 548, en ? 'Knee joint' : 'Diz eklemi')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'ap') {
    return `<g class="peri-scenery">
      <ellipse class="peri-organ" cx="92" cy="250" rx="62" ry="84"/>
      <ellipse class="peri-organ" cx="628" cy="210" rx="48" ry="64"/>
      <ellipse class="peri-organ" cx="150" cy="390" rx="36" ry="52"/>
      <ellipse class="peri-organ" cx="570" cy="390" rx="36" ry="52"/>
      ${cap(92, 208, en ? 'Liver' : 'Karaciğer', 'middle')}
      ${cap(628, 210, en ? 'Spleen' : 'Dalak', 'middle')}
      ${cap(28, 32, en ? 'RIGHT (image left)' : 'SAĞ (görüntü solu)')}
      ${cap(692, 32, en ? 'LEFT' : 'SOL', 'end')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'lateral') {
    return `<g class="peri-scenery">
      ${cap(28, 36, en ? 'Posterior' : 'Arka')}
      ${cap(692, 36, en ? 'Anterior' : 'Ön', 'end')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'oblique') {
    return `<g class="peri-scenery">
      ${cap(28, 800, en ? 'Shallow schematic, not a measured angle' : 'Sığ şema, ölçülmüş açı değildir')}
    </g>`;
  }
  if (view === 'arm') {
    const arch = smooth([[70, 220], [120, 70], [230, 48]], false);
    return `<g class="peri-scenery">
      <path class="peri-ghost" d="${arch}" fill="none" stroke-width="8"/>
      ${cap(28, 32, en ? 'LEFT ARM' : 'SOL KOL')}
      ${cap(28, 78, en ? 'Ulnar / medial' : 'Ulnar / medial')}
      ${cap(692, 78, en ? 'Radial / lateral' : 'Radiyal / lateral', 'end')}
      ${cap(28, 1140, en ? 'Arch types I-III are not drawn' : 'Ark tipleri I-III çizilmez')}
    </g>`;
  }
  return '';
}

export function renderPeripheralSvg({ view, mode, structures, lang, selectedId }) {
  argumentsLang = lang === 'en' ? 'en' : 'tr';
  const [w, h] = viewBoxFor(view, mode);
  const ordered = structures
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item.kind) - rank(b.item.kind) || a.index - b.index);
  const body = ordered.map(({ item }) => structureSvg(item, mode, selectedId)).join('');
  const title = UI[argumentsLang].watermark;
  return `<svg class="peri-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(title)}">${scenery(view, mode, argumentsLang)}${body}<text class="peri-watermark" x="${w - 16}" y="${h - 14}" text-anchor="end">${esc(title)}</text></svg>`;
}
