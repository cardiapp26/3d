// Coronary IVUS Lab · "3D vessel & stent model" workspace: markup, live updates and bindings.
// The panel owns `state.model*`; this module mounts the Three.js scene and updates the IVUS
// frame, the longitudinal profile, the stent metrics and the normal-MLA card in place, so the
// 3D context is not rebuilt on every input.

import { NORMAL_SEGMENTS, PULLBACK_ROUTES, LM_CUTOFFS, firstMlaCutoff, areaFromDiameter, findSegment } from './ivus-anatomy.js';
import {
  MODEL_SCENARIOS,
  STENT_DIAMETERS,
  STENT_LENGTHS,
  BALLOON_DIAMETERS,
  MALAPPOSITION_MM,
  findScenario,
  createModelState,
  modelProfile,
  stentMetrics,
  frameMlaAssessment,
  potRange
} from './ivus-stent-model.js';
import { createIvusModel3D } from './ivus-model-3d.js';
import { renderModelCross } from './ivus-model-cross.js';

const pick = (o, lang) => (o && typeof o === 'object' ? o[lang === 'en' ? 'en' : 'tr'] : String(o ?? ''));
const T = (lang, tr, en) => (lang === 'en' ? en : tr);
const fmt = (v, d = 2) => Number(v).toFixed(d);
const VESSELS = [['LAD', 'LM → LAD'], ['LCX', 'LM → LCx'], ['RCA', 'RCA']];

/** Default model fields merged into the panel state once. */
export function modelStateDefaults() {
  return {
    model: createModelState('native'),
    modelProbeMm: 22,
    modelCut: false,
    modelLabels: true,
    modelBorders: true,
    modelMhz: 60,
    modelPopulation: 'western',
    modelPicked: null
  };
}

const options = (list, value, unit = '') => list.map((v) => `<option value="${v}" ${Number(v) === Number(value) ? 'selected' : ''}>${fmt(v, 2)}${unit}</option>`).join('');

function stentControlsHtml(state, lang) {
  const st = state.model.stent;
  if (!st) return '';
  const route = PULLBACK_ROUTES[state.model.vessel];
  return `
    <div class="im-controls">
      <label>${T(lang, 'Stent çapı', 'Stent diameter')}<select data-im-stent="diamMm">${options(STENT_DIAMETERS, st.diamMm, ' mm')}</select></label>
      <label>${T(lang, 'Uzunluk', 'Length')}<select data-im-stent="lengthMm">${STENT_LENGTHS.map((v) => `<option value="${v}" ${v === st.lengthMm ? 'selected' : ''}>${v} mm</option>`).join('')}</select></label>
      <label>${T(lang, 'Proksimal kenar', 'Proximal edge')} <output data-im-out="startMm">${st.startMm} mm</output><input type="range" min="0" max="${route.lengthMm - st.lengthMm}" step="1" value="${st.startMm}" data-im-stent="startMm" /></label>
      <label>${T(lang, 'Açma basıncı', 'Deployment pressure')} <output data-im-out="atm">${st.atm} atm</output><input type="range" min="8" max="20" step="1" value="${st.atm}" data-im-stent="atm" /></label>
    </div>
    <div class="im-controls">
      <label class="im-check"><input type="checkbox" data-im-balloon="post" ${st.post ? 'checked' : ''} /> ${T(lang, 'NC balon post-dilatasyon (tüm stent)', 'NC balloon post-dilation (whole stent)')}</label>
      <label>${T(lang, 'NC balon', 'NC balloon')}<select data-im-balloon-d="post">${options(BALLOON_DIAMETERS, st.post?.diamMm ?? st.diamMm + 0.25, ' mm')}</select></label>
      <label>atm <output data-im-out="post-atm">${st.post?.atm ?? 18}</output><input type="range" min="12" max="24" step="1" value="${st.post?.atm ?? 18}" data-im-balloon-atm="post" /></label>
    </div>
    <div class="im-controls">
      <label class="im-check"><input type="checkbox" data-im-balloon="pot" ${st.pot ? 'checked' : ''} /> ${T(lang, 'POT (proksimal optimizasyon)', 'POT (proximal optimisation)')}</label>
      <label>${T(lang, 'POT balonu', 'POT balloon')}<select data-im-balloon-d="pot">${options(BALLOON_DIAMETERS, st.pot?.diamMm ?? 4.0, ' mm')}</select></label>
      <label>atm <output data-im-out="pot-atm">${st.pot?.atm ?? 14}</output><input type="range" min="10" max="20" step="1" value="${st.pot?.atm ?? 14}" data-im-balloon-atm="pot" /></label>
    </div>
    <div class="im-actions">
      <label class="im-check"><input type="checkbox" data-im-modify ${state.model.plaqueModified ? 'checked' : ''} /> ${T(lang, 'Plak modifikasyonu (IVL / aterektomi)', 'Plaque modification (IVL / atherectomy)')}</label>
      <button type="button" class="ivus-btn" data-im-eapci>${T(lang, 'EAPCI çapını uygula', 'Apply EAPCI size')}</button>
      <button type="button" class="ivus-btn" data-im-reset-scenario>${T(lang, 'Senaryoyu sıfırla', 'Reset scenario')}</button>
    </div>`;
}

