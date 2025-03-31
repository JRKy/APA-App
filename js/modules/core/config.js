// config.js - App configuration constants
export const APP_VERSION = '2.1.0';

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
    content: "This tutorial will guide you through the basic features of the Antenna Pointing Angles App.",
    highlight: null
  },
  {
    title: "Select a Location",
    content: "Use the location buttons in the top left to select a predefined location or enter custom coordinates.",
    highlight: "toggle-filter-drawer"
  },
  {
    title: "View Satellite Data",
    content: "The APA table shows all satellites and their pointing angles from your current location.",
    highlight: "apa-panel"
  },
  {
    title: "Toggle Satellite Lines",
    content: "Switch satellites on/off using the toggles in the first column. Blue lines indicate satellites above the horizon.",
    highlight: "apa-table"
  },
  {
    title: "You're Ready!",
    content: "You now know the basics of the APA App. Explore additional features like the polar plot, custom satellites, and dark mode.",
    highlight: null
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
