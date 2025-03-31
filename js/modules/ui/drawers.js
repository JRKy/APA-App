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
          drawer.classList.remove('visible');
          drawer.style.display = 'none'; // Explicitly hide with inline style
          document.getElementById('drawer-overlay').classList.remove('visible');
          document.getElementById('drawer-overlay').style.display = 'none'; // Explicitly hide overlay
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
    showDrawer("location-drawer");
  });
  
  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", function() {
    console.log("Satellite drawer toggle clicked (from event listener)");
    showDrawer("satellite-drawer");
  });
  
  document.getElementById("toggle-location-filter-drawer")?.addEventListener("click", function() {
    console.log("Location filter drawer toggle clicked (from event listener)");
    showDrawer("location-filter-drawer");
  });
  
  document.getElementById("toggle-satellite-filter-drawer")?.addEventListener("click", function() {
    console.log("Satellite filter drawer toggle clicked (from event listener)");
    showDrawer("satellite-filter-drawer");
  });
}

/**
 * Show a drawer directly (simpler implementation)
 * @param {string} drawerId - ID of the drawer to show
 */
function showDrawer(drawerId) {
  console.log(`Attempting to show drawer: ${drawerId}`);
  
  // Close all drawers first
  document.querySelectorAll('.drawer').forEach(drawer => {
    drawer.classList.remove('visible');
    drawer.style.display = 'none'; // Explicitly hide with inline style
  });
  
  // Show the requested drawer
  const drawer = document.getElementById(drawerId);
  if (drawer) {
    drawer.classList.add('visible');
    drawer.style.display = 'block'; // Explicitly show with inline style
    document.getElementById('drawer-overlay').classList.add('visible');
    document.getElementById('drawer-overlay').style.display = 'block'; // Explicitly show overlay
    console.log(`Drawer ${drawerId} should now be visible`);
    
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
 * Toggle a drawer's visibility
 * @param {string} drawerId - ID of the drawer to toggle
 * @param {Array} others - IDs of other drawers to close
 */
export function toggleDrawer(drawerId, others = []) {
  console.log(`Attempting to toggle drawer: ${drawerId}`);
  
  const drawer = document.getElementById(drawerId);
  if (!drawer) {
    console.error(`Drawer not found: ${drawerId}`);
    return;
  }
  
  const isOpen = drawer.classList.contains("visible");
  console.log(`Drawer ${drawerId} is currently ${isOpen ? 'open' : 'closed'}`);
  
  // Close all drawers first
  closeAllDrawers();
  
  // Then open the requested drawer if it wasn't already open
  if (!isOpen) {
    console.log(`Opening drawer: ${drawerId}`);
    drawer.classList.add("visible");
    drawer.style.display = 'block'; // Explicitly show with inline style
    document.getElementById('drawer-overlay').classList.add("visible");
    document.getElementById('drawer-overlay').style.display = 'block'; // Explicitly show overlay
    
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
    openDrawer.style.display = 'none'; // Explicitly hide with inline style
  });
  document.getElementById('drawer-overlay').classList.remove("visible");
  document.getElementById('drawer-overlay').style.display = 'none'; // Explicitly hide overlay
  
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
