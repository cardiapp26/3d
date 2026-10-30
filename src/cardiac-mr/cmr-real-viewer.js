// Real cine CMR viewer: five ACDC short-axis cine cases with expert ED/ES contours, cine
// playback, slice stack, volumes and function, wall thickness and per-slice thickening.
import { CMR_CASES, CMR_LABEL, CMR_LABEL_STYLE, CMR_GROUP_NAME, CMR_THRESHOLDS, acdcCriteria, sliceSectors, loadCmrCase } from './cmr-real-data.js';
import './cmr-real-viewer.css';

const TEXT = {
  tr: {
    title: 'Gerçek sinema MR · kısa eksen yığını', loading: 'MR vakası yükleniyor…', error: 'MR vakası yüklenemedi',
    intro: 'ACDC veri setinden beş gerçek hasta: SSFP kısa eksen sinema, bazalden apekse kesit yığını. Konturlar uzman çizimidir ve yalnızca diyastol sonu (ED) ile sistol sonu (ES) karelerinde vardır; bütün ölçümler bu konturlardan hesaplanır.',
    play: 'Oynat', pause: 'Durdur', frame: 'Kare', slice: 'Kesit', speed: 'Hız', base: 'bazal', apex: 'apikal',
    overlay: 'Kontur', off: 'Kapalı', phase: 'ED/ES karelerinde', ghost: 'ED sınırı her karede',
    contrast: 'Kontrast', brightness: 'Parlaklık', stack: 'Kesit yığını (seçili kare)',
    metrics: 'Ölçümler (uzman konturlarından)', criteria: 'ACDC grup tanımları', group: 'ACDC grubu',
    ring: 'Bu kesitte bölgesel kalınlaşma (ED → ES)', ringNone: 'Bu kesitte miyokard halkası kapalı değil; bölgesel ölçüm yok.',
    ringKey: 'yeşil ≥ %30 · sarı %10–30 · kırmızı < %10 · S: septum (RV tarafı)',
    met: 'karşılıyor', partial: 'EF koşulu karşılanıyor; bölgesel kısım görsel', notMet: 'karşılamıyor',
    lookAt: 'Neye bakmalı', onlyEdEs: 'Uzman konturu yalnızca ED ve ES karelerinde var.',
    note: 'Hacimler disk toplamı (Simpson) yöntemiyle, BSA Mosteller formülüyle; kütle = miyokard hacmi × 1.05 g/mL (papiller kaslar boşluğa dahil). ACDC kayıtlarında cinsiyet yok, bu yüzden cinsiyete özgü normal aralık verilmez. Eski MI ile DKMP ayrımı hacimle değil, bölgesel patern ve LGE ile yapılır.',
    source: 'Kaynak', bsa: 'BSA', maxWall: 'En kalın ED duvarı', segOver: 'segment > 15 mm', ef: 'EF'
  },
  en: {
    title: 'Real cine MR · short-axis stack', loading: 'Loading MR case…', error: 'Could not load the MR case',
    intro: 'Five real patients from the ACDC dataset: SSFP short-axis cine, slice stack from base to apex. Contours are expert-drawn and exist only on the end-diastolic (ED) and end-systolic (ES) frames; every measurement is computed from them.',
    play: 'Play', pause: 'Pause', frame: 'Frame', slice: 'Slice', speed: 'Speed', base: 'basal', apex: 'apical',
    overlay: 'Contours', off: 'Off', phase: 'On ED/ES frames', ghost: 'ED border on every frame',
    contrast: 'Contrast', brightness: 'Brightness', stack: 'Slice stack (current frame)',
    metrics: 'Measurements (from expert contours)', criteria: 'ACDC group definitions', group: 'ACDC group',
    ring: 'Regional thickening on this slice (ED → ES)', ringNone: 'The myocardial ring is not closed on this slice; no regional measurement.',
    ringKey: 'green ≥ 30% · amber 10–30% · red < 10% · S: septum (RV side)',
    met: 'met', partial: 'EF condition met; the regional part is visual', notMet: 'not met',
    lookAt: 'What to look at', onlyEdEs: 'Expert contours exist only on the ED and ES frames.',
    note: 'Volumes by summation of discs (Simpson), BSA by Mosteller; mass = myocardial volume × 1.05 g/mL (papillary muscles counted as cavity). ACDC records carry no sex, so no sex-specific normal range is given. Prior MI and DCM are told apart by the regional pattern and LGE, not by volume.',
    source: 'Source', bsa: 'BSA', maxWall: 'Thickest ED wall', segOver: 'segments > 15 mm', ef: 'EF'
  }
};

