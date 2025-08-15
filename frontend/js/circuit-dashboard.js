// Circuit Court Dashboard JavaScript

// Check if user is logged in and has circuit court role
const currentUser = checkAuth();
if (currentUser && currentUser.role !== 'circuit') {
    // Redirect to appropriate dashboard based on role
    if (currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (currentUser.role === 'magisterial') {
        window.location.href = 'magisterial-dashboard.html';
    }
}

// Set current user name in the header
document.getElementById('currentUserName').textContent = currentUser ? currentUser.name : 'Circuit Court';

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
        } else if (pageId === 'staff-management-page') {
            loadAllStaff();
        } else if (pageId === 'active-staff-page') {
            loadStaffByStatus('active');
        } else if (pageId === 'retired-staff-page') {
            loadStaffByStatus('retired');
        } else if (pageId === 'dismissed-staff-page') {
            loadStaffByStatus('dismissed');
        } else if (pageId === 'on-leave-staff-page') {
            loadStaffByStatus('on_leave');
        } else if (pageId === 'magisterial-courts-page') {
            loadMagisterialCourts();
        } else if (pageId === 'settings-page') {
            loadCircuitSettings();
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
            if (pageId === 'staff-management-page') {
                // Reset table header when returning to staff management
                const tableHeader = document.querySelector('#staff-management-page .table-header h2');
                tableHeader.textContent = 'Staff Management';
                // Reset dropdown to "All Staff"
                document.getElementById('staff-filter-select').value = 'all';
                // Populate dropdown with magisterial courts
                populateStaffFilterDropdown();
                loadAllStaff();
            } else if (pageId === 'magisterial-courts-page') {
                loadMagisterialCourts();
            } else if (pageId === 'total-staff-page') {
                loadTotalStaff();
            } else if (pageId === 'active-staff-page') {
                loadStaffByStatus('active');
            } else if (pageId === 'retired-staff-page') {
                loadStaffByStatus('retired');
            } else if (pageId === 'dismissed-staff-page') {
                loadStaffByStatus('dismissed');
            } else if (pageId === 'settings-page') {
                loadCourtSettings();
            }
        });
    }
});

// Get current circuit court ID
function getCurrentCircuitCourtId() {
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find the current user
    const user = users.find(u => u.id === currentUser.id);
    
    if (user) {
        // Find the circuit court with matching user ID
        const court = circuitCourts.find(c => c.userId === user.id);
        return court ? court.id : null;
    }
    
    return null;
}

// Load dashboard data
function loadDashboardData() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    // Get data from local storage
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Find the current circuit court
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (circuitCourt) {
        // Count magisterial courts
        const magisterialCourtsCount = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.length : 0;
        document.getElementById('magisterial-count').textContent = magisterialCourtsCount;
        
        // Count staff
        const circuitStaff = staffData.filter(staff => staff.courtId === circuitCourtId && staff.courtType === 'circuit');
        
        // Count staff in magisterial courts under this circuit
        let magisterialStaff = [];
        if (circuitCourt.magisterialCourts) {
            const magisterialCourtIds = circuitCourt.magisterialCourts.map(m => m.id);
            magisterialStaff = staffData.filter(staff => 
                staff.courtType === 'magisterial' && 
                magisterialCourtIds.includes(staff.courtId)
            );
        }
        
        // Total staff count
        const totalStaff = circuitStaff.length + magisterialStaff.length;
        document.getElementById('staff-count').textContent = totalStaff;
        
        // Count by status
        const allStaff = [...circuitStaff, ...magisterialStaff];
        const activeStaff = allStaff.filter(staff => staff.employmentStatus === 'active');
        const retiredStaff = allStaff.filter(staff => staff.employmentStatus === 'retired');
        const dismissedStaff = allStaff.filter(staff => staff.employmentStatus === 'dismissed');
        
        document.getElementById('active-count').textContent = activeStaff.length;
        document.getElementById('retired-count').textContent = retiredStaff.length;
        document.getElementById('dismissed-count').textContent = dismissedStaff.length;
        
        // Load recent updates
        loadRecentUpdates(circuitCourtId);
    }
}

