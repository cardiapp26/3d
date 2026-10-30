/**
 * Chapter lab "Atrial abnormality": the P wave as a right then a left atrial vector
 * (ecg-structure-model.js). Enlarge either atrium or slow interatrial conduction and read the P
 * duration, the notch in II, the height in II and the terminal force in V1 against the criteria.
 */
import { atrialLobes, pMeasures, atrialCriteria, sample, ATRIA } from './ecg-structure-model.js';
import { fitCanvas, drawPaper, drawTrace, label, el, segmented, PAPER } from './ecg-paper.js';

const TEXT = {
  tr: {
    title: 'Atriyal anormallik: P dalgası ve iki atriyum', atria: 'Atriyumlar', options: { normal: 'Normal', left: 'Sol büyük', right: 'Sağ büyük', both: 'İkisi de büyük' },
    slowed: 'İnteratriyal ileti yavaş (Bachmann)', beat: 'P dalgası · 50 mm/s · 50 mm/mV · gri: normal P', ra: 'sağ atriyum', la: 'sol atriyum',
    measures: { duration: 'P süresi', amplitudeII: 'P yüksekliği (II)', notchMs: 'Çentik arası (II)', ptfv1: 'V1 terminal kuvvet', v1Initial: 'V1 başlangıç P' },
    criteria: { duration: 'P ≥ 120 ms', notch: 'II’de çentik ≥ 40 ms', ptfv1: 'PTFV1 ≥ 40 mm·ms', tallII: 'II’de P ≥ 2,5 mm', v1Initial: 'V1 başlangıç ≥ 1,5 mm' },
    groups: { left: 'Sol atriyal anormallik', right: 'Sağ atriyal anormallik' },
    note: 'P dalgasının ilk kısmı sağ, son kısmı sol atriyumdan gelir. Sol büyümede P uzar, II’de çentiklenir ve V1’in negatif son kısmı derinleşir; sağ büyümede P sivrileşir ve yükselir. “Büyüme” yerine “anormallik” denir: aynı bulgu ileti gecikmesinden de doğar. Tek dipol öğretim modeli.'
  },
  en: {
    title: 'Atrial abnormality: the P wave and the two atria', atria: 'Atria', options: { normal: 'Normal', left: 'Left enlarged', right: 'Right enlarged', both: 'Both enlarged' },
    slowed: 'Slow interatrial conduction (Bachmann)', beat: 'P wave · 50 mm/s · 50 mm/mV · grey: normal P', ra: 'right atrium', la: 'left atrium',
    measures: { duration: 'P duration', amplitudeII: 'P height (II)', notchMs: 'Notch interval (II)', ptfv1: 'V1 terminal force', v1Initial: 'V1 initial P' },
    criteria: { duration: 'P ≥ 120 ms', notch: 'Notch in II ≥ 40 ms', ptfv1: 'PTFV1 ≥ 40 mm·ms', tallII: 'P in II ≥ 2.5 mm', v1Initial: 'V1 initial ≥ 1.5 mm' },
    groups: { left: 'Left atrial abnormality', right: 'Right atrial abnormality' },
    note: 'The first part of the P wave comes from the right atrium, the last from the left. A large left atrium lengthens the P wave, notches it in II and deepens the negative end in V1; a large right atrium makes it taller and peaked. "Abnormality" is preferred to "enlargement": conduction delay gives the same signs. Single-dipole teaching model.'
  }
};
const GROUPS = Object.freeze({ left: ['duration', 'notch', 'ptfv1'], right: ['tallII', 'v1Initial'] });

