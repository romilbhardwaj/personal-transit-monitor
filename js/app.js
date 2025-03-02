/**
 * Personal Transit Monitor
 * A modern, responsive application to track transit arrivals
 */

// Configuration
const config = {
  agency: 'SF', // Default agency code
  refreshInterval: 60000, // Refresh interval in milliseconds (1 minute)
  maxArrivalsToShow: 10, // Maximum number of arrivals to show per stop
};

// Customize stops here - no need to edit the rest of the code
const stopsAndLabels = [
  { label: "From home" },
  { label: "52 to Forest Hill", stopId: 14366 },
  { label: "52 to Glen Park", stopId: 14455 },
  { label: "From work going home" },
  { label: "Folsom & Embarcadero going west", stopId: 14510 },
  { label: "From nearby muni stations to home" },
  { label: "52 from Glen Park", stopId: 14388, line: "52" },
  { label: "52 from Forest Hill", stopId: 15247, line: "52" },
];

// Application state
const state = {
  lastUpdated: null,
  refreshTimer: null,
  isLoading: false,
  errors: new Map(), // Map of stopId to error message
};

/**
 * Initializes the application
 */
function initApp() {
  // Setup UI elements
  setupUI();
  
  // Start data fetch
  fetchAllTransitData();
  
  // Setup periodic refresh
  startAutoRefresh();
  
  // Setup event listeners
  document.getElementById('refresh-button').addEventListener('click', handleManualRefresh);
}

/**
 * Sets up the UI elements
 */
function setupUI() {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';
  
  // Create HTML for each stop
  stopsAndLabels.forEach(stop => {
    if (!stop.stopId) {
      // This is a section header
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'sectionLabel';
      sectionHeader.textContent = stop.label;
      resultsContainer.appendChild(sectionHeader);
      return;
    }
    
    // Create stop container
    const stopContainer = document.createElement('div');
    stopContainer.className = 'stop';
    
    // Stop label
    const stopLabel = document.createElement('div');
    stopLabel.className = 'stopLabel';
    stopLabel.textContent = stop.label;
    stopContainer.appendChild(stopLabel);
    
    // Create arrival times container
    const arrivalTimesContainer = document.createElement('div');
    arrivalTimesContainer.className = 'arrivalTimes';
    arrivalTimesContainer.id = getArrivalTimesId(stop);
    arrivalTimesContainer.innerHTML = '<div class="loading">Loading arrivals...</div>';
    stopContainer.appendChild(arrivalTimesContainer);
    
    // Error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.id = `error-${stop.stopId}`;
    errorContainer.style.display = 'none';
    stopContainer.appendChild(errorContainer);
    
    resultsContainer.appendChild(stopContainer);
  });
}

/**
 * Generates a unique ID for the arrival times container
 * @param {Object} stop - The stop object
 * @returns {string} - The unique ID
 */
function getArrivalTimesId(stop) {
  return stop.line 
    ? `arrivalTimes-${stop.stopId}-${stop.line}` 
    : `arrivalTimes-${stop.stopId}-`;
}

/**
 * Fetches transit data for all stops
 */
