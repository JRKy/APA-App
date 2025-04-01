// visibility.js - Satellite visibility and visualization calculations
import { getMap } from '../ui/map.js';
import { getSatelliteFootprintPolygon } from '../core/utils.js';
import { getCoverageStyleClass, LINE_STYLES } from '../core/config.js';
import { getSatellites } from '../data/satellites.js';
import { calculateElevation, calculateAzimuth, calculateCoverageRadius } from './angles.js';
import { showNotification } from '../core/utils.js';

// Track visualization elements
let lineLayers = [];
let satelliteMarkers = [];
let orbitPaths = [];
let coverageCones = [];
let footprintsVisible = false;
let footprintLayers = [];

/**
 * Clear all satellite visualization elements from the map
 */
export function clearVisualization() {
  const map = getMap();
  if (!map) return;
  
  // Remove all lines
  lineLayers.forEach(l => map.removeLayer(l.layer));
  lineLayers = [];
  
  // Remove all satellite markers
  satelliteMarkers.forEach(m => map.removeLayer(m.marker));
  satelliteMarkers = [];
  
  // Remove orbit paths
  orbitPaths.forEach(p => map.removeLayer(p));
  orbitPaths = [];
  
  // Remove coverage cones
  coverageCones.forEach(c => map.removeLayer(c.circle));
  coverageCones = [];
  
  // Remove footprints
  clearFootprints();
}

/**
 * Draw the equator line on the map
 */