// Load recent staff updates
function loadRecentUpdates(circuitCourtId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const recentUpdatesBody = document.getElementById('recent-updates-body');
    
    // Clear existing rows
    recentUpdatesBody.innerHTML = '';
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts
    const circuitStaff = staffData.filter(staff => staff.courtId === circuitCourtId && staff.courtType === 'circuit');
    const magisterialStaff = staffData.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId)
    );
    
    const allStaff = [...circuitStaff, ...magisterialStaff];
    
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

// Load all staff for the circuit court
function loadAllStaff() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staffManagementBody = document.getElementById('staff-management-body');
    
    // Clear existing rows
    staffManagementBody.innerHTML = '';
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts
    const circuitStaff = staffData.filter(staff => staff.courtId === circuitCourtId && staff.courtType === 'circuit');
    const magisterialStaff = staffData.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId)
    );
    
    const allStaff = [...circuitStaff, ...magisterialStaff];
    
    // Sort by creation order (ID)
    const sortedStaff = [...allStaff].sort((a, b) => a.id - b.id);
    
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
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td class="action-buttons">
                <button class="btn btn-primary edit-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        staffManagementBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            openEditStaffModal(staffId);
        });
    });
    
    document.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            if (confirm('Are you sure you want to delete this staff member?')) {
                deleteStaff(staffId);
            }
        });
    });
}

// Load magisterial courts
function loadMagisterialCourts() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const magisterialCourtsContainer = document.getElementById('magisterial-courts-container');
    
    // Clear existing cards
    magisterialCourtsContainer.innerHTML = '';
    
    // Find the current circuit court
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (circuitCourt && circuitCourt.magisterialCourts) {
        // Add cards for each magisterial court
        circuitCourt.magisterialCourts.forEach(court => {
            const card = document.createElement('div');
            card.className = 'court-card';
            card.setAttribute('data-court-id', court.id);
            
            // Get staff count for this court
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
            
            card.innerHTML = `
                <i class="fas fa-building"></i>
                <h3>${court.name}</h3>
                <p>Total Staff: ${courtStaff.length}</p>
                <button class="btn btn-primary view-court-btn" data-court-id="${court.id}">View Staff</button>
            `;
            
            magisterialCourtsContainer.appendChild(card);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-court-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courtId = parseInt(this.getAttribute('data-court-id'));
                viewMagisterialCourtStaff(courtId);
            });
        });
    }
}

// View magisterial court staff
function viewMagisterialCourtStaff(courtId) {
    // Load staff for this magisterial court
    loadStaffByCourt(courtId, 'magisterial');
    
    // Switch to staff management page
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-page="staff-management"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById('staff-management-page').style.display = 'block';
}

// Load staff by status
function loadStaffByStatus(status) {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const tableBodyId = status.replace('_', '-') + '-staff-body';
    const tableBody = document.getElementById(tableBodyId);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts with the specified status
    const circuitStaff = staffData.filter(staff => 
        staff.courtId === circuitCourtId && 
        staff.courtType === 'circuit' && 
        staff.employmentStatus === status
    );
    
    const magisterialStaff = staffData.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId) && 
        staff.employmentStatus === status
    );
    
    const filteredStaff = [...circuitStaff, ...magisterialStaff];
    
    // Sort by creation order (ID)
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
                <button class="btn btn-danger delete-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-trash"></i>
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
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            if (confirm('Are you sure you want to delete this staff member?')) {
                deleteStaff(staffId);
                // Reload the current status page after deletion
                loadStaffByStatus(status);
            }
        });
    });
}

// Load staff by court
function loadStaffByCourt(courtId, courtType) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Convert courtId to number for comparison (all court IDs are stored as numbers)
    const courtIdNum = parseInt(courtId);
    
    // Filter staff for this court and type
    const filteredStaff = staffData.filter(staff => 
        staff.courtId === courtIdNum && staff.courtType === courtType
    );
    
    const tableBody = document.getElementById('staff-management-body');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort by creation order (ID)
    const sortedStaff = [...filteredStaff].sort((a, b) => a.id - b.id);
    
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
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td class="action-buttons">
                <button class="btn btn-primary view-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-success edit-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-staff-btn" data-staff-id="${staff.id}">
                    <i class="fas fa-trash"></i>
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
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            openEditStaffModal(staffId);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            if (confirm('Are you sure you want to delete this staff member?')) {
                deleteStaff(staffId);
                // Reload the staff list for this court after deletion
                loadStaffByCourt(courtId, courtType);
            }
        });
    });
}

