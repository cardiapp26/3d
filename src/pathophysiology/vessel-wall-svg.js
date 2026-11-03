// SVG markup for the vessel wall mechanics lab. Pure functions of the current frame state; the lab
// re-renders them every animation frame. Static text only (no user input reaches the markup).

const f = n => n.toFixed(1);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const VW_COLORS = Object.freeze({
  lumen: '#f8d4d4', wall: '#b84a4a', wallHigh: '#6f1414', intima: '#e9a3a3', endothelium: '#f4c430',
  media: '#b84a4a', adventitia: '#7f1d1d', stress: '#f08a00', pressure: '#dc2626', external: '#c026d3',
  radius: '#2f7d32', thickness: '#2563eb', velocity: '#22a447', shear: '#f5b400', ink: '#3b1d1d'
});
const C = VW_COLORS;

function hexMix(a, b, t) {
  const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join('')}`;
}

/** Wall colour darkens with hoop stress (kPa). */
export function stressColor(hoop) {
  return hexMix('d98a8a', C.wallHigh.slice(1), hoop / 260);
}

function defs(id) {
  const m = (key, color) => `<marker id="${id}-${key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${color}"/></marker>`;
  return `<defs>${m('o', C.stress)}${m('r', C.pressure)}${m('m', C.external)}${m('g', C.velocity)}${m('y', C.shear)}</defs>`;
}

const arrow = (id, key, x1, y1, x2, y2, color, width, both = false, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${f(width)}" stroke-linecap="round" marker-end="url(#${id}-${key})"${both ? ` marker-start="url(#${id}-${key})"` : ''}${extra}/>`;

const label = (x, y, text, color, anchor = 'middle', cls = '') =>
  `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" fill="${color}" class="vw-label ${cls}">${text}</text>`;

/** Front half of a ring (ellipse) as a double-headed arrow: the hoop stress. */
function hoopArc(id, cx, cy, rx, ry, width) {
  return `<path d="M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy)}" fill="none" stroke="${C.stress}" stroke-width="${f(width)}" stroke-linecap="round" marker-start="url(#${id}-o)" marker-end="url(#${id}-o)" data-vw-hoop/>`;
}

/**
 * A: straight cylindrical segment. s = { pNow, pExt, r, h, hoop, axial, pulse }, t = text labels.
 */
export function laplaceSvg(s, t) {
  const id = 'vwA', cx = 160, top = 72, bottom = 288;
  const rl = (16 + s.r * 2.6) * (1 + 0.045 * s.pulse), hw = 4 + s.h * 5, ro = rl + hw, rm = rl + hw / 2;
  const heat = stressColor(s.hoop), ry = 15;
  const out = [defs(id)];
  out.push(`<rect x="${f(cx - rl)}" y="${top}" width="${f(2 * rl)}" height="${bottom - top}" fill="${C.lumen}"/>`);
  out.push(`<rect x="${f(cx - ro)}" y="${top}" width="${f(hw)}" height="${bottom - top}" fill="${heat}" data-vw-wall/>`);
  out.push(`<rect x="${f(cx + rl)}" y="${top}" width="${f(hw)}" height="${bottom - top}" fill="${heat}"/>`);
  out.push(`<line x1="${f(cx - rl)}" y1="${top}" x2="${f(cx - rl)}" y2="${bottom}" stroke="${C.endothelium}" stroke-width="2"/><line x1="${f(cx + rl)}" y1="${top}" x2="${f(cx + rl)}" y2="${bottom}" stroke="${C.endothelium}" stroke-width="2"/>`);
  out.push(`<ellipse cx="${cx}" cy="${top}" rx="${f(ro)}" ry="${ry}" fill="${heat}"/><ellipse cx="${cx}" cy="${top}" rx="${f(rl)}" ry="${f(ry * rl / ro)}" fill="${C.lumen}" stroke="${C.endothelium}" stroke-width="1.5"/>`);
  out.push(hoopArc(id, cx, top, rm, ry * rm / ro, clamp(1.6 + s.hoop / 32, 1.6, 9)));
  out.push(label(cx + ro + 4, top - 22, 'σc', C.stress, 'start', 'vw-strong'));
  // Radius and wall thickness
  out.push(`<line x1="${cx}" y1="${top + 30}" x2="${f(cx + rl)}" y2="${top + 30}" stroke="${C.radius}" stroke-width="2.4"/>${label(cx + rl / 2, top + 25, 'r', C.radius)}`);
  out.push(`<line x1="${f(cx + rl)}" y1="${top + 62}" x2="${f(cx + ro)}" y2="${top + 62}" stroke="${C.thickness}" stroke-width="3"/>${label(cx + ro + 5, top + 66, 'h', C.thickness, 'start')}`);
  // Internal pressure pushes the wall outward
  const pw = clamp(1.4 + s.pNow / 45, 1.4, 6);
  for (const y of [150, 228]) out.push(arrow(id, 'r', cx - rl + 9, y, cx + rl - 9, y, C.pressure, pw, true, ' data-vw-pint'));
  out.push(label(cx, 143, `P<tspan class="vw-sub">int</tspan> ${Math.round(s.pNow)}`, C.pressure));
  // Radial stress across the wall
  out.push(arrow(id, 'o', cx + rl + 1, 190, cx + ro + 14, 190, C.stress, 2.6));
  out.push(label(cx + ro + 16, 194, 'σr', C.stress, 'start', 'vw-strong'));
  // Longitudinal (axial) stress along the wall
  const ax = cx - rl - hw / 2;
  out.push(arrow(id, 'o', ax, 112, ax, 206, C.stress, clamp(1.4 + s.axial / 32, 1.4, 7), true));
  out.push(label(cx - ro - 6, 160, 'σL', C.stress, 'end', 'vw-strong'));
  // External pressure pushes inward
  if (s.pExt > 0.5) {
    const len = 6 + s.pExt * 0.8;
    for (const y of [246, 258, 270]) {
      out.push(arrow(id, 'm', cx - ro - 6 - len, y, cx - ro - 3, y, C.external, 2.2));
      out.push(arrow(id, 'm', cx + ro + 6 + len, y, cx + ro + 3, y, C.external, 2.2));
    }
    out.push(label(cx - ro - 8, 238, `P<tspan class="vw-sub">ext</tspan>`, C.external, 'end'));
  }
  out.push(label(12, 24, `${t.now}: σc ${Math.round(s.hoopNow)} kPa`, C.ink, 'start', 'vw-strong'));
  return out.join('');
}

