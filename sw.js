const CACHE_VERSION = "v1.1.0"; // Increment this when updating files
const CACHE_NAME = `apa-app-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/APA-App/",
  "/APA-App/index.html",
  "/APA-App/styles.css",
  "/APA-App/script.js",
  "/APA-App/data.js",
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
  self.skipWaiting(); // Activate new worker immediately
});

// Activate Service Worker & Remove Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch & Serve Cached Content (With Version Checking)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

// Force Page Refresh When a New Version is Available
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
