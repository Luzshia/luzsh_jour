// sw.js - Service Worker Optimizado para Journal de Puntos Offline
const CACHE_NAME = 'journal-pure-cache-v1';

// Lista pulida de recursos estáticos obligatorios para el funcionamiento local
const ASSETS = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png'
];

// 1. Evento de Instalación: Cacheo forzado de la estructura limpia del cuaderno
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Inicializando almacenamiento estático del cuaderno...');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Evento de Activación: Eliminación de residuos de caché previos
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Purgando estructura de caché antigua:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Evento Fetch: Estrategia inteligente para actualizar cambios en caliente
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Devuelve la copia local de inmediato para que cargue instantáneo
            const networkFetch = fetch(e.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    // Si hay internet y el archivo cambió en GitHub, lo guarda actualizado
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => null); // Si está offline, ignora el fallo de red

            return cachedResponse || networkFetch;
        }).catch(() => {
            if (e.request.mode === 'navigate') {
                return caches.match('index.html');
            }
        })
    );
});