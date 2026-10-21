import { localize, viewStructures } from './carotid-data.js';

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const labels = {
  tr: {
    orientation: 'Kraniyal', arch: 'LAO 30–45°, ark dalları açılır', noBranches: 'Servikal dal yok',
    bifurcation: 'Bifurkasyon', siphon: 'Karotis sifonu', terminal: 'Terminal bifurkasyon',
    perforators: 'Lentikülostriatlar', normal: 'Distal normal referans', lesion: 'Minimal lümen',
    schematic: 'Şematik, ölçeksiz', posterior: 'Özofagus arkası seyir'
  },
  en: {
    orientation: 'Cranial', arch: 'LAO 30–45° opens arch branches', noBranches: 'No cervical branches',
    bifurcation: 'Bifurcation', siphon: 'Carotid siphon', terminal: 'Terminal bifurcation',
    perforators: 'Lenticulostriates', normal: 'Normal distal reference', lesion: 'Minimal lumen',
    schematic: 'Schematic, not to scale', posterior: 'Retro-oesophageal course'
  }
};

function interactive(item, content, lang, extra = '') {
  const name = esc(localize(item.label, lang));
  return `<g class="carotid-structure" data-structure="${item.id}" role="button" tabindex="0" aria-label="${name}" ${extra}><title>${name}</title>${content}</g>`;
}

