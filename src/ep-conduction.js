// Conduction view: activation along the conduction system on the 3D heart render, staggered
// site action potentials, the frontal mean vector in the Einthoven triangle and limb leads
// I/II/III derived by projecting that vector. Sequence and directions follow textbook
// relations; time spacing and magnitudes are schematic, not measured.
const HEART_IMAGE = new URL('./assets/conduction-heart.webp', import.meta.url).href;
const SVG_NS = 'http://www.w3.org/2000/svg';
const text = (tr, en) => ({ tr, en });
const HEART = { x: 0, y: 30, w: 300, h: 389 };
const hp = (fx, fy) => [HEART.x + fx * HEART.w, HEART.y + fy * HEART.h];
const AXIS = { x0: 430, x1: 890 };
const tx = u => AXIS.x0 + u * (AXIS.x1 - AXIS.x0);

/** Conduction landmarks projected from the 3D model (fractions of the render). */
const POINTS = {
  sa: [[0.178, 0.319]], atrial: [[0.254, 0.444], [0.373, 0.394]], av: [[0.266, 0.567]], his: [[0.318, 0.559]],
  bundle: [[0.395, 0.577], [0.449, 0.709]], purkinje: [[0.704, 0.893], [0.746, 0.877], [0.875, 0.823]], ventricle: [[0.637, 0.685], [0.45, 0.8]],
};
/** Sites in activation order: onset/end on the cycle axis and AP shape. Purkinje has the longest AP. */
const SITES = [
  { id: 'sa', name: text('SA düğümü', 'SA node'), on: 0.02, off: 0.3, shape: 'nodal', color: '#3f8fd0' },
  { id: 'atrial', name: text('Atriyum kası', 'Atrial muscle'), on: 0.05, off: 0.24, shape: 'atrial', color: '#5f9a3c' },
  { id: 'av', name: text('AV düğüm', 'AV node'), on: 0.1, off: 0.4, shape: 'nodal', color: '#e0a92a' },
  { id: 'his', name: text('His demeti', 'Bundle of His'), on: 0.19, off: 0.58, shape: 'fast', color: '#e48a4a' },
  { id: 'bundle', name: text('Dal blokları', 'Bundle branches'), on: 0.2, off: 0.61, shape: 'fast', color: '#d9455f' },
  { id: 'purkinje', name: text('Purkinje lifleri', 'Purkinje fibers'), on: 0.21, off: 0.64, shape: 'fast', color: '#8a5aa0' },
  { id: 'ventricle', name: text('Ventrikül kası', 'Ventricular muscle'), on: 0.22, off: 0.6, shape: 'fast', color: '#7f93a8' },
];
/**
 * Frontal mean vector keyframes [u, angle°, magnitude]; 0° = patient's left, +90° = inferior.
 * P ≈ +60°, septum rightward (q in I), apex inferior, LV free wall leftward, base superior
 * (terminal S in III), T concordant with QRS.
 */
const VECTOR_KEYS = [
  [0, 0, 0], [0.05, 60, 0], [0.09, 60, 0.25], [0.13, 60, 0], [0.22, 165, 0], [0.232, 165, 0.22], [0.245, 55, 0.7],
  [0.255, 20, 1], [0.262, -100, 0.3], [0.268, -100, 0], [0.45, 45, 0], [0.53, 45, 0.33], [0.6, 45, 0], [1, 0, 0],
];
const LEADS = [['I', 0], ['II', 60], ['III', 120]];
const STAGES = [
  [0, 0.05, text('SA düğümü uyarı üretir (yüzey EKG’de görünmez)', 'SA node fires (not visible on the surface ECG)')],
  [0.05, 0.13, text('Atriyal depolarizasyon → P dalgası', 'Atrial depolarization → P wave')],
  [0.13, 0.22, text('AV düğümde gecikme → PR segmenti', 'Delay at the AV node → PR segment')],
  [0.22, 0.235, text('Septal depolarizasyon (soldan sağa) → q', 'Septal depolarization (left to right) → q')],
  [0.235, 0.25, text('Apikal depolarizasyon → R yükselir', 'Apical depolarization → R rises')],
  [0.25, 0.268, text('LV serbest duvarı ve bazal bölge → R tepe, S', 'LV free wall and base → R peak, S')],
  [0.268, 0.45, text('Ventriküller depolarize → ST segmenti', 'Ventricles depolarized → ST segment')],
  [0.45, 0.6, text('Ventriküler repolarizasyon → T dalgası', 'Ventricular repolarization → T wave')],
  [0.6, 1, text('Diyastol', 'Diastole')],
];
/** Depolarized regions (blue) in render fractions: [cx, cy, rx, ry, rotate°, on, full, repolStart, repolEnd]. */
const REGIONS = [
  [0.19, 0.55, 0.11, 0.2, 0, 0.05, 0.11, 0.22, 0.265], [0.46, 0.42, 0.14, 0.07, -10, 0.07, 0.13, 0.22, 0.265],
  [0.52, 0.72, 0.3, 0.06, 52, 0.22, 0.235, 0.45, 0.6], [0.76, 0.88, 0.1, 0.09, 0, 0.235, 0.25, 0.45, 0.6],
  [0.45, 0.8, 0.15, 0.11, 0, 0.24, 0.255, 0.45, 0.6], [0.78, 0.63, 0.12, 0.25, -15, 0.25, 0.265, 0.45, 0.6],
];

