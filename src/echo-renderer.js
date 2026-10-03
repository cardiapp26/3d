// Echo sector renderer for the TTE/TEE lesson. It draws where a plane cuts the
// atlas meshes inside an ultrasound-style fan: an anatomical section, never
// B-mode imaging, and never a physical scale (depth is shown as a fraction).

import { drawPaths } from './echo-renderer-paths.js';

/** Drawing styles, in toggle order. */
export const ECHO_STYLES = Object.freeze(['anatomy', 'gray']);

const CHAMBERS = new Set(['lv', 'rv', 'la', 'ra', 'laa', 'aorta', 'pa']);
const VALVES = new Set(['mitral', 'tricuspid', 'aortic-valve', 'lcc', 'rcc', 'ncc', 'pulmonary-valve']);
const UNKNOWN_COLOR = '#9fb3aa';
const MARGIN_X = 10;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 20;
const EPS = 1e-9;

const TEXT = {
  watermark: {
    anatomy: { tr: 'Anatomik kesit · ultrason görüntüsü değil', en: 'Anatomical section · not an ultrasound image' },
    gray: { tr: 'Şematik kesit · gerçek ultrason değil', en: 'Schematic section · not real ultrasound' }
  },
  depth: { tr: 'Derinlik göreli', en: 'Relative depth' },
  frozen: { tr: 'DONDURULDU', en: 'FROZEN' },
  empty: { tr: 'Kesitte yapı yok', en: 'No structure in the section' }
};

const pick = (obj, lang) => (lang === 'en' ? obj.en : obj.tr);

// The wedge is convex only up to a half-plane, so the full angle is capped at pi.
function halfAngle(sectorAngle) {
  const a = Number(sectorAngle);
  return (Number.isFinite(a) && a > 0 ? Math.min(a, Math.PI) : 1.4) / 2;
}

function safeDepth(depth) {
  const d = Number(depth);
  return Number.isFinite(d) && d > 0 ? d : 5;
}

function insideSector(p, h, depth) {
  const [x, y] = p;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (x * x + y * y > depth * depth + EPS) return false;
  return Math.abs(Math.atan2(x, y)) <= h + EPS;
}

/**
 * Fit the sector (apex top centre, opening downward) into a width x height canvas.
 * @returns {{ apex: number[], scale: number, radius: number, toScreen: Function, inside: Function }}
 */
export function sectorGeometry(width, height, sectorAngle, depth) {
  const h = halfAngle(sectorAngle);
  const d = safeDepth(depth);
  const w = Math.max(0, Number(width) || 0);
  const ht = Math.max(0, Number(height) || 0);
  const boxW = 2 * d * Math.sin(Math.min(h, Math.PI / 2));
  const scale = Math.max(0, Math.min((w - 2 * MARGIN_X) / boxW, (ht - MARGIN_TOP - MARGIN_BOTTOM) / d));
  const apex = [w / 2, MARGIN_TOP];
  return {
    apex,
    scale,
    radius: d * scale,
    toScreen: ([x, y]) => [apex[0] + x * scale, apex[1] + y * scale],
    inside: (p) => insideSector(p, h, d)
  };
}

// Parameter interval [t0, t1] of segment a->b inside the wedge and the disc, or null.
function segmentInterval(a, b, h, depth) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  let t0 = 0;
  let t1 = 1;
  // Outward normals of the right and left edges (Liang-Barsky on two half-planes).
  const normals = [[Math.cos(h), -Math.sin(h)], [-Math.cos(h), -Math.sin(h)]];
  for (const [nx, ny] of normals) {
    const p = nx * dx + ny * dy;
    const q = -(nx * a[0] + ny * a[1]);
    if (Math.abs(p) < EPS) {
      if (q < -EPS) return null;
    } else if (p > 0) {
      t1 = Math.min(t1, q / p);
    } else {
      t0 = Math.max(t0, q / p);
    }
  }
  const qa = dx * dx + dy * dy;
  const qb = 2 * (a[0] * dx + a[1] * dy);
  const qc = a[0] * a[0] + a[1] * a[1] - depth * depth;
  if (qa < EPS) {
    if (qc > EPS) return null;
  } else {
    const disc = qb * qb - 4 * qa * qc;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    t0 = Math.max(t0, (-qb - s) / (2 * qa));
    t1 = Math.min(t1, (-qb + s) / (2 * qa));
  }
  return t1 - t0 > EPS ? [t0, t1] : null;
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/**
 * Split an atlas-space polyline into the runs inside the sector, with exact crossings.
 * @param {number[][]} points [[x, y], ...], y = depth from the transducer
 * @returns {number[][][]} runs of at least 2 points
 */
export function clipToSector(points, sectorAngle, depth) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const h = halfAngle(sectorAngle);
  const d = safeDepth(depth);
  const runs = [];
  let run = null;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const span = Array.isArray(a) && Array.isArray(b) ? segmentInterval(a, b, h, d) : null;
    if (!span) {
      run = null;
      continue;
    }
    const [t0, t1] = span;
    if (!run || t0 > 1e-7) {
      run = [lerp(a, b, t0)];
      runs.push(run);
    }
    run.push(lerp(a, b, t1));
    if (t1 < 1 - 1e-7) run = null;
  }
  return runs.filter((r) => r.length >= 2);
}

