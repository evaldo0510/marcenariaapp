
const CACHE_NAME = 'marcenapp-cache-v5'; // Increment version to force update

const STATIC_ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install Event - Precache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS_TO_PRECACHE);
      })
      .then(() => self.skipWaiting()) // Force activation immediately
      .catch(error => {
        console.error("[SW] Failed to cache app shell:", error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Fetch Event - Stale-While-Revalidate Strategy for most things
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora requisições de API externas (Gemini) para não cachear respostas de IA
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return; // Deixa o navegador lidar com a rede
  }

  // Estratégia de Cache
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se houver cache, retorna ele E atualiza em background (Stale-while-revalidate)
        const fetchPromise = fetch(event.request).then(networkResponse => {
            // Verifica se a resposta é válida antes de cachear
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
        }).catch(err => {
            // Se falhar o fetch e não tiver cache, é um problema, mas o catch abaixo lida com o retorno do cache
            console.log('[SW] Network fetch failed, using offline fallback if available');
        });

        // Retorna o cache se existir, senão espera o fetch
        return cachedResponse || fetchPromise;
      })
  );
});
