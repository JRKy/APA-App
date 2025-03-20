const CACHE_VERSION = "v1.1.5"; // Increment for new updates
const CACHE_NAME = `apa-app-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/APA-App/",
  "/APA-App/index.html?v=1.1.5",
  "/APA-App/styles.css?v=1.1.5",
  "/APA-App/script.js?v=1.1.5",
  "/APA-App/data.js?v=1.1.5",
  "/APA-App/manifest.json",
  "/APA-App/icons/icon-192.png",
  "/APA-App/icons/icon-512.png",
  "/APA-App/favicon.ico",
  "/APA-App/offline.html"
];

// Install and cache new version
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Activate new worker immediately
});

// Activate and remove old caches
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

// Fetch fresh content when online, fallback to cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(event.request))
  );
});

// Ensure new service worker activates immediately
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
