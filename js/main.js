// main.js - Application entry point
import { APP_VERSION } from './modules/core/config.js';
import { showNotification } from './modules/core/utils.js';
import { initEventListeners } from './modules/core/events.js';
import { initMap, updateMapAppearance } from './modules/ui/map.js';
import { initPanels } from './modules/ui/panels.js';
import { initDrawers } from './modules/ui/drawers.js';
import { initTable } from './modules/ui/table.js';
import { initPolarPlot, togglePolarPlotVisibility } from './modules/ui/polarPlot.js';
import { initTutorial, showTutorial } from './modules/ui/tutorial.js';
import { initFilters, setupFilterHandlers } from './modules/ui/filters.js';
import { initLegend } from './modules/ui/legend.js';
import { loadCustomSatellites } from './modules/data/satellites.js';
import { loadLastLocation, restoreLastLocation } from './modules/data/storage.js';
import { goToLocation } from './modules/data/locations.js';

document.addEventListener("DOMContentLoaded", () => {
  console.log(`APA App ${APP_VERSION} initialized`);
  
  // Initialize map
  initMap();
  
  // Initialize UI components
  initPanels();
  initDrawers();
  initTable();
  initPolarPlot();
  initLegend();
  initTutorial();
  
  // Set up event listeners
  initEventListeners();
  
  // Initialize filters
  initFilters();
  setupFilterHandlers();
  
  // Load saved data
  loadCustomSatellites();
  
  // Check dark mode preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    updateMapAppearance(true);
    
    // Update dark mode toggle button
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
      darkModeToggle.title = "Switch to Light Mode";
      darkModeToggle.querySelector(".material-icons-round").textContent = "light_mode";
    }
  }
  
  // Show polar plot if it was visible before
  if (localStorage.getItem("polarPlotVisible") === "true") {
    togglePolarPlotVisibility(true);
  }
  
  // Restore last location if available
  setTimeout(() => {
    const lastLocation = loadLastLocation();
    
    if (!lastLocation) {
      // Show a default location (first in the list)
      if (LOCATIONS && LOCATIONS.length > 0) {
        const defaultLocation = LOCATIONS[0];
        goToLocation(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.name);
      }
    } else {
      restoreLastLocation();
    }
    
    // Show tutorial if first time
    if (!localStorage.getItem('tutorialCompleted') && localStorage.getItem('helpDismissed')) {
      setTimeout(() => showTutorial(), 1000);
    }
  }, 500);
  
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