import { CT_CASE_ID, CT_CASE_VIEWS, CT_LABELS, CT_LABEL_GROUPS, CT_REAL_WINDOWS, loadCtCase, windowTable } from './ct-volume-data.js';
import './ct-volume-viewer.css';

/*
 * Real chest CT viewer: axial, coronal and sagittal MPR of one TotalSegmentator case with
 * HU windowing, a thick-slab MIP for vessels, the 20-structure segmentation overlay, a HU
 * probe and per-structure volumes. Radiological display: patient right on screen left,
 * anterior up on the axial image.
 */

const w = (tr, en) => ({ tr, en });
const T = {
  title: w('Gerçek toraks BT · Segmentasyon', 'Real chest CT · Segmentation'),
  lead: w(
    'Kontrastlı TAVI planlama BT’si (1.5 mm izotropik). Kesite tıklayın ya da sürükleyin; fare tekerleği veya kaydırıcı kesit değiştirir. Maske, uzman düzeltmeli TotalSegmentator segmentasyonudur.',
    'Contrast-enhanced TAVI planning CT (1.5 mm isotropic). Click or drag on a slice; the wheel or slider changes the slice. Masks are the expert-refined TotalSegmentator segmentation.'
  ),
  loading: w('BT hacmi yükleniyor (yaklaşık 4 MB)…', 'Loading CT volume (about 4 MB)…'),
  failed: w('BT hacmi yüklenemedi', 'CT volume could not be loaded'),
  axial: w('Aksiyel', 'Axial'), coronal: w('Koronal', 'Coronal'), sagittal: w('Sagital', 'Sagittal'),
  window: w('Pencere', 'Window'), overlay: w('Segmentasyon', 'Segmentation'), opacity: w('Opaklık', 'Opacity'),
  slab: w('Kalın kesit MIP', 'Thick-slab MIP'), off: w('Kapalı', 'Off'),
  probe: w('İmleç', 'Cursor'), structure: w('Yapı', 'Structure'), none: w('Etiketsiz doku', 'Unlabelled tissue'),
  structures: w('Yapılar ve hacimler', 'Structures and volumes'),
  volNote: w('Hacimler tek kardiyak fazdan voksel sayımıyla hesaplanır (1 voksel = 3.375 mm³); EF için sistol ve diyastol fazı gerekir.', 'Volumes come from voxel counts in a single cardiac phase (1 voxel = 3.375 mm³); EF needs systolic and diastolic phases.'),
  hu: w('HU yaklaşık (saklama 3.9 HU adımlı)', 'HU approximate (stored in 3.9 HU steps)'),
  // DICOM patient-orientation letters in both languages (R/L, A/P, S/I).
  right: w('R', 'R'), left: w('L', 'L'), ant: w('A', 'A'), post: w('P', 'P'), sup: w('S', 'S'), inf: w('I', 'I'),
  source: w('Kaynak', 'Source'),
  views: w('Hızlı görünüm', 'Quick view'),
  showAll: w('Tümü', 'All'), hideAll: w('Hiçbiri', 'None')
};
const SLABS = [0, 5, 10, 20];
const VIEWS = ['axial', 'coronal', 'sagittal'];

