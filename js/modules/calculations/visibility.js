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
 * Given an array of [lat, lon] points, split the footprint into segments by detecting
 * large jumps in longitude (i.e. > 180°) between consecutive points. When a jump is detected,
 * an interpolated crossing point is computed at the ±180° edge and inserted.
 */
function splitFootprintAtDateLine(points) {
  const segments = [];
  let currentSegment = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const diff = Math.abs(curr[1] - prev[1]);
    if (diff > 180) {
      // Determine the crossing edge based on the previous point.
      const crossingEdge = prev[1] > 0 ? 180 : -180;
      // Calculate the fraction along the segment where the crossing occurs.
      const fraction = (crossingEdge - prev[1]) / (curr[1] - prev[1]);
      const latCross = prev[0] + fraction * (curr[0] - prev[0]);
      // Append the crossing point at the edge.
      currentSegment.push([latCross, crossingEdge]);
      segments.push(currentSegment);
      // Start a new segment beginning at the crossing on the opposite edge.
      const newCrossingLon = crossingEdge === 180 ? -180 : 180;
      currentSegment = [[latCross, newCrossingLon], curr];
    } else {
      currentSegment.push(curr);
    }
  }
  if (currentSegment.length > 0) segments.push(currentSegment);
  return segments;
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
 * Calculate satellite footprint points and split at the dateline if necessary.
 * Returns an array of segments, each segment is an array of [lat, lon] pairs.
 */
export function calculateSatelliteFootprint(satellite) {
  const EARTH_RADIUS = 6371;
  const SATELLITE_ALTITUDE = 35786;
  const TOTAL_ALTITUDE = EARTH_RADIUS + SATELLITE_ALTITUDE;
  const maxCoverageAngleRad = Math.acos(EARTH_RADIUS / TOTAL_ALTITUDE);

  const lat0 = 0;
  const lon0 = satellite.longitude;
  
  const footprintPoints = [];
  const numPoints = 36;
  const startAzimuth = 0;
  const endAzimuth = 360;
  
  for (let i = 0; i <= numPoints; i++) {
    const azimuth = startAzimuth + i * (endAzimuth - startAzimuth) / numPoints;
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
    
    footprintPoints.push([latDeg, lonDeg]);
  }
  
  return splitFootprintAtDateLine(footprintPoints);
}

/**
 * Draw satellite footprint using a polyline for each segment
 */
export function drawSatelliteFootprint(satellite, id) {
  const map = getMap();
  if (!map) return;
  
  const segments = calculateSatelliteFootprint(satellite);
  if (!segments || segments.length === 0) return;

  for (const segment of segments) {
    const footprint = L.polyline(segment, {
      color: '#1a73e8',
      weight: 2,
      opacity: 0.6,
      dashArray: '4,4',
      className: 'satellite-footprint',
      interactive: false
    }).addTo(map);

    footprint.bindTooltip(`${satellite.name} Coverage Area`, {
      permanent: false,
      className: "footprint-label"
    });

    footprintLayers.push({ id, layer: footprint });
  }
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
