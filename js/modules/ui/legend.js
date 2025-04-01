// legend.js - Legend and help UI
import { eventBus } from '../core/events.js';

/**
 * Initialize legend and help components
 */
export function initLegend() {
  const legendToggleBtn = document.getElementById("legend-toggle");
  const apaLegend = document.getElementById("apa-legend");
  const helpTooltip = document.getElementById("help-tooltip");
  const hideHelpBtn = document.getElementById("hide-help-tooltip");
  const showTutorialBtn = document.getElementById("show-tutorial");
  const restartTutorialBtn = document.getElementById("restart-tutorial");
  
  // Check if help tooltip should be shown
  if (localStorage.getItem("helpDismissed") === "true" && helpTooltip) {
    helpTooltip.classList.add("hidden");
  }
  
  // Set up legend toggle
  if (legendToggleBtn && apaLegend) {
    legendToggleBtn.addEventListener("click", toggleLegend);
  }
  
  // Set up help tooltip dismiss
  if (hideHelpBtn) {
    hideHelpBtn.addEventListener("click", () => {
      if (helpTooltip) {
        helpTooltip.classList.add("hidden");
        localStorage.setItem("helpDismissed", "true");
      }
    });
  }
  
  // Set up tutorial button in help tooltip
  if (showTutorialBtn) {
    showTutorialBtn.addEventListener("click", () => {
      // Import and call showTutorial from tutorial.js
      import('./tutorial.js').then(module => {
        module.showTutorial();
        // Hide the help tooltip
        if (helpTooltip) {
          helpTooltip.classList.add("hidden");
          localStorage.setItem("helpDismissed", "true");
        }
      });
    });
  }
  
  // Set up restart tutorial button in legend
  if (restartTutorialBtn) {
    restartTutorialBtn.addEventListener("click", () => {
      // Import and call showTutorial from tutorial.js
      import('./tutorial.js').then(module => {
        module.restartTutorial();
        // Hide the legend
        if (apaLegend) {
          apaLegend.classList.add("hidden");
        }
      });
    });
  }
}

/**
 * Toggle the legend visibility
 */
export function toggleLegend() {
  const apaLegend = document.getElementById("apa-legend");
  if (!apaLegend) return;
  
  apaLegend.classList.toggle("hidden");
  
  // Publish event
  const isVisible = !apaLegend.classList.contains("hidden");
  eventBus.publish('legendVisibilityChanged', isVisible);
}

/**
 * Show the help tooltip
 */
export function showHelpTooltip() {
  const helpTooltip = document.getElementById("help-tooltip");
  if (helpTooltip) {
    helpTooltip.classList.remove("hidden");
  }
}

/**
 * Hide the help tooltip
 * @param {boolean} [persist=true] - Whether to persist the setting
 */
export function hideHelpTooltip(persist = true) {
  const helpTooltip = document.getElementById("help-tooltip");
  if (helpTooltip) {
    helpTooltip.classList.add("hidden");
    if (persist) {
      localStorage.setItem("helpDismissed", "true");
    }
  }
}

/**
 * Check if the help tooltip is visible
 * @returns {boolean} True if the help tooltip is visible
 */
export function isHelpTooltipVisible() {
  const helpTooltip = document.getElementById("help-tooltip");
  return helpTooltip && !helpTooltip.classList.contains("hidden");
}

/**
 * Check if the legend is visible
 * @returns {boolean} True if the legend is visible
 */
export function isLegendVisible() {
  const apaLegend = document.getElementById("apa-legend");
  return apaLegend && !apaLegend.classList.contains("hidden");
}
