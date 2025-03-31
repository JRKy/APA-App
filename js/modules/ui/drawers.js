// drawers.js - Drawer UI components
import { showNotification } from '../core/utils.js';
import { goToLocation } from '../data/locations.js';
import { addSatellite } from '../data/satellites.js';
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
  
  // Set up custom satellite form submission
  const addSatelliteBtn = document.getElementById("add-satellite-btn");
  if (addSatelliteBtn) {
    addSatelliteBtn.addEventListener("click", handleAddSatellite);
  }
  
  // Set up drawer toggle buttons
  document.getElementById("toggle-location-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-drawer", ["satellite-drawer", "location-filter-drawer", "satellite-filter-drawer"]);
  });

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-drawer", ["location-drawer", "location-filter-drawer", "satellite-filter-drawer"]);
  });

  document.getElementById("toggle-location-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-filter-drawer", ["location-drawer", "satellite-drawer", "satellite-filter-drawer"]);
  });

  document.getElementById("toggle-satellite-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-filter-drawer", ["location-drawer", "satellite-drawer", "location-filter-drawer"]);
  });
}

/**
 * Toggle a drawer's visibility
 * @param {string} drawerId - ID of the drawer to toggle
 * @param {Array} others - IDs of other drawers to close
 */
export function toggleDrawer(drawerId, others = []) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  
  const isOpen = drawer.classList.contains("visible");
  
  // Close all drawers first
  closeAllDrawers();
  
  // Then open the requested drawer if it wasn't already open
  if (!isOpen) {
    drawer.classList.add("visible");
    document.getElementById('drawer-overlay').classList.add("visible");
    
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
 * Close all open drawers
 */
export function closeAllDrawers() {
  document.querySelectorAll('.drawer.visible').forEach(openDrawer => {
    openDrawer.classList.remove("visible");
  });
  document.getElementById('drawer-overlay').classList.remove("visible");
  
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
