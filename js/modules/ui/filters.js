// filters.js - Filter UI functionality
import { 
  getUniqueAORs, 
  getUniqueCountries,
  getCountriesInAOR,
  getAORsInCountry,
  filterLocationsByAorAndCountry,
  goToLocation 
} from '../data/locations.js';
import { showNotification, makeAnnouncement } from '../core/utils.js';
import { eventBus } from '../core/events.js';
import { calculateElevation } from '../calculations/angles.js';

/**
 * Initialize filter UI
 */
export function initFilters() {
  populateFilters();
}

/**
 * Set up filter event handlers
 */
export function setupFilterHandlers() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const locationSelect = document.getElementById("location-select");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const filterSummary = document.getElementById("filter-summary");
  
  if (!aorFilter || !countryFilter || !locationSelect || !resetFiltersBtn || !filterSummary) return;
  
  // AOR filter change event
  aorFilter.addEventListener("change", () => {
    filterLocations();
    updateFilterSummary();
    
    const selectedAOR = aorFilter.value;
    const countriesInAOR = getCountriesInAOR(selectedAOR);
    
    // Update country dropdown
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    countriesInAOR.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countryFilter.appendChild(opt);
    });
    
    // Publish event
    eventBus.publish('aorFilterChanged', selectedAOR);
  });

  // Country filter change event
  countryFilter.addEventListener("change", () => {
    filterLocations();
    updateFilterSummary();
    
    const selectedCountry = countryFilter.value;
    const aorsInCountry = getAORsInCountry(selectedCountry);
    
    // If AOR filter is empty, update it with filtered options
    if (!aorFilter.value) {
      aorFilter.innerHTML = '<option value="">All AORs</option>';
      aorsInCountry.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        aorFilter.appendChild(opt);
      });
    }
    
    // Publish event
    eventBus.publish('countryFilterChanged', selectedCountry);
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
    locationSelect.value = selected.value;
    
    const [lat, lon] = selected.value.split(",").map(Number);
    goToLocation(lat, lon, selected.textContent);
    updateFilterSummary();
    
    // Close all drawers
    eventBus.publish('drawersAllClosed');
    
    // Publish event
    eventBus.publish('locationSelected', {
      name: selected.textContent,
      lat,
      lon,
      aor,
      country
    });
  });
  
  // Reset filters button
  resetFiltersBtn.addEventListener("click", () => {
    aorFilter.value = "";
    countryFilter.value = "";
    locationSelect.value = "";
    populateFilters();
    filterLocations();
    updateFilterSummary();
    
    // Close all drawers
    eventBus.publish('drawersAllClosed');
    
    showNotification("Filters have been reset.", "info");
    
    // Publish event
    eventBus.publish('filtersReset');
  });
}

/**
 * Populate filter dropdowns with initial options
 */
export function populateFilters() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const locationSelect = document.getElementById("location-select");
  
  if (!aorFilter || !countryFilter || !locationSelect) return;
  
  // Populate AOR filter
  const uniqueAORs = getUniqueAORs();
  aorFilter.innerHTML = '<option value="">All AORs</option>';
  uniqueAORs.forEach(aor => {
    const opt = document.createElement("option");
    opt.value = aor;
    opt.textContent = aor;
    aorFilter.appendChild(opt);
  });
  
  // Populate Country filter
  const uniqueCountries = getUniqueCountries();
  countryFilter.innerHTML = '<option value="">All Countries</option>';
  uniqueCountries.forEach(country => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    countryFilter.appendChild(opt);
  });
  
  // Filter locations
  filterLocations();
}

/**
 * Filter the locations dropdown based on selected AOR and country
 */
export function filterLocations() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const locationSelect = document.getElementById("location-select");
  
  if (!aorFilter || !countryFilter || !locationSelect) return;
  
  const selectedAOR = aorFilter.value;
  const selectedCountry = countryFilter.value;
  
  // Clear and update location select
  locationSelect.innerHTML = '<option value="">Choose a location...</option>';
  
  const filteredLocations = filterLocationsByAorAndCountry(selectedAOR, selectedCountry);
  
  filteredLocations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = `${loc.latitude},${loc.longitude}`;
    opt.textContent = loc.name;
    opt.dataset.aor = loc.aor;
    opt.dataset.country = loc.country;
    locationSelect.appendChild(opt);
  });
  
  // Publish event
  eventBus.publish('locationsFiltered', {
    aor: selectedAOR,
    country: selectedCountry,
    count: filteredLocations.length
  });
}

/**
 * Update the filter summary badge
 */
export function updateFilterSummary() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const filterSummary = document.getElementById("filter-summary");
  
  if (!aorFilter || !countryFilter || !filterSummary) return;
  
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

/**
 * Initialize advanced satellite filters
 */
