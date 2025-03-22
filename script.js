let map;
let siteMarker;
let lineLayers = [];
let satMarkers = [];

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing APA App...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

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
    if (siteMarker) map.removeLayer(siteMarker);
    clearLines();
    clearSatMarkers();

    siteMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 8);
    updateApaTable(lat, lon);
  });

  function updateApaTable(siteLat, siteLon) {
    if (!Array.isArray(SATELLITES)) return;

    tbody.innerHTML = "";
    clearLines();
    clearSatMarkers();

    SATELLITES.forEach((sat, index) => {
      const azimuth = computeAzimuth(siteLat, siteLon, sat.longitude);
      const elevation = computeElevation(siteLat, siteLon, sat.longitude);
      const isNegative = elevation < 0;
      const rowId = `sat-${index}`;

      // Add marker for satellite
      const marker = L.circleMarker([0, sat.longitude], {
        radius: 6,
        fillColor: isNegative ? "#ff5252" : "#00c853",
        color: "#333",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map).bindPopup(`
        <strong>${sat.name}</strong><br/>
        El: ${elevation.toFixed(2)}°<br/>
        Az: ${azimuth.toFixed(2)}°
      `);

      satMarkers.push(marker);

      // APA table row
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" id="${rowId}" data-lat="${siteLat}" data-lon="${siteLon}" data-satlon="${sat.longitude}" ${isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${elevation.toFixed(2)}</td>
        <td>${azimuth.toFixed(2)}</td>
      `;

      tbody.appendChild(row);

      if (!isNegative) {
        drawLine(siteLat, siteLon, sat.longitude, sat.name, rowId, elevation);
      }
    });

    tbody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", function () {
        const id = this.id;
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        const satLon = parseFloat(this.dataset.satlon);

        if (this.checked) {
          const elevation = computeElevation(lat, lon, satLon);
          drawLine(lat, lon, satLon, id.replace("sat-", "SAT-"), id, elevation);
        } else {
          const line = lineLayers.find(l => l.id === id);
          if (line) {
            map.removeLayer(line.layer);
            lineLayers = lineLayers.filter(l => l.id !== id);
          }
        }
      });
    });
  }

  function drawLine(lat, lon, satLon, label, id, elevation) {
    const color = elevation < 0 ? "#ff5252" : "#00bcd4";
    const polyline = L.polyline([[lat, lon], [0, satLon]], {
      color,
      weight: 2,
      opacity: 0.9
    }).addTo(map);

    polyline.bindTooltip(`${label}`, {
      permanent: true,
      direction: "center",
      className: "apa-line-label"
    });

    lineLayers.push({ id, layer: polyline });
  }

  function clearLines() {
    lineLayers.forEach(line => map.removeLayer(line.layer));
    lineLayers = [];
  }

  function clearSatMarkers() {
    satMarkers.forEach(m => map.removeLayer(m));
    satMarkers = [];
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
    const Re = 6378.137;
    const h = 35786;
    const φ = (lat * Math.PI) / 180;
    const Δλ = ((satLon - lon) * Math.PI) / 180;
    const slat = Math.cos(φ) * Math.cos(Δλ);
    const elevation = Math.atan((Math.cos(φ) * Math.cos(Δλ) - (Re / (Re + h))) / Math.sqrt(1 - slat ** 2)) * (180 / Math.PI);
    return elevation;
  }
});
