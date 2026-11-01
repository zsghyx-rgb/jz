/* 记一笔 PWA Service Worker — GitHub Pages compatible */
const SW_VERSION = "jiyibi-v3.8.0-cache-v1";
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;

// Relative paths are resolved against the GitHub Pages project path, not the domain root.
const APP_ROOT = new URL("./", self.registration.scope);
const APP_SHELL = [
  new URL("./", APP_ROOT).href,
  new URL("./index.html", APP_ROOT).href,
  new URL("./manifest.json", APP_ROOT).href
];

// Install: cache the app shell. Missing optional resources must not break installation.
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(APP_SHELL.map(async url => {
      try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (response.ok) await cache.put(url, response);
      } catch (error) {
        // Offline or a not-yet-deployed optional file: continue installing.
      }
    }));
    await self.skipWaiting();
  })());
});

// Activate: remove older versions of this app's caches only.
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("jiyibi-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache cross-origin API requests or dynamic sync endpoints.
  if (url.origin === self.location.origin) {
    // Navigation: network first, then cached page/app shell for offline launches.
    if (request.mode === "navigate") {
      event.respondWith((async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch (_) {
          return (await caches.match(request)) ||
                 (await caches.match(new URL("./index.html", APP_ROOT).href)) ||
                 (await caches.match(new URL("./", APP_ROOT).href));
        }
      })());
      return;
    }

    // Same-origin static files: cache first, refresh in the background.
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const update = fetch(request).then(async response => {
        if (response && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => null);

      if (cached) {
        event.waitUntil(update);
        return cached;
      }
      return (await update) || Response.error();
    })());
    return;
  }

  // CDN libraries/styles (Bootstrap, Bootstrap Icons, CryptoJS, Chart.js):
  // stale-while-revalidate; unrelated third-party requests are left to the browser.
  const isKnownCdn = [
    "cdn.jsdelivr.net"
  ].includes(url.hostname);

  if (isKnownCdn) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const update = fetch(request).then(async response => {
        if (response && response.ok && response.type !== "opaque") {
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => null);

      if (cached) {
        event.waitUntil(update);
        return cached;
      }
      return (await update) || Response.error();
    })());
  }
});
