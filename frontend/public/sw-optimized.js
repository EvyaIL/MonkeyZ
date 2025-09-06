// Ultra-Fast Service Worker for MonkeyZ
const CACHE_NAME = 'monkeyz-v4.0';
const API_CACHE_NAME = 'monkeyz-api-v4.0';
const IMAGE_CACHE_NAME = 'monkeyz-images-v4.0';

// Critical resources for immediate caching
const PRECACHE_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png'
];

// API patterns for intelligent caching
const API_PATTERNS = [
  { pattern: /\/api\/product\/best-sellers/, ttl: 300000 }, // 5 minutes
  { pattern: /\/api\/product\/homepage/, ttl: 300000 },    // 5 minutes
  { pattern: /\/api\/product\/all/, ttl: 600000 },         // 10 minutes
  { pattern: /\/api\/product\/\w+$/, ttl: 900000 },        // 15 minutes
  { pattern: /\/api\/user\/profile/, ttl: 60000 }          // 1 minute
];

// Performance metrics
let networkResponseTimes = [];
let cacheHits = 0;
let cacheMisses = 0;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('Caching static resources...');
        return cache.addAll(PRECACHE_RESOURCES);
      }),
      caches.open(API_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes('v4.0')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different resource types
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Optimized API request handler
async function handleAPIRequest(request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const cacheKey = request.url;
  
  // Find matching pattern and TTL
  const apiConfig = API_PATTERNS.find(({ pattern }) => pattern.test(url.pathname));
  const ttl = apiConfig?.ttl || 300000;
  
  try {
    // Check cache first for API requests with valid TTL
    const cachedResponse = await caches.match(request);
    if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
      cacheHits++;
      return cachedResponse;
    }
    
    // Network request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      const responseToCache = response.clone();
      
      // Add metadata for TTL checking
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
    }
    
    // Record performance metrics
    const responseTime = Date.now() - startTime;
    networkResponseTimes.push(responseTime);
    if (networkResponseTimes.length > 100) {
      networkResponseTimes = networkResponseTimes.slice(-50);
    }
    
    cacheMisses++;
    return response;
    
  } catch (error) {
    console.log('API request failed:', request.url, error);
    
    // Return stale cache as fallback
    const staleResponse = await caches.match(request);
    if (staleResponse) {
      console.log('Returning stale cache for:', request.url);
      return staleResponse;
    }
    
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Optimized image handler with WebP support
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background for images
    updateImageCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Image not available', { status: 503 });
  }
}

// Static asset handler with aggressive caching
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Asset not available', { status: 503 });
  }
}

// Page request handler
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached offline page or basic offline response
    const offlinePage = await caches.match('/');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname) ||
         url.pathname.includes('/images/') ||
         url.pathname.includes('/assets/');
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/static/') ||
         /\.(js|css|woff|woff2|ttf)$/i.test(url.pathname);
}

function isCacheValid(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  return age < ttl;
}

async function updateImageCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    console.log('Background image update failed:', request.url);
  }
}

// Cache management
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_STATS') {
    const avgResponseTime = networkResponseTimes.length > 0 
      ? networkResponseTimes.reduce((a, b) => a + b, 0) / networkResponseTimes.length 
      : 0;
    
    event.ports[0].postMessage({
      cacheHits,
      cacheMisses,
      avgResponseTime: Math.round(avgResponseTime),
      hitRate: Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) || 0
    });
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Periodic cache cleanup
setInterval(() => {
  cleanupExpiredCache();
}, 10 * 60 * 1000); // Every 10 minutes

async function cleanupExpiredCache() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && !isCacheValid(response, 3600000)) { // 1 hour max age
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.log('Cache cleanup failed:', error);
  }
}

console.log('Ultra-Fast Service Worker v4.0 loaded successfully');
