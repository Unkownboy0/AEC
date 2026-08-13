const CACHE_NAME = 'geetorus-campusos-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual add for each asset to avoid failing the whole cache if one is missing
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

// Activate Event (Cleanup Old Caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Stale-While-Revalidate Strategy for assets, Network First for APIs)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass API requests to allow fresh DB states, using network only/fallback
  if (requestUrl.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in the background and update cache (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore offline network errors */});

        return cachedResponse;
      }

      // If not cached, fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for offline mode when request is not in cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
