// Acute valvular emergencies: haemodynamic findings table with live monitor
// traces (PA, PCWP, Ao) drawn by a pen in sync with the shared cycle clock,
// a beating heart schematic for the focused row and a Normal/Acute blend.
import { pvModelLoop, pvParams } from '../hemo-pv-model.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';
// CSS loads only in the browser so Node tests can import the pure functions.
if (typeof document !== 'undefined') import('./acute-valve-hemo.css');

// Waveform time t (0..1) starts at mitral closure / QRS, i.e. the clock's
// isovolumic contraction. Ejection then runs t 0.08..0.43 and the mitral
// valve opens at t 0.55, matching the clock's phase windows.
const T0 = pvModelLoop(pvParams({}, 'normal')).phases.ivc[0];
const EJ_START = 0.08;
const MV_OPEN = 0.55;

export const wrap01 = x => ((x % 1) + 1) % 1;
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => { const c = clamp01(x); return c * c * (3 - 2 * c); };
const circDist = (t, mu) => wrap01(t - mu + 0.5) - 0.5;

/** Circular Gaussian bump centred at mu. */
export function bump(t, mu, sigma) {
  const d = circDist(t, mu) / sigma;
  return Math.exp(-0.5 * d * d);
}

/** Asymmetric circular bump: slow rise (sigma rise), faster fall (sigma fall). */
export function bumpAsym(t, mu, rise, fall) {
  const d = circDist(t, mu), s = d < 0 ? rise : fall;
  return Math.exp(-0.5 * (d / s) * (d / s));
}

/**
 * Generic arterial pressure pulse. s runs from valve opening; ejection
 * lasts tEnd. anacrotic (0..1) adds an early shoulder on the upstroke,
 * runoff shapes the diastolic decay (large = fast fall then plateau).
 */
export function arterialPressure(t, p) {
  const s = wrap01(t - (p.start ?? EJ_START));
  const span = p.sys - p.dia;
  if (s <= p.tEnd) {
    let v;
    if (s < p.tPeak) {
      const f = s / p.tPeak, a = p.anacrotic || 0;
      v = (1 - a) * smooth(f) + a * (0.45 * smooth(f / 0.3) + 0.55 * smooth((f - 0.45) / 0.55));
    } else {
      v = 1 - (1 - p.endFrac) * smooth((s - p.tPeak) / (p.tEnd - p.tPeak));
    }
    return p.dia + span * v;
  }
  const tau = (s - p.tEnd) / (1 - p.tEnd);
  const pes = span * p.endFrac;
  const notch = -p.notch * Math.exp(-0.5 * ((s - p.tEnd - 0.012) / 0.012) ** 2)
    + p.notch * 0.8 * Math.exp(-0.5 * ((s - p.tEnd - 0.05) / 0.022) ** 2);
  return p.dia + pes * (1 - tau) ** p.runoff + notch * (1 - tau);
}

const AO_NORMAL = { dia: 78, sys: 120, tPeak: 0.1, tEnd: 0.35, endFrac: 0.76, notch: 6, runoff: 1.5 };
const AO_AR = { dia: 60, sys: 95, tPeak: 0.09, tEnd: 0.35, endFrac: 0.7, notch: 1.5, runoff: 3.6 };
const AO_AS = { dia: 74, sys: 97, tPeak: 0.27, tEnd: 0.39, endFrac: 0.86, notch: 1, runoff: 1.5, anacrotic: 1 };
const PA_NORMAL = { dia: 10, sys: 25, tPeak: 0.09, tEnd: 0.33, endFrac: 0.8, notch: 1.5, runoff: 1.4 };
const PA_MR = { dia: 22, sys: 46, tPeak: 0.09, tEnd: 0.33, endFrac: 0.8, notch: 2, runoff: 1.4 };

export const aoNormal = t => arterialPressure(t, AO_NORMAL);
/** Acute AR: low peak, fast diastolic fall that equilibrates with high LVEDP; pulse pressure not widened. */
export const aoAR = t => arterialPressure(t, AO_AR);
/** AS: anacrotic shoulder, late low peak (tardus), small pulse pressure (parvus). */
export const aoAS = t => arterialPressure(t, AO_AS);
export const paNormal = t => arterialPressure(t, PA_NORMAL);
/** Acute MR: raised PA pressure with a transmitted v wave on the downslope. */
export const paMR = t => arterialPressure(t, PA_MR) + 7 * bumpAsym(t, 0.56, 0.05, 0.04);

