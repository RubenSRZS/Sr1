/* Service worker — démarrage instantané + cache des assets statiques */
const CACHE = 'sr-app-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation (index.html) : réseau d'abord, cache en secours (offline)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets statiques (js/css/images/fonts) : cache d'abord + mise à jour en arrière-plan
  if (/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