function row(label, value, cls = '') {
  return `<div class="im-row"><span>${label}</span><strong class="${cls}">${value}</strong></div>`;
}

function stentMetricsHtml(m, model, lang) {
  if (!m) return '';
  const pr = potRange(model);
  return [
    row('MSA', `${fmt(m.msaMm2)} mm² @ ${fmt(m.msaAtMm, 1)} mm`, m.ultimateExpansion ? 'ok' : 'bad'),
    row(T(lang, 'Distal referans lümen', 'Distal reference lumen'), `${fmt(m.distRefLumenD)} mm · ${fmt(m.distRefLumenAreaMm2)} mm²`),
    row(T(lang, 'Stent açılımı (MSA / distal ref)', 'Stent expansion (MSA / distal ref)'), `%${fmt(m.expansionPct, 0)} · ULTIMATE ${m.ultimateExpansion ? '✓' : '✗'} (>%90 ${T(lang, 'veya', 'or')} >5.0 mm²) · EAPCI ${m.eapciExpansion ? '✓' : '✗'} (>%80)`, m.ultimateExpansion ? 'ok' : 'bad'),
    row(T(lang, 'Malapozisyon (en büyük / uzunluk)', 'Malapposition (max / length)'), `${fmt(m.maxGapMm)} mm · ${fmt(m.malappositionLengthMm, 1)} mm ${m.malapposed ? T(lang, '· belirgin (OCT: >0.4 mm, >1 mm)', '· relevant (OCT: >0.4 mm, >1 mm)') : '✓'}`, m.malapposed ? 'bad' : m.maxGapMm > 0.1 ? 'warn' : 'ok'),
    row(T(lang, 'Boyut seçimi', 'Sizing'), m.undersized ? T(lang, `Küçük: nominal ${fmt(model.stent.diamMm)} mm < EAPCI ${fmt(m.eapciNominalMm)} mm (distal EEM 0.25 aşağı)`, `Undersized: nominal ${fmt(model.stent.diamMm)} mm < EAPCI ${fmt(m.eapciNominalMm)} mm (distal EEM, rounded down)`) : T(lang, `Uygun (EAPCI ${fmt(m.eapciNominalMm)} mm)`, `Appropriate (EAPCI ${fmt(m.eapciNominalMm)} mm)`), m.undersized ? 'bad' : 'ok'),
    row(T(lang, 'Platform azami çapı', 'Platform maximal diameter'), m.overLimit ? T(lang, `Aşıldı (> ${fmt(m.platformLimitMm)} mm): strut kırığı / polimer hasarı riski`, `Exceeded (> ${fmt(m.platformLimitMm)} mm): strut fracture / polymer damage risk`) : `${fmt(m.platformLimitMm)} mm ${T(lang, '(örnek değer; cihaz IFU)', '(illustrative; device IFU)')}`, m.overLimit ? 'bad' : ''),
    row(T(lang, 'Kenar plak yükü (5 mm)', 'Edge plaque burden (5 mm)'), `${T(lang, 'proks', 'prox')} %${fmt(m.edgePbProx, 0)} · distal %${fmt(m.edgePbDist, 0)}`, m.ultimateEdges ? 'ok' : 'bad'),
    m.kang ? row('Kang (LM)', `LM ${fmt(m.kang.lmMsa, 1)} (>8) · POC ${fmt(m.kang.pocMsa, 1)} (>7) · LAD ost ${fmt(m.kang.ladMsa, 1)} (>6) mm²`, m.kang.ok ? 'ok' : 'bad') : '',
    model.stent.pot && pr ? row(T(lang, 'POT bölgesi', 'POT zone'), `${fmt(pr.start, 1)}–${fmt(pr.end, 1)} mm`) : '',
    row(T(lang, 'ULTIMATE sonucu', 'ULTIMATE verdict'), m.ultimateOptimal ? T(lang, 'Optimal (açılım + kenar PB)', 'Optimal (expansion + edge PB)') : T(lang, 'Suboptimal', 'Suboptimal'), m.ultimateOptimal ? 'ok' : 'bad')
  ].join('');
}

