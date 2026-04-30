const CACHE_NAME = "logitrack-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force activate new service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Clear old caches immediately
          }
        })
      );
    }).then(() => self.clients.claim()) // Take over all pages immediately
  );
});

self.addEventListener("fetch", (event) => {
  // Use Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If network works, cache the fresh response and return it
        if (event.request.method === "GET") {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails (offline), return from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to index.html for navigation requests when offline
          if (event.request.mode === 'navigate') return caches.match('/index.html');
        });
      })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
