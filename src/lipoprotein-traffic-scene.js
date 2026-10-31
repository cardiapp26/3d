// Animated lipoprotein traffic: intestine, liver, plasma, muscle/adipose and the arterial intima.
// Particles follow fixed routes; spawn rates come from trafficRates() so the road fills or empties
// with the lab profile. apoB particles that enter the intima stay there for a while (retention).
// Qualitative teaching animation: no kinetics, sizes not to scale.
import { LIPOPROTEINS } from './lipoprotein-traffic-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WALL_X = [170, 330, 520];
const ROUTES = {
  chylomicron: 'M150 110C180 170 200 200 250 200L610 200C640 200 652 182 660 156C620 120 520 108 476 100',
  vldl: 'M360 112C350 160 330 214 290 214L600 214C640 214 655 196 662 156C660 200 640 228 600 228L230 228',
  ldlLiver: 'M24 242L330 242C372 242 392 190 396 124',
  hdl: 'M452 112C480 170 500 240 520 300C540 318 566 312 576 290C600 240 600 200 560 160C530 130 490 120 462 114',
  ...Object.fromEntries(WALL_X.map((x, i) => [`wall${i}`, `M24 246L${x} 246C${x + 20} 252 ${x + 24} 272 ${x + 18} 300`]))
};
/** Kind -> [fill, radius]. Distinct hues across classes for instant visual discrimination. */
const LOOK = {
  chylomicron: ['#00a2c7', 11.5], remnant: ['#0b7285', 7.5], vldl: ['#6339d6', 9.5], idl: ['#e67700', 7.5], ldl: ['#d92626', 6],
  lpa: ['#c2255c', 6.2], hdl: ['#0ca678', 4], hdlLoaded: ['#099268', 5]
};
const APOB_KINDS = new Set(['chylomicron', 'remnant', 'vldl', 'idl', 'ldl', 'lpa']);
const SPEED = 78;
const RETAIN_SECONDS = 14;
const MAX_RETAINED = 40;

