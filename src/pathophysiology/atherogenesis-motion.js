// Motion helpers for the atheroma station: continuous plaque geometry for a
// fractional stage value (0..4), stage-specific animated cells, and the
// per-frame pulsatile flow update driven by the shared cardiac clock.
// All trajectories are schematic teaching aids, not calibrated kinetics.

export const PLAQUE_CX = 345;
const BULGE_W = 200;
const LUMEN_H = 84;
const clamp01 = x => Math.min(1, Math.max(0, x));
const ramp = (x, a, b) => clamp01((x - a) / (b - a));
const smooth = x => x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;
const frac = x => ((x % 1) + 1) % 1;
const f1 = n => n.toFixed(1);

/** Blend two #rrggbb colours. */
export function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp01(k)));
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

/**
 * Plaque geometry for a fractional stage p (0 entry .. 4 rupture).
 * Glagov order: outward remodeling first (p 1.6..3), lumen encroachment after (p > 2.7).
 */
export function plaqueGeometry(p, capUm) {
  const core = smooth(ramp(p, 1.4, 3));
  const late = smooth(ramp(p, 3, 4));
  const coreH = 14 * smooth(ramp(p, 1.4, 2.2)) + 41 * smooth(ramp(p, 2.2, 3)) + 7 * late;
  const coreW = 60 + 95 * core + 15 * late;
  const outward = 20 * smooth(ramp(p, 1.6, 3));
  const encroach = 7 * smooth(ramp(p, 2.7, 3)) + 15 * late;
  const capBase = Math.max(3, Math.round(capUm / 14));
  const capForm = smooth(ramp(p, 2.3, 3));
  const rupture = smooth(ramp(p, 3.3, 4));
  const capW = capForm * lerp(capBase, 2.5, rupture);
  const stenosis = Math.min(0.95, encroach / LUMEN_H + 0.62 * rupture);
  const flow = 1 - Math.pow(stenosis, 1.6);
  const base = 225 + outward * 0.5;
  return { p, core, coreH, coreW, outward, encroach, capW, capForm, rupture, stenosis, flow, base };
}

/** Height of the cap curve at x (quadratic with control over the plaque centre). */
export function capYAt(geo, x) {
  const L = geo.coreW + 12, yb = geo.base - 3, yc = geo.base - 2 * geo.coreH - 5 - geo.capW;
  const s = clamp01((x - (PLAQUE_CX - L)) / (2 * L));
  return (1 - s) * (1 - s) * yb + 2 * s * (1 - s) * yc + s * s * yb;
}

const bump = (x, w = BULGE_W) => Math.max(0, 1 - ((x - PLAQUE_CX) / w) ** 2);