export function createAtriaLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { atria: state.atria || 'left', slowed: Boolean(state.slowed) });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'atria' });
  let frame = null;

  function build() {
    const T = t();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    const f = el('div', 'ecgc-field'); const sp = el('span', 'ecgc-label'); sp.textContent = T.atria;
    f.append(sp, segmented('atria', ATRIA.map(id => ({ id, label: T.options[id] })), s.atria, id => { s.atria = id; build(); }));
    const box = el('label', 'ecgc-check'); const i = el('input', '', { type: 'checkbox', 'data-atria-slowed': '' }); i.checked = s.slowed;
    i.addEventListener('change', () => { s.slowed = i.checked; build(); }); const bs = el('span'); bs.textContent = T.slowed; box.append(i, bs);
    controls.append(f, box);
    const readouts = el('div', 'ecgc-qt-table', { 'data-atria-readouts': '' });
    const crit = el('div', 'ecgc-criteria', { 'data-atria-criteria': '' });
    const canvas = el('canvas', 'ecgc-canvas ecgc-tall', { 'data-atria-beat': '', role: 'img', 'aria-label': T.beat });
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(head, controls, readouts, crit, canvas, note);
    frame = globalThis.requestAnimationFrame?.(draw) ?? (draw(), null);
  }

  function draw() {
    frame = null;
    const T = t(), lobes = atrialLobes(s), m = pMeasures(lobes), c = atrialCriteria(m);
    const fmt = { duration: `${m.duration} ms`, amplitudeII: `${m.amplitudeII.toFixed(1)} mm`, notchMs: m.notchMs ? `${m.notchMs} ms` : '·', ptfv1: `${m.ptfv1} mm·ms`, v1Initial: `${m.v1Initial.toFixed(1)} mm` };
    root.querySelector('[data-atria-readouts]').replaceChildren(...Object.keys(fmt).map(k => { const cell = el('div', 'ecgc-qt-cell'); const a = el('span'); a.textContent = T.measures[k]; const b = el('strong'); b.textContent = fmt[k].replace('.', getLang() === 'en' ? '.' : ','); cell.append(a, b); return cell; }));
    root.querySelector('[data-atria-criteria]').replaceChildren(...Object.entries(GROUPS).map(([g, keys]) => {
      const box = el('div', 'ecgc-crit-group', { 'data-group': g, 'data-met': String(keys.some(k => c[k])) }); const h = el('strong'); h.textContent = T.groups[g]; box.append(h);
      for (const k of keys) { const row = el('span', '', { 'data-criterion': k, 'data-met': String(c[k]) }); row.textContent = `${c[k] ? '✓' : '·'} ${T.criteria[k]}`; box.append(row); }
      return box;
    }));
    drawBeat(root.querySelector('[data-atria-beat]'), T, lobes);
  }

  function drawBeat(canvas, T, lobes) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, span = 220, half = w / 2;
    const pxPerMm = Math.min(half / (span * 50 / 1000 + 2), h / 34);
    drawPaper(ctx, w, h, pxPerMm);
    const now = sample(lobes, 0, span), ref = sample(atrialLobes({ atria: 'normal' }), 0, span);
    const parts = { ra: sample([lobes[0]], 0, span), la: sample([lobes[1]], 0, span) };
    const opts = { pxPerMm, speed: 50, gain: 50 };
    ['II', 'V1'].forEach((lead, i) => {
      const x = i * half + 8, y = h * .58;
      drawTrace(ctx, Float32Array.from(ref.leads[lead]), 0, span, x, y, { ...opts, color: PAPER.grey, width: 3 });
      drawTrace(ctx, Float32Array.from(parts.ra.leads[lead]), 0, span, x, y, { ...opts, color: 'rgba(37, 99, 235, .65)', width: 1.2 });
      drawTrace(ctx, Float32Array.from(parts.la.leads[lead]), 0, span, x, y, { ...opts, color: 'rgba(220, 38, 38, .65)', width: 1.2 });
      drawTrace(ctx, Float32Array.from(now.leads[lead]), 0, span, x, y, opts);
      label(ctx, lead, x + 2, 16);
    });
    label(ctx, `▬ ${T.ra}`, 10, h - 22, { color: 'rgba(37, 99, 235, .9)', font: '10px system-ui, sans-serif' });
    label(ctx, `▬ ${T.la}`, 10, h - 9, { color: 'rgba(220, 38, 38, .9)', font: '10px system-ui, sans-serif' });
    label(ctx, T.beat, w - 6, h - 6, { align: 'right', font: '10px system-ui, sans-serif' });
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: build, getMeasures: () => pMeasures(atrialLobes(s)), destroy() { globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
