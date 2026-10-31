// Particle anatomy drawings of the lipoprotein traffic lab: a cross-section of one class (core of
// triglyceride and cholesteryl ester, a phospholipid monolayer with free cholesterol, the
// apolipoproteins on the surface) and the six classes side by side at true relative size.
// Pure functions returning SVG markup from the static data (no user input reaches the markup).
import { LIPOPROTEINS, LIPID_COMPONENTS, APOLIPOPROTEINS, PARTICLE_ANATOMY } from './lipoprotein-traffic-data.js';

const SECTION = Object.freeze({ size: 260, cx: 130, cy: 130, r: 92 });
const MONOLAYER_NM = 2;            // phospholipid monolayer thickness
const STRIP = Object.freeze({ nmPx: 1, slot: 76, gap: 10, base: 228, top: 14, height: 262 });
const color = (list, id) => list.find(item => item.id === id).color;
const deg = a => (a * Math.PI) / 180;
const point = (angle, r) => [SECTION.cx + r * Math.cos(deg(angle - 90)), SECTION.cy + r * Math.sin(deg(angle - 90))];
const f = n => n.toFixed(1);

/** SVG arc path along the particle surface from angle a to b (degrees, clockwise from 12 o'clock). */
function arcPath(a, b, r) {
  const [x0, y0] = point(a, r), [x1, y1] = point(b, r);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
}

/** Share of the radius taken by the core: the 2 nm monolayer is thin on a chylomicron, thick on HDL. */
export function coreFraction(diameter) {
  return Math.min(0.93, Math.max(0.5, 1 - MONOLAYER_NM / (diameter / 2)));
}

/** Core: triglyceride and cholesteryl ester in proportion (CE as a sector of the core). */
function core(anatomy, rCore) {
  const { tg, ce } = anatomy.composition;
  const ceShare = ce / (tg + ce);
  const out = [`<circle cx="${SECTION.cx}" cy="${SECTION.cy}" r="${f(rCore)}" fill="${color(LIPID_COMPONENTS, 'tg')}" data-lpp-part="tg"/>`];
  if (ceShare >= 0.999) out.push(`<circle cx="${SECTION.cx}" cy="${SECTION.cy}" r="${f(rCore)}" fill="${color(LIPID_COMPONENTS, 'ce')}" data-lpp-part="ce"/>`);
  else if (ceShare > 0.01) {
    const a = 360 * ceShare, [x0, y0] = point(0, rCore), [x1, y1] = point(a, rCore);
    out.push(`<path d="M${SECTION.cx} ${SECTION.cy}L${f(x0)} ${f(y0)}A${f(rCore)} ${f(rCore)} 0 ${a > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}Z" fill="${color(LIPID_COMPONENTS, 'ce')}" data-lpp-part="ce"/>`);
  }
  return out.join('');
}

/** Monolayer: phospholipid heads round the edge, free cholesterol between them. */
function monolayer(anatomy, rCore) {
  const r = SECTION.r, heads = 44, mid = (r + rCore) / 2;
  const out = [`<circle cx="${SECTION.cx}" cy="${SECTION.cy}" r="${f(mid)}" fill="none" stroke="#d6eafa" stroke-width="${f(r - rCore)}"/>`];
  for (let i = 0; i < heads; i++) {
    const [x, y] = point((360 * i) / heads, r - 3);
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="${color(LIPID_COMPONENTS, 'pl')}" data-lpp-part="pl"/>`);
  }
  const fc = Math.max(2, Math.round(anatomy.composition.fc * 1.2));
  for (let i = 0; i < fc; i++) {
    const a = (360 * (i + 0.5)) / fc + 3;
    const [x0, y0] = point(a, rCore + 2), [x1, y1] = point(a, r - 7);
    out.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${color(LIPID_COMPONENTS, 'fc')}" stroke-width="2.6" stroke-linecap="round" data-lpp-part="fc"/>`);
  }
  return out.join('');
}

