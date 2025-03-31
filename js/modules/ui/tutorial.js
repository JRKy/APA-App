// tutorial.js - Tutorial system
import { TUTORIAL_STEPS } from '../core/config.js';
import { saveTutorialCompleted } from '../data/storage.js';
import { eventBus } from '../core/events.js';

// Tutorial state
let tutorialStep = 1;

/**
 * Initialize the tutorial system
 */
export function initTutorial() {
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  const tutorialContent = document.getElementById("tutorial-content");
  const tutorialPrev = document.getElementById("tutorial-prev");
  const tutorialNext = document.getElementById("tutorial-next");
  const tutorialProgress = document.getElementById("tutorial-progress");
  
  if (!tutorialOverlay || !tutorialContent || !tutorialPrev || !tutorialNext || !tutorialProgress) return;
  
  // Set up event handlers for tutorial navigation
  tutorialPrev.addEventListener("click", () => {
    if (tutorialStep > 1) {
      tutorialStep--;
      updateTutorial();
    }
  });

  tutorialNext.addEventListener("click", () => {
    if (tutorialStep < TUTORIAL_STEPS.length) {
      tutorialStep++;
      updateTutorial();
    } else {
      // End of tutorial
      tutorialOverlay.classList.add("hidden");
      saveTutorialCompleted(true);
      
      // Publish event
      eventBus.publish('tutorialCompleted');
    }
  });
}

/**
 * Start the tutorial
 */
export function showTutorial() {
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  if (!tutorialOverlay) return;
  
  tutorialStep = 1;
  tutorialOverlay.classList.remove('hidden');
  updateTutorial();
  
  // Publish event
  eventBus.publish('tutorialStarted');
}

/**
 * Update the tutorial content based on current step
 */
function updateTutorial() {
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  const tutorialContent = document.getElementById("tutorial-content");
  const tutorialPrev = document.getElementById("tutorial-prev");
  const tutorialNext = document.getElementById("tutorial-next");
  const tutorialProgress = document.getElementById("tutorial-progress");
  
  if (!tutorialOverlay || !tutorialContent || !tutorialPrev || !tutorialNext || !tutorialProgress) return;
  
  // Get current step
  const step = TUTORIAL_STEPS[tutorialStep - 1];
  if (!step) return;
  
  // Update content
  document.querySelector('.tutorial-header').textContent = step.title;
  tutorialContent.textContent = step.content;
  
  // Update progress indicator
  tutorialProgress.textContent = `${tutorialStep}/${TUTORIAL_STEPS.length}`;
  
  // Enable/disable previous button
  tutorialPrev.disabled = tutorialStep <= 1;
  
  // Update next button text
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    tutorialNext.textContent = 'Finish';
  } else {
    tutorialNext.textContent = 'Next';
  }
  
  // Add highlight if specified
  if (step.highlight) {
    highlightElement(step.highlight);
  } else {
    removeHighlight();
  }
}

/**
 * Highlight an element in the tutorial
 * @param {string} elementId - ID of the element to highlight
 */
function highlightElement(elementId) {
  removeHighlight();
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  
  const highlight = document.createElement('div');
  highlight.className = 'tutorial-highlight';
  highlight.style.top = rect.top + 'px';
  highlight.style.left = rect.left + 'px';
  highlight.style.width = rect.width + 'px';
  highlight.style.height = rect.height + 'px';
  
  document.body.appendChild(highlight);
}

/**
 * Remove tutorial highlight
 */
function removeHighlight() {
  const existingHighlight = document.querySelector('.tutorial-highlight');
  if (existingHighlight) {
    existingHighlight.remove();
  }
}