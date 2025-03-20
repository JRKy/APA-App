document.addEventListener("DOMContentLoaded", function () {
    // Initialize Map
    const map = L.map("map").setView([20, 0], 2);

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
    }

    // Location Selection Logic
    const locationSelect = document.getElementById("location-select");
    const apaTableBody = document.querySelector("#apa-table tbody");
    const apaPanel = document.getElementById("apa-panel");
    const toggleApaBtn = document.getElementById("toggle-apa");

    toggleApaBtn.addEventListener("click", () => {
        apaPanel.classList.toggle("hidden");
        toggleApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
    });

    locationSelect.addEventListener("change", function () {
        const [lat, lon] = this.value.split(",").map(Number);
        map.setView([lat, lon], 8);
    });
});
