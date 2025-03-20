document.addEventListener("DOMContentLoaded", function () {
    // Initialize Map
    const map = L.map("map").setView([20, 0], 2); // Default view

    // Load Tile Layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Marker Cluster Group for satellites
    const markers = L.markerClusterGroup();

    if (typeof SATELLITES !== "undefined") {
        SATELLITES.forEach((sat) => {
            const marker = L.marker([0, sat.longitude]).bindPopup(`<b>${sat.name}</b><br>Longitude: ${sat.longitude}°`);
            markers.addLayer(marker);
        });

        map.addLayer(markers);
    } else {
        console.error("Satellite data not found in data.js");
    }

    // Location Selection Logic
    const locationSelect = document.getElementById("location-select");

    if (typeof LOCATIONS !== "undefined") {
        LOCATIONS.forEach((loc) => {
            const option = document.createElement("option");
            option.value = `${loc.latitude},${loc.longitude}`;
            option.textContent = loc.name;
            locationSelect.appendChild(option);
        });

        locationSelect.addEventListener("change", (event) => {
            const selectedValue = event.target.value;
            if (selectedValue) {
                const [lat, lon] = selectedValue.split(",").map(Number);
                map.setView([lat, lon], 8);
            }
        });
    } else {
        console.error("Location data not found in data.js");
    }

    console.log("Map and Location Selection Initialized.");
});
