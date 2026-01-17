const CACHE_NAME = 'snavegar-v9-pwa-final'; 
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Domínios que devem ser ignorados pelo Service Worker
// para garantir acesso direto à rede sem interceptação.
const NETWORK_ONLY_DOMAINS = [
  'generativelanguage.googleapis.com', // Google Gemini API
  'supabase.co'                        // Supabase API
];

self.addEventListener('install', event => {
  // Força o novo SW a ativar imediatamente, substituindo o antigo
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Verifica se é uma requisição de API externa
  const isNetworkOnly = NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain));

  if (isNetworkOnly) {
    // CORREÇÃO CRÍTICA PWA:
    // Retornar cedo sem chamar event.respondWith() instrui o navegador a
    // usar a pilha de rede nativa. Isso evita que o SW interfira em corpos POST,
    // headers de Auth ou streams, que costumam falhar quando interceptados no PWA.
    return;
  }

  // Cache-First para arquivos estáticos da UI
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume o controle dos clientes imediatamente
      self.clients.claim()
    ])
  );
});