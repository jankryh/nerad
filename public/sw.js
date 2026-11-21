/* global self, caches, Headers, Response, URLSearchParams */
// Bump on SW logic changes; activate deletes every other cache.
// ponytail: hashed assets from older deploys pile up within one version; bump CACHE to purge.
const CACHE = 'nerad-v2';
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
    event.respondWith(networkFirstNavigation(request));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname === '/api/departureboards') {
    event.respondWith(networkFirstAPI(request));
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

// Navigation: only cache text/html for app routes (/, /index.html, possibly with query string)
async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
      const url = new URL(request.url);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        // Cache write failures don't block returning the network response
        cache.put('/', res.clone()).catch(() => undefined);
      }
    }
    return res;
  } catch (err) {
    const cached = await cache.match('/');
    if (cached) return cached;
    throw err;
  }
}

// API: normalize the cache key (drop time window params) and stamp the date
async function networkFirstAPI(request) {
  const cache = await caches.open(CACHE);
  const normalizedKey = normalizeAPIKey(request.url);
  try {
    const res = await fetch(request);
    if (res.ok) {
      const stamped = await stamp(res.clone());
      // Cache write failures don't block returning the network response
      cache.put(normalizedKey, stamped).catch(() => undefined);
    }
    return res;
  } catch (err) {
    const cached = await cache.match(normalizedKey);
    if (cached) return cached;
    throw err;
  }
}

function normalizeAPIKey(urlString) {
  const url = new URL(urlString);
  const params = new URLSearchParams(url.search);
  // Keep stable params, drop the time window (minutesBefore/minutesAfter changes every minute)
  params.delete('minutesBefore');
  params.delete('minutesAfter');
  params.sort();
  url.search = params.toString();
  return url.toString();
}

async function stamp(res) {
  const headers = new Headers(res.headers);
  headers.set(CACHE_DATE, String(Date.now()));
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers });
}
