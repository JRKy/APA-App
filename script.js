// APA App Script - v1.8.1

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
  const locateBtn = document.getElementById("btn-my-location");
  const currentLocationIndicator = document.getElementById("current-location-indicator");
  const filterSummary = document.getElementById("filter-summary");
  const legendToggle = document.getElementById("legend-toggle");
  const apaLegend = document.getElementById("apa-legend");
  const noResultsMessage = document.getElementById("apa-no-results");
  const apaLive = document.getElementById("apa-live");

  document.getElementById("hide-help-tooltip")?.addEventListener("click", () => {
    helpTooltip.classList.add("hidden");
  });

  legendToggle?.addEventListener("click", () => {
    apaLegend.classList.toggle("hidden");
  });

  const baseLayers = {
    "Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }),
    "Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© Google Satellite"
    }),
    "Terrain": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenTopoMap contributors'
    })
  };

  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    layers: [baseLayers.Map]
  });

  L.control.layers(baseLayers).addTo(map);

  locateBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        goToLocation(lat, lon, "GPS");
      },
      (error) => {
        alert("Failed to get location: " + error.message);
      }
    );
  });

  closePanelBtn?.addEventListener("click", () => {
    apaPanel.classList.remove("visible");
    toggleApaBtn.style.display = "block";
  });

  toggleApaBtn?.addEventListener("click", () => {
    apaPanel.classList.add("visible");
    toggleApaBtn.style.display = "none";
  });

  document.getElementById("toggle-main-menu")?.addEventListener("click", () => {
    toggleDrawer("main-menu", ["location-drawer", "satellite-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-location-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-drawer", ["main-menu", "satellite-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-drawer", ["main-menu", "location-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("filter-drawer", ["main-menu", "location-drawer", "satellite-drawer"]);
  });

  document.getElementById("custom-location-btn")?.addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("custom-lat").value);
    const lon = parseFloat(document.getElementById("custom-lon").value);
    if (!isNaN(lat) && !isNaN(lon)) {
      goToLocation(lat, lon, `(${lat.toFixed(2)}, ${lon.toFixed(2)})`);
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

  document.getElementById("reset-filters")?.addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    locationSelect.value = "";
    populateFilters();
    filterLocations();
    apaTableBody.innerHTML = "";
    clearLines();
    updateFilterSummary();
  });

  aorFilter.addEventListener("change", () => {
    filterLocations();
    updateFilterSummary();
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
    updateFilterSummary();
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

  locationSelect.addEventListener("change", function () {
    const selected = this.options[this.selectedIndex];
    if (!selected || !selected.dataset.aor) return;
    const aor = selected.dataset.aor;
    const country = selected.dataset.country;
    aorFilter.value = aor;
    countryFilter.value = country;
    filterLocations();
    locationSelect.value = `${selected.value}`;
    const [lat, lon] = this.value.split(",").map(Number);
    goToLocation(lat, lon, selected.textContent);
    updateFilterSummary();
  });

  // Offline Feedback
  window.addEventListener("offline", () => {
    const toast = document.createElement("div");
    toast.textContent = "Offline - Using cached data";
    toast.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #ff5252; color: white; padding: 10px; border-radius: 5px; z-index: 9999;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  });
  window.addEventListener("online", () => {
    location.reload();
  });

  // APA Table Sorting
  const apaTableHeaders = document.querySelectorAll("#apa-table th");
  let sortDirection = 1;
  let lastSorted = -1;
  apaTableHeaders.forEach((th, index) => {
    if (index === 0 || index === 5) return; // Skip "Show" and delete columns
    th.addEventListener("click", () => {
      sortDirection = lastSorted === index ? -sortDirection : 1;
      lastSorted = index;
      const rows = Array.from(apaTableBody.querySelectorAll("tr"));
      rows.sort((a, b) => {
        const aVal = a.cells[index].textContent.trim();
        const bVal = b.cells[index].textContent.trim();
        return [1, 2, 3, 4].includes(index)
          ? sortDirection * (parseFloat(aVal) - parseFloat(bVal))
          : sortDirection * aVal.localeCompare(bVal);
      });
      apaTableBody.innerHTML = "";
      rows.forEach(row => apaTableBody.appendChild(row));
    });
  });

  // Persistent APA Panel Layout
  interact("#apa-panel")
    .draggable({
      listeners: {
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.dataset.x) || 0) + event.dx;
          const y = (parseFloat(target.dataset.y) || 0) + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.dataset.x = x;
          target.dataset.y = y;
          localStorage.setItem("apaPanelPos", JSON.stringify({ x, y }));
        }
      }
    })
    .resizable({
      edges: { bottom: true, right: true },
      listeners: {
        move(event) {
          const target = event.target;
          target.style.width = `${event.rect.width}px`;
          target.style.height = `${event.rect.height}px`;
          localStorage.setItem("apaPanelSize", JSON.stringify({ width: event.rect.width, height: event.rect.height }));
        }
      }
    });
  const pos = JSON.parse(localStorage.getItem("apaPanelPos") || "{}");
  const size = JSON.parse(localStorage.getItem("apaPanelSize") || "{}");
  if (pos.x || pos.y) apaPanel.style.transform = `translate(${pos.x || 0}px, ${pos.y || 0}px)`;
  if (size.width) apaPanel.style.width = `${size.width}px`;
  if (size.height) apaPanel.style.height = `${size.height}px`;
  apaPanel.dataset.x = pos.x || 0;
  apaPanel.dataset.y = pos.y || 0;

  // Debounced Map Updates
  const debouncedUpdate = debounce(updateApaTable, 200);
  map.on("moveend", () => {
    if (lastLocation) debouncedUpdate(lastLocation.lat, lastLocation.lon);
  });

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
        opt.dataset.aor = loc.aor;
        opt.dataset.country = loc.country;
        locationSelect.appendChild(opt);
      }
    });
  }

  function updateFilterSummary() {
    const aor = aorFilter.value;
    const country = countryFilter.value;
    if (aor || country) {
      filterSummary.classList.remove("hidden");
      filterSummary.textContent = `Filters: ${aor || ""}${aor && country ? " / " : ""}${country || ""}`;
    } else {
      filterSummary.classList.add("hidden");
    }
  }

  function goToLocation(lat, lon, label = "") {
    lastLocation = { lat, lon };
    map.setView([lat, lon], 8);
    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    apaPanel.classList.add("visible");
    toggleApaBtn.style.display = "none";
    updateApaTable(lat, lon);
    currentLocationIndicator.textContent = `Current Location: ${label || `${lat.toFixed(2)}, ${lon.toFixed(2)}`}`;
    currentLocationIndicator.classList.remove("hidden");
  }

  function updateApaTable(lat, lon) {
    clearApaTable();
    const satellitesData = calculateSatelliteData(lat, lon);
    renderApaTable(satellitesData);
    bindTableEvents(lat, lon);
    updateNoResultsMessage(satellitesData.length);
    apaLive.textContent = `Updated APA table with ${satellitesData.length} satellites for location ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }

  function calculateSatelliteData(lat, lon) {
    return SATELLITES.map((sat, idx) => {
      const az = ((sat.longitude - lon + 360) % 360).toFixed(2);
      const el = calculateElevation(lat, lon, sat.longitude).toFixed(2);
      return {
        id: `sat-${idx}`,
        name: sat.name,
        longitude: sat.longitude,
        az,
        el,
        isNegative: el < 0,
        custom: sat.custom
      };
    });
  }

  function calculateElevation(lat, lon, satLon) {
    const R = 6371; // Earth radius in km
    const h = 35786; // Geostationary altitude in km
    const deltaLon = (satLon - lon) * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const cosC = Math.cos(latRad) * Math.cos(deltaLon);
    const C = Math.acos(cosC);
    const sinEl = (h / R * Math.cos(C) - 1) / Math.sqrt(1 + (h / R) ** 2 - 2 * h / R * Math.cos(C));
    return Math.asin(sinEl) * 180 / Math.PI;
  }

  function renderApaTable(satellitesData) {
    apaTableBody.innerHTML = satellitesData.map(sat => `
      <tr>
        <td><input type="checkbox" id="${sat.id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${sat.isNegative ? "" : "checked"}></td>
        <td>${sat.name}</td>
        <td>${sat.longitude}</td>
        <td class="${sat.isNegative ? "negative" : ""}">${sat.el}</td>
        <td>${sat.az}</td>
        <td>${sat.custom ? `<button class="delete-sat" data-name="${sat.name}" title="Delete Satellite">❌</button>` : ""}</td>
      </tr>
    `).join("");
  }

  function bindTableEvents(lat, lon) {
    apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const index = SATELLITES.findIndex(s => s.name === name && s.custom);
        if (index !== -1) {
          SATELLITES.splice(index, 1);
          updateApaTable(lat, lon);
        }
      });
    });
    apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        const { id, dataset } = cb;
        const satLon = parseFloat(dataset.satlon);
        const name = dataset.name;
        toggleLine(id, lat, lon, satLon, name, cb.checked);
      });
      if (cb.checked) cb.dispatchEvent(new Event("change"));
    });
  }

  function toggleLine(id, lat, lon, satLon, label, checked) {
    const existing = lineLayers.find(l => l.id === id);
    if (existing) {
      map.removeLayer(existing.layer);
      lineLayers = lineLayers.filter(l => l.id !== id);
    }
    if (checked) {
      const el = calculateElevation(lat, lon, satLon);
      drawLine(lat, lon, satLon, label, el, id);
    }
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

  function clearApaTable() {
    apaTableBody.innerHTML = "";
    clearLines();
  }

  function clearLines() {
    lineLayers.forEach(l => map.removeLayer(l.layer));
    lineLayers = [];
  }

  function updateNoResultsMessage(count) {
    noResultsMessage.classList.toggle("hidden", count > 0);
  }

  function toggleDrawer(drawerId, others) {
    const drawer = document.getElementById(drawerId);
    const isOpen = drawer.classList.contains("visible");
    drawer.classList.toggle("visible", !isOpen);
    if (!isOpen) drawer.querySelector("input, select, button")?.focus();
    others.forEach(id => document.getElementById(id)?.classList.remove("visible"));
  }

  function populateFilters() {
    aorFilter.innerHTML = '<option value="">All AORs</option>';
    countryFilter.innerHTML = '<option value="">All Countries</option>';
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

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  populateFilters();
  filterLocations();
});
