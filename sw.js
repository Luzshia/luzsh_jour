// sw.js - Service Worker para uso 100% Offline
const CACHE_NAME = 'journal-cache-v1';

// Lista de archivos que tu app necesita para arrancar. 
// ⚠️ Asegúrate de cambiar "script.js" y "style.css" por los nombres reales de tus archivos.
const ASSETS = [
    './',
    './index.html',
    './style.css',     // <-- Si tu CSS se llama diferente, cámbialo aquí
    './script.js',    // <-- Si tu JS se llama diferente, cámbialo aquí
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. Evento de Instalación: Guarda los archivos en la caché del dispositivo
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Guardando archivos esenciales en caché...');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Evento de Activación: Limpia cachés viejas si actualizas la app en el futuro
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Borrando caché antigua', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Evento Fetch: Si no hay internet, sirve los archivos desde la caché
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Si el archivo está en la caché, lo devuelve. Si no, va a buscarlo a internet.
            return cachedResponse || fetch(e.request);
        }).catch(() => {
            // Estrategia de respaldo por si todo falla (ej. estás offline y pides algo nuevo)
            return caches.match('./index.html');
        })
    );
});