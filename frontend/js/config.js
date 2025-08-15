// config.js - Single source of truth for API configuration

// Check if we're in a deployed environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    var API_BASE_URL = 'http://localhost:3000/api';
} else {
    // For deployed environments, use the Render backend URL
    var API_BASE_URL = 'https://judiciary-employee-backend.onrender.com/api';
}

// Also set as window property for compatibility
window.API_BASE_URL = API_BASE_URL;

console.log('API_BASE_URL configured:', API_BASE_URL);