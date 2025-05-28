const CACHE_NAME = 'budget-planner-cache-v2'; // Increment version if you change cached files
const urlsToCache = [
    './', // Caches the root (often index.html)
    './index.html',
    './style.css',
    './script.js',
    './icon-192x192.png', // Make sure you have these icon files
    './icon-512x512.png'  // Make sure you have these icon files
    // Add other assets like specific fonts if you self-host them
];

// Install Service Worker and cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Install completed');
                return self.skipWaiting(); // Activate worker immediately
            })
    );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation completed');
            return self.clients.claim(); // Take control of all open clients
        })
    );
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', event => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Cache hit - return response
                if (cachedResponse) {
                    // console.log('Service Worker: Returning from cache:', event.request.url);
                    return cachedResponse;
                }

                // Not in cache - fetch from network, then cache it
                // console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                // console.log('Service Worker: Cached new resource:', event.request.url);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Service Worker: Fetch failed; returning offline page instead.', error);
                    // Optionally, return a custom offline fallback page
                    // return caches.match('./offline.html');
                });
            })
    );
});