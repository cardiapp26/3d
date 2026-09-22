// Cardia Service Worker (v9)
// Strategy:
//   - HTML, JS, CSS, JSON (App Shell & Logic): Network-First, fallback to cache
//   - 3D models (.glb), Draco wasm, textures, static media: Cache-First, fallback to network
const VERSION = 'v9';
const CACHE = `cardia-${VERSION}`;

const CORE = [
  './',
  './index.html',
  './version.json'
];

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
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
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

  // 1. Network-first for navigation (HTML) and scripts/styles/json
  if (
    req.mode === 'navigate' ||
    /\.(html|js|mjs|css|json)(\?.*)?$/i.test(url.pathname)
  ) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        }
        const cached = await caches.match(req);
        if (cached) return cached;
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        const shell = await caches.match('./index.html');
        if (shell) return shell;
        return new Response('Offline', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // 2. Cache-first for 3D models, wasm, textures, static assets
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch {
      return new Response('', { status: 504, statusText: 'Resource unavailable offline' });
    }
  })());
});
