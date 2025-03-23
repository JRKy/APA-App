let map;
let siteMarker;
let baseLayers;
let currentBaseLayer;
let mapInitialized = false;

console.log("Initializing APA App... v1.6.9");

document.addEventListener("DOMContentLoaded", () => {
  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  });

  const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri"
  });

  const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; CartoDB"
  });

  baseLayers = {
    "OpenStreetMap": osm,
    "Satellite": satellite,
    "Dark Mode": dark
  };

  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    layers: [osm],
    zoomControl: true,
  });

  currentBaseLayer = osm;

  L.control.layers(baseLayers).addTo(map);

  document.getElementById("use-my-location").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 8);
        if (siteMarker) map.removeLayer(siteMarker);
        siteMarker = L.marker([latitude, longitude]).addTo(map);
        // You can also call updateApaTable(latitude, longitude) here if you want
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  });

  mapInitialized = true;

  console.log("Map initialized with layer control and geolocation support.");
});
