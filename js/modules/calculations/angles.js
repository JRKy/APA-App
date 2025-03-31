// angles.js - Antenna angle calculation functions

/**
 * Calculate elevation angle to a geostationary satellite
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Elevation angle in degrees
 */
export function calculateElevation(lat, lon, satLon) {
  // Simple elevation calculation (simplified approximation)
  return (90 - Math.abs(lat) - Math.abs(satLon - lon));
}

/**
 * Calculate azimuth angle to a geostationary satellite
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Azimuth angle in degrees
 */
export function calculateAzimuth(lat, lon, satLon) {
  // Normalize the angle to -180 to 180 range
  return ((satLon - lon + 540) % 360 - 180);
}

/**
 * Calculate satellite visibility
 * @param {number} elevation - Elevation angle in degrees
 * @returns {boolean} True if satellite is visible
 */
export function isSatelliteVisible(elevation) {
  return elevation >= 0;
}

/**
 * Calculate look angles for polar plot
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {Array} satellites - Array of satellite objects
 * @returns {Array} Array of satellite objects with polar coordinates
 */
export function calculatePolarCoordinates(lat, lon, satellites) {
  return satellites.map(sat => {
    // Calculate azimuth and elevation
    const az = calculateAzimuth(lat, lon, sat.longitude) * Math.PI / 180;
    const el = calculateElevation(lat, lon, sat.longitude);
    
    // Convert to polar coordinates (0 elevation at edge, 90 at center)
    // Radius is proportional to 90-elevation (0 at center, max at edge)
    const radius = (90 - Math.max(el, 0)) / 90;
    
    // Calculate x,y position (for SVG plotting)
    // x increases to the right (azimuth 90°), y increases downward (azimuth 180°)
    const x = radius * Math.sin(az);
    const y = -radius * Math.cos(az);  // Negative because SVG y-axis is flipped
    
    return {
      ...sat,
      elevation: el,
      azimuth: az * 180 / Math.PI,
      isVisible: el >= 0,
      polarX: x,
      polarY: y,
      polarRadius: radius
    };
  });
}

/**
 * Calculate coverage radius based on elevation
 * @param {number} elevation - Elevation angle in degrees
 * @returns {number} Coverage radius in kilometers
 */
export function calculateCoverageRadius(elevation) {
  if (elevation < 0) return 0;
  
  // Simplified calculation - elevation to coverage mapping
  // Higher elevation = greater coverage radius, up to a maximum
  return Math.min(Math.max(elevation * 20, 200), 1000);
}

/**
 * More precise elevation calculation for geostationary satellites
 * This uses a more accurate model accounting for Earth's curvature
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Elevation angle in degrees
 */
export function calculatePreciseElevation(lat, lon, satLon) {
  // Convert to radians
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const satLonRad = satLon * Math.PI / 180;
  
  // Earth radius in km
  const R = 6378.137;
  
  // Geostationary orbit altitude (km)
  const h = 35786;
  
  // Calculate parameters
  const longDiff = lonRad - satLonRad;
  const rho = Math.sqrt(1 - 2 * Math.cos(latRad) * Math.cos(longDiff) + Math.pow(Math.cos(latRad), 2));
  
  // Calculate elevation
  const elevRad = Math.atan((Math.cos(latRad) * Math.cos(longDiff) - 1) / rho);
  
  // Convert back to degrees
  return elevRad * 180 / Math.PI;
}

/**
 * More precise azimuth calculation for geostationary satellites
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Azimuth angle in degrees
 */
export function calculatePreciseAzimuth(lat, lon, satLon) {
  // Convert to radians
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const satLonRad = satLon * Math.PI / 180;
  
  // Calculate longitude difference
  const longDiff = lonRad - satLonRad;
  
  // Calculate azimuth
  let azRad = Math.atan(Math.tan(longDiff) / Math.sin(latRad));
  
  // Handle southern hemisphere
  if (lat < 0) {
    if (lon > satLon) {
      azRad = azRad + Math.PI;
    } else {
      azRad = azRad - Math.PI;
    }
  }
  
  // Normalize to 0-360
  let azDeg = azRad * 180 / Math.PI;
  if (azDeg < 0) azDeg += 360;
  
  return azDeg;
}