/** Normal PCWP (left atrial) trace: a, c, x, v, y. */
export const pcwpNormal = t => 8 + 4 * bump(t, 0.93, 0.03) + 1.5 * bump(t, 0.07, 0.02)
  - 2.5 * bump(t, 0.25, 0.08) + 4.5 * bumpAsym(t, 0.52, 0.1, 0.04) - 1.5 * bump(t, 0.63, 0.05);
/** Acute MR: small a, then a giant c-v wave through systole and a steep y descent. */
export const pcwpMR = t => 16 + 4 * bump(t, 0.93, 0.03) + 30 * bumpAsym(t, 0.52, 0.2, 0.045)
  - 4 * bump(t, 0.65, 0.05);
/** MS: giant a, c notch, x descent, small v and a slow y descent. */
export const pcwpMS = t => 20 + 17 * bump(t, 0.93, 0.03) + 2.5 * bump(t, 0.07, 0.018)
  - 5 * bump(t, 0.22, 0.07) + 5 * bumpAsym(t, 0.52, 0.1, 0.04) + 6 * bumpAsym(t, 0.55, 0.03, 0.26);

/** Linear blend between a normal and an abnormal waveform (k = 0 normal, 1 abnormal). */
export function blendWave(normalFn, acuteFn, k) {
  return t => normalFn(t) + k * (acuteFn(t) - normalFn(t));
}

/** n + 1 samples of fn over one beat. */
export function sampleWave(fn, n = 100) {
  return Array.from({ length: n + 1 }, (_, i) => fn(i / n));
}

/** Mitral and aortic leaflet opening (0..1) at t for the schematic. */
export function valveOpening(t) {
  const s = t - EJ_START;
  const aortic = s >= 0 && s <= 0.35 ? clamp01(4 * Math.sin((Math.PI * s) / 0.35)) : 0;
  const mitral = t >= MV_OPEN ? clamp01(Math.min((t - MV_OPEN) / 0.05, (1 - t) / 0.03)) : 0;
  return { aortic, mitral };
}

const CH = {
  pa: { label: 'PA', range: [0, 64], normal: paNormal },
  pcwp: { label: 'PCWP', range: [0, 52], normal: pcwpNormal },
  ao: { label: 'Ao', range: [40, 135], normal: aoNormal }
};

const L = (tr, en) => ({ tr, en });

