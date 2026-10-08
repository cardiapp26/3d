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

export function renderVesEcg(doc, svg, ecg, t) {
  svg.replaceChildren(s(doc, 'title', {}, t.synthetic));
  svg.setAttribute('aria-label', t.synthetic);
  const left = 10, cellW = 193, cellH = 84;
  // Each lead shows the same beat, time scale and relative amplitude scale.
  const layout = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']];
  layout.forEach((row, r) => row.forEach((lead, c) => {
    const x0 = left + c * cellW, y = 24 + r * cellH + cellH / 2;
    const x = ms => x0 + 8 + (ms + 20) / 240 * (cellW - 22);
    for (let ms = 0; ms <= 200; ms += 50) svg.append(s(doc, 'line', { x1: x(ms), y1: y - 33, x2: x(ms), y2: y + 32, class: 'ves-grid' }));
    svg.append(s(doc, 'line', { x1: x0, y1: y, x2: x0 + cellW - 6, y2: y, class: 'ves-grid' }),
      s(doc, 'text', { x: x0 + 2, y: y - 34, class: 'ves-ecg-label' }, lead));
    const d = ecg.t.map((ms, i) => `${i ? 'L' : 'M'}${x(ms).toFixed(1)} ${(y - ecg.leads[lead][i] * 20).toFixed(1)}`).join(' ');
    svg.append(s(doc, 'path', { d, class: 'ves-trace', 'data-ves-ecg-lead': lead }));
  }));
  svg.append(s(doc, 'text', { x: 400, y: 293, class: 'ves-map-caption' }, `QRS ${ecg.width} ms · 50 ms / grid`));
}

export function renderVesRecording(doc, svg, recording, t) {
  const x = ms => 133 + (ms + 80) / 300 * 627;
  svg.replaceChildren(s(doc, 'title', {}, `${t.monitor}: ${t.sites[recording.id].name}. ${t.ref}`));
  svg.setAttribute('aria-label', `${t.monitor}: ${t.sites[recording.id].name}. ${t.local} ${recording.local} ms`);
  svg.setAttribute('data-site', recording.id); svg.setAttribute('data-position', recording.position);
  const rows = ['II', 'V1', ...recording.channels];
  for (let ms = -50; ms <= 200; ms += 50) svg.append(s(doc, 'line', { x1: x(ms), y1: 33, x2: x(ms), y2: 450, class: 'ves-grid' }),
    s(doc, 'text', { x: x(ms), y: 22, class: 'ves-map-caption' }, ms));
  svg.append(s(doc, 'line', { x1: x(0), y1: 28, x2: x(0), y2: 450, class: 'ves-qrs-onset' }),
    s(doc, 'text', { x: x(0), y: 467, class: 'ves-map-caption' }, t.ref));
  rows.forEach((ch, i) => {
    const y = 58 + i * 52;
    const g = s(doc, 'g', { 'data-ves-channel': ch });
    g.append(s(doc, 'text', { x: 5, y: y + 4, class: 'ves-ecg-label' }, t.channel[ch] || ch));
    const points = [];
    for (let ms = -80; ms <= 220; ms += 1) {
      let value;
      if (LEADS.includes(ch)) {
        const sample = Math.round((ms + 20) / 2);
        value = recording.ecg.leads[ch][sample] || 0;
      } else value = recordingValue(recording, ch, ms);
      points.push(`${ms === -80 ? 'M' : 'L'}${x(ms).toFixed(1)} ${(y - value * 18).toFixed(1)}`);
    }
    g.append(s(doc, 'path', { d: points.join(' '), class: `ves-trace ${ch === 'abl' || ch === 'uni' ? 'ves-local-trace' : ''}` }));
    if (recording.timings[ch] != null) g.append(s(doc, 'text', { x: x(recording.timings[ch]) + 8, y: y - 20, class: 'ves-wave-label' }, `${ch === 'uni' ? recording.unipolar : 'V'} ${recording.timings[ch]} ms`));
    if (ch === 'abl' && recording.purkinje != null) g.append(s(doc, 'text', { x: x(recording.purkinje), y: y - 12, class: 'ves-wave-label', 'data-ves-purkinje': '' }, 'P'));
    svg.append(g);
  });
  const y = 447;
  svg.append(s(doc, 'path', { d: `M${x(recording.local)} ${y - 5} V${y} H${x(0)} V${y - 5}`, class: 'ves-caliper' }),
    s(doc, 'text', { x: 600, y: 468, class: 'ves-wave-label' }, `${t.local}: ${recording.local} ms`),
    s(doc, 'text', { x: 400, y: 490, class: 'ves-map-caption' }, t.time));
}
