// Service Worker for advanced caching strategies
const CACHE_NAME = 'monkeyz-v1.0.0';
const API_CACHE = 'monkeyz-api-v1.0.0';

// Static assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/product/all',
  '/api/product/best-sellers',
  '/api/product/homepage'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      // Pre-cache important API endpoints
      caches.open(API_CACHE).then((cache) => {
        return Promise.all(
          API_CACHE_URLS.map(url => {
            return fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              // Ignore errors for pre-caching
            });
          })
        );
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== CACHE_NAME && cacheName !== API_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// API request handler with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);
  
  // For GET requests, try cache first for fast response
  if (request.method === 'GET') {
    // Check if it's a cacheable endpoint
    const isCacheable = [
      '/api/product/all',
      '/api/product/best-sellers',
      '/api/product/homepage'
    ].some(pattern => url.pathname.includes(pattern));

    if (isCacheable) {
      // Stale-while-revalidate strategy
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Return cached version immediately
        const response = cachedResponse.clone();
        
        // Update cache in background
        fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
        }).catch(() => {
          // Network error, keep using cache
        });
        
        return response;
      }
    }
  }

  // For non-cacheable or non-GET requests, go to network
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image request handler with compression
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image if available
    return cache.match('/assets/placeholder-product.svg') || 
           new Response('', { status: 404 });
  }
}

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Return cached index.html for offline support
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/') || new Response('Offline', { status: 503 });
  }
}
