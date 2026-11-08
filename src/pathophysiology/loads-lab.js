// Preload / afterload station: hosts the load explorer (hemo-loads.js), which
// used to live as a tab in the catheter hemodynamics panel.
import { createLoadExplorer } from '../hemo-loads.js';
import { createLvFunctionLab } from './lv-function-lab.js';
import '../hemo-loads.css';

export function createLoadsLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const ac = new AbortController();
  const explorer = createLoadExplorer({ lang: opts.lang === 'en' ? 'en' : 'tr', signal: ac.signal });
  const systolic = createLvFunctionLab({ lang: opts.lang });
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-loads-lab';
  root.append(systolic.element, explorer.element);
  mount?.append(root);
  return {
    updateLanguage(next) { systolic.setLanguage(next); explorer.setLanguage(next); },
    destroy() { systolic.destroy(); ac.abort(); root.remove(); }
  };
}
