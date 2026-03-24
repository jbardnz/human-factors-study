// PPL Human Factors Study - Service Worker for offline PWA
const CACHE_VERSION = 'hf-study-v2';

// Core files that must be cached for the app to work
const CORE_FILES = [
  './',
  './PPL_Human_Factors_Study.html',
  './manifest.json'
];

// Install: cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network, then cache the response
self.addEventListener('fetch', event => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Don't cache non-ok responses or cross-origin
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache a copy for next time
        const responseClone = response.clone();
        caches.open(CACHE_VERSION).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // Offline and not in cache - return a friendly message for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return new Response(
            '<html><body style="font-family:system-ui;text-align:center;padding:40px"><h2>Offline</h2><p>This page is not available offline. Go back to the main study app.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      });
    })
  );
});
