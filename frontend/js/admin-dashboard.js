// Admin Dashboard JavaScript

// Check if user is logged in and has admin role
const currentUser = checkAuth();
if (currentUser && currentUser.role !== 'admin') {
    // Redirect to appropriate dashboard based on role
    if (currentUser.role === 'circuit') {
        window.location.href = 'circuit-dashboard.html';
    } else if (currentUser.role === 'magisterial') {
        window.location.href = 'magisterial-dashboard.html';
    }
}

// Set current user name in the header
document.getElementById('currentUserName').textContent = currentUser ? currentUser.name : 'Admin';

// Handle logout
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('logoutLink').addEventListener('click', logout);

// Handle refresh button
document.getElementById('refresh-btn').addEventListener('click', function() {
    // Get the currently active page
    const activePage = document.querySelector('.page[style*="block"]');
    const activeMenuItem = document.querySelector('.menu-item.active');
    
    if (activePage && activeMenuItem) {
        const pageId = activePage.id;
        
        // Reload data based on current page
        if (pageId === 'dashboard-page') {
            loadDashboardData();
        } else if (pageId === 'circuit-courts-page') {
            loadCircuitCourts();
        } else if (pageId === 'magisterial-courts-page') {
            loadAllMagisterialCourts();
        } else if (pageId === 'total-staff-page') {
            loadTotalStaff();
        } else if (pageId === 'active-staff-page') {
            loadStaffByStatus('active');
        } else if (pageId === 'retired-staff-page') {
            loadStaffByStatus('retired');
        } else if (pageId === 'dismissed-staff-page') {
            loadStaffByStatus('dismissed');
        } else if (pageId === 'on-leave-staff-page') {
            loadStaffByStatus('on_leave');
        } else if (pageId === 'settings-page') {
            loadAdminSettings();
        }
        
        // Show refresh animation
        const refreshIcon = this.querySelector('i');
        refreshIcon.classList.add('fa-spin');
        setTimeout(() => {
            refreshIcon.classList.remove('fa-spin');
        }, 1000);
    }
});

// Navigation between pages
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

menuItems.forEach(item => {
    if (item.id !== 'logout') {
        item.addEventListener('click', function() {
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Hide all pages
            pages.forEach(page => page.style.display = 'none');
            
            // Show the selected page
            const pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).style.display = 'block';
            
            // Load data for the selected page
            if (pageId === 'circuit-courts-page') {
                loadCircuitCourts();
            } else if (pageId === 'magisterial-courts-page') {
                loadAllMagisterialCourts();
            } else if (pageId === 'total-staff-page') {
                loadTotalStaff();
            } else if (pageId === 'active-staff-page') {
                loadStaffByStatus('active');
            } else if (pageId === 'retired-staff-page') {
                loadStaffByStatus('retired');
            } else if (pageId === 'dismissed-staff-page') {
                loadStaffByStatus('dismissed');
            } else if (pageId === 'on-leave-staff-page') {
                loadStaffByStatus('on_leave');
            } else if (pageId === 'settings-page') {
                loadAdminSettings();
            } else if (pageId === 'recycle-bin-page') {
                loadRecycleBin();
            }
        });
    }
});

// Load dashboard data
function loadDashboardData() {
    // Get data from local storage
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Include ALL staff (both circuit and magisterial) for total count
    const allStaff = staffData;
    
    // Calculate total magisterial courts count
    let totalMagisterialCourts = 0;
    circuitCourts.forEach(circuit => {
        if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
            totalMagisterialCourts += circuit.magisterialCourts.length;
        }
    });
    
    // Update counts
    document.getElementById('circuit-count').textContent = circuitCourts.length;
    document.getElementById('magisterial-count').textContent = totalMagisterialCourts;
    document.getElementById('staff-count').textContent = allStaff.length;
    
    const activeStaff = allStaff.filter(staff => staff.employmentStatus === 'active');
    const retiredStaff = allStaff.filter(staff => staff.employmentStatus === 'retired');
    const dismissedStaff = allStaff.filter(staff => staff.employmentStatus === 'dismissed');
    const onLeaveStaff = allStaff.filter(staff => staff.employmentStatus === 'on_leave');
    
    document.getElementById('active-count').textContent = activeStaff.length;
    document.getElementById('retired-count').textContent = retiredStaff.length;
    document.getElementById('dismissed-count').textContent = dismissedStaff.length;
    document.getElementById('on-leave-count').textContent = onLeaveStaff.length;
    
    // Load recent updates
    loadRecentUpdates();
}

// Load recent staff updates
function loadRecentUpdates() {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const recentUpdatesBody = document.getElementById('recent-updates-body');
    
    // Clear existing rows
    recentUpdatesBody.innerHTML = '';
    
    // Include ALL staff (both circuit and magisterial) for recent updates
    const allStaff = staffData;
    
    // Sort by updated date (most recent first)
    const sortedStaff = [...allStaff].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return dateB - dateA;
    });
    
    // Get only the 5 most recent updates
    const recentStaff = sortedStaff.slice(0, 5);
    
    // Add rows to the table
    recentStaff.forEach(staff => {
        const row = document.createElement('tr');
        
        // Format date
        const updateDate = staff.updatedAt ? new Date(staff.updatedAt) : new Date(staff.createdAt);
        const formattedDate = updateDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Get court name
        const courtName = getCourtName(staff.courtId, staff.courtType);
        
        row.innerHTML = `
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${courtName}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td>${formattedDate}</td>
        `;
        
        recentUpdatesBody.appendChild(row);
    });
}

// Load circuit courts
function loadCircuitCourts() {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourtsContainer = document.getElementById('circuit-courts-container');
    
    // Clear existing cards
    circuitCourtsContainer.innerHTML = '';
    
    // Add cards for each circuit court
    circuitCourts.forEach(court => {
        const card = document.createElement('div');
        card.className = 'court-card';
        card.setAttribute('data-court-id', court.id);
        
        // Get staff count for this court
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'circuit');
        
        card.innerHTML = `
            <i class="fas fa-building"></i>
            <h3>${court.name}</h3>
            <p>Total Staff: ${courtStaff.length}</p>
            <div class="court-card-actions">
                <button class="btn btn-primary view-court-btn" data-court-id="${court.id}">View Details</button>
                <button class="btn btn-danger delete-circuit-court-btn" data-court-id="${court.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        circuitCourtsContainer.appendChild(card);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-court-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court-id'));
            viewCircuitCourtDetails(courtId);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-circuit-court-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court-id'));
            deleteCircuitCourt(courtId);
        });
    });
}

// View circuit court details
function viewCircuitCourtDetails(courtId) {
    // This would typically open a modal or navigate to a details page
    // For now, we'll just load the staff for this court
    loadStaffByCourt(courtId, 'circuit');
    
    // Switch to active staff page
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-page="active-staff"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById('active-staff-page').style.display = 'block';
}

// Load all magisterial courts
function loadAllMagisterialCourts() {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const magisterialCourtsContainer = document.getElementById('magisterial-courts-container');
    
    // Clear existing cards
    magisterialCourtsContainer.innerHTML = '';
    
    // Create a list of all magisterial courts from all circuit courts
    let allMagisterialCourts = [];
    
    circuitCourts.forEach(circuit => {
        if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
            // Add circuit court information to each magisterial court
            const magisterialCourtsWithCircuit = circuit.magisterialCourts.map(court => ({
                ...court,
                circuitCourtId: circuit.id,
                circuitCourtName: circuit.name
            }));
            
            allMagisterialCourts = [...allMagisterialCourts, ...magisterialCourtsWithCircuit];
        }
    });
    
    // Add cards for each magisterial court
    allMagisterialCourts.forEach(court => {
        const card = document.createElement('div');
        card.className = 'court-card';
        card.setAttribute('data-court-id', court.id);
        
        // Get staff count for this court
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
        
        card.innerHTML = `
            <i class="fas fa-landmark"></i>
            <h3>${court.name}</h3>
            <p>Circuit Court: ${court.circuitCourtName}</p>
            <p>Total Staff: ${courtStaff.length}</p>
            <div class="court-card-actions">
                <button class="btn btn-primary view-magisterial-court-btn" data-court-id="${court.id}">View Staff</button>
                <button class="btn btn-danger delete-magisterial-court-btn" data-court-id="${court.id}" data-circuit-id="${court.circuitCourtId}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        magisterialCourtsContainer.appendChild(card);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-magisterial-court-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court-id'));
            viewMagisterialCourtStaff(courtId);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-magisterial-court-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court-id'));
            const circuitId = parseInt(this.getAttribute('data-circuit-id'));
            deleteMagisterialCourt(courtId, circuitId);
        });
    });
}