export const TRAFFIC_SCENE = `<defs>
    <linearGradient id="lpt-intestine-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7cbb0"/><stop offset="0.5" stop-color="#eab08e"/><stop offset="1" stop-color="#d88c66"/>
    </linearGradient>
    <linearGradient id="lpt-liver-grad" x1="0.1" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#b5483c"/><stop offset="0.5" stop-color="#8f2d24"/><stop offset="1" stop-color="#661b14"/>
    </linearGradient>
    <linearGradient id="lpt-muscle-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9535f"/><stop offset="0.5" stop-color="#b83744"/><stop offset="1" stop-color="#8c222d"/>
    </linearGradient>
    <linearGradient id="lpt-plasma-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9dced"/><stop offset="0.25" stop-color="#e5eff7"/><stop offset="0.75" stop-color="#e5eff7"/><stop offset="1" stop-color="#c7dbec"/>
    </linearGradient>
    <linearGradient id="lpt-intima-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdf4df"/><stop offset="0.65" stop-color="#f5dfB3"/><stop offset="1" stop-color="#e8c78e"/>
    </linearGradient>
    <pattern id="lpt-matrix" width="32" height="22" patternUnits="userSpaceOnUse">
      <path d="M0 7Q8 1 16 7T32 7M0 16Q8 10 16 16T32 16" fill="none" stroke="#d4aa5e" stroke-width="1" opacity="0.55"/>
      <path d="M5 0L12 22M22 0L16 22" fill="none" stroke="#c89646" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.45"/>
    </pattern>
  </defs>

  <!-- ORGAN 1: SMALL INTESTINE (Anatomical coiled jejunal loops + sculpted mucosal villi & lacteal) -->
  <g class="lpt-organ lpt-organ-intestine">
    <!-- Background intestinal coil loops -->
    <path d="M22 44C10 44 10 74 28 76C48 78 64 70 84 74C104 78 106 106 84 110C62 114 38 104 22 112C8 120 12 148 36 150C66 152 114 152 146 144" fill="none" stroke="#d4835c" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M22 44C10 44 10 74 28 76C48 78 64 70 84 74C104 78 106 106 84 110C62 114 38 104 22 112C8 120 12 148 36 150C66 152 114 152 146 144" fill="none" stroke="url(#lpt-intestine-grad)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Cutaway mucosal lumen window showing sculpted finger-like villi & central lacteals -->
    <path d="M84 22C136 18 178 28 182 64C186 102 178 138 152 150C124 160 82 154 70 132C58 110 62 24 84 22Z" fill="#fff7ef" stroke="#b8623b" stroke-width="2.2"/>
    <!-- Plicae & sculpted finger-like villi projecting into lumen -->
    <path d="M168 32C150 32 142 36 142 42C142 48 152 50 166 50C146 52 138 56 138 63C138 70 150 72 166 73C144 75 136 80 136 87C136 94 148 96 166 97C144 99 138 104 138 111C138 118 150 120 164 121C146 123 140 128 140 134C140 140 150 143 162 144L174 138L178 62Z" fill="#e5956b" stroke="#b55d35" stroke-width="1.3"/>
    <!-- Lacteal lymphatic capillaries inside each villus draining into mesenteric lymph trunk -->
    <path d="M148 42H168M144 63H168M142 87H168M144 111H168M146 134H166M166 38V148Q166 164 176 176" fill="none" stroke="#009fb7" stroke-width="2.4" stroke-linecap="round"/>
    <!-- Emulsified dietary lipid droplets in intestinal lumen -->
    <circle cx="94" cy="72" r="4" fill="#009fb7" opacity="0.5"/><circle cx="112" cy="88" r="5" fill="#009fb7" opacity="0.65"/><circle cx="98" cy="108" r="3.5" fill="#009fb7" opacity="0.5"/><circle cx="118" cy="118" r="4.5" fill="#009fb7" opacity="0.65"/>
    <text x="18" y="34" class="lpt-organ-title" data-lpt-label="intestine"/>
  </g>

  <!-- ORGAN 2: ANATOMICAL WEDGE-SHAPED BILOBED LIVER (Right lobe, falciform ligament, tapered left lobe, gallbladder & portal triad) -->
  <g class="lpt-organ lpt-organ-liver">
    <!-- Gallbladder peeking from visceral fossa + cystic duct -->
    <path d="M350 116C344 134 358 148 370 138C378 130 370 114 356 112Z" fill="#4c8527" stroke="#284d10" stroke-width="1.6"/>
    <!-- Portal vein (indigo-blue) & hepatic artery (crimson) entering porta hepatis -->
    <path d="M332 144Q340 124 348 112" fill="none" stroke="#5368a6" stroke-width="5" stroke-linecap="round"/>
    <path d="M342 144Q347 126 353 114" fill="none" stroke="#c92a2a" stroke-width="2.6" stroke-linecap="round"/>
    <!-- True anatomical liver silhouette: large dome-shaped Right Lobe (left) + tapered wedge Left Lobe (right) -->
    <path d="M266 72C264 34 294 12 346 12C374 12 392 18 404 22C424 18 462 20 498 30C522 36 534 46 524 58C510 74 476 86 442 98C422 105 410 108 400 104C392 114 374 122 350 124C316 128 282 136 270 116C264 106 267 88 266 72Z" fill="url(#lpt-liver-grad)" stroke="#521510" stroke-width="2.2"/>
    <!-- Diaphragmatic subcapsular highlight -->
    <path d="M278 52C294 26 332 18 386 22M414 26C448 24 484 30 510 42" fill="none" stroke="#dc857b" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
    <!-- Intrahepatic portal/sinusoidal branching -->
    <path d="M348 112L338 76M338 76L302 56M338 76L368 48M320 66L292 88M408 72L454 52M434 61L476 66" fill="none" stroke="#e08b82" stroke-width="1.8" stroke-linecap="round" opacity="0.48"/>
    <!-- Falciform ligament & round ligament (ligamentum teres) at interlobar fissure -->
    <path d="M402 20Q392 62 400 106" fill="none" stroke="#f5dcd6" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>
    <path d="M400 104Q402 116 396 124" fill="none" stroke="#e8c5bc" stroke-width="2.4" stroke-linecap="round"/>
    <text x="284" y="48" class="lpt-organ-title lpt-organ-title-light" data-lpt-label="liver"/>
  </g>

  <!-- ORGAN 3: SKELETAL MUSCLE BELLY & ADIPOSE TISSUE LOBULES (Fusiform myofibers + Adipocyte cluster + Capillary LPL) -->
  <g class="lpt-organ lpt-organ-tissue">
    <!-- Lobulated white adipose tissue pad (right) -->
    <path d="M648 34C676 22 722 28 738 54C752 78 746 122 720 138C694 152 654 146 642 122C630 98 626 44 648 34Z" fill="#fef3c7" stroke="#d99b26" stroke-width="1.8"/>
    <g fill="#facc15" stroke="#b47809" stroke-width="1.3">
      <circle cx="672" cy="58" r="13"/><circle cx="700" cy="54" r="14"/><circle cx="722" cy="72" r="12.5"/>
      <circle cx="668" cy="86" r="14"/><circle cx="696" cy="84" r="15"/><circle cx="722" cy="100" r="13"/>
      <circle cx="676" cy="114" r="13"/><circle cx="704" cy="114" r="13.5"/>
    </g>
    <g fill="#fef9c3" opacity="0.8">
      <circle cx="668" cy="53" r="4.5"/><circle cx="696" cy="49" r="5"/><circle cx="664" cy="81" r="5"/><circle cx="691" cy="79" r="5.5"/><circle cx="700" cy="109" r="4.5"/>
    </g>
    <!-- Adipocyte signet-ring peripheral nuclei -->
    <g fill="#7c2d12" opacity="0.75">
      <ellipse cx="682" cy="64" rx="2.5" ry="1.4"/><ellipse cx="711" cy="59" rx="2.5" ry="1.4"/><ellipse cx="680" cy="92" rx="2.5" ry="1.4"/><ellipse cx="709" cy="90" rx="2.5" ry="1.4"/>
    </g>
    <!-- Fusiform Skeletal Muscle Belly with tendinous ends & striations (left) -->
    <path d="M598 28L608 40L590 42Z" fill="#e5d5c5" stroke="#a89078" stroke-width="1.2"/>
    <path d="M582 38C564 60 562 106 584 134C596 148 622 148 636 132C654 106 652 60 632 38C618 24 594 24 582 38Z" fill="url(#lpt-muscle-grad)" stroke="#6e1720" stroke-width="2"/>
    <!-- Perimysium fascicle lines & sarcomere cross-striations -->
    <path d="M594 32C580 64 580 104 596 140M610 30C606 64 606 104 610 142M624 32C636 64 636 104 622 140" fill="none" stroke="#f8b4bc" stroke-width="1.3" opacity="0.65"/>
    <path d="M572 56H644M568 72H646M568 88H648M570 104H646M576 120H640" fill="none" stroke="#fbcfe8" stroke-width="1.1" stroke-dasharray="4 3" opacity="0.55"/>
    <!-- Capillary vessel bed wrapping muscle & adipose base where LPL sits -->
    <path d="M576 142C612 154 662 154 724 140" fill="none" stroke="#c92a2a" stroke-width="4.5" stroke-linecap="round" opacity="0.8"/>
    <path d="M576 142C612 154 662 154 724 140" fill="none" stroke="#fca5a5" stroke-width="1.6" stroke-dasharray="6 6"/>
    <text x="656" y="21" text-anchor="middle" class="lpt-organ-title" data-lpt-label="tissue"/>
  </g>

  <!-- CONTIGUOUS ARTERIAL WALL & LUMEN: Upper Wall -> Plasma Lumen -> Endothelium -> Subendothelial Intima -> Media -->
  <g class="lpt-artery">
    <!-- Upper arterial wall (Tunica media + upper endothelium) -->
    <rect x="10" y="172" width="740" height="10" rx="5" fill="#d88b86" stroke="#8c3b45" stroke-width="1.5"/>
    <!-- Arterial Lumen (Plasma bloodstream) -->
    <rect x="10" y="182" width="740" height="78" fill="url(#lpt-plasma-grad)" stroke="#8c3b45" stroke-width="1.8"/>
    <!-- Subtle laminar flow lines & biconcave RBCs in plasma -->
    <path d="M36 202H720M28 228H728" stroke="#9ab7cf" stroke-width="1.2" stroke-dasharray="10 14" opacity="0.65"/>
    <g fill="#d94854" stroke="#a61e2b" stroke-width="0.8" opacity="0.28">
      <ellipse cx="92" cy="196" rx="8" ry="3.8"/><ellipse cx="282" cy="242" rx="8" ry="3.8"/><ellipse cx="468" cy="194" rx="8" ry="3.8"/><ellipse cx="612" cy="240" rx="8" ry="3.8"/>
    </g>
    <text x="738" y="252" text-anchor="end" class="lpt-small lpt-zone-tag" data-lpt-label="plasma"/>

    <!-- Lower Endothelial Monolayer (Cobblestone endothelial cells with nuclei & entry gaps) -->
    <path d="M10 262H750" class="lpt-endothelium"/>
    <g fill="#f2aba4" stroke="#8f342f" stroke-width="1.1">
      <rect x="14" y="258" width="46" height="8" rx="4"/><rect x="64" y="258" width="46" height="8" rx="4"/><rect x="114" y="258" width="44" height="8" rx="4"/>
      <rect x="192" y="258" width="46" height="8" rx="4"/><rect x="242" y="258" width="46" height="8" rx="4"/><rect x="292" y="258" width="32" height="8" rx="4"/>
      <rect x="356" y="258" width="46" height="8" rx="4"/><rect x="406" y="258" width="46" height="8" rx="4"/><rect x="456" y="258" width="46" height="8" rx="4"/>
      <rect x="548" y="258" width="46" height="8" rx="4"/><rect x="598" y="258" width="46" height="8" rx="4"/><rect x="648" y="258" width="46" height="8" rx="4"/><rect x="698" y="258" width="46" height="8" rx="4"/>
    </g>
    <g fill="#691b17" opacity="0.75">
      <ellipse cx="37" cy="262" rx="5" ry="1.8"/><ellipse cx="87" cy="262" rx="5" ry="1.8"/><ellipse cx="136" cy="262" rx="5" ry="1.8"/>
      <ellipse cx="215" cy="262" rx="5" ry="1.8"/><ellipse cx="265" cy="262" rx="5" ry="1.8"/><ellipse cx="379" cy="262" rx="5" ry="1.8"/>
      <ellipse cx="429" cy="262" rx="5" ry="1.8"/><ellipse cx="479" cy="262" rx="5" ry="1.8"/><ellipse cx="571" cy="262" rx="5" ry="1.8"/>
      <ellipse cx="621" cy="262" rx="5" ry="1.8"/><ellipse cx="671" cy="262" rx="5" ry="1.8"/><ellipse cx="721" cy="262" rx="5" ry="1.8"/>
    </g>

    <!-- Subendothelial Tunica Intima (Proteoglycan matrix, foam cells & atheroma mounds) -->
    <rect x="10" y="266" width="740" height="72" fill="url(#lpt-intima-grad)" stroke="#b88842" stroke-width="1.6"/>
    <rect x="12" y="268" width="736" height="68" fill="url(#lpt-matrix)"/>
    <!-- Subendothelial atheromatous retention mounds & foamy macrophages at entry sites -->
    <path d="M114 336Q184 274 256 336Z" fill="#f0c265" opacity="0.48"/>
    <path d="M274 336Q348 270 422 336Z" fill="#f0c265" opacity="0.52"/>
    <path d="M464 336Q538 274 612 336Z" fill="#f0c265" opacity="0.48"/>
    <!-- Foam cell silhouettes inside intima -->
    <g fill="#f7d88b" stroke="#b88228" stroke-width="1" opacity="0.7">
      <circle cx="158" cy="318" r="9"/><circle cx="155" cy="316" r="2.5" fill="#8c5812"/>
      <circle cx="322" cy="316" r="10"/><circle cx="319" cy="314" r="2.8" fill="#8c5812"/>
      <circle cx="514" cy="318" r="9.5"/><circle cx="511" cy="316" r="2.5" fill="#8c5812"/>
    </g>
    <!-- Internal Elastic Lamina (fenestrated wavy elastic membrane) & Tunica Media VSMCs -->
    <path d="M10 338Q22 334 34 338T58 338T82 338T106 338T130 338T154 338T178 338T202 338T226 338T250 338T274 338T298 338T322 338T346 338T370 338T394 338T418 338T442 338T466 338T490 338T514 338T538 338T562 338T586 338T610 338T634 338T658 338T682 338T706 338T750 338" fill="none" stroke="#8c2d38" stroke-width="2.2"/>
    <rect x="10" y="340" width="740" height="14" rx="6" fill="#d88b86" stroke="#8c3b45" stroke-width="1.5"/>
    <g fill="#b85d58" stroke="#7a2824" stroke-width="0.8" opacity="0.8">
      <ellipse cx="64" cy="347" rx="22" ry="3.2"/><ellipse cx="148" cy="347" rx="22" ry="3.2"/><ellipse cx="232" cy="347" rx="22" ry="3.2"/>
      <ellipse cx="316" cy="347" rx="22" ry="3.2"/><ellipse cx="400" cy="347" rx="22" ry="3.2"/><ellipse cx="484" cy="347" rx="22" ry="3.2"/>
      <ellipse cx="568" cy="347" rx="22" ry="3.2"/><ellipse cx="652" cy="347" rx="22" ry="3.2"/>
    </g>
    <text x="22" y="328" class="lpt-small lpt-zone-tag" data-lpt-label="intima"/>
  </g>

  <g class="lpt-retained"></g><g class="lpt-particles"></g>

  <!-- RECEPTOR & ENZYME TAGS -->
  <g class="lpt-tag lpt-tag-ldlr"><path d="M396 108V98M396 98L390 91M396 98L402 91" fill="none" stroke="#d92b2b" stroke-width="2.2" stroke-linecap="round"/><rect x="368" y="108" width="56" height="22" rx="7"/><text x="396" y="123" text-anchor="middle">LDL-R</text></g>
  <g class="lpt-tag lpt-tag-srbi"><path d="M462 100V90M456 90H468" fill="none" stroke="#0ca678" stroke-width="2.2" stroke-linecap="round"/><rect x="436" y="100" width="52" height="22" rx="7"/><text x="462" y="115" text-anchor="middle">SR-BI</text></g>
  <g class="lpt-tag lpt-tag-lpl"><path d="M658 142V132" fill="none" stroke="#6741d9" stroke-width="2.2" stroke-linecap="round"/><rect x="634" y="142" width="48" height="22" rx="7"/><text x="658" y="157" text-anchor="middle">LPL</text></g>`;

