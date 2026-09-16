// Service Worker RTT Check - Versão com estratégia Network-First total para evitar congelamento pós-update
const CACHE_NAME = 'rtt-check-v30';
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
        console.warn('[SW] Aviso ao pré-carregar recursos críticos:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: apaga IMEDIATAMENTE todas as versões antigas de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Apagando cache legado:', cache);
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
  if (event.data && (event.data.type === 'CLEAR_ALL_CACHES' || event.data.type === 'FORCE_PURGE')) {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
});

// Estratégia de busca inteligente: Network-First para páginas e scripts (garante sempre a versão mais nova)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Não intercepta chamadas de API ou métodos que não sejam GET
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  const isScriptOrStyle =
    request.url.includes('/assets/') ||
    request.url.endsWith('.js') ||
    request.url.endsWith('.css');

  // 1. NAVEGAÇÃO E SCRIPTS/ESTILOS: NETWORK-FIRST
  // Garante que o celular receba o código novo assim que você enviar atualizações no GitHub
  if (isNavigation || isScriptOrStyle) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Apenas armazena no cache se for uma resposta 200 válida
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Falha de rede (offline): tenta obter do cache existente
          const cached = await caches.match(request);
          if (cached) return cached;

          if (isNavigation) {
            const fallbackIndex = await caches.match('./index.html');
            if (fallbackIndex) return fallbackIndex;
            const rootIndex = await caches.match('./');
            if (rootIndex) return rootIndex;
          }

          return new Response('Recurso indisponível offline.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. DEMAIS RECURSOS ESTÁTICOS (IMAGENS, ÍCONES, FONTES): CACHE-FIRST COM FALLBACK PARA REDE
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return networkResponse;
      });
    })
  );
});
