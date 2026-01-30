
const CACHE_NAME = 'anilo-v8'; // Versiya yangilandi
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        // Eski kesh versiyalarini o'chirish
        if (key !== CACHE_NAME) {
            console.log('SW: Eski kesh o\'chirilmoqda:', key);
            return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// PWA installable bo'lishi uchun fetch listener majburiy!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Keshda bo'lsa keshdan, bo'lmasa tarmoqdan
      return cached || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
