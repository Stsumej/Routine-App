const CACHE_VERSION = 'ritual-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  // __BUILD_ASSETS__
  // Populated automatically by scripts/inject-sw-assets.mjs (runs as part of `npm run build`),
  // which reads dist/.vite/manifest.json and inserts the hashed JS/CSS bundle paths here.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function isShellRequest(request) {
  const url = new URL(request.url);
  return SHELL_ASSETS.includes(url.pathname) || url.pathname === '/';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isShellRequest(request)) {
    // Cache-first for the app shell.
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Network-first (falling back to cache) for everything else — check-in/streak data
  // should always try to be fresh. This also opportunistically caches hashed JS/CSS
  // bundle chunks and other same-origin requests as they're fetched, so a repeat
  // visit still works offline even for paths not in SHELL_ASSETS.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Navigations offline with nothing cached yet: fall back to the shell so the
          // React app's own offline UI can render instead of a browser error page.
          if (request.mode === 'navigate') return caches.match('/index.html');
          return undefined;
        })
      )
  );
});
