/* ══════════════════════════════════════════════════════════════
   ZBLL Trainer — sw.js
   Service Worker · Cache-First strategy
   ══════════════════════════════════════════════════════════════ */

const APP_CACHE_NAME = 'zbll-trainer-v11';
const THUMBS_CACHE_NAME = 'zbll-thumbs-v1';

// Files to pre-cache on install (app shell + data)
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './zbll_cases.json',
  './icon-512.png',
];

// ── Install: pre-cache the app shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching app shell…');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())   // activate immediately
      .catch(err => console.error('[SW] Pre-cache failed:', err))
  );
});

// ── Activate: remove old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== APP_CACHE_NAME && k !== THUMBS_CACHE_NAME)
            .map(k => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())  // take control immediately
  );
});

// ── Fetch: Cache-First with Network fallback ──────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-same-origin requests except Google Fonts
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isFonts = url.hostname === 'fonts.googleapis.com' ||
                  url.hostname === 'fonts.gstatic.com';
  const isVisualCube = url.hostname === 'visualcube.api.cubing.net';

  // For visualcube thumbnails: Cache-First with network fallback
  if (isVisualCube) {
    event.respondWith(
      caches.open(THUMBS_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;

          return fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return a transparent 1×1 PNG if offline and uncached
              return new Response(
                new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,248,207,192,0,0,0,2,0,1,226,33,188,51,0,0,0,0,73,69,78,68,174,66,96,130]),
                { headers: { 'Content-Type': 'image/png' } }
              );
            });
        })
      )
    );
    return;
  }

  // For same-origin and font resources: Cache-First
  if (isSameOrigin || isFonts) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;

          // Not in cache — fetch from network and cache response
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const toCache = response.clone();
              caches.open(APP_CACHE_NAME).then(c => c.put(event.request, toCache));
              return response;
            })
            .catch(() => {
              // Offline fallback for HTML navigation
              if (event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('./index.html');
              }
            });
        })
    );
    return;
  }

  // Everything else: network only (pass through)
  // e.g. external APIs
});

// ── Message handling (e.g. force update) ─────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
