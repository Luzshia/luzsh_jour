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

// 3. Evento Fetch: Interceptor inteligente de red local
self.addEventListener('fetch', (e) => {
    // Filtrar para interceptar únicamente solicitudes de lectura estándar (GET)
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Si el recurso vive en el almacenamiento del dispositivo, se sirve de inmediato
            if (cachedResponse) {
                return cachedResponse;
            }

            // Si no está registrado en el ciclo local, se pide al servidor web
            return fetch(e.request).then((networkResponse) => {
                // Validación de respuesta correcta antes de intentar clonar
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Guardado dinámico en caché para nuevos recursos anexados en caliente
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });

                return networkResponse;
            });
        }).catch(() => {
            // Plan de contingencia si no hay red ni recurso: Retorna a la página base
            if (e.request.mode === 'navigate') {
                return caches.match('index.html');
            }
        })
    );
});