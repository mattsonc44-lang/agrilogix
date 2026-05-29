// AgriLogix Service Worker — offline shell caching
const CACHE = 'agrilogix-v2';
const SHELL = ['/', '/index.html', '/bundle.js', '/config.js'];

// Cache app shell on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fall back to cache for shell assets
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Let Firebase, Netlify functions, and external APIs go straight through
  if (
    url.includes('firebase') ||
    url.includes('netlify/functions') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('unpkg.com') ||
    url.includes('resend.com') ||
    url.includes('anthropic.com') ||
    e.request.method !== 'GET'
  ) return;

  // For app shell: network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache fresh copy if it's a shell asset
        if (SHELL.some(s => url.endsWith(s) || url === self.location.origin + s)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
