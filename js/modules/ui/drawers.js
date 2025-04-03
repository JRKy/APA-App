// drawers.js - Drawer UI components
import { showNotification } from '../core/utils.js';
import { goToLocation } from '../data/locations.js';
import { addSatellite } from '../data/satellites.js';
import { searchLocation } from './geocoder.js';
import { eventBus } from '../core/events.js';

/**
 * Initialize drawer components
 */
export function initDrawers() {
  // Set up close buttons for all drawers
  document.querySelectorAll('.drawer-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const drawerId = this.dataset.drawer;
      if (drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          drawer.classList.remove('visible');
          document.getElementById('drawer-overlay').classList.remove('visible');
        }
      }
    });
  });
  
  // Set up custom location form submission
  const customLocationBtn = document.getElementById("custom-location-btn");
  if (customLocationBtn) {
    customLocationBtn.addEventListener("click", handleCustomLocation);
  }
  
  // Set up location search functionality
  const locationSearchBtn = document.getElementById("location-search-btn");
  if (locationSearchBtn) {
    locationSearchBtn.addEventListener("click", handleLocationSearch);
    
    // Also enable search on Enter key
    const locationSearchInput = document.getElementById("location-search");
    if (locationSearchInput) {
      locationSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          handleLocationSearch();
        }
      });
    }
  }
  
  // Set up custom satellite form submission
  const addSatelliteBtn = document.getElementById("add-satellite-btn");
  if (addSatelliteBtn) {
    addSatelliteBtn.addEventListener("click", handleAddSatellite);
  }
  
  // Set up direct drawer toggle event handlers
  setupDrawerToggles();
  
  // Add click handler to the drawer overlay for closing
  const drawerOverlay = document.getElementById('drawer-overlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeAllDrawers);
  }
}

/**
 * Setup drawer toggle buttons with direct DOM event listeners
 */
function setupDrawerToggles() {
  // Add direct event listeners to drawer toggle buttons
  document.getElementById("toggle-location-drawer")?.addEventListener("click", function() {
    showDrawer("location-drawer");
  });
  
  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", function() {
    showDrawer("satellite-drawer");
  });
  
  document.getElementById("toggle-location-filter-drawer")?.addEventListener("click", function() {
    showDrawer("location-filter-drawer");
  });
  
  document.getElementById("toggle-satellite-filter-drawer")?.addEventListener("click", function() {
    showDrawer("satellite-filter-drawer");
  });
}

/**
 * Show a drawer using CSS classes instead of direct style manipulation
 * @param {string} drawerId - ID of the drawer to show
 */
function showDrawer(drawerId) {
  // Hide all drawers first
  document.querySelectorAll('.drawer').forEach(drawer => {
    drawer.classList.remove('visible');
  });
  
  // Show this drawer
  const drawer = document.getElementById(drawerId);
  if (drawer) {
    drawer.classList.add('visible');
    document.getElementById('drawer-overlay').classList.add('visible');
    
    // If this is an input drawer, focus the first input
    const firstInput = drawer.querySelector('input, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Publish event
    eventBus.publish('drawerOpened', { drawerId });
  }
}

/**
 * Toggle a drawer's visibility
 * @param {string} drawerId - ID of the drawer to toggle
 * @param {Array} others - IDs of other drawers to close
 */
export function toggleDrawer(drawerId, others = []) {
  showDrawer(drawerId);
}

/**
 * Close all open drawers
 */
export function closeAllDrawers() {
  document.querySelectorAll('.drawer').forEach(drawer => {
    drawer.classList.remove('visible');
  });
  document.getElementById('drawer-overlay').classList.remove('visible');
  
  // Publish event
  eventBus.publish('drawersAllClosed');
}

/**
 * Handle location search form submission
 */
function handleLocationSearch() {
  const searchInput = document.getElementById("location-search");
  if (!searchInput || !searchInput.value.trim()) {
    showNotification("Please enter a location to search", "error");
    return;
  }
  
  // Show loading state
  const searchBtn = document.getElementById("location-search-btn");
  if (searchBtn) {
    searchBtn.innerHTML = '<span class="material-icons-round loading">sync</span>';
    searchBtn.disabled = true;
  }
  
  searchLocation(searchInput.value.trim())
    .then(results => {
      if (results.length > 0) {
        const result = results[0];
        
        // Populate the lat/long input fields with the search results
        const latInput = document.getElementById("custom-lat");
        const lonInput = document.getElementById("custom-lon");
        
        if (latInput && lonInput) {
          latInput.value = result.lat.toFixed(6);
          lonInput.value = result.lon.toFixed(6);
          
          // Show success notification
          showNotification(`Found location: ${result.name}`, "success");
        }
      } else {
        showNotification("No results found for your search", "error");
      }
    })
    .catch(error => {
      showNotification(error.message, "error");
    })
    .finally(() => {
      // Reset button
      if (searchBtn) {
        searchBtn.innerHTML = '<span class="material-icons-round">search</span> Search';
        searchBtn.disabled = false;
      }
    });
}

/**
 * Handle custom location form submission
 */
function handleCustomLocation() {
  const latInput = document.getElementById("custom-lat");
  const lonInput = document.getElementById("custom-lon");
  
  if (!latInput || !lonInput) return;
  
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  
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
  
  // Navigate to the location
  goToLocation(lat, lon, `Custom (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
  
  // Close all drawers
  closeAllDrawers();
  
  // Publish event
  eventBus.publish('customLocationAdded', { lat, lon });
}

/**
 * Handle add satellite form submission
 */
function handleAddSatellite() {
  const nameInput = document.getElementById("sat-name");
  const lonInput = document.getElementById("sat-lon");
  
  if (!nameInput || !lonInput) return;
  
  const name = nameInput.value.trim();
  const lon = parseFloat(lonInput.value);
  
  // Add the satellite
  const result = addSatellite(name, lon);
  
  // Show notification based on result
  if (result.success) {
    showNotification(result.message, "success");
    
    // Clear input fields
    nameInput.value = "";
    lonInput.value = "";
    
    // Close all drawers
    closeAllDrawers();
    
    // Publish event
    eventBus.publish('customSatelliteAdded', result.satellite);
    
    // Update the APA table if location is set
    const currentLocationIndicator = document.getElementById("current-location-indicator");
    if (currentLocationIndicator && !currentLocationIndicator.classList.contains("hidden")) {
      eventBus.publish('satellitesUpdated');
    }
  } else {
    showNotification(result.message, "error");
  }
}
