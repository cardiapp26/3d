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
  diet: ['#15aabf', 5.8], chylo: ['#00a2c7', 10.5], hmg: ['#e67700', 5.8], bile: ['#5c940d', 6.4], pcsk9: ['#ae3ec9', 6], fa: ['#fd7e14', 5],
  vldl: ['#6339d6', 11], idl: ['#e67700', 8.8], ldl: ['#d92626', 7.2],
};

export const LIPID_SCENE = `<defs>
    <marker id="lipid-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10Z" fill="#496a80"/>
    </marker>
    <linearGradient id="lipid-intestine-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7cbb0"/><stop offset="0.5" stop-color="#eab08e"/><stop offset="1" stop-color="#d88c66"/>
    </linearGradient>
    <linearGradient id="lipid-liver-grad" x1="0.1" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#b5483c"/><stop offset="0.5" stop-color="#8f2d24"/><stop offset="1" stop-color="#661b14"/>
    </linearGradient>
    <linearGradient id="lipid-muscle-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9535f"/><stop offset="0.5" stop-color="#b83744"/><stop offset="1" stop-color="#8c222d"/>
    </linearGradient>
    <linearGradient id="lipid-plasma-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9dced"/><stop offset="0.3" stop-color="#e7f0f8"/><stop offset="0.7" stop-color="#e7f0f8"/><stop offset="1" stop-color="#c7dbec"/>
    </linearGradient>
  </defs>

  <!-- ORGAN 1: SMALL INTESTINE (Curved duodenal-jejunal C-loop, plicae circulares, sculpted finger-like villi & lacteal) -->
  <g class="lipidlab-organ-intestine">
    <!-- Outer convoluted duodenal-jejunal C-loop wall -->
    <path d="M52 40C22 40 14 68 18 106C22 140 12 174 16 212C20 250 12 288 20 322C28 350 58 358 98 354C144 350 176 332 180 294C184 256 176 216 180 176C184 136 184 86 168 58C152 36 96 40 52 40Z" fill="url(#lipid-intestine-grad)" stroke="#a85732" stroke-width="2.2"/>
    <!-- Cutaway mucosal lumen -->
    <path d="M56 50C32 50 26 74 28 108C30 142 24 176 26 212C28 248 24 284 30 314C36 338 62 344 98 340C138 336 164 322 168 290C172 254 166 214 168 176C170 138 170 92 156 66C142 46 92 50 56 50Z" fill="#fff7ef" stroke="#d9936c" stroke-width="1.4"/>
    <!-- Plicae circulares folds across lumen -->
    <path d="M34 96Q76 82 118 98M32 134Q76 120 118 136M32 172Q76 158 118 174M32 246Q76 232 118 248M34 284Q76 270 118 286M38 318Q78 306 116 320" fill="none" stroke="#ebb594" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Sculpted finger-like absorptive villi along right mucosal wall + central lacteals -->
    <path d="M156 64C132 64 120 70 120 78C120 86 134 90 156 92C130 94 118 100 118 109C118 118 134 122 156 124C130 126 118 132 118 141C118 150 134 154 156 156C130 158 118 164 118 173C118 182 134 186 156 188C130 190 118 196 118 205C118 214 134 218 156 220C130 222 118 228 118 237C118 246 134 250 156 252C130 254 118 260 118 269C118 278 134 282 156 284C132 286 120 292 120 300C120 308 134 314 154 316L166 298L168 88Z" fill="#e5956b" stroke="#b55d35" stroke-width="1.3"/>
    <path d="M128 78H160M126 109H160M126 141H160M126 173H160M126 237H160M126 269H160M128 300H158M160 72V304" fill="none" stroke="#009fb7" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
    <text x="34" y="30" class="lipidlab-organ-title" data-lipid-label="intestine"/>
    <text x="38" y="74" class="lipidlab-small" data-lipid-label="lumen"/>
  </g>

  <!-- ORGAN 2: ANATOMICAL WEDGE-SHAPED BILOBED LIVER, GALLBLADDER & HEPATOCYTE POOL -->
  <g class="lipidlab-organ-liver">
    <!-- Portal vein (indigo) & hepatic artery (crimson) at porta hepatis -->
    <path d="M366 206Q376 184 384 168" fill="none" stroke="#5368a6" stroke-width="6" stroke-linecap="round"/>
    <path d="M378 206Q384 186 390 170" fill="none" stroke="#c92a2a" stroke-width="3" stroke-linecap="round"/>
    <!-- Anatomical Liver Silhouette: tall domed Right Lobe (left) + falciform notch + tapered wedge Left Lobe (right) -->
    <path d="M274 96C270 38 318 12 396 12C434 12 458 20 474 26C504 20 558 24 612 40C646 50 662 66 650 88C632 120 584 146 534 164C504 174 484 176 470 168C456 184 426 194 388 194C334 194 292 190 278 160C270 142 276 118 274 96Z" fill="url(#lipid-liver-grad)" stroke="#521510" stroke-width="2.4"/>
    <!-- Subcapsular diaphragmatic highlight -->
    <path d="M294 64C322 30 374 20 452 28M488 32C536 30 588 40 628 58" fill="none" stroke="#dc857b" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
    <!-- Intrahepatic portal & sinusoidal vascular tree -->
    <path d="M386 168L376 114M376 114L324 80M376 114L424 66M348 96L308 126M484 124L546 92" fill="none" stroke="#e08b82" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
    <!-- Falciform ligament & round ligament (ligamentum teres) -->
    <path d="M472 24Q458 94 470 170" fill="none" stroke="#f5dcd6" stroke-width="3.4" stroke-linecap="round" opacity="0.88"/>
    <path d="M470 168Q472 182 464 194" fill="none" stroke="#e8c5bc" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Pear-shaped Gallbladder in gallbladder fossa & Cystic/Common Bile Duct -->
    <path d="M312 146C312 128 338 120 360 134C376 144 370 168 350 172C330 176 312 162 312 146Z" fill="#4c8527" stroke="#264a0e" stroke-width="1.8"/>
    <path d="M324 140C334 134 348 134 356 142" fill="none" stroke="#8ce99a" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M314 148C284 144 252 136 220 134" fill="none" stroke="#5c940d" stroke-width="3.2" stroke-linecap="round" opacity="0.8"/>
    <!-- Hepatocyte Intracellular Cholesterol Pool inset -->
    <rect x="520" y="82" width="114" height="52" rx="14" fill="#fcecd2" stroke="#d49b4b" stroke-width="1.8" opacity="0.95"/>
    <circle cx="598" cy="106" r="13" fill="#f59f00" opacity="0.28" stroke="#e67700" stroke-width="1.4"/>
    <text x="388" y="38" class="lipidlab-organ-title lipidlab-organ-title-light" data-lipid-label="liver"/>
  </g>

  <!-- COMPARTMENT 3: SYSTEMIC CIRCULATION / ARTERIAL VESSEL -->
  <g class="lipidlab-compartment-blood">
    <!-- Outer Tunica Media + Adventitia arterial wall -->
    <rect x="206" y="232" width="488" height="102" rx="48" fill="#d88b86" stroke="#8c3b45" stroke-width="2"/>
    <!-- Arterial Lumen (Plasma) -->
    <rect x="212" y="240" width="476" height="86" rx="41" fill="url(#lipid-plasma-grad)" stroke="#a6444f" stroke-width="1.6"/>
    <path d="M244 264H660M244 302H660" stroke="#9ab7cf" stroke-width="1.2" stroke-dasharray="10 14" opacity="0.65"/>
    <g fill="#d94854" stroke="#a61e2b" stroke-width="0.8" opacity="0.28">
      <ellipse cx="268" cy="254" rx="8" ry="3.8"/><ellipse cx="364" cy="312" rx="8" ry="3.8"/><ellipse cx="536" cy="254" rx="8" ry="3.8"/><ellipse cx="640" cy="310" rx="8" ry="3.8"/>
    </g>
    <text x="220" y="354" class="lipidlab-organ-title" data-lipid-label="blood"/>
  </g>

  <!-- ORGAN 4: SKELETAL MUSCLE BELLY & ADIPOSE TISSUE LOBULES -->
  <g class="lipidlab-organ-tissue">
    <!-- Lobulated Adipose Tissue cluster (right) -->
    <path d="M510 390C544 382 628 384 652 404C668 418 662 448 632 458C596 466 530 462 508 446C492 432 490 396 510 390Z" fill="#fef3c7" stroke="#d99b26" stroke-width="1.8"/>
    <g fill="#facc15" stroke="#b47809" stroke-width="1.3">
      <circle cx="538" cy="414" r="12"/><circle cx="564" cy="410" r="13"/><circle cx="592" cy="412" r="12.5"/><circle cx="618" cy="416" r="11.5"/><circle cx="640" cy="426" r="10"/>
      <circle cx="526" cy="436" r="11"/><circle cx="552" cy="436" r="12.5"/><circle cx="580" cy="436" r="13"/><circle cx="608" cy="438" r="12"/><circle cx="632" cy="442" r="9.5"/>
    </g>
    <g fill="#fef9c3" opacity="0.8">
      <circle cx="534" cy="410" r="4"/><circle cx="560" cy="406" r="4.5"/><circle cx="588" cy="408" r="4.5"/><circle cx="548" cy="432" r="4.5"/><circle cx="576" cy="432" r="4.5"/>
    </g>
    <!-- Fusiform Striated Skeletal Muscle Belly with tendinous ends (left) -->
    <path d="M332 424L354 412V436Z" fill="#e5d5c5" stroke="#a89078" stroke-width="1.2"/>
    <path d="M518 424L496 412V436Z" fill="#e5d5c5" stroke="#a89078" stroke-width="1.2"/>
    <path d="M348 414C374 390 472 390 502 414C512 422 512 430 502 438C472 460 374 460 348 438C340 430 340 422 348 414Z" fill="url(#lipid-muscle-grad)" stroke="#6e1720" stroke-width="2"/>
    <path d="M356 416C386 404 464 404 494 416M352 426H498M356 436C386 448 464 448 494 436" fill="none" stroke="#f8b4bc" stroke-width="1.3" opacity="0.65"/>
    <path d="M376 402V448M400 398V452M426 398V452M452 398V452M476 402V448" fill="none" stroke="#fbcfe8" stroke-width="1.1" stroke-dasharray="3 3" opacity="0.55"/>
    <!-- Capillary bed arch above muscle & adipose where LPL acts -->
    <path d="M366 396Q496 386 626 396" fill="none" stroke="#c92a2a" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <text x="500" y="381" text-anchor="middle" class="lipidlab-organ-title" data-lipid-label="tissue"/>
  </g>

  <path data-lipid-conversion="idl-ldl" d="M484 280H511" stroke="none"/>
  <g class="lipidlab-arrows"><path d="M402 188V232"/><path d="M180 224H214"/></g>
  <text x="410" y="270" class="lipidlab-small lipidlab-cascade-tag">VLDL → IDL → LDL</text>
  <g class="lipidlab-receptors"></g><g class="lipidlab-particles"></g>
  <g data-lipid-site="absorption"><rect x="54" y="186" width="108" height="34"/><text x="72" y="209">NPC1L1</text></g>
  <g data-lipid-site="bile"><rect x="186" y="110" width="118" height="34"/><text x="198" y="133" data-lipid-label="bile"/></g>
  <g data-lipid-site="synthesis"><rect x="402" y="88" width="114" height="34"/><text x="416" y="111">HMG-CoA</text></g>
  <g data-lipid-site="receptor"><rect x="530" y="200" width="104" height="30"/><text x="556" y="221">LDL-R</text></g>
  <g data-lipid-site="vldl"><circle cx="402" cy="172" r="15"/><text x="350" y="166" class="lipidlab-small lipidlab-vldl-label">VLDL</text></g>
  <g data-lipid-site="lpl"><rect x="440" y="326" width="96" height="30"/><text x="470" y="347">LPL</text></g>
  <text x="526" y="122" class="lipidlab-small lipidlab-pool-label" data-lipid-label="pool"/>
  <text x="212" y="226" class="lipidlab-small" data-lipid-label="chylomicron"/><text x="30" y="404" class="lipidlab-organ-title" data-lipid-label="feces"/>
  <g class="lipidlab-legend" transform="translate(18 432)">
    <circle cx="8" cy="8" r="5.5" fill="#00a2c7" stroke="#fff" stroke-width="1.2"/><text x="18" y="12" class="lipidlab-small">CM</text>
    <circle cx="54" cy="8" r="5.5" fill="#5c940d" stroke="#fff" stroke-width="1.2"/><text x="64" y="12" class="lipidlab-small">BA</text>
    <circle cx="98" cy="8" r="6" fill="#6339d6" stroke="#fff" stroke-width="1.2"/><text x="108" y="12" class="lipidlab-small">VLDL</text>
    <circle cx="154" cy="8" r="5.5" fill="#e67700" stroke="#fff" stroke-width="1.2"/><text x="164" y="12" class="lipidlab-small">IDL</text>
    <circle cx="198" cy="8" r="5.5" fill="#d92626" stroke="#fff" stroke-width="1.2"/><text x="208" y="12" class="lipidlab-small">LDL</text>
    <circle cx="246" cy="8" r="5" fill="#ae3ec9" stroke="#fff" stroke-width="1.2"/><text x="256" y="12" class="lipidlab-small">PCSK9</text>
  </g>
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
