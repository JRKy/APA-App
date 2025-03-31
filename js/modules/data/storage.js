// storage.js - LocalStorage management functions
import { getStoredValue, storeValue } from '../core/utils.js';
import { goToLocation } from './locations.js';

// Storage key constants
const STORAGE_KEYS = {
  LAST_LOCATION: 'lastLocation',
  PANEL_POSITION: 'apaPanelPosition',
  PANEL_MINIMIZED: 'apaPanelMinimized',
  CUSTOM_SATELLITES: 'customSatellites',
  DARK_MODE: 'darkMode',
  HELP_DISMISSED: 'helpDismissed',
  TUTORIAL_COMPLETED: 'tutorialCompleted',
  POLAR_PLOT_VISIBLE: 'polarPlotVisible',
  SORT_STATE: 'sortState'
};

/**
 * Save the current location to localStorage
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} label - Location label
 */
export function saveLastLocation(lat, lon, label) {
  storeValue(STORAGE_KEYS.LAST_LOCATION, { lat, lon, label });
}

/**
 * Load the last location from localStorage
 * @returns {Object|null} The last location or null if not found
 */
export function loadLastLocation() {
  return getStoredValue(STORAGE_KEYS.LAST_LOCATION, null);
}

/**
 * Restore the last location from localStorage and navigate to it
 */
export function restoreLastLocation() {
  const savedLocation = loadLastLocation();
  if (savedLocation) {
    try {
      goToLocation(savedLocation.lat, savedLocation.lon, savedLocation.label);
    } catch (e) {
      console.error('Failed to restore last location:', e);
    }
  }
}

/**
 * Save the APA panel position
 * @param {string} top - Top position (CSS value)
 * @param {string} left - Left position (CSS value)
 */
export function savePanelPosition(top, left) {
  storeValue(STORAGE_KEYS.PANEL_POSITION, { top, left });
}

/**
 * Load the saved panel position
 * @returns {Object|null} The panel position or null if not found
 */
export function loadPanelPosition() {
  return getStoredValue(STORAGE_KEYS.PANEL_POSITION, null);
}

/**
 * Save panel minimized state
 * @param {boolean} isMinimized - Whether the panel is minimized
 */
export function savePanelMinimized(isMinimized) {
  storeValue(STORAGE_KEYS.PANEL_MINIMIZED, isMinimized);
}

/**
 * Load panel minimized state
 * @returns {boolean} Whether the panel is minimized
 */
export function loadPanelMinimized() {
  return getStoredValue(STORAGE_KEYS.PANEL_MINIMIZED, false);
}

/**
 * Save table sort state
 * @param {number} column - Column index
 * @param {string} direction - Sort direction (asc, desc, none)
 */
export function saveSortState(column, direction) {
  storeValue(STORAGE_KEYS.SORT_STATE, { column, direction });
}

/**
 * Load table sort state
 * @returns {Object} The sort state
 */
export function loadSortState() {
  return getStoredValue(STORAGE_KEYS.SORT_STATE, { column: null, direction: 'none' });
}

/**
 * Check if the help tooltip has been dismissed
 * @returns {boolean} Whether the help tooltip has been dismissed
 */
export function isHelpDismissed() {
  return getStoredValue(STORAGE_KEYS.HELP_DISMISSED, false);
}

/**
 * Check if the tutorial has been completed
 * @returns {boolean} Whether the tutorial has been completed
 */
export function isTutorialCompleted() {
  return getStoredValue(STORAGE_KEYS.TUTORIAL_COMPLETED, false);
}

/**
 * Save tutorial completed state
 * @param {boolean} completed - Whether the tutorial is completed
 */
export function saveTutorialCompleted(completed) {
  storeValue(STORAGE_KEYS.TUTORIAL_COMPLETED, completed);
}

/**
 * Get stored polar plot visibility
 * @returns {boolean} Whether the polar plot is visible
 */
export function isPolarPlotVisible() {
  return getStoredValue(STORAGE_KEYS.POLAR_PLOT_VISIBLE, false);
}

/**
 * Save polar plot visibility
 * @param {boolean} visible - Whether the polar plot is visible
 */
export function savePolarPlotVisible(visible) {
  storeValue(STORAGE_KEYS.POLAR_PLOT_VISIBLE, visible);
}

/**
 * Get stored dark mode preference
 * @returns {boolean} Whether dark mode is enabled
 */
export function isDarkModeEnabled() {
  return getStoredValue(STORAGE_KEYS.DARK_MODE, false);
}

/**
 * Clear all app data from localStorage
 */
export function clearAllAppData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}