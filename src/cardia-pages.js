// Pages that run the 3D lesson shell (main.js). Each page hosts its own mode
// groups; a mode hosted elsewhere is reached by navigating to its page. A page
// declares itself with <body data-cardia-page="..." data-cardia-root="../">;
// paths are relative to the site root.

export const CARDIA_PAGES = Object.freeze({
  anatomy: { path: './', groups: [['modeGroupAnatomy', ['anatomy', 'atria', 'ra', 'rv', 'lv', 'defects']]] },
  exam: { path: './exam/', groups: [['modeGroupExam', ['exam']]] },
  hemo: { path: './hemo/', groups: [['modeGroupHemodynamics', ['cath']]] },
  'ep-anatomy': { path: './eps/anatomy/', groups: [['modeGroupEp', ['transseptal', 'ablation', 'pacemaker', 'bachmann']]] },
  'angio-3d': { path: './angio/3d/', groups: [['modeGroupIntervention', ['angiography']]] }
});

// Imaging modes left the 3D shell for the echo studio.
const ECHO_MODALITY = Object.freeze({ echo: 'tte', tee: 'tee', ice: 'ice' });

const pageDataset = () => (typeof document !== 'undefined' ? document.body?.dataset || {} : {});

/** Id of the current page (anatomy when the page does not declare one). */
export function currentPageId() {
  const id = pageDataset().cardiaPage;
  return CARDIA_PAGES[id] ? id : 'anatomy';
}

/** Relative path from the current page to the site root ('./', '../', '../../'). */
export function pageRoot() {
  const root = pageDataset().cardiaRoot;
  return typeof root === 'string' && /^(\.\/|(\.\.\/)+)$/.test(root) ? root : './';
}

/** A root-relative path ('./eps/') as seen from the current page. */
export function fromRoot(path) {
  const clean = String(path).replace(/^\.\//, '');
  const root = pageRoot();
  return root === './' ? `./${clean}` : `${root}${clean}`;
}

/** Page id that hosts a mode, or null. */
export function pageOfMode(mode) {
  return Object.keys(CARDIA_PAGES).find(id => CARDIA_PAGES[id].groups.some(([, ids]) => ids.includes(mode))) || null;
}

/** Address of a mode on another page (`#/mode/<id>` plus an optional query), or null when nothing hosts it. */
export function modeHref(mode, query = '') {
  if (ECHO_MODALITY[mode]) return fromRoot(`./echo/?modality=${ECHO_MODALITY[mode]}`);
  const page = pageOfMode(mode);
  if (!page) return null;
  return `${fromRoot(CARDIA_PAGES[page].path)}#/mode/${mode}${query ? `?${query}` : ''}`;
}
