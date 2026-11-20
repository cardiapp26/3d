// Geometry and flow helpers for the atheroma station: continuous plaque
// geometry for a fractional stage value (0..4), the persistent SVG pieces the
// morph drives, and the per-frame pulsatile hemodynamics update on the shared
// cardiac clock. Stage actors and the guided beat timeline live in
// atherogenesis-beats.js. All trajectories are schematic teaching aids, not
// calibrated kinetics.

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
  const tcfa = capUm < 65 ? 1 : clamp01((80 - capUm) / 30);
  return { p, core, coreH, coreW, outward, encroach, capW, capForm, thin, rupture, clot, stenosis, flow, base, breachX, tcfa };
}

/** Height of the cap curve at x (quadratic with control over the plaque centre). */
export function capYAt(geo, x) {
  const L = geo.coreW + 12, yb = geo.base - 3, yc = geo.base - 2 * geo.coreH - 5 - geo.capW;
  const s = clamp01((x - (PLAQUE_CX - L)) / (2 * L));
  return (1 - s) * (1 - s) * yb + 2 * s * (1 - s) * yc + s * s * yb;
}

/** 1 over the plaque centre, 0 at and beyond the edge of the bulge. */
export const bump = (x, w = BULGE_W) => Math.max(0, 1 - ((x - PLAQUE_CX) / w) ** 2);

/** Lower lumen boundary y at x, accounting for plaque mound and thrombus protrusion. */
function lumenFloorAt(x, geo) {
  let floor = 92 - geo.encroach * bump(x);
  if (geo.clot > 0.02) {
    const dx = (x - (geo.breachX + 10)) / (64 * Math.max(0.2, geo.clot));
    if (Math.abs(dx) < 1) {
      const clotTop = (86 - geo.encroach * 0.5) - 28 * geo.clot * Math.sqrt(Math.max(0, 1 - dx * dx));
      floor = Math.min(floor, clotTop - 3);
    }
  }
  return Math.max(26, floor);
}

/** Smooth streamline path across the lumen at normalized depth lane (0 top .. 1 near wall). */
function streamlinePath(lane, geo, pressure) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const x = 138 + (i / 14) * 484;
    const floor = lumenFloorAt(x, geo) + 2.4 * pressure;
    const top = 16;
    const y = lerp(top, floor, lane);
    pts.push(`${i === 0 ? 'M' : 'L'} ${f1(x)} ${f1(y)}`);
  }
  return pts.join(' ');
}

