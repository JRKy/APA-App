// satellites.js - Satellite data management
import { getStoredValue, storeValue, showNotification } from '../core/utils.js';
import { eventBus } from '../core/events.js';
import { calculateElevation, calculateAzimuth } from '../calculations/angles.js';

// Reference to the global SATELLITES array from data.js
let satellites = [];

/**
 * Initialize satellites from global array and localStorage
 */
export function loadCustomSatellites() {
  // Store reference to global satellites array
  if (typeof SATELLITES !== 'undefined') {
    satellites = SATELLITES;
  }
  
  const savedSats = getStoredValue('customSatellites', []);
  
  if (savedSats.length > 0) {
    try {
      // Filter out duplicates
      savedSats.forEach(sat => {
        if (!satellites.some(s => s.name === sat.name || s.longitude === sat.longitude)) {
          satellites.push({...sat, custom: true});
        }
      });
      
      // Notify other components of the update
      eventBus.publish('satellitesUpdated', satellites);
    } catch (e) {
      console.error('Failed to load custom satellites:', e);
    }
  }
}

/**
 * Save custom satellites to localStorage
 */
export function saveCustomSatellites() {
  const customSats = satellites.filter(sat => sat.custom);
  if (customSats.length > 0) {
    storeValue('customSatellites', customSats);
  } else {
    localStorage.removeItem('customSatellites');
  }
}

/**
 * Add a new satellite
 * @param {string} name - Satellite name
 * @param {number} longitude - Satellite longitude
 * @returns {Object} Result with success status and message
 */
export function addSatellite(name, longitude) {
  // Validate input
  name = name.trim();
  longitude = parseFloat(longitude);
  
  if (!name) {
    return { success: false, message: "Please enter a satellite name." };
  }
  
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { success: false, message: "Please enter a valid longitude between -180 and 180." };
  }
  
  // Check for duplicates
  const exists = satellites.some(s => s.name === name || s.longitude === longitude);
  if (exists) {
    return { success: false, message: "A satellite with this name or longitude already exists." };
  }
  
  // Add the satellite
  const newSatellite = { 
    name, 
    longitude, 
    custom: true 
  };
  
  satellites.push(newSatellite);
  saveCustomSatellites();
  
  // Notify other components of the update
  eventBus.publish('satellitesUpdated', satellites);
  
  return { 
    success: true, 
    message: `Satellite "${name}" added successfully.`, 
    satellite: newSatellite 
  };
}

/**
 * Remove a satellite
 * @param {string} name - Satellite name
 * @returns {Object} Result with success status and message
 */
export function removeSatellite(name) {
  const index = satellites.findIndex(s => s.name === name && s.custom);
  
  if (index === -1) {
    return { success: false, message: `Satellite "${name}" not found or cannot be deleted.` };
  }
  
  satellites.splice(index, 1);
  saveCustomSatellites();
  
  // Notify other components of the update
  eventBus.publish('satellitesUpdated', satellites);
  
  return { success: true, message: `Satellite "${name}" deleted.` };
}

/**
 * Get all satellites
 * @returns {Array} Array of satellite objects
 */
export function getSatellites() {
  return [...satellites];
}

/**
 * Get a single satellite by name
 * @param {string} name - Satellite name
 * @returns {Object|null} Satellite object or null if not found
 */
export function getSatelliteByName(name) {
  return satellites.find(s => s.name === name) || null;
}

/**
 * Calculate visibility and angles for all satellites from a location
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 * @returns {Array} Array of satellite objects with calculated properties
 */
export function calculateSatelliteData(lat, lon) {
  return satellites.map(sat => {
    const elevation = calculateElevation(lat, lon, sat.longitude);
    const azimuth = calculateAzimuth(lat, lon, sat.longitude);
    const isVisible = elevation >= 0;
    
    return {
      ...sat,
      elevation,
      azimuth,
      isVisible
    };
  });
}