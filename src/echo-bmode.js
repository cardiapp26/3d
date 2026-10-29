import { sectorGeometry, clipToSector } from './echo-renderer.js';
import { drawPaths } from './echo-renderer-paths.js';
import { CM_PER_UNIT } from './echo-image-summary.js';
import { drawColorJet } from './echo-color-doppler.js';
import { acquireEchoImage } from './echo-acquire.js';

/*
 * Echo-like image of the current plane for the echo studio: a simulation
 * derived from the atlas section, not a recorded or physically simulated
 * ultrasound. The atlas chambers are wall shells whose triangles point out of
 * the wall tissue, and each surface point knows whether it faces a cavity
 * (echo-cavity.js, carried per segment by echo-section.js). So the wall bands
 * are drawn on the tissue side of each cut line, and the blood is filled from
 * the cavity side of the cavity-facing lines (the lumen side for the vessel
 * tubes), bounded by every line and wall band and by a reach that keeps a
 * fill from leaking far through an orifice. Everything else is grey tissue.
 * The image is then formed along the scan lines (echo-acquire.js: speckle,
 * attenuation and shadowing, PSF, log compression, sector scan conversion).
 */
const WALL_CM = Object.freeze({
  // typical adult wall thickness in cm, for the band brightness (the atlas gives the real gap between the surfaces)
  lv: 1.0, rv: 0.45, la: 0.3, laa: 0.25, ra: 0.25, aorta: 0.2, pa: 0.15, svc: 0.12,
  lspv: 0.1, lipv: 0.1, rspv: 0.1, ripv: 0.1, cs: 0.1
});
const CHAMBERS = new Set(['lv', 'rv', 'la', 'laa', 'ra']);
const VESSELS = new Set(['aorta', 'pa', 'svc', 'lspv', 'lipv', 'rspv', 'ripv', 'cs']);
const VALVES = new Set(['mitral', 'mitral-annulus', 'tricuspid', 'aortic-valve', 'pulmonary-valve']);
// Chordae: thin bright lines drawn after the blood fill, so they never split a cavity.
const CHORDS = new Set(['mitral-chordae']);
const INSIDE = new Set(['lv-papillary', 'rv-papillary', 'moderator-band']);
const LEVEL = Object.freeze({ tissue: 0.34, wall: 0.58, ventricle: 0.64, line: 0.72, inside: 0.55, valve: 0.95, blood: 0.03 });
const VALVE_CM = 0.12;
const CHORD_CM = 0.05;
const BAND_CM = 0.3;           // papillary or moderator band seen as an open line
const REACH_CM = 3.4;          // blood fill reach from a cavity-facing wall
const GAP_CM = 4.0;            // open ends closer than this are joined for the fill (orifices: mitral, caval, vessel ends)
const SEED_PX = 3;
const LABEL_FONT = '600 11px system-ui, sans-serif';

const TEXT = {
  caption: { tr: 'Anatomiden türetilmiş eko benzetimi · gerçek kayıt değil', en: 'Anatomy-derived echo simulation · not a recording' },
  gain: { tr: 'Kazanç', en: 'Gain' },
  frozen: { tr: 'DONDURULDU', en: 'FROZEN' }
};
const pick = (o, lang) => (lang === 'en' ? o.en : o.tr);

