/* ══════════════════════════════════════════════════════════════
   ZBLL Trainer — sw.js
   Service Worker · Cache-First strategy
   ══════════════════════════════════════════════════════════════ */

const APP_CACHE_NAME = 'zbll-trainer-v13';
const THUMBS_CACHE_NAME = 'zbll-thumbs-v2'; /* fallback VisualCube */

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

  // VisualCube: cachear cada diagrama la primera vez que carga (misma URL = mismo caso/tamaño)
  if (isVisualCube) {
    event.respondWith(
      caches.open(THUMBS_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Actualizar en segundo plano si hay red (stale-while-revalidate)
          fetch(event.request)
            .then(response => {
              if (isCacheableVisualCubeResponse(response)) {
                cache.put(event.request, response.clone());
              }
            })
            .catch(() => {});
          return cached;
        }

        try {
          const response = await fetch(event.request);
          if (isCacheableVisualCubeResponse(response)) {
            await cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          return caches.match('./icon-512.png');
        }
      })
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

function isCacheableVisualCubeResponse(response) {
  if (!response || !response.ok || response.status !== 200) return false;
  const type = response.headers.get('content-type') || '';
  return type.includes('image');
}

// ── Message handling (e.g. force update) ─────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
