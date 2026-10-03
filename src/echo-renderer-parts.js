// Parts of the sectioned structures on the echo sector (echo-renderer.js):
// LV segments and valve leaflets carried by each contour point
// (echo-section.js). Each part is stroked in its colour on top of the
// structure contour; the longest visible run of a part anchors its label and
// the visible parts are reported to the panel.
const MIN_PART_RUN = 0.08;    // a part shorter than this in the fan is not listed or labelled

function runLength(run) {
  let length = 0;
  for (let i = 1; i < run.length; i++) length += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
  return length;
}

/**
 * Pieces of a contour with one part each: consecutive segments whose first
 * point has the same part; unlabelled stretches (chordae) are skipped.
 */
export function partPieces(contour) {
  const parts = contour?.parts, pts = contour?.points;
  if (!Array.isArray(parts) || !Array.isArray(pts) || pts.length < 2) return [];
  const list = contour.closed ? [...pts, pts[0]] : pts;
  const of = contour.closed ? [...parts, parts[0]] : parts;
  const pieces = [];
  let cur = null;
  for (let i = 0; i + 1 < list.length; i++) {
    const part = of[i];
    if (!part) { cur = null; continue; }
    if (!cur || cur.part.key !== part.key) { cur = { part, points: [list[i]] }; pieces.push(cur); }
    cur.points.push(list[i + 1]);
  }
  return pieces;
}

/**
 * Stroke the parts (not in the grey style) and return, per structure and
 * part, the longest visible run and the total visible length.
 * @param {(points: number[][]) => number[][][]} clip runs of a polyline inside the fan
 * @returns {{ id: string, part: object, run: number[][], total: number }[]}
 */
export function drawParts(ctx, geo, contours, clip, style) {
  const best = new Map();
  ctx.lineCap = 'butt';
  for (const c of contours) for (const piece of partPieces(c)) {
    for (const run of clip(piece.points)) {
      const length = runLength(run);
      if (style !== 'gray') {
        ctx.strokeStyle = piece.part.color || '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        run.forEach((p, i) => { const [x, y] = geo.toScreen(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
      const key = `${c.id}|${piece.part.key}`;
      const entry = best.get(key) || { id: c.id, part: piece.part, run, longest: 0, total: 0 };
      if (length > entry.longest) { entry.run = run; entry.longest = length; }
      entry.total += length;
      best.set(key, entry);
    }
  }
  ctx.lineCap = 'round';
  return [...best.values()].filter((b) => b.total >= MIN_PART_RUN);
}