function contourRuns(contour, h, depth) {
  const pts = contour?.points;
  if (!Array.isArray(pts) || pts.length < 2) return [];
  const closed = contour.closed && pts.length > 2;
  const runs = clipToSector(closed ? [...pts, pts[0]] : pts, h * 2, depth);
  // A closed ring cut open at points[0] comes back as two runs that share that point.
  if (closed && runs.length > 1) {
    const [x0, y0] = pts[0];
    const first = runs[0][0];
    const last = runs[runs.length - 1];
    const end = last[last.length - 1];
    const at = (p) => Math.hypot(p[0] - x0, p[1] - y0) < 1e-9;
    if (at(first) && at(end)) {
      return [[...last, ...runs[0].slice(1)], ...runs.slice(1, -1)];
    }
  }
  return runs;
}

function sectorPath(ctx, geo, h) {
  ctx.beginPath();
  ctx.moveTo(geo.apex[0], geo.apex[1]);
  ctx.arc(geo.apex[0], geo.apex[1], geo.radius, Math.PI / 2 - h, Math.PI / 2 + h);
  ctx.closePath();
}

function tracePath(ctx, geo, points, close) {
  ctx.beginPath();
  points.forEach((p, i) => {
    const [x, y] = geo.toScreen(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (close) ctx.closePath();
}

function drawFrame(ctx, width, height, geo, h, depth, lang) {
  ctx.fillStyle = '#050807';
  ctx.fillRect(0, 0, width, height);
  sectorPath(ctx, geo, h);
  ctx.fillStyle = '#0b0f0e';
  ctx.fill();
  ctx.strokeStyle = '#2c3a35';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Depth ticks on the right edge, labelled as a fraction of the shown depth.
  const dir = [Math.sin(h), Math.cos(h)];
  const out = [Math.cos(h), -Math.sin(h)];
  ctx.font = '9px ui-monospace, monospace';
  ctx.fillStyle = '#6f8a80';
  ctx.beginPath();
  for (let k = 1; k <= Math.floor(depth + 1e-9); k++) {
    const [x, y] = geo.toScreen([dir[0] * k, dir[1] * k]);
    ctx.moveTo(x, y);
    ctx.lineTo(x + out[0] * 5, y + out[1] * 5);
    ctx.fillText(`${Math.round((k / depth) * 100)}%`, x + out[0] * 7 + 1, y + out[1] * 7 + 3);
  }
  ctx.stroke();
  const [mx, my] = geo.toScreen([dir[0] * depth * 0.1, dir[1] * depth * 0.1]);
  ctx.fillStyle = '#39e8ad';
  ctx.beginPath();
  ctx.arc(mx + out[0] * 7, my + out[1] * 7, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6f8a80';
  // One line above the watermark, so the two never meet on a narrow canvas.
  ctx.fillText(pick(TEXT.depth, lang), width - 6, height - 19);
  ctx.textAlign = 'left';
}

function drawContours(ctx, geo, items, style) {
  const fillable = items.filter((it) => it.closed && CHAMBERS.has(it.id));
  for (const it of fillable) {
    tracePath(ctx, geo, it.points, true);
    ctx.fillStyle = style === 'gray' ? '#050505' : it.color;
    ctx.globalAlpha = style === 'gray' ? 1 : 0.18;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (style === 'gray') {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#d8d8d0';
    for (const it of items) {
      ctx.lineWidth = 7 + (it.highlight ? 2 : 0);
      it.runs.forEach((r) => { tracePath(ctx, geo, r, false); ctx.stroke(); });
    }
    ctx.globalAlpha = 1;
  }
  for (const it of items) {
    const valve = style === 'gray' && VALVES.has(it.id);
    ctx.strokeStyle = style === 'gray' ? (valve ? '#ffffff' : '#d8d8d0') : it.color;
    const base = style === 'gray' ? (valve ? 2 : 3) : 2;
    ctx.lineWidth = it.highlight ? base + 1.5 : base;
    it.runs.forEach((r) => { tracePath(ctx, geo, r, false); ctx.stroke(); });
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Labels are placed target-first; one that still overlaps after a few shifts is
// dropped (its structure stays drawn) rather than stacked on another label.
function drawLabels(ctx, geo, labels, style) {
  ctx.font = 'bold 11px system-ui, sans-serif';
  const placed = [];
  for (const lab of labels) {
    const w = (ctx.measureText(lab.text)?.width || lab.text.length * 6) + 6;
    const [cx, cy] = geo.toScreen(lab.centroid);
    const box = { x: cx - w / 2, y: cy - 8, w, h: 15 };
    for (let n = 0; n < 5 && placed.some((p) => overlaps(p, box)); n++) box.y += 12;
    if (placed.some((p) => overlaps(p, box))) continue;
    placed.push(box);
    ctx.fillStyle = 'rgba(5, 8, 7, 0.72)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = style === 'gray' ? '#e8e8e0' : lab.color;
    ctx.fillText(lab.text, box.x + 3, box.y + 11.5);
  }
}

function drawOverlayText(ctx, width, height, geo, opts, lang, style, empty) {
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200, 214, 207, 0.55)';
  ctx.fillText(pick(TEXT.watermark[style], lang), 6, height - 6);
  const info = opts.info && pick(opts.info, lang);
  if (info) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#9fc7b6';
    ctx.fillText(String(info), 6, 14);
  }
  if (opts.frozen) {
    const text = pick(TEXT.frozen, lang);
    ctx.font = 'bold 10px system-ui, sans-serif';
    const w = (ctx.measureText(text)?.width || text.length * 6) + 8;
    ctx.fillStyle = 'rgba(252, 211, 77, 0.16)';
    ctx.fillRect(width - w - 6, 4, w, 15);
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(text, width - w - 2, 15);
  }
  if (empty) {
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb3aa';
    ctx.fillText(pick(TEXT.empty, lang), geo.apex[0], geo.apex[1] + geo.radius * 0.55);
    ctx.textAlign = 'left';
  }
}

/**
 * Draw the anatomical echo section on a canvas (DPR aware). The caller sets the CSS size.
 * @param {HTMLCanvasElement} canvas
 * @param {{ contours?: object[], structures?: object }} section
 * @param {object} [opts] style, sectorAngle, depth, info, lang, structureInfo, frozen, hideLabels, highlight, markers, paths
 */
function runLength(run) {
  let length = 0;
  for (let i = 1; i < run.length; i++) length += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
  return length;
}

function pointAlong(run, at) {
  let walked = 0;
  for (let i = 1; i < run.length; i++) {
    const seg = Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
    if (walked + seg >= at && seg > 0) { const f = (at - walked) / seg; return [run[i - 1][0] + (run[i][0] - run[i - 1][0]) * f, run[i - 1][1] + (run[i][1] - run[i - 1][1]) * f]; }
    walked += seg;
  }
  return run[run.length - 1];
}

const MIN_LABEL_RUN = 0.15;   // contour shorter than this in the image: no label

export function drawEchoSector(canvas, section, opts = {}) {
  const width = canvas?.clientWidth;
  const height = canvas?.clientHeight;
  if (!(width >= 2) || !(height >= 2)) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
  if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  const o = opts || {};
  const lang = o.lang === 'en' ? 'en' : 'tr';
  const style = ECHO_STYLES.includes(o.style) ? o.style : 'anatomy';
  const h = halfAngle(o.sectorAngle);
  const depth = safeDepth(o.depth);
  const geo = sectorGeometry(width, height, h * 2, depth);
  const info = o.structureInfo || {};
  const highlight = new Set(o.highlight || []);
  const colorOf = (id) => info[id]?.color || UNKNOWN_COLOR;

  const items = (Array.isArray(section?.contours) ? section.contours : [])
    .map((c) => ({
      id: c?.id,
      points: c?.points,
      closed: Boolean(c?.closed),
      color: colorOf(c?.id),
      highlight: highlight.has(c?.id),
      runs: contourRuns(c, h, depth)
    }))
    .filter((it) => it.runs.length > 0);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawFrame(ctx, width, height, geo, h, depth, lang);
  // Fills use the whole ring, so clip them (and the strokes) to the fan.
  ctx.save();
  sectorPath(ctx, geo, h);
  ctx.clip();
  drawContours(ctx, geo, items, style);
  ctx.restore();

  if (!o.hideLabels && items.length) {
    // Each label sits on its structure's longest visible run, halfway along it:
    // always on the drawn contour and inside the fan.
    const best = new Map();
    for (const it of items) for (const run of it.runs) {
      const length = runLength(run);
      if (!best.has(it.id) || length > best.get(it.id).length) best.set(it.id, { run, length });
    }
    const labels = [...best.entries()]
      // Short slivers get no label (they crowd the image); targets always do.
      .filter(([id, { length }]) => highlight.has(id) || length >= MIN_LABEL_RUN)
      .map(([id, { run, length }]) => ({
        text: String(info[id]?.label?.[lang] || info[id]?.label?.tr || id),
        centroid: pointAlong(run, length / 2),
        color: colorOf(id),
        target: highlight.has(id)
      }))
      .sort((a, b) => (b.target - a.target) || a.centroid[1] - b.centroid[1]);
    drawLabels(ctx, geo, labels, style);
  }
  // Schematic overlay paths (transseptal needle, tenting), clipped to the fan.
  drawPaths(ctx, geo, o.paths, () => sectorPath(ctx, geo, h));
  // Landmark points without a mesh (e.g. the estimated IVC orifice), when in the image.
  for (const m of Array.isArray(o.markers) ? o.markers : []) {
    if (!Array.isArray(m?.point) || !geo.inside(m.point)) continue;
    const [mx, my] = geo.toScreen(m.point);
    ctx.strokeStyle = m.color || '#9fd3ff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = m.color || '#9fd3ff'; ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(String(m.label?.[lang] || m.label?.tr || ''), mx + 9, my + 3);
  }
  drawOverlayText(ctx, width, height, geo, o, lang, style, items.length === 0);
}
