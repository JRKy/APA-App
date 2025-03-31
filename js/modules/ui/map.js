// map.js - Map initialization and management
import { MAP_DEFAULTS, GRID_INTERVALS } from '../core/config.js';
import { debounce } from '../core/utils.js';
import { updateSatelliteLines } from '../calculations/visibility.js';
import { eventBus } from '../core/events.js';

// Map instance and state variables
let map;
let siteMarker;
let lastLocation = null;

/**
 * Initialize the map with base layers
 * @returns {Object} The initialized map instance
 */
export function initMap() {
  // Define base layers
  const baseLayers = {
    "Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-layer-light'
    }),
    "Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={y}&y={y}&z={z}", {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "&copy; Google Satellite",
      className: 'map-layer-dark'
    }),
    "Terrain": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenTopoMap contributors',
      className: 'map-layer-light'
    }),
    "Dark": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; CARTO',
      className: 'map-layer-dark'
    })
  };

  // Create map instance
  map = L.map("map", {
    center: MAP_DEFAULTS.CENTER,
    zoom: MAP_DEFAULTS.ZOOM,
    layers: [baseLayers.Map],
    zoomControl: true,
    attributionControl: true,
    minZoom: MAP_DEFAULTS.MIN_ZOOM
  });

  // Add layer control
  L.control.layers(baseLayers, null, {
    position: 'topright',
    collapsed: true
  }).addTo(map);

  // Add grid lines
  const gridOptions = {
    showLabel: true,
    dashArray: [5, 5],
    color: '#666',
    fontColor: '#666',
    opacity: 0.6,
    lineWidth: 1
  };

  // Add latitude-longitude grid when zoomed in
  map.on('zoomend', function() {
    updateGridLines();
  });
  
  // Add debounced map event handlers for better performance
  map.on('zoomend moveend', debounce(() => {
    if (lastLocation) {
      updateSatelliteLines(lastLocation.lat, lastLocation.lon);
      eventBus.publish('mapViewChanged', {
        center: map.getCenter(),
        zoom: map.getZoom()
      });
    }
  }, 100));
  
  // Initialize grid lines
  updateGridLines();
  
  // Publish map ready event
  eventBus.publish('mapReady', map);
  
  return map;
}

/**
 * Update grid lines based on zoom level
 */
function updateGridLines() {
  if (!map) return;
  
  if (map.getZoom() > 3) {
    if (!map._gridLayer) {
      map._gridLayer = L.latlngGraticule(getGridOptions()).addTo(map);
    }
  } else if (map._gridLayer) {
    map.removeLayer(map._gridLayer);
    map._gridLayer = null;
  }
}

/**
 * Get grid options, adjusted for dark mode if needed
 * @returns {Object} Grid options object
 */
function getGridOptions() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  
  return {
    showLabel: true,
    dashArray: [5, 5],
    color: isDarkMode ? '#aaa' : '#666',
    fontColor: isDarkMode ? '#aaa' : '#666',
    opacity: 0.6,
    lineWidth: 1
  };
}

/**
 * Update map appearance based on dark mode
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 */
export function updateMapAppearance(isDarkMode) {
  if (!map) return;
  
  if (isDarkMode) {
    document.querySelectorAll('.leaflet-control').forEach(control => {
      control.classList.add('dark-control');
    });
    
    if (map._gridLayer) {
      map._gridLayer.setStyle({
        color: '#aaa',
        fontColor: '#aaa'
      });
    }
  } else {
    document.querySelectorAll('.leaflet-control').forEach(control => {
      control.classList.remove('dark-control');
    });
    
    if (map._gridLayer) {
      map._gridLayer.setStyle({
        color: '#666',
        fontColor: '#666'
      });
    }
  }
}

/**
 * Set the map view to a location and add a marker
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level (default: 5)
 * @returns {Object} The marker that was added
 */
export function setMapLocation(lat, lon, zoom = 5) {
  if (!map) return null;
  
  // Update stored location
  lastLocation = { lat, lon };
  
  // Set map view
  map.setView([lat, lon], zoom);
  
  // Update marker
  if (siteMarker) map.removeLayer(siteMarker);
  
  // Create custom marker
  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><span class="material-icons-round">location_on</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
  
  siteMarker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);
  
  return siteMarker;
}

/**
 * Get the current map instance
 * @returns {Object|null} Leaflet map instance or null if not initialized
 */
export function getMap() {
  return map;
}

/**
 * Get the last active location
 * @returns {Object|null} Last location {lat, lon} or null
 */
export function getLastLocation() {
  return lastLocation;
}

// Define grid renderer class using Leaflet extension pattern
L.LatLngGraticule = L.LayerGroup.extend({
  initialize: function(options) {
    L.LayerGroup.prototype.initialize.call(this);
    this.options = L.extend({
      showLabel: true,
      opacity: 0.5,
      weight: 1,
      color: '#111',
      font: '12px Helvetica, sans-serif',
      fontColor: '#555',
      dashArray: [0, 0],
      format: function(n) { return Math.abs(n) + (n < 0 ? 'S' : 'N'); },
      zoomInterval: GRID_INTERVALS
    }, options);
    
    this.lineStyle = {
      stroke: true,
      color: this.options.color,
      opacity: this.options.opacity,
      weight: this.options.weight,
      dashArray: this.options.dashArray
    };
  },
  
  onAdd: function(map) {
    this._map = map;
    this._update();
    
    this._map.on('zoomend', this._update, this);
    return this;
  },
  
  onRemove: function(map) {
    map.off('zoomend', this._update, this);
    this.clearLayers();
  },

  setStyle: function(style) {
    L.extend(this.options, style);
    this.lineStyle = {
      stroke: true,
      color: this.options.color,
      opacity: this.options.opacity,
      weight: this.options.weight,
      dashArray: this.options.dashArray
    };
    this._update();
  },
  
  _update: function() {
    this.clearLayers();
    
    const zoom = this._map.getZoom();
    let interval = 30;
    
    for (const i of this.options.zoomInterval) {
      if (zoom >= i.start && zoom <= i.end) {
        interval = i.interval;
        break;
      }
    }
    
    if (interval > 0) {
      this._drawGraticule(interval);
    }
  },
  
  _drawGraticule: function(interval) {
    const latLines = [];
    const lngLines = [];
    
    // Draw meridians (longitude lines)
    for (let lng = -180; lng <= 180; lng += interval) {
      const line = L.polyline([[-90, lng], [90, lng]], this.lineStyle);
      lngLines.push(line);
      this.addLayer(line);
      
      if (this.options.showLabel) {
        this._addLabel(0, lng, lng + '°');
      }
    }
    
    // Draw parallels (latitude lines)
    for (let lat = -90; lat <= 90; lat += interval) {
      if (lat === -90 || lat === 90) continue;
      const line = L.polyline([[lat, -180], [lat, 180]], this.lineStyle);
      latLines.push(line);
      this.addLayer(line);
      
      if (this.options.showLabel) {
        this._addLabel(lat, 0, lat + '°');
      }
    }
  },
  
  _addLabel: function(lat, lng, label) {
    const point = this._map.latLngToLayerPoint([lat, lng]);
    
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'grid-label',
        html: label,
        iconSize: [50, 20]
      })
    }).addTo(this);
  }
});

// Factory function for the grid renderer
L.latlngGraticule = function(options) {
  return new L.LatLngGraticule(options);
};