// Animated lipoprotein pathways. Particles follow fixed routes; the selected drug changes the
// step it acts on (relative rates, receptor count, branch probabilities). Qualitative teaching
// animation: no concentrations, kinetics or dose response.
const SVG_NS = 'http://www.w3.org/2000/svg';
const text = (tr, en) => ({ tr, en });

const ROUTES = {
  dietIn: 'M62 52C70 120 80 170 92 202L150 224C190 240 200 270 226 283L330 300C345 310 352 322 360 334',
  dietOut: 'M62 52C60 150 66 260 70 330L62 384',
  hmg: 'M330 60C360 70 380 90 420 104L520 108C540 108 556 110 586 112',
  vldlUp: 'M402 180L402 248C404 270 420 283 450 283L596 283C600 262 597 232 592 196',
  vldlStay: 'M402 180L402 248C404 270 420 283 450 283L692 283',
  bileBack: 'M332 150C262 140 202 126 162 132C130 162 140 232 182 302C232 334 272 252 302 178',
  bileOut: 'M332 150C262 140 202 126 162 132C112 182 82 302 62 384',
  pcsk9: 'M500 136C530 158 548 174 566 190',
  fa: 'M486 330C492 360 500 384 506 410',
};
/** Baseline relative spawn rates (per second) and branch shares. */
const BASE = { diet: 1.2, absorbed: 0.7, hmg: 1.5, vldl: 1.3, bile: 1, reabsorbed: 0.9, pcsk9: 0.5, fa: 0.6, receptors: 3, morph: [0.42, 0.58] };
/** Drug → overrides and the plugged site. Directions follow the mechanism, magnitudes are illustrative. */
export const LIPID_EFFECTS = {
  statin: { hmg: 0.35, receptors: 6, plug: 'synthesis' },
  ezetimibe: { absorbed: 0.2, receptors: 5, plug: 'absorption' },
  pcsk9: { receptors: 6, pcsk9Bound: true, plug: 'receptor' },
  bile: { reabsorbed: 0.25, receptors: 5, plug: 'bile' },
  fibrate: { morph: [0.3, 0.44], fa: 1.4, boost: 'lpl' },
  niacin: { vldl: 0.45, plug: 'vldl' },
};
const RECEPTOR_X = [540, 556, 572, 588, 604, 620];
const STYLE = {
  diet: ['#e9b44a', 5.5], chylo: ['#f0d68e', 10], hmg: ['#5f9a5a', 5.5], bile: ['#5f9a2f', 6], pcsk9: ['#c2463c', 5.5], fa: ['#d98a3a', 4.5],
  vldl: ['#b8923c', 11], idl: ['#d6a73e', 8.5], ldl: ['#e2741e', 7],
};

export const LIPID_SCENE = `<defs><marker id="lipid-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#799b8c"/></marker>
    <pattern id="lipid-villi" width="16" height="22" patternUnits="userSpaceOnUse"><path d="M0 22V8Q8 -4 16 8V22" fill="#ecd3b3" stroke="#d8b892"/></pattern></defs>
  <rect x="20" y="40" width="160" height="300" rx="40" fill="#f6ead9"/><rect x="118" y="52" width="50" height="276" fill="url(#lipid-villi)" opacity=".9"/>
  <text x="34" y="34" data-lipid-label="intestine"/><text x="30" y="70" class="lipidlab-small" data-lipid-label="lumen"/>
  <path d="M280 52Q440 4 636 58Q664 180 496 194Q342 196 280 52Z" fill="#dcb2a9" stroke="#bb867b" stroke-width="2"/>
  <ellipse cx="470" cy="70" rx="26" ry="18" fill="#c58f86"/><text x="388" y="40" data-lipid-label="liver"/>
  <rect x="210" y="238" width="482" height="90" rx="44" fill="#ecc8bf" stroke="#cf9d92" stroke-width="2"/><text x="222" y="352" data-lipid-label="blood"/>
  <rect x="360" y="398" width="280" height="54" rx="18" fill="#f1e2bd"/><text x="380" y="430" data-lipid-label="tissue"/>
  <path data-lipid-conversion="idl-ldl" d="M484 280H511" stroke="none"/>
  <g class="lipidlab-arrows"><path d="M402 172V232"/><path d="M180 224H214"/></g>
  <text x="410" y="270" class="lipidlab-small">VLDL → IDL → LDL</text>
  <g class="lipidlab-receptors"></g><g class="lipidlab-particles"></g>
  <g data-lipid-site="absorption"><rect x="54" y="186" width="108" height="34"/><text x="72" y="209">NPC1L1</text></g>
  <g data-lipid-site="bile"><rect x="186" y="110" width="118" height="34"/><text x="198" y="133" data-lipid-label="bile"/></g>
  <g data-lipid-site="synthesis"><rect x="402" y="88" width="120" height="34"/><text x="420" y="111">HMG-CoA</text></g>
  <g data-lipid-site="receptor"><rect x="530" y="200" width="104" height="30"/><text x="556" y="221">LDL-R</text></g>
  <g data-lipid-site="vldl"><circle cx="402" cy="172" r="15"/><text x="352" y="166" class="lipidlab-small">VLDL</text></g>
  <g data-lipid-site="lpl"><rect x="440" y="326" width="96" height="30"/><text x="470" y="347">LPL</text></g>
  <text x="526" y="122" class="lipidlab-small" data-lipid-label="pool"/>
  <text x="212" y="230" class="lipidlab-small" data-lipid-label="chylomicron"/><text x="30" y="404" data-lipid-label="feces"/>
  <g class="lipidlab-plugs"></g>`;

