// Catheter-scenario P-V loop: the loop the hemodynamics scenarios produce
// (aortic stenosis, regurgitant lesions, VSD, tamponade...), drawn on a
// running cycle. It used to be the P-V tab of the catheter panel.
import { createHemodynamics } from '../hemodynamics.js';
import { samplePvLoop, drawPvLoop } from '../hemo-pv-loop.js';

const TEXT = {
  tr: { title: 'Kateter senaryolarında P-V döngüsü', scenario: 'Senaryo', canvas: 'Seçilen senaryonun sol ventrikül basınç-hacim döngüsü (şematik)', note: 'Döngü, kateterizasyon modülündeki aynı senaryonun basınçlarından çizilir; kapak yetersizliklerinde ileri hacim gösterilir.' },
  en: { title: 'P-V loop of the catheter scenarios', scenario: 'Scenario', canvas: 'Left ventricular pressure-volume loop of the selected scenario (schematic)', note: 'The loop is drawn from the pressures of the same scenario in the catheterization module; regurgitant lesions show the forward volume.' }
};
const CYCLE_SECONDS = 1.6;

export function createScenarioPvLoop({ lang = 'tr' } = {}) {
  let language = lang === 'en' ? 'en' : 'tr';
  const hemo = createHemodynamics('normal');
  let data = samplePvLoop(hemo, 240), raf = null, start = null, disposed = false;
  const element = document.createElement('section');
  element.className = 'pathophys-scenario-pv';
  element.innerHTML = '<h3></h3><label class="pathophys-scenario-pv__pick"><span></span><select data-scenario-pv></select></label><canvas class="pathophys-scenario-pv__canvas" role="img"></canvas><p class="pathophys-scenario-pv__note"></p>';
  const [title, label, select, canvas, note] = ['h3', 'label span', 'select', 'canvas', 'p'].map(sel => element.querySelector(sel));
  select.addEventListener('change', () => {
    if (!hemo.setScenario(select.value)) return;
    data = samplePvLoop(hemo, 240);
  });
  function render() {
    const t = TEXT[language];
    title.textContent = t.title; label.textContent = t.scenario; note.textContent = t.note;
    canvas.setAttribute('aria-label', t.canvas);
    const current = hemo.getScenario().id;
    select.replaceChildren(...hemo.listScenarios().map(({ id, label: name }) => Object.assign(document.createElement('option'), { value: id, textContent: name[language] || name.tr })));
    select.value = current;
  }
  const tick = ts => {
    raf = null;
    if (disposed) return;
    start ??= ts;
    const phase = (((ts - start) / 1000) / CYCLE_SECONDS) % 1;
    if (canvas.clientWidth >= 40) drawPvLoop(canvas, data, { phase, lang: language, dpr: Math.min(globalThis.devicePixelRatio || 1, 2) });
    raf = requestAnimationFrame(tick);
  };
  render();
  raf = requestAnimationFrame(tick);
  return {
    element,
    setLanguage(next) { language = next === 'en' ? 'en' : 'tr'; render(); },
    getScenario: () => hemo.getScenario().id,
    destroy() { disposed = true; if (raf != null) cancelAnimationFrame(raf); element.remove(); }
  };
}