function verdictText(a, lang) {
  if (a.smallVessel) return [T(lang, 'Bu çapta MLA eşiği güvenilir değil', 'MLA cut-off unreliable at this size'), 'warn'];
  if (a.verdict === 'below') return a.leftMain
    ? [T(lang, 'Eşiğin altında: revaskülarizasyon düşün', 'Below cut-off: consider revascularisation'), 'bad']
    : [T(lang, 'Eşiğin altında: FFR/iFR ile doğrula (IVUS MLA özgüllüğü düşük)', 'Below cut-off: confirm with FFR/iFR (IVUS MLA has low specificity)'), 'bad'];
  if (a.verdict === 'grey') return [T(lang, 'Gri bölge: fizyoloji ile değerlendir', 'Grey zone: assess with physiology'), 'warn'];
  return [T(lang, 'Eşiğin üzerinde: erteleme makul (klinikle birlikte)', 'Above cut-off: deferral reasonable (with clinical context)'), 'ok'];
}

function mlaCardHtml(state, frame, lang) {
  const a = frameMlaAssessment(frame, state.modelPopulation);
  const [vText, vCls] = verdictText(a, lang);
  const seg = a.segment;
  const table = NORMAL_SEGMENTS.map((s) => {
    const cut = s.leftMain ? `${LM_CUTOFFS.western.cutoffMm2.toFixed(1)} / ${LM_CUTOFFS.asian.cutoffMm2.toFixed(1)}` : firstMlaCutoff(s.diamMm).cutoffMm2.toFixed(1);
    const active = s.id === seg.id || s.id === state.modelPicked;
    return `<tr class="${active ? 'active' : ''}" data-im-seg="${s.id}" tabindex="0"><td>${pick(s.name, lang)}</td><td>${s.approx ? '≈' : ''}${fmt(s.diamMm, 1)}</td><td>${fmt(areaFromDiameter(s.diamMm), 1)}</td><td>${cut}</td></tr>`;
  }).join('');
  return `
    <div class="ivus-card-head"><div>
      <h3>${T(lang, 'Normal lümen alanı ve MLA eşiği', 'Normal lumen area and MLA cut-off')}</h3>
      <p>${T(lang, 'Transdüserin bulunduğu segment. Damar ağacına veya tabloya tıklayın.', 'Segment under the transducer. Click the tree or the table.')}</p>
    </div>
    <div class="im-pop" role="group" aria-label="LM">
      <button type="button" class="im-chip ${state.modelPopulation === 'western' ? 'active' : ''}" data-im-pop="western">${T(lang, 'Batı (LM 6.0)', 'Western (LM 6.0)')}</button>
      <button type="button" class="im-chip ${state.modelPopulation === 'asian' ? 'active' : ''}" data-im-pop="asian">${T(lang, 'Asya (LM 4.5)', 'Asian (LM 4.5)')}</button>
    </div></div>
    <div class="im-rows">
      ${row(T(lang, 'Segment', 'Segment'), `${pick(seg.name, lang)} · ${T(lang, 'normal', 'normal')} ${seg.approx ? '≈' : ''}${fmt(seg.diamMm, 1)} mm (Dodge 1992)`)}
      ${row(T(lang, 'Bu noktadaki referans çap / alan', 'Reference diameter / area here'), `${fmt(a.refDiamMm)} mm · ${fmt(a.normalAreaMm2)} mm²`)}
      ${row(T(lang, 'Ölçülen lümen alanı (MLD)', 'Measured lumen area (MLD)'), `${fmt(a.mlaMm2)} mm² (${fmt(a.mldMm)} mm)`)}
      ${row(T(lang, 'Alan darlığı', 'Area stenosis'), `%${fmt(a.areaStenosisPct, 0)}`, a.areaStenosisPct >= 70 ? 'bad' : a.areaStenosisPct >= 50 ? 'warn' : 'ok')}
      ${row(T(lang, 'İskemik MLA eşiği', 'Ischemic MLA cut-off'), `${fmt(a.cutoffMm2, 1)} mm² · ${a.cutoffSource}`)}
      ${row(T(lang, 'Yorum', 'Interpretation'), vText, vCls)}
    </div>
    <table class="im-table">
      <thead><tr><th>${T(lang, 'Segment', 'Segment')}</th><th>${T(lang, 'Normal çap (mm)', 'Normal diameter (mm)')}</th><th>${T(lang, 'Normal alan (mm²)', 'Normal area (mm²)')}</th><th>${T(lang, 'MLA eşiği (mm²)', 'MLA cut-off (mm²)')}</th></tr></thead>
      <tbody>${table}</tbody>
    </table>
    <p class="im-note">${T(lang,
      'Normal çaplar anjiyografik ortalamalardır (Dodge 1992; sağ dominant erkek, kadında ≈0.2–0.3 mm küçük; ≈ yaklaşık). Non-LM eşik referans çapa göre FIRST: <3.0 mm → 2.4, 3.0–3.5 → 2.7, >3.5 → 3.6 mm². LM: Batı 6.0 (LITRO), Asya 4.5 (Park 2014). Finet kuralı: D(LM) = 0.678 × (D(LAD) + D(LCx)).',
      'Normal diameters are angiographic means (Dodge 1992; right-dominant men, women ≈0.2–0.3 mm smaller; ≈ approximate). Non-LM cut-off by reference diameter, FIRST: <3.0 mm → 2.4, 3.0–3.5 → 2.7, >3.5 → 3.6 mm². LM: Western 6.0 (LITRO), Asian 4.5 (Park 2014). Finet law: D(LM) = 0.678 × (D(LAD) + D(LCx)).')}</p>`;
}

