// Camera and display bar above the studio's anatomy and fluoroscopy views, matching the atlas toolbar
// (src/main.js): view presets, C-arm, fluoroscopy and segmentation, with the same keys.
// C-arm presets move both views and the gantry; posterior, aortic root and mitral are
// anatomy-only cameras because the C-arm has no such projection.

/** C-arm projections (alpha: + LAO / - RAO, beta: + CRA / - CAU). Spider follows the studio's LAO caudal preset. */
export const VIEWBAR_PROJECTIONS = Object.freeze({
  anterior: [0, 0],
  rao: [-30, 0],
  lao: [45, 0],
  spider: [45, -35]
});

const VIEWS = [
  { id: 'anterior', key: 'A', en: 'Anterior', tr: 'Anterior' },
  { id: 'posterior', key: 'P', en: 'Posterior', tr: 'Posterior' },
  { id: 'rao', key: 'R', en: 'RAO', tr: 'RAO' },
  { id: 'lao', key: 'L', en: 'LAO', tr: 'LAO' },
  { id: 'spider', key: 'S', en: 'Spider', tr: 'Spider' },
  { id: 'root', key: 'O', en: 'Root', tr: 'Kök' },
  { id: 'mitral', key: null, en: 'Mitral', tr: 'Mitral' }
];

const TITLES = {
  tr: {
    anterior: 'Anterior (AP 0° / 0°)', posterior: 'Posterior: yalnız 3B anatomi, C-arm karşılığı yok', rao: 'RAO 30°', lao: 'LAO 45°',
    spider: 'Spider (LAO 45° / CAU 35°): LMCA bifurkasyonu', root: 'Aort kökü ve koroner ostiumlar: yalnız 3B anatomi',
    mitral: 'Mitral anulus: yalnız 3B anatomi, kapaklar açılır', carm: 'C-arm gantry ve açı kumandasına git',
    fluoro: 'Floroskopi panelini göster veya gizle', seg: 'Segmentasyon tarzı görünüm: her atlas yapısı tek etiket renginde (hasta görüntüsünden segmentasyon değildir)',
    fluoroLabel: 'Floroskopi', segLabel: 'Segmentasyon', bar: '3B anatomi kamera ve görünüm araçları'
  },
  en: {
    anterior: 'Anterior (AP 0° / 0°)', posterior: 'Posterior: 3D anatomy only, no C-arm equivalent', rao: 'RAO 30°', lao: 'LAO 45°',
    spider: 'Spider (LAO 45° / CAU 35°): LMCA bifurcation', root: 'Aortic root and coronary ostia: 3D anatomy only',
    mitral: 'Mitral annulus: 3D anatomy only, shows the valves', carm: 'Go to the C-arm gantry and angle controls',
    fluoro: 'Show or hide the fluoroscopy panel', seg: 'Segmentation-style view: each atlas structure in one label colour (not a segmentation of patient imaging)',
    fluoroLabel: 'Fluoroscopy', segLabel: 'Segmentation', bar: '3D anatomy camera and display tools'
  }
};

const SHORTCUTS = { a: 'anterior', p: 'posterior', r: 'rao', l: 'lao', s: 'spider', o: 'root' };
const TYPING = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

/**
 * @param {{ getLang: () => string, onView: (id: string) => void, onReset: () => void,
 *   onCarm: () => void, onFluoro: (on: boolean) => void, onSegmentation: (on: boolean) => void }} options
 */
