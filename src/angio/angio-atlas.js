import { createHeart } from '../heart.js';
import { rawStructures } from '../content.js';

export function createAngioAtlas({ mount, getLang, onAngles }) {
  const hosts = ['anatomy', 'fluoro'].map(kind => {
    const host = document.createElement('div');
    host.className = 'angio-atlas-viewport'; host.dataset.atlasViewport = kind;
    host.setAttribute('aria-label', kind === 'anatomy' ? '3D anatomy' : 'Fluoroscopy');
    mount.querySelector(`[data-atlas-slot=${kind}]`).append(host);
    return host;
  });
  let syncing = false, loaded = false, disposed = false;
  let alpha = 45, beta = -35, system = 'left', playing = true, opacity = .25;
  const layers = { veins: false, valves: false, conduction: false };
  // Thoracic landmarks (thorax.js): the spine and the diaphragm separately; the phrenic nerves stay off.
  const landmarks = { vertebrae: false, diaphragm: false };
  let contours = true;
  function applyLandmarks(h) {
    h.setLayer('thorax', landmarks.vertebrae || landmarks.diaphragm);
    h.setLayer('vertebrae', landmarks.vertebrae);
    h.setLayer('diaphragm', landmarks.diaphragm);
    h.setLayer('phrenic', false);
  }
  const selection = mount.querySelector('[data-atlas-selection]');
  const hearts = [];
  let appliedSystem = null, selectedId = null, contrast = 1, veinsOnly = false, segmentation = false;
  // Hover names: structure title, plus the named branch when the pointer is on one.
  const tips = hosts.map(host => {
    const tip = document.createElement('span');
    tip.className = 'angio-atlas-tip'; tip.hidden = true; tip.setAttribute('role', 'status');
    host.append(tip);
    host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); tip.style.left = `${e.clientX - r.left + 14}px`; tip.style.top = `${e.clientY - r.top + 14}px`; });
    host.addEventListener('pointerleave', () => { tip.hidden = true; });
    return tip;
  });
  function nameOf(id, branch) {
    const lang = getLang() === 'tr' ? 'tr' : 'en';
    const title = rawStructures[id]?.[lang]?.title || rawStructures[id]?.en?.title || id;
    return branch ? `${title} · ${branch[lang] || branch.en}` : title;
  }
  const hovered = index => (id, branch = null) => { const tip = tips[index]; if (!id) { tip.hidden = true; return; } tip.textContent = nameOf(id, branch); tip.hidden = false; };
  function selected(id) {
    selectedId = id;
    hearts.forEach(h => h.selectStructure(id, false));
    selection.textContent = `${getLang() === 'tr' ? 'Seçili yapı' : 'Selected structure'}: ${id}`;
  }
  let activeSource = -1;
  // Anatomy-only cameras (posterior, aortic root, mitral) have no C-arm equivalent, so while one is
  // shown the anatomy view stops driving the C-arm. A new C-arm projection replaces it; dragging the
  // posterior or mitral view hands control back to the C-arm.
  let anatomyView = null;
  const moved = index => angle => {
    if (index === 0 && anatomyView) return;
    if (syncing || !loaded || disposed || (angle.laoRao === alpha && angle.craCau === beta)) return;
    activeSource = index;
    try { onAngles(angle.laoRao, angle.craCau); }
    finally { activeSource = -1; }
  };
  try {
    hosts.forEach((host, i) => hearts.push(createHeart(host, selected, hovered(i), moved(i), { pixelRatioCap: 1.25, maxFps: 30 })));
  } catch (error) {
    hearts.forEach(h => h.dispose());
    mount.dataset.ready = 'error';
    selection.textContent = getLang() === 'tr' ? '3B görüntü başlatılamadı. WebGL desteğini kontrol edip yeniden yükleyin.' : '3D view unavailable. Check WebGL support and reload.';
    throw error;
  }
  const unsubscribe = hearts[0].subscribeCycle(cycle => {
    if (loaded && !disposed) hearts[1].seekCycle(cycle.phase);
  });
  function release() {
    if (!anatomyView) return false;
    if (anatomyView === 'root' && loaded) hearts[0].setRootWindow(false);
    anatomyView = null;
    return true;
  }
  function setAngles(a, b, fit = false) {
    const changed = a !== alpha || b !== beta;
    alpha = a; beta = b;
    if (!loaded) return;
    // A re-render with the same angles keeps an anatomy-only camera; a new projection replaces it.
    const keepAnatomy = Boolean(anatomyView) && !changed && !fit;
    const refit = !keepAnatomy && release();
    syncing = true;
    try {
      hearts.forEach((h, i) => {
        if (i === activeSource || (i === 0 && keepAnatomy)) return;
        h.setAngioProjection(a, b, false, !(fit || (i === 0 && refit)));
      });
    }
    finally { syncing = false; }
  }
  /** Anatomy-only camera: 'posterior', 'root' (aortic root window) or 'mitral'. */
  function setAnatomyView(name) {
    if (!loaded || !['posterior', 'root', 'mitral'].includes(name)) return false;
    if (anatomyView === 'root' && name !== 'root') hearts[0].setRootWindow(false);
    anatomyView = name;
    hearts[0].setView(name, true);
    return true;
  }
  hosts[0].addEventListener('pointerdown', e => { if (e.button === 0 && anatomyView && anatomyView !== 'root') release(); });
  function setSystem(value) {
    system = value;
    if (!loaded) return;
    // A graft shows over all native arteries; in fluoroscopy only the graft and its run-off fill.
    const graft = ['lima', 'svg-om', 'svg-pda'].includes(value) ? value : null;
    const nativeSystem = graft ? 'both' : value;
    // Veins only: coronary veins in both views (venous phase), arteries and grafts hidden.
    const key = veinsOnly ? 'veins' : value;
    if (appliedSystem !== key) {
      hearts.forEach(h => { h.clearSelection(); h.setCoronarySystem(veinsOnly ? 'veins' : nativeSystem); h.setGraft(veinsOnly ? null : graft); h.setVeinsVisible(veinsOnly || layers.veins); });
      selectedId = null;
      appliedSystem = key;
    }
    const note = mount.querySelector('[data-atlas-note]');
    note.textContent = graft
      ? (getLang() === 'tr' ? 'Greft yolu ve sternal teller şematik çizimdir; hedef damarlar atlastan alınır.' : 'The graft route and sternal wires are schematic; the target arteries come from the atlas.')
      : (getLang() === 'tr' ? 'İki görüntü aynı Cardia atlasından üretilir. Sürükle: açı · Kaydır: yakınlaştır · Tıkla: yapı seç.' : 'Both views use the same Cardia atlas. Drag: angle · Scroll: zoom · Click: select.');
    selection.textContent = selectedId ? `${getLang() === 'tr' ? 'Seçili yapı' : 'Selected structure'}: ${selectedId}` : '';
  }
  const ready = Promise.all(hearts.map(h => h.ready)).then(() => {
    if (disposed) return;
    loaded = true;
    hearts.forEach((h, i) => {
      h.setMode('angiography'); h.setFluoroscopy(i === 1); h.setOpacity(opacity);
      h.setLayer('flow', false); h.setLayer('icns', false);
      Object.entries(layers).forEach(([key, on]) => h.setLayer(key, on));
      applyLandmarks(h);
      h.setFluoroContours(contours);
    });
    setAngles(alpha, beta, true); setSystem(system);
    hearts[1].setCoronaryContrast(contrast);
    hearts[0].setSegmentation(segmentation);
    hearts[0].setBeating(playing);
    mount.dataset.ready = 'true';
  }).catch(() => {
    if (disposed) return;
    mount.dataset.ready = 'error';
    selection.textContent = getLang() === 'tr' ? 'Atlas yüklenemedi. Yeniden yükleyin.' : 'Atlas could not load. Reload to retry.';
  });
  return {
    element: mount, ready, setAngles, setSystem, setAnatomyView,
    getAnatomyView: () => anatomyView,
    /** Segmentation-style label colours on the anatomy view. */
    setSegmentation(on) { segmentation = Boolean(on); if (loaded) hearts[0].setSegmentation(segmentation); },
    /** Coronary veins only, in the 3D view and the fluoroscopy (venous phase). */
    setVeinsOnly(on) { veinsOnly = Boolean(on); setSystem(system); },
    getVeinsOnly: () => veinsOnly,
    setPlaying(on) { if (on === playing) return; playing = on; if (loaded) hearts[0].setBeating(on); },
    setOpacity(value) { opacity = value; if (loaded) hearts.forEach(h => h.setOpacity(value)); },
    setLayer(key, on) {
      if (key in landmarks) { landmarks[key] = on; if (loaded) hearts.forEach(applyLandmarks); return; }
      layers[key] = on; if (loaded) hearts.forEach(h => key === 'veins' ? h.setVeinsVisible(on || veinsOnly) : h.setLayer(key, on));
    },
    /** Chamber and vessel outlines over the fluoroscopy image. */
    setContours(on) { contours = Boolean(on); if (loaded) hearts[1].setFluoroContours(contours); },
    setContrast(value) { if (value === contrast) return; contrast = value; if (loaded) hearts[1].setCoronaryContrast(value); },
    getState: () => ({ anatomyView, anatomy: hearts[0].getState(), fluoro: hearts[1].getState(), cycle: hearts[0].getCycleState(), fluoroCycle: hearts[1].getCycleState() }),
    dispose() { disposed = true; unsubscribe(); hearts.forEach(h => h.dispose()); mount.remove(); }
  };
}
