// APA App Script - v1.6.9.14

console.log("APA App v1.6.9.14 Loaded");

let map;
let locationMarker;
let labelLayerGroup = L.layerGroup();
let apaLines = {};
let currentLatLon = null;

function initMap() {
  console.log("Initializing map...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  labelLayerGroup.addTo(map);

  console.log("Map initialized successfully.");
}

function createLabel(latlng, name) {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'apa-label',
      html: name,
      iconSize: [80, 20],
      iconAnchor: [40, 0]
    }),
    interactive: false
  });
}

function drawAPALine(fromLatLng, toLon, satName, elevation) {
  const toLatLng = L.latLng(0, toLon);
  const color = elevation >= 0 ? "#4CAF50" : "#FF5252";

  const line = L.polyline([fromLatLng, toLatLng], {
    color,
    weight: 2,
    opacity: 0.8
  }).addTo(map);

  const label = createLabel(toLatLng, satName);
  labelLayerGroup.addLayer(label);

  apaLines[satName] = { line, label };
}

function clearAPA() {
  Object.values(apaLines).forEach(({ line, label }) => {
    map.removeLayer(line);
    labelLayerGroup.removeLayer(label);
  });
  apaLines = {};
}

function updateAPA(lat, lon) {
  clearAPA();
  currentLatLon = [lat, lon];

  SATELLITES.forEach((sat, i) => {
    const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
    drawAPALine([lat, lon], sat.longitude, sat.name, parseFloat(el));
  });
}

function populateLocationDropdown() {
  const dropdown = document.getElementById("location-select");
  LOCATIONS.forEach(loc => {
    const option = document.createElement("option");
    option.value = `${loc.latitude},${loc.longitude}`;
    option.textContent = loc.name;
    dropdown.appendChild(option);
  });
}

function handleLocationSelect() {
  const dropdown = document.getElementById("location-select");
  dropdown.addEventListener("change", () => {
    const [lat, lon] = dropdown.value.split(",").map(Number);
    map.setView([lat, lon], 5);

    if (locationMarker) map.removeLayer(locationMarker);
    locationMarker = L.marker([lat, lon]).addTo(map);

    updateAPA(lat, lon);
  });
}

function setupGeolocation() {
  const btn = document.getElementById("btn-location");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 6);

      if (locationMarker) map.removeLayer(locationMarker);
      locationMarker = L.marker([latitude, longitude]).addTo(map);

      updateAPA(latitude, longitude);
    }, err => {
      alert("Unable to get location.");
    });
  });
}

function setupToolbarToggles() {
  const toggle = (id) => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.toggle("visible");
  };

  document.getElementById("btn-filter")?.addEventListener("click", () => toggle("filter-panel"));
  document.getElementById("btn-custom-location")?.addEventListener("click", () => toggle("location-panel"));
  document.getElementById("btn-satellite")?.addEventListener("click", () => toggle("satellite-panel"));
}

function setupHelpTooltip() {
  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    document.getElementById("help-tooltip")?.classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  populateLocationDropdown();
  handleLocationSelect();
  setupGeolocation();
  setupToolbarToggles();
  setupHelpTooltip();

  console.log("APA system ready.");
});