function frameReadoutHtml(frame, info, lang) {
  return [
    row(T(lang, 'Konum', 'Position'), `${fmt(frame.sMm, 1)} mm · ${pick(frame.segment.name, lang)}`),
    row(T(lang, 'Lümen alanı / MLD', 'Lumen area / MLD'), `${fmt(frame.lumenAreaMm2)} mm² · ${fmt(frame.lumenD)} mm`),
    row('EEM', `${fmt(frame.eemAreaMm2)} mm² · PB %${fmt(frame.plaqueBurdenPct, 0)}`, frame.plaqueBurdenPct >= 70 ? 'bad' : frame.plaqueBurdenPct >= 50 ? 'warn' : 'ok'),
    frame.inStent ? row(T(lang, 'Stent alanı', 'Stent area'), `${fmt(frame.stentAreaMm2)} mm² · ${fmt(frame.stentD)} mm`) : '',
    frame.inStent ? row(T(lang, 'Strut-duvar mesafesi', 'Strut-to-wall distance'), `${fmt(info?.maxGapMm ?? 0)} mm · ${info?.malapposedStruts ?? 0}/${info?.struts ?? 0} strut >0.4 mm`, (info?.maxGapMm ?? 0) > MALAPPOSITION_MM ? 'bad' : (info?.maxGapMm ?? 0) > 0.1 ? 'warn' : 'ok') : '',
    frame.calciumArcDeg ? row(T(lang, 'Kalsiyum arkı', 'Calcium arc'), `${frame.calciumArcDeg}°`) : ''
  ].join('');
}

