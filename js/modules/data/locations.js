// locations.js - Location data management
import { showNotification, makeAnnouncement } from '../core/utils.js';
import { eventBus } from '../core/events.js';
import { saveLastLocation } from './storage.js';
import { setMapLocation } from '../ui/map.js';
import { updateApaTable } from '../ui/table.js';
import { updatePolarPlot } from '../ui/polarPlot.js';

// Reference to the global LOCATIONS array from data.js
let locations = [];

// Current location state
let currentLocation = null;

/**
 * Initialize locations from the global array
 */
export function initLocations() {
  // Store reference to global locations array
  if (typeof LOCATIONS !== 'undefined') {
    locations = LOCATIONS;
  }
}

/**
 * Get all locations
 * @returns {Array} Array of location objects
 */
export function getLocations() {
  return [...locations];
}

/**
 * Get the current active location
 * @returns {Object|null} Current location or null
 */
export function getCurrentLocation() {
  return currentLocation;
}

/**
 * Navigate to a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} label - Location label
 */
export function goToLocation(lat, lon, label = "") {
  // Update current location
  currentLocation = { lat, lon, label };
  
  // Set map view and marker
  const marker = setMapLocation(lat, lon);
  if (marker) {
    marker.bindPopup(`<strong>${label || 'Selected Location'}</strong><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`);
  }
  
  // Show APA panel
  const apaPanel = document.getElementById("apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  
  if (apaPanel) apaPanel.style.display = "block";
  if (toggleApaBtn) toggleApaBtn.style.display = "none";
  
  // Update data visualizations
  updateApaTable(lat, lon);
  updatePolarPlot(lat, lon);
  
  // Show location indicator
  updateLocationIndicator(lat, lon, label);
  
  // Save to localStorage
  saveLastLocation(lat, lon, label);
  
  // Notify other components
  eventBus.publish('locationChanged', { lat, lon, label });
}

/**
 * Update the location indicator display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} label - Location label
 */
function updateLocationIndicator(lat, lon, label) {
  const indicator = document.getElementById("current-location-indicator");
  if (indicator) {
    indicator.innerHTML = `
      <span class="material-icons-round">location_on</span>
      ${label || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}
    `;
    indicator.classList.remove("hidden");
  }
}

/**
 * Use the device's geolocation
 */
export function useMyLocation() {
  const locateBtn = document.getElementById("btn-my-location");
  
  if (!navigator.geolocation) {
    showNotification("Geolocation is not supported by your browser.", "error");
    return;
  }

  // Show loading spinner
  if (locateBtn) {
    locateBtn.innerHTML = '<span class="material-icons-round loading">sync</span>';
    locateBtn.disabled = true;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      goToLocation(lat, lon, "GPS Location");
      
      // Reset button
      if (locateBtn) {
        locateBtn.innerHTML = '<span class="material-icons-round">my_location</span>';
        locateBtn.disabled = false;
      }
    },
    (error) => {
      // Handle geolocation errors
      let errorMessage;
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access was denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "The request to get location timed out.";
          break;
        default:
          errorMessage = "An unknown error occurred while getting location.";
      }
      
      showNotification(errorMessage, "error");
      
      // Reset button
      if (locateBtn) {
        locateBtn.innerHTML = '<span class="material-icons-round">my_location</span>';
        locateBtn.disabled = false;
      }
      
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Get unique AORs from all locations
 * @returns {Array} Array of unique AOR strings
 */
export function getUniqueAORs() {
  return [...new Set(locations.map(loc => loc.aor))].sort();
}

/**
 * Get unique countries from all locations
 * @returns {Array} Array of unique country strings
 */
export function getUniqueCountries() {
  return [...new Set(locations.map(loc => loc.country))].sort();
}

/**
 * Filter locations by AOR and/or country
 * @param {string} aor - AOR to filter by (empty for all)
 * @param {string} country - Country to filter by (empty for all)
 * @returns {Array} Filtered locations array
 */
export function filterLocationsByAorAndCountry(aor, country) {
  return locations.filter(loc => {
    const matchAOR = !aor || loc.aor === aor;
    const matchCountry = !country || loc.country === country;
    return matchAOR && matchCountry;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get countries filtered by AOR
 * @param {string} aor - AOR to filter by
 * @returns {Array} Countries in the specified AOR
 */
export function getCountriesInAOR(aor) {
  if (!aor) return getUniqueCountries();
  
  const countriesInAOR = locations
    .filter(loc => loc.aor === aor)
    .map(loc => loc.country);
  
  return [...new Set(countriesInAOR)].sort();
}

/**
 * Get AORs filtered by country
 * @param {string} country - Country to filter by
 * @returns {Array} AORs in the specified country
 */
export function getAORsInCountry(country) {
  if (!country) return getUniqueAORs();
  
  const aorsInCountry = locations
    .filter(loc => loc.country === country)
    .map(loc => loc.aor);
  
  return [...new Set(aorsInCountry)].sort();
}

// Initialize locations on module load
initLocations();