function vectorAt(u) {
  const i = VECTOR_KEYS.findIndex((key, index) => index < VECTOR_KEYS.length - 1 && u >= key[0] && u < VECTOR_KEYS[index + 1][0]);
  const [u0, a0, m0] = VECTOR_KEYS[Math.max(0, i)], [u1, a1, m1] = VECTOR_KEYS[Math.max(0, i) + 1];
  const f = (u - u0) / (u1 - u0 || 1), rad = deg => deg * Math.PI / 180;
  const x = (1 - f) * m0 * Math.cos(rad(a0)) + f * m1 * Math.cos(rad(a1));
  const y = (1 - f) * m0 * Math.sin(rad(a0)) + f * m1 * Math.sin(rad(a1));
  return [x, y];
}
const project = ([x, y], axisDeg) => x * Math.cos(axisDeg * Math.PI / 180) + y * Math.sin(axisDeg * Math.PI / 180);
function leadPath(axisDeg, yBase, gain) {
  const parts = [];
  for (let u = 0; u <= 1.0001; u += 0.002) parts.push(`${parts.length ? 'L' : 'M'}${tx(u).toFixed(1)} ${(yBase - project(vectorAt(u), axisDeg) * gain).toFixed(1)}`);
  return parts.join(' ');
}
function apPath(site, yb) {
  const { on: a, off: b, shape } = site, x = tx;
  if (shape === 'nodal') return `M${x(0)} ${yb - 6} L${x(a)} ${yb - 12} Q${x(a + 0.02)} ${yb - 32} ${x(a + 0.05)} ${yb - 30} Q${x(b - 0.06)} ${yb - 26} ${x(b)} ${yb} L${x(1)} ${yb - 10}`;
  if (shape === 'atrial') return `M${x(0)} ${yb} H${x(a)} L${x(a + 0.006)} ${yb - 30} Q${x(a + 0.06)} ${yb - 22} ${x(b)} ${yb} H${x(1)}`;
  return `M${x(0)} ${yb} H${x(a)} L${x(a + 0.006)} ${yb - 32} L${x(a + 0.02)} ${yb - 24} L${x(b - 0.08)} ${yb - 22} Q${x(b - 0.03)} ${yb - 18} ${x(b)} ${yb} H${x(1)}`;
}

const TRIANGLE = { ra: [50, 455], la: [250, 455], ll: [150, 628], c: [150, 512], scale: 62 };

