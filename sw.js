const CACHE_VERSION = "v1.1.2"; // Increment this to force refresh
const CACHE_NAME = `apa-app-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/APA-App/",
  "/APA-App/index.html?v=1.1.2",
  "/APA-App/styles.css?v=1.1.2",
  "/APA-App/script.js?v=1.1.2",
  "/APA-App/data.js?v=1.1.2",
  "/APA-App/manifest.json",
  "/APA-App/icons/icon-192.png",
  "/APA-App/icons/icon-512.png",
  "/APA-App/favicon.ico",
  "/APA-App/offline.html"
];

// Install Service Worker & Cache New Version
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

// Activate Service Worker & Delete Old Caches
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

// Fetch Handler: Always Check Network First
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(event.request)) // If offline, use cache
  );
});

// Notify Users When a New Version is Available
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
