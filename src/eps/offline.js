// Offline support of the EPS page: it registers the service worker shared
// with the 3D simulator (../sw.js, scope /), so a visitor who opens the EPS
// page first also gets the offline shell. The worker serves the EPS shell for
// /eps/ paths (public/sw.js).

export const WORKER_URL = '../sw.js';
export const WORKER_SCOPE = '../';

/** Register the shared worker; resolves to the registration, or null without support or on failure. */
export function registerOffline(nav = globalThis.navigator) {
  if (!nav?.serviceWorker?.register) return Promise.resolve(null);
  return nav.serviceWorker.register(WORKER_URL, { scope: WORKER_SCOPE, updateViaCache: 'none' })
    .catch((error) => {
      console.warn('EPS: offline support unavailable', error);
      return null;
    });
}
