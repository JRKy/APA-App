let map;
let siteMarker;
let baseLayers;
let currentBaseLayer;
let allAORs = [];
let allCountries = [];

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

  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const resetBtn = document.getElementById("reset-filters");

  // Populate initial dropdown values
  allAORs = [...new Set(LOCATIONS.map(loc => loc.aor))].sort();
  allCountries = [...new Set(LOCATIONS.map(loc => loc.country))].sort();

  function populateDropdown(select, items, label) {
    select.innerHTML = `<option value="">All ${label}</option>`;
    items.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  }

  function updateLocationDropdown() {
    const selectedAOR = aorFilter.value;
    const selectedCountry = countryFilter.value;

    const filtered = LOCATIONS.filter(loc => {
      return (!selectedAOR || loc.aor === selectedAOR) &&
             (!selectedCountry || loc.country === selectedCountry);
    });

    locationSelect.innerHTML = `<option value="">Choose a location...</option>`;
    filtered.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = `${loc.latitude},${loc.longitude}`;
      opt.textContent = loc.name;
      locationSelect.appendChild(opt);
    });
  }

  function updateAorAndCountryDropdowns() {
    const selectedAOR = aorFilter.value;
    const selectedCountry = countryFilter.value;

    let filteredAORs = allAORs;
    let filteredCountries = allCountries;

    if (selectedCountry) {
      filteredAORs = [...new Set(LOCATIONS.filter(loc => loc.country === selectedCountry).map(loc => loc.aor))].sort();
    }

    if (selectedAOR) {
      filteredCountries = [...new Set(LOCATIONS.filter(loc => loc.aor === selectedAOR).map(loc => loc.country))].sort();
    }

    populateDropdown(aorFilter, filteredAORs, "AORs");
    aorFilter.value = selectedAOR;

    populateDropdown(countryFilter, filteredCountries, "Countries");
    countryFilter.value = selectedCountry;

    updateLocationDropdown();
  }

  aorFilter.addEventListener("change", updateAorAndCountryDropdowns);
  countryFilter.addEventListener("change", updateAorAndCountryDropdowns);

  locationSelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",").map(Number);
    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 8);
    console.log(`Zooming to location: ${lat}, ${lon}`);
    // updateApaTable(lat, lon); // connect APA logic here if needed
  });

  resetBtn.addEventListener("click", () => {
    populateDropdown(aorFilter, allAORs, "AORs");
    populateDropdown(countryFilter, allCountries, "Countries");
    aorFilter.value = "";
    countryFilter.value = "";
    updateLocationDropdown();
  });

  populateDropdown(aorFilter, allAORs, "AORs");
  populateDropdown(countryFilter, allCountries, "Countries");
  updateLocationDropdown();

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
        console.log(`Centered on current location: ${latitude}, ${longitude}`);
        // updateApaTable(latitude, longitude); // connect APA logic here
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  });

  console.log("Map initialized with layer control, dropdown filters, and geolocation.");
});
