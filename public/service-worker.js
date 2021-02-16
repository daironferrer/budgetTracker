const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-2';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/styles.css',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches
        .open(CACHE_NAME)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
    event.waitUntil(
        caches
        .keys()
        .then(cacheNames => 
            cacheNames.filter(cacheName => !currentCaches.includes(cacheName)))
        .then(cachesToDelete => 
            Promise.all(
                cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
            ))
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if(event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)
    ) 
    {event.respondWith(fecth(event.request));
        return;
    }

    if(event.request.url.includes('/api')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => 
            fetch(event.request)
            .then(response => {
                cache.put(event.request, response.clone());
                return response;
            })
            .catch(() => caches.match(event.request))
        )
    );
            return;
}
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return caches
            .open(DATA_CACHE_NAME)
            .then(cache => 
                fetch(event.request).then(response => 
                    cache.put(event.request, response.clone()).then(() => response)))
        })
    );

    });
