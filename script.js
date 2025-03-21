let map;
let apaLines = {}; // Stores L.LayerGroup keyed by satellite name

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.3.0").then((registration) => {
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

    toggleApaBtn.addEventListener("click", () => {
        apaPanel.classList.toggle("hidden");
        toggleApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
    });

    locationSelect.addEventListener("change", function () {
        const selectedValue = this.value;
        if (selectedValue) {
            const [lat, lon] = selectedValue.split(",").map(Number);
            console.log(`Zooming to location: ${lat}, ${lon}`);
            map.setView([lat, lon], 8);
            clearApaLines();
            calculateAPA(lat, lon);
        }
    });

    function clearApaLines() {
        Object.values(apaLines).forEach(group => group.remove());
        apaLines = {};
    }

    function calculateAPA(lat, lon) {
        if (!Array.isArray(SATELLITES)) {
            console.error("Satellite data is missing!");
            return;
        }

        apaTableBody.innerHTML = "";

        SATELLITES.forEach((sat) => {
            const azimuth = ((sat.longitude - lon + 360) % 360).toFixed(2);
            const elevation = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
            const isNegative = elevation < 0;

            const row = document.createElement("tr");

            // Checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.dataset.satId = sat.name;

            const checkboxCell = document.createElement("td");
            checkboxCell.appendChild(checkbox);

            const nameCell = document.createElement("td");
            nameCell.textContent = sat.name;

            const lonCell = document.createElement("td");
            lonCell.textContent = `${sat.longitude}°`;

            const elCell = document.createElement("td");
            elCell.textContent = `${elevation}°`;
            if (isNegative) elCell.classList.add("negative");

            const azCell = document.createElement("td");
            azCell.textContent = `${azimuth}°`;

            row.appendChild(checkboxCell);
            row.appendChild(nameCell);
            row.appendChild(lonCell);
            row.appendChild(elCell);
            row.appendChild(azCell);
            apaTableBody.appendChild(row);

            // Draw line and label
            const from = [lat, lon];
            const to = [0, sat.longitude];
            const color = isNegative ? "#FF5252" : "#4CAF50";

            const line = L.polyline([from, to], {
                color,
                weight: 2,
                opacity: 0.8
            });

            const label = L.marker(to, {
                icon: L.divIcon({
                    className: 'apa-label',
                    html: `<span style="color:${color}; font-size:12px;">${sat.name}</span>`,
                    iconSize: [100, 20]
                }),
                interactive: false
            });

            const group = L.layerGroup([line, label]).addTo(map);
            apaLines[sat.name] = group;

            checkbox.addEventListener("change", function () {
                const key = this.dataset.satId;
                if (apaLines[key]) {
                    if (this.checked) {
                        apaLines[key].addTo(map);
                    } else {
                        apaLines[key].remove();
                    }
                }
            });
        });

        console.log("APA table and satellite lines updated.");
    }
});