const SPEEDS = [0.25, 0.5, 1];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '-');

/** Create the viewer in `mount`. */
export function createCmrRealViewer({ mount, getLang, baseUrl }) {
  const base = baseUrl || `${import.meta.env?.BASE_URL || '/'}cmr-data/`;
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cache = new Map();
  let state = { caseId: CMR_CASES[0].id, frame: 0, slice: 0, playing: !reduceMotion, speed: 1, overlay: 'phase', contrast: 1, brightness: 0 };
  let current = null, loadToken = 0, raf = 0, last = 0, acc = 0, visible = true, destroyed = false;
  const tile = document.createElement('canvas');
  let tileData = null;
  const t = () => TEXT[getLang()] || TEXT.tr;

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); schedule(); })
    : null;
  observer?.observe(mount);
  const onVisibility = () => schedule();
  document.addEventListener('visibilitychange', onVisibility);

  function lut() {
    const out = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) out[i] = (i - 128) * state.contrast + 128 + state.brightness * 128;
    return out;
  }

  function shell() {
    const tx = t();
    const chips = CMR_CASES.map(c => `<button type="button" data-cmrv-case="${c.id}" aria-pressed="${c.id === state.caseId}">${esc(c.short[getLang()])}</button>`).join('');
    mount.innerHTML = `<section class="cmrv" aria-labelledby="cmrv-title">
      <div class="cmrv-head"><h2 id="cmrv-title">${tx.title}</h2><p>${tx.intro}</p></div>
      <div class="cmrv-chips cmrv-cases" role="group" aria-label="ACDC">${chips}</div>
      <div data-cmrv-body><p class="cmrv-loading">${tx.loading}</p></div>
      <p class="cmrv-source" data-cmrv-source></p>
    </section>`;
  }

  const overlayButtons = tx => ['off', 'phase', 'ghost'].map(id => `<button type="button" data-cmrv-overlay="${id}" aria-pressed="${state.overlay === id}">${tx[id]}</button>`).join('');
  const speedButtons = () => SPEEDS.map(s => `<button type="button" data-cmrv-speed="${s}" aria-pressed="${state.speed === s}">${s}×</button>`).join('');

  function body() {
    const tx = t(), lang = getLang();
    const { meta } = current;
    const info = CMR_CASES.find(c => c.id === state.caseId);
    const host = mount.querySelector('[data-cmrv-body]');
    const thumbs = Array.from({ length: meta.dims.slices }, (_, z) => `<button type="button" data-cmrv-slice="${z}" aria-label="${tx.slice} ${z + 1}"><canvas width="${meta.dims.cols}" height="${meta.dims.rows}"></canvas><span>${z + 1}</span></button>`).join('');
    host.innerHTML = `<div class="cmrv-grid">
      <div class="cmrv-main">
        <div class="cmrv-frame"><canvas data-cmrv-canvas width="512" height="512" tabindex="0" aria-label="${esc(info.name[lang])}"></canvas>
          <em class="cmrv-phase" data-cmrv-phase></em><em class="cmrv-pos" data-cmrv-pos></em></div>
        <div class="cmrv-controls">
          <button type="button" class="cmrv-play" data-cmrv-play></button>
          <label class="cmrv-range"><span>${tx.frame} <b data-cmrv-frame-label></b></span><input type="range" data-cmrv-frame min="0" max="${meta.dims.frames - 1}" step="1"></label>
          <button type="button" data-cmrv-jump="ed">ED</button><button type="button" data-cmrv-jump="es">ES</button>
        </div>
        <div class="cmrv-controls">
          <label class="cmrv-range"><span>${tx.slice} <b data-cmrv-slice-label></b></span><input type="range" data-cmrv-slice-range min="0" max="${meta.dims.slices - 1}" step="1"></label>
          <div class="cmrv-chips" role="group" aria-label="${tx.speed}"><span>${tx.speed}</span>${speedButtons()}</div>
        </div>
        <div class="cmrv-controls">
          <div class="cmrv-chips" role="group" aria-label="${tx.overlay}"><span>${tx.overlay}</span>${overlayButtons(tx)}</div>
        </div>
        <div class="cmrv-controls">
          <label class="cmrv-range"><span>${tx.contrast}</span><input type="range" data-cmrv-contrast min="0.5" max="2.5" step="0.05" value="${state.contrast}"></label>
          <label class="cmrv-range"><span>${tx.brightness}</span><input type="range" data-cmrv-brightness min="-0.6" max="0.6" step="0.02" value="${state.brightness}"></label>
        </div>
        <p class="cmrv-hint" data-cmrv-hint>${tx.onlyEdEs}</p>
        <p class="cmrv-kicker">${tx.stack}</p>
        <div class="cmrv-stack" data-cmrv-stack><span class="cmrv-end">${tx.base}</span>${thumbs}<span class="cmrv-end">${tx.apex}</span></div>
      </div>
      <aside class="cmrv-side">
        <p class="cmrv-group"><span>${tx.group}</span><b data-cmrv-group>${esc(CMR_GROUP_NAME[meta.group][lang])}</b></p>
        <h3>${tx.metrics}</h3>${metricsTable()}
        <h3>${tx.criteria}</h3>${criteriaList()}
        <h3>${tx.ring}</h3><div data-cmrv-ring></div><p class="cmrv-note">${tx.ringKey}</p>
        <h3>${tx.lookAt}</h3><ul class="cmrv-points">${info.points[lang].map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <p class="cmrv-note">${tx.note}</p>
      </aside>
    </div>`;
    const src = meta.source;
    mount.querySelector('[data-cmrv-source]').innerHTML = `${tx.source}: ${esc(src.dataset)} · ${esc(src.id || meta.id)} · ${esc(src.license)} (${esc(src.terms)}) · ${esc(src.citation)} · <a href="${src.url}" target="_blank" rel="noopener noreferrer">ACDC ↗</a> · ${esc(src.changes)}`;
    bind(host);
    syncControls();
    paint();
  }

  function metricsTable() {
    const tx = t(), m = current.metrics;
    const row = (k, a, b) => `<tr><th>${k}</th><td>${a}</td><td>${b}</td></tr>`;
    return `<table class="cmrv-table" data-cmrv-metrics><thead><tr><th></th><th>mL · g · %</th><th>/ m²</th></tr></thead><tbody>
      ${row('LVEDV', fmt(m.lv.edv), fmt(m.lv.edvi))}${row('LVESV', fmt(m.lv.esv), fmt(m.lv.esvi))}${row('LVSV', fmt(m.lv.sv), fmt(m.lv.sv / m.bsa))}
      ${row(`LV ${tx.ef}`, `<b data-cmrv-lvef>${fmt(m.lv.ef)}</b>`, '')}${row('LV mass', fmt(m.lv.mass), fmt(m.lv.massi))}
      ${row('RVEDV', fmt(m.rv.edv), fmt(m.rv.edvi))}${row('RVESV', fmt(m.rv.esv), fmt(m.rv.esv / m.bsa))}${row(`RV ${tx.ef}`, `<b data-cmrv-rvef>${fmt(m.rv.ef)}</b>`, '')}
      ${row(tx.maxWall, `${fmt(m.wall.maxMm, 1)} mm`, `${m.wall.segmentsOver15} ${tx.segOver}`)}${row(tx.bsa, `${fmt(m.bsa, 2)} m²`, `${current.meta.heightCm} cm · ${current.meta.weightKg} kg`)}
    </tbody></table>`;
  }

  function criteriaList() {
    const tx = t(), lang = getLang();
    return `<ul class="cmrv-criteria" data-cmrv-criteria>${acdcCriteria(current.metrics).map(c => {
      const cls = c.met === true ? 'is-met' : c.met === 'partial' ? 'is-partial' : '';
      const word = c.met === true ? tx.met : c.met === 'partial' ? tx.partial : tx.notMet;
      return `<li class="${cls}" data-group="${c.group}" data-met="${c.met}"><b>${esc(CMR_GROUP_NAME[c.group][lang])}</b><span>${esc(c.text[lang])}</span><em>${esc(word)}</em></li>`;
    }).join('')}</ul>`;
  }

  function ringSvg() {
    const tx = t(), m = current.metrics;
    const sectors = m.bySlice[state.slice] || sliceSectors(current.labels, current.meta.dims, current.meta.spacingMm, state.slice, m.septum);
    if (!sectors) return `<p class="cmrv-note" data-cmrv-ring-empty>${tx.ringNone}</p>`;
    const n = CMR_THRESHOLDS.sectors, R = 70, r0 = 38, cx = 90, cy = 90;
    const pt = (a, rad) => `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
    const color = p => (!Number.isFinite(p) ? '#475569' : p >= CMR_THRESHOLDS.thickeningReduced ? '#22c55e' : p >= CMR_THRESHOLDS.thickeningAbsent ? '#f59e0b' : '#ef4444');
    const paths = sectors.map(s => {
      const a0 = m.septum + ((s.sector - 0.5) * 2 * Math.PI) / n, a1 = a0 + (2 * Math.PI) / n, am = (a0 + a1) / 2;
      const d = `M ${pt(a0, R)} A ${R} ${R} 0 0 1 ${pt(a1, R)} L ${pt(a1, r0)} A ${r0} ${r0} 0 0 0 ${pt(a0, r0)} Z`;
      const [lx, ly] = pt(am, (R + r0) / 2).split(' ');
      return `<path d="${d}" fill="${color(s.thickeningPct)}" fill-opacity="0.85" stroke="#0b1220" stroke-width="2"/><text x="${lx}" y="${ly}" text-anchor="middle"><tspan x="${lx}" dy="-2">${fmt(s.edMm)}mm</tspan><tspan x="${lx}" dy="11">${fmt(s.thickeningPct)}%</tspan></text>`;
    }).join('');
    const [sx, sy] = pt(m.septum, R + 12).split(' ');
    return `<svg class="cmrv-ring" viewBox="0 0 180 180" role="img" aria-label="${tx.ring}" data-cmrv-ring-slice="${state.slice}">${paths}<text class="cmrv-ring-s" x="${sx}" y="${sy}" text-anchor="middle" dominant-baseline="middle">S</text></svg>`;
  }

  function bind(host) {
    host.querySelector('[data-cmrv-frame]').addEventListener('input', e => set({ frame: +e.target.value, playing: false }));
    host.querySelector('[data-cmrv-slice-range]').addEventListener('input', e => set({ slice: +e.target.value }));
    host.querySelector('[data-cmrv-contrast]').addEventListener('input', e => set({ contrast: +e.target.value }));
    host.querySelector('[data-cmrv-brightness]').addEventListener('input', e => set({ brightness: +e.target.value }));
    const canvas = host.querySelector('[data-cmrv-canvas]');
    canvas.addEventListener('wheel', e => { e.preventDefault(); stepSlice(Math.sign(e.deltaY)); }, { passive: false });
    canvas.addEventListener('keydown', e => {
      const keys = { ArrowLeft: () => stepFrame(-1), ArrowRight: () => stepFrame(1), ArrowUp: () => stepSlice(-1), ArrowDown: () => stepSlice(1), ' ': () => set({ playing: !state.playing }) };
      if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
    });
  }

  function onClick(e) {
    const b = e.target.closest('button');
    if (!b || !mount.contains(b)) return;
    const d = b.dataset;
    if (d.cmrvCase && d.cmrvCase !== state.caseId) selectCase(d.cmrvCase);
    else if (d.cmrvOverlay) set({ overlay: d.cmrvOverlay });
    else if (d.cmrvSpeed) set({ speed: +d.cmrvSpeed });
    else if (d.cmrvSlice) set({ slice: +d.cmrvSlice });
    else if (d.cmrvJump) set({ frame: d.cmrvJump === 'ed' ? current.meta.edFrame : current.meta.esFrame, playing: false });
    else if ('cmrvPlay' in d) set({ playing: !state.playing });
  }
  mount.addEventListener('click', onClick);

  function stepFrame(k) { if (current) set({ frame: (state.frame + k + current.meta.dims.frames) % current.meta.dims.frames, playing: false }); }
  function stepSlice(k) { if (current) set({ slice: Math.min(current.meta.dims.slices - 1, Math.max(0, state.slice + k)) }); }

  function set(patch) {
    const ringChanged = 'slice' in patch && patch.slice !== state.slice;
    state = { ...state, ...patch };
    if (!current) return;
    if (ringChanged) mount.querySelector('[data-cmrv-ring]').innerHTML = ringSvg();
    syncControls();
    paint();
    schedule();
  }

  function syncControls() {
    const q = s => mount.querySelector(s);
    const { meta } = current, tx = t();
    q('[data-cmrv-frame]').value = state.frame;
    q('[data-cmrv-slice-range]').value = state.slice;
    q('[data-cmrv-frame-label]').textContent = `${state.frame + 1}/${meta.dims.frames}`;
    q('[data-cmrv-slice-label]').textContent = `${state.slice + 1}/${meta.dims.slices}`;
    const play = q('[data-cmrv-play]');
    play.textContent = state.playing ? `❚❚ ${tx.pause}` : `▶ ${tx.play}`;
    play.setAttribute('aria-pressed', String(state.playing));
    mount.querySelectorAll('[data-cmrv-overlay]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cmrvOverlay === state.overlay)));
    mount.querySelectorAll('[data-cmrv-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cmrvSpeed === state.speed)));
    mount.querySelectorAll('[data-cmrv-slice]').forEach(b => b.classList.toggle('is-current', +b.dataset.cmrvSlice === state.slice));
    if (!q('[data-cmrv-ring] svg, [data-cmrv-ring] p')) q('[data-cmrv-ring]').innerHTML = ringSvg();
  }

  /** Greyscale tile of (frame, slice) through the window LUT into `ctx` at its canvas size. */
  function drawTile(ctx, frame, slice, table) {
    const { rows, cols, slices } = current.meta.dims;
    if (tile.width !== cols || tile.height !== rows) { tile.width = cols; tile.height = rows; tileData = null; }
    const tctx = tile.getContext('2d');
    tileData ||= tctx.createImageData(cols, rows);
    const px = tileData.data, off = (frame * slices + slice) * rows * cols;
    for (let i = 0; i < rows * cols; i++) {
      const g = table[current.cine[off + i]];
      px[4 * i] = px[4 * i + 1] = px[4 * i + 2] = g; px[4 * i + 3] = 255;
    }
    tctx.putImageData(tileData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tile, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /** Label boundaries of one phase/slice as pixel-edge paths, optionally filled. */
  function drawLabels(ctx, phase, slice, { fill, dashed }) {
    const { rows, cols, slices } = current.meta.dims;
    const base = (phase * slices + slice) * rows * cols, L = current.labels;
    const sx = ctx.canvas.width / cols, sy = ctx.canvas.height / rows;
    for (const id of [CMR_LABEL.rv, CMR_LABEL.myo, CMR_LABEL.lv]) {
      const [r, g, b] = CMR_LABEL_STYLE[id].color;
      const edges = new Path2D(), area = new Path2D();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (L[base + y * cols + x] !== id) continue;
        if (fill) area.rect(x * sx, y * sy, sx, sy);
        if (x === 0 || L[base + y * cols + x - 1] !== id) { edges.moveTo(x * sx, y * sy); edges.lineTo(x * sx, (y + 1) * sy); }
        if (x === cols - 1 || L[base + y * cols + x + 1] !== id) { edges.moveTo((x + 1) * sx, y * sy); edges.lineTo((x + 1) * sx, (y + 1) * sy); }
        if (y === 0 || L[base + (y - 1) * cols + x] !== id) { edges.moveTo(x * sx, y * sy); edges.lineTo((x + 1) * sx, y * sy); }
        if (y === rows - 1 || L[base + (y + 1) * cols + x] !== id) { edges.moveTo(x * sx, (y + 1) * sy); edges.lineTo((x + 1) * sx, (y + 1) * sy); }
      }
      if (fill) { ctx.fillStyle = `rgba(${r},${g},${b},0.22)`; ctx.fill(area); }
      ctx.strokeStyle = `rgba(${r},${g},${b},${dashed ? 0.75 : 0.95})`;
      ctx.lineWidth = dashed ? 1.2 : 1.6;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.stroke(edges);
    }
    ctx.setLineDash([]);
  }

  function paint() {
    if (!current) return;
    const { meta } = current, tx = t();
    const canvas = mount.querySelector('[data-cmrv-canvas]');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const table = lut();
    drawTile(ctx, state.frame, state.slice, table);
    const phase = state.frame === meta.edFrame ? 0 : state.frame === meta.esFrame ? 1 : -1;
    if (state.overlay !== 'off' && phase >= 0) drawLabels(ctx, phase, state.slice, { fill: true, dashed: false });
    else if (state.overlay === 'ghost') drawLabels(ctx, 0, state.slice, { fill: false, dashed: true });
    mount.querySelector('[data-cmrv-phase]').textContent = phase === 0 ? 'ED' : phase === 1 ? 'ES' : '';
    mount.querySelector('[data-cmrv-pos]').textContent = `${tx.slice} ${state.slice + 1}/${meta.dims.slices} · ${tx.frame} ${state.frame + 1}/${meta.dims.frames}`;
    mount.querySelectorAll('[data-cmrv-slice] canvas').forEach((c, z) => {
      const cctx = c.getContext('2d');
      drawTile(cctx, state.frame, z, table);
    });
  }

  function schedule() {
    const run = current && state.playing && visible && !document.hidden && !destroyed;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  // One cardiac cycle per second at 1x (the frames span about one RR interval).
  function tick(now) {
    raf = 0;
    if (!current || !state.playing) return;
    if (last) acc += ((now - last) / 1000) * current.meta.dims.frames * state.speed;
    last = now;
    if (acc >= 1) {
      const k = Math.floor(acc); acc -= k;
      state = { ...state, frame: (state.frame + k) % current.meta.dims.frames };
      syncControls();
      paint();
    }
    raf = requestAnimationFrame(tick);
  }

  async function selectCase(id) {
    const token = ++loadToken;
    state = { ...state, caseId: id };
    mount.querySelectorAll('[data-cmrv-case]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cmrvCase === id)));
    const host = mount.querySelector('[data-cmrv-body]');
    if (!cache.has(id)) host.innerHTML = `<p class="cmrv-loading">${t().loading}</p>`;
    try {
      if (!cache.has(id)) cache.set(id, loadCmrCase(base, id));
      const data = await cache.get(id);
      if (token !== loadToken || destroyed) return;
      current = data;
      const mid = Math.floor(data.meta.dims.slices / 2);
      state = { ...state, frame: data.meta.edFrame, slice: mid };
      body();
      schedule();
    } catch (error) {
      cache.delete(id);
      if (token !== loadToken || destroyed) return;
      current = null;
      host.innerHTML = `<p class="cmrv-error">${t().error}: ${esc(error.message)}</p>`;
    }
  }

  function render() {
    shell();
    if (current && current.meta.id === state.caseId) body();
    else selectCase(state.caseId);
  }

  render();

  return {
    render,
    getState: () => ({ ...state, loaded: current?.meta.id || null }),
    getMetrics: () => current?.metrics || null,
    selectCase,
    set,
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      mount.removeEventListener('click', onClick);
    }
  };
}
