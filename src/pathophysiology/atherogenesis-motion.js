// Geometry and flow helpers for the atheroma station: continuous plaque
// geometry for a fractional stage value (0..4), the persistent SVG pieces the
// morph drives, and the per-frame pulsatile flow update on the shared cardiac
// clock. Stage actors and the guided beat timeline live in atherogenesis-beats.js.
// All trajectories are schematic teaching aids, not calibrated kinetics.

export const PLAQUE_CX = 345;
const BULGE_W = 200;
const LUMEN_H = 84;
/** Fraction along the cap (0 left shoulder .. 1 right shoulder) where it tears. */
const BREACH_S = 0.3;
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const ramp = (x, a, b) => clamp01((x - a) / (b - a));
export const smooth = x => x * x * (3 - 2 * x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const frac = x => ((x % 1) + 1) % 1;
export const f1 = n => n.toFixed(1);
export const f2 = n => n.toFixed(2);

/** Blend two #rrggbb colours. */
export function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp01(k)));
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

/**
 * Plaque geometry for a fractional stage p (0 entry .. 4 thrombosis).
 * Order of events along p: fatty streak (1.4..2.2), cap (2.2..2.5), necrotic
 * core (2.45..2.75), outward remodeling then lumen encroachment (Glagov,
 * 2.75..3), cap thinning (3..3.4), shoulder tear (3.4..3.7), thrombus (3.7..4).
 */
export function plaqueGeometry(p, capUm) {
  const core = smooth(ramp(p, 1.4, 3));
  const late = smooth(ramp(p, 3, 4));
  const coreH = 14 * smooth(ramp(p, 1.4, 2.2)) + 78 * smooth(ramp(p, 2.45, 2.75)) + 8 * late;
  const coreW = 60 + 95 * core + 15 * late;
  const outward = 6 * smooth(ramp(p, 1.6, 2.4)) + 14 * smooth(ramp(p, 2.75, 3));
  const encroach = 7 * smooth(ramp(p, 2.85, 3)) + 15 * late;
  const capBase = Math.min(16, Math.max(3, capUm / 9));
  const capForm = smooth(ramp(p, 2.2, 2.5));
  const thin = smooth(ramp(p, 3, 3.4));
  const rupture = smooth(ramp(p, 3.4, 3.7));
  const clot = smooth(ramp(p, 3.7, 4));
  const capW = capForm * lerp(capBase, Math.min(capBase, 2.2), thin);
  const stenosis = Math.min(0.95, encroach / LUMEN_H + 0.62 * clot);
  const flow = 1 - Math.pow(stenosis, 1.6);
  const base = 225 + outward * 0.5;
  const breachX = PLAQUE_CX - (coreW + 12) * (1 - 2 * BREACH_S);
  return { p, core, coreH, coreW, outward, encroach, capW, capForm, thin, rupture, clot, stenosis, flow, base, breachX };
}

/** Height of the cap curve at x (quadratic with control over the plaque centre). */
export function capYAt(geo, x) {
  const L = geo.coreW + 12, yb = geo.base - 3, yc = geo.base - 2 * geo.coreH - 5 - geo.capW;
  const s = clamp01((x - (PLAQUE_CX - L)) / (2 * L));
  return (1 - s) * (1 - s) * yb + 2 * s * (1 - s) * yc + s * s * yb;
}

/** 1 over the plaque centre, 0 at and beyond the edge of the bulge. */
export const bump = (x, w = BULGE_W) => Math.max(0, 1 - ((x - PLAQUE_CX) / w) ** 2);