export const ROWS = Object.freeze([
  {
    id: 'mr', color: '#1971c2', name: L('Mitral yetersizliği', 'Mitral regurgitation'), abbr: 'MR',
    arrows: ['down', 'up', 'up'],
    findings: L("Pulmoner arterde 'v' dalgaları; uzun 'v' veya 'c-v' PCWP dalgaları", "Pulmonary artery 'v' waves; tall 'v' or 'c-v' PCWP waves"),
    mech: L('Sistolde LV kanı yetersiz mitral kapaktan küçük, kompliyansı düşük LA içine fışkırır; LA basıncı sistol boyunca yükselir ve dev v dalgası oluşur, PA izine de yansır.',
      'In systole LV blood jets back through the incompetent mitral valve into a small, non-compliant LA; LA pressure climbs through systole into a giant v wave that is also transmitted to the PA trace.'),
    channels: [
      { key: 'pa', acute: paMR, marks: [{ id: 'v', t: 0.56 }] },
      { key: 'pcwp', acute: pcwpMR, marks: [{ id: 'a', t: 0.93 }, { id: 'v', t: 0.52 }, { id: 'y', t: 0.66, down: true }] }
    ]
  },
  {
    id: 'ar', color: '#e03131', name: L('Aort yetersizliği', 'Aortic regurgitation'), abbr: 'AR',
    arrows: ['down', 'up', 'up'],
    findings: L('Normal veya dar nabız basıncı', 'Normal or narrow pulse pressure'),
    note: L('Akut AY kronik AY gibi geniş nabız basıncı vermez: dilate olmamış LV hızla dolar, LVEDP yükselir ve aort diyastolik basıncına erken eşitlenir.',
      'Acute AR does not give the wide pulse pressure of chronic AR: the non-dilated LV fills fast, LVEDP rises and equalises early with aortic diastolic pressure.'),
    mech: L('Diyastolde aorttan LV içine geri akım olur; hazırlıksız LV hızla dolar, LVEDP keskin yükselir, ileri atım hacmi ve sistolik basınç düşer.',
      'In diastole blood regurgitates from the aorta into the LV; the unprepared LV fills fast, LVEDP rises steeply and forward stroke volume and systolic pressure fall.'),
    channels: [
      { key: 'ao', acute: aoAR, marks: [{ id: L('düşük tepe', 'low peak'), t: 0.17, big: true }, { id: L('erken eşitlenme', 'early equalisation'), t: 0.78, down: true, big: true }] }
    ]
  },
  {
    id: 'ms', color: '#2f9e44', name: L('Mitral darlığı', 'Mitral stenosis'), abbr: 'MS',
    arrows: ['down', 'flat', 'up'],
    findings: L("Dev 'a' dalgaları", "Giant 'a' waves"),
    mech: L('Daralmış mitral orifis LA boşalmasını kısıtlar; geç diyastolde atriyal kasılma dar orifise karşı çalışır ve dev a dalgası oluşur, y inişi yavaştır. LV az dolar, LVEDP düşük veya normaldir.',
      'The narrowed mitral orifice limits LA emptying; in late diastole the atrial kick pushes against the narrow orifice and raises a giant a wave, with a slow y descent. The LV underfills, so LVEDP is low or normal.'),
    channels: [
      { key: 'pcwp', acute: pcwpMS, marks: [{ id: 'a', t: 0.93 }, { id: 'c', t: 0.07 }, { id: 'x', t: 0.22, down: true }, { id: 'v', t: 0.52 }, { id: 'y', t: 0.75, down: true }] }
    ]
  },
  {
    id: 'as', color: '#f08c00', name: L('Aort darlığı', 'Aortic stenosis'), abbr: 'AS',
    arrows: ['down', 'up', 'up'],
    findings: L('Anakrotik nabız, gecikmiş yükseliş (pulsus tardus); normal veya dar nabız basıncı (pulsus parvus)',
      'Anacrotic pulse, delayed upstroke (pulsus tardus); normal or narrow pulse pressure (pulsus parvus)'),
    mech: L('Daralmış aort orifisi ejeksiyonu yavaşlatır ve uzatır; aort basıncı omuzlu (anakrotik) ve geç yükselir, tepe düşük kalır. Hipertrofik, sert LV de LVEDP değerini artırır.',
      'The narrowed aortic orifice slows and prolongs ejection; aortic pressure rises late with an anacrotic shoulder and peaks low. The hypertrophied, stiff LV also raises LVEDP.'),
    channels: [
      { key: 'ao', acute: aoAS, marks: [{ id: L('anakrotik omuz', 'anacrotic shoulder'), t: 0.115, big: true }, { id: L('geç, düşük tepe', 'late, low peak'), t: 0.35, big: true }] }
    ]
  }
]);

const TEXT = {
  title: L('Akut kapak acillerinde hemodinamik bulgular', 'Haemodynamic findings in acute valvular emergencies'),
  intro: L('Monitör kalemi her atımı canlı çizer: kesikli gri çizgi normal, renkli düz çizgi patolojik izdir. Mekanizmayı görmek için bir satıra tıklayın.',
    'The monitor pen draws every beat live: the dashed grey line is the normal tracing, the solid coloured line the abnormal one. Click a row to see the mechanism.'),
  condition: L('Durum', 'Condition'),
  findings: L('Bulgular', 'Findings'),
  wave: L('Dalga formu', 'Waveform'),
  live: L('Canlı monitör:', 'Live monitor:'),
  blend: L('İz:', 'Trace:'),
  normal: L('Normal', 'Normal'),
  acute: L('Akut', 'Acute'),
  focusHint: L('Ayrıntı için tıklayın', 'Click for detail'),
  arrows: { down: L('azalmış', 'decreased'), up: L('artmış', 'increased'), flat: L('azalmış veya değişmemiş', 'decreased or unchanged') },
  caption: L('CO: kalp debisi; LVEDP: sol ventrikül diyastol sonu basıncı; PCWP: pulmoner kapiller kama basıncı; PA: pulmoner arter; PAC: pulmoner arter kateteri; Ao: aort. PA ve PCWP izleri PAC ile, Ao izi arter kanülü ile alınır. Düz çizgi = patolojik iz, kesikli çizgi = normal iz.',
    'CO: cardiac output; LVEDP: left ventricular end-diastolic pressure; PCWP: pulmonary capillary wedge pressure; PA: pulmonary artery; PAC: pulmonary artery catheter; Ao: aorta. PA and PCWP traces come from the PAC, the Ao trace from an arterial line. Solid line = abnormal tracing, dashed line = normal tracing.')
};

