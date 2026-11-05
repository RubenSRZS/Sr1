/* Service worker SR Rénovation
 * - Ouverture instantanée, même sans réseau (toute l'appli est gardée dans le téléphone)
 * - Clients, catalogue, devis, factures : dernière version connue affichée hors ligne
 * - Les enregistrements hors ligne sont gérés par l'appli (file d'attente), pas ici
 */
const CACHE = 'sr-app-v3';
const API_CACHE = 'sr-api-v1';
const API_TIMEOUT_MS = 6000;

// Données utiles hors ligne (lecture seule)
const API_CACHEABLE = /\/api\/(clients|catalog|services|quotes|invoices|profiles|stats)(\/|$|\?)/;
// Jamais gardées en cache
const API_NEVER = /\/api\/(auth|public|ai)\b/;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // Pré-charge toute l'appli (toutes les pages) pour qu'elle marche hors ligne
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      try {
        const res = await fetch('/asset-manifest.json', { cache: 'no-store' });
        const manifest = await res.json();
        const files = Object.values(manifest.files || {}).filter(
          (f) => typeof f === 'string' && !f.endsWith('.map') && !f.endsWith('.txt')
        );
        await Promise.allSettled(['/', '/index.html', '/manifest.json', ...files].map((f) => cache.add(f)));
      } catch (_) { /* hors ligne à l'installation : on remplira au fil de l'eau */ }
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (err) => { clearTimeout(t); reject(err); });
  });

// Réseau d'abord ; si pas de réseau (ou trop lent), dernière version gardée
const apiNetworkFirst = (request) => {
  const network = fetch(request).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(API_CACHE).then((c) => c.put(request, copy));
    }
    return res;
  });
  return withTimeout(network, API_TIMEOUT_MS).catch(async () => {
    const cached = await caches.match(request, { cacheName: API_CACHE });
    if (cached) return cached;
    return network; // pas de copie : on attend le réseau quand même
  });
};

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Données de l'API (même domaine ou serveur Google)
  if (url.pathname.startsWith('/api/')) {
    if (API_NEVER.test(url.pathname) || !API_CACHEABLE.test(url.pathname)) return;
    e.respondWith(apiNetworkFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Navigation (index.html) : ouverture instantanée depuis le cache,
  // et mise à jour en arrière-plan (la nouvelle version s'affiche à l'ouverture suivante).
  // Les pages publiques des clients (/devis/public/...) restent toujours à jour.
  if (request.mode === 'navigate') {
    const network = fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
        }
        return res;
      });
    if (url.pathname.startsWith('/devis/public/')) {
      e.respondWith(network.catch(() => caches.match('/index.html')));
      return;
    }
    e.waitUntil(network.catch(() => {}));
    e.respondWith(caches.match('/index.html').then((cached) => cached || network));
    return;
  }

  // Assets statiques (js/css/images/fonts) : cache d'abord + mise à jour en arrière-plan
  if (/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico|json)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