/** Persistent SVG pieces whose attributes the morph and frame updates drive. */
export function morphMarkup(en) {
  return {
    shear: `<g data-am="shear" aria-hidden="true">
      <rect x="232" y="80" width="226" height="31" rx="9" fill="#f59e0b" fill-opacity="0.13" stroke="#d97706" stroke-dasharray="4 3"/>
      <text x="${PLAQUE_CX}" y="77" text-anchor="middle" font-size="9.5" font-weight="800" fill="#b45309" stroke="#fff5f5" stroke-width="2.5" paint-order="stroke">${en ? 'Low, oscillatory shear stress' : 'Düşük, osilatuar kayma gerilimi'}</text>
      ${[268, 345, 422].map(x => `<path data-am-shear-arrow="${x}" d="M -7 0 H 5 M 1 -3 L 6 0 L 1 3" fill="none" stroke="#b45309" stroke-width="1.8" stroke-linecap="round"/>`).join('')}
    </g>`,
    mound: '<path data-am="mound" fill="#fffbeb" stroke="#fcd34d" stroke-width="1"/>',
    core: `<path data-am="core" stroke="#b45309" stroke-width="2"/>
      <path data-am="cap" fill="none" stroke-linecap="round" pathLength="100"/>
      <path data-am="breach" fill="#b91c1c"/>`,
    thrombus: `<g data-am="thrombus" aria-hidden="true">
      <ellipse class="athero-thrombus-pulse" cx="0" cy="0" rx="58" ry="26" fill="#b91c1c" fill-opacity="0.9" stroke="#450a0a" stroke-width="2.5"/>
      <g stroke="#fecaca" stroke-width="1.4"><line x1="-43" y1="-6" x2="42" y2="8"/><line x1="-38" y1="10" x2="37" y2="-10"/><line x1="-18" y1="-18" x2="17" y2="18"/></g>
      <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff" stroke="#7f1d1d" stroke-width="3.5" paint-order="stroke">${en ? 'THROMBUS' : 'TROMBÜS'}</text>
    </g>`,
    remodel: `<text data-am="remodel" x="528" y="292" text-anchor="middle" font-size="10" font-weight="800" fill="#9f1239">${en ? 'Outward remodeling (Glagov)' : 'Dışa yeniden şekillenme (Glagov)'}</text>`,
    readout: '<text data-am="readout" x="615" y="44" text-anchor="end" font-size="10.5" font-weight="800" fill="#7f1d1d" stroke="#fff5f5" stroke-width="3" paint-order="stroke"></text>',
    focus: '<ellipse data-am="focus" class="athero-focus-ring" fill="none" stroke="#0f766e" stroke-width="2.4" stroke-dasharray="7 5" pointer-events="none" aria-hidden="true"/>'
  };
}

