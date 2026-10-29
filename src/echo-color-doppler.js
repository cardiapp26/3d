import { CM_PER_UNIT } from './echo-image-summary.js';

/*
 * Schematic colour Doppler on the echo image (teaching overlay, not a flow
 * simulation). The jet starts at the centre of the valve's cut and points at
 * the receiving chamber's cut; colour follows the flow direction relative to
 * the transducer (toward: red, away: blue, BART), a turbulent jet is drawn as
 * a variance mosaic, and a regurgitant or stenotic orifice can show the
 * proximal flow convergence (PISA shells with the aliasing boundary). The
 * colour box frames the valve and the scale bar gives the Nyquist limit.
 */

const TAU = Math.PI * 2;
const MOSAIC = ['#ffe14d', '#3be8ff', '#7cff6b', '#ff3b3b', '#2f6bff', '#ffffff', '#ff9f1c'];

const centroid = pts => {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return pts.length ? [x / pts.length, y / pts.length] : null;
};
const pointsOf = (contours, id) => contours.filter(c => c.id === id).flatMap(c => c.points);

/** Convex hull (monotone chain) of 2D points. */
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Seeded random for a stable mosaic within one frame. */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * Jet geometry in image units (section coordinates: x lateral, y depth), or null
 * when the valve or the receiving chamber is not in the cut.
 */
export function jetGeometry(contours, jet) {
  const valve = pointsOf(contours, jet.valve);
  const target = pointsOf(contours, jet.to);
  if (valve.length < 2 || target.length < 3) return null;
  // Orifice centre: the annulus cut (hinge points) when it is in the plane, else the valve's cut.
  const ring = jet.originId ? pointsOf(contours, jet.originId) : [];
  const v = centroid(ring.length >= 2 ? ring : valve), t = centroid(target);
  let span = 0;
  for (const p of valve) span = Math.max(span, Math.hypot(p[0] - v[0], p[1] - v[1]));
  // Antegrade jets leave along the inflow axis (source chamber through the valve: the LVOT
  // for aortic stenosis), regurgitant jets point into the receiving chamber.
  const src = jet.from ? centroid(pointsOf(contours, jet.from)) : null;
  let dx = t[0] - v[0], dy = t[1] - v[1];
  if (jet.antegrade && src) { dx = v[0] - src[0]; dy = v[1] - src[1]; }
  const len = Math.hypot(t[0] - v[0], t[1] - v[1]) || 1;
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl; dy /= dl;
  let e = jet.eccentric || 0;
  // An eccentric jet turns toward a landmark when it is in the cut (flail posterior leaflet:
  // anteriorly directed, toward the aortic root); otherwise the sign is kept.
  const towardIds = [].concat(jet.towardId || []);
  const toward = towardIds.map(id => centroid(pointsOf(contours, id))).find(Boolean) || null;
  if (e && toward) {
    const side = dx * (toward[1] - v[1]) - dy * (toward[0] - v[0]);
    e = Math.abs(e) * (side >= 0 ? 1 : -1);
  }
  const ux = dx * Math.cos(e) - dy * Math.sin(e), uy = dx * Math.sin(e) + dy * Math.cos(e);
  // Reach: the receiving chamber's far side along the jet (farthest projection of its cut).
  let reach = 0;
  for (const p of target) reach = Math.max(reach, (p[0] - v[0]) * ux + (p[1] - v[1]) * uy);
  return { origin: v, dir: [ux, uy], orifice: Math.max(span * 2, 0.05), reach: Math.max(reach, len), chamber: hull([...target, v]) };
}

/**
 * Draw the overlay on the echo canvas (CSS pixel transform already set).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ toScreen: (p: number[]) => number[], scale: number, apex: number[], radius: number }} geo
 * @param {object[]} contours section contours
 * @param {{ valve: string, to: string, strength: number, widthFrac: number, lengthFrac: number,
 *   eccentric?: number, towardId?: string, mosaic?: boolean, pisaCm?: number, aliasingCms?: number, label?: string }} jet
 *   strength 0..1 is the jet's phase envelope (0 hides it).
 * @param {{ time?: number, clip?: () => void, lang?: string }} opts
 */
