// ASTRA Offline-First Service Worker
// Version: astra-cache-v1.0.0

const CACHE_NAME = 'astra-cinematic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/favicon.ico',
  '/assets/video/astra-hero.mp4',
  '/assets/video/hackthon video.mp4'
];

// 1. INSTALLATION: Pre-cache core shell and video asset
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add assets individually so one failure does not break the entire service worker
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Pre-cache warning for ${asset}:`, err);
        }
      }
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATION: Clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH HANDLER: Cache-first with HTTP Range Request Support for Video
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Check if this is a media request with a Range header
  if (request.headers.get('range')) {
    event.respondWith(handleRangeRequest(request));
    return;
  }

  // Standard Cache-First Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

/**
 * Handles HTTP 206 Partial Content Range requests for video and audio
 * Ensures smooth video seeking and continuous looping offline without stutter
 */
async function handleRangeRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  let response = await cache.match(request.url);

  if (!response) {
    try {
      response = await fetch(request);
      return response;
    } catch (err) {
      console.error('[SW] Range request offline fetch failure:', err);
    }
  }

  if (!response) {
    return new Response('Media Not Available Offline', { status: 404 });
  }

  const rangeHeader = request.headers.get('range');
  const buffer = await response.arrayBuffer();
  const totalLength = buffer.byteLength;

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

  if (start >= totalLength || end >= totalLength) {
    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: {
        'Content-Range': `bytes */${totalLength}`
      }
    });
  }

  const slicedBuffer = buffer.slice(start, end + 1);

  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${totalLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': slicedBuffer.byteLength,
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4'
    }
  });
}
