// SVG figures of the transseptal guide (transseptal-guide.js): the needle /
// dilator / sheath / wire set, the needle tip inside the dilator, the hub
// clock face, a schematic fluoroscopy frame (LAO 40 / RAO 30) with the SVC
// pullback and its two jumps, and an en-face map of the fossa with the
// procedure-specific sites (same offsets as the 3D rings, TS_SITES).
// All drawings are original schematics, not to scale.
import { TS_SITES } from './transseptal-sites.js';

const NS = 'http://www.w3.org/2000/svg';

/** SVG element with attributes and optional text. */
export function svgEl(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text != null) n.textContent = text;
  return n;
}
const hex = n => `#${n.toString(16).padStart(6, '0')}`;
const lerp = (a, b, f) => a + (b - a) * f;

/* ---------- Equipment set ---------- */

/** Four parts stacked, each a focusable hotspot (data-part). */
export function equipmentFigure(labels, selected) {
  const root = svgEl('svg', { viewBox: '0 0 360 196', class: 'tsg-equip', role: 'group' });
  const rows = [
    ['sheath', 34, 'M28,34 L262,34 Q298,34 314,58', 7, 'tsg-sheath'],
    ['dilator', 80, 'M28,80 L276,80 Q306,80 318,100', 4, 'tsg-dilator'],
    ['needle', 124, 'M44,124 L284,124 Q314,126 326,144', 2.2, 'tsg-needle'],
    ['wire', 168, 'M28,168 L296,168 Q326,168 326,180 Q326,192 312,190', 1.6, 'tsg-wire']
  ];
  for (const [id, y, d, width, cls] of rows) {
    const g = svgEl('g', { class: `tsg-part${selected === id ? ' selected' : ''}`, 'data-tsg-part': id, tabindex: 0, role: 'button', 'aria-pressed': String(selected === id) });
    g.append(svgEl('rect', { x: 4, y: y - 22, width: 352, height: 40, rx: 8, class: 'tsg-part-hit' }));
    g.append(svgEl('path', { d, class: cls, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round' }));
    if (id === 'sheath') {
      g.append(svgEl('rect', { x: 18, y: 28, width: 14, height: 12, rx: 2, class: 'tsg-hub' }));
      g.append(svgEl('path', { d: 'M26,40 Q30,52 44,54', class: 'tsg-sidearm', fill: 'none' }));
    }
    if (id === 'dilator') g.append(svgEl('rect', { x: 18, y: 75, width: 12, height: 10, rx: 2, class: 'tsg-hub' }));
    if (id === 'needle') {
      g.append(svgEl('polygon', { points: '40,108 46,124 34,124', class: 'tsg-arrow' }));
      g.append(svgEl('circle', { cx: 24, cy: 124, r: 6, class: 'tsg-stylet', fill: 'none' }));
      g.append(svgEl('line', { x1: 30, y1: 124, x2: 44, y2: 124, class: 'tsg-stylet' }));
    }
    g.append(svgEl('text', { x: 56, y: y - 8, class: 'tsg-part-label' }, labels[id]));
    root.append(g);
  }
  // Stylet: its own hotspot on the needle hub loop.
  const stylet = svgEl('g', { class: `tsg-part tsg-part-stylet${selected === 'stylet' ? ' selected' : ''}`, 'data-tsg-part': 'stylet', tabindex: 0, role: 'button', 'aria-pressed': String(selected === 'stylet'), 'aria-label': labels.stylet });
  stylet.append(svgEl('circle', { cx: 24, cy: 124, r: 13, class: 'tsg-part-hit' }));
  stylet.append(svgEl('circle', { cx: 24, cy: 124, r: 6, class: 'tsg-stylet', fill: 'none' }));
  stylet.append(svgEl('text', { x: 24, y: 147, 'text-anchor': 'middle', class: 'tsg-small' }, labels.stylet));
  root.append(stylet);
  return root;
}

/** Needle tip relative to the dilator tip; `mm` < 0 means inside the dilator. */
export function needleTipFigure(mm, withStylet) {
  const root = svgEl('svg', { viewBox: '0 0 360 74', class: 'tsg-tip', role: 'img' });
  const tipX = 286;
  const scale = 3.2;
  root.append(svgEl('path', { d: `M14,24 L246,24 L${tipX},33 L${tipX},41 L246,50 L14,50 Z`, class: 'tsg-dilator-body' }));
  const needleEnd = tipX + mm * scale;
  root.append(svgEl('line', { x1: 14, y1: 37, x2: needleEnd - 6, y2: 37, class: 'tsg-needle-shaft' }));
  root.append(svgEl('path', { d: `M${needleEnd - 8},34 L${needleEnd},37 L${needleEnd - 8},40 Z`, class: 'tsg-needle-bevel' }));
  if (withStylet) root.append(svgEl('line', { x1: 14, y1: 37, x2: needleEnd - 2, y2: 37, class: 'tsg-stylet-line' }));
  root.append(svgEl('line', { x1: tipX, y1: 10, x2: tipX, y2: 64, class: 'tsg-tip-mark' }));
  root.append(svgEl('text', { x: tipX + 4, y: 14, class: 'tsg-small' }, `${mm > 0 ? '+' : ''}${mm} mm`));
  return root;
}

/* ---------- Hub clock face ---------- */

const CLOCK_FILL = { ok: '#30a46c', across: '#3b82f6', 'large-la': '#f59e0b', anterior: '#e5484d', wrong: '#9aa3ad' };

/** Hour (0.5..12) to SVG angle in radians: 12 at the top, clockwise. */
const hourAngle = h => (h % 12) / 12 * Math.PI * 2 - Math.PI / 2;

/** Nearest half hour to a point on the clock (centre 80,80). */
export function hourAtPoint(x, y) {
  const a = Math.atan2(y - 80, x - 80) + Math.PI / 2;
  const h = ((a / (Math.PI * 2)) * 12 + 12) % 12;
  const half = Math.round(h * 2) / 2;
  return half === 0 ? 12 : half;
}

export function clockFigure(hour, verdict, words, verdictOf) {
  const root = svgEl('svg', { viewBox: '0 0 160 160', class: 'tsg-clock', role: 'img' });
  for (let k = 0; k < 24; k++) {
    const h = k / 2 || 12;
    const a0 = hourAngle(h - 0.25), a1 = hourAngle(h + 0.25);
    const p = (a, r) => `${(80 + r * Math.cos(a)).toFixed(1)},${(80 + r * Math.sin(a)).toFixed(1)}`;
    root.append(svgEl('path', { d: `M${p(a0, 52)} A52,52 0 0 1 ${p(a1, 52)} L${p(a1, 70)} A70,70 0 0 0 ${p(a0, 70)} Z`, fill: CLOCK_FILL[verdictOf(h)], 'fill-opacity': 0.32 }));
  }
  root.append(svgEl('circle', { cx: 80, cy: 80, r: 70, class: 'tsg-clock-rim', fill: 'none' }));
  for (let h = 1; h <= 12; h++) {
    const a = hourAngle(h);
    root.append(svgEl('text', { x: (80 + 60 * Math.cos(a)).toFixed(1), y: (83 + 60 * Math.sin(a)).toFixed(1), class: 'tsg-clock-num', 'text-anchor': 'middle' }, String(h)));
  }
  root.append(svgEl('text', { x: 80, y: 7, class: 'tsg-small', 'text-anchor': 'middle' }, words.anterior));
  root.append(svgEl('text', { x: 80, y: 159, class: 'tsg-small', 'text-anchor': 'middle' }, words.posterior));
  const a = hourAngle(hour);
  const tip = [80 + 44 * Math.cos(a), 80 + 44 * Math.sin(a)];
  const side = [Math.cos(a + Math.PI / 2) * 7, Math.sin(a + Math.PI / 2) * 7];
  root.append(svgEl('polygon', {
    points: `${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${(80 + side[0]).toFixed(1)},${(80 + side[1]).toFixed(1)} ${(80 - side[0]).toFixed(1)},${(80 - side[1]).toFixed(1)}`,
    fill: CLOCK_FILL[verdict], class: 'tsg-clock-arrow'
  }));
  root.append(svgEl('circle', { cx: 80, cy: 80, r: 9, class: 'tsg-clock-hub' }));
  return root;
}

/* ---------- Fluoroscopy schematic ---------- */

// Tip keyframes of the pullback per view: [t, x, y]. Each jump is a pair of keys at the same t.
const PULLBACK = Object.freeze({
  lao: [[0, 150, 46], [0.34, 150, 96], [0.34, 160, 112], [0.68, 162, 140], [0.68, 178, 152], [0.84, 180, 156], [1, 186, 156]],
  rao: [[0, 146, 46], [0.34, 146, 96], [0.34, 138, 112], [0.68, 136, 140], [0.68, 122, 154], [0.84, 120, 158], [1, 114, 158]]
});
export const JUMP_AT = Object.freeze([0.34, 0.68]);
export const TENT_AT = 0.84;

/** Tip of the assembly at pullback fraction t (0 = SVC, 1 = tenting the fossa). */
export function pullbackState(view, t) {
  const keys = PULLBACK[view] || PULLBACK.lao;
  const f = Math.max(0, Math.min(1, t));
  let x = keys[0][1], y = keys[0][2];
  for (let i = 1; i < keys.length; i++) {
    const [t0, x0, y0] = keys[i - 1];
    const [t1, x1, y1] = keys[i];
    if (f >= t1) { x = x1; y = y1; continue; }
    if (t1 > t0) { const g = (f - t0) / (t1 - t0); x = lerp(x0, x1, g); y = lerp(y0, y1, g); }
    break;
  }
  const jumps = JUMP_AT.filter(at => f >= at).length;
  return { x, y, jumps, tent: f >= TENT_AT };
}

/**
 * One schematic frame. `extra`: 'needle' (needle out across the septum),
 * 'dilator' (dilator across), 'wire' (wire into the left superior pulmonary vein).
 */
export function fluoroFigure(view, t, extra, words) {
  const lao = view !== 'rao';
  const root = svgEl('svg', { viewBox: '0 0 300 280', class: 'tsg-fluoro', role: 'img' });
  root.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 280, class: 'tsg-fluoro-bg' }));
  // Spine: right of the image in LAO, left in RAO.
  const spineX = lao ? 238 : 34;
  for (let i = 0; i < 7; i++) root.append(svgEl('rect', { x: spineX, y: 8 + i * 40, width: 34, height: 32, rx: 6, class: 'tsg-spine' }));
  root.append(svgEl('ellipse', { cx: lao ? 150 : 160, cy: 170, rx: 104, ry: 82, class: 'tsg-silhouette' }));
  // Aortic pigtail (landmark of the aortic root) and CS catheter.
  const ao = lao ? { x: 132, y: 112 } : { x: 186, y: 110 };
  root.append(svgEl('path', { d: `M${ao.x + 10},0 L${ao.x + 6},${ao.y - 16} Q${ao.x},${ao.y + 10} ${ao.x - 10},${ao.y} Q${ao.x - 14},${ao.y - 12} ${ao.x - 2},${ao.y - 10}`, class: 'tsg-pigtail', fill: 'none' }));
  const cs = lao ? 'M150,214 Q176,232 206,214 Q232,196 244,160' : 'M150,196 Q190,212 226,186 Q250,166 258,140';
  root.append(svgEl('path', { d: cs, class: 'tsg-cs', fill: 'none' }));
  // Assembly: from the IVC at the bottom up to the tip.
  const tip = pullbackState(view, t);
  const dir = lao ? 1 : -1;
  root.append(svgEl('path', { d: `M140,280 L142,${tip.y + 48} Q144,${tip.y + 6} ${tip.x},${tip.y}`, class: 'tsg-fluoro-sheath', fill: 'none' }));
  if (tip.tent) {
    root.append(svgEl('path', { d: `M${tip.x + dir * 4},${tip.y - 26} Q${tip.x + dir * 22},${tip.y} ${tip.x + dir * 4},${tip.y + 26}`, class: 'tsg-tent', fill: 'none' }));
  }
  if (extra === 'needle' || extra === 'dilator' || extra === 'wire') {
    root.append(svgEl('line', { x1: tip.x, y1: tip.y, x2: tip.x + dir * 22, y2: tip.y - 4, class: extra === 'needle' ? 'tsg-fluoro-needle' : 'tsg-fluoro-sheath' }));
  }
  if (extra === 'wire') {
    const end = lao ? 'Q236,92 262,64' : 'Q74,96 46,70';
    root.append(svgEl('path', { d: `M${tip.x + dir * 22},${tip.y - 4} ${end}`, class: 'tsg-fluoro-wire', fill: 'none' }));
  }
  root.append(svgEl('circle', { cx: tip.x, cy: tip.y, r: 3.4, class: 'tsg-fluoro-tip' }));
  root.append(svgEl('text', { x: 8, y: 272, class: 'tsg-fluoro-label' }, lao ? words.lao : words.rao));
  root.append(svgEl('text', { x: lao ? 292 : 8, y: 18, class: 'tsg-fluoro-label', 'text-anchor': lao ? 'end' : 'start' }, `${lao ? '' : '← '}${words.posterior}${lao ? ' →' : ''}`));
  return root;
}

