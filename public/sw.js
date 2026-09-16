const CACHE_NAME = 'rtt-check-v25';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo-192.png',
  './icone-192.png',
  './icone-512.png'
];

// Instala o Service Worker e guarda os arquivos no cache offline
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
  );
  self.skipWaiting();
});

// Ativa o novo robô e limpa os caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia Cache First (Tenta pegar do celular primeiro, se não tiver, busca na rede)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Achou no celular, entrega instantaneamente (mesmo sem internet!)
        }
        return fetch(event.request).catch(() => {
          // Se falhar a rede e não estiver no cache da raiz, retorna o index principal para não dar erro
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