/** Persistent SVG pieces whose attributes the morph and frame updates drive. */
export function morphMarkup(en) {
  const rbcMarkup = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const lane = 0.14 + (i % 4) * 0.17;
    const x0 = 150 + i * 68;
    return `<g data-am-rbc data-x0="${x0}" data-lane="${lane.toFixed(2)}" opacity="0.72">
      <ellipse rx="7.2" ry="3.4" fill="#dc2626" stroke="#991b1b" stroke-width="0.9"/>
      <ellipse rx="3.4" ry="1.3" fill="#fca5a5" fill-opacity="0.55"/>
    </g>`;
  }).join('');

  const streamlines = [0.18, 0.38, 0.58, 0.78].map((lane, i) =>
    `<path data-am-stream="${lane}" data-lane-idx="${i}" fill="none" stroke="#dc2626" stroke-width="${i === 1 ? '1.35' : '1.05'}" stroke-opacity="${i < 2 ? '0.24' : '0.18'}" stroke-dasharray="14 16" stroke-linecap="round"/>`
  ).join('');

  const eddies = [268, 345, 422].map((x, i) => `
    <g data-am-eddy="${x}" data-eddy-idx="${i}">
      <path d="M -13 2 A 13 6.5 0 1 1 11 -3" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="18 7" stroke-linecap="round" opacity="0.75"/>
      <path d="M 8 -5.5 L 13 -2.8 L 8.5 0.5" fill="none" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`).join('');

  const liverBuds = [0, 1, 2, 3].map(i =>
    `<circle data-am-liver-bud="${i}" r="3.8" fill="#eab308" stroke="#92400e" stroke-width="1.1"/>`
  ).join('');

  const fibrin = [
    'M -46 -4 Q -10 -16 44 6',
    'M -42 9 Q 0 -10 40 -9',
    'M -24 -18 Q 2 2 22 18',
    'M -30 14 Q -4 -2 26 -16',
    'M -12 -20 Q 12 -4 34 12'
  ].map((d, i) => `<path data-am-fibrin="${i}" d="${d}" fill="none" stroke="#fee2e2" stroke-width="1.6" stroke-linecap="round" pathLength="100"/>`).join('');

  const trappedRbc = [[-22, -4], [14, 6], [-4, 10], [26, -6], [-32, 7]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="5.2" ry="2.6" fill="#991b1b" stroke="#fecaca" stroke-width="0.7" transform="rotate(${x * 2} ${x} ${y})"/>`
  ).join('');

  return {
    streamlines: `<g data-am="streamlines" aria-hidden="true">${streamlines}</g>`,
    rbcs: `<g data-am="rbcs" aria-hidden="true">${rbcMarkup}</g>`,
    liverBuds: `<g data-am="liver-buds" aria-hidden="true">${liverBuds}</g>`,
    shear: `<g data-am="shear" aria-hidden="true">
      <rect x="228" y="75" width="234" height="23" rx="9" fill="#f59e0b" fill-opacity="0.14" stroke="#d97706" stroke-dasharray="4 3"/>
      <text x="${PLAQUE_CX}" y="71" text-anchor="middle" font-size="9.5" font-weight="800" fill="#b45309" stroke="#fff5f5" stroke-width="2.5" paint-order="stroke">${en ? 'Low, oscillatory shear stress' : 'Düşük, osilatuar kayma gerilimi'}</text>
      ${eddies}
      ${[268, 345, 422].map(x => `<path data-am-shear-arrow="${x}" d="M -7 0 H 5 M 1 -3 L 6 0 L 1 3" fill="none" stroke="#b45309" stroke-width="1.8" stroke-linecap="round"/>`).join('')}
    </g>`,
    glycocalyx: `<g data-am="glycocalyx" aria-hidden="true" stroke="#0d9488" stroke-width="1.2" stroke-linecap="round" fill="none">
      ${Array.from({ length: 28 }, (_, i) => {
        const x = 22 + i * 21.8;
        const lesion = x >= 155 && x <= 490 ? 1 : 0;
        return `<path data-am-cilia data-x="${f1(x)}" data-lesion="${lesion}" d="M ${f1(x)} 96 Q ${f1(x + 2)} 91 ${f1(x + 4)} 88"/>`;
      }).join('')}
    </g>`,
    mound: '<path data-am="mound" fill="#fffbeb" stroke="#fcd34d" stroke-width="1"/>',
    core: `<path data-am="core" stroke="#b45309" stroke-width="2"/>
      <path data-am="core-inner" fill="#fef08a" fill-opacity="0.35" stroke="none"/>
      <path data-am="cap" fill="none" stroke-linecap="round" pathLength="100"/>
      <path data-am="collagen" fill="none" stroke="#99f6e4" stroke-width="1.7" stroke-dasharray="9 5" stroke-linecap="round" pathLength="100"/>
      <path data-am="cap-stress" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="4 4" opacity="0"/>
      <path data-am="breach" fill="#b91c1c"/>`,
    thrombus: `<g data-am="thrombus" aria-hidden="true">
      <ellipse class="athero-thrombus-pulse" cx="0" cy="0" rx="58" ry="26" fill="#b91c1c" fill-opacity="0.92" stroke="#450a0a" stroke-width="2.5"/>
      ${trappedRbc}
      <g data-am="fibrin-mesh">${fibrin}</g>
      <text x="0" y="4.5" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff" stroke="#7f1d1d" stroke-width="3.5" paint-order="stroke">${en ? 'THROMBUS' : 'TROMBÜS'}</text>
    </g>`,
    remodel: `<text data-am="remodel" x="536" y="331" text-anchor="middle" font-size="9.6" font-weight="800" fill="#9f1239" stroke="#fffcf7" stroke-width="2.5" paint-order="stroke">${en ? 'Outward remodeling (Glagov)' : 'Dışa yeniden şekillenme (Glagov)'}</text>`,
    readout: '<text data-am="readout" x="615" y="44" text-anchor="end" font-size="10.5" font-weight="800" fill="#7f1d1d" stroke="#fff5f5" stroke-width="3" paint-order="stroke"></text>',
    focus: '<ellipse data-am="focus" class="athero-focus-ring" fill="none" stroke="#0f766e" stroke-width="2.4" stroke-dasharray="7 5" pointer-events="none" aria-hidden="true"/>'
  };
}

/** Apply plaque geometry to the persistent elements (setAttribute only). */
export function applyGeometry(refs, geo, en, pressure = 0, inflam = 0.2, endoPart = 0) {
  const { core, coreInner, cap, collagen, capStress, breach, mound, intima, iel, media, thrombus, remodel, readout, shear, endo } = refs;
  const cx = PLAQUE_CX, W = BULGE_W, o = geo.outward, e = geo.encroach;
  intima?.setAttribute('d', `M 10 112 H 630 V 234 L ${cx + W} 234 Q ${cx} ${f1(234 + 2 * o)} ${cx - W} 234 L 10 234 Z`);
  iel?.setAttribute('d', `M 10 236 L ${cx - W} 236 Q ${cx} ${f1(236 + 2 * o)} ${cx + W} 236 L 630 236`);
  media?.setAttribute('d', `M 10 240 L ${cx - W} 240 Q ${cx} ${f1(240 + 2 * o)} ${cx + W} 240 L 630 240 V 298 L ${cx + W} 298 Q ${cx} ${f1(298 + 1.2 * o)} ${cx - W} 298 L 10 298 Z`);
  mound?.setAttribute('d', `M ${cx - W} 112 Q ${cx} ${f1(112 - 2 * e)} ${cx + W} 112 Z`);
  endo.forEach((r, idx) => {
    const mid = Number(r.getAttribute('x')) + 26;
    let dx = 0;
    if (endoPart > 0) {
      if (idx === 4) dx = -5.5 * endoPart;
      else if (idx === 5) dx = 5.5 * endoPart;
    }
    r.setAttribute('transform', `translate(${f1(dx)} ${f1(-e * bump(mid))})`);
  });

  const bx = geo.breachX;
  if (core) {
    const w = geo.coreW, b = geo.base;
    const flex = (geo.thin * 0.8 + geo.tcfa * 0.5) * pressure * 3.8 * (1 - geo.rupture * 0.5);
    core.setAttribute('d', `M ${f1(cx - w)} ${f1(b)} Q ${cx} ${f1(b - 2 * geo.coreH - flex)} ${f1(cx + w)} ${f1(b)} Z`);
    core.setAttribute('fill', mixHex('#eab308', '#ca8a04', geo.rupture));
    core.setAttribute('fill-opacity', f2(0.14 + 0.46 * geo.core));
    core.setAttribute('opacity', geo.coreH > 0.5 ? '1' : '0');

    if (coreInner) {
      const iw = w * 0.62, ih = geo.coreH * 0.62;
      coreInner.setAttribute('d', `M ${f1(cx - iw)} ${f1(b - 4)} Q ${cx} ${f1(b - 4 - 2 * ih)} ${f1(cx + iw)} ${f1(b - 4)} Z`);
      coreInner.setAttribute('opacity', f2(smooth(ramp(geo.p, 2.35, 2.85)) * (0.45 + 0.2 * pressure)));
    }

    const L = w + 12, capCtrl = b - 2 * geo.coreH - 5 - geo.capW - flex;
    const capD = `M ${f1(cx - L)} ${f1(b - 3)} Q ${cx} ${f1(capCtrl)} ${f1(cx + L)} ${f1(b - 3)}`;
    cap.setAttribute('d', capD);
    cap.setAttribute('stroke-width', f2(Math.max(0.01, geo.capW)));
    cap.setAttribute('stroke', mixHex('#0d9488', '#dc2626', clamp01(geo.thin + geo.tcfa * 0.35 + inflam * 0.15)));
    cap.setAttribute('opacity', f2(geo.capForm));

    const gap = 6.5 * geo.rupture, at = 100 * BREACH_S;
    cap.setAttribute('stroke-dasharray', gap > 0.2 ? `${f1(at - gap)} ${f1(2 * gap)} 100` : 'none');

    if (collagen) {
      collagen.setAttribute('d', `M ${f1(cx - L + 4)} ${f1(b - 4)} Q ${cx} ${f1(capCtrl + 2)} ${f1(cx + L - 4)} ${f1(b - 4)}`);
      collagen.setAttribute('opacity', f2(geo.capForm * (1 - 0.85 * geo.thin)));
      collagen.setAttribute('stroke-dashoffset', f1((1 - geo.capForm) * 100));
    }

    if (capStress) {
      const showStress = geo.capForm * clamp01(geo.thin + geo.tcfa * 0.55) * (1 - geo.clot * 0.6);
      const sy = capYAt(geo, bx);
      capStress.setAttribute('d', `M ${f1(bx - 22)} ${f1(sy - 5 - flex * 0.5)} Q ${f1(bx)} ${f1(sy - 14 - flex)} ${f1(bx + 22)} ${f1(sy - 3 - flex * 0.5)}`);
      capStress.setAttribute('opacity', f2(showStress * (0.25 + 0.75 * pressure)));
    }

    const top = capYAt(geo, bx), lumenY = 108 - e * bump(bx);
    breach.setAttribute('d', `M ${f1(bx - 5)} ${f1(top)} L ${f1(bx - 14)} ${f1(lumenY)} L ${f1(bx - 4)} ${f1(lumenY + 4)} L ${f1(bx + 4)} ${f1(lumenY - 2)} L ${f1(bx + 15)} ${f1(lumenY)} L ${f1(bx + 5)} ${f1(top)} Z`);
    breach.setAttribute('opacity', f2(0.88 * geo.rupture));
  }

  if (thrombus) {
    const k = Math.max(0.001, geo.clot);
    thrombus.setAttribute('transform', `translate(${f1(bx + 10)} ${f1(86 - e * 0.5)}) scale(${k.toFixed(3)})`);
    thrombus.setAttribute('opacity', geo.clot > 0.02 ? '1' : '0');
    refs.fibrin?.forEach((strand, idx) => {
      const drawK = smooth(ramp(geo.clot, 0.15 + idx * 0.1, 0.55 + idx * 0.09));
      strand.setAttribute('stroke-dasharray', `${f1(drawK * 100)} 100`);
      strand.setAttribute('opacity', f2(drawK * 0.9));
    });
  }

  remodel?.setAttribute('opacity', f2(smooth(ramp(o, 8, 18))));
  shear?.setAttribute('opacity', f2((1 - 0.5 * ramp(geo.p, 1.5, 3)) * (1 - geo.clot)));
  if (readout) {
    const sten = Math.round(geo.stenosis * 100), flow = Math.round(geo.flow * 100);
    readout.textContent = en ? `Lumen stenosis ${sten}% · Flow ${flow}%` : `Lümen darlığı %${sten} · Akım %${flow}`;
    readout.setAttribute('fill', geo.flow < 0.5 ? '#b91c1c' : '#7f1d1d');
  }
}

/** Pulsatile lumen flow, RBCs, streamlines, glycocalyx, liver secretion and phenotype effectors. */
export function animateFlow(refs, flowS, pressure, geo, ctx = {}) {
  const { time = 0, injury = 0.5, modifierId = 'physiological', inflam = 0.2 } = ctx;
  const occl = geo.clot * 0.9;
  const pulseY = 3.2 * pressure;

  // 1. Laminar blood streamlines bending over plaque/thrombus & rushing in systole
  refs.streams?.forEach(path => {
    const lane = Number(path.dataset.amStream);
    path.setAttribute('d', streamlinePath(lane, geo, pressure));
    const laneSpeed = 1.25 - 0.55 * lane; // parabolic Poiseuille velocity
    path.setAttribute('stroke-dashoffset', f1(-flowS * laneSpeed * 1.15));
    path.setAttribute('stroke-opacity', f2((0.16 + 0.16 * pressure) * (1 - 0.45 * occl)));
  });

  // 2. Biconcave red blood cells riding parabolic lanes & deflecting over stenosis
  refs.rbcs?.forEach(({ el, x0, lane }) => {
    const laneSpeed = 1.3 - 0.65 * lane;
    const x = 140 + frac((x0 - 140 + flowS * laneSpeed) / 480) * 480;
    const floor = lumenFloorAt(x, geo);
    const y = lerp(18, floor - 4, lane) + 1.5 * Math.sin(time * 4 + x0) + pulseY * 0.5;
    const nextFloor = lumenFloorAt(x + 12, geo);
    const slopeDeg = Math.atan2(lerp(18, nextFloor - 4, lane) - lerp(18, floor - 4, lane), 12) * 57.3;
    const tumble = slopeDeg + 9 * Math.sin(time * 5 + x0);
    const downstream = x > geo.breachX + 55;
    el.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(tumble)})`);
    el.setAttribute('opacity', downstream ? f2(0.72 * (1 - 0.78 * occl)) : '0.72');
  });

  // 3. Circulating ApoB lipoprotein particles deflecting smoothly over the plaque/thrombus
  refs.particles.forEach(({ el, x0, y0 }) => {
    const lane = clamp01((y0 - 20) / 68);
    const laneSpeed = 1.12 - 0.35 * lane;
    const x = 140 + frac((x0 - 140 + flowS * laneSpeed) / 455) * 455;
    const floor = lumenFloorAt(x, geo) - 6;
    const clampedY = Math.min(y0, floor);
    const dy = (clampedY - y0) + 1.8 * pressure + 1.4 * Math.sin(time * 4.5 + x0);
    el.style.transform = `translate(${f1(x - x0)}px, ${f1(dy)}px)`;
    el.style.opacity = x > geo.breachX + 55 ? f2(1 - 0.82 * occl) : '1';
  });

  // 4. Hepatic ApoB / VLDL1 secretion budding out of the top-left Liver widget
  const isMasld = modifierId === 'masld';
  refs.liverBuds?.forEach((el, i) => {
    const q = frac(time * (isMasld ? 0.95 : 0.55) + i / 4);
    const x = lerp(88, 152, q);
    const y = lerp(46, 36 + (i % 3) * 14, q) + Math.sin(q * Math.PI * 2) * 3;
    el.setAttribute('cx', f1(x));
    el.setAttribute('cy', f1(y));
    el.setAttribute('r', isMasld ? '4.5' : '3.4');
    el.setAttribute('fill', isMasld && i % 2 === 0 ? '#ea580c' : '#eab308');
    el.setAttribute('opacity', f2(Math.sin(q * Math.PI) * 0.95));
  });
  refs.liverDots?.forEach((dot, i) => {
    const s = isMasld ? 1 + 0.22 * Math.sin(time * 5 + i * 1.4) : 1 + 0.08 * Math.sin(time * 3 + i);
    dot.setAttribute('transform', `scale(${f2(s)})`);
  });

  // 5. Vessel wall systolic expansion & endothelial glycocalyx brush border
  refs.wall?.setAttribute('transform', `translate(0 ${f1(pulseY)})`);
  refs.lumen?.setAttribute('height', f1(LUMEN_H + pulseY));

  refs.cilia?.forEach(c => {
    const x = Number(c.dataset.x);
    const isLesion = c.dataset.lesion === '1';
    const lift = -geo.encroach * bump(x);
    const intact = isLesion ? Math.max(0.18, 1 - 0.78 * injury - 0.15 * inflam) : 1;
    const h = 7.5 * intact;
    const sway = (isLesion ? (pressure - 0.35) * 6 : (1.5 + 3.5 * pressure)) + 1.2 * Math.sin(time * 5 + x * 0.08);
    const y0 = 96 + lift;
    c.setAttribute('d', `M ${f1(x)} ${f1(y0)} Q ${f1(x + sway * 0.5)} ${f1(y0 - h * 0.55)} ${f1(x + sway)} ${f1(y0 - h)}`);
    c.setAttribute('opacity', f2(intact * (1 - 0.7 * geo.clot)));
  });

  // 6. Oscillatory shear arrows & swirling recirculation vortices
  const shearK = (pressure - 0.32) * 1.85 * (1 - occl);
  refs.arrows.forEach(a => a.setAttribute('transform', `translate(${a.dataset.amShearArrow} 88) scale(${shearK.toFixed(2)} 1)`));
  refs.eddies?.forEach((ed, i) => {
    const x = Number(ed.dataset.amEddy);
    const spin = Math.sin(time * 3.8 + i * 1.2) * 26 + (pressure - 0.3) * 35;
    ed.setAttribute('transform', `translate(${x} 86) rotate(${f1(spin)})`);
  });

  // 7. Animated Systemic Phenotype effectors (Autoimmune cytokines/NETs, APS antibodies)
  refs.pheno?.forEach((el, i) => {
    const kind = el.dataset.phenoKind;
    if (kind === 'aps-ab') {
      const x0 = Number(el.dataset.x0);
      const bob = Math.sin(time * 4.5 + i * 1.7) * 5;
      const tilt = Math.sin(time * 3.2 + i) * 14;
      const floor = lumenFloorAt(x0, geo) - 6;
      el.setAttribute('transform', `translate(${f1(x0)} ${f1(floor + bob)}) rotate(${f1(tilt)})`);
    } else if (kind === 'auto-cyto') {
      const q = frac(time * 0.75 + i / 6);
      const x = 195 + q * 310;
      const y = 62 + 18 * Math.sin(q * Math.PI * 2 + i) + 8 * q;
      el.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`);
      el.setAttribute('opacity', f2(Math.sin(q * Math.PI) * 0.9));
    } else if (kind === 'auto-net') {
      const wave = 3.5 * Math.sin(time * 4.2 + i * 1.4);
      const x0 = Number(el.dataset.x0);
      el.setAttribute('d', `M ${x0} 96 Q ${f1(x0 + 18)} ${f1(82 + wave)} ${x0 + 38} ${f1(86 - wave)} T ${x0 + 74} 95`);
    }
  });
}

/** Animated systemic phenotype effectors drawn in the arterial lumen. */
export function immuneLumenMarkup(modId) {
  if (modId === 'aps') {
    return `<g stroke="#be123c" stroke-width="2" fill="none" stroke-linecap="round">
        ${[240, 310, 380, 450].map(x => `<g data-am-pheno data-pheno-kind="aps-ab" data-x0="${x}" transform="translate(${x} 82)"><path d="M 0 -5 L 0 4 M 0 -1 L -5 -7 M 0 -1 L 5 -7"/></g>`).join('')}
      </g>
      <text x="310" y="27" text-anchor="middle" font-size="10" font-weight="800" fill="#9f1239" stroke="#fff5f5" stroke-width="3" paint-order="stroke">Anti-β2GPI / aPL → TLR4</text>`;
  }
  if (modId === 'autoimmune') {
    return `<g fill="none" stroke="#be185d" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.75">
        ${[225, 315, 405].map(x => `<path data-am-pheno data-pheno-kind="auto-net" data-x0="${x}" d="M ${x} 96 Q ${x + 18} 82 ${x + 38} 86 T ${x + 74} 95"/>`).join('')}
      </g>
      <g fill="#db2777" stroke="#fff" stroke-width="0.6">
        ${Array.from({ length: 6 }, () => '<circle data-am-pheno data-pheno-kind="auto-cyto" r="3.4"/>').join('')}
      </g>
      <text x="310" y="27" text-anchor="middle" font-size="10" font-weight="800" fill="#9d174d" stroke="#fff5f5" stroke-width="3" paint-order="stroke">IL-17 · TNF · IFN-γ · NETs</text>`;
  }
  return '';
}

/** Flow distance gained in one frame (px), slower in diastole and behind a thrombus. */
export function flowStep(dPhase, pressure, geo) {
  return dPhase * (0.4 + 1.55 * pressure) * 285 * (1 - 0.82 * geo.clot * 0.9);
}