// View staff details
function viewStaffDetails(staffId) {
    // This would typically open a modal with staff details
    // For now, we'll just open the edit modal
    openEditStaffModal(staffId);
}

// Load total staff with filtering
function loadTotalStaff(courtTypeFilter = '', courtFilter = '') {
    const allStaff = JSON.parse(localStorage.getItem('staffData')) || [];
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts
    const circuitStaff = allStaff.filter(staff => 
        staff.courtId === circuitCourtId && 
        staff.courtType === 'circuit'
    );
    
    const magisterialStaff = allStaff.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId)
    );
    
    let filteredStaff = [...circuitStaff, ...magisterialStaff];
    
    // Apply court type filter
    if (courtTypeFilter && courtTypeFilter !== 'all' && courtTypeFilter !== '') {
        filteredStaff = filteredStaff.filter(staff => staff.courtType === courtTypeFilter);
    }
    
    // Apply specific court filter
    if (courtFilter && courtFilter !== 'all' && courtFilter !== '') {
        filteredStaff = filteredStaff.filter(staff => staff.courtId === courtFilter);
    }
    
    // Sort staff by creation order (ID)
    filteredStaff.sort((a, b) => a.id - b.id);
    
    const tableBody = document.getElementById('total-staff-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    filteredStaff.forEach((staff, index) => {
        const row = document.createElement('tr');
        
        const courtName = getCourtName(staff.courtId, staff.courtType);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${staff.name}</td>
            <td>${staff.position}</td>
            <td>${courtName}</td>
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td><span class="status-badge status-${staff.employmentStatus}">${staff.employmentStatus.charAt(0).toUpperCase() + staff.employmentStatus.slice(1)}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditStaffModal('${staff.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStaff('${staff.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Apply staff filters
function applyStaffFilters() {
    const courtTypeFilter = document.getElementById('court-type-filter').value;
    const courtFilter = document.getElementById('court-filter').value;
    
    loadTotalStaff(courtTypeFilter, courtFilter);
}

// Load court settings
function loadCourtSettings() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const courtUser = users.find(user => user.id === currentUser.id);
    
    if (courtUser) {
        document.getElementById('court-username').value = courtUser.username;
        document.getElementById('court-name').value = courtUser.name;
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

// Delete staff
function deleteStaff(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staffIndex = staffData.findIndex(staff => staff.id === staffId);
    
    if (staffIndex !== -1) {
        staffData.splice(staffIndex, 1);
        localStorage.setItem('staffData', JSON.stringify(staffData));
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
        
        alert('Staff member deleted successfully');
    }
}

// Add Staff Modal
const addStaffModal = document.getElementById('add-staff-modal');
const addStaffBtn = document.getElementById('add-staff-btn');
const closeStaffModalBtns = document.querySelectorAll('.close');

// Add Magisterial Court Modal
const addMagisterialCourtModal = document.getElementById('add-magisterial-court-modal');
const addMagisterialCourtBtn = document.getElementById('add-magisterial-court-btn');

// Edit Staff Modal
const editStaffModal = document.getElementById('edit-staff-modal');

// Open add staff modal
addStaffBtn.addEventListener('click', function() {
    // Populate court dropdown
    populateCourtDropdown('staff-court-type', 'staff-court');
    
    // Show modal
    addStaffModal.style.display = 'block';
});

// Open add magisterial court modal
addMagisterialCourtBtn.addEventListener('click', function() {
    addMagisterialCourtModal.style.display = 'block';
});

// Close modals
closeStaffModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        addStaffModal.style.display = 'none';
        addMagisterialCourtModal.style.display = 'none';
        editStaffModal.style.display = 'none';
    });
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === addStaffModal) {
        addStaffModal.style.display = 'none';
    } else if (event.target === addMagisterialCourtModal) {
        addMagisterialCourtModal.style.display = 'none';
    } else if (event.target === editStaffModal) {
        editStaffModal.style.display = 'none';
    }
});

