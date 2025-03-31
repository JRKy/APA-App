// utils.js - General utility functions

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Display a notification toast message
 * @param {string} message - Message to display
 * @param {string} type - Message type (info, success, error, warning)
 */
export function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Add icon based on type
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error';
  if (type === 'warning') icon = 'warning';
  
  notification.innerHTML = `
    <span class="material-icons-round">${icon}</span>
    <span>${message}</span>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Calculate the great-circle distance between two points
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
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
 * Create a screen reader announcement
 * @param {string} message - Announcement text
 * @param {string} priority - Priority level (polite, assertive)
 * @param {number} duration - How long to keep element in the DOM (ms)
 */
export function makeAnnouncement(message, priority = 'polite', duration = 1000) {
  const announcement = document.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('aria-live', priority);
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove after it's been read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, duration);
}

/**
 * Check if the device is in mobile/small screen mode
 * @returns {boolean} True if device is mobile size
 */
export function isMobileDevice() {
  return window.innerWidth <= 768;
}

/**
 * Generate a unique identifier
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Safely get a value from localStorage with fallback
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} The stored value or default
 */
export function getStoredValue(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

/**
 * Safely store a value in localStorage
 * @param {string} key - localStorage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} True if successful
 */
export function storeValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
    return false;
  }
}