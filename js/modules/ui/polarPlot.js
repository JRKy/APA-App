// polarPlot.js - Polar plot visualization
import { getSatellites } from '../data/satellites.js';
import { calculatePolarCoordinates } from '../calculations/angles.js';
import { savePolarPlotVisible } from '../data/storage.js';
import { eventBus } from '../core/events.js';

/**
 * Initialize the polar plot
 */
export function initPolarPlot() {
  const polarPlot = document.getElementById("polar-plot");
  
  if (!polarPlot) return;
  
  // Clear any existing elements
  while (polarPlot.firstChild) {
    polarPlot.removeChild(polarPlot.firstChild);
  }
  
  // Draw background circles
  const circles = [0.2, 0.4, 0.6, 0.8];
  circles.forEach(radius => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "100");
    circle.setAttribute("cy", "100");
    circle.setAttribute("r", (radius * 100).toString());
    circle.setAttribute("class", "polar-plot-circle");
    polarPlot.appendChild(circle);
  });
  
  // Draw center point
  const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  center.setAttribute("cx", "100");
  center.setAttribute("cy", "100");
  center.setAttribute("r", "2");
  center.setAttribute("fill", "var(--color-text-secondary)");
  polarPlot.appendChild(center);
  
  // Draw cardinal directions
  const directions = [
    { angle: 0, label: "E" },
    { angle: 90, label: "S" },
    { angle: 180, label: "W" },
    { angle: 270, label: "N" }
  ];
  
  directions.forEach(dir => {
    // Draw line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const x = 100 + 100 * Math.cos(dir.angle * Math.PI / 180);
    const y = 100 + 100 * Math.sin(dir.angle * Math.PI / 180);
    line.setAttribute("x1", "100");
    line.setAttribute("y1", "100");
    line.setAttribute("x2", x.toString());
    line.setAttribute("y2", y.toString());
    line.setAttribute("class", "polar-plot-line");
    polarPlot.appendChild(line);
    
    // Add label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const labelX = 100 + 110 * Math.cos(dir.angle * Math.PI / 180);
    const labelY = 100 + 110 * Math.sin(dir.angle * Math.PI / 180);
    label.setAttribute("x", labelX.toString());
    label.setAttribute("y", labelY.toString());
    label.setAttribute("class", "polar-plot-label");
    label.textContent = dir.label;
    polarPlot.appendChild(label);
  });
  
  // Add elevation labels
  const elevations = [
    { radius: 0.2, label: "80°" },
    { radius: 0.4, label: "60°" },
    { radius: 0.6, label: "40°" },
    { radius: 0.8, label: "20°" },
    { radius: 0.95, label: "0°" }
  ];
  
  elevations.forEach(el => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "100");
    label.setAttribute("y", (100 - el.radius * 100 - 5).toString());
    label.setAttribute("class", "polar-plot-label");
    label.setAttribute("text-anchor", "middle");
    label.textContent = el.label;
    polarPlot.appendChild(label);
  });
  
  // Add title
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", "100");
  title.setAttribute("y", "15");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-weight", "bold");
  title.setAttribute("font-size", "12px");
  title.textContent = "Satellite Polar View";
  polarPlot.appendChild(title);
  
  // Set up toggle button handler
  const toggleButton = document.getElementById("toggle-polar-plot");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => togglePolarPlotVisibility());
  }
  
  // Subscribe to location changes
  eventBus.subscribe('locationChanged', (data) => {
    if (!isPolarPlotHidden()) {
      updatePolarPlot(data.lat, data.lon);
    }
  });
}

/**
 * Toggle the polar plot visibility
 * @param {boolean} [visible] - Force visibility state
 */
export function togglePolarPlotVisibility(visible) {
  const polarPlotContainer = document.getElementById("polar-plot-container");
  if (!polarPlotContainer) return;
  
  // If visible is provided, set that state, otherwise toggle
  if (visible !== undefined) {
    polarPlotContainer.classList.toggle("hidden", !visible);
  } else {
    polarPlotContainer.classList.toggle("hidden");
  }
  
  // Save state
  const isVisible = !polarPlotContainer.classList.contains("hidden");
  savePolarPlotVisible(isVisible);
  
  // If now visible, update if we have a location
  if (isVisible) {
    const checkbox = document.querySelector("input[type=checkbox][data-lat]");
    if (checkbox) {
      const lat = parseFloat(checkbox.dataset.lat);
      const lon = parseFloat(checkbox.dataset.lon);
      updatePolarPlot(lat, lon);
    }
  }
  
  // Publish event
  eventBus.publish('polarPlotVisibilityChanged', isVisible);
}

/**
 * Check if the polar plot is hidden
 * @returns {boolean} True if the polar plot is hidden
 */
export function isPolarPlotHidden() {
  const polarPlotContainer = document.getElementById("polar-plot-container");
  return !polarPlotContainer || polarPlotContainer.classList.contains("hidden");
}

/**
 * Update the polar plot with satellite data
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 */
export function updatePolarPlot(lat, lon) {
  const polarPlot = document.getElementById("polar-plot");
  if (!polarPlot) return;
  
  // Remove existing satellite dots
  const existingDots = polarPlot.querySelectorAll(".polar-plot-satellite, .polar-plot-satellite-below");
  existingDots.forEach(dot => dot.remove());
  
  // Get satellites and calculate polar coordinates
  const satellites = getSatellites();
  const polarData = calculatePolarCoordinates(lat, lon, satellites);
  
  // Add dots for each satellite
  polarData.forEach(sat => {
    // Skip if extremely low elevation (below horizon)
    if (sat.elevation < -10) return;
    
    // Calculate position (convert from -1 to 1 range to 0-200 SVG coordinates)
    const x = 100 + sat.polarX * 100;
    const y = 100 + sat.polarY * 100;
    
    // Create dot
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x.toString());
    dot.setAttribute("cy", y.toString());
    dot.setAttribute("r", "4");
    dot.setAttribute("class", sat.isVisible ? "polar-plot-satellite" : "polar-plot-satellite-below");
    
    // Add satellite name as title (tooltip)
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${sat.name}: ${sat.elevation.toFixed(1)}° elevation`;
    dot.appendChild(title);
    
    polarPlot.appendChild(dot);
    
    // Add event listener for dot clicks
    dot.addEventListener('click', () => {
      // Publish satellite selection event
      eventBus.publish('satelliteSelected', {
        satellite: sat,
        lat,
        lon
      });
    });
  });
}