// APA App Script - v1.6.9.13

console.log("APA App v1.6.9.13 Loaded");

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
  const minZoom = 3;
  const visible = zoom >= minZoom;

  labelLayerGroup.eachLayer(layer => {
    if (visible) {
      layer.getElement()?.classList.remove("hidden-label");
    } else {
      layer.getElement()?.classList.add("hidden-label");
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
  locationSelect.addEventListener("change", () => {
    const value = locationSelect.value;
    if (value) {
      const [lat, lon] = value.split(",").map(Number);
      map.setView([lat, lon], 5);
      drawAPA(lat, lon, SATELLITES);
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.6.9.3").then(reg => {
      console.log("Service Worker registered with scope:", reg.scope);
    });
  }
});
