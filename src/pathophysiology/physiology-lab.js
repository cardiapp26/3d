// Visual physiology guide station (pump curves, P-V phases and work, Wiggers
// events); it used to be a tab of the catheter hemodynamics panel.
import { createPhysiologyGuide } from '../physiology-guide.js';

export function createPhysiologyLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const ac = new AbortController();
  const guide = createPhysiologyGuide({ lang: opts.lang === 'en' ? 'en' : 'tr', signal: ac.signal });
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-physiology-lab';
  root.append(guide.element);
  mount?.append(root);
  return {
    updateLanguage(next) { guide.setLanguage(next); },
    destroy() { ac.abort(); root.remove(); }
  };
}
