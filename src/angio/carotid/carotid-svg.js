import { localize, viewStructures } from './carotid-data.js';

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const labels = {
  tr: {
    orientation: 'Kraniyal', right: 'Sağ', left: 'Sol', arch: 'LAO 30–45°, ark dalları açılır',
    noBranches: 'Servikal dal yok', bifurcation: 'Bifurkasyon', siphon: 'Karotis sifonu',
    terminal: 'Terminal bifurkasyon', sylvian: 'Sylvian nokta', perforators: 'Lentikülostriatlar',
    normal: 'Distal normal referans', lesion: 'Minimal lümen', schematic: 'Şematik, ölçeksiz'
  },
  en: {
    orientation: 'Cranial', right: 'Right', left: 'Left', arch: 'LAO 30–45° opens arch branches',
    noBranches: 'No cervical branches', bifurcation: 'Bifurcation', siphon: 'Carotid siphon',
    terminal: 'Terminal bifurcation', sylvian: 'Sylvian point', perforators: 'Lenticulostriates',
    normal: 'Normal distal reference', lesion: 'Minimal lumen', schematic: 'Schematic, not to scale'
  }
};

function interactive(item, content, lang, extra = '') {
  const name = esc(localize(item.label, lang));
  return `<g class="carotid-structure" data-structure="${item.id}" role="button" tabindex="0" aria-label="${name}" ${extra}><title>${name}</title>${content}</g>`;
}

