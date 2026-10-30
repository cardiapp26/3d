/**
 * Chapter lab "Pacing": the NBG code, AAI / VVI / DDD on a 10 s strip with the device's marker
 * channel, three malfunctions, and the paced QRS by lead position (ecg-pacing-model.js). The CSP /
 * LBBAP implant itself lives on the EPS page; this lab is about reading paced ECGs.
 */
import { simulatePacing, renderStrip, pacedBeat, pacedMeasures, MODES, FAULTS, SITES, NBG, DEVICE } from './ecg-pacing-model.js';
import { fitCanvas, drawPaper, drawCalibration, drawTrace, label, el, segmented, PAPER } from './ecg-paper.js';

const TEXT = {
  tr: {
    title: 'Pacing: kod, modlar, arızalar ve lead yeri', mode: 'Mod', fault: 'Durum', site: 'Ventrikül lead yeri',
    faults: { none: 'Normal çalışma', capture: 'Yakalama kaybı', undersensing: 'Az algılama (undersensing)', oversensing: 'Fazla algılama (oversensing)' },
    sites: { rvApex: 'RV apeks', rvSeptum: 'RV septum', his: 'His', lbbap: 'Sol dal alanı', biv: 'Biventriküler' },
    nbg: ['Uyarılan oda', 'Algılanan oda', 'Algıya yanıt', 'Hız modülasyonu', 'Çok bölgeli'], letters: { A: 'Atriyum', V: 'Ventrikül', D: 'İkisi', I: 'İnhibe', T: 'Tetikle', O: 'Yok' },
    strip: 'II ve V1 · 25 mm/s · 10 mm/mV · alt satır: cihaz işaretleri', beat: 'Paced atım · 12 derivasyon · gri: sinüs atımı',
    width: 'QRS genişliği', axis: 'Aks', v1: 'V1 son kısmı', v1Pos: 'pozitif (R)', v1Neg: 'negatif (S/QS)', latency: 'Spike–QRS gecikmesi',
    rhythm: { brady: 'Alttaki ritim: sinüs bradikardisi 42/dk, AV ileti normal.', chb: 'Alttaki ritim: tam AV blok; sinüs 78/dk, kaçış 34/dk.', fast: 'Alttaki ritim: hastanın kendi ritmi 82/dk (cihaz susmalı).' },
    explain: {
      none: { AAI: 'AAI: atriyum 1000 ms içinde algılanmazsa uyarılır; iletilen QRS dar kalır.', VVI: 'VVI: ventrikül 1000 ms içinde algılanmazsa uyarılır (60/dk); P dalgaları bağımsız yürür.', DDD: 'DDD: algılanan her P’yi 150 ms sonra ventrikül uyarısı izler; atriyum ve ventrikül senkron.' },
      capture: 'Yakalama kaybı: spike var ama ardından QRS (veya P) yok. Çıkış eşiğin altında ya da lead yerinden oynamış.',
      undersensing: 'Az algılama: cihaz hastanın kendi atımlarını görmez, spike’lar kendi zamanında yürür; bazıları refrakter dokuya ya da T dalgasının üstüne düşer.',
      oversensing: 'Fazla algılama: kas potansiyeli gibi gürültüyü atım sanıp uyarıyı keser; pacemaker bağımlı hastada duraklamalar olur.'
    },
    note: 'NBG kodu (NASPE/BPEG 2002): 1. harf uyarılan oda, 2. algılanan oda, 3. algıya yanıt (I inhibe, T tetikle, D ikisi), 4. R hız modülasyonu, 5. çok bölgeli pacing. Zamanlayıcılar öğretim amaçlı sadeleştirildi; cihaz algoritması değildir.'
  },
  en: {
    title: 'Pacing: code, modes, malfunction and lead position', mode: 'Mode', fault: 'Condition', site: 'Ventricular lead position',
    faults: { none: 'Normal function', capture: 'Failure to capture', undersensing: 'Undersensing', oversensing: 'Oversensing' },
    sites: { rvApex: 'RV apex', rvSeptum: 'RV septum', his: 'His bundle', lbbap: 'Left bundle area', biv: 'Biventricular' },
    nbg: ['Chamber paced', 'Chamber sensed', 'Response to sensing', 'Rate modulation', 'Multisite'], letters: { A: 'Atrium', V: 'Ventricle', D: 'Dual', I: 'Inhibit', T: 'Trigger', O: 'None' },
    strip: 'II and V1 · 25 mm/s · 10 mm/mV · bottom row: device markers', beat: 'Paced beat · 12 leads · grey: sinus beat',
    width: 'QRS width', axis: 'Axis', v1: 'End of V1', v1Pos: 'positive (R)', v1Neg: 'negative (S/QS)', latency: 'Spike to QRS',
    rhythm: { brady: 'Underlying rhythm: sinus bradycardia 42/min, AV conduction intact.', chb: 'Underlying rhythm: complete AV block; sinus 78/min, escape 34/min.', fast: 'Underlying rhythm: the patient\'s own rhythm at 82/min (the device should stay quiet).' },
    explain: {
      none: { AAI: 'AAI: the atrium is paced if no atrial event is sensed within 1000 ms; the conducted QRS stays narrow.', VVI: 'VVI: the ventricle is paced if nothing is sensed within 1000 ms (60/min); P waves march on independently.', DDD: 'DDD: every sensed P wave is followed by a ventricular pulse 150 ms later; atria and ventricles stay in step.' },
      capture: 'Failure to capture: a spike with no QRS (or P) after it. The output is below threshold or the lead has moved.',
      undersensing: 'Undersensing: the device misses the patient\'s own beats and its spikes march on; some fall into refractory tissue or on the T wave.',
      oversensing: 'Oversensing: noise such as myopotentials is taken for beats and inhibits pacing; a pacemaker-dependent patient has pauses.'
    },
    note: 'NBG code (NASPE/BPEG 2002): 1st letter chamber paced, 2nd chamber sensed, 3rd response to sensing (I inhibit, T trigger, D both), 4th R rate modulation, 5th multisite pacing. Timers are simplified for teaching; this is not a device algorithm.'
  }
};
const LAYOUT = Object.freeze([['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]);
const MARK_COLORS = Object.freeze({ AS: '#2563eb', AP: '#1d4ed8', VS: '#16a34a', VP: '#b91c1c' });

export function createPacingLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { mode: state.mode || 'VVI', fault: state.fault || 'none', site: state.site || 'rvApex' });
  const t = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'pacing' });
  let frame = null, result = null, strip = null;
  const field = (title, node) => { const f = el('div', 'ecgc-field'); const sp = el('span', 'ecgc-label'); sp.textContent = title; f.append(sp, node); return f; };

  function build() {
    const T = t();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'); const h = el('h3'); h.textContent = T.title; head.append(h);
    const controls = el('div', 'ecgc-controls');
    controls.append(
      field(T.mode, segmented('mode', MODES.map(id => ({ id, label: id })), s.mode, id => { s.mode = id; build(); })),
      field(T.fault, segmented('fault', FAULTS.map(id => ({ id, label: T.faults[id] })), s.fault, id => { s.fault = id; build(); })),
      field(T.site, segmented('site', SITES.map(id => ({ id, label: T.sites[id] })), s.site, id => { s.site = id; build(); }))
    );
    const nbg = el('div', 'ecgc-nbg', { 'data-pacing-nbg': '' });
    const letters = [...NBG[s.mode], 'O', s.site === 'biv' ? 'V' : 'O'];
    letters.forEach((ch, i) => { const c = el('div', 'ecgc-nbg-cell', { 'data-pos': i + 1 }); const big = el('strong'); big.textContent = ch; const small = el('span'); small.textContent = `${T.nbg[i]} · ${T.letters[ch] || ch}`; c.append(big, small); nbg.append(c); });
    const explain = el('p', 'ecgc-explain', { 'data-pacing-explain': '', 'aria-live': 'polite' });
    const stripCanvas = el('canvas', 'ecgc-canvas ecgc-page', { 'data-pacing-strip': '', role: 'img', 'aria-label': T.strip });
    const readouts = el('div', 'ecgc-qt-table', { 'data-pacing-readouts': '' });
    const beat = el('canvas', 'ecgc-canvas ecgc-tall', { 'data-pacing-beat': '', role: 'img', 'aria-label': T.beat });
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(head, controls, nbg, explain, stripCanvas, readouts, beat, note);
    result = simulatePacing({ mode: s.mode, fault: s.fault });
    strip = renderStrip(result, { site: s.site });
    frame = globalThis.requestAnimationFrame?.(draw) ?? (draw(), null);
  }

  function draw() {
    frame = null;
    const T = t(), r = result.rhythm;
    const rhythm = s.fault === 'undersensing' ? T.rhythm.fast : r.avIntact ? T.rhythm.brady : T.rhythm.chb;
    root.querySelector('[data-pacing-explain]').textContent = `${s.fault === 'none' ? T.explain.none[s.mode] : T.explain[s.fault]} ${rhythm}`;
    const m = pacedMeasures(s.site);
    const cells = [[T.width, `${m.width} ms`], [T.axis, `${m.axis}°`], [T.v1, m.v1Terminal > 0 ? T.v1Pos : T.v1Neg], [T.latency, `${m.latency} ms`]];
    root.querySelector('[data-pacing-readouts]').replaceChildren(...cells.map(([k, v]) => { const c = el('div', 'ecgc-qt-cell'); const a = el('span'); a.textContent = `${T.sites[s.site]} · ${k}`; const b = el('strong'); b.textContent = v; c.append(a, b); return c; }));
    drawStrip(root.querySelector('[data-pacing-strip]'), T);
    drawBeat(root.querySelector('[data-pacing-beat]'), T);
  }

  function drawStrip(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, pxPerMm = w / (10 * 25 + 10);
    drawPaper(ctx, w, h, pxPerMm);
    const opts = { pxPerMm, speed: 25, gain: 10 }, rowH = (h - 34) / 2;
    ['II', 'V1'].forEach((lead, i) => {
      const y = rowH * i + rowH * .62, x = drawCalibration(ctx, 4, y, opts);
      drawTrace(ctx, strip[lead], 0, 9600, x, y, opts);
      label(ctx, lead, x + 3, rowH * i + 13);
    });
    // Marker channel: what the device sensed (S) and paced (P).
    // Atrial markers on the upper line, ventricular on the lower one, so AS and VP 150 ms apart stay readable.
    const x0 = 4 + 8 + .2 * 25 * pxPerMm;
    ctx.fillStyle = 'rgba(255, 255, 255, .85)'; ctx.fillRect(0, h - 32, w, 32);
    for (const m of result.markers) {
      if (m.t > 9600) continue;
      const x = x0 + (m.t / 1000) * 25 * pxPerMm, color = MARK_COLORS[m.label], yM = m.label[0] === 'A' ? h - 20 : h - 5;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, yM - 9); ctx.lineTo(x, yM); ctx.stroke();
      label(ctx, m.label, x + 2, yM, { color, font: '600 9px ui-monospace, monospace' });
    }
    label(ctx, T.strip, w - 6, h - 36, { align: 'right', font: '10px system-ui, sans-serif' });
  }

  function drawBeat(canvas, T) {
    const k = fitCanvas(canvas); if (!k) return;
    const { ctx, w, h } = k, b = pacedBeat(s.site, 600), span = 660, pxPerMm = w / (4 * span * 25 / 1000 + 10);
    drawPaper(ctx, w, h, pxPerMm);
    const opts = { pxPerMm, speed: 25, gain: 10 }, rowH = h / 3;
    const x0 = drawCalibration(ctx, 4, rowH * .6, opts);
    LAYOUT.forEach((row, ri) => row.forEach((lead, ci) => {
      const x = x0 + ci * span * 25 / 1000 * pxPerMm, y = rowH * ri + rowH * .6;
      drawTrace(ctx, Float32Array.from(b.sinus[lead]), 0, span, x, y, { ...opts, color: PAPER.grey, width: 2.4 });
      drawTrace(ctx, Float32Array.from(b.paced[lead]), 0, span, x, y, opts);
      label(ctx, lead, x + 3, rowH * ri + 13);
    }));
    label(ctx, T.beat, w - 6, h - 6, { align: 'right', font: '10px system-ui, sans-serif' });
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return { element: root, render: build, getResult: () => result, destroy() { globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); } };
}
export { DEVICE };
