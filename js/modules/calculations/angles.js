// angles.js - Antenna angle calculation functions

/**
 * Calculate elevation angle to a geostationary satellite using proper spherical geometry
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Elevation angle in degrees
 */
export function calculateElevation(lat, lon, satLon) {
  // Convert to radians
  const latRad = lat * Math.PI / 180;
  
  // Handle the 180/-180 boundary
  let lonDiff = satLon - lon;
  if (lonDiff > 180) {
    lonDiff -= 360;
  } else if (lonDiff < -180) {
    lonDiff += 360;
  }
  
  const lonDiffRad = lonDiff * Math.PI / 180;
  
  // Earth radius in km
  const R = 6378.137;
  
  // Geostationary orbit altitude (km)
  const h = 35786;
  
  // Calculate the geocentric angle between observer and satellite nadir point
  const geocentricAngle = Math.acos(
    Math.cos(latRad) * Math.cos(lonDiffRad)
  );
  
  // Calculate the distance from observer to satellite
  const d = Math.sqrt(
    Math.pow(R, 2) + Math.pow(R + h, 2) - 
    2 * R * (R + h) * Math.cos(geocentricAngle)
  );
  
  // Calculate elevation angle
  const elevRad = Math.asin(
    ((R + h) * Math.cos(geocentricAngle) - R) / d
  );
  
  // Convert to degrees
  return elevRad * 180 / Math.PI;
}

/**
 * Calculate azimuth angle to a geostationary satellite using proper spherical geometry
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Azimuth angle in degrees (0-360, where 0 is North)
 */
export function calculateAzimuth(lat, lon, satLon) {
  // Convert to radians
  const latRad = lat * Math.PI / 180;
  
  // Handle the 180/-180 boundary
  let lonDiff = satLon - lon;
  if (lonDiff > 180) {
    lonDiff -= 360;
  } else if (lonDiff < -180) {
    lonDiff += 360;
  }
  
  const lonDiffRad = lonDiff * Math.PI / 180;
  
  // Calculate azimuth angle
  let azRad;
  
  // Special case for observers at poles
  if (Math.abs(lat) > 89.99) {
    // At poles, all directions are either North or South
    azRad = (lat > 0) ? Math.PI : 0; // North pole: South, South pole: North
  } else {
    // Standard case
    azRad = Math.atan2(
      Math.sin(lonDiffRad),
      Math.tan(0) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(lonDiffRad)
    );
  }
  
  // Convert to degrees and normalize to 0-360 range
  let azDeg = azRad * 180 / Math.PI;
  
  // Normalize to 0-360 range (0 = North, 90 = East, 180 = South, 270 = West)
  if (azDeg < 0) {
    azDeg += 360;
  }
  
  return azDeg;
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
    const azDeg = calculateAzimuth(lat, lon, sat.longitude);
    const az = azDeg * Math.PI / 180;
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
      azimuth: azDeg,
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
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Elevation angle in degrees
 */
export function calculatePreciseElevation(lat, lon, satLon) {
  // This function now uses the same improved calculation as calculateElevation
  return calculateElevation(lat, lon, satLon);
}

/**
 * More precise azimuth calculation for geostationary satellites
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} satLon - Satellite longitude in degrees
 * @returns {number} Azimuth angle in degrees
 */
export function calculatePreciseAzimuth(lat, lon, satLon) {
  // This function now uses the same improved calculation as calculateAzimuth
  return calculateAzimuth(lat, lon, satLon);
}