const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function createCtVolumeViewer({ mount, getLang = () => 'tr', baseUrl }) {
  const base = baseUrl || `${import.meta.env?.BASE_URL || '/'}ct-data/${CT_CASE_ID}/`;
  const st = { windowId: 'cta', overlay: true, opacity: 0.4, slabMm: 0, hidden: new Set(['ribs', 'vertebrae', 'clavicles', 'scapulae']), cursor: null, selected: null };
  let data = null, error = null, keys = [], colors = [], grey = null, destroyed = false;
  const root = document.createElement('section');
  root.className = 'ctv';
  mount.append(root);
  const L = (o) => o[getLang() === 'en' ? 'en' : 'tr'];

  loadCtCase(base).then((d) => {
    if (destroyed) return;
    data = d;
    keys = d.meta.labels.map((l) => l.key);
    colors = [[0, 0, 0], ...keys.map((k) => hexRgb(CT_LABELS[k]?.color || '#ffffff'))];
    const { x, y, z } = d.meta.dims;
    const lv = d.stats[keys.indexOf('lv')]?.centroid;
    st.cursor = lv ? { ...lv } : { x: x >> 1, y: y >> 1, z: z >> 1 };
    render();
  }).catch((e) => { error = e; render(); });

  const labelAt = (x, y, z) => data.labels[(z * data.meta.dims.y + y) * data.meta.dims.x + x];
  const byteAt = (x, y, z) => data.volume[(z * data.meta.dims.y + y) * data.meta.dims.x + x];

  /** Slice size and voxel accessor for a view; slab MIP along the view normal. */
  function sliceSpec(view) {
    const { x: X, y: Y, z: Z } = data.meta.dims;
    const c = st.cursor;
    if (view === 'axial') return { w: X, h: Y, depth: Z, at: c.z, get: (i, j, k) => [i, j, k], cross: [c.x, c.y] };
    if (view === 'coronal') return { w: X, h: Z, depth: Y, at: c.y, get: (i, j, k) => [i, k, j], cross: [c.x, c.z] };
    return { w: Y, h: Z, depth: X, at: c.x, get: (i, j, k) => [k, i, j], cross: [c.y, c.z] };
  }

  function paint(view, canvas) {
    const s = sliceSpec(view);
    canvas.width = s.w; canvas.height = s.h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(s.w, s.h);
    const px = img.data;
    const half = Math.round(st.slabMm / data.meta.spacingMm.z / 2);
    const k0 = Math.max(0, s.at - half), k1 = Math.min(s.depth - 1, s.at + half);
    const hiddenIds = new Set([...st.hidden].map((k) => keys.indexOf(k) + 1));
    const sel = st.selected ? keys.indexOf(st.selected) + 1 : 0;
    const a = st.opacity;
    // Lungs and bone as outlines so parenchyma and cortex stay readable; chambers and vessels filled.
    const outlineIds = new Set(keys.map((k, idx) => (['lungs', 'bone'].includes(CT_LABELS[k]?.group) ? idx + 1 : 0)).filter(Boolean));
    const labelIn = (i, j) => {
      if (i < 0 || j < 0 || i >= s.w || j >= s.h) return 0;
      const [x, y, z] = s.get(i, j, s.at);
      return labelAt(x, y, z);
    };
    for (let j = 0; j < s.h; j++) {
      for (let i = 0; i < s.w; i++) {
        let b = 0;
        for (let k = k0; k <= k1; k++) {
          const [x, y, z] = s.get(i, j, k);
          const v = byteAt(x, y, z);
          if (v > b) b = v;
        }
        const g = grey[b];
        const p = 4 * (j * s.w + i);
        let r = g, gg = g, bb = g;
        if (st.overlay) {
          const [x, y, z] = s.get(i, j, s.at);
          const l = labelAt(x, y, z);
          const edge = l && outlineIds.has(l) && l !== sel
            && (labelIn(i - 1, j) !== l || labelIn(i + 1, j) !== l || labelIn(i, j - 1) !== l || labelIn(i, j + 1) !== l);
          if (l && !hiddenIds.has(l) && (!outlineIds.has(l) || edge || l === sel)) {
            const al = edge ? 0.9 : l === sel ? Math.min(0.85, a + 0.3) : a;
            const c = colors[l];
            r = g * (1 - al) + c[0] * al; gg = g * (1 - al) + c[1] * al; bb = g * (1 - al) + c[2] * al;
          }
        }
        px[p] = r; px[p + 1] = gg; px[p + 2] = bb; px[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(s.cross[0] + 0.5, 0); ctx.lineTo(s.cross[0] + 0.5, s.h);
    ctx.moveTo(0, s.cross[1] + 0.5); ctx.lineTo(s.w, s.cross[1] + 0.5);
    ctx.stroke();
  }

  function paintAll() {
    if (!data) return;
    const win = CT_REAL_WINDOWS.find((x) => x.id === st.windowId) || CT_REAL_WINDOWS[0];
    grey = windowTable(data.hu, win.width, win.level);
    for (const v of VIEWS) {
      const c = root.querySelector(`[data-ctv-canvas="${v}"]`);
      if (c) {
        try { paint(v, c); } catch (e) { c.replaceWith(Object.assign(document.createElement('p'), { className: 'ctv-error', textContent: String(e.message || e) })); }
      }
      const s = sliceSpec(v);
      const range = root.querySelector(`[data-ctv-slice="${v}"]`);
      if (range) { range.max = String(s.depth - 1); range.value = String(s.at); }
      const out = root.querySelector(`[data-ctv-pos="${v}"]`);
      if (out) out.textContent = `${s.at + 1} / ${s.depth}`;
    }
    paintProbe();
  }

  function paintProbe() {
    const box = root.querySelector('[data-ctv-probe]');
    if (!box || !st.cursor) return;
    const { x, y, z } = st.cursor;
    const l = labelAt(x, y, z);
    const hu = Math.round(data.hu[byteAt(x, y, z)]);
    const sp = data.meta.spacingMm;
    const key = l ? keys[l - 1] : null;
    box.innerHTML = `<b>${hu} HU</b><span>${key ? L(CT_LABELS[key].name) : L(T.none)}</span><small>x ${(x * sp.x).toFixed(0)} · y ${(y * sp.y).toFixed(0)} · z ${(z * sp.z).toFixed(0)} mm</small>`;
  }

  function setCursorFrom(view, canvas, ev) {
    const r = canvas.getBoundingClientRect();
    const s = sliceSpec(view);
    const i = Math.max(0, Math.min(s.w - 1, Math.floor(((ev.clientX - r.left) / r.width) * s.w)));
    const j = Math.max(0, Math.min(s.h - 1, Math.floor(((ev.clientY - r.top) / r.height) * s.h)));
    const [x, y, z] = s.get(i, j, s.at);
    st.cursor = { x, y, z };
    paintAll();
  }

  function moveSlice(view, value) {
    const s = sliceSpec(view);
    const v = Math.max(0, Math.min(s.depth - 1, value));
    if (view === 'axial') st.cursor.z = v; else if (view === 'coronal') st.cursor.y = v; else st.cursor.x = v;
    paintAll();
  }

  function structureList() {
    return CT_LABEL_GROUPS.map((g) => {
      const items = keys.map((k, idx) => ({ k, s: data.stats[idx] })).filter(({ k, s }) => CT_LABELS[k]?.group === g.id && s.voxels > 0);
      if (!items.length) return '';
      return `<div class="ctv-group"><p>${L(g.name)}</p>${items.map(({ k, s }) => `
        <label class="ctv-struct ${st.selected === k ? 'is-selected' : ''}">
          <input type="checkbox" data-ctv-show="${k}" ${st.hidden.has(k) ? '' : 'checked'}>
          <i style="background:${CT_LABELS[k].color}"></i>
          <button type="button" data-ctv-jump="${k}">${L(CT_LABELS[k].name)}</button>
          <span>${s.volumeMl >= 10 ? Math.round(s.volumeMl) : s.volumeMl.toFixed(1)} mL</span>
        </label>`).join('')}</div>`;
    }).join('');
  }

  function render() {
    if (destroyed) return;
    if (error) { root.innerHTML = `<p class="ctv-error">${L(T.failed)}: ${String(error.message || error)}</p>`; return; }
    if (!data) { root.innerHTML = `<p class="ctv-loading">${L(T.loading)}</p>`; return; }
    const src = data.meta.source;
    // Edge letters: top, bottom, screen left, screen right (radiological: patient right on screen left).
    const orient = {
      axial: [L(T.ant), L(T.post), L(T.right), L(T.left)],
      coronal: [L(T.sup), L(T.inf), L(T.right), L(T.left)],
      sagittal: [L(T.sup), L(T.inf), L(T.ant), L(T.post)]
    };
    const { x: X, y: Y, z: Z } = data.meta.dims;
    const ratio = { axial: `${X} / ${Y}`, coronal: `${X} / ${Z}`, sagittal: `${Y} / ${Z}` };
    root.innerHTML = `
      <header class="ctv-head"><h3>${L(T.title)}</h3><p>${L(T.lead)}</p></header>
      <div class="ctv-chips ctv-views" role="group" aria-label="${L(T.views)}"><span>${L(T.views)}</span>${CT_CASE_VIEWS.map((v) => `<button type="button" data-ctv-view="${v.id}">${L(v.name)}</button>`).join('')}</div>
      <div class="ctv-tools">
        <div class="ctv-chips" role="group" aria-label="${L(T.window)}">${CT_REAL_WINDOWS.map((win) => `<button type="button" class="${win.id === st.windowId ? 'active' : ''}" data-ctv-window="${win.id}">${L(win.label)}</button>`).join('')}</div>
        <div class="ctv-chips" role="group" aria-label="${L(T.slab)}"><span>${L(T.slab)}</span>${SLABS.map((mm) => `<button type="button" class="${mm === st.slabMm ? 'active' : ''}" data-ctv-slab="${mm}">${mm ? `${mm} mm` : L(T.off)}</button>`).join('')}</div>
        <label class="ctv-toggle"><input type="checkbox" data-ctv-overlay ${st.overlay ? 'checked' : ''}> ${L(T.overlay)}</label>
        <label class="ctv-toggle">${L(T.opacity)} <input type="range" min="0.1" max="0.8" step="0.05" value="${st.opacity}" data-ctv-opacity></label>
      </div>
      <div class="ctv-grid">
        ${VIEWS.map((v) => `
          <figure class="ctv-pane ctv-pane--${v}">
            <figcaption><b>${L(T[v])}</b><span data-ctv-pos="${v}"></span></figcaption>
            <div class="ctv-frame" style="aspect-ratio:${ratio[v]}">
              <canvas data-ctv-canvas="${v}" aria-label="${L(T[v])}"></canvas>
              <em class="o-t">${orient[v][0]}</em><em class="o-b">${orient[v][1]}</em><em class="o-l">${orient[v][2]}</em><em class="o-r">${orient[v][3]}</em>
            </div>
            <input type="range" min="0" step="1" data-ctv-slice="${v}" aria-label="${L(T[v])}">
          </figure>`).join('')}
        <aside class="ctv-side">
          <div class="ctv-probe" data-ctv-probe aria-live="polite"></div>
          <small class="ctv-note">${L(T.hu)}</small>
          <div class="ctv-structs-head"><b>${L(T.structures)}</b>
            <span><button type="button" data-ctv-all="1">${L(T.showAll)}</button><button type="button" data-ctv-all="0">${L(T.hideAll)}</button></span></div>
          <div class="ctv-structs">${structureList()}</div>
          <small class="ctv-note">${L(T.volNote)}</small>
        </aside>
      </div>
      <p class="ctv-source">${L(T.source)}: ${src.dataset}, ${src.license}, ${data.meta.case}. ${src.citation}</p>`;
    bind();
    paintAll();
  }

  function bind() {
    root.querySelectorAll('[data-ctv-window]').forEach((b) => b.addEventListener('click', () => { st.windowId = b.dataset.ctvWindow; render(); }));
    root.querySelectorAll('[data-ctv-view]').forEach((b) => b.addEventListener('click', () => {
      const v = CT_CASE_VIEWS.find((x) => x.id === b.dataset.ctvView);
      const { x: X, y: Y, z: Z } = data.meta.dims;
      st.cursor = { x: Math.min(X - 1, v.cursor.x), y: Math.min(Y - 1, v.cursor.y), z: Math.min(Z - 1, v.cursor.z) };
      st.windowId = v.windowId;
      st.slabMm = v.slabMm;
      st.overlay = v.overlay;
      render();
    }));
    root.querySelectorAll('[data-ctv-slab]').forEach((b) => b.addEventListener('click', () => { st.slabMm = Number(b.dataset.ctvSlab); render(); }));
    root.querySelector('[data-ctv-overlay]')?.addEventListener('change', (e) => { st.overlay = e.target.checked; paintAll(); });
    root.querySelector('[data-ctv-opacity]')?.addEventListener('input', (e) => { st.opacity = Number(e.target.value); paintAll(); });
    root.querySelectorAll('[data-ctv-show]').forEach((c) => c.addEventListener('change', () => {
      if (c.checked) st.hidden.delete(c.dataset.ctvShow); else st.hidden.add(c.dataset.ctvShow);
      paintAll();
    }));
    root.querySelectorAll('[data-ctv-all]').forEach((b) => b.addEventListener('click', () => {
      st.hidden = b.dataset.ctvAll === '1' ? new Set() : new Set(keys);
      render();
    }));
    root.querySelectorAll('[data-ctv-jump]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const k = b.dataset.ctvJump;
      const c = data.stats[keys.indexOf(k)]?.centroid;
      st.selected = st.selected === k ? null : k;
      st.hidden.delete(k);
      if (c && st.selected) st.cursor = { ...c };
      render();
    }));
    for (const v of VIEWS) {
      const canvas = root.querySelector(`[data-ctv-canvas="${v}"]`);
      let dragging = false;
      canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); setCursorFrom(v, canvas, e); });
      canvas.addEventListener('pointermove', (e) => { if (dragging) setCursorFrom(v, canvas, e); });
      canvas.addEventListener('pointerup', () => { dragging = false; });
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        moveSlice(v, sliceSpec(v).at + (e.deltaY > 0 ? 1 : -1));
      }, { passive: false });
      root.querySelector(`[data-ctv-slice="${v}"]`).addEventListener('input', (e) => moveSlice(v, Number(e.target.value)));
    }
  }

  render();
  return {
    render,
    getState: () => ({ ...st, hidden: [...st.hidden], loaded: Boolean(data), error: error ? String(error.message || error) : null }),
    probe: () => (data && st.cursor ? { hu: Math.round(data.hu[byteAt(st.cursor.x, st.cursor.y, st.cursor.z)]), label: keys[labelAt(st.cursor.x, st.cursor.y, st.cursor.z) - 1] || null, cursor: { ...st.cursor } } : null),
    setCursor(c) { if (data) { st.cursor = { ...st.cursor, ...c }; paintAll(); } },
    destroy() { destroyed = true; root.remove(); }
  };
}
