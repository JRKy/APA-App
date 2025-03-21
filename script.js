let map; // Ensure map is global

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.2.4").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing map...");

    if (typeof L === "undefined") {
        console.error("Leaflet library is not loading.");
        return;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement || mapElement.clientHeight === 0) {
        console.error("Map div has no height. Check CSS.");
        return;
    }

    map = L.map("map").setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    console.log("Map initialized successfully.");

    const locationSelect = document.getElementById("location-select");
    const apaPanel = document.getElementById("apa-panel");
    const toggleApaBtn = document.getElementById("toggle-apa-btn");
    const apaTableBody = document.querySelector("#apa-table tbody");

    if (typeof LOCATIONS === "undefined" || !Array.isArray(LOCATIONS)) {
        console.error("Location data is missing!");
        return;
    }

    console.log("Populating location dropdown...");
    LOCATIONS.forEach((loc) => {
        const option = document.createElement("option");
        option.value = `${loc.latitude},${loc.longitude}`;
        option.textContent = loc.name;
        locationSelect.appendChild(option);
    });

    console.log("Location dropdown populated.");

    // APA Toggle
    toggleApaBtn.addEventListener("click", () => {
        apaPanel.classList.toggle("hidden");
        toggleApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
        console.log("APA Table toggled:", !apaPanel.classList.contains("hidden"));
    });

    // Location selection & APA calculation
    locationSelect.addEventListener("change", function () {
        const selectedValue = this.value;
        if (selectedValue) {
            const [lat, lon] = selectedValue.split(",").map(Number);
            console.log(`Zooming to location: ${lat}, ${lon}`);
            map.setView([lat, lon], 8);
            calculateAPA(lat, lon);
        }
    });

    function calculateAPA(lat, lon) {
        if (!Array.isArray(SATELLITES)) {
            console.error("Satellite data is missing!");
            return;
        }

        apaTableBody.innerHTML = ""; // Clear old rows

        SATELLITES.forEach((sat) => {
            const azimuth = ((sat.longitude - lon + 360) % 360).toFixed(2);
            const elevation = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
            const isNegative = elevation < 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${sat.name}</td>
                <td>${sat.longitude}°</td>
                <td class="${isNegative ? "negative" : ""}">${elevation}°</td>
                <td>${azimuth}°</td>
            `;
            apaTableBody.appendChild(row);
        });

        console.log("APA table updated for selected location.");
    }
});