/** Longitudinal profile: EEM, lumen, stent; red where struts are >0.4 mm off the wall. */
function drawLong(canvas, frames, model, probeMm, lang) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(300, canvas.clientWidth || 800);
  const H = 150;
  if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, W, H);
  const route = PULLBACK_ROUTES[model.vessel];
  const pad = 34;
  const xs = (s) => pad + ((W - 2 * pad) * s) / route.lengthMm;
  const maxR = Math.max(...frames.map((f) => f.eemD / 2));
  const ky = (H / 2 - 20) / maxR;
  const mid = H / 2 + 4;
  const band = (rOf, fill) => {
    ctx.beginPath();
    frames.forEach((f, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, xs(f.sMm), mid - rOf(f) * ky));
    [...frames].reverse().forEach((f) => ctx.lineTo(xs(f.sMm), mid + rOf(f) * ky));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  band((f) => f.eemD / 2, 'rgba(201,162,94,0.55)');
  band((f) => f.lumenD / 2, '#1a0a0d');
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.2;
  [-1, 1].forEach((sgn) => {
    ctx.beginPath();
    frames.forEach((f, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, xs(f.sMm), mid + sgn * (f.eemD / 2) * ky));
    ctx.stroke();
  });
  ctx.strokeStyle = '#22c55e';
  [-1, 1].forEach((sgn) => {
    ctx.beginPath();
    frames.forEach((f, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, xs(f.sMm), mid + sgn * (f.lumenD / 2) * ky));
    ctx.stroke();
  });
  frames.filter((f) => f.inStent).forEach((f) => {
    const x = xs(f.sMm);
    const r = (f.stentD / 2) * ky;
    if (f.maxGapMm > MALAPPOSITION_MM) {
      ctx.fillStyle = 'rgba(255,77,79,0.45)';
      ctx.fillRect(x - 1.5, mid - (f.lumenD / 2) * ky, 3, (f.lumenD / 2) * ky - r);
      ctx.fillRect(x - 1.5, mid + r, 3, (f.lumenD / 2) * ky - r);
    }
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(x - 0.8, mid - r - 1, 1.6, 2);
    ctx.fillRect(x - 0.8, mid + r - 1, 1.6, 2);
  });
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
  route.branches.forEach((b) => {
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(b.label, xs(b.at) - 8, 13);
    ctx.fillRect(xs(b.at) - 0.5, 16, 1, 6);
  });
  const SHORT = { lm: 'LM', plad: 'pLAD', mlad: 'mLAD', dlad: 'dLAD', plcx: 'pLCx', dlcx: 'dLCx', prca: 'pRCA', mrca: 'mRCA', drca: 'dRCA' };
  route.segments.forEach(([from, id], i) => {
    const to = route.segments[i + 1]?.[0] ?? route.lengthMm;
    const full = findSegment(id).name[lang === 'en' ? 'en' : 'tr'].replace(/\s*\(.*\)/, '');
    const text = ctx.measureText(full).width + 10 < xs(to) - xs(from) ? full : SHORT[id] || id;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(xs(from), H - 16, 1, 6);
    ctx.fillText(text, xs(from) + 4, H - 6);
  });
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(T(lang, 'Ostium', 'Ostium'), 2, mid + 4);
  ctx.fillText(`${route.lengthMm}`, W - pad + 4, mid + 4);
  const px = xs(probeMm);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, 18);
  ctx.lineTo(px, H - 20);
  ctx.stroke();
  canvas._imScale = { pad, W, len: route.lengthMm };
}