// Populate court dropdown based on court type
function populateCourtDropdown(courtTypeId, courtId) {
    const courtType = document.getElementById(courtTypeId).value;
    const courtDropdown = document.getElementById(courtId);
    
    // Clear existing options
    courtDropdown.innerHTML = '';
    
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (courtType === 'circuit') {
        // Add circuit court option
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
        
        if (circuitCourt) {
            const option = document.createElement('option');
            option.value = circuitCourt.id;
            option.textContent = circuitCourt.name;
            courtDropdown.appendChild(option);
        }
    } else if (courtType === 'magisterial') {
        // Add magisterial court options
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
        
        if (circuitCourt && circuitCourt.magisterialCourts) {
            circuitCourt.magisterialCourts.forEach(court => {
                const option = document.createElement('option');
                option.value = court.id;
                option.textContent = court.name;
                courtDropdown.appendChild(option);
            });
        }
    }
}

// Handle court type change
document.getElementById('staff-court-type').addEventListener('change', function() {
    populateCourtDropdown('staff-court-type', 'staff-court');
});

document.getElementById('edit-staff-court-type').addEventListener('change', function() {
    populateCourtDropdown('edit-staff-court-type', 'edit-staff-court');
});

// Handle status change to show/hide date field
document.getElementById('staff-status').addEventListener('change', function() {
    const status = this.value;
    const dateContainer = document.getElementById('status-date-container');
    const dateLabel = document.getElementById('status-date-label');
    
    if (status === 'retired') {
        dateLabel.textContent = 'Retirement Date';
        dateContainer.style.display = 'block';
    } else if (status === 'dismissed') {
        dateLabel.textContent = 'Dismissal Date';
        dateContainer.style.display = 'block';
    } else {
        dateContainer.style.display = 'none';
    }
});

document.getElementById('edit-staff-status').addEventListener('change', function() {
    const status = this.value;
    const dateContainer = document.getElementById('edit-status-date-container');
    const dateLabel = document.getElementById('edit-status-date-label');
    
    if (status === 'retired') {
        dateLabel.textContent = 'Retirement Date';
        dateContainer.style.display = 'block';
    } else if (status === 'dismissed') {
        dateLabel.textContent = 'Dismissal Date';
        dateContainer.style.display = 'block';
    } else {
        dateContainer.style.display = 'none';
    }
});

// Handle add staff form submission
document.getElementById('add-staff-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('staff-name').value;
    const position = document.getElementById('staff-position').value;
    const courtType = document.getElementById('staff-court-type').value;
    const courtId = parseInt(document.getElementById('staff-court').value);
    const contact = document.getElementById('staff-contact').value;
    const education = document.getElementById('staff-education').value;
    const status = document.getElementById('staff-status').value;
    
    // Get date if status is retired or dismissed
    let statusDate = null;
    if (status === 'retired' || status === 'dismissed') {
        statusDate = document.getElementById('status-date').value;
    }
    
    // Create staff data object
    const staffData = {
        name,
        position,
        courtType,
        courtId,
        contact,
        education,
        employmentStatus: status
    };
    
    // Add date if provided
    if (statusDate) {
        if (status === 'retired') {
            staffData.retirementDate = statusDate;
        } else if (status === 'dismissed') {
            staffData.dismissalDate = statusDate;
        }
    }
    
    // Add staff member
    const result = addStaffMember(staffData);
    
    if (result.success) {
        alert(result.message);
        addStaffModal.style.display = 'none';
        
        // Reset form
        this.reset();
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
    } else {
        alert(result.message);
    }
});

// Handle add magisterial court form submission
document.getElementById('add-magisterial-court-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const courtName = document.getElementById('magisterial-court-name').value;
    const username = document.getElementById('magisterial-court-username').value;
    const password = document.getElementById('magisterial-court-password').value;
    const confirmPassword = document.getElementById('magisterial-court-confirm-password').value;
    
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
    
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        alert('Circuit court not found');
        return;
    }
    
    try {
        // Create magisterial court account
        const courtData = {
            name: courtName,
            username: username,
            password: password
        };
        
        const result = await createMagisterialCourtAccount(circuitCourtId, courtData);
        
        if (result.success) {
            alert(result.message || 'Magisterial court created successfully!');
            addMagisterialCourtModal.style.display = 'none';
            
            // Reset form
            this.reset();
            
            // Reload magisterial courts
            loadMagisterialCourts();
            
            // Reload dashboard data
            loadDashboardData();
        } else {
            alert(result.message || 'Failed to create magisterial court');
        }
    } catch (error) {
        console.error('Error creating magisterial court:', error);
        alert(error.message || 'An error occurred while creating the magisterial court');
    }
});

