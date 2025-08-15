// config.js - Single source of truth for API configuration
if (!window.API_BASE_URL) {
    // Check if we're in a deployed environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.API_BASE_URL = 'http://localhost:3000/api';
    } else {
        // For deployed environments, use the Render backend URL
        window.API_BASE_URL = 'https://judiciary-employee-backend.onrender.com/api';
    }
}