// visibility.js - Satellite visibility and visualization calculations
import { getMap } from '../ui/map.js';
import { getCoverageStyleClass, LINE_STYLES } from '../core/config.js';
import { calculateElevation, calculateAzimuth, calculateCoverageRadius } from './angles.js';

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
      drawAllFootprints();
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
 * Generate satellite detail popup content
 * @param {Object} satellite - Satellite object
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 * @returns {string} HTML content for popup
 */
export function getSatelliteDetailsHTML(satellite, lat, lon) {
  // Calculate details
  const az = calculateAzimuth(lat, lon, satellite.longitude).toFixed(1);
  const el = calculateElevation(lat, lon, satellite.longitude).toFixed(1);
  const elNum = parseFloat(el);
  const qualityLabel = elNum >= 0 ? 
    (elNum >= 30 ? 'Excellent' : elNum >= 15 ? 'Good' : elNum >= 5 ? 'Marginal' : 'Poor') : 
    'Below Horizon';
  
  // Calculate approximate distance
  const distance = calculateDistance(lat, lon, 0, satellite.longitude).toFixed(0);
  
  // Get CSS class for elevation
  const elClass = elNum < 0 ? 'elevation-negative' : 
    elNum >= 30 ? 'elevation-excellent' : 
    elNum >= 15 ? 'elevation-good' : 
    elNum >= 5 ? 'elevation-marginal' : 
    'elevation-poor';
  
  // Create popup content
  return `
    <div class="satellite-popup">
      <div class="satellite-popup-header">${satellite.name}</div>
      <div class="satellite-popup-content">
        <div class="satellite-popup-label">Longitude:</div>
        <div class="satellite-popup-value">${satellite.longitude.toFixed(1)}°</div>
        
        <div class="satellite-popup-label">Elevation:</div>
        <div class="satellite-popup-value ${elClass}">${el}°</div>
        
        <div class="satellite-popup-label">Azimuth:</div>
        <div class="satellite-popup-value">${az}°</div>
        
        <div class="satellite-popup-label">Quality:</div>
        <div class="satellite-popup-value">${qualityLabel}</div>
        
        <div class="satellite-popup-label">Distance:</div>
        <div class="satellite-popup-value">${distance} km</div>
      </div>
    </div>
  `;
}

/**
 * Calculate distance between two points on Earth
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Earth radius in km
  const R = 6371;
  
  // Convert to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Toggle satellite footprints visibility
 * @returns {boolean} New visibility state
 */
export function toggleSatelliteFootprints() {
  footprintsVisible = !footprintsVisible;
  
  if (footprintsVisible) {
    drawAllFootprints();
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
 */
export function drawAllFootprints() {
  // Clear any existing footprints
  clearFootprints();
  
  const map = getMap();
  if (!map) return;
  
  // Get all visible satellites
  const visibleSatellites = satelliteMarkers.filter(marker => !marker.isBelow);
  
  visibleSatellites.forEach(satMarker => {
    drawSatelliteFootprint(satMarker.satellite);
  });
}

/**
 * Draw a single satellite footprint
 * @param {Object} satellite - Satellite object
 */
export function drawSatelliteFootprint(satellite) {
  const map = getMap();
  if (!map) return;
  
  // Calculate footprint radius (simplified - in reality it depends on orbital height)
  // Geostationary satellites can see about 42% of Earth's surface
  const earthRadius = 6371; // km
  const footprintRadius = 5000; // approximate visible radius in km
  
  // Create circle at satellite's position on equator
  const footprint = L.circle([0, satellite.longitude], {
    radius: footprintRadius * 1000, // convert to meters for Leaflet
    color: '#1a73e8',
    fillColor: '#1a73e8',
    fillOpacity: 0.1,
    weight: 1,
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