// Open edit staff modal
function openEditStaffModal(staffId) {
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staff = staffData.find(s => s.id === staffId);
    
    if (staff) {
        // Set form values
        document.getElementById('edit-staff-id').value = staff.id;
        document.getElementById('edit-staff-name').value = staff.name;
        document.getElementById('edit-staff-position').value = staff.position;
        document.getElementById('edit-staff-court-type').value = staff.courtType;
        
        // Populate court dropdown
        populateCourtDropdown('edit-staff-court-type', 'edit-staff-court');
        
        // Set court value
        document.getElementById('edit-staff-court').value = staff.courtId;
        
        document.getElementById('edit-staff-contact').value = staff.contact;
        document.getElementById('edit-staff-education').value = staff.education;
        document.getElementById('edit-staff-status').value = staff.employmentStatus;
        
        // Show/hide date field based on status
        const status = staff.employmentStatus;
        const dateContainer = document.getElementById('edit-status-date-container');
        const dateLabel = document.getElementById('edit-status-date-label');
        const dateField = document.getElementById('edit-status-date');
        
        if (status === 'retired') {
            dateLabel.textContent = 'Retirement Date';
            dateContainer.style.display = 'block';
            dateField.value = staff.retirementDate || '';
        } else if (status === 'dismissed') {
            dateLabel.textContent = 'Dismissal Date';
            dateContainer.style.display = 'block';
            dateField.value = staff.dismissalDate || '';
        } else {
            dateContainer.style.display = 'none';
        }
        
        // Show modal
        editStaffModal.style.display = 'block';
    }
}

// Handle edit staff form submission
document.getElementById('edit-staff-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const staffId = parseInt(document.getElementById('edit-staff-id').value);
    const name = document.getElementById('edit-staff-name').value;
    const position = document.getElementById('edit-staff-position').value;
    const courtType = document.getElementById('edit-staff-court-type').value;
    const courtId = parseInt(document.getElementById('edit-staff-court').value);
    const contact = document.getElementById('edit-staff-contact').value;
    const education = document.getElementById('edit-staff-education').value;
    const status = document.getElementById('edit-staff-status').value;
    
    // Get date if status is retired or dismissed
    let statusDate = null;
    if (status === 'retired' || status === 'dismissed') {
        statusDate = document.getElementById('edit-status-date').value;
    }
    
    // Create updated staff data object
    const updatedData = {
        name,
        position,
        courtType,
        courtId,
        contact,
        education,
        employmentStatus: status
    };
    
    // Add date if provided
    if (statusDate) {
        if (status === 'retired') {
            updatedData.retirementDate = statusDate;
        } else if (status === 'dismissed') {
            updatedData.dismissalDate = statusDate;
        }
    }
    
    // Update staff member
    const result = updateStaffMember(staffId, updatedData);
    
    if (result.success) {
        alert(result.message);
        editStaffModal.style.display = 'none';
        
        // Reload staff list
        loadAllStaff();
        
        // Reload dashboard data
        loadDashboardData();
    } else {
        alert(result.message);
    }
});

// Handle settings form submission
document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('court-username').value;
    const name = document.getElementById('court-name').value;
    const password = document.getElementById('court-password').value;
    const confirmPassword = document.getElementById('court-confirm-password').value;
    
    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Update court user
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].username = username;
        users[userIndex].name = name;
        
        if (password) {
            users[userIndex].password = password;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user in session storage
        const currentUserData = JSON.parse(sessionStorage.getItem('currentUser'));
        currentUserData.username = username;
        currentUserData.name = name;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUserData));
        
        // Update display name in header
        document.getElementById('currentUserName').textContent = name;
        
        // Update circuit court name
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const circuitCourtId = getCurrentCircuitCourtId();
        
        if (circuitCourtId) {
            const courtIndex = circuitCourts.findIndex(court => court.id === circuitCourtId);
            
            if (courtIndex !== -1) {
                circuitCourts[courtIndex].name = name;
                localStorage.setItem('circuitCourts', JSON.stringify(circuitCourts));
            }
        }
        
        alert('Settings updated successfully');
    }
});

