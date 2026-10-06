import { EP_ZONE_TEXT } from './ep-case-text.js';

/*
 * Two-dimensional valve-plane schematic (LAO-like view of the AV annuli):
 * tricuspid ring on the left, mitral ring on the right, Koch triangle, CS
 * and IVC between them, pulmonary veins behind the mitral ring. It replaces
 * the 3D zone arcs of Cardia: the active case's zone, the halo catheter,
 * the AVRT circuit, the pacing laboratory's test-beat routes and the PAC /
 * PVC source region. Teaching regions only, never a localization rule or a
 * clinical map. schematicShapes() is pure (tested); renderSchematic()
 * builds the SVG.
 */

export const VIEW = Object.freeze({ w: 320, h: 230 });
export const TA = Object.freeze({ cx: 100, cy: 112, r: 60 });
export const MA = Object.freeze({ cx: 218, cy: 112, r: 54 });
const HIS = Object.freeze([152, 62]);
const CS_OS = Object.freeze([156, 168]);
const IVC = Object.freeze({ cx: 96, cy: 206, r: 14 });
const PVS = Object.freeze([[292, 66], [304, 98], [292, 132], [304, 164]]);

// Screen angles in degrees: 0 east, 90 south (SVG y grows downwards).
const point = (ring, deg, dr = 0) => {
  const a = (deg * Math.PI) / 180;
  return [ring.cx + (ring.r + dr) * Math.cos(a), ring.cy + (ring.r + dr) * Math.sin(a)];
};
const fmt = (n) => Math.round(n * 10) / 10;
/** SVG path of a ring arc from deg0 to deg1 (clockwise on screen). */
export function arcPath(ring, deg0, deg1, dr = 0) {
  const [x0, y0] = point(ring, deg0, dr);
  const [x1, y1] = point(ring, deg1, dr);
  const large = Math.abs(deg1 - deg0) > 180 ? 1 : 0;
  return `M${fmt(x0)} ${fmt(y0)} A${fmt(ring.r + dr)} ${fmt(ring.r + dr)} 0 ${large} 1 ${fmt(x1)} ${fmt(y1)}`;
}
const line = (...pts) => `M${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(' L')}`;

// Zone geometry: an arc of a ring, or a path between landmarks.
const ZONE_SHAPES = Object.freeze({
  'left-free-wall': () => arcPath(MA, -20, 20),
  'left-anterolateral': () => arcPath(MA, -60, -25),
  'left-posterolateral': () => arcPath(MA, 25, 60),
  'right-lateral': () => arcPath(TA, 160, 200),
  'right-posterior-inferior': () => arcPath(TA, 105, 145),
  'superior-paraseptal': () => arcPath(TA, -60, -30),
  'mid-paraseptal': () => arcPath(TA, -15, 15),
  'inferior-paraseptal': () => arcPath(TA, 30, 60),
  'koch-slow-pathway': () => line(point(TA, 35, 4), CS_OS),
  'koch-inferior-extensions': () => line(CS_OS, point(MA, 150, 6), point(MA, 125, 6)),
  'cs-mcv': () => `${arcPath(MA, 95, 165, 10)} ${line(point(MA, 110, 10), point(MA, 110, 30))}`,
  'cavotricuspid-isthmus': () => line(point(TA, 95), [IVC.cx, IVC.cy - IVC.r]),
  'crista-terminalis': () => arcPath(TA, 150, 230, 22),
  'lv-posterior-septum': () => line([168, 150], [176, 196]),
  'right-bundle': () => line(HIS, [150, 120], [128, 196]),
  'pv-antrum': () => PVS.map(([x, y]) => `M${x - 13} ${y} A13 13 0 1 1 ${x + 13} ${y} A13 13 0 1 1 ${x - 13} ${y}`).join(' ')
});

// PAC / PVC source regions (ep-origin.js REGIONS), as schematic points.
const ORIGIN_POINTS = Object.freeze({
  rvot: [72, 30], 'lvot-cusp': [176, 40], 'lv-summit': [206, 32], 'mitral-superior': point(MA, -95, 10),
  'ta-free-wall': point(TA, 180, 10), 'lv-inferior': point(MA, 95, 24), 'crista-high': [30, 50],
  'cs-ostium': CS_OS, 'ta-superior': point(TA, -100, 10), rspv: PVS[0], laa: [266, 36]
});

/** Shapes of the anatomy and of the active overlays. */
export function schematicShapes({ zone = null, halo = false, circuit = null, paths = [], origin = null } = {}) {
  const shapes = [
    { kind: 'ring', id: 'ta', d: arcPath(TA, 0, 359.9) },
    { kind: 'ring', id: 'ma', d: arcPath(MA, 0, 359.9) },
    { kind: 'vessel', id: 'ivc', d: arcPath(IVC, 0, 359.9) },
    { kind: 'vessel', id: 'cs', d: arcPath({ cx: CS_OS[0], cy: CS_OS[1], r: 6 }, 0, 359.9) },
    { kind: 'vessel', id: 'pv', d: PVS.map(([x, y]) => `M${x - 8} ${y} A8 8 0 1 1 ${x + 8} ${y} A8 8 0 1 1 ${x - 8} ${y}`).join(' ') },
    { kind: 'node', id: 'koch', d: line(HIS, point(TA, 35, 4), CS_OS, HIS) }
  ];
  if (zone && ZONE_SHAPES[zone]) shapes.push({ kind: 'zone', id: zone, d: ZONE_SHAPES[zone]() });
  if (halo) shapes.push({ kind: 'halo', id: 'halo', d: arcPath(TA, 100, 250, 12) });
  // Left free wall AVRT: AV node and the pathway close the loop; the direction differs.
  if (circuit === 'orthodromic' || circuit === 'antidromic') {
    const route = [HIS, [190, 150], point(MA, 0, -6), [190, 80], HIS];
    shapes.push({ kind: 'circuit', id: circuit, d: line(...(circuit === 'orthodromic' ? route : route.slice().reverse())) });
  }
  for (const p of paths) {
    if (p === 'avn') shapes.push({ kind: 'path', id: 'avn', d: line(point(TA, 35, 4), HIS, [150, 120]) });
    if (p === 'ap') shapes.push({ kind: 'path', id: 'ap', d: arcPath(MA, -20, 20, -4) });
  }
  if (origin && ORIGIN_POINTS[origin]) {
    const [x, y] = ORIGIN_POINTS[origin];
    shapes.push({ kind: 'origin', id: origin, d: `M${fmt(x - 7)} ${fmt(y)} A7 7 0 1 1 ${fmt(x + 7)} ${fmt(y)} A7 7 0 1 1 ${fmt(x - 7)} ${fmt(y)}` });
  }
  return shapes;
}

