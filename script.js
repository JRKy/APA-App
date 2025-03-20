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
    const apaTableBody = document.querySelector("#apa-table tbody");

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
                calculateAPA(lat, lon);
            }
        });
    } else {
        console.error("Location data not found in data.js");
    }

    function calculateAPA(userLat, userLon) {
        apaTableBody.innerHTML = "";

        SATELLITES.forEach((sat) => {
            const satLon = sat.longitude;

            // Calculate Azimuth
            const azimuth = ((satLon - userLon + 360) % 360).toFixed(2);

            // Calculate Elevation (Simplified Formula)
            const elevation = (90 - Math.abs(userLat) - Math.abs(satLon - userLon)).toFixed(2);

            // Create Table Row
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${sat.name}</td>
                <td>${satLon}°</td>
                <td class="${elevation < 0 ? "negative" : ""}">${elevation}°</td>
                <td>${azimuth}°</td>
            `;

            apaTableBody.appendChild(row);
        });

        console.log("APA calculations updated.");
    }

    console.log("Map and APA Calculations Initialized.");
});
