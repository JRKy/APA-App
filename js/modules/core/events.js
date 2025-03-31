// events.js - Custom event system and app-wide event handlers
import { updateMapAppearance } from '../ui/map.js';
import { toggleDrawer, closeAllDrawers } from '../ui/drawers.js';
import { togglePolarPlotVisibility } from '../ui/polarPlot.js';
import { showTutorial } from '../ui/tutorial.js';
import { toggleLegend } from '../ui/legend.js';

/**
 * App-wide event bus for communication between modules
 */
export const eventBus = {
  events: {},
  
  /**
   * Subscribe to an event
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Function to call when event occurs
   */
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },
  
  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name to unsubscribe from
   * @param {Function} callback - Function to remove
   */
  unsubscribe(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        func => func !== callback
      );
    }
  },
  
  /**
   * Publish an event with data
   * @param {string} eventName - Event name to publish
   * @param {*} data - Data to pass to subscribers
   */
  publish(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(data);
      });
    }
  }
};

/**
 * Initialize global event listeners
 */
export function initEventListeners() {
  // Dark mode toggle
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", handleDarkModeToggle);
  }
  
  // Toggle drawers
  document.getElementById("toggle-location-drawer")?.addEventListener("click", () => {
    toggleDrawer("location-drawer", ["satellite-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-satellite-drawer")?.addEventListener("click", () => {
    toggleDrawer("satellite-drawer", ["location-drawer", "filter-drawer"]);
  });

  document.getElementById("toggle-filter-drawer")?.addEventListener("click", () => {
    toggleDrawer("filter-drawer", ["location-drawer", "satellite-drawer"]);
  });
  
  // Drawer overlay close
  document.getElementById("drawer-overlay")?.addEventListener("click", closeAllDrawers);
  
  // Close on ESC key
  document.addEventListener('keydown', handleKeyDown);
  
  // Polar plot toggle
  document.getElementById("toggle-polar-plot")?.addEventListener("click", () => {
    togglePolarPlotVisibility();
  });
  
  // Legend toggle
  document.getElementById("legend-toggle")?.addEventListener("click", toggleLegend);
  
  // Help and tutorial
  document.getElementById("hide-help-tooltip")?.addEventListener("click", hideHelpTooltip);
  document.getElementById("show-tutorial")?.addEventListener("click", handleShowTutorial);
}

/**
 * Handle dark mode toggle
 */
function handleDarkModeToggle() {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  
  // Update button appearance
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  darkModeToggle.title = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
  darkModeToggle.querySelector(".material-icons-round").textContent = isDarkMode ? "light_mode" : "dark_mode";
  
  // Save preference and update map
  localStorage.setItem("darkMode", isDarkMode);
  updateMapAppearance(isDarkMode);
  
  // Notify other components via event bus
  eventBus.publish('darkModeChanged', isDarkMode);
}

/**
 * Handle global keydown events
 * @param {KeyboardEvent} e - The keydown event
 */
function handleKeyDown(e) {
  // Close drawers on Escape key
  if (e.key === 'Escape') {
    closeAllDrawers();
    
    // Also close tutorial if open
    const tutorialOverlay = document.getElementById("tutorial-overlay");
    if (tutorialOverlay && !tutorialOverlay.classList.contains('hidden')) {
      tutorialOverlay.classList.add('hidden');
    }
  }
}

/**
 * Hide the help tooltip and save preference
 */
function hideHelpTooltip() {
  const helpTooltip = document.getElementById("help-tooltip");
  if (helpTooltip) {
    helpTooltip.classList.add("hidden");
    localStorage.setItem("helpDismissed", "true");
  }
}

/**
 * Handle showing tutorial and hide help tooltip
 */
function handleShowTutorial() {
  const helpTooltip = document.getElementById("help-tooltip");
  if (helpTooltip) {
    helpTooltip.classList.add("hidden");
    localStorage.setItem("helpDismissed", "true");
  }
  showTutorial();
}