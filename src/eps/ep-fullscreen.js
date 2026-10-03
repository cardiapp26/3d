/*
 * Full-screen signal view (report section 15, "mobil tam ekran sinyal").
 * Opens the current recording over the whole viewport with the same view
 * state as the panel (visible channels, time zoom and pan, inspection
 * cursor, calipers): the panel owns the state, this overlay only reads and
 * changes it. Zoom buttons, a pan slider and horizontal swipe move the time
 * window; Escape or the close button return focus to the opener.
 */

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, getView: () => object, setView: (patch: object) => void,
 *   draw: (canvas: HTMLCanvasElement) => void, describe: () => string }} deps
 */
export function createEpFullscreen(doc, { getLang, getView, setView, draw, describe }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const root = el('div', 'ep-fullscreen', { role: 'dialog', 'aria-modal': 'true', 'data-ep-fullscreen': '' });
  root.hidden = true;
  const bar = el('div', 'ep-fs-bar');
  const title = el('span', 'ep-fs-title');
  const zoomOut = el('button', '', { type: 'button', 'data-ep-fs': 'zoom-out' });
  const zoomIn = el('button', '', { type: 'button', 'data-ep-fs': 'zoom-in' });
  const pan = el('input', 'ep-fs-pan', { type: 'range', min: '0', max: '1000', step: '1', 'data-ep-fs': 'pan' });
  const close = el('button', 'ep-fs-close', { type: 'button', 'data-ep-fs': 'close' });
  bar.append(title, zoomOut, zoomIn, pan, close);
  const canvas = el('canvas', 'ep-fs-canvas', { role: 'img' });
  const info = el('p', 'ep-fs-info', { 'aria-live': 'polite' });
  root.append(bar, canvas, info);
  (doc.body || doc.documentElement).append(root);
  let opener = null;

  const ZOOMS = [1, 2, 4];
  const step = (dir) => {
    const view = getView();
    const i = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(view.zoom) + dir));
    setView({ zoom: ZOOMS[i] });
    render();
  };
  zoomIn.addEventListener('click', () => step(1));
  zoomOut.addEventListener('click', () => step(-1));
  pan.addEventListener('input', () => { setView({ pan: Number(pan.value) / 1000 }); render(); });
  close.addEventListener('click', () => api.close());
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); api.close(); }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      setView({ pan: Math.max(0, Math.min(1, getView().pan + (event.key === 'ArrowRight' ? 0.1 : -0.1))) });
      render();
    }
  });
  // Horizontal swipe pans the time window (touch and pen).
  let dragX = null;
  canvas.addEventListener('pointerdown', (event) => { dragX = event.clientX; canvas.setPointerCapture?.(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => {
    if (dragX == null || getView().zoom <= 1) return;
    const dx = event.clientX - dragX;
    if (Math.abs(dx) < 8) return;
    dragX = event.clientX;
    setView({ pan: Math.max(0, Math.min(1, getView().pan - dx / Math.max(1, canvas.clientWidth))) });
    render();
  });
  canvas.addEventListener('pointerup', () => { dragX = null; });
  const onResize = () => { if (!root.hidden) render(); };
  globalThis.addEventListener?.('resize', onResize);

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const view = getView();
    title.textContent = describe();
    zoomOut.textContent = '−';
    zoomIn.textContent = '+';
    zoomOut.setAttribute('aria-label', lang === 'en' ? 'Zoom out' : 'Uzaklaştır');
    zoomIn.setAttribute('aria-label', lang === 'en' ? 'Zoom in' : 'Yakınlaştır');
    pan.setAttribute('aria-label', lang === 'en' ? 'Move in time' : 'Zamanda kaydır');
    pan.disabled = view.zoom <= 1;
    pan.value = String(Math.round(view.pan * 1000));
    close.textContent = lang === 'en' ? 'Close' : 'Kapat';
    info.textContent = `${lang === 'en' ? 'Zoom' : 'Yakınlaştırma'} ${view.zoom}× · ${lang === 'en' ? 'swipe or use the slider to move in time' : 'zamanda kaydırmak için kaydırın veya sürgüyü kullanın'}`;
    draw(canvas);
  }

  const api = {
    element: root,
    isOpen: () => !root.hidden,
    open(from) {
      opener = from || null;
      root.hidden = false;
      doc.documentElement.dataset.epFullscreen = 'true';
      render();
      close.focus?.();
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      delete doc.documentElement.dataset.epFullscreen;
      opener?.focus?.();
    },
    render
  };
  return api;
}
