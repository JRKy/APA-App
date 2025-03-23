let map;
let siteMarker;
let lineLayers = [];
let satMarkers = [];
let baseLayers;
let allAORs = [];
let allCountries = [];
let currentSortColumn = null;
let currentSortAsc = true;

console.log("Initializing APA App... v1.6.9.3");

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

  L.control.layers(baseLayers).addTo(map);

  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const resetBtn = document.getElementById("reset-filters");
  const tbody = document.querySelector("#apa-table tbody");
  const apaPanel = document.getElementById("apa-panel");
  const closePanelBtn = document.getElementById("close-apa-panel");

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
      opt.dataset.aor = loc.aor;
      opt.dataset.country = loc.country;
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
    const selectedOption = this.options[this.selectedIndex];
    const selectedAOR = selectedOption.dataset.aor;
    const selectedCountry = selectedOption.dataset.country;

    aorFilter.value = selectedAOR;
    countryFilter.value = selectedCountry;

    updateAorAndCountryDropdowns();

    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 8);
    apaPanel.style.display = "block";
    updateApaTable(lat, lon);
  });

  resetBtn.addEventListener("click", () => {
    populateDropdown(aorFilter, allAORs, "AORs");
    populateDropdown(countryFilter, allCountries, "Countries");
    aorFilter.value = "";
    countryFilter.value = "";
    updateLocationDropdown();
  });

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
        apaPanel.style.display = "block";
        updateApaTable(latitude, longitude);
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  });

  closePanelBtn.addEventListener("click", () => {
    apaPanel.style.display = "none";
  });

  populateDropdown(aorFilter, allAORs, "AORs");
  populateDropdown(countryFilter, allCountries, "Countries");
  updateLocationDropdown();

  function updateApaTable(siteLat, siteLon) {
    tbody.innerHTML = "";
    clearLines();
    clearSatMarkers();

    let rows = SATELLITES.map((sat, index) => {
      const azimuth = computeAzimuth(siteLat, siteLon, sat.longitude);
      const elevation = computeElevation(siteLat, siteLon, sat.longitude);
      const isNegative = elevation < 0;
      return {
        index,
        sat,
        azimuth,
        elevation,
        isNegative
      };
    });

    if (currentSortColumn) {
      rows.sort((a, b) => {
        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
      });
    }

    const fragment = document.createDocumentFragment();

    rows.forEach(({ sat, azimuth, elevation, isNegative }, index) => {
      const rowId = `sat-${index}`;

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

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" aria-label="Toggle ${sat.name}" id="${rowId}" data-lat="${siteLat}" data-lon="${siteLon}" data-satlon="${sat.longitude}" ${isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${elevation.toFixed(2)}</td>
        <td>${azimuth.toFixed(2)}</td>
      `;
      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);

    const checkboxes = tbody.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach(cb => {
      cb.addEventListener("change", checkboxChangeHandler);
      if (cb.checked) checkboxChangeHandler.call(cb);
    });
  }

  function checkboxChangeHandler() {
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
      const elevation = computeElevation(lat, lon, satLon);
      drawLine(lat, lon, satLon, id, id, elevation);
    }
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
    return (az + 360) % 360;
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

  // Sort columns when clicked
  document.querySelectorAll("#apa-table th").forEach((th, i) => {
    th.addEventListener("click", () => {
      const sortMap = {
        1: "sat.name",
        2: "sat.longitude",
        3: "elevation",
        4: "azimuth"
      };

      const key = sortMap[i];
      if (!key) return;

      if (currentSortColumn === key) {
        currentSortAsc = !currentSortAsc;
      } else {
        currentSortColumn = key;
        currentSortAsc = true;
      }

      const siteValue = locationSelect.value;
      if (siteValue) {
        const [lat, lon] = siteValue.split(",").map(Number);
        updateApaTable(lat, lon);
      }
    });
  });

  console.log("APA table, dropdown sync, and sorting ready.");
});
