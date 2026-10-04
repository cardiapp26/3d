/*
 * Mitral valve map for TEE: the valve seen from the left atrium (surgeon's /
 * 3D en-face view: aortic valve up, A1/P1 and the anterolateral commissure on
 * the left, A3/P3 and the posteromedial commissure on the right) with the
 * current imaging plane drawn across it. The scallop regions are the atlas
 * leaflet vertices with their measured part (mitral-scallops.js), projected
 * onto the annulus plane, so the line shows which scallops the cut crosses.
 * Bicommissural (~60°) cuts P3 - A2 - P1, the long axis (~120-140°) A2 - P2,
 * and 0° from withdrawn to advanced A1 - P1, A2 - P2, A3 - P3.
 */

const SCALLOPS = ['A1', 'A2', 'A3', 'P1', 'P2', 'P3'];
const MAX_POINTS = 120;   // per scallop, enough for the shape
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

/**
 * Map frame and scallop point sets from the rest pose.
 * @param {{ points: { part: string, p: number[] }[], center: number[], normal: number[], aortic: number[] }} input
 *   points: leaflet vertices (world) with their scallop abbreviation; normal: annulus normal toward the LV
 * @returns {{ center: number[], normal: number[], right: number[], up: number[], scale: number, scallops: Object<string, { pts: number[][], c: number[] }>, aortic: number[] } | null}
 */
export function mitralMapData({ points, center, normal, aortic }) {
  const n = norm(normal);
  const toPlane = v => { const d = sub(v, center); return sub(d, n.map(x => x * dot(d, n))); };
  const up = norm(toPlane(aortic));
  // Seen from the LA, looking along n toward the LV.
  let right = norm(cross(up, n));
  const by = Object.fromEntries(SCALLOPS.map(k => [k, []]));
  for (const { part, p } of points) if (by[part]) by[part].push(p);
  if (!by.A1.length || !by.A3.length) return null;
  const to2 = p => { const d = toPlane(p); return [dot(d, right), dot(d, up)]; };
  const mean = list => list.reduce((s, q) => [s[0] + q[0] / list.length, s[1] + q[1] / list.length], [0, 0]);
  // A1 (and the anterolateral commissure) on the left of the map.
  if (mean(by.A1.map(to2))[0] > mean(by.A3.map(to2))[0]) right = right.map(v => -v);
  const scallops = {};
  let scale = 0;
  for (const k of SCALLOPS) {
    const step = Math.max(1, Math.floor(by[k].length / MAX_POINTS));
    const pts = by[k].filter((_, i) => i % step === 0).map(to2);
    for (const q of pts) scale = Math.max(scale, Math.hypot(...q));
    scallops[k] = { pts, c: pts.length ? mean(pts) : null };
  }
  const a = to2(aortic);
  return { center, normal: n, right, up, scale: scale || 1, scallops, aortic: a };
}

/**
 * The imaging plane across the annulus plane, in map coordinates, or null when
 * the two planes are (nearly) parallel.
 * @param {{ origin: number[], normal: number[] }} frame
 */
export function mapCutLine(data, frame) {
  const d = cross(frame.normal, data.normal);
  if (Math.hypot(...d) < 1e-3) return null;
  const dir = norm(d);
  // Closest point to the annulus centre on both planes: move from the centre within the annulus plane.
  const inPlane = norm(cross(data.normal, dir));
  const t = dot(sub(frame.origin, data.center), frame.normal) / (dot(inPlane, frame.normal) || 1e-9);
  const p = data.center.map((c, i) => c + inPlane[i] * t);
  const to2 = v => { const q = sub(v, data.center); return [dot(q, data.right), dot(q, data.up)]; };
  const a = to2(p), u = [dot(dir, data.right), dot(dir, data.up)];
  const r = data.scale * 1.5;
  return [[a[0] - u[0] * r, a[1] - u[1] * r], [a[0] + u[0] * r, a[1] + u[1] * r]];
}

