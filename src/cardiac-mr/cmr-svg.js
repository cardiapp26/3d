// String-only SVG helpers shared by the cardiac MR schematics (no DOM).

const f = n => Math.round(n * 10) / 10;
export const pt = p => `${f(p.x)} ${f(p.y)}`;

export function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Closed (or open) Catmull-Rom spline through image points, as an SVG path. */
export function smoothPath(points, closed = true) {
  const n = points.length;
  if (n < 3) return `M${points.map(pt).join('L')}`;
  const get = i => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(points[0])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const p0 = get(i - 1); const p1 = get(i); const p2 = get(i + 1); const p3 = get(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? `${d}Z` : d;
}

export const polyPath = (points, closed = true) => `M${points.map(pt).join('L')}${closed ? 'Z' : ''}`;

export const line = (a, b, cls, extra = '') => `<line class="${cls}" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"${extra}/>`;

export const circle = (c, r, cls, extra = '') => `<circle class="${cls}" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(r)}"${extra}/>`;

export function text(p, value, cls = 'cmr-t', anchor = 'middle', extra = '') {
  return `<text class="${cls}" x="${f(p.x)}" y="${f(p.y)}" text-anchor="${anchor}"${extra}>${escapeText(value)}</text>`;
}

/** Where a leader from `target` meets the label's approximate text box. */
function leaderEnd(target, at, lines, anchor) {
  const halfW = Math.max(...lines.map(l => l.length)) * 2.9 + 3;
  const halfH = lines.length * 5.5 + 2;
  const cx = anchor === 'start' ? at.x + halfW - 3 : anchor === 'end' ? at.x - halfW + 3 : at.x;
  const cy = at.y;
  const dx = target.x - cx;
  const dy = target.y - cy;
  const k = Math.min(Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity, Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity, 1);
  return { x: cx + dx * k, y: cy + dy * k };
}

/**
 * Labelled structure: optional leader from `target` to the label point.
 * Lines in `value` split on "\n".
 */
export function label(id, value, at, { target = null, anchor = 'middle', cls = '' } = {}) {
  const lines = String(value).split('\n');
  const leader = target ? `${line(target, leaderEnd(target, at, lines, anchor), 'cmr-leader')}${circle(target, 1.8, 'cmr-leader-dot')}` : '';
  const dy = lines.length > 1 ? -5.5 * (lines.length - 1) : 0;
  const tspans = lines.map((ln, i) => `<tspan x="${f(at.x)}" dy="${i === 0 ? dy + 3.5 : 11}">${escapeText(ln)}</tspan>`).join('');
  return `<g class="cmr-label ${cls}" data-cmr-label="${id}">${leader}<text class="cmr-label-text" x="${f(at.x)}" y="${f(at.y)}" text-anchor="${anchor}">${tspans}</text></g>`;
}

/** Annular sector between radii r1..r2 from theta a to b (degrees, clockwise from up). */
export function sectorPath(c, r1, r2, a, b) {
  const p = (t, r) => { const rad = t * Math.PI / 180; return { x: c.x + r * Math.sin(rad), y: c.y - r * Math.cos(rad) }; };
  const large = (b - a) % 360 > 180 ? 1 : 0;
  const o1 = p(a, r2); const o2 = p(b, r2); const i2 = p(b, r1); const i1 = p(a, r1);
  return `M${pt(o1)}A${f(r2)} ${f(r2)} 0 ${large} 1 ${pt(o2)}L${pt(i2)}A${f(r1)} ${f(r1)} 0 ${large} 0 ${pt(i1)}Z`;
}

export const svgOpen = (viewBox, attrs = '') => `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" ${attrs}>`;
