// filters.js - Filter UI functionality
import { 
  getUniqueAORs, 
  getUniqueCountries,
  getCountriesInAOR,
  getAORsInCountry,
  filterLocationsByAorAndCountry,
  goToLocation 
} from '../data/locations.js';
import { showNotification } from '../core/utils.js';
import { eventBus } from '../core/events.js';

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