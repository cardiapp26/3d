// Original schematic visuals. Examples encode the existing lecture algorithm,
// not measured ECGs or independently validated localization rules.
export const WPW_EXAMPLES = Object.freeze({
  leftLateral: { v1: 'rGtS', d1: 'negIso', avf: 'pos' },
  leftPosterior: { v1: 'rGtS', d1: 'negIso', avf: 'neg' },
  posteroseptal: { v1: 'isoNeg', d2: 'negIso', avf: 'neg' },
  septalAnnulus: { v1: 'isoNeg', d2: 'negIso', avf: 'iso' },
  midseptal: { v1: 'isoNeg', d2: 'negIso', avf: 'pos', d3: 'rLtS' },
  anteroseptal: { v1: 'isoNeg', d2: 'negIso', avf: 'pos', d3: 'rGtS' },
  rightAnterior: { v1: 'sGtR', avf: 'pos' },
  rightLateral: { v1: 'sGtR', avf: 'iso', d2: 'pos' },
  rightPosterior: { v1: 'sGtR', avf: 'neg', d2: 'negIso' }
});
const POSITIONS = {
  leftLateral: [336, 134], leftPosterior: [308, 208], posteroseptal: [207, 213],
  septalAnnulus: [222, 167], midseptal: [202, 131], anteroseptal: [202, 80],
  rightAnterior: [118, 52], rightLateral: [60, 131], rightPosterior: [98, 205]
};
const LABELS = {
  tr: { map: 'Kapak düzleminde aksesuar yol bölgeleri', anterior: 'ANTERİOR', posterior: 'POSTERİOR', ta: 'Trikuspit', ma: 'Mitral', example: 'Örneği yükle', delta: 'Delta', schematic: 'Şematik', time: 'Göreli V başlangıcı (ms)', before: 'Preeksitasyon', after: 'Delta kayboldu; LBBB görünür', ecg: 'Şematik EKG, gerçek kayıt değil' },
  en: { map: 'Accessory pathway regions on the valve plane', anterior: 'ANTERIOR', posterior: 'POSTERIOR', ta: 'Tricuspid', ma: 'Mitral', example: 'Load example', delta: 'Delta', schematic: 'Schematic', time: 'Relative V onset (ms)', before: 'Pre-excitation', after: 'Delta lost; LBBB visible', ecg: 'Schematic ECG, not a recording' }
};
const s = (doc, tag, attrs = {}, text) => {
  const n = doc.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text) n.textContent = text;
  return n;
};
export const visualSvg = (doc, box, cls) => s(doc, 'svg', { viewBox: box, class: cls, role: 'img' });
export function renderAnnulusMap(doc, svg, { lang, site, sites, onSelect }) {
  const t = LABELS[lang];
  svg.replaceChildren(s(doc, 'title', {}, t.map));
  svg.setAttribute('aria-label', t.map); svg.setAttribute('role', 'group');
  svg.append(s(doc, 'text', { x: 210, y: 20, class: 'wpwv-caption' }, t.anterior),
    s(doc, 'text', { x: 210, y: 256, class: 'wpwv-caption' }, t.posterior),
    s(doc, 'ellipse', { cx: 124, cy: 134, rx: 65, ry: 81, class: 'wpwv-ring' }),
    s(doc, 'ellipse', { cx: 277, cy: 134, rx: 61, ry: 76, class: 'wpwv-ring' }),
    s(doc, 'text', { x: 124, y: 132, class: 'wpwv-ring-label' }, t.ta),
    s(doc, 'text', { x: 277, y: 132, class: 'wpwv-ring-label' }, t.ma),
    s(doc, 'path', { d: 'M185 216 Q239 240 305 202 Q333 175 337 151', class: 'wpwv-cs' }),
    s(doc, 'text', { x: 270, y: 238, class: 'wpwv-caption' }, 'CS'),
    s(doc, 'circle', { cx: 183, cy: 66, r: 5, class: 'wpwv-his' }),
    s(doc, 'text', { x: 161, y: 50, class: 'wpwv-caption' }, 'His'));
  Object.entries(POSITIONS).forEach(([id, [x, y]], index) => {
    const group = s(doc, 'g', { role: 'button', tabindex: '0', 'data-wpw-map-site': id, 'aria-label': `${t.example}: ${sites[id].name}`, 'aria-pressed': String(site === id), class: 'wpwv-site' });
    group.append(s(doc, 'title', {}, sites[id].name), s(doc, 'circle', { cx: x, cy: y, r: 15 }), s(doc, 'text', { x, y: y + 4 }, String(index + 1)));
    const activate = () => onSelect(id);
    group.addEventListener('click', activate);
    group.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
    svg.append(group);
  });
}
export function renderPolarity(doc, svg, option, lang) {
  const t = LABELS[lang];
  const negative = ['neg', 'negIso', 'isoNeg'].includes(option);
  const iso = option === 'iso';
  const smallR = ['sGtR', 'rLtS'].includes(option);
  const delta = iso ? 0 : negative ? 9 : -9;
  const peak = negative ? -14 : smallR ? -17 : -32;
  const trough = smallR || negative ? 31 : 10;
  const d = `M6 46 L24 46 L36 ${46 + delta} L42 ${46 + peak} L48 ${46 + trough} L55 46 L69 46 Q79 31 89 46 L107 46`;
  svg.replaceChildren(s(doc, 'title', {}, t.ecg), s(doc, 'line', { x1: 4, y1: 46, x2: 110, y2: 46, class: 'wpwv-baseline' }),
    s(doc, 'path', { d, class: 'wpwv-wave' }), s(doc, 'path', { d: `M24 46 L36 ${46 + delta}`, class: 'wpwv-delta' }));
  svg.setAttribute('aria-hidden', 'true');
}
export function renderCsTracing(doc, svg, sequence, lang, channels) {
  const t = LABELS[lang];
  svg.replaceChildren(s(doc, 'title', {}, t.time));
  svg.setAttribute('aria-label', `${t.time}. ${sequence.order.map(id => `${channels[id]}: ${sequence.onsets[id]} ms`).join('; ')}`);
  const x = time => 150 + time * 4.8;
  for (const ms of [0, 10, 20, 30, 40]) {
    svg.append(s(doc, 'line', { x1: x(ms), y1: 24, x2: x(ms), y2: 215, class: 'wpwv-grid' }), s(doc, 'text', { x: x(ms), y: 18, class: 'wpwv-caption' }, String(ms)));
  }
  Object.entries(sequence.onsets).forEach(([id, onset], i) => {
    const y = 47 + i * 36, at = x(onset), early = id === sequence.earliest;
    svg.append(s(doc, 'text', { x: 70, y: y + 4, class: 'wpwv-channel' }, channels[id].split(' (')[0]),
      s(doc, 'path', { d: `M143 ${y} L${at} ${y} L${at + 3} ${y - 14} L${at + 7} ${y + 15} L${at + 12} ${y} L375 ${y}`, class: early ? 'wpwv-wave wpwv-early' : 'wpwv-wave' }),
      s(doc, 'circle', { cx: at, cy: y, r: 3, class: 'wpwv-onset' }));
  });
  svg.append(s(doc, 'text', { x: 258, y: 238, class: 'wpwv-caption' }, t.time));
}
export function renderAblationEcg(doc, svg, phase, lang) {
  const t = LABELS[lang], before = phase === 'before';
  svg.replaceChildren(s(doc, 'title', {}, t.ecg));
  svg.setAttribute('aria-label', `${t.ecg}. ${before ? t.before : t.after}`);
  for (let x = 20; x <= 400; x += 20) svg.append(s(doc, 'line', { x1: x, y1: 20, x2: x, y2: 140, class: 'wpwv-grid' }));
  for (let y = 20; y <= 140; y += 20) svg.append(s(doc, 'line', { x1: 20, y1: y, x2: 400, y2: y, class: 'wpwv-grid' }));
  const path = before ? 'M20 100 L48 100 Q58 78 68 100 L88 100 L114 85 L126 35 L135 122 L148 100 L235 100 Q265 66 295 100 L400 100'
    : 'M20 100 L48 100 Q58 78 68 100 L140 100 L145 48 L160 40 L170 55 L180 40 L198 115 L212 100 L267 100 Q300 123 329 100 L400 100';
  svg.append(s(doc, 'path', { d: path, class: 'wpwv-wave' }));
  if (before) svg.append(s(doc, 'path', { d: 'M88 100 L114 85', class: 'wpwv-delta' }), s(doc, 'text', { x: 99, y: 73, class: 'wpwv-caption' }, t.delta));
  svg.append(s(doc, 'text', { x: 210, y: 164, class: 'wpwv-caption' }, before ? t.before : t.after));
}