const path = (d, width = 11, extra = '') => `<path class="vessel-hit" d="${d}" stroke-width="${width + 12}"/><path class="vessel" d="${d}" stroke-width="${width}" ${extra}/>`;
const vesselLabel = (x, y, text, anchor = 'start') => `<text class="vessel-label" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;

function frame(inner, lang, subtitle = '') {
  const l = labels[lang];
  return `<svg class="carotid-svg" viewBox="0 0 420 360" role="img" aria-label="${esc(subtitle || l.schematic)}">
    <defs>
      <linearGradient id="arteryGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f87171"/><stop offset="1" stop-color="#dc2626"/></linearGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#fca5a5"/></marker>
    </defs>
    <rect class="svg-bg" x="1" y="1" width="418" height="358" rx="18"/>
    <g class="orientation"><path d="M28 54 V20 M28 20 L23 29 M28 20 L33 29"/><text x="39" y="28">${esc(l.orientation)}</text></g>
    ${inner}
    <text class="scale-note" x="404" y="344" text-anchor="end">${esc(l.schematic)}</text>
  </svg>`;
}

function renderArch(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const typeShift = { I: 0, II: 18, III: 38 }[state.archType] || 0;
  const variant = state.archVariant;
  const branchPaths = {
    bct: `M183 ${68 + typeShift} C180 ${45 + typeShift} 166 ${28 + typeShift} 142 ${16 + typeShift}`,
    rcca: `M142 ${17 + typeShift} L118 ${-8 + typeShift}`,
    rsub: `M142 ${17 + typeShift} C110 ${23 + typeShift} 82 ${31 + typeShift} 55 ${49 + typeShift}`,
    lcca: `M237 ${61 + typeShift} C239 ${36 + typeShift} 238 ${13 + typeShift} 235 ${-9 + typeShift}`,
    lsub: `M290 ${76 + typeShift} C312 ${52 + typeShift} 339 ${36 + typeShift} 373 ${28 + typeShift}`,
    vertebrals: `M319 ${51 + typeShift} C320 ${24 + typeShift} 312 ${5 + typeShift} 301 ${-12 + typeShift} M87 ${34 + typeShift} C83 ${14 + typeShift} 88 ${-2 + typeShift} 99 ${-17 + typeShift}`
  };

  if (variant === 'common') branchPaths.lcca = `M184 ${68 + typeShift} C210 ${45 + typeShift} 226 ${22 + typeShift} 229 ${-7 + typeShift}`;
  if (variant === 'lcca-bct') branchPaths.lcca = `M151 ${27 + typeShift} C176 ${17 + typeShift} 194 ${1 + typeShift} 197 ${-14 + typeShift}`;
  if (variant === 'left-vertebral') branchPaths.vertebrals = `M266 ${66 + typeShift} C270 ${38 + typeShift} 273 ${14 + typeShift} 276 ${-12 + typeShift} M87 ${34 + typeShift} C83 ${14 + typeShift} 88 ${-2 + typeShift} 99 ${-17 + typeShift}`;
  if (variant === 'lusoria') branchPaths.rsub = `M326 ${99 + typeShift} C360 105 382 122 401 142`;
  if (variant === 'right-arch') {
    branchPaths.bct = `M284 ${72 + typeShift} C291 ${46 + typeShift} 310 ${28 + typeShift} 335 ${14 + typeShift}`;
    branchPaths.rcca = `M335 ${15 + typeShift} L351 ${-10 + typeShift}`;
    branchPaths.rsub = `M335 ${15 + typeShift} C360 ${23 + typeShift} 384 ${35 + typeShift} 404 ${52 + typeShift}`;
    branchPaths.lcca = `M232 ${60 + typeShift} C229 ${34 + typeShift} 226 ${11 + typeShift} 224 ${-10 + typeShift}`;
    branchPaths.lsub = `M177 ${76 + typeShift} C151 ${55 + typeShift} 124 ${42 + typeShift} 92 ${35 + typeShift}`;
  }

  const aortaD = variant === 'right-arch'
    ? 'M310 278 C344 220 340 132 284 88 C230 46 132 54 88 108'
    : byId['ascending-aorta'].geometry.d;
  const branch = id => interactive(byId[id], path(branchPaths[id], id === 'vertebrals' ? 7 : (id === 'bct' ? 15 : 11)), lang);
  return frame(`
    <path class="bone-hint" d="M38 292 Q210 328 382 292"/>
    ${interactive(byId['ascending-aorta'], path(aortaD, 28), lang)}
    ${branch('bct')}${branch('rcca')}${branch('rsub')}${branch('lcca')}${branch('lsub')}${branch('vertebrals')}
    <g class="flow-line"><path d="M112 264 C95 198 104 125 151 91" marker-end="url(#flowArrow)"/></g>
    ${vesselLabel(18, 323, l.arch)}
    ${vesselLabel(195, 113 + typeShift, `${lang === 'tr' ? 'Tip' : 'Type'} ${state.archType}`, 'middle')}
  `, lang, localize(byId['ascending-aorta'].label, lang));
}

function renderCervical(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const lateral = state.projection === 'lateral';
  const sign = lateral ? 1 : -1;
  const icaD = lateral ? 'M184 123 C166 91 173 49 188 15' : 'M184 123 C176 91 180 49 197 15';
  const ecaD = lateral ? 'M205 137 C217 102 220 58 226 10' : 'M205 137 C214 102 211 58 210 10';
  const branchIds = ['sup-thyroid', 'asc-pharyngeal', 'lingual', 'facial', 'occipital', 'post-auricular', 'maxillary', 'superficial-temporal'];
  const branches = branchIds.map((id, index) => {
    const item = byId[id];
    const startY = 126 - index * 14.5;
    const startX = 210 + (lateral ? index * 1.8 : 0);
    const endX = startX + sign * (34 + (index % 3) * 9);
    const endY = startY - 9 - (index % 2) * 5;
    return interactive(item, `${path(`M${startX} ${startY} Q${startX + sign * 16} ${startY - 2} ${endX} ${endY}`, 6)}${vesselLabel(endX + sign * 4, endY - 3, String(index + 1), sign > 0 ? 'start' : 'end')}`, lang);
  }).join('');
  return frame(`
    <path class="neck-hint" d="M126 332 C109 260 118 157 138 65 M275 332 C293 248 286 145 270 61"/>
    ${interactive(byId.cca, path('M196 324 C194 260 194 206 195 157', 18), lang)}
    ${interactive(byId.bulb, '<ellipse class="vessel-fill vessel-hit-fill" cx="184" cy="137" rx="27" ry="37"/><ellipse class="vessel-fill" cx="184" cy="137" rx="17" ry="27"/>', lang)}
    ${interactive(byId['cervical-ica'], path(icaD, 13), lang)}
    <path class="vessel muted-vessel" d="${ecaD}" stroke-width="11"/>
    ${branches}
    ${vesselLabel(134, 142, l.bifurcation, 'end')}
    ${vesselLabel(130, 50, l.noBranches, 'end')}
    <path class="callout" d="M136 137 H169 M137 54 L177 71"/>
  `, lang, localize(byId.cca.label, lang));
}

function renderIca(items, state, lang) {
  const l = labels[lang];
  const paths = [
    'M118 324 C118 286 119 254 126 224',
    'M126 224 C130 201 151 191 173 194 L222 194',
    'M222 194 C240 194 246 178 244 162',
    'M244 162 C240 131 207 129 204 105 C201 84 224 71 246 79',
    'M246 79 C257 83 264 75 264 64',
    'M264 64 C265 48 276 38 293 36',
    'M293 36 C310 35 324 28 334 17'
  ];
  const colors = ['#fb7185', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6'];
  const segments = items.map((item, index) => interactive(item,
    `${path(paths[index], 14, `style="stroke:${colors[index]}"`)}${vesselLabel(index === 0 ? 86 : [137, 181, 265, 271, 287, 310][index - 1], [277, 218, 176, 123, 75, 52, 24][index], `C${index + 1}`, index === 0 ? 'end' : 'start')}`,
    lang, `style="--segment-color:${colors[index]}"`)).join('');
  return frame(`
    <path class="skull-base" d="M61 231 H157 L173 208 H239 L252 178 H310"/>
    ${segments}
    <path class="terminal-branch" d="M334 17 Q351 8 373 14 M334 17 Q345 31 363 38"/>
    <path class="small-branch" d="M145 197 L136 174 M185 194 L190 169 M222 136 L190 120 M208 111 L178 100 M271 55 L245 42 M300 34 L284 18 M314 29 L314 9"/>
    ${vesselLabel(154, 96, l.siphon)}<path class="callout" d="M199 100 L222 118"/>
    ${vesselLabel(372, 53, l.terminal, 'end')}
  `, lang, localize(items[0].label, lang));
}

function renderCircle(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const specs = {
    'vertebral-circle': 'M178 335 C181 302 190 276 209 253 M242 335 C239 302 230 276 209 253',
    basilar: 'M209 253 L210 180', p1: 'M210 180 Q175 177 151 196 M210 180 Q244 177 269 196',
    pcomm: 'M151 196 Q144 153 158 120 M269 196 Q278 153 263 120',
    a1: 'M158 120 Q185 111 205 106 M263 120 Q237 111 215 106',
    acomm: 'M205 106 H215', a2: 'M205 106 Q196 76 199 39 M215 106 Q224 76 221 39',
    m1: 'M158 120 Q118 116 90 130 M263 120 Q303 116 331 130',
    'mca-bif': 'M90 130 L72 111 M90 130 L70 147 M331 130 L350 111 M331 130 L351 147',
    m2: 'M72 111 Q54 90 48 68 M70 147 Q48 156 36 176 M350 111 Q368 90 374 68 M351 147 Q373 156 385 176',
    m3: 'M48 68 Q45 45 57 28 M36 176 Q22 194 24 216 M374 68 Q377 45 365 28 M385 176 Q399 194 397 216',
    m4: 'M57 28 L42 13 M57 28 L70 10 M24 216 L10 232 M24 216 L35 238 M365 28 L350 10 M365 28 L379 13 M397 216 L385 238 M397 216 L411 232',
    primitive: 'M169 247 Q111 232 145 169'
  };
  const widths = { basilar: 13, 'vertebral-circle': 11, primitive: 5, acomm: 7, 'mca-bif': 8 };
  const vessels = items.map(item => interactive(item, path(specs[item.id], widths[item.id] || 9, item.id === 'primitive' ? 'stroke-dasharray="6 6"' : ''), lang)).join('');
  return frame(`
    <path class="brain-hint" d="M210 25 C121 -5 29 48 24 130 C18 217 92 280 178 273 M210 25 C299 -5 391 48 396 130 C402 217 328 280 242 273"/>
    ${vessels}
    <g class="perforators"><path d="M113 123 L110 91 M126 120 L128 87 M294 120 L292 87 M307 123 L311 91"/></g>
    ${vesselLabel(210, 18, 'A2', 'middle')}${vesselLabel(210, 298, 'VA → BA', 'middle')}
    ${vesselLabel(73, 83, l.sylvian)}${vesselLabel(210, 86, 'AComm', 'middle')}
    ${vesselLabel(210, 148, l.perforators, 'middle')}
  `, lang, localize(byId.acomm.label, lang));
}

function renderStenosis(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const angle = Number(state.angle) || 0;
  const radians = angle * Math.PI / 180;
  const bendX = 206 + Math.sin(radians) * 93;
  const topX = 206 + Math.sin(radians * 1.2) * 115;
  const icaD = `M206 208 Q${bendX} 150 ${topX} 48`;
  return frame(`
    <path class="neck-hint" d="M112 335 C106 260 125 122 151 49 M307 335 C314 260 297 122 270 49"/>
    ${interactive(byId['stenosis-cca'], path('M206 330 L206 208', 19), lang)}
    ${interactive(byId['stenosis-lesion'], `${path('M206 208 C207 190 210 176 214 163', 18)}<path class="plaque" d="M201 198 Q211 186 202 173 M219 198 Q210 186 218 173"/>`, lang)}
    ${interactive(byId['stenosis-distal'], path(icaD, 14), lang)}
    <path class="eca-ghost" d="M206 208 Q165 165 153 106"/>
    <line class="axis-guide" x1="206" y1="207" x2="206" y2="52"/>
    <path class="angle-arc" d="M206 129 A78 78 0 0 ${angle > 95 ? 1 : 0} ${topX} 52"/>
    ${vesselLabel(222, 188, l.lesion)}${vesselLabel(topX, 35, l.normal, 'middle')}
    ${vesselLabel(25, 323, `${angle}°`)}
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
