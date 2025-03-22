let map;
let siteMarker;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing APA App...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // === Leaflet APA Control ===
  L.Control.APA = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-control apa-control");

      container.innerHTML = `
        <div class="apa-panel-header">
          <h4 style="margin:0;">APA Table</h4>
          <button id="toggle-apa-collapse" title="Collapse">−</button>
        </div>
        <div id="apa-table-wrapper">
          <table id="apa-table">
            <thead>
              <tr>
                <th>Show</th>
                <th>Satellite</th>
                <th>Lon (°)</th>
                <th>El (°)</th>
                <th>Az (°)</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;

      container.querySelector("#toggle-apa-collapse").addEventListener("click", () => {
        const wrapper = container.querySelector("#apa-table-wrapper");
        const btn = container.querySelector("#toggle-apa-collapse");
        const isCollapsed = wrapper.style.display === "none";
        wrapper.style.display = isCollapsed ? "block" : "none";
        btn.textContent = isCollapsed ? "−" : "+";
      });

      return container;
    }
  });

  map.addControl(new L.Control.APA({ position: "topright" }));

  const tbody = document.querySelector("#apa-table tbody");
  const locationSelect = document.getElementById("location-select");

  // Populate dropdown
  if (typeof LOCATIONS !== "undefined") {
    LOCATIONS.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = `${loc.latitude},${loc.longitude}`;
      opt.textContent = loc.name;
      locationSelect.appendChild(opt);
    });
  }

  locationSelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",").map(Number);
    if (siteMarker) {
      map.removeLayer(siteMarker);
    }
    siteMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 8);
    console.log(`Zoomed to location: ${lat}, ${lon}`);
    updateApaTable(lat, lon);
  });

  function updateApaTable(siteLat, siteLon) {
    if (!Array.isArray(SATELLITES)) {
      console.error("SATELLITES data not loaded.");
      return;
    }

    tbody.innerHTML = ""; // Clear previous results

    SATELLITES.forEach(sat => {
      const azimuth = computeAzimuth(siteLat, siteLon, sat.longitude);
      const elevation = computeElevation(siteLat, siteLon, sat.longitude);
      const isNegative = elevation < 0;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" checked></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${elevation.toFixed(2)}</td>
        <td>${azimuth.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    console.log("APA table updated.");
  }

  function computeAzimuth(lat, lon, satLon) {
    const φ = (lat * Math.PI) / 180;
    const Δλ = ((satLon - lon) * Math.PI) / 180;
    const y = Math.sin(Δλ);
    const x = Math.cos(φ) * Math.tan(0) - Math.sin(φ) * Math.cos(Δλ);
    let az = Math.atan2(y, x) * (180 / Math.PI);
    az = (az + 360) % 360;
    return az;
  }

  function computeElevation(lat, lon, satLon) {
    const Re = 6378.137; // Earth radius (km)
    const h = 35786;     // Geostationary satellite altitude (km)
    const φ = (lat * Math.PI) / 180;
    const Δλ = ((satLon - lon) * Math.PI) / 180;

    const slat = Math.cos(φ) * Math.cos(Δλ);
    const sdist = Math.sqrt(1 + (h / Re) ** 2 - 2 * (h / Re) * slat);

    const elevation = Math.atan((Math.cos(φ) * Math.cos(Δλ) - (Re / (Re + h))) / Math.sqrt(1 - slat ** 2)) * (180 / Math.PI);
    return elevation;
  }
});