/* ---------- Fossa site map ---------- */

const MAP = Object.freeze({ cx: 150, cy: 112, rx: 74, ry: 62 });

/** SVG position of a TS_SITES key on the en-face map (anterior to the right, superior up). */
export function sitePoint(key) {
  const site = TS_SITES[key];
  if (!site) throw new Error(`Unknown transseptal site: ${key}`);
  return { x: MAP.cx + site.anterior * MAP.rx, y: MAP.cy - site.superior * MAP.ry };
}

export function fossaMapFigure(selected, names, words) {
  const root = svgEl('svg', { viewBox: '0 0 300 230', class: 'tsg-map', role: 'group' });
  root.append(svgEl('rect', { x: 4, y: 4, width: 292, height: 222, rx: 14, class: 'tsg-map-wall' }));
  root.append(svgEl('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rx + 10, ry: MAP.ry + 10, class: 'tsg-map-limbus' }));
  root.append(svgEl('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rx, ry: MAP.ry, class: 'tsg-map-fossa' }));
  const landmarks = [
    ['SVC', 150, 20, 'middle'], ['IVC', 150, 218, 'middle'], ['Ao / NCC', 262, 30, 'middle'],
    ['TV', 284, 120, 'end'], ['CS os', 262, 206, 'middle'], [words.posterior, 14, 120, 'start']
  ];
  for (const [label, x, y, anchor] of landmarks) root.append(svgEl('text', { x, y, class: 'tsg-map-label', 'text-anchor': anchor }, label));
  for (const key of Object.keys(TS_SITES)) {
    const { x, y } = sitePoint(key);
    const on = key === selected;
    const g = svgEl('g', { class: `tsg-site${on ? ' selected' : ''}`, 'data-tsg-site': key, tabindex: 0, role: 'button', 'aria-pressed': String(on), 'aria-label': names[key] || key });
    g.append(svgEl('circle', { cx: x, cy: y, r: on ? 13 : 10, fill: hex(TS_SITES[key].color), 'fill-opacity': on ? 0.95 : 0.7, class: 'tsg-site-dot' }));
    g.append(svgEl('text', { x, y: y + 3.5, 'text-anchor': 'middle', class: 'tsg-site-code' }, key === 'laac' ? 'LAA' : key.toUpperCase()));
    root.append(g);
  }
  return root;
}
