/**
 * RetroPlay Service Worker
 * Caches EmulatorJS assets and app shell for offline support.
 */

const CACHE_VERSION = 'retroplay-v1'
const EMULATORJS_CDN = 'https://cdn.emulatorjs.org/stable/data'

// App shell assets to cache on install
const APP_SHELL = [
  '/',
  '/upload',
  '/favorites',
  '/recent',
  '/settings',
]

// EmulatorJS core files to cache for offline play
const EMULATORJS_CORES = [
  `${EMULATORJS_CDN}/loader.js`,
  `${EMULATORJS_CDN}/emulator.min.js`,
  `${EMULATORJS_CDN}/emulator.css`,
  `${EMULATORJS_CDN}/cores/nes.wasm`,
  `${EMULATORJS_CDN}/cores/nes_libretro.js`,
  `${EMULATORJS_CDN}/cores/snes.wasm`,
  `${EMULATORJS_CDN}/cores/snes_libretro.js`,
  `${EMULATORJS_CDN}/cores/gb.wasm`,
  `${EMULATORJS_CDN}/cores/gb_libretro.js`,
  `${EMULATORJS_CDN}/cores/gbc.wasm`,
  `${EMULATORJS_CDN}/cores/gbc_libretro.js`,
  `${EMULATORJS_CDN}/cores/gba.wasm`,
  `${EMULATORJS_CDN}/cores/gba_libretro.js`,
  `${EMULATORJS_CDN}/cores/segaMD.wasm`,
  `${EMULATORJS_CDN}/cores/segaMD_libretro.js`,
]

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing RetroPlay service worker...')

  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Cache app shell (ignore failures for individual pages)
      const shellResults = await Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => null))
      )
      console.log('[SW] App shell cached:', shellResults.filter(r => r.status === 'fulfilled').length, '/', APP_SHELL.length)

      // Pre-cache EmulatorJS loader (always needed)
      try {
        await cache.add(`${EMULATORJS_CDN}/loader.js`)
        console.log('[SW] EmulatorJS loader cached')
      } catch (err) {
        console.warn('[SW] Could not pre-cache EmulatorJS loader (offline install?):', err)
      }

      return true
    })
  )

  // Activate immediately
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')

  event.waitUntil(
    caches.keys().then(async (keys) => {
      // Delete old cache versions
      await Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )

      // Take control of all clients
      await self.clients.claim()
      console.log('[SW] Activated and claiming clients')
    })
  )
})

// ── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip blob: and data: URLs (ROM files in memory)
  if (url.protocol === 'blob:' || url.protocol === 'data:') return

  // Skip chrome-extension and devtools
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost' && url.port === '5173') {
    // Dev server - don't intercept
    return
  }

  // EmulatorJS CDN assets — cache-first
  if (url.href.startsWith(EMULATORJS_CDN)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          console.log('[SW] Cache hit (EmulatorJS):', url.pathname)
          return cached
        }

        // Fetch and cache
        return fetch(request).then(response => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(request, cloned)
              console.log('[SW] Cached EmulatorJS asset:', url.pathname)
            })
          }
          return response
        }).catch(() => {
          console.warn('[SW] EmulatorJS asset not available offline:', url.href)
          return new Response('EmulatorJS asset not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
      })
    )
    return
  }

  // App shell (navigation requests) — network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache fresh response
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_VERSION).then(cache => cache.put(request, cloned))
          }
          return response
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request)
            .then(cached => cached || caches.match('/'))
            .then(cached => cached || new Response('App offline', { status: 503 }))
        })
    )
    return
  }

  // Static assets (JS, CSS, fonts) — cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|ico|json)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached

        return fetch(request).then(response => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_VERSION).then(cache => cache.put(request, cloned))
          }
          return response
        }).catch(() => new Response('', { status: 503 }))
      })
    )
  }
})

// ── Background Sync (future: save states to cloud) ───────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-save-states') {
    event.waitUntil(syncSaveStates())
  }
})

async function syncSaveStates() {
  console.log('[SW] Background sync: save states')
  // TODO: sync save states to Supabase when online
}

// ── Push Notifications (placeholder) ─────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'RetroPlay', {
      body: data.body || '',
      icon: '/favicon.svg',
    })
  )
})
