// visibility.js - Satellite visibility and visualization calculations
import { getMap } from '../ui/map.js';
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
 */
export function drawLine(lat, lon, satLon, label, el, id) {
  const map = getMap();
  if (!map) return null;
  
  const isVisible = el >= 0;
  const style = isVisible ? LINE_STYLES.ABOVE_HORIZON : LINE_STYLES.BELOW_HORIZON;

  const polyline = L.polyline([[lat, lon], [0, satLon]], {
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

  const lineLayer = { id, layer: polyline };
  lineLayers.push(lineLayer);

  if (isVisible) {
    drawCoverageCone(lat, lon, satLon, el, id);
  }

  return lineLayer;
}

/**
 * Draw a coverage cone
 */
export function drawCoverageCone(lat, lon, satLon, el, id) {
  const map = getMap();
  if (!map || el < 0) return null;

  const coverageRadius = calculateCoverageRadius(el);
  const colorClass = getCoverageStyleClass(el);

  const coverageCircle = L.circle([lat, lon], {
    radius: coverageRadius * 1000,
    className: colorClass,
    interactive: false
  }).addTo(map);

  const cone = { id, circle: coverageCircle };
  coverageCones.push(cone);

  return cone;
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

  const marker = L.marker([0, satellite.longitude], { 
    icon: satIcon,
    zIndexOffset: isBelow ? 100 : 200
  }).addTo(map);

  const satelliteMarker = { satellite, marker, isBelow };
  satelliteMarkers.push(satelliteMarker);

  return satelliteMarker;
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

    if (footprintsVisible) {
      drawAllFootprints(lat, lon);
    }
  }
}

/**
 * Remove a line by ID
 */
export function removeLine(id) {
  const map = getMap();
  if (!map) return;

  const existing = lineLayers.find(l => l.id === id);
  if (existing) {
    map.removeLayer(existing.layer);
    lineLayers = lineLayers.filter(l => l.id !== id);

    const associatedCones = coverageCones.filter(c => c.id === id);
    associatedCones.forEach(cone => map.removeLayer(cone.circle));
    coverageCones = coverageCones.filter(c => c.id !== id);
  }
}

/**
 * Calculate satellite footprint (centered on satellite nadir)
 */
export function calculateSatelliteFootprint(satellite) {
  const EARTH_RADIUS = 6371;
  const SATELLITE_ALTITUDE = 35786;
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;
  const maxCoverageAngleRad = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE);

  const lat0 = 0;
  const lon0 = satellite.longitude;

  const footprintPoints = [];
  const stepSize = 5;

  for (let azimuth = 0; azimuth < 360; azimuth += stepSize) {
    const azRad = azimuth * Math.PI / 180;
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

    const latDeg = latRad * 180 / Math.PI;
    const lonDeg = lonRad * 180 / Math.PI;

    footprintPoints.push([latDeg, lonDeg]);
  }

  return footprintPoints;
}

/**
 * Draw a satellite footprint (centered on satellite)
 */
export function drawSatelliteFootprint(satellite) {
  const map = getMap();
  if (!map) return;

  const footprintPoints = calculateSatelliteFootprint(satellite);
  if (footprintPoints.length === 0) return;

  const footprint = L.polygon(footprintPoints, {
    color: '#1a73e8',
    fillColor: '#1a73e8',
    fillOpacity: 0.1,
    weight: 2,
    className: 'satellite-footprint'
  }).addTo(map);

  footprint.bindTooltip(`${satellite.name} Coverage Area`, {
    permanent: false,
    className: "footprint-label"
  });

  footprintLayers.push(footprint);
  return footprint;
}

/**
 * Toggle all footprints
 */
export function toggleSatelliteFootprints() {
  const lastLocation = document.getElementById('current-location-indicator');

  if (!lastLocation || lastLocation.classList.contains('hidden')) {
    showNotification("Please select a location first", "error");
    return false;
  }

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
 * Clear all footprints
 */
export function clearFootprints() {
  const map = getMap();
  if (!map) return;

  footprintLayers.forEach(layer => map.removeLayer(layer));
  footprintLayers = [];
}

/**
 * Draw all visible satellite footprints
 */
export function drawAllFootprints(lat, lon) {
  clearFootprints();

  const map = getMap();
  if (!map) return;

  const satellites = getSatellites();

  satellites.forEach(sat => {
    const elevation = calculateElevation(lat, lon, sat.longitude);
    if (elevation >= 0) {
      drawSatelliteFootprint(sat);
    }
  });
}
