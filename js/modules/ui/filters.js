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
  // Initialize location filters
  populateLocationFilters();
  setupLocationFilterHandlers();
  
  // Initialize satellite filters
  setupSatelliteFilterHandlers();
}

/**
 * Set up location filter event handlers
 */
export function setupSatelliteFilterHandlers() {
  const minElevationSlider = document.getElementById('min-elevation');
  const minElevationValue = document.getElementById('min-elevation-value');
  const applySatelliteFiltersBtn = document.getElementById('apply-satellite-filters');
  const clearSatelliteFiltersBtn = document.getElementById('clear-satellite-filters');
  
  if (!minElevationSlider || !minElevationValue || !applySatelliteFiltersBtn || !clearSatelliteFiltersBtn) return;
  
  // Elevation slider update
  minElevationSlider.addEventListener('input', () => {
    minElevationValue.textContent = `${minElevationSlider.value}°`;
  });
  
  // Apply satellite filters
  applySatelliteFiltersBtn.addEventListener('click', applySatelliteFilters);
  
  // Clear satellite filters
  clearSatelliteFiltersBtn.addEventListener('click', clearSatelliteFilters);
}

/**
 * Populate location filter dropdowns with initial options
 */
export function populateLocationFilters() {
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
 * Update the location filter summary badge
 */
export function updateLocationFilterSummary() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const filterSummary = document.getElementById("location-filter-summary");
  
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
 * Apply satellite filters
 */
export function applySatelliteFilters() {
  const minElevation = parseFloat(document.getElementById('min-elevation')?.value || "-30");
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
  document.getElementById('satellite-filter-drawer')?.classList.remove('visible');
  document.getElementById('drawer-overlay')?.classList.remove('visible');
  
  // Update filter summary badge
  updateSatelliteFilterSummary(totalCount - filteredCount);
  
  // Show notification
  showNotification(`Showing ${filteredCount} of ${totalCount} satellites`, "info");
  
  // Make screen reader announcement
  makeAnnouncement(`Satellite filters applied. Showing ${filteredCount} of ${totalCount} satellites.`, 'polite');
}

/**
 * Clear satellite filters
 */
export function clearSatelliteFilters() {
  // Reset filter inputs
  if (document.getElementById('min-elevation')) {
    document.getElementById('min-elevation').value = -30;
    document.getElementById('min-elevation-value').textContent = '-30°';
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
  updateSatelliteFilterSummary(0);
  
  // Show notification
  showNotification("Satellite filters cleared", "info");
}

/**
 * Update the satellite filter summary badge
 * @param {number} count - Number of filtered satellites
 */
export function updateSatelliteFilterSummary(count) {
  const filterSummary = document.getElementById("satellite-filter-summary");
  if (!filterSummary) return;
  
  if (count > 0) {
    filterSummary.textContent = count;
    filterSummary.classList.remove("hidden");
  } else {
    filterSummary.classList.add("hidden");
  }
}

/**
 * Initialize advanced satellite filters
 * @deprecated Use setupSatelliteFilterHandlers instead
 */
export function initAdvancedFilters() {
  console.warn('initAdvancedFilters is deprecated, use setupSatelliteFilterHandlers instead');
  setupSatelliteFilterHandlers();
}LocationFilterHandlers() {
  const aorFilter = document.getElementById("aor-filter");
  const countryFilter = document.getElementById("country-filter");
  const locationSelect = document.getElementById("location-select");
  const applyFiltersBtn = document.getElementById("apply-location-filters");
  const resetFiltersBtn = document.getElementById("reset-location-filters");
  const filterSummary = document.getElementById("location-filter-summary");
  
  if (!aorFilter || !countryFilter || !locationSelect || !resetFiltersBtn || !filterSummary) return;
  
  // AOR filter change event
  aorFilter.addEventListener("change", () => {
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

  // Apply location filters button
  applyFiltersBtn.addEventListener("click", () => {
    // Apply filters
    filterLocations();
    updateLocationFilterSummary();
    
    // Close drawer
    document.getElementById('location-filter-drawer').classList.remove('visible');
    document.getElementById('drawer-overlay').classList.remove('visible');
    
    // Show notification
    const selectedAOR = aorFilter.value || 'all AORs';
    const selectedCountry = countryFilter.value || 'all countries';
    showNotification(`Location filters applied. Showing locations in ${selectedAOR}, ${selectedCountry}.`, "info");
    
    // Make screen reader announcement
    makeAnnouncement(`Location filters applied. Showing locations in ${selectedAOR}, ${selectedCountry}.`, 'polite');
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
    updateLocationFilterSummary();
    
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
    populateLocationFilters();
    filterLocations();
    updateLocationFilterSummary();
    
    // Show notification
    showNotification("Location filters have been reset.", "info");
    
    // Publish event
    eventBus.publish('locationFiltersReset');
  });
}

/**
 * Set up satellite filter event handlers
 */
export function setup
