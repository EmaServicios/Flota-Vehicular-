// Guarda la estructura de la app (y el visor de PDF) para que abra rápido y también sin señal.
// Los datos siempre se piden en vivo al servidor; las copias de fichas y documentos viven en la propia app (IndexedDB).
const VERSION = 'flota-v3';
const ARCHIVOS = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
  'logo.png', 'icon-192.png', 'icon-512.png', 'pdf.min.js', 'pdf.worker.min.js'];

self.addEventListener('install', function (e) {
  // cada archivo por separado: si falta alguno, los demás igual se guardan
  e.waitUntil(caches.open(VERSION)
    .then(function (c) { return Promise.all(ARCHIVOS.map(function (a) { return c.add(a).catch(function () {}); })); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys()
    .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});

// Primero la red (siempre la versión más nueva); si no hay señal, la copia guardada.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copia = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (r) { return r || caches.match('index.html'); });
  }));
});
