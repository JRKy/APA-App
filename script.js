// APA App Logic - v1.7.32

console.log("APA App Script v1.7.32 Loaded");

let selectedLocation = null;
let customSatellites = [];
let apaLines = {};
let filters = {
  aor: "",
  country: "",
  location: ""
};

const apaPanel = document.getElementById("apa-panel");
const toggleApaBtn = document.getElementById("toggle-apa-panel");
const closeApaBtn = document.getElementById("close-apa-panel");
const helpTooltip = document.getElementById("help-tooltip");
const hideHelpTooltipBtn = document.getElementById("hide-help-tooltip");
const legendToggleBtn = document.getElementById("legend-toggle");
const legendPanel = document.getElementById("apa-legend");
const currentLocationLabel = document.getElementById("current-location-indicator");

document.getElementById("toggle-location-drawer").onclick = () =>
  toggleDrawer("location-drawer");
document.getElementById("toggle-satellite-drawer").onclick = () =>
  toggleDrawer("satellite-drawer");
document.getElementById("toggle-filter-drawer").onclick = () =>
  toggleDrawer("filter-drawer");

document.getElementById("hide-help-tooltip").onclick = () =>
  helpTooltip.classList.add("hidden");

legendToggleBtn.onclick = () =>
  legendPanel.classList.toggle("hidden");

toggleApaBtn.onclick = () => {
  apaPanel.style.display = "block";
  toggleApaBtn.style.display = "none";
};

closeApaBtn.onclick = () => {
  apaPanel.style.display = "none";
  toggleApaBtn.style.display = "block";
};

function toggleDrawer(id) {
  document.querySelectorAll(".drawer").forEach((d) => {
    if (d.id === id) d.classList.toggle("visible");
    else d.classList.remove("visible");
  });
}

// Populate dropdowns
window.addEventListener("DOMContentLoaded", () => {
  populateDropdowns();
  populateLocationSelect();
  populateApaTable();
});

function populateDropdowns() {
  const aors = [...new Set(LOCATIONS.map((l) => l.aor))].sort();
  const countries = [...new Set(LOCATIONS.map((l) => l.country))].sort();

  const aorSelect = document.getElementById("aor-filter");
  const countrySelect = document.getElementById("country-filter");

  aorSelect.innerHTML = '<option value="">All AORs</option>';
  countrySelect.innerHTML = '<option value="">All Countries</option>';

  aors.forEach((aor) =>
    aorSelect.insertAdjacentHTML("beforeend", `<option value="${aor}">${aor}</option>`)
  );
  countries.forEach((c) =>
    countrySelect.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`)
  );

  aorSelect.onchange = updateFilters;
  countrySelect.onchange = updateFilters;
  document.getElementById("location-select").onchange = onLocationChange;
  document.getElementById("reset-filters").onclick = resetFilters;
}

function updateFilters() {
  filters.aor = document.getElementById("aor-filter").value;
  filters.country = document.getElementById("country-filter").value;
  filters.location = "";
  populateLocationSelect();
  updateFilterSummary();
}

function resetFilters() {
  filters = { aor: "", country: "", location: "" };
  document.getElementById("aor-filter").value = "";
  document.getElementById("country-filter").value = "";
  document.getElementById("location-select").value = "";
  populateLocationSelect();
  updateFilterSummary();
  renderApaTable();
}

function updateFilterSummary() {
  const badge = document.getElementById("filter-summary");
  if (filters.aor || filters.country) {
    badge.textContent = `${filters.aor || "Any"} / ${filters.country || "Any"}`;
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
  }
}

function populateLocationSelect() {
  const locationSelect = document.getElementById("location-select");
  locationSelect.innerHTML = '<option value="">Choose a location...</option>';

  const filtered = LOCATIONS.filter((loc) => {
    return (!filters.aor || loc.aor === filters.aor) &&
           (!filters.country || loc.country === filters.country);
  });

  filtered.forEach((loc, i) => {
    locationSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${i}">${loc.name}</option>`
    );
  });
}

function onLocationChange(e) {
  const selectedIndex = e.target.value;
  if (selectedIndex === "") return;

  selectedLocation = LOCATIONS[selectedIndex];
  filters.aor = selectedLocation.aor;
  filters.country = selectedLocation.country;
  filters.location = selectedLocation.name;

  document.getElementById("aor-filter").value = selectedLocation.aor;
  document.getElementById("country-filter").value = selectedLocation.country;
  updateFilterSummary();
  renderApaTable();
}

