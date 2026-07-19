// public/sw.js
//
// Caches the app shell (index.html, bundle.js, config.js, manifest) so
// Agri Logix opens even with zero signal. Strategy: network-first, cache
// fallback. Since your build doesn't hash filenames (bundle.js is always
// bundle.js), network-first means anyone with signal always gets the
// latest deploy — the cache only kicks in the moment a fetch actually
// fails, which is exactly the "no bars in the field" case you're after.
//
// Bump CACHE_NAME (e.g. -v2) only if you ever need to force every device
// to drop its cached shell — normally not needed since network-first
// keeps the cache fresh automatically on every successful load.

const CACHE_NAME = 'agrilogix-shell-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/bundle.js',
  '/config.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        // Don't let one missing asset (e.g. config.js in a local dev build
        // without the Netlify env-var step) block caching the rest.
        console.warn('SW install: some core assets failed to precache', err);
      })
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests — never intercept Firebase/API calls,
  // those need their own real network behavior (and offlineSync.js already
  // handles their offline fallback at the data layer).
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // No exact cache match (e.g. a route path) — fall back to the
          // shell itself so the app still boots; your client-side routing
          // takes it from there.
          if (request.mode === 'navigate') return caches.match('/index.html');
          return new Response('', { status: 504, statusText: 'Offline and not cached' });
        })
      )
  );
});
