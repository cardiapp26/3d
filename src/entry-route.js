// The 3D page remembers its last mode route; the EPS, pharmacology and ECG
// pages send their "3D Anatomy" links back to it. Stored values are checked
// against the route pattern, so only a mode route can reach a link.

const ROUTE_KEY = 'cardia_last_route';
const ROUTE_RE = /^#\/mode\/[a-z]+(\?structure=[a-z0-9_-]*)?$/i;

const store = (storage) => storage || (typeof localStorage !== 'undefined' ? localStorage : null);

/** Keep the current 3D route (`#/mode/<id>?structure=<id>`); anything else is ignored. */
export function rememberRoute(hash, storage) {
  if (!ROUTE_RE.test(String(hash || ''))) return;
  try {
    store(storage)?.setItem(ROUTE_KEY, hash);
  } catch {
    /* private storage */
  }
}

/** The 3D page address with the last route, or `base` alone when none is stored. */
export function simulatorHref(base = '../', storage) {
  let route = null;
  try {
    route = store(storage)?.getItem(ROUTE_KEY) || null;
  } catch {
    /* private storage */
  }
  return route && ROUTE_RE.test(route) ? `${base}${route}` : base;
}

/** Point every link to the 3D page (`href="../"`) at the last route. */
export function linkToLastRoute(doc = globalThis.document, storage) {
  if (!doc) return;
  const href = simulatorHref('../', storage);
  for (const link of doc.querySelectorAll('a[href="../"], a[data-simulator-link]')) {
    link.dataset.simulatorLink = '';
    link.setAttribute('href', href);
  }
}
