// Create this file at: tools/version-injector.js

const fs = require('fs');
const path = require('path');

// Import the version (need to modify the path for Node.js)
// Note: We'll extract just the version string to avoid ES module imports
const versionFilePath = path.join(__dirname, '../js/modules/core/version.js');
const versionContent = fs.readFileSync(versionFilePath, 'utf8');
const VERSION = versionContent.match(/VERSION = ['"]([^'"]+)['"]/)[1];

console.log(`Injecting version ${VERSION} into static files...`);

// Files to process with their replacements
const files = [
  {
    path: 'index.html',
    replacements: [
      { pattern: /Version: [0-9.]+<\/span>/g, replacement: `Version: ${VERSION}</span>` },
      { pattern: /styles\.css\?v=[0-9.]+/g, replacement: `styles.css?v=${VERSION}` },
      { pattern: /main\.js\?v=[0-9.]+/g, replacement: `main.js?v=${VERSION}` },
      { pattern: /sw\.js\?v=[0-9.]+/g, replacement: `sw.js?v=${VERSION}` },
      { pattern: /data\.js\?v=[0-9.]+/g, replacement: `data.js?v=${VERSION}` }
    ]
  },
  {
    path: 'manifest.json',
    replacements: [
      { pattern: /"version": "[0-9.]+"/g, replacement: `"version": "${VERSION}"` }
    ]
  },
  {
    path: 'sw.js',
    replacements: [
      { pattern: /CACHE_NAME = "apa-app-cache-v[0-9.]+"/g, replacement: `CACHE_NAME = "apa-app-cache-v${VERSION}"` },
      { pattern: /console\.log\("Installed SW Version: v[0-9.]+"\)/g, replacement: `console.log("Installed SW Version: v${VERSION}")` }
    ]
  },
  {
    path: 'styles.css',
    replacements: [
      { pattern: /\/\* APA App Styles - v[0-9.]+ \*\//g, replacement: `/* APA App Styles - v${VERSION} */` }
    ]
  },
  {
    path: 'offline.html',
    replacements: [
      { pattern: /App Version: [0-9.]+<\/div>/g, replacement: `App Version: ${VERSION}</div>` }
    ]
  }
];

// Process each file
files.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);
  
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Apply all replacements
    file.replacements.forEach(({ pattern, replacement }) => {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      
      if (content !== originalContent) {
        changed = true;
      }
    });
    
    if (changed) {
      // Write the updated content back
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated version in ${file.path}`);
    } else {
      console.log(`ℹ️ No version changes needed in ${file.path}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file.path}:`, error.message);
  }
});

console.log('Version injection complete!');
