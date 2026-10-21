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

// Extra hit-stroke width so a real mouse click can land on the centerline.
const HIT_EXTRA = {
  trunk: 18, artery: 16, branch: 14, small: 14, variant: 16, landmark: 14, marker: 18,
  zone: 16, safe: 16, risk: 16, warn: 16, bone: 16, frame: 14, skin: 14,
  'dot-nerve': 14, 'dot-artery': 14, 'dot-vein': 14
};

// SVG user units, so a label scales with the viewBox and stays inside the frame.
export const LABEL_FONT = 13;
export const LABEL_CHAR = 0.58;

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

/** Samples of the same curve smooth() draws. DOM-free, for the geometry test. */
export function curveSamples(pts, close, steps = 8) {
  if (!pts || pts.length === 0) return [];
  const p = pts.map(pair => [Number(pair[0]), Number(pair[1])]);
  if (p.length === 1) return [[p[0][0], p[0][1]]];
  if (p.length === 2) {
    const out = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      out.push([p[0][0] + (p[1][0] - p[0][0]) * t, p[0][1] + (p[1][1] - p[0][1]) * t]);
    }
    return out;
  }
  const n = p.length;
  const at = index => {
    if (close) return p[((index % n) + n) % n];
    if (index < 0) return p[0];
    if (index >= n) return p[n - 1];
    return p[index];
  };
  const out = [[p[0][0], p[0][1]]];
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]
      ]);
    }
  }
  return out;
}

function ellipsePath(cx, cy, rx, ry) {
  const x = num(cx);
  const y = num(cy);
  const a = num(rx);
  const b = num(ry);
  return `M ${num(x - a)} ${y} A ${a} ${b} 0 1 0 ${num(x + a)} ${y} A ${a} ${b} 0 1 0 ${num(x - a)} ${y}`;
}

function hitPath(shape) {
  if (shape.type === 'line' || shape.type === 'poly') return smooth(shape.pts, shape.type === 'poly');
  if (shape.type === 'ellipse') return ellipsePath(shape.cx, shape.cy, shape.rx, shape.ry);
  if (shape.type === 'circle') return ellipsePath(shape.cx, shape.cy, shape.r, shape.r);
  if (shape.type === 'rect') {
    const x = num(shape.x);
    const y = num(shape.y);
    const w = num(shape.w);
    const h = num(shape.h);
    return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  }
  return '';
}

function hitWidth(shape) {
  const kind = shape.kind || 'artery';
  const base = shape.w || WIDTH[kind] || 8;
  const extra = HIT_EXTRA[kind] ?? 16;
  if (shape.type === 'line') return Math.max(base + extra, 22);
  return Math.max(extra, 16);
}

function shapeSvg(shape) {
  const kind = shape.kind || 'artery';
  const cls = `peri-shape peri-${kind}`;
  let visible = '';
  if (shape.type === 'line' || shape.type === 'poly') {
    const d = smooth(shape.pts, shape.type === 'poly');
    const w = shape.w || WIDTH[kind] || 3;
    const fill = shape.type === 'line' ? ' fill="none"' : '';
    visible = `<path class="${cls}" d="${d}" stroke-width="${w}"${fill}/>`;
  } else if (shape.type === 'ellipse') {
    visible = `<ellipse class="${cls}" cx="${num(shape.cx)}" cy="${num(shape.cy)}" rx="${num(shape.rx)}" ry="${num(shape.ry)}"/>`;
  } else if (shape.type === 'circle') {
    visible = `<circle class="${cls}" cx="${num(shape.cx)}" cy="${num(shape.cy)}" r="${num(shape.r)}"/>`;
  } else if (shape.type === 'rect') {
    visible = `<rect class="${cls}" x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(shape.h)}" rx="${num(shape.rx || 0)}"/>`;
  } else if (shape.type === 'text') {
    const anchor = shape.anchor || 'middle';
    return `<text class="peri-shape-text" x="${num(shape.x)}" y="${num(shape.y)}" text-anchor="${anchor}" font-size="${LABEL_FONT}">${esc(loc(shape, argumentsLang))}</text>`;
  } else {
    return '';
  }
  const d = hitPath(shape);
  const hit = d
    ? `<path class="peri-hitstroke" d="${d}" stroke-width="${hitWidth(shape)}"/>`
    : '';
  return `${visible}${hit}`;
}

let argumentsLang = 'tr';

export function labelFor(item, mode) {
  return item.labels?.[mode] || item.label || null;
}

function leaderSvg(label, text) {
  if (!label.to) return '';
  const width = text.length * LABEL_FONT * LABEL_CHAR;
  const anchor = label.anchor || 'start';
  const x0 = anchor === 'end' ? label.x - width : anchor === 'middle' ? label.x - width / 2 : label.x;
  const x1 = x0 + width;
  const tx = label.to[0];
  const x = Math.min(Math.max(tx, x0), x1);
  return `<line class="peri-leader" x1="${num(x)}" y1="${num(label.y - 3)}" x2="${num(label.to[0])}" y2="${num(label.to[1])}"/>`;
}