/** Persistent SVG pieces whose attributes the morph and frame updates drive. */
export function morphMarkup(en) {
  return {
    shear: `<g data-am="shear" aria-hidden="true">
      <rect x="232" y="80" width="226" height="31" rx="9" fill="#f59e0b" fill-opacity="0.13" stroke="#d97706" stroke-dasharray="4 3"/>
      <text x="${PLAQUE_CX}" y="77" text-anchor="middle" font-size="9.5" font-weight="800" fill="#b45309">${en ? 'Low / oscillatory shear (bifurcation, inner curve)' : 'Düşük / osilatuar kayma gerilimi (dallanma, iç kıvrım)'}</text>
      ${[268, 345, 422].map(x => `<path data-am-shear-arrow="${x}" d="M -7 0 H 5 M 1 -3 L 6 0 L 1 3" fill="none" stroke="#b45309" stroke-width="1.8" stroke-linecap="round"/>`).join('')}
    </g>`,
    mound: '<path data-am="mound" fill="#fffbeb" stroke="#fcd34d" stroke-width="1"/>',
    core: `<path data-am="core" stroke="#b45309" stroke-width="2"/>
      <path data-am="cap" fill="none" stroke-linecap="round" pathLength="100"/>
      <path data-am="breach" fill="#b91c1c"/>`,
    thrombus: `<g data-am="thrombus" aria-hidden="true">
      <ellipse class="athero-thrombus-pulse" cx="0" cy="0" rx="58" ry="26" fill="#b91c1c" fill-opacity="0.9" stroke="#450a0a" stroke-width="2.5"/>
      <g stroke="#fecaca" stroke-width="1.4"><line x1="-43" y1="-6" x2="42" y2="8"/><line x1="-38" y1="10" x2="37" y2="-10"/><line x1="-18" y1="-18" x2="17" y2="18"/></g>
      <text x="0" y="4" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${en ? 'THROMBUS (TF + Factor VIIa)' : 'TROMBÜS (TF + Faktör VIIa)'}</text>
    </g>`,
    remodel: `<text data-am="remodel" x="500" y="286" text-anchor="middle" font-size="10" font-weight="800" fill="#9f1239">${en ? 'Positive (outward) remodeling (Glagov)' : 'Pozitif (dışa) yeniden şekillenme (Glagov)'}</text>`,
    readout: '<text data-am="readout" x="615" y="44" text-anchor="end" font-size="10.5" font-weight="800" fill="#7f1d1d" stroke="#fff5f5" stroke-width="3" paint-order="stroke"></text>'
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
  if (core) {
    const w = geo.coreW, b = geo.base;
    core.setAttribute('d', `M ${f1(cx - w)} ${f1(b)} Q ${cx} ${f1(b - 2 * geo.coreH)} ${f1(cx + w)} ${f1(b)} Z`);
    core.setAttribute('fill', mixHex('#eab308', '#ca8a04', geo.rupture));
    core.setAttribute('fill-opacity', f1(0.12 + 0.43 * geo.core));
    core.setAttribute('opacity', geo.coreH > 0.5 ? '1' : '0');
    const L = w + 12, capCtrl = b - 2 * geo.coreH - 5 - geo.capW;
    cap.setAttribute('d', `M ${f1(cx - L)} ${f1(b - 3)} Q ${cx} ${f1(capCtrl)} ${f1(cx + L)} ${f1(b - 3)}`);
    cap.setAttribute('stroke-width', f1(Math.max(0.01, geo.capW)));
    cap.setAttribute('stroke', mixHex('#0d9488', '#dc2626', geo.rupture));
    cap.setAttribute('opacity', f1(geo.capForm));
    const gap = 7 * geo.rupture;
    cap.setAttribute('stroke-dasharray', gap > 0.2 ? `${f1(50 - gap)} ${f1(2 * gap)} 100` : 'none');
    const top = capYAt(geo, cx), lumenY = 110 - e;
    breach.setAttribute('d', `M ${cx - 5} ${f1(top)} L ${cx - 15} ${f1(lumenY)} L ${cx + 15} ${f1(lumenY)} L ${cx + 5} ${f1(top)} Z`);
    breach.setAttribute('opacity', f1(0.85 * geo.rupture));
  }
  if (thrombus) {
    const k = Math.max(0.001, geo.rupture);
    thrombus.setAttribute('transform', `translate(${cx} ${f1(96 - e * 0.6)}) scale(${k.toFixed(3)})`);
    thrombus.setAttribute('opacity', geo.rupture > 0.02 ? '1' : '0');
  }
  remodel?.setAttribute('opacity', f1(smooth(ramp(o, 3, 14))));
  shear?.setAttribute('opacity', f1((1 - 0.55 * ramp(geo.p, 1.5, 3)) * (1 - geo.rupture)));
  if (readout) {
    const sten = Math.round(geo.stenosis * 100), flow = Math.round(geo.flow * 100);
    readout.textContent = en ? `Lumen stenosis ${sten}% · Flow ${flow}%` : `Lümen darlığı %${sten} · Akım %${flow}`;
    readout.setAttribute('fill', geo.flow < 0.5 ? '#b91c1c' : '#7f1d1d');
  }
}

// Stage-specific animated cells. Each element is positioned per frame from t (cycles).
const LDL = '<circle r="5.5" fill="#eab308" stroke="#92400e" stroke-width="1.5"/>';
export function cellMarkup(stageIdx) {
  if (stageIdx === 0) {
    return [250, 330, 410].map(x => `<g data-cell="ldl" data-x="${x}">${LDL}</g>`).join('');
  }
  if (stageIdx === 1) {
    return [128, 172, 214].map(x => `<g data-cell="ox" data-x="${x}"><circle r="6" stroke="#78350f" stroke-width="1.5"/>
      <path data-ros d="M 9 -9 l 2 4 l 4 -2 l -2 4 l 4 2 l -4 1 l 1 4 l -4 -2 l -2 4 l -1 -4 z" fill="#ef4444"/></g>`).join('');
  }
  if (stageIdx === 2) {
    return `<g data-cell="mono"><g data-body><circle data-skin r="8" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M -4 -2 Q 0 -6 4 -2 Q 2 3 -3 2 Z" fill="#1e3a8a" fill-opacity="0.55"/>
      <g data-drops fill="#eab308"><circle cx="-5" cy="-4" r="3.2"/><circle cx="5" cy="-3" r="3"/><circle cx="-3" cy="5" r="3"/><circle cx="5" cy="5" r="3.2"/></g></g>
      <g data-ticks stroke="#1e40af" stroke-width="1.4"><line x1="-6" y1="8" x2="-7" y2="12"/><line x1="0" y1="9" x2="0" y2="13"/><line x1="6" y1="8" x2="7" y2="12"/></g></g>`;
  }
  if (stageIdx === 3) {
    return [232, 312, 392, 462].map(x => `<g data-cell="smc" data-x="${x}"><ellipse rx="10" ry="3.6" fill="#fb7185" stroke="#be123c" stroke-width="1.3"/><circle r="1.6" fill="#881337"/></g>`).join('');
  }
  return Array.from({ length: 9 }, (_, i) => `<g data-cell="plt" data-i="${i}"><ellipse rx="4.2" ry="2.3" fill="#f9a8d4" stroke="#9d174d" stroke-width="1.1"/></g>`).join('');
}

const place = (el, x, y, extra = '') => el.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${extra}`);

function animateLdl(el, i, t) {
  const q = frac(t / 4 + i / 3), x = Number(el.dataset.x);
  const y = q < 0.35 ? lerp(58, 92, q / 0.35) : q < 0.6 ? lerp(92, 118, (q - 0.35) / 0.25) : lerp(118, 142, ramp(q, 0.6, 0.85));
  const squeeze = q > 0.35 && q < 0.6 ? 0.7 : 1;
  place(el, x + 6 * Math.sin(q * 6.3), y, ` scale(${squeeze} 1)`);
  el.setAttribute('opacity', f1(q > 0.88 ? 1 - ramp(q, 0.88, 1) : ramp(q, 0, 0.08)));
}

function animateOx(el, i, t) {
  const q = frac(t / 5 + i / 3), x = Number(el.dataset.x);
  place(el, x, lerp(100, 152, smooth(ramp(q, 0, 0.3))));
  const ox = ramp(q, 0.32, 0.85);
  el.firstElementChild.setAttribute('fill', mixHex('#eab308', '#c2410c', ox));
  el.querySelector('[data-ros]').setAttribute('opacity', q > 0.32 && q < 0.85 ? f1(0.5 + 0.5 * Math.sin(t * 9 + i)) : '0');
  el.setAttribute('opacity', f1(q > 0.9 ? 1 - ramp(q, 0.9, 1) : ramp(q, 0, 0.06)));
}

function animateMono(el, t) {
  const q = frac(t / 7);
  let x, y, sx = 1, r = 8, colour = 0, drops = 0, ticks = 0, rot = 0;
  if (q < 0.3) { x = lerp(150, 235, q / 0.3); y = 86; rot = x * 4; }
  else if (q < 0.4) { x = 235; y = 86; ticks = 1; rot = 940; }
  else if (q < 0.6) { const k = (q - 0.4) / 0.2; x = lerp(235, 242, k); y = lerp(86, 132, k); sx = 1 - 0.45 * Math.sin(Math.PI * k); }
  else { const k = ramp(q, 0.6, 0.95); x = lerp(242, 236, k); y = lerp(132, 142, k); colour = ramp(q, 0.6, 0.75); r = lerp(8, 15, k); drops = ramp(q, 0.75, 0.9); }
  place(el, x, y);
  const body = el.querySelector('[data-body]');
  body.setAttribute('transform', `rotate(${f1(rot % 360)}) scale(${f1(sx * r / 8)} ${f1(r / 8)})`);
  el.querySelector('[data-skin]').setAttribute('fill', mixHex('#3b82f6', '#f59e0b', colour));
  el.querySelector('[data-skin]').setAttribute('fill-opacity', f1(lerp(1, 0.35, colour)));
  el.querySelector('[data-drops]').setAttribute('opacity', f1(drops));
  el.querySelector('[data-ticks]').setAttribute('opacity', f1(ticks));
  el.setAttribute('opacity', f1(q > 0.95 ? 1 - ramp(q, 0.95, 1) : ramp(q, 0, 0.04)));
}

function animateSmc(el, i, t, geo) {
  const q = frac(t / 6 + i / 4), x0 = Number(el.dataset.x);
  const k = smooth(ramp(q, 0, 0.7)), yCap = capYAt(geo, x0 + 10) + 2;
  const x = lerp(x0, x0 + 10, k), y = lerp(268 + geo.outward * 0.6 * bump(x0), yCap, k);
  const tilt = 90 * (1 - k) + (x0 < PLAQUE_CX ? -18 : 18) * k;
  place(el, x, y, ` rotate(${f1(tilt)})`);
  el.setAttribute('opacity', f1(q > 0.88 ? 1 - ramp(q, 0.88, 1) : ramp(q, 0, 0.06)));
}

function animatePlatelet(el, i, t, geo) {
  const q = frac(t / 3 + i / 9), k = Math.max(0.05, geo.rupture);
  const a = Math.PI * (1.05 + 0.9 * (i / 8)), ty = 96 - geo.encroach * 0.6;
  const tx = PLAQUE_CX + 60 * k * Math.cos(a), tyy = ty + 27 * k * Math.sin(a) * -1;
  const travel = smooth(ramp(q, 0, 0.7));
  const x = lerp(150 + (i % 3) * 20, tx, travel), y = lerp(36 + (i * 7) % 40, tyy, travel) + 4 * Math.sin(q * 12) * (1 - travel);
  place(el, x, y, ` rotate(${f1(q * 300)})`);
  el.setAttribute('opacity', f1(geo.rupture < 0.05 ? 0 : (q > 0.92 ? 1 - ramp(q, 0.92, 1) : ramp(q, 0, 0.05))));
}

/** Per-frame cell update for the current stage. */
export function animateCells(cells, t, geo) {
  cells.forEach((el, i) => {
    const kind = el.dataset.cell;
    if (kind === 'ldl') animateLdl(el, i, t);
    else if (kind === 'ox') animateOx(el, i, t);
    else if (kind === 'mono') animateMono(el, t);
    else if (kind === 'smc') animateSmc(el, i, t, geo);
    else if (kind === 'plt') animatePlatelet(el, i, t, geo);
  });
}

/** Pulsatile lumen flow, wall pulse and oscillating near-wall shear arrows. */
export function animateFlow(refs, flowS, pressure, geo) {
  const occl = geo.rupture * 0.9;
  refs.particles.forEach(({ el, x0 }) => {
    const x = 140 + frac((x0 - 140 + flowS) / 470) * 470;
    el.style.transform = `translate(${f1(x - x0)}px, ${f1(1.2 * pressure)}px)`;
    el.style.opacity = x > PLAQUE_CX + 45 ? f1(1 - 0.85 * occl) : '1';
  });
  refs.wall?.setAttribute('transform', `translate(0 ${f1(1.6 * pressure)})`);
  refs.lumen?.setAttribute('height', f1(84 + 1.6 * pressure));
  const shearK = (pressure - 0.3) * 1.6 * (1 - occl);
  refs.arrows.forEach(a => a.setAttribute('transform', `translate(${a.dataset.amShearArrow} 90) scale(${shearK.toFixed(2)} 1)`));
}

/** Flow distance gained in one frame (px), slower in diastole and behind a thrombus. */
export function flowStep(dPhase, pressure, geo) {
  return dPhase * (0.35 + 1.4 * pressure) * 260 * (1 - 0.85 * geo.rupture * 0.9);
}
