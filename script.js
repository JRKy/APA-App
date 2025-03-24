// APA App Script - v1.6.9.7
console.log("APA App v1.6.9.7 Loaded");

let map;
let siteMarker;
let lineLayers = [];

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing map...");
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  console.log("Map initialized successfully.");

  const locationSelect = document.getElementById("location-select");
  const apaPanel = document.getElementById("apa-panel");
  const apaTableBody = document.querySelector("#apa-table tbody");
  const closePanelBtn = document.getElementById("close-apa-panel");
  const showApaBtn = document.getElementById("show-apa-btn");
  const helpTooltip = document.getElementById("help-tooltip");

  const filterPanel = document.getElementById("filter-panel");
  const locationPanel = document.getElementById("location-panel");
  const satellitePanel = document.getElementById("satellite-panel");

  const btnLocation = document.getElementById("btn-location");
  const btnFilter = document.getElementById("btn-filter");
  const btnCustomLocation = document.getElementById("btn-custom-location");
  const btnSatellite = document.getElementById("btn-satellite");

  function hideAllPanels() {
    filterPanel.style.display = "none";
    locationPanel.style.display = "none";
    satellitePanel.style.display = "none";
  }

  btnLocation.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          goToLocation(lat, lon);
        },
        (err) => {
          alert("Failed to get location: " + err.message);
        }
      );
    } else {
      alert("Geolocation is not supported.");
    }
  });

  btnFilter.addEventListener("click", () => {
    const isVisible = filterPanel.style.display === "block";
    hideAllPanels();
    filterPanel.style.display = isVisible ? "none" : "block";
  });

  btnCustomLocation.addEventListener("click", () => {
    const isVisible = locationPanel.style.display === "block";
    hideAllPanels();
    locationPanel.style.display = isVisible ? "none" : "block";
  });

  btnSatellite.addEventListener("click", () => {
    const isVisible = satellitePanel.style.display === "block";
    hideAllPanels();
    satellitePanel.style.display = isVisible ? "none" : "block";
  });

  closePanelBtn.addEventListener("click", () => {
    apaPanel.style.display = "none";
    showApaBtn.style.display = "block";
  });

  showApaBtn.addEventListener("click", () => {
    apaPanel.style.display = "block";
    showApaBtn.style.display = "none";
  });

  document.getElementById("hide-help-tooltip").addEventListener("click", () => {
    helpTooltip.classList.add("hidden");
  });

  document.getElementById("reset-filters").addEventListener("click", () => {
    document.getElementById("aor-filter").value = "";
    document.getElementById("country-filter").value = "";
    locationSelect.value = "";
    apaTableBody.innerHTML = "";
    clearLines();
  });

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
    goToLocation(lat, lon);
  });

  document.getElementById("custom-location-btn").addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("custom-lat").value);
    const lon = parseFloat(document.getElementById("custom-lon").value);
    if (!isNaN(lat) && !isNaN(lon)) {
      goToLocation(lat, lon);
    }
  });

  document.getElementById("add-satellite-btn").addEventListener("click", () => {
    const name = document.getElementById("sat-name").value.trim();
    const lon = parseFloat(document.getElementById("sat-lon").value);
    if (name && !isNaN(lon)) {
      SATELLITES.push({ name, longitude: lon });
      const selectedValue = locationSelect.value;
      if (selectedValue) {
        const [lat, lon] = selectedValue.split(",").map(Number);
        updateApaTable(lat, lon);
      }
    }
  });

  function goToLocation(lat, lon) {
    map.setView([lat, lon], 8);
    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    apaPanel.style.display = "block";
    showApaBtn.style.display = "none";
    updateApaTable(lat, lon);
  }

  function updateApaTable(lat, lon) {
    apaTableBody.innerHTML = "";
    clearLines();

    SATELLITES.forEach((sat, idx) => {
      const az = ((sat.longitude - lon + 360) % 360).toFixed(2);
      const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
      const isNegative = el < 0;

      const row = document.createElement("tr");
      const id = `sat-${idx}`;
      row.innerHTML = `
        <td><input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${el}</td>
        <td>${az}</td>
      `;
      apaTableBody.appendChild(row);
    });

    apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", function () {
        const id = this.id;
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        const satLon = parseFloat(this.dataset.satlon);
        const name = this.dataset.name;

        const existing = lineLayers.find(l => l.id === id);
        if (existing) {
          map.removeLayer(existing.layer);
          lineLayers = lineLayers.filter(l => l.id !== id);
        }

        if (this.checked) {
          const el = 90 - Math.abs(lat) - Math.abs(satLon - lon);
          drawLine(lat, lon, satLon, name, el, id);
        }
      });

      if (cb.checked) cb.dispatchEvent(new Event("change"));
    });
  }

  function drawLine(lat, lon, satLon, label, el, id) {
    const color = el < 0 ? "#ff5252" : "#00bcd4";
    const polyline = L.polyline([[lat, lon], [0, satLon]], {
      color,
      weight: 2,
      opacity: 0.9
    }).addTo(map);
    polyline.bindTooltip(label, {
      permanent: true,
      direction: "center",
      className: "apa-line-label"
    });
    lineLayers.push({ id, layer: polyline });
  }

  function clearLines() {
    lineLayers.forEach(l => map.removeLayer(l.layer));
    lineLayers = [];
  }
});