document.getElementById("btn-my-location").onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      selectedLocation = { name: "Current Location", latitude, longitude };
      currentLocationLabel.textContent = `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      currentLocationLabel.classList.remove("hidden");
      renderApaTable();
    },
    () => alert("Unable to get your location.")
  );
};

document.getElementById("custom-location-btn").onclick = () => {
  const lat = parseFloat(document.getElementById("custom-lat").value);
  const lon = parseFloat(document.getElementById("custom-lon").value);
  if (!isFinite(lat) || !isFinite(lon)) return alert("Enter valid lat/lon");
  selectedLocation = { name: "Custom Location", latitude: lat, longitude: lon };
  currentLocationLabel.textContent = `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  currentLocationLabel.classList.remove("hidden");
  renderApaTable();
};

document.getElementById("add-satellite-btn").onclick = () => {
  const name = document.getElementById("sat-name").value.trim();
  const lon = parseFloat(document.getElementById("sat-lon").value);
  if (!name || !isFinite(lon)) return alert("Enter valid satellite data");
  if (SATELLITES.some(s => s.name === name) || customSatellites.some(s => s.name === name)) {
    return alert("Satellite with this name already exists.");
  }
  const sat = { name, longitude: lon };
  customSatellites.push(sat);
  renderApaTable();
};

function renderApaTable() {
  const tbody = document.querySelector("#apa-table tbody");
  tbody.innerHTML = "";

  if (!selectedLocation) {
    document.getElementById("apa-no-results").classList.remove("hidden");
    return;
  }

  document.getElementById("apa-no-results").classList.add("hidden");

  const allSats = [...SATELLITES, ...customSatellites];

  allSats.forEach((sat, index) => {
    const el = calculateElevation(selectedLocation, sat);
    const az = calculateAzimuth(selectedLocation, sat);

    const row = document.createElement("tr");

    const showCell = document.createElement("td");
    const showCheckbox = document.createElement("input");
    showCheckbox.type = "checkbox";
    showCheckbox.checked = true;
    showCheckbox.addEventListener("change", () => {
      const key = sat.name;
      if (showCheckbox.checked) {
        drawApaLine(selectedLocation, sat);
      } else {
        if (apaLines[key]) {
          map.removeLayer(apaLines[key]);
          delete apaLines[key];
        }
      }
    });
    showCell.appendChild(showCheckbox);

    const nameCell = document.createElement("td");
    nameCell.textContent = sat.name;

    const lonCell = document.createElement("td");
    lonCell.textContent = sat.longitude.toFixed(2);

    const elCell = document.createElement("td");
    elCell.textContent = el.toFixed(1);
    if (el < 0) elCell.classList.add("negative");

    const azCell = document.createElement("td");
    azCell.textContent = az.toFixed(1);

    const deleteCell = document.createElement("td");
    if (customSatellites.includes(sat)) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.onclick = () => {
        customSatellites = customSatellites.filter(s => s.name !== sat.name);
        renderApaTable();
      };
      deleteCell.appendChild(delBtn);
    }

    row.append(showCell, nameCell, lonCell, elCell, azCell, deleteCell);
    tbody.appendChild(row);

    drawApaLine(selectedLocation, sat);
  });
}

// Placeholder functions
function calculateAzimuth(loc, sat) {
  return 180 + (sat.longitude - loc.longitude); // placeholder logic
}

function calculateElevation(loc, sat) {
  const diff = Math.abs(sat.longitude - loc.longitude);
  return 90 - diff; // placeholder logic
}

function drawApaLine(loc, sat) {
  const key = sat.name;
  if (apaLines[key]) {
    map.removeLayer(apaLines[key]);
  }

  const latlngs = [
    [loc.latitude, loc.longitude],
    [loc.latitude, sat.longitude]
  ];

  const color = calculateElevation(loc, sat) >= 0 ? "blue" : "red";

  const line = L.polyline(latlngs, {
    color,
    weight: 2,
    opacity: 0.9,
    dashArray: "5,5"
  }).addTo(map);

  line.bindTooltip(sat.name, {
    permanent: true,
    direction: "center",
    className: "apa-line-label"
  });

  apaLines[key] = line;
}
