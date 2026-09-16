// Service Worker RTT Check - Versão com estratégia Network-First para navegação (evita tela branca pós-update)
const CACHE_NAME = 'rtt-check-v26';
const CRITICAL_ASSETS = [
  './manifest.json',
  './logo-192.png',
  './icone-192.png',
  './icone-512.png',
];

// Instalação: baixa os recursos críticos e ativa imediatamente sem esperar fechar abas
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('[SW] Aviso ao pré-carregar recursos:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: apaga todas as versões antigas de cache para evitar scripts desatualizados
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Mensagens vindas do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
  }
});

// Estratégia de busca inteligente
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Não intercepta chamadas de API ou métodos que não sejam GET
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  // 1. REQUISIÇÃO DE PÁGINA (HTML / NAVEGAÇÃO): NETWORK-FIRST
  // Sempre busca a versão mais recente publicada no servidor primeiro.
  // Se estiver sem sinal de internet (offline), aí sim usa a cópia do cache.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline: busca no cache
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallbackIndex = await caches.match('./index.html');
          if (fallbackIndex) return fallbackIndex;
          const rootIndex = await caches.match('./');
          if (rootIndex) return rootIndex;
          return new Response('Aplicativo offline. Reconecte-se para carregar a versão mais recente.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. DEMAIS RECURSOS (JS, CSS, IMAGENS): STALE-WHILE-REVALIDATE COM FALLBACK
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Se já tiver em cache, entrega rápido enquanto atualiza em segundo plano
      return cachedResponse || fetchPromise;
    })
  );
});
