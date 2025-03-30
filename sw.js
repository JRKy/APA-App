const CACHE_NAME = "apa-app-cache-v1.8.1";
const OFFLINE_URL = "offline.html";
const STATIC_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=1.8.1",
  "script.js?v=1.8.1",
  "data.js?v=1.8.1",
  "manifest.json",
  OFFLINE_URL,
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.error("Cache add failed:", err));
    })
  );
  console.log("Installed SW Version: v1.8.1");
});

self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;
  if (STATIC_ASSETS.some(asset => requestUrl.includes(asset))) {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request).then((response) => response || caches.match(OFFLINE_URL)))
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(keyList.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});