// Export staff data
function exportStaffData(status) {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts
    const circuitStaff = staffData.filter(staff => staff.courtId === circuitCourtId && staff.courtType === 'circuit');
    const magisterialStaff = staffData.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId)
    );
    
    let filteredStaff = [...circuitStaff, ...magisterialStaff];
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
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

// Export magisterial courts
function exportMagisterialCourts() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt || !circuitCourt.magisterialCourts) {
        return;
    }
    
    // Convert to CSV
    let csv = 'Court Name,Total Staff\n';
    
    circuitCourt.magisterialCourts.forEach(court => {
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
        csv += `"${court.name}",${courtStaff.length}\n`;
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
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Get circuit court
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    
    if (!circuitCourt) {
        return;
    }
    
    // Get magisterial court IDs
    const magisterialCourtIds = circuitCourt.magisterialCourts ? circuitCourt.magisterialCourts.map(m => m.id) : [];
    
    // Filter staff for this circuit and its magisterial courts
    const circuitStaff = staffData.filter(staff => staff.courtId === circuitCourtId && staff.courtType === 'circuit');
    const magisterialStaff = staffData.filter(staff => 
        staff.courtType === 'magisterial' && 
        magisterialCourtIds.includes(staff.courtId)
    );
    
    let filteredStaff = [...circuitStaff, ...magisterialStaff];
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
    }
    
    // Create a printable version
    let printContent = `
        <html>
        <head>
            <title>Staff Report - ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Staff</title>
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
            <h2>${circuitCourt.name} - ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} Staff Report</h2>
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
    
    filteredStaff.forEach((staff, index) => {
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
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Export format modal variables
let currentExportType = null;
let currentExportData = null;
const exportFormatModal = document.getElementById('export-format-modal');

// Add event listeners for export and print buttons
document.getElementById('export-staff-btn').addEventListener('click', function() {
    showExportFormatModal('all-staff');
});

document.getElementById('export-active-staff-btn').addEventListener('click', function() {
    showExportFormatModal('active-staff');
});

document.getElementById('export-retired-staff-btn').addEventListener('click', function() {
    showExportFormatModal('retired-staff');
});

document.getElementById('export-dismissed-staff-btn').addEventListener('click', function() {
    showExportFormatModal('dismissed-staff');
});

document.getElementById('export-magisterial-courts-btn').addEventListener('click', function() {
    showExportFormatModal('magisterial-courts');
});

document.getElementById('print-staff-btn').addEventListener('click', function() {
    printStaffData();
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

// Add event listener for staff filter dropdown
document.getElementById('staff-filter-select').addEventListener('change', function() {
    const selectedValue = this.value;
    handleStaffFilter(selectedValue);
});

// Populate staff filter dropdown with magisterial courts
function populateStaffFilterDropdown() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        return;
    }
    
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
    const dropdown = document.getElementById('staff-filter-select');
    
    // Clear existing magisterial court options (keep All Staff and Circuit Staff)
    const existingOptions = dropdown.querySelectorAll('option[data-type="magisterial"]');
    existingOptions.forEach(option => option.remove());
    
    if (circuitCourt && circuitCourt.magisterialCourts) {
        circuitCourt.magisterialCourts.forEach(court => {
            const option = document.createElement('option');
            option.value = court.id;
            option.textContent = court.name;
            option.setAttribute('data-type', 'magisterial');
            dropdown.appendChild(option);
        });
    }
}

// Handle staff filter selection
function handleStaffFilter(filterValue) {
    const tableHeader = document.querySelector('#staff-management-page .table-header h2');
    

    
    if (filterValue === 'all') {
        tableHeader.textContent = 'Staff Management';
        loadAllStaff();
    } else if (filterValue === 'circuit') {
        tableHeader.textContent = 'Circuit Court Staff Only';
        loadCircuitStaffOnly();
    } else {
        // It's a magisterial court ID
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const circuitCourtId = getCurrentCircuitCourtId();
        const circuitCourt = circuitCourts.find(c => c.id === circuitCourtId);
        

        
        if (circuitCourt && circuitCourt.magisterialCourts) {
            // Convert filterValue to both string and number for comparison
            const filterValueStr = String(filterValue);
            const filterValueNum = parseInt(filterValue);
            
            const selectedCourt = circuitCourt.magisterialCourts.find(c => 
                c.id === filterValueNum
            );
            
            if (selectedCourt) {
                tableHeader.textContent = `${selectedCourt.name} Staff`;
                // Use the court's actual ID for filtering
                loadStaffByCourt(selectedCourt.id, 'magisterial');
            }
        }
    }
}

// Function to load only circuit court staff (excluding magisterial staff)
function loadCircuitStaffOnly() {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    const staffManagementBody = document.getElementById('staff-management-body');
    
    // Clear existing rows
    staffManagementBody.innerHTML = '';
    
    // Filter staff for this circuit court only (exclude magisterial staff)
    const circuitStaff = staffData.filter(staff => 
        staff.courtId === circuitCourtId && 
        staff.courtType === 'circuit'
    );
    
    // Sort by creation order (ID)
    const sortedStaff = [...circuitStaff].sort((a, b) => a.id - b.id);
    
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
            <td>${staff.contact}</td>
            <td>${staff.education}</td>
            <td><span class="status status-${staff.employmentStatus}">${staff.employmentStatus}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editStaff('${staff.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStaff('${staff.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        staffManagementBody.appendChild(row);
    });
    
    // Update table header to indicate filtered view
    const tableHeader = document.querySelector('#staff-management-page .table-header h2');
    tableHeader.textContent = 'Circuit Court Staff Only';
}

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
        case 'all-staff':
            exportStaffDataWithFormat(null, format);
            break;
        case 'active-staff':
            exportStaffDataWithFormat('active', format);
            break;
        case 'retired-staff':
            exportStaffDataWithFormat('retired', format);
            break;
        case 'dismissed-staff':
            exportStaffDataWithFormat('dismissed', format);
            break;
        case 'magisterial-courts':
            exportMagisterialCourtsWithFormat(format);
            break;
    }
}

// Export staff data with format selection
function exportStaffDataWithFormat(status, format) {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
    
    // Filter staff for this circuit court
    let filteredStaff = staffData.filter(staff => 
        staff.courtId === circuitCourtId && 
        staff.courtType === 'circuit'
    );
    
    // Filter by status if provided
    if (status) {
        filteredStaff = filteredStaff.filter(staff => staff.employmentStatus === status);
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

// Export magisterial courts with format selection
function exportMagisterialCourtsWithFormat(format) {
    const circuitCourtId = getCurrentCircuitCourtId();
    
    if (!circuitCourtId) {
        console.error('Circuit court not found');
        return;
    }
    
    const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
    const circuitCourt = circuitCourts.find(court => court.id === circuitCourtId);
    
    if (!circuitCourt || !circuitCourt.magisterialCourts) {
        console.error('Magisterial courts not found');
        return;
    }
    
    const fileName = 'magisterial_courts';
    
    switch(format) {
        case 'excel':
            exportToExcel(circuitCourt.magisterialCourts, fileName, 'magisterial-courts');
            break;
        case 'word':
            exportToWord(circuitCourt.magisterialCourts, fileName, 'magisterial-courts');
            break;
        case 'pdf':
            exportToPDF(circuitCourt.magisterialCourts, fileName, 'magisterial-courts');
            break;
    }
}

// Export to Excel (CSV format)
function exportToExcel(data, fileName, type) {
    let csv = '';
    
    if (type === 'staff') {
        csv = 'Name,Position,Contact,Education,Status\n';
        data.forEach(item => {
            csv += `"${item.name}","${item.position}","${item.contact}","${item.education}","${item.employmentStatus}"\n`;
        });
    } else if (type === 'magisterial-courts') {
        csv = 'Court Name,Total Staff\n';
        data.forEach(court => {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
            csv += `"${court.name}",${courtStaff.length}\n`;
        });
    }
    
    downloadFile(csv, `${fileName}.csv`, 'text/csv');
}

// Export to Word (HTML format)
function exportToWord(data, fileName, type) {
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${type === 'staff' ? 'Staff Report' : 'Magisterial Courts Report'}</h1>
            <table>
    `;
    
    if (type === 'staff') {
        html += `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.position}</td>
                        <td>${item.contact}</td>
                        <td>${item.education}</td>
                        <td>${item.employmentStatus}</td>
                    </tr>
            `;
        });
    } else if (type === 'magisterial-courts') {
        html += `
                <thead>
                    <tr>
                        <th>Court Name</th>
                        <th>Total Staff</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(court => {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
            html += `
                    <tr>
                        <td>${court.name}</td>
                        <td>${courtStaff.length}</td>
                    </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    downloadFile(html, `${fileName}.html`, 'text/html');
}

