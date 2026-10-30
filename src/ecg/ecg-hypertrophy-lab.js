/**
 * Chapter lab "Hypertrophy": thicker ventricular walls give larger forces (ecg-structure-model.js).
 * Set the left and right wall thickness, the sex and a secondary ST-T change, and read the voltage
 * criteria (Sokolow-Lyon, Cornell, Peguero-Lo Presti, right ventricular) on a 12-lead page.
 */
import { ventricleLobes, qrsVoltages, qrsAxis, hypertrophyCriteria } from './ecg-structure-model.js';
import { atrialLobes } from './ecg-structure-model.js';
import { vectorAt, leadsOf, LEADS } from '../eps/ecg12.js';
import { fitCanvas, drawPaper, drawCalibration, drawTrace, label, el, segmented } from './ecg-paper.js';

const TEXT = {
  tr: {
    title: 'Ventrikül hipertrofisi: duvar kalınlığı ve voltaj kriterleri', lv: 'LV duvarı', rv: 'RV duvarı', sex: 'Cinsiyet', sexes: { male: 'Erkek', female: 'Kadın' },
    strain: 'Sekonder ST–T değişikliği (strain)', axis: 'QRS aksı', page: '12 derivasyon · 25 mm/s · 10 mm/mV',
    criteria: { sokolow: 'Sokolow-Lyon: SV1 + RV5/V6 ≥ 35 mm', cornell: 'Cornell: RaVL + SV3', peguero: 'Peguero-Lo Presti: en derin S + SV4', rvh: 'RVH: RV1 ≥ 7 mm, R/S V1 > 1 ya da aks > 110°' },
    limitFor: (l, sex) => `> ${l} mm (${sex})`, limitAtLeast: (l, sex) => `≥ ${l} mm (${sex})`,
    note: 'Voltaj kriterlerinin duyarlılığı düşüktür (çoğu %20–60): normal EKG LVH’yi dışlamaz. Kadınlarda eşikler daha düşüktür. Strain paterni (lateral ST çökmesi ve QRS’e zıt T) sekonder değişikliktir. Modelin duvar kalınlığı ile voltajı arasındaki ilişki öğretim içindir.'
  },
  en: {
    title: 'Ventricular hypertrophy: wall thickness and the voltage criteria', lv: 'LV wall', rv: 'RV wall', sex: 'Sex', sexes: { male: 'Male', female: 'Female' },
    strain: 'Secondary ST–T change (strain)', axis: 'QRS axis', page: '12 leads · 25 mm/s · 10 mm/mV',
    criteria: { sokolow: 'Sokolow-Lyon: SV1 + RV5/V6 ≥ 35 mm', cornell: 'Cornell: RaVL + SV3', peguero: 'Peguero-Lo Presti: deepest S + SV4', rvh: 'RVH: RV1 ≥ 7 mm, R/S V1 > 1 or axis > 110°' },
    limitFor: (l, sex) => `> ${l} mm (${sex})`, limitAtLeast: (l, sex) => `≥ ${l} mm (${sex})`,
    note: 'Voltage criteria have low sensitivity (mostly 20–60%): a normal ECG does not exclude LVH. Thresholds are lower in women. The strain pattern (lateral ST depression and a T wave opposite the QRS) is a secondary change. The model\'s link between wall thickness and voltage is for teaching.'
  }
};
const LAYOUT = Object.freeze([['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]);

export function createHypertrophyLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { lv: state.lv || 15, rv: state.rv || 4, sex: state.sex || 'male', strain: state.strain ?? true });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'hypertrophy' });
  let frame = null;
  const range = (key, labelText, lo, hi) => {
    const wrap = el('label', 'ecgc-range'); const span = el('span'); const out = el('output');
    const input = el('input', '', { type: 'range', min: lo, max: hi, step: 1, value: s[key], [`data-hyp-${key}`]: '' });
    input.addEventListener('input', () => { s[key] = Number(input.value); out.textContent = `${s[key]} mm`; schedule(); });
    span.textContent = labelText; out.textContent = `${s[key]} mm`; wrap.append(span, input, out); return wrap;
  };

  function build() {
    const T = t();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    const sexField = el('div', 'ecgc-field'); const sl = el('span', 'ecgc-label'); sl.textContent = T.sex;
    sexField.append(sl, segmented('sex', ['male', 'female'].map(id => ({ id, label: T.sexes[id] })), s.sex, id => { s.sex = id; build(); }));
    const box = el('label', 'ecgc-check'); const i = el('input', '', { type: 'checkbox', 'data-hyp-strain': '' }); i.checked = s.strain;
    i.addEventListener('change', () => { s.strain = i.checked; schedule(); }); const bs = el('span'); bs.textContent = T.strain; box.append(i, bs);
    controls.append(range('lv', T.lv, 8, 20), range('rv', T.rv, 3, 11), sexField, box);
    const crit = el('div', 'ecgc-criteria', { 'data-hyp-criteria': '' });
    const page = el('canvas', 'ecgc-canvas ecgc-page', { 'data-hyp-page': '', role: 'img', 'aria-label': T.page });
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(head, controls, crit, page, note);
    schedule();
  }
  function schedule() { if (frame == null) frame = globalThis.requestAnimationFrame?.(draw) ?? (draw(), null); }

  function draw() {
    frame = null;
    const T = t(), lobes = ventricleLobes({ lvWall: s.lv, rvWall: s.rv, strain: s.strain });
    const v = qrsVoltages(lobes), axis = qrsAxis(lobes), c = hypertrophyCriteria(v, s.sex, axis), sexText = T.sexes[s.sex].toLowerCase();
    const num = x => x.toFixed(0);
    const rows = [
      ['sokolow', `${num(c.sokolow.value)} mm`], ['cornell', `${num(c.cornell.value)} mm · ${T.limitFor(c.cornell.limit, sexText)}`],
      ['peguero', `${num(c.peguero.value)} mm · ${T.limitAtLeast(c.peguero.limit, sexText)}`],
      ['rvh', `RV1 ${num(c.rvh.value)} mm · R/S ${Number.isFinite(c.rvh.ratio) ? c.rvh.ratio.toFixed(1) : '∞'} · ${T.axis} ${axis}°`]
    ];
    root.querySelector('[data-hyp-criteria]').replaceChildren(...rows.map(([k, value]) => {
      const row = el('div', 'ecgc-crit-row', { 'data-criterion': k, 'data-met': String(c[k].met) });
      const a = el('span'); a.textContent = `${c[k].met ? '✓' : '·'} ${T.criteria[k]}`; const b = el('strong'); b.textContent = value; row.append(a, b); return row;
    }));
    drawPage(root.querySelector('[data-hyp-page]'), T, [...atrialLobes({}), ...lobes]);
  }

  function drawPage(canvas, T, lobes) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, beatMs = 800, pxPerMm = w / (4 * beatMs * 25 / 1000 + 10);
    drawPaper(ctx, w, h, pxPerMm);
    const data = Object.fromEntries(LEADS.map(l => [l, new Float32Array(beatMs)]));
    for (let ms = 0; ms < beatMs; ms++) { const L = leadsOf(vectorAt(lobes, ms)); for (const l of LEADS) data[l][ms] = L[l]; }
    const opts = { pxPerMm, speed: 25, gain: 10 }, rowH = h / 3;
    const x0 = drawCalibration(ctx, 4, rowH * .6, opts);
    LAYOUT.forEach((row, ri) => row.forEach((lead, ci) => {
      const x = x0 + ci * beatMs * 25 / 1000 * pxPerMm, y = rowH * ri + rowH * .6;
      drawTrace(ctx, data[lead], 0, beatMs - 1, x, y, opts);
      label(ctx, lead, x + 3, rowH * ri + 13);
    }));
    label(ctx, T.page, w - 6, h - 6, { align: 'right', font: '10px system-ui, sans-serif' });
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: build, destroy() { globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