export function modelWorkspaceHtml(state, lang) {
  const sc = findScenario(state.model.scenarioId);
  return `
    <section class="ivus-model" data-im-root>
      <div class="ivus-card im-bar">
        <div class="im-group" role="group" aria-label="${T(lang, 'Model', 'Model')}">
          ${MODEL_SCENARIOS.map((s) => `<button type="button" class="ivus-mode-btn ${s.id === sc.id ? 'active' : ''}" data-im-scenario="${s.id}" aria-pressed="${s.id === sc.id}">${pick(s.label, lang)}</button>`).join('')}
        </div>
        <div class="im-group">
          ${sc.id === 'native' ? VESSELS.map(([v, t]) => `<button type="button" class="im-chip ${state.model.vessel === v ? 'active' : ''}" data-im-vessel="${v}" aria-pressed="${state.model.vessel === v}">${t}</button>`).join('') : ''}
          <label class="im-check"><input type="checkbox" data-im-cut ${state.modelCut ? 'checked' : ''} /> ${T(lang, 'Kesit aç', 'Cut-away')}</label>
          <label class="im-check"><input type="checkbox" data-im-labels ${state.modelLabels ? 'checked' : ''} /> ${T(lang, 'Etiketler', 'Labels')}</label>
          <label class="im-check"><input type="checkbox" data-im-borders ${state.modelBorders ? 'checked' : ''} /> ${T(lang, 'Sınırlar', 'Borders')}</label>
          <select class="ivus-select im-mhz" data-im-mhz aria-label="MHz">${[20, 40, 60].map((m) => `<option value="${m}" ${m === state.modelMhz ? 'selected' : ''}>${m} MHz</option>`).join('')}</select>
          <button type="button" class="ivus-btn accent" data-im-pullback>${T(lang, '▶ Geri çekme', '▶ Pullback')}</button>
          <button type="button" class="ivus-btn" data-im-focus>${T(lang, 'Kateteri odakla', 'Focus catheter')}</button>
          <button type="button" class="ivus-btn" data-im-reset-view>${T(lang, 'Görünümü sıfırla', 'Reset view')}</button>
        </div>
        <p class="im-brief">${pick(sc.brief, lang)}</p>
      </div>
      <div class="im-grid">
        <div class="ivus-card im-stage-card">
          <div class="im-stage" data-im-stage aria-label="${T(lang, '3B koroner model: döndürmek için sürükleyin, görüntüleme düzlemini sürükleyerek kateteri taşıyın', '3D coronary model: drag to rotate, drag the imaging plane to move the catheter')}"></div>
          <div class="im-tip" data-im-tip hidden></div>
          <div class="im-legend">
            <span><i style="background:#dfe6ee"></i>${T(lang, 'Apoze strut', 'Apposed strut')}</span>
            <span><i style="background:#f5b041"></i>0.1–0.4 mm</span>
            <span><i style="background:#ff4d4f"></i>>0.4 mm</span>
            <span><i style="background:#38bdf8"></i>${T(lang, 'Görüntüleme düzlemi', 'Imaging plane')}</span>
          </div>
        </div>
        <div class="ivus-card im-side">
          <canvas class="im-cross" data-im-cross tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="${PULLBACK_ROUTES[state.model.vessel].lengthMm}" aria-valuenow="${Math.round(state.modelProbeMm)}" aria-label="${T(lang, 'IVUS kesiti; ok tuşları transdüseri taşır', 'IVUS frame; arrow keys move the transducer')}"></canvas>
          <div class="im-rows" data-im-frame></div>
        </div>
      </div>
      <div class="ivus-card im-long-card">
        <canvas class="im-long" data-im-long aria-label="${T(lang, 'Uzunlamasına profil; tıklayın veya sürükleyin', 'Longitudinal profile; click or drag')}"></canvas>
        <input type="range" class="ivus-pos-slider" data-im-pos min="0" max="${PULLBACK_ROUTES[state.model.vessel].lengthMm}" step="0.5" value="${state.modelProbeMm}" aria-label="${T(lang, 'Transdüser konumu (mm, ostiumdan)', 'Transducer position (mm from the ostium)')}" />
      </div>
      <div class="im-lower">
        ${state.model.stent ? `<section class="ivus-card im-stent-card">
          <div class="ivus-card-head"><div><h3>${T(lang, 'Stent, post-dilatasyon ve apozisyon', 'Stent, post-dilation and apposition')}</h3>
          <p>${T(lang, 'Çap, basınç, NC balon ve POT değiştikçe 3B model, kesit ve ölçümler anında güncellenir.', 'The 3D model, frame and measurements update as you change diameter, pressure, NC balloon and POT.')}</p></div></div>
          ${stentControlsHtml(state, lang)}
          <div class="im-rows" data-im-metrics></div>
        </section>` : ''}
        <section class="ivus-card im-mla-card" data-im-mla></section>
      </div>
    </section>`;
}

