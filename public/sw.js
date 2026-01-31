
const CACHE_NAME = 'anilo-pwa-v10'; // Versiya yangilandi

// Keshlanishi shart bo'lgan asosiy fayllar
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  './logo.png',
  '/index.tsx' // Asosiy modulni keshga qo'shish shart!
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching assets');
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
            console.log('SW: Removing old cache:', key);
            return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Modern strategiya: Network First, falling back to Cache
// Bu JS fayllarining har doim yangi versiyasi yuklanishini ta'minlaydi
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Agar javob kelsa, uni keshga saqlab qo'yamiz (background update)
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Internet bo'lmasa keshdan olamiz
        return caches.match(event.request).then(cached => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      })
  );
});
