// Create this file at: js/modules/core/versionManager.js

import { VERSION } from './version.js';

// Check for version changes
export function checkVersion() {
  const storedVersion = localStorage.getItem('app_version');
  const isNewVersion = !storedVersion || storedVersion !== VERSION;
  
  // Update stored version
  if (isNewVersion) {
    localStorage.setItem('app_version', VERSION);
    console.log(`Version updated: ${storedVersion || 'first run'} → ${VERSION}`);
  }
  
  return {
    current: VERSION,
    previous: storedVersion,
    isNewVersion
  };
}

// Initialize version-related elements
export function initVersionDisplay() {
  // Update version display in DOM
  const versionElements = document.querySelectorAll('[data-version]');
  versionElements.forEach(el => {
    el.textContent = VERSION;
  });
  
  // Update version in the document title if it contains a version number
  if (document.title.match(/v[0-9.]+/)) {
    document.title = document.title.replace(/v[0-9.]+/, `v${VERSION}`);
  }
}

// Show what's new dialog if version changed
export function showWhatsNew(versionInfo) {
  if (!versionInfo.isNewVersion || !versionInfo.previous) {
    return; // Skip for first-time users
  }
  
  // Import notification utility dynamically to avoid circular dependencies
  import('./utils.js').then(({ showNotification }) => {
    showNotification(`Updated to version ${VERSION}! Check out the new features.`, "info");
  });
}