const add = (parent, tag) => parent.appendChild(document.createElementNS(SVG_NS, tag));

function applyLook(el, base, look) {
  const kind = look === 'remnant' ? 'chylomicron' : look === 'hdlLoaded' ? 'hdl' : look;
  el.dataset.kind = kind;
  base.dataset.kind = kind;
  const isApoB = APOB_KINDS.has(look);
  el.classList.toggle('is-apob', isApoB);
  base.classList.toggle('is-apob', isApoB);

  while (el.childNodes.length > 1) el.removeChild(el.lastChild);

  if (look === 'chylomicron') {
    base.setAttribute('r', '11.5');
    base.setAttribute('fill', '#00a2c7');
    base.setAttribute('stroke', '#ffffff');
    base.setAttribute('stroke-width', '1.8');
    const c1 = add(el, 'circle');
    c1.setAttribute('r', '6'); c1.setAttribute('fill', '#e0f7fa'); c1.setAttribute('opacity', '0.35');
    const c2 = add(el, 'circle');
    c2.setAttribute('cx', '-2.5'); c2.setAttribute('cy', '-2.5'); c2.setAttribute('r', '2'); c2.setAttribute('fill', '#ffffff'); c2.setAttribute('opacity', '0.85');
  } else if (look === 'remnant') {
    base.setAttribute('r', '7.5');
    base.setAttribute('fill', '#0b7285');
    base.setAttribute('stroke', '#ffffff');
    base.setAttribute('stroke-width', '1.5');
    const c = add(el, 'circle');
    c.setAttribute('cx', '-1.5'); c.setAttribute('cy', '-1.5'); c.setAttribute('r', '1.6'); c.setAttribute('fill', '#ffffff'); c.setAttribute('opacity', '0.8');
  } else if (look === 'vldl') {
    base.setAttribute('r', '9.5');
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', 'none');
    const rect = add(el, 'rect');
    rect.setAttribute('x', '-7'); rect.setAttribute('y', '-7');
    rect.setAttribute('width', '14'); rect.setAttribute('height', '14');
    rect.setAttribute('rx', '2.5'); rect.setAttribute('transform', 'rotate(45)');
    rect.setAttribute('fill', '#6339d6'); rect.setAttribute('stroke', '#ffffff'); rect.setAttribute('stroke-width', '1.8');
    const inner = add(el, 'rect');
    inner.setAttribute('x', '-2.8'); inner.setAttribute('y', '-2.8');
    inner.setAttribute('width', '5.6'); inner.setAttribute('height', '5.6');
    inner.setAttribute('rx', '1'); inner.setAttribute('transform', 'rotate(45)');
    inner.setAttribute('fill', '#ffffff'); inner.setAttribute('opacity', '0.5');
  } else if (look === 'idl') {
    base.setAttribute('r', '7.5');
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', 'none');
    const poly = add(el, 'polygon');
    poly.setAttribute('points', '0,-7.2 6.2,-3.6 6.2,3.6 0,7.2 -6.2,3.6 -6.2,-3.6');
    poly.setAttribute('fill', '#e67700'); poly.setAttribute('stroke', '#ffffff'); poly.setAttribute('stroke-width', '1.6');
    const dot = add(el, 'circle');
    dot.setAttribute('r', '2'); dot.setAttribute('fill', '#ffffff'); dot.setAttribute('opacity', '0.6');
  } else if (look === 'ldl') {
    base.setAttribute('r', '6');
    base.setAttribute('fill', '#d92626');
    base.setAttribute('stroke', '#ffffff');
    base.setAttribute('stroke-width', '1.8');
    const ring = add(el, 'circle');
    ring.setAttribute('r', '3.2'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#ffffff'); ring.setAttribute('stroke-width', '1.2');
    const center = add(el, 'circle');
    center.setAttribute('r', '1.4'); center.setAttribute('fill', '#d92626');
  } else if (look === 'lpa') {
    base.setAttribute('r', '6.2');
    base.setAttribute('fill', '#c2255c');
    base.setAttribute('stroke', '#ffffff');
    base.setAttribute('stroke-width', '1.8');
    for (const [kx, ky] of [[6.2, -3.2], [7.2, 1.6], [4.5, 5.8]]) {
      const k = add(el, 'circle');
      k.setAttribute('cx', kx); k.setAttribute('cy', ky); k.setAttribute('r', '2.4');
      k.setAttribute('fill', '#f06595'); k.setAttribute('stroke', '#ffffff'); k.setAttribute('stroke-width', '0.9');
    }
  } else if (look === 'hdl') {
    base.setAttribute('r', '4');
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', 'none');
    const ell = add(el, 'ellipse');
    ell.setAttribute('rx', '6.5'); ell.setAttribute('ry', '3.8');
    ell.setAttribute('fill', '#0ca678'); ell.setAttribute('stroke', '#ffffff'); ell.setAttribute('stroke-width', '1.4');
    const shine = add(el, 'ellipse');
    shine.setAttribute('rx', '3.2'); shine.setAttribute('ry', '1.6');
    shine.setAttribute('fill', '#ffffff'); shine.setAttribute('opacity', '0.5');
  } else if (look === 'hdlLoaded') {
    base.setAttribute('r', '5');
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', 'none');
    const ell = add(el, 'ellipse');
    ell.setAttribute('rx', '8'); ell.setAttribute('ry', '4.6');
    ell.setAttribute('fill', '#099268'); ell.setAttribute('stroke', '#ffffff'); ell.setAttribute('stroke-width', '1.5');
    const shine = add(el, 'ellipse');
    shine.setAttribute('rx', '4'); shine.setAttribute('ry', '2');
    shine.setAttribute('fill', '#ffffff'); shine.setAttribute('opacity', '0.55');
  }
}

/**
 * @param {SVGSVGElement} svg element that already holds TRAFFIC_SCENE
 * @param {{ reducedMotion?: boolean, onCount?: (counts: {road:number, wall:number}) => void }} options
 */
export function createTrafficScene(svg, { reducedMotion = false, onCount = () => {} } = {}) {
  const layer = svg.querySelector('.lpt-particles');
  const retainedLayer = svg.querySelector('.lpt-retained');
  const routes = Object.fromEntries(Object.entries(ROUTES).map(([id, d]) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'lpt-route');
    path.dataset.route = id;
    svg.insertBefore(path, retainedLayer);
    return [id, { path, length: path.getTotalLength() }];
  }));
  let rates = { ldl: 0, vldl: 0, chylomicron: 0, lpa: 0, hdl: 0, wallLdl: 0, wallLpa: 0 };
  let debt = {}, last = 0, running = true, clock = 0, lastCount = '';
  const particles = [], retained = [];

  function spawn(kind) {
    let route = kind === 'ldl' || kind === 'lpa' ? 'ldlLiver' : kind;
    const wallChance = kind === 'ldl' ? rates.wallLdl : kind === 'lpa' ? rates.wallLpa : 0;
    if (Math.random() < wallChance) route = `wall${Math.floor(Math.random() * WALL_X.length)}`;
    const el = add(layer, 'g');
    el.setAttribute('class', 'lpt-p');
    const base = add(el, 'circle');
    base.setAttribute('class', 'lpt-p-base');
    particles.push({ el, base, kind, route, s: 0, look: '' });
  }

  /** What a particle looks like at its fraction of the route (VLDL shrinks into IDL and LDL). */
  function lookOf(p, f) {
    if (p.kind === 'chylomicron') return f < 0.62 ? 'chylomicron' : 'remnant';
    if (p.kind === 'vldl') return f < 0.56 ? 'vldl' : f < 0.8 ? 'idl' : 'ldl';
    if (p.kind === 'hdl') return f < 0.42 ? 'hdl' : 'hdlLoaded';
    return p.kind;
  }

  function retain(p) {
    const end = routes[p.route].path.getPointAtLength(routes[p.route].length);
    const el = add(retainedLayer, 'g');
    const x = (end.x + (Math.random() - 0.5) * 70).toFixed(1);
    const y = (284 + Math.random() * 44).toFixed(1);
    el.setAttribute('transform', `translate(${x}, ${y})`);
    el.setAttribute('class', 'lpt-retained-p');
    el.dataset.kind = p.kind;
    const base = add(el, 'circle');
    base.setAttribute('class', 'lpt-retained-base');
    base.dataset.kind = p.kind;

    if (p.kind === 'lpa') {
      base.setAttribute('r', '5');
      base.setAttribute('fill', '#c2255c');
      base.setAttribute('stroke', '#ffffff');
      base.setAttribute('stroke-width', '1.4');
      for (const [kx, ky] of [[5, -2.6], [5.8, 1.3], [3.6, 4.6]]) {
        const k = add(el, 'circle');
        k.setAttribute('cx', kx); k.setAttribute('cy', ky); k.setAttribute('r', '2');
        k.setAttribute('fill', '#f06595'); k.setAttribute('stroke', '#ffffff'); k.setAttribute('stroke-width', '0.8');
      }
    } else {
      base.setAttribute('r', '4.6');
      base.setAttribute('fill', '#d92626');
      base.setAttribute('stroke', '#ffffff');
      base.setAttribute('stroke-width', '1.4');
      const ring = add(el, 'circle');
      ring.setAttribute('r', '2.2'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#ffffff'); ring.setAttribute('stroke-width', '1');
      const dot = add(el, 'circle');
      dot.setAttribute('r', '1'); dot.setAttribute('fill', '#d92626');
    }
    retained.push({ el, born: clock });
    while (retained.length > MAX_RETAINED) retained.shift().el.remove();
  }

  const emit = (key, rate, dt) => {
    debt[key] = (debt[key] || 0) + rate * dt;
    while (debt[key] >= 1) { debt[key] -= 1; spawn(key); }
  };

  function step(dt) {
    clock += dt;
    for (const kind of ['ldl', 'vldl', 'chylomicron', 'lpa', 'hdl']) emit(kind, rates[kind], dt);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i], route = routes[p.route];
      p.s += dt * SPEED;
      if (p.s >= route.length) {
        if (p.route.startsWith('wall')) retain(p);
        p.el.remove(); particles.splice(i, 1); continue;
      }
      const point = route.path.getPointAtLength(p.s), look = lookOf(p, p.s / route.length);
      p.el.setAttribute('transform', `translate(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
      if (look !== p.look) {
        p.look = look;
        applyLook(p.el, p.base, look);
      }
    }
    while (retained.length && clock - retained[0].born > RETAIN_SECONDS) retained.shift().el.remove();
    report();
  }

  function report() {
    const counts = { road: particles.filter(p => APOB_KINDS.has(p.look)).length, wall: retained.length };
    const key = `${counts.road}:${counts.wall}`;
    if (key !== lastCount) { lastCount = key; onCount(counts); }
  }

  function warm() {
    particles.splice(0).forEach(p => p.el.remove());
    retained.splice(0).forEach(r => r.el.remove());
    debt = {}; clock = 0;
    for (let i = 0; i < 160; i += 1) step(0.1);
  }

  function setRates(next) {
    rates = { ...next };
    if (reducedMotion) warm();
  }

  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (running && !reducedMotion) step(dt);
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(entries => { running = entries[0].isIntersecting; }).observe(svg);
  requestAnimationFrame(tick);
  return { setRates, warm, counts: () => ({ road: particles.filter(p => APOB_KINDS.has(p.look)).length, wall: retained.length }) };
}
