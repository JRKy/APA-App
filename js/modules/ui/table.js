// table.js - APA table functionality
import { getElevationClass, getElevationLabel } from '../core/config.js';
import { showNotification, makeAnnouncement } from '../core/utils.js';
import { getSatellites, removeSatellite } from '../data/satellites.js';
import { calculateElevation, calculateAzimuth } from '../calculations/angles.js';
import { clearVisualization, drawEquator, drawLine, removeLine } from '../calculations/visibility.js';
import { loadSortState, saveSortState } from '../data/storage.js';
import { eventBus } from '../core/events.js';

// Table state
let sortState = { column: null, direction: 'none' };

/**
 * Initialize APA table functionality
 */
export function initTable() {
  const apaTableBody = document.querySelector("#apa-table tbody");
  const apaTableHeaders = document.querySelectorAll("#apa-table th");
  
  if (!apaTableBody || !apaTableHeaders) return;
  
  // Load saved sort state
  sortState = loadSortState();
  
  // Set up sortable columns
  setupTableSorting(apaTableHeaders);
  
  // Set up keyboard navigation for the table
  setupKeyboardNavigation(apaTableBody);
  
  // Initialize export button
  initExportButton();
  
  // Listen for satellite updates
  eventBus.subscribe('satellitesUpdated', () => {
    const lastLocation = document.getElementById('current-location-indicator');
    if (lastLocation && !lastLocation.classList.contains('hidden')) {
      // We have an active location, update the table
      const dataLat = document.querySelector("input[type=checkbox][data-lat]")?.dataset.lat;
      const dataLon = document.querySelector("input[type=checkbox][data-lon]")?.dataset.lon;
      
      if (dataLat && dataLon) {
        updateApaTable(parseFloat(dataLat), parseFloat(dataLon));
      }
    }
  });
}

