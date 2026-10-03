// Fluoroscopic anatomy contours: the outlines of the cardiac chambers, great
// vessels, coronary sinus and AV annuli projected with the current C-arm
// camera and drawn over the fluoroscopy image, the way an operator sketches
// them on a frame. Each structure's atlas mesh is rasterised into a coarse
// mask in screen space and its outer silhouette traced (Moore neighbour);
// the annuli are their measured rims, projected. Structures
// that are not seen directly on fluoroscopy (left atrium, aortic root without
// contrast) are dashed. A teaching overlay on the model, not image analysis
// of a real radiograph.

import * as THREE from 'three';

export const FLUORO_CONTOURS = Object.freeze([
  { id: 'svc', color: '#f2d24b', label: { tr: 'SVC', en: 'SVC' } },
  { id: 'ra', color: '#f2d24b', label: { tr: 'RA', en: 'RA' } },
  { id: 'pa', color: '#f2d24b', label: { tr: 'PA', en: 'PA' } },
  { id: 'aorta', color: '#ef6a43', dashed: true, label: { tr: 'Ao', en: 'Ao' } },
  { id: 'la', color: '#4f86ea', dashed: true, label: { tr: 'LA', en: 'LA' } },
  { id: 'rv', color: '#62d3ea', hatch: true, label: { tr: 'RV', en: 'RV' } },
  { id: 'lv', color: '#62d3ea', hatch: true, label: { tr: 'LV', en: 'LV' } },
  { id: 'cs', color: '#46c66a', label: { tr: 'CS', en: 'CS' } },
  { id: 'tricuspid-annulus', ring: true, color: '#2f63e6', label: { tr: 'TA', en: 'TA' } },
  { id: 'mitral-annulus', ring: true, color: '#2f63e6', label: { tr: 'MA', en: 'MA' } }
]);

const GRID = 220;                 // mask width in cells (height follows the aspect)

/** Project a world point to canvas pixels (null behind the camera). */
function toScreen(v, camera, width, height) {
  const p = v.clone().project(camera);
  if (p.z > 1) return null;
  return [(p.x + 1) / 2 * width, (1 - p.y) / 2 * height];
}

/** Rasterise the meshes' triangles into a w x h mask (cells hold 1). */
export function rasterise(meshes, camera, w, h) {
  const mask = new Uint8Array(w * h);
  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    const pos = mesh.geometry?.attributes?.position;
    if (!pos) continue;
    mesh.updateWorldMatrix(true, false);
    const n = pos.count;
    const xy = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).project(camera);
      xy[i * 2] = (v.x + 1) / 2 * w;
      xy[i * 2 + 1] = (1 - v.y) / 2 * h;
    }
    const index = mesh.geometry.index?.array;
    const triCount = index ? index.length / 3 : n / 3;
    for (let t = 0; t < triCount; t++) {
      const a = index ? index[t * 3] : t * 3, b = index ? index[t * 3 + 1] : t * 3 + 1, c = index ? index[t * 3 + 2] : t * 3 + 2;
      fillTriangle(mask, w, h, xy[a * 2], xy[a * 2 + 1], xy[b * 2], xy[b * 2 + 1], xy[c * 2], xy[c * 2 + 1]);
    }
  }
  return mask;
}

function fillTriangle(mask, w, h, x0, y0, x1, y1, x2, y2) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
  if (minX > maxX || minY > maxY) return;
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (Math.abs(area) < 1e-9) { mask[Math.round((y0 + y1 + y2) / 3) * w + Math.round((x0 + x1 + x2) / 3)] = 1; return; }
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const w0 = (x1 - px) * (y2 - py) - (x2 - px) * (y1 - py);
    const w1 = (x2 - px) * (y0 - py) - (x0 - px) * (y2 - py);
    const w2 = (x0 - px) * (y1 - py) - (x1 - px) * (y0 - py);
    if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) mask[y * w + x] = 1;
  }
}

/** Close one-cell gaps (open meshes, thin vessels) so the silhouette is one region. */
function dilate(mask, w, h) {
  const out = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (mask[y * w + x]) continue;
    if (mask[y * w + x - 1] || mask[y * w + x + 1] || mask[(y - 1) * w + x] || mask[(y + 1) * w + x]) out[y * w + x] = 1;
  }
  return out;
}

/** Outer boundary of the largest region (Moore-neighbour tracing), in cell coordinates. */
export function traceOutline(mask, w, h) {
  // Largest 4-connected component.
  const label = new Int32Array(w * h);
  let best = 0, bestSize = 0, next = 0;
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i]) continue;
    next++;
    let size = 0;
    stack.push(i); label[i] = next;
    while (stack.length) {
      const k = stack.pop(); size++;
      const x = k % w, y = (k - x) / w;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (mask[j] && !label[j]) { label[j] = next; stack.push(j); }
      }
    }
    if (size > bestSize) { bestSize = size; best = next; }
  }
  if (!best || bestSize < 4) return null;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && label[y * w + x] === best;
  let start = -1;
  for (let i = 0; i < w * h && start < 0; i++) if (label[i] === best) start = i;
  const sx = start % w, sy = (start - sx) / w;
  // Moore neighbourhood, clockwise from west.
  const DIRS = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const out = [[sx, sy]];
  let cx = sx, cy = sy, back = 0;
  for (let guard = 0; guard < w * h * 2; guard++) {
    let found = false;
    for (let k = 0; k < 8; k++) {
      const d = (back + 1 + k) % 8;
      const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
      if (inside(nx, ny)) { back = (d + 4) % 8; cx = nx; cy = ny; found = true; break; }
    }
    if (!found || (cx === sx && cy === sy)) break;
    out.push([cx, cy]);
  }
  return { points: out, size: bestSize };
}

