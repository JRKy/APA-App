const CACHE_NAME = "apa-app-cache-v1.7.0";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "index.html",
        "styles.css?v=1.7.0",
        "script.js?v=1.7.0",
        "data.js?v=1.7.0",
        "manifest.json",
        OFFLINE_URL,
      ]);
    })
  );
  console.log("Installed SW Version: v1.7.0");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match(OFFLINE_URL)))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(keyList.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});
