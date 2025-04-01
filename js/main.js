// main.js - Application entry point
import { VERSION } from './modules/core/version.js';
import { checkVersion, initVersionDisplay, showWhatsNew } from './modules/core/versionManager.js';
import { showNotification } from './modules/core/utils.js';
import { initEventListeners } from './modules/core/events.js';
import { initMap, updateMapAppearance, getMap } from './modules/ui/map.js';
import { initPanels } from './modules/ui/panels.js';
import { initDrawers } from './modules/ui/drawers.js';
import { initTable } from './modules/ui/table.js';
import { initPolarPlot } from './modules/ui/polarPlot.js';
import { initTutorial, showTutorial } from './modules/ui/tutorial.js';
import { initFilters } from './modules/ui/filters.js';
import { initLegend } from './modules/ui/legend.js';
import { loadCustomSatellites } from './modules/data/satellites.js';
import { restoreLastLocation, loadLastLocation } from './modules/data/storage.js';
import { goToLocation } from './modules/data/locations.js';
import { toggleSatelliteFootprints } from './modules/calculations/visibility.js';

document.addEventListener("DOMContentLoaded", () => {
  // Initialize loading screen
  const loadingScreen = document.getElementById("loading-screen");
  const loadingMessage = document.querySelector(".loading-message");
  
  // Function to update loading progress
  function updateLoadingProgress(message, percent) {
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    const loadingBar = document.querySelector(".loading-bar");
    if (loadingBar) {
      loadingBar.style.width = `${percent}%`;
    }
  }
  
  // Check version first
  const versionInfo = checkVersion();
  
  // Initialize version display elements
  initVersionDisplay();
  
  console.log(`APA App ${VERSION} initializing...`);
  
  // Create a promise-based loading sequence
  const loadingTasks = [
    // Task 1: Initialize map
    () => {
      updateLoadingProgress("Initializing map...", 20);
      return new Promise(resolve => {
        setTimeout(() => {
          initMap();
          resolve();
        }, 300);
      });
    },
    
    // Task 2: Initialize UI components
    () => {
      updateLoadingProgress("Setting up interface...", 40);
      return new Promise(resolve => {
        setTimeout(() => {
          initPanels();
          initDrawers();
          initTable();
          initPolarPlot();
          initLegend();
          initTutorial();
          resolve();
        }, 300);
      });
    },
    
    // Task 3: Load data
    () => {
      updateLoadingProgress("Loading satellite data...", 60);
      return new Promise(resolve => {
        setTimeout(() => {
          initFilters();
          loadCustomSatellites();
          resolve();
        }, 300);
      });
    },
    
    // Task 4: Restore settings
    () => {
      updateLoadingProgress("Restoring your settings...", 80);
      return new Promise(resolve => {
        setTimeout(() => {
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
          resolve();
        }, 300);
      });
    },
    
    // Task 5: Final preparations
    () => {
      updateLoadingProgress("Ready to launch...", 100);
      return new Promise(resolve => {
        setTimeout(() => {
          // Set up event listeners
          initEventListeners();
          
          // Show what's new notification if needed
          if (versionInfo.isNewVersion && versionInfo.previous) {
            showWhatsNew(versionInfo);
          }
          
          resolve();
        }, 300);
      });
    }
  ];
  
  // Execute loading sequence
  async function executeLoadingSequence() {
    for (const task of loadingTasks) {
      await task();
    }
    
    // Hide loading screen with fade-out animation
    if (loadingScreen) {
      loadingScreen.classList.add("fade-out");
    }
    
    // Remove loading elements after animation completes
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.remove();
      }
      
      // Repurpose polar plot button to show satellite footprints
      const footprintButton = document.getElementById("toggle-polar-plot");
      if (footprintButton) {
        // Update tooltip and icon
        footprintButton.title = "Toggle Satellite Footprints";
        footprintButton.setAttribute("aria-label", "Toggle satellite coverage footprints");
        footprintButton.querySelector(".material-icons-round").textContent = "language";
        
        // Update event listener
        footprintButton.addEventListener("click", () => {
          const isVisible = toggleSatelliteFootprints();
          
          // Show notification
          if (isVisible) {
            showNotification("Satellite footprints enabled", "info");
          } else {
            showNotification("Satellite footprints disabled", "info");
          }
        });
      }
      
      // Show tutorial if first time or if coming from "restart tutorial"
      setTimeout(() => {
        // Check URL parameters for tutorial restart
        const urlParams = new URLSearchParams(window.location.search);
        const showTutorialParam = urlParams.get('tutorial') === 'true';
        
        if (showTutorialParam || (!localStorage.getItem('tutorialCompleted') && localStorage.getItem('helpDismissed'))) {
          // Clean up URL if needed
          if (showTutorialParam) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Show tutorial with slight delay to ensure UI is ready
          setTimeout(() => {
            import('./modules/ui/tutorial.js').then(module => {
              module.showTutorial();
            });
          }, 1000);
        }
      }, 500);
      
      // Register shortcut key for tutorial (Shift+?)
      document.addEventListener('keydown', (e) => {
        // Shift + ?
        if (e.shiftKey && e.key === '?') {
          import('./modules/ui/tutorial.js').then(module => {
            module.restartTutorial();
          });
        }
      });
      
      // Restore last location or set a world view
      setTimeout(() => {
        const lastLocation = loadLastLocation();
        
        if (!lastLocation) {
          // Set a world view centered on (0, 0) with a lower zoom level
          const map = getMap();
          if (map) {
            map.setView([20, 0], 2); // Centered view of the world
          }
          
          // Show a notification about global view
          showNotification("Explore global satellite positions", "info");
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
        announcement.textContent = `APA App version ${VERSION} is ready. Use the buttons to select a location and view satellite pointing angles.`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
      }, 1000);
    }, 600);
  }
  
  // Start loading sequence
  executeLoadingSequence();
});
