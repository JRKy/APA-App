let map; // Ensure map is declared globally

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.2.0").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing map...");

    // Ensure Leaflet is loaded
    if (typeof L === "undefined") {
        console.error("Leaflet library is not loading.");
        return;
    }

    // Ensure the map div exists
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map container is missing in HTML.");
        return;
    }

    // Ensure the map div has a height
    if (mapElement.clientHeight === 0) {
        console.error("Map div has no height. Check CSS.");
        return;
    }

    // Initialize the map (Set it to global `map` variable)
    map = L.map("map").setView([20, 0], 2);

    // Load Tile Layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    console.log("Map initialized successfully.");
});
