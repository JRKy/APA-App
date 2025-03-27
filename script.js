// APA App Script - v1.7.22

let map;
let siteMarker;
let lineLayers = [];
let lastLocation = null;

document.addEventListener("DOMContentLoaded", () => {
  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const apaPanel = document.getElementById("apa-panel");
  const apaTableBody = document.querySelector("#apa-table tbody");
  const closePanelBtn = document.getElementById("close-apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  const helpTooltip = document.getElementById("help-tooltip");
  const filterPanel = document.getElementById("filter-panel");
  const btnLocation = document.getElementById("btn-location");
  const btnFilter = document.getElementById("btn-filter");
  const closeFilterBtn = document.getElementById("close-filter-panel");

  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    helpTooltip.classList.add("hidden");
  });

  const baseLayers = {
    "Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }),
    "Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "&copy; Google Satellite"
    }),
    "Terrain": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenTopoMap contributors'
    })
  };

  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    layers: [baseLayers.Map]
  });

  L.control.layers(baseLayers).addTo(map);

  function populateFilters() {
    const uniqueAORs = [...new Set(LOCATIONS.map(loc => loc.aor))].sort();
    const uniqueCountries = [...new Set(LOCATIONS.map(loc => loc.country))].sort();
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

  aorFilter.addEventListener("change", () => {
    filterLocations();
    const selectedAOR = aorFilter.value;
    const countriesInAOR = LOCATIONS.filter(loc => !selectedAOR || loc.aor === selectedAOR).map(loc => loc.country);
    const uniqueCountries = [...new Set(countriesInAOR)].sort();
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    uniqueCountries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countryFilter.appendChild(opt);
    });
  });

  countryFilter.addEventListener("change", () => {
    filterLocations();
    const selectedCountry = countryFilter.value;
    const aorsInCountry = LOCATIONS.filter(loc => !selectedCountry || loc.country === selectedCountry).map(loc => loc.aor);
    const uniqueAORs = [...new Set(aorsInCountry)].sort();
    aorFilter.innerHTML = '<option value="">All AORs</option>';
    uniqueAORs.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      aorFilter.appendChild(opt);
    });
  });

  populateFilters();
  filterLocations();

  document.getElementById("reset-filters")?.addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    locationSelect.value = "";

    aorFilter.innerHTML = '<option value="">All AORs</option>';
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    populateFilters();

    filterLocations();
    apaTableBody.innerHTML = "";
    clearLines();
  });

  locationSelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",").map(Number);
    goToLocation(lat, lon);
  });

  btnFilter?.addEventListener("click", () => {
    filterPanel.style.display = filterPanel.style.display === "block" ? "none" : "block";
  });

  closeFilterBtn?.addEventListener("click", () => {
    filterPanel.style.display = "none";
  });

  closePanelBtn?.addEventListener("click", () => {
    apaPanel.style.display = "none";
    toggleApaBtn.style.display = "block";
  });

  toggleApaBtn?.addEventListener("click", () => {
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
  });

  document.getElementById("btn-location")?.addEventListener("click", () => {
    navigator.geolocation?.getCurrentPosition(
      pos => goToLocation(pos.coords.latitude, pos.coords.longitude),
      err => alert("Failed to get location: " + err.message)
    );
  });

  document.getElementById("custom-location-btn")?.addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("custom-lat").value);
    const lon = parseFloat(document.getElementById("custom-lon").value);
    if (!isNaN(lat) && !isNaN(lon)) {
      goToLocation(lat, lon);
      document.getElementById("location-drawer").classList.remove("visible");
    }
  });

  document.getElementById("add-satellite-btn")?.addEventListener("click", () => {
    const name = document.getElementById("sat-name").value.trim();
    const lon = parseFloat(document.getElementById("sat-lon").value);
    const exists = SATELLITES.some(s => s.name === name || s.longitude === lon);
    if (!name || isNaN(lon)) return;
    if (exists) {
      alert("Satellite already exists.");
      return;
    }
    SATELLITES.push({ name, longitude: lon, custom: true });
    if (lastLocation) updateApaTable(lastLocation.lat, lastLocation.lon);
    document.getElementById("satellite-drawer").classList.remove("visible");
  });

  function goToLocation(lat, lon) {
    lastLocation = { lat, lon };
    map.setView([lat, lon], 8);
    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
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
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${isNegative ? "negative" : ""}">${el}</td>
        <td>${az}</td>
        <td>${sat.custom ? `<button class="delete-sat" data-name="${sat.name}" title="Delete Satellite">❌</button>` : ""}</td>`;
      apaTableBody.appendChild(row);
    });

    apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const index = SATELLITES.findIndex(s => s.name === name && s.custom);
        if (index !== -1) {
          SATELLITES.splice(index, 1);
          updateApaTable(lastLocation.lat, lastLocation.lon);
        }
      });
    });

    apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", function () {
        const id = this.id;
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        const satLon = parseFloat(this.dataset.satlon);
        const name = this.dataset.name;
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

  function toggleDrawer(drawer, others) {
    const isOpen = drawer.classList.contains("visible");
    drawer.classList.toggle("visible", !isOpen);
    others.forEach(d => d.classList.remove("visible"));
  }

  document.getElementById("toggle-location-drawer")?.addEventListener("click", () =>
    toggleDrawer(document.getElementById("location-drawer"), [document.getElementById("satellite-drawer")])
  );

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () =>
    toggleDrawer(document.getElementById("satellite-drawer"), [document.getElementById("location-drawer")])
  );
});