export function drawColorJet(ctx, geo, contours, jet, opts = {}) {
  const g = jetGeometry(contours, jet);
  if (!g) return null;
  const [ox, oy] = geo.toScreen(g.origin);
  const pxPerUnit = geo.scale;
  const dirX = g.dir[0], dirY = g.dir[1];
  // Screen direction (toScreen is affine: lateral right, depth down).
  const [tx, ty] = geo.toScreen([g.origin[0] + dirX, g.origin[1] + dirY]);
  let sx = tx - ox, sy = ty - oy;
  const sl = Math.hypot(sx, sy) || 1;
  sx /= sl; sy /= sl;
  const nx = -sy, ny = sx;
  // Flow toward the transducer (up the fan, toward the apex of the sector) is red.
  const toApexX = geo.apex[0] - ox, toApexY = geo.apex[1] - oy;
  const toward = sx * toApexX + sy * toApexY > 0;
  const strength = Math.max(0, Math.min(1, jet.strength));
  ctx.save();
  opts.clip?.();
  ctx.clip();
  // Colour box around the valve and the jet.
  const boxR = Math.max(g.orifice, g.reach * 0.9) * pxPerUnit;
  ctx.strokeStyle = 'rgba(220,230,240,0.55)';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1;
  ctx.strokeRect(ox - boxR * 0.75, oy - boxR * 0.75, boxR * 1.5, boxR * 1.5);
  ctx.setLineDash([]);
  if (strength > 0.02) {
    // Vena contracta: the measured width when given (mm), else a fraction of the orifice.
    const vc = Math.max(3, jet.vcMm ? (jet.vcMm / 10 / CM_PER_UNIT) * pxPerUnit : g.orifice * pxPerUnit * (jet.widthFrac || 0.3) * 0.6);
    const length = g.reach * pxPerUnit * (jet.lengthFrac || 0.6) * (0.55 + 0.45 * strength);
    const spread = 0.17;
    // Jet body: from the vena contracta widening into the chamber, rounded tip.
    ctx.beginPath();
    ctx.moveTo(ox + nx * vc / 2, oy + ny * vc / 2);
    const endW = vc / 2 + length * Math.tan(spread);
    const ex = ox + sx * length, ey = oy + sy * length;
    ctx.lineTo(ex + nx * endW, ey + ny * endW);
    ctx.quadraticCurveTo(ex + sx * endW * 1.1, ey + sy * endW * 1.1, ex - nx * endW, ey - ny * endW);
    ctx.lineTo(ox - nx * vc / 2, oy - ny * vc / 2);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    // The jet stays inside the receiving chamber's cut (convex hull of its contour).
    if (g.chamber.length >= 3) {
      ctx.beginPath();
      g.chamber.forEach((q, i) => { const [x, y] = geo.toScreen(q); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
      ctx.clip();
    }
    if (jet.mosaic) {
      const rand = rng(Math.floor((opts.time || 0) / 60));
      const cell = Math.max(3, pxPerUnit * 0.05);
      const minX = Math.min(ox, ex) - endW, maxX = Math.max(ox, ex) + endW;
      const minY = Math.min(oy, ey) - endW, maxY = Math.max(oy, ey) + endW;
      ctx.globalAlpha = 0.85 * (0.4 + 0.6 * strength);
      for (let y = minY; y < maxY; y += cell) {
        for (let x = minX; x < maxX; x += cell) {
          ctx.fillStyle = MOSAIC[Math.floor(rand() * MOSAIC.length)];
          ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
        }
      }
    } else {
      const grad = ctx.createLinearGradient(ox, oy, ex, ey);
      const [c0, c1] = toward ? ['rgba(255,214,90,0.9)', 'rgba(200,24,24,0.7)'] : ['rgba(120,230,255,0.9)', 'rgba(24,60,220,0.7)'];
      grad.addColorStop(0, c0);
      grad.addColorStop(1, c1);
      ctx.globalAlpha = 0.45 + 0.5 * strength;
      ctx.fillStyle = grad;
      ctx.fillRect(Math.min(ox, ex) - endW, Math.min(oy, ey) - endW, Math.abs(ex - ox) + 2 * endW, Math.abs(ey - oy) + 2 * endW);
    }
    ctx.restore();
    // Proximal flow convergence (PISA) on the upstream side.
    // Stenosis without a measured shell: flow acceleration just upstream of the valve.
    const shellCm = jet.pisaCm > 0 ? jet.pisaCm : jet.kind === 'stenosis' ? 0.45 : 0;
    if (shellCm > 0) {
      const r = (shellCm / CM_PER_UNIT) * pxPerUnit;
      const back = Math.atan2(-sy, -sx);
      ctx.globalAlpha = 0.8 * strength;
      for (let k = 3; k >= 1; k--) {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.arc(ox, oy, ((r * k) / 3) * 1.15, back - Math.PI / 2, back + Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = k === 3 ? (toward ? 'rgba(40,90,230,0.75)' : 'rgba(210,40,40,0.75)') : k === 2 ? 'rgba(255,225,80,0.8)' : (toward ? 'rgba(220,40,40,0.85)' : 'rgba(40,120,240,0.85)');
        ctx.fill();
      }
      // PISA radius caliper to the aliasing boundary.
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      const ax = ox + Math.cos(back) * r * 1.07, ay = oy + Math.sin(back) * r * 1.07;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
  }
  ctx.restore();
  // Colour scale bar with the Nyquist limit (top left of the canvas).
  const v = jet.aliasingCms || 60;
  const bx = 10, by = 40, bh = 70;
  const bar = ctx.createLinearGradient(0, by, 0, by + bh);
  bar.addColorStop(0, '#ffe14d');
  bar.addColorStop(0.35, '#c81818');
  bar.addColorStop(0.5, '#000000');
  bar.addColorStop(0.65, '#183cdc');
  bar.addColorStop(1, '#78e6ff');
  ctx.fillStyle = bar;
  ctx.fillRect(bx, by, 8, bh);
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`+${v}`, bx + 12, by + 8);
  ctx.fillText(`-${v}`, bx + 12, by + bh);
  ctx.fillText('cm/s', bx + 12, by + bh / 2 + 3);
  if (jet.label) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(jet.label, bx, by + bh + 16);
  }
  return g;
}
