// APA App Script - v1.6.9.15

console.log("APA App v1.6.9.15 Loaded");

let map;
let locationMarker;
let labelLayerGroup = L.layerGroup();
let apaLines = {};
let apaTable = null;
let showApaBtn = null;
let apaPanel = null;

function initMap() {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  labelLayerGroup.addTo(map);
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

function drawLine(fromLatLng, toLon, name, el) {
  const toLatLng = L.latLng(0, toLon);
  const color = el >= 0 ? "#4CAF50" : "#FF5252";

  const line = L.polyline([fromLatLng, toLatLng], {
    color,
    weight: 2,
    opacity: 0.85
  }).addTo(map);

  const label = createLabel(toLatLng, name);
  labelLayerGroup.addLayer(label);

  apaLines[name] = { line, label };
}

function removeLine(name) {
  const obj = apaLines[name];
  if (obj) {
    map.removeLayer(obj.line);
    labelLayerGroup.removeLayer(obj.label);
    delete apaLines[name];
  }
}

function clearAPA() {
  Object.keys(apaLines).forEach(name => removeLine(name));
}

function updateAPA(lat, lon) {
  clearAPA();
  apaTable.querySelector("tbody").innerHTML = "";

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
    apaTable.querySelector("tbody").appendChild(row);

    if (isVisible) drawLine([lat, lon], sat.longitude, sat.name, el);
  });
}

function handleCheckboxEvents(lat, lon) {
  apaTable.addEventListener("change", (e) => {
    const cb = e.target;
    if (cb.tagName === "INPUT" && cb.type === "checkbox") {
      const name = cb.dataset.sat;
      const sat = SATELLITES.find(s => s.name === name);
      const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(2);
      if (cb.checked) {
        drawLine([lat, lon], sat.longitude, sat.name, el);
      } else {
        removeLine(name);
      }
    }
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

function setupLocationDropdown() {
  const dropdown = document.getElementById("location-select");
  dropdown.addEventListener("change", () => {
    const [lat, lon] = dropdown.value.split(",").map(Number);
    map.setView([lat, lon], 6);

    if (locationMarker) map.removeLayer(locationMarker);
    locationMarker = L.marker([lat, lon]).addTo(map);

    updateAPA(lat, lon);
    handleCheckboxEvents(lat, lon);
  });
}

function setupToolbar() {
  document.getElementById("btn-filter")?.addEventListener("click", () => {
    document.getElementById("filter-panel")?.classList.toggle("visible");
  });
  document.getElementById("btn-custom-location")?.addEventListener("click", () => {
    document.getElementById("location-panel")?.classList.toggle("visible");
  });
  document.getElementById("btn-satellite")?.addEventListener("click", () => {
    document.getElementById("satellite-panel")?.classList.toggle("visible");
  });
}

function setupGeolocation() {
  const btn = document.getElementById("btn-location");
  btn?.addEventListener("click", () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 6);

      if (locationMarker) map.removeLayer(locationMarker);
      locationMarker = L.marker([latitude, longitude]).addTo(map);

      updateAPA(latitude, longitude);
      handleCheckboxEvents(latitude, longitude);
    });
  });
}

function setupHelpTooltip() {
  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    document.getElementById("help-tooltip")?.classList.add("hidden");
  });
}

function setupApaPanel() {
  showApaBtn = document.getElementById("show-apa-btn");
  apaPanel = document.getElementById("apa-panel");
  apaTable = document.getElementById("apa-table");

  showApaBtn.addEventListener("click", () => {
    apaPanel.classList.toggle("hidden");
    showApaBtn.textContent = apaPanel.classList.contains("hidden") ? "Show APA Table" : "Hide APA Table";
  });

  document.getElementById("close-apa-panel").addEventListener("click", () => {
    apaPanel.classList.add("hidden");
    showApaBtn.textContent = "Show APA Table";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  populateLocationDropdown();
  setupLocationDropdown();
  setupToolbar();
  setupGeolocation();
  setupHelpTooltip();
  setupApaPanel();
});
