import { ARCH_TYPES, localize, viewStructures } from './carotid-data.js';
import { sampleVessel, vesselSilhouette } from './carotid-geometry.js';

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

const path = (d, width = 11, extra = '', endScale = 0.86, hitWidth = Math.max(18, width + 12)) => {
  const dashed = extra.includes('stroke-dasharray');
  if (dashed) return `<path class="vessel-hit" d="${d}" stroke-width="${hitWidth}"/><path class="vessel vessel-variant" d="${d}" stroke-width="${width}" ${extra}/>`;
  return `<path class="vessel-hit" d="${d}" stroke-width="${hitWidth}"/><path class="vessel vessel-wall" d="${vesselSilhouette(d, width, endScale)}" ${extra}/><path class="vessel-light" d="${d}" stroke-width="${Math.max(1, width * .19)}"/>`;
};
const filledPath = (d, extraClass = '') => `<path class="vessel-hit" d="${d}" stroke-width="18"/><path class="vessel-fill ${extraClass}" d="${d}"/>`;
const vesselLabel = (x, y, text, anchor = 'start') => `<text class="vessel-label" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
const leaderLabel = (x1, y1, x2, y2, text, anchor = 'start') => `<g class="leader-label"><path d="M${x1} ${y1} L${x2} ${y2}"/><text x="${x2 + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)}" y="${y2 - 3}" text-anchor="${anchor}">${esc(text)}</text></g>`;

function frame(inner, lang, subtitle = '', showOrientation = true) {
  const l = labels[lang];
  return `<svg class="carotid-svg" viewBox="0 0 420 360" role="img" aria-label="${esc(subtitle || l.schematic)}">
    <defs>
      <linearGradient id="arteryGlow" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="350" y2="0"><stop stop-color="#9c4044"/><stop offset=".38" stop-color="#e59186"/><stop offset=".65" stop-color="#ca6b65"/><stop offset="1" stop-color="#82363f"/></linearGradient><radialGradient id="anatomyPaper"><stop stop-color="#f9f8f3"/><stop offset="1" stop-color="#e7ece9"/></radialGradient>

      <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#fff1df"/></marker>
    </defs>
    <rect class="svg-bg" x="1" y="1" width="418" height="358" rx="18"/>
    ${showOrientation ? `<g class="orientation"><path d="M28 54 V20 M28 20 L23 29 M28 20 L33 29"/><text x="39" y="28">${esc(l.orientation)}</text></g>` : ''}
    ${inner}
    <text class="scale-note" x="404" y="344" text-anchor="end">${esc(l.schematic)}</text>
  </svg>`;
}

function renderArch(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const type = ['I', 'II', 'III'].includes(state.archType) ? state.archType : 'I';
  const variant = state.archVariant;
  const right = variant === 'right-arch';
  const archD = 'M123 170 C134 92 203 69 266 96 C310 115 326 155 329 194';
  const archPoints = sampleVessel(archD);
  const at = (d, t) => { const pts = sampleVessel(d); return pts[Math.round((pts.length - 1) * t)]; };
  // Classification measures branch height from the outer arch, in LCCA diameters.
  const outer = archPoints.map((p, i) => {
    const a = archPoints[Math.max(0, i - 1)], b = archPoints[Math.min(archPoints.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    return [p[0] + dy / length * 15.5, p[1] - dx / length * 15.5];
  });
  const apexY = Math.min(...outer.map(p => p[1]));
  const by = apexY + ARCH_TYPES.find(item => item.id === type).depth * 10;
  const index = outer.findIndex((p, i) => i > 0 && p[1] <= by);
  const previous = outer[index - 1], next = outer[index];
  const fraction = (by - previous[1]) / (next[1] - previous[1]);
  const bx = previous[0] + fraction * (next[0] - previous[0]);
  const [lx, ly] = at(archD, { I: .34, II: .29, III: .23 }[type]);
  const [sx, sy] = at(archD, .53);
  const bctD = `M${bx} ${by} Q${bx - 24} ${Math.min(by - 10, 67)} 127 70`;
  const bctBranch = at(bctD, .55);
  const common = variant === 'common';
  let lccaD = `M${common ? bx : lx} ${common ? by : ly} C190 87 212 64 214 27`;
  if (variant === 'lcca-bct') lccaD = `M${bctBranch[0]} ${bctBranch[1]} C169 80 208 65 214 27`;
  let rccaD = 'M127 70 C129 54 130 40 128 27';
  let rsubD = 'M127 70 C105 66 77 80 43 104';
  let lsubD = `M${sx} ${sy} C300 85 336 85 378 108`;
  let showBct = true;
  if (variant === 'lusoria') {
    showBct = false;
    rccaD = `M${bx} ${by} C133 91 130 58 128 27`;
    rsubD = 'M329 194 C300 199 265 179 220 158 C148 124 95 103 43 104';
  }
  if (right) {
    showBct = false;
    // Mirror the arch, while retaining the anatomical branch labels and order:
    // LCCA, RCCA, RSCA, aberrant LSCA on a right-sided arch.
    lccaD = `M${420 - bx} ${by} C288 88 290 57 292 27`;
    rccaD = `M${420 - lx} ${ly} C220 81 210 55 208 27`;
    rsubD = `M${420 - sx} ${sy} C126 85 86 87 43 108`;
    lsubD = 'M91 194 C124 199 164 177 206 157 C274 125 329 104 378 108';
  }
  const major = (id, d, width, taper = .84) => interactive(byId[id], path(d, width, '', taper), lang);
  const sideBranches = (side, d) => {
    const outward = side === 'r' ? -1 : 1;
    const keys = ['vertebral', 'internal-thoracic', 'thyrocervical', 'costocervical'];
    return keys.map((key, i) => {
      if (side === 'l' && key === 'vertebral' && variant === 'left-vertebral') {
        const [x, y] = at(archD, .43);
        return major('l-vertebral', `M${x} ${y} C${x} 70 252 49 252 27`, 7, .7);
      }
      const [x, y] = at(d, [.48, .57, .70, .85][i]);
      const branchD = i === 0 ? `M${x} ${y} C${x - outward * 5} ${y - 17} ${x - outward * 7} 47 ${x - outward * 5} 27`
        : i === 1 ? `M${x} ${y} C${x} ${y + 19} ${x + outward * 3} ${y + 38} ${x + outward * 5} ${y + 60}`
        : `M${x} ${y} C${x + outward * 9} ${y - 7} ${x + outward * 15} ${y - 18} ${x + outward * 18} ${Math.max(28, y - 28)}`;
      return major(`${side}-${key}`, branchD, i === 0 ? 6.5 : 4.5, .55);
    }).join('');
  };
  const ascending = right ? 'M297 324 C302 266 302 219 297 170' : 'M123 324 C118 266 118 219 123 170';
  const arch = right ? 'M297 170 C286 92 217 69 154 96 C110 115 94 155 91 194' : archD;
  const descending = right ? 'M91 194 C88 244 89 282 92 324' : 'M329 194 C332 244 331 282 328 324';
  return frame(`
    <g class="anatomy-context"><path d="M39 277 C80 234 126 220 167 225 M381 277 C340 234 294 220 253 225"/>
    <path d="M186 58 L186 181 Q210 197 234 181 L234 58"/>
    <path d="M187 119 H233 M187 134 H233 M187 149 H233 M187 164 H233"/>
    <path d="M163 316 C145 285 165 253 193 248 C224 228 264 254 268 287 C270 309 254 326 238 334"/></g>
    <path class="vessel-wall" d="${vesselSilhouette(`${ascending} ${arch.replace(/^M[\d.]+ [\d.]+/, '')} ${descending.replace(/^M[\d.]+ [\d.]+/, '')}`, 31, 1)}" pointer-events="none"/>
    ${major('ascending-aorta', ascending, 31, 1)}${major('aortic-arch', arch, 31, 1)}${major('descending-aorta', descending, 31, .91)}
    ${showBct ? `<circle class="vessel-wall" cx="${bx}" cy="${by}" r="8" pointer-events="none"/>` : ''}
    ${showBct ? major('bct', bctD, 16, .85) : ''}
    ${major('rcca', rccaD, 10)}${major('lcca', lccaD, 10)}${major('rsub', rsubD, 12)}${major('lsub', lsubD, 12)}
    ${sideBranches('r', rsubD)}${sideBranches('l', lsubD)}
    ${leaderLabel(right ? 208 : 128, 34, right ? 190 : 112, 19, 'RCCA', 'end')}${leaderLabel(right ? 292 : 214, 34, right ? 310 : 231, 20, 'LCCA')}
    ${leaderLabel(58, 96, 31, 133, 'RSA', 'end')}${leaderLabel(366, 102, 389, 137, 'LSA')}
    ${leaderLabel(right ? 297 : 123, 275, right ? 258 : 164, 276, 'Ao', right ? 'end' : 'start')}
    ${vesselLabel(210, 213, `${lang === 'tr' ? 'Tip' : 'Type'} ${type}`, 'middle')}
    ${variant === 'lusoria' || right ? leaderLabel(218, 158, 252, 188, l.posterior) : ''}
    ${vesselLabel(18, 342, 'LAO 30–45°')}
  `, lang, localize(byId['aortic-arch'].label, lang), false);
}

function renderCervical(items, state, lang) {
  const l = labels[lang];
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const lateral = state.projection === 'lateral';
  // The lateral view places the branch-bearing ECA anterior to the cervical ICA.
  // AP is intentionally less separated; branch pattern identifies the vessels.
  const icaD = lateral ? 'M191 231 C168 210 168 188 170 160 C173 112 171 70 178 34' : 'M191 231 C207 207 209 176 212 142 C215 102 218 66 222 34';
  const ecaD = lateral ? 'M196 237 C214 216 222 190 224 158 C226 123 224 98 228 74' : 'M196 237 C186 215 184 189 183 158 C181 123 184 98 180 74';
  const branchPaths = lateral ? {
    'sup-thyroid': 'M209 218 C232 219 245 237 248 255',
    'asc-pharyngeal': 'M216 204 C204 179 201 148 204 119',
    lingual: 'M222 184 C244 189 267 180 283 166',
    facial: 'M224 161 C249 157 260 141 273 122 C278 113 288 109 300 108',
    occipital: 'M225 139 C204 138 189 120 170 115 C151 109 132 113 120 102',
    'post-auricular': 'M225 114 C213 100 209 86 211 69',
    maxillary: 'M228 74 C248 77 268 69 281 54',
    'superficial-temporal': 'M228 74 C232 58 232 41 236 25'
  } : {
    'sup-thyroid': 'M188 218 C164 223 151 238 150 255',
    'asc-pharyngeal': 'M185 204 C197 181 199 151 197 119',
    lingual: 'M183 184 C160 187 138 178 120 166',
    facial: 'M183 161 C157 157 145 140 132 122 C127 112 116 109 104 108',
    occipital: 'M182 139 C204 138 220 119 239 115 C258 109 275 113 287 102',
    'post-auricular': 'M182 114 C194 100 198 86 196 69',
    maxillary: 'M180 74 C160 77 140 69 127 54',
    'superficial-temporal': 'M180 74 C176 58 176 41 172 25'
  };
  const branchEnds = lateral ? [[248,255],[204,119],[283,166],[300,108],[120,102],[211,69],[281,54],[236,25]]
    : [[150,255],[197,119],[120,166],[104,108],[287,102],[196,69],[127,54],[172,25]];
  const numberPoints = lateral ? [[278,267],[186,99],[311,175],[325,115],[97,92],[192,57],[308,49],[264,24]]
    : [[119,267],[217,99],[91,175],[78,115],[310,92],[216,57],[100,49],[145,24]];
  const branches = Object.entries(branchPaths).map(([id,d], i) => interactive(byId[id], `${path(d, i === 3 || i === 6 ? 5.5 : 4.5, '', .48)}${leaderLabel(...branchEnds[i], ...numberPoints[i], String(i + 1), numberPoints[i][0] < branchEnds[i][0] ? 'end' : 'start')}`, lang)).join('');
  return frame(`
    <g class="anatomy-context"><path d="M126 326 C139 289 141 263 136 234 C121 207 105 183 104 154 C93 144 89 133 95 123 C82 99 89 69 105 47 C124 21 157 15 192 19 C240 20 269 44 281 72 L292 93 L308 107 L294 114 L294 130 L304 139 L292 148 C286 168 272 181 250 183 L247 227 C251 270 276 300 308 326"/>
    <path d="M123 134 C117 117 125 102 139 106 C154 111 149 131 139 139 M144 154 Q186 176 223 168"/>
    <path d="M144 191 C154 233 155 273 145 319 M157 194 C167 239 167 281 160 319"/></g>
    ${interactive(byId.cca, path('M194 326 C193 295 193 264 194 235', 19, '', 1), lang)}
    ${path(ecaD, 12, '', .68)}
    ${interactive(byId['cervical-ica'], path(icaD, 15, '', .70), lang)}
    ${interactive(byId.bulb, filledPath(lateral ? 'M186 247 C178 231 164 223 161 207 C158 192 167 184 175 190 C185 196 182 216 194 231 L201 239 Z' : 'M187 247 C191 231 204 222 214 207 C222 193 214 184 207 190 C197 198 201 217 189 231 Z'), lang)}
    ${branches}
    ${leaderLabel(194,237,104,242,l.bifurcation,'end')}
    ${leaderLabel(lateral ? 171 : 216,85,lateral ? 139 : 264,81,'ICA', lateral ? 'end' : 'start')}
    ${leaderLabel(lateral ? 224 : 183,153,lateral ? 255 : 153,213,'ECA', lateral ? 'start' : 'end')}
    ${vesselLabel(214,307,'CCA')}
  `, lang, localize(byId.cca.label,lang), false);
}

function renderIca(items, state, lang) {
  const l = labels[lang];
  const paths = [
    'M111 326 C108 297 115 265 128 239',
    'M128 239 C138 219 169 227 193 227 C208 227 217 220 222 210',
    'M222 210 C226 202 228 193 230 187',
    'M230 187 C238 168 267 185 274 165 C282 141 259 124 241 136 C229 144 221 153 211 145 C201 137 204 124 209 114',
    'M209 114 C212 107 215 102 221 97',
    'M221 97 C229 90 239 83 247 77',
    'M247 77 C253 72 258 66 262 59'
  ];
  const labelSpecs = [[80,284,'end'],[168,252,'middle'],[254,213,'start'],[308,165,'start'],[182,111,'end'],[212,79,'end'],[280,67,'start']];
  const segments = items.map((item,i) => interactive(item, `${path(paths[i],15,'',1,17)}${leaderLabel(...sampleVessel(paths[i])[12],...labelSpecs[i].slice(0,2),`C${i+1}`,labelSpecs[i][2])}`,lang)).join('');
  return frame(`
    <g class="anatomy-context"><path d="M54 248 C83 231 104 215 128 209 L165 207 L181 194 C187 180 189 164 198 153 L218 157 C231 170 241 181 256 185 L297 193 C313 197 327 199 354 193"/>
    <path d="M165 207 L169 239 L197 247 L210 234 M282 193 L285 216 L321 223 M228 174 C230 157 241 151 253 156 C264 163 265 178 259 187"/>
    <path d="M72 206 C60 159 77 99 115 62 C151 29 212 23 273 31 C307 36 337 59 352 83"/></g>
    ${segments}
    ${path('M262 59 C281 58 301 65 324 57',8,'',.55)}
    ${path('M262 59 C246 44 225 43 209 33',7,'',.55)}
    ${path('M231 89 C245 94 265 99 290 96',4,'',.5)}
    ${path('M252 72 C259 83 272 86 283 81',3.5,'',.5)}
    ${path('M262 62 C277 77 289 77 299 72',3,'',.5)}
    ${path('M168 227 C167 216 163 208 155 203',3,'',.5)}
    ${path('M269 176 C287 184 297 181 303 174',3,'',.5)}
    ${leaderLabel(281,96,316,112,lang==='tr'?'Oftalmik':'Ophthalmic')}
    ${leaderLabel(284,63,314,41,'MCA')}${leaderLabel(226,42,188,38,'ACA','end')}
    ${leaderLabel(266,150,315,142,l.siphon)}
    ${vesselLabel(29,318,lang==='tr'?'Lateral görünüm':'Lateral view')}
  `,lang,localize(items[0].label,lang),false);
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
    primitive: ['M132 143 C111 200 153 268 210 268']
  };
  const widths = { basilar: 13, 'vertebral-circle': 11, primitive: 5, acomm: 7, 'mca-bif': 8 };
  const vessels = items.map(item => interactive(item,
    specs[item.id].map(d => path(d, widths[item.id] || 9, item.id === 'primitive' ? 'stroke-dasharray="6 6"' : '')).join(''), lang)).join('');
  return frame(`
    <path class="brain-hint" d="M210 18 C125 -2 42 35 23 111 C4 191 61 274 151 285 M210 18 C295 -2 378 35 397 111 C416 191 359 274 269 285"/>
    ${vessels}
    ${path('M151 207 C129 208 110 221 96 237',7,'',.55)}${path('M269 207 C291 208 310 221 324 237',7,'',.55)}
    <g class="ica-terminal"><circle cx="132" cy="143" r="6"/><circle cx="288" cy="143" r="6"/></g>
    <g class="perforators"><path d="M103 143 L100 116 M115 143 L116 113 M305 143 L304 113 M317 143 L320 116"/></g>
    ${leaderLabel(202, 42, 174, 22, 'A2', 'end')}
    ${leaderLabel(210, 86, 250, 74, 'AComm')}
    ${leaderLabel(164, 108, 115, 92, 'A1', 'end')}${leaderLabel(256, 108, 305, 92, 'A1')}
    ${leaderLabel(105, 143, 86, 125, 'M1', 'end')}${leaderLabel(315, 143, 334, 125, 'M1')}
    ${leaderLabel(64, 126, 82, 100, 'M2')}${leaderLabel(356, 126, 338, 100, 'M2', 'end')}
    ${leaderLabel(42, 86, 73, 67, 'M3')}${leaderLabel(378, 86, 347, 67, 'M3', 'end')}
    ${leaderLabel(36, 44, 78, 39, 'M4')}${leaderLabel(374, 44, 342, 39, 'M4', 'end')}
    ${leaderLabel(210, 234, 250, 250, 'P1')}${leaderLabel(143, 179, 105, 213, 'PComm', 'end')}
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
    ? 'M214 163 C260 183 281 132 247 105 C216 81 179 103 184 137 C190 173 241 177 255 145 C267 117 250 78 237 48'
    : `M214 163 Q${bendX} 120 ${topX} 48`;
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
