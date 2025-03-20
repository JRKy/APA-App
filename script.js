document.addEventListener("DOMContentLoaded", function () {
    // Initialize Map
    const map = L.map("map").setView([20, 0], 2); // Centered at lat 20, lon 0

    // Load Tile Layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Marker Cluster Group
    const markers = L.markerClusterGroup();

    // Check if satellite data is available
    if (typeof SATELLITES !== "undefined") {
        SATELLITES.forEach((sat) => {
            const { name, longitude } = sat;
            const marker = L.marker([0, longitude]).bindPopup(`<b>${name}</b><br>Longitude: ${longitude}°`);
            markers.addLayer(marker);
        });

        map.addLayer(markers);
    } else {
        console.error("Satellite data not found in data.js");
    }

    console.log("Map initialized.");
});
