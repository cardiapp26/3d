// Schematic overlay paths on the echo sector (echo-renderer.js): polylines in
// image coordinates, e.g. the transseptal needle and the septal tenting of
// echo-transseptal.js. Drawn clipped to the fan, without labels (the panel
// text names them; the near field is too crowded).

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ toScreen: Function }} geo sector geometry
 * @param {{ points: number[][], color?: string, width?: number, dashed?: boolean, tip?: boolean }[]} paths
 * @param {() => void} clipPath traces the fan outline (for clipping)
 */
export function drawPaths(ctx, geo, paths, clipPath) {
  const list = Array.isArray(paths) ? paths.filter((p) => Array.isArray(p?.points) && p.points.length >= 2) : [];
  if (!list.length) return;
  ctx.save();
  clipPath();
  ctx.clip();
  for (const p of list) {
    ctx.strokeStyle = p.color || '#ffd966';
    ctx.lineWidth = p.width || 2.5;
    ctx.setLineDash(p.dashed ? [5, 4] : []);
    ctx.beginPath();
    p.points.forEach((pt, i) => { const [x, y] = geo.toScreen(pt); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
    if (p.tip) {
      const [x, y] = geo.toScreen(p.points[p.points.length - 1]);
      ctx.setLineDash([]);
      ctx.fillStyle = p.color || '#ffd966';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}
