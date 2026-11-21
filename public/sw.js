/* global self, caches, Headers, Response */
// Bump on SW logic changes; activate deletes every other cache.
// ponytail: hashed assets from older deploys pile up within one version; bump CACHE to purge.
const CACHE = 'nerad-v1';
const CACHE_DATE = 'x-sw-cache-date';

self.addEventListener('install', (event) => {
  // Precache the shell: the first visit loaded it before this SW controlled the page
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const res = await fetch('/', { cache: 'no-cache' });
    if (!res.ok) return;
    const html = await res.clone().text();
    await cache.put('/', res);
    await cache.addAll([...new Set(html.match(/\/assets\/[^"']+/g) ?? [])]);
  })().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // SPA: one shell under '/', whatever the path or query
    event.respondWith(networkFirst(request, '/'));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname === '/api/departureboards') {
    event.respondWith(networkFirst(request, request, true));
  }
  // Everything else (other /api endpoints, icons, manifest) goes straight to the network
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, res.clone());
  }
  return res;
}

// ponytail: no SW-side timeout; on a hanging network the client's own 8 s timeout fires first and shows the error.
async function networkFirst(request, cacheKey, stampDate = false) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) {
      // The stamp is only visible to the page when this copy is served as the offline fallback
      const copy = stampDate ? await stamp(res.clone()) : res.clone();
      await cache.put(cacheKey, copy);
    }
    return res;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

async function stamp(res) {
  const headers = new Headers(res.headers);
  headers.set(CACHE_DATE, String(Date.now()));
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers });
}
