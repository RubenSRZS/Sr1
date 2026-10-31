/* Service worker — démarrage instantané + cache des assets statiques */
const CACHE = 'sr-app-v2';

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

  // Navigation (index.html) : ouverture instantanée depuis le cache,
  // et mise à jour en arrière-plan (la nouvelle version s'affiche à l'ouverture suivante).
  // Les pages publiques des clients (/devis/public/...) restent toujours à jour.
  if (request.mode === 'navigate') {
    const network = fetch(request)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('/index.html', copy));
        }
        return res;
      });
    if (url.pathname.startsWith('/devis/public/')) {
      e.respondWith(network.catch(() => caches.match('/index.html')));
      return;
    }
    e.waitUntil(network.catch(() => {}));
    e.respondWith(
      caches.match('/index.html').then(cached => cached || network)
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