function labelSvg(item, mode) {
  const label = labelFor(item, mode);
  if (!label) return '';
  const anchor = label.anchor || 'start';
  const text = loc(label, argumentsLang);
  return `${leaderSvg(label, text)}<text class="peri-label" x="${num(label.x)}" y="${num(label.y)}" text-anchor="${anchor}" font-size="${LABEL_FONT}">${esc(text)}</text>`;
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
  `<text class="peri-caption" x="${x}" y="${y}" text-anchor="${anchor}" font-size="12">${esc(text)}</text>`;

function scenery(view, mode, lang) {
  const en = lang === 'en';
  if (view === 'aortoiliac') {
    const ligament = smooth([[120, 762], [360, 748], [600, 762]], false);
    return `<g class="peri-scenery">
      ${cap(24, 28, en ? 'RIGHT' : 'SAĞ')}
      ${cap(696, 28, en ? 'LEFT' : 'SOL', 'end')}
      ${cap(48, 248, 'L4')}
      <path class="peri-ghost" d="${ligament}" fill="none" stroke-width="2" stroke-dasharray="7 6"/>
      ${cap(360, 786, en ? 'Inguinal ligament' : 'İnguinal ligaman', 'middle')}
    </g>`;
  }
  if (view === 'femoral' && mode === 'map') {
    const iea = smooth([[400, 210], [470, 130], [548, 52]], false);
    return `<g class="peri-scenery">
      <path class="peri-ghost" d="${iea}" fill="none" stroke-width="6"/>
      ${cap(430, 78, en ? 'IEA marker (not a second target)' : 'İEA işareti (ayrı hedef değil)')}
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
      ${cap(28, 28, en ? 'RIGHT LEG' : 'SAĞ BACAK')}
      <path class="peri-ghost" d="M140 560 H580" fill="none" stroke-width="2" stroke-dasharray="6 6"/>
      ${cap(148, 548, en ? 'Knee joint' : 'Diz eklemi')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'ap') {
    return `<g class="peri-scenery">
      <ellipse class="peri-organ" cx="148" cy="118" rx="78" ry="52"/>
      <ellipse class="peri-organ" cx="624" cy="168" rx="52" ry="46"/>
      <ellipse class="peri-organ" cx="108" cy="400" rx="46" ry="58"/>
      <ellipse class="peri-organ" cx="608" cy="300" rx="44" ry="52"/>
      ${cap(148, 78, en ? 'Liver' : 'Karaciğer', 'middle')}
      ${cap(624, 168, en ? 'Spleen' : 'Dalak', 'middle')}
      ${cap(108, 400, en ? 'R kidney' : 'Sağ böbrek', 'middle')}
      ${cap(608, 292, en ? 'L kidney' : 'Sol böbrek', 'middle')}
      ${cap(24, 28, en ? 'RIGHT (image left)' : 'SAĞ (görüntü solu)')}
      ${cap(696, 28, en ? 'LEFT' : 'SOL', 'end')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'lateral') {
    return `<g class="peri-scenery">
      ${cap(24, 28, en ? 'Posterior' : 'Arka')}
      ${cap(696, 28, en ? 'Anterior' : 'Ön', 'end')}
    </g>`;
  }
  if (view === 'visceral' && mode === 'oblique') {
    return `<g class="peri-scenery">
      ${cap(24, 800, en ? 'Shallow schematic, not a measured angle' : 'Sığ şema, ölçülmüş açı değildir')}
    </g>`;
  }
  if (view === 'arm') {
    const arch = smooth([[36, 168], [64, 108], [108, 78]], false);
    const limb = smooth([
      [300, 150], [250, 220], [230, 420], [210, 700],
      [200, 980], [230, 1100], [520, 1110], [560, 980],
      [540, 700], [500, 400], [470, 180], [400, 120], [300, 150]
    ], true);
    const rib = smooth([[360, 168], [430, 188], [470, 176]], false);
    return `<g class="peri-scenery">
      <path class="peri-limb" d="${limb}"/>
      <path class="peri-ghost" d="${arch}" fill="none" stroke-width="14"/>
      <path class="peri-rib" d="${rib}" fill="none" stroke-width="8"/>
      ${cap(28, 196, en ? 'Arch' : 'Ark')}
      ${cap(478, 206, en ? '1st rib' : '1. kaburga')}
      ${cap(24, 28, en ? 'LEFT ARM' : 'SOL KOL')}
      ${cap(24, 250, en ? 'Ulnar / medial' : 'Ulnar / medial')}
      ${cap(696, 250, en ? 'Radial / lateral' : 'Radiyal / lateral', 'end')}
      ${cap(24, 1136, en ? 'Arch types I-III are not drawn' : 'Ark tipleri I-III çizilmez')}
    </g>`;
  }
  return '';
}

function foreground(view, mode, lang) {
  if (view !== 'visceral' || mode !== 'ap') return '';
  const en = lang === 'en';
  return `<g class="peri-scenery">
    <rect class="peri-ivc" x="228" y="318" width="44" height="150" rx="18"/>
    ${cap(250, 348, 'IVC', 'middle')}
    ${cap(196, 312, en ? 'behind IVC' : 'İVC arkası', 'end')}
  </g>`;
}

export function renderPeripheralSvg({ view, mode, structures, lang, selectedId }) {
  argumentsLang = lang === 'en' ? 'en' : 'tr';
  const [w, h] = viewBoxFor(view, mode);
  const ordered = structures
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item.kind) - rank(b.item.kind) || a.index - b.index);
  const body = ordered.map(({ item }) => structureSvg(item, mode, selectedId)).join('');
  const title = UI[argumentsLang].watermark;
  return `<svg class="peri-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(title)}">${scenery(view, mode, argumentsLang)}${body}${foreground(view, mode, argumentsLang)}<text class="peri-watermark" x="${w - 16}" y="${h - 16}" text-anchor="end" font-size="12">${esc(title)}</text></svg>`;
}