/** Mounts the scene and wires the controls. `rerender()` asks the panel for a full re-render. */
export function mountModelWorkspace(root, state, { getLang, rerender }) {
  const lang = () => getLang();
  const el = (sel) => root.querySelector(sel);
  const stage = el('[data-im-stage]');
  if (!stage) return null;
  let frames = modelProfile(state.model);
  let metrics = stentMetrics(state.model, frames);
  let timer = null;
  const tip = el('[data-im-tip]');

  const view = createIvusModel3D(stage, {
    onProbe: (mm) => setProbe(mm),
    onPick: ({ segmentId, vessel }) => {
      state.modelPicked = segmentId;
      if (state.model.scenarioId === 'native' && vessel && vessel !== state.model.vessel) {
        state.model.vessel = vessel;
        state.modelProbeMm = Math.round(PULLBACK_ROUTES[vessel].lengthMm * 0.3);
        rerender();
        return;
      }
      refresh(false);
    },
    onHover: (info) => {
      if (!tip) return;
      if (!info) { tip.hidden = true; return; }
      const b = info.branchId;
      const seg = ['lm', 'lad', 'lcx', 'rca', 'd1', 'om1', 'pda'].includes(b) ? findSegment(b === 'lad' ? 'plad' : b === 'lcx' ? 'plcx' : b === 'rca' ? 'prca' : b) : null;
      const r = stage.getBoundingClientRect();
      tip.hidden = false;
      tip.style.left = `${info.x - r.left + 14}px`;
      tip.style.top = `${info.y - r.top + 10}px`;
      tip.innerHTML = seg
        ? `<strong>${pick(seg.name, lang())}</strong><br>${T(lang(), 'Normal', 'Normal')} ${seg.approx ? '≈' : ''}${fmt(seg.diamMm, 1)} mm · ${fmt(areaFromDiameter(seg.diamMm), 1)} mm²`
        : `<strong>${b.toUpperCase()}</strong>`;
    }
  });

  const sig = () => JSON.stringify([state.model, state.modelCut]);

  function draw3D() {
    view?.update({ vessel: state.model.vessel, frames, sig: sig(), probe: state.modelProbeMm, cut: state.modelCut, labels: state.modelLabels });
  }

  function drawFrame() {
    const step = frames[1].sMm - frames[0].sMm;
    const frame = frames[Math.max(0, Math.min(frames.length - 1, Math.round(state.modelProbeMm / step)))];
    const info = renderModelCross(el('[data-im-cross]'), frame, { lang: lang(), mhz: state.modelMhz, borders: state.modelBorders, segmentLabel: pick(frame.segment.name, lang()) });
    const fr = el('[data-im-frame]');
    if (fr) fr.innerHTML = frameReadoutHtml(frame, info, lang());
    const mla = el('[data-im-mla]');
    if (mla) mla.innerHTML = mlaCardHtml(state, frame, lang());
    const cross = el('[data-im-cross]');
    cross?.setAttribute('aria-valuenow', String(Math.round(state.modelProbeMm)));
    const pos = el('[data-im-pos]');
    if (pos && document.activeElement !== pos) pos.value = String(state.modelProbeMm);
    drawLong(el('[data-im-long]'), frames, state.model, state.modelProbeMm, lang());
  }

  function refresh(modelChanged = true) {
    if (modelChanged) {
      frames = modelProfile(state.model);
      metrics = stentMetrics(state.model, frames);
      const m = el('[data-im-metrics]');
      if (m) m.innerHTML = stentMetricsHtml(metrics, state.model, lang());
    }
    draw3D();
    drawFrame();
  }

  function setProbe(mm) {
    const len = PULLBACK_ROUTES[state.model.vessel].lengthMm;
    state.modelProbeMm = Math.round(Math.max(0, Math.min(len, mm)) * 2) / 2;
    draw3D();
    drawFrame();
  }

  function stopPullback() {
    if (timer) clearInterval(timer);
    timer = null;
    const b = el('[data-im-pullback]');
    if (b) b.textContent = T(lang(), '▶ Geri çekme', '▶ Pullback');
  }

  // Scenario, vessel and display toggles.
  root.querySelectorAll('[data-im-scenario]').forEach((b) => b.addEventListener('click', () => {
    const sc = findScenario(b.dataset.imScenario);
    state.model = createModelState(sc.id);
    state.modelProbeMm = sc.stent ? sc.stent.startMm + 2 : 22;
    state.modelCut = Boolean(sc.stent);
    rerender();
  }));
  root.querySelectorAll('[data-im-vessel]').forEach((b) => b.addEventListener('click', () => {
    state.model.vessel = b.dataset.imVessel;
    state.modelProbeMm = Math.round(PULLBACK_ROUTES[state.model.vessel].lengthMm * 0.3);
    rerender();
  }));
  el('[data-im-cut]')?.addEventListener('change', (e) => { state.modelCut = e.target.checked; refresh(false); });
  el('[data-im-labels]')?.addEventListener('change', (e) => { state.modelLabels = e.target.checked; refresh(false); });
  el('[data-im-borders]')?.addEventListener('change', (e) => { state.modelBorders = e.target.checked; drawFrame(); });
  el('[data-im-mhz]')?.addEventListener('change', (e) => { state.modelMhz = Number(e.target.value); drawFrame(); });
  el('[data-im-focus]')?.addEventListener('click', () => view?.focusProbe());
  el('[data-im-reset-view]')?.addEventListener('click', () => view?.resetView());
  el('[data-im-pullback]')?.addEventListener('click', (e) => {
    if (timer) { stopPullback(); return; }
    const len = PULLBACK_ROUTES[state.model.vessel].lengthMm;
    state.modelProbeMm = len;
    e.currentTarget.textContent = T(lang(), '⏸ Durdur (10 mm/s)', '⏸ Stop (10 mm/s)');
    timer = setInterval(() => {
      if (state.modelProbeMm <= 0) { stopPullback(); return; }
      setProbe(state.modelProbeMm - 0.5);
    }, 50);
  });

  // Probe: slider, longitudinal profile, keyboard on the frame.
  el('[data-im-pos]')?.addEventListener('input', (e) => { stopPullback(); setProbe(Number(e.target.value)); });
  const long = el('[data-im-long]');
  let longDrag = false;
  const longTo = (e) => {
    const sc = long._imScale;
    if (!sc) return;
    const x = e.clientX - long.getBoundingClientRect().left;
    setProbe(((x - sc.pad) / (sc.W - 2 * sc.pad)) * sc.len);
  };
  long?.addEventListener('pointerdown', (e) => { stopPullback(); longDrag = true; long.setPointerCapture?.(e.pointerId); longTo(e); });
  long?.addEventListener('pointermove', (e) => { if (longDrag) longTo(e); });
  long?.addEventListener('pointerup', () => { longDrag = false; });
  el('[data-im-cross]')?.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
    if (!step) return;
    e.preventDefault();
    stopPullback();
    setProbe(state.modelProbeMm + step);
  });

  // Stent controls.
  root.querySelectorAll('[data-im-stent]').forEach((input) => input.addEventListener('input', () => {
    const key = input.dataset.imStent;
    state.model.stent = { ...state.model.stent, [key]: Number(input.value) };
    const out = el(`[data-im-out="${key}"]`);
    if (out) out.textContent = `${input.value} ${key === 'atm' ? 'atm' : 'mm'}`;
    if (key === 'lengthMm') {
      const range = el('[data-im-stent="startMm"]');
      const max = PULLBACK_ROUTES[state.model.vessel].lengthMm - state.model.stent.lengthMm;
      if (range) range.max = String(max);
      state.model.stent.startMm = Math.min(state.model.stent.startMm, max);
    }
    refresh();
  }));
  const balloonFrom = (kind) => ({
    diamMm: Number(el(`[data-im-balloon-d="${kind}"]`)?.value),
    atm: Number(el(`[data-im-balloon-atm="${kind}"]`)?.value)
  });
  root.querySelectorAll('[data-im-balloon]').forEach((chk) => chk.addEventListener('change', () => {
    const kind = chk.dataset.imBalloon;
    state.model.stent = { ...state.model.stent, [kind]: chk.checked ? balloonFrom(kind) : null };
    refresh();
  }));
  root.querySelectorAll('[data-im-balloon-d], [data-im-balloon-atm]').forEach((input) => input.addEventListener('input', () => {
    const kind = input.dataset.imBalloonD || input.dataset.imBalloonAtm;
    const out = el(`[data-im-out="${kind}-atm"]`);
    if (out && input.dataset.imBalloonAtm) out.textContent = input.value;
    if (state.model.stent[kind]) {
      state.model.stent = { ...state.model.stent, [kind]: balloonFrom(kind) };
      refresh();
    }
  }));
  el('[data-im-modify]')?.addEventListener('change', (e) => { state.model.plaqueModified = e.target.checked; refresh(); });
  el('[data-im-eapci]')?.addEventListener('click', () => {
    if (!metrics) return;
    const best = STENT_DIAMETERS.filter((d) => d <= metrics.eapciNominalMm + 1e-6).at(-1) ?? STENT_DIAMETERS[0];
    state.model.stent = { ...state.model.stent, diamMm: best };
    rerender();
  });
  el('[data-im-reset-scenario]')?.addEventListener('click', () => {
    state.model = createModelState(state.model.scenarioId);
    rerender();
  });

  // Normal-MLA card (re-rendered on every frame): delegated clicks.
  el('[data-im-mla]')?.addEventListener('click', (e) => {
    const pop = e.target.closest('[data-im-pop]');
    if (pop) { state.modelPopulation = pop.dataset.imPop; drawFrame(); return; }
    const tr = e.target.closest('[data-im-seg]');
    if (!tr) return;
    state.modelPicked = tr.dataset.imSeg;
    const route = PULLBACK_ROUTES[state.model.vessel];
    const idx = route.segments.findIndex(([, id]) => id === tr.dataset.imSeg);
    if (idx >= 0) {
      const from = route.segments[idx][0];
      const to = route.segments[idx + 1]?.[0] ?? route.lengthMm;
      setProbe((from + to) / 2);
    } else drawFrame();
  });

  const onResize = () => drawFrame();
  window.addEventListener('resize', onResize);
  refresh();

  return {
    dispose() {
      stopPullback();
      window.removeEventListener('resize', onResize);
      view?.dispose();
    },
    get probeMm() { return state.modelProbeMm; },
    setProbe
  };
}
