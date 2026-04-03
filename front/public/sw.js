// SarkariAfsar Service Worker v1.0
const CACHE_VERSION = 'sa-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/jobs',
  '/results',
  '/admit-cards',
  '/latest-jobs',
  '/yojana',
  '/blog',
  '/manifest.json',
  '/icons/icon.svg',
]

// ──────────────────────────────────────────
// Install: pre-cache shell
// ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

// ──────────────────────────────────────────
// Activate: remove old caches
// ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('sa-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ──────────────────────────────────────────
// Fetch strategy
// ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // ── API calls: Network-first with short cache fallback ──
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/og') && !url.pathname.startsWith('/api/icon')) {
    event.respondWith(networkFirst(request, API_CACHE, 30))
    return
  }

  // ── Next.js static assets (_next/static): Cache-first (immutable) ──
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // ── OG images and icon API: Cache-first (stable generated images) ──
  if (url.pathname.startsWith('/api/og') || url.pathname.startsWith('/api/icon')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE))
    return
  }

  // ── HTML navigation: Network-first, fallback to cache ──
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 0))
    return
  }

  // ── Everything else: Stale-while-revalidate ──
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
})

// ──────────────────────────────────────────
// Strategies
// ──────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Return offline fallback for navigation
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match('/')
      if (fallback) return fallback
    }
    return new Response('Offline — Please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => cached)
  return cached || fetchPromise
}