const ARROW_GLYPH = { down: '↓', up: '↑', flat: '↓ / ↔' };
const COLS = ['CO', 'LVEDP', 'PCWP'];
const SMALL = { w: 300, h: 62, padL: 34, padR: 6, padT: 6, padB: 6 };
const LARGE = { w: 560, h: 150, padL: 40, padR: 10, padT: 12, padB: 12 };
const SAMPLES = 180; // two beats per sweep
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ---------- trace drawing ---------- */

function traceGeometry(ch, dims) {
  const [lo, hi] = CH[ch.key].range;
  const x = frac => dims.padL + frac * (dims.w - dims.padL - dims.padR);
  const y = p => dims.h - dims.padB - ((p - lo) / (hi - lo)) * (dims.h - dims.padT - dims.padB);
  return { x, y, lo, hi };
}

function sweepPath(fn, geo, upTo) {
  const last = Math.floor(upTo * SAMPLES);
  const parts = [];
  for (let i = 0; i <= last; i++) {
    const f = i / SAMPLES;
    parts.push(`${i ? 'L' : 'M'}${geo.x(f).toFixed(1)} ${geo.y(fn(wrap01(f * 2))).toFixed(1)}`);
  }
  if (upTo > last / SAMPLES) parts.push(`L${geo.x(upTo).toFixed(1)} ${geo.y(fn(wrap01(upTo * 2))).toFixed(1)}`);
  return parts.join('');
}

