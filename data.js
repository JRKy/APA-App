const SATELLITES = [
    { name: "ALT-3", longitude: -150 },
    { name: "MUOS-4", longitude: -100 },
    { name: "WGS-10", longitude: -45 },
    { name: "AEHF-6", longitude: 5 },
    { name: "SES-20", longitude: 60 },
    { name: "INTELSAT-39", longitude: 105 }
];

const LOCATIONS = [
    { name: "Busan", latitude: 35.1796, longitude: 129.0756 },
    { name: "Cape Canaveral", latitude: 28.3922, longitude: -80.6077 },
    { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
    { name: "London", latitude: 51.5074, longitude: -0.1278 },
    { name: "Sydney", latitude: -33.8688, longitude: 151.2093 }
];

console.log(`Data Loaded: ${SATELLITES.length} satellites, ${LOCATIONS.length} locations`);
