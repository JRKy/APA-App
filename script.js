// APA App Script - v1.8.0

let map;
let siteMarker;
let lineLayers = [];
let lastLocation = null;

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

document.addEventListener("DOMContentLoaded", () => {
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
  const apaLegend = document.getElementById("apa-legend");
  const noResultsMessage = document.getElementById("apa-no-results");
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  // Initialize dark mode from localStorage if available
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    if (darkModeToggle) {
      darkModeToggle.textContent = "☀️";
      darkModeToggle.title = "Switch to Light Mode";
    }
  }

  // Dark mode toggle functionality
  darkModeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
    darkModeToggle.title = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
    localStorage.setItem("darkMode", isDarkMode);
  });

  const hideHelpBtn = document.getElementById("hide-help-tooltip");
  if (hideHelpBtn) {
    hideHelpBtn.addEventListener("click", () => {
      helpTooltip.classList.add("hidden");
      localStorage.setItem("helpDismissed", "true");
    });
  }

  // Check if help tooltip should be shown
  if (localStorage.getItem("helpDismissed") === "true") {
    helpTooltip.classList.add("hidden");
  }

  legendToggle?.addEventListener("click", () => {
    apaLegend.classList.toggle("hidden");
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

  // Add debounced map event handlers for better performance
  map.on('zoomend moveend', debounce(() => {
    if (lastLocation) {
      updateSatelliteLines(lastLocation.lat, lastLocation.lon);
    }
  }, 100));

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
    apaPanel.style.display = "none";
    toggleApaBtn.style.display = "block";
  });

  minimizePanelBtn?.addEventListener("click", () => {
    apaPanel.classList.toggle("minimized");
    localStorage.setItem("apaPanelMinimized", apaPanel.classList.contains("minimized"));
  });

  // Restore APA panel state from localStorage
  if (localStorage.getItem("apaPanelMinimized") === "true") {
    apaPanel.classList.add("minimized");
  }

  toggleApaBtn?.addEventListener("click", () => {
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
  });

  document.getElementById("toggle-location-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-drawer", ["satellite-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-drawer", ["location-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("filter-drawer", ["location-drawer", "satellite-drawer"]);
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

    // Save custom satellites to localStorage
    saveCustomSatellites();
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

  // Make APA panel draggable
  setupDraggablePanel();

  // Add column sorting to APA table
  setupTableSorting();

  // Add keyboard navigation support
  setupKeyboardNavigation();

  // Restore custom satellites from localStorage
  loadCustomSatellites();

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
    apaPanel.style.display = "block";
    toggleApaBtn.style.display = "none";
    updateApaTable(lat, lon);
    currentLocationIndicator.textContent = `Current Location: ${label || `${lat.toFixed(2)}, ${lon.toFixed(2)}`}`;
    currentLocationIndicator.classList.remove("hidden");

    // Save last location to localStorage
    localStorage.setItem("lastLocation", JSON.stringify({ lat, lon, label }));
  }

  function updateApaTable(lat, lon) {
    apaTableBody.innerHTML = "";
    clearLines();
    let count = 0;
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
      count++;
    });

    noResultsMessage.classList.toggle("hidden", count > 0);

    apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const index = SATELLITES.findIndex(s => s.name === name && s.custom);
        if (index !== -1) {
          SATELLITES.splice(index, 1);
          updateApaTable(lastLocation.lat, lastLocation.lon);
          // Save updated satellites list to localStorage
          saveCustomSatellites();
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

  function updateSatelliteLines(lat, lon) {
    // Only redraw lines if they already exist
    if (lineLayers.length > 0) {
      clearLines();
      apaTableBody.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
        const satLon = parseFloat(cb.dataset.satlon);
        const name = cb.dataset.name;
        const el = 90 - Math.abs(lat) - Math.abs(satLon - lon);
        drawLine(lat, lon, satLon, name, el, cb.id);
      });
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

  function drawSatelliteIcon(lon) {
    const satIcon = L.divIcon({
      html: `<div class="satellite-icon">🛰️</div>`,
      className: 'satellite-marker',
      iconSize: [24, 24]
    });
    
    return L.marker([0, lon], { icon: satIcon }).addTo(map);
  }

  function clearLines() {
    lineLayers.forEach(l => map.removeLayer(l.layer));
    lineLayers = [];
  }

  function toggleDrawer(drawerId, others) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    
    const isOpen = drawer.classList.contains("visible");
    
    // Close all drawers first
    document.querySelectorAll('.drawer.visible').forEach(openDrawer => {
      openDrawer.classList.remove("visible");
    });
    
    // Then open the requested drawer if it wasn't already open
    if (!isOpen) {
      drawer.classList.add("visible");
      
      // If this is an input drawer, focus the first input
      const firstInput = drawer.querySelector('input, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
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

  function setupDraggablePanel() {
    const apaPanelHeader = document.querySelector('.apa-panel-header');
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    
    if (!apaPanelHeader) return;
    
    apaPanelHeader.style.cursor = 'grab';
    
    // Restore panel position from localStorage
    const savedPosition = localStorage.getItem('apaPanelPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        apaPanel.style.top = pos.top;
        apaPanel.style.right = pos.right;
      } catch (e) {
        console.error('Failed to restore panel position:', e);
      }
    }
    
    apaPanelHeader.addEventListener('mousedown', (e) => {
      // Skip if clicking on buttons
      if (e.target.tagName === 'BUTTON') return;
      
      isDragging = true;
      dragOffsetX = e.clientX - apaPanel.getBoundingClientRect().left;
      dragOffsetY = e.clientY - apaPanel.getBoundingClientRect().top;
      apaPanelHeader.style.cursor = 'grabbing';
      
      // Prevent text selection during dragging
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const panelWidth = apaPanel.getBoundingClientRect().width;
      const screenWidth = window.innerWidth;
      
      apaPanel.style.right = 'auto'; // Remove right positioning
      apaPanel.style.left = (e.clientX - dragOffsetX) + 'px';
      apaPanel.style.top = (e.clientY - dragOffsetY) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      apaPanelHeader.style.cursor = 'grab';
      
      // Save panel position to localStorage
      const rect = apaPanel.getBoundingClientRect();
      localStorage.setItem('apaPanelPosition', JSON.stringify({
        top: apaPanel.style.top,
        left: apaPanel.style.left
      }));
    });
    
    // Add touch support for mobile
    apaPanelHeader.addEventListener('touchstart', (e) => {
      // Skip if touching buttons
      if (e.target.tagName === 'BUTTON') return;
      
      isDragging = true;
      const touch = e.touches[0];
      dragOffsetX = touch.clientX - apaPanel.getBoundingClientRect().left;
      dragOffsetY = touch.clientY - apaPanel.getBoundingClientRect().top;
      
      e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      apaPanel.style.right = 'auto';
      apaPanel.style.left = (touch.clientX - dragOffsetX) + 'px';
      apaPanel.style.top = (touch.clientY - dragOffsetY) + 'px';
      
      e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Save panel position to localStorage
      const rect = apaPanel.getBoundingClientRect();
      localStorage.setItem('apaPanelPosition', JSON.stringify({
        top: apaPanel.style.top,
        left: apaPanel.style.left
      }));
    });
  }

  function setupTableSorting() {
    apaTableHeaders.forEach((header, index) => {
      // Skip first column (checkbox) and last column (actions)
      if (index === 0 || index === apaTableHeaders.length - 1) return;
      
      header.classList.add('sortable');
      header.title = 'Click to sort';
      header.dataset.sortDir = 'none';
      
      header.addEventListener('click', () => {
        // Clear sort indicators from other headers
        apaTableHeaders.forEach(h => {
          if (h !== header) {
            h.dataset.sortDir = 'none';
            h.classList.remove('sort-asc', 'sort-desc');
          }
        });
        
        const sortDir = header.dataset.sortDir === 'asc' ? 'desc' : 'asc';
        header.dataset.sortDir = sortDir;
        header.classList.toggle('sort-asc', sortDir === 'asc');
        header.classList.toggle('sort-desc', sortDir === 'desc');
        
        const rows = Array.from(apaTableBody.querySelectorAll('tr'));
        const sortedRows = rows.sort((a, b) => {
          const aVal = a.cells[index].textContent.trim();
          const bVal = b.cells[index].textContent.trim();
          
          // Numeric sorting
          if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
            return sortDir === 'asc' 
              ? parseFloat(aVal) - parseFloat(bVal)
              : parseFloat(bVal) - parseFloat(aVal);
          }
          
          // Alphabetical sorting
          return sortDir === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        });
        
        // Remove existing rows
        while (apaTableBody.firstChild) {
          apaTableBody.removeChild(apaTableBody.firstChild);
        }
        
        // Append sorted rows
        sortedRows.forEach(row => apaTableBody.appendChild(row));
        
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

  function setupKeyboardNavigation() {
    // Add tab indices to interactive elements
    const tabbableElements = [
      ...document.querySelectorAll('.drawer button, .drawer input, .drawer select'),
      ...document.querySelectorAll('.drawer-buttons button'),
      minimizePanelBtn,
      closePanelBtn,
      toggleApaBtn
    ].filter(el => el); // Filter out null elements
    
    tabbableElements.forEach((el, i) => {
      el.setAttribute('tabindex', i + 1);
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

  // Restore last location from localStorage
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

  // Add event listeners for all drawer close buttons
  document.querySelectorAll('.drawer-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const drawerId = this.dataset.drawer;
      if (drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          drawer.classList.remove('visible');
        }
      }
    });
  });

  // Add escape key functionality to close all drawers
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.drawer.visible').forEach(drawer => {
        drawer.classList.remove('visible');
      });
    }
  });

  // Initialize app
  populateFilters();
  filterLocations();
  
  // Restore last location if available
  setTimeout(restoreLastLocation, 500);
  
  // Announce app is ready for screen readers
  const announcement = document.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('aria-live', 'assertive');
  announcement.textContent = 'APA App is ready. Use the buttons to select a location and view satellite pointing angles.';
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
});