function staticTrace(ch, dims, color) {
  const geo = traceGeometry(ch, dims);
  const ticks = [geo.lo, Math.round((geo.lo + geo.hi) / 2), geo.hi];
  const grid = ticks.map(v => `<line class="avh-grid" x1="${dims.padL}" x2="${dims.w - dims.padR}" y1="${geo.y(v).toFixed(1)}" y2="${geo.y(v).toFixed(1)}"/>
    <text class="avh-tick" x="${dims.padL - 4}" y="${(geo.y(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const beat = `<line class="avh-beat" x1="${geo.x(0.5)}" x2="${geo.x(0.5)}" y1="${dims.padT}" y2="${dims.h - dims.padB}"/>`;
  return `<g>${grid}${beat}
    <path class="avh-normal" d="${sweepPath(CH[ch.key].normal, geo, 1)}"/>
    <text class="avh-ch-label" x="${dims.padL + 4}" y="${dims.padT + 10}" fill="${color}">${CH[ch.key].label}</text></g>
    <path class="avh-solid" data-solid stroke="${color}"/>
    <g data-marks></g>
    <circle class="avh-pen" data-pen r="${dims === LARGE ? 4.5 : 3}" fill="${color}"/>`;
}

function createTrace(ch, dims, color) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${dims.w} ${dims.h}`);
  svg.setAttribute('class', `avh-trace ${dims === LARGE ? 'is-large' : 'is-small'}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', CH[ch.key].label);
  svg.innerHTML = staticTrace(ch, dims, color);
  return {
    svg, ch, dims, geo: traceGeometry(ch, dims), marksKey: '',
    solid: svg.querySelector('[data-solid]'), pen: svg.querySelector('[data-pen]'), marks: svg.querySelector('[data-marks]')
  };
}

function markText(mark, lang) {
  return typeof mark.id === 'string' ? mark.id : mark.id[lang];
}

function drawMarks(tr, fn, upTo, lang, k) {
  const big = tr.dims === LARGE;
  const visible = [];
  for (let beat = 0; beat < 2; beat++) {
    tr.ch.marks.forEach((m, i) => {
      if ((m.big && !big) || (beat + m.t) / 2 > upTo) return;
      visible.push({ m, i, beat });
    });
  }
  const key = `${visible.map(v => `${v.beat}${v.i}`).join(',')}|${lang}|${k.toFixed(2)}`;
  if (key === tr.marksKey) return;
  tr.marksKey = key;
  const before = tr.shown || new Set();
  tr.shown = new Set(visible.map(v => `${v.beat}${v.i}`));
  tr.marks.innerHTML = visible.map(({ m, i, beat }) => {
    const f = (beat + m.t) / 2, x = tr.geo.x(f), y = tr.geo.y(fn(m.t));
    const dy = m.down ? (big ? 16 : 11) : (big ? -8 : -4);
    const fresh = before.has(`${beat}${i}`) ? '' : ' is-new';
    const cls = `avh-mark ${typeof m.id === 'string' ? 'is-letter' : 'is-tag'}${fresh}`;
    return `<text class="${cls}" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="middle">${markText(m, lang)}</text>`;
  }).join('');
}

function drawTrace(tr, upTo, k, lang) {
  const fn = blendWave(CH[tr.ch.key].normal, tr.ch.acute, k);
  tr.solid.setAttribute('d', sweepPath(fn, tr.geo, upTo));
  tr.pen.setAttribute('cx', tr.geo.x(upTo).toFixed(1));
  tr.pen.setAttribute('cy', tr.geo.y(fn(wrap01(upTo * 2))).toFixed(1));
  drawMarks(tr, fn, upTo, lang, k);
}

/* ---------- heart schematic ---------- */

function heartMarkup(row) {
  return `<svg viewBox="0 0 220 210" class="avh-heart" role="img" aria-label="${row.abbr}">
    <path class="avh-aorta" d="M86 96 C 82 62, 72 36, 58 10"/>
    <ellipse class="avh-la" data-la cx="142" cy="46" rx="42" ry="26"/>
    <ellipse class="avh-lv" data-lv cx="124" cy="138" rx="50" ry="54"/>
    <path class="avh-jet" data-jet stroke="${row.color}"/>
    <g class="avh-leaflets">
      <line data-mv-l x1="120" y1="80"/><line data-mv-r x1="164" y1="80"/>
      <line data-av-l x1="73" y1="96"/><line data-av-r x1="99" y1="96"/>
    </g>
    <text class="avh-heart-label" x="142" y="50" text-anchor="middle">LA</text>
    <text class="avh-heart-label" x="124" y="160" text-anchor="middle">LV</text>
    <text class="avh-heart-label" x="40" y="22" text-anchor="middle">Ao</text>
    <text class="avh-heart-read" data-read x="110" y="204" text-anchor="middle"></text>
  </svg>`;
}

const JETS = {
  mr: { d: 'M142 104 L142 34', on: t => (t < MV_OPEN ? Math.sin((Math.PI * t) / MV_OPEN) : 0), regurgitant: true },
  ar: { d: 'M86 96 L112 168', on: t => (t > 0.43 ? 1 - 0.7 * ((t - 0.43) / 0.57) : 0), regurgitant: true },
  ms: { d: 'M142 52 L142 140', on: (t, v) => v.mitral * (0.5 + 0.5 * bump(t, 0.93, 0.04)), regurgitant: false },
  as: { d: 'M104 150 L86 96 L60 14', on: (t, v) => v.aortic, regurgitant: false }
};

function setLine(el, x2, y2) {
  el.setAttribute('x2', x2.toFixed(1));
  el.setAttribute('y2', y2.toFixed(1));
}

function drawLeaflets(heart, row, v, k) {
  const mvMax = row.id === 'ms' ? 1 - 0.75 * k : 1, avMax = row.id === 'as' ? 1 - 0.75 * k : 1;
  const mvGap = row.id === 'mr' ? 4 * k : 0, avGap = row.id === 'ar' ? 4 * k : 0;
  const mo = v.mitral * mvMax, ao = v.aortic * avMax;
  setLine(heart.mvL, 120 + 20 * (1 - mo) - mvGap + 3 * mo, 82 + 22 * mo);
  setLine(heart.mvR, 164 - 20 * (1 - mo) + mvGap - 3 * mo, 82 + 22 * mo);
  setLine(heart.avL, 73 + 12 * (1 - ao) - avGap - 2 * ao, 92 - 20 * ao);
  setLine(heart.avR, 99 - 12 * (1 - ao) + avGap + 2 * ao, 92 - 20 * ao);
  heart.svg.classList.toggle('is-thick', (row.id === 'ms' || row.id === 'as') && k > 0.5);
}

function drawHeart(heart, row, t, contraction, k, lang) {
  const v = valveOpening(t);
  const pcwp = blendWave(pcwpNormal, row.id === 'mr' ? pcwpMR : row.id === 'ms' ? pcwpMS : pcwpNormal, k)(t);
  const kick = bump(t, 0.93, 0.03);
  heart.la.setAttribute('rx', (34 + pcwp * 0.35 - 4 * kick).toFixed(1));
  heart.la.setAttribute('ry', (21 + pcwp * 0.2 - 3 * kick).toFixed(1));
  const fillBoost = row.id === 'ar' ? 4 * k * (t > 0.43 ? 1 : 0) : row.id === 'ms' ? -4 * k : 0;
  heart.lv.setAttribute('rx', (50 - 9 * contraction + fillBoost).toFixed(1));
  heart.lv.setAttribute('ry', (54 - 6 * contraction).toFixed(1));
  drawLeaflets(heart, row, v, k);
  const jet = JETS[row.id];
  const level = clamp01(jet.on(t, v) * (jet.regurgitant ? k : 1));
  const narrow = jet.regurgitant ? 7 : 14 - 10 * k;
  heart.jet.setAttribute('d', jet.d);
  heart.jet.setAttribute('stroke-width', narrow.toFixed(1));
  heart.jet.setAttribute('opacity', level > 0.02 ? (0.15 + 0.75 * level).toFixed(2) : '0');
  heart.jet.setAttribute('stroke-dashoffset', (-t * 240).toFixed(1));
  const read = row.channels.map(ch => `${CH[ch.key].label} ${Math.round(blendWave(CH[ch.key].normal, ch.acute, k)(t))}`).join(' · ');
  heart.read.textContent = `${read} mmHg`;
  heart.svg.setAttribute('aria-label', `${row.abbr}: ${row.mech[lang]}`);
}

function createHeart(row) {
  const wrapEl = document.createElement('div');
  wrapEl.innerHTML = heartMarkup(row);
  const svg = wrapEl.firstElementChild, q = s => svg.querySelector(s);
  return {
    svg, la: q('[data-la]'), lv: q('[data-lv]'), jet: q('[data-jet]'), read: q('[data-read]'),
    mvL: q('[data-mv-l]'), mvR: q('[data-mv-r]'), avL: q('[data-av-l]'), avR: q('[data-av-r]')
  };
}

/* ---------- table ---------- */

function rowMarkup(row) {
  const arrows = row.arrows.map((dir, i) => `<div class="avh-cell avh-arrow-cell" data-col="${COLS[i]}">
      <span class="avh-arrow" data-dir="${dir}" style="--i:${i}">${ARROW_GLYPH[dir]}</span>
      <span class="avh-sr" data-arrow-sr="${dir}"></span></div>`).join('');
  return `<div class="avh-row-main" role="button" tabindex="0" aria-expanded="false">
      <div class="avh-cell avh-label-cell"><span class="avh-chip">${row.abbr}</span><span data-row-name></span></div>
      ${arrows}
      <div class="avh-cell avh-find-cell"><span data-row-find></span><small class="avh-hint" data-i18n="focusHint"></small></div>
      <div class="avh-cell avh-wave-cell" data-small></div>
    </div>
    <div class="avh-detail" hidden>
      <div class="avh-detail-traces" data-large></div>
      <div class="avh-detail-side"><div data-heart></div><p class="avh-mech" data-row-mech></p>
        ${row.note ? '<p class="avh-note" data-row-note></p>' : ''}</div>
    </div>`;
}

function buildRow(row) {
  const el = document.createElement('div');
  el.className = 'avh-row';
  el.dataset.row = row.id;
  el.style.setProperty('--row-c', row.color);
  el.innerHTML = rowMarkup(row);
  const small = row.channels.map(ch => createTrace(ch, SMALL, row.color));
  const large = row.channels.map(ch => createTrace(ch, LARGE, row.color));
  small.forEach(tr => el.querySelector('[data-small]').append(tr.svg));
  large.forEach(tr => el.querySelector('[data-large]').append(tr.svg));
  const heart = createHeart(row);
  el.querySelector('[data-heart]').append(heart.svg);
  return { row, el, small, large, heart, main: el.querySelector('.avh-row-main'), detail: el.querySelector('.avh-detail') };
}

function rootMarkup() {
  return `<div class="avh-head">
      <div><h3 data-i18n="title"></h3><p data-i18n="intro"></p></div>
      <div class="preset-pill-group avh-blend" role="group">
        <span class="preset-label" data-i18n="blend"></span>
        <button type="button" class="preset-pill" data-blend="0" data-i18n="normal"></button>
        <span class="avh-blend-arrow" aria-hidden="true">↔</span>
        <button type="button" class="preset-pill" data-blend="1" data-i18n="acute"></button>
      </div>
    </div>
    <div class="avh-table" role="table">
      <div class="avh-header" role="row">
        <span data-i18n="condition"></span><span>CO</span><span>LVEDP</span><span>PCWP</span>
        <span data-i18n="findings"></span><span data-i18n="wave"></span>
      </div>
      <div data-rows></div>
    </div>
    <p class="avh-caption" data-i18n="caption"></p>`;
}

/* ---------- lab ---------- */

export function createAcuteValveHemoLab({ container, lang = 'tr' } = {}) {
  if (!container) throw new Error('createAcuteValveHemoLab: container is required');
  let currentLang = lang === 'en' ? 'en' : 'tr';
  let k = 1, cancelTween = () => {}, focusedId = null, parity = 0, lastT = null;
  const getLang = () => currentLang;
  const root = document.createElement('section');
  root.className = 'pathophys-lab avh-lab';
  root.innerHTML = rootMarkup();
  const clock = createCycleClock({ bpm: 72, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: TEXT.live });
  root.prepend(motionBar.element);
  const rows = ROWS.map(buildRow);
  rows.forEach(r => root.querySelector('[data-rows]').append(r.el));
  container.append(root);

  function applyText() {
    const t = o => o[currentLang];
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(TEXT[el.dataset.i18n]); });
    rows.forEach(({ row, el }) => {
      el.querySelector('[data-row-name]').textContent = t(row.name);
      el.querySelector('[data-row-find]').textContent = t(row.findings);
      el.querySelector('[data-row-mech]').textContent = t(row.mech);
      if (row.note) el.querySelector('[data-row-note]').textContent = t(row.note);
      el.querySelectorAll('[data-arrow-sr]').forEach(sr => { sr.textContent = t(TEXT.arrows[sr.dataset.arrowSr]); });
      el.querySelector('.avh-row-main').setAttribute('aria-label', `${t(row.name)}: ${t(row.findings)}`);
    });
    root.querySelector('.avh-blend').setAttribute('aria-label', t(TEXT.blend));
    motionBar.setLanguage();
  }

  function syncBlendButtons(target) {
    root.querySelectorAll('[data-blend]').forEach(b => {
      const on = Number(b.dataset.blend) === target;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function setBlend(target) {
    syncBlendButtons(target);
    cancelTween();
    cancelTween = tweenValues({ k }, { k: target }, v => { k = v.k; clock.refresh(); }, 900);
  }

  function setFocus(id) {
    focusedId = focusedId === id ? null : id;
    rows.forEach(r => {
      const on = r.row.id === focusedId;
      r.el.classList.toggle('is-focused', on);
      r.detail.hidden = !on;
      r.main.setAttribute('aria-expanded', String(on));
    });
    clock.refresh();
  }

  rows.forEach(r => {
    r.main.addEventListener('click', () => setFocus(r.row.id));
    r.main.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(r.row.id); }
    });
  });
  root.querySelectorAll('[data-blend]').forEach(b => b.addEventListener('click', () => setBlend(Number(b.dataset.blend))));

  function frame(state) {
    const t = wrap01(state.phase - T0);
    if (lastT != null && t < lastT - 0.5) parity ^= 1;
    lastT = t;
    const upTo = (parity + t) / 2;
    const shape = cycleShape(state.phase);
    rows.forEach(r => {
      r.small.forEach(tr => drawTrace(tr, upTo, k, currentLang));
      if (r.row.id !== focusedId) return;
      r.large.forEach(tr => drawTrace(tr, upTo, k, currentLang));
      drawHeart(r.heart, r.row, t, shape.contraction, k, currentLang);
    });
    motionBar.render(state, shape.phase);
  }

  applyText();
  syncBlendButtons(1);
  const unsubscribe = clock.subscribe(frame);

  return {
    updateLanguage(next) {
      currentLang = next === 'en' ? 'en' : 'tr';
      applyText();
      clock.refresh();
    },
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}
