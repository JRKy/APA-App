// geocoder.js - Geocoder functionality for location search
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
  
  // Initialize the geocoder control
  const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false, // Don't automatically add markers
    position: 'topleft',
    placeholder: 'Search for location...',
    errorMessage: 'No results found',
    suggestMinLength: 3,
    suggestTimeout: 250,
    queryMinLength: 1
  }).addTo(map);
  
  // Handle geocoding results
  geocoder.on('markgeocode', function(e) {
    const result = e.geocode;
    const latlng = result.center;
    const name = result.name;
    
    // Navigate to the location using your existing function
    goToLocation(latlng.lat, latlng.lng, name);
    
    // Show notification
    showNotification(`Location found: ${name}`, "success");
    
    // Publish event
    eventBus.publish('geocodeLocationSelected', {
      name,
      lat: latlng.lat,
      lon: latlng.lng
    });
  });
}

/**
 * Programmatically search for a location by name
 * @param {string} query - Location name or address to search for
 * @returns {Promise} Promise that resolves with geocoding results
 */
export function searchLocation(query) {
  return new Promise((resolve, reject) => {
    // Get the geocoder provider
    const provider = L.Control.Geocoder.nominatim();
    
    provider.geocode(query, (results) => {
      if (results && results.length > 0) {
        resolve(results);
      } else {
        reject(new Error('No results found'));
      }
    });
  });
}
