/*
 * Service worker de Meteora
 * - Fichiers de l'application (HTML, JS, CSS, icônes) : mis en cache pour un démarrage rapide et hors ligne.
 * - Prévisions météo : réseau d'abord, et en cas d'échec (hors ligne) la dernière réponse en cache.
 * - Recherche de villes / géocodage : réseau uniquement (inutile hors ligne).
 *
 * Pensez à incrémenter VERSION si vous modifiez ce fichier.
 */
const VERSION = 'v1';
const APP_CACHE = `meteora-app-${VERSION}`;
const DATA_CACHE = `meteora-data-${VERSION}`;
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/apple-touch-icon.png', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![APP_CACHE, DATA_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord, cache en secours
async function networkFirst(request, cacheName, cacheKey = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(cacheKey, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

// Cache d'abord (fichiers versionnés par Vite : leur contenu ne change jamais)
async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Pages : toujours la dernière version si possible, sinon la page en cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE, '/'));
    return;
  }

  // Prévisions météo Open-Meteo
  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Fichiers de l'application
  if (url.origin === self.location.origin) {
    event.respondWith(url.pathname.startsWith('/assets/') ? cacheFirst(request) : networkFirst(request, APP_CACHE));
  }
});