// View magisterial court staff
function viewMagisterialCourtStaff(courtId) {
    // Load staff for this magisterial court
    loadStaffByCourt(courtId, 'magisterial');
    
    // Switch to active staff page
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-page="active-staff"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById('active-staff-page').style.display = 'block';
}

// Load staff by status
function loadStaffByStatus(status) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    // Include ALL staff (both circuit and magisterial) for status-based views
    const allStaff = staffData;
    const filteredStaff = allStaff.filter(staff => staff.employmentStatus === status);
    
    const tableBodyId = status.replace('_', '-') + '-staff-body';
    const tableBody = document.getElementById(tableBodyId);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort staff by creation order (ID)
    const sortedStaff = [...filteredStaff].sort((a, b) => a.id - b.id);
    
    // Add rows to the table
    sortedStaff.forEach((staff, index) => {
        const row = document.createElement('tr');
        
        // Get court name
        const courtName = getCourtName(staff.courtId, staff.courtType);
        
        // Create row content based on status
        let rowContent = `
            <td>${index + 1}</td>
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${courtName}</td>
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
        `;
        
        // Add additional columns based on status
        if (status === 'retired') {
            rowContent += `<td>${formatDate(staff.retirementDate)}</td>`;
        } else if (status === 'dismissed') {
            rowContent += `<td>${formatDate(staff.dismissalDate)}</td>`;
        } else if (status === 'on_leave') {
            rowContent += `<td>${formatDate(staff.leaveStartDate || staff.updatedAt)}</td>`;
        }
        
        // Add action buttons
        rowContent += `
            <td class="action-buttons">
                <button class="btn btn-primary view-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            viewStaffDetails(staffId);
        });
    });
}

// Load staff by court
function loadStaffByCourt(courtId, courtType) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const filteredStaff = staffData.filter(staff => staff.courtId === courtId && staff.courtType === courtType && staff.employmentStatus === 'active');
    
    const tableBody = document.getElementById('active-staff-body');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows to the table
    filteredStaff.forEach(staff => {
        const row = document.createElement('tr');
        
        // Get court name
        const courtName = getCourtName(staff.courtId, staff.courtType);
        
        row.innerHTML = `
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${courtName}</td>
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td class="action-buttons">
                <button class="btn btn-primary view-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            viewStaffDetails(staffId);
        });
    });
}

// View staff details
function viewStaffDetails(staffId) {
    // This would typically open a modal with staff details
    // For now, we'll just log the staff ID
    console.log('View staff details for ID:', staffId);
    
    // In a real implementation, you would fetch the staff details and display them in a modal
}

// Load admin settings
function loadAdminSettings() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const adminUser = users.find(user => user.role === 'admin');
    
    if (adminUser) {
        document.getElementById('admin-username').value = adminUser.username;
        document.getElementById('admin-name').value = adminUser.name;
    }
    
    // Load current logo
    loadCurrentLogo();
}

function loadCurrentLogo() {
    const logoData = localStorage.getItem('systemLogo');
    const logoPreview = document.getElementById('logo-preview');
    const noLogoText = document.getElementById('no-logo-text');
    
    if (logoData) {
        logoPreview.src = logoData;
        logoPreview.style.display = 'block';
        noLogoText.style.display = 'none';
        
        // Update logos throughout the system
        updateSystemLogos(logoData);
    } else {
        logoPreview.style.display = 'none';
        noLogoText.style.display = 'block';
    }
}

function updateSystemLogos(logoData) {
    // Update sidebar logo if it exists
    const sidebarLogo = document.querySelector('.sidebar-header i');
    if (sidebarLogo && logoData) {
        // Create img element to replace the icon
        const logoImg = document.createElement('img');
        logoImg.src = logoData;
        logoImg.style.width = '32px';
        logoImg.style.height = '32px';
        logoImg.style.objectFit = 'contain';
        sidebarLogo.parentNode.replaceChild(logoImg, sidebarLogo);
    }
}

// Helper function to get court name
function getCourtName(courtId, courtType) {
    if (courtType === 'circuit') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const court = circuitCourts.find(c => c.id === courtId);
        return court ? court.name : 'Unknown Court';
    } else if (courtType === 'magisterial') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        
        for (const circuit of circuitCourts) {
            if (circuit.magisterialCourts) {
                const magisterial = circuit.magisterialCourts.find(m => m.id === courtId);
                if (magisterial) {
                    return magisterial.name;
                }
            }
        }
        
        return 'Unknown Court';
    }
    
    return 'Unknown Court';
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Add Circuit Court Modal
const addCircuitCourtModal = document.getElementById('add-circuit-court-modal');
const addCircuitCourtBtn = document.getElementById('add-circuit-court-btn');
const closeModalBtn = document.querySelector('.close');

// Open modal
addCircuitCourtBtn.addEventListener('click', function() {
    addCircuitCourtModal.style.display = 'block';
});

// Close modal
closeModalBtn.addEventListener('click', function() {
    addCircuitCourtModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === addCircuitCourtModal) {
        addCircuitCourtModal.style.display = 'none';
    }
});

// Handle add circuit court form submission
document.getElementById('add-circuit-court-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const courtName = document.getElementById('court-name').value;
    const location = document.getElementById('court-location').value;
    const username = document.getElementById('court-username').value;
    const password = document.getElementById('court-password').value;
    const confirmPassword = document.getElementById('court-confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        // Create circuit court account
        const courtData = {
            name: courtName,
            location: location,
            username: username,
            password: password
        };
        
        const result = await createCircuitCourtAccount(courtData);
        
        if (result.success) {
            alert(result.message || 'Circuit court created successfully!');
            addCircuitCourtModal.style.display = 'none';
            
            // Reset form
            this.reset();
            
            // Reload circuit courts
            loadCircuitCourts();
            
            // Reload dashboard data
            loadDashboardData();
        } else {
            alert(result.message || 'Failed to create circuit court');
        }
    } catch (error) {
        console.error('Error creating circuit court:', error);
        alert(error.message || 'An error occurred while creating the circuit court');
    }
});

