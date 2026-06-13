const CACHE = 'bht-v1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'program-data.json',
  'src/styles.css',
  'src/app.js',
  'src/views/today.js',
  'src/views/browse.js',
  'src/views/tests.js',
  'src/views/reference.js',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
