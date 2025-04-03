// visibility.js - Satellite visibility and visualization calculations
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
  
  // Check if we need to wrap around the map
  if (Math.abs(lon - satLon) > 180) {
    if (satLon < 0) {
      displaySatLon += 360; // Shift to a positive longitude beyond 180
    } else {
      displaySatLon -= 360; // Shift to a negative longitude below -180
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
  
  // Check if we need to wrap around the map to make the satellite visible
  // This ensures the satellite will appear on the side of the map closest to current view
  if (Math.abs(centerLon - satLon) > 180) {
    if (satLon < 0) {
      satLon += 360; // Shift to a positive longitude beyond 180
    } else {
      satLon -= 360; // Shift to a negative longitude below -180
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
 * Calculate satellite footprint points without crossing the date line
 */
export function calculateSatelliteFootprint(satellite) {
  const EARTH_RADIUS = 6371;
  const SATELLITE_ALTITUDE = 35786;
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;
  const maxCoverageAngleRad = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE);

  const lat0 = 0;
  const lon0 = satellite.longitude;
  
  // Calculate a set of points for a partial coverage area
  // that stays on the same side of the date line
  const footprintPoints = [];
  const numPoints = 36; // More points for smoother appearance
  
  // For satellites near the date line, limit the longitude range
  const isNearDateLine = Math.abs(Math.abs(lon0) - 180) < 40;
  
  // Full 360 degree coverage
  const startAzimuth = 0;
  const endAzimuth = 360;
  
  // Generate points for the footprint
  for (let azimuth = startAzimuth; azimuth <= endAzimuth; azimuth += (endAzimuth - startAzimuth) / numPoints) {
    const azRad = (azimuth % 360) * Math.PI / 180;
    const angularDistance = maxCoverageAngleRad;
    
    const lat0Rad = lat0 * Math.PI / 180;
    const lon0Rad = lon0 * Math.PI / 180;
    
    const latRad = Math.asin(
      Math.sin(lat0Rad) * Math.cos(angularDistance) +
      Math.cos(lat0Rad) * Math.sin(angularDistance) * Math.cos(azRad)
    );
    
    const lonRad = lon0Rad + Math.atan2(
      Math.sin(azRad) * Math.sin(angularDistance) * Math.cos(lat0Rad),
      Math.cos(angularDistance) - Math.sin(lat0Rad) * Math.sin(latRad)
    );
    
    // Convert to degrees
    const latDeg = latRad * 180 / Math.PI;
    let lonDeg = lonRad * 180 / Math.PI;
    
    // For points near the date line, handle the wrapping
    if (isNearDateLine) {
      // Normalize longitude to be in the same hemisphere as the satellite
      if (lon0 < 0) { // Western hemisphere
        // If point is in eastern hemisphere but satellite is in western
        if (lonDeg > 0 && lonDeg < 90) {
          lonDeg -= 360; // Shift to western hemisphere
        }
      } else { // Eastern hemisphere
        // If point is in western hemisphere but satellite is in eastern
        if (lonDeg < 0 && lonDeg > -90) {
          lonDeg += 360; // Shift to eastern hemisphere
        }
      }
    }
    
    // Normalize longitude to -180 to 180 range for display
    while (lonDeg > 180) lonDeg -= 360;
    while (lonDeg < -180) lonDeg += 360;
    
    footprintPoints.push([latDeg, lonDeg]);
  }
  
  return footprintPoints;
}

/**
 * Draw satellite footprint using a simple polyline
 */
export function drawSatelliteFootprint(satellite, id) {
  const map = getMap();
  if (!map) return;
  
  // Get points for footprint
  const points = calculateSatelliteFootprint(satellite);
  if (points.length === 0) return;
  
  // Create a footprint with just a polyline - no polygon
  const footprint = L.polyline(points, {
    color: '#1a73e8',
    weight: 2,
    opacity: 0.6,
    dashArray: '4,4',
    className: 'satellite-footprint',
    interactive: false
  }).addTo(map);
  
  // Add tooltip
  footprint.bindTooltip(`${satellite.name} Coverage Area`, {
    permanent: false,
    className: "footprint-label"
  });
  
  footprintLayers.push({ id, layer: footprint });
  return footprint;
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
