// Sequence schematics, part 1: cine stack, LGE and parametric maps (SVG strings).
import { simpsonStack, extracellularVolume, ECV_EXAMPLE } from './cmr-geometry.js';
import { UI } from './cardiac-mr-data.js';
import { circle, text, sectorPath, svgOpen } from './cmr-svg.js';
import { saxBase, saxParts } from './cmr-sections.js';

export const SEQ_VIEWBOX = '0 0 360 300';
export const num = (v, d, lang) => (lang === 'tr' ? v.toFixed(d).replace('.', ',') : v.toFixed(d));
export const pct = (v, lang) => (lang === 'tr' ? `%${Math.round(v * 100)}` : `${Math.round(v * 100)}%`);

export function seqSvg(id, title, body) {
  return `${svgOpen(SEQ_VIEWBOX, `role="img" aria-label="${title}" data-cmr-seq-view="${id}" class="cmr-svg"`)}<rect class="cmr-bg" width="360" height="300"/>${body}</svg>`;
}

const T = {
  tr: { ed: 'ED kontur', es: 'ES kontur', slice: 'Kesit', basal: 'bazal', apical: 'apikal', normal: 'Örnek normal', focal: 'Odak artış', siteSpecific: 'Değerler saha ve sekansa özgüdür', blood: 'Kan havuzu', oedema: 'Ödem', scar: 'Skar (parlak)', nulled: 'Normal miyokart (sıfırlanmış)' },
  en: { ed: 'ED contour', es: 'ES contour', slice: 'Slice', basal: 'basal', apical: 'apical', normal: 'Illustrative normal', focal: 'Focal rise', siteSpecific: 'Values are site- and sequence-specific', blood: 'Blood pool', oedema: 'Oedema', scar: 'Scar (bright)', nulled: 'Normal myocardium (nulled)' }
};

/** Cine: SAX stack thumbnails base to apex with ED/ES contours and a Simpson EF. */
export function cineSvg(lang) {
  const t = T[lang];
  const r = simpsonStack();
  const k = 1.05;
  const cells = r.slices.map((sl, i) => {
    const x = 38 + (i % 5) * 71;
    const y = 60 + Math.floor(i / 5) * 90;
    const ed = sl.edRadiusMm * k;
    const es = sl.esRadiusMm * k;
    const wall = 7 + (1 - sl.s) * 2;
    return `<g data-cmr-slice="${i}">${circle({ x, y }, ed + wall, 'cine-myo')}${circle({ x, y }, ed, 'cine-blood')}`
      + `${circle({ x, y }, ed, 'cine-ed')}${circle({ x, y }, Math.max(es, 0.8), 'cine-es')}`
      + `${text({ x, y: y + 42 }, `${i + 1}${i === 0 ? ` ${t.basal}` : i === 9 ? ` ${t.apical}` : ''}`, 'cmr-small')}</g>`;
  }).join('');
  const readout = `EDV ${num(r.edv, 0, lang)} ml · ESV ${num(r.esv, 0, lang)} ml · EF ${pct(r.ef, lang)}`;
  const method = `Simpson: ${r.slices.length} × ${num(r.thicknessMm, 1, lang)} mm`;
  return seqSvg('cine', 'Cine', `${text({ x: 18, y: 20 }, `${t.slice} 1 → 10`, 'cmr-small', 'start')}${cells}`
    + `<line class="cine-ed" x1="20" y1="236" x2="40" y2="236"/>${text({ x: 46, y: 240 }, t.ed, 'cmr-small', 'start')}`
    + `<line class="cine-es" x1="130" y1="236" x2="150" y2="236"/>${text({ x: 156, y: 240 }, t.es, 'cmr-small', 'start')}`
    + `<g data-cmr-readout="cine">${text({ x: 18, y: 264 }, readout, 'cmr-readout', 'start')}${text({ x: 18, y: 284 }, `${method} · ${UI[lang].illustrative}`, 'cmr-small', 'start')}</g>`);
}