export function createAngioViewBar({ getLang, onView, onReset, onCarm, onFluoro, onSegmentation }) {
  const element = document.createElement('div');
  element.className = 'angio-viewbar';
  element.dataset.angioViewbar = '';
  element.setAttribute('role', 'toolbar');
  const kbd = key => (key ? ` <kbd>${key}</kbd>` : '');
  element.innerHTML = `
    <div class="angio-viewbar-presets">
      ${VIEWS.map(v => `<button type="button" data-viewbar-view="${v.id}" aria-pressed="false"><span data-viewbar-label="${v.id}"></span>${kbd(v.key)}</button>`).join('')}
    </div>
    <div class="angio-viewbar-tools">
      <button type="button" data-viewbar-carm><span aria-hidden="true">📐</span> C-Arm <kbd>C</kbd></button>
      <button type="button" data-viewbar-fluoro aria-pressed="true"><span aria-hidden="true">☢</span> <span data-viewbar-label="fluoro"></span> <kbd>X</kbd></button>
      <button type="button" data-viewbar-seg aria-pressed="false"><span class="angio-seg-icon" aria-hidden="true"></span><span data-viewbar-label="seg"></span> <kbd>G</kbd></button>
    </div>`;
  let fluoro = true, segmentation = false;
  const button = selector => element.querySelector(selector);

  function setActive(id) {
    element.querySelectorAll('[data-viewbar-view]').forEach(btn => {
      const on = btn.dataset.viewbarView === id;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }
  /** Highlights the C-arm preset that matches the current projection, if any. */
  function syncAngles(alpha, beta) {
    const match = Object.entries(VIEWBAR_PROJECTIONS).find(([, [a, b]]) => Math.abs(a - alpha) <= 1 && Math.abs(b - beta) <= 1);
    setActive(match ? match[0] : null);
  }
  function setFluoro(on) {
    fluoro = Boolean(on);
    button('[data-viewbar-fluoro]').setAttribute('aria-pressed', String(fluoro));
    button('[data-viewbar-fluoro]').classList.toggle('active', fluoro);
    onFluoro(fluoro);
  }
  function setSegmentation(on) {
    segmentation = Boolean(on);
    button('[data-viewbar-seg]').setAttribute('aria-pressed', String(segmentation));
    button('[data-viewbar-seg]').classList.toggle('active', segmentation);
    onSegmentation(segmentation);
  }
  function render() {
    const lang = getLang() === 'tr' ? 'tr' : 'en';
    const t = TITLES[lang];
    element.setAttribute('aria-label', t.bar);
    VIEWS.forEach(v => {
      button(`[data-viewbar-label="${v.id}"]`).textContent = v[lang];
      button(`[data-viewbar-view="${v.id}"]`).title = `${t[v.id]}${v.key ? ` (${v.key})` : ''}`;
    });
    button('[data-viewbar-label="fluoro"]').textContent = t.fluoroLabel;
    button('[data-viewbar-label="seg"]').textContent = t.segLabel;
    button('[data-viewbar-carm]').title = `${t.carm} (C)`;
    button('[data-viewbar-fluoro]').title = `${t.fluoro} (X)`;
    button('[data-viewbar-seg]').title = `${t.seg} (G)`;
  }

  element.querySelectorAll('[data-viewbar-view]').forEach(btn => btn.addEventListener('click', () => onView(btn.dataset.viewbarView)));
  button('[data-viewbar-carm]').addEventListener('click', onCarm);
  button('[data-viewbar-fluoro]').addEventListener('click', () => setFluoro(!fluoro));
  button('[data-viewbar-seg]').addEventListener('click', () => setSegmentation(!segmentation));

  function onKey(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (TYPING.has(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
    const key = e.key.toLowerCase();
    if (SHORTCUTS[key]) onView(SHORTCUTS[key]);
    else if (key === '0') onReset();
    else if (key === 'c') onCarm();
    else if (key === 'x') setFluoro(!fluoro);
    else if (key === 'g') setSegmentation(!segmentation);
    else return;
    e.preventDefault();
  }
  document.addEventListener('keydown', onKey);
  render();
  setFluoro(true);

  return {
    element, render, setActive, syncAngles,
    getState: () => ({ fluoro, segmentation }),
    dispose() { document.removeEventListener('keydown', onKey); element.remove(); }
  };
}
