// APA App Script - v1.9.0

// Global variables
let map;
let siteMarker;
let lineLayers = [];
let satelliteMarkers = [];
let orbitPaths = [];
let coverageCones = [];
let lastLocation = null;
let sortState = { column: null, direction: 'none' };
let tutorialStep = 1;
let tutorialSteps = [];

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function getElevationClass(el) {
  if (el < 0) return 'elevation-negative';
  if (el >= 30) return 'elevation-excellent';
  if (el >= 15) return 'elevation-good';
  if (el >= 5) return 'elevation-marginal';
  return 'elevation-poor';
}

function getElevationLabel(el) {
  if (el < 0) return 'Below Horizon';
  if (el >= 30) return 'Excellent';
  if (el >= 15) return 'Good';
  if (el >= 5) return 'Marginal';
  return 'Poor';
}

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const locationSelect = document.getElementById("location-select");
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const apaPanel = document.getElementById("apa-panel");
  const apaTableBody = document.querySelector("#apa-table tbody");
  const apaTableHeaders = document.querySelectorAll("#apa-table th");
  const closePanelBtn = document.getElementById("close-apa-panel");
  const minimizePanelBtn = document.getElementById("minimize-apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  const helpTooltip = document.getElementById("help-tooltip");
  const locateBtn = document.getElementById("btn-my-location");
  const currentLocationIndicator = document.getElementById("current-location-indicator");
  const filterSummary = document.getElementById("filter-summary");
  const legendToggle = document.getElementById("legend-toggle");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const polarPlotToggle = document.getElementById("toggle-polar-plot");
  const polarPlotContainer = document.getElementById("polar-plot-container");
  const polarPlot = document.getElementById("polar-plot");
  const apaLegend = document.getElementById("apa-legend");
  const noResultsMessage = document.getElementById("apa-no-results");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  const tutorialContent = document.getElementById("tutorial-content");
  const tutorialPrev = document.getElementById("tutorial-prev");
  const tutorialNext = document.getElementById("tutorial-next");
  const tutorialProgress = document.getElementById("tutorial-progress");
  const showTutorialBtn = document.getElementById("show-tutorial");

  // Initialize dark mode from localStorage if available
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    if (darkModeToggle) {
      darkModeToggle.title = "Switch to Light Mode";
      darkModeToggle.querySelector(".material-icons-round").textContent = "light_mode";
    }
  }

  // Dark mode toggle functionality
  darkModeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    darkModeToggle.title = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
    darkModeToggle.querySelector(".material-icons-round").textContent = isDarkMode ? "light_mode" : "dark_mode";
    localStorage.setItem("darkMode", isDarkMode);

    // Update map colors if using dark mode
    if (map) {
      updateMapAppearance(isDarkMode);
    }
  });

  // Help and tutorial functionality
  const hideHelpBtn = document.getElementById("hide-help-tooltip");
  if (hideHelpBtn) {
    hideHelpBtn.addEventListener("click", () => {
      helpTooltip.classList.add("hidden");
      localStorage.setItem("helpDismissed", "true");
    });
  }

  showTutorialBtn?.addEventListener("click", () => {
    helpTooltip.classList.add("hidden");
    localStorage.setItem("helpDismissed", "true");
    startTutorial();
  });

  // Check if help tooltip should be shown
  if (localStorage.getItem("helpDismissed") === "true") {
    helpTooltip.classList.add("hidden");
  }

  legendToggle?.addEventListener("click", () => {
    apaLegend.classList.toggle("hidden");
  });

  polarPlotToggle?.addEventListener("click", () => {
    polarPlotContainer.classList.toggle("hidden");
    const isVisible = !polarPlotContainer.classList.contains("hidden");
    localStorage.setItem("polarPlotVisible", isVisible);
    if (isVisible && lastLocation) {
      updatePolarPlot(lastLocation.lat, lastLocation.lon);
    }
  });

  // Initialize map with base layers
  const baseLayers = {
    "Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-layer-light'
    }),
    "Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "&copy; Google Satellite",
      className: 'map-layer-dark'
    }),
    "Terrain": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenTopoMap contributors',
      className: 'map-layer-light'
    }),
    "Dark": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; CARTO',
      className: 'map-layer-dark'
    })
  };

  // Initialize map
  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    layers: [baseLayers.Map],
    zoomControl: true,
    attributionControl: true,
    minZoom: 2
  });

  // Add layer control
  L.control.layers(baseLayers, null, {
    position: 'topright',
    collapsed: true
  }).addTo(map);

  // Add grid lines
  const gridOptions = {
    showLabel: true,
    dashArray: [5, 5],
    color: '#666',
    fontColor: '#666',
    opacity: 0.6,
    lineWidth: 1
  };

  // Add latitude-longitude grid when zoomed in
  map.on('zoomend', function() {
    updateGridLines();
  });

  function updateGridLines() {
    if (map.getZoom() > 3) {
      if (!map._gridLayer) {
        map._gridLayer = L.latlngGraticule(gridOptions).addTo(map);
      }
    } else if (map._gridLayer) {
      map.removeLayer(map._gridLayer);
      map._gridLayer = null;
    }
  }

  // Add debounced map event handlers for better performance
  map.on('zoomend moveend', debounce(() => {
    if (lastLocation) {
      updateSatelliteLines(lastLocation.lat, lastLocation.lon);
    }
  }, 100));

  // Update map appearance based on dark mode
  function updateMapAppearance(isDarkMode) {
    if (isDarkMode) {
      document.querySelectorAll('.leaflet-control').forEach(control => {
        control.classList.add('dark-control');
      });
      if (map._gridLayer) {
        map._gridLayer.setStyle({
          color: '#aaa',
          fontColor: '#aaa'
        });
      }
    } else {
      document.querySelectorAll('.leaflet-control').forEach(control => {
        control.classList.remove('dark-control');
      });
      if (map._gridLayer) {
        map._gridLayer.setStyle({
          color: '#666',
          fontColor: '#666'
        });
      }
    }
  }

  // My Location button functionality
  locateBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser.", "error");
      return;
    }

    // Show loading spinner
    locateBtn.innerHTML = '<span class="material-icons-round loading">sync</span>';
    locateBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        goToLocation(lat, lon, "GPS Location");
        
        // Reset button
        locateBtn.innerHTML = '<span class="material-icons-round">my_location</span>';
        locateBtn.disabled = false;
      },
      (error) => {
        showNotification("Failed to get location: " + error.message, "error");
        
        // Reset button
        locateBtn.innerHTML = '<span class="material-icons-round">my_location</span>';
        locateBtn.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });

  // APA Panel controls
  closePanelBtn?.addEventListener("click", () => {
    apaPanel.style.display = "none";
    toggleApaBtn.style.display = "flex";
  });

  minimizePanelBtn?.addEventListener("click", () => {
    apaPanel.classList.toggle("minimized");
    const isMinimized = apaPanel.classList.contains("minimized");
    minimizePanelBtn.querySelector(".material-icons-round").textContent = isMinimized ? "expand_less" : "remove";
    localStorage.setItem("apaPanelMinimized", isMinimized);
  });

  // Restore APA panel state from localStorage
  if (localStorage.getItem("apaPanelMinimized") === "true") {
    apaPanel.classList.add("minimized");
    if (minimizePanelBtn) {
      minimizePanelBtn.querySelector(".material-icons-round").textContent = "expand_less";
    }
  }

  toggleApaBtn?.addEventListener("click", () => {
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
  });

  // Drawer buttons
  document.getElementById("toggle-location-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-drawer", ["satellite-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-drawer", ["location-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("filter-drawer", ["location-drawer", "satellite-drawer"]);
  });

  // Drawer overlay close behavior for mobile
  drawerOverlay?.addEventListener("click", () => {
    closeAllDrawers();
  });

  // Custom location button
  document.getElementById("custom-location-btn")?.addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("custom-lat").value);
    const lon = parseFloat(document.getElementById("custom-lon").value);
    
    if (isNaN(lat) || isNaN(lon)) {
      showNotification("Please enter valid latitude and longitude values.", "error");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      showNotification("Latitude must be between -90 and 90 degrees.", "error");
      return;
    }
    
    if (lon < -180 || lon > 180) {
      showNotification("Longitude must be between -180 and 180 degrees.", "error");
      return;
    }
    
    goToLocation(lat, lon, `Custom (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    closeAllDrawers();
  });

  // Add custom satellite button
  document.getElementById("add-satellite-btn")?.addEventListener("click", () => {
    const name = document.getElementById("sat-name").value.trim();
    const lon = parseFloat(document.getElementById("sat-lon").value);
    
    if (!name) {
      showNotification("Please enter a satellite name.", "error");
      return;
    }
    
    if (isNaN(lon) || lon < -180 || lon > 180) {
      showNotification("Please enter a valid longitude between -180 and 180.", "error");
      return;
    }
    
    const exists = SATELLITES.some(s => s.name === name || s.longitude === lon);
    if (exists) {
      showNotification("A satellite with this name or longitude already exists.", "error");
      return;
    }
    
    SATELLITES.push({ 
      name, 
      longitude: lon, 
      custom: true 
    });
    
    if (lastLocation) updateApaTable(lastLocation.lat, lastLocation.lon);
    closeAllDrawers();
    
    // Clear input fields
    document.getElementById("sat-name").value = "";
    document.getElementById("sat-lon").value = "";
    
    // Save custom satellites to localStorage
    saveCustomSatellites();
    
    showNotification(`Satellite "${name}" added successfully.`, "success");
  });

  // Reset filters button
  document.getElementById("reset-filters")?.addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    locationSelect.value = "";
    populateFilters();
    filterLocations();
    updateFilterSummary();
    closeAllDrawers();
    
    showNotification("Filters have been reset.", "info");
  });

  // AOR filter change event
  aorFilter.addEventListener("change", () => {
    filterLocations();
    updateFilterSummary();
    
    const selectedAOR = aorFilter.value;
    const countriesInAOR = LOCATIONS.filter(loc => !selectedAOR || loc.aor === selectedAOR)
      .map(loc => loc.country);
    const uniqueCountries = [...new Set(countriesInAOR)].sort();
    
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    uniqueCountries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countryFilter.appendChild(opt);
    });
  });

  // Country filter change event
  countryFilter.addEventListener("change", () => {
    filterLocations();
    updateFilterSummary();
    
    const selectedCountry = countryFilter.value;
    const aorsInCountry = LOCATIONS.filter(loc => !selectedCountry || loc.country === selectedCountry)
      .map(loc => loc.aor);
    const uniqueAORs = [...new Set(aorsInCountry)].sort();
    
    if (!aorFilter.value) {
      aorFilter.innerHTML = '<option value="">All AORs</option>';
      uniqueAORs.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        aorFilter.appendChild(opt);
      });
    }
  });

  // Location selection change event
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
    closeAllDrawers();
  });

  // Tutorial controls
  tutorialPrev?.addEventListener("click", () => {
    if (tutorialStep > 1) {
      tutorialStep--;
      updateTutorial();
    }
  });

  tutorialNext?.addEventListener("click", () => {
    if (tutorialStep < tutorialSteps.length) {
      tutorialStep++;
      updateTutorial();
    } else {
      // End of tutorial
      tutorialOverlay.classList.add("hidden");
      localStorage.setItem("tutorialCompleted", "true");
    }
  });

  // Initialize UI components
  setupDraggablePanel();
  setupTableSorting();
  setupKeyboardNavigation();
  initializePolarPlot();
  
  // Load saved data
  loadCustomSatellites();
  
  // Initialize tutorial steps
  initializeTutorial();
  
  // Show polar plot if it was visible before
  if (localStorage.getItem("polarPlotVisible") === "true") {
    polarPlotContainer.classList.remove("hidden");
  }

  // Filter functionality
  function filterLocations() {
    const selectedAOR = aorFilter.value;
    const selectedCountry = countryFilter.value;
    
    locationSelect.innerHTML = '<option value="">Choose a location...</option>';
    
    const filteredLocations = LOCATIONS.filter(loc => {
      const matchAOR = !selectedAOR || loc.aor === selectedAOR;
      const matchCountry = !selectedCountry || loc.country === selectedCountry;
      return matchAOR && matchCountry;
    });
    
    filteredLocations.sort((a, b) => a.name.localeCompare(b.name));
    
    filteredLocations.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = `${loc.latitude},${loc.longitude}`;
      opt.textContent = loc.name;
      opt.dataset.aor = loc.aor;
      opt.dataset.country = loc.country;
      locationSelect.appendChild(opt);
    });
  }

  function updateFilterSummary() {
    const aor = aorFilter.value;
    const country = countryFilter.value;
    let filterCount = 0;
    
    if (aor) filterCount++;
    if (country) filterCount++;
    
    if (filterCount > 0) {
      filterSummary.textContent = filterCount;
      filterSummary.classList.remove("hidden");
    } else {
      filterSummary.classList.add("hidden");
    }
  }

  // Main location and APA functionality
  function goToLocation(lat, lon, label = "") {
    lastLocation = { lat, lon };
    
    // Set map view
    map.setView([lat, lon], 5);
    
    // Update marker
    if (siteMarker) map.removeLayer(siteMarker);
    
    // Create custom marker
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin"><span class="material-icons-round">location_on</span></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });
    
    siteMarker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);
    siteMarker.bindPopup(`<strong>${label || 'Selected Location'}</strong><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`);
    
    // Show APA panel
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
    
    // Update data
    updateApaTable(lat, lon);
    updatePolarPlot(lat, lon);
    
    // Show location indicator
    currentLocationIndicator.innerHTML = `
      <span class="material-icons-round">location_on</span>
      ${label || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}
    `;
    currentLocationIndicator.classList.remove("hidden");
    
    // Save last location to localStorage
    localStorage.setItem("lastLocation", JSON.stringify({ lat, lon, label }));
  }

  function updateApaTable(lat, lon) {
    apaTableBody.innerHTML = "";
    clearVisualization();
    
    let count = 0;
    
    // Create orbit line for equator
    drawEquator();
    
    SATELLITES.forEach((sat, idx) => {
      const az = ((sat.longitude - lon + 540) % 360 - 180).toFixed(1);
      const el = (90 - Math.abs(lat) - Math.abs(sat.longitude - lon)).toFixed(1);
      const elNum = parseFloat(el);
      const isNegative = elNum < 0;
      const id = `sat-${idx}`;
      const elClass = getElevationClass(elNum);
      const qualityLabel = getElevationLabel(elNum);
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <label class="toggle-switch">
            <input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${isNegative ? "" : "checked"}>
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td class="satellite-name" data-satellite-id="${idx}">${sat.name}</td>
        <td>${sat.longitude.toFixed(1)}°</td>
        <td class="${elClass}">${el}° <span class="quality-badge">${qualityLabel}</span></td>
        <td>${az}°</td>
        <td class="actions-cell">
          ${sat.custom ? 
            `<button class="delete-sat" data-name="${sat.name}" title="Delete Satellite">
               <span class="material-icons-round">delete</span>
             </button>` 
            : ""}
        </td>`;
      
      apaTableBody.appendChild(row);
      count++;
      
      // Add satellite marker
      addSatelliteMarker(sat, elNum < 0);
    });
    
    // Show/hide no results message
    noResultsMessage.classList.toggle("hidden", count > 0);
    
    // Add event listeners for delete buttons
    apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const index = SATELLITES.findIndex(s => s.name === name && s.custom);
        
        if (index !== -1) {
          // Confirm deletion
          if (confirm(`Are you sure you want to delete satellite "${name}"?`)) {
            SATELLITES.splice(index, 1);
            updateApaTable(lastLocation.lat, lastLocation.lon);
            saveCustomSatellites();
            showNotification(`Satellite "${name}" deleted.`, "info");
          }
        }
      });
    });
    
    // Add event listeners for visibility toggles
    apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", function () {
        const id = this.id;
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        const satLon = parseFloat(this.dataset.satlon);
        const name = this.dataset.name;
        
        // Find and remove existing line
        const existing = lineLayers.find(l => l.id === id);
        if (existing) {
          map.removeLayer(existing.layer);
          lineLayers = lineLayers.filter(l => l.id !== id);
          
          // Also remove associated coverage cone if it exists
          const associatedCones = coverageCones.filter(c => c.id === id);
          associatedCones.forEach(cone => map.removeLayer(cone.circle));
          coverageCones = coverageCones.filter(c => c.id !== id);
        }
        
        if (this.checked) {
          const el = 90 - Math.abs(lat) - Math.abs(satLon - lon);
          drawLine(lat, lon, satLon, name, el, id);
        }
      });
    });
    
    // Trigger change event to draw lines for checked satellites
    apaTableBody.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
      cb.dispatchEvent(new Event("change"));
    });
    
    // Add event listeners for satellite name clicks
    apaTableBody.querySelectorAll(".satellite-name").forEach(cell => {
      cell.addEventListener("click", function() {
        const satId = parseInt(this.dataset.satelliteId);
        const satellite = SATELLITES[satId];
        
        if (satellite) {
          // Create and show satellite popup with details
          showSatelliteDetails(satellite, lat, lon);
        }
      });
    });
    
    // Apply sorting if active
    if (sortState.column !== null && sortState.direction !== 'none') {
      sortTable(sortState.column, sortState.direction);
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    // Earth radius in km
    const R = 6371;
    
    // Convert to radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  function showSatelliteDetails(satellite, lat, lon) {
    // Calculate details
    const az = ((satellite.longitude - lon + 540) % 360 - 180).toFixed(1);
    const el = (90 - Math.abs(lat) - Math.abs(satellite.longitude - lon)).toFixed(1);
    const elNum = parseFloat(el);
    const qualityLabel = getElevationLabel(elNum);
    const distance = calculateDistance(lat, lon, 0, satellite.longitude).toFixed(0);
    
    // Create popup content
    const popupContent = `
      <div class="satellite-popup">
        <div class="satellite-popup-header">${satellite.name}</div>
        <div class="satellite-popup-content">
          <div class="satellite-popup-label">Longitude:</div>
          <div class="satellite-popup-value">${satellite.longitude.toFixed(1)}°</div>
          
          <div class="satellite-popup-label">Elevation:</div>
          <div class="satellite-popup-value ${getElevationClass(elNum)}">${el}°</div>
          
          <div class="satellite-popup-label">Azimuth:</div>
          <div class="satellite-popup-value">${az}°</div>
          
          <div class="satellite-popup-label">Quality:</div>
          <div class="satellite-popup-value">${qualityLabel}</div>
          
          <div class="satellite-popup-label">Distance:</div>
          <div class="satellite-popup-value">${distance} km</div>
        </div>
      </div>
    `;
    
    // Find satellite marker
    const satMarker = satelliteMarkers.find(m => m.satellite.name === satellite.name);
    
    if (satMarker) {
      satMarker.marker.bindPopup(popupContent).openPopup();
    } else {
      // If no marker, create a popup at the satellite position
      L.popup()
        .setLatLng([0, satellite.longitude])
        .setContent(popupContent)
        .openOn(map);
    }
  }

  function updateSatelliteLines(lat, lon) {
    // Only redraw lines if they already exist
    if (lineLayers.length > 0) {
      clearVisualization();
      drawEquator();
      
      apaTableBody.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
        const satLon = parseFloat(cb.dataset.satlon);
        const name = cb.dataset.name;
        const el = 90 - Math.abs(lat) - Math.abs(satLon - lon);
        drawLine(lat, lon, satLon, name, el, cb.id);
      });
      
      // Update satellite markers
      SATELLITES.forEach((sat, idx) => {
        const el = 90 - Math.abs(lat) - Math.abs(sat.longitude - lon);
        addSatelliteMarker(sat, el < 0);
      });
    }
    
    // Update polar plot
    if (!polarPlotContainer.classList.contains("hidden")) {
      updatePolarPlot(lat, lon);
    }
  }

  function drawEquator() {
    // Create a polyline along the equator
    const points = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      points.push([0, lon]);
    }
    
    const equatorLine = L.polyline(points, {
      color: '#888',
      weight: 1,
      opacity: 0.5,
      dashArray: '3,5',
      className: 'satellite-orbit'
    }).addTo(map);
    
    orbitPaths.push(equatorLine);
  }

  function drawLine(lat, lon, satLon, label, el, id) {
    // Define line style based on elevation
    const isVisible = el >= 0;
    const color = isVisible ? "#1a73e8" : "#ea4335";
    const className = isVisible ? "apa-line-above" : "apa-line-below";
    const weight = isVisible ? 2.5 : 1.5;
    const dashArray = isVisible ? null : "5,5";
    
    // Create polyline
    const polyline = L.polyline([[lat, lon], [0, satLon]], {
      color,
      weight,
      opacity: 0.9,
      dashArray,
      className
    }).addTo(map);
    
    // Add tooltip
    polyline.bindTooltip(`${label} (${el.toFixed(1)}°)`, {
      permanent: true,
      direction: "center",
      className: "apa-line-label"
    });
    
    // Store line reference
    lineLayers.push({ id, layer: polyline });
    
    // Add coverage cone if visible
    if (isVisible) {
      drawCoverageCone(lat, lon, satLon, el, id);
    }
  }

  function drawCoverageCone(lat, lon, satLon, el, id) {
    // Skip if elevation is too low
    if (el < 0) return;
    
    // Calculate coverage radius (simplified)
    const coverageRadius = Math.min(Math.max(el * 20, 200), 1000);
    
    // Determine color class based on elevation
    let colorClass = 'coverage-cone';
    if (el >= 30) {
      colorClass = 'coverage-cone-excellent';
    } else if (el >= 15) {
      colorClass = 'coverage-cone-good';
    } else if (el >= 5) {
      colorClass = 'coverage-cone-marginal';
    } else {
      colorClass = 'coverage-cone-poor';
    }
    
    // Create circle with appropriate color
    const coverageCircle = L.circle([lat, lon], {
      radius: coverageRadius * 1000, // Convert to meters
      className: colorClass,
      interactive: false
    }).addTo(map);
    
    // Store the circle with its associated satellite ID
    coverageCones.push({
      id: id,
      circle: coverageCircle
    });
  }

  function addSatelliteMarker(satellite, isBelow) {
    // Remove existing marker for this satellite
    const existingIndex = satelliteMarkers.findIndex(m => m.satellite.name === satellite.name);
    if (existingIndex !== -1) {
      map.removeLayer(satelliteMarkers[existingIndex].marker);
      satelliteMarkers.splice(existingIndex, 1);
    }
    
    // Create custom marker icon
    const satIcon = L.divIcon({
      className: isBelow ? 'satellite-marker-below' : 'satellite-marker',
      html: `<div class="satellite-icon"><span class="material-icons-round">${isBelow ? 'satellite_alt' : 'satellite'}</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // Add marker
    const marker = L.marker([0, satellite.longitude], { 
      icon: satIcon,
      zIndexOffset: isBelow ? 100 : 200 // Visible satellites on top
    }).addTo(map);
    
    // Store marker reference
    satelliteMarkers.push({ 
      satellite, 
      marker,
      isBelow
    });
  }

  function clearVisualization() {
    // Remove all lines
    lineLayers.forEach(l => map.removeLayer(l.layer));
    lineLayers = [];
    
    // Remove all satellite markers
    satelliteMarkers.forEach(m => map.removeLayer(m.marker));
    satelliteMarkers = [];
    
    // Remove orbit paths
    orbitPaths.forEach(p => map.removeLayer(p));
    orbitPaths = [];
    
    // Remove coverage cones
    coverageCones.forEach(c => map.removeLayer(c.circle));
    coverageCones = [];
  }

  function initializePolarPlot() {
    // Clear any existing elements
    while (polarPlot.firstChild) {
      polarPlot.removeChild(polarPlot.firstChild);
    }
    
    // Draw background circles
    const circles = [0.2, 0.4, 0.6, 0.8];
    circles.forEach(radius => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "100");
      circle.setAttribute("cy", "100");
      circle.setAttribute("r", (radius * 100).toString());
      circle.setAttribute("class", "polar-plot-circle");
      polarPlot.appendChild(circle);
    });
    
    // Draw center point
    const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    center.setAttribute("cx", "100");
    center.setAttribute("cy", "100");
    center.setAttribute("r", "2");
    center.setAttribute("fill", "var(--color-text-secondary)");
    polarPlot.appendChild(center);
    
    // Draw cardinal directions
    const directions = [
      { angle: 0, label: "E" },
      { angle: 90, label: "S" },
      { angle: 180, label: "W" },
      { angle: 270, label: "N" }
    ];
    
    directions.forEach(dir => {
      // Draw line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const x = 100 + 100 * Math.cos(dir.angle * Math.PI / 180);
      const y = 100 + 100 * Math.sin(dir.angle * Math.PI / 180);
      line.setAttribute("x1", "100");
      line.setAttribute("y1", "100");
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("class", "polar-plot-line");
      polarPlot.appendChild(line);
      
      // Add label
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelX = 100 + 110 * Math.cos(dir.angle * Math.PI / 180);
      const labelY = 100 + 110 * Math.sin(dir.angle * Math.PI / 180);
      label.setAttribute("x", labelX.toString());
      label.setAttribute("y", labelY.toString());
      label.setAttribute("class", "polar-plot-label");
      label.textContent = dir.label;
      polarPlot.appendChild(label);
    });
    
    // Add elevation labels
    const elevations = [
      { radius: 0.2, label: "80°" },
      { radius: 0.4, label: "60°" },
      { radius: 0.6, label: "40°" },
      { radius: 0.8, label: "20°" },
      { radius: 0.95, label: "0°" }
    ];
    
    elevations.forEach(el => {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "100");
      label.setAttribute("y", (100 - el.radius * 100 - 5).toString());
      label.setAttribute("class", "polar-plot-label");
      label.setAttribute("text-anchor", "middle");
      label.textContent = el.label;
      polarPlot.appendChild(label);
    });
    
    // Add title
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", "100");
    title.setAttribute("y", "15");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("font-size", "12px");
    title.textContent = "Satellite Polar View";
    polarPlot.appendChild(title);
  }

  function updatePolarPlot(lat, lon) {
    // Remove existing satellite dots
    const existingDots = polarPlot.querySelectorAll(".polar-plot-satellite, .polar-plot-satellite-below");
    existingDots.forEach(dot => dot.remove());
    
    // Add dots for each satellite
    SATELLITES.forEach(sat => {
      // Calculate azimuth and elevation
      const az = ((sat.longitude - lon + 540) % 360 - 180) * Math.PI / 180;
      const el = 90 - Math.abs(lat) - Math.abs(sat.longitude - lon);
      
      // Skip if extremely low elevation (below horizon)
      if (el < -10) return;
      
      // Convert to polar coordinates (0 elevation at edge, 90 at center)
      const radius = (90 - Math.max(el, 0)) / 90 * 100;
      
      // Calculate position
      const x = 100 + radius * Math.sin(az);
      const y = 100 - radius * Math.cos(az);
      
      // Create dot
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", x.toString());
      dot.setAttribute("cy", y.toString());
      dot.setAttribute("r", "4");
      dot.setAttribute("class", el < 0 ? "polar-plot-satellite-below" : "polar-plot-satellite");
      
      // Add satellite name as title (tooltip)
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${sat.name}: ${el.toFixed(1)}° elevation`;
      dot.appendChild(title);
      
      polarPlot.appendChild(dot);
    });
  }

  function setupDraggablePanel() {
    const apaPanelHeader = document.querySelector('.apa-panel-header');
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    
    if (!apaPanelHeader) return;
    
    // Restore panel position from localStorage
    const savedPosition = localStorage.getItem('apaPanelPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        apaPanel.style.top = pos.top;
        apaPanel.style.left = pos.left;
        apaPanel.style.right = 'auto';
      } catch (e) {
        console.error('Failed to restore panel position:', e);
      }
    }
    
    // Mouse events for desktop
    apaPanelHeader.addEventListener('mousedown', (e) => {
      // Skip if clicking on buttons
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      
      isDragging = true;
      dragOffsetX = e.clientX - apaPanel.getBoundingClientRect().left;
      dragOffsetY = e.clientY - apaPanel.getBoundingClientRect().top;
      apaPanelHeader.style.cursor = 'grabbing';
      
      // Prevent text selection during dragging
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      // Get screen dimensions
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate new position
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      
      // Keep within screen boundaries
      newLeft = Math.max(0, Math.min(screenWidth - 100, newLeft));
      newTop = Math.max(0, Math.min(screenHeight - 100, newTop));
      
      // Update position
      apaPanel.style.right = 'auto';
      apaPanel.style.left = newLeft + 'px';
      apaPanel.style.top = newTop + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      apaPanelHeader.style.cursor = 'grab';
      
      // Save panel position to localStorage
      localStorage.setItem('apaPanelPosition', JSON.stringify({
        top: apaPanel.style.top,
        left: apaPanel.style.left
      }));
    });
    
    // Touch events for mobile
    apaPanelHeader.addEventListener('touchstart', (e) => {
      // Skip if touching buttons
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      
      isDragging = true;
      const touch = e.touches[0];
      dragOffsetX = touch.clientX - apaPanel.getBoundingClientRect().left;
      dragOffsetY = touch.clientY - apaPanel.getBoundingClientRect().top;
      
      e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      
      // Get screen dimensions
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate new position
      let newLeft = touch.clientX - dragOffsetX;
      let newTop = touch.clientY - dragOffsetY;
      
      // Keep within screen boundaries
      newLeft = Math.max(0, Math.min(screenWidth - 100, newLeft));
      newTop = Math.max(0, Math.min(screenHeight - 100, newTop));
      
      // Update position
      apaPanel.style.right = 'auto';
      apaPanel.style.left = newLeft + 'px';
      apaPanel.style.top = newTop + 'px';
      
      e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Save panel position to localStorage
      localStorage.setItem('apaPanelPosition', JSON.stringify({
        top: apaPanel.style.top,
        left: apaPanel.style.left
      }));
    });
    
    // Handle mobile bottom sheet behavior
    if (window.innerWidth <= 768) {
      setupBottomSheet();
    }
    
    // Re-init on window resize
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth <= 768) {
        setupBottomSheet();
      }
    }, 250));
  }

  function setupBottomSheet() {
    const apaPanelHeader = document.querySelector('.apa-panel-header');
    let startY, startHeight;
    
    // Reset position for mobile
    apaPanel.style.left = '0';
    apaPanel.style.right = '0';
    apaPanel.style.bottom = '0';
    apaPanel.style.top = 'auto';
    
    // Add swipe up/down gesture
    apaPanelHeader.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startHeight = apaPanel.offsetHeight;
    });
    
    apaPanelHeader.addEventListener('touchmove', (e) => {
      const deltaY = startY - e.touches[0].clientY;
      const newHeight = Math.max(40, Math.min(window.innerHeight * 0.8, startHeight + deltaY));
      
      apaPanel.style.height = newHeight + 'px';
      
      // If panel is being minimized
      if (newHeight <= 60) {
        apaPanel.classList.add('minimized');
        minimizePanelBtn.querySelector('.material-icons-round').textContent = 'expand_less';
      } else {
        apaPanel.classList.remove('minimized');
        minimizePanelBtn.querySelector('.material-icons-round').textContent = 'remove';
      }
    });
    
    apaPanelHeader.addEventListener('touchend', () => {
      localStorage.setItem('apaPanelMinimized', apaPanel.classList.contains('minimized'));
    });
  }

  function setupTableSorting() {
    apaTableHeaders.forEach((header, index) => {
      // Skip first column (checkbox) and last column (actions)
      if (index === 0 || index === apaTableHeaders.length - 1) return;
      
      header.classList.add('sortable');
      header.title = 'Click to sort';
      header.dataset.sortDir = 'none';
      header.dataset.columnIdx = index.toString();
      
      header.addEventListener('click', () => {
        // Get current and new sort direction
        const sortDir = header.dataset.sortDir === 'asc' ? 'desc' : 'asc';
        
        // Update header states
        apaTableHeaders.forEach(h => {
          if (h !== header) {
            h.dataset.sortDir = 'none';
            h.classList.remove('sort-asc', 'sort-desc');
          }
        });
        
        header.dataset.sortDir = sortDir;
        header.classList.toggle('sort-asc', sortDir === 'asc');
        header.classList.toggle('sort-desc', sortDir === 'desc');
        
        // Save sort state
        sortState.column = index;
        sortState.direction = sortDir;
        
        // Sort the table
        sortTable(index, sortDir);
        
        // Announce sorting for screen readers
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = `Table sorted by ${header.textContent} in ${sortDir === 'asc' ? 'ascending' : 'descending'} order`;
        document.body.appendChild(announcement);
        
        // Remove announcement after it's been read
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
      });
    });
  }

  function sortTable(columnIndex, direction) {
    const rows = Array.from(apaTableBody.querySelectorAll('tr'));
    
    const sortedRows = rows.sort((a, b) => {
      let aVal = a.cells[columnIndex].textContent.trim();
      let bVal = b.cells[columnIndex].textContent.trim();
      
      // Extract numeric values if they exist
      const aMatch = aVal.match(/(-?\d+\.?\d*)/);
      const bMatch = bVal.match(/(-?\d+\.?\d*)/);
      
      if (aMatch && bMatch) {
        // Numeric sorting
        aVal = parseFloat(aMatch[0]);
        bVal = parseFloat(bMatch[0]);
      } else {
        // Remove any quality badges for text comparison
        aVal = aVal.replace(/\s*\([^)]*\)/g, '');
        bVal = bVal.replace(/\s*\([^)]*\)/g, '');
      }
      
      // Determine sort order
      if (direction === 'asc') {
        return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
      } else {
        return aVal < bVal ? 1 : (aVal > bVal ? -1 : 0);
      }
    });
    
    // Clear and re-append in sorted order
    while (apaTableBody.firstChild) {
      apaTableBody.removeChild(apaTableBody.firstChild);
    }
    
    sortedRows.forEach(row => apaTableBody.appendChild(row));
  }

  function setupKeyboardNavigation() {
    // Add tab indices to interactive elements
    const tabbableElements = [
      ...document.querySelectorAll('.drawer button, .drawer input, .drawer select, .floating-control'),
      minimizePanelBtn,
      closePanelBtn,
      toggleApaBtn
    ].filter(el => el); // Filter out null elements
    
    tabbableElements.forEach((el, i) => {
      el.setAttribute('tabindex', (i + 1).toString());
    });
    
    // ESC key to close drawers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDrawers();
        
        // Also close tutorial if open
        if (!tutorialOverlay.classList.contains('hidden')) {
          tutorialOverlay.classList.add('hidden');
        }
      }
    });
    
    // Arrow key navigation in APA table
    apaTableBody.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      const currentCell = document.activeElement.closest('td');
      if (!currentCell) return;
      
      const currentRow = currentCell.parentElement;
      const rows = Array.from(apaTableBody.rows);
      const rowIndex = rows.indexOf(currentRow);
      const cellIndex = Array.from(currentRow.cells).indexOf(currentCell);
      
      switch (e.key) {
        case 'ArrowUp':
          if (rowIndex > 0) {
            const targetCell = rows[rowIndex - 1].cells[cellIndex];
            const focusableElement = targetCell.querySelector('button, input') || targetCell;
            focusableElement.focus();
          }
          break;
        case 'ArrowDown':
          if (rowIndex < rows.length - 1) {
            const targetCell = rows[rowIndex + 1].cells[cellIndex];
            const focusableElement = targetCell.querySelector('button, input') || targetCell;
            focusableElement.focus();
          }
          break;
        case 'ArrowLeft':
          if (cellIndex > 0) {
            const targetCell = currentRow.cells[cellIndex - 1];
            const focusableElement = targetCell.querySelector('button, input') || targetCell;
            focusableElement.focus();
          }
          break;
        case 'ArrowRight':
          if (cellIndex < currentRow.cells.length - 1) {
            const targetCell = currentRow.cells[cellIndex + 1];
            const focusableElement = targetCell.querySelector('button, input') || targetCell;
            focusableElement.focus();
          }
          break;
      }
      
      e.preventDefault();
    });
  }

  function saveCustomSatellites() {
    const customSats = SATELLITES.filter(sat => sat.custom);
    if (customSats.length > 0) {
      localStorage.setItem('customSatellites', JSON.stringify(customSats));
    } else {
      localStorage.removeItem('customSatellites');
    }
  }

  function loadCustomSatellites() {
    const savedSats = localStorage.getItem('customSatellites');
    if (savedSats) {
      try {
        const customSats = JSON.parse(savedSats);
        // Filter out duplicates
        customSats.forEach(sat => {
          if (!SATELLITES.some(s => s.name === sat.name || s.longitude === sat.longitude)) {
            SATELLITES.push(sat);
          }
        });
      } catch (e) {
        console.error('Failed to load custom satellites:', e);
      }
    }
  }

  function restoreLastLocation() {
    const savedLocation = localStorage.getItem('lastLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        goToLocation(location.lat, location.lon, location.label);
      } catch (e) {
        console.error('Failed to restore last location:', e);
      }
    }
  }

  function toggleDrawer(drawerId, others) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    
    const isOpen = drawer.classList.contains("visible");
    
    // Close all drawers first
    closeAllDrawers();
    
    // Then open the requested drawer if it wasn't already open
    if (!isOpen) {
      drawer.classList.add("visible");
      drawerOverlay.classList.add("visible");
      
      // If this is an input drawer, focus the first input
      const firstInput = drawer.querySelector('input, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  function closeAllDrawers() {
    document.querySelectorAll('.drawer.visible').forEach(openDrawer => {
      openDrawer.classList.remove("visible");
    });
    drawerOverlay.classList.remove("visible");
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';
    
    notification.innerHTML = `
      <span class="material-icons-round">${icon}</span>
      <span>${message}</span>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  function initializeTutorial() {
    tutorialSteps = [
      {
        title: "Welcome to APA App",
        content: "This tutorial will guide you through the basic features of the Antenna Pointing Angles App.",
        highlight: null
      },
      {
        title: "Select a Location",
        content: "Use the location buttons in the top left to select a predefined location or enter custom coordinates.",
        highlight: "toggle-filter-drawer"
      },
      {
        title: "View Satellite Data",
        content: "The APA table shows all satellites and their pointing angles from your current location.",
        highlight: "apa-panel"
      },
      {
        title: "Toggle Satellite Lines",
        content: "Switch satellites on/off using the toggles in the first column. Blue lines indicate satellites above the horizon.",
        highlight: "apa-table"
      },
      {
        title: "You're Ready!",
        content: "You now know the basics of the APA App. Explore additional features like the polar plot, custom satellites, and dark mode.",
        highlight: null
      }
    ];
  }

  function startTutorial() {
    tutorialStep = 1;
    tutorialOverlay.classList.remove('hidden');
    updateTutorial();
  }

  function updateTutorial() {
    const step = tutorialSteps[tutorialStep - 1];
    
    // Update content
    document.querySelector('.tutorial-header').textContent = step.title;
    tutorialContent.textContent = step.content;
    
    // Update progress indicator
    tutorialProgress.textContent = `${tutorialStep}/${tutorialSteps.length}`;
    
    // Enable/disable previous button
    tutorialPrev.disabled = tutorialStep <= 1;
    
    // Update next button text
    if (tutorialStep >= tutorialSteps.length) {
      tutorialNext.textContent = 'Finish';
    } else {
      tutorialNext.textContent = 'Next';
    }
    
    // Add highlight if specified
    if (step.highlight) {
      highlightElement(step.highlight);
    } else {
      removeHighlight();
    }
  }

  function highlightElement(elementId) {
    removeHighlight();
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    
    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    highlight.style.top = rect.top + 'px';
    highlight.style.left = rect.left + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';
    
    document.body.appendChild(highlight);
  }

  function removeHighlight() {
    const existingHighlight = document.querySelector('.tutorial-highlight');
    if (existingHighlight) {
      existingHighlight.remove();
    }
  }

  // Add event listeners for all drawer close buttons
  document.querySelectorAll('.drawer-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const drawerId = this.dataset.drawer;
      if (drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          drawer.classList.remove('visible');
          drawerOverlay.classList.remove('visible');
        }
      }
    });
  });

  // Initialize app
  populateFilters();
  filterLocations();
  
  // Restore last location if available
  setTimeout(() => {
    // If no stored location, show a default one
    if (!localStorage.getItem('lastLocation')) {
      // Show a default location (first in the list)
      if (LOCATIONS.length > 0) {
        const defaultLocation = LOCATIONS[0];
        goToLocation(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.name);
      }
    } else {
      restoreLastLocation();
    }
    
    // Show tutorial if first time
    if (!localStorage.getItem('tutorialCompleted') && localStorage.getItem('helpDismissed')) {
      setTimeout(startTutorial, 1000);
    }
  }, 500);
  
  // Initialize filters
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
  
  // Announce app is ready for screen readers
  setTimeout(() => {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', 'assertive');
    announcement.textContent = 'APA App is ready. Use the buttons to select a location and view satellite pointing angles.';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, 1000);
});

// Add a helper class for the grid lines since they're added via a separate library
// Define L.LatLngGraticule as a Leaflet class extension
L.LatLngGraticule = L.LayerGroup.extend({
  initialize: function(options) {
    L.LayerGroup.prototype.initialize.call(this);
    this.options = L.extend({
      showLabel: true,
      opacity: 0.5,
      weight: 1,
      color: '#111',
      font: '12px Helvetica, sans-serif',
      fontColor: '#555',
      dashArray: [0, 0],
      format: function(n) { return Math.abs(n) + (n < 0 ? 'S' : 'N'); },
      zoomInterval: [
        {start: 2, end: 3, interval: 30},
        {start: 4, end: 4, interval: 10},
        {start: 5, end: 7, interval: 5},
        {start: 8, end: 10, interval: 1}
      ]
    }, options);
    
    this.lineStyle = {
      stroke: true,
      color: this.options.color,
      opacity: this.options.opacity,
      weight: this.options.weight,
      dashArray: this.options.dashArray
    };
  },
  
  onAdd: function(map) {
    this._map = map;
    this._update();
    
    this._map.on('zoomend', this._update, this);
    return this;
  },
  
  onRemove: function(map) {
    map.off('zoomend', this._update, this);
    this.clearLayers();
  },

  setStyle: function(style) {
    L.extend(this.options, style);
    this.lineStyle = {
      stroke: true,
      color: this.options.color,
      opacity: this.options.opacity,
      weight: this.options.weight,
      dashArray: this.options.dashArray
    };
    this._update();
  },
  
  _update: function() {
    this.clearLayers();
    
    const zoom = this._map.getZoom();
    let interval = 30;
    
    for (const i of this.options.zoomInterval) {
      if (zoom >= i.start && zoom <= i.end) {
        interval = i.interval;
        break;
      }
    }
    
    if (interval > 0) {
      this._drawGraticule(interval);
    }
  },
  
  _drawGraticule: function(interval) {
    const latLines = [];
    const lngLines = [];
    
    // Draw meridians (longitude lines)
    for (let lng = -180; lng <= 180; lng += interval) {
      const line = L.polyline([[-90, lng], [90, lng]], this.lineStyle);
      lngLines.push(line);
      this.addLayer(line);
      
      if (this.options.showLabel) {
        this._addLabel(0, lng, lng + '°');
      }
    }
    
    // Draw parallels (latitude lines)
    for (let lat = -90; lat <= 90; lat += interval) {
      if (lat === -90 || lat === 90) continue;
      const line = L.polyline([[lat, -180], [lat, 180]], this.lineStyle);
      latLines.push(line);
      this.addLayer(line);
      
      if (this.options.showLabel) {
        this._addLabel(lat, 0, lat + '°');
      }
    }
  },
  
  _addLabel: function(lat, lng, label) {
    const point = this._map.latLngToLayerPoint([lat, lng]);
    
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'grid-label',
        html: label,
        iconSize: [50, 20]
      })
    }).addTo(this);
  }
});

// Function to create an instance
L.latlngGraticule = function(options) {
  return new L.LatLngGraticule(options);
};