/** Half-width of the aortic root and ascending aorta at height y (cosine-eased key points). */
function aortaHalfWidth(y, w, a) {
  const keys = [[288, a], [228, w * 1.12], [176, w * 0.9], [128, w], [40, w]];
  for (let i = 0; i < keys.length - 1; i++) {
    const [y0, x0] = keys[i], [y1, x1] = keys[i + 1];
    if (y <= y0 && y >= y1) {
      const u = (y0 - y) / (y0 - y1);
      return x0 + (x1 - x0) * (1 - Math.cos(u * Math.PI)) / 2;
    }
  }
  return w;
}

function aortaOutline(cx, w, a, off) {
  const ys = [];
  for (let y = 40; y <= 288; y += 6) ys.push(y);
  const right = ys.map(y => `${f(cx + aortaHalfWidth(y, w, a) + off)},${y}`);
  const left = ys.slice().reverse().map(y => `${f(cx - aortaHalfWidth(y, w, a) - off)},${y}`);
  return [...right, ...left].join(' ');
}

/**
 * B: aortic root and ascending aorta. s = { diameter, wall, hoop, hoopNow, ratio, pulse }.
 */
export function aortaSvg(s, t) {
  const id = 'vwB', cx = 160;
  const w = s.diameter * 1.75 * (1 + 0.035 * s.pulse), a = 40 + Math.max(0, w - 56) * 0.3, hw = s.wall * 6 + 2;
  const heat = stressColor(s.hoop);
  const out = [defs(id)];
  out.push(`<polygon points="${aortaOutline(cx, w, a, hw)}" fill="${heat}" data-vw-aorta-wall/>`);
  out.push(`<polygon points="${aortaOutline(cx, w, a, 0)}" fill="${C.lumen}" stroke="${C.endothelium}" stroke-width="1.6"/>`);
  out.push(`<ellipse cx="${cx}" cy="40" rx="${f(w + hw)}" ry="12" fill="${heat}"/><ellipse cx="${cx}" cy="40" rx="${f(w)}" ry="${f(12 * w / (w + hw))}" fill="${C.lumen}" stroke="${C.endothelium}" stroke-width="1.4"/>`);
  out.push(hoopArc(id, cx, 112, w + hw / 2, 11, clamp(1.6 + s.hoop / 32, 1.6, 9)));
  out.push(label(cx + w + hw + 4, 100, 'σc', C.stress, 'start', 'vw-strong'));
  out.push(`<line x1="${f(cx - w)}" y1="66" x2="${f(cx + w)}" y2="66" stroke="${C.radius}" stroke-width="2.2"/>${label(cx, 60, `d ${Math.round(s.diameter)} mm`, C.radius)}`);
  const pw = clamp(1.4 + s.pNow / 45, 1.4, 6);
  for (const y of [152, 232]) {
    const half = aortaHalfWidth(y, w, a) - 9;
    out.push(arrow(id, 'r', cx - half, y, cx + half, y, C.pressure, pw, true));
  }
  out.push(label(cx, 146, `P<tspan class="vw-sub">int</tspan>`, C.pressure));
  out.push(label(cx, 280, t.lvot, C.ink));
  out.push(label(cx - aortaHalfWidth(214, w, a) - hw - 4, 214, t.sinus, C.ink, 'end', 'vw-small'));
  out.push(label(12, 24, `${t.now}: σc ${Math.round(s.hoopNow)} kPa · ×${s.ratio.toFixed(1)}`, C.ink, 'start', 'vw-strong'));
  return out.join('');
}

