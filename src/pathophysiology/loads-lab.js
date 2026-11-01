// Preload / afterload station: hosts the load explorer (hemo-loads.js), which
// used to live as a tab in the catheter hemodynamics panel.
import { createLoadExplorer } from '../hemo-loads.js';
import '../hemo-loads.css';

export function createLoadsLab(opts = {}) {
  const mount = opts.mount || opts.container;
  const ac = new AbortController();
  const explorer = createLoadExplorer({ lang: opts.lang === 'en' ? 'en' : 'tr', signal: ac.signal });
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-loads-lab';
  root.append(explorer.element);
  mount?.append(root);
  return {
    updateLanguage(next) { explorer.setLanguage(next); },
    destroy() { ac.abort(); root.remove(); }
  };
}