export function createConductionView({ mount, getLang, onSeek }) {
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const root = document.createElement('div');
  root.className = 'epcond';
  const rows = SITES.map((site, i) => {
    const yb = 52 + i * 40;
    return `<g class="epcond-row" data-site="${site.id}"><text x="${AXIS.x0 - 10}" y="${yb - 8}" text-anchor="end"></text>
      <path class="epcond-ap-ghost" d="${apPath(site, yb)}"/><path class="epcond-ap" d="${apPath(site, yb)}" stroke="${site.color}" clip-path="url(#epcond-clip)"/></g>`;
  }).join('');
  const leads = LEADS.map(([name, axis], i) => {
    const yb = 380 + i * 82;
    return `<g class="epcond-lead"><text x="${AXIS.x0 - 10}" y="${yb + 4}" text-anchor="end">${name}</text><path class="epcond-ap-ghost" d="${leadPath(axis, yb, 52)}"/><path class="epcond-lead-ink" d="${leadPath(axis, yb, 52)}" clip-path="url(#epcond-clip)"/></g>`;
  }).join('');
  const { ra, la, ll } = TRIANGLE;
  root.innerHTML = `<svg class="epcond-map" viewBox="0 0 900 640" role="img"><title></title>
    <defs><clipPath id="epcond-clip"><rect class="epcond-clip-rect" x="${AXIS.x0}" y="0" height="640" width="0"/></clipPath>
      <marker id="epcond-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#1f2a36"/></marker>
      <marker id="epcond-arrow-pink" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#c2317a"/></marker></defs>
    <text class="epcond-stage" x="8" y="18"></text>
    <image href="${HEART_IMAGE}" x="${HEART.x}" y="${HEART.y}" width="${HEART.w}" height="${HEART.h}"/>
    <g class="epcond-regions"></g><g class="epcond-glows"></g>
    <line class="epcond-vector" stroke="#1f2a36" stroke-width="5" marker-end="url(#epcond-arrow)" stroke-linecap="round"/>
    <g class="epcond-triangle"><path d="M${ra} L${la} L${ll} Z" fill="none" stroke="#c2317a" stroke-width="2.5"/>
      <text x="150" y="447" text-anchor="middle">I</text><text x="88" y="552" text-anchor="end">II</text><text x="212" y="552">III</text>
      <g class="epcond-proj"></g><line class="epcond-tri-vector" stroke="#1f2a36" stroke-width="4" marker-end="url(#epcond-arrow)"/></g>
    <g class="epcond-rows">${rows}</g><g class="epcond-leads">${leads}</g>
    <text class="epcond-leads-title" x="${AXIS.x0}" y="340"></text>
    <line class="epcond-cursor" x1="${AXIS.x0}" x2="${AXIS.x0}" y1="10" y2="630"/>
    <rect class="epcond-scrub" x="${AXIS.x0}" y="0" width="${AXIS.x1 - AXIS.x0}" height="640" fill="transparent"/>
  </svg>`;
  mount.append(root);
  const $ = selector => root.querySelector(selector);
  for (const [cx, cy, rx, ry, rot] of REGIONS) {
    const [x, y] = hp(cx, cy);
    $('.epcond-regions').insertAdjacentHTML('beforeend', `<ellipse cx="${x}" cy="${y}" rx="${rx * HEART.w}" ry="${ry * HEART.h}" transform="rotate(${rot} ${x} ${y})"/>`);
  }
  for (const site of SITES) for (const [fx, fy] of POINTS[site.id]) {
    const [x, y] = hp(fx, fy);
    $('.epcond-glows').insertAdjacentHTML('beforeend', `<circle data-glow="${site.id}" cx="${x}" cy="${y}" r="7" fill="${site.color}"/>`);
  }
  const seekFromEvent = event => {
    const svg = $('.epcond-map'), point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(svg.getScreenCTM().inverse());
    onSeek?.(Math.min(0.999, Math.max(0, (local.x - AXIS.x0) / (AXIS.x1 - AXIS.x0))));
  };
  const scrub = $('.epcond-scrub');
  scrub.addEventListener('pointerdown', event => { scrub.setPointerCapture?.(event.pointerId); seekFromEvent(event); });
  scrub.addEventListener('pointermove', event => { if (event.buttons) seekFromEvent(event); });

  function drawVector(u) {
    const [vx, vy] = vectorAt(u), mag = Math.hypot(vx, vy), [hx, hy] = hp(0.47, 0.64);
    const heartVec = $('.epcond-vector'), triVec = $('.epcond-tri-vector'), { c, scale } = TRIANGLE;
    for (const [node, ox, oy, s] of [[heartVec, hx, hy, 95], [triVec, c[0], c[1], scale]]) {
      node.setAttribute('x1', ox); node.setAttribute('y1', oy);
      node.setAttribute('x2', ox + vx * s); node.setAttribute('y2', oy + vy * s);
      node.style.opacity = mag > 0.04 ? '1' : '0';
    }
    // Component of the vector along each lead axis, drawn on that side of the triangle.
    const sides = [[ra, la, 0], [ra, ll, 60], [la, ll, 120]];
    $('.epcond-proj').innerHTML = sides.map(([p, q, axis]) => {
      const value = project([vx, vy], axis), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const ux = Math.cos(axis * Math.PI / 180), uy = Math.sin(axis * Math.PI / 180), len = value * scale;
      if (Math.abs(len) < 3) return '';
      return `<line x1="${mx - ux * len / 2}" y1="${my - uy * len / 2}" x2="${mx + ux * len / 2}" y2="${my + uy * len / 2}" stroke="#c2317a" stroke-width="4" marker-end="url(#epcond-arrow-pink)"/>`;
    }).join('');
  }
  function update(u) {
    $('.epcond-clip-rect').setAttribute('width', u * (AXIS.x1 - AXIS.x0));
    $('.epcond-cursor').setAttribute('x1', tx(u)); $('.epcond-cursor').setAttribute('x2', tx(u));
    $('.epcond-stage').textContent = t(STAGES.find(([a, b]) => u >= a && u < b)[2]);
    for (const site of SITES) {
      const firing = u >= site.on && u < site.on + 0.03, active = u >= site.on && u < site.off;
      root.querySelectorAll(`[data-glow="${site.id}"]`).forEach(node => { node.setAttribute('r', firing ? 9 : active ? 6 : 4); node.style.opacity = firing ? '1' : active ? '.75' : '.25'; });
      root.querySelector(`[data-site="${site.id}"]`).classList.toggle('is-firing', firing);
    }
    root.querySelectorAll('.epcond-regions ellipse').forEach((node, i) => {
      const [, , , , , on, full, r0, r1] = REGIONS[i];
      const rise = Math.min(1, Math.max(0, (u - on) / (full - on))), fall = Math.min(1, Math.max(0, (u - r0) / (r1 - r0)));
      node.style.opacity = String(0.55 * rise * (1 - fall));
    });
    drawVector(u);
  }
  function refresh() {
    root.querySelectorAll('.epcond-row').forEach((row, i) => { row.querySelector('text').textContent = t(SITES[i].name); });
    $('.epcond-leads-title').textContent = t('Ekstremite derivasyonları (vektör izdüşümünden türetilir)', 'Limb leads (derived from the vector projection)');
    $('.epcond-map title').textContent = t('İleti sistemi aktivasyonu, bölgesel aksiyon potansiyelleri ve Einthoven üçgeni', 'Conduction activation, regional action potentials and the Einthoven triangle');
  }
  refresh();
  return { update, refresh };
}
