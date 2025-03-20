const CACHE_VERSION = "1.0.0";
const CACHE_NAME = `apa-app-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/APA-App/",
  "/APA-App/index.html",
  "/APA-App/styles.css",
  "/APA-App/script.js",
  "/APA-App/manifest.json",
  "/APA-App/icons/icon-192.png",
  "/APA-App/icons/icon-512.png",
  "/APA-App/favicon.ico",
  "/APA-App/offline.html"
];

// Install Service Worker & Cache Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error("Cache error:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker & Cleanup Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch & Serve Cached Content (Offline Support)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        return caches.match("/APA-App/offline.html");
      });
    })
  );
});