const COLORS = { A1: '#f6b26b', A2: '#ffd966', A3: '#93c47d', P1: '#e69138', P2: '#bf9000', P3: '#6aa84f' };
const TEXT = {
  tr: { title: 'Mitral kapak (LA\'dan bakış) ve kesit', alc: 'ALC', pmc: 'PMC', ao: 'Ao', none: 'Kesit anulus düzlemine paralel' },
  en: { title: 'Mitral valve (view from the LA) and the cut', alc: 'ALC', pmc: 'PMC', ao: 'Ao', none: 'Cut parallel to the annulus plane' }
};

/**
 * Draw the map: scallop clouds (bold label when in the current cut), the aortic
 * valve above, the commissures at the ends and the cut line.
 * @param {HTMLCanvasElement} canvas
 * @param {object} data mitralMapData
 * @param {number[][]|null} line mapCutLine
 * @param {Set<string>} inCut scallops in the current section
 */
export function drawMitralMap(canvas, data, line, inCut, { lang = 'tr', dpr = 1 } = {}) {
  if (!canvas || !data) return;
  const T = TEXT[lang === 'en' ? 'en' : 'tr'];
  const w = canvas.clientWidth || 200, h = canvas.clientHeight || 150;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050807';
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w, h - 22) / (2.6 * data.scale);
  const cx = w / 2, cy = 22 + (h - 22) / 2 + data.scale * s * 0.15;
  const X = q => cx + q[0] * s, Y = q => cy - q[1] * s;
  ctx.font = '600 10px "DM Sans", sans-serif';
  ctx.fillStyle = '#c9d8d0';
  ctx.textAlign = 'left';
  ctx.fillText(T.title, 6, 13);
  // Aortic valve above the anterior leaflet.
  ctx.strokeStyle = '#ea9999'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(X(data.aortic), Math.max(30, Y(data.aortic)), data.scale * s * 0.32, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ea9999'; ctx.textAlign = 'center';
  ctx.fillText(T.ao, X(data.aortic), Math.max(30, Y(data.aortic)) + 4);
  // Scallops.
  for (const [k, { pts, c }] of Object.entries(data.scallops)) {
    if (!c) continue;
    ctx.fillStyle = COLORS[k];
    ctx.globalAlpha = inCut.has(k) ? 0.95 : 0.45;
    for (const q of pts) ctx.fillRect(X(q) - 1.4, Y(q) - 1.4, 2.8, 2.8);
    ctx.globalAlpha = 1;
  }
  for (const [k, { c }] of Object.entries(data.scallops)) {
    if (!c) continue;
    ctx.font = inCut.has(k) ? '700 11px "DM Sans", sans-serif' : '9px "DM Sans", sans-serif';
    ctx.fillStyle = inCut.has(k) ? '#ffffff' : '#9fb3a8';
    ctx.fillText(k, X(c), Y(c) + 4);
  }
  // Commissures beyond the A1/P1 and A3/P3 ends.
  const end = (a, b, side) => {
    const ca = data.scallops[a].c, cb = data.scallops[b].c;
    if (!ca || !cb) return;
    const m = [(ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2], l = Math.hypot(...m) || 1;
    const q = [m[0] / l * data.scale * 1.2, m[1] / l * data.scale * 1.2];
    ctx.font = '600 9px "DM Sans", sans-serif'; ctx.fillStyle = '#76a5af';
    ctx.fillText(side, X(q), Y(q) + 3);
  };
  end('A1', 'P1', T.alc);
  end('A3', 'P3', T.pmc);
  // Cut line.
  if (line) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 18, w, h - 18); ctx.clip();
    ctx.strokeStyle = '#39e8ad'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(X(line[0]), Y(line[0])); ctx.lineTo(X(line[1]), Y(line[1])); ctx.stroke();
    ctx.restore();
  } else {
    ctx.font = '9px "DM Sans", sans-serif'; ctx.fillStyle = '#9fb3a8'; ctx.textAlign = 'left';
    ctx.fillText(T.none, 6, h - 6);
  }
}
