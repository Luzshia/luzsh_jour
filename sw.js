// sw.js - Service Worker mínimo
self.addEventListener('install', (e) => {
  console.log('SW instalado');
});

self.addEventListener('fetch', (e) => {
  // Obligatorio para que Chrome la considere PWA
  e.respondWith(fetch(e.request));
});