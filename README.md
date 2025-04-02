# 📡 APA App (Antenna Pointing Angles)

A Progressive Web App (PWA) for calculating and visualizing antenna pointing angles to geostationary satellites from any location.

## 🌍 Features

- Interactive Leaflet map with OpenStreetMap base layers  
- Location search with geocoding capability (address, city, landmark)
- Satellite position visualization with azimuth and elevation calculation  
- Color-coded APA lines and visibility indicators  
- Toggleable satellite visibility and interactive polar plot  
- Location filtering by AOR and Country  
- Advanced satellite filtering options (elevation, type, visibility)
- Support for custom locations and satellites  
- Exportable data (CSV) for further analysis
- Responsive, accessible UI (WCAG 2.1 AA compliant)  
- Offline support with Service Worker  
- Draggable APA table panel with persistent layout and sorting  
- Dark mode with optimized map layers  
- Interactive tutorial and help system  

## 🆕 What's New in v2.3.0

- Location search functionality with geocoder
- Search for locations by address, city, landmark, or coordinates
- Improved mobile UI with optimized layouts
- Enhanced positioning for APA panel toggle button
- Fixed UI element overlapping issues on mobile
- Improved keyboard navigation for search fields

## 🆕 What's New in v2.2.0

- Enhanced offline support with more comprehensive caching strategy
- Improved error handling for geolocation and satellite data
- Support for custom satellite orbit types
- New color-coded tooltips for satellite details
- Expanded export preparation (groundwork for PDF export)
- Optimized map rendering and satellite line calculations
- Refined tutorial step-by-step guidance
- Performance improvements for large satellite datasets
- Mobile responsiveness enhancements

## 🆕 What's New in v2.1.0

- ARIA live regions for better accessibility
- CSV export functionality for APA data
- Advanced satellite filtering options
- Enhanced user experience with improved notifications

## 📱 PWA Features

- Installable to home screen (Android, iOS, desktop)  
- Offline fallback support (`sw.js`)  
- App manifest with icons and configuration  
- Version-based cache management  

## 🛠️ Technologies

- HTML5, CSS3, JavaScript (Vanilla)  
- Leaflet.js for maps and overlays  
- OpenStreetMap and additional map tile providers  
- Nominatim geocoding for location search
- PWA standards: Service Worker, manifest.json  
- Responsive design with mobile-first approach  

## 🚀 Getting Started

```bash
git clone https://github.com/JRKy/apa-app.git
cd APA-App
# Serve with any static server
npx serve .
```

Or simply open `index.html` directly for local development.

## ♿ Accessibility

- Follows WCAG 2.1 AA standards  
- Semantic HTML and keyboard-navigable components  
- High-contrast visual styles and ARIA roles  
- Screen reader compatibility  
- Responsive touch targets for mobile use  
- Color-coded indicators with text alternatives  

## 📄 License

This project is licensed under the [MIT License](https://github.com/JRKy/apa-app/blob/main/LICENSE).  
© JRKy — SPDX-License-Identifier: MIT
