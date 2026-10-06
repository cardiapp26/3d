// Original schematic visuals. Examples encode the existing lecture algorithm,
// not measured ECGs or independently validated localization rules.
export const WPW_EXAMPLES = Object.freeze({
  leftLateral: { d1: 'negIso', avf: 'pos' },
  leftPosterior: { d1: 'negIso', avf: 'neg' },
  posteroseptalEpi: { d1: 'pos', v1: 'isoNeg', d2: 'neg' },
  posteroseptalTricuspid: { d1: 'pos', v1: 'isoNeg', d2: 'iso', avf: 'neg' },
  posteroseptalMitral: { d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'iso' },
  midseptal: { d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'pos', d3: 'rLtS' },
  anteroseptal: { d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'pos', d3: 'rGtS' },
  rightAnterior: { d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'pos' },
  rightLateral: { d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'iso' },
  rightPosterior: { d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'neg' }
});
const POSITIONS = {
  leftLateral: [336, 134], leftPosterior: [308, 208], posteroseptalEpi: [222, 240],
  posteroseptalTricuspid: [188, 206], posteroseptalMitral: [240, 196], midseptal: [202, 131], anteroseptal: [202, 80],
  rightAnterior: [118, 52], rightLateral: [60, 131], rightPosterior: [98, 205]
};
const LABELS = {
  tr: { map: 'Kapak düzleminde aksesuar yol bölgeleri', anterior: 'ANTERİOR', posterior: 'POSTERİOR', ta: 'Trikuspit', ma: 'Mitral', example: 'Örneği yükle', delta: 'Delta', schematic: 'Şematik', time: 'Göreli V başlangıcı (ms)', before: 'Preeksitasyon', after: 'Delta kayboldu; LBBB görünür', ecg: 'Şematik EKG, gerçek kayıt değil', monitor: 'Şematik EP kaydı, gerçek kayıt değil', monitorTime: 'Zaman (ms, atriyal aktivasyondan)' },
  en: { map: 'Accessory pathway regions on the valve plane', anterior: 'ANTERIOR', posterior: 'POSTERIOR', ta: 'Tricuspid', ma: 'Mitral', example: 'Load example', delta: 'Delta', schematic: 'Schematic', time: 'Relative V onset (ms)', before: 'Pre-excitation', after: 'Delta lost; LBBB visible', ecg: 'Schematic ECG, not a recording', monitor: 'Schematic EP recording, not a patient recording', monitorTime: 'Time (ms from atrial onset)' }
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
    s(doc, 'text', { x: 210, y: 270, class: 'wpwv-caption' }, t.posterior),
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
// Laboratory monitor of one sinus beat (wpw-loc-model.js epTimeline): surface
// D1 and aVL, His, ablation tip and the coronary sinus, on one time axis.
const MON = Object.freeze({ left: 74, right: 412, top: 30, row: 31, ms: 1.08, spike: 7 });
export function renderEpMonitor(doc, svg, timeline, lang, labels) {
  const t = LABELS[lang];
  const x = ms => MON.left + ms * MON.ms;
  const rows = [['d1', labels.d1], ['avl', labels.avl], ['his', labels.his], ['abl', labels.abl], ...Object.keys(timeline.cs).map(id => [id, labels.cs[id].split(' (')[0]])];
  const height = MON.top + rows.length * MON.row + 18;
  svg.setAttribute('viewBox', `0 0 420 ${height}`);
  svg.replaceChildren(s(doc, 'title', {}, t.monitor));
  svg.setAttribute('aria-label', `${t.monitor}. PR ${timeline.pr} ms, HV ${timeline.hv} ms`);
  for (let ms = 0; ms <= 300; ms += 50) {
    svg.append(s(doc, 'line', { x1: x(ms), y1: MON.top - 14, x2: x(ms), y2: height - 16, class: 'wpwv-grid' }), s(doc, 'text', { x: x(ms), y: MON.top - 18, class: 'wpwv-caption' }, String(ms)));
  }
  const onset = timeline.d1.onset;
  svg.append(s(doc, 'line', { x1: x(onset), y1: MON.top - 12, x2: x(onset), y2: height - 16, class: 'wpwv-onset-line', 'data-wpw-onset': String(onset) }));
  // Sharp local electrogram: a biphasic spike of amplitude a at time ms.
  const spike = (ms, a) => `L${x(ms) - 2} 0 L${x(ms)} ${-a} L${x(ms) + 3} ${a * 0.8} L${x(ms) + 5} 0`;
  rows.forEach(([id, label], i) => {
    const y = MON.top + i * MON.row + MON.row / 2;
    const g = s(doc, 'g', { transform: `translate(0 ${y})`, 'data-wpw-monitor': id });
    let d;
    const names = [];   // [ms, label]: wave names written above the trace
    if (id === 'd1' || id === 'avl') {
      const lead = timeline[id];
      d = surfacePath(lead, x);
      names.push([45, 'P'], [lead.onset + lead.width / 2 + (lead.delta ? 8 : 0), 'QRS'], [Math.min(285, lead.onset + lead.width + 45), 'T']);
      if (lead.delta) names.push([lead.onset + 14, 'δ']);
    } else {
      const ev = id === 'his' ? [[timeline.his.a, 4, 'A'], [timeline.his.h, 5, 'H'], [timeline.his.v, MON.spike, 'V']]
        : id === 'abl' ? [[timeline.abl.a, 5, 'A'], [timeline.abl.v, MON.spike + 2, 'V']]
        : [[timeline.cs[id].a, 4, 'A'], [timeline.cs[id].v, MON.spike, 'V']];
      ev.forEach(([ms, , name]) => names.push([ms + 1, name]));
      d = `M${MON.left} 0 ${ev.sort((a, b) => a[0] - b[0]).map(([ms, a]) => spike(ms, a)).join(' ')} L${MON.right} 0`;
      // On the pathway before ablation A runs into V with no isoelectric gap.
      if (id === 'abl' && timeline.abl.fused) d = `M${MON.left} 0 ${spike(timeline.abl.a, 5)} ${fusedBridge(timeline.abl.a + 5, timeline.abl.v - 2, x)} ${spike(timeline.abl.v, MON.spike + 2)} L${MON.right} 0`;
    }
    g.append(s(doc, 'text', { x: 4, y: 3, class: 'wpwv-monitor-label' }, label),
      s(doc, 'path', { d, class: id === 'abl' ? 'wpwv-wave wpwv-early' : 'wpwv-wave' }));
    for (const [ms, name] of names) g.append(s(doc, 'text', { x: x(ms), y: -11, class: 'wpwv-wave-label', 'data-wave': name }, name));
    svg.append(g);
  });
  svg.append(s(doc, 'text', { x: 243, y: height - 3, class: 'wpwv-caption' }, t.monitorTime));
}
// Low fractionated activity joining the local A to the local V.
function fusedBridge(from, to, x) {
  const parts = [];
  for (let ms = from, k = 0; ms < to; ms += 3, k += 1) parts.push(`L${x(ms)} ${k % 2 ? 2.5 : -2.5}`);
  return parts.join(' ');
}
// Surface lead: P wave, then a delta slur (pre-excitation) or a narrow / LBBB QRS, then T.
function surfacePath(lead, x) {
  const sign = lead.polarity === 'neg' ? 1 : -1;      // SVG y grows downward
  const o = lead.onset, w = lead.width;
  const p = `M${MON.left} 0 L${x(15)} 0 Q${x(45)} ${-6} ${x(75)} 0`;
  let qrs;
  // Isoelectric delta: flat first 20-35 ms, then a modest upright QRS.
  if (lead.delta && lead.polarity === 'iso') qrs = `L${x(o)} 0 L${x(o + 35)} 0 L${x(o + 52)} -14 L${x(o + 68)} 5 L${x(o + w)} 0`;
  else if (lead.delta) qrs = `L${x(o)} 0 L${x(o + 35)} ${sign * 7} L${x(o + 50)} ${sign * 22} L${x(o + 65)} ${-sign * 6} L${x(o + w)} 0`;
  else if (lead.lbbb) qrs = `L${x(o)} 0 L${x(o + 30)} -16 L${x(o + 55)} -12 L${x(o + 80)} -18 L${x(o + w)} 0`;
  else qrs = `L${x(o)} 0 L${x(o + 10)} 2 L${x(o + 30)} -20 L${x(o + 50)} 5 L${x(o + w)} 0`;
  const tEnd = Math.min(300, o + w + 90);
  return `${p} ${qrs} Q${x((o + w + tEnd) / 2)} ${lead.lbbb ? 6 : -7} ${x(tEnd)} 0 L${MON.right} 0`;
}