/** Moving-average smoothing of a closed polyline, then every k-th point. */
function smooth(points, radius = 2, every = 2) {
  const n = points.length;
  if (n < 6) return points;
  const out = [];
  for (let i = 0; i < n; i += every) {
    let x = 0, y = 0;
    for (let k = -radius; k <= radius; k++) { const p = points[(i + k + n) % n]; x += p[0]; y += p[1]; }
    out.push([x / (2 * radius + 1), y / (2 * radius + 1)]);
  }
  return out;
}

/**
 * Contours of every structure for one camera, in canvas pixels.
 * @param {(id: string) => THREE.Mesh[]} getMeshes visible atlas meshes of an id
 * @returns {{ id: string, points: number[][], centroid: number[], closed: boolean }[]}
 */
export function computeContours(getMeshes, camera, width, height) {
  const w = GRID, h = Math.max(40, Math.round(GRID * height / Math.max(1, width)));
  const sx = width / w, sy = height / h;
  const out = [];
  for (const s of FLUORO_CONTOURS) {
    const meshes = getMeshes(s.id);
    if (!meshes.length) continue;
    if (s.ring) {
      // The measured annulus rim (ring mesh space), projected: the true annulus shape, not a circle.
      const ring = meshes[0];
      if (!ring.userData.rim) continue;
      ring.updateWorldMatrix(true, false);
      const pts = ring.userData.rim.map((p) => toScreen(p.clone().applyMatrix4(ring.matrixWorld), camera, width, height)).filter(Boolean);
      if (pts.length > 8) out.push({ id: s.id, points: pts, centroid: centroidOf(pts), closed: true });
      continue;
    }
    const traced = traceOutline(dilate(rasterise(meshes, camera, w, h), w, h), w, h);
    if (!traced) continue;
    const pts = smooth(traced.points).map(([x, y]) => [(x + 0.5) * sx, (y + 0.5) * sy]);
    out.push({ id: s.id, points: pts, centroid: centroidOf(pts), closed: true });
  }
  return out;
}

const centroidOf = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

/** Draw the contours (with hatching for the ventricles and labels) on a 2D context. */
export function drawContours(ctx, contours, lang = 'tr') {
  const style = Object.fromEntries(FLUORO_CONTOURS.map((s) => [s.id, s]));
  ctx.lineJoin = 'round';
  for (const c of contours) {
    const s = style[c.id];
    const path = new Path2D();
    c.points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    if (c.closed) path.closePath();
    if (s.hatch) {
      ctx.save();
      ctx.clip(path);
      ctx.strokeStyle = s.color; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
      const xs = c.points.map((p) => p[0]), ys = c.points.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      ctx.beginPath();
      for (let x = x0 - (y1 - y0); x < x1; x += 14) { ctx.moveTo(x, y1); ctx.lineTo(x + (y1 - y0) * 0.6, y0); }
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = s.color; ctx.lineWidth = s.ring ? 2.6 : 2.2; ctx.globalAlpha = 0.95;
    ctx.setLineDash(s.dashed ? [9, 6] : []);
    ctx.stroke(path);
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.font = 'bold 13px system-ui, sans-serif';
  // Rings are labelled at their lower edge, the others at their centroid; a label that
  // would cover another moves down (then up) until it is free.
  const placed = [];
  const free = (b) => !placed.some((p) => b.x < p.x + p.w && p.x < b.x + b.w && b.y < p.y + p.h && p.y < b.y + b.h);
  for (const c of [...contours].sort((u, v) => Number(Boolean(style[v.id].ring)) - Number(Boolean(style[u.id].ring)))) {
    const s = style[c.id];
    const text = s.label[lang === 'en' ? 'en' : 'tr'];
    const anchor = s.ring ? c.points.reduce((best, p) => (p[1] > best[1] ? p : best), c.points[0]) : c.centroid;
    const w = ctx.measureText(text).width + 8;
    const box = { x: anchor[0] - w / 2, y: anchor[1] + (s.ring ? 4 : -9), w, h: 17 };
    for (let k = 1; k <= 8 && !free(box); k++) box.y = anchor[1] - 9 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 18;
    placed.push(box);
    ctx.fillStyle = 'rgba(20, 22, 24, 0.55)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = s.color;
    ctx.fillText(text, box.x + 4, box.y + 13);
  }
}
