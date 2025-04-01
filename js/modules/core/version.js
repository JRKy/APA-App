// Create this file at: js/modules/core/version.js

export const VERSION = '2.2.0';
export const BUILD_DATE = '2025-04-02';
export const VERSION_INFO = {
  major: 2,
  minor: 2,
  patch: 0,
  fullVersion: '2.2.0'
};

// Helper to get version string with optional formatting
export function getVersionString(format = 'full') {
  switch (format) {
    case 'v-prefix':
      return `v${VERSION}`;
    case 'semantic':
      return `${VERSION_INFO.major}.${VERSION_INFO.minor}.${VERSION_INFO.patch}`;
    case 'major-minor':
      return `${VERSION_INFO.major}.${VERSION_INFO.minor}`;
    default:
      return VERSION;
  }
}
