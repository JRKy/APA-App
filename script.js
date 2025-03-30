// APA App Script - v1.8.1b
console.log("APA App v1.8.1b Loaded");

let map;
let siteMarker;
let lineLayers = [];

document.addEventListener("DOMContentLoaded", () => {
  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const apaPanel = document.getElementById("apa-panel");
  const apaTableBody = document.querySelector("#apa-table tbody");
  const showApaBtn = document.getElementById("toggle-apa-panel");

  const locationDrawer = document.getElementById("location-drawer");
  const satelliteDrawer = document.getElementById("satellite-drawer");
  const filterDrawer = document.getElementById("filter-drawer");

  function toggleDrawer(drawer) {
    [locationDrawer, satelliteDrawer, filterDrawer].forEach(d => {
      if (d !== drawer) d.classList.remove("visible");
    });
    drawer.classList.toggle("visible");
  }

  document.getElementById("toggle-location-drawer").addEventListener("click", () => {
    toggleDrawer(locationDrawer);
  });

  document.getElementById("toggle-satellite-drawer").addEventListener("click", () => {
    toggleDrawer(satelliteDrawer);
  });

  document.getElementById("toggle-filter-drawer").addEventListener("click", () => {
    toggleDrawer(filterDrawer);
  });

  document.getElementById("btn-my-location").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          goToLocation(lat, lon);
          const indicator = document.getElementById("current-location-indicator");
          indicator.textContent = "Current Location Selected";
          indicator.classList.remove("hidden");
        },
        (err) => alert("Failed to get location: " + err.message)
      );
    } else {
      alert("Geolocation is not supported.");
    }
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
      const exists = SATELLITES.some(s => s.name === name || s.longitude === lon);
      if (exists) {
        alert("Satellite with this name or longitude already exists.");
        return;
      }
      SATELLITES.push({ name, longitude: lon, custom: true });

      const selectedValue = locationSelect.value;
      if (selectedValue) {
        const [lat, lon] = selectedValue.split(",").map(Number);
        goToLocation(lat, lon); // this handles drawing + table update
      }
    }
  });

  document.getElementById("close-apa-panel").addEventListener("click", () => {
    apaPanel.style.display = "none";
    showApaBtn.style.display = "block";
  });

  showApaBtn.addEventListener("click", () => {
    apaPanel.style.display = "block";
    showApaBtn.style.display = "none";
  });

  document.getElementById("hide-help-tooltip").addEventListener("click", () => {
    document.getElementById("help-tooltip").classList.add("hidden");
  });

  document.getElementById("reset-filters").addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    locationSelect.value = "";
    apaTableBody.innerHTML = "";
    clearLines();
    populateFilters();
    filterLocations();
  });

  if (typeof LOCATIONS !== "undefined") {
    populateFilters();
    filterLocations();
  }

  aorFilter.addEventListener("change", () => {
    filterLocations();
    updateCountryFilter();
  });

  countryFilter.addEventListener("change", () => {
    filterLocations();
    updateAorFilter();
  });

  locationSelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",").map(Number);
    syncFiltersToLocation(lat, lon);
    goToLocation(lat, lon);
  });

  function syncFiltersToLocation(lat, lon) {
    const match = LOCATIONS.find(loc =>
      parseFloat(loc.latitude).toFixed(4) === lat.toFixed(4) &&
      parseFloat(loc.longitude).toFixed(4) === lon.toFixed(4));
    if (match) {
      aorFilter.value = match.aor;
      countryFilter.value = match.country;
      filterLocations();
    }
  }

  function populateFilters() {
    aorFilter.innerHTML = '<option value="">All AORs</option>';
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    const uniqueAORs = [...new Set(LOCATIONS.map(l => l.aor))].sort();
    const uniqueCountries = [...new Set(LOCATIONS.map(l => l.country))].sort();
    uniqueAORs.forEach(aor => {
      const opt = document.createElement("option");
      opt.value = aor;
      opt.textContent = aor;
      aorFilter.appendChild(opt);
    });
    uniqueCountries.forEach(country => {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      countryFilter.appendChild(opt);
    });
  }

  function filterLocations() {
    const selectedAOR = aorFilter.value;
    const selectedCountry = countryFilter.value;
    locationSelect.innerHTML = '<option value="">Choose a location...</option>';
    LOCATIONS.forEach(loc => {
      const matchAOR = !selectedAOR || loc.aor === selectedAOR;
      const matchCountry = !selectedCountry || loc.country === selectedCountry;
      if (matchAOR && matchCountry) {
        const opt = document.createElement("option");
        opt.value = `${loc.latitude},${loc.longitude}`;
        opt.textContent = loc.name;
        locationSelect.appendChild(opt);
      }
    });
  }

  function updateCountryFilter() {
    const selectedAOR = aorFilter.value;
    const filtered = LOCATIONS.filter(loc => !selectedAOR || loc.aor === selectedAOR);
    const uniqueCountries = [...new Set(filtered.map(l => l.country))].sort();
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    uniqueCountries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countryFilter.appendChild(opt);
    });
  }

  function updateAorFilter() {
    const selectedCountry = countryFilter.value;
    const filtered = LOCATIONS.filter(loc => !selectedCountry || loc.country === selectedCountry);
    const uniqueAORs = [...new Set(filtered.map(l => l.aor))].sort();
    aorFilter.innerHTML = '<option value="">All AORs</option>';
    uniqueAORs.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      aorFilter.appendChild(opt);
    });
  }

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
      const id = `sat-${idx}`;
      const deleteBtn = sat.custom
        ? `<button class="delete-sat" data-name="${sat.name}" title="Delete">🗑️</button>`
        : "";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${el}</td>
        <td>${az}</td>
        <td>${deleteBtn}</td>`;
      apaTableBody.appendChild(row);
    });

    apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", function () {
        const id = this.id;
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        const satLon = parseFloat(this.dataset.satlon);
        const name = this.dataset.name;
        if (isNaN(satLon)) {
          console.warn("Skipping drawLine: invalid satLon", this.dataset);
          return;
        }
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

    apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
      btn.addEventListener("click", function () {
        const name = this.dataset.name;
        const index = SATELLITES.findIndex(s => s.name === name);
        if (index !== -1) {
          SATELLITES.splice(index, 1);
          if (!locationSelect.value) return;
          const [lat, lon] = locationSelect.value.split(",").map(Number);
          updateApaTable(lat, lon);
        }
      });
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

  // Init map
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
});
