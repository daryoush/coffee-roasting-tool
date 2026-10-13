const CACHE_NAME = 'roast-commander-v1.5.0';
const STATIC_ASSETS = [
  '/styles.css',
  '/js/state.js',
  '/js/utils.js',
  '/js/profile.js',
  '/js/chart.js',
  '/js/speech.js',
  '/js/roast.js',
  '/js/app.js'
];

// Install: cache static assets (but NOT index.html)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch: always fetch index.html fresh, use cache for static assets
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Always fetch HTML files from network (never cache HTML)
  if(event.request.destination === 'document' || url.pathname.endsWith('.html')){
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For other assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});