export function createLipidFlow(svg, { reducedMotion = false } = {}) {
  const layer = svg.querySelector('.lipidlab-particles');
  const routes = Object.fromEntries(Object.entries(ROUTES).map(([id, d]) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d); path.setAttribute('class', 'lipidlab-route');
    svg.insertBefore(path, layer);
    return [id, { path, length: path.getTotalLength() }];
  }));
  let state = { ...BASE }, debt = {}, last = 0, running = true;
  const particles = [];
  function spawn(route, kind) {
    const el = document.createElementNS(SVG_NS, 'circle');
    layer.append(el);
    particles.push({ el, route, kind, s: 0, bound: kind === 'pcsk9' && state.pcsk9Bound });
  }
  const emit = (key, rate, dt, pick) => { debt[key] = (debt[key] || 0) + rate * dt; while (debt[key] >= 1) { debt[key] -= 1; pick(); } };
  function style(p, fraction) {
    let kind = p.kind;
    if (kind === 'diet' && p.route === 'dietIn' && fraction > 0.45) kind = 'chylo';
    if (kind === 'vldl') kind = fraction < state.morph[0] ? 'vldl' : fraction < state.morph[1] ? 'idl' : 'ldl';
    return STYLE[kind];
  }
  function step(dt) {
    emit('diet', state.diet, dt, () => spawn(Math.random() < state.absorbed ? 'dietIn' : 'dietOut', 'diet'));
    emit('hmg', state.hmg, dt, () => spawn('hmg', 'hmg'));
    emit('vldl', state.vldl, dt, () => spawn(Math.random() < state.receptors / 7 ? 'vldlUp' : 'vldlStay', 'vldl'));
    emit('bile', state.bile, dt, () => spawn(Math.random() < state.reabsorbed ? 'bileBack' : 'bileOut', 'bile'));
    emit('pcsk9', state.pcsk9, dt, () => spawn('pcsk9', 'pcsk9'));
    emit('fa', state.fa, dt, () => spawn('fa', 'fa'));
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i], route = routes[p.route];
      const limit = p.bound ? route.length * 0.45 : route.length;
      p.s = Math.min(limit, p.s + dt * 70);
      if (p.s >= route.length || (p.bound && p.s >= limit && (p.hold = (p.hold || 0) + dt) > 1.5)) { p.el.remove(); particles.splice(i, 1); continue; }
      const point = route.path.getPointAtLength(p.s), [color, r] = style(p, p.s / route.length);
      p.el.setAttribute('cx', point.x); p.el.setAttribute('cy', point.y); p.el.setAttribute('r', r); p.el.setAttribute('fill', color);
      p.el.classList.toggle('is-bound', Boolean(p.bound && p.s >= limit));
    }
  }
  function drawReceptors() {
    svg.querySelector('.lipidlab-receptors').innerHTML = RECEPTOR_X.map((x, i) => `<path class="${i < state.receptors ? 'is-on' : ''}" d="M${x} 196V188M${x} 188l-5 -7M${x} 188l5 -7"/>`).join('');
  }
  function setDrug(id) {
    const effect = LIPID_EFFECTS[id] || {};
    state = { ...BASE, ...effect };
    drawReceptors();
    svg.querySelectorAll('[data-lipid-site]').forEach(node => {
      node.classList.toggle('is-plugged', node.dataset.lipidSite === effect.plug);
      node.classList.toggle('is-boosted', node.dataset.lipidSite === effect.boost);
    });
    const plugs = svg.querySelector('.lipidlab-plugs');
    plugs.innerHTML = '';
    // Badge anchors (top-right corner of each site box); fixed so hidden panels still place them.
    const anchor = { absorption: [162, 186], bile: [304, 110], synthesis: [522, 88], receptor: [634, 200], vldl: [414, 160] }[effect.plug];
    if (anchor) {
      const [x, y] = anchor;
      plugs.innerHTML = `<circle cx="${x}" cy="${y}" r="12"/><path d="M${x - 5} ${y - 5}l10 10m0 -10l-10 10"/>`;
    }
    if (reducedMotion) { particles.splice(0).forEach(p => p.el.remove()); for (let i = 0; i < 40; i += 1) step(0.12); }
  }
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (running && !reducedMotion) step(dt);
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries => { running = entries[0].isIntersecting; }).observe(svg);
  requestAnimationFrame(tick);
  return { setDrug };
}

export const LIPID_SCENE_LABELS = { lumen: text('lümen', 'lumen'), pool: text('kolesterol havuzu', 'cholesterol pool') };
