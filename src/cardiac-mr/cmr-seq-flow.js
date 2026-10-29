// Sequence schematics, part 2: phase contrast, perfusion and 3D CE-MRA (SVG strings).
import { aorticFlowCurve, integrateFlow } from './cmr-geometry.js';
import { UI } from './cardiac-mr-data.js';
import { circle, text, label, sectorPath, smoothPath } from './cmr-svg.js';
import { saxBase, saxParts } from './cmr-sections.js';
import { seqSvg, num, pct } from './cmr-seq-tissue.js';

const T = {
  tr: { magnitude: 'Magnitüd', phase: 'Faz (hız)', forward: 'İleri akım', backward: 'Geri akım', net: 'Net (SV)', rf: 'RF', flow: 'Akım (ml/s)', time: 'Zaman (ms)', venc: ['VENC 200 cm/s', '> tepe hız ~165 cm/s'], plane: 'Aort kapağı düzlemi', basal: 'Bazal', mid: 'Orta', apical: 'Apikal', defect: 'LAD alanında subendokardiyal defekt', si: 'Sinyal', blood: 'LV kan havuzu', normal: 'Normal miyokart', defectCurve: 'Defekt', peak: 'Tepe miyokart tutulumu' },
  en: { magnitude: 'Magnitude', phase: 'Phase (velocity)', forward: 'Forward flow', backward: 'Backward flow', net: 'Net (SV)', rf: 'RF', flow: 'Flow (ml/s)', time: 'Time (ms)', venc: ['VENC 200 cm/s', '> peak velocity ~165 cm/s'], plane: 'Aortic valve plane', basal: 'Basal', mid: 'Mid', apical: 'Apical', defect: 'Subendocardial defect in the LAD territory', si: 'Signal', blood: 'LV blood pool', normal: 'Normal myocardium', defectCurve: 'Defect', peak: 'Peak myocardial enhancement' }
};

function plot(points, box, xRange, yRange) {
  const xOf = x => box.x + box.w * (x - xRange[0]) / (xRange[1] - xRange[0]);
  const yOf = y => box.y + box.h * (1 - (y - yRange[0]) / (yRange[1] - yRange[0]));
  return { xOf, yOf, d: points.map((p, i) => `${i ? 'L' : 'M'}${xOf(p[0]).toFixed(1)} ${yOf(p[1]).toFixed(1)}`).join('') };
}