async function fetchAllTransitData() {
  state.isLoading = true;
  state.errors.clear();
  updateLastUpdatedTime();
  
  // Get all stops with stopId
  const stopsWithId = stopsAndLabels.filter(stop => stop.stopId);
  
  // Fetch data for each stop
  const fetchPromises = stopsWithId.map(stop => fetchTransitData(stop));
  
  try {
    await Promise.allSettled(fetchPromises);
  } catch (err) {
    console.error('Error fetching transit data:', err);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Fetches transit data for a specific stop
 * @param {Object} stop - The stop object with stopId and optional line
 */
async function fetchTransitData(stop) {
  if (!stop.stopId) return;

  const stopId = stop.stopId;
  const line = stop.line || null;
  const arrivalTimesContainer = document.getElementById(getArrivalTimesId(stop));
  const errorContainer = document.getElementById(`error-${stopId}`);
  
  try {
    arrivalTimesContainer.innerHTML = '<div class="loading">Loading arrivals...</div>';
    errorContainer.style.display = 'none';
    
    // Fetch data from our server proxy (which protects the API key)
    const response = await fetch(`/api/transit?stopCode=${stopId}&agency=${config.agency}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Process the XML response
    const arrivals = processXmlResponse(xmlDoc, line);
    
    // Update the UI with arrivals
    updateArrivalsUI(arrivalTimesContainer, arrivals);
    
  } catch (error) {
    console.error(`Error fetching data for stop ${stopId}:`, error);
    displayError(stopId, error.message);
  }
}

/**
 * Processes the XML response from the API
 * @param {Document} xmlDoc - The XML document from the API
 * @param {string|null} filterLine - Optional line to filter by
 * @returns {Array} - Array of arrival objects
 */
function processXmlResponse(xmlDoc, filterLine = null) {
  const arrivals = [];
  const monitoredStopVisits = xmlDoc.querySelectorAll('MonitoredStopVisit');
  
  monitoredStopVisits.forEach(visitNode => {
    try {
      const lineRef = visitNode.querySelector('LineRef')?.textContent;
      
      // Skip if we have a filter line and this doesn't match
      if (filterLine && lineRef !== filterLine) return;
      
      const arrivalTimeNode = visitNode.querySelector('ExpectedArrivalTime');
      if (!arrivalTimeNode || !arrivalTimeNode.textContent) return;
      
      const expectedArrivalTime = arrivalTimeNode.textContent;
      const minutesAway = calculateMinutesAway(expectedArrivalTime);
      const formattedTime = formatArrivalTime(minutesAway);
      
      // Add to arrivals array
      arrivals.push({
        lineRef,
        minutesAway,
        formattedTime,
        originalTime: expectedArrivalTime
      });
    } catch (err) {
      console.error('Error processing visit node:', err);
    }
  });
  
  // Sort by minutes away
  arrivals.sort((a, b) => a.minutesAway - b.minutesAway);
  
  // Limit to max number of arrivals
  return arrivals.slice(0, config.maxArrivalsToShow);
}

/**
 * Updates the UI with arrivals data
 * @param {HTMLElement} container - The container element
 * @param {Array} arrivals - Array of arrival objects
 */
function updateArrivalsUI(container, arrivals) {
  if (!arrivals.length) {
    container.innerHTML = '<div class="empty-message">No upcoming arrivals found</div>';
    return;
  }
  
  // Clear the container
  container.innerHTML = '';
  
  // Add each arrival to the UI
  arrivals.forEach(arrival => {
    const arrivalElement = document.createElement('div');
    arrivalElement.className = 'arrival';
    arrivalElement.innerHTML = `
      <span class="away">${arrival.minutesAway}m</span>
      <span class="time">${arrival.formattedTime}</span>
    `;
    container.appendChild(arrivalElement);
  });
}

/**
 * Calculates how many minutes away a time is
 * @param {string} arrivalTimeString - ISO timestamp string
 * @returns {number} - Minutes away (absolute value)
 */
function calculateMinutesAway(arrivalTimeString) {
  const arrivalTime = new Date(arrivalTimeString);
  const now = new Date();
  const diffInMilliseconds = arrivalTime - now;
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  return Math.abs(diffInMinutes); // Use absolute value
}

/**
 * Formats arrival time to HH:MM format
 * @param {number} minutesAway - Minutes until arrival
 * @returns {string} - Formatted time string
 */
function formatArrivalTime(minutesAway) {
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + (minutesAway * 60 * 1000));
  
  return arrivalTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).toLowerCase();
}

/**
 * Updates the last updated time in the UI
 */
function updateLastUpdatedTime() {
  state.lastUpdated = new Date();
  const lastUpdatedElement = document.getElementById('last-updated');
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = `Last updated: ${formatUpdateTime(state.lastUpdated)}`;
  }
}

/**
 * Formats the update time
 * @param {Date} date - The date to format
 * @returns {string} - Formatted time string
 */
function formatUpdateTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Displays an error message for a specific stop
 * @param {number} stopId - The stop ID
 * @param {string} message - The error message
 */
function displayError(stopId, message) {
  const errorContainer = document.getElementById(`error-${stopId}`);
  if (errorContainer) {
    errorContainer.textContent = `Error: ${message}`;
    errorContainer.style.display = 'block';
  }
  
  // Also update the arrivals container to show no loading spinner
  const arrivalContainers = document.querySelectorAll(`[id^="arrivalTimes-${stopId}"]`);
  arrivalContainers.forEach(container => {
    if (container.querySelector('.loading')) {
      container.innerHTML = '<div class="empty-message">Unable to load arrivals</div>';
    }
  });
  
  // Store the error
  state.errors.set(stopId, message);
}

/**
 * Starts the auto-refresh timer
 */
function startAutoRefresh() {
  // Clear any existing timer
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }
  
  // Start a new timer
  state.refreshTimer = setInterval(() => {
    fetchAllTransitData();
  }, config.refreshInterval);
}

/**
 * Handles manual refresh button click
 */
function handleManualRefresh() {
  if (state.isLoading) return;
  
  fetchAllTransitData();
  
  // Visual feedback for button click
  const button = document.getElementById('refresh-button');
  button.classList.add('clicked');
  setTimeout(() => {
    button.classList.remove('clicked');
  }, 300);
}

/**
 * Shows the API key setup instructions
 */
function showSetupInstructions() {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = `
    <div class="setup-instructions">
      <h2>Setup Instructions</h2>
      <ol>
        <li>Request an API key at <a href="https://511.org/open-data/token" target="_blank">511.org/open-data/token</a></li>
        <li>Create a file named <code>.env</code> based on <code>.env.example</code></li>
        <li>Add your API key to the <code>.env</code> file</li>
        <li>Update the stops and lines in <code>js/app.js</code></li>
        <li>Restart the server</li>
      </ol>
    </div>
  `;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 