/** Apolipoproteins on the surface: apoB as a long ribbon, apoA-I as belts, the small apos as knobs. */
function apos(anatomy) {
  const r = SECTION.r + 4, out = [];
  const has = id => anatomy.apos.find(([apo]) => apo === id)?.[1] ?? 0;
  const ribbon = (id, a, b, width) => out.push(`<path d="${arcPath(a, b, r)}" fill="none" stroke="${color(APOLIPOPROTEINS, id)}" stroke-width="${width}" stroke-linecap="round" data-lpp-apo="${id}"/>`);
  if (has('apoB100')) ribbon('apoB100', 200, 400, 9);              // wraps more than half the particle
  if (has('apoB48')) ribbon('apoB48', 250, 346, 9);                // 48% of the same protein
  for (let i = 0; i < has('apoA1'); i++) ribbon('apoA1', 20 + i * 120, 95 + i * 120, 7);
  for (let i = 0; i < has('apoA2'); i++) ribbon('apoA2', 100 + i * 120, 128 + i * 120, 6);
  const knobs = (id, n, start, step) => {
    for (let i = 0; i < n; i++) {
      const [x, y] = point(start + i * step, r + 2);
      out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="5" transform="rotate(${start + i * step} ${f(x)} ${f(y)})" fill="${color(APOLIPOPROTEINS, id)}" stroke="#fff" stroke-width="1.2" data-lpp-apo="${id}"/>`);
    }
  };
  knobs('apoC', has('apoC'), 30, 34);
  knobs('apoE', has('apoE'), 160, 20);
  if (has('apoa')) {
    // apo(a): a chain of kringles leaving the apoB ribbon at one disulfide bond, curled round the particle.
    const [sx, sy] = point(300, r);
    const beads = [];
    for (let i = 0; i < 9; i++) beads.push(point(306 + i * 12, r + 20 + (i % 2) * 4));
    out.push(`<polyline points="${[[sx, sy], ...beads].map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" fill="none" stroke="${color(APOLIPOPROTEINS, 'apoa')}" stroke-width="2"/>`);
    for (const [x, y] of beads) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${color(APOLIPOPROTEINS, 'apoa')}" stroke="#fff" stroke-width="1.2" data-lpp-apo="apoa"/>`);
    out.push(`<text x="${f(sx + 6)}" y="${f(sy - 4)}" class="lpp-ss">S-S</text>`);
  }
  return out.join('');
}

/** Cross-section of one class (not to scale between classes; see sizeStrip). */
export function particleSection(id, { title = '' } = {}) {
  const anatomy = PARTICLE_ANATOMY[id];
  const rCore = SECTION.r * coreFraction(anatomy.diameter);
  return `<svg viewBox="0 0 ${SECTION.size} ${SECTION.size}" role="img" data-lpp-section="${id}"><title>${title}</title>`
    + monolayer(anatomy, rCore) + core(anatomy, rCore) + apos(anatomy) + '</svg>';
}

/** Stacked composition bar (approximate weight %). */
export function compositionBar(id) {
  const comp = PARTICLE_ANATOMY[id].composition;
  const total = Object.values(comp).reduce((a, b) => a + b, 0);
  let x = 0;
  const parts = LIPID_COMPONENTS.map(({ id: key, color: fill }) => {
    const w = (100 * comp[key]) / total, rect = `<rect x="${f(x)}" y="0" width="${f(w)}" height="14" fill="${fill}" data-lpp-bar="${key}"/>`;
    x += w;
    return rect;
  });
  return `<svg viewBox="0 0 100 14" preserveAspectRatio="none" class="lpp-bar" aria-hidden="true">${parts.join('')}</svg>`;
}

/**
 * The six classes side by side at true relative size (1 px per nm at the typical diameter), the
 * selected one outlined, with a 50 nm scale bar.
 */
export function sizeStrip(selected, { name = (item) => item.id, title = '', scale = '50 nm' } = {}) {
  let x = 10;
  const items = LIPOPROTEINS.map((item) => {
    const a = PARTICLE_ANATOMY[item.id], d = a.diameter * STRIP.nmPx, w = Math.max(d, STRIP.slot), cx = x + w / 2;
    x += w + STRIP.gap;
    const cy = STRIP.base - 34 - d / 2, on = item.id === selected;
    return `<g data-lpp-size="${item.id}"${on ? ' class="is-on"' : ''}><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(d / 2)}" fill="${item.color}" fill-opacity="${on ? 0.95 : 0.75}" stroke="${on ? '#173a2e' : '#fff'}" stroke-width="${on ? 3 : 1}"/>`
      + `<text x="${f(cx)}" y="${STRIP.base - 18}" text-anchor="middle">${name(item)}</text><text x="${f(cx)}" y="${STRIP.base - 4}" text-anchor="middle" class="lpp-nm">~${a.diameter} nm</text></g>`;
  });
  const width = x - STRIP.gap + 10;
  return `<svg viewBox="0 0 ${f(width)} ${STRIP.height}" width="${f(width)}" height="${STRIP.height}" role="img" class="lpp-strip"><title>${title}</title>${items.join('')}`
    + `<line x1="10" y1="${STRIP.top}" x2="${10 + 50 * STRIP.nmPx}" y2="${STRIP.top}" stroke="#2c4c40" stroke-width="3"/><text x="${10 + 50 * STRIP.nmPx + 6}" y="${STRIP.top + 4}">${scale}</text></svg>`;
}
