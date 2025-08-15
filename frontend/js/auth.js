// Authentication and User Management
// API Configuration
const API_BASE_URL = (() => {
    // Check if we're in a deployed environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // For deployed environments, use the Render backend URL
    return 'https://judiciary-employee-backend.onrender.com/api';
})();

// API Helper Functions
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: getAuthHeaders(),
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Legacy data for fallback (will be removed when fully integrated)
let users = [];
let circuitCourts = [];
let staffData = [];

// Sample staff data (in a real app, this would be stored in a database) - keeping for reference only
let sampleStaffData = [
    {
        id: 1,
        name: 'John Smith',
        position: 'Court Clerk',
        courtType: 'circuit',
        courtId: 1,
        phone: '555-0101',
        email: 'john.smith@court.gov',
        education: "Bachelor's Degree",
        employmentStatus: 'active',
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        position: 'Bailiff',
        courtType: 'circuit',
        courtId: 1,
        phone: '555-0102',
        email: 'sarah.johnson@court.gov',
        education: "Associate Degree",
        employmentStatus: 'active',
        createdAt: '2024-01-20T14:30:00.000Z'
    },
    {
        id: 3,
        name: 'Michael Brown',
        position: 'Court Reporter',
        courtType: 'magisterial',
        courtId: 3,
        phone: '555-0103',
        email: 'michael.brown@court.gov',
        education: "Bachelor's Degree",
        employmentStatus: 'retired',
        retirementDate: '2024-02-01',
        createdAt: '2023-05-10T09:15:00.000Z',
        updatedAt: '2024-02-01T16:00:00.000Z'
    },
    {
        id: 4,
        name: 'Emily Davis',
        position: 'Administrative Assistant',
        courtType: 'magisterial',
        courtId: 4,
        phone: '555-0104',
        email: 'emily.davis@court.gov',
        education: "High School",
        employmentStatus: 'active',
        createdAt: '2024-02-15T11:45:00.000Z'
    },
    {
        id: 5,
        name: 'Robert Wilson',
        position: 'Security Officer',
        courtType: 'circuit',
        courtId: 2,
        phone: '555-0105',
        email: 'robert.wilson@court.gov',
        education: "Associate Degree",
        employmentStatus: 'dismissed',
        dismissalDate: '2024-01-30',
        createdAt: '2023-08-01T08:00:00.000Z',
        updatedAt: '2024-01-30T17:30:00.000Z'
    }
];

// Legacy functions - no longer needed with API integration
// Keeping for backward compatibility during transition
function initializeLocalStorage() {
    // No longer needed - data comes from API
    console.log('Local storage initialization skipped - using API');
}

function resetSampleData() {
    // No longer needed - data managed by API
    console.log('Sample data reset skipped - using API');
    alert('Data is now managed by the backend API!');
}

// Initialize on page load
initializeLocalStorage();

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');
    const submitButton = this.querySelector('button[type="submit"]');
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    messageDiv.textContent = '';
    
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.success) {
            // Store authentication data
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // Redirect based on role
            switch(response.user.role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'circuit':
                    window.location.href = 'circuit-dashboard.html';
                    break;
                case 'magisterial':
                    window.location.href = 'magisterial-dashboard.html';
                    break;
                default:
                    throw new Error('Invalid user role');
            }
        }
    } catch (error) {
        messageDiv.textContent = error.message || 'Login failed. Please try again.';
        messageDiv.style.color = 'red';
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
});

// Function to check if user is logged in
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!token || !currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        // Verify token with server
        const response = await apiRequest('/auth/verify');
        if (response.success) {
            return currentUser;
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        logout();
        return null;
    }
}

// Logout function
async function logout() {
    try {
        // Call logout endpoint
        await apiRequest('/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout API call failed:', error);
    } finally {
        // Clear local storage regardless of API call result
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Function to create circuit court account (legacy wrapper)
async function createCircuitCourtAccount(courtData) {
    return await createCircuitCourt(courtData);
}

// Function to create magisterial court account (legacy wrapper)
async function createMagisterialCourtAccount(circuitCourtId, courtData) {
    return await createMagisterialCourt(circuitCourtId, courtData);
}

// Function to delete staff member
async function deleteStaffMember(staffId) {
    try {
        const response = await apiRequest(`/staff/${staffId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to delete staff member');
        }
    } catch (error) {
        console.error('Delete staff error:', error);
        throw error;
    }
}

// Function to get single staff member
async function getStaffMember(staffId) {
    try {
        const response = await apiRequest(`/staff/${staffId}`);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get staff member');
        }
    } catch (error) {
        console.error('Get staff member error:', error);
        throw error;
    }
}

// Function to change password
async function changePassword(currentPassword, newPassword) {
    try {
        const response = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
}

// Function to add a new staff member
async function addStaffMember(staffData) {
    try {
        const response = await apiRequest('/staff', {
            method: 'POST',
            body: JSON.stringify(staffData)
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to add staff member');
        }
    } catch (error) {
        console.error('Add staff member error:', error);
        throw error;
    }
}

// Function to update a staff member
async function updateStaffMember(staffId, updatedData) {
    try {
        const response = await apiRequest(`/staff/${staffId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to update staff member');
        }
    } catch (error) {
        console.error('Update staff member error:', error);
        throw error;
    }
}

// Function to get all staff
async function getAllStaff(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/staff?${queryParams}` : '/staff';
        
        const response = await apiRequest(endpoint);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get staff data');
        }
    } catch (error) {
        console.error('Get staff error:', error);
        throw error;
    }
}

// Function to get staff by court
async function getStaffByCourt(courtId, courtType) {
    try {
        const response = await apiRequest(`/staff/court/${courtType}/${courtId}`);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get staff by court');
        }
    } catch (error) {
        console.error('Get staff by court error:', error);
        throw error;
    }
}

// Function to get staff by employment status
async function getStaffByStatus(status) {
    try {
        const response = await apiRequest(`/staff/status/${status}`);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get staff by status');
        }
    } catch (error) {
        console.error('Get staff by status error:', error);
        throw error;
    }
}

// Function to get all circuit courts
async function getAllCircuitCourts() {
    try {
        const response = await apiRequest('/courts/circuit');
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get circuit courts');
        }
    } catch (error) {
        console.error('Get circuit courts error:', error);
        throw error;
    }
}

// Function to get magisterial courts for a specific circuit
async function getMagisterialCourts(circuitCourtId) {
    try {
        const response = await apiRequest(`/courts/circuit/${circuitCourtId}/magisterial`);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get magisterial courts');
        }
    } catch (error) {
        console.error('Get magisterial courts error:', error);
        throw error;
    }
}

// Function to get staff statistics
async function getStaffStats() {
    try {
        const response = await apiRequest('/staff/stats/overview');
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get staff statistics');
        }
    } catch (error) {
        console.error('Get staff stats error:', error);
        throw error;
    }
}

// Function to create circuit court
async function createCircuitCourt(courtData) {
    try {
        const response = await apiRequest('/courts/circuit', {
            method: 'POST',
            body: JSON.stringify(courtData)
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to create circuit court');
        }
    } catch (error) {
        console.error('Create circuit court error:', error);
        throw error;
    }
}

// Function to create magisterial court
async function createMagisterialCourt(circuitCourtId, courtData) {
    try {
        const response = await apiRequest(`/courts/circuit/${circuitCourtId}/magisterial`, {
            method: 'POST',
            body: JSON.stringify(courtData)
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to create magisterial court');
        }
    } catch (error) {
        console.error('Create magisterial court error:', error);
        throw error;
    }
}