export const SHEAR_GEOMETRY = Object.freeze({ width: 360, cy: 130, x0: 104 });

/** Lumen half-height in px for a diameter in mm (log scale so 1-30 mm all fit). */
export function lumenHalf(diameter) {
  return clamp(22 + 12 * Math.log2(Math.max(1, diameter)), 22, 76);
}

/**
 * C: straight segment with wall layers, parabolic profile, moving cells and wall shear.
 * s = { diameter, factor, tauNow, zone, particles: [{x, rho}] }.
 */
export function shearSvg(s, t) {
  const id = 'vwC', { width, cy, x0 } = SHEAR_GEOMETRY, R = lumenHalf(s.diameter);
  const out = [defs(id)];
  out.push(`<rect x="0" y="${f(cy - R)}" width="${width}" height="${f(2 * R)}" fill="#fdeaea"/>`);
  for (const sign of [-1, 1]) {
    const edge = cy + sign * R, band = (from, h, fill, data = '') =>
      `<rect x="0" y="${f(sign < 0 ? edge - from - h : edge + from)}" width="${width}" height="${h}" fill="${fill}"${data}/>`;
    out.push(band(0, 2.5, C.endothelium), band(2.5, 4, C.intima), band(6.5, 12, C.media), band(18.5, 9, C.adventitia));
  }
  // Endothelial cells: elongated and aligned under laminar high shear, cobblestone when low/oscillatory.
  const aligned = s.zone === 'protective' || s.zone === 'high';
  for (let i = 0; i < 16; i++) {
    const x = 12 + i * 22.5, rot = aligned ? 0 : ((i * 37) % 60) - 30;
    for (const sign of [-1, 1]) {
      const y = cy + sign * (R - 1.5);
      out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${aligned ? 9 : 4.6}" ry="${aligned ? 2.1 : 3.4}" transform="rotate(${rot} ${f(x)} ${f(y)})" fill="${C.endothelium}" stroke="#a16207" stroke-width="0.7" data-vw-ec/>`);
    }
  }
  // Velocity profile (parabolic, scaled to the vessel) with its envelope.
  const tips = [];
  for (let k = -6; k <= 6; k++) {
    const rho = k / 7, y = cy + rho * (R - 8), len = 2 * (1 - rho * rho) * s.factor * 44;
    tips.push(`${f(x0 + len)},${f(y)}`);
    if (Math.abs(len) > 4) out.push(arrow(id, 'g', x0, y, x0 + len, y, C.velocity, 1.8, false, ' stroke-dasharray="5 3"'));
  }
  out.push(`<polyline points="${tips.join(' ')}" fill="none" stroke="${C.velocity}" stroke-width="1.6" opacity="0.8"/>`);
  out.push(`<line x1="${x0}" y1="${f(cy - R + 6)}" x2="${x0}" y2="${f(cy + R - 6)}" stroke="${C.velocity}" stroke-width="1" opacity="0.6"/>`);
  out.push(label(x0 + 2 * Math.abs(s.factor) * 44 + 8, cy - 4, 'V<tspan class="vw-sub">m</tspan>', C.velocity, 'start', 'vw-strong'));
  for (const p of s.particles) {
    out.push(`<ellipse class="vw-rbc" cx="${f(p.x)}" cy="${f(cy + p.rho * (R - 7))}" rx="4.4" ry="2.9" fill="${C.pressure}" stroke="#fff" stroke-width="0.8"/>`);
  }
  // Wall shear arrows on both walls (direction follows the near-wall flow).
  const len = clamp(10 + Math.abs(s.tauNow) * 5, 10, 76) * Math.sign(s.tauNow || 1);
  for (const sign of [-1, 1]) {
    const y = cy + sign * (R - 7);
    out.push(arrow(id, 'y', 262 - len / 2, y, 262 + len / 2, y, C.shear, 3.2, false, ' data-vw-tau'));
  }
  out.push(label(262, cy - R + 20, 'τ<tspan class="vw-sub">w</tspan>', '#a16207', 'middle', 'vw-strong'));
  out.push(label(12, 18, `${t.now}: τw ${s.tauNow.toFixed(2)} Pa`, C.ink, 'start', 'vw-strong'));
  return out.join('');
}
