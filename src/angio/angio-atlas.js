import { createHeart } from '../heart.js';

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
  const layers = { veins: false, valves: false, conduction: false, thorax: false };
  const selection = mount.querySelector('[data-atlas-selection]');
  const hearts = [];
  let appliedSystem = null, selectedId = null, contrast = 1;
  function selected(id) {
    selectedId = id;
    hearts.forEach(h => h.selectStructure(id, false));
    selection.textContent = `${getLang() === 'tr' ? 'Seçili yapı' : 'Selected structure'}: ${id}`;
  }
  function moved(angle) {
    if (syncing || !loaded || disposed || (angle.laoRao === alpha && angle.craCau === beta)) return;
    onAngles(angle.laoRao, angle.craCau);
  }
  try {
    hosts.forEach(host => hearts.push(createHeart(host, selected, () => {}, moved, { pixelRatioCap: 1.25, maxFps: 30 })));
  } catch (error) {
    hearts.forEach(h => h.dispose());
    mount.dataset.ready = 'error';
    selection.textContent = getLang() === 'tr' ? '3B görüntü başlatılamadı. WebGL desteğini kontrol edip yeniden yükleyin.' : '3D view unavailable. Check WebGL support and reload.';
    throw error;
  }
  const unsubscribe = hearts[0].subscribeCycle(cycle => {
    if (loaded && !disposed) hearts[1].seekCycle(cycle.phase);
  });
  function setAngles(a, b, fit = false) {
    alpha = a; beta = b;
    if (!loaded) return;
    syncing = true;
    try { hearts.forEach(h => h.setAngioProjection(a, b, false, !fit)); }
    finally { syncing = false; }
  }
  function setSystem(value) {
    system = value;
    if (!loaded) return;
    const nativeSystem = value === 'svg-pda' ? 'right' : ['lima', 'svg-om'].includes(value) ? 'left' : value;
    if (appliedSystem !== value) {
      hearts.forEach(h => { h.clearSelection(); h.setCoronarySystem(nativeSystem); });
      selectedId = null;
      appliedSystem = value;
    }
    const graft = !['left', 'right'].includes(value);
    const note = mount.querySelector('[data-atlas-note]');
    note.textContent = graft
      ? (getLang() === 'tr' ? 'Atlas doğal koronerleri gösterir. Greft yolları aşağıdaki şematik alıştırmadadır.' : 'Atlas shows native coronaries. Graft paths appear in the schematic exercise below.')
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
    });
    setAngles(alpha, beta, true); setSystem(system);
    hearts[1].setCoronaryContrast(contrast);
    hearts[0].setBeating(playing);
    mount.dataset.ready = 'true';
  }).catch(() => {
    if (disposed) return;
    mount.dataset.ready = 'error';
    selection.textContent = getLang() === 'tr' ? 'Atlas yüklenemedi. Yeniden yükleyin.' : 'Atlas could not load. Reload to retry.';
  });
  return {
    element: mount, ready, setAngles, setSystem,
    setPlaying(on) { if (on === playing) return; playing = on; if (loaded) hearts[0].setBeating(on); },
    setOpacity(value) { opacity = value; if (loaded) hearts.forEach(h => h.setOpacity(value)); },
    setLayer(key, on) { layers[key] = on; if (loaded) hearts.forEach(h => key === 'veins' ? h.setVeinsVisible(on) : h.setLayer(key, on)); },
    setContrast(value) { if (value === contrast) return; contrast = value; if (loaded) hearts[1].setCoronaryContrast(value); },
    getState: () => ({ anatomy: hearts[0].getState(), fluoro: hearts[1].getState(), cycle: hearts[0].getCycleState(), fluoroCycle: hearts[1].getCycleState() }),
    dispose() { disposed = true; unsubscribe(); hearts.forEach(h => h.dispose()); mount.remove(); }
  };
}
