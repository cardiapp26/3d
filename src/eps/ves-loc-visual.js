import { LEADS } from './ecg12.js';
import { VES_REGIONS, recordingValue } from './ves-loc-model.js';

const s = (doc, tag, attrs = {}, text = '') => {
  const node = doc.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.textContent = text;
  return node;
};
export const vesSvg = (doc, box, cls) => s(doc, 'svg', { viewBox: box, class: cls, role: 'img' });

export function renderVesMap(doc, svg, { t, selected, candidates = [], onSelect, position = null, view = 'base' }) {
  svg.replaceChildren(s(doc, 'title', {}, t.map));
  svg.setAttribute('aria-label', `${t.map}: ${t[view]}`); svg.setAttribute('role', 'group');
  svg.setAttribute('viewBox', view === 'base' ? '0 0 370 350' : '380 0 380 350');
  svg.append(
    s(doc, 'rect', { x: 5, y: 5, width: 356, height: 339, rx: 16, class: 'ves-map-frame' }),
    s(doc, 'rect', { x: 382, y: 5, width: 371, height: 339, rx: 16, class: 'ves-map-frame' }),
    s(doc, 'text', { x: 180, y: 30, class: 'ves-map-caption' }, t.base),
    s(doc, 'text', { x: 568, y: 30, class: 'ves-map-caption' }, t.chambers),
    // Anterior up, patient right on the left: the RV outflow wraps in front of
    // the aortic root from the tricuspid side to the pulmonary valve, which sits
    // anterior and to the left of the aortic valve.
    s(doc, 'path', { d: 'M62 158 Q46 66 124 44 Q186 28 232 50 L236 70 Q200 76 176 96 Q152 118 150 146', class: 'ves-map-chamber' }),
    s(doc, 'ellipse', { cx: 258, cy: 58, rx: 30, ry: 14, class: 'ves-map-valve' }),
    s(doc, 'circle', { cx: 204, cy: 130, r: 34, class: 'ves-map-valve' }),
    s(doc, 'ellipse', { cx: 100, cy: 214, rx: 57, ry: 62, class: 'ves-map-valve' }),
    s(doc, 'ellipse', { cx: 266, cy: 217, rx: 55, ry: 58, class: 'ves-map-valve' }),
    s(doc, 'text', { x: 110, y: 108, class: 'ves-map-caption' }, 'RVOT'),
    s(doc, 'text', { x: 258, y: 62, class: 'ves-map-caption' }, 'PV'),
    s(doc, 'text', { x: 203, y: 176, class: 'ves-map-caption' }, 'Ao / LVOT'),
    s(doc, 'text', { x: 99, y: 213, class: 'ves-map-label' }, 'TA'),
    s(doc, 'text', { x: 266, y: 212, class: 'ves-map-label' }, 'MA'),
    // Left main from the left coronary sinus; LAD runs anteriorly, LCx along the mitral annulus.
    s(doc, 'path', { d: 'M236 118 L282 98 L312 36 M282 98 L330 142', class: 'ves-map-coronary' }),
    s(doc, 'text', { x: 326, y: 32, class: 'ves-map-caption' }, 'LAD'),
    s(doc, 'text', { x: 344, y: 130, class: 'ves-map-caption' }, 'LCx'),
    s(doc, 'path', { d: 'M161 273 Q219 313 288 271 Q341 245 326 173 M202 298 L199 326', class: 'ves-map-vein' }),
    s(doc, 'text', { x: 302, y: 307, class: 'ves-map-caption' }, 'CS'),
    s(doc, 'text', { x: 204, y: 335, class: 'ves-map-caption' }, 'MCV'),
    s(doc, 'circle', { cx: 168, cy: 168, r: 5, class: 'ves-map-his' }),
    s(doc, 'text', { x: 147, y: 162, class: 'ves-map-caption' }, 'His'),
    s(doc, 'path', { d: 'M511 69 Q384 71 407 196 Q423 285 571 321 Q514 255 534 152 Z', class: 'ves-map-chamber' }),
    s(doc, 'path', { d: 'M602 70 Q731 39 738 162 Q745 279 647 326 Q568 291 569 189 Q568 111 602 70 Z', class: 'ves-map-chamber' }),
    s(doc, 'path', { d: 'M582 122 Q562 226 595 291', class: 'ves-map-septum' }),
    s(doc, 'path', { d: 'M699 118 Q709 161 699 222 L682 251 M676 321 L657 275 L668 251', class: 'ves-map-muscle' }),
    s(doc, 'path', { d: 'M529 221 L438 276', class: 'ves-map-muscle' }),
    s(doc, 'path', { d: 'M583 126 Q599 225 626 289', class: 'ves-map-purkinje' }),
    s(doc, 'text', { x: 455, y: 153, class: 'ves-map-label' }, 'RV'),
    s(doc, 'text', { x: 654, y: 133, class: 'ves-map-label' }, 'LV')
  );
  for (const decoration of svg.children) decoration.setAttribute('aria-hidden', 'true');
  for (const region of VES_REGIONS) {
    if (region.view !== view) continue;
    const [x, y] = region.xy;
    const group = s(doc, 'g', { tabindex: 0, role: 'button', class: 'ves-map-site', 'data-ves-map-site': region.id,
      'aria-label': `${t.example}: ${t.sites[region.id].name}`, 'aria-pressed': selected === region.id,
      'data-candidate': candidates.includes(region.id) });
    group.append(s(doc, 'title', {}, t.sites[region.id].name), s(doc, 'circle', { cx: x, cy: y, r: 14 }), s(doc, 'text', { x, y: y + 4 }, region.number));
    group.addEventListener('click', () => onSelect(region.id));
    group.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(region.id); } });
    svg.append(group);
    if (selected === region.id && position) {
      const offset = { near: [17, 8], adjacent: [30, -18], remote: [30, 27] }[position];
      svg.append(s(doc, 'circle', { cx: x + offset[0], cy: y + offset[1], r: 5, class: 'ves-map-abl', 'data-ves-electrode': position }),
        s(doc, 'text', { x: x + offset[0], y: y + offset[1] + 17, class: 'ves-map-caption' }, 'ABL'));
    }
  }
}

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