export const LGE_SCAR = {
  subendo: { a: 280, b: 390, inner: 0, outer: 0.45 },
  transmural: { a: 280, b: 390, inner: 0, outer: 1 },
  midwall: { a: 215, b: 320, inner: 0.35, outer: 0.68 },
  epicardial: { a: 95, b: 150, inner: 0.58, outer: 1 }
};

/** LGE: nulled dark myocardium, bright blood and bright scar for the selected pattern. */
export function lgeSvg(lang, pattern = 'subendo') {
  const t = T[lang];
  const p = saxParts('mid');
  const s = LGE_SCAR[pattern] || LGE_SCAR.subendo;
  const wall = p.epi - p.endo;
  const scar = `<path class="lge-scar" data-cmr-scar="${pattern}" d="${sectorPath(p.c, p.endo + s.inner * wall, p.endo + s.outer * wall, s.a, s.b)}"/>`;
  return seqSvg('lge', 'LGE', '<ellipse class="mr-tissue" cx="186" cy="150" rx="168" ry="124"/>' + saxBase('mid', { myo: 'lge-myo', cav: 'lge-blood', rv: 'lge-blood', rvWall: 'lge-rvwall' }) + scar
    + `<rect class="lge-key-myo" x="18" y="250" width="12" height="12"/>${text({ x: 36, y: 260 }, t.nulled, 'cmr-small', 'start')}`
    + `<rect class="lge-scar" x="18" y="270" width="12" height="12"/>${text({ x: 36, y: 280 }, t.scar, 'cmr-small', 'start')}`);
}

