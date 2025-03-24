// APA App Script - v1.6.9.16

console.log("APA App v1.6.9.16 Loaded");

let map;
let locationMarker;
let labelLayerGroup = L.layerGroup();
let apaLines = {};
let currentLatLon = null;

function initMap() {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  labelLayerGroup.addTo(map);
  console.log("Map initialized successfully.");
}

function createLabel(latlng, labelText) {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'apa-label',
      html: labelText,
      iconSize: [80, 20],
      iconAnchor: [40, 0]
    }),
    interactive: false
  });
}

function updateLabelsVisibility() {
  const visible = map.getZoom() >= 3;
  labelLayerGroup.eachLayer(layer => {
    const el = layer.getElement();
    if (el) el.classList.toggle("hidden-label", !visible);
  });
}

function drawAPALine(fromLatLng, toLon, satName, elevation) {
  const toLatLng = L.latLng(0, toLon);
  const color = elevation >= 0 ? "#4CAF50" : "#FF5252";

  const line = L.polyline([fromLatLng, toLatLng], {
    color,
    weight: 2,
    opacity: 0.9
  }).addTo(map);

  const label = createLabel(toLatLng, satName);
  labelLayerGroup.addLayer(label);

  apaLines[satName] = { line, label };
}

function removeAPALine(satName) {
  const obj = apaLines[satName];
  if (obj) {
    map.removeLayer(obj.line);
    labelLayerGroup.removeLayer(obj.label);
    delete apaLines[satName];
  }
}

function clearAPA() {
  Object.keys(apaLines).forEach(removeAPALine);
}

function updateAPA(lat, lon) {
  clearAPA();
  currentLatLon = [lat, lon];
  const tbody = document.querySelector("#apa-table tbody");
  tbody.innerHTML = "";

  SATELLITES.forEach(sat => {
    const az = ((sat.longitude - lon + 360) % 360).toFixed(2);
    const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
    const isVisible = el >= 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" data-sat="${sat.name}" ${isVisible ? "checked" : ""}></td>
      <td>${sat.name}</td>
      <td>${sat.longitude}</td>
      <td class="${isVisible ? "" : "negative"}">${el}</td>
      <td>${az}</td>
    `;
    tbody.appendChild(row);

    if (isVisible) drawAPALine([lat, lon], sat.longitude, sat.name, el);
  });

  tbody.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const name = e.target.dataset.sat;
      const sat = SATELLITES.find(s => s.name === name);
      const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
      if (e.target.checked) {
        drawAPALine([lat, lon], sat.longitude, sat.name, el);
      } else {
        removeAPALine(name);
      }
    });
  });
}

function populateLocationDropdown() {
  const dropdown = document.getElementById("location-select");
  dropdown.innerHTML = '<option value="">Choose a location...</option>';
  LOCATIONS.forEach(loc => {
    const option = document.createElement("option");
    option.value = `${loc.latitude},${loc.longitude}`;
    option.textContent = loc.name;
    dropdown.appendChild(option);
  });
}

function handleLocationChange() {
  const dropdown = document.getElementById("location-select");
  dropdown.addEventListener("change", () => {
    const [lat, lon] = dropdown.value.split(",").map(Number);
    map.setView([lat, lon], 6);
    if (locationMarker) map.removeLayer(locationMarker);
    locationMarker = L.marker([lat, lon]).addTo(map);
    updateAPA(lat, lon);
  });
}

function setupGeolocation() {
  document.getElementById("btn-location")?.addEventListener("click", () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 6);
      if (locationMarker) map.removeLayer(locationMarker);
      locationMarker = L.marker([latitude, longitude]).addTo(map);
      updateAPA(latitude, longitude);
    }, () => alert("Failed to retrieve your location."));
  });
}

function setupToolbarToggles() {
  const toggle = id => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.toggle("visible");
  };
  document.getElementById("btn-filter")?.addEventListener("click", () => toggle("filter-panel"));
  document.getElementById("btn-custom-location")?.addEventListener("click", () => toggle("location-panel"));
  document.getElementById("btn-satellite")?.addEventListener("click", () => toggle("satellite-panel"));
}

function setupApaPanelToggle() {
  const showApaBtn = document.getElementById("show-apa-btn");
  const apaPanel = document.getElementById("apa-panel");
  document.getElementById("close-apa-panel")?.addEventListener("click", () => {
    apaPanel.classList.add("hidden");
    showApaBtn.textContent = "Show APA Table";
  });
  showApaBtn?.addEventListener("click", () => {
    apaPanel.classList.toggle("hidden");
    showApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
  });
}

function setupHelpTooltip() {
  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    document.getElementById("help-tooltip")?.classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  populateLocationDropdown();
  handleLocationChange();
  setupGeolocation();
  setupToolbarToggles();
  setupApaPanelToggle();
  setupHelpTooltip();
  map.on("zoomend", updateLabelsVisibility);
});