// Export to PDF (HTML with print instructions)
function exportToPDF(data, fileName, type) {
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .instructions { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                @media print { .instructions { display: none; } }
            </style>
        </head>
        <body>
            <div class="instructions">
                <strong>Instructions:</strong> To save as PDF, press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF" as the destination.
            </div>
            <h1>${type === 'staff' ? 'Staff Report' : 'Magisterial Courts Report'}</h1>
            <table>
    `;
    
    if (type === 'staff') {
        html += `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(item => {
            html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.position}</td>
                        <td>${item.contact}</td>
                        <td>${item.education}</td>
                        <td>${item.employmentStatus}</td>
                    </tr>
            `;
        });
    } else if (type === 'magisterial-courts') {
        html += `
                <thead>
                    <tr>
                        <th>Court Name</th>
                        <th>Total Staff</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(court => {
            const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
            const courtStaff = staffData.filter(staff => staff.courtId === court.id && staff.courtType === 'magisterial');
            html += `
                    <tr>
                        <td>${court.name}</td>
                        <td>${courtStaff.length}</td>
                    </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open in new window for PDF generation
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
}

// Helper function to download files
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Event listeners for filter controls
document.getElementById('court-type-filter').addEventListener('change', function() {
    const courtType = this.value;
    populateCourtFilterDropdown(courtType);
    applyStaffFilters();
});

document.getElementById('court-filter').addEventListener('change', function() {
    applyStaffFilters();
});

document.getElementById('clear-filters-btn').addEventListener('click', function() {
    document.getElementById('court-type-filter').value = 'all';
    document.getElementById('court-filter').value = 'all';
    populateCourtFilterDropdown('all');
    applyStaffFilters();
});

// Populate court filter dropdown based on court type
function populateCourtFilterDropdown(courtType) {
    const courtFilterSelect = document.getElementById('court-filter');
    const circuitCourtId = getCurrentCircuitCourtId();
    
    // Clear existing options except the first one
    courtFilterSelect.innerHTML = '<option value="">All Courts</option>';
    
    if (courtType === 'circuit') {
        // Add circuit court option
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const currentCircuit = circuitCourts.find(c => c.id === circuitCourtId);
        if (currentCircuit) {
            const option = document.createElement('option');
            option.value = currentCircuit.id;
            option.textContent = currentCircuit.name;
            courtFilterSelect.appendChild(option);
        }
    } else if (courtType === 'magisterial') {
        // Add magisterial court options
        const circuitCourts = JSON.parse(localStorage.getItem('circuitCourts')) || [];
        const currentCircuit = circuitCourts.find(c => c.id === circuitCourtId);
        
        if (currentCircuit && currentCircuit.magisterialCourts) {
            currentCircuit.magisterialCourts.forEach(court => {
                const option = document.createElement('option');
                option.value = court.id;
                option.textContent = court.name;
                courtFilterSelect.appendChild(option);
            });
        }
    }
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
    // Load dashboard data on page load
    loadDashboardData();
    
    // Populate staff filter dropdown
    populateStaffFilterDropdown();
    
    // Initialize mobile menu
    initializeMobileMenu();
});

// Initialize court filter dropdown
populateCourtFilterDropdown('all');