// Handle settings form submission
document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const name = document.getElementById('admin-name').value;
    const password = document.getElementById('admin-password').value;
    const confirmPassword = document.getElementById('admin-confirm-password').value;
    
    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Update admin user
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const adminIndex = users.findIndex(user => user.role === 'admin');
    
    if (adminIndex !== -1) {
        users[adminIndex].username = username;
        users[adminIndex].name = name;
        
        if (password) {
            users[adminIndex].password = password;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user in session storage
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        currentUser.username = username;
        currentUser.name = name;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update display name in header
        document.getElementById('currentUserName').textContent = name;
        
        alert('Settings updated successfully');
    }
});

// Handle logo file upload preview
document.getElementById('logo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('logo-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Handle logo form submission
document.getElementById('logo-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('logo-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a logo file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const logoData = e.target.result;
        
        // Save logo to localStorage
        localStorage.setItem('systemLogo', logoData);
        
        // Update all logos on the page
        updateSystemLogos(logoData);
        
        alert('Logo updated successfully');
        
        // Reset form
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
});

// Handle remove logo
document.getElementById('remove-logo-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to remove the current logo?')) {
        // Remove logo from localStorage
        localStorage.removeItem('systemLogo');
        
        // Reset to default logo
        const defaultLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM0NjZGRiIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVIMjJWMjVIMThWMTVIMTVMMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
        updateSystemLogos(defaultLogo);
        
        // Update preview
        const preview = document.getElementById('logo-preview');
        preview.src = defaultLogo;
        
        alert('Logo removed successfully');
    }
});

