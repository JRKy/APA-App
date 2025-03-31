# APA App (Antenna Pointing Angles)

A Progressive Web App (PWA) for calculating and visualizing antenna pointing angles to geostationary satellites from any location.

## 🌍 Features

- Interactive Leaflet map with OpenStreetMap base layers
- Satellite position visualization with azimuth and elevation calculation
- Color-coded APA lines and visibility indicators
- Toggleable satellite visibility and interactive polar plot
- Location filtering by AOR and Country
- Support for custom locations and satellites
- Responsive, accessible UI (WCAG 2.1 AA compliant)
- Offline support with Service Worker
- Draggable APA table panel with persistent layout and sorting
- Dark mode with optimized map layers
- Interactive tutorial and help system

## 🆕 What's New in v1.9.0

- Enhanced keyboard navigation for all components
- Improved WAI-ARIA support for screen readers
- Smoother transitions between views
- Expanded step-by-step tutorial
- Optimized map rendering for better performance
- Enhanced mobile experience with better panel layout
- Improved dark mode contrast for better accessibility

## 📱 PWA Features

- Installable to home screen (Android, iOS, desktop)
- Offline fallback support (`sw.js`)
- App manifest with icons and configuration
- Version-based cache management

## 🛠️ Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js for maps and overlays
- OpenStreetMap and additional map tile providers
- PWA standards: Service Worker, manifest.json
- Responsive design with mobile-first approach

## 🚀 Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/APA-App.git
cd APA-App
# Serve with any static server
npx serve .
