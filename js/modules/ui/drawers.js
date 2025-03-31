// drawers.js - Drawer UI components
import { showNotification } from '../core/utils.js';
import { goToLocation } from '../data/locations.js';
import { addSatellite } from '../data/satellites.js';
import { eventBus } from '../core/events.js';

/**
 * Initialize drawer components
 */
export function initDrawers() {
  console.log("Initializing drawers...");
  
  // Set up close buttons for all drawers
  document.querySelectorAll('.drawer-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const drawerId = this.dataset.drawer;
      if (drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          // Use direct style manipulation to hide
          drawer.style.cssText = 'display: none !important;';
          document.getElementById('drawer-overlay').style.cssText = 'display: none !important;';
        }
      }
    });
  });
  
  // Set up custom location form submission
  const customLocationBtn = document.getElementById("custom-location-btn");
  if (customLocationBtn) {
    customLocationBtn.addEventListener("click", handleCustomLocation);
  }
  
  // Set up custom satellite form submission
  const addSatelliteBtn = document.getElementById("add-satellite-btn");
  if (addSatelliteBtn) {
    addSatelliteBtn.addEventListener("click", handleAddSatellite);
  }
  
  // Set up direct drawer toggle event handlers
  setupDrawerToggles();
}

/**
 * Setup drawer toggle buttons with direct DOM event listeners
 */
function setupDrawerToggles() {
  // Add direct event listeners to drawer toggle buttons
  document.getElementById("toggle-location-drawer")?.addEventListener("click", function() {
    console.log("Location drawer toggle clicked (from event listener)");
    forceShowDrawer("location-drawer");
  });
  
  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", function() {
    console.log("Satellite drawer toggle clicked (from event listener)");
    forceShowDrawer("satellite-drawer");
  });
  
  document.getElementById("toggle-location-filter-drawer")?.addEventListener("click", function() {
    console.log("Location filter drawer toggle clicked (from event listener)");
    forceShowDrawer("location-filter-drawer");
  });
  
  document.getElementById("toggle-satellite-filter-drawer")?.addEventListener("click", function() {
    console.log("Satellite filter drawer toggle clicked (from event listener)");
    forceShowDrawer("satellite-filter-drawer");
  });
}

/**
 * Force show a drawer using direct style manipulation - mimicking the successful test approach
 * @param {string} drawerId - ID of the drawer to show
 */
function forceShowDrawer(drawerId) {
  console.log(`Force showing drawer: ${drawerId}`);
  
  // Hide all drawers first using direct style manipulation
  document.querySelectorAll('.drawer').forEach(drawer => {
    drawer.style.cssText = 'display: none !important;';
  });
  
  // Show this drawer with direct style manipulation
  const drawer = document.getElementById(drawerId);
  if (drawer) {
    drawer.style.cssText = `
      display: block !important;
      position: absolute !important;
      z-index: 1500 !important;
    `;
    document.getElementById('drawer-overlay').style.cssText = 'display: block !important;';
    
    // If this is an input drawer, focus the first input
    const firstInput = drawer.querySelector('input, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Publish event
    eventBus.publish('drawerOpened', { drawerId });
  } else {
    console.error(`Drawer element not found: ${drawerId}`);
  }
}

/**
 * Toggle a drawer's visibility (legacy method, now uses forceShowDrawer)
 * @param {string} drawerId - ID of the drawer to toggle
 * @param {Array} others - IDs of other drawers to close
 */
export function toggleDrawer(drawerId, others = []) {
  console.log(`Attempting to toggle drawer: ${drawerId}`);
  forceShowDrawer(drawerId);
}

/**
 * Close all open drawers
 */
export function closeAllDrawers() {
  document.querySelectorAll('.drawer').forEach(drawer => {
    drawer.style.cssText = 'display: none !important;';
  });
  document.getElementById('drawer-overlay').style.cssText = 'display: none !important;';
  
  // Publish event
  eventBus.publish('drawersAllClosed');
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
