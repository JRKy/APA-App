// APA App Script - v1.6.9.5
console.log("APA App v1.6.9.5 Loaded");

let map;
let siteMarker;
let lineLayers = [];
let satMarkers = [];

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const locationSelect = document.getElementById("location-select");
  const apaPanel = document.getElementById("apa-panel");
  const apaTableBody = document.querySelector("#apa-table tbody");
  const closePanelBtn = document.getElementById("close-apa-panel");
  const showApaBtn = document.getElementById("show-apa-btn");
  const helpTooltip = document.getElementById("help-tooltip");
  const hideHelpBtn = document.getElementById("hide-help-tooltip");

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

  closePanelBtn.addEventListener("click", () => {
    apaPanel.style.display = "none";
    showApaBtn.style.display = "block";
  });

  showApaBtn.addEventListener("click", () => {
    apaPanel.style.display = "block";
    showApaBtn.style.display = "none";
  });

  hideHelpBtn.addEventListener("click", () => {
    helpTooltip.classList.add("hidden");
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
        <td><input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" ${isNegative ? "" : "checked"}></td>
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

        const existing = lineLayers.find(l => l.id === id);
        if (existing) {
          map.removeLayer(existing.layer);
          lineLayers = lineLayers.filter(l => l.id !== id);
        }

        if (this.checked) {
          const el = 90 - Math.abs(lat) - Math.abs(satLon - lon);
          drawLine(lat, lon, satLon, id, el);
        }
      });

      if (cb.checked) cb.dispatchEvent(new Event("change"));
    });
  }

  function drawLine(lat, lon, satLon, label, el) {
    const color = el < 0 ? "#ff5252" : "#00bcd4";
    const polyline = L.polyline([[lat, lon], [0, satLon]], {
      color,
      weight: 2,
      opacity: 0.9
    }).addTo(map);
    polyline.bindTooltip(label, { permanent: true, direction: "center", className: "apa-line-label" });
    lineLayers.push({ id: label, layer: polyline });
  }

  function clearLines() {
    lineLayers.forEach(l => map.removeLayer(l.layer));
    lineLayers = [];
  }
});