const path = (d, width = 11, extra = '') => `<path class="vessel-hit" d="${d}" stroke-width="${Math.max(18, width + 12)}"/><path class="vessel" d="${d}" stroke-width="${width}" ${extra}/>`;
const filledPath = (d, extraClass = '') => `<path class="vessel-hit" d="${d}" stroke-width="18"/><path class="vessel-fill ${extraClass}" d="${d}"/>`;
const vesselLabel = (x, y, text, anchor = 'start') => `<text class="vessel-label" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
const leaderLabel = (x1, y1, x2, y2, text, anchor = 'start') => `<g class="leader-label"><path d="M${x1} ${y1} L${x2} ${y2}"/><text x="${x2 + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)}" y="${y2 - 3}" text-anchor="${anchor}">${esc(text)}</text></g>`;

function frame(inner, lang, subtitle = '', showOrientation = true) {
  const l = labels[lang];
  return `<svg class="carotid-svg" viewBox="0 0 420 360" role="img" aria-label="${esc(subtitle || l.schematic)}">
    <defs>
      <linearGradient id="arteryGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f87171"/><stop offset="1" stop-color="#dc2626"/></linearGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#fca5a5"/></marker>
    </defs>
    <rect class="svg-bg" x="1" y="1" width="418" height="358" rx="18"/>
    ${showOrientation ? `<g class="orientation"><path d="M28 54 V20 M28 20 L23 29 M28 20 L33 29"/><text x="39" y="28">${esc(l.orientation)}</text></g>` : ''}
    ${inner}
    <text class="scale-note" x="404" y="344" text-anchor="end">${esc(l.schematic)}</text>
  </svg>`;
}

const ARCH_LAYOUTS = {
  I: { bct: [166, 94], joint: [126, 60], lcca: [218, 66], lsub: [278, 70] },
  II: { bct: [151, 121], joint: [120, 73], lcca: [207, 76], lsub: [275, 73] },
  III: { bct: [139, 153], joint: [112, 94], lcca: [190, 94], lsub: [269, 78] }
};

function renderArch(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const layout = ARCH_LAYOUTS[state.archType] || ARCH_LAYOUTS.I;
  const variant = state.archVariant;
  const [bx, by] = layout.bct;
  const [jx, jy] = layout.joint;
  const [lx, ly] = layout.lcca;
  const [sx, sy] = layout.lsub;
  let aorta = {
    ascending: 'M118 332 C113 268 112 207 134 154',
    arch: 'M134 154 C151 86 216 53 278 69 C317 79 338 111 340 151',
    descending: 'M340 151 C345 210 342 272 338 332'
  };
  let branches = {
    bct: `M${bx} ${by} C${bx - 5} ${by - 17} ${jx + 15} ${jy + 5} ${jx} ${jy}`,
    rcca: `M${jx} ${jy} C${jx + 2} 46 ${jx + 3} 31 ${jx + 4} 18`,
    rsub: `M${jx} ${jy} C101 ${jy + 4} 73 72 47 88`,
    lcca: `M${lx} ${ly} C${lx} 49 217 33 216 18`,
    lsub: `M${sx} ${sy} C307 67 340 75 380 94`
  };
  let subOrigins = { right: [95, 73], left: [324, 70] };
  let posteriorNote = '';
  let showBct = true;

  if (variant === 'common') {
    branches.bct = `M${bx + 12} ${by - 5} C${bx + 4} ${by - 23} ${jx + 16} ${jy + 8} ${jx} ${jy}`;
    branches.lcca = `M${bx + 12} ${by - 5} C186 ${by - 22} 211 52 216 18`;
  } else if (variant === 'lcca-bct') {
    branches.lcca = `M${jx + 11} ${jy + 4} C160 ${jy - 1} 205 48 216 18`;
  } else if (variant === 'left-vertebral') {
    subOrigins.left = null;
  } else if (variant === 'lusoria') {
    showBct = false;
    branches.rcca = `M${bx} ${by} C${bx - 4} ${by - 28} 132 43 130 18`;
    branches.rsub = 'M338 139 C307 147 262 150 214 143 C145 133 92 112 47 105';
    subOrigins.right = [79, 114];
    posteriorNote = leaderLabel(218, 143, 250, 176, l.posterior);
  } else if (variant === 'right-arch') {
    showBct = false;
    const typeDrop = { I: 0, II: 16, III: 34 }[state.archType] || 0;
    aorta = {
      ascending: 'M302 332 C307 268 308 207 286 154',
      arch: 'M286 154 C269 86 204 53 142 69 C103 79 82 111 80 151',
      descending: 'M80 151 C75 210 78 272 82 332'
    };
    branches = {
      rcca: `M${221 - typeDrop * 0.35} ${68 + typeDrop * 0.65} C220 51 220 34 220 18`,
      rsub: `M${180 - typeDrop * 0.5} ${73 + typeDrop} C151 ${78 + typeDrop * 0.45} 113 85 78 99`,
      lcca: `M${258 - typeDrop * 0.2} ${86 + typeDrop * 0.4} C273 64 287 43 292 18`,
      lsub: 'M84 139 C116 146 163 145 216 132 C284 115 335 101 380 105'
    };
    subOrigins = { right: [128, 87], left: [342, 111] };
    posteriorNote = leaderLabel(216, 132, 250, 169, lang === 'tr' ? 'Aberran sol subklavyen' : 'Aberrant left subclavian');
  }

  const subPaths = {};
  if (subOrigins.right) {
    const [x, y] = subOrigins.right;
    const outward = x < 210 ? -1 : 1;
    subPaths['r-vertebral'] = `M${x} ${y} C${x - outward * 2} ${y - 20} ${x - outward * 1} 36 ${x} 18`;
    subPaths['r-internal-thoracic'] = `M${x + outward * 10} ${y + 2} C${x + outward * 9} ${y + 27} ${x + outward * 13} ${y + 49} ${x + outward * 17} ${y + 69}`;
    subPaths['r-thyrocervical'] = `M${x + outward * 18} ${y + 5} C${x + outward * 28} ${y - 7} ${x + outward * 34} ${y - 19} ${x + outward * 38} ${y - 30}`;
    subPaths['r-costocervical'] = `M${x + outward * 29} ${y + 8} C${x + outward * 39} ${y + 1} ${x + outward * 48} ${y - 3} ${x + outward * 57} ${y - 5}`;
  }
  if (subOrigins.left) {
    const [x, y] = subOrigins.left;
    const outward = x > 210 ? 1 : -1;
    subPaths['l-vertebral'] = `M${x} ${y} C${x - outward * 3} ${y - 20} ${x - outward * 8} 35 ${x - outward * 12} 18`;
    subPaths['l-internal-thoracic'] = `M${x + outward * 9} ${y + 3} C${x + outward * 8} ${y + 28} ${x + outward * 12} ${y + 50} ${x + outward * 16} ${y + 70}`;
    subPaths['l-thyrocervical'] = `M${x + outward * 17} ${y + 5} C${x + outward * 27} ${y - 7} ${x + outward * 33} ${y - 18} ${x + outward * 38} ${y - 29}`;
    subPaths['l-costocervical'] = `M${x + outward * 27} ${y + 8} C${x + outward * 37} ${y + 2} ${x + outward * 46} ${y - 2} ${x + outward * 55} ${y - 3}`;
  }
  if (variant === 'left-vertebral') subPaths['l-vertebral'] = 'M244 65 C246 49 247 34 248 18';

  const major = (id, d, width) => interactive(byId[id], path(d, width, id === 'rsub' && variant === 'lusoria' ? 'stroke-dasharray="8 4"' : ''), lang);
  const small = Object.entries(subPaths).map(([id, d]) => interactive(byId[id], path(d, id.includes('vertebral') ? 7 : 5), lang)).join('');
  return frame(`
    <path class="bone-hint" d="M35 320 Q210 347 385 320"/>
    ${showBct ? major('bct', branches.bct, 15) : ''}${major('rcca', branches.rcca, 10)}${major('rsub', branches.rsub, 12)}
    ${major('lcca', branches.lcca, 10)}${major('lsub', branches.lsub, 12)}
    ${major('ascending-aorta', aorta.ascending, 27)}
    ${major('aortic-arch', aorta.arch, 27)}
    ${major('descending-aorta', aorta.descending, 25)}
    ${small}
    <g class="flow-line"><path d="M119 308 C116 238 119 183 139 141" marker-end="url(#flowArrow)"/></g>
    ${posteriorNote}
    ${vesselLabel(18, 342, l.arch)}
    ${vesselLabel(198, 202, `${lang === 'tr' ? 'Tip' : 'Type'} ${state.archType}`, 'middle')}
  `, lang, localize(byId['aortic-arch'].label, lang));
}

function renderCervical(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const lateral = state.projection === 'lateral';
  const ccaD = 'M204 330 C203 267 203 207 203 160';
  const bulbD = lateral
    ? 'M203 161 C187 158 175 148 176 132 C177 113 190 105 201 114 C211 123 212 148 203 161 Z'
    : 'M203 161 C190 158 181 148 182 133 C183 115 195 106 205 115 C216 125 216 148 203 161 Z';
  const icaD = lateral ? 'M191 116 C174 91 177 54 190 18' : 'M205 116 C224 95 230 58 232 18';
  const ecaD = lateral ? 'M204 139 C217 109 220 70 222 28' : 'M201 139 C188 108 184 70 183 28';
  const branchPaths = lateral ? {
    'sup-thyroid': 'M210 128 C226 137 239 150 252 165',
    'asc-pharyngeal': 'M211 119 C204 100 202 81 204 61',
    lingual: 'M216 108 C234 108 251 104 270 98',
    facial: 'M218 94 C238 88 255 75 271 59',
    occipital: 'M220 81 C201 74 184 63 170 49',
    'post-auricular': 'M221 66 C205 59 193 48 184 36',
    maxillary: 'M222 39 C240 37 255 31 273 22',
    'superficial-temporal': 'M222 39 C224 30 225 21 226 12'
  } : {
    'sup-thyroid': 'M192 129 C205 143 214 155 222 169',
    'asc-pharyngeal': 'M190 119 C198 101 201 81 201 61',
    lingual: 'M188 108 C171 108 157 104 140 98',
    facial: 'M187 94 C169 87 154 75 141 59',
    occipital: 'M185 81 C201 72 216 62 230 49',
    'post-auricular': 'M184 66 C198 58 209 48 218 36',
    maxillary: 'M183 39 C166 37 151 31 135 22',
    'superficial-temporal': 'M183 39 C181 30 180 21 179 12'
  };
  const branchEnds = lateral
    ? [[252, 165], [204, 61], [270, 98], [271, 59], [170, 49], [184, 36], [273, 22], [226, 12]]
    : [[222, 169], [201, 61], [140, 98], [141, 59], [230, 49], [218, 36], [135, 22], [179, 12]];
  const numberPoints = lateral
    ? [[270, 178, 'start'], [185, 51, 'end'], [288, 94, 'start'], [290, 51, 'start'], [151, 41, 'end'], [165, 27, 'end'], [291, 17, 'start'], [243, 14, 'start']]
    : [[238, 180, 'start'], [218, 51, 'start'], [122, 94, 'end'], [122, 51, 'end'], [249, 41, 'start'], [237, 27, 'start'], [117, 17, 'end'], [162, 14, 'end']];
  const branches = Object.entries(branchPaths).map(([id, d], index) => interactive(byId[id],
    `${path(d, 6)}${leaderLabel(branchEnds[index][0], branchEnds[index][1], numberPoints[index][0], numberPoints[index][1], String(index + 1), numberPoints[index][2])}`, lang)).join('');
  return frame(`
    <path class="neck-hint" d="M126 332 C109 260 118 157 138 65 M275 332 C293 248 286 145 270 61"/>
    ${interactive(byId.cca, path(ccaD, 18), lang)}
    ${interactive(byId.bulb, filledPath(bulbD), lang)}
    ${interactive(byId['cervical-ica'], path(icaD, 13), lang)}
    <path class="vessel muted-vessel" d="${ecaD}" stroke-width="11"/>
    ${branches}
    ${leaderLabel(202, 151, 142, 151, l.bifurcation, 'end')}
    ${leaderLabel(lateral ? 181 : 226, 61, lateral ? 139 : 271, 51, l.noBranches, lateral ? 'end' : 'start')}
  `, lang, localize(byId.cca.label, lang));
}

function renderIca(items, state, lang) {
  const l = labels[lang];
  const paths = [
    'M112 330 C112 292 114 258 121 228',
    'M121 228 C126 202 148 188 174 188 L218 188',
    'M218 188 C232 188 239 177 238 162',
    'M238 162 C236 141 218 132 213 113 C207 91 221 76 245 77 C263 78 271 66 269 53',
    'M269 53 C269 46 274 41 283 40',
    'M283 40 C278 28 287 19 301 20',
    'M301 20 C316 21 328 17 339 11'
  ];
  const colors = ['#fb7185', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6'];
  const labelSpecs = [[83, 282, 'end'], [142, 215, 'start'], [250, 183, 'start'], [252, 126, 'start'], [250, 57, 'end'], [277, 24, 'end'], [318, 36, 'start']];
  const segments = items.map((item, index) => interactive(item,
    `${path(paths[index], 14, `style="stroke:${colors[index]}"`)}${[2, 3].includes(index) ? '' : vesselLabel(labelSpecs[index][0], labelSpecs[index][1], `C${index + 1}`, labelSpecs[index][2])}`,
    lang, `style="--segment-color:${colors[index]}"`)).join('');
  return frame(`
    <path class="skull-base" d="M58 235 H155 L173 209 H235 L251 178 H309"/>
    ${segments}
    <path class="terminal-branch" d="M339 11 Q357 7 376 14 M339 11 Q353 25 368 34"/>
    <path class="small-branch" d="M144 189 L136 168 M184 188 L190 165 M225 137 L194 121 M218 109 L187 97 M276 43 L251 31 M302 20 L289 8 M316 19 L318 6"/>
    ${leaderLabel(233, 175, 278, 189, 'C3')}${leaderLabel(225, 123, 278, 116, 'C4')}
    ${leaderLabel(223, 116, 166, 93, l.siphon, 'end')}
    ${leaderLabel(339, 12, 386, 48, l.terminal, 'end')}
  `, lang, localize(items[0].label, lang));
}

function renderCircle(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const specs = {
    'vertebral-circle': ['M166 338 C174 320 188 307 210 298', 'M254 338 C246 320 232 307 210 298'],
    basilar: ['M210 298 C210 276 210 255 210 233'],
    p1: ['M210 233 C190 229 169 220 151 207', 'M210 233 C230 229 251 220 269 207'],
    pcomm: ['M151 207 C145 185 139 163 132 143', 'M269 207 C275 185 281 163 288 143'],
    a1: ['M132 143 C152 122 173 102 198 88', 'M288 143 C268 122 247 102 222 88'],
    acomm: ['M198 88 C206 84 214 84 222 88'],
    a2: ['M198 88 C196 67 198 46 202 25', 'M222 88 C224 67 222 46 218 25'],
    m1: ['M132 143 C114 143 96 143 80 143', 'M288 143 C306 143 324 143 340 143'],
    'mca-bif': ['M80 143 L64 126', 'M80 143 L64 160', 'M340 143 L356 126', 'M340 143 L356 160'],
    m2: ['M64 126 C53 114 47 101 43 87', 'M64 160 C49 171 41 183 37 198', 'M356 126 C367 114 373 101 377 87', 'M356 160 C371 171 379 183 383 198'],
    m3: ['M43 87 C38 70 39 56 46 43', 'M37 198 C29 215 29 229 35 244', 'M377 87 C382 70 381 56 374 43', 'M383 198 C391 215 391 229 385 244'],
    m4: ['M46 43 L35 27', 'M46 43 L60 28', 'M35 244 L22 258', 'M35 244 L49 260', 'M374 43 L360 28', 'M374 43 L385 27', 'M385 244 L371 260', 'M385 244 L398 258'],
    primitive: ['M165 285 C125 271 124 231 151 207']
  };
  const widths = { basilar: 13, 'vertebral-circle': 11, primitive: 5, acomm: 7, 'mca-bif': 8 };
  const vessels = items.map(item => interactive(item,
    specs[item.id].map(d => path(d, widths[item.id] || 9, item.id === 'primitive' ? 'stroke-dasharray="6 6"' : '')).join(''), lang)).join('');
  return frame(`
    <path class="brain-hint" d="M210 18 C125 -2 42 35 23 111 C4 191 61 274 151 285 M210 18 C295 -2 378 35 397 111 C416 191 359 274 269 285"/>
    ${vessels}
    <g class="ica-terminal"><circle cx="132" cy="143" r="6"/><circle cx="288" cy="143" r="6"/></g>
    <g class="perforators"><path d="M103 143 L100 116 M115 143 L116 113 M305 143 L304 113 M317 143 L320 116"/></g>
    ${leaderLabel(202, 42, 174, 22, 'A2', 'end')}
    ${leaderLabel(210, 86, 250, 74, 'AComm')}
    ${leaderLabel(164, 108, 115, 92, 'A1', 'end')}${leaderLabel(256, 108, 305, 92, 'A1')}
    ${leaderLabel(105, 143, 86, 125, 'M1', 'end')}${leaderLabel(315, 143, 334, 125, 'M1')}
    ${leaderLabel(64, 126, 82, 100, 'M2')}${leaderLabel(356, 126, 338, 100, 'M2', 'end')}
    ${leaderLabel(42, 86, 73, 67, 'M3')}${leaderLabel(378, 86, 347, 67, 'M3', 'end')}
    ${leaderLabel(36, 44, 78, 39, 'M4')}${leaderLabel(374, 44, 342, 39, 'M4', 'end')}
    ${leaderLabel(210, 234, 250, 250, 'P1')}${leaderLabel(151, 207, 111, 223, 'PComm', 'end')}
    ${leaderLabel(210, 270, 245, 284, 'BA')}${leaderLabel(181, 317, 139, 327, 'VA', 'end')}
    ${leaderLabel(111, 139, 105, 176, l.perforators, 'end')}
  `, lang, localize(byId.acomm.label, lang), false);
}

function renderStenosis(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const angle = Number(state.angle) || 0;
  const radians = angle * Math.PI / 180;
  const bendX = 206 + Math.sin(radians) * 93;
  const topX = 206 + Math.sin(radians * 1.2) * 115;
  const icaD = state.coil
    ? 'M206 208 C260 183 281 132 247 105 C216 81 179 103 184 137 C190 173 241 177 255 145 C267 117 250 78 237 48'
    : `M206 208 Q${bendX} 150 ${topX} 48`;
  return frame(`
    <path class="neck-hint" d="M112 335 C106 260 125 122 151 49 M307 335 C314 260 297 122 270 49"/>
    ${interactive(byId['stenosis-cca'], path('M206 330 L206 208', 19), lang)}
    ${interactive(byId['stenosis-lesion'], `${path('M206 208 C207 190 210 176 214 163', 18)}<path class="plaque" d="M201 198 Q211 186 202 173 M219 198 Q210 186 218 173"/>`, lang)}
    ${interactive(byId['stenosis-distal'], path(icaD, 14), lang)}
    <path class="eca-ghost" d="M206 208 Q165 165 153 106"/>
    <line class="axis-guide" x1="206" y1="207" x2="206" y2="52"/>
    <path class="angle-arc" d="M206 129 A78 78 0 0 ${angle > 95 ? 1 : 0} ${topX} 52"/>
    ${leaderLabel(210, 181, 258, 194, l.lesion)}${leaderLabel(topX, 48, 306, 30, l.normal)}
    ${vesselLabel(25, 323, state.coil ? (lang === 'tr' ? 'Koil' : 'Coil') : `${angle}°`)}
  `, lang, localize(byId['stenosis-lesion'].label, lang));
}

export function renderCarotidSvg(view, state, lang) {
  const items = viewStructures(view);
  if (view === 'arch') return renderArch(items, state, lang);
  if (view === 'cervical') return renderCervical(items, state, lang);
  if (view === 'ica') return renderIca(items, state, lang);
  if (view === 'circle') return renderCircle(items, state, lang);
  return renderStenosis(items, state, lang);
}
