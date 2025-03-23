let map;
let siteMarker;
let lineLayers = [];
let satMarkers = [];
let currentSort = { index: null, asc: true };
let redrawTimeout = null;

console.log("Initializing APA App... v1.6.8");

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map", { keyboard: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  L.Control.APA = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-control apa-control");
      container.setAttribute("role", "region");
      container.setAttribute("aria-label", "APA Results Table");

      container.innerHTML = `
        <div class="apa-panel-header">
          <h4 style="margin:0;">APA Table</h4>
          <button id="toggle-apa-collapse" title="Collapse" aria-label="Collapse APA Table">−</button>
        </div>
        <div id="apa-table-wrapper">
          <button id="select-all-btn" title="Toggle all APA satellite visibility">Select All</button>
          <table id="apa-table" aria-describedby="app-title">
            <thead>
              <tr>
                <th scope="col">Show</th>
                <th scope="col" data-sort="1" title="Sort by Satellite Name">Satellite</th>
                <th scope="col" data-sort="2" title="Sort by Longitude">Lon (°)</th>
                <th scope="col" data-sort="3" title="Sort by Elevation">El (°)</th>
                <th scope="col" data-sort="4" title="Sort by Azimuth">Az (°)</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;

      container.querySelector("#toggle-apa-collapse").addEventListener("click", () => {
        const wrapper = container.querySelector("#apa-table-wrapper");
        const btn = container.querySelector("#toggle-apa-collapse");
        const isCollapsed = wrapper.style.display === "none";
        wrapper.style.display = isCollapsed ? "block" : "none";
        btn.textContent = isCollapsed ? "−" : "+";
      });

      return container;
    }
  });

  map.addControl(new L.Control.APA({ position: "topright" }));

  const tbody = document.querySelector("#apa-table tbody");
  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const resetBtn = document.getElementById("reset-filters");
  const selectAllBtn = document.getElementById("select-all-btn");

  const aors = [...new Set(LOCATIONS.map(loc => loc.aor))].sort();
  const countries = [...new Set(LOCATIONS.map(loc => loc.country))].sort();

  aors.forEach(aor => {
    const opt = document.createElement("option");
    opt.value = aor;
    opt.textContent = aor;
    aorFilter.appendChild(opt);
  });

  countries.forEach(country => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    countryFilter.appendChild(opt);
  });

  function updateLocationDropdown() {
    const selectedAor = aorFilter.value;
    const selectedCountry = countryFilter.value;
    locationSelect.innerHTML = `<option value="">Choose a location...</option>`;
    LOCATIONS.forEach(loc => {
      if (
        (!selectedAor || loc.aor === selectedAor) &&
        (!selectedCountry || loc.country === selectedCountry)
      ) {
        const opt = document.createElement("option");
        opt.value = `${loc.latitude},${loc.longitude}`;
        opt.textContent = loc.name;
        locationSelect.appendChild(opt);
      }
    });
  }

  aorFilter.addEventListener("change", updateLocationDropdown);
  countryFilter.addEventListener("change", updateLocationDropdown);
  resetBtn.addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    updateLocationDropdown();
  });

  updateLocationDropdown();

  locationSelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",").map(Number);
    if (siteMarker) map.removeLayer(siteMarker);
    siteMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 8);
    debouncedApaUpdate(lat, lon);
  });

  function debouncedApaUpdate(lat, lon) {
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(() => updateApaTable(lat, lon), 250);
  }

  function updateApaTable(siteLat, siteLon) {
    tbody.innerHTML = "";
    clearLines();
    clearSatMarkers();

    const fragment = document.createDocumentFragment();

    SATELLITES.forEach((sat, index) => {
      const azimuth = computeAzimuth(siteLat, siteLon, sat.longitude);
      const elevation = computeElevation(siteLat, siteLon, sat.longitude);
      const isNegative = elevation < 0;
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
    });

    // ✅ Call the handler explicitly to initialize lines correctly
    checkboxes.forEach(cb => {
      if (cb.checked) {
        checkboxChangeHandler.call(cb);
      }
    });

    selectAllBtn.textContent = "Select All";
    selectAllBtn.onclick = () => {
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      const newState = !allChecked;
      checkboxes.forEach(cb => {
        cb.checked = newState;
        checkboxChangeHandler.call(cb);
      });
    };

    updateSelectAllState();
    bindSortHandlers();
  }

  function checkboxChangeHandler() {
    const id = this.id;
    const lat = parseFloat(this.dataset.lat);
    const lon = parseFloat(this.dataset.lon);
    const satLon = parseFloat(this.dataset.satlon);

    // Always remove first (whether or not it exists)
    const existing = lineLayers.find(l => l.id === id);
    if (existing) {
      map.removeLayer(existing.layer);
      lineLayers = lineLayers.filter(l => l.id !== id);
    }

    if (this.checked) {
      const elevation = computeElevation(lat, lon, satLon);
      drawLine(lat, lon, satLon, id, id, elevation);
    }

    updateSelectAllState();
  }

  function updateSelectAllState() {
    const checkboxes = document.querySelectorAll("#apa-table tbody input[type=checkbox]");
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    document.getElementById("select-all-btn").textContent = allChecked ? "Deselect All" : "Select All";
  }

  function bindSortHandlers() {
    const headers = document.querySelectorAll("#apa-table th[data-sort]");
    headers.forEach(th => {
      th.setAttribute("tabindex", "0");
      th.onclick = () => sortTable(th);
      th.onkeydown = e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sortTable(th);
        }
      };
    });
  }

  function sortTable(th) {
    const idx = parseInt(th.dataset.sort);
    const rows = Array.from(document.querySelectorAll("#apa-table tbody tr"));
    const isAsc = currentSort.index === idx ? !currentSort.asc : true;

    rows.sort((a, b) => {
      const va = a.children[idx].textContent.trim();
      const vb = b.children[idx].textContent.trim();
      return isAsc
        ? va.localeCompare(vb, undefined, { numeric: true })
        : vb.localeCompare(va, undefined, { numeric: true });
    });

    const tbody = document.querySelector("#apa-table tbody");
    tbody.innerHTML = "";
    rows.forEach(r => tbody.appendChild(r));
    currentSort = { index: idx, asc: isAsc };
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
    az = (az + 360) % 360;
    return az;
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
});
