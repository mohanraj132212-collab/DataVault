const CACHE_NAME = 'datavault-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/dashboard.html',
  '/css/style.css',
  '/css/components.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/js/firebase-config.js',
  '/js/ui.js',
  '/js/auth.js',
  '/js/upload.js',
  '/js/items.js',
  '/js/notes.js',
  '/js/visiting-card.js',
  '/js/search.js',
  '/js/dashboard.js',
  '/js/app.js',
  '/assets/logo.svg',
  '/manifest.json'
];

// Install Event - Cache Static App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve App Shell offline, Network-first strategy for dynamic resources
// EXCLUDE Cloudinary media URLs & Firestore API calls from offline storage for privacy/security
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip caching third-party auth, firestore, and cloudinary user media URLs
  if (
    requestUrl.hostname.includes('cloudinary.com') ||
    requestUrl.hostname.includes('firestore.googleapis.com') ||
    requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
    requestUrl.hostname.includes('firebase')
  ) {
    return; // Pass through to network
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background refresh for static shell
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Offline Fallback for HTML navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard.html') || caches.match('/index.html');
        }
      });
    })
  );
});