export function initAdvancedFilters() {
  const filterDrawer = document.getElementById("filter-drawer");
  if (!filterDrawer) return;
  
  // Check if advanced filters already exist
  if (document.querySelector('.advanced-filters-section')) return;
  
  // Create advanced filters section
  const advancedSection = document.createElement('div');
  advancedSection.className = 'advanced-filters-section';
  advancedSection.innerHTML = `
    <div class="drawer-header">
      <h3>Advanced Satellite Filters</h3>
    </div>
    
    <label for="min-elevation">Minimum Elevation:</label>
    <div class="range-filter">
      <input type="range" id="min-elevation" min="-10" max="90" value="-10" class="range-slider">
      <span id="min-elevation-value">-10°</span>
    </div>
    
    <label for="satellite-type">Satellite Type:</label>
    <select id="satellite-type">
      <option value="all">All Satellites</option>
      <option value="predefined">Predefined Only</option>
      <option value="custom">Custom Only</option>
    </select>
    
    <div class="longitude-range">
      <label>Longitude Range:</label>
      <div class="range-inputs">
        <input type="number" id="min-longitude" placeholder="Min (-180)" min="-180" max="180" step="1">
        <span>to</span>
        <input type="number" id="max-longitude" placeholder="Max (180)" min="-180" max="180" step="1">
      </div>
    </div>
    
    <label for="visibility-filter">Visibility:</label>
    <select id="visibility-filter">
      <option value="all">All Satellites</option>
      <option value="visible">Only Visible</option>
      <option value="not-visible">Only Not Visible</option>
    </select>
    
    <button id="apply-advanced-filters">
      <span class="material-icons-round">filter_alt</span> Apply Filters
    </button>
    
    <button id="clear-advanced-filters" class="secondary-btn">
      <span class="material-icons-round">clear</span> Clear Filters
    </button>
  `;
  
  // Add to filter drawer
  filterDrawer.appendChild(advancedSection);
  
  // Set up event listeners
  const minElevationSlider = document.getElementById('min-elevation');
  const minElevationValue = document.getElementById('min-elevation-value');
  
  if (minElevationSlider && minElevationValue) {
    minElevationSlider.addEventListener('input', () => {
      minElevationValue.textContent = `${minElevationSlider.value}°`;
    });
  }
  
  // Apply button
  document.getElementById('apply-advanced-filters')?.addEventListener('click', applyAdvancedFilters);
  
  // Clear button
  document.getElementById('clear-advanced-filters')?.addEventListener('click', clearAdvancedFilters);
}

/**
 * Apply advanced satellite filters
 */
function applyAdvancedFilters() {
  const minElevation = parseFloat(document.getElementById('min-elevation')?.value || "-10");
  const satelliteType = document.getElementById('satellite-type')?.value || "all";
  const minLongitude = document.getElementById('min-longitude')?.value ? 
    parseFloat(document.getElementById('min-longitude').value) : -180;
  const maxLongitude = document.getElementById('max-longitude')?.value ? 
    parseFloat(document.getElementById('max-longitude').value) : 180;
  const visibility = document.getElementById('visibility-filter')?.value || "all";
  
  // Get all satellite checkboxes
  const satelliteCheckboxes = document.querySelectorAll("input[type=checkbox][data-satlon]");
  
  // Get location coordinates
  let lat = null, lon = null;
  const firstCheckbox = document.querySelector("input[type=checkbox][data-lat]");
  if (firstCheckbox) {
    lat = parseFloat(firstCheckbox.dataset.lat);
    lon = parseFloat(firstCheckbox.dataset.lon);
  }
  
  // If no location is selected, show notification and return
  if (lat === null || lon === null) {
    showNotification("Please select a location before applying filters.", "error");
    return;
  }
  
  // Count how many are filtered
  let filteredCount = 0;
  let totalCount = 0;
  
  // Apply filters to each satellite row
  satelliteCheckboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    if (!row) return;
    
    totalCount++;
    
    // Get satellite data
    const satLon = parseFloat(checkbox.dataset.satlon);
    const name = checkbox.dataset.name;
    const elevation = calculateElevation(lat, lon, satLon);
    const isVisible = elevation >= 0;
    const isCustom = name.startsWith('Custom') || row.querySelector('.delete-sat') !== null;
    
    // Apply filters
    let show = true;
    
    // Elevation filter
    if (elevation < minElevation) {
      show = false;
    }
    
    // Satellite type filter
    if (satelliteType === 'predefined' && isCustom) {
      show = false;
    } else if (satelliteType === 'custom' && !isCustom) {
      show = false;
    }
    
    // Longitude range filter
    if (satLon < minLongitude || satLon > maxLongitude) {
      show = false;
    }
    
    // Visibility filter
    if (visibility === 'visible' && !isVisible) {
      show = false;
    } else if (visibility === 'not-visible' && isVisible) {
      show = false;
    }
    
    // Show/hide row
    row.style.display = show ? '' : 'none';
    
    if (show) filteredCount++;
  });
  
  // Close drawer
  document.getElementById('filter-drawer')?.classList.remove('visible');
  document.getElementById('drawer-overlay')?.classList.remove('visible');
  
  // Update filter summary badge
  const filterSummary = document.getElementById('filter-summary');
  if (filterSummary) {
    filterSummary.textContent = totalCount - filteredCount;
    filterSummary.classList.toggle('hidden', totalCount - filteredCount === 0);
  }
  
  // Show notification
  showNotification(`Showing ${filteredCount} of ${totalCount} satellites`, "info");
  
  // Make screen reader announcement
  makeAnnouncement(`Advanced filters applied. Showing ${filteredCount} of ${totalCount} satellites.`, 'polite');
}

/**
 * Clear advanced satellite filters
 */
function clearAdvancedFilters() {
  // Reset filter inputs
  if (document.getElementById('min-elevation')) {
    document.getElementById('min-elevation').value = -10;
    document.getElementById('min-elevation-value').textContent = '-10°';
  }
  
  if (document.getElementById('satellite-type')) {
    document.getElementById('satellite-type').value = 'all';
  }
  
  if (document.getElementById('min-longitude')) {
    document.getElementById('min-longitude').value = '';
  }
  
  if (document.getElementById('max-longitude')) {
    document.getElementById('max-longitude').value = '';
  }
  
  if (document.getElementById('visibility-filter')) {
    document.getElementById('visibility-filter').value = 'all';
  }
  
  // Show all satellite rows
  document.querySelectorAll("#apa-table tbody tr").forEach(row => {
    row.style.display = '';
  });
  
  // Clear filter summary badge
  const filterSummary = document.getElementById('filter-summary');
  if (filterSummary) {
    filterSummary.classList.add('hidden');
  }
  
  // Show notification
  showNotification("Advanced filters cleared", "info");
}