/** Phase contrast: magnitude/phase thumbnails and a flow-time curve with SV and RF. */
export function pcSvg(lang) {
  const t = T[lang];
  const curve = aorticFlowCurve();
  const flow = integrateFlow(curve);
  const box = { x: 46, y: 150, w: 296, h: 104 };
  const p = plot(curve.map(c => [c.t, c.q]), box, [0, 900], [-80, 440]);
  const zero = p.yOf(0);
  const fwd = curve.filter(c => c.q >= 0).map(c => [c.t, c.q]);
  const back = curve.filter(c => c.q <= 0 && c.t > 330).map(c => [c.t, c.q]);
  const area = (pts) => `${plot(pts, box, [0, 900], [-80, 440]).d}L${p.xOf(pts[pts.length - 1][0]).toFixed(1)} ${zero}L${p.xOf(pts[0][0]).toFixed(1)} ${zero}Z`;
  const thumb = (x, cls, inner) => `<rect class="${cls}" x="${x}" y="22" width="92" height="92" rx="6"/>${inner}`;
  const mag = thumb(18, 'pc-mag-bg', `${circle({ x: 56, y: 66 }, 15, 'pc-mag-ao')}${circle({ x: 82, y: 50 }, 11, 'pc-mag-pa')}${circle({ x: 64, y: 98 }, 8, 'pc-mag-ao')}`);
  const ph = thumb(120, 'pc-phase-bg', `${circle({ x: 158, y: 66 }, 15, 'pc-phase-fwd')}${circle({ x: 184, y: 50 }, 11, 'pc-phase-pa')}${circle({ x: 166, y: 98 }, 8, 'pc-phase-rev')}`);
  const n = v => num(v, 0, lang);
  const readout = [`${t.forward}: ${n(flow.forward)} ml`, `${t.backward}: ${n(flow.backward)} ml`, `${t.net}: ${n(flow.net)} ml`, `${t.rf}: ${pct(flow.rf, lang)}`];
  return seqSvg('pc', 'PC', mag + ph
    + text({ x: 64, y: 128 }, t.magnitude, 'cmr-small') + text({ x: 166, y: 128 }, t.phase, 'cmr-small')
    + text({ x: 120, y: 14 }, t.plane, 'cmr-small')
    + `<g data-cmr-readout="pc">${readout.map((ln, i) => text({ x: 226, y: 40 + i * 17 }, ln, i >= 2 ? 'cmr-readout' : 'cmr-small', 'start')).join('')}</g>`
    + t.venc.map((ln, i) => text({ x: 226, y: 112 + i * 12 }, ln, 'cmr-tiny', 'start')).join('')
    + text({ x: 31, y: 70 }, 'Ao', 'cmr-tiny') + text({ x: 82, y: 35 }, 'PA', 'cmr-tiny')
    + `<path class="pc-fwd-area" d="${area(fwd)}"/><path class="pc-back-area" d="${area(back)}"/>`
    + `<line class="cmr-axis-line" x1="${box.x}" y1="${zero}" x2="${box.x + box.w}" y2="${zero}"/><line class="cmr-axis-line" x1="${box.x}" y1="${box.y}" x2="${box.x}" y2="${box.y + box.h}"/>`
    + `<path class="pc-curve" d="${p.d}"/>`
    + [0, 300, 600, 900].map(v => text({ x: p.xOf(v), y: box.y + box.h + 13 }, String(v), 'cmr-tiny')).join('')
    + [0, 200, 400].map(v => text({ x: box.x - 4, y: p.yOf(v) + 3 }, String(v), 'cmr-tiny', 'end')).join('')
    + text({ x: box.x + box.w, y: box.y + box.h + 28 }, t.time, 'cmr-tiny', 'end') + text({ x: box.x + 4, y: box.y - 6 }, t.flow, 'cmr-tiny', 'start')
    + text({ x: 18, y: 294 }, UI[lang].illustrative, 'cmr-tiny', 'start'));
}

const PERF_DEFECT = { basal: [290, 380], mid: [285, 385], apical: [250, 400] };

/** Perfusion: three SAX slices at peak enhancement and signal-intensity curves. */
export function perfusionSvg(lang) {
  const t = T[lang];
  const slices = ['basal', 'mid', 'apical'].map((lvl, i) => {
    const p = saxParts(lvl);
    const [a, b] = PERF_DEFECT[lvl];
    const defect = `<path class="perf-defect" data-cmr-defect="${lvl}" d="${sectorPath(p.c, p.endo, p.endo + 0.5 * (p.epi - p.endo), a, b)}"/>`;
    const cx = 62 + i * 118;
    const k = 0.58;
    return `<g transform="translate(${(cx - 178 * k).toFixed(1)} ${(78 - 150 * k).toFixed(1)}) scale(${k})">${saxBase(lvl, { myo: 'perf-myo', cav: 'perf-blood', rv: 'perf-rv', rvWall: 'perf-rvwall' })}${defect}</g>`
      + text({ x: cx, y: 142 }, t[lvl], 'cmr-small');
  }).join('');
  const box = { x: 46, y: 180, w: 290, h: 82 };
  const curve = (peak, t0, width, tail) => Array.from({ length: 41 }, (_, i) => {
    const s = i * 1.5;
    const g = s < t0 ? 0 : peak * ((s - t0) / width) * Math.exp(1 - (s - t0) / width);
    return [s, g + (s > t0 ? tail * (1 - Math.exp(-(s - t0) / 10)) : 0)];
  });
  const series = [['perf-c-blood', curve(1, 6, 4, 0.18), t.blood], ['perf-c-normal', curve(0.42, 9, 8, 0.12), t.normal], ['perf-c-defect', curve(0.2, 11, 10, 0.08), t.defectCurve]];
  const lines = series.map(([cls, pts]) => `<path class="${cls}" d="${plot(pts, box, [0, 60], [0, 1.2]).d}"/>`).join('');
  const legend = series.map(([cls, , name], i) => `${text({ x: 238, y: 192 + i * 13 }, name, `cmr-tiny perf-key-${i}`, 'start')}<line class="${cls}" x1="222" y1="${189 + i * 13}" x2="234" y2="${189 + i * 13}"/>`).join('');
  return seqSvg('perfusion', 'Perfusion', `${slices}`
    + text({ x: 180, y: 14 }, `${t.peak} · ${t.defect}`, 'cmr-tiny')
    + `<line class="cmr-axis-line" x1="${box.x}" y1="${box.y + box.h}" x2="${box.x + box.w}" y2="${box.y + box.h}"/><line class="cmr-axis-line" x1="${box.x}" y1="${box.y}" x2="${box.x}" y2="${box.y + box.h}"/>`
    + `<g data-cmr-readout="perfusion">${lines}${legend}</g>`
    + text({ x: box.x - 4, y: box.y + 10 }, t.si, 'cmr-tiny', 'end')
    + text({ x: box.x + box.w, y: box.y + box.h + 13 }, lang === 'tr' ? 'Kalp atımı' : 'Heartbeats', 'cmr-tiny', 'end')
    + text({ x: 18, y: 294 }, UI[lang].illustrative, 'cmr-tiny', 'start'));
}