function trace(ctx, geo, points, close) {
  ctx.beginPath();
  points.forEach((p, i) => { const [x, y] = geo.toScreen(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  if (close) ctx.closePath();
}
const grey = (v, a = 1) => { const c = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgba(${c},${c},${c},${a})`; };

/** Segment side of point i of a contour (the last point uses the last segment). */
const sideAt = (c, i) => c.sides[Math.min(i, c.sides.length - 1)];

/** A band of width `px` along the contour, on the side of the normal (dir +1) or against it (-1). */
function oneSidedBand(ctx, geo, c, px, dir) {
  if (!c.sides?.length) return;
  ctx.lineWidth = px;
  ctx.beginPath();
  c.points.forEach((p, i) => {
    const [nx, ny] = sideAt(c, i);
    const [x, y] = geo.toScreen(p);
    const q = [x + dir * nx * px / 2, y + dir * ny * px / 2];
    if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
  });
  ctx.stroke();
}

/**
 * Walls, lines, valves and the intracavitary structures on the overlay canvas
 * (grey levels, transparent elsewhere); its pixels also bound the blood fill.
 */
function drawStructures(ctx, geo, contours, w, h, valveStyle = null) {
  const px = cm => Math.max(1.5, (cm / CM_PER_UNIT) * geo.scale);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const c of contours) {
    if (CHAMBERS.has(c.id)) {
      ctx.strokeStyle = grey(c.id === 'lv' || c.id === 'rv' ? LEVEL.ventricle : LEVEL.wall);
      oneSidedBand(ctx, geo, c, px(WALL_CM[c.id]), -1);          // tissue side: against the normal
    } else if (VESSELS.has(c.id)) {
      ctx.strokeStyle = grey(LEVEL.wall);
      oneSidedBand(ctx, geo, c, px(WALL_CM[c.id]), 1);           // a vessel tube's wall is outside its lumen
    }
  }
  ctx.strokeStyle = grey(LEVEL.line);
  ctx.lineWidth = 2;
  for (const c of contours) if (CHAMBERS.has(c.id) || VESSELS.has(c.id)) { trace(ctx, geo, c.points, c.closed); ctx.stroke(); }
  for (const c of contours.filter(k => INSIDE.has(k.id))) {
    ctx.fillStyle = ctx.strokeStyle = grey(LEVEL.inside);
    ctx.lineWidth = px(BAND_CM);
    trace(ctx, geo, c.points, c.closed);
    if (c.closed) ctx.fill(); else ctx.stroke();
  }
  // A diseased valve (valveStyle): thicker leaflets, brighter with calcification.
  for (const c of contours.filter(k => VALVES.has(k.id))) {
    const sick = valveStyle?.ids?.includes(c.id);
    ctx.strokeStyle = grey(sick ? Math.min(1, LEVEL.valve + 0.05 * (1 + valveStyle.calcification)) : LEVEL.valve);
    ctx.lineWidth = px(VALVE_CM * (sick ? 1 + 3.2 * (valveStyle.thickening || 0) : 1));
    trace(ctx, geo, c.points, c.closed);
    ctx.stroke();
  }
}

/**
 * Orifices: each open end of a wall or valve line is joined, for the fill only,
 * to the nearest open end of another line within GAP_CM, so the blood does not
 * run out of a cavity through a valve or a caval opening.
 */
function closeGaps(barrier, contours, geo, w, h) {
  const ends = [];
  contours.forEach((c, k) => {
    if (c.closed || c.points.length < 2 || !(CHAMBERS.has(c.id) || VESSELS.has(c.id) || VALVES.has(c.id))) return;
    ends.push({ k, p: geo.toScreen(c.points[0]) }, { k, p: geo.toScreen(c.points[c.points.length - 1]) });
  });
  const gap = (GAP_CM / CM_PER_UNIT) * geo.scale;
  const line = (a, b) => {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let t = 0; t <= n; t++) {
      const x = Math.round(a[0] + ((b[0] - a[0]) * t) / (n || 1)), y = Math.round(a[1] + ((b[1] - a[1]) * t) / (n || 1));
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) barrier[yy * w + xx] = 1; }
    }
  };
  for (const e of ends) {
    let best = null;
    for (const f of ends) {
      if (f.k === e.k) continue;
      const d = Math.hypot(f.p[0] - e.p[0], f.p[1] - e.p[1]);
      if (d > 0.5 && d < gap && (!best || d < best.d)) best = { d, f };
    }
    if (best) line(e.p, best.f.p);
  }
}

/** Blood: a fill from the cavity side of the cavity-facing lines, inside the barriers, within the reach. */
function fillBlood(contours, geo, barrier, w, h) {
  const blood = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const dist = new Uint16Array(w * h);
  let head = 0, tail = 0;
  const seed = (x, y) => {
    const i = Math.round(y) * w + Math.round(x);
    if (x < 0 || y < 0 || x >= w || y >= h || barrier[i] || blood[i]) return;
    blood[i] = 1; queue[tail++] = i;
  };
  for (const c of contours) {
    if (!c.sides?.length) continue;
    const chamber = CHAMBERS.has(c.id), vessel = VESSELS.has(c.id);
    if (!chamber && !vessel) continue;
    for (let i = 0; i < c.points.length - 1; i++) {
      const [nx, ny, faces] = c.sides[i];
      if (chamber && !faces) continue;
      const dir = vessel ? -1 : 1;
      const [ax, ay] = geo.toScreen(c.points[i]), [bx, by] = geo.toScreen(c.points[i + 1]);
      seed((ax + bx) / 2 + dir * nx * SEED_PX, (ay + by) / 2 + dir * ny * SEED_PX);
    }
  }
  const reach = Math.max(4, Math.round((REACH_CM / CM_PER_UNIT) * geo.scale));
  while (head < tail) {
    const i = queue[head++], d = dist[i] + 1;
    if (d > reach) continue;
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= w * h || barrier[j] || blood[j]) continue;
      blood[j] = 1; dist[j] = d; queue[tail++] = j;
    }
  }
  return blood;
}

/** Chordae over the filled image: thin bright lines from the papillary heads to the leaflets. */
function drawChords(ctx, geo, contours, w, h, raw) {
  const chords = contours.filter(c => CHORDS.has(c.id));
  if (!chords.length) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.strokeStyle = grey(LEVEL.valve * 0.85);
  ctx.lineWidth = Math.max(1.1, (CHORD_CM / CM_PER_UNIT) * geo.scale);
  for (const c of chords) { trace(ctx, geo, c.points, c.closed); ctx.stroke(); }
  const over = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < raw.length; i++) {
    const a = over[4 * i + 3] / 255;
    if (a > 0) raw[i] = raw[i] * (1 - a) + (over[4 * i] / 255) * a;
  }
}

/** Echogenicity (0 black .. 1 white) per pixel, lightly blurred. */
function echogenicity(ctx, geo, contours, w, h, valveStyle = null) {
  drawStructures(ctx, geo, contours, w, h, valveStyle);
  const over = ctx.getImageData(0, 0, w, h).data;
  const barrier = new Uint8Array(w * h);
  for (let i = 0; i < barrier.length; i++) barrier[i] = over[4 * i + 3] > 40 ? 1 : 0;
  closeGaps(barrier, contours, geo, w, h);
  const blood = fillBlood(contours, geo, barrier, w, h);
  const raw = new Float32Array(w * h);
  for (let i = 0; i < raw.length; i++) {
    const a = over[4 * i + 3] / 255;
    const base = blood[i] ? LEVEL.blood : LEVEL.tissue;
    raw[i] = base * (1 - a) + (over[4 * i] / 255) * a;
  }
  drawChords(ctx, geo, contours, w, h, raw);
  // 3x3 box blur: interfaces as soft as the speckle.
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      s += raw[yy * w + xx]; n++;
    }
    out[y * w + x] = s / n;
  }
  return out;
}

function labelPoint(runs) {
  let sx = 0, sy = 0, n = 0;
  for (const run of runs) for (const p of run) { sx += p[0]; sy += p[1]; n++; }
  return n ? [sx / n, sy / n] : null;
}

/**
 * Draw the echo-like image of `section` on `canvas` (DPR aware; the caller sets the CSS size).
 * @param {HTMLCanvasElement} canvas
 * @param {{ contours?: object[] }} section
 * @param {{ sectorAngle: number, depth: number, gainDb?: number, lang?: string, info?: object, frozen?: boolean,
 *   labels?: boolean, structureInfo?: object, paths?: object[], time?: number }} opts
 * @returns {{ hits: { id: string, points: number[][] }[] } | undefined}
 */
export function drawEchoImage(canvas, section, opts = {}) {
  const w = Math.round(canvas?.clientWidth || 0), h = Math.round(canvas?.clientHeight || 0);
  if (w < 2 || h < 2) return undefined;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return undefined;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(w * dpr)) canvas.width = Math.floor(w * dpr);
  if (canvas.height !== Math.floor(h * dpr)) canvas.height = Math.floor(h * dpr);
  const lang = opts.lang === 'en' ? 'en' : 'tr';
  const half = Math.min(opts.sectorAngle || 1.4, Math.PI) / 2;
  const depth = opts.depth > 0 ? opts.depth : 4;
  const geo = sectorGeometry(w, h, half * 2, depth);
  const contours = Array.isArray(section?.contours) ? section.contours.filter(c => Array.isArray(c?.points) && c.points.length > 1) : [];

  // Image at CSS resolution (ultrasound is soft), scaled up to the device pixels.
  const work = (canvas._echoWork ||= canvas.ownerDocument.createElement('canvas'));
  if (work.width !== w || work.height !== h) { work.width = w; work.height = h; }
  const wctx = work.getContext('2d', { willReadFrequently: true });
  const echo = echogenicity(wctx, geo, contours, w, h, opts.pathology?.valveStyle || null);
  // Acquisition: scan lines through the map, speckle, attenuation, PSF, log compression (echo-acquire.js).
  wctx.putImageData(new ImageData(acquireEchoImage(echo, w, h, geo, half, Number(opts.gainDb) || 0, opts.time ?? 0), w, h), 0, 0);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(work, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Schematic overlays (transseptal needle, colour Doppler), clipped to the fan.
  const fan = () => {
    ctx.beginPath(); ctx.moveTo(geo.apex[0], geo.apex[1]);
    ctx.arc(geo.apex[0], geo.apex[1], geo.radius, Math.PI / 2 - half, Math.PI / 2 + half); ctx.closePath();
  };
  drawPaths(ctx, geo, opts.paths, fan);
  for (const jet of opts.pathology?.jets || []) drawColorJet(ctx, geo, contours, jet, { time: opts.time, clip: fan, lang });

  // Depth ruler in centimetres on the right edge, the index-side dot at the fan's top right.
  const depthCm = depth * CM_PER_UNIT;
  ctx.strokeStyle = 'rgba(210, 222, 230, 0.55)';
  ctx.fillStyle = 'rgba(210, 222, 230, 0.75)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k <= Math.floor(depthCm + 1e-9); k++) {
    const y = geo.apex[1] + (k / CM_PER_UNIT) * geo.scale;
    const long = k % 2 === 0;
    ctx.moveTo(w - 6, y); ctx.lineTo(w - (long ? 14 : 10), y);
    if (long) ctx.fillText(String(k), w - 17, y + 3.5);
  }
  ctx.stroke();
  const [mx, my] = geo.toScreen([Math.sin(half) * depth * 0.08, Math.cos(half) * depth * 0.08]);
  ctx.fillStyle = '#39e8ad';
  ctx.beginPath(); ctx.arc(mx + 8, my - 2, 3, 0, Math.PI * 2); ctx.fill();

  // Hover runs and the optional structure labels.
  const runsById = new Map();
  for (const c of contours) {
    const runs = clipToSector(c.closed ? [...c.points, c.points[0]] : c.points, half * 2, depth);
    if (runs.length) runsById.set(c.id, [...(runsById.get(c.id) || []), ...runs]);
  }
  const hits = [...runsById.entries()].flatMap(([id, runs]) => runs.map(run => ({ id, points: run.map(p => geo.toScreen(p)) })));
  if (opts.labels) {
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#eef6ff';
    for (const [id, runs] of runsById) {
      if (VALVES.has(id) || INSIDE.has(id)) continue;
      const p = labelPoint(runs);
      const text = opts.structureInfo?.[id]?.label?.[lang];
      if (!p || !text) continue;
      const [x, y] = geo.toScreen(p);
      ctx.fillText(text, x, y + 4);
    }
    ctx.shadowBlur = 0;
  }

  // Corner text: the view, the frozen badge, the caption and the gain.
  ctx.textAlign = 'left';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = '#7cc7f2';
  const info = opts.info ? pick(opts.info, lang) : '';
  if (info) ctx.fillText(String(info), 8, 16);
  if (opts.frozen) {
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(pick(TEXT.frozen, lang), 8, 31);
  }
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(200, 214, 222, 0.6)';
  ctx.fillText(pick(TEXT.caption, lang), 8, h - 8);
  ctx.textAlign = 'right';
  const db = Math.round(Number(opts.gainDb) || 0);
  ctx.fillText(`${pick(TEXT.gain, lang)} ${db > 0 ? '+' : ''}${db} dB · ${depthCm.toFixed(1)} cm`, w - 8, h - 22);
  ctx.textAlign = 'left';
  return { hits };
}
