
const CACHE_NAME = 'anilo-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// O'rnatish (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Faollashtirish (Activate)
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

// So'rovlarni tutib olish (Fetch) - Offline rejim uchun
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Agar keshda bo'lsa, qaytaradi
      if (response) {
        return response;
      }
      // Bo'lmasa internetdan oladi
      return fetch(event.request).catch(() => {
        // Agar internet yo'q bo'lsa va sahifa topilmasa, index.html ni qaytarish (SPA uchun)
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }
      });
    })
  );
});