const MRA_LABELS = {
  asc: { tr: 'Çıkan Ao', en: 'Asc. Ao' }, arch: { tr: 'Arkus', en: 'Arch' }, desc: { tr: 'İnen Ao', en: 'Desc. Ao' },
  bca: { tr: 'Brakiyosefalik', en: 'Brachiocephalic' }, lcca: { tr: 'Sol ana karotis', en: 'L common carotid' }, lsa: { tr: 'Sol subklaviyen', en: 'L subclavian' },
  mpa: { tr: 'Ana PA', en: 'Main PA' }, rpa: { tr: 'Sağ PA', en: 'Right PA' }, lpa: { tr: 'Sol PA', en: 'Left PA' }
};

/** 3D CE-MRA: schematic coronal MIP of the thoracic aorta and pulmonary arteries. */
export function mraSvg(lang) {
  const L = id => MRA_LABELS[id][lang];
  const vessel = (d, cls, w) => `<path class="${cls}" stroke-width="${w}" d="${d}"/><path class="${cls}-core" stroke-width="${w * 0.45}" d="${d}"/>`;
  const aorta = smoothPath([{ x: 166, y: 236 }, { x: 156, y: 160 }, { x: 160, y: 104 }, { x: 186, y: 70 }, { x: 222, y: 72 }, { x: 240, y: 106 }, { x: 242, y: 180 }, { x: 239, y: 272 }], false);
  const pa = 'M196 250C194 222 192 200 196 182';
  const rpa = 'M196 182C176 172 140 170 108 178C92 182 82 192 72 204';
  const lpa = 'M196 182C220 168 262 164 284 176C296 184 302 194 306 206';
  return seqSvg('mra', 'MRA', vessel(rpa, 'mra-pa', 15) + vessel(lpa, 'mra-pa', 15) + vessel(pa, 'mra-pa', 22)
    + vessel('M174 78L156 8', 'mra-ao', 10) + vessel('M200 68L202 6', 'mra-ao', 8) + vessel('M226 76L250 8', 'mra-ao', 9)
    + vessel(aorta, 'mra-ao', 24)
    + label('asc', L('asc'), { x: 92, y: 130 }, { target: { x: 156, y: 140 } })
    + label('arch', L('arch'), { x: 204, y: 96 })
    + label('desc', L('desc'), { x: 300, y: 256 }, { target: { x: 242, y: 236 } })
    + label('bca', L('bca'), { x: 96, y: 36 }, { target: { x: 166, y: 46 } })
    + label('lcca', L('lcca'), { x: 290, y: 24 }, { target: { x: 202, y: 24 } })
    + label('lsa', L('lsa'), { x: 300, y: 62 }, { target: { x: 244, y: 30 } })
    + label('mpa', L('mpa'), { x: 118, y: 260 }, { target: { x: 194, y: 226 } })
    + label('rpa', L('rpa'), { x: 60, y: 230 }, { target: { x: 90, y: 188 } })
    + label('lpa', L('lpa'), { x: 316, y: 226 }, { target: { x: 300, y: 194 } })
    + text({ x: 18, y: 294 }, lang === 'tr' ? 'Koronal MIP şeması; çaplar MPR üzerinde ölçülür' : 'Coronal MIP schematic; measure diameters on MPR', 'cmr-tiny', 'start'));
}
