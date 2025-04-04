import { getMap } from '../ui/map.js';
import { getCoverageStyleClass, LINE_STYLES } from '../core/config.js';
import { getSatellites } from '../data/satellites.js';
import { calculateElevation, calculateAzimuth, calculateCoverageRadius } from './angles.js';
import { showNotification } from '../core/utils.js';

let lineLayers = [];
let satelliteMarkers = [];
let orbitPaths = [];
let coverageCones = [];
let footprintsVisible = false;
let footprintLayers = []; // array of { id, layer }

/**
 * Normalize longitude to the range [-180, 180]
 */
function normalizeLon(lon) {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

/**
 * Clear all satellite visualization elements from the map
 */
export function clearVisualization() {
  const map = getMap();
  if (!map) return;

  lineLayers.forEach(l => map.removeLayer(l.layer));
  lineLayers = [];

  satelliteMarkers.forEach(m => map.removeLayer(m.marker));
  satelliteMarkers = [];

  orbitPaths.forEach(p => map.removeLayer(p));
  orbitPaths = [];

  coverageCones.forEach(c => map.removeLayer(c.circle));
  coverageCones = [];

  clearFootprints();
}

/**
 * Draw the equator line on the map
 */
export function drawEquator() {
  const map = getMap();
  if (!map) return;

  const points = [];
  for (let lon = -180; lon <= 180; lon += 5) {
    points.push([0, lon]);
  }

  const equatorLine = L.polyline(points, {
    color: '#888',
    weight: 1,
    opacity: 0.5,
    dashArray: '3,5',
    className: 'satellite-orbit'
  }).addTo(map);

  orbitPaths.push(equatorLine);
}

/**
 * Draw a satellite line and optionally its footprint
 */
export function drawLine(lat, lon, satLon, label, el, id) {
  const map = getMap();
  if (!map) return null;

  const isVisible = el >= 0;
  const style = isVisible ? LINE_STYLES.ABOVE_HORIZON : LINE_STYLES.BELOW_HORIZON;

  // Handle the 180/-180 boundary for the satellite longitude
  let displaySatLon = satLon;
  if (Math.abs(lon - satLon) > 180) {
    if (satLon < 0) {
      displaySatLon += 360;
    } else {
      displaySatLon -= 360;
    }
  }

  const polyline = L.polyline([[lat, lon], [0, displaySatLon]], {
    color: style.color,
    weight: style.weight,
    opacity: style.opacity,
    dashArray: style.dashArray,
    className: style.className
  }).addTo(map);

  polyline.bindTooltip(`${label} (${el.toFixed(1)}°)`, {
    permanent: true,
    direction: "center",
    className: "apa-line-label"
  });

  lineLayers.push({ id, layer: polyline });

  drawCoverageCone(lat, lon, satLon, el, id);

  if (footprintsVisible) {
    const sat = getSatellites().find(s => s.longitude === satLon);
    if (sat) drawSatelliteFootprint(sat, id);
  }

  return polyline;
}

/**
 * Draw a coverage cone
 */
export function drawCoverageCone(lat, lon, satLon, el, id) {
  const map = getMap();
  if (!map) return;

  const coverageRadius = calculateCoverageRadius(el);
  const colorClass = getCoverageStyleClass(el);

  const coverageCircle = L.circle([lat, lon], {
    radius: coverageRadius * 1000,
    className: colorClass,
    interactive: false
  }).addTo(map);

  coverageCones.push({ id, circle: coverageCircle });
}

/**
 * Add satellite marker
 */
export function addSatelliteMarker(satellite, isBelow) {
  const map = getMap();
  if (!map) return null;

  const existingIndex = satelliteMarkers.findIndex(m => m.satellite.name === satellite.name);
  if (existingIndex !== -1) {
    map.removeLayer(satelliteMarkers[existingIndex].marker);
    satelliteMarkers.splice(existingIndex, 1);
  }

  const satIcon = L.divIcon({
    className: isBelow ? 'satellite-marker-below' : 'satellite-marker',
    html: `<div class="satellite-icon"><span class="material-icons-round">${isBelow ? 'satellite_alt' : 'satellite'}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Get current map center longitude
  const centerLon = map.getCenter().lng;
  let satLon = satellite.longitude;
  if (Math.abs(centerLon - satLon) > 180) {
    if (satLon < 0) {
      satLon += 360;
    } else {
      satLon -= 360;
    }
  }

  const marker = L.marker([0, satLon], {
    icon: satIcon,
    zIndexOffset: isBelow ? 100 : 200
  }).addTo(map);

  satelliteMarkers.push({ satellite, marker, isBelow });

  return marker;
}

/**
 * Update all satellite lines
 */
export function updateSatelliteLines(lat, lon) {
  const map = getMap();
  if (!map) return;

  if (lineLayers.length > 0) {
    clearVisualization();
    drawEquator();

    document.querySelectorAll("input[type=checkbox][data-satlon]:checked").forEach(cb => {
      const satLon = parseFloat(cb.dataset.satlon);
      const name = cb.dataset.name;
      const el = calculateElevation(lat, lon, satLon);
      drawLine(lat, lon, satLon, name, el, cb.id);
    });

    if (typeof SATELLITES !== 'undefined') {
      SATELLITES.forEach((sat) => {
        const el = calculateElevation(lat, lon, sat.longitude);
        addSatelliteMarker(sat, el < 0);
      });
    }
  }
}

/**
 * Remove a satellite line and its footprint
 */
export function removeLine(id) {
  const map = getMap();
  if (!map) return;

  const existing = lineLayers.find(l => l.id === id);
  if (existing) {
    map.removeLayer(existing.layer);
    lineLayers = lineLayers.filter(l => l.id !== id);

    coverageCones
      .filter(c => c.id === id)
      .forEach(c => map.removeLayer(c.circle));
    coverageCones = coverageCones.filter(c => c.id !== id);

    footprintLayers
      .filter(f => f.id === id)
      .forEach(f => map.removeLayer(f.layer));
    footprintLayers = footprintLayers.filter(f => f.id !== id);
  }
}

/**
 * Calculate satellite footprint edge points - limiting to standard longitude range
 * This creates the visible footprint with boundaries at +/-180
 */
export function calculateSatelliteFootprint(satellite) {
  const EARTH_RADIUS = 6371;
  const SATELLITE_ALTITUDE = 35786;
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;
  const maxCoverageAngleRad = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE);

  const lat0 = 0;
  const lon0 = normalizeLon(satellite.longitude);
  
  // Calculate points in western and eastern hemisphere separately
  const eastHemispherePoints = [];
  const westHemispherePoints = [];
  
  // Use more points for smoother curves
  const numPoints = 360;
  
  for (let i = 0; i <= numPoints; i++) {
    const azimuth = (i * 360) / numPoints;
    const azRad = (azimuth * Math.PI) / 180;
    const lat0Rad = lat0 * Math.PI / 180;
    const lon0Rad = lon0 * Math.PI / 180;
    
    const latRad = Math.asin(
      Math.sin(lat0Rad) * Math.cos(maxCoverageAngleRad) +
      Math.cos(lat0Rad) * Math.sin(maxCoverageAngleRad) * Math.cos(azRad)
    );
    
    const lonRad = lon0Rad + Math.atan2(
      Math.sin(azRad) * Math.sin(maxCoverageAngleRad) * Math.cos(lat0Rad),
      Math.cos(maxCoverageAngleRad) - Math.sin(lat0Rad) * Math.sin(latRad)
    );
    
    const latDeg = latRad * 180 / Math.PI;
    const lonDeg = normalizeLon(lonRad * 180 / Math.PI);
    
    // Add to the appropriate hemisphere array
    if (lonDeg >= 0) {
      eastHemispherePoints.push([latDeg, lonDeg]);
    } else {
      westHemispherePoints.push([latDeg, lonDeg]);
    }
  }
  
  // Check if we cross the date line
  const crossesDateLine = lon0 > 90 || lon0 < -90;
  
  if (crossesDateLine) {
    // Add boundary points at the date line for proper rendering
    const eastMaxLat = calculateDatelineCrossingLat(satellite, true);
    const westMaxLat = calculateDatelineCrossingLat(satellite, false);
    
    if (eastMaxLat !== null) {
      eastHemispherePoints.push([eastMaxLat, 180]);
      westHemispherePoints.push([eastMaxLat, -180]);
    }
    
    if (westMaxLat !== null) {
      eastHemispherePoints.push([westMaxLat, 180]);
      westHemispherePoints.push([westMaxLat, -180]);
    }
  }
  
  // Return segments based on whether we have points in each hemisphere
  const segments = [];
  if (eastHemispherePoints.length > 2) segments.push(sortPointsClockwise(eastHemispherePoints, lon0));
  if (westHemispherePoints.length > 2) segments.push(sortPointsClockwise(westHemispherePoints, lon0));
  
  return segments;
}

/**
 * Calculate the latitude where the satellite footprint crosses the date line
 * @param {Object} satellite - The satellite object
 * @param {boolean} isEastern - Whether to calculate for the eastern (true) or western (false) date line
 * @returns {number|null} - The latitude of intersection or null if no intersection
 */
function calculateDatelineCrossingLat(satellite, isEastern) {
  const EARTH_RADIUS = 6371;
  const SATELLITE_ALTITUDE = 35786;
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;
  const maxCoverageAngleRad = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE);
  
  const satLon = normalizeLon(satellite.longitude);
  const satLat = 0;  // Geostationary satellites are at the equator
  
  // Determine longitude difference to the date line
  const lonDiff = isEastern ? 180 - satLon : -180 - satLon;
  const lonDiffRad = lonDiff * Math.PI / 180;
  
  // Calculate the central angle from satellite nadir to date line
  // Using the spherical law of cosines
  const satLatRad = satLat * Math.PI / 180;
  const centralAngle = Math.acos(Math.cos(satLatRad) * Math.cos(lonDiffRad));
  
  // If this angle is larger than the max coverage angle, no intersection
  if (centralAngle > maxCoverageAngleRad) {
    return null;
  }
  
  // Calculate the latitude of intersection using great circle formulas
  const latRad = Math.asin(
    Math.sin(satLatRad) * Math.cos(maxCoverageAngleRad) / Math.sin(centralAngle)
  );
  
  return latRad * 180 / Math.PI;
}

/**
 * Sort points in clockwise order around a central longitude for proper rendering
 */
function sortPointsClockwise(points, centerLon) {
  // Simple center calculation - average of points
  let centerLat = 0;
  for (const point of points) {
    centerLat += point[0];
  }
  centerLat /= points.length;
  
  // Sort points by angle from center
  return points.sort((a, b) => {
    const angleA = Math.atan2(a[0] - centerLat, a[1] - centerLon);
    const angleB = Math.atan2(b[0] - centerLat, b[1] - centerLon);
    return angleA - angleB;
  });
}

/**
 * Draw satellite footprint using polylines for different hemispheres
 */
export function drawSatelliteFootprint(satellite, id) {
  const map = getMap();
  if (!map) return;
  
  const segments = calculateSatelliteFootprint(satellite);
  if (!segments || segments.length === 0) return;

  // Common options for all footprint polylines
  const footprintOptions = {
    color: '#1a73e8',
    weight: 2,
    opacity: 0.6,
    dashArray: '4,4',
    className: 'satellite-footprint',
    interactive: false
  };
  
  // Draw each segment as a separate polyline
  segments.forEach((segment, index) => {
    if (segment.length < 3) return; // Skip segments with too few points
    
    const footprint = L.polyline(segment, footprintOptions).addTo(map);
    
    // Add tooltip only to the first segment
    if (index === 0) {
      footprint.bindTooltip(`${satellite.name} Coverage Area`, {
        permanent: false,
        className: "footprint-label"
      });
    }
    
    footprintLayers.push({ id, layer: footprint });
  });
}

/**
 * Toggle footprint display
 */
export function toggleSatelliteFootprints() {
  const lastLocation = document.getElementById('current-location-indicator');
  if (!lastLocation || lastLocation.classList.contains('hidden')) {
    showNotification("Please select a location first", "error");
    return false;
  }

  footprintsVisible = !footprintsVisible;

  if (footprintsVisible) {
    document.querySelectorAll("input[type=checkbox][data-satlon]:checked").forEach(cb => {
      const satLon = parseFloat(cb.dataset.satlon);
      const sat = getSatellites().find(s => s.longitude === satLon);
      if (sat) drawSatelliteFootprint(sat, cb.id);
    });
  } else {
    clearFootprints();
  }

  return footprintsVisible;
}

/**
 * Clear all satellite footprints
 */
export function clearFootprints() {
  const map = getMap();
  if (!map) return;

  footprintLayers.forEach(f => map.removeLayer(f.layer));
  footprintLayers = [];
}
