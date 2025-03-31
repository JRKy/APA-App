const CACHE_NAME = "apa-app-cache-v2.0.0";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "index.html",
        "styles.css?v=2.0.0",
        "data.js?v=2.0.0",
        "js/main.js?v=2.0.0",
        "js/modules/core/config.js",
        "js/modules/core/utils.js",
        "js/modules/core/events.js",
        "js/modules/ui/map.js",
        "js/modules/ui/panels.js",
        "js/modules/ui/drawers.js",
        "js/modules/ui/table.js",
        "js/modules/ui/polarPlot.js",
        "js/modules/ui/tutorial.js",
        "js/modules/ui/filters.js",
        "js/modules/ui/legend.js",
        "js/modules/data/storage.js",
        "js/modules/data/satellites.js",
        "js/modules/data/locations.js",
        "js/modules/calculations/angles.js",
        "js/modules/calculations/visibility.js",
        "manifest.json",
        "icons/icon-192.png",
        "icons/icon-512.png",
        OFFLINE_URL,
      ]);
    })
  );
  console.log("Installed SW Version: v2.0.0");
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