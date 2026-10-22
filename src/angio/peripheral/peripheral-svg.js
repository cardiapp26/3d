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

/** Offset a densely sampled centerline to create a tapered lumen silhouette. */
export function vesselRibbon(points, width, endScale = 0.72) {
  const samples = curveSamples(points, false, 16);
  if (samples.length < 2) return '';
  const left = [], right = [];
  const lengths = [0];
  for (let i = 1; i < samples.length; i += 1) lengths.push(lengths[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  const total = lengths.at(-1) || 1;
  for (let i = 0; i < samples.length; i += 1) {
    const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const radius = width / 2 * (1 - (1 - endScale) * lengths[i] / total);
    const nx = -(b[1] - a[1]) / len * radius, ny = (b[0] - a[0]) / len * radius;
    left.push([num(samples[i][0] + nx), num(samples[i][1] + ny)]);
    right.push([num(samples[i][0] - nx), num(samples[i][1] - ny)]);
  }
  const end = right.at(-1);
  const start = left[0];
  const endRadius = num(width * endScale / 2);
  const startRadius = num(width / 2);
  return `M ${left.map(p => p.join(' ')).join(' L ')} A ${endRadius} ${endRadius} 0 0 0 ${end.join(' ')} L ${right.reverse().slice(1).map(p => p.join(' ')).join(' L ')} A ${startRadius} ${startRadius} 0 0 0 ${start.join(' ')} Z`;
}

function shapeSvg(shape) {
  const kind = shape.kind || 'artery';
  const cls = `peri-shape peri-${kind}`;
  let visible = '';
  if (shape.type === 'line' || shape.type === 'poly') {
    const d = smooth(shape.pts, shape.type === 'poly');
    const w = shape.w || WIDTH[kind] || 3;
    const fill = shape.type === 'line' ? ' fill="none"' : '';
    if (shape.type === 'line' && ['trunk', 'artery', 'branch', 'small'].includes(kind)) {
      const width = w * (kind === 'trunk' ? 1.55 : kind === 'artery' ? 1.22 : 0.86);
      const taper = shape.taper ?? (kind === 'trunk' ? 0.86 : kind === 'artery' ? 0.96 : 0.48);
      visible = `<path class="peri-vessel-wall" d="${vesselRibbon(shape.pts, width + 1.2, taper)}"/>
        <path class="peri-vessel-body" d="${vesselRibbon(shape.pts, width, taper)}"/>
        <path class="peri-vessel-light" d="${vesselRibbon(shape.pts, width * 0.25, taper)}"/>`;
    } else visible = `<path class="${cls}" d="${d}" stroke-width="${w}"${fill}/>`;
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
      <path class="peri-organ" d="M 58 91 C 82 56 165 53 216 76 L 276 106 Q 253 137 207 134 L 162 174 C 116 195 66 161 58 91 Z"/>
      <path class="peri-organ" d="M 627 116 C 668 108 687 147 674 181 C 661 220 621 235 599 211 Q 579 187 600 170 Q 614 148 627 116 Z"/>
      <path class="peri-organ" d="M 97 337 C 45 346 45 430 76 454 C 106 479 143 454 143 433 C 143 416 117 417 121 398 C 126 380 150 382 143 361 Q 132 333 97 337 Z"/>
      <path class="peri-organ" d="M 623 239 C 675 249 674 330 643 355 C 613 380 578 355 578 332 C 578 316 604 316 600 299 C 596 280 571 282 579 263 Q 591 235 623 239 Z"/>
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
    const limb = 'M 386 172 C 335 209 338 302 343 397 C 345 475 344 550 326 628 C 289 717 260 816 252 922 L 248 1000 C 217 1038 230 1105 278 1123 L 486 1123 C 546 1116 577 1084 570 1044 L 553 998 C 554 922 550 845 522 761 C 498 685 485 625 488 555 L 505 357 C 519 266 500 191 466 172 Z';
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

function anatomicalContext(view, mode) {
  const path = (d, cls = 'peri-context-bone') => `<path class="${cls}" d="${d}"/>`;
  let art = '';
  if (view === 'aortoiliac') {
    art = path('M 332 58 Q 360 47 388 58 L 392 107 Q 360 119 328 107 Z M 328 124 Q 360 114 392 124 L 396 181 Q 360 192 324 181 Z M 324 197 Q 360 187 396 197 L 400 254 Q 360 268 320 254 Z M 320 274 Q 360 263 400 274 L 405 335 Q 360 348 315 335 Z')
      + path('M 300 320 C 273 280 239 263 193 274 C 135 287 87 328 66 390 C 52 437 68 483 103 516 L 145 568 C 162 606 173 664 221 688 Q 264 707 302 673 L 326 618 L 360 595 L 394 618 L 418 673 Q 456 707 499 688 C 547 664 558 606 575 568 L 617 516 C 652 483 668 437 654 390 C 633 328 585 287 527 274 C 481 263 447 280 420 320 L 411 404 L 393 465 L 360 492 L 327 465 L 309 404 Z')
      + path('M 322 339 Q 360 323 398 339 L 390 443 L 360 504 L 330 443 Z')
      + path('M 211 576 C 183 561 163 586 176 615 C 188 642 219 651 244 638 L 269 607 Q 244 589 211 576 Z M 509 576 C 537 561 557 586 544 615 C 532 642 501 651 476 638 L 451 607 Q 476 589 509 576 Z', 'peri-context-space');
  } else if (view === 'femoral' && mode === 'map') {
    art = path('M 255 442 C 231 456 218 485 201 520 L 162 752 L 230 776 L 292 564 C 315 524 358 480 367 457 Z')
      + path('M 148 268 C 111 191 138 132 205 118 C 270 106 325 137 347 187 M 140 295 C 128 371 158 447 215 468', 'peri-context-line');
  } else if (view === 'runoff') {
    art = path('M 335 48 L 326 348 C 325 399 302 430 294 470 C 282 524 310 552 351 548 Q 385 542 402 517 Q 423 546 464 547 C 507 542 517 505 498 469 C 476 424 464 388 461 348 L 450 48 Z')
      + path('M 303 575 Q 384 557 479 577 L 464 636 C 443 698 442 835 443 1064 L 463 1128 Q 428 1157 396 1134 L 385 1050 C 381 876 363 729 331 647 Z')
      + path('M 267 601 Q 284 580 299 602 L 305 636 L 284 1052 L 292 1134 L 266 1148 L 256 1113 L 268 673 Z')
      + path('M 336 1148 Q 385 1125 453 1152 L 490 1189 Q 394 1244 304 1222 L 270 1187 Z');
  } else if (view === 'arm') {
    art = path('M 390 226 Q 408 202 433 224 Q 452 243 439 275 L 417 574 Q 434 608 419 631 Q 396 649 377 627 L 371 602 L 393 278 Q 375 251 390 226 Z')
      + path('M 387 660 Q 406 643 414 669 C 435 742 471 828 482 940 L 470 983 L 443 979 C 443 858 416 762 387 693 Z')
      + path('M 360 662 Q 374 654 380 677 C 359 780 331 868 319 978 L 297 984 C 305 873 333 750 360 662 Z');
    for (let i = 0; i < 4; i += 1) art += path(`M ${302 + i * 43} 1026 L ${290 + i * 50} 1098`, 'peri-context-line');
  } else if (view === 'visceral' && mode !== 'ap') {
    const x = mode === 'lateral' ? 124 : 236;
    for (let y = 65; y < 750; y += 92) art += path(`M ${x - 30} ${y} Q ${x} ${y - 10} ${x + 30} ${y} L ${x + 34} ${y + 63} Q ${x} ${y + 75} ${x - 30} ${y + 63} Z`);
  }
  return `<g class="peri-anatomical-context" aria-hidden="true">${art}</g>`;
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
  return `<svg class="peri-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(title)}"><defs><linearGradient id="peri-lumen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a94b56"/><stop offset="0.38" stop-color="#df7e7b"/><stop offset="0.62" stop-color="#ef9a8b"/><stop offset="1" stop-color="#bd5965"/></linearGradient><linearGradient id="peri-lumen-light" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffdbb9" stop-opacity="0"/><stop offset="0.5" stop-color="#ffdbb9" stop-opacity="0.45"/><stop offset="1" stop-color="#ffdbb9" stop-opacity="0"/></linearGradient></defs>${anatomicalContext(view, mode)}${scenery(view, mode, argumentsLang)}${body}${foreground(view, mode, argumentsLang)}<text class="peri-watermark" x="${w - 16}" y="${h - 16}" text-anchor="end" font-size="12">${esc(title)}</text></svg>`;
}
