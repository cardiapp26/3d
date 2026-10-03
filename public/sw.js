// Cardia Service Worker
// Strategy:
//   - Fixed names: revalidate online, same-build cache fallback offline
//   - Vite content-hashed assets: cache-first
//   - Two pages: the 3D simulator (./) and the EPS laboratory (./eps/); an
//     offline navigation falls back to the shell of its own page
const VERSION = 'v11';
const CACHE = `cardia-${VERSION}`;

const CORE = [
  './',
  './index.html',
  './eps/',
  './eps/index.html'
];

/** Offline shell of a navigation: the EPS page for /eps/..., else the simulator. */
const shellFor = (pathname) => (/^\/eps(\/|$)/.test(pathname) ? './eps/index.html' : './index.html');

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(
      CORE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok) await cache.put(url, res);
        } catch (_) {}
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('cardia-') && k !== CACHE).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Cross-origin requests: standard browser behavior
  if (url.origin !== location.origin) {
    return;
  }

  const immutable = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:css|js|wasm|glb|gltf|png|jpg|jpeg|gif|ico|svg|woff2?)$/.test(url.pathname);
  const versionCheck = url.pathname === '/version.json';
  // Mutable models and Draco files must also bypass a fresh HTTP cache.
  if (!immutable) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(req, { cache: versionCheck ? 'no-store' : 'no-cache' });
        if (fresh && fresh.ok) {
          if (!versionCheck) await cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        }
        const cached = !versionCheck && await cache.match(req);
        if (fresh?.status >= 500 && cached) return cached;
        return fresh;
      } catch {
        const cached = !versionCheck && await cache.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const shell = await cache.match(shellFor(url.pathname));
          if (shell) return shell;
        }
        return new Response('Offline', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Content hash changes whenever an immutable asset changes.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        await cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch {
      return new Response('', { status: 504, statusText: 'Resource unavailable offline' });
    }
  })());
});