export function drawEquator() {
  const map = getMap();
  if (!map) return;
  
  // Create a polyline along the equator
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
 * Draw a satellite line on the map
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 * @param {number} satLon - Satellite longitude
 * @param {string} label - Satellite label
 * @param {number} el - Elevation angle
 * @param {string} id - Unique line ID
 * @returns {Object} The created line layer
 */
export function drawLine(lat, lon, satLon, label, el, id) {
  const map = getMap();
  if (!map) return null;
  
  // Define line style based on elevation
  const isVisible = el >= 0;
  const style = isVisible ? LINE_STYLES.ABOVE_HORIZON : LINE_STYLES.BELOW_HORIZON;
  
  // Create polyline
  const polyline = L.polyline([[lat, lon], [0, satLon]], {
    color: style.color,
    weight: style.weight,
    opacity: style.opacity,
    dashArray: style.dashArray,
    className: style.className
  }).addTo(map);
  
  // Add tooltip
  polyline.bindTooltip(`${label} (${el.toFixed(1)}°)`, {
    permanent: true,
    direction: "center",
    className: "apa-line-label"
  });
  
  // Store line reference
  const lineLayer = { id, layer: polyline };
  lineLayers.push(lineLayer);
  
  // Add coverage cone if visible
  if (isVisible) {
    drawCoverageCone(lat, lon, satLon, el, id);
  }
  
  return lineLayer;
}

/**
 * Draw a coverage cone on the map
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 * @param {number} satLon - Satellite longitude
 * @param {number} el - Elevation angle
 * @param {string} id - Unique line ID
 */
export function drawCoverageCone(lat, lon, satLon, el, id) {
  const map = getMap();
  if (!map) return null;
  
  // Skip if elevation is too low
  if (el < 0) return null;
  
  // Calculate coverage radius
  const coverageRadius = calculateCoverageRadius(el);
  
  // Determine color class based on elevation
  const colorClass = getCoverageStyleClass(el);
  
  // Create circle with appropriate color
  const coverageCircle = L.circle([lat, lon], {
    radius: coverageRadius * 1000, // Convert to meters
    className: colorClass,
    interactive: false
  }).addTo(map);
  
  // Store the circle with its associated satellite ID
  const cone = { id, circle: coverageCircle };
  coverageCones.push(cone);
  
  return cone;
}

/**
 * Add satellite marker on the map
 * @param {Object} satellite - Satellite object
 * @param {boolean} isBelow - Whether the satellite is below the horizon
 * @returns {Object} The created marker
 */
export function addSatelliteMarker(satellite, isBelow) {
  const map = getMap();
  if (!map) return null;
  
  // Remove existing marker for this satellite
  const existingIndex = satelliteMarkers.findIndex(m => m.satellite.name === satellite.name);
  if (existingIndex !== -1) {
    map.removeLayer(satelliteMarkers[existingIndex].marker);
    satelliteMarkers.splice(existingIndex, 1);
  }
  
  // Create custom marker icon
  const satIcon = L.divIcon({
    className: isBelow ? 'satellite-marker-below' : 'satellite-marker',
    html: `<div class="satellite-icon"><span class="material-icons-round">${isBelow ? 'satellite_alt' : 'satellite'}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  
  // Add marker
  const marker = L.marker([0, satellite.longitude], { 
    icon: satIcon,
    zIndexOffset: isBelow ? 100 : 200 // Visible satellites on top
  }).addTo(map);
  
  // Store marker reference
  const satelliteMarker = { 
    satellite, 
    marker,
    isBelow
  };
  satelliteMarkers.push(satelliteMarker);
  
  return satelliteMarker;
}

/**
 * Update all satellite lines on the map
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 */
export function updateSatelliteLines(lat, lon) {
  const map = getMap();
  if (!map) return;
  
  // Only redraw lines if they already exist
  if (lineLayers.length > 0) {
    clearVisualization();
    drawEquator();
    
    // For each checked satellite checkbox, draw a line
    document.querySelectorAll("input[type=checkbox][data-satlon]:checked").forEach(cb => {
      const satLon = parseFloat(cb.dataset.satlon);
      const name = cb.dataset.name;
      const el = calculateElevation(lat, lon, satLon);
      drawLine(lat, lon, satLon, name, el, cb.id);
    });
    
    // Update satellite markers
    if (typeof SATELLITES !== 'undefined') {
      SATELLITES.forEach((sat) => {
        const el = calculateElevation(lat, lon, sat.longitude);
        addSatelliteMarker(sat, el < 0);
      });
    }
    
    // Redraw footprints if enabled
    if (footprintsVisible) {
      drawAllFootprints(lat, lon);
    }
  }
}

/**
 * Remove a satellite line by ID
 * @param {string} id - Line ID to remove
 */
export function removeLine(id) {
  const map = getMap();
  if (!map) return;
  
  // Find and remove existing line
  const existing = lineLayers.find(l => l.id === id);
  if (existing) {
    map.removeLayer(existing.layer);
    lineLayers = lineLayers.filter(l => l.id !== id);
    
    // Also remove associated coverage cone if it exists
    const associatedCones = coverageCones.filter(c => c.id === id);
    associatedCones.forEach(cone => map.removeLayer(cone.circle));
    coverageCones = coverageCones.filter(c => c.id !== id);
  }
}

/**
 * Calculate satellite footprint using more precise geometric calculations
 * @param {Object} satellite - Satellite object
 * @param {number} observerLat - Observer latitude
 * @param {number} observerLon - Observer longitude
 * @returns {Array} Array of footprint polygon coordinates
 */
export function calculateSatelliteFootprint(satellite, observerLat, observerLon) {
  // Accurate geodesic circle centered at satellite sub-point
  return getSatelliteFootprintPolygon(0, satellite.longitude, 8146); // km footprint radius for GEO

  // Constants
  const EARTH_RADIUS = 6371; // km
  const SATELLITE_ALTITUDE = 35786; // km for geostationary satellites
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;

  // Calculate elevation angle
  const elevation = calculateElevation(observerLat, observerLon, satellite.longitude);
  
  // If satellite is below horizon, return empty footprint
  if (elevation < 0) return [];

  // Calculate maximum visible area
  const maxCoverageAngle = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE) * 180 / Math.PI;

  // Generate footprint points
  const footprintPoints = [];
  const stepSize = 10; // degrees

  for (let azimuth = 0; azimuth < 360; azimuth += stepSize) {
    // Convert azimuth to radians
    const azRad = azimuth * Math.PI / 180;
    
    // Calculate point on the surface
    const distanceKm = TOTAL_ALTITUDE * Math.tan(maxCoverageAngle * Math.PI / 180);
    
    // Use Haversine formula to calculate new point
    const lat1 = observerLat * Math.PI / 180;
    const lon1 = observerLon * Math.PI / 180;
    
    const latitude = Math.asin(
      Math.sin(lat1) * Math.cos(distanceKm / EARTH_RADIUS) + 
      Math.cos(lat1) * Math.sin(distanceKm / EARTH_RADIUS) * Math.cos(azRad)
    ) * 180 / Math.PI;
    
    const longitude = (lon1 + Math.atan2(
      Math.sin(azRad) * Math.sin(distanceKm / EARTH_RADIUS) * Math.cos(lat1),
      Math.cos(distanceKm / EARTH_RADIUS) - Math.sin(lat1) * Math.sin(latitude * Math.PI / 180)
    )) * 180 / Math.PI;
    
    footprintPoints.push([latitude, longitude]);
  }

  return footprintPoints;
}

/**
 * Draw more accurate satellite footprint
 * @param {Object} satellite - Satellite object
 * @param {number} observerLat - Observer latitude
 * @param {number} observerLon - Observer longitude
 */
export function drawSatelliteFootprint(satellite, observerLat, observerLon) {
  const map = getMap();
  if (!map) return;

  const footprintPoints = calculateSatelliteFootprint(satellite, observerLat, observerLon);
  
  if (footprintPoints.length === 0) return;

  // Create polygon for footprint
  const footprint = L.polygon(footprintPoints, {
    color: '#1a73e8',
    fillColor: '#1a73e8',
    fillOpacity: 0.1,
    weight: 2,
    className: 'satellite-footprint'
  }).addTo(map);
  
  // Add tooltip
  footprint.bindTooltip(`${satellite.name} Coverage Area`, {
    permanent: false,
    className: "footprint-label"
  });
  
  // Store reference to the layer
  footprintLayers.push(footprint);
  
  return footprint;
}

/**
 * Toggle satellite footprints visibility
 * @returns {boolean} New visibility state
 */
export function toggleSatelliteFootprints() {
  const lastLocation = document.getElementById('current-location-indicator');
  
  if (!lastLocation || lastLocation.classList.contains('hidden')) {
    // No location selected
    showNotification("Please select a location first", "error");
    return false;
  }

  // Get the current location coordinates from a checkbox
  const checkbox = document.querySelector("input[type=checkbox][data-lat]");
  if (!checkbox) return false;

  const lat = parseFloat(checkbox.dataset.lat);
  const lon = parseFloat(checkbox.dataset.lon);

  footprintsVisible = !footprintsVisible;
  
  if (footprintsVisible) {
    drawAllFootprints(lat, lon);
  } else {
    clearFootprints();
  }
  
  return footprintsVisible;
}

/**
 * Clear all satellite footprints from the map
 */
export function clearFootprints() {
  const map = getMap();
  if (!map) return;
  
  footprintLayers.forEach(layer => map.removeLayer(layer));
  footprintLayers = [];
}

/**
 * Draw all satellite footprints on the map
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 */
export function drawAllFootprints(lat, lon) {
  // Clear any existing footprints
  clearFootprints();
  
  const map = getMap();
  if (!map) return;
  
  // Get all satellites
  const satellites = getSatellites();
  
  satellites.forEach(sat => {
    // Only draw footprint if satellite is above horizon
    const elevation = calculateElevation(lat, lon, sat.longitude);
    if (elevation >= 0) {
      drawSatelliteFootprint(sat, lat, lon);
    }
  });
}
