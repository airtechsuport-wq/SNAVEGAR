const CACHE_NAME = 'snavegar-v14-eco-mode'; 
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Domínios que devem ser ignorados pelo Service Worker
const NETWORK_ONLY_DOMAINS = [
  'generativelanguage.googleapis.com', 
  'supabase.co'                        
];

self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  const isNetworkOnly = NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain));

  if (isNetworkOnly) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Apagando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});