/**
 * Update the APA table with satellite data for a location
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 */
export function updateApaTable(lat, lon) {
  const apaTableBody = document.querySelector("#apa-table tbody");
  const noResultsMessage = document.getElementById("apa-no-results");
  
  if (!apaTableBody) return;
  
  // Clear table
  apaTableBody.innerHTML = "";
  
  // Clear visualization layers
  clearVisualization();
  
  // Get satellites
  const satellites = getSatellites();
  let count = 0;
  
  // Create orbit line for equator
  drawEquator();
  
  // Add rows for each satellite
  satellites.forEach((sat, idx) => {
    const az = calculateAzimuth(lat, lon, sat.longitude).toFixed(1);
    const el = calculateElevation(lat, lon, sat.longitude).toFixed(1);
    const elNum = parseFloat(el);
    const isNegative = elNum < 0;
    const id = `sat-${idx}`;
    const elClass = getElevationClass(elNum);
    const qualityLabel = getElevationLabel(elNum);
    
    // Create table row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <label class="toggle-switch">
          <input type="checkbox" id="${id}" data-lat="${lat}" data-lon="${lon}" data-satlon="${sat.longitude}" data-name="${sat.name}" ${isNegative ? "" : "checked"}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td class="satellite-name" data-satellite-id="${idx}">${sat.name}</td>
      <td>${sat.longitude.toFixed(1)}°</td>
      <td class="${elClass}">${el}° <span class="quality-badge">${qualityLabel}</span></td>
      <td>${az}°</td>
      <td class="actions-cell">
        ${sat.custom ? 
          `<button class="delete-sat" data-name="${sat.name}" title="Delete Satellite">
             <span class="material-icons-round">delete</span>
           </button>` 
          : ""}
      </td>`;
    
    apaTableBody.appendChild(row);
    count++;
  });
  
  // Show/hide no results message
  if (noResultsMessage) {
    noResultsMessage.classList.toggle("hidden", count > 0);
  }
  
  // Add event listeners for delete buttons
  apaTableBody.querySelectorAll(".delete-sat").forEach(btn => {
    btn.addEventListener("click", () => handleDeleteSatellite(btn));
  });
  
  // Add event listeners for visibility toggles
  apaTableBody.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", function() {
      handleVisibilityToggle(this);
    });
  });
  
  // Add event listeners for satellite name clicks
  apaTableBody.querySelectorAll(".satellite-name").forEach(cell => {
    cell.addEventListener("click", function() {
      const satId = parseInt(this.dataset.satelliteId);
      const satellite = satellites[satId];
      
      if (satellite) {
        // Publish event
        eventBus.publish('satelliteSelected', {
          satellite,
          lat,
          lon
        });
      }
    });
  });
  
  // Trigger change event to draw lines for checked satellites
  apaTableBody.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
    cb.dispatchEvent(new Event("change"));
  });
  
  // Apply sorting if active
  if (sortState.column !== null && sortState.direction !== 'none') {
    sortTable(sortState.column, sortState.direction);
  }
  
  // Calculate accessibility announcement data
  const visibleSats = satellites.filter(sat => {
    const el = calculateElevation(lat, lon, sat.longitude);
    return el >= 0;
  }).length;
  
  // Create meaningful announcement
  const announcement = `APA data updated for ${count} satellites. ${visibleSats} satellites are visible from current location.`;
  
  // Use the existing makeAnnouncement utility
  makeAnnouncement(announcement, 'polite', 2000);
}

/**
 * Handle satellite deletion
 * @param {HTMLElement} button - Delete button element
 */
function handleDeleteSatellite(button) {
  const name = button.dataset.name;
  
  // Confirm deletion
  if (confirm(`Are you sure you want to delete satellite "${name}"?`)) {
    const result = removeSatellite(name);
    
    if (result.success) {
      // Find the lat/lon from any checkbox to update the table
      const checkbox = document.querySelector("input[type=checkbox][data-lat]");
      if (checkbox) {
        const lat = parseFloat(checkbox.dataset.lat);
        const lon = parseFloat(checkbox.dataset.lon);
        updateApaTable(lat, lon);
      }
      
      showNotification(result.message, "info");
    }
  }
}

/**
 * Handle satellite visibility toggle
 * @param {HTMLElement} checkbox - Checkbox element
 */
function handleVisibilityToggle(checkbox) {
  const id = checkbox.id;
  const lat = parseFloat(checkbox.dataset.lat);
  const lon = parseFloat(checkbox.dataset.lon);
  const satLon = parseFloat(checkbox.dataset.satlon);
  const name = checkbox.dataset.name;
  
  // Remove existing line
  removeLine(id);
  
  // If checked, draw the line
  if (checkbox.checked) {
    const el = calculateElevation(lat, lon, satLon);
    drawLine(lat, lon, satLon, name, el, id);
  }
  
  // Publish event
  eventBus.publish('satelliteVisibilityChanged', {
    id,
    name,
    visible: checkbox.checked
  });
}

/**
 * Set up sortable table columns
 * @param {NodeList} headers - Table header elements
 */
function setupTableSorting(headers) {
  headers.forEach((header, index) => {
    // Skip first column (checkbox) and last column (actions)
    if (index === 0 || index === headers.length - 1) return;
    
    header.classList.add('sortable');
    header.title = 'Click to sort';
    header.dataset.sortDir = 'none';
    header.dataset.columnIdx = index.toString();
    
    // Apply saved sort state if it exists
    if (sortState.column === index) {
      header.dataset.sortDir = sortState.direction;
      header.classList.toggle('sort-asc', sortState.direction === 'asc');
      header.classList.toggle('sort-desc', sortState.direction === 'desc');
    }
    
    header.addEventListener('click', () => {
      // Get current and new sort direction
      const sortDir = header.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      
      // Update header states
      headers.forEach(h => {
        if (h !== header) {
          h.dataset.sortDir = 'none';
          h.classList.remove('sort-asc', 'sort-desc');
        }
      });
      
      header.dataset.sortDir = sortDir;
      header.classList.toggle('sort-asc', sortDir === 'asc');
      header.classList.toggle('sort-desc', sortDir === 'desc');
      
      // Save sort state
      sortState = { column: index, direction: sortDir };
      saveSortState(index, sortDir);
      
      // Sort the table
      sortTable(index, sortDir);
      
      // Announce sorting for screen readers
      makeAnnouncement(`Table sorted by ${header.textContent} in ${sortDir === 'asc' ? 'ascending' : 'descending'} order`, 'polite');
    });
  });
}

/**
 * Sort the table
 * @param {number} columnIndex - Column index to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 */
export function sortTable(columnIndex, direction) {
  const apaTableBody = document.querySelector("#apa-table tbody");
  if (!apaTableBody) return;
  
  const rows = Array.from(apaTableBody.querySelectorAll('tr'));
  
  const sortedRows = rows.sort((a, b) => {
    let aVal = a.cells[columnIndex].textContent.trim();
    let bVal = b.cells[columnIndex].textContent.trim();
    
    // If we're sorting the satellite name column (index 1)
    if (columnIndex === 1) {
      // Use string comparison for alphabetical sorting
      if (direction === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    } else {
      // For other columns, extract numeric values if they exist
      const aMatch = aVal.match(/(-?\d+\.?\d*)/);
      const bMatch = bVal.match(/(-?\d+\.?\d*)/);
      
      if (aMatch && bMatch) {
        // Numeric sorting
        aVal = parseFloat(aMatch[0]);
        bVal = parseFloat(bMatch[0]);
      } else {
        // Remove any quality badges for text comparison
        aVal = aVal.replace(/\s*\([^)]*\)/g, '');
        bVal = bVal.replace(/\s*\([^)]*\)/g, '');
      }
      
      // Determine sort order
      if (direction === 'asc') {
        return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
      } else {
        return aVal < bVal ? 1 : (aVal > bVal ? -1 : 0);
      }
    }
  });
  
  // Clear and re-append in sorted order
  while (apaTableBody.firstChild) {
    apaTableBody.removeChild(apaTableBody.firstChild);
  }
  
  sortedRows.forEach(row => apaTableBody.appendChild(row));
}

/**
 * Set up keyboard navigation for the table
 * @param {HTMLElement} tableBody - Table body element
 */
function setupKeyboardNavigation(tableBody) {
  if (!tableBody) return;
  
  tableBody.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    const currentCell = document.activeElement.closest('td');
    if (!currentCell) return;
    
    const currentRow = currentCell.parentElement;
    const rows = Array.from(tableBody.rows);
    const rowIndex = rows.indexOf(currentRow);
    const cellIndex = Array.from(currentRow.cells).indexOf(currentCell);
    
    let targetCell;
    
    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          targetCell = rows[rowIndex - 1].cells[cellIndex];
        }
        break;
      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          targetCell = rows[rowIndex + 1].cells[cellIndex];
        }
        break;
      case 'ArrowLeft':
        if (cellIndex > 0) {
          targetCell = currentRow.cells[cellIndex - 1];
        }
        break;
      case 'ArrowRight':
        if (cellIndex < currentRow.cells.length - 1) {
          targetCell = currentRow.cells[cellIndex + 1];
        }
        break;
    }
    
    if (targetCell) {
      const focusableElement = targetCell.querySelector('button, input') || targetCell;
      focusableElement.focus();
      e.preventDefault();
    }
  });
}

/**
 * Export APA data to a file
 * @param {string} format - Export format ('csv' or 'pdf')
 */
export function exportApaData(format = 'csv') {
  const apaTableBody = document.querySelector("#apa-table tbody");
  if (!apaTableBody || !apaTableBody.rows.length) {
    showNotification("No data to export. Please select a location first.", "error");
    return;
  }
  
  const locationLabel = document.getElementById("current-location-indicator")?.textContent.trim() || "Custom Location";
  const rows = Array.from(apaTableBody.rows);
  
  if (format === 'csv') {
    // Headers for CSV (excluding checkbox and actions columns)
    const headers = ["Satellite", "Longitude", "Elevation", "Azimuth", "Visible"];
    
    // Extract data from table rows
    const data = rows.map(row => {
      const visible = row.querySelector('input[type=checkbox]').checked ? "Yes" : "No";
      const name = row.cells[1].textContent.trim();
      // Remove degree symbol and any non-numeric characters except decimal point and minus sign
      const longitude = row.cells[2].textContent.trim().replace(/[^-\d.]/g, '');
      const elevation = row.cells[3].textContent.trim().split(' ')[0].replace(/[^-\d.]/g, ''); // Remove quality badge text and degree symbol
      const azimuth = row.cells[4].textContent.trim().replace(/[^-\d.]/g, '');
      
      return [
        `"${name}"`, // Quote satellite names in case they contain commas
        longitude,
        elevation,
        azimuth,
        visible
      ];
    });
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n");
    
    // Format date for filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `APA_Data_${locationLabel.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.csv`;
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Data exported successfully as CSV", "success");
  } else if (format === 'pdf') {
    // PDF export would require a PDF generation library
    showNotification("PDF export coming soon", "info");
  }
}

/**
 * Initialize the export button
 */
export function initExportButton() {
  const panelControls = document.querySelector('.panel-controls');
  if (!panelControls) return;
  
  // Check if button already exists
  if (document.getElementById('export-apa-data')) return;
  
  const exportButton = document.createElement('button');
  exportButton.id = 'export-apa-data';
  exportButton.title = 'Export Data';
  exportButton.setAttribute('aria-label', 'Export APA data as CSV');
  exportButton.innerHTML = '<span class="material-icons-round">download</span>';
  exportButton.classList.add('panel-control-btn');
  
  exportButton.addEventListener('click', () => {
    // Export as CSV
    exportApaData('csv');
  });
  
  // Add button to panel controls
  panelControls.insertBefore(exportButton, panelControls.firstChild);
}
