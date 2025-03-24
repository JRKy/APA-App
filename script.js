// APA App Script - v1.6.9.14

console.log("APA App v1.6.9.14 Loaded");

let map;
let satelliteLines = {};
let satelliteMarkers = {};
let labelLayerGroup;

function createLabel(latlng, labelText) {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'apa-label',
      html: labelText,
      iconSize: [100, 20],
      iconAnchor: [50, 0]
    }),
    interactive: false
  });
}

function updateLabelsVisibility() {
  const zoom = map.getZoom();
  const visible = zoom >= 3;
  labelLayerGroup.eachLayer(layer => {
    const el = layer.getElement();
    if (el) {
      el.classList.toggle("hidden-label", !visible);
    }
  });
}

function getSatelliteIcon(elevation) {
  const color = elevation >= 0 ? "green" : "red";
  return L.divIcon({
    className: "sat-end-icon",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
}

function clearAPA() {
  for (const id in satelliteLines) {
    map.removeLayer(satelliteLines[id]);
  }
  for (const id in satelliteMarkers) {
    map.removeLayer(satelliteMarkers[id]);
  }
  satelliteLines = {};
  satelliteMarkers = {};
  if (labelLayerGroup) {
    labelLayerGroup.clearLayers();
  }
}

function drawAPA(fromLat, fromLon, satellites) {
  clearAPA();
  labelLayerGroup = L.layerGroup().addTo(map);

  satellites.forEach(sat => {
    const satLatLng = L.latLng(0, sat.longitude);
    const fromLatLng = L.latLng(fromLat, fromLon);
    const el = (90 - Math.abs(fromLat) - Math.abs(sat.longitude - fromLon)).toFixed(2);
    const az = ((sat.longitude - fromLon + 360) % 360).toFixed(2);
    const isVisible = el >= 0;

    const line = L.polyline([fromLatLng, satLatLng], {
      color: isVisible ? "#4CAF50" : "#FF5252",
      weight: 2,
      opacity: 0.9
    }).addTo(map);

    const label = createLabel(satLatLng, sat.name);
    labelLayerGroup.addLayer(label);

    const iconMarker = L.marker(satLatLng, {
      icon: getSatelliteIcon(el),
      interactive: false
    }).addTo(map);

    satelliteLines[sat.name] = line;
    satelliteMarkers[sat.name] = iconMarker;
  });

  updateLabelsVisibility();
  map.on("zoomend", updateLabelsVisibility);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing map...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const locationSelect = document.getElementById("location-select");
  locationSelect?.addEventListener("change", () => {
    const value = locationSelect.value;
    if (value) {
      const [lat, lon] = value.split(",").map(Number);
      map.setView([lat, lon], 5);
      drawAPA(lat, lon, SATELLITES);
    }
  });

  // Hook up toolbar buttons
  document.getElementById("btn-location")?.addEventListener("click", () => {
    console.log("Use My Location clicked");
    alert("Use My Location feature not yet implemented.");
  });
  document.getElementById("btn-filter")?.addEventListener("click", () => {
    console.log("Filter button clicked");
    document.getElementById("filter-panel")?.classList.toggle("visible");
  });
  document.getElementById("btn-custom-location")?.addEventListener("click", () => {
    console.log("Custom Location button clicked");
    document.getElementById("location-panel")?.classList.toggle("visible");
  });
  document.getElementById("btn-satellite")?.addEventListener("click", () => {
    console.log("Satellite button clicked");
    document.getElementById("satellite-panel")?.classList.toggle("visible");
  });

  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    document.getElementById("help-tooltip")?.classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.6.9.3").then(reg => {
      console.log("Service Worker registered with scope:", reg.scope);
    });
  }
});