/** Apply plaque geometry to the persistent elements (setAttribute only). */
export function applyGeometry(refs, geo, en) {
  const { core, cap, breach, mound, intima, iel, media, thrombus, remodel, readout, shear, endo } = refs;
  const cx = PLAQUE_CX, W = BULGE_W, o = geo.outward, e = geo.encroach;
  intima?.setAttribute('d', `M 10 112 H 630 V 234 L ${cx + W} 234 Q ${cx} ${f1(234 + 2 * o)} ${cx - W} 234 L 10 234 Z`);
  iel?.setAttribute('d', `M 10 236 L ${cx - W} 236 Q ${cx} ${f1(236 + 2 * o)} ${cx + W} 236 L 630 236`);
  media?.setAttribute('d', `M 10 240 L ${cx - W} 240 Q ${cx} ${f1(240 + 2 * o)} ${cx + W} 240 L 630 240 V 298 L ${cx + W} 298 Q ${cx} ${f1(298 + 1.2 * o)} ${cx - W} 298 L 10 298 Z`);
  mound?.setAttribute('d', `M ${cx - W} 112 Q ${cx} ${f1(112 - 2 * e)} ${cx + W} 112 Z`);
  endo.forEach(r => {
    const mid = Number(r.getAttribute('x')) + 26;
    r.setAttribute('transform', `translate(0 ${f1(-e * bump(mid))})`);
  });
  const bx = geo.breachX;
  if (core) {
    const w = geo.coreW, b = geo.base;
    core.setAttribute('d', `M ${f1(cx - w)} ${f1(b)} Q ${cx} ${f1(b - 2 * geo.coreH)} ${f1(cx + w)} ${f1(b)} Z`);
    core.setAttribute('fill', mixHex('#eab308', '#ca8a04', geo.rupture));
    core.setAttribute('fill-opacity', f2(0.12 + 0.43 * geo.core));
    core.setAttribute('opacity', geo.coreH > 0.5 ? '1' : '0');
    const L = w + 12, capCtrl = b - 2 * geo.coreH - 5 - geo.capW;
    cap.setAttribute('d', `M ${f1(cx - L)} ${f1(b - 3)} Q ${cx} ${f1(capCtrl)} ${f1(cx + L)} ${f1(b - 3)}`);
    cap.setAttribute('stroke-width', f2(Math.max(0.01, geo.capW)));
    cap.setAttribute('stroke', mixHex('#0d9488', '#dc2626', geo.thin));
    cap.setAttribute('opacity', f2(geo.capForm));
    const gap = 6 * geo.rupture, at = 100 * BREACH_S;
    cap.setAttribute('stroke-dasharray', gap > 0.2 ? `${f1(at - gap)} ${f1(2 * gap)} 100` : 'none');
    const top = capYAt(geo, bx), lumenY = 110 - e * bump(bx);
    breach.setAttribute('d', `M ${f1(bx - 5)} ${f1(top)} L ${f1(bx - 13)} ${f1(lumenY)} L ${f1(bx + 13)} ${f1(lumenY)} L ${f1(bx + 5)} ${f1(top)} Z`);
    breach.setAttribute('opacity', f2(0.85 * geo.rupture));
  }
  if (thrombus) {
    const k = Math.max(0.001, geo.clot);
    thrombus.setAttribute('transform', `translate(${f1(bx + 10)} ${f1(86 - e * 0.5)}) scale(${k.toFixed(3)})`);
    thrombus.setAttribute('opacity', geo.clot > 0.02 ? '1' : '0');
  }
  remodel?.setAttribute('opacity', f2(smooth(ramp(o, 8, 18))));
  shear?.setAttribute('opacity', f2((1 - 0.55 * ramp(geo.p, 1.5, 3)) * (1 - geo.clot)));
  if (readout) {
    const sten = Math.round(geo.stenosis * 100), flow = Math.round(geo.flow * 100);
    readout.textContent = en ? `Lumen stenosis ${sten}% · Flow ${flow}%` : `Lümen darlığı %${sten} · Akım %${flow}`;
    readout.setAttribute('fill', geo.flow < 0.5 ? '#b91c1c' : '#7f1d1d');
  }
}

/** Pulsatile lumen flow, wall pulse and oscillating near-wall shear arrows. */
export function animateFlow(refs, flowS, pressure, geo) {
  const occl = geo.clot * 0.9;
  refs.particles.forEach(({ el, x0 }) => {
    const x = 140 + frac((x0 - 140 + flowS) / 470) * 470;
    el.style.transform = `translate(${f1(x - x0)}px, ${f1(1.2 * pressure)}px)`;
    el.style.opacity = x > geo.breachX + 55 ? f2(1 - 0.85 * occl) : '1';
  });
  refs.wall?.setAttribute('transform', `translate(0 ${f1(1.6 * pressure)})`);
  refs.lumen?.setAttribute('height', f1(84 + 1.6 * pressure));
  const shearK = (pressure - 0.3) * 1.6 * (1 - occl);
  refs.arrows.forEach(a => a.setAttribute('transform', `translate(${a.dataset.amShearArrow} 90) scale(${shearK.toFixed(2)} 1)`));
}

/** Flow distance gained in one frame (px), slower in diastole and behind a thrombus. */
export function flowStep(dPhase, pressure, geo) {
  return dPhase * (0.35 + 1.4 * pressure) * 260 * (1 - 0.85 * geo.clot * 0.9);
}
