// panels.js - Panel UI management
import { loadPanelPosition, savePanelPosition, loadPanelMinimized, savePanelMinimized } from '../data/storage.js';
import { isMobileDevice } from '../core/utils.js';
import { eventBus } from '../core/events.js';

let isDragging = false;
let dragOffsetX, dragOffsetY;

/**
 * Initialize APA panel and controls
 */
export function initPanels() {
  const apaPanel = document.getElementById("apa-panel");
  const apaPanelHeader = document.querySelector('.apa-panel-header');
  const closePanelBtn = document.getElementById("close-apa-panel");
  const minimizePanelBtn = document.getElementById("minimize-apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  
  if (!apaPanel || !apaPanelHeader) return;
  
  // Restore panel position from localStorage
  const savedPosition = loadPanelPosition();
  if (savedPosition && !isMobileDevice()) {
    try {
      apaPanel.style.top = savedPosition.top;
      apaPanel.style.left = savedPosition.left;
      apaPanel.style.right = 'auto';
    } catch (e) {
      console.error('Failed to restore panel position:', e);
    }
  }
  
  // Restore minimized state
  if (loadPanelMinimized()) {
    apaPanel.classList.add("minimized");
    if (minimizePanelBtn) {
      minimizePanelBtn.querySelector(".material-icons-round").textContent = "expand_less";
    }
  }
  
  // Setup panel controls
  if (closePanelBtn) {
    closePanelBtn.addEventListener("click", () => {
      apaPanel.style.display = "none";
      if (toggleApaBtn) toggleApaBtn.style.display = "flex";
    });
  }
  
  if (minimizePanelBtn) {
    minimizePanelBtn.addEventListener("click", togglePanelMinimized);
  }
  
  if (toggleApaBtn) {
    toggleApaBtn.addEventListener("click", () => {
      apaPanel.style.display = "block";
      toggleApaBtn.style.display = "none";
    });
  }
  
  // Setup draggable functionality
  setupDraggablePanel(apaPanelHeader, apaPanel);
  
  // Handle mobile-specific features
  if (isMobileDevice()) {
    setupBottomSheet(apaPanel, apaPanelHeader);
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (isMobileDevice()) {
      setupBottomSheet(apaPanel, apaPanelHeader);
    }
  });
}

/**
 * Toggle the minimized state of the APA panel
 */
export function togglePanelMinimized() {
  const apaPanel = document.getElementById("apa-panel");
  const minimizePanelBtn = document.getElementById("minimize-apa-panel");
  
  if (!apaPanel || !minimizePanelBtn) return;
  
  apaPanel.classList.toggle("minimized");
  const isMinimized = apaPanel.classList.contains("minimized");
  
  minimizePanelBtn.querySelector(".material-icons-round").textContent = isMinimized ? "expand_less" : "remove";
  minimizePanelBtn.setAttribute('aria-label', isMinimized ? "Expand APA panel" : "Minimize APA panel");
  
  savePanelMinimized(isMinimized);
  
  // Publish event for other components
  eventBus.publish('panelMinimizedChanged', isMinimized);
}

/**
 * Show the APA panel
 */
export function showApaPanel() {
  const apaPanel = document.getElementById("apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  
  if (apaPanel) apaPanel.style.display = "block";
  if (toggleApaBtn) toggleApaBtn.style.display = "none";
}

/**
 * Hide the APA panel
 */
export function hideApaPanel() {
  const apaPanel = document.getElementById("apa-panel");
  const toggleApaBtn = document.getElementById("toggle-apa-panel");
  
  if (apaPanel) apaPanel.style.display = "none";
  if (toggleApaBtn) toggleApaBtn.style.display = "flex";
}

/**
 * Setup draggable functionality for the panel
 * @param {HTMLElement} header - Panel header element
 * @param {HTMLElement} panel - Panel element
 */
function setupDraggablePanel(header, panel) {
  if (!header || !panel) return;
  
  // Mouse events for desktop
  header.addEventListener('mousedown', (e) => {
    // Skip if clicking on buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    isDragging = true;
    dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    header.style.cursor = 'grabbing';
    
    // Prevent text selection during dragging
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate new position
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;
    
    // Keep within screen boundaries
    newLeft = Math.max(0, Math.min(screenWidth - 100, newLeft));
    newTop = Math.max(0, Math.min(screenHeight - 100, newTop));
    
    // Update position
    panel.style.right = 'auto';
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    
    isDragging = false;
    header.style.cursor = 'grab';
    
    // Save panel position to localStorage
    savePanelPosition(panel.style.top, panel.style.left);
  });
  
  // Touch events for mobile
  header.addEventListener('touchstart', (e) => {
    // Skip if touching buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    isDragging = true;
    const touch = e.touches[0];
    dragOffsetX = touch.clientX - panel.getBoundingClientRect().left;
    dragOffsetY = touch.clientY - panel.getBoundingClientRect().top;
    
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    
    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate new position
    let newLeft = touch.clientX - dragOffsetX;
    let newTop = touch.clientY - dragOffsetY;
    
    // Keep within screen boundaries
    newLeft = Math.max(0, Math.min(screenWidth - 100, newLeft));
    newTop = Math.max(0, Math.min(screenHeight - 100, newTop));
    
    // Update position
    panel.style.right = 'auto';
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    
    e.preventDefault();
  });
  
  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Save panel position to localStorage
    savePanelPosition(panel.style.top, panel.style.left);
  });
}

/**
 * Setup mobile bottom sheet behavior
 * @param {HTMLElement} panel - Panel element
 * @param {HTMLElement} header - Panel header element
 */
function setupBottomSheet(panel, header) {
  if (!panel || !header) return;
  
  let startY, startHeight;
  
  // Reset position for mobile
  panel.style.left = '0';
  panel.style.right = '0';
  panel.style.bottom = '0';
  panel.style.top = 'auto';
  
  // Add swipe up/down gesture
  header.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startHeight = panel.offsetHeight;
  });
  
  header.addEventListener('touchmove', (e) => {
    const deltaY = startY - e.touches[0].clientY;
    const newHeight = Math.max(40, Math.min(window.innerHeight * 0.8, startHeight + deltaY));
    
    panel.style.height = newHeight + 'px';
    
    // If panel is being minimized
    if (newHeight <= 60) {
      panel.classList.add('minimized');
      const minimizeBtn = document.getElementById('minimize-apa-panel');
      if (minimizeBtn) {
        minimizeBtn.querySelector('.material-icons-round').textContent = 'expand_less';
      }
    } else {
      panel.classList.remove('minimized');
      const minimizeBtn = document.getElementById('minimize-apa-panel');
      if (minimizeBtn) {
        minimizeBtn.querySelector('.material-icons-round').textContent = 'remove';
      }
    }
  });
  
  header.addEventListener('touchend', () => {
    savePanelMinimized(panel.classList.contains('minimized'));
  });
}