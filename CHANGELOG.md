## [2.3.0] - 2025-04-02

### Added
- Location search feature with geocoder functionality
- Search by address, city, landmark, or coordinates
- Improved mobile UI for panels and buttons
- Fixed global satellite coverage across the 180/-180 longitude boundary

### Changed
- Repositioned APA panel toggle button to prevent overlap with help button
- Enhanced mobile responsive layout for APA table button
- Optimized search input field for better usability
- Improved satellite visibility calculation for global coverage

### Fixed
- Resolved UI overlap issues on smaller screens
- Fixed full-width button issue on mobile devices
- Improved keyboard navigation for search fields
- Fixed satellite visibility calculations at the International Date Line

## [2.2.0] - 2025-04-02

### Added
- Enhanced offline support with more comprehensive caching strategy
- Improved error handling for geolocation and satellite data
- Support for custom satellite orbit types
- New color-coded tooltips for satellite details
- Export functionality expanded (preparation for PDF export)

### Changed
- Optimized map rendering and satellite line calculations
- Improved accessibility across all components
- Enhanced mobile responsiveness for bottom sheet behavior
- Refined tutorial step-by-step guidance

### Fixed
- Performance improvements for large satellite datasets
- Resolved minor UI inconsistencies in dark mode
- Improved keyboard navigation across drawers and panels
- Geolocation error handling refinements

### Removed
- Deprecated legacy code in filtering and calculation modules

## [2.1.1] - 2025-04-01

### Changed
- Split filter functionality into separate location and satellite filter buttons
- Enhanced UI with distinct icons for location and satellite filtering
- Improved user experience with more focused filter options

## [2.1.0] - 2025-03-31

### Added
- ARIA live regions for accessibility announcements
- CSV export functionality for APA data
- Advanced satellite filtering options
  - Filter by minimum elevation
  - Filter by satellite type (predefined/custom)
  - Filter by longitude range
  - Filter by visibility
  
### Changed
- Enhanced filter drawer with advanced satellite filtering section
- Updated APA panel with export button

## [2.0.0] - 2025-03-30

### Added
- Modular code architecture for better maintainability
- Event bus system for component communication
- Enhanced error handling throughout the application

### Changed
- Restructured entire codebase into logical modules
- Improved geolocation error handling with specific messages
- Organized code into core, data, UI, and calculations modules

### Fixed
- APA panel resize behavior on mobile devices
- Location button functionality issues
- Various minor bugs and performance optimizations

## [1.9.0] - 2025-03-30

### Added
- Keyboard navigation for APA table and controls
- Enhanced WAI-ARIA support for better screen reader compatibility
- Smoother transitions between views
- Expanded tutorial with step-by-step guidance

### Changed
- Updated version references to v1.9.0 across all files
- Improved mobile layout for better usability on smaller screens
- Optimized map redraws (debounced on zoom/pan)
- Enhanced dark mode contrast for better accessibility

### Fixed
- Polar plot disappearing on some location changes
- APA panel resize behavior on mobile devices
- Inconsistent satellite highlighting across map views

## [1.8.0] - 2025-03-30

### Added
- Sticky APA table header
- Close buttons on all drawers
- Exclusive drawer toggle behavior (only one drawer opens at a time)

### Changed
- Updated version references to v1.8.0 across all files
- Refined APA panel spacing for improved mobile usability
- Cleaned up and synced FEATURES.md to match implemented functionality

### Fixed
- Overlapping drawer behavior on smaller screens
- Inconsistent APA panel positioning

# Changelog

All notable changes to this project will be documented in this file.

## [1.6.9.12] - 2025-03-23
### Fixed
- Toolbar buttons moved to avoid overlapping map zoom controls
- Version metadata updated in styles.css

## [1.6.9.11] - 2025-03-23
### Fixed
- locationSelect reference error
- AOR and Country dropdown logic now works correctly

## [1.6.9.10] - 2025-03-23
### Fixed
- Removed duplicate locationSelect definition
- Moved filtering logic to safe scope

## [1.6.9.9] - 2025-03-23
### Added
- Initial persistent APA table and satellite plot fixes
