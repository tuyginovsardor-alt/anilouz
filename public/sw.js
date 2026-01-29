
const CACHE_NAME = 'anilo-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// O'rnatish
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Faollashtirish
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

// So'rovlarni tutib olish - Network First strategiyasi
self.addEventListener('fetch', (event) => {
  // Faqat GET so'rovlarni keshlaymiz
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Tarmoqdan kelgan javobni keshga saqlaymiz
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Tarmoq yo'q bo'lsa, keshdan qidiramiz
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Agar keshda ham bo'lmasa va bu sahifa bo'lsa (navigation)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
