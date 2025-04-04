// config.js - App configuration constants
export const APP_VERSION = '2.3.1';

// Elevation thresholds for quality classification
export const ELEVATION_THRESHOLDS = {
  EXCELLENT: 30,
  GOOD: 15,
  MARGINAL: 5,
  POOR: 0
};

// Map default settings
export const MAP_DEFAULTS = {
  CENTER: [20, 0],
  ZOOM: 2,
  MIN_ZOOM: 2
};

// Grid line intervals by zoom level
export const GRID_INTERVALS = [
  {start: 2, end: 3, interval: 30},
  {start: 4, end: 4, interval: 10},
  {start: 5, end: 7, interval: 5},
  {start: 8, end: 10, interval: 1}
];

// Line styles
export const LINE_STYLES = {
  ABOVE_HORIZON: {
    color: "#1a73e8",
    weight: 2.5,
    opacity: 0.9,
    dashArray: null,
    className: "apa-line-above"
  },
  BELOW_HORIZON: {
    color: "#ea4335",
    weight: 1.5, 
    opacity: 0.7,
    dashArray: "5,5",
    className: "apa-line-below"
  }
};

// Coverage cone style classes by elevation
export const COVERAGE_STYLES = {
  EXCELLENT: "coverage-cone-excellent",
  GOOD: "coverage-cone-good",
  MARGINAL: "coverage-cone-marginal",
  POOR: "coverage-cone-poor",
  BELOW: "coverage-cone-below"
};

// Tutorial steps
export const TUTORIAL_STEPS = [
  {
    title: "Welcome to APA App",
    content: "This tutorial will guide you through the Antenna Pointing Angles App features. Follow along to learn how to calculate and visualize satellite pointing angles from any location.",
    highlight: null
  },
  {
    title: "Finding a Location",
    content: "Use the location filter button in the top left to select from predefined locations, filtered by AOR or country. For custom locations, you can search by address or landmark using the search box, use the location pin button, or use the 'My Location' button for your device's GPS.",
    highlight: "toggle-location-filter-drawer"
  },
  {
    title: "Searching for Locations",
    content: "You can search for any address, city, landmark, or coordinates using the search field in the top left of the map. Simply type your location and press Enter or click the search button to geocode and navigate to that location.",
    highlight: "location-search"
  },
  {
    title: "Working with Satellites",
    content: "The APA table shows all satellites and their pointing angles from your current location. Toggle satellites on/off using the checkboxes. Blue lines indicate satellites above the horizon, while red dashed lines show those below the horizon.",
    highlight: "apa-table"
  },
  {
    title: "Advanced Filtering",
    content: "Use the satellite filter button to apply advanced filters including minimum elevation, satellite type, and visibility. You can also add custom satellites using the satellite button in the top menu.",
    highlight: "toggle-satellite-filter-drawer"
  },
  {
    title: "Additional Features",
    content: "Toggle the satellite polar plot for a visual representation, export APA data as CSV, and use dark mode for night operations. All data persists between sessions, and the app works offline.",
    highlight: "toggle-polar-plot"
  }
];

/**
 * Get the CSS class for an elevation value
 * @param {number} el - Elevation in degrees
 * @returns {string} CSS class name
 */
export function getElevationClass(el) {
  if (el < 0) return 'elevation-negative';
  if (el >= ELEVATION_THRESHOLDS.EXCELLENT) return 'elevation-excellent';
  if (el >= ELEVATION_THRESHOLDS.GOOD) return 'elevation-good';
  if (el >= ELEVATION_THRESHOLDS.MARGINAL) return 'elevation-marginal';
  return 'elevation-poor';
}

/**
 * Get the text label for an elevation value
 * @param {number} el - Elevation in degrees
 * @returns {string} Human-readable elevation label
 */
export function getElevationLabel(el) {
  if (el < 0) return 'Below Horizon';
  if (el >= ELEVATION_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (el >= ELEVATION_THRESHOLDS.GOOD) return 'Good';
  if (el >= ELEVATION_THRESHOLDS.MARGINAL) return 'Marginal';
  return 'Poor';
}

/**
 * Get the coverage cone style class based on elevation
 * @param {number} el - Elevation in degrees
 * @returns {string} CSS class name
 */
export function getCoverageStyleClass(el) {
  if (el < 0) return COVERAGE_STYLES.BELOW;
  if (el >= ELEVATION_THRESHOLDS.EXCELLENT) return COVERAGE_STYLES.EXCELLENT;
  if (el >= ELEVATION_THRESHOLDS.GOOD) return COVERAGE_STYLES.GOOD;
  if (el >= ELEVATION_THRESHOLDS.MARGINAL) return COVERAGE_STYLES.MARGINAL;
  return COVERAGE_STYLES.POOR;
}