/** Colour ramp for maps: 0..1 to a dark-blue, teal, yellow, red scale. */
export function rampColour(x) {
  const stops = [[0, [30, 41, 120]], [0.35, [20, 150, 160]], [0.6, [120, 200, 90]], [0.8, [250, 204, 21]], [1, [220, 38, 38]]];
  const v = Math.max(0, Math.min(1, x));
  for (let i = 1; i < stops.length; i += 1) {
    if (v <= stops[i][0]) {
      const [x0, c0] = stops[i - 1];
      const [x1, c1] = stops[i];
      const k = (v - x0) / (x1 - x0);
      return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`;
    }
  }
  return 'rgb(220,38,38)';
}

function colourBar({ min, max, ticks, unit, normal, x = 316, y = 40, h = 180 }, lang) {
  const t = T[lang];
  const stops = Array.from({ length: 11 }, (_, i) => `<stop offset="${i * 10}%" stop-color="${rampColour(1 - i / 10)}"/>`).join('');
  const yOf = v => y + h * (1 - (v - min) / (max - min));
  const tickMarks = ticks.map(v => `<line class="cmr-tick" x1="${x + 12}" y1="${yOf(v)}" x2="${x + 16}" y2="${yOf(v)}"/>${text({ x: x + 18, y: yOf(v) + 3 }, String(v), 'cmr-small', 'start')}`).join('');
  return `<defs><linearGradient id="cmr-ramp-${unit}-${min}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>`
    + `<rect x="${x}" y="${y}" width="12" height="${h}" fill="url(#cmr-ramp-${unit}-${min})" class="cmr-bar"/>${tickMarks}`
    + `<path class="cmr-normal-bracket" d="M${x - 3} ${yOf(normal[0])}H${x - 8}V${yOf(normal[1])}H${x - 3}"/>`
    + text({ x: x + 6, y: y - 8 }, unit, 'cmr-small') + text({ x: 350, y: y + h + 18 }, `[ ${t.normal} ${normal[0]}–${normal[1]}`, 'cmr-tiny', 'end');
}

function mapSax(scaleDef, regions, bloodValue) {
  const p = saxParts('mid');
  const v2x = v => (v - scaleDef.min) / (scaleDef.max - scaleDef.min);
  const base = rampColour(v2x(scaleDef.base));
  const blood = bloodValue == null ? '#334155' : rampColour(v2x(bloodValue));
  const wall = p.epi - p.endo;
  const sectors = regions.map(rg => `<path data-cmr-map-region="${rg.id}" fill="${rampColour(v2x(rg.value))}" d="${sectorPath(p.c, p.endo + rg.inner * wall, p.endo + rg.outer * wall, rg.a, rg.b)}"/>`).join('');
  return `<path fill="${blood}" class="map-edge" d="${p.rvCavity}"/><path class="map-rvwall" stroke="${base}" d="${p.rvWall}"/>`
    + `<circle cx="${p.c.x}" cy="${p.c.y}" r="${p.epi}" fill="${base}" class="map-edge"/>${sectors}`
    + `<circle cx="${p.c.x}" cy="${p.c.y}" r="${p.endo}" fill="${blood}" class="map-edge"/>`;
}

/** Native T1 map with a focal elevated region and the ECV formula with example numbers. */
export function t1Svg(lang) {
  const t = T[lang];
  const sc = { min: 800, max: 1400, base: 1000, ticks: [800, 1000, 1200, 1400], unit: 'ms', normal: [950, 1050] };
  const e = extracellularVolume(ECV_EXAMPLE);
  const n = (v, d) => num(v, d, lang);
  const ecv = [
    `ECV = (1 − Hct) × (ΔR1 ${lang === 'tr' ? 'miyokart' : 'myocardium'} / ΔR1 ${lang === 'tr' ? 'kan' : 'blood'})`,
    `${lang === 'tr' ? 'Miyokart' : 'Myocardium'} T1 ${ECV_EXAMPLE.myoPre} → ${ECV_EXAMPLE.myoPost} ms · ${lang === 'tr' ? 'Kan' : 'Blood'} T1 ${ECV_EXAMPLE.bloodPre} → ${ECV_EXAMPLE.bloodPost} ms · Hct ${n(ECV_EXAMPLE.hct, 2)}`,
    `= ${n(1 - ECV_EXAMPLE.hct, 2)} × (${n(e.dR1Myo * 1000, 3)} / ${n(e.dR1Blood * 1000, 3)} s⁻¹) = ECV ${pct(e.ecv, lang)}`
  ];
  return seqSvg('t1', 'T1', mapSax(sc, [{ id: 'focal', value: 1230, a: 100, b: 150, inner: 0.2, outer: 0.85 }], null)
    + colourBar(sc, lang)
    + text({ x: 18, y: 22 }, `${t.focal}: ~1230 ms`, 'cmr-small', 'start') + text({ x: 18, y: 36 }, t.siteSpecific, 'cmr-small', 'start')
    + text({ x: 18, y: 50 }, `${t.blood}: ~1600 ms (${lang === 'tr' ? 'ölçek dışı, gri' : 'outside scale, grey'})`, 'cmr-tiny', 'start')
    + `<g data-cmr-readout="ecv">${ecv.map((ln, i) => text({ x: 18, y: 252 + i * 15 }, ln, i === 2 ? 'cmr-readout' : 'cmr-small', 'start')).join('')}</g>`);
}

/** T2 map with a regional oedema area. */
export function t2Svg(lang) {
  const t = T[lang];
  const sc = { min: 30, max: 80, base: 50, ticks: [30, 40, 50, 60, 70, 80], unit: 'ms', normal: [45, 55] };
  return seqSvg('t2', 'T2', mapSax(sc, [{ id: 'oedema', value: 67, a: 55, b: 140, inner: 0, outer: 1 }], null)
    + colourBar(sc, lang)
    + text({ x: 18, y: 22 }, `${t.oedema}: ~67 ms`, 'cmr-small', 'start') + text({ x: 18, y: 36 }, t.siteSpecific, 'cmr-small', 'start')
    + text({ x: 18, y: 262 }, `${t.blood}: ${lang === 'tr' ? 'ölçek dışı (gri)' : 'outside scale (grey)'}`, 'cmr-small', 'start')
    + text({ x: 18, y: 280 }, UI[lang].illustrative, 'cmr-small', 'start'));
}