// Export staff data
function exportStaffData(status) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    let filteredStaff = [];
    
    if (status) {
        filteredStaff = staffData.filter(staff => staff.employmentStatus === status);
    } else {
        filteredStaff = staffData;
    }
    
    // Convert to CSV
    let csv = 'Name,Position,Court,Contact,Education,Status\n';
    
    filteredStaff.forEach(staff => {
        const courtName = getCourtName(staff.courtId, staff.courtType);
        csv += `"${staff.name}","${staff.position}","${courtName}","${staff.contact}","${staff.education}","${staff.employmentStatus}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${status || 'all'}_staff.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Export circuit courts
function exportCircuitCourts() {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    
    // Convert to CSV
    let csv = 'Court Name,Total Staff\n';
    
    circuitCourts.forEach(court => {
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'circuit');
        csv += `"${court.name}",${courtStaff.length}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'circuit_courts.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Export magisterial courts
function exportMagisterialCourts() {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    
    // Create a list of all magisterial courts from all circuit courts
    let allMagisterialCourts = [];
    
    circuitCourts.forEach(circuit => {
        if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
            // Add circuit court information to each magisterial court
            const magisterialCourtsWithCircuit = circuit.magisterialCourts.map(court => ({
                ...court,
                circuitCourtId: circuit.id,
                circuitCourtName: circuit.name
            }));
            
            allMagisterialCourts = [...allMagisterialCourts, ...magisterialCourtsWithCircuit];
        }
    });
    
    // Convert to CSV
    let csv = 'Court Name,Circuit Court,Total Staff\n';
    
    allMagisterialCourts.forEach(court => {
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
        csv += `"${court.name}","${court.circuitCourtName}",${courtStaff.length}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'magisterial_courts.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Print staff data
function printStaffData(status) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    let filteredStaff = [];
    
    if (status) {
        filteredStaff = staffData.filter(staff => staff.employmentStatus === status);
    } else {
        filteredStaff = staffData;
    }
    
    // Create a printable version
    let printContent = `
        <html>
        <head>
            <title>Staff Report - ${status || 'All'} Staff</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; color: #2c3e50; }
                .status { padding: 5px 10px; border-radius: 20px; font-size: 14px; }
                .status-active { background-color: #e8f7ef; color: #2ecc71; }
                .status-retired { background-color: #fef5e7; color: #f39c12; }
                .status-dismissed { background-color: #fdedeb; color: #e74c3c; }
                .print-header { display: flex; justify-content: space-between; align-items: center; }
                .print-date { font-size: 14px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Judiciary Staff Management System</h1>
                <div class="print-date">Printed on: ${new Date().toLocaleDateString()}</div>
            </div>
            <h2>${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Staff Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Court</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredStaff.forEach(staff => {
        const courtName = getCourtName(staff.courtId, staff.courtType);
        printContent += `
            <tr>
                <td>${staff.name}</td>
                <td>${staff.position}</td>
                <td>${courtName}</td>
                <td>${staff.contact}</td>
                <td>${staff.education}</td>
                <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            </tr>
        `;
    });
    
    printContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Export format modal variables
let currentExportType = null;
let currentExportData = null;
const exportFormatModal = document.getElementById('export-format-modal');

// Add event listeners for export and print buttons
document.getElementById('export-active-staff-btn').addEventListener('click', function() {
    showExportFormatModal('active-staff');
});

document.getElementById('export-retired-staff-btn').addEventListener('click', function() {
    showExportFormatModal('retired-staff');
});

document.getElementById('export-dismissed-staff-btn').addEventListener('click', function() {
    showExportFormatModal('dismissed-staff');
});

document.getElementById('export-on-leave-staff-btn').addEventListener('click', function() {
    showExportFormatModal('on-leave-staff');
});

document.getElementById('export-courts-btn').addEventListener('click', function() {
    showExportFormatModal('circuit-courts');
});

document.getElementById('export-magisterial-courts-btn').addEventListener('click', function() {
    showExportFormatModal('magisterial-courts');
});

document.getElementById('print-active-staff-btn').addEventListener('click', function() {
    printStaffData('active');
});

document.getElementById('print-retired-staff-btn').addEventListener('click', function() {
    printStaffData('retired');
});

document.getElementById('print-dismissed-staff-btn').addEventListener('click', function() {
    printStaffData('dismissed');
});

document.getElementById('print-on-leave-staff-btn').addEventListener('click', function() {
    printStaffData('on_leave');
});

document.getElementById('export-total-staff-btn').addEventListener('click', function() {
    showExportFormatModal('total-staff');
});

document.getElementById('print-total-staff-btn').addEventListener('click', function() {
    printTotalStaff();
});

// Load total staff from all courts with filtering
function loadTotalStaff(courtTypeFilter = 'all', courtFilter = 'all') {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tableBody = document.getElementById('total-staff-body');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Apply filters
    let filteredStaff = [...staffData];
    
    if (courtTypeFilter !== 'all') {
        filteredStaff = filteredStaff.filter(staff => staff.courtType === courtTypeFilter);
    }
    
    if (courtFilter !== 'all') {
        filteredStaff = filteredStaff.filter(staff => staff.courtId === parseInt(courtFilter));
    }
    
    // Sort filtered staff by creation order (ID)
    const sortedStaff = filteredStaff.sort((a, b) => a.id - b.id);
    
    // Add rows to the table
    sortedStaff.forEach((staff, index) => {
        const row = document.createElement('tr');
        
        // Get court name
        const courtName = getCourtName(staff.courtId, staff.courtType);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${courtName}</td>
            <td>${staff.contact || 'N/A'}</td>
            <td>${staff.education || 'N/A'}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td class="action-buttons">
                <button class="btn-edit" data-staff-id="${staff.id}" title="Edit Staff">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-staff-id="${staff.id}" title="Delete Staff">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            openEditStaffModal(staffId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            deleteStaff(staffId);
        });
    });
}

// Export total staff data
function exportTotalStaff() {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    if (staffData.length === 0) {
        alert('No staff data to export');
        return;
    }
    
    // Sort staff by name
    const sortedStaff = [...staffData].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create CSV content
    let csvContent = 'No.,Name,Position,Court,Contact,Education,Status\n';
    
    sortedStaff.forEach((staff, index) => {
        const courtName = getCourtName(staff.courtId, staff.courtType);
        csvContent += `${index + 1},"${staff.name}","${staff.position}","${courtName}","${staff.contact}","${staff.education}","${staff.employmentStatus}"\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'total_staff_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Print total staff data
function printTotalStaff() {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    if (staffData.length === 0) {
        alert('No staff data to print');
        return;
    }
    
    // Sort staff by name
    const sortedStaff = [...staffData].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create print content
    let printContent = `
        <html>
        <head>
            <title>Total Staff Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .status { padding: 4px 8px; border-radius: 4px; color: white; }
                .status-active { background-color: #27ae60; }
                .status-retired { background-color: #f39c12; }
                .status-dismissed { background-color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1>Total Staff Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Court</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    sortedStaff.forEach((staff, index) => {
        const courtName = getCourtName(staff.courtId, staff.courtType);
        printContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${staff.name}</td>
                <td>${staff.position}</td>
                <td>${courtName}</td>
                <td>${staff.contact}</td>
                <td>${staff.education}</td>
                <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            </tr>
        `;
    });
    
    printContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Modal elements will be initialized in DOMContentLoaded
let addStaffModal, addStaffBtn, addStaffForm, staffCourtTypeSelect, staffCourtSelect;
let editStaffModal, editStaffForm, editStaffCourtTypeSelect, editStaffCourtSelect, cancelEditBtn;
let addMagisterialCourtModal, addMagisterialCourtBtn, addMagisterialCourtForm, magisterialCourtCircuitSelect;

// Event listeners moved to DOMContentLoaded

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === addStaffModal) {
        addStaffModal.style.display = 'none';
    } else if (event.target === addMagisterialCourtModal) {
        addMagisterialCourtModal.style.display = 'none';
    }
});

// Event listeners will be initialized in DOMContentLoaded

// Form submission handlers moved to DOMContentLoaded

// Populate court selects
function populateCourtSelects() {
    // Reset court type and court selects
    staffCourtTypeSelect.value = '';
    staffCourtSelect.innerHTML = '<option value="">Select Court</option>';
}

// Populate circuit courts for magisterial court creation
function populateCircuitCourts() {
    magisterialCourtCircuitSelect.innerHTML = '<option value="">Select Circuit Court</option>';
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    circuitCourts.forEach(court => {
        const option = document.createElement('option');
        option.value = court.id;
        option.textContent = court.name;
        magisterialCourtCircuitSelect.appendChild(option);
    });
}

// Add staff form submission moved to DOMContentLoaded

// Add magisterial court form submission moved to DOMContentLoaded

// Filter functionality
const courtTypeFilter = document.getElementById('court-type-filter');
const courtFilter = document.getElementById('court-filter');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

// Populate court filter based on court type selection
courtTypeFilter.addEventListener('change', function() {
    const courtType = this.value;
    courtFilter.innerHTML = '<option value="all">All Courts</option>';
    
    if (courtType === 'circuit') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        circuitCourts.forEach(court => {
            const option = document.createElement('option');
            option.value = court.id;
            option.textContent = court.name;
            courtFilter.appendChild(option);
        });
    } else if (courtType === 'magisterial') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        circuitCourts.forEach(circuit => {
            if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
                circuit.magisterialCourts.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} (${circuit.name})`;
                    courtFilter.appendChild(option);
                });
            }
        });
    }
    
    // Apply filters
    applyStaffFilters();
});

// Apply filters when court filter changes
courtFilter.addEventListener('change', applyStaffFilters);

// Clear all filters
clearFiltersBtn.addEventListener('click', function() {
    courtTypeFilter.value = 'all';
    courtFilter.innerHTML = '<option value="all">All Courts</option>';
    courtFilter.value = 'all';
    applyStaffFilters();
});

// Apply staff filters
function applyStaffFilters() {
    const courtTypeValue = courtTypeFilter.value;
    const courtValue = courtFilter.value;
    loadTotalStaff(courtTypeValue, courtValue);
}

// Open edit staff modal
function openEditStaffModal(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staff = staffData.find(s => s.id === staffId);
    
    if (!staff) {
        alert('Staff member not found');
        return;
    }
    
    // Populate form fields
    document.getElementById('edit-staff-id').value = staff.id;
    document.getElementById('edit-staff-name').value = staff.name;
    document.getElementById('edit-staff-position').value = staff.position;
    document.getElementById('edit-staff-court-type').value = staff.courtType;
    document.getElementById('edit-staff-phone').value = staff.contact || '';
    document.getElementById('edit-staff-email').value = staff.email || '';
    document.getElementById('edit-staff-education').value = staff.education || '';
    document.getElementById('edit-staff-employment-status').value = staff.employmentStatus || '';
    
    // Populate court dropdown based on court type
    const editCourtSelect = document.getElementById('edit-staff-court');
    editCourtSelect.innerHTML = '<option value="">Select Court</option>';
    
    if (staff.courtType === 'circuit') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        circuitCourts.forEach(court => {
            const option = document.createElement('option');
            option.value = court.id;
            option.textContent = court.name;
            if (court.id === staff.courtId) option.selected = true;
            editCourtSelect.appendChild(option);
        });
    } else if (staff.courtType === 'magisterial') {
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        circuitCourts.forEach(circuit => {
            if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
                circuit.magisterialCourts.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} (${circuit.name})`;
                    if (court.id === staff.courtId) option.selected = true;
                    editCourtSelect.appendChild(option);
                });
            }
        });
    }
    
    // Show modal
    document.getElementById('edit-staff-modal').style.display = 'block';
}

// Delete staff function
function deleteStaff(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staff = staffData.find(s => s.id === staffId);
    
    if (!staff) {
        alert('Staff member not found');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) {
        const updatedStaffData = staffData.filter(s => s.id !== staffId);
        localStorage.setItem('staffData', JSON.stringify(updatedStaffData));
        
        // Refresh the current view
        applyStaffFilters();
        loadDashboardData();
        
        alert('Staff member deleted successfully!');
    }
}

// Note: addStaffMember function is now defined in auth.js and uses API calls

// Show export format modal
function showExportFormatModal(exportType) {
    currentExportType = exportType;
    exportFormatModal.style.display = 'block';
}

// Close export format modal
exportFormatModal.addEventListener('click', (e) => {
    if (e.target === exportFormatModal || e.target.classList.contains('close')) {
        exportFormatModal.style.display = 'none';
    }
});

// Handle export format selection
document.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const format = this.getAttribute('data-format');
        exportFormatModal.style.display = 'none';
        handleExport(currentExportType, format);
    });
});

// Handle different export types and formats
function handleExport(exportType, format) {
    switch(exportType) {
        case 'active-staff':
            exportStaffDataWithFormat('active', format);
            break;
        case 'retired-staff':
            exportStaffDataWithFormat('retired', format);
            break;
        case 'dismissed-staff':
            exportStaffDataWithFormat('dismissed', format);
            break;
        case 'on-leave-staff':
            exportStaffDataWithFormat('on_leave', format);
            break;
        case 'total-staff':
            exportTotalStaffWithFormat(format);
            break;
        case 'circuit-courts':
            exportCircuitCourtsWithFormat(format);
            break;
        case 'magisterial-courts':
            exportMagisterialCourtsWithFormat(format);
            break;
    }
}

// Export staff data with format selection
function exportStaffDataWithFormat(status, format) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    let filteredStaff = [];
    
    if (status) {
        filteredStaff = staffData.filter(staff => staff.employmentStatus === status);
    } else {
        filteredStaff = staffData;
    }
    
    const fileName = `${status || 'all'}_staff`;
    
    switch(format) {
        case 'excel':
            exportToExcel(filteredStaff, fileName, 'staff');
            break;
        case 'word':
            exportToWord(filteredStaff, fileName, 'staff');
            break;
        case 'pdf':
            exportToPDF(filteredStaff, fileName, 'staff');
            break;
    }
}

// Export total staff with format selection
function exportTotalStaffWithFormat(format) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    if (staffData.length === 0) {
        alert('No staff data to export');
        return;
    }
    
    const sortedStaff = [...staffData].sort((a, b) => a.name.localeCompare(b.name));
    const fileName = 'total_staff_data';
    
    switch(format) {
        case 'excel':
            exportToExcel(sortedStaff, fileName, 'staff');
            break;
        case 'word':
            exportToWord(sortedStaff, fileName, 'staff');
            break;
        case 'pdf':
            exportToPDF(sortedStaff, fileName, 'staff');
            break;
    }
}

// Export circuit courts with format selection
function exportCircuitCourtsWithFormat(format) {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const fileName = 'circuit_courts';
    
    switch(format) {
        case 'excel':
            exportToExcel(circuitCourts, fileName, 'courts');
            break;
        case 'word':
            exportToWord(circuitCourts, fileName, 'courts');
            break;
        case 'pdf':
            exportToPDF(circuitCourts, fileName, 'courts');
            break;
    }
}

// Export magisterial courts with format selection
function exportMagisterialCourtsWithFormat(format) {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    let magisterialCourts = [];
    
    circuitCourts.forEach(circuit => {
        if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
            circuit.magisterialCourts.forEach(court => {
                magisterialCourts.push({
                    ...court,
                    parentCircuit: circuit.name
                });
            });
        }
    });
    
    const fileName = 'magisterial_courts';
    
    switch(format) {
        case 'excel':
            exportToExcel(magisterialCourts, fileName, 'magisterial-courts');
            break;
        case 'word':
            exportToWord(magisterialCourts, fileName, 'magisterial-courts');
            break;
        case 'pdf':
            exportToPDF(magisterialCourts, fileName, 'magisterial-courts');
            break;
    }
}

// Export to Excel format (CSV for now, can be enhanced with libraries)
function exportToExcel(data, fileName, dataType) {
    let csvContent = '';
    
    if (dataType === 'staff') {
        csvContent = 'No.,Name,Position,Court,Contact,Education,Status\n';
        data.forEach((item, index) => {
            const courtName = getCourtName(item.courtId, item.courtType);
            csvContent += `${index + 1},"${item.name}","${item.position}","${courtName}","${item.contact || item.phone || ''}","${item.education}","${item.employmentStatus}"\n`;
        });
    } else if (dataType === 'courts') {
        csvContent = 'Court Name,Total Staff\n';
        data.forEach(court => {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'circuit');
            csvContent += `"${court.name}",${courtStaff.length}\n`;
        });
    } else if (dataType === 'magisterial-courts') {
        csvContent = 'Court Name,Parent Circuit,Total Staff\n';
        data.forEach(court => {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
            csvContent += `"${court.name}","${court.parentCircuit}",${courtStaff.length}\n`;
        });
    }
    
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
}

// Export to Word format (HTML for now)
function exportToWord(data, fileName, dataType) {
    let htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f8f9fa; color: #2c3e50; }
                .header { text-align: center; margin-bottom: 30px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Judiciary Staff Management System</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
    `;
    
    if (dataType === 'staff') {
        htmlContent += `
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Court</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.forEach((item, index) => {
            const courtName = getCourtName(item.courtId, item.courtType);
            htmlContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.position}</td>
                        <td>${courtName}</td>
                        <td>${item.contact || item.phone || ''}</td>
                        <td>${item.education}</td>
                        <td>${item.employmentStatus}</td>
                    </tr>
            `;
        });
    }
    
    htmlContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    downloadFile(htmlContent, `${fileName}.html`, 'text/html');
}

// Export to PDF format (HTML for now, can be enhanced with PDF libraries)
function exportToPDF(data, fileName, dataType) {
    // For now, we'll create an HTML file that can be printed to PDF
    // In a real application, you would use a PDF library like jsPDF
    exportToWord(data, fileName + '_pdf', dataType);
    alert('HTML file generated. Please open it in your browser and use Print > Save as PDF to create a PDF file.');
}

// Download file helper function
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Delete circuit court function (move to recycle bin)
function deleteCircuitCourt(courtId) {
    if (!confirm('Are you sure you want to move this circuit court to recycle bin? All associated magisterial courts and staff will also be moved to recycle bin.')) {
        return;
    }

    // Find the court to delete
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const courtToDelete = circuitCourts.find(court => court.id === courtId);
    
    if (courtToDelete) {
        // Add deletion timestamp
        courtToDelete.deletedAt = new Date().toISOString();
        
        // Move associated magisterial courts to recycle bin first
        const associatedMagisterialCourts = courtToDelete.magisterialCourts || [];
        
        if (associatedMagisterialCourts.length > 0) {
            const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
            associatedMagisterialCourts.forEach(court => {
                court.deletedAt = new Date().toISOString();
                court.circuitCourtId = courtId;
                court.circuitCourtName = courtToDelete.name;
                deletedMagisterialCourts.push(court);
            });
            localStorage.setItem('deletedMagisterialCourts', JSON.stringify(deletedMagisterialCourts));
        }
        
        // Move associated staff to recycle bin
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const associatedStaff = staffData.filter(staff => 
            (staff.courtId === courtId && staff.courtType === 'circuit') ||
            associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial')
        );
        
        if (associatedStaff.length > 0) {
            const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
            associatedStaff.forEach(staff => {
                staff.deletedAt = new Date().toISOString();
                deletedStaff.push(staff);
            });
            localStorage.setItem('deletedStaff', JSON.stringify(deletedStaff));
            
            // Remove from active staff
            const updatedStaffData = staffData.filter(staff => 
                !((staff.courtId === courtId && staff.courtType === 'circuit') ||
                associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial'))
            );
            localStorage.setItem('staffData', JSON.stringify(updatedStaffData));
        }
        
        // Move circuit court to recycle bin
        const deletedCircuitCourts = JSON.parse(localStorage.getItem('deletedCircuitCourts')) || [];
        deletedCircuitCourts.push(courtToDelete);
        localStorage.setItem('deletedCircuitCourts', JSON.stringify(deletedCircuitCourts));
        
        // Remove from active courts
        const updatedCircuitCourts = circuitCourts.filter(court => court.id !== courtId);
        localStorage.setItem('circuitCourts', JSON.stringify(updatedCircuitCourts));
        
        // Remove associated user accounts
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.filter(user => 
            !((user.role === 'circuit' && user.courtId === courtId) ||
            associatedMagisterialCourts.some(magCourt => user.role === 'magisterial' && user.courtId === magCourt.id))
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Reload displays
        loadCircuitCourts();
        loadAllMagisterialCourts();
        
        alert(`Circuit court and ${associatedMagisterialCourts.length} magisterial courts with ${associatedStaff.length} staff members moved to recycle bin successfully.`);
    }
}

// Delete magisterial court function (move to recycle bin)
function deleteMagisterialCourt(courtId, circuitId) {
    if (!confirm('Are you sure you want to move this magisterial court to recycle bin? All assigned staff will also be moved to recycle bin.')) {
        return;
    }

    // Find the circuit court and the magisterial court to delete
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(circuit => circuit.id === circuitId);
    
    if (circuitCourt && circuitCourt.magisterialCourts) {
        const courtToDelete = circuitCourt.magisterialCourts.find(court => court.id === courtId);
        
        if (courtToDelete) {
            // Add deletion timestamp
            courtToDelete.deletedAt = new Date().toISOString();
            courtToDelete.circuitCourtId = circuitId;
            courtToDelete.circuitCourtName = circuitCourt.name;
            
            // Move associated staff to recycle bin
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const associatedStaff = staffData.filter(staff => staff.courtId === courtId && staff.courtType === 'magisterial');
            
            if (associatedStaff.length > 0) {
                const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
                associatedStaff.forEach(staff => {
                    staff.deletedAt = new Date().toISOString();
                    deletedStaff.push(staff);
                });
                localStorage.setItem('deletedStaff', JSON.stringify(deletedStaff));
                
                // Remove from active staff
                const updatedStaffData = staffData.filter(staff => !(staff.courtId === courtId && staff.courtType === 'magisterial'));
                localStorage.setItem('staffData', JSON.stringify(updatedStaffData));
            }
            
            // Move magisterial court to recycle bin
            const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
            deletedMagisterialCourts.push(courtToDelete);
            localStorage.setItem('deletedMagisterialCourts', JSON.stringify(deletedMagisterialCourts));
            
            // Remove from circuit court's magisterial courts array
            circuitCourt.magisterialCourts = circuitCourt.magisterialCourts.filter(court => court.id !== courtId);
            localStorage.setItem('circuitCourts', JSON.stringify(circuitCourts));
            
            // Remove associated user account if exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const updatedUsers = users.filter(user => !(user.role === 'magisterial' && user.courtId === courtId));
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Reload the magisterial courts display
            loadAllMagisterialCourts();
            
            alert(`Magisterial court with ${associatedStaff.length} staff members moved to recycle bin successfully.`);
        }
    }
}

// Recycle Bin Functions
function loadRecycleBin() {
    loadDeletedCircuitCourts();
    loadDeletedMagisterialCourts();
}

function loadDeletedCircuitCourts() {
    const deletedCircuitCourts = JSON.parse(localStorage.getItem('deletedCircuitCourts')) || [];
    const container = document.getElementById('deleted-circuit-courts-container');
    
    if (deletedCircuitCourts.length === 0) {
        container.innerHTML = '<p class="no-data">No deleted circuit courts in recycle bin.</p>';
        return;
    }
    
    container.innerHTML = deletedCircuitCourts.map(court => `
        <div class="court-card deleted-court-card">
            <h3>${court.name}</h3>
            <p><strong>Location:</strong> ${court.location}</p>
            <p><strong>Deleted:</strong> ${formatDate(court.deletedAt)}</p>
            <div class="court-card-actions">
                <button class="btn btn-success restore-btn" onclick="restoreCircuitCourt('${court.id}')">
                    <i class="fas fa-undo"></i> Restore
                </button>
                <button class="btn btn-danger permanent-delete-btn" onclick="permanentlyDeleteCircuitCourt('${court.id}')">
                    <i class="fas fa-trash-alt"></i> Delete Permanently
                </button>
            </div>
        </div>
    `).join('');
}

function loadDeletedMagisterialCourts() {
    const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
    const container = document.getElementById('deleted-magisterial-courts-container');
    
    if (deletedMagisterialCourts.length === 0) {
        container.innerHTML = '<p class="no-data">No deleted magisterial courts in recycle bin.</p>';
        return;
    }
    
    container.innerHTML = deletedMagisterialCourts.map(court => `
        <div class="court-card deleted-court-card">
            <h3>${court.name}</h3>
            <p><strong>Location:</strong> ${court.location}</p>
            <p><strong>Circuit Court:</strong> ${getCourtName(court.circuitCourtId, 'circuit')}</p>
            <p><strong>Deleted:</strong> ${formatDate(court.deletedAt)}</p>
            <div class="court-card-actions">
                <button class="btn btn-success restore-btn" onclick="restoreMagisterialCourt('${court.id}')">
                    <i class="fas fa-undo"></i> Restore
                </button>
                <button class="btn btn-danger permanent-delete-btn" onclick="permanentlyDeleteMagisterialCourt('${court.id}')">
                    <i class="fas fa-trash-alt"></i> Delete Permanently
                </button>
            </div>
        </div>
    `).join('');
}

function restoreCircuitCourt(courtId) {
    if (!confirm('Are you sure you want to restore this circuit court? All associated magisterial courts and staff will also be restored.')) {
        return;
    }
    
    const deletedCircuitCourts = JSON.parse(localStorage.getItem('deletedCircuitCourts')) || [];
    const courtToRestore = deletedCircuitCourts.find(court => court.id === courtId);
    
    if (courtToRestore) {
        // Remove deletion timestamp
        delete courtToRestore.deletedAt;
        
        // Restore associated magisterial courts
        const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
        const associatedMagisterialCourts = deletedMagisterialCourts.filter(court => court.circuitCourtId === courtId);
        
        if (associatedMagisterialCourts.length > 0) {
            const magisterialCourts = JSON.parse(localStorage.getItem('magisterialCourts')) || [];
            associatedMagisterialCourts.forEach(court => {
                delete court.deletedAt;
                magisterialCourts.push(court);
            });
            localStorage.setItem('magisterialCourts', JSON.stringify(magisterialCourts));
            
            // Remove from deleted magisterial courts
            const updatedDeletedMagisterialCourts = deletedMagisterialCourts.filter(court => court.circuitCourtId !== courtId);
            localStorage.setItem('deletedMagisterialCourts', JSON.stringify(updatedDeletedMagisterialCourts));
        }
        
        // Restore associated staff
        const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
        const associatedStaff = deletedStaff.filter(staff => 
            (staff.courtId === courtId && staff.courtType === 'circuit') ||
            associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial')
        );
        
        if (associatedStaff.length > 0) {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            associatedStaff.forEach(staff => {
                delete staff.deletedAt;
                staffData.push(staff);
            });
            localStorage.setItem('staffData', JSON.stringify(staffData));
            
            // Remove from deleted staff
            const updatedDeletedStaff = deletedStaff.filter(staff => 
                !((staff.courtId === courtId && staff.courtType === 'circuit') ||
                associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial'))
            );
            localStorage.setItem('deletedStaff', JSON.stringify(updatedDeletedStaff));
        }
        
        // Move circuit court back to active courts
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        circuitCourts.push(courtToRestore);
        localStorage.setItem('circuitCourts', JSON.stringify(circuitCourts));
        
        // Remove from recycle bin
        const updatedDeletedCourts = deletedCircuitCourts.filter(court => court.id !== courtId);
        localStorage.setItem('deletedCircuitCourts', JSON.stringify(updatedDeletedCourts));
        
        // Reload displays
        loadRecycleBin();
        loadCircuitCourts();
        loadAllMagisterialCourts();
        
        alert(`Circuit court and ${associatedMagisterialCourts.length} magisterial courts with ${associatedStaff.length} staff members restored successfully.`);
    }
}

function restoreMagisterialCourt(courtId) {
    if (!confirm('Are you sure you want to restore this magisterial court? All associated staff will also be restored.')) {
        return;
    }
    
    const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
    const courtToRestore = deletedMagisterialCourts.find(court => court.id === courtId);
    
    if (courtToRestore) {
        // Check if the parent circuit court still exists
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const parentCircuitCourt = circuitCourts.find(court => court.id === courtToRestore.circuitCourtId);
        
        if (!parentCircuitCourt) {
            alert('Cannot restore this magisterial court because its parent circuit court no longer exists.');
            return;
        }
        
        // Remove deletion timestamp
        delete courtToRestore.deletedAt;
        
        // Restore associated staff
        const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
        const associatedStaff = deletedStaff.filter(staff => staff.courtId === courtId && staff.courtType === 'magisterial');
        
        if (associatedStaff.length > 0) {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            associatedStaff.forEach(staff => {
                delete staff.deletedAt;
                staffData.push(staff);
            });
            localStorage.setItem('staffData', JSON.stringify(staffData));
            
            // Remove from deleted staff
            const updatedDeletedStaff = deletedStaff.filter(staff => !(staff.courtId === courtId && staff.courtType === 'magisterial'));
            localStorage.setItem('deletedStaff', JSON.stringify(updatedDeletedStaff));
        }
        
        // Move back to active courts
        const magisterialCourts = JSON.parse(localStorage.getItem('magisterialCourts')) || [];
        magisterialCourts.push(courtToRestore);
        localStorage.setItem('magisterialCourts', JSON.stringify(magisterialCourts));
        
        // Remove from recycle bin
        const updatedDeletedCourts = deletedMagisterialCourts.filter(court => court.id !== courtId);
        localStorage.setItem('deletedMagisterialCourts', JSON.stringify(updatedDeletedCourts));
        
        // Reload displays
        loadRecycleBin();
        loadAllMagisterialCourts();
        
        alert(`Magisterial court and ${associatedStaff.length} staff members restored successfully.`);
    }
}

function permanentlyDeleteCircuitCourt(courtId) {
    if (!confirm('Are you sure you want to permanently delete this circuit court? All associated magisterial courts and staff will also be permanently deleted. This action cannot be undone.')) {
        return;
    }
    
    // Permanently delete associated magisterial courts
    const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
    const associatedMagisterialCourts = deletedMagisterialCourts.filter(court => court.circuitCourtId === courtId);
    const updatedDeletedMagisterialCourts = deletedMagisterialCourts.filter(court => court.circuitCourtId !== courtId);
    localStorage.setItem('deletedMagisterialCourts', JSON.stringify(updatedDeletedMagisterialCourts));
    
    // Permanently delete associated staff
    const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
    const associatedStaff = deletedStaff.filter(staff => 
        (staff.courtId === courtId && staff.courtType === 'circuit') ||
        associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial')
    );
    const updatedDeletedStaff = deletedStaff.filter(staff => 
        !((staff.courtId === courtId && staff.courtType === 'circuit') ||
        associatedMagisterialCourts.some(magCourt => staff.courtId === magCourt.id && staff.courtType === 'magisterial'))
    );
    localStorage.setItem('deletedStaff', JSON.stringify(updatedDeletedStaff));
    
    // Permanently delete the circuit court
    const deletedCircuitCourts = JSON.parse(localStorage.getItem('deletedCircuitCourts')) || [];
    const updatedDeletedCourts = deletedCircuitCourts.filter(court => court.id !== courtId);
    localStorage.setItem('deletedCircuitCourts', JSON.stringify(updatedDeletedCourts));
    
    loadRecycleBin();
    alert(`Circuit court, ${associatedMagisterialCourts.length} magisterial courts, and ${associatedStaff.length} staff members permanently deleted.`);
}

function permanentlyDeleteMagisterialCourt(courtId) {
    if (!confirm('Are you sure you want to permanently delete this magisterial court? All associated staff will also be permanently deleted. This action cannot be undone.')) {
        return;
    }
    
    // Permanently delete associated staff
    const deletedStaff = JSON.parse(localStorage.getItem('deletedStaff')) || [];
    const associatedStaff = deletedStaff.filter(staff => staff.courtId === courtId && staff.courtType === 'magisterial');
    const updatedDeletedStaff = deletedStaff.filter(staff => !(staff.courtId === courtId && staff.courtType === 'magisterial'));
    localStorage.setItem('deletedStaff', JSON.stringify(updatedDeletedStaff));
    
    // Permanently delete the magisterial court
    const deletedMagisterialCourts = JSON.parse(localStorage.getItem('deletedMagisterialCourts')) || [];
    const updatedDeletedCourts = deletedMagisterialCourts.filter(court => court.id !== courtId);
    localStorage.setItem('deletedMagisterialCourts', JSON.stringify(updatedDeletedCourts));
    
    loadRecycleBin();
    alert(`Magisterial court and ${associatedStaff.length} staff members permanently deleted.`);
}

function emptyRecycleBin() {
    if (!confirm('Are you sure you want to empty the entire recycle bin? This will permanently delete all courts and staff and cannot be undone.')) {
        return;
    }
    
    localStorage.removeItem('deletedCircuitCourts');
    localStorage.removeItem('deletedMagisterialCourts');
    localStorage.removeItem('deletedStaff');
    
    loadRecycleBin();
    alert('Recycle bin emptied successfully.');
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (mobileMenuToggle && sidebar && mobileOverlay) {
        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            mobileOverlay.classList.toggle('active');
        });
        
        // Close menu when clicking overlay
        mobileOverlay.addEventListener('click', function() {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
        });
        
        // Close menu when clicking menu items on mobile
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 767) {
                    sidebar.classList.remove('mobile-open');
                    mobileOverlay.classList.remove('active');
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 767) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
            }
        });
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    addStaffModal = document.getElementById('add-staff-modal');
    addStaffBtn = document.getElementById('add-staff-btn');
    addStaffForm = document.getElementById('add-staff-form');
    staffCourtTypeSelect = document.getElementById('staff-court-type');
    staffCourtSelect = document.getElementById('staff-court');
    
    editStaffModal = document.getElementById('edit-staff-modal');
    editStaffForm = document.getElementById('edit-staff-form');
    editStaffCourtTypeSelect = document.getElementById('edit-staff-court-type');
    editStaffCourtSelect = document.getElementById('edit-staff-court');
    cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    addMagisterialCourtModal = document.getElementById('add-magisterial-court-modal');
    addMagisterialCourtBtn = document.getElementById('add-magisterial-court-btn');
    addMagisterialCourtForm = document.getElementById('add-magisterial-court-form');
    magisterialCourtCircuitSelect = document.getElementById('magisterial-court-circuit');
    
    // Initialize event listeners only if elements exist
    if (staffCourtTypeSelect) {
        staffCourtTypeSelect.addEventListener('change', function() {
            const courtType = this.value;
            staffCourtSelect.innerHTML = '<option value="">Select Court</option>';
            
            if (courtType === 'circuit') {
                const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
                circuitCourts.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = court.name;
                    staffCourtSelect.appendChild(option);
                });
            } else if (courtType === 'magisterial') {
                const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
                circuitCourts.forEach(circuit => {
                    if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
                        circuit.magisterialCourts.forEach(magCourt => {
                            const option = document.createElement('option');
                            option.value = magCourt.id;
                            option.textContent = `${magCourt.name} (${circuit.name})`;
                            staffCourtSelect.appendChild(option);
                        });
                    }
                });
            }
        });
    }
    
    if (editStaffCourtTypeSelect) {
        editStaffCourtTypeSelect.addEventListener('change', function() {
            const courtType = this.value;
            editStaffCourtSelect.innerHTML = '<option value="">Select Court</option>';
            
            if (courtType === 'circuit') {
                const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
                circuitCourts.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = court.name;
                    editStaffCourtSelect.appendChild(option);
                });
            } else if (courtType === 'magisterial') {
                const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
                circuitCourts.forEach(circuit => {
                    if (circuit.magisterialCourts && circuit.magisterialCourts.length > 0) {
                        circuit.magisterialCourts.forEach(magCourt => {
                            const option = document.createElement('option');
                            option.value = magCourt.id;
                            option.textContent = `${magCourt.name} (${circuit.name})`;
                            editStaffCourtSelect.appendChild(option);
                        });
                    }
                });
            }
        });
    }
    
    // Initialize other event listeners
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', function() {
            populateCourtSelects();
            addStaffModal.style.display = 'block';
        });
    }
    
    if (addMagisterialCourtBtn) {
        addMagisterialCourtBtn.addEventListener('click', function() {
            populateCircuitCourts();
            addMagisterialCourtModal.style.display = 'block';
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editStaffModal.style.display = 'none';
        });
    }
    
    if (editStaffModal) {
        editStaffModal.addEventListener('click', (e) => {
            if (e.target === editStaffModal) {
                editStaffModal.style.display = 'none';
            }
        });
    }
    
    // Close modals when clicking the close button
     document.querySelectorAll('.close').forEach(closeBtn => {
         closeBtn.addEventListener('click', function() {
             if (addStaffModal) addStaffModal.style.display = 'none';
             if (addMagisterialCourtModal) addMagisterialCourtModal.style.display = 'none';
         });
     });
     
     // Form submission event listeners
      if (editStaffForm) {
          editStaffForm.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              const staffId = parseInt(formData.get('edit-staff-id'));
              const updatedStaffData = {
                  id: staffId,
                  name: formData.get('edit-staff-name'),
                  position: formData.get('edit-staff-position'),
                  courtType: formData.get('edit-staff-court-type'),
                  courtId: parseInt(formData.get('edit-staff-court')),
                  phone: formData.get('edit-staff-phone'),
                  email: formData.get('edit-staff-email'),
                  education: formData.get('edit-staff-education'),
                  employmentStatus: formData.get('edit-staff-employment-status')
              };
              
              // Validate form data
              if (!updatedStaffData.name || !updatedStaffData.position || !updatedStaffData.courtType || 
                  !updatedStaffData.courtId || !updatedStaffData.education) {
                  alert('Please fill in all required fields.');
                  return;
              }
              
              // Update staff member
              const { id, ...updatedData } = updatedStaffData;
              try {
                  const result = await updateStaffMember(staffId, updatedData);
                  alert('Staff member updated successfully!');
                  editStaffModal.style.display = 'none';
                  // Refresh current page data
                  const activePage = document.querySelector('.page[style*="block"]');
                  if (activePage) {
                      if (activePage.id === 'total-staff-page') {
                          applyStaffFilters();
                      } else if (activePage.id === 'active-staff-page') {
                          loadStaffByStatus('active');
                      } else if (activePage.id === 'retired-staff-page') {
                          loadStaffByStatus('retired');
                      } else if (activePage.id === 'dismissed-staff-page') {
                          loadStaffByStatus('dismissed');
                      }
                  }
                  loadDashboardData(); // Refresh dashboard counts
              } catch (error) {
                  alert('Error updating staff member: ' + error.message);
              }
          });
      }
      
      if (addStaffForm) {
          addStaffForm.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              const staffData = {
                  name: formData.get('staff-name'),
                  position: formData.get('staff-position'),
                  courtType: formData.get('staff-court-type'),
                  courtId: parseInt(formData.get('staff-court')),
                  phone: formData.get('staff-phone'),
                  email: formData.get('staff-email'),
                  education: formData.get('staff-education'),
                  employmentStatus: formData.get('staff-employment-status')
              };
              
              // Validate form data
              if (!staffData.name || !staffData.position || !staffData.courtType || 
                  !staffData.courtId || !staffData.education) {
                  alert('Please fill in all required fields.');
                  return;
              }
              
              // Add staff member
              try {
                  const result = await addStaffMember(staffData);
                  alert('Staff member added successfully!');
                  addStaffModal.style.display = 'none';
                  addStaffForm.reset();
                  // Refresh current page data
                  const activePage = document.querySelector('.page[style*="block"]');
                  if (activePage && activePage.id === 'total-staff-page') {
                      loadTotalStaff();
                  }
                  loadDashboardData(); // Refresh dashboard counts
              } catch (error) {
                  alert('Error adding staff member: ' + error.message);
              }
          });
      }
      
      if (addMagisterialCourtForm) {
          addMagisterialCourtForm.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              const courtName = formData.get('magisterial-court-name');
              const username = formData.get('magisterial-court-username');
              const password = formData.get('magisterial-court-password');
              const confirmPassword = formData.get('magisterial-court-confirm-password');
              const circuitCourtId = formData.get('magisterial-court-circuit');
              
              // Validate form data
              if (!courtName || !username || !password || !confirmPassword || !circuitCourtId) {
                  alert('Please fill in all required fields.');
                  return;
              }
              
              if (password !== confirmPassword) {
                  alert('Passwords do not match.');
                  return;
              }
              
              // Validate password length
              if (password.length < 6) {
                  alert('Password must be at least 6 characters long.');
                  return;
              }
              
              // Create magisterial court
              try {
                  const result = await createMagisterialCourtAccount(parseInt(circuitCourtId), { name: courtName, username, password });
                  alert('Magisterial court created successfully!');
                  addMagisterialCourtModal.style.display = 'none';
                  addMagisterialCourtForm.reset();
                  // Refresh magisterial courts page if active
                  const activePage = document.querySelector('.page[style*="block"]');
                  if (activePage && activePage.id === 'magisterial-courts-page') {
                      loadAllMagisterialCourts();
                  }
                  loadDashboardData(); // Refresh dashboard counts
              } catch (error) {
                  alert('Error creating magisterial court: ' + error.message);
              }
          });
      }
    
    loadDashboardData();
    initializeMobileMenu();
});