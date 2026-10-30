/**
 * Chapter lab "Ashman": a premature atrial beat after a long cycle, and AF with Ashman beats
 * (ecg-ashman-model.js). The learner sets the preceding cycle and the coupling, sees each
 * bundle's refractory period stretch with the cycle, watches the impulse cross the conduction
 * system, and reads where the beat falls on the outcome map. AF mode shows long-short beats and
 * linking on a 10 s strip with its tachogram.
 */
import { prematureBeat, outcomeMap, afRun, aberrancyClues, qrsWidth, bundleRefractory, RANGES } from './ecg-ashman-model.js';
import { drawStrip, stripTags, drawBars, drawMap, drawTachogram, PATTERN_COLOR } from './ecg-ashman-draw.js';
import { createAshmanAtlas } from './ecg-ashman-atlas.js';
import { el, segmented } from './ecg-paper.js';

const PATTERN = {
  tr: { normal: 'Normal ileti (dar QRS)', rbbb: 'RBBB aberasyonu', 'rbbb-incomplete': 'İnkomplet RBBB aberasyonu', 'rbbb-lafb': 'RBBB + LAFB aberasyonu', lafb: 'LAFB aberasyonu', lbbb: 'LBBB aberasyonu', 'lbbb-incomplete': 'İnkomplet LBBB aberasyonu', 'blocked-avn': 'Bloke PAC (AV nod)', 'blocked-hps': 'Bloke PAC (His altı)', sinus: 'Erken değil' },
  en: { normal: 'Normal conduction (narrow QRS)', rbbb: 'RBBB aberrancy', 'rbbb-incomplete': 'Incomplete RBBB aberrancy', 'rbbb-lafb': 'RBBB + LAFB aberrancy', lafb: 'LAFB aberrancy', lbbb: 'LBBB aberrancy', 'lbbb-incomplete': 'Incomplete LBBB aberrancy', 'blocked-avn': 'Blocked PAC (AV node)', 'blocked-hps': 'Blocked PAC (below the His)', sinus: 'Not premature' }
};
const TEXT = {
  tr: {
    title: 'Ashman fenomeni: uzun-kısa döngü ve aberan ileti', modes: { pac: 'Tek erken atım (PAC)', af: 'AF: Ashman atımları' },
    cycle: 'Önceki RR (uzun döngü)', coupling: 'P–P′ kuplaj (kısa döngü)', brisk: 'Hızlı AV nod iletisi (sempatik tonus)', diseased: 'His-Purkinje hastalığı (ERP +%20)',
    presets: 'Hazır örnekler', preset: { classic: 'Klasik Ashman', protect: 'AV nod koruması', lafb: 'RBBB + LAFB', blocked: 'Bloke PAC' },
    cells: { cycle: 'Önceki RR', coupling: 'P–P′', ah: 'AH′', h1h2: 'H1–H2', rbb: 'Sağ dal ERP', laf: 'LAF ERP', lbb: 'Sol dal ERP', qrs: 'QRS′' },
    strip: 'II ve V1 · 25 mm/s · 10 mm/mV', long: 'uzun', short: 'kısa', pPrime: 'P′',
    bars: { axis: 'ms: son sinüs His aktivasyonundan itibaren · çizgi: erken impuls', erp: 'refrakter', rrp: 'kısmi', ready: 'hazır', avn: 'AV nod' },
    heart: { sa: 'SA nod', avn: 'AV nod', his: 'His', rbb: 'Sağ dal', lbb: 'Sol dal', laf: 'LAF', lpf: 'LPF', block: 'blok', septal: 'geç aktivasyon, septumdan', aria: '3D atlas kalbi: erken atım iletim sisteminde' },
    play: 'Oynat', pause: 'Duraklat', replay: 'Baştan',
    status: { rbb: 'Sağ dal', lbb: 'Sol dal', laf: 'Sol anterior fasikül', conduct: 'İleti', state: { block: 'refrakter', slow: 'kısmen toparlanmış', ok: 'toparlanmış' } },
    map: { title: 'Sonuç haritası: her önceki RR ve kuplaj için erken atımın sonucu', x: 'P–P′ kuplaj (ms)', y: 'Önceki RR (ms)' },
    clues: { title: 'Aberasyon mu, VES mi?', aberrant: 'Aberasyon lehine (bu atımda)', ves: 'VES lehine',
      items: { pWave: 'Erken QRS’ten önce P′ var (T’ye gömülebilir)', longShort: 'Uzun döngüyü kısa döngü izliyor', rbbbShape: 'V1’de trifazik rsR′ (RBBB tipi)', initial: 'İlk vektör normal atımla aynı (septal r/q korunur)', noCompensatory: 'Tam kompansatuvar duraklama yok (sinüs sıfırlanır)' },
      vesItems: ['V1’de monofazik R veya qR; sol “tavşan kulağı” daha yüksek', 'Önünde P′ yok, AV disosiyasyon', 'Tam kompansatuvar duraklama', 'Uzun-kısa döngüyle ilişkisiz, sabit kuplaj', 'QRS > 160 ms, V6’da R/S < 1'] },
    af: { reseed: 'Yeni AF şeridi', beats: 'Atım', aberrant: 'Aberan', linked: 'Ardışık (linking)', longShort: 'Uzun-kısa', tach: 'Tachogram: her RR, rengi atımın iletisi · ↓ uzun-kısa · L linking', x: 'Atım sırası', strip: 'V1 ve II · 10 s · 25 mm/s' },
    explain: {
      base: (c, r, l, f) => `Önceki RR ${c} ms: sağ dal ERP ${r} ms, sol anterior fasikül ${f} ms, sol dal ${l} ms. Dalların refrakter periyodu önceki döngüyle uzar.`,
      blockedAvn: (k, e) => `P′ ${k} ms’de AV nodun refrakter periyoduna (${e} ms) düştü: iletilmedi, QRS yok. Erken P′ önceki T dalgasını deforme eder; bu duraklamayı AV blok sanma.`,
      conducted: (k, ah, hh) => `P′ ${k} ms’de geldi; AV nod gecikmesi AH’yi ${ah} ms’ye uzattı, dallara ulaşan aralık H1–H2 ${hh} ms oldu.`,
      normal: 'Bu aralık üç yapının ERP’sinden de uzun: dar QRS.',
      protect: ' P′ kuplajı sağ dalın ERP’sinden kısaydı, ama AV nod gecikmesi dalları korudu.',
      rbbb: hh => `Sağ dal hâlâ refrakter (${hh} ms < ERP): impuls sol daldan iner, sağ ventrikül septumdan geç aktive olur. V1’de rsR′, I ve V6’da geniş S: Ashman fenomeni.`,
      'rbbb-incomplete': 'Sağ dal kısmen toparlanmış: ileti yavaş, inkomplet RBBB biçimi.',
      'rbbb-lafb': 'Sağ dal ve sol anterior fasikül refrakter: RBBB ile birlikte sol aks sapması (aberasyonun ikinci sık biçimi).',
      lafb: 'Yalnız sol anterior fasikül refrakter: dar QRS, sol aks.',
      lbbb: 'Sol dal refrakter: LBBB biçimi. Kısa döngülerde sol dalın ERP’si sağdakini geçebilir.',
      'lbbb-incomplete': 'Sol dal kısmen toparlanmış: inkomplet LBBB biçimi; kısa döngülerde sol dal daha geç toparlanabilir.',
      'blocked-hps': hh => `H1–H2 (${hh} ms) iki dalın ERP’sinden de kısa: impuls His altında bloke, QRS yok.`,
      sinus: 'Kuplaj önceki RR’den uzun: atım erken değil.',
      af: (n, a, l) => `${n} atımın ${a} tanesi aberan, ${l} tanesi bir öncekinin ardından (linking). Uzun duraklamayı izleyen kısa döngü sağ dalı refrakter yakalar. Bloke dal septumdan geç aktive olduğu için onun döngüsü de kısalır; sonraki kısa döngüde yine refrakter kalabilir. Aberasyon uzun bir döngüyle biter.`
    },
    note: 'Ashman fenomeni (Gouaux ve Ashman, 1947): dalların refrakter periyodu önceki döngüyle orantılıdır, bu yüzden uzun-kısa dizisinde erken atım çoğu zaman sağ dal bloğu biçiminde iletilir. AF’de tek bir aberan atım Ashman ile açıklanabilir, ama ardışık geniş atımlarda VT dışlanmalıdır. Öğretim modeli: doğrusal refrakterlik, üstel AV nod gecikmesi, 80 ms transseptal gecikme ve tek dipol; hasta kaydı değildir.'
  },
  en: {
    title: 'Ashman phenomenon: long-short cycles and aberrant conduction', modes: { pac: 'Single premature beat (PAC)', af: 'AF: Ashman beats' },
    cycle: 'Preceding RR (long cycle)', coupling: 'P–P′ coupling (short cycle)', brisk: 'Brisk AV nodal conduction (sympathetic tone)', diseased: 'His-Purkinje disease (ERP +20%)',
    presets: 'Examples', preset: { classic: 'Classic Ashman', protect: 'AV node protection', lafb: 'RBBB + LAFB', blocked: 'Blocked PAC' },
    cells: { cycle: 'Preceding RR', coupling: 'P–P′', ah: 'AH′', h1h2: 'H1–H2', rbb: 'Right bundle ERP', laf: 'LAF ERP', lbb: 'Left bundle ERP', qrs: 'QRS′' },
    strip: 'II and V1 · 25 mm/s · 10 mm/mV', long: 'long', short: 'short', pPrime: 'P′',
    bars: { axis: 'ms from the last sinus His activation · line: the early impulse', erp: 'refractory', rrp: 'partial', ready: 'ready', avn: 'AV node' },
    heart: { sa: 'SA node', avn: 'AV node', his: 'His', rbb: 'Right bundle', lbb: 'Left bundle', laf: 'LAF', lpf: 'LPF', block: 'block', septal: 'late, across the septum', aria: '3D atlas heart: the early beat in the conduction system' },
    play: 'Play', pause: 'Pause', replay: 'Replay',
    status: { rbb: 'Right bundle', lbb: 'Left bundle', laf: 'Left anterior fascicle', conduct: 'Conduction', state: { block: 'refractory', slow: 'partly recovered', ok: 'recovered' } },
    map: { title: 'Outcome map: the early beat for every preceding RR and coupling', x: 'P–P′ coupling (ms)', y: 'Preceding RR (ms)' },
    clues: { title: 'Aberrancy or a ventricular beat?', aberrant: 'For aberrancy (this beat)', ves: 'For a ventricular beat',
      items: { pWave: 'A P′ precedes the early QRS (it may hide in the T)', longShort: 'A short cycle follows a long one', rbbbShape: 'Triphasic rsR′ in V1 (RBBB type)', initial: 'Same initial vector as the normal beat (septal r/q kept)', noCompensatory: 'No full compensatory pause (the sinus node is reset)' },
      vesItems: ['Monophasic R or qR in V1; taller left “rabbit ear”', 'No P′ before it, AV dissociation', 'Full compensatory pause', 'Fixed coupling, unrelated to long-short cycles', 'QRS > 160 ms, R/S < 1 in V6'] },
    af: { reseed: 'New AF strip', beats: 'Beats', aberrant: 'Aberrant', linked: 'Consecutive (linking)', longShort: 'Long-short', tach: 'Tachogram: every RR, coloured by conduction · ↓ long-short · L linking', x: 'Beat number', strip: 'V1 and II · 10 s · 25 mm/s' },
    explain: {
      base: (c, r, l, f) => `Preceding RR ${c} ms: right bundle ERP ${r} ms, left anterior fascicle ${f} ms, left bundle ${l} ms. Bundle refractoriness lengthens with the preceding cycle.`,
      blockedAvn: (k, e) => `The P′ at ${k} ms fell in the AV node's refractory period (${e} ms): not conducted, no QRS. An early P′ deforms the preceding T wave; do not mistake the pause for AV block.`,
      conducted: (k, ah, hh) => `The P′ came at ${k} ms; AV nodal delay stretched the AH to ${ah} ms, so the bundles saw an H1–H2 of ${hh} ms.`,
      normal: 'That is longer than all three refractory periods: narrow QRS.',
      protect: ' The P′ coupling was shorter than the right bundle ERP, but AV nodal delay protected the bundles.',
      rbbb: hh => `The right bundle is still refractory (${hh} ms < ERP): the impulse goes down the left bundle and the right ventricle activates late across the septum. rsR′ in V1, wide S in I and V6: the Ashman phenomenon.`,
      'rbbb-incomplete': 'The right bundle has partly recovered: slow conduction, an incomplete RBBB shape.',
      'rbbb-lafb': 'Right bundle and left anterior fascicle refractory: RBBB with left axis deviation (the second most common aberrant shape).',
      lafb: 'Only the left anterior fascicle is refractory: narrow QRS, left axis.',
      lbbb: 'The left bundle is refractory: LBBB shape. At short cycles the left bundle ERP can exceed the right.',
      'lbbb-incomplete': 'The left bundle has partly recovered: an incomplete LBBB shape; at short cycles the left bundle can recover later.',
      'blocked-hps': hh => `H1–H2 (${hh} ms) is shorter than both bundle ERPs: blocked below the His, no QRS.`,
      sinus: 'The coupling is longer than the preceding RR: the beat is not premature.',
      af: (n, a, l) => `${a} of ${n} beats are aberrant, ${l} right after another aberrant beat (linking). A short cycle after a long pause catches the right bundle refractory. The blocked bundle is activated late across the septum, so its own cycle is short too and it can stay refractory on the next short cycle. Aberrancy ends with a long cycle.`
    },
    note: 'Ashman phenomenon (Gouaux and Ashman, 1947): bundle branch refractoriness is proportional to the preceding cycle, so in a long-short sequence the early beat is usually conducted with RBBB. In AF a single aberrant beat may be Ashman, but consecutive wide beats need VT ruled out. Teaching model: linear refractoriness, exponential AV nodal delay, an 80 ms transseptal delay and one dipole; never a patient recording.'
  }
};
const PRESETS = Object.freeze({ classic: { cycle: 1000, coupling: 380, brisk: false, diseased: false }, protect: { cycle: 700, coupling: 300, brisk: false, diseased: false }, lafb: { cycle: 1000, coupling: 370, brisk: true, diseased: false }, blocked: { cycle: 1000, coupling: 260, brisk: false, diseased: false } });
const ANIM_MS = 2600;   // one pass of the early beat at about one quarter speed

