import { LEADS } from './ecg12.js';
import { recordingValue } from './ves-loc-model.js';

const s = (doc, tag, attrs = {}, text = '') => {
  const node = doc.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.textContent = text;
  return node;
};
export const vesSvg = (doc, box, cls) => s(doc, 'svg', { viewBox: box, class: cls, role: 'img' });

export function renderVesOption(doc, svg, key, option) {
  const paths = {
    lbbb: 'M5 30 L25 30 L43 54 L59 30 L95 30',
    rs: 'M5 30 L25 30 L34 21 L47 54 L62 30 L95 30',
    rbbb: 'M5 30 L25 30 L39 5 L47 38 L61 30 L95 30',
    qr: 'M5 30 L25 30 L32 38 L43 5 L61 30 L95 30',
    positive: 'M5 30 L25 30 L42 6 L59 30 L95 30',
    negative: 'M5 30 L25 30 L42 54 L59 30 L95 30',
    biphasic: 'M5 30 L25 30 L37 12 L47 48 L61 30 L95 30'
  };
  let d = paths[option];
  if (key === 'axis') d = paths[option === 'inferior' ? 'positive' : option === 'superior' ? 'negative' : 'biphasic'];
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('style', d ? '' : 'display:none');
  if (!d) return;
  svg.replaceChildren(s(doc, 'line', { x1: 3, y1: 30, x2: 97, y2: 30, class: 'ves-grid' }), s(doc, 'path', { d, class: 'ves-trace' }));
}

const PX_PER_MM = 6;
/** Standard print layout drawn on ECG paper at 50 mm/s and 10 mm/mV (EP laboratory sweep); 1 unit = 1 mV. */
export function renderVesEcg(doc, svg, ecg, t) {
  svg.replaceChildren(s(doc, 'title', {}, t.synthetic));
  svg.setAttribute('aria-label', t.synthetic);
  const left = 10, top = 14, cellW = 195, cellH = 146, mm = PX_PER_MM, msPerMm = 20;
  const layout = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']];
  const width = left + 4 * cellW, height = top + 3 * cellH;
  svg.setAttribute('viewBox', `0 0 ${width + 10} ${height + 26}`);
  // Paper: 1 mm fine grid, 5 mm bold grid.
  const paper = s(doc, 'g', { class: 'ves-paper', 'aria-hidden': 'true' });
  paper.append(s(doc, 'rect', { x: left, y: top, width: 4 * cellW, height: 3 * cellH, class: 'ves-paper-bg' }));
  for (let x = left, i = 0; x <= left + 4 * cellW + .1; x += mm, i++) paper.append(s(doc, 'line', { x1: x, y1: top, x2: x, y2: height, class: i % 5 ? 'ves-paper-fine' : 'ves-paper-bold' }));
  for (let y = top, i = 0; y <= height + .1; y += mm, i++) paper.append(s(doc, 'line', { x1: left, y1: y, x2: left + 4 * cellW, y2: y, class: i % 5 ? 'ves-paper-fine' : 'ves-paper-bold' }));
  svg.append(paper);
  const amplitude = 10 * mm;   // 1 mV = 10 mm
  layout.forEach((row, r) => row.forEach((lead, c) => {
    const x0 = left + c * cellW, base = top + r * cellH + cellH * 0.6;
    const x = ms => x0 + 12 + (ms - ecg.from) / msPerMm * mm;
    svg.append(s(doc, 'text', { x: x0 + 8, y: top + r * cellH + 16, class: 'ves-ecg-label' }, lead));
    const d = ecg.t.map((ms, i) => `${i ? 'L' : 'M'}${x(ms).toFixed(1)} ${(base - ecg.leads[lead][i] * amplitude).toFixed(1)}`).join(' ');
    svg.append(s(doc, 'path', { d, class: 'ves-trace ves-ecg-trace', 'data-ves-ecg-lead': lead }));
  }));
  // 1 mV calibration pulse on the first row, QRS onset tick below each column.
  const cal = `M${left + 2} ${top + cellH * 0.6} h${mm} v${-amplitude} h${2 * mm} v${amplitude} h${mm}`;
  svg.append(s(doc, 'path', { d: cal, class: 'ves-calibration' }));
  svg.append(s(doc, 'text', { x: width / 2 + 5, y: height + 18, class: 'ves-map-caption' }, `QRS ${ecg.width} ms · 50 mm/s · 10 mm/mV · 1 mV`));
}

