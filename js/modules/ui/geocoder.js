// geocoder.js - Simple geocoder functionality for location search
import { getMap } from './map.js';
import { goToLocation } from '../data/locations.js';
import { showNotification } from '../core/utils.js';
import { eventBus } from '../core/events.js';

/**
 * Initialize the geocoder control
 */
export function initGeocoder() {
  const map = getMap();
  if (!map) return;
  
  // Create a custom geocoder control
  const GeocoderControl = L.Control.extend({
    options: {
      position: 'topleft'
    },
    
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-geocoder');
      const form = L.DomUtil.create('form', 'leaflet-control-geocoder-form', container);
      const input = L.DomUtil.create('input', 'leaflet-control-geocoder-input', form);
      
      input.type = 'text';
      input.placeholder = 'Search for location...';
      input.autocomplete = 'off';
      
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      
      // Prevent map zoom when double-clicking on the control
      L.DomEvent.on(container, 'dblclick', L.DomEvent.stopPropagation);
      
      // Handle search on form submit
      L.DomEvent.on(form, 'submit', function(e) {
        L.DomEvent.preventDefault(e);
        const query = input.value.trim();
        if (query) {
          searchLocation(query)
            .then(results => {
              if (results.length > 0) {
                const result = results[0];
                goToLocation(result.lat, result.lon, result.name);
                input.value = '';
              } else {
                showNotification('No results found', 'error');
              }
            })
            .catch(error => {
              showNotification(error.message, 'error');
            });
        }
      });
      
      return container;
    }
  });
  
  // Add the control to the map
  new GeocoderControl().addTo(map);
}

/**
 * Programmatically search for a location by name using Nominatim
 * @param {string} query - Location name or address to search for
 * @returns {Promise} Promise that resolves with geocoding results
 */
export function searchLocation(query) {
  const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  
  return fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'APA App Geocoder'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data && data.length > 0) {
      // Transform the data to a simpler format
      return data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));
    } else {
      return [];
    }
  });
}