const LABELS = Object.freeze([
  { text: { tr: 'TA', en: 'TA' }, x: TA.cx, y: TA.cy + 4 },
  { text: { tr: 'MA', en: 'MA' }, x: MA.cx, y: MA.cy + 4 },
  { text: { tr: 'His', en: 'His' }, x: HIS[0], y: HIS[1] - 8 },
  { text: { tr: 'CS', en: 'CS' }, x: CS_OS[0] + 16, y: CS_OS[1] + 4 },
  { text: { tr: 'IVC', en: 'IVC' }, x: IVC.cx + 26, y: IVC.cy + 4 },
  { text: { tr: 'PV', en: 'PV' }, x: 298, y: 196 }
]);

const CAPTION = {
  tr: 'Kapak düzlemi, LAO benzeri şematik görünüm. Öğretim bölgesidir; lokalizasyon kuralı değildir.',
  en: 'Valve plane, LAO-like schematic view. A teaching region, not a localization rule.'
};
const OVERLAY_TEXT = {
  tr: { halo: 'Halo kateteri', orthodromic: 'Ortodromik devre', antidromic: 'Antidromik devre', avn: 'AV düğüm yolu', ap: 'Aksesuar yol', origin: 'Kaynak bölge' },
  en: { halo: 'Halo catheter', orthodromic: 'Orthodromic circuit', antidromic: 'Antidromic circuit', avn: 'AV nodal route', ap: 'Accessory pathway', origin: 'Source region' }
};

/** Legend line: the zone name, then the overlays shown. */
export function schematicLegend(options = {}, lang = 'tr') {
  const L = lang === 'en' ? 'en' : 'tr';
  const parts = [];
  if (options.zone && EP_ZONE_TEXT[options.zone]) parts.push(EP_ZONE_TEXT[options.zone][L].name);
  if (options.halo) parts.push(OVERLAY_TEXT[L].halo);
  if (options.circuit) parts.push(OVERLAY_TEXT[L][options.circuit]);
  for (const p of options.paths || []) if (OVERLAY_TEXT[L][p]) parts.push(OVERLAY_TEXT[L][p]);
  if (options.origin) parts.push(OVERLAY_TEXT[L].origin);
  return parts.join(' · ');
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Schematic box (figure with an SVG, legend and caption); update() redraws it. */
export function createSchematic(doc) {
  const root = doc.createElement('figure');
  root.className = 'ep-schematic';
  root.setAttribute('data-ep-schematic', '');
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VIEW.w} ${VIEW.h}`);
  svg.setAttribute('role', 'img');
  const legend = doc.createElement('p');
  legend.className = 'ep-schematic-legend';
  const caption = doc.createElement('figcaption');
  root.append(svg, legend, caption);
  let options = {};

  function update(next = options, lang = 'tr') {
    options = next || {};
    const shapes = schematicShapes(options);
    const nodes = shapes.map((s) => {
      const path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', s.d);
      path.setAttribute('class', `sch-${s.kind}`);
      path.setAttribute('data-shape', s.id);
      if (s.kind === 'circuit') path.setAttribute('marker-mid', 'url(#sch-arrow)');
      return path;
    });
    const defs = doc.createElementNS(SVG_NS, 'defs');
    const marker = doc.createElementNS(SVG_NS, 'marker');
    for (const [k, v] of Object.entries({ id: 'sch-arrow', viewBox: '0 0 10 10', refX: '5', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' })) marker.setAttribute(k, v);
    const head = doc.createElementNS(SVG_NS, 'path');
    head.setAttribute('d', 'M0 0 L10 5 L0 10 z');
    head.setAttribute('class', 'sch-arrowhead');
    marker.append(head);
    defs.append(marker);
    const labels = LABELS.map((l) => {
      const text = doc.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(l.x));
      text.setAttribute('y', String(l.y));
      text.setAttribute('class', 'sch-label');
      text.textContent = l.text[lang === 'en' ? 'en' : 'tr'];
      return text;
    });
    svg.replaceChildren(defs, ...nodes, ...labels);
    const text = schematicLegend(options, lang);
    legend.textContent = text;
    legend.hidden = !text;
    caption.textContent = CAPTION[lang === 'en' ? 'en' : 'tr'];
    svg.setAttribute('aria-label', `${caption.textContent} ${text}`.trim());
  }

  return { element: root, update, getOptions: () => ({ ...options }) };
}
