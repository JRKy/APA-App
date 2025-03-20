document.addEventListener("DOMContentLoaded", function () {
    if (typeof LOCATIONS === "undefined" || !Array.isArray(LOCATIONS)) {
        console.error("Location data is missing! Check if data.js is loaded.");
        return;
    }

    console.log("Populating location dropdown...");
    const locationSelect = document.getElementById("location-select");
    const apaTableBody = document.querySelector("#apa-table tbody");
    const apaPanel = document.getElementById("apa-panel");
    const toggleApaBtn = document.getElementById("toggle-apa-btn");

    // Populate Location Dropdown
    LOCATIONS.forEach((loc) => {
        const option = document.createElement("option");
        option.value = `${loc.latitude},${loc.longitude}`;
        option.textContent = loc.name;
        locationSelect.appendChild(option);
    });

    // Handle Location Selection
    locationSelect.addEventListener("change", function () {
        const selectedValue = this.value;
        if (selectedValue) {
            const [lat, lon] = selectedValue.split(",").map(Number);
            map.setView([lat, lon], 8);
            calculateAPA(lat, lon);
        }
    });

    // Ensure APA Panel Toggles Correctly
    toggleApaBtn.addEventListener("click", () => {
        apaPanel.classList.toggle("hidden");
        toggleApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
    });

    function calculateAPA(userLat, userLon) {
        if (!SATELLITES || !Array.isArray(SATELLITES)) {
            console.error("Satellite data is missing!");
            return;
        }

        apaTableBody.innerHTML = "";

        SATELLITES.forEach((sat) => {
            const elevation = (90 - Math.abs(userLat) - Math.abs(sat.longitude - userLon)).toFixed(2);
            const azimuth = ((sat.longitude - userLon + 360) % 360).toFixed(2);

            // Create Table Row
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${sat.name}</td>
                <td>${sat.longitude}°</td>
                <td class="${elevation < 0 ? "negative" : ""}">${elevation}°</td>
                <td>${azimuth}°</td>
            `;

            apaTableBody.appendChild(row);
        });

        console.log("APA calculations updated.");
    }

    console.log("Map and location selection initialized.");
});