export function createAshmanLab({ mount, getLang = () => 'tr', state = {} }) {
  const s = Object.assign(state, { mode: state.mode || 'pac', cycle: state.cycle || 1000, coupling: state.coupling || 380, brisk: Boolean(state.brisk), diseased: Boolean(state.diseased), seed: state.seed || 1 });
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const t = () => TEXT[lang()];
  const root = el('section', 'guyton-card ecgc-lab', { 'data-ecg-chapter': 'ashman' });
  let result = null, af = null, map = null, mapKey = '', frame = null, anim = null, clock = null, atlas = null;
  const heartView = () => (atlas ??= createAshmanAtlas({ getLang: lang }));

  function compute() {
    if (s.mode === 'af') { af = afRun({ seed: s.seed, diseased: s.diseased }); return; }
    s.coupling = Math.min(s.coupling, s.cycle - 10);
    result = prematureBeat({ cycle: s.cycle, coupling: s.coupling, brisk: s.brisk, diseased: s.diseased });
    const key = `${s.brisk}|${s.diseased}`;
    if (key !== mapKey) { map = outcomeMap({ brisk: s.brisk, diseased: s.diseased }); mapKey = key; }
  }

  const range = (key, text, lo, hi, step) => {
    const wrap = el('label', 'ecgc-range'), span = el('span'), out = el('output');
    const input = el('input', '', { type: 'range', min: lo, max: hi, step, value: s[key], [`data-ash-${key}`]: '' });
    input.addEventListener('input', () => { s[key] = Number(input.value); if (key === 'cycle') syncCoupling(); out.textContent = `${s[key]} ms`; update(true); });
    span.textContent = text; out.textContent = `${s[key]} ms`; wrap.append(span, input, out); return wrap;
  };
  function syncCoupling() {
    const c = root.querySelector('[data-ash-coupling]'); if (!c) return;
    c.max = String(s.cycle - 10); if (s.coupling > s.cycle - 10) { s.coupling = s.cycle - 10; }
    c.value = String(s.coupling); c.closest('label').querySelector('output').textContent = `${s.coupling} ms`;
  }
  const check = (key, text) => {
    const box = el('label', 'ecgc-check'), input = el('input', '', { type: 'checkbox', [`data-ash-${key}`]: '' }), span = el('span');
    input.checked = s[key]; input.addEventListener('change', () => { s[key] = input.checked; update(true); }); span.textContent = text; box.append(input, span); return box;
  };
  const field = (title, node) => { const f = el('div', 'ecgc-field'), sp = el('span', 'ecgc-label'); sp.textContent = title; f.append(sp, node); return f; };

  function build() {
    const T = t();
    stopAnim();
    root.replaceChildren();
    const head = el('div', 'ecgc-head'), h = el('h3'); h.textContent = T.title; head.append(h);
    const modeBar = segmented('ash-mode', ['pac', 'af'].map(id => ({ id, label: T.modes[id] })), s.mode, id => { s.mode = id; build(); });
    const controls = el('div', 'ecgc-controls');
    root.append(head, modeBar, controls);
    if (s.mode === 'af') return buildAf(T, controls);
    controls.append(
      range('cycle', T.cycle, RANGES.cycle[0], RANGES.cycle[1], 10), range('coupling', T.coupling, RANGES.coupling[0], s.cycle - 10, 5),
      field('', (() => { const g = el('div', 'ecgc-checks'); g.append(check('brisk', T.brisk), check('diseased', T.diseased)); return g; })()),
      field(T.presets, segmented('ash-preset', Object.keys(PRESETS).map(id => ({ id, label: T.preset[id] })), '', id => { Object.assign(s, PRESETS[id]); build(); }))
    );
    const cells = el('div', 'ecgc-qt-table', { 'data-ash-cells': '' });
    const explain = el('p', 'ecgc-explain', { 'data-ash-explain': '', 'aria-live': 'polite' });
    const strip = el('canvas', 'ecgc-canvas ash-strip', { 'data-ash-strip': '', role: 'img', 'aria-label': T.strip });
    const grid = el('div', 'ecgc-grid');
    const bars = el('canvas', 'ecgc-canvas ash-bars', { 'data-ash-bars': '', role: 'img', 'aria-label': T.bars.axis });
    const side = el('div', 'ash-side');
    const play = el('button', 'ash-play', { type: 'button', 'data-ash-play': '' });
    play.addEventListener('click', () => (anim ? stopAnim(true) : startAnim(true)));
    const status = el('div', 'ash-status', { 'data-ash-status': '' });
    side.append(heartView().element, play);
    const barsCap = el('p', 'ecgc-label'); barsCap.textContent = T.bars.axis;
    const barsCol = el('div', 'ash-col'); barsCol.append(bars, barsCap, status);
    grid.append(barsCol, side);
    const grid2 = el('div', 'ecgc-grid');
    const mapCanvas = el('canvas', 'ecgc-canvas ash-map', { 'data-ash-map': '', role: 'img', 'aria-label': T.map.title });
    const mapWrap = el('div', 'ash-col'), mapTitle = el('p', 'ecgc-label'); mapTitle.textContent = T.map.title;
    const legend = el('div', 'ash-legend');
    for (const p of ['normal', 'rbbb-incomplete', 'rbbb', 'rbbb-lafb', 'lbbb-incomplete', 'lbbb', 'blocked-hps', 'blocked-avn']) {
      const i = el('span'), sw = el('i'); sw.style.background = PATTERN_COLOR[p]; i.append(sw, document.createTextNode(PATTERN[lang()][p])); legend.append(i);
    }
    mapWrap.append(mapTitle, mapCanvas, legend);
    const clues = el('div', 'ash-clues', { 'data-ash-clues': '' });
    grid2.append(mapWrap, clues);
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(cells, explain, strip, grid, grid2, note);
    update(false);
    startAnim();
  }

  function buildAf(T, controls) {
    const btn = el('button', 'ash-play', { type: 'button', 'data-ash-reseed': '' }); btn.textContent = T.af.reseed;
    btn.addEventListener('click', () => { s.seed = (s.seed % 97) + 1; update(false); });
    controls.append(field('', btn), field('', check('diseased', T.diseased)));
    const cells = el('div', 'ecgc-qt-table', { 'data-ash-cells': '' });
    const explain = el('p', 'ecgc-explain', { 'data-ash-explain': '', 'aria-live': 'polite' });
    const strip = el('canvas', 'ecgc-canvas ash-strip', { 'data-ash-strip': '', role: 'img', 'aria-label': T.af.strip });
    const tach = el('canvas', 'ecgc-canvas ash-tach', { 'data-ash-tach': '', role: 'img', 'aria-label': T.af.tach });
    const cap = el('p', 'ecgc-label'); cap.textContent = T.af.tach;
    const note = el('p', 'ecgc-note'); note.textContent = T.note;
    root.append(cells, explain, strip, cap, tach, note);
    update(false);
  }

  function update(restart) {
    compute();
    if (frame == null) frame = globalThis.requestAnimationFrame?.(() => { frame = null; draw(); }) ?? (draw(), null);
    if (restart && s.mode === 'pac') startAnim();
  }

  const cell = (k, v, attrs = {}) => { const c = el('div', 'ecgc-qt-cell', attrs), a = el('span'), b = el('strong'); a.textContent = k; b.textContent = v; c.append(a, b); return c; };

  function draw() {
    if (!root.isConnected) return;
    const T = t();
    if (s.mode === 'af') return drawAf(T);
    const p = result.pac, B = p.bundles, ref = b => bundleRefractory(b, s.cycle, { diseased: s.diseased });
    const ms = v => (v == null ? '·' : `${v} ms`);
    root.querySelector('[data-ash-cells]').replaceChildren(
      cell(T.cells.cycle, ms(s.cycle)), cell(T.cells.coupling, ms(s.coupling)), cell(T.cells.ah, ms(p.ah)), cell(T.cells.h1h2, ms(p.h1h2)),
      cell(T.cells.rbb, ms(ref('rbb').erp)), cell(T.cells.laf, ms(ref('laf').erp)), cell(T.cells.lbb, ms(ref('lbb').erp)),
      cell(T.cells.qrs, p.v == null ? '·' : `${qrsWidth(p.pattern, B)} ms`),
      (() => { const c = cell('', PATTERN[lang()][p.pattern], { 'data-ash-pattern': p.pattern }); c.style.borderColor = PATTERN_COLOR[p.pattern]; return c; })()
    );
    root.querySelector('[data-ash-explain]').textContent = explainPac(T);
    const beats = result.beats, i = beats.indexOf(p), before = beats[i - 1], prior = beats[i - 2];
    const vOf = b => (b.v ?? b.a + 135);
    drawStrip(root.querySelector('[data-ash-strip]'), beats, {
      from: prior.a - 250, to: Math.min(result.span, beats[i + 1].a + 520), maxTo: result.span,
      brackets: [{ from: vOf(prior), to: vOf(before), text: `${T.long} ${s.cycle} ms` }, { from: vOf(before), to: p.v ?? p.a + 135, text: `${T.short} ${p.v == null ? s.coupling : p.v - before.v} ms`, color: '#b91c1c', row: 1 }],
      tags: [{ t: p.a + 45, text: T.pPrime, color: '#b91c1c', row: 1 }, ...stripTags(beats)]
    });
    drawBarsNow(T);
    heartView().draw(p, animTime(), T.heart);
    drawMap(root.querySelector('[data-ash-map]'), map, { cycle: s.cycle, coupling: s.coupling, text: T.map });
    drawStatus(T);
    drawClues(T);
  }

  function rowsNow(T) {
    const p = result.pac, before = result.beats[result.beats.indexOf(p) - 1];
    const avnErp = result.avn.erp;
    const rows = [{ name: T.bars.avn, start: before.a, erp: avnErp, rrp: 40, arrive: p.a, blocked: p.pattern === 'blocked-avn' }];
    for (const b of ['rbb', 'laf', 'lbb']) {
      const r = bundleRefractory(b, s.cycle, { diseased: s.diseased });
      rows.push({ name: T.cells[b].replace(' ERP', ''), start: before.h, erp: r.erp, rrp: r.rrp, arrive: p.h, blocked: p.bundles?.[b]?.state === 'block' });
    }
    return { rows, from: before.a - 40, to: before.h + Math.max(s.cycle * .75, (p.h ?? p.a) - before.h + 160) };
  }
  function drawBarsNow(T) {
    const { rows, from, to } = rowsNow(T);
    drawBars(root.querySelector('[data-ash-bars]'), rows, { from, to, cursor: anim ? animTime() : null, text: T.bars });
  }

  function explainPac(T) {
    const E = T.explain, p = result.pac, r = k => bundleRefractory(k, s.cycle, { diseased: s.diseased }).erp;
    const base = E.base(s.cycle, r('rbb'), r('lbb'), r('laf'));
    if (p.pattern === 'blocked-avn') return `${base} ${E.blockedAvn(s.coupling, result.avn.erp)}`;
    const conducted = E.conducted(s.coupling, p.ah, p.h1h2);
    const tail = typeof E[p.pattern] === 'function' ? E[p.pattern](p.h1h2) : E[p.pattern];
    const protect = p.pattern === 'normal' && s.coupling < r('rbb') ? E.protect : '';
    return `${base} ${conducted} ${tail}${protect}`;
  }

  function drawStatus(T) {
    const p = result.pac, box = root.querySelector('[data-ash-status]');
    const card = (name, state) => { const c = el('div', 'ash-stat', { 'data-state': state }), a = el('span'), b = el('strong'); a.textContent = name; b.textContent = T.status.state[state] || '·'; c.append(a, b); return c; };
    const items = p.bundles ? ['rbb', 'laf', 'lbb'].map(b => card(T.status[b], p.bundles[b].state)) : [];
    const conduct = el('div', 'ash-stat', { 'data-state': p.pattern === 'normal' ? 'ok' : p.pattern.startsWith('blocked') ? 'block' : 'slow' });
    const a = el('span'), b = el('strong'); a.textContent = T.status.conduct; b.textContent = PATTERN[lang()][p.pattern]; conduct.append(a, b);
    box.replaceChildren(...items, conduct);
    const play = root.querySelector('[data-ash-play]'); if (play) play.textContent = anim ? T.pause : clock != null ? T.play : T.replay;
  }

  function drawClues(T) {
    const { aberrant, clues } = aberrancyClues(result), box = root.querySelector('[data-ash-clues]');
    const h = el('p', 'ecgc-label'); h.textContent = T.clues.title;
    const col = (title, items, attr) => { const c = el('div', 'ecgc-crit-group', attr), st = el('strong'); st.textContent = title; c.append(st); for (const [txt, met] of items) { const r = el('span', '', { 'data-met': String(met) }); r.textContent = `${met ? '✓' : '·'} ${txt}`; c.append(r); } return c; };
    box.replaceChildren(h,
      col(T.clues.aberrant, clues.map(c => [T.clues.items[c.id], aberrant && c.met]), { 'data-met': String(aberrant) }),
      col(T.clues.ves, T.clues.vesItems.map(x => [x, false]), {}));
  }

  function drawAf(T) {
    const beats = af.beats, ab = beats.filter(b => b.aberrant).length, lk = beats.filter(b => b.linked).length;
    root.querySelector('[data-ash-cells]').replaceChildren(cell(T.af.beats, String(beats.length)), cell(T.af.aberrant, String(ab)), cell(T.af.linked, String(lk)), cell(T.af.longShort, String(beats.filter(b => b.longShort).length)));
    root.querySelector('[data-ash-explain]').textContent = T.explain.af(beats.length, ab, lk);
    drawStrip(root.querySelector('[data-ash-strip]'), beats, { from: 0, to: af.span, leads: ['V1', 'II'], tags: stripTags(beats), fib: true });
    drawTachogram(root.querySelector('[data-ash-tach]'), beats, T.af);
  }

  // ---- Animation of the early beat through the conduction system ----
  const TAIL_MS = 230;   // after the His: ventricles and the late septal activation
  const window_ = () => { const p = result.pac; return [p.a - 80, (p.h ?? p.a + 60) + TAIL_MS]; };
  function animTime() {
    const [a, z] = window_();
    if (!anim) return clock ?? z;
    return a + Math.min(1, (performance.now() - anim.start) / ANIM_MS) * (z - a);
  }
  /** Play the early beat; `resume` continues from a paused moment instead of the start. */
  function startAnim(resume = false) {
    const [a, z] = window_(), from = resume && clock != null && clock < z ? (clock - a) / (z - a) : 0;
    stopAnim();
    if (s.mode !== 'pac' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { clock = null; return; }
    anim = { start: performance.now() - from * ANIM_MS };
    const tick = () => {
      if (!anim || !root.isConnected) return;
      const T = t(), now = animTime();
      heartView().draw(result.pac, now, T.heart); drawBarsNow(T);
      if (performance.now() - anim.start >= ANIM_MS) { clock = null; anim = null; drawBarsNow(T); drawStatus(T); return; }
      anim.raf = globalThis.requestAnimationFrame(tick);
    };
    anim.raf = globalThis.requestAnimationFrame(tick);
  }
  function stopAnim(keep = false) {
    if (anim?.raf) globalThis.cancelAnimationFrame?.(anim.raf);
    clock = keep && anim ? animTime() : null;
    anim = null;
    if (keep && result) { const T = t(); drawStatus(T); drawBarsNow(T); }
  }

  const onResize = () => draw();
  globalThis.addEventListener?.('resize', onResize);
  mount.append(root);
  build();
  return {
    element: root, render: build,
    getResult: () => (s.mode === 'af' ? af : result),
    destroy() { stopAnim(); atlas?.destroy(); globalThis.removeEventListener?.('resize', onResize); if (frame != null) globalThis.cancelAnimationFrame?.(frame); root.remove(); }
  };
}
