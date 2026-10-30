/**
 * Chapter lab "Recording": the same heart through different machines (ecg-recording-model.js).
 * Paper speed and gain set the scales, the filters decide which frequencies pass, the cables decide
 * which electrode feeds which input, and artifacts add to the body's signal. A normal heart can be
 * made to look abnormal by any of them; the grey beat is what the heart produced.
 */
import { recordElectrodes, addArtifacts, recordLeads, trueLeads, beatMeasures, INTERVALS, LEADS } from './ecg-recording-model.js';
import { fitCanvas, drawPaper, drawCalibration, drawTrace, label, el, segmented, PAPER } from './ecg-paper.js';

const TEXT = {
  tr: {
    title: 'Kayıt: kâğıt, filtreler, artefaktlar ve kablolar', speed: 'Kâğıt hızı', gain: 'Kazanç (mm/mV)', hp: 'Alt kesim (yüksek geçiren)', lp: 'Üst kesim (alçak geçiren)',
    zero: 'Sıfır fazlı dijital filtre (ileri ve geri)', cables: 'Kablolar', artifacts: 'Artefaktlar', breathing: 'Solunum (taban çizgisi kayması)', tremor: 'Kas titremesi', mains: 'Şebeke paraziti (50 Hz)',
    reversals: { none: 'Doğru', 'la-ra': 'LA–RA ters', 'ra-rl': 'RA–RL ters', 'la-ll': 'LA–LL ters', 'v1-v2': 'V1–V2 ters' },
    trueValue: 'gerçek', page: 'Sayfada', beat: 'Tek atım: II ve V5 · gri: kalbin ürettiği', st: 'J+60 ms ST', rAmp: 'R genliği', change: 'değişim',
    explain: {
      none: 'Kablolar doğru. Derivasyonlar kalbin vektörünü yansıtıyor.',
      'la-ra': 'Kol kabloları ters: I ters döner, II ile III ve aVR ile aVL yer değiştirir; aVF ve göğüs derivasyonları değişmez. I ile V6 artık ters yönde.',
      'ra-rl': 'Sağ kol kablosu sağ bacakta: iki bacak potansiyeli neredeyse aynı olduğundan II neredeyse düz çizgi. Wilson terminali de bozulduğu için göğüs derivasyonları değişir.',
      'la-ll': 'Sol kol ve sol bacak ters: I ile II ve aVL ile aVF yer değiştirir, III ters döner. Fark edilmesi en zor ters takılma.',
      'v1-v2': 'V1 ve V2 yer değiştirmiş: R progresyonu V1’den V2’ye bozulur, ekstremite derivasyonları aynı.'
    },
    filterNote: (st, r) => `ST, J+60 ms'de (II): ${st}. R (V5): ${r}.`,
    note: 'Tanısal kayıt: alt kesim 0,05 Hz (sıfır fazlı dijital filtrede 0,67 Hz’e kadar), üst kesim erişkinde en az 150 Hz (AHA/ACCF/HRS 2007). 0,5 Hz analog tipi filtre ST’yi kaydırır; 40 Hz filtre kas gürültüsünü siler ama genlik ölçümlerini geçersiz kılar. Tek dipol öğretim modeli; hasta kaydı değildir.'
  },
  en: {
    title: 'Recording: paper, filters, artifacts and cables', speed: 'Paper speed', gain: 'Gain (mm/mV)', hp: 'Low cutoff (high-pass)', lp: 'High cutoff (low-pass)',
    zero: 'Zero-phase digital filter (forward, then backward)', cables: 'Cables', artifacts: 'Artifacts', breathing: 'Breathing (baseline wander)', tremor: 'Muscle tremor', mains: 'Mains interference (50 Hz)',
    reversals: { none: 'Correct', 'la-ra': 'LA–RA swapped', 'ra-rl': 'RA–RL swapped', 'la-ll': 'LA–LL swapped', 'v1-v2': 'V1–V2 swapped' },
    trueValue: 'true', page: 'On the page', beat: 'One beat: II and V5 · grey: what the heart made', st: 'ST at J+60 ms', rAmp: 'R amplitude', change: 'change',
    explain: {
      none: 'Cables correct. The leads reflect the heart vector.',
      'la-ra': 'Arm cables swapped: lead I inverts, II swaps with III and aVR with aVL; aVF and the chest leads are spared. Lead I and V6 now point opposite ways.',
      'ra-rl': 'The right-arm cable is on the right leg: the two legs sit at almost the same potential, so lead II is nearly flat. Wilson\'s terminal is distorted too, so the chest leads change.',
      'la-ll': 'Left arm and left leg swapped: I swaps with II and aVL with aVF, III inverts. The hardest reversal to spot.',
      'v1-v2': 'V1 and V2 swapped: R progression breaks from V1 to V2; the limb leads are unchanged.'
    },
    filterNote: (st, r) => `ST at J+60 ms (II): ${st}. R (V5): ${r}.`,
    note: 'Diagnostic recording: low cutoff 0.05 Hz (up to 0.67 Hz with a zero-phase digital filter), high cutoff at least 150 Hz in adults (AHA/ACCF/HRS 2007). A 0.5 Hz analog-style filter shifts the ST segment; a 40 Hz filter removes muscle noise but invalidates amplitude measurements. Single-dipole teaching model; not a patient recording.'
  }
};
const LAYOUT = Object.freeze([['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]);
const SECONDS = 10;
const BEAT_AT = 3;   // which beat (index) the single-beat panel shows

export function createRecordingLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, {
    speed: state.speed || 25, gain: state.gain || 10, hp: state.hp ?? .05, lp: state.lp ?? 150, zero: Boolean(state.zero),
    reversal: state.reversal || 'none', breathing: Boolean(state.breathing), tremor: Boolean(state.tremor), mains: Boolean(state.mains)
  });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'recording' });
  const base = recordElectrodes({ seconds: SECONDS, hr: 72 });
  const truth = trueLeads(base.electrodes);
  let leads = null, frame = null;

  function compute() {
    const electrodes = addArtifacts(base.electrodes, { breathing: s.breathing, tremor: s.tremor, mains: s.mains });
    leads = recordLeads(electrodes, { reversal: s.reversal, highPassHz: s.hp, lowPassHz: s.lp, zeroPhaseFilters: s.zero });
  }
  const check = (key, text) => {
    const l = el('label', 'ecgc-check'); const i = el('input', '', { type: 'checkbox', [`data-rec-${key}`]: '' }); i.checked = s[key];
    i.addEventListener('change', () => { s[key] = i.checked; update(); }); const span = el('span'); span.textContent = text; l.append(i, span); return l;
  };
  const field = (title, node) => { const f = el('div', 'ecgc-field'); const sp = el('span', 'ecgc-label'); sp.textContent = title; f.append(sp, node); return f; };

  function build() {
    const T = t();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    const pick = key => v => { s[key] = v; build(); };
    controls.append(
      field(T.speed, segmented('speed', [25, 50].map(v => ({ id: v, label: `${v} mm/s` })), s.speed, pick('speed'))),
      field(T.gain, segmented('gain', [5, 10, 20].map(v => ({ id: v, label: String(v) })), s.gain, pick('gain'))),
      field(T.hp, segmented('hp', [.05, .5].map(v => ({ id: v, label: `${String(v).replace('.', getLang() === 'en' ? '.' : ',')} Hz` })), s.hp, pick('hp'))),
      field(T.lp, segmented('lp', [150, 40].map(v => ({ id: v, label: `${v} Hz` })), s.lp, pick('lp'))),
      field(T.cables, segmented('reversal', Object.keys(T.reversals).map(id => ({ id, label: T.reversals[id] })), s.reversal, pick('reversal'))),
      field(T.artifacts, (() => { const g = el('div', 'ecgc-checks'); g.append(check('breathing', T.breathing), check('tremor', T.tremor), check('mains', T.mains), check('zero', T.zero)); return g; })())
    );
    const explain = el('p', 'ecgc-explain', { 'data-rec-explain': '', 'aria-live': 'polite' });
    const page = el('canvas', 'ecgc-canvas ecgc-page', { 'data-rec-page': '', role: 'img', 'aria-label': T.page });
    const one = el('canvas', 'ecgc-canvas ecgc-beat', { 'data-rec-beat': '', role: 'img', 'aria-label': T.beat });
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(head, controls, explain, page, one, note);
    update();
  }

  function update() { compute(); if (frame == null) frame = globalThis.requestAnimationFrame?.(draw) ?? (draw(), null); }

  function draw() {
    frame = null;
    const T = t(), beatStart = base.rr * BEAT_AT;
    const m = beatMeasures(leads.II, beatStart), m0 = beatMeasures(truth.II, beatStart);
    const r = beatMeasures(leads.V5, beatStart).r, r0 = beatMeasures(truth.V5, beatStart).r;
    const fmt = v => { const mm = Math.round(v * 100) / 10 || 0; return `${mm > 0 ? '+' : ''}${mm.toFixed(1).replace('.', getLang() === 'en' ? '.' : ',')} mm`; };
    const pct = r0 ? Math.round(((r - r0) / r0) * 100) : 0;
    root.querySelector('[data-rec-explain]').textContent = `${T.explain[s.reversal]} ${T.filterNote(`${fmt(m.st)} (${T.trueValue} ${fmt(m0.st)})`, `${pct >= 0 ? '+' : ''}${pct}%`)}`;
    drawPage(root.querySelector('[data-rec-page]'), T);
    drawBeat(root.querySelector('[data-rec-beat]'), T, beatStart);
  }

  function drawPage(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k;
    const mmAcross = SECONDS * 25 + 12, pxPerMm = w / mmAcross;          // the page shows 10 s at 25 mm/s
    drawPaper(ctx, w, h, pxPerMm);
    const opts = { pxPerMm, speed: s.speed, gain: s.gain };
    const colMs = (2500 * 25) / s.speed, rowH = h / 4;                     // 2.5 s columns at 25 mm/s, half as long at 50
    const x0 = drawCalibration(ctx, 4, rowH * .62, opts);
    LAYOUT.forEach((row, ri) => row.forEach((lead, ci) => {
      const y = rowH * ri + rowH * .62, x = x0 + ci * (colMs * s.speed / 1000) * pxPerMm;
      ctx.save(); ctx.beginPath(); ctx.rect(x, rowH * ri, (colMs * s.speed / 1000) * pxPerMm, rowH); ctx.clip();
      drawTrace(ctx, leads[lead], ci * colMs, colMs, x, y, opts);
      ctx.restore();
      label(ctx, lead, x + 3, rowH * ri + 13);
    }));
    const ry = rowH * 3 + rowH * .62, rx = drawCalibration(ctx, 4, ry, opts);
    drawTrace(ctx, leads.II, 0, Math.min(SECONDS * 1000, ((w - rx) / pxPerMm / s.speed) * 1000), rx, ry, opts);
    label(ctx, 'II', rx + 3, rowH * 3 + 13);
    label(ctx, `${s.speed} mm/s · ${s.gain} mm/mV · ${String(s.hp).replace('.', getLang() === 'en' ? '.' : ',')}–${s.lp} Hz`, w - 6, h - 6, { align: 'right' });
  }

  function drawBeat(canvas, T, beatStart) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, span = 700, half = w / 2;
    const pxPerMm = Math.min(half / (span * 50 / 1000), h / 34);
    drawPaper(ctx, w, h, pxPerMm);
    const opts = { pxPerMm, speed: 50, gain: s.gain };
    ['II', 'V5'].forEach((lead, i) => {
      const x = i * half + 8, y = h * .62;
      const from = beatStart + INTERVALS.pOnset - 30;
      const off0 = beatMeasures(truth[lead], beatStart).base, off = beatMeasures(leads[lead], beatStart).base;
      drawTrace(ctx, truth[lead], from, span, x, y, { ...opts, color: PAPER.grey, width: 3, offset: off0 });
      drawTrace(ctx, leads[lead], from, span, x, y, { ...opts, offset: s.breathing ? off : off0 });
      label(ctx, lead, x + 2, 14);
    });
    label(ctx, T.beat, w - 6, h - 6, { align: 'right', font: '10px system-ui, sans-serif' });
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: build, getLeads: () => leads, getTruth: () => truth, destroy() { globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
export { LEADS };
