// commandRegions.js - Combatant Command geographic boundaries
// Version 2.3.0

export const COMMAND_REGIONS = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "USNORTHCOM",
        "color": "#9c27b0",
        "description": "United States Northern Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-168.0, 71.0],
            [-168.0, 24.0],
            [-52.0, 24.0],
            [-52.0, 71.0],
            [-168.0, 71.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "USSOUTHCOM",
        "color": "#ffeb3b",
        "description": "United States Southern Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-120.0, 24.0],
            [-120.0, -60.0],
            [-30.0, -60.0],
            [-30.0, 24.0],
            [-120.0, 24.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "USEUCOM",
        "color": "#2196f3",
        "description": "United States European Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-30.0, 71.0],
            [-30.0, 35.0],
            [50.0, 35.0],
            [50.0, 71.0],
            [-30.0, 71.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "USAFRICOM",
        "color": "#ff9800",
        "description": "United States Africa Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-20.0, 35.0],
            [-20.0, -35.0],
            [50.0, -35.0],
            [50.0, 35.0],
            [-20.0, 35.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "USCENTCOM",
        "color": "#ff5722",
        "description": "United States Central Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [30.0, 40.0],
            [30.0, 5.0],
            [80.0, 5.0],
            [80.0, 40.0],
            [30.0, 40.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "USINDOPACOM",
        "color": "#4caf50",
        "description": "United States Indo-Pacific Command"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [50.0, 60.0],
            [50.0, -50.0],
            [150.0, -50.0],
            [150.0, 60.0],
            [50.0, 60.0]
          ]
        ]
      }
    }
  ]
};

// Get a command region by name
export function getCommandRegion(name) {
  if (!name) return null;
  
  const feature = COMMAND_REGIONS.features.find(f => 
    f.properties.name === name || 
    f.properties.name === `US${name}` || // Handle with or without "US" prefix
    f.properties.description.includes(name)
  );
  
  return feature || null;
}

// Get all command region names
export function getCommandNames() {
  return COMMAND_REGIONS.features.map(f => f.properties.name);
}

console.log(`Command Regions Loaded: ${COMMAND_REGIONS.features.length} regions`);
