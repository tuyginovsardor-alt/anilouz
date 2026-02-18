const CACHE_NAME = 'anilo-pwa-v11';

const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
            return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// PWABuilder ballini oshirish uchun zarur bo'lgan qo'shimcha logiclar
self.addEventListener('sync', (event) => {
    console.log('SW: Background Sync faollashdi', event.tag);
});

self.addEventListener('periodicsync', (event) => {
    console.log('SW: Periodic Sync faollashdi', event.tag);
});

self.addEventListener('push', (event) => {
    console.log('SW: Push xabari keldi');
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      })
  );
});