const CHANNEL_GAIN = { II: 18, V1: 18, his: 22, rvot: 22, lvot: 22, cs: 22, abl: 24, uni: 22 };
/** EP recording at 100 mm/s: surface II/V1, reference channels and the ABL pair on a 10 ms grid. */
export function renderVesRecording(doc, svg, recording, t) {
  const x = ms => 133 + (ms + 80) / 300 * 627;
  svg.replaceChildren(s(doc, 'title', {}, `${t.monitor}: ${t.sites[recording.id].name}. ${t.ref}`));
  svg.setAttribute('aria-label', `${t.monitor}: ${t.sites[recording.id].name}. ${t.local} ${recording.local} ms`);
  svg.setAttribute('data-site', recording.id); svg.setAttribute('data-position', recording.position);
  const rows = ['II', 'V1', ...recording.channels];
  const grid = s(doc, 'g', { 'aria-hidden': 'true' });
  grid.append(s(doc, 'rect', { x: 128, y: 30, width: 637, height: 424, class: 'ves-monitor-bg' }));
  for (let ms = -80; ms <= 220; ms += 10) grid.append(s(doc, 'line', { x1: x(ms), y1: 30, x2: x(ms), y2: 454, class: ms % 50 ? 'ves-grid-fine' : 'ves-grid' }));
  for (let ms = -50; ms <= 200; ms += 50) grid.append(s(doc, 'text', { x: x(ms), y: 22, class: 'ves-map-caption' }, ms));
  rows.forEach((_, i) => grid.append(s(doc, 'line', { x1: 128, y1: 32 + i * 52, x2: 765, y2: 32 + i * 52, class: 'ves-grid-row' })));
  svg.append(grid);
  svg.append(s(doc, 'line', { x1: x(0), y1: 28, x2: x(0), y2: 454, class: 'ves-qrs-onset' }),
    s(doc, 'text', { x: x(0), y: 467, class: 'ves-map-caption' }, t.ref));
  rows.forEach((ch, i) => {
    const y = 58 + i * 52;
    const g = s(doc, 'g', { 'data-ves-channel': ch });
    g.append(s(doc, 'rect', { x: 4, y: y - 9, width: 5, height: 18, rx: 1, class: 'ves-channel-swatch' }));
    g.append(s(doc, 'text', { x: 14, y: y + 4, class: 'ves-ecg-label' }, t.channel[ch] || ch));
    const points = [];
    for (let ms = -80; ms <= 220; ms += 1) {
      let value;
      if (LEADS.includes(ch)) {
        const sample = Math.round((ms - recording.ecg.from) / recording.ecg.step);
        value = recording.ecg.leads[ch][sample] || 0;
      } else value = recordingValue(recording, ch, ms);
      points.push(`${ms === -80 ? 'M' : 'L'}${x(ms).toFixed(1)} ${(y - value * CHANNEL_GAIN[ch]).toFixed(1)}`);
    }
    g.append(s(doc, 'path', { d: points.join(' '), class: `ves-trace ves-channel-trace ${ch === 'abl' || ch === 'uni' ? 'ves-local-trace' : ''}` }));
    if (recording.timings[ch] != null) g.append(s(doc, 'text', { x: x(recording.timings[ch]) + 8, y: y - 20, class: 'ves-wave-label' }, `${ch === 'uni' ? recording.unipolar : 'V'} ${recording.timings[ch]} ms`));
    if (ch === 'abl' && recording.purkinje != null) g.append(s(doc, 'text', { x: x(recording.purkinje), y: y - 12, class: 'ves-wave-label', 'data-ves-purkinje': '' }, 'P'));
    svg.append(g);
  });
  const y = 447;
  svg.append(s(doc, 'path', { d: `M${x(recording.local)} ${y - 5} V${y} H${x(0)} V${y - 5}`, class: 'ves-caliper' }),
    s(doc, 'text', { x: 600, y: 468, class: 'ves-wave-label' }, `${t.local}: ${recording.local} ms`),
    s(doc, 'text', { x: 400, y: 490, class: 'ves-map-caption' }, `${t.time} · 100 mm/